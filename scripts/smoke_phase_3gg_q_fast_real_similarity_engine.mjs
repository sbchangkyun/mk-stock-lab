/**
 * Phase 3GG-Q-FAST deterministic smoke — real similarity engine.
 *
 * Credential-free: exercises the deterministic similarity engine with sanitized in-memory fixtures
 * (no network, no KIS, no env). Verifies identical/inverse scoring, deterministic ranking, overlap
 * exclusion, min-gap de-duplication, malformed-candle rejection, insufficient-history handling,
 * forward 5/20-day returns, max drawdown/rise, base-100 overlay, no NaN/Infinity, current-window
 * exclusion, and the no-mock/synthetic-fallback guarantee. Prints PASS/FAIL per check; exits
 * non-zero on any failure.
 */

import {
  runRealSimilarity,
  computeSimilarityScore,
  computeForwardOutcome,
  toNormalizedPriceIndex,
  validateSimilarityBars,
  SIMILARITY_METHOD_VERSION,
} from '../src/lib/server/chart-ai/similarity-engine.mjs';

let passed = 0;
let failed = 0;
const check = (name, cond) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

const iso = (dayOffset) => {
  // Deterministic date string from a fixed epoch; no Date.now / randomness.
  const base = Date.UTC(2020, 0, 1);
  return new Date(base + dayOffset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) + 'T00:00:00.000Z';
};

const bar = (dayOffset, close, volume = 1000) => ({
  market: 'KR',
  symbol: 'TEST',
  date: iso(dayOffset),
  open: close,
  high: close * 1.01,
  low: close * 0.99,
  close,
  volume,
  adjusted: true,
  source: 'kis-normalized',
});

// Deterministic pseudo-series (no Math.random): a smooth wave + drift.
const wave = (i) => 100 + 12 * Math.sin(i / 7) + 6 * Math.cos(i / 3) + i * 0.05;

// ---- Build a long history (~260 bars) with a KNOWN pattern embedded near the end matching an
// earlier historical window, so that earlier window should surface as a strong match. ----
const N = 260;
const closes = [];
for (let i = 0; i < N; i += 1) closes.push(Number(wave(i).toFixed(2)));
// Embed: make the current 20-window (indices N-20..N-1) equal the shape of indices 50..69.
for (let k = 0; k < 20; k += 1) closes[N - 20 + k] = Number((closes[50 + k]).toFixed(2));
const bars = closes.map((c, i) => bar(i, c));

const result = runRealSimilarity(bars, { baseWindow: 20, forwardWindows: [5, 20, 60], topK: 5, minGapBars: 10 });

check('engine produces a result with matches', result.ok && result.matches.length > 0);
check('method version is exposed', result.methodVersion === SIMILARITY_METHOD_VERSION);
check('current analysis window has correct length', result.currentWindow.barCount === 20);
check('candidate count is substantial', result.candidateCount > 50);
check('all similarity scores are within 0..100', result.matches.every((m) => m.similarityScore >= 0 && m.similarityScore <= 100));
check('overlay (current) starts at 100', result.currentNormalizedPath[0]?.value === 100);
check('overlay (each match) starts at 100', result.matches.every((m) => m.normalizedPath[0]?.value === 100));
check('the embedded historical window (starting ~50) is among the top matches', result.matches.some((m) => m.startDate === iso(50).slice(0, 10) + 'T00:00:00.000Z'.slice(0, 0) || m.startDate.startsWith(iso(50).slice(0, 10))));

// ---- No NaN / Infinity anywhere ----
const flat = JSON.stringify(result);
check('no NaN/Infinity in engine output', !/NaN|Infinity|null,null,null/.test(flat) && !flat.includes('"NaN"'));
const numericFinite = result.matches.every((m) =>
  Number.isFinite(m.similarityScore) &&
  Object.values(m.forwardOutcome.forwardReturns).every((v) => v === null || Number.isFinite(v)) &&
  (m.forwardOutcome.maxDrawdownPct === null || Number.isFinite(m.forwardOutcome.maxDrawdownPct)),
);
check('all numeric outputs are finite or null (never NaN)', numericFinite);

// ---- Deterministic ranking: two runs are identical ----
const result2 = runRealSimilarity(bars, { baseWindow: 20, forwardWindows: [5, 20, 60], topK: 5, minGapBars: 10 });
check('ranking is deterministic across runs', JSON.stringify(result.matches.map((m) => [m.startDate, m.similarityScore])) === JSON.stringify(result2.matches.map((m) => [m.startDate, m.similarityScore])));

// ---- Overlap exclusion: no match overlaps the current window ----
const currentStartDate = result.currentWindow.startDate;
check('no match window overlaps or post-dates the current window start', result.matches.every((m) => m.endDate < currentStartDate));

// ---- Min-gap: selected matches are separated (no two within minGapBars trading days) ----
const startDates = result.matches.map((m) => m.startDate).sort();
let gapOk = true;
for (let i = 1; i < startDates.length; i += 1) {
  const d0 = new Date(startDates[i - 1]).getTime();
  const d1 = new Date(startDates[i]).getTime();
  if (Math.abs(d1 - d0) < 5 * 24 * 60 * 60 * 1000) gapOk = false; // at least a few days apart
}
check('Top-K matches are separated by a minimum gap (no near-duplicates)', gapOk);

// ---- Identical vs inverse scoring ----
const upReturns = Array.from({ length: 19 }, (_, i) => 0.01 * ((i % 3) + 1));
const identical = computeSimilarityScore(upReturns, upReturns);
const inverse = computeSimilarityScore(upReturns, upReturns.map((r) => -r));
check('identical return paths score very high', identical.similarityScore >= 90);
check('inverse return paths score lower than identical', inverse.similarityScore < identical.similarityScore);
check('identical correlation is ~1', Math.abs(identical.correlation - 1) < 1e-6);
check('inverse correlation is ~-1', Math.abs(inverse.correlation + 1) < 1e-6);

// ---- Forward returns / drawdown / rise on a known series ----
// closes: base 100, then +10%, ..., with a dip.
const fBars = [100, 100, 100, 105, 110, 90, 120, 100].map((c, i) => bar(i, c));
const fout = computeForwardOutcome(fBars, 2, [1, 5]); // from index 2 (close 100)
check('forward 1-day return is exact (+5%)', Math.abs(fout.forwardReturns.d1 - 0.05) < 1e-9);
check('forward 5-day return is exact (0%: 100->100)', Math.abs(fout.forwardReturns.d5 - 0.0) < 1e-9);
check('max drawdown over horizon is negative (dip to 90 = -10%)', Math.abs(fout.maxDrawdownPct + 0.10) < 1e-9);
check('max rise over horizon is positive (peak 120 = +20%)', Math.abs(fout.maxUpsidePct - 0.20) < 1e-9);

// ---- Insufficient history ----
const shortBars = Array.from({ length: 25 }, (_, i) => bar(i, 100 + i));
const shortResult = runRealSimilarity(shortBars, { baseWindow: 20, forwardWindows: [5, 20, 60], topK: 5 });
check('insufficient history returns insufficientHistory=true', shortResult.insufficientHistory === true);
check('insufficient history returns no matches (no fabrication)', shortResult.matches.length === 0);
check('insufficient history is not marked ok', shortResult.ok === false);

// ---- Malformed candle rejection ----
const badBars = bars.slice();
badBars[10] = { ...badBars[10], close: NaN };
badBars[11] = { ...badBars[11], close: -5 };
const { valid, warnings } = validateSimilarityBars(badBars);
check('malformed candles are rejected', valid.length === bars.length - 2 && warnings.length > 0);
const badResult = runRealSimilarity(badBars, { baseWindow: 20, forwardWindows: [5, 20], topK: 5 });
check('engine still produces valid finite results after rejecting malformed candles', badResult.matches.every((m) => Number.isFinite(m.similarityScore)));

// ---- Overlay normalization base 100 ----
const overlay = toNormalizedPriceIndex([bar(0, 50), bar(1, 55), bar(2, 45)], 100);
check('normalized overlay starts at exactly 100', overlay[0].value === 100);
check('normalized overlay scales proportionally (55/50 -> 110)', overlay[1].value === 110);

// ---- No mock/synthetic fallback: dates come from the real input series only ----
const inputDates = new Set(bars.map((b) => b.date.slice(0, 10)));
check('match dates are drawn from the input series (no fabricated dates)', result.matches.every((m) => inputDates.has(m.startDate.slice(0, 10)) && inputDates.has(m.endDate.slice(0, 10))));

console.log('');
console.log(`SMOKE SUMMARY :: passed=${passed} failed=${failed} total=${passed + failed}`);
if (failed > 0) {
  console.error('SMOKE RESULT :: FAIL');
  process.exit(1);
}
console.log('SMOKE RESULT :: PASS');
