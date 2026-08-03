/**
 * Phase 3GL test source (bundled + run by scripts/smoke_phase_3gl_home_live_data.mjs via esbuild).
 *
 * Exercises the shared Home live-market orchestrator in
 * src/lib/server/homeLiveMarket/homeLiveMarket.ts (with injected fetchLongHistoryOhlcv /
 * findUniversalInstrument / fetchUsdKrwContext / now dependencies -- no network, no env reads) and the
 * pure GNews normalize/dedupe/classify/cache contract in
 * src/lib/server/homeNews/gnewsHomeNewsProvider.mjs (with an injected fetchFn / now -- no real network
 * call to gnews.io, no env reads, the API key is always a fake literal never printed).
 */

import { getHomeLiveMarket } from '../src/lib/server/homeLiveMarket/homeLiveMarket';
import type { LongHistoryOhlcvResult } from '../src/lib/server/chart-ai/universalOhlcvProvider';
import type { ProviderResult, QuoteSnapshot } from '../src/lib/server/providers/types';
import { normalizeKisQuoteSign } from '../src/lib/server/providers/kis/kisQuoteSignNormalization';
import {
  getHomeNewsFeed,
  normalizeGnewsHomeArticle,
  dedupeAndRankHomeArticles,
  HOME_NEWS_CATEGORIES,
} from '../src/lib/server/homeNews/gnewsHomeNewsProvider.mjs';

let passed = 0;
let failed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

// =====================================================================================
// Group 1: homeLiveMarket.ts -- registry shape, resolution, degradation, snapshot subset
// =====================================================================================

type FakeCandle = { close: number };

const FIXED_NOW_MS = Date.UTC(2026, 6, 25);
const FAKE_ASOF = '20260724';
const fakeCloses = Array.from({ length: 10 }, (_, i) => 100 + i);
const fakeInstrument = { symbol: 'FAKE', country: 'KR', providerSymbol: 'FAKE' } as unknown as ReturnType<
  typeof import('../src/lib/server/chart-ai/universal-instrument-search.mjs').findUniversalInstrument
>;

const okOhlcvResult = (closes: number[], asOfYyyymmdd: string): LongHistoryOhlcvResult => ({
  ok: true,
  sourceStatus: 'ok',
  sanitizedErrorCode: 'NONE',
  instrument: null,
  candles: closes.map((close): FakeCandle => ({ close })) as unknown as LongHistoryOhlcvResult['candles'],
  barCount: closes.length,
  historyRange: { start: '20260101', end: asOfYyyymmdd },
  cached: false,
  asOf: new Date().toISOString(),
  currency: null,
  pagesFetched: 1,
});

const failOhlcvResult: LongHistoryOhlcvResult = {
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

const okFx = {
  available: true,
  source: 'frankfurter-ecb',
  rate: 1345.67,
  changePct: 1.23,
  asOf: '2026-07-24',
  isDelayed: true,
  sanitizedErrorCode: 'NONE',
};

const unavailableFx = {
  available: false,
  source: 'frankfurter-ecb',
  rate: null,
  changePct: null,
  asOf: null,
  isDelayed: true,
  sanitizedErrorCode: 'NOT_SOURCED',
};

// Phase 3GL-HF3 §7 fixtures: fetchUsdKrwSparklineSeries is now called independently of
// fetchUsdKrwContext whenever the FX headline resolves -- every fixture below that injects okFx must
// also inject a fake sparkline series so the test never falls through to the real Frankfurter network
// call.
const okFxSparkline = {
  available: true,
  series: Array.from({ length: 20 }, (_, i) => ({ date: `202606${String(i + 1).padStart(2, '0')}`, value: 1330 + i })),
  sanitizedErrorCode: 'NONE',
};

const unavailableFxSparkline = {
  available: false,
  series: [],
  sanitizedErrorCode: 'NOT_SOURCED',
};

// Phase 3GL-HF3 §6 fixtures: dated OHLCV candles for exercising the KIS sparkline builder, which reads
// candle.timestamp (absent from the plain `okOhlcvResult` fixture above, which is why that fixture
// always yields an unavailable sparkline). 25 sequential daily closes so the 20-point cap is
// exercised too.
type DatedFakeCandle = { close: number; timestamp: string };
const DATED_ASOF = '20260725';
const fakeDatedCloses = Array.from({ length: 25 }, (_, i) => ({
  date: `2026-07-${String(i + 1).padStart(2, '0')}`,
  close: 100 + i,
}));

const okOhlcvResultWithDates = (points: Array<{ date: string; close: number }>, asOfYyyymmdd: string): LongHistoryOhlcvResult => ({
  ok: true,
  sourceStatus: 'ok',
  sanitizedErrorCode: 'NONE',
  instrument: null,
  candles: points.map(({ date, close }): DatedFakeCandle => ({ close, timestamp: date })) as unknown as LongHistoryOhlcvResult['candles'],
  barCount: points.length,
  historyRange: { start: points[0]?.date ?? asOfYyyymmdd, end: asOfYyyymmdd },
  cached: false,
  asOf: new Date().toISOString(),
  currency: null,
  pagesFetched: 1,
});

// Phase 3GL-HF1 quote-first fixtures: every existing Group-1 block below forces the quote step to
// fail closed so it deterministically exercises the (pre-existing) OHLCV-fallback path -- the
// dedicated quote-first blocks further down inject a succeeding quote instead. Never the real
// getKisDomesticQuoteSnapshot/getKisOverseasQuoteSnapshot (those would read env/attempt network).
const failingQuoteResult: ProviderResult<QuoteSnapshot> = {
  ok: false,
  code: 'PROVIDER_UNAVAILABLE',
  message: 'test-fixture-quote-unavailable',
};

const okQuoteResult = (price: number, change: number | null, changePct: number | null, asOf: string): ProviderResult<QuoteSnapshot> => ({
  ok: true,
  data: {
    market: 'KR',
    symbol: 'FAKE',
    price,
    currency: 'KRW',
    change,
    changePct,
    marketState: 'open',
    asOf,
    staleState: 'fresh',
  },
});

// 1. All 9 items resolve ok -> ticker has 9 items, snapshot is exactly the 4-item subset.
{
  const result = await getHomeLiveMarket(
    { allowProductionMarketDashboardLiveData: true },
    {
      fetchLongHistoryOhlcv: async () => okOhlcvResult(fakeCloses, FAKE_ASOF),
      findUniversalInstrument: () => fakeInstrument,
      fetchUsdKrwContext: async () => okFx,
      fetchUsdKrwSparklineSeries: async () => okFxSparkline,
      getKisDomesticQuoteSnapshot: async () => failingQuoteResult,
      getKisOverseasQuoteSnapshot: async () => failingQuoteResult,
      now: () => FIXED_NOW_MS,
    },
  );
  check('getHomeLiveMarket: ok true when every item resolves', result.ok === true);
  check('getHomeLiveMarket: ticker has exactly 9 items', result.ticker.length === 9);
  check(
    'getHomeLiveMarket: ticker ids match the closed 9-item registry',
    ['sp500', 'nasdaq100', 'dowjones', 'kospi', 'kosdaq', 'usdkrw', 'dollarindex', 'gold', 'wti'].every((id) =>
      result.ticker.some((item) => item.id === id),
    ),
  );
  check('getHomeLiveMarket: every ticker item resolves ok', result.ticker.every((item) => item.status === 'ok'));
  check('getHomeLiveMarket: snapshot has exactly 9 items (Phase 3GL-HF3 §4)', result.snapshot.length === 9);
  check(
    'getHomeLiveMarket: snapshot is exactly the 9-item registry in the required order (Phase 3GL-HF3 §4)',
    result.snapshot.map((item) => item.id).join(',') === 'kospi,kosdaq,sp500,nasdaq100,dowjones,usdkrw,dollarindex,gold,wti',
  );
  check(
    'getHomeLiveMarket: snapshot items are the same resolved objects as their ticker counterparts (no duplicate fetch)',
    result.snapshot.every((snapshotItem) => {
      const tickerItem = result.ticker.find((item) => item.id === snapshotItem.id);
      return tickerItem !== undefined && tickerItem.price === snapshotItem.price;
    }),
  );
  check(
    'getHomeLiveMarket: usdkrw item takes its price from the FX source, not OHLCV',
    result.ticker.find((item) => item.id === 'usdkrw')?.price === okFx.rate,
  );
  check(
    'getHomeLiveMarket: every item carries a non-empty honest basisLabel (never claims to be the literal index)',
    result.ticker.every((item) => typeof item.basisLabel === 'string' && item.basisLabel.length > 0),
  );
  check(
    'getHomeLiveMarket: quote-fail-forced KIS items carry dataBasis latest_close (OHLCV fallback path)',
    result.ticker.filter((item) => item.id !== 'usdkrw').every((item) => item.dataBasis === 'latest_close'),
  );
  check('getHomeLiveMarket: usdkrw carries dataBasis reference_fx (never a KIS basis)', result.ticker.find((item) => item.id === 'usdkrw')?.dataBasis === 'reference_fx');
  check(
    'getHomeLiveMarket: dataBasis is always one of the 4 closed enum values',
    result.ticker.every((item) => ['current_quote', 'latest_close', 'reference_fx', 'unavailable'].includes(item.dataBasis)),
  );
  check(
    'getHomeLiveMarket: freshness is always one of the 4 closed enum values',
    result.ticker.every((item) => ['fresh', 'cached', 'stale', 'unavailable'].includes(item.freshness)),
  );
  check(
    'getHomeLiveMarket: snapshot uses the exact Snapshot-only display labels, not the ticker belt labels (Phase 3GL-HF3 §4)',
    result.snapshot.map((item) => item.label).join(',') ===
      'KOSPI200,KOSDAQ150,S&P500,NASDAQ100,DOW30,USD/KRW,달러 인덱스,금,WTI 원유',
  );
}

// 2. Every KIS-backed item fails to resolve (instrument not found) but FX still resolves -> partial
//    success: ok true, KIS items individually unavailable, usdkrw still ok, snapshot still carries all
//    4 fixed subset ids (as individually-unavailable cards), never silently dropped from the layout.
{
  const result = await getHomeLiveMarket(
    { allowProductionMarketDashboardLiveData: true },
    {
      fetchLongHistoryOhlcv: async () => okOhlcvResult(fakeCloses, FAKE_ASOF),
      findUniversalInstrument: () => null,
      fetchUsdKrwContext: async () => okFx,
      fetchUsdKrwSparklineSeries: async () => okFxSparkline,
      getKisDomesticQuoteSnapshot: async () => failingQuoteResult,
      getKisOverseasQuoteSnapshot: async () => failingQuoteResult,
      now: () => FIXED_NOW_MS,
    },
  );
  check('getHomeLiveMarket: partial success still returns ok true', result.ok === true);
  check(
    'getHomeLiveMarket: unresolvable KIS items degrade to status unavailable individually (never fail the whole response)',
    result.ticker.filter((item) => item.id !== 'usdkrw').every((item) => item.status === 'unavailable'),
  );
  check(
    'getHomeLiveMarket: unavailable KIS items carry null price/changeAmount/changePct/asOf (never a fabricated value)',
    result.ticker
      .filter((item) => item.id !== 'usdkrw')
      .every((item) => item.price === null && item.changeAmount === null && item.changePct === null && item.asOf === null),
  );
  check('getHomeLiveMarket: usdkrw still resolves ok on its own', result.ticker.find((item) => item.id === 'usdkrw')?.status === 'ok');
  check(
    'getHomeLiveMarket: snapshot still carries all 9 registry ids, unresolvable KIS ones marked unavailable rather than dropped (Phase 3GL-HF3 §4)',
    result.snapshot.length === 9 && result.snapshot.filter((item) => item.id !== 'usdkrw').every((item) => item.status === 'unavailable'),
  );
  check('getHomeLiveMarket: snapshot is exactly the closed 9-item registry (no id outside it)', result.snapshot.every((item) => ['kospi', 'kosdaq', 'sp500', 'nasdaq100', 'dowjones', 'usdkrw', 'dollarindex', 'gold', 'wti'].includes(item.id)));
}

// 3. Every single item fails (KIS unresolvable AND FX unavailable) -> ok false, MARKET_DATA_UNAVAILABLE,
//    empty snapshot, but ticker still lists all 9 as individually unavailable (never an empty ticker).
{
  const result = await getHomeLiveMarket(
    { allowProductionMarketDashboardLiveData: true },
    {
      fetchLongHistoryOhlcv: async () => failOhlcvResult,
      findUniversalInstrument: () => null,
      fetchUsdKrwContext: async () => unavailableFx,
      getKisDomesticQuoteSnapshot: async () => failingQuoteResult,
      getKisOverseasQuoteSnapshot: async () => failingQuoteResult,
      now: () => FIXED_NOW_MS,
    },
  );
  check('getHomeLiveMarket: total failure -> ok false', result.ok === false);
  check('getHomeLiveMarket: total failure -> sanitizedErrorCode MARKET_DATA_UNAVAILABLE', result.sanitizedErrorCode === 'MARKET_DATA_UNAVAILABLE');
  check(
    'getHomeLiveMarket: total failure -> snapshot still stays exactly 9 items, marked unavailable rather than emptied (Phase 3GL-HF3 §4/§9)',
    result.snapshot.length === 9 && result.snapshot.every((item) => item.status === 'unavailable'),
  );
  check('getHomeLiveMarket: total failure -> ticker still lists all 9 items as unavailable', result.ticker.length === 9 && result.ticker.every((item) => item.status === 'unavailable'));
}

// 4. Insufficient history (fewer than 2 valid closes) degrades the KIS item to unavailable, never a
//    fabricated change.
{
  const result = await getHomeLiveMarket(
    { allowProductionMarketDashboardLiveData: true },
    {
      fetchLongHistoryOhlcv: async () => okOhlcvResult([100], FAKE_ASOF),
      findUniversalInstrument: () => fakeInstrument,
      fetchUsdKrwContext: async () => okFx,
      fetchUsdKrwSparklineSeries: async () => okFxSparkline,
      getKisDomesticQuoteSnapshot: async () => failingQuoteResult,
      getKisOverseasQuoteSnapshot: async () => failingQuoteResult,
      now: () => FIXED_NOW_MS,
    },
  );
  check(
    'getHomeLiveMarket: fewer than 2 valid closes -> KIS items degrade to unavailable',
    result.ticker.filter((item) => item.id !== 'usdkrw').every((item) => item.status === 'unavailable'),
  );
}

// 5. Bounded concurrency: never more than 3 concurrent resolutions in flight at once.
{
  let inFlight = 0;
  let maxInFlight = 0;
  const trackedFetch = async () => {
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((resolve) => setTimeout(resolve, 5));
    inFlight -= 1;
    return okOhlcvResult(fakeCloses, FAKE_ASOF);
  };
  await getHomeLiveMarket(
    { allowProductionMarketDashboardLiveData: true },
    {
      fetchLongHistoryOhlcv: trackedFetch,
      findUniversalInstrument: () => fakeInstrument,
      fetchUsdKrwContext: async () => okFx,
      fetchUsdKrwSparklineSeries: async () => okFxSparkline,
      getKisDomesticQuoteSnapshot: async () => failingQuoteResult,
      getKisOverseasQuoteSnapshot: async () => failingQuoteResult,
      now: () => FIXED_NOW_MS,
    },
  );
  check('getHomeLiveMarket: never exceeds the 3-concurrent-resolution cap', maxInFlight <= 3);
  check('getHomeLiveMarket: concurrency is actually used (not fully serial)', maxInFlight > 1);
}

// 6. Quote-first success (Phase 3GL-HF1 §6, revised Phase 3GL-HF3 §6): when the current-price quote
//    call succeeds, the HEADLINE is built from the quote alone -- dataBasis current_quote, freshness
//    fresh, and the quote's own price/change is never overwritten by history. OHLCV is still fetched
//    exactly once per item (Phase 3GL-HF3: now unconditional, since it also feeds the independent
//    sparkline) but that fetch never influences the headline on a quote success.
{
  let ohlcvCalls = 0;
  const result = await getHomeLiveMarket(
    { allowProductionMarketDashboardLiveData: true },
    {
      fetchLongHistoryOhlcv: async () => {
        ohlcvCalls += 1;
        return okOhlcvResult(fakeCloses, FAKE_ASOF);
      },
      findUniversalInstrument: () => fakeInstrument,
      fetchUsdKrwContext: async () => okFx,
      fetchUsdKrwSparklineSeries: async () => okFxSparkline,
      getKisDomesticQuoteSnapshot: async () => okQuoteResult(271000, 3500, 1.31, '2026-07-24T06:00:00Z'),
      getKisOverseasQuoteSnapshot: async () => okQuoteResult(552.4, -1.2, -0.22, '2026-07-24T20:00:00Z'),
      now: () => FIXED_NOW_MS,
    },
  );
  check(
    'getHomeLiveMarket: quote success -> all KIS items resolve ok with dataBasis current_quote',
    result.ticker.filter((item) => item.id !== 'usdkrw').every((item) => item.status === 'ok' && item.dataBasis === 'current_quote'),
  );
  check(
    'getHomeLiveMarket: quote success -> freshness fresh',
    result.ticker.filter((item) => item.id !== 'usdkrw').every((item) => item.freshness === 'fresh'),
  );
  const kisItemCountG6 = result.ticker.filter((item) => item.id !== 'usdkrw').length;
  check(
    'getHomeLiveMarket: quote success -> OHLCV is still fetched exactly once per KIS item for the sparkline (Phase 3GL-HF3 §6, never zero, never duplicated)',
    ohlcvCalls === kisItemCountG6,
  );
  const kospiItem = result.ticker.find((item) => item.id === 'kospi');
  check('getHomeLiveMarket: KR quote item takes its price from the domestic quote snapshot', kospiItem?.price === 271000);
  check('getHomeLiveMarket: KR quote item takes its change from the domestic quote snapshot', kospiItem?.changeAmount === 3500);
  const spItem = result.ticker.find((item) => item.id === 'sp500');
  check('getHomeLiveMarket: US quote item takes its price from the overseas quote snapshot', spItem?.price === 552.4);
  check(
    'getHomeLiveMarket: quote-success headline price is never overwritten by the independently-fetched OHLCV history (Phase 3GL-HF3 §6)',
    kospiItem?.price === 271000 && kospiItem?.dataBasis === 'current_quote',
  );
}

// 7. Quote-failure-fallback-once: quote fails for a KIS item -> exactly one OHLCV call for that item
//    (never issued concurrently with the quote call, never retried more than once), dataBasis becomes
//    latest_close.
{
  const ohlcvCallOrder: string[] = [];
  const quoteCallOrder: string[] = [];
  let ohlcvCallCount = 0;
  const result = await getHomeLiveMarket(
    { allowProductionMarketDashboardLiveData: true },
    {
      fetchLongHistoryOhlcv: async () => {
        ohlcvCallCount += 1;
        ohlcvCallOrder.push('ohlcv');
        return okOhlcvResult(fakeCloses, FAKE_ASOF);
      },
      findUniversalInstrument: () => fakeInstrument,
      fetchUsdKrwContext: async () => okFx,
      fetchUsdKrwSparklineSeries: async () => okFxSparkline,
      getKisDomesticQuoteSnapshot: async () => {
        quoteCallOrder.push('quote');
        return failingQuoteResult;
      },
      getKisOverseasQuoteSnapshot: async () => {
        quoteCallOrder.push('quote');
        return failingQuoteResult;
      },
      now: () => FIXED_NOW_MS,
    },
  );
  const kisItemCount = result.ticker.filter((item) => item.id !== 'usdkrw').length;
  check('getHomeLiveMarket: quote failure -> exactly one OHLCV call per KIS item (never retried)', ohlcvCallCount === kisItemCount);
  check(
    'getHomeLiveMarket: quote failure -> falls back to dataBasis latest_close',
    result.ticker.filter((item) => item.id !== 'usdkrw').every((item) => item.dataBasis === 'latest_close'),
  );
  check('getHomeLiveMarket: a quote call happened for every KIS item before falling back', quoteCallOrder.length === kisItemCount);
}

// 8. Partial success across the quote-first/OHLCV-fallback split: KR items resolve via a succeeding
//    quote, US items fall back to OHLCV -- each item's own dataBasis reflects its own resolution path
//    independently (one item's quote outcome never leaks into another's).
{
  const result = await getHomeLiveMarket(
    { allowProductionMarketDashboardLiveData: true },
    {
      fetchLongHistoryOhlcv: async () => okOhlcvResult(fakeCloses, FAKE_ASOF),
      findUniversalInstrument: () => fakeInstrument,
      fetchUsdKrwContext: async () => okFx,
      fetchUsdKrwSparklineSeries: async () => okFxSparkline,
      getKisDomesticQuoteSnapshot: async () => okQuoteResult(271000, 3500, 1.31, '2026-07-24T06:00:00Z'),
      getKisOverseasQuoteSnapshot: async () => failingQuoteResult,
      now: () => FIXED_NOW_MS,
    },
  );
  check(
    'getHomeLiveMarket: partial quote success -> KR items are current_quote',
    result.ticker.filter((item) => item.currency === 'KRW' && item.id !== 'usdkrw').every((item) => item.dataBasis === 'current_quote'),
  );
  check(
    'getHomeLiveMarket: partial quote success -> US items independently fall back to latest_close',
    result.ticker.filter((item) => item.currency === 'USD').every((item) => item.dataBasis === 'latest_close'),
  );
}

// =====================================================================================
// Group 1b (Phase 3GL-HF2 §4/§6/§12): normalizeKisQuoteSign -- direct unit tests of the shared
// direction/sign helper. Covers the exact bug scenarios observed in Preview (Dollar Index and WTI
// Oil reporting a positive changeAmount alongside a negative changePct) plus the full required
// scenario matrix: rising, falling, unchanged, unsigned-amount conflicts (both directions), a sign
// code that overrides a conflicting raw percentage, a missing sign field, and malformed/null input.
// =====================================================================================
{
  check(
    'normalizeKisQuoteSign: rising (sign code "2") applies a positive direction to both fields',
    JSON.stringify(normalizeKisQuoteSign({ rawAmount: 3500, rawPct: 1.31, signCode: '2' })) ===
      JSON.stringify({ change: 3500, changePct: 1.31 }),
  );
  check(
    'normalizeKisQuoteSign: falling (sign code "5") applies a negative direction to both fields',
    JSON.stringify(normalizeKisQuoteSign({ rawAmount: 1.83, rawPct: 1.42, signCode: '5' })) ===
      JSON.stringify({ change: -1.83, changePct: -1.42 }),
  );
  check(
    'normalizeKisQuoteSign: unchanged (sign code "3") zeroes both fields regardless of raw magnitude',
    JSON.stringify(normalizeKisQuoteSign({ rawAmount: 0.28, rawPct: 0, signCode: '3' })) ===
      JSON.stringify({ change: 0, changePct: 0 }),
  );
  {
    // Reproduces the observed Dollar Index bug: unsigned/mismarked positive amount + genuinely
    // negative percentage, no usable sign code -- the guarded fallback trusts the percentage's sign.
    const dollarIndexBug = normalizeKisQuoteSign({ rawAmount: 0.28, rawPct: -0.99, signCode: null });
    check('normalizeKisQuoteSign: unsigned amount + negative pct -> amount takes the pct sign (Dollar Index bug case)', dollarIndexBug.change === -0.28);
    check('normalizeKisQuoteSign: unsigned amount + negative pct -> pct is preserved as-is', dollarIndexBug.changePct === -0.99);
  }
  {
    // Reproduces the observed WTI Oil bug: unsigned/mismarked negative amount + genuinely positive
    // percentage.
    const wtiBug = normalizeKisQuoteSign({ rawAmount: -1.83, rawPct: 1.42, signCode: undefined });
    check('normalizeKisQuoteSign: unsigned amount + positive pct -> amount takes the pct sign (WTI Oil bug case)', wtiBug.change === 1.83);
    check('normalizeKisQuoteSign: unsigned amount + positive pct -> pct is preserved as-is', wtiBug.changePct === 1.42);
  }
  {
    // A recognized sign code always wins over a raw percentage that disagrees with it.
    const signCodeWins = normalizeKisQuoteSign({ rawAmount: 900, rawPct: 0.4, signCode: '4' });
    check('normalizeKisQuoteSign: a recognized sign code overrides a conflicting raw percentage sign', signCodeWins.change === -900 && signCodeWins.changePct === -0.4);
  }
  {
    // Missing sign field, but the two raw fields already agree in sign -- passed through unchanged.
    const agreeing = normalizeKisQuoteSign({ rawAmount: -450, rawPct: -0.61, signCode: null });
    check('normalizeKisQuoteSign: missing sign code, agreeing raw signs -> passthrough unchanged', agreeing.change === -450 && agreeing.changePct === -0.61);
  }
  check(
    'normalizeKisQuoteSign: only one raw field present (other null) -> passthrough, nothing to contradict',
    JSON.stringify(normalizeKisQuoteSign({ rawAmount: null, rawPct: 5, signCode: null })) === JSON.stringify({ change: null, changePct: 5 }),
  );
  check(
    'normalizeKisQuoteSign: both raw fields null and no sign code -> both null (never fabricated)',
    JSON.stringify(normalizeKisQuoteSign({ rawAmount: null, rawPct: null, signCode: null })) === JSON.stringify({ change: null, changePct: null }),
  );
  check(
    'normalizeKisQuoteSign: an unrecognized sign code string falls back to the raw-field comparison',
    JSON.stringify(normalizeKisQuoteSign({ rawAmount: 10, rawPct: 0.5, signCode: 'X' })) === JSON.stringify({ change: 10, changePct: 0.5 }),
  );

  // Invariant sweep: across every case above (plus a few extra), change and changePct must never end
  // up on opposite non-zero signs.
  const invariantCases: Array<{ rawAmount: number | null; rawPct: number | null; signCode: string | null | undefined }> = [
    { rawAmount: 3500, rawPct: 1.31, signCode: '2' },
    { rawAmount: 1.83, rawPct: 1.42, signCode: '5' },
    { rawAmount: 0.28, rawPct: 0, signCode: '3' },
    { rawAmount: 0.28, rawPct: -0.99, signCode: null },
    { rawAmount: -1.83, rawPct: 1.42, signCode: undefined },
    { rawAmount: 900, rawPct: 0.4, signCode: '4' },
    { rawAmount: -450, rawPct: -0.61, signCode: null },
    { rawAmount: null, rawPct: 5, signCode: null },
    { rawAmount: null, rawPct: null, signCode: null },
    { rawAmount: 10, rawPct: 0.5, signCode: 'X' },
    { rawAmount: 0, rawPct: -2.5, signCode: null },
    { rawAmount: -2.5, rawPct: 0, signCode: null },
  ];
  const invariantHolds = invariantCases.every(({ rawAmount, rawPct, signCode }) => {
    const { change, changePct } = normalizeKisQuoteSign({ rawAmount, rawPct, signCode });
    if (change === null || changePct === null || change === 0 || changePct === 0) return true;
    return Math.sign(change) === Math.sign(changePct);
  });
  check('normalizeKisQuoteSign: invariant holds across every case -- change and changePct never land on opposite non-zero signs', invariantHolds);
}

// =====================================================================================
// Group 1c (Phase 3GL-HF2 §7/§12): Home-layer defensive contradiction safety net -- even if a
// provider-layer normalization bug somehow slipped a contradictory pair through, toCurrentQuoteItem
// (exercised end-to-end via getHomeLiveMarket) must null changeAmount rather than ship it, and the
// basis label must no longer claim real-time delivery.
// =====================================================================================
{
  const result = await getHomeLiveMarket(
    { allowProductionMarketDashboardLiveData: true },
    {
      fetchLongHistoryOhlcv: async () => okOhlcvResult(fakeCloses, FAKE_ASOF),
      findUniversalInstrument: () => fakeInstrument,
      fetchUsdKrwContext: async () => okFx,
      fetchUsdKrwSparklineSeries: async () => okFxSparkline,
      // Deliberately contradictory: positive changeAmount paired with a negative changePct, as if a
      // provider-layer bug had somehow slipped through despite kisClient.ts's own normalization.
      getKisDomesticQuoteSnapshot: async () => okQuoteResult(271000, 3500, -1.31, '2026-07-24T06:00:00Z'),
      getKisOverseasQuoteSnapshot: async () => okQuoteResult(552.4, -1.2, 0.22, '2026-07-24T20:00:00Z'),
      now: () => FIXED_NOW_MS,
    },
  );
  const kisItems = result.ticker.filter((item) => item.id !== 'usdkrw');
  check(
    'getHomeLiveMarket: Home-layer safety net nulls changeAmount when directions conflict',
    kisItems.every((item) => item.changeAmount === null),
  );
  check(
    'getHomeLiveMarket: Home-layer safety net preserves changePct even when changeAmount is nulled',
    kisItems.every((item) => item.changePct !== null),
  );
  check(
    'getHomeLiveMarket: contradictory items still carry dataBasis current_quote (safety net does not degrade the whole item)',
    kisItems.every((item) => item.dataBasis === 'current_quote'),
  );
  check(
    'getHomeLiveMarket: basis label no longer claims real-time delivery',
    kisItems.every((item) => item.basisLabel.includes('현재가 조회 기준') && !item.basisLabel.includes('실시간(지연) 시세 기준')),
  );

  // A non-contradictory quote success (Group 6 above) must NOT have its changeAmount nulled -- the
  // safety net only fires on a genuine sign conflict.
  const nonContradictory = await getHomeLiveMarket(
    { allowProductionMarketDashboardLiveData: true },
    {
      fetchLongHistoryOhlcv: async () => okOhlcvResult(fakeCloses, FAKE_ASOF),
      findUniversalInstrument: () => fakeInstrument,
      fetchUsdKrwContext: async () => okFx,
      fetchUsdKrwSparklineSeries: async () => okFxSparkline,
      getKisDomesticQuoteSnapshot: async () => okQuoteResult(271000, 3500, 1.31, '2026-07-24T06:00:00Z'),
      getKisOverseasQuoteSnapshot: async () => okQuoteResult(552.4, -1.2, -0.22, '2026-07-24T20:00:00Z'),
      now: () => FIXED_NOW_MS,
    },
  );
  check(
    'getHomeLiveMarket: agreeing-direction quotes keep a non-null changeAmount (safety net does not over-fire)',
    nonContradictory.ticker.filter((item) => item.id !== 'usdkrw').every((item) => item.changeAmount !== null),
  );
}

// =====================================================================================
// Group 1d (Phase 3GL-HF3 §5/§6/§7): the sparkline data contract -- KIS daily-close series, the
// USD/KRW reference-FX series, the never-fabricated-when-unavailable rule, and the no-duplicate-fetch
// guarantee, all independent of which headline path (quote vs. OHLCV fallback) produced the price.
// =====================================================================================

// 1. KIS sparkline built from the same OHLCV history already fetched for the (quote-failure) fallback
//    headline: capped to the last 20 points, ascending date order, correct basis/period label.
{
  const result = await getHomeLiveMarket(
    { allowProductionMarketDashboardLiveData: true },
    {
      fetchLongHistoryOhlcv: async () => okOhlcvResultWithDates(fakeDatedCloses, DATED_ASOF),
      findUniversalInstrument: () => fakeInstrument,
      fetchUsdKrwContext: async () => okFx,
      fetchUsdKrwSparklineSeries: async () => okFxSparkline,
      getKisDomesticQuoteSnapshot: async () => failingQuoteResult,
      getKisOverseasQuoteSnapshot: async () => failingQuoteResult,
      now: () => FIXED_NOW_MS,
    },
  );
  const kisItems = result.ticker.filter((item) => item.id !== 'usdkrw');
  check('getHomeLiveMarket: sparkline -> every resolvable KIS item carries sparklineStatus ok', kisItems.every((item) => item.sparklineStatus === 'ok'));
  check('getHomeLiveMarket: sparkline -> every resolvable KIS item carries sparklineBasis daily_close', kisItems.every((item) => item.sparklineBasis === 'daily_close'));
  check(
    'getHomeLiveMarket: sparkline -> every resolvable KIS item carries the exact KIS period label',
    kisItems.every((item) => item.sparklinePeriodLabel === '최근 20거래일 종가 추이'),
  );
  check('getHomeLiveMarket: sparkline -> capped to the last 20 points even though 25 were available', kisItems.every((item) => item.sparkline.length === 20));
  check(
    'getHomeLiveMarket: sparkline -> points are in ascending chronological order',
    kisItems.every((item) => item.sparkline.every((point, i) => i === 0 || point.date > item.sparkline[i - 1].date)),
  );
  check(
    'getHomeLiveMarket: sparkline -> every value is a finite positive number',
    kisItems.every((item) => item.sparkline.every((point) => Number.isFinite(point.value) && point.value > 0)),
  );
  check(
    'getHomeLiveMarket: sparkline -> retains only the most recent 20 of the 25 fake daily closes (dates 07-06..07-25)',
    kisItems.every((item) => item.sparkline[0].date === '20260706' && item.sparkline[19].date === '20260725'),
  );
}

// 2. Sparkline unavailable (insufficient history) never blocks a successful quote-based headline, and
//    never fabricates a flat/placeholder line.
{
  const result = await getHomeLiveMarket(
    { allowProductionMarketDashboardLiveData: true },
    {
      fetchLongHistoryOhlcv: async () => failOhlcvResult,
      findUniversalInstrument: () => fakeInstrument,
      fetchUsdKrwContext: async () => okFx,
      fetchUsdKrwSparklineSeries: async () => okFxSparkline,
      getKisDomesticQuoteSnapshot: async () => okQuoteResult(271000, 3500, 1.31, '2026-07-24T06:00:00Z'),
      getKisOverseasQuoteSnapshot: async () => okQuoteResult(552.4, -1.2, -0.22, '2026-07-24T20:00:00Z'),
      now: () => FIXED_NOW_MS,
    },
  );
  const kisItems = result.ticker.filter((item) => item.id !== 'usdkrw');
  check('getHomeLiveMarket: sparkline -> a failed history fetch never blocks the already-resolved quote headline', kisItems.every((item) => item.status === 'ok' && item.dataBasis === 'current_quote'));
  check('getHomeLiveMarket: sparkline -> failed history reports sparklineStatus unavailable (never fabricated)', kisItems.every((item) => item.sparklineStatus === 'unavailable'));
  check('getHomeLiveMarket: sparkline -> unavailable sparkline carries an empty points array, not a placeholder', kisItems.every((item) => item.sparkline.length === 0));
  check('getHomeLiveMarket: sparkline -> unavailable sparkline carries a null period label', kisItems.every((item) => item.sparklinePeriodLabel === null));
  const kospiItem = result.ticker.find((item) => item.id === 'kospi');
  check('getHomeLiveMarket: sparkline -> the quote headline price is untouched by the sparkline failure', kospiItem?.price === 271000);
}

// 3. USD/KRW reference-FX sparkline: ok case carries the injected series verbatim with the FX basis
//    and period label; unavailable case leaves the FX headline (rate/change) fully intact.
{
  const resultOk = await getHomeLiveMarket(
    { allowProductionMarketDashboardLiveData: true },
    {
      fetchLongHistoryOhlcv: async () => okOhlcvResult(fakeCloses, FAKE_ASOF),
      findUniversalInstrument: () => fakeInstrument,
      fetchUsdKrwContext: async () => okFx,
      fetchUsdKrwSparklineSeries: async () => okFxSparkline,
      getKisDomesticQuoteSnapshot: async () => failingQuoteResult,
      getKisOverseasQuoteSnapshot: async () => failingQuoteResult,
      now: () => FIXED_NOW_MS,
    },
  );
  const usdkrwOk = resultOk.ticker.find((item) => item.id === 'usdkrw');
  check('getHomeLiveMarket: FX sparkline ok -> sparklineStatus ok', usdkrwOk?.sparklineStatus === 'ok');
  check('getHomeLiveMarket: FX sparkline ok -> sparklineBasis reference_fx', usdkrwOk?.sparklineBasis === 'reference_fx');
  check('getHomeLiveMarket: FX sparkline ok -> the exact FX period label', usdkrwOk?.sparklinePeriodLabel === '최근 20공시일 환율 추이');
  check('getHomeLiveMarket: FX sparkline ok -> carries the injected series verbatim', JSON.stringify(usdkrwOk?.sparkline) === JSON.stringify(okFxSparkline.series));

  const resultFxSparklineDown = await getHomeLiveMarket(
    { allowProductionMarketDashboardLiveData: true },
    {
      fetchLongHistoryOhlcv: async () => okOhlcvResult(fakeCloses, FAKE_ASOF),
      findUniversalInstrument: () => fakeInstrument,
      fetchUsdKrwContext: async () => okFx,
      fetchUsdKrwSparklineSeries: async () => unavailableFxSparkline,
      getKisDomesticQuoteSnapshot: async () => failingQuoteResult,
      getKisOverseasQuoteSnapshot: async () => failingQuoteResult,
      now: () => FIXED_NOW_MS,
    },
  );
  const usdkrwDegraded = resultFxSparklineDown.ticker.find((item) => item.id === 'usdkrw');
  check('getHomeLiveMarket: FX sparkline unavailable -> the FX headline (rate) stays fully intact', usdkrwDegraded?.status === 'ok' && usdkrwDegraded?.price === okFx.rate);
  check('getHomeLiveMarket: FX sparkline unavailable -> sparklineStatus unavailable, never fabricated', usdkrwDegraded?.sparklineStatus === 'unavailable' && usdkrwDegraded?.sparkline.length === 0);
}

// 4. No duplicate history fetch: across a full 9-item request, fetchLongHistoryOhlcv is called exactly
//    once per KIS-backed item (8 times), never for usdkrw (which uses the FX sparkline series instead).
{
  let ohlcvCalls = 0;
  const result = await getHomeLiveMarket(
    { allowProductionMarketDashboardLiveData: true },
    {
      fetchLongHistoryOhlcv: async () => {
        ohlcvCalls += 1;
        return okOhlcvResultWithDates(fakeDatedCloses, DATED_ASOF);
      },
      findUniversalInstrument: () => fakeInstrument,
      fetchUsdKrwContext: async () => okFx,
      fetchUsdKrwSparklineSeries: async () => okFxSparkline,
      getKisDomesticQuoteSnapshot: async () => failingQuoteResult,
      getKisOverseasQuoteSnapshot: async () => failingQuoteResult,
      now: () => FIXED_NOW_MS,
    },
  );
  check('getHomeLiveMarket: sparkline -> exactly 8 OHLCV calls for a full 9-item request (one per KIS item, none for usdkrw)', ohlcvCalls === 8);
  check('getHomeLiveMarket: sparkline -> every KIS item resolves with a usable sparkline from that single call', result.ticker.filter((item) => item.id !== 'usdkrw').every((item) => item.sparklineStatus === 'ok'));
}

// =====================================================================================
// Group 2: gnewsHomeNewsProvider.mjs -- normalize / dedupe / classify / cache / not-configured
// =====================================================================================

// normalizeGnewsHomeArticle: drops raw articles missing title/url; maps only client-safe fields.
{
  check('normalizeGnewsHomeArticle: null when title is missing', normalizeGnewsHomeArticle({ url: 'https://example.com/a' }) === null);
  check('normalizeGnewsHomeArticle: null when url is missing', normalizeGnewsHomeArticle({ title: 'headline' }) === null);
  check('normalizeGnewsHomeArticle: null on non-object input', normalizeGnewsHomeArticle(null) === null);

  const raw = {
    title: '  코스피, 사상 최고치 경신  ',
    description: '코스피 지수가 강세를 보였다.',
    url: 'https://news.example.com/a?utm_source=x&utm_medium=y&id=1',
    image: 'https://news.example.com/a.jpg',
    publishedAt: '2026-07-24T09:00:00Z',
    source: { name: '예시뉴스', url: 'https://news.example.com' },
    content: 'THIS FULL CONTENT MUST NEVER SURVIVE NORMALIZATION',
  };
  const normalized = normalizeGnewsHomeArticle(raw);
  check('normalizeGnewsHomeArticle: trims the title', normalized?.title === '코스피, 사상 최고치 경신');
  check('normalizeGnewsHomeArticle: canonicalizes the url (strips utm tracking params, keeps id)', normalized?.id === 'https://news.example.com/a?id=1');
  check('normalizeGnewsHomeArticle: preserves the original (uncanonicalized) url field', normalized?.url === raw.url);
  check('normalizeGnewsHomeArticle: never carries the raw article content field through', !('content' in (normalized ?? {})));
  check('normalizeGnewsHomeArticle: classifies a 코스피 headline as DOMESTIC_STOCKS', normalized?.category === 'DOMESTIC_STOCKS');
  check('normalizeGnewsHomeArticle: sourceName falls back to a Korean unknown label when missing', normalizeGnewsHomeArticle({ ...raw, source: undefined })?.sourceName === '알 수 없음');
  check(
    'normalizeGnewsHomeArticle: only exposes the documented client-safe field set',
    Object.keys(normalized ?? {}).sort().join(',') ===
      ['id', 'title', 'description', 'url', 'image', 'publishedAt', 'sourceName', 'sourceUrl', 'category', 'titleKey'].sort().join(','),
  );
}

// Phase 3GL-HF1 §10: hardened validation -- non-HTTP(S) protocol, malformed/missing/unparseable
// publishedAt, and bounded field lengths are all rejection or truncation conditions.
{
  const base = { title: '유효한 제목', url: 'https://news.example.com/valid', publishedAt: '2026-07-24T09:00:00Z' };

  check('normalizeGnewsHomeArticle: rejects missing publishedAt', normalizeGnewsHomeArticle({ title: base.title, url: base.url }) === null);
  check(
    'normalizeGnewsHomeArticle: rejects an unparseable publishedAt string',
    normalizeGnewsHomeArticle({ ...base, publishedAt: 'not-a-real-date' }) === null,
  );
  check(
    'normalizeGnewsHomeArticle: rejects a non-HTTP(S) protocol url (javascript:)',
    normalizeGnewsHomeArticle({ ...base, url: 'javascript:alert(1)' }) === null,
  );
  check(
    'normalizeGnewsHomeArticle: rejects a non-HTTP(S) protocol url (ftp:)',
    normalizeGnewsHomeArticle({ ...base, url: 'ftp://example.com/a' }) === null,
  );
  check(
    'normalizeGnewsHomeArticle: rejects a url that exceeds the 2048-char bound',
    normalizeGnewsHomeArticle({ ...base, url: `https://example.com/${'a'.repeat(2100)}` }) === null,
  );
  check(
    'normalizeGnewsHomeArticle: rejects a title that exceeds the 240-char bound',
    normalizeGnewsHomeArticle({ ...base, title: '가'.repeat(241) }) === null,
  );
  check('normalizeGnewsHomeArticle: rejects an empty (whitespace-only) title', normalizeGnewsHomeArticle({ ...base, title: '   ' }) === null);

  const truncatedDescription = normalizeGnewsHomeArticle({ ...base, description: '나'.repeat(700) });
  check('normalizeGnewsHomeArticle: truncates an over-length description to the 600-char bound', truncatedDescription?.description?.length === 600);

  const truncatedSource = normalizeGnewsHomeArticle({ ...base, source: { name: '다'.repeat(150) } });
  check('normalizeGnewsHomeArticle: truncates an over-length source name to the 120-char bound', truncatedSource?.sourceName?.length === 120);

  const droppedImage = normalizeGnewsHomeArticle({ ...base, image: 'javascript:alert(1)' });
  check('normalizeGnewsHomeArticle: drops an unsafe image url rather than passing it through', droppedImage?.image === null);

  const keptImage = normalizeGnewsHomeArticle({ ...base, image: 'https://news.example.com/thumb.jpg' });
  check('normalizeGnewsHomeArticle: keeps a safe, bounded image url', keptImage?.image === 'https://news.example.com/thumb.jpg');

  const droppedSourceUrl = normalizeGnewsHomeArticle({ ...base, source: { name: '예시', url: 'not-a-url' } });
  check('normalizeGnewsHomeArticle: drops an unsafe source url rather than passing it through', droppedSourceUrl?.sourceUrl === null);
}

// classifyArticle priority order (via normalizeGnewsHomeArticle): FX -> COMMODITIES -> MACRO ->
// DOMESTIC_STOCKS -> OVERSEAS_STOCKS -> GENERAL_MARKET default.
{
  const classify = (title: string) =>
    normalizeGnewsHomeArticle({ title, url: `https://example.com/${encodeURIComponent(title)}`, publishedAt: '2026-07-24T00:00:00Z' })?.category;
  check('classifyArticle: 환율 -> FX', classify('오늘 환율 급등') === 'FX');
  check('classifyArticle: 유가 -> COMMODITIES', classify('국제 유가 상승세') === 'COMMODITIES');
  check('classifyArticle: 기준금리 -> MACRO', classify('한국은행 기준금리 동결') === 'MACRO');
  check('classifyArticle: 코스닥 -> DOMESTIC_STOCKS', classify('코스닥 지수 상승') === 'DOMESTIC_STOCKS');
  check('classifyArticle: 나스닥 -> OVERSEAS_STOCKS', classify('나스닥 종가 상승') === 'OVERSEAS_STOCKS');
  check('classifyArticle: unrelated headline -> GENERAL_MARKET default', classify('오늘 날씨는 맑음') === 'GENERAL_MARKET');
  check(
    'HOME_NEWS_CATEGORIES exposes exactly the 6 documented category codes',
    HOME_NEWS_CATEGORIES.slice().sort().join(',') ===
      ['DOMESTIC_STOCKS', 'OVERSEAS_STOCKS', 'FX', 'MACRO', 'COMMODITIES', 'GENERAL_MARKET'].sort().join(','),
  );

  // Phase 3GL-HF5 §8 (test item 25): English-language fallback articles must classify honestly --
  // never a blanket GENERAL_MARKET or an over-eager OVERSEAS_STOCKS just because a generic word like
  // "stocks" appears. FX/COMMODITIES/MACRO/DOMESTIC_STOCKS keywords are checked at least as early as
  // the generic OVERSEAS_STOCKS bucket, so a more specific topic always wins.
  check('classifyArticle: "Dollar rises against the yen" -> FX', classify('Dollar rises against the yen') === 'FX');
  check('classifyArticle: "Oil prices climb as OPEC weighs supply cut" -> COMMODITIES', classify('Oil prices climb as OPEC weighs supply cut') === 'COMMODITIES');
  check('classifyArticle: "Federal Reserve signals rate path" -> MACRO', classify('Federal Reserve signals rate path') === 'MACRO');
  check('classifyArticle: "Inflation data keeps interest rate bets alive" -> MACRO', classify('Inflation data keeps interest rate bets alive') === 'MACRO');
  check('classifyArticle: "KOSPI hits fresh record high" -> DOMESTIC_STOCKS', classify('KOSPI hits fresh record high') === 'DOMESTIC_STOCKS');
  check('classifyArticle: "Nasdaq stocks rally as Wall Street cheers" -> OVERSEAS_STOCKS', classify('Nasdaq stocks rally as Wall Street cheers') === 'OVERSEAS_STOCKS');
  check('classifyArticle: "Global stock market extends gains" -> OVERSEAS_STOCKS', classify('Global stock market extends gains') === 'OVERSEAS_STOCKS');
  check(
    'classifyArticle: an oil-and-stocks headline resolves to the more specific COMMODITIES, never a blanket OVERSEAS_STOCKS',
    classify('Oil prices surge while stocks retreat') === 'COMMODITIES',
  );
  check(
    'classifyArticle: a currency-and-stocks headline resolves to the more specific FX, never a blanket OVERSEAS_STOCKS',
    classify('Dollar currency strength weighs on stocks') === 'FX',
  );
  check('classifyArticle: an unrelated English headline -> GENERAL_MARKET default (never fabricated OVERSEAS_STOCKS)', classify('Local bakery wins a national pastry award') === 'GENERAL_MARKET');
}

// dedupeAndRankHomeArticles: sorts newest first, dedupes by canonical url AND normalized title, caps
// to the limit, and strips the internal titleKey field before returning.
{
  const a = normalizeGnewsHomeArticle({ title: '삼성전자 실적 발표', url: 'https://example.com/a', publishedAt: '2026-07-20T00:00:00Z' });
  const bNewer = normalizeGnewsHomeArticle({ title: '삼성전자 실적 발표', url: 'https://example.com/a?utm_source=z', publishedAt: '2026-07-24T00:00:00Z' });
  const cDifferentTitleSameUrlHost = normalizeGnewsHomeArticle({ title: '다른 기사 제목', url: 'https://example.com/c', publishedAt: '2026-07-22T00:00:00Z' });
  const dOldest = normalizeGnewsHomeArticle({ title: '가장 오래된 기사', url: 'https://example.com/d', publishedAt: '2026-07-10T00:00:00Z' });

  const deduped = dedupeAndRankHomeArticles([a, bNewer, cDifferentTitleSameUrlHost, dOldest].filter(Boolean) as object[]);
  check('dedupeAndRankHomeArticles: dedupes a and bNewer (same canonical url and same title) into 1 entry', deduped.length === 3);
  check('dedupeAndRankHomeArticles: sorts newest publishedAt first', (deduped[0] as { title: string }).title === '삼성전자 실적 발표');
  check('dedupeAndRankHomeArticles: strips the internal titleKey field from the returned articles', deduped.every((item) => !('titleKey' in (item as object))));

  const many = Array.from({ length: 10 }, (_, i) =>
    normalizeGnewsHomeArticle({ title: `기사 ${i}`, url: `https://example.com/many-${i}`, publishedAt: `2026-07-${10 + i}T00:00:00Z` }),
  ).filter(Boolean) as object[];
  check('dedupeAndRankHomeArticles: caps output to the default limit of 6', dedupeAndRankHomeArticles(many).length === 6);
  check('dedupeAndRankHomeArticles: honors a custom limit', dedupeAndRankHomeArticles(many, 2).length === 2);
}

// getHomeNewsFeed: Phase 3GL-HF5 bounded two-stage cascade (primary Top Headlines -> fallback Search
// "latest available") + a TTL-independent runtime last-good fallback. All calls in this block share
// ONE gnewsHomeNewsProvider.mjs module instance, so the narrative is ordered deliberately: every
// scenario that must observe "no last-good result exists yet" runs BEFORE the first scenario that
// establishes one (a successful non-empty feed). A no-op injected `sleepFn` is used everywhere a
// fallback request can fire, so this suite never actually waits out the real inter-request delay.
{
  const noopSleep = async (_ms: number) => {};

  // ---- absent / blank key: early return, no state effect, never even reaches the cache. ----
  const resultNoKey = await getHomeNewsFeed({ apiKey: undefined, now: () => FIXED_NOW_MS });
  check('getHomeNewsFeed: absent key -> ok false', resultNoKey.ok === false);
  check('getHomeNewsFeed: absent key -> NEWS_NOT_CONFIGURED (never a fixture fallback)', resultNoKey.code === 'NEWS_NOT_CONFIGURED');
  check('getHomeNewsFeed: absent key -> empty articles array', Array.isArray(resultNoKey.articles) && resultNoKey.articles.length === 0);
  check('getHomeNewsFeed: absent key never carries a diagnostics field', !('diagnostics' in resultNoKey));

  const resultBlankKey = await getHomeNewsFeed({ apiKey: '   ', now: () => FIXED_NOW_MS });
  check('getHomeNewsFeed: whitespace-only key is treated as absent', resultBlankKey.code === 'NEWS_NOT_CONFIGURED');

  // ---- primary-request errors with NO last-good result yet: each returns its own honest sanitized
  // code, never the Search fallback (a fallback only ever follows a *successful* zero-result primary
  // response), and is never cached (so every one of these calls at the SAME instant gets a genuinely
  // fresh fetch instead of colliding on the 5-minute TTL cache). ----
  let unauthorizedCalls = 0;
  const unauthorizedFetch = async () => {
    unauthorizedCalls += 1;
    return { ok: false, status: 401, json: async () => ({}) } as unknown as Response;
  };
  const resultUnauthorized = await getHomeNewsFeed({ apiKey: 'fake-test-key-never-real', fetchFn: unauthorizedFetch, sleepFn: noopSleep, now: () => FIXED_NOW_MS });
  check('getHomeNewsFeed: provider 401 -> ok false with NEWS_UNAUTHORIZED', resultUnauthorized.ok === false && resultUnauthorized.code === 'NEWS_UNAUTHORIZED');
  check('getHomeNewsFeed: never includes the api key anywhere in the returned value', JSON.stringify(resultUnauthorized).includes('fake-test-key-never-real') === false);
  check('getHomeNewsFeed: primary 401 with no last-good -> exactly 1 request (the Search fallback never runs after a primary-level error)', unauthorizedCalls === 1);
  check('getHomeNewsFeed: provider failure (401) never carries a diagnostics field (nothing meaningful to count)', !('diagnostics' in resultUnauthorized));

  // Phase 3GL-HF4 §7: sanitized upstream status mapping -- 400/403/500 each map to their own closed
  // code, none of them carrying a diagnostics field (nothing meaningful to count on a failed request).
  const badRequestFetch = async () => ({ ok: false, status: 400, json: async () => ({}) }) as unknown as Response;
  const resultBadRequest = await getHomeNewsFeed({ apiKey: 'fake-test-key-never-real', fetchFn: badRequestFetch, sleepFn: noopSleep, now: () => FIXED_NOW_MS });
  check('getHomeNewsFeed: provider 400 -> NEWS_BAD_REQUEST (Phase 3GL-HF4)', resultBadRequest.ok === false && resultBadRequest.code === 'NEWS_BAD_REQUEST');
  check('getHomeNewsFeed: provider failure (400) never carries a diagnostics field', !('diagnostics' in resultBadRequest));

  const quotaExhaustedFetch = async () => ({ ok: false, status: 403, json: async () => ({}) }) as unknown as Response;
  const resultQuotaExhausted = await getHomeNewsFeed({ apiKey: 'fake-test-key-never-real', fetchFn: quotaExhaustedFetch, sleepFn: noopSleep, now: () => FIXED_NOW_MS });
  check('getHomeNewsFeed: provider 403 -> NEWS_QUOTA_EXHAUSTED (Phase 3GL-HF4, was NEWS_UNAUTHORIZED pre-HF4)', resultQuotaExhausted.ok === false && resultQuotaExhausted.code === 'NEWS_QUOTA_EXHAUSTED');
  check('getHomeNewsFeed: provider failure (403) never carries a diagnostics field', !('diagnostics' in resultQuotaExhausted));

  const serverErrorFetch = async () => ({ ok: false, status: 500, json: async () => ({}) }) as unknown as Response;
  const resultServerError = await getHomeNewsFeed({ apiKey: 'fake-test-key-never-real', fetchFn: serverErrorFetch, sleepFn: noopSleep, now: () => FIXED_NOW_MS });
  check('getHomeNewsFeed: provider 500 -> NEWS_PROVIDER_ERROR (other non-2xx)', resultServerError.ok === false && resultServerError.code === 'NEWS_PROVIDER_ERROR');
  check('getHomeNewsFeed: provider failure (500) never carries a diagnostics field', !('diagnostics' in resultServerError));

  const rateLimitedFetch = async () => ({ ok: false, status: 429, json: async () => ({}) }) as unknown as Response;
  const resultRateLimited = await getHomeNewsFeed({ apiKey: 'fake-test-key-never-real', fetchFn: rateLimitedFetch, sleepFn: noopSleep, now: () => FIXED_NOW_MS });
  check('getHomeNewsFeed: provider 429 -> NEWS_RATE_LIMITED', resultRateLimited.code === 'NEWS_RATE_LIMITED');
  check('getHomeNewsFeed: provider failure (429) never carries a diagnostics field', !('diagnostics' in resultRateLimited));

  const malformedFetch = async () => ({ ok: true, status: 200, json: async () => ({ notArticles: [] }) }) as unknown as Response;
  const resultMalformed = await getHomeNewsFeed({ apiKey: 'fake-test-key-never-real', fetchFn: malformedFetch, sleepFn: noopSleep, now: () => FIXED_NOW_MS });
  check('getHomeNewsFeed: malformed provider body (no articles array) -> NEWS_PROVIDER_ERROR', resultMalformed.code === 'NEWS_PROVIDER_ERROR');

  // ---- both strategies succeed but yield zero usable articles, still with NO last-good result yet
  // -> honest NEWS_NO_RESULTS, exactly 2 requests (primary + fallback), and the rate-spacing sleepFn
  // is actually invoked with the documented delay (never a real wait in this suite). ----
  let zeroCalls = 0;
  const zeroFetch = async () => {
    zeroCalls += 1;
    return { ok: true, status: 200, json: async () => ({ articles: [] }) } as unknown as Response;
  };
  let sleepCalls: number[] = [];
  const recordingSleep = async (ms: number) => {
    sleepCalls.push(ms);
  };
  const resultBothZero = await getHomeNewsFeed({
    apiKey: 'fake-test-key-never-real',
    fetchFn: zeroFetch,
    sleepFn: recordingSleep,
    now: () => FIXED_NOW_MS + 20 * 60 * 1000,
  });
  check('getHomeNewsFeed: both strategies return zero articles, no last-good -> ok false with NEWS_NO_RESULTS', resultBothZero.ok === false && resultBothZero.code === 'NEWS_NO_RESULTS');
  check('getHomeNewsFeed: both-zero cascade issues exactly 2 requests (primary + fallback), never more', zeroCalls === 2);
  check('getHomeNewsFeed: both-zero cascade waits via the injected sleepFn before the fallback request (never a real, un-injected wait)', sleepCalls.length === 1 && sleepCalls[0] === 1100);
  check(
    'getHomeNewsFeed: both-zero diagnostics are all zero, but honestly report that the fallback was attempted',
    resultBothZero.diagnostics?.primaryProviderArticleCount === 0 &&
      resultBothZero.diagnostics?.primaryNormalizedArticleCount === 0 &&
      resultBothZero.diagnostics?.fallbackAttempted === true &&
      resultBothZero.diagnostics?.fallbackProviderArticleCount === 0 &&
      resultBothZero.diagnostics?.fallbackNormalizedArticleCount === 0 &&
      resultBothZero.diagnostics?.returnedArticleCount === 0,
  );
  check('getHomeNewsFeed: NEWS_NO_RESULTS response uses HTTP-200-style ok:false shape, not a thrown error', typeof resultBothZero.code === 'string');
  check(
    'getHomeNewsFeed: diagnostics on a real cascade are sanitized integers/booleans only (no raw payload leakage)',
    Object.values(resultBothZero.diagnostics ?? {}).every((v) => typeof v === 'number' || typeof v === 'boolean'),
  );

  // ---- primary returns articles but none survive normalization; the fallback (still injected, still
  // no last-good) also yields nothing usable -> NEWS_NO_RESULTS, and the rejected raw text never
  // leaks anywhere in the response. ----
  const allRejectedFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      articles: [
        { title: '   ', url: 'https://example.com/only-whitespace-title-never-survives-normalization' },
        { title: 'missing url entirely -- this exact text must never leak into diagnostics or a response' },
      ],
    }),
  }) as unknown as Response;
  const resultAllRejected = await getHomeNewsFeed({
    apiKey: 'fake-test-key-never-real',
    fetchFn: allRejectedFetch,
    sleepFn: noopSleep,
    now: () => FIXED_NOW_MS + 40 * 60 * 1000,
  });
  check('getHomeNewsFeed: provider returns articles but none survive normalization -> NEWS_NO_RESULTS', resultAllRejected.ok === false && resultAllRejected.code === 'NEWS_NO_RESULTS');
  check(
    'getHomeNewsFeed: all-rejected diagnostics report the primary provider count but zero primary-normalized/returned',
    resultAllRejected.diagnostics?.primaryProviderArticleCount === 2 &&
      resultAllRejected.diagnostics?.primaryNormalizedArticleCount === 0 &&
      resultAllRejected.diagnostics?.returnedArticleCount === 0,
  );
  check(
    "getHomeNewsFeed: NEWS_NO_RESULTS never leaks a rejected article's raw title/content into the response",
    !JSON.stringify(resultAllRejected).includes('this exact text must never leak'),
  );
  check('getHomeNewsFeed: NEWS_NO_RESULTS still returns an empty articles array (never a fabricated one)', Array.isArray(resultAllRejected.articles) && resultAllRejected.articles.length === 0);

  // ---- primary succeeds with >=1 usable article: feedMode='latest', selectedStrategy=
  // 'top_headlines_business_ko_kr', the Search fallback never runs, and this is the FIRST call in this
  // block to establish a last-good runtime result. ----
  let successCalls = 0;
  const successFetch = async () => {
    successCalls += 1;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        articles: [
          { title: '코스피 상승 마감', url: 'https://example.com/1', publishedAt: '2026-07-24T01:00:00Z', source: { name: '테스트뉴스' } },
          { title: '나스닥 하락 마감', url: 'https://example.com/2', publishedAt: '2026-07-24T02:00:00Z', source: { name: '테스트뉴스' } },
        ],
      }),
    } as unknown as Response;
  };
  const resultSuccess = await getHomeNewsFeed({ apiKey: 'fake-test-key-never-real', fetchFn: successFetch, sleepFn: noopSleep, now: () => FIXED_NOW_MS + 60 * 60 * 1000 });
  check('getHomeNewsFeed: primary success -> ok true', resultSuccess.ok === true);
  check('getHomeNewsFeed: primary success -> feedMode "latest"', resultSuccess.feedMode === 'latest');
  check('getHomeNewsFeed: primary success -> selectedStrategy "top_headlines_business_ko_kr"', resultSuccess.selectedStrategy === 'top_headlines_business_ko_kr');
  check('getHomeNewsFeed: primary success -> at most 6 articles, capped', resultSuccess.articles.length <= 6);
  check('getHomeNewsFeed: primary success -> normalizes and classifies each article', resultSuccess.articles.every((a: { category: string }) => HOME_NEWS_CATEGORIES.includes(a.category)));
  check('getHomeNewsFeed: primary success response never leaks the api key', JSON.stringify(resultSuccess).includes('fake-test-key-never-real') === false);
  check('getHomeNewsFeed: primary success -> exactly 1 request (the Search fallback never runs once the primary already has usable articles)', successCalls === 1);
  check(
    'getHomeNewsFeed: primary-success diagnostics carry accurate sanitized counts and fallbackAttempted=false',
    resultSuccess.diagnostics?.primaryProviderArticleCount === 2 &&
      resultSuccess.diagnostics?.primaryNormalizedArticleCount === 2 &&
      resultSuccess.diagnostics?.fallbackAttempted === false &&
      resultSuccess.diagnostics?.returnedArticleCount === 2,
  );

  const resultCached = await getHomeNewsFeed({ apiKey: 'fake-test-key-never-real', fetchFn: successFetch, sleepFn: noopSleep, now: () => FIXED_NOW_MS + 60 * 60 * 1000 + 1000 });
  check('getHomeNewsFeed: a second call within the TTL reuses the cache (no additional provider fetch)', successCalls === 1 && resultCached.ok === true);

  // ---- after TTL expiry, primary succeeds with zero usable articles -> the fallback Search request
  // fires and succeeds -> feedMode='latest_available'. This OVERWRITES the last-good result with the
  // fallback's articles (used by the next scenario). ----
  let fallbackStageCalls = 0;
  const capturedFallbackUrls: string[] = [];
  const capturedPrimaryUrls: string[] = [];
  const primaryEmptyThenFallbackFetch = async (url: string) => {
    fallbackStageCalls += 1;
    if (url.includes('/top-headlines')) {
      capturedPrimaryUrls.push(url);
      return { ok: true, status: 200, json: async () => ({ articles: [] }) } as unknown as Response;
    }
    capturedFallbackUrls.push(url);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        articles: [
          { title: 'Global stock market steadies as investors await Fed decision', url: 'https://example.com/fallback-1', publishedAt: '2026-07-25T03:00:00Z', source: { name: 'Test Wire' } },
        ],
      }),
    } as unknown as Response;
  };
  const resultTtlExpiredFallback = await getHomeNewsFeed({
    apiKey: 'fake-test-key-never-real',
    fetchFn: primaryEmptyThenFallbackFetch,
    sleepFn: recordingSleep,
    now: () => FIXED_NOW_MS + 66 * 60 * 1000,
  });
  check('getHomeNewsFeed: a call after the TTL expires triggers a fresh provider fetch', fallbackStageCalls === 2 && resultTtlExpiredFallback.ok === true);
  check('getHomeNewsFeed: primary empty + fallback non-empty -> feedMode "latest_available"', resultTtlExpiredFallback.feedMode === 'latest_available');
  check('getHomeNewsFeed: primary empty + fallback non-empty -> selectedStrategy "search_latest_available_market"', resultTtlExpiredFallback.selectedStrategy === 'search_latest_available_market');
  check('getHomeNewsFeed: exactly one primary request and one fallback request issued (bounded at 2, never a fan-out)', capturedPrimaryUrls.length === 1 && capturedFallbackUrls.length === 1);
  check(
    'getHomeNewsFeed: fallback diagnostics honestly report fallbackAttempted=true with the correct counts',
    resultTtlExpiredFallback.diagnostics?.fallbackAttempted === true &&
      resultTtlExpiredFallback.diagnostics?.fallbackProviderArticleCount === 1 &&
      resultTtlExpiredFallback.diagnostics?.fallbackNormalizedArticleCount === 1 &&
      resultTtlExpiredFallback.diagnostics?.returnedArticleCount === 1,
  );

  // ---- Phase 3GL-HF5 §5A/§5B url contract, captured from the two real requests just issued above. ----
  const primaryParams = new URL(capturedPrimaryUrls[0]).searchParams;
  check('getHomeNewsFeed: primary (Top Headlines) URL requests category=business', primaryParams.get('category') === 'business');
  check('getHomeNewsFeed: primary (Top Headlines) URL requests lang=ko', primaryParams.get('lang') === 'ko');
  check('getHomeNewsFeed: primary (Top Headlines) URL requests country=kr', primaryParams.get('country') === 'kr');
  check('getHomeNewsFeed: primary (Top Headlines) URL requests max=10', primaryParams.get('max') === '10');
  check('getHomeNewsFeed: primary (Top Headlines) URL never carries a client-controlled q parameter', primaryParams.has('q') === false);
  check('getHomeNewsFeed: primary (Top Headlines) URL carries exactly one apikey parameter', primaryParams.getAll('apikey').length === 1);

  const fallbackParams = new URL(capturedFallbackUrls[0]).searchParams;
  check('getHomeNewsFeed: fallback (Search) URL requests sortby=publishedAt', fallbackParams.get('sortby') === 'publishedAt');
  check('getHomeNewsFeed: fallback (Search) URL omits lang entirely (unsupported on the Search endpoint)', fallbackParams.has('lang') === false);
  check('getHomeNewsFeed: fallback (Search) URL never constrains the window with from/to (surfaces the latest AVAILABLE article regardless of date)', !fallbackParams.has('from') && !fallbackParams.has('to'));
  check('getHomeNewsFeed: fallback (Search) URL carries exactly one broad bilingual q parameter', fallbackParams.getAll('q').length === 1 && (fallbackParams.get('q') ?? '').length > 0);
  check('getHomeNewsFeed: fallback (Search) URL requests max=10 (GNews Free plan cap)', fallbackParams.get('max') === '10');
  check('getHomeNewsFeed: fallback (Search) URL carries exactly one apikey parameter', fallbackParams.getAll('apikey').length === 1);

  // ---- a later refresh where BOTH strategies again return zero usable articles: because a last-good
  // result now exists (the fallback's article from the previous scenario), the feed is served as
  // feedMode='last_good' instead of an empty NEWS_NO_RESULTS, still bounded at exactly 2 requests, and
  // the served article's publishedAt is copied through completely unchanged. ----
  let laterBothZeroCalls = 0;
  const laterBothZeroFetch = async () => {
    laterBothZeroCalls += 1;
    return { ok: true, status: 200, json: async () => ({ articles: [] }) } as unknown as Response;
  };
  const laterNowMs = FIXED_NOW_MS + 90 * 60 * 1000;
  const resultLastGoodFromBothZero = await getHomeNewsFeed({
    apiKey: 'fake-test-key-never-real',
    fetchFn: laterBothZeroFetch,
    sleepFn: noopSleep,
    now: () => laterNowMs,
  });
  check('getHomeNewsFeed: both strategies zero again, but a last-good result exists -> ok true with feedMode "last_good"', resultLastGoodFromBothZero.ok === true && resultLastGoodFromBothZero.feedMode === 'last_good');
  check('getHomeNewsFeed: last-good (from both-zero) selectedStrategy is "last_good_runtime_cache"', resultLastGoodFromBothZero.selectedStrategy === 'last_good_runtime_cache');
  check('getHomeNewsFeed: last-good (from both-zero) still issues exactly 2 real requests before falling back to the runtime cache', laterBothZeroCalls === 2);
  check('getHomeNewsFeed: last-good (from both-zero) serves the previously remembered fallback article', resultLastGoodFromBothZero.articles?.[0]?.url === 'https://example.com/fallback-1');
  check(
    "getHomeNewsFeed: last-good (from both-zero) never rewrites the served article's original publishedAt",
    resultLastGoodFromBothZero.articles?.[0]?.publishedAt === '2026-07-25T03:00:00Z',
  );
  check(
    'getHomeNewsFeed: last-good generatedAt reflects the CURRENT call, not the original article time',
    resultLastGoodFromBothZero.generatedAt === new Date(laterNowMs).toISOString(),
  );
  check('getHomeNewsFeed: last-good (from both-zero) diagnostics.returnedArticleCount matches the served article count', resultLastGoodFromBothZero.diagnostics?.returnedArticleCount === resultLastGoodFromBothZero.articles?.length);
  check(
    'getHomeNewsFeed: the runtime last-good store is a defensive copy, not the same object reference as what was served',
    resultLastGoodFromBothZero.articles?.[0] !== undefined && resultLastGoodFromBothZero.articles[0] !== resultTtlExpiredFallback.articles[0],
  );

  // ---- a later refresh where the PRIMARY REQUEST ITSELF fails: with a last-good result present, the
  // failure is masked by feedMode='last_good' rather than the honest NEWS_UNAUTHORIZED code, and the
  // Search fallback still never runs after a primary-level error (exactly 1 request). ----
  let laterUnauthorizedCalls = 0;
  const laterUnauthorizedFetch = async () => {
    laterUnauthorizedCalls += 1;
    return { ok: false, status: 401, json: async () => ({}) } as unknown as Response;
  };
  const resultLastGoodFromError = await getHomeNewsFeed({
    apiKey: 'fake-test-key-never-real',
    fetchFn: laterUnauthorizedFetch,
    sleepFn: noopSleep,
    now: () => FIXED_NOW_MS + 110 * 60 * 1000,
  });
  check('getHomeNewsFeed: a later primary-request failure with a last-good result -> ok true with feedMode "last_good" (never the raw failure code)', resultLastGoodFromError.ok === true && resultLastGoodFromError.feedMode === 'last_good');
  check('getHomeNewsFeed: last-good (from a later provider failure) still issues only the 1 primary request -- the fallback never runs after a primary-level error', laterUnauthorizedCalls === 1);
  check('getHomeNewsFeed: last-good (from a later provider failure) still serves the previously remembered article, publishedAt unchanged', resultLastGoodFromError.articles?.[0]?.publishedAt === '2026-07-25T03:00:00Z');

  // ---- a genuinely successful fetch after all of the above still returns fresh, real articles: the
  // feed is never permanently wedged into last_good or NEWS_NO_RESULTS once the provider recovers. ----
  const resultRecovered = await getHomeNewsFeed({
    apiKey: 'fake-test-key-never-real',
    fetchFn: successFetch,
    sleepFn: noopSleep,
    now: () => FIXED_NOW_MS + 130 * 60 * 1000,
  });
  check(
    'getHomeNewsFeed: the feed recovers to a genuine feedMode "latest" once the primary provider succeeds again (never permanently wedged in last_good/NEWS_NO_RESULTS)',
    resultRecovered.ok === true && resultRecovered.feedMode === 'latest',
  );
}

export const runAll = async (): Promise<number> => {
  console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  return failed === 0 ? 0 : 1;
};
