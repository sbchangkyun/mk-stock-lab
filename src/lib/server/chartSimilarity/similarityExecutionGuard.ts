/**
 * Server-only auth/usage guard evaluator foundation for Chart Similarity execution
 * (Phase 3EY-C).
 *
 * `evaluateSimilarityExecutionGuard` is a policy-first, disabled-by-default evaluator. It never
 * calls an auth provider, never reads a database or cache, never reads `process.env` or `.env`,
 * and never persists or increments usage — it only evaluates a caller-supplied usage snapshot.
 * A future, separately authorized phase will be responsible for reading/writing real usage and
 * wiring this evaluator behind an authenticated API route.
 */

import type {
  SimilarityExecutionGuardPolicy,
  SimilarityExecutionGuardRequest,
  SimilarityExecutionGuardResult,
  SimilarityExecutionGuardStatus,
  SimilarityExecutionRole,
  SimilarityExecutionUsageSnapshot,
  SimilarityExecutionUsageWindow,
} from './similarityExecutionGuardTypes';
import { buildDefaultSimilarityExecutionGuardPolicy } from './similarityExecutionGuardPolicy';

/** Deterministic fallback timestamp used only when a caller does not supply one. */
const DETERMINISTIC_FALLBACK_REQUESTED_AT_ISO = '2020-01-01T00:00:00.000Z';

const isUnauthenticatedState = (request: SimilarityExecutionGuardRequest): boolean =>
  request.role === 'anonymous' || request.authState === 'missing' || request.authState === 'anonymous';

/**
 * Normalizes a candidate guard request into a safe shape. Trims the symbol and fills a
 * deterministic fallback timestamp when the caller does not supply `requestedAtIso` — this
 * function never calls `Date.now()` or `new Date()` without arguments.
 */
export const normalizeSimilarityExecutionGuardRequest = (
  request: SimilarityExecutionGuardRequest,
): SimilarityExecutionGuardRequest => ({
  purpose: request.purpose,
  source: request.source,
  role: request.role,
  authState: request.authState,
  userId: request.userId,
  symbol: typeof request.symbol === 'string' ? request.symbol.trim() : request.symbol,
  market: request.market,
  assetType: request.assetType,
  requestedAtIso: request.requestedAtIso ?? DETERMINISTIC_FALLBACK_REQUESTED_AT_ISO,
});

export type SimilarityExecutionGuardRequestValidation = {
  ok: boolean;
  errorCode?: string;
  reason?: string;
};

const validateSimilarityExecutionGuardRequest = (
  request: SimilarityExecutionGuardRequest,
): SimilarityExecutionGuardRequestValidation => {
  if (typeof request.symbol !== 'string' || request.symbol.length === 0) {
    return { ok: false, errorCode: 'invalid_symbol', reason: 'symbol must be a non-empty string.' };
  }
  if (request.market !== 'KR') {
    return { ok: false, errorCode: 'invalid_market', reason: 'market must be "KR".' };
  }
  if (request.assetType !== 'stock' && request.assetType !== 'etf') {
    return { ok: false, errorCode: 'invalid_asset_type', reason: 'assetType must be "stock" or "etf".' };
  }
  if (request.purpose !== 'chart-similarity') {
    return { ok: false, errorCode: 'invalid_purpose', reason: 'purpose must be "chart-similarity".' };
  }
  return { ok: true };
};

/** Builds a role's configured daily limit from the supplied policy. Pure lookup, no I/O. */
export const getRoleDailyLimit = (
  role: SimilarityExecutionRole,
  policy: SimilarityExecutionGuardPolicy = buildDefaultSimilarityExecutionGuardPolicy(),
): number => {
  if (role === 'admin') return policy.adminDailyLimit;
  if (role === 'owner') return policy.ownerDailyLimit;
  if (role === 'beta') return policy.betaDailyLimit;
  return policy.defaultDailyLimit;
};

/**
 * Builds a usage snapshot from caller-supplied counts. Pure arithmetic only — never reads or
 * writes real usage state.
 */
export const buildUsageSnapshot = (
  window: SimilarityExecutionUsageWindow,
  used: number,
  limit: number,
  resetAtIso?: string,
): SimilarityExecutionUsageSnapshot => {
  const safeUsed = Number.isFinite(used) && used >= 0 ? used : 0;
  const safeLimit = Number.isFinite(limit) && limit >= 0 ? limit : 0;
  return {
    window,
    used: safeUsed,
    limit: safeLimit,
    remaining: Math.max(safeLimit - safeUsed, 0),
    ...(resetAtIso ? { resetAtIso } : {}),
  };
};

const buildResult = (
  request: SimilarityExecutionGuardRequest,
  status: SimilarityExecutionGuardStatus,
  usage: SimilarityExecutionUsageSnapshot | null,
  safeMessage: string,
  warning?: string,
  errorCode?: string,
): SimilarityExecutionGuardResult => ({
  ok: status === 'allowed',
  status,
  request,
  usage,
  safeMessage,
  warnings: warning ? [warning] : [],
  ...(errorCode ? { errorCode } : {}),
});

const evaluateUsageGuard = (
  request: SimilarityExecutionGuardRequest,
  policy: SimilarityExecutionGuardPolicy,
  usage: SimilarityExecutionUsageSnapshot | null,
): SimilarityExecutionGuardResult => {
  if (!policy.requireUsageGuard) {
    return buildResult(request, 'allowed', usage, 'Chart Similarity execution is allowed.');
  }
  if (!usage) {
    return buildResult(
      request,
      'not_configured',
      null,
      'Chart Similarity execution cannot be evaluated without a usage snapshot.',
      'A usage guard is required by policy but no usage snapshot was supplied.',
    );
  }
  if (usage.used >= usage.limit || usage.remaining <= 0) {
    return buildResult(
      request,
      'usage_limited',
      usage,
      'Chart Similarity daily usage limit has been reached.',
      'Supplied usage snapshot has no remaining quota for this window.',
    );
  }
  return buildResult(request, 'allowed', usage, 'Chart Similarity execution is allowed.');
};

/**
 * Policy-first, disabled-by-default guard evaluator for Chart Similarity execution. Never
 * throws for expected bad input; returns a structured, non-ok result instead. Evaluates only
 * the caller-supplied `options.usage` snapshot — it never persists, increments, or fabricates
 * usage state.
 */
export const evaluateSimilarityExecutionGuard = (
  request: SimilarityExecutionGuardRequest,
  options?: {
    policy?: SimilarityExecutionGuardPolicy;
    usage?: SimilarityExecutionUsageSnapshot | null;
  },
): SimilarityExecutionGuardResult => {
  const policy = options?.policy ?? buildDefaultSimilarityExecutionGuardPolicy();
  const usage = options?.usage ?? null;
  const normalizedRequest = normalizeSimilarityExecutionGuardRequest(request);

  const validation = validateSimilarityExecutionGuardRequest(normalizedRequest);
  if (!validation.ok) {
    return buildResult(
      normalizedRequest,
      'blocked',
      null,
      'Chart Similarity execution request could not be processed.',
      `Request rejected: ${validation.reason ?? 'invalid request.'}`,
      validation.errorCode,
    );
  }

  if (normalizedRequest.source === 'mocked') {
    if (policy.allowAnonymousMockedPreview) {
      return buildResult(normalizedRequest, 'allowed', null, 'Mocked Chart Similarity preview is allowed.');
    }
    return buildResult(
      normalizedRequest,
      'feature_disabled',
      null,
      'Mocked Chart Similarity preview is disabled by policy.',
    );
  }

  if (normalizedRequest.source === 'owner-local') {
    const isOwnerRole = normalizedRequest.role === 'owner' || normalizedRequest.role === 'admin';
    if (!isOwnerRole) {
      if (isUnauthenticatedState(normalizedRequest)) {
        return buildResult(
          normalizedRequest,
          'auth_required',
          null,
          'Owner-local Chart Similarity execution requires authentication.',
        );
      }
      return buildResult(
        normalizedRequest,
        'blocked',
        null,
        'Owner-local Chart Similarity execution is not available for this role.',
        'Owner-local execution requires an owner or admin role.',
        'owner_local_role_required',
      );
    }
    if (!policy.enabled) {
      return buildResult(
        normalizedRequest,
        'feature_disabled',
        null,
        'Owner-local Chart Similarity execution is disabled by policy.',
      );
    }
    if (policy.requireAuth && isUnauthenticatedState(normalizedRequest)) {
      return buildResult(
        normalizedRequest,
        'auth_required',
        null,
        'Owner-local Chart Similarity execution requires authentication.',
      );
    }
    return evaluateUsageGuard(normalizedRequest, policy, usage);
  }

  // source === 'kis-normalized'
  if (!policy.enabled) {
    return buildResult(
      normalizedRequest,
      'feature_disabled',
      null,
      'KIS-normalized Chart Similarity execution is disabled by policy.',
    );
  }
  if (policy.requireAuth && isUnauthenticatedState(normalizedRequest)) {
    return buildResult(
      normalizedRequest,
      'auth_required',
      null,
      'KIS-normalized Chart Similarity execution requires authentication.',
    );
  }
  return evaluateUsageGuard(normalizedRequest, policy, usage);
};
