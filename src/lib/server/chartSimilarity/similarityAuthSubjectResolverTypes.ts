/**
 * Server-only Supabase Auth subject resolver type foundation for Chart Similarity (Phase 3FC-C).
 *
 * These types describe a future resolver that will turn a real Supabase session into an internal
 * auth subject reference, disabled by default. They are decoupled from any real session/token
 * data: no access token, no refresh token, no JWT, no raw session payload, no cookie/header value,
 * no environment value, no account/trading/balance field. This file defines shapes only — it
 * performs no I/O, calls no auth provider, and touches no database.
 *
 * This module only resolves the auth subject and a default role seed (`anonymous` or
 * `authenticated`). It never resolves `beta`/`owner`/`admin` — those roles belong to a later role
 * assignment resolver phase (Phase 3FC-D), per the Phase 3FC-B design.
 *
 * This module must never be imported from client-accessible page or API code in this phase.
 */

export type SimilarityAuthSubjectProvider = 'supabase';

export type SimilarityAuthSubjectResolverStatus =
  | 'disabled'
  | 'anonymous'
  | 'authenticated'
  | 'invalid_context'
  | 'not_configured'
  | 'error';

export type SimilarityAuthSubjectAuthState = 'anonymous' | 'authenticated';

export type SimilarityAuthSubjectRoleSeed = 'anonymous' | 'authenticated';

export type SimilarityAuthSubjectResolverMode = 'disabled-scaffold' | 'mocked-scaffold';

export type SimilarityAuthSubjectMockSessionCandidateState = 'missing' | 'valid' | 'invalid';

export type SimilarityAuthSubjectMockSessionCandidate = {
  kind: 'mock-supabase-session';
  state: SimilarityAuthSubjectMockSessionCandidateState;
  subjectRef?: string;
  emailVerified?: boolean;
};

export type SimilarityAuthSubjectSafeRef = {
  provider: SimilarityAuthSubjectProvider;
  subjectRef: string;
  source: 'mocked-scaffold';
  stableForUsageLookup: boolean;
};

export type SimilarityAuthSubjectResolverInput = {
  provider: SimilarityAuthSubjectProvider;
  mode: SimilarityAuthSubjectResolverMode;
  serverSessionCandidate?: SimilarityAuthSubjectMockSessionCandidate | null;
  clientClaimedRole?: string | null;
  clientClaimedSubject?: string | null;
};

export type SimilarityAuthSubjectResolverPolicy = {
  enabled: boolean;
  provider: SimilarityAuthSubjectProvider;
  allowRealSupabaseClient: false;
  allowEnvRead: false;
  allowCookieRead: false;
  allowHeaderRead: false;
  allowClientClaimedSubject: false;
  allowClientClaimedRole: false;
  allowTokenEcho: false;
  allowRawSessionEcho: false;
  allowRouteSuccess: false;
  allowPublicExecution: false;
  allowBetaExecution: false;
  notes: string[];
};

export type SimilarityAuthSubjectResolverSafePolicySummary = Pick<
  SimilarityAuthSubjectResolverPolicy,
  | 'enabled'
  | 'provider'
  | 'allowRealSupabaseClient'
  | 'allowEnvRead'
  | 'allowCookieRead'
  | 'allowHeaderRead'
  | 'allowClientClaimedSubject'
  | 'allowClientClaimedRole'
  | 'allowTokenEcho'
  | 'allowRawSessionEcho'
  | 'allowRouteSuccess'
  | 'allowPublicExecution'
  | 'allowBetaExecution'
>;

export type SimilarityAuthSubjectResolverResult = {
  ok: boolean;
  status: SimilarityAuthSubjectResolverStatus;
  authState: SimilarityAuthSubjectAuthState;
  roleSeed: SimilarityAuthSubjectRoleSeed;
  subject: SimilarityAuthSubjectSafeRef | null;
  safeMessage: string;
  policy: SimilarityAuthSubjectResolverSafePolicySummary;
  warnings: string[];
};
