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

const logSafe = (message) => {
  if (forbiddenOutputPattern.test(message)) {
    throw new Error('Unsafe smoke output blocked.');
  }
  console.log(message);
};

const isLiveApproved = () =>
  Object.entries(requiredLiveGuards).every(([name, expected]) => process.env[name] === expected);

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
  const tempRoot = fs.mkdtempSync(path.join(astroTempDir, 'phase3s-smoke-'));
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
  const calls = {
    select: 0,
    upsert: 0,
    update: 0,
    delete: 0,
  };

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
  const original = await readRawRow(client, cacheKey);
  if (!original.ok) return { ok: false, code: 'PRECHECK_READ_FAILED' };

  const snapshot = buildSnapshot(identity, nowIso);

  try {
    const writeResult = await adapter.writeSupabaseQuoteCacheSuccess(snapshot, { client, nowMs });
    if (!writeResult.ok) return { ok: false, code: 'WRITE_FAILED' };

    const freshRead = await adapter.readSupabaseQuoteCacheEntry(identity, { client, nowMs: nowMs + 1_000 });
    if (!freshRead.ok || freshRead.entry?.state !== 'fresh') return { ok: false, code: 'FRESH_READ_FAILED' };

    const staleRead = await adapter.readSupabaseQuoteCacheEntry(identity, { client, nowMs: nowMs + 20_000 });
    if (!staleRead.ok || staleRead.entry?.state !== 'stale-but-usable') return { ok: false, code: 'STALE_READ_FAILED' };

    const failureWrite = await adapter.writeSupabaseQuoteCacheRefreshFailure(identity, 'PROVIDER_UNAVAILABLE', {
      client,
      nowMs: nowMs + 21_000,
    });
    if (!failureWrite.ok) return { ok: false, code: 'FAILURE_METADATA_WRITE_FAILED' };

    return {
      ok: true,
      mode: live ? 'live-approved' : 'dry-run-mock',
      originalRowExisted: Boolean(original.row),
    };
  } finally {
    const cleanup = await restoreOrDelete(client, cacheKey, original.row);
    if (!cleanup.ok) {
      logSafe('phase3s cleanupStatus=failed sanitized=true');
    } else {
      logSafe(`phase3s cleanupStatus=passed action=${cleanup.action}`);
    }
  }
};

const main = async () => {
  const live = isLiveApproved();
  const market = normalizeMarket(process.env.PHASE_3S_SMOKE_MARKET);
  const symbol = normalizeSymbol(process.env.PHASE_3S_SMOKE_SYMBOL);
  const runtime = createCompiledRuntime(live);

  try {
    if (!live) {
      logSafe('phase3s mode=dry-run-mock liveSupabase=false reason=missing-or-different-owner-approval-guards');
    } else {
      logSafe('phase3s mode=live-approved liveSupabase=true backupRiskAccepted=true');
      logSafe('phase3s backupRiskNote=production-backup-pitr-snapshot-may-be-unavailable-owner-risk-acceptance-required');
    }

    const identityError = validateIdentity({ market, symbol });
    if (identityError) {
      if (live) {
        logSafe(`phase3s status=blocked reason=${identityError}`);
        process.exitCode = 1;
        return;
      }
      logSafe('phase3s dryRunUsingSyntheticIdentity=true');
    }

    const identity = identityError ? { market: 'KR', symbol: '005930' } : { market, symbol };
    const adapter = await import(runtime.adapterUrl);
    const client = live ? (await import(runtime.adminUrl)).getSupabaseAdminClient() : createMockClient();

    const result = await runSmoke({ adapter, client, identity, live });
    if (!result.ok) {
      logSafe(`phase3s status=failed code=${result.code} sanitized=true`);
      process.exitCode = 1;
      return;
    }

    logSafe(
      `phase3s status=passed mode=${result.mode} liveSupabase=${live} cacheKeyNormalized=true originalRowExisted=${result.originalRowExisted} sanitized=true`,
    );
  } finally {
    runtime.cleanup();
  }
};

main().catch(() => {
  logSafe('phase3s status=failed code=UNEXPECTED_SAFE_FAILURE sanitized=true');
  process.exitCode = 1;
});
