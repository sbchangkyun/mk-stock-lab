import type { APIRoute } from 'astro';
// @ts-ignore - Vite resolves .mjs at build time; no TypeScript declarations for this utility
import {
  buildMarketNewsHomeResponse,
  buildMarketNewsListResponse,
  buildMarketNewsHomeResponseFromArticles,
  buildMarketNewsListResponseFromArticles,
  buildMarketNewsErrorResponse,
  VALID_MODES,
  VALID_CATEGORIES,
} from '../../../lib/news/gnewsMarketFeedResponse.mjs';
// @ts-ignore
import {
  parseNewsSourceParam,
  validateNewsSource,
  resolveMarketNewsFeedSource,
  VALID_NEWS_SOURCES,
} from '../../../lib/news/gnewsMarketFeedSourceSelector.mjs';
import fixture from '../../../data/fixtures/gnews_market_news_fixture_v0.1.json';

export const prerender = false;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

const safeParseInt = (value: string | null, fallback: number): number => {
  if (value === null) return fallback;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

export const GET: APIRoute = async ({ url }) => {
  const params = url.searchParams;
  const mode = params.get('mode') ?? 'home';
  const rawCategory = params.get('category');
  const rawSource = params.get('source');

  if (!(VALID_MODES as string[]).includes(mode)) {
    const err = buildMarketNewsErrorResponse(400, 'invalid_mode');
    return jsonResponse(err.body, err.status);
  }

  if (rawCategory !== null && !(VALID_CATEGORIES as string[]).includes(rawCategory)) {
    const err = buildMarketNewsErrorResponse(400, 'invalid_category');
    return jsonResponse(err.body, err.status);
  }

  const requestedSource = parseNewsSourceParam(rawSource);
  const sourceCheck = validateNewsSource(requestedSource);
  if (!sourceCheck.ok) {
    const err = buildMarketNewsErrorResponse(400, 'invalid_source');
    return jsonResponse(err.body, err.status);
  }

  const page = Math.max(1, safeParseInt(params.get('page'), 1));

  // Fixture path: default, no env reads, no live calls
  if (requestedSource === 'fixture') {
    if (mode === 'home') return jsonResponse(buildMarketNewsHomeResponse(fixture));
    return jsonResponse(buildMarketNewsListResponse(fixture, { page, category: rawCategory }));
  }

  // auto / live path — orchestrator handles gate evaluation, live fetch, fixture fallback
  const feedResult = await resolveMarketNewsFeedSource({
    requestedSource,
    fetchFn: globalThis.fetch,
    // @ts-ignore
    env: import.meta.env,
    maxThemes: 2,
  });

  if (feedResult.useLiveArticles && Array.isArray(feedResult.liveArticles)) {
    if (mode === 'home') {
      return jsonResponse(buildMarketNewsHomeResponseFromArticles(feedResult.liveArticles, feedResult.meta));
    }
    return jsonResponse(
      buildMarketNewsListResponseFromArticles(feedResult.liveArticles, { page, category: rawCategory }, feedResult.meta),
    );
  }

  // Fixture fallback (gate failed, or live returned empty/error)
  if (mode === 'home') return jsonResponse(buildMarketNewsHomeResponse(fixture, feedResult.meta));
  return jsonResponse(buildMarketNewsListResponse(fixture, { page, category: rawCategory }, feedResult.meta));
};

export const ALL: APIRoute = () =>
  jsonResponse(
    {
      ok: false,
      error: {
        code: 'method_not_allowed',
        message: 'Method not allowed.',
      },
    },
    405,
  );
