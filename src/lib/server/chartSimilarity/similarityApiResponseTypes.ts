/**
 * Server-only mocked API response type foundation for Chart Similarity execution (Phase 3EY-D).
 *
 * These types describe a sanitized, API-shaped response that a future, separately authorized
 * route could return after evaluating a `SimilarityExecutionGuardResult` (Phase 3EY-C). They are
 * decoupled from real auth/session data: no user id, no role, no auth state, no session token,
 * no access token, no provider token, no raw auth provider payload, no IP address, no
 * account/trading fields, no KIS credentials, no raw KIS payload. This file defines shapes
 * only — it performs no I/O and touches no database.
 *
 * This module must never be imported from client-accessible page or API code in this phase.
 */

export type SimilarityApiResponseStatus =
  | 'success'
  | 'blocked'
  | 'auth_required'
  | 'usage_limited'
  | 'feature_disabled'
  | 'not_configured'
  | 'provider_disabled'
  | 'provider_not_implemented'
  | 'error';

export type SimilarityApiResponseSource = 'mocked' | 'kis-normalized' | 'owner-local' | 'mocked-provider-compatible';

export type SimilarityApiResponseMode =
  | 'mocked-plan'
  | 'feature-flag-off'
  | 'guard-blocked'
  | 'guard-allowed'
  | 'provider-deferred'
  | 'owner-local-mocked';

export type SimilarityApiSafeRequest = {
  purpose: 'chart-similarity';
  source: SimilarityApiResponseSource;
  symbol: string;
  market: 'KR';
  assetType: 'stock' | 'etf';
};

export type SimilarityApiSafeUsage = {
  window: 'daily' | 'monthly';
  used: number;
  limit: number;
  remaining: number;
  resetAtIso?: string;
};

export type SimilarityApiSafeError = {
  code: string;
  message: string;
  retryable: boolean;
};

export type SimilarityApiMockedMatch = {
  rank: number;
  periodStart: string;
  periodEnd: string;
  similarityScore: number;
  forwardReturn5d: number | null;
  forwardReturn20d: number | null;
  maxDrawdown: number | null;
};

export type SimilarityApiMockedSuccessData = {
  summary: {
    baseWindow: number;
    lookbackYears: number;
    matchCount: number;
    disclaimer: string;
  };
  matches: SimilarityApiMockedMatch[];
  narrative: {
    title: string;
    body: string;
    limitations: string[];
  };
};

/**
 * Sanitized, bucketed success data for the owner-local mocked provider-compatible integration
 * path (Phase 3FB-B). Carries only safe, non-numeric-value buckets from
 * `SimilarityProviderIntegrationResult` — never a raw provider payload, never real KIS OHLC
 * values, never actual match scores/returns.
 */
export type SimilarityApiOwnerLocalMockedDataPolicy = {
  ownerLocalOnly: boolean;
  allowLiveKis: boolean;
  allowRouteSuccess: boolean;
  allowPublicExecution: boolean;
  allowBetaExecution: boolean;
};

export type SimilarityApiOwnerLocalMockedSuccessData = {
  engineStatus: string;
  normalizedBarsAvailable: boolean;
  normalizedBarCountBucket: string;
  matchCountBucket: string;
  disclaimer: string;
  dataPolicy: SimilarityApiOwnerLocalMockedDataPolicy;
};

export type SimilarityApiResponse = {
  ok: boolean;
  status: SimilarityApiResponseStatus;
  mode: SimilarityApiResponseMode;
  request: SimilarityApiSafeRequest;
  usage: SimilarityApiSafeUsage | null;
  data: SimilarityApiMockedSuccessData | SimilarityApiOwnerLocalMockedSuccessData | null;
  error: SimilarityApiSafeError | null;
  warnings: string[];
};
