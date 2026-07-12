// Phase 3GG-D-FAST local-only Live KIS minimal end-to-end market-data path.
// Pure, dependency-free .mjs module. Every real network/credential/timing
// primitive is received via injectable `deps`, never imported directly, so
// this module stays fully unit-testable without touching real TS/network
// code. Single approved endpoint category: current_price. No order/account/
// balance/funds/personal endpoint category exists anywhere in this module.

export const LOCAL_ONLY_LIVE_KIS_MARKET_DATA_BINDING_CONTRACT_VERSION =
  'local-only-live-kis-market-data-binding.v0.1';

export const LOCAL_ONLY_ALLOWED_HOSTNAMES = Object.freeze(['localhost', '127.0.0.1', '::1']);

// Exactly one approved category for this phase. Phase 3GG-D-PLAN's broader
// allowlist (OHLC, rankings, etc.) is intentionally NOT carried forward here;
// this phase implements one endpoint only, per its own work order.
export const ALLOWED_ENDPOINT_CATEGORIES = Object.freeze(['current_price']);

export const FORBIDDEN_ENDPOINT_CATEGORIES = Object.freeze([
  'order',
  'cancel_order',
  'modify_order',
  'cancel_modify_order',
  'account',
  'balance',
  'funds',
  'buying_power',
  'sellable_quantity',
  'profit_loss',
  'deposit_withdrawal',
  'trading_history',
  'portfolio_holdings',
  'personal_endpoint',
  'personal',
]);

export const DEFAULT_RATE_LIMIT_POLICY = Object.freeze({
  perMinute: 5,
  perHour: 30,
  perDay: 100,
});

export const DEFAULT_CACHE_TTL_MS = 300_000;
export const DEFAULT_CALL_TIMEOUT_MS = 8_000;

export const SANITIZED_ERROR_CODES = Object.freeze({
  NON_LOCAL_REQUEST: 'NON_LOCAL_REQUEST',
  MISSING_CREDENTIAL: 'MISSING_CREDENTIAL',
  ENDPOINT_NOT_ALLOWLISTED: 'ENDPOINT_NOT_ALLOWLISTED',
  ENDPOINT_FORBIDDEN: 'ENDPOINT_FORBIDDEN',
  INVALID_SYMBOL: 'INVALID_SYMBOL',
  RATE_LIMITED: 'RATE_LIMITED',
  PROVIDER_TIMEOUT: 'PROVIDER_TIMEOUT',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  MALFORMED_RESPONSE: 'MALFORMED_RESPONSE',
});

export const ALLOWED_SANITIZED_RESPONSE_FIELDS = Object.freeze([
  'symbol',
  'market',
  'timestamp',
  'currentPrice',
  'volume',
  'sourceStatus',
  'cacheStatus',
  'sanitizedErrorCode',
]);

export const ALLOWED_LOG_FIELDS = Object.freeze([
  'timestamp',
  'symbol',
  'endpointCategory',
  'success',
  'sanitizedErrorCode',
  'latencyMs',
  'cacheHit',
  'rateLimitBlocked',
]);

const normalize = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

export function evaluateLocalOnlyGuard({ hostname, env = {} } = {}) {
  const normalizedHost = normalize(hostname);
  if (!LOCAL_ONLY_ALLOWED_HOSTNAMES.includes(normalizedHost)) {
    return { allowed: false, reason: 'host_not_local' };
  }
  const vercelEnv = normalize(env.VERCEL_ENV);
  const vercelFlag = normalize(env.VERCEL);
  if (vercelEnv || vercelFlag === '1' || vercelFlag === 'true') {
    return { allowed: false, reason: 'deployed_environment_detected' };
  }
  const nodeEnv = normalize(env.NODE_ENV);
  if (nodeEnv === 'production') {
    return { allowed: false, reason: 'production_runtime_not_allowed' };
  }
  return { allowed: true, reason: 'local_only_confirmed' };
}

export function evaluateEndpointAllowlist(category) {
  const normalized = normalize(category);
  if (FORBIDDEN_ENDPOINT_CATEGORIES.includes(normalized)) {
    return { allowed: false, reason: 'endpoint_forbidden' };
  }
  if (!ALLOWED_ENDPOINT_CATEGORIES.includes(normalized)) {
    return { allowed: false, reason: 'endpoint_not_allowlisted' };
  }
  return { allowed: true, reason: 'endpoint_allowlisted' };
}

export function evaluateCredentialPresence({ hasAppKey, hasAppSecret, hasBaseUrl } = {}) {
  const missingEnvNames = [];
  if (!hasAppKey) missingEnvNames.push('KIS_APP_KEY');
  if (!hasAppSecret) missingEnvNames.push('KIS_APP_SECRET');
  if (!hasBaseUrl) missingEnvNames.push('KIS_BASE_URL');
  return { allowed: missingEnvNames.length === 0, missingEnvNames };
}

const isValidKrSymbol = (symbol) => typeof symbol === 'string' && /^\d{6}$/.test(symbol);

export function createRateLimiter(policy = DEFAULT_RATE_LIMIT_POLICY) {
  let timestampsMs = [];

  const prune = (nowMs) => {
    const dayAgoMs = nowMs - 24 * 60 * 60 * 1000;
    timestampsMs = timestampsMs.filter((t) => t > dayAgoMs);
  };

  return {
    checkAndRecord(nowMs) {
      prune(nowMs);
      const minuteAgoMs = nowMs - 60 * 1000;
      const hourAgoMs = nowMs - 60 * 60 * 1000;
      const perMinuteCount = timestampsMs.filter((t) => t > minuteAgoMs).length;
      const perHourCount = timestampsMs.filter((t) => t > hourAgoMs).length;
      const perDayCount = timestampsMs.length;
      if (perMinuteCount >= policy.perMinute) {
        return { allowed: false, reason: 'rate_limit_per_minute_exceeded' };
      }
      if (perHourCount >= policy.perHour) {
        return { allowed: false, reason: 'rate_limit_per_hour_exceeded' };
      }
      if (perDayCount >= policy.perDay) {
        return { allowed: false, reason: 'rate_limit_per_day_exceeded' };
      }
      timestampsMs.push(nowMs);
      return { allowed: true, reason: 'within_limit' };
    },
    getRequestCount(nowMs) {
      prune(nowMs);
      return timestampsMs.length;
    },
    reset() {
      timestampsMs = [];
    },
  };
}

export function createQuoteCache(ttlMs = DEFAULT_CACHE_TTL_MS) {
  const store = new Map();
  const buildKey = (category, symbol) => `${category}:${symbol}`;

  return {
    get(category, symbol, nowMs) {
      const key = buildKey(category, symbol);
      const entry = store.get(key);
      if (!entry) return null;
      if (nowMs - entry.cachedAtMs > ttlMs) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    set(category, symbol, value, nowMs) {
      store.set(buildKey(category, symbol), { value, cachedAtMs: nowMs });
    },
    clear() {
      store.clear();
    },
  };
}

export function sanitizeQuoteResponse({
  symbol,
  market,
  timestamp,
  currentPrice,
  volume,
  sourceStatus,
  cacheStatus,
  sanitizedErrorCode,
}) {
  return {
    symbol: typeof symbol === 'string' ? symbol : null,
    market: typeof market === 'string' ? market : null,
    timestamp: typeof timestamp === 'string' ? timestamp : null,
    currentPrice: typeof currentPrice === 'number' && Number.isFinite(currentPrice) ? currentPrice : null,
    volume: typeof volume === 'number' && Number.isFinite(volume) ? volume : null,
    sourceStatus: typeof sourceStatus === 'string' ? sourceStatus : 'unavailable',
    cacheStatus: typeof cacheStatus === 'string' ? cacheStatus : 'miss',
    sanitizedErrorCode: sanitizedErrorCode ?? null,
  };
}

export function buildLogEntry({
  timestamp,
  symbol,
  endpointCategory,
  success,
  sanitizedErrorCode,
  latencyMs,
  cacheHit,
  rateLimitBlocked,
}) {
  return {
    timestamp,
    symbol,
    endpointCategory,
    success: Boolean(success),
    sanitizedErrorCode: sanitizedErrorCode ?? null,
    latencyMs: typeof latencyMs === 'number' && Number.isFinite(latencyMs) ? latencyMs : null,
    cacheHit: Boolean(cacheHit),
    rateLimitBlocked: Boolean(rateLimitBlocked),
  };
}

async function callWithTimeout(transportFactory, timeoutMs) {
  let timer;
  const timeoutPromise = new Promise((resolve) => {
    timer = setTimeout(() => resolve({ ok: false, code: 'TIMEOUT' }), timeoutMs);
  });
  try {
    return await Promise.race([transportFactory(), timeoutPromise]);
  } catch {
    return { ok: false, code: 'PROVIDER_UNAVAILABLE' };
  } finally {
    clearTimeout(timer);
  }
}

// Orchestration core. `input` carries request-shaped data (no defaults that
// hide missing local-ness). `deps` carries every side-effecting or
// injectable collaborator: rateLimiter, cache, hasEnvValue(name), fetchQuote
// ({symbol, category}) -> {ok, data|code}, logger(entry), now() clock, and
// an optional timeoutMs override.
export async function runLocalOnlyLiveKisMarketDataRequest(input, deps) {
  const {
    hostname,
    env = {},
    symbol,
    category = 'current_price',
    nowMs,
    // Phase 3GG-M-PROD-HF1: scoped, per-call signal (default false) set by the Chart AI production
    // beta summary route ONLY after its own production beta guard has passed. It is forwarded solely
    // into the delegated fetchQuote transport (step 7 below) so the provider client can narrowly lift
    // its Vercel Production hard block for the current_price quote scope. It does NOT relax this
    // module's own local-only guard, endpoint allowlist, symbol, credential, or rate-limit checks.
    allowProductionChartAiBetaLiveQuotes = false,
  } = input;
  const {
    rateLimiter,
    cache,
    hasEnvValue,
    fetchQuote,
    logger = () => {},
    now = () => Date.now(),
    timeoutMs = DEFAULT_CALL_TIMEOUT_MS,
  } = deps;

  const timestamp = new Date(nowMs).toISOString();

  const finalize = (partial) => {
    const sanitized = sanitizeQuoteResponse({ symbol, market: 'KR', timestamp, ...partial });
    logger(
      buildLogEntry({
        timestamp,
        symbol,
        endpointCategory: category,
        success: sanitized.sourceStatus === 'ok',
        sanitizedErrorCode: sanitized.sanitizedErrorCode,
        latencyMs: partial.latencyMs ?? 0,
        cacheHit: sanitized.cacheStatus === 'hit',
        rateLimitBlocked: sanitized.sanitizedErrorCode === SANITIZED_ERROR_CODES.RATE_LIMITED,
      }),
    );
    return sanitized;
  };

  // 1. Local-only guard: must run before anything else touches credentials
  // or the network.
  const guard = evaluateLocalOnlyGuard({ hostname, env });
  if (!guard.allowed) {
    return finalize({ sourceStatus: 'blocked', cacheStatus: 'miss', sanitizedErrorCode: SANITIZED_ERROR_CODES.NON_LOCAL_REQUEST });
  }

  // 2. Endpoint allowlist (single category, forbidden list rejected first).
  const endpointCheck = evaluateEndpointAllowlist(category);
  if (!endpointCheck.allowed) {
    const sanitizedErrorCode =
      endpointCheck.reason === 'endpoint_forbidden'
        ? SANITIZED_ERROR_CODES.ENDPOINT_FORBIDDEN
        : SANITIZED_ERROR_CODES.ENDPOINT_NOT_ALLOWLISTED;
    return finalize({ sourceStatus: 'blocked', cacheStatus: 'miss', sanitizedErrorCode });
  }

  // 3. Symbol shape validation (KR market, 6-digit only, per work order).
  if (!isValidKrSymbol(symbol)) {
    return finalize({ sourceStatus: 'blocked', cacheStatus: 'miss', sanitizedErrorCode: SANITIZED_ERROR_CODES.INVALID_SYMBOL });
  }

  // 4. Credential presence (boolean-only; never reads or logs a value).
  const credentialCheck = evaluateCredentialPresence({
    hasAppKey: hasEnvValue('KIS_APP_KEY'),
    hasAppSecret: hasEnvValue('KIS_APP_SECRET'),
    hasBaseUrl: hasEnvValue('KIS_BASE_URL'),
  });
  if (!credentialCheck.allowed) {
    return finalize({ sourceStatus: 'blocked', cacheStatus: 'miss', sanitizedErrorCode: SANITIZED_ERROR_CODES.MISSING_CREDENTIAL });
  }

  // 5. Rate limit -- runs before cache lookup so every request attempt
  // (cache hit or not) counts against the ceiling, per the 3GG-D-PLAN data
  // flow this phase implements.
  const rateCheck = rateLimiter.checkAndRecord(nowMs);
  if (!rateCheck.allowed) {
    return finalize({ sourceStatus: 'blocked', cacheStatus: 'miss', sanitizedErrorCode: SANITIZED_ERROR_CODES.RATE_LIMITED });
  }

  // 6. Cache lookup (cache-before-call). A hit must never reach fetchQuote.
  const cached = cache.get(category, symbol, nowMs);
  if (cached) {
    return finalize({ ...cached, cacheStatus: 'hit', sanitizedErrorCode: null });
  }

  // 7. Provider call, wrapped in an explicit timeout (the delegated
  // transport has no timeout guarantee of its own).
  const startedAtMs = now();
  const result = await callWithTimeout(
    () => fetchQuote({ symbol, category, allowProductionChartAiBetaLiveQuotes }),
    timeoutMs,
  );
  const latencyMs = now() - startedAtMs;

  if (!result || result.ok !== true) {
    const sanitizedErrorCode =
      result && result.code === 'TIMEOUT' ? SANITIZED_ERROR_CODES.PROVIDER_TIMEOUT : SANITIZED_ERROR_CODES.PROVIDER_UNAVAILABLE;
    return finalize({ sourceStatus: 'unavailable', cacheStatus: 'miss', sanitizedErrorCode, latencyMs });
  }

  const { currentPrice, volume } = result.data ?? {};
  if (typeof currentPrice !== 'number' || !Number.isFinite(currentPrice)) {
    return finalize({ sourceStatus: 'unavailable', cacheStatus: 'miss', sanitizedErrorCode: SANITIZED_ERROR_CODES.MALFORMED_RESPONSE, latencyMs });
  }

  const successPartial = {
    currentPrice,
    volume: typeof volume === 'number' && Number.isFinite(volume) ? volume : null,
    sourceStatus: 'ok',
    cacheStatus: 'miss',
    sanitizedErrorCode: null,
    latencyMs,
  };
  cache.set(category, symbol, { currentPrice: successPartial.currentPrice, volume: successPartial.volume, sourceStatus: 'ok' }, nowMs);
  return finalize(successPartial);
}
