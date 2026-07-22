/**
 * Phase 3EL static and deterministic behavioral contract.
 * No network, browser, dev server, API, provider, smoke, credential, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EL Chart AI symbol search checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const startingCommit = '5baf3b5';
// Pinned to this phase's own ending commit so later phases (e.g. Phase 3EM provider
// foundation) do not pollute this phase-scoped diff. Content checks still read the
// current working-tree files.
const endingCommit = '461cfe1';
const paths = {
  result: 'docs/planning/phase_3el_chart_ai_domestic_symbol_search_wiring_result_v0.1.md',
  checker: 'scripts/check_phase_3el_chart_ai_domestic_symbol_search_wiring_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  page: 'src/pages/chart-ai.astro',
  clientSearch: 'src/lib/symbol-master/clientSymbolSearch.ts',
  search: 'src/lib/symbol-master/domesticSymbolSearch.ts',
  master: 'src/lib/symbol-master/domesticSymbolMaster.ts',
  types: 'src/lib/symbol-master/types.ts',
};

const read = (relativePath) => {
  try {
    return readFileSync(join(root, relativePath), 'utf8');
  } catch {
    return '';
  }
};

const git = (...args) => {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
};

const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, read(path)]));
const packageJson = JSON.parse(source.package || '{}');
const baselinePackage = JSON.parse(git('show', `${startingCommit}:package.json`) || '{}');
const phaseSection = source.changelog.split('## Phase 3EL - 2026-06-30')[1]?.split('\n## ')[0] ?? '';

const trackedChanges = new Set([
  ...git('diff', '--name-only', startingCommit, endingCommit).split(/\r?\n/).filter(Boolean),
]);
const phaseFiles = new Set(Object.values(paths));
for (const relativePath of phaseFiles) {
  if (!git('ls-files', relativePath) && existsSync(join(root, relativePath))) {
    trackedChanges.add(relativePath);
  }
}
const changedFiles = [...trackedChanges];
const changedPages = changedFiles.filter((path) => path.startsWith('src/pages/'));
const changedLayouts = changedFiles.filter((path) => path.startsWith('src/layouts/'));
const changedApiRoutes = changedFiles.filter((path) => path.startsWith('src/pages/api/'));
const changedProviders = changedFiles.filter((path) =>
  path.startsWith('src/lib/server/providers/') || path.startsWith('src/lib/server/marketData/'));

const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) ===
  JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) ===
  JSON.stringify(baselinePackage.devDependencies ?? {});
const lockfileUnchanged = !changedFiles.includes('package-lock.json');

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

process.stdout.write('=== Phase 3EL Chart AI Domestic Symbol Search Wiring Contract ===\n\n');

process.stdout.write('Files, command, changelog, and result document:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Package checker command exists',
  packageJson.scripts?.['check:phase-3el-chart-ai-domestic-symbol-search-wiring'] ===
    'node scripts/check_phase_3el_chart_ai_domestic_symbol_search_wiring_contract.mjs');
check('Changelog contains Phase 3EL', phaseSection.length > 0);
check('Result records implementation status',
  source.result.includes('Implemented — Chart AI domestic symbol search wiring ready for owner review.'));
check('Result references Phase 3EK', source.result.includes('Phase 3EK'));
check('Result records Chart AI wiring', /Chart AI page wired/i.test(source.result));
check('Result records domestic stocks plus ETFs only', source.result.includes('Domestic stocks + ETFs only'));
check('Result records mocked/static seed only', source.result.includes('Mocked/static seed only'));
check('Result records client-safe records only', source.result.includes('Client-safe records only'));
check('Result records no quote/API/provider/live integration',
  source.result.includes('No quote/API/provider/live integration'));
for (const statement of [
  'No KIS call', 'No FX call', 'No API route call', 'No production call',
  'No price data', 'No deployment', 'No push',
]) {
  check(`Result records ${statement}`, source.result.includes(statement));
}
check('Result records no Supabase', source.result.includes('No Supabase'));
check('Result records no SQL or migration', source.result.includes('No SQL or migration'));
check('Result preserves public source=live disabled', source.result.includes('Public `source=live` remains disabled'));
check('Result preserves source=auto deferred', source.result.includes('`source=auto` remains deferred'));
check('Result recommends owner review', source.result.includes('Phase 3EL-OWNER-REVIEW'));
process.stdout.write('\n');

process.stdout.write('Chart AI UI and client-safety contract:\n');
check('Chart AI page changed', trackedChanges.has(paths.page));
check('Chart AI imports domestic symbol master foundation',
  source.page.includes("getClientSafeDomesticSymbolRecords") &&
  source.page.includes("../lib/symbol-master/domesticSymbolMaster"));
check('Chart AI uses client-safe record type', source.page.includes('ClientSafeSymbolSearchRecord'));
check('Chart AI embeds a client-safe symbol payload', source.page.includes('chartAiDomesticSymbolData'));
check('Chart AI includes search input', source.page.includes('id="chartAiInput"') && source.page.includes('type="search"'));
check('Chart AI includes results area', source.page.includes('id="chartAiSearchResults"'));
check('Chart AI includes selected-symbol summary',
  source.page.includes('선택 종목') && source.page.includes('chartAiSelectedSymbol'));
check('Chart AI includes sample-data notice', source.page.includes('샘플 데이터'));
for (const label of ['종목 검색', '샘플 데이터', '국내/미국 주식·ETF', '검색 결과', '종목 차트', '실제 시세 아님']) {
  check(`Chart AI includes ${label}`, source.page.includes(label));
}
check('Chart AI does not expose sourceAsOf', !source.page.includes('sourceAsOf'));
check('Chart AI does not expose updatedAt', !source.page.includes('updatedAt'));
check('Chart AI does not expose searchableText', !source.page.includes('searchableText'));
check('Chart AI does not expose providerMeta', !source.page.includes('providerMeta'));
check('Chart AI has no ungated fetch (only gated owner-local preview allowed)',
  !/\bfetch\s*\(/.test(source.page) ||
  (source.page.includes('owner-local-quote-preview') && source.page.includes('owner-local')));
check('Chart AI does not use process.env', !source.page.includes('process.env'));
check('Chart AI does not use import.meta.env', !source.page.includes('import.meta.env'));
check('Chart AI does not import KIS provider files', !/providers\/kis|kisClient/i.test(source.page));
check('Chart AI does not import Supabase', !/supabase|@supabase/i.test(source.page));
check('Chart AI does not import API route modules',
  !/from\s+['"][^'"]*(?:pages\/api|pages\\api)|import\s*\(\s*['"][^'"]*(?:pages\/api|pages\\api)/i.test(source.page));
check('Chart AI contains no forbidden user-facing realtime wording',
  !/실시간|현재 시세|real-time|actual market value/i.test(source.page));
check('Result buttons are keyboard-selectable native buttons',
  source.page.includes("button.type = 'button'") && source.page.includes("role', 'option'"));
check('Selected state is visible and accessible',
  source.page.includes("aria-selected") && source.page.includes('.chart-ai-search-result.selected'));
check('Empty state is present', source.page.includes('chartAiEmptyState') && source.page.includes('검색 결과가 없습니다'));
check('Stock/ETF filter is present',
  source.page.includes('data-asset-filter="stock"') && source.page.includes('data-asset-filter="etf"'));
check('Dense result list scrolls locally',
  /\.chart-ai-search-results[\s\S]*?overflow-y:\s*auto/.test(source.page));
check('Mobile search layout is contained',
  source.page.includes('@media (max-width: 640px)') && source.page.includes('grid-template-columns: minmax(0, 1fr)'));
check('Selection updates summary',
  source.page.includes('updateSelection') && source.page.includes("setText('chartAiSelectedSymbol'"));
check('Post-redesign page remains explicitly sample-based',
  source.page.includes('샘플 차트') && source.page.includes('MK AI 분석은 다음 단계'));
process.stdout.write('\n');

process.stdout.write('Deterministic search behavior:\n');
let symbolLibrary;
try {
  const bundled = await build({
    stdin: {
      contents: [
        "export * from './src/lib/symbol-master/domesticSymbolMaster.ts';",
        "export * from './src/lib/symbol-master/clientSymbolSearch.ts';",
        "export * from './src/lib/symbol-master/domesticSymbolSearch.ts';",
      ].join('\n'),
      resolveDir: root,
      sourcefile: 'phase-3el-check-entry.ts',
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
  check('Local symbol/search library bundles and imports', Boolean(symbolLibrary));
} catch {
  check('Local symbol/search library bundles and imports', false);
}

if (symbolLibrary) {
  const cases = [
    ['005930', '005930'],
    ['삼성', '005930'],
    ['000660', '000660'],
    ['하이닉스', '000660'],
    ['069500', '069500'],
  ];
  for (const [query, expected] of cases) {
    check(`Search ${query} returns ${expected}`,
      symbolLibrary.searchDomesticSymbols({ query })[0]?.symbol === expected);
  }
  const kodex = symbolLibrary.searchDomesticSymbols({ query: 'KODEX' });
  check('Search KODEX returns one or more ETFs',
    kodex.length > 0 && kodex.every((record) => record.assetType === 'etf'));
  const defaults = symbolLibrary.searchDomesticSymbols({ query: '' });
  check('Empty query returns deterministic default list',
    defaults.length > 0 && JSON.stringify(defaults) === JSON.stringify(symbolLibrary.searchDomesticSymbols({ query: '' })));
  check('Default search is capped at 15',
    symbolLibrary.DOMESTIC_SYMBOL_SEARCH_DEFAULT_LIMIT === 15 && defaults.length <= 15);
  check('Maximum search limit is 20', symbolLibrary.DOMESTIC_SYMBOL_SEARCH_MAX_LIMIT === 20);
  check('Browser-safe helper searches only provided client-safe records', (() => {
    const records = symbolLibrary.getClientSafeDomesticSymbolRecords();
    const results = symbolLibrary.searchClientSafeDomesticSymbols(records, { query: '삼성' });
    return results[0]?.symbol === '005930' && results.every((record) =>
      !['source', 'sourceAsOf', 'updatedAt', 'searchableText'].some((field) => Object.hasOwn(record, field)));
  })());
  check('Behavior did not attempt network access', fetchAttempted === false);
}
process.stdout.write('\n');

process.stdout.write('Change-scope and policy boundaries:\n');
for (const [label, pagePath] of [
  ['Home', 'src/pages/index.astro'],
  ['Market', 'src/pages/market.astro'],
  ['Lab', 'src/pages/lab.astro'],
  ['Portfolio', 'src/pages/portfolio.astro'],
  ['MyPage', 'src/pages/mypage.astro'],
]) {
  check(`No ${label} page file changed`, !changedFiles.includes(pagePath));
}
check('Only Chart AI changed among runtime pages',
  changedPages.every((path) => path === paths.page));
check('No Layout file changed', changedLayouts.length === 0);
check('No API route file changed', changedApiRoutes.length === 0);
check('No provider file changed', changedProviders.length === 0);
check('No new dependency added', dependenciesUnchanged && devDependenciesUnchanged && lockfileUnchanged);
check('Changelog records no deployment or push', /no deployment/i.test(phaseSection) && /no push/i.test(phaseSection));
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EL Chart AI symbol search checker.'));
check('Checker did not attempt network access', fetchAttempted === false);
check('Checker does not read .env files',
  !/readFileSync\s*\([^)]*["'][^"']*\.env/i.test(source.checker));

process.stdout.write(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) {
  process.stdout.write(`\nFailed checks:\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write('All Phase 3EL checks passed.\n');
