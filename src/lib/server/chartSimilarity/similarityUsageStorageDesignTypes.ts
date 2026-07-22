/**
 * Server-only usage storage design type foundation for Chart Similarity execution (Phase 3EZ-B).
 *
 * These types describe a future, storage-agnostic and backend-agnostic usage tracking model for
 * Chart Similarity execution. This file is design/foundation only: it defines shapes and safe
 * mocked builders, but it implements no real storage, imports no DB/cache client, reads no
 * cookies/headers/session/localStorage/sessionStorage/process.env/.env, and performs no I/O. No
 * email, no raw user id as public output, no session/access/provider token, no IP address, no
 * request headers, no cookies, no raw auth provider payload, no KIS credentials, no
 * account/trading fields, no DB connection string, and no SQL string are represented anywhere in
 * these types.
 *
 * This module must never be imported from client-accessible page or API code in this phase.
 */

export type SimilarityUsageStorageBackendKind = 'none' | 'database' | 'cache' | 'hybrid';

export type SimilarityUsageStorageStatus =
  | 'design_only'
  | 'not_configured'
  | 'storage_required'
  | 'approval_required'
  | 'ready_for_route_design'
  | 'blocked';

export type SimilarityUsageWindowKind = 'daily' | 'monthly';

export type SimilarityUsageChargeTiming = 'after_success' | 'before_execution' | 'reservation_then_commit';

export type SimilarityUsageChargeOutcome = 'charge' | 'do_not_charge' | 'refund_reservation' | 'manual_review';

export type SimilarityUsageExecutionOutcome =
  | 'success'
  | 'guard_blocked'
  | 'auth_required'
  | 'usage_limited'
  | 'feature_disabled'
  | 'provider_disabled'
  | 'provider_error'
  | 'validation_error'
  | 'internal_error';

export type SimilarityUsageStorageKey = {
  purpose: 'chart-similarity';
  subjectKey: string;
  source: 'mocked' | 'kis-normalized' | 'owner-local';
  window: SimilarityUsageWindowKind;
  windowStartIso: string;
};

export type SimilarityUsageStoragePolicy = {
  backendKind: SimilarityUsageStorageBackendKind;
  enabled: boolean;
  requireOwnerApprovalBeforeStorage: true;
  requireSqlApprovalBeforeDatabase: true;
  requireCacheApprovalBeforeRuntime: true;
  subjectKeyStrategy: 'stable_subject_id_hash' | 'internal_subject_id' | 'not_configured';
  chargeTiming: SimilarityUsageChargeTiming;
  defaultDailyLimit: number;
  betaDailyLimit: number;
  ownerDailyLimit: number;
  adminDailyLimit: number;
  monthlyLimitMultiplier: number;
  allowAnonymousMockedPreview: boolean;
  allowPublicKisExecution: false;
  notes: string[];
};

export type SimilarityUsageChargeDecision = {
  status: SimilarityUsageStorageStatus;
  outcome: SimilarityUsageChargeOutcome;
  executionOutcome: SimilarityUsageExecutionOutcome;
  shouldReadUsage: boolean;
  shouldWriteUsage: boolean;
  shouldIncrementUsage: boolean;
  safeMessage: string;
  warnings: string[];
};

export type SimilarityUsageStorageDesignResult = {
  status: SimilarityUsageStorageStatus;
  policy: SimilarityUsageStoragePolicy;
  key: SimilarityUsageStorageKey | null;
  chargeDecision: SimilarityUsageChargeDecision;
  safeMessage: string;
  warnings: string[];
};
