/**
 * Phase 3GJ live market dashboard — pure, deterministic metric calculations (client/server-safe).
 *
 * Every function here operates only on real OHLCV closes already fetched by the shared provider
 * (src/lib/server/chart-ai/universalOhlcvProvider.ts). No network, no credentials, no randomness,
 * no fabricated fallback: a metric that cannot be computed from available history returns null and
 * is reported as omitted by the caller, never substituted with zero. `closes` is always ascending by
 * trading date with the most recent close last (the same convention as
 * src/lib/server/chart-ai/marketIntelligence/relativeStrength.mjs).
 */

export type MarketDashboardPeriodId = '1d' | '1w' | '1m' | '3m';

/** Approximate trading-day offsets backward from the latest close (Phase 3GJ spec section 5). */
export const PERIOD_TRADING_DAY_OFFSETS: Record<MarketDashboardPeriodId, number> = {
  '1d': 1,
  '1w': 5,
  '1m': 21,
  '3m': 63,
};

export const MARKET_DASHBOARD_PERIOD_IDS: MarketDashboardPeriodId[] = ['1d', '1w', '1m', '3m'];

export const MOMENTUM_WINDOW_TRADING_DAYS = 20;
export const TREND_SMA_WINDOW_TRADING_DAYS = 60;

const round2 = (value: number): number => Math.round(value * 100) / 100;

const isPositiveFiniteCloses = (closes: number[]): boolean =>
  Array.isArray(closes) && closes.every((value) => Number.isFinite(value) && value > 0);

/** periodReturnPct = (latestClose / periodBaseClose - 1) * 100. Null when history is insufficient. */
export const computePeriodReturnPct = (closes: number[], period: MarketDashboardPeriodId): number | null => {
  if (!isPositiveFiniteCloses(closes)) return null;
  const offset = PERIOD_TRADING_DAY_OFFSETS[period];
  const n = closes.length;
  if (n < offset + 1) return null;
  const latestClose = closes[n - 1];
  const periodBaseClose = closes[n - 1 - offset];
  return round2((latestClose / periodBaseClose - 1) * 100);
};

/** momentum20dPct = (latestClose / close ~20 sessions earlier - 1) * 100. Null when history is short. */
export const computeMomentum20dPct = (closes: number[]): number | null => {
  if (!isPositiveFiniteCloses(closes)) return null;
  const n = closes.length;
  if (n < MOMENTUM_WINDOW_TRADING_DAYS + 1) return null;
  const latestClose = closes[n - 1];
  const priorClose = closes[n - 1 - MOMENTUM_WINDOW_TRADING_DAYS];
  return round2((latestClose / priorClose - 1) * 100);
};

/** sma60 = mean of the latest 60 closes. Null when fewer than 60 closes are available. */
export const computeSma60 = (closes: number[]): number | null => {
  if (!isPositiveFiniteCloses(closes)) return null;
  const n = closes.length;
  if (n < TREND_SMA_WINDOW_TRADING_DAYS) return null;
  const window = closes.slice(n - TREND_SMA_WINDOW_TRADING_DAYS);
  const mean = window.reduce((sum, value) => sum + value, 0) / TREND_SMA_WINDOW_TRADING_DAYS;
  return mean;
};

/** trendVsSma60Pct = (latestClose / sma60 - 1) * 100. Null when sma60 is unavailable. */
export const computeTrendVsSma60Pct = (closes: number[]): number | null => {
  if (!isPositiveFiniteCloses(closes)) return null;
  const sma60 = computeSma60(closes);
  if (sma60 === null || !(sma60 > 0)) return null;
  const latestClose = closes[closes.length - 1];
  return round2((latestClose / sma60 - 1) * 100);
};

export type ConstituentMetrics = {
  periodReturnPct: number | null;
  momentum20dPct: number | null;
  sma60: number | null;
  trendVsSma60Pct: number | null;
};

/** Computes all four Phase 3GJ metrics from one real close series in one pass. */
export const computeConstituentMetrics = (closes: number[], period: MarketDashboardPeriodId): ConstituentMetrics => ({
  periodReturnPct: computePeriodReturnPct(closes, period),
  momentum20dPct: computeMomentum20dPct(closes),
  sma60: computeSma60(closes),
  trendVsSma60Pct: computeTrendVsSma60Pct(closes),
});

export type FreshnessState = 'fresh' | 'cached' | 'stale-but-usable' | 'partial' | 'unavailable';

export type AggregatableMember = {
  relativeWeight: number;
  periodReturnPct: number | null;
  freshness: FreshnessState;
};

export type WeightedBreadthSummary = {
  successfulCount: number;
  successfulRelativeWeight: number;
  weightedPeriodReturnPct: number | null;
  medianPeriodReturnPct: number | null;
  advancers: number;
  decliners: number;
  unchanged: number;
  freshCount: number;
  staleCount: number;
};

/**
 * Weighted/median/advance-decline aggregation shared by sector-level (section 11) and market-breadth
 * (section 12) summaries. Only successfully resolved members (periodReturnPct !== null) contribute to
 * the weighted return, median, and advance/decline counts — a failed constituent is never treated as a
 * zero return. `successfulRelativeWeight` normalizes the weighted average across resolved members only.
 */
export const aggregateWeightedBreadth = (members: AggregatableMember[]): WeightedBreadthSummary => {
  const resolved = members.filter((member) => member.periodReturnPct !== null && Number.isFinite(member.relativeWeight));
  const successfulRelativeWeight = resolved.reduce((sum, member) => sum + member.relativeWeight, 0);

  let weightedPeriodReturnPct: number | null = null;
  if (resolved.length > 0 && successfulRelativeWeight > 0) {
    const weightedSum = resolved.reduce(
      (sum, member) => sum + (member.periodReturnPct as number) * member.relativeWeight,
      0,
    );
    weightedPeriodReturnPct = round2(weightedSum / successfulRelativeWeight);
  }

  let medianPeriodReturnPct: number | null = null;
  if (resolved.length > 0) {
    const sortedReturns = resolved.map((member) => member.periodReturnPct as number).sort((a, b) => a - b);
    const mid = Math.floor(sortedReturns.length / 2);
    medianPeriodReturnPct =
      sortedReturns.length % 2 === 0
        ? round2((sortedReturns[mid - 1] + sortedReturns[mid]) / 2)
        : round2(sortedReturns[mid]);
  }

  const advancers = resolved.filter((member) => (member.periodReturnPct as number) > 0).length;
  const decliners = resolved.filter((member) => (member.periodReturnPct as number) < 0).length;
  const unchanged = resolved.length - advancers - decliners;

  const freshCount = members.filter((member) => member.freshness === 'fresh' || member.freshness === 'cached').length;
  const staleCount = members.filter((member) => member.freshness === 'stale-but-usable').length;

  return {
    successfulCount: resolved.length,
    successfulRelativeWeight,
    weightedPeriodReturnPct,
    medianPeriodReturnPct,
    advancers,
    decliners,
    unchanged,
    freshCount,
    staleCount,
  };
};

export const MARKET_DASHBOARD_MIN_VALID_CONSTITUENTS = 5;
export const MARKET_DASHBOARD_MIN_COVERAGE_RATIO = 0.4;

/** Minimum-render threshold (Phase 3GJ spec section 10): >=5 valid results AND >=40% universe coverage. */
export const meetsMinimumRenderThreshold = (successfulCount: number, requestedCount: number): boolean => {
  if (requestedCount <= 0) return false;
  const coverageRatio = successfulCount / requestedCount;
  return successfulCount >= MARKET_DASHBOARD_MIN_VALID_CONSTITUENTS && coverageRatio >= MARKET_DASHBOARD_MIN_COVERAGE_RATIO;
};

/**
 * Classifies overall freshness from per-member states: fresh only when every resolved member is
 * fresh/cached with no failures; stale-but-usable when some members are stale but coverage still
 * clears the render threshold; partial when coverage is below the render threshold but still
 * renderable-with-caveats; unavailable when nothing resolved.
 */
export const classifyOverallFreshness = (
  successfulCount: number,
  requestedCount: number,
  staleCount: number,
): FreshnessState => {
  if (successfulCount <= 0) return 'unavailable';
  if (!meetsMinimumRenderThreshold(successfulCount, requestedCount)) return 'partial';
  if (staleCount > 0) return 'stale-but-usable';
  return successfulCount < requestedCount ? 'partial' : 'fresh';
};
