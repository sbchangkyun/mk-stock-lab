/**
 * Server-only owner-local KIS similarity smoke harness module for Chart Similarity execution
 * (Phase 3FA-C).
 *
 * This module is safe runtime scaffolding only. It is pure and deterministic: it never imports a
 * live KIS provider/client module, never calls KIS, never imports or calls the real similarity
 * engine, never imports an auth provider or a DB/cache provider, never reads cookies, headers,
 * `localStorage`/`sessionStorage`, `process.env`, or `.env`, never performs a network call, never
 * persists anything, never uses `Date.now` or the current runtime date, and never throws for the
 * expected inputs handled here. It reuses the Phase 3FA-B smoke plan builders for the plan-loading
 * step. The default policy's `enabled` field is fixed `false`, so `isOwnerLocalSmokeHarnessEnabled`
 * always returns `false` in this phase, and `runOwnerLocalSmokeHarnessDisabled` never returns a
 * "pass"/success top-level result — only "disabled" or "blocked".
 */

import { buildSimilarityOwnerLocalSmokePlanResult } from './similarityOwnerLocalSmokePlan';
import type {
  SimilarityOwnerLocalSmokeHarnessCheck,
  SimilarityOwnerLocalSmokeHarnessPolicy,
  SimilarityOwnerLocalSmokeHarnessReport,
  SimilarityOwnerLocalSmokeHarnessResult,
  SimilarityOwnerLocalSmokeHarnessStatus,
  SimilarityOwnerLocalSmokeHarnessStep,
} from './similarityOwnerLocalSmokeHarnessTypes';

/** Builds the default, disabled-by-default owner-local smoke harness policy. */
export const buildDefaultSimilarityOwnerLocalSmokeHarnessPolicy =
  (): SimilarityOwnerLocalSmokeHarnessPolicy => ({
    enabled: false,
    mode: 'disabled_harness',
    ownerLocalOnly: true,
    manualExecutionOnly: true,
    allowKisProviderCall: false,
    allowSimilarityEngineRun: false,
    allowRouteSuccess: false,
    allowMarketDataInReport: false,
    allowRawProviderPayload: false,
    allowEnvRead: false,
    allowCredentialEcho: false,
    requireOwnerApprovalBeforeLiveSmoke: true,
    requireSeparateHarnessEnableApproval: true,
    notes: [
      'This phase adds a disabled harness scaffold only; no owner-local smoke is executed.',
      'A future live owner-local smoke requires a separately authorized phase before it may run.',
      'This module never reads process.env or .env values.',
    ],
  });

/** Builds the ordered disabled-harness preflight steps, from plan load through safe report build. */
export const buildOwnerLocalSmokeHarnessSteps = (): SimilarityOwnerLocalSmokeHarnessStep[] => [
  'load_smoke_plan',
  'check_harness_policy',
  'verify_route_remains_disabled',
  'verify_redaction_policy',
  'verify_no_live_provider',
  'verify_no_live_engine',
  'build_safe_blocked_report',
];

/**
 * Builds the static safety checks for the disabled harness. All static safety checks pass by
 * design; checks that require future live execution approval remain "blocked" or "not_run".
 */
export const buildOwnerLocalSmokeHarnessChecks = (): SimilarityOwnerLocalSmokeHarnessCheck[] => [
  {
    name: 'smoke_plan_loaded',
    status: 'pass',
    safeMessage: 'The Phase 3FA-B owner-local smoke plan was loaded as a safe design reference.',
  },
  {
    name: 'harness_disabled_by_default',
    status: 'pass',
    safeMessage: 'The owner-local smoke harness policy is disabled by default in this phase.',
  },
  {
    name: 'route_success_disabled',
    status: 'pass',
    safeMessage: 'Route success remains disabled by static policy in this phase.',
  },
  {
    name: 'kis_provider_call_disabled',
    status: 'pass',
    safeMessage: 'No KIS provider call is permitted by static policy in this phase.',
  },
  {
    name: 'similarity_engine_run_disabled',
    status: 'pass',
    safeMessage: 'No similarity engine run is permitted by static policy in this phase.',
  },
  {
    name: 'market_data_in_report_disabled',
    status: 'pass',
    safeMessage: 'No market data may appear in any harness report by static policy in this phase.',
  },
  {
    name: 'raw_provider_payload_disabled',
    status: 'pass',
    safeMessage: 'No raw provider payload may appear in any harness report by static policy in this phase.',
  },
  {
    name: 'env_read_disabled',
    status: 'pass',
    safeMessage: 'No environment value is read by this harness in this phase.',
  },
  {
    name: 'credential_echo_disabled',
    status: 'pass',
    safeMessage: 'No credential or token value may be echoed by this harness in this phase.',
  },
  {
    name: 'separate_owner_approval_required',
    status: 'blocked',
    safeMessage: 'A separately authorized phase and explicit owner approval are required before any live owner-local smoke may run.',
  },
];

/** Builds the deterministic, safe blocked report for the disabled harness. */
export const buildOwnerLocalSmokeHarnessBlockedReport = (): SimilarityOwnerLocalSmokeHarnessReport => ({
  status: 'blocked',
  smokeId: 'owner-local-kis-similarity-disabled-harness',
  mode: 'disabled_harness',
  executedBy: 'disabled-harness',
  source: 'owner-local',
  providerProbe: 'not_run',
  normalizationCheck: 'not_run',
  engineContractCheck: 'not_run',
  responseRedactionCheck: 'pass',
  safeSummary:
    'Owner-local KIS similarity smoke harness is disabled by default. No KIS call, market data read, or similarity execution was performed.',
  warnings: [
    'No KIS call is made by this harness.',
    'No actual market value is included in this report.',
    'Route success remains disabled until a separately authorized phase enables it.',
    'No environment value is read by this harness.',
    'Separate owner approval is required before any live owner-local smoke.',
  ],
});

/**
 * Returns whether the owner-local smoke harness is enabled under the supplied policy. Remains
 * `false` unless `policy.enabled` is `true` and every execution permission is explicitly `true`,
 * which can only occur in a future, separately approved phase. Under the default policy in this
 * phase, this always returns `false`.
 */
export const isOwnerLocalSmokeHarnessEnabled = (
  policy: SimilarityOwnerLocalSmokeHarnessPolicy,
): boolean =>
  policy.enabled &&
  policy.allowKisProviderCall &&
  policy.allowSimilarityEngineRun &&
  policy.allowRouteSuccess;

const resolveHarnessStatus = (
  policy: SimilarityOwnerLocalSmokeHarnessPolicy,
): SimilarityOwnerLocalSmokeHarnessStatus => (policy.enabled ? 'blocked' : 'disabled');

/**
 * Runs the disabled owner-local smoke harness. Loads the Phase 3FA-B smoke plan as a safe design
 * reference (no execution), evaluates the static safety checks, and returns a
 * `SimilarityOwnerLocalSmokeHarnessResult` whose top-level `status` is always "disabled" or
 * "blocked" under the default policy — never "pass"/success. Performs no live provider, engine,
 * route, auth, usage, DB, or network access.
 */
export const runOwnerLocalSmokeHarnessDisabled = (
  policy: SimilarityOwnerLocalSmokeHarnessPolicy = buildDefaultSimilarityOwnerLocalSmokeHarnessPolicy(),
): SimilarityOwnerLocalSmokeHarnessResult => {
  buildSimilarityOwnerLocalSmokePlanResult();
  const steps = buildOwnerLocalSmokeHarnessSteps();
  const checks = buildOwnerLocalSmokeHarnessChecks();
  const report = buildOwnerLocalSmokeHarnessBlockedReport();
  const status = resolveHarnessStatus(policy);

  return {
    status,
    policy,
    steps,
    checks,
    report,
    safeMessage:
      'This phase adds a disabled owner-local KIS similarity smoke harness scaffold only. It does not call KIS, does not execute the deterministic similarity engine, does not read env, and does not enable route success.',
    warnings: [
      'No KIS call is made by this harness.',
      'No live similarity engine execution occurs in this phase.',
      'Route success remains disabled until a separately authorized phase enables it.',
    ],
  };
};
