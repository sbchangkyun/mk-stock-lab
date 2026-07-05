/**
 * Server-only guarded route integration scaffold type contract for Chart Similarity (Phase 3FC-H).
 *
 * These types describe a disabled-by-default scaffold that recognizes a single, exact future
 * request discriminator (`mode: "guarded-runtime-scaffold"`, `source: "mocked-provider-compatible"`,
 * `guardedRuntimeScaffold: true`) while keeping every runtime capability boolean false. This file
 * defines shapes only — it performs no I/O, calls no database, and touches no network.
 *
 * This scaffold composes with the Phase 3FC-C/3FC-D/3FC-E/3FC-F resolvers for readiness only; it
 * never unlocks route success, beta execution, public execution, live KIS, or mocked provider
 * execution in this phase.
 */

import type { SimilarityFeatureFlagResolverStatus } from './similarityFeatureFlagResolverTypes';

export type SimilarityGuardedRouteScaffoldStatus =
  | 'disabled'
  | 'feature_flag_blocked'
  | 'auth_not_evaluated'
  | 'role_not_evaluated'
  | 'usage_not_evaluated'
  | 'guard_not_evaluated'
  | 'mocked_provider_not_invoked'
  | 'invalid_request'
  | 'error';

export type SimilarityGuardedRouteScaffoldMode = 'guarded-runtime-scaffold';

export type SimilarityGuardedRouteScaffoldSource = 'mocked-provider-compatible';

export type SimilarityGuardedRouteScaffoldRequestBody = {
  mode: 'guarded-runtime-scaffold';
  source: 'mocked-provider-compatible';
  guardedRuntimeScaffold: true;
  symbol?: string;
  assetType?: 'stock' | 'etf' | 'index' | 'crypto';
  requestedCapability?: 'beta_similarity' | 'route_success' | null;
};

export type SimilarityGuardedRouteScaffoldPolicy = {
  enabled: boolean;
  allowRouteBranchRecognition: boolean;
  allowRouteSuccess: false;
  allowMockedProviderExecution: false;
  allowLiveKis: false;
  allowRealSupabase: false;
  allowRealDb: false;
  allowEnvRead: false;
  allowCookieRead: false;
  allowHeaderAuthRead: false;
  allowPublicExecution: false;
  allowBetaExecution: false;
  notes: string[];
};

export type SimilarityGuardedRouteScaffoldSafePolicySummary = Pick<
  SimilarityGuardedRouteScaffoldPolicy,
  | 'enabled'
  | 'allowRouteBranchRecognition'
  | 'allowRouteSuccess'
  | 'allowMockedProviderExecution'
  | 'allowLiveKis'
  | 'allowRealSupabase'
  | 'allowRealDb'
  | 'allowEnvRead'
  | 'allowCookieRead'
  | 'allowHeaderAuthRead'
  | 'allowPublicExecution'
  | 'allowBetaExecution'
>;

export type SimilarityGuardedRouteScaffoldSummary = {
  featureFlagStatus: SimilarityFeatureFlagResolverStatus;
  authSubjectStatus: 'auth_not_evaluated';
  roleAssignmentStatus: 'role_not_evaluated';
  usageSnapshotStatus: 'usage_not_evaluated';
  executionGuardStatus: 'guard_not_evaluated';
  providerStatus: 'mocked_provider_not_invoked';
  routeSuccessAllowed: false;
  liveKisAllowed: false;
  safeMessage: string;
  warnings: string[];
};

export type SimilarityGuardedRouteScaffoldResult = {
  ok: boolean;
  status: SimilarityGuardedRouteScaffoldStatus;
  mode: SimilarityGuardedRouteScaffoldMode;
  source: SimilarityGuardedRouteScaffoldSource;
  summary: SimilarityGuardedRouteScaffoldSummary;
  safeMessage: string;
  warnings: string[];
  policy: SimilarityGuardedRouteScaffoldSafePolicySummary;
};
