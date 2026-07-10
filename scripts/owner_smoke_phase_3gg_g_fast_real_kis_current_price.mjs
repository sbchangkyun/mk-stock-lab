// Phase 3GG-G-FAST owner-gated real KIS current_price smoke.
//
// Runs exactly ONE explicit owner-approved local-only real KIS current_price request against
// the already-integrated local-only route (Phase 3GG-E-INTEGRATE / 3GG-F-FAST). Requires the
// explicit CLI flag --owner-approved-real-kis-smoke; without it, no network call is attempted
// at all. Never reads .env/.env.local, never reads or prints a credential value, never prints
// the actual currentPrice value (public market data, but this script records presence only).
// Calls only the single current_price route -- no order, account, balance, or LLM endpoint is
// ever reachable from this script.

const OWNER_APPROVAL_FLAG = '--owner-approved-real-kis-smoke';
const DEFAULT_BASE_URL = 'http://localhost:4321';
const ROUTE_PATH = '/api/chart-ai/local-only-kis-current-price.json?ownerLocalKisIntegration=1&symbol=005930';
const TARGET_SYMBOL = '005930';
const TARGET_MARKET = 'KR';
const OK_SOURCE_STATUSES = ['ok', 'success'];

const ALLOWED_CONTEXT_FIELDS = Object.freeze([
  'symbol',
  'market',
  'currentPrice',
  'volume',
  'timestamp',
  'sourceStatus',
  'cacheStatus',
  'sanitizedErrorCode',
  'providerLabel',
  'integrationMode',
  'warnings',
]);

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
  logSanitized(`Phase 3GG-G-FAST owner real KIS current_price smoke BLOCKED: reason=${reason} sanitized=true`);
  process.exitCode = 1;
};

async function main() {
  const args = process.argv.slice(2);

  // 1. Explicit owner-approval flag required before any network call is attempted.
  if (!args.includes(OWNER_APPROVAL_FLAG)) {
    failClosed('missing-owner-approval-flag');
    return;
  }

  const baseUrlArg = args.find((a) => a.startsWith('--base-url='));
  const baseUrl = baseUrlArg ? baseUrlArg.slice('--base-url='.length) : DEFAULT_BASE_URL;
  const requestUrl = `${baseUrl}${ROUTE_PATH}`;

  // 2. Fetch the local-only route. Any network-level failure (dev server not running, etc.)
  // fails closed with a sanitized reason only.
  let response;
  let rawText;
  try {
    response = await fetch(requestUrl, { method: 'GET' });
    rawText = await response.text();
  } catch {
    failClosed('local-dev-server-unreachable');
    return;
  }

  // 3. Scan the raw response text for forbidden raw-payload / credential patterns BEFORE
  // parsing or printing anything derived from it. If found, never print the raw body.
  if (FORBIDDEN_RAW_PAYLOAD_PATTERN.test(rawText)) {
    failClosed('raw-payload-pattern-detected');
    return;
  }
  if (FORBIDDEN_CREDENTIAL_PATTERN.test(rawText)) {
    failClosed('credential-pattern-detected');
    return;
  }

  if (response.status !== 200) {
    failClosed(`unexpected-http-status-${response.status}`);
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    failClosed('response-not-valid-json');
    return;
  }

  if (!parsed || parsed.ok !== true || !parsed.context || typeof parsed.context !== 'object') {
    failClosed('unexpected-response-shape');
    return;
  }

  const { context } = parsed;

  // 4. Assert the context contains exactly the 11 allowlisted fields -- nothing more, nothing
  // less. Any unexpected field name fails closed rather than being silently ignored.
  const contextKeys = Object.keys(context);
  const hasExactAllowedFields =
    contextKeys.length === ALLOWED_CONTEXT_FIELDS.length &&
    ALLOWED_CONTEXT_FIELDS.every((field) => contextKeys.includes(field));
  if (!hasExactAllowedFields) {
    failClosed('context-field-allowlist-mismatch');
    return;
  }

  const currentPricePresent = typeof context.currentPrice === 'number' && Number.isFinite(context.currentPrice);
  const volumePresent = typeof context.volume === 'number' && Number.isFinite(context.volume);

  // 5. Pass only if every one of these holds. sourceStatus 'blocked'/'unavailable' (e.g. because
  // KIS_ENABLE_LIVE_QUOTES is unset or credentials are missing) is a real, expected fail-closed
  // outcome for this owner smoke -- not a bug -- but it must NOT be reported as a pass.
  const passes =
    context.symbol === TARGET_SYMBOL &&
    context.market === TARGET_MARKET &&
    OK_SOURCE_STATUSES.includes(context.sourceStatus) &&
    currentPricePresent &&
    context.integrationMode === 'local-only';

  if (!passes) {
    logSanitized(
      `Phase 3GG-G-FAST owner real KIS current_price smoke BLOCKED: reason=fail-closed-or-unavailable ` +
        `sourceStatus=${context.sourceStatus} sanitizedErrorCode=${context.sanitizedErrorCode ?? 'null'} sanitized=true`,
    );
    process.exitCode = 1;
    return;
  }

  logSanitized(
    `Phase 3GG-G-FAST owner real KIS current_price smoke PASS: symbol=${context.symbol} ` +
      `sourceStatus=${context.sourceStatus} currentPricePresent=true volumePresent=${volumePresent} sanitized=true`,
  );
}

main().catch(() => {
  logSanitized('Phase 3GG-G-FAST owner real KIS current_price smoke BLOCKED: reason=unexpected-error sanitized=true');
  process.exitCode = 1;
});
