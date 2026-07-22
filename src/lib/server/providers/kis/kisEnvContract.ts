/**
 * KIS environment-name contract.
 *
 * This documents the environment variable NAMES that a future owner-local KIS quote smoke
 * (Phase 3EO) will require. It never reads the process environment, never reads dotenv files,
 * never validates values, and never prints values. It exists only so downstream code and
 * documentation can reference a single canonical list of key names without hard-coding strings.
 */

export type KisEnvKey =
  | 'KIS_APP_KEY'
  | 'KIS_APP_SECRET'
  | 'KIS_ACCESS_TOKEN'
  | 'KIS_BASE_URL'
  | 'KIS_ACCOUNT_NO'
  | 'KIS_MOCK_APP_KEY'
  | 'KIS_MOCK_APP_SECRET'
  | 'KIS_MODE';

/**
 * Explicit owner-local smoke gate flag NAMES (Phase 3EO). Names only — the smoke script
 * reads these at runtime; this contract never reads or prints their values.
 */
export type KisSmokeFlag =
  | 'KIS_OWNER_LOCAL_SMOKE'
  | 'KIS_ALLOW_LIVE_QUOTE';

export const KIS_OWNER_LOCAL_SMOKE_FLAGS: KisSmokeFlag[] = [
  'KIS_OWNER_LOCAL_SMOKE',
  'KIS_ALLOW_LIVE_QUOTE',
];

/**
 * Names (only) required for a quote-only owner-local smoke. Account/trading keys are
 * intentionally excluded because quote-only smoke does not need them.
 */
export const KIS_QUOTE_SMOKE_ENV_KEYS: KisEnvKey[] = [
  'KIS_APP_KEY',
  'KIS_APP_SECRET',
  'KIS_ACCESS_TOKEN',
  'KIS_MODE',
];

/**
 * Names (only) that are NOT required for quote-only smoke. Listed so Phase 3EO can assert
 * they remain unused for a quote smoke and so account/trading scope stays clearly separated.
 */
export const KIS_NON_QUOTE_ENV_KEYS: KisEnvKey[] = [
  'KIS_ACCOUNT_NO',
];

/**
 * How the access token will be handled in Phase 3EO: obtained by the owner locally and
 * supplied via `KIS_ACCESS_TOKEN` (or minted from `KIS_APP_KEY`/`KIS_APP_SECRET` by the
 * owner-local smoke), never committed and never read in this phase.
 */
export const KIS_ACCESS_TOKEN_HANDLING_NOTE =
  'Access token handling is deferred to Phase 3EO owner-local smoke; supplied via KIS_ACCESS_TOKEN name only, never committed.';

export const isKisEnvKey = (value: string): value is KisEnvKey =>
  (
    [
      'KIS_APP_KEY',
      'KIS_APP_SECRET',
      'KIS_ACCESS_TOKEN',
      'KIS_BASE_URL',
      'KIS_ACCOUNT_NO',
      'KIS_MOCK_APP_KEY',
      'KIS_MOCK_APP_SECRET',
      'KIS_MODE',
    ] as const
  ).includes(value as KisEnvKey);
