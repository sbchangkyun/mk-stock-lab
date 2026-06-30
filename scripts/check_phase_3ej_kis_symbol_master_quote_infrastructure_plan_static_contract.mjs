/**
 * Phase 3EJ KIS symbol-master and quote-infrastructure plan static contract.
 * Planning-only: no dev server, browser, API, smoke, provider, or environment access.
 */

globalThis.fetch = async () => {
  throw new Error('Network access is blocked in the Phase 3EJ KIS symbol master and quote infrastructure checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const paths = {
  plan: 'docs/planning/phase_3ej_kis_symbol_master_quote_infrastructure_plan_v0.1.md',
  checker: 'scripts/check_phase_3ej_kis_symbol_master_quote_infrastructure_plan_static_contract.mjs',
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

const git = (...args) => {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
};

const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, read(path)]));
const packageJson = JSON.parse(source.package || '{}');
const baselinePackage = JSON.parse(git('show', 'f97e74d:package.json') || '{}');
const diffFiles = git('diff', '--name-only', 'f97e74d').split(/\r?\n/).filter(Boolean);
const statusFiles = git('status', '--porcelain=v1').split(/\r?\n/).filter(Boolean).map((line) => line.slice(3).trim());
const changedFiles = [...new Set([...diffFiles, ...statusFiles])];
const runtimeChanges = changedFiles.filter((path) => path.startsWith('src/'));
const apiChanges = changedFiles.filter((path) => path.startsWith('src/pages/api/'));
const uiPageChanges = changedFiles.filter((path) =>
  path.startsWith('src/layouts/') || path.startsWith('src/components/') ||
  (path.startsWith('src/pages/') && !path.startsWith('src/pages/api/')));
const providerChanges = changedFiles.filter((path) =>
  path.startsWith('src/lib/server/providers/') || path.startsWith('src/lib/server/marketData/'));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) ===
  JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) ===
  JSON.stringify(baselinePackage.devDependencies ?? {});
const lockfileUnchanged = !changedFiles.includes('package-lock.json');
const phaseSection = source.changelog.split('## Phase 3EJ - 2026-06-29')[1]?.split('\n## ')[0] ?? '';

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

process.stdout.write('=== Phase 3EJ KIS Symbol Master & Quote Infrastructure Plan Static Contract ===\n\n');

process.stdout.write('Files, command, and status:\n');
check('1. Plan document exists', existsSync(join(root, paths.plan)));
check('2. Static checker exists', existsSync(join(root, paths.checker)));
check('3. Package checker command exists',
  packageJson.scripts?.['check:phase-3ej-kis-symbol-master-quote-infrastructure-plan'] ===
    'node scripts/check_phase_3ej_kis_symbol_master_quote_infrastructure_plan_static_contract.mjs');
check('4. Changelog contains Phase 3EJ', phaseSection.length > 0);
check('5. Plan status records no runtime changes',
  source.plan.includes('Planned - KIS symbol master and quote infrastructure plan completed; no runtime changes.'));
check('6. Plan references Phase 3EI', source.plan.includes('Phase 3EI'));
check('7. Plan records public source=live disabled', source.plan.includes('Public `source=live` remains disabled'));
check('8. Plan records source=auto deferred', source.plan.includes('`source=auto` remains deferred'));
check('9. Plan records real FX provider not selected', /real FX provider is not selected/i.test(source.plan));
check('10. Plan records US quote provider not implemented', /US quote provider is not implemented/i.test(source.plan));
process.stdout.write('\n');

process.stdout.write('Baseline and first scope:\n');
check('11. Plan includes current infrastructure baseline', source.plan.includes('## 3. Current Infrastructure Baseline'));
for (const area of [
  'KR quote adapter', 'KR ETF quote', 'Portfolio valuation', 'Mixed-currency preview',
  'Symbol master', 'Search index', 'Quote cache', 'Market calendar',
  'Provider leakage guard', 'Public live readiness', '`source=auto`',
]) {
  check(`Baseline includes ${area}`, source.plan.includes(`| ${area} |`));
}
check('12. Plan recommends domestic stocks plus domestic ETFs first',
  source.plan.includes('Domestic listed stocks + domestic ETFs only.'));
for (const exclusion of [
  'US stocks', 'US ETFs', 'real FX', 'commodities', 'crypto',
  'index constituents and weights', 'watchlist alert worker', 'public live data',
  '`source=auto`', 'account/trading APIs',
]) {
  check(`First scope excludes ${exclusion}`, source.plan.includes(`- ${exclusion};`));
}
process.stdout.write('\n');

process.stdout.write('Symbol master contract and sources:\n');
check('16. Plan defines SymbolMasterRecord', source.plan.includes('type SymbolMasterRecord = {'));
for (const field of [
  'symbol: string', 'displaySymbol: string', 'nameKo: string', 'nameEn?: string',
  "market: 'KR'", 'exchange:', "country: 'KR'", "currency: 'KRW'", 'assetType:',
  'status:', 'aliases: string[]', 'searchableText: string', 'source:',
  'sourceAsOf: string | null', 'updatedAt: string',
]) {
  check(`Symbol master includes ${field}`, source.plan.includes(field));
}
check('Symbol master uses canonical domestic code', source.plan.includes('canonical domestic code'));
check('Symbol master defaults uncertain lifecycle to unknown', source.plan.includes("`status: 'unknown'`"));
check('Symbol master excludes provider raw fields', source.plan.includes('Provider raw fields'));
check('18. Plan includes symbol master source strategy', source.plan.includes('## 6. Symbol Master Source Strategy'));
for (const sourceType of [
  'Static checked-in seed file',
  'KIS-supported metadata endpoint or file, if available and later verified',
  'KRX or exchange official source, if later approved',
  'OpenDART metadata', 'Manual override file', 'Mocked sample file for implementation bootstrap',
]) {
  check(`Source strategy includes ${sourceType}`, source.plan.includes(`| ${sourceType} |`));
}
check('KIS metadata remains later verification only',
  /KIS provides a complete symbol master unless a later source-verification phase proves it/i.test(source.plan));
check('KRX requires later approval', source.plan.includes('KRX/exchange use requires later owner approval'));
check('OpenDART is insufficient alone', source.plan.includes('OpenDART is not sufficient alone'));
check('First implementation is mocked/static first', source.plan.includes('mocked-first or static-seed-first'));
process.stdout.write('\n');

process.stdout.write('Search index contract:\n');
check('25. Plan includes search index plan', source.plan.includes('## 7. Search Index Plan'));
check('26. Plan states no KIS call per keystroke', source.plan.includes('Search must not call KIS per keystroke'));
for (const behavior of [
  'Unicode NFKC', 'normalized lowercase matching', 'Korean `nameKo` matching',
  'canonical and display symbol matching', 'alias matching', '`assetType` filters',
  'market/exchange filters', 'maximum result limit', 'deterministic ordering',
  'no external runtime fetch for search', 'no quote request during search ranking',
]) {
  check(`Search plan includes ${behavior}`, source.plan.includes(behavior));
}
for (const ranking of [
  'Exact symbol match', 'Exact Korean name match', 'Prefix symbol match',
  'Prefix Korean name match', 'Alias match', 'Contains match',
  'Fallback alphabetical/name order',
]) {
  check(`Search sort includes ${ranking}`, source.plan.includes(ranking));
}
check('Search payload is client-safe', source.plan.includes('Client-safe search payloads should contain only'));
process.stdout.write('\n');

process.stdout.write('Normalized quote and API plan:\n');
check('28. Plan defines NormalizedQuoteSnapshot', source.plan.includes('type NormalizedQuoteSnapshot = {'));
for (const field of [
  "market: 'KR' | 'US'", 'symbol: string', 'price: number | null', 'currency:',
  'change: number | null', 'changePercent: number | null', 'volume: number | null',
  'asOf: string | null', 'marketState:', 'staleState:', 'source:', 'provider:',
  'errorCode?: string',
]) {
  check(`Quote snapshot includes ${field}`, source.plan.includes(field));
}
check('Quote snapshot allows unavailable price', source.plan.includes('`price: null`'));
check('Quote snapshot blocks providerMeta', source.plan.includes('must not expose private `providerMeta`'));
check('30. Plan includes quote API layer', source.plan.includes('## 9. Quote API Layer Plan'));
for (const responsibility of [
  'Accept and normalize symbol input', 'Validate the symbol against the approved symbol master',
  'Map market and asset type', 'Read the appropriate quote cache first',
  'Call a provider only in approved owner/local', 'Normalize rate/quote fields and timestamps',
  'Classify failures', 'Strip `providerMeta`', 'Return explicit source',
  'Fail closed on an unsupported source', 'Never fall back to fixture data',
]) {
  check(`Quote API plan includes ${responsibility}`, source.plan.includes(responsibility));
}
for (const code of [
  'SYMBOL_NOT_FOUND', 'SYMBOL_UNSUPPORTED', 'MARKET_UNSUPPORTED', 'ASSET_TYPE_UNSUPPORTED',
  'PROVIDER_CONFIG_MISSING', 'PROVIDER_AUTH_REQUIRED', 'PROVIDER_RATE_LIMITED',
  'PROVIDER_UNAVAILABLE', 'PROVIDER_RESPONSE_UNEXPECTED', 'QUOTE_STALE_BEYOND_LIMIT',
  'QUOTE_UNAVAILABLE', 'SOURCE_UNSUPPORTED', 'UNKNOWN_ERROR',
]) {
  check(`Quote error plan includes ${code}`, source.plan.includes(code));
}
process.stdout.write('\n');

process.stdout.write('Cache, calendar, and label policy:\n');
check('32. Plan includes quote cache and freshness policy', source.plan.includes('## 10. Quote Cache and Freshness Policy'));
for (const tier of [
  'Owner local preview', 'Public fixture/default', 'Future public live',
  'Alert worker', 'Chart AI analysis', 'Home ticker/Market Snapshot',
]) {
  check(`Cache table includes ${tier}`, source.plan.includes(`| ${tier} |`));
}
check('33. Owner preview TTL is 15s/120s',
  source.plan.includes('| Owner local preview |') && source.plan.includes('Fresh 15s') && source.plan.includes('Stale 120s'));
check('34. Chart AI TTL is 60s/5m',
  /\| Chart AI analysis \|[^\n]*Fresh 60s[^\n]*Stale 5m/.test(source.plan));
check('35. Home snapshot TTL is 60s/5m',
  /\| Home ticker\/Market Snapshot \|[^\n]*Fresh 60s[^\n]*Stale 5m/.test(source.plan));
check('TTL values remain planning defaults', source.plan.includes('planning defaults, not implementation constants'));
check('Unavailable never fabricates data', source.plan.includes('must not fabricate a price'));
check('36. Plan includes market calendar plan', source.plan.includes('## 11. Market Calendar Plan'));
check('37. Plan recommends KR calendar first',
  source.plan.includes('KR market calendar only, static or mocked-first.'));
for (const calendarNeed of [
  'market open/closed state', 'holidays', 'stale-label accuracy',
  'alert scheduling', 'after-hours behavior', 'future US market calendar',
]) {
  check(`Calendar plan includes ${calendarNeed}`, source.plan.toLowerCase().includes(calendarNeed.toLowerCase()));
}
check('38. Plan includes source and freshness label policy', source.plan.includes('## 12. Source and Freshness Label Policy'));
for (const allowedLabel of [
  'fixture', 'owner preview', 'sample', '조회 시점 기준', '최근 조회 기준',
  '데이터 일시 불가', '평가 불가', '연동 실패',
]) {
  check(`Allowed labels include ${allowedLabel}`, source.plan.includes(allowedLabel));
}
for (const forbiddenLabel of ['실시간', '실시간 시세', 'real-time', 'live FX', 'current FX', 'actual market value']) {
  check(`Forbidden labels include ${forbiddenLabel}`, source.plan.includes(forbiddenLabel));
}
check('39. Real-time wording requires later WebSocket phase',
  source.plan.includes('Forbidden unless a later WebSocket-specific phase explicitly supports and validates them'));
process.stdout.write('\n');

process.stdout.write('Leakage and storage plan:\n');
check('40. Plan includes provider leakage guard', source.plan.includes('## 13. Provider Leakage Guard Plan'));
for (const forbidden of [
  'raw KIS fields', 'providerMeta', 'raw provider payload', 'request body', 'response body',
  'authorization headers', 'access tokens', 'app keys', 'app secrets', 'account numbers',
  'environment values', 'provider URLs', 'stack traces containing provider data',
]) {
  check(`Leakage guard forbids ${forbidden}`, source.plan.includes(forbidden));
}
check('Leakage guard requires explicit projection', source.plan.includes('explicit projection function'));
check('42. Plan includes storage and file plan', source.plan.includes('## 14. Storage and File Plan'));
for (const option of [
  'Checked-in JSON seed', 'Generated static JSON', 'Server-only data file',
  'Supabase table', 'Supabase Storage file', 'External source fetch at build time',
  'External source fetch at runtime',
]) {
  check(`Storage plan includes ${option}`, source.plan.includes(`| ${option} |`));
}
check('43. Storage plan recommends seed plus client-safe JSON',
  source.plan.includes('checked-in mocked/static seed + generated client-safe search JSON.'));
check('Storage plan excludes initial Supabase migration',
  source.plan.includes('should not add a Supabase migration unless explicitly scoped'));
check('Storage plan prohibits runtime external search fetch',
  source.plan.includes('must not perform runtime external fetches'));
process.stdout.write('\n');

process.stdout.write('Consumers, roadmap, decisions, and risk:\n');
check('44. Plan includes consumer surface mapping', source.plan.includes('## 15. Consumer Surface Mapping'));
for (const consumer of [
  'Home ticker belt', 'Home MARKET SNAPSHOT', 'Chart AI search', 'Chart AI analysis',
  'Market treemap', 'Market Momentum / Trend', 'Lab asset-class comparison',
  'Lab S&P500 sector returns', 'Portfolio holdings', 'MyPage watchlist', 'MyPage price alerts',
]) {
  check(`Consumer mapping includes ${consumer}`, source.plan.includes(`| ${consumer} |`));
}
check('49. Plan includes implementation roadmap', source.plan.includes('## 16. Implementation Roadmap'));
for (const phase of ['Phase 3EK', 'Phase 3EL', 'Phase 3EM', 'Phase 3EN', 'Phase 3EO', 'Phase 3EP', 'Phase 3EQ']) {
  check(`Roadmap includes ${phase}`, source.plan.includes(phase));
}
check('50. Plan recommends Phase 3EK',
  source.plan.includes('Recommended next phase: Phase 3EK - Domestic Symbol Master / Search Index Mocked-First Implementation.'));
check('51. Plan includes Home visible-progress alternative',
  source.plan.includes('Alternative: Phase 3EN - Home Ticker Belt / MARKET SNAPSHOT Owner Preview Plan'));
check('52. Plan includes owner decision matrix', source.plan.includes('## 17. Owner Decision Matrix'));
for (const decision of [
  'First implementation scope', 'Domestic ETFs included or excluded',
  'Static seed vs live metadata source', 'Client-side search data shape',
  'Search result limit', 'Suspended/delisted symbols', 'Manual override file',
  'Quote TTL defaults', 'Market calendar first source', 'Supabase in first implementation',
  'Public live previews later', 'Whether `source=auto` remains deferred',
  'Home visible progress before infrastructure',
]) {
  check(`Owner decision includes ${decision}`, source.plan.includes(`| ${decision} |`));
}
check('53. Plan includes risk register', source.plan.includes('## 18. Risk Register'));
for (const risk of [
  'Incomplete symbol coverage', 'Incorrect ETF classification', 'Ticker/name mismatch',
  'Search result confusion', 'Stale symbol master', 'Provider rate limits',
  'Stale quote confusion', 'Raw provider leakage', 'Fixture/live confusion',
  'Market holiday handling', 'Alert over-triggering', 'Public live premature activation',
  'Mobile overflow from dense search results', 'Supabase schema churn',
  'External source licensing ambiguity',
]) {
  check(`Risk register includes ${risk}`, source.plan.includes(`| ${risk} |`));
}
process.stdout.write('\n');

process.stdout.write('Validation and safety boundaries:\n');
check('54. Plan includes validation plan', source.plan.includes('## 19. Validation Plan'));
for (const command of [
  'npm run check:mobile-baseline', 'npm run check:production-domain',
  'npm run build', 'git diff --check', 'npm run guard:production-mobile-geometry',
]) {
  check(`Validation plan includes ${command}`, source.plan.includes(command));
}
for (const featureCheck of [
  'symbol master contract', 'search index contract', 'client-safe search payload',
  'quote snapshot normalization', 'provider leakage guard', 'cache/freshness policy',
  'market calendar labels',
]) {
  check(`Feature validation includes ${featureCheck}`, source.plan.includes(featureCheck));
}
check('Production geometry requires deployment and approval',
  source.plan.includes('Production geometry should only run after actual deployment and explicit owner approval'));
check('55. No runtime source file changed', runtimeChanges.length === 0);
check('56. No API route file changed', apiChanges.length === 0);
check('57. No UI page file changed', uiPageChanges.length === 0);
check('58. No provider file changed', providerChanges.length === 0);
check('59. No dependency was added', dependenciesUnchanged && devDependenciesUnchanged && lockfileUnchanged);
check('60. Changelog records no deployment or push',
  /no deployment/i.test(phaseSection) && /no push/i.test(phaseSection));
check('Changelog records no runtime/UI/API/provider changes',
  phaseSection.includes('no runtime/UI/API/provider changes'));
check('Changelog recommends Phase 3EK', phaseSection.includes('Phase 3EK'));
check('61. Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EJ KIS symbol master and quote infrastructure checker.'));
check('Checker does not read .env files',
  !/readFileSync\s*\([^)]*["'][^"']*\.env/i.test(source.checker));

process.stdout.write(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) {
  process.stdout.write(`\nFailed checks:\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write('All Phase 3EJ static checks passed.\n');
