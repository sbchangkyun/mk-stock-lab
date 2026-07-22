/**
 * Forward outcome calculation for the chart similarity engine (Phase 3EX-B).
 *
 * Forward return/drawdown/upside are always measured from a candidate window's end bar forward
 * in time (never backward), so there is no future-data leakage into the similarity score itself.
 * Insufficient future data yields `null`, never NaN/Infinity.
 */

import type { ForwardOutcome, OhlcBar } from './types';

export const computeForwardReturn = (
  bars: OhlcBar[],
  candidateEndIndex: number,
  forwardWindow: number,
): number | null => {
  if (candidateEndIndex < 0 || candidateEndIndex >= bars.length) return null;
  const targetIndex = candidateEndIndex + forwardWindow;
  if (targetIndex < candidateEndIndex || targetIndex >= bars.length) return null;

  const baseClose = bars[candidateEndIndex].close;
  const targetClose = bars[targetIndex].close;
  if (!Number.isFinite(baseClose) || baseClose <= 0 || !Number.isFinite(targetClose)) return null;

  const value = (targetClose - baseClose) / baseClose;
  return Number.isFinite(value) ? value : null;
};

export const computeForwardOutcome = (
  bars: OhlcBar[],
  candidateEndIndex: number,
  forwardWindows: number[],
): ForwardOutcome => {
  const forwardReturns: Record<string, number | null> = {};
  for (const window of forwardWindows) {
    forwardReturns[`d${window}`] = computeForwardReturn(bars, candidateEndIndex, window);
  }

  const maxForwardWindow = forwardWindows.length > 0 ? Math.max(...forwardWindows) : 0;
  const baseClose = bars[candidateEndIndex]?.close;

  let maxDrawdownPct: number | null = null;
  let maxUpsidePct: number | null = null;

  if (Number.isFinite(baseClose) && baseClose > 0 && maxForwardWindow > 0) {
    const horizonEnd = Math.min(candidateEndIndex + maxForwardWindow, bars.length - 1);
    if (horizonEnd > candidateEndIndex) {
      let minPct = 0;
      let maxPct = 0;
      for (let i = candidateEndIndex + 1; i <= horizonEnd; i += 1) {
        const close = bars[i].close;
        if (!Number.isFinite(close) || close <= 0) continue;
        const pct = (close - baseClose) / baseClose;
        if (pct < minPct) minPct = pct;
        if (pct > maxPct) maxPct = pct;
      }
      maxDrawdownPct = minPct;
      maxUpsidePct = maxPct;
    }
  }

  return { forwardReturns, maxDrawdownPct, maxUpsidePct };
};
