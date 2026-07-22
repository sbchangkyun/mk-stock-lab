/**
 * Server-only guarded route runtime composition contract for Phase 3FD-E.
 * Every dependency is explicitly injected and every externally visible value is bucketed.
 */

export type SimilarityGuardedRouteRuntimeCompositionStatus =
  | 'disabled'
  | 'invalid_request'
  | 'auth_blocked'
  | 'role_usage_blocked'
  | 'feature_flag_blocked'
  | 'provider_blocked'
  | 'route_success_disabled'
  | 'redaction_failed'
  | 'safe_error';

export type SimilarityGuardedRouteRuntimeCompositionSource = 'disabled' | 'mocked-runtime';

export type SimilarityGuardedRouteRuntimeCompositionPolicy = {
  enabled: boolean;
  allowMockedRuntime: boolean;
  allowRealAuth: false;
  allowRealDb: false;
  allowSupabaseClient: false;
  allowEnvRead: false;
  allowCookieHeaderSessionRead: false;
  allowJwtVerification: false;
  allowLiveKis: false;
  allowProviderExecution: false;
  allowRouteSuccess: false;
  allowBetaExecution: false;
  allowPublicExecution: false;
  allowRawDataEcho: false;
  notes: string[];
};
export type SimilarityGuardedRouteRuntimeCompositionSafePolicySummary = Omit<
  SimilarityGuardedRouteRuntimeCompositionPolicy,
  'notes'
>;

export type SimilarityGuardedRouteRuntimeCompositionRequest = {
  mode: string;
  source: string;
  currentIso: string;
  safeRequestRef: string;
};

export type SimilarityGuardedRouteRuntimeCompositionAuthState = 'anonymous' | 'authenticated' | 'unknown';
export type SimilarityGuardedRouteRuntimeCompositionRole =
  | 'anonymous'
  | 'authenticated'
  | 'beta'
  | 'owner'
  | 'admin'
  | 'unknown';
export type SimilarityGuardedRouteRuntimeCompositionRemainingBucket =
  | 'none'
  | 'low'
  | 'available'
  | 'unknown';
export type SimilarityGuardedRouteRuntimeCompositionCountBucket = 'none' | 'low' | 'enough' | 'unknown';
export type SimilarityGuardedRouteRuntimeCompositionMatchBucket = 'none' | 'low' | 'available' | 'unknown';

export type SimilarityGuardedRouteRuntimeCompositionSafeResponse = {
  guardStatus: string;
  authState: SimilarityGuardedRouteRuntimeCompositionAuthState;
  resolvedRole: SimilarityGuardedRouteRuntimeCompositionRole;
  usageWindow: 'daily-monthly' | 'unknown';
  usageRemainingDailyBucket: SimilarityGuardedRouteRuntimeCompositionRemainingBucket;
  usageRemainingMonthlyBucket: SimilarityGuardedRouteRuntimeCompositionRemainingBucket;
  engineStatus: 'not_run' | 'blocked' | 'unknown';
  normalizedBarsAvailable: boolean;
  normalizedBarCountBucket: SimilarityGuardedRouteRuntimeCompositionCountBucket;
  matchCountBucket: SimilarityGuardedRouteRuntimeCompositionMatchBucket;
  dataPolicy: string;
  disclaimer: string;
  safeMessage: string;
};

export type SimilarityGuardedRouteRuntimeCompositionResult = {
  ok: boolean;
  status: SimilarityGuardedRouteRuntimeCompositionStatus;
  source: SimilarityGuardedRouteRuntimeCompositionSource;
  routeSuccessAllowed: false;
  providerExecutionAllowed: false;
  betaExecutionAllowed: false;
  publicExecutionAllowed: false;
  safeResponse: SimilarityGuardedRouteRuntimeCompositionSafeResponse;
  warnings: string[];
  policySummary: SimilarityGuardedRouteRuntimeCompositionSafePolicySummary;
};

export type SimilarityGuardedRouteRuntimeAuthBoundaryResult = {
  ok: boolean;
  authState: SimilarityGuardedRouteRuntimeCompositionAuthState;
  safeMessage: string;
  warnings: string[];
};

export type SimilarityGuardedRouteRuntimeRoleUsageBoundaryResult = {
  ok: boolean;
  allowed: boolean;
  resolvedRole: SimilarityGuardedRouteRuntimeCompositionRole;
  usageRemainingDailyBucket: SimilarityGuardedRouteRuntimeCompositionRemainingBucket;
  usageRemainingMonthlyBucket: SimilarityGuardedRouteRuntimeCompositionRemainingBucket;
  safeMessage: string;
  warnings: string[];
};

export type SimilarityGuardedRouteRuntimeFeatureFlagBoundaryResult = {
  ok: boolean;
  allowed: boolean;
  safeMessage: string;
  warnings: string[];
};

export type SimilarityGuardedRouteRuntimeProviderBoundaryResult = {
  eligible: boolean;
  engineStatus: 'not_run' | 'blocked' | 'unknown';
  normalizedBarsAvailable: boolean;
  normalizedBarCountBucket: SimilarityGuardedRouteRuntimeCompositionCountBucket;
  matchCountBucket: SimilarityGuardedRouteRuntimeCompositionMatchBucket;
  safeMessage: string;
  warnings: string[];
};

type BoundaryProvider<T> = T | ((request: SimilarityGuardedRouteRuntimeCompositionRequest) => T | Promise<T>);

export type SimilarityGuardedRouteRuntimeCompositionDeps = {
  authResolver?: BoundaryProvider<SimilarityGuardedRouteRuntimeAuthBoundaryResult>;
  roleUsageResolver?: BoundaryProvider<SimilarityGuardedRouteRuntimeRoleUsageBoundaryResult>;
  featureFlagResolver?: BoundaryProvider<SimilarityGuardedRouteRuntimeFeatureFlagBoundaryResult>;
  mockedProviderRunner?: BoundaryProvider<SimilarityGuardedRouteRuntimeProviderBoundaryResult>;
};
