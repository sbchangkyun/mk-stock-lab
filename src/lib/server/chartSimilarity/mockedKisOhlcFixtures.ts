/**
 * Mocked normalized OHLC fixtures for the server-only KIS OHLC provider contract test
 * (Phase 3EY-B).
 *
 * All values are synthetic and generated from fixed arithmetic only — no `Math.random`, no
 * `Date.now`, no real stock code, and no actual market value. These fixtures exist only to
 * exercise `mockedKisOhlcAdapter.ts` and must never be treated as real market data.
 */

import type { NormalizedDailyOhlcInput } from './kisOhlcProviderTypes';

const FIXED_EPOCH_MS = Date.UTC(2020, 0, 1);
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_MOCKED_BAR_COUNT = 80;

const roundToCents = (value: number): number => Math.round(value * 100) / 100;

const formatFixedDate = (offsetDays: number): string => {
  const date = new Date(FIXED_EPOCH_MS + offsetDays * MS_PER_DAY);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Builds a deterministic set of synthetic normalized daily OHLC rows. Values are derived from
 * fixed sine/cosine arithmetic around a 100-based baseline, not from any real market series.
 */
export const buildMockedNormalizedDailyOhlcInput = (
  count: number = DEFAULT_MOCKED_BAR_COUNT,
): NormalizedDailyOhlcInput[] => {
  const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : DEFAULT_MOCKED_BAR_COUNT;
  const bars: NormalizedDailyOhlcInput[] = [];

  for (let index = 0; index < safeCount; index += 1) {
    const wave = Math.sin(index * 0.15) * 4 + Math.cos(index * 0.05) * 2;
    const drift = index * 0.05;
    const close = 100 + wave + drift;
    const open = close - 0.5;
    const high = close + 1.25;
    const low = close - 1.25;
    const volume = 10000 + (index % 7) * 250;

    bars.push({
      date: formatFixedDate(index),
      open: roundToCents(open),
      high: roundToCents(high),
      low: roundToCents(low),
      close: roundToCents(close),
      volume,
    });
  }

  return bars;
};

/**
 * Builds a fixed set of intentionally invalid normalized rows (non-finite fields, an empty
 * date) used to exercise the mocked adapter's safe-drop behavior.
 */
export const buildInvalidMockedNormalizedDailyOhlcInput = (): NormalizedDailyOhlcInput[] => [
  { date: '2020-01-01', open: 100, high: 101, low: 99, close: Number.NaN, volume: 1000 },
  { date: '', open: 100, high: 101, low: 99, close: 100, volume: 1000 },
  { date: '2020-01-03', open: 100, high: Number.POSITIVE_INFINITY, low: 99, close: 100, volume: 1000 },
  { date: '2020-01-04', open: Number.NEGATIVE_INFINITY, high: 101, low: 99, close: 100, volume: 1000 },
];
