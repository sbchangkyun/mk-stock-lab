/**
 * Deterministic mocked fixtures for the Phase 3FC-E usage store interface scaffold smoke/checker.
 *
 * All subject refs, counter records, and timestamps are synthetic and static — no `Date.now()`,
 * no `Math.random()`, no real user identifier, no email, no token-like string, no IP address, no
 * raw KIS/OHLC/price/volume/account/trading/balance field.
 */

import type { SimilarityUsageCounterRecord, SimilarityUsageStoreInput, SimilarityUsageStoreSubjectRef } from './similarityUsageStoreTypes';

const DAILY_RESET_ISO = '2026-07-05T00:00:00.000+09:00';
const MONTHLY_RESET_ISO = '2026-08-01T00:00:00.000+09:00';
const UPDATED_AT_ISO = '2026-07-04T12:00:00.000+09:00';

const buildMockedSubject = (subjectRef: string): SimilarityUsageStoreSubjectRef => ({
  provider: 'supabase',
  subjectRef,
  source: 'mocked-scaffold',
  stableForUsageLookup: true,
});

const buildMockedCounter = (
  subjectRef: string,
  role: SimilarityUsageCounterRecord['role'],
  window: SimilarityUsageCounterRecord['window'],
  used: number,
  limit: number,
  resetAtIso: string,
): SimilarityUsageCounterRecord => ({
  subjectRef,
  role,
  window,
  used,
  limit,
  remaining: Math.max(limit - used, 0),
  resetAtIso,
  updatedAtIso: UPDATED_AT_ISO,
  source: 'mocked-counter',
});

export const buildMockedAnonymousUsageStoreInput = (): SimilarityUsageStoreInput => ({
  role: 'anonymous',
  subject: null,
  window: 'daily',
  mockedCounters: null,
  incrementBy: 1,
  requestRef: 'mock-usage-request-001',
  currentIso: DAILY_RESET_ISO,
});

export const buildMockedAuthenticatedFreshDailyUsageStoreInput = (): SimilarityUsageStoreInput => ({
  role: 'authenticated',
  subject: buildMockedSubject('mock-subject-authenticated-001'),
  window: 'daily',
  mockedCounters: [],
  incrementBy: 1,
  requestRef: 'mock-usage-request-002',
  currentIso: DAILY_RESET_ISO,
});

export const buildMockedAuthenticatedAtDailyLimitUsageStoreInput = (): SimilarityUsageStoreInput => ({
  role: 'authenticated',
  subject: buildMockedSubject('mock-subject-authenticated-001'),
  window: 'daily',
  mockedCounters: [buildMockedCounter('mock-subject-authenticated-001', 'authenticated', 'daily', 3, 3, DAILY_RESET_ISO)],
  incrementBy: 1,
  requestRef: 'mock-usage-request-003',
  currentIso: DAILY_RESET_ISO,
});

export const buildMockedBetaPartialDailyUsageStoreInput = (): SimilarityUsageStoreInput => ({
  role: 'beta',
  subject: buildMockedSubject('mock-subject-beta-001'),
  window: 'daily',
  mockedCounters: [buildMockedCounter('mock-subject-beta-001', 'beta', 'daily', 4, 10, DAILY_RESET_ISO)],
  incrementBy: 1,
  requestRef: 'mock-usage-request-004',
  currentIso: DAILY_RESET_ISO,
});

export const buildMockedBetaAtMonthlyLimitUsageStoreInput = (): SimilarityUsageStoreInput => ({
  role: 'beta',
  subject: buildMockedSubject('mock-subject-beta-001'),
  window: 'monthly',
  mockedCounters: [buildMockedCounter('mock-subject-beta-001', 'beta', 'monthly', 100, 100, MONTHLY_RESET_ISO)],
  incrementBy: 1,
  requestRef: 'mock-usage-request-005',
  currentIso: MONTHLY_RESET_ISO,
});

export const buildMockedOwnerPartialDailyUsageStoreInput = (): SimilarityUsageStoreInput => ({
  role: 'owner',
  subject: buildMockedSubject('mock-subject-owner-001'),
  window: 'daily',
  mockedCounters: [buildMockedCounter('mock-subject-owner-001', 'owner', 'daily', 20, 50, DAILY_RESET_ISO)],
  incrementBy: 5,
  requestRef: 'mock-usage-request-006',
  currentIso: DAILY_RESET_ISO,
});

export const buildMockedAdminPartialMonthlyUsageStoreInput = (): SimilarityUsageStoreInput => ({
  role: 'admin',
  subject: buildMockedSubject('mock-subject-admin-001'),
  window: 'monthly',
  mockedCounters: [buildMockedCounter('mock-subject-admin-001', 'admin', 'monthly', 1500, 3000, MONTHLY_RESET_ISO)],
  incrementBy: 10,
  requestRef: 'mock-usage-request-007',
  currentIso: MONTHLY_RESET_ISO,
});

export const buildMockedCounterMismatchIgnoredUsageStoreInput = (): SimilarityUsageStoreInput => ({
  role: 'authenticated',
  subject: buildMockedSubject('mock-subject-authenticated-001'),
  window: 'daily',
  mockedCounters: [buildMockedCounter('mock-subject-authenticated-002', 'authenticated', 'daily', 3, 3, DAILY_RESET_ISO)],
  incrementBy: 1,
  requestRef: 'mock-usage-request-008',
  currentIso: DAILY_RESET_ISO,
});

export const buildMockedClientClaimedUsageIgnoredUsageStoreInput = (): SimilarityUsageStoreInput => ({
  role: 'authenticated',
  subject: buildMockedSubject('mock-subject-authenticated-001'),
  window: 'daily',
  mockedCounters: [],
  incrementBy: 1,
  requestRef: 'mock-usage-request-009',
  currentIso: DAILY_RESET_ISO,
  clientClaimedRole: 'admin',
  clientClaimedUsage: { used: 0, limit: 999999, remaining: 999999 },
});
