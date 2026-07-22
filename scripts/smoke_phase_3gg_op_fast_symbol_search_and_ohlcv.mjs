/**
 * Phase 3GG-OP-FAST deterministic smoke — universal symbol search + OHLCV normalization.
 *
 * Credential-free by default: exercises the pure search-ranking and OHLCV-normalization logic with
 * sanitized in-memory fixtures. No network, no KIS credentials, no real provider call. Verifies KR
 * and US stock/ETF search, exact ticker / Korean-code ranking, OHLCV normalization (ascending sort,
 * dedupe, malformed rejection, OHLC relationship, zero-volume preservation), and the no-sample-
 * fallback guarantee. Prints only booleans/counts; exits non-zero on any failure.
 *
 * A real-provider smoke is intentionally separate (owner-smoke:phase-3gg-op-fast) and requires
 * explicit owner approval + live KIS credentials.
 */

import {
  searchUniversalInstruments,
  findUniversalInstrument,
  loadUniversalInstruments,
} from '../src/lib/server/chart-ai/universal-instrument-search.mjs';
import {
  normalizeOhlcvRows,
  isValidCandle,
  isRenderableCandleSeries,
} from '../src/lib/server/chart-ai/universal-ohlcv-normalize.mjs';

let passed = 0;
let failed = 0;
const results = [];

const check = (name, condition) => {
  const ok = Boolean(condition);
  if (ok) passed += 1;
  else failed += 1;
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} :: ${name}`);
};

// ---- Master integrity ----
const master = loadUniversalInstruments();
check('master loads instruments', master.length >= 20);
check('master has KR instruments', master.some((i) => i.country === 'KR'));
check('master has US instruments', master.some((i) => i.country === 'US'));
check('all US instruments carry an exchange code', master.filter((i) => i.country === 'US').every((i) => i.exchangeCode));
check('all KR instruments have null exchange code', master.filter((i) => i.country === 'KR').every((i) => i.exchangeCode === null));

// ---- KR stock search ----
const krStockByName = searchUniversalInstruments({ query: '삼성전자' });
check('KR stock search by Korean name returns Samsung first', krStockByName.results[0]?.symbol === '005930');
const krStockByCode = searchUniversalInstruments({ query: '005930' });
check('KR stock search by six-digit code returns exact first', krStockByCode.results[0]?.symbol === '005930');
check('KR code exact match ranks Samsung ahead of any prefix match', krStockByCode.results[0]?.symbol === '005930');

// ---- KR ETF search ----
const krEtf = searchUniversalInstruments({ query: 'KODEX 200', assetType: 'etf' });
check('KR ETF search returns a KODEX 200 ETF', krEtf.results.some((r) => r.symbol === '069500' && r.assetType === 'etf'));
const krEtfFilter = searchUniversalInstruments({ query: 'KODEX', assetType: 'stock' });
check('assetType=stock filter excludes ETFs', krEtfFilter.results.every((r) => r.assetType === 'stock'));

// ---- US stock search ----
const usByTicker = searchUniversalInstruments({ query: 'AAPL' });
check('US stock search by ticker returns Apple exact first', usByTicker.results[0]?.symbol === 'AAPL');
const usByEnglish = searchUniversalInstruments({ query: 'apple' });
check('US stock search by English name finds Apple', usByEnglish.results.some((r) => r.symbol === 'AAPL'));
const usByKorean = searchUniversalInstruments({ query: '애플' });
check('US stock search by Korean alias finds Apple', usByKorean.results.some((r) => r.symbol === 'AAPL'));

// ---- US ETF search ----
const usEtf = searchUniversalInstruments({ query: 'QQQ' });
check('US ETF search by ticker returns QQQ exact first', usEtf.results[0]?.symbol === 'QQQ' && usEtf.results[0]?.assetType === 'etf');
const usEtfSpy = searchUniversalInstruments({ query: 'SPY', country: 'US' });
check('US ETF SPY resolves under country=US', usEtfSpy.results.some((r) => r.symbol === 'SPY'));

// ---- Exact ranking beats prefix ----
const prefixCase = searchUniversalInstruments({ query: 'A' });
check('single-letter prefix query returns bounded, ranked results', prefixCase.resultCount > 0 && prefixCase.resultCount <= 25);

// ---- country filter ----
const krOnly = searchUniversalInstruments({ query: 'a', country: 'KR' });
check('country=KR filter returns only KR', krOnly.results.every((r) => r.country === 'KR'));

// ---- findUniversalInstrument ----
check('findUniversalInstrument resolves KR by code', findUniversalInstrument('005930', 'KR')?.symbol === '005930');
check('findUniversalInstrument resolves US by ticker', findUniversalInstrument('AAPL', 'US')?.symbol === 'AAPL');
check('findUniversalInstrument is case-insensitive for US ticker', findUniversalInstrument('aapl', 'US')?.symbol === 'AAPL');
check('findUniversalInstrument returns null for unknown', findUniversalInstrument('ZZZZ', 'US') === null);

// ---- empty / short query ----
const emptyQuery = searchUniversalInstruments({ query: '' });
check('empty query returns no results (no fabricated fallback)', emptyQuery.resultCount === 0);

// ---- OHLCV normalization ----
const rawDescending = [
  { dateTime: '20260710', open: 100, high: 110, low: 95, close: 105, volume: 1000 },
  { dateTime: '20260709', open: 98, high: 102, low: 96, close: 100, volume: 900 },
  { dateTime: '20260708', open: 90, high: 99, low: 88, close: 98, volume: 0 },
];
const normalized = normalizeOhlcvRows(rawDescending, '3m');
check('normalization sorts ascending by timestamp', normalized.candles[0].timestamp < normalized.candles[normalized.candles.length - 1].timestamp);
check('normalization preserves a valid zero-volume candle', normalized.candles.some((c) => c.volume === 0));
check('normalized candles are all valid', normalized.candles.every(isValidCandle));
check('normalized series is renderable', isRenderableCandleSeries(normalized.candles));

const rawWithDuplicatesAndGarbage = [
  { dateTime: '20260710', open: 100, high: 110, low: 95, close: 105, volume: 1000 },
  { dateTime: '20260710', open: 101, high: 111, low: 96, close: 106, volume: 1100 }, // duplicate ts, last wins
  { dateTime: '20260709', open: 98, high: 90, low: 96, close: 100, volume: 900 }, // malformed: high < low
  { dateTime: 'not-a-date', open: 1, high: 2, low: 0, close: 1, volume: 5 }, // bad timestamp
  { dateTime: '20260708', open: 90, high: 99, low: 88, close: 200, volume: 10 }, // malformed: high < close
];
const cleaned = normalizeOhlcvRows(rawWithDuplicatesAndGarbage, '3m');
check('duplicate timestamps collapse to one candle', cleaned.candles.filter((c) => c.timestamp.startsWith('2026-07-10')).length === 1);
check('duplicate resolves to last-wins candle', cleaned.candles.find((c) => c.timestamp.startsWith('2026-07-10'))?.close === 106);
check('malformed candles rejected (high<low, high<close, bad ts)', cleaned.rejectedCount === 3);
check('every surviving candle satisfies low<=open/close<=high', cleaned.candles.every((c) => c.low <= Math.min(c.open, c.close) && c.high >= Math.max(c.open, c.close)));

// ---- no sample fallback ----
const emptyNorm = normalizeOhlcvRows([], '3m');
check('empty input yields empty candles (no synthetic fallback)', emptyNorm.candleCount === 0);
const garbageNorm = normalizeOhlcvRows([{ dateTime: 'x' }, { open: 'a' }], '1y');
check('all-garbage input yields empty candles (no synthetic fallback)', garbageNorm.candleCount === 0);

console.log('');
console.log(`SMOKE SUMMARY :: passed=${passed} failed=${failed} total=${passed + failed}`);
if (failed > 0) {
  console.error('SMOKE RESULT :: FAIL');
  process.exit(1);
}
console.log('SMOKE RESULT :: PASS');
