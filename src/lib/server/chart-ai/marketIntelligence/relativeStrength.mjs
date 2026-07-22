/**
 * Phase 3GG-T-FAST — deterministic relative-strength engine (pure, client/server-safe).
 *
 * Compares two real close series (selected vs benchmark, or selected vs sector) by aligning on common
 * trading dates (inner join) and measuring cumulative-return gaps over 1m/3m/6m windows. Handles
 * missing dates / holiday mismatch / insufficient overlap honestly (returns available:false). Never
 * compares across currencies without an explicit FX method — the caller must pass currencyMatch. No
 * randomness, no future data, no NaN/Infinity. These are descriptive strength labels, never buy/sell
 * signals or alpha forecasts.
 */

import { RS_WINDOWS, RS_LABELS, THRESHOLDS } from './marketContextTypes.mjs';

const round2 = (v) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : null);

/** Align two [{date, close}] series on shared dates, ascending. */
const alignSeries = (a, b) => {
  const mapB = new Map();
  for (const p of Array.isArray(b) ? b : []) {
    if (p && typeof p.date === 'string' && Number.isFinite(p.close) && p.close > 0) mapB.set(p.date.slice(0, 10), p.close);
  }
  const out = [];
  for (const p of Array.isArray(a) ? a : []) {
    if (!p || typeof p.date !== 'string' || !(Number.isFinite(p.close) && p.close > 0)) continue;
    const key = p.date.slice(0, 10);
    if (mapB.has(key)) out.push({ date: key, a: p.close, b: mapB.get(key) });
  }
  out.sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
  return out;
};

const windowReturn = (values, window) => {
  const n = values.length;
  if (n < window + 1) return null;
  const base = values[n - 1 - window];
  const last = values[n - 1];
  if (!(base > 0) || !Number.isFinite(last)) return null;
  return (last - base) / base;
};

const classify = (primaryDiffPct, consistency) => {
  if (primaryDiffPct === null) return 'neutral';
  const s = THRESHOLDS.rsStrongPct;
  const m = THRESHOLDS.rsModeratePct;
  if (primaryDiffPct >= s && consistency >= 0.6) return 'strong_out';
  if (primaryDiffPct >= m) return 'moderate_out';
  if (primaryDiffPct <= -s && consistency >= 0.6) return 'strong_under';
  if (primaryDiffPct <= -m) return 'moderate_under';
  return 'neutral';
};

/**
 * @param selected [{date, close}] (real)
 * @param benchmark [{date, close}] (real, same currency)
 * @param opts { currencyMatch:boolean }
 */
export const computeRelativeStrength = (selected, benchmark, opts = {}) => {
  if (opts.currencyMatch === false) {
    return { available: false, reason: 'currency-mismatch', reasonText: '통화가 달라 직접 비교하지 않습니다.', windows: {}, classification: 'neutral' };
  }
  const aligned = alignSeries(selected, benchmark);
  const minWindow = Math.min(...RS_WINDOWS);
  if (aligned.length < minWindow + 1) {
    return { available: false, reason: 'insufficient-overlap', reasonText: '겹치는 거래일이 부족합니다.', windows: {}, classification: 'neutral', alignedPoints: aligned.length };
  }
  const selVals = aligned.map((p) => p.a);
  const benVals = aligned.map((p) => p.b);

  const windows = {};
  const diffs = [];
  for (const w of RS_WINDOWS) {
    const selRet = windowReturn(selVals, w);
    const benRet = windowReturn(benVals, w);
    if (selRet === null || benRet === null) {
      windows[w] = { available: false };
      continue;
    }
    const diffPct = (selRet - benRet) * 100;
    windows[w] = {
      available: true,
      selectedReturnPct: round2(selRet * 100),
      benchmarkReturnPct: round2(benRet * 100),
      diffPct: round2(diffPct),
    };
    diffs.push(diffPct);
  }

  const primary = windows[63] && windows[63].available ? windows[63].diffPct : (diffs.length ? diffs[diffs.length - 1] : null);
  const positive = diffs.filter((d) => d > 0).length;
  const negative = diffs.filter((d) => d < 0).length;
  const consistency = diffs.length > 0 ? Math.max(positive, negative) / diffs.length : 0;
  const classification = classify(primary, consistency);

  return {
    available: diffs.length > 0,
    windows,
    primaryDiffPct: round2(primary),
    consistencyPct: round2(consistency * 100),
    classification,
    classificationLabel: RS_LABELS[classification],
    alignedPoints: aligned.length,
  };
};
