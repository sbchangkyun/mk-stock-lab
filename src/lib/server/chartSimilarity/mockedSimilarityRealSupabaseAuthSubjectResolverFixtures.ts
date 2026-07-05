/**
 * Deterministic mocked fixtures and mocked injected Supabase-compatible auth clients for the
 * Chart Similarity real-compatible Supabase Auth subject resolver (Phase 3FD-B). Every value here
 * is synthetic: no real Supabase user id, email, token, cookie, header, or env value ever appears
 * in this file. Every mocked client is a local, in-memory, deterministic function — none of them
 * call a real Supabase service or the network.
 */

import type {
  SimilarityRealSupabaseAuthSubjectResolverInput,
  SimilaritySupabaseCompatibleAuthClient,
  SimilaritySupabaseCompatibleGetUserResult,
} from './similarityRealSupabaseAuthSubjectResolverTypes';

const FIXED_CURRENT_ISO = '2026-07-04T12:00:00.000+09:00';

function mockedClientFromResult(result: SimilaritySupabaseCompatibleGetUserResult): SimilaritySupabaseCompatibleAuthClient {
  return {
    async getUser() {
      return result;
    },
  };
}

// --- Resolver input fixtures ---

export function buildMockedMissingSessionRealSupabaseAuthSubjectInput(): SimilarityRealSupabaseAuthSubjectResolverInput {
  return {
    sessionEvidenceRef: '',
    tokenShape: 'absent',
    currentIso: FIXED_CURRENT_ISO,
    requestedRuntime: 'auth-subject-resolution',
  };
}

export function buildMockedInvalidSessionRealSupabaseAuthSubjectInput(): SimilarityRealSupabaseAuthSubjectResolverInput {
  return {
    sessionEvidenceRef: 'mock-redacted-session-ref-002',
    tokenShape: 'present-redacted',
    currentIso: FIXED_CURRENT_ISO,
    requestedRuntime: 'auth-subject-resolution',
  };
}

export function buildMockedExpiredSessionRealSupabaseAuthSubjectInput(): SimilarityRealSupabaseAuthSubjectResolverInput {
  return {
    sessionEvidenceRef: 'mock-redacted-session-ref-003',
    tokenShape: 'present-redacted',
    currentIso: FIXED_CURRENT_ISO,
    requestedRuntime: 'auth-subject-resolution',
  };
}

export function buildMockedMalformedSessionRealSupabaseAuthSubjectInput(): SimilarityRealSupabaseAuthSubjectResolverInput {
  return {
    sessionEvidenceRef: 'mock-redacted-session-ref-004',
    tokenShape: 'malformed-redacted',
    currentIso: FIXED_CURRENT_ISO,
    requestedRuntime: 'auth-subject-resolution',
  };
}

export function buildMockedValidEmailRealSupabaseAuthSubjectInput(): SimilarityRealSupabaseAuthSubjectResolverInput {
  return {
    sessionEvidenceRef: 'mock-redacted-session-ref-001',
    tokenShape: 'present-redacted',
    currentIso: FIXED_CURRENT_ISO,
    requestedRuntime: 'auth-subject-resolution',
  };
}

export function buildMockedValidOauthRealSupabaseAuthSubjectInput(): SimilarityRealSupabaseAuthSubjectResolverInput {
  return {
    sessionEvidenceRef: 'mock-redacted-session-ref-005',
    tokenShape: 'present-redacted',
    currentIso: FIXED_CURRENT_ISO,
    requestedRuntime: 'auth-subject-resolution',
  };
}

export function buildMockedClientRoleClaimRealSupabaseAuthSubjectInput(): SimilarityRealSupabaseAuthSubjectResolverInput {
  return {
    sessionEvidenceRef: 'mock-redacted-session-ref-006',
    tokenShape: 'present-redacted',
    currentIso: FIXED_CURRENT_ISO,
    requestedRuntime: 'auth-subject-resolution',
    clientClaimedRole: 'owner',
  };
}

/**
 * A fixture designed to exercise redaction: it carries harmless marker words only
 * (`metadataKind: 'present-redacted'`) and no actual secret-shaped string, so that the safety
 * assertion is proven against a realistic-looking but still fully safe shape.
 */
export function buildMockedUnsafeLikeRealSupabaseAuthSubjectInputForRedactionTest(): SimilarityRealSupabaseAuthSubjectResolverInput {
  return {
    sessionEvidenceRef: 'mock-redacted-session-ref-007',
    tokenShape: 'present-redacted',
    currentIso: FIXED_CURRENT_ISO,
    requestedRuntime: 'auth-subject-resolution',
  };
}

// --- Mocked injected Supabase-compatible auth clients ---

export function buildMockedMissingSessionSupabaseCompatibleAuthClient(): SimilaritySupabaseCompatibleAuthClient {
  return mockedClientFromResult({ status: 'missing_session', user: null });
}

export function buildMockedInvalidSessionSupabaseCompatibleAuthClient(): SimilaritySupabaseCompatibleAuthClient {
  return mockedClientFromResult({ status: 'invalid_session', user: null });
}

export function buildMockedExpiredSessionSupabaseCompatibleAuthClient(): SimilaritySupabaseCompatibleAuthClient {
  return mockedClientFromResult({ status: 'expired_session', user: null });
}

export function buildMockedMalformedSessionSupabaseCompatibleAuthClient(): SimilaritySupabaseCompatibleAuthClient {
  return mockedClientFromResult({ status: 'malformed_session', user: null });
}

export function buildMockedValidEmailSupabaseCompatibleAuthClient(): SimilaritySupabaseCompatibleAuthClient {
  return mockedClientFromResult({
    status: 'ok',
    user: {
      userRef: 'mock-real-compatible-user-ref-001',
      providerKind: 'email',
      metadataKind: 'none',
      safeCreatedAtIso: FIXED_CURRENT_ISO,
    },
  });
}

export function buildMockedValidOauthSupabaseCompatibleAuthClient(): SimilaritySupabaseCompatibleAuthClient {
  return mockedClientFromResult({
    status: 'ok',
    user: {
      userRef: 'mock-real-compatible-user-ref-002',
      providerKind: 'oauth',
      metadataKind: 'present-redacted',
      safeCreatedAtIso: FIXED_CURRENT_ISO,
    },
  });
}

export function buildMockedClientErrorSupabaseCompatibleAuthClient(): SimilaritySupabaseCompatibleAuthClient {
  return mockedClientFromResult({
    status: 'client_error',
    user: null,
    errorCategory: 'network',
    safeMessage: 'Mocked injected auth client reported a network-category error.',
  });
}

export function buildMockedClientRoleClaimSupabaseCompatibleAuthClient(): SimilaritySupabaseCompatibleAuthClient {
  return mockedClientFromResult({
    status: 'ok',
    user: {
      userRef: 'mock-real-compatible-user-ref-003',
      providerKind: 'email',
      metadataKind: 'none',
      clientRoleClaim: 'owner',
      safeCreatedAtIso: FIXED_CURRENT_ISO,
    },
  });
}
