/**
 * Phase 3EL-HF1 static and deterministic behavioral contract.
 * No network, browser, dev server, API, provider, smoke, credential, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EL-HF1 Chart AI layout checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const startingCommit = '8fede60';
const endingCommit = '41b0af4';
const paths = {
  result: 'docs/planning/phase_3el_hf1_chart_ai_stock_lookup_layout_redesign_result_v0.1.md',
  checker: 'scripts/check_phase_3el_hf1_chart_ai_stock_lookup_layout_redesign_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  page: 'src/pages/chart-ai.astro',
  search: 'src/lib/symbol-master/domesticSymbolSearch.ts',
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
const phaseSection = source.changelog.split('## Phase 3EL-HF1 - 2026-06-30')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = new Set(git('diff', '--name-only', startingCommit, endingCommit).split(/\r?\n/).filter(Boolean));
const srcChanges = [...phaseChanges].filter((path) => path.startsWith('src/'));
const apiChanges = srcChanges.filter((path) => path.startsWith('src/pages/api/'));
const providerChanges = srcChanges.filter((path) =>
  path.startsWith('src/lib/server/providers/') || path.startsWith('src/lib/server/marketData/'));
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const imageChanges = [...phaseChanges].filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) ===
  JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) ===
  JSON.stringify(baselinePackage.devDependencies ?? {});
const lockfileUnchanged = !phaseChanges.has('package-lock.json');

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

process.stdout.write('=== Phase 3EL-HF1 Chart AI Stock Lookup Layout Contract ===\n\n');

process.stdout.write('Files, command, result, and changelog:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Package checker command exists',
  packageJson.scripts?.['check:phase-3el-hf1-chart-ai-stock-lookup-layout-redesign'] ===
    'node scripts/check_phase_3el_hf1_chart_ai_stock_lookup_layout_redesign_contract.mjs');
check('Changelog contains Phase 3EL-HF1', phaseSection.length > 0);
check('Result records implementation status',
  source.result.includes('Implemented — Chart AI stock lookup-first layout ready for owner review.'));
check('Result references Phase 3EL-UXR', source.result.includes('Phase 3EL-UXR'));
check('Result references failed owner review', source.result.includes('FAIL_PRODUCT_DIRECTION / UX_REDESIGN_REQUIRED'));
check('Result records no API/provider/live integration', source.result.includes('No API/provider/live integration'));
check('Result recommends Phase 3EL-HF2', source.result.includes('Phase 3EL-HF2'));
process.stdout.write('\n');

process.stdout.write('Product identity and search UX:\n');
check('Chart AI page changed', phaseChanges.has(paths.page));
for (const copy of ['종목 차트', '종목 검색', '종목명 또는 종목코드 입력', '조회']) {
  check(`Page contains ${copy}`, source.page.includes(copy));
}
check('Long analysis button was removed', !source.page.includes('선택 종목 분석 보기'));
check('Search input exists', source.page.includes('id="chartAiInput"') && source.page.includes('type="search"'));
check('Selected stock state is separate',
  source.page.includes('chart-market-identity-row') && source.page.includes('chartAiSelectedSymbol'));
check('Search selection clears input', source.page.includes("input.value = '';"));
check('Compact search dropdown exists',
  source.page.includes('chart-lookup-dropdown') && source.page.includes('chart-ai-search-results'));
check('No-match empty state exists',
  source.page.includes('chartAiEmptyState') && source.page.includes('검색 결과가 없습니다'));
for (const query of ['005930', '삼성', '000660', '하이닉스', '069500', 'KODEX']) {
  check(`Checker preserves behavior query ${query}`, source.checker.includes(`'${query}'`));
}
check('Compact stock and ETF filters remain',
  ['all', 'stock', 'etf'].every((filter) => source.page.includes(`data-asset-filter="${filter}"`)));
check('Results scroll locally', /\.chart-ai-search-results[\s\S]*?overflow-y:\s*auto/.test(source.page));
process.stdout.write('\n');

process.stdout.write('Stock identity and chart-first shell:\n');
check('Central selected-stock identity exists', source.page.includes('class="chart-market-identity-row"'));
for (const id of [
  'chartAiSelectedName', 'chartAiSelectedSymbol', 'chartAiSelectedExchange',
  'chartAiSelectedAssetType', 'chartAiSelectedCurrency',
]) {
  check(`Stock identity includes ${id}`, source.page.includes(`id="${id}"`));
}
check('Chart context includes sample label', source.page.includes('샘플 OHLC·거래량 데이터'));
check('Chart context includes non-live label', source.page.includes('실제 시세 아님'));
check('Primary chart panel exists', source.page.includes('class="chart-market-panel"'));
check('Chart panel contains 차트', source.page.includes('>차트</p>'));
check('Chart panel contains 샘플 차트', source.page.includes('>샘플 차트</h2>'));
check('Candlestick-ready area exists', source.page.includes('chart-candlestick-ready'));
check('Candlestick rendering layer exists', source.page.includes('chart-svg-candles'));
check('Volume rendering layer exists', source.page.includes('chart-svg-volume'));
check('HF2 mocked OHLC foundation is client-safe', source.page.includes("../lib/chart-ai/mockedOhlc"));
check('Period controls exist', source.page.includes('chart-period-controls'));
for (const period of ['1일', '1주', '1개월', '3개월', '1년']) {
  check(`Period control includes ${period}`, source.page.includes(`>${period}</button>`));
}
check('Period controls are buttons', source.page.includes('data-period="1d"'));
process.stdout.write('\n');

process.stdout.write('MK AI, profile placeholder, and default-content policy:\n');
check('MK AI button exists',
  source.page.includes('id="chartAiMkAiBtn"') && source.page.includes('>MK AI</button>'));
check('MK AI button is inside chart sidebar source structure',
  /<aside class="chart-stock-sidebar"[\s\S]*?id="chartAiMkAiBtn"/.test(source.page));
check('MK AI remains a deferred non-blocking message', source.page.includes('MK AI 분석은 다음 단계'));
for (const label of [
  '추세 요약', '모멘텀', '변동성', '지지 / 저항', '리스크 체크',
  '분석 템플릿', '매매 전략', '가격 패턴', '기술적 지표', '국면·수급',
]) {
  check(`Default UI excludes ${label}`, !source.page.includes(label));
}
check('Company/profile placeholder exists', source.page.includes('chart-company-placeholder'));
check('Company placeholder contains 기업 개요', source.page.includes('기업 개요'));
check('Company placeholder contains 샘플 정보', source.page.includes('샘플 정보'));
check('Company placeholder defers companyProfile data', source.page.includes('companyProfile 데이터와 연결될 예정'));
process.stdout.write('\n');

process.stdout.write('User-facing wording and runtime safety:\n');
for (const wording of ['실시간', '실시간 시세', '현재 시세', 'real-time', 'actual market value', '완벽한 투자 판단', '매수 추천']) {
  check(`Page excludes forbidden wording ${wording}`, !source.page.includes(wording));
}
check('Page uses 매도 추천 only in an explicit non-recommendation disclaimer',
  !source.page.includes('매도 추천') || source.page.includes('매수·매도 추천이 아닙니다'));
check('No buy or order CTA introduced', !/주문|매수하기|매도하기/.test(source.page));
check('Page does not call fetch', !/\bfetch\s*\(/.test(source.page));
check('Page does not use process.env', !source.page.includes('process.env'));
check('Page does not use import.meta.env', !source.page.includes('import.meta.env'));
check('Page does not import KIS providers', !/providers\/kis|kisClient/i.test(source.page));
check('Page does not import Supabase', !/supabase|@supabase/i.test(source.page));
check('Page does not import or call API routes', !/pages\/api|pages\\api|\/api\//i.test(source.page));
process.stdout.write('\n');

process.stdout.write('Deterministic symbol-search behavior:\n');
let symbolLibrary;
try {
  const bundled = await build({
    stdin: {
      contents: [
        "export * from './src/lib/symbol-master/domesticSymbolMaster.ts';",
        "export * from './src/lib/symbol-master/domesticSymbolSearch.ts';",
      ].join('\n'),
      resolveDir: root,
      sourcefile: 'phase-3el-hf1-check-entry.ts',
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
  symbolLibrary = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  check('Symbol/search library bundles and imports', Boolean(symbolLibrary));
} catch {
  check('Symbol/search library bundles and imports', false);
}
if (symbolLibrary) {
  for (const [query, expected] of [
    ['005930', '005930'], ['삼성', '005930'], ['000660', '000660'],
    ['하이닉스', '000660'], ['069500', '069500'],
  ]) {
    check(`Search ${query} resolves ${expected}`,
      symbolLibrary.searchDomesticSymbols({ query })[0]?.symbol === expected);
  }
  const kodex = symbolLibrary.searchDomesticSymbols({ query: 'KODEX' });
  check('Search KODEX resolves at least one ETF',
    kodex.length > 0 && kodex.every((record) => record.assetType === 'etf'));
  check('Behavior did not attempt network access', fetchAttempted === false);
}
process.stdout.write('\n');

process.stdout.write('Change-scope, mobile, and dependency boundaries:\n');
for (const [label, path] of [
  ['Home', 'src/pages/index.astro'], ['Market', 'src/pages/market.astro'],
  ['Lab', 'src/pages/lab.astro'], ['Portfolio', 'src/pages/portfolio.astro'],
  ['MyPage', 'src/pages/mypage.astro'],
]) {
  check(`No ${label} page changed`, !phaseChanges.has(path));
}
check('No Layout file changed', ![...phaseChanges].some((path) => path.startsWith('src/layouts/')));
check('No API route file changed', apiChanges.length === 0);
check('No provider file changed', providerChanges.length === 0);
check('Only Chart AI changed among runtime files',
  srcChanges.length === 1 && srcChanges[0] === paths.page);
check('No image file was added', imageChanges.length === 0);
check('No dependency was added', dependenciesUnchanged && devDependenciesUnchanged && lockfileUnchanged);
check('Mobile layout includes 640px containment', source.page.includes('@media (max-width: 640px)'));
check('Chart layout collapses below 820px', source.page.includes('@media (max-width: 820px)'));
check('Changelog records no deployment', /no deployment/i.test(phaseSection));
check('Changelog records no push', /no push/i.test(phaseSection));
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EL-HF1 Chart AI layout checker.'));
check('Checker did not attempt network access', fetchAttempted === false);
check('Checker does not read .env files',
  !/readFileSync\s*\([^)]*["'][^"']*\.env/i.test(source.checker));

process.stdout.write(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) {
  process.stdout.write(`\nFailed checks:\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write('All Phase 3EL-HF1 checks passed.\n');
