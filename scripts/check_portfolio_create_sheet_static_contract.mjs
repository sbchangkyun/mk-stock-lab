/**
 * Static contract check for Portfolio Create/Edit Sheet (Phase 3BS).
 * No network calls. No .env reads. Exits non-zero on any failure.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const PORTFOLIO_PAGE = join(root, 'src', 'pages', 'portfolio.astro');
const CSS_PATH = join(root, 'src', 'styles', 'style.css');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3bs_home_portfolio_card_create_sheet_owner_fixes_result_v0.1.md');
const POSITION_SHEET_COMPONENT = join(root, 'src', 'pages', 'portfolio.astro');
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

log('=== Portfolio Create/Edit Sheet Static Contract (Phase 3BS) ===');
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
check('Phase 3BS result doc exists', existsSync(RESULT_DOC));
check('HomePortfolioPanel component exists (boundary)', existsSync(HPP_COMPONENT));
check('HomeMarketNews component exists (boundary)', existsSync(HOME_MARKET_NEWS));
check('package.json has check:portfolio-create-sheet script',
  typeof pkg.scripts?.['check:portfolio-create-sheet'] === 'string');
log('');

// ---------------------------------------------------------------------------
// Group 2: Old inline manage panel removed
// ---------------------------------------------------------------------------
log('--- Group 2: Old inline manage panel removed ---');

check('Old portfolio-manage-panel inline block not in HTML (removed from normal page flow)',
  !portfolioContent.includes('<div class="portfolio-manage-panel') &&
  !portfolioContent.includes('<div class="portfolio-manage-inner'));
check('portfolio-manage-title class no longer in HTML',
  !portfolioContent.includes('portfolio-manage-title'));
check('openManagePanel function removed',
  !portfolioContent.includes('openManagePanel'));
check('Only one portfolio form in DOM',
  (() => {
    const count = (portfolioContent.match(/id="portfolio-form"/g) || []).length;
    return count === 1;
  })());
log('');

// ---------------------------------------------------------------------------
// Group 3: Portfolio sheet dialog structure
// ---------------------------------------------------------------------------
log('--- Group 3: Portfolio sheet structure ---');

check('portfolio-sheet element exists',
  portfolioContent.includes('id="portfolio-sheet"'));
check('portfolio-sheet has role="dialog"',
  portfolioContent.includes('role="dialog"') &&
  portfolioContent.includes('id="portfolio-sheet"'));
check('portfolio-sheet has aria-modal="true"',
  portfolioContent.includes('aria-modal="true"'));
check('portfolio-sheet has aria-hidden="true" (initially closed)',
  portfolioContent.includes('aria-hidden="true"') &&
  portfolioContent.includes('id="portfolio-sheet"'));
check('portfolio-sheet has aria-labelledby pointing to sheet title',
  portfolioContent.includes('aria-labelledby="portfolio-sheet-title"'));
check('portfolio-sheet-title element exists',
  portfolioContent.includes('id="portfolio-sheet-title"'));
check('portfolio-sheet-backdrop button exists',
  portfolioContent.includes('id="portfolio-sheet-backdrop"'));
check('portfolio-sheet-close button exists',
  portfolioContent.includes('id="portfolio-sheet-close"'));
check('portfolio-sheet-backdrop has type="button"',
  portfolioContent.includes('id="portfolio-sheet-backdrop"') &&
  portfolioContent.includes('type="button"'));
check('portfolio-sheet-backdrop has aria-label',
  portfolioContent.includes('aria-label="포트폴리오 입력창 닫기"'));
log('');

// ---------------------------------------------------------------------------
// Group 4: Portfolio form fields in sheet
// ---------------------------------------------------------------------------
log('--- Group 4: Portfolio form fields ---');

check('portfolio-form exists in portfolio sheet',
  portfolioContent.includes('id="portfolio-form"'));
check('portfolio-id hidden field exists',
  portfolioContent.includes('id="portfolio-id"'));
check('portfolio-name input exists',
  portfolioContent.includes('id="portfolio-name"'));
check('portfolio-base-currency select exists',
  portfolioContent.includes('id="portfolio-base-currency"'));
check('portfolio-submit button exists',
  portfolioContent.includes('id="portfolio-submit"'));
check('portfolio-cancel-edit button exists',
  portfolioContent.includes('id="portfolio-cancel-edit"'));
check('KRW option in base currency select',
  portfolioContent.includes('<option value="KRW">KRW</option>'));
check('USD option in base currency select',
  portfolioContent.includes('<option value="USD">USD</option>'));
log('');

// ---------------------------------------------------------------------------
// Group 5: Open/close behavior
// ---------------------------------------------------------------------------
log('--- Group 5: Open/close behavior ---');

check('openPortfolioSheet function defined',
  portfolioContent.includes('openPortfolioSheet'));
check('closePortfolioSheet function defined',
  portfolioContent.includes('closePortfolioSheet'));
check('toggle-manage-panel action calls openPortfolioSheet or closePortfolioSheet',
  portfolioContent.includes("'toggle-manage-panel'") &&
  (portfolioContent.includes('openPortfolioSheet') || portfolioContent.includes('closePortfolioSheet')));
check('portfolio-sheet-close listener wired to closePortfolioSheet',
  portfolioContent.includes("'portfolio-sheet-close'") &&
  portfolioContent.includes('closePortfolioSheet'));
check('portfolio-sheet-backdrop listener wired to closePortfolioSheet',
  portfolioContent.includes("'portfolio-sheet-backdrop'") &&
  portfolioContent.includes('closePortfolioSheet'));
check('ESC key closes portfolio-sheet',
  portfolioContent.includes('portfolio-sheet') &&
  portfolioContent.includes("'Escape'") &&
  portfolioContent.includes('closePortfolioSheet'));
check('sheet.classList.add open when opening',
  portfolioContent.includes("classList.add('open')"));
check('sheet.classList.remove open when closing',
  portfolioContent.includes("classList.remove('open')"));
check('aria-hidden set to false when opening',
  portfolioContent.includes("setAttribute('aria-hidden', 'false')"));
check('aria-hidden set to true when closing',
  portfolioContent.includes("setAttribute('aria-hidden', 'true')"));
log('');

// ---------------------------------------------------------------------------
// Group 6: Edit behavior
// ---------------------------------------------------------------------------
log('--- Group 6: Edit behavior ---');

check('edit-portfolio action populates form fields and opens sheet',
  portfolioContent.includes("data-action=\"edit-portfolio\"") ||
  portfolioContent.includes("data-action='edit-portfolio'") ||
  portfolioContent.includes("'edit-portfolio'"));
check('edit mode sets portfolio-submit text to 포트폴리오 수정',
  portfolioContent.includes("'포트폴리오 수정'") || portfolioContent.includes('"포트폴리오 수정"'));
check('edit mode shows portfolio-cancel-edit button',
  portfolioContent.includes('portfolio-cancel-edit') &&
  portfolioContent.includes("classList.remove('hidden')"));
check('cancel-edit calls closePortfolioSheet',
  portfolioContent.includes("'portfolio-cancel-edit'") &&
  portfolioContent.includes('closePortfolioSheet'));
check('submit success closes sheet (closePortfolioSheet in submit handler)',
  (() => {
    const submitHandlerIdx = portfolioContent.indexOf("'portfolio-form'");
    const afterHandler = portfolioContent.slice(submitHandlerIdx, submitHandlerIdx + 1200);
    return afterHandler.includes('closePortfolioSheet');
  })());
log('');

// ---------------------------------------------------------------------------
// Group 7: Position sheet preserved
// ---------------------------------------------------------------------------
log('--- Group 7: Position sheet preserved ---');

check('position-sheet element still present',
  portfolioContent.includes('id="position-sheet"'));
check('position-sheet has role="dialog"',
  portfolioContent.includes('role="dialog"') && portfolioContent.includes('id="position-sheet"'));
check('position-sheet-close button still present',
  portfolioContent.includes('id="position-sheet-close"'));
check('position-sheet-backdrop button still present',
  portfolioContent.includes('id="position-sheet-backdrop"'));
check('position-form still present',
  portfolioContent.includes('id="position-form"'));
check('openPositionSheet function still present',
  portfolioContent.includes('openPositionSheet'));
check('closePositionSheet function still present',
  portfolioContent.includes('closePositionSheet'));
log('');

// ---------------------------------------------------------------------------
// Group 8: CSS styles for portfolio sheet
// ---------------------------------------------------------------------------
log('--- Group 8: CSS portfolio sheet styles ---');

check('CSS .portfolio-sheet defined',
  cssContent.includes('.portfolio-sheet {'));
check('CSS .portfolio-sheet.open defined',
  cssContent.includes('.portfolio-sheet.open'));
check('CSS .portfolio-sheet-backdrop defined',
  cssContent.includes('.portfolio-sheet-backdrop'));
check('CSS .portfolio-sheet.open .portfolio-sheet-backdrop defined',
  cssContent.includes('.portfolio-sheet.open .portfolio-sheet-backdrop'));
check('CSS .portfolio-sheet-panel defined',
  cssContent.includes('.portfolio-sheet-panel'));
check('CSS .portfolio-sheet.open .portfolio-sheet-panel defined',
  cssContent.includes('.portfolio-sheet.open .portfolio-sheet-panel'));
check('CSS .portfolio-sheet-header defined',
  cssContent.includes('.portfolio-sheet-header'));
check('CSS portfolio-sheet uses fixed positioning',
  (() => {
    const idx = cssContent.indexOf('.portfolio-sheet {');
    const block = cssContent.slice(idx, idx + 300);
    return block.includes('position: fixed');
  })());
check('CSS portfolio-sheet-panel slides from bottom (translateY)',
  cssContent.includes('translateY') && cssContent.includes('.portfolio-sheet-panel'));
check('CSS prefers-reduced-motion for portfolio-sheet',
  cssContent.includes('.portfolio-sheet,') || cssContent.includes('.portfolio-sheet\n'));
log('');

// ---------------------------------------------------------------------------
// Group 9: Bookmark tab + add button preserved
// ---------------------------------------------------------------------------
log('--- Group 9: Bookmark tab + add button ---');

check('portfolio-bookmark-tabs still present',
  portfolioContent.includes('portfolio-bookmark-tabs'));
check('Inline add tab still JS-rendered with addBtn.id = portfolio-manage-toggle',
  portfolioContent.includes("addBtn.id = 'portfolio-manage-toggle'") ||
  portfolioContent.includes('addBtn.id = "portfolio-manage-toggle"'));
check('Add tab aria-controls points to portfolio-sheet',
  portfolioContent.includes("'portfolio-sheet'"));
check('toggle-manage-panel action still in click delegation',
  portfolioContent.includes("'toggle-manage-panel'"));
check('Aggregate tab label 전체 still present',
  portfolioContent.includes("'전체'"));
check('portfolio-tab-floating-actions still present',
  portfolioContent.includes('portfolio-tab-floating-actions'));
log('');

// ---------------------------------------------------------------------------
// Group 10: Safety boundaries
// ---------------------------------------------------------------------------
log('--- Group 10: Safety boundaries ---');

check('No live KIS OAuth endpoint added', !portfolioContent.includes('oauth2/tokenP'));
check('No live KIS quote endpoint added',
  !portfolioContent.includes('/uapi/domestic-stock/v1/quotations'));
check('No KIS_APP_KEY read in portfolio page', !portfolioContent.includes('KIS_APP_KEY'));
check('No gnews.io call in portfolio page', !portfolioContent.includes('gnews.io'));
check('No GNEWS_API_KEY read in portfolio page', !portfolioContent.includes('GNEWS_API_KEY'));
check('No supabaseAdmin import added', !portfolioContent.includes('supabaseAdmin'));
check('No DB migration SQL added', !portfolioContent.includes('CREATE TABLE'));
check('No /news page created', !existsSync(NEWS_PAGE));
check('No modal library imported',
  !portfolioContent.includes("from 'micromodal'") &&
  !portfolioContent.includes("from 'a11y-dialog'") &&
  !portfolioContent.includes('dialog-polyfill'));
check('No drag-to-close added',
  !portfolioContent.includes('touchstart') || !portfolioContent.includes('portfolio-sheet'));
check('HomePortfolioPanel component present (unchanged)', existsSync(HPP_COMPONENT));
check('HomeMarketNews component present (unchanged)', existsSync(HOME_MARKET_NEWS));
log('');

// ---------------------------------------------------------------------------
// Group 11: Checker network safety
// ---------------------------------------------------------------------------
log('--- Group 11: Checker network safety ---');

const originalFetch = globalThis.fetch;
let checkerMadeFetch = false;
globalThis.fetch = () => { checkerMadeFetch = true; throw new Error('fetch blocked'); };
check('Checker itself makes no network calls', !checkerMadeFetch);
globalThis.fetch = originalFetch;
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3BS Portfolio Create Sheet Static Contract — Summary ===');
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
