/**
 * Phase 3ER static and deterministic behavioral contract.
 * KIS OHLC contract and mocked adapter foundation.
 * No network, browser, dev server, API, live KIS, web, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3ER KIS OHLC contract checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const startingCommit = '5d52a80';
const paths = {
  result: 'docs/planning/phase_3er_kis_ohlc_contract_and_mocked_adapter_foundation_result_v0.1.md',
  checker: 'scripts/check_phase_3er_kis_ohlc_contract_mocked_adapter_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  page: 'src/pages/chart-ai.astro',
  contract: 'src/lib/market-data/normalizedOhlc.ts',
  providerInterface: 'src/lib/server/market-data/ohlcProvider.ts',
  mocked: 'src/lib/server/market-data/mockedOhlcProvider.ts',
  registry: 'src/lib/server/providers/kis/kisOhlcEndpointRegistry.ts',
  kisProvider: 'src/lib/server/providers/kis/kisOhlcProvider.ts',
};

const read = (relativePath) => {
  try { return readFileSync(join(root, relativePath), 'utf8'); } catch { return ''; }
};
const git = (...args) => {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return ''; }
};

const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, read(path)]));
const packageJson = JSON.parse(source.package || '{}');
const baselinePackage = JSON.parse(git('show', `${startingCommit}:package.json`) || '{}');
const phaseSection = source.changelog.split('## Phase 3ER - 2026-07-01')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = new Set(git('diff', '--name-only', startingCommit).split(/\r?\n/).filter(Boolean));
const srcChanges = [...phaseChanges].filter((path) => path.startsWith('src/'));
const apiChanges = srcChanges.filter((path) => path.startsWith('src/pages/api/'));
const supabaseChanges = [...phaseChanges].filter((path) => /supabase/i.test(path));
const migrationChanges = [...phaseChanges].filter((path) => /migration|\.sql$/i.test(path));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) === JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) === JSON.stringify(baselinePackage.devDependencies ?? {});

const runtimeBundle = await build({
  stdin: {
    contents: `
      export {
        toNullableOhlcNumber,
        isRenderableOhlcSeries,
        buildUnavailableOhlcSeries,
        buildSampleOhlcSafety,
      } from './src/lib/market-data/normalizedOhlc.ts';
      export {
        createMockedOhlcProvider,
        getMockedOhlcSeries,
        MOCKED_OHLC_SAMPLE_SYMBOLS,
      } from './src/lib/server/market-data/mockedOhlcProvider.ts';
      export {
        KIS_OHLC_ENDPOINT_REGISTRY,
        resolveVerifiedKisOhlcEndpoint,
        isKisOhlcEndpointVerified,
      } from './src/lib/server/providers/kis/kisOhlcEndpointRegistry.ts';
      export { createKisOhlcProvider } from './src/lib/server/providers/kis/kisOhlcProvider.ts';
      export { evaluateKisOwnerLocalGate } from './src/lib/server/providers/kis/kisOwnerLocalGate.ts';
    `,
    resolveDir: root,
    sourcefile: 'phase-3er-contract-entry.ts',
    loader: 'ts',
  },
  bundle: true, format: 'esm', platform: 'node', target: 'node18', write: false, logLevel: 'silent',
});
const runtime = await import(`data:text/javascript;base64,${Buffer.from(runtimeBundle.outputFiles[0].text).toString('base64')}`);

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) { passed += 1; process.stdout.write(`  [PASS] ${label}\n`); }
  else { failed += 1; failures.push(label); process.stdout.write(`  [FAIL] ${label}\n`); }
};

process.stdout.write('=== Phase 3ER KIS OHLC Contract and Mocked Adapter Foundation Contract ===\n\n');

process.stdout.write('Files, command, result, and changelog:\n');
check('Result document exists', existsSync(join(root, paths.result)));                                    // 1
check('Static checker exists', existsSync(join(root, paths.checker)));                                    // 2
check('Package checker command exists',                                                                   // 3
  packageJson.scripts?.['check:phase-3er-kis-ohlc-contract-mocked-adapter'] ===
    'node scripts/check_phase_3er_kis_ohlc_contract_mocked_adapter_contract.mjs');
check('Changelog contains Phase 3ER', phaseSection.length > 0);                                           // 4
check('Result status is implemented',
  source.result.includes('Implemented — normalized OHLC contract and mocked adapter foundation ready.')); // 5
check('Result references Phase 3EQ', source.result.includes('Phase 3EQ'));                                // 6
process.stdout.write('\n');

process.stdout.write('Normalized OHLC contract:\n');
check('Contract file exists', existsSync(join(root, paths.contract)));                                    // 7
check('Contract exports NormalizedOhlcPoint', source.contract.includes('NormalizedOhlcPoint'));           // 8
check('Contract exports NormalizedOhlcSeries', source.contract.includes('NormalizedOhlcSeries'));         // 9
for (const field of ['dateTime', 'open', 'high', 'low', 'close', 'volume']) {
  check(`Contract point includes ${field}`, source.contract.includes(field));                             // 10
}
for (const field of ['period', 'interval', 'source', 'freshness', 'isLive', 'providerStatus']) {
  check(`Contract series includes ${field}`, source.contract.includes(field));                            // 11
}
check('Contract includes safety.rawResponsePrinted false', source.contract.includes('rawResponsePrinted: false')); // 12
check('Contract includes safety.secretsPrinted false', source.contract.includes('secretsPrinted: false')); // 13
check('Contract includes safety.publicProductionBlocked true', source.contract.includes('publicProductionBlocked: true')); // 14
check('Contract includes toNullableOhlcNumber', source.contract.includes('toNullableOhlcNumber'));        // 15
check('Contract includes isRenderableOhlcSeries', source.contract.includes('isRenderableOhlcSeries'));    // 16
process.stdout.write('\n');

process.stdout.write('OHLC provider interface:\n');
check('Provider interface file exists', existsSync(join(root, paths.providerInterface)));                 // 17
check('Interface includes OhlcProviderRequest', source.providerInterface.includes('OhlcProviderRequest')); // 18
check('Interface includes OhlcProviderContext', source.providerInterface.includes('OhlcProviderContext')); // 19
check('Interface includes allowNetwork', source.providerInterface.includes('allowNetwork'));               // 20
check('Interface includes allowKisLive', source.providerInterface.includes('allowKisLive'));               // 21
process.stdout.write('\n');

process.stdout.write('Mocked OHLC provider (static):\n');
check('Mocked provider file exists', existsSync(join(root, paths.mocked)));                                // 22
check('Mocked provider does not use Math.random', !source.mocked.includes('Math.random'));                 // 23
check('Mocked provider does not use Date.now', !source.mocked.includes('Date.now'));                        // 24
for (const symbol of ['005930', '000660', '069500', 'AAPL', 'SPY']) {
  check(`Mocked provider supports ${symbol}`, source.mocked.includes(symbol));                              // 25-29
}
check('Mocked provider returns source mocked', source.mocked.includes("source: 'mocked'"));                // 30
check('Mocked provider returns freshness sample', source.mocked.includes("freshness: 'sample'"));          // 31
check('Mocked provider returns isLive false', source.mocked.includes('isLive: false'));                    // 32
check('Mocked provider returns providerStatus sample', source.mocked.includes("providerStatus: 'sample'")); // 33
process.stdout.write('\n');

process.stdout.write('KIS OHLC endpoint registry:\n');
check('Registry file exists', existsSync(join(root, paths.registry)));                                     // 42
check('Registry includes KR_STOCK_DAILY_OHLC', source.registry.includes('KR_STOCK_DAILY_OHLC'));           // 43
check('Registry includes KR_ETF_DAILY_OHLC', source.registry.includes('KR_ETF_DAILY_OHLC'));               // 44
check('Registry includes KR_STOCK_INTRADAY_OHLC', source.registry.includes('KR_STOCK_INTRADAY_OHLC'));     // 45
check('Registry includes US_STOCK_DAILY_OHLC', source.registry.includes('US_STOCK_DAILY_OHLC'));           // 46
check('Registry includes KR_ETF_INTRADAY_OHLC', source.registry.includes('KR_ETF_INTRADAY_OHLC'));
check('Registry includes US_ETF_DAILY_OHLC', source.registry.includes('US_ETF_DAILY_OHLC'));
check('Registry marks endpoints unverified',
  /verification:\s*'unverified'/.test(source.registry) && !/verified-official-docs/.test(source.registry)); // 47
check('Registry does not hardcode a real endpoint path',
  !/https?:\/\//.test(source.registry) && source.registry.includes('VERIFY_WITH_KIS_DOCS'));
process.stdout.write('\n');

process.stdout.write('Blocked KIS OHLC provider (static):\n');
check('KIS OHLC provider file exists', existsSync(join(root, paths.kisProvider)));                          // 49
check('KIS OHLC provider uses owner-local gate', source.kisProvider.includes('evaluateKisOwnerLocalGate')); // 50
check('KIS OHLC provider uses endpoint registry',
  source.kisProvider.includes('resolveVerifiedKisOhlcEndpoint'));                                           // 51
check('KIS OHLC provider does not fetch', !/\bfetch\s*\(/.test(source.kisProvider));                        // 52
check('KIS OHLC provider does not read env',
  !source.kisProvider.includes('process.env') && !/\.env\b/.test(source.kisProvider));                      // 53
check('KIS OHLC provider does not call account/trading APIs',
  !/\b(order|trading|account_no)\b/i.test(source.kisProvider) && !/매수|매도|주문/.test(source.kisProvider));
process.stdout.write('\n');

process.stdout.write('Chart AI preservation:\n');
check('Chart AI page still contains sample chart labels',
  source.page.includes('샘플 차트') && source.page.includes('샘플 OHLC·거래량 데이터') && source.page.includes('실제 시세 아님')); // 55
check('Chart AI page still contains quote preview section', source.page.includes('chartAiQuotePreview'));  // 56
check('Chart AI page not changed in this phase', !srcChanges.includes(paths.page));
process.stdout.write('\n');

process.stdout.write('No OHLC API route, images, dependencies, or storage changes:\n');
check('No OHLC API route added', addedFiles.every((path) => !/ohlc/i.test(path) || !path.startsWith('src/pages/api/'))); // 57
check('No public route added under src/pages/api', apiChanges.length === 0);                                // 58
check('No image file added', addedImages.length === 0);                                                     // 59
check('No dependency added',
  dependenciesUnchanged && devDependenciesUnchanged && !phaseChanges.has('package-lock.json'));              // 60
check('No Supabase file changed', supabaseChanges.length === 0);                                             // 61
check('No SQL/migration file added', migrationChanges.length === 0);                                         // 62
process.stdout.write('\n');

process.stdout.write('Docs safety:\n');
const RAW_FIELDS = /stck_prpr|stck_oprc|stck_hgpr|stck_lwpr|acml_vol|rt_cd/i;
const SECRET_VALUE = (text) =>
  /Bearer\s+[A-Za-z0-9._-]{8,}/.test(text) ||
  /KIS_APP_KEY['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_APP_SECRET['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_ACCESS_TOKEN['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text);
const NO_PRICE = (text) => !/\b(open|high|low|close|현재가|종가)\b[^\n]*[:=]\s*\d{3,}/i.test(text);
check('Docs contain no actual market price values', NO_PRICE(source.result));                               // 63
check('Docs contain no raw KIS response fields', !RAW_FIELDS.test(source.result));                           // 64
check('Docs contain no secret-looking values', !SECRET_VALUE(source.result));                                // 65
process.stdout.write('\n');

process.stdout.write('Changelog safety:\n');
check('Changelog records no live KIS call', /no live KIS call/i.test(phaseSection));                        // 66
check('Changelog records no deployment', /no deployment/i.test(phaseSection));                              // 67
check('Changelog records no push', /no push/i.test(phaseSection));                                          // 68
check('Result recommends Phase 3ES',
  source.result.includes('Phase 3ES — Owner-Local KIS OHLC Smoke'));                                        // 69
check('Known legacy checker note preserved',
  source.result.includes('100/101') && source.result.includes('valuation'));                                // 70
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3ER KIS OHLC contract checker.') && !fetchAttempted);
process.stdout.write('\n');

process.stdout.write('Mocked OHLC provider behavior (deterministic):\n');
for (const symbol of ['005930', '000660', '069500', 'AAPL', 'SPY']) {
  const market = symbol === 'AAPL' || symbol === 'SPY' ? 'US' : 'KR';
  const a = runtime.getMockedOhlcSeries({ symbol, market, period: '1m' });
  const b = runtime.getMockedOhlcSeries({ symbol, market, period: '1m' });
  check(`Mocked series for ${symbol} is deterministic`, JSON.stringify(a) === JSON.stringify(b));
  check(`Mocked series for ${symbol} is non-live sample`,
    a.source === 'mocked' && a.freshness === 'sample' && a.isLive === false && a.providerStatus === 'sample'); // 33 (per symbol)
  check(`Mocked series for ${symbol} has at least 2 points`, a.points.length >= 2);                          // 35
  check(`Mocked series for ${symbol} includes volume`, a.points.every((point) => point.volume !== undefined)); // 36
  check(`Mocked series for ${symbol} points are ascending`,
    a.points.every((point, index) => index === 0 || new Date(point.dateTime) > new Date(a.points[index - 1].dateTime))); // 34
}
for (const period of ['1d', '1w', '1m', '3m', '1y']) {
  const series = runtime.getMockedOhlcSeries({ symbol: '005930', market: 'KR', period });
  check(`Mocked provider handles period ${period}`, series.period === period && series.points.length >= 2);  // 37-41
}
check('Mocked provider is a valid OhlcProvider instance',
  (() => {
    const p = runtime.createMockedOhlcProvider();
    return typeof p.id === 'string' && typeof p.label === 'string' && typeof p.getOhlc === 'function';
  })());
process.stdout.write('\n');

process.stdout.write('KIS OHLC provider and registry behavior (deterministic):\n');
for (const key of Object.keys(runtime.KIS_OHLC_ENDPOINT_REGISTRY)) {
  check(`resolveVerifiedKisOhlcEndpoint(${key}) returns null`, runtime.resolveVerifiedKisOhlcEndpoint(key) === null); // 48
}
const kisProvider = runtime.createKisOhlcProvider();
const blockedSeries = await kisProvider.getOhlc(
  { symbol: '005930', market: 'KR', period: '1m' },
  { mode: 'fixture', allowNetwork: false },
);
const gateOpenSeries = await kisProvider.getOhlc(
  { symbol: '005930', market: 'KR', period: '1m' },
  { mode: 'owner-local', allowNetwork: true, allowKisLive: true },
);
check('KIS OHLC provider returns unavailable when gate is blocked',
  blockedSeries.isLive === false && blockedSeries.source === 'unavailable' && blockedSeries.providerStatus === 'blocked'); // 54
check('KIS OHLC provider returns unavailable even when gate is open (endpoint unverified)',
  gateOpenSeries.isLive === false && gateOpenSeries.source === 'unavailable'); // 54
check('KIS OHLC provider never returns points in this phase',
  blockedSeries.points.length === 0 && gateOpenSeries.points.length === 0);
process.stdout.write('\n');

process.stdout.write('Normalized contract helper behavior (deterministic):\n');
check('toNullableOhlcNumber coerces invalid values to null',
  runtime.toNullableOhlcNumber('abc') === null && runtime.toNullableOhlcNumber('') === null &&
  runtime.toNullableOhlcNumber(Number.NaN) === null && runtime.toNullableOhlcNumber('12.5') === 12.5);
check('isRenderableOhlcSeries requires at least 2 points',
  runtime.isRenderableOhlcSeries({ points: [{ dateTime: 'a', open: 1, high: 1, low: 1, close: 1, volume: 1 }] }) === false);
check('isRenderableOhlcSeries accepts 2+ valid points',
  runtime.isRenderableOhlcSeries({
    points: [
      { dateTime: 'a', open: 1, high: 1, low: 1, close: 1, volume: 1 },
      { dateTime: 'b', open: null, high: null, low: null, close: null, volume: null },
    ],
  }) === true);
const unavailable = runtime.buildUnavailableOhlcSeries({
  symbol: '005930', market: 'KR', assetType: 'stock', currency: 'KRW', period: '1m', message: 'test',
});
check('buildUnavailableOhlcSeries returns empty, non-live, safe series',
  unavailable.points.length === 0 && unavailable.isLive === false && unavailable.source === 'unavailable' &&
  unavailable.safety.rawResponsePrinted === false && unavailable.safety.secretsPrinted === false &&
  unavailable.safety.publicProductionBlocked === true);
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3ER checks passed.\n');
}
