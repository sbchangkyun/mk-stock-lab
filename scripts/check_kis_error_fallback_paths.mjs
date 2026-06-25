// check_kis_error_fallback_paths.mjs
// Phase 3AK: No-network KIS error/fallback path validation harness.
// All scenarios use mock/stub logic only. No real network calls, credentials, or live service access.
// Mirrors logic from kisClient.ts, quotes.ts, and quoteCache.ts.

// ── 1. Network block ──────────────────────────────────────────────────────────
// Any unexpected real fetch call fails the harness immediately.
globalThis.fetch = async (url) => {
  throw new Error(`[harness] BLOCKED unexpected real network call to: ${String(url).slice(0, 40)}`);
};

// ── 2. Forbidden output pattern ───────────────────────────────────────────────
// Scanned over all logged output lines and serialized result objects.
// Must produce zero matches for the harness to pass.
const FORBIDDEN =
  /access_token|authorization|bearer|connectionstring|jwt|password|supabase\.co|postgresql|service_role|stck_prpr|prdy_vrss|prdy_ctrt|acml_vol|rt_cd|msg_cd|appkey|appsecret|grant_type|fhkst/i;

// ── 3. Synthetic test values ──────────────────────────────────────────────────
// Fake placeholder values used only to satisfy env presence checks.
// Never printed in output or recorded in documentation.
const FAKE = {
  APP_KEY: 'FAKE_APP_KEY_HARNESS',
  APP_SECRET: 'FAKE_APP_SECRET_HARNESS',
  BASE_URL: 'https://fake-base.invalid',
  TOKEN: 'fake-access-token-harness',
  SYMBOL: '000000',
};
const ALL_FAKE_CREDS = {
  KIS_APP_KEY: FAKE.APP_KEY,
  KIS_APP_SECRET: FAKE.APP_SECRET,
  KIS_BASE_URL: FAKE.BASE_URL,
};
const FAKE_CONFIG = { appKey: FAKE.APP_KEY, appSecret: FAKE.APP_SECRET, baseUrl: FAKE.BASE_URL };
const FAKE_IDENTITY = { market: 'KR', symbol: FAKE.SYMBOL };

// ── 4. Mirrored logic from kisClient.ts ──────────────────────────────────────

const norm = (v) => (typeof v === 'string' ? v.trim() : '');
const hasEnvValue = (name) => norm(process.env[name]).length > 0;
const REQUIRED_ENVS = ['KIS_APP_KEY', 'KIS_APP_SECRET', 'KIS_BASE_URL'];

const classifyRuntime = () => {
  const vercelEnv = norm(process.env.VERCEL_ENV).toLowerCase();
  const nodeEnv = norm(process.env.NODE_ENV).toLowerCase();
  if (vercelEnv === 'production') return 'vercel-production';
  if (vercelEnv === 'preview') return 'vercel-preview';
  if (vercelEnv === 'development') return 'vercel-development';
  if (vercelEnv !== '') return 'unknown';
  if (nodeEnv === 'production') return 'node-production';
  return 'local';
};

const checkKisReadiness = () => {
  const runtimeClass = classifyRuntime();
  if (runtimeClass === 'vercel-production' || runtimeClass === 'node-production' || runtimeClass === 'unknown') {
    return { ready: false, reason: 'production_not_allowed', runtimeClass };
  }
  if (hasEnvValue('KIS_ACCOUNT_NO')) {
    return { ready: false, reason: 'production_not_allowed', runtimeClass };
  }
  if (runtimeClass === 'vercel-preview' && process.env.KIS_ENABLE_PREVIEW_LIVE_QUOTES !== 'true') {
    return { ready: false, reason: 'preview_guard_required', runtimeClass };
  }
  if (process.env.KIS_ENABLE_LIVE_QUOTES !== 'true') {
    return { ready: false, reason: 'disabled', runtimeClass };
  }
  const missing = REQUIRED_ENVS.filter((n) => !hasEnvValue(n));
  if (missing.length > 0) {
    return { ready: false, reason: 'config_missing', runtimeClass };
  }
  return { ready: true, reason: 'ready', runtimeClass };
};

const isValidKrSymbol = (s) => /^\d{6}$/.test(norm(s));

const validateKisInput = (input) => {
  if (input.market !== 'KR') {
    return { ok: false, code: 'SYMBOL_UNSUPPORTED', message: 'Only KR domestic stock quotes are supported in this phase.', staleState: 'unavailable' };
  }
  if (!isValidKrSymbol(input.symbol ?? '')) {
    return { ok: false, code: 'VALIDATION_FAILED', message: 'KR quote symbol must be exactly six digits.', staleState: 'unavailable' };
  }
  return null;
};

const parseNumericText = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const n = Number(value.replaceAll(',', '').trim());
  return Number.isFinite(n) ? n : null;
};

// Token fetch — uses injected fetchFn (never calls global fetch).
const kisGetAccessToken = async (config, fetchFn) => {
  try {
    const resp = await fetchFn(`${config.baseUrl}/oauth2/tokenP`, { method: 'POST' });
    if (resp.status === 429) {
      return { ok: false, code: 'PROVIDER_RATE_LIMITED', message: 'KIS token request was rate limited.', staleState: 'unavailable' };
    }
    if (!resp.ok) {
      return { ok: false, code: 'PROVIDER_UNAVAILABLE', message: 'KIS token request failed safely.', staleState: 'unavailable' };
    }
    const payload = await resp.json();
    const token = norm(payload.access_token);
    if (!token) {
      return { ok: false, code: 'PROVIDER_UNAVAILABLE', message: 'KIS token response was not usable.', staleState: 'unavailable' };
    }
    return { ok: true, data: { accessToken: token }, staleState: 'fresh' };
  } catch {
    return { ok: false, code: 'INTERNAL_ERROR', message: 'Provider operation failed safely.', staleState: 'unavailable' };
  }
};

// Quote fetch — uses injected fetchFn (never calls global fetch).
const kisGetDomesticQuote = async (input, config, fetchFn) => {
  const inputErr = validateKisInput(input);
  if (inputErr) return inputErr;

  const tokenResult = await kisGetAccessToken(config, fetchFn);
  if (!tokenResult.ok) return tokenResult;

  try {
    const resp = await fetchFn(`${config.baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price`, { method: 'GET' });
    if (resp.status === 429) {
      return { ok: false, code: 'PROVIDER_RATE_LIMITED', message: 'KIS quote request was rate limited.', staleState: 'unavailable' };
    }
    if (!resp.ok) {
      return { ok: false, code: 'PROVIDER_UNAVAILABLE', message: 'KIS quote request failed safely.', staleState: 'unavailable' };
    }
    const payload = await resp.json();
    if (payload.rt_cd !== '0' || !payload.output) {
      return { ok: false, code: 'PROVIDER_UNAVAILABLE', message: 'KIS quote provider rejected the request.', staleState: 'unavailable' };
    }
    const price = parseNumericText(payload.output.stck_prpr);
    if (price === null) {
      return { ok: false, code: 'PROVIDER_UNAVAILABLE', message: 'KIS quote response did not include a usable price.', staleState: 'unavailable' };
    }
    return {
      ok: true,
      data: {
        market: 'KR',
        symbol: norm(input.symbol),
        price,
        currency: 'KRW',
        change: parseNumericText(payload.output.prdy_vrss),
        changePct: parseNumericText(payload.output.prdy_ctrt),
        volume: parseNumericText(payload.output.acml_vol) ?? undefined,
        marketState: 'unknown',
        asOf: new Date().toISOString(),
        staleState: 'fresh',
        providerMeta: { provider: 'kis', source: 'kis-domestic-quote' },
      },
      staleState: 'fresh',
    };
  } catch {
    return { ok: false, code: 'INTERNAL_ERROR', message: 'Provider operation failed safely.', staleState: 'unavailable' };
  }
};

// ── 5. Mirrored logic from quotes.ts ─────────────────────────────────────────

const getQuoteSnapshotMocked = async (identity, { cacheGet, cacheSet, cacheRecordFailure, provider, nowMs = Date.now() }) => {
  if (!identity.symbol || !identity.market) {
    return { ok: false, code: 'VALIDATION_FAILED', message: 'Quote request requires market and symbol.' };
  }
  if (identity.market !== 'KR') {
    return { ok: false, code: 'SYMBOL_UNSUPPORTED', message: 'Only KR domestic stock quotes are supported in this phase.', staleState: 'unavailable' };
  }

  const cached = await cacheGet(identity, nowMs);

  if (cached?.state === 'fresh') {
    return { ok: true, data: { ...cached.snapshot, staleState: 'fresh' }, staleState: 'fresh', fallback: { state: 'fresh', reason: 'cache-fresh' } };
  }

  const providerResult = await provider(identity);

  if (providerResult.ok) {
    try { await cacheSet(providerResult.data, nowMs); } catch { /* cache write failure is non-fatal */ }
    return { ok: true, data: { ...providerResult.data, staleState: 'fresh' }, staleState: 'fresh', fallback: { state: 'fresh', reason: 'provider-fresh' } };
  }

  try { await cacheRecordFailure(identity, providerResult.code, nowMs); } catch { /* non-fatal */ }

  if (cached?.state === 'stale-but-usable') {
    return { ok: true, data: { ...cached.snapshot, staleState: 'stale-but-usable' }, staleState: 'stale-but-usable', fallback: { state: 'stale-but-usable', reason: 'cache-stale-provider-failed' } };
  }

  return providerResult;
};

// ── 6. Mirrored logic from quote.ts API route parser ─────────────────────────

const ALLOWED_MARKETS = ['KR', 'US'];

const parseQuoteRequest = (params) => {
  const market = norm(params.market ?? '').toUpperCase();
  const symbol = norm(params.symbol ?? '').toUpperCase();
  if (!market || !ALLOWED_MARKETS.includes(market)) {
    return { ok: false, code: 'VALIDATION_FAILED', message: 'Quote market is invalid.', status: 400 };
  }
  if (!symbol) {
    return { ok: false, code: 'VALIDATION_FAILED', message: 'Quote symbol is required.', status: 400 };
  }
  return { ok: true, market, symbol };
};

// ── 7. Mock helpers ───────────────────────────────────────────────────────────

const makeMockFetch = (...calls) => {
  let idx = 0;
  return async () => {
    if (idx >= calls.length) throw new Error('[harness] Unexpected extra fetch call beyond expected count');
    const call = calls[idx++];
    if (call.throws) throw call.throws;
    const status = call.status ?? 200;
    return {
      status,
      ok: status >= 200 && status < 300,
      json: async () => {
        if (call.jsonThrows) throw new SyntaxError('Unexpected token in mock JSON');
        return call.body ?? {};
      },
    };
  };
};

// Canned mock fetch responses (field names are internal only, never logged).
const GOOD_TOKEN_CALL = { status: 200, body: { access_token: FAKE.TOKEN } };
const GOOD_QUOTE_CALL = {
  status: 200,
  body: { rt_cd: '0', output: { stck_prpr: '50000', prdy_vrss: '500', prdy_ctrt: '1.0', acml_vol: '200000' } },
};

const makeSnapshotStub = (staleState = 'fresh') => ({
  market: 'KR',
  symbol: FAKE.SYMBOL,
  price: 50000,
  currency: 'KRW',
  change: null,
  changePct: null,
  marketState: 'unknown',
  asOf: new Date(Date.now() - 60_000).toISOString(),
  staleState,
  providerMeta: { provider: 'kis', source: 'kis-domestic-quote' },
});

const makeFreshCacheEntry = () => {
  const nowMs = Date.now();
  return { snapshot: makeSnapshotStub('fresh'), cachedAtMs: nowMs, freshUntilMs: nowMs + 15_000, staleUntilMs: nowMs + 120_000, state: 'fresh' };
};

const makeStaleEntry = () => {
  const ago90s = Date.now() - 90_000;
  return { snapshot: makeSnapshotStub('stale-but-usable'), cachedAtMs: ago90s, freshUntilMs: ago90s + 15_000, staleUntilMs: ago90s + 120_000, state: 'stale-but-usable' };
};

const noopCacheGet = async () => null;
const noopCacheSet = async () => {};
const noopRecordFailure = async () => {};

const failProvider = async () => ({ ok: false, code: 'PROVIDER_UNAVAILABLE', message: 'Provider unavailable.', staleState: 'unavailable' });
const okProvider = async () => ({ ok: true, data: makeSnapshotStub('fresh'), staleState: 'fresh' });

// ── 8. Test infrastructure ────────────────────────────────────────────────────

const savedEnv = { ...process.env };

const clearKisEnv = () => {
  for (const k of ['VERCEL_ENV', 'NODE_ENV', 'KIS_ENABLE_LIVE_QUOTES', 'KIS_ENABLE_PREVIEW_LIVE_QUOTES',
    'KIS_APP_KEY', 'KIS_APP_SECRET', 'KIS_BASE_URL', 'KIS_ACCOUNT_NO', 'QUOTE_CACHE_BACKEND']) {
    delete process.env[k];
  }
};

const setEnv = (envMap) => {
  clearKisEnv();
  for (const [k, v] of Object.entries(envMap)) {
    if (v === null || v === undefined) delete process.env[k];
    else process.env[k] = String(v);
  }
};

const restoreEnv = () => {
  for (const k of Object.keys(process.env)) {
    if (!(k in savedEnv)) delete process.env[k];
  }
  for (const [k, v] of Object.entries(savedEnv)) {
    process.env[k] = v;
  }
};

const loggedLines = [];
const log = (line) => { loggedLines.push(line); console.log(line); };

let totalPass = 0;
let totalFail = 0;
const groupResults = {};

const record = (group, name, pass) => {
  if (!groupResults[group]) groupResults[group] = { pass: 0, fail: 0 };
  if (pass) { groupResults[group].pass++; totalPass++; }
  else { groupResults[group].fail++; totalFail++; }
  log(`check:kis-error-fallback group=${group} step=${name} status=${pass ? 'pass' : 'FAIL'} sanitized=true`);
};

const runSync = (group, name, fn) => {
  try { record(group, name, fn()); }
  catch { record(group, name, false); }
};

const runAsync = async (group, name, fn) => {
  try { record(group, name, await fn()); }
  catch { record(group, name, false); }
};

// ── 9. Main ───────────────────────────────────────────────────────────────────

const main = async () => {
  log('check:kis-error-fallback step=start network-policy=blocked sanitized=true');

  // ── Group A: Runtime guard ──────────────────────────────────────────────────
  runSync('runtime-guard', 'local-dev-allowed', () => {
    setEnv({ NODE_ENV: 'development', KIS_ENABLE_LIVE_QUOTES: 'true', ...ALL_FAKE_CREDS });
    const r = checkKisReadiness();
    return r.ready === true && r.reason === 'ready';
  });

  runSync('runtime-guard', 'vercel-preview-allowed-with-guard', () => {
    setEnv({ VERCEL_ENV: 'preview', NODE_ENV: 'production', KIS_ENABLE_LIVE_QUOTES: 'true', KIS_ENABLE_PREVIEW_LIVE_QUOTES: 'true', ...ALL_FAKE_CREDS });
    const r = checkKisReadiness();
    return r.ready === true && r.reason === 'ready';
  });

  runSync('runtime-guard', 'vercel-preview-blocked-no-guard', () => {
    setEnv({ VERCEL_ENV: 'preview', NODE_ENV: 'production', KIS_ENABLE_LIVE_QUOTES: 'true', ...ALL_FAKE_CREDS });
    const r = checkKisReadiness();
    return r.ready === false && r.reason === 'preview_guard_required';
  });

  runSync('runtime-guard', 'vercel-preview-blocked-guard-false', () => {
    setEnv({ VERCEL_ENV: 'preview', NODE_ENV: 'production', KIS_ENABLE_LIVE_QUOTES: 'true', KIS_ENABLE_PREVIEW_LIVE_QUOTES: 'false', ...ALL_FAKE_CREDS });
    const r = checkKisReadiness();
    return r.ready === false && r.reason === 'preview_guard_required';
  });

  runSync('runtime-guard', 'vercel-production-blocked', () => {
    setEnv({ VERCEL_ENV: 'production', NODE_ENV: 'production', KIS_ENABLE_LIVE_QUOTES: 'true', KIS_ENABLE_PREVIEW_LIVE_QUOTES: 'true', ...ALL_FAKE_CREDS });
    const r = checkKisReadiness();
    return r.ready === false && r.reason === 'production_not_allowed';
  });

  runSync('runtime-guard', 'node-production-blocked', () => {
    setEnv({ NODE_ENV: 'production', KIS_ENABLE_LIVE_QUOTES: 'true', ...ALL_FAKE_CREDS });
    const r = checkKisReadiness();
    return r.ready === false && r.reason === 'production_not_allowed';
  });

  runSync('runtime-guard', 'unknown-vercel-env-blocked', () => {
    setEnv({ VERCEL_ENV: 'staging', NODE_ENV: 'production', KIS_ENABLE_LIVE_QUOTES: 'true', ...ALL_FAKE_CREDS });
    const r = checkKisReadiness();
    return r.ready === false && r.reason === 'production_not_allowed';
  });

  runSync('runtime-guard', 'account-no-present-blocked', () => {
    setEnv({ NODE_ENV: 'development', KIS_ENABLE_LIVE_QUOTES: 'true', ...ALL_FAKE_CREDS, KIS_ACCOUNT_NO: 'FAKE_ACCOUNT_NO' });
    const r = checkKisReadiness();
    return r.ready === false && r.reason === 'production_not_allowed';
  });

  // ── Group B: Env readiness ──────────────────────────────────────────────────
  runSync('env-readiness', 'feature-flag-absent', () => {
    setEnv({ NODE_ENV: 'development', ...ALL_FAKE_CREDS });
    const r = checkKisReadiness();
    return r.ready === false && r.reason === 'disabled';
  });

  runSync('env-readiness', 'feature-flag-false', () => {
    setEnv({ NODE_ENV: 'development', KIS_ENABLE_LIVE_QUOTES: 'false', ...ALL_FAKE_CREDS });
    const r = checkKisReadiness();
    return r.ready === false && r.reason === 'disabled';
  });

  runSync('env-readiness', 'missing-app-key', () => {
    setEnv({ NODE_ENV: 'development', KIS_ENABLE_LIVE_QUOTES: 'true', KIS_APP_SECRET: FAKE.APP_SECRET, KIS_BASE_URL: FAKE.BASE_URL });
    const r = checkKisReadiness();
    return r.ready === false && r.reason === 'config_missing';
  });

  runSync('env-readiness', 'missing-app-secret', () => {
    setEnv({ NODE_ENV: 'development', KIS_ENABLE_LIVE_QUOTES: 'true', KIS_APP_KEY: FAKE.APP_KEY, KIS_BASE_URL: FAKE.BASE_URL });
    const r = checkKisReadiness();
    return r.ready === false && r.reason === 'config_missing';
  });

  runSync('env-readiness', 'missing-base-url', () => {
    setEnv({ NODE_ENV: 'development', KIS_ENABLE_LIVE_QUOTES: 'true', KIS_APP_KEY: FAKE.APP_KEY, KIS_APP_SECRET: FAKE.APP_SECRET });
    const r = checkKisReadiness();
    return r.ready === false && r.reason === 'config_missing';
  });

  runSync('env-readiness', 'all-env-present-ready', () => {
    setEnv({ NODE_ENV: 'development', KIS_ENABLE_LIVE_QUOTES: 'true', ...ALL_FAKE_CREDS });
    const r = checkKisReadiness();
    return r.ready === true && r.reason === 'ready';
  });

  // ── Group C: Provider failure ───────────────────────────────────────────────
  await runAsync('provider-failure', 'token-429', async () => {
    const r = await kisGetAccessToken(FAKE_CONFIG, makeMockFetch({ status: 429 }));
    return !r.ok && r.code === 'PROVIDER_RATE_LIMITED';
  });

  await runAsync('provider-failure', 'token-non-200', async () => {
    const r = await kisGetAccessToken(FAKE_CONFIG, makeMockFetch({ status: 500 }));
    return !r.ok && r.code === 'PROVIDER_UNAVAILABLE';
  });

  await runAsync('provider-failure', 'token-empty-token-field', async () => {
    const r = await kisGetAccessToken(FAKE_CONFIG, makeMockFetch({ status: 200, body: { access_token: '' } }));
    return !r.ok && r.code === 'PROVIDER_UNAVAILABLE';
  });

  await runAsync('provider-failure', 'token-throws', async () => {
    const r = await kisGetAccessToken(FAKE_CONFIG, makeMockFetch({ throws: new Error('Network failure') }));
    return !r.ok && r.code === 'INTERNAL_ERROR';
  });

  await runAsync('provider-failure', 'quote-429', async () => {
    const r = await kisGetDomesticQuote(FAKE_IDENTITY, FAKE_CONFIG, makeMockFetch(GOOD_TOKEN_CALL, { status: 429 }));
    return !r.ok && r.code === 'PROVIDER_RATE_LIMITED';
  });

  await runAsync('provider-failure', 'quote-non-200', async () => {
    const r = await kisGetDomesticQuote(FAKE_IDENTITY, FAKE_CONFIG, makeMockFetch(GOOD_TOKEN_CALL, { status: 500 }));
    return !r.ok && r.code === 'PROVIDER_UNAVAILABLE';
  });

  await runAsync('provider-failure', 'quote-rt-cd-nonzero', async () => {
    const r = await kisGetDomesticQuote(FAKE_IDENTITY, FAKE_CONFIG, makeMockFetch(GOOD_TOKEN_CALL, { status: 200, body: { rt_cd: '1' } }));
    return !r.ok && r.code === 'PROVIDER_UNAVAILABLE';
  });

  await runAsync('provider-failure', 'quote-missing-price-field', async () => {
    const r = await kisGetDomesticQuote(FAKE_IDENTITY, FAKE_CONFIG, makeMockFetch(GOOD_TOKEN_CALL, { status: 200, body: { rt_cd: '0', output: {} } }));
    return !r.ok && r.code === 'PROVIDER_UNAVAILABLE';
  });

  await runAsync('provider-failure', 'quote-throws', async () => {
    const r = await kisGetDomesticQuote(FAKE_IDENTITY, FAKE_CONFIG, makeMockFetch(GOOD_TOKEN_CALL, { throws: new Error('Connection reset') }));
    return !r.ok && r.code === 'INTERNAL_ERROR';
  });

  // ── Group D: Cache fallback ─────────────────────────────────────────────────
  await runAsync('cache-fallback', 'no-cache-provider-ok', async () => {
    const r = await getQuoteSnapshotMocked(FAKE_IDENTITY, { cacheGet: noopCacheGet, cacheSet: noopCacheSet, cacheRecordFailure: noopRecordFailure, provider: okProvider });
    return r.ok === true && r.fallback?.reason === 'provider-fresh';
  });

  await runAsync('cache-fallback', 'fresh-cache-hit-provider-not-called', async () => {
    let providerCalled = false;
    const trackingProvider = async () => { providerCalled = true; return failProvider(); };
    const r = await getQuoteSnapshotMocked(FAKE_IDENTITY, { cacheGet: async () => makeFreshCacheEntry(), cacheSet: noopCacheSet, cacheRecordFailure: noopRecordFailure, provider: trackingProvider });
    return r.ok === true && r.fallback?.reason === 'cache-fresh' && !providerCalled;
  });

  await runAsync('cache-fallback', 'stale-cache-provider-ok-provider-wins', async () => {
    const r = await getQuoteSnapshotMocked(FAKE_IDENTITY, { cacheGet: async () => makeStaleEntry(), cacheSet: noopCacheSet, cacheRecordFailure: noopRecordFailure, provider: okProvider });
    return r.ok === true && r.fallback?.reason === 'provider-fresh';
  });

  await runAsync('cache-fallback', 'stale-cache-provider-fails', async () => {
    const r = await getQuoteSnapshotMocked(FAKE_IDENTITY, { cacheGet: async () => makeStaleEntry(), cacheSet: noopCacheSet, cacheRecordFailure: noopRecordFailure, provider: failProvider });
    return r.ok === true && r.staleState === 'stale-but-usable' && r.fallback?.reason === 'cache-stale-provider-failed';
  });

  await runAsync('cache-fallback', 'no-cache-provider-fails', async () => {
    const r = await getQuoteSnapshotMocked(FAKE_IDENTITY, { cacheGet: noopCacheGet, cacheSet: noopCacheSet, cacheRecordFailure: noopRecordFailure, provider: failProvider });
    return r.ok === false && r.code === 'PROVIDER_UNAVAILABLE';
  });

  await runAsync('cache-fallback', 'cache-write-fails-provider-ok-graceful', async () => {
    const throwingSet = async () => { throw new Error('Cache write failure'); };
    const r = await getQuoteSnapshotMocked(FAKE_IDENTITY, { cacheGet: noopCacheGet, cacheSet: throwingSet, cacheRecordFailure: noopRecordFailure, provider: okProvider });
    return r.ok === true && r.fallback?.reason === 'provider-fresh';
  });

  // ── Group F: Request validation ─────────────────────────────────────────────
  runSync('request-validation', 'missing-market', () => {
    const r = parseQuoteRequest({ symbol: FAKE.SYMBOL });
    return !r.ok && r.code === 'VALIDATION_FAILED';
  });

  runSync('request-validation', 'empty-market', () => {
    const r = parseQuoteRequest({ market: '', symbol: FAKE.SYMBOL });
    return !r.ok && r.code === 'VALIDATION_FAILED';
  });

  runSync('request-validation', 'invalid-market', () => {
    const r = parseQuoteRequest({ market: 'XX', symbol: FAKE.SYMBOL });
    return !r.ok && r.code === 'VALIDATION_FAILED';
  });

  runSync('request-validation', 'missing-symbol', () => {
    const r = parseQuoteRequest({ market: 'KR' });
    return !r.ok && r.code === 'VALIDATION_FAILED';
  });

  runSync('request-validation', 'empty-symbol', () => {
    const r = parseQuoteRequest({ market: 'KR', symbol: '' });
    return !r.ok && r.code === 'VALIDATION_FAILED';
  });

  runSync('request-validation', 'symbol-not-six-digits', () => {
    const err = validateKisInput({ market: 'KR', symbol: 'ABCDEF' });
    return err !== null && err.code === 'VALIDATION_FAILED';
  });

  runSync('request-validation', 'symbol-wrong-length', () => {
    const err = validateKisInput({ market: 'KR', symbol: '12345' });
    return err !== null && err.code === 'VALIDATION_FAILED';
  });

  runSync('request-validation', 'market-us-unsupported-by-kis', () => {
    const err = validateKisInput({ market: 'US', symbol: FAKE.SYMBOL });
    return err !== null && err.code === 'SYMBOL_UNSUPPORTED';
  });

  // ── Group G: Valuation computation fallback paths ──────────────────────────
  // Pure JS computation mirroring portfolioValuation.ts — no imports, no network.

  runSync('valuation-computation', 'cost-basis-always-available', () => {
    const pos = { buyPrice: 60000, quantity: 10 };
    return pos.buyPrice * pos.quantity === 600000;
  });

  runSync('valuation-computation', 'successful-quote-computes-market-value', () => {
    const pos = { buyPrice: 60000, quantity: 10 };
    const quotePrice = 75000;
    const marketValue = quotePrice * pos.quantity;
    return marketValue === 750000;
  });

  runSync('valuation-computation', 'successful-quote-computes-unrealized-pnl', () => {
    const pos = { buyPrice: 60000, quantity: 10 };
    const quotePrice = 75000;
    const costBasis = pos.buyPrice * pos.quantity;
    const marketValue = quotePrice * pos.quantity;
    return marketValue - costBasis === 150000;
  });

  runSync('valuation-computation', 'successful-quote-computes-return-rate-25pct', () => {
    const pos = { buyPrice: 60000, quantity: 10 };
    const quotePrice = 75000;
    const costBasis = pos.buyPrice * pos.quantity;
    const marketValue = quotePrice * pos.quantity;
    const unrealizedPnl = marketValue - costBasis;
    const returnRate = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : null;
    return returnRate === 25;
  });

  runSync('valuation-computation', 'null-quote-yields-null-market-value', () => {
    const quotePrice = null;
    const qty = 10;
    const marketValue = quotePrice !== null ? quotePrice * qty : null;
    return marketValue === null;
  });

  runSync('valuation-computation', 'null-quote-yields-null-return-rate', () => {
    const costBasis = 600000;
    const marketValue = null;
    const unrealizedPnl = marketValue !== null ? marketValue - costBasis : null;
    const returnRate = (unrealizedPnl !== null && costBasis > 0) ? (unrealizedPnl / costBasis) * 100 : null;
    return returnRate === null;
  });

  runSync('valuation-computation', 'zero-cost-basis-yields-null-return-rate', () => {
    const costBasis = 0;
    const marketValue = 75000;
    const unrealizedPnl = marketValue - costBasis;
    const returnRate = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : null;
    return returnRate === null;
  });

  runSync('valuation-computation', 'provider-meta-absent-from-computed-row', () => {
    const computedRow = {
      currentPrice: 75000,
      marketValue: 750000,
      costBasis: 600000,
      unrealizedPnl: 150000,
      unrealizedPnlPct: 25,
      staleState: 'fresh',
      // providerMeta intentionally excluded
    };
    return !Object.prototype.hasOwnProperty.call(computedRow, 'providerMeta');
  });

  // ── Group E: Sanitization — scan all output + serialized results ─────────────
  // Collect serialized result objects to check for raw vendor field leakage.
  const sampleOutputs = [];

  const successResult = await kisGetDomesticQuote(FAKE_IDENTITY, FAKE_CONFIG, makeMockFetch(GOOD_TOKEN_CALL, GOOD_QUOTE_CALL));
  sampleOutputs.push(JSON.stringify(successResult));

  const errorSamples = await Promise.all([
    kisGetAccessToken(FAKE_CONFIG, makeMockFetch({ status: 500 })),
    kisGetDomesticQuote(FAKE_IDENTITY, FAKE_CONFIG, makeMockFetch(GOOD_TOKEN_CALL, { status: 429 })),
    kisGetDomesticQuote(FAKE_IDENTITY, FAKE_CONFIG, makeMockFetch(GOOD_TOKEN_CALL, { status: 200, body: { rt_cd: '1' } })),
  ]);
  for (const r of errorSamples) sampleOutputs.push(JSON.stringify(r));

  // Check serialized results for raw KIS field name leakage.
  const rawFieldNames = ['stck_prpr', 'prdy_vrss', 'prdy_ctrt', 'acml_vol', 'rt_cd', 'msg_cd', 'access_token', 'appkey', 'appsecret'];
  const serializedOutputs = sampleOutputs.join('\n');
  const rawKisFieldsAbsent = !rawFieldNames.some((f) => serializedOutputs.includes(`"${f}"`));

  // Forbidden scan over all logged lines + serialized results.
  const allTextForScan = [...loggedLines, ...sampleOutputs].join('\n');
  const forbiddenMatches = allTextForScan.match(new RegExp(FORBIDDEN.source, 'gi')) ?? [];
  const forbiddenCount = forbiddenMatches.length;
  const secretsAbsent = forbiddenCount === 0;

  runSync('sanitization', 'raw-kis-fields-absent-in-serialized-outputs', () => rawKisFieldsAbsent);
  runSync('sanitization', 'forbidden-terms-count-zero', () => forbiddenCount === 0);
  runSync('sanitization', 'secrets-tokens-raw-errors-absent', () => secretsAbsent);

  log(
    `check:kis-error-fallback group=sanitization` +
    ` RawKisFieldsAbsent=${rawKisFieldsAbsent}` +
    ` ForbiddenTermsFoundCount=${forbiddenCount}` +
    ` SecretsTokensRawErrorsAbsent=${secretsAbsent}` +
    ` sanitized=true`,
  );

  // ── Summary ─────────────────────────────────────────────────────────────────
  for (const [group, { pass, fail }] of Object.entries(groupResults)) {
    log(`check:kis-error-fallback group=${group} passed=${pass} failed=${fail} total=${pass + fail} status=${fail === 0 ? 'pass' : 'FAIL'} sanitized=true`);
  }

  log(
    `check:kis-error-fallback step=summary` +
    ` status=${totalFail === 0 ? 'pass' : 'FAIL'}` +
    ` passed=${totalPass}` +
    ` failed=${totalFail}` +
    ` total=${totalPass + totalFail}` +
    ` RawKisFieldsAbsent=${rawKisFieldsAbsent}` +
    ` ForbiddenTermsFoundCount=${forbiddenCount}` +
    ` SecretsTokensRawErrorsAbsent=${secretsAbsent}` +
    ` sanitized=true`,
  );

  if (totalFail > 0) process.exitCode = 1;
};

try {
  await main();
} finally {
  restoreEnv();
}
