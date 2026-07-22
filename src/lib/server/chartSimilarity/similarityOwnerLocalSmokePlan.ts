/**
 * Server-only owner-local KIS similarity smoke plan module for Chart Similarity execution
 * (Phase 3FA-B).
 *
 * This module is design/foundation only. It defines the future ordered manual smoke sequence,
 * preflight/activation gates, a strict redaction policy, and a safe report template for an
 * owner-local KIS similarity smoke. It never imports a live KIS provider/client module, a real
 * similarity engine, an auth provider, or a DB/cache provider. It never reads cookies, headers,
 * `localStorage`/`sessionStorage`, `process.env`, or `.env`, never performs a network call, never
 * uses `Date.now` or the current runtime date, and never persists anything. It never throws for
 * the expected design inputs handled here. The default policy's `enabled` field is fixed `false`,
 * so `isOwnerLocalSmokeAllowedByPlan` always returns `false` in this phase — no smoke is enabled
 * and the existing `/api/chart-ai/similarity` route continues to return `feature_disabled`
 * unconditionally.
 */

import type {
  SimilarityOwnerLocalSmokeCheckOutcome,
  SimilarityOwnerLocalSmokeGate,
  SimilarityOwnerLocalSmokePlanPolicy,
  SimilarityOwnerLocalSmokePlanResult,
  SimilarityOwnerLocalSmokePlanStatus,
  SimilarityOwnerLocalSmokeRedactionPolicy,
  SimilarityOwnerLocalSmokeReportTemplate,
  SimilarityOwnerLocalSmokeStage,
} from './similarityOwnerLocalSmokePlanTypes';

/** Builds the default, disabled-by-default owner-local smoke plan policy. */
export const buildDefaultSimilarityOwnerLocalSmokePlanPolicy =
  (): SimilarityOwnerLocalSmokePlanPolicy => ({
    enabled: false,
    ownerLocalOnly: true,
    manualExecutionOnly: true,
    publicExecutionAllowed: false,
    betaExecutionAllowed: false,
    routeSuccessAllowed: false,
    liveKisCallAllowedInThisPhase: false,
    liveSimilarityExecutionAllowedInThisPhase: false,
    rawProviderPayloadAllowed: false,
    actualMarketValuesInReportsAllowed: false,
    requiresOwnerApprovalBeforeSmoke: true,
    requiresProviderEnvPreparedButUnreadByPlan: true,
    requiresRouteShellToRemainDisabled: true,
    requiresNoStoreResponsePolicy: true,
    notes: [
      'This phase defines a smoke plan only; no owner-local smoke is executed.',
      'A future owner-local manual smoke requires a separately authorized phase before it may run.',
      'This policy module never reads process.env or .env values.',
    ],
  });

/** Builds the ordered future manual smoke stages, from preflight through manual review closeout. */
export const buildOwnerLocalSmokeStages = (): SimilarityOwnerLocalSmokeStage[] => [
  'preflight_boundary_check',
  'owner_local_environment_confirmation',
  'route_shell_disabled_confirmation',
  'auth_usage_precondition_review',
  'kis_normalized_ohlc_provider_probe',
  'normalized_bar_shape_validation',
  'similarity_engine_contract_dry_run',
  'safe_response_redaction_check',
  'manual_review_closeout',
];

/**
 * Builds the preflight/activation gates that must all be satisfied before an owner-local smoke may
 * be enabled. Static safety gates (public execution disabled, beta execution disabled, raw
 * provider payload exclusion, no actual market values in report, no credential/env echo, no
 * deployment/push) are already satisfied by design in this phase; every other gate represents a
 * decision or confirmation that has not yet been made.
 */
export const buildOwnerLocalSmokeGates = (): SimilarityOwnerLocalSmokeGate[] => [
  {
    name: 'owner_approval_before_smoke',
    required: true,
    satisfied: false,
    safeMessage: 'Owner approval before owner-local smoke has not been granted in this phase.',
  },
  {
    name: 'owner_local_environment_confirmation',
    required: true,
    satisfied: false,
    safeMessage: 'Owner-local environment confirmation has not been established in this phase.',
  },
  {
    name: 'provider_env_prepared_but_unread_by_plan',
    required: true,
    satisfied: false,
    safeMessage: 'Provider environment preparation has not been confirmed in this phase; this plan never reads it.',
  },
  {
    name: 'route_shell_remains_disabled',
    required: true,
    satisfied: false,
    safeMessage: 'Route shell disabled confirmation has not been performed in this phase.',
  },
  {
    name: 'route_success_disabled',
    required: true,
    satisfied: true,
    safeMessage: 'Route success remains disabled by static policy in this phase.',
  },
  {
    name: 'public_execution_disabled',
    required: true,
    satisfied: true,
    safeMessage: 'Public execution remains disabled by static policy in this phase.',
  },
  {
    name: 'beta_execution_disabled',
    required: true,
    satisfied: true,
    safeMessage: 'Beta execution remains disabled by static policy in this phase.',
  },
  {
    name: 'raw_provider_payload_exclusion',
    required: true,
    satisfied: true,
    safeMessage: 'Raw provider payload exclusion is a static policy invariant in this phase.',
  },
  {
    name: 'no_actual_market_values_in_report',
    required: true,
    satisfied: true,
    safeMessage: 'No actual market values may appear in any smoke report by static policy in this phase.',
  },
  {
    name: 'no_credential_env_echo',
    required: true,
    satisfied: true,
    safeMessage: 'No credential or env value may be echoed by static policy in this phase.',
  },
  {
    name: 'no_deployment_or_push',
    required: true,
    satisfied: true,
    safeMessage: 'No deployment or push occurs as part of this plan in this phase.',
  },
];

/** Builds the strict redaction policy that future owner-local smoke reports must follow. */
export const buildOwnerLocalSmokeRedactionPolicy = (): SimilarityOwnerLocalSmokeRedactionPolicy => ({
  allowRawKisPayload: false,
  allowOhlcValuesInReport: false,
  allowVolumeValuesInReport: false,
  allowTimestampsInReport: false,
  allowSimilarityScoresInReport: false,
  allowDerivedReturnsInReport: false,
  allowCredentialEcho: false,
  allowTokenEcho: false,
  allowEnvEcho: false,
  allowedReportFields: [
    'status',
    'smokeId',
    'executedBy',
    'source',
    'providerProbe',
    'normalizationCheck',
    'engineContractCheck',
    'responseRedactionCheck',
    'safeSummary',
    'warnings',
  ],
});

/** Builds a deterministic, not-yet-run safe smoke report template. */
export const buildOwnerLocalSmokeReportTemplate = (): SimilarityOwnerLocalSmokeReportTemplate => {
  const notRun: SimilarityOwnerLocalSmokeCheckOutcome = 'not_run';
  return {
    status: notRun,
    smokeId: 'owner-local-kis-similarity-smoke-plan',
    executedBy: 'owner-local-manual',
    source: 'owner-local',
    providerProbe: notRun,
    normalizationCheck: notRun,
    engineContractCheck: notRun,
    responseRedactionCheck: notRun,
    safeSummary: 'Owner-local KIS similarity smoke has not been executed in this phase.',
    warnings: [
      'No KIS call is made by this plan.',
      'No actual market value is included in this template.',
      'Route success remains disabled until a separately authorized phase enables it.',
    ],
  };
};

/**
 * Returns whether an owner-local smoke would be allowed under the supplied plan. Requires every
 * gate to be `required: false` or `satisfied: true`, and `policy.enabled` to be `true`. Since the
 * default policy's `enabled` field is fixed `false`, this always returns `false` in this phase.
 */
export const isOwnerLocalSmokeAllowedByPlan = (
  gates: SimilarityOwnerLocalSmokeGate[],
  policy: SimilarityOwnerLocalSmokePlanPolicy,
): boolean => {
  if (!policy.enabled) {
    return false;
  }
  return gates.every((gate) => !gate.required || gate.satisfied);
};

const resolveSmokePlanStatus = (
  gates: SimilarityOwnerLocalSmokeGate[],
  policy: SimilarityOwnerLocalSmokePlanPolicy,
): SimilarityOwnerLocalSmokePlanStatus => {
  if (isOwnerLocalSmokeAllowedByPlan(gates, policy)) {
    return 'ready_for_manual_smoke';
  }
  return 'design_only';
};

/**
 * Combines the default policy, ordered stages, gates, redaction policy, and report template into a
 * full smoke plan result. Makes clear that this phase does not execute KIS, does not execute the
 * similarity engine, does not read env, and does not enable route success.
 */
export const buildSimilarityOwnerLocalSmokePlanResult = (
  policy: SimilarityOwnerLocalSmokePlanPolicy = buildDefaultSimilarityOwnerLocalSmokePlanPolicy(),
): SimilarityOwnerLocalSmokePlanResult => {
  const stages = buildOwnerLocalSmokeStages();
  const gates = buildOwnerLocalSmokeGates();
  const redactionPolicy = buildOwnerLocalSmokeRedactionPolicy();
  const reportTemplate = buildOwnerLocalSmokeReportTemplate();
  const status = resolveSmokePlanStatus(gates, policy);

  return {
    status,
    policy,
    stages,
    gates,
    redactionPolicy,
    reportTemplate,
    safeMessage:
      'This phase defines the owner-local KIS similarity smoke plan only. It does not call KIS, does not execute the deterministic similarity engine, does not read env, and does not enable route success.',
    warnings: [
      'No KIS call is made by this module.',
      'No live similarity engine execution occurs in this phase.',
      'Route success remains disabled until a separately authorized phase enables it.',
    ],
  };
};
