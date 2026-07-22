/**
 * Phase 3GG-T-HF3B-HF2-HF2B smoke — Similarity explainability UX (pure, no network / no credentials).
 *
 * Exercises: (1) the engine candidateRank/candidateTopPercentile metadata + unchanged scoring, (2) the
 * score-guide band boundaries, (3) the deterministic insight decision tree across the required fixture
 * cases, (4) the overlay tooltip metadata + pixel-nearest + ordering helpers, and (5) the non-advisory
 * language guarantee. Deterministic: no Date.now / Math.random / fetch / env.
 */

import {
  runRealSimilarity,
  computeSimilarityScore,
  SIMILARITY_METHOD_VERSION,
} from '../src/lib/server/chart-ai/similarity-engine.mjs';
import {
  classifyScoreBand,
  buildScoreGuide,
  buildCandidatePosition,
  buildEvidenceLevel,
  buildFinalInsight,
  buildSimilarityInsight,
  buildSimilarityExplainability,
  buildOverlaySeries,
  resolveVisibleTooltipValues,
  orderTooltipRowsByHighlight,
  resolveNearestSeriesByPixel,
  buildMatchRows,
  EVIDENCE_THRESHOLDS,
  INSIGHT_THRESHOLDS,
  SCORE_BANDS,
} from '../src/lib/chart-ai/similarity-explainability-v2.mjs';

let passed = 0;
let failed = 0;
const check = (name, cond) => {
  if (cond) { passed += 1; } else { failed += 1; console.error(`FAIL: ${name}`); }
};

// ---------------------------------------------------------------------------------------------------
// 1. Engine metadata + unchanged scoring
// ---------------------------------------------------------------------------------------------------
const makeBars = (n) => {
  const bars = [];
  let close = 100;
  for (let i = 0; i < n; i += 1) {
    // Deterministic pseudo-wave (no randomness): sinusoid + slow drift.
    close = 100 + 10 * Math.sin(i / 7) + 5 * Math.cos(i / 23) + i * 0.05;
    const d = new Date(Date.UTC(2018, 0, 1 + i)).toISOString().slice(0, 10);
    bars.push({ date: d, open: close, high: close + 1, low: close - 1, close, volume: 1000 + i });
  }
  return bars;
};
const engine = runRealSimilarity(makeBars(420), { baseWindow: 20, forwardWindows: [5, 20, 60], topK: 5, minGapBars: 10 });
check('engine returns matches', engine.ok && engine.matches.length >= 1);
check('engine method version unchanged', SIMILARITY_METHOD_VERSION === 'sim-v1-corr045-rmse035-dir020');
check('engine candidateCount positive', typeof engine.candidateCount === 'number' && engine.candidateCount > 0);
check('all scores clamped 0..100', engine.matches.every((m) => m.similarityScore >= 0 && m.similarityScore <= 100));
check('rank #1 has raw candidateRank 1', engine.matches[0].candidateRank === 1);
check('candidateRank strictly increasing across selected ranks', engine.matches.every((m, i) => i === 0 || m.candidateRank > engine.matches[i - 1].candidateRank));
check('candidateRank within [1, candidateCount]', engine.matches.every((m) => m.candidateRank >= 1 && m.candidateRank <= engine.candidateCount));
check('candidateTopPercentile matches formula', engine.matches.every((m) => Math.abs(m.candidateTopPercentile - Math.round((m.candidateRank / engine.candidateCount) * 100 * 100) / 100) < 1e-9));
// Scoring formula weights unchanged (spot check the pure scorer against a known relationship).
const sp = computeSimilarityScore([0.01, -0.02, 0.03], [0.01, -0.02, 0.03]);
check('identical returns score high', sp.similarityScore > 90 && sp.similarityScore <= 100);
check('score parts present', typeof sp.correlation === 'number' && typeof sp.rmse === 'number' && typeof sp.directionMatchPct === 'number');

// ---------------------------------------------------------------------------------------------------
// 2. Score-guide band boundaries (9.1)
// ---------------------------------------------------------------------------------------------------
const bandExpect = {
  0: 'very-low', 34.9: 'very-low', 35: 'low', 49.9: 'low', 50: 'moderate',
  64.9: 'moderate', 65: 'high', 79.9: 'high', 80: 'very-high', 100: 'very-high',
};
for (const [score, code] of Object.entries(bandExpect)) {
  check(`score band ${score} -> ${code}`, classifyScoreBand(Number(score)).code === code);
}
check('score band null -> unknown', classifyScoreBand(null).code === 'unknown');
check('score band NaN -> unknown', classifyScoreBand(NaN).code === 'unknown');
check('score guide has 5 bands', buildScoreGuide(82).bands.length === 5 && SCORE_BANDS.length === 5);
check('score guide notes present (not-probability wording)', buildScoreGuide(82).notes.some((n) => n.includes('확률')) && buildScoreGuide(82).notes.some((n) => n.includes('보정된 확률이 아')));

// ---------------------------------------------------------------------------------------------------
// 3. Deterministic insight decision tree (10.3)
// ---------------------------------------------------------------------------------------------------
const CAND = 1000;
const mk = (rank, score, cr, d5, d20, d60, dd, up, complete = true) => ({
  rank,
  similarityScore: score,
  candidateRank: cr,
  candidateTopPercentile: Math.round((cr / CAND) * 100 * 100) / 100,
  startDate: `2024-01-${String(rank).padStart(2, '0')}`,
  endDate: `2024-02-${String(rank).padStart(2, '0')}`,
  forwardReturns: { d5, d20, d60: complete ? d60 : null },
  maxDrawdownPct: dd,
  maxUpsidePct: up,
  normalizedPath: [100, 101, 102],
  dataComplete: { d5: true, d20: d20 !== null, d60: complete },
});
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };
const makeSim = (matches, candidateCount = CAND) => {
  const d20 = matches.map((m) => m.forwardReturns.d20).filter((v) => typeof v === 'number' && isFinite(v));
  const dd = matches.map((m) => m.maxDrawdownPct).filter((v) => typeof v === 'number');
  const up = matches.map((m) => m.maxUpsidePct).filter((v) => typeof v === 'number');
  return {
    ok: true,
    candidateCount,
    disclaimer: '과거 유사 구간의 이후 움직임을 참고용으로 비교합니다. 미래 성과를 예측하거나 보장하지 않습니다.',
    currentNormalizedPath: [100, 101, 102],
    matches,
    aggregate: {
      averageForwardReturnByWindow: { d5: avg(matches.map((m) => m.forwardReturns.d5)), d20: avg(d20), d60: avg(matches.map((m) => m.forwardReturns.d60).filter((v) => typeof v === 'number')) },
      medianForwardReturnByWindow: { d20: med(d20) },
      positiveCountByWindow: { d20: d20.filter((v) => v > 0).length },
      negativeCountByWindow: { d20: d20.filter((v) => v < 0).length },
      averageMaxDrawdownPct: avg(dd),
      averageMaxUpsidePct: avg(up),
      matchCount: matches.length,
    },
  };
};
const cat = (sim) => buildFinalInsight(sim).code;
const evl = (sim) => buildEvidenceLevel(sim).level;

// (a) HIGH + aligned positive -> high-interest
const simHigh = makeSim([mk(1, 82, 3, 0.02, 0.05, 0.05, -0.03, 0.09), mk(2, 70, 20, 0.02, 0.04, 0.05, -0.03, 0.09), mk(3, 68, 40, 0.02, 0.03, 0.05, -0.03, 0.09), mk(4, 66, 55, 0.02, 0.06, 0.05, -0.03, 0.09), mk(5, 66, 70, 0.02, 0.02, 0.05, -0.03, 0.09)]);
check('HIGH evidence', evl(simHigh) === 'HIGH');
check('high-interest category', cat(simHigh) === 'high-interest');
check('high-interest label', buildFinalInsight(simHigh).label === '추가 확인 가치 높음');

// (b) MODERATE + positive but mixed -> conditional
const simCond = makeSim([mk(1, 58, 100, 0.02, 0.03, 0.04, -0.03, 0.05), mk(2, 52, 150, 0.01, 0.02, 0.03, -0.03, 0.05), mk(3, 51, 200, -0.01, -0.01, 0.01, -0.03, 0.05), mk(4, 50, 250, 0.02, 0.04, 0.03, -0.03, 0.05), mk(5, 50, 300, 0.01, 0.02, 0.02, -0.03, 0.05)]);
check('MODERATE evidence', evl(simCond) === 'MODERATE');
check('conditional category', cat(simCond) === 'conditional');

// (c) HIGH similarity but negative median -> watch
const simNeg = makeSim([mk(1, 82, 3, 0.02, 0.05, 0.05, -0.03, 0.09), mk(2, 70, 20, -0.02, -0.06, -0.05, -0.06, 0.02), mk(3, 68, 40, -0.02, -0.04, -0.03, -0.06, 0.02), mk(4, 66, 55, -0.02, -0.03, -0.03, -0.06, 0.02), mk(5, 66, 70, -0.02, -0.02, -0.02, -0.06, 0.02)]);
check('negative-median category is watch', cat(simNeg) === 'watch');

// (d) MODERATE, downside exceeds upside -> watch
const simDown = makeSim([mk(1, 58, 100, 0.02, 0.03, 0.04, -0.10, 0.04), mk(2, 52, 150, 0.01, 0.02, 0.03, -0.10, 0.04), mk(3, 51, 200, 0.01, 0.01, 0.01, -0.10, 0.04), mk(4, 50, 250, 0.02, 0.04, 0.03, -0.10, 0.04), mk(5, 50, 300, 0.01, 0.02, 0.02, -0.10, 0.04)]);
check('downside>upside category is watch', cat(simDown) === 'watch');

// (e) Low absolute score -> low-trust
const simLow = makeSim([mk(1, 40, 3, 0.02, 0.03, 0.04, -0.03, 0.05), mk(2, 38, 20, 0.01, 0.02, 0.03, -0.03, 0.05), mk(3, 36, 40, 0.01, 0.01, 0.01, -0.03, 0.05), mk(4, 35, 55, 0.02, 0.04, 0.03, -0.03, 0.05), mk(5, 34, 70, 0.01, 0.02, 0.02, -0.03, 0.05)]);
check('low-score evidence LOW', evl(simLow) === 'LOW');
check('low-score category low-trust', cat(simLow) === 'low-trust');

// (f) Weak relative position (percentile > 20) -> low-trust
const simWeakPos = makeSim([mk(1, 72, 300, 0.02, 0.03, 0.04, -0.03, 0.05), mk(2, 70, 350, 0.01, 0.02, 0.03, -0.03, 0.05), mk(3, 68, 400, 0.01, 0.01, 0.01, -0.03, 0.05), mk(4, 66, 450, 0.02, 0.04, 0.03, -0.03, 0.05), mk(5, 65, 500, 0.01, 0.02, 0.02, -0.03, 0.05)]);
check('weak-position evidence LOW', evl(simWeakPos) === 'LOW');
check('weak-position category low-trust', cat(simWeakPos) === 'low-trust');

// (g) Insufficient complete d20 outcomes -> low-trust
const simFewComplete = makeSim([mk(1, 82, 3, 0.02, 0.05, 0.05, -0.03, 0.09), mk(2, 70, 20, 0.02, 0.04, 0.05, -0.03, 0.09), mk(3, 68, 40, 0.02, null, null, -0.03, 0.09), mk(4, 66, 55, 0.02, null, null, -0.03, 0.09), mk(5, 66, 70, 0.02, null, null, -0.03, 0.09)]);
check('few-complete evidence LOW', evl(simFewComplete) === 'LOW');
check('few-complete category low-trust', cat(simFewComplete) === 'low-trust');

// (h) Divergent Top-5 -> low-trust (agreement below moderate threshold)
const simDiverge = makeSim([mk(1, 70, 3, 0.02, 0.05, 0.05, -0.03, 0.05), mk(2, 64, 20, -0.02, -0.04, -0.03, -0.03, 0.05), mk(3, 63, 40, 0.02, 0.03, 0.02, -0.03, 0.05), mk(4, 62, 55, -0.02, -0.06, -0.03, -0.03, 0.05)]);
check('divergent Top-5 -> not high-interest/conditional', ['watch', 'low-trust'].includes(cat(simDiverge)));

// (i) Missing #2 score does not crash / does not force watch via gap
const simNoSecond = makeSim([mk(1, 82, 3, 0.02, 0.05, 0.05, -0.03, 0.09), { rank: 2, similarityScore: null, candidateRank: 20, candidateTopPercentile: 2, startDate: '2024-01-02', endDate: '2024-02-02', forwardReturns: { d5: 0.02, d20: 0.04, d60: 0.05 }, maxDrawdownPct: -0.03, maxUpsidePct: 0.09, normalizedPath: [100, 101, 102], dataComplete: { d5: true, d20: true, d60: true } }, mk(3, 68, 40, 0.02, 0.03, 0.05, -0.03, 0.09), mk(4, 66, 55, 0.02, 0.06, 0.05, -0.03, 0.09), mk(5, 66, 70, 0.02, 0.02, 0.05, -0.03, 0.09)]);
check('missing #2 score still classifies (high-interest)', cat(simNoSecond) === 'high-interest');

// (j) Partial d60 -> limitations includes the incomplete note; matchRows flags incomplete
const simPartialD60 = makeSim([mk(1, 82, 3, 0.02, 0.05, 0.05, -0.03, 0.09, false), mk(2, 70, 20, 0.02, 0.04, 0.05, -0.03, 0.09), mk(3, 68, 40, 0.02, 0.03, 0.05, -0.03, 0.09), mk(4, 66, 55, 0.02, 0.06, 0.05, -0.03, 0.09), mk(5, 66, 70, 0.02, 0.02, 0.05, -0.03, 0.09)]);
const insPartial = buildSimilarityInsight(simPartialD60);
check('partial d60 adds a 60일 limitation', insPartial.limitations.some((l) => l.includes('60일')));
check('partial d60 matchRow flagged incomplete', buildMatchRows(simPartialD60).some((r) => r.incomplete === true));

// Insight ordering + required sections present
const ins = buildSimilarityInsight(simHigh);
check('insight order is the required reading order', ins.order.join('>') === 'strongestMatch>scoreExplanation>relativeRank>outcomeAgreement>risk>finalInsight>limitations');
for (const f of ['strongestMatchSummary', 'scoreExplanation', 'relativeRankExplanation', 'outcomeAgreementSummary', 'riskSummary', 'finalInsightLabel', 'finalInsightBody']) {
  check(`insight has ${f}`, typeof ins[f] === 'string' && ins[f].length > 0);
}
check('insight evidenceQuality present', ins.evidenceQuality && typeof ins.evidenceQuality.level === 'string');
check('candidate position label', buildCandidatePosition(simHigh).percentileLabel === '상위 0.3%' && buildCandidatePosition(simHigh).rankLabel.includes('1,000'));
const tinyMatch = { ...mk(1, 90, 1, 0.02, 0.05, 0.05, -0.03, 0.09), candidateTopPercentile: 0.02 };
check('<0.1% percentile display', buildCandidatePosition(makeSim([tinyMatch], 5000)).percentileLabel === '상위 <0.1%');

// ---------------------------------------------------------------------------------------------------
// 4. Non-advisory language (10.3): no buy/sell/guarantee wording anywhere in the insight text
// ---------------------------------------------------------------------------------------------------
// Affirmative buy/sell/guarantee wording only. The correct NEGATED disclaimer "보장하지 않습니다"
// (does NOT guarantee) is intentionally allowed — it is the safety language, not a violation.
const BANNED = [/사세요|파세요|매수하세요|매도하세요|매수 추천|매도 추천/, /보장합니다|보장해\s*드|수익(을|률)?\s*보장|원금\s*보장/, /반드시\s*(상승|하락|오)/, /\bbuy\b|\bsell\b/i, /손실\s*(이\s*)?(없|안)/];
const collectInsightText = (sim) => {
  const i = buildSimilarityInsight(sim);
  return [i.strongestMatchSummary, i.scoreExplanation, i.relativeRankExplanation, i.outcomeAgreementSummary, i.riskSummary, i.finalInsightBody, ...i.limitations].join(' ');
};
for (const sim of [simHigh, simCond, simNeg, simDown, simLow, simWeakPos, simFewComplete, simDiverge]) {
  const text = collectInsightText(sim);
  check(`insight text free of advisory/guarantee wording (${cat(sim)})`, BANNED.every((re) => !re.test(text)));
}

// ---------------------------------------------------------------------------------------------------
// 5. Overlay tooltip metadata + pixel nearest + ordering (Sections 6/7)
// ---------------------------------------------------------------------------------------------------
const explain = buildSimilarityExplainability(simHigh);
const series = explain.series;
check('current series first + stable colors', series[0].key === 'current' && series.length === 6);
check('match series carry startDate + similarityScore', series[1].startDate === '2024-01-01' && series[1].similarityScore === 82);
const tips = resolveVisibleTooltipValues(series, explain.defaultVisibleKeys, 1);
check('tooltip separates value from similarity score', tips[0].value === 101 && tips[1].similarityScore === 82 && tips[1].startDate === '2024-01-01');
check('hidden series excluded from tooltip', resolveVisibleTooltipValues(series, ['current'], 1).length === 1);
check('current series still identifiable', tips.find((t) => t.current) !== undefined);
const ordered = orderTooltipRowsByHighlight(tips, 'match-2');
check('hovered series ordered first', ordered[0].key === 'match-2');
check('ordering pure (input unchanged)', tips[0].key === 'current');
check('pixel nearest within threshold', resolveNearestSeriesByPixel([{ key: 'a', y: 10 }, { key: 'b', y: 50 }], 13, 18) === 'a');
check('pixel nearest returns null beyond threshold', resolveNearestSeriesByPixel([{ key: 'a', y: 10 }], 200, 18) === null);
check('single-DOM matchRows carry relative position', explain.matchRows[0].relativePositionLabel === '상위 0.3%');
check('axis ticks clamp to available length', explain.axisTicks.length >= 1 && explain.axisTicks.every((t) => t.index >= 0));
check('threshold + evidence/insight constants documented', EVIDENCE_THRESHOLDS.high.minTopScore === 65 && INSIGHT_THRESHOLDS.minScoreGapForDominance === 5);

console.log(`\nPhase 3GG-T-HF3B-HF2-HF2B smoke: ${passed} passed, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
