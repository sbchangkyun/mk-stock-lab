/**
 * Authenticated Chart Similarity API route shell (Phase 3EZ-C), extended with an owner-local
 * mocked execution path (Phase 3FB-B).
 *
 * Default behavior is unchanged: this route is disabled by default and returns the sanitized
 * feature-disabled response built by `buildSimilarityApiRouteShellResult`
 * (`src/lib/server/chartSimilarity/similarityApiRouteShell.ts`). It does not implement real auth,
 * usage storage, DB/cache access, live KIS calls, or public similarity execution — those remain
 * scoped to future, separately authorized phases.
 *
 * An explicit owner-local mocked request (body containing `mode: "owner-local-mocked"`,
 * `source: "mocked-provider-compatible"`, and `ownerLocalMocked: true`) additionally routes to
 * the Phase 3FB-A provider-compatible mocked similarity integration
 * (`similarityProviderIntegration.ts`) and returns a sanitized, bucketed result. This is NOT real
 * auth and NOT production authorization — it is only an owner-local mocked route path for
 * development verification. It never calls live KIS, never reads `process.env`/`.env`, and never
 * exposes a raw provider payload or real market data.
 *
 * Request bodies are parsed defensively; malformed JSON never crashes the route and always falls
 * back to the safe default (feature-disabled) request shape.
 */

import type { APIRoute } from 'astro';
import { buildSimilarityApiRouteShellResult } from '../../../lib/server/chartSimilarity/similarityApiRouteShell';
import type { SimilarityApiRouteShellResult } from '../../../lib/server/chartSimilarity/similarityApiRouteShellTypes';
import {
  buildOwnerLocalMockedSimilarityApiResponse,
  isOwnerLocalMockedSimilarityApiRequestBody,
} from '../../../lib/server/chartSimilarity/similarityApiResponseBuilder';
import type { SimilarityApiResponse } from '../../../lib/server/chartSimilarity/similarityApiResponseTypes';

export const prerender = false;

const jsonResponse = (result: SimilarityApiRouteShellResult) =>
  new Response(JSON.stringify(result.response), {
    status: result.httpStatus,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

const jsonApiResponse = (response: SimilarityApiResponse, httpStatus: number) =>
  new Response(JSON.stringify(response), {
    status: httpStatus,
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

  if (isOwnerLocalMockedSimilarityApiRequestBody(body)) {
    try {
      const response = buildOwnerLocalMockedSimilarityApiResponse(body);
      return jsonApiResponse(response, response.ok ? 200 : 422);
    } catch {
      return jsonResponse(buildSimilarityApiRouteShellResult({}));
    }
  }

  return jsonResponse(buildSimilarityApiRouteShellResult(body));
};

export const ALL: APIRoute = () => jsonResponse(buildSimilarityApiRouteShellResult({}));
