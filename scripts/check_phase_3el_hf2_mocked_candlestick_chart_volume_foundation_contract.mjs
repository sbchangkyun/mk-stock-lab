/**
 * Phase 3EL-HF2 static and deterministic behavioral contract.
 * No network, browser, dev server, API, provider, smoke, credential, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EL-HF2 mocked candlestick checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const startingCommit = 'c1e8821';
const endingCommit = '472b72e';
const paths = {
  result: 'docs/planning/phase_3el_hf2_mocked_candlestick_chart_volume_foundation_result_v0.1.md',
  checker: 'scripts/check_phase_3el_hf2_mocked_candlestick_chart_volume_foundation_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  page: 'src/pages/chart-ai.astro',
  mockedOhlc: 'src/lib/chart-ai/mockedOhlc.ts',
  chartScale: 'src/lib/chart-ai/chartScale.ts',
};

const read = (relativePath) => {
  try { return readFileSync(join(root, relativePath), 'utf8'); } catch { return ''; }
};
const git = (...args) => {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch { return ''; }
};

const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, read(path)]));
const packageJson = JSON.parse(source.package || '{}');
const baselinePackage = JSON.parse(git('show', `${startingCommit}:package.json`) || '{}');
const phaseSection = source.changelog.split('## Phase 3EL-HF2 - 2026-07-01')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = new Set(git('diff', '--name-only', startingCommit, endingCommit).split(/\r?\n/).filter(Boolean));
const srcChanges = [...phaseChanges].filter((path) => path.startsWith('src/'));
const apiChanges = srcChanges.filter((path) => path.startsWith('src/pages/api/'));
const providerChanges = srcChanges.filter((path) =>
  path.startsWith('src/lib/server/providers/') || path.startsWith('src/lib/server/marketData/'));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit, endingCommit).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) ===
  JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) ===
  JSON.stringify(baselinePackage.devDependencies ?? {});

const runtimeBundle = await build({
  stdin: {
    contents: `
      export * from './src/lib/chart-ai/mockedOhlc.ts';
      export * from './src/lib/chart-ai/chartScale.ts';
      export { getClientSafeDomesticSymbolRecords } from './src/lib/symbol-master/domesticSymbolMaster.ts';
      export { searchClientSafeDomesticSymbols } from './src/lib/symbol-master/clientSymbolSearch.ts';
    `,
    resolveDir: root,
    sourcefile: 'phase-3el-hf2-contract-entry.ts',
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  write: false,
  logLevel: 'silent',
});
const runtime = await import(`data:text/javascript;base64,${Buffer.from(runtimeBundle.outputFiles[0].text).toString('base64')}`);

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

process.stdout.write('=== Phase 3EL-HF2 Mocked Candlestick Chart and Volume Contract ===\n\n');

process.stdout.write('Files, command, result, and changelog:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Package checker command exists',
  packageJson.scripts?.['check:phase-3el-hf2-mocked-candlestick-chart-volume-foundation'] ===
    'node scripts/check_phase_3el_hf2_mocked_candlestick_chart_volume_foundation_contract.mjs');
check('Changelog contains Phase 3EL-HF2', phaseSection.length > 0);
check('Result records implementation status',
  source.result.includes('Implemented — mocked candlestick chart and volume foundation ready for owner review.'));
check('Result references SX2 closeout PASS',
  source.result.includes('Phase 3EL-OWNER-REVIEW-HF1-SX2-CLOSEOUT') && source.result.includes('`PASS`'));
check('Result records mocked OHLC scope', source.result.includes('mocked OHLC data contract'));
check('Result records volume foundation scope', source.result.includes('volume foundation'));
check('Result records no API/provider/live integration', source.result.includes('no API/provider/live integration'));
check('Result recommends owner review before MK AI',
  source.result.includes('Phase 3EL-OWNER-REVIEW-HF2') && source.result.includes('before adding MK AI interaction'));
process.stdout.write('\n');

process.stdout.write('Mocked OHLC and geometry behavior:\n');
check('Chart AI page changed', phaseChanges.has(paths.page));
check('Mocked OHLC helper exists', existsSync(join(root, paths.mockedOhlc)));
check('Chart scale helper exists', existsSync(join(root, paths.chartScale)));
check('MockedOhlcPoint type exists', source.mockedOhlc.includes('export type MockedOhlcPoint'));
for (const field of ['date', 'open', 'high', 'low', 'close', 'volume']) {
  check(`MockedOhlcPoint contains ${field}`, new RegExp(`\\b${field}:`).test(source.mockedOhlc));
}
check('OHLC invariant is explicitly validated',
  source.mockedOhlc.includes('point.high >= Math.max(point.open, point.close)') &&
  source.mockedOhlc.includes('point.low <= Math.min(point.open, point.close)') &&
  source.mockedOhlc.includes('point.volume >= 0'));
for (const period of ['1d', '1w', '1m', '3m', '1y']) {
  check(`Period key ${period} exists`, source.mockedOhlc.includes(`'${period}'`));
}

const symbols = ['005930', '000660', '069500'];
const expectedCounts = { '1d': 24, '1w': 7, '1m': 22, '3m': 42, '1y': 56 };
for (const period of runtime.CHART_PERIOD_KEYS) {
  const first = runtime.createMockedOhlcSeries(symbols[0], period);
  const repeat = runtime.createMockedOhlcSeries(symbols[0], period);
  check(`${period} series has expected point count`, first.length === expectedCounts[period]);
  check(`${period} series is deterministic`, JSON.stringify(first) === JSON.stringify(repeat));
  check(`${period} series preserves OHLC invariants`, runtime.isValidMockedOhlcSeries(first));
  const geometry = runtime.buildMockedChartGeometry(first, period);
  check(`${period} geometry covers every point`, geometry.candles.length === first.length);
  check(`${period} geometry includes price and date axes`,
    geometry.priceLabels.length === 5 && geometry.dateLabels.length >= 2);
}
check('Selected symbols produce distinct mocked series',
  new Set(symbols.map((symbol) => JSON.stringify(runtime.createMockedOhlcSeries(symbol, '1m')))).size === symbols.length);
process.stdout.write('\n');

process.stdout.write('Chart rendering, state, theme, and accessibility:\n');
for (const label of ['1일', '1주', '1개월', '3개월', '1년']) {
  check(`Period UI includes ${label}`, source.page.includes(`>${label}</button>`));
}
check('Candlestick body rendering exists', source.page.includes('chart-candle-body'));
check('Candlestick wick rendering exists', source.page.includes('chart-candle-wick'));
check('Up and down candle distinction exists', source.page.includes('is-up') && source.page.includes('is-down'));
check('Volume band exists', source.page.includes('chart-svg-volume'));
check('Volume bars exist', source.page.includes('chart-volume-bar'));
check('Price and date axis layers exist',
  source.page.includes('chart-axis-text') && source.chartScale.includes('priceLabels') && source.chartScale.includes('dateLabels'));
check('Rendering uses dependency-free SVG',
  source.page.includes('id="chartAiMarketSvg"') && source.page.includes('createElementNS'));
check('Page contains sample chart label', source.page.includes('샘플 차트'));
check('Page contains non-live label', source.page.includes('실제 시세 아님'));
check('Page contains safe sample OHLC and volume label', source.page.includes('샘플 OHLC·거래량 데이터'));
check('Selected symbol rerenders chart', /updateSelection[\s\S]*?renderChart\(\)/.test(source.page));
check('Period selection rerenders chart', /activePeriod = button\.dataset\.period[\s\S]*?renderChart\(\)/.test(source.page));
check('Active period state exists', source.page.includes("let activePeriod: ChartPeriodKey = '1d'"));
check('MK AI CTA remains', source.page.includes('id="chartAiMkAiBtn"'));
check('MK AI modal/loading/results remain deferred',
  !source.page.includes('chart-mk-ai-modal') && !source.page.includes('chart-mk-ai-loading') && !source.page.includes('chart-mk-ai-results'));
check('Company profile placeholder remains compact',
  source.page.includes('chart-company-placeholder') && source.page.includes('companyProfile'));
for (const token of [
  '--chart-shell-bg', '--chart-shell-grid', '--chart-shell-axis', '--chart-shell-volume',
  '--chart-shell-up', '--chart-shell-down', ':global(body.dark-mode)',
]) {
  check(`Theme token ${token} remains`, source.page.includes(token));
}
check('Chart shell is not fixed dark-only',
  source.page.includes('--chart-shell-bg: #fbfcfe') && source.page.includes('--chart-shell-bg: #0d1728'));
check('Mobile chart sizing remains contained',
  /@media \(max-width: 640px\)[\s\S]*?\.chart-market-svg\s*\{[\s\S]*?height:\s*360px/.test(source.page));
check('Chart SVG is responsive',
  /\.chart-market-svg\s*\{[\s\S]*?width:\s*100%/.test(source.page) && source.page.includes('preserveAspectRatio="none"'));
check('Chart has accessible label',
  source.page.includes('role="img"') && source.page.includes('선택 종목의 샘플 캔들 차트와 거래량'));
check('Period controls are buttons',
  runtime.CHART_PERIOD_KEYS.every((period) => source.page.includes(`<button type="button" data-period="${period}"`)));
process.stdout.write('\n');

process.stdout.write('SX2 search UX and deterministic query behavior:\n');
check('Compact 540px search panel remains',
  source.page.includes('width: min(540px, 100%)') && source.page.includes('max-width: 540px'));
check('Example query text remains removed', !source.page.includes('예: 005930'));
check('Attached dropdown remains',
  source.page.includes('top: calc(100% - 1px)') && source.page.includes('border-radius: 0 0 14px 14px'));
check('Result header filters remain',
  source.page.includes('chart-ai-results-head') && ['all', 'stock', 'etf'].every((filter) =>
    source.page.includes(`data-asset-filter="${filter}"`)));
check('One-line result rows remain',
  source.page.includes('chart-ai-search-result-name') && source.page.includes('white-space: nowrap'));
check('Result rows remain keyboard-selectable',
  source.page.includes("document.createElement('button')") && source.page.includes("event.key === 'ArrowDown'"));
check('Selection clears input and closes dropdown',
  source.page.includes("input.value = '';") && /input\.value = '';[\s\S]*?closeDropdown\(\)/.test(source.page));

const records = runtime.getClientSafeDomesticSymbolRecords();
const cases = [
  ['005930', '005930'],
  ['삼성', '005930'],
  ['000660', '000660'],
  ['하이닉스', '000660'],
  ['069500', '069500'],
  ['KODEX', '069500'],
];
for (const [query, expectedSymbol] of cases) {
  const results = runtime.searchClientSafeDomesticSymbols(records, {
    query,
    limit: 15,
    includeStatuses: ['active'],
  });
  check(`Search ${query} finds ${expectedSymbol}`, results.some((result) => result.symbol === expectedSymbol));
}
process.stdout.write('\n');

process.stdout.write('Safety and file boundaries:\n');
for (const wording of ['실시간', '실시간 시세', '현재 시세', 'real-time', 'actual market value', '매수 추천']) {
  check(`No forbidden user-facing wording ${wording}`, !source.page.toLowerCase().includes(wording.toLowerCase()));
}
check('No affirmative sell recommendation wording', !/매도 추천(?!이 아닙니다)/.test(source.page));
check('No buy or order CTA introduced', !/<button[^>]*>\s*(?:매수|매도|주문)\s*<\/button>/.test(source.page));
check('Chart AI page has no ungated fetch (only gated owner-local preview allowed)',
  !/\bfetch\s*\(/.test(source.page) ||
  (source.page.includes('owner-local-quote-preview') && source.page.includes('owner-local')));
check('Chart AI page contains no process.env', !source.page.includes('process.env'));
check('Chart AI page contains no import.meta.env', !source.page.includes('import.meta.env'));
check('Chart AI page does not import KIS provider files', !/providers\/(?:kis|koreaInvestment)/i.test(source.page));
check('Chart AI page does not import Supabase', !/supabase/i.test(source.page));
check('Chart AI page does not import API routes', !/from\s+['"][^'"]*pages\/api\//.test(source.page));
check('No API route file changed', apiChanges.length === 0);
check('No provider file changed', providerChanges.length === 0);
for (const [label, path] of [
  ['Home', 'src/pages/index.astro'],
  ['Market', 'src/pages/market.astro'],
  ['Lab', 'src/pages/lab.astro'],
  ['Portfolio', 'src/pages/portfolio.astro'],
  ['MyPage', 'src/pages/mypage.astro'],
]) {
  check(`No ${label} page changed`, !phaseChanges.has(path));
}
check('No Layout file changed', ![...phaseChanges].some((path) => path.startsWith('src/layouts/')));
check('No image file added', addedImages.length === 0);
check('No production dependency added', dependenciesUnchanged);
check('No development dependency added', devDependenciesUnchanged);
check('Lockfile unchanged', !phaseChanges.has('package-lock.json'));
check('Changelog records no deployment', phaseSection.includes('no deployment'));
check('Changelog records no push', phaseSection.includes('no push'));
const currentChartPackages = Object.keys({ ...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {}) })
  .filter((name) => /chart|d3|plotly|echarts|highcharts/i.test(name));
const baselineChartPackages = Object.keys({ ...(baselinePackage.dependencies ?? {}), ...(baselinePackage.devDependencies ?? {}) })
  .filter((name) => /chart|d3|plotly|echarts|highcharts/i.test(name));
check('No charting package was added',
  JSON.stringify(currentChartPackages) === JSON.stringify(baselineChartPackages));
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EL-HF2 mocked candlestick checker.') && !fetchAttempted);

const allowedChanges = new Set([
  paths.result,
  paths.checker,
  paths.changelog,
  paths.package,
  paths.page,
  paths.mockedOhlc,
  paths.chartScale,
  'scripts/check_phase_3el_hf1_chart_ai_stock_lookup_layout_redesign_contract.mjs',
  'scripts/check_phase_3el_hf1_sx_chart_ai_search_ux_theme_alignment_hotfix_contract.mjs',
  'scripts/check_phase_3el_hf1_sx2_chart_ai_compact_search_panel_hotfix_contract.mjs',
  'scripts/check_phase_3el_owner_review_hf1_sx2_closeout_static_contract.mjs',
  'scripts/check_chart_ai_ux_skeleton_static_contract.mjs',
]);
check('Phase changes stay within approved implementation and checker scope',
  [...phaseChanges].every((path) => allowedChanges.has(path)));
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EL-HF2 checks passed.\n');
}
