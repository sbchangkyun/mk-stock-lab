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
 * An explicit owner-local auth/usage bridge request (body containing
 * `mode: "owner-local-auth-usage-bridge"`, `source: "mocked-provider-compatible"`,
 * `ownerLocalAuthUsageBridge: true`, `mockAuth`, and `mockUsage`) additionally routes to the
 * Phase 3FB-C-ALT auth/usage runtime bridge (`similarityAuthUsageRouteBridge.ts`), which evaluates
 * the existing `evaluateSimilarityExecutionGuard` against the caller-supplied mock auth/usage
 * state before allowing the same Phase 3FB-A mocked integration to run. This is also NOT real
 * auth and NOT real usage persistence — it never calls live KIS, never reads
 * `process.env`/`.env`, and never exposes a raw provider payload or account/trading field. The two
 * owner-local branches are mutually exclusive by their distinct `mode` values.
 *
 * An explicit guarded runtime scaffold request (body containing `mode: "guarded-runtime-scaffold"`,
 * `source: "mocked-provider-compatible"`, and `guardedRuntimeScaffold: true`) additionally routes
 * to the Phase 3FC-H guarded route scaffold (`similarityGuardedRouteScaffold.ts`) and the Phase
 * 3FD-E all-gates-off composition scaffold only to confirm safe blocked/disabled handling. This
 * branch never returns a new success response shape: it
 * always falls back to the existing sanitized feature-disabled shell response, regardless of what
 * the scaffold module computes. All runtime gates remain off — no real Supabase, no real database,
 * no live KIS, no mocked provider execution, no public/beta route success. This branch is mutually
 * exclusive with the two owner-local branches above by its distinct `mode` value.
 *
 * Phase 3FD-J adds one explicit owner-local Similar Pattern subpath inside that guarded branch.
 * It requires a local request URL, an explicit activation flag, the Similar Pattern request kind,
 * and a mocked-safe role. It executes only the deterministic synthetic fixture and returns only a
 * sanitized label/count response. Public route success, live KIS, LLM, real auth, persistence,
 * Supabase, database, environment, cookie, session, header-auth, and JWT behavior remain disabled.
 * Phase 3FE-A keeps the same owner-local subpath and adds an explicit fixture-only KIS OHLC
 * provider-shaped mode. Live KIS remains unavailable; no credentials, provider payload, or raw
 * OHLC rows are exposed.
 *
 * Request bodies are parsed defensively; malformed JSON never crashes the route and always falls
 * back to the safe default (feature-disabled) request shape.
 */

import type { APIRoute } from 'astro';
import { buildSimilarityApiRouteShellResult } from '../../../lib/server/chartSimilarity/similarityApiRouteShell';
import type { SimilarityApiRouteShellResult } from '../../../lib/server/chartSimilarity/similarityApiRouteShellTypes';
import {
  buildOwnerLocalAuthUsageBridgeSimilarityApiResponse,
  buildOwnerLocalMockedSimilarityApiResponse,
  isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody,
  isOwnerLocalMockedSimilarityApiRequestBody,
  mapAuthUsageBridgeApiStatusToHttpStatus,
} from '../../../lib/server/chartSimilarity/similarityApiResponseBuilder';
import type { SimilarityApiResponse } from '../../../lib/server/chartSimilarity/similarityApiResponseTypes';
import {
  isGuardedRuntimeScaffoldSimilarityRequestBody,
  runSimilarityGuardedRouteScaffold,
} from '../../../lib/server/chartSimilarity/similarityGuardedRouteScaffold';
import { runSimilarityGuardedRouteRuntimeComposition } from '../../../lib/server/chartSimilarity/similarityGuardedRouteRuntimeComposition';
import {
  runOwnerLocalSimilarPatternActivation,
} from '../../../lib/server/chartAiOwnerLocalSimilarPatternActivation';
import type {
  ChartAiOwnerLocalSimilarPatternResponse,
} from '../../../lib/server/chartAiOwnerLocalSimilarPatternActivationTypes';

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

const jsonOwnerLocalSimilarityResponse = (
  response: ChartAiOwnerLocalSimilarPatternResponse,
  httpStatus: number,
) => new Response(JSON.stringify(response), {
  status: httpStatus,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
});

const isOwnerLocalSimilarityActivationAttempt = (body: unknown): boolean => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  const record = body as Record<string, unknown>;
  return (
    'ownerLocalSimilarPatternRouteActivation' in record ||
    'ownerLocalOhlcProviderMode' in record ||
    'ownerLocalKisOhlcFixture' in record ||
    'requestKind' in record ||
    'subjectRole' in record
  );
};

const ownerLocalSimilarityHttpStatus = (response: ChartAiOwnerLocalSimilarPatternResponse): number => {
  if (response.ok) return 200;
  if (response.status === 'blocked_invalid_request') return 400;
  if (response.status === 'blocked_cooldown' || response.status === 'blocked_usage_limited') return 429;
  return 403;
};

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

  if (isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody(body)) {
    try {
      const response = buildOwnerLocalAuthUsageBridgeSimilarityApiResponse(body);
      return jsonApiResponse(response, mapAuthUsageBridgeApiStatusToHttpStatus(response.status));
    } catch {
      return jsonResponse(buildSimilarityApiRouteShellResult({}));
    }
  }

  if (isGuardedRuntimeScaffoldSimilarityRequestBody(body)) {
    if (isOwnerLocalSimilarityActivationAttempt(body)) {
      try {
        const response = runOwnerLocalSimilarPatternActivation(body, {
          hostname: new URL(request.url).hostname,
        });
        return jsonOwnerLocalSimilarityResponse(response, ownerLocalSimilarityHttpStatus(response));
      } catch {
        return jsonOwnerLocalSimilarityResponse({
          ok: false,
          status: 'fail_closed',
          mode: 'owner-local-similar-pattern-route',
          data: null,
          error: {
            code: 'unexpected_error',
            message: 'The owner-local Similar Pattern request failed closed.',
          },
        }, 500);
      }
    }
    try {
      // Confirm safe blocked/disabled handling only; the scaffold result is never exposed to the
      // client and never used to unlock a success response.
      runSimilarityGuardedRouteScaffold(body);
      return jsonResponse(buildSimilarityApiRouteShellResult({}));
    } catch {
      return jsonResponse(buildSimilarityApiRouteShellResult({}));
    } finally {
      await runSimilarityGuardedRouteRuntimeComposition({
        mode: 'guarded-runtime-scaffold',
        source: 'mocked-runtime',
        currentIso: '2026-07-04T12:00:00.000+09:00',
        safeRequestRef: 'route-guarded-request-ref',
      });
    }
  }

  return jsonResponse(buildSimilarityApiRouteShellResult(body));
};

export const ALL: APIRoute = () => jsonResponse(buildSimilarityApiRouteShellResult({}));
