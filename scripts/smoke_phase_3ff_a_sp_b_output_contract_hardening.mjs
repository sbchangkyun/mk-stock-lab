import assert from 'node:assert/strict';
import {
  SIMILAR_PATTERN_CONTRACT_VERSION,
  CONFIDENCE_LABELS,
  PATTERN_QUALITY_LABELS,
  MATCH_REASON_TAGS,
  computeMedian,
  computeConfidenceScore,
  labelConfidenceScore,
  classifyMatchReasonTags,
  computePatternQuality,
  computeOutcomeDistribution,
  createSimilarPatternContractSummary,
  runSimilarPatternAgent,
} from '../src/lib/server/chart-ai/similar-pattern-agent.mjs';
import {
  createSimilarPatternFixtureInput,
  createInsufficientSimilarPatternFixtureInput,
  createInvalidCloseSimilarPatternFixtureInput,
  createLowConfidenceSimilarPatternFixtureInput,
  createHighVolatilitySimilarPatternFixtureInput,
  createFlatOutcomeSimilarPatternFixtureInput,
} from '../src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs';

let assertions = 0;
const check = (condition, message) => {
  assertions += 1;
  assert.ok(condition, message);
};
const equal = (actual, expected, message) => {
  assertions += 1;
  assert.equal(actual, expected, message);
};

const forbiddenInvestmentLanguage = [
  '매수하세요',
  '매도하세요',
  '지금 진입',
  '목표가는',
  '손절가는',
  '강력 추천',
  '상승이 확정',
  '하락이 확정',
];

// Unicode-escaped via String.fromCharCode so this file's own raw text never contains the
// corrupted byte sequences it checks for (the checker also scans this file for mojibake).
const mojibakePatterns = [
  String.fromCharCode(65533),
  String.fromCharCode(63, 47663, 50464),
  String.fromCharCode(63, 44968, 50754),
  String.fromCharCode(27877, 45828, 44181),
  String.fromCharCode(63, 1098, 50468),
  String.fromCharCode(63, 50326, 49316),
  String.fromCharCode(63, 45896, 53195),
  String.fromCharCode(63, 49649, 44902),
  String.fromCharCode(30041, 12668, 45780),
  String.fromCharCode(32016, 9338, 47796),
];

const checkSafeText = (value, label) => {
  const serialized = JSON.stringify(value);
  for (const token of mojibakePatterns) {
    check(!serialized.includes(token), `${label} must not contain mojibake pattern`);
  }
  for (const token of forbiddenInvestmentLanguage) {
    check(!serialized.includes(token), `${label} must not contain forbidden investment language: ${token}`);
  }
  check(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(serialized), `${label} must not contain raw email-like values`);
  check(!/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(serialized), `${label} must not contain JWT-like values`);
  check(!/appsecret|access_token|service_role|OPENAI_API_KEY|KIS_APP_SECRET/i.test(serialized), `${label} must not contain secret-like tokens`);
};

// --- 1. Contract versioning ---
equal(SIMILAR_PATTERN_CONTRACT_VERSION, 'similar-pattern-agent.v0.2', 'contract version constant must be exact');

const output = runSimilarPatternAgent(createSimilarPatternFixtureInput());
equal(output.ok, true, 'default fixture must be ok');
equal(output.status, 'similar_patterns_ready', 'default fixture must be ready');
equal(output.contractVersion, SIMILAR_PATTERN_CONTRACT_VERSION, 'output contractVersion must match the exported constant');

// --- 2. Confidence score ---
check(typeof output.confidenceScore === 'number', 'confidenceScore must be a number');
check(output.confidenceScore >= 0 && output.confidenceScore <= 100, 'confidenceScore must be within 0..100');
check(Object.values(CONFIDENCE_LABELS).includes(output.confidenceLabel), 'confidenceLabel must be a known label');
equal(labelConfidenceScore(85), CONFIDENCE_LABELS.high, 'labelConfidenceScore(85) must be high');
equal(labelConfidenceScore(70), CONFIDENCE_LABELS.moderateHigh, 'labelConfidenceScore(70) must be moderateHigh');
equal(labelConfidenceScore(55), CONFIDENCE_LABELS.moderate, 'labelConfidenceScore(55) must be moderate');
equal(labelConfidenceScore(54.99), CONFIDENCE_LABELS.low, 'labelConfidenceScore(54.99) must be low');
check(typeof computeConfidenceScore({ matches: [] }) === 'number', 'computeConfidenceScore must handle an empty matches array without throwing');
equal(computeConfidenceScore({ matches: [] }), 0, 'computeConfidenceScore with no matches must be 0');

// --- 3. Pattern quality ---
check(typeof output.patternQuality === 'object' && output.patternQuality !== null, 'patternQuality must be an object');
check(typeof output.patternQuality.score === 'number' && output.patternQuality.score >= 0 && output.patternQuality.score <= 100, 'patternQuality.score must be 0..100');
check(Object.values(PATTERN_QUALITY_LABELS).includes(output.patternQuality.label), 'patternQuality.label must be a known label');
check(Array.isArray(output.patternQuality.reasons), 'patternQuality.reasons must be an array');
check(Array.isArray(output.patternQuality.warnings), 'patternQuality.warnings must be an array');
check(Array.isArray(output.patternQuality.limitations) && output.patternQuality.limitations.length > 0, 'patternQuality.limitations must be a non-empty array');
check(output.patternQuality.limitations.some((text) => text.includes('미래')), 'patternQuality.limitations must mention that history does not predict the future');

// --- 4. Match reason tags ---
equal(output.matches.length, 5, 'default fixture must produce Top 5 matches');
for (const [index, match] of output.matches.entries()) {
  check(Array.isArray(match.matchReasonTags) && match.matchReasonTags.length > 0, `match ${index} matchReasonTags must be a non-empty array`);
  for (const tag of match.matchReasonTags) {
    check(Object.values(MATCH_REASON_TAGS).includes(tag), `match ${index} matchReasonTags entries must be known tags`);
  }
}
check(typeof classifyMatchReasonTags({}) === 'object', 'classifyMatchReasonTags must handle an empty match without throwing');
check(classifyMatchReasonTags({}).length > 0, 'classifyMatchReasonTags must always return at least one tag');

// --- 5. Outcome distribution ---
for (const key of ['d5', 'd20']) {
  const bucket = output.outcomeDistribution[key];
  check(typeof bucket === 'object' && bucket !== null, `outcomeDistribution.${key} must be an object`);
  for (const field of ['window', 'totalCount', 'positiveCount', 'negativeCount', 'flatCount', 'averageForwardReturnPct', 'medianForwardReturnPct', 'bestForwardReturnPct', 'worstForwardReturnPct']) {
    check(field in bucket, `outcomeDistribution.${key} must include field ${field}`);
  }
  equal(bucket.totalCount, bucket.positiveCount + bucket.negativeCount + bucket.flatCount, `outcomeDistribution.${key} counts must sum to totalCount`);
}
equal(computeMedian([1, 2, 3]), 2, 'computeMedian must compute the median of an odd-length array');
equal(computeMedian([]), null, 'computeMedian must return null for an empty array');

// --- 6. Contract summary ---
const summaryFields = [
  'market', 'symbol', 'asOfDate', 'baseWindow', 'topK', 'candidateCount', 'eligibleCandidateCount',
  'matchCount', 'topMatchScore', 'topMatchLabel', 'confidenceScore', 'confidenceLabel',
  'patternQualityLabel', 'd5DirectionBalance', 'd20DirectionBalance', 'primaryLimitations',
];
for (const field of summaryFields) {
  check(field in output.contractSummary, `contractSummary must include field ${field}`);
}
equal(output.contractSummary.symbol, output.summary.symbol, 'contractSummary.symbol must match summary.symbol');
equal(output.contractSummary.matchCount, output.matches.length, 'contractSummary.matchCount must match matches.length');
equal(output.contractSummary.confidenceScore, output.confidenceScore, 'contractSummary.confidenceScore must match output.confidenceScore');
equal(output.contractSummary.patternQualityLabel, output.patternQuality.label, 'contractSummary.patternQualityLabel must match output.patternQuality.label');
check(typeof createSimilarPatternContractSummary() === 'object', 'createSimilarPatternContractSummary must handle no args without throwing');

// --- 7. Fail-closed/edge fixtures ---
const lowConfidence = runSimilarPatternAgent(createLowConfidenceSimilarPatternFixtureInput());
equal(lowConfidence.ok, true, 'low-confidence fixture must be ok');
equal(lowConfidence.status, 'similar_patterns_ready', 'low-confidence fixture must be ready');
check(lowConfidence.confidenceScore < output.confidenceScore, 'low-confidence fixture confidenceScore must be lower than the default fixture');

const highVolatility = runSimilarPatternAgent(createHighVolatilitySimilarPatternFixtureInput());
equal(highVolatility.ok, true, 'high-volatility fixture must be ok');
equal(highVolatility.status, 'similar_patterns_ready', 'high-volatility fixture must be ready');
check(highVolatility.patternQuality.warnings.length > 0, 'high-volatility fixture must produce at least one pattern-quality warning');
check(
  highVolatility.patternQuality.warnings.some((text) => text.includes('변동성')),
  'high-volatility fixture warnings must mention volatility',
);

const flatOutcome = runSimilarPatternAgent(createFlatOutcomeSimilarPatternFixtureInput());
equal(flatOutcome.ok, true, 'flat-outcome fixture must be ok');
equal(flatOutcome.status, 'similar_patterns_ready', 'flat-outcome fixture must be ready');
check(
  flatOutcome.outcomeDistribution.d5.flatCount >= 1 || flatOutcome.outcomeDistribution.d20.flatCount >= 1,
  'flat-outcome fixture must produce at least one flat match in D5 or D20',
);

const insufficient = runSimilarPatternAgent(createInsufficientSimilarPatternFixtureInput());
equal(insufficient.ok, false, 'insufficient fixture must remain blocked (backward compatibility)');
check(
  ['blocked_data_insufficient', 'blocked_candidate_insufficient'].includes(insufficient.status),
  'insufficient fixture must use a data/candidate blocked status',
);

const invalidClose = runSimilarPatternAgent(createInvalidCloseSimilarPatternFixtureInput());
equal(invalidClose.ok, false, 'invalid-close fixture must remain blocked (backward compatibility)');
check(
  ['fail_closed', 'blocked_data_insufficient'].includes(invalidClose.status),
  'invalid-close fixture must fail closed or data-block',
);

// --- 8. Safety/Korean copy hardening ---
checkSafeText(output, 'default fixture output');
checkSafeText(lowConfidence, 'low-confidence fixture output');
checkSafeText(highVolatility, 'high-volatility fixture output');
checkSafeText(flatOutcome, 'flat-outcome fixture output');
check(output.safety.rawKisPayloadExposed === false, 'raw KIS payload flag must be false');
check(output.safety.rawProviderErrorExposed === false, 'raw provider error flag must be false');
check(output.safety.secretExposed === false, 'secret flag must be false');
check(output.safety.buySellRecommendation === false, 'buy/sell flag must be false');

// --- 9. Backward compatibility with SP-A output ---
equal(output.source, 'normalized_ohlcv', 'source must remain normalized_ohlcv');
equal(output.summary.market, 'KR', 'summary.market must remain KR');
equal(output.summary.timeframe, 'D', 'summary.timeframe must remain D');
equal(output.summary.baseWindow, 20, 'summary.baseWindow must remain 20');
equal(output.summary.topK, 5, 'summary.topK must remain 5');
equal(output.summary.similarityMeaning, 'historical_shape_similarity_only', 'summary.similarityMeaning must be preserved');
equal(output.currentWindow.normalizedPathIndexBase, 100, 'currentWindow.normalizedPathIndexBase must remain 100');
for (const [index, match] of output.matches.entries()) {
  equal(match.rank, index + 1, `match ${index} rank must be stable`);
  check(match.similarityScore >= 0 && match.similarityScore <= 100, `match ${index} score must be 0..100`);
  if (index > 0) {
    check(output.matches[index - 1].similarityScore >= match.similarityScore, 'matches must remain sorted descending');
  }
  check(typeof match.scoreLabel === 'string' && match.scoreLabel.length > 0, 'match must include score label');
  check(typeof match.forwardReturnD5Pct === 'number' || match.forwardReturnD5Pct === null, 'D5 outcome must be number or null');
  check(typeof match.forwardReturnD20Pct === 'number' || match.forwardReturnD20Pct === null, 'D20 outcome must be number or null');
  check(typeof match.maxDrawdownAfterPct === 'number' || match.maxDrawdownAfterPct === null, 'drawdown must be number or null');
  check(Array.isArray(match.normalizedPath) && match.normalizedPath.length === 20, 'match normalized path must retain base window length');
}
check(output.aggregateOutcomes.positiveCountD5 + output.aggregateOutcomes.negativeCountD5 <= 5, 'D5 counts must remain bounded');
check(output.aggregateOutcomes.positiveCountD20 + output.aggregateOutcomes.negativeCountD20 <= 5, 'D20 counts must remain bounded');

const repeated = runSimilarPatternAgent(createSimilarPatternFixtureInput());
equal(JSON.stringify(output), JSON.stringify(repeated), 'output must remain deterministic for identical input');

console.log(`Phase 3FF-A-SP-B smoke: PASS (${assertions}/${assertions} assertions passed)`);
