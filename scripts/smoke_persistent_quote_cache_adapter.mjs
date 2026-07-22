import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';

const repoRoot = process.cwd();
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mk-stock-lab-persistent-cache-smoke-'));
const outDir = path.join(tmpDir, 'out');
const files = [
  'src/lib/server/marketData/supabaseQuoteCache.ts',
  'src/lib/server/marketData/quoteCache.ts',
  'src/lib/server/providers/providerErrors.ts',
  'src/lib/server/providers/serverOnly.ts',
  'src/lib/server/providers/types.ts',
];
const allowedPayloadKeys = [
  'asOf',
  'change',
  'changePct',
  'currency',
  'exchange',
  'market',
  'marketState',
  'price',
  'providerSymbol',
  'staleState',
  'symbol',
  'volume',
];
const requiredPayloadKeys = ['asOf', 'change', 'changePct', 'currency', 'market', 'marketState', 'price', 'staleState', 'symbol', 'volume'];
const allowedUpsertKeys = [
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
];
const forbiddenPattern =
  /KIS_APP_SECRET|KIS_APP_KEY|OPENAI_API_KEY|GEMINI_API_KEY|OPENDART_API_KEY|SUPABASE_SERVICE_ROLE_KEY|access_token|appsecret|appkey|authorization|Bearer|account|portfolioId|positionId|connectionString|stack|raw/i;

const compileFile = (file) => {
  const source = path.join(repoRoot, file);
  const target = path.join(outDir, file).replace(/\.ts$/, '.js');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const content = fs.readFileSync(source, 'utf8');
  const compiled = ts
    .transpileModule(content, {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
      },
    })
    .outputText.replace(/from '([^']+)';/g, (match, specifier) => {
      if (!specifier.startsWith('.')) return match;
      return specifier.endsWith('.js') ? match : `from '${specifier}.js';`;
    })
    .replace(/import\('([^']+)'\)/g, (match, specifier) => {
      if (!specifier.startsWith('.')) return match;
      return specifier.endsWith('.js') ? match : `import('${specifier}.js')`;
    });
  fs.writeFileSync(target, compiled, 'utf8');
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const createMockClient = ({ row = null, readError = null, writeError = null, updateError = null } = {}) => {
  const calls = {
    table: [],
    select: [],
    readEq: [],
    upserts: [],
    updates: [],
    updateEq: [],
  };

  return {
    calls,
    from(tableName) {
      calls.table.push(tableName);
      return {
        select(columns) {
          calls.select.push(columns);
          return {
            eq(column, value) {
              calls.readEq.push({ column, value });
              return {
                async maybeSingle() {
                  return { data: row, error: readError };
                },
              };
            },
          };
        },
        async upsert(payload, options) {
          calls.upserts.push({ payload, options });
          return { error: writeError };
        },
        update(payload) {
          calls.updates.push(payload);
          return {
            async eq(column, value) {
              calls.updateEq.push({ column, value });
              return { error: updateError };
            },
          };
        },
      };
    },
  };
};

try {
  for (const file of files) compileFile(file);
  const supabaseAdminStub = path.join(outDir, 'src/lib/server/supabaseAdmin.js');
  fs.mkdirSync(path.dirname(supabaseAdminStub), { recursive: true });
  fs.writeFileSync(
    supabaseAdminStub,
    "export const getSupabaseAdminClient = () => { throw new Error('Mock smoke must inject a Supabase client.'); };\n",
    'utf8',
  );

  const quoteCacheModule = await import(pathToFileURL(path.join(outDir, 'src/lib/server/marketData/quoteCache.js')).href);
  const adapterModule = await import(
    pathToFileURL(path.join(outDir, 'src/lib/server/marketData/supabaseQuoteCache.js')).href
  );

  delete process.env.QUOTE_CACHE_BACKEND;
  assert(quoteCacheModule.getConfiguredQuoteCacheBackendName() === 'memory', 'memory must be the default backend');
  process.env.QUOTE_CACHE_BACKEND = 'memory';
  assert(quoteCacheModule.getConfiguredQuoteCacheBackendName() === 'memory', 'memory backend should remain explicit');
  process.env.QUOTE_CACHE_BACKEND = 'supabase';
  assert(quoteCacheModule.getConfiguredQuoteCacheBackendName() === 'supabase', 'supabase backend should be opt-in only');

  const cacheKey = adapterModule.buildSupabaseQuoteCacheKey({ market: 'KR', symbol: '005930' });
  assert(cacheKey === 'quote:KR:005930', 'cache key normalization failed');

  const nowMs = Date.parse('2026-06-21T00:00:00.000Z');
  const baseRow = {
    cache_key: cacheKey,
    symbol: '005930',
    market: 'KR',
    provider: 'kis',
    source: 'kis-domestic-quote',
    quote_json: {
      market: 'KR',
      symbol: '005930',
      price: 70000,
      currency: 'KRW',
      change: 100,
      changePct: 0.14,
      volume: 123456,
      marketState: 'unknown',
      asOf: '2026-06-21T00:00:00.000Z',
      staleState: 'fresh',
    },
    cached_at: '2026-06-21T00:00:00.000Z',
    expires_at: '2026-06-21T00:02:00.000Z',
    fresh_until: '2026-06-21T00:00:15.000Z',
    stale_until: '2026-06-21T00:02:00.000Z',
    schema_version: 1,
    last_refresh_status: 'success',
    last_error_code: null,
    updated_at: '2026-06-21T00:00:00.000Z',
  };

  const freshRead = await adapterModule.readSupabaseQuoteCacheEntry({ market: 'KR', symbol: '005930' }, {
    client: createMockClient({ row: baseRow }),
    nowMs: nowMs + 10_000,
  });
  assert(freshRead.ok && freshRead.entry?.state === 'fresh', 'fresh persistent read failed');

  const staleRead = await adapterModule.readSupabaseQuoteCacheEntry({ market: 'KR', symbol: '005930' }, {
    client: createMockClient({ row: baseRow }),
    nowMs: nowMs + 20_000,
  });
  assert(staleRead.ok && staleRead.entry?.state === 'stale-but-usable', 'stale persistent read failed');

  const expiredRead = await adapterModule.readSupabaseQuoteCacheEntry({ market: 'KR', symbol: '005930' }, {
    client: createMockClient({ row: baseRow }),
    nowMs: nowMs + 130_000,
  });
  assert(expiredRead.ok && expiredRead.entry?.state === 'expired', 'expired persistent read failed');

  const writeClient = createMockClient();
  const snapshotWithUnsafeExtras = {
    market: 'KR',
    symbol: '005930',
    price: 70000,
    currency: 'KRW',
    change: 100,
    changePct: 0.14,
    volume: 123456,
    marketState: 'unknown',
    asOf: '2026-06-21T00:00:00.000Z',
    staleState: 'fresh',
    providerMeta: { provider: 'kis', source: 'kis-domestic-quote' },
    rawPayload: { access_token: 'not-used' },
    authorization: 'not-used',
    account: 'not-used',
    portfolioId: 'not-used',
  };
  const writeResult = await adapterModule.writeSupabaseQuoteCacheSuccess(snapshotWithUnsafeExtras, {
    client: writeClient,
    nowMs,
  });
  assert(writeResult.ok, 'persistent success write failed');
  assert(writeClient.calls.upserts.length === 1, 'upsert was not called once');

  const upsertPayload = writeClient.calls.upserts[0].payload;
  assert(JSON.stringify(Object.keys(upsertPayload).sort()) === JSON.stringify(allowedUpsertKeys.sort()), 'upsert key set changed');
  const quoteJsonKeys = Object.keys(upsertPayload.quote_json);
  assert(quoteJsonKeys.every((key) => allowedPayloadKeys.includes(key)), 'quote_json contains an unexpected key');
  assert(requiredPayloadKeys.every((key) => quoteJsonKeys.includes(key)), 'quote_json is missing a required normalized key');
  assert(!forbiddenPattern.test(JSON.stringify(upsertPayload)), 'forbidden marker found in normalized upsert payload');

  const failureClient = createMockClient();
  const failureResult = await adapterModule.writeSupabaseQuoteCacheRefreshFailure(
    { market: 'KR', symbol: '005930' },
    'KIS_APP_SECRET raw stack',
    { client: failureClient, nowMs },
  );
  assert(failureResult.ok, 'persistent failure metadata write failed');
  assert(failureClient.calls.updates[0].last_error_code === 'UNKNOWN', 'failure metadata was not sanitized');
  assert(!forbiddenPattern.test(JSON.stringify(failureClient.calls.updates[0])), 'forbidden marker found in failure metadata');

  const readError = await adapterModule.readSupabaseQuoteCacheEntry({ market: 'KR', symbol: '005930' }, {
    client: createMockClient({ readError: { code: 'SYNTHETIC_DB_ERROR' } }),
    nowMs,
  });
  assert(!readError.ok && readError.code === 'PROVIDER_UNAVAILABLE', 'read errors should be sanitized');
  assert(!forbiddenPattern.test(JSON.stringify(readError)), 'forbidden marker found in sanitized read error');

  console.log(
    'persistent-quote-cache-adapter memoryDefault=true supabaseOptIn=true keyNormalized=true states=fresh,stale,expired normalizedPayload=true sanitizedErrors=true liveSupabase=false',
  );
} finally {
  delete process.env.QUOTE_CACHE_BACKEND;
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
