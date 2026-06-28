/**
 * Phase 3EB static and deterministic behavioral contract.
 * No network, credentials, browser, Supabase, KIS, or external FX provider calls.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EB checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const paths = {
  types: 'src/lib/server/providers/fxTypes.ts',
  adapter: 'src/lib/server/providers/fxAdapter.ts',
  mock: 'src/lib/server/providers/fxMockAdapter.ts',
  valuation: 'src/lib/server/portfolioValuation.ts',
  route: 'src/pages/api/portfolio/valuation.ts',
  ui: 'src/pages/portfolio.astro',
  checker: 'scripts/check_phase_3eb_portfolio_mixed_currency_owner_preview_api_contract.mjs',
  result: 'docs/planning/phase_3eb_portfolio_mixed_currency_owner_preview_api_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
};

const read = (relativePath) => {
  try {
    return readFileSync(join(root, relativePath), 'utf8');
  } catch {
    return '';
  }
};

const source = Object.fromEntries(Object.entries(paths).map(([key, value]) => [key, read(value)]));
const packageJson = JSON.parse(source.package || '{}');
let passed = 0;
let failed = 0;
const failures = [];

const check = (label, condition) => {
  if (condition) {
    passed += 1;
    process.stdout.write(`  [PASS] ${label}\n`);
  } else {
    failed += 1;
    failures.push(label);
    process.stdout.write(`  [FAIL] ${label}\n`);
  }
};

process.stdout.write('=== Phase 3EB Portfolio Mixed-Currency Owner Preview API Contract ===\n\n');

process.stdout.write('Files and package command:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Package command exists',
  packageJson.scripts?.['check:phase-3eb-mixed-currency-owner-preview-api'] ===
    'node scripts/check_phase_3eb_portfolio_mixed_currency_owner_preview_api_contract.mjs');
process.stdout.write('\n');

process.stdout.write('Static owner-preview API gate:\n');
check('Route keeps source=live explicit', source.route.includes("source === 'live'"));
check('Route requires previewMode=owner', source.route.includes("previewMode !== 'owner'"));
check('Route requires allowLiveQuotes=true', source.route.includes('allowLiveQuotes !== true'));
check('Route requires allowMockedFx=true', source.route.includes('b.allowMockedFx !== true'));
check('Route requires fxMode=mocked', source.route.includes("b.fxMode !== 'mocked'"));
check('Route requires baseCurrency=KRW', source.route.includes("b.baseCurrency !== 'KRW'"));
check('Route retains ten-position owner limit', source.route.includes('LIVE_PREVIEW_MAX_POSITIONS = 10'));
check('Route keeps runtime production gate', source.route.includes('isLivePreviewGateReady()'));
check('Route keeps source=auto unsupported',
  source.route.includes("source === 'auto'") && source.route.includes('UNSUPPORTED_SOURCE'));
check('Route imports mocked FX only',
  source.route.includes("from '../../../lib/server/providers/fxMockAdapter'") &&
    !source.route.includes('fxLiveAdapter'));
check('Route uses mixed-currency valuation helper',
  source.route.includes('buildPortfolioValuationFromQuotesWithFx'));
check('Route resolves KR symbols only in mixed branch',
  source.route.includes("positions.filter((p) => p.market === 'KR')") &&
    source.route.includes("getQuoteSnapshot({ market: 'KR', symbol })"));
check('Route marks US quote entries unavailable',
  source.route.includes("if (position.market === 'US') quotesBySymbol[position.symbol] = null"));
check('Route reports owner-preview metadata',
  source.route.includes("previewKind: 'owner-preview'") &&
    source.route.includes('mixedCurrencyPreview: true'));
check('Route reports mocked FX metadata',
  source.route.includes("fxMode: 'mocked'") && source.route.includes('fxStaleState'));
check('Route reports missing and unsupported symbols',
  source.route.includes('missingQuoteSymbols') && source.route.includes('unsupportedCurrencySymbols'));
process.stdout.write('\n');

process.stdout.write('Public behavior and safety boundaries:\n');
check('Fixture remains the default', source.route.includes("b.source ?? 'fixture'"));
check('Fixture resolver remains in the fixture branch', source.route.includes('resolveFixtureQuotes'));
check('Public live still fails without owner gate', source.route.includes(
  'Live quotes are not publicly available.',
));
check('Route contains no direct fetch', !/\bfetch\s*\(/.test(source.route));
check('Route contains no direct environment read',
  !source.route.includes('process.env') && !source.route.includes('import.meta.env'));
check('Route contains no provider endpoint', !/https?:\/\//i.test(source.route));
check('Route does not import KIS directly', !/kisClient|getKisQuoteSnapshot/i.test(source.route));
check('Route response does not expose provider metadata fields',
  !/providerMeta\s*:|rawPayload\s*:|responseBody\s*:|requestBody\s*:/.test(source.route));
check('Route response does not expose known KIS or credential fields',
  !/stck_|prdy_|rt_cd|acml_|authorization\s*:|access_token\s*:|appkey\s*:|appsecret\s*:/i.test(source.route));
check('Route does not echo request objects',
  !source.route.includes('requestBody:') &&
    !source.route.includes('request: body') &&
    !source.route.includes('request: b'));
check('Touched runtime paths avoid live-data claims',
  !/real-time|realtime|실시간|현재 시세/i.test(`${source.route}\n${source.valuation}`));
check('Valuation imports FxRateSnapshot',
  source.valuation.includes("import type { FxRateSnapshot } from './providers/fxTypes'"));
check('Valuation rejects unusable FX snapshots',
  source.valuation.includes('getUsableFxRateInput') && source.valuation.includes("fxRate.source === 'unavailable'"));
check('Valuation keeps missing aggregate totals null',
  source.valuation.includes('let totalMarketValue: number | null = null'));
process.stdout.write('\n');

process.stdout.write('Deterministic FX and valuation behavior:\n');
let runtime;
try {
  const bundled = await build({
    stdin: {
      contents: [
        "export * from './src/lib/server/providers/fxMockAdapter.ts';",
        "export * from './src/lib/server/portfolioValuation.ts';",
      ].join('\n'),
      resolveDir: root,
      sourcefile: 'phase-3eb-runtime-entry.ts',
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node22',
    write: false,
    logLevel: 'silent',
  });
  const code = bundled.outputFiles[0]?.text ?? '';
  runtime = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  check('Local FX and valuation modules import without network', Boolean(runtime));
} catch {
  check('Local FX and valuation modules import without network', false);
}

if (runtime) {
  const usdKrw = runtime.getMockedFxRate('USD', 'KRW');
  const krwUsd = runtime.getMockedFxRate('KRW', 'USD');
  const krwKrw = runtime.getMockedFxRate('KRW', 'KRW');
  const usdUsd = runtime.getMockedFxRate('USD', 'USD');
  check('USD/KRW mocked rate remains 1350', usdKrw.ok && usdKrw.data.rate === 1350);
  check('USD/KRW reports mocked sample state',
    usdKrw.ok && usdKrw.data.source === 'mocked' && usdKrw.data.staleState === 'sample');
  check('KRW/USD remains the finite inverse',
    krwUsd.ok && Math.abs(krwUsd.data.rate - (1 / 1350)) < Number.EPSILON);
  check('KRW/KRW identity remains 1', krwKrw.ok && krwKrw.data.rate === 1);
  check('USD/USD identity remains 1', usdUsd.ok && usdUsd.data.rate === 1);

  const positions = [
    {
      portfolioId: 'owner-preview', market: 'KR', symbol: '005930', name: 'KR sample',
      assetType: 'stock', quantity: 10, buyPrice: 70000, currency: 'KRW',
    },
    {
      portfolioId: 'owner-preview', market: 'US', symbol: 'US-SAMPLE', name: 'US sample',
      assetType: 'stock', quantity: 1, buyPrice: 300, currency: 'USD',
    },
  ];
  const quotes = {
    '005930': {
      market: 'KR', symbol: '005930', price: 73000, currency: 'KRW', change: null,
      changePct: null, marketState: 'closed', asOf: '2026-01-01T00:00:00.000Z', staleState: 'fresh',
    },
    'US-SAMPLE': {
      market: 'US', symbol: 'US-SAMPLE', price: 480, currency: 'USD', change: null,
      changePct: null, marketState: 'closed', asOf: '2026-01-01T00:00:00.000Z', staleState: 'fresh',
    },
  };
  const converted = runtime.buildPortfolioValuationFromQuotesWithFx({
    portfolioId: 'owner-preview', baseCurrency: 'KRW', positions, quotesBySymbol: quotes,
    fxRate: usdKrw.ok ? usdKrw.data : null,
  });
  check('Deterministic mixed total converts USD market value', converted.totalMarketValue === 1378000);
  check('Deterministic mixed cost basis converts USD cost basis', converted.totalCostBasis === 1105000);
  check('Deterministic mixed unrealized PnL uses converted totals', converted.totalUnrealizedPnl === 273000);
  check('Mocked FX caps aggregate freshness', converted.staleState === 'stale-but-usable');

  const missingQuote = runtime.buildPortfolioValuationFromQuotesWithFx({
    portfolioId: 'owner-preview', baseCurrency: 'KRW', positions,
    quotesBySymbol: { ...quotes, 'US-SAMPLE': null }, fxRate: usdKrw.ok ? usdKrw.data : null,
  });
  check('Missing USD quote produces unavailable row',
    missingQuote.rows.find((row) => row.symbol === 'US-SAMPLE')?.staleState === 'unavailable');
  check('Missing USD quote keeps aggregate market total null', missingQuote.totalMarketValue === null);
  check('Missing USD quote keeps aggregate unrealized PnL null', missingQuote.totalUnrealizedPnl === null);

  const missingFx = runtime.buildPortfolioValuationFromQuotesWithFx({
    portfolioId: 'owner-preview', baseCurrency: 'KRW', positions, quotesBySymbol: quotes, fxRate: null,
  });
  check('Missing FX keeps aggregate market total null', missingFx.totalMarketValue === null);
  check('Missing FX marks aggregate unavailable', missingFx.staleState === 'unavailable');
}
process.stdout.write('\n');

process.stdout.write('Deterministic API behavior with local quote stub:\n');
let routeModule;
globalThis.__phase3ebQuoteRequests = [];
try {
  const bundled = await build({
    stdin: {
      contents: "export { POST } from './src/pages/api/portfolio/valuation.ts';",
      resolveDir: root,
      sourcefile: 'phase-3eb-route-entry.ts',
      loader: 'ts',
    },
    plugins: [{
      name: 'phase-3eb-local-quote-stub',
      setup(pluginBuild) {
        pluginBuild.onResolve({ filter: /marketData[\\/]quotes$/ }, () => ({
          path: 'phase-3eb-local-quote-stub',
          namespace: 'phase-3eb',
        }));
        pluginBuild.onLoad({ filter: /.*/, namespace: 'phase-3eb' }, () => ({
          loader: 'js',
          contents: `
            export const isLivePreviewGateReady = () => ({ allowed: true });
            export const getQuoteSnapshot = async (identity) => {
              globalThis.__phase3ebQuoteRequests.push({ ...identity });
              if (identity.market !== 'KR') throw new Error('Only KR quote requests are allowed.');
              return {
                ok: true,
                data: {
                  market: 'KR', symbol: identity.symbol, price: 73000, currency: 'KRW',
                  change: null, changePct: null, marketState: 'closed',
                  asOf: '2026-01-01T00:00:00.000Z', staleState: 'fresh'
                }
              };
            };
          `,
        }));
      },
    }],
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node22',
    write: false,
    logLevel: 'silent',
  });
  const code = bundled.outputFiles[0]?.text ?? '';
  routeModule = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  check('API route imports with local quote stub', Boolean(routeModule?.POST));
} catch {
  check('API route imports with local quote stub', false);
}

if (routeModule?.POST) {
  const call = async (body) => {
    const request = new Request('http://127.0.0.1/api/portfolio/valuation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const response = await routeModule.POST({ request });
    return { response, json: await response.json() };
  };
  const positions = [
    {
      market: 'KR', symbol: '005930', assetType: 'stock', quantity: 10,
      buyPrice: 70000, currency: 'KRW',
    },
    {
      market: 'US', symbol: 'US-SAMPLE', assetType: 'stock', quantity: 1,
      buyPrice: 300, currency: 'USD',
    },
  ];
  const base = { portfolioId: 'owner-preview', baseCurrency: 'KRW', positions };

  globalThis.__phase3ebQuoteRequests.length = 0;
  const publicLive = await call({ ...base, source: 'live' });
  check('Public live without owner gate is rejected',
    publicLive.response.status === 400 && publicLive.json.error?.code === 'UNSUPPORTED_SOURCE');
  check('Rejected public live makes no quote request', globalThis.__phase3ebQuoteRequests.length === 0);

  const missingFxGate = await call({
    ...base, source: 'live', previewMode: 'owner', allowLiveQuotes: true,
  });
  check('Mixed preview without mocked FX flags is rejected',
    missingFxGate.response.status === 400 && missingFxGate.json.error?.code === 'UNSUPPORTED_SOURCE');
  check('Missing mocked FX gate makes no quote request', globalThis.__phase3ebQuoteRequests.length === 0);

  const mixed = await call({
    ...base, source: 'live', previewMode: 'owner', allowLiveQuotes: true,
    allowMockedFx: true, fxMode: 'mocked',
  });
  check('Fully gated mixed owner preview succeeds', mixed.response.status === 200 && mixed.json.ok === true);
  check('Mixed response identifies owner preview',
    mixed.json.data?.meta?.mixedCurrencyPreview === true &&
      mixed.json.data?.meta?.previewKind === 'owner-preview');
  check('Mixed response identifies mocked sample FX',
    mixed.json.data?.meta?.fxSource === 'mocked' &&
      mixed.json.data?.meta?.fxStaleState === 'sample' &&
      mixed.json.data?.meta?.fxRate === 1350);
  check('Only the KR symbol reaches the quote boundary',
    globalThis.__phase3ebQuoteRequests.length === 1 &&
      globalThis.__phase3ebQuoteRequests[0].market === 'KR' &&
      globalThis.__phase3ebQuoteRequests[0].symbol === '005930');
  const usdRow = mixed.json.data?.valuation?.rows?.find((row) => row.symbol === 'US-SAMPLE');
  check('USD API row remains explicitly unavailable',
    usdRow?.currentPrice === null && usdRow?.marketValue === null && usdRow?.staleState === 'unavailable');
  check('Unavailable USD quote keeps API aggregate totals null',
    mixed.json.data?.valuation?.totalMarketValue === null &&
      mixed.json.data?.valuation?.totalUnrealizedPnl === null);
  check('Mixed metadata lists missing USD quote',
    mixed.json.data?.meta?.missingQuoteSymbols?.includes('US-SAMPLE'));

  const auto = await call({ ...base, source: 'auto' });
  check('source=auto remains rejected',
    auto.response.status === 400 && auto.json.error?.code === 'UNSUPPORTED_SOURCE');
  const invalidCurrency = await call({
    ...base,
    source: 'live', previewMode: 'owner', allowLiveQuotes: true,
    allowMockedFx: true, fxMode: 'mocked',
    positions: [{ ...positions[1], currency: 'EUR' }],
  });
  check('Unsupported position currency fails safely',
    invalidCurrency.response.status === 400 && invalidCurrency.json.error?.code === 'VALIDATION_FAILED');
  const fixture = await call({
    portfolioId: 'fixture-check', baseCurrency: 'KRW', source: 'fixture', positions: [],
  });
  check('Explicit fixture path remains available',
    fixture.response.status === 200 && fixture.json.data?.source === 'fixture');
  check('Fixture path makes no additional quote request', globalThis.__phase3ebQuoteRequests.length === 1);
}
check('Checker made no network call', fetchAttempted === false);
process.stdout.write('\n');

process.stdout.write('Documentation and change scope:\n');
for (const heading of [
  '## 1. Status', '## 2. Background', '## 3. Implemented Scope',
  '## 4. Runtime Behavior Preserved', '## 5. Mixed-Currency Contract',
  '## 6. Safety', '## 7. Validation', '## 8. Next Phase',
]) {
  check(`Result document contains ${heading}`, source.result.includes(heading));
}
check('Result recommends Phase 3EC', source.result.includes('Phase 3EC'));
const phaseSection = source.changelog.split('## Phase 3EB - 2026-06-28')[1]?.split('\n## ')[0] ?? '';
check('Changelog contains Phase 3EB', phaseSection.length > 0);
check('Changelog preserves public source policy',
  phaseSection.includes('source=fixture') &&
    phaseSection.includes('source=live') &&
    phaseSection.includes('source=auto'));
check('Changelog recommends Phase 3EC', phaseSection.includes('Phase 3EC'));

let sourceChanges = [];
let uiChanged = true;
let lockChanged = true;
let dependenciesChanged = true;
try {
  sourceChanges = execFileSync('git', ['diff', '--name-only', '9b96477', '--', 'src'], {
    cwd: root,
    encoding: 'utf8',
  }).trim().split(/\r?\n/).filter(Boolean);
  uiChanged = sourceChanges.includes(paths.ui);
  lockChanged = execFileSync('git', ['diff', '--name-only', '9b96477', '--', 'package-lock.json'], {
    cwd: root,
    encoding: 'utf8',
  }).trim().length > 0;
  const baselinePackage = JSON.parse(execFileSync('git', ['show', '9b96477:package.json'], {
    cwd: root,
    encoding: 'utf8',
  }));
  dependenciesChanged = JSON.stringify(baselinePackage.dependencies) !== JSON.stringify(packageJson.dependencies) ||
    JSON.stringify(baselinePackage.devDependencies) !== JSON.stringify(packageJson.devDependencies);
} catch {
  sourceChanges = ['<git-diff-unavailable>'];
}
const allowedSourceChanges = new Set([paths.valuation, paths.route]);
check('Only intended valuation and API runtime files changed',
  sourceChanges.length === 2 && sourceChanges.every((path) => allowedSourceChanges.has(path)));
check('Portfolio UI is unchanged', !uiChanged);
check('Dependency lockfile is unchanged', !lockChanged);
check('No dependency was added or changed', !dependenciesChanged);
check('No live FX adapter exists',
  !existsSync(join(root, 'src/lib/server/providers/fxLiveAdapter.ts')));
check('Checker does not read environment files',
  !/readFileSync\s*\([^)]*["'][^"']*\.env/i.test(source.checker));
check('Checker installs the required network guard',
  source.checker.includes('Network access is blocked in the Phase 3EB checker.'));
process.stdout.write('\n');

process.stdout.write(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failures.length > 0) {
  process.stdout.write('\nFailed checks:\n');
  for (const failure of failures) process.stdout.write(`  - ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Result: PASS\n');
}
