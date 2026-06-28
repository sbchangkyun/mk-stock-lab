/**
 * Phase 3DW owner-run production mobile geometry guard.
 *
 * Safety properties:
 * - public routes only; no authentication or credential entry
 * - disposable browser profile; no owner profile access
 * - numeric geometry plus short tag/id/class metadata only
 * - no response-body logging, raw markup capture, page copy collection, or images
 */

import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CANONICAL_ORIGIN = 'https://mkstocklab.vercel.app';
const LOCAL_ORIGINS = new Set([
  'http://localhost:4321',
  'http://127.0.0.1:4321',
]);
const PRODUCTION_GUARD = 'PHASE_3DW_ALLOW_PRODUCTION_GEOMETRY';
const LOCAL_GUARD = 'PHASE_3DW_ALLOW_LOCAL_GEOMETRY';
const TARGET_VARIABLE = 'PHASE_3DW_TARGET_ORIGIN';
const YES = 'YES';
const TOLERANCE = 2;
const ROUTES = ['/', '/chart-ai', '/market', '/lab', '/portfolio', '/mypage'];
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 430, height: 932 },
];
const LOGIN_TRIGGER = '#open-login-btn';
const LOGIN_MODAL = '#auth-modal';
const LOGIN_PANEL = '#auth-modal .modal-panel';
const LOAD_TIMEOUT_MS = 30_000;
const SETTLE_MS = 1_500;

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const targetOrigin = (process.env[TARGET_VARIABLE] || CANONICAL_ORIGIN).trim();
const isProduction = targetOrigin === CANONICAL_ORIGIN;
const isAllowedLocal = LOCAL_ORIGINS.has(targetOrigin);

const failConfiguration = (message) => {
  process.stderr.write(`Configuration rejected: ${message}\n`);
  process.exitCode = 1;
};

const printHeader = (mode) => {
  process.stdout.write('Phase 3DW Production Mobile Geometry Guard\n\n');
  process.stdout.write(`Target: ${targetOrigin}\n`);
  process.stdout.write(`Mode: ${mode}\n`);
  process.stdout.write('Sanitized: true\n\n');
};

const printPlan = () => {
  process.stdout.write('Dry-run only. No browser was launched and no network request was made.\n');
  process.stdout.write(`Set ${PRODUCTION_GUARD}=YES to run the canonical public production check.\n`);
  process.stdout.write(`Routes: ${ROUTES.join(', ')}\n`);
  process.stdout.write(`Viewports: ${VIEWPORTS.map(({ width, height }) => `${width}x${height}`).join(', ')}\n`);
  process.stdout.write('Additional state: public login modal opened without entering credentials\n');
  process.stdout.write('Planned checks: 21 route/state/viewport combinations\n');
  process.stdout.write('Collected data: numeric viewport/document/body geometry and short tag/id/class offender metadata only\n');
  process.stdout.write('Result: DRY_RUN\n');
};

const validateTarget = () => {
  let parsed;
  try {
    parsed = new URL(targetOrigin);
  } catch {
    failConfiguration(`${TARGET_VARIABLE} must be an absolute approved origin.`);
    return false;
  }

  if (parsed.origin !== targetOrigin || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    failConfiguration(`${TARGET_VARIABLE} must contain only an exact approved origin without a path, query, or fragment.`);
    return false;
  }

  if (!isProduction && !isAllowedLocal) {
    failConfiguration(`only ${CANONICAL_ORIGIN} or an explicitly guarded port-4321 local origin is allowed.`);
    return false;
  }

  if (isProduction && parsed.protocol !== 'https:') {
    failConfiguration('public checks require HTTPS.');
    return false;
  }

  if (isAllowedLocal && process.env[LOCAL_GUARD] !== YES) {
    failConfiguration(`${LOCAL_GUARD}=YES is required for an approved local origin.`);
    return false;
  }

  return true;
};

const commandOnPath = (command) => {
  const lookup = process.platform === 'win32' ? 'where.exe' : 'which';
  const result = spawnSync(lookup, [command], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) return null;
  return result.stdout.split(/\r?\n/).map((value) => value.trim()).find(Boolean) || null;
};

const browserCandidates = () => {
  const candidates = [];
  const explicit = process.env.PHASE_3DW_BROWSER_EXECUTABLE?.trim();
  if (explicit) candidates.push(explicit);

  if (process.platform === 'win32') {
    const roots = [
      process.env.ProgramFiles,
      process.env['ProgramFiles(x86)'],
      process.env.LOCALAPPDATA,
    ].filter(Boolean);
    for (const root of roots) {
      candidates.push(join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'));
      candidates.push(join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
    }
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
    candidates.push('/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge');
  }

  for (const command of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']) {
    const resolved = commandOnPath(command);
    if (resolved) candidates.push(resolved);
  }

  return [...new Set(candidates)].find((candidate) => existsSync(candidate)) || null;
};

const waitForDevToolsPort = async (profileDirectory, browserProcess) => {
  const portFile = join(profileDirectory, 'DevToolsActivePort');
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (browserProcess.exitCode !== null) throw new Error('browser-start-failed');
    try {
      const [port, websocketPath] = (await readFile(portFile, 'utf8')).trim().split(/\r?\n/);
      if (port && websocketPath) return { port: Number(port), websocketPath };
    } catch {
      // Chrome creates the file after its debugging endpoint is ready.
    }
    await delay(100);
  }
  throw new Error('browser-start-timeout');
};

class CdpClient {
  constructor(websocketUrl) {
    this.nextId = 1;
    this.pending = new Map();
    this.socket = new WebSocket(websocketUrl);
  }

  async connect() {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('cdp-connect-timeout')), 10_000);
      this.socket.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      this.socket.addEventListener('error', () => {
        clearTimeout(timer);
        reject(new Error('cdp-connect-failed'));
      }, { once: true });
    });

    this.socket.addEventListener('message', (event) => {
      let message;
      try {
        message = JSON.parse(String(event.data));
      } catch {
        return;
      }
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error('cdp-command-failed'));
      else pending.resolve(message.result || {});
    });

    this.socket.addEventListener('close', () => {
      for (const pending of this.pending.values()) pending.reject(new Error('cdp-closed'));
      this.pending.clear();
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

const createPageClient = async (port) => {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
  if (!response.ok) throw new Error('page-target-create-failed');
  const target = await response.json();
  if (!target.webSocketDebuggerUrl) throw new Error('page-target-missing');
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  return client;
};

const evaluate = async (client, expression) => {
  const response = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) throw new Error('page-evaluation-failed');
  return response.result?.value;
};

const waitForPageReady = async (client) => {
  const deadline = Date.now() + LOAD_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      if (await evaluate(client, 'document.readyState === "complete"')) return;
    } catch {
      // The execution context can be replaced while navigation is in progress.
    }
    await delay(100);
  }
  throw new Error('page-load-timeout');
};

const navigate = async (client, url) => {
  const response = await client.send('Page.navigate', { url });
  if (response.errorText) throw new Error('page-navigation-failed');
  await waitForPageReady(client);
  await delay(SETTLE_MS);
};

const geometryExpression = (includeModal = false) => `(() => {
  const root = document.documentElement;
  const body = document.body;
  const visual = window.visualViewport;
  const metrics = {
    innerWidth: Number(window.innerWidth),
    innerHeight: Number(window.innerHeight),
    documentClientWidth: Number(root?.clientWidth || 0),
    documentScrollWidth: Number(root?.scrollWidth || 0),
    bodyClientWidth: Number(body?.clientWidth || 0),
    bodyScrollWidth: Number(body?.scrollWidth || 0),
    visualViewportWidth: Number(visual?.width || window.innerWidth),
    visualViewportHeight: Number(visual?.height || window.innerHeight)
  };
  const limit = metrics.innerWidth + ${TOLERANCE};
  const widthPass = metrics.documentScrollWidth <= limit &&
    metrics.bodyScrollWidth <= limit &&
    metrics.documentClientWidth <= limit &&
    metrics.bodyClientWidth <= limit;
  const modalPanel = ${includeModal ? `document.querySelector('${LOGIN_PANEL}')` : 'null'};
  const modalPanelWidth = modalPanel ? Number(modalPanel.getBoundingClientRect().width.toFixed(2)) : null;
  const modalPass = ${includeModal ? 'modalPanelWidth !== null && modalPanelWidth <= limit' : 'true'};
  const offenders = [];
  if (!widthPass || !modalPass) {
    for (const element of document.querySelectorAll('*')) {
      const rect = element.getBoundingClientRect();
      if (!Number.isFinite(rect.width) || rect.width <= 0) continue;
      const overflow = Math.max(
        0,
        rect.right - metrics.innerWidth,
        -rect.left,
        rect.width - metrics.innerWidth,
        Number(element.scrollWidth || 0) - metrics.innerWidth,
        Number(element.clientWidth || 0) - metrics.innerWidth
      );
      if (overflow <= ${TOLERANCE}) continue;
      const rawClass = typeof element.className === 'string' ? element.className : '';
      offenders.push([Number(overflow.toFixed(2)), {
        tag: String(element.tagName || '').slice(0, 16),
        id: String(element.id || '').slice(0, 48),
        className: rawClass.replace(/\\s+/g, ' ').trim().slice(0, 96),
        left: Number(rect.left.toFixed(2)),
        right: Number(rect.right.toFixed(2)),
        width: Number(rect.width.toFixed(2)),
        scrollWidth: Number(element.scrollWidth || 0),
        clientWidth: Number(element.clientWidth || 0)
      }]);
    }
  }
  offenders.sort((left, right) => right[0] - left[0]);
  return {
    metrics,
    modalPanelWidth,
    pass: widthPass && modalPass,
    offenders: offenders.slice(0, 25).map(([, safe]) => safe)
  };
})()`;

const openLoginModal = async (client) => {
  const opened = await evaluate(client, `(() => {
    const trigger = document.querySelector('${LOGIN_TRIGGER}');
    if (!trigger) return false;
    trigger.click();
    const modal = document.querySelector('${LOGIN_MODAL}');
    return Boolean(modal && !modal.classList.contains('hidden'));
  })()`);
  if (!opened) return false;
  await delay(300);
  return true;
};

const printCheck = (routeOrState, viewport, result) => {
  const label = `${routeOrState} @ ${viewport.width}x${viewport.height}`;
  if (result.pass) {
    process.stdout.write(`[PASS] ${label} doc=${result.metrics.documentScrollWidth} body=${result.metrics.bodyScrollWidth} inner=${result.metrics.innerWidth} offenders=0`);
    if (result.modalPanelWidth !== null) process.stdout.write(` modal=${result.modalPanelWidth}`);
    process.stdout.write('\n');
    return;
  }

  process.stdout.write(`[FAIL] ${label} docScrollWidth=${result.metrics.documentScrollWidth} bodyScrollWidth=${result.metrics.bodyScrollWidth} innerWidth=${result.metrics.innerWidth}`);
  if (result.modalPanelWidth !== null) process.stdout.write(` modalWidth=${result.modalPanelWidth}`);
  process.stdout.write('\n');
  if (result.offenders.length > 0) {
    process.stdout.write('Top offenders:\n');
    result.offenders.forEach((offender, index) => {
      const id = offender.id ? ` #${offender.id}` : '';
      const className = offender.className ? ` .${offender.className.replace(/\s+/g, '.')}` : '';
      process.stdout.write(`${index + 1}. ${offender.tag}${id}${className} left=${offender.left} right=${offender.right} width=${offender.width} scroll=${offender.scrollWidth} client=${offender.clientWidth}\n`);
    });
  }
};

const consoleFallbackSnippet = `(() => {
  const root = document.documentElement;
  const body = document.body;
  const visual = window.visualViewport;
  const metrics = {
    innerWidth: Number(window.innerWidth),
    innerHeight: Number(window.innerHeight),
    documentClientWidth: Number(root?.clientWidth || 0),
    documentScrollWidth: Number(root?.scrollWidth || 0),
    bodyClientWidth: Number(body?.clientWidth || 0),
    bodyScrollWidth: Number(body?.scrollWidth || 0),
    visualViewportWidth: Number(visual?.width || window.innerWidth),
    visualViewportHeight: Number(visual?.height || window.innerHeight)
  };
  const limit = metrics.innerWidth + 2;
  const pass = metrics.documentScrollWidth <= limit && metrics.bodyScrollWidth <= limit &&
    metrics.documentClientWidth <= limit && metrics.bodyClientWidth <= limit;
  console.table({ ...metrics, pass });
})()`;

const runGuard = async (browserExecutable) => {
  const profileDirectory = await mkdtemp(join(tmpdir(), 'mk-stock-lab-phase-3dw-'));
  const browserProcess = spawn(browserExecutable, [
    '--headless=new',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-crash-reporter',
    '--disable-sync',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-default-browser-check',
    '--no-first-run',
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDirectory}`,
    'about:blank',
  ], {
    stdio: 'ignore',
    windowsHide: true,
  });

  let client;
  try {
    const { port } = await waitForDevToolsPort(profileDirectory, browserProcess);
    client = await createPageClient(port);

    let passed = 0;
    let failed = 0;
    for (const viewport of VIEWPORTS) {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 2,
        mobile: true,
        screenWidth: viewport.width,
        screenHeight: viewport.height,
      });

      for (const route of ROUTES) {
        try {
          await navigate(client, new URL(route, targetOrigin).href);
          const result = await evaluate(client, geometryExpression(false));
          printCheck(route, viewport, result);
          if (result.pass) passed += 1;
          else failed += 1;
        } catch {
          process.stdout.write(`[FAIL] ${route} @ ${viewport.width}x${viewport.height} reason=navigation-or-measurement-error\n`);
          failed += 1;
        }
      }

      try {
        await navigate(client, new URL('/', targetOrigin).href);
        if (!await openLoginModal(client)) throw new Error('login-modal-unavailable');
        const result = await evaluate(client, geometryExpression(true));
        printCheck('/ [login-modal]', viewport, result);
        if (result.pass) passed += 1;
        else failed += 1;
      } catch {
        process.stdout.write(`[FAIL] / [login-modal] @ ${viewport.width}x${viewport.height} reason=public-modal-not-measurable\n`);
        failed += 1;
      }
    }

    const total = passed + failed;
    process.stdout.write(`\nTotal: ${total} | Passed: ${passed} | Failed: ${failed}\n`);
    process.stdout.write(`Result: ${failed === 0 ? 'PASS' : 'FAIL'}\n`);
    if (failed > 0) process.exitCode = 1;
  } finally {
    client?.close();
    browserProcess.kill();
    await Promise.race([
      new Promise((resolve) => browserProcess.once('exit', resolve)),
      delay(2_000),
    ]);
    await rm(profileDirectory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
};

if (validateTarget()) {
  const mode = isProduction ? 'production-public' : 'local-public';
  printHeader(mode);

  if (isProduction && process.env[PRODUCTION_GUARD] !== YES) {
    printPlan();
  } else {
    const browserExecutable = browserCandidates();
    if (!browserExecutable) {
      process.stdout.write('Production guard execution: not executed - browser automation unavailable.\n');
      process.stdout.write('Use the following sanitized snippet in DevTools Console on each approved route and viewport:\n\n');
      process.stdout.write(`${consoleFallbackSnippet}\n\n`);
      process.stdout.write('Result: NOT_EXECUTED_BROWSER_UNAVAILABLE\n');
    } else {
      await runGuard(browserExecutable);
    }
  }
}
