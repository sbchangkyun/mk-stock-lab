/**
 * Server-only mocked API response builder for Chart Similarity execution (Phase 3EY-D).
 *
 * Converts a `SimilarityExecutionGuardResult` (Phase 3EY-C) into a sanitized
 * `SimilarityApiResponse` shape. This builder never calls the real similarity engine, never
 * calls KIS, never calls `fetch`, never reads `process.env`/`.env`, never reads or writes usage
 * state, and never persists anything. All success-path data is deterministic mocked planning
 * data only. It never throws for an expected guard result.
 */

import type {
  SimilarityExecutionGuardPolicy,
  SimilarityExecutionGuardRequest,
  SimilarityExecutionGuardResult,
  SimilarityExecutionGuardStatus,
  SimilarityExecutionUsageSnapshot,
} from './similarityExecutionGuardTypes';
import { evaluateSimilarityExecutionGuard } from './similarityExecutionGuard';
import type {
  SimilarityApiAuthUsageBridgeSuccessData,
  SimilarityApiMockedSuccessData,
  SimilarityApiOwnerLocalMockedSuccessData,
  SimilarityApiResponse,
  SimilarityApiResponseMode,
  SimilarityApiResponseStatus,
  SimilarityApiSafeError,
  SimilarityApiSafeRequest,
  SimilarityApiSafeUsage,
} from './similarityApiResponseTypes';
import type { SimilarityProviderIntegrationRequest, SimilarityProviderIntegrationResult } from './similarityProviderIntegrationTypes';
import { runMockedProviderCompatibleSimilarityIntegration } from './similarityProviderIntegration';
import type { SimilarityAuthUsageBridgeResult } from './similarityAuthUsageRouteBridgeTypes';
import { isOwnerLocalAuthUsageBridgeRequestBody, runSimilarityAuthUsageRouteBridge } from './similarityAuthUsageRouteBridge';

/** Sanitizes a guard request down to only the fields safe to echo back in an API response. */
export const toSimilarityApiSafeRequest = (
  request: SimilarityExecutionGuardRequest,
): SimilarityApiSafeRequest => ({
  purpose: 'chart-similarity',
  source: request.source,
  symbol: request.symbol,
  market: 'KR',
  assetType: request.assetType,
});

/** Sanitizes a guard usage snapshot down to only the fields safe to echo back in an API response. */
export const toSimilarityApiSafeUsage = (
  usage: SimilarityExecutionUsageSnapshot | null,
): SimilarityApiSafeUsage | null => {
  if (!usage) return null;
  return {
    window: usage.window,
    used: usage.used,
    limit: usage.limit,
    remaining: usage.remaining,
    ...(usage.resetAtIso ? { resetAtIso: usage.resetAtIso } : {}),
  };
};

/** Maps a guard status to its corresponding API response status. */
export const mapGuardStatusToApiStatus = (
  status: SimilarityExecutionGuardStatus,
): SimilarityApiResponseStatus => {
  if (status === 'allowed') return 'success';
  return status;
};

const DEFAULT_ERROR_CODE_BY_STATUS: Record<Exclude<SimilarityExecutionGuardStatus, 'allowed'>, string> = {
  blocked: 'blocked_request',
  auth_required: 'auth_required',
  usage_limited: 'usage_limited',
  feature_disabled: 'feature_disabled',
  not_configured: 'not_configured',
  error: 'internal_error',
};

const isRetryableStatus = (status: SimilarityExecutionGuardStatus): boolean =>
  status === 'usage_limited' || status === 'error';

/** Builds a sanitized, structured error object from a non-ok guard result. Returns `null` for an ok result. */
export const buildSimilarityApiErrorFromGuard = (
  guardResult: SimilarityExecutionGuardResult,
): SimilarityApiSafeError | null => {
  if (guardResult.ok) return null;
  const status = guardResult.status;
  const code =
    guardResult.errorCode ?? DEFAULT_ERROR_CODE_BY_STATUS[status as Exclude<SimilarityExecutionGuardStatus, 'allowed'>];
  return {
    code,
    message: guardResult.safeMessage,
    retryable: isRetryableStatus(status),
  };
};

/** Builds deterministic mocked planning data for a successful (guard-allowed) response. */
export const buildMockedSimilarityApiSuccessData = (
  request: SimilarityApiSafeRequest,
): SimilarityApiMockedSuccessData => ({
  summary: {
    baseWindow: 20,
    lookbackYears: 5,
    matchCount: 3,
    disclaimer: 'Mocked planning data only. Not real market data, not investment advice.',
  },
  matches: [
    {
      rank: 1,
      periodStart: '2016-03-01',
      periodEnd: '2016-03-28',
      similarityScore: 0.91,
      forwardReturn5d: 0.012,
      forwardReturn20d: 0.034,
      maxDrawdown: -0.021,
    },
    {
      rank: 2,
      periodStart: '2018-11-05',
      periodEnd: '2018-12-03',
      similarityScore: 0.86,
      forwardReturn5d: -0.006,
      forwardReturn20d: 0.011,
      maxDrawdown: -0.045,
    },
    {
      rank: 3,
      periodStart: '2021-07-12',
      periodEnd: '2021-08-09',
      similarityScore: 0.79,
      forwardReturn5d: 0.004,
      forwardReturn20d: -0.008,
      maxDrawdown: -0.033,
    },
  ],
  narrative: {
    title: `Mocked similarity plan preview for ${request.symbol}`,
    body:
      'This is a deterministic, mocked preview of how a future Chart Similarity API response ' +
      'could be shaped once a real, separately authorized route is built. No real market data, ' +
      'KIS data, or auth data was used to produce this response.',
    limitations: [
      'Mocked data only — not derived from any real price series.',
      'Not investment advice.',
      'Auth and usage state are simulated by the guard evaluator, not a real session or store.',
    ],
  },
});

const resolveMode = (
  guardResult: SimilarityExecutionGuardResult,
  apiStatus: SimilarityApiResponseStatus,
): SimilarityApiResponseMode => {
  if (apiStatus === 'success') {
    return guardResult.request.source === 'mocked' ? 'mocked-plan' : 'guard-allowed';
  }
  if (apiStatus === 'feature_disabled') return 'feature-flag-off';
  return 'guard-blocked';
};

/**
 * Converts a `SimilarityExecutionGuardResult` into a sanitized `SimilarityApiResponse`. Never
 * calls the similarity engine, KIS, or `fetch`; never reads env or usage state; never throws for
 * an expected guard result.
 */
export const buildSimilarityApiResponseFromGuard = (
  guardResult: SimilarityExecutionGuardResult,
): SimilarityApiResponse => {
  const apiStatus = mapGuardStatusToApiStatus(guardResult.status);
  const request = toSimilarityApiSafeRequest(guardResult.request);
  const usage = toSimilarityApiSafeUsage(guardResult.usage);
  const mode = resolveMode(guardResult, apiStatus);
  const warnings = [...guardResult.warnings];

  if (guardResult.ok) {
    return {
      ok: true,
      status: 'success',
      mode,
      request,
      usage,
      data: buildMockedSimilarityApiSuccessData(request),
      error: null,
      warnings,
    };
  }

  return {
    ok: false,
    status: apiStatus,
    mode,
    request,
    usage,
    data: null,
    error: buildSimilarityApiErrorFromGuard(guardResult),
    warnings,
  };
};

/**
 * Convenience helper: builds a mocked, guard-allowed success `SimilarityApiResponse` directly
 * from a guard request/options pair, using the real guard evaluator.
 */
export const buildMockedAllowedSimilarityApiResponse = (
  request: SimilarityExecutionGuardRequest,
  options?: {
    policy?: SimilarityExecutionGuardPolicy;
    usage?: SimilarityExecutionUsageSnapshot | null;
  },
): SimilarityApiResponse => {
  const guardResult = evaluateSimilarityExecutionGuard(request, options);
  return buildSimilarityApiResponseFromGuard(guardResult);
};

/**
 * Owner-local mocked provider-compatible route path (Phase 3FB-B).
 *
 * This is NOT real auth and NOT production authorization — it is only an explicit, non-secret,
 * owner-local mocked route path for development verification of the Phase 3FB-A provider
 * integration through the actual API route contract. It never calls live KIS, never reads
 * `process.env`/`.env`, and never exposes a raw provider payload or real market data.
 */
export const isOwnerLocalMockedSimilarityApiRequestBody = (body: unknown): boolean => {
  if (body === null || typeof body !== 'object') return false;
  const record = body as Record<string, unknown>;
  return (
    record.mode === 'owner-local-mocked' &&
    record.source === 'mocked-provider-compatible' &&
    record.ownerLocalMocked === true
  );
};

/** Extracts only the safe, non-secret integration request fields from a raw request body. */
export const extractOwnerLocalMockedIntegrationRequestFields = (
  body: unknown,
): Partial<SimilarityProviderIntegrationRequest> => {
  if (body === null || typeof body !== 'object') return {};
  const record = body as Record<string, unknown>;
  return {
    symbol: typeof record.symbol === 'string' ? record.symbol : undefined,
    baseWindow: typeof record.baseWindow === 'number' ? record.baseWindow : undefined,
    forwardWindows: Array.isArray(record.forwardWindows) ? (record.forwardWindows as number[]) : undefined,
    topK: typeof record.topK === 'number' ? record.topK : undefined,
  };
};

const OWNER_LOCAL_MOCKED_DISCLAIMER =
  'Owner-local mocked similarity result. Synthetic, provider-compatible sample data only — ' +
  'not real KIS market data, not investment advice. This is not real auth or production ' +
  'authorization; it is an owner-local mocked route path for development verification only.';

const mapIntegrationStatusToApiStatus = (
  status: SimilarityProviderIntegrationResult['status'],
): SimilarityApiResponseStatus => {
  switch (status) {
    case 'ready':
      return 'success';
    case 'blocked':
      return 'blocked';
    case 'disabled':
      return 'feature_disabled';
    case 'provider_error':
    case 'engine_error':
    default:
      return 'error';
  }
};

const buildOwnerLocalMockedSimilarityApiSuccessData = (
  integrationResult: SimilarityProviderIntegrationResult,
): SimilarityApiOwnerLocalMockedSuccessData => ({
  engineStatus: integrationResult.engineStatus,
  normalizedBarsAvailable: integrationResult.normalizedBarsAvailable,
  normalizedBarCountBucket: integrationResult.normalizedBarCountBucket,
  matchCountBucket: integrationResult.matchCountBucket,
  disclaimer: OWNER_LOCAL_MOCKED_DISCLAIMER,
  dataPolicy: {
    ownerLocalOnly: integrationResult.dataPolicy.ownerLocalOnly,
    allowLiveKis: integrationResult.dataPolicy.allowLiveKis,
    allowRouteSuccess: integrationResult.dataPolicy.allowRouteSuccess,
    allowPublicExecution: integrationResult.dataPolicy.allowPublicExecution,
    allowBetaExecution: integrationResult.dataPolicy.allowBetaExecution,
  },
});

/**
 * Runs the Phase 3FB-A mocked, provider-compatible similarity integration and packages the
 * result into a sanitized `SimilarityApiResponse` for the owner-local mocked route path. Never
 * calls live KIS, never calls `fetch`, never reads `process.env`/`.env`.
 */
export const buildOwnerLocalMockedSimilarityApiResponse = (body: unknown): SimilarityApiResponse => {
  const integrationRequestFields = extractOwnerLocalMockedIntegrationRequestFields(body);
  const integrationResult = runMockedProviderCompatibleSimilarityIntegration(integrationRequestFields);

  const request: SimilarityApiSafeRequest = {
    purpose: 'chart-similarity',
    source: 'mocked-provider-compatible',
    symbol: integrationResult.safeSummary.symbol,
    market: 'KR',
    assetType: 'stock',
  };

  if (integrationResult.status === 'ready') {
    return {
      ok: true,
      status: 'success',
      mode: 'owner-local-mocked',
      request,
      usage: null,
      data: buildOwnerLocalMockedSimilarityApiSuccessData(integrationResult),
      error: null,
      warnings: integrationResult.warnings,
    };
  }

  const apiStatus = mapIntegrationStatusToApiStatus(integrationResult.status);
  return {
    ok: false,
    status: apiStatus,
    mode: 'owner-local-mocked',
    request,
    usage: null,
    data: null,
    error: {
      code: integrationResult.status,
      message: integrationResult.safeMessage,
      retryable: integrationResult.status === 'engine_error' || integrationResult.status === 'provider_error',
    },
    warnings: integrationResult.warnings,
  };
};

/**
 * Owner-local auth/usage runtime bridge route path (Phase 3FB-C-ALT).
 *
 * This is NOT real auth and NOT production authorization — mock auth/usage state is
 * caller-supplied only. It evaluates the existing `evaluateSimilarityExecutionGuard` before
 * allowing the Phase 3FB-A mocked, provider-compatible similarity integration to run. It never
 * calls live KIS, never reads `process.env`/`.env`, and never exposes a raw provider payload,
 * real market data, or account/trading field.
 */
export const isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody = (body: unknown): boolean =>
  isOwnerLocalAuthUsageBridgeRequestBody(body);

const OWNER_LOCAL_AUTH_USAGE_BRIDGE_DISCLAIMER =
  'Owner-local auth/usage bridge result. Synthetic, provider-compatible sample data only — not ' +
  'real KIS market data, not investment advice. Mock auth/usage state is caller-supplied for ' +
  'local development verification only; this is not a real session or usage store.';

const buildOwnerLocalAuthUsageBridgeSimilarityApiSuccessData = (
  bridgeResult: SimilarityAuthUsageBridgeResult,
): SimilarityApiAuthUsageBridgeSuccessData => {
  const integrationResult = bridgeResult.integrationResult;
  return {
    guardStatus: bridgeResult.guardStatus,
    authState: bridgeResult.authState,
    role: bridgeResult.role,
    usageWindow: bridgeResult.usageWindow,
    usageRemainingBucket: bridgeResult.usageRemainingBucket,
    engineStatus: integrationResult?.engineStatus ?? 'not_run',
    normalizedBarsAvailable: integrationResult?.normalizedBarsAvailable ?? false,
    normalizedBarCountBucket: integrationResult?.normalizedBarCountBucket ?? 'none',
    matchCountBucket: integrationResult?.matchCountBucket ?? 'none',
    disclaimer: OWNER_LOCAL_AUTH_USAGE_BRIDGE_DISCLAIMER,
    dataPolicy: integrationResult
      ? {
          ownerLocalOnly: integrationResult.dataPolicy.ownerLocalOnly,
          allowLiveKis: integrationResult.dataPolicy.allowLiveKis,
          allowRouteSuccess: integrationResult.dataPolicy.allowRouteSuccess,
          allowPublicExecution: integrationResult.dataPolicy.allowPublicExecution,
          allowBetaExecution: integrationResult.dataPolicy.allowBetaExecution,
        }
      : {
          ownerLocalOnly: true,
          allowLiveKis: false,
          allowRouteSuccess: false,
          allowPublicExecution: false,
          allowBetaExecution: false,
        },
  };
};

/** Maps an owner-local auth/usage bridge API response status to its HTTP status code. */
export const mapAuthUsageBridgeApiStatusToHttpStatus = (status: SimilarityApiResponseStatus): number => {
  switch (status) {
    case 'success':
      return 200;
    case 'auth_required':
      return 401;
    case 'usage_limited':
      return 429;
    case 'feature_disabled':
      return 503;
    case 'blocked':
    case 'not_configured':
    case 'error':
    default:
      return 422;
  }
};

/**
 * Runs the owner-local auth/usage runtime bridge and packages the result into a sanitized
 * `SimilarityApiResponse`. Never calls live KIS, never calls `fetch`, never reads
 * `process.env`/`.env`.
 */
export const buildOwnerLocalAuthUsageBridgeSimilarityApiResponse = (body: unknown): SimilarityApiResponse => {
  const bridgeResult = runSimilarityAuthUsageRouteBridge(body);
  const apiStatus = mapGuardStatusToApiStatus(bridgeResult.guardStatus);

  const symbol = bridgeResult.normalizedRequest?.symbol ?? 'MOCKSYM';
  const assetType = bridgeResult.normalizedRequest?.assetType ?? 'stock';

  const request: SimilarityApiSafeRequest = {
    purpose: 'chart-similarity',
    source: 'mocked-provider-compatible',
    symbol,
    market: 'KR',
    assetType,
  };

  if (bridgeResult.ok && apiStatus === 'success') {
    return {
      ok: true,
      status: 'success',
      mode: 'owner-local-auth-usage-bridge',
      request,
      usage: null,
      data: buildOwnerLocalAuthUsageBridgeSimilarityApiSuccessData(bridgeResult),
      error: null,
      warnings: [],
    };
  }

  const resolvedStatus: SimilarityApiResponseStatus = apiStatus === 'success' ? 'error' : apiStatus;
  return {
    ok: false,
    status: resolvedStatus,
    mode: 'owner-local-auth-usage-bridge',
    request,
    usage: null,
    data: null,
    error: {
      code: bridgeResult.errorCode ?? resolvedStatus,
      message: bridgeResult.safeMessage,
      retryable: resolvedStatus === 'usage_limited' || resolvedStatus === 'error',
    },
    warnings: [],
  };
};
