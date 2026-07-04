/**
 * Server-only API route shell type foundation for Chart Similarity execution (Phase 3EZ-C).
 *
 * These types describe a minimal, disabled-by-default authenticated API route shell that sits in
 * front of the existing guard (Phase 3EY-C), sanitized response (Phase 3EY-D), auth integration
 * design (Phase 3EZ-A), and usage storage design (Phase 3EZ-B) contracts. They are decoupled from
 * real auth/session data: no user id, no role, no auth state, no session/access/provider token,
 * no email, no IP address, no request headers, no cookies, no raw auth provider payload, no KIS
 * credentials, no account/trading fields, no DB/cache connection string, no SQL string. This file
 * defines shapes only — it performs no I/O and touches no database.
 *
 * This module must never be imported from client-accessible page code in this phase.
 */

import type { SimilarityApiResponse } from './similarityApiResponseTypes';

export type SimilarityApiRouteShellStatus =
  | 'feature_flag_off'
  | 'bad_request'
  | 'method_not_allowed'
  | 'design_only'
  | 'blocked';

export type SimilarityApiRouteShellPolicy = {
  enabled: boolean;
  featureFlagName: 'CHART_AI_SIMILARITY_ROUTE_ENABLED';
  requireAuth: boolean;
  requireUsageStorage: boolean;
  allowMockedSuccess: boolean;
  allowLiveKisExecution: false;
  allowPublicExecution: false;
  notes: string[];
};

export type SimilarityApiRouteShellRequest = {
  symbol: string;
  source: 'mocked' | 'kis-normalized' | 'owner-local';
  market: 'KR';
  assetType: 'stock' | 'etf';
};

export type SimilarityApiRouteShellResult = {
  httpStatus: number;
  response: SimilarityApiResponse;
};
