/**
 * Return calculation utilities for the chart similarity engine (Phase 3EX-B).
 *
 * All functions are pure: inputs are never mutated, and no non-finite (NaN/Infinity) values are
 * ever produced. Bars with invalid values are filtered out by `validateOhlcBars` before any
 * return calculation runs.
 */

import type { OhlcBar } from './types';

export const sortBarsAscending = (bars: OhlcBar[]): OhlcBar[] =>
  bars.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

export const validateOhlcBars = (bars: OhlcBar[]): { valid: OhlcBar[]; warnings: string[] } => {
  const warnings: string[] = [];
  let skipped = 0;

  const valid = bars.filter((bar) => {
    const ohlcFinite = [bar.open, bar.high, bar.low, bar.close].every((value) => Number.isFinite(value));
    const volumeOk = bar.volume === null || Number.isFinite(bar.volume);
    const closePositive = Number.isFinite(bar.close) && bar.close > 0;
    const dateOk = typeof bar.date === 'string' && bar.date.length > 0;
    const ok = ohlcFinite && volumeOk && closePositive && dateOk;
    if (!ok) skipped += 1;
    return ok;
  });

  if (skipped > 0) {
    warnings.push(`${skipped} OHLC bar(s) skipped due to non-finite values or non-positive close.`);
  }

  return { valid, warnings };
};

export const toSimpleReturns = (bars: OhlcBar[]): number[] => {
  const returns: number[] = [];
  for (let i = 1; i < bars.length; i += 1) {
    const prevClose = bars[i - 1].close;
    const close = bars[i].close;
    if (!Number.isFinite(prevClose) || prevClose <= 0 || !Number.isFinite(close)) {
      returns.push(0);
      continue;
    }
    const value = (close - prevClose) / prevClose;
    returns.push(Number.isFinite(value) ? value : 0);
  }
  return returns;
};

export const toLogReturns = (bars: OhlcBar[]): number[] => {
  const returns: number[] = [];
  for (let i = 1; i < bars.length; i += 1) {
    const prevClose = bars[i - 1].close;
    const close = bars[i].close;
    if (!Number.isFinite(prevClose) || prevClose <= 0 || !Number.isFinite(close) || close <= 0) {
      returns.push(0);
      continue;
    }
    const value = Math.log(close / prevClose);
    returns.push(Number.isFinite(value) ? value : 0);
  }
  return returns;
};
