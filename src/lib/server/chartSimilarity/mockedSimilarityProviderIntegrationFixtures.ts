/**
 * Mocked fixtures for the provider-compatible OHLC to similarity engine integration
 * (Phase 3FB-A). All values are deterministic and derived from the existing mocked KIS OHLC
 * fixtures — no `Math.random`, no `Date.now`, no real stock code, and no actual market value.
 */

import { buildMockedNormalizedDailyOhlcInput } from './mockedKisOhlcFixtures';
import { toSimilarityOhlcBarsFromNormalizedDailyBars } from './serverOnlyKisOhlcProvider';
import {
  buildOwnerLocalMockedSimilarityProviderIntegrationPolicy,
  normalizeSimilarityProviderIntegrationRequest,
  runSimilarityProviderIntegrationWithBars,
} from './similarityProviderIntegration';
import type {
  SimilarityProviderIntegrationPolicy,
  SimilarityProviderIntegrationRequest,
  SimilarityProviderIntegrationResult,
} from './similarityProviderIntegrationTypes';

const FIXTURE_SYMBOL = 'MOCK005930';

/** Fixed, deterministic request fixture for the provider integration contract. */
export const buildMockedProviderIntegrationRequest = (): SimilarityProviderIntegrationRequest =>
  normalizeSimilarityProviderIntegrationRequest({
    symbol: FIXTURE_SYMBOL,
    market: 'KR',
    timeframe: 'daily',
    baseWindow: 20,
    forwardWindows: [5, 10, 20],
    topK: 5,
    source: 'mocked-provider-compatible',
  });

/** Fixed, deterministic policy fixture: owner-local mocked only, never live KIS. */
export const buildMockedProviderIntegrationPolicy = (): SimilarityProviderIntegrationPolicy =>
  buildOwnerLocalMockedSimilarityProviderIntegrationPolicy();

/** Ready-path fixture: enough deterministic mocked bars for the fixture request's base window. */
export const buildMockedProviderCompatibleIntegrationReadyResult = (): SimilarityProviderIntegrationResult => {
  const request = buildMockedProviderIntegrationRequest();
  const policy = buildMockedProviderIntegrationPolicy();
  const normalizedDailyInput = buildMockedNormalizedDailyOhlcInput(80);
  const { bars } = toSimilarityOhlcBarsFromNormalizedDailyBars(normalizedDailyInput, {
    market: request.market,
    symbol: request.symbol,
  });

  return runSimilarityProviderIntegrationWithBars(request, bars, policy);
};

/** Blocked-path fixture: deliberately too few bars for the fixture request's base window. */
export const buildMockedProviderCompatibleIntegrationBlockedResult = (): SimilarityProviderIntegrationResult => {
  const request = buildMockedProviderIntegrationRequest();
  const policy = buildMockedProviderIntegrationPolicy();
  const normalizedDailyInput = buildMockedNormalizedDailyOhlcInput(10);
  const { bars } = toSimilarityOhlcBarsFromNormalizedDailyBars(normalizedDailyInput, {
    market: request.market,
    symbol: request.symbol,
  });

  return runSimilarityProviderIntegrationWithBars(request, bars, policy);
};
