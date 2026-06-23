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
 * Builds the home-mode response from a fixture object.
 * Selects up to 6 articles with category/source balancing.
 * @param {object} fixture
 * @returns {object}
 */
export function buildMarketNewsHomeResponse(fixture) {
  const articles = Array.isArray(fixture?.articles) ? fixture.articles : [];
  const activeNonDup = articles.filter((a) => a.isActive && !a.isDuplicate);

  const result = selectHomeArticles(articles, {
    count: POLICY.HOME_COUNT,
    maxPerCategory: POLICY.HOME_MAX_PER_CATEGORY,
    maxPerSource: POLICY.HOME_MAX_PER_SOURCE,
  });

  return {
    ok: true,
    mode: 'home',
    source: 'fixture',
    liveEnabled: false,
    count: result.count,
    totalActive: activeNonDup.length,
    lastRefreshedAt: null,
    staleState: 'fixture',
    articles: result.articles.map(sanitizeMarketNewsArticle),
  };
}

// ---------------------------------------------------------------------------
// buildMarketNewsListResponse
// ---------------------------------------------------------------------------

/**
 * Builds the list-mode response from a fixture object.
 * Paginates active, non-duplicate articles by relevance score.
 * @param {object} fixture
 * @param {{ page?: number, category?: string | null }} options
 * @returns {object}
 */
export function buildMarketNewsListResponse(fixture, { page = 1, category = null } = {}) {
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

  return {
    ok: true,
    mode: 'list',
    source: 'fixture',
    liveEnabled: false,
    pagination: result.pagination,
    oldestFetchedAt: articleDates.length > 0 ? new Date(Math.min(...articleDates)).toISOString() : null,
    newestFetchedAt: articleDates.length > 0 ? new Date(Math.max(...articleDates)).toISOString() : null,
    articles: result.articles.map(sanitizeMarketNewsArticle),
  };
}

// ---------------------------------------------------------------------------
// buildMarketNewsErrorResponse
// ---------------------------------------------------------------------------

/**
 * Builds a sanitized error response body and status code.
 * Never exposes stack traces, raw exception messages, or internal details.
 * @param {number} status  HTTP status code (400, 404, 500, …)
 * @param {string} code    One of: invalid_mode, invalid_category, fixture_unavailable, internal_unavailable
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
