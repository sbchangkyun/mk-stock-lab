/**
 * Phase 3GG-Q-FAST deterministic similarity engine (server-side, pure `.mjs`).
 *
 * Faithful native-JS port of the Phase 3EX chart-similarity engine (`src/lib/chartSimilarity/`),
 * preserving its exact scoring policy (correlation 0.45 / RMSE 0.35 / direction 0.20, clamped
 * 0..100), forward-outcome and normalized-overlay (base 100) math, and warning-based degradation —
 * plus a NEW Top-K min-gap de-duplication so adjacent sliding windows don't fill the Top 5. Pure and
 * deterministic: no network, no credentials, no env, no randomness, no LLM. Importable by both the
 * similarity route (.ts) and the credential-free smoke (.mjs).
 *
 * No look-ahead leakage: similarity is computed only from bars inside each candidate window; forward
 * returns/drawdown/upside are measured strictly AFTER the candidate window end. Descriptive
 * historical statistics only — never predictions.
 */

export const SIMILARITY_METHOD_VERSION = 'sim-v1-corr045-rmse035-dir020';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round2 = (value) => Math.round(value * 100) / 100;
const round4 = (value) => Math.round(value * 10000) / 10000;

const sortBarsAscending = (bars) =>
  bars.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

/** Keeps only bars with finite OHLC, non-null-or-finite volume, positive close, and a date. */
export const validateSimilarityBars = (bars) => {
  const warnings = [];
  let skipped = 0;
  const valid = (Array.isArray(bars) ? bars : []).filter((bar) => {
    const ohlcFinite = [bar?.open, bar?.high, bar?.low, bar?.close].every((v) => Number.isFinite(v));
    const volumeOk = bar?.volume === null || bar?.volume === undefined || Number.isFinite(bar?.volume);
    const closePositive = Number.isFinite(bar?.close) && bar.close > 0;
    const dateOk = typeof bar?.date === 'string' && bar.date.length > 0;
    const ok = ohlcFinite && volumeOk && closePositive && dateOk;
    if (!ok) skipped += 1;
    return ok;
  });
  if (skipped > 0) warnings.push(`${skipped} bar(s) skipped due to non-finite values or non-positive close.`);
  return { valid, warnings };
};

const toLogReturns = (bars) => {
  const out = [];
  for (let i = 1; i < bars.length; i += 1) {
    const prev = bars[i - 1].close;
    const close = bars[i].close;
    if (!Number.isFinite(prev) || prev <= 0 || !Number.isFinite(close) || close <= 0) {
      out.push(0);
      continue;
    }
    const v = Math.log(close / prev);
    out.push(Number.isFinite(v) ? v : 0);
  }
  return out;
};

/** Base-100 normalized close path for overlay rendering. */
export const toNormalizedPriceIndex = (bars, base = 100) => {
  if (bars.length === 0) return [];
  const first = bars[0].close;
  if (!Number.isFinite(first) || first <= 0) return bars.map((_, index) => ({ index, value: base }));
  return bars.map((bar, index) => {
    const close = bar.close;
    const value = Number.isFinite(close) && close > 0 ? base * (close / first) : base;
    return { index, value: round2(value) };
  });
};

const pearsonCorrelation = (a, b) => {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  const sa = a.slice(0, n);
  const sb = b.slice(0, n);
  const ma = sa.reduce((acc, v) => acc + v, 0) / n;
  const mb = sb.reduce((acc, v) => acc + v, 0) / n;
  let cov = 0;
  let va = 0;
  let vb = 0;
  for (let i = 0; i < n; i += 1) {
    const da = sa[i] - ma;
    const db = sb[i] - mb;
    cov += da * db;
    va += da * da;
    vb += db * db;
  }
  if (va === 0 || vb === 0) return 0;
  const v = cov / Math.sqrt(va * vb);
  return Number.isFinite(v) ? clamp(v, -1, 1) : 0;
};

const rmse = (a, b) => {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i += 1) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  const v = Math.sqrt(sum / n);
  return Number.isFinite(v) ? v : 0;
};

const directionMatchPct = (a, b) => {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let matches = 0;
  for (let i = 0; i < n; i += 1) if (Math.sign(a[i]) === Math.sign(b[i])) matches += 1;
  const v = (matches / n) * 100;
  return Number.isFinite(v) ? v : 0;
};

/** Combined 0..100 similarity score: corr 0.45 + rmse 0.35 + direction 0.20 (Phase 3EX policy). */
export const computeSimilarityScore = (currentReturns, candidateReturns) => {
  const correlation = pearsonCorrelation(currentReturns, candidateReturns);
  const rmseValue = rmse(currentReturns, candidateReturns);
  const directionMatch = directionMatchPct(currentReturns, candidateReturns);
  const corrScore = clamp(((correlation + 1) / 2) * 100, 0, 100);
  const epsilon = 1e-6;
  const scale =
    currentReturns.length > 0
      ? Math.max(epsilon, currentReturns.reduce((acc, v) => acc + Math.abs(v), 0) / currentReturns.length)
      : epsilon;
  const rmseScore = clamp(100 - (rmseValue / scale) * 100, 0, 100);
  const directionScore = clamp(directionMatch, 0, 100);
  const similarityScore = clamp(corrScore * 0.45 + rmseScore * 0.35 + directionScore * 0.2, 0, 100);
  return {
    correlation: round4(correlation),
    corrScore: round2(corrScore),
    rmse: round4(rmseValue),
    rmseScore: round2(rmseScore),
    directionMatchPct: round2(directionMatch),
    directionScore: round2(directionScore),
    similarityScore: round2(similarityScore),
  };
};

export const computeForwardReturn = (bars, endIndex, forwardWindow) => {
  if (endIndex < 0 || endIndex >= bars.length) return null;
  const target = endIndex + forwardWindow;
  if (target <= endIndex || target >= bars.length) return null;
  const base = bars[endIndex].close;
  const targetClose = bars[target].close;
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(targetClose)) return null;
  const v = (targetClose - base) / base;
  return Number.isFinite(v) ? v : null;
};

export const computeForwardOutcome = (bars, endIndex, forwardWindows) => {
  const forwardReturns = {};
  for (const w of forwardWindows) forwardReturns[`d${w}`] = computeForwardReturn(bars, endIndex, w);
  const maxForward = forwardWindows.length > 0 ? Math.max(...forwardWindows) : 0;
  const base = bars[endIndex]?.close;
  let maxDrawdownPct = null;
  let maxUpsidePct = null;
  if (Number.isFinite(base) && base > 0 && maxForward > 0) {
    const horizonEnd = Math.min(endIndex + maxForward, bars.length - 1);
    if (horizonEnd > endIndex) {
      let minPct = 0;
      let maxPct = 0;
      for (let i = endIndex + 1; i <= horizonEnd; i += 1) {
        const close = bars[i].close;
        if (!Number.isFinite(close) || close <= 0) continue;
        const pct = (close - base) / base;
        if (pct < minPct) minPct = pct;
        if (pct > maxPct) maxPct = pct;
      }
      maxDrawdownPct = minPct;
      maxUpsidePct = maxPct;
    }
  }
  return { forwardReturns, maxDrawdownPct, maxUpsidePct };
};

const average = (values) => {
  const valid = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (valid.length === 0) return null;
  return valid.reduce((acc, v) => acc + v, 0) / valid.length;
};

const median = (values) => {
  const valid = values.filter((v) => typeof v === 'number' && Number.isFinite(v)).slice().sort((a, b) => a - b);
  if (valid.length === 0) return null;
  const mid = Math.floor(valid.length / 2);
  return valid.length % 2 === 0 ? (valid[mid - 1] + valid[mid]) / 2 : valid[mid];
};

export const summarizeMatches = (matches, forwardWindows) => {
  const averageForwardReturnByWindow = {};
  const medianForwardReturnByWindow = {};
  const positiveCountByWindow = {};
  const negativeCountByWindow = {};
  for (const w of forwardWindows) {
    const key = `d${w}`;
    const values = matches.map((m) => m.forwardOutcome.forwardReturns[key] ?? null);
    averageForwardReturnByWindow[key] = average(values);
    medianForwardReturnByWindow[key] = median(values);
    positiveCountByWindow[key] = values.filter((v) => typeof v === 'number' && v > 0).length;
    negativeCountByWindow[key] = values.filter((v) => typeof v === 'number' && v < 0).length;
  }
  return {
    matchCount: matches.length,
    averageForwardReturnByWindow,
    medianForwardReturnByWindow,
    positiveCountByWindow,
    negativeCountByWindow,
    averageMaxDrawdownPct: average(matches.map((m) => m.forwardOutcome.maxDrawdownPct)),
    averageMaxUpsidePct: average(matches.map((m) => m.forwardOutcome.maxUpsidePct)),
  };
};

const DEFAULT_OPTIONS = {
  baseWindow: 20,
  forwardWindows: [5, 20, 60],
  topK: 5,
  minGapBars: 10,
};

const sanitizeOptions = (options = {}) => {
  const warnings = [];
  const toInt = (v, fallback) => {
    const n = Number(v);
    return Number.isFinite(n) && Number.isInteger(n) && n > 0 ? n : fallback;
  };
  const baseWindow = toInt(options.baseWindow, DEFAULT_OPTIONS.baseWindow);
  const forwardWindows = Array.isArray(options.forwardWindows)
    ? [...new Set(options.forwardWindows.map(Number).filter((n) => Number.isInteger(n) && n > 0))].sort((a, b) => a - b)
    : [...DEFAULT_OPTIONS.forwardWindows];
  const topK = toInt(options.topK, DEFAULT_OPTIONS.topK);
  const minGapBars = Number.isFinite(Number(options.minGapBars)) && Number(options.minGapBars) >= 0
    ? Math.floor(Number(options.minGapBars))
    : DEFAULT_OPTIONS.minGapBars;
  if (forwardWindows.length === 0) {
    forwardWindows.push(...DEFAULT_OPTIONS.forwardWindows);
    warnings.push('forwardWindows was empty/invalid; restored defaults.');
  }
  return { baseWindow, forwardWindows, topK, minGapBars, warnings };
};

/**
 * Runs the full deterministic similarity scan over real bars.
 * Returns { ok, currentWindow, currentNormalizedPath, matches, aggregate, candidateCount, warnings,
 * methodVersion, insufficientHistory }.
 */
export const runRealSimilarity = (rawBars, options = {}) => {
  const { baseWindow, forwardWindows, topK, minGapBars, warnings: optWarnings } = sanitizeOptions(options);
  const warnings = [...optWarnings];

  const { valid, warnings: validationWarnings } = validateSimilarityBars(rawBars);
  warnings.push(...validationWarnings);
  const bars = sortBarsAscending(valid);
  const n = bars.length;

  const maxForward = Math.max(...forwardWindows);
  const emptyAggregate = summarizeMatches([], forwardWindows);

  // Need: baseWindow (current) + baseWindow (>=1 candidate) + maxForward future + gap. Enforce a real
  // minimum so we never fabricate a result from too little history.
  const minRequiredBars = baseWindow * 2 + maxForward + 1;
  if (n < minRequiredBars) {
    warnings.push(`Insufficient history: have ${n} bars, need at least ${minRequiredBars}.`);
    return {
      ok: false,
      insufficientHistory: true,
      currentWindow: null,
      currentNormalizedPath: [],
      matches: [],
      aggregate: emptyAggregate,
      candidateCount: 0,
      historyBarCount: n,
      warnings,
      methodVersion: SIMILARITY_METHOD_VERSION,
    };
  }

  const currentStart = n - baseWindow;
  const currentBars = bars.slice(currentStart, n);
  const currentReturns = toLogReturns(currentBars);
  const currentWindow = {
    startDate: currentBars[0].date,
    endDate: currentBars[currentBars.length - 1].date,
    barCount: currentBars.length,
  };
  const currentNormalizedPath = toNormalizedPriceIndex(currentBars, 100);

  // Candidate windows: same length, ending before the current window minus a forward buffer so a
  // candidate's forward horizon never touches the current window (excludeRecent = maxForward).
  const excludeRecent = maxForward;
  const exclusionBoundary = currentStart - excludeRecent;
  const maxEndForFuture = n - 1 - maxForward;

  const scored = [];
  for (let endIndex = baseWindow - 1; endIndex < exclusionBoundary; endIndex += 1) {
    if (endIndex > maxEndForFuture) break;
    const startIndex = endIndex - baseWindow + 1;
    if (startIndex < 0) continue;
    const candBars = bars.slice(startIndex, endIndex + 1);
    const scoreParts = computeSimilarityScore(currentReturns, toLogReturns(candBars));
    const forwardOutcome = computeForwardOutcome(bars, endIndex, forwardWindows);
    scored.push({
      startIndex,
      endIndex,
      startDate: candBars[0].date,
      endDate: candBars[candBars.length - 1].date,
      scoreParts,
      forwardOutcome,
      normalizedPath: toNormalizedPriceIndex(candBars, 100),
    });
  }

  const candidateCount = scored.length;
  if (candidateCount === 0) {
    warnings.push('No valid candidate windows after exclusion and forward-data requirements.');
    return {
      ok: false,
      insufficientHistory: true,
      currentWindow,
      currentNormalizedPath,
      matches: [],
      aggregate: emptyAggregate,
      candidateCount: 0,
      historyBarCount: n,
      warnings,
      methodVersion: SIMILARITY_METHOD_VERSION,
    };
  }

  // Deterministic ordering: score desc, correlation desc, earliest startDate, earliest index.
  scored.sort((a, b) => {
    if (b.scoreParts.similarityScore !== a.scoreParts.similarityScore) {
      return b.scoreParts.similarityScore - a.scoreParts.similarityScore;
    }
    if (b.scoreParts.correlation !== a.scoreParts.correlation) {
      return b.scoreParts.correlation - a.scoreParts.correlation;
    }
    if (a.startDate !== b.startDate) return a.startDate < b.startDate ? -1 : 1;
    return a.startIndex - b.startIndex;
  });

  // Top-K with a minimum start-index gap so near-duplicate adjacent windows don't dominate.
  const selected = [];
  for (const entry of scored) {
    if (selected.length >= topK) break;
    if (selected.every((s) => Math.abs(s.startIndex - entry.startIndex) >= minGapBars)) {
      selected.push(entry);
    }
  }

  const matches = selected.map((entry, index) => ({
    rank: index + 1,
    startDate: entry.startDate,
    endDate: entry.endDate,
    similarityScore: entry.scoreParts.similarityScore,
    scoreParts: entry.scoreParts,
    forwardOutcome: entry.forwardOutcome,
    normalizedPath: entry.normalizedPath,
  }));

  return {
    ok: matches.length > 0,
    insufficientHistory: false,
    currentWindow,
    currentNormalizedPath,
    matches,
    aggregate: summarizeMatches(matches, forwardWindows),
    candidateCount,
    historyBarCount: n,
    warnings,
    methodVersion: SIMILARITY_METHOD_VERSION,
  };
};
