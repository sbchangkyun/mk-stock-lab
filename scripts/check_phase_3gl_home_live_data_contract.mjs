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
const TICKER = join(root, 'src', 'components', 'Ticker.astro');
const HOME_SNAPSHOT = join(root, 'src', 'components', 'HomeLiveMarketSnapshot.astro');
const HOME_NEWS = join(root, 'src', 'components', 'HomeMarketNews.astro');
const HOME_PAGE = join(root, 'src', 'pages', 'index.astro');
const CROSS_ASSET_PROVIDER = join(root, 'src', 'lib', 'server', 'chart-ai', 'marketIntelligence', 'crossAssetProvider.mjs');
const PACKAGE_JSON = join(root, 'package.json');

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
  ['Ticker.astro', TICKER],
  ['HomeLiveMarketSnapshot.astro', HOME_SNAPSHOT],
  ['HomeMarketNews.astro', HOME_NEWS],
  ['index.astro', HOME_PAGE],
]) {
  check(`${name} exists`, existsSync(path));
}

const homeLiveMarket = readOr(HOME_LIVE_MARKET);
const liveMarketRoute = readOr(LIVE_MARKET_ROUTE);
const gnewsProvider = readOr(GNEWS_PROVIDER);
const homeNewsRoute = readOr(HOME_NEWS_ROUTE);
const ticker = readOr(TICKER);
const homeSnapshot = readOr(HOME_SNAPSHOT);
const homeNews = readOr(HOME_NEWS);
const homePage = readOr(HOME_PAGE);
const crossAssetProvider = readOr(CROSS_ASSET_PROVIDER);
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
check(
  'snapshot subset is exactly {kospi, kosdaq, sp500, nasdaq100}',
  /HOME_SNAPSHOT_IDS\s*=\s*\[\s*'kospi',\s*'kosdaq',\s*'sp500',\s*'nasdaq100'\s*\]/.test(homeLiveMarket),
);
check('every registry entry carries an honest basisLabel field (never claims to be the literal index)', (homeLiveMarket.match(/basisLabel:/g) || []).length >= 9);
check('usdkrw entry is FX kind, not KIS', /id:\s*'usdkrw',\s*label:\s*'원\/달러',\s*kind:\s*'fx'/.test(homeLiveMarket));

// ---------------------------------------------------------------------------
// Group 3: Server orchestration — single shared resolution, reuse, no new KIS/FX surfaces
// ---------------------------------------------------------------------------
log('--- Group 3: Server orchestration boundary ---');
check('reuses fetchLongHistoryOhlcv (shared cached OHLCV orchestration)',
  /import\s*\{\s*fetchLongHistoryOhlcv\s*\}\s*from\s*['"]\.\.\/chart-ai\/universalOhlcvProvider['"]/.test(homeLiveMarket));
check('reuses findUniversalInstrument (shared instrument resolver)',
  homeLiveMarket.includes("import { findUniversalInstrument } from '../chart-ai/universal-instrument-search.mjs'"));
check('reuses fetchUsdKrwContext for FX (no new FX provider introduced)',
  homeLiveMarket.includes("import { fetchUsdKrwContext } from '../chart-ai/marketIntelligence/crossAssetProvider.mjs'"));
check('reuses the existing bounded-concurrency helper from marketDashboard.ts',
  homeLiveMarket.includes('mapWithConcurrency') && /from\s*['"]\.\.\/marketDashboard\/marketDashboard['"]/.test(homeLiveMarket));
check('CONCURRENCY_LIMIT = 3 (same bound as Phase 3GJ)', /CONCURRENCY_LIMIT\s*=\s*3/.test(homeLiveMarket));
check('never imports the KIS transport client directly', !/from ['"].*providers\/kisClient['"]/.test(homeLiveMarket));
check('never references a KIS TR id or endpoint path literal', !/FHKST\d|\/uapi\//.test(homeLiveMarket));
check('exposes a deps-injection seam (getHomeLiveMarket accepts deps)',
  /getHomeLiveMarket\s*=\s*async\s*\(/.test(homeLiveMarket) && /deps:\s*Partial<HomeLiveMarketDeps>/.test(homeLiveMarket));
check('a failed item degrades to status unavailable with null fields, never a fabricated value',
  /status:\s*['"]unavailable['"]/.test(homeLiveMarket) && /price:\s*null/.test(homeLiveMarket));
check('a total failure (0 resolved) maps to MARKET_DATA_UNAVAILABLE via the shared sanitized error codes',
  homeLiveMarket.includes('MARKET_DASHBOARD_SANITIZED_ERROR_CODES.MARKET_DATA_UNAVAILABLE'));
check('ticker is never dropped to empty on partial failure (only snapshot narrows)',
  /ticker,\s*\n\s*snapshot:\s*\[\]/.test(homeLiveMarket));
check('crossAssetProvider.mjs (the reused FX source) was not modified to add a second FX endpoint',
  crossAssetProvider.includes("const FX_BASE = 'https://api.frankfurter.dev/v1'") && (crossAssetProvider.match(/https?:\/\/[^'"\s]+/g) || []).every((u) => u.includes('frankfurter')));

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
check('normalizeGnewsHomeArticle returns null when title or url is missing (never fabricates a headline)',
  /if\s*\(!title\s*\|\|\s*!url\)\s*return null/.test(gnewsProvider));
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
// Group 7: Client components — no polling beyond documented refresh, no localStorage cache,
// no cache-bypass params, pause-when-hidden, in-flight guard
// ---------------------------------------------------------------------------
log('--- Group 7: Client component behavior ---');
for (const [name, src] of [['Ticker.astro', ticker], ['HomeLiveMarketSnapshot.astro', homeSnapshot], ['HomeMarketNews.astro', homeNews]]) {
  check(`${name}: fetches its route exactly once per script (single script-level fetch call)`, (src.match(/fetch\(/g) || []).length === 1);
  check(`${name}: uses a recursive setTimeout refresh loop (never setInterval polling)`, !src.includes('setInterval') && src.includes('window.setTimeout'));
  check(`${name}: never persists market/news data to localStorage`, !/localStorage\.setItem/.test(src));
  check(`${name}: never appends a cache-bypass/force-refresh query parameter`, !/[?&](forceRefresh|bypassCache|refresh|_ts|cacheBust)=/i.test(src));
  check(`${name}: guards against overlapping in-flight requests`, /inFlight/.test(src));
  check(`${name}: pauses/resumes on document visibility change`, src.includes('document.hidden') && src.includes('visibilitychange'));
  check(`${name}: wires setup via astro:page-load with an idempotent ready guard`, src.includes("addEventListener('astro:page-load'") && src.includes("dataset.ready === 'true'"));
}
check('Ticker.astro refreshes on a 60s interval', /REFRESH_MS\s*=\s*60_000/.test(ticker));
check('HomeLiveMarketSnapshot.astro refreshes on a 60s interval', /REFRESH_MS\s*=\s*60_000/.test(homeSnapshot));
check('HomeMarketNews.astro refreshes on a 5-minute interval', /REFRESH_MS\s*=\s*5\s*\*\s*60\s*\*\s*1000/.test(homeNews));
check('Ticker.astro fetches the shared live-market route', ticker.includes("fetch('/api/home/live-market.json')") && ticker.includes('body?.ticker'));
check('HomeLiveMarketSnapshot.astro fetches the same shared live-market route (no duplicate provider call)',
  homeSnapshot.includes("fetch('/api/home/live-market.json')") && homeSnapshot.includes('body?.snapshot'));
check('HomeMarketNews.astro fetches the dedicated GNews route', homeNews.includes("fetch('/api/news/home.json')"));
check('HomeLiveMarketSnapshot.astro renders an honest unavailable state, never a fabricated card', homeSnapshot.includes('data-home-snapshot-unavailable'));
check('HomeMarketNews.astro renders an honest empty state, never a fabricated article', homeNews.includes('data-home-news-empty'));

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
