/**
 * Phase 3GG-OP-FAST contract checker — Universal KR/US Stock·ETF Search, Real OHLCV Chart.
 *
 * Static, deterministic verification of the phase's source contract:
 *  - the required new modules/routes/data exist;
 *  - chart-ai.astro carries the universal-search + real-chart integration tokens;
 *  - kisClient.ts gained the KIS overseas (US) OHLCV transport and forwards the SAME scoped
 *    production Chart AI beta exception (guard not weakened);
 *  - the curated master contains the real KR + US verification instruments (US carries EXCD);
 *  - the OHLCV route is guarded by the production beta guard and no order/account/balance/trading
 *    endpoint is referenced anywhere in the new provider/route surface;
 *  - no sample/synthetic OHLCV fallback exists in the real provider path;
 *  - no secret/model/prompt/raw-payload exposure in the touched source;
 *  - .env/.env.local/.vercel are never tracked/staged and the working tree stays in scope.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BASELINE = '69b09e1';

const CHART_AI_PAGE = 'src/pages/chart-ai.astro';
const KIS_CLIENT = 'src/lib/server/providers/kisClient.ts';
const SUMMARY_ROUTE = 'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts';
const INSTRUMENT_MODEL = 'src/lib/market-data/instrument.ts';
const MASTER_JSON = 'src/data/chart-ai/universalInstrumentMaster.json';
const SEARCH_MODULE = 'src/lib/server/chart-ai/universal-instrument-search.mjs';
const NORMALIZE_MODULE = 'src/lib/server/chart-ai/universal-ohlcv-normalize.mjs';
const OHLCV_PROVIDER = 'src/lib/server/chart-ai/universalOhlcvProvider.ts';
const SEARCH_ROUTE = 'src/pages/api/chart-ai/instruments/search.json.ts';
const OHLCV_ROUTE = 'src/pages/api/chart-ai/market/ohlcv.json.ts';
const SMOKE = 'scripts/smoke_phase_3gg_op_fast_symbol_search_and_ohlcv.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_op_fast_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_op_fast_universal_search_real_ohlcv_chart_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';
const TYPES_FILE = 'src/lib/server/providers/types.ts';

const REQUIRED_FILES = [
  CHART_AI_PAGE, KIS_CLIENT, SUMMARY_ROUTE, INSTRUMENT_MODEL, MASTER_JSON, SEARCH_MODULE,
  NORMALIZE_MODULE, OHLCV_PROVIDER, SEARCH_ROUTE, OHLCV_ROUTE, SMOKE, CHECKER_SELF, RESULT_DOC,
];

const NEW_SOURCE_FILES = [
  INSTRUMENT_MODEL, MASTER_JSON, SEARCH_MODULE, NORMALIZE_MODULE, OHLCV_PROVIDER, SEARCH_ROUTE, OHLCV_ROUTE,
];

let assertions = 0;
let failures = 0;
const assert = (cond, message) => {
  assertions += 1;
  if (!cond) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  }
};

const runGit = (args) => execFileSync('git', args, { encoding: 'utf8' });
const exists = (p) => existsSync(p);
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

// --- 1. Required files exist ---
for (const file of REQUIRED_FILES) {
  assert(exists(file), `Required file missing: ${file}`);
}

// --- 2. chart-ai.astro integration tokens ---
const page = read(CHART_AI_PAGE);
const PAGE_REQUIRED_TOKENS = [
  '국내·미국 주식 및 ETF 검색',
  '종목명, 티커 또는 종목코드를 입력하세요',
  '/api/chart-ai/instruments/search.json',
  '/api/chart-ai/market/ohlcv.json',
  'loadRealChart',
  'selectedCountry',
  'activeRange',
  'productionRealChartEnabled',
  'chartAiRealChartState',
  '실시간 지연 시세',
  // Phase 3GG-R-FAST replaced the MK AI preparing copy with the real deterministic MK AI analysis UI.
  'MK AI 분석 시작',
  'data-chart-ai-production-default',
  'chartAiProdBeta=1',
  'MK AI 시세 요약',
];
for (const token of PAGE_REQUIRED_TOKENS) {
  assert(page.includes(token), `chart-ai.astro missing required token: ${token}`);
}
// The replaced misleading copy must be gone.
assert(!page.includes('검색 종목의 실제 OHLCV 차트는 다음 업데이트에서 연결됩니다.'), 'chart-ai.astro must drop the "next update" chart-preparing copy.');
// The summary fetch must follow the selected instrument (country + selectedSymbol), not a hardcoded symbol.
assert(
  page.includes('country=${selectedCountry}&symbol=${encodeURIComponent(selectedSymbol)}'),
  'summary fetch must follow the selected country + symbol.',
);

// --- 3. kisClient.ts overseas transport + guard forwarding ---
const kisClient = read(KIS_CLIENT);
const KIS_REQUIRED_TOKENS = [
  'getKisOverseasDailyOhlcSeries',
  'getKisOverseasQuoteSnapshot',
  '/uapi/overseas-price/v1/quotations/dailyprice',
  'HHDFS76240000',
  'allowProductionChartAiBetaLiveQuotes',
];
for (const token of KIS_REQUIRED_TOKENS) {
  assert(kisClient.includes(token), `kisClient.ts missing required token: ${token}`);
}
// The domestic OHLC path must now forward the scoped exception (guard not weakened, just extended).
assert(
  /getKisDomesticDailyOhlcSeries[\s\S]*allowProductionChartAiBetaLiveQuotes/.test(kisClient),
  'kisClient.ts domestic OHLC path must forward the scoped production exception.',
);
// The scoped exception still requires the option strictly true (unchanged guard semantics).
assert(/allowProductionChartAiBetaLiveQuotes\s*===\s*true/.test(kisClient), 'kisClient.ts must keep the strict === true scoped-option check.');

// --- 4. Curated master: required KR + US verification instruments ---
const master = read(MASTER_JSON);
let masterParsed = { instruments: [] };
try { masterParsed = JSON.parse(master); } catch { /* handled below */ }
assert(Array.isArray(masterParsed.instruments) && masterParsed.instruments.length >= 20, 'master must list >=20 instruments.');
const REQUIRED_KR = ['005930', '000660', '005380', '035420', '360750', '069500'];
const REQUIRED_US = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'TSLA', 'SPY', 'QQQ', 'VOO'];
const masterSymbols = new Set((masterParsed.instruments || []).map((i) => String(i.symbol)));
for (const sym of [...REQUIRED_KR, ...REQUIRED_US]) {
  assert(masterSymbols.has(sym), `master missing required verification instrument: ${sym}`);
}
const usEntries = (masterParsed.instruments || []).filter((i) => i.country === 'US');
assert(usEntries.length > 0 && usEntries.every((i) => typeof i.exchangeCode === 'string' && i.exchangeCode), 'every US instrument must carry a KIS overseas exchange code.');
const krEntries = (masterParsed.instruments || []).filter((i) => i.country === 'KR');
assert(krEntries.every((i) => i.exchangeCode === null), 'KR instruments must not carry a US exchange code.');

// --- 5. Search + normalize: no fabricated fallback ---
const searchMod = read(SEARCH_MODULE);
const normalizeMod = read(NORMALIZE_MODULE);
assert(
  searchMod.includes('UNIVERSAL_SEARCH_MIN_QUERY_LENGTH') && searchMod.includes('results: [], resultCount: 0'),
  'search must return empty results for a too-short query (no fabricated fallback).',
);
assert(/isValidCandle/.test(normalizeMod) && /rejectedCount/.test(normalizeMod), 'normalize module must validate + reject malformed candles.');

// --- 6. OHLCV route guarded + provider-neutral; no forbidden endpoints anywhere new ---
const ohlcvRoute = read(OHLCV_ROUTE);
assert(ohlcvRoute.includes('evaluateProductionChartAiBetaAccess'), 'OHLCV route must use the production beta guard.');
assert(ohlcvRoute.includes('prodBetaAccess.allowed'), 'OHLCV route must forward the scoped production signal.');

const NEW_PROVIDER_SURFACE = [SEARCH_MODULE, NORMALIZE_MODULE, OHLCV_PROVIDER, SEARCH_ROUTE, OHLCV_ROUTE, MASTER_JSON, INSTRUMENT_MODEL];
const FORBIDDEN_ENDPOINT_PATTERNS = [
  /inquire-balance/i, /inquire-psbl-order/i, /\/trading\//i, /order-cash/i, /order-credit/i,
  /inquire-account/i, /\baccount-balance\b/i, /\bfunds?-transfer\b/i, /portfolio-order/i,
];
for (const file of NEW_PROVIDER_SURFACE) {
  const body = read(file);
  for (const pattern of FORBIDDEN_ENDPOINT_PATTERNS) {
    assert(!pattern.test(body), `${file} must not reference forbidden endpoint pattern ${pattern}`);
  }
}

// The KIS overseas expansion must be limited to read-only market data (dailyprice + price).
assert(!/order|balance|account_no|trading/i.test(kisClient.split('getKisChartSeries')[0].split('getKisOverseasDailyOhlcSeries')[1] || ''), 'overseas transport must stay read-only market data.');

// --- 7. No sample/synthetic OHLCV fallback in the real provider path ---
const provider = read(OHLCV_PROVIDER);
assert(!/createMockedOhlcSeries|buildSyntheticOhlcvFixture|mockedOhlc/.test(provider), 'OHLCV provider must not import any sample/synthetic OHLCV source.');
assert(provider.includes('no-data') && provider.includes('NO_DATA'), 'OHLCV provider must expose an honest no-data status.');

// --- 8. Forbidden exposure patterns across touched source ---
const touched = [CHART_AI_PAGE, KIS_CLIENT, SUMMARY_ROUTE, OHLCV_ROUTE, SEARCH_ROUTE, OHLCV_PROVIDER].map(read).join('\n');
const FORBIDDEN_CONTENT_PATTERNS = [
  /OPENAI_API_KEY\s*=\s*sk-/,
  /KIS_APP_KEY\s*=\s*[A-Za-z0-9]/,
  /KIS_APP_SECRET\s*=\s*[A-Za-z0-9]/,
  /console\.log\([^)]*process\.env/,
  /gpt-4|gpt-3\.5|gpt-4o|claude-3/i,
];
for (const pattern of FORBIDDEN_CONTENT_PATTERNS) {
  assert(!pattern.test(touched), `Touched source must not match forbidden exposure pattern ${pattern}`);
}

// --- 9. package.json scripts ---
const pkg = read(PACKAGE_JSON);
assert(pkg.includes('"smoke:phase-3gg-op-fast"'), 'package.json must define smoke:phase-3gg-op-fast.');
assert(pkg.includes('"check:phase-3gg-op-fast"'), 'package.json must define check:phase-3gg-op-fast.');

// --- 10. Changelog entry ---
const changelog = read(CHANGELOG);
const changelogSection = changelog.split('## Phase 3GG-OP-FAST')[1]?.split('\n## ')[0] ?? '';
assert(changelog.includes('## Phase 3GG-OP-FAST'), 'changelog must contain the Phase 3GG-OP-FAST entry.');
const CHANGELOG_REQUIRED_TOKENS = [
  'Builds on Phase 3GG-N-FAST',
  'real OHLCV',
  'candlestick',
  'no sample OHLCV fallback',
  'Phase 3GG-Q-FAST',
];
const normChangelog = changelogSection.replace(/\s+/g, ' ');
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(normChangelog.includes(token.replace(/\s+/g, ' ')), `changelog entry missing required token: ${token}`);
}

// --- 11. Result doc ---
const resultDoc = read(RESULT_DOC);
const RESULT_DOC_REQUIRED_TOKENS = [
  'PASS_UNIVERSAL_SEARCH_REAL_OHLCV_PRODUCTION_VERIFIED',
  '69b09e1',
  'kis-overseas',
  'kis-domestic',
  'Phase 3GG-Q-FAST',
];
for (const token of RESULT_DOC_REQUIRED_TOKENS) {
  assert(resultDoc.includes(token), `result doc missing required token: ${token}`);
}

// --- 12. .env / .env.local / .vercel never tracked ---
assert(runGit(['ls-files', '--', '.env', '.env.local']).trim() === '', '.env/.env.local must never be tracked.');
assert(runGit(['ls-files', '--', '.vercel']).trim() === '', '.vercel must never be tracked.');

// --- 13. Working-tree purity (allowed set + sibling/op-fast tolerance) ---
const ALLOWED_MODIFIED_FILES = new Set([
  ...REQUIRED_FILES, KIS_CLIENT, SUMMARY_ROUTE, TYPES_FILE, CHANGELOG, PACKAGE_JSON, CHART_AI_PAGE,
]);
const KNOWN_UNTOUCHED_PREFIXES = ['.agents/', '.claude/', '.vscode/', 'docs/handoff/', 'skills-lock.json'];
const isTolerated = (f) =>
  ALLOWED_MODIFIED_FILES.has(f) ||
  KNOWN_UNTOUCHED_PREFIXES.some((p) => f === p || f.startsWith(p)) ||
  f === '.gitignore' ||
  // This phase's own new source areas (git may report untracked directories collapsed with a trailing slash).
  // Also tolerate later Phase 3GG-Q-FAST chart-ai/similarity artifacts (documented sibling tolerance).
  /^src\/data\/chart-ai\//.test(f) ||
  /^src\/lib\/chart-ai\/portfolio-intelligence\//.test(f) ||
  /^src\/lib\/server\/chart-ai\/(universal|similarity-engine|mkAiAnalysis\/|marketIntelligence\/)/.test(f) ||
  /^src\/pages\/api\/chart-ai\/(instruments\/|market\/|similarity\.json|mk-analysis\.json|market-intelligence\.json)/.test(f) ||
  /^scripts\/(smoke|check|owner_smoke)_phase_3gg_[a-z0-9_]+\.mjs$/.test(f) ||
  /^src\/lib\/server\/providers\/kis\//.test(f) ||
  /^supabase\/migrations\//.test(f) ||
  /^scripts\/[a-z0-9_]+_testsrc\.ts$/.test(f) ||
  /^src\/lib\/chart-ai\//.test(f) ||
  /^docs\/planning\/phase_3gg_[a-z0-9_]+_result(_v[0-9.]+)?\.md$/.test(f);

let porcelain = [];
try {
  porcelain = runGit(['status', '--porcelain'])
    .split('\n')
    .map((l) => l.slice(3).trim())
    .filter(Boolean);
} catch { porcelain = []; }
const unexpected = porcelain.filter((f) => !isTolerated(f));
assert(unexpected.length === 0, `Unexpected working-tree change outside this phase's scope: ${unexpected.join(', ')}`);

// --- summary ---
if (failures === 0) {
  console.log(`PASS: Phase 3GG-OP-FAST contract checker (${assertions}/${assertions} assertions).`);
  process.exit(0);
} else {
  console.error(`FAILED: ${failures}/${assertions} assertions failed.`);
  process.exit(1);
}
