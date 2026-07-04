/**
 * Server-only real-auth integration design module for Chart Similarity execution (Phase 3EZ-A).
 *
 * This module is design/foundation only. It defines a provider-agnostic default role mapping
 * policy, mocked/synthetic auth subject builders, and pure mapping functions from an auth subject
 * to the existing `SimilarityExecutionGuardRequest` (Phase 3EY-C) shape. It never imports a real
 * auth provider (Supabase, Auth0, OAuth, NextAuth, or any other), never reads cookies, headers,
 * `localStorage`/`sessionStorage`, `process.env`, or `.env`, never performs a network call, and
 * never persists anything. It never throws for the expected design inputs handled here.
 *
 * `SimilarityApiResponse` (Phase 3EY-D) intentionally continues to drop `userId`, `role`, and
 * `authState` from any API-facing payload — `buildGuardRequestFromAuthDesign` below only places
 * `stableSubjectId` into the guard request's `userId` field for internal guard evaluation, and
 * that guard request is never itself the API response.
 */

import type {
  SimilarityAuthIntegrationDesignResult,
  SimilarityAuthIntegrationStatus,
  SimilarityAuthProviderKind,
  SimilarityAuthRoleMappingPolicy,
  SimilarityAuthSubject,
} from './similarityAuthIntegrationDesignTypes';
import type {
  SimilarityExecutionAuthState,
  SimilarityExecutionGuardRequest,
  SimilarityExecutionRole,
  SimilarityExecutionSource,
} from './similarityExecutionGuardTypes';

/** Builds the default, provider-agnostic role mapping policy. No provider is chosen or activated. */
export const buildDefaultSimilarityAuthRoleMappingPolicy = (): SimilarityAuthRoleMappingPolicy => ({
  providerKind: 'none',
  defaultAuthenticatedRole: 'authenticated',
  betaRoleSource: 'not_configured',
  ownerRoleSource: 'not_configured',
  adminRoleSource: 'not_configured',
  allowAnonymousMockedPreview: true,
  allowPublicKisExecution: false,
  notes: [
    'No real auth provider is chosen or activated in this phase.',
    'Beta/owner/admin role sources remain not_configured until a separately approved phase defines them.',
    'This policy module never reads process.env or .env values.',
  ],
});

export const buildAnonymousSimilarityAuthSubject = (): SimilarityAuthSubject => ({
  kind: 'anonymous',
  stableSubjectId: null,
  displayRole: 'anonymous',
  isAuthenticated: false,
  isOwner: false,
  isAdmin: false,
});

export const buildMockedAuthenticatedSimilarityAuthSubject = (): SimilarityAuthSubject => ({
  kind: 'user',
  stableSubjectId: 'mock-auth-subject',
  displayRole: 'authenticated',
  isAuthenticated: true,
  isOwner: false,
  isAdmin: false,
});

export const buildMockedBetaSimilarityAuthSubject = (): SimilarityAuthSubject => ({
  kind: 'beta_user',
  stableSubjectId: 'mock-beta-subject',
  displayRole: 'beta',
  isAuthenticated: true,
  isOwner: false,
  isAdmin: false,
});

export const buildMockedOwnerSimilarityAuthSubject = (): SimilarityAuthSubject => ({
  kind: 'owner',
  stableSubjectId: 'mock-owner-subject',
  displayRole: 'owner',
  isAuthenticated: true,
  isOwner: true,
  isAdmin: false,
});

export const buildMockedAdminSimilarityAuthSubject = (): SimilarityAuthSubject => ({
  kind: 'admin',
  stableSubjectId: 'mock-admin-subject',
  displayRole: 'admin',
  isAuthenticated: true,
  isOwner: false,
  isAdmin: true,
});

/** Pure mapping from an auth subject kind to the guard's execution role. Never throws. */
export const mapAuthSubjectToGuardRole = (subject: SimilarityAuthSubject): SimilarityExecutionRole => {
  switch (subject.kind) {
    case 'admin':
      return 'admin';
    case 'owner':
      return 'owner';
    case 'beta_user':
      return 'beta';
    case 'user':
      return 'authenticated';
    case 'anonymous':
    default:
      return 'anonymous';
  }
};

/** Pure mapping from an auth subject kind to the guard's auth state. Never throws. */
export const mapAuthSubjectToGuardAuthState = (subject: SimilarityAuthSubject): SimilarityExecutionAuthState => {
  switch (subject.kind) {
    case 'admin':
      return 'admin';
    case 'owner':
      return 'owner';
    case 'beta_user':
    case 'user':
      return 'authenticated';
    case 'anonymous':
    default:
      return 'missing';
  }
};

const resolveStatusForSubject = (subject: SimilarityAuthSubject): SimilarityAuthIntegrationStatus => {
  if (subject.kind === 'anonymous') return 'design_only';
  return 'role_mapping_required';
};

const resolveSafeMessageForSubject = (subject: SimilarityAuthSubject): string => {
  if (subject.kind === 'anonymous') {
    return 'Anonymous mocked preview mapping is design-only; no real auth provider is active.';
  }
  return 'Authenticated role mapping is defined for design purposes only; no real auth provider is active.';
};

/**
 * Builds a `SimilarityAuthIntegrationDesignResult` for a given subject and provider kind. Pure
 * function — no I/O, no persistence, no network. Never throws for the mocked subjects produced
 * by the builders in this module.
 */
export const buildSimilarityAuthIntegrationDesignResult = (
  subject: SimilarityAuthSubject,
  providerKind: SimilarityAuthProviderKind = 'none',
): SimilarityAuthIntegrationDesignResult => ({
  status: resolveStatusForSubject(subject),
  providerKind,
  subject,
  guardRole: mapAuthSubjectToGuardRole(subject),
  guardAuthState: mapAuthSubjectToGuardAuthState(subject),
  warnings:
    providerKind === 'none'
      ? ['No real auth provider is configured; this result is for design purposes only.']
      : [],
  safeMessage: resolveSafeMessageForSubject(subject),
});

export type SimilarityGuardRequestDesignInput = {
  source: SimilarityExecutionSource;
  symbol: string;
  market: 'KR';
  assetType: 'stock' | 'etf';
  requestedAtIso?: string;
};

/**
 * Builds a `SimilarityExecutionGuardRequest` (Phase 3EY-C) from either a design result or a raw
 * auth subject. `stableSubjectId` is placed into `userId` for internal guard evaluation only —
 * `SimilarityApiResponse` (Phase 3EY-D) intentionally never echoes `userId` back to a caller.
 */
export const buildGuardRequestFromAuthDesign = (
  designResultOrSubject: SimilarityAuthIntegrationDesignResult | SimilarityAuthSubject,
  input: SimilarityGuardRequestDesignInput,
): SimilarityExecutionGuardRequest => {
  const subject: SimilarityAuthSubject =
    'subject' in designResultOrSubject ? designResultOrSubject.subject : designResultOrSubject;
  const role: SimilarityExecutionRole =
    'guardRole' in designResultOrSubject ? designResultOrSubject.guardRole : mapAuthSubjectToGuardRole(subject);
  const authState: SimilarityExecutionAuthState =
    'guardAuthState' in designResultOrSubject
      ? designResultOrSubject.guardAuthState
      : mapAuthSubjectToGuardAuthState(subject);

  return {
    purpose: 'chart-similarity',
    source: input.source,
    role,
    authState,
    ...(subject.stableSubjectId ? { userId: subject.stableSubjectId } : {}),
    symbol: input.symbol,
    market: input.market,
    assetType: input.assetType,
    ...(input.requestedAtIso ? { requestedAtIso: input.requestedAtIso } : {}),
  };
};
