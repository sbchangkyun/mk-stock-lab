/**
 * Summary statistics utilities for the chart similarity engine (Phase 3EX-B).
 *
 * `average`/`median` ignore null/non-finite entries and return `null` (never NaN) when no valid
 * values remain. `summarizeMatches` aggregates forward outcomes across the Top K matches for
 * each configured forward window — this is purely descriptive and carries no prediction language.
 */

import type { SimilarityMatch, SimilaritySummaryStats } from './types';

export const average = (values: Array<number | null>): number | null => {
  const valid = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, value) => acc + value, 0);
  return sum / valid.length;
};

export const median = (values: Array<number | null>): number | null => {
  const valid = values
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    .slice()
    .sort((a, b) => a - b);
  if (valid.length === 0) return null;
  const mid = Math.floor(valid.length / 2);
  return valid.length % 2 === 0 ? (valid[mid - 1] + valid[mid]) / 2 : valid[mid];
};

export const summarizeMatches = (
  matches: SimilarityMatch[],
  forwardWindows: number[],
): SimilaritySummaryStats => {
  const averageForwardReturnByWindow: Record<string, number | null> = {};
  const medianForwardReturnByWindow: Record<string, number | null> = {};
  const positiveCountByWindow: Record<string, number> = {};
  const negativeCountByWindow: Record<string, number> = {};

  for (const window of forwardWindows) {
    const key = `d${window}`;
    const values = matches.map((match) => match.forwardOutcome.forwardReturns[key] ?? null);
    averageForwardReturnByWindow[key] = average(values);
    medianForwardReturnByWindow[key] = median(values);
    positiveCountByWindow[key] = values.filter((value) => typeof value === 'number' && value > 0).length;
    negativeCountByWindow[key] = values.filter((value) => typeof value === 'number' && value < 0).length;
  }

  const drawdowns = matches.map((match) => match.forwardOutcome.maxDrawdownPct);

  return {
    matchCount: matches.length,
    averageForwardReturnByWindow,
    medianForwardReturnByWindow,
    positiveCountByWindow,
    negativeCountByWindow,
    averageMaxDrawdownPct: average(drawdowns),
  };
};
