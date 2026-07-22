/**
 * Server-only owner-local KIS-normalized execution plan module for Chart Similarity execution
 * (Phase 3FA-A).
 *
 * This module is design/foundation only. It defines the future ordered execution sequence,
 * activation gates, provider data expectations, and a pure default policy for an owner-local
 * KIS-normalized similarity execution path. It never imports a live KIS provider/client module, a
 * real similarity engine, an auth provider, or a DB/cache provider. It never reads cookies,
 * headers, `localStorage`/`sessionStorage`, `process.env`, or `.env`, never performs a network
 * call, and never persists anything. It never throws for the expected design inputs handled here.
 * The default policy's `enabled` field is fixed `false`, so
 * `isOwnerLocalExecutionAllowedByPlan` always returns `false` in this phase — no execution is
 * enabled and the existing `/api/chart-ai/similarity` route continues to return `feature_disabled`
 * unconditionally.
 */

import type {
  SimilarityOwnerLocalExecutionGate,
  SimilarityOwnerLocalExecutionPlanPolicy,
  SimilarityOwnerLocalExecutionPlanResult,
  SimilarityOwnerLocalExecutionPlanStatus,
  SimilarityOwnerLocalExecutionStage,
  SimilarityOwnerLocalProviderExpectation,
} from './similarityOwnerLocalExecutionPlanTypes';

/** Builds the default, disabled-by-default owner-local execution plan policy. */
export const buildDefaultSimilarityOwnerLocalExecutionPlanPolicy =
  (): SimilarityOwnerLocalExecutionPlanPolicy => ({
    enabled: false,
    ownerLocalOnly: true,
    publicExecutionAllowed: false,
    betaExecutionAllowed: false,
    routeSuccessAllowed: false,
    liveKisCallAllowed: false,
    rawProviderPayloadAllowed: false,
    requireAuth: true,
    requireUsageStorage: true,
    requireOwnerApprovalBeforeExecution: true,
    requireProviderSmokeBeforeExecution: true,
    requireRouteShellFeatureFlagApproval: true,
    notes: [
      'This phase defines a plan only; no execution path is enabled.',
      'Owner-local KIS-normalized execution requires a separately authorized phase before it may run.',
      'This policy module never reads process.env or .env values.',
    ],
  });

/** Builds the provider data expectation for a future owner-local KIS-normalized fetch. */
export const buildOwnerLocalProviderExpectation = (
  assetType: 'stock' | 'etf' = 'stock',
): SimilarityOwnerLocalProviderExpectation => ({
  source: 'owner-local',
  market: 'KR',
  assetType,
  timeframe: 'daily',
  normalizedOnly: true,
  rawProviderPayloadAllowed: false,
  accountOrTradingAllowed: false,
  publicExecutionAllowed: false,
});

/** Builds the ordered future execution stages, from route shell through safe response packaging. */
export const buildOwnerLocalExecutionStages = (): SimilarityOwnerLocalExecutionStage[] => [
  'route_shell',
  'auth_mapping',
  'usage_check',
  'kis_normalized_ohlc_fetch',
  'normalized_ohlc_validation',
  'similarity_engine_scan',
  'safe_response_packaging',
];

/**
 * Builds the activation gates that must all be satisfied before owner-local execution may be
 * enabled. Static policy invariants (raw provider payload exclusion, public execution disabled,
 * route success disabled) are already satisfied by design in this phase; every other gate
 * represents a decision or approval that has not yet been made.
 */
export const buildOwnerLocalExecutionGates = (): SimilarityOwnerLocalExecutionGate[] => [
  {
    name: 'owner_approval',
    required: true,
    satisfied: false,
    safeMessage: 'Owner approval of owner-local execution behavior has not been granted in this phase.',
  },
  {
    name: 'owner_local_environment',
    required: true,
    satisfied: false,
    safeMessage: 'Owner-local environment confirmation has not been established in this phase.',
  },
  {
    name: 'auth_decision',
    required: true,
    satisfied: false,
    safeMessage: 'A real auth integration decision has not been made in this phase.',
  },
  {
    name: 'usage_storage_approval',
    required: true,
    satisfied: false,
    safeMessage: 'Usage storage approval has not been granted in this phase.',
  },
  {
    name: 'provider_smoke_approval',
    required: true,
    satisfied: false,
    safeMessage: 'Owner-local provider smoke approval has not been granted in this phase.',
  },
  {
    name: 'route_feature_flag_approval',
    required: true,
    satisfied: false,
    safeMessage: 'Route shell feature flag approval has not been granted in this phase.',
  },
  {
    name: 'raw_provider_payload_exclusion',
    required: true,
    satisfied: true,
    safeMessage: 'Raw provider payload exclusion is a static policy invariant in this phase.',
  },
  {
    name: 'public_execution_disabled',
    required: true,
    satisfied: true,
    safeMessage: 'Public execution remains disabled by static policy in this phase.',
  },
  {
    name: 'route_success_disabled',
    required: true,
    satisfied: true,
    safeMessage: 'Route success remains disabled by static policy in this phase.',
  },
];

/**
 * Returns whether owner-local execution would be allowed under the supplied plan. Requires every
 * gate to be `required: false` or `satisfied: true`, and `policy.enabled` to be `true`. Since the
 * default policy's `enabled` field is fixed `false`, this always returns `false` in this phase.
 */
export const isOwnerLocalExecutionAllowedByPlan = (
  gates: SimilarityOwnerLocalExecutionGate[],
  policy: SimilarityOwnerLocalExecutionPlanPolicy,
): boolean => {
  if (!policy.enabled) {
    return false;
  }
  return gates.every((gate) => !gate.required || gate.satisfied);
};

const resolvePlanStatus = (
  gates: SimilarityOwnerLocalExecutionGate[],
  policy: SimilarityOwnerLocalExecutionPlanPolicy,
): SimilarityOwnerLocalExecutionPlanStatus => {
  if (isOwnerLocalExecutionAllowedByPlan(gates, policy)) {
    return 'engine_ready';
  }
  return 'design_only';
};

/**
 * Combines the default policy, ordered stages, activation gates, and provider expectation into a
 * full plan result. Makes clear that this phase does not execute KIS, does not execute the
 * similarity engine, and does not enable route success.
 */
export const buildSimilarityOwnerLocalExecutionPlanResult = (
  policy: SimilarityOwnerLocalExecutionPlanPolicy = buildDefaultSimilarityOwnerLocalExecutionPlanPolicy(),
  assetType: 'stock' | 'etf' = 'stock',
): SimilarityOwnerLocalExecutionPlanResult => {
  const stages = buildOwnerLocalExecutionStages();
  const gates = buildOwnerLocalExecutionGates();
  const providerExpectation = buildOwnerLocalProviderExpectation(assetType);
  const status = resolvePlanStatus(gates, policy);

  return {
    status,
    source: 'owner-local',
    stages,
    gates,
    providerExpectation,
    policy,
    safeMessage:
      'This phase defines the owner-local KIS-normalized similarity execution plan only. It does not call KIS, does not execute the deterministic similarity engine, and does not enable route success.',
    warnings: [
      'No KIS call is made by this module.',
      'No live similarity engine execution occurs in this phase.',
      'Route success remains disabled until a separately authorized phase enables it.',
    ],
  };
};
