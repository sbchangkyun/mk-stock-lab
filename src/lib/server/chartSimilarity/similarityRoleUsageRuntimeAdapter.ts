/**
 * Disabled-by-default role/usage runtime adapter for Phase 3FD-D.
 *
 * Only an explicitly injected deterministic mocked DB may be consulted. This module constructs no
 * client, reads no configuration or request context, performs no network call, and grants no route
 * capability. Its public result exposes safe role and remaining-usage buckets only.
 */

import type {
  SimilarityRoleAssignmentRecord,
  SimilarityRoleUsageComputation,
  SimilarityRoleUsageResolvedRole,
  SimilarityRoleUsageRoleResolution,
  SimilarityRoleUsageRuntimeAdapterDecision,
  SimilarityRoleUsageRuntimeAdapterDeps,
  SimilarityRoleUsageRuntimeAdapterPolicy,
  SimilarityRoleUsageRuntimeAdapterRequest,
  SimilarityRoleUsageRuntimeAdapterResult,
  SimilarityRoleUsageRuntimeAdapterSafePolicySummary,
  SimilarityRoleUsageRuntimeSubject,
  SimilarityUsageCounterRecord,
  SimilarityUsageEventRecord,
} from './similarityRoleUsageRuntimeAdapterTypes';

const FORBIDDEN_RESULT_SUBSTRINGS = [
  'accesstoken',
  'refreshtoken',
  'jwt',
  'rawsession',
  'rawuser',
  'phone',
  'cookie',
  'authorization',
  'supabase_service_role_key',
  'service_role',
  'secret',
  'credential',
  'kis_app_key',
  'kis_app_secret',
  'ohlc',
  'account',
  'trading',
  'order',
  'balance',
  '"source":"live"',
  '"source":"auto"',
];

const EMAIL_ADDRESS_SHAPE_PATTERN = /[^\s"|]+@[^\s"|]+\.[^\s"|]+/;
const RESOLVED_ROLES: SimilarityRoleUsageResolvedRole[] = ['authenticated', 'beta', 'owner', 'admin'];
const PRIVILEGED_ROLES: SimilarityRoleUsageResolvedRole[] = ['beta', 'owner', 'admin'];
const ASSIGNMENT_STATUSES = ['active', 'scheduled', 'expired', 'revoked', 'malformed'];

export function buildDefaultSimilarityRoleUsageRuntimeAdapterPolicy(): SimilarityRoleUsageRuntimeAdapterPolicy {
  return {
    enabled: false,
    allowMockedDb: false,
    allowRealDb: false,
    allowSupabaseClient: false,
    allowEnvRead: false,
    allowServiceRole: false,
    allowRouteSuccess: false,
    allowUserClientWrite: false,
    allowRawDbEcho: false,
    notes: [
      'Disabled by default and limited to an explicitly injected deterministic mocked DB.',
      'Adapter decisions never grant route success or authorize a real persistence path.',
      'All uncertainty fails closed without exposing raw mocked records.',
    ],
  };
}

export function buildMockedDbSimilarityRoleUsageRuntimeAdapterPolicy(): SimilarityRoleUsageRuntimeAdapterPolicy {
  return {
    ...buildDefaultSimilarityRoleUsageRuntimeAdapterPolicy(),
    enabled: true,
    allowMockedDb: true,
  };
}

function toSafePolicySummary(
  policy: SimilarityRoleUsageRuntimeAdapterPolicy,
): SimilarityRoleUsageRuntimeAdapterSafePolicySummary {
  return {
    enabled: policy.enabled,
    allowMockedDb: policy.allowMockedDb,
    allowRealDb: policy.allowRealDb,
    allowSupabaseClient: policy.allowSupabaseClient,
    allowEnvRead: policy.allowEnvRead,
    allowServiceRole: policy.allowServiceRole,
    allowRouteSuccess: policy.allowRouteSuccess,
    allowUserClientWrite: policy.allowUserClientWrite,
    allowRawDbEcho: policy.allowRawDbEcho,
  };
}

function blockedDecision(
  safeReason: string,
  resolvedRole: SimilarityRoleUsageRuntimeAdapterDecision['resolvedRole'] = 'anonymous',
  warnings: string[] = [],
): SimilarityRoleUsageRuntimeAdapterDecision {
  return {
    allowed: false,
    resolvedRole,
    usageRemainingDailyBucket: 'unknown',
    usageRemainingMonthlyBucket: 'unknown',
    safeReason,
    warnings,
  };
}

function buildResult(
  policy: SimilarityRoleUsageRuntimeAdapterPolicy,
  result: Omit<SimilarityRoleUsageRuntimeAdapterResult, 'policySummary'>,
): SimilarityRoleUsageRuntimeAdapterResult {
  const candidate: SimilarityRoleUsageRuntimeAdapterResult = {
    ...result,
    policySummary: toSafePolicySummary(policy),
  };

  try {
    assertSimilarityRoleUsageRuntimeAdapterResultIsSafe(candidate);
    return candidate;
  } catch {
    return {
      ok: false,
      status: 'redaction_failed',
      source: policy.enabled ? 'mocked-db' : 'disabled',
      decision: blockedDecision('unsafe_output_blocked', 'anonymous', ['redaction_failed']),
      safeMessage: 'Adapter output failed safety validation and was blocked.',
      warnings: ['redaction_failed'],
      policySummary: toSafePolicySummary(policy),
    };
  }
}

export function normalizeSimilarityRoleUsageRuntimeAdapterRequest(
  input: unknown,
): SimilarityRoleUsageRuntimeAdapterRequest | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return null;
  const candidate = input as Record<string, unknown>;
  const subject = candidate.subject;
  if (typeof subject !== 'object' || subject === null || Array.isArray(subject)) return null;
  const subjectCandidate = subject as Record<string, unknown>;
  const providerKinds = ['email', 'oauth', 'unknown'];

  if (typeof subjectCandidate.subjectRef !== 'string' || subjectCandidate.subjectRef.length === 0) return null;
  if (subjectCandidate.authSeedRole !== 'authenticated') return null;
  if (
    subjectCandidate.providerKind !== undefined &&
    subjectCandidate.providerKind !== null &&
    (typeof subjectCandidate.providerKind !== 'string' || !providerKinds.includes(subjectCandidate.providerKind))
  ) {
    return null;
  }
  if (candidate.usageScope !== 'chart_similarity_scan') return null;
  if (typeof candidate.idempotencyKey !== 'string' || candidate.idempotencyKey.length === 0) return null;
  if (typeof candidate.currentIso !== 'string' || !Number.isFinite(Date.parse(candidate.currentIso))) return null;
  if (
    typeof candidate.incrementAmount !== 'number' ||
    !Number.isInteger(candidate.incrementAmount) ||
    candidate.incrementAmount <= 0
  ) {
    return null;
  }

  return {
    subject: {
      subjectRef: subjectCandidate.subjectRef,
      authSeedRole: 'authenticated',
      providerKind:
        (subjectCandidate.providerKind as SimilarityRoleUsageRuntimeSubject['providerKind']) ?? null,
    },
    usageScope: 'chart_similarity_scan',
    idempotencyKey: candidate.idempotencyKey,
    currentIso: candidate.currentIso,
    incrementAmount: candidate.incrementAmount,
  };
}

function isSafeAssignmentRecord(record: SimilarityRoleAssignmentRecord): boolean {
  return (
    typeof record.assignmentRef === 'string' &&
    record.assignmentRef.length > 0 &&
    typeof record.subjectRef === 'string' &&
    record.subjectRef.length > 0 &&
    RESOLVED_ROLES.includes(record.role) &&
    ASSIGNMENT_STATUSES.includes(record.status) &&
    typeof record.validFromIso === 'string' &&
    Number.isFinite(Date.parse(record.validFromIso)) &&
    (record.validUntilIso === undefined ||
      record.validUntilIso === null ||
      (typeof record.validUntilIso === 'string' && Number.isFinite(Date.parse(record.validUntilIso))))
  );
}

export function resolveRoleFromAssignments(
  subject: SimilarityRoleUsageRuntimeSubject,
  assignments: SimilarityRoleAssignmentRecord[],
  currentIso: string,
): SimilarityRoleUsageRoleResolution {
  if (!Array.isArray(assignments)) {
    return { ok: false, status: 'role_invalid', role: 'anonymous', warnings: ['assignment_set_invalid'] };
  }

  const currentMs = Date.parse(currentIso);
  if (!Number.isFinite(currentMs)) {
    return { ok: false, status: 'role_invalid', role: 'anonymous', warnings: ['current_time_invalid'] };
  }

  for (const assignment of assignments) {
    if (!isSafeAssignmentRecord(assignment) || assignment.status === 'malformed') {
      return { ok: false, status: 'role_invalid', role: 'anonymous', warnings: ['assignment_invalid'] };
    }
    if (assignment.subjectRef !== subject.subjectRef) {
      return { ok: false, status: 'role_invalid', role: 'anonymous', warnings: ['assignment_subject_mismatch'] };
    }
  }

  const activePrivileged = assignments.filter((assignment) => {
    if (assignment.status !== 'active' || !PRIVILEGED_ROLES.includes(assignment.role)) return false;
    const validFromMs = Date.parse(assignment.validFromIso);
    const validUntilMs = assignment.validUntilIso ? Date.parse(assignment.validUntilIso) : null;
    return validFromMs <= currentMs && (validUntilMs === null || currentMs < validUntilMs);
  });

  if (activePrivileged.length > 1) {
    return {
      ok: false,
      status: 'role_ambiguous',
      role: 'anonymous',
      warnings: ['multiple_active_assignments'],
    };
  }

  if (activePrivileged.length === 1) {
    return { ok: true, status: 'resolved', role: activePrivileged[0].role, warnings: [] };
  }

  const ignoredAssignments = assignments.filter((assignment) => assignment.role !== 'authenticated').length;
  return {
    ok: true,
    status: 'resolved',
    role: 'authenticated',
    warnings: ignoredAssignments > 0 ? ['inactive_assignment_ignored'] : [],
  };
}

export function mapUsageRemainingBucket(
  remaining: number,
): SimilarityRoleUsageRuntimeAdapterDecision['usageRemainingDailyBucket'] {
  if (!Number.isFinite(remaining) || remaining < 0) return 'unknown';
  if (remaining === 0) return 'none';
  if (remaining <= 2) return 'low';
  return 'available';
}

function isSafeCounter(
  counter: SimilarityUsageCounterRecord,
  subjectRef: string,
  role: SimilarityRoleUsageResolvedRole,
  periodType: 'daily' | 'monthly',
  currentIso: string,
): boolean {
  const currentMs = Date.parse(currentIso);
  const startMs = Date.parse(counter.periodStartIso);
  const endMs = Date.parse(counter.periodEndIso);
  return (
    counter.subjectRef === subjectRef &&
    counter.role === role &&
    counter.usageScope === 'chart_similarity_scan' &&
    counter.periodType === periodType &&
    Number.isInteger(counter.usedCount) &&
    Number.isInteger(counter.limitCount) &&
    counter.usedCount >= 0 &&
    counter.limitCount >= 0 &&
    counter.usedCount <= counter.limitCount &&
    Number.isFinite(startMs) &&
    Number.isFinite(endMs) &&
    startMs <= currentMs &&
    currentMs < endMs
  );
}

export function computeUsageDecision(
  dailyCounter: SimilarityUsageCounterRecord,
  monthlyCounter: SimilarityUsageCounterRecord,
  incrementAmount: number,
): SimilarityRoleUsageComputation {
  const dailyRemainingAfter = dailyCounter.limitCount - dailyCounter.usedCount - incrementAmount;
  const monthlyRemainingAfter = monthlyCounter.limitCount - monthlyCounter.usedCount - incrementAmount;
  const allowed = dailyRemainingAfter >= 0 && monthlyRemainingAfter >= 0;
  return {
    allowed,
    dailyBucket: mapUsageRemainingBucket(allowed ? dailyRemainingAfter : dailyCounter.limitCount - dailyCounter.usedCount),
    monthlyBucket: mapUsageRemainingBucket(
      allowed ? monthlyRemainingAfter : monthlyCounter.limitCount - monthlyCounter.usedCount,
    ),
  };
}

function isSafeReplayEvent(
  event: SimilarityUsageEventRecord,
  request: SimilarityRoleUsageRuntimeAdapterRequest,
  role: SimilarityRoleUsageResolvedRole,
): boolean {
  return (
    event.idempotencyKey === request.idempotencyKey &&
    event.subjectRef === request.subject.subjectRef &&
    event.role === role &&
    event.usageScope === request.usageScope &&
    ['committed', 'rejected', 'replayed'].includes(event.eventStatus) &&
    ['allowed', 'blocked'].includes(event.safeOutcome) &&
    Number.isInteger(event.incrementAmount) &&
    event.incrementAmount > 0 &&
    typeof event.createdAtIso === 'string' &&
    Number.isFinite(Date.parse(event.createdAtIso))
  );
}

export async function resolveSimilarityRoleUsageRuntimeAdapter(
  rawRequest: unknown,
  deps: SimilarityRoleUsageRuntimeAdapterDeps = {},
  policy: SimilarityRoleUsageRuntimeAdapterPolicy = buildDefaultSimilarityRoleUsageRuntimeAdapterPolicy(),
): Promise<SimilarityRoleUsageRuntimeAdapterResult> {
  if (!policy.enabled || !policy.allowMockedDb) {
    return buildResult(policy, {
      ok: false,
      status: 'disabled',
      source: 'disabled',
      decision: blockedDecision('adapter_disabled'),
      safeMessage: 'Role/usage runtime adapter is disabled by policy.',
      warnings: [],
    });
  }

  const request = normalizeSimilarityRoleUsageRuntimeAdapterRequest(rawRequest);
  if (!request) {
    return buildResult(policy, {
      ok: false,
      status: 'role_invalid',
      source: 'mocked-db',
      decision: blockedDecision('request_invalid'),
      safeMessage: 'Adapter request was invalid and failed closed.',
      warnings: ['request_invalid'],
    });
  }

  const mockDb = deps.mockDb ?? null;
  if (!mockDb) {
    return buildResult(policy, {
      ok: false,
      status: 'mock_db_unavailable',
      source: 'mocked-db',
      decision: blockedDecision('mock_db_unavailable'),
      safeMessage: 'No injected mocked DB was available; request failed closed.',
      warnings: ['mock_db_unavailable'],
    });
  }

  try {
    const assignments = await mockDb.findRoleAssignments(request.subject.subjectRef);
    const roleResolution = resolveRoleFromAssignments(request.subject, assignments, request.currentIso);
    if (!roleResolution.ok || roleResolution.role === 'anonymous') {
      return buildResult(policy, {
        ok: false,
        status: roleResolution.status,
        source: 'mocked-db',
        decision: blockedDecision(roleResolution.status, 'anonymous', roleResolution.warnings),
        safeMessage: 'Role resolution failed closed.',
        warnings: roleResolution.warnings,
      });
    }

    const resolvedRole = roleResolution.role;
    const replay = await mockDb.findUsageEventByIdempotencyKey(request.idempotencyKey);
    if (replay) {
      if (!isSafeReplayEvent(replay, request, resolvedRole)) {
        return buildResult(policy, {
          ok: false,
          status: 'error',
          source: 'mocked-db',
          decision: blockedDecision('replay_record_invalid', resolvedRole, ['replay_record_invalid']),
          safeMessage: 'Existing idempotency outcome was invalid and failed closed.',
          warnings: ['replay_record_invalid'],
        });
      }
      const replayAllowed = replay.safeOutcome === 'allowed';
      return buildResult(policy, {
        ok: true,
        status: 'idempotent_replay',
        source: 'mocked-db',
        decision: {
          allowed: replayAllowed,
          resolvedRole,
          usageRemainingDailyBucket: 'unknown',
          usageRemainingMonthlyBucket: 'unknown',
          safeReason: replayAllowed ? 'prior_outcome_allowed' : 'prior_outcome_blocked',
          warnings: [...roleResolution.warnings, 'idempotent_replay'],
        },
        safeMessage: 'Prior safe idempotency outcome was reused without another commit.',
        warnings: [...roleResolution.warnings, 'idempotent_replay'],
      });
    }

    const [dailyCounter, monthlyCounter] = await Promise.all([
      mockDb.findUsageCounter({
        subjectRef: request.subject.subjectRef,
        role: resolvedRole,
        usageScope: request.usageScope,
        periodType: 'daily',
        currentIso: request.currentIso,
      }),
      mockDb.findUsageCounter({
        subjectRef: request.subject.subjectRef,
        role: resolvedRole,
        usageScope: request.usageScope,
        periodType: 'monthly',
        currentIso: request.currentIso,
      }),
    ]);

    if (
      !dailyCounter ||
      !monthlyCounter ||
      !isSafeCounter(dailyCounter, request.subject.subjectRef, resolvedRole, 'daily', request.currentIso) ||
      !isSafeCounter(monthlyCounter, request.subject.subjectRef, resolvedRole, 'monthly', request.currentIso)
    ) {
      return buildResult(policy, {
        ok: false,
        status: 'usage_not_found',
        source: 'mocked-db',
        decision: blockedDecision('usage_counter_unavailable', resolvedRole, ['usage_counter_unavailable']),
        safeMessage: 'Required usage counters were unavailable or invalid; request failed closed.',
        warnings: ['usage_counter_unavailable'],
      });
    }

    const usage = computeUsageDecision(dailyCounter, monthlyCounter, request.incrementAmount);
    if (!usage.allowed) {
      return buildResult(policy, {
        ok: false,
        status: 'usage_limited',
        source: 'mocked-db',
        decision: {
          allowed: false,
          resolvedRole,
          usageRemainingDailyBucket: usage.dailyBucket,
          usageRemainingMonthlyBucket: usage.monthlyBucket,
          safeReason: 'usage_limit_reached',
          warnings: roleResolution.warnings,
        },
        safeMessage: 'Usage policy blocked the mocked adapter decision.',
        warnings: roleResolution.warnings,
      });
    }

    try {
      const committedEvent = await mockDb.commitUsageEventAndCounter({
        request,
        resolvedRole,
        dailyCounter,
        monthlyCounter,
      });
      if (!isSafeReplayEvent(committedEvent, request, resolvedRole) || committedEvent.safeOutcome !== 'allowed') {
        throw new Error('mocked_commit_result_invalid');
      }
    } catch {
      return buildResult(policy, {
        ok: false,
        status: 'transaction_failed',
        source: 'mocked-db',
        decision: blockedDecision('transaction_failed', resolvedRole, ['transaction_failed']),
        safeMessage: 'Mocked transaction failed and granted no execution.',
        warnings: ['transaction_failed'],
      });
    }

    return buildResult(policy, {
      ok: true,
      status: 'resolved',
      source: 'mocked-db',
      decision: {
        allowed: true,
        resolvedRole,
        usageRemainingDailyBucket: usage.dailyBucket,
        usageRemainingMonthlyBucket: usage.monthlyBucket,
        safeReason: 'mocked_role_usage_allowed',
        warnings: roleResolution.warnings,
      },
      safeMessage: 'Mocked role and usage decision resolved successfully.',
      warnings: roleResolution.warnings,
    });
  } catch {
    return buildResult(policy, {
      ok: false,
      status: 'error',
      source: 'mocked-db',
      decision: blockedDecision('mock_db_lookup_failed', 'anonymous', ['mock_db_lookup_failed']),
      safeMessage: 'Mocked DB lookup failed and granted no execution.',
      warnings: ['mock_db_lookup_failed'],
    });
  }
}

function collectPrimitiveValues(value: unknown, sink: string[]): void {
  if (value === null || value === undefined) return;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    sink.push(String(value));
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectPrimitiveValues(item, sink);
    return;
  }
  if (typeof value === 'object') {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      collectPrimitiveValues((value as Record<string, unknown>)[key], sink);
    }
  }
}

export function assertSimilarityRoleUsageRuntimeAdapterResultIsSafe(
  result: SimilarityRoleUsageRuntimeAdapterResult,
): void {
  const values: string[] = [];
  collectPrimitiveValues(result, values);
  const haystack = values.join(' | ').toLowerCase();
  for (const forbidden of FORBIDDEN_RESULT_SUBSTRINGS) {
    if (haystack.includes(forbidden)) {
      throw new Error(`Role/usage runtime adapter safety assertion rejected forbidden value category: ${forbidden}`);
    }
  }
  if (EMAIL_ADDRESS_SHAPE_PATTERN.test(haystack)) {
    throw new Error('Role/usage runtime adapter safety assertion rejected an address-shaped value.');
  }
}
