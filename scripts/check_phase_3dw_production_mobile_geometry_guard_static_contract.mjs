/**
 * Static contract for Phase 3DW production mobile geometry guard.
 * No network, browser, Vercel, credentials, Supabase, or external API calls.
 */

globalThis.fetch = async () => {
  throw new Error('Network access is blocked in the Phase 3DW static checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const paths = {
  guard: 'scripts/owner_check_production_mobile_geometry.mjs',
  checker: 'scripts/check_phase_3dw_production_mobile_geometry_guard_static_contract.mjs',
  result: 'docs/planning/phase_3dw_production_mobile_geometry_guard_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
};

const read = (relativePath) => {
  try {
    return readFileSync(join(root, relativePath), 'utf8');
  } catch {
    return '';
  }
};

const guard = read(paths.guard);
const result = read(paths.result);
const changelog = read(paths.changelog);
const packageJson = read(paths.package);
let passed = 0;
let failed = 0;
const failures = [];

const check = (label, condition) => {
  if (condition) {
    passed += 1;
    process.stdout.write(`  [PASS] ${label}\n`);
  } else {
    failed += 1;
    failures.push(label);
    process.stdout.write(`  [FAIL] ${label}\n`);
  }
};

process.stdout.write('=== Phase 3DW Production Mobile Geometry Guard Static Contract ===\n\n');

process.stdout.write('Files and package scripts:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Owner-run package command exists',
  packageJson.includes('"guard:production-mobile-geometry"') &&
  packageJson.includes('owner_check_production_mobile_geometry.mjs'));
check('Static-check package command exists',
  packageJson.includes('"check:phase-3dw-production-mobile-geometry-guard"') &&
  packageJson.includes('check_phase_3dw_production_mobile_geometry_guard_static_contract.mjs'));
process.stdout.write('\n');

process.stdout.write('Target and explicit guard policy:\n');
check('Canonical production origin is the default',
  guard.includes("const CANONICAL_ORIGIN = 'https://mkstocklab.vercel.app'") &&
  guard.includes('process.env[TARGET_VARIABLE] || CANONICAL_ORIGIN'));
check('Production execution requires the exact explicit guard',
  guard.includes("const PRODUCTION_GUARD = 'PHASE_3DW_ALLOW_PRODUCTION_GEOMETRY'") &&
  guard.includes('process.env[PRODUCTION_GUARD] !== YES'));
check('Non-canonical public origins are rejected',
  guard.includes('!isProduction && !isAllowedLocal') &&
  guard.includes('only ${CANONICAL_ORIGIN}'));
check('Public production requires HTTPS', guard.includes("parsed.protocol !== 'https:'"));
check('Only the two approved local origins are listed',
  guard.includes("'http://localhost:4321'") &&
  guard.includes("'http://127.0.0.1:4321'"));
check('Local origins require their explicit guard',
  guard.includes("const LOCAL_GUARD = 'PHASE_3DW_ALLOW_LOCAL_GEOMETRY'") &&
  guard.includes('process.env[LOCAL_GUARD] !== YES'));
check('Dry-run exits before browser launch and network navigation',
  guard.indexOf('printPlan();') < guard.indexOf('browserCandidates();'));
process.stdout.write('\n');

process.stdout.write('Routes, viewports, and public login-modal state:\n');
for (const route of ['/', '/chart-ai', '/market', '/lab', '/portfolio', '/mypage']) {
  check(`Required route ${route} is included`, guard.includes(`'${route}'`));
}
for (const viewport of ['width: 390, height: 844', 'width: 412, height: 915', 'width: 430, height: 932']) {
  check(`Required viewport ${viewport.replace(/\D+/g, 'x').replace(/^x|x$/g, '')} is included`, guard.includes(viewport));
}
check('Login opens through the public trigger without form input',
  guard.includes("const LOGIN_TRIGGER = '#open-login-btn'") &&
  guard.includes('trigger.click()') &&
  !/\.(?:fill|type)\s*\(/.test(guard));
check('Login modal panel width is measured',
  guard.includes("const LOGIN_PANEL = '#auth-modal .modal-panel'") &&
  guard.includes('modalPanelWidth <= limit'));
process.stdout.write('\n');

process.stdout.write('Geometry metrics and offender diagnostics:\n');
for (const metric of [
  'innerWidth', 'innerHeight', 'documentClientWidth', 'documentScrollWidth',
  'bodyClientWidth', 'bodyScrollWidth', 'visualViewportWidth', 'visualViewportHeight',
]) {
  check(`Metric ${metric} is collected`, guard.includes(`${metric}:`));
}
check('Pass threshold is innerWidth plus exactly two pixels',
  guard.includes('const TOLERANCE = 2') &&
  guard.includes('const limit = metrics.innerWidth + ${TOLERANCE}') &&
  ['documentScrollWidth', 'bodyScrollWidth', 'documentClientWidth', 'bodyClientWidth']
    .every((metric) => guard.includes(`metrics.${metric} <= limit`)));
for (const field of ['tag', 'id', 'className', 'left', 'right', 'width', 'scrollWidth', 'clientWidth']) {
  check(`Allowed offender field ${field} is collected`, guard.includes(`${field}:`));
}
check('Offenders are sorted by overflow and capped at 25',
  guard.includes('right[0] - left[0]') && guard.includes('offenders.slice(0, 25)'));
check('Identifier metadata is truncated',
  guard.includes("slice(0, 48)") && guard.includes("slice(0, 96)"));
process.stdout.write('\n');

process.stdout.write('Privacy and output restrictions:\n');
check('No cookie access is implemented', !/document\.cookie|cookieStore|Network\.getAllCookies|Storage\.getCookies/.test(guard));
check('No local or session storage access is implemented',
  !/(?:localStorage|sessionStorage)\s*\.|Storage\.getStorageKeyForFrame/.test(guard));
check('No screenshot capture is implemented',
  !/\.screenshot\s*\(|Page\.captureScreenshot|captureBeyondViewport/.test(guard));
check('No page text collection is implemented',
  !/\.textContent\b|\.innerText\b|Accessibility\.getFullAXTree/.test(guard));
check('No raw markup collection is implemented',
  !/\.innerHTML\b|\.outerHTML\b|DOM\.getOuterHTML|Page\.captureSnapshot/.test(guard));
check('No request or response body logging is implemented',
  !/Network\.(?:getRequestPostData|getResponseBody)|postData|responseBody/.test(guard));
check('Output declares sanitized mode', guard.includes('Sanitized: true'));
check('Disposable browser profile is created and removed',
  guard.includes("mkdtemp(join(tmpdir(), 'mk-stock-lab-phase-3dw-'))") &&
  guard.includes("rm(profileDirectory, { recursive: true, force: true"));
check('Browser-unavailable fallback emits a sanitized console snippet',
  guard.includes('consoleFallbackSnippet') &&
  guard.includes('NOT_EXECUTED_BROWSER_UNAVAILABLE'));
process.stdout.write('\n');

process.stdout.write('Documentation and source boundary:\n');
check('Result document contains the safety model',
  result.includes('## 4. Safety Model') &&
  result.includes('No login') &&
  result.includes('No screenshots') &&
  result.includes('No page text collection'));
check('Result document includes Windows PowerShell usage',
  result.includes('# Windows PowerShell') &&
  result.includes('$env:PHASE_3DW_ALLOW_PRODUCTION_GEOMETRY="YES"'));
check('Result document references the prior fixed footer-ad issue',
  result.includes('728x70') && result.includes('.footer-ad-wrapper'));
check('Planning changelog contains Phase 3DW',
  changelog.includes('## Phase 3DW - 2026-06-28'));

let runtimeChanges = [];
try {
  runtimeChanges = execFileSync('git', ['diff', '--name-only', '8f01a71', '--', 'src'], {
    cwd: root,
    encoding: 'utf8',
  }).trim().split(/\r?\n/).filter(Boolean);
} catch {
  runtimeChanges = ['<git-diff-unavailable>'];
}
check('No runtime source files changed in Phase 3DW', runtimeChanges.length === 0);
process.stdout.write('\n');

process.stdout.write(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failures.length > 0) {
  process.stdout.write('\nFailed checks:\n');
  for (const failure of failures) process.stdout.write(`  - ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Result: PASS\n');
}
