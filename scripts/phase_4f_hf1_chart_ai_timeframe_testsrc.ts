/**
 * Phase 4F-HF1 (CHART-05) test source (bundled + run by
 * scripts/smoke_phase_4f_hf1_functional_high.mjs via esbuild).
 *
 * Exercises the real fetchUniversalOhlcv bounded backward-paging loop in
 * src/lib/server/chart-ai/universalOhlcvProvider.ts with injected fetchDomesticPage /
 * fetchOverseasPage / now dependencies -- no network, no credentials, no env reads. The existing
 * Phase 3GJ market-dashboard test suite already proves this same import chain (through
 * marketDashboard.ts -> universalOhlcvProvider.ts -> kisClient.ts) bundles and runs safely in this
 * harness, so this file imports fetchUniversalOhlcv directly rather than hand-mirroring its logic.
 */

import { fetchUniversalOhlcv } from '../src/lib/server/chart-ai/universalOhlcvProvider';
import type { NormalizedInstrument } from '../src/lib/market-data/instrument';

let passed = 0;
let failed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

// =====================================================================================
// Fixtures
// =====================================================================================

const makeKrInstrument = (symbol: string): NormalizedInstrument => ({
  symbol,
  displayName: '삼성전자',
  englishName: 'Samsung Electronics',
  country: 'KR',
  exchange: 'KOSPI',
  market: 'KOSPI',
  assetType: 'stock',
  currency: 'KRW',
  provider: 'kis-domestic',
  providerSymbol: symbol,
  exchangeCode: null,
  searchKeywords: [symbol, 'samsung', '삼성전자'],
  isActive: true,
});

// fetchUniversalOhlcv shares one module-level, process-lifetime normalized-OHLCV cache keyed by
// country+symbol+range (see normalizedOhlcvCache in universalOhlcvProvider.ts). Every independent
// KR/1y scenario below therefore needs its OWN symbol -- otherwise a later scenario's fake provider
// is never actually invoked because the earlier scenario's cached "ok" result is served instead.
const KR_INSTRUMENT = makeKrInstrument('005930');

const US_INSTRUMENT: NormalizedInstrument = {
  symbol: 'AAPL',
  displayName: 'Apple Inc.',
  englishName: 'Apple Inc.',
  country: 'US',
  exchange: 'NASDAQ',
  market: 'NASDAQ',
  assetType: 'stock',
  currency: 'USD',
  provider: 'kis-overseas',
  providerSymbol: 'AAPL',
  exchangeCode: 'NAS',
  searchKeywords: ['aapl', 'apple'],
  isActive: true,
};

// A fixed Wednesday so weekday math is deterministic across runs.
const FIXED_NOW_MS = Date.UTC(2025, 5, 25, 3, 0, 0); // 2025-06-25T03:00:00.000Z

const DAY_MS = 24 * 60 * 60 * 1000;

const yyyymmdd = (d: Date): string =>
  `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;

const parseYyyymmdd = (value: string): Date =>
  new Date(Date.UTC(Number(value.slice(0, 4)), Number(value.slice(4, 6)) - 1, Number(value.slice(6, 8))));

const isBusinessDay = (d: Date): boolean => {
  const day = d.getUTCDay();
  return day !== 0 && day !== 6;
};

const makePoint = (d: Date) => {
  const close = 1000 + (Math.floor(d.getTime() / DAY_MS) % 50);
  return { dateTime: yyyymmdd(d), open: close, high: close + 1, low: close - 1, close, volume: 1000 };
};

type FakeResult =
  | { ok: true; data: { symbol: string; points: ReturnType<typeof makePoint>[] } }
  | { ok: false; code: string; message: string };

/**
 * Fake KR transport modeling the real KIS constraint: regardless of how wide the requested
 * [FID_INPUT_DATE_1, FID_INPUT_DATE_2] window is, at most `maxRowsPerCall` business-day rows come
 * back (the most recent ones within the window) -- this is precisely why a single page silently
 * truncated wide (6m/1y) requests before the HIGH-01 fix. `earliestAvailable`, when set, models a
 * newly-listed security with genuinely short history.
 */
const makeFakeDomesticPage = (opts: { maxRowsPerCall?: number; earliestAvailable?: Date | null } = {}) => {
  const maxRowsPerCall = opts.maxRowsPerCall ?? 100;
  const earliestAvailable = opts.earliestAvailable ?? null;
  let calls = 0;
  const fn = async (input: { symbol: string; query: Record<string, string> }): Promise<FakeResult> => {
    calls += 1;
    const requestedStart = parseYyyymmdd(input.query.FID_INPUT_DATE_1);
    const end = parseYyyymmdd(input.query.FID_INPUT_DATE_2);
    const start = earliestAvailable && earliestAvailable.getTime() > requestedStart.getTime() ? earliestAvailable : requestedStart;
    if (start.getTime() > end.getTime()) return { ok: true, data: { symbol: input.symbol, points: [] } };
    const days: Date[] = [];
    const cur = new Date(start.getTime());
    while (cur.getTime() <= end.getTime()) {
      if (isBusinessDay(cur)) days.push(new Date(cur.getTime()));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    const capped = days.slice(Math.max(0, days.length - maxRowsPerCall));
    return { ok: true, data: { symbol: input.symbol, points: capped.map(makePoint) } };
  };
  return { fn, callCount: () => calls };
};

/** Fake US transport modeling the real BYMD-cursor page: up to maxRowsPerCall business days ending at bymd (or now). */
const makeFakeOverseasPage = (opts: { maxRowsPerCall?: number; earliestAvailable?: Date | null } = {}) => {
  const maxRowsPerCall = opts.maxRowsPerCall ?? 100;
  const earliestAvailable = opts.earliestAvailable ?? null;
  let calls = 0;
  const fn = async (input: { symbol: string; exchangeCode: string; bymd?: string }): Promise<FakeResult> => {
    calls += 1;
    const end = input.bymd ? parseYyyymmdd(input.bymd) : new Date(FIXED_NOW_MS);
    if (earliestAvailable && end.getTime() < earliestAvailable.getTime()) {
      return { ok: true, data: { symbol: input.symbol, points: [] } };
    }
    const days: Date[] = [];
    const cur = new Date(end.getTime());
    while (days.length < maxRowsPerCall) {
      if (earliestAvailable && cur.getTime() < earliestAvailable.getTime()) break;
      if (isBusinessDay(cur)) days.push(new Date(cur.getTime()));
      cur.setUTCDate(cur.getUTCDate() - 1);
    }
    days.reverse();
    return { ok: true, data: { symbol: input.symbol, points: days.map(makePoint) } };
  };
  return { fn, callCount: () => calls };
};

const failingPage = (code: string) => async () => ({ ok: false as const, code, message: 'synthetic failure' });

const isAscending = (candles: { timestamp: string }[]): boolean =>
  candles.every((c, i) => i === 0 || candles[i - 1].timestamp < c.timestamp);

// =====================================================================================
// Group 1: KR bounded backward paging reaches materially complete coverage
// =====================================================================================

export const runAll = async (): Promise<number> => {
  {
    const page = makeFakeDomesticPage({ maxRowsPerCall: 100 });
    const result = await fetchUniversalOhlcv(
      { instrument: KR_INSTRUMENT, range: '1y' },
      { now: () => FIXED_NOW_MS, fetchDomesticPage: page.fn as never },
    );
    check('KR 1y: sourceStatus ok', result.sourceStatus === 'ok');
    check('KR 1y: multi-page paging occurred', page.callCount() > 1);
    check('KR 1y: bounded by CHART_RANGE_MAX_PAGES', page.callCount() <= 4);
    check('KR 1y: coverage.complete true', result.coverage.complete === true);
    check(
      'KR 1y: candleCount within representative 1y target (240-260)',
      result.candleCount >= 240 && result.candleCount <= 260,
    );
    check('KR 1y: candles ascending, no gaps in ordering', isAscending(result.candles));
    check(
      'KR 1y: candleCount matches candles.length',
      result.candleCount === result.candles.length && result.coverage.candleCount === result.candles.length,
    );
  }

  {
    const page = makeFakeDomesticPage({ maxRowsPerCall: 100 });
    const result = await fetchUniversalOhlcv(
      { instrument: KR_INSTRUMENT, range: '6m' },
      { now: () => FIXED_NOW_MS, fetchDomesticPage: page.fn as never },
    );
    check('KR 6m: sourceStatus ok', result.sourceStatus === 'ok');
    check('KR 6m: coverage.complete true', result.coverage.complete === true);
    check(
      'KR 6m: candleCount within representative 6m target (120-130)',
      result.candleCount >= 120 && result.candleCount <= 130,
    );
  }

  {
    const page = makeFakeDomesticPage({ maxRowsPerCall: 100 });
    const result = await fetchUniversalOhlcv(
      { instrument: KR_INSTRUMENT, range: '3m' },
      { now: () => FIXED_NOW_MS, fetchDomesticPage: page.fn as never },
    );
    check('KR 3m: single page suffices (no unnecessary paging)', page.callCount() === 1);
    check('KR 3m: coverage.complete true', result.coverage.complete === true);
    check(
      'KR 3m: candleCount within representative 3m target (60-66)',
      result.candleCount >= 60 && result.candleCount <= 66,
    );
  }

  {
    const page = makeFakeDomesticPage({ maxRowsPerCall: 100 });
    const result = await fetchUniversalOhlcv(
      { instrument: KR_INSTRUMENT, range: '1m' },
      { now: () => FIXED_NOW_MS, fetchDomesticPage: page.fn as never },
    );
    check('KR 1m: single page suffices', page.callCount() === 1);
    check('KR 1m: coverage.complete true', result.coverage.complete === true);
  }

  // =====================================================================================
  // Group 2: US BYMD-cursor bounded backward paging
  // =====================================================================================

  {
    const page = makeFakeOverseasPage({ maxRowsPerCall: 100 });
    const result = await fetchUniversalOhlcv(
      { instrument: US_INSTRUMENT, range: '1y' },
      { now: () => FIXED_NOW_MS, fetchOverseasPage: page.fn as never },
    );
    check('US 1y: sourceStatus ok', result.sourceStatus === 'ok');
    check('US 1y: multi-page BYMD paging occurred', page.callCount() > 1);
    check('US 1y: bounded by CHART_RANGE_MAX_PAGES', page.callCount() <= 4);
    check('US 1y: coverage.complete true', result.coverage.complete === true);
    check(
      'US 1y: candleCount within representative 1y target (240-260)',
      result.candleCount >= 240 && result.candleCount <= 260,
    );
    check('US 1y: candles ascending, deduped', isAscending(result.candles));
  }

  {
    const page = makeFakeOverseasPage({ maxRowsPerCall: 100 });
    const result = await fetchUniversalOhlcv(
      { instrument: US_INSTRUMENT, range: '3m' },
      { now: () => FIXED_NOW_MS, fetchOverseasPage: page.fn as never },
    );
    check('US 3m: single page suffices', page.callCount() === 1);
    check('US 3m: coverage.complete true', result.coverage.complete === true);
  }

  // =====================================================================================
  // Group 3: coverage.complete === false is an honest, non-error outcome (newly-listed security)
  // =====================================================================================

  {
    const earliestAvailable = new Date(FIXED_NOW_MS - 60 * DAY_MS);
    const page = makeFakeDomesticPage({ maxRowsPerCall: 100, earliestAvailable });
    const result = await fetchUniversalOhlcv(
      { instrument: makeKrInstrument('005931'), range: '1y' },
      { now: () => FIXED_NOW_MS, fetchDomesticPage: page.fn as never },
    );
    check('KR newly-listed 1y: sourceStatus stays ok (not an error)', result.sourceStatus === 'ok');
    check('KR newly-listed 1y: sanitizedErrorCode NONE', result.sanitizedErrorCode === 'NONE');
    check('KR newly-listed 1y: coverage.complete false', result.coverage.complete === false);
    check('KR newly-listed 1y: candles non-empty', result.candles.length > 0);
    check(
      'KR newly-listed 1y: actualStartDate reflects the listing floor, not the requested start',
      result.coverage.actualStartDate !== null &&
        new Date(result.coverage.actualStartDate).getTime() >= earliestAvailable.getTime() - DAY_MS,
    );
  }

  // =====================================================================================
  // Group 4: bounded stopping at CHART_RANGE_MAX_PAGES even with unlimited upstream history
  // =====================================================================================

  {
    // A stingy provider (20 rows/call, ~28 calendar days progress per page) cannot reach the ~1y
    // tolerance window within 4 pages -- the loop must stop at the page-count bound, not spin.
    const page = makeFakeDomesticPage({ maxRowsPerCall: 20 });
    const result = await fetchUniversalOhlcv(
      { instrument: makeKrInstrument('005932'), range: '1y' },
      { now: () => FIXED_NOW_MS, fetchDomesticPage: page.fn as never },
    );
    check('KR stingy provider: stops at exactly CHART_RANGE_MAX_PAGES', page.callCount() === 4);
    check('KR stingy provider: sourceStatus stays ok (partial data, not an error)', result.sourceStatus === 'ok');
    check('KR stingy provider: coverage.complete false', result.coverage.complete === false);
  }

  // =====================================================================================
  // Group 5: first-page provider failure -> sanitized unavailable, honest empty coverage
  // =====================================================================================

  {
    const result = await fetchUniversalOhlcv(
      { instrument: makeKrInstrument('005933'), range: '1y' },
      { now: () => FIXED_NOW_MS, fetchDomesticPage: failingPage('PROVIDER_UNAVAILABLE') as never },
    );
    check('KR first-page failure: sourceStatus unavailable', result.sourceStatus === 'unavailable');
    check('KR first-page failure: sanitizedErrorCode PROVIDER_UNAVAILABLE', result.sanitizedErrorCode === 'PROVIDER_UNAVAILABLE');
    check('KR first-page failure: candles empty', result.candles.length === 0);
    check('KR first-page failure: coverage.complete false', result.coverage.complete === false);
    check('KR first-page failure: coverage.actualStartDate null', result.coverage.actualStartDate === null);
  }

  {
    const result = await fetchUniversalOhlcv(
      { instrument: US_INSTRUMENT, range: '6m' },
      { now: () => FIXED_NOW_MS, fetchOverseasPage: failingPage('PROVIDER_RATE_LIMITED') as never },
    );
    check('US first-page rate-limit: sourceStatus unavailable', result.sourceStatus === 'unavailable');
    check(
      'US first-page rate-limit: sanitizedErrorCode preserves PROVIDER_RATE_LIMITED',
      result.sanitizedErrorCode === 'PROVIDER_RATE_LIMITED',
    );
  }

  // =====================================================================================
  // Group 6: sanitized OHLCV contract never leaks raw provider fields
  // =====================================================================================

  {
    const page = makeFakeDomesticPage({ maxRowsPerCall: 100 });
    const result = await fetchUniversalOhlcv(
      { instrument: KR_INSTRUMENT, range: '1y' },
      { now: () => FIXED_NOW_MS, fetchDomesticPage: page.fn as never },
    );
    const serialized = JSON.stringify(result);
    check('KR 1y: no secret-shaped fields in response', !/access_token|authorization|Bearer|password/i.test(serialized));
  }

  console.log(`\nphase_4f_hf1_chart_ai_timeframe_testsrc: ${passed} passed, ${failed} failed`);
  return failed === 0 ? 0 : 1;
};
