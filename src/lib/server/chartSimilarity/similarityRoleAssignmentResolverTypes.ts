/**
 * Server-only role assignment resolver type contract for Chart Similarity (Phase 3FC-D).
 *
 * These types describe a disabled-by-default scaffold that maps a resolved auth subject (Phase
 * 3FC-C's `SimilarityAuthSubjectSafeRef`) plus deterministic mocked role assignment fixtures to a
 * full `beta | owner | admin`-capable role result. `beta`, `owner`, and `admin` may only be
 * produced from an explicit, matching, active assignment record — never as a fallback, never from
 * a client claim, and never without an assignment. This file defines shapes only: no I/O, no
 * Supabase call, no DB read, no `process.env` read.
 */

export type SimilarityRoleAssignmentRole = 'anonymous' | 'authenticated' | 'beta' | 'owner' | 'admin';

export type SimilarityRoleAssignmentResolverStatus =
  | 'disabled'
  | 'anonymous'
  | 'default_authenticated'
  | 'assigned'
  | 'invalid_subject'
  | 'invalid_assignment'
  | 'not_configured'
  | 'error';

export type SimilarityRoleAssignmentSource = 'default' | 'mocked-assignment';

/**
 * Structurally compatible with Phase 3FC-C's `SimilarityAuthSubjectSafeRef`. No token, no raw
 * session payload, no account/trading/balance field.
 */
export type SimilarityRoleAssignmentSubjectRef = {
  provider: 'supabase';
  subjectRef: string;
  source: 'mocked-scaffold';
  stableForUsageLookup: boolean;
};

/**
 * Only `beta`, `owner`, and `admin` are assignable records. `anonymous`/`authenticated` are
 * resolver fallback roles, never stored assignment records.
 */
export type SimilarityRoleAssignmentRecord = {
  subjectRef: string;
  role: Exclude<SimilarityRoleAssignmentRole, 'anonymous' | 'authenticated'>;
  assignedAtIso: string;
  assignedByRef: string;
  source: 'mocked-assignment';
  active: boolean;
};

export type SimilarityRoleAssignmentResolverInput = {
  authState: 'anonymous' | 'authenticated';
  roleSeed: 'anonymous' | 'authenticated';
  subject: SimilarityRoleAssignmentSubjectRef | null;
  clientClaimedRole?: string | null;
  clientClaimedSubject?: string | null;
  mockedAssignments?: SimilarityRoleAssignmentRecord[] | null;
};

export type SimilarityRoleAssignmentResolverPolicy = {
  enabled: boolean;
  allowRealRoleStore: false;
  allowSupabaseClient: false;
  allowEnvRead: false;
  allowDbRead: false;
  allowCookieRead: false;
  allowHeaderRead: false;
  allowClientClaimedRole: false;
  allowClientClaimedSubject: false;
  allowAnonymousExecution: false;
  allowOwnerAdminBypassWithoutAssignment: false;
  allowRouteSuccess: false;
  allowPublicExecution: false;
  allowBetaExecution: false;
  notes: string[];
};

export type SimilarityRoleAssignmentResolverSafePolicySummary = Pick<
  SimilarityRoleAssignmentResolverPolicy,
  | 'enabled'
  | 'allowRealRoleStore'
  | 'allowSupabaseClient'
  | 'allowEnvRead'
  | 'allowDbRead'
  | 'allowCookieRead'
  | 'allowHeaderRead'
  | 'allowClientClaimedRole'
  | 'allowClientClaimedSubject'
  | 'allowAnonymousExecution'
  | 'allowOwnerAdminBypassWithoutAssignment'
  | 'allowRouteSuccess'
  | 'allowPublicExecution'
  | 'allowBetaExecution'
>;

export type SimilarityRoleAssignmentResolverResult = {
  ok: boolean;
  status: SimilarityRoleAssignmentResolverStatus;
  role: SimilarityRoleAssignmentRole;
  roleSource: SimilarityRoleAssignmentSource;
  subject: SimilarityRoleAssignmentSubjectRef | null;
  assignment: Pick<SimilarityRoleAssignmentRecord, 'role' | 'assignedAtIso' | 'assignedByRef' | 'source'> | null;
  safeMessage: string;
  policy: SimilarityRoleAssignmentResolverSafePolicySummary;
  warnings: string[];
};
