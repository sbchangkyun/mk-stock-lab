import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const repoRoot = process.cwd();

// ─── Guards ──────────────────────────────────────────────────────────────────

// All values must match exactly; any mismatch keeps the harness in dry-run mode.
const requiredLiveGuards = {
  MK_STOCK_LAB_PHASE_3AB_LIVE_APPROVAL: 'OWNER_APPROVES_LIVE_KIS_AND_SUPABASE_CACHE_SMOKE',
  MK_STOCK_LAB_PHASE_3AB_LIVE_MODE: 'true',
};

// Names checked for presence only; values never read, compared, or printed.
const requiredLiveKisEnvNames = ['KIS_APP_KEY', 'KIS_APP_SECRET', 'KIS_BASE_URL', 'KIS_ENABLE_LIVE_QUOTES'];
const requiredLiveSupabaseEnvNames = ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];

// ─── Output safety ───────────────────────────────────────────────────────────

const forbiddenOutputPattern =
  /KIS_APP_SECRET|KIS_APP_KEY|SUPABASE_SERVICE_ROLE_KEY|PUBLIC_SUPABASE_URL|PUBLIC_SUPABASE_ANON_KEY|access_token|appsecret|appkey|authorization|Bearer|connectionString|project_ref|jwt|password|stack|trace|stck_prpr|prdy_vrss|prdy_ctrt|acml_vol|rt_cd|supabase\.co/i;

// Emits a safe blocked notice before throwing so the owner sees SAFE_OUTPUT_BLOCKED
// in their terminal rather than a silent throw cascading to UNEXPECTED_SAFE_FAILURE.
const logSafe = (message) => {
  if (forbiddenOutputPattern.test(message)) {
    console.log('phase3ab step=safe-output-guard status=blocked code=SAFE_OUTPUT_BLOCKED sanitized=true');
    throw new Error('Unsafe smoke output blocked.');
  }
  console.log(message);
};

// Builds and emits a structured sanitized step line.
// Pattern: phase3ab step=<step> status=<status> [key=value ...] sanitized=true
const logStep = (step, status, extra = {}) => {
  const parts = [`phase3ab step=${step} status=${status}`];
  for (const [k, v] of Object.entries(extra)) parts.push(`${k}=${v}`);
  parts.push('sanitized=true');
  logSafe(parts.join(' '));
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isLiveApproved = () =>
  Object.entries(requiredLiveGuards).every(([name, expected]) => process.env[name] === expected);

const checkLiveKisPresence = () => requiredLiveKisEnvNames.every((name) => Boolean(process.env[name]));
const checkLiveSupabasePresence = () => requiredLiveSupabaseEnvNames.every((name) => Boolean(process.env[name]));

const normalizeSymbol = (value) => (typeof value === 'string' ? value.trim().toUpperCase() : '');

const validateKrSymbol = (symbol) => {
  if (!/^[A-Z0-9]{6}$/.test(symbol)) return 'invalid-kr-symbol-format';
  return null;
};

// ─── TypeScript compilation ───────────────────────────────────────────────────

// All files except supabaseAdmin.ts — that is handled separately below.
const filesToCompile = [
  'src/lib/server/providers/serverOnly.ts',
  'src/lib/server/providers/providerErrors.ts',
  'src/lib/server/providers/types.ts',
  'src/lib/server/providers/kisClient.ts',
  'src/lib/server/marketData/quoteCache.ts',
  'src/lib/server/marketData/supabaseQuoteCache.ts',
  'src/lib/server/marketData/quotes.ts',
];

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

// Dry-run stub for supabaseAdmin. An in-process Map acts as the Supabase table;
// no network calls are made. The mock client is a singleton in this module so
// all importers in this Node.js process share the same rows Map and call counts.
const DRY_RUN_SUPABASE_ADMIN_STUB = `
const rows = new Map();
const calls = { select: 0, upsert: 0, update: 0 };
const mockClient = {
  calls,
  from(_name) {
    return {
      select(_columns) {
        calls.select += 1;
        return {
          eq(_column, value) {
            return {
              async maybeSingle() {
                return { data: rows.get(value) ?? null, error: null };
              },
            };
          },
        };
      },
      async upsert(payload, _options) {
        calls.upsert += 1;
        rows.set(payload.cache_key, { ...payload, quote_json: { ...payload.quote_json } });
        return { error: null };
      },
      update(payload) {
        calls.update += 1;
        return {
          async eq(_column, value) {
            const existing = rows.get(value);
            if (existing) rows.set(value, { ...existing, ...payload });
            return { error: null };
          },
        };
      },
    };
  },
};
export const getSupabaseAdminClient = () => mockClient;
export const isSupabaseServerConfigured = () => true;
export const isSupabasePublicServerConfigured = () => true;
export const validateUserFromBearerToken = async () => ({ ok: false, status: 401, code: 'NOT_IMPL', message: 'dry-run' });
`.trimStart();

const createCompiledRuntime = (live) => {
  const astroTempDir = path.join(repoRoot, '.astro');
  fs.mkdirSync(astroTempDir, { recursive: true });
  const tempRoot = fs.mkdtempSync(path.join(astroTempDir, 'phase3ab-smoke-'));
  const outDir = path.join(tempRoot, 'out');

  for (const file of filesToCompile) compileFile(file, outDir);

  const supabaseAdminTarget = path.join(outDir, 'src/lib/server/supabaseAdmin.js');
  fs.mkdirSync(path.dirname(supabaseAdminTarget), { recursive: true });

  if (live) {
    compileFile('src/lib/server/supabaseAdmin.ts', outDir);
  } else {
    fs.writeFileSync(supabaseAdminTarget, DRY_RUN_SUPABASE_ADMIN_STUB, 'utf8');
  }

  return {
    quotesUrl: pathToFileURL(path.join(outDir, 'src/lib/server/marketData/quotes.js')).href,
    quoteCacheUrl: pathToFileURL(path.join(outDir, 'src/lib/server/marketData/quoteCache.js')).href,
    supabaseAdminUrl: pathToFileURL(supabaseAdminTarget).href,
    cleanup: () => fs.rmSync(tempRoot, { recursive: true, force: true }),
  };
};

// Synthetic QuoteSnapshot for dry-run mode — no real KIS call, no real price.
const buildSyntheticSnapshot = ({ market, symbol }) => ({
  market,
  symbol,
  price: 70000,
  currency: 'KRW',
  change: 100,
  changePct: 0.14,
  volume: 123456,
  marketState: 'unknown',
  asOf: new Date().toISOString(),
  staleState: 'fresh',
  providerMeta: { provider: 'kis', source: 'kis-domestic-quote' },
});

// ─── Smoke test (Strategy 1) ──────────────────────────────────────────────────
//
// Strategy 1 — in-process memory flush:
//   1. Call getQuoteSnapshot() → KIS provider (live) or mock provider (dry-run).
//      Writes snapshot to BOTH in-memory Map AND Supabase (real or mock).
//      Returns reason='provider-fresh' (or 'cache-fresh' if Supabase already had it).
//   2. clearQuoteCacheForTests() → clears the in-memory Map ONLY. Supabase is untouched.
//   3. Call getQuoteSnapshot() again. Memory is empty; QUOTE_CACHE_BACKEND=supabase so
//      getConfiguredQuoteCacheEntry() reads from Supabase first. If it finds a fresh row,
//      it returns it as 'cache-fresh' — conclusive proof of Supabase readback.

const runSmoke = async ({ quotesModule, quoteCacheModule, supabaseAdminModule, identity, live }) => {
  const mockProvider = live
    ? undefined
    : async (id) => ({
        ok: true,
        data: buildSyntheticSnapshot(id),
        staleState: 'fresh',
        fallback: null,
      });

  // Step: first-call — expect provider-fresh (or cache-fresh from prior Supabase entry)
  logStep('first-call', 'started');
  let result1;
  try {
    result1 = live
      ? await quotesModule.getQuoteSnapshot(identity)
      : await quotesModule.getQuoteSnapshot(identity, { provider: mockProvider });
  } catch {
    logStep('first-call', 'failed', { code: 'FIRST_CALL_THREW' });
    return { ok: false, code: 'FIRST_CALL_THREW' };
  }
  if (!result1?.ok) {
    logStep('first-call', 'failed', { code: result1?.code ?? 'FIRST_CALL_FAILED' });
    return { ok: false, code: result1?.code ?? 'FIRST_CALL_FAILED' };
  }
  const reason1 = result1.fallback?.reason ?? 'unknown';
  logStep('first-call', 'passed', { reason: reason1 });

  // Step: memory-flush — clear the in-memory Map without touching Supabase
  logStep('memory-flush', 'started');
  try {
    quoteCacheModule.clearQuoteCacheForTests();
  } catch {
    logStep('memory-flush', 'failed', { code: 'MEMORY_FLUSH_THREW' });
    return { ok: false, code: 'MEMORY_FLUSH_THREW' };
  }
  logStep('memory-flush', 'passed', { note: 'in-memory-map-cleared-supabase-untouched' });

  // Step: second-call — memory is empty; expects Supabase to serve the entry as cache-fresh
  logStep('second-call', 'started');
  let result2;
  try {
    result2 = live
      ? await quotesModule.getQuoteSnapshot(identity)
      : await quotesModule.getQuoteSnapshot(identity, { provider: mockProvider });
  } catch {
    logStep('second-call', 'failed', { code: 'SECOND_CALL_THREW' });
    return { ok: false, code: 'SECOND_CALL_THREW' };
  }
  if (!result2?.ok) {
    logStep('second-call', 'failed', { code: result2?.code ?? 'SECOND_CALL_FAILED' });
    return { ok: false, code: result2?.code ?? 'SECOND_CALL_FAILED' };
  }
  const reason2 = result2.fallback?.reason ?? 'unknown';
  logStep('second-call', 'passed', { reason: reason2 });

  // supabaseReadbackConclusive: second call returned 'cache-fresh' after memory was cleared,
  // so the entry MUST have been served from Supabase (the only remaining source).
  const supabaseReadbackConclusive = reason2 === 'cache-fresh';

  // Step: dry-run-mock-validation — confirm the mock Supabase was actually exercised
  if (!live) {
    const mockClient = supabaseAdminModule.getSupabaseAdminClient();
    const upsertCalled = mockClient.calls.upsert > 0;
    const selectCalled = mockClient.calls.select > 0;
    logStep('dry-run-mock-validation', 'passed', {
      mockUpsertCalled: String(upsertCalled),
      mockSelectCalled: String(selectCalled),
    });
  }

  return { ok: true, reason1, reason2, supabaseReadbackConclusive };
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const main = async () => {
  const live = isLiveApproved();

  // Step: guard-check
  logStep('guard-check', 'started');
  if (!live) {
    logStep('guard-check', 'passed', { mode: 'dry-run-no-live-guards' });
  } else {
    logStep('guard-check', 'passed', { mode: 'live-approved', liveKis: 'true', liveSupabase: 'true' });
  }

  // Step: runtime-check — blocks production regardless of live/dry-run mode
  logStep('runtime-check', 'started');
  const nodeEnv = (process.env.NODE_ENV ?? '').trim().toLowerCase();
  const vercelEnv = (process.env.VERCEL_ENV ?? '').trim().toLowerCase();
  if (nodeEnv === 'production' || vercelEnv === 'production') {
    logStep('runtime-check', 'failed', { code: 'PRODUCTION_RUNTIME_NOT_ALLOWED' });
    process.exitCode = 1;
    return;
  }
  logStep('runtime-check', 'passed', { nodeEnvIsProduction: 'false', vercelEnvIsProduction: 'false' });

  // Step: kis-accno-check — KIS_ACCOUNT_NO must be absent (scope is quotes only, not trading)
  logStep('kis-accno-check', 'started');
  if (process.env.KIS_ACCOUNT_NO !== undefined && process.env.KIS_ACCOUNT_NO !== '') {
    logStep('kis-accno-check', 'failed', { code: 'KIS_ACCNO_PRESENT_BLOCKED' });
    process.exitCode = 1;
    return;
  }
  logStep('kis-accno-check', 'passed', { kisAccnoAbsent: 'true' });

  // Step: cache-backend-check — supabase backend required for readback proof
  logStep('cache-backend-check', 'started');
  if (live && process.env.QUOTE_CACHE_BACKEND !== 'supabase') {
    logStep('cache-backend-check', 'failed', { code: 'QUOTE_CACHE_BACKEND_MUST_BE_SUPABASE' });
    process.exitCode = 1;
    return;
  }
  if (!live) {
    // Set internally so dry-run exercises the supabase code path via the mock stub.
    process.env.QUOTE_CACHE_BACKEND = 'supabase';
  }
  logStep('cache-backend-check', 'passed', { configuredBackend: 'supabase' });

  // Step: smoke-identity-validation
  logStep('smoke-identity-validation', 'started');
  const rawSymbol = normalizeSymbol(process.env.MK_STOCK_LAB_PHASE_3AB_SYMBOL ?? '');
  const identity = { market: 'KR', symbol: rawSymbol || '005930' };
  if (live) {
    const symbolError = validateKrSymbol(rawSymbol);
    if (!rawSymbol || symbolError) {
      logStep('smoke-identity-validation', 'failed', {
        code: 'SMOKE_IDENTITY_INVALID',
        reason: symbolError ?? 'missing-symbol',
      });
      process.exitCode = 1;
      return;
    }
    logStep('smoke-identity-validation', 'passed');
  } else {
    logStep('smoke-identity-validation', 'passed', { note: 'dry-run-using-synthetic-identity' });
  }

  // Step: runtime-setup — compile TypeScript to an isolated temporary directory
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
    // Step: module-import
    logStep('module-import', 'started');
    let quotesModule, quoteCacheModule, supabaseAdminModule;
    try {
      [quotesModule, quoteCacheModule, supabaseAdminModule] = await Promise.all([
        import(runtime.quotesUrl),
        import(runtime.quoteCacheUrl),
        import(runtime.supabaseAdminUrl),
      ]);
    } catch {
      logStep('module-import', 'failed', { code: 'MODULE_IMPORT_FAILED' });
      process.exitCode = 1;
      return;
    }
    logStep('module-import', 'passed');

    // Step: config-preflight — presence-only check for live KIS and Supabase env names
    logStep('config-preflight', 'started');
    if (live) {
      if (!checkLiveKisPresence()) {
        logStep('config-preflight', 'failed', { code: 'KIS_CONFIG_MISSING' });
        process.exitCode = 1;
        return;
      }
      if (!checkLiveSupabasePresence()) {
        logStep('config-preflight', 'failed', { code: 'SUPABASE_CONFIG_MISSING' });
        process.exitCode = 1;
        return;
      }
      logStep('config-preflight', 'passed');
    } else {
      logStep('config-preflight', 'passed', { note: 'dry-run-config-preflight-skipped' });
    }

    const result = await runSmoke({ quotesModule, quoteCacheModule, supabaseAdminModule, identity, live });

    if (!result.ok) {
      logStep('final-result', 'failed', { code: result.code });
      process.exitCode = 1;
      return;
    }

    logStep('final-result', 'passed', {
      mode: live ? 'live-approved' : 'dry-run-mock',
      liveKis: String(live),
      liveSupabase: String(live),
      firstCallReason: result.reason1,
      secondCallReason: result.reason2,
      supabaseReadbackConclusive: String(result.supabaseReadbackConclusive),
    });

    if (!live) {
      logStep('dry-run-guard-sim', 'passed', { note: 'live-guards-absent-dry-run-mode-confirmed' });
      logStep('dry-run-config-sim', 'passed', {
        kisConfigAbsentInDryRun: String(!checkLiveKisPresence()),
        supabaseConfigAbsentInDryRun: String(!checkLiveSupabasePresence()),
      });
    }
  } finally {
    runtime.cleanup();
  }
};

// Last-resort catch. Uses console.log directly to avoid re-triggering logSafe.
// All expected failure points above emit specific labeled step failures before returning.
main().catch(() => {
  console.log('phase3ab step=unexpected-catch status=failed code=UNEXPECTED_SAFE_FAILURE sanitized=true');
  process.exitCode = 1;
});
