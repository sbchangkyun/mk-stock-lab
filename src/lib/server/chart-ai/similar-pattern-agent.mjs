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
    const latestCandidateEnd = currentStartIndex - 21;
    for (let startIndex = 0; startIndex + baseWindow - 1 <= latestCandidateEnd; startIndex += 1) {
      const endIndex = startIndex + baseWindow - 1;
      if (endIndex + 20 >= currentStartIndex) continue;
      if (!bars[endIndex + 20]) continue;
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

    const matches = candidates
      .sort((left, right) => right.similarityScore - left.similarityScore || left.startDate.localeCompare(right.startDate))
      .slice(0, input.topK)
      .map((candidate, index) => ({ ...candidate, rank: index + 1 }));

    return {
      ok: true,
      status: STATUS.ready,
      source: 'normalized_ohlcv',
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
      safety: { ...SAFETY },
      error: null,
    };
  } catch {
    return blockedOutput(STATUS.failClosed, input, 'Similar Pattern Agent failed closed.');
  }
}

// Planning contract markers: log returns, normalized path, same-symbol historical,
// historical_shape_similarity_only, No buy/sell recommendation.
