/**
 * Server-only owner-local manual smoke run module for Chart Similarity execution
 * (Phase 3FA-D-MANUAL-RUN).
 *
 * This module is safe and deterministic except where an explicit, already-sanitized provider
 * probe result is passed into its report builders by the caller (the manual-run script). It never
 * calls KIS directly, never reads `process.env` or `.env`, never calls the API route, never
 * imports an account/trading/order/balance API, and never persists anything. It never throws for
 * expected blocked inputs and never prints raw data — it only accepts and returns booleans, count
 * buckets, and status strings. The owner-approved live KIS OHLC probe itself is performed only by
 * `scripts/smoke_phase_3fa_d_manual_run_owner_local_manual_smoke_execution.mjs`, through the
 * existing, already-approved owner-local KIS OHLC smoke client
 * (`runOwnerLocalKisOhlcSmoke` in `src/lib/server/providers/kis/kisOwnerLocalOhlcClient.ts`).
 */

import type {
  SimilarityOwnerLocalManualRunCheck,
  SimilarityOwnerLocalManualRunEngineContractCheck,
  SimilarityOwnerLocalManualRunPolicy,
  SimilarityOwnerLocalManualRunProviderProbe,
  SimilarityOwnerLocalManualRunReport,
  SimilarityOwnerLocalManualRunRedactionCheck,
  SimilarityOwnerLocalManualRunResult,
  SimilarityOwnerLocalManualRunStatus,
} from './similarityOwnerLocalManualRunTypes';

/** Builds the default, disabled-by-default owner-local manual run policy. */
export const buildDefaultSimilarityOwnerLocalManualRunPolicy =
  (): SimilarityOwnerLocalManualRunPolicy => ({
    enabled: false,
    ownerApprovedKisCall: false,
    ownerLocalOnly: true,
    allowKisOhlcProviderCall: false,
    allowSimilarityEngineContractCheck: false,
    allowRouteCall: false,
    allowRouteSuccess: false,
    allowPublicExecution: false,
    allowBetaExecution: false,
    allowRawProviderPayloadInReport: false,
    allowMarketValuesInReport: false,
    allowVolumeInReport: false,
    allowMarketTimestampsInReport: false,
    allowSimilarityScoresInReport: false,
    allowDerivedReturnsInReport: false,
    allowCredentialEcho: false,
    allowEnvEcho: false,
    notes: [
      'This is the default, disabled manual run policy; no owner approval has been supplied.',
      'A live owner-local KIS OHLC probe requires both an explicit CLI flag and an explicit env flag.',
      'This module never reads process.env or .env values.',
    ],
  });

/**
 * Builds the owner-approved manual run policy. This function only builds the policy VALUE — it
 * does not itself check any CLI flag or environment flag. The manual-run script is responsible for
 * verifying explicit owner-approval signals before ever calling this builder.
 */
export const buildApprovedSimilarityOwnerLocalManualRunPolicy =
  (): SimilarityOwnerLocalManualRunPolicy => ({
    enabled: true,
    ownerApprovedKisCall: true,
    ownerLocalOnly: true,
    allowKisOhlcProviderCall: true,
    allowSimilarityEngineContractCheck: true,
    allowRouteCall: false,
    allowRouteSuccess: false,
    allowPublicExecution: false,
    allowBetaExecution: false,
    allowRawProviderPayloadInReport: false,
    allowMarketValuesInReport: false,
    allowVolumeInReport: false,
    allowMarketTimestampsInReport: false,
    allowSimilarityScoresInReport: false,
    allowDerivedReturnsInReport: false,
    allowCredentialEcho: false,
    allowEnvEcho: false,
    notes: [
      'The owner explicitly approved a KIS OHLC call for this manual-run phase only.',
      'This approval does not extend to route success, public/beta execution, auth/storage/DB/cache, deployment, or push.',
      'This module never reads process.env or .env values; the caller supplies explicit approval.',
    ],
  });

/** Buckets a normalized bar count into a safe, non-numeric-value bucket label. */
export const bucketNormalizedBarCount = (
  count: number,
): 'none' | 'one_to_twenty' | 'twenty_one_to_one_hundred' | 'over_one_hundred' | 'unknown' => {
  if (!Number.isFinite(count) || count < 0) return 'unknown';
  if (count === 0) return 'none';
  if (count <= 20) return 'one_to_twenty';
  if (count <= 100) return 'twenty_one_to_one_hundred';
  return 'over_one_hundred';
};

/** Builds the eleven preflight checks that must be evaluated before any live provider call. */
export const buildOwnerLocalManualRunPreflightChecks = (
  policy: SimilarityOwnerLocalManualRunPolicy,
): SimilarityOwnerLocalManualRunCheck[] => [
  {
    name: 'owner_approval_present',
    status: policy.ownerApprovedKisCall ? 'pass' : 'blocked',
    safeMessage: policy.ownerApprovedKisCall
      ? 'Explicit owner approval for a KIS OHLC call is present for this manual-run phase.'
      : 'Explicit owner approval for a KIS OHLC call has not been supplied.',
  },
  {
    name: 'policy_enabled_for_manual_run',
    status: policy.enabled ? 'pass' : 'blocked',
    safeMessage: policy.enabled
      ? 'The owner-local manual run policy is enabled for this phase.'
      : 'The owner-local manual run policy remains disabled.',
  },
  {
    name: 'owner_local_only',
    status: policy.ownerLocalOnly ? 'pass' : 'fail',
    safeMessage: 'This manual run is restricted to an owner-local environment only.',
  },
  {
    name: 'route_call_disabled',
    status: !policy.allowRouteCall ? 'pass' : 'fail',
    safeMessage: 'No API route call is permitted by this manual run policy.',
  },
  {
    name: 'route_success_disabled',
    status: !policy.allowRouteSuccess ? 'pass' : 'fail',
    safeMessage: 'Route success remains disabled by this manual run policy.',
  },
  {
    name: 'public_execution_disabled',
    status: !policy.allowPublicExecution ? 'pass' : 'fail',
    safeMessage: 'No public execution is permitted by this manual run policy.',
  },
  {
    name: 'beta_execution_disabled',
    status: !policy.allowBetaExecution ? 'pass' : 'fail',
    safeMessage: 'No beta execution is permitted by this manual run policy.',
  },
  {
    name: 'raw_provider_payload_reporting_disabled',
    status: !policy.allowRawProviderPayloadInReport ? 'pass' : 'fail',
    safeMessage: 'No raw provider payload may appear in any manual run report.',
  },
  {
    name: 'market_value_reporting_disabled',
    status: !policy.allowMarketValuesInReport ? 'pass' : 'fail',
    safeMessage: 'No actual market value may appear in any manual run report.',
  },
  {
    name: 'credential_env_echo_disabled',
    status: !policy.allowCredentialEcho && !policy.allowEnvEcho ? 'pass' : 'fail',
    safeMessage: 'No credential, token, or environment value may be echoed by this manual run.',
  },
  {
    name: 'account_trading_apis_excluded',
    status: 'pass',
    safeMessage: 'Account, trading, order, and balance APIs are excluded from this manual run by design.',
  },
];

const isPreflightFullyPassed = (checks: SimilarityOwnerLocalManualRunCheck[]): boolean =>
  checks.every((check) => check.status === 'pass');

/** Builds the safe blocked report for the default/no-approval state. */
export const buildOwnerLocalManualRunBlockedReport = (
  policy: SimilarityOwnerLocalManualRunPolicy = buildDefaultSimilarityOwnerLocalManualRunPolicy(),
): SimilarityOwnerLocalManualRunReport => ({
  status: 'blocked',
  decision: 'blocked_by_missing_approval',
  smokeExecuted: false,
  source: 'owner-local',
  routeStatus: 'feature_disabled',
  providerProbe: {
    status: 'blocked',
    provider: 'kis',
    market: 'KR',
    timeframe: 'daily',
    normalizedBarsAvailable: false,
    normalizedBarCountBucket: 'none',
    safeMessage: 'No KIS OHLC provider call was attempted because explicit owner approval is missing.',
  },
  engineContractCheck: {
    status: 'blocked',
    engineInvoked: false,
    safeMessage: 'No similarity engine contract check was attempted because explicit owner approval is missing.',
  },
  redactionCheck: {
    status: 'pass',
    rawProviderPayloadPrinted: false,
    marketValuesPrinted: false,
    credentialsPrinted: false,
    envValuesPrinted: false,
    safeMessage: 'No output was produced beyond this safe blocked report.',
  },
  checks: buildOwnerLocalManualRunPreflightChecks(policy),
  safeSummary:
    'Owner-local manual smoke execution is blocked: explicit owner approval (CLI flag and env flag) was not supplied for this run.',
  warnings: [
    'No KIS call was made.',
    'No live similarity execution occurred.',
    'No API route call was made.',
    'Route success remains disabled.',
    'Explicit owner approval (CLI flag and env flag) is required before any live provider call.',
  ],
});

export type OwnerLocalManualRunRedactedReportInput = {
  policy: SimilarityOwnerLocalManualRunPolicy;
  providerProbe: SimilarityOwnerLocalManualRunProviderProbe;
  engineContractCheck: SimilarityOwnerLocalManualRunEngineContractCheck;
  redactionCheck: SimilarityOwnerLocalManualRunRedactionCheck;
};

const resolveRedactedStatus = (
  input: OwnerLocalManualRunRedactedReportInput,
  preflightPassed: boolean,
): SimilarityOwnerLocalManualRunStatus => {
  if (!preflightPassed) return 'blocked';
  if (input.providerProbe.status === 'pass' && input.redactionCheck.status === 'pass') {
    return 'executed_redacted';
  }
  return 'failed_redacted';
};

const resolveRedactedDecision = (
  status: SimilarityOwnerLocalManualRunStatus,
  input: OwnerLocalManualRunRedactedReportInput,
): SimilarityOwnerLocalManualRunReport['decision'] => {
  if (status === 'blocked') return 'blocked_by_missing_approval';
  if (status === 'executed_redacted') return 'owner_approved_manual_run';
  if (input.redactionCheck.status !== 'pass') return 'failed_after_redaction';
  return 'failed_before_provider_call';
};

/**
 * Builds a redacted report from already-sanitized fields only. Accepts no raw KIS payload, no
 * actual OHLC/volume/timestamp values, and no similarity score/return values — only status
 * strings, booleans, and a count bucket produced upstream by the manual-run script.
 */
export const buildOwnerLocalManualRunRedactedReport = (
  input: OwnerLocalManualRunRedactedReportInput,
): SimilarityOwnerLocalManualRunReport => {
  const checks = buildOwnerLocalManualRunPreflightChecks(input.policy);
  const preflightPassed = isPreflightFullyPassed(checks);
  const status = resolveRedactedStatus(input, preflightPassed);
  const decision = resolveRedactedDecision(status, input);
  const smokeExecuted =
    preflightPassed && input.policy.ownerApprovedKisCall && input.providerProbe.status !== 'not_run';

  return {
    status,
    decision,
    smokeExecuted,
    source: 'owner-local',
    routeStatus: 'feature_disabled',
    providerProbe: input.providerProbe,
    engineContractCheck: input.engineContractCheck,
    redactionCheck: input.redactionCheck,
    checks,
    safeSummary:
      status === 'executed_redacted'
        ? 'Owner-local manual smoke executed under explicit owner approval. Only redacted status fields are reported; no raw value was recorded.'
        : status === 'failed_redacted'
          ? 'Owner-local manual smoke was attempted under explicit owner approval but did not complete successfully. Only redacted status fields are reported.'
          : 'Owner-local manual smoke is blocked pending explicit owner approval.',
    warnings: [
      'No raw KIS payload is included in this report.',
      'No actual OHLC price, volume, or market timestamp is included in this report.',
      'No similarity score or derived return is included in this report.',
      'Route success remains disabled regardless of this manual run outcome.',
    ],
  };
};

/** Wraps a policy and report into the full owner-local manual run result. */
export const buildOwnerLocalManualRunResult = (
  policy: SimilarityOwnerLocalManualRunPolicy,
  report: SimilarityOwnerLocalManualRunReport,
): SimilarityOwnerLocalManualRunResult => ({
  status: report.status,
  policy,
  report,
  safeMessage:
    'This result contains only redacted status fields. No raw KIS payload, actual market value, credential, token, or environment value is present.',
  warnings: report.warnings,
});

// All patterns below are intentionally scoped to JSON key/value shapes (`"key": value`) rather
// than bare English words, so that safe, descriptive prose in this module's own safeMessage/
// warnings strings (which may legitimately mention words like "account" or "token" to explain
// what is excluded) can never trip these checks as a false positive. Only an actual leaked field
// would match.
const RAW_KIS_FIELD_PATTERN =
  /"(stck_prpr|stck_oprc|stck_hgpr|stck_lwpr|stck_clpr|stck_bsop_date|rt_cd|acml_vol|hts_kor_isnm)"/i;
const ACTUAL_PRICE_VOLUME_PATTERN = /"(open|high|low|close|volume|price)"\s*:\s*-?\d/i;
const MARKET_TIMESTAMP_PATTERN = /"(date|dateTime|timestamp|bsopDate)"\s*:\s*"[0-9]{4}-?[0-9]{2}-?[0-9]{2}/i;
const SIMILARITY_SCORE_RETURN_PATTERN = /"(similarityScore|score|return|returns)"\s*:\s*-?\d/i;
const CREDENTIAL_ENV_PATTERN =
  /"(appKey|appSecret|app_key|app_secret|accessToken|access_token|authorization|password|KIS_APP_KEY|KIS_APP_SECRET|KIS_ACCESS_TOKEN)"\s*:/i;
const ACCOUNT_TRADING_PATTERN = /"(account|accountNo|accountNumber|trading|order|orderId|balance)"\s*:/i;
const TOKEN_EMAIL_IP_COOKIE_HEADER_PATTERN = /"(token|email|ip|cookie|header)"\s*:/i;
const SOURCE_LIVE_AUTO_PATTERN = /"source"\s*:\s*"(live|auto)"/i;

const FORBIDDEN_PATTERNS = [
  RAW_KIS_FIELD_PATTERN,
  ACTUAL_PRICE_VOLUME_PATTERN,
  MARKET_TIMESTAMP_PATTERN,
  SIMILARITY_SCORE_RETURN_PATTERN,
  CREDENTIAL_ENV_PATTERN,
  ACCOUNT_TRADING_PATTERN,
  TOKEN_EMAIL_IP_COOKIE_HEADER_PATTERN,
  SOURCE_LIVE_AUTO_PATTERN,
];

/**
 * Returns a sanitized string safe for scanning/reporting. Accepts a string or a plain object;
 * any prohibited pattern found is replaced with `[redacted]`. This is a defense-in-depth helper —
 * the manual run report builders above never include a raw value to begin with.
 */
export const sanitizeManualRunSerializedOutput = (input: string | Record<string, unknown>): string => {
  const raw = typeof input === 'string' ? input : JSON.stringify(input);
  return FORBIDDEN_PATTERNS.reduce(
    (acc, pattern) => acc.replace(new RegExp(pattern.source, `${pattern.flags}g`), '[redacted]'),
    raw,
  );
};

/**
 * Inspects a serialized manual run report and returns whether it is fully redacted. Returns
 * `false` if the serialized output contains a raw KIS field, an actual OHLC/volume/timestamp
 * value, a similarity score/return, a token/email/cookie/header field, an account/trading/order/
 * balance field, `source: "live"`/`"auto"`, or a credential/env string.
 */
export const assertManualRunReportIsRedacted = (input: string | Record<string, unknown>): boolean => {
  const raw = typeof input === 'string' ? input : JSON.stringify(input);
  return !FORBIDDEN_PATTERNS.some((pattern) => pattern.test(raw));
};
