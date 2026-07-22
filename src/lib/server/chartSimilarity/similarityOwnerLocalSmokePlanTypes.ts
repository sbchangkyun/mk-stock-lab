/**
 * Server-only owner-local KIS similarity smoke plan type foundation for Chart Similarity
 * execution (Phase 3FA-B).
 *
 * These types describe a design-only plan for a future owner-local manual smoke of the
 * KIS-normalized similarity execution path defined in Phase 3FA-A. They define safe planning
 * states, ordered manual smoke stages, preflight/activation gates, a strict redaction policy, and
 * a safe report template — nothing here executes KIS, calls the deterministic similarity engine,
 * or changes the existing API route. No user id, no role, no auth state, no session/access/
 * provider token, no email, no IP address, no request header, no cookie, no raw auth provider
 * payload, no KIS credential, no raw KIS response field, no actual OHLC price or volume, no
 * market timestamp, no similarity score or derived return computed from real data, no account/
 * trading/order/balance field, no DB/cache connection string, and no SQL string is present in any
 * of these types. This file defines shapes only — it performs no I/O and touches no database.
 *
 * This module must never be imported from client-accessible page code in this phase.
 */

export type SimilarityOwnerLocalSmokePlanStatus =
  | 'design_only'
  | 'not_configured'
  | 'owner_local_required'
  | 'manual_approval_required'
  | 'provider_smoke_required'
  | 'execution_disabled'
  | 'ready_for_manual_smoke'
  | 'blocked';

export type SimilarityOwnerLocalSmokeStage =
  | 'preflight_boundary_check'
  | 'owner_local_environment_confirmation'
  | 'route_shell_disabled_confirmation'
  | 'auth_usage_precondition_review'
  | 'kis_normalized_ohlc_provider_probe'
  | 'normalized_bar_shape_validation'
  | 'similarity_engine_contract_dry_run'
  | 'safe_response_redaction_check'
  | 'manual_review_closeout';

export type SimilarityOwnerLocalSmokeGate = {
  name: string;
  required: boolean;
  satisfied: boolean;
  safeMessage: string;
};

export type SimilarityOwnerLocalSmokeRedactionPolicy = {
  allowRawKisPayload: false;
  allowOhlcValuesInReport: false;
  allowVolumeValuesInReport: false;
  allowTimestampsInReport: false;
  allowSimilarityScoresInReport: false;
  allowDerivedReturnsInReport: false;
  allowCredentialEcho: false;
  allowTokenEcho: false;
  allowEnvEcho: false;
  allowedReportFields: string[];
};

export type SimilarityOwnerLocalSmokeCheckOutcome = 'not_run' | 'pass' | 'fail' | 'blocked';

export type SimilarityOwnerLocalSmokeReportTemplate = {
  status: SimilarityOwnerLocalSmokeCheckOutcome;
  smokeId: string;
  executedBy: 'owner-local-manual';
  source: 'owner-local';
  providerProbe: SimilarityOwnerLocalSmokeCheckOutcome;
  normalizationCheck: SimilarityOwnerLocalSmokeCheckOutcome;
  engineContractCheck: SimilarityOwnerLocalSmokeCheckOutcome;
  responseRedactionCheck: SimilarityOwnerLocalSmokeCheckOutcome;
  safeSummary: string;
  warnings: string[];
};

export type SimilarityOwnerLocalSmokePlanPolicy = {
  enabled: false;
  ownerLocalOnly: true;
  manualExecutionOnly: true;
  publicExecutionAllowed: false;
  betaExecutionAllowed: false;
  routeSuccessAllowed: false;
  liveKisCallAllowedInThisPhase: false;
  liveSimilarityExecutionAllowedInThisPhase: false;
  rawProviderPayloadAllowed: false;
  actualMarketValuesInReportsAllowed: false;
  requiresOwnerApprovalBeforeSmoke: true;
  requiresProviderEnvPreparedButUnreadByPlan: true;
  requiresRouteShellToRemainDisabled: true;
  requiresNoStoreResponsePolicy: true;
  notes: string[];
};

export type SimilarityOwnerLocalSmokePlanResult = {
  status: SimilarityOwnerLocalSmokePlanStatus;
  policy: SimilarityOwnerLocalSmokePlanPolicy;
  stages: SimilarityOwnerLocalSmokeStage[];
  gates: SimilarityOwnerLocalSmokeGate[];
  redactionPolicy: SimilarityOwnerLocalSmokeRedactionPolicy;
  reportTemplate: SimilarityOwnerLocalSmokeReportTemplate;
  safeMessage: string;
  warnings: string[];
};
