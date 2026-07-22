/**
 * Server-only owner-local KIS-normalized execution plan type foundation for Chart Similarity
 * execution (Phase 3FA-A).
 *
 * These types describe a design-only plan for a future owner-local KIS-normalized Chart
 * Similarity execution path. They define safe planning states, ordered execution stages,
 * activation gates, provider data expectations, and policy — nothing here executes KIS, calls the
 * deterministic similarity engine, or changes the existing API route. No user id, no role, no auth
 * state, no session/access/provider token, no email, no IP address, no request header, no cookie,
 * no raw auth provider payload, no KIS credential, no raw KIS response field, no actual OHLC price
 * or volume, no account/trading/order/balance field, no DB/cache connection string, and no SQL
 * string is present in any of these types. This file defines shapes only — it performs no I/O and
 * touches no database.
 *
 * This module must never be imported from client-accessible page code in this phase.
 */

export type SimilarityOwnerLocalExecutionPlanStatus =
  | 'design_only'
  | 'not_configured'
  | 'owner_local_required'
  | 'auth_required'
  | 'usage_storage_required'
  | 'provider_disabled'
  | 'provider_not_implemented'
  | 'engine_ready'
  | 'route_blocked'
  | 'blocked';

export type SimilarityOwnerLocalExecutionStage =
  | 'route_shell'
  | 'auth_mapping'
  | 'usage_check'
  | 'kis_normalized_ohlc_fetch'
  | 'normalized_ohlc_validation'
  | 'similarity_engine_scan'
  | 'safe_response_packaging';

export type SimilarityOwnerLocalExecutionSource = 'owner-local';

export type SimilarityOwnerLocalExecutionGate = {
  name: string;
  required: boolean;
  satisfied: boolean;
  safeMessage: string;
};

export type SimilarityOwnerLocalProviderExpectation = {
  source: 'owner-local';
  market: 'KR';
  assetType: 'stock' | 'etf';
  timeframe: 'daily';
  normalizedOnly: true;
  rawProviderPayloadAllowed: false;
  accountOrTradingAllowed: false;
  publicExecutionAllowed: false;
};

export type SimilarityOwnerLocalExecutionPlanPolicy = {
  enabled: false;
  ownerLocalOnly: true;
  publicExecutionAllowed: false;
  betaExecutionAllowed: false;
  routeSuccessAllowed: false;
  liveKisCallAllowed: false;
  rawProviderPayloadAllowed: false;
  requireAuth: true;
  requireUsageStorage: true;
  requireOwnerApprovalBeforeExecution: true;
  requireProviderSmokeBeforeExecution: true;
  requireRouteShellFeatureFlagApproval: true;
  notes: string[];
};

export type SimilarityOwnerLocalExecutionPlanResult = {
  status: SimilarityOwnerLocalExecutionPlanStatus;
  source: 'owner-local';
  stages: SimilarityOwnerLocalExecutionStage[];
  gates: SimilarityOwnerLocalExecutionGate[];
  providerExpectation: SimilarityOwnerLocalProviderExpectation;
  policy: SimilarityOwnerLocalExecutionPlanPolicy;
  safeMessage: string;
  warnings: string[];
};
