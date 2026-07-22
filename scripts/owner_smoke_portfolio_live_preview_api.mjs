/**
 * Phase 3DP-OWNER-SMOKE — Owner Portfolio Live Preview API Smoke Script.
 *
 * PURPOSE: Owner-only local smoke that calls POST /api/portfolio/valuation with
 * source="live" + previewMode="owner" + allowLiveQuotes=true, validates the response
 * contract, and emits only safe summary output — no prices, no raw response, no secrets.
 *
 * IMPORTANT:
 *   - Do NOT run this script as Claude Code.
 *   - Owner must start the local dev server (npm run dev) in a separate terminal first.
 *   - Owner must set all five PHASE_3DP_* guard variables to the exact expected values.
 *   - Without the guard variables, the script runs a dry-run validation only.
 *
 * HOW TO RUN (owner local terminal):
 *   $env:PHASE_3DP_OWNER_API_SMOKE = "OWNER_APPROVED"
 *   $env:PHASE_3DP_RUNTIME_CONFIRMED = "local-non-production-confirmed"
 *   $env:PHASE_3DP_READ_ONLY_SCOPE_CONFIRMED = "OWNER_CONFIRMS_READ_ONLY_PORTFOLIO_PREVIEW"
 *   $env:PHASE_3DP_PROVIDER_QUOTA_RISK_ACCEPTED = "OWNER_ACCEPTS_KIS_QUOTA_RISK"
 *   $env:PHASE_3DP_NO_ACCOUNT_APIS_CONFIRMED = "OWNER_CONFIRMS_NO_ACCOUNT_APIS"
 *   npm run smoke:portfolio-live-preview-api:owner
 */

// All five guard variables must match exactly to enter live API mode.
const requiredLiveGuards = {
  PHASE_3DP_OWNER_API_SMOKE: 'OWNER_APPROVED',
  PHASE_3DP_RUNTIME_CONFIRMED: 'local-non-production-confirmed',
  PHASE_3DP_READ_ONLY_SCOPE_CONFIRMED: 'OWNER_CONFIRMS_READ_ONLY_PORTFOLIO_PREVIEW',
  PHASE_3DP_PROVIDER_QUOTA_RISK_ACCEPTED: 'OWNER_ACCEPTS_KIS_QUOTA_RISK',
  PHASE_3DP_NO_ACCOUNT_APIS_CONFIRMED: 'OWNER_CONFIRMS_NO_ACCOUNT_APIS',
};

// Default local API base. Owner may override with PHASE_3DP_OWNER_API_BASE_URL.
// Non-local overrides are rejected before any fetch call is made.
const DEFAULT_LOCAL_BASE_URL = 'http://127.0.0.1:4321';
const ALLOWED_LOCAL_BASE_URLS = ['http://127.0.0.1:4321', 'http://localhost:4321'];
const API_PATH = '/api/portfolio/valuation';

// Output prefix for all log lines.
const LOG_PREFIX = 'phase3dp';

// Forbidden output pattern: blocks secrets, raw KIS field names, valuation numerics,
// and other sensitive data. Uses \braw\b (word boundary) to match standalone "raw"
// but not the safe meta field name "rawProviderStored".
const forbiddenOutputPattern =
  /KIS_APP_KEY|KIS_APP_SECRET|KIS_ACCOUNT_NO|access_token|appkey|appsecret|authorization|Bearer|stck_|prdy_|rt_cd|acml_|providerMeta|currentPrice|marketValue|costBasis|unrealizedPnl|totalMarketValue|totalCostBasis|portfolioId|\braw\b|stack|password|SUPABASE_SERVICE_ROLE_KEY/i;

const logSafe = (message) => {
  if (forbiddenOutputPattern.test(message)) {
    console.log(`${LOG_PREFIX} step=safe-output-guard status=blocked code=SAFE_OUTPUT_BLOCKED sanitized=true`);
    process.exitCode = 1;
    throw new Error('Unsafe smoke output blocked by forbiddenOutputPattern.');
  }
  console.log(message);
};

const logStep = (step, status, extra = {}) => {
  const parts = [`${LOG_PREFIX} step=${step} status=${status}`];
  for (const [k, v] of Object.entries(extra)) {
    parts.push(`${k}=${v}`);
  }
  parts.push('sanitized=true');
  logSafe(parts.join(' '));
};

const isLiveApproved = () =>
  Object.entries(requiredLiveGuards).every(
    ([name, expected]) => process.env[name] === expected,
  );

const isProductionRuntime = () => {
  const nodeEnv = (process.env.NODE_ENV ?? '').trim().toLowerCase();
  const vercelEnv = (process.env.VERCEL_ENV ?? '').trim().toLowerCase();
  return nodeEnv === 'production' || vercelEnv === 'production';
};

const isAccountEnvAbsent = () =>
  !(process.env.KIS_ACCOUNT_NO ?? '').trim();

const resolveLocalBaseUrl = () => {
  const override = (process.env.PHASE_3DP_OWNER_API_BASE_URL ?? '').trim();
  if (!override) return DEFAULT_LOCAL_BASE_URL;
  if (ALLOWED_LOCAL_BASE_URLS.includes(override)) return override;
  return null;
};

// Safe URL label — never print the actual URL in logs.
const LOCAL_API_LABEL = 'local-api';

// Validates that the response JSON string does not contain forbidden field names
// that would indicate raw KIS provider data leaking into the API response.
const checkResponseLeakage = (responseText) => {
  const leakPatterns = [
    'providerMeta',
    'stck_',
    'prdy_',
    'rt_cd',
    'acml_',
    'access_token',
    'appkey',
    'appsecret',
    'authorization',
    'Bearer',
  ];
  for (const pat of leakPatterns) {
    if (responseText.includes(pat)) return pat;
  }
  return null;
};

// Fixed safe sample request body using placeholder cost values only.
// Do not use real portfolio data, account numbers, or credentials.
const buildRequestBody = () => ({
  portfolioId: 'owner-smoke-kr-preview',
  source: 'live',
  previewMode: 'owner',
  allowLiveQuotes: true,
  baseCurrency: 'KRW',
  positions: [
    { symbol: '005930', market: 'KR', assetType: 'stock', buyPrice: 1, quantity: 1, currency: 'KRW' },
    { symbol: '000660', market: 'KR', assetType: 'stock', buyPrice: 1, quantity: 1, currency: 'KRW' },
    { symbol: '069500', market: 'KR', assetType: 'etf',   buyPrice: 1, quantity: 1, currency: 'KRW' },
  ],
});

// ── Dry-run (executed when live guard vars are not set) ───────────────────────

const runDryRunSimulations = () => {
  logStep('dry-run-request-shape', 'passed', {
    note: 'source=live previewMode=owner baseCurrency=KRW positionCount=3 symbols=005930,000660,069500',
  });

  // Verify the sanitizer catches a known forbidden pattern.
  const sanitizerWorks = forbiddenOutputPattern.test('KIS_APP_SECRET=test');
  logStep('dry-run-sanitizer', 'passed', {
    note: sanitizerWorks ? 'blocks-forbidden-patterns' : 'WARNING-sanitizer-gap',
  });

  logStep('final-result', 'passed', { mode: 'dry-run-mock', apiLivePreview: false });
};

// ── Main smoke flow ───────────────────────────────────────────────────────────

const runSmoke = async () => {
  // Step 1: Guard check
  const liveApproved = isLiveApproved();
  if (!liveApproved) {
    logStep('guard-check', 'passed', { mode: 'dry-run-no-live-guards' });
    runDryRunSimulations();
    return;
  }
  logStep('guard-check', 'passed', { mode: 'live-approved' });

  // Step 2: Runtime check
  if (isProductionRuntime()) {
    logStep('runtime-check', 'failed', { code: 'PRODUCTION_RUNTIME_BLOCKED' });
    process.exitCode = 1;
    return;
  }
  if (!isAccountEnvAbsent()) {
    logStep('runtime-check', 'failed', { code: 'KIS_ACCOUNT_ENV_PRESENT' });
    process.exitCode = 1;
    return;
  }
  logStep('runtime-check', 'passed', { note: 'local-non-production-confirmed' });

  // Step 3: Local API target check
  const localBase = resolveLocalBaseUrl();
  if (!localBase) {
    logStep('local-api-target-check', 'failed', { code: 'NON_LOCAL_API_URL_REJECTED' });
    process.exitCode = 1;
    return;
  }
  logStep('local-api-target-check', 'passed', { target: LOCAL_API_LABEL });

  // Step 4: Request shape check
  const requestBody = buildRequestBody();
  logStep('request-shape-check', 'passed', {
    source: requestBody.source,
    previewMode: requestBody.previewMode,
    baseCurrency: requestBody.baseCurrency,
    positionCount: requestBody.positions.length,
    symbols: requestBody.positions.map((p) => p.symbol).join(','),
  });

  // Step 5: API call — local only, non-production
  let responseText = '';
  let httpStatus = 0;
  try {
    const response = await fetch(`${localBase}${API_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    httpStatus = response.status;
    responseText = await response.text();
  } catch {
    logStep('api-call', 'failed', { code: 'API_CALL_EXCEPTION' });
    process.exitCode = 1;
    return;
  }

  if (httpStatus !== 200) {
    logStep('api-call', 'failed', { code: 'HTTP_NON_200', httpStatus });
    process.exitCode = 1;
    return;
  }
  logStep('api-call', 'passed', { httpStatus });

  // Step 6: Response parse
  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    logStep('response-parse', 'failed', { code: 'RESPONSE_PARSE_FAILED' });
    process.exitCode = 1;
    return;
  }
  logStep('response-parse', 'passed');

  // Step 7: Response contract validation
  const meta = parsed?.data?.meta ?? {};
  const valuation = parsed?.data?.valuation ?? {};
  const rows = valuation?.rows ?? [];

  const contractOk =
    parsed?.ok === true &&
    parsed?.data?.source === 'live' &&
    parsed?.data?.previewMode === 'owner' &&
    meta?.quoteSource === 'live' &&
    meta?.liveAttempted === true &&
    meta?.rawProviderStored === false &&
    Array.isArray(meta?.unsupportedSymbols) &&
    Array.isArray(meta?.missingQuoteSymbols) &&
    Array.isArray(rows) &&
    rows.length === 3;

  if (!contractOk) {
    logStep('response-contract', 'failed', { code: 'CONTRACT_MISMATCH' });
    process.exitCode = 1;
    return;
  }

  const validStaleStates = new Set(['fresh', 'stale-but-usable', 'unavailable']);
  const rowStatesValid = rows.every((r) => validStaleStates.has(r?.staleState));
  if (!rowStatesValid) {
    logStep('response-contract', 'failed', { code: 'INVALID_ROW_STALE_STATE' });
    process.exitCode = 1;
    return;
  }

  // rawProviderStored === false is validated above. Log as "providerStored=false"
  // to avoid triggering the \braw\b output sanitizer check on the word "raw".
  logStep('response-contract', 'passed', {
    ok: parsed.ok,
    source: parsed.data.source,
    previewMode: parsed.data.previewMode,
    quoteSource: meta.quoteSource,
    liveAttempted: meta.liveAttempted,
    providerStored: meta.rawProviderStored,
  });

  // Step 8: Provider leakage check
  const leakedField = checkResponseLeakage(responseText);
  if (leakedField) {
    logStep('provider-leakage-check', 'failed', { code: 'UNSAFE_PROVIDER_LEAKAGE' });
    process.exitCode = 1;
    return;
  }
  logStep('provider-leakage-check', 'passed');

  // Step 9: Safe summary — no prices, no computed market values, no raw field names
  const summaryStaleState = valuation?.staleState ?? 'unknown';
  const missingQuoteCount = (meta?.missingQuoteSymbols ?? []).length;
  const unsupportedCount = (meta?.unsupportedSymbols ?? []).length;
  const unavailableRows = rows.filter((r) => r?.staleState === 'unavailable').length;

  logStep('safe-summary', 'passed', {
    staleState: summaryStaleState,
    rowCount: rows.length,
    missingQuoteCount,
    unsupportedCount,
    unavailableRows,
  });

  // Step 10: Final result
  logStep('final-result', 'passed', {
    apiLivePreview: true,
    contractValidated: true,
  });
};

runSmoke().catch(() => {
  if (!process.exitCode) process.exitCode = 1;
});
