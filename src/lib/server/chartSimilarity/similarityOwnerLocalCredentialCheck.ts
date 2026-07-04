/**
 * Server-only owner-local KIS credential configuration check module for Chart Similarity
 * execution (Phase 3FA-D-MANUAL-RUN-HF1).
 *
 * This module is pure and deterministic except for a caller-supplied presence map — it never
 * reads `process.env` or `.env` itself, never imports `dotenv`, never imports or calls a live KIS
 * provider/client, never calls the API route, and never imports an auth/storage/DB/cache provider
 * or an account/trading/order/balance API. It accepts only a `Record<string, boolean>` presence
 * map as input and never accepts, returns, or logs an actual environment value, a value length, a
 * value prefix/suffix, or a value hash/fingerprint. Reading `process.env` key presence is the sole
 * responsibility of the caller (the credential-check script), never of this module.
 *
 * The required KIS credential env key names below intentionally mirror `REQUIRED_KR_ENV_NAMES` in
 * the existing, already-approved `src/lib/server/providers/kis/kisOwnerLocalOhlcClient.ts` (Phase
 * 3ES) — this module defines its own local, safe copy of those names rather than importing that
 * file, so this module never pulls in the live KIS provider/transport import chain.
 */

import type {
  SimilarityOwnerLocalCredentialCheckDecision,
  SimilarityOwnerLocalCredentialCheckPolicy,
  SimilarityOwnerLocalCredentialCheckReport,
  SimilarityOwnerLocalCredentialCheckResult,
  SimilarityOwnerLocalCredentialCheckStatus,
  SimilarityOwnerLocalCredentialKeyRequirement,
  SimilarityOwnerLocalCredentialKeyStatus,
} from './similarityOwnerLocalCredentialCheckTypes';

/** Builds the default owner-local credential check policy. */
export const buildDefaultSimilarityOwnerLocalCredentialCheckPolicy =
  (): SimilarityOwnerLocalCredentialCheckPolicy => ({
    enabled: true,
    allowProcessEnvPresenceCheck: true,
    allowDotenvRead: false,
    allowEnvValueEcho: false,
    allowValueLengthEcho: false,
    allowValuePrefixSuffixEcho: false,
    allowValueHashEcho: false,
    allowKisCall: false,
    allowRouteCall: false,
    allowCredentialPersistence: false,
    ownerLocalOnly: true,
    notes: [
      'This check reports only key-name presence booleans; it never reads or reports an actual value.',
      'This module never reads process.env or .env itself; the caller supplies a presence map.',
      'No KIS call and no API route call is made by this check.',
    ],
  });

/**
 * Returns the required KIS credential env key names for the existing owner-local KIS OHLC path.
 * This list intentionally mirrors `REQUIRED_KR_ENV_NAMES` in the existing, already-approved
 * `kisOwnerLocalOhlcClient.ts` (Phase 3ES) source, without importing that file.
 */
export const buildOwnerLocalCredentialKeyRequirements =
  (): SimilarityOwnerLocalCredentialKeyRequirement[] => [
    {
      name: 'KIS_APP_KEY',
      required: true,
      description: 'KIS application key, required by the existing owner-local KIS OHLC client.',
      source: 'existing_owner_local_kis_client_source',
    },
    {
      name: 'KIS_APP_SECRET',
      required: true,
      description: 'KIS application secret, required by the existing owner-local KIS OHLC client.',
      source: 'existing_owner_local_kis_client_source',
    },
    {
      name: 'KIS_BASE_URL',
      required: true,
      description: 'KIS API base URL, required by the existing owner-local KIS OHLC client.',
      source: 'existing_owner_local_kis_client_source',
    },
  ];

/**
 * Builds a key status list from requirements and a caller-supplied presence map. Never accepts or
 * returns an actual value — only the key name, required flag, presence boolean, and a safe
 * message.
 */
export const buildOwnerLocalCredentialKeyStatuses = (
  requirements: SimilarityOwnerLocalCredentialKeyRequirement[],
  presence: Record<string, boolean>,
): SimilarityOwnerLocalCredentialKeyStatus[] =>
  requirements.map((requirement) => {
    const present = presence[requirement.name] === true;
    return {
      name: requirement.name,
      required: true,
      present,
      valueEchoed: false,
      safeMessage: present
        ? `${requirement.name} is present in this session.`
        : `${requirement.name} is not present in this session.`,
    };
  });

const resolveStatus = (
  keyStatuses: SimilarityOwnerLocalCredentialKeyStatus[],
): SimilarityOwnerLocalCredentialCheckStatus => {
  if (keyStatuses.length === 0) return 'not_checked';
  const presentCount = keyStatuses.filter((status) => status.present).length;
  if (presentCount === keyStatuses.length) return 'configured';
  if (presentCount === 0) return 'missing';
  return 'partial';
};

const resolveDecision = (
  status: SimilarityOwnerLocalCredentialCheckStatus,
): SimilarityOwnerLocalCredentialCheckDecision =>
  status === 'configured' ? 'ready_for_manual_run_retry' : 'missing_required_env';

/**
 * Builds the full redacted credential check report from requirements and a caller-supplied
 * presence map. Never includes an actual value anywhere in the returned report.
 */
export const buildOwnerLocalCredentialCheckReport = (
  requirements: SimilarityOwnerLocalCredentialKeyRequirement[],
  presence: Record<string, boolean>,
): SimilarityOwnerLocalCredentialCheckReport => {
  const keyStatuses = buildOwnerLocalCredentialKeyStatuses(requirements, presence);
  const status = resolveStatus(keyStatuses);
  const decision = resolveDecision(status);
  const missingKeyNames = keyStatuses.filter((s) => !s.present).map((s) => s.name);
  const presentKeyNames = keyStatuses.filter((s) => s.present).map((s) => s.name);
  const readyForManualRunRetry = status === 'configured';

  return {
    status,
    decision,
    source: 'owner-local',
    requiredKeys: requirements,
    keyStatuses,
    missingKeyNames,
    presentKeyNames,
    readyForManualRunRetry,
    valueEchoed: false,
    dotenvRead: false,
    kisCallAttempted: false,
    routeCallAttempted: false,
    safeSummary:
      status === 'configured'
        ? 'All required KIS credential env key names are present in this session. No value was read or reported.'
        : status === 'partial'
          ? 'Some required KIS credential env key names are missing in this session. No value was read or reported.'
          : 'Required KIS credential env key names are missing in this session. No value was read or reported.',
    warnings: [
      'No environment value is included in this report.',
      'No value length, prefix, suffix, or hash is included in this report.',
      'No KIS call was made by this check.',
      'No API route call was made by this check.',
    ],
  };
};

/** Wraps a policy and report into the full owner-local credential check result. */
export const buildOwnerLocalCredentialCheckResult = (
  policy: SimilarityOwnerLocalCredentialCheckPolicy,
  report: SimilarityOwnerLocalCredentialCheckReport,
): SimilarityOwnerLocalCredentialCheckResult => ({
  status: report.status,
  policy,
  report,
  safeMessage:
    'This result contains only redacted key-name presence fields. No environment value, value length/prefix/suffix/hash, credential, or token is present.',
  warnings: report.warnings,
});

// All patterns below are intentionally scoped to JSON key/value shapes (`"key": value`) rather
// than bare English words, so that safe, descriptive prose in this module's own safeMessage/
// warnings strings can never trip these checks as a false positive. Only an actual leaked field
// would match. Key NAMES (e.g. "KIS_APP_KEY") are always allowed and are never matched by these
// patterns, since only assignment-shaped values (":" followed by a long token-like value) match.
const CREDENTIAL_VALUE_PATTERN =
  /"(appKey|appSecret|app_key|app_secret|accessToken|access_token|authorization|password)"\s*:\s*"[^"]{4,}"/i;
const KIS_ENV_VALUE_PATTERN = /"(KIS_APP_KEY|KIS_APP_SECRET|KIS_BASE_URL|KIS_ACCESS_TOKEN)"\s*:\s*"[^"]{4,}"/;
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9._-]{8,}/i;
const RAW_KIS_FIELD_PATTERN =
  /"(stck_prpr|stck_oprc|stck_hgpr|stck_lwpr|stck_clpr|stck_bsop_date|rt_cd|acml_vol|hts_kor_isnm)"/i;
const ACCOUNT_TRADING_PATTERN = /"(account|accountNo|accountNumber|trading|order|orderId|balance)"\s*:/i;
const MARKET_VALUE_PATTERN =
  /"(open|high|low|close|volume|price|date|dateTime|timestamp|bsopDate|similarityScore|score|return|returns)"\s*:\s*-?\d/i;
const DB_CONNECTION_PATTERN = /connectionString|DATABASE_URL|postgres:\/\/|mysql:\/\//i;
const SQL_PATTERN = /SELECT\s|INSERT\s|UPDATE\s|DELETE\s|CREATE TABLE/i;

const FORBIDDEN_PATTERNS = [
  CREDENTIAL_VALUE_PATTERN,
  KIS_ENV_VALUE_PATTERN,
  BEARER_PATTERN,
  RAW_KIS_FIELD_PATTERN,
  ACCOUNT_TRADING_PATTERN,
  MARKET_VALUE_PATTERN,
  DB_CONNECTION_PATTERN,
  SQL_PATTERN,
];

/**
 * Inspects a serialized credential check report and returns whether it is fully free of secret
 * echo. Returns `false` if the serialized output contains an env value, a token-like value, a
 * bearer string, a KIS credential assignment, a raw KIS payload field, an account/trading/order/
 * balance field, a market OHLC/volume/timestamp/score/return field, a DB connection string, or a
 * SQL string. Key names alone are always allowed.
 */
export const assertCredentialCheckReportHasNoSecretEcho = (
  input: string | Record<string, unknown>,
): boolean => {
  const raw = typeof input === 'string' ? input : JSON.stringify(input);
  return !FORBIDDEN_PATTERNS.some((pattern) => pattern.test(raw));
};
