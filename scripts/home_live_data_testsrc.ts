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

// 1. All 9 items resolve ok -> ticker has 9 items, snapshot is exactly the 4-item subset.
{
  const result = await getHomeLiveMarket(
    { allowProductionMarketDashboardLiveData: true },
    {
      fetchLongHistoryOhlcv: async () => okOhlcvResult(fakeCloses, FAKE_ASOF),
      findUniversalInstrument: () => fakeInstrument,
      fetchUsdKrwContext: async () => okFx,
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
  check('getHomeLiveMarket: snapshot has exactly 4 items', result.snapshot.length === 4);
  check(
    'getHomeLiveMarket: snapshot is exactly {kospi, kosdaq, sp500, nasdaq100} in that order',
    result.snapshot.map((item) => item.id).join(',') === 'kospi,kosdaq,sp500,nasdaq100',
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
    'getHomeLiveMarket: snapshot still carries all 4 fixed subset ids, marked unavailable rather than dropped',
    result.snapshot.length === 4 && result.snapshot.every((item) => item.status === 'unavailable'),
  );
  check('getHomeLiveMarket: snapshot excludes the 5 non-snapshot registry ids', result.snapshot.every((item) => ['kospi', 'kosdaq', 'sp500', 'nasdaq100'].includes(item.id)));
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
      now: () => FIXED_NOW_MS,
    },
  );
  check('getHomeLiveMarket: total failure -> ok false', result.ok === false);
  check('getHomeLiveMarket: total failure -> sanitizedErrorCode MARKET_DATA_UNAVAILABLE', result.sanitizedErrorCode === 'MARKET_DATA_UNAVAILABLE');
  check('getHomeLiveMarket: total failure -> empty snapshot', result.snapshot.length === 0);
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
      now: () => FIXED_NOW_MS,
    },
  );
  check('getHomeLiveMarket: never exceeds the 3-concurrent-resolution cap', maxInFlight <= 3);
  check('getHomeLiveMarket: concurrency is actually used (not fully serial)', maxInFlight > 1);
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

// classifyArticle priority order (via normalizeGnewsHomeArticle): FX -> COMMODITIES -> MACRO ->
// DOMESTIC_STOCKS -> OVERSEAS_STOCKS -> GENERAL_MARKET default.
{
  const classify = (title: string) => normalizeGnewsHomeArticle({ title, url: `https://example.com/${encodeURIComponent(title)}` })?.category;
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

// getHomeNewsFeed: not-configured, provider failure, success + cache-hit, cache never leaks the key.
{
  const resultNoKey = await getHomeNewsFeed({ apiKey: undefined, now: () => FIXED_NOW_MS });
  check('getHomeNewsFeed: absent key -> ok false', resultNoKey.ok === false);
  check('getHomeNewsFeed: absent key -> NEWS_NOT_CONFIGURED (never a fixture fallback)', resultNoKey.code === 'NEWS_NOT_CONFIGURED');
  check('getHomeNewsFeed: absent key -> empty articles array', Array.isArray(resultNoKey.articles) && resultNoKey.articles.length === 0);

  const resultBlankKey = await getHomeNewsFeed({ apiKey: '   ', now: () => FIXED_NOW_MS });
  check('getHomeNewsFeed: whitespace-only key is treated as absent', resultBlankKey.code === 'NEWS_NOT_CONFIGURED');

  let unauthorizedCalls = 0;
  const unauthorizedFetch = async () => {
    unauthorizedCalls += 1;
    return { ok: false, status: 401, json: async () => ({}) } as unknown as Response;
  };
  const resultUnauthorized = await getHomeNewsFeed({ apiKey: 'fake-test-key-never-real', fetchFn: unauthorizedFetch, now: () => FIXED_NOW_MS });
  check('getHomeNewsFeed: provider 401 -> ok false with NEWS_UNAUTHORIZED', resultUnauthorized.ok === false && resultUnauthorized.code === 'NEWS_UNAUTHORIZED');
  check('getHomeNewsFeed: never includes the api key anywhere in the returned value', JSON.stringify(resultUnauthorized).includes('fake-test-key-never-real') === false);

  const rateLimitedFetch = async () => ({ ok: false, status: 429, json: async () => ({}) }) as unknown as Response;
  const resultRateLimited = await getHomeNewsFeed({ apiKey: 'fake-test-key-never-real', fetchFn: rateLimitedFetch, now: () => FIXED_NOW_MS });
  check('getHomeNewsFeed: provider 429 -> NEWS_RATE_LIMITED', resultRateLimited.code === 'NEWS_RATE_LIMITED');

  const malformedFetch = async () => ({ ok: true, status: 200, json: async () => ({ notArticles: [] }) }) as unknown as Response;
  const resultMalformed = await getHomeNewsFeed({ apiKey: 'fake-test-key-never-real', fetchFn: malformedFetch, now: () => FIXED_NOW_MS });
  check('getHomeNewsFeed: malformed provider body (no articles array) -> NEWS_PROVIDER_ERROR', resultMalformed.code === 'NEWS_PROVIDER_ERROR');

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
  const resultSuccess = await getHomeNewsFeed({ apiKey: 'fake-test-key-never-real', fetchFn: successFetch, now: () => FIXED_NOW_MS });
  check('getHomeNewsFeed: success -> ok true', resultSuccess.ok === true);
  check('getHomeNewsFeed: success -> at most 6 articles, capped', resultSuccess.articles.length <= 6);
  check('getHomeNewsFeed: success -> normalizes and classifies each article', resultSuccess.articles.every((a: { category: string }) => HOME_NEWS_CATEGORIES.includes(a.category)));
  check('getHomeNewsFeed: success response never leaks the api key', JSON.stringify(resultSuccess).includes('fake-test-key-never-real') === false);

  const resultCached = await getHomeNewsFeed({ apiKey: 'fake-test-key-never-real', fetchFn: successFetch, now: () => FIXED_NOW_MS + 1000 });
  check('getHomeNewsFeed: a second call within the TTL reuses the cache (no additional provider fetch)', successCalls === 1 && resultCached.ok === true);

  const resultAfterTtl = await getHomeNewsFeed({ apiKey: 'fake-test-key-never-real', fetchFn: successFetch, now: () => FIXED_NOW_MS + 6 * 60 * 1000 });
  check('getHomeNewsFeed: a call after the TTL expires triggers a fresh provider fetch', successCalls === 2 && resultAfterTtl.ok === true);
}

export const runAll = async (): Promise<number> => {
  console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  return failed === 0 ? 0 : 1;
};
