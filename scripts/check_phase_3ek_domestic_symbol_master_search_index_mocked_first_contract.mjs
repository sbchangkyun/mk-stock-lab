/**
 * Phase 3EK static and deterministic behavioral contract.
 * No network, browser, API, provider, smoke, credential, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EK domestic symbol master/search checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const paths = {
  result: 'docs/planning/phase_3ek_domestic_symbol_master_search_index_mocked_first_result_v0.1.md',
  checker: 'scripts/check_phase_3ek_domestic_symbol_master_search_index_mocked_first_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  seed: 'src/data/symbol-master/domesticSymbolSeed.mocked.json',
  types: 'src/lib/symbol-master/types.ts',
  normalize: 'src/lib/symbol-master/normalize.ts',
  master: 'src/lib/symbol-master/domesticSymbolMaster.ts',
  search: 'src/lib/symbol-master/domesticSymbolSearch.ts',
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
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
};

const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, read(path)]));
const packageJson = JSON.parse(source.package || '{}');
const baselinePackage = JSON.parse(git('show', 'a6492ce:package.json') || '{}');
let seed = [];
try {
  seed = JSON.parse(source.seed || '[]');
} catch {
  seed = [];
}

const diffFiles = git('diff', '--name-only', 'a6492ce').split(/\r?\n/).filter(Boolean);
const statusFiles = git('status', '--porcelain=v1').split(/\r?\n/).filter(Boolean)
  .filter((line) => !line.startsWith('?? '))
  .map((line) => line.slice(3).trim());
const untrackedFiles = git('ls-files', '--others', '--exclude-standard').split(/\r?\n/).filter(Boolean);
const changedFiles = [...new Set([...diffFiles, ...statusFiles, ...untrackedFiles])];
const uiPageChanges = changedFiles.filter((path) =>
  path.startsWith('src/layouts/') || path.startsWith('src/components/') ||
  (path.startsWith('src/pages/') && !path.startsWith('src/pages/api/')));
const apiChanges = changedFiles.filter((path) => path.startsWith('src/pages/api/'));
const providerChanges = changedFiles.filter((path) =>
  path.startsWith('src/lib/server/providers/') || path.startsWith('src/lib/server/marketData/'));
const allowedRuntimeChanges = new Set([
  paths.seed, paths.types, paths.normalize, paths.master, paths.search,
]);
const runtimeChanges = changedFiles.filter((path) => path.startsWith('src/'));
const unexpectedRuntimeChanges = runtimeChanges.filter((path) => !allowedRuntimeChanges.has(path));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) ===
  JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) ===
  JSON.stringify(baselinePackage.devDependencies ?? {});
const lockfileUnchanged = !changedFiles.includes('package-lock.json');
const phaseSection = source.changelog.split('## Phase 3EK - 2026-06-30')[1]?.split('\n## ')[0] ?? '';
const librarySource = [source.types, source.normalize, source.master, source.search].join('\n');

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

process.stdout.write('=== Phase 3EK Domestic Symbol Master / Search Index Contract ===\n\n');

process.stdout.write('Files, command, and result document:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Package checker command exists',
  packageJson.scripts?.['check:phase-3ek-domestic-symbol-master-search-index-mocked-first'] ===
    'node scripts/check_phase_3ek_domestic_symbol_master_search_index_mocked_first_contract.mjs');
check('Changelog contains Phase 3EK', phaseSection.length > 0);
check('Result records implementation status',
  /Implemented - mocked-first domestic symbol master and search index foundation ready/i.test(source.result));
check('Result references Phase 3EJ', source.result.includes('Phase 3EJ'));
check('Result records domestic stocks plus ETFs only', source.result.includes('Domestic stocks + ETFs only'));
check('Result records mocked/static seed', /mocked\/static JSON seed/i.test(source.result));
check('Result records no UI integration', source.result.includes('No UI integration'));
check('Result records no API route integration', source.result.includes('No API route integration'));
check('Result records no live source fetch', source.result.includes('No live source fetch was performed'));
check('Result records no KIS call per keystroke', source.result.includes('no KIS call per keystroke'));
check('Result records no raw KIS fields', source.result.includes('No raw KIS fields'));
check('Result records no providerMeta', source.result.includes('No `providerMeta`'));
check('Result records no request/response body', source.result.includes('No request/response body'));
check('Result records no credentials or environment values',
  source.result.includes('No credentials or environment values'));
check('Result preserves public source=live disabled', source.result.includes('Public `source=live` remains disabled'));
check('Result preserves source=auto deferred', source.result.includes('`source=auto` remains deferred'));
check('Result recommends Phase 3EL', source.result.includes('Phase 3EL'));
process.stdout.write('\n');

process.stdout.write('Seed contract:\n');
check('Seed is an array', Array.isArray(seed));
check('Seed has at least 8 records', seed.length >= 8);
check('Seed has at least 5 stock records', seed.filter((record) => record.assetType === 'stock').length >= 5);
check('Seed has at least 3 ETF records', seed.filter((record) => record.assetType === 'etf').length >= 3);
for (const symbol of ['005930', '000660', '069500']) {
  check(`Seed includes ${symbol}`, seed.some((record) => record.symbol === symbol));
}
const allowedAssetTypes = new Set(['stock', 'etf', 'etn', 'other']);
const allowedStatuses = new Set(['active', 'suspended', 'delisted', 'unknown']);
const allowedSources = new Set(['static', 'kis', 'krx', 'manual', 'mocked']);
for (const [index, record] of seed.entries()) {
  const label = `Seed record ${index + 1}`;
  check(`${label} has six-digit symbol`, /^\d{6}$/.test(record.symbol));
  check(`${label} has displaySymbol`, typeof record.displaySymbol === 'string' && record.displaySymbol.trim().length > 0);
  check(`${label} has nameKo`, typeof record.nameKo === 'string' && record.nameKo.trim().length > 0);
  check(`${label} has market KR`, record.market === 'KR');
  check(`${label} has country KR`, record.country === 'KR');
  check(`${label} has currency KRW`, record.currency === 'KRW');
  check(`${label} has allowed assetType`, allowedAssetTypes.has(record.assetType));
  check(`${label} has allowed status`, allowedStatuses.has(record.status));
  check(`${label} has aliases array`, Array.isArray(record.aliases));
  check(`${label} has allowed source`, allowedSources.has(record.source));
  check(`${label} has sourceAsOf`, typeof record.sourceAsOf === 'string' && Number.isFinite(Date.parse(record.sourceAsOf)));
  check(`${label} has updatedAt`, typeof record.updatedAt === 'string' && Number.isFinite(Date.parse(record.updatedAt)));
  check(`${label} contains no price data`, !Object.hasOwn(record, 'price'));
}
check('Seed has no duplicate symbols', new Set(seed.map((record) => record.symbol)).size === seed.length);
check('Every seed record is explicitly mocked/static', seed.every((record) => record.source === 'mocked' || record.source === 'static'));
process.stdout.write('\n');

process.stdout.write('Type and source contract:\n');
for (const typeName of [
  'DomesticMarket', 'DomesticExchange', 'DomesticAssetType', 'SymbolLifecycleStatus',
  'SymbolSource', 'SymbolMasterRecord', 'ClientSafeSymbolSearchRecord',
  'SymbolSearchMatchType', 'SymbolSearchResult',
]) {
  check(`Types define ${typeName}`, source.types.includes(`export type ${typeName}`));
}
for (const helper of [
  'normalizeSearchText', 'normalizeDomesticSymbolInput', 'isDomesticSymbolFormat',
  'buildSearchableText', 'toClientSafeSymbolRecord',
]) {
  check(`Normalization exports ${helper}`, source.normalize.includes(`export function ${helper}`));
}
for (const helper of [
  'getDomesticSymbolMasterRecords', 'getClientSafeDomesticSymbolRecords',
  'findDomesticSymbolBySymbol', 'assertDomesticSymbolMasterIntegrity',
]) {
  check(`Loader exports ${helper}`, source.master.includes(`export function ${helper}`));
}
check('Search exports DomesticSymbolSearchOptions', source.search.includes('export type DomesticSymbolSearchOptions'));
check('Search exports searchDomesticSymbols', source.search.includes('export function searchDomesticSymbols'));
check('Search default limit is 15', /DOMESTIC_SYMBOL_SEARCH_DEFAULT_LIMIT\s*=\s*15/.test(source.search));
check('Search maximum limit is 20', /DOMESTIC_SYMBOL_SEARCH_MAX_LIMIT\s*=\s*20/.test(source.search));
for (const matchType of [
  'exact-symbol', 'exact-name-ko', 'prefix-symbol', 'prefix-name-ko',
  'alias', 'contains', 'fallback',
]) {
  check(`Search ranking includes ${matchType}`, source.search.includes(`'${matchType}'`) || source.search.includes(`${matchType}:`));
}
check('Search supports asset type filter', source.search.includes('assetTypes?: DomesticAssetType[]'));
check('Search supports exchange filter', source.search.includes('exchanges?: DomesticExchange[]'));
check('Search supports status filter', source.search.includes('includeStatuses?: SymbolLifecycleStatus[]'));
check('Search has deterministic name and symbol tie-breakers',
  source.search.includes('left.score - right.score') &&
  source.search.includes('left.nameKo') && source.search.includes('left.symbol'));
process.stdout.write('\n');

process.stdout.write('No-network and dependency boundaries:\n');
check('Symbol/search source contains no fetch call', !/\bfetch\s*\(/.test(librarySource));
check('Symbol/search source contains no process.env access', !librarySource.includes('process.env'));
check('Symbol/search source contains no import.meta.env access', !librarySource.includes('import.meta.env'));
check('Symbol/search source contains no KIS provider import', !/providers\/kis|kisClient/i.test(librarySource));
check('Symbol/search source contains no Supabase import', !/supabase|@supabase/i.test(librarySource));
check('Symbol/search source contains no API route dependency', !/pages\/api|pages\\api/i.test(librarySource));
check('Symbol/search source contains no provider URL', !/https?:\/\//i.test(librarySource));
check('Client-safe type excludes source metadata fields',
  !/type ClientSafeSymbolSearchRecord[\s\S]*?\{[\s\S]*?\b(source|sourceAsOf|updatedAt|searchableText):/.test(source.types));
check('Checker did not attempt network access', fetchAttempted === false);
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EK domestic symbol master/search checker.'));
check('Checker does not read .env files',
  !/readFileSync\s*\([^)]*["'][^"']*\.env/i.test(source.checker));
process.stdout.write('\n');

process.stdout.write('Deterministic behavioral contract:\n');
let symbolLibrary;
try {
  const bundled = await build({
    stdin: {
      contents: [
        "export * from './src/lib/symbol-master/normalize.ts';",
        "export * from './src/lib/symbol-master/domesticSymbolMaster.ts';",
        "export * from './src/lib/symbol-master/domesticSymbolSearch.ts';",
      ].join('\n'),
      resolveDir: root,
      sourcefile: 'phase-3ek-check-entry.ts',
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
  check('Local TypeScript symbol library bundles and imports', Boolean(symbolLibrary));
} catch {
  check('Local TypeScript symbol library bundles and imports', false);
}

if (symbolLibrary) {
  const records = symbolLibrary.getDomesticSymbolMasterRecords();
  const clientRecords = symbolLibrary.getClientSafeDomesticSymbolRecords();
  check('Loader returns all seed records', records.length === seed.length);
  check('Loader integrity assertion passes', (() => {
    try { symbolLibrary.assertDomesticSymbolMasterIntegrity(records); return true; } catch { return false; }
  })());
  check('Loader records use deterministic symbol order',
    records.map((record) => record.symbol).join(',') ===
      [...records].sort((a, b) => a.symbol.localeCompare(b.symbol)).map((record) => record.symbol).join(','));
  check('Loader results are cloned', (() => {
    const first = records[0];
    first.aliases.push('mutation-test');
    return !symbolLibrary.getDomesticSymbolMasterRecords()[0].aliases.includes('mutation-test');
  })());
  check('Duplicate symbol integrity check fails closed', (() => {
    try {
      symbolLibrary.assertDomesticSymbolMasterIntegrity([...records, { ...records[0], aliases: [...records[0].aliases] }]);
      return false;
    } catch { return true; }
  })());
  check('Find resolves a symbol with leading zero',
    symbolLibrary.findDomesticSymbolBySymbol(' 005930 ')?.symbol === '005930');
  check('Find rejects invalid domestic symbol', symbolLibrary.findDomesticSymbolBySymbol('5930') === null);
  check('Search normalization uses NFKC, spacing, and lowercase',
    symbolLibrary.normalizeSearchText('  ＫＯＤＥＸ   ２００ ') === 'kodex 200');
  check('Strict symbol normalization preserves leading zeros',
    symbolLibrary.normalizeDomesticSymbolInput(' 005930 ') === '005930');
  check('Strict symbol normalization rejects invalid format', (() => {
    try { symbolLibrary.normalizeDomesticSymbolInput('5930'); return false; } catch { return true; }
  })());
  check('Client-safe projection count matches master', clientRecords.length === records.length);
  check('Client-safe projection excludes internal fields', clientRecords.every((record) =>
    !['source', 'sourceAsOf', 'updatedAt', 'searchableText'].some((field) => Object.hasOwn(record, field))));

  const exactSymbol = symbolLibrary.searchDomesticSymbols({ query: '005930' });
  const exactName = symbolLibrary.searchDomesticSymbols({ query: '삼성전자' });
  const prefixName = symbolLibrary.searchDomesticSymbols({ query: '삼성' });
  const alias = symbolLibrary.searchDomesticSymbols({ query: '하이닉스' });
  const kodex = symbolLibrary.searchDomesticSymbols({ query: 'KODEX' });
  const emptyOne = symbolLibrary.searchDomesticSymbols({ query: '' });
  const emptyTwo = symbolLibrary.searchDomesticSymbols({ query: '' });
  check('Exact symbol ranks first', exactSymbol[0]?.symbol === '005930' && exactSymbol[0]?.matchType === 'exact-symbol');
  check('Exact Korean name ranks correctly', exactName[0]?.symbol === '005930' && exactName[0]?.matchType === 'exact-name-ko');
  check('Korean name prefix ranks correctly', prefixName[0]?.symbol === '005930' && prefixName[0]?.matchType === 'prefix-name-ko');
  check('Alias search resolves tracked stock', alias[0]?.symbol === '000660' && alias[0]?.matchType === 'alias');
  check('English ETF search returns only matching seed records',
    kodex.length >= 3 && kodex.every((record) => record.assetType === 'etf'));
  check('Empty search returns fallback results', emptyOne.length > 0 && emptyOne.every((record) => record.matchType === 'fallback'));
  check('Empty search is deterministic', JSON.stringify(emptyOne) === JSON.stringify(emptyTwo));
  check('Default search respects limit 15', emptyOne.length <= 15);
  check('Search caps requested limit at 20', symbolLibrary.searchDomesticSymbols({ query: '', limit: 999 }).length <= 20);
  check('Search honors explicit limit', symbolLibrary.searchDomesticSymbols({ query: '', limit: 3 }).length === 3);
  check('Asset-type filter returns ETFs only',
    symbolLibrary.searchDomesticSymbols({ query: '', assetTypes: ['etf'] }).every((record) => record.assetType === 'etf'));
  check('Exchange filter returns ETF exchange only',
    symbolLibrary.searchDomesticSymbols({ query: '', exchanges: ['ETF'] }).every((record) => record.exchange === 'ETF'));
  check('Status filter can produce empty result',
    symbolLibrary.searchDomesticSymbols({ query: '', includeStatuses: ['unknown'] }).length === 0);
  check('Behavior did not attempt network access', fetchAttempted === false);
}
process.stdout.write('\n');

process.stdout.write('Change-scope and changelog contract:\n');
check('Only intended symbol/search runtime files changed',
  runtimeChanges.length === allowedRuntimeChanges.size && unexpectedRuntimeChanges.length === 0 &&
  [...allowedRuntimeChanges].every((path) => runtimeChanges.includes(path)));
check('No UI page file changed', uiPageChanges.length === 0);
check('No API route file changed', apiChanges.length === 0);
check('No provider file changed', providerChanges.length === 0);
check('No new dependency added', dependenciesUnchanged && devDependenciesUnchanged && lockfileUnchanged);
check('Changelog records no deployment or push', /no deployment/i.test(phaseSection) && /no push/i.test(phaseSection));
check('Changelog records no UI/API/provider changes',
  phaseSection.includes('no UI page changes') && phaseSection.includes('no API route changes') && phaseSection.includes('no provider changes'));
check('Changelog recommends Phase 3EL', phaseSection.includes('Phase 3EL'));

process.stdout.write(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) {
  process.stdout.write(`\nFailed checks:\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write('All Phase 3EK checks passed.\n');
