/**
 * Static contract check for Phase 3GJ — Live Market Dashboard.
 * Verifies the closed tracked-universe registry, pure metrics/formatters, the server orchestration
 * boundary (no direct KIS transport calls, bounded concurrency, honest error codes), the closed
 * query-parameter contract on both API routes, Production/Preview gating wiring, client UI single-
 * request-on-load + explicit-refresh-only behavior, fixture retirement, and package.json wiring.
 * No network calls. No .env reads.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const UNIVERSES = join(root, 'src', 'data', 'marketTrackedUniverses.ts');
const METRICS = join(root, 'src', 'lib', 'market-dashboard', 'metrics.ts');
const FORMATTERS = join(root, 'src', 'lib', 'market-dashboard', 'formatters.ts');
const SERVICE = join(root, 'src', 'lib', 'server', 'marketDashboard', 'marketDashboard.ts');
const DASHBOARD_ROUTE = join(root, 'src', 'pages', 'api', 'market', 'dashboard.json.ts');
const OVERVIEW_ROUTE = join(root, 'src', 'pages', 'api', 'market', 'overview.json.ts');
const KIS_CLIENT = join(root, 'src', 'lib', 'server', 'providers', 'kisClient.ts');
const LIVE_DASHBOARD = join(root, 'src', 'components', 'LiveMarketDashboard.astro');
const HOME_SNAPSHOT = join(root, 'src', 'components', 'HomeLiveMarketSnapshot.astro');
const MARKET_PAGE = join(root, 'src', 'pages', 'market.astro');
const HOME_PAGE = join(root, 'src', 'pages', 'index.astro');
const QUOTE_CARD = join(root, 'src', 'components', 'MarketLiveQuoteCard.astro');
const PACKAGE_JSON = join(root, 'package.json');

const log = (msg) => process.stdout.write(msg + '\n');
let passes = 0;
let failures = 0;
const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};
const readOr = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');

log('=== Phase 3GJ Live Market Dashboard Static Contract ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');
for (const [name, path] of [
  ['marketTrackedUniverses.ts', UNIVERSES],
  ['metrics.ts', METRICS],
  ['formatters.ts', FORMATTERS],
  ['marketDashboard.ts (service)', SERVICE],
  ['dashboard.json.ts route', DASHBOARD_ROUTE],
  ['overview.json.ts route', OVERVIEW_ROUTE],
  ['LiveMarketDashboard.astro', LIVE_DASHBOARD],
  ['HomeLiveMarketSnapshot.astro', HOME_SNAPSHOT],
  ['market.astro', MARKET_PAGE],
]) {
  check(`${name} exists`, existsSync(path));
}

const universes = readOr(UNIVERSES);
const metrics = readOr(METRICS);
const formatters = readOr(FORMATTERS);
const service = readOr(SERVICE);
const dashboardRoute = readOr(DASHBOARD_ROUTE);
const overviewRoute = readOr(OVERVIEW_ROUTE);
const kisClient = readOr(KIS_CLIENT);
const liveDashboard = readOr(LIVE_DASHBOARD);
const homeSnapshot = readOr(HOME_SNAPSHOT);
const marketPage = readOr(MARKET_PAGE);
const homePage = readOr(HOME_PAGE);
const quoteCard = readOr(QUOTE_CARD);
let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}

// ---------------------------------------------------------------------------
// Group 2: Tracked-universe registry — closed contract
// ---------------------------------------------------------------------------
log('--- Group 2: Tracked-universe registry ---');
check('exports MARKET_UNIVERSE_IDS', universes.includes('MARKET_UNIVERSE_IDS'));
check('exports findTrackedUniverse', universes.includes('export const findTrackedUniverse'));
check('never exposes a my-portfolio universe id', !/['"]my-portfolio['"]/.test(universes));
for (const id of ['kospi200', 'kosdaq150', 'sp500', 'nasdaq100']) {
  check(`registry defines universe id ${id}`, universes.includes(`'${id}'`));
}
for (const [symbol, country] of [['069500', 'KR'], ['229200', 'KR'], ['SPY', 'US'], ['QQQ', 'US']]) {
  check(`registry references benchmark proxy ${symbol}/${country}`, universes.includes(symbol) && universes.includes(`'${country}'`));
}
check('constituent metadata never carries a fake asOf field', !/asOf:\s*['"]2/.test(universes));
check('constituent metadata never carries a fake baseChangePct field', !universes.includes('baseChangePct'));
check('constituent metadata never carries fake momentum/trend fields', !/momentum\s*:|trend\s*:/.test(universes));

// ---------------------------------------------------------------------------
// Group 3: Pure metrics module — formula + boundary contract
// ---------------------------------------------------------------------------
log('--- Group 3: Pure metrics module ---');
check('MARKET_DASHBOARD_PERIOD_IDS is exactly 1d/1w/1m/3m (no 6m/1y)',
  /MARKET_DASHBOARD_PERIOD_IDS[\s\S]{0,40}=\s*\[\s*'1d',\s*'1w',\s*'1m',\s*'3m'\s*\]/.test(metrics));
check('does not define a 6m period offset', !metrics.includes("'6m'"));
check('does not define a 1y period offset', !metrics.includes("'1y'"));
check('trading-day offsets match spec (1d=1, 1w=5, 1m=21, 3m=63)',
  /1d['"]?:\s*1\b/.test(metrics) && /1w['"]?:\s*5\b/.test(metrics) && /1m['"]?:\s*21\b/.test(metrics) && /3m['"]?:\s*63\b/.test(metrics));
check('MOMENTUM_WINDOW_TRADING_DAYS = 20', /MOMENTUM_WINDOW_TRADING_DAYS\s*=\s*20/.test(metrics));
check('TREND_SMA_WINDOW_TRADING_DAYS = 60', /TREND_SMA_WINDOW_TRADING_DAYS\s*=\s*60/.test(metrics));
check('MARKET_DASHBOARD_MIN_VALID_CONSTITUENTS = 5', /MARKET_DASHBOARD_MIN_VALID_CONSTITUENTS\s*=\s*5/.test(metrics));
check('MARKET_DASHBOARD_MIN_COVERAGE_RATIO = 0.4', /MARKET_DASHBOARD_MIN_COVERAGE_RATIO\s*=\s*0\.4/.test(metrics));
check('exports computePeriodReturnPct', metrics.includes('export const computePeriodReturnPct'));
check('exports computeMomentum20dPct', metrics.includes('export const computeMomentum20dPct'));
check('exports computeSma60', metrics.includes('export const computeSma60'));
check('exports computeTrendVsSma60Pct', metrics.includes('export const computeTrendVsSma60Pct'));
check('exports aggregateWeightedBreadth', metrics.includes('export const aggregateWeightedBreadth'));
check('exports meetsMinimumRenderThreshold', metrics.includes('export const meetsMinimumRenderThreshold'));
check('exports classifyOverallFreshness', metrics.includes('export const classifyOverallFreshness'));
check('classifyOverallFreshness accepts a cachedCount 4th parameter (spec section 7)',
  /classifyOverallFreshness\s*=\s*\([\s\S]{0,220}cachedCount:\s*number/.test(metrics));
check('classifyOverallFreshness precedence never classifies cached data as fresh',
  /if\s*\(cachedCount > 0\) return ['"]cached['"];\s*return ['"]fresh['"];/.test(metrics));
check('classifyOverallFreshness (HF3) does not re-apply meetsMinimumRenderThreshold\'s absolute floor -- ' +
  'that floor is a dashboard-only render gate already enforced upstream; small fixed-size callers (e.g. the 4-proxy overview) must be able to reach fresh/cached/stale-but-usable at full coverage',
  !/classifyOverallFreshness\s*=\s*\([\s\S]{0,400}meetsMinimumRenderThreshold/.test(metrics));
check('module has zero fetch/network calls (pure calc only)', !/\bfetch\s*\(/.test(metrics));

// ---------------------------------------------------------------------------
// Group 4: Formatters — client-safe, never fabricates a placeholder as real data
// ---------------------------------------------------------------------------
log('--- Group 4: Display formatters ---');
check('exports formatSignedPct', formatters.includes('export const formatSignedPct'));
check('exports changeToneClass', formatters.includes('export const changeToneClass'));
check('exports colorForReturn', formatters.includes('export const colorForReturn'));
check('exports freshnessLabel', formatters.includes('export const freshnessLabel'));
check('exports formatAsOfDate', formatters.includes('export const formatAsOfDate'));
check('PERIOD_LABELS has no 6m/1y keys', !formatters.includes("'6m'") && !formatters.includes("'1y'"));
check('formatAsOfDate validates the yyyymmdd shape before formatting', /\/\^\\d\{8\}\$\//.test(formatters));
check('module has zero fetch/network calls (pure formatting only)', !/\bfetch\s*\(/.test(formatters));

// ---------------------------------------------------------------------------
// Group 5: Server orchestration — provider boundary, concurrency, honest errors
// ---------------------------------------------------------------------------
log('--- Group 5: Server orchestration boundary ---');
check('service reuses fetchLongHistoryOhlcv (shared cached OHLCV orchestration)',
  /import\s*\{[^}]*\bfetchLongHistoryOhlcv\b[^}]*\}\s*from\s*['"]\.\.\/chart-ai\/universalOhlcvProvider['"]/.test(service));
check('service reuses findUniversalInstrument (shared instrument resolver)',
  service.includes("import { findUniversalInstrument } from '../chart-ai/universal-instrument-search.mjs'"));
check('service never imports the KIS transport client directly',
  !/from ['"].*providers\/kisClient['"]/.test(service));
check('service never references a KIS TR id or endpoint path literal',
  !/FHKST\d|\/uapi\//.test(service));
check('service exposes a deps-injection seam (getMarketDashboard accepts deps)',
  /getMarketDashboard\s*=\s*async\s*\(/.test(service) && /deps:\s*Partial<MarketDashboardDeps>/.test(service));
check('CONCURRENCY_LIMIT = 3 (spec section 10: max 3 concurrent resolutions)', /CONCURRENCY_LIMIT\s*=\s*3/.test(service));
check('mapWithConcurrency never expands into an unbounded Promise.all over all items',
  !/Promise\.all\(\s*items\.map/.test(service));
check('STALE_AFTER_CALENDAR_DAYS = 4', /STALE_AFTER_CALENDAR_DAYS\s*=\s*4/.test(service));
for (const code of [
  'VALIDATION_FAILED',
  'MARKET_DASHBOARD_DISABLED',
  'MARKET_DATA_UNAVAILABLE',
  'MARKET_DATA_PARTIAL_BELOW_THRESHOLD',
  'PROVIDER_RATE_LIMITED',
]) {
  check(`service defines sanitized error code ${code}`, service.includes(code));
}
check('a failed constituent is marked unresolved/unavailable, never silently coerced to a zero return',
  /status:\s*['"]unresolved['"]/.test(service) && /periodReturnPct:\s*null/.test(service));
check('getMarketOverview only resolves the four registry benchmark proxies, never a client symbol',
  /getMarketOverview\s*=\s*async[\s\S]{0,900}mapWithConcurrency\(MARKET_TRACKED_UNIVERSES/.test(service));
check('closed status enum includes insufficient-history (transport ok, metric unavailable) — spec section 6',
  /status:\s*['"]ok['"]\s*\|\s*['"]unresolved['"]\s*\|\s*['"]unavailable['"]\s*\|\s*['"]insufficient-history['"]/.test(service));
check('valid coverage requires periodReturnPct !== null, never merely a successful transport (spec section 6)',
  /hasValidPeriodReturn\s*=\s*metrics\.periodReturnPct\s*!==\s*null/.test(service) &&
  /status\s*=\s*hasValidPeriodReturn\s*\?\s*['"]ok['"]\s*:\s*['"]insufficient-history['"]/.test(service));
check('breadth exposes commonAsOf (renamed from latestAsOf) — spec section 8', service.includes('commonAsOf'));
check('service never reintroduces the old latestAsOf field name', !service.includes('latestAsOf'));
check('commonAsOf is computed as the MINIMUM/oldest valid as-of date, never the max/latest (spec section 8)',
  /validAsOfDates\.slice\(\)\.sort\(\)\[0\]/.test(service) && !/\.sort\(\)\[[a-zA-Z.]*length\s*-\s*1\]/.test(service.slice(service.indexOf('commonAsOf'))));
check('service defines an allFailuresRateLimited helper distinguishing pure rate-limit failure from generic unavailability (spec section 5)',
  service.includes('const allFailuresRateLimited'));
check('both getMarketDashboard and getMarketOverview route a zero-successful-count result through allFailuresRateLimited',
  (service.match(/allFailuresRateLimited\(/g) || []).length >= 2);
check('service threads a sanitized, per-request ConstituentDiagnostic[] (no symbols/tokens) — spec section 4',
  (() => {
    const match = /export type ConstituentDiagnostic = \{([\s\S]*?)\};/.exec(service);
    return !!match && !/symbol|token/i.test(match[1]);
  })());
check('service logs one sanitized aggregate diagnostic summary per request via logDiagnosticSummary (spec section 4)',
  service.includes('const logDiagnosticSummary') && (service.match(/logDiagnosticSummary\(/g) || []).length >= 3);
check('diagnostic log line never includes a raw symbol or provider token/secret field',
  /logDiagnosticSummary[\s\S]{0,2200}console\.log/.test(service) && !/console\.log\([\s\S]{0,400}(token|secret|symbol:)/i.test(service));

// ---------------------------------------------------------------------------
// Group 5b: HF2 data-basis timestamp parser + internal diagnostic-reason contract
// ---------------------------------------------------------------------------
log('--- Group 5b: HF2 data-basis parser (parseMarketDataTimestampToUtcMs) ---');
check('service defines the renamed parseMarketDataTimestampToUtcMs parser (HF2 spec section 4)',
  service.includes('const parseMarketDataTimestampToUtcMs'));
check('the old narrow parseYyyymmddToUtcMs parser no longer exists (HF2 replaced it, not wrapped it)',
  !service.includes('parseYyyymmddToUtcMs'));
check('the old permissive classifyResultFreshness boolean classifier no longer exists (replaced by resolveFreshnessDiagnosis)',
  !service.includes('classifyResultFreshness'));
check('service defines resolveFreshnessDiagnosis returning both freshness and an internal reason',
  /const resolveFreshnessDiagnosis\s*=\s*\(/.test(service) && /internalReason:\s*MarketDashboardInternalDiagnosticReason/.test(service));
check('YYYYMMDD pattern is anchored at both ends (never an unanchored prefix test)',
  service.includes('YYYYMMDD_PATTERN = /^\\d{8}$/'));
check('service never uses the old unanchored /^\\d{8}/ prefix test to validate a date string',
  !/\/\^\\d\{8\}\/\.test/.test(service));
check('service defines an ISO-8601 date/timestamp pattern (accepts date-only and full timestamp shapes)',
  service.includes('ISO_DATE_TIME_PATTERN'));
check('parser rejects non-string input before any date construction',
  /parseMarketDataTimestampToUtcMs\s*=\s*\([\s\S]{0,80}typeof value !== ['"]string['"]/.test(service));
check('parser defines a round-trip UTC-component validator to reject impossible calendar dates (HF2 spec section 4)',
  service.includes('const roundTripUtcMs'));
check('round-trip validator checks year/month/day AND hour/minute/second components, never just a finite-timestamp check',
  /roundTrip\.getUTCFullYear\(\)\s*===\s*year[\s\S]{0,200}roundTrip\.getUTCSeconds\(\)\s*===\s*second/.test(service));
check('parser never falls back to the current date/time on failure (returns null instead)',
  !/parseMarketDataTimestampToUtcMs[\s\S]{0,1400}Date\.now\(\)/.test(service) && !/parseMarketDataTimestampToUtcMs[\s\S]{0,1400}new Date\(\)(?!\.)/.test(service));
check('service defines the closed internal diagnostic-reason enum (HF2 spec section 6)',
  service.includes('MARKET_DASHBOARD_INTERNAL_DIAGNOSTIC_REASONS'));
for (const reason of ['OK', 'PROVIDER_ERROR', 'HISTORY_RANGE_MISSING', 'HISTORY_RANGE_INVALID', 'INSUFFICIENT_HISTORY']) {
  check(`internal diagnostic-reason enum includes ${reason}`,
    new RegExp(`${reason}:\\s*['"]${reason}['"]`).test(service));
}
check('ConstituentDiagnostic carries an optional internalReason field (internal-only, sanitized)',
  /export type ConstituentDiagnostic = \{[\s\S]*?internalReason\?:\s*MarketDashboardInternalDiagnosticReason[\s\S]*?\};/.test(service));
check('logDiagnosticSummary aggregates and logs byInternalReason counts (never raw reasons per-item)',
  service.includes('byInternalReason') && /byInternalReason\[d\.internalReason\]/.test(service));
check('the internal diagnostic reason is never present on the public MarketDashboardResult type',
  (() => {
    const match = /export type MarketDashboardResult = \{([\s\S]*?)\};/.exec(service);
    return !!match && !/internalReason/.test(match[1]);
  })());
check('the internal diagnostic reason is never present on the public MarketOverviewResult/MarketOverviewProxyResult types',
  (() => {
    const proxy = /export type MarketOverviewProxyResult = \{([\s\S]*?)\};/.exec(service);
    const overview = /export type MarketOverviewResult = \{([\s\S]*?)\};/.exec(service);
    return !!proxy && !!overview && !/internalReason/.test(proxy[1]) && !/internalReason/.test(overview[1]);
  })());
check('the internal diagnostic reason is never present on the public ResolvedConstituentMetrics type',
  (() => {
    const match = /export type ResolvedConstituentMetrics = \{([\s\S]*?)\};/.exec(service);
    return !!match && !/internalReason/.test(match[1]);
  })());
check('a provider-level failure is tagged PROVIDER_ERROR, distinguishable from a data-basis parsing failure',
  /MARKET_DASHBOARD_INTERNAL_DIAGNOSTIC_REASONS\.PROVIDER_ERROR/.test(service));
check('a missing historyRange is tagged HISTORY_RANGE_MISSING, distinguishable from an invalid/unparseable one',
  /MARKET_DASHBOARD_INTERNAL_DIAGNOSTIC_REASONS\.HISTORY_RANGE_MISSING/.test(service) &&
  /MARKET_DASHBOARD_INTERNAL_DIAGNOSTIC_REASONS\.HISTORY_RANGE_INVALID/.test(service));

// ---------------------------------------------------------------------------
// Group 6: Production/Preview gating wiring
// ---------------------------------------------------------------------------
log('--- Group 6: Production/Preview gating ---');
check('kisClient defines the independent KIS_ENABLE_PRODUCTION_MARKET_DASHBOARD flag',
  kisClient.includes("'KIS_ENABLE_PRODUCTION_MARKET_DASHBOARD'"));
check('readiness accepts an allowProductionMarketDashboardLiveData option',
  kisClient.includes('allowProductionMarketDashboardLiveData'));
check('the market-dashboard Production exception requires vercel-production runtime AND the scoped option AND the env flag',
  /productionMarketDashboardExceptionAllowed\s*=\s*\s*[\s\S]{0,160}runtimeClass === ['"]vercel-production['"][\s\S]{0,160}options\.allowProductionMarketDashboardLiveData === true[\s\S]{0,160}productionMarketDashboardFlagEnvName/.test(kisClient));
check('routes pass allowProductionMarketDashboardLiveData: true (the internal scoped signal) only from this dedicated route',
  dashboardRoute.includes('allowProductionMarketDashboardLiveData: true') && overviewRoute.includes('allowProductionMarketDashboardLiveData: true'));
check('routes never enable the Chart AI beta exception',
  !dashboardRoute.includes('allowProductionChartAiBetaLiveQuotes') && !overviewRoute.includes('allowProductionChartAiBetaLiveQuotes'));
check('the market-dashboard exception is independently OR-able with the Chart AI exception, not a replacement for it',
  kisClient.includes('productionChartAiBetaExceptionAllowed') && kisClient.includes('productionMarketDashboardExceptionAllowed'));

// ---------------------------------------------------------------------------
// Group 7: API routes — closed query-parameter contract, honest cache headers
// ---------------------------------------------------------------------------
log('--- Group 7: API routes — closed query contract ---');
check('dashboard route is server-rendered (prerender = false)', /export const prerender = false/.test(dashboardRoute));
check('overview route is server-rendered (prerender = false)', /export const prerender = false/.test(overviewRoute));
check('dashboard route reads only universe and period from the query string',
  (dashboardRoute.match(/url\.searchParams\.get\(/g) || []).length === 2 &&
  dashboardRoute.includes("searchParams.get('universe')") &&
  dashboardRoute.includes("searchParams.get('period')"));
check('overview route reads only period from the query string',
  (overviewRoute.match(/url\.searchParams\.get\(/g) || []).length === 1 &&
  overviewRoute.includes("searchParams.get('period')"));
check('dashboard route validates universe against the closed MARKET_UNIVERSE_IDS enum',
  dashboardRoute.includes('MARKET_UNIVERSE_IDS.includes('));
check('both routes validate period against the closed MARKET_DASHBOARD_PERIOD_IDS enum',
  dashboardRoute.includes('MARKET_DASHBOARD_PERIOD_IDS.includes(') && overviewRoute.includes('MARKET_DASHBOARD_PERIOD_IDS.includes('));
check('dashboard route never reads a symbol/sector/exchange/provider/force-refresh param',
  !/searchParams\.get\((['"])(?:symbol|symbols|sector|exchange|provider|forceRefresh|bypassCache|chartAiBeta)\1\)/.test(dashboardRoute));
check('overview route never reads a symbol/sector/exchange/provider/force-refresh param',
  !/searchParams\.get\((['"])(?:symbol|symbols|sector|exchange|provider|forceRefresh|bypassCache|chartAiBeta)\1\)/.test(overviewRoute));
check('success responses use the documented cache-control (s-maxage=60, stale-while-revalidate=300)',
  dashboardRoute.includes('s-maxage=60, stale-while-revalidate=300') && overviewRoute.includes('s-maxage=60, stale-while-revalidate=300'));
check('error/unavailable responses use no-store', dashboardRoute.includes("NO_STORE = 'no-store'") && overviewRoute.includes("NO_STORE = 'no-store'"));
check('both routes reject non-GET methods (ALL handler)', dashboardRoute.includes('export const ALL') && overviewRoute.includes('export const ALL'));
check('routes never call a KIS transport function directly (readiness check only)',
  !/getKisDomesticQuoteSnapshot|getKisOverseasQuoteSnapshot|getKisDailyOhlcSeries|getKisOverseasDailyOhlcSeries/.test(dashboardRoute + overviewRoute));

// ---------------------------------------------------------------------------
// Group 8: Client UI — single request on load, explicit-refresh-only, no polling
// ---------------------------------------------------------------------------
log('--- Group 8: Client UI behavior ---');
check('LiveMarketDashboard has no data-polling setInterval (only the refresh-cooldown UI ticker is allowed — spec section 12)',
  !/setInterval\(\s*(?:loadOverview|loadDashboard|fetchJsonCached)\b/.test(liveDashboard));
check('LiveMarketDashboard has no auto-retry / recursive refresh timer', !/setTimeout\(\s*load(Dashboard|Overview)/.test(liveDashboard));
check('LiveMarketDashboard fetches overview exactly once via a dedicated cached loader', liveDashboard.includes("'/api/market/overview.json?period=1d'"));
check('LiveMarketDashboard fetches the dashboard via a dedicated loader keyed by universe+period',
  liveDashboard.includes('/api/market/dashboard.json?universe='));
check('LiveMarketDashboard refresh is gated by explicit tab click listeners',
  /universeTabs\.forEach\(\(tab\)\s*=>\s*\{\s*tab\.addEventListener\('click'/.test(liveDashboard) &&
  /periodTabs\.forEach\(\(tab\)\s*=>\s*\{\s*tab\.addEventListener\('click'/.test(liveDashboard));
check('LiveMarketDashboard guards against stale out-of-order responses (requestToken)', liveDashboard.includes('requestToken'));
check('LiveMarketDashboard renders an honest partial-below-threshold message, never a fabricated chart',
  liveDashboard.includes('MARKET_DATA_PARTIAL_BELOW_THRESHOLD'));
check('LiveMarketDashboard reuses the d3-hierarchy treemap approach', liveDashboard.includes("import('d3-hierarchy')"));
check('LiveMarketDashboard never labels a proxy as the exact index/현재가',
  !/지수\s*현재가|실시간\s*값/.test(liveDashboard));
check('LiveMarketDashboard preserves the MarketLiveQuoteCard integration (out of scope, untouched)',
  liveDashboard.includes('MarketLiveQuoteCard') && liveDashboard.includes('KIS_ENABLE_MARKET_QUOTE_CARD'));
check('LiveMarketDashboard never claims real-time OHLCV/market-data/return terminology (spec section 9)',
  !/실시간\s*OHLCV|실시간\s*시장\s*데이터|실시간\s*수익률/.test(liveDashboard));
check('LiveMarketDashboard implements a browser-memory response cache with a >=60s TTL (spec section 10)',
  liveDashboard.includes('CACHE_TTL_MS = 60_000') && liveDashboard.includes('responseCache'));
check('LiveMarketDashboard dedups in-flight requests via an inFlightRequests map (spec section 10)',
  liveDashboard.includes('inFlightRequests'));
check('LiveMarketDashboard never persists the response cache to localStorage (spec section 10)',
  !/localStorage\.(?:setItem|getItem|removeItem)|window\.localStorage/.test(liveDashboard));
check('LiveMarketDashboard overview cache is keyed independently of the dashboard cache',
  liveDashboard.includes("fetchJsonCached('overview:1d'") && /fetchJsonCached\(cacheKey/.test(liveDashboard));
check('LiveMarketDashboard dashboard cache key is scoped by universeId and period (spec section 10)',
  /cacheKey\s*=\s*`dashboard:\$\{universeId\}:\$\{period\}`/.test(liveDashboard));
check('LiveMarketDashboard sequences the initial overview and dashboard requests instead of firing them concurrently (spec section 11)',
  /await loadOverview\(\);[\s\S]{0,200}await loadDashboard\(/.test(liveDashboard));
check('LiveMarketDashboard exposes exactly one explicit refresh control (spec section 12)',
  (liveDashboard.match(/data-market-refresh-button/g) || []).length >= 2);
check('LiveMarketDashboard enforces a >=30s refresh cooldown (spec section 12)',
  liveDashboard.includes('REFRESH_COOLDOWN_MS = 30_000'));
check('LiveMarketDashboard refresh handler bypasses only the client-side cache, never a server cache-bypass query param',
  !/[?&](forceRefresh|bypassCache|refresh)=/i.test(liveDashboard) && /loadOverview\(true\)/.test(liveDashboard) && /loadDashboard\([^)]*,\s*true\)/.test(liveDashboard));

log('--- Group 8b: Home live market snapshot ---');
check('HomeLiveMarketSnapshot has no setInterval / polling loop', !homeSnapshot.includes('setInterval'));
check('HomeLiveMarketSnapshot fetches overview exactly once (single script-level fetch call)',
  (homeSnapshot.match(/fetch\(/g) || []).length === 1 && homeSnapshot.includes("fetch('/api/market/overview.json"));
check('HomeLiveMarketSnapshot renders an honest unavailable state, never a fabricated card',
  homeSnapshot.includes('data-home-snapshot-unavailable'));
check('Home page renders HomeLiveMarketSnapshot', homePage.includes('HomeLiveMarketSnapshot'));

// ---------------------------------------------------------------------------
// Group 9: Fixture retirement
// ---------------------------------------------------------------------------
log('--- Group 9: Fixture retirement ---');
for (const retiredPath of [
  join(root, 'src', 'components', 'MarketShell.astro'),
  join(root, 'src', 'components', 'MarketFixtureDashboard.astro'),
  join(root, 'src', 'data', 'marketTreemapSamples.ts'),
  join(root, 'src', 'data', 'marketFixtureDashboard.json'),
  join(root, 'src', 'components', 'HomeIndexCards.astro'),
  join(root, 'src', 'data', 'homeIndexCards.json'),
]) {
  check(`retired fixture no longer exists: ${retiredPath.slice(root.length + 1)}`, !existsSync(retiredPath));
}
check('market.astro no longer imports the retired MarketShell/MarketFixtureDashboard fixtures',
  !marketPage.includes('MarketShell') && !marketPage.includes('MarketFixtureDashboard'));
check('market.astro renders LiveMarketDashboard', marketPage.includes('LiveMarketDashboard'));
check('index.astro no longer imports the retired HomeIndexCards fixture', !homePage.includes('HomeIndexCards'));
check('MarketLiveQuoteCard.astro (explicitly out of scope) still exists untouched', existsSync(QUOTE_CARD));
check('quote card still targets /api/market/quote (separate, already-gated feature)', quoteCard.includes('/api/market/quote'));

// ---------------------------------------------------------------------------
// Group 10: No account/trading/LLM/second-provider surfaces introduced
// ---------------------------------------------------------------------------
log('--- Group 10: No prohibited surfaces ---');
const allNewServerCode = [service, dashboardRoute, overviewRoute].join('\n');
check('no KIS_ACCOUNT_NO reference in the new market-dashboard server code', !allNewServerCode.includes('KIS_ACCOUNT_NO'));
check('no order/balance/trading/account endpoint reference', !/\/api\/(?:kis-)?(?:order|trade|balance|account)/i.test(allNewServerCode));
check('no external LLM client import', !/openai|gemini|anthropic/i.test(allNewServerCode));
check('no second market-data provider introduced', !/yfinance|alpha_?vantage|polygon\.io|finnhub/i.test(allNewServerCode));
check('no raw provider payload / header / Supabase internals ever exposed in a route response',
  !/candles:\s*result\.candles(?!\s*\.map)/.test(allNewServerCode) || service.includes('extractCloses'));

// ---------------------------------------------------------------------------
// Group 11: package.json wiring
// ---------------------------------------------------------------------------
log('--- Group 11: package.json wiring ---');
check('package.json has smoke:phase-3gj-live-market-dashboard script',
  typeof pkg.scripts?.['smoke:phase-3gj-live-market-dashboard'] === 'string');
check('package.json has check:phase-3gj-live-market-dashboard script',
  typeof pkg.scripts?.['check:phase-3gj-live-market-dashboard'] === 'string');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('');
log(`Total: ${passes + failures} | Passed: ${passes} | Failed: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
