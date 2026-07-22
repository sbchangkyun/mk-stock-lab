export const DEFAULT_SIMILAR_PATTERN_OPTIONS = Object.freeze({
  market: 'KR',
  timeframe: 'D',
  baseWindow: 20,
  allowedBaseWindows: Object.freeze([20, 40, 60]),
  lookbackYears: 3,
  topK: 5,
  forwardOutcomeWindows: Object.freeze([5, 20]),
  volatilityPenaltyFactor: 100,
});

export const SCORE_LABELS = Object.freeze({
  verySimilar: '매우 유사',
  similar: '유사 흐름',
  partlySimilar: '일부 유사',
  lowSimilarity: '유사도 낮음',
});

export const SIMILAR_PATTERN_CONTRACT_VERSION = 'similar-pattern-agent.v0.2';

export const CONFIDENCE_LABELS = Object.freeze({
  high: '높음',
  moderateHigh: '보통 이상',
  moderate: '보통',
  low: '낮음',
});

export const PATTERN_QUALITY_LABELS = Object.freeze({
  excellent: '우수',
  good: '양호',
  caution: '주의',
  low: '낮음',
});

export const MATCH_REASON_TAGS = Object.freeze({
  highCorrelation: '상관계수 높음',
  normalizedPathSimilar: '정규화 경로 유사',
  directionAligned: '방향성 일치',
  drawdownSimilar: '낙폭 유사',
  volatilityCaution: '변동성 주의',
  outcomeInterpretationCaution: '성과 해석 주의',
});

const STATUS = Object.freeze({
  ready: 'similar_patterns_ready',
  dataInsufficient: 'blocked_data_insufficient',
  kisUnavailable: 'blocked_kis_unavailable',
  candidateInsufficient: 'blocked_candidate_insufficient',
  usageExceeded: 'blocked_usage_exceeded',
  failClosed: 'fail_closed',
});

const SAFETY = Object.freeze({
  rawKisPayloadExposed: false,
  rawProviderErrorExposed: false,
  secretExposed: false,
  buySellRecommendation: false,
});

const round2 = (value) => (Number.isFinite(value) ? Math.round(value * 100) / 100 : null);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[midpoint - 1] + sorted[midpoint]) / 2 : sorted[midpoint];
};

export const computeMedian = (values) => median(values);

const closeOf = (value) => {
  if (typeof value === 'number') return value;
  if (value && typeof value.close === 'number') return value.close;
  return Number.NaN;
};

const dateKey = (bar) => String(bar?.date ?? '');

const safeError = (code, message) => ({ code, message });

const blockedOutput = (status, input, message) => ({
  ok: false,
  status,
  source: 'normalized_ohlcv',
  contractVersion: SIMILAR_PATTERN_CONTRACT_VERSION,
  summary: {
    market: input?.market ?? 'KR',
    symbol: typeof input?.symbol === 'string' ? input.symbol : '',
    timeframe: input?.timeframe ?? 'D',
    baseWindow: input?.baseWindow ?? DEFAULT_SIMILAR_PATTERN_OPTIONS.baseWindow,
    lookbackYears: input?.lookbackYears ?? DEFAULT_SIMILAR_PATTERN_OPTIONS.lookbackYears,
    topK: input?.topK ?? DEFAULT_SIMILAR_PATTERN_OPTIONS.topK,
    matchCount: 0,
    similarityMeaning: 'historical_shape_similarity_only',
  },
  currentWindow: null,
  matches: [],
  aggregateOutcomes: emptyAggregateOutcomes(),
  safety: { ...SAFETY },
  error: safeError(status, message),
});

const emptyAggregateOutcomes = () => ({
  positiveCountD5: 0,
  negativeCountD5: 0,
  positiveCountD20: 0,
  negativeCountD20: 0,
  averageForwardReturnD5Pct: null,
  medianForwardReturnD5Pct: null,
  averageForwardReturnD20Pct: null,
  medianForwardReturnD20Pct: null,
});

export function createSimilarPatternAgentInput(overrides = {}) {
  return {
    market: DEFAULT_SIMILAR_PATTERN_OPTIONS.market,
    symbol: '',
    timeframe: DEFAULT_SIMILAR_PATTERN_OPTIONS.timeframe,
    asOfDate: '',
    baseWindow: DEFAULT_SIMILAR_PATTERN_OPTIONS.baseWindow,
    lookbackYears: DEFAULT_SIMILAR_PATTERN_OPTIONS.lookbackYears,
    topK: DEFAULT_SIMILAR_PATTERN_OPTIONS.topK,
    ohlcv: [],
    ...overrides,
  };
}

export function computeLogReturns(values) {
  const closes = values.map(closeOf);
  const returns = [];
  for (let index = 1; index < closes.length; index += 1) {
    const previous = closes[index - 1];
    const current = closes[index];
    if (!Number.isFinite(previous) || !Number.isFinite(current) || previous <= 0 || current <= 0) {
      return [];
    }
    returns.push(Math.log(current / previous));
  }
  return returns;
}

export function computeNormalizedPath(values) {
  const closes = values.map(closeOf);
  const first = closes[0];
  if (!Number.isFinite(first) || first <= 0) return [];
  return closes.map((close) => {
    if (!Number.isFinite(close) || close <= 0) return null;
    return round2((close / first) * 100);
  });
}

export function computePearsonCorrelation(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length || left.length < 2) return 0;
  const leftMean = mean(left);
  const rightMean = mean(right);
  let numerator = 0;
  let leftDenominator = 0;
  let rightDenominator = 0;
  for (let index = 0; index < left.length; index += 1) {
    const leftDelta = left[index] - leftMean;
    const rightDelta = right[index] - rightMean;
    numerator += leftDelta * rightDelta;
    leftDenominator += leftDelta ** 2;
    rightDenominator += rightDelta ** 2;
  }
  const denominator = Math.sqrt(leftDenominator * rightDenominator);
  return denominator === 0 ? 0 : clamp(numerator / denominator, -1, 1);
}

export function computeRmse(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length || left.length === 0) return 0;
  const squared = left.map((value, index) => (value - right[index]) ** 2);
  return Math.sqrt(mean(squared));
}

export function computeDirectionMatchPct(leftReturns, rightReturns) {
  if (!Array.isArray(leftReturns) || !Array.isArray(rightReturns) || leftReturns.length !== rightReturns.length || leftReturns.length === 0) return 0;
  let matches = 0;
  for (let index = 0; index < leftReturns.length; index += 1) {
    const leftDirection = Math.sign(leftReturns[index]);
    const rightDirection = Math.sign(rightReturns[index]);
    if (leftDirection === rightDirection) matches += 1;
  }
  return (matches / leftReturns.length) * 100;
}

export function computeMaxDrawdownPct(values) {
  const closes = values.map(closeOf).filter((value) => Number.isFinite(value) && value > 0);
  if (!closes.length) return null;
  let peak = closes[0];
  let maxDrawdown = 0;
  for (const close of closes) {
    peak = Math.max(peak, close);
    const drawdown = ((close / peak) - 1) * 100;
    maxDrawdown = Math.min(maxDrawdown, drawdown);
  }
  return round2(maxDrawdown);
}

export function computeForwardReturnPct(bars, endIndex, forwardDays) {
  const baseClose = bars[endIndex]?.close;
  const forwardClose = bars[endIndex + forwardDays]?.close;
  if (!Number.isFinite(baseClose) || !Number.isFinite(forwardClose) || baseClose <= 0 || forwardClose <= 0) return null;
  return round2(((forwardClose / baseClose) - 1) * 100);
}

const standardDeviation = (values) => {
  if (!values.length) return 0;
  const avg = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - avg) ** 2)));
};

export function computeSimilarityScore({
  currentReturns,
  candidateReturns,
  currentNormalizedPath,
  candidateNormalizedPath,
  volatilityPenaltyFactor = DEFAULT_SIMILAR_PATTERN_OPTIONS.volatilityPenaltyFactor,
}) {
  const correlation = computePearsonCorrelation(currentReturns, candidateReturns);
  const corrScore = ((correlation + 1) / 2) * 100;
  const normalizedRmse = computeRmse(currentNormalizedPath, candidateNormalizedPath) / 100;
  const rmseScore = Math.max(0, 100 - normalizedRmse * 100);
  const directionScore = computeDirectionMatchPct(currentReturns, candidateReturns);
  const currentVol = standardDeviation(currentReturns);
  const candidateVol = standardDeviation(candidateReturns);
  const volatilityPenalty = Math.min(20, Math.abs(currentVol - candidateVol) * volatilityPenaltyFactor);
  const similarityScore = clamp(
    corrScore * 0.45 + rmseScore * 0.35 + directionScore * 0.20 - volatilityPenalty,
    0,
    100,
  );
  return {
    similarityScore: round2(similarityScore),
    corrScore: round2(corrScore),
    rmseScore: round2(rmseScore),
    directionScore: round2(directionScore),
    volatilityPenalty: round2(volatilityPenalty),
  };
}

export function labelSimilarityScore(score) {
  if (score >= 85) return SCORE_LABELS.verySimilar;
  if (score >= 70) return SCORE_LABELS.similar;
  if (score >= 55) return SCORE_LABELS.partlySimilar;
  return SCORE_LABELS.lowSimilarity;
}

export function computeConfidenceScore({ matches, candidateCount, eligibleCandidateCount } = {}) {
  if (!Array.isArray(matches) || matches.length === 0) return 0;
  const topScore = Number.isFinite(matches[0]?.similarityScore) ? matches[0].similarityScore : 0;
  const bottomScore = Number.isFinite(matches[matches.length - 1]?.similarityScore)
    ? matches[matches.length - 1].similarityScore
    : topScore;
  const spread = Math.max(0, topScore - bottomScore);
  const spreadFactor = clamp(100 - spread * 1.5, 0, 100);
  const poolSize = Number.isFinite(eligibleCandidateCount) ? eligibleCandidateCount : (Number.isFinite(candidateCount) ? candidateCount : 0);
  const candidatePoolFactor = clamp((poolSize / 30) * 100, 0, 100);
  const volatilityPenalties = matches
    .map((match) => match?.scoreBreakdown?.volatilityPenalty)
    .filter((value) => Number.isFinite(value));
  const avgVolatilityPenalty = volatilityPenalties.length ? mean(volatilityPenalties) : 0;
  const volatilityFactor = clamp(100 - avgVolatilityPenalty * 5, 0, 100);
  const outcomeAvailable = matches.filter(
    (match) => Number.isFinite(match?.forwardReturnD5Pct) && Number.isFinite(match?.forwardReturnD20Pct),
  ).length;
  const outcomeFactor = matches.length ? (outcomeAvailable / matches.length) * 100 : 0;
  const rawScore = topScore * 0.35
    + spreadFactor * 0.2
    + candidatePoolFactor * 0.15
    + volatilityFactor * 0.15
    + outcomeFactor * 0.15;
  return round2(clamp(rawScore, 0, 100));
}

export function labelConfidenceScore(score) {
  if (score >= 85) return CONFIDENCE_LABELS.high;
  if (score >= 70) return CONFIDENCE_LABELS.moderateHigh;
  if (score >= 55) return CONFIDENCE_LABELS.moderate;
  return CONFIDENCE_LABELS.low;
}

export function classifyMatchReasonTags(match) {
  const tags = [];
  const breakdown = match?.scoreBreakdown ?? {};
  if (Number.isFinite(breakdown.corrScore) && breakdown.corrScore >= 80) {
    tags.push(MATCH_REASON_TAGS.highCorrelation);
  }
  if (Number.isFinite(breakdown.rmseScore) && breakdown.rmseScore >= 80) {
    tags.push(MATCH_REASON_TAGS.normalizedPathSimilar);
  }
  if (Number.isFinite(breakdown.directionScore) && breakdown.directionScore >= 70) {
    tags.push(MATCH_REASON_TAGS.directionAligned);
  }
  if (match?.drawdownLabel === 'limited_historical_drawdown' || match?.drawdownLabel === 'moderate_historical_drawdown') {
    tags.push(MATCH_REASON_TAGS.drawdownSimilar);
  }
  if ((Number.isFinite(breakdown.volatilityPenalty) && breakdown.volatilityPenalty >= 8) || match?.drawdownLabel === 'large_historical_drawdown') {
    tags.push(MATCH_REASON_TAGS.volatilityCaution);
  }
  if (
    match?.outcomeLabel === 'historical_mixed_follow_through'
    || !Number.isFinite(match?.forwardReturnD5Pct)
    || !Number.isFinite(match?.forwardReturnD20Pct)
  ) {
    tags.push(MATCH_REASON_TAGS.outcomeInterpretationCaution);
  }
  if (tags.length === 0) {
    tags.push(MATCH_REASON_TAGS.outcomeInterpretationCaution);
  }
  return tags;
}

export function computePatternQuality({ matches, eligibleCandidateCount, currentWindow } = {}) {
  const safeMatches = Array.isArray(matches) ? matches : [];
  const candidatePoolFactor = clamp(((Number.isFinite(eligibleCandidateCount) ? eligibleCandidateCount : 0) / 30) * 100, 0, 100);
  const dataSufficiencyFactor = currentWindow
    && Array.isArray(currentWindow.normalizedPath)
    && currentWindow.normalizedPath.length > 0
    && !currentWindow.normalizedPath.includes(null)
    ? 100
    : 0;
  const volatilityPenalties = safeMatches
    .map((match) => match?.scoreBreakdown?.volatilityPenalty)
    .filter((value) => Number.isFinite(value));
  const avgVolatilityPenalty = volatilityPenalties.length ? mean(volatilityPenalties) : 0;
  const volatilityFactor = clamp(100 - avgVolatilityPenalty * 6, 0, 100);
  const drawdowns = safeMatches
    .map((match) => match?.maxDrawdownAfterPct)
    .filter((value) => Number.isFinite(value));
  const worstDrawdown = drawdowns.length ? Math.min(...drawdowns) : 0;
  const drawdownFactor = clamp(100 + worstDrawdown * 4, 0, 100);

  const score = round2(clamp(
    candidatePoolFactor * 0.3 + dataSufficiencyFactor * 0.2 + volatilityFactor * 0.25 + drawdownFactor * 0.25,
    0,
    100,
  ));
  const label = score >= 85
    ? PATTERN_QUALITY_LABELS.excellent
    : score >= 70
      ? PATTERN_QUALITY_LABELS.good
      : score >= 55
        ? PATTERN_QUALITY_LABELS.caution
        : PATTERN_QUALITY_LABELS.low;

  const reasons = [];
  const warnings = [];
  if (safeMatches.length > 0 && Number.isFinite(safeMatches[0]?.similarityScore) && safeMatches[0].similarityScore >= 85) {
    reasons.push('최상위 유사 패턴의 유사도 점수가 높습니다.');
  }
  if ((Number.isFinite(eligibleCandidateCount) ? eligibleCandidateCount : 0) >= 30) {
    reasons.push('비교 가능한 과거 후보 구간 수가 충분합니다.');
  } else {
    warnings.push('비교 가능한 과거 후보 구간 수가 많지 않습니다.');
  }
  const highVolatilityMatches = safeMatches.filter(
    (match) => Number.isFinite(match?.scoreBreakdown?.volatilityPenalty) && match.scoreBreakdown.volatilityPenalty >= 8,
  );
  if (highVolatilityMatches.length > 0) {
    warnings.push('일부 유사 구간에서 현재 구간과의 변동성 차이가 크게 감지되었습니다.');
  }
  const extremeDrawdownMatches = safeMatches.filter(
    (match) => Number.isFinite(match?.maxDrawdownAfterPct) && match.maxDrawdownAfterPct <= -8,
  );
  if (extremeDrawdownMatches.length > 0) {
    warnings.push('일부 유사 구간 이후 큰 폭의 역사적 낙폭이 있었습니다.');
  }
  if (reasons.length === 0) {
    reasons.push('현재 구간과 과거 후보 구간 간 형태적 유사성이 관찰되었습니다.');
  }

  const limitations = [
    '과거 유사도는 미래 결과를 예측하거나 보장하지 않습니다.',
    '동일 종목의 과거 가격 흐름만을 대상으로 한 형태적 유사도 비교입니다.',
  ];

  return { score, label, reasons, warnings, limitations };
}

const directionBalanceLabel = (distribution) => {
  if (!distribution || !distribution.totalCount) return '데이터 부족';
  if (distribution.positiveCount > distribution.negativeCount) return '상승 우세';
  if (distribution.negativeCount > distribution.positiveCount) return '하락 우세';
  return '혼조';
};

export function computeOutcomeDistribution(matches) {
  const safeMatches = Array.isArray(matches) ? matches : [];
  const buildWindowDistribution = (window, key) => {
    const values = safeMatches
      .map((match) => match?.[key])
      .filter((value) => Number.isFinite(value));
    const positiveCount = values.filter((value) => value > 0.5).length;
    const negativeCount = values.filter((value) => value < -0.5).length;
    const flatCount = values.length - positiveCount - negativeCount;
    return {
      window,
      totalCount: values.length,
      positiveCount,
      negativeCount,
      flatCount,
      averageForwardReturnPct: values.length ? round2(mean(values)) : null,
      medianForwardReturnPct: values.length ? round2(computeMedian(values)) : null,
      bestForwardReturnPct: values.length ? round2(Math.max(...values)) : null,
      worstForwardReturnPct: values.length ? round2(Math.min(...values)) : null,
    };
  };
  return {
    d5: buildWindowDistribution(5, 'forwardReturnD5Pct'),
    d20: buildWindowDistribution(20, 'forwardReturnD20Pct'),
  };
}

export function createSimilarPatternContractSummary({
  market,
  symbol,
  asOfDate,
  baseWindow,
  topK,
  candidateCount,
  eligibleCandidateCount,
  matches,
  confidenceScore,
  confidenceLabel,
  patternQuality,
  outcomeDistribution,
} = {}) {
  const safeMatches = Array.isArray(matches) ? matches : [];
  const topMatch = safeMatches.length ? safeMatches[0] : null;
  return {
    market: market ?? 'KR',
    symbol: typeof symbol === 'string' ? symbol : '',
    asOfDate: typeof asOfDate === 'string' ? asOfDate : '',
    baseWindow: baseWindow ?? null,
    topK: topK ?? null,
    candidateCount: Number.isFinite(candidateCount) ? candidateCount : 0,
    eligibleCandidateCount: Number.isFinite(eligibleCandidateCount) ? eligibleCandidateCount : 0,
    matchCount: safeMatches.length,
    topMatchScore: topMatch && Number.isFinite(topMatch.similarityScore) ? topMatch.similarityScore : null,
    topMatchLabel: topMatch?.scoreLabel ?? null,
    confidenceScore: Number.isFinite(confidenceScore) ? confidenceScore : null,
    confidenceLabel: confidenceLabel ?? null,
    patternQualityLabel: patternQuality?.label ?? null,
    d5DirectionBalance: directionBalanceLabel(outcomeDistribution?.d5),
    d20DirectionBalance: directionBalanceLabel(outcomeDistribution?.d20),
    primaryLimitations: Array.isArray(patternQuality?.limitations) ? patternQuality.limitations.slice(0, 2) : [],
  };
}

export function validateSimilarPatternInput(input) {
  if (!input || typeof input !== 'object') return { ok: false, status: STATUS.failClosed, message: 'Input must be an object.' };
  if (input.market !== 'KR') return { ok: false, status: STATUS.failClosed, message: 'Market must be KR.' };
  if (input.timeframe !== 'D') return { ok: false, status: STATUS.failClosed, message: 'Timeframe must be D.' };
  if (typeof input.symbol !== 'string' || input.symbol.trim().length === 0) return { ok: false, status: STATUS.failClosed, message: 'Symbol is required.' };
  if (!DEFAULT_SIMILAR_PATTERN_OPTIONS.allowedBaseWindows.includes(input.baseWindow)) return { ok: false, status: STATUS.failClosed, message: 'Base window must be 20, 40, or 60.' };
  if (input.lookbackYears !== 3) return { ok: false, status: STATUS.failClosed, message: 'Lookback years must be 3.' };
  if (input.topK !== 5) return { ok: false, status: STATUS.failClosed, message: 'Top K must be 5.' };
  if (!Array.isArray(input.ohlcv)) return { ok: false, status: STATUS.failClosed, message: 'OHLCV must be an array.' };
  if (input.ohlcv.length < input.baseWindow + 20 + input.baseWindow) {
    return { ok: false, status: STATUS.dataInsufficient, message: 'Insufficient OHLCV data.' };
  }
  for (const [index, bar] of input.ohlcv.entries()) {
    for (const field of ['date', 'open', 'high', 'low', 'close']) {
      if (bar?.[field] === undefined || bar?.[field] === null || bar?.[field] === '') {
        return { ok: false, status: STATUS.failClosed, message: `Invalid OHLCV bar at ${index}.` };
      }
    }
    for (const field of ['open', 'high', 'low', 'close']) {
      if (!Number.isFinite(bar[field])) return { ok: false, status: STATUS.failClosed, message: `Invalid numeric OHLCV value at ${index}.` };
    }
    if (bar.close <= 0) return { ok: false, status: STATUS.failClosed, message: 'Close must be positive.' };
  }
  return { ok: true };
}

const sortBars = (bars) => [...bars].sort((left, right) => dateKey(left).localeCompare(dateKey(right)));

const findCurrentEndIndex = (bars, asOfDate) => {
  if (!asOfDate) return bars.length - 1;
  let selected = -1;
  for (let index = 0; index < bars.length; index += 1) {
    if (dateKey(bars[index]) <= asOfDate) selected = index;
  }
  return selected === -1 ? bars.length - 1 : selected;
};

const aggregateOutcomes = (matches) => {
  const d5 = matches.map((match) => match.forwardReturnD5Pct).filter((value) => Number.isFinite(value));
  const d20 = matches.map((match) => match.forwardReturnD20Pct).filter((value) => Number.isFinite(value));
  return {
    positiveCountD5: d5.filter((value) => value > 0).length,
    negativeCountD5: d5.filter((value) => value < 0).length,
    positiveCountD20: d20.filter((value) => value > 0).length,
    negativeCountD20: d20.filter((value) => value < 0).length,
    averageForwardReturnD5Pct: d5.length ? round2(mean(d5)) : null,
    medianForwardReturnD5Pct: round2(median(d5)),
    averageForwardReturnD20Pct: d20.length ? round2(mean(d20)) : null,
    medianForwardReturnD20Pct: round2(median(d20)),
  };
};

const outcomeLabel = (d5, d20) => {
  if ((d5 ?? 0) > 0 && (d20 ?? 0) > 0) return 'historical_positive_follow_through';
  if ((d5 ?? 0) < 0 && (d20 ?? 0) < 0) return 'historical_negative_follow_through';
  return 'historical_mixed_follow_through';
};

const drawdownLabel = (maxDrawdownAfterPct) => {
  if (maxDrawdownAfterPct === null) return 'drawdown_unavailable';
  if (maxDrawdownAfterPct <= -8) return 'large_historical_drawdown';
  if (maxDrawdownAfterPct <= -4) return 'moderate_historical_drawdown';
  return 'limited_historical_drawdown';
};

export function runSimilarPatternAgent(input) {
  try {
    const validation = validateSimilarPatternInput(input);
    if (!validation.ok) return blockedOutput(validation.status, input, validation.message);

    const bars = sortBars(input.ohlcv);
    const isStrictAscending = bars.every((bar, index) => index === 0 || dateKey(bars[index - 1]) < dateKey(bar));
    if (!isStrictAscending) return blockedOutput(STATUS.failClosed, input, 'Date ordering must be valid after sorting.');

    const baseWindow = input.baseWindow;
    const currentEndIndex = findCurrentEndIndex(bars, input.asOfDate);
    const currentStartIndex = currentEndIndex - baseWindow + 1;
    if (currentStartIndex < 0) return blockedOutput(STATUS.dataInsufficient, input, 'Current window is insufficient.');

    const currentWindowBars = bars.slice(currentStartIndex, currentEndIndex + 1);
    const currentReturns = computeLogReturns(currentWindowBars);
    const currentNormalizedPath = computeNormalizedPath(currentWindowBars);
    if (currentReturns.length !== baseWindow - 1 || currentNormalizedPath.includes(null)) {
      return blockedOutput(STATUS.dataInsufficient, input, 'Current window transformation failed.');
    }

    const candidates = [];
    let scannedCandidateCount = 0;
    const latestCandidateEnd = currentStartIndex - 21;
    for (let startIndex = 0; startIndex + baseWindow - 1 <= latestCandidateEnd; startIndex += 1) {
      const endIndex = startIndex + baseWindow - 1;
      if (endIndex + 20 >= currentStartIndex) continue;
      if (!bars[endIndex + 20]) continue;
      scannedCandidateCount += 1;
      const candidateBars = bars.slice(startIndex, endIndex + 1);
      const candidateReturns = computeLogReturns(candidateBars);
      const candidateNormalizedPath = computeNormalizedPath(candidateBars);
      if (candidateReturns.length !== baseWindow - 1 || candidateNormalizedPath.includes(null)) continue;
      const scores = computeSimilarityScore({
        currentReturns,
        candidateReturns,
        currentNormalizedPath,
        candidateNormalizedPath,
      });
      const forwardReturnD5Pct = computeForwardReturnPct(bars, endIndex, 5);
      const forwardReturnD20Pct = computeForwardReturnPct(bars, endIndex, 20);
      const forwardWindow = [bars[endIndex], ...bars.slice(endIndex + 1, endIndex + 21)];
      const maxDrawdownAfterPct = computeMaxDrawdownPct(forwardWindow);
      candidates.push({
        rank: 0,
        startDate: bars[startIndex].date,
        endDate: bars[endIndex].date,
        similarityScore: scores.similarityScore,
        scoreLabel: labelSimilarityScore(scores.similarityScore),
        scoreBreakdown: scores,
        normalizedPath: candidateNormalizedPath,
        forwardReturnD5Pct,
        forwardReturnD20Pct,
        maxDrawdownAfterPct,
        outcomeLabel: outcomeLabel(forwardReturnD5Pct, forwardReturnD20Pct),
        drawdownLabel: drawdownLabel(maxDrawdownAfterPct),
      });
    }

    if (candidates.length < input.topK) {
      return blockedOutput(STATUS.candidateInsufficient, input, 'Candidate windows are insufficient.');
    }

    const rankedMatches = candidates
      .sort((left, right) => right.similarityScore - left.similarityScore || left.startDate.localeCompare(right.startDate))
      .slice(0, input.topK)
      .map((candidate, index) => ({ ...candidate, rank: index + 1 }));

    const matches = rankedMatches.map((match) => ({
      ...match,
      matchReasonTags: classifyMatchReasonTags(match),
    }));

    const eligibleCandidateCount = candidates.length;
    const confidenceScore = computeConfidenceScore({
      matches,
      candidateCount: scannedCandidateCount,
      eligibleCandidateCount,
    });
    const confidenceLabel = labelConfidenceScore(confidenceScore);
    const patternQuality = computePatternQuality({
      matches,
      eligibleCandidateCount,
      currentWindow: { normalizedPath: currentNormalizedPath },
    });
    const outcomeDistribution = computeOutcomeDistribution(matches);
    const contractSummary = createSimilarPatternContractSummary({
      market: 'KR',
      symbol: input.symbol,
      asOfDate: input.asOfDate,
      baseWindow,
      topK: input.topK,
      candidateCount: scannedCandidateCount,
      eligibleCandidateCount,
      matches,
      confidenceScore,
      confidenceLabel,
      patternQuality,
      outcomeDistribution,
    });

    return {
      ok: true,
      status: STATUS.ready,
      source: 'normalized_ohlcv',
      contractVersion: SIMILAR_PATTERN_CONTRACT_VERSION,
      summary: {
        market: 'KR',
        symbol: input.symbol,
        timeframe: 'D',
        baseWindow,
        lookbackYears: input.lookbackYears,
        topK: input.topK,
        matchCount: matches.length,
        similarityMeaning: 'historical_shape_similarity_only',
      },
      currentWindow: {
        startDate: bars[currentStartIndex].date,
        endDate: bars[currentEndIndex].date,
        normalizedPathIndexBase: 100,
        normalizedPath: currentNormalizedPath,
      },
      matches,
      aggregateOutcomes: aggregateOutcomes(matches),
      outcomeDistribution,
      confidenceScore,
      confidenceLabel,
      patternQuality,
      contractSummary,
      safety: { ...SAFETY },
      error: null,
    };
  } catch {
    return blockedOutput(STATUS.failClosed, input, 'Similar Pattern Agent failed closed.');
  }
}

// Planning contract markers: log returns, normalized path, same-symbol historical,
// historical_shape_similarity_only, No buy/sell recommendation.
