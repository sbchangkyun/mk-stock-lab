/**
 * Server-only role assignment resolver scaffold for Chart Similarity (Phase 3FC-D).
 *
 * This module is a disabled-by-default scaffold only. It never imports a Supabase package, never
 * calls a real Supabase client, never reads `process.env`/`.env`, never reads cookies or request
 * headers, and never reads a real role database. It only maps an explicit, caller-supplied input
 * object (a resolved auth subject plus deterministic mocked role assignment records, used solely
 * for fixture/smoke verification) to a safe resolver result.
 *
 * `beta`, `owner`, and `admin` may only be produced from an explicit, matching, active assignment
 * record. A valid session alone never grants these roles, and a client-claimed role or subject is
 * always ignored and never influences the result — it only produces a warning.
 */

import type {
  SimilarityRoleAssignmentRecord,
  SimilarityRoleAssignmentResolverInput,
  SimilarityRoleAssignmentResolverPolicy,
  SimilarityRoleAssignmentResolverResult,
  SimilarityRoleAssignmentResolverSafePolicySummary,
  SimilarityRoleAssignmentSubjectRef,
} from './similarityRoleAssignmentResolverTypes';

/**
 * Builds the default policy: disabled, no real role store behavior possible. Every call returns a
 * fresh, deterministic object. No environment or secret value is ever read here.
 */
export const buildDefaultSimilarityRoleAssignmentResolverPolicy = (): SimilarityRoleAssignmentResolverPolicy => ({
  enabled: false,
  allowRealRoleStore: false,
  allowSupabaseClient: false,
  allowEnvRead: false,
  allowDbRead: false,
  allowCookieRead: false,
  allowHeaderRead: false,
  allowClientClaimedRole: false,
  allowClientClaimedSubject: false,
  allowAnonymousExecution: false,
  allowOwnerAdminBypassWithoutAssignment: false,
  allowRouteSuccess: false,
  allowPublicExecution: false,
  allowBetaExecution: false,
  notes: [
    'Disabled by default: no real role assignment store is connected or callable through this policy.',
    'This module never reads process.env, .env, cookies, or request headers.',
    'Real role assignment lookup is a separate, later, explicitly approved phase.',
  ],
});

/**
 * Builds a mocked scaffold policy usable only for smoke/fixture verification. `enabled` is true so
 * the mocked assignment branches can be exercised, but every real-capability boolean remains
 * false — this policy still grants no real role store capability, and never allows an owner/admin
 * bypass without an explicit assignment record.
 */
export const buildMockedSimilarityRoleAssignmentResolverPolicy = (): SimilarityRoleAssignmentResolverPolicy => ({
  ...buildDefaultSimilarityRoleAssignmentResolverPolicy(),
  enabled: true,
  notes: [
    'Mocked scaffold policy: usable only for smoke/fixture verification against synthetic role assignment records.',
    'Still grants no real role store capability: allowRealRoleStore, allowSupabaseClient, allowEnvRead, allowDbRead,',
    'allowCookieRead, allowHeaderRead, allowClientClaimedRole, allowClientClaimedSubject, allowAnonymousExecution,',
    'allowOwnerAdminBypassWithoutAssignment, allowRouteSuccess, allowPublicExecution, and allowBetaExecution all',
    'remain false.',
  ],
});

const toSafePolicySummary = (
  policy: SimilarityRoleAssignmentResolverPolicy,
): SimilarityRoleAssignmentResolverSafePolicySummary => ({
  enabled: policy.enabled,
  allowRealRoleStore: policy.allowRealRoleStore,
  allowSupabaseClient: policy.allowSupabaseClient,
  allowEnvRead: policy.allowEnvRead,
  allowDbRead: policy.allowDbRead,
  allowCookieRead: policy.allowCookieRead,
  allowHeaderRead: policy.allowHeaderRead,
  allowClientClaimedRole: policy.allowClientClaimedRole,
  allowClientClaimedSubject: policy.allowClientClaimedSubject,
  allowAnonymousExecution: policy.allowAnonymousExecution,
  allowOwnerAdminBypassWithoutAssignment: policy.allowOwnerAdminBypassWithoutAssignment,
  allowRouteSuccess: policy.allowRouteSuccess,
  allowPublicExecution: policy.allowPublicExecution,
  allowBetaExecution: policy.allowBetaExecution,
});

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const ASSIGNABLE_ROLES = ['beta', 'owner', 'admin'] as const;

const isAssignableRole = (value: unknown): value is 'beta' | 'owner' | 'admin' =>
  typeof value === 'string' && (ASSIGNABLE_ROLES as readonly string[]).includes(value);

const normalizeSubject = (rawSubject: unknown): SimilarityRoleAssignmentSubjectRef | null => {
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

const normalizeAssignmentRecord = (rawRecord: unknown): SimilarityRoleAssignmentRecord | null => {
  if (!isPlainObject(rawRecord)) return null;
  if (typeof rawRecord.subjectRef !== 'string' || rawRecord.subjectRef.length === 0) return null;
  if (!isAssignableRole(rawRecord.role)) return null;
  if (typeof rawRecord.assignedAtIso !== 'string' || rawRecord.assignedAtIso.length === 0) return null;
  if (typeof rawRecord.assignedByRef !== 'string' || rawRecord.assignedByRef.length === 0) return null;
  if (rawRecord.source !== 'mocked-assignment') return null;
  if (typeof rawRecord.active !== 'boolean') return null;
  return {
    subjectRef: rawRecord.subjectRef,
    role: rawRecord.role,
    assignedAtIso: rawRecord.assignedAtIso,
    assignedByRef: rawRecord.assignedByRef,
    source: 'mocked-assignment',
    active: rawRecord.active,
  };
};

/**
 * Normalizes a caller-supplied input object. Never reads `Request`, cookies, headers, or
 * `process.env` — only the explicit input object is inspected. Malformed input is treated as
 * `invalid_subject`/`invalid_assignment` by the caller rather than thrown here.
 */
export const normalizeSimilarityRoleAssignmentResolverInput = (
  input: unknown,
): SimilarityRoleAssignmentResolverInput | null => {
  if (!isPlainObject(input)) return null;
  if (input.authState !== 'anonymous' && input.authState !== 'authenticated') return null;
  if (input.roleSeed !== 'anonymous' && input.roleSeed !== 'authenticated') return null;

  const subject = input.subject === null ? null : normalizeSubject(input.subject);
  if (input.subject !== null && subject === null) return null;

  let mockedAssignments: SimilarityRoleAssignmentRecord[] | null = null;
  if (Array.isArray(input.mockedAssignments)) {
    const normalized: SimilarityRoleAssignmentRecord[] = [];
    for (const rawRecord of input.mockedAssignments) {
      const record = normalizeAssignmentRecord(rawRecord);
      if (!record) return null;
      normalized.push(record);
    }
    mockedAssignments = normalized;
  }

  return {
    authState: input.authState,
    roleSeed: input.roleSeed,
    subject,
    clientClaimedRole: typeof input.clientClaimedRole === 'string' ? input.clientClaimedRole : null,
    clientClaimedSubject: typeof input.clientClaimedSubject === 'string' ? input.clientClaimedSubject : null,
    mockedAssignments,
  };
};

const buildFallbackResult = (
  status: SimilarityRoleAssignmentResolverResult['status'],
  ok: boolean,
  role: SimilarityRoleAssignmentResolverResult['role'],
  roleSource: SimilarityRoleAssignmentResolverResult['roleSource'],
  subject: SimilarityRoleAssignmentSubjectRef | null,
  policy: SimilarityRoleAssignmentResolverPolicy,
  safeMessage: string,
  warnings: string[],
): SimilarityRoleAssignmentResolverResult => ({
  ok,
  status,
  role,
  roleSource,
  subject,
  assignment: null,
  safeMessage,
  policy: toSafePolicySummary(policy),
  warnings,
});

/**
 * Resolves a full role from an explicit input object. Never reads `Request`, cookies, headers, or
 * `process.env`. Never trusts a client-claimed role or subject — both are ignored and recorded
 * only as a safe warning. `beta`/`owner`/`admin` are produced only from an explicit, matching,
 * active assignment record; a valid session alone never grants these roles.
 */
export const resolveSimilarityRoleAssignment = (
  rawInput: unknown,
  policy: SimilarityRoleAssignmentResolverPolicy = buildDefaultSimilarityRoleAssignmentResolverPolicy(),
): SimilarityRoleAssignmentResolverResult => {
  const warnings: string[] = [];

  const input = normalizeSimilarityRoleAssignmentResolverInput(rawInput);
  if (!input) {
    return buildFallbackResult(
      'invalid_subject',
      false,
      'anonymous',
      'default',
      null,
      policy,
      'The role assignment context could not be resolved safely.',
      warnings,
    );
  }

  if (input.clientClaimedRole || input.clientClaimedSubject) {
    warnings.push('client_claim_ignored');
  }

  if (!policy.enabled) {
    return buildFallbackResult(
      'disabled',
      false,
      'anonymous',
      'default',
      null,
      policy,
      'Real role assignment resolution is disabled by default.',
      warnings,
    );
  }

  if (input.authState === 'anonymous' || input.roleSeed === 'anonymous' || !input.subject) {
    return buildFallbackResult(
      'anonymous',
      false,
      'anonymous',
      'default',
      null,
      policy,
      'No authenticated subject was presented; treated as anonymous.',
      warnings,
    );
  }

  const subject = input.subject;
  const assignments = input.mockedAssignments ?? [];
  const activeMatching = assignments.filter((record) => record.subjectRef === subject.subjectRef && record.active);

  if (activeMatching.length === 0) {
    const hasInactiveOrMismatched = assignments.length > 0;
    if (hasInactiveOrMismatched) warnings.push('assignment_ignored');
    return buildFallbackResult(
      'default_authenticated',
      true,
      'authenticated',
      'default',
      subject,
      policy,
      'Resolved a default authenticated role; no active role assignment record matched.',
      warnings,
    );
  }

  if (activeMatching.length > 1) {
    warnings.push('multiple_assignments_ignored');
    return buildFallbackResult(
      'default_authenticated',
      true,
      'authenticated',
      'default',
      subject,
      policy,
      'Resolved a default authenticated role; multiple active assignment records matched and were ignored for safety.',
      warnings,
    );
  }

  const matched = activeMatching[0];

  return {
    ok: true,
    status: 'assigned',
    role: matched.role,
    roleSource: 'mocked-assignment',
    subject,
    assignment: {
      role: matched.role,
      assignedAtIso: matched.assignedAtIso,
      assignedByRef: matched.assignedByRef,
      source: matched.source,
    },
    safeMessage: 'Resolved a mocked role assignment for scaffold verification only.',
    policy: toSafePolicySummary(policy),
    warnings,
  };
};

const FORBIDDEN_RESULT_SUBSTRINGS = [
  'accesstoken',
  'refreshtoken',
  'jwt',
  'secret',
  'credential',
  'rawsession',
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
export const assertSimilarityRoleAssignmentResolverResultIsSafe = (
  result: SimilarityRoleAssignmentResolverResult,
): void => {
  const values: string[] = [];
  collectPrimitiveValues(result, values);
  const haystack = values.join(' ').toLowerCase();
  const found = FORBIDDEN_RESULT_SUBSTRINGS.filter((needle) => haystack.includes(needle));
  if (found.length > 0) {
    throw new Error(`Similarity role assignment resolver result is unsafe (found: ${found.join(', ')})`);
  }
};
