/**
 * GNews market-feed response builder — no-network fixture-backed utility.
 * Pure functions only. No file I/O, no network, no env reads, no side effects.
 * Usable by the Astro API route and by no-network validator scripts.
 */

import {
  selectHomeArticles,
  paginateArticles,
  POLICY,
} from './gnewsNewsPolicy.mjs';

export const VALID_MODES = ['home', 'list'];
export const VALID_CATEGORIES = [...POLICY.EXPECTED_CATEGORIES];

const ERROR_MESSAGES = {
  invalid_mode: 'Unsupported news feed request.',
  invalid_category: 'Unsupported news category.',
  invalid_source: 'Unsupported news source.',
  fixture_unavailable: 'News feed temporarily unavailable.',
  internal_unavailable: 'News feed temporarily unavailable.',
};

// ---------------------------------------------------------------------------
// sanitizeMarketNewsArticle
// ---------------------------------------------------------------------------

/**
 * Returns only the public fields for a market news article.
 * Intentionally excludes all internal storage fields.
 * @param {object} article
 * @returns {object}
 */
export function sanitizeMarketNewsArticle(article) {
  return {
    id: String(article.id ?? ''),
    title: String(article.title ?? ''),
    description: article.description ?? null,
    url: String(article.url ?? ''),
    imageUrl: article.imageUrl ?? null,
    sourceName: String(article.sourceName ?? ''),
    publishedAt: String(article.publishedAt ?? ''),
    category: String(article.category ?? ''),
    relevanceScore: Number(article.relevanceScore ?? 0),
  };
}

// ---------------------------------------------------------------------------
// buildMarketNewsHomeResponse
// ---------------------------------------------------------------------------

/**
 * Builds the home-mode response from a fixture object with optional source metadata.
 * Selects up to 6 articles with category/source balancing.
 * @param {object} fixture
 * @param {object} [meta] Optional source selector metadata to merge into response.
 * @returns {object}
 */
export function buildMarketNewsHomeResponse(fixture, meta = {}) {
  const articles = Array.isArray(fixture?.articles) ? fixture.articles : [];
  const activeNonDup = articles.filter((a) => a.isActive && !a.isDuplicate);

  const result = selectHomeArticles(articles, {
    count: POLICY.HOME_COUNT,
    maxPerCategory: POLICY.HOME_MAX_PER_CATEGORY,
    maxPerSource: POLICY.HOME_MAX_PER_SOURCE,
  });

  const response = {
    ok: true,
    mode: 'home',
    source: meta.source ?? 'fixture',
    liveEnabled: meta.liveEnabled ?? false,
    count: result.count,
    totalActive: activeNonDup.length,
    lastRefreshedAt: null,
    staleState: 'fixture',
    articles: result.articles.map(sanitizeMarketNewsArticle),
  };

  if (meta.requestedSource !== undefined) response.requestedSource = meta.requestedSource;
  if (meta.liveAttempted !== undefined) response.liveAttempted = meta.liveAttempted;
  if (meta.fallbackUsed !== undefined) response.fallbackUsed = meta.fallbackUsed;
  if (meta.fallbackReason !== undefined) response.fallbackReason = meta.fallbackReason;
  if (meta.provider !== undefined) response.provider = meta.provider;

  return response;
}

// ---------------------------------------------------------------------------
// buildMarketNewsListResponse
// ---------------------------------------------------------------------------

/**
 * Builds the list-mode response from a fixture object with optional source metadata.
 * Paginates active, non-duplicate articles by relevance score.
 * @param {object} fixture
 * @param {{ page?: number, category?: string | null }} options
 * @param {object} [meta] Optional source selector metadata to merge into response.
 * @returns {object}
 */
export function buildMarketNewsListResponse(fixture, { page = 1, category = null } = {}, meta = {}) {
  const articles = Array.isArray(fixture?.articles) ? fixture.articles : [];

  const eligible = category
    ? articles.filter((a) => a.category === category)
    : articles;

  const result = paginateArticles(eligible, {
    page,
    pageSize: POLICY.PAGE_SIZE,
    maxPages: POLICY.MAX_PAGES,
  });

  const articleDates = result.articles
    .map((a) => new Date(a.publishedAt).getTime())
    .filter((t) => Number.isFinite(t));

  const response = {
    ok: true,
    mode: 'list',
    source: meta.source ?? 'fixture',
    liveEnabled: meta.liveEnabled ?? false,
    pagination: result.pagination,
    oldestFetchedAt: articleDates.length > 0 ? new Date(Math.min(...articleDates)).toISOString() : null,
    newestFetchedAt: articleDates.length > 0 ? new Date(Math.max(...articleDates)).toISOString() : null,
    articles: result.articles.map(sanitizeMarketNewsArticle),
  };

  if (meta.requestedSource !== undefined) response.requestedSource = meta.requestedSource;
  if (meta.liveAttempted !== undefined) response.liveAttempted = meta.liveAttempted;
  if (meta.fallbackUsed !== undefined) response.fallbackUsed = meta.fallbackUsed;
  if (meta.fallbackReason !== undefined) response.fallbackReason = meta.fallbackReason;
  if (meta.provider !== undefined) response.provider = meta.provider;

  return response;
}

// ---------------------------------------------------------------------------
// buildMarketNewsHomeResponseFromArticles
// ---------------------------------------------------------------------------

/**
 * Builds a home-mode response from an arbitrary normalized article array (live path).
 * @param {object[]} articles Normalized articles from the live adapter.
 * @param {object} meta Source selector metadata.
 * @returns {object}
 */
export function buildMarketNewsHomeResponseFromArticles(articles, meta = {}) {
  const articleList = Array.isArray(articles) ? articles : [];
  const activeNonDup = articleList.filter((a) => a.isActive && !a.isDuplicate);

  const result = selectHomeArticles(articleList, {
    count: POLICY.HOME_COUNT,
    maxPerCategory: POLICY.HOME_MAX_PER_CATEGORY,
    maxPerSource: POLICY.HOME_MAX_PER_SOURCE,
  });

  const fetchedTimes = articleList
    .map((a) => new Date(a.fetchedAt ?? a.publishedAt ?? '').getTime())
    .filter((t) => Number.isFinite(t));
  const lastRefreshedAt = fetchedTimes.length > 0
    ? new Date(Math.max(...fetchedTimes)).toISOString()
    : new Date().toISOString();

  return {
    ok: true,
    mode: 'home',
    source: meta.source ?? 'gnews_live',
    liveEnabled: meta.liveEnabled ?? true,
    count: result.count,
    totalActive: activeNonDup.length,
    lastRefreshedAt,
    staleState: 'live',
    articles: result.articles.map(sanitizeMarketNewsArticle),
    requestedSource: meta.requestedSource,
    liveAttempted: meta.liveAttempted ?? true,
    fallbackUsed: meta.fallbackUsed ?? false,
    ...(meta.provider !== undefined ? { provider: meta.provider } : {}),
  };
}

// ---------------------------------------------------------------------------
// buildMarketNewsListResponseFromArticles
// ---------------------------------------------------------------------------

/**
 * Builds a list-mode response from an arbitrary normalized article array (live path).
 * @param {object[]} articles Normalized articles from the live adapter.
 * @param {{ page?: number, category?: string | null }} options
 * @param {object} meta Source selector metadata.
 * @returns {object}
 */
export function buildMarketNewsListResponseFromArticles(articles, { page = 1, category = null } = {}, meta = {}) {
  const articleList = Array.isArray(articles) ? articles : [];

  const eligible = category
    ? articleList.filter((a) => a.category === category)
    : articleList;

  const result = paginateArticles(eligible, {
    page,
    pageSize: POLICY.PAGE_SIZE,
    maxPages: POLICY.MAX_PAGES,
  });

  const articleDates = result.articles
    .map((a) => new Date(a.publishedAt).getTime())
    .filter((t) => Number.isFinite(t));

  return {
    ok: true,
    mode: 'list',
    source: meta.source ?? 'gnews_live',
    liveEnabled: meta.liveEnabled ?? true,
    pagination: result.pagination,
    oldestFetchedAt: articleDates.length > 0 ? new Date(Math.min(...articleDates)).toISOString() : null,
    newestFetchedAt: articleDates.length > 0 ? new Date(Math.max(...articleDates)).toISOString() : null,
    articles: result.articles.map(sanitizeMarketNewsArticle),
    requestedSource: meta.requestedSource,
    liveAttempted: meta.liveAttempted ?? true,
    fallbackUsed: meta.fallbackUsed ?? false,
    ...(meta.provider !== undefined ? { provider: meta.provider } : {}),
  };
}

// ---------------------------------------------------------------------------
// buildMarketNewsErrorResponse
// ---------------------------------------------------------------------------

/**
 * Builds a sanitized error response body and status code.
 * Never exposes stack traces, raw exception messages, or internal details.
 * @param {number} status  HTTP status code (400, 404, 500, …)
 * @param {string} code    One of the known error codes
 * @returns {{ status: number, body: object }}
 */
export function buildMarketNewsErrorResponse(status, code) {
  return {
    status,
    body: {
      ok: false,
      error: {
        code: String(code),
        message: ERROR_MESSAGES[code] ?? 'Unsupported news feed request.',
      },
    },
  };
}
