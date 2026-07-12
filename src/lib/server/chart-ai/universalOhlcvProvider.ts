/**
 * Phase 3GG-OP-FAST provider-neutral OHLCV dispatch + cache (server-only).
 *
 * Maps a normalized instrument to the correct real KIS transport (domestic daily OHLC for KR,
 * overseas daily OHLC for US), normalizes the rows into a clean candle array, and returns a
 * sanitized, client-safe series. No sample/synthetic OHLCV fallback exists here: an
 * unavailable/blocked/malformed result yields an honest empty series with a sanitized error code,
 * never fabricated candles. Numeric OHLCV is intentional on this dedicated chart-data path.
 */

import {
  getKisDomesticDailyOhlcSeries,
  getKisOverseasDailyOhlcSeries,
  type KisDailyOhlcPoint,
} from '../providers/kisClient';
import type { NormalizedInstrument } from '../../market-data/instrument';
import {
  normalizeOhlcvRows,
  normalizeOhlcvRange,
  RANGE_LOOKBACK_DAYS,
  OHLCV_DEFAULT_INTERVAL,
} from './universal-ohlcv-normalize.mjs';

export const OHLCV_SANITIZED_ERROR_CODES = {
  NONE: 'NONE',
  INVALID_INSTRUMENT: 'INVALID_INSTRUMENT',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  NO_DATA: 'NO_DATA',
} as const;

export type OhlcvSourceStatus = 'ok' | 'blocked' | 'unavailable' | 'no-data';

export type UniversalOhlcvCandle = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type UniversalOhlcvResponse = {
  ok: boolean;
  instrument: {
    symbol: string;
    displayName: string;
    englishName?: string;
    country: 'KR' | 'US';
    exchange: string;
    market: string;
    assetType: 'stock' | 'etf';
    currency: 'KRW' | 'USD';
  } | null;
  range: string;
  interval: string;
  candles: UniversalOhlcvCandle[];
  candleCount: number;
  sourceStatus: OhlcvSourceStatus;
  sanitizedErrorCode: string;
  cached: boolean;
  asOf: string;
  isDelayed: boolean;
  timezone: string;
};

type CacheEntry = { response: UniversalOhlcvResponse; storedAtMs: number };
const ohlcvCache = new Map<string, CacheEntry>();

const cacheTtlMs = (range: string): number => (range === '1m' ? 3 * 60 * 1000 : 20 * 60 * 1000);

const formatYyyyMmDd = (date: Date): string =>
  `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`;

const buildDomesticQuery = (symbol: string, range: string): Record<string, string> => {
  const now = new Date();
  const start = new Date(now.getTime() - RANGE_LOOKBACK_DAYS[range] * 24 * 60 * 60 * 1000);
  return {
    FID_COND_MRKT_DIV_CODE: 'J',
    FID_INPUT_ISCD: symbol,
    FID_INPUT_DATE_1: formatYyyyMmDd(start),
    FID_INPUT_DATE_2: formatYyyyMmDd(now),
    FID_PERIOD_DIV_CODE: 'D',
    FID_ORG_ADJ_PRC: '0',
  };
};

const toInstrumentSummary = (instrument: NormalizedInstrument): UniversalOhlcvResponse['instrument'] => ({
  symbol: instrument.symbol,
  displayName: instrument.displayName,
  ...(instrument.englishName ? { englishName: instrument.englishName } : {}),
  country: instrument.country,
  exchange: instrument.exchange,
  market: instrument.market,
  assetType: instrument.assetType,
  currency: instrument.currency,
});

const buildResponse = (
  instrument: NormalizedInstrument | null,
  range: string,
  candles: UniversalOhlcvCandle[],
  sourceStatus: OhlcvSourceStatus,
  sanitizedErrorCode: string,
  asOf: string,
): UniversalOhlcvResponse => ({
  ok: sourceStatus === 'ok',
  instrument: instrument ? toInstrumentSummary(instrument) : null,
  range,
  interval: OHLCV_DEFAULT_INTERVAL,
  candles,
  candleCount: candles.length,
  sourceStatus,
  sanitizedErrorCode,
  cached: false,
  asOf,
  // KIS chart/quote data is delayed, not real-time.
  isDelayed: true,
  timezone: instrument?.country === 'US' ? 'America/New_York' : 'Asia/Seoul',
});

export type FetchUniversalOhlcvInput = {
  instrument: NormalizedInstrument;
  range: string;
  allowProductionChartAiBetaLiveQuotes?: boolean;
};

/** Fetches, normalizes, caches and sanitizes a real OHLCV series for one instrument + range. */
export const fetchUniversalOhlcv = async (
  input: FetchUniversalOhlcvInput,
  deps: { now?: () => number } = {},
): Promise<UniversalOhlcvResponse> => {
  const now = deps.now ?? (() => Date.now());
  const range = normalizeOhlcvRange(input.range);
  const instrument = input.instrument;
  const nowIso = new Date(now()).toISOString();

  if (!instrument || (instrument.country !== 'KR' && instrument.country !== 'US')) {
    return buildResponse(
      null,
      range,
      [],
      'unavailable',
      OHLCV_SANITIZED_ERROR_CODES.INVALID_INSTRUMENT,
      nowIso,
    );
  }

  const cacheKey = `${instrument.country}:${instrument.symbol}:${range}`;
  const cached = ohlcvCache.get(cacheKey);
  if (cached && now() - cached.storedAtMs < cacheTtlMs(range)) {
    return { ...cached.response, cached: true };
  }

  let providerResult: Awaited<ReturnType<typeof getKisDomesticDailyOhlcSeries>>;
  if (instrument.country === 'KR') {
    providerResult = await getKisDomesticDailyOhlcSeries(
      { symbol: instrument.symbol, query: buildDomesticQuery(instrument.symbol, range) },
      { allowProductionChartAiBetaLiveQuotes: input.allowProductionChartAiBetaLiveQuotes === true },
    );
  } else {
    providerResult = await getKisOverseasDailyOhlcSeries(
      { symbol: instrument.providerSymbol, exchangeCode: instrument.exchangeCode ?? '' },
      { allowProductionChartAiBetaLiveQuotes: input.allowProductionChartAiBetaLiveQuotes === true },
    );
  }

  if (!providerResult.ok) {
    // Sanitized: provider error code is not surfaced verbatim; only a coarse status is exposed.
    return buildResponse(
      instrument,
      range,
      [],
      'unavailable',
      OHLCV_SANITIZED_ERROR_CODES.PROVIDER_UNAVAILABLE,
      nowIso,
    );
  }

  const rawPoints: KisDailyOhlcPoint[] = providerResult.data.points;
  const { candles } = normalizeOhlcvRows(rawPoints, range);

  if (candles.length === 0) {
    return buildResponse(instrument, range, [], 'no-data', OHLCV_SANITIZED_ERROR_CODES.NO_DATA, nowIso);
  }

  const response = buildResponse(
    instrument,
    range,
    candles as UniversalOhlcvCandle[],
    'ok',
    OHLCV_SANITIZED_ERROR_CODES.NONE,
    nowIso,
  );
  ohlcvCache.set(cacheKey, { response, storedAtMs: now() });
  return response;
};
