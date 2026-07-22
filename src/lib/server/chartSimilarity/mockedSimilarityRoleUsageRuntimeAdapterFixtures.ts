/** Deterministic mocked DB fixtures for the Phase 3FD-D role/usage runtime adapter. */

import { buildMockedDbSimilarityRoleUsageRuntimeAdapterPolicy } from './similarityRoleUsageRuntimeAdapter';
import type {
  SimilarityRoleAssignmentRecord,
  SimilarityRoleUsageCommitInput,
  SimilarityRoleUsageMockDb,
  SimilarityRoleUsageResolvedRole,
  SimilarityRoleUsageRuntimeAdapterPolicy,
  SimilarityRoleUsageRuntimeAdapterRequest,
  SimilarityUsageCounterRecord,
  SimilarityUsageEventRecord,
} from './similarityRoleUsageRuntimeAdapterTypes';

const SUBJECT_REF = 'mock-subject-ref-001';
const CURRENT_ISO = '2026-07-04T12:00:00.000+09:00';
const DAILY_START_ISO = '2026-07-04T00:00:00.000+09:00';
const DAILY_END_ISO = '2026-07-05T00:00:00.000+09:00';
const MONTHLY_START_ISO = '2026-07-01T00:00:00.000+09:00';
const MONTHLY_END_ISO = '2026-08-01T00:00:00.000+09:00';

export type SimilarityRoleUsageMockDbFixture = SimilarityRoleUsageMockDb & {
  getCommitCallCount(): number;
};

export function buildMockedRoleUsageRuntimeAdapterRequest(): SimilarityRoleUsageRuntimeAdapterRequest {
  return {
    subject: {
      subjectRef: SUBJECT_REF,
      authSeedRole: 'authenticated',
      providerKind: 'unknown',
    },
    usageScope: 'chart_similarity_scan',
    idempotencyKey: 'mock-idempotency-key-001',
    currentIso: CURRENT_ISO,
    incrementAmount: 1,
  };
}

export function buildMockedRoleUsageRuntimeAdapterPolicy(): SimilarityRoleUsageRuntimeAdapterPolicy {
  return buildMockedDbSimilarityRoleUsageRuntimeAdapterPolicy();
}

function buildAssignment(
  role: SimilarityRoleUsageResolvedRole,
  status: SimilarityRoleAssignmentRecord['status'] = 'active',
  assignmentRef = 'mock-assignment-ref-001',
): SimilarityRoleAssignmentRecord {
  return {
    assignmentRef,
    subjectRef: SUBJECT_REF,
    role,
    status,
    validFromIso: '2026-07-01T00:00:00.000+09:00',
    validUntilIso: '2026-08-01T00:00:00.000+09:00',
    grantedByRef: 'mock-admin-ref-001',
    safeReasonCode: 'mock-approved-role',
  };
}

function roleLimits(role: SimilarityRoleUsageResolvedRole): { daily: number; monthly: number } {
  if (role === 'authenticated') return { daily: 3, monthly: 30 };
  if (role === 'beta') return { daily: 10, monthly: 100 };
  if (role === 'owner') return { daily: 50, monthly: 1000 };
  return { daily: 100, monthly: 3000 };
}

function buildCounters(
  role: SimilarityRoleUsageResolvedRole,
  options: { limited?: boolean; missingPeriod?: 'daily' | 'monthly' } = {},
): SimilarityUsageCounterRecord[] {
  const limits = roleLimits(role);
  const daily: SimilarityUsageCounterRecord = {
    counterRef: 'mock-counter-ref-001',
    subjectRef: SUBJECT_REF,
    role,
    usageScope: 'chart_similarity_scan',
    periodType: 'daily',
    periodStartIso: DAILY_START_ISO,
    periodEndIso: DAILY_END_ISO,
    usedCount: options.limited ? limits.daily : Math.min(1, limits.daily),
    limitCount: limits.daily,
    updatedAtIso: CURRENT_ISO,
  };
  const monthly: SimilarityUsageCounterRecord = {
    counterRef: 'mock-counter-ref-002',
    subjectRef: SUBJECT_REF,
    role,
    usageScope: 'chart_similarity_scan',
    periodType: 'monthly',
    periodStartIso: MONTHLY_START_ISO,
    periodEndIso: MONTHLY_END_ISO,
    usedCount: Math.min(5, limits.monthly),
    limitCount: limits.monthly,
    updatedAtIso: CURRENT_ISO,
  };
  return [daily, monthly].filter((counter) => counter.periodType !== options.missingPeriod);
}

function buildMockDbFixture(options: {
  role: SimilarityRoleUsageResolvedRole;
  assignments?: SimilarityRoleAssignmentRecord[];
  counters?: SimilarityUsageCounterRecord[];
  existingEvent?: SimilarityUsageEventRecord | null;
  transactionFailure?: boolean;
}): SimilarityRoleUsageMockDbFixture {
  let commitCallCount = 0;
  const assignments = options.assignments ?? [];
  const counters = options.counters ?? buildCounters(options.role);
  const existingEvent = options.existingEvent ?? null;

  return {
    async findRoleAssignments(subjectRef) {
      return subjectRef === SUBJECT_REF ? assignments.map((record) => ({ ...record })) : [];
    },
    async findUsageCounter(input) {
      const match = counters.find(
        (counter) =>
          counter.subjectRef === input.subjectRef &&
          counter.role === input.role &&
          counter.usageScope === input.usageScope &&
          counter.periodType === input.periodType,
      );
      return match ? { ...match } : null;
    },
    async findUsageEventByIdempotencyKey(idempotencyKey) {
      return existingEvent?.idempotencyKey === idempotencyKey ? { ...existingEvent } : null;
    },
    async commitUsageEventAndCounter(input: SimilarityRoleUsageCommitInput) {
      commitCallCount += 1;
      if (options.transactionFailure) throw new Error('mocked_transaction_failure');
      return {
        eventRef: 'mock-event-ref-001',
        idempotencyKey: input.request.idempotencyKey,
        subjectRef: input.request.subject.subjectRef,
        role: input.resolvedRole,
        usageScope: input.request.usageScope,
        eventStatus: 'committed',
        incrementAmount: input.request.incrementAmount,
        safeOutcome: 'allowed',
        createdAtIso: input.request.currentIso,
        metadataSafe: { fixture: 'mocked-db' },
      };
    },
    getCommitCallCount() {
      return commitCallCount;
    },
  };
}

export function buildMockedDbWithAuthenticatedUsageAvailable(): SimilarityRoleUsageMockDbFixture {
  return buildMockDbFixture({ role: 'authenticated' });
}

export function buildMockedDbWithBetaRoleUsageAvailable(): SimilarityRoleUsageMockDbFixture {
  return buildMockDbFixture({ role: 'beta', assignments: [buildAssignment('beta')] });
}

export function buildMockedDbWithOwnerRoleUsageAvailable(): SimilarityRoleUsageMockDbFixture {
  return buildMockDbFixture({ role: 'owner', assignments: [buildAssignment('owner')] });
}

export function buildMockedDbWithAdminRoleUsageAvailable(): SimilarityRoleUsageMockDbFixture {
  return buildMockDbFixture({ role: 'admin', assignments: [buildAssignment('admin')] });
}

export function buildMockedDbWithUsageLimited(): SimilarityRoleUsageMockDbFixture {
  return buildMockDbFixture({ role: 'authenticated', counters: buildCounters('authenticated', { limited: true }) });
}

export function buildMockedDbWithIdempotentReplay(): SimilarityRoleUsageMockDbFixture {
  return buildMockDbFixture({
    role: 'authenticated',
    existingEvent: {
      eventRef: 'mock-event-ref-001',
      idempotencyKey: 'mock-idempotency-key-001',
      subjectRef: SUBJECT_REF,
      role: 'authenticated',
      usageScope: 'chart_similarity_scan',
      eventStatus: 'committed',
      incrementAmount: 1,
      safeOutcome: 'allowed',
      createdAtIso: CURRENT_ISO,
      metadataSafe: { fixture: 'mocked-db' },
    },
  });
}

export function buildMockedDbWithAmbiguousRoleAssignments(): SimilarityRoleUsageMockDbFixture {
  return buildMockDbFixture({
    role: 'beta',
    assignments: [buildAssignment('beta'), buildAssignment('owner', 'active', 'mock-assignment-ref-002')],
  });
}

export function buildMockedDbWithExpiredRoleAssignment(): SimilarityRoleUsageMockDbFixture {
  return buildMockDbFixture({
    role: 'authenticated',
    assignments: [buildAssignment('beta', 'expired')],
  });
}

export function buildMockedDbWithMalformedRoleAssignment(): SimilarityRoleUsageMockDbFixture {
  return buildMockDbFixture({
    role: 'authenticated',
    assignments: [buildAssignment('beta', 'malformed')],
  });
}

export function buildMockedDbWithMissingCounters(): SimilarityRoleUsageMockDbFixture {
  return buildMockDbFixture({
    role: 'authenticated',
    counters: buildCounters('authenticated', { missingPeriod: 'daily' }),
  });
}

export function buildMockedDbWithTransactionFailure(): SimilarityRoleUsageMockDbFixture {
  return buildMockDbFixture({ role: 'authenticated', transactionFailure: true });
}

export function buildMockedDbUnavailable(): null {
  return null;
}
