/**
 * Phase 3GG-R-FAST MK AI analysis — deterministic scoring primitives.
 *
 * Pure math over real close prices + real similarity aggregates. No randomness, no LLM, no network.
 * All functions are null/short-input safe and never return NaN/Infinity. Every score is normalized
 * to 0..100 and is DESCRIPTIVE, not predictive. Overall confidence reflects DATA COMPLETENESS only.
 */

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const round2 = (v) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : null);

export const finiteCloses = (candles) =>
  (Array.isArray(candles) ? candles : [])
    .map((c) => (c && typeof c.close === 'number' && Number.isFinite(c.close) && c.close > 0 ? c.close : null))
    .filter((v) => v !== null);

/** Simple moving average of the last `window` closes ending at index `endIndex` (inclusive). */
export const sma = (closes, window, endIndex = closes.length - 1) => {
  if (!Array.isArray(closes) || window <= 0 || endIndex < window - 1 || endIndex >= closes.length) return null;
  let sum = 0;
  for (let i = endIndex - window + 1; i <= endIndex; i += 1) sum += closes[i];
  const v = sum / window;
  return Number.isFinite(v) ? v : null;
};

/** Daily log returns from a close array. */
export const logReturns = (closes) => {
  const out = [];
  for (let i = 1; i < closes.length; i += 1) {
    const prev = closes[i - 1];
    const cur = closes[i];
    if (prev > 0 && cur > 0) out.push(Math.log(cur / prev));
  }
  return out;
};

/** Annualized realized volatility from the last `window` daily returns (× sqrt(252)). */
export const annualizedVolatility = (closes, window = 20) => {
  const rets = logReturns(closes);
  if (rets.length < 2) return null;
  const recent = rets.slice(-window);
  if (recent.length < 2) return null;
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  const variance = recent.reduce((a, b) => a + (b - mean) ** 2, 0) / recent.length;
  const daily = Math.sqrt(variance);
  const annual = daily * Math.sqrt(252);
  return Number.isFinite(annual) ? annual : null;
};

/** Fractional change of the short MA between `endIndex` and `endIndex - lookback`. */
export const smaSlope = (closes, window, lookback) => {
  const now = sma(closes, window, closes.length - 1);
  const then = sma(closes, window, closes.length - 1 - lookback);
  if (now === null || then === null || then <= 0) return null;
  const v = (now - then) / then;
  return Number.isFinite(v) ? v : null;
};

/** Fraction of up-days over the last `window` sessions (price persistence). 0..1. */
export const upDayRatio = (closes, window = 20) => {
  if (closes.length < 2) return null;
  const start = Math.max(1, closes.length - window);
  let up = 0;
  let total = 0;
  for (let i = start; i < closes.length; i += 1) {
    total += 1;
    if (closes[i] > closes[i - 1]) up += 1;
  }
  return total > 0 ? up / total : null;
};

/** Fraction of the last `window` sessions where close is above SMA(window). Trend consistency. 0..1. */
export const aboveMaRatio = (closes, window = 20) => {
  if (closes.length < window + 1) return null;
  let above = 0;
  let total = 0;
  for (let i = closes.length - window; i < closes.length; i += 1) {
    const m = sma(closes, window, i);
    if (m === null) continue;
    total += 1;
    if (closes[i] > m) above += 1;
  }
  return total > 0 ? above / total : null;
};

/** Recent acceleration: last `fast`-day mean return minus prior `slow`-day mean return. */
export const acceleration = (closes, fast = 5, slow = 20) => {
  const rets = logReturns(closes);
  if (rets.length < slow + fast) return null;
  const recentFast = rets.slice(-fast);
  const prior = rets.slice(-(slow + fast), -fast);
  if (recentFast.length === 0 || prior.length === 0) return null;
  const meanFast = recentFast.reduce((a, b) => a + b, 0) / recentFast.length;
  const meanPrior = prior.reduce((a, b) => a + b, 0) / prior.length;
  const v = meanFast - meanPrior;
  return Number.isFinite(v) ? v : null;
};

// ---- Normalized 0..100 dimension scores (descriptive) ----

/**
 * Trend score: blends price-vs-MA gaps and short-MA slope into 0..100 (50 = neutral/sideways).
 * Contributions are PROPORTIONAL to the magnitude of each gap, so a near-flat series stays near 50
 * (small oscillations do not flip it into a strong trend).
 */
export const trendScore = ({ lastClose, sma20, sma60, slope20 }) => {
  let score = 50;
  const rel = (a, b) => (a !== null && b !== null && b > 0 ? (a - b) / b : null);
  const r20 = rel(lastClose, sma20);
  const r2060 = rel(sma20, sma60);
  const r60 = rel(lastClose, sma60);
  if (r20 !== null) score += clamp(r20 * 300, -12, 12);
  if (r2060 !== null) score += clamp(r2060 * 300, -14, 14);
  if (r60 !== null) score += clamp(r60 * 200, -10, 10);
  if (slope20 !== null) score += clamp(slope20 * 200, -20, 20);
  return round2(clamp(score, 0, 100));
};

/** Momentum score from acceleration + persistence + consistency. 0..100. */
export const momentumScore = ({ accel, upRatio, aboveRatio }) => {
  let score = 50;
  if (accel !== null) score += clamp(accel * 1500, -20, 20);
  if (upRatio !== null) score += (upRatio - 0.5) * 40;
  if (aboveRatio !== null) score += (aboveRatio - 0.5) * 20;
  return round2(clamp(score, 0, 100));
};

/** Volatility "stability" score: higher volatility → lower score. 0..100. */
export const volatilityStabilityScore = (annualVol) => {
  if (annualVol === null) return null;
  // 0.10 vol -> ~90, 0.30 -> ~55, 0.55 -> ~25, 1.0+ -> ~0
  const score = 100 - clamp(annualVol * 120, 0, 100);
  return round2(clamp(score, 0, 100));
};

/** Similarity dimension score: mean Top-K similarity score (already 0..100). */
export const similarityScore = (matches) => {
  const scores = (Array.isArray(matches) ? matches : [])
    .map((m) => m && m.similarityScore)
    .filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (scores.length === 0) return null;
  const v = scores.reduce((a, b) => a + b, 0) / scores.length;
  return round2(clamp(v, 0, 100));
};

/** Risk score (higher = riskier) from volatility, aggregate drawdown, and trend weakness. 0..100. */
export const riskScore = ({ annualVol, avgMaxDrawdownPct, trendScoreValue }) => {
  let score = 0;
  let terms = 0;
  if (annualVol !== null) { score += clamp(annualVol * 130, 0, 100); terms += 1; }
  if (avgMaxDrawdownPct !== null) { score += clamp(Math.abs(avgMaxDrawdownPct) * 300, 0, 100); terms += 1; }
  if (trendScoreValue !== null) { score += clamp((50 - trendScoreValue) * 1.4 + 30, 0, 100); terms += 1; }
  if (terms === 0) return null;
  return round2(clamp(score / terms, 0, 100));
};

/**
 * Overall DATA-COMPLETENESS confidence (0..100) — NOT prediction confidence. Reflects how much real
 * input was available: history depth, MA availability, volatility, and similarity candidate coverage.
 */
export const dataCompletenessConfidence = ({ barCount, hasSma60, hasSma120, hasVolatility, candidateCount, matchCount }) => {
  let points = 0;
  let max = 0;
  const add = (cond, weight) => { max += weight; if (cond) points += weight; };
  add(barCount >= 250, 25);
  add(barCount >= 120, 10);
  add(hasSma60, 15);
  add(hasSma120, 10);
  add(hasVolatility, 15);
  add(candidateCount >= 100, 15);
  add(matchCount >= 3, 10);
  return max > 0 ? round2(clamp((points / max) * 100, 0, 100)) : 0;
};

/** Highest `high` over the last `window` candles ending at `endIndex` (inclusive). Null-safe. */
export const swingHigh = (candles, window, endIndex = (Array.isArray(candles) ? candles.length - 1 : -1)) => {
  if (!Array.isArray(candles) || window <= 0 || endIndex < 0 || endIndex >= candles.length) return null;
  const start = Math.max(0, endIndex - window + 1);
  let max = null;
  for (let i = start; i <= endIndex; i += 1) {
    const h = candles[i] && candles[i].high;
    if (typeof h === 'number' && Number.isFinite(h)) max = max === null ? h : Math.max(max, h);
  }
  return max;
};

/** Lowest `low` over the last `window` candles ending at `endIndex` (inclusive). Null-safe. */
export const swingLow = (candles, window, endIndex = (Array.isArray(candles) ? candles.length - 1 : -1)) => {
  if (!Array.isArray(candles) || window <= 0 || endIndex < 0 || endIndex >= candles.length) return null;
  const start = Math.max(0, endIndex - window + 1);
  let min = null;
  for (let i = start; i <= endIndex; i += 1) {
    const l = candles[i] && candles[i].low;
    if (typeof l === 'number' && Number.isFinite(l)) min = min === null ? l : Math.min(min, l);
  }
  return min;
};

export { clamp, round2 };
