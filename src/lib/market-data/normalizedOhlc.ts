/**
 * Normalized OHLC series contract.
 *
 * This is the single shared shape every OHLC/chart provider must return, whether it is a
 * deterministic mock or a future KIS local adapter. It supports Korean and US stocks/ETFs and
 * is intentionally client-safe: it must never carry secrets, raw provider payloads, tokens,
 * cookies, or account data.
 *
 * Live-safety invariants (enforced by providers, verified by the phase checker):
 * - the mocked provider returns source='mocked', freshness='sample', isLive=false;
 * - the unavailable/blocked path returns source='unavailable', isLive=false;
 * - no provider exposes live/current/real-time OHLC data to the public UI in this phase.
 */

export type OhlcMarket = 'KR' | 'US';

export type OhlcAssetType = 'stock' | 'etf' | 'etn' | 'index' | 'unknown';

export type OhlcCurrency = 'KRW' | 'USD' | string;

export type OhlcPeriod = '1d' | '1w' | '1m' | '3m' | '1y';

export type OhlcInterval = 'minute' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'sample';

export type OhlcSource = 'kis-local' | 'mocked' | 'unavailable';

export type OhlcFreshness = 'delayed' | 'sample' | 'unavailable';

export type OhlcProviderStatus = 'ok' | 'blocked' | 'unavailable' | 'error' | 'sample';

export type NormalizedOhlcPoint = {
  dateTime: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
};

export type NormalizedOhlcSeries = {
  symbol: string;
  market: OhlcMarket;
  assetType: OhlcAssetType;
  currency: OhlcCurrency;
  period: OhlcPeriod;
  interval: OhlcInterval;
  source: OhlcSource;
  freshness: OhlcFreshness;
  isLive: boolean;
  providerStatus: OhlcProviderStatus;
  points: NormalizedOhlcPoint[];
  message: string;
  safety: {
    rawResponsePrinted: false;
    secretsPrinted: false;
    publicProductionBlocked: true;
  };
};

/** Coerces a raw candidate value into a finite number, or null. Never returns NaN. */
export const toNullableOhlcNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const numeric = Number(value.trim());
    if (value.trim() !== '' && Number.isFinite(numeric)) return numeric;
  }
  return null;
};

/** A series is renderable only when it has at least two numerically valid points. */
export const isRenderableOhlcSeries = (series: NormalizedOhlcSeries): boolean =>
  series.points.length >= 2 &&
  series.points.every(
    (point) =>
      (point.open === null || Number.isFinite(point.open)) &&
      (point.high === null || Number.isFinite(point.high)) &&
      (point.low === null || Number.isFinite(point.low)) &&
      (point.close === null || Number.isFinite(point.close)) &&
      (point.volume === null || Number.isFinite(point.volume)),
  );

/** Shared safety block for non-live and sample series. */
export const buildSampleOhlcSafety = (): NormalizedOhlcSeries['safety'] => ({
  rawResponsePrinted: false,
  secretsPrinted: false,
  publicProductionBlocked: true,
});

export type BuildUnavailableOhlcSeriesInput = {
  symbol: string;
  market: OhlcMarket;
  assetType: OhlcAssetType;
  currency: OhlcCurrency;
  period: OhlcPeriod;
  providerStatus?: OhlcProviderStatus;
  message: string;
};

/** Builds a client-safe, empty, non-live series for blocked/unavailable/error paths. */
export const buildUnavailableOhlcSeries = (input: BuildUnavailableOhlcSeriesInput): NormalizedOhlcSeries => ({
  symbol: input.symbol,
  market: input.market,
  assetType: input.assetType,
  currency: input.currency,
  period: input.period,
  interval: 'sample',
  source: 'unavailable',
  freshness: 'unavailable',
  isLive: false,
  providerStatus: input.providerStatus ?? 'unavailable',
  points: [],
  message: input.message,
  safety: buildSampleOhlcSafety(),
});
