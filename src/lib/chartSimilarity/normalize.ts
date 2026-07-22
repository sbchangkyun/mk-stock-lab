/**
 * Normalization utilities for the chart similarity engine (Phase 3EX-B).
 *
 * `toNormalizedPriceIndex` backs the base-100 overlay chart display path described in the
 * Phase 3EX-A architecture doc (section 10, Algorithm Policy). `zScore` is a general-purpose
 * normalization helper for future scoring refinements.
 */

import type { OhlcBar } from './types';

export const zScore = (values: number[]): number[] => {
  const n = values.length;
  if (n === 0) return [];
  const mean = values.reduce((acc, value) => acc + value, 0) / n;
  const variance = values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  if (std === 0) return values.map(() => 0);
  return values.map((value) => (value - mean) / std);
};

export const toNormalizedPriceIndex = (
  bars: OhlcBar[],
  base = 100,
): Array<{ index: number; value: number }> => {
  if (bars.length === 0) return [];

  const firstClose = bars[0].close;
  if (!Number.isFinite(firstClose) || firstClose <= 0) {
    return bars.map((_, index) => ({ index, value: base }));
  }

  return bars.map((bar, index) => {
    const close = bar.close;
    const value = Number.isFinite(close) && close > 0 ? base * (close / firstClose) : base;
    return { index, value };
  });
};
