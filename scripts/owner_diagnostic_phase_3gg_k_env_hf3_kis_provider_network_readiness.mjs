// Phase 3GG-K-ENV-HF3 owner-gated KIS provider network/base URL diagnostic.
//
// Isolates whether the remaining PROVIDER_UNAVAILABLE blocker (confirmed by Phase 3GG-K-ENV-HF2
// after the env-missing gate was resolved) is a DNS/TCP/TLS/HTTP base-URL reachability problem or
// a provider-side condition beyond base network reachability. Requires the explicit CLI flag
// --owner-approved-kis-provider-network-diagnostic; without it, nothing runs. Never reads
// .env/.env.local directly, never prints a process.env value directly, never prints the raw
// KIS_BASE_URL value, never prints a currentPrice/volume numeric value, never attaches an
// Authorization header or app key/secret/token, never calls an order/account/balance/funds/
// portfolio/trading/personal endpoint. The only market-data endpoint touched is the existing local
// current_price route via localhost; the only KIS-side network contact is a no-auth GET to the
// base URL origin/root for reachability classification only.

import net from 'node:net';
import tls from 'node:tls';
import { lookup } from 'node:dns/promises';

const OWNER_APPROVAL_FLAG = '--owner-approved-kis-provider-network-diagnostic';
const DEFAULT_LOCAL_BASE_URL = 'http://localhost:4321';
const CURRENT_PRICE_ROUTE_PATH = '/api/chart-ai/local-only-kis-current-price.json?ownerLocalKisIntegration=1&symbol=005930';
const PROBE_TIMEOUT_MS = 5000;

// rt_cd / output / stck_prpr / acml_vol / prdy_vrss / prdy_ctrt: raw KIS payload field names.
const FORBIDDEN_RAW_PAYLOAD_PATTERN = /\brt_cd\b|\boutput\b|\bstck_prpr\b|\bacml_vol\b|\bprdy_vrss\b|\bprdy_ctrt\b/i;

// KIS_APP_KEY / KIS_APP_SECRET / KIS_BASE_URL / access_token / appsecret / appkey /
// Authorization / Bearer / KIS_ACCOUNT_NO / account_no / jwt / password: credential-like tokens.
const FORBIDDEN_CREDENTIAL_PATTERN =
  /KIS_APP_KEY|KIS_APP_SECRET|KIS_BASE_URL|access_token|appsecret|appkey|authorization|Bearer|KIS_ACCOUNT_NO|account_no|jwt|password/i;

const logSanitized = (message) => {
  console.log(message);
};

const failClosed = (reason) => {
  logSanitized(`Phase 3GG-K-ENV-HF3 owner diagnostic BLOCKED: reason=${reason} sanitized=true`);
  process.exitCode = 1;
};

// Boolean-presence check only; never reads, logs, or serializes the value itself.
const hasEnvValue = (name) => {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
};

// Classifies a hostname into a coarse bucket without ever printing the hostname itself.
const classifyHostKind = (hostname) => {
  if (typeof hostname !== 'string' || hostname.trim().length === 0) return 'unavailable';
  if (/openapivts/i.test(hostname)) return 'kis-virtual-like';
  if (/openapi/i.test(hostname) && /koreainvestment/i.test(hostname)) return 'kis-real-like';
  return 'custom-or-unknown';
};

function probeTcp(host, port, timeoutMs = PROBE_TIMEOUT_MS) {
  return new Promise((resolve) => {
    let settled = false;
    const socket = net.createConnection({ host, port, timeout: timeoutMs });
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    };
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

function probeTls(host, port, timeoutMs = PROBE_TIMEOUT_MS) {
  return new Promise((resolve) => {
    let settled = false;
    let socket;
    try {
      socket = tls.connect({ host, port, timeout: timeoutMs, servername: host, rejectUnauthorized: false });
    } catch {
      resolve({ ok: false, authorized: 'unknown' });
      return;
    }
    const finish = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };
    socket.once('secureConnect', () => finish({ ok: true, authorized: socket.authorized === true }));
    socket.once('timeout', () => finish({ ok: false, authorized: 'unknown' }));
    socket.once('error', () => finish({ ok: false, authorized: 'unknown' }));
  });
}

async function probeHttpBaseOrigin(originUrl, timeoutMs = PROBE_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // No-auth GET to the origin/root only -- never a KIS API path, never an Authorization header,
    // never an app key/secret. Response body/headers are intentionally never read or printed.
    const response = await fetch(originUrl, { method: 'GET', signal: controller.signal });
    clearTimeout(timer);
    const status = response.status;
    let statusClass = 'unknown';
    if (status >= 200 && status < 300) statusClass = '2xx';
    else if (status >= 300 && status < 400) statusClass = '3xx';
    else if (status >= 400 && status < 500) statusClass = '4xx';
    else if (status >= 500 && status < 600) statusClass = '5xx';
    return { ok: true, statusClass };
  } catch (error) {
    clearTimeout(timer);
    if (error?.name === 'AbortError') return { ok: false, statusClass: 'timeout' };
    const code = String(error?.cause?.code || error?.code || '');
    if (/ECONNREFUSED/.test(code)) return { ok: false, statusClass: 'refused' };
    if (/ENOTFOUND|EAI_AGAIN/.test(code)) return { ok: false, statusClass: 'dns-error' };
    if (/CERT|SSL|TLS/i.test(code) || /CERT|SSL|TLS/i.test(String(error?.message || ''))) {
      return { ok: false, statusClass: 'tls-error' };
    }
    return { ok: false, statusClass: 'unknown' };
  }
}

async function checkLocalRouteReachable(baseUrl, routePath) {
  const requestUrl = `${baseUrl}${routePath}`;
  let response;
  let rawText;
  try {
    response = await fetch(requestUrl, { method: 'GET' });
    rawText = await response.text();
  } catch {
    return { reachable: false };
  }

  if (FORBIDDEN_RAW_PAYLOAD_PATTERN.test(rawText) || FORBIDDEN_CREDENTIAL_PATTERN.test(rawText)) {
    return { reachable: true, forbiddenPatternDetected: true };
  }

  if (response.status !== 200) {
    return { reachable: true, httpStatus: response.status };
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { reachable: true, httpStatus: response.status, parseError: true };
  }

  return { reachable: true, httpStatus: response.status, parsed, parsedOk: true };
}

async function main() {
  const args = process.argv.slice(2);

  // 1. Explicit owner-approval flag required before any network call is attempted.
  if (!args.includes(OWNER_APPROVAL_FLAG)) {
    failClosed('missing-owner-approval-flag');
    return;
  }

  const baseUrlArg = args.find((a) => a.startsWith('--base-url='));
  const localBaseUrl = baseUrlArg ? baseUrlArg.slice('--base-url='.length) : DEFAULT_LOCAL_BASE_URL;

  // 2. Local dev server + current_price route (existing local-only route, no KIS endpoint expansion).
  const currentPriceResult = await checkLocalRouteReachable(localBaseUrl, CURRENT_PRICE_ROUTE_PATH);
  const localDevServerReachable = currentPriceResult.reachable === true;

  let currentPriceRouteReachable = false;
  let currentPriceSourceStatus = null;
  let currentPriceSanitizedErrorCode = null;
  let currentPricePresent = false;
  let volumePresent = false;

  if (currentPriceResult.forbiddenPatternDetected) {
    failClosed('raw-payload-or-credential-pattern-detected-in-current-price-response');
    return;
  }

  if (localDevServerReachable && currentPriceResult.parsedOk) {
    currentPriceRouteReachable = true;
    const context = currentPriceResult.parsed?.context ?? {};
    currentPriceSourceStatus = typeof context.sourceStatus === 'string' ? context.sourceStatus : null;
    currentPriceSanitizedErrorCode = typeof context.sanitizedErrorCode === 'string' ? context.sanitizedErrorCode : null;
    currentPricePresent = typeof context.currentPrice === 'number' && Number.isFinite(context.currentPrice);
    volumePresent = typeof context.volume === 'number' && Number.isFinite(context.volume);
  }

  // 3. KIS_BASE_URL presence + safe parse -- read internally only, never printed raw.
  const baseUrlPresent = hasEnvValue('KIS_BASE_URL');
  const rawBaseUrlValue = baseUrlPresent ? process.env.KIS_BASE_URL.trim() : '';

  let parsedUrl = null;
  let baseUrlParseOk = false;
  if (baseUrlPresent) {
    try {
      parsedUrl = new URL(rawBaseUrlValue);
      baseUrlParseOk = true;
    } catch {
      baseUrlParseOk = false;
    }
  }

  let baseUrlProtocolKind = 'unknown';
  if (!baseUrlPresent) baseUrlProtocolKind = 'unknown';
  else if (!baseUrlParseOk) baseUrlProtocolKind = 'invalid';
  else if (parsedUrl.protocol === 'https:') baseUrlProtocolKind = 'https';
  else if (parsedUrl.protocol === 'http:') baseUrlProtocolKind = 'http';
  else baseUrlProtocolKind = 'invalid';

  const baseUrlHostPresent = baseUrlParseOk && typeof parsedUrl.hostname === 'string' && parsedUrl.hostname.length > 0;
  const baseUrlHostKind = baseUrlHostPresent ? classifyHostKind(parsedUrl.hostname) : 'unavailable';

  let baseUrlPortKind = 'unavailable';
  if (baseUrlParseOk) {
    if (parsedUrl.port) baseUrlPortKind = 'explicit';
    else if (baseUrlProtocolKind === 'https') baseUrlPortKind = 'default-443';
    else if (baseUrlProtocolKind === 'http') baseUrlPortKind = 'default-80';
  }

  // 4. DNS / TCP / TLS / HTTP base-origin probes -- only run when the URL is safely parseable.
  let dnsLookupOk = false;
  let dnsAddressFamily = 'unknown';
  let tcpConnectOk = false;
  let tlsHandshakeOk = false;
  let tlsAuthorized = 'unknown';
  let httpBaseProbeOk = false;
  let httpBaseProbeStatusClass = 'invalid-url';

  if (baseUrlParseOk && baseUrlHostPresent) {
    const hostname = parsedUrl.hostname;
    const port = parsedUrl.port ? Number(parsedUrl.port) : baseUrlProtocolKind === 'https' ? 443 : 80;

    try {
      const dnsResult = await lookup(hostname);
      dnsLookupOk = true;
      dnsAddressFamily = dnsResult.family === 6 ? 'IPv6' : 'IPv4';
    } catch {
      dnsLookupOk = false;
      dnsAddressFamily = 'unknown';
    }

    if (dnsLookupOk) {
      tcpConnectOk = await probeTcp(hostname, port);

      if (tcpConnectOk && baseUrlProtocolKind === 'https') {
        const tlsResult = await probeTls(hostname, port);
        tlsHandshakeOk = tlsResult.ok;
        tlsAuthorized = tlsResult.authorized;
      } else if (tcpConnectOk && baseUrlProtocolKind === 'http') {
        // No TLS layer to negotiate for plain HTTP.
        tlsHandshakeOk = true;
        tlsAuthorized = 'unknown';
      }

      const tlsGateOk = baseUrlProtocolKind === 'http' ? tcpConnectOk : tcpConnectOk && tlsHandshakeOk;
      if (tlsGateOk) {
        const httpResult = await probeHttpBaseOrigin(parsedUrl.origin);
        httpBaseProbeOk = httpResult.ok;
        httpBaseProbeStatusClass = httpResult.statusClass;
      } else {
        httpBaseProbeOk = false;
        httpBaseProbeStatusClass = baseUrlProtocolKind === 'https' && !tlsHandshakeOk ? 'tls-error' : 'refused';
      }
    } else {
      httpBaseProbeOk = false;
      httpBaseProbeStatusClass = 'dns-error';
    }
  }

  // 5. Classification.
  let finalClassification;
  if (!localDevServerReachable) {
    finalClassification = 'STILL_BLOCKED_LOCAL_DEV_SERVER';
  } else if (!baseUrlPresent) {
    finalClassification = 'BLOCKED_BASE_URL_ENV_NOT_VISIBLE';
  } else if (!baseUrlParseOk) {
    finalClassification = 'BLOCKED_BASE_URL_INVALID';
  } else if (!dnsLookupOk) {
    finalClassification = 'BLOCKED_BASE_URL_DNS';
  } else if (!tcpConnectOk) {
    finalClassification = 'BLOCKED_BASE_URL_TCP';
  } else if (baseUrlProtocolKind === 'https' && !tlsHandshakeOk) {
    finalClassification = 'BLOCKED_BASE_URL_TLS';
  } else if (!httpBaseProbeOk) {
    finalClassification = 'BLOCKED_BASE_URL_HTTP';
  } else if (currentPriceSourceStatus === 'ok' && currentPricePresent) {
    finalClassification = 'PASS_CURRENT_PRICE_READY';
  } else if (
    currentPriceSourceStatus === 'unavailable' ||
    currentPriceSanitizedErrorCode === 'PROVIDER_UNAVAILABLE' ||
    currentPriceSanitizedErrorCode === 'PROVIDER_TIMEOUT'
  ) {
    finalClassification = 'NETWORK_OK_CURRENT_PRICE_PROVIDER_UNAVAILABLE';
  } else {
    finalClassification = 'STILL_BLOCKED_UNKNOWN';
  }

  // 6. Print only safe booleans/enums -- never a raw URL, credential, or numeric price/volume value.
  const report = {
    localDevServerReachable,
    currentPriceRouteReachable,
    currentPriceSourceStatus,
    currentPriceSanitizedErrorCode,
    currentPricePresent,
    volumePresent,
    baseUrlPresent,
    baseUrlParseOk,
    baseUrlProtocolKind,
    baseUrlHostPresent,
    baseUrlHostKind,
    baseUrlPortKind,
    dnsLookupOk,
    dnsAddressFamily,
    tcpConnectOk,
    tlsHandshakeOk,
    tlsAuthorized,
    httpBaseProbeOk,
    httpBaseProbeStatusClass,
    finalClassification,
  };

  logSanitized(`Phase 3GG-K-ENV-HF3 owner diagnostic REPORT: ${JSON.stringify(report)}`);

  if (finalClassification === 'PASS_CURRENT_PRICE_READY') {
    logSanitized('Phase 3GG-K-ENV-HF3 owner diagnostic PASS: current_price path is ready.');
  } else {
    logSanitized(`Phase 3GG-K-ENV-HF3 owner diagnostic BLOCKED: classification=${finalClassification} sanitized=true`);
    process.exitCode = 1;
  }
}

main().catch(() => {
  logSanitized('Phase 3GG-K-ENV-HF3 owner diagnostic BLOCKED: reason=unexpected-error sanitized=true');
  process.exitCode = 1;
});
