/**
 * Phase 3GG-T-HF5 similarity explainability V2 — pure presentation module.
 *
 * Consumes ONLY the already-real `similarity.json` response shape (matches/aggregate/
 * currentNormalizedPath) and derives everything the Similarity V2 UI needs: formatted labels,
 * overlay series/legend/axis descriptors, visible-series tooltip resolution, Top-5 table/card rows,
 * and a deterministic natural-language aggregate interpretation (including a fixed-threshold
 * dispersion classification). No DOM, no fetch, no environment, no randomness, no wall-clock, no
 * provider imports, no secrets — safe to import into a browser bundle.
 */

export const SIMILARITY_OVERLAY_COLORS = ['#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#0ea5e9'];
export const SIMILARITY_CURRENT_COLOR = '#111827';

const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);

/** Similarity score (0..100) formatted, or an em dash when unavailable — never a fabricated 0. */
export const formatSimilarityScore = (v) => (isFiniteNumber(v) ? `${v.toFixed(1)}점` : '—');

/** Signed percentage formatter shared by forward-return / drawdown / upside fields. */
export const formatSignedPct = (v) => (isFiniteNumber(v) ? `${v >= 0 ? '+' : ''}${(v * 100).toFixed(2)}%` : '—');

export const formatForwardReturnPct = formatSignedPct;
export const formatDrawdownPct = formatSignedPct;
export const formatUpsidePct = formatSignedPct;

/**
 * Builds the overlay series list: the current window first (fixed dark color), then each Top-5 match
 * with a stable color assignment. Each series carries both a full legend label (with match start date)
 * and a short label for compact tooltip use.
 */
export const buildOverlaySeries = (sim) => {
  const series = [
    {
      key: 'current',
      label: '현재 구간',
      shortLabel: '현재',
      color: SIMILARITY_CURRENT_COLOR,
      current: true,
      // Phase 3GG-T-HF3B-HF2-HF2B: the current window has no historical identity/score.
      startDate: null,
      endDate: null,
      similarityScore: null,
      candidateRank: null,
      candidateTopPercentile: null,
      values: Array.isArray(sim?.currentNormalizedPath) ? sim.currentNormalizedPath : [],
    },
  ];
  (Array.isArray(sim?.matches) ? sim.matches : []).slice(0, 5).forEach((m, i) => {
    const rank = m?.rank ?? i + 1;
    const startLabel = typeof m?.startDate === 'string' && m.startDate ? m.startDate : '—';
    series.push({
      key: `match-${rank}`,
      label: `#${rank} · ${startLabel} 시작`,
      shortLabel: `#${rank}`,
      color: SIMILARITY_OVERLAY_COLORS[i % SIMILARITY_OVERLAY_COLORS.length],
      current: false,
      // Phase 3GG-T-HF3B-HF2-HF2B: carry the historical identity + similarity score so the structured
      // tooltip can show "#N · YYYY-MM-DD · NN.N점" without recomputing anything in the DOM layer.
      startDate: typeof m?.startDate === 'string' && m.startDate ? m.startDate : null,
      endDate: typeof m?.endDate === 'string' && m.endDate ? m.endDate : null,
      similarityScore: isFiniteNumber(m?.similarityScore) ? m.similarityScore : null,
      candidateRank: isFiniteNumber(m?.candidateRank) ? m.candidateRank : null,
      candidateTopPercentile: isFiniteNumber(m?.candidateTopPercentile) ? m.candidateTopPercentile : null,
      values: Array.isArray(m?.normalizedPath) ? m.normalizedPath : [],
    });
  });
  return series;
};

/** Default-visible series keys (all series visible on first render; toggling is UI-owned state). */
export const defaultVisibleSeriesKeys = (series) => (Array.isArray(series) ? series.map((s) => s.key) : []);

/**
 * D+ axis tick descriptors for the overlay X axis, evenly spaced across the longest series length.
 * `length` is the number of normalized points in the longest series (bar count from window start).
 */
export const buildAxisTicks = (length, tickCount = 5) => {
  if (!isFiniteNumber(length) || length < 2) return [];
  const steps = Math.max(1, Math.min(tickCount, length) - 1);
  const ticks = [];
  for (let i = 0; i <= steps; i += 1) {
    const index = Math.round((i / steps) * (length - 1));
    ticks.push({ index, label: `D+${index}` });
  }
  return ticks.filter((t, i) => i === 0 || t.index !== ticks[i - 1].index);
};

/**
 * Resolves the values to show in a hover/tap tooltip at a given point index, restricted to the
 * currently-visible series (toggled off series never appear even if hovered).
 */
export const resolveVisibleTooltipValues = (series, visibleKeys, index) => {
  const visible = new Set(Array.isArray(visibleKeys) ? visibleKeys : []);
  return (Array.isArray(series) ? series : [])
    .filter((s) => visible.has(s.key))
    .map((s) => ({
      key: s.key,
      label: s.shortLabel,
      // Phase 3GG-T-HF3B-HF2-HF2B: structured-tooltip fields — full identity, historical start date and
      // similarity score are kept SEPARATE from `value` (the normalized price-path index, base 100), so
      // the DOM renders them in distinct columns and never concatenates a score with a path value.
      fullLabel: s.label,
      startDate: s.startDate ?? null,
      similarityScore: isFiniteNumber(s.similarityScore) ? s.similarityScore : null,
      color: s.color,
      current: Boolean(s.current),
      value: isFiniteNumber(s.values?.[index]) ? s.values[index] : null,
    }))
    .filter((v) => v.value !== null);
};

/**
 * Orders resolved tooltip rows so the hovered/focused series is first (Section 7), keeping the
 * remaining rows in their existing order. Pure — never mutates the input array.
 */
export const orderTooltipRowsByHighlight = (rows, highlightKey) => {
  const list = Array.isArray(rows) ? rows.slice() : [];
  if (!highlightKey) return list;
  const idx = list.findIndex((r) => r?.key === highlightKey);
  if (idx <= 0) return list;
  const [hit] = list.splice(idx, 1);
  return [hit, ...list];
};

/**
 * Pure nearest-series resolver by SCREEN distance (Section 6.2): given the pointer's Y pixel and each
 * visible series' Y pixel at the snapped index, returns the nearest series key ONLY when it is within
 * `thresholdPx`; otherwise null (crosshair stays, no false selection). Never compares raw normalized
 * values. `candidates` = [{ key, y }]; `y` must be finite to be considered.
 */
export const NEAREST_SERIES_PIXEL_THRESHOLD = 18;
export const resolveNearestSeriesByPixel = (candidates, pointerY, thresholdPx = NEAREST_SERIES_PIXEL_THRESHOLD) => {
  if (!isFiniteNumber(pointerY)) return null;
  let bestKey = null;
  let bestDist = Infinity;
  for (const c of Array.isArray(candidates) ? candidates : []) {
    if (!c || !isFiniteNumber(c.y)) continue;
    const dist = Math.abs(c.y - pointerY);
    if (dist < bestDist) {
      bestDist = dist;
      bestKey = c.key;
    }
  }
  return bestDist <= thresholdPx ? bestKey : null;
};

/** Top-5 rows for the desktop comparison table / mobile cards. Unavailable fields render as "—". */
export const buildMatchRows = (sim) =>
  (Array.isArray(sim?.matches) ? sim.matches : []).map((m) => ({
    rank: m?.rank ?? null,
    similarityLabel: formatSimilarityScore(m?.similarityScore),
    // Phase 3GG-T-HF3B-HF2-HF2B: per-row relative candidate position (Section 8 desktop column). This
    // is the raw sorted rank among all scanned windows for THIS match, distinct from the display rank.
    relativePositionLabel: isFiniteNumber(m?.candidateTopPercentile)
      ? formatTopPercentile(m.candidateTopPercentile)
      : '—',
    candidateRankLabel: isFiniteNumber(m?.candidateRank) ? `${formatThousands(m.candidateRank)}위` : '—',
    pastRangeLabel: m?.startDate && m?.endDate ? `${m.startDate} ~ ${m.endDate}` : '—',
    d5Label: formatForwardReturnPct(m?.forwardReturns?.d5),
    d20Label: formatForwardReturnPct(m?.forwardReturns?.d20),
    d60Label: formatForwardReturnPct(m?.forwardReturns?.d60),
    maxDrawdownLabel: formatDrawdownPct(m?.maxDrawdownPct),
    maxUpsideLabel: formatUpsidePct(m?.maxUpsidePct),
    incomplete: Boolean(m?.dataComplete && m.dataComplete.d60 === false),
  }));

// Fixed, documented dispersion-classification thresholds (agreement = majority-sign share of matches).
export const DISPERSION_THRESHOLDS = { consistent: 0.8, mixed: 0.6 };

/** Deterministic dispersion classification over a forward-return window (default d20). */
export const classifyDispersion = (matches, window = 'd20') => {
  const values = (Array.isArray(matches) ? matches : [])
    .map((m) => m?.forwardReturns?.[window])
    .filter((v) => isFiniteNumber(v));
  if (values.length < 3) return { code: 'insufficient', label: '데이터 부족' };
  const positive = values.filter((v) => v > 0).length;
  const negative = values.filter((v) => v < 0).length;
  const agreement = Math.max(positive, negative) / values.length;
  if (agreement >= DISPERSION_THRESHOLDS.consistent) return { code: 'consistent', label: '비교적 일관됨' };
  if (agreement >= DISPERSION_THRESHOLDS.mixed) return { code: 'mixed', label: '다소 엇갈림' };
  return { code: 'divergent', label: '결과 편차가 큼' };
};

/**
 * Deterministic natural-language interpretation of the aggregate statistics: positive-outcome count,
 * avg/median 5d/20d, best/worst 20d outcome across the Top-5, avg/worst drawdown, and the dispersion
 * classification. Returns null when there is nothing to summarize (zero matches).
 */
export const buildAggregateInterpretation = (sim) => {
  const matches = Array.isArray(sim?.matches) ? sim.matches : [];
  const agg = sim?.aggregate ?? {};
  const matchCount = typeof agg.matchCount === 'number' ? agg.matchCount : matches.length;
  if (!matchCount) return null;

  const pos20 = agg.positiveCountByWindow?.d20 ?? 0;
  const avg5 = formatSignedPct(agg.averageForwardReturnByWindow?.d5);
  const avg20 = formatSignedPct(agg.averageForwardReturnByWindow?.d20);
  const med20 = formatSignedPct(agg.medianForwardReturnByWindow?.d20);
  const avgDrawdown = formatSignedPct(agg.averageMaxDrawdownPct);

  const d20Values = matches.map((m) => m?.forwardReturns?.d20).filter((v) => isFiniteNumber(v));
  const bestLabel = d20Values.length ? formatSignedPct(Math.max(...d20Values)) : '—';
  const worstLabel = d20Values.length ? formatSignedPct(Math.min(...d20Values)) : '—';

  const drawdowns = matches.map((m) => m?.maxDrawdownPct).filter((v) => isFiniteNumber(v));
  const worstDrawdownLabel = drawdowns.length ? formatSignedPct(Math.min(...drawdowns)) : '—';

  const dispersion = classifyDispersion(matches, 'd20');

  return (
    `상위 ${matchCount}개 유사 구간 중 ${pos20}개가 20일 후 상승 마감했습니다. ` +
    `평균 5일 후 수익률은 ${avg5}, 평균 20일 후 수익률은 ${avg20}(중앙값 ${med20})였습니다. ` +
    `20일 후 최고 수익률은 ${bestLabel}, 최저 수익률은 ${worstLabel}였습니다. ` +
    `평균 최대 낙폭은 ${avgDrawdown}, 가장 컸던 낙폭은 ${worstDrawdownLabel}였습니다. ` +
    `이번 비교 구간들의 결과는 ${dispersion.label}으로 나타났습니다.`
  );
};

// ===========================================================================================
// Phase 3GG-T-HF3B-HF2-HF2B: score-range guide, candidate relative-position, evidence level, and
// the deterministic non-advisory insight model. All pure and deterministic. The 0..100 similarity
// score is NOT recomputed here — the scoring formula (corr 0.45 / rmse 0.35 / dir 0.20, engine-side)
// is unchanged; these are display/interpretation bands and thresholds only.
// ===========================================================================================

const round1 = (v) => (isFiniteNumber(v) ? Math.round(v * 10) / 10 : null);
const medianOf = (values) => {
  const valid = (Array.isArray(values) ? values : []).filter(isFiniteNumber).slice().sort((a, b) => a - b);
  if (!valid.length) return null;
  const mid = Math.floor(valid.length / 2);
  return valid.length % 2 === 0 ? (valid[mid - 1] + valid[mid]) / 2 : valid[mid];
};
// Deterministic thousands grouping without relying on ICU/locale (e.g. 1248 -> "1,248").
const formatThousands = (n) => (isFiniteNumber(n) ? String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '—');

// 9.1 Absolute similarity-score bands — SERVICE EXPLANATION bands, not calibrated probabilities.
export const SCORE_BANDS = [
  { code: 'very-high', min: 80.0, max: 100, label: '매우 높은 형태 유사성' },
  { code: 'high', min: 65.0, max: 79.9, label: '높은 형태 유사성' },
  { code: 'moderate', min: 50.0, max: 64.9, label: '보통 수준의 형태 유사성' },
  { code: 'low', min: 35.0, max: 49.9, label: '낮은 형태 유사성' },
  { code: 'very-low', min: 0, max: 34.9, label: '매우 낮은 형태 유사성' },
];

/** Classifies a 0..100 score into a fixed band (null/invalid -> 'unknown'). Boundaries are inclusive-low. */
export const classifyScoreBand = (score) => {
  if (!isFiniteNumber(score)) return { code: 'unknown', label: '점수 없음', min: null, max: null };
  if (score >= 80) return SCORE_BANDS[0];
  if (score >= 65) return SCORE_BANDS[1];
  if (score >= 50) return SCORE_BANDS[2];
  if (score >= 35) return SCORE_BANDS[3];
  return SCORE_BANDS[4];
};

/** User-facing score guide: bands + the plain-language notes that a score is not a probability/return. */
export const buildScoreGuide = (topScore) => ({
  min: 0,
  max: 100,
  bands: SCORE_BANDS,
  topScore: isFiniteNumber(topScore) ? topScore : null,
  topBand: classifyScoreBand(topScore),
  notes: [
    '0에 가까울수록 형태 유사성이 낮고, 100에 가까울수록 과거 가격 경로의 형태가 더 비슷합니다.',
    '이 점수는 기대 수익률이 아니며, 상승 확률이나 미래 성과를 보장하지 않습니다.',
    '아래 구간 등급은 서비스 설명용 구분이며, 통계적으로 보정된 확률이 아닙니다.',
  ],
});

// 9.2 Relative candidate position among ALL scanned windows (lower percentile = stronger).
export const formatTopPercentile = (percentile) => {
  if (!isFiniteNumber(percentile)) return '—';
  if (percentile < 0.1) return '상위 <0.1%';
  return `상위 ${percentile.toFixed(1)}%`;
};

/** Reads the #1 match's raw candidate rank + count from the real response; null when unavailable. */
export const buildCandidatePosition = (sim) => {
  const top = (Array.isArray(sim?.matches) ? sim.matches : [])[0];
  const count = isFiniteNumber(sim?.candidateCount) ? sim.candidateCount : null;
  if (!top || !isFiniteNumber(top.candidateRank) || !count || count <= 0) return null;
  const rank = top.candidateRank;
  const percentile = isFiniteNumber(top.candidateTopPercentile) ? top.candidateTopPercentile : (rank / count) * 100;
  return {
    rank,
    count,
    percentile,
    rankLabel: `전체 ${formatThousands(count)}개 후보 중 ${formatThousands(rank)}위`,
    percentileLabel: formatTopPercentile(percentile),
  };
};

/** #1 vs #2 similarity-score gap (how dominant the strongest match is). */
export const buildScoreGap = (matches) => {
  const list = Array.isArray(matches) ? matches : [];
  const top = isFiniteNumber(list[0]?.similarityScore) ? list[0].similarityScore : null;
  const second = isFiniteNumber(list[1]?.similarityScore) ? list[1].similarityScore : null;
  return { top, second, gap: top !== null && second !== null ? round1(top - second) : null };
};

/** Directional agreement / positive share / median for one forward window across the Top-K matches. */
export const buildOutcomeAgreement = (sim, window = 'd20') => {
  const matches = Array.isArray(sim?.matches) ? sim.matches : [];
  const values = matches.map((m) => m?.forwardReturns?.[window]).filter(isFiniteNumber);
  const complete = values.length;
  const positive = values.filter((v) => v > 0).length;
  const negative = values.filter((v) => v < 0).length;
  return {
    window,
    complete,
    positive,
    negative,
    positiveShare: complete ? positive / complete : null,
    agreement: complete ? Math.max(positive, negative) / complete : null,
    median: medianOf(values),
    dispersion: classifyDispersion(matches, window),
  };
};

// Documented risk/reward comparison thresholds used by the insight decision tree.
export const INSIGHT_THRESHOLDS = {
  strongPositiveShare: 0.8, // 추가 확인 가치 높음: >=80% of complete d20 outcomes positive
  conditionalPositiveShare: 0.6, // 조건부 관심: >=60% positive
  minScoreGapForDominance: 5, // #1/#2 score gap below this = not a dominant pattern
  upsideDominanceRatio: 1.25, // avg upside must be >=1.25x |avg drawdown| to count as "meaningfully greater"
};

/** Average/worst drawdown vs average/max upside, plus the two derived risk/reward booleans. */
export const buildRiskReward = (sim) => {
  const agg = sim?.aggregate ?? {};
  const avgUpside = isFiniteNumber(agg.averageMaxUpsidePct) ? agg.averageMaxUpsidePct : null;
  const avgDrawdown = isFiniteNumber(agg.averageMaxDrawdownPct) ? agg.averageMaxDrawdownPct : null;
  const matches = Array.isArray(sim?.matches) ? sim.matches : [];
  const drawdowns = matches.map((m) => m?.maxDrawdownPct).filter(isFiniteNumber);
  const upsides = matches.map((m) => m?.maxUpsidePct).filter(isFiniteNumber);
  const absDrawdown = avgDrawdown !== null ? Math.abs(avgDrawdown) : null;
  return {
    avgUpside,
    avgDrawdown,
    absDrawdown,
    worstDrawdown: drawdowns.length ? Math.min(...drawdowns) : null,
    maxUpside: upsides.length ? Math.max(...upsides) : null,
    upsideDominates: avgUpside !== null && absDrawdown !== null && avgUpside >= INSIGHT_THRESHOLDS.upsideDominanceRatio * absDrawdown,
    downsideExceedsUpside: avgUpside !== null && absDrawdown !== null && absDrawdown >= avgUpside,
  };
};

// 10.2 Evidence-strength thresholds (pattern-comparison basis, NOT prediction confidence).
export const EVIDENCE_THRESHOLDS = {
  high: { minTopScore: 65, maxTopPercentile: 5, minCompleteD20: 4, minAgreement: 0.8 },
  moderate: { minTopScore: 50, maxTopPercentile: 20, minCompleteD20: 3, minAgreement: 0.6 },
};

/** HIGH / MODERATE / LOW evidence classification from the #1 score, percentile, and d20 outcomes. */
export const buildEvidenceLevel = (sim) => {
  const top = (Array.isArray(sim?.matches) ? sim.matches : [])[0];
  const topScore = isFiniteNumber(top?.similarityScore) ? top.similarityScore : null;
  const topPercentile = isFiniteNumber(top?.candidateTopPercentile) ? top.candidateTopPercentile : null;
  const d20 = buildOutcomeAgreement(sim, 'd20');
  const meets = (t) =>
    topScore !== null && topPercentile !== null &&
    topScore >= t.minTopScore && topPercentile <= t.maxTopPercentile &&
    d20.complete >= t.minCompleteD20 && (d20.agreement ?? 0) >= t.minAgreement;
  let level = 'LOW';
  if (meets(EVIDENCE_THRESHOLDS.high)) level = 'HIGH';
  else if (meets(EVIDENCE_THRESHOLDS.moderate)) level = 'MODERATE';
  const labels = { HIGH: '높음', MODERATE: '보통', LOW: '낮음' };
  return { level, label: labels[level], topScore, topPercentile, completeD20: d20.complete, d20Agreement: d20.agreement };
};

// 10.3 Final observation categories (non-advisory) + their plain-language bodies.
export const FINAL_INSIGHT = {
  'high-interest': '추가 확인 가치 높음',
  conditional: '조건부 관심',
  watch: '관망 우선',
  'low-trust': '패턴 신뢰도 낮음',
};
const INSIGHT_BODY = {
  'high-interest':
    '과거 유사 구간의 형태 유사성이 높고 이후 흐름도 대체로 한 방향으로 일관되게 나타났습니다. 추가로 살펴볼 가치가 있는 패턴이지만, 이는 과거 사례일 뿐 미래 성과를 보장하지 않습니다.',
  conditional:
    '과거 유사 구간의 이후 흐름은 대체로 긍정적이었으나 변동이나 위험 요인이 함께 관찰되었습니다. 확정적으로 판단하기보다 조건을 두고 관찰하는 편이 낫습니다.',
  watch:
    '과거 유사 구간의 결과가 엇갈리거나 하락 위험이 상승 여력만큼 크게 나타났습니다. 패턴만으로 판단하기보다 관망이 우선입니다.',
  'low-trust':
    '형태 유사성이 낮거나 비교 근거가 충분하지 않아 이 패턴 비교의 신뢰도가 낮습니다. 참고 지표로만 활용하고 다른 정보와 함께 확인하세요.',
};

/**
 * Deterministic final-observation category. LOW evidence -> 패턴 신뢰도 낮음. Otherwise a decision tree
 * over d20 median/positive-share, risk/reward dominance, #1-#2 score gap, and dispersion. Never emits
 * buy/sell/guarantee wording (that is enforced separately by the contract checker).
 */
export const buildFinalInsight = (sim) => {
  const matches = Array.isArray(sim?.matches) ? sim.matches : [];
  if (!matches.length) return { code: 'low-trust', label: FINAL_INSIGHT['low-trust'], body: INSIGHT_BODY['low-trust'], evidenceLevel: 'LOW' };

  const evidence = buildEvidenceLevel(sim);
  const d20 = buildOutcomeAgreement(sim, 'd20');
  const gap = buildScoreGap(matches);
  const rr = buildRiskReward(sim);
  const median = d20.median;
  const positiveShare = d20.positiveShare;
  const gapTooSmall = gap.second !== null && gap.gap !== null && gap.gap < INSIGHT_THRESHOLDS.minScoreGapForDominance;
  const divergent = d20.dispersion.code === 'divergent';

  let code;
  if (evidence.level === 'LOW') {
    code = 'low-trust';
  } else if (
    evidence.level === 'HIGH' &&
    median !== null && median > 0 &&
    positiveShare !== null && positiveShare >= INSIGHT_THRESHOLDS.strongPositiveShare &&
    rr.upsideDominates && !rr.downsideExceedsUpside &&
    !gapTooSmall && !divergent
  ) {
    code = 'high-interest';
  } else if (
    median !== null && median > 0 &&
    positiveShare !== null && positiveShare >= INSIGHT_THRESHOLDS.conditionalPositiveShare &&
    !rr.downsideExceedsUpside && !gapTooSmall && !divergent
  ) {
    code = 'conditional';
  } else {
    code = 'watch';
  }
  return { code, label: FINAL_INSIGHT[code], body: INSIGHT_BODY[code], evidenceLevel: evidence.level };
};

/**
 * 10.4 Structured, ordered insight model — one card per section, read in the required order:
 * strongest match -> absolute score meaning -> relative position -> outcome agreement -> risk ->
 * final observation -> limitations. Returns null when there are zero matches.
 */
export const buildSimilarityInsight = (sim) => {
  const matches = Array.isArray(sim?.matches) ? sim.matches : [];
  if (!matches.length) return null;
  const top = matches[0];
  const band = classifyScoreBand(top?.similarityScore);
  const position = buildCandidatePosition(sim);
  const evidence = buildEvidenceLevel(sim);
  const d20 = buildOutcomeAgreement(sim, 'd20');
  const rr = buildRiskReward(sim);
  const gap = buildScoreGap(matches);
  const finalInsight = buildFinalInsight(sim);

  const strongestMatchSummary =
    top?.startDate && top?.endDate
      ? `가장 유사한 과거 구간은 ${top.startDate} ~ ${top.endDate}이며, 형태 유사도는 ${formatSimilarityScore(top?.similarityScore)}입니다.`
      : `가장 유사한 과거 구간의 형태 유사도는 ${formatSimilarityScore(top?.similarityScore)}입니다.`;

  const scoreExplanation = `유사도 ${formatSimilarityScore(top?.similarityScore)}은 '${band.label}' 구간입니다. 이 점수는 가격 경로의 형태가 얼마나 비슷한지를 나타낼 뿐, 상승 확률이나 기대 수익률이 아닙니다.`;

  const relativeRankExplanation = position
    ? `이 구간은 ${position.rankLabel}로 ${position.percentileLabel}에 해당합니다. 순위가 낮을수록 스캔한 과거 후보 구간 중 형태가 상대적으로 더 비슷하다는 의미이며, 통계적 신뢰도가 아닙니다.`
    : '스캔한 과거 후보 구간 중 상대적 위치를 계산할 수 없습니다.';

  const outcomeAgreementSummary = d20.complete
    ? `20일 후 결과가 있는 ${d20.complete}개 구간 중 ${d20.positive}개가 상승, ${d20.negative}개가 하락했습니다. 결과 일치도는 '${d20.dispersion.label}'입니다.`
    : '20일 후 결과를 비교할 수 있는 유사 구간이 충분하지 않습니다.';

  const riskSummary =
    rr.avgDrawdown !== null || rr.avgUpside !== null
      ? `유사 구간 이후 평균 최대 낙폭은 ${formatSignedPct(rr.avgDrawdown)}, 평균 최대 상승 여력은 ${formatSignedPct(rr.avgUpside)}였고, 가장 컸던 낙폭은 ${formatSignedPct(rr.worstDrawdown)}였습니다.`
      : '위험과 상승 여력을 비교할 수 있는 유사 구간이 충분하지 않습니다.';

  const limitations = [
    typeof sim?.disclaimer === 'string' && sim.disclaimer
      ? sim.disclaimer
      : '과거 유사 구간의 이후 움직임을 참고용으로 비교합니다. 미래 성과를 예측하거나 보장하지 않습니다.',
  ];
  const incompleteCount = matches.filter((m) => m?.dataComplete && m.dataComplete.d60 === false).length;
  if (incompleteCount > 0) {
    limitations.push(`${incompleteCount}개 구간은 60일 후 데이터가 아직 완성되지 않아 60일 지표가 제한적입니다.`);
  }

  return {
    order: ['strongestMatch', 'scoreExplanation', 'relativeRank', 'outcomeAgreement', 'risk', 'finalInsight', 'limitations'],
    strongestMatchSummary,
    scoreExplanation,
    relativeRankExplanation,
    outcomeAgreementSummary,
    riskSummary,
    finalInsightLabel: finalInsight.label,
    finalInsightBody: finalInsight.body,
    finalInsightCode: finalInsight.code,
    evidenceQuality: { level: evidence.level, label: evidence.label },
    limitations,
    scoreGap: gap,
    outcomeAgreement: d20,
    riskReward: rr,
    candidatePosition: position,
    scoreBand: band,
  };
};

/** Full composed presentation model for the Similarity panel, from one real API response. */
export const buildSimilarityExplainability = (sim) => {
  if (!sim || sim.ok !== true) return null;
  const series = buildOverlaySeries(sim);
  const longest = Math.max(0, ...series.map((s) => s.values.length));
  const matches = Array.isArray(sim?.matches) ? sim.matches : [];
  return {
    series,
    defaultVisibleKeys: defaultVisibleSeriesKeys(series),
    axisTicks: buildAxisTicks(longest),
    matchRows: buildMatchRows(sim),
    aggregateInterpretation: buildAggregateInterpretation(sim),
    dispersion: classifyDispersion(sim?.matches, 'd20'),
    // Phase 3GG-T-HF3B-HF2-HF2B — score guide, relative position, evidence level, and the structured
    // deterministic insight model (the single authoritative source for the panel's interpretation UI).
    scoreGuide: buildScoreGuide(matches[0]?.similarityScore),
    candidatePosition: buildCandidatePosition(sim),
    evidenceLevel: buildEvidenceLevel(sim),
    finalInsight: buildFinalInsight(sim),
    insight: buildSimilarityInsight(sim),
  };
};
