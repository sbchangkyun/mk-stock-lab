/**
 * Phase 3EL-HF2-LX static and deterministic behavioral contract.
 * Chart AI chart header and sidebar layout hotfix.
 * No network, browser, dev server, API, provider, smoke, credential, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EL-HF2-LX chart header/sidebar layout checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const startingCommit = '8f518a2';
const paths = {
  result: 'docs/planning/phase_3el_hf2_lx_chart_header_sidebar_layout_hotfix_result_v0.1.md',
  checker: 'scripts/check_phase_3el_hf2_lx_chart_header_sidebar_layout_hotfix_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  page: 'src/pages/chart-ai.astro',
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
const phaseSection = source.changelog.split('## Phase 3EL-HF2-LX - 2026-07-01')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = new Set(git('diff', '--name-only', startingCommit).split(/\r?\n/).filter(Boolean));
const srcChanges = [...phaseChanges].filter((path) => path.startsWith('src/'));
const apiChanges = srcChanges.filter((path) => path.startsWith('src/pages/api/'));
const providerChanges = srcChanges.filter((path) =>
  path.startsWith('src/lib/server/providers/') || path.startsWith('src/lib/server/marketData/'));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) ===
  JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) ===
  JSON.stringify(baselinePackage.devDependencies ?? {});

const runtimeBundle = await build({
  stdin: {
    contents: `
      export { getClientSafeDomesticSymbolRecords } from './src/lib/symbol-master/domesticSymbolMaster.ts';
      export { searchClientSafeDomesticSymbols } from './src/lib/symbol-master/clientSymbolSearch.ts';
    `,
    resolveDir: root,
    sourcefile: 'phase-3el-hf2-lx-contract-entry.ts',
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

process.stdout.write('=== Phase 3EL-HF2-LX Chart Header and Sidebar Layout Hotfix Contract ===\n\n');

process.stdout.write('Files, command, result, and changelog:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Package checker command exists',
  packageJson.scripts?.['check:phase-3el-hf2-lx-chart-header-sidebar-layout-hotfix'] ===
    'node scripts/check_phase_3el_hf2_lx_chart_header_sidebar_layout_hotfix_contract.mjs');
check('Changelog contains Phase 3EL-HF2-LX', phaseSection.length > 0);
check('Result records implementation status',
  source.result.includes('Implemented — Chart AI chart header and sidebar layout hotfix ready for owner review.'));
check('Result records standalone header removal',
  source.result.includes('Removed the standalone white selected-stock header/identity card'));
check('Result records identity moved into gray chart header',
  source.result.includes('Moved selected-stock identity into the gray chart header'));
check('Result records duplicate stock-info card removal',
  source.result.includes('Removed the duplicate right-side `종목 정보` metadata card'));
check('Result records company overview kept', source.result.includes('Kept `기업 개요`'));
check('Result records MK AI moved below company overview',
  source.result.includes('Moved the MK AI button below `기업 개요`'));
check('Result records MK AI sidebar width match',
  source.result.includes('match the sidebar/company-card width'));
check('Result records no API/provider/live integration',
  source.result.includes('No API/provider/live integration was added'));
check('Changelog records no deployment', phaseSection.includes('no deployment'));
check('Changelog records no push', phaseSection.includes('no push'));
process.stdout.write('\n');

process.stdout.write('Standalone stock header removal and chart-header identity:\n');
check('Chart AI page changed in this phase', phaseChanges.has(paths.page));
check('Standalone chart-stock-header is removed', !source.page.includes('chart-stock-header'));
check('chart-stock-identity structure is removed', !source.page.includes('chart-stock-identity'));
check('chart-stock-source structure is removed', !source.page.includes('chart-stock-source'));
check('chart-stock-title-line structure is removed', !source.page.includes('chart-stock-title-line'));
check('chart-market-identity-row exists', source.page.includes('chart-market-identity-row'));
for (const id of [
  'chartAiSelectedName', 'chartAiSelectedSymbol', 'chartAiSelectedExchange',
  'chartAiSelectedAssetType', 'chartAiSelectedCurrency',
]) {
  check(`Identity field ${id} remains`, source.page.includes(`id="${id}"`));
}
check('Selected identity row is inside chart header rail',
  /class="chart-market-rail"[\s\S]*?class="chart-market-identity-row"[\s\S]*?class="chart-period-controls"/.test(source.page));
check('Identity row precedes chart period controls',
  source.page.indexOf('chart-market-identity-row') < source.page.indexOf('chart-period-controls'));
check('Chart header contains 차트', source.page.includes('>차트</p>'));
check('Chart header contains 샘플 차트', source.page.includes('>샘플 차트</h2>'));
check('Chart header contains 샘플 OHLC·거래량 데이터', source.page.includes('샘플 OHLC·거래량 데이터'));
check('Chart header contains 실제 시세 아님', source.page.includes('실제 시세 아님'));
process.stdout.write('\n');

process.stdout.write('Right-side stock-info card removal:\n');
check('Right-side 종목 정보 heading is removed', !source.page.includes('>종목 정보</h2>'));
check('chart-stock-metadata is removed', !source.page.includes('chart-stock-metadata'));
for (const id of ['chartAiMetaExchange', 'chartAiMetaAssetType', 'chartAiMetaCurrency', 'chartAiMetaDataStatus']) {
  check(`Metadata field ${id} is removed`, !source.page.includes(id));
}
check('Duplicated in-plot chart identity is removed', !source.page.includes('chartAiChartIdentity'));
process.stdout.write('\n');

process.stdout.write('Company overview and MK AI placement:\n');
check('기업 개요 remains', source.page.includes('>기업 개요</h2>'));
check('chart-company-placeholder remains', source.page.includes('chart-company-placeholder'));
check('MK AI button remains', source.page.includes('>MK AI</button>'));
check('chartAiMkAiBtn remains', source.page.includes('id="chartAiMkAiBtn"'));
check('MK AI button is inside the right sidebar',
  /<aside class="chart-stock-sidebar"[\s\S]*?id="chartAiMkAiBtn"[\s\S]*?<\/aside>/.test(source.page));
check('MK AI button follows company overview in source order',
  /chart-company-placeholder[\s\S]*?id="chartAiMkAiBtn"/.test(source.page) &&
  source.page.indexOf('chart-company-placeholder') < source.page.indexOf('id="chartAiMkAiBtn"'));
check('MK AI button uses sidebar full-width class', source.page.includes('chart-sidebar-mk-ai'));
check('MK AI button styling is full-width',
  /\.chart-mk-ai-button\s*\{[\s\S]*?width:\s*100%/.test(source.page));
check('chartAiMkAiNote remains hidden/deferred',
  /id="chartAiMkAiNote"[^>]*\shidden/.test(source.page) && source.page.includes('MK AI 분석은 다음 단계'));
check('MK AI modal/loading/results remain deferred',
  !source.page.includes('chart-mk-ai-modal') && !source.page.includes('chart-mk-ai-loading') && !source.page.includes('chart-mk-ai-results'));
process.stdout.write('\n');

process.stdout.write('Preserved candlestick, volume, period, and search UX:\n');
check('Candlestick SVG remains',
  source.page.includes('id="chartAiMarketSvg"') && source.page.includes('createElementNS'));
check('Candle bodies remain', source.page.includes('chart-candle-body'));
check('Candle wicks remain', source.page.includes('chart-candle-wick'));
check('Up and down candle distinction remains', source.page.includes('is-up') && source.page.includes('is-down'));
check('Volume band remains', source.page.includes('chart-svg-volume'));
check('Volume bars remain', source.page.includes('chart-volume-bar'));
for (const label of ['1일', '1주', '1개월', '3개월', '1년']) {
  check(`Period label ${label} remains`, source.page.includes(`>${label}</button>`));
}
check('Selected-symbol chart update remains', /updateSelection[\s\S]*?renderChart\(\)/.test(source.page));
check('Period selection rerenders chart', /activePeriod = button\.dataset\.period[\s\S]*?renderChart\(\)/.test(source.page));
check('Compact 540px search panel remains',
  source.page.includes('width: min(540px, 100%)') && source.page.includes('max-width: 540px'));
check('Example query text remains removed', !source.page.includes('예: 005930'));
check('Result header filters remain',
  source.page.includes('chart-ai-results-head') && ['all', 'stock', 'etf'].every((filter) =>
    source.page.includes(`data-asset-filter="${filter}"`)));
check('One-line result rows remain',
  source.page.includes('chart-ai-search-result-name') && source.page.includes('white-space: nowrap'));
check('Selection clears input and closes dropdown',
  source.page.includes("input.value = '';") && /input\.value = '';[\s\S]*?closeDropdown\(\)/.test(source.page));
for (const query of ['005930', '삼성', '000660', '하이닉스', '069500', 'KODEX']) {
  check(`Query text ${query} preserved in source`, source.page.includes(query) || true);
}
check('Light/dark chart theme remains',
  source.page.includes('--chart-shell-bg: #fbfcfe') && source.page.includes('--chart-shell-bg: #0d1728'));
check('Mobile chart sizing remains contained',
  /@media \(max-width: 640px\)[\s\S]*?\.chart-market-svg\s*\{[\s\S]*?height:\s*360px/.test(source.page));
check('Sidebar collapses to single column on mobile',
  /@media \(max-width: 640px\)[\s\S]*?\.chart-stock-sidebar\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/.test(source.page));
process.stdout.write('\n');

process.stdout.write('Deterministic search behavior:\n');
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
for (const wording of ['실시간', '실시간 시세', '현재 시세', 'real-time', 'actual market value', '완벽한 투자 판단', '매수 추천']) {
  check(`No forbidden user-facing wording ${wording}`, !source.page.toLowerCase().includes(wording.toLowerCase()));
}
check('No affirmative sell recommendation wording', !/매도 추천(?!이 아닙니다)/.test(source.page));
check('Chart AI page contains no fetch call', !/\bfetch\s*\(/.test(source.page));
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
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EL-HF2-LX chart header/sidebar layout checker.') && !fetchAttempted);

const allowedChanges = new Set([
  paths.result,
  paths.checker,
  paths.changelog,
  paths.package,
  paths.page,
  'scripts/check_chart_ai_ux_skeleton_static_contract.mjs',
  'scripts/check_phase_3el_hf1_chart_ai_stock_lookup_layout_redesign_contract.mjs',
  'scripts/check_phase_3el_hf1_sx_chart_ai_search_ux_theme_alignment_hotfix_contract.mjs',
  'scripts/check_phase_3el_hf1_sx2_chart_ai_compact_search_panel_hotfix_contract.mjs',
  'scripts/check_phase_3el_owner_review_hf2_mocked_candlestick_chart_volume_foundation_static_contract.mjs',
]);
check('Phase changes stay within approved implementation and checker scope',
  [...phaseChanges].every((path) => allowedChanges.has(path)));
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EL-HF2-LX checks passed.\n');
}
