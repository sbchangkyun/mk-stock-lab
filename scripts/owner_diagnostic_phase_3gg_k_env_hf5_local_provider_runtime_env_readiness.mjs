// Phase 3GG-K-ENV-HF5 owner-gated local-provider runtime-env readiness diagnostic.
//
// Verifies whether the minimal local-provider binding fix (kisClient.ts now resolves env from the
// Astro/Vite runtime source import.meta.env first, falling back to process.env) made the existing
// local current_price route return a ready/ok result. Requires the explicit CLI flag
// --owner-approved-local-provider-runtime-env-diagnostic; without it, nothing runs.
//
// This diagnostic probes ONLY the existing local current_price route over localhost. It makes no
// direct KIS call, constructs no Authorization header, and reads no credential. It never reads
// .env/.env.local directly, never prints a process.env value directly, never prints the
// KIS_ENABLE_LIVE_QUOTES / KIS_BASE_URL raw value, app key/app secret/token, Authorization header,
// raw KIS request or response body, raw KIS error message, or currentPrice/volume numeric value.
// current_price is the only market-data endpoint touched. No order/account/balance/funds/portfolio/
// trading/personal endpoint is ever contacted.

const OWNER_APPROVAL_FLAG = '--owner-approved-local-provider-runtime-env-diagnostic';
const DEFAULT_LOCAL_BASE_URL = 'http://localhost:4321';
const CURRENT_PRICE_ROUTE_PATH = '/api/chart-ai/local-only-kis-current-price.json?ownerLocalKisIntegration=1&symbol=005930';
const REQUEST_TIMEOUT_MS = 8000;

// rt_cd / output / stck_prpr / acml_vol / prdy_vrss / prdy_ctrt: raw KIS payload field names.
const FORBIDDEN_RAW_PAYLOAD_PATTERN = /\brt_cd\b|\bstck_prpr\b|\bacml_vol\b|\bprdy_vrss\b|\bprdy_ctrt\b/i;

// KIS_APP_KEY / KIS_APP_SECRET / KIS_BASE_URL / access_token / appsecret / appkey /
// Authorization / Bearer / KIS_ACCOUNT_NO / account_no / jwt / password: credential-like tokens.
const FORBIDDEN_CREDENTIAL_PATTERN =
  /KIS_APP_KEY|KIS_APP_SECRET|KIS_BASE_URL|access_token|appsecret|appkey|authorization|Bearer|KIS_ACCOUNT_NO|account_no|jwt|password/i;

const logSanitized = (message) => {
  console.log(message);
};

const failClosed = (reason) => {
  logSanitized(`Phase 3GG-K-ENV-HF5 owner diagnostic BLOCKED: reason=${reason} sanitized=true`);
  process.exitCode = 1;
};

async function checkLocalServerReachable(baseUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}/`, { method: 'GET', signal: controller.signal });
    clearTimeout(timer);
    return response.status > 0;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

async function checkLocalRouteReachable(baseUrl, routePath) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  let rawText;
  try {
    response = await fetch(`${baseUrl}${routePath}`, { method: 'GET', signal: controller.signal });
    rawText = await response.text();
  } catch {
    clearTimeout(timer);
    return { reachable: false };
  }
  clearTimeout(timer);

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

  // 1. Explicit owner-approval flag required before any route probe is attempted.
  if (!args.includes(OWNER_APPROVAL_FLAG)) {
    failClosed('missing-owner-approval-flag');
    return;
  }

  const baseUrlArg = args.find((a) => a.startsWith('--base-url='));
  const localBaseUrl = baseUrlArg ? baseUrlArg.slice('--base-url='.length) : DEFAULT_LOCAL_BASE_URL;

  // 2. Shell/process env visibility of the live-quote flag -- boolean-only, value never printed.
  // A `false` here alongside a working route is the fingerprint of the runtime-env mismatch this
  // phase fixes: the flag lives only in .env (import.meta.env), not in process.env/the shell.
  const shellKisLiveQuotesExactlyTrue = process.env.KIS_ENABLE_LIVE_QUOTES === 'true';

  // 3. Local dev server + route reachability.
  const localDevServerReachable = await checkLocalServerReachable(localBaseUrl);
  const routeResult = await checkLocalRouteReachable(localBaseUrl, CURRENT_PRICE_ROUTE_PATH);
  if (routeResult.forbiddenPatternDetected) {
    failClosed('raw-payload-or-credential-pattern-detected-in-current-price-response');
    return;
  }

  const localCurrentPriceRouteReachable = routeResult.reachable === true;
  let localCurrentPriceSourceStatus = null;
  let localCurrentPriceSanitizedErrorCode = null;
  let localCurrentPricePresent = false;
  let localVolumePresent = false;

  if (localCurrentPriceRouteReachable && routeResult.parsedOk) {
    const context = routeResult.parsed?.context ?? {};
    localCurrentPriceSourceStatus = typeof context.sourceStatus === 'string' ? context.sourceStatus : null;
    localCurrentPriceSanitizedErrorCode = typeof context.sanitizedErrorCode === 'string' ? context.sanitizedErrorCode : null;
    localCurrentPricePresent = typeof context.currentPrice === 'number' && Number.isFinite(context.currentPrice);
    localVolumePresent = typeof context.volume === 'number' && Number.isFinite(context.volume);
  }

  // 4. Route runtime-flag evidence classification (coarse buckets only).
  let routeRuntimeFlagEvidenceKind;
  if (localCurrentPriceSourceStatus === 'ok') {
    routeRuntimeFlagEvidenceKind = 'route-ready';
  } else if (
    localCurrentPriceSanitizedErrorCode === 'PROVIDER_UNAVAILABLE' ||
    localCurrentPriceSourceStatus === 'unavailable'
  ) {
    routeRuntimeFlagEvidenceKind = 'route-provider-unavailable';
  } else if (
    localCurrentPriceSanitizedErrorCode === 'MISSING_CREDENTIAL' ||
    localCurrentPriceSanitizedErrorCode === 'NON_LOCAL_REQUEST'
  ) {
    routeRuntimeFlagEvidenceKind = 'route-disabled-or-env-missing';
  } else {
    routeRuntimeFlagEvidenceKind = 'route-unknown';
  }

  // The runtime-env mismatch is "suspected" when the route is still provider-unavailable while the
  // shell/process env does not expose the flag as exactly "true" -- i.e. the fix did not take.
  const suspectedRuntimeEnvMismatch =
    routeRuntimeFlagEvidenceKind === 'route-provider-unavailable' && shellKisLiveQuotesExactlyTrue === false;

  // 5. Final classification.
  let finalClassification;
  if (!localDevServerReachable || !localCurrentPriceRouteReachable) {
    finalClassification = 'STILL_BLOCKED_LOCAL_DEV_SERVER';
  } else if (routeRuntimeFlagEvidenceKind === 'route-ready' && localCurrentPricePresent) {
    // The route now resolves the KIS_ENABLE_LIVE_QUOTES value from import.meta.env even though the
    // shell/process env does not carry it -- this phase's runtime-flag injection fix. When the shell
    // flag was already exactly "true" the readiness never depended on the fix, so it is the plain
    // FIXED category instead.
    finalClassification = shellKisLiveQuotesExactlyTrue
      ? 'FIXED_CURRENT_PRICE_READY'
      : 'FIXED_RUNTIME_FLAG_INJECTION_CURRENT_PRICE_READY';
  } else if (routeRuntimeFlagEvidenceKind === 'route-provider-unavailable' && suspectedRuntimeEnvMismatch) {
    finalClassification = 'STILL_BLOCKED_RUNTIME_FLAG_NOT_VISIBLE';
  } else if (routeRuntimeFlagEvidenceKind === 'route-provider-unavailable') {
    finalClassification = 'STILL_BLOCKED_LOCAL_ROUTE_PROVIDER_UNAVAILABLE';
  } else {
    finalClassification = 'STILL_BLOCKED_UNKNOWN';
  }

  // 6. Print only safe booleans/enums -- never a raw env value, credential, token, or numeric.
  const report = {
    localDevServerReachable,
    localCurrentPriceRouteReachable,
    localCurrentPriceSourceStatus,
    localCurrentPriceSanitizedErrorCode,
    localCurrentPricePresent,
    localVolumePresent,
    shellKisLiveQuotesExactlyTrue,
    routeRuntimeFlagEvidenceKind,
    suspectedRuntimeEnvMismatch,
    finalClassification,
  };

  logSanitized(`Phase 3GG-K-ENV-HF5 owner diagnostic REPORT: ${JSON.stringify(report)}`);

  const passClassifications = ['FIXED_CURRENT_PRICE_READY', 'FIXED_RUNTIME_FLAG_INJECTION_CURRENT_PRICE_READY'];
  if (passClassifications.includes(finalClassification)) {
    logSanitized('Phase 3GG-K-ENV-HF5 owner diagnostic PASS: local current_price route is ready.');
  } else {
    logSanitized(`Phase 3GG-K-ENV-HF5 owner diagnostic BLOCKED: classification=${finalClassification} sanitized=true`);
    process.exitCode = 1;
  }
}

main().catch(() => {
  logSanitized('Phase 3GG-K-ENV-HF5 owner diagnostic BLOCKED: reason=unexpected-error sanitized=true');
  process.exitCode = 1;
});
