/**
 * Server-only feature flag resolver type contract for Chart Similarity (Phase 3FC-F).
 *
 * These types describe a disabled-by-default scaffold that evaluates the five owner-approved
 * feature flag keys plus their dependency gates from deterministic mocked flag fixtures only. It
 * never reads `process.env`, `import.meta.env`, a Vercel environment variable, a cookie, a request
 * header, or a real Supabase/DB-backed flag source. This file defines shapes only — it performs no
 * I/O, calls no database, and touches no network.
 *
 * This module consumes no output from the Phase 3FC-C/3FC-D/3FC-E resolvers directly; it only
 * evaluates flag state and dependency gates in isolation, in preparation for a later route
 * integration phase that will combine all four scaffolds.
 */

export type SimilarityFeatureFlagKey =
  | 'AUTH_RUNTIME_ENABLED'
  | 'USAGE_STORAGE_ENABLED'
  | 'CHART_AI_SIMILARITY_BETA_ENABLED'
  | 'CHART_AI_SIMILARITY_PUBLIC_ENABLED'
  | 'LIVE_KIS_OHLC_ENABLED';

export type SimilarityFeatureFlagResolverStatus =
  | 'disabled'
  | 'resolved'
  | 'dependency_blocked'
  | 'invalid_flag_set'
  | 'not_configured'
  | 'error';

export type SimilarityFeatureFlagSource = 'default' | 'mocked-flag';

export type SimilarityFeatureFlagCapability =
  | 'auth_runtime'
  | 'usage_storage'
  | 'beta_similarity'
  | 'public_similarity'
  | 'live_kis_ohlc'
  | 'route_success';

export type SimilarityFeatureFlagRecord = {
  key: SimilarityFeatureFlagKey;
  enabled: boolean;
  source: 'mocked-flag';
  updatedAtIso: string;
  updatedByRef: string;
  active: boolean;
};

export type SimilarityFeatureFlagResolverInput = {
  mockedFlags?: SimilarityFeatureFlagRecord[] | null;
  requestedCapability?: SimilarityFeatureFlagCapability | null;
  clientClaimedFlags?: unknown;
  currentIso?: string | null;
};

export type SimilarityFeatureFlagResolverPolicy = {
  enabled: boolean;
  allowMockedFlagRead: boolean;
  allowRealEnvRead: false;
  allowVercelEnvRead: false;
  allowSupabaseClient: false;
  allowDbRead: false;
  allowDbWrite: false;
  allowSql: false;
  allowCookieRead: false;
  allowHeaderRead: false;
  allowClientClaimedFlags: false;
  allowRouteSuccess: false;
  allowBetaExecution: false;
  allowPublicExecution: false;
  allowLiveKis: false;
  requireAuthForBeta: true;
  requireUsageForBeta: true;
  requireBetaBeforePublic: true;
  requireSeparateLiveKisApproval: true;
  notes: string[];
};

export type SimilarityFeatureFlagResolverSafePolicySummary = Pick<
  SimilarityFeatureFlagResolverPolicy,
  | 'enabled'
  | 'allowMockedFlagRead'
  | 'allowRealEnvRead'
  | 'allowVercelEnvRead'
  | 'allowSupabaseClient'
  | 'allowDbRead'
  | 'allowDbWrite'
  | 'allowSql'
  | 'allowCookieRead'
  | 'allowHeaderRead'
  | 'allowClientClaimedFlags'
  | 'allowRouteSuccess'
  | 'allowBetaExecution'
  | 'allowPublicExecution'
  | 'allowLiveKis'
  | 'requireAuthForBeta'
  | 'requireUsageForBeta'
  | 'requireBetaBeforePublic'
  | 'requireSeparateLiveKisApproval'
>;

export type SimilarityFeatureFlagState = {
  key: SimilarityFeatureFlagKey;
  enabled: boolean;
  source: SimilarityFeatureFlagSource;
  active: boolean;
};

export type SimilarityFeatureFlagGateState = {
  authRuntimeReady: boolean;
  usageStorageReady: boolean;
  betaFlagReady: boolean;
  betaDependenciesSatisfied: boolean;
  publicFlagReady: boolean;
  publicDependenciesSatisfied: boolean;
  liveKisFlagReady: boolean;
  routeSuccessAllowed: boolean;
  betaExecutionAllowed: boolean;
  publicExecutionAllowed: boolean;
  liveKisAllowed: boolean;
};

export type SimilarityFeatureFlagResolverResult = {
  ok: boolean;
  status: SimilarityFeatureFlagResolverStatus;
  flags: SimilarityFeatureFlagState[];
  gates: SimilarityFeatureFlagGateState;
  requestedCapability: SimilarityFeatureFlagCapability | null;
  requestedCapabilityAllowed: boolean;
  safeMessage: string;
  policy: SimilarityFeatureFlagResolverSafePolicySummary;
  warnings: string[];
};
