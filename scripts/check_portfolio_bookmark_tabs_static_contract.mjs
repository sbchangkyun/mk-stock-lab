/**
 * Static contract check for Portfolio Bookmark Tabs & Reorder UX (Phase 3BN).
 * No network calls. No .env reads. Exits non-zero on any failure.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const PORTFOLIO_PAGE = join(root, 'src', 'pages', 'portfolio.astro');
const CSS_PATH = join(root, 'src', 'styles', 'style.css');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3bn_portfolio_bookmark_tabs_reorder_ux_result_v0.1.md');
const HPP_COMPONENT = join(root, 'src', 'components', 'HomePortfolioPanel.astro');
const HOME_MARKET_NEWS = join(root, 'src', 'components', 'HomeMarketNews.astro');
const PACKAGE_JSON = join(root, 'package.json');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Portfolio Bookmark Tabs & Reorder UX Static Contract Check (Phase 3BN) ===');
log('');

const portfolioContent = existsSync(PORTFOLIO_PAGE) ? readFileSync(PORTFOLIO_PAGE, 'utf8') : '';
const cssContent = existsSync(CSS_PATH) ? readFileSync(CSS_PATH, 'utf8') : '';

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

check('Portfolio page exists', existsSync(PORTFOLIO_PAGE));
check('CSS file exists', existsSync(CSS_PATH));
check('Phase 3BN result doc exists', existsSync(RESULT_DOC));
check('HomePortfolioPanel component still present (boundary)', existsSync(HPP_COMPONENT));
check('HomeMarketNews component still present (boundary)', existsSync(HOME_MARKET_NEWS));
check('package.json has check:portfolio-bookmark-tabs script',
  typeof pkg.scripts?.['check:portfolio-bookmark-tabs'] === 'string');
log('');

// ---------------------------------------------------------------------------
// Group 2: Bookmark tab UI markers
// ---------------------------------------------------------------------------
log('--- Group 2: Bookmark tab UI markers ---');

check('portfolio-bookmark-tabs class present in portfolio page',
  portfolioContent.includes('portfolio-bookmark-tabs'));
check('portfolio-bookmark-tab class used in portfolio page',
  portfolioContent.includes('portfolio-bookmark-tab'));
check('portfolio-bookmark-tab--aggregate class used',
  portfolioContent.includes('portfolio-bookmark-tab--aggregate'));
check('portfolio-bookmark-tab--portfolio class used',
  portfolioContent.includes('portfolio-bookmark-tab--portfolio'));
check('portfolio-bookmark-tab--add class used',
  portfolioContent.includes('portfolio-bookmark-tab--add'));
check('portfolio-bookmark-tab--active class used',
  portfolioContent.includes('portfolio-bookmark-tab--active'));
check('portfolio-tab-list class present in page',
  portfolioContent.includes('portfolio-tab-list'));
check('portfolio-tab-item class present in renderPortfolios',
  portfolioContent.includes('portfolio-tab-item'));
log('');

// ---------------------------------------------------------------------------
// Group 3: Aggregate tab (pinned left)
// ---------------------------------------------------------------------------
log('--- Group 3: Aggregate tab pinned left ---');

check('전체 aggregate tab label present (Phase 3BQ: shortened from 전체 포트폴리오)',
  portfolioContent.includes("'전체'") || portfolioContent.includes('"전체"'));
check('aggregatePortfolioId used as aggregate tab data-id',
  portfolioContent.includes('aggregatePortfolioId'));
check('__all_portfolios__ constant still present',
  portfolioContent.includes('__all_portfolios__'));
check('aggregateTab.dataset.action = select present',
  portfolioContent.includes("aggregateTab.dataset.action = 'select'") ||
  portfolioContent.includes('aggregateTab.dataset.action = "select"') ||
  (portfolioContent.includes('aggregateTab') && portfolioContent.includes("action = 'select'")));
check('Aggregate tab has role=tab attribute',
  portfolioContent.includes('aggregateTab') && portfolioContent.includes("'role', 'tab'"));
check('Aggregate tab has aria-selected attribute set',
  portfolioContent.includes("'aria-selected'") && portfolioContent.includes('aggregateTab'));
check('Aggregate tab receives --active class when isAggregateSelected()',
  portfolioContent.includes('isAggregateSelected()') && portfolioContent.includes('portfolio-bookmark-tab--active'));
check('Aggregate default selection preserved (state.selectedPortfolioId = aggregatePortfolioId)',
  portfolioContent.includes('state.selectedPortfolioId = aggregatePortfolioId'));
log('');

// ---------------------------------------------------------------------------
// Group 4: Add tab (Phase 3BQ: inline in tab list, JS-rendered)
// ---------------------------------------------------------------------------
log('--- Group 4: Add tab inline in tab list (Phase 3BQ) ---');

check('Add tab (portfolio-manage-toggle) present as JS-rendered button (Phase 3BQ)',
  portfolioContent.includes("addBtn.id = 'portfolio-manage-toggle'") ||
  portfolioContent.includes('addBtn.id = "portfolio-manage-toggle"') ||
  portfolioContent.includes('id="portfolio-manage-toggle"'));
check('Add tab has portfolio-bookmark-tab--add class',
  portfolioContent.includes('portfolio-bookmark-tab--add'));
check('Add tab opens portfolio sheet (openPortfolioSheet call, Phase 3BS)',
  portfolioContent.includes('openPortfolioSheet'));
check('Add tab has aria-controls pointing to portfolio sheet',
  portfolioContent.includes("'aria-controls', 'portfolio-sheet'") ||
  portfolioContent.includes('"aria-controls", "portfolio-sheet"') ||
  portfolioContent.includes("'portfolio-sheet'") ||
  portfolioContent.includes('aria-controls="portfolio-sheet"') ||
  portfolioContent.includes("aria-controls='portfolio-sheet'"));
check('portfolio-sheet in DOM (add tab target, Phase 3BS)',
  portfolioContent.includes('id="portfolio-sheet"'));
log('');

// ---------------------------------------------------------------------------
// Group 5: User portfolio tab rendering
// ---------------------------------------------------------------------------
log('--- Group 5: User portfolio tab rendering ---');

check('getOrderedPortfolios() still used to render user tabs',
  portfolioContent.includes('getOrderedPortfolios()'));
check('portfolio-tab-item span created for each user portfolio',
  portfolioContent.includes("item.className = 'portfolio-tab-item'") ||
  portfolioContent.includes('item.className = `portfolio-tab-item`') ||
  portfolioContent.includes("'portfolio-tab-item'"));
check('tabBtn.dataset.action = select for user portfolio tabs',
  portfolioContent.includes("tabBtn.dataset.action = 'select'") ||
  portfolioContent.includes('tabBtn.dataset.action = "select"') ||
  (portfolioContent.includes('tabBtn') && portfolioContent.includes("action = 'select'")));
check('portfolio-list id element preserved for JS rendering',
  portfolioContent.includes('id="portfolio-list"'));
check('portfolio-empty id element preserved',
  portfolioContent.includes('id="portfolio-empty"'));
log('');

// ---------------------------------------------------------------------------
// Group 6: Reorder arrow controls
// ---------------------------------------------------------------------------
log('--- Group 6: Reorder arrow controls ---');

check('Left reorder button (portfolio-tab-reorder-btn--left) created',
  portfolioContent.includes('portfolio-tab-reorder-btn--left'));
check('Right reorder button (portfolio-tab-reorder-btn--right) created',
  portfolioContent.includes('portfolio-tab-reorder-btn--right'));
check('Left arrow uses move-portfolio-up action',
  portfolioContent.includes("'move-portfolio-up'") ||
  portfolioContent.includes('"move-portfolio-up"'));
check('Right arrow uses move-portfolio-down action',
  portfolioContent.includes("'move-portfolio-down'") ||
  portfolioContent.includes('"move-portfolio-down"'));
check('Left arrow has aria-label for accessibility',
  portfolioContent.includes('왼쪽으로 이동'));
check('Right arrow has aria-label for accessibility',
  portfolioContent.includes('오른쪽으로 이동'));
check('Left arrow text content is left arrow character',
  portfolioContent.includes("leftBtn.textContent = '‹'") ||
  portfolioContent.includes('leftBtn.textContent = "‹"'));
check('Right arrow text content is right arrow character',
  portfolioContent.includes("rightBtn.textContent = '›'") ||
  portfolioContent.includes('rightBtn.textContent = "›"'));
log('');

// ---------------------------------------------------------------------------
// Group 7: Boundary rules
// ---------------------------------------------------------------------------
log('--- Group 7: Boundary rules ---');

check('First user portfolio tab left arrow disabled (isFirst check)',
  portfolioContent.includes('leftBtn.disabled = isFirst'));
check('Last user portfolio tab right arrow disabled (isLast check)',
  portfolioContent.includes('rightBtn.disabled = isLast'));
check('isFirst/isLast derived from index and ordered.length',
  portfolioContent.includes('const isFirst = index === 0') ||
  portfolioContent.includes('isFirst = index === 0'));
check('isLast uses ordered.length - 1',
  portfolioContent.includes('ordered.length - 1') || portfolioContent.includes('ordered.length-1'));
check('Aggregate tab cannot move (no move-portfolio-up on aggregatePortfolioId)',
  portfolioContent.includes('isAggregatePortfolioId(id)'));
check('Reorder swaps one slot at a time (index swap in portfolioOrder)',
  portfolioContent.includes('[ordered[index], ordered[nextIndex]]') ||
  portfolioContent.includes('ordered[index], ordered[nextIndex]'));
log('');

// ---------------------------------------------------------------------------
// Group 8: Active tab behavior
// ---------------------------------------------------------------------------
log('--- Group 8: Active tab behavior ---');

check('Active state persists after reorder (state.selectedPortfolioId preserved)',
  portfolioContent.includes('state.selectedPortfolioId'));
check('Clicking tab sets state.selectedPortfolioId',
  portfolioContent.includes("state.selectedPortfolioId = id"));
check('renderAll() called after reorder to update active state',
  portfolioContent.includes('renderPortfolios()'));
log('');

// ---------------------------------------------------------------------------
// Group 9: CSS styles
// ---------------------------------------------------------------------------
log('--- Group 9: CSS styles ---');

check('CSS .portfolio-bookmark-tabs defined',
  cssContent.includes('.portfolio-bookmark-tabs'));
check('CSS .portfolio-bookmark-tab defined',
  cssContent.includes('.portfolio-bookmark-tab {') || cssContent.includes('.portfolio-bookmark-tab\n'));
check('CSS .portfolio-bookmark-tab--active defined',
  cssContent.includes('.portfolio-bookmark-tab--active'));
check('CSS .portfolio-bookmark-tab--aggregate defined',
  cssContent.includes('.portfolio-bookmark-tab--aggregate'));
check('CSS .portfolio-bookmark-tab--add defined',
  cssContent.includes('.portfolio-bookmark-tab--add'));
check('CSS .portfolio-tab-item defined',
  cssContent.includes('.portfolio-tab-item'));
check('CSS .portfolio-tab-reorder-btn defined',
  cssContent.includes('.portfolio-tab-reorder-btn'));
check('CSS reorder btn hidden by default (opacity: 0)',
  cssContent.includes('.portfolio-tab-reorder-btn') && cssContent.includes('opacity: 0'));
check('CSS reorder btn visible on hover/focus-within',
  cssContent.includes('.portfolio-tab-item:hover .portfolio-tab-reorder-btn') ||
  cssContent.includes('.portfolio-tab-item:focus-within .portfolio-tab-reorder-btn'));
check('CSS .portfolio-tab-inline-action defined',
  cssContent.includes('.portfolio-tab-inline-action'));
check('CSS focus-visible style defined for tab accessibility',
  cssContent.includes('.portfolio-bookmark-tab:focus-visible') ||
  cssContent.includes('.portfolio-tab-reorder-btn:focus-visible'));
check('CSS disabled arrow style defined',
  cssContent.includes('.portfolio-tab-reorder-btn:disabled'));
check('CSS mobile/touch responsive behavior (@media hover: none)',
  cssContent.includes('@media (hover: none)') ||
  cssContent.includes('hover: none'));
check('CSS tab list supports horizontal scroll on narrow screens',
  cssContent.includes('overflow-x: auto') && cssContent.includes('portfolio-bookmark-tabs'));
log('');

// ---------------------------------------------------------------------------
// Group 10: Non-goals (what must NOT be present)
// ---------------------------------------------------------------------------
log('--- Group 10: Non-goals not implemented ---');

check('No drag-and-drop library reference (dragstart event)',
  !portfolioContent.includes('dragstart') && !portfolioContent.includes('dragover'));
check('No drag-and-drop library import',
  !portfolioContent.includes('SortableJS') &&
  !portfolioContent.toLowerCase().includes('import.*sortable') &&
  !portfolioContent.includes("from 'sortable") &&
  !portfolioContent.includes('from "sortable') &&
  !portfolioContent.includes('draggable="true"'));
check('No new localStorage tab-order key added',
  !portfolioContent.includes('portfolioTabOrder') &&
  !portfolioContent.includes('portfolio-tab-order'));
check('No new modal/slide-over creation UI (no modal class)',
  !portfolioContent.includes('class="modal') && !portfolioContent.includes("class='modal") &&
  !portfolioContent.includes('class="slide-over') && !portfolioContent.includes("class='slide-over"));
check('No /news page created',
  !existsSync(join(root, 'src', 'pages', 'news')));
check('No KIS OAuth token endpoint referenced',
  !portfolioContent.includes('oauth2/tokenP'));
check('No KIS live quote endpoint referenced',
  !portfolioContent.includes('/uapi/domestic-stock/v1/quotations'));
check('No GNews live call in portfolio page',
  !portfolioContent.includes('gnews.io') && !portfolioContent.includes('GNEWS_API_KEY'));
check('No DB/migration SQL in portfolio page',
  !portfolioContent.includes('CREATE TABLE') && !portfolioContent.includes('ALTER TABLE'));
log('');

// ---------------------------------------------------------------------------
// Group 11: Phase 3BM invariants preserved
// ---------------------------------------------------------------------------
log('--- Group 11: Phase 3BM invariants preserved ---');

check('Debug status chips removed (portfolio-status-bar absent)',
  !portfolioContent.includes('portfolio-status-bar'));
check('Debug status chips removed (status-pill absent)',
  !portfolioContent.includes('status-pill'));
check('Refresh button from 3BM still present',
  portfolioContent.includes('id="portfolio-refresh"'));
check('Refresh button accessible label preserved',
  portfolioContent.includes('현재 포트폴리오 다시 계산'));
check('portfolio-sheet present (replaced portfolio-manage-panel, Phase 3BS)',
  portfolioContent.includes('id="portfolio-sheet"'));
check('portfolio-detail dashboard class still present',
  portfolioContent.includes('portfolio-detail') && portfolioContent.includes('portfolio-dashboard'));
check('Portfolio form elements in DOM (portfolio-form)',
  portfolioContent.includes('id="portfolio-form"'));
check('portfolio-readiness loading state element still present',
  portfolioContent.includes('id="portfolio-readiness"'));
log('');

// ---------------------------------------------------------------------------
// Group 12: Boundary isolation
// ---------------------------------------------------------------------------
log('--- Group 12: Boundary isolation ---');

check('HomePortfolioPanel component still exists', existsSync(HPP_COMPONENT));
check('HomeMarketNews component still exists', existsSync(HOME_MARKET_NEWS));

const indexContent = existsSync(join(root, 'src', 'pages', 'index.astro'))
  ? readFileSync(join(root, 'src', 'pages', 'index.astro'), 'utf8') : '';
check('Home page still imports HomePortfolioPanel',
  indexContent.includes('HomePortfolioPanel'));
check('Home page still imports HomeMarketNews',
  indexContent.includes('HomeMarketNews'));
check('No /news page created',
  !existsSync(join(root, 'src', 'pages', 'news')));
check('No supabaseAdmin imported in portfolio page',
  !portfolioContent.includes('supabaseAdmin'));
check('No external ad scripts in portfolio page',
  !portfolioContent.includes('googletagmanager') && !portfolioContent.includes('doubleclick'));
log('');

// ---------------------------------------------------------------------------
// Group 13: Network safety guard
// ---------------------------------------------------------------------------
log('--- Group 13: Checker network safety ---');

const originalFetch = globalThis.fetch;
let checkerMadeFetch = false;
globalThis.fetch = () => { checkerMadeFetch = true; throw new Error('fetch blocked'); };
check('Checker itself makes no network calls', !checkerMadeFetch);
globalThis.fetch = originalFetch;
log('');

// ---------------------------------------------------------------------------
// Group 14: Phase 3BQ — owner review fixes
// ---------------------------------------------------------------------------
log('--- Group 14: Phase 3BQ owner review fixes ---');

check('Refresh button inline with h1 (portfolio-h1-row)',
  portfolioContent.includes('portfolio-h1-row') || portfolioContent.includes("class=\"portfolio-h1-row\""));
check('CSS .portfolio-h1-row defined',
  cssContent.includes('.portfolio-h1-row'));
check('Aggregate tab label shortened to 전체',
  portfolioContent.includes("'전체'") || portfolioContent.includes('"전체"'));
check('Aggregate tab label textContent is NOT 전체 포트폴리오 (old tab label removed)',
  !portfolioContent.includes("aggregateTab.textContent = '전체 포트폴리오'") &&
  !portfolioContent.includes('aggregateTab.textContent = "전체 포트폴리오"'));
check('Floating mini toolbar element created (portfolio-tab-floating-actions)',
  portfolioContent.includes('portfolio-tab-floating-actions'));
check('portfolio-tab-main element created for tab main row',
  portfolioContent.includes('portfolio-tab-main'));
check('CSS .portfolio-tab-floating-actions defined',
  cssContent.includes('.portfolio-tab-floating-actions'));
check('CSS .portfolio-tab-main defined',
  cssContent.includes('.portfolio-tab-main'));
check('CSS floating actions hidden by default (opacity: 0)',
  cssContent.includes('.portfolio-tab-floating-actions') &&
  (() => {
    const idx = cssContent.indexOf('.portfolio-tab-floating-actions');
    const block = cssContent.slice(idx, idx + 300);
    return block.includes('opacity: 0');
  })());
check('CSS floating actions shown on hover/focus-within',
  cssContent.includes('.portfolio-tab-item:hover .portfolio-tab-floating-actions') ||
  cssContent.includes('.portfolio-tab-item:focus-within .portfolio-tab-floating-actions'));
check('CSS overflow-y: hidden on bookmark tabs (no vertical scrollbar)',
  cssContent.includes('.portfolio-bookmark-tabs') &&
  cssContent.includes('overflow-y: hidden'));
check('CSS portfolio-tab-list align-items: flex-end (aggregate/add align to bottom)',
  cssContent.includes('align-items: flex-end'));
check('CSS .portfolio-bookmark-tab--add has no margin-left: auto (inline, not pinned right)',
  (() => {
    const addIdx = cssContent.indexOf('.portfolio-bookmark-tab--add');
    if (addIdx === -1) return false;
    const blockEnd = cssContent.indexOf('}', addIdx);
    const block = cssContent.slice(addIdx, blockEnd);
    return !block.includes('margin-left: auto');
  })());
check('toggle-manage-panel action handled in #portfolio-list click delegation',
  portfolioContent.includes("'toggle-manage-panel'") || portfolioContent.includes('"toggle-manage-panel"'));
check('Static portfolio-manage-toggle button removed from HTML',
  !portfolioContent.includes('<button class="portfolio-bookmark-tab portfolio-bookmark-tab--add" id="portfolio-manage-toggle"'));
check('Dead standalone portfolio-manage-toggle addEventListener removed',
  !portfolioContent.includes("getElement<HTMLButtonElement>('portfolio-manage-toggle')?.addEventListener"));
check('Phase 3BQ result doc exists',
  existsSync(join(root, 'docs', 'planning', 'phase_3bq_portfolio_bookmark_tabs_owner_review_fixes_result_v0.1.md')));
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3BN / 3BQ Portfolio Bookmark Tabs Static Contract — Summary ===');
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
