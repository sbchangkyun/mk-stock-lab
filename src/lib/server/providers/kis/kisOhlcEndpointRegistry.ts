/**
 * KIS OHLC/chart endpoint registry skeleton.
 *
 * Prepares the endpoint registry structure for the future owner-local OHLC smoke (Phase 3ES).
 * Unlike `kisQuoteEndpointRegistry.ts`, EVERY endpoint here is `unverified`: no official KIS
 * chart/OHLC endpoint path or transaction id has been confirmed in this phase. Values are
 * intentionally left as `VERIFY_WITH_KIS_DOCS_*` placeholders and MUST NOT be treated as
 * implementation-ready until verified against official KIS documentation in Phase 3ES.
 *
 * This file contains hostless placeholders only (no base URL, no credentials).
 */

export type KisOhlcEndpointKey =
  | 'KR_STOCK_DAILY_OHLC'
  | 'KR_ETF_DAILY_OHLC'
  | 'KR_STOCK_INTRADAY_OHLC'
  | 'KR_ETF_INTRADAY_OHLC'
  | 'US_STOCK_DAILY_OHLC'
  | 'US_ETF_DAILY_OHLC';

export type KisOhlcEndpointVerification = 'unverified';

export type KisOhlcEndpointDefinition = {
  endpointKey: KisOhlcEndpointKey;
  path: string;
  transactionId: string;
  verification: KisOhlcEndpointVerification;
  sourceNote: string;
};

const UNVERIFIED_NOTE =
  'Endpoint path, transaction id, and parameters must be verified against official KIS documentation in Phase 3ES before any live smoke.';

export const KIS_OHLC_ENDPOINT_REGISTRY: Record<KisOhlcEndpointKey, KisOhlcEndpointDefinition> = {
  KR_STOCK_DAILY_OHLC: {
    endpointKey: 'KR_STOCK_DAILY_OHLC',
    path: 'VERIFY_WITH_KIS_DOCS_KR_STOCK_DAILY_OHLC_PATH',
    transactionId: 'VERIFY_WITH_KIS_DOCS_KR_STOCK_DAILY_OHLC',
    verification: 'unverified',
    sourceNote: UNVERIFIED_NOTE,
  },
  KR_ETF_DAILY_OHLC: {
    endpointKey: 'KR_ETF_DAILY_OHLC',
    path: 'VERIFY_WITH_KIS_DOCS_KR_ETF_DAILY_OHLC_PATH',
    transactionId: 'VERIFY_WITH_KIS_DOCS_KR_ETF_DAILY_OHLC',
    verification: 'unverified',
    sourceNote: UNVERIFIED_NOTE,
  },
  KR_STOCK_INTRADAY_OHLC: {
    endpointKey: 'KR_STOCK_INTRADAY_OHLC',
    path: 'VERIFY_WITH_KIS_DOCS_KR_STOCK_INTRADAY_OHLC_PATH',
    transactionId: 'VERIFY_WITH_KIS_DOCS_KR_STOCK_INTRADAY_OHLC',
    verification: 'unverified',
    sourceNote: UNVERIFIED_NOTE,
  },
  KR_ETF_INTRADAY_OHLC: {
    endpointKey: 'KR_ETF_INTRADAY_OHLC',
    path: 'VERIFY_WITH_KIS_DOCS_KR_ETF_INTRADAY_OHLC_PATH',
    transactionId: 'VERIFY_WITH_KIS_DOCS_KR_ETF_INTRADAY_OHLC',
    verification: 'unverified',
    sourceNote: UNVERIFIED_NOTE,
  },
  US_STOCK_DAILY_OHLC: {
    endpointKey: 'US_STOCK_DAILY_OHLC',
    path: 'VERIFY_WITH_KIS_DOCS_US_STOCK_DAILY_OHLC_PATH',
    transactionId: 'VERIFY_WITH_KIS_DOCS_US_STOCK_DAILY_OHLC',
    verification: 'unverified',
    sourceNote: UNVERIFIED_NOTE,
  },
  US_ETF_DAILY_OHLC: {
    endpointKey: 'US_ETF_DAILY_OHLC',
    path: 'VERIFY_WITH_KIS_DOCS_US_ETF_DAILY_OHLC_PATH',
    transactionId: 'VERIFY_WITH_KIS_DOCS_US_ETF_DAILY_OHLC',
    verification: 'unverified',
    sourceNote: UNVERIFIED_NOTE,
  },
};

export const getKisOhlcEndpointDefinition = (endpointKey: KisOhlcEndpointKey): KisOhlcEndpointDefinition =>
  KIS_OHLC_ENDPOINT_REGISTRY[endpointKey];

/**
 * Returns the endpoint definition only when verified; always null in Phase 3ER because every
 * chart/OHLC endpoint remains unverified. This intentionally prevents any live OHLC use until
 * Phase 3ES confirms real values against official KIS documentation.
 */
export const resolveVerifiedKisOhlcEndpoint = (
  _endpointKey: KisOhlcEndpointKey,
): KisOhlcEndpointDefinition | null => null;

/** Always false in Phase 3ER: every chart/OHLC endpoint is unverified by design. */
export const isKisOhlcEndpointVerified = (_endpointKey: KisOhlcEndpointKey): boolean => false;
