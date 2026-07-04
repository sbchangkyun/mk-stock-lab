/**
 * Server-only owner-local KIS credential configuration check type foundation for Chart
 * Similarity execution (Phase 3FA-D-MANUAL-RUN-HF1).
 *
 * These types describe a credential configuration readiness check only. They allow required
 * environment variable key NAMES, boolean presence, and safe status/decision strings — and never
 * an actual environment value, a value length, a value prefix/suffix, a value hash/fingerprint, a
 * raw KIS payload field, a credential/token/secret value, an account/trading/order/balance field,
 * a market OHLC/volume/timestamp field, a similarity score/return, a DB/cache connection string,
 * or a SQL string. This file defines shapes only — it performs no I/O, reads no environment
 * variable, and touches no database.
 *
 * This module must never be imported from client-accessible page code in this phase.
 */

export type SimilarityOwnerLocalCredentialCheckStatus =
  | 'configured'
  | 'missing'
  | 'partial'
  | 'blocked'
  | 'not_checked';

export type SimilarityOwnerLocalCredentialCheckDecision =
  | 'ready_for_manual_run_retry'
  | 'missing_required_env'
  | 'blocked_by_no_secret_echo_policy'
  | 'blocked_by_source_discovery_failure';

export type SimilarityOwnerLocalCredentialCheckSource =
  | 'existing_owner_local_kis_client_source'
  | 'manual_required_key_list';

export type SimilarityOwnerLocalCredentialKeyRequirement = {
  name: string;
  required: true;
  description: string;
  source: SimilarityOwnerLocalCredentialCheckSource;
};

export type SimilarityOwnerLocalCredentialKeyStatus = {
  name: string;
  required: true;
  present: boolean;
  valueEchoed: false;
  safeMessage: string;
};

export type SimilarityOwnerLocalCredentialCheckPolicy = {
  enabled: boolean;
  allowProcessEnvPresenceCheck: boolean;
  allowDotenvRead: false;
  allowEnvValueEcho: false;
  allowValueLengthEcho: false;
  allowValuePrefixSuffixEcho: false;
  allowValueHashEcho: false;
  allowKisCall: false;
  allowRouteCall: false;
  allowCredentialPersistence: false;
  ownerLocalOnly: true;
  notes: string[];
};

export type SimilarityOwnerLocalCredentialCheckReport = {
  status: SimilarityOwnerLocalCredentialCheckStatus;
  decision: SimilarityOwnerLocalCredentialCheckDecision;
  source: 'owner-local';
  requiredKeys: SimilarityOwnerLocalCredentialKeyRequirement[];
  keyStatuses: SimilarityOwnerLocalCredentialKeyStatus[];
  missingKeyNames: string[];
  presentKeyNames: string[];
  readyForManualRunRetry: boolean;
  valueEchoed: false;
  dotenvRead: false;
  kisCallAttempted: false;
  routeCallAttempted: false;
  safeSummary: string;
  warnings: string[];
};

export type SimilarityOwnerLocalCredentialCheckResult = {
  status: SimilarityOwnerLocalCredentialCheckStatus;
  policy: SimilarityOwnerLocalCredentialCheckPolicy;
  report: SimilarityOwnerLocalCredentialCheckReport;
  safeMessage: string;
  warnings: string[];
};
