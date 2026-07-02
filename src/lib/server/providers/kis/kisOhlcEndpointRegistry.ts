/**
 * KIS OHLC/chart endpoint registry.
 *
 * Phase 3ES verifies the KR domestic daily/weekly/monthly/yearly OHLC endpoint against official
 * KIS documentation (the KIS Developers API portal listing for
 * `/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice`) and the official
 * `koreainvestment/open-trading-api` sample repository
 * (`examples_user/domestic_stock/domestic_stock_functions.py`, function
 * `inquire_daily_itemchartprice`, tr_id `FHKST03010100`). `KR_STOCK_DAILY_OHLC` and
 * `KR_ETF_DAILY_OHLC` are marked `verified-official-docs` for that reason (ETFs reuse the same
 * domestic contract under `FID_COND_MRKT_DIV_CODE=J`, mirroring the already-verified
 * `KR_ETF_QUOTE` entry in `kisQuoteEndpointRegistry.ts`).
 *
 * Intraday and US chart endpoints remain `unverified` in this phase: no official intraday or
 * overseas chart sample was confirmed, so `VERIFY_WITH_KIS_DOCS_*` placeholders stay in place and
 * MUST NOT be treated as implementation-ready.
 *
 * This file contains hostless paths only (no base URL, no credentials).
 */

export type KisOhlcEndpointKey =
  | 'KR_STOCK_DAILY_OHLC'
  | 'KR_ETF_DAILY_OHLC'
  | 'KR_STOCK_INTRADAY_OHLC'
  | 'KR_ETF_INTRADAY_OHLC'
  | 'US_STOCK_DAILY_OHLC'
  | 'US_ETF_DAILY_OHLC';

export type KisOhlcEndpointVerification = 'verified-official-docs' | 'unverified';

export type KisOhlcEndpointDefinition = {
  endpointKey: KisOhlcEndpointKey;
  path: string;
  transactionId: string;
  verification: KisOhlcEndpointVerification;
  sourceNote: string;
};

const UNVERIFIED_NOTE =
  'Endpoint path, transaction id, and parameters must be verified against official KIS documentation before any live smoke.';

const KR_DOMESTIC_DAILY_OHLC_PATH = '/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice';
const KR_DOMESTIC_DAILY_OHLC_TR_ID = 'FHKST03010100';
const KR_DAILY_OHLC_SOURCE_NOTE =
  'Verified via KIS Developers API portal listing "국내주식기간별시세(일/주/월/년)" and the official koreainvestment/open-trading-api sample repository (examples_user/domestic_stock/domestic_stock_functions.py, inquire_daily_itemchartprice, tr_id FHKST03010100). See docs/planning/phase_3es_owner_local_kis_ohlc_smoke_result_v0.1.md.';
const KR_ETF_DAILY_OHLC_SOURCE_NOTE =
  'Domestic ETFs (six-digit KRX codes, e.g. 069500) reuse the same domestic period-price contract as KR stocks (FID_COND_MRKT_DIV_CODE=J), consistent with the already-verified KR_ETF_QUOTE entry in kisQuoteEndpointRegistry.ts.';

export const KIS_OHLC_ENDPOINT_REGISTRY: Record<KisOhlcEndpointKey, KisOhlcEndpointDefinition> = {
  KR_STOCK_DAILY_OHLC: {
    endpointKey: 'KR_STOCK_DAILY_OHLC',
    path: KR_DOMESTIC_DAILY_OHLC_PATH,
    transactionId: KR_DOMESTIC_DAILY_OHLC_TR_ID,
    verification: 'verified-official-docs',
    sourceNote: KR_DAILY_OHLC_SOURCE_NOTE,
  },
  KR_ETF_DAILY_OHLC: {
    endpointKey: 'KR_ETF_DAILY_OHLC',
    path: KR_DOMESTIC_DAILY_OHLC_PATH,
    transactionId: KR_DOMESTIC_DAILY_OHLC_TR_ID,
    verification: 'verified-official-docs',
    sourceNote: KR_ETF_DAILY_OHLC_SOURCE_NOTE,
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

/** Returns the endpoint definition only when it is verified; otherwise null (blocked for live smoke). */
export const resolveVerifiedKisOhlcEndpoint = (
  endpointKey: KisOhlcEndpointKey,
): KisOhlcEndpointDefinition | null => {
  const definition = KIS_OHLC_ENDPOINT_REGISTRY[endpointKey];
  return definition.verification === 'verified-official-docs' ? definition : null;
};

export const isKisOhlcEndpointVerified = (endpointKey: KisOhlcEndpointKey): boolean =>
  KIS_OHLC_ENDPOINT_REGISTRY[endpointKey].verification === 'verified-official-docs';
