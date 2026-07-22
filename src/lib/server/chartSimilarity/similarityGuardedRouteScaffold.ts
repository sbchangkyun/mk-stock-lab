/**
 * Server-only guarded route integration scaffold for Chart Similarity (Phase 3FC-H).
 *
 * This module is a disabled-by-default scaffold only. It recognizes a single, exact future
 * request discriminator (`mode: "guarded-runtime-scaffold"`, `source: "mocked-provider-compatible"`,
 * `guardedRuntimeScaffold: true`) and composes with the Phase 3FC-F feature flag resolver in a
 * safe, all-flags-off configuration. It never reads `process.env`, `import.meta.env`, a Vercel
 * environment variable, `.env`, cookies, or request headers, and never calls a real Supabase
 * client, a real database, live KIS, or the mocked provider-compatible similarity integration.
 *
 * `routeSuccessAllowed` and `liveKisAllowed` always remain `false` in this phase, even when the
 * request discriminator is exact-matched — this module only confirms safe blocked/disabled
 * handling, it never grants runtime capability. Composition with the Phase 3FC-C (auth subject),
 * 3FC-D (role assignment), and 3FC-E (usage store) scaffolds is deliberately deferred: those
 * statuses are reported as `*_not_evaluated` placeholders, not evaluated here.
 */

import {
  buildDefaultSimilarityFeatureFlagResolverPolicy,
  resolveSimilarityFeatureFlags,
} from './similarityFeatureFlagResolver';
import type {
  SimilarityGuardedRouteScaffoldPolicy,
  SimilarityGuardedRouteScaffoldRequestBody,
  SimilarityGuardedRouteScaffoldResult,
  SimilarityGuardedRouteScaffoldSafePolicySummary,
  SimilarityGuardedRouteScaffoldSummary,
} from './similarityGuardedRouteScaffoldTypes';

/**
 * Builds the default policy: disabled, the guarded route branch is not recognized, and every
 * runtime capability boolean is false. Every call returns a fresh, deterministic object.
 */
export const buildDefaultSimilarityGuardedRouteScaffoldPolicy = (): SimilarityGuardedRouteScaffoldPolicy => ({
  enabled: false,
  allowRouteBranchRecognition: false,
  allowRouteSuccess: false,
  allowMockedProviderExecution: false,
  allowLiveKis: false,
  allowRealSupabase: false,
  allowRealDb: false,
  allowEnvRead: false,
  allowCookieRead: false,
  allowHeaderAuthRead: false,
  allowPublicExecution: false,
  allowBetaExecution: false,
  notes: [
    'Disabled by default: the guarded-runtime-scaffold branch is not recognized and grants no runtime capability.',
    'This module never reads process.env, import.meta.env, Vercel env, .env, cookies, or request headers.',
    'Real Supabase, real database, and live KIS remain out of scope for this phase.',
  ],
});

/**
 * Builds a route-recognized policy: the branch discriminator is exact-matched and the scaffold is
 * composition-ready, but every real-capability boolean still remains false — this policy still
 * grants no route success, no mocked provider execution, no live KIS, no real Supabase/DB, and no
 * public/beta execution.
 */
export const buildRouteRecognizedSimilarityGuardedRouteScaffoldPolicy =
  (): SimilarityGuardedRouteScaffoldPolicy => ({
    ...buildDefaultSimilarityGuardedRouteScaffoldPolicy(),
    enabled: true,
    allowRouteBranchRecognition: true,
    notes: [
      'Route-recognized scaffold policy: the guarded-runtime-scaffold branch is exact-matched and composable,',
      'but allowRouteSuccess, allowMockedProviderExecution, allowLiveKis, allowRealSupabase, allowRealDb,',
      'allowEnvRead, allowCookieRead, allowHeaderAuthRead, allowPublicExecution, and allowBetaExecution',
      'all remain false. No successful similarity result can be produced through this branch.',
    ],
  });

const toSafePolicySummary = (
  policy: SimilarityGuardedRouteScaffoldPolicy,
): SimilarityGuardedRouteScaffoldSafePolicySummary => ({
  enabled: policy.enabled,
  allowRouteBranchRecognition: policy.allowRouteBranchRecognition,
  allowRouteSuccess: policy.allowRouteSuccess,
  allowMockedProviderExecution: policy.allowMockedProviderExecution,
  allowLiveKis: policy.allowLiveKis,
  allowRealSupabase: policy.allowRealSupabase,
  allowRealDb: policy.allowRealDb,
  allowEnvRead: policy.allowEnvRead,
  allowCookieRead: policy.allowCookieRead,
  allowHeaderAuthRead: policy.allowHeaderAuthRead,
  allowPublicExecution: policy.allowPublicExecution,
  allowBetaExecution: policy.allowBetaExecution,
});

const ASSET_TYPES = new Set(['stock', 'etf', 'index', 'crypto']);
const REQUESTED_CAPABILITIES = new Set(['beta_similarity', 'route_success']);

/**
 * Returns true only when `body` is an object and its three discriminator fields are an exact
 * match. A partial or malformed request (missing a field, wrong literal value, or an extra
 * conflicting discriminator) never matches.
 */
export const isGuardedRuntimeScaffoldSimilarityRequestBody = (body: unknown): boolean => {
  if (body === null || typeof body !== 'object') return false;
  const record = body as Record<string, unknown>;
  return (
    record.mode === 'guarded-runtime-scaffold' &&
    record.source === 'mocked-provider-compatible' &&
    record.guardedRuntimeScaffold === true
  );
};

/** Normalizes a request body into a safe, typed shape. Returns null when the exact match fails. */
export const normalizeSimilarityGuardedRouteScaffoldRequestBody = (
  body: unknown,
): SimilarityGuardedRouteScaffoldRequestBody | null => {
  if (!isGuardedRuntimeScaffoldSimilarityRequestBody(body)) return null;
  const record = body as Record<string, unknown>;

  const symbol = typeof record.symbol === 'string' ? record.symbol : undefined;
  const assetType =
    typeof record.assetType === 'string' && ASSET_TYPES.has(record.assetType)
      ? (record.assetType as SimilarityGuardedRouteScaffoldRequestBody['assetType'])
      : undefined;
  const requestedCapability =
    typeof record.requestedCapability === 'string' && REQUESTED_CAPABILITIES.has(record.requestedCapability)
      ? (record.requestedCapability as SimilarityGuardedRouteScaffoldRequestBody['requestedCapability'])
      : null;

  return {
    mode: 'guarded-runtime-scaffold',
    source: 'mocked-provider-compatible',
    guardedRuntimeScaffold: true,
    symbol,
    assetType,
    requestedCapability,
  };
};

/**
 * Runs the guarded route scaffold against a request body. Always resolves feature flags through
 * the Phase 3FC-F resolver in a safe, all-flags-off configuration, never records a usage
 * increment, never invokes the mocked provider-compatible integration, and never calls live KIS,
 * a real Supabase client, or a real database. Returns `invalid_request` for a non-exact-match
 * body, `disabled` when the scaffold policy itself is not enabled, and `feature_flag_blocked`
 * when the branch is recognized but feature flags remain off — `routeSuccessAllowed` and
 * `liveKisAllowed` are always false regardless of which safe status is returned.
 */
export const runSimilarityGuardedRouteScaffold = (
  body: unknown,
  policy: SimilarityGuardedRouteScaffoldPolicy = buildDefaultSimilarityGuardedRouteScaffoldPolicy(),
): SimilarityGuardedRouteScaffoldResult => {
  const warnings: string[] = [];
  const normalized = normalizeSimilarityGuardedRouteScaffoldRequestBody(body);
  const safePolicy = toSafePolicySummary(policy);

  const featureFlagResult = resolveSimilarityFeatureFlags(
    { requestedCapability: normalized?.requestedCapability ?? null },
    buildDefaultSimilarityFeatureFlagResolverPolicy(),
  );
  warnings.push(...featureFlagResult.warnings);

  const summary: SimilarityGuardedRouteScaffoldSummary = {
    featureFlagStatus: featureFlagResult.status,
    authSubjectStatus: 'auth_not_evaluated',
    roleAssignmentStatus: 'role_not_evaluated',
    usageSnapshotStatus: 'usage_not_evaluated',
    executionGuardStatus: 'guard_not_evaluated',
    providerStatus: 'mocked_provider_not_invoked',
    routeSuccessAllowed: false,
    liveKisAllowed: false,
    safeMessage: '',
    warnings,
  };

  if (!normalized) {
    const safeMessage = 'The guarded route scaffold request was not an exact match; falling back to safe disabled behavior.';
    return {
      ok: false,
      status: 'invalid_request',
      mode: 'guarded-runtime-scaffold',
      source: 'mocked-provider-compatible',
      summary: { ...summary, safeMessage },
      safeMessage,
      warnings,
      policy: safePolicy,
    };
  }

  if (!policy.enabled) {
    const safeMessage = 'Guarded route scaffold branch is not enabled; falling back to safe disabled behavior.';
    return {
      ok: false,
      status: 'disabled',
      mode: normalized.mode,
      source: normalized.source,
      summary: { ...summary, safeMessage },
      safeMessage,
      warnings,
      policy: safePolicy,
    };
  }

  const safeMessage =
    'Guarded route scaffold branch is recognized, but feature flags remain off; no runtime capability is granted.';
  return {
    ok: false,
    status: 'feature_flag_blocked',
    mode: normalized.mode,
    source: normalized.source,
    summary: { ...summary, safeMessage },
    safeMessage,
    warnings,
    policy: safePolicy,
  };
};

const FORBIDDEN_RESULT_SUBSTRINGS = [
  'accesstoken',
  'refreshtoken',
  'jwt',
  'secret',
  'credential',
  'rawsession',
  'rawpayload',
  'rawkis',
  'account',
  'trading',
  'balance',
  '"source":"live"',
  '"source":"auto"',
  'price',
  'volume',
];

const collectPrimitiveValues = (value: unknown, out: string[]): void => {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    for (const item of value) collectPrimitiveValues(item, out);
    return;
  }
  if (typeof value === 'object') {
    for (const nested of Object.values(value as Record<string, unknown>)) collectPrimitiveValues(nested, out);
    return;
  }
  out.push(String(value));
};

/**
 * Asserts the result contains no forbidden VALUE. Scans only primitive values (never key names),
 * so a safe policy field name never false-positives against a forbidden substring — only an
 * actual leaked value would trigger it. Intended for test/smoke context; throws only if a
 * forbidden value is detected.
 */
export const assertSimilarityGuardedRouteScaffoldResultIsSafe = (
  result: SimilarityGuardedRouteScaffoldResult,
): void => {
  const values: string[] = [];
  collectPrimitiveValues(result, values);
  const haystack = values.join(' ').toLowerCase();
  const found = FORBIDDEN_RESULT_SUBSTRINGS.filter((needle) => haystack.includes(needle));
  if (found.length > 0) {
    throw new Error(`Similarity guarded route scaffold result is unsafe (found: ${found.join(', ')})`);
  }
};
