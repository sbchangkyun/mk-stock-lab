/**
 * Server-only owner-local manual smoke execution closeout type foundation for Chart Similarity
 * execution (Phase 3FA-D).
 *
 * These types describe a closeout layer sitting on top of the Phase 3FA-C disabled smoke harness.
 * They define closeout statuses, closeout decisions, a redacted closeout check list, and a safe
 * closeout report shape — nothing here executes KIS, calls the deterministic similarity engine,
 * or changes the existing API route. No user id, no role, no auth state, no session/access/
 * provider token, no email, no IP address, no request header, no cookie, no raw auth provider
 * payload, no KIS credential, no raw KIS response field, no actual OHLC price or volume, no
 * market timestamp, no similarity score or derived return computed from real data, no account/
 * trading/order/balance field, no DB/cache connection string, and no SQL string is present in any
 * of these types. This file defines shapes only — it performs no I/O and touches no database.
 *
 * This module must never be imported from client-accessible page code in this phase.
 */

export type SimilarityOwnerLocalSmokeCloseoutStatus =
  | 'not_executed'
  | 'blocked'
  | 'ready_for_separate_manual_approval'
  | 'closed_without_execution'
  | 'design_only';

export type SimilarityOwnerLocalSmokeCloseoutDecision =
  | 'keep_disabled'
  | 'request_owner_approval_for_manual_smoke'
  | 'defer_to_later_phase'
  | 'blocked_by_policy';

export type SimilarityOwnerLocalSmokeCloseoutCheckStatus = 'pass' | 'blocked' | 'not_run' | 'not_applicable';

export type SimilarityOwnerLocalSmokeCloseoutCheck = {
  name: string;
  status: SimilarityOwnerLocalSmokeCloseoutCheckStatus;
  safeMessage: string;
};

export type SimilarityOwnerLocalSmokeCloseoutPolicy = {
  enabled: false;
  liveSmokeExecuted: false;
  allowLiveKisCall: false;
  allowLiveSimilarityExecution: false;
  allowRouteSuccess: false;
  allowRouteCall: false;
  allowEnvRead: false;
  allowMarketDataInReport: false;
  allowRawProviderPayload: false;
  allowCredentialEcho: false;
  requireOwnerApprovalForNextPhase: true;
  requireManualSmokeSeparateCommand: true;
  notes: string[];
};

export type SimilarityOwnerLocalSmokeCloseoutReport = {
  status: SimilarityOwnerLocalSmokeCloseoutStatus;
  decision: SimilarityOwnerLocalSmokeCloseoutDecision;
  smokeExecuted: false;
  harnessStatus: 'disabled';
  routeStatus: 'feature_disabled';
  source: 'owner-local';
  safeSummary: string;
  checks: SimilarityOwnerLocalSmokeCloseoutCheck[];
  warnings: string[];
  nextAllowedPhase: '3FA-D-MANUAL-RUN' | '3FB-A' | 'blocked';
};

export type SimilarityOwnerLocalSmokeCloseoutResult = {
  status: SimilarityOwnerLocalSmokeCloseoutStatus;
  policy: SimilarityOwnerLocalSmokeCloseoutPolicy;
  report: SimilarityOwnerLocalSmokeCloseoutReport;
  safeMessage: string;
  warnings: string[];
};
