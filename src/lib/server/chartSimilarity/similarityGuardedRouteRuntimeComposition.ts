/**
 * Guarded route runtime composition scaffold for Phase 3FD-E.
 *
 * This module only composes injected mocked boundaries. It creates no clients, reads no request
 * context or configuration, performs no network I/O, and never grants provider or route success.
 */

import type {
  SimilarityGuardedRouteRuntimeCompositionDeps,
  SimilarityGuardedRouteRuntimeCompositionPolicy,
  SimilarityGuardedRouteRuntimeCompositionRequest,
  SimilarityGuardedRouteRuntimeCompositionResult,
  SimilarityGuardedRouteRuntimeCompositionSafePolicySummary,
  SimilarityGuardedRouteRuntimeCompositionSafeResponse,
  SimilarityGuardedRouteRuntimeCompositionStatus,
} from './similarityGuardedRouteRuntimeCompositionTypes';

const FORBIDDEN_RESULT_SUBSTRINGS = [
  'accesstoken',
  'refreshtoken',
  'jwt',
  'rawsession',
  'rawuser',
  'phone',
  'cookie',
  'authorization',
  'supabase_service_role_key',
  'service_role',
  'secret',
  'credential',
  'kis_app_key',
  'kis_app_secret',
  'ohlc',
  'account',
  'trading',
  'order',
  'balance',
  '"source":"live"',
  '"source":"auto"',
];

const EMAIL_ADDRESS_SHAPE_PATTERN = /[^\s"|]+@[^\s"|]+\.[^\s"|]+/;

export function buildDefaultSimilarityGuardedRouteRuntimeCompositionPolicy(): SimilarityGuardedRouteRuntimeCompositionPolicy {
  return {
    enabled: false,
    allowMockedRuntime: false,
    allowRealAuth: false,
    allowRealDb: false,
    allowSupabaseClient: false,
    allowEnvRead: false,
    allowCookieHeaderSessionRead: false,
    allowJwtVerification: false,
    allowLiveKis: false,
    allowProviderExecution: false,
    allowRouteSuccess: false,
    allowBetaExecution: false,
    allowPublicExecution: false,
    allowRawDataEcho: false,
    notes: [
      'Disabled by default and restricted to explicitly injected mocked runtime boundaries.',
      'Provider execution and route success remain disabled in this phase.',
      'Every unresolved, blocked, or unsafe state fails closed.',
    ],
  };
}
export function buildAllGatesOffMockedRuntimeCompositionPolicy(): SimilarityGuardedRouteRuntimeCompositionPolicy {
  return {
    ...buildDefaultSimilarityGuardedRouteRuntimeCompositionPolicy(),
    enabled: true,
    allowMockedRuntime: true,
  };
}

function toSafePolicySummary(
  policy: SimilarityGuardedRouteRuntimeCompositionPolicy,
): SimilarityGuardedRouteRuntimeCompositionSafePolicySummary {
  const { notes: _notes, ...summary } = policy;
  return summary;
}

function defaultSafeResponse(
  status: SimilarityGuardedRouteRuntimeCompositionStatus,
  safeMessage: string,
): SimilarityGuardedRouteRuntimeCompositionSafeResponse {
  return {
    guardStatus: status === 'disabled' ? 'feature_disabled' : status,
    authState: 'unknown',
    resolvedRole: 'unknown',
    usageWindow: 'unknown',
    usageRemainingDailyBucket: 'unknown',
    usageRemainingMonthlyBucket: 'unknown',
    engineStatus: 'not_run',
    normalizedBarsAvailable: false,
    normalizedBarCountBucket: 'none',
    matchCountBucket: 'none',
    dataPolicy: 'mocked_runtime_only',
    disclaimer: 'Guarded route runtime remains disabled.',
    safeMessage,
  };
}

export function normalizeSimilarityGuardedRouteRuntimeCompositionRequest(
  input: unknown,
): SimilarityGuardedRouteRuntimeCompositionRequest | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return null;
  const candidate = input as Record<string, unknown>;
  if (candidate.mode !== 'guarded-runtime-scaffold') return null;
  if (candidate.source !== 'mocked-runtime') return null;
  if (typeof candidate.currentIso !== 'string' || !Number.isFinite(Date.parse(candidate.currentIso))) return null;
  if (typeof candidate.safeRequestRef !== 'string' || candidate.safeRequestRef.length === 0) return null;
  return {
    mode: candidate.mode,
    source: candidate.source,
    currentIso: candidate.currentIso,
    safeRequestRef: candidate.safeRequestRef,
  };
}

export function buildBlockedGuardedRouteRuntimeCompositionResult(
  status: SimilarityGuardedRouteRuntimeCompositionStatus,
  safeMessage: string,
  policy: SimilarityGuardedRouteRuntimeCompositionPolicy,
  partial: Partial<SimilarityGuardedRouteRuntimeCompositionSafeResponse> = {},
  warnings: string[] = [],
): SimilarityGuardedRouteRuntimeCompositionResult {
  return {
    ok: false,
    status,
    source: policy.enabled && policy.allowMockedRuntime ? 'mocked-runtime' : 'disabled',
    routeSuccessAllowed: false,
    providerExecutionAllowed: false,
    betaExecutionAllowed: false,
    publicExecutionAllowed: false,
    safeResponse: { ...defaultSafeResponse(status, safeMessage), ...partial, safeMessage },
    warnings,
    policySummary: toSafePolicySummary(policy),
  };
}

function collectPrimitiveValues(value: unknown, output: string[] = []): string[] {
  if (value === null || value === undefined) return output;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    output.push(String(value));
    return output;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectPrimitiveValues(item, output);
    return output;
  }
  if (typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>)) collectPrimitiveValues(item, output);
  }
  return output;
}

export function assertSimilarityGuardedRouteRuntimeCompositionResultIsSafe(
  result: SimilarityGuardedRouteRuntimeCompositionResult,
): void {
  const primitiveValues = collectPrimitiveValues(result);
  for (const primitiveValue of primitiveValues) {
    const normalized = primitiveValue.toLowerCase().replace(/[\s_-]/g, '');
    if (EMAIL_ADDRESS_SHAPE_PATTERN.test(primitiveValue)) throw new Error('Unsafe output was blocked.');
    if (FORBIDDEN_RESULT_SUBSTRINGS.some((term) => normalized.includes(term.replace(/[\s_-]/g, '')))) {
      throw new Error('Unsafe output was blocked.');
    }
  }
}

function finalizeResult(candidate: SimilarityGuardedRouteRuntimeCompositionResult) {
  try {
    assertSimilarityGuardedRouteRuntimeCompositionResultIsSafe(candidate);
    return candidate;
  } catch {
    return buildBlockedGuardedRouteRuntimeCompositionResult(
      'redaction_failed',
      'Composition output failed safety validation and was blocked.',
      {
        ...buildDefaultSimilarityGuardedRouteRuntimeCompositionPolicy(),
        enabled: candidate.policySummary.enabled,
        allowMockedRuntime: candidate.policySummary.allowMockedRuntime,
      },
      {},
      ['redaction_failed'],
    );
  }
}

async function resolveBoundary<T>(
  provider: T | ((request: SimilarityGuardedRouteRuntimeCompositionRequest) => T | Promise<T>),
  request: SimilarityGuardedRouteRuntimeCompositionRequest,
): Promise<T> {
  return typeof provider === 'function'
    ? await (provider as (request: SimilarityGuardedRouteRuntimeCompositionRequest) => T | Promise<T>)(request)
    : provider;
}

export async function runSimilarityGuardedRouteRuntimeComposition(
  rawRequest: unknown,
  deps: SimilarityGuardedRouteRuntimeCompositionDeps = {},
  policy: SimilarityGuardedRouteRuntimeCompositionPolicy = buildDefaultSimilarityGuardedRouteRuntimeCompositionPolicy(),
): Promise<SimilarityGuardedRouteRuntimeCompositionResult> {
  try {
    // 1. Request normalization.
    const request = normalizeSimilarityGuardedRouteRuntimeCompositionRequest(rawRequest);
    if (request === null) {
      return finalizeResult(
        buildBlockedGuardedRouteRuntimeCompositionResult(
          'invalid_request',
          'Guarded composition request was invalid and was blocked.',
          policy,
        ),
      );
    }
    if (!policy.enabled || !policy.allowMockedRuntime) {
      return finalizeResult(
        buildBlockedGuardedRouteRuntimeCompositionResult(
          'disabled',
          'Guarded route runtime composition is disabled by policy.',
          policy,
        ),
      );
    }

    // 2. Auth resolver boundary.
    if (!deps.authResolver) {
      return finalizeResult(buildBlockedGuardedRouteRuntimeCompositionResult('auth_blocked', 'Auth boundary is unavailable.', policy));
    }
    const auth = await resolveBoundary(deps.authResolver, request);
    if (!auth.ok || auth.authState !== 'authenticated') {
      return finalizeResult(
        buildBlockedGuardedRouteRuntimeCompositionResult(
          'auth_blocked',
          auth.safeMessage,
          policy,
          { authState: auth.authState },
          auth.warnings,
        ),
      );
    }

    // 3. Role and usage adapter boundary.
    if (!deps.roleUsageResolver) {
      return finalizeResult(buildBlockedGuardedRouteRuntimeCompositionResult('role_usage_blocked', 'Role and usage boundary is unavailable.', policy, { authState: auth.authState }));
    }
    const roleUsage = await resolveBoundary(deps.roleUsageResolver, request);
    const roleUsageSafeResponse = {
      authState: auth.authState,
      resolvedRole: roleUsage.resolvedRole,
      usageWindow: 'daily-monthly' as const,
      usageRemainingDailyBucket: roleUsage.usageRemainingDailyBucket,
      usageRemainingMonthlyBucket: roleUsage.usageRemainingMonthlyBucket,
    };
    if (!roleUsage.ok || !roleUsage.allowed) {
      return finalizeResult(
        buildBlockedGuardedRouteRuntimeCompositionResult(
          'role_usage_blocked',
          roleUsage.safeMessage,
          policy,
          roleUsageSafeResponse,
          [...auth.warnings, ...roleUsage.warnings],
        ),
      );
    }

    // 4. Feature flag and dependency gate boundary.
    if (!deps.featureFlagResolver) {
      return finalizeResult(buildBlockedGuardedRouteRuntimeCompositionResult('feature_flag_blocked', 'Feature flag boundary is unavailable.', policy, roleUsageSafeResponse));
    }
    const featureFlags = await resolveBoundary(deps.featureFlagResolver, request);
    if (!featureFlags.ok || !featureFlags.allowed) {
      return finalizeResult(
        buildBlockedGuardedRouteRuntimeCompositionResult(
          'feature_flag_blocked',
          featureFlags.safeMessage,
          policy,
          roleUsageSafeResponse,
          [...auth.warnings, ...roleUsage.warnings, ...featureFlags.warnings],
        ),
      );
    }

    // 5. Provider execution eligibility boundary. A precomputed mocked result may describe
    // eligibility without executing a provider. A callable runner remains blocked by policy.
    if (!deps.mockedProviderRunner || typeof deps.mockedProviderRunner === 'function') {
      return finalizeResult(
        buildBlockedGuardedRouteRuntimeCompositionResult(
          'provider_blocked',
          'Provider execution is disabled by policy.',
          policy,
          roleUsageSafeResponse,
          [...auth.warnings, ...roleUsage.warnings, ...featureFlags.warnings],
        ),
      );
    }
    const provider = deps.mockedProviderRunner;
    if (!provider.eligible) {
      return finalizeResult(
        buildBlockedGuardedRouteRuntimeCompositionResult(
          'provider_blocked',
          provider.safeMessage,
          policy,
          { ...roleUsageSafeResponse, engineStatus: provider.engineStatus },
          [...auth.warnings, ...roleUsage.warnings, ...featureFlags.warnings, ...provider.warnings],
        ),
      );
    }

    // 6. Mocked provider execution boundary. Execution remains off, so the injected eligibility
    // result is never promoted into an execution call.
    // 7. Safe response shaping.
    const safeProviderResponse = {
      ...roleUsageSafeResponse,
      engineStatus: provider.engineStatus,
      normalizedBarsAvailable: provider.normalizedBarsAvailable,
      normalizedBarCountBucket: provider.normalizedBarCountBucket,
      matchCountBucket: provider.matchCountBucket,
    };

    // 8. Final fail-closed fallback. Even the favorable mocked path cannot authorize success.
    return finalizeResult(
      buildBlockedGuardedRouteRuntimeCompositionResult(
        'route_success_disabled',
        'Route success is disabled by policy.',
        policy,
        safeProviderResponse,
        [...auth.warnings, ...roleUsage.warnings, ...featureFlags.warnings, ...provider.warnings],
      ),
    );
  } catch {
    return finalizeResult(
      buildBlockedGuardedRouteRuntimeCompositionResult(
        'safe_error',
        'Guarded composition failed closed.',
        policy,
        {},
        ['safe_error'],
      ),
    );
  }
}
