/**
 * Mocked usage storage design fixtures for Chart Similarity execution (Phase 3EZ-B).
 *
 * All values are fixed and synthetic: no real email, no token, no IP address, no auth provider
 * payload, no KIS data, no real market data, no SQL, no DB/cache runtime. Fake subject keys reuse
 * the Phase 3EZ-A mocked subject ids (`mock-auth-subject`, `mock-beta-subject`,
 * `mock-owner-subject`). These fixtures exist only to exercise `similarityUsageStorageDesign.ts`
 * and must never be treated as real usage data.
 */

import {
  buildDefaultSimilarityUsageStoragePolicy,
  buildSimilarityUsageStorageDesignResult,
  buildSimilarityUsageStorageKey,
  decideSimilarityUsageCharge,
} from './similarityUsageStorageDesign';
import type {
  SimilarityUsageChargeDecision,
  SimilarityUsageStorageDesignResult,
  SimilarityUsageStorageKey,
  SimilarityUsageStoragePolicy,
} from './similarityUsageStorageDesignTypes';

const FIXED_REQUESTED_AT_ISO = '2020-01-01T00:00:00.000Z';

export const buildMockedSimilarityUsageStoragePolicy = (): SimilarityUsageStoragePolicy =>
  buildDefaultSimilarityUsageStoragePolicy();

export const buildMockedAuthenticatedDailyUsageKey = (): SimilarityUsageStorageKey | null =>
  buildSimilarityUsageStorageKey({
    subjectKey: 'mock-auth-subject',
    source: 'kis-normalized',
    window: 'daily',
    requestedAtIso: FIXED_REQUESTED_AT_ISO,
  });

export const buildMockedBetaDailyUsageKey = (): SimilarityUsageStorageKey | null =>
  buildSimilarityUsageStorageKey({
    subjectKey: 'mock-beta-subject',
    source: 'kis-normalized',
    window: 'daily',
    requestedAtIso: FIXED_REQUESTED_AT_ISO,
  });

export const buildMockedOwnerDailyUsageKey = (): SimilarityUsageStorageKey | null =>
  buildSimilarityUsageStorageKey({
    subjectKey: 'mock-owner-subject',
    source: 'owner-local',
    window: 'daily',
    requestedAtIso: FIXED_REQUESTED_AT_ISO,
  });

export const buildMockedUsageChargeSuccessDecision = (): SimilarityUsageChargeDecision =>
  decideSimilarityUsageCharge('success', buildMockedSimilarityUsageStoragePolicy());

export const buildMockedUsageChargeAuthRequiredDecision = (): SimilarityUsageChargeDecision =>
  decideSimilarityUsageCharge('auth_required', buildMockedSimilarityUsageStoragePolicy());

export const buildMockedUsageChargeProviderErrorDecision = (): SimilarityUsageChargeDecision =>
  decideSimilarityUsageCharge('provider_error', buildMockedSimilarityUsageStoragePolicy());

export const buildMockedUsageStorageDesignResult = (): SimilarityUsageStorageDesignResult =>
  buildSimilarityUsageStorageDesignResult(
    buildMockedSimilarityUsageStoragePolicy(),
    buildMockedAuthenticatedDailyUsageKey(),
    buildMockedUsageChargeSuccessDecision(),
  );
