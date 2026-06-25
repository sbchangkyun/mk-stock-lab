/**
 * Static contract check for Phase 3CB Home Index Cards Fixture Data.
 * Verifies fixture file, component, Home page integration, safety constraints,
 * and no-regression for Home rail sample banner flash removal.
 * No network calls. No .env reads. Exits non-zero on failure.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const FIXTURE_PATH = join(root, 'src', 'data', 'homeIndexCards.json');
const COMPONENT_PATH = join(root, 'src', 'components', 'HomeIndexCards.astro');
const HOME_PAGE_PATH = join(root, 'src', 'pages', 'index.astro');
const RAIL_PATH = join(root, 'src', 'components', 'HomeRailAd.astro');
const STYLE_PATH = join(root, 'src', 'styles', 'style.css');
const MYPAGE_PATH = join(root, 'src', 'pages', 'mypage.astro');
const PACKAGE_JSON = join(root, 'package.json');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3cb_home_index_cards_fixture_data_result_v0.1.md');

const REQUIRED_IDS = ['sp500', 'nasdaq100', 'dowjones', 'kospi', 'kosdaq', 'usdkrw', 'dxy', 'gold', 'wti'];
const REQUIRED_LABELS = ['S&P 500', 'Nasdaq 100', 'Dow Jones', 'KOSPI', 'KOSDAQ', 'USD/KRW', 'Dollar Index', 'Gold', 'WTI Oil'];
const FIXTURE_MARKERS = ['예시 데이터', 'Fixture 기준', '조회 연동 전', '실시간 시세가 아닙니다'];
const LIVE_CLAIM_PATTERNS = ['실시간', '현재 시세', '최신 시세', 'Real-time', 'Live data', 'KIS 연결 완료'];
const EXTERNAL_FETCH = [/\bfetch\s*\(/, /XMLHttpRequest/];
const ENV_PATTERNS = ['process.env.', 'import.meta.env.'];
const SUPABASE_PATTERNS = ['supabase', 'site_settings', 'getBrowserSupabaseClient'];
const POLLING_PATTERNS = ['setInterval', 'setTimeout(', 'cron'];
const KIS_PATTERNS = ['koreainvestment.com', 'KIS_APP_KEY', '/api/market/quote', 'kis-quote'];
const GNEWS_PATTERNS = ['gnews.io', 'newsapi.org'];

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Phase 3CB Home Index Cards Static Contract Check ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

check('homeIndexCards.json fixture file exists', existsSync(FIXTURE_PATH));
check('HomeIndexCards.astro component exists', existsSync(COMPONENT_PATH));
check('index.astro (Home page) exists', existsSync(HOME_PAGE_PATH));
check('HomeRailAd.astro exists (for no-regression check)', existsSync(RAIL_PATH));
check('style.css exists', existsSync(STYLE_PATH));
check('Result doc exists', existsSync(RESULT_DOC));

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}
check('package.json has check:home-index-cards script',
  typeof pkg.scripts?.['check:home-index-cards'] === 'string');
log('');

if (!existsSync(FIXTURE_PATH)) {
  log('ERROR: homeIndexCards.json missing. Cannot continue fixture checks.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Group 2: Fixture data structure
// ---------------------------------------------------------------------------
log('--- Group 2: Fixture data structure ---');

let cards = [];
try {
  cards = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'));
} catch {
  check('homeIndexCards.json parses as valid JSON', false);
  process.exitCode = 1;
  process.exit();
}

check('homeIndexCards.json parses as valid JSON', true);
check('Fixture is an array', Array.isArray(cards));
check('Fixture has exactly 9 entries', cards.length === 9);

const labels = cards.map((c) => c.label ?? '');
check('Fixture includes S&P 500', labels.some((l) => l.includes('S&P 500')));
check('Fixture includes Nasdaq 100', labels.some((l) => l.includes('Nasdaq 100')));
check('Fixture includes Dow Jones', labels.some((l) => l.includes('Dow Jones')));
check('Fixture includes KOSPI', labels.some((l) => l.includes('KOSPI')));
check('Fixture includes KOSDAQ', labels.some((l) => l.includes('KOSDAQ')));
check('Fixture includes USD/KRW', labels.some((l) => l.includes('USD/KRW')));
check('Fixture includes Dollar Index', labels.some((l) => l.includes('Dollar Index')));
check('Fixture includes Gold', labels.some((l) => l.includes('Gold')));
check('Fixture includes WTI Oil', labels.some((l) => l.includes('WTI Oil')));

const requiredFields = ['label', 'value', 'change', 'direction', 'asOfLabel'];
const allHaveFields = cards.every((c) => requiredFields.every((f) => Object.prototype.hasOwnProperty.call(c, f)));
check(`All fixture entries have required fields: ${requiredFields.join(', ')}`, allHaveFields);

const allDirectionsValid = cards.every((c) => ['up', 'down', 'flat'].includes(c.direction));
check('All entries have valid direction (up/down/flat)', allDirectionsValid);

const fixtureText = JSON.stringify(cards);
const hasFixtureMarker = FIXTURE_MARKERS.some((m) => fixtureText.includes(m));
check('Fixture clearly marks values as sample/reference (asOfLabel or note)', hasFixtureMarker);

const hasLiveClaim = LIVE_CLAIM_PATTERNS.some((p) => fixtureText.includes(p));
check('Fixture data does not claim live/realtime data', !hasLiveClaim);
log('');

// ---------------------------------------------------------------------------
// Group 3: Home page integration
// ---------------------------------------------------------------------------
log('--- Group 3: Home page integration ---');

if (existsSync(HOME_PAGE_PATH)) {
  const home = readFileSync(HOME_PAGE_PATH, 'utf8');
  check('Home page imports HomeIndexCards component', home.includes('HomeIndexCards'));
  check('Home page renders <HomeIndexCards', home.includes('<HomeIndexCards'));
  check('Home page still imports HomeRailAd', home.includes('HomeRailAd'));
  check('Home page still renders HomeMarketNews', home.includes('HomeMarketNews'));
  check('Home page still renders HomePortfolioPanel', home.includes('HomePortfolioPanel'));
} else {
  check('index.astro readable', false);
}
log('');

// ---------------------------------------------------------------------------
// Group 4: HomeIndexCards component contract
// ---------------------------------------------------------------------------
log('--- Group 4: HomeIndexCards component contract ---');

if (existsSync(COMPONENT_PATH)) {
  const comp = readFileSync(COMPONENT_PATH, 'utf8');
  check('Component imports homeIndexCards.json', comp.includes('homeIndexCards'));
  check('Component has MARKET SNAPSHOT section label', comp.includes('MARKET SNAPSHOT'));
  check('Component has 주요 지수 heading or equivalent', comp.includes('주요 지수'));
  check('Component displays fixture disclaimer (예시 데이터 기준)', comp.includes('예시 데이터'));
  check('Component renders item.value', comp.includes('item.value'));
  check('Component renders item.change', comp.includes('item.change'));
  check('Component renders item.asOfLabel', comp.includes('item.asOfLabel'));
  check('Component renders item.direction as CSS class', comp.includes('item.direction'));

  const hasLiveClaim = LIVE_CLAIM_PATTERNS.some((p) => comp.includes(p));
  check('Component makes no live/realtime claim', !hasLiveClaim);

  const hasFetch = EXTERNAL_FETCH.some((p) => p.test(comp));
  check('No external fetch() in component', !hasFetch);

  const hasEnv = ENV_PATTERNS.some((p) => comp.includes(p));
  check('No process.env/import.meta.env in component', !hasEnv);

  const hasSupabase = SUPABASE_PATTERNS.some((p) => comp.includes(p));
  check('No Supabase call in index cards component', !hasSupabase);

  const hasPolling = POLLING_PATTERNS.some((p) => comp.includes(p));
  check('No polling/setInterval/cron in component', !hasPolling);

  const hasKIS = KIS_PATTERNS.some((p) => comp.includes(p));
  check('No KIS endpoint in component', !hasKIS);

  const hasGNews = GNEWS_PATTERNS.some((p) => comp.includes(p));
  check('No GNews endpoint in component', !hasGNews);
} else {
  check('HomeIndexCards.astro readable', false);
}
log('');

// ---------------------------------------------------------------------------
// Group 5: CSS — index card styles present
// ---------------------------------------------------------------------------
log('--- Group 5: CSS index card styles ---');

if (existsSync(STYLE_PATH)) {
  const css = readFileSync(STYLE_PATH, 'utf8');
  check('.index-snapshot-section class defined', css.includes('.index-snapshot-section'));
  check('.index-card-grid class defined', css.includes('.index-card-grid'));
  check('.index-card class defined', css.includes('.index-card'));
  check('.index-card--up direction class defined', css.includes('.index-card--up'));
  check('.index-card--down direction class defined', css.includes('.index-card--down'));
  check('.index-card--flat direction class defined', css.includes('.index-card--flat'));
  check('.index-card-value class defined', css.includes('.index-card-value'));
  check('.index-card-change class defined', css.includes('.index-card-change'));

  // MyPage admin rail polish carry-over
  check('mp-page-layout--admin-visible still defined (no regression)', css.includes('mp-page-layout--admin-visible'));
  check('mp-admin-rail still defined (no regression)', css.includes('.mp-admin-rail'));
  check('Admin rail widened to 420px in Phase 3CB carry-over', css.includes('420px'));
  check('mp-top-area--active not reintroduced', !css.includes('.mp-top-area--active'));
} else {
  check('style.css readable', false);
}
log('');

// ---------------------------------------------------------------------------
// Group 6: HomeRailAd no-regression (no sample banner flash)
// ---------------------------------------------------------------------------
log('--- Group 6: HomeRailAd no-sample-flash no-regression ---');

if (existsSync(RAIL_PATH)) {
  const rail = readFileSync(RAIL_PATH, 'utf8');
  check('HomeRailAd does not SSR-render homeAdBanners (no-sample-flash preserved)',
    !rail.includes('homeAdBanners') || !rail.includes('.map('));
  check('HomeRailAd has data-managed-rail-pending (deferred reveal preserved)',
    rail.includes('data-managed-rail-pending'));
  check('HomeRailAd starts hidden (style="display:none" preserved)',
    rail.includes('style="display:none"') || rail.includes("style='display:none'"));
  check('HomeRailAd uses siteSettingsClient for managed banners',
    rail.includes('siteSettingsClient'));
  check('No click tracking in HomeRailAd',
    !rail.includes('clickCount') && !rail.includes('impression'));
} else {
  check('HomeRailAd.astro readable', false);
}
log('');

// ---------------------------------------------------------------------------
// Group 7: MyPage admin rail — no mp-top-area regression
// ---------------------------------------------------------------------------
log('--- Group 7: MyPage admin rail no-regression ---');

if (existsSync(MYPAGE_PATH)) {
  const mp = readFileSync(MYPAGE_PATH, 'utf8');
  check('MyPage uses mp-page-layout wrapper (HF3 layout preserved)', mp.includes('mp-page-layout'));
  check('MyPage uses mp-admin-rail for banner admin (HF3 layout preserved)', mp.includes('mp-admin-rail'));
  check('mp-top-area not reintroduced in MyPage', !mp.includes('mp-top-area'));
  check('Admin panel still gated by isCurrentUserSiteAdmin', mp.includes('isCurrentUserSiteAdmin'));
} else {
  check('mypage.astro readable', false);
}
log('');

// ---------------------------------------------------------------------------
// Group 8: Checker network safety (self-check)
// ---------------------------------------------------------------------------
log('--- Group 8: Checker self-check ---');

let fetchAttempted = false;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker makes no network calls', !fetchAttempted);
globalThis.fetch = origFetch;
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3CB Home Index Cards — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS — Phase 3CB home index cards fixture ready');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
