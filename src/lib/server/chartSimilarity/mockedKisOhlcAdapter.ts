/**
 * Mocked server-only KIS OHLC adapter / test harness (Phase 3EY-B).
 *
 * This module is a test harness for the future KIS OHLC provider contract only. It consumes
 * already-normalized synthetic OHLC input (see `mockedKisOhlcFixtures.ts`) and never parses a
 * raw KIS payload, never calls `fetch`, never imports a KIS provider/client module, and never
 * reads `process.env` or `.env`. It must not be imported into any page or API route. The
 * `"ready"` path this module can produce is a mocked, non-live contract check only — it is not
 * a live data source and does not indicate real KIS execution is enabled.
 */

import type {
  NormalizedDailyOhlcInput,
  ServerOnlyKisOhlcPolicy,
  ServerOnlyKisOhlcRequest,
  ServerOnlyKisOhlcResult,
} from './kisOhlcProviderTypes';
import { buildDefaultServerOnlyKisOhlcPolicy } from './kisOhlcProviderPolicy';
import {
  normalizeServerOnlyKisOhlcRequest,
  toSimilarityOhlcBarsFromNormalizedDailyBars,
  validateServerOnlyKisOhlcRequest,
} from './serverOnlyKisOhlcProvider';

export type MockedServerOnlyKisOhlcAdapterInput = {
  request: ServerOnlyKisOhlcRequest;
  normalizedBars: NormalizedDailyOhlcInput[];
  policy?: ServerOnlyKisOhlcPolicy;
};

const buildMockedBlockedResult = (
  request: ServerOnlyKisOhlcRequest,
  reason: string,
): ServerOnlyKisOhlcResult => ({
  ok: false,
  status: 'blocked',
  request,
  bars: [],
  warnings: [`Mocked adapter request rejected: ${reason}`],
  safeMessage: 'Mocked KIS OHLC adapter request could not be processed.',
});

const buildMockedDisabledResult = (request: ServerOnlyKisOhlcRequest): ServerOnlyKisOhlcResult => ({
  ok: false,
  status: 'disabled',
  request,
  bars: [],
  warnings: ['Mocked adapter disabled by policy. This is a non-live test harness response.'],
  safeMessage: 'Mocked KIS OHLC adapter is currently disabled by policy.',
});

const buildMockedEmptyBarsResult = (request: ServerOnlyKisOhlcRequest): ServerOnlyKisOhlcResult => ({
  ok: false,
  status: 'blocked',
  request,
  bars: [],
  warnings: ['No valid normalized bars were available after mapping the mocked adapter input.'],
  safeMessage: 'Mocked KIS OHLC adapter produced no valid normalized bars.',
});

/**
 * Mocked, non-live test harness for the server-only KIS OHLC provider contract. Uses only
 * already-normalized synthetic bars supplied by the caller — never a raw KIS payload.
 */
export const getMockedServerOnlyKisOhlcForSimilarity = (
  input: MockedServerOnlyKisOhlcAdapterInput,
): ServerOnlyKisOhlcResult => {
  const policy = input.policy ?? buildDefaultServerOnlyKisOhlcPolicy();
  const normalizedRequest = normalizeServerOnlyKisOhlcRequest(input.request);
  const validation = validateServerOnlyKisOhlcRequest(normalizedRequest);

  if (!validation.ok) {
    return buildMockedBlockedResult(normalizedRequest, validation.reason ?? 'invalid request.');
  }

  if (!policy.enabled) {
    return buildMockedDisabledResult(normalizedRequest);
  }

  const { bars, warnings } = toSimilarityOhlcBarsFromNormalizedDailyBars(input.normalizedBars, {
    market: normalizedRequest.market,
    symbol: normalizedRequest.symbol,
  });

  if (bars.length === 0) {
    return buildMockedEmptyBarsResult(normalizedRequest);
  }

  return {
    ok: true,
    status: 'ready',
    request: normalizedRequest,
    bars,
    warnings,
    safeMessage: 'Mocked normalized OHLC adapter contract succeeded. This is a non-live test harness result.',
  };
};
