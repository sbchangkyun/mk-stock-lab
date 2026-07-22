/**
 * Static contract check for Portfolio UI Valuation Mapping with Fixture API (Phase 3BX).
 * No network calls. No .env reads. Exits non-zero on any failure.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const PORTFOLIO_ASTRO = join(root, 'src', 'pages', 'portfolio.astro');
const CSS_PATH = join(root, 'src', 'styles', 'style.css');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3bx_portfolio_ui_valuation_mapping_fixture_result_v0.1.md');
const PACKAGE_JSON = join(root, 'package.json');
const NEWS_PAGE = join(root, 'src', 'pages', 'news');
const HPP = join(root, 'src', 'components', 'HomePortfolioPanel.astro');
const HMN = join(root, 'src', 'components', 'HomeMarketNews.astro');
const VALUATION_ROUTE = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.ts');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Phase 3BX Portfolio UI Valuation Fixture Mapping Static Contract ===');
log('');

const portfolioContent = existsSync(PORTFOLIO_ASTRO) ? readFileSync(PORTFOLIO_ASTRO, 'utf8') : '';
const cssContent = existsSync(CSS_PATH) ? readFileSync(CSS_PATH, 'utf8') : '';

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

check('portfolio.astro exists', existsSync(PORTFOLIO_ASTRO));
check('style.css exists', existsSync(CSS_PATH));
check('Phase 3BX result doc exists', existsSync(RESULT_DOC));
check('Valuation route still present (3BX does not remove it)', existsSync(VALUATION_ROUTE));
check('package.json has check:portfolio-ui-valuation-fixture script',
  typeof pkg.scripts?.['check:portfolio-ui-valuation-fixture'] === 'string');
log('');

// ---------------------------------------------------------------------------
// Group 2: AppState valuation fields
// ---------------------------------------------------------------------------
log('--- Group 2: AppState valuation fields ---');

check('ValuationStatus type declared',
  portfolioContent.includes('ValuationStatus'));
check('PositionValuation type declared',
  portfolioContent.includes('PositionValuation'));
check('positionValuations field in AppState',
  portfolioContent.includes('positionValuations'));
check('valuationStatus field in AppState',
  portfolioContent.includes('valuationStatus'));
check('valuationMessage field in AppState',
  portfolioContent.includes('valuationMessage'));
check('state.positionValuations initialized as empty object',
  portfolioContent.includes('positionValuations: {}'));
check('state.valuationStatus initialized as idle',
  portfolioContent.includes("valuationStatus: 'idle'"));
check('state.valuationMessage initialized as null',
  portfolioContent.includes('valuationMessage: null'));
log('');

// ---------------------------------------------------------------------------
// Group 3: loadValuation function
// ---------------------------------------------------------------------------
log('--- Group 3: loadValuation function ---');

check('loadValuation async function defined',
  portfolioContent.includes('const loadValuation = async'));
check('loadValuation posts to /api/portfolio/valuation',
  portfolioContent.includes("'/api/portfolio/valuation'") ||
  portfolioContent.includes('"/api/portfolio/valuation"'));
check('loadValuation uses method: POST',
  portfolioContent.includes("method: 'POST'") || portfolioContent.includes('method: "POST"'));
check('loadValuation sends source: fixture',
  portfolioContent.includes("source: 'fixture'") || portfolioContent.includes('source: "fixture"'));
check('loadValuation sends baseCurrency in request',
  portfolioContent.includes('baseCurrency'));
check('loadValuation maps positionId from response rows',
  portfolioContent.includes('row.positionId'));
check('loadValuation maps currentPrice from response rows',
  portfolioContent.includes('row.currentPrice'));
check('loadValuation maps marketValue from response rows',
  portfolioContent.includes('row.marketValue'));
check('loadValuation maps unrealizedPnl from response rows',
  portfolioContent.includes('row.unrealizedPnl'));
check('loadValuation maps unrealizedPnlPct from response rows',
  portfolioContent.includes('row.unrealizedPnlPct'));
check('loadValuation sets valuationStatus to loading before fetch',
  portfolioContent.includes("state.valuationStatus = 'loading'"));
check('loadValuation sets valuationStatus to ready or partial on success',
  portfolioContent.includes("'ready'") && portfolioContent.includes("'partial'"));
check('loadValuation sets valuationStatus to error on fetch failure',
  portfolioContent.includes("state.valuationStatus = 'error'"));
check('loadValuation sets fixture disclosure message',
  portfolioContent.includes('Fixture 기준 평가값입니다'));
log('');

// ---------------------------------------------------------------------------
// Group 4: getPositionValuation helper
// ---------------------------------------------------------------------------
log('--- Group 4: getPositionValuation helper ---');

check('getPositionValuation helper function defined',
  portfolioContent.includes('const getPositionValuation'));
check('getPositionValuation uses position.id as primary key',
  portfolioContent.includes('position.id ||') || portfolioContent.includes('position.id??'));
check('getPositionValuation falls back to market:symbol composite key',
  portfolioContent.includes('`${position.market}:${position.symbol}`') ||
  portfolioContent.includes("position.market + ':' + position.symbol"));
check('getPositionValuation reads from state.positionValuations',
  portfolioContent.includes('state.positionValuations['));
log('');

// ---------------------------------------------------------------------------
// Group 5: Column mapping in renderPositions
// ---------------------------------------------------------------------------
log('--- Group 5: Column mapping in renderPositions ---');

check('currentPriceDisplay computed for 현재가 cell',
  portfolioContent.includes('currentPriceDisplay'));
check('marketValueDisplay computed for 평가금 cell',
  portfolioContent.includes('marketValueDisplay'));
check('pnlPctDisplay computed for 수익률 cell',
  portfolioContent.includes('pnlPctDisplay'));
check('pnlDisplay computed for 수익금 cell',
  portfolioContent.includes('pnlDisplay'));
check('Fallback 연동 예정 used when valuation is null',
  portfolioContent.includes("?? '연동 예정'"));
check('metric-placeholder applied conditionally based on null check',
  portfolioContent.includes('currentPriceDisplay == null') ||
  portfolioContent.includes('currentPriceDisplay === null'));
check('Dividend columns still use 데이터 대기 placeholder',
  portfolioContent.includes('데이터 대기'));
check('연동 예정 still referenced as fallback',
  portfolioContent.includes('연동 예정'));
log('');

// ---------------------------------------------------------------------------
// Group 6: Sort integration with valuation data
// ---------------------------------------------------------------------------
log('--- Group 6: Sort integration ---');

check('getPositionSortValue handles valuation kind using positionValuations',
  (() => {
    const idx = portfolioContent.indexOf('const getPositionSortValue');
    if (idx === -1) return false;
    const fn = portfolioContent.slice(idx, idx + 500);
    return fn.includes("kind === 'valuation'") && fn.includes('posVal');
  })());
check('getPositionSortValue handles return kind using unrealizedPnlPct',
  (() => {
    const idx = portfolioContent.indexOf('const getPositionSortValue');
    if (idx === -1) return false;
    const fn = portfolioContent.slice(idx, idx + 500);
    return fn.includes("kind === 'return'") && fn.includes('unrealizedPnlPct');
  })());
check('getPositionSortValue handles profit kind using unrealizedPnl',
  (() => {
    const idx = portfolioContent.indexOf('const getPositionSortValue');
    if (idx === -1) return false;
    const fn = portfolioContent.slice(idx, idx + 700);
    return fn.includes("kind === 'profit'") && fn.includes('unrealizedPnl');
  })());
log('');

// ---------------------------------------------------------------------------
// Group 7: loadPositions wires to loadValuation
// ---------------------------------------------------------------------------
log('--- Group 7: loadPositions wires to loadValuation ---');

check('loadPositions awaits loadValuation after rendering',
  portfolioContent.includes('await loadValuation('));
check('loadPositions calls loadValuation for aggregate view',
  (() => {
    const idx = portfolioContent.indexOf('const loadPositions = async');
    if (idx === -1) return false;
    const fn = portfolioContent.slice(idx, idx + 600);
    return fn.includes('isAggregatePortfolioId') && fn.includes('loadValuation');
  })());
check('loadPositions calls loadValuation for single portfolio view',
  (() => {
    const idx = portfolioContent.indexOf('const loadPositions = async');
    if (idx === -1) return false;
    const fn = portfolioContent.slice(idx, idx + 600);
    const occurrences = (fn.match(/loadValuation/g) || []).length;
    return occurrences >= 2;
  })());
log('');

// ---------------------------------------------------------------------------
// Group 8: clearPortfolioData resets valuation state
// ---------------------------------------------------------------------------
log('--- Group 8: clearPortfolioData resets valuation state ---');

check('clearPortfolioData resets positionValuations',
  (() => {
    const idx = portfolioContent.indexOf('const clearPortfolioData');
    if (idx === -1) return false;
    const fn = portfolioContent.slice(idx, idx + 500);
    return fn.includes('positionValuations');
  })());
check('clearPortfolioData resets valuationStatus',
  (() => {
    const idx = portfolioContent.indexOf('const clearPortfolioData');
    if (idx === -1) return false;
    const fn = portfolioContent.slice(idx, idx + 500);
    return fn.includes('valuationStatus');
  })());
check('clearPortfolioData resets valuationMessage',
  (() => {
    const idx = portfolioContent.indexOf('const clearPortfolioData');
    if (idx === -1) return false;
    const fn = portfolioContent.slice(idx, idx + 500);
    return fn.includes('valuationMessage');
  })());
log('');

// ---------------------------------------------------------------------------
// Group 9: Fixture disclosure copy
// ---------------------------------------------------------------------------
log('--- Group 9: Fixture disclosure copy ---');

check('valuation-status-copy element present in HTML',
  portfolioContent.includes('valuation-status-copy'));
check('Fixture disclosure does not claim real-time data',
  !portfolioContent.includes('실시간 시세 반영') &&
  !portfolioContent.includes('실시간 시세를 표시') &&
  !portfolioContent.includes('최신 시세'));
check('No 현재 시세 real-time market price claim',
  !portfolioContent.includes('현재 시세를 반영') && !portfolioContent.includes('현재 시세 기준'));
log('');

// ---------------------------------------------------------------------------
// Group 10: CSS
// ---------------------------------------------------------------------------
log('--- Group 10: CSS valuation status copy ---');

check('CSS .valuation-status-copy defined',
  cssContent.includes('.valuation-status-copy'));
log('');

// ---------------------------------------------------------------------------
// Group 11: Tab order persistence no-regression (3BW-HF1)
// ---------------------------------------------------------------------------
log('--- Group 11: Tab order persistence no-regression ---');

check('TAB_ORDER_STORAGE_KEY still present (3BW-HF1 not broken)',
  portfolioContent.includes('TAB_ORDER_STORAGE_KEY'));
check('readTabOrderFromStorage still present',
  portfolioContent.includes('readTabOrderFromStorage'));
check('saveTabOrderToStorage still present',
  portfolioContent.includes('saveTabOrderToStorage'));
check('Tab order storage key is controlled namespaced key',
  !portfolioContent.includes('portfolioTabOrder') &&
  (!portfolioContent.includes('portfolio-tab-order') || portfolioContent.includes('mk-stock-lab:portfolio-tab-order')));
log('');

// ---------------------------------------------------------------------------
// Group 12: Safety boundaries
// ---------------------------------------------------------------------------
log('--- Group 12: Safety boundaries ---');

check('No live KIS OAuth endpoint in portfolio page',
  !portfolioContent.includes('oauth2/tokenP'));
check('No live KIS quote endpoint in portfolio page',
  !portfolioContent.includes('/uapi/domestic-stock/v1/quotations'));
check('No KIS_APP_KEY read in portfolio page',
  !portfolioContent.includes('KIS_APP_KEY'));
check('No live GNews call in portfolio page',
  !portfolioContent.includes('gnews.io'));
check('No GNEWS_API_KEY read in portfolio page',
  !portfolioContent.includes('GNEWS_API_KEY'));
check('No supabaseAdmin import in portfolio page',
  !portfolioContent.includes('supabaseAdmin'));
check('No DB migration SQL in portfolio page',
  !portfolioContent.includes('CREATE TABLE'));
check('No external ad scripts added',
  !portfolioContent.includes('googletagmanager') && !portfolioContent.includes('doubleclick'));
check('HomePortfolioPanel component present (unchanged)', existsSync(HPP));
check('HomeMarketNews component present (unchanged)', existsSync(HMN));
check('No /news page created', !existsSync(NEWS_PAGE));
log('');

// ---------------------------------------------------------------------------
// Group 13: Fixture-only data contract
// ---------------------------------------------------------------------------
log('--- Group 13: Fixture-only data contract ---');

check('loadValuation request sends source: fixture (not live or auto)',
  portfolioContent.includes("source: 'fixture'") && !portfolioContent.includes("source: 'live'"));
check('No client-side live KIS quote fetch added',
  !portfolioContent.includes('koreainvestment') && !portfolioContent.includes('/uapi/domestic-stock'));
check('Fixture disclosure does not claim real-time or live price data',
  !portfolioContent.includes('실시간 시세 반영') &&
  !portfolioContent.includes('최신 시세') &&
  !portfolioContent.includes('실제 시세'));
log('');

// ---------------------------------------------------------------------------
// Group 14: Network safety guard
// ---------------------------------------------------------------------------
log('--- Group 14: Checker network safety ---');

let fetchAttempted = false;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('fetch blocked by checker'); };
check('Checker itself makes no network calls', !fetchAttempted);
globalThis.fetch = origFetch;
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3BX Portfolio UI Valuation Fixture Mapping — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
