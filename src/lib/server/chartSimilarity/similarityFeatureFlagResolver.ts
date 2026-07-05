/**
 * Server-only feature flag resolver scaffold for Chart Similarity (Phase 3FC-F).
 *
 * This module is a disabled-by-default scaffold only. It never reads `process.env`,
 * `import.meta.env`, a Vercel environment variable, `.env`, cookies, or request headers, and never
 * calls a real Supabase client or a real feature flag database. It only maps an explicit,
 * caller-supplied input object (deterministic mocked flag records, used solely for fixture/smoke
 * verification) to a safe resolver result.
 *
 * `routeSuccessAllowed`, `betaExecutionAllowed`, `publicExecutionAllowed`, and `liveKisAllowed`
 * always remain `false` in this phase, even when the mocked scaffold policy reports that beta or
 * public dependencies are satisfied — this module only evaluates flag/dependency state, it never
 * grants runtime capability.
 */

import type {
  SimilarityFeatureFlagCapability,
  SimilarityFeatureFlagGateState,
  SimilarityFeatureFlagKey,
  SimilarityFeatureFlagRecord,
  SimilarityFeatureFlagResolverInput,
  SimilarityFeatureFlagResolverPolicy,
  SimilarityFeatureFlagResolverResult,
  SimilarityFeatureFlagResolverSafePolicySummary,
  SimilarityFeatureFlagResolverStatus,
  SimilarityFeatureFlagState,
} from './similarityFeatureFlagResolverTypes';

/**
 * Builds the default policy: disabled, no real flag source behavior possible. Every call returns a
 * fresh, deterministic object. No environment or secret value is ever read here.
 */
export const buildDefaultSimilarityFeatureFlagResolverPolicy = (): SimilarityFeatureFlagResolverPolicy => ({
  enabled: false,
  allowMockedFlagRead: false,
  allowRealEnvRead: false,
  allowVercelEnvRead: false,
  allowSupabaseClient: false,
  allowDbRead: false,
  allowDbWrite: false,
  allowSql: false,
  allowCookieRead: false,
  allowHeaderRead: false,
  allowClientClaimedFlags: false,
  allowRouteSuccess: false,
  allowBetaExecution: false,
  allowPublicExecution: false,
  allowLiveKis: false,
  requireAuthForBeta: true,
  requireUsageForBeta: true,
  requireBetaBeforePublic: true,
  requireSeparateLiveKisApproval: true,
  notes: [
    'Disabled by default: no real feature flag source is connected or callable through this policy.',
    'This module never reads process.env, import.meta.env, Vercel env, .env, cookies, or request headers.',
    'Real feature flag lookup is a separate, later, explicitly approved phase.',
  ],
});

/**
 * Builds a mocked scaffold policy usable only for smoke/fixture verification. `enabled` and
 * `allowMockedFlagRead` are true so the mocked flag branches can be exercised, but every
 * real-capability boolean remains false — this policy still grants no real feature flag source
 * capability, and never allows route success, beta execution, public execution, or live KIS.
 */
export const buildMockedSimilarityFeatureFlagResolverPolicy = (): SimilarityFeatureFlagResolverPolicy => ({
  ...buildDefaultSimilarityFeatureFlagResolverPolicy(),
  enabled: true,
  allowMockedFlagRead: true,
  notes: [
    'Mocked scaffold policy: usable only for smoke/fixture verification against synthetic feature flag records.',
    'Still grants no real feature flag source capability: allowRealEnvRead, allowVercelEnvRead, allowSupabaseClient,',
    'allowDbRead, allowDbWrite, allowSql, allowCookieRead, allowHeaderRead, allowClientClaimedFlags,',
    'allowRouteSuccess, allowBetaExecution, allowPublicExecution, and allowLiveKis all remain false.',
  ],
});

const toSafePolicySummary = (
  policy: SimilarityFeatureFlagResolverPolicy,
): SimilarityFeatureFlagResolverSafePolicySummary => ({
  enabled: policy.enabled,
  allowMockedFlagRead: policy.allowMockedFlagRead,
  allowRealEnvRead: policy.allowRealEnvRead,
  allowVercelEnvRead: policy.allowVercelEnvRead,
  allowSupabaseClient: policy.allowSupabaseClient,
  allowDbRead: policy.allowDbRead,
  allowDbWrite: policy.allowDbWrite,
  allowSql: policy.allowSql,
  allowCookieRead: policy.allowCookieRead,
  allowHeaderRead: policy.allowHeaderRead,
  allowClientClaimedFlags: policy.allowClientClaimedFlags,
  allowRouteSuccess: policy.allowRouteSuccess,
  allowBetaExecution: policy.allowBetaExecution,
  allowPublicExecution: policy.allowPublicExecution,
  allowLiveKis: policy.allowLiveKis,
  requireAuthForBeta: policy.requireAuthForBeta,
  requireUsageForBeta: policy.requireUsageForBeta,
  requireBetaBeforePublic: policy.requireBetaBeforePublic,
  requireSeparateLiveKisApproval: policy.requireSeparateLiveKisApproval,
});

const FEATURE_FLAG_KEYS: SimilarityFeatureFlagKey[] = [
  'AUTH_RUNTIME_ENABLED',
  'USAGE_STORAGE_ENABLED',
  'CHART_AI_SIMILARITY_BETA_ENABLED',
  'CHART_AI_SIMILARITY_PUBLIC_ENABLED',
  'LIVE_KIS_OHLC_ENABLED',
];

const isValidFlagKey = (value: unknown): value is SimilarityFeatureFlagKey =>
  typeof value === 'string' && (FEATURE_FLAG_KEYS as readonly string[]).includes(value);

const FEATURE_FLAG_CAPABILITIES: SimilarityFeatureFlagCapability[] = [
  'auth_runtime',
  'usage_storage',
  'beta_similarity',
  'public_similarity',
  'live_kis_ohlc',
  'route_success',
];

const isValidCapability = (value: unknown): value is SimilarityFeatureFlagCapability =>
  typeof value === 'string' && (FEATURE_FLAG_CAPABILITIES as readonly string[]).includes(value);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Returns the five approved feature flag keys, all disabled. Used as the baseline state before any
 * mocked flag record is applied, and as the full fallback state under the default (disabled)
 * policy or a malformed input.
 */
export const buildDefaultSimilarityFeatureFlagStates = (): SimilarityFeatureFlagState[] =>
  FEATURE_FLAG_KEYS.map((key) => ({ key, enabled: false, source: 'default', active: true }));

const buildDefaultGateState = (): SimilarityFeatureFlagGateState => ({
  authRuntimeReady: false,
  usageStorageReady: false,
  betaFlagReady: false,
  betaDependenciesSatisfied: false,
  publicFlagReady: false,
  publicDependenciesSatisfied: false,
  liveKisFlagReady: false,
  routeSuccessAllowed: false,
  betaExecutionAllowed: false,
  publicExecutionAllowed: false,
  liveKisAllowed: false,
});

const normalizeFeatureFlagRecord = (rawRecord: unknown): SimilarityFeatureFlagRecord | null => {
  if (!isPlainObject(rawRecord)) return null;
  if (!isValidFlagKey(rawRecord.key)) return null;
  if (typeof rawRecord.enabled !== 'boolean') return null;
  if (rawRecord.source !== 'mocked-flag') return null;
  if (typeof rawRecord.updatedAtIso !== 'string' || rawRecord.updatedAtIso.length === 0) return null;
  if (typeof rawRecord.updatedByRef !== 'string' || rawRecord.updatedByRef.length === 0) return null;
  if (typeof rawRecord.active !== 'boolean') return null;
  return {
    key: rawRecord.key,
    enabled: rawRecord.enabled,
    source: 'mocked-flag',
    updatedAtIso: rawRecord.updatedAtIso,
    updatedByRef: rawRecord.updatedByRef,
    active: rawRecord.active,
  };
};

type NormalizedSimilarityFeatureFlagResolverInput = {
  mockedFlags: unknown[] | null;
  requestedCapability: SimilarityFeatureFlagCapability | null;
  clientClaimedFlags: unknown;
  currentIso: string | null;
};

/**
 * Normalizes a caller-supplied input object. Never reads `Request`, cookies, headers,
 * `process.env`, or `import.meta.env` — only the explicit input object is inspected. Only the
 * top-level shape is validated here (`mockedFlags` must be an array or absent/null,
 * `requestedCapability` must be a known capability or absent/null); individual mocked flag records
 * are validated later so a single malformed record can be ignored with a warning rather than
 * invalidating the whole input.
 */
export const normalizeSimilarityFeatureFlagResolverInput = (
  input: unknown,
): NormalizedSimilarityFeatureFlagResolverInput | null => {
  if (!isPlainObject(input)) return null;

  let mockedFlags: unknown[] | null = null;
  if (input.mockedFlags === null || input.mockedFlags === undefined) {
    mockedFlags = null;
  } else if (Array.isArray(input.mockedFlags)) {
    mockedFlags = input.mockedFlags;
  } else {
    return null;
  }

  let requestedCapability: SimilarityFeatureFlagCapability | null = null;
  if (input.requestedCapability === null || input.requestedCapability === undefined) {
    requestedCapability = null;
  } else if (isValidCapability(input.requestedCapability)) {
    requestedCapability = input.requestedCapability;
  } else {
    return null;
  }

  return {
    mockedFlags,
    requestedCapability,
    clientClaimedFlags: input.clientClaimedFlags,
    currentIso: typeof input.currentIso === 'string' ? input.currentIso : null,
  };
};

const computeCapabilityAllowed = (
  capability: SimilarityFeatureFlagCapability | null,
  gates: SimilarityFeatureFlagGateState,
): boolean => {
  switch (capability) {
    case 'auth_runtime':
      return gates.authRuntimeReady;
    case 'usage_storage':
      return gates.usageStorageReady;
    default:
      return false;
  }
};

/**
 * Reports whether a given capability is allowed under an already-resolved result's gate state.
 * `beta_similarity`, `public_similarity`, `live_kis_ohlc`, and `route_success` are always false in
 * this phase, regardless of dependency satisfaction.
 */
export const isSimilarityFeatureCapabilityAllowed = (
  result: SimilarityFeatureFlagResolverResult,
  capability: SimilarityFeatureFlagCapability,
): boolean => computeCapabilityAllowed(capability, result.gates);

const buildFallbackResult = (
  status: SimilarityFeatureFlagResolverStatus,
  ok: boolean,
  flags: SimilarityFeatureFlagState[],
  gates: SimilarityFeatureFlagGateState,
  requestedCapability: SimilarityFeatureFlagCapability | null,
  requestedCapabilityAllowed: boolean,
  policy: SimilarityFeatureFlagResolverPolicy,
  safeMessage: string,
  warnings: string[],
): SimilarityFeatureFlagResolverResult => ({
  ok,
  status,
  flags,
  gates,
  requestedCapability,
  requestedCapabilityAllowed,
  safeMessage,
  policy: toSafePolicySummary(policy),
  warnings,
});

/**
 * Resolves the five approved feature flags plus their dependency gates from an explicit input
 * object. Never reads `Request`, cookies, headers, `process.env`, `import.meta.env`, or a real
 * database. Never trusts `clientClaimedFlags` — it is always ignored and recorded only as a safe
 * warning. `routeSuccessAllowed`, `betaExecutionAllowed`, `publicExecutionAllowed`, and
 * `liveKisAllowed` always remain false in this phase.
 */
export const resolveSimilarityFeatureFlags = (
  rawInput: unknown,
  policy: SimilarityFeatureFlagResolverPolicy = buildDefaultSimilarityFeatureFlagResolverPolicy(),
): SimilarityFeatureFlagResolverResult => {
  const warnings: string[] = [];

  const input = normalizeSimilarityFeatureFlagResolverInput(rawInput);
  if (!input) {
    return buildFallbackResult(
      'invalid_flag_set',
      false,
      buildDefaultSimilarityFeatureFlagStates(),
      buildDefaultGateState(),
      null,
      false,
      policy,
      'The feature flag context could not be resolved safely.',
      warnings,
    );
  }

  if (input.clientClaimedFlags !== undefined) {
    warnings.push('client_claim_ignored');
  }

  if (!policy.enabled) {
    return buildFallbackResult(
      'disabled',
      false,
      buildDefaultSimilarityFeatureFlagStates(),
      buildDefaultGateState(),
      input.requestedCapability,
      false,
      policy,
      'Real feature flag resolution is disabled by default.',
      warnings,
    );
  }

  const stateMap = new Map<SimilarityFeatureFlagKey, SimilarityFeatureFlagState>(
    FEATURE_FLAG_KEYS.map((key) => [key, { key, enabled: false, source: 'default', active: true }]),
  );

  const groupedByKey = new Map<SimilarityFeatureFlagKey, SimilarityFeatureFlagRecord[]>();
  const rawRecords = input.mockedFlags ?? [];
  for (const rawRecord of rawRecords) {
    const record = normalizeFeatureFlagRecord(rawRecord);
    if (!record) {
      warnings.push('flag_ignored');
      continue;
    }
    if (!record.active) continue;
    const existing = groupedByKey.get(record.key) ?? [];
    existing.push(record);
    groupedByKey.set(record.key, existing);
  }

  for (const [key, records] of groupedByKey.entries()) {
    if (records.length > 1) {
      warnings.push('duplicate_flag_ignored');
      continue;
    }
    const record = records[0];
    stateMap.set(key, { key: record.key, enabled: record.enabled, source: 'mocked-flag', active: true });
  }

  const flags = FEATURE_FLAG_KEYS.map((key) => stateMap.get(key)!);

  const authRuntimeReady = stateMap.get('AUTH_RUNTIME_ENABLED')!.enabled;
  const usageStorageReady = stateMap.get('USAGE_STORAGE_ENABLED')!.enabled;
  const betaFlagReady = stateMap.get('CHART_AI_SIMILARITY_BETA_ENABLED')!.enabled;
  const betaDependenciesSatisfied = betaFlagReady && authRuntimeReady && usageStorageReady;
  const publicFlagReady = stateMap.get('CHART_AI_SIMILARITY_PUBLIC_ENABLED')!.enabled;
  const publicDependenciesSatisfied = publicFlagReady && betaDependenciesSatisfied;
  const liveKisFlagReady = stateMap.get('LIVE_KIS_OHLC_ENABLED')!.enabled;

  if (betaFlagReady && !authRuntimeReady) warnings.push('beta_missing_auth_dependency');
  if (betaFlagReady && !usageStorageReady) warnings.push('beta_missing_usage_dependency');
  if (publicFlagReady && !publicDependenciesSatisfied) warnings.push('public_dependency_blocked');
  if (publicFlagReady) warnings.push('public_activation_not_approved');
  if (liveKisFlagReady) warnings.push('live_kis_activation_not_approved');

  const gates: SimilarityFeatureFlagGateState = {
    authRuntimeReady,
    usageStorageReady,
    betaFlagReady,
    betaDependenciesSatisfied,
    publicFlagReady,
    publicDependenciesSatisfied,
    liveKisFlagReady,
    routeSuccessAllowed: false,
    betaExecutionAllowed: false,
    publicExecutionAllowed: false,
    liveKisAllowed: false,
  };

  const dependencyBlocked =
    (betaFlagReady && (!authRuntimeReady || !usageStorageReady)) || (publicFlagReady && !publicDependenciesSatisfied);
  const status: SimilarityFeatureFlagResolverStatus = dependencyBlocked ? 'dependency_blocked' : 'resolved';

  return {
    ok: true,
    status,
    flags,
    gates,
    requestedCapability: input.requestedCapability,
    requestedCapabilityAllowed: computeCapabilityAllowed(input.requestedCapability, gates),
    safeMessage: dependencyBlocked
      ? 'Resolved mocked feature flags for scaffold verification only; one or more dependency gates are blocked.'
      : 'Resolved mocked feature flags for scaffold verification only.',
    policy: toSafePolicySummary(policy),
    warnings,
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
export const assertSimilarityFeatureFlagResolverResultIsSafe = (result: SimilarityFeatureFlagResolverResult): void => {
  const values: string[] = [];
  collectPrimitiveValues(result, values);
  const haystack = values.join(' ').toLowerCase();
  const found = FORBIDDEN_RESULT_SUBSTRINGS.filter((needle) => haystack.includes(needle));
  if (found.length > 0) {
    throw new Error(`Similarity feature flag resolver result is unsafe (found: ${found.join(', ')})`);
  }
};
