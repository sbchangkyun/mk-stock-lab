/**
 * Phase 3EL-HF1-SX static and deterministic behavioral contract.
 * No network, browser, dev server, API, provider, smoke, credential, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EL-HF1-SX Chart AI search/theme checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const startingCommit = '0d8f357';
const paths = {
  result: 'docs/planning/phase_3el_hf1_sx_chart_ai_search_ux_theme_alignment_hotfix_result_v0.1.md',
  checker: 'scripts/check_phase_3el_hf1_sx_chart_ai_search_ux_theme_alignment_hotfix_contract.mjs',
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
const phaseSection = source.changelog.split('## Phase 3EL-HF1-SX - 2026-06-30')[1]?.split('\n## ')[0] ?? '';
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

process.stdout.write('=== Phase 3EL-HF1-SX Chart AI Search UX / Theme Contract ===\n\n');

process.stdout.write('Files, command, result, and changelog:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Package checker command exists',
  packageJson.scripts?.['check:phase-3el-hf1-sx-chart-ai-search-ux-theme-alignment-hotfix'] ===
    'node scripts/check_phase_3el_hf1_sx_chart_ai_search_ux_theme_alignment_hotfix_contract.mjs');
check('Changelog contains Phase 3EL-HF1-SX', phaseSection.length > 0);
check('Result records implementation status',
  source.result.includes('Implemented — Chart AI search UX and chart theme alignment hotfix ready for owner review.'));
check('Result references Phase 3EL-HF1', source.result.includes('Phase 3EL-HF1'));
check('Result references owner review feedback',
  source.result.includes('Owner Feedback Addressed') && source.result.includes('search input was too wide'));
check('Result records no API/provider/live integration',
  /no API, provider, live-data, KIS, FX, quote, or AI-result integration/i.test(source.result));
check('Result recommends owner review before HF2',
  source.result.includes('owner review is recommended before adding chart data'));
process.stdout.write('\n');

process.stdout.write('Page identity and search control layout:\n');
check('Chart AI page changed', phaseChanges.has(paths.page));
for (const copy of ['종목 차트', '종목 검색', '종목명 또는 종목코드 입력', '조회']) {
  check(`Page contains ${copy}`, source.page.includes(copy));
}
check('Long analysis button remains absent', !source.page.includes('선택 종목 분석 보기'));
check('Search control group has desktop max-width',
  /\.chart-ai-symbol-row\s*\{[^}]*max-width:\s*8(?:[0-3]\d|40)px/s.test(source.page));
check('Mobile search controls remain contained',
  /@media \(max-width: 640px\)[\s\S]*?\.chart-ai-symbol-row\s*\{[^}]*width:\s*100%[^}]*max-width:\s*none/s.test(source.page));
check('Dropdown width follows compact search controls',
  /\.chart-lookup-dropdown\s*\{[^}]*width:\s*min\(820px, calc\(100% - 2rem\)\)/s.test(source.page));
process.stdout.write('\n');

process.stdout.write('Search visibility and selection behavior:\n');
check('Idle query closes dropdown before searching',
  /const query = input\.value\.trim\(\);\s*if \(!query\) \{\s*closeDropdown\(\);\s*return;/s.test(source.page));
check('Close clears rendered result rows',
  /const closeDropdown = \(\) => \{[\s\S]*?resultsEl\.replaceChildren\(\)/s.test(source.page));
check('Close resets hidden result count',
  /const closeDropdown = \(\) => \{[\s\S]*?resultCount\.textContent = '0개'/s.test(source.page));
check('Close hides empty state',
  /const closeDropdown = \(\) => \{[\s\S]*?emptyState\.hidden = true/s.test(source.page));
check('Close hides dropdown and collapses combobox',
  /const closeDropdown = \(\) => \{[\s\S]*?dropdown\.hidden = true;[\s\S]*?aria-expanded', 'false'/s.test(source.page));
check('No-match state is evaluated only after non-empty query guard',
  source.page.indexOf('if (!query)') < source.page.indexOf('emptyState.hidden = visibleRecords.length > 0'));
check('Selection clears input', source.page.includes("input.value = '';"));
check('Selection closes dropdown',
  /const updateSelection = [\s\S]*?input\.value = '';\s*closeDropdown\(\)/s.test(source.page));
check('Blank lookup action stays idle',
  /runBtn\.addEventListener\('click',[\s\S]*?if \(!input\.value\.trim\(\)\) \{\s*closeDropdown\(\);\s*return;/s.test(source.page));
process.stdout.write('\n');

process.stdout.write('Vertical result-list design and accessibility:\n');
check('Result list uses vertical column layout',
  /\.chart-ai-search-results\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column/s.test(source.page));
check('Runtime result row receives explicit global styling', source.page.includes(':global(.chart-ai-search-result)'));
check('Result row is a full-width button',
  source.page.includes("button.type = 'button'") &&
  /:global\(\.chart-ai-search-result\)\s*\{[^}]*width:\s*100%/s.test(source.page));
check('Result row has primary name line',
  source.page.includes("name.className = 'chart-ai-search-result-name'") &&
  source.page.includes(':global(.chart-ai-search-result-name)'));
check('Result row has metadata line',
  source.page.includes("metadata.className = 'chart-ai-search-result-meta'") &&
  source.page.includes(':global(.chart-ai-search-result-meta)'));
check('Result row removes raw browser appearance',
  /:global\(\.chart-ai-search-result\)\s*\{[^}]*appearance:\s*none;[^}]*border:\s*0;/s.test(source.page));
check('Result container scrolls internally',
  /\.chart-ai-search-results\s*\{[^}]*max-height:\s*250px;[^}]*overflow-y:\s*auto/s.test(source.page));
check('Result rows retain listbox option semantics',
  source.page.includes('role="listbox"') && source.page.includes("button.setAttribute('role', 'option')"));
check('Result rows have visible focus state', source.page.includes(':global(.chart-ai-search-result:focus-visible)'));
process.stdout.write('\n');

process.stdout.write('Required query and filter preservation:\n');
for (const query of ['005930', '삼성', '000660', '하이닉스', '069500', 'KODEX']) {
  check(`Page includes query ${query}`, source.page.includes(query));
}
check('All stock and ETF filters remain',
  ['all', 'stock', 'etf'].every((filter) => source.page.includes(`data-asset-filter="${filter}"`)) &&
  ['전체', '주식', 'ETF'].every((label) => source.page.includes(label)));
process.stdout.write('\n');

process.stdout.write('Preserved stock and chart shell structure:\n');
check('Central stock header remains', source.page.includes('class="chart-stock-header"'));
check('Chart shell remains',
  source.page.includes('class="chart-market-panel"') && source.page.includes('class="chart-candlestick-ready"'));
for (const period of ['1일', '1주', '1개월', '3개월', '1년']) {
  check(`Period control ${period} remains`, source.page.includes(`>${period}</button>`));
}
check('MK AI CTA remains', source.page.includes('id="chartAiMkAiBtn"'));
check('Company/profile placeholder remains',
  source.page.includes('class="panel chart-company-placeholder"') && source.page.includes('기업 개요'));
process.stdout.write('\n');

process.stdout.write('Theme-adaptive chart shell:\n');
for (const token of [
  '--chart-shell-bg', '--chart-shell-rail', '--chart-shell-border', '--chart-shell-grid',
  '--chart-shell-axis', '--chart-shell-muted', '--chart-shell-volume', '--chart-shell-overlay',
]) {
  check(`Chart defines and uses ${token}`, source.page.split(token).length >= 3);
}
check('Chart follows existing dark-mode selector', source.page.includes(':global(body.dark-mode) .chart-lookup-shell'));
check('Light chart background token is light', source.page.includes('--chart-shell-bg: #fbfcfe'));
check('Dark chart background token is dark', source.page.includes('--chart-shell-bg: #0d1728'));
check('Chart panel is not fixed dark-only',
  /\.chart-market-panel\s*\{[^}]*background:\s*var\(--chart-shell-bg\)/s.test(source.page));
check('Chart grid is theme-tokenized',
  source.page.includes('linear-gradient(var(--chart-shell-grid)'));
check('Chart axis is theme-tokenized', source.page.includes('color: var(--chart-shell-axis)'));
check('Chart candles and volume are theme-tokenized',
  ['var(--chart-shell-up)', 'var(--chart-shell-down)', 'var(--chart-shell-volume)']
    .every((value) => source.page.includes(value)));
check('No charting dependency was added',
  dependenciesUnchanged && devDependenciesUnchanged &&
  !/from ['"](?:chart\.js|highcharts|lightweight-charts|echarts|recharts)['"]/.test(source.page));
check('No OHLC dataset was added',
  !/\b(?:open|high|low|close|volume)\s*:\s*\d/.test(source.page) &&
  !addedFiles.some((path) => /ohlc|candlestick/i.test(path)));
process.stdout.write('\n');

process.stdout.write('User-facing wording and runtime safety:\n');
for (const wording of ['실시간', '실시간 시세', '현재 시세', 'real-time', 'actual market value', '매수 추천']) {
  check(`Page excludes forbidden wording ${wording}`, !source.page.includes(wording));
}
check('Page uses 매도 추천 only in non-recommendation disclaimer',
  source.page.includes('매수·매도 추천이 아닙니다') &&
  source.page.split('매도 추천').length === 2);
check('No buy or order CTA introduced',
  !/(>\s*매수\s*<|>\s*주문\s*<|buy-button|order-button)/i.test(source.page));
check('Chart AI page does not call fetch', !/\bfetch\s*\(/.test(source.page));
check('Chart AI page does not use process.env', !source.page.includes('process.env'));
check('Chart AI page does not import KIS providers', !/from ['"][^'"]*kis/i.test(source.page));
check('Chart AI page does not import Supabase', !/from ['"][^'"]*supabase/i.test(source.page));
check('Chart AI page does not import API routes', !/from ['"][^'"]*(?:pages\/api|\/api\/)/i.test(source.page));
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
      sourcefile: 'phase-3el-hf1-sx-check-entry.ts',
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
}
check('Behavior did not attempt network access', fetchAttempted === false);
process.stdout.write('\n');

process.stdout.write('Change-scope and dependency boundaries:\n');
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
check('No image file was added', addedImages.length === 0);
check('No dependency was added', dependenciesUnchanged && devDependenciesUnchanged && lockfileUnchanged);
check('Changelog records no deployment', /no deployment/i.test(phaseSection));
check('Changelog records no push', /no push/i.test(phaseSection));
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EL-HF1-SX Chart AI search/theme checker.'));
check('Checker did not attempt network access', fetchAttempted === false);
check('Checker does not read environment files',
  !/readFileSync\s*\([^)]*["'][^"']*\.env/i.test(source.checker));

process.stdout.write(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) {
  process.stdout.write(`\nFailed checks:\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write('All Phase 3EL-HF1-SX checks passed.\n');
