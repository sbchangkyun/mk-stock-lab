/**
 * Server-only auth/usage runtime bridge for Chart Similarity execution (Phase 3FB-C-ALT).
 *
 * Evaluates the existing, disabled-by-default `evaluateSimilarityExecutionGuard`
 * (`similarityExecutionGuard.ts`, Phase 3EY-C) against a caller-supplied mock auth/usage request
 * before allowing the Phase 3FB-A mocked, provider-compatible similarity integration
 * (`similarityProviderIntegration.ts`) to run. This is NOT a real auth provider and NOT real usage
 * persistence — mock auth/usage state is caller-supplied only, never a real session, cookie,
 * header, or store. This module never calls `fetch`, never reads `process.env`/`.env`, never
 * imports a KIS provider/client module, and is never wired into a page in this phase.
 */

import type {
  SimilarityExecutionGuardPolicy,
  SimilarityExecutionGuardRequest,
  SimilarityExecutionUsageSnapshot,
} from './similarityExecutionGuardTypes';
import { evaluateSimilarityExecutionGuard } from './similarityExecutionGuard';
import { runMockedProviderCompatibleSimilarityIntegration } from './similarityProviderIntegration';
import type {
  SimilarityAuthUsageBridgeAuthState,
  SimilarityAuthUsageBridgeMockAuth,
  SimilarityAuthUsageBridgeMockUsage,
  SimilarityAuthUsageBridgeNormalizedRequest,
  SimilarityAuthUsageBridgePolicy,
  SimilarityAuthUsageBridgeRequestBody,
  SimilarityAuthUsageBridgeResult,
  SimilarityAuthUsageBridgeRole,
  SimilarityAuthUsageBridgeUsageRemainingBucket,
  SimilarityAuthUsageBridgeUsageWindow,
} from './similarityAuthUsageRouteBridgeTypes';

const ALLOWED_ROLES: ReadonlyArray<SimilarityAuthUsageBridgeRole> = [
  'anonymous',
  'authenticated',
  'beta',
  'owner',
  'admin',
];

const ALLOWED_AUTH_STATES: ReadonlyArray<SimilarityAuthUsageBridgeAuthState> = ['anonymous', 'authenticated'];

const ALLOWED_USAGE_WINDOWS: ReadonlyArray<SimilarityAuthUsageBridgeUsageWindow> = ['daily', 'monthly'];

const ALLOWED_ASSET_TYPES: ReadonlyArray<'stock' | 'etf'> = ['stock', 'etf'];

const DEFAULT_SYMBOL = 'MOCKSYM';
const DEFAULT_ASSET_TYPE: 'stock' | 'etf' = 'stock';

/** Deterministic fallback timestamp — this module never calls `Date.now()` or `new Date()`. */
const DETERMINISTIC_REQUESTED_AT_ISO = '2020-01-01T00:00:00.000Z';

/** Default, safe bridge policy. Every call returns a fresh, deterministic object. */
export const buildDefaultSimilarityAuthUsageRouteBridgePolicy = (): SimilarityAuthUsageBridgePolicy => ({
  ownerLocalOnly: true,
  allowLiveKis: false,
  allowPublicExecution: false,
  allowBetaExecutionByDefault: false,
  allowRouteSuccessOnlyAfterGuardAllowed: true,
  allowRealAuthProvider: false,
  allowUsagePersistence: false,
  allowRawProviderPayload: false,
  allowCredentialEcho: false,
  allowEnvEcho: false,
  allowAccountTradingFields: false,
  notes: [
    'Owner-local auth/usage bridge only. Mock auth/usage state is caller-supplied, never a real session or store.',
    'Mocked provider-compatible execution is only run after evaluateSimilarityExecutionGuard returns an allowed status.',
    'This module never reads process.env or .env values.',
  ],
});

const isSafeFiniteNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value >= 0;

const isValidMockAuth = (value: unknown): value is SimilarityAuthUsageBridgeMockAuth => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    ALLOWED_AUTH_STATES.includes(record.state as SimilarityAuthUsageBridgeAuthState) &&
    ALLOWED_ROLES.includes(record.role as SimilarityAuthUsageBridgeRole)
  );
};

/**
 * Shape-only usage check: enum window, non-negative integer used/limit/remaining. Deliberately
 * does NOT enforce `used <= limit` / `remaining <= limit` — that cross-field consistency check is
 * a deeper validation step performed only by `normalizeSimilarityAuthUsageBridgeRequestBody`, so
 * that an internally-inconsistent (but recognizably bridge-shaped) request still reaches the
 * bridge and receives a sanitized `blocked` response instead of silently falling through to the
 * unrelated default route branch.
 */
const isValidMockUsage = (value: unknown): value is SimilarityAuthUsageBridgeMockUsage => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (!ALLOWED_USAGE_WINDOWS.includes(record.window as SimilarityAuthUsageBridgeUsageWindow)) return false;
  if (!isSafeFiniteNonNegativeInteger(record.used)) return false;
  if (!isSafeFiniteNonNegativeInteger(record.limit)) return false;
  if (!isSafeFiniteNonNegativeInteger(record.remaining)) return false;
  return true;
};

/** True only if a normalized mock usage snapshot is internally consistent. */
const isConsistentMockUsage = (mockUsage: SimilarityAuthUsageBridgeMockUsage): boolean => {
  const used = mockUsage.used;
  const limit = mockUsage.limit;
  const remaining = mockUsage.remaining;
  if (used > limit) return false;
  if (remaining > limit) return false;
  return true;
};

/**
 * True only for an explicit owner-local auth/usage bridge request body: `mode`, `source`,
 * `ownerLocalAuthUsageBridge`, `mockAuth`, and `mockUsage` must all be present and shape-valid.
 * Partial or missing fields fall through to `false` — this never throws for malformed input. This
 * is a shape check only; cross-field usage consistency (`used <= limit`, `remaining <= limit`) is
 * validated separately by `normalizeSimilarityAuthUsageBridgeRequestBody`, so a bridge-shaped
 * request with inconsistent usage numbers still reaches the bridge for a sanitized `blocked`
 * response rather than falling through to the unrelated default route branch.
 */
export const isOwnerLocalAuthUsageBridgeRequestBody = (
  body: unknown,
): body is SimilarityAuthUsageBridgeRequestBody => {
  if (body === null || typeof body !== 'object') return false;
  const record = body as Record<string, unknown>;
  if (record.mode !== 'owner-local-auth-usage-bridge') return false;
  if (record.source !== 'mocked-provider-compatible') return false;
  if (record.ownerLocalAuthUsageBridge !== true) return false;
  if (!isValidMockAuth(record.mockAuth)) return false;
  if (!isValidMockUsage(record.mockUsage)) return false;
  if (record.symbol !== undefined && typeof record.symbol !== 'string') return false;
  if (record.assetType !== undefined && !ALLOWED_ASSET_TYPES.includes(record.assetType as 'stock' | 'etf')) {
    return false;
  }
  return true;
};

/**
 * Normalizes a valid, internally-consistent bridge request body into a safe shape. Returns `null`
 * for an invalid shape or for internally-inconsistent usage numbers (e.g. `used > limit`).
 */
export const normalizeSimilarityAuthUsageBridgeRequestBody = (
  body: unknown,
): SimilarityAuthUsageBridgeNormalizedRequest | null => {
  if (!isOwnerLocalAuthUsageBridgeRequestBody(body)) return null;
  const record = body as Record<string, unknown>;
  const mockUsage = record.mockUsage as SimilarityAuthUsageBridgeMockUsage;
  if (!isConsistentMockUsage(mockUsage)) return null;
  const rawSymbol = record.symbol;
  const symbol = typeof rawSymbol === 'string' && rawSymbol.trim().length > 0 ? rawSymbol.trim() : DEFAULT_SYMBOL;
  const assetType = ALLOWED_ASSET_TYPES.includes(record.assetType as 'stock' | 'etf')
    ? (record.assetType as 'stock' | 'etf')
    : DEFAULT_ASSET_TYPE;
  return {
    symbol,
    assetType,
    mockAuth: record.mockAuth as SimilarityAuthUsageBridgeMockAuth,
    mockUsage: record.mockUsage as SimilarityAuthUsageBridgeMockUsage,
  };
};

/** Maps a normalized bridge request to the existing similarity execution guard request shape. */
export const mapBridgeRequestToSimilarityExecutionGuardRequest = (
  normalized: SimilarityAuthUsageBridgeNormalizedRequest,
): SimilarityExecutionGuardRequest => ({
  purpose: 'chart-similarity',
  source: 'owner-local',
  role: normalized.mockAuth.role,
  authState: normalized.mockAuth.state === 'authenticated' ? 'authenticated' : 'anonymous',
  symbol: normalized.symbol,
  market: 'KR',
  assetType: normalized.assetType,
  requestedAtIso: DETERMINISTIC_REQUESTED_AT_ISO,
});

/** Maps a normalized bridge request's mock usage to the existing usage snapshot shape. */
export const mapBridgeUsageToGuardUsageSnapshot = (
  normalized: SimilarityAuthUsageBridgeNormalizedRequest,
): SimilarityExecutionUsageSnapshot => ({
  window: normalized.mockUsage.window,
  used: normalized.mockUsage.used,
  limit: normalized.mockUsage.limit,
  remaining: normalized.mockUsage.remaining,
});

const bucketUsageRemaining = (remaining: number, limit: number): SimilarityAuthUsageBridgeUsageRemainingBucket => {
  if (!Number.isFinite(remaining) || !Number.isFinite(limit) || limit <= 0) return 'unknown';
  if (remaining <= 0) return 'none';
  if (remaining <= Math.ceil(limit * 0.2)) return 'low';
  return 'available';
};

/**
 * Builds the guard policy used only for owner-local auth/usage bridge evaluation. Enables guard
 * evaluation (`enabled: true`) but keeps live/public KIS execution permanently blocked
 * (`allowPublicKisExecution: false`, fixed by `SimilarityExecutionGuardPolicy` itself).
 */
const buildBridgeGuardPolicy = (): SimilarityExecutionGuardPolicy => ({
  enabled: true,
  requireAuth: true,
  requireUsageGuard: true,
  allowAnonymousMockedPreview: true,
  allowPublicKisExecution: false,
  allowOwnerLocalBypass: false,
  defaultDailyLimit: 3,
  betaDailyLimit: 10,
  ownerDailyLimit: 50,
  adminDailyLimit: 100,
  featureFlagName: 'CHART_AI_SIMILARITY_EXECUTION_ENABLED',
  notes: [
    'Owner-local auth/usage bridge evaluation policy. Enabled only for this bridge path evaluation.',
    'allowPublicKisExecution remains false; live KIS execution is never enabled by this policy.',
  ],
});

const buildBridgeBlockedResult = (
  guardStatus: SimilarityAuthUsageBridgeResult['guardStatus'],
  safeMessage: string,
  policy: SimilarityAuthUsageBridgePolicy,
  normalizedRequest: SimilarityAuthUsageBridgeNormalizedRequest | null,
  errorCode?: string,
): SimilarityAuthUsageBridgeResult => ({
  ok: false,
  guardStatus,
  authState: normalizedRequest?.mockAuth.state ?? 'anonymous',
  role: normalizedRequest?.mockAuth.role ?? 'anonymous',
  usageWindow: normalizedRequest?.mockUsage.window ?? 'daily',
  usageRemainingBucket: normalizedRequest
    ? bucketUsageRemaining(normalizedRequest.mockUsage.remaining, normalizedRequest.mockUsage.limit)
    : 'unknown',
  safeMessage,
  ...(errorCode ? { errorCode } : {}),
  policy,
  integrationResult: null,
  normalizedRequest,
});

/**
 * Runs the owner-local auth/usage bridge: request validation → auth mapping → usage mapping →
 * `evaluateSimilarityExecutionGuard` → (only if guard-allowed) the Phase 3FB-A mocked,
 * provider-compatible similarity integration. Never throws for expected bad input; returns a
 * structured, non-ok result instead. Never calls live KIS, `fetch`, or `process.env`.
 */
export const runSimilarityAuthUsageRouteBridge = (
  body: unknown,
  policy: SimilarityAuthUsageBridgePolicy = buildDefaultSimilarityAuthUsageRouteBridgePolicy(),
): SimilarityAuthUsageBridgeResult => {
  const normalizedRequest = normalizeSimilarityAuthUsageBridgeRequestBody(body);

  if (!normalizedRequest) {
    return buildBridgeBlockedResult(
      'blocked',
      'Owner-local auth/usage bridge request could not be processed.',
      policy,
      null,
      'invalid_bridge_request',
    );
  }

  const guardRequest = mapBridgeRequestToSimilarityExecutionGuardRequest(normalizedRequest);
  const usageSnapshot = mapBridgeUsageToGuardUsageSnapshot(normalizedRequest);
  const guardResult = evaluateSimilarityExecutionGuard(guardRequest, {
    policy: buildBridgeGuardPolicy(),
    usage: usageSnapshot,
  });

  if (!guardResult.ok) {
    return buildBridgeBlockedResult(
      guardResult.status,
      guardResult.safeMessage,
      policy,
      normalizedRequest,
      guardResult.errorCode,
    );
  }

  const integrationResult = runMockedProviderCompatibleSimilarityIntegration({ symbol: normalizedRequest.symbol });
  const usageRemainingBucket = bucketUsageRemaining(
    normalizedRequest.mockUsage.remaining,
    normalizedRequest.mockUsage.limit,
  );

  if (integrationResult.status !== 'ready') {
    return {
      ok: false,
      guardStatus: guardResult.status,
      authState: normalizedRequest.mockAuth.state,
      role: normalizedRequest.mockAuth.role,
      usageWindow: normalizedRequest.mockUsage.window,
      usageRemainingBucket,
      safeMessage: integrationResult.safeMessage,
      errorCode: integrationResult.status,
      policy,
      integrationResult,
      normalizedRequest,
    };
  }

  return {
    ok: true,
    guardStatus: guardResult.status,
    authState: normalizedRequest.mockAuth.state,
    role: normalizedRequest.mockAuth.role,
    usageWindow: normalizedRequest.mockUsage.window,
    usageRemainingBucket,
    safeMessage: integrationResult.safeMessage,
    policy,
    integrationResult,
    normalizedRequest,
  };
};
