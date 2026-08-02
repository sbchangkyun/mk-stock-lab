/**
 * Static contract check for Phase 3GL — Home Live Data and GNews.
 * Verifies the shared Home live-market orchestrator (closed 9-item registry, snapshot subset,
 * bounded concurrency, no new KIS endpoint/TR id, no new FX provider), the /api/home/live-market.json
 * route (closed query contract, cache headers), the new GNews provider (GNEWS_API_KEY-only, single
 * combined query, no fixture fallback, capped article count, TTL cache), the /api/news/home.json route,
 * and the three client components (no localStorage, no cache-bypass params, pause-when-hidden,
 * in-flight guard, XSS-safe rendering for untrusted GNews content). No network calls. No .env reads.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const HOME_LIVE_MARKET = join(root, 'src', 'lib', 'server', 'homeLiveMarket', 'homeLiveMarket.ts');
const LIVE_MARKET_ROUTE = join(root, 'src', 'pages', 'api', 'home', 'live-market.json.ts');
const GNEWS_PROVIDER = join(root, 'src', 'lib', 'server', 'homeNews', 'gnewsHomeNewsProvider.mjs');
const HOME_NEWS_ROUTE = join(root, 'src', 'pages', 'api', 'news', 'home.json.ts');
const KIS_CLIENT = join(root, 'src', 'lib', 'server', 'providers', 'kisClient.ts');
const KIS_SIGN_NORMALIZATION = join(root, 'src', 'lib', 'server', 'providers', 'kis', 'kisQuoteSignNormalization.ts');
const HOME_CONTROLLER = join(root, 'src', 'lib', 'home-live-market', 'homeLiveMarketController.ts');
const TICKER = join(root, 'src', 'components', 'Ticker.astro');
const HOME_SNAPSHOT = join(root, 'src', 'components', 'HomeLiveMarketSnapshot.astro');
const HOME_NEWS = join(root, 'src', 'components', 'HomeMarketNews.astro');
const HOME_PAGE = join(root, 'src', 'pages', 'index.astro');
const LAYOUT = join(root, 'src', 'layouts', 'Layout.astro');
const CROSS_ASSET_PROVIDER = join(root, 'src', 'lib', 'server', 'chart-ai', 'marketIntelligence', 'crossAssetProvider.mjs');
const PACKAGE_JSON = join(root, 'package.json');
const STYLE_CSS_PATH = join(root, 'src', 'styles', 'style.css');

const log = (msg) => process.stdout.write(msg + '\n');
let passes = 0;
let failures = 0;
const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};
const readOr = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');

log('=== Phase 3GL Home Live Data and GNews Static Contract ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');
for (const [name, path] of [
  ['homeLiveMarket.ts (orchestrator)', HOME_LIVE_MARKET],
  ['live-market.json.ts route', LIVE_MARKET_ROUTE],
  ['gnewsHomeNewsProvider.mjs', GNEWS_PROVIDER],
  ['home.json.ts route', HOME_NEWS_ROUTE],
  ['homeLiveMarketController.ts', HOME_CONTROLLER],
  ['Ticker.astro', TICKER],
  ['HomeLiveMarketSnapshot.astro', HOME_SNAPSHOT],
  ['HomeMarketNews.astro', HOME_NEWS],
  ['index.astro', HOME_PAGE],
  ['kisQuoteSignNormalization.ts (HF2)', KIS_SIGN_NORMALIZATION],
]) {
  check(`${name} exists`, existsSync(path));
}

const homeLiveMarket = readOr(HOME_LIVE_MARKET);
const liveMarketRoute = readOr(LIVE_MARKET_ROUTE);
const gnewsProvider = readOr(GNEWS_PROVIDER);
const homeNewsRoute = readOr(HOME_NEWS_ROUTE);
const kisClient = readOr(KIS_CLIENT);
const kisSignNormalization = readOr(KIS_SIGN_NORMALIZATION);
const homeController = readOr(HOME_CONTROLLER);
const ticker = readOr(TICKER);
const homeSnapshot = readOr(HOME_SNAPSHOT);
const homeNews = readOr(HOME_NEWS);
const homePage = readOr(HOME_PAGE);
const layout = readOr(LAYOUT);
const crossAssetProvider = readOr(CROSS_ASSET_PROVIDER);
const STYLE_CSS = readOr(STYLE_CSS_PATH);
let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}

// ---------------------------------------------------------------------------
// Group 2: Closed 9-item ticker registry + 4-item snapshot subset
// ---------------------------------------------------------------------------
log('--- Group 2: Closed ticker registry ---');
for (const id of ['sp500', 'nasdaq100', 'dowjones', 'kospi', 'kosdaq', 'usdkrw', 'dollarindex', 'gold', 'wti']) {
  check(`registry defines ticker id ${id}`, homeLiveMarket.includes(`id: '${id}'`));
}
for (const symbol of ['SPY', 'QQQ', 'DIA', '069500', '229200', 'UUP', 'GLD', 'USO']) {
  check(`registry references KIS symbol ${symbol}`, homeLiveMarket.includes(`'${symbol}'`));
}
check('registry defines exactly 9 entries (no client-controlled fan-out)', (homeLiveMarket.match(/\{ id: '/g) || []).length === 9);
check('every registry entry carries an honest proxyLabel disclosure field (never claims to be the literal index)', (homeLiveMarket.match(/proxyLabel:/g) || []).length >= 9);
check('usdkrw entry is FX kind, not KIS', /id:\s*'usdkrw',\s*label:\s*'원\/달러',\s*kind:\s*'fx'/.test(homeLiveMarket));
check(
  'Phase 3GL-HF3 §4: HOME_SNAPSHOT_IDS is the full 9-item closed registry, in the specified order',
  /HOME_SNAPSHOT_IDS\s*=\s*\[\s*'kospi',\s*'kosdaq',\s*'sp500',\s*'nasdaq100',\s*'dowjones',\s*'usdkrw',\s*'dollarindex',\s*'gold',\s*'wti'\s*\]/.test(homeLiveMarket),
);

// ---------------------------------------------------------------------------
// Group 3: Server orchestration — single shared resolution, reuse, no new KIS/FX surfaces
// ---------------------------------------------------------------------------
log('--- Group 3: Server orchestration boundary ---');
check('reuses fetchLongHistoryOhlcv (shared cached OHLCV orchestration)',
  /import\s*\{\s*fetchLongHistoryOhlcv\s*\}\s*from\s*['"]\.\.\/chart-ai\/universalOhlcvProvider['"]/.test(homeLiveMarket));
check('reuses findUniversalInstrument (shared instrument resolver)',
  homeLiveMarket.includes("import { findUniversalInstrument } from '../chart-ai/universal-instrument-search.mjs'"));
check('reuses fetchUsdKrwContext for FX (no new FX provider introduced)',
  /import\s*\{\s*fetchUsdKrwContext\s*,\s*fetchUsdKrwSparklineSeries\s*\}\s*from\s*['"]\.\.\/chart-ai\/marketIntelligence\/crossAssetProvider\.mjs['"]/.test(homeLiveMarket));
check('reuses the existing bounded-concurrency helper from marketDashboard.ts',
  homeLiveMarket.includes('mapWithConcurrency') && /from\s*['"]\.\.\/marketDashboard\/marketDashboard['"]/.test(homeLiveMarket));
check('CONCURRENCY_LIMIT = 3 (same bound as Phase 3GJ)', /CONCURRENCY_LIMIT\s*=\s*3/.test(homeLiveMarket));
check('imports the KIS transport client only for the two current-quote snapshot functions (§6), never the raw client',
  /import\s*\{\s*getKisDomesticQuoteSnapshot,\s*getKisOverseasQuoteSnapshot\s*\}\s*from\s*['"].*providers\/kisClient['"]/.test(homeLiveMarket));
check('never imports the raw kisClient default/namespace export (named quote-function imports only)',
  !/import\s+kisClient|import\s*\*\s*as\s*kisClient/.test(homeLiveMarket));
check('never references a KIS TR id or endpoint path literal', !/FHKST\d|\/uapi\//.test(homeLiveMarket));
check('exposes a deps-injection seam (getHomeLiveMarket accepts deps)',
  /getHomeLiveMarket\s*=\s*async\s*\(/.test(homeLiveMarket) && /deps:\s*Partial<HomeLiveMarketDeps>/.test(homeLiveMarket));
check('deps-injection seam covers both quote functions (getKisDomesticQuoteSnapshot, getKisOverseasQuoteSnapshot)',
  /getKisDomesticQuoteSnapshot/.test(homeLiveMarket) && /getKisOverseasQuoteSnapshot/.test(homeLiveMarket) && homeLiveMarket.includes('HomeLiveMarketDeps'));
check('a failed item degrades to status unavailable with null fields, never a fabricated value',
  /status:\s*['"]unavailable['"]/.test(homeLiveMarket) && /price:\s*null/.test(homeLiveMarket));
check('a total failure (0 resolved) maps to MARKET_DATA_UNAVAILABLE via the shared sanitized error codes',
  homeLiveMarket.includes('MARKET_DASHBOARD_SANITIZED_ERROR_CODES.MARKET_DATA_UNAVAILABLE'));
check('snapshot is never a literal empty array (both branches derive it from buildSnapshot)',
  !/snapshot:\s*\[\]/.test(homeLiveMarket));
{
  const snapshotAssignIdx = homeLiveMarket.search(/const\s+snapshot\s*=\s*buildSnapshot\(ticker\)/);
  const branchIdx = homeLiveMarket.search(/successfulCount\s*===\s*0/);
  check('snapshot is computed via buildSnapshot(ticker) once, before the total-failure branch splits (§9)',
    snapshotAssignIdx >= 0 && branchIdx >= 0 && snapshotAssignIdx < branchIdx);
  check('both the total-failure and success return objects reuse that same snapshot variable (shorthand, never re-literalized)',
    (homeLiveMarket.match(/\bsnapshot,/g) || []).length >= 2);
}
check('buildSnapshot derives a fixed-length 9-item array from the closed HOME_SNAPSHOT_IDS registry (never narrows on partial failure)',
  /HOME_SNAPSHOT_IDS\.map/.test(homeLiveMarket));
check('crossAssetProvider.mjs (the reused FX source) was not modified to add a second FX endpoint',
  crossAssetProvider.includes("const FX_BASE = 'https://api.frankfurter.dev/v1'") && (crossAssetProvider.match(/https?:\/\/[^'"\s]+/g) || []).every((u) => u.includes('frankfurter')));

// ---------------------------------------------------------------------------
// Group 3b: Quote-first resolution order (§6/§7) — current-quote is tried before the OHLCV
// fallback, sequentially (never concurrently) per item, never retried.
// ---------------------------------------------------------------------------
log('--- Group 3b: Quote-first resolution order ---');
check('declares the closed HomeDataBasis enum (current_quote | latest_close | reference_fx | unavailable)',
  /HomeDataBasis\s*=\s*['"]current_quote['"]\s*\|\s*['"]latest_close['"]\s*\|\s*['"]reference_fx['"]\s*\|\s*['"]unavailable['"]/.test(homeLiveMarket));
check('declares the closed HomeFreshness enum (fresh | cached | stale | unavailable)',
  /HomeFreshness\s*=\s*['"]fresh['"]\s*\|\s*['"]cached['"]\s*\|\s*['"]stale['"]\s*\|\s*['"]unavailable['"]/.test(homeLiveMarket));
{
  const resolverMatch = homeLiveMarket.match(/resolveKisTickerItem[\s\S]*?(?=\nconst\s+\w+\s*=|\nexport\s+const)/);
  const resolverBody = resolverMatch ? resolverMatch[0] : '';
  const quoteCallIdx = resolverBody.search(/deps\.getKis(?:Domestic|Overseas)QuoteSnapshot/);
  const historyCallIdx = resolverBody.search(/deps\.fetchLongHistoryOhlcv/);
  const headlineIdx = resolverBody.search(/const\s+headline\s*=\s*quoteOk/);
  check('resolveKisTickerItem calls the current-quote function before the OHLCV history fetch (textual order)',
    quoteCallIdx >= 0 && historyCallIdx >= 0 && quoteCallIdx < historyCallIdx);
  check('resolveKisTickerItem never combines the quote call and the OHLCV fetch via Promise.all/Promise.race (sequential only)',
    !/Promise\.(all|race)\(\s*\[[\s\S]{0,200}(?:getKisDomesticQuoteSnapshot|getKisOverseasQuoteSnapshot|fetchLongHistoryOhlcv)/.test(resolverBody));
  check('resolveKisTickerItem fetches OHLCV history unconditionally (before the quoteOk headline branch), never gated behind a quote-failure check (Phase 3GL-HF3 §6)',
    historyCallIdx >= 0 && headlineIdx >= 0 && historyCallIdx < headlineIdx &&
    !/if\s*\(\s*!?\s*quoteOk\s*\)[\s\S]{0,120}fetchLongHistoryOhlcv/.test(resolverBody));
}
check('a successful quote resolves its headline via toCurrentQuoteItem, while the unconditionally-fetched OHLCV history only feeds the independent sparkline and never the headline price (Phase 3GL-HF3 §6)',
  /const\s+headline\s*=\s*quoteOk\s*\?\s*toCurrentQuoteItem\(entry,\s*quoteResult\.data\)\s*:\s*buildOhlcvFallbackItem\(/.test(homeLiveMarket));

// ---------------------------------------------------------------------------
// Group 4: /api/home/live-market.json route — closed contract, honest cache headers
// ---------------------------------------------------------------------------
log('--- Group 4: live-market.json route ---');
check('route is server-rendered (prerender = false)', /export const prerender = false/.test(liveMarketRoute));
check('route reads zero query parameters (closed server-side registry only, no client-controlled symbol)',
  !/searchParams\.get\(/.test(liveMarketRoute));
check('route reuses the existing Phase 3GJ market-dashboard Production exception (no new env var)',
  liveMarketRoute.includes('allowProductionMarketDashboardLiveData: true'));
check('route never enables the Chart AI beta exception', !liveMarketRoute.includes('allowProductionChartAiBetaLiveQuotes'));
check('success responses use a documented short cache-control window', /s-maxage=45, stale-while-revalidate=45/.test(liveMarketRoute));
check('error/unavailable responses use no-store', liveMarketRoute.includes("NO_STORE = 'no-store'"));
check('route rejects non-GET methods (ALL handler)', liveMarketRoute.includes('export const ALL'));
check('route never calls a KIS transport function directly (readiness check only)',
  !/getKisDomesticQuoteSnapshot|getKisOverseasQuoteSnapshot|getKisDailyOhlcSeries|getKisOverseasDailyOhlcSeries/.test(liveMarketRoute));
check('route response never includes a raw provider payload/header/token field',
  !/accessToken|Authorization|rawPayload|providerHeader|kis-token/i.test(liveMarketRoute));

// ---------------------------------------------------------------------------
// Group 5: GNews provider — key handling, single combined query, no fixture fallback
// ---------------------------------------------------------------------------
log('--- Group 5: gnewsHomeNewsProvider.mjs ---');
check('provider never reads process.env or import.meta.env directly (key is always injected by the caller)',
  !/process\.env|import\.meta\.env/.test(gnewsProvider));
check('provider defines exactly one combined query string (no per-category multi-query fan-out)',
  (gnewsProvider.match(/const COMBINED_QUERY/g) || []).length === 1 && !/GNEWS_QUERY_DEFINITIONS/.test(gnewsProvider));
check('caps output to at most 6 articles', /MAX_ARTICLES\s*=\s*6/.test(gnewsProvider));
check('cache TTL is 5 minutes', /HOME_NEWS_TTL_MS\s*=\s*5\s*\*\s*60\s*\*\s*1000/.test(gnewsProvider));
check('absent/empty key returns NEWS_NOT_CONFIGURED, never a fixture fallback (no fixture import)',
  gnewsProvider.includes('NEWS_NOT_CONFIGURED') && !/import[^\n]*fixture/i.test(gnewsProvider) && !/const\s+\w*[Ff]ixture\w*\s*=/.test(gnewsProvider));
check('provider never requests/stores the full article content field',
  !/\bcontent\b\s*:/.test(gnewsProvider.replace(/\/\*[\s\S]*?\*\//g, '')));
check('normalizeGnewsHomeArticle rejects a missing/empty or over-length title (never fabricates a headline)',
  /if\s*\(!title\s*\|\|\s*title\.length\s*>\s*MAX_TITLE_LEN\)\s*return null/.test(gnewsProvider));
check('normalizeGnewsHomeArticle rejects a url that fails the safe-http-url gate (missing, malformed, or non-http(s))',
  /if\s*\(!isSafeHttpUrl\(url,\s*MAX_URL_LEN\)\)\s*return null/.test(gnewsProvider));
check('normalizeGnewsHomeArticle rejects a missing or unparseable publishedAt (§10 hardening)',
  /if\s*\(!isValidIsoDate\(publishedAt\)\)\s*return null/.test(gnewsProvider));
check('defines a closed set of length bounds: MAX_TITLE_LEN=240, MAX_DESCRIPTION_LEN=600, MAX_SOURCE_NAME_LEN=120, MAX_URL_LEN=2048',
  /MAX_TITLE_LEN\s*=\s*240/.test(gnewsProvider) &&
  /MAX_DESCRIPTION_LEN\s*=\s*600/.test(gnewsProvider) &&
  /MAX_SOURCE_NAME_LEN\s*=\s*120/.test(gnewsProvider) &&
  /MAX_URL_LEN\s*=\s*2048/.test(gnewsProvider));
check('isSafeHttpUrl only accepts a bounded-length, well-formed http(s) URL (rejects javascript:/ftp: and other protocols)',
  /isSafeHttpUrl\s*=\s*\([\s\S]{0,300}parsed\.protocol\s*===\s*['"]http:['"]\s*\|\|\s*parsed\.protocol\s*===\s*['"]https:['"]/.test(gnewsProvider));
check('isValidIsoDate rejects a non-parseable date string (Date.parse yields NaN)',
  /isValidIsoDate\s*=\s*\([\s\S]{0,200}Date\.parse/.test(gnewsProvider) && /Number\.isFinite\(ms\)/.test(gnewsProvider));
check('optional image url is dropped (set to null) rather than passed through when unsafe',
  /image\s*=\s*isSafeHttpUrl\(rawImage,\s*MAX_URL_LEN\)\s*\?\s*rawImage\s*:\s*null/.test(gnewsProvider));
check('optional source url is dropped (set to null) rather than passed through when unsafe',
  /sourceUrl\s*=\s*isSafeHttpUrl\(rawSourceUrl,\s*MAX_URL_LEN\)\s*\?\s*rawSourceUrl\s*:\s*null/.test(gnewsProvider));
check('description is truncated (not rejected) when it exceeds MAX_DESCRIPTION_LEN',
  /truncate\(rawDescription,\s*MAX_DESCRIPTION_LEN\)/.test(gnewsProvider));
check('source name is truncated (not rejected) when it exceeds MAX_SOURCE_NAME_LEN',
  /truncate\(rawSourceName,\s*MAX_SOURCE_NAME_LEN\)/.test(gnewsProvider));
check('exports the closed HOME_NEWS_CATEGORIES enum (6 categories)',
  /HOME_NEWS_CATEGORIES\s*=\s*\[[\s\S]{0,200}\]/.test(gnewsProvider) &&
  ['DOMESTIC_STOCKS', 'OVERSEAS_STOCKS', 'FX', 'MACRO', 'COMMODITIES', 'GENERAL_MARKET'].every((c) => gnewsProvider.includes(c)));
check('dedupeAndRankHomeArticles sorts newest-first and dedupes by canonical url and title',
  gnewsProvider.includes('export const dedupeAndRankHomeArticles') && gnewsProvider.includes('seenUrls') && gnewsProvider.includes('seenTitles'));
check('canonicalizeUrl strips known tracking params before using the url as a dedup key',
  gnewsProvider.includes('TRACKING_PARAMS') && gnewsProvider.includes('utm_source'));
check('provider module has bounded request timeout (AbortController)', gnewsProvider.includes('AbortController') && /GNEWS_TIMEOUT_MS\s*=\s*\d+/.test(gnewsProvider));
check('provider never throws a raw provider error out to the caller (returns a sanitized code shape)',
  /catch\s*\{\s*return\s*\{\s*ok:\s*false,\s*code:\s*'NEWS_PROVIDER_ERROR'\s*\}/.test(gnewsProvider));

// ---------------------------------------------------------------------------
// Group 6: /api/news/home.json route — GNEWS_API_KEY only, no PUBLIC_ fallback
// ---------------------------------------------------------------------------
log('--- Group 6: home.json (GNews) route ---');
check('route is server-rendered (prerender = false)', /export const prerender = false/.test(homeNewsRoute));
check('route reads only GNEWS_API_KEY, never a PUBLIC_ fallback (must not reach the client bundle)',
  homeNewsRoute.includes("readServerEnvValue('GNEWS_API_KEY')") && !homeNewsRoute.includes('PUBLIC_GNEWS_API_KEY'));
check('route reads zero query parameters (no client-controlled input)', !/searchParams\.get\(/.test(homeNewsRoute));
check('success responses use the documented cache-control (s-maxage=300, stale-while-revalidate=900)',
  homeNewsRoute.includes('s-maxage=300, stale-while-revalidate=900'));
check('error/unavailable responses use no-store', homeNewsRoute.includes("NO_STORE = 'no-store'"));
check('route rejects non-GET methods (ALL handler)', homeNewsRoute.includes('export const ALL'));
check('route never logs or embeds the raw api key value in a response', !/console\.(log|error|warn)\([^)]*apiKey/.test(homeNewsRoute));

// ---------------------------------------------------------------------------
// Group 7: Client-side data ownership — Phase 3GL-HF1 §5 unifies Ticker + Snapshot behind ONE
// controller (Layout.astro-mounted, site-wide); HomeMarketNews keeps owning its own fetch (§12).
// ---------------------------------------------------------------------------
log('--- Group 7: homeLiveMarketController.ts (the single Home market fetch owner) ---');
check('fetches the shared live-market route exactly once per module (single fetch call)', (homeController.match(/fetch\(/g) || []).length === 1);
check('fetches /api/home/live-market.json specifically', homeController.includes("fetch('/api/home/live-market.json')"));
check('refreshes on a 60s interval', /REFRESH_MS\s*=\s*60_000/.test(homeController));
check('uses a recursive setTimeout refresh loop (never setInterval polling)', !homeController.includes('setInterval') && homeController.includes('window.setTimeout'));
check('guards against overlapping in-flight requests', /inFlight/.test(homeController));
check('pauses/resumes on document visibility change', homeController.includes('document.hidden') && homeController.includes('visibilitychange'));
check('never persists market data to localStorage', !/localStorage\.setItem/.test(homeController));
check('never appends a cache-bypass/force-refresh query parameter', !/[?&](forceRefresh|bypassCache|refresh|_ts|cacheBust)=/i.test(homeController));
check('is idempotent per page-load via a module-level started flag (not a DOM dataset guard, since it is not tied to one element)',
  /let\s+started\s*=\s*false/.test(homeController) && /if\s*\(started\)\s*return;/.test(homeController));
check('exports the HOME_LIVE_MARKET_EVENT CustomEvent name', /HOME_LIVE_MARKET_EVENT\s*=\s*['"]mk-home-live-market['"]/.test(homeController));
check('broadcasts every fetch outcome (success or failure) via that CustomEvent on window', /window\.dispatchEvent\(new CustomEvent/.test(homeController));
check('exports getLatestHomeLiveMarketPayload for consumers that mount after the first fetch resolved', homeController.includes('export const getLatestHomeLiveMarketPayload'));
check('exports the single entry point startHomeLiveMarketController', homeController.includes('export const startHomeLiveMarketController'));

log('--- Group 7: Ticker.astro / HomeLiveMarketSnapshot.astro — pure event consumers, no fetch/timer/listener of their own ---');
for (const [name, src] of [['Ticker.astro', ticker], ['HomeLiveMarketSnapshot.astro', homeSnapshot]]) {
  check(`${name}: owns no fetch call of its own (consumes the controller's broadcast instead)`, !/fetch\(/.test(src));
  check(`${name}: owns no setTimeout/setInterval refresh timer of its own`, !/setTimeout|setInterval/.test(src));
  check(`${name}: owns no inFlight guard of its own`, !/inFlight/.test(src));
  if (name === 'HomeLiveMarketSnapshot.astro') {
    check(`${name}: owns no visibilitychange listener of its own`, !/visibilitychange/.test(src));
  }
  check(`${name}: imports HOME_LIVE_MARKET_EVENT and getLatestHomeLiveMarketPayload from the shared controller`,
    /from\s*['"]\.\.\/lib\/home-live-market\/homeLiveMarketController['"]/.test(src) &&
    src.includes('HOME_LIVE_MARKET_EVENT') && src.includes('getLatestHomeLiveMarketPayload'));
  check(`${name}: listens for the shared broadcast via window.addEventListener(HOME_LIVE_MARKET_EVENT, ...)`,
    /window\.addEventListener\(\s*HOME_LIVE_MARKET_EVENT/.test(src));
  check(`${name}: renders the already-resolved payload immediately on mount (handles late-mount after first fetch)`,
    src.includes('getLatestHomeLiveMarketPayload()'));
  check(`${name}: wires its own render setup via astro:page-load with an idempotent ready guard`,
    src.includes("addEventListener('astro:page-load'") && src.includes("dataset.ready === 'true'"));
}
check('Ticker.astro: its own visibilitychange listener (Phase 3GL-HF3 §3) only toggles the CSS pause class in its callback body, never fetches/re-renders market data or duplicates the shared controller\'s listener',
  /document\.addEventListener\(\s*['"]visibilitychange['"]\s*,\s*\(\)\s*=>\s*\{\s*rail\.classList\.toggle\(\s*['"]ticker-rail--paused['"][^)]*\)\s*;\s*\}\s*\)\s*;/.test(ticker));
check('Ticker.astro reads the ticker field of the broadcast payload', ticker.includes('payload.ticker'));
check('HomeLiveMarketSnapshot.astro reads the snapshot field of the broadcast payload (no duplicate provider call)', homeSnapshot.includes('payload.snapshot'));
check('HomeLiveMarketSnapshot.astro renders an honest unavailable state, never a fabricated card', homeSnapshot.includes('data-home-snapshot-unavailable'));

log('--- Group 7: Layout.astro wires the single controller site-wide ---');
check('imports startHomeLiveMarketController from the shared controller module',
  /import\s*\{\s*startHomeLiveMarketController\s*\}\s*from\s*['"]\.\.\/lib\/home-live-market\/homeLiveMarketController['"]/.test(layout));
check('wires it to astro:page-load (repeat navigations)', /addEventListener\(\s*['"]astro:page-load['"]\s*,\s*startHomeLiveMarketController\s*\)/.test(layout));
check('also calls it directly (first paint, before any astro:page-load event fires)', layout.includes('startHomeLiveMarketController();'));

log('--- Group 7: HomeMarketNews.astro — still owns its own fetch/timer/listener (§12), no polling beyond documented refresh ---');
{
  const name = 'HomeMarketNews.astro';
  const src = homeNews;
  check(`${name}: fetches its route exactly once per script (single script-level fetch call)`, (src.match(/fetch\(/g) || []).length === 1);
  check(`${name}: uses a recursive setTimeout refresh loop (never setInterval polling)`, !src.includes('setInterval') && src.includes('window.setTimeout'));
  check(`${name}: never persists news data to localStorage`, !/localStorage\.setItem/.test(src));
  check(`${name}: never appends a cache-bypass/force-refresh query parameter`, !/[?&](forceRefresh|bypassCache|refresh|_ts|cacheBust)=/i.test(src));
  check(`${name}: guards against overlapping in-flight requests`, /inFlight/.test(src));
  check(`${name}: pauses/resumes on document visibility change`, src.includes('document.hidden') && src.includes('visibilitychange'));
  check(`${name}: wires setup via astro:page-load with an idempotent ready guard`, src.includes("addEventListener('astro:page-load'") && src.includes("dataset.ready === 'true'"));
  check(`${name}: refreshes on a 5-minute interval`, /REFRESH_MS\s*=\s*5\s*\*\s*60\s*\*\s*1000/.test(src));
  check(`${name}: fetches the dedicated GNews route`, src.includes("fetch('/api/news/home.json')"));
  check(`${name}: renders an honest empty state, never a fabricated article`, src.includes('data-home-news-empty'));
}

log('--- Group 7: HomeMarketNews.astro §12 hardening — no fixed 15s retry, delayed-status distinct from first-load-failure ---');
check('never hardcodes a 15-second retry delay (no RETRY_DELAY_MS / 15000 / 15_000 literal)',
  !/RETRY_DELAY_MS/.test(homeNews) && !/\b15000\b/.test(homeNews) && !/\b15_000\b/.test(homeNews));
check('renders a distinct "delayed" status element (data-home-news-delayed), separate from the empty/unavailable element', homeNews.includes('data-home-news-delayed'));
check('tracks hasRenderedOnce to distinguish a first-load failure from a failure after a successful render', /hasRenderedOnce/.test(homeNews));
check('a post-success failure preserves the already-rendered articles (does not clear the grid) and instead shows the delayed notice',
  /if\s*\(hasRenderedOnce\)\s*\{[\s\S]{0,350}delayed\?\.classList\.remove\(['"]hidden['"]\)/.test(homeNews) &&
  !/if\s*\(hasRenderedOnce\)\s*\{[\s\S]{0,350}grid\?\.innerHTML\s*=\s*['"]['"]/.test(homeNews));

log('--- Group 7b: HomeMarketNews XSS-safety (untrusted external GNews content) ---');
check('defines an escapeHtml helper applied before innerHTML insertion', homeNews.includes('const escapeHtml'));
check('escapes title, source, and badge before building the card markup',
  /escapeHtml\(CATEGORY_LABELS\[article\.category\][\s\S]{0,20}\)/.test(homeNews) &&
  /escapeHtml\(article\.sourceName/.test(homeNews) &&
  /escapeHtml\(article\.title\)/.test(homeNews));
check('defines an isSafeHttpUrl guard restricting rendered href to http(s) only', homeNews.includes('const isSafeHttpUrl'));
check('gates the rendered href through isSafeHttpUrl (never trusts a raw provider url scheme)',
  /isSafeHttpUrl\(article\.url\)\s*\?\s*article\.url\s*:\s*''/.test(homeNews));
check('escapes the href itself when interpolated into the markup string', /href="\$\{escapeHtml\(href\)\}"/.test(homeNews));
check('HomeMarketNews no longer accepts an articles prop (owns its own fetching now)', !/Astro\.props/.test(homeNews.split('<script>')[0]));

// ---------------------------------------------------------------------------
// Group 8: Home page wiring — old fixture/SSR fetch retired
// ---------------------------------------------------------------------------
log('--- Group 8: Home page wiring ---');
check('index.astro renders HomeLiveMarketSnapshot', homePage.includes('HomeLiveMarketSnapshot'));
check('index.astro renders HomeMarketNews with no props (component owns its own data now)',
  /<HomeMarketNews\s*\/>/.test(homePage));
check('index.astro no longer performs an SSR fetch to the old fixture-first market-feed route', !homePage.includes('/api/news/market-feed'));
check('index.astro no longer performs a separate SSR call to /api/market/overview.json', !homePage.includes('/api/market/overview.json'));
check('index.astro frontmatter has no leftover try/fetch news-loading logic', !/newsArticles/.test(homePage));

// ---------------------------------------------------------------------------
// Group 9: No prohibited surfaces introduced
// ---------------------------------------------------------------------------
log('--- Group 9: No prohibited surfaces ---');
const allNewServerCode = [homeLiveMarket, liveMarketRoute, gnewsProvider, homeNewsRoute].join('\n');
check('no order/balance/trading/account endpoint reference', !/\/api\/(?:kis-)?(?:order|trade|balance|account)/i.test(allNewServerCode));
check('no KIS_ACCOUNT_NO reference in the new server code', !allNewServerCode.includes('KIS_ACCOUNT_NO'));
check('no external LLM client import', !/openai|gemini|anthropic/i.test(allNewServerCode));
check('no second general stock-market data provider introduced', !/yfinance|alpha_?vantage|polygon\.io|finnhub/i.test(allNewServerCode));
check('no Supabase migration file referenced or added by this phase\'s new server code', !/supabase\/migrations/.test(allNewServerCode));
check('the new server code never contains a literal API key value (only the env var name)',
  !/apikey['"]?\s*[:=]\s*['"][A-Za-z0-9_-]{16,}['"]/.test(allNewServerCode));

// ---------------------------------------------------------------------------
// Group 11: Phase 3GL-HF2 — KIS quote direction normalization (§3-§7)
// ---------------------------------------------------------------------------
log('--- Group 11: KIS quote direction normalization (HF2) ---');
check(
  'kisQuoteSignNormalization.ts exports normalizeKisQuoteSign (the single shared sign helper)',
  /export const normalizeKisQuoteSign/.test(kisSignNormalization),
);
check(
  'the sign helper input/output shape never includes a price field (it only ever resolves change/changePct)',
  !/price\s*:/.test(kisSignNormalization),
);
check(
  'the sign helper uses the documented 5-value KIS sign-code convention (1 upper-limit-up, 2 up, 3 unchanged, 4 lower-limit-down, 5 down)',
  /'1':\s*1/.test(kisSignNormalization) && /'2':\s*1/.test(kisSignNormalization) && /'3':\s*0/.test(kisSignNormalization) &&
    /'4':\s*-1/.test(kisSignNormalization) && /'5':\s*-1/.test(kisSignNormalization),
);
check('kisClient.ts imports the shared sign helper (no duplicated ad hoc sign logic)', /import\s*\{\s*normalizeKisQuoteSign\s*\}\s*from\s*['"]\.\/kis\/kisQuoteSignNormalization['"]/.test(kisClient));
check(
  'kisClient.ts uses the helper in both the domestic and overseas quote functions (never a second bespoke sign implementation)',
  (kisClient.match(/normalizeKisQuoteSign\(/g) || []).length === 2,
);
check(
  'getKisDomesticQuoteSnapshot parses the official prdy_vrss_sign direction code',
  /prdy_vrss_sign/.test(kisClient),
);
check(
  'getKisDomesticQuoteSnapshot never maps prdy_vrss/prdy_ctrt directly to change/changePct without going through the sign helper',
  !/change:\s*parseNumericText\(payload\.output\.prdy_vrss\)/.test(kisClient),
);
check(
  'getKisDomesticQuoteSnapshot cross-checks price against stck_sdpr (previous close) before trusting the resolved change amount',
  /stck_sdpr/.test(kisClient) && /previousClose/.test(kisClient) && /expectedChange/.test(kisClient),
);
check(
  'the price/previous-close consistency check nulls only the change field on conflict (changePct and price stay usable)',
  /change\s*=\s*null;/.test(kisClient) && !/changePct\s*=\s*null;/.test(kisClient),
);
check('getKisOverseasQuoteSnapshot parses the official overseas sign direction code', /overseasSignCode/.test(kisClient) && /payload\.output\.sign/.test(kisClient));
check(
  'getKisOverseasQuoteSnapshot no longer maps diff/rate directly to change/changePct (the root cause of the observed sign-contradiction bug)',
  !/change:\s*parseNumericText\(payload\.output\.diff\)/.test(kisClient) && !/changePct:\s*parseNumericText\(payload\.output\.rate\)/.test(kisClient),
);
check(
  'getKisOverseasQuoteSnapshot builds its QuoteSnapshot from the normalized sign result, not the raw diff/rate fields',
  /change:\s*normalizedOverseasSign\.change/.test(kisClient) && /changePct:\s*normalizedOverseasSign\.changePct/.test(kisClient),
);

log('--- Group 11: Home-layer defensive contradiction safety net + honest basis wording (§7-§8) ---');
check(
  'homeLiveMarket.ts no longer claims real-time delivery in the current-quote basis label',
  !homeLiveMarket.includes('실시간(지연) 시세 기준'),
);
check(
  'homeLiveMarket.ts uses the corrected 현재가 조회 기준 basis wording',
  /CURRENT_QUOTE_BASIS_TEXT\s*=\s*'[^']*현재가 조회 기준'/.test(homeLiveMarket),
);
check(
  'toCurrentQuoteItem compares Math.sign(changeAmount) against Math.sign(changePct) before trusting a non-null pair',
  /Math\.sign\(changeAmount\)\s*!==\s*Math\.sign\(changePct\)/.test(homeLiveMarket),
);
check(
  'the Home-layer safety net nulls changeAmount on conflict, never changePct (matches §7 exactly)',
  /changeAmount:\s*directionsConflict\s*\?\s*null\s*:\s*changeAmount/.test(homeLiveMarket) &&
    !/changePct:\s*directionsConflict\s*\?\s*null/.test(homeLiveMarket),
);

log('--- Group 11: GNews empty-feed diagnostics + zero-result contract (§9-§11) ---');
check(
  'gnewsHomeNewsProvider.mjs computes all three sanitized diagnostic counters',
  /providerArticleCount/.test(gnewsProvider) && /normalizedArticleCount/.test(gnewsProvider) && /returnedArticleCount/.test(gnewsProvider),
);
check(
  'diagnostics counters are plain integers derived from array lengths, never raw article content',
  /providerArticleCount\s*=\s*result\.articles\.length/.test(gnewsProvider) &&
    /normalizedArticleCount\s*=\s*normalized\.length/.test(gnewsProvider) &&
    /returnedArticleCount\s*=\s*articles\.length/.test(gnewsProvider),
);
check('a zero-return feed reports the honest NEWS_NO_RESULTS code (never an indistinguishable ok:true with an empty array)', /NEWS_NO_RESULTS/.test(gnewsProvider));
check(
  'the zero-result branch is keyed on returnedArticleCount === 0 (post-normalization, not just a raw-provider-empty check)',
  /returnedArticleCount\s*===\s*0/.test(gnewsProvider),
);
check('a NEWS_NO_RESULTS outcome is cached like a success (preserves the one-request-per-window invariant)', /cache\s*=\s*\{\s*value,\s*storedAtMs:\s*now\(\)\s*\}/.test(gnewsProvider));
check(
  'the combined query is the simplified conservative 8-term set (§10), not the old 16-term expression',
  gnewsProvider.includes("'코스피 OR 코스닥 OR 국내증시 OR 뉴욕증시 OR 나스닥 OR 환율 OR 금리 OR 유가'"),
);
check('home.json.ts route surfaces diagnostics on success responses', /diagnostics:\s*result\.diagnostics/.test(homeNewsRoute));
check(
  'home.json.ts route only attaches diagnostics to an error response when present (never fabricates one for NEWS_NOT_CONFIGURED/NEWS_UNAUTHORIZED/etc)',
  /result\.diagnostics\s*\n?\s*\?\s*\{[\s\S]{0,80}diagnostics:\s*result\.diagnostics/.test(homeNewsRoute),
);
check(
  'no diagnostics-related code path ever references a raw article title/content/query/api-key field',
  !/diagnostics[\s\S]{0,10}(apiKey|COMBINED_QUERY|rawArticle|\.title\b|\.content\b)/.test(gnewsProvider) &&
    !/diagnostics[\s\S]{0,10}(apiKey|rawArticle|\.title\b|\.content\b)/.test(homeNewsRoute),
);

// ---------------------------------------------------------------------------
// Group 12: Phase 3GL-HF3 — rolling ticker belt + 9-card Snapshot sparklines
// ---------------------------------------------------------------------------
log('--- Group 12: HF3 §5-§7 server-side sparkline contract ---');
check('declares the closed HomeSparklineStatus/HomeSparklineBasis enums and a HomeSparklineFields shape carrying them',
  /HomeSparklineStatus\s*=\s*['"]ok['"]\s*\|\s*['"]unavailable['"]/.test(homeLiveMarket) &&
    /HomeSparklineBasis\s*=\s*['"]daily_close['"]\s*\|\s*['"]reference_fx['"]\s*\|\s*['"]unavailable['"]/.test(homeLiveMarket) &&
    /sparklineStatus:\s*HomeSparklineStatus/.test(homeLiveMarket) && /sparklineBasis:\s*HomeSparklineBasis/.test(homeLiveMarket));
check('defines the honest KIS/FX sparkline period-label copy', /최근 20거래일 종가 추이/.test(homeLiveMarket) && /최근 20공시일 환율 추이/.test(homeLiveMarket));
check('defines an UNAVAILABLE_SPARKLINE constant reused wherever a sparkline cannot be resolved (never a fabricated flat line)',
  /UNAVAILABLE_SPARKLINE/.test(homeLiveMarket));
check('builds the KIS sparkline from the same shared fetchLongHistoryOhlcv call already reused for the quote/OHLCV fallback (no second history provider)',
  /buildKisSparkline/.test(homeLiveMarket) && (homeLiveMarket.match(/fetchLongHistoryOhlcv\(/g) || []).length === 1);
check('caps the KIS sparkline to the last 20 valid points',
  /HOME_SPARKLINE_POINTS\s*=\s*20/.test(homeLiveMarket) && /slice\(-HOME_SPARKLINE_POINTS\)/.test(homeLiveMarket));
check('reuses fetchUsdKrwSparklineSeries for the FX sparkline (no second FX provider)',
  homeLiveMarket.includes("fetchUsdKrwSparklineSeries") && /from\s*['"]\.\.\/chart-ai\/marketIntelligence\/crossAssetProvider\.mjs['"]/.test(homeLiveMarket));
check('crossAssetProvider.mjs exports fetchUsdKrwSparklineSeries reusing the same FX_BASE (no new endpoint)',
  crossAssetProvider.includes('export const fetchUsdKrwSparklineSeries') &&
    (crossAssetProvider.match(/https?:\/\/[^'"\s]+/g) || []).every((u) => u.includes('frankfurter')));
check('the FX sparkline series is deduped/sorted ascending and capped to 20 points',
  /FX_SPARKLINE_POINTS\s*=\s*20/.test(crossAssetProvider) && /sort\(\(a,\s*b\)/.test(crossAssetProvider));

log('--- Group 12: HF3 §3 rolling ticker belt (Ticker.astro) ---');
check('renders a .ticker-rail wrapper around the semantic .ticker-track (the animated element)', /class="ticker-rail"\s+data-ticker-rail/.test(ticker));
check('creates the aria-hidden visual clone track only in client JS (no SSR-duplicated markup)',
  ticker.includes("data-ticker-track-clone") && ticker.includes("setAttribute('aria-hidden', 'true')"));
check('gates clone creation on prefers-reduced-motion (no animated clone when motion is reduced)',
  /matchMedia\(\s*['"]\(prefers-reduced-motion:\s*reduce\)['"]\s*\)/.test(ticker) && /!reduceMotion/.test(ticker));
check('never animates via `left`/margin (transform-only distance/duration wiring via CSS custom properties)',
  ticker.includes('--ticker-distance') && ticker.includes('--ticker-duration') && !/style\.left\s*=/.test(ticker));
check('re-anchors the animation with a negative animation-delay computed from current progress (no restart-from-zero on data refresh)',
  ticker.includes('animationDelay') && ticker.includes('currentTranslateX'));
check('adds a document-hidden pause class on the rail (independent of the shared controller\'s own fetch-pausing listener)',
  /rail\.classList\.toggle\(\s*['"]ticker-rail--paused['"]\s*,\s*document\.hidden\s*\)/.test(ticker));
check('clone chips are forced non-tabbable (tabindex -1) so aria-hidden content is never a tab stop',
  ticker.includes("chip.setAttribute('tabindex', '-1')"));

log('--- Group 12: HF3 §8-§9 Snapshot inline sparkline + stable layout (HomeLiveMarketSnapshot.astro) ---');
check('renders one inline SVG sparkline per card with no new charting dependency (role=img, Korean aria-label, fixed viewBox)',
  homeSnapshot.includes('role="img"') && homeSnapshot.includes('viewBox="0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}"') &&
    /SPARK_WIDTH\s*=\s*88/.test(homeSnapshot) && /SPARK_HEIGHT\s*=\s*32/.test(homeSnapshot));
check('honest unavailable-chart state ("차트 데이터 없음"), never a fabricated flat line',
  homeSnapshot.includes('차트 데이터 없음'));
check('direction is derived from the sparkline\'s own first/last point (distinct from the card headline changePct tone)',
  /sparklineDirection/.test(homeSnapshot) && /points\[0\]\.value/.test(homeSnapshot) && /points\[points\.length\s*-\s*1\]\.value/.test(homeSnapshot));
check('normalizes x/y coordinates with padding and guards div-by-zero (span > 0 check)', /span\s*>\s*0/.test(homeSnapshot));
check('shows a freshness badge only for the stale case (§HF2/§9 disclosure), text 갱신 지연', /갱신 지연/.test(homeSnapshot) && /freshness\s*===\s*['"]stale['"]/.test(homeSnapshot));
check('both ok and unavailable card branches render an index-card-sparkline slot (stable height regardless of availability)',
  (homeSnapshot.match(/class="index-card-sparkline"/g) || []).length >= 2);

log('--- Group 12: HF3 CSS foundation (style.css) ---');
check('defines the seamless-loop keyframes (translate3d only, never left/margin)',
  STYLE_CSS.includes('@keyframes mk-ticker-roll') && /translate3d\(0,\s*0,\s*0\)/.test(STYLE_CSS) && /translate3d\(calc\(-1 \* var\(--ticker-distance/.test(STYLE_CSS));
check('pauses on hover, keyboard focus-within, and the JS-toggled paused class',
  STYLE_CSS.includes('.ticker-rail--rolling:hover') && STYLE_CSS.includes('.ticker-rail--paused') && STYLE_CSS.includes(':focus-within .ticker-rail--rolling'));
check('prefers-reduced-motion disables the animation at the CSS level too (defense in depth)',
  /@media \(prefers-reduced-motion:\s*reduce\)\s*\{\s*\.ticker-rail--rolling\s*\{\s*animation:\s*none;/.test(STYLE_CSS));
check('defines the new sparkline-card CSS classes (empty state + period caption + freshness badge)',
  STYLE_CSS.includes('.index-card-sparkline-empty') && STYLE_CSS.includes('.index-card-sparkline-period') && STYLE_CSS.includes('.index-card-freshness'));
check('Snapshot grid has a 3/2/1 responsive breakpoint ladder for the expanded 9-card layout',
  /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/.test(STYLE_CSS) &&
    /max-width:\s*860px[\s\S]{0,120}grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(STYLE_CSS) &&
    /max-width:\s*560px[\s\S]{0,80}grid-template-columns:\s*1fr/.test(STYLE_CSS));

// ---------------------------------------------------------------------------
// Group 13: Phase 3GL-HF4 — GNews provider compatibility fix (max=10, no lang=ko, extended status map)
// ---------------------------------------------------------------------------
log('--- Group 13: HF4 GNews provider compatibility (max=10, no lang, sanitized status mapping) ---');
check(
  'PROVIDER_MAX is 10 (GNews Free plan cap, was 20 pre-HF4)',
  /PROVIDER_MAX\s*=\s*10/.test(gnewsProvider) && !/PROVIDER_MAX\s*=\s*20/.test(gnewsProvider),
);
check(
  'the request params object never sets a lang parameter (Search endpoint does not support Korean; the Korean-keyword COMBINED_QUERY is the targeting mechanism instead)',
  !/lang\s*:\s*['"]ko['"]/.test(gnewsProvider),
);
{
  const paramsMatch = gnewsProvider.match(/const\s+params\s*=\s*new\s+URLSearchParams\(\{[\s\S]*?\}\);/);
  const paramsBlock = paramsMatch ? paramsMatch[0] : '';
  check('the URLSearchParams construction block exists and never contains a lang key at all', paramsBlock.length > 0 && !/\blang\s*:/.test(paramsBlock));
  check('the URLSearchParams construction block still carries exactly one q and one apikey key (query architecture preserved)',
    (paramsBlock.match(/\bq\s*:/g) || []).length === 1 && (paramsBlock.match(/\bapikey\s*:/g) || []).length === 1);
}
check('HTTP 400 maps to the new sanitized NEWS_BAD_REQUEST code', /if\s*\(res\.status\s*===\s*400\)\s*return\s*\{\s*ok:\s*false,\s*code:\s*'NEWS_BAD_REQUEST'\s*\}/.test(gnewsProvider));
check('HTTP 401 maps to NEWS_UNAUTHORIZED (isolated from 403, no longer sharing one branch)', /if\s*\(res\.status\s*===\s*401\)\s*return\s*\{\s*ok:\s*false,\s*code:\s*'NEWS_UNAUTHORIZED'\s*\}/.test(gnewsProvider));
check('HTTP 403 maps to the new sanitized NEWS_QUOTA_EXHAUSTED code (was folded into NEWS_UNAUTHORIZED pre-HF4)', /if\s*\(res\.status\s*===\s*403\)\s*return\s*\{\s*ok:\s*false,\s*code:\s*'NEWS_QUOTA_EXHAUSTED'\s*\}/.test(gnewsProvider));
check('HTTP 429 still maps to NEWS_RATE_LIMITED (unchanged)', /if\s*\(res\.status\s*===\s*429\)\s*return\s*\{\s*ok:\s*false,\s*code:\s*'NEWS_RATE_LIMITED'\s*\}/.test(gnewsProvider));
check('every other non-2xx status still falls through to the generic NEWS_PROVIDER_ERROR (no raw status/body ever surfaced)', /if\s*\(!res\.ok\)\s*return\s*\{\s*ok:\s*false,\s*code:\s*'NEWS_PROVIDER_ERROR'\s*\}/.test(gnewsProvider));
check('preserves the one-combined-query architecture: still exactly one COMBINED_QUERY definition and one fetch call site in fetchGnewsSearch',
  (gnewsProvider.match(/const COMBINED_QUERY/g) || []).length === 1 && (gnewsProvider.match(/fetchFn\(/g) || []).length === 1,
);

// ---------------------------------------------------------------------------
// Group 10: package.json wiring
// ---------------------------------------------------------------------------
log('--- Group 10: package.json wiring ---');
check('package.json has smoke:phase-3gl-home-live-data script',
  typeof pkg.scripts?.['smoke:phase-3gl-home-live-data'] === 'string');
check('package.json has check:phase-3gl-home-live-data script',
  typeof pkg.scripts?.['check:phase-3gl-home-live-data'] === 'string');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('');
log(`Total: ${passes + failures} | Passed: ${passes} | Failed: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
