/**
 * Server-only owner-local manual smoke execution closeout module for Chart Similarity execution
 * (Phase 3FA-D).
 *
 * This module is safe runtime scaffolding only. It is pure and deterministic: it never imports a
 * live KIS provider/client module, never calls KIS, never imports or calls the real similarity
 * engine, never imports an auth provider or a DB/cache provider, never reads cookies, headers,
 * `localStorage`/`sessionStorage`, `process.env`, or `.env`, never performs a network call, never
 * persists anything, never uses `Date.now` or the current runtime date, and never throws for the
 * expected inputs handled here. It reuses the Phase 3FA-C disabled smoke harness builder for the
 * "disabled harness exists" closeout step. The default policy's `enabled` and `liveSmokeExecuted`
 * fields are fixed `false`, so this phase never records a live smoke as executed, and
 * `buildOwnerLocalSmokeCloseoutReport` never returns a live success status — only
 * "closed_without_execution", "not_executed", or "blocked".
 */

import { runOwnerLocalSmokeHarnessDisabled } from './similarityOwnerLocalSmokeHarness';
import type {
  SimilarityOwnerLocalSmokeCloseoutCheck,
  SimilarityOwnerLocalSmokeCloseoutDecision,
  SimilarityOwnerLocalSmokeCloseoutPolicy,
  SimilarityOwnerLocalSmokeCloseoutReport,
  SimilarityOwnerLocalSmokeCloseoutResult,
  SimilarityOwnerLocalSmokeCloseoutStatus,
} from './similarityOwnerLocalSmokeCloseoutTypes';

/** Builds the default, disabled-by-default owner-local manual smoke execution closeout policy. */
export const buildDefaultSimilarityOwnerLocalSmokeCloseoutPolicy =
  (): SimilarityOwnerLocalSmokeCloseoutPolicy => ({
    enabled: false,
    liveSmokeExecuted: false,
    allowLiveKisCall: false,
    allowLiveSimilarityExecution: false,
    allowRouteSuccess: false,
    allowRouteCall: false,
    allowEnvRead: false,
    allowMarketDataInReport: false,
    allowRawProviderPayload: false,
    allowCredentialEcho: false,
    requireOwnerApprovalForNextPhase: true,
    requireManualSmokeSeparateCommand: true,
    notes: [
      'This phase closes out the disabled harness only; no owner-local manual smoke is executed.',
      'A future live owner-local manual smoke requires a separately authorized phase before it may run.',
      'This module never reads process.env or .env values.',
    ],
  });

/**
 * Builds the static closeout checks. All static closeout checks may pass by design; any check
 * that requires future live execution approval remains "not_run" or "blocked".
 */
export const buildOwnerLocalSmokeCloseoutChecks = (): SimilarityOwnerLocalSmokeCloseoutCheck[] => [
  {
    name: 'disabled_harness_exists',
    status: 'pass',
    safeMessage: 'The Phase 3FA-C disabled owner-local smoke harness exists as a safe design reference.',
  },
  {
    name: 'disabled_harness_remains_disabled',
    status: 'pass',
    safeMessage: 'The owner-local smoke harness remains disabled by default in this phase.',
  },
  {
    name: 'route_remains_feature_disabled',
    status: 'pass',
    safeMessage: 'The similarity API route remains feature-disabled in this phase.',
  },
  {
    name: 'live_kis_call_not_executed',
    status: 'not_run',
    safeMessage: 'No live KIS call has been executed in this phase.',
  },
  {
    name: 'live_similarity_execution_not_executed',
    status: 'not_run',
    safeMessage: 'No live similarity engine execution has been executed in this phase.',
  },
  {
    name: 'route_call_not_executed',
    status: 'not_run',
    safeMessage: 'No API route call has been executed in this phase.',
  },
  {
    name: 'env_read_not_executed',
    status: 'not_run',
    safeMessage: 'No environment value has been read in this phase.',
  },
  {
    name: 'market_data_not_reported',
    status: 'pass',
    safeMessage: 'No actual market data is included in this closeout report.',
  },
  {
    name: 'raw_provider_payload_not_reported',
    status: 'pass',
    safeMessage: 'No raw provider payload is included in this closeout report.',
  },
  {
    name: 'credential_echo_not_reported',
    status: 'pass',
    safeMessage: 'No credential or token value is included in this closeout report.',
  },
  {
    name: 'owner_approval_required_for_next_phase',
    status: 'blocked',
    safeMessage: 'Explicit owner approval is required before any separately authorized manual smoke phase.',
  },
  {
    name: 'manual_smoke_requires_separate_command',
    status: 'blocked',
    safeMessage: 'Any future live manual smoke must be run via a separate, explicitly authorized command.',
  },
];

/**
 * Builds the deterministic, safe closeout report. Always records that no live smoke was executed,
 * that the harness remains disabled, and that the route remains feature-disabled.
 */
export const buildOwnerLocalSmokeCloseoutReport = (): SimilarityOwnerLocalSmokeCloseoutReport => ({
  status: 'closed_without_execution',
  decision: 'request_owner_approval_for_manual_smoke',
  smokeExecuted: false,
  harnessStatus: 'disabled',
  routeStatus: 'feature_disabled',
  source: 'owner-local',
  safeSummary:
    'Owner-local manual smoke execution was not run in this phase. The disabled harness remains closed out and requires separate owner approval before any live manual smoke.',
  checks: buildOwnerLocalSmokeCloseoutChecks(),
  warnings: [
    'No KIS call is made by this closeout.',
    'No live similarity engine execution occurs in this phase.',
    'No API route call is made by this closeout.',
    'No actual market value is included in this report.',
    'No environment value is read by this closeout.',
    'Separate owner approval is required before any live owner-local manual smoke.',
  ],
  nextAllowedPhase: '3FA-D-MANUAL-RUN',
});

const resolveCloseoutStatus = (
  policy: SimilarityOwnerLocalSmokeCloseoutPolicy,
): SimilarityOwnerLocalSmokeCloseoutStatus =>
  policy.enabled ? 'blocked' : 'closed_without_execution';

const resolveCloseoutDecision = (
  policy: SimilarityOwnerLocalSmokeCloseoutPolicy,
): SimilarityOwnerLocalSmokeCloseoutDecision =>
  policy.enabled ? 'blocked_by_policy' : 'request_owner_approval_for_manual_smoke';

/**
 * Builds the full owner-local manual smoke execution closeout result. Loads the Phase 3FA-C
 * disabled smoke harness as a safe design reference (no execution), evaluates the static closeout
 * checks, and returns a `SimilarityOwnerLocalSmokeCloseoutResult` whose top-level `status` is
 * always "closed_without_execution" or "blocked" under the default policy — never a live success
 * status. Performs no live provider, engine, route, auth, usage, DB, or network access.
 */
export const buildSimilarityOwnerLocalSmokeCloseoutResult = (
  policy: SimilarityOwnerLocalSmokeCloseoutPolicy = buildDefaultSimilarityOwnerLocalSmokeCloseoutPolicy(),
): SimilarityOwnerLocalSmokeCloseoutResult => {
  runOwnerLocalSmokeHarnessDisabled();
  const report = buildOwnerLocalSmokeCloseoutReport();
  const status = resolveCloseoutStatus(policy);
  const decision = resolveCloseoutDecision(policy);

  return {
    status,
    policy,
    report: { ...report, status, decision },
    safeMessage:
      'This phase closes out the disabled owner-local manual smoke without executing it. No live smoke was executed, the route remains feature-disabled, and separate owner approval is required before any live owner-local manual smoke.',
    warnings: [
      'No live smoke was executed in this phase.',
      'The route remains feature-disabled in this phase.',
      'Separate owner approval is required before any live owner-local manual smoke.',
    ],
  };
};

/**
 * Returns whether the owner-local manual smoke execution is closed out, meaning no live smoke has
 * been executed and no live KIS call, live similarity execution, or route success is permitted.
 * Under the default policy in this phase, this always returns `true`.
 */
export const isOwnerLocalManualSmokeExecutionClosed = (
  policy: SimilarityOwnerLocalSmokeCloseoutPolicy,
): boolean =>
  !policy.liveSmokeExecuted &&
  !policy.allowRouteSuccess &&
  !policy.allowLiveKisCall &&
  !policy.allowLiveSimilarityExecution;

/**
 * Returns whether the owner-local manual smoke is ready for a separate manual-run approval
 * decision. This indicates readiness for a future approval decision only — it never grants
 * permission to execute a live smoke.
 */
export const isOwnerLocalManualSmokeReadyForSeparateApproval = (
  policy: SimilarityOwnerLocalSmokeCloseoutPolicy,
): boolean =>
  isOwnerLocalManualSmokeExecutionClosed(policy) &&
  policy.requireOwnerApprovalForNextPhase &&
  policy.requireManualSmokeSeparateCommand;
