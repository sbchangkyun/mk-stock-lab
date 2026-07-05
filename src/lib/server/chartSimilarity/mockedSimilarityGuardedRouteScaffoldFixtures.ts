/**
 * Deterministic mocked request fixtures for the Phase 3FC-H guarded route integration scaffold.
 *
 * All values are synthetic. No real symbol, account, credential, token, raw provider payload,
 * price, volume, or timestamp is used anywhere in this file.
 */

import type { SimilarityGuardedRouteScaffoldRequestBody } from './similarityGuardedRouteScaffoldTypes';

/** An exact-match guarded runtime scaffold request body, usable for smoke/fixture verification only. */
export const buildMockedGuardedRuntimeScaffoldRequestBody = (): SimilarityGuardedRouteScaffoldRequestBody => ({
  mode: 'guarded-runtime-scaffold',
  source: 'mocked-provider-compatible',
  guardedRuntimeScaffold: true,
  symbol: 'MOCK-SYNTH-01',
  assetType: 'stock',
  requestedCapability: null,
});

/** A malformed request body: wrong literal values for every discriminator field. */
export const buildMockedMalformedGuardedRuntimeScaffoldRequestBody = (): Record<string, unknown> => ({
  mode: 'not-a-real-mode',
  source: 'not-a-real-source',
  guardedRuntimeScaffold: 'true',
  symbol: 'MOCK-SYNTH-02',
});

/** A partial request body: missing the `guardedRuntimeScaffold` discriminator field entirely. */
export const buildMockedPartialGuardedRuntimeScaffoldRequestBody = (): Record<string, unknown> => ({
  mode: 'guarded-runtime-scaffold',
  source: 'mocked-provider-compatible',
  symbol: 'MOCK-SYNTH-03',
});
