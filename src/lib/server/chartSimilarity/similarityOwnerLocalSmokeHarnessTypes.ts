/**
 * Server-only owner-local KIS similarity smoke harness type foundation for Chart Similarity
 * execution (Phase 3FA-C).
 *
 * These types describe a disabled-by-default scaffold for a future owner-local manual smoke of
 * the KIS-normalized similarity execution path. They define a harness boundary, safe run states,
 * ordered preflight steps, a redacted check list, and a safe blocked/not-run report shape —
 * nothing here executes KIS, calls the deterministic similarity engine, or changes the existing
 * API route. No user id, no role, no auth state, no session/access/provider token, no email, no IP
 * address, no request header, no cookie, no raw auth provider payload, no KIS credential, no raw
 * KIS response field, no actual OHLC price or volume, no market timestamp, no similarity score or
 * derived return computed from real data, no account/trading/order/balance field, no DB/cache
 * connection string, and no SQL string is present in any of these types. This file defines shapes
 * only — it performs no I/O and touches no database.
 *
 * This module must never be imported from client-accessible page code in this phase.
 */

export type SimilarityOwnerLocalSmokeHarnessStatus =
  | 'disabled'
  | 'not_run'
  | 'blocked'
  | 'design_only'
  | 'manual_approval_required'
  | 'ready_but_disabled';

export type SimilarityOwnerLocalSmokeHarnessMode = 'disabled_harness' | 'plan_only';

export type SimilarityOwnerLocalSmokeHarnessStep =
  | 'load_smoke_plan'
  | 'check_harness_policy'
  | 'verify_route_remains_disabled'
  | 'verify_redaction_policy'
  | 'verify_no_live_provider'
  | 'verify_no_live_engine'
  | 'build_safe_blocked_report';

export type SimilarityOwnerLocalSmokeHarnessCheck = {
  name: string;
  status: 'pass' | 'fail' | 'not_run' | 'blocked';
  safeMessage: string;
};

export type SimilarityOwnerLocalSmokeHarnessPolicy = {
  enabled: false;
  mode: SimilarityOwnerLocalSmokeHarnessMode;
  ownerLocalOnly: true;
  manualExecutionOnly: true;
  allowKisProviderCall: false;
  allowSimilarityEngineRun: false;
  allowRouteSuccess: false;
  allowMarketDataInReport: false;
  allowRawProviderPayload: false;
  allowEnvRead: false;
  allowCredentialEcho: false;
  requireOwnerApprovalBeforeLiveSmoke: true;
  requireSeparateHarnessEnableApproval: true;
  notes: string[];
};

export type SimilarityOwnerLocalSmokeHarnessReport = {
  status: 'blocked' | 'not_run';
  smokeId: string;
  mode: SimilarityOwnerLocalSmokeHarnessMode;
  executedBy: 'disabled-harness';
  source: 'owner-local';
  providerProbe: 'not_run' | 'blocked';
  normalizationCheck: 'not_run' | 'blocked';
  engineContractCheck: 'not_run' | 'blocked';
  responseRedactionCheck: 'pass' | 'blocked';
  safeSummary: string;
  warnings: string[];
};

export type SimilarityOwnerLocalSmokeHarnessResult = {
  status: SimilarityOwnerLocalSmokeHarnessStatus;
  policy: SimilarityOwnerLocalSmokeHarnessPolicy;
  steps: SimilarityOwnerLocalSmokeHarnessStep[];
  checks: SimilarityOwnerLocalSmokeHarnessCheck[];
  report: SimilarityOwnerLocalSmokeHarnessReport;
  safeMessage: string;
  warnings: string[];
};
