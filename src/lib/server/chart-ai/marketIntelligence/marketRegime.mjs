/**
 * Phase 3GG-T-FAST — deterministic market-regime engine (pure, client/server-safe).
 *
 * Classifies the broad environment into risk-on / neutral / risk-off / high-volatility-transition /
 * data-insufficient from real deterministic dimensions (benchmark trend + momentum + realized
 * volatility, plus optional FX / commodity context). Documented fixed thresholds + weights. No LLM, no
 * randomness, no future data. Confidence reflects DATA COMPLETENESS + dimension agreement — NOT a
 * forecast. Missing dimensions are excluded, never treated as zero.
 */

import { REGIME_LABELS, THRESHOLDS } from './marketContextTypes.mjs';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round2 = (v) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : null);

/** Map annualized realized volatility to a 0..100 "calm" score (low vol → high). */
const volatilityCalmScore = (annualVol) => {
  if (!Number.isFinite(annualVol)) return null;
  // 0.10 -> ~90, 0.24 -> ~55, 0.40 -> ~25, 0.6+ -> ~0
  return round2(clamp(100 - annualVol * 165, 0, 100));
};

export const classifyMarketRegime = (input = {}) => {
  const { equityTrendScore, equityMomentumPct, annualizedVolatility, fxChangePct, goldChangePct, oilChangePct } = input;

  const dims = [];
  const factors = [];
  const w = THRESHOLDS.regimeWeights;

  const trendScore = Number.isFinite(equityTrendScore) ? clamp(equityTrendScore, 0, 100) : null;
  if (trendScore !== null) {
    dims.push([trendScore, w.trend]);
    factors.push({ key: 'trend', label: '벤치마크 추세', tilt: trendScore >= 55 ? 'risk-on' : trendScore <= 45 ? 'risk-off' : 'neutral', score: trendScore });
  }

  const momScore = Number.isFinite(equityMomentumPct) ? clamp(50 + equityMomentumPct * 3, 0, 100) : null;
  if (momScore !== null) {
    dims.push([momScore, w.momentum]);
    factors.push({ key: 'momentum', label: '벤치마크 모멘텀', tilt: momScore >= 55 ? 'risk-on' : momScore <= 45 ? 'risk-off' : 'neutral', score: round2(momScore) });
  }

  const calm = volatilityCalmScore(annualizedVolatility);
  if (calm !== null) {
    dims.push([calm, w.volatility]);
    factors.push({ key: 'volatility', label: '변동성', tilt: calm >= 55 ? 'risk-on' : calm <= 40 ? 'risk-off' : 'neutral', score: calm });
  }

  // Optional context dimensions (low weight).
  if (Number.isFinite(goldChangePct) || Number.isFinite(oilChangePct)) {
    // Gold up + oil down leans risk-off; oil up + gold flat leans risk-on (growth).
    let commodityScore = 50;
    if (Number.isFinite(goldChangePct)) commodityScore -= clamp(goldChangePct * 1.2, -15, 15);
    if (Number.isFinite(oilChangePct)) commodityScore += clamp(oilChangePct * 0.8, -12, 12);
    commodityScore = clamp(commodityScore, 0, 100);
    dims.push([commodityScore, w.commodity]);
    factors.push({ key: 'commodity', label: '원자재', tilt: commodityScore >= 55 ? 'risk-on' : commodityScore <= 45 ? 'risk-off' : 'neutral', score: round2(commodityScore) });
  }
  if (Number.isFinite(fxChangePct)) {
    // For KR/US context, a weakening KRW (USD/KRW up) is a mild risk-off tilt.
    const fxScore = clamp(50 - fxChangePct * 2, 0, 100);
    dims.push([fxScore, w.fx]);
    factors.push({ key: 'fx', label: '환율(USD/KRW)', tilt: fxScore >= 55 ? 'risk-on' : fxScore <= 45 ? 'risk-off' : 'neutral', score: round2(fxScore) });
  }

  const coreCount = [trendScore, momScore, calm].filter((v) => v !== null).length;
  if (coreCount < 2) {
    return { regime: 'data-insufficient', regimeLabel: REGIME_LABELS['data-insufficient'], riskScore: null, confidence: 0, factors, availableDimensions: dims.length };
  }

  const totalWeight = dims.reduce((s, [, weight]) => s + weight, 0);
  const riskScore = round2(dims.reduce((s, [score, weight]) => s + score * weight, 0) / totalWeight);

  let regime;
  if (Number.isFinite(annualizedVolatility) && annualizedVolatility >= THRESHOLDS.volHigh && (trendScore === null || trendScore < 45)) {
    regime = 'high-vol-transition';
  } else if (riskScore >= 62) regime = 'risk-on';
  else if (riskScore >= 42) regime = 'neutral';
  else regime = 'risk-off';

  // Confidence: completeness (core+optional dims) + directional agreement among factors.
  const tilts = factors.map((f) => f.tilt).filter((t) => t !== 'neutral');
  const on = tilts.filter((t) => t === 'risk-on').length;
  const off = tilts.filter((t) => t === 'risk-off').length;
  const agreement = tilts.length > 0 ? Math.max(on, off) / tilts.length : 0.5;
  const completeness = clamp(dims.length / 5, 0, 1);
  const confidence = round2(clamp((completeness * 0.6 + agreement * 0.4) * 100, 0, 100));

  return { regime, regimeLabel: REGIME_LABELS[regime], riskScore, confidence, factors, availableDimensions: dims.length };
};
