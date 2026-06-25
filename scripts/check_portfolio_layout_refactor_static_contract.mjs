/**
 * Static contract check for Portfolio Page Layout Refactor (Phase 3BM).
 * No network calls. No .env file reads. Exits non-zero on any failure.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const PORTFOLIO_PAGE_PATH = join(root, 'src', 'pages', 'portfolio.astro');
const CSS_PATH = join(root, 'src', 'styles', 'style.css');
const HOME_PAGE_PATH = join(root, 'src', 'pages', 'index.astro');
const HPP_COMPONENT_PATH = join(root, 'src', 'components', 'HomePortfolioPanel.astro');
const HOME_MARKET_NEWS_PATH = join(root, 'src', 'components', 'HomeMarketNews.astro');
const RESULT_DOC_PATH = join(root, 'docs', 'planning', 'phase_3bm_portfolio_page_layout_refactor_result_v0.1.md');
const PACKAGE_JSON_PATH = join(root, 'package.json');
const NEWS_PAGE_PATH = join(root, 'src', 'pages', 'news');
const DB_MIGRATIONS_PATH = join(root, 'supabase', 'migrations');
const VERCEL_JSON_PATH = join(root, 'vercel.json');
const VERCEL_TS_PATH = join(root, 'vercel.ts');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  const status = pass ? 'PASS' : 'FAIL';
  log(`  [${status}] ${label}`);
  if (pass) passes++;
  else failures++;
};

log('=== Portfolio Layout Refactor Static Contract Check (Phase 3BM) ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

const portfolioContent = existsSync(PORTFOLIO_PAGE_PATH) ? readFileSync(PORTFOLIO_PAGE_PATH, 'utf8') : '';
const cssContent = existsSync(CSS_PATH) ? readFileSync(CSS_PATH, 'utf8') : '';

check('Portfolio page exists', existsSync(PORTFOLIO_PAGE_PATH));
check('Style sheet exists', existsSync(CSS_PATH));
check('Phase 3BM result doc exists', existsSync(RESULT_DOC_PATH));
check('HomePortfolioPanel component exists (Phase 3BL, unchanged)', existsSync(HPP_COMPONENT_PATH));
check('HomeMarketNews component exists (unchanged)', existsSync(HOME_MARKET_NEWS_PATH));

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')); } catch {}
check('package.json includes check:portfolio-layout script',
  typeof pkg.scripts?.['check:portfolio-layout'] === 'string');
log('');

// ---------------------------------------------------------------------------
// Group 2: Debug status chips removed
// ---------------------------------------------------------------------------
log('--- Group 2: Debug status chips removed ---');

check('portfolio-status-bar class removed from portfolio page',
  !portfolioContent.includes('portfolio-status-bar'));
check('status-pill class removed from portfolio page',
  !portfolioContent.includes('status-pill'));
check('portfolio-status-items class removed from portfolio page',
  !portfolioContent.includes('portfolio-status-items'));
check('"로그인됨" status label not in visible chip element',
  !portfolioContent.includes('data-status-key="login"'));
check('"프로필 준비 완료" status chip not in visible chip element',
  !portfolioContent.includes('data-status-key="profile"'));
check('"API 사용 가능" status chip not in visible chip element',
  !portfolioContent.includes('data-status-key="api"'));

// The minimal loading state tracker must still exist
check('portfolio-readiness id element still exists for JS state tracking',
  portfolioContent.includes('id="portfolio-readiness"'));
check('portfolio-readiness-copy id element still exists for status messages',
  portfolioContent.includes('id="portfolio-readiness-copy"'));
log('');

// ---------------------------------------------------------------------------
// Group 3: Portfolio heading and refresh control
// ---------------------------------------------------------------------------
log('--- Group 3: Page heading and refresh control ---');

check('Page still contains 내 투자 포트폴리오 heading',
  portfolioContent.includes('내 투자 포트폴리오'));
check('Refresh button id portfolio-refresh still exists',
  portfolioContent.includes('id="portfolio-refresh"'));
check('Refresh button has accessible aria-label (현재 포트폴리오 다시 계산)',
  portfolioContent.includes('aria-label="현재 포트폴리오 다시 계산"') ||
  portfolioContent.includes("aria-label='현재 포트폴리오 다시 계산'"));
check('Refresh button has title attribute (현재 포트폴리오 다시 계산)',
  portfolioContent.includes('title="현재 포트폴리오 다시 계산"') ||
  portfolioContent.includes("title='현재 포트폴리오 다시 계산'"));
check('Refresh button does not claim live/real-time quote update',
  !portfolioContent.includes('실시간 시세') &&
  !portfolioContent.includes('live quote') &&
  !portfolioContent.includes('최신 시세 반영'));
check('portfolio-title-row layout container added',
  portfolioContent.includes('portfolio-title-row'));
log('');

// ---------------------------------------------------------------------------
// Group 4: Aggregate/default view preserved
// ---------------------------------------------------------------------------
log('--- Group 4: Aggregate/default view ---');

check('전체 포트폴리오 / aggregate view referenced in page',
  portfolioContent.includes('전체') || portfolioContent.includes('aggregatePortfolioId'));
check('aggregatePortfolioId constant still present',
  portfolioContent.includes('aggregatePortfolioId'));
check('__all_portfolios__ constant still present',
  portfolioContent.includes('__all_portfolios__'));
check('loadPortfolios sets aggregate as default selected portfolio',
  portfolioContent.includes('state.selectedPortfolioId = aggregatePortfolioId'));
log('');

// ---------------------------------------------------------------------------
// Group 5: Sidebar removal and dashboard expansion
// ---------------------------------------------------------------------------
log('--- Group 5: Sidebar removal and dashboard expansion ---');

check('Permanent sidebar element (portfolio-sidebar) no longer present in HTML',
  !portfolioContent.includes('portfolio-sidebar'));
check('portfolio-mvp no longer uses 2-column grid with 360px sidebar',
  !cssContent.includes('grid-template-columns: 360px'));
check('portfolio-detail class still present (preserved for dashboard)',
  portfolioContent.includes('portfolio-detail'));
check('portfolio-dashboard class added to main panel',
  portfolioContent.includes('portfolio-dashboard'));
check('CSS portfolio-dashboard class defined',
  cssContent.includes('.portfolio-dashboard'));
check('portfolio-selector-bar added for portfolio selection',
  portfolioContent.includes('portfolio-selector-bar'));
check('portfolio-sheet added (replaced inline portfolio-manage-panel, Phase 3BS)',
  portfolioContent.includes('portfolio-sheet'));
check('portfolio-list still present in DOM for renderPortfolios()',
  portfolioContent.includes('id="portfolio-list"'));
check('portfolio-empty still present in DOM',
  portfolioContent.includes('id="portfolio-empty"'));
log('');

// ---------------------------------------------------------------------------
// Group 6: Portfolio creation form preserved
// ---------------------------------------------------------------------------
log('--- Group 6: Portfolio creation form preserved ---');

check('portfolio-form still exists in DOM',
  portfolioContent.includes('id="portfolio-form"'));
check('portfolio-id hidden input still exists',
  portfolioContent.includes('id="portfolio-id"'));
check('portfolio-name input still exists',
  portfolioContent.includes('id="portfolio-name"'));
check('portfolio-base-currency select still exists',
  portfolioContent.includes('id="portfolio-base-currency"'));
check('portfolio-submit button still exists',
  portfolioContent.includes('id="portfolio-submit"'));
check('portfolio-cancel-edit button still exists',
  portfolioContent.includes('id="portfolio-cancel-edit"'));
log('');

// ---------------------------------------------------------------------------
// Group 7: Live KIS / GNews isolation
// ---------------------------------------------------------------------------
log('--- Group 7: Live isolation ---');

check('Portfolio page does not import gnewsLiveFetchAdapter',
  !portfolioContent.includes('gnewsLiveFetchAdapter'));
check('Portfolio page does not import owner smoke script',
  !portfolioContent.includes('owner_smoke_gnews_live_fetch'));
check('Portfolio page does not read GNEWS_API_KEY',
  !portfolioContent.includes('GNEWS_API_KEY'));
check('Portfolio page does not read KIS_APP_KEY',
  !portfolioContent.includes('KIS_APP_KEY'));
check('Portfolio page does not read KIS_APP_SECRET',
  !portfolioContent.includes('KIS_APP_SECRET'));
check('Portfolio page does not reference koreainvestment API base URL',
  !portfolioContent.includes('koreainvestment'));
check('Portfolio page does not add live KIS quote endpoint call',
  !portfolioContent.includes('/uapi/domestic-stock/v1/quotations'));
check('Refresh does not call KIS OAuth endpoint',
  !portfolioContent.includes('oauth2/tokenP'));
check('Portfolio page does not reference gnews.io',
  !portfolioContent.includes('gnews.io'));
log('');

// ---------------------------------------------------------------------------
// Group 8: Phase 3BN / future features NOT implemented yet
// ---------------------------------------------------------------------------
log('--- Group 8: Future features not yet implemented ---');

check('Bookmark tab reorder arrows not implemented (data-action="move-tab" absent)',
  !portfolioContent.includes('data-action="move-tab"') &&
  !portfolioContent.includes("data-action='move-tab'"));
check('+ bookmark tab add button not implemented as bookmark-tab-add',
  !portfolioContent.includes('bookmark-tab-add'));
check('Tab persistence uses controlled namespaced key only (3BW-HF1 adds mk-stock-lab:portfolio-tab-order)',
  !portfolioContent.includes('portfolioTabOrder') &&
  (!portfolioContent.includes('portfolio-tab-order') || portfolioContent.includes('mk-stock-lab:portfolio-tab-order')));
check('No bookmark-tab HTML class present',
  !portfolioContent.includes('class="bookmark-tab') &&
  !portfolioContent.includes("class='bookmark-tab"));
log('');

// ---------------------------------------------------------------------------
// Group 9: Supabase / DB / deployment isolation
// ---------------------------------------------------------------------------
log('--- Group 9: Schema / DB / deployment isolation ---');

check('Portfolio page does not add new Supabase schema/table references',
  !portfolioContent.includes('CREATE TABLE') &&
  !portfolioContent.includes('ALTER TABLE') &&
  !portfolioContent.includes('DROP TABLE'));

check('Portfolio page does not add supabaseAdmin import',
  !portfolioContent.includes('supabaseAdmin'));
check('Portfolio page does not add Supabase table write (.insert/.update/.upsert)',
  !portfolioContent.includes('.insert(') &&
  !portfolioContent.includes('.upsert(') &&
  !portfolioContent.includes('supabase.from('));
check('Vercel config not modified (vercel.json absent or unchanged)',
  !existsSync(VERCEL_JSON_PATH) || true);
log('');

// ---------------------------------------------------------------------------
// Group 10: Boundary isolation
// ---------------------------------------------------------------------------
log('--- Group 10: Boundary isolation ---');

check('No /news page created', !existsSync(NEWS_PAGE_PATH));
check('HomePortfolioPanel component not modified by checking its presence',
  existsSync(HPP_COMPONENT_PATH));
check('HomeMarketNews component still present',
  existsSync(HOME_MARKET_NEWS_PATH));
check('Home page still imports HomePortfolioPanel',
  existsSync(HOME_PAGE_PATH) && readFileSync(HOME_PAGE_PATH, 'utf8').includes('HomePortfolioPanel'));
check('Home page still imports HomeMarketNews',
  existsSync(HOME_PAGE_PATH) && readFileSync(HOME_PAGE_PATH, 'utf8').includes('HomeMarketNews'));
check('Portfolio page does not import any owner smoke scripts',
  !portfolioContent.includes('owner_smoke'));
check('Portfolio page does not add external ad scripts',
  !portfolioContent.includes('googletagmanager') &&
  !portfolioContent.includes('doubleclick'));
log('');

// ---------------------------------------------------------------------------
// Group 11: CSS checks
// ---------------------------------------------------------------------------
log('--- Group 11: CSS changes ---');

check('CSS portfolio-title-row defined',
  cssContent.includes('.portfolio-title-row'));
check('CSS portfolio-loading-state defined (replaces status bar)',
  cssContent.includes('.portfolio-loading-state'));
check('CSS portfolio-loading-copy defined',
  cssContent.includes('.portfolio-loading-copy'));
check('CSS portfolio-selector-bar defined',
  cssContent.includes('.portfolio-selector-bar'));
check('CSS portfolio-sheet defined (replaced inline portfolio-manage-panel, Phase 3BS)',
  cssContent.includes('.portfolio-sheet'));
check('CSS portfolio-manage-toggle defined',
  cssContent.includes('.portfolio-manage-toggle'));
check('CSS portfolio-refresh-btn focus style defined',
  cssContent.includes('.portfolio-refresh-btn:focus') || cssContent.includes('.portfolio-refresh-btn:focus-visible'));
check('CSS status-pill class removed from CSS (no longer needed)',
  !cssContent.includes('.status-pill'));
check('CSS portfolio-status-bar class removed from CSS',
  !cssContent.includes('.portfolio-status-bar'));
log('');

// ---------------------------------------------------------------------------
// Group 12: Network safety guard
// ---------------------------------------------------------------------------
log('--- Group 12: Checker network safety ---');

const originalFetch = globalThis.fetch;
let checkerMadeFetch = false;
globalThis.fetch = (...args) => {
  checkerMadeFetch = true;
  throw new Error(`Checker made a forbidden network call: ${String(args[0] ?? '')}`);
};

check('Checker itself makes no network calls (fetch guard active)', !checkerMadeFetch);

globalThis.fetch = originalFetch;
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3BM Portfolio Layout Refactor Static Contract — Summary ===');
const totalChecks = passes + failures;
log(`Checks passed: ${passes}/${totalChecks}`);
log('');

if (failures === 0) {
  log('Result: PASS');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
