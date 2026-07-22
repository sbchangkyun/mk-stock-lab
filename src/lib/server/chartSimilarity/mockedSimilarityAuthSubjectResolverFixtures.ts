/**
 * Deterministic mocked fixtures for the Supabase Auth subject resolver scaffold (Phase 3FC-C).
 *
 * Every value below is synthetic: no real email, no token-like string, no real user identifier,
 * no IP address, no raw session payload, no account/trading/balance field. These fixtures exist
 * only to exercise `resolveSimilarityAuthSubject` under the mocked scaffold policy.
 */

import type { SimilarityAuthSubjectResolverInput } from './similarityAuthSubjectResolverTypes';

export const buildMockedMissingSupabaseSessionResolverInput = (): SimilarityAuthSubjectResolverInput => ({
  provider: 'supabase',
  mode: 'mocked-scaffold',
  serverSessionCandidate: {
    kind: 'mock-supabase-session',
    state: 'missing',
  },
  clientClaimedRole: null,
  clientClaimedSubject: null,
});

export const buildMockedValidSupabaseSessionResolverInput = (): SimilarityAuthSubjectResolverInput => ({
  provider: 'supabase',
  mode: 'mocked-scaffold',
  serverSessionCandidate: {
    kind: 'mock-supabase-session',
    state: 'valid',
    subjectRef: 'mock-subject-authenticated-001',
    emailVerified: true,
  },
  clientClaimedRole: null,
  clientClaimedSubject: null,
});

export const buildMockedInvalidSupabaseSessionResolverInput = (): SimilarityAuthSubjectResolverInput => ({
  provider: 'supabase',
  mode: 'mocked-scaffold',
  serverSessionCandidate: {
    kind: 'mock-supabase-session',
    state: 'invalid',
  },
  clientClaimedRole: null,
  clientClaimedSubject: null,
});

export const buildMockedClientClaimedRoleIgnoredResolverInput = (): SimilarityAuthSubjectResolverInput => ({
  provider: 'supabase',
  mode: 'mocked-scaffold',
  serverSessionCandidate: {
    kind: 'mock-supabase-session',
    state: 'valid',
    subjectRef: 'mock-subject-authenticated-002',
    emailVerified: true,
  },
  clientClaimedRole: 'admin',
  clientClaimedSubject: 'mock-subject-claimed-999',
});
