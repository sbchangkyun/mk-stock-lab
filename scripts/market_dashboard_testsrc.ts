/**
 * Phase 3GJ test source (bundled + run by scripts/smoke_phase_3gj_live_market_dashboard.mjs via esbuild).
 *
 * Exercises the pure metric/aggregation contract in src/lib/market-dashboard/metrics.ts, the display
 * formatters in src/lib/market-dashboard/formatters.ts, the closed tracked-universe registry in
 * src/data/marketTrackedUniverses.ts, and the server dashboard service in
 * src/lib/server/marketDashboard/marketDashboard.ts (with injected fetchLongHistoryOhlcv /
 * findUniversalInstrument / now dependencies -- no network, no Supabase, no env reads).
 */

import {
  computePeriodReturnPct,
  computeMomentum20dPct,
  computeSma60,
  computeTrendVsSma60Pct,
  computeConstituentMetrics,
  aggregateWeightedBreadth,
  meetsMinimumRenderThreshold,
  classifyOverallFreshness,
  MARKET_DASHBOARD_PERIOD_IDS,
  type FreshnessState,
} from '../src/lib/market-dashboard/metrics';
import {
  formatSignedPct,
  changeToneClass,
  colorForReturn,
  freshnessLabel,
  formatAsOfDate,
  PERIOD_LABELS,
} from '../src/lib/market-dashboard/formatters';
import {
  MARKET_TRACKED_UNIVERSES,
  MARKET_UNIVERSE_IDS,
  findTrackedUniverse,
} from '../src/data/marketTrackedUniverses';
import { getMarketDashboard, getMarketOverview } from '../src/lib/server/marketDashboard/marketDashboard';
import type { LongHistoryOhlcvResult } from '../src/lib/server/chart-ai/universalOhlcvProvider';

let passed = 0;
let failed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

// =====================================================================================
// Group 1: metrics.ts -- pure per-constituent metric formulas
// =====================================================================================

// computePeriodReturnPct: null when history is shorter than the offset + 1, else the documented
// (latestClose / periodBaseClose - 1) * 100 formula for each of the four contract periods.
{
  const offsets: Record<string, number> = { '1d': 1, '1w': 5, '1m': 21, '3m': 63 };
  for (const period of MARKET_DASHBOARD_PERIOD_IDS) {
    const offset = offsets[period];
    const tooShort = new Array(offset).fill(100);
    check(`${period}: returns null when history length === offset`, computePeriodReturnPct(tooShort, period) === null);

    const justEnough = [...new Array(offset).fill(100), 110];
    check(
      `${period}: computes (latest/base - 1) * 100 at exactly offset + 1 closes`,
      computePeriodReturnPct(justEnough, period) === 10,
    );
  }
  check('computePeriodReturnPct: null on empty closes', computePeriodReturnPct([], '1d') === null);
  check('computePeriodReturnPct: null on non-positive close', computePeriodReturnPct([100, 0, 105], '1d') === null);
  check('computePeriodReturnPct: null on non-finite close', computePeriodReturnPct([100, Number.NaN, 105], '1d') === null);
}

// computeMomentum20dPct: null below 21 closes, else (latest / close~20 sessions earlier - 1) * 100.
{
  const insufficient = new Array(20).fill(100);
  check('computeMomentum20dPct: null with exactly 20 closes', computeMomentum20dPct(insufficient) === null);

  const sufficient = [...new Array(20).fill(100), 120];
  check('computeMomentum20dPct: 20% momentum with 21 closes', computeMomentum20dPct(sufficient) === 20);
}

// computeSma60 / computeTrendVsSma60Pct: null below 60 closes; mean of latest 60 + documented trend formula.
{
  check('computeSma60: null with 59 closes', computeSma60(new Array(59).fill(100)) === null);
  check('computeTrendVsSma60Pct: null with 59 closes', computeTrendVsSma60Pct(new Array(59).fill(100)) === null);

  // 91..150 (60 ascending integers): exact mean 120.5, latest close 150.
  const trendCloses = Array.from({ length: 60 }, (_, i) => 91 + i);
  const expectedSma60 = 120.5;
  const expectedTrend = round2((150 / expectedSma60 - 1) * 100);
  check('computeSma60: exact mean of latest 60 closes', computeSma60(trendCloses) === expectedSma60);
  check('computeTrendVsSma60Pct: matches documented formula', computeTrendVsSma60Pct(trendCloses) === expectedTrend);

  // Only the latest 60 count when more history is available -- prepending garbage must not shift the window.
  const withExtraHistory = [9999, 8888, ...trendCloses];
  check(
    'computeSma60: ignores closes older than the latest 60-session window',
    computeSma60(withExtraHistory) === expectedSma60,
  );
}

// computeConstituentMetrics: bundles all four in one deterministic pass.
{
  const closes = Array.from({ length: 90 }, (_, i) => 100 + i);
  const metrics = computeConstituentMetrics(closes, '1m');
  check(
    'computeConstituentMetrics: periodReturnPct matches computePeriodReturnPct',
    metrics.periodReturnPct === computePeriodReturnPct(closes, '1m'),
  );
  check(
    'computeConstituentMetrics: momentum20dPct matches computeMomentum20dPct',
    metrics.momentum20dPct === computeMomentum20dPct(closes),
  );
  check('computeConstituentMetrics: sma60 matches computeSma60', metrics.sma60 === computeSma60(closes));
  check(
    'computeConstituentMetrics: trendVsSma60Pct matches computeTrendVsSma60Pct',
    metrics.trendVsSma60Pct === computeTrendVsSma60Pct(closes),
  );
}

// =====================================================================================
// Group 2: metrics.ts -- weighted breadth aggregation (never treats a failed member as zero-return)
// =====================================================================================

type Member = { relativeWeight: number; periodReturnPct: number | null; freshness: FreshnessState };

{
  const empty = aggregateWeightedBreadth([]);
  check('aggregateWeightedBreadth: empty -> successfulCount 0', empty.successfulCount === 0);
  check('aggregateWeightedBreadth: empty -> weightedPeriodReturnPct null', empty.weightedPeriodReturnPct === null);
  check('aggregateWeightedBreadth: empty -> medianPeriodReturnPct null', empty.medianPeriodReturnPct === null);
  check('aggregateWeightedBreadth: empty -> zero advancers/decliners/unchanged', empty.advancers === 0 && empty.decliners === 0 && empty.unchanged === 0);
}

{
  const members: Member[] = [
    { relativeWeight: 100, periodReturnPct: 10, freshness: 'fresh' },
    { relativeWeight: 200, periodReturnPct: -5, freshness: 'cached' },
    { relativeWeight: 50, periodReturnPct: 0, freshness: 'stale-but-usable' },
    { relativeWeight: 80, periodReturnPct: null, freshness: 'unavailable' },
  ];
  const summary = aggregateWeightedBreadth(members);
  check('aggregateWeightedBreadth: excludes failed (null-return) member from successfulCount', summary.successfulCount === 3);
  check(
    'aggregateWeightedBreadth: successfulRelativeWeight sums only resolved members',
    summary.successfulRelativeWeight === 350,
  );
  check(
    'aggregateWeightedBreadth: weighted return never treats the failed member as zero',
    summary.weightedPeriodReturnPct === 0,
  );
  check('aggregateWeightedBreadth: median over resolved members only', summary.medianPeriodReturnPct === 0);
  check('aggregateWeightedBreadth: advancers/decliners/unchanged counted correctly', summary.advancers === 1 && summary.decliners === 1 && summary.unchanged === 1);
  check('aggregateWeightedBreadth: freshCount counts fresh+cached only', summary.freshCount === 2);
  check('aggregateWeightedBreadth: staleCount counts stale-but-usable only', summary.staleCount === 1);
}

{
  // Even-length median: (2nd + 3rd) / 2 of the sorted returns.
  const members: Member[] = [1, 2, 3, 4].map((value, i) => ({
    relativeWeight: 10,
    periodReturnPct: value,
    freshness: i === 0 ? 'fresh' : 'cached',
  }));
  const summary = aggregateWeightedBreadth(members);
  check('aggregateWeightedBreadth: even-length median averages the two middle values', summary.medianPeriodReturnPct === 2.5);
}

{
  // All resolved members have zero relative weight -> weighted return stays null even though resolved.
  const members: Member[] = [{ relativeWeight: 0, periodReturnPct: 5, freshness: 'fresh' }];
  const summary = aggregateWeightedBreadth(members);
  check(
    'aggregateWeightedBreadth: zero total relative weight -> weightedPeriodReturnPct null (never divide by zero)',
    summary.weightedPeriodReturnPct === null,
  );
  check('aggregateWeightedBreadth: median still computed from resolved members', summary.medianPeriodReturnPct === 5);
}

// =====================================================================================
// Group 3: metrics.ts -- minimum-render threshold + overall freshness classification
// =====================================================================================

{
  check('meetsMinimumRenderThreshold: requestedCount <= 0 always false', meetsMinimumRenderThreshold(10, 0) === false);
  check('meetsMinimumRenderThreshold: below the 5-count floor fails even with full coverage', meetsMinimumRenderThreshold(4, 4) === false);
  check('meetsMinimumRenderThreshold: below 40% coverage fails even with >=5 successes', meetsMinimumRenderThreshold(5, 20) === false);
  check('meetsMinimumRenderThreshold: >=5 successes and >=40% coverage passes', meetsMinimumRenderThreshold(5, 12) === true);
  check('meetsMinimumRenderThreshold: full coverage passes', meetsMinimumRenderThreshold(12, 12) === true);
}

{
  check('classifyOverallFreshness: zero successes -> unavailable', classifyOverallFreshness(0, 12, 0) === 'unavailable');
  check('classifyOverallFreshness: below render threshold -> partial', classifyOverallFreshness(3, 12, 0) === 'partial');
  check('classifyOverallFreshness: full coverage, some stale -> stale-but-usable', classifyOverallFreshness(12, 12, 2) === 'stale-but-usable');
  check('classifyOverallFreshness: threshold met, none stale, partial coverage -> partial', classifyOverallFreshness(6, 12, 0) === 'partial');
  check('classifyOverallFreshness: full coverage, none stale -> fresh', classifyOverallFreshness(12, 12, 0) === 'fresh');

  // Phase 3GJ-HF1 spec section 7: cachedCount is the new 4th parameter -- reachable 'cached' state,
  // stale still outranks cached, and partial-coverage still outranks both (cached data is never fresh).
  check('classifyOverallFreshness: cachedCount omitted -> cached state never reachable', classifyOverallFreshness(12, 12, 0) === 'fresh');
  check('classifyOverallFreshness: full coverage, no stale, some cached -> cached', classifyOverallFreshness(12, 12, 0, 3) === 'cached');
  check('classifyOverallFreshness: full coverage, stale outranks cached', classifyOverallFreshness(12, 12, 2, 3) === 'stale-but-usable');
  check('classifyOverallFreshness: partial coverage outranks both stale and cached', classifyOverallFreshness(6, 12, 2, 3) === 'partial');
}

// =====================================================================================
// Group 4: formatters.ts -- client-safe display helpers
// =====================================================================================

{
  check('formatSignedPct: positive value gets a leading +', formatSignedPct(5.2) === '+5.20%');
  check('formatSignedPct: negative value keeps its own sign', formatSignedPct(-3.1) === '-3.10%');
  check('formatSignedPct: zero has no sign', formatSignedPct(0) === '0.00%');
  check('formatSignedPct: null -> em dash placeholder (never a fabricated number)', formatSignedPct(null) === '—');

  check('changeToneClass: positive', changeToneClass(5) === 'positive');
  check('changeToneClass: negative', changeToneClass(-1) === 'negative');
  check('changeToneClass: zero is neutral', changeToneClass(0) === 'neutral');
  check('changeToneClass: null is neutral', changeToneClass(null) === 'neutral');

  check('colorForReturn: >=5 strong positive band', colorForReturn(5) === '#9d1c22');
  check('colorForReturn: just under 5 falls to the next band', colorForReturn(4.99) === '#d54a3f');
  check('colorForReturn: <=-5 strong negative band', colorForReturn(-5) === '#174ea6');
  check('colorForReturn: null -> neutral gray', colorForReturn(null) === '#9aa4b2');

  check('freshnessLabel: known state', freshnessLabel('fresh') === '최신');
  check('freshnessLabel: unknown string falls back to unavailable label', freshnessLabel('bogus') === '이용 불가');
  check('freshnessLabel: null falls back to unavailable label', freshnessLabel(null) === '이용 불가');

  check('formatAsOfDate: valid yyyymmdd formats with a trailing label', formatAsOfDate('20260724') === '2026.07.24 종가 기준');
  check('formatAsOfDate: null -> em dash placeholder', formatAsOfDate(null) === '—');
  check('formatAsOfDate: malformed string -> em dash placeholder', formatAsOfDate('bad') === '—');

  check(
    'PERIOD_LABELS: exactly the four contract periods, no 6m/1y',
    Object.keys(PERIOD_LABELS).sort().join(',') === '1d,1m,1w,3m',
  );
}

// =====================================================================================
// Group 5: marketTrackedUniverses.ts -- closed registry static-contract checks
// =====================================================================================

{
  check(
    'MARKET_UNIVERSE_IDS: exactly the four contract universes',
    MARKET_UNIVERSE_IDS.slice().sort().join(',') === 'kosdaq150,kospi200,nasdaq100,sp500',
  );
  check('MARKET_UNIVERSE_IDS: never exposes the private my-portfolio universe', !MARKET_UNIVERSE_IDS.includes('my-portfolio' as never));
  check('findTrackedUniverse: unknown id -> null', findTrackedUniverse('bogus') === null);
  check('findTrackedUniverse: known id resolves', findTrackedUniverse('sp500')?.id === 'sp500');

  for (const universe of MARKET_TRACKED_UNIVERSES) {
    check(`${universe.id}: bounded to <=12 constituents`, universe.constituents.length <= 12);
    check(
      `${universe.id}: constituents sorted by descending relativeWeight`,
      universe.constituents.every((c, i, arr) => i === 0 || arr[i - 1].relativeWeight >= c.relativeWeight),
    );
  }

  const proxyBySymbol: Record<string, { symbol: string; country: string }> = {
    kospi200: { symbol: '069500', country: 'KR' },
    kosdaq150: { symbol: '229200', country: 'KR' },
    sp500: { symbol: 'SPY', country: 'US' },
    nasdaq100: { symbol: 'QQQ', country: 'US' },
  };
  for (const [id, expected] of Object.entries(proxyBySymbol)) {
    const universe = findTrackedUniverse(id);
    check(
      `${id}: benchmark proxy matches spec section 7 (${expected.symbol}/${expected.country})`,
      universe?.benchmarkProxy.symbol === expected.symbol && universe?.benchmarkProxy.country === expected.country,
    );
  }
}

// =====================================================================================
// Group 6: marketDashboard.ts -- server orchestration with injected deps (no network)
// =====================================================================================

type FakeCandle = { close: number };

const okResult = (closes: number[], asOfYyyymmdd: string, cached = false): LongHistoryOhlcvResult => ({
  ok: true,
  sourceStatus: 'ok',
  sanitizedErrorCode: 'NONE',
  instrument: null,
  candles: closes.map((close): FakeCandle => ({ close })) as unknown as LongHistoryOhlcvResult['candles'],
  barCount: closes.length,
  historyRange: { start: '20260101', end: asOfYyyymmdd },
  cached,
  asOf: new Date().toISOString(),
  currency: null,
  pagesFetched: 1,
});

const failResult: LongHistoryOhlcvResult = {
  ok: false,
  sourceStatus: 'unavailable',
  sanitizedErrorCode: 'PROVIDER_UNAVAILABLE',
  instrument: null,
  candles: [],
  barCount: 0,
  historyRange: null,
  cached: false,
  asOf: new Date().toISOString(),
  currency: null,
  pagesFetched: 0,
};

// Phase 3GJ-HF1 spec section 5: the same shape as failResult but with the finer-grained sanitized
// code a rate-limited transport call now surfaces (see universalOhlcvProvider.ts's
// mapTransportErrorToSanitizedOhlcvCode), so orchestration tests can tell rate-limit apart from
// generic unavailability.
const rateLimitedFailResult: LongHistoryOhlcvResult = {
  ...failResult,
  sanitizedErrorCode: 'PROVIDER_RATE_LIMITED',
};

const FIXED_NOW_MS = Date.UTC(2026, 6, 25); // 2026-07-25 -- one calendar day after the fake asOf below.
const FAKE_ASOF = '20260724';
const fakeCloses = Array.from({ length: 90 }, (_, i) => 100 + i);
const fakeInstrument = { symbol: 'FAKE', country: 'KR', providerSymbol: 'FAKE' } as unknown as ReturnType<
  typeof import('../src/lib/server/chart-ai/universal-instrument-search.mjs').findUniversalInstrument
>;

// 1. Invalid period -> VALIDATION_FAILED, both id and period nulled out.
{
  const result = await getMarketDashboard(
    { universeId: 'kospi200', period: 'bogus' },
    { fetchLongHistoryOhlcv: async () => okResult(fakeCloses, FAKE_ASOF), findUniversalInstrument: () => fakeInstrument, now: () => FIXED_NOW_MS },
  );
  check('getMarketDashboard: invalid period -> ok false', result.ok === false);
  check('getMarketDashboard: invalid period -> VALIDATION_FAILED', result.sanitizedErrorCode === 'VALIDATION_FAILED');
  check('getMarketDashboard: invalid period -> universeId nulled', result.universeId === null);
  check('getMarketDashboard: invalid period -> period nulled', result.period === null);
}

// 2. Invalid universeId (valid period) -> VALIDATION_FAILED, universeId nulled but period preserved.
{
  const result = await getMarketDashboard(
    { universeId: 'my-portfolio', period: '1d' },
    { fetchLongHistoryOhlcv: async () => okResult(fakeCloses, FAKE_ASOF), findUniversalInstrument: () => fakeInstrument, now: () => FIXED_NOW_MS },
  );
  check('getMarketDashboard: client cannot request the private my-portfolio universe', result.ok === false);
  check('getMarketDashboard: unknown universe -> VALIDATION_FAILED', result.sanitizedErrorCode === 'VALIDATION_FAILED');
  check('getMarketDashboard: unknown universe -> universeId nulled', result.universeId === null);
  check('getMarketDashboard: unknown universe -> period preserved for logging context', result.period === '1d');
}

// 3. All 12 constituents resolve successfully -> ok, full coverage, freshness 'fresh'.
{
  const result = await getMarketDashboard(
    { universeId: 'kospi200', period: '1m' },
    { fetchLongHistoryOhlcv: async () => okResult(fakeCloses, FAKE_ASOF), findUniversalInstrument: () => fakeInstrument, now: () => FIXED_NOW_MS },
  );
  check('getMarketDashboard: full success -> ok true', result.ok === true);
  check('getMarketDashboard: full success -> all 12 constituents present', result.constituents.length === 12);
  check('getMarketDashboard: full success -> sanitizedErrorCode NONE', result.sanitizedErrorCode === 'NONE');
  check('getMarketDashboard: full success -> freshness fresh at full coverage', result.freshness === 'fresh');
  check('getMarketDashboard: full success -> sector summaries built', result.sectors.length > 0);
  check('getMarketDashboard: full success -> breadth successfulCount matches', result.breadth?.successfulCount === 12);
  check(
    'getMarketDashboard: full success -> benchmarkProxy carried from the registry, not fabricated',
    result.benchmarkProxy?.symbol === '069500',
  );
}

// 4. Below the minimum-render threshold (successes > 0 but insufficient) -> MARKET_DATA_PARTIAL_BELOW_THRESHOLD.
{
  let call = 0;
  const result = await getMarketDashboard(
    { universeId: 'kospi200', period: '1d' },
    {
      fetchLongHistoryOhlcv: async () => {
        call += 1;
        return call <= 3 ? okResult(fakeCloses, FAKE_ASOF) : failResult;
      },
      findUniversalInstrument: () => fakeInstrument,
      now: () => FIXED_NOW_MS,
    },
  );
  check('getMarketDashboard: partial coverage -> ok false (honest, never renders a partial as full)', result.ok === false);
  check(
    'getMarketDashboard: partial coverage -> MARKET_DATA_PARTIAL_BELOW_THRESHOLD',
    result.sanitizedErrorCode === 'MARKET_DATA_PARTIAL_BELOW_THRESHOLD',
  );
}

// 5. Every constituent fails -> MARKET_DATA_UNAVAILABLE (distinct from the partial code above).
{
  const result = await getMarketDashboard(
    { universeId: 'kospi200', period: '1d' },
    { fetchLongHistoryOhlcv: async () => failResult, findUniversalInstrument: () => fakeInstrument, now: () => FIXED_NOW_MS },
  );
  check('getMarketDashboard: total failure -> ok false', result.ok === false);
  check('getMarketDashboard: total failure -> MARKET_DATA_UNAVAILABLE', result.sanitizedErrorCode === 'MARKET_DATA_UNAVAILABLE');
}

// 6. Unresolved instrument for one constituent -> that constituent is skipped (status 'unresolved'),
//    the rest still render -- a single bad symbol never takes down the whole universe.
{
  let call = 0;
  const result = await getMarketDashboard(
    { universeId: 'kospi200', period: '1d' },
    {
      fetchLongHistoryOhlcv: async () => okResult(fakeCloses, FAKE_ASOF),
      findUniversalInstrument: () => {
        call += 1;
        return call === 1 ? null : fakeInstrument;
      },
      now: () => FIXED_NOW_MS,
    },
  );
  check('getMarketDashboard: ok despite one unresolved constituent', result.ok === true);
  check(
    'getMarketDashboard: unresolved constituent marked unresolved, not silently dropped',
    result.constituents.some((c) => c.status === 'unresolved'),
  );
  check(
    'getMarketDashboard: unresolved constituent never carries fabricated metrics',
    result.constituents.find((c) => c.status === 'unresolved')?.periodReturnPct === null,
  );
}

// 7. Concurrency cap: no more than 3 provider/cache resolutions in flight at once (spec section 10).
{
  let inFlight = 0;
  let maxInFlight = 0;
  const fetchWithConcurrencyTracking = async () => {
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((resolve) => setTimeout(resolve, 5));
    inFlight -= 1;
    return okResult(fakeCloses, FAKE_ASOF);
  };
  await getMarketDashboard(
    { universeId: 'kospi200', period: '1d' },
    { fetchLongHistoryOhlcv: fetchWithConcurrencyTracking, findUniversalInstrument: () => fakeInstrument, now: () => FIXED_NOW_MS },
  );
  check('getMarketDashboard: never exceeds the 3-concurrent-resolution cap', maxInFlight <= 3);
  check('getMarketDashboard: concurrency is actually used (not fully serial)', maxInFlight > 1);
}

// 8. Stale-but-usable classification: last candle older than 4 calendar days from `now`.
{
  const result = await getMarketDashboard(
    { universeId: 'kospi200', period: '1d' },
    {
      fetchLongHistoryOhlcv: async () => okResult(fakeCloses, '20260101'),
      findUniversalInstrument: () => fakeInstrument,
      now: () => Date.UTC(2026, 6, 25),
    },
  );
  check('getMarketDashboard: stale-but-usable when the latest candle is more than 4 days old', result.freshness === 'stale-but-usable');
}

// 9. Every constituent's transport fails specifically with PROVIDER_RATE_LIMITED -> the aggregate
//    code is PROVIDER_RATE_LIMITED, not the generic MARKET_DATA_UNAVAILABLE (spec section 5).
{
  const result = await getMarketDashboard(
    { universeId: 'kospi200', period: '1d' },
    { fetchLongHistoryOhlcv: async () => rateLimitedFailResult, findUniversalInstrument: () => fakeInstrument, now: () => FIXED_NOW_MS },
  );
  check('getMarketDashboard: all failures rate-limited -> ok false', result.ok === false);
  check(
    'getMarketDashboard: all failures rate-limited -> PROVIDER_RATE_LIMITED (honest, not generic unavailable)',
    result.sanitizedErrorCode === 'PROVIDER_RATE_LIMITED',
  );
}

// 10. Mixed failure causes (some rate-limited, some generically unavailable) -> stays the generic
//     MARKET_DATA_UNAVAILABLE code -- only an ALL-rate-limited failure set may claim rate-limited.
{
  let call = 0;
  const result = await getMarketDashboard(
    { universeId: 'kospi200', period: '1d' },
    {
      fetchLongHistoryOhlcv: async () => {
        call += 1;
        return call === 1 ? rateLimitedFailResult : failResult;
      },
      findUniversalInstrument: () => fakeInstrument,
      now: () => FIXED_NOW_MS,
    },
  );
  check(
    'getMarketDashboard: mixed failure causes -> generic MARKET_DATA_UNAVAILABLE, not rate-limited',
    result.sanitizedErrorCode === 'MARKET_DATA_UNAVAILABLE',
  );
}

// 11. Transport succeeds for every constituent but history is too short for the selected period's
//     offset -> every constituent is 'insufficient-history', none count toward successfulCount, and
//     the below-threshold branch fires exactly as it would for a transport failure (spec section 6).
{
  const shortCloses = Array.from({ length: 10 }, (_, i) => 100 + i);
  const result = await getMarketDashboard(
    { universeId: 'kospi200', period: '1m' },
    { fetchLongHistoryOhlcv: async () => okResult(shortCloses, FAKE_ASOF), findUniversalInstrument: () => fakeInstrument, now: () => FIXED_NOW_MS },
  );
  check('getMarketDashboard: transport ok but history too short for the period -> ok false', result.ok === false);
  check(
    'getMarketDashboard: all-insufficient-history -> MARKET_DATA_UNAVAILABLE (zero valid constituents)',
    result.sanitizedErrorCode === 'MARKET_DATA_UNAVAILABLE',
  );
  check(
    'getMarketDashboard: insufficient-history constituents are never silently reported as ok',
    result.constituents.every((c) => c.status === 'insufficient-history'),
  );
}

// 12. A mix of real 'ok' constituents and 'insufficient-history' ones -- only the 'ok' subset counts
//     toward successfulCount, so a universe with too few valid returns hits the partial-below-threshold
//     gate even though every transport call reported success.
{
  let call = 0;
  const tooShortForOneMonth = Array.from({ length: 5 }, (_, i) => 100 + i);
  const result = await getMarketDashboard(
    { universeId: 'kospi200', period: '1m' },
    {
      fetchLongHistoryOhlcv: async () => {
        call += 1;
        return call <= 3 ? okResult(fakeCloses, FAKE_ASOF) : okResult(tooShortForOneMonth, FAKE_ASOF);
      },
      findUniversalInstrument: () => fakeInstrument,
      now: () => FIXED_NOW_MS,
    },
  );
  check('getMarketDashboard: insufficient-history constituents never inflate successfulCount -> ok false', result.ok === false);
  check(
    'getMarketDashboard: 3 valid of 12 -> MARKET_DATA_PARTIAL_BELOW_THRESHOLD',
    result.sanitizedErrorCode === 'MARKET_DATA_PARTIAL_BELOW_THRESHOLD',
  );
}

// 13. All valid constituents come from cache (not stale) -> overall freshness is 'cached', reachable
//     now that cachedCount is threaded through (spec section 7) -- cached data is never labeled fresh.
{
  const result = await getMarketDashboard(
    { universeId: 'kospi200', period: '1m' },
    { fetchLongHistoryOhlcv: async () => okResult(fakeCloses, FAKE_ASOF, true), findUniversalInstrument: () => fakeInstrument, now: () => FIXED_NOW_MS },
  );
  check('getMarketDashboard: full success, all cached, none stale -> ok true', result.ok === true);
  check('getMarketDashboard: full success, all cached, none stale -> freshness cached, never fresh', result.freshness === 'cached');
}

// 14. A mix of fresh and cached (no stale) valid constituents -> overall freshness must still be
//     'cached', not 'fresh' -- any cached member disqualifies the fresh label.
{
  let call = 0;
  const result = await getMarketDashboard(
    { universeId: 'kospi200', period: '1m' },
    {
      fetchLongHistoryOhlcv: async () => {
        call += 1;
        return okResult(fakeCloses, FAKE_ASOF, call % 2 === 0);
      },
      findUniversalInstrument: () => fakeInstrument,
      now: () => FIXED_NOW_MS,
    },
  );
  check('getMarketDashboard: mixed fresh/cached, none stale -> freshness cached, never mislabeled fresh', result.freshness === 'cached');
}

// 15. commonAsOf resolves to the earliest (minimum) as-of date across valid constituents only --
//     never the latest/maximum date (spec section 8's renamed, corrected common-data-basis field).
{
  let call = 0;
  const asOfDates = ['20260701', '20260710', '20260715'];
  const result = await getMarketDashboard(
    { universeId: 'kospi200', period: '1m' },
    {
      fetchLongHistoryOhlcv: async () => {
        const asOf = asOfDates[call % asOfDates.length];
        call += 1;
        return okResult(fakeCloses, asOf);
      },
      findUniversalInstrument: () => fakeInstrument,
      now: () => FIXED_NOW_MS,
    },
  );
  check('getMarketDashboard: commonAsOf uses the earliest valid-constituent date, not the latest', result.breadth?.commonAsOf === '20260701');
}

// 16. Partial coverage (successfulCount < requestedCount) with some stale valid members -> overall
//     freshness stays 'partial', never 'stale-but-usable' -- partial coverage outranks staleness in
//     the corrected precedence (spec section 7).
{
  let call = 0;
  const result = await getMarketDashboard(
    { universeId: 'kospi200', period: '1d' },
    {
      fetchLongHistoryOhlcv: async () => {
        call += 1;
        return call <= 6 ? okResult(fakeCloses, '20260101') : failResult;
      },
      findUniversalInstrument: () => fakeInstrument,
      now: () => FIXED_NOW_MS,
    },
  );
  check('getMarketDashboard: 6 of 12 valid (all stale) still meets the render threshold -> ok true', result.ok === true);
  check(
    'getMarketDashboard: partial coverage outranks stale-but-usable in the precedence order',
    result.freshness === 'partial',
  );
}

// =====================================================================================
// Group 7: marketDashboard.ts -- overview (four validated benchmark proxies only)
// =====================================================================================

// 17. Invalid period -> VALIDATION_FAILED, no proxies returned.
{
  const result = await getMarketOverview(
    { period: 'bogus' },
    { fetchLongHistoryOhlcv: async () => okResult(fakeCloses, FAKE_ASOF), findUniversalInstrument: () => fakeInstrument, now: () => FIXED_NOW_MS },
  );
  check('getMarketOverview: invalid period -> ok false', result.ok === false);
  check('getMarketOverview: invalid period -> VALIDATION_FAILED', result.sanitizedErrorCode === 'VALIDATION_FAILED');
  check('getMarketOverview: invalid period -> zero proxies', result.proxies.length === 0);
}

// 18. Default period (omitted) defaults to 1d and resolves exactly the four benchmark proxies.
{
  const requestedSymbols: string[] = [];
  const result = await getMarketOverview(
    {},
    {
      fetchLongHistoryOhlcv: async () => okResult(fakeCloses, FAKE_ASOF),
      findUniversalInstrument: (symbol: string) => {
        requestedSymbols.push(symbol);
        return fakeInstrument;
      },
      now: () => FIXED_NOW_MS,
    },
  );
  check('getMarketOverview: defaults to the 1d period when omitted', result.period === '1d');
  check('getMarketOverview: ok true with all proxies resolved', result.ok === true);
  check('getMarketOverview: exactly the four tracked universes represented', result.proxies.length === 4);
  check(
    'getMarketOverview: resolves only the four known benchmark-proxy symbols, never a client-supplied symbol',
    requestedSymbols.sort().join(',') === '069500,229200,QQQ,SPY',
  );
  check(
    'getMarketOverview: each proxy is explicitly labeled, never presented as the exact index',
    result.proxies.every((p) => typeof p.proxy.label === 'string' && p.proxy.label.length > 0),
  );
}

// 19. All four proxies fail -> MARKET_DATA_UNAVAILABLE, but proxies array (with unavailable statuses)
//     is still returned for honest per-proxy UI messaging.
{
  const result = await getMarketOverview(
    { period: '1d' },
    { fetchLongHistoryOhlcv: async () => failResult, findUniversalInstrument: () => fakeInstrument, now: () => FIXED_NOW_MS },
  );
  check('getMarketOverview: total failure -> ok false', result.ok === false);
  check('getMarketOverview: total failure -> MARKET_DATA_UNAVAILABLE', result.sanitizedErrorCode === 'MARKET_DATA_UNAVAILABLE');
  check('getMarketOverview: total failure -> proxies array still present for per-card unavailable state', result.proxies.length === 4);
  check('getMarketOverview: total failure -> every proxy marked unavailable, none fabricated', result.proxies.every((p) => p.status === 'unavailable'));
}

// 20. All four proxies fail specifically with PROVIDER_RATE_LIMITED -> the aggregate code is
//     PROVIDER_RATE_LIMITED, mirroring the dashboard-level aggregation (spec section 5).
{
  const result = await getMarketOverview(
    { period: '1d' },
    { fetchLongHistoryOhlcv: async () => rateLimitedFailResult, findUniversalInstrument: () => fakeInstrument, now: () => FIXED_NOW_MS },
  );
  check('getMarketOverview: all proxies rate-limited -> ok false', result.ok === false);
  check(
    'getMarketOverview: all proxies rate-limited -> PROVIDER_RATE_LIMITED (honest, not generic unavailable)',
    result.sanitizedErrorCode === 'PROVIDER_RATE_LIMITED',
  );
}

// 21. A rate-limited proxy carries its providerErrorCode through to the per-proxy result, so the
//     client can render an honest per-card rate-limited message instead of a generic failure.
{
  const result = await getMarketOverview(
    { period: '1d' },
    { fetchLongHistoryOhlcv: async () => rateLimitedFailResult, findUniversalInstrument: () => fakeInstrument, now: () => FIXED_NOW_MS },
  );
  check(
    'getMarketOverview: rate-limited proxies carry providerErrorCode for per-card messaging',
    result.proxies.every((p) => p.providerErrorCode === 'PROVIDER_RATE_LIMITED'),
  );
}

export const runAll = async (): Promise<number> => {
  console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  return failed === 0 ? 0 : 1;
};
