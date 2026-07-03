/**
 * Rolling window utilities for the chart similarity engine (Phase 3EX-B).
 *
 * Bars are assumed pre-sorted ascending (via `sortBarsAscending`) before being passed in here.
 * All functions return empty results instead of throwing when there is insufficient data, so
 * callers (the scanner) can surface warnings rather than crash on expected bad input.
 */

import type { OhlcBar, SimilarityWindow } from './types';

const buildWindow = (bars: OhlcBar[], startIndex: number, endIndex: number): SimilarityWindow => {
  const windowBars = bars.slice(startIndex, endIndex + 1);
  return {
    startIndex,
    endIndex,
    startDate: windowBars[0].date,
    endDate: windowBars[windowBars.length - 1].date,
    bars: windowBars,
  };
};

export const createRollingWindows = (bars: OhlcBar[], windowSize: number): SimilarityWindow[] => {
  const n = bars.length;
  if (windowSize <= 0 || n < windowSize) return [];
  const windows: SimilarityWindow[] = [];
  for (let startIndex = 0; startIndex + windowSize <= n; startIndex += 1) {
    windows.push(buildWindow(bars, startIndex, startIndex + windowSize - 1));
  }
  return windows;
};

export const getCurrentWindow = (bars: OhlcBar[], windowSize: number): SimilarityWindow | null => {
  const n = bars.length;
  if (windowSize <= 0 || n < windowSize) return null;
  const startIndex = n - windowSize;
  const endIndex = n - 1;
  return buildWindow(bars, startIndex, endIndex);
};

/**
 * Candidate (historical) windows for similarity comparison. A candidate must:
 * - have the same length as the current window (`baseWindow`);
 * - have enough future bars to cover `maxForwardWindow`;
 * - end at least `excludeRecentBars` bars before the current window's start, so it never
 *   overlaps the current window or the recent buffer zone immediately preceding it.
 */
export const getCandidateWindows = (
  bars: OhlcBar[],
  baseWindow: number,
  maxForwardWindow: number,
  excludeRecentBars: number,
): SimilarityWindow[] => {
  const n = bars.length;
  if (n === 0 || baseWindow <= 0) return [];

  const currentStart = n - baseWindow;
  const exclusionBoundary = currentStart - excludeRecentBars;
  const maxEndIndexForFuture = n - 1 - maxForwardWindow;

  const windows: SimilarityWindow[] = [];
  for (let endIndex = baseWindow - 1; endIndex < exclusionBoundary; endIndex += 1) {
    if (endIndex > maxEndIndexForFuture) break;
    const startIndex = endIndex - baseWindow + 1;
    if (startIndex < 0) continue;
    windows.push(buildWindow(bars, startIndex, endIndex));
  }
  return windows;
};
