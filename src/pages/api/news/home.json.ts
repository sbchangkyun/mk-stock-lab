/**
 * Phase 3GL — Home GNews feed route.
 *
 * GET /api/news/home.json
 *
 * Public route (no Supabase auth, no client-controlled input). Reads GNEWS_API_KEY only — never a
 * PUBLIC_ fallback, since this key must never reach the client bundle. Absent key returns a sanitized
 * NEWS_NOT_CONFIGURED response, never a fixture fallback. See
 * src/lib/server/homeNews/gnewsHomeNewsProvider.mjs for the fetch/normalize/dedupe/classify logic.
 */

import type { APIRoute } from 'astro';
import { getHomeNewsFeed } from '../../../lib/server/homeNews/gnewsHomeNewsProvider.mjs';

export const prerender = false;

const jsonResponse = (body: unknown, status: number, cacheControl: string) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cacheControl },
  });

const NO_STORE = 'no-store';
const SUCCESS_CACHE = 'public, s-maxage=300, stale-while-revalidate=900';

// Mirrors the dual-source env resolver in kisClient.ts: import.meta.env first (where `.env` values
// are exposed during astro dev/SSR), then process.env (Vercel-injected runtime env).
const readServerEnvValue = (name: string): string | undefined => {
  const fromImportMeta = (import.meta.env as Record<string, string | undefined>)[name];
  if (typeof fromImportMeta === 'string' && fromImportMeta.trim().length > 0) {
    return fromImportMeta;
  }
  return process.env[name];
};

export const GET: APIRoute = async () => {
  const apiKey = readServerEnvValue('GNEWS_API_KEY');
  const result = await getHomeNewsFeed({ apiKey });

  // Phase 3GL-HF2 §9 (codes extended in HF4): diagnostics is present only when the provider request
  // itself succeeded (it is absent for NEWS_NOT_CONFIGURED / NEWS_BAD_REQUEST / NEWS_UNAUTHORIZED /
  // NEWS_QUOTA_EXHAUSTED / NEWS_RATE_LIMITED / NEWS_PROVIDER_ERROR, where there is nothing meaningful
  // to count) -- sanitized integer counts only, never raw payloads.
  if (!result.ok) {
    const body = result.diagnostics
      ? { ok: false, code: result.code, diagnostics: result.diagnostics }
      : { ok: false, code: result.code };
    return jsonResponse(body, 200, NO_STORE);
  }

  return jsonResponse(
    { ok: true, generatedAt: result.generatedAt, articles: result.articles, diagnostics: result.diagnostics },
    200,
    SUCCESS_CACHE,
  );
};

export const ALL: APIRoute = () => jsonResponse({ ok: false, code: 'VALIDATION_FAILED' }, 405, NO_STORE);
