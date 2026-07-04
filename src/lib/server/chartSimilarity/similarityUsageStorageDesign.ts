/**
 * Server-only usage storage design module for Chart Similarity execution (Phase 3EZ-B).
 *
 * This module is design/foundation only. It defines a storage-agnostic default usage policy, UTC
 * window/key helpers, a role-based limit helper, and a charge decision helper. It never imports a
 * DB/cache provider (Supabase, Redis, Turso, Prisma, Drizzle, or any other), never reads cookies,
 * headers, `localStorage`/`sessionStorage`, `process.env`, or `.env`, never performs a network
 * call, and never persists anything. It never throws for the expected design inputs handled here,
 * and it never increments or writes real usage state.
 */

import type {
  SimilarityUsageChargeDecision,
  SimilarityUsageChargeOutcome,
  SimilarityUsageExecutionOutcome,
  SimilarityUsageStorageDesignResult,
  SimilarityUsageStorageKey,
  SimilarityUsageStoragePolicy,
  SimilarityUsageStorageStatus,
  SimilarityUsageWindowKind,
} from './similarityUsageStorageDesignTypes';
import type { SimilarityExecutionRole } from './similarityExecutionGuardTypes';

/** Builds the default, storage-agnostic usage policy. No storage backend is chosen or activated. */
export const buildDefaultSimilarityUsageStoragePolicy = (): SimilarityUsageStoragePolicy => ({
  backendKind: 'none',
  enabled: false,
  requireOwnerApprovalBeforeStorage: true,
  requireSqlApprovalBeforeDatabase: true,
  requireCacheApprovalBeforeRuntime: true,
  subjectKeyStrategy: 'not_configured',
  chargeTiming: 'after_success',
  defaultDailyLimit: 3,
  betaDailyLimit: 10,
  ownerDailyLimit: 50,
  adminDailyLimit: 100,
  monthlyLimitMultiplier: 20,
  allowAnonymousMockedPreview: true,
  allowPublicKisExecution: false,
  notes: [
    'No storage backend is chosen or activated in this phase.',
    'Owner approval is required before any real storage runtime is implemented.',
    'SQL/migration approval is required before a database-backed store is implemented.',
    'Cache approval is required before a runtime cache is implemented.',
    'This policy module never reads process.env or .env values.',
  ],
});

/**
 * Builds a deterministic UTC window start timestamp from a caller-supplied ISO timestamp. Uses
 * only string slicing on the supplied ISO string — never `Date.now()` and never the current
 * runtime date.
 */
export const buildUsageWindowStartIso = (
  requestedAtIso: string,
  window: SimilarityUsageWindowKind,
): string => {
  const datePart = requestedAtIso.slice(0, 10);
  if (window === 'monthly') {
    return `${datePart.slice(0, 7)}-01T00:00:00.000Z`;
  }
  return `${datePart}T00:00:00.000Z`;
};

export type SimilarityUsageStorageKeyInput = {
  subjectKey: string | null | undefined;
  source: 'mocked' | 'kis-normalized' | 'owner-local';
  window: SimilarityUsageWindowKind;
  requestedAtIso: string;
};

/**
 * Builds a `SimilarityUsageStorageKey` from a caller-supplied subject key. Returns null when no
 * subject key is supplied — a future auth/usage boundary is responsible for deriving a real
 * subject key. This function never hashes or persists any value.
 */
export const buildSimilarityUsageStorageKey = (
  input: SimilarityUsageStorageKeyInput,
): SimilarityUsageStorageKey | null => {
  if (!input.subjectKey) {
    return null;
  }
  return {
    purpose: 'chart-similarity',
    subjectKey: input.subjectKey,
    source: input.source,
    window: input.window,
    windowStartIso: buildUsageWindowStartIso(input.requestedAtIso, input.window),
  };
};

/**
 * Looks up a role's configured usage limit from the supplied policy. Pure lookup, no I/O. Monthly
 * limits are derived as `dailyLimit * monthlyLimitMultiplier`.
 */
export const getUsageLimitForGuardRole = (
  role: SimilarityExecutionRole,
  window: SimilarityUsageWindowKind = 'daily',
  policy: SimilarityUsageStoragePolicy = buildDefaultSimilarityUsageStoragePolicy(),
): number => {
  const dailyLimit =
    role === 'admin'
      ? policy.adminDailyLimit
      : role === 'owner'
        ? policy.ownerDailyLimit
        : role === 'beta'
          ? policy.betaDailyLimit
          : policy.defaultDailyLimit;
  return window === 'monthly' ? dailyLimit * policy.monthlyLimitMultiplier : dailyLimit;
};

const BASE_CHARGE_OUTCOME_BY_EXECUTION_OUTCOME: Record<
  SimilarityUsageExecutionOutcome,
  SimilarityUsageChargeOutcome
> = {
  success: 'charge',
  guard_blocked: 'do_not_charge',
  auth_required: 'do_not_charge',
  usage_limited: 'do_not_charge',
  feature_disabled: 'do_not_charge',
  provider_disabled: 'do_not_charge',
  provider_error: 'do_not_charge',
  validation_error: 'do_not_charge',
  internal_error: 'do_not_charge',
};

/**
 * Decides whether a given execution outcome should charge usage. Pure lookup with a policy-gated
 * override: when `policy.enabled` is false, every outcome returns a design-only decision with no
 * read/write/increment — this phase never increments or persists real usage.
 */
export const decideSimilarityUsageCharge = (
  executionOutcome: SimilarityUsageExecutionOutcome,
  policy: SimilarityUsageStoragePolicy = buildDefaultSimilarityUsageStoragePolicy(),
): SimilarityUsageChargeDecision => {
  const outcome = BASE_CHARGE_OUTCOME_BY_EXECUTION_OUTCOME[executionOutcome] ?? 'do_not_charge';
  const isChargeableSuccess = outcome === 'charge';

  if (!policy.enabled) {
    const status: SimilarityUsageStorageStatus = 'design_only';
    return {
      status,
      outcome,
      executionOutcome,
      shouldReadUsage: false,
      shouldWriteUsage: false,
      shouldIncrementUsage: false,
      safeMessage: 'Usage storage is not enabled; this decision is for design purposes only.',
      warnings: ['Usage storage backend is not configured; no real read, write, or increment will occur.'],
    };
  }

  return {
    status: 'ready_for_route_design',
    outcome,
    executionOutcome,
    shouldReadUsage: isChargeableSuccess,
    shouldWriteUsage: isChargeableSuccess,
    shouldIncrementUsage: isChargeableSuccess,
    safeMessage: isChargeableSuccess
      ? 'Successful execution should charge usage once real storage is implemented and approved.'
      : 'This execution outcome should not charge usage.',
    warnings: [],
  };
};

/**
 * Combines a policy, an optional key, and a charge decision into a full design result. Makes
 * clear that storage is not configured and owner/SQL/cache approval is required before real
 * storage is implemented.
 */
export const buildSimilarityUsageStorageDesignResult = (
  policy: SimilarityUsageStoragePolicy,
  key: SimilarityUsageStorageKey | null,
  chargeDecision: SimilarityUsageChargeDecision,
): SimilarityUsageStorageDesignResult => {
  const status: SimilarityUsageStorageStatus = policy.enabled ? chargeDecision.status : 'approval_required';
  return {
    status,
    policy,
    key,
    chargeDecision,
    safeMessage:
      'Usage storage is not configured; owner approval and, if a database is chosen, SQL/migration approval, are required before any real storage is implemented.',
    warnings: policy.enabled
      ? []
      : ['No usage storage backend is configured; this result is for design purposes only.'],
  };
};
