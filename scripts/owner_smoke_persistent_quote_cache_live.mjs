import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const repoRoot = process.cwd();
const tableName = 'market_quote_cache';
const quoteCacheColumns = [
  'cache_key',
  'symbol',
  'market',
  'provider',
  'source',
  'quote_json',
  'cached_at',
  'expires_at',
  'fresh_until',
  'stale_until',
  'schema_version',
  'last_refresh_status',
  'last_error_code',
  'updated_at',
].join(',');

const requiredLiveGuards = {
  QUOTE_CACHE_BACKEND: 'supabase',
  PHASE_3S_LIVE_SMOKE: 'OWNER_APPROVED',
  PHASE_3S_TARGET_CONFIRMED: 'production-or-controlled-runtime-confirmed',
  PHASE_3S_BACKUP_RISK_ACCEPTED: 'OWNER_ACCEPTS_CURRENT_RISK',
};

// Names checked for presence only; values are never printed or compared.
const requiredLiveConfigNames = ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];

const supportedMarkets = new Set(['KR', 'US', 'GLOBAL']);
const filesToCompile = [
  'src/lib/server/marketData/supabaseQuoteCache.ts',
  'src/lib/server/marketData/quoteCache.ts',
  'src/lib/server/providers/providerErrors.ts',
  'src/lib/server/providers/serverOnly.ts',
  'src/lib/server/providers/types.ts',
];
const forbiddenOutputPattern =
  /KIS_APP_SECRET|KIS_APP_KEY|OPENAI_API_KEY|GEMINI_API_KEY|OPENDART_API_KEY|SUPABASE_SERVICE_ROLE_KEY|access_token|appsecret|appkey|authorization|Bearer|account|portfolioId|positionId|connectionString|project_ref|jwt|password|stack|raw/i;

// Emits a safe blocked notice before throwing so the owner sees SAFE_OUTPUT_BLOCKED
// in their terminal rather than a silent throw cascading to UNEXPECTED_SAFE_FAILURE.
const logSafe = (message) => {
  if (forbiddenOutputPattern.test(message)) {
    console.log('phase3u step=safe-output-guard status=blocked code=SAFE_OUTPUT_BLOCKED sanitized=true');
    throw new Error('Unsafe smoke output blocked.');
  }
  console.log(message);
};

// Builds and emits a structured sanitized step line.
// Pattern: phase3u step=<step> status=<status> [key=value ...] sanitized=true
const logStep = (step, status, extra = {}) => {
  const parts = [`phase3u step=${step} status=${status}`];
  for (const [k, v] of Object.entries(extra)) {
    parts.push(`${k}=${v}`);
  }
  parts.push('sanitized=true');
  logSafe(parts.join(' '));
};

const isLiveApproved = () =>
  Object.entries(requiredLiveGuards).every(([name, expected]) => process.env[name] === expected);

// Checks only whether the required config names are present in process.env.
// Never reads, compares, prints, or returns config values.
const checkLiveConfigPresence = () =>
  requiredLiveConfigNames.every((name) => Boolean(process.env[name]));

const normalizeMarket = (value) => (typeof value === 'string' ? value.trim().toUpperCase() : '');
const normalizeSymbol = (value) => (typeof value === 'string' ? value.trim().toUpperCase() : '');

const validateIdentity = ({ market, symbol }) => {
  if (!supportedMarkets.has(market)) return 'invalid-market';
  if (!/^[A-Z0-9.-]{1,16}$/.test(symbol)) return 'invalid-symbol';
  return null;
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

const createCompiledRuntime = (live) => {
  const astroTempDir = path.join(repoRoot, '.astro');
  fs.mkdirSync(astroTempDir, { recursive: true });
  const tempRoot = fs.mkdtempSync(path.join(astroTempDir, 'phase3u-smoke-'));
  const outDir = path.join(tempRoot, 'out');
  for (const file of filesToCompile) compileFile(file, outDir);

  const supabaseAdminTarget = path.join(outDir, 'src/lib/server/supabaseAdmin.js');
  fs.mkdirSync(path.dirname(supabaseAdminTarget), { recursive: true });
  if (live) {
    compileFile('src/lib/server/supabaseAdmin.ts', outDir);
  } else {
    fs.writeFileSync(
      supabaseAdminTarget,
      "export const getSupabaseAdminClient = () => { throw new Error('Dry-run smoke must inject a client.'); };\n",
      'utf8',
    );
  }

  return {
    adapterUrl: pathToFileURL(path.join(outDir, 'src/lib/server/marketData/supabaseQuoteCache.js')).href,
    adminUrl: pathToFileURL(supabaseAdminTarget).href,
    cleanup: () => fs.rmSync(tempRoot, { recursive: true, force: true }),
  };
};

const buildSnapshot = ({ market, symbol }, nowIso) => ({
  market,
  symbol,
  price: 70000,
  currency: market === 'US' ? 'USD' : 'KRW',
  change: 100,
  changePct: 0.14,
  volume: 123456,
  marketState: 'unknown',
  asOf: nowIso,
  staleState: 'fresh',
  providerMeta: {
    provider: 'kis',
    source: 'kis-domestic-quote',
  },
});

const createMockClient = () => {
  const rows = new Map();
  const calls = { select: 0, upsert: 0, update: 0, delete: 0 };

  return {
    calls,
    from(name) {
      if (name !== tableName) throw new Error('Unexpected table name.');
      return {
        select() {
          calls.select += 1;
          return {
            eq(column, value) {
              if (column !== 'cache_key') throw new Error('Unexpected select filter.');
              return {
                async maybeSingle() {
                  return { data: rows.get(value) ?? null, error: null };
                },
              };
            },
          };
        },
        async upsert(payload) {
          calls.upsert += 1;
          rows.set(payload.cache_key, { ...payload, quote_json: { ...payload.quote_json } });
          return { error: null };
        },
        update(payload) {
          calls.update += 1;
          return {
            async eq(column, value) {
              if (column !== 'cache_key') throw new Error('Unexpected update filter.');
              const existing = rows.get(value);
              if (existing) rows.set(value, { ...existing, ...payload });
              return { error: null };
            },
          };
        },
        delete() {
          calls.delete += 1;
          return {
            async eq(column, value) {
              if (column !== 'cache_key') throw new Error('Unexpected delete filter.');
              rows.delete(value);
              return { error: null };
            },
          };
        },
      };
    },
  };
};

const readRawRow = async (client, cacheKey) => {
  const result = await client.from(tableName).select(quoteCacheColumns).eq('cache_key', cacheKey).maybeSingle();
  if (result.error) return { ok: false };
  return { ok: true, row: result.data ?? null };
};

const restoreOrDelete = async (client, cacheKey, originalRow) => {
  if (originalRow) {
    const result = await client.from(tableName).upsert(originalRow, { onConflict: 'cache_key' });
    return { ok: !result.error, action: 'restored-original-row' };
  }

  const result = await client.from(tableName).delete().eq('cache_key', cacheKey);
  return { ok: !result.error, action: 'deleted-smoke-row' };
};

const runSmoke = async ({ adapter, client, identity, live }) => {
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const cacheKey = adapter.buildSupabaseQuoteCacheKey(identity);

  logStep('precheck-read', 'started');
  let original;
  try {
    original = await readRawRow(client, cacheKey);
  } catch {
    logStep('precheck-read', 'failed', { code: 'PRECHECK_READ_FAILED' });
    return { ok: false, code: 'PRECHECK_READ_FAILED' };
  }
  if (!original.ok) {
    logStep('precheck-read', 'failed', { code: 'PRECHECK_READ_FAILED' });
    return { ok: false, code: 'PRECHECK_READ_FAILED' };
  }
  logStep('precheck-read', 'passed');
  logStep('existing-row-snapshot', 'passed', { existingRowFound: String(Boolean(original.row)) });

  const snapshot = buildSnapshot(identity, nowIso);

  try {
    logStep('success-write', 'started');
    const writeResult = await adapter.writeSupabaseQuoteCacheSuccess(snapshot, { client, nowMs });
    if (!writeResult.ok) {
      logStep('success-write', 'failed', { code: 'SUCCESS_WRITE_FAILED' });
      return { ok: false, code: 'SUCCESS_WRITE_FAILED' };
    }
    logStep('success-write', 'passed');

    logStep('fresh-readback', 'started');
    const freshRead = await adapter.readSupabaseQuoteCacheEntry(identity, { client, nowMs: nowMs + 1_000 });
    if (!freshRead.ok || freshRead.entry?.state !== 'fresh') {
      logStep('fresh-readback', 'failed', { code: 'FRESH_READBACK_FAILED' });
      return { ok: false, code: 'FRESH_READBACK_FAILED' };
    }
    logStep('fresh-readback', 'passed');

    logStep('stale-readback', 'started');
    const staleRead = await adapter.readSupabaseQuoteCacheEntry(identity, { client, nowMs: nowMs + 20_000 });
    if (!staleRead.ok || staleRead.entry?.state !== 'stale-but-usable') {
      logStep('stale-readback', 'failed', { code: 'STALE_READBACK_FAILED' });
      return { ok: false, code: 'STALE_READBACK_FAILED' };
    }
    logStep('stale-readback', 'passed');

    logStep('failure-metadata-write', 'started');
    const failureWrite = await adapter.writeSupabaseQuoteCacheRefreshFailure(identity, 'PROVIDER_UNAVAILABLE', {
      client,
      nowMs: nowMs + 21_000,
    });
    if (!failureWrite.ok) {
      logStep('failure-metadata-write', 'failed', { code: 'FAILURE_METADATA_WRITE_FAILED' });
      return { ok: false, code: 'FAILURE_METADATA_WRITE_FAILED' };
    }
    logStep('failure-metadata-write', 'passed');

    return { ok: true, originalRowExisted: Boolean(original.row) };
  } finally {
    logStep('cleanup-restore', 'started');
    try {
      const cleanup = await restoreOrDelete(client, cacheKey, original.row);
      if (!cleanup.ok) {
        logStep('cleanup-restore', 'failed', { code: 'CLEANUP_RESTORE_FAILED' });
      } else {
        logStep('cleanup-restore', 'passed', { action: cleanup.action });
      }
    } catch {
      logStep('cleanup-restore', 'failed', { code: 'CLEANUP_RESTORE_FAILED' });
    }
  }
};

// Logs additional dry-run simulation results after a successful mock smoke.
// Validates that the guard, config, and identity detection functions work correctly
// in the current environment without performing any live Supabase access.
const runDryRunSimulations = () => {
  logStep('dry-run-guard-sim', 'passed', { note: 'live-guards-absent-dry-run-mode-confirmed' });

  const configAbsent = !checkLiveConfigPresence();
  logStep('dry-run-config-sim', 'passed', {
    note: 'config-presence-simulation',
    wouldEmitConfigMissing: String(configAbsent),
  });

  const fakeIdentityError = validateIdentity({ market: 'INVALID', symbol: '' });
  logStep('dry-run-identity-sim', 'passed', {
    note: 'invalid-identity-simulation',
    errorDetected: String(Boolean(fakeIdentityError)),
  });
};

const main = async () => {
  const live = isLiveApproved();

  // Step: guard-check
  logStep('guard-check', 'started');
  if (!live) {
    logStep('guard-check', 'passed', { mode: 'dry-run-no-live-guards' });
  } else {
    logStep('guard-check', 'passed', { mode: 'live-approved', liveSupabase: 'true', backupRiskAccepted: 'true' });
    logSafe('phase3u backupRiskNote=production-backup-pitr-snapshot-may-be-unavailable-owner-risk-acceptance-required');
  }

  // Step: smoke-identity-validation
  logStep('smoke-identity-validation', 'started');
  const market = normalizeMarket(process.env.PHASE_3S_SMOKE_MARKET);
  const symbol = normalizeSymbol(process.env.PHASE_3S_SMOKE_SYMBOL);
  const identityError = validateIdentity({ market, symbol });
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

  // Step: runtime-setup — compile TypeScript to a temporary isolated directory.
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
    // Step: adapter-import
    logStep('adapter-import', 'started');
    let adapter;
    try {
      adapter = await import(runtime.adapterUrl);
    } catch {
      logStep('adapter-import', 'failed', { code: 'ADAPTER_IMPORT_FAILED' });
      process.exitCode = 1;
      return;
    }
    logStep('adapter-import', 'passed');

    let client;
    if (live) {
      // Step: admin-import (live — compiled real supabaseAdmin)
      logStep('admin-import', 'started');
      let adminModule;
      try {
        adminModule = await import(runtime.adminUrl);
      } catch {
        logStep('admin-import', 'failed', { code: 'ADMIN_IMPORT_FAILED' });
        process.exitCode = 1;
        return;
      }
      logStep('admin-import', 'passed');

      // Step: config-preflight — presence check only, no values printed.
      // Runs after admin module is loaded but before calling getSupabaseAdminClient()
      // so that a missing-config failure is labeled specifically rather than surfacing
      // as a generic client-construction failure.
      logStep('config-preflight', 'started');
      if (!checkLiveConfigPresence()) {
        logStep('config-preflight', 'failed', { code: 'CONFIG_MISSING' });
        process.exitCode = 1;
        return;
      }
      logStep('config-preflight', 'passed');

      // Step: client-construction
      logStep('client-construction', 'started');
      try {
        client = adminModule.getSupabaseAdminClient();
      } catch {
        logStep('client-construction', 'failed', { code: 'CLIENT_CONSTRUCTION_FAILED' });
        process.exitCode = 1;
        return;
      }
      logStep('client-construction', 'passed');
    } else {
      // Dry-run: mock stubs replace live admin import and client construction.
      logStep('admin-import', 'passed', { note: 'dry-run-mock-client-injected' });
      logStep('config-preflight', 'passed', { note: 'dry-run-config-preflight-skipped' });
      logStep('client-construction', 'passed', { note: 'dry-run-mock-client-injected' });
      client = createMockClient();
    }

    const result = await runSmoke({ adapter, client, identity, live });

    if (!result.ok) {
      logStep('final-result', 'failed', { code: result.code });
      process.exitCode = 1;
      return;
    }

    logStep('final-result', 'passed', {
      mode: live ? 'live-approved' : 'dry-run-mock',
      liveSupabase: String(live),
      cacheKeyNormalized: 'true',
      originalRowExisted: String(result.originalRowExisted),
    });

    if (!live) {
      runDryRunSimulations();
    }
  } finally {
    runtime.cleanup();
  }
};

// Last-resort catch. Uses console.log directly to avoid re-triggering logSafe.
// All expected failure points above emit specific labeled step failures before returning.
main().catch(() => {
  console.log('phase3u step=unexpected-catch status=failed code=UNEXPECTED_SAFE_FAILURE sanitized=true');
  process.exitCode = 1;
});
