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
  normalizeOhlcvRowsFull,
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

// ---- Phase 3GG-Q-FAST: long-history OHLCV for similarity analysis ----

/** ~3 years of daily bars is the target; each KIS call returns at most ~100 rows, so we page. */
const LONG_HISTORY_TARGET_BARS = 750;
const LONG_HISTORY_MAX_PAGES = 10;
const LONG_HISTORY_PAGE_SPAN_DAYS = 150;
const LONG_HISTORY_TTL_MS = 6 * 60 * 60 * 1000;

export type LongHistoryOhlcvResult = {
  ok: boolean;
  sourceStatus: OhlcvSourceStatus;
  sanitizedErrorCode: string;
  instrument: UniversalOhlcvResponse['instrument'];
  candles: UniversalOhlcvCandle[];
  barCount: number;
  historyRange: { start: string; end: string } | null;
  cached: boolean;
  asOf: string;
  currency: 'KRW' | 'USD' | null;
  pagesFetched: number;
};

type LongCacheEntry = { result: LongHistoryOhlcvResult; storedAtMs: number };
const longHistoryCache = new Map<string, LongCacheEntry>();

const yyyymmdd = (date: Date): string =>
  `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`;

const parseYyyymmdd = (value: string): Date | null => {
  const raw = String(value ?? '').trim();
  if (!/^\d{8}$/.test(raw)) return null;
  const d = new Date(Date.UTC(Number(raw.slice(0, 4)), Number(raw.slice(4, 6)) - 1, Number(raw.slice(6, 8))));
  return Number.isFinite(d.getTime()) ? d : null;
};

const buildLongDomesticQuery = (symbol: string, startDate: Date, endDate: Date): Record<string, string> => ({
  FID_COND_MRKT_DIV_CODE: 'J',
  FID_INPUT_ISCD: symbol,
  FID_INPUT_DATE_1: yyyymmdd(startDate),
  FID_INPUT_DATE_2: yyyymmdd(endDate),
  FID_PERIOD_DIV_CODE: 'D',
  FID_ORG_ADJ_PRC: '0',
});

/**
 * Fetches multi-year daily OHLCV for one instrument by paging the real KIS transport backward
 * (~100 rows per call). Merges, validates, dedupes, sorts ascending, caches (6h TTL). No new raw
 * endpoint is exposed; no sample/synthetic fallback — a provider failure on the first page returns a
 * sanitized unavailable result, and a short history is returned honestly (the caller decides if it
 * is sufficient).
 */
export const fetchLongHistoryOhlcv = async (
  input: { instrument: NormalizedInstrument; allowProductionChartAiBetaLiveQuotes?: boolean; targetBars?: number },
  deps: { now?: () => number } = {},
): Promise<LongHistoryOhlcvResult> => {
  const now = deps.now ?? (() => Date.now());
  const instrument = input.instrument;
  const nowIso = new Date(now()).toISOString();
  const allow = input.allowProductionChartAiBetaLiveQuotes === true;
  // Callers that only need ~6-12 months (e.g. market-intelligence relative strength) can request fewer
  // bars so fewer paginated KIS calls are made per instrument (default = the full ~3-year target).
  const targetBars = Number.isFinite(input.targetBars) && (input.targetBars as number) > 0
    ? Math.min(LONG_HISTORY_TARGET_BARS, input.targetBars as number)
    : LONG_HISTORY_TARGET_BARS;

  if (!instrument || (instrument.country !== 'KR' && instrument.country !== 'US')) {
    return {
      ok: false,
      sourceStatus: 'unavailable',
      sanitizedErrorCode: OHLCV_SANITIZED_ERROR_CODES.INVALID_INSTRUMENT,
      instrument: null,
      candles: [],
      barCount: 0,
      historyRange: null,
      cached: false,
      asOf: nowIso,
      currency: null,
      pagesFetched: 0,
    };
  }

  const cacheKey = `${instrument.country}:${instrument.symbol}:${targetBars}`;
  const cached = longHistoryCache.get(cacheKey);
  if (cached && now() - cached.storedAtMs < LONG_HISTORY_TTL_MS) {
    return { ...cached.result, cached: true };
  }

  const rawRows: KisDailyOhlcPoint[] = [];
  let endDate = new Date(now());
  let pagesFetched = 0;
  let firstPageFailed = false;

  for (let page = 0; page < LONG_HISTORY_MAX_PAGES; page += 1) {
    if (rawRows.length >= targetBars) break;

    let result: Awaited<ReturnType<typeof getKisDomesticDailyOhlcSeries>>;
    if (instrument.country === 'KR') {
      const startDate = new Date(endDate.getTime() - LONG_HISTORY_PAGE_SPAN_DAYS * 24 * 60 * 60 * 1000);
      result = await getKisDomesticDailyOhlcSeries(
        { symbol: instrument.symbol, query: buildLongDomesticQuery(instrument.symbol, startDate, endDate) },
        { allowProductionChartAiBetaLiveQuotes: allow },
      );
    } else {
      result = await getKisOverseasDailyOhlcSeries(
        { symbol: instrument.providerSymbol, exchangeCode: instrument.exchangeCode ?? '', bymd: page === 0 ? '' : yyyymmdd(endDate) },
        { allowProductionChartAiBetaLiveQuotes: allow },
      );
    }

    pagesFetched += 1;
    if (!result.ok) {
      if (page === 0) firstPageFailed = true;
      break;
    }
    const points = result.data.points;
    if (!Array.isArray(points) || points.length === 0) break;
    rawRows.push(...points);

    // Walk backward: next page ends the day before the earliest row we just received.
    let earliest = points[0].dateTime;
    for (const p of points) if (p.dateTime && p.dateTime < earliest) earliest = p.dateTime;
    const earliestDate = parseYyyymmdd(earliest);
    if (!earliestDate) break;
    endDate = new Date(earliestDate.getTime() - 24 * 60 * 60 * 1000);
    if (points.length < 10) break; // near the start of available history
  }

  if (firstPageFailed) {
    return {
      ok: false,
      sourceStatus: 'unavailable',
      sanitizedErrorCode: OHLCV_SANITIZED_ERROR_CODES.PROVIDER_UNAVAILABLE,
      instrument: toInstrumentSummary(instrument),
      candles: [],
      barCount: 0,
      historyRange: null,
      cached: false,
      asOf: nowIso,
      currency: instrument.currency,
      pagesFetched,
    };
  }

  const { candles } = normalizeOhlcvRowsFull(rawRows);
  if (candles.length === 0) {
    return {
      ok: false,
      sourceStatus: 'no-data',
      sanitizedErrorCode: OHLCV_SANITIZED_ERROR_CODES.NO_DATA,
      instrument: toInstrumentSummary(instrument),
      candles: [],
      barCount: 0,
      historyRange: null,
      cached: false,
      asOf: nowIso,
      currency: instrument.currency,
      pagesFetched,
    };
  }

  const result: LongHistoryOhlcvResult = {
    ok: true,
    sourceStatus: 'ok',
    sanitizedErrorCode: OHLCV_SANITIZED_ERROR_CODES.NONE,
    instrument: toInstrumentSummary(instrument),
    candles: candles as UniversalOhlcvCandle[],
    barCount: candles.length,
    historyRange: { start: candles[0].timestamp, end: candles[candles.length - 1].timestamp },
    cached: false,
    asOf: nowIso,
    currency: instrument.currency,
    pagesFetched,
  };
  longHistoryCache.set(cacheKey, { result, storedAtMs: now() });
  return result;
};
