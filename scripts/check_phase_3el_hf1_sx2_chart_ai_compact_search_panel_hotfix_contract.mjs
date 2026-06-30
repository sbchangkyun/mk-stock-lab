/**
 * Phase 3EL-HF1-SX2 static and deterministic behavioral contract.
 * No network, browser, dev server, API, provider, smoke, credential, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EL-HF1-SX2 compact search panel checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const startingCommit = 'f5a349a';
const endingCommit = '09c4e75';
const paths = {
  result: 'docs/planning/phase_3el_hf1_sx2_chart_ai_compact_search_panel_hotfix_result_v0.1.md',
  checker: 'scripts/check_phase_3el_hf1_sx2_chart_ai_compact_search_panel_hotfix_contract.mjs',
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
const phaseSection = source.changelog.split('## Phase 3EL-HF1-SX2 - 2026-07-01')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = new Set(git('diff', '--name-only', startingCommit, endingCommit).split(/\r?\n/).filter(Boolean));
const srcChanges = [...phaseChanges].filter((path) => path.startsWith('src/'));
const apiChanges = srcChanges.filter((path) => path.startsWith('src/pages/api/'));
const providerChanges = srcChanges.filter((path) =>
  path.startsWith('src/lib/server/providers/') || path.startsWith('src/lib/server/marketData/'));
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit, endingCommit).split(/\r?\n/).filter(Boolean);
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

process.stdout.write('=== Phase 3EL-HF1-SX2 Compact Search Panel Contract ===\n\n');

process.stdout.write('Files, command, result, and changelog:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Package checker command exists',
  packageJson.scripts?.['check:phase-3el-hf1-sx2-chart-ai-compact-search-panel-hotfix'] ===
    'node scripts/check_phase_3el_hf1_sx2_chart_ai_compact_search_panel_hotfix_contract.mjs');
check('Changelog contains Phase 3EL-HF1-SX2', phaseSection.length > 0);
check('Result records implementation status',
  source.result.includes('Implemented — Chart AI compact search panel hotfix ready for owner review.'));
check('Result references Phase 3EL-HF1-SX', source.result.includes('Phase 3EL-HF1-SX'));
check('Result references Phase 3EL-OWNER-REVIEW-HF1-SX',
  source.result.includes('Phase 3EL-OWNER-REVIEW-HF1-SX'));
for (const feedback of [
  'search input was still too wide',
  'search panel background was still too wide',
  'dropdown needed to match the search panel width',
  'example query text needed to be removed',
  'needed to move into the result header',
  'compact one-line row',
]) {
  check(`Result records owner feedback: ${feedback}`, source.result.toLowerCase().includes(feedback));
}
check('Result records no API/provider/live integration',
  /no API, provider, live-data, KIS, FX, quote, or AI-result integration/i.test(source.result));
check('Result recommends owner review before HF2',
  source.result.includes('owner review is recommended before adding chart data'));
process.stdout.write('\n');

process.stdout.write('Page identity and compact panel layout:\n');
check('Chart AI page changed', phaseChanges.has(paths.page));
for (const copy of ['종목 차트', '종목 검색', '종목명 또는 종목코드 입력', '조회']) {
  check(`Page contains ${copy}`, source.page.includes(copy));
}
check('Long analysis button remains absent', !source.page.includes('선택 종목 분석 보기'));
check('Permanent query helper text is removed',
  !source.page.includes('005930 · 삼성 · 000660 · 하이닉스 · 069500 · KODEX'));
for (const query of ['005930', '삼성', '000660', '하이닉스', '069500', 'KODEX']) {
  check(`Checker preserves behavior query ${query}`, source.checker.includes(`'${query}'`));
}
check('Search panel uses requested 540px compact width',
  /\.chart-lookup-search\s*\{[^}]*width:\s*min\(540px, 100%\);[^}]*max-width:\s*540px/s.test(source.page));
check('Visible compact search panel owns its background',
  /\.chart-lookup-search\s*\{[^}]*max-width:\s*540px;[^}]*background:\s*var\(--surface\)/s.test(source.page));
check('Search control no longer carries 820px max-width',
  !/\.chart-ai-symbol-row\s*\{[^}]*max-width:\s*820px/s.test(source.page));
check('Mobile search panel returns to full width',
  /@media \(max-width: 640px\)[\s\S]*?\.chart-lookup-search\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*none/s.test(source.page));
process.stdout.write('\n');

process.stdout.write('Attached dropdown, visibility states, and header filters:\n');
check('Dropdown width is tied to search panel width',
  /\.chart-lookup-dropdown\s*\{[^}]*width:\s*calc\(100% \+ 2px\)/s.test(source.page));
check('Dropdown is attached directly below search panel',
  /\.chart-lookup-dropdown\s*\{[^}]*top:\s*calc\(100% - 1px\);[^}]*left:\s*-1px/s.test(source.page));
check('Open search panel joins dropdown corners',
  source.page.includes('.chart-lookup-search.open') &&
  source.page.includes('border-radius: 14px 14px 0 0'));
check('Idle query closes dropdown before searching',
  /const query = input\.value\.trim\(\);\s*if \(!query\) \{\s*closeDropdown\(\);\s*return;/s.test(source.page));
check('Close clears rendered results',
  /const closeDropdown = \(\) => \{[\s\S]*?resultsEl\.replaceChildren\(\)/s.test(source.page));
check('Close hides dropdown and filters',
  /const closeDropdown = \(\) => \{[\s\S]*?dropdown\.hidden = true/s.test(source.page));
check('Typing opens dropdown',
  /dropdown\.hidden = !open;[\s\S]*?searchPanel\.classList\.toggle\('open', open\)/s.test(source.page));
check('Filters are inside dropdown markup',
  source.page.indexOf('id="chartAiSearchDropdown"') < source.page.indexOf('class="chart-ai-filter-bar"') &&
  source.page.indexOf('class="chart-ai-filter-bar"') < source.page.indexOf('id="chartAiSearchResults"'));
check('Filters are associated with result header',
  /class="chart-ai-results-head"[\s\S]*?class="chart-ai-filter-bar"/s.test(source.page));
check('Result header contains search-result label', source.page.includes('<strong>검색 결과</strong>'));
for (const filter of ['전체', '주식', 'ETF']) {
  check(`Result header contains filter ${filter}`, source.page.includes(`>${filter}</button>`));
}
check('Legacy lower search tools were removed', !source.page.includes('chart-lookup-search-tools'));
check('Empty filter interaction cannot expose results',
  /filterButtons\.forEach[\s\S]*?renderResults\(true\)/s.test(source.page) &&
  /if \(!query\) \{\s*closeDropdown\(\)/s.test(source.page));
process.stdout.write('\n');

process.stdout.write('Compact one-line result list:\n');
check('Result list remains vertical',
  /\.chart-ai-search-results\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column/s.test(source.page));
check('Each result remains a full-width button',
  source.page.includes("button.type = 'button'") &&
  /:global\(\.chart-ai-search-result\)\s*\{[^}]*width:\s*100%/s.test(source.page));
check('Result row uses one-line flex structure',
  /:global\(\.chart-ai-search-result\)\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center;[^}]*gap:\s*0\.6rem/s.test(source.page));
check('Result row is compact',
  /:global\(\.chart-ai-search-result\)\s*\{[^}]*min-height:\s*42px;[^}]*padding:\s*0\.48rem 0\.75rem/s.test(source.page));
check('Result row includes primary name element',
  source.page.includes("name.className = 'chart-ai-search-result-name'"));
check('Result row includes metadata element',
  source.page.includes("metadata.className = 'chart-ai-search-result-meta'"));
check('Name stays on one line',
  /:global\(\.chart-ai-search-result-name\)\s*\{[^}]*white-space:\s*nowrap/s.test(source.page));
check('Metadata truncates safely on one line',
  /:global\(\.chart-ai-search-result-meta\)\s*\{[^}]*overflow:\s*hidden;[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap/s.test(source.page));
check('Very narrow mobile can wrap safely',
  /@media \(max-width: 350px\)[\s\S]*?flex-wrap:\s*wrap/s.test(source.page));
check('Result rows remain styled controls',
  /:global\(\.chart-ai-search-result\)\s*\{[^}]*appearance:\s*none;[^}]*border:\s*0;/s.test(source.page));
check('Result rows retain option semantics and keyboard focus',
  source.page.includes("button.setAttribute('role', 'option')") &&
  source.page.includes(':global(.chart-ai-search-result:focus-visible)'));
check('Result list retains internal scroll',
  /\.chart-ai-search-results\s*\{[^}]*max-height:\s*250px;[^}]*overflow-y:\s*auto/s.test(source.page));
process.stdout.write('\n');

process.stdout.write('Preserved behavior and shell structure:\n');
check('No-match state remains after non-empty query guard',
  source.page.indexOf('if (!query)') < source.page.indexOf('emptyState.hidden = visibleRecords.length > 0'));
check('Selection clears input', source.page.includes("input.value = '';"));
check('Selection closes dropdown',
  /const updateSelection = [\s\S]*?input\.value = '';\s*closeDropdown\(\)/s.test(source.page));
check('Central stock header remains', source.page.includes('class="chart-stock-header"'));
check('Chart shell remains', source.page.includes('class="chart-market-panel"'));
check('Light/dark chart theme alignment remains',
  source.page.includes('--chart-shell-bg: #fbfcfe') &&
  source.page.includes(':global(body.dark-mode) .chart-lookup-shell') &&
  source.page.includes('--chart-shell-bg: #0d1728'));
for (const period of ['1일', '1주', '1개월', '3개월', '1년']) {
  check(`Period control ${period} remains`, source.page.includes(`>${period}</button>`));
}
check('MK AI CTA remains', source.page.includes('id="chartAiMkAiBtn"'));
check('Company/profile placeholder remains',
  source.page.includes('class="panel chart-company-placeholder"') && source.page.includes('기업 개요'));
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
      sourcefile: 'phase-3el-hf1-sx2-check-entry.ts',
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

process.stdout.write('User-facing wording and runtime safety:\n');
for (const wording of ['실시간', '실시간 시세', '현재 시세', 'real-time', 'actual market value', '매수 추천']) {
  check(`Page excludes forbidden wording ${wording}`, !source.page.includes(wording));
}
check('Page uses 매도 추천 only in non-recommendation disclaimer',
  source.page.includes('매수·매도 추천이 아닙니다') && source.page.split('매도 추천').length === 2);
check('No buy or order CTA introduced',
  !/(>\s*매수\s*<|>\s*주문\s*<|buy-button|order-button)/i.test(source.page));
check('Chart AI page does not call fetch', !/\bfetch\s*\(/.test(source.page));
check('Chart AI page does not use process.env', !source.page.includes('process.env'));
check('Chart AI page does not import KIS providers', !/from ['"][^'"]*kis/i.test(source.page));
check('Chart AI page does not import Supabase', !/from ['"][^'"]*supabase/i.test(source.page));
check('Chart AI page does not import API routes', !/from ['"][^'"]*(?:pages\/api|\/api\/)/i.test(source.page));
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
  source.checker.includes('Network access is blocked in the Phase 3EL-HF1-SX2 compact search panel checker.'));
check('Checker did not attempt network access', fetchAttempted === false);
check('Checker does not read environment files',
  !/readFileSync\s*\([^)]*["'][^"']*\.env/i.test(source.checker));

process.stdout.write(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) {
  process.stdout.write(`\nFailed checks:\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write('All Phase 3EL-HF1-SX2 checks passed.\n');
