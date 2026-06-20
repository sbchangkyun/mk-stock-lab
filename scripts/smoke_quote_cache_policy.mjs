import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';

const repoRoot = process.cwd();
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mk-stock-lab-cache-smoke-'));
const outDir = path.join(tmpDir, 'out');
const files = [
  'src/lib/server/marketData/quotes.ts',
  'src/lib/server/marketData/quoteCache.ts',
  'src/lib/server/providers/kisClient.ts',
  'src/lib/server/providers/providerErrors.ts',
  'src/lib/server/providers/serverOnly.ts',
  'src/lib/server/providers/types.ts',
];
const unsafePattern = /KIS_APP_SECRET|KIS_APP_KEY|KIS_BASE_URL|access_token|appsecret|appkey|authorization|Bearer|stack|raw/;

const compileFile = (file) => {
  const source = path.join(repoRoot, file);
  const target = path.join(outDir, file).replace(/\.ts$/, '.js');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const content = fs.readFileSync(source, 'utf8');
  const compiled = ts.transpileModule(content, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
    },
  }).outputText.replace(/from '([^']+)';/g, (match, specifier) => {
    if (!specifier.startsWith('.')) return match;
    return specifier.endsWith('.js') ? match : `from '${specifier}.js';`;
  });
  fs.writeFileSync(target, compiled, 'utf8');
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

try {
  for (const file of files) compileFile(file);

  const quotesModule = await import(pathToFileURL(path.join(outDir, 'src/lib/server/marketData/quotes.js')).href);
  const cacheModule = await import(pathToFileURL(path.join(outDir, 'src/lib/server/marketData/quoteCache.js')).href);
  const { createProviderError } = await import(pathToFileURL(path.join(outDir, 'src/lib/server/providers/providerErrors.js')).href);

  const identity = { market: 'KR', symbol: '005930' };
  const baseSnapshot = {
    ...identity,
    price: 70000,
    currency: 'KRW',
    change: 100,
    changePct: 0.14,
    volume: 123456,
    marketState: 'unknown',
    asOf: '2026-06-21T00:00:00.000Z',
    staleState: 'fresh',
    providerMeta: { provider: 'kis', source: 'kis-domestic-quote' },
  };

  cacheModule.clearQuoteCacheForTests();

  let providerCalls = 0;
  const freshProvider = async () => {
    providerCalls += 1;
    return { ok: true, data: baseSnapshot, staleState: 'fresh' };
  };

  const first = await quotesModule.getQuoteSnapshot(identity, { nowMs: 1_000, provider: freshProvider });
  assert(first.ok && first.fallback.reason === 'provider-fresh', 'initial provider fill failed');
  assert(providerCalls === 1, 'initial provider call count mismatch');

  const second = await quotesModule.getQuoteSnapshot(identity, { nowMs: 2_000, provider: freshProvider });
  assert(second.ok && second.fallback.reason === 'cache-fresh', 'fresh cache hit failed');
  assert(providerCalls === 1, 'fresh cache should not call provider');

  const failingProvider = async () => {
    providerCalls += 1;
    return createProviderError('PROVIDER_UNAVAILABLE', 'Synthetic provider failure.', {
      provider: 'kis',
      staleState: 'unavailable',
    });
  };

  const stale = await quotesModule.getQuoteSnapshot(identity, { nowMs: 20_000, provider: failingProvider });
  assert(stale.ok && stale.staleState === 'stale-but-usable', 'stale fallback failed');
  assert(stale.fallback.reason === 'cache-stale-provider-failed', 'stale fallback reason mismatch');
  assert(providerCalls === 2, 'stale refresh should call provider once');

  const expired = await quotesModule.getQuoteSnapshot(identity, { nowMs: 130_000, provider: failingProvider });
  assert(!expired.ok && expired.code === 'PROVIDER_UNAVAILABLE', 'expired cache should return provider error');
  assert(providerCalls === 3, 'expired cache provider call count mismatch');

  const serialized = JSON.stringify([first, second, stale, expired]);
  assert(!unsafePattern.test(serialized), 'unsafe marker found in cache smoke output');

  console.log('quote-cache-policy providerFresh=true cacheFresh=true staleFallback=true expiredUnavailable=true unsafeMarker=false');
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
