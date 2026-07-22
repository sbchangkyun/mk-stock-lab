/**
 * Server-only real-compatible Supabase Auth subject resolver type foundation for Chart Similarity
 * (Phase 3FD-B).
 *
 * These types describe a future real Supabase Auth subject resolver, proven here only against an
 * injected Supabase-compatible auth client interface and deterministic mocked clients. This module
 * performs no I/O itself: it never creates a real Supabase client, never imports `@supabase/*`,
 * never reads `process.env`/`import.meta.env`/`.env`, never reads cookies or request headers, and
 * never verifies a real session or JWT. `SimilaritySupabaseCompatibleAuthClient` models the future
 * injected boundary shape only — it is not a real Supabase SDK type, and no real implementation of
 * it is created or called in this phase.
 *
 * This module only maps to the existing Phase 3FC-C auth subject seed shape
 * (`anonymous` | `authenticated`). It never resolves `beta`/`owner`/`admin` — those roles remain
 * the responsibility of the Phase 3FC-D role assignment resolver, per the Phase 3FC-B design.
 *
 * This module must never be imported from client-accessible page or API code in this phase.
 */

export type SimilarityRealSupabaseAuthSubjectResolverStatus =
  | 'disabled'
  | 'resolved'
  | 'missing_session'
  | 'invalid_session'
  | 'expired_session'
  | 'malformed_session'
  | 'client_unavailable'
  | 'redaction_failed'
  | 'error';

export type SimilarityRealSupabaseAuthSubjectResolverSource = 'injected-supabase-compatible-client' | 'disabled';

export type SimilarityRealSupabaseAuthSubjectResolverPolicy = {
  enabled: boolean;
  allowInjectedSupabaseCompatibleClient: boolean;
  allowRealSupabaseClientCreation: false;
  allowEnvRead: false;
  allowCookieRead: false;
  allowHeaderRead: false;
  allowJwtVerification: false;
  allowRouteSuccess: false;
  allowClientRoleTrust: false;
  allowRawSessionEcho: false;
  allowRawUserEcho: false;
  notes: string[];
};

export type SimilarityRealSupabaseAuthSubjectResolverSafePolicySummary = Pick<
  SimilarityRealSupabaseAuthSubjectResolverPolicy,
  | 'enabled'
  | 'allowInjectedSupabaseCompatibleClient'
  | 'allowRealSupabaseClientCreation'
  | 'allowEnvRead'
  | 'allowCookieRead'
  | 'allowHeaderRead'
  | 'allowJwtVerification'
  | 'allowRouteSuccess'
  | 'allowClientRoleTrust'
  | 'allowRawSessionEcho'
  | 'allowRawUserEcho'
>;

export type SimilaritySupabaseCompatibleGetUserInput = {
  /** A redacted reference to session evidence — never a real token value. */
  sessionEvidenceRef: string;
  tokenShape?: 'absent' | 'present-redacted' | 'malformed-redacted';
  requestedAtIso?: string | null;
};

export type SimilaritySupabaseCompatibleUserProviderKind = 'email' | 'oauth' | 'unknown';

export type SimilaritySupabaseCompatibleUserMetadataKind = 'none' | 'present-redacted';

/**
 * A safe stand-in for a Supabase-compatible user object — never a real Supabase user. `userRef`
 * must always be synthetic or internally redacted, never a real Supabase user id or email address.
 */
export type SimilaritySupabaseCompatibleUser = {
  userRef: string;
  providerKind?: SimilaritySupabaseCompatibleUserProviderKind;
  metadataKind?: SimilaritySupabaseCompatibleUserMetadataKind;
  clientRoleClaim?: unknown;
  safeCreatedAtIso?: string | null;
};

export type SimilaritySupabaseCompatibleGetUserStatus =
  | 'ok'
  | 'missing_session'
  | 'invalid_session'
  | 'expired_session'
  | 'malformed_session'
  | 'client_error';

export type SimilaritySupabaseCompatibleErrorCategory = 'none' | 'auth' | 'network' | 'config' | 'unknown';

export type SimilaritySupabaseCompatibleGetUserResult = {
  status: SimilaritySupabaseCompatibleGetUserStatus;
  user?: SimilaritySupabaseCompatibleUser | null;
  errorCategory?: SimilaritySupabaseCompatibleErrorCategory;
  safeMessage?: string;
};

/**
 * Models the future injected Supabase-compatible auth client boundary. This module never
 * implements or instantiates a real client of this shape — a real implementation of this
 * interface, and its wiring, remain a later, separately approved phase.
 */
export type SimilaritySupabaseCompatibleAuthClient = {
  getUser(input: SimilaritySupabaseCompatibleGetUserInput): Promise<SimilaritySupabaseCompatibleGetUserResult>;
};

export type SimilarityRealSupabaseAuthSubjectResolverRequestedRuntime = 'auth-subject-resolution';

export type SimilarityRealSupabaseAuthSubjectResolverInput = {
  sessionEvidenceRef?: string | null;
  tokenShape?: 'absent' | 'present-redacted' | 'malformed-redacted' | null;
  currentIso?: string | null;
  requestedRuntime?: SimilarityRealSupabaseAuthSubjectResolverRequestedRuntime | null;
  clientClaimedRole?: unknown;
};

export type SimilarityRealSupabaseAuthSubjectResolverDeps = {
  authClient?: SimilaritySupabaseCompatibleAuthClient | null;
};

export type SimilarityRealSupabaseAuthSubjectResolverAuthState = 'anonymous' | 'authenticated';

export type SimilarityRealSupabaseAuthSubjectResolverRoleSeed = 'anonymous' | 'authenticated';

export type SimilarityRealSupabaseAuthSubject = {
  state: SimilarityRealSupabaseAuthSubjectResolverAuthState;
  subjectRef: string | null;
  providerKind: SimilaritySupabaseCompatibleUserProviderKind | null;
  roleSeed: SimilarityRealSupabaseAuthSubjectResolverRoleSeed;
  safeWarnings: string[];
};

export type SimilarityRealSupabaseAuthSubjectResolverResult = {
  ok: boolean;
  status: SimilarityRealSupabaseAuthSubjectResolverStatus;
  source: SimilarityRealSupabaseAuthSubjectResolverSource;
  subject: SimilarityRealSupabaseAuthSubject;
  safeMessage: string;
  warnings: string[];
  policy: SimilarityRealSupabaseAuthSubjectResolverSafePolicySummary;
};

/**
 * A safe seed shape compatible with the Phase 3FC-C auth subject resolver's expectations
 * (`authState`/`roleSeed` of `'anonymous' | 'authenticated'` only, no raw id/email/token fields).
 */
export type SimilarityRealSupabaseAuthSubjectResolverSubjectSeed = {
  authState: SimilarityRealSupabaseAuthSubjectResolverAuthState;
  roleSeed: SimilarityRealSupabaseAuthSubjectResolverRoleSeed;
  subjectRef: string | null;
};
