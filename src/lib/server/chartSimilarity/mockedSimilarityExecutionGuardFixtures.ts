/**
 * Mocked auth/usage guard request and usage-snapshot fixtures for the Chart Similarity
 * execution guard contract test (Phase 3EY-C).
 *
 * All values are fixed and synthetic: no real user id, no real email, no token, no IP address,
 * no auth provider payload, no KIS data, no real market data. Fake user ids follow the pattern
 * `mock-user-<role>`. These fixtures exist only to exercise `similarityExecutionGuard.ts` and
 * must never be treated as real account data.
 */

import type { SimilarityExecutionGuardRequest, SimilarityExecutionUsageSnapshot } from './similarityExecutionGuardTypes';

const FIXED_REQUESTED_AT_ISO = '2020-01-01T00:00:00.000Z';
const MOCKED_SYMBOL = 'MOCKSYM01';

export const buildMockedAnonymousSimilarityGuardRequest = (): SimilarityExecutionGuardRequest => ({
  purpose: 'chart-similarity',
  source: 'mocked',
  role: 'anonymous',
  authState: 'missing',
  symbol: MOCKED_SYMBOL,
  market: 'KR',
  assetType: 'stock',
  requestedAtIso: FIXED_REQUESTED_AT_ISO,
});

export const buildMockedAuthenticatedSimilarityGuardRequest = (): SimilarityExecutionGuardRequest => ({
  purpose: 'chart-similarity',
  source: 'kis-normalized',
  role: 'authenticated',
  authState: 'authenticated',
  userId: 'mock-user-authenticated',
  symbol: MOCKED_SYMBOL,
  market: 'KR',
  assetType: 'stock',
  requestedAtIso: FIXED_REQUESTED_AT_ISO,
});

export const buildMockedBetaSimilarityGuardRequest = (): SimilarityExecutionGuardRequest => ({
  purpose: 'chart-similarity',
  source: 'kis-normalized',
  role: 'beta',
  authState: 'authenticated',
  userId: 'mock-user-beta',
  symbol: MOCKED_SYMBOL,
  market: 'KR',
  assetType: 'stock',
  requestedAtIso: FIXED_REQUESTED_AT_ISO,
});

export const buildMockedOwnerSimilarityGuardRequest = (): SimilarityExecutionGuardRequest => ({
  purpose: 'chart-similarity',
  source: 'owner-local',
  role: 'owner',
  authState: 'owner',
  userId: 'mock-user-owner',
  symbol: MOCKED_SYMBOL,
  market: 'KR',
  assetType: 'stock',
  requestedAtIso: FIXED_REQUESTED_AT_ISO,
});

export const buildMockedInvalidSimilarityGuardRequest = (): SimilarityExecutionGuardRequest => ({
  purpose: 'chart-similarity',
  source: 'mocked',
  role: 'anonymous',
  authState: 'missing',
  symbol: '',
  market: 'KR',
  assetType: 'stock',
  requestedAtIso: FIXED_REQUESTED_AT_ISO,
});

export const buildMockedUsageSnapshot = (): SimilarityExecutionUsageSnapshot => ({
  window: 'daily',
  used: 1,
  limit: 3,
  remaining: 2,
  resetAtIso: '2020-01-02T00:00:00.000Z',
});
