/**
 * Server-only usage store interface type foundation for Chart Similarity (Phase 3FC-E).
 *
 * These types describe a future usage snapshot loader and usage incrementer that will read/write a
 * real Postgres/Supabase-style usage store, disabled by default. They are decoupled from any real
 * session/token/account data: no access token, no refresh token, no JWT, no raw session payload, no
 * cookie/header value, no environment value, no account/trading/balance field, no raw KIS/OHLC
 * payload. This file defines shapes only — it performs no I/O, calls no database, and touches no
 * network.
 *
 * This module consumes the role output of the Phase 3FC-D role assignment resolver and the subject
 * output of the Phase 3FC-C auth subject resolver. It never resolves auth state or role itself.
 */

export type SimilarityUsageStoreRole = 'anonymous' | 'authenticated' | 'beta' | 'owner' | 'admin';

export type SimilarityUsageStoreWindow = 'daily' | 'monthly';

export type SimilarityUsageStoreStatus =
  | 'disabled'
  | 'loaded'
  | 'limit_reached'
  | 'increment_recorded'
  | 'increment_blocked'
  | 'anonymous_blocked'
  | 'invalid_subject'
  | 'invalid_role'
  | 'counter_unavailable'
  | 'not_configured'
  | 'error';

export type SimilarityUsageStoreSource = 'default' | 'mocked-counter' | 'mocked-event';

export type SimilarityUsageStoreSubjectRef = {
  provider: 'supabase';
  subjectRef: string;
  source: 'mocked-scaffold';
  stableForUsageLookup: boolean;
};

export type SimilarityUsageCounterRecord = {
  subjectRef: string;
  role: Exclude<SimilarityUsageStoreRole, 'anonymous'>;
  window: SimilarityUsageStoreWindow;
  used: number;
  limit: number;
  remaining: number;
  resetAtIso: string;
  updatedAtIso: string;
  source: 'mocked-counter';
};

export type SimilarityUsageEventRecord = {
  eventRef: string;
  subjectRef: string;
  role: Exclude<SimilarityUsageStoreRole, 'anonymous'>;
  window: SimilarityUsageStoreWindow;
  incrementBy: number;
  occurredAtIso: string;
  source: 'mocked-event';
  guardStatus: 'allowed';
};

export type SimilarityUsageStoreInput = {
  role: SimilarityUsageStoreRole;
  subject: SimilarityUsageStoreSubjectRef | null;
  window: SimilarityUsageStoreWindow;
  mockedCounters?: SimilarityUsageCounterRecord[] | null;
  incrementBy?: number | null;
  requestRef?: string | null;
  currentIso?: string | null;
  clientClaimedRole?: string | null;
  clientClaimedUsage?: unknown;
};

export type SimilarityUsageStorePolicy = {
  enabled: boolean;
  allowMockedUsageRead: boolean;
  allowMockedUsageIncrement: boolean;
  allowRealUsageStore: false;
  allowSupabaseClient: false;
  allowEnvRead: false;
  allowDbRead: false;
  allowDbWrite: false;
  allowSql: false;
  allowCookieRead: false;
  allowHeaderRead: false;
  allowClientClaimedRole: false;
  allowClientClaimedUsage: false;
  allowAnonymousExecution: false;
  allowRouteSuccess: false;
  allowPublicExecution: false;
  allowBetaExecution: false;
  resetTimezone: 'Asia/Seoul';
  notes: string[];
};

export type SimilarityUsageStoreSafePolicySummary = Pick<
  SimilarityUsageStorePolicy,
  | 'enabled'
  | 'allowMockedUsageRead'
  | 'allowMockedUsageIncrement'
  | 'allowRealUsageStore'
  | 'allowSupabaseClient'
  | 'allowEnvRead'
  | 'allowDbRead'
  | 'allowDbWrite'
  | 'allowSql'
  | 'allowCookieRead'
  | 'allowHeaderRead'
  | 'allowClientClaimedRole'
  | 'allowClientClaimedUsage'
  | 'allowAnonymousExecution'
  | 'allowRouteSuccess'
  | 'allowPublicExecution'
  | 'allowBetaExecution'
  | 'resetTimezone'
>;

export type SimilarityUsageSnapshot = {
  role: SimilarityUsageStoreRole;
  window: SimilarityUsageStoreWindow;
  used: number;
  limit: number;
  remaining: number;
  resetAtIso: string;
  isLimitReached: boolean;
  source: 'default' | 'mocked-counter';
};

export type SimilarityUsageStoreSnapshotResult = {
  ok: boolean;
  status: SimilarityUsageStoreStatus;
  role: SimilarityUsageStoreRole;
  subject: SimilarityUsageStoreSubjectRef | null;
  window: SimilarityUsageStoreWindow;
  usage: SimilarityUsageSnapshot | null;
  safeMessage: string;
  policy: SimilarityUsageStoreSafePolicySummary;
  warnings: string[];
};

export type SimilarityUsageStoreIncrementResult = {
  ok: boolean;
  status: SimilarityUsageStoreStatus;
  role: SimilarityUsageStoreRole;
  subject: SimilarityUsageStoreSubjectRef | null;
  window: SimilarityUsageStoreWindow;
  before: SimilarityUsageSnapshot | null;
  after: SimilarityUsageSnapshot | null;
  event: Pick<
    SimilarityUsageEventRecord,
    'eventRef' | 'role' | 'window' | 'incrementBy' | 'occurredAtIso' | 'source' | 'guardStatus'
  > | null;
  safeMessage: string;
  policy: SimilarityUsageStoreSafePolicySummary;
  warnings: string[];
};
