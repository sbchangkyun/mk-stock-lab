/**
 * Phase 3GG-R-FAST deterministic smoke — MK AI analysis engine + formatter.
 *
 * Credential-free: exercises the deterministic MK AI analysis engine and formatter with sanitized
 * in-memory fixtures (no network, no KIS, no env, no LLM). Verifies trend/momentum/volatility
 * classification from real-shaped closes, similarity + scenario derivation from an aggregate, risk,
 * data-completeness confidence, insufficient-history handling, deterministic output, no NaN/Infinity,
 * no fabricated values, and — critically — that the formatted output contains NO prohibited
 * recommendation/target-price/stop-loss/probability wording. Exits non-zero on any failure.
 */

import { runMkAiAnalysis } from '../src/lib/server/chart-ai/mkAiAnalysis/analysisEngine.mjs';
import { formatMkAiAnalysis } from '../src/lib/server/chart-ai/mkAiAnalysis/analysisFormatter.mjs';

let passed = 0;
let failed = 0;
const check = (name, cond) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

const instrument = { symbol: '005930', displayName: '테스트종목', country: 'KR', exchange: 'KOSPI', assetType: 'stock', currency: 'KRW' };
const iso = (i) => new Date(Date.UTC(2022, 0, 1) + i * 86400000).toISOString();
const mkCandles = (closes) => closes.map((c, i) => ({ timestamp: iso(i), open: c, high: c * 1.005, low: c * 0.995, close: c, volume: 1000 + i }));

// Deterministic series builders (no randomness)
const uptrend = mkCandles(Array.from({ length: 260 }, (_, i) => 100 + i * 0.5 + 3 * Math.sin(i / 9)));
const downtrend = mkCandles(Array.from({ length: 260 }, (_, i) => 260 - i * 0.5 + 3 * Math.sin(i / 9)));
const sideways = mkCandles(Array.from({ length: 260 }, (_, i) => 100 + 2 * Math.sin(i / 6)));
const lowVol = mkCandles(Array.from({ length: 260 }, (_, i) => 100 + i * 0.02 + 0.2 * Math.sin(i / 5)));
const highVol = mkCandles(Array.from({ length: 260 }, (_, i) => 100 + 25 * Math.sin(i / 2) + 15 * Math.cos(i)));

const simAgg = (avg20, pos20, matchCount = 5) => ({
  ok: true,
  candidateCount: 600,
  matches: Array.from({ length: matchCount }, (_, i) => ({
    startDate: iso(i * 30), endDate: iso(i * 30 + 20), similarityScore: 55 - i * 2,
    forwardOutcome: { forwardReturns: { d5: 0.01, d20: avg20, d60: 0.02 }, maxDrawdownPct: -0.05, maxUpsidePct: 0.06 },
    normalizedPath: [100, 101],
  })),
  aggregate: {
    matchCount,
    averageForwardReturnByWindow: { d5: 0.01, d20: avg20, d60: 0.02 },
    medianForwardReturnByWindow: { d5: 0.01, d20: avg20, d60: 0.02 },
    positiveCountByWindow: { d5: 3, d20: pos20, d60: 4 },
    negativeCountByWindow: { d20: matchCount - pos20 },
    averageMaxDrawdownPct: -0.05,
    averageMaxUpsidePct: 0.06,
  },
});

// ---- Trend classification ----
const up = runMkAiAnalysis({ instrument, candles: uptrend, similarity: simAgg(0.05, 4) });
const down = runMkAiAnalysis({ instrument, candles: downtrend, similarity: simAgg(-0.05, 1) });
const side = runMkAiAnalysis({ instrument, candles: sideways, similarity: simAgg(0.005, 3) });
check('uptrend series classifies as an up-trend', ['strong_up', 'moderate_up'].includes(up.dimensions.trend.label));
check('downtrend series classifies as a down-trend', ['weak_down', 'strong_down'].includes(down.dimensions.trend.label));
check('sideways series classifies as sideways', side.dimensions.trend.label === 'sideways');
check('trend scores are in 0..100', [up, down, side].every((r) => r.scores.trend >= 0 && r.scores.trend <= 100));

// ---- Volatility classification ----
const lv = runMkAiAnalysis({ instrument, candles: lowVol, similarity: simAgg(0.01, 3) });
const hv = runMkAiAnalysis({ instrument, candles: highVol, similarity: simAgg(0.01, 3) });
check('low-volatility series classifies low/normal', ['low', 'normal'].includes(lv.dimensions.volatility.label));
check('high-volatility series classifies high/extreme', ['high', 'extreme'].includes(hv.dimensions.volatility.label));

// ---- Similarity + scenario from aggregate ----
const recovered = runMkAiAnalysis({ instrument, candles: sideways, similarity: simAgg(0.06, 4) });
const pullback = runMkAiAnalysis({ instrument, candles: sideways, similarity: simAgg(-0.06, 1) });
const flat = runMkAiAnalysis({ instrument, candles: sideways, similarity: simAgg(0.005, 3) });
check('scenario recovered when aggregate forward-20 is strongly positive', recovered.dimensions.scenario.label === 'recovered');
check('scenario deeper_pullback when aggregate forward-20 is strongly negative', pullback.dimensions.scenario.label === 'deeper_pullback');
check('scenario sideways when aggregate forward-20 is near zero', flat.dimensions.scenario.label === 'sideways');
check('similarity dimension score reflects match scores', typeof up.dimensions.similarity.score === 'number' && up.dimensions.similarity.score >= 0 && up.dimensions.similarity.score <= 100);
check('similarity matchCount comes from the real similarity input', up.dimensions.similarity.matchCount === 5);

// ---- Risk + confidence ----
check('risk score is 0..100', [up, down, hv].every((r) => r.scores.risk >= 0 && r.scores.risk <= 100));
check('high-vol series has higher risk than low-vol', hv.scores.risk > lv.scores.risk);
check('data completeness confidence is 0..100', up.dataCompletenessConfidence >= 0 && up.dataCompletenessConfidence <= 100);

// ---- Insufficient history ----
const shortRes = runMkAiAnalysis({ instrument, candles: mkCandles(Array.from({ length: 30 }, (_, i) => 100 + i)), similarity: { ok: false, matches: [], aggregate: null } });
check('insufficient history marks ok=false + insufficient', shortRes.ok === false && shortRes.insufficient === true);

// ---- No NaN/Infinity ----
check('no NaN/Infinity in engine output', !/NaN|Infinity/.test(JSON.stringify(up)));

// ---- Deterministic ----
const up2 = runMkAiAnalysis({ instrument, candles: uptrend, similarity: simAgg(0.05, 4) });
check('engine output is deterministic across runs', JSON.stringify(up) === JSON.stringify(up2));

// ---- Formatter ----
const f = formatMkAiAnalysis(up);
check('formatter produces the six analysis sections', f.ok === true && f.sections.length === 6);
check('formatter produces technical bullets', Array.isArray(f.technicalBullets) && f.technicalBullets.length >= 4);
check('formatter produces a conclusion + disclaimer', typeof f.conclusion === 'string' && f.conclusion.length > 0 && typeof f.disclaimer === 'string');
check('formatter confidence note clarifies it is data completeness, not prediction', /예측 신뢰도가 아니라/.test(f.confidenceNote));
const fShort = formatMkAiAnalysis(shortRes);
check('formatter honestly reports insufficient (no fabricated sections)', fShort.ok === false && fShort.sections.length === 0);

// ---- No prohibited recommendation / target / stop-loss / probability wording ----
const fullText = JSON.stringify(formatMkAiAnalysis(up)) + JSON.stringify(formatMkAiAnalysis(down)) + JSON.stringify(formatMkAiAnalysis(hv));
const PROHIBITED = ['목표가', '매수', '매도', '손절', '스탑로스', '진입', '청산', '상승 확률', '강력 매수', '반드시 상승', '보장합니다', '매수하세요', '매도하세요'];
const found = PROHIBITED.filter((p) => fullText.includes(p));
check(`no prohibited wording in formatted output (found: ${JSON.stringify(found)})`, found.length === 0);

// ---- No fabrication: match dates in output come from the provided similarity input ----
const inputDates = new Set(simAgg(0.05, 4).matches.map((m) => m.startDate.slice(0, 10)));
check('top match dates are drawn from the provided similarity input', up.dimensions.similarity.topMatches.every((m) => inputDates.has(m.startDate)));

console.log('');
console.log(`SMOKE SUMMARY :: passed=${passed} failed=${failed} total=${passed + failed}`);
if (failed > 0) { console.error('SMOKE RESULT :: FAIL'); process.exit(1); }
console.log('SMOKE RESULT :: PASS');
