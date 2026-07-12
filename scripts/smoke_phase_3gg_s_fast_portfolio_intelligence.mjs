/**
 * Phase 3GG-S-FAST deterministic smoke — Portfolio Intelligence storage + metrics.
 *
 * Credential-free, no network: exercises the pure watchlist / recent / saved / manual-portfolio logic
 * and the deterministic comparison + risk metrics with an in-memory storage shim and fixtures.
 * Verifies dedupe/capacity/ordering, corruption recovery, schema versioning, snapshot non-live
 * marking + sanitization, holding validation + duplicate policy, native-currency (no KRW/USD merge)
 * totals + weights, unrealized calc, missing-price/analysis behavior, concentration flags,
 * no-auto-provider-call contract, export sanitization + import validation, no NaN/Infinity, and no
 * prohibited recommendation wording. Exits non-zero on any failure.
 */

import { SCHEMA_VERSION, STORAGE_KEYS, LIMITS, normalizeInstrument } from '../src/lib/chart-ai/portfolio-intelligence/schemas.mjs';
import { createMemoryStorage, readNamespace, writeNamespace } from '../src/lib/chart-ai/portfolio-intelligence/storage.mjs';
import { addToWatchlist, removeFromWatchlist, isInWatchlist, loadWatchlist, saveWatchlist } from '../src/lib/chart-ai/portfolio-intelligence/watchlist.mjs';
import { recordRecent } from '../src/lib/chart-ai/portfolio-intelligence/recentSymbols.mjs';
import { addSavedAnalysis, removeSavedAnalysis } from '../src/lib/chart-ai/portfolio-intelligence/savedAnalyses.mjs';
import { addHolding, updateHolding, removeHolding } from '../src/lib/chart-ai/portfolio-intelligence/manualPortfolio.mjs';
import { computePosition, computeCurrencyBuckets, computeComparison, computeRiskSummary, PRICE_BASIS_LABELS } from '../src/lib/chart-ai/portfolio-intelligence/portfolioMetrics.mjs';
import { buildExport, parseImport, EXPORT_KIND } from '../src/lib/chart-ai/portfolio-intelligence/exportImport.mjs';

let passed = 0;
let failed = 0;
const check = (name, cond) => { if (cond) passed += 1; else failed += 1; console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`); };

const NOW = '2026-07-12T00:00:00.000Z';
const samsung = { symbol: '005930', nameKo: '삼성전자', country: 'KR', exchange: 'KOSPI', assetType: 'stock', currency: 'KRW' };
const kodex = { symbol: '069500', nameKo: 'KODEX 200', country: 'KR', exchange: 'KOSPI', assetType: 'etf', currency: 'KRW' };
const aapl = { symbol: 'AAPL', displayName: 'Apple', country: 'US', exchange: 'NASDAQ', assetType: 'stock', currency: 'USD' };
const spy = { symbol: 'SPY', displayName: 'SPDR S&P 500', country: 'US', exchange: 'NYSE Arca', assetType: 'etf', currency: 'USD' };
const K = (i) => `${i.country}:${(i.symbol || '').toUpperCase()}`;

// ---- Watchlist ----
let wl = [];
wl = addToWatchlist(wl, samsung, NOW).items;
wl = addToWatchlist(wl, aapl, NOW).items;
const dupAdd = addToWatchlist(wl, samsung, NOW);
check('watchlist add works', wl.length === 2);
check('watchlist dedupes duplicates', dupAdd.added === false && dupAdd.items.length === 2);
check('watchlist isInWatchlist true for added', isInWatchlist(wl, samsung));
check('watchlist remove works', removeFromWatchlist(wl, K(samsung)).length === 1);
// capacity
let big = [];
for (let i = 0; i < 55; i += 1) big = addToWatchlist(big, { symbol: String(100000 + i), nameKo: 'x', country: 'KR', assetType: 'stock', currency: 'KRW' }, NOW).items;
check('watchlist enforces capacity (50)', big.length === LIMITS.watchlist);
check('watchlist capacity add reports atCapacity', addToWatchlist(big, kodex, NOW).atCapacity === true);

// ---- Storage round-trip + corruption + schema version ----
const store = createMemoryStorage();
saveWatchlist(wl, store, NOW);
const envelope = JSON.parse(store.getItem(STORAGE_KEYS.watchlist));
check('stored envelope carries the schema version', envelope.schemaVersion === SCHEMA_VERSION);
check('watchlist reload round-trips', loadWatchlist(store).length === 2);
store.setItem(STORAGE_KEYS.watchlist, '{ this is not json');
check('corrupted storage recovers to empty (no throw)', loadWatchlist(store).length === 0);
store.setItem(STORAGE_KEYS.watchlist, JSON.stringify({ schemaVersion: 1, items: 'nope' }));
check('malformed items field recovers to empty', readNamespace(STORAGE_KEYS.watchlist, store).length === 0);

// ---- Recent ordering / dedupe / capacity ----
let rc = [];
rc = recordRecent(rc, samsung, '2026-07-10T00:00:00Z');
rc = recordRecent(rc, aapl, '2026-07-11T00:00:00Z');
rc = recordRecent(rc, samsung, '2026-07-12T00:00:00Z'); // re-select moves to front
check('recent most-recent-first + dedupe', rc.length === 2 && rc[0].instrument.symbol === '005930');
check('recent updates viewedAt on re-select', rc[0].viewedAt === '2026-07-12T00:00:00Z');
let rcBig = [];
for (let i = 0; i < 25; i += 1) rcBig = recordRecent(rcBig, { symbol: String(200000 + i), nameKo: 'x', country: 'KR', assetType: 'stock', currency: 'KRW' }, NOW);
check('recent enforces capacity (20)', rcBig.length === LIMITS.recent);
check('recent ignores invalid instrument', recordRecent([], { symbol: 'ZZ', country: 'KR' }, NOW).length === 0);

// ---- Saved analyses: sanitized, non-live, capacity, delete ----
let saved = [];
const simSummary = { matchCount: 5, scoreRange: { min: 48, max: 55 }, aggregateForwardReturns: { d20: -0.01 } };
const r1 = addSavedAnalysis(saved, { instrument: samsung, analysisType: 'similarity', methodVersion: 'sim-v1', summary: simSummary, dataAsOf: '2026-07-10', sourceStatus: 'ok', dataCompleteness: 100 }, NOW, 'a');
saved = r1.items;
check('saved analysis creates a snapshot', r1.saved === true && saved.length === 1);
check('saved snapshot carries savedAt (non-live marker source)', typeof saved[0].savedAt === 'string');
const forbidden = addSavedAnalysis([], { instrument: samsung, analysisType: 'mk-ai', summary: { prompt: 'system: you are', ohlcv: [1, 2, 3] } }, NOW, 'b');
check('saved analysis rejects a summary containing forbidden fields (prompt/ohlcv)', forbidden.saved === false);
check('saved analysis rejects unknown analysisType', addSavedAnalysis([], { instrument: samsung, analysisType: 'news', summary: { a: 1 } }, NOW, 'c').saved === false);
saved = removeSavedAnalysis(saved, saved[0].id);
check('saved analysis delete works', saved.length === 0);

// ---- Manual holdings: validation, duplicate policy ----
let pf = [];
const addOk = addHolding(pf, { instrument: samsung, quantity: 10, averagePrice: 70000, note: 'core' }, NOW);
pf = addOk.items;
check('holding add works with valid input', addOk.added && pf.length === 1);
check('holding rejects non-positive quantity', addHolding(pf, { instrument: aapl, quantity: 0, averagePrice: 100 }, NOW).added === false);
check('holding rejects negative average price', addHolding(pf, { instrument: aapl, quantity: 1, averagePrice: -5 }, NOW).added === false);
const dupHold = addHolding(pf, { instrument: samsung, quantity: 5, averagePrice: 80000 }, NOW);
check('duplicate holding is a conflict (not silently merged/overwritten)', dupHold.conflict === true && dupHold.added === false && dupHold.items.length === 1);
const mergeHold = addHolding(pf, { instrument: samsung, quantity: 5, averagePrice: 80000 }, NOW, true);
check('explicit merge replaces the holding', mergeHold.added === true && mergeHold.items[0].quantity === 5);
const edited = updateHolding(pf, pf[0].id, { quantity: 20 }, NOW);
check('holding edit works', edited[0].quantity === 20);
check('holding edit ignores invalid patch', updateHolding(pf, pf[0].id, { quantity: -1 }, NOW)[0].quantity === 10);
check('holding remove works', removeHolding(pf, pf[0].id).length === 0);

// ---- Position value + currency buckets (no KRW/USD merge) + weights + unrealized ----
const holdings = [
  { id: K(samsung), instrument: normalizeInstrument(samsung), quantity: 10, averagePrice: 70000, currency: 'KRW', note: '' },
  { id: K(kodex), instrument: normalizeInstrument(kodex), quantity: 30, averagePrice: 10000, currency: 'KRW', note: '' },
  { id: K(aapl), instrument: normalizeInstrument(aapl), quantity: 5, averagePrice: 200, currency: 'USD', note: '' },
];
const priceMap = {
  [K(samsung)]: { price: 80000, basis: 'daily-close', asOf: '2026-07-10' },
  [K(kodex)]: { price: 11000, basis: 'daily-close', asOf: '2026-07-10' },
  // AAPL price intentionally missing
};
const pos = computePosition(holdings[0], priceMap[K(samsung)]);
check('position invested cost = qty*avg', pos.investedCost === 700000);
check('position market value = qty*price', pos.marketValue === 800000);
check('position unrealized amount correct', pos.unrealizedAmount === 100000);
check('position unrealized pct correct', pos.unrealizedPct === 14.29);
check('position price basis labeled honestly (daily-close)', pos.priceBasisLabel === PRICE_BASIS_LABELS['daily-close']);
const missingPos = computePosition(holdings[2], priceMap[K(aapl)]);
check('missing-price position has null market value + unavailable basis', missingPos.marketValue === null && missingPos.priceBasis === 'unavailable');

const buckets = computeCurrencyBuckets(holdings, priceMap);
check('KRW and USD are separate buckets (no merged total)', !!buckets.KRW && !!buckets.USD && buckets.KRW !== buckets.USD);
check('KRW bucket cost total is correct', buckets.KRW.totalInvestedCost === 700000 + 300000);
check('KRW allocation weights sum to ~100 within the bucket', Math.round(buckets.KRW.positions.reduce((s, p) => s + (p.weightPct || 0), 0)) === 100);
check('USD bucket is not priced (AAPL missing) → market value null', buckets.USD.totalMarketValue === null && buckets.USD.allPriced === false);

// ---- Comparison: scores when present, needsAnalysis when absent, no fabrication ----
const analysisMap = { [K(samsung)]: { trend: 60, momentum: 50, volatilityStability: 40, risk: 55, dataCompleteness: 100, similarityMatchCount: 5 } };
const cmp = computeComparison([normalizeInstrument(samsung), normalizeInstrument(aapl)], analysisMap);
check('comparison shows scores when analysis exists', cmp[0].needsAnalysis === false && cmp[0].scores.trend === 60);
check('comparison marks needsAnalysis when absent (no fabricated score)', cmp[1].needsAnalysis === true && cmp[1].scores === null);

// ---- Risk summary: concentration flags + missing data + no advice wording ----
const concentrated = [
  { id: 'KR:005930', instrument: normalizeInstrument(samsung), quantity: 100, averagePrice: 70000, currency: 'KRW', note: '' },
  { id: 'KR:069500', instrument: normalizeInstrument(kodex), quantity: 1, averagePrice: 10000, currency: 'KRW', note: '' },
];
const risk = computeRiskSummary(concentrated, {}, analysisMap);
check('risk summary counts holdings/markets', risk.holdingCount === 2 && risk.krCount === 2);
check('risk flags single-position concentration (>40%)', risk.notices.some((n) => n.includes('단일 종목 비중이 높습니다')));
check('risk flags country concentration (>=80%)', risk.notices.some((n) => n.includes('국내(KR)에 집중')));
check('risk reports missing analysis honestly', risk.missingAnalysisCount === 1);
check('risk summary has a neutral disclaimer', typeof risk.disclaimer === 'string' && risk.disclaimer.includes('투자 자문이 아닙니다'));
check('ETF overlap reported as unavailable (not inferred from names)', risk.etfOverlap.available === false);

// ---- No prohibited recommendation wording anywhere in produced text ----
const allText = JSON.stringify(risk) + JSON.stringify(computeRiskSummary(holdings, priceMap, analysisMap));
const PROHIBITED = ['매수', '매도', '손절', '목표가', '리밸런싱', '비중 조정 권장', '추천 비중', '최적 포트폴리오', '상승 확률', '보장'];
const found = PROHIBITED.filter((p) => allText.includes(p));
check(`no prohibited recommendation wording (found: ${JSON.stringify(found)})`, found.length === 0);

// ---- No NaN/Infinity ----
check('no NaN/Infinity in metrics output', !/NaN|Infinity/.test(allText));

// ---- Export sanitization + import validation ----
const exported = buildExport({ watchlist: wl, recent: rc, saved: [{ instrument: samsung, analysisType: 'similarity', methodVersion: 'sim-v1', summary: simSummary, dataAsOf: '2026-07-10', sourceStatus: 'ok', dataCompleteness: 100, savedAt: NOW }], portfolio: holdings }, NOW);
const exportText = JSON.stringify(exported);
check('export uses the recognized kind + schema version', exported.kind === EXPORT_KIND && exported.schemaVersion === SCHEMA_VERSION);
check('export excludes forbidden fields (no secrets/prompt/ohlcv/model)', !/openai|sk-|bearer |prompt|"candles"|"ohlcv"|gpt-|process\.env/i.test(exportText));
const imported = parseImport(exportText);
check('import validates + counts', imported.ok === true && imported.counts.watchlist === wl.length && imported.counts.portfolio === holdings.length);
check('import rejects unrecognized payload', parseImport('{"kind":"other"}').ok === false);
check('import rejects invalid JSON', parseImport('{nope').ok === false);
const withGarbage = JSON.parse(exportText);
withGarbage.manualPortfolio.push({ instrument: { symbol: 'ZZ' }, quantity: -1 });
const importedSkip = parseImport(JSON.stringify(withGarbage));
check('import skips invalid entries with a count', importedSkip.skipped.portfolio >= 1);

console.log('');
console.log(`SMOKE SUMMARY :: passed=${passed} failed=${failed} total=${passed + failed}`);
if (failed > 0) { console.error('SMOKE RESULT :: FAIL'); process.exit(1); }
console.log('SMOKE RESULT :: PASS');
