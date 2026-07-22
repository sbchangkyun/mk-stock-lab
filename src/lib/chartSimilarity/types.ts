/**
 * Chart similarity engine type foundation (Phase 3EX-B).
 *
 * These types describe a pure, deterministic similarity-analysis data model. They are
 * implementation-ready but intentionally decoupled from KIS: no raw provider fields, no
 * credentials, no account/auth/DB identifiers. KIS provider wiring, API routes, caching, and
 * auth are all deferred to later phases per the Phase 3EX-A owner decisions.
 */

export type OhlcBar = {
  market: string;
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
  adjusted: boolean;
  source: 'synthetic' | 'fixture' | 'kis-normalized';
};

export type SimilarityWindow = {
  startIndex: number;
  endIndex: number;
  startDate: string;
  endDate: string;
  bars: OhlcBar[];
};

export type SimilarityScanOptions = {
  baseWindow: 20 | 40 | 60 | number;
  forwardWindows: number[];
  topK: number;
  similarityMethod: 'return_correlation_rmse';
  excludeRecentBars: number;
};

export type SimilarityScoreParts = {
  correlation: number;
  corrScore: number;
  rmse: number;
  rmseScore: number;
  directionMatchPct: number;
  directionScore: number;
  similarityScore: number;
};

export type ForwardOutcome = {
  forwardReturns: Record<string, number | null>;
  maxDrawdownPct: number | null;
  maxUpsidePct: number | null;
};

export type SimilarityMatch = {
  rank: number;
  startDate: string;
  endDate: string;
  similarityScore: number;
  scoreParts: SimilarityScoreParts;
  forwardOutcome: ForwardOutcome;
  normalizedPath: Array<{ index: number; value: number }>;
};

export type SimilaritySummaryStats = {
  matchCount: number;
  averageForwardReturnByWindow: Record<string, number | null>;
  medianForwardReturnByWindow: Record<string, number | null>;
  positiveCountByWindow: Record<string, number>;
  negativeCountByWindow: Record<string, number>;
  averageMaxDrawdownPct: number | null;
};

export type SimilarityAnalysisResult = {
  market: string;
  symbol: string;
  baseWindow: number;
  currentWindow: SimilarityWindow;
  currentNormalizedPath: Array<{ index: number; value: number }>;
  matches: SimilarityMatch[];
  summaryStats: SimilaritySummaryStats;
  warnings: string[];
};
