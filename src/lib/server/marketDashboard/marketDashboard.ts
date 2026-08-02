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
import { fetchLongHistoryOhlcv, OHLCV_SANITIZED_ERROR_CODES } from '../chart-ai/universalOhlcvProvider';
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

export const mapWithConcurrency = async <T, R>(
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

const YYYYMMDD_PATTERN = /^\d{8}$/;
const ISO_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z?)?$/;

/**
 * Constructs a UTC timestamp from calendar components and rejects it unless the constructed Date
 * round-trips back to the exact same components -- this is what catches an impossible date (e.g. day
 * 30 of a 28/29-day month, hour 25) that Date.UTC/Date.parse would otherwise silently roll over into
 * a *different*, finite, valid-looking timestamp (Phase 3GJ-HF2 spec section 4).
 */
const roundTripUtcMs = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millis: number,
): number | null => {
  const ms = Date.UTC(year, month - 1, day, hour, minute, second, millis);
  if (!Number.isFinite(ms)) return null;
  const roundTrip = new Date(ms);
  const matches =
    roundTrip.getUTCFullYear() === year &&
    roundTrip.getUTCMonth() === month - 1 &&
    roundTrip.getUTCDate() === day &&
    roundTrip.getUTCHours() === hour &&
    roundTrip.getUTCMinutes() === minute &&
    roundTrip.getUTCSeconds() === second;
  return matches ? ms : null;
};

/**
 * Accepts every timestamp shape the shared long-history OHLCV service can put into
 * historyRange.start/end: the KIS-native YYYYMMDD string, and the ISO-8601 date/timestamp the shared
 * normalizer converts it to. Never a permissive prefix test -- a value must match one of the two
 * closed shapes in full, and its calendar components must round-trip, or it is rejected as null
 * (Phase 3GJ-HF2 spec section 4; fixes the ISO/YYYYMMDD parser mismatch that made every real,
 * successful long-history result read as unavailable).
 */
export const parseMarketDataTimestampToUtcMs = (value: string | null | undefined): number | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  if (YYYYMMDD_PATTERN.test(trimmed)) {
    const year = Number(trimmed.slice(0, 4));
    const month = Number(trimmed.slice(4, 6));
    const day = Number(trimmed.slice(6, 8));
    return roundTripUtcMs(year, month, day, 0, 0, 0, 0);
  }

  const isoMatch = ISO_DATE_TIME_PATTERN.exec(trimmed);
  if (isoMatch) {
    const [, y, mo, d, h, mi, s, msFraction] = isoMatch;
    const year = Number(y);
    const month = Number(mo);
    const day = Number(d);
    const hour = h ? Number(h) : 0;
    const minute = mi ? Number(mi) : 0;
    const second = s ? Number(s) : 0;
    const millis = msFraction ? Number(msFraction.padEnd(3, '0')) : 0;
    return roundTripUtcMs(year, month, day, hour, minute, second, millis);
  }

  return null;
};

/**
 * Closed, internal-only diagnostic reasons (Phase 3GJ-HF2 spec section 6) -- distinguish a genuine
 * provider failure from a post-provider data-basis parsing failure so a future regression is
 * diagnosable from aggregate Vercel log counts alone. Never surfaced in a public API response.
 */
export const MARKET_DASHBOARD_INTERNAL_DIAGNOSTIC_REASONS = {
  OK: 'OK',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  HISTORY_RANGE_MISSING: 'HISTORY_RANGE_MISSING',
  HISTORY_RANGE_INVALID: 'HISTORY_RANGE_INVALID',
  INSUFFICIENT_HISTORY: 'INSUFFICIENT_HISTORY',
} as const;

export type MarketDashboardInternalDiagnosticReason =
  (typeof MARKET_DASHBOARD_INTERNAL_DIAGNOSTIC_REASONS)[keyof typeof MARKET_DASHBOARD_INTERNAL_DIAGNOSTIC_REASONS];

export const resolveFreshnessDiagnosis = (
  result: LongHistoryResult,
  nowMs: number,
): { freshness: FreshnessState; internalReason: MarketDashboardInternalDiagnosticReason } => {
  if (!result.ok || result.sourceStatus !== 'ok') {
    return { freshness: 'unavailable', internalReason: MARKET_DASHBOARD_INTERNAL_DIAGNOSTIC_REASONS.PROVIDER_ERROR };
  }

  const rawEnd = result.historyRange?.end;
  if (typeof rawEnd !== 'string' || rawEnd.trim().length === 0) {
    return { freshness: 'unavailable', internalReason: MARKET_DASHBOARD_INTERNAL_DIAGNOSTIC_REASONS.HISTORY_RANGE_MISSING };
  }

  const lastCandleMs = parseMarketDataTimestampToUtcMs(rawEnd);
  if (lastCandleMs === null) {
    return { freshness: 'unavailable', internalReason: MARKET_DASHBOARD_INTERNAL_DIAGNOSTIC_REASONS.HISTORY_RANGE_INVALID };
  }

  const ageDays = (nowMs - lastCandleMs) / (24 * 60 * 60 * 1000);
  const freshness: FreshnessState =
    ageDays > STALE_AFTER_CALENDAR_DAYS ? 'stale-but-usable' : result.cached ? 'cached' : 'fresh';
  return { freshness, internalReason: MARKET_DASHBOARD_INTERNAL_DIAGNOSTIC_REASONS.OK };
};

const extractCloses = (result: LongHistoryResult): number[] =>
  result.ok ? result.candles.map((candle) => candle.close).filter((close) => Number.isFinite(close) && close > 0) : [];

/**
 * 'ok' means a real, usable periodReturnPct was computed -- not merely that the OHLCV fetch
 * succeeded. 'insufficient-history' is the closed state for "transport succeeded but the selected
 * period's metric could not be computed" (too little history, malformed closes, no usable period
 * base close); it never counts toward valid coverage (Phase 3GJ-HF1 spec section 6).
 */
export type ResolvedConstituentMetrics = {
  symbol: string;
  country: 'KR' | 'US';
  name: string;
  displayName?: string;
  sector: string;
  relativeWeight: number;
  status: 'ok' | 'unresolved' | 'unavailable' | 'insufficient-history';
  periodReturnPct: number | null;
  momentum20dPct: number | null;
  trendVsSma60Pct: number | null;
  asOf: string | null;
  freshness: FreshnessState;
  /** Sanitized transport-level error code (set only when status is 'unavailable'); never the raw provider code. */
  providerErrorCode?: string;
};

export type ConstituentDiagnostic = {
  country: 'KR' | 'US';
  status: ResolvedConstituentMetrics['status'];
  providerErrorCode?: string;
  /** Internal-only closed reason (section 6); never included in a public API response. */
  internalReason?: MarketDashboardInternalDiagnosticReason;
  pagesFetched?: number;
  cacheState?: string;
};

const resolveAndComputeConstituent = async (
  constituent: TrackedConstituent,
  period: MarketDashboardPeriodId,
  deps: MarketDashboardDeps,
  allowProductionMarketDashboardLiveData: boolean,
  diagnostics?: ConstituentDiagnostic[],
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
    diagnostics?.push({ country: constituent.country, status: 'unresolved' });
    return { ...base, status: 'unresolved', periodReturnPct: null, momentum20dPct: null, trendVsSma60Pct: null, asOf: null, freshness: 'unavailable' };
  }

  const result = await deps.fetchLongHistoryOhlcv({
    instrument,
    allowProductionMarketDashboardLiveData,
    targetBars: METRICS_TARGET_BARS,
  });

  const nowMs = deps.now();
  const { freshness, internalReason } = resolveFreshnessDiagnosis(result, nowMs);
  if (freshness === 'unavailable') {
    const providerErrorCode = result.ok ? undefined : result.sanitizedErrorCode;
    diagnostics?.push({
      country: constituent.country,
      status: 'unavailable',
      providerErrorCode,
      internalReason,
      pagesFetched: result.pagesFetched,
      cacheState: result.cacheState,
    });
    return { ...base, status: 'unavailable', periodReturnPct: null, momentum20dPct: null, trendVsSma60Pct: null, asOf: null, freshness, ...(providerErrorCode ? { providerErrorCode } : {}) };
  }

  const closes = extractCloses(result);
  const metrics = computeConstituentMetrics(closes, period);
  const hasValidPeriodReturn = metrics.periodReturnPct !== null && Number.isFinite(metrics.periodReturnPct);
  const status = hasValidPeriodReturn ? 'ok' : 'insufficient-history';
  diagnostics?.push({
    country: constituent.country,
    status,
    internalReason: hasValidPeriodReturn
      ? MARKET_DASHBOARD_INTERNAL_DIAGNOSTIC_REASONS.OK
      : MARKET_DASHBOARD_INTERNAL_DIAGNOSTIC_REASONS.INSUFFICIENT_HISTORY,
    pagesFetched: result.pagesFetched,
    cacheState: result.cacheState,
  });
  return {
    ...base,
    status,
    periodReturnPct: metrics.periodReturnPct,
    momentum20dPct: metrics.momentum20dPct,
    trendVsSma60Pct: metrics.trendVsSma60Pct,
    asOf: result.historyRange?.end ?? null,
    freshness,
  };
};

const logDiagnosticSummary = (
  route: 'dashboard' | 'overview',
  universeId: string | null,
  period: string | null,
  diagnostics: ConstituentDiagnostic[],
): void => {
  const byStatus: Record<string, number> = {};
  const byErrorCode: Record<string, number> = {};
  const byInternalReason: Record<string, number> = {};
  const byCacheState: Record<string, number> = {};
  let krTotal = 0;
  let krOk = 0;
  let usTotal = 0;
  let usOk = 0;
  let pagesFetchedTotal = 0;
  for (const d of diagnostics) {
    byStatus[d.status] = (byStatus[d.status] ?? 0) + 1;
    if (d.providerErrorCode) byErrorCode[d.providerErrorCode] = (byErrorCode[d.providerErrorCode] ?? 0) + 1;
    if (d.internalReason) byInternalReason[d.internalReason] = (byInternalReason[d.internalReason] ?? 0) + 1;
    if (d.cacheState) byCacheState[d.cacheState] = (byCacheState[d.cacheState] ?? 0) + 1;
    if (typeof d.pagesFetched === 'number') pagesFetchedTotal += d.pagesFetched;
    if (d.country === 'KR') {
      krTotal += 1;
      if (d.status === 'ok') krOk += 1;
    } else if (d.country === 'US') {
      usTotal += 1;
      if (d.status === 'ok') usOk += 1;
    }
  }
  // Sanitized, aggregate-only diagnostic (Phase 3GJ-HF1/HF2 spec sections 4/6): no symbols, no
  // tokens, no raw provider payloads -- only closed-enum statuses/codes/internal-reasons and counts,
  // safe for Vercel runtime logs. byInternalReason distinguishes a genuine provider failure from a
  // post-provider data-basis parsing failure without ever exposing that reason in a public response.
  console.log(
    '[market-dashboard-diag]',
    JSON.stringify({
      route,
      universeId,
      period,
      total: diagnostics.length,
      byStatus,
      byErrorCode,
      byInternalReason,
      byCacheState,
      pagesFetchedTotal,
      kr: { total: krTotal, ok: krOk },
      us: { total: usTotal, ok: usOk },
    }),
  );
};

/**
 * True only when every non-'ok' member failed specifically because the provider rate-limited the
 * request (Phase 3GJ-HF1 spec section 5) -- lets a zero-successful-count result surface the honest
 * PROVIDER_RATE_LIMITED code instead of the generic MARKET_DATA_UNAVAILABLE when that is the true cause.
 */
type RateLimitAggregationMember = Pick<ResolvedConstituentMetrics, 'status' | 'providerErrorCode'>;

const allFailuresRateLimited = (members: RateLimitAggregationMember[]): boolean => {
  const failed = members.filter((member) => member.status !== 'ok');
  if (failed.length === 0) return false;
  return failed.every((member) => member.providerErrorCode === OHLCV_SANITIZED_ERROR_CODES.PROVIDER_RATE_LIMITED);
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
  /**
   * The OLDEST as-of date among valid (status 'ok') constituents -- a date every displayed
   * constituent's metric can honestly be said to share, not the most-recent individual date
   * (Phase 3GJ-HF1 spec section 8). Never the maximum/latest date.
   */
  commonAsOf: string | null;
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

  const validAsOfDates = constituents
    .filter((member) => member.status === 'ok')
    .map((member) => member.asOf)
    .filter((value): value is string => typeof value === 'string');
  const commonAsOf = validAsOfDates.length > 0 ? validAsOfDates.slice().sort()[0] : null;

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
    commonAsOf,
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
  const diagnostics: ConstituentDiagnostic[] = [];
  const constituents = await mapWithConcurrency(universe.constituents, CONCURRENCY_LIMIT, (constituent) =>
    resolveAndComputeConstituent(constituent, periodCandidate, resolvedDeps, allow, diagnostics),
  );

  const requestedCount = constituents.length;
  const successfulCount = constituents.filter((c) => c.status === 'ok').length;

  if (!meetsMinimumRenderThreshold(successfulCount, requestedCount)) {
    logDiagnosticSummary('dashboard', universe.id, periodCandidate, diagnostics);
    return unavailableDashboardResult(
      universe.id,
      periodCandidate,
      successfulCount === 0
        ? (allFailuresRateLimited(constituents)
            ? MARKET_DASHBOARD_SANITIZED_ERROR_CODES.PROVIDER_RATE_LIMITED
            : MARKET_DASHBOARD_SANITIZED_ERROR_CODES.MARKET_DATA_UNAVAILABLE)
        : MARKET_DASHBOARD_SANITIZED_ERROR_CODES.MARKET_DATA_PARTIAL_BELOW_THRESHOLD,
    );
  }

  const sectors = buildSectorSummaries(constituents);
  const breadth = buildBreadthSummary(constituents, sectors);
  const staleCount = constituents.filter((c) => c.freshness === 'stale-but-usable').length;
  const cachedCount = constituents.filter((c) => c.status === 'ok' && c.freshness === 'cached').length;
  const freshness = classifyOverallFreshness(successfulCount, requestedCount, staleCount, cachedCount);
  logDiagnosticSummary('dashboard', universe.id, periodCandidate, diagnostics);

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
  status: 'ok' | 'unresolved' | 'unavailable' | 'insufficient-history';
  periodReturnPct: number | null;
  momentum20dPct: number | null;
  trendVsSma60Pct: number | null;
  asOf: string | null;
  freshness: FreshnessState;
  providerErrorCode?: string;
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
  const diagnostics: ConstituentDiagnostic[] = [];
  const proxies = await mapWithConcurrency(MARKET_TRACKED_UNIVERSES, CONCURRENCY_LIMIT, async (universe) => {
    const proxyAsConstituent: TrackedConstituent = {
      symbol: universe.benchmarkProxy.symbol,
      country: universe.benchmarkProxy.country,
      name: universe.benchmarkProxy.label,
      sector: universe.label,
      relativeWeight: 1,
    };
    const resolved = await resolveAndComputeConstituent(proxyAsConstituent, periodCandidate, resolvedDeps, allow, diagnostics);
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
      ...(resolved.providerErrorCode ? { providerErrorCode: resolved.providerErrorCode } : {}),
    };
    return result;
  });

  const successfulCount = proxies.filter((p) => p.status === 'ok').length;
  if (successfulCount === 0) {
    logDiagnosticSummary('overview', null, periodCandidate, diagnostics);
    const sanitizedErrorCode = allFailuresRateLimited(proxies)
      ? MARKET_DASHBOARD_SANITIZED_ERROR_CODES.PROVIDER_RATE_LIMITED
      : MARKET_DASHBOARD_SANITIZED_ERROR_CODES.MARKET_DATA_UNAVAILABLE;
    return { ok: false, period: periodCandidate, proxies, freshness: 'unavailable', sanitizedErrorCode };
  }

  const staleCount = proxies.filter((p) => p.freshness === 'stale-but-usable').length;
  const cachedCount = proxies.filter((p) => p.status === 'ok' && p.freshness === 'cached').length;
  const freshness = classifyOverallFreshness(successfulCount, proxies.length, staleCount, cachedCount);
  logDiagnosticSummary('overview', null, periodCandidate, diagnostics);

  return { ok: true, period: periodCandidate, proxies, freshness, sanitizedErrorCode: MARKET_DASHBOARD_SANITIZED_ERROR_CODES.NONE };
};
