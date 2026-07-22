/**
 * Deterministic synthetic edge-case OHLCV fixtures for the chart similarity engine (Phase 3EX-C).
 *
 * All values below are synthetic and fixed by arithmetic (never `Math.random()`, never
 * `Date.now()`). No real market/stock codes or real market values are used. These fixtures
 * exist only to exercise the engine's edge-case guards (flat data, short data, invalid bars,
 * unsorted bars) — they are not meant to produce meaningful similarity matches.
 */

import type { OhlcBar } from '../../lib/chartSimilarity/types';

const FIXTURE_MARKET = 'SYNTHETIC';
const FIXTURE_SYMBOL = 'SYNTHEDGE';

const buildDate = (dayOffset: number): string => {
  const cursor = new Date(Date.UTC(2001, 0, 2));
  cursor.setUTCDate(cursor.getUTCDate() + dayOffset);
  const year = cursor.getUTCFullYear();
  const month = String(cursor.getUTCMonth() + 1).padStart(2, '0');
  const day = String(cursor.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const baseBar = (dayOffset: number, overrides: Partial<OhlcBar> = {}): OhlcBar => ({
  market: FIXTURE_MARKET,
  symbol: FIXTURE_SYMBOL,
  date: buildDate(dayOffset),
  open: 100,
  high: 101,
  low: 99,
  close: 100,
  volume: 100000,
  adjusted: false,
  source: 'synthetic',
  ...overrides,
});

/** All bars share an identical close (and OHLC), to exercise zero-variance/constant-array guards. */
export const buildFlatSyntheticOhlcvFixture = (count = 120): OhlcBar[] => {
  const bars: OhlcBar[] = [];
  for (let i = 0; i < count; i += 1) {
    bars.push(baseBar(i, { open: 100, high: 100, low: 100, close: 100, volume: 100000 }));
  }
  return bars;
};

/** Too few bars to satisfy typical baseWindow requirements (e.g. one or two bars only). */
export const buildShortSyntheticOhlcvFixture = (count = 1): OhlcBar[] => {
  const bars: OhlcBar[] = [];
  for (let i = 0; i < count; i += 1) {
    bars.push(baseBar(i, { open: 100 + i, high: 101 + i, low: 99 + i, close: 100 + i, volume: 100000 }));
  }
  return bars;
};

/**
 * A mix of valid bars and bars with non-finite/non-positive close or volume, to exercise
 * validation/filtering guards. Roughly half the bars are intentionally invalid.
 */
export const buildInvalidSyntheticOhlcvFixture = (): OhlcBar[] => {
  const bars: OhlcBar[] = [];
  for (let i = 0; i < 20; i += 1) {
    if (i % 4 === 0) {
      bars.push(baseBar(i, { close: Number.NaN }));
    } else if (i % 4 === 1) {
      bars.push(baseBar(i, { close: -50 }));
    } else if (i % 4 === 2) {
      bars.push(baseBar(i, { close: 0 }));
    } else if (i % 4 === 3 && i % 8 === 3) {
      bars.push(baseBar(i, { volume: Number.POSITIVE_INFINITY }));
    } else {
      bars.push(baseBar(i, { open: 100 + i, high: 101 + i, low: 99 + i, close: 100 + i, volume: 100000 + i }));
    }
  }
  return bars;
};

/** Same bars as a valid sequence, but shuffled out of ascending date order. */
export const buildUnsortedSyntheticOhlcvFixture = (count = 30): OhlcBar[] => {
  const bars: OhlcBar[] = [];
  for (let i = 0; i < count; i += 1) {
    bars.push(baseBar(i, { open: 100 + i, high: 101 + i, low: 99 + i, close: 100 + i, volume: 100000 + i }));
  }
  for (let i = bars.length - 1; i > 0; i -= 2) {
    const swapIndex = i - 1;
    const temp = bars[i];
    bars[i] = bars[swapIndex];
    bars[swapIndex] = temp;
  }
  return bars;
};
