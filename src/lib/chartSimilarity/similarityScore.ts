/**
 * Similarity scoring utilities for the chart similarity engine (Phase 3EX-B).
 *
 * Score policy (Phase 3EX-A architecture doc, section 10):
 * - correlation + RMSE + direction-match are combined, weighted 0.45 / 0.35 / 0.20;
 * - raw price levels are never compared directly — callers pass in returns (see `returns.ts`);
 * - the final score is clamped to 0..100 and carries no prediction guarantee.
 *
 * Numerical stability adjustment (documented per phase spec section 4.7): RMSE on a raw
 * log-return scale is typically far below 1, so it is normalized by the mean absolute magnitude
 * of the current-window returns (with an epsilon floor) before being converted into a 0..100
 * score. This keeps `rmseScore` meaningful regardless of the absolute volatility scale.
 */

import type { SimilarityScoreParts } from './types';

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const round2 = (value: number): number => Math.round(value * 100) / 100;
const round4 = (value: number): number => Math.round(value * 10000) / 10000;

export const pearsonCorrelation = (a: number[], b: number[]): number => {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;

  const sliceA = a.slice(0, n);
  const sliceB = b.slice(0, n);
  const meanA = sliceA.reduce((acc, value) => acc + value, 0) / n;
  const meanB = sliceB.reduce((acc, value) => acc + value, 0) / n;

  let covariance = 0;
  let varianceA = 0;
  let varianceB = 0;
  for (let i = 0; i < n; i += 1) {
    const da = sliceA[i] - meanA;
    const db = sliceB[i] - meanB;
    covariance += da * db;
    varianceA += da * da;
    varianceB += db * db;
  }

  if (varianceA === 0 || varianceB === 0) return 0;
  const value = covariance / Math.sqrt(varianceA * varianceB);
  return Number.isFinite(value) ? clamp(value, -1, 1) : 0;
};

export const rmse = (a: number[], b: number[]): number => {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;

  let sumSquares = 0;
  for (let i = 0; i < n; i += 1) {
    const diff = a[i] - b[i];
    sumSquares += diff * diff;
  }
  const value = Math.sqrt(sumSquares / n);
  return Number.isFinite(value) ? value : 0;
};

export const directionMatchPct = (a: number[], b: number[]): number => {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;

  let matches = 0;
  for (let i = 0; i < n; i += 1) {
    if (Math.sign(a[i]) === Math.sign(b[i])) matches += 1;
  }
  const value = (matches / n) * 100;
  return Number.isFinite(value) ? value : 0;
};

export const computeSimilarityScore = (
  currentReturns: number[],
  candidateReturns: number[],
): SimilarityScoreParts => {
  const correlation = pearsonCorrelation(currentReturns, candidateReturns);
  const rmseValue = rmse(currentReturns, candidateReturns);
  const directionMatch = directionMatchPct(currentReturns, candidateReturns);

  const corrScore = clamp(((correlation + 1) / 2) * 100, 0, 100);

  const epsilon = 1e-6;
  const scale = currentReturns.length > 0
    ? Math.max(epsilon, currentReturns.reduce((acc, value) => acc + Math.abs(value), 0) / currentReturns.length)
    : epsilon;
  const normalizedRmse = rmseValue / scale;
  const rmseScore = clamp(100 - normalizedRmse * 100, 0, 100);

  const directionScore = clamp(directionMatch, 0, 100);

  const similarityScore = clamp(corrScore * 0.45 + rmseScore * 0.35 + directionScore * 0.2, 0, 100);

  return {
    correlation: round4(correlation),
    corrScore: round2(corrScore),
    rmse: round4(rmseValue),
    rmseScore: round2(rmseScore),
    directionMatchPct: round2(directionMatch),
    directionScore: round2(directionScore),
    similarityScore: round2(similarityScore),
  };
};
