/**
 * Static contract check for Phase 4F-HF1 — Functional HIGH defect fixes (CHART-05 + PORT-10 only).
 *
 * This checker verifies, via static source inspection only (no execution, no network), the exact
 * two approved HIGH functional fixes and nothing beyond them:
 *   - (A-F) CHART-05: bounded backward chart-range paging in universalOhlcvProvider.ts (KR + US),
 *     the additive coverage contract, and that fetchLongHistoryOhlcv/buildLongDomesticQuery stay
 *     structurally untouched (no injected paging deps there).
 *   - (G) CHART-05 client: chart-ai.astro shows a truthful partial-coverage note without a broader
 *     UI redesign.
 *   - (H-K) PORT-10: the narrow allowProductionPortfolioValuationLiveData capability in
 *     kisClient.ts, its dedicated feature-flag gating, the KIS_ACCOUNT_NO hard-block ordering (no
 *     exception carve-out), the generic getKisQuoteSnapshot wrapper staying unscoped, and that
 *     src/pages/api/portfolio/valuation.ts is the ONLY source file that opts in.
 *   - Safety boundaries: no new order/account/balance route was added.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const OHLCV_PROVIDER = join(root, 'src', 'lib', 'server', 'chart-ai', 'universalOhlcvProvider.ts');
const KIS_CLIENT = join(root, 'src', 'lib', 'server', 'providers', 'kisClient.ts');
const QUOTES = join(root, 'src', 'lib', 'server', 'marketData', 'quotes.ts');
const VALUATION_ROUTE = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.ts');
const CHART_AI_PAGE = join(root, 'src', 'pages', 'chart-ai.astro');
const CHART_TEST_SRC = join(root, 'scripts', 'phase_4f_hf1_chart_ai_timeframe_testsrc.ts');
const PORTFOLIO_TEST_SRC = join(root, 'scripts', 'phase_4f_hf1_portfolio_valuation_security_testsrc.ts');
const SMOKE_RUNNER = join(root, 'scripts', 'smoke_phase_4f_hf1_functional_high.mjs');

const log = (msg) => process.stdout.write(msg + '\n');
let passes = 0;
let failures = 0;
const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};
const readOr = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');
const countOf = (src, re) => (src.match(re) || []).length;

log('=== Phase 4F-HF1 Functional HIGH Defect Fixes Static Contract ===');
log('');

// ---------------------------------------------------------------------------
// Group 0: File existence
// ---------------------------------------------------------------------------
log('--- Group 0: File existence ---');
check('0a. universalOhlcvProvider.ts exists', existsSync(OHLCV_PROVIDER));
check('0b. kisClient.ts exists', existsSync(KIS_CLIENT));
check('0c. quotes.ts exists', existsSync(QUOTES));
check('0d. valuation.ts exists', existsSync(VALUATION_ROUTE));
check('0e. chart-ai.astro exists', existsSync(CHART_AI_PAGE));
check('0f. HIGH-01 test source exists', existsSync(CHART_TEST_SRC));
check('0g. HIGH-02 test source exists', existsSync(PORTFOLIO_TEST_SRC));
check('0h. HF1 smoke runner exists', existsSync(SMOKE_RUNNER));

const ohlcvSrc = readOr(OHLCV_PROVIDER);
const kisSrc = readOr(KIS_CLIENT);
const quotesSrc = readOr(QUOTES);
const valuationSrc = readOr(VALUATION_ROUTE);
const chartAiSrc = readOr(CHART_AI_PAGE);

// ---------------------------------------------------------------------------
// Group A: CHART-05 bounded-paging constants
// ---------------------------------------------------------------------------
log('--- Group A: CHART-05 bounded-paging constants ---');
check('A1. CHART_RANGE_MAX_PAGES is bounded to 4 (the spec\'s recommended maximum)', /const CHART_RANGE_MAX_PAGES = 4;/.test(ohlcvSrc));
check('A2. CHART_PAGE_SPAN_DAYS constant exists', /const CHART_PAGE_SPAN_DAYS = 150;/.test(ohlcvSrc));
check('A3. CHART_COVERAGE_TOLERANCE_DAYS constant exists (calendar tolerance, not exact match)', /const CHART_COVERAGE_TOLERANCE_DAYS = 10;/.test(ohlcvSrc));

// ---------------------------------------------------------------------------
// Group B: Additive coverage contract (§2B)
// ---------------------------------------------------------------------------
log('--- Group B: Additive coverage contract ---');
check('B1. UniversalOhlcvCoverage type exists with requestedRange/requestedStartDate/actualStartDate/actualEndDate/candleCount/complete', /export type UniversalOhlcvCoverage = \{\s*requestedRange: string;\s*requestedStartDate: string;\s*actualStartDate: string \| null;\s*actualEndDate: string \| null;\s*candleCount: number;\s*complete: boolean;\s*\};/.test(ohlcvSrc));
check('B2. UniversalOhlcvResponse carries an additive coverage field', /coverage: UniversalOhlcvCoverage;/.test(ohlcvSrc));
check('B3. buildOhlcvCoverage computes completeness using a calendar tolerance, not an exact match', /const complete =\s*actualStartDate !== null && new Date\(actualStartDate\)\.getTime\(\) <= requestedStartDate\.getTime\(\) \+ toleranceMs;/.test(ohlcvSrc));
check('B4. coverage is computed for every distinct branch (invalid instrument, first-page failure, and the shared no-data/ok success path)', countOf(ohlcvSrc, /buildOhlcvCoverage\(/g) >= 3);

// ---------------------------------------------------------------------------
// Group C: Injectable deps for deterministic testability (§2D)
// ---------------------------------------------------------------------------
log('--- Group C: Injectable deps for deterministic testability ---');
check('C1. FetchUniversalOhlcvDeps type exists with now/fetchDomesticPage/fetchOverseasPage, all optional', /type FetchUniversalOhlcvDeps = \{\s*now\?: \(\) => number;\s*fetchDomesticPage\?: typeof getKisDomesticDailyOhlcSeries;\s*fetchOverseasPage\?: typeof getKisOverseasDailyOhlcSeries;\s*\};/.test(ohlcvSrc));
check('C2. fetchUniversalOhlcv accepts a deps parameter defaulting to {}', /export const fetchUniversalOhlcv = async \(\s*input: FetchUniversalOhlcvInput,\s*deps: FetchUniversalOhlcvDeps = \{\},/.test(ohlcvSrc));
check('C3. real transports are the default when deps are omitted (production behavior unchanged)', /const fetchDomesticPage = deps\.fetchDomesticPage \?\? getKisDomesticDailyOhlcSeries;/.test(ohlcvSrc) && /const fetchOverseasPage = deps\.fetchOverseasPage \?\? getKisOverseasDailyOhlcSeries;/.test(ohlcvSrc));
check('C4. buildDomesticQuery takes an injected nowMs instead of a hidden new Date() (the fixed testability defect)', /const buildDomesticQuery = \(symbol: string, range: string, nowMs: number\): Record<string, string> => \{/.test(ohlcvSrc));
check('C5. the page-0 KR call site injects now() into buildDomesticQuery', /buildDomesticQuery\(instrument\.symbol, range, now\(\)\)/.test(ohlcvSrc));
check('C6. no bare `new Date()` remains inside buildDomesticQuery (only the injected nowMs is used)', !/const buildDomesticQuery[\s\S]{0,40}new Date\(\)/.test(ohlcvSrc));

// ---------------------------------------------------------------------------
// Group D: Bounded backward-paging loop structure
// ---------------------------------------------------------------------------
log('--- Group D: Bounded backward-paging loop structure ---');
check('D1. the chart loader runs a bounded for-loop capped at CHART_RANGE_MAX_PAGES', /for \(let page = 0; page < CHART_RANGE_MAX_PAGES; page \+= 1\) \{/.test(ohlcvSrc));
check('D2. KR pages after the first reuse the long-history query builder (no duplicated logic)', /buildLongDomesticQuery\(\s*instrument\.symbol,\s*new Date\(endDate\.getTime\(\) - CHART_PAGE_SPAN_DAYS \* 24 \* 60 \* 60 \* 1000\),\s*endDate,\s*\)/.test(ohlcvSrc));
check('D3. US pages use a backward BYMD cursor', /bymd: page === 0 \? '' : bymdCursor,/.test(ohlcvSrc));
check('D4. first-page failure breaks and is distinguished from later-page stop conditions', /if \(page === 0\) \{\s*firstPageFailed = true;\s*firstPageErrorCode = result\.code;\s*\}\s*break;/.test(ohlcvSrc));
check('D5. loop stops once sufficiently covered within calendar tolerance', /if \(earliestDate\.getTime\(\) <= requestedStartDate\.getTime\(\) \+ toleranceMs\) break;/.test(ohlcvSrc));
check('D6. loop stops if the oldest date fails to move strictly backward (no infinite loop)', /if \(earliestSeenDate !== null && earliestDate\.getTime\(\) >= earliestSeenDate\.getTime\(\)\) break;/.test(ohlcvSrc));
check('D7. loop stops on a short page (near start of history)', /if \(points\.length < 10\) break; \/\/ near the start of available history/.test(ohlcvSrc));

// ---------------------------------------------------------------------------
// Group E: Long-history engine left unmodified (§2A hard rule)
// ---------------------------------------------------------------------------
log('--- Group E: Long-history engine left unmodified ---');
check('E1. buildLongDomesticQuery keeps its original explicit-date signature (no nowMs/deps added)', /const buildLongDomesticQuery = \(symbol: string, startDate: Date, endDate: Date\): Record<string, string> => \(\{/.test(ohlcvSrc));
check('E2. fetchLongHistoryOhlcv keeps its original deps shape (only { now? }, no page-fetch injection)', /deps: \{ now\?: \(\) => number \} = \{\},/.test(ohlcvSrc));
check('E3. fetchLongHistoryOhlcv still calls the real KIS transports directly (not the injectable fetchDomesticPage/fetchOverseasPage)', /const loader = async \(\): Promise<LongHistoryOhlcvResult> => \{[\s\S]{0,900}await getKisDomesticDailyOhlcSeries\(/.test(ohlcvSrc));
check('E4. LONG_HISTORY_MAX_PAGES / LONG_HISTORY_TARGET_BARS constants are unchanged', /const LONG_HISTORY_TARGET_BARS = 750;/.test(ohlcvSrc) && /const LONG_HISTORY_MAX_PAGES = 10;/.test(ohlcvSrc));

// ---------------------------------------------------------------------------
// Group F: Sanitized, no-secret coverage payload
// ---------------------------------------------------------------------------
log('--- Group F: Sanitized coverage payload ---');
check('F1. coverage carries no raw provider payload/token/secret field names', !/coverage[\s\S]{0,10}(token|secret|appKey|appSecret)/i.test(ohlcvSrc));
check('F2. a short, one-line doc comment marks the coverage field Phase-4F-HF1/CHART-05', /Phase 4F-HF1 \(CHART-05\)/.test(ohlcvSrc));

// ---------------------------------------------------------------------------
// Group G: CHART-05 client-side truthful partial-coverage note (§2C)
// ---------------------------------------------------------------------------
log('--- Group G: Client partial-coverage note ---');
check('G1. chart-ai.astro renders a dedicated coverage-warning element', /id="chartAiRealChartCoverageWarning"/.test(chartAiSrc));
check('G2. the warning only shows when sourceStatus is ok AND coverage.complete is false', /const incomplete = ohlcv\?\.sourceStatus === 'ok' && coverage && coverage\.complete === false;/.test(chartAiSrc));
check('G3. the warning is hidden/cleared when coverage is complete (no persistent false-positive banner)', /coverageWarningEl\.textContent = '';\s*coverageWarningEl\.hidden = true;/.test(chartAiSrc));
check('G4. no broader Chart AI report redesign was introduced alongside the coverage note (no new report/redesign class markers)', !/chart-report-redesign|reportRedesign/i.test(chartAiSrc));

// ---------------------------------------------------------------------------
// Group H: PORT-10 narrow capability + feature flag (§3A)
// ---------------------------------------------------------------------------
log('--- Group H: PORT-10 narrow capability + feature flag ---');
check('H1. the dedicated feature-flag env name constant exists', /const productionPortfolioValuationFlagEnvName = 'KIS_ENABLE_PRODUCTION_PORTFOLIO_VALUATION';/.test(kisSrc));
check('H2. getKisQuoteConfigReadiness accepts allowProductionPortfolioValuationLiveData as an option', /allowProductionPortfolioValuationLiveData\?: boolean;/.test(kisSrc));
check('H3. the exception requires vercel-production runtime AND the per-call option AND the dedicated flag (all three, not any one alone)', /const productionPortfolioValuationExceptionAllowed =\s*runtimeClass === 'vercel-production' &&\s*options\.allowProductionPortfolioValuationLiveData === true &&\s*readEnvValue\(productionPortfolioValuationFlagEnvName\) === 'true';/.test(kisSrc));
check('H4. the exception only lifts the runtime hard block (appears in the same OR-guard as the other two independent exceptions)', /!productionChartAiExceptionAllowed &&\s*!productionMarketDashboardExceptionAllowed &&\s*!productionPortfolioValuationExceptionAllowed/.test(kisSrc));

// ---------------------------------------------------------------------------
// Group I: KIS_ACCOUNT_NO hard-block ordering (no carve-out) — §3A / §5 item 5
// ---------------------------------------------------------------------------
log('--- Group I: KIS_ACCOUNT_NO hard-block ordering ---');
const accountNoBlockMatch = kisSrc.match(/\/\/ KIS_ACCOUNT_NO must be absent for quote-only scope\s*\n\s*if \(hasValue\('KIS_ACCOUNT_NO'\)\) \{\s*\n\s*return \{ \.\.\.base, ready: false, reason: 'production_not_allowed' \};\s*\n\s*\}/);
const portfolioExceptionDeclMatch = kisSrc.match(/const productionPortfolioValuationExceptionAllowed =\s*\n\s*runtimeClass === 'vercel-production' &&/);
check('I1. the KIS_ACCOUNT_NO check exists as an unconditional hard block after the runtime-exception block', !!accountNoBlockMatch);
check(
  'I2. the KIS_ACCOUNT_NO block runs AFTER (not before) the Portfolio exception computation, so that exception cannot skip it',
  !!accountNoBlockMatch &&
    !!portfolioExceptionDeclMatch &&
    kisSrc.indexOf(portfolioExceptionDeclMatch[0]) < kisSrc.indexOf(accountNoBlockMatch[0]),
);
check('I3. the KIS_ACCOUNT_NO block references no exception-allowed variable (i.e. no carve-out was added for the new Portfolio exception)', !!accountNoBlockMatch && !/ExceptionAllowed/.test(accountNoBlockMatch[0]));

// ---------------------------------------------------------------------------
// Group J: Generic wrapper stays unscoped (§3B)
// ---------------------------------------------------------------------------
log('--- Group J: Generic quote wrapper stays unscoped ---');
check('J1. getKisQuoteSnapshot forwards with zero options (cannot self-satisfy any Production exception)', /export const getKisQuoteSnapshot = async \(input: SecurityIdentity\): Promise<ProviderResult<QuoteSnapshot>> =>\s*getKisDomesticQuoteSnapshot\(input\);/.test(kisSrc));
check('J2. quotes.ts only routes through the scoped Portfolio option when the caller explicitly passes it true', /options\.allowProductionPortfolioValuationLiveData === true\s*\?\s*\(identityInput: SecurityIdentity\) =>\s*getKisDomesticQuoteSnapshot\(identityInput, \{ allowProductionPortfolioValuationLiveData: true \}\)\s*:\s*getKisQuoteSnapshot\)/.test(quotesSrc));
check('J3. QuoteSnapshotOptions declares allowProductionPortfolioValuationLiveData as optional (default unset/false)', /allowProductionPortfolioValuationLiveData\?: boolean;/.test(quotesSrc));

// ---------------------------------------------------------------------------
// Group K: valuation.ts is the ONLY opt-in call site (§3B)
// ---------------------------------------------------------------------------
log('--- Group K: valuation.ts is the only opt-in call site ---');
// Scoped to src/pages/** (routes/pages) only -- this deliberately excludes the sanctioned plumbing
// in quotes.ts (the forwarding ternary) and kisClient.ts (the option's own definition), since §3B's
// "only valuation.ts may opt in" is about which ROUTE calls the option, not the shared library code
// that implements it.
const OPT_IN_LITERAL = 'allowProductionPortfolioValuationLiveData: true';
const PAGES_DIR = join(root, 'src', 'pages');
const walk = (dir, acc) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (['.ts', '.tsx', '.astro', '.mjs', '.js'].includes(extname(full))) acc.push(full);
  }
  return acc;
};
const pageFiles = walk(PAGES_DIR, []);
const filesWithOptIn = pageFiles.filter((f) => readFileSync(f, 'utf8').includes(OPT_IN_LITERAL));
check('K1. exactly one file under src/pages/ sets the literal `allowProductionPortfolioValuationLiveData: true`', filesWithOptIn.length === 1);
check('K2. that one file is src/pages/api/portfolio/valuation.ts', filesWithOptIn.length === 1 && filesWithOptIn[0] === VALUATION_ROUTE);
check('K3. valuation.ts sets the option only after auth/ownership resolution (getPortfolioRequestContext runs earlier in the file)', valuationSrc.indexOf('getPortfolioRequestContext(request)') < valuationSrc.indexOf(OPT_IN_LITERAL));
check('K4. valuation.ts calls the option only for KR symbols (no US/FX/account scope introduced)', /getQuoteSnapshot\(\{ market: 'KR', symbol \}, \{ allowProductionPortfolioValuationLiveData: true \}\)/.test(valuationSrc));

// ---------------------------------------------------------------------------
// Group L: Safety boundaries (Hard Rules)
// ---------------------------------------------------------------------------
log('--- Group L: Safety boundaries ---');
check('L1. no new account/balance/order route file was added under src/pages/api/', !existsSync(join(root, 'src', 'pages', 'api', 'portfolio', 'account.ts')) && !existsSync(join(root, 'src', 'pages', 'api', 'portfolio', 'balance.ts')) && !existsSync(join(root, 'src', 'pages', 'api', 'portfolio', 'order.ts')));
check('L2. valuation.ts introduces no order/trade execution reference', !/placeOrder|submitOrder|매매 주문|주문 실행/i.test(valuationSrc));
check('L3. valuation.ts introduces no account/balance API call (comment mentions of the KIS_ACCOUNT_NO safety check are fine; a real account/balance lookup is not)', !/getKisAccountBalance|kisAccountBalance|process\.env\.KIS_ACCOUNT_NO|\/api\/portfolio\/(account|balance)/i.test(valuationSrc));
check('L4. no US Portfolio valuation / FX / USD conversion was introduced in valuation.ts (KR-only in HF1)', !/market === 'US'|convertUsdToKrw|fxRate/i.test(valuationSrc));
check('L5. no generic KIS "productionScope" enum refactor was introduced (kept as three independent named exceptions)', !/productionScope/i.test(kisSrc));
check('L6. no chart-ai.astro broad refactor marker (no new shared "genericDataLayer"/"clientDataLayer" abstraction)', !/genericDataLayer|clientDataLayer/i.test(chartAiSrc));

log('');
log(`Total: ${passes + failures} | Passed: ${passes} | Failed: ${failures}`);
process.exitCode = failures === 0 ? 0 : 1;
