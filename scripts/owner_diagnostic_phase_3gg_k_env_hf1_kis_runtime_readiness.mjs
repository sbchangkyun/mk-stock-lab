// Phase 3GG-K-ENV-HF1 owner-gated KIS runtime readiness diagnostic.
//
// Diagnoses why the owner-local KIS current_price path reports SOURCE_UNAVAILABLE before the
// LLM bridge is ever invoked. Requires the explicit CLI flag --owner-approved-kis-runtime-diagnostic;
// without it, nothing runs. Never reads .env/.env.local directly, never reads or prints an env
// value, never prints a currentPrice or volume numeric value, never prints a raw KIS payload or
// an Authorization header. Only touches the current_price route category -- no order, account,
// balance, funds, portfolio, trading, or personal endpoint is ever reachable from this script.

import { existsSync } from 'node:fs';
import path from 'node:path';

const OWNER_APPROVAL_FLAG = '--owner-approved-kis-runtime-diagnostic';
const DEFAULT_BASE_URL = 'http://localhost:4321';
const CURRENT_PRICE_ROUTE_PATH = '/api/chart-ai/local-only-kis-current-price.json?ownerLocalKisIntegration=1&symbol=005930';
const LLM_SUMMARY_ROUTE_PATH = '/api/chart-ai/local-only-kis-llm-summary.json?ownerLocalKisLlm=1&symbol=005930';

// Exact env keys required for current_price readiness, discovered from
// src/lib/server/providers/kisClient.ts (requiredEnvNames + featureFlagEnvName).
const REQUIRED_ENV_KEYS = ['KIS_APP_KEY', 'KIS_APP_SECRET', 'KIS_BASE_URL'];
const FEATURE_FLAG_ENV_KEY = 'KIS_ENABLE_LIVE_QUOTES';
// Must be ABSENT for the quote-only scope this phase covers (kisClient.ts hard-blocks otherwise).
const MUST_BE_ABSENT_ENV_KEY = 'KIS_ACCOUNT_NO';

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
  logSanitized(`Phase 3GG-K-ENV-HF1 owner diagnostic BLOCKED: reason=${reason} sanitized=true`);
  process.exitCode = 1;
};

// Boolean-presence check only; never reads, logs, or serializes the value itself.
const hasEnvValue = (name) => {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
};

async function checkRouteReachable(baseUrl, routePath, { requireResultShape } = {}) {
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

  return { reachable: true, httpStatus: response.status, parsed: requireResultShape ? parsed : undefined, parsedOk: true };
}

async function main() {
  const args = process.argv.slice(2);

  // 1. Explicit owner-approval flag required before any network call is attempted.
  if (!args.includes(OWNER_APPROVAL_FLAG)) {
    failClosed('missing-owner-approval-flag');
    return;
  }

  const baseUrlArg = args.find((a) => a.startsWith('--base-url='));
  const baseUrl = baseUrlArg ? baseUrlArg.slice('--base-url='.length) : DEFAULT_BASE_URL;

  // 2. Node process working directory sanity check (boolean only): confirms this script is
  // being invoked with the project root as cwd (e.g. via `npm run`), not from some other
  // directory, which would otherwise make relative-module diagnosis misleading.
  const cwdIsProjectRoot = existsSync(path.join(process.cwd(), 'package.json'));

  // 3. Safe env presence booleans -- never reads or prints the underlying values.
  const envPresence = Object.fromEntries(REQUIRED_ENV_KEYS.map((key) => [key, hasEnvValue(key)]));
  const allRequiredEnvPresent = REQUIRED_ENV_KEYS.every((key) => envPresence[key]);
  const featureFlagExactlyTrue = process.env[FEATURE_FLAG_ENV_KEY] === 'true';
  const accountNoAbsent = !hasEnvValue(MUST_BE_ABSENT_ENV_KEY);

  // 4. Dev server reachability + current_price route result.
  const currentPriceResult = await checkRouteReachable(baseUrl, CURRENT_PRICE_ROUTE_PATH, { requireResultShape: true });
  const devServerReachable = currentPriceResult.reachable === true;

  let currentPriceRouteReachable = false;
  let sourceStatus = null;
  let sanitizedErrorCode = null;
  let currentPricePresent = false;
  let volumePresent = false;

  if (devServerReachable && !currentPriceResult.forbiddenPatternDetected && currentPriceResult.parsedOk) {
    currentPriceRouteReachable = true;
    const context = currentPriceResult.parsed?.context ?? {};
    sourceStatus = typeof context.sourceStatus === 'string' ? context.sourceStatus : null;
    sanitizedErrorCode = typeof context.sanitizedErrorCode === 'string' ? context.sanitizedErrorCode : null;
    currentPricePresent = typeof context.currentPrice === 'number' && Number.isFinite(context.currentPrice);
    volumePresent = typeof context.volume === 'number' && Number.isFinite(context.volume);
  } else if (currentPriceResult.forbiddenPatternDetected) {
    failClosed('raw-payload-or-credential-pattern-detected-in-current-price-response');
    return;
  }

  // 5. H route (LLM summary) reachability, boolean-only -- this diagnostic scope is the KIS
  // current_price path, so the H route is checked only for reachability/shape, never clicked
  // through a browser and never inspected for LLM content.
  const hRouteResult = await checkRouteReachable(baseUrl, LLM_SUMMARY_ROUTE_PATH, { requireResultShape: true });
  if (hRouteResult.forbiddenPatternDetected) {
    failClosed('raw-payload-or-credential-pattern-detected-in-h-route-response');
    return;
  }
  const hRouteReachable = hRouteResult.reachable === true && hRouteResult.parsedOk === true;

  // 6. Classification.
  let classification;
  if (sourceStatus === 'ok' && currentPricePresent) {
    classification = 'PASS_CURRENT_PRICE_READY';
  } else if (!devServerReachable) {
    classification = 'BLOCKED_UNKNOWN';
  } else if (!allRequiredEnvPresent || !featureFlagExactlyTrue) {
    classification = 'BLOCKED_ENV_MISSING';
  } else if (allRequiredEnvPresent && featureFlagExactlyTrue && sanitizedErrorCode === 'MISSING_CREDENTIAL') {
    classification = 'BLOCKED_DEV_SERVER_ENV_STALE';
  } else if (
    allRequiredEnvPresent &&
    featureFlagExactlyTrue &&
    (sourceStatus === 'unavailable' || sanitizedErrorCode === 'PROVIDER_UNAVAILABLE' || sanitizedErrorCode === 'PROVIDER_TIMEOUT')
  ) {
    classification = 'BLOCKED_PROVIDER_NETWORK';
  } else if (allRequiredEnvPresent && featureFlagExactlyTrue && sourceStatus === 'blocked') {
    classification = 'BLOCKED_PROVIDER_AUTH';
  } else {
    classification = 'BLOCKED_UNKNOWN';
  }

  // 7. Print only safe booleans and status strings -- never a numeric value, never a credential.
  const report = {
    cwdIsProjectRoot,
    requiredEnvPresent: envPresence,
    allRequiredEnvPresent,
    KIS_ENABLE_LIVE_QUOTES_exactly_true: featureFlagExactlyTrue,
    KIS_ACCOUNT_NO_absent: accountNoAbsent,
    devServerReachable,
    currentPriceRouteReachable,
    hRouteReachable,
    sourceStatus,
    sanitizedErrorCode,
    currentPricePresent,
    volumePresent,
    classification,
  };

  logSanitized(`Phase 3GG-K-ENV-HF1 owner diagnostic REPORT: ${JSON.stringify(report)}`);

  if (classification === 'PASS_CURRENT_PRICE_READY') {
    logSanitized('Phase 3GG-K-ENV-HF1 owner diagnostic PASS: current_price path is ready.');
  } else {
    logSanitized(`Phase 3GG-K-ENV-HF1 owner diagnostic BLOCKED: classification=${classification} sanitized=true`);
    process.exitCode = 1;
  }
}

main().catch(() => {
  logSanitized('Phase 3GG-K-ENV-HF1 owner diagnostic BLOCKED: reason=unexpected-error sanitized=true');
  process.exitCode = 1;
});
