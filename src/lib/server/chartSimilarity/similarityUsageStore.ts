/**
 * Server-only usage store interface scaffold for Chart Similarity (Phase 3FC-E).
 *
 * This module is a disabled-by-default scaffold only. It never imports a Supabase package, never
 * calls a real Supabase client, never reads `process.env`/`.env`, never reads cookies or request
 * headers, and never reads or writes a real usage database. It only maps an explicit,
 * caller-supplied input object (a resolved role plus deterministic mocked usage counter records,
 * used solely for fixture/smoke verification) to a safe snapshot or increment result.
 *
 * A real implementation must use an atomic conditional update or transaction for the increment
 * step and must add idempotency handling before it can be trusted under concurrent/retried
 * requests — this scaffold performs no persistence at all and makes no atomicity guarantee.
 */

import type {
  SimilarityUsageCounterRecord,
  SimilarityUsageSnapshot,
  SimilarityUsageStoreIncrementResult,
  SimilarityUsageStorePolicy,
  SimilarityUsageStoreRole,
  SimilarityUsageStoreSafePolicySummary,
  SimilarityUsageStoreSnapshotResult,
  SimilarityUsageStoreStatus,
  SimilarityUsageStoreSubjectRef,
  SimilarityUsageStoreWindow,
} from './similarityUsageStoreTypes';

/**
 * Builds the default policy: disabled, no real usage store behavior possible. Every call returns
 * a fresh, deterministic object. No environment or secret value is ever read here.
 */
export const buildDefaultSimilarityUsageStorePolicy = (): SimilarityUsageStorePolicy => ({
  enabled: false,
  allowMockedUsageRead: false,
  allowMockedUsageIncrement: false,
  allowRealUsageStore: false,
  allowSupabaseClient: false,
  allowEnvRead: false,
  allowDbRead: false,
  allowDbWrite: false,
  allowSql: false,
  allowCookieRead: false,
  allowHeaderRead: false,
  allowClientClaimedRole: false,
  allowClientClaimedUsage: false,
  allowAnonymousExecution: false,
  allowRouteSuccess: false,
  allowPublicExecution: false,
  allowBetaExecution: false,
  resetTimezone: 'Asia/Seoul',
  notes: [
    'Disabled by default: no real usage store is connected or callable through this policy.',
    'This module never reads process.env, .env, cookies, or request headers.',
    'Real usage store connectivity is a separate, later, explicitly approved phase.',
  ],
});

/**
 * Builds a mocked scaffold policy usable only for smoke/fixture verification. `enabled`,
 * `allowMockedUsageRead`, and `allowMockedUsageIncrement` are true so the mocked snapshot/increment
 * branches can be exercised, but every real-capability boolean remains false — this policy still
 * grants no real usage store capability.
 */
export const buildMockedSimilarityUsageStorePolicy = (): SimilarityUsageStorePolicy => ({
  ...buildDefaultSimilarityUsageStorePolicy(),
  enabled: true,
  allowMockedUsageRead: true,
  allowMockedUsageIncrement: true,
  notes: [
    'Mocked scaffold policy: usable only for smoke/fixture verification against synthetic usage counter records.',
    'Still grants no real usage store capability: allowRealUsageStore, allowSupabaseClient, allowEnvRead,',
    'allowDbRead, allowDbWrite, allowSql, allowCookieRead, allowHeaderRead, allowClientClaimedRole,',
    'allowClientClaimedUsage, allowAnonymousExecution, allowRouteSuccess, allowPublicExecution, and',
    'allowBetaExecution all remain false.',
  ],
});

const toSafePolicySummary = (policy: SimilarityUsageStorePolicy): SimilarityUsageStoreSafePolicySummary => ({
  enabled: policy.enabled,
  allowMockedUsageRead: policy.allowMockedUsageRead,
  allowMockedUsageIncrement: policy.allowMockedUsageIncrement,
  allowRealUsageStore: policy.allowRealUsageStore,
  allowSupabaseClient: policy.allowSupabaseClient,
  allowEnvRead: policy.allowEnvRead,
  allowDbRead: policy.allowDbRead,
  allowDbWrite: policy.allowDbWrite,
  allowSql: policy.allowSql,
  allowCookieRead: policy.allowCookieRead,
  allowHeaderRead: policy.allowHeaderRead,
  allowClientClaimedRole: policy.allowClientClaimedRole,
  allowClientClaimedUsage: policy.allowClientClaimedUsage,
  allowAnonymousExecution: policy.allowAnonymousExecution,
  allowRouteSuccess: policy.allowRouteSuccess,
  allowPublicExecution: policy.allowPublicExecution,
  allowBetaExecution: policy.allowBetaExecution,
  resetTimezone: policy.resetTimezone,
});

// --- Approved role/limit table (Phase 3FC-A baseline) ---------------------------------------------

const APPROVED_DAILY_LIMITS: Record<SimilarityUsageStoreRole, number> = {
  anonymous: 0,
  authenticated: 3,
  beta: 10,
  owner: 50,
  admin: 100,
};

const APPROVED_MONTHLY_LIMITS: Record<SimilarityUsageStoreRole, number> = {
  anonymous: 0,
  authenticated: 30,
  beta: 100,
  owner: 1000,
  admin: 3000,
};

/**
 * Returns the owner-approved daily/monthly limit for a role. This is a pure lookup — it reads no
 * environment value and no database.
 */
export const getApprovedSimilarityUsageLimit = (
  role: SimilarityUsageStoreRole,
  window: SimilarityUsageStoreWindow,
): number => (window === 'daily' ? APPROVED_DAILY_LIMITS[role] : APPROVED_MONTHLY_LIMITS[role]);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const VALID_ROLES = ['anonymous', 'authenticated', 'beta', 'owner', 'admin'] as const;

const isValidRole = (value: unknown): value is SimilarityUsageStoreRole =>
  typeof value === 'string' && (VALID_ROLES as readonly string[]).includes(value);

const ASSIGNABLE_COUNTER_ROLES = ['authenticated', 'beta', 'owner', 'admin'] as const;

const isAssignableCounterRole = (value: unknown): value is Exclude<SimilarityUsageStoreRole, 'anonymous'> =>
  typeof value === 'string' && (ASSIGNABLE_COUNTER_ROLES as readonly string[]).includes(value);

const normalizeSubject = (rawSubject: unknown): SimilarityUsageStoreSubjectRef | null => {
  if (!isPlainObject(rawSubject)) return null;
  if (rawSubject.provider !== 'supabase') return null;
  if (typeof rawSubject.subjectRef !== 'string' || rawSubject.subjectRef.length === 0) return null;
  if (rawSubject.source !== 'mocked-scaffold') return null;
  if (typeof rawSubject.stableForUsageLookup !== 'boolean') return null;
  return {
    provider: 'supabase',
    subjectRef: rawSubject.subjectRef,
    source: 'mocked-scaffold',
    stableForUsageLookup: rawSubject.stableForUsageLookup,
  };
};

const normalizeCounterRecord = (rawRecord: unknown): SimilarityUsageCounterRecord | null => {
  if (!isPlainObject(rawRecord)) return null;
  if (typeof rawRecord.subjectRef !== 'string' || rawRecord.subjectRef.length === 0) return null;
  if (!isAssignableCounterRole(rawRecord.role)) return null;
  if (rawRecord.window !== 'daily' && rawRecord.window !== 'monthly') return null;
  if (typeof rawRecord.used !== 'number' || !Number.isFinite(rawRecord.used)) return null;
  if (typeof rawRecord.limit !== 'number' || !Number.isFinite(rawRecord.limit)) return null;
  if (typeof rawRecord.remaining !== 'number' || !Number.isFinite(rawRecord.remaining)) return null;
  if (typeof rawRecord.resetAtIso !== 'string' || rawRecord.resetAtIso.length === 0) return null;
  if (typeof rawRecord.updatedAtIso !== 'string' || rawRecord.updatedAtIso.length === 0) return null;
  if (rawRecord.source !== 'mocked-counter') return null;
  return {
    subjectRef: rawRecord.subjectRef,
    role: rawRecord.role,
    window: rawRecord.window,
    used: rawRecord.used,
    limit: rawRecord.limit,
    remaining: rawRecord.remaining,
    resetAtIso: rawRecord.resetAtIso,
    updatedAtIso: rawRecord.updatedAtIso,
    source: 'mocked-counter',
  };
};

type NormalizedSimilarityUsageStoreInput = {
  role: SimilarityUsageStoreRole;
  subject: SimilarityUsageStoreSubjectRef | null;
  window: SimilarityUsageStoreWindow;
  mockedCounters: SimilarityUsageCounterRecord[] | null;
  incrementBy: number | null;
  requestRef: string | null;
  currentIso: string | null;
  clientClaimedRole: string | null;
  clientClaimedUsage: unknown;
};

/**
 * Normalizes a caller-supplied input object. Never reads `Request`, cookies, headers, or
 * `process.env` — only the explicit input object is inspected. Malformed input yields `null`; the
 * caller maps that to a safe `invalid_subject`/`invalid_role` status rather than throwing here.
 */
export const normalizeSimilarityUsageStoreInput = (input: unknown): NormalizedSimilarityUsageStoreInput | null => {
  if (!isPlainObject(input)) return null;
  if (!isValidRole(input.role)) return null;
  if (input.window !== 'daily' && input.window !== 'monthly') return null;

  const subject = input.subject === null || input.subject === undefined ? null : normalizeSubject(input.subject);
  if (input.subject !== null && input.subject !== undefined && subject === null) return null;

  let mockedCounters: SimilarityUsageCounterRecord[] | null = null;
  if (Array.isArray(input.mockedCounters)) {
    const normalized: SimilarityUsageCounterRecord[] = [];
    for (const rawRecord of input.mockedCounters) {
      const record = normalizeCounterRecord(rawRecord);
      if (!record) return null;
      normalized.push(record);
    }
    mockedCounters = normalized;
  }

  return {
    role: input.role,
    subject,
    window: input.window,
    mockedCounters,
    incrementBy: typeof input.incrementBy === 'number' ? input.incrementBy : null,
    requestRef: typeof input.requestRef === 'string' ? input.requestRef : null,
    currentIso: typeof input.currentIso === 'string' ? input.currentIso : null,
    clientClaimedRole: typeof input.clientClaimedRole === 'string' ? input.clientClaimedRole : null,
    clientClaimedUsage: input.clientClaimedUsage,
  };
};

const buildSnapshotFallback = (
  status: SimilarityUsageStoreStatus,
  ok: boolean,
  role: SimilarityUsageStoreRole,
  subject: SimilarityUsageStoreSubjectRef | null,
  window: SimilarityUsageStoreWindow,
  usage: SimilarityUsageSnapshot | null,
  policy: SimilarityUsageStorePolicy,
  safeMessage: string,
  warnings: string[],
): SimilarityUsageStoreSnapshotResult => ({
  ok,
  status,
  role,
  subject,
  window,
  usage,
  safeMessage,
  policy: toSafePolicySummary(policy),
  warnings,
});

/**
 * Loads a usage snapshot from an explicit input object. Never reads `Request`, cookies, headers,
 * `process.env`, or a real database. `anonymous` role or a missing subject always blocks. A
 * non-anonymous role with no matching mocked counter falls back to a safe zero-used snapshot at
 * the approved limit; a mismatched counter is ignored for safety.
 */
export const loadSimilarityUsageSnapshot = (
  rawInput: unknown,
  policy: SimilarityUsageStorePolicy = buildDefaultSimilarityUsageStorePolicy(),
): SimilarityUsageStoreSnapshotResult => {
  const warnings: string[] = [];

  if (!isPlainObject(rawInput)) {
    return buildSnapshotFallback(
      'invalid_subject',
      false,
      'anonymous',
      null,
      'daily',
      null,
      policy,
      'The usage store context could not be resolved safely.',
      warnings,
    );
  }

  if (!isValidRole(rawInput.role)) {
    return buildSnapshotFallback(
      'invalid_role',
      false,
      'anonymous',
      null,
      rawInput.window === 'monthly' ? 'monthly' : 'daily',
      null,
      policy,
      'The requested role could not be resolved safely.',
      warnings,
    );
  }

  const input = normalizeSimilarityUsageStoreInput(rawInput);
  if (!input) {
    return buildSnapshotFallback(
      'invalid_subject',
      false,
      rawInput.role,
      null,
      rawInput.window === 'monthly' ? 'monthly' : 'daily',
      null,
      policy,
      'The usage store context could not be resolved safely.',
      warnings,
    );
  }

  if (input.clientClaimedRole || input.clientClaimedUsage !== undefined) {
    warnings.push('client_claim_ignored');
  }

  if (!policy.enabled) {
    return buildSnapshotFallback(
      'disabled',
      false,
      input.role,
      null,
      input.window,
      null,
      policy,
      'Real usage store resolution is disabled by default.',
      warnings,
    );
  }

  if (input.role === 'anonymous' || !input.subject) {
    warnings.push('anonymous_execution_blocked');
    return buildSnapshotFallback(
      'anonymous_blocked',
      false,
      'anonymous',
      null,
      input.window,
      null,
      policy,
      'Anonymous usage is never permitted; no usage snapshot is available.',
      warnings,
    );
  }

  const approvedLimit = getApprovedSimilarityUsageLimit(input.role, input.window);
  const counters = input.mockedCounters ?? [];
  const matching = counters.filter(
    (record) =>
      record.subjectRef === input.subject!.subjectRef && record.role === input.role && record.window === input.window,
  );

  if (matching.length === 0 && counters.length > 0) {
    warnings.push('counter_ignored');
  }

  const used = matching.length > 0 ? Math.max(0, matching[0].used) : 0;
  const limit = approvedLimit;
  const remaining = Math.max(limit - used, 0);
  const isLimitReached = used >= limit;

  const usage: SimilarityUsageSnapshot = {
    role: input.role,
    window: input.window,
    used,
    limit,
    remaining,
    resetAtIso: matching.length > 0 ? matching[0].resetAtIso : input.currentIso ?? '2026-07-05T00:00:00.000+09:00',
    isLimitReached,
    source: matching.length > 0 ? 'mocked-counter' : 'default',
  };

  return {
    ok: true,
    status: isLimitReached ? 'limit_reached' : 'loaded',
    role: input.role,
    subject: input.subject,
    window: input.window,
    usage,
    safeMessage: isLimitReached
      ? 'The approved usage limit has been reached for this role and window.'
      : 'Resolved a mocked usage snapshot for scaffold verification only.',
    policy: toSafePolicySummary(policy),
    warnings,
  };
};

const buildIncrementFallback = (
  snapshotResult: SimilarityUsageStoreSnapshotResult,
  status: SimilarityUsageStoreStatus,
  ok: boolean,
  before: SimilarityUsageSnapshot | null,
  after: SimilarityUsageSnapshot | null,
  safeMessage: string,
  extraWarnings: string[] = [],
): SimilarityUsageStoreIncrementResult => ({
  ok,
  status,
  role: snapshotResult.role,
  subject: snapshotResult.subject,
  window: snapshotResult.window,
  before,
  after,
  event: null,
  safeMessage,
  policy: snapshotResult.policy,
  warnings: [...snapshotResult.warnings, ...extraWarnings],
});

/**
 * Computes a mocked usage increment result from an explicit input object. Never persists anything
 * and never writes a database — this scaffold only computes what a real atomic increment would
 * produce, for fixture/smoke verification. Rejects anonymous execution, a disabled policy, and any
 * increment that is missing, non-integer, non-positive, or would exceed the approved limit.
 */
export const recordSimilarityUsageIncrement = (
  rawInput: unknown,
  policy: SimilarityUsageStorePolicy = buildDefaultSimilarityUsageStorePolicy(),
): SimilarityUsageStoreIncrementResult => {
  const snapshotResult = loadSimilarityUsageSnapshot(rawInput, policy);

  if (snapshotResult.status === 'invalid_subject' || snapshotResult.status === 'invalid_role') {
    return buildIncrementFallback(
      snapshotResult,
      snapshotResult.status,
      false,
      null,
      null,
      'The usage store context could not be resolved safely.',
    );
  }

  if (snapshotResult.status === 'disabled') {
    return buildIncrementFallback(
      snapshotResult,
      'disabled',
      false,
      null,
      null,
      'Real usage store resolution is disabled by default.',
    );
  }

  if (snapshotResult.status === 'anonymous_blocked') {
    return buildIncrementFallback(
      snapshotResult,
      'increment_blocked',
      false,
      null,
      null,
      'Anonymous usage is never permitted; no increment is recorded.',
    );
  }

  const before = snapshotResult.usage;
  if (!before) {
    return buildIncrementFallback(
      snapshotResult,
      'counter_unavailable',
      false,
      null,
      null,
      'A usage snapshot could not be loaded; no increment is recorded.',
    );
  }

  const input = normalizeSimilarityUsageStoreInput(rawInput);
  const incrementBy = input?.incrementBy ?? null;

  if (incrementBy === null || !Number.isInteger(incrementBy) || incrementBy <= 0) {
    return buildIncrementFallback(snapshotResult, 'increment_blocked', false, before, null, 'The requested increment amount is invalid.', [
      'invalid_increment_amount',
    ]);
  }

  if (before.used + incrementBy > before.limit) {
    return buildIncrementFallback(
      snapshotResult,
      'increment_blocked',
      false,
      before,
      null,
      'The approved usage limit would be exceeded by this increment.',
      ['quota_exceeded'],
    );
  }

  const nextUsed = before.used + incrementBy;
  const after: SimilarityUsageSnapshot = {
    role: before.role,
    window: before.window,
    used: nextUsed,
    limit: before.limit,
    remaining: Math.max(before.limit - nextUsed, 0),
    resetAtIso: before.resetAtIso,
    isLimitReached: nextUsed >= before.limit,
    source: before.source,
  };

  const eventRef = input?.requestRef ?? 'mock-usage-event-default-001';
  const occurredAtIso = input?.currentIso ?? '2026-07-05T00:00:00.000+09:00';

  return {
    ok: true,
    status: 'increment_recorded',
    role: snapshotResult.role,
    subject: snapshotResult.subject,
    window: snapshotResult.window,
    before,
    after,
    event: {
      eventRef,
      role: after.role as Exclude<SimilarityUsageStoreRole, 'anonymous'>,
      window: after.window,
      incrementBy,
      occurredAtIso,
      source: 'mocked-event',
      guardStatus: 'allowed',
    },
    safeMessage: 'Computed a mocked usage increment for scaffold verification only. Nothing was persisted.',
    policy: snapshotResult.policy,
    warnings: snapshotResult.warnings,
  };
};

const FORBIDDEN_RESULT_SUBSTRINGS = [
  'accesstoken',
  'refreshtoken',
  'jwt',
  'secret',
  'credential',
  'rawsession',
  'rawpayload',
  'rawkis',
  'account',
  'trading',
  'balance',
  '"source":"live"',
  '"source":"auto"',
];

const collectPrimitiveValues = (value: unknown, out: string[]): void => {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    for (const item of value) collectPrimitiveValues(item, out);
    return;
  }
  if (typeof value === 'object') {
    for (const nested of Object.values(value as Record<string, unknown>)) collectPrimitiveValues(nested, out);
    return;
  }
  out.push(String(value));
};

/**
 * Asserts the result contains no forbidden VALUE. Scans only primitive values (never key names),
 * so a safe policy field name never false-positives against a forbidden substring — only an
 * actual leaked value would trigger it. Intended for test/smoke context; throws only if a
 * forbidden value is detected.
 */
export const assertSimilarityUsageStoreResultIsSafe = (
  result: SimilarityUsageStoreSnapshotResult | SimilarityUsageStoreIncrementResult,
): void => {
  const values: string[] = [];
  collectPrimitiveValues(result, values);
  const haystack = values.join(' ').toLowerCase();
  const found = FORBIDDEN_RESULT_SUBSTRINGS.filter((needle) => haystack.includes(needle));
  if (found.length > 0) {
    throw new Error(`Similarity usage store result is unsafe (found: ${found.join(', ')})`);
  }
};
