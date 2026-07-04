/**
 * Server-only owner-local manual smoke run type foundation for Chart Similarity execution
 * (Phase 3FA-D-MANUAL-RUN).
 *
 * These types describe a separately owner-approved owner-local manual KIS OHLC smoke run. They
 * allow a live KIS OHLC probe to be represented only through redacted outcome fields — booleans,
 * count buckets, and status strings — and never through raw market data, raw KIS payload fields,
 * secrets, credentials, or actual values. No user id, no role, no auth state, no session/access/
 * provider token, no email, no IP address, no request header, no cookie, no raw auth provider
 * payload, no KIS credential, no raw KIS response field, no actual OHLC price or volume, no
 * market timestamp, no similarity score or derived return computed from real data, no account/
 * trading/order/balance field, no DB/cache connection string, and no SQL string is present in any
 * of these types. This file defines shapes only — it performs no I/O and touches no database.
 *
 * This module must never be imported from client-accessible page code in this phase.
 */

export type SimilarityOwnerLocalManualRunStatus =
  | 'not_run'
  | 'blocked'
  | 'executed_redacted'
  | 'failed_redacted';

export type SimilarityOwnerLocalManualRunDecision =
  | 'owner_approved_manual_run'
  | 'blocked_by_missing_approval'
  | 'blocked_by_policy'
  | 'failed_before_provider_call'
  | 'failed_after_redaction';

export type SimilarityOwnerLocalManualRunCheckStatus = 'pass' | 'fail' | 'blocked' | 'not_run';

export type SimilarityOwnerLocalManualRunCheck = {
  name: string;
  status: SimilarityOwnerLocalManualRunCheckStatus;
  safeMessage: string;
};

export type SimilarityOwnerLocalManualRunPolicy = {
  enabled: boolean;
  ownerApprovedKisCall: boolean;
  ownerLocalOnly: true;
  allowKisOhlcProviderCall: boolean;
  allowSimilarityEngineContractCheck: boolean;
  allowRouteCall: false;
  allowRouteSuccess: false;
  allowPublicExecution: false;
  allowBetaExecution: false;
  allowRawProviderPayloadInReport: false;
  allowMarketValuesInReport: false;
  allowVolumeInReport: false;
  allowMarketTimestampsInReport: false;
  allowSimilarityScoresInReport: false;
  allowDerivedReturnsInReport: false;
  allowCredentialEcho: false;
  allowEnvEcho: false;
  notes: string[];
};

export type SimilarityOwnerLocalManualRunProviderProbe = {
  status: 'not_run' | 'blocked' | 'pass' | 'fail';
  provider: 'kis';
  market: 'KR';
  timeframe: 'daily';
  normalizedBarsAvailable: boolean;
  normalizedBarCountBucket: 'none' | 'one_to_twenty' | 'twenty_one_to_one_hundred' | 'over_one_hundred' | 'unknown';
  safeMessage: string;
};

export type SimilarityOwnerLocalManualRunEngineContractCheck = {
  status: 'not_run' | 'blocked' | 'pass' | 'fail';
  engineInvoked: boolean;
  safeMessage: string;
};

export type SimilarityOwnerLocalManualRunRedactionCheck = {
  status: 'pass' | 'fail';
  rawProviderPayloadPrinted: false;
  marketValuesPrinted: false;
  credentialsPrinted: false;
  envValuesPrinted: false;
  safeMessage: string;
};

export type SimilarityOwnerLocalManualRunReport = {
  status: SimilarityOwnerLocalManualRunStatus;
  decision: SimilarityOwnerLocalManualRunDecision;
  smokeExecuted: boolean;
  source: 'owner-local';
  routeStatus: 'feature_disabled';
  providerProbe: SimilarityOwnerLocalManualRunProviderProbe;
  engineContractCheck: SimilarityOwnerLocalManualRunEngineContractCheck;
  redactionCheck: SimilarityOwnerLocalManualRunRedactionCheck;
  checks: SimilarityOwnerLocalManualRunCheck[];
  safeSummary: string;
  warnings: string[];
};

export type SimilarityOwnerLocalManualRunResult = {
  status: SimilarityOwnerLocalManualRunStatus;
  policy: SimilarityOwnerLocalManualRunPolicy;
  report: SimilarityOwnerLocalManualRunReport;
  safeMessage: string;
  warnings: string[];
};
