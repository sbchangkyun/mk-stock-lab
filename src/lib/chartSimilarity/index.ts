/**
 * Public exports for the chart similarity engine (Phase 3EX-B).
 *
 * Pure, deterministic, fixture-data-only foundation. No KIS, no API route, no DB, no auth, no
 * UI, no external AI. See `docs/planning/phase_3ex_b_chart_similarity_engine_deterministic_foundation_result_v0.1.md`.
 */

export type {
  OhlcBar,
  SimilarityWindow,
  SimilarityScanOptions,
  SimilarityScoreParts,
  ForwardOutcome,
  SimilarityMatch,
  SimilaritySummaryStats,
  SimilarityAnalysisResult,
} from './types';

export { sortBarsAscending, validateOhlcBars, toSimpleReturns, toLogReturns } from './returns';
export { zScore, toNormalizedPriceIndex } from './normalize';
export { createRollingWindows, getCurrentWindow, getCandidateWindows } from './rollingWindow';
export { pearsonCorrelation, rmse, directionMatchPct, computeSimilarityScore } from './similarityScore';
export { computeForwardReturn, computeForwardOutcome } from './forwardOutcome';
export { average, median, summarizeMatches } from './summaryStats';
export { scanSimilarity } from './similarityScanner';
