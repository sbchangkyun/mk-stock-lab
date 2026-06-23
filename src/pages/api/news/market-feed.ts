import type { APIRoute } from 'astro';
// @ts-ignore - Vite resolves .mjs at build time; no TypeScript declarations for this utility
import {
  buildMarketNewsHomeResponse,
  buildMarketNewsListResponse,
  buildMarketNewsErrorResponse,
  VALID_MODES,
  VALID_CATEGORIES,
} from '../../../lib/news/gnewsMarketFeedResponse.mjs';
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

export const GET: APIRoute = ({ url }) => {
  const params = url.searchParams;
  const mode = params.get('mode') ?? 'home';
  const rawCategory = params.get('category');

  if (!(VALID_MODES as string[]).includes(mode)) {
    const err = buildMarketNewsErrorResponse(400, 'invalid_mode');
    return jsonResponse(err.body, err.status);
  }

  if (rawCategory !== null && !(VALID_CATEGORIES as string[]).includes(rawCategory)) {
    const err = buildMarketNewsErrorResponse(400, 'invalid_category');
    return jsonResponse(err.body, err.status);
  }

  if (mode === 'home') {
    return jsonResponse(buildMarketNewsHomeResponse(fixture));
  }

  const page = Math.max(1, safeParseInt(params.get('page'), 1));
  return jsonResponse(buildMarketNewsListResponse(fixture, { page, category: rawCategory }));
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
