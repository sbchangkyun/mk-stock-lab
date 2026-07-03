/**
 * Deterministic similarity scanner (Phase 3EX-B, hardened in Phase 3EX-C).
 *
 * `scanSimilarity` is pure and synchronous: it takes an in-memory bar array and options, and
 * returns a `SimilarityAnalysisResult`. No KIS, no DB, no API, no UI, no external AI. Bad/short
 * input never throws — it is surfaced through `warnings` and an empty/degenerate result instead.
 * Raw `options` are never trusted directly; `normalizeScanOptions` sanitizes them first.
 */

import { toLogReturns, sortBarsAscending, validateOhlcBars } from './returns';
import { toNormalizedPriceIndex } from './normalize';
import { getCandidateWindows, getCurrentWindow } from './rollingWindow';
import { computeSimilarityScore } from './similarityScore';
import { computeForwardOutcome } from './forwardOutcome';
import { summarizeMatches } from './summaryStats';
import { normalizeScanOptions } from './scanOptions';
import type {
  OhlcBar,
  SimilarityAnalysisResult,
  SimilarityMatch,
  SimilarityScanOptions,
  SimilarityWindow,
} from './types';

const EMPTY_WINDOW: SimilarityWindow = { startIndex: 0, endIndex: -1, startDate: '', endDate: '', bars: [] };

export const scanSimilarity = (
  bars: OhlcBar[],
  options: SimilarityScanOptions,
): SimilarityAnalysisResult => {
  const warnings: string[] = [];
  const { valid, warnings: validationWarnings } = validateOhlcBars(bars);
  warnings.push(...validationWarnings);

  const normalizedOptions = normalizeScanOptions(options);
  warnings.push(...normalizedOptions.warnings);
  const { baseWindow, forwardWindows, topK, excludeRecentBars } = normalizedOptions;

  const sorted = sortBarsAscending(valid);
  const market = sorted[0]?.market ?? bars[0]?.market ?? 'UNKNOWN';
  const symbol = sorted[0]?.symbol ?? bars[0]?.symbol ?? 'UNKNOWN';

  const currentWindow = getCurrentWindow(sorted, baseWindow);
  if (!currentWindow) {
    warnings.push('Insufficient bars to build the current window.');
    return {
      market,
      symbol,
      baseWindow,
      currentWindow: EMPTY_WINDOW,
      currentNormalizedPath: [],
      matches: [],
      summaryStats: summarizeMatches([], forwardWindows),
      warnings,
    };
  }

  const currentNormalizedPath = toNormalizedPriceIndex(currentWindow.bars, 100);
  const currentReturns = toLogReturns(currentWindow.bars);

  const maxForwardWindow = forwardWindows.length > 0 ? Math.max(...forwardWindows) : 0;
  const candidates = getCandidateWindows(sorted, baseWindow, maxForwardWindow, excludeRecentBars);

  if (candidates.length === 0) {
    warnings.push('No candidate windows available after applying recent-window exclusion and forward-window requirements.');
  }

  const scored = candidates.map((candidate) => {
    const candidateReturns = toLogReturns(candidate.bars);
    const scoreParts = computeSimilarityScore(currentReturns, candidateReturns);
    const forwardOutcome = computeForwardOutcome(sorted, candidate.endIndex, forwardWindows);
    const normalizedPath = toNormalizedPriceIndex(candidate.bars, 100);
    return { candidate, scoreParts, forwardOutcome, normalizedPath };
  });

  scored.sort((a, b) => {
    if (b.scoreParts.similarityScore !== a.scoreParts.similarityScore) {
      return b.scoreParts.similarityScore - a.scoreParts.similarityScore;
    }
    if (b.scoreParts.correlation !== a.scoreParts.correlation) {
      return b.scoreParts.correlation - a.scoreParts.correlation;
    }
    if (a.candidate.startDate !== b.candidate.startDate) {
      return a.candidate.startDate < b.candidate.startDate ? -1 : 1;
    }
    return a.candidate.startIndex - b.candidate.startIndex;
  });

  const matches: SimilarityMatch[] = scored.slice(0, topK).map((entry, index) => ({
    rank: index + 1,
    startDate: entry.candidate.startDate,
    endDate: entry.candidate.endDate,
    similarityScore: entry.scoreParts.similarityScore,
    scoreParts: entry.scoreParts,
    forwardOutcome: entry.forwardOutcome,
    normalizedPath: entry.normalizedPath,
  }));

  const summaryStats = summarizeMatches(matches, forwardWindows);

  return {
    market,
    symbol,
    baseWindow,
    currentWindow,
    currentNormalizedPath,
    matches,
    summaryStats,
    warnings,
  };
};
