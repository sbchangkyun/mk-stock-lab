// Phase 3GG-K-ENV-HF4 owner-gated KIS provider auth/token diagnostic.
//
// Isolates whether the remaining PROVIDER_UNAVAILABLE blocker (confirmed by Phase 3GG-K-ENV-HF3
// after base-URL DNS/TCP/TLS/HTTP reachability was confirmed fully OK) sits in the KIS OAuth
// token exchange layer, the current_price quote authorization/entitlement/request-shape layer, or
// the existing local current_price route binding. Requires the explicit CLI flag
// --owner-approved-kis-auth-token-diagnostic; without it, nothing runs. Never reads .env/.env.local
// directly, never prints a process.env value directly, never prints KIS_BASE_URL/app key/app
// secret/access token/Authorization header/raw request or response body/raw KIS error message/
// currentPrice or volume numeric value/account number. The only KIS-side network contacts are the
// OAuth token endpoint and the current_price quote endpoint for symbol 005930 only. No order/
// account/balance/funds/portfolio/trading/personal endpoint is ever contacted.

const OWNER_APPROVAL_FLAG = '--owner-approved-kis-auth-token-diagnostic';
const DEFAULT_LOCAL_BASE_URL = 'http://localhost:4321';
const CURRENT_PRICE_ROUTE_PATH = '/api/chart-ai/local-only-kis-current-price.json?ownerLocalKisIntegration=1&symbol=005930';
const SYMBOL = '005930';
const REQUEST_TIMEOUT_MS = 8000;

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
  logSanitized(`Phase 3GG-K-ENV-HF4 owner diagnostic BLOCKED: reason=${reason} sanitized=true`);
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

function classifyHttpErrorFromCatch(error) {
  if (error?.name === 'AbortError') return 'timeout';
  const code = String(error?.cause?.code || error?.code || '');
  if (/CERT|SSL|TLS/i.test(code) || /CERT|SSL|TLS/i.test(String(error?.message || ''))) return 'tls-error';
  if (code) return 'network-error';
  return 'unknown';
}

function statusToClass(status) {
  if (status >= 200 && status < 300) return '2xx';
  if (status >= 300 && status < 400) return '3xx';
  if (status >= 400 && status < 500) return '4xx';
  if (status >= 500 && status < 600) return '5xx';
  return 'unknown';
}

// Requests a KIS OAuth access token in memory only. Never persists, prints, or hashes the token.
async function requestKisToken(baseOrigin, appKey, appSecret) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  let rawText;
  try {
    response = await fetch(`${baseOrigin}/oauth2/tokenP`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ grant_type: 'client_credentials', appkey: appKey, appsecret: appSecret }),
      signal: controller.signal,
    });
    rawText = await response.text();
  } catch (error) {
    clearTimeout(timer);
    return { attempted: true, httpStatusClass: classifyHttpErrorFromCatch(error), responseShapeKind: 'unknown', tokenPresent: false, errorClass: classifyHttpErrorFromCatch(error) === 'timeout' ? 'timeout' : 'network_error', token: null };
  }
  clearTimeout(timer);

  const httpStatusClass = statusToClass(response.status);

  let parsed = null;
  let parseOk = false;
  if (typeof rawText === 'string' && rawText.trim().length === 0) {
    return { attempted: true, httpStatusClass, responseShapeKind: 'empty', tokenPresent: false, errorClass: 'response_shape_unknown', token: null };
  }
  try {
    parsed = JSON.parse(rawText);
    parseOk = true;
  } catch {
    parseOk = false;
  }

  if (!parseOk) {
    return { attempted: true, httpStatusClass, responseShapeKind: 'invalid-json', tokenPresent: false, errorClass: 'response_shape_unknown', token: null };
  }

  const token = typeof parsed?.access_token === 'string' && parsed.access_token.length > 0 ? parsed.access_token : null;

  if (token) {
    return { attempted: true, httpStatusClass, responseShapeKind: 'access-token-present', tokenPresent: true, errorClass: 'none', token };
  }

  // No access token extracted -- classify by status class only, never by raw error text.
  let errorClass = 'unknown';
  if (httpStatusClass === '4xx') {
    // KIS commonly returns 403/401-style bodies for bad credentials or unauthorized app; without
    // reading raw error text we conservatively bucket all 4xx-no-token as invalid_credentials
    // unless the status itself indicates rate limiting (429), which fetch exposes via response.status.
    errorClass = response.status === 429 ? 'rate_limited' : response.status === 403 ? 'permission_denied' : 'invalid_credentials';
  } else if (httpStatusClass === '5xx') {
    errorClass = 'server_error';
  } else if (httpStatusClass === '2xx') {
    errorClass = 'response_shape_unknown';
  }

  const responseShapeKind = typeof parsed?.error_description === 'string' || typeof parsed?.error === 'string' ? 'error-shape' : 'unknown';

  return { attempted: true, httpStatusClass, responseShapeKind, tokenPresent: false, errorClass, token: null };
}

// Requests the current_price quote using an in-memory token only. Never persists, prints, or logs
// the Authorization header, raw request, or raw response body.
async function requestKisQuote(baseOrigin, appKey, appSecret, token) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const url = new URL(`${baseOrigin}/uapi/domestic-stock/v1/quotations/inquire-price`);
  url.searchParams.set('FID_COND_MRKT_DIV_CODE', 'J');
  url.searchParams.set('FID_INPUT_ISCD', SYMBOL);

  let response;
  let rawText;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
        appkey: appKey,
        appsecret: appSecret,
        tr_id: 'FHKST01010100',
        custtype: 'P',
        tr_cont: '',
      },
      signal: controller.signal,
    });
    rawText = await response.text();
  } catch (error) {
    clearTimeout(timer);
    const cls = classifyHttpErrorFromCatch(error);
    return {
      attempted: true,
      httpStatusClass: cls,
      responseShapeKind: 'unknown',
      kisStatusClass: 'unknown',
      currentPricePresent: false,
      volumePresent: false,
      errorClass: cls === 'timeout' ? 'timeout' : 'server_or_provider_error',
    };
  }
  clearTimeout(timer);

  const httpStatusClass = statusToClass(response.status);

  if (typeof rawText === 'string' && rawText.trim().length === 0) {
    return { attempted: true, httpStatusClass, responseShapeKind: 'empty', kisStatusClass: 'unknown', currentPricePresent: false, volumePresent: false, errorClass: 'response_shape_unknown' };
  }

  let parsed = null;
  let parseOk = false;
  try {
    parsed = JSON.parse(rawText);
    parseOk = true;
  } catch {
    parseOk = false;
  }

  if (!parseOk) {
    return { attempted: true, httpStatusClass, responseShapeKind: 'invalid-json', kisStatusClass: 'unknown', currentPricePresent: false, volumePresent: false, errorClass: 'response_shape_unknown' };
  }

  const rtCd = typeof parsed?.rt_cd === 'string' ? parsed.rt_cd : null;
  const output = parsed && typeof parsed === 'object' ? parsed.output : undefined;
  const outputPresent = output !== undefined && output !== null && typeof output === 'object';

  const kisStatusClass = rtCd === null ? 'unknown' : rtCd === '0' ? 'ok' : 'error';
  const responseShapeKind = outputPresent ? 'output-present' : rtCd !== null && rtCd !== '0' ? 'error-shape' : 'unknown';

  const currentPricePresent = outputPresent && typeof output.stck_prpr === 'string' && output.stck_prpr.trim().length > 0;
  const volumePresent = outputPresent && typeof output.acml_vol === 'string' && output.acml_vol.trim().length > 0;

  let errorClass = 'none';
  if (kisStatusClass === 'ok' && currentPricePresent) {
    errorClass = 'none';
  } else if (httpStatusClass === '4xx') {
    if (response.status === 429) errorClass = 'rate_limited';
    else if (response.status === 401 || response.status === 403) errorClass = 'invalid_token';
    else errorClass = 'bad_request_or_request_shape';
  } else if (httpStatusClass === '5xx') {
    errorClass = 'server_or_provider_error';
  } else if (kisStatusClass === 'error') {
    // KIS returns 200 with rt_cd != '0' for many auth/entitlement/request-shape failures; without
    // reading the raw msg_cd/msg1 text we cannot further disambiguate, so bucket conservatively.
    errorClass = outputPresent ? 'bad_request_or_request_shape' : 'permission_denied';
  } else if (!outputPresent) {
    errorClass = 'response_shape_unknown';
  } else {
    errorClass = 'unknown';
  }

  return { attempted: true, httpStatusClass, responseShapeKind, kisStatusClass, currentPricePresent, volumePresent, errorClass };
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

  // 1. Explicit owner-approval flag required before any provider call is attempted.
  if (!args.includes(OWNER_APPROVAL_FLAG)) {
    failClosed('missing-owner-approval-flag');
    return;
  }

  const baseUrlArg = args.find((a) => a.startsWith('--base-url='));
  const localBaseUrl = baseUrlArg ? baseUrlArg.slice('--base-url='.length) : DEFAULT_LOCAL_BASE_URL;

  // 2. Auth env presence -- boolean-presence checks only, values read internally, never printed raw.
  const appKeyPresent = hasEnvValue('KIS_APP_KEY');
  const appSecretPresent = hasEnvValue('KIS_APP_SECRET');
  const baseUrlPresent = hasEnvValue('KIS_BASE_URL');
  const kisLiveQuotesShellFlagExactlyTrue = process.env.KIS_ENABLE_LIVE_QUOTES === 'true';
  const requiredAuthEnvPresent = appKeyPresent && appSecretPresent && baseUrlPresent;

  let baseUrlParseOk = false;
  let baseUrlHostKind = 'unavailable';
  let parsedBaseUrl = null;
  if (baseUrlPresent) {
    try {
      parsedBaseUrl = new URL(process.env.KIS_BASE_URL.trim());
      baseUrlParseOk = true;
      baseUrlHostKind = classifyHostKind(parsedBaseUrl.hostname);
    } catch {
      baseUrlParseOk = false;
      baseUrlHostKind = 'unavailable';
    }
  }

  const tokenEndpointShapeKind = baseUrlParseOk ? 'expected-provider-shape' : 'unknown';

  // 3. Token diagnostic -- only attempted when the request can be safely constructed.
  let tokenRequestAttempted = false;
  let tokenHttpStatusClass = 'unknown';
  let tokenResponseShapeKind = 'unknown';
  let tokenPresent = false;
  let tokenErrorClass = 'none';
  let inMemoryToken = null;

  if (requiredAuthEnvPresent && baseUrlParseOk) {
    tokenRequestAttempted = true;
    const tokenResult = await requestKisToken(parsedBaseUrl.origin, process.env.KIS_APP_KEY, process.env.KIS_APP_SECRET);
    tokenHttpStatusClass = tokenResult.httpStatusClass;
    tokenResponseShapeKind = tokenResult.responseShapeKind;
    tokenPresent = tokenResult.tokenPresent;
    tokenErrorClass = tokenResult.errorClass;
    inMemoryToken = tokenResult.token;
  } else if (!requiredAuthEnvPresent) {
    tokenErrorClass = 'unknown';
  } else if (!baseUrlParseOk) {
    tokenErrorClass = 'unknown';
  }

  // 4. Quote diagnostic -- only attempted when a token was actually obtained.
  let quoteRequestAttempted = false;
  let quoteHttpStatusClass = 'unknown';
  let quoteResponseShapeKind = 'unknown';
  let quoteKisStatusClass = 'unknown';
  let quoteCurrentPricePresent = false;
  let quoteVolumePresent = false;
  let quoteErrorClass = 'none';

  if (tokenPresent && inMemoryToken) {
    quoteRequestAttempted = true;
    const quoteResult = await requestKisQuote(parsedBaseUrl.origin, process.env.KIS_APP_KEY, process.env.KIS_APP_SECRET, inMemoryToken);
    quoteHttpStatusClass = quoteResult.httpStatusClass;
    quoteResponseShapeKind = quoteResult.responseShapeKind;
    quoteKisStatusClass = quoteResult.kisStatusClass;
    quoteCurrentPricePresent = quoteResult.currentPricePresent;
    quoteVolumePresent = quoteResult.volumePresent;
    quoteErrorClass = quoteResult.errorClass;
  }

  // Drop the in-memory token reference as soon as the quote call has completed.
  inMemoryToken = null;

  // 5. Existing local current_price route comparison (unchanged route, no provider source change).
  const currentPriceResult = await checkLocalRouteReachable(localBaseUrl, CURRENT_PRICE_ROUTE_PATH);
  if (currentPriceResult.forbiddenPatternDetected) {
    failClosed('raw-payload-or-credential-pattern-detected-in-current-price-response');
    return;
  }

  const localCurrentPriceRouteReachable = currentPriceResult.reachable === true;
  let localCurrentPriceSourceStatus = null;
  let localCurrentPriceSanitizedErrorCode = null;
  let localCurrentPricePresent = false;
  let localVolumePresent = false;

  if (localCurrentPriceRouteReachable && currentPriceResult.parsedOk) {
    const context = currentPriceResult.parsed?.context ?? {};
    localCurrentPriceSourceStatus = typeof context.sourceStatus === 'string' ? context.sourceStatus : null;
    localCurrentPriceSanitizedErrorCode = typeof context.sanitizedErrorCode === 'string' ? context.sanitizedErrorCode : null;
    localCurrentPricePresent = typeof context.currentPrice === 'number' && Number.isFinite(context.currentPrice);
    localVolumePresent = typeof context.volume === 'number' && Number.isFinite(context.volume);
  }

  // 6. Classification.
  let finalClassification;
  if (!localCurrentPriceRouteReachable) {
    finalClassification = 'STILL_BLOCKED_LOCAL_DEV_SERVER';
  } else if (!requiredAuthEnvPresent) {
    finalClassification = 'BLOCKED_AUTH_ENV_NOT_VISIBLE';
  } else if (!baseUrlParseOk) {
    finalClassification = 'BLOCKED_TOKEN_REQUEST_CONFIG';
  } else if (!tokenRequestAttempted) {
    finalClassification = 'BLOCKED_TOKEN_REQUEST_CONFIG';
  } else if (tokenHttpStatusClass === 'timeout' || tokenHttpStatusClass === 'network-error' || tokenHttpStatusClass === 'tls-error') {
    finalClassification = 'BLOCKED_TOKEN_HTTP_NETWORK';
  } else if (!tokenPresent && tokenErrorClass === 'invalid_credentials') {
    finalClassification = 'BLOCKED_TOKEN_INVALID_CREDENTIALS';
  } else if (!tokenPresent && tokenErrorClass === 'permission_denied') {
    finalClassification = 'BLOCKED_TOKEN_PERMISSION';
  } else if (!tokenPresent && tokenErrorClass === 'rate_limited') {
    finalClassification = 'BLOCKED_TOKEN_RATE_LIMIT';
  } else if (!tokenPresent && tokenErrorClass === 'server_error') {
    finalClassification = 'BLOCKED_TOKEN_SERVER_OR_PROVIDER';
  } else if (!tokenPresent) {
    finalClassification = 'BLOCKED_TOKEN_RESPONSE_SHAPE';
  } else if (tokenPresent && !quoteRequestAttempted) {
    finalClassification = 'STILL_BLOCKED_UNKNOWN';
  } else if (
    quoteCurrentPricePresent &&
    (quoteVolumePresent || quoteKisStatusClass === 'ok') &&
    localCurrentPriceSourceStatus === 'ok' &&
    localCurrentPricePresent
  ) {
    finalClassification = 'PASS_CURRENT_PRICE_READY';
  } else if (
    quoteCurrentPricePresent &&
    quoteKisStatusClass === 'ok' &&
    (localCurrentPriceSourceStatus === 'unavailable' || localCurrentPriceSanitizedErrorCode === 'PROVIDER_UNAVAILABLE')
  ) {
    finalClassification = 'TOKEN_AND_DIRECT_QUOTE_OK_LOCAL_ROUTE_UNAVAILABLE';
  } else if (quoteErrorClass === 'invalid_token') {
    finalClassification = 'TOKEN_OK_QUOTE_AUTH_BLOCKED';
  } else if (quoteErrorClass === 'permission_denied' || quoteErrorClass === 'entitlement_or_scope') {
    finalClassification = 'TOKEN_OK_QUOTE_PERMISSION_OR_ENTITLEMENT';
  } else if (quoteErrorClass === 'bad_request_or_request_shape') {
    finalClassification = 'TOKEN_OK_QUOTE_BAD_REQUEST_OR_REQUEST_SHAPE';
  } else if (quoteErrorClass === 'rate_limited') {
    finalClassification = 'TOKEN_OK_QUOTE_RATE_LIMIT';
  } else if (quoteErrorClass === 'server_or_provider_error') {
    finalClassification = 'TOKEN_OK_QUOTE_SERVER_OR_PROVIDER';
  } else {
    finalClassification = 'STILL_BLOCKED_UNKNOWN';
  }

  // 7. Print only safe booleans/enums -- never a raw URL, credential, token, or numeric price/volume.
  const report = {
    requiredAuthEnvPresent,
    appKeyPresent,
    appSecretPresent,
    baseUrlPresent,
    kisLiveQuotesShellFlagExactlyTrue,
    baseUrlParseOk,
    baseUrlHostKind,
    tokenEndpointShapeKind,
    tokenRequestAttempted,
    tokenHttpStatusClass,
    tokenResponseShapeKind,
    tokenPresent,
    tokenErrorClass,
    quoteRequestAttempted,
    quoteHttpStatusClass,
    quoteResponseShapeKind,
    quoteKisStatusClass,
    quoteCurrentPricePresent,
    quoteVolumePresent,
    quoteErrorClass,
    localCurrentPriceRouteReachable,
    localCurrentPriceSourceStatus,
    localCurrentPriceSanitizedErrorCode,
    localCurrentPricePresent,
    localVolumePresent,
    finalClassification,
  };

  logSanitized(`Phase 3GG-K-ENV-HF4 owner diagnostic REPORT: ${JSON.stringify(report)}`);

  if (finalClassification === 'PASS_CURRENT_PRICE_READY') {
    logSanitized('Phase 3GG-K-ENV-HF4 owner diagnostic PASS: current_price path is ready.');
  } else {
    logSanitized(`Phase 3GG-K-ENV-HF4 owner diagnostic BLOCKED: classification=${finalClassification} sanitized=true`);
    process.exitCode = 1;
  }
}

main().catch(() => {
  logSanitized('Phase 3GG-K-ENV-HF4 owner diagnostic BLOCKED: reason=unexpected-error sanitized=true');
  process.exitCode = 1;
});
