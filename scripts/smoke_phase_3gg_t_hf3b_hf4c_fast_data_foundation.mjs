/**
 * Phase 3GG-T-HF3B-HF4C deterministic smoke — universal search coverage + OHLCV cache/single-flight.
 *
 * Fully offline and credential-free: exercises the pure search-ranking/pagination logic over the
 * generated master and the normalized-OHLCV cache + single-flight with an injectable fake clock and a
 * fake loader. No network, no DOM, no login, no KIS, no Supabase, no Production request. Prints only
 * booleans/counts; exits non-zero on any failure.
 */

import master from '../src/data/chart-ai/universalInstrumentMaster.json' with { type: 'json' };
import manifest from '../src/data/chart-ai/universalInstrumentMaster.manifest.json' with { type: 'json' };
import {
  searchUniversalInstruments,
  findUniversalInstrument,
  loadUniversalInstruments,
  getUniversalMasterVersion,
  UNIVERSAL_SEARCH_DEFAULT_LIMIT,
  UNIVERSAL_SEARCH_MAX_LIMIT,
} from '../src/lib/server/chart-ai/universal-instrument-search.mjs';
import {
  createNormalizedOhlcvCache,
  buildOhlcvCacheKey,
  OHLCV_CACHE_STATE,
} from '../src/lib/server/chart-ai/normalizedOhlcvCache.mjs';
import { readFileSync } from 'node:fs';

let passed = 0;
let failed = 0;
const check = (name, condition) => {
  const ok = Boolean(condition);
  if (ok) passed += 1;
  else failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'} :: ${name}`);
};

const OLD_CURATED_COUNT = 31; // prior curated master size

// ===========================================================================
// 27.1 Master validation
// ===========================================================================
const instruments = master.instruments;
check('27.1 master materially larger (>= 10x old curated count)', instruments.length >= OLD_CURATED_COUNT * 10);
check('27.1 manifest total matches instruments length', manifest.counts.total === instruments.length);

const canonicalKeys = new Set();
const countrySymbolKeys = new Set();
let dupCanonical = 0;
let dupCountrySymbol = 0;
for (const i of instruments) {
  const c = `${i.country}|${i.symbol}|${i.exchange}|${i.assetType}`;
  if (canonicalKeys.has(c)) dupCanonical += 1;
  canonicalKeys.add(c);
  const cs = `${i.country}|${i.symbol}`;
  if (countrySymbolKeys.has(cs)) dupCountrySymbol += 1;
  countrySymbolKeys.add(cs);
}
check('27.1 canonical identity unique', dupCanonical === 0);
check('27.1 country+symbol unique', dupCountrySymbol === 0);

const krStocks = instruments.filter((i) => i.country === 'KR' && i.assetType === 'stock');
const krEtfs = instruments.filter((i) => i.country === 'KR' && i.assetType === 'etf');
const usStocks = instruments.filter((i) => i.country === 'US' && i.assetType === 'stock');
const usEtfs = instruments.filter((i) => i.country === 'US' && i.assetType === 'etf');
check('27.1 KR stocks present', krStocks.length > 0);
check('27.1 KR ETFs present', krEtfs.length > 0);
check('27.1 US stocks present', usStocks.length > 0);
check('27.1 US ETFs present', usEtfs.length > 0);

check('27.1 leading-zero KR codes preserved as 6-digit strings', instruments.some((i) => i.country === 'KR' && /^0\d{5}$/.test(i.symbol)));
// Phase 3GG-T-HF3B-HF2: KR codes widened to six-character alphanumeric (^[0-9A-Z]{6}$).
check('27.1 all KR symbols are six-character alphanumeric', instruments.filter((i) => i.country === 'KR').every((i) => /^[0-9A-Z]{6}$/.test(i.symbol)));
check('27.1 all US symbols uppercase pure-alpha', instruments.filter((i) => i.country === 'US').every((i) => /^[A-Z]{1,5}$/.test(i.symbol)));
check('27.1 all US carry supported EXCD (NAS/NYS/AMS)', instruments.filter((i) => i.country === 'US').every((i) => ['NAS', 'NYS', 'AMS'].includes(i.exchangeCode)));
check('27.1 all KR carry null EXCD', instruments.filter((i) => i.country === 'KR').every((i) => i.exchangeCode === null));
// Phase 3GG-T-HF3B-HF2: US exchanges are now the KIS overseas set NASDAQ/NYSE/AMEX (NAS/NYS/AMS).
check('27.1 no unsupported exchange leaked into master', instruments.every((i) => (i.country === 'KR' ? ['KOSPI', 'KOSDAQ'].includes(i.exchange) : ['NASDAQ', 'NYSE', 'AMEX'].includes(i.exchange))));
// Phase 3GG-T-HF3B-HF2: manifest rejections is a flat reason->count object (KIS-only generator).
check('27.1 manifest reports rejected unsupported security groups (proof of rejection)', (manifest.rejections?.['unsupported-security-group'] ?? 0) > 0);
check('27.1 manifest reports rejected invalid symbol codes', (manifest.rejections?.['invalid-symbol-shape'] ?? 0) > 0);
check('27.1 master version is a stable non-empty string', typeof getUniversalMasterVersion() === 'string' && getUniversalMasterVersion().length > 0);

// no hidden Samsung-first ordering: an exact non-Samsung code returns that code first, and the master
// array itself is NOT anchored to Samsung as element 0.
check('27.1 no hidden Samsung-first (exact non-Samsung code wins)', searchUniversalInstruments({ query: '000660' }).results[0]?.symbol === '000660');
check('27.1 master element 0 is not force-pinned to Samsung', instruments[0]?.symbol !== '005930');

// ===========================================================================
// 27.2 Ranking
// ===========================================================================
check('27.2 exact KR code ranks first', searchUniversalInstruments({ query: '005930' }).results[0]?.symbol === '005930');
check('27.2 exact US ticker ranks first', searchUniversalInstruments({ query: 'AAPL' }).results[0]?.symbol === 'AAPL');
check('27.2 exact KR name ranks first', searchUniversalInstruments({ query: '삼성전자' }).results[0]?.symbol === '005930');
check('27.2 exact EN name resolves', searchUniversalInstruments({ query: 'apple' }).results[0]?.symbol === 'AAPL');
check('27.2 symbol prefix matches', searchUniversalInstruments({ query: 'AAP', country: 'US' }).results.some((r) => r.symbol === 'AAPL'));
check('27.2 name prefix matches', searchUniversalInstruments({ query: '삼성' }).results.some((r) => r.symbol === '005930'));
check('27.2 alias prefix matches (애플 -> AAPL)', searchUniversalInstruments({ query: '애플' }).results.some((r) => r.symbol === 'AAPL'));
check('27.2 exact beats prefix (005930 before any 0059xx prefix)', searchUniversalInstruments({ query: '005930' }).results[0]?.symbol === '005930');
const tieA = searchUniversalInstruments({ query: 'samsung' });
const tieB = searchUniversalInstruments({ query: 'samsung' });
check('27.2 deterministic tie ordering (repeat identical)', JSON.stringify(tieA.results.map((r) => r.symbol)) === JSON.stringify(tieB.results.map((r) => r.symbol)));

// ===========================================================================
// 27.3 Filters + pagination
// ===========================================================================
check('27.3 country=KR returns only KR', searchUniversalInstruments({ query: 'a', country: 'KR' }).results.every((r) => r.country === 'KR'));
check('27.3 country=US returns only US', searchUniversalInstruments({ query: 'a', country: 'US' }).results.every((r) => r.country === 'US'));
check('27.3 assetType=stock returns only stocks', searchUniversalInstruments({ query: 'a', assetType: 'stock' }).results.every((r) => r.assetType === 'stock'));
check('27.3 assetType=etf returns only ETFs', searchUniversalInstruments({ query: 'a', assetType: 'etf' }).results.every((r) => r.assetType === 'etf'));
const combined = searchUniversalInstruments({ query: 'a', country: 'US', assetType: 'etf' });
check('27.3 combined filters (US + etf)', combined.results.every((r) => r.country === 'US' && r.assetType === 'etf'));
check('27.3 default limit is 20', UNIVERSAL_SEARCH_DEFAULT_LIMIT === 20);
check('27.3 max limit is 50', UNIVERSAL_SEARCH_MAX_LIMIT === 50);
const capped = searchUniversalInstruments({ query: 'a', limit: 999 });
check('27.3 limit clamps to max (<=50)', capped.returned <= 50);
const defaulted = searchUniversalInstruments({ query: 'a' });
check('27.3 default page returns <= default limit', defaulted.returned <= UNIVERSAL_SEARCH_DEFAULT_LIMIT);
check('27.3 total >= returned', defaulted.total >= defaulted.returned);
check('27.3 hasMore true when total exceeds a page', defaulted.total > UNIVERSAL_SEARCH_DEFAULT_LIMIT ? defaulted.hasMore === true : true);

// stable pagination: page1 + page2 have no overlap and match total slice
const page1 = searchUniversalInstruments({ query: 'a', country: 'US', limit: 10, offset: 0 });
const page2 = searchUniversalInstruments({ query: 'a', country: 'US', limit: 10, offset: 10 });
const p1syms = new Set(page1.results.map((r) => r.symbol));
check('27.3 stable next offset', page1.nextOffset === 10);
check('27.3 no duplicate row across pages', page2.results.every((r) => !p1syms.has(r.symbol)));
check('27.3 correct total/returned/hasMore on page1', page1.total >= 20 && page1.returned === 10 && page1.hasMore === true);
check('27.3 malformed limit handled safely (NaN -> default)', searchUniversalInstruments({ query: 'a', limit: 'xyz' }).returned <= UNIVERSAL_SEARCH_DEFAULT_LIMIT);
check('27.3 malformed offset handled safely (negative -> 0)', searchUniversalInstruments({ query: 'a', offset: -5 }).offset === 0);
check('27.3 offset beyond total returns empty page (no crash)', searchUniversalInstruments({ query: '005930', offset: 9999 }).returned === 0);
check('27.3 findUniversalInstrument still resolves KR/US', findUniversalInstrument('005930', 'KR')?.symbol === '005930' && findUniversalInstrument('aapl', 'US')?.symbol === 'AAPL');

// ===========================================================================
// 27.4 Browser payload boundary
// ===========================================================================
const pageSrc = readFileSync(new URL('../src/pages/chart-ai.astro', import.meta.url), 'utf8');
check('27.4 page does not import the universal master JSON', !pageSrc.includes('universalInstrumentMaster.json'));
check('27.4 page does not inline the master note/version sentinel', !pageSrc.includes(master.note) && !pageSrc.includes(master.masterVersion));
check('27.4 page fetches search via the protected route', pageSrc.includes('/api/chart-ai/instruments/search.json'));
check('27.4 page adds offset paging param to search', pageSrc.includes("offset: String") || pageSrc.includes('buildSearchParams'));

// ===========================================================================
// 28.x Normalized OHLCV cache + single-flight
// ===========================================================================

// injectable fake clock
let fakeNow = 1_000_000;
const now = () => fakeNow;
const advance = (ms) => { fakeNow += ms; };

// fake normalized value + loader
const makeValue = (symbol, extra = {}) => ({ ok: true, symbol, sourceStatus: 'ok', candles: [{ t: '2026-01-01', close: 1 }], ...extra });
const okClassify = (ttlMs) => () => ({ store: true, ttlMs, negative: false });

// 28.1 basic cache
{
  const cache = createNormalizedOhlcvCache({ now, maxEntries: 10 });
  let calls = 0;
  const loader = async () => { calls += 1; return makeValue('AAA'); };
  const r1 = await cache.getOrLoad('k1', loader, okClassify(60_000));
  const r2 = await cache.getOrLoad('k1', loader, okClassify(60_000));
  check('28.1 first request MISS', r1.state === OHLCV_CACHE_STATE.MISS);
  check('28.1 second same-key HIT', r2.state === OHLCV_CACHE_STATE.HIT);
  check('28.1 loader called once', calls === 1);
  check('28.1 returned data equivalent', r2.value.symbol === 'AAA');
  // caller mutation cannot corrupt cache
  r2.value.candles.push({ t: 'x', close: 999 });
  const r3 = await cache.getOrLoad('k1', loader, okClassify(60_000));
  check('28.1 caller mutation does not corrupt cached value', r3.value.candles.length === 1);
}

// 28.2 concurrent coalescing
{
  const cache = createNormalizedOhlcvCache({ now });
  let calls = 0;
  let release;
  const gate = new Promise((res) => { release = res; });
  const loader = async () => { calls += 1; await gate; return makeValue('BBB'); };
  const pA = cache.getOrLoad('k', loader, okClassify(60_000));
  const pB = cache.getOrLoad('k', loader, okClassify(60_000));
  release();
  const [a, b] = await Promise.all([pA, pB]);
  const states = [a.state, b.state].sort();
  check('28.2 two concurrent same-key calls -> loader once', calls === 1);
  check('28.2 one owner (MISS) + one coalesced', states[0] === OHLCV_CACHE_STATE.COALESCED && states[1] === OHLCV_CACHE_STATE.MISS);
  check('28.2 both receive valid data', a.value.symbol === 'BBB' && b.value.symbol === 'BBB');
  check('28.2 in-flight map cleared afterward', cache.inflightSize() === 0);
}

// 28.3 different keys load independently
{
  const cache = createNormalizedOhlcvCache({ now });
  let calls = 0;
  const loader = (s) => async () => { calls += 1; return makeValue(s); };
  await cache.getOrLoad('KR|005930|chart|1m', loader('a'), okClassify(60_000));
  await cache.getOrLoad('KR|005930|chart|1y', loader('b'), okClassify(60_000));
  await cache.getOrLoad('US|AAPL|chart|1m', loader('c'), okClassify(60_000));
  await cache.getOrLoad('KR|005930|long-history|750', loader('d'), okClassify(60_000));
  check('28.3 different keys each load independently', calls === 4);
}

// 28.4 TTL with fake clock
{
  const cache = createNormalizedOhlcvCache({ now });
  let calls = 0;
  const loader = async () => { calls += 1; return makeValue('T'); };
  await cache.getOrLoad('t', loader, okClassify(5 * 60 * 1000)); // 5m recent-chart
  advance(4 * 60 * 1000);
  const hit = await cache.getOrLoad('t', loader, okClassify(5 * 60 * 1000));
  check('28.4 hit before expiry', hit.state === OHLCV_CACHE_STATE.HIT && calls === 1);
  advance(2 * 60 * 1000); // now 6m > 5m
  const miss = await cache.getOrLoad('t', loader, okClassify(5 * 60 * 1000));
  check('28.4 miss after expiry', miss.state === OHLCV_CACHE_STATE.MISS && calls === 2);
  // long-history 6h TTL survives 5h
  await cache.getOrLoad('lh', loader, okClassify(6 * 60 * 60 * 1000));
  advance(5 * 60 * 60 * 1000);
  const lhHit = await cache.getOrLoad('lh', loader, okClassify(6 * 60 * 60 * 1000));
  check('28.4 long-history TTL survives 5h', lhHit.state === OHLCV_CACHE_STATE.HIT);
  // short negative TTL expires quickly
  const negCache = createNormalizedOhlcvCache({ now });
  const negLoader = async () => ({ ok: false, sourceStatus: 'no-data' });
  const neg1 = await negCache.getOrLoad('n', negLoader, () => ({ store: true, ttlMs: 30 * 1000, negative: true }));
  const negHit = await negCache.getOrLoad('n', negLoader, () => ({ store: true, ttlMs: 30 * 1000, negative: true }));
  check('28.4 short negative TTL: NEGATIVE_HIT within window', neg1.state === OHLCV_CACHE_STATE.MISS && negHit.state === OHLCV_CACHE_STATE.NEGATIVE_HIT);
  advance(31 * 1000);
  const negExpired = await negCache.getOrLoad('n', negLoader, () => ({ store: true, ttlMs: 30 * 1000, negative: true }));
  check('28.4 negative entry expires after short TTL', negExpired.state === OHLCV_CACHE_STATE.MISS);
}

// 28.5 failure behavior
{
  const cache = createNormalizedOhlcvCache({ now });
  let calls = 0;
  const failing = async () => { calls += 1; throw new Error('provider down'); };
  let threw = false;
  try { await cache.getOrLoad('f', failing, okClassify(60_000)); } catch { threw = true; }
  check('28.5 provider error propagates (not swallowed)', threw === true);
  check('28.5 in-flight cleared after failure', cache.inflightSize() === 0);
  check('28.5 failure not cached (nothing stored)', cache.peek('f') === null);
  // later retry succeeds
  const ok = await cache.getOrLoad('f', async () => { calls += 1; return makeValue('R'); }, okClassify(60_000));
  check('28.5 later retry after failure succeeds', ok.state === OHLCV_CACHE_STATE.MISS && ok.value.symbol === 'R');
  // classify store:false never caches
  const c2 = createNormalizedOhlcvCache({ now });
  await c2.getOrLoad('nostore', async () => makeValue('N'), () => ({ store: false, ttlMs: 0 }));
  check('28.5 classify store:false does not cache', c2.peek('nostore') === null);
}

// 28.6 bounds + eviction
{
  const cache = createNormalizedOhlcvCache({ now, maxEntries: 3 });
  for (const k of ['a', 'b', 'c', 'd', 'e']) {
    // eslint-disable-next-line no-await-in-loop
    await cache.getOrLoad(k, async () => makeValue(k), okClassify(60_000));
  }
  check('28.6 bounded max entry count enforced', cache.size() <= 3);
  check('28.6 oldest evicted (a gone)', cache.peek('a') === null);
  check('28.6 newest retained (e present)', cache.peek('e') !== null);
  check('28.6 no in-flight leak', cache.inflightSize() === 0);
}

// 28.7 cross-feature reuse (similarity + MK share one long-history key)
{
  const keySimilarity = buildOhlcvCacheKey({ country: 'KR', symbol: '005930', exchange: 'KOSPI', exchangeCode: '', mode: 'long-history', targetBars: 750, adjusted: 'raw', methodVersion: 'ohlcv-v1' });
  const keyMk = buildOhlcvCacheKey({ country: 'KR', symbol: '005930', exchange: 'KOSPI', exchangeCode: '', mode: 'long-history', targetBars: 750, adjusted: 'raw', methodVersion: 'ohlcv-v1' });
  check('28.7 similarity + MK long-history keys identical (reuse)', keySimilarity === keyMk);
  const keyChart1m = buildOhlcvCacheKey({ country: 'KR', symbol: '005930', exchange: 'KOSPI', exchangeCode: '', mode: 'chart', range: '1m', adjusted: 'raw', methodVersion: 'ohlcv-v1' });
  const keyChart1y = buildOhlcvCacheKey({ country: 'KR', symbol: '005930', exchange: 'KOSPI', exchangeCode: '', mode: 'chart', range: '1y', adjusted: 'raw', methodVersion: 'ohlcv-v1' });
  check('28.7 chart ranges use distinct keys', keyChart1m !== keyChart1y);
  check('28.7 chart vs long-history keys distinct', keyChart1m !== keySimilarity);
  const cache = createNormalizedOhlcvCache({ now });
  let calls = 0;
  const loader = async () => { calls += 1; return makeValue('LH'); };
  const a = await cache.getOrLoad(keySimilarity, loader, okClassify(6 * 60 * 60 * 1000));
  const b = await cache.getOrLoad(keyMk, loader, okClassify(6 * 60 * 60 * 1000));
  check('28.7 second feature hits shared long-history cache', a.state === OHLCV_CACHE_STATE.MISS && b.state === OHLCV_CACHE_STATE.HIT && calls === 1);
}

// 28.8 abort isolation (one waiter drops, other still gets shared result)
{
  const cache = createNormalizedOhlcvCache({ now });
  let calls = 0;
  let release;
  const gate = new Promise((res) => { release = res; });
  const loader = async () => { calls += 1; await gate; return makeValue('SHARED'); };
  const owner = cache.getOrLoad('k', loader, okClassify(60_000));
  const waiter = cache.getOrLoad('k', loader, okClassify(60_000));
  // waiter B "aborts" by ignoring its result; the shared loader still completes for the owner.
  let waiterSettled = false;
  waiter.then(() => { waiterSettled = true; }).catch(() => { waiterSettled = true; });
  release();
  const ownerResult = await owner;
  await waiter;
  check('28.8 underlying loader ran once despite two callers', calls === 1);
  check('28.8 owner still receives shared result after co-waiter ignored', ownerResult.value.symbol === 'SHARED');
  check('28.8 co-waiter promise still settled (isolation)', waiterSettled === true);
}

// 28.9 value safety + key security
{
  check('28.9 buildOhlcvCacheKey rejects userId', (() => { try { buildOhlcvCacheKey({ country: 'KR', symbol: '005930', userId: 'u1' }); return false; } catch { return true; } })());
  check('28.9 buildOhlcvCacheKey rejects token', (() => { try { buildOhlcvCacheKey({ country: 'KR', symbol: '005930', token: 'abc' }); return false; } catch { return true; } })());
  check('28.9 buildOhlcvCacheKey rejects authorization', (() => { try { buildOhlcvCacheKey({ country: 'KR', symbol: '005930', authorization: 'Bearer x' }); return false; } catch { return true; } })());
  const key = buildOhlcvCacheKey({ country: 'KR', symbol: '005930', exchange: 'KOSPI', exchangeCode: '', mode: 'chart', range: '1m', adjusted: 'raw', methodVersion: 'ohlcv-v1' });
  check('28.9 key contains market dimensions', key.includes('country=kr') && key.includes('symbol=005930') && key.includes('mode=chart') && key.includes('range=1m'));
  check('28.9 key contains NO user/token field name', !/user|token|auth|cookie|jwt|secret/i.test(key));
  // stored deep clone: mutate the object the loader returned; cache stays intact
  const cache = createNormalizedOhlcvCache({ now });
  const shared = makeValue('MUT');
  await cache.getOrLoad('m', async () => shared, okClassify(60_000));
  shared.candles.push({ t: 'z', close: 42 });
  const after = await cache.getOrLoad('m', async () => shared, okClassify(60_000));
  check('28.9 loader-side mutation after store does not corrupt cache', after.value.candles.length === 1);
}

console.log('');
console.log(`HF3B-HF4C-DATA-FOUNDATION-TESTS :: passed=${passed} failed=${failed} total=${passed + failed}`);
if (failed > 0) {
  console.error('SMOKE RESULT :: FAIL');
  process.exit(1);
}
console.log('SMOKE RESULT :: PASS');
