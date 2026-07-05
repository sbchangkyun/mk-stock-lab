/**
 * Deterministic mocked fixtures for the role assignment resolver scaffold (Phase 3FC-D).
 *
 * Every value below is synthetic: no real email, no token-like string, no real user identifier,
 * no IP address, no raw session payload, no account/trading/balance field. These fixtures exist
 * only to exercise `resolveSimilarityRoleAssignment` under the mocked scaffold policy.
 */

import type {
  SimilarityRoleAssignmentRecord,
  SimilarityRoleAssignmentResolverInput,
  SimilarityRoleAssignmentSubjectRef,
} from './similarityRoleAssignmentResolverTypes';

const buildMockedSubject = (subjectRef: string): SimilarityRoleAssignmentSubjectRef => ({
  provider: 'supabase',
  subjectRef,
  source: 'mocked-scaffold',
  stableForUsageLookup: true,
});

const buildMockedAssignmentRecord = (
  subjectRef: string,
  role: SimilarityRoleAssignmentRecord['role'],
  assignedAtIso: string,
  assignedByRef: string,
  active: boolean,
): SimilarityRoleAssignmentRecord => ({
  subjectRef,
  role,
  assignedAtIso,
  assignedByRef,
  source: 'mocked-assignment',
  active,
});

export const buildMockedAnonymousRoleAssignmentResolverInput = (): SimilarityRoleAssignmentResolverInput => ({
  authState: 'anonymous',
  roleSeed: 'anonymous',
  subject: null,
  clientClaimedRole: null,
  clientClaimedSubject: null,
  mockedAssignments: null,
});

export const buildMockedAuthenticatedNoAssignmentRoleResolverInput = (): SimilarityRoleAssignmentResolverInput => ({
  authState: 'authenticated',
  roleSeed: 'authenticated',
  subject: buildMockedSubject('mock-subject-authenticated-001'),
  clientClaimedRole: null,
  clientClaimedSubject: null,
  mockedAssignments: [],
});

export const buildMockedBetaRoleAssignmentResolverInput = (): SimilarityRoleAssignmentResolverInput => ({
  authState: 'authenticated',
  roleSeed: 'authenticated',
  subject: buildMockedSubject('mock-subject-beta-001'),
  clientClaimedRole: null,
  clientClaimedSubject: null,
  mockedAssignments: [
    buildMockedAssignmentRecord(
      'mock-subject-beta-001',
      'beta',
      '2026-06-01T00:00:00.000Z',
      'mock-role-assigner-admin-001',
      true,
    ),
  ],
});

export const buildMockedOwnerRoleAssignmentResolverInput = (): SimilarityRoleAssignmentResolverInput => ({
  authState: 'authenticated',
  roleSeed: 'authenticated',
  subject: buildMockedSubject('mock-subject-owner-001'),
  clientClaimedRole: null,
  clientClaimedSubject: null,
  mockedAssignments: [
    buildMockedAssignmentRecord(
      'mock-subject-owner-001',
      'owner',
      '2026-06-01T00:00:00.000Z',
      'mock-role-assigner-admin-001',
      true,
    ),
  ],
});

export const buildMockedAdminRoleAssignmentResolverInput = (): SimilarityRoleAssignmentResolverInput => ({
  authState: 'authenticated',
  roleSeed: 'authenticated',
  subject: buildMockedSubject('mock-subject-admin-001'),
  clientClaimedRole: null,
  clientClaimedSubject: null,
  mockedAssignments: [
    buildMockedAssignmentRecord(
      'mock-subject-admin-001',
      'admin',
      '2026-06-01T00:00:00.000Z',
      'mock-role-assigner-admin-001',
      true,
    ),
  ],
});

export const buildMockedInactiveAssignmentIgnoredResolverInput = (): SimilarityRoleAssignmentResolverInput => ({
  authState: 'authenticated',
  roleSeed: 'authenticated',
  subject: buildMockedSubject('mock-subject-inactive-001'),
  clientClaimedRole: null,
  clientClaimedSubject: null,
  mockedAssignments: [
    buildMockedAssignmentRecord(
      'mock-subject-inactive-001',
      'owner',
      '2026-05-01T00:00:00.000Z',
      'mock-role-assigner-admin-001',
      false,
    ),
  ],
});

export const buildMockedMultipleAssignmentsIgnoredResolverInput = (): SimilarityRoleAssignmentResolverInput => ({
  authState: 'authenticated',
  roleSeed: 'authenticated',
  subject: buildMockedSubject('mock-subject-multiple-001'),
  clientClaimedRole: null,
  clientClaimedSubject: null,
  mockedAssignments: [
    buildMockedAssignmentRecord(
      'mock-subject-multiple-001',
      'beta',
      '2026-05-01T00:00:00.000Z',
      'mock-role-assigner-admin-001',
      true,
    ),
    buildMockedAssignmentRecord(
      'mock-subject-multiple-001',
      'owner',
      '2026-05-15T00:00:00.000Z',
      'mock-role-assigner-admin-002',
      true,
    ),
  ],
});

export const buildMockedClientClaimedRoleIgnoredRoleResolverInput = (): SimilarityRoleAssignmentResolverInput => ({
  authState: 'authenticated',
  roleSeed: 'authenticated',
  subject: buildMockedSubject('mock-subject-authenticated-002'),
  clientClaimedRole: 'admin',
  clientClaimedSubject: 'mock-subject-claimed-999',
  mockedAssignments: [],
});
