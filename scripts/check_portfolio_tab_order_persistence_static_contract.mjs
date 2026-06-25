/**
 * Static contract check for Portfolio Bookmark Tab Order Local Persistence (Phase 3BW-HF1).
 * No network calls. No .env reads. Exits non-zero on any failure.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const PORTFOLIO_PAGE = join(root, 'src', 'pages', 'portfolio.astro');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3bw_hf1_portfolio_bookmark_tab_order_local_persistence_result_v0.1.md');
const PACKAGE_JSON = join(root, 'package.json');
const HPP_COMPONENT = join(root, 'src', 'components', 'HomePortfolioPanel.astro');
const HOME_MARKET_NEWS = join(root, 'src', 'components', 'HomeMarketNews.astro');
const VALUATION_ROUTE = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.ts');

const originalFetch = globalThis.fetch;
globalThis.fetch = () => { throw new Error('Network call blocked in no-network checker'); };

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Portfolio Tab Order Local Persistence Static Contract Check (Phase 3BW-HF1) ===');
log('');

const portfolioContent = existsSync(PORTFOLIO_PAGE) ? readFileSync(PORTFOLIO_PAGE, 'utf8') : '';
let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

check('Portfolio page exists', existsSync(PORTFOLIO_PAGE));
check('Phase 3BW-HF1 result doc exists', existsSync(RESULT_DOC));
check('package.json has check:portfolio-tab-order-persistence script',
  typeof pkg.scripts?.['check:portfolio-tab-order-persistence'] === 'string');
check('HomePortfolioPanel still present (boundary)', existsSync(HPP_COMPONENT));
check('HomeMarketNews still present (boundary)', existsSync(HOME_MARKET_NEWS));
log('');

// ---------------------------------------------------------------------------
// Group 2: Bookmark tab structure preserved
// ---------------------------------------------------------------------------
log('--- Group 2: Bookmark tab structure preserved ---');

check('portfolio-bookmark-tabs class present', portfolioContent.includes('portfolio-bookmark-tabs'));
check('portfolio-bookmark-tab class present', portfolioContent.includes('portfolio-bookmark-tab'));
check('portfolio-tab-list element present', portfolioContent.includes('portfolio-tab-list'));
check('getOrderedPortfolios still used for tab rendering', portfolioContent.includes('getOrderedPortfolios()'));
check('aggregatePortfolioId constant still defined', portfolioContent.includes('aggregatePortfolioId'));
check('portfolioOrder in AppState', portfolioContent.includes('portfolioOrder'));
log('');

// ---------------------------------------------------------------------------
// Group 3: Aggregate tab pinned left
// ---------------------------------------------------------------------------
log('--- Group 3: Aggregate tab pinned left ---');

check('Aggregate tab label 전체 present',
  portfolioContent.includes("'전체'") || portfolioContent.includes('"전체"'));
check('Aggregate tab class portfolio-bookmark-tab--aggregate present',
  portfolioContent.includes('portfolio-bookmark-tab--aggregate'));
check('__all_portfolios__ constant still present', portfolioContent.includes('__all_portfolios__'));
check('Aggregate default selection preserved (state.selectedPortfolioId = aggregatePortfolioId)',
  portfolioContent.includes('state.selectedPortfolioId = aggregatePortfolioId'));
log('');

// ---------------------------------------------------------------------------
// Group 4: Add tab pinned at end
// ---------------------------------------------------------------------------
log('--- Group 4: Add tab pinned at end ---');

check('Add tab (portfolio-bookmark-tab--add) still present',
  portfolioContent.includes('portfolio-bookmark-tab--add'));
check('Add tab id portfolio-manage-toggle used',
  portfolioContent.includes("'portfolio-manage-toggle'") ||
  portfolioContent.includes('"portfolio-manage-toggle"'));
check('toggle-manage-panel action still handled',
  portfolioContent.includes("'toggle-manage-panel'") ||
  portfolioContent.includes('"toggle-manage-panel"'));
check('Add tab is separate button — not part of portfolioOrder (no push to portfolioOrder for add tab)',
  !portfolioContent.includes("portfolioOrder.push('portfolio-manage") &&
  !portfolioContent.includes('portfolioOrder.push("portfolio-manage'));
log('');

// ---------------------------------------------------------------------------
// Group 5: Reorder logic still present
// ---------------------------------------------------------------------------
log('--- Group 5: Reorder actions still present ---');

check('move-portfolio-up action present',
  portfolioContent.includes("'move-portfolio-up'") ||
  portfolioContent.includes('"move-portfolio-up"'));
check('move-portfolio-down action present',
  portfolioContent.includes("'move-portfolio-down'") ||
  portfolioContent.includes('"move-portfolio-down"'));
check('Reorder swaps entries in portfolioOrder (index swap)',
  portfolioContent.includes('[ordered[index], ordered[nextIndex]]') ||
  portfolioContent.includes('ordered[index], ordered[nextIndex]'));
check('state.portfolioOrder updated in reorder handler',
  portfolioContent.includes('state.portfolioOrder = ordered'));
log('');

// ---------------------------------------------------------------------------
// Group 6: localStorage persistence
// ---------------------------------------------------------------------------
log('--- Group 6: localStorage persistence ---');

check('Storage key mk-stock-lab:portfolio-tab-order:v1 present',
  portfolioContent.includes('mk-stock-lab:portfolio-tab-order:v1'));
check('TAB_ORDER_STORAGE_KEY constant defined',
  portfolioContent.includes('TAB_ORDER_STORAGE_KEY'));
check('readTabOrderFromStorage function defined',
  portfolioContent.includes('readTabOrderFromStorage'));
check('saveTabOrderToStorage function defined',
  portfolioContent.includes('saveTabOrderToStorage'));
check('localStorage.getItem called for reading tab order',
  portfolioContent.includes('localStorage.getItem'));
check('localStorage.setItem called for saving tab order',
  portfolioContent.includes('localStorage.setItem'));
check('Storage write occurs after reorder (saveTabOrderToStorage in reorder handler)',
  portfolioContent.includes('saveTabOrderToStorage(state.portfolioOrder)'));
check('Storage read occurs in portfolio load path (readTabOrderFromStorage called in loadPortfolios)',
  portfolioContent.includes('readTabOrderFromStorage()'));
log('');

// ---------------------------------------------------------------------------
// Group 7: Reconciliation behavior
// ---------------------------------------------------------------------------
log('--- Group 7: Reconciliation ---');

check('Reconciliation uses knownIds to filter removed IDs',
  portfolioContent.includes('knownIds.has(id)'));
check('Reconciliation appends new portfolios not in saved order (!baseOrder.includes)',
  portfolioContent.includes('!baseOrder.includes(id)'));
check('savedOrder used as base for reconciliation',
  portfolioContent.includes('savedOrder') && portfolioContent.includes('baseOrder'));
check('saveTabOrderToStorage called after reconciliation in loadPortfolios',
  portfolioContent.includes('saveTabOrderToStorage(state.portfolioOrder)'));
check('Delete path calls loadPortfolios (reconciliation removes deleted id)',
  portfolioContent.includes('deletePortfolio') && portfolioContent.includes('await loadPortfolios()'));
check('Create path calls loadPortfolios (new portfolio appended at end)',
  portfolioContent.includes('createPortfolio') && portfolioContent.includes('await loadPortfolios()'));
check('Edit path calls loadPortfolios (order preserved, only name changes)',
  portfolioContent.includes('updatePortfolio') && portfolioContent.includes('await loadPortfolios()'));
log('');

// ---------------------------------------------------------------------------
// Group 8: Error handling
// ---------------------------------------------------------------------------
log('--- Group 8: localStorage error handling ---');

check('localStorage operations wrapped in try/catch',
  portfolioContent.includes('try {') && portfolioContent.includes('} catch {'));
check('Invalid JSON triggers localStorage.removeItem (cleanup bad data)',
  portfolioContent.includes('localStorage.removeItem'));
check('Saved data type-validated as string array',
  portfolioContent.includes("typeof item === 'string'") ||
  portfolioContent.includes('every((item) => typeof item === \'string\''));
check('Invalid parse returns empty array gracefully',
  portfolioContent.includes('readTabOrderFromStorage') && portfolioContent.includes('return [];'));
log('');

// ---------------------------------------------------------------------------
// Group 9: Data safety — IDs only stored
// ---------------------------------------------------------------------------
log('--- Group 9: Data safety — IDs only ---');

check('Stored value is JSON.stringify of ids array',
  portfolioContent.includes('JSON.stringify(ids)'));
check('saveTabOrderToStorage accepts ids: string[] parameter',
  portfolioContent.includes('saveTabOrderToStorage = (ids'));
check('Aggregate id excluded from stored order (not in state.portfolioOrder)',
  portfolioContent.includes('isAggregatePortfolioId(id)') &&
  portfolioContent.includes('state.portfolioOrder'));
check('No portfolio names in stored order (saveTabOrderToStorage never takes portfolio.name)',
  !portfolioContent.includes('saveTabOrderToStorage(state.portfolios)') &&
  !portfolioContent.includes('JSON.stringify(state.portfolios)') &&
  portfolioContent.includes('JSON.stringify(ids)'));
log('');

// ---------------------------------------------------------------------------
// Group 10: Non-goals — forbidden patterns absent
// ---------------------------------------------------------------------------
log('--- Group 10: Non-goals not present ---');

check('No Supabase orderIndex added', !portfolioContent.includes('orderIndex'));
check('No backend API route added for tab order',
  !existsSync(join(root, 'src', 'pages', 'api', 'portfolio', 'tab-order.ts')) &&
  !existsSync(join(root, 'src', 'pages', 'api', 'portfolio', 'tab-order.js')));
check('No DB/migration SQL in portfolio page',
  !portfolioContent.includes('CREATE TABLE') && !portfolioContent.includes('ALTER TABLE'));
check('Valuation route not modified (still fixture-only, no live source)',
  !existsSync(VALUATION_ROUTE) || !readFileSync(VALUATION_ROUTE, 'utf8').includes('source=live'));
check('No live KIS endpoint referenced in portfolio page',
  !portfolioContent.includes('/uapi/domestic-stock/v1/quotations') &&
  !portfolioContent.includes('oauth2/tokenP'));
check('No GNews call in portfolio page',
  !portfolioContent.includes('gnews.io') && !portfolioContent.includes('GNEWS_API_KEY'));
check('No drag-and-drop added',
  !portfolioContent.includes('dragstart') && !portfolioContent.includes('dragover'));
check('No /news page created',
  !existsSync(join(root, 'src', 'pages', 'news')));
log('');

// ---------------------------------------------------------------------------
// Group 11: Checker network safety
// ---------------------------------------------------------------------------
log('--- Group 11: Checker network safety ---');

let checkerMadeNetworkCall = false;
try {
  const sentinel = () => { checkerMadeNetworkCall = true; throw new Error('blocked'); };
  globalThis.fetch = sentinel;
} catch {}
check('Checker itself made no network calls', !checkerMadeNetworkCall);
globalThis.fetch = originalFetch;
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3BW-HF1 Portfolio Tab Order Persistence Static Contract — Summary ===');
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
