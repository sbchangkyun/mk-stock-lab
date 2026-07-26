/**
 * Phase 3GJ live market dashboard — server dashboard service.
 *
 * Orchestrates the closed tracked-universe registry (src/data/marketTrackedUniverses.ts) against the
 * existing, provider-neutral, cached OHLCV orchestration (fetchLongHistoryOhlcv) and the existing
 * authoritative instrument resolver (findUniversalInstrument). This module never calls a KIS
 * transport directly and never invents an index/instrument. Concurrency is capped at 3 simultaneous
 * provider/cache resolutions per request (no unbounded Promise.all, no background refresh, no retry
 * loop). A failed or unresolvable constituent is skipped while the rest still render; the whole
 * dashboard falls back to an honest "unavailable" result only when coverage drops below the
 * minimum-render threshold (>=5 valid constituents AND >=40% universe coverage).
 */

import {
  MARKET_TRACKED_UNIVERSES,
  findTrackedUniverse,
  type MarketUniverseId,
  type TrackedConstituent,
  type BenchmarkProxy,
} from '../../../data/marketTrackedUniverses';
import { findUniversalInstrument } from '../chart-ai/universal-instrument-search.mjs';
import { fetchLongHistoryOhlcv } from '../chart-ai/universalOhlcvProvider';
import {
  computeConstituentMetrics,
  aggregateWeightedBreadth,
  meetsMinimumRenderThreshold,
  classifyOverallFreshness,
  MARKET_DASHBOARD_PERIOD_IDS,
  type MarketDashboardPeriodId,
  type FreshnessState,
} from '../../market-dashboard/metrics';

export const MARKET_DASHBOARD_SANITIZED_ERROR_CODES = {
  NONE: 'NONE',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  MARKET_DASHBOARD_DISABLED: 'MARKET_DASHBOARD_DISABLED',
  MARKET_DATA_UNAVAILABLE: 'MARKET_DATA_UNAVAILABLE',
  MARKET_DATA_PARTIAL_BELOW_THRESHOLD: 'MARKET_DATA_PARTIAL_BELOW_THRESHOLD',
  PROVIDER_RATE_LIMITED: 'PROVIDER_RATE_LIMITED',
} as const;

/** Bars requested per constituent: >=64 needed for the 3m (63-session) offset, plus a safety margin. */
const METRICS_TARGET_BARS = 90;
const CONCURRENCY_LIMIT = 3;
const STALE_AFTER_CALENDAR_DAYS = 4;

type LongHistoryResult = Awaited<ReturnType<typeof fetchLongHistoryOhlcv>>;

export type MarketDashboardDeps = {
  fetchLongHistoryOhlcv: typeof fetchLongHistoryOhlcv;
  findUniversalInstrument: typeof findUniversalInstrument;
  now: () => number;
};

const defaultDeps: MarketDashboardDeps = {
  fetchLongHistoryOhlcv,
  findUniversalInstrument,
  now: () => Date.now(),
};

const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workerCount = Math.max(1, Math.min(limit, items.length));
  const workers = Array.from({ length: workerCount }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
};

const parseYyyymmddToUtcMs = (value: string | null | undefined): number | null => {
  if (typeof value !== 'string' || !/^\d{8}/.test(value)) return null;
  const y = Number(value.slice(0, 4));
  const m = Number(value.slice(4, 6));
  const d = Number(value.slice(6, 8));
  const ms = Date.UTC(y, m - 1, d);
  return Number.isFinite(ms) ? ms : null;
};

const classifyResultFreshness = (result: LongHistoryResult, nowMs: number): FreshnessState => {
  if (!result.ok || result.sourceStatus !== 'ok') return 'unavailable';
  const lastCandleMs = parseYyyymmddToUtcMs(result.historyRange?.end);
  if (lastCandleMs === null) return 'unavailable';
  const ageDays = (nowMs - lastCandleMs) / (24 * 60 * 60 * 1000);
  if (ageDays > STALE_AFTER_CALENDAR_DAYS) return 'stale-but-usable';
  return result.cached ? 'cached' : 'fresh';
};

const extractCloses = (result: LongHistoryResult): number[] =>
  result.ok ? result.candles.map((candle) => candle.close).filter((close) => Number.isFinite(close) && close > 0) : [];

export type ResolvedConstituentMetrics = {
  symbol: string;
  country: 'KR' | 'US';
  name: string;
  displayName?: string;
  sector: string;
  relativeWeight: number;
  status: 'ok' | 'unresolved' | 'unavailable';
  periodReturnPct: number | null;
  momentum20dPct: number | null;
  trendVsSma60Pct: number | null;
  asOf: string | null;
  freshness: FreshnessState;
};

const resolveAndComputeConstituent = async (
  constituent: TrackedConstituent,
  period: MarketDashboardPeriodId,
  deps: MarketDashboardDeps,
  allowProductionMarketDashboardLiveData: boolean,
): Promise<ResolvedConstituentMetrics> => {
  const base = {
    symbol: constituent.symbol,
    country: constituent.country,
    name: constituent.name,
    ...(constituent.displayName ? { displayName: constituent.displayName } : {}),
    sector: constituent.sector,
    relativeWeight: constituent.relativeWeight,
  };

  const instrument = deps.findUniversalInstrument(constituent.symbol, constituent.country);
  if (!instrument) {
    return { ...base, status: 'unresolved', periodReturnPct: null, momentum20dPct: null, trendVsSma60Pct: null, asOf: null, freshness: 'unavailable' };
  }

  const result = await deps.fetchLongHistoryOhlcv({
    instrument,
    allowProductionMarketDashboardLiveData,
    targetBars: METRICS_TARGET_BARS,
  });

  const nowMs = deps.now();
  const freshness = classifyResultFreshness(result, nowMs);
  if (freshness === 'unavailable') {
    return { ...base, status: 'unavailable', periodReturnPct: null, momentum20dPct: null, trendVsSma60Pct: null, asOf: null, freshness };
  }

  const closes = extractCloses(result);
  const metrics = computeConstituentMetrics(closes, period);
  return {
    ...base,
    status: 'ok',
    periodReturnPct: metrics.periodReturnPct,
    momentum20dPct: metrics.momentum20dPct,
    trendVsSma60Pct: metrics.trendVsSma60Pct,
    asOf: result.historyRange?.end ?? null,
    freshness,
  };
};

export type MarketSectorSummary = {
  sector: string;
  requestedCount: number;
  successfulCount: number;
  successfulRelativeWeight: number;
  weightedPeriodReturnPct: number | null;
  advancers: number;
  decliners: number;
  unchanged: number;
  freshCount: number;
  staleCount: number;
};

const buildSectorSummaries = (constituents: ResolvedConstituentMetrics[]): MarketSectorSummary[] => {
  const bySector = new Map<string, ResolvedConstituentMetrics[]>();
  for (const constituent of constituents) {
    const list = bySector.get(constituent.sector) ?? [];
    list.push(constituent);
    bySector.set(constituent.sector, list);
  }
  return [...bySector.entries()].map(([sector, members]) => {
    const summary = aggregateWeightedBreadth(
      members.map((member) => ({
        relativeWeight: member.relativeWeight,
        periodReturnPct: member.periodReturnPct,
        freshness: member.freshness,
      })),
    );
    return {
      sector,
      requestedCount: members.length,
      successfulCount: summary.successfulCount,
      successfulRelativeWeight: summary.successfulRelativeWeight,
      weightedPeriodReturnPct: summary.weightedPeriodReturnPct,
      advancers: summary.advancers,
      decliners: summary.decliners,
      unchanged: summary.unchanged,
      freshCount: summary.freshCount,
      staleCount: summary.staleCount,
    };
  });
};

export type MarketBreadthSummary = {
  requestedCount: number;
  successfulCount: number;
  failedCount: number;
  staleCount: number;
  advancers: number;
  decliners: number;
  unchanged: number;
  weightedPeriodReturnPct: number | null;
  medianPeriodReturnPct: number | null;
  strongestSector: string | null;
  weakestSector: string | null;
  latestAsOf: string | null;
};

const buildBreadthSummary = (
  constituents: ResolvedConstituentMetrics[],
  sectors: MarketSectorSummary[],
): MarketBreadthSummary => {
  const summary = aggregateWeightedBreadth(
    constituents.map((member) => ({
      relativeWeight: member.relativeWeight,
      periodReturnPct: member.periodReturnPct,
      freshness: member.freshness,
    })),
  );

  const rankedSectors = sectors
    .filter((sector) => sector.weightedPeriodReturnPct !== null)
    .sort((a, b) => (b.weightedPeriodReturnPct as number) - (a.weightedPeriodReturnPct as number));

  const asOfDates = constituents.map((member) => member.asOf).filter((value): value is string => typeof value === 'string');
  const latestAsOf = asOfDates.length > 0 ? asOfDates.sort().reverse()[0] : null;

  return {
    requestedCount: constituents.length,
    successfulCount: summary.successfulCount,
    failedCount: constituents.length - summary.successfulCount,
    staleCount: summary.staleCount,
    advancers: summary.advancers,
    decliners: summary.decliners,
    unchanged: summary.unchanged,
    weightedPeriodReturnPct: summary.weightedPeriodReturnPct,
    medianPeriodReturnPct: summary.medianPeriodReturnPct,
    strongestSector: rankedSectors.length > 0 ? rankedSectors[0].sector : null,
    weakestSector: rankedSectors.length > 0 ? rankedSectors[rankedSectors.length - 1].sector : null,
    latestAsOf,
  };
};

export type MarketDashboardResult = {
  ok: boolean;
  universeId: MarketUniverseId | null;
  period: MarketDashboardPeriodId | null;
  currency: 'KRW' | 'USD' | null;
  benchmarkProxy: BenchmarkProxy | null;
  constituents: ResolvedConstituentMetrics[];
  sectors: MarketSectorSummary[];
  breadth: MarketBreadthSummary | null;
  freshness: FreshnessState;
  sanitizedErrorCode: string;
};

const unavailableDashboardResult = (
  universeId: MarketUniverseId | null,
  period: MarketDashboardPeriodId | null,
  sanitizedErrorCode: string,
): MarketDashboardResult => ({
  ok: false,
  universeId,
  period,
  currency: null,
  benchmarkProxy: null,
  constituents: [],
  sectors: [],
  breadth: null,
  freshness: 'unavailable',
  sanitizedErrorCode,
});

/**
 * Builds one closed-universe dashboard result: bounded (<=12) constituent OHLCV loads at
 * concurrency<=3, real per-constituent metrics, sector aggregation, market breadth, and a
 * minimum-render-threshold gate. Never calls a KIS transport directly (see fetchLongHistoryOhlcv).
 */
export const getMarketDashboard = async (
  input: { universeId: string; period: string; allowProductionMarketDashboardLiveData?: boolean },
  deps: Partial<MarketDashboardDeps> = {},
): Promise<MarketDashboardResult> => {
  const resolvedDeps: MarketDashboardDeps = { ...defaultDeps, ...deps };
  const universeIdCandidate = input.universeId as MarketUniverseId;
  const periodCandidate = input.period as MarketDashboardPeriodId;

  if (!MARKET_DASHBOARD_PERIOD_IDS.includes(periodCandidate)) {
    return unavailableDashboardResult(null, null, MARKET_DASHBOARD_SANITIZED_ERROR_CODES.VALIDATION_FAILED);
  }

  const universe = findTrackedUniverse(universeIdCandidate);
  if (!universe) {
    return unavailableDashboardResult(null, periodCandidate, MARKET_DASHBOARD_SANITIZED_ERROR_CODES.VALIDATION_FAILED);
  }

  const allow = input.allowProductionMarketDashboardLiveData === true;
  const constituents = await mapWithConcurrency(universe.constituents, CONCURRENCY_LIMIT, (constituent) =>
    resolveAndComputeConstituent(constituent, periodCandidate, resolvedDeps, allow),
  );

  const requestedCount = constituents.length;
  const successfulCount = constituents.filter((c) => c.status === 'ok').length;

  if (!meetsMinimumRenderThreshold(successfulCount, requestedCount)) {
    return unavailableDashboardResult(
      universe.id,
      periodCandidate,
      successfulCount === 0
        ? MARKET_DASHBOARD_SANITIZED_ERROR_CODES.MARKET_DATA_UNAVAILABLE
        : MARKET_DASHBOARD_SANITIZED_ERROR_CODES.MARKET_DATA_PARTIAL_BELOW_THRESHOLD,
    );
  }

  const sectors = buildSectorSummaries(constituents);
  const breadth = buildBreadthSummary(constituents, sectors);
  const staleCount = constituents.filter((c) => c.freshness === 'stale-but-usable').length;
  const freshness = classifyOverallFreshness(successfulCount, requestedCount, staleCount);

  return {
    ok: true,
    universeId: universe.id,
    period: periodCandidate,
    currency: universe.currency,
    benchmarkProxy: universe.benchmarkProxy,
    constituents,
    sectors,
    breadth,
    freshness,
    sanitizedErrorCode: MARKET_DASHBOARD_SANITIZED_ERROR_CODES.NONE,
  };
};

export type MarketOverviewProxyResult = {
  universeId: MarketUniverseId;
  universeLabel: string;
  proxy: BenchmarkProxy;
  status: 'ok' | 'unresolved' | 'unavailable';
  periodReturnPct: number | null;
  momentum20dPct: number | null;
  trendVsSma60Pct: number | null;
  asOf: string | null;
  freshness: FreshnessState;
};

export type MarketOverviewResult = {
  ok: boolean;
  period: MarketDashboardPeriodId | null;
  proxies: MarketOverviewProxyResult[];
  freshness: FreshnessState;
  sanitizedErrorCode: string;
};

/**
 * Resolves ONLY the four validated benchmark proxies (never a detailed universe) for the Home
 * snapshot and the Market page's always-visible overview row.
 */
export const getMarketOverview = async (
  input: { period?: string; allowProductionMarketDashboardLiveData?: boolean } = {},
  deps: Partial<MarketDashboardDeps> = {},
): Promise<MarketOverviewResult> => {
  const resolvedDeps: MarketDashboardDeps = { ...defaultDeps, ...deps };
  const periodCandidate = (input.period ?? '1d') as MarketDashboardPeriodId;

  if (!MARKET_DASHBOARD_PERIOD_IDS.includes(periodCandidate)) {
    return { ok: false, period: null, proxies: [], freshness: 'unavailable', sanitizedErrorCode: MARKET_DASHBOARD_SANITIZED_ERROR_CODES.VALIDATION_FAILED };
  }

  const allow = input.allowProductionMarketDashboardLiveData === true;
  const proxies = await mapWithConcurrency(MARKET_TRACKED_UNIVERSES, CONCURRENCY_LIMIT, async (universe) => {
    const proxyAsConstituent: TrackedConstituent = {
      symbol: universe.benchmarkProxy.symbol,
      country: universe.benchmarkProxy.country,
      name: universe.benchmarkProxy.label,
      sector: universe.label,
      relativeWeight: 1,
    };
    const resolved = await resolveAndComputeConstituent(proxyAsConstituent, periodCandidate, resolvedDeps, allow);
    const result: MarketOverviewProxyResult = {
      universeId: universe.id,
      universeLabel: universe.label,
      proxy: universe.benchmarkProxy,
      status: resolved.status,
      periodReturnPct: resolved.periodReturnPct,
      momentum20dPct: resolved.momentum20dPct,
      trendVsSma60Pct: resolved.trendVsSma60Pct,
      asOf: resolved.asOf,
      freshness: resolved.freshness,
    };
    return result;
  });

  const successfulCount = proxies.filter((p) => p.status === 'ok').length;
  if (successfulCount === 0) {
    return { ok: false, period: periodCandidate, proxies, freshness: 'unavailable', sanitizedErrorCode: MARKET_DASHBOARD_SANITIZED_ERROR_CODES.MARKET_DATA_UNAVAILABLE };
  }

  const staleCount = proxies.filter((p) => p.freshness === 'stale-but-usable').length;
  const freshness = classifyOverallFreshness(successfulCount, proxies.length, staleCount);

  return { ok: true, period: periodCandidate, proxies, freshness, sanitizedErrorCode: MARKET_DASHBOARD_SANITIZED_ERROR_CODES.NONE };
};
