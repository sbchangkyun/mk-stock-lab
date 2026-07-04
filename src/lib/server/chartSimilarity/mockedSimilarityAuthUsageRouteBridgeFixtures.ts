/**
 * Mocked owner-local auth/usage bridge request fixtures for the Chart Similarity auth/usage
 * runtime bridge contract test (Phase 3FB-C-ALT).
 *
 * All values are fixed and synthetic: no real user id, no real email, no token, no IP address, no
 * auth provider payload, no KIS data, no real market data. These fixtures exist only to exercise
 * `similarityAuthUsageRouteBridge.ts` / the API route's owner-local auth/usage bridge branch and
 * must never be treated as real account data.
 */

import type { SimilarityAuthUsageBridgeRequestBody } from './similarityAuthUsageRouteBridgeTypes';

const MOCKED_SYMBOL = 'MOCKSYM';

/** Owner, authenticated, safe remaining usage — expected to reach guard-allowed execution. */
export const buildMockedOwnerAuthUsageBridgeAllowedRequestBody = (): SimilarityAuthUsageBridgeRequestBody => ({
  mode: 'owner-local-auth-usage-bridge',
  source: 'mocked-provider-compatible',
  ownerLocalAuthUsageBridge: true,
  symbol: MOCKED_SYMBOL,
  assetType: 'stock',
  mockAuth: { state: 'authenticated', role: 'owner' },
  mockUsage: { window: 'daily', used: 0, limit: 50, remaining: 50 },
});

/** Anonymous, unauthenticated — expected to be blocked with `auth_required`. */
export const buildMockedAnonymousAuthUsageBridgeBlockedRequestBody = (): SimilarityAuthUsageBridgeRequestBody => ({
  mode: 'owner-local-auth-usage-bridge',
  source: 'mocked-provider-compatible',
  ownerLocalAuthUsageBridge: true,
  symbol: MOCKED_SYMBOL,
  assetType: 'stock',
  mockAuth: { state: 'anonymous', role: 'anonymous' },
  mockUsage: { window: 'daily', used: 0, limit: 3, remaining: 3 },
});

/** Owner, authenticated, but usage already at its limit — expected `usage_limited`. */
export const buildMockedUsageLimitedAuthUsageBridgeRequestBody = (): SimilarityAuthUsageBridgeRequestBody => ({
  mode: 'owner-local-auth-usage-bridge',
  source: 'mocked-provider-compatible',
  ownerLocalAuthUsageBridge: true,
  symbol: MOCKED_SYMBOL,
  assetType: 'stock',
  mockAuth: { state: 'authenticated', role: 'owner' },
  mockUsage: { window: 'daily', used: 50, limit: 50, remaining: 0 },
});

/** `used` exceeds `limit` — an internally inconsistent usage snapshot, expected to be rejected as invalid. */
export const buildMockedInvalidAuthUsageBridgeRequestBody = (): Record<string, unknown> => ({
  mode: 'owner-local-auth-usage-bridge',
  source: 'mocked-provider-compatible',
  ownerLocalAuthUsageBridge: true,
  symbol: MOCKED_SYMBOL,
  assetType: 'stock',
  mockAuth: { state: 'authenticated', role: 'owner' },
  mockUsage: { window: 'daily', used: 10, limit: 5, remaining: 0 },
});
