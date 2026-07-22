/**
 * Phase 3GG-R-FAST MK AI analysis engine (server-side, pure, deterministic).
 *
 * Consumes ONLY real data already available in the pipeline: the normalized selected instrument, real
 * OHLCV candles, and the real similarity result (Top-K + aggregate forward statistics). Produces a
 * structured analysis object (trend / momentum / volatility / similarity / scenario / risk +
 * deterministic dimension scores + a data-completeness confidence). No network, no credentials, no
 * env, no randomness, no LLM. Never fabricates values; missing inputs degrade to honest nulls and an
 * `insufficient` flag. Descriptive historical statistics only — never predictions or advice.
 */

import {
  MK_AI_ANALYSIS_METHOD_VERSION,
  TREND_LABELS,
  MOMENTUM_LABELS,
  VOLATILITY_LABELS,
  RISK_LABELS,
  SCENARIO_LABELS,
  VOLATILITY_THRESHOLDS,
} from './analysisTypes.mjs';
import {
  finiteCloses,
  sma,
  smaSlope,
  annualizedVolatility,
  acceleration,
  upDayRatio,
  aboveMaRatio,
  trendScore,
  momentumScore,
  volatilityStabilityScore,
  similarityScore,
  riskScore,
  dataCompletenessConfidence,
  swingHigh,
  swingLow,
  round2,
} from './analysisScoring.mjs';

const MIN_BARS_FOR_ANALYSIS = 60;

const classifyTrend = (score) => {
  if (score === null) return 'sideways';
  if (score >= 75) return 'strong_up';
  if (score >= 60) return 'moderate_up';
  if (score > 40) return 'sideways';
  if (score > 25) return 'weak_down';
  return 'strong_down';
};

const classifyMomentum = (score) => {
  if (score === null) return 'steady';
  if (score >= 65) return 'accelerating';
  if (score >= 50) return 'steady';
  if (score >= 35) return 'fading';
  return 'negative';
};

const classifyVolatility = (annualVol) => {
  if (annualVol === null) return 'normal';
  if (annualVol < VOLATILITY_THRESHOLDS.low) return 'low';
  if (annualVol < VOLATILITY_THRESHOLDS.normal) return 'normal';
  if (annualVol < VOLATILITY_THRESHOLDS.high) return 'high';
  return 'extreme';
};

const classifyRisk = (score) => {
  if (score === null) return 'moderate';
  if (score < 30) return 'low';
  if (score < 55) return 'moderate';
  if (score < 75) return 'elevated';
  return 'high';
};

/** Scenario derived ONLY from aggregate similarity forward outcomes (descriptive, not prediction). */
const classifyScenario = (aggregate, matchCount) => {
  const avg20 = aggregate?.averageForwardReturnByWindow?.d20;
  const pos20 = aggregate?.positiveCountByWindow?.d20;
  if (typeof avg20 !== 'number' || !Number.isFinite(avg20) || !matchCount) return 'mixed';
  const posRatio = typeof pos20 === 'number' ? pos20 / matchCount : 0.5;
  if (avg20 > 0.03 && posRatio >= 0.6) return 'recovered';
  if (avg20 < -0.03 && posRatio <= 0.4) return 'deeper_pullback';
  if (Math.abs(avg20) <= 0.03) return 'sideways';
  return 'mixed';
};

const insufficientResult = (instrument, reason) => ({
  ok: false,
  insufficient: true,
  reason,
  methodVersion: MK_AI_ANALYSIS_METHOD_VERSION,
  instrument: instrument
    ? { symbol: instrument.symbol, displayName: instrument.displayName, country: instrument.country, assetType: instrument.assetType, currency: instrument.currency }
    : null,
});

/**
 * @param {{ instrument: object, candles: Array, similarity: object }} input
 * @returns structured deterministic analysis object.
 */
export const runMkAiAnalysis = (input = {}) => {
  const { instrument, candles, similarity } = input;
  const closes = finiteCloses(candles);
  const barCount = closes.length;

  if (!instrument || barCount < MIN_BARS_FOR_ANALYSIS) {
    return insufficientResult(instrument, 'INSUFFICIENT_HISTORY');
  }

  const lastClose = closes[closes.length - 1];
  const sma20 = sma(closes, 20);
  const sma60 = sma(closes, 60);
  const sma120 = sma(closes, 120);
  const slope20 = smaSlope(closes, 20, 20);
  const annualVol20 = annualizedVolatility(closes, 20);
  const annualVol60 = annualizedVolatility(closes, 60);
  const accel = acceleration(closes, 5, 20);
  const upRatio = upDayRatio(closes, 20);
  const aboveRatio = aboveMaRatio(closes, 20);
  const recentSwingHigh20 = swingHigh(candles, 20);
  const recentSwingLow20 = swingLow(candles, 20);

  const trendScoreValue = trendScore({ lastClose, sma20, sma60, slope20 });
  const momentumScoreValue = momentumScore({ accel, upRatio, aboveRatio });
  const volatilityScoreValue = volatilityStabilityScore(annualVol20);

  const matches = Array.isArray(similarity?.matches) ? similarity.matches : [];
  const aggregate = similarity?.aggregate ?? null;
  const matchCount = matches.length;
  const simScoreValue = similarityScore(matches);
  const avgMaxDrawdownPct = typeof aggregate?.averageMaxDrawdownPct === 'number' ? aggregate.averageMaxDrawdownPct : null;
  const avgMaxUpsidePct = typeof aggregate?.averageMaxUpsidePct === 'number' ? aggregate.averageMaxUpsidePct : null;

  const riskScoreValue = riskScore({ annualVol: annualVol20, avgMaxDrawdownPct, trendScoreValue });

  const trendLabel = classifyTrend(trendScoreValue);
  const momentumLabel = classifyMomentum(momentumScoreValue);
  const volatilityLabel = classifyVolatility(annualVol20);
  const riskLabel = classifyRisk(riskScoreValue);
  const scenarioLabel = similarity?.ok ? classifyScenario(aggregate, matchCount) : 'mixed';

  const confidence = dataCompletenessConfidence({
    barCount,
    hasSma60: sma60 !== null,
    hasSma120: sma120 !== null,
    hasVolatility: annualVol20 !== null,
    candidateCount: typeof similarity?.candidateCount === 'number' ? similarity.candidateCount : 0,
    matchCount,
  });

  const pct = (v) => (typeof v === 'number' && Number.isFinite(v) ? round2(v * 100) : null);

  return {
    ok: true,
    insufficient: false,
    methodVersion: MK_AI_ANALYSIS_METHOD_VERSION,
    instrument: {
      symbol: instrument.symbol,
      displayName: instrument.displayName,
      country: instrument.country,
      exchange: instrument.exchange,
      assetType: instrument.assetType,
      currency: instrument.currency,
    },
    dataStatus: {
      barCount,
      similarityOk: similarity?.ok === true,
      candidateCount: typeof similarity?.candidateCount === 'number' ? similarity.candidateCount : 0,
      matchCount,
    },
    dimensions: {
      trend: {
        label: trendLabel,
        labelText: TREND_LABELS[trendLabel],
        score: trendScoreValue,
        metrics: {
          lastClose: round2(lastClose),
          sma20: round2(sma20),
          sma60: round2(sma60),
          sma120: round2(sma120),
          slope20Pct: pct(slope20),
          priceVsSma20Pct: sma20 ? pct((lastClose - sma20) / sma20) : null,
          priceVsSma60Pct: sma60 ? pct((lastClose - sma60) / sma60) : null,
          recentSwingHigh20: round2(recentSwingHigh20),
          recentSwingLow20: round2(recentSwingLow20),
        },
      },
      momentum: {
        label: momentumLabel,
        labelText: MOMENTUM_LABELS[momentumLabel],
        score: momentumScoreValue,
        metrics: {
          accelerationPct: pct(accel),
          upDayRatioPct: pct(upRatio),
          aboveMaRatioPct: pct(aboveRatio),
        },
      },
      volatility: {
        label: volatilityLabel,
        labelText: VOLATILITY_LABELS[volatilityLabel],
        stabilityScore: volatilityScoreValue,
        metrics: {
          annualizedVolatility20Pct: pct(annualVol20),
          annualizedVolatility60Pct: pct(annualVol60),
        },
      },
      similarity: {
        score: simScoreValue,
        matchCount,
        metrics: {
          averageForwardReturn5Pct: pct(aggregate?.averageForwardReturnByWindow?.d5),
          averageForwardReturn20Pct: pct(aggregate?.averageForwardReturnByWindow?.d20),
          medianForwardReturn20Pct: pct(aggregate?.medianForwardReturnByWindow?.d20),
          positiveCount20: aggregate?.positiveCountByWindow?.d20 ?? null,
          averageMaxDrawdownPct: pct(avgMaxDrawdownPct),
          averageMaxUpsidePct: pct(avgMaxUpsidePct),
        },
        topMatches: matches.slice(0, 5).map((m) => ({
          startDate: typeof m.startDate === 'string' ? m.startDate.slice(0, 10) : null,
          endDate: typeof m.endDate === 'string' ? m.endDate.slice(0, 10) : null,
          similarityScore: m.similarityScore ?? null,
        })),
      },
      scenario: {
        label: scenarioLabel,
        labelText: SCENARIO_LABELS[scenarioLabel],
      },
      risk: {
        label: riskLabel,
        labelText: RISK_LABELS[riskLabel],
        score: riskScoreValue,
        metrics: {
          annualizedVolatility20Pct: pct(annualVol20),
          averageMaxDrawdownPct: pct(avgMaxDrawdownPct),
          trendScore: trendScoreValue,
        },
      },
    },
    scores: {
      trend: trendScoreValue,
      momentum: momentumScoreValue,
      volatilityStability: volatilityScoreValue,
      similarity: simScoreValue,
      risk: riskScoreValue,
    },
    dataCompletenessConfidence: confidence,
  };
};
