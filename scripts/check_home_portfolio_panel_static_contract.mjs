/**
 * Static contract check for Home Portfolio Panel (Phase 3BL).
 * No network calls. No .env file reads. Exits non-zero on any failure.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const HOME_PAGE_PATH = join(root, 'src', 'pages', 'index.astro');
const PANEL_COMPONENT_PATH = join(root, 'src', 'components', 'HomePortfolioPanel.astro');
const CSS_PATH = join(root, 'src', 'styles', 'style.css');
const HOME_MARKET_NEWS_PATH = join(root, 'src', 'components', 'HomeMarketNews.astro');
const NEWS_PAGE_PATH = join(root, 'src', 'pages', 'news');
const RESULT_DOC_PATH = join(root, 'docs', 'planning', 'phase_3bl_home_portfolio_status_panel_result_v0.1.md');
const RESULT_DOC_3BP_PATH = join(root, 'docs', 'planning', 'phase_3bp_home_portfolio_panel_owner_review_fixes_result_v0.1.md');
const PACKAGE_JSON_PATH = join(root, 'package.json');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  const status = pass ? 'PASS' : 'FAIL';
  log(`  [${status}] ${label}`);
  if (pass) passes++;
  else failures++;
};

log('=== Home Portfolio Panel Static Contract Check (Phase 3BL / 3BP) ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

check('HomePortfolioPanel component exists', existsSync(PANEL_COMPONENT_PATH));
check('Home page exists (src/pages/index.astro)', existsSync(HOME_PAGE_PATH));
check('HomeMarketNews component exists (unchanged)', existsSync(HOME_MARKET_NEWS_PATH));
check('Style sheet exists', existsSync(CSS_PATH));

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')); } catch {}
check('package.json includes check:home-portfolio-panel script',
  typeof pkg.scripts?.['check:home-portfolio-panel'] === 'string');
log('');

// ---------------------------------------------------------------------------
// Group 2: Home page integration
// ---------------------------------------------------------------------------
log('--- Group 2: Home page integration ---');

const homeContent = existsSync(HOME_PAGE_PATH) ? readFileSync(HOME_PAGE_PATH, 'utf8') : '';

check('Home imports HomePortfolioPanel', homeContent.includes('HomePortfolioPanel'));
check('Home imports HomeMarketNews (still present)', homeContent.includes('HomeMarketNews'));
check('Home no longer contains Market Coverage static panel copy',
  !homeContent.includes('Market Coverage') && !homeContent.includes('market-panel'));
check('Home still contains HomeMarketNews component usage',
  homeContent.includes('<HomeMarketNews'));
check('Home does not pass source=auto', !homeContent.includes('source=auto'));
check('Home does not pass source=live', !homeContent.includes('source=live'));
log('');

// ---------------------------------------------------------------------------
// Group 3: Component state structure
// ---------------------------------------------------------------------------
log('--- Group 3: Component state structure ---');

const panelContent = existsSync(PANEL_COMPONENT_PATH) ? readFileSync(PANEL_COMPONENT_PATH, 'utf8') : '';

check('Component contains resolving state element (Phase 3BP)',
  panelContent.includes('id="hpp-resolving"') || panelContent.includes("id='hpp-resolving'"));
check('Component contains signed_out state element', panelContent.includes('id="hpp-signed-out"') || panelContent.includes("id='hpp-signed-out'"));
check('Component contains signed_in_empty state element', panelContent.includes('id="hpp-signed-in-empty"') || panelContent.includes("id='hpp-signed-in-empty'"));
check('Component contains signed_in_with_portfolio state element',
  panelContent.includes('id="hpp-signed-in-portfolio"') || panelContent.includes("id='hpp-signed-in-portfolio'"));
check('Component marks resolving as SSR default (data-hpp-default on hpp-resolving)',
  panelContent.includes('data-hpp-default'));
check('signed_out is NOT the SSR-visible default (anti-flicker)',
  !panelContent.includes('id="hpp-signed-out" data-hpp-default') &&
  !panelContent.includes("id='hpp-signed-out' data-hpp-default") &&
  !(panelContent.includes('id="hpp-signed-out"') && panelContent.includes('data-hpp-default="true"') &&
    panelContent.indexOf('id="hpp-resolving"') > panelContent.indexOf('data-hpp-default="true"')));
check('signed_in_empty and signed_in_with_portfolio are hidden by default',
  panelContent.includes('id="hpp-signed-in-empty"') && panelContent.includes('class="hpp-state hidden"'));
check('HPP_STATE_IDS includes hpp-resolving',
  panelContent.includes("'hpp-resolving'") || panelContent.includes('"hpp-resolving"'));
log('');

// ---------------------------------------------------------------------------
// Group 4: Korean UI copy — signed_out state
// ---------------------------------------------------------------------------
log('--- Group 4: Korean UI copy — signed_out ---');

check('Component includes signed_out guide title (포트폴리오 관리를)',
  panelContent.includes('포트폴리오 관리를') && panelContent.includes('시작해보세요'));
check('Component includes step 01 for signed_out',
  panelContent.includes('무료 계정으로 시작'));
check('Component includes step 02 for signed_out',
  panelContent.includes('포트폴리오 만들기'));
check('Component includes step 03 for signed_out',
  panelContent.includes('보유 종목 입력'));
check('Component includes step 04 for signed_out',
  panelContent.includes('투자 현황 확인'));
check('Component includes CTA link to /portfolio (signed_out)',
  panelContent.includes('href="/portfolio"') || panelContent.includes("href='/portfolio'"));
log('');

// ---------------------------------------------------------------------------
// Group 5: Korean UI copy — signed_in_empty state
// ---------------------------------------------------------------------------
log('--- Group 5: Korean UI copy — signed_in_empty ---');

check('Component includes signed_in_empty title (첫 포트폴리오를 만들어보세요)',
  panelContent.includes('첫 포트폴리오를') && panelContent.includes('만들어보세요'));
check('Component includes signed_in_empty lead copy (계정 준비가 완료되었습니다)',
  panelContent.includes('계정 준비가 완료되었습니다'));
check('Component emphasizes portfolio creation step (hpp-step-next)',
  panelContent.includes('hpp-step-next'));
check('Component includes next-step badge (다음 단계)',
  panelContent.includes('다음 단계'));
check('Component includes signed_in_empty CTA to /portfolio',
  (() => {
    // Multiple /portfolio links expected; just check the badge state section has one
    return panelContent.includes('hpp-signed-in-empty') && panelContent.includes('/portfolio');
  })());
log('');

// ---------------------------------------------------------------------------
// Group 6: Compact dashboard — signed_in_with_portfolio state
// ---------------------------------------------------------------------------
log('--- Group 6: signed_in_with_portfolio dashboard ---');

check('Component includes MY PORTFOLIO eyebrow', panelContent.includes('MY PORTFOLIO'));
check('Component includes portfolio count element (hpp-portfolio-count)',
  panelContent.includes('hpp-portfolio-count'));
check('Component includes portfolio names element (hpp-portfolio-names)',
  panelContent.includes('hpp-portfolio-names'));
check('Component includes /portfolio CTA for signed_in state',
  panelContent.includes('포트폴리오 보기'));
check('Component does not label data as 실시간 or live',
  !panelContent.includes('실시간') && !panelContent.includes('>live<'));
check('Component does not claim 평가금액 with live data', !panelContent.includes('평가금액'));
log('');

// ---------------------------------------------------------------------------
// Group 7: Live isolation — no GNews/KIS/external imports
// ---------------------------------------------------------------------------
log('--- Group 7: Live isolation ---');

check('Component does not import gnewsLiveFetchAdapter',
  !panelContent.includes('gnewsLiveFetchAdapter'));
check('Component does not import owner smoke script',
  !panelContent.includes('owner_smoke_gnews_live_fetch'));
check('Component does not read GNEWS_API_KEY', !panelContent.includes('GNEWS_API_KEY'));
check('Component does not read PUBLIC_GNEWS_API_KEY', !panelContent.includes('PUBLIC_GNEWS_API_KEY'));
check('Component does not read GNEWS_BASE_URL', !panelContent.includes('GNEWS_BASE_URL'));
check('Component does not read GNEWS_LIVE_ENABLED', !panelContent.includes('GNEWS_LIVE_ENABLED'));
check('Component does not reference KIS credentials',
  !panelContent.includes('KIS_APP_KEY') &&
  !panelContent.includes('koreainvestment') &&
  !panelContent.includes('kisClient'));
check('Component does not reference gnews.io', !panelContent.includes('gnews.io'));
log('');

// ---------------------------------------------------------------------------
// Group 8: Client-side isolation and auth pattern
// ---------------------------------------------------------------------------
log('--- Group 8: Auth and data isolation ---');

const combinedContent = homeContent + panelContent;

// Check panel uses existing Supabase auth pattern
check('Component uses isSupabaseConfigured from existing lib/supabase',
  panelContent.includes('isSupabaseConfigured'));
check('Component uses portfolioApi from existing lib/portfolioClient',
  panelContent.includes('portfolioApi'));

// Verify no Supabase write/mutation
check('Component does not call Supabase insert/update/delete',
  !panelContent.includes('.from(') && !panelContent.includes('supabaseAdmin'));

// Verify no external fetch
const panelTemplate = panelContent.replace(/^---[\s\S]*?---/, '');
const panelScriptBlocks = panelTemplate.match(/<script[\s\S]*?<\/script>/gi) ?? [];
const externalFetch = panelScriptBlocks.some(
  (block) => /fetch\s*\(\s*['"`]https?:/.test(block),
);
check('Component does not call external HTTP fetch', !externalFetch);

// Verify no client-side news fetch
const clientNewsCall = panelScriptBlocks.some(
  (block) => /fetch/.test(block) && /market-feed|gnews|news/.test(block),
);
check('Component does not include client-side news fetch', !clientNewsCall);

// Verify no debug chips
check('Component does not render debug status chips',
  !panelContent.includes('status-pill') &&
  !panelContent.includes('portfolio-readiness') &&
  !panelContent.includes('portfolio-status-bar'));
log('');

// ---------------------------------------------------------------------------
// Group 9: CSS styling
// ---------------------------------------------------------------------------
log('--- Group 9: CSS styling ---');

const cssContent = existsSync(CSS_PATH) ? readFileSync(CSS_PATH, 'utf8') : '';
check('CSS includes .home-portfolio-panel', cssContent.includes('.home-portfolio-panel'));
check('CSS includes .hpp-state', cssContent.includes('.hpp-state'));
check('CSS includes .hpp-steps', cssContent.includes('.hpp-steps'));
check('CSS includes .hpp-step-next (emphasized step)', cssContent.includes('.hpp-step-next'));
check('CSS includes .hpp-cta', cssContent.includes('.hpp-cta'));
check('CSS .hpp-cta uses flex display for vertical centering (Phase 3BP)',
  cssContent.includes('.hpp-cta') &&
  (cssContent.includes('display: flex') || cssContent.includes('display:flex')) &&
  cssContent.includes('align-items: center') &&
  cssContent.includes('justify-content: center'));
check('CSS .hpp-cta does not use block display without centering',
  !(cssContent.match(/\.hpp-cta\s*\{[^}]*display:\s*block/)));
check('CSS includes focus style for .hpp-cta',
  cssContent.includes('.hpp-cta:focus') || cssContent.includes('.hpp-cta:focus-visible'));
check('CSS includes .hpp-summary', cssContent.includes('.hpp-summary'));
check('CSS includes .hpp-portfolio-names', cssContent.includes('.hpp-portfolio-names'));
check('CSS includes resolving skeleton styles (Phase 3BP)', cssContent.includes('.hpp-resolving-skeleton'));
check('CSS includes donut chart styles (Phase 3BP)', cssContent.includes('.hpp-donut'));
check('CSS includes donut legend styles (Phase 3BP)', cssContent.includes('.hpp-donut-legend'));
log('');

// ---------------------------------------------------------------------------
// Group 10: Boundary isolation
// ---------------------------------------------------------------------------
log('--- Group 10: Boundary isolation ---');

check('No /news page created', !existsSync(NEWS_PAGE_PATH));
check('Phase 3BL result doc exists', existsSync(RESULT_DOC_PATH));
check('Phase 3BP result doc exists', existsSync(RESULT_DOC_3BP_PATH));
check('Portfolio page not referenced in Home component imports',
  !homeContent.includes("from '../pages/portfolio'") &&
  !homeContent.includes("from './portfolio'"));
check('No Supabase reference in home panel files',
  !combinedContent.includes('supabaseAdmin') &&
  !combinedContent.includes('.from('));
check('No external ad scripts in combined content',
  !combinedContent.includes('googletagmanager') &&
  !combinedContent.includes('doubleclick'));
log('');

// ---------------------------------------------------------------------------
// Group 11: Phase 3BP — anti-flicker, donut chart, CTA alignment
// ---------------------------------------------------------------------------
log('--- Group 11: Phase 3BP checks ---');

check('Component imports PortfolioPosition type',
  panelContent.includes('PortfolioPosition'));
check('Component defines CHART_COLORS array',
  panelContent.includes('CHART_COLORS'));
check('Component includes renderDonutChart function',
  panelContent.includes('renderDonutChart'));
check('Component includes loadDonutChart function',
  panelContent.includes('loadDonutChart'));
check('Component calls portfolioApi.listPositions for chart data',
  panelContent.includes('portfolioApi.listPositions'));
check('Donut chart element exists in State C markup',
  panelContent.includes('id="hpp-donut"') || panelContent.includes("id='hpp-donut'"));
check('Donut legend element exists in State C markup',
  panelContent.includes('id="hpp-donut-legend"') || panelContent.includes("id='hpp-donut-legend'"));
check('Donut placeholder element exists',
  panelContent.includes('id="hpp-donut-placeholder"') || panelContent.includes("id='hpp-donut-placeholder'"));
check('Donut basis copy present (등록 금액 기준)',
  panelContent.includes('등록 금액 기준'));
check('Resolving skeleton markup present',
  panelContent.includes('hpp-resolving-skeleton'));
check('Component does not claim 실시간 or live on donut chart',
  !panelContent.includes('실시간') && !panelContent.includes('>live<'));
check('Non-401 error falls back to signed_in_empty (not signed_out)',
  panelContent.includes('switchHppState(\'hpp-signed-in-empty\')') ||
  panelContent.includes('switchHppState("hpp-signed-in-empty")'));
check('State C CTA text is 포트폴리오 보기',
  panelContent.includes('포트폴리오 보기'));
check('State A CTA text is 포트폴리오 시작하기',
  panelContent.includes('포트폴리오 시작하기'));
log('');

// ---------------------------------------------------------------------------
// Group 12: Network safety guard
// ---------------------------------------------------------------------------
log('--- Group 12: Checker network safety ---');

const originalFetch = globalThis.fetch;
let checkerMadeFetch = false;
globalThis.fetch = (...args) => {
  checkerMadeFetch = true;
  const url = String(args[0] ?? '');
  throw new Error(`Checker made a forbidden network call: ${url}`);
};

check('Checker itself makes no network calls (fetch guard active)', !checkerMadeFetch);

globalThis.fetch = originalFetch;
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3BL / 3BP Home Portfolio Panel Static Contract — Summary ===');
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
