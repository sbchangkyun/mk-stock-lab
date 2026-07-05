/** Deterministic, safe fixtures for the Phase 3FD-E mocked composition scaffold. */

import { buildAllGatesOffMockedRuntimeCompositionPolicy as buildPolicy } from './similarityGuardedRouteRuntimeComposition';
import type {
  SimilarityGuardedRouteRuntimeCompositionDeps,
  SimilarityGuardedRouteRuntimeCompositionRequest,
} from './similarityGuardedRouteRuntimeCompositionTypes';

export function buildMockedGuardedRouteRuntimeCompositionRequest(): SimilarityGuardedRouteRuntimeCompositionRequest {
  return {
    mode: 'guarded-runtime-scaffold',
    source: 'mocked-runtime',
    currentIso: '2026-07-04T12:00:00.000+09:00',
    safeRequestRef: 'mock-guarded-request-ref-001',
  };
}

export function buildAllGatesOffMockedRuntimeCompositionPolicy() {
  return buildPolicy();
}

const authAllowed = {
  ok: true,
  authState: 'authenticated' as const,
  safeMessage: 'Mocked auth boundary resolved safely.',
  warnings: [],
};

const roleUsageAllowed = {
  ok: true,
  allowed: true,
  resolvedRole: 'authenticated' as const,
  usageRemainingDailyBucket: 'available' as const,
  usageRemainingMonthlyBucket: 'available' as const,
  safeMessage: 'Mocked role and usage boundary resolved safely.',
  warnings: [],
};

const featureFlagsAllowed = {
  ok: true,
  allowed: true,
  safeMessage: 'Mocked feature flag boundary is eligible for policy review.',
  warnings: [],
};

const favorableProviderEligibility = {
  eligible: true,
  engineStatus: 'not_run' as const,
  normalizedBarsAvailable: false,
  normalizedBarCountBucket: 'none' as const,
  matchCountBucket: 'none' as const,
  safeMessage: 'Mocked provider eligibility passed without execution.',
  warnings: [],
};

export function buildMockedCompositionDepsAllBlocked(): SimilarityGuardedRouteRuntimeCompositionDeps {
  return buildMockedCompositionDepsAuthBlocked();
}

export function buildMockedCompositionDepsAuthBlocked(): SimilarityGuardedRouteRuntimeCompositionDeps {
  return {
    authResolver: {
      ok: false,
      authState: 'anonymous',
      safeMessage: 'Mocked auth boundary blocked the request.',
      warnings: ['mocked_auth_blocked'],
    },
  };
}

export function buildMockedCompositionDepsRoleUsageBlocked(): SimilarityGuardedRouteRuntimeCompositionDeps {
  return {
    authResolver: authAllowed,
    roleUsageResolver: {
      ...roleUsageAllowed,
      ok: false,
      allowed: false,
      usageRemainingDailyBucket: 'none',
      safeMessage: 'Mocked role and usage boundary blocked the request.',
      warnings: ['mocked_role_usage_blocked'],
    },
  };
}

export function buildMockedCompositionDepsFeatureFlagBlocked(): SimilarityGuardedRouteRuntimeCompositionDeps {
  return {
    authResolver: authAllowed,
    roleUsageResolver: roleUsageAllowed,
    featureFlagResolver: {
      ok: false,
      allowed: false,
      safeMessage: 'Mocked feature flag boundary blocked the request.',
      warnings: ['mocked_feature_flag_blocked'],
    },
  };
}

export function buildMockedCompositionDepsProviderBlocked(): SimilarityGuardedRouteRuntimeCompositionDeps {
  return {
    authResolver: authAllowed,
    roleUsageResolver: roleUsageAllowed,
    featureFlagResolver: featureFlagsAllowed,
    mockedProviderRunner: {
      ...favorableProviderEligibility,
      eligible: false,
      engineStatus: 'blocked',
      safeMessage: 'Mocked provider eligibility blocked the request.',
      warnings: ['mocked_provider_blocked'],
    },
  };
}

export function buildMockedCompositionDepsMostFavorableStillRouteDisabled(): SimilarityGuardedRouteRuntimeCompositionDeps {
  return {
    authResolver: authAllowed,
    roleUsageResolver: roleUsageAllowed,
    featureFlagResolver: featureFlagsAllowed,
    mockedProviderRunner: favorableProviderEligibility,
  };
}

export function buildMockedCompositionDepsUnsafeOutputAttempt(): SimilarityGuardedRouteRuntimeCompositionDeps {
  return {
    authResolver: {
      ...authAllowed,
      safeMessage: 'Unsafe accessToken marker.',
      warnings: ['unsafe_accessToken_marker'],
    },
    roleUsageResolver: roleUsageAllowed,
    featureFlagResolver: featureFlagsAllowed,
    mockedProviderRunner: favorableProviderEligibility,
  };
}
