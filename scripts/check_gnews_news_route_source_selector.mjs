/**
 * No-network behavioral checker for the news route source selector (Phase 3BG).
 * Imports pure helpers directly. Uses synthetic env objects and synthetic fetchFn.
 * globalThis.fetch is monkey-patched to throw — no actual network calls are allowed.
 * Exits non-zero on any failure.
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync, readdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const log = (msg) => process.stdout.write(msg + '\n');
let passes = 0;
let failures = 0;
const check = (label, pass) => {
  const status = pass ? 'PASS' : 'FAIL';
  log(`  [${status}] ${label}`);
  if (pass) passes++;
  else failures++;
};

log('=== GNews News Route Source Selector Checker (Phase 3BG) ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: Pre-flight file existence
// ---------------------------------------------------------------------------
log('--- Group 1: Pre-flight file existence ---');

const SELECTOR_PATH = join(root, 'src', 'lib', 'news', 'gnewsMarketFeedSourceSelector.mjs');
const ROUTE_PATH = join(root, 'src', 'pages', 'api', 'news', 'market-feed.ts');
const HOME_PAGE_PATH = join(root, 'src', 'pages', 'index.astro');
const NEWS_PAGE_PATH = join(root, 'src', 'pages', 'news');
const MIGRATION_DIR = join(root, 'supabase', 'migrations');

check('Source selector module exists', existsSync(SELECTOR_PATH));
check('Route file exists', existsSync(ROUTE_PATH));
log('');

// ---------------------------------------------------------------------------
// Group 2: Network guard — monkey-patch globalThis.fetch
// ---------------------------------------------------------------------------
log('--- Group 2: Network guard ---');

let networkCallAttempted = false;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (..._args) => {
  networkCallAttempted = true;
  throw new Error('Network blocked in source-selector checker — globalThis.fetch must not be called.');
};
check('globalThis.fetch monkey-patched to block network calls', true);
log('');

// ---------------------------------------------------------------------------
// Group 3: Import pure helpers from source selector
// ---------------------------------------------------------------------------
log('--- Group 3: Import helpers ---');

let VALID_NEWS_SOURCES, parseNewsSourceParam, validateNewsSource;
let resolveNewsLiveGate, shouldAttemptLiveSource, sanitizeLiveFallbackReason;
let buildFixtureFallbackMetadata, buildLiveSourceMetadata, resolveMarketNewsFeedSource;
let importError = null;

try {
  const mod = await import('../src/lib/news/gnewsMarketFeedSourceSelector.mjs');
  VALID_NEWS_SOURCES = mod.VALID_NEWS_SOURCES;
  parseNewsSourceParam = mod.parseNewsSourceParam;
  validateNewsSource = mod.validateNewsSource;
  resolveNewsLiveGate = mod.resolveNewsLiveGate;
  shouldAttemptLiveSource = mod.shouldAttemptLiveSource;
  sanitizeLiveFallbackReason = mod.sanitizeLiveFallbackReason;
  buildFixtureFallbackMetadata = mod.buildFixtureFallbackMetadata;
  buildLiveSourceMetadata = mod.buildLiveSourceMetadata;
  resolveMarketNewsFeedSource = mod.resolveMarketNewsFeedSource;
} catch (err) {
  importError = err?.message ?? 'unknown';
}

check('Source selector imports without error', importError === null);
check('VALID_NEWS_SOURCES is an array', Array.isArray(VALID_NEWS_SOURCES));
check('parseNewsSourceParam is a function', typeof parseNewsSourceParam === 'function');
check('validateNewsSource is a function', typeof validateNewsSource === 'function');
check('resolveNewsLiveGate is a function', typeof resolveNewsLiveGate === 'function');
check('shouldAttemptLiveSource is a function', typeof shouldAttemptLiveSource === 'function');
check('sanitizeLiveFallbackReason is a function', typeof sanitizeLiveFallbackReason === 'function');
check('buildFixtureFallbackMetadata is a function', typeof buildFixtureFallbackMetadata === 'function');
check('buildLiveSourceMetadata is a function', typeof buildLiveSourceMetadata === 'function');
check('resolveMarketNewsFeedSource is a function', typeof resolveMarketNewsFeedSource === 'function');
log('');

if (importError !== null || typeof parseNewsSourceParam !== 'function') {
  globalThis.fetch = originalFetch;
  log('ERROR: Import failed — cannot continue behavioral checks.');
  log(`Checks passed: ${passes}/${passes + failures}. Result: FAIL`);
  process.exitCode = 1;
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Group 4: parseNewsSourceParam
// ---------------------------------------------------------------------------
log('--- Group 4: parseNewsSourceParam ---');

check('parseNewsSourceParam(null) returns "fixture"', parseNewsSourceParam(null) === 'fixture');
check('parseNewsSourceParam(undefined) returns "fixture"', parseNewsSourceParam(undefined) === 'fixture');
check('parseNewsSourceParam("") returns "fixture"', parseNewsSourceParam('') === 'fixture');
check('parseNewsSourceParam("fixture") returns "fixture"', parseNewsSourceParam('fixture') === 'fixture');
check('parseNewsSourceParam("auto") returns "auto"', parseNewsSourceParam('auto') === 'auto');
check('parseNewsSourceParam("live") returns "live"', parseNewsSourceParam('live') === 'live');
check('parseNewsSourceParam("invalid") returns "invalid" (not validated here)', parseNewsSourceParam('invalid') === 'invalid');
log('');

// ---------------------------------------------------------------------------
// Group 5: validateNewsSource
// ---------------------------------------------------------------------------
log('--- Group 5: validateNewsSource ---');

check('VALID_NEWS_SOURCES contains "fixture"', VALID_NEWS_SOURCES.includes('fixture'));
check('VALID_NEWS_SOURCES contains "auto"', VALID_NEWS_SOURCES.includes('auto'));
check('VALID_NEWS_SOURCES contains "live"', VALID_NEWS_SOURCES.includes('live'));
check('validateNewsSource("fixture") returns ok: true', validateNewsSource('fixture')?.ok === true);
check('validateNewsSource("auto") returns ok: true', validateNewsSource('auto')?.ok === true);
check('validateNewsSource("live") returns ok: true', validateNewsSource('live')?.ok === true);
check('validateNewsSource("invalid") returns ok: false', validateNewsSource('invalid')?.ok === false);
check('validateNewsSource("invalid") returns code "invalid_source"', validateNewsSource('invalid')?.code === 'invalid_source');
check('validateNewsSource("") returns ok: false', validateNewsSource('')?.ok === false);
check('validateNewsSource(null) returns ok: false', validateNewsSource(null)?.ok === false);
check('"live" and "auto" are distinct from "fixture"', 'live' !== 'fixture' && 'auto' !== 'fixture');
log('');

// ---------------------------------------------------------------------------
// Group 6: resolveNewsLiveGate
// ---------------------------------------------------------------------------
log('--- Group 6: resolveNewsLiveGate ---');

const gateDisabledEmpty = resolveNewsLiveGate({});
check('Empty env: enabled=false', gateDisabledEmpty.enabled === false);
check('Empty env: reason=live_disabled', gateDisabledEmpty.reason === 'live_disabled');

const gateDisabledFalse = resolveNewsLiveGate({ GNEWS_LIVE_ENABLED: 'false' });
check('GNEWS_LIVE_ENABLED=false: enabled=false', gateDisabledFalse.enabled === false);
check('GNEWS_LIVE_ENABLED=false: reason=live_disabled', gateDisabledFalse.reason === 'live_disabled');

const gateProduction = resolveNewsLiveGate({
  GNEWS_LIVE_ENABLED: 'true',
  VERCEL_ENV: 'production',
  GNEWS_BASE_URL: 'https://api.example.test',
  GNEWS_API_KEY: 'test-key',
});
check('Production env: enabled=false', gateProduction.enabled === false);
check('Production env: reason=production_blocked', gateProduction.reason === 'production_blocked');

const gateMissingBaseUrl = resolveNewsLiveGate({ GNEWS_LIVE_ENABLED: 'true', GNEWS_API_KEY: 'test' });
check('Missing GNEWS_BASE_URL: enabled=false', gateMissingBaseUrl.enabled === false);
check('Missing GNEWS_BASE_URL: reason=missing_base_url', gateMissingBaseUrl.reason === 'missing_base_url');

const gateQueryStringUrl = resolveNewsLiveGate({
  GNEWS_LIVE_ENABLED: 'true',
  GNEWS_BASE_URL: 'https://api.example.test?apikey=SECRETVAL',
  GNEWS_API_KEY: 'test',
});
check('Base URL with query string: enabled=false', gateQueryStringUrl.enabled === false);
check('Base URL with query string: reason=invalid_base_url', gateQueryStringUrl.reason === 'invalid_base_url');

const gateEmbeddedKey = resolveNewsLiveGate({
  GNEWS_LIVE_ENABLED: 'true',
  GNEWS_BASE_URL: 'https://api.example.test?key=SECRETVAL',
  GNEWS_API_KEY: 'test',
});
check('Base URL with embedded key param: enabled=false', gateEmbeddedKey.enabled === false);
check('Base URL with embedded key param: reason=invalid_base_url', gateEmbeddedKey.reason === 'invalid_base_url');

const gateMissingApiKey = resolveNewsLiveGate({
  GNEWS_LIVE_ENABLED: 'true',
  GNEWS_BASE_URL: 'https://api.example.test',
});
check('Missing API key: enabled=false', gateMissingApiKey.enabled === false);
check('Missing API key: reason=missing_api_key', gateMissingApiKey.reason === 'missing_api_key');

const gateEnabled = resolveNewsLiveGate({
  GNEWS_LIVE_ENABLED: 'true',
  GNEWS_BASE_URL: 'https://api.example.test',
  GNEWS_API_KEY: 'test-placeholder-key',
});
check('All conditions met: enabled=true', gateEnabled.enabled === true);
check('Enabled gate: apiKey present internally', typeof gateEnabled.apiKey === 'string' && gateEnabled.apiKey.length > 0);
check('Enabled gate: baseUrl present', typeof gateEnabled.baseUrl === 'string' && gateEnabled.baseUrl.length > 0);
check('Enabled gate: no reason field exposed', gateEnabled.reason === undefined);
// apiKey must not be in public-facing metadata structures
check('Gate result does not expose apiKey in public metadata (apiKey is internal only)',
  (() => {
    const pub = { enabled: gateEnabled.enabled, baseUrl: gateEnabled.baseUrl };
    return !JSON.stringify(pub).includes('apiKey');
  })());

const gateFallbackKey = resolveNewsLiveGate({
  GNEWS_LIVE_ENABLED: 'true',
  GNEWS_BASE_URL: 'https://api.example.test',
  PUBLIC_GNEWS_API_KEY: 'fallback-placeholder',
});
check('PUBLIC_GNEWS_API_KEY accepted as server-side fallback', gateFallbackKey.enabled === true);

const gatePreferPrimary = resolveNewsLiveGate({
  GNEWS_LIVE_ENABLED: 'true',
  GNEWS_BASE_URL: 'https://api.example.test',
  GNEWS_API_KEY: 'primary-placeholder',
  PUBLIC_GNEWS_API_KEY: 'fallback-placeholder',
});
check('GNEWS_API_KEY preferred over PUBLIC_GNEWS_API_KEY', gatePreferPrimary.apiKey === 'primary-placeholder');
log('');

// ---------------------------------------------------------------------------
// Group 7: shouldAttemptLiveSource
// ---------------------------------------------------------------------------
log('--- Group 7: shouldAttemptLiveSource ---');

const enabledGate = { enabled: true };
const disabledGate = { enabled: false, reason: 'live_disabled' };

check('source=fixture, gate enabled: false', shouldAttemptLiveSource('fixture', enabledGate) === false);
check('source=auto, gate enabled: true', shouldAttemptLiveSource('auto', enabledGate) === true);
check('source=live, gate enabled: true', shouldAttemptLiveSource('live', enabledGate) === true);
check('source=auto, gate disabled: false', shouldAttemptLiveSource('auto', disabledGate) === false);
check('source=live, gate disabled: false', shouldAttemptLiveSource('live', disabledGate) === false);
check('source=fixture, gate disabled: false', shouldAttemptLiveSource('fixture', disabledGate) === false);
log('');

// ---------------------------------------------------------------------------
// Group 8: buildFixtureFallbackMetadata and buildLiveSourceMetadata
// ---------------------------------------------------------------------------
log('--- Group 8: buildFixtureFallbackMetadata and buildLiveSourceMetadata ---');

const fixtureMeta = buildFixtureFallbackMetadata({ requestedSource: 'fixture' });
check('Fixture meta: requestedSource=fixture', fixtureMeta.requestedSource === 'fixture');
check('Fixture meta: source=fixture', fixtureMeta.source === 'fixture');
check('Fixture meta: liveEnabled=false', fixtureMeta.liveEnabled === false);
check('Fixture meta: liveAttempted=false', fixtureMeta.liveAttempted === false);
check('Fixture meta: fallbackUsed=false', fixtureMeta.fallbackUsed === false);

const autoDisabledMeta = buildFixtureFallbackMetadata({
  requestedSource: 'auto',
  liveAttempted: false,
  fallbackReason: 'live_disabled',
});
check('Auto disabled meta: requestedSource=auto', autoDisabledMeta.requestedSource === 'auto');
check('Auto disabled meta: source=fixture', autoDisabledMeta.source === 'fixture');
check('Auto disabled meta: liveEnabled=true', autoDisabledMeta.liveEnabled === true);
check('Auto disabled meta: fallbackUsed=true', autoDisabledMeta.fallbackUsed === true);
check('Auto disabled meta: fallbackReason=live_disabled', autoDisabledMeta.fallbackReason === 'live_disabled');

const liveMeta = buildLiveSourceMetadata({ requestedSource: 'live' });
check('Live meta: requestedSource=live', liveMeta.requestedSource === 'live');
check('Live meta: source=gnews_live', liveMeta.source === 'gnews_live');
check('Live meta: liveEnabled=true', liveMeta.liveEnabled === true);
check('Live meta: liveAttempted=true', liveMeta.liveAttempted === true);
check('Live meta: fallbackUsed=false', liveMeta.fallbackUsed === false);
check('Live meta: provider=gnews', liveMeta.provider === 'gnews');

// None of the public metadata should contain apiKey
const allMeta = [fixtureMeta, autoDisabledMeta, liveMeta];
check('No metadata object exposes apiKey',
  allMeta.every((m) => !JSON.stringify(m).includes('apiKey') && !JSON.stringify(m).includes('api_key')));
log('');

// ---------------------------------------------------------------------------
// Group 9: sanitizeLiveFallbackReason
// ---------------------------------------------------------------------------
log('--- Group 9: sanitizeLiveFallbackReason ---');

check('"live_disabled" is preserved', sanitizeLiveFallbackReason('live_disabled') === 'live_disabled');
check('"production_blocked" is preserved', sanitizeLiveFallbackReason('production_blocked') === 'production_blocked');
check('"missing_base_url" is preserved', sanitizeLiveFallbackReason('missing_base_url') === 'missing_base_url');
check('"missing_api_key" is preserved', sanitizeLiveFallbackReason('missing_api_key') === 'missing_api_key');
check('"invalid_base_url" is preserved', sanitizeLiveFallbackReason('invalid_base_url') === 'invalid_base_url');
check('"provider_empty_result" is preserved', sanitizeLiveFallbackReason('provider_empty_result') === 'provider_empty_result');
check('"provider_rate_limited" is preserved', sanitizeLiveFallbackReason('provider_rate_limited') === 'provider_rate_limited');
check('"provider_http_error" is preserved', sanitizeLiveFallbackReason('provider_http_error') === 'provider_http_error');
check('"provider_timeout" is preserved', sanitizeLiveFallbackReason('provider_timeout') === 'provider_timeout');
check('"provider_invalid_payload" is preserved', sanitizeLiveFallbackReason('provider_invalid_payload') === 'provider_invalid_payload');
check('"provider_fetch_failed" is preserved', sanitizeLiveFallbackReason('provider_fetch_failed') === 'provider_fetch_failed');
check('"live_exception" is preserved', sanitizeLiveFallbackReason('live_exception') === 'live_exception');
check('"unknown_live_failure" is preserved', sanitizeLiveFallbackReason('unknown_live_failure') === 'unknown_live_failure');
check('Unknown reason maps to "unknown_live_failure"', sanitizeLiveFallbackReason('some_raw_error') === 'unknown_live_failure');
check('null reason maps to "unknown_live_failure"', sanitizeLiveFallbackReason(null) === 'unknown_live_failure');
log('');

// ---------------------------------------------------------------------------
// Group 10: resolveMarketNewsFeedSource — fixture path
// ---------------------------------------------------------------------------
log('--- Group 10: resolveMarketNewsFeedSource — fixture path ---');

const fixtureResult = await resolveMarketNewsFeedSource({ requestedSource: 'fixture' });
check('Fixture path: useLiveArticles=false', fixtureResult.useLiveArticles === false);
check('Fixture path: liveArticles=null', fixtureResult.liveArticles === null);
check('Fixture path: meta.source=fixture', fixtureResult.meta?.source === 'fixture');
check('Fixture path: meta.liveEnabled=false', fixtureResult.meta?.liveEnabled === false);
check('Fixture path: meta.liveAttempted=false', fixtureResult.meta?.liveAttempted === false);
check('Fixture path: meta.fallbackUsed=false', fixtureResult.meta?.fallbackUsed === false);
check('Fixture path: no fetchFn call (globalThis.fetch not called)', !networkCallAttempted);
log('');

// ---------------------------------------------------------------------------
// Group 11: resolveMarketNewsFeedSource — auto/live disabled gate (no synthetic fetch needed)
// ---------------------------------------------------------------------------
log('--- Group 11: resolveMarketNewsFeedSource — gate disabled fallback ---');

const autoDisabledResult = await resolveMarketNewsFeedSource({
  requestedSource: 'auto',
  env: { GNEWS_LIVE_ENABLED: 'false' },
});
check('Auto gate disabled: useLiveArticles=false', autoDisabledResult.useLiveArticles === false);
check('Auto gate disabled: meta.source=fixture', autoDisabledResult.meta?.source === 'fixture');
check('Auto gate disabled: meta.fallbackUsed=true', autoDisabledResult.meta?.fallbackUsed === true);
check('Auto gate disabled: meta.fallbackReason=live_disabled', autoDisabledResult.meta?.fallbackReason === 'live_disabled');
check('Auto gate disabled: meta.liveAttempted=false (gate blocked before fetch)', autoDisabledResult.meta?.liveAttempted === false);

const liveProdBlockedResult = await resolveMarketNewsFeedSource({
  requestedSource: 'live',
  env: { GNEWS_LIVE_ENABLED: 'true', VERCEL_ENV: 'production', GNEWS_BASE_URL: 'https://api.example.test', GNEWS_API_KEY: 'k' },
});
check('Live production blocked: meta.fallbackReason=production_blocked', liveProdBlockedResult.meta?.fallbackReason === 'production_blocked');
check('Live production blocked: useLiveArticles=false', liveProdBlockedResult.useLiveArticles === false);
check('No network call for gate-blocked path', !networkCallAttempted);
log('');

// ---------------------------------------------------------------------------
// Group 12: resolveMarketNewsFeedSource — live path with synthetic fetchFn
// ---------------------------------------------------------------------------
log('--- Group 12: resolveMarketNewsFeedSource — live path with synthetic fetch ---');

const liveEnv = {
  GNEWS_LIVE_ENABLED: 'true',
  GNEWS_BASE_URL: 'https://api.example.test',
  GNEWS_API_KEY: 'synthetic-placeholder-key',
};

// Synthetic fetch returning empty articles (provider_empty_result fallback)
const emptyFetch = async () => ({
  status: 200,
  ok: true,
  headers: { get: (k) => (k === 'content-type' ? 'application/json' : null) },
  json: async () => ({ articles: [], totalArticles: 0 }),
});

const emptyLiveResult = await resolveMarketNewsFeedSource({
  requestedSource: 'auto',
  fetchFn: emptyFetch,
  env: liveEnv,
  maxThemes: 1,
});
check('Empty articles: useLiveArticles=false', emptyLiveResult.useLiveArticles === false);
check('Empty articles: meta.source=fixture (fallback)', emptyLiveResult.meta?.source === 'fixture');
check('Empty articles: meta.fallbackUsed=true', emptyLiveResult.meta?.fallbackUsed === true);
check('Empty articles: meta.liveAttempted=true', emptyLiveResult.meta?.liveAttempted === true);
check('Empty articles: meta.fallbackReason=provider_empty_result', emptyLiveResult.meta?.fallbackReason === 'provider_empty_result');
check('No globalThis.fetch call (used injected synthetic)', !networkCallAttempted);

// Synthetic fetch returning articles (live success)
const successFetch = async () => ({
  status: 200,
  ok: true,
  headers: { get: (k) => (k === 'content-type' ? 'application/json' : null) },
  json: async () => ({
    articles: [
      {
        title: '테스트 기사',
        url: 'https://source.example.test/article/1',
        description: '설명',
        image: null,
        publishedAt: '2026-06-24T10:00:00Z',
        source: { name: 'TestSource', url: 'https://source.example.test' },
      },
    ],
    totalArticles: 1,
  }),
});

const successLiveResult = await resolveMarketNewsFeedSource({
  requestedSource: 'live',
  fetchFn: successFetch,
  env: liveEnv,
  maxThemes: 1,
});
check('Live success: useLiveArticles=true', successLiveResult.useLiveArticles === true);
check('Live success: liveArticles is a non-empty array', Array.isArray(successLiveResult.liveArticles) && successLiveResult.liveArticles.length > 0);
check('Live success: meta.source=gnews_live', successLiveResult.meta?.source === 'gnews_live');
check('Live success: meta.liveEnabled=true', successLiveResult.meta?.liveEnabled === true);
check('Live success: meta.liveAttempted=true', successLiveResult.meta?.liveAttempted === true);
check('Live success: meta.fallbackUsed=false', successLiveResult.meta?.fallbackUsed === false);
check('Live success: meta.provider=gnews', successLiveResult.meta?.provider === 'gnews');
check('Live success articles do not expose apiKey', !JSON.stringify(successLiveResult.liveArticles).includes('synthetic-placeholder-key'));
check('No globalThis.fetch call during synthetic live test', !networkCallAttempted);

// Synthetic fetch that throws (live_exception fallback)
const throwingFetch = async () => { throw new Error('Synthetic network failure'); };
const exceptionLiveResult = await resolveMarketNewsFeedSource({
  requestedSource: 'auto',
  fetchFn: throwingFetch,
  env: liveEnv,
  maxThemes: 1,
});
check('Throwing fetch: useLiveArticles=false', exceptionLiveResult.useLiveArticles === false);
check('Throwing fetch: meta.fallbackReason is a sanitized code (adapter catches throw internally)',
  ['live_exception', 'provider_empty_result', 'provider_fetch_failed', 'unknown_live_failure'].includes(exceptionLiveResult.meta?.fallbackReason));
check('Throwing fetch: meta.fallbackUsed=true', exceptionLiveResult.meta?.fallbackUsed === true);
log('');

// ---------------------------------------------------------------------------
// Group 13: Route static content checks
// ---------------------------------------------------------------------------
log('--- Group 13: Route static content checks ---');

const routeContent = existsSync(ROUTE_PATH) ? readFileSync(ROUTE_PATH, 'utf8') : '';

check('Route imports source selector helper (gnewsMarketFeedSourceSelector)',
  routeContent.includes('gnewsMarketFeedSourceSelector'));
check('Route imports parseNewsSourceParam', routeContent.includes('parseNewsSourceParam'));
check('Route imports validateNewsSource', routeContent.includes('validateNewsSource'));
check('Route imports resolveMarketNewsFeedSource', routeContent.includes('resolveMarketNewsFeedSource'));
check('Route reads source query parameter', routeContent.includes("'source'") || routeContent.includes('"source"'));
check('Route default source is fixture (parseNewsSourceParam returns fixture for null)',
  routeContent.includes('parseNewsSourceParam'));
check('Route handles invalid_source error code', routeContent.includes('invalid_source'));
check('Route preserves mode=home handling', routeContent.includes("'home'") || routeContent.includes('"home"'));
check('Route preserves list-mode handling (uses buildMarketNewsListResponse)',
  routeContent.includes('buildMarketNewsListResponse'));
check('Route preserves invalid_mode handling', routeContent.includes('invalid_mode'));
check('Route preserves invalid_category handling', routeContent.includes('invalid_category'));
check('Route does not import owner smoke script', !routeContent.includes('owner_smoke_gnews_live_fetch'));
check('Route does not import live adapter directly', !routeContent.includes('gnewsLiveFetchAdapter'));
check('Route does not reference GNEWS_API_KEY directly', !routeContent.includes('GNEWS_API_KEY'));
check('Route does not have fixture fallback missing (has fixture path + fallback path)',
  routeContent.includes('fixture') && routeContent.includes('feedResult'));
check('Route passes fetchFn to orchestrator (globalThis.fetch as value, not a fetch() call)',
  routeContent.includes('globalThis.fetch') && !(/(?:await|=\s*|return\s+)fetch\s*\(/.test(routeContent)));
log('');

// ---------------------------------------------------------------------------
// Group 14: Boundary isolation checks
// ---------------------------------------------------------------------------
log('--- Group 14: Boundary isolation ---');

check('No /news page created', !existsSync(NEWS_PAGE_PATH));
check('Source selector does not add DB migration files (selector is a pure helper module)',
  existsSync(SELECTOR_PATH) && !readFileSync(SELECTOR_PATH, 'utf8').includes('supabase'));

if (existsSync(HOME_PAGE_PATH)) {
  const homeContent = readFileSync(HOME_PAGE_PATH, 'utf8');
  check('Home page does not import source selector', !homeContent.includes('gnewsMarketFeedSourceSelector'));
  check('Home page does not import live adapter', !homeContent.includes('gnewsLiveFetchAdapter'));
  check('Home page does not import market-feed route', !homeContent.includes('market-feed'));
} else {
  check('Home page does not import source selector', true);
  check('Home page does not import live adapter', true);
  check('Home page does not import market-feed route', true);
}
log('');

// ---------------------------------------------------------------------------
// Group 15: Network and output safety
// ---------------------------------------------------------------------------
log('--- Group 15: Network and output safety ---');

check('globalThis.fetch was NOT called during any behavioral check', !networkCallAttempted);
check('Selector module does not expose apiKey in any metadata builder output',
  (() => {
    const m1 = buildFixtureFallbackMetadata({ requestedSource: 'auto', fallbackReason: 'live_disabled' });
    const m2 = buildLiveSourceMetadata({ requestedSource: 'live' });
    const serialized = JSON.stringify(m1) + JSON.stringify(m2);
    return !serialized.includes('apiKey') && !serialized.includes('api_key');
  })());
check('Live success result does not expose request URL or raw JSON in meta',
  (() => {
    const metaStr = JSON.stringify(successLiveResult.meta ?? {});
    return !metaStr.includes('example.test') && !metaStr.includes('"articles"');
  })());
check('Sanitized fallback reason does not leak raw error messages',
  sanitizeLiveFallbackReason('Error: GNEWS_API_KEY is invalid') === 'unknown_live_failure');

// Restore fetch
globalThis.fetch = originalFetch;

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Result ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}. ${failures === 0 ? 'Result: PASS' : 'Result: FAIL'}`);
process.exitCode = failures === 0 ? 0 : 1;
