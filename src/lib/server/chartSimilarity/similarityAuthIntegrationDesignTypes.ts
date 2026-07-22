/**
 * Server-only real-auth integration design type foundation for Chart Similarity execution
 * (Phase 3EZ-A).
 *
 * These types describe a future, provider-agnostic mapping between a real authenticated subject
 * and the existing `SimilarityExecutionGuardRequest` (Phase 3EY-C). This file is design/foundation
 * only: it defines shapes and safe mocked builders, but it implements no real auth, imports no
 * auth provider, reads no cookies/headers/session/localStorage/sessionStorage, and performs no
 * I/O. No session token, no access token, no refresh token, no provider token, no email, no IP
 * address, no raw auth provider payload, no request headers, no cookies, no KIS credentials, and
 * no account/trading fields are represented anywhere in these types.
 *
 * This module must never be imported from client-accessible page or API code in this phase.
 */

export type SimilarityAuthProviderKind = 'none' | 'supabase' | 'custom' | 'external';

export type SimilarityAuthIntegrationStatus =
  | 'design_only'
  | 'not_configured'
  | 'provider_required'
  | 'role_mapping_required'
  | 'ready_for_route_design'
  | 'blocked';

export type SimilarityAuthSubjectKind = 'anonymous' | 'user' | 'beta_user' | 'owner' | 'admin';

export type SimilarityAuthSubject = {
  kind: SimilarityAuthSubjectKind;
  stableSubjectId: string | null;
  displayRole: 'anonymous' | 'authenticated' | 'beta' | 'owner' | 'admin';
  isAuthenticated: boolean;
  isOwner: boolean;
  isAdmin: boolean;
};

export type SimilarityAuthRoleMappingPolicy = {
  providerKind: SimilarityAuthProviderKind;
  defaultAuthenticatedRole: 'authenticated';
  betaRoleSource: 'manual_allowlist' | 'future_db_claim' | 'not_configured';
  ownerRoleSource: 'manual_allowlist' | 'future_env_claim' | 'not_configured';
  adminRoleSource: 'manual_allowlist' | 'future_db_claim' | 'not_configured';
  allowAnonymousMockedPreview: boolean;
  allowPublicKisExecution: false;
  notes: string[];
};

export type SimilarityAuthIntegrationDesignResult = {
  status: SimilarityAuthIntegrationStatus;
  providerKind: SimilarityAuthProviderKind;
  subject: SimilarityAuthSubject;
  guardRole: 'anonymous' | 'authenticated' | 'beta' | 'owner' | 'admin';
  guardAuthState: 'missing' | 'anonymous' | 'authenticated' | 'owner' | 'admin';
  warnings: string[];
  safeMessage: string;
};
