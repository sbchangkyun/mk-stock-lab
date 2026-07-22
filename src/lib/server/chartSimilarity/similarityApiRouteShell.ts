/**
 * Server-only API route shell helpers for Chart Similarity execution (Phase 3EZ-C).
 *
 * These helpers back a minimal authenticated API route shell that is disabled by default. They
 * are pure and deterministic: no cookies, no headers, no localStorage/sessionStorage, no
 * `process.env`/`.env`, no network calls, no database/cache access, and no auth or KIS provider
 * import. `buildFeatureFlagOffSimilarityApiRouteShellResult` is constructed directly from the
 * caller-supplied request rather than by delegating to `evaluateSimilarityExecutionGuard`,
 * because the guard's default policy still allows an anonymous mocked preview to succeed for
 * `source: 'mocked'` — a success path this phase's route shell must never reach
 * (`allowMockedSuccess: false`). Building the sanitized response directly guarantees the route
 * shell always resolves to `feature_disabled` / `feature-flag-off` for every input in this phase.
 */

import type {
  SimilarityApiRouteShellPolicy,
  SimilarityApiRouteShellRequest,
  SimilarityApiRouteShellResult,
} from './similarityApiRouteShellTypes';
import type { SimilarityApiResponse, SimilarityApiSafeRequest } from './similarityApiResponseTypes';

const ALLOWED_SOURCES: ReadonlyArray<SimilarityApiRouteShellRequest['source']> = [
  'mocked',
  'kis-normalized',
  'owner-local',
];

const ALLOWED_ASSET_TYPES: ReadonlyArray<SimilarityApiRouteShellRequest['assetType']> = [
  'stock',
  'etf',
];

const DEFAULT_SYMBOL = 'UNKNOWN';
const DEFAULT_SOURCE: SimilarityApiRouteShellRequest['source'] = 'kis-normalized';
const DEFAULT_MARKET: SimilarityApiRouteShellRequest['market'] = 'KR';
const DEFAULT_ASSET_TYPE: SimilarityApiRouteShellRequest['assetType'] = 'stock';

export const buildDefaultSimilarityApiRouteShellPolicy = (): SimilarityApiRouteShellPolicy => ({
  enabled: false,
  featureFlagName: 'CHART_AI_SIMILARITY_ROUTE_ENABLED',
  requireAuth: true,
  requireUsageStorage: true,
  allowMockedSuccess: false,
  allowLiveKisExecution: false,
  allowPublicExecution: false,
  notes: [
    'Route shell is disabled by default; real auth, usage storage, and KIS execution remain out of scope for this phase.',
    'A separately authorized phase is required before enabled may become true.',
  ],
});

const readStringField = (body: Record<string, unknown>, field: string): string | undefined => {
  const value = body[field];
  return typeof value === 'string' ? value : undefined;
};

export const normalizeSimilarityApiRouteShellRequest = (
  body: unknown,
): SimilarityApiRouteShellRequest => {
  const record = body !== null && typeof body === 'object' ? (body as Record<string, unknown>) : {};

  const rawSymbol = readStringField(record, 'symbol');
  const symbol = rawSymbol && rawSymbol.trim().length > 0 ? rawSymbol.trim().toUpperCase() : DEFAULT_SYMBOL;

  const rawSource = readStringField(record, 'source');
  const source = ALLOWED_SOURCES.includes(rawSource as SimilarityApiRouteShellRequest['source'])
    ? (rawSource as SimilarityApiRouteShellRequest['source'])
    : DEFAULT_SOURCE;

  const rawMarket = readStringField(record, 'market');
  const market = rawMarket === 'KR' ? 'KR' : DEFAULT_MARKET;

  const rawAssetType = readStringField(record, 'assetType');
  const assetType = ALLOWED_ASSET_TYPES.includes(rawAssetType as SimilarityApiRouteShellRequest['assetType'])
    ? (rawAssetType as SimilarityApiRouteShellRequest['assetType'])
    : DEFAULT_ASSET_TYPE;

  return { symbol, source, market, assetType };
};

const toSafeRequest = (request: SimilarityApiRouteShellRequest): SimilarityApiSafeRequest => ({
  purpose: 'chart-similarity',
  source: request.source,
  symbol: request.symbol,
  market: request.market,
  assetType: request.assetType,
});

export const buildFeatureFlagOffSimilarityApiRouteShellResult = (
  request: SimilarityApiRouteShellRequest,
): SimilarityApiRouteShellResult => {
  const response: SimilarityApiResponse = {
    ok: false,
    status: 'feature_disabled',
    mode: 'feature-flag-off',
    request: toSafeRequest(request),
    usage: null,
    data: null,
    error: {
      code: 'feature_disabled',
      message: 'Chart Similarity API execution is disabled by feature flag in this phase.',
      retryable: false,
    },
    warnings: [],
  };

  return {
    httpStatus: 503,
    response,
  };
};

const buildDesignOnlySimilarityApiRouteShellResult = (
  request: SimilarityApiRouteShellRequest,
): SimilarityApiRouteShellResult => {
  const response: SimilarityApiResponse = {
    ok: false,
    status: 'not_configured',
    mode: 'provider-deferred',
    request: toSafeRequest(request),
    usage: null,
    data: null,
    error: {
      code: 'not_implemented',
      message: 'Chart Similarity API route behavior is not implemented in this phase.',
      retryable: false,
    },
    warnings: [
      'Feature flag is enabled, but real route behavior requires a separately authorized phase.',
    ],
  };

  return {
    httpStatus: 501,
    response,
  };
};

export const buildSimilarityApiRouteShellResult = (
  body: unknown,
  policy: SimilarityApiRouteShellPolicy = buildDefaultSimilarityApiRouteShellPolicy(),
): SimilarityApiRouteShellResult => {
  const request = normalizeSimilarityApiRouteShellRequest(body);

  if (!policy.enabled) {
    return buildFeatureFlagOffSimilarityApiRouteShellResult(request);
  }

  return buildDesignOnlySimilarityApiRouteShellResult(request);
};
