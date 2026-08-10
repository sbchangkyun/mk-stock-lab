/**
 * Static contract check for Phase 4A — Home and Common Shell Production Readiness.
 *
 * This is a presentation/copy/accessibility/responsive-shell readiness pass over the Home page
 * (`src/pages/index.astro`) and the shared application shell (Header/Nav/Footer/Layout/404) — NOT a
 * redesign, NOT a provider/business-logic change. This checker verifies, via static source
 * inspection only (no execution, no network), that:
 *   - Home copy (1-9): the hero and four feature cards use the exact truthful strings for this
 *     phase, with no leftover "Preview"/staged-development wording and no overclaim of Lab/Market/
 *     Portfolio scope beyond what those pages actually implement.
 *   - Header (10-15): the fabricated "Today: 000" visitor placeholder is gone with no fake
 *     replacement, and the real auth/theme controls are untouched.
 *   - Navigation (16-22): the nav is the closed 5-item list, wired through the new pure
 *     `navActiveLink` module, with `aria-current` and focus-visible accessibility.
 *   - Shared shell (23-28): shell controls (brand mark, header buttons, feature cards, footer links)
 *     have focus-visible styling, mobile touch targets meet 44px, and the existing page-shell
 *     max-width containment list was not narrowed.
 *   - Home state components (29-40): the six Home components already confirmed compliant in review
 *     were left with their real single-fetch-owner/event-consumer/state-separation contracts intact,
 *     and the Coupang footer ad block's id/tracking code are byte-for-byte unchanged.
 *   - 404 (41-46): a real static `404.astro` exists with the exact required copy/links and makes no
 *     provider/auth/network call.
 *   - Vercel-only (47-50): the build is Vercel-adapter-only, and the roadmap documents this in place
 *     of the stale Netlify item, with no `netlify.toml` in the repo.
 *   - Security (51-55): no secret-shaped strings, no new env reads, and no new network calls were
 *     introduced by this phase's edits.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const HOME_PAGE = join(root, 'src', 'pages', 'index.astro');
const HEADER = join(root, 'src', 'components', 'Header.astro');
const NAV = join(root, 'src', 'components', 'Nav.astro');
const FOOTER = join(root, 'src', 'components', 'Footer.astro');
const LAYOUT = join(root, 'src', 'layouts', 'Layout.astro');
const NOT_FOUND = join(root, 'src', 'pages', '404.astro');
const NAV_ACTIVE_LINK = join(root, 'src', 'lib', 'shell', 'navActiveLink.ts');
const STYLE_CSS_PATH = join(root, 'src', 'styles', 'style.css');
const ASTRO_CONFIG = join(root, 'astro.config.mjs');
const ROADMAP = join(root, 'docs', 'planning', 'mk_stock_lab_master_roadmap_v2.1.md');
const NETLIFY_TOML = join(root, 'netlify.toml');
const PACKAGE_JSON = join(root, 'package.json');
const HOME_MARKET_NEWS = join(root, 'src', 'components', 'HomeMarketNews.astro');
const HOME_LIVE_SNAPSHOT = join(root, 'src', 'components', 'HomeLiveMarketSnapshot.astro');
const HOME_PORTFOLIO_PANEL = join(root, 'src', 'components', 'HomePortfolioPanel.astro');
const HOME_RETENTION_PANEL = join(root, 'src', 'components', 'HomeRetentionPanel.astro');
const HOME_MOBILE_AD = join(root, 'src', 'components', 'HomeMobileAd.astro');
const HOME_RAIL_AD = join(root, 'src', 'components', 'HomeRailAd.astro');

const log = (msg) => process.stdout.write(msg + '\n');
let passes = 0;
let failures = 0;
const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};
const readOr = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');
// Strips block/HTML comments so "does this file actually DO x" checks aren't tripped by prose in a
// doc comment that merely mentions x (e.g. a comment explaining why /admin/operations must stay
// unlinked, or a JSDoc block that mentions "Supabase" while describing what the file does NOT call).
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');

log('=== Phase 4A Home and Common Shell Static Contract ===');
log('');

// ---------------------------------------------------------------------------
// Group 0: File existence
// ---------------------------------------------------------------------------
log('--- Group 0: File existence ---');
for (const [name, path] of [
  ['index.astro', HOME_PAGE],
  ['Header.astro', HEADER],
  ['Nav.astro', NAV],
  ['Footer.astro', FOOTER],
  ['Layout.astro', LAYOUT],
  ['404.astro (new)', NOT_FOUND],
  ['navActiveLink.ts (new)', NAV_ACTIVE_LINK],
  ['style.css', STYLE_CSS_PATH],
  ['astro.config.mjs', ASTRO_CONFIG],
]) {
  check(`${name} exists`, existsSync(path));
}

const homePage = readOr(HOME_PAGE);
const header = readOr(HEADER);
const nav = readOr(NAV);
const footer = readOr(FOOTER);
const layout = readOr(LAYOUT);
const notFound = readOr(NOT_FOUND);
const navActiveLink = readOr(NAV_ACTIVE_LINK);
const STYLE_CSS = readOr(STYLE_CSS_PATH);
const astroConfig = readOr(ASTRO_CONFIG);
const roadmap = readOr(ROADMAP);
const homeMarketNews = readOr(HOME_MARKET_NEWS);
const homeLiveSnapshot = readOr(HOME_LIVE_SNAPSHOT);
const homePortfolioPanel = readOr(HOME_PORTFOLIO_PANEL);
const homeRetentionPanel = readOr(HOME_RETENTION_PANEL);
const homeMobileAd = readOr(HOME_MOBILE_AD);
const homeRailAd = readOr(HOME_RAIL_AD);
let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}

// ---------------------------------------------------------------------------
// Group 1: Home copy (1-9)
// ---------------------------------------------------------------------------
log('--- Group 1: Home copy (1-9) ---');
check('1. hero eyebrow is exactly "MK Stock Lab" (no staged/Preview wording)',
  homePage.includes('<p class="eyebrow">MK Stock Lab</p>'));
check('2. hero H1 is the exact required string',
  homePage.includes('<h1>시장 데이터, AI 차트 분석, 포트폴리오 관리를 한 곳에서</h1>'));
check('3. hero lead is the exact required string',
  homePage.includes('국내외 시장 데이터와 Chart AI, 시장 대시보드, 리서치 모듈, 포트폴리오 관리 기능을 제공하는 투자 데이터 플랫폼입니다.'));
check('4. no "Preview" wording anywhere in index.astro', !/Preview/.test(homePage));
check('5. no leftover staged-development phrase "단계적으로 연결"', !homePage.includes('단계적으로 연결'));
check('6. Chart AI hero CTA preserved (href=/chart-ai)',
  /<a class="button-link" href="\/chart-ai">Chart AI 열기<\/a>/.test(homePage));
check('7. 시장 hero CTA preserved (href=/market)',
  /<a class="button-link secondary" href="\/market">시장 보기<\/a>/.test(homePage));
check('8. Chart AI feature card states login-required and the real combined daily limit (하루 3회)',
  /feature-card" href="\/chart-ai">[\s\S]{0,40}<h2>Chart AI<\/h2>[\s\S]{0,10}<p>[^<]*로그인[^<]*하루 3회[^<]*<\/p>/.test(homePage));
check('9a. 시장 feature card describes the real KOSPI200/KOSDAQ150/S&P500/NASDAQ100 proxy-ETF basis',
  /feature-card" href="\/market">[\s\S]{0,200}KOSPI200, KOSDAQ150, S&amp;P500, NASDAQ100 대표 ETF/.test(homePage));
check('9b. Lab feature card does NOT claim NPS/Congress data availability',
  !/feature-card" href="\/lab">[\s\S]{0,300}(국민연금|국회의원)/.test(homePage));
check('9c. Lab feature card only describes asset-class and S&P 500 sector returns',
  /feature-card" href="\/lab">[\s\S]{0,40}<h2>Lab<\/h2>[\s\S]{0,10}<p>자산군별 수익률과 S&amp;P 500 섹터별 수익률/.test(homePage));
check('9d. Portfolio feature card scopes live valuation to domestic (국내) stocks only, not a blanket claim',
  /feature-card" href="\/portfolio">[\s\S]{0,300}국내 종목은 실시간 시세로 평가금액과 손익을 계산합니다/.test(homePage));
check('9e. Portfolio feature card makes no US/USD live-valuation claim',
  !/feature-card" href="\/portfolio">[\s\S]{0,300}(미국|USD)[\s\S]{0,60}실시간/.test(homePage));

// ---------------------------------------------------------------------------
// Group 2: Header (10-15)
// ---------------------------------------------------------------------------
log('--- Group 2: Header (10-15) ---');
check('10. Header.astro no longer renders the fake visitor-count placeholder markup', !header.includes('today-placeholder'));
check('11. Header.astro contains no literal "Today: 000" (or similar) fabricated count string', !/Today:\s*0+/.test(header));
check('12. no fake replacement counter/metric introduced in its place (no other *-placeholder span in header-actions)',
  !/header-actions[\s\S]{0,400}<span[^>]*placeholder/i.test(header));
check('13. theme toggle control preserved', header.includes('id="themeToggle"'));
check('14. login/logout/mypage controls preserved',
  header.includes('id="open-login-btn"') && header.includes('id="logout-btn"') && header.includes('id="mypage-btn"'));
check('15. brand mark/logo link to home preserved unchanged',
  /<a class="brand-mark" href="\/" aria-label="MK Stock Lab 홈">/.test(header));

// ---------------------------------------------------------------------------
// Group 3: Navigation (16-22)
// ---------------------------------------------------------------------------
log('--- Group 3: Navigation (16-22) ---');
check('16. Nav.astro imports the shared NAV_ITEMS/isNavItemActive contract (no more inline duplicate list)',
  /import\s*\{\s*NAV_ITEMS,\s*isNavItemActive\s*\}\s*from\s*['"]\.\.\/lib\/shell\/navActiveLink['"]/.test(nav));
check('17a. navActiveLink.ts defines exactly 5 nav items', (navActiveLink.match(/label:\s*'[^']*'/g) || []).length === 5);
check('17b. navActiveLink.ts nav items are exactly Home/Chart AI/시장/Lab/포트폴리오 with the correct hrefs',
  /label:\s*'Home',\s*href:\s*'\/'/.test(navActiveLink) &&
    /label:\s*'Chart AI',\s*href:\s*'\/chart-ai'/.test(navActiveLink) &&
    /label:\s*'시장',\s*href:\s*'\/market'/.test(navActiveLink) &&
    /label:\s*'Lab',\s*href:\s*'\/lab'/.test(navActiveLink) &&
    /label:\s*'포트폴리오',\s*href:\s*'\/portfolio'/.test(navActiveLink));
check('18. /admin/operations never appears as an actual nav href/alias value (a comment may still mention it as a reminder)',
  !/href:\s*'\/admin\/operations'/.test(navActiveLink) && !/aliases:\s*\[[^\]]*'\/admin\/operations'/.test(navActiveLink) &&
    !/href=["']\/admin\/operations["']/.test(nav));
check('19a. /heatmap stays only a legacy alias of 시장, not its own nav entry',
  /aliases:\s*\[['"]\/heatmap['"]\]/.test(navActiveLink) && !/label:\s*['"]\s*Heatmap/i.test(navActiveLink));
check('19b. no NPS/Congress-specific or duplicate-market nav entries introduced', !/(국민연금|국회의원|Congress|NPS)/.test(navActiveLink) && !/label:\s*'시장'[\s\S]*label:\s*'시장'/.test(navActiveLink));
check('20. Nav.astro wires aria-current="page" on the active link',
  /aria-current=\{active \? ['"]page['"] : undefined\}/.test(nav));
check('21. style.css defines a nav-link focus-visible outline', /\.nav-link:focus-visible\s*\{/.test(STYLE_CSS));
check('22. style.css ties the active nav color/border treatment to aria-current, not just the .active class',
  /\.nav-link\.active,\s*\n\s*\.nav-link\[aria-current="page"\]/.test(STYLE_CSS));

// ---------------------------------------------------------------------------
// Group 4: Shared shell (23-28)
// ---------------------------------------------------------------------------
log('--- Group 4: Shared shell (23-28) ---');
check('23. icon-button/header-button focus-visible outline defined',
  /\.icon-button:focus-visible,\s*\n\s*\.header-button:focus-visible\s*\{/.test(STYLE_CSS));
check('24. brand-mark focus-visible outline defined', /\.brand-mark:focus-visible\s*\{/.test(STYLE_CSS));
check('25. feature-card and button-link (hero CTA) focus-visible outline defined',
  /\.button-link:focus-visible,\s*\n\s*\.feature-card:focus-visible\s*\{/.test(STYLE_CSS));
check('26. footer link focus-visible outline defined', /\.site-footer-links a:focus-visible\s*\{/.test(STYLE_CSS));
check('27. mobile header-button/icon-button touch targets raised to the 44px minimum',
  /@media \(max-width: 720px\)\s*\{[\s\S]{0,400}\.header-button\s*\{[^}]*min-height:\s*44px/.test(STYLE_CSS) &&
    /@media \(max-width: 720px\)\s*\{[\s\S]{0,400}\.icon-button\s*\{\s*width:\s*44px;\s*height:\s*44px;/.test(STYLE_CSS));
check('28. the existing page-shell min-width:0/max-width:100% containment list (chart-ai/market/lab/portfolio) was not narrowed',
  ['.chart-ai-shell', '.market-dashboard', '.lab-shell', '.portfolio-mvp', '.mp-page-layout'].every((sel) => STYLE_CSS.includes(sel)));

// ---------------------------------------------------------------------------
// Group 5: Home state components (29-40) — must remain contract-compliant, unchanged
// ---------------------------------------------------------------------------
log('--- Group 5: Home state components (29-40) ---');
check('29. HomeMarketNews.astro still owns a single fetch to /api/news/home.json', homeMarketNews.includes("fetch('/api/news/home.json')"));
check('30a. HomeMarketNews.astro keeps the 5-minute refresh interval', /REFRESH_MS = 5 \* 60 \* 1000/.test(homeMarketNews));
check('30b. HomeMarketNews.astro keeps the exact latest_available/last_good notice copy',
  homeMarketNews.includes('최신 업데이트가 없어 가장 최근에 확인된 시장 뉴스를 표시합니다.') &&
    homeMarketNews.includes('뉴스 업데이트가 지연되어 마지막으로 확인된 기사를 표시합니다.'));
check('31. HomeLiveMarketSnapshot.astro has no fetch of its own (pure event consumer)', !/fetch\s*\(/.test(homeLiveSnapshot));
check('32. HomeLiveMarketSnapshot.astro listens for the shared HOME_LIVE_MARKET_EVENT broadcast',
  /HOME_LIVE_MARKET_EVENT/.test(homeLiveSnapshot));
check('33. HomePortfolioPanel.astro maps only a confirmed 401 to the signed_out state',
  /401/.test(homePortfolioPanel) && /signed_out/.test(homePortfolioPanel));
check('34. HomePortfolioPanel.astro has a distinct signed_in_empty state for non-401 failures (no signed-out mislabel)',
  /signed_in_empty/.test(homePortfolioPanel));
check('35. HomeRetentionPanel.astro exists and makes no cross-device/other-user state claim', existsSync(HOME_RETENTION_PANEL) && !/다른\s*기기|다른\s*사용자/.test(homeRetentionPanel));
check('36. HomeMobileAd.astro stays hidden by default (no reserved blank space) until an active banner is confirmed',
  /style="display:\s*none"/.test(homeMobileAd));
check('37a. HomeRailAd.astro gates its carousel on 2+ active banners', /length\s*[<>=]=?\s*2|>=\s*2/.test(homeRailAd));
check('37b. HomeRailAd.astro respects prefers-reduced-motion', /prefers-reduced-motion/.test(homeRailAd));
check('38. index.astro still renders the five approved Home state components (no accidental removal)',
  // Phase 4F-UX1-A intentionally removed HomeRetentionPanel's render from index.astro (an
  // Owner-flagged unintended state-activated resume surface) while keeping the component file and
  // its backend intact -- see scripts/check_phase_4f_ux1a_home_surface_contract.mjs for the
  // dedicated regression guard on that removal.
  ['HomePortfolioPanel', 'HomeMobileAd', 'HomeLiveMarketSnapshot', 'HomeMarketNews', 'HomeRailAd'].every((c) => homePage.includes(`<${c} />`)));
check('39. index.astro home-shell/home-main-column/home-sidebar-column structure intact',
  homePage.includes('class="home-shell"') && homePage.includes('class="home-main-column"') && homePage.includes('class="home-sidebar-column"'));
check('40. Footer.astro Coupang ad block id/tracking code are byte-for-byte unchanged (non-goal: never touch commercial config)',
  /id:\s*977521,/.test(footer) && /trackingCode:\s*'AF7826180',/.test(footer));

// ---------------------------------------------------------------------------
// Group 6: 404 (41-46)
// ---------------------------------------------------------------------------
log('--- Group 6: 404 page (41-46) ---');
check('41. src/pages/404.astro exists', existsSync(NOT_FOUND));
check('42. 404.astro renders through the shared Layout', /import Layout from ['"]\.\.\/layouts\/Layout\.astro['"]/.test(notFound) && /<Layout/.test(notFound));
check('43. 404.astro has the exact required H1', notFound.includes('<h1>페이지를 찾을 수 없습니다</h1>'));
check('44. 404.astro has the exact required body copy', notFound.includes('요청하신 페이지가 없거나 주소가 변경되었습니다.'));
check('45. 404.astro links back to the home page', /href="\/"/.test(notFound));
check('46a. 404.astro links to the market page', /href="\/market"/.test(notFound));
check('46b. 404.astro makes no provider/auth/network call (no fetch/supabase reference outside of prose comments)',
  !/fetch\s*\(/.test(stripComments(notFound)) && !/supabase/i.test(stripComments(notFound)));

// ---------------------------------------------------------------------------
// Group 7: Vercel-only (47-50)
// ---------------------------------------------------------------------------
log('--- Group 7: Vercel-only policy (47-50) ---');
check('47. astro.config.mjs uses the Vercel adapter', /@astrojs\/vercel/.test(astroConfig) && /adapter:\s*vercel\(\)/.test(astroConfig));
check('48. astro.config.mjs has no Netlify adapter/config', !/netlify/i.test(astroConfig));
check('49. no netlify.toml exists at the repo root', !existsSync(NETLIFY_TOML));
check('50. the master roadmap documents the Vercel-only policy in place of the stale Netlify item',
  /Deployment policy is Vercel-only/.test(roadmap));

// ---------------------------------------------------------------------------
// Group 8: Security (51-55)
// ---------------------------------------------------------------------------
log('--- Group 8: Security (51-55) ---');
const secretShapedPattern = /sk-[A-Za-z0-9]{10,}|eyJ[A-Za-z0-9_-]{10,}|AIza[A-Za-z0-9_-]{10,}/;
check('51. no secret-shaped string introduced in the new/edited shell files',
  ![homePage, header, nav, footer, layout, notFound, navActiveLink, STYLE_CSS].some((src) => secretShapedPattern.test(src)));
check('52. footer ad script source URL is unchanged (no new/altered ad script endpoint)',
  footer.includes('https://ads-partners.coupang.com/g.js'));
check('53. no new environment-variable read introduced in the phase-4A-edited files (index/Header/Nav/404/navActiveLink)',
  ![homePage, header, nav, notFound, navActiveLink].some((src) => /import\.meta\.env|process\.env/.test(src)));
check('54. no new network/provider call introduced in 404.astro or navActiveLink.ts (outside of prose comments)',
  !/fetch\s*\(|supabase|kis|gnews/i.test(stripComments(notFound)) && !/fetch\s*\(|supabase|kis|gnews/i.test(stripComments(navActiveLink)));
check('55. the new package.json test scripts run local node scripts only (no remote/network commands)',
  typeof pkg.scripts?.['smoke:phase-4a-home-common-shell'] === 'string' &&
    /^node scripts\//.test(pkg.scripts?.['smoke:phase-4a-home-common-shell'] || '') &&
    typeof pkg.scripts?.['check:phase-4a-home-common-shell'] === 'string' &&
    /^node scripts\//.test(pkg.scripts?.['check:phase-4a-home-common-shell'] || ''));

// ---------------------------------------------------------------------------
// Group 9: package.json wiring
// ---------------------------------------------------------------------------
log('--- Group 9: package.json wiring ---');
check('package.json has smoke:phase-4a-home-common-shell script', typeof pkg.scripts?.['smoke:phase-4a-home-common-shell'] === 'string');
check('package.json has check:phase-4a-home-common-shell script', typeof pkg.scripts?.['check:phase-4a-home-common-shell'] === 'string');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('');
log(`Total: ${passes + failures} | Passed: ${passes} | Failed: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
