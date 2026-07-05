/**
 * Server-only mocked Supabase Auth runtime adapter type foundation for Chart Similarity
 * (Phase 3FD-B-ALT).
 *
 * These types describe a future Supabase Auth runtime adapter shape, proven here only against
 * deterministic mocked fixtures. This module performs no I/O, imports no Supabase package, never
 * reads `process.env`/`import.meta.env`/`.env`, never reads cookies or request headers, and never
 * verifies a real session/JWT. `SimilarityMockedSupabaseUser`/`SimilarityMockedSupabaseSession` are
 * a mocked safe shape only, not a real Supabase session/user — `idRef`/`emailRef` are synthetic
 * references, never a real Supabase user id or email address.
 *
 * This module only maps to the existing Phase 3FC-C auth subject seed shape
 * (`anonymous` | `authenticated`). It never resolves `beta`/`owner`/`admin` — those roles remain
 * the responsibility of the Phase 3FC-D role assignment resolver, per the Phase 3FC-B design.
 *
 * This module must never be imported from client-accessible page or API code in this phase.
 */

export type SimilaritySupabaseAuthRuntimeAdapterStatus =
  | 'disabled'
  | 'mocked_resolved'
  | 'missing_session'
  | 'invalid_session'
  | 'expired_session'
  | 'malformed_session'
  | 'redaction_failed'
  | 'error';

export type SimilaritySupabaseAuthRuntimeAdapterSource = 'mocked-supabase-auth';

export type SimilaritySupabaseAuthRuntimeAdapterPolicy = {
  enabled: boolean;
  allowMockedSession: boolean;
  allowRealSupabaseClient: false;
  allowEnvRead: false;
  allowCookieRead: false;
  allowHeaderRead: false;
  allowJwtVerification: false;
  allowRouteSuccess: false;
  allowClientRoleTrust: false;
  notes: string[];
};

export type SimilaritySupabaseAuthRuntimeAdapterSafePolicySummary = Pick<
  SimilaritySupabaseAuthRuntimeAdapterPolicy,
  | 'enabled'
  | 'allowMockedSession'
  | 'allowRealSupabaseClient'
  | 'allowEnvRead'
  | 'allowCookieRead'
  | 'allowHeaderRead'
  | 'allowJwtVerification'
  | 'allowRouteSuccess'
  | 'allowClientRoleTrust'
>;

export type SimilarityMockedSupabaseUserProviderKind = 'email' | 'oauth' | 'unknown';

export type SimilarityMockedSupabaseUserMetadataKind = 'none' | 'present-redacted';

/**
 * A mocked, safe stand-in for a Supabase user object — never a real Supabase user. `idRef` and
 * `emailRef` must always be synthetic references, never a real Supabase user id or email address.
 */
export type SimilarityMockedSupabaseUser = {
  idRef: string;
  emailRef?: string | null;
  providerKind?: SimilarityMockedSupabaseUserProviderKind;
  metadataKind?: SimilarityMockedSupabaseUserMetadataKind;
  roleClaim?: unknown;
  createdAtIso?: string;
};

export type SimilarityMockedSupabaseSessionState = 'missing' | 'valid' | 'invalid' | 'expired' | 'malformed';

export type SimilarityMockedSupabaseSessionTokenShape = 'absent' | 'present-redacted' | 'malformed-redacted';

/**
 * A mocked, safe stand-in for a Supabase session — never a real session. Never carries an access
 * token, refresh token, or JWT value; `tokenShape` records only a redacted shape indicator.
 */
export type SimilarityMockedSupabaseSession = {
  state: SimilarityMockedSupabaseSessionState;
  user?: SimilarityMockedSupabaseUser | null;
  expiresAtIso?: string | null;
  tokenShape?: SimilarityMockedSupabaseSessionTokenShape;
};

export type SimilaritySupabaseAuthRuntimeAdapterRequestedRuntime = 'auth-subject-resolution';

export type SimilaritySupabaseAuthRuntimeAdapterInput = {
  mockedSession?: SimilarityMockedSupabaseSession | null;
  currentIso?: string | null;
  requestedRuntime?: SimilaritySupabaseAuthRuntimeAdapterRequestedRuntime | null;
  clientClaimedRole?: unknown;
};

export type SimilaritySupabaseAuthRuntimeAdapterAuthState = 'anonymous' | 'authenticated';

export type SimilaritySupabaseAuthRuntimeAdapterRoleSeed = 'anonymous' | 'authenticated';

export type SimilaritySupabaseAuthRuntimeAdapterSubject = {
  state: SimilaritySupabaseAuthRuntimeAdapterAuthState;
  subjectRef: string | null;
  providerKind: SimilarityMockedSupabaseUserProviderKind | null;
  roleSeed: SimilaritySupabaseAuthRuntimeAdapterRoleSeed;
  safeWarnings: string[];
};

export type SimilaritySupabaseAuthRuntimeAdapterResult = {
  ok: boolean;
  status: SimilaritySupabaseAuthRuntimeAdapterStatus;
  source: SimilaritySupabaseAuthRuntimeAdapterSource | 'disabled';
  subject: SimilaritySupabaseAuthRuntimeAdapterSubject;
  safeMessage: string;
  warnings: string[];
  policy: SimilaritySupabaseAuthRuntimeAdapterSafePolicySummary;
};

/**
 * A safe seed shape compatible with the Phase 3FC-C auth subject resolver's expectations
 * (`authState`/`roleSeed` of `'anonymous' | 'authenticated'` only, no raw id/email/token fields).
 */
export type SimilaritySupabaseAuthRuntimeAdapterSubjectSeed = {
  authState: SimilaritySupabaseAuthRuntimeAdapterAuthState;
  roleSeed: SimilaritySupabaseAuthRuntimeAdapterRoleSeed;
  subjectRef: string | null;
};
