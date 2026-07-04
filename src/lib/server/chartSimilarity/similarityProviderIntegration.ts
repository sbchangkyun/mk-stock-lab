/**
 * Provider-compatible OHLC to similarity engine integration (Phase 3FB-A).
 *
 * Feeds already-normalized, provider-compatible `OhlcBar[]` data into the real, existing
 * deterministic similarity engine (`scanSimilarity`). This module never calls `fetch`, never
 * reads `process.env` or `.env`, never imports a KIS provider/client module, and is never wired
 * into a page or API route in this phase. The only source enabled in this phase is
 * `"mocked-provider-compatible"`; `"kis-normalized-future"` is accepted by the type system for
 * forward compatibility but is always treated as blocked here.
 */

import type { OhlcBar, SimilarityAnalysisResult } from '../../chartSimilarity';
import { scanSimilarity } from '../../chartSimilarity';
import { buildMockedNormalizedDailyOhlcInput } from './mockedKisOhlcFixtures';
import { toSimilarityOhlcBarsFromNormalizedDailyBars } from './serverOnlyKisOhlcProvider';
import type {
  SimilarityProviderIntegrationBarCountBucket,
  SimilarityProviderIntegrationMatchCountBucket,
  SimilarityProviderIntegrationPolicy,
  SimilarityProviderIntegrationRequest,
  SimilarityProviderIntegrationResult,
} from './similarityProviderIntegrationTypes';

const DEFAULT_SYMBOL = 'MOCKSYM';
const DEFAULT_BASE_WINDOW = 20;
const DEFAULT_FORWARD_WINDOWS = [5, 10, 20];
const DEFAULT_TOP_K = 5;
const MAX_BASE_WINDOW = 250;
const MIN_BASE_WINDOW = 5;
const MAX_TOP_K = 20;
const MIN_SUFFICIENT_BAR_MULTIPLIER = 2;

/** Default policy: disabled, mirroring every other Chart Similarity module's safe default. */
export const buildDefaultSimilarityProviderIntegrationPolicy = (): SimilarityProviderIntegrationPolicy => ({
  enabled: false,
  ownerLocalOnly: true,
  allowLiveKis: false,
  allowMockedProviderCompatibleInput: true,
  allowRouteSuccess: false,
  allowPublicExecution: false,
  allowBetaExecution: false,
  allowRawProviderPayload: false,
  allowCredentialEcho: false,
  allowEnvEcho: false,
  allowActualMarketValuesInReport: false,
  notes: [
    'Disabled by default. Enabling requires an explicit owner-local mocked policy.',
    'This module never reads process.env or .env values.',
  ],
});

/**
 * Owner-local mocked policy: enables the mocked, provider-compatible integration path only.
 * Never enables live KIS, route success, public execution, or beta execution.
 */
export const buildOwnerLocalMockedSimilarityProviderIntegrationPolicy = (): SimilarityProviderIntegrationPolicy => ({
  enabled: true,
  ownerLocalOnly: true,
  allowLiveKis: false,
  allowMockedProviderCompatibleInput: true,
  allowRouteSuccess: false,
  allowPublicExecution: false,
  allowBetaExecution: false,
  allowRawProviderPayload: false,
  allowCredentialEcho: false,
  allowEnvEcho: false,
  allowActualMarketValuesInReport: false,
  notes: [
    'Owner-local mocked integration only. Live KIS remains disabled and unreachable from this module.',
    'No route, public, or beta execution is enabled by this policy.',
  ],
});

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
  const numeric = typeof value === 'number' ? value : Number.NaN;
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(Math.max(Math.floor(numeric), min), max);
};

/** Normalizes a candidate request into a safe, fully-populated shape. Never throws. */
export const normalizeSimilarityProviderIntegrationRequest = (
  request?: Partial<SimilarityProviderIntegrationRequest>,
): SimilarityProviderIntegrationRequest => {
  const forwardWindows = Array.isArray(request?.forwardWindows)
    ? request!.forwardWindows.filter((value) => Number.isFinite(value) && value > 0).map((value) => Math.floor(value))
    : DEFAULT_FORWARD_WINDOWS;

  return {
    symbol:
      typeof request?.symbol === 'string' && request.symbol.trim().length > 0
        ? request.symbol.trim()
        : DEFAULT_SYMBOL,
    market: 'KR',
    timeframe: 'daily',
    baseWindow: clampInt(request?.baseWindow, MIN_BASE_WINDOW, MAX_BASE_WINDOW, DEFAULT_BASE_WINDOW),
    forwardWindows: forwardWindows.length > 0 ? forwardWindows : DEFAULT_FORWARD_WINDOWS,
    topK: clampInt(request?.topK, 1, MAX_TOP_K, DEFAULT_TOP_K),
    source: request?.source === 'kis-normalized-future' ? 'kis-normalized-future' : 'mocked-provider-compatible',
  };
};

/** Buckets a normalized bar count into a safe, non-numeric-value bucket label. */
export const bucketProviderNormalizedBarCount = (count: number): SimilarityProviderIntegrationBarCountBucket => {
  if (!Number.isFinite(count) || count < 0) return 'unknown';
  if (count === 0) return 'none';
  if (count <= 20) return 'one_to_twenty';
  if (count <= 100) return 'twenty_one_to_one_hundred';
  return 'over_one_hundred';
};

/** Buckets a similarity match count into a safe, non-numeric-value bucket label. */
export const bucketSimilarityMatchCount = (count: number): SimilarityProviderIntegrationMatchCountBucket => {
  if (!Number.isFinite(count) || count < 0) return 'unknown';
  if (count === 0) return 'none';
  if (count <= 5) return 'one_to_five';
  if (count <= 20) return 'six_to_twenty';
  return 'over_twenty';
};

const buildSafeSummary = (
  request: SimilarityProviderIntegrationRequest,
  normalizedBarCountBucket: SimilarityProviderIntegrationBarCountBucket,
  matchCountBucket: SimilarityProviderIntegrationMatchCountBucket,
  warnings: string[],
) => ({
  market: request.market,
  symbol: request.symbol,
  baseWindow: request.baseWindow,
  normalizedBarCountBucket,
  matchCountBucket,
  warningsPresent: warnings.length > 0,
  warningsCount: warnings.length,
});

const buildDisabledResult = (
  request: SimilarityProviderIntegrationRequest,
  policy: SimilarityProviderIntegrationPolicy,
): SimilarityProviderIntegrationResult => ({
  status: 'disabled',
  mode: 'feature-flag-off',
  source: request.source,
  providerStatus: 'disabled',
  engineStatus: 'not_run',
  normalizedBarsAvailable: false,
  normalizedBarCountBucket: 'none',
  matchCountBucket: 'none',
  warnings: ['Similarity provider integration is disabled by policy.'],
  safeMessage: 'Similarity provider integration is currently disabled.',
  dataPolicy: policy,
  safeSummary: buildSafeSummary(request, 'none', 'none', []),
});

const buildLiveKisNotAllowedResult = (
  request: SimilarityProviderIntegrationRequest,
  policy: SimilarityProviderIntegrationPolicy,
): SimilarityProviderIntegrationResult => ({
  status: 'blocked',
  mode: 'feature-flag-off',
  source: request.source,
  providerStatus: 'blocked',
  engineStatus: 'not_run',
  normalizedBarsAvailable: false,
  normalizedBarCountBucket: 'none',
  matchCountBucket: 'none',
  warnings: ['The "kis-normalized-future" source is not enabled in this phase. Live KIS remains out of scope.'],
  safeMessage: 'This provider source is not yet enabled.',
  dataPolicy: policy,
  safeSummary: buildSafeSummary(request, 'none', 'none', []),
});

const buildInsufficientBarsResult = (
  request: SimilarityProviderIntegrationRequest,
  policy: SimilarityProviderIntegrationPolicy,
  barCount: number,
): SimilarityProviderIntegrationResult => {
  const normalizedBarCountBucket = bucketProviderNormalizedBarCount(barCount);
  return {
    status: 'blocked',
    mode: 'owner-local-mocked',
    source: request.source,
    providerStatus: barCount > 0 ? 'ready' : 'blocked',
    engineStatus: 'not_run',
    normalizedBarsAvailable: barCount > 0,
    normalizedBarCountBucket,
    matchCountBucket: 'none',
    warnings: [
      `Insufficient normalized bars for the requested base window (need at least ${
        MIN_SUFFICIENT_BAR_MULTIPLIER * request.baseWindow
      }).`,
    ],
    safeMessage: 'Not enough normalized bars were available to run the similarity engine.',
    dataPolicy: policy,
    safeSummary: buildSafeSummary(request, normalizedBarCountBucket, 'none', []),
  };
};

const buildEngineErrorResult = (
  request: SimilarityProviderIntegrationRequest,
  policy: SimilarityProviderIntegrationPolicy,
  barCount: number,
): SimilarityProviderIntegrationResult => {
  const normalizedBarCountBucket = bucketProviderNormalizedBarCount(barCount);
  return {
    status: 'engine_error',
    mode: 'owner-local-mocked',
    source: request.source,
    providerStatus: 'ready',
    engineStatus: 'error',
    normalizedBarsAvailable: barCount > 0,
    normalizedBarCountBucket,
    matchCountBucket: 'none',
    warnings: ['The similarity engine raised an unexpected error while processing the supplied bars.'],
    safeMessage: 'The similarity engine could not process the supplied bars.',
    dataPolicy: policy,
    safeSummary: buildSafeSummary(request, normalizedBarCountBucket, 'none', []),
  };
};

/**
 * Validates provider-compatible bars, then runs the real deterministic similarity engine
 * against them. Never calls `fetch`, never reads `process.env`, never imports a KIS client.
 */
export const runSimilarityProviderIntegrationWithBars = (
  request: SimilarityProviderIntegrationRequest,
  bars: OhlcBar[],
  policy: SimilarityProviderIntegrationPolicy,
): SimilarityProviderIntegrationResult => {
  if (!policy.enabled) {
    return buildDisabledResult(request, policy);
  }

  if (request.source === 'kis-normalized-future' && !policy.allowLiveKis) {
    return buildLiveKisNotAllowedResult(request, policy);
  }

  const safeBars = Array.isArray(bars) ? bars : [];
  if (safeBars.length < request.baseWindow * MIN_SUFFICIENT_BAR_MULTIPLIER) {
    return buildInsufficientBarsResult(request, policy, safeBars.length);
  }

  let engineResult: SimilarityAnalysisResult;
  try {
    engineResult = scanSimilarity(safeBars, {
      baseWindow: request.baseWindow,
      forwardWindows: request.forwardWindows,
      topK: request.topK,
      similarityMethod: 'return_correlation_rmse',
      excludeRecentBars: 0,
    });
  } catch {
    return buildEngineErrorResult(request, policy, safeBars.length);
  }

  const normalizedBarCountBucket = bucketProviderNormalizedBarCount(safeBars.length);

  if (engineResult.currentWindow.bars.length === 0) {
    return buildInsufficientBarsResult(request, policy, safeBars.length);
  }

  const matchCountBucket = bucketSimilarityMatchCount(engineResult.matches.length);

  return {
    status: 'ready',
    mode: 'owner-local-mocked',
    source: request.source,
    providerStatus: 'ready',
    engineStatus: 'ready',
    normalizedBarsAvailable: true,
    normalizedBarCountBucket,
    matchCountBucket,
    warnings: engineResult.warnings,
    safeMessage: 'Similarity provider integration succeeded using provider-compatible bars.',
    dataPolicy: policy,
    safeSummary: buildSafeSummary(request, normalizedBarCountBucket, matchCountBucket, engineResult.warnings),
    result: request.source === 'mocked-provider-compatible' ? engineResult : undefined,
  };
};

/**
 * Builds a deterministic set of mocked, provider-compatible bars and runs the integration
 * against them. Uses the existing mocked KIS OHLC fixtures/adapter mapping. Never live KIS.
 */
export const runMockedProviderCompatibleSimilarityIntegration = (
  request?: Partial<SimilarityProviderIntegrationRequest>,
  policy: SimilarityProviderIntegrationPolicy = buildOwnerLocalMockedSimilarityProviderIntegrationPolicy(),
): SimilarityProviderIntegrationResult => {
  const normalizedRequest = normalizeSimilarityProviderIntegrationRequest({
    ...request,
    source: 'mocked-provider-compatible',
  });

  const normalizedDailyInput = buildMockedNormalizedDailyOhlcInput(80);
  const { bars } = toSimilarityOhlcBarsFromNormalizedDailyBars(normalizedDailyInput, {
    market: normalizedRequest.market,
    symbol: normalizedRequest.symbol,
  });

  return runSimilarityProviderIntegrationWithBars(normalizedRequest, bars, policy);
};
