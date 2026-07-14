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
      values: Array.isArray(sim?.currentNormalizedPath) ? sim.currentNormalizedPath : [],
    },
  ];
  (Array.isArray(sim?.matches) ? sim.matches : []).slice(0, 5).forEach((m, i) => {
    const startLabel = typeof m?.startDate === 'string' && m.startDate ? m.startDate : '—';
    series.push({
      key: `match-${m?.rank ?? i + 1}`,
      label: `#${m?.rank ?? i + 1} · ${startLabel} 시작`,
      shortLabel: `#${m?.rank ?? i + 1}`,
      color: SIMILARITY_OVERLAY_COLORS[i % SIMILARITY_OVERLAY_COLORS.length],
      current: false,
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
      color: s.color,
      current: Boolean(s.current),
      value: isFiniteNumber(s.values?.[index]) ? s.values[index] : null,
    }))
    .filter((v) => v.value !== null);
};

/** Top-5 rows for the desktop comparison table / mobile cards. Unavailable fields render as "—". */
export const buildMatchRows = (sim) =>
  (Array.isArray(sim?.matches) ? sim.matches : []).map((m) => ({
    rank: m?.rank ?? null,
    similarityLabel: formatSimilarityScore(m?.similarityScore),
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

/** Full composed presentation model for the Similarity V2 panel, from one real API response. */
export const buildSimilarityExplainability = (sim) => {
  if (!sim || sim.ok !== true) return null;
  const series = buildOverlaySeries(sim);
  const longest = Math.max(0, ...series.map((s) => s.values.length));
  return {
    series,
    defaultVisibleKeys: defaultVisibleSeriesKeys(series),
    axisTicks: buildAxisTicks(longest),
    matchRows: buildMatchRows(sim),
    aggregateInterpretation: buildAggregateInterpretation(sim),
    dispersion: classifyDispersion(sim?.matches, 'd20'),
  };
};
