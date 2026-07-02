/**
 * KIS OHLC request descriptor.
 *
 * Builds a structural descriptor for a KIS OHLC request from a generic `OhlcProviderRequest`.
 * The hostless path, transaction id, and verification status are always resolved from
 * `kisOhlcEndpointRegistry.ts` — this file never hardcodes an endpoint value itself, so an
 * unverified endpoint can never silently become "live-ready" here.
 *
 * Only the KR domestic daily/weekly/monthly/yearly OHLC endpoint is verified as of Phase 3ES.
 * Intraday and US endpoints remain unverified; their descriptors carry `verification: 'unverified'`
 * and an empty query, which the owner-local smoke client MUST treat as blocked.
 *
 * No env reads, no secrets, no raw URLs (base URL is never known here).
 */

import type { OhlcProviderRequest } from '../../market-data/ohlcProvider';
import type { OhlcPeriod } from '../../../market-data/normalizedOhlc';
import {
  getKisOhlcEndpointDefinition,
  isKisOhlcEndpointVerified,
  type KisOhlcEndpointKey,
} from './kisOhlcEndpointRegistry';

export type KisOhlcRequestDescriptor = {
  symbol: string;
  market: 'KR' | 'US';
  assetType: 'stock' | 'etf' | 'etn' | 'index' | 'unknown';
  period: OhlcPeriod;
  endpointKey: KisOhlcEndpointKey;
  path: string;
  transactionId: string;
  query: Record<string, string>;
  verification: 'verified-official-docs' | 'unverified';
};

const isEtfLike = (assetType: OhlcProviderRequest['assetType']): boolean =>
  assetType === 'etf' || assetType === 'etn';

const resolveEndpointKey = (request: OhlcProviderRequest): KisOhlcEndpointKey => {
  if (request.market === 'KR') {
    return isEtfLike(request.assetType) ? 'KR_ETF_DAILY_OHLC' : 'KR_STOCK_DAILY_OHLC';
  }
  return isEtfLike(request.assetType) ? 'US_ETF_DAILY_OHLC' : 'US_STOCK_DAILY_OHLC';
};

/** Calendar-day lookback per Chart AI period, used only for the verified KR daily endpoint. */
const PERIOD_LOOKBACK_DAYS: Record<OhlcPeriod, number> = {
  '1d': 5,
  '1w': 10,
  '1m': 40,
  '3m': 100,
  '1y': 400,
};

const formatYyyyMmDd = (date: Date): string =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

/** Builds the FID_* query for the verified KR domestic daily OHLC endpoint only. */
const buildVerifiedKrDailyQuery = (symbol: string, period: OhlcPeriod): Record<string, string> => {
  const now = new Date();
  const start = new Date(now.getTime() - PERIOD_LOOKBACK_DAYS[period] * 24 * 60 * 60 * 1000);
  return {
    FID_COND_MRKT_DIV_CODE: 'J',
    FID_INPUT_ISCD: symbol,
    FID_INPUT_DATE_1: formatYyyyMmDd(start),
    FID_INPUT_DATE_2: formatYyyyMmDd(now),
    FID_PERIOD_DIV_CODE: 'D',
    FID_ORG_ADJ_PRC: '0',
  };
};

export const buildKisOhlcRequestDescriptor = (
  request: OhlcProviderRequest,
): KisOhlcRequestDescriptor => {
  const endpointKey = resolveEndpointKey(request);
  const definition = getKisOhlcEndpointDefinition(endpointKey);
  const verified = isKisOhlcEndpointVerified(endpointKey);

  return {
    symbol: request.symbol,
    market: request.market,
    assetType: request.assetType ?? 'unknown',
    period: request.period,
    endpointKey,
    path: definition.path,
    transactionId: definition.transactionId,
    // Only the verified KR daily endpoint gets a real query; unverified endpoints (intraday, US)
    // always resolve to an empty query so no unverified request shape looks call-ready.
    query: verified && request.market === 'KR' ? buildVerifiedKrDailyQuery(request.symbol, request.period) : {},
    verification: definition.verification,
  };
};
