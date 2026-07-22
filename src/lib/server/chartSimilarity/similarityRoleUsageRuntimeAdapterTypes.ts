/**
 * Server-only role/usage runtime adapter contract for Phase 3FD-D.
 *
 * This contract supports deterministic mocked DB fixtures only. It exposes no provider payload,
 * credential, session material, market data, or raw counter values in its public result.
 */

export type SimilarityRoleUsageRuntimeAdapterStatus =
  | 'disabled'
  | 'resolved'
  | 'role_not_found'
  | 'role_ambiguous'
  | 'role_invalid'
  | 'usage_not_found'
  | 'usage_limited'
  | 'idempotent_replay'
  | 'transaction_failed'
  | 'mock_db_unavailable'
  | 'redaction_failed'
  | 'error';

export type SimilarityRoleUsageRuntimeAdapterSource = 'disabled' | 'mocked-db';

export type SimilarityRoleUsageRuntimeAdapterPolicy = {
  enabled: boolean;
  allowMockedDb: boolean;
  allowRealDb: false;
  allowSupabaseClient: false;
  allowEnvRead: false;
  allowServiceRole: false;
  allowRouteSuccess: false;
  allowUserClientWrite: false;
  allowRawDbEcho: false;
  notes: string[];
};

export type SimilarityRoleUsageRuntimeAdapterSafePolicySummary = Pick<
  SimilarityRoleUsageRuntimeAdapterPolicy,
  | 'enabled'
  | 'allowMockedDb'
  | 'allowRealDb'
  | 'allowSupabaseClient'
  | 'allowEnvRead'
  | 'allowServiceRole'
  | 'allowRouteSuccess'
  | 'allowUserClientWrite'
  | 'allowRawDbEcho'
>;

export type SimilarityRoleUsageRuntimeSubject = {
  subjectRef: string;
  authSeedRole: 'authenticated';
  providerKind?: 'email' | 'oauth' | 'unknown' | null;
};

export type SimilarityRoleUsageResolvedRole = 'authenticated' | 'beta' | 'owner' | 'admin';

export type SimilarityRoleAssignmentRecord = {
  assignmentRef: string;
  subjectRef: string;
  role: SimilarityRoleUsageResolvedRole;
  status: 'active' | 'scheduled' | 'expired' | 'revoked' | 'malformed';
  validFromIso: string;
  validUntilIso?: string | null;
  grantedByRef?: string | null;
  safeReasonCode?: string | null;
};

export type SimilarityUsageCounterRecord = {
  counterRef: string;
  subjectRef: string;
  role: SimilarityRoleUsageResolvedRole;
  usageScope: 'chart_similarity_scan';
  periodType: 'daily' | 'monthly';
  periodStartIso: string;
  periodEndIso: string;
  usedCount: number;
  limitCount: number;
  updatedAtIso: string;
};

export type SimilarityUsageEventRecord = {
  eventRef: string;
  idempotencyKey: string;
  subjectRef: string;
  role: SimilarityRoleUsageResolvedRole;
  usageScope: 'chart_similarity_scan';
  eventStatus: 'committed' | 'rejected' | 'replayed';
  incrementAmount: number;
  safeOutcome: 'allowed' | 'blocked';
  createdAtIso: string;
  metadataSafe?: Record<string, string | number | boolean | null>;
};

export type SimilarityRoleUsageRuntimeAdapterRequest = {
  subject: SimilarityRoleUsageRuntimeSubject;
  usageScope: 'chart_similarity_scan';
  idempotencyKey: string;
  currentIso: string;
  incrementAmount: number;
};

export type SimilarityRoleUsageRuntimeAdapterDecision = {
  allowed: boolean;
  resolvedRole: SimilarityRoleUsageResolvedRole | 'anonymous';
  usageRemainingDailyBucket: 'none' | 'low' | 'available' | 'unknown';
  usageRemainingMonthlyBucket: 'none' | 'low' | 'available' | 'unknown';
  safeReason: string;
  warnings: string[];
};

export type SimilarityRoleUsageRuntimeAdapterResult = {
  ok: boolean;
  status: SimilarityRoleUsageRuntimeAdapterStatus;
  source: SimilarityRoleUsageRuntimeAdapterSource;
  decision: SimilarityRoleUsageRuntimeAdapterDecision;
  safeMessage: string;
  warnings: string[];
  policySummary: SimilarityRoleUsageRuntimeAdapterSafePolicySummary;
};

export type SimilarityRoleUsageCounterLookupInput = {
  subjectRef: string;
  role: SimilarityRoleUsageResolvedRole;
  usageScope: 'chart_similarity_scan';
  periodType: 'daily' | 'monthly';
  currentIso: string;
};

export type SimilarityRoleUsageCommitInput = {
  request: SimilarityRoleUsageRuntimeAdapterRequest;
  resolvedRole: SimilarityRoleUsageResolvedRole;
  dailyCounter: SimilarityUsageCounterRecord;
  monthlyCounter: SimilarityUsageCounterRecord;
};

export type SimilarityRoleUsageMockDb = {
  findRoleAssignments(subjectRef: string): Promise<SimilarityRoleAssignmentRecord[]>;
  findUsageCounter(input: SimilarityRoleUsageCounterLookupInput): Promise<SimilarityUsageCounterRecord | null>;
  findUsageEventByIdempotencyKey(idempotencyKey: string): Promise<SimilarityUsageEventRecord | null>;
  commitUsageEventAndCounter(input: SimilarityRoleUsageCommitInput): Promise<SimilarityUsageEventRecord>;
};

export type SimilarityRoleUsageRuntimeAdapterDeps = {
  mockDb?: SimilarityRoleUsageMockDb | null;
};

export type SimilarityRoleUsageRoleResolution = {
  ok: boolean;
  status: 'resolved' | 'role_not_found' | 'role_ambiguous' | 'role_invalid';
  role: SimilarityRoleUsageResolvedRole | 'anonymous';
  warnings: string[];
};

export type SimilarityRoleUsageComputation = {
  allowed: boolean;
  dailyBucket: SimilarityRoleUsageRuntimeAdapterDecision['usageRemainingDailyBucket'];
  monthlyBucket: SimilarityRoleUsageRuntimeAdapterDecision['usageRemainingMonthlyBucket'];
};
