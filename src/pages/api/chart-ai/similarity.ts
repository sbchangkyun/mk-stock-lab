/**
 * Authenticated Chart Similarity API route shell (Phase 3EZ-C).
 *
 * This route is disabled by default: it always returns the sanitized feature-disabled response
 * built by `buildSimilarityApiRouteShellResult` (`src/lib/server/chartSimilarity/similarityApiRouteShell.ts`).
 * It does not implement real auth, usage storage, DB/cache access, KIS calls, or live similarity
 * execution — those remain scoped to future, separately authorized phases. Request bodies are
 * parsed defensively; malformed JSON never crashes the route and always falls back to the safe
 * default request shape.
 */

import type { APIRoute } from 'astro';
import { buildSimilarityApiRouteShellResult } from '../../../lib/server/chartSimilarity/similarityApiRouteShell';
import type { SimilarityApiRouteShellResult } from '../../../lib/server/chartSimilarity/similarityApiRouteShellTypes';

export const prerender = false;

const jsonResponse = (result: SimilarityApiRouteShellResult) =>
  new Response(JSON.stringify(result.response), {
    status: result.httpStatus,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

const readJsonBody = async (request: Request): Promise<unknown> => {
  try {
    const text = await request.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    return {};
  }
};

export const POST: APIRoute = async ({ request }) => {
  const body = await readJsonBody(request);
  return jsonResponse(buildSimilarityApiRouteShellResult(body));
};

export const ALL: APIRoute = () => jsonResponse(buildSimilarityApiRouteShellResult({}));
