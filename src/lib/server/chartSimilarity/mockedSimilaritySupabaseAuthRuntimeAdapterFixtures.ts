/**
 * Deterministic mocked fixtures for the Chart Similarity Supabase Auth runtime adapter
 * (Phase 3FD-B-ALT). Every value here is synthetic: no real Supabase user id, email, token,
 * cookie, header, or env value ever appears in this file.
 */

import type { SimilaritySupabaseAuthRuntimeAdapterInput } from './similaritySupabaseAuthRuntimeAdapterTypes';

const FIXED_CURRENT_ISO = '2026-07-04T12:00:00.000+09:00';

export function buildMockedMissingSupabaseAuthRuntimeAdapterInput(): SimilaritySupabaseAuthRuntimeAdapterInput {
  return {
    mockedSession: { state: 'missing' },
    currentIso: FIXED_CURRENT_ISO,
    requestedRuntime: 'auth-subject-resolution',
  };
}

export function buildMockedInvalidSupabaseAuthRuntimeAdapterInput(): SimilaritySupabaseAuthRuntimeAdapterInput {
  return {
    mockedSession: { state: 'invalid', tokenShape: 'present-redacted' },
    currentIso: FIXED_CURRENT_ISO,
    requestedRuntime: 'auth-subject-resolution',
  };
}

export function buildMockedExpiredSupabaseAuthRuntimeAdapterInput(): SimilaritySupabaseAuthRuntimeAdapterInput {
  return {
    mockedSession: {
      state: 'expired',
      user: {
        idRef: 'mock-user-ref-002',
        emailRef: 'mock-email-ref-002',
        providerKind: 'email',
        metadataKind: 'none',
        createdAtIso: '2026-06-01T09:00:00.000+09:00',
      },
      expiresAtIso: '2026-07-01T00:00:00.000+09:00',
      tokenShape: 'present-redacted',
    },
    currentIso: FIXED_CURRENT_ISO,
    requestedRuntime: 'auth-subject-resolution',
  };
}

export function buildMockedMalformedSupabaseAuthRuntimeAdapterInput(): SimilaritySupabaseAuthRuntimeAdapterInput {
  return {
    mockedSession: { state: 'malformed', tokenShape: 'malformed-redacted' },
    currentIso: FIXED_CURRENT_ISO,
    requestedRuntime: 'auth-subject-resolution',
  };
}

export function buildMockedValidEmailSupabaseAuthRuntimeAdapterInput(): SimilaritySupabaseAuthRuntimeAdapterInput {
  return {
    mockedSession: {
      state: 'valid',
      user: {
        idRef: 'mock-user-ref-001',
        emailRef: 'mock-email-ref-001',
        providerKind: 'email',
        metadataKind: 'none',
        createdAtIso: FIXED_CURRENT_ISO,
      },
      expiresAtIso: '2026-07-05T12:00:00.000+09:00',
      tokenShape: 'present-redacted',
    },
    currentIso: FIXED_CURRENT_ISO,
    requestedRuntime: 'auth-subject-resolution',
  };
}

export function buildMockedValidOauthSupabaseAuthRuntimeAdapterInput(): SimilaritySupabaseAuthRuntimeAdapterInput {
  return {
    mockedSession: {
      state: 'valid',
      user: {
        idRef: 'mock-user-ref-003',
        emailRef: null,
        providerKind: 'oauth',
        metadataKind: 'present-redacted',
        createdAtIso: FIXED_CURRENT_ISO,
      },
      expiresAtIso: '2026-07-05T12:00:00.000+09:00',
      tokenShape: 'present-redacted',
    },
    currentIso: FIXED_CURRENT_ISO,
    requestedRuntime: 'auth-subject-resolution',
  };
}

export function buildMockedValidWithClientRoleClaimSupabaseAuthRuntimeAdapterInput(): SimilaritySupabaseAuthRuntimeAdapterInput {
  return {
    mockedSession: {
      state: 'valid',
      user: {
        idRef: 'mock-user-ref-004',
        emailRef: 'mock-email-ref-004',
        providerKind: 'email',
        metadataKind: 'none',
        createdAtIso: FIXED_CURRENT_ISO,
      },
      expiresAtIso: '2026-07-05T12:00:00.000+09:00',
      tokenShape: 'present-redacted',
    },
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
export function buildMockedUnsafeLikeSupabaseAuthRuntimeAdapterInputForRedactionTest(): SimilaritySupabaseAuthRuntimeAdapterInput {
  return {
    mockedSession: {
      state: 'valid',
      user: {
        idRef: 'mock-user-ref-005',
        emailRef: 'mock-email-ref-005',
        providerKind: 'email',
        metadataKind: 'present-redacted',
        roleClaim: 'redacted-marker-only',
        createdAtIso: FIXED_CURRENT_ISO,
      },
      expiresAtIso: '2026-07-05T12:00:00.000+09:00',
      tokenShape: 'present-redacted',
    },
    currentIso: FIXED_CURRENT_ISO,
    requestedRuntime: 'auth-subject-resolution',
  };
}
