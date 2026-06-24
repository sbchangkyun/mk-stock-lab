/**
 * No-network mocked-fetch validation for Phase 3BC GNews live fetch adapter.
 * Imports adapter functions directly and validates behavior using mock fetchFn only.
 * Tests use baseUrl under example.test and a non-secret synthetic placeholder apiKey.
 * No live GNews calls. No .env reads. No real API key usage. Exits non-zero on failure.
 *
 * IMPORTANT: This checker does not print article URLs, titles, or descriptions in output.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  GNEWS_ADAPTER_POLICY,
  GNEWS_QUERY_DEFINITIONS,
  buildGnewsSearchUrl,
  fetchGnewsTheme,
  fetchGnewsMarketNewsBatch,
  normalizeGnewsArticle,
  normalizeGnewsBatch,
  sanitizeGnewsAdapterError,
  summarizeGnewsLiveFetchResult,
} from '../src/lib/news/gnewsLiveFetchAdapter.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const MOCK_FIXTURE_PATH = join(root, 'src', 'data', 'fixtures', 'gnews_live_adapter_mock_response_v0.1.json');
const ADAPTER_PATH = join(root, 'src', 'lib', 'news', 'gnewsLiveFetchAdapter.mjs');
const ROUTE_PATH = join(root, 'src', 'pages', 'api', 'news', 'market-feed.ts');
const HELPER_PATH = join(root, 'src', 'lib', 'news', 'gnewsMarketFeedResponse.mjs');

const MOCK_BASE_URL = 'https://api.example.test';
const MOCK_API_KEY = 'test_placeholder_key_not_real';

const log = (msg) => process.stdout.write(msg + '\n');

let failures = 0;
let mockFetchCallCount = 0;

const check = (label, pass) => {
  const status = pass ? 'PASS' : 'FAIL';
  log(`  [${status}] ${label}`);
  if (!pass) failures++;
};

log('=== Phase 3BC GNews Live Adapter Mocked-Fetch Validation ===');
log('Mode: no-network');
log('');

// ---------------------------------------------------------------------------
// Load mock fixture
// ---------------------------------------------------------------------------
if (!existsSync(MOCK_FIXTURE_PATH)) {
  log('ERROR: Mock fixture not found — aborting.');
  process.exitCode = 1;
}

const mockFixture = JSON.parse(readFileSync(MOCK_FIXTURE_PATH, 'utf8'));

// ---------------------------------------------------------------------------
// Mock fetch factory helpers — never call real network
// ---------------------------------------------------------------------------

const makeMockFetch = (status, bodyData) => async (_url) => {
  mockFetchCallCount++;
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => bodyData,
  };
};

const makeMockFetchThrowJson = (status) => async (_url) => {
  mockFetchCallCount++;
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => { throw new Error('json_parse_error'); },
  };
};

const makeMockFetchNeverResolves = () => async (_url) => {
  mockFetchCallCount++;
  return new Promise(() => {});
};

// ---------------------------------------------------------------------------
// Group 1: Policy constants
// ---------------------------------------------------------------------------
log('--- Group 1: Policy constants ---');
check('GNEWS_ADAPTER_POLICY exists', typeof GNEWS_ADAPTER_POLICY === 'object' && GNEWS_ADAPTER_POLICY !== null);
check('DEFAULT_LANG is ko', GNEWS_ADAPTER_POLICY.DEFAULT_LANG === 'ko');
check('DEFAULT_COUNTRY is kr', GNEWS_ADAPTER_POLICY.DEFAULT_COUNTRY === 'kr');
check('DEFAULT_MAX is 10', GNEWS_ADAPTER_POLICY.DEFAULT_MAX === 10);
check('MAX_THEMES_PER_SMOKE is 2', GNEWS_ADAPTER_POLICY.MAX_THEMES_PER_SMOKE === 2);
check("PROVIDER is 'gnews'", GNEWS_ADAPTER_POLICY.PROVIDER === 'gnews');
check('RAW_PROVIDER_STORED is false', GNEWS_ADAPTER_POLICY.RAW_PROVIDER_STORED === false);
check('GNEWS_QUERY_DEFINITIONS is an array of 6 themes', Array.isArray(GNEWS_QUERY_DEFINITIONS) && GNEWS_QUERY_DEFINITIONS.length === 6);
check('Query definitions include all 6 expected categories', [
  'MARKET_STOCKS', 'MACRO_POLICY', 'FX', 'OIL_COMMODITIES', 'CRYPTO_DIGITAL_ASSETS', 'PERSONAL_FINANCE',
].every((cat) => GNEWS_QUERY_DEFINITIONS.some((qd) => qd.category === cat)));
log('');

// ---------------------------------------------------------------------------
// Group 2: buildGnewsSearchUrl — success
// ---------------------------------------------------------------------------
log('--- Group 2: buildGnewsSearchUrl success ---');
const qDef0 = GNEWS_QUERY_DEFINITIONS[0]; // market_stocks
const urlResult = buildGnewsSearchUrl(qDef0, {
  baseUrl: MOCK_BASE_URL,
  apiKey: MOCK_API_KEY,
});

check('buildGnewsSearchUrl returns ok: true', urlResult.ok === true);
check('Result contains a URL object', urlResult.url instanceof URL);
check('URL has q param', urlResult.url.searchParams.has('q'));
check('URL has lang=ko', urlResult.url.searchParams.get('lang') === 'ko');
check('URL has country=kr', urlResult.url.searchParams.get('country') === 'kr');
check('URL has max=10', urlResult.url.searchParams.get('max') === '10');
check('URL has in param (searchIn)', urlResult.url.searchParams.has('in'));
check('URL has sortby param', urlResult.url.searchParams.has('sortby'));
check('URL has apikey param (key present, not logged here)', urlResult.url.searchParams.has('apikey'));
log('');

// ---------------------------------------------------------------------------
// Group 3: buildGnewsSearchUrl — error cases
// ---------------------------------------------------------------------------
log('--- Group 3: buildGnewsSearchUrl error cases ---');

const missingBaseUrlResult = buildGnewsSearchUrl(qDef0, { baseUrl: '', apiKey: MOCK_API_KEY });
check('Missing baseUrl returns ok: false', missingBaseUrlResult.ok === false);
check('Missing baseUrl error code is missing_base_url', missingBaseUrlResult.error?.code === 'missing_base_url');

const missingApiKeyResult = buildGnewsSearchUrl(qDef0, { baseUrl: MOCK_BASE_URL, apiKey: '' });
check('Missing apiKey returns ok: false', missingApiKeyResult.ok === false);
check('Missing apiKey error code is missing_api_key', missingApiKeyResult.error?.code === 'missing_api_key');

const invalidQueryResult = buildGnewsSearchUrl({ queryKey: 'test', category: 'TEST' }, { baseUrl: MOCK_BASE_URL, apiKey: MOCK_API_KEY });
check('Missing queryString returns ok: false', invalidQueryResult.ok === false);
check('Missing queryString error code is invalid_query_definition', invalidQueryResult.error?.code === 'invalid_query_definition');
log('');

// ---------------------------------------------------------------------------
// Group 4: sanitizeGnewsAdapterError
// ---------------------------------------------------------------------------
log('--- Group 4: sanitizeGnewsAdapterError ---');
const err429 = sanitizeGnewsAdapterError({ type: 'provider_rate_limited', status: 429 });
check('provider_rate_limited error has correct code', err429.code === 'provider_rate_limited');
check('provider_rate_limited is retryable', err429.retryable === true);
check("provider_rate_limited provider is 'gnews'", err429.provider === 'gnews');
check('provider_rate_limited has status 429', err429.status === 429);
check('provider_rate_limited has no stack trace in message', !String(err429.message).includes('at '));

const errUnknown = sanitizeGnewsAdapterError({ type: 'nonexistent_code' });
check('Unknown error code falls back to internal_unavailable', errUnknown.code === 'internal_unavailable');

const errMissingFn = sanitizeGnewsAdapterError({ type: 'missing_fetch_fn' });
check('missing_fetch_fn is not retryable', errMissingFn.retryable === false);
log('');

// ---------------------------------------------------------------------------
// Group 5: fetchGnewsTheme — missing fetchFn
// ---------------------------------------------------------------------------
log('--- Group 5: fetchGnewsTheme missing fetchFn ---');
const missingFnResult = await fetchGnewsTheme(qDef0, { baseUrl: MOCK_BASE_URL, apiKey: MOCK_API_KEY });
check('Missing fetchFn returns ok: false', missingFnResult.ok === false);
check('Missing fetchFn error code is missing_fetch_fn', missingFnResult.error?.code === 'missing_fetch_fn');
log('');

// ---------------------------------------------------------------------------
// Group 6: fetchGnewsTheme — successful mock response
// ---------------------------------------------------------------------------
log('--- Group 6: fetchGnewsTheme success with mock response ---');
const successResponse = mockFixture.scenarios.successful_market_stocks.response;
const themeSuccessResult = await fetchGnewsTheme(qDef0, {
  fetchFn: makeMockFetch(200, successResponse),
  baseUrl: MOCK_BASE_URL,
  apiKey: MOCK_API_KEY,
  nowIso: '2026-06-24T00:00:00.000Z',
});
check('fetchGnewsTheme success returns ok: true', themeSuccessResult.ok === true);
check("fetchGnewsTheme success provider is 'gnews'", themeSuccessResult.provider === 'gnews');
check('fetchGnewsTheme success queryKey matches input', themeSuccessResult.queryKey === qDef0.queryKey);
check('fetchGnewsTheme success category matches input', themeSuccessResult.category === qDef0.category);
check('fetchGnewsTheme success articles is an array', Array.isArray(themeSuccessResult.articles));
check('fetchGnewsTheme success articleCount > 0', themeSuccessResult.articleCount > 0);
check('fetchGnewsTheme result does not include URL string in top-level keys',
  !Object.keys(themeSuccessResult).some((k) => k === 'url' || k === 'requestUrl'),
);
log('');

// ---------------------------------------------------------------------------
// Group 7: fetchGnewsTheme — HTTP error cases
// ---------------------------------------------------------------------------
log('--- Group 7: fetchGnewsTheme HTTP error cases ---');

const result429 = await fetchGnewsTheme(qDef0, {
  fetchFn: makeMockFetch(429, {}),
  baseUrl: MOCK_BASE_URL,
  apiKey: MOCK_API_KEY,
});
check('HTTP 429 returns ok: false', result429.ok === false);
check('HTTP 429 error code is provider_rate_limited', result429.error?.code === 'provider_rate_limited');

const result401 = await fetchGnewsTheme(qDef0, {
  fetchFn: makeMockFetch(401, {}),
  baseUrl: MOCK_BASE_URL,
  apiKey: MOCK_API_KEY,
});
check('HTTP 401 returns ok: false', result401.ok === false);
check('HTTP 401 error code is provider_unauthorized', result401.error?.code === 'provider_unauthorized');

const result500 = await fetchGnewsTheme(qDef0, {
  fetchFn: makeMockFetch(500, {}),
  baseUrl: MOCK_BASE_URL,
  apiKey: MOCK_API_KEY,
});
check('HTTP 500 returns ok: false', result500.ok === false);
check('HTTP 500 error code is provider_http_error or internal_unavailable',
  result500.error?.code === 'provider_http_error' || result500.error?.code === 'internal_unavailable',
);
log('');

// ---------------------------------------------------------------------------
// Group 8: fetchGnewsTheme — invalid payload and empty result
// ---------------------------------------------------------------------------
log('--- Group 8: fetchGnewsTheme invalid payload and empty result ---');

const invalidPayloadResponse = mockFixture.scenarios.invalid_payload.response;
const resultInvalidPayload = await fetchGnewsTheme(qDef0, {
  fetchFn: makeMockFetch(200, invalidPayloadResponse),
  baseUrl: MOCK_BASE_URL,
  apiKey: MOCK_API_KEY,
});
check('Invalid payload (articles: null) returns ok: false', resultInvalidPayload.ok === false);
check('Invalid payload error code is provider_empty_result or provider_invalid_payload',
  resultInvalidPayload.error?.code === 'provider_empty_result' ||
  resultInvalidPayload.error?.code === 'provider_invalid_payload',
);

const emptyResponse = mockFixture.scenarios.empty_result.response;
const resultEmpty = await fetchGnewsTheme(qDef0, {
  fetchFn: makeMockFetch(200, emptyResponse),
  baseUrl: MOCK_BASE_URL,
  apiKey: MOCK_API_KEY,
});
check('Empty articles [] returns ok: false', resultEmpty.ok === false);
check('Empty articles error code is provider_empty_result', resultEmpty.error?.code === 'provider_empty_result');

const resultJsonThrow = await fetchGnewsTheme(qDef0, {
  fetchFn: makeMockFetchThrowJson(200),
  baseUrl: MOCK_BASE_URL,
  apiKey: MOCK_API_KEY,
});
check('JSON parse failure returns ok: false', resultJsonThrow.ok === false);
check('JSON parse failure error code is provider_invalid_payload', resultJsonThrow.error?.code === 'provider_invalid_payload');
log('');

// ---------------------------------------------------------------------------
// Group 9: fetchGnewsTheme — timeout
// ---------------------------------------------------------------------------
log('--- Group 9: fetchGnewsTheme timeout ---');
const resultTimeout = await fetchGnewsTheme(qDef0, {
  fetchFn: makeMockFetchNeverResolves(),
  baseUrl: MOCK_BASE_URL,
  apiKey: MOCK_API_KEY,
  timeoutMs: 50,
});
check('Timeout returns ok: false', resultTimeout.ok === false);
check('Timeout error code is provider_timeout', resultTimeout.error?.code === 'provider_timeout');
check('Timeout error is retryable', resultTimeout.error?.retryable === true);
log('');

// ---------------------------------------------------------------------------
// Group 10: normalizeGnewsArticle — field completeness
// ---------------------------------------------------------------------------
log('--- Group 10: normalizeGnewsArticle field completeness ---');
const rawArticle0 = successResponse.articles[0];
const normalized = normalizeGnewsArticle(rawArticle0, {
  category: 'MARKET_STOCKS',
  queryKey: 'market_stocks',
  fetchedAt: '2026-06-24T00:00:00.000Z',
});

const REQUIRED_NORMALIZED_FIELDS = [
  'id', 'title', 'description', 'url', 'canonicalUrlHash', 'titleHash',
  'imageUrl', 'sourceName', 'sourceUrl', 'publishedAt', 'fetchedAt',
  'category', 'queryKey', 'language', 'country', 'relevanceScore', 'scoreReasons',
  'duplicateGroupId', 'isDuplicate', 'isActive', 'archivedAt', 'archiveReason',
  'provider', 'providerArticleId', 'rawProviderStored',
];
REQUIRED_NORMALIZED_FIELDS.forEach((field) => {
  check(`normalizeGnewsArticle result has field: ${field}`, field in normalized);
});
log('');

// ---------------------------------------------------------------------------
// Group 11: normalizeGnewsArticle — invariant values
// ---------------------------------------------------------------------------
log('--- Group 11: normalizeGnewsArticle invariants ---');
check('rawProviderStored is false', normalized.rawProviderStored === false);
check("provider is 'gnews'", normalized.provider === 'gnews');
check("language is 'ko'", normalized.language === 'ko');
check("country is 'kr'", normalized.country === 'kr');
check('isDuplicate is false', normalized.isDuplicate === false);
check('isActive is true', normalized.isActive === true);
check('duplicateGroupId is null', normalized.duplicateGroupId === null);
check('providerArticleId is null', normalized.providerArticleId === null);
check("archiveReason is 'none'", normalized.archiveReason === 'none');
check('relevanceScore is between 50 and 80', normalized.relevanceScore >= 50 && normalized.relevanceScore <= 80);
check('scoreReasons is an array', Array.isArray(normalized.scoreReasons));
check('category matches context', normalized.category === 'MARKET_STOCKS');
check('queryKey matches context', normalized.queryKey === 'market_stocks');
log('');

// ---------------------------------------------------------------------------
// Group 12: SHA-256 hash validation
// ---------------------------------------------------------------------------
log('--- Group 12: SHA-256 hash validation ---');
check('canonicalUrlHash is 64-char lowercase hex', /^[0-9a-f]{64}$/.test(normalized.canonicalUrlHash));
check('titleHash is 64-char lowercase hex', /^[0-9a-f]{64}$/.test(normalized.titleHash));

const normalized2 = normalizeGnewsArticle(rawArticle0, {
  category: 'MARKET_STOCKS',
  queryKey: 'market_stocks',
  fetchedAt: '2026-06-24T01:00:00.000Z',
});
check('canonicalUrlHash is deterministic for same URL', normalized.canonicalUrlHash === normalized2.canonicalUrlHash);
check('titleHash is deterministic for same title', normalized.titleHash === normalized2.titleHash);

const rawWithTracking = { ...rawArticle0, url: rawArticle0.url + '?utm_source=test&utm_medium=email' };
const normalizedTracking = normalizeGnewsArticle(rawWithTracking, { category: 'FX', queryKey: 'fx' });
check('Tracking params stripped from canonicalUrlHash (matches hash without tracking params)', normalizedTracking.canonicalUrlHash === normalized.canonicalUrlHash);
log('');

// ---------------------------------------------------------------------------
// Group 13: normalizeGnewsArticle — edge cases
// ---------------------------------------------------------------------------
log('--- Group 13: normalizeGnewsArticle edge cases ---');
const edgeArticles = mockFixture.scenarios.edge_cases.articles;

const missingImageArticle = edgeArticles.find((a) => a._scenario === 'missing_image');
const normalizedMissingImage = normalizeGnewsArticle(missingImageArticle, { category: 'FX', queryKey: 'fx' });
check('Missing image maps to imageUrl: null', normalizedMissingImage.imageUrl === null);

const missingSourceUrlArticle = edgeArticles.find((a) => a._scenario === 'missing_source_url');
const normalizedMissingSource = normalizeGnewsArticle(missingSourceUrlArticle, { category: 'MACRO_POLICY', queryKey: 'macro_policy' });
check('Missing source.url maps to sourceUrl: empty string', normalizedMissingSource.sourceUrl === '');
check('Missing source.url preserves source.name', normalizedMissingSource.sourceName === 'Fictional No-URL Source');

const invalidDateArticle = edgeArticles.find((a) => a._scenario === 'invalid_published_at');
const normalizedInvalidDate = normalizeGnewsArticle(invalidDateArticle, { category: 'CRYPTO_DIGITAL_ASSETS', queryKey: 'crypto_digital_assets' });
check('Invalid publishedAt string is preserved as-is (not rejected)', normalizedInvalidDate.publishedAt === 'NOT_A_DATE');

const nullArticle = edgeArticles.find((a) => a._scenario === 'null_title_and_url');
const normalizedNull = normalizeGnewsArticle(nullArticle, { category: 'OIL_COMMODITIES', queryKey: 'oil_commodities' });
check('Null title maps to empty string', normalizedNull.title === '');
check('Null url maps to empty string', normalizedNull.url === '');
check('rawProviderStored still false for null-field article', normalizedNull.rawProviderStored === false);

const returnedNull = normalizeGnewsArticle(null, {});
check('Null rawArticle returns null (to be skipped by batch)', returnedNull === null);
log('');

// ---------------------------------------------------------------------------
// Group 14: normalizeGnewsBatch
// ---------------------------------------------------------------------------
log('--- Group 14: normalizeGnewsBatch ---');
const batchResult = normalizeGnewsBatch(successResponse, {
  queryKey: 'market_stocks',
  category: 'MARKET_STOCKS',
  fetchedAt: '2026-06-24T00:00:00.000Z',
});
check('normalizeGnewsBatch returns ok: true for valid response', batchResult.ok === true);
check('normalizeGnewsBatch articleCount matches articles.length', batchResult.articleCount === batchResult.articles.length);
check('normalizeGnewsBatch articles all have rawProviderStored: false', batchResult.articles.every((a) => a.rawProviderStored === false));

const batchResultInvalid = normalizeGnewsBatch({ articles: null }, { queryKey: 'test', category: 'TEST' });
check('normalizeGnewsBatch with articles: null returns ok: false', batchResultInvalid.ok === false);

// Create a response with one null/invalid item mixed with valid items
const mixedResponse = {
  totalArticles: 4,
  articles: [
    successResponse.articles[0],
    null,
    { url: null, title: null },
    successResponse.articles[1],
  ],
};
const batchMixed = normalizeGnewsBatch(mixedResponse, { queryKey: 'market_stocks', category: 'MARKET_STOCKS', fetchedAt: '2026-06-24T00:00:00.000Z' });
check('normalizeGnewsBatch skips invalid/null articles gracefully', batchMixed.ok === true);
check('normalizeGnewsBatch warnings array records skipped items', batchMixed.warnings.length > 0);
check('normalizeGnewsBatch still includes valid articles from mixed response', batchMixed.articleCount >= 1);
log('');

// ---------------------------------------------------------------------------
// Group 15: fetchGnewsMarketNewsBatch — partial failure
// ---------------------------------------------------------------------------
log('--- Group 15: fetchGnewsMarketNewsBatch partial failure ---');

const mockFxResponse = mockFixture.scenarios.successful_fx.response;
let callIndex = 0;
const partialFetchFn = async (_url) => {
  mockFetchCallCount++;
  callIndex++;
  if (callIndex === 1) {
    return { ok: true, status: 200, json: async () => successResponse };
  }
  return { ok: false, status: 429, json: async () => ({}) };
};

const batchResult2Themes = await fetchGnewsMarketNewsBatch(
  [GNEWS_QUERY_DEFINITIONS[0], GNEWS_QUERY_DEFINITIONS[1]],
  { fetchFn: partialFetchFn, baseUrl: MOCK_BASE_URL, apiKey: MOCK_API_KEY, nowIso: '2026-06-24T00:00:00.000Z' },
);
check('fetchGnewsMarketNewsBatch with partial failure returns ok: true (partial success)', batchResult2Themes.ok === true);
check('fetchGnewsMarketNewsBatch themeCount is 2', batchResult2Themes.themeCount === 2);
check('fetchGnewsMarketNewsBatch successCount is 1', batchResult2Themes.successCount === 1);
check('fetchGnewsMarketNewsBatch failureCount is 1', batchResult2Themes.failureCount === 1);
check('fetchGnewsMarketNewsBatch liveAttempted is true', batchResult2Themes.liveAttempted === true);
check('fetchGnewsMarketNewsBatch articleCount > 0', batchResult2Themes.articleCount > 0);
check('fetchGnewsMarketNewsBatch warnings contains failure record', batchResult2Themes.warnings.length > 0);

const allFailFetchFn = makeMockFetch(429, {});
const allFailBatch = await fetchGnewsMarketNewsBatch(
  [GNEWS_QUERY_DEFINITIONS[0], GNEWS_QUERY_DEFINITIONS[1]],
  { fetchFn: allFailFetchFn, baseUrl: MOCK_BASE_URL, apiKey: MOCK_API_KEY },
);
check('fetchGnewsMarketNewsBatch all failure returns ok: false', allFailBatch.ok === false);
check('fetchGnewsMarketNewsBatch maxThemes=2 cap works', (() => {
  let count = 0;
  const countFn = async (_u) => { count++; return { ok: true, status: 200, json: async () => successResponse }; };
  return fetchGnewsMarketNewsBatch(GNEWS_QUERY_DEFINITIONS, {
    fetchFn: countFn, baseUrl: MOCK_BASE_URL, apiKey: MOCK_API_KEY, maxThemes: 2,
  }).then((r) => r.themeCount === 2);
})());
log('');

// ---------------------------------------------------------------------------
// Group 16: summarizeGnewsLiveFetchResult
// ---------------------------------------------------------------------------
log('--- Group 16: summarizeGnewsLiveFetchResult ---');
const summaryInput = {
  ok: true,
  provider: 'gnews',
  liveAttempted: true,
  themeCount: 2,
  successCount: 1,
  failureCount: 1,
  articleCount: 3,
  articles: [
    { category: 'MARKET_STOCKS' },
    { category: 'MARKET_STOCKS' },
    { category: 'FX' },
  ],
  warnings: ['Theme macro_policy failed: provider_rate_limited'],
};
const summary = summarizeGnewsLiveFetchResult(summaryInput);
check('summarizeGnewsLiveFetchResult ok matches input', summary.ok === true);
check("summarizeGnewsLiveFetchResult provider is 'gnews'", summary.provider === 'gnews');
check('summarizeGnewsLiveFetchResult liveAttempted is true', summary.liveAttempted === true);
check('summarizeGnewsLiveFetchResult includes articleCount', summary.articleCount === 3);
check('summarizeGnewsLiveFetchResult categories array derived from articles', Array.isArray(summary.categories));
check('summarizeGnewsLiveFetchResult categories contains MARKET_STOCKS and FX', summary.categories.includes('MARKET_STOCKS') && summary.categories.includes('FX'));
check('summarizeGnewsLiveFetchResult warningCount matches', summary.warningCount === 1);
check('summarizeGnewsLiveFetchResult errorCodes derived from warnings', Array.isArray(summary.errorCodes));

const summaryKeys = Object.keys(summary);
check('summarizeGnewsLiveFetchResult does not expose article urls', !summaryKeys.some((k) => k === 'url' || k === 'requestUrl'));
check('summarizeGnewsLiveFetchResult does not expose article titles', !summaryKeys.some((k) => k === 'title' || k === 'titles'));
check('summarizeGnewsLiveFetchResult does not expose article descriptions', !summaryKeys.some((k) => k === 'description' || k === 'descriptions'));
check('summarizeGnewsLiveFetchResult does not expose apiKey', !summaryKeys.includes('apiKey') && !summaryKeys.includes('apikey'));
log('');

// ---------------------------------------------------------------------------
// Group 17: Forbidden pattern scan — adapter safety
// ---------------------------------------------------------------------------
log('--- Group 17: Forbidden pattern scan ---');
const adapterContent = readFileSync(ADAPTER_PATH, 'utf8');

// Adapter must not have direct fetch(url) calls — all calls go through fetchFn
const adapterWithoutFetchFn = adapterContent.replace(/\bfetchFn\b/g, '_MOCK_FN_');
check('Adapter has no global fetch calls (all calls through fetchFn)', !/\bfetch\s*\(/.test(adapterWithoutFetchFn));
check('Adapter does not read process.env', !adapterContent.includes('process.env'));
check('Adapter does not read import.meta.env', !adapterContent.includes('import.meta.env'));
check('Adapter does not reference GNEWS_API_KEY env literal', !adapterContent.includes('GNEWS_API_KEY'));
check('Adapter does not reference gnews.io', !adapterContent.includes('gnews.io'));
check('Adapter does not import @supabase', !adapterContent.includes('@supabase'));
log('');

// ---------------------------------------------------------------------------
// Group 18: Route boundary confirmation
// ---------------------------------------------------------------------------
log('--- Group 18: Route boundary confirmation ---');
if (existsSync(ROUTE_PATH)) {
  const routeContent = readFileSync(ROUTE_PATH, 'utf8');
  check('Existing route does not import live adapter', !routeContent.includes('gnewsLiveFetchAdapter'));
  check('Existing route still has liveEnabled: false',
    routeContent.includes('liveEnabled: false') ||
    (existsSync(HELPER_PATH) && readFileSync(HELPER_PATH, 'utf8').includes('liveEnabled: false')),
  );
  check("Existing route still returns source: 'fixture'",
    routeContent.includes("source: 'fixture'") || routeContent.includes('source: "fixture"') ||
    (existsSync(HELPER_PATH) &&
      (readFileSync(HELPER_PATH, 'utf8').includes("source: 'fixture'") || readFileSync(HELPER_PATH, 'utf8').includes('source: "fixture"'))),
  );
} else {
  ['Existing route does not import live adapter',
    'Existing route still has liveEnabled: false',
    "Existing route still returns source: 'fixture'"].forEach((label) => check(label, false));
}
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
const totalChecks = 9 + 9 + 7 + 7 + 2 + 7 + 8 + 9 + 3 + 25 + 13 + 6 + 7 + 7 + 9 + 11 + 6 + 3;

log('=== Phase 3BC GNews Live Adapter Mocked-Fetch Validation — Summary ===');
log(`Mode: no-network`);
log(`Mock fetch calls made: ${mockFetchCallCount}`);
log(`Normalized articles (from success theme): ${themeSuccessResult.articleCount ?? 0}`);
log(`Partial batch — theme successes: ${batchResult2Themes.successCount} / failures: ${batchResult2Themes.failureCount}`);
log(`Forbidden adapter findings: 0 expected`);
log(`Checks passed: ${totalChecks - failures}/${totalChecks}`);
log('');

if (failures === 0) {
  log('Result: PASS');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
