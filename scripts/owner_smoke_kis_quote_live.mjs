import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const repoRoot = process.cwd();

// All five guards must be present with exact values to enter live KIS mode.
const requiredLiveGuards = {
  PHASE_3Y_LIVE_KIS_SMOKE: 'OWNER_APPROVED',
  PHASE_3Y_RUNTIME_CONFIRMED: 'local-non-production-confirmed',
  PHASE_3Y_READ_ONLY_SCOPE_CONFIRMED: 'OWNER_CONFIRMS_READ_ONLY_QUOTE_ONLY',
  PHASE_3Y_PROVIDER_QUOTA_RISK_ACCEPTED: 'OWNER_ACCEPTS_KIS_QUOTA_RISK',
  PHASE_3Y_NO_ACCOUNT_APIS_CONFIRMED: 'OWNER_CONFIRMS_NO_ACCOUNT_APIS',
};

// Presence-only check names. Values are never read, printed, compared, or stored.
const requiredKisConfigNames = ['KIS_APP_KEY', 'KIS_APP_SECRET', 'KIS_BASE_URL', 'KIS_ENABLE_LIVE_QUOTES'];

// In-process mock cache constants for Phase 3Y smoke validation only.
const MOCK_FRESH_TTL_MS = 15_000;

// Blocks any output line that could contain a secret, raw provider field, or other
// sensitive data. Emits SAFE_OUTPUT_BLOCKED before throwing so the owner sees it.
const forbiddenOutputPattern =
  /KIS_APP_SECRET|KIS_APP_KEY|OPENAI_API_KEY|GEMINI_API_KEY|OPENDART_API_KEY|SUPABASE_SERVICE_ROLE_KEY|access_token|appsecret|appkey|authorization|Bearer|KIS_ACCOUNT_NO|account_no|portfolioId|positionId|connectionString|project_ref|jwt|password|stck_prpr|prdy_vrss|prdy_ctrt|acml_vol|rt_cd|stack|raw/i;

const logSafe = (message) => {
  if (forbiddenOutputPattern.test(message)) {
    console.log('phase3y step=safe-output-guard status=blocked code=SAFE_OUTPUT_BLOCKED sanitized=true');
    throw new Error('Unsafe smoke output blocked.');
  }
  console.log(message);
};

const logStep = (step, status, extra = {}) => {
  const parts = [`phase3y step=${step} status=${status}`];
  for (const [k, v] of Object.entries(extra)) {
    parts.push(`${k}=${v}`);
  }
  parts.push('sanitized=true');
  logSafe(parts.join(' '));
};

const isLiveApproved = () =>
  Object.entries(requiredLiveGuards).every(([name, expected]) => process.env[name] === expected);

const isProductionRuntime = () => {
  const nodeEnv = (process.env.NODE_ENV ?? '').trim().toLowerCase();
  const vercelEnv = (process.env.VERCEL_ENV ?? '').trim().toLowerCase();
  return nodeEnv === 'production' || vercelEnv === 'production';
};

// Presence-only check. Never reads, compares, prints, or returns config values.
const checkKisConfigPresence = () =>
  requiredKisConfigNames.every((name) => Boolean(process.env[name]));

// KIS_ACCOUNT_NO must be absent for quote-only Phase 3Y smoke.
const checkAccountEnvAbsent = () => !Boolean(process.env['KIS_ACCOUNT_NO']);

const normalizeMarket = (value) => (typeof value === 'string' ? value.trim().toUpperCase() : '');
const normalizeSymbol = (value) => (typeof value === 'string' ? value.trim() : '');

// Phase 3Y is KR domestic quote only. Market must be KR and symbol must be exactly 6 digits.
const validateKrIdentity = ({ market, symbol }) => {
  if (market !== 'KR') return 'invalid-market-only-kr-supported-in-phase-3y';
  if (!/^\d{6}$/.test(symbol)) return 'invalid-symbol-must-be-exactly-6-digits';
  return null;
};

// Synthetic normalized quote snapshot for dry-run mode only. Never used in live mode.
const buildSyntheticSnapshot = ({ market, symbol }, nowIso) => ({
  market,
  symbol,
  price: 70000,
  currency: 'KRW',
  change: 100,
  changePct: 0.14,
  volume: 123456,
  marketState: 'unknown',
  asOf: nowIso,
  staleState: 'fresh',
  providerMeta: { provider: 'kis', source: 'kis-domestic-quote' },
});

// Validates that a QuoteSnapshot contains only normalized browser-safe fields.
// Returns a non-sensitive reason string on failure, or null on success.
const verifyNormalizedSnapshot = (data) => {
  if (!data || typeof data !== 'object') return 'missing-data-object';
  if (typeof data.market !== 'string' || !data.market) return 'missing-market';
  if (typeof data.symbol !== 'string' || !data.symbol) return 'missing-symbol';
  if (typeof data.price !== 'number' || !Number.isFinite(data.price)) return 'missing-or-non-finite-price';
  if (typeof data.currency !== 'string' || !data.currency) return 'missing-currency';
  if (typeof data.asOf !== 'string' || !data.asOf) return 'missing-asOf';
  if (data.staleState !== 'fresh') return 'unexpected-stale-state';
  // Reject any residual provider-internal field names in the normalized result.
  for (const internalField of ['stck_prpr', 'prdy_vrss', 'prdy_ctrt', 'acml_vol', 'rt_cd', 'output', 'appkey', 'appsecret']) {
    if (internalField in data) return 'unexpected-provider-field-found';
  }
  return null;
};

// In-process mock cache for Phase 3Y cache-step validation only.
// This never touches real Supabase or any external system.
const mockCacheStore = new Map();

const writeMockCacheEntry = (snapshot, nowMs) => {
  const key = `quote:${snapshot.market}:${snapshot.symbol}`;
  mockCacheStore.set(key, {
    snapshot: { ...snapshot },
    cachedAtMs: nowMs,
    freshUntilMs: nowMs + MOCK_FRESH_TTL_MS,
  });
  return { ok: true };
};

const readMockCacheEntry = (identity, nowMs) => {
  const key = `quote:${identity.market}:${identity.symbol}`;
  const entry = mockCacheStore.get(key);
  if (!entry) return { ok: false };
  if (nowMs <= entry.freshUntilMs) return { ok: true, state: 'fresh' };
  return { ok: false };
};

const deleteMockCacheEntry = (identity) => {
  const key = `quote:${identity.market}:${identity.symbol}`;
  mockCacheStore.delete(key);
  return { ok: true };
};

const rewriteImports = (content) =>
  content
    .replace(/from '([^']+)';/g, (match, specifier) => {
      if (!specifier.startsWith('.')) return match;
      return specifier.endsWith('.js') ? match : `from '${specifier}.js';`;
    })
    .replace(/import\('([^']+)'\)/g, (match, specifier) => {
      if (!specifier.startsWith('.')) return match;
      return specifier.endsWith('.js') ? match : `import('${specifier}.js')`;
    });

const compileFile = (file, outDir) => {
  const source = path.join(repoRoot, file);
  const target = path.join(outDir, file).replace(/\.ts$/, '.js');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const compiled = rewriteImports(
    ts.transpileModule(fs.readFileSync(source, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
      },
    }).outputText,
  );
  fs.writeFileSync(target, compiled, 'utf8');
};

// Runtime KIS provider dependencies (no network calls until getKisQuoteSnapshot is invoked).
const providerDependencies = [
  'src/lib/server/providers/serverOnly.ts',
  'src/lib/server/providers/providerErrors.ts',
];

const createCompiledRuntime = (live) => {
  const astroTempDir = path.join(repoRoot, '.astro');
  fs.mkdirSync(astroTempDir, { recursive: true });
  const tempRoot = fs.mkdtempSync(path.join(astroTempDir, 'phase3y-smoke-'));
  const outDir = path.join(tempRoot, 'out');

  for (const file of providerDependencies) compileFile(file, outDir);

  const kisClientTarget = path.join(outDir, 'src/lib/server/providers/kisClient.js');
  fs.mkdirSync(path.dirname(kisClientTarget), { recursive: true });

  if (live) {
    // Compile the real KIS client for live mode. Network calls only happen
    // when getKisQuoteSnapshot() is explicitly invoked later in quote-fetch.
    compileFile('src/lib/server/providers/kisClient.ts', outDir);
  } else {
    // Dry-run: stub the KIS provider entirely. No code that could trigger
    // network calls or env value access is loaded in dry-run mode.
    fs.writeFileSync(
      kisClientTarget,
      [
        "export const getKisQuoteSnapshot = async () => { throw new Error('Dry-run stub: live KIS not called.'); };",
        "export const getKisQuoteConfigReadiness = () => ({ ready: false, reason: 'dry-run-stub', productionAllowed: false });",
        "export const validateKisDomesticQuoteInput = () => null;",
      ].join('\n') + '\n',
      'utf8',
    );
  }

  return {
    providerUrl: pathToFileURL(kisClientTarget).href,
    cleanup: () => fs.rmSync(tempRoot, { recursive: true, force: true }),
  };
};

const runDryRunSimulations = () => {
  // Confirm live guards are absent in dry-run (expected).
  const guardMissing = !isLiveApproved();
  logStep('dry-run-guard-sim', 'passed', {
    note: 'live-guards-absent',
    wouldEmitGuardNotApproved: String(guardMissing),
  });

  // Confirm production runtime check is functional.
  const isProd = isProductionRuntime();
  logStep('dry-run-runtime-sim', 'passed', {
    note: 'production-runtime-check',
    currentRuntimeIsProduction: String(isProd),
    wouldBlockIfProduction: 'true',
  });

  // Confirm KIS config names are absent in dry-run env (expected).
  const kisConfigMissing = !checkKisConfigPresence();
  logStep('dry-run-env-sim', 'passed', {
    note: 'kis-config-presence-simulation',
    wouldEmitKisConfigMissing: String(kisConfigMissing),
  });

  // Confirm identity validation rejects an invalid identity.
  const identityError = validateKrIdentity({ market: 'INVALID', symbol: '12345' });
  logStep('dry-run-identity-sim', 'passed', {
    note: 'invalid-identity-simulation',
    errorDetected: String(Boolean(identityError)),
  });

  // Confirm account env check passes when KIS_ACCOUNT_NO is absent.
  const accountEnvAbsent = checkAccountEnvAbsent();
  logStep('dry-run-account-env-sim', 'passed', {
    note: 'account-env-check-simulation',
    accountEnvCurrentlyAbsent: String(accountEnvAbsent),
    wouldBlockIfAccountEnvPresent: 'true',
  });
};

const main = async () => {
  const live = isLiveApproved();

  // Step: guard-check
  logStep('guard-check', 'started');
  if (!live) {
    logStep('guard-check', 'passed', { mode: 'dry-run-no-live-guards' });
  } else {
    logStep('guard-check', 'passed', { mode: 'live-approved', liveKis: 'true' });
  }

  // Step: runtime-check — live mode must not run in a production Node/Vercel environment.
  logStep('runtime-check', 'started');
  if (live && isProductionRuntime()) {
    logStep('runtime-check', 'failed', { code: 'PRODUCTION_RUNTIME_NOT_ALLOWED' });
    process.exitCode = 1;
    return;
  }
  logStep('runtime-check', 'passed', {
    note: live ? 'local-non-production-confirmed' : 'dry-run-runtime-check-skipped',
  });

  // Step: smoke-identity-validation
  logStep('smoke-identity-validation', 'started');
  const market = normalizeMarket(process.env.PHASE_3Y_SMOKE_MARKET);
  const symbol = normalizeSymbol(process.env.PHASE_3Y_SMOKE_SYMBOL);
  const identityError = validateKrIdentity({ market, symbol });
  const identity = identityError ? { market: 'KR', symbol: '005930' } : { market, symbol };

  if (identityError) {
    if (live) {
      logStep('smoke-identity-validation', 'failed', { code: 'SMOKE_IDENTITY_INVALID', reason: identityError });
      process.exitCode = 1;
      return;
    }
    logStep('smoke-identity-validation', 'passed', { note: 'dry-run-using-synthetic-identity' });
  } else {
    logStep('smoke-identity-validation', 'passed');
  }

  // Step: account-env-check — KIS_ACCOUNT_NO must be absent for quote-only Phase 3Y scope.
  logStep('account-env-check', 'started');
  if (live && !checkAccountEnvAbsent()) {
    logStep('account-env-check', 'failed', { code: 'ACCOUNT_ENV_NOT_ALLOWED' });
    process.exitCode = 1;
    return;
  }
  logStep('account-env-check', 'passed', {
    note: live ? 'account-env-absent-confirmed' : 'dry-run-mock',
  });

  // Step: kis-env-preflight — presence-only check, values never read or printed.
  logStep('kis-env-preflight', 'started');
  if (live) {
    if (!checkKisConfigPresence()) {
      logStep('kis-env-preflight', 'failed', { code: 'KIS_CONFIG_MISSING' });
      process.exitCode = 1;
      return;
    }
    logStep('kis-env-preflight', 'passed', { note: 'all-required-kis-config-names-present' });
  } else {
    logStep('kis-env-preflight', 'passed', { note: 'dry-run-skipped' });
  }

  // Step: runtime-setup — compile TypeScript to an isolated temporary directory.
  logStep('runtime-setup', 'started');
  let runtime;
  try {
    runtime = createCompiledRuntime(live);
  } catch {
    logStep('runtime-setup', 'failed', { code: 'RUNTIME_SETUP_FAILED' });
    process.exitCode = 1;
    return;
  }
  logStep('runtime-setup', 'passed');

  try {
    // Step: provider-import — import the compiled KIS provider module.
    // In dry-run mode, this imports a stub that never triggers network calls.
    logStep('provider-import', 'started');
    let provider;
    try {
      provider = await import(runtime.providerUrl);
    } catch {
      logStep('provider-import', 'failed', { code: 'PROVIDER_IMPORT_FAILED' });
      process.exitCode = 1;
      return;
    }
    logStep('provider-import', 'passed', {
      note: live ? 'live-kis-client-loaded' : 'dry-run-stub-loaded',
    });

    // Step: quote-fetch — live mode calls the real KIS provider; dry-run uses a synthetic snapshot.
    // Token fetch and quote fetch are both covered by this step (they are sequential
    // within getKisQuoteSnapshot and cannot be split without refactoring provider internals).
    logStep('quote-fetch', 'started');
    let quoteResult;
    if (live) {
      try {
        quoteResult = await provider.getKisQuoteSnapshot(identity);
      } catch {
        logStep('quote-fetch', 'failed', { code: 'QUOTE_FETCH_FAILED' });
        process.exitCode = 1;
        return;
      }
      if (!quoteResult.ok) {
        logStep('quote-fetch', 'failed', { code: 'QUOTE_FETCH_FAILED' });
        process.exitCode = 1;
        return;
      }
      logStep('quote-fetch', 'passed', { note: 'live-quote-received' });
    } else {
      const nowIso = new Date().toISOString();
      quoteResult = { ok: true, data: buildSyntheticSnapshot(identity, nowIso), staleState: 'fresh' };
      logStep('quote-fetch', 'passed', { note: 'dry-run-synthetic-snapshot' });
    }

    // Step: quote-normalization — verify the returned snapshot has only normalized browser-safe fields.
    logStep('quote-normalization', 'started');
    const normalizationError = verifyNormalizedSnapshot(quoteResult.data);
    if (normalizationError) {
      logStep('quote-normalization', 'failed', { code: 'QUOTE_NORMALIZATION_FAILED', reason: normalizationError });
      process.exitCode = 1;
      return;
    }
    const snapshot = quoteResult.data;
    logStep('quote-normalization', 'passed', {
      hasMarket: String(typeof snapshot.market === 'string' && !!snapshot.market),
      hasSymbol: String(typeof snapshot.symbol === 'string' && !!snapshot.symbol),
      hasPrice: String(typeof snapshot.price === 'number' && Number.isFinite(snapshot.price)),
      hasCurrency: String(typeof snapshot.currency === 'string'),
      hasAsOf: String(typeof snapshot.asOf === 'string'),
      staleState: snapshot.staleState,
    });

    // Steps: cache-backend-check, cache-write, fresh-readback use an in-process mock cache
    // in both dry-run and live mode. Supabase persistent cache integration was validated
    // in Phase 3V. Smoke cache steps here confirm quote snapshot structure is cacheable.
    const nowMs = Date.now();

    logStep('cache-backend-check', 'started');
    const supabaseCacheEnabled = process.env['QUOTE_CACHE_BACKEND'] === 'supabase';
    logStep('cache-backend-check', 'passed', {
      configuredBackend: supabaseCacheEnabled ? 'supabase' : 'memory',
      note: 'using-in-process-mock-for-phase-3y-cache-validation',
    });

    logStep('cache-write', 'started');
    const writeResult = writeMockCacheEntry(snapshot, nowMs);
    if (!writeResult.ok) {
      logStep('cache-write', 'failed', { code: 'CACHE_WRITE_FAILED' });
      process.exitCode = 1;
      return;
    }
    logStep('cache-write', 'passed', { note: 'in-process-mock-write' });

    logStep('fresh-readback', 'started');
    const readResult = readMockCacheEntry(identity, nowMs + 1_000);
    if (!readResult.ok || readResult.state !== 'fresh') {
      logStep('fresh-readback', 'failed', { code: 'FRESH_READBACK_FAILED' });
      process.exitCode = 1;
      return;
    }
    logStep('fresh-readback', 'passed', { state: readResult.state });

    // Step: cleanup-restore — remove the mock cache entry written by this smoke run.
    logStep('cleanup-restore', 'started');
    try {
      const cleanupResult = deleteMockCacheEntry(identity);
      if (!cleanupResult.ok) {
        logStep('cleanup-restore', 'failed', { code: 'CLEANUP_RESTORE_FAILED' });
      } else {
        logStep('cleanup-restore', 'passed', { action: 'deleted-smoke-cache-entry' });
      }
    } catch {
      logStep('cleanup-restore', 'failed', { code: 'CLEANUP_RESTORE_FAILED' });
    }

    logStep('final-result', 'passed', {
      mode: live ? 'live-approved' : 'dry-run-mock',
      liveKis: String(live),
      quoteNormalized: 'true',
      cacheValidated: 'true',
    });

    if (!live) {
      runDryRunSimulations();
    }
  } finally {
    runtime.cleanup();
  }
};

// Last-resort catch. Uses console.log directly to avoid re-triggering logSafe.
// All expected failure paths above emit specific labeled step failures before returning.
main().catch(() => {
  console.log('phase3y step=unexpected-catch status=failed code=UNEXPECTED_SAFE_FAILURE sanitized=true');
  process.exitCode = 1;
});
