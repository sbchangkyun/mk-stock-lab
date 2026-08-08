/**
 * Static contract check for Phase 4E-B — Portfolio Production Completion.
 *
 * Phase 4E-B is a truthfulness/accessibility/semantics completion pass over the existing Portfolio
 * page (src/pages/portfolio.astro) and a new pure keyboard-navigation module
 * (src/lib/portfolio/portfolioKeyboardNav.ts) -- NOT a new data source, provider integration, or
 * business-scope expansion. This checker verifies, via static source inspection only (no execution,
 * no network), the approved 10 requirements (A-J) plus the phase's hard-rule safety boundaries:
 *   - (A) ETF UI exposure: the position-asset-type select offers an ETF option and the page lead
 *     copy names ETFs.
 *   - (B) Currency toggle truthfulness: the display-mode segmented control is honestly labeled and
 *     does not claim live FX conversion.
 *   - (C) baseCurrency truthfulness: the portfolio base-currency field hint and KPI note honestly
 *     disclose that the aggregate is KRW-based and USD conversion is not supported, without the
 *     internally-contradictory HF1 wording ("원화 환산은 현재 미지원" beside an already-KRW aggregate);
 *     the select is wired to its hint via aria-describedby.
 *   - (D) Dividend surface honesty: the dividend header cell carries no sort affordance (no
 *     data-sort-column, no sort-arrow-button) and dividend cells render an honest "데이터 대기" state.
 *   - (E) Dynamic status accessibility: role="status"/aria-live="polite"/aria-atomic="true" on both
 *     #portfolio-readiness and #valuation-status-copy.
 *   - (F) Dialog focus lifecycle: opener capture + restoration for both sheets, initial focus on
 *     open, and Tab containment via the shared computeDialogFocusWrap pure function.
 *   - (G) Tab semantics: role="tablist"/"tab", aria-selected, aria-controls, roving tabIndex, and
 *     ArrowLeft/Right/Home/End navigation via the shared computeTabRovingNavigation pure function,
 *     with aria-labelledby kept in sync on the shared tabpanel.
 *   - (H) Holdings semantics: no invalid role="row"/role="columnheader" remain on the holdings grid.
 *   - (I) Horizontal scroll accessibility: #positions-list-wrap is a labeled, keyboard-reachable
 *     role="region" with a visible focus style.
 *   - (J) Responsive completion: the dead no-op .portfolio-mvp grid-template-columns rule inside the
 *     980px media query has been removed.
 *   - Safety boundaries: no trading/order/brokerage, US-quote, FX-provider, dividend-provider, KIS
 *     account, LLM/OpenAI/Gemini, Supabase migration, or new fetch()/API-route reference was added.
 *   - (HF1) Keyboard focus-visible coverage: Portfolio-scoped focus-visible styling exists for the
 *     segmented control, position-name links, and the two dialog sheets' action controls.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const PORTFOLIO = join(root, 'src', 'pages', 'portfolio.astro');
const KEYBOARD_NAV = join(root, 'src', 'lib', 'portfolio', 'portfolioKeyboardNav.ts');
const CSS = join(root, 'src', 'styles', 'style.css');

const log = (msg) => process.stdout.write(msg + '\n');
let passes = 0;
let failures = 0;
const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};
const readOr = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');
const countOf = (src, re) => (src.match(re) || []).length;

log('=== Phase 4E-B Portfolio Production Completion Static Contract ===');
log('');

// ---------------------------------------------------------------------------
// Group 0: File existence
// ---------------------------------------------------------------------------
log('--- Group 0: File existence ---');
check('0a. portfolio.astro exists', existsSync(PORTFOLIO));
check('0b. portfolioKeyboardNav.ts exists', existsSync(KEYBOARD_NAV));
check('0c. style.css exists', existsSync(CSS));

const src = readOr(PORTFOLIO);
const navSrc = readOr(KEYBOARD_NAV);
const cssSrc = readOr(CSS);
const oneLine = src.replace(/\r?\n/g, ' ');

// ---------------------------------------------------------------------------
// Group A: ETF UI exposure
// ---------------------------------------------------------------------------
log('--- Group A: ETF UI exposure ---');
check('A1. position-asset-type select offers an ETF option', /<select id="position-asset-type">[\s\S]{0,120}<option value="etf">ETF<\/option>/.test(src));
check('A2. page lead copy names ETFs alongside stocks', /ETF 보유 종목을 관리합니다/.test(src));

// ---------------------------------------------------------------------------
// Group B: Currency toggle truthfulness
// ---------------------------------------------------------------------------
log('--- Group B: Currency toggle truthfulness ---');
check('B1. currency display toggle carries an honest aria-label', /id="currency-display-toggle" aria-label="통화 표시 기준"/.test(src));
check('B2. local-currency option is honestly labeled (현지), not a fake FX conversion', /data-display-mode="local"[\s\S]{0,80}>현지</.test(src));
check('B3. KRW display option is honestly labeled (₩)', /data-display-mode="krw"[\s\S]{0,80}>₩</.test(src));
check('B4. no wording claims live/real-time FX conversion is applied', !/환율\s*적용/.test(src) && !/실시간 환율/.test(src));

// ---------------------------------------------------------------------------
// Group C: baseCurrency truthfulness
// ---------------------------------------------------------------------------
log('--- Group C: baseCurrency truthfulness ---');
check('C1. portfolio base-currency field hint discloses the aggregate is currently KRW-based', /현재 합산 평가금액은 원화\(KRW\) 기준으로 제공되며/.test(src));
check('C2. base-currency field hint discloses USD conversion is not supported', /USD 환산은 지원하지 않습니다/.test(src));
check('C3. the internally-contradictory HF1 wording ("원화 환산은 현재 미지원") is absent', !/원화 환산은 현재 미지원/.test(src));
check('C4. KPI summary note discloses USD conversion is not currently supported', /USD 환산 현재 미지원/.test(src));
check('C5. base-currency select is wired to its hint via aria-describedby (not just matching ids)', /id="portfolio-base-currency" name="baseCurrency" aria-describedby="portfolio-base-currency-hint"/.test(src));

// ---------------------------------------------------------------------------
// Group D: Dividend surface honesty
// ---------------------------------------------------------------------------
log('--- Group D: Dividend surface honesty ---');
const dividendHeaderCell = src.match(/<div class="positions-category-cell positions-category-cell--group">\s*<span class="col-group-top">배당률<\/span>\s*<span class="col-group-bottom">배당주기<\/span>\s*<\/div>/);
check('D1. dividend header cell exists with plain 배당률/배당주기 labels', !!dividendHeaderCell);
check('D2. dividend header cell carries no data-sort-column affordance', !!dividendHeaderCell && !/data-sort-column/.test(dividendHeaderCell[0]));
check('D3. dividend header cell carries no sort-arrow-button', !!dividendHeaderCell && !/sort-arrow-button/.test(dividendHeaderCell[0]));
check('D4. no dividend-specific sort key (dividend-asc/dividend-desc) exists anywhere', !/data-sort="dividend-(asc|desc)"/.test(src));
check('D5. dividend position cells render the honest 데이터 대기 placeholder twice per row', /<strong class="metric-placeholder">데이터 대기<\/strong>\s*<small class="metric-placeholder">데이터 대기<\/small>/.test(src));

// ---------------------------------------------------------------------------
// Group E: Dynamic status accessibility
// ---------------------------------------------------------------------------
log('--- Group E: Dynamic status accessibility ---');
check('E1. #portfolio-readiness is a role="status" live region', /id="portfolio-readiness" data-state="checking" role="status" aria-live="polite" aria-atomic="true"/.test(src));
check('E2. #valuation-status-copy is a role="status" live region', /id="valuation-status-copy"[\s\S]{0,40}role="status" aria-live="polite" aria-atomic="true"/.test(src));

// ---------------------------------------------------------------------------
// Group F: Dialog focus lifecycle
// ---------------------------------------------------------------------------
log('--- Group F: Dialog focus lifecycle ---');
check('F1. dedicated opener-capture variables exist for both sheets', /let portfolioSheetOpener: HTMLElement \| null = null;/.test(src) && /let positionSheetOpener: HTMLElement \| null = null;/.test(src));
check('F2. opening the position sheet captures document.activeElement as its opener', /positionSheetOpener = document\.activeElement instanceof HTMLElement \? document\.activeElement : null;/.test(src));
check('F3. opening the portfolio sheet captures document.activeElement as its opener', /portfolioSheetOpener = document\.activeElement instanceof HTMLElement \? document\.activeElement : null;/.test(src));
check('F4. a shared restoreOpenerFocus helper restores focus to the captured opener', /const restoreOpenerFocus = \(opener: HTMLElement \| null\) => \{/.test(src));
check('F5. closing the position sheet restores opener focus', /restoreOpenerFocus\(positionSheetOpener\);/.test(src));
check('F6. closing the portfolio sheet restores opener focus', /restoreOpenerFocus\(portfolioSheetOpener\);/.test(src));
check('F7. opening either sheet moves initial focus into the dialog', /getElement<HTMLInputElement>\('position-security-input'\)\?\.focus\(\)/.test(src) && /getElement<HTMLInputElement>\('portfolio-name'\)\?\.focus\(\)/.test(src));
check('F8. Tab containment is computed via the shared pure computeDialogFocusWrap function', /computeDialogFocusWrap\(focusable\.length, currentIndex, event\.shiftKey\)/.test(src));
check('F9. Tab containment reuses a single getDialogFocusableElements query, not ad-hoc selectors', /const getDialogFocusableElements = \(panel: HTMLElement \| null\): HTMLElement\[\] => \{/.test(src));
check('F10. dialogs declare role="dialog" + aria-modal + aria-labelledby', countOf(src, /role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby=/g) === 2);

// ---------------------------------------------------------------------------
// Group G: Tab semantics
// ---------------------------------------------------------------------------
log('--- Group G: Tab semantics ---');
check('G1. #portfolio-list declares role="tablist" with an accessible label', /id="portfolio-list" aria-live="polite" role="tablist" aria-label="포트폴리오 선택"/.test(src));
check('G2. #portfolio-detail-panel declares role="tabpanel"', /id="portfolio-detail-panel" role="tabpanel"/.test(src));
check('G3. the aggregate tab is given role="tab", aria-selected, aria-controls, and a stable id', /aggregateTab\.setAttribute\('role', 'tab'\);/.test(src) && /aggregateTab\.setAttribute\('aria-selected'/.test(src) && /aggregateTab\.setAttribute\('aria-controls', 'portfolio-detail-panel'\);/.test(src) && /aggregateTab\.id = getPortfolioTabId\(aggregatePortfolioId\);/.test(src));
check('G4. each portfolio tab is given role="tab", aria-selected, aria-controls, and a stable id', /tabBtn\.setAttribute\('role', 'tab'\);/.test(src) && /tabBtn\.setAttribute\('aria-selected'/.test(src) && /tabBtn\.setAttribute\('aria-controls', 'portfolio-detail-panel'\);/.test(src) && /tabBtn\.id = getPortfolioTabId\(portfolio\.id\);/.test(src));
check('G5. tabs use a roving tabIndex (0 for active, -1 otherwise), not all-tabbable', /aggregateTab\.tabIndex = isAggregateSelected\(\) \? 0 : -1;/.test(src) && /tabBtn\.tabIndex = isActive \? 0 : -1;/.test(src));
check('G6. ArrowLeft/Right/Home/End navigation is computed via the shared pure computeTabRovingNavigation function', /computeTabRovingNavigation\(tabs\.length, currentIndex, event\.key\)/.test(src));
check('G7. roving navigation only intercepts the four supported keys', /event\.key !== 'ArrowLeft' && event\.key !== 'ArrowRight' && event\.key !== 'Home' && event\.key !== 'End'/.test(oneLine));
check('G8. roving navigation moves focus to the freshly re-rendered tab, not the pre-render node', /await selectPortfolioTab\(nextId\);\s*getElement<HTMLButtonElement>\(getPortfolioTabId\(nextId\)\)\?\.focus\(\);/.test(src));
check('G9. the shared tabpanel aria-labelledby tracks the selected tab id', /panel\.setAttribute\('aria-labelledby', selectedTabId\);/.test(src) && /panel\.removeAttribute\('aria-labelledby'\);/.test(src));
check('G10. click-select and keyboard-select share one selectPortfolioTab implementation (no duplicated selection logic)', countOf(src, /await selectPortfolioTab\(/g) === 2);

// ---------------------------------------------------------------------------
// Group H: Holdings semantics
// ---------------------------------------------------------------------------
log('--- Group H: Holdings semantics ---');
check('H1. no invalid role="row" remains on the holdings grid', !/role="row"/.test(src));
check('H2. no invalid role="columnheader" remains on the holdings grid', !/role="columnheader"/.test(src));
check('H3. the holdings category header uses plain, non-ARIA-row div structure', /<div class="positions-category-header" id="positions-category-header">/.test(src));

// ---------------------------------------------------------------------------
// Group I: Horizontal scroll accessibility
// ---------------------------------------------------------------------------
log('--- Group I: Horizontal scroll accessibility ---');
check('I1. #positions-list-wrap declares role="region" with a descriptive aria-label', /id="positions-list-wrap"[\s\S]{0,80}role="region"[\s\S]{0,80}aria-label="보유 종목 목록, 좌우로 스크롤 가능"/.test(src));
check('I2. #positions-list-wrap is keyboard-reachable via tabindex="0"', /id="positions-list-wrap"[\s\S]{0,160}tabindex="0"/.test(src));
check('I3. .positions-list-wrap has a visible focus style', /\.positions-list-wrap:focus-visible \{/.test(cssSrc));
check('I4. the focus style is dark-mode aware', /body\.dark-mode \.positions-list-wrap:focus-visible \{/.test(cssSrc));

// ---------------------------------------------------------------------------
// Group J: Responsive completion (dead-CSS defect fix)
// ---------------------------------------------------------------------------
log('--- Group J: Responsive completion ---');
check('J1. the dead no-op .portfolio-mvp grid-template-columns rule inside the 980px media query is removed', !/@media \(max-width: 980px\) \{[\s\S]{0,400}\.portfolio-mvp \{\s*grid-template-columns: 1fr;\s*\}/.test(cssSrc));
check('J2. the sibling .form-grid responsive rules inside the same media query remain intact', /\.form-grid \{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);\s*\}/.test(cssSrc));

// ---------------------------------------------------------------------------
// Group K: Safety boundaries (Hard Rules)
// ---------------------------------------------------------------------------
log('--- Group K: Safety boundaries ---');
check('K1. no trading/order/brokerage functionality reference was added', !/주문 실행|매매 주문|브로커리지|placeOrder|submitOrder/i.test(src));
check('K2. no US quote provider reference was added', !/usQuoteProvider|alphavantage|polygon\.io/i.test(src));
check('K3. no FX conversion provider reference was added', !/frankfurter|exchangerate|fxProvider/i.test(src));
check('K4. no dividend provider reference was added', !/dividendProvider|dividendApi/i.test(src));
check('K5. no KIS account API reference was added', !/KIS_ACCOUNT|kisAccount/i.test(src));
check('K6. no LLM/OpenAI/Gemini reference was added', !/openai|gemini|anthropic\.com\/v1|chatCompletion/i.test(src));
check('K7. no Supabase migration or schema reference was added in this page', !/CREATE TABLE|ALTER TABLE|supabase\/migrations/i.test(src));
check('K8. no raw fetch() call was added directly in portfolio.astro (data access stays behind portfolioApi)', !/\bfetch\(/.test(src));
check('K9. no new /api/ route reference beyond the existing valuation/portfolio client calls', !/['"`]\/api\/(?!portfolio)/.test(src));
check('K10. portfolioKeyboardNav.ts stays pure (no DOM/window/document reference)', !/\b(document|window)\./.test(navSrc));
check('K11. portfolioKeyboardNav.ts introduces no fetch/network reference', !/\bfetch\(/.test(navSrc));
check('K12. the holdings surface was not redesigned into a full HTML <table>', !/<table[\s>]/.test(src));

// ---------------------------------------------------------------------------
// Group L: HF1 keyboard focus-visible coverage
// ---------------------------------------------------------------------------
log('--- Group L: HF1 keyboard focus-visible coverage ---');
check('L1. Portfolio-scoped segmented-control buttons have a visible focus style (not a bare global rule)', /\.portfolio-mvp \.segmented-control button:focus-visible \{/.test(cssSrc));
check('L2. .position-name-link has a visible focus style', /\.position-name-link:focus-visible \{/.test(cssSrc));
check('L3. sheet close/action controls have a visible focus style, scoped to the two sheets', /\.portfolio-sheet \.table-action-button:focus-visible,\s*\.position-sheet \.table-action-button:focus-visible \{/.test(cssSrc));

log('');
log(`Total: ${passes + failures} | Passed: ${passes} | Failed: ${failures}`);
process.exitCode = failures === 0 ? 0 : 1;
