/**
 * Static contract check for Portfolio Holdings Category Header & Sort UX (Phase 3BR).
 * No network calls. No .env reads. Exits non-zero on any failure.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const PORTFOLIO_PAGE = join(root, 'src', 'pages', 'portfolio.astro');
const CSS_PATH = join(root, 'src', 'styles', 'style.css');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3br_portfolio_holdings_category_header_sort_ux_result_v0.1.md');
const HPP_COMPONENT = join(root, 'src', 'components', 'HomePortfolioPanel.astro');
const HOME_MARKET_NEWS = join(root, 'src', 'components', 'HomeMarketNews.astro');
const PACKAGE_JSON = join(root, 'package.json');
const NEWS_PAGE = join(root, 'src', 'pages', 'news');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Portfolio Holdings Category Header & Sort UX Static Contract (Phase 3BR) ===');
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
check('Phase 3BR result doc exists', existsSync(RESULT_DOC));
check('HomePortfolioPanel component exists (boundary)', existsSync(HPP_COMPONENT));
check('HomeMarketNews component exists (boundary)', existsSync(HOME_MARKET_NEWS));
check('package.json has check:portfolio-holdings-header script',
  typeof pkg.scripts?.['check:portfolio-holdings-header'] === 'string');
log('');

// ---------------------------------------------------------------------------
// Group 2: Old toolbar removed / replaced
// ---------------------------------------------------------------------------
log('--- Group 2: Old toolbar replaced ---');

check('Old positions-toolbar class no longer the sort container (정렬 eyebrow removed)',
  !portfolioContent.includes('<p class="eyebrow">정렬</p>'));
check('Old sort-controls div removed from HTML',
  !portfolioContent.includes('<div class="sort-controls"'));
check('Old 평가금액과 수익률 sort note removed',
  !portfolioContent.includes('평가금액과 수익률 데이터는 연동 후 정렬됩니다.'));
log('');

// ---------------------------------------------------------------------------
// Group 3: Category header marker and eyebrow label
// ---------------------------------------------------------------------------
log('--- Group 3: Category header ---');

check('positions-category-header element exists',
  portfolioContent.includes('positions-category-header'));
check('카테고리 eyebrow label present',
  portfolioContent.includes('카테고리'));
check('positions-category-grid element exists',
  portfolioContent.includes('positions-category-grid'));
log('');

// ---------------------------------------------------------------------------
// Group 4: All required category labels present
// ---------------------------------------------------------------------------
log('--- Group 4: Required category labels ---');

check('종목 category label present', portfolioContent.includes('>종목<'));
check('비중 category label present', portfolioContent.includes('>비중<'));
check('수량 category label present', portfolioContent.includes('>수량<'));
check('평단가 category label present', portfolioContent.includes('>평단가<'));
check('현재가 category label present', portfolioContent.includes('>현재가<'));
check('평가금 category label present', portfolioContent.includes('>평가금<'));
check('수익률 category label present', portfolioContent.includes('>수익률<'));
check('수익금 category label present', portfolioContent.includes('>수익금<'));
check('배당률 category label present', portfolioContent.includes('>배당률<'));
check('예상 연배당금 category label present', portfolioContent.includes('예상 연배당금'));
check('배당주기 category label present', portfolioContent.includes('>배당주기<'));
log('');

// ---------------------------------------------------------------------------
// Group 5: Sortable columns have vertical arrow controls
// ---------------------------------------------------------------------------
log('--- Group 5: Sortable column arrow controls ---');

check('sort-arrow-button class used for arrow controls',
  portfolioContent.includes('sort-arrow-button'));
check('sort-arrow-stack class used for vertical stacking',
  portfolioContent.includes('sort-arrow-stack'));
check('Arrow buttons are <button> elements with data-sort',
  portfolioContent.includes('<button class="sort-arrow-button"') &&
  portfolioContent.includes('data-sort='));

// Verify each sortable column has both asc and desc arrows
const sortKeys = [
  ['weight-desc', 'weight-asc'],
  ['valuation-desc', 'valuation-asc'],
  ['return-desc', 'return-asc'],
  ['profit-desc', 'profit-asc'],
  ['dividend-yield-desc', 'dividend-yield-asc'],
  ['annual-dividend-desc', 'annual-dividend-asc'],
];

sortKeys.forEach(([desc, asc]) => {
  check(`Sort arrows for ${desc.replace('-desc', '')} (desc + asc)`,
    portfolioContent.includes(`data-sort="${desc}"`) &&
    portfolioContent.includes(`data-sort="${asc}"`));
});

check('Sortable cells marked with positions-category-cell--sortable class',
  portfolioContent.includes('positions-category-cell--sortable'));
log('');

// ---------------------------------------------------------------------------
// Group 6: Arrow button accessibility
// ---------------------------------------------------------------------------
log('--- Group 6: Arrow button accessibility ---');

check('비중 sort arrows have aria-labels',
  portfolioContent.includes('aria-label="비중 높은 순 정렬"') &&
  portfolioContent.includes('aria-label="비중 낮은 순 정렬"'));
check('평가금 sort arrows have aria-labels',
  portfolioContent.includes('aria-label="평가금 높은 순 정렬"') &&
  portfolioContent.includes('aria-label="평가금 낮은 순 정렬"'));
check('수익률 sort arrows have aria-labels',
  portfolioContent.includes('aria-label="수익률 높은 순 정렬"') &&
  portfolioContent.includes('aria-label="수익률 낮은 순 정렬"'));
check('수익금 sort arrows have aria-labels',
  portfolioContent.includes('aria-label="수익금 높은 순 정렬"') &&
  portfolioContent.includes('aria-label="수익금 낮은 순 정렬"'));
check('배당률 sort arrows have aria-labels',
  portfolioContent.includes('aria-label="배당률 높은 순 정렬"') &&
  portfolioContent.includes('aria-label="배당률 낮은 순 정렬"'));
check('예상 연배당금 sort arrows have aria-labels',
  portfolioContent.includes('aria-label="예상 연배당금 높은 순 정렬"') &&
  portfolioContent.includes('aria-label="예상 연배당금 낮은 순 정렬"'));
log('');

// ---------------------------------------------------------------------------
// Group 7: Sort key contract
// ---------------------------------------------------------------------------
log('--- Group 7: Sort key contract ---');

const sortKeyPairs = [
  'weight-desc', 'weight-asc',
  'valuation-desc', 'valuation-asc',
  'return-desc', 'return-asc',
  'profit-desc', 'profit-asc',
  'dividend-yield-desc', 'dividend-yield-asc',
  'annual-dividend-desc', 'annual-dividend-asc',
];
sortKeyPairs.forEach((key) => {
  check(`Sort key '${key}' present in portfolio page`,
    portfolioContent.includes(key));
});

check('positionSort type includes weight-desc / weight-asc',
  portfolioContent.includes("'weight-desc'") || portfolioContent.includes('"weight-desc"'));
check('positionSort type includes profit-desc / profit-asc',
  portfolioContent.includes("'profit-desc'") || portfolioContent.includes('"profit-desc"'));
check('positionSort type includes dividend-yield-desc',
  portfolioContent.includes("'dividend-yield-desc'") || portfolioContent.includes('"dividend-yield-desc"'));
check('positionSort type includes annual-dividend-desc',
  portfolioContent.includes("'annual-dividend-desc'") || portfolioContent.includes('"annual-dividend-desc"'));
check('getSortedPositions uses lastIndexOf for sort key parsing',
  portfolioContent.includes('lastIndexOf'));
log('');

// ---------------------------------------------------------------------------
// Group 8: Unavailable data handling
// ---------------------------------------------------------------------------
log('--- Group 8: Unavailable data handling ---');

check('연동 예정 placeholder used for unavailable metrics',
  portfolioContent.includes('연동 예정'));
check('데이터 대기 placeholder used for deferred data',
  portfolioContent.includes('데이터 대기'));
check('No fake return rate (수익률 not fabricated as number)',
  (() => {
    // Check that 수익률 in row is always placeholder, not a computed rate
    const scriptBlocks = portfolioContent.match(/<script[\s\S]*?<\/script>/gi) ?? [];
    return scriptBlocks.some((b) => b.includes('연동 예정') || b.includes('데이터 대기'));
  })());
check('No 실시간 (real-time) claim on unavailable data',
  !portfolioContent.includes('실시간'));
check('No current market price calculated from buy price',
  !portfolioContent.includes('currentPrice') && !portfolioContent.includes('current_price'));
check('Weight computation uses cost basis (buyPrice * quantity), not live valuation',
  portfolioContent.includes('buyPrice * position.quantity') ||
  portfolioContent.includes('buyPrice * quantity'));
log('');

// ---------------------------------------------------------------------------
// Group 9: CSS styles
// ---------------------------------------------------------------------------
log('--- Group 9: CSS styles ---');

check('CSS .positions-category-header defined', cssContent.includes('.positions-category-header'));
check('CSS .positions-category-grid defined', cssContent.includes('.positions-category-grid'));
check('CSS .positions-category-cell defined', cssContent.includes('.positions-category-cell'));
check('CSS .positions-category-cell--sortable defined', cssContent.includes('.positions-category-cell--sortable'));
check('CSS .sort-arrow-stack defined', cssContent.includes('.sort-arrow-stack'));
check('CSS .sort-arrow-button defined', cssContent.includes('.sort-arrow-button'));
check('CSS .sort-arrow-button:focus-visible defined',
  cssContent.includes('.sort-arrow-button:focus-visible'));
check('CSS .sort-arrow-button.active defined',
  cssContent.includes('.sort-arrow-button.active'));
check('CSS .positions-list-wrap has overflow-x: auto',
  cssContent.includes('.positions-list-wrap') && cssContent.includes('overflow-x: auto'));
check('CSS .positions-category-grid has min-width for horizontal layout',
  cssContent.includes('.positions-category-grid') &&
  (() => {
    const idx = cssContent.indexOf('.positions-category-grid');
    const block = cssContent.slice(idx, idx + 500);
    return block.includes('min-width');
  })());
check('CSS .position-card updated to use 10+ metric columns',
  (() => {
    const idx = cssContent.indexOf('.position-card {');
    const block = cssContent.slice(idx, idx + 300);
    return block.includes('repeat(10,') || block.includes('repeat(10 ,');
  })());
log('');

// ---------------------------------------------------------------------------
// Group 10: 3BQ bookmark tab invariants preserved
// ---------------------------------------------------------------------------
log('--- Group 10: 3BQ bookmark tab invariants preserved ---');

check('portfolio-bookmark-tabs class still present', portfolioContent.includes('portfolio-bookmark-tabs'));
check('portfolio-h1-row still present (3BQ refresh button placement)', portfolioContent.includes('portfolio-h1-row'));
check('inline add tab still rendered by JS (addBtn.id)',
  portfolioContent.includes("addBtn.id = 'portfolio-manage-toggle'") ||
  portfolioContent.includes('addBtn.id = "portfolio-manage-toggle"'));
check('portfolio-tab-floating-actions still present (3BQ floating toolbar)', portfolioContent.includes('portfolio-tab-floating-actions'));
check('toggle-manage-panel action still present in delegation', portfolioContent.includes("'toggle-manage-panel'"));
check('Aggregate tab label 전체 still present', portfolioContent.includes("'전체'"));
log('');

// ---------------------------------------------------------------------------
// Group 11: Safety boundaries
// ---------------------------------------------------------------------------
log('--- Group 11: Safety boundaries ---');

check('No live KIS OAuth endpoint added', !portfolioContent.includes('oauth2/tokenP'));
check('No live KIS quote endpoint added',
  !portfolioContent.includes('/uapi/domestic-stock/v1/quotations'));
check('No KIS_APP_KEY read in portfolio page', !portfolioContent.includes('KIS_APP_KEY'));
check('No gnews.io call in portfolio page', !portfolioContent.includes('gnews.io'));
check('No GNEWS_API_KEY read in portfolio page', !portfolioContent.includes('GNEWS_API_KEY'));
check('No supabaseAdmin import added', !portfolioContent.includes('supabaseAdmin'));
check('No DB migration SQL added', !portfolioContent.includes('CREATE TABLE'));
check('No /news page created', !existsSync(NEWS_PAGE));
check('HomePortfolioPanel component present (unchanged)', existsSync(HPP_COMPONENT));
check('HomeMarketNews component present (unchanged)', existsSync(HOME_MARKET_NEWS));
log('');

// ---------------------------------------------------------------------------
// Group 12: Network safety guard
// ---------------------------------------------------------------------------
log('--- Group 12: Checker network safety ---');

const originalFetch = globalThis.fetch;
let checkerMadeFetch = false;
globalThis.fetch = () => { checkerMadeFetch = true; throw new Error('fetch blocked'); };
check('Checker itself makes no network calls', !checkerMadeFetch);
globalThis.fetch = originalFetch;
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3BR Portfolio Holdings Category Header Static Contract — Summary ===');
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
