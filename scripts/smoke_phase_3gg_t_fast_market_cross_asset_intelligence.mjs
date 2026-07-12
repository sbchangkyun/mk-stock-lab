/**
 * Phase 3GG-T-FAST deterministic smoke — Market & Cross-Asset Intelligence engines.
 *
 * Credential-free, no network: exercises the pure benchmark/sector resolvers, relative-strength engine,
 * regime classifier, market-intelligence engine, and formatter with sanitized fixtures. Verifies
 * benchmark mapping (KOSPI/KOSDAQ/NASDAQ/broad + self-benchmark fallback), no fabricated sector,
 * relative-strength outperform/underperform/insufficient-overlap/currency-mismatch, regime risk-on/
 * risk-off/neutral/high-vol-transition/data-insufficient, completeness, partial-source success, no
 * NaN/Infinity, no recommendation wording, and honest unavailable rate/sector/breadth. Exits non-zero
 * on any failure.
 */

import { resolveBenchmark } from '../src/lib/server/chart-ai/marketIntelligence/benchmarkResolver.mjs';
import { resolveSector } from '../src/lib/server/chart-ai/marketIntelligence/sectorResolver.mjs';
import { computeRelativeStrength } from '../src/lib/server/chart-ai/marketIntelligence/relativeStrength.mjs';
import { classifyMarketRegime } from '../src/lib/server/chart-ai/marketIntelligence/marketRegime.mjs';
import { runMarketIntelligence } from '../src/lib/server/chart-ai/marketIntelligence/marketIntelligenceEngine.mjs';
import { formatMarketIntelligence } from '../src/lib/server/chart-ai/marketIntelligence/marketIntelligenceFormatter.mjs';

let passed = 0;
let failed = 0;
const check = (name, cond) => { if (cond) passed += 1; else failed += 1; console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`); };

const inst = (o) => ({ symbol: o.symbol, displayName: o.name || o.symbol, country: o.country, exchange: o.exchange || (o.country === 'US' ? 'NASDAQ' : 'KOSPI'), assetType: o.assetType || 'stock', currency: o.currency || (o.country === 'US' ? 'USD' : 'KRW') });

// ---- Benchmark resolver ----
const kospi = resolveBenchmark(inst({ symbol: '005930', country: 'KR', exchange: 'KOSPI' }));
check('KR KOSPI stock -> KODEX 200 benchmark', kospi.benchmark.symbol === '069500' && kospi.mappingReason === 'kr-kospi');
const kosdaq = resolveBenchmark(inst({ symbol: '247540', country: 'KR', exchange: 'KOSDAQ' }));
check('KR KOSDAQ stock -> KODEX KOSDAQ150 benchmark', kosdaq.benchmark.symbol === '229200' && kosdaq.mappingReason === 'kr-kosdaq');
const nasdaq = resolveBenchmark(inst({ symbol: 'AAPL', country: 'US', exchange: 'NASDAQ' }));
check('US NASDAQ-listed -> QQQ benchmark', nasdaq.benchmark.symbol === 'QQQ' && nasdaq.mappingReason === 'us-nasdaq-listed');
const nyse = resolveBenchmark(inst({ symbol: 'JPM', country: 'US', exchange: 'NYSE' }));
check('US NYSE -> SPY (broad) benchmark', nyse.benchmark.symbol === 'SPY' && nyse.mappingReason === 'us-nyse-broad');
const selfSpy = resolveBenchmark(inst({ symbol: 'SPY', country: 'US', exchange: 'NYSE Arca', assetType: 'etf' }));
check('US SPY self-benchmark -> broad-market fallback (crosschecks to QQQ), labeled', selfSpy.benchmark.symbol === 'QQQ' && selfSpy.selfBenchmark === true && selfSpy.mappingConfidence === 'broad-market-fallback');
check('benchmark mapping carries a confidence (completeness, not prediction)', ['verified', 'inferred-from-market', 'broad-market-fallback', 'unavailable'].includes(kospi.mappingConfidence));

// ---- Sector resolver (no fabrication) ----
check('US AAPL -> verified technology sector', resolveSector(inst({ symbol: 'AAPL', country: 'US' })).available === true);
check('US unmapped ticker -> sector unavailable (not inferred from name)', resolveSector(inst({ symbol: 'ZZZZ', country: 'US' })).available === false);
check('KR instrument -> sector unavailable (honest)', resolveSector(inst({ symbol: '005930', country: 'KR' })).available === false);

// ---- Relative strength ----
const dates = Array.from({ length: 160 }, (_, i) => new Date(Date.UTC(2025, 0, 1) + i * 86400000).toISOString().slice(0, 10));
const outSel = dates.map((d, i) => ({ date: d, close: 100 * Math.pow(1.004, i) }));   // strong uptrend
const flatBench = dates.map((d, i) => ({ date: d, close: 100 * Math.pow(1.0005, i) })); // mild uptrend
const rsOut = computeRelativeStrength(outSel, flatBench, { currencyMatch: true });
check('relative strength detects outperformance', rsOut.available && ['strong_out', 'moderate_out'].includes(rsOut.classification) && rsOut.primaryDiffPct > 0);
const rsUnder = computeRelativeStrength(flatBench, outSel, { currencyMatch: true });
check('relative strength detects underperformance', rsUnder.available && ['strong_under', 'moderate_under'].includes(rsUnder.classification) && rsUnder.primaryDiffPct < 0);
const shortSel = outSel.slice(0, 10);
check('insufficient overlap -> unavailable (no fabrication)', computeRelativeStrength(shortSel, flatBench, { currencyMatch: true }).available === false);
check('currency mismatch -> not compared (honest)', computeRelativeStrength(outSel, flatBench, { currencyMatch: false }).available === false);
check('RS windows include 1m/3m/6m', rsOut.windows[21] && rsOut.windows[63] && rsOut.windows[126]);

// ---- Regime classifier ----
const riskOn = classifyMarketRegime({ equityTrendScore: 78, equityMomentumPct: 4, annualizedVolatility: 0.12, goldChangePct: -1, oilChangePct: 3, fxChangePct: -1 });
check('risk-on fixture -> risk-on', riskOn.regime === 'risk-on' && riskOn.regimeLabel === '위험선호');
const riskOff = classifyMarketRegime({ equityTrendScore: 22, equityMomentumPct: -5, annualizedVolatility: 0.30, goldChangePct: 5, oilChangePct: -6, fxChangePct: 3 });
check('risk-off fixture -> risk-off', riskOff.regime === 'risk-off' && riskOff.regimeLabel === '위험회피');
const neutral = classifyMarketRegime({ equityTrendScore: 50, equityMomentumPct: 0, annualizedVolatility: 0.20 });
check('neutral fixture -> neutral', neutral.regime === 'neutral');
const highVol = classifyMarketRegime({ equityTrendScore: 35, equityMomentumPct: -3, annualizedVolatility: 0.55 });
check('high-volatility transition fixture', highVol.regime === 'high-vol-transition');
const insuff = classifyMarketRegime({ equityTrendScore: 60 });
check('data-insufficient fixture -> data-insufficient', insuff.regime === 'data-insufficient' && insuff.confidence === 0);
check('regime confidence is data completeness/agreement (0..100)', riskOn.confidence >= 0 && riskOn.confidence <= 100);

// ---- Full engine: full + partial success ----
const selectedSeries = outSel;
const benchmarkSeries = flatBench;
const goldSeries = dates.map((d, i) => ({ date: d, close: 180 + Math.sin(i / 10) }));
const full = runMarketIntelligence({
  instrument: inst({ symbol: '005930', country: 'KR', exchange: 'KOSPI', currency: 'KRW' }),
  benchmark: inst({ symbol: '069500', country: 'KR', exchange: 'KOSPI', assetType: 'etf', currency: 'KRW' }),
  benchmarkMapping: { reason: 'kr-kospi', confidence: 'inferred-from-market', selfBenchmark: false },
  sector: { available: false, reasonText: '국내 종목의 업종 기준 데이터는 제공되지 않습니다.' },
  selectedSeries, benchmarkSeries, sectorSeries: null,
  goldSeries, oilSeries: null,
  fx: { available: true, source: 'frankfurter-ecb', rate: 1400, changePct: -1, asOf: '2026-07-10', isDelayed: true },
  asOf: dates[dates.length - 1],
});
check('full engine ok with core equity + RS', full.ok === true);
check('rate context is honestly unavailable (not sourced)', full.rateContext.available === false);
check('sector honestly unavailable', full.sector.available === false);
check('data completeness is a 0..100 percentage', full.dataCompleteness >= 0 && full.dataCompleteness <= 100);
check('no NaN/Infinity in engine output', !/NaN|Infinity/.test(JSON.stringify(full)));

const partial = runMarketIntelligence({
  instrument: inst({ symbol: 'AAPL', country: 'US', exchange: 'NASDAQ', currency: 'USD' }),
  benchmark: null, benchmarkMapping: null, sector: { available: false },
  selectedSeries, benchmarkSeries: null, sectorSeries: null, goldSeries: null, oilSeries: null,
  fx: { available: false, source: 'frankfurter-ecb' }, asOf: dates[dates.length - 1],
});
check('partial success: missing benchmark -> ok=false but no crash', partial.ok === false && partial.equityContext.available === false);
check('missing data represented as unavailable, never zero', partial.equityContext.available === false && !('trendScore' in partial.equityContext ? partial.equityContext.trendScore === 0 : false));

// ---- Formatter: sections + no recommendation wording ----
const f = formatMarketIntelligence(full);
check('formatter produces the market-intelligence sections', f.sections.length >= 7);
check('formatter availability list marks breadth + rates unavailable honestly', f.availability.some((a) => a.dataset.includes('breadth') && !a.available) && f.availability.some((a) => a.dataset === '금리' && !a.available));
check('formatter has the required disclaimer', f.disclaimer.includes('미래 성과를 예측하거나 보장하지 않습니다'));
const fullText = JSON.stringify(f);
const PROHIBITED = ['매수', '매도', '진입', '청산', '목표가', '손절', '적정 비중', '추천 비중', '상승 확률', '수익 보장'];
const found = PROHIBITED.filter((p) => fullText.includes(p));
check(`no prohibited recommendation wording (found: ${JSON.stringify(found)})`, found.length === 0);
check('no NaN/Infinity in formatter output', !/NaN|Infinity/.test(fullText));

console.log('');
console.log(`SMOKE SUMMARY :: passed=${passed} failed=${failed} total=${passed + failed}`);
if (failed > 0) { console.error('SMOKE RESULT :: FAIL'); process.exit(1); }
console.log('SMOKE RESULT :: PASS');
