import assert from 'node:assert/strict';
import { inspect } from 'node:util';
import { runSimilarPatternAgent } from '../src/lib/server/chart-ai/similar-pattern-agent.mjs';
import {
  createInsufficientSimilarPatternFixtureInput,
  createInvalidCloseSimilarPatternFixtureInput,
  createSimilarPatternFixtureInput,
} from '../src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs';

let assertions = 0;
const check = (condition, message) => {
  assertions += 1;
  assert.ok(condition, message);
};

const hasForbiddenText = (value) => {
  const serialized = JSON.stringify(value);
  return [
    '매수하세요',
    '매도하세요',
    '목표가',
    '손절가',
    'appsecret',
    'access_token',
    'service_role',
    'OPENAI_API_KEY',
    'KIS_APP_SECRET',
  ].some((token) => serialized.includes(token));
};

const input = createSimilarPatternFixtureInput();
const output = runSimilarPatternAgent(input);

check(output.ok === true, 'default fixture must be ok.');
check(output.status === 'similar_patterns_ready', 'default fixture must be ready.');
check(output.source === 'normalized_ohlcv', 'source must be normalized_ohlcv.');
check(output.summary.market === 'KR', 'market must be KR.');
check(output.summary.timeframe === 'D', 'timeframe must be D.');
check(output.summary.baseWindow === 20, 'baseWindow must be 20.');
check(output.summary.topK === 5, 'topK must be 5.');
check(output.matches.length === 5, 'matches must contain Top 5.');
check(output.currentWindow.normalizedPathIndexBase === 100, 'current normalized path index base must be 100.');
check(output.summary.similarityMeaning === 'historical_shape_similarity_only', 'similarity meaning must be historical only.');

for (const [index, match] of output.matches.entries()) {
  check(match.rank === index + 1, `match ${index} rank must be stable.`);
  check(match.similarityScore >= 0 && match.similarityScore <= 100, `match ${index} score must be 0..100.`);
  if (index > 0) {
    check(output.matches[index - 1].similarityScore >= match.similarityScore, 'matches must be sorted descending.');
  }
  check(typeof match.scoreLabel === 'string' && match.scoreLabel.length > 0, 'match must include score label.');
  check(typeof match.forwardReturnD5Pct === 'number' || match.forwardReturnD5Pct === null, 'D5 outcome must be number or null.');
  check(typeof match.forwardReturnD20Pct === 'number' || match.forwardReturnD20Pct === null, 'D20 outcome must be number or null.');
  check(typeof match.maxDrawdownAfterPct === 'number' || match.maxDrawdownAfterPct === null, 'drawdown must be number or null.');
  check(Array.isArray(match.normalizedPath), 'match must include normalized path.');
  check(match.normalizedPath.length === 20, 'match normalized path must match base window length.');
}

check(output.safety.rawKisPayloadExposed === false, 'raw KIS payload flag must be false.');
check(output.safety.rawProviderErrorExposed === false, 'raw provider error flag must be false.');
check(output.safety.secretExposed === false, 'secret flag must be false.');
check(output.safety.buySellRecommendation === false, 'buy/sell flag must be false.');
check(output.aggregateOutcomes.positiveCountD5 + output.aggregateOutcomes.negativeCountD5 <= 5, 'D5 counts must be bounded.');
check(output.aggregateOutcomes.positiveCountD20 + output.aggregateOutcomes.negativeCountD20 <= 5, 'D20 counts must be bounded.');
check(hasForbiddenText(output) === false, 'output must not include forbidden text.');

const repeated = runSimilarPatternAgent(createSimilarPatternFixtureInput());
check(JSON.stringify(output) === JSON.stringify(repeated), `outputs must be deterministic. ${inspect(repeated, { depth: 1 })}`);

const insufficient = runSimilarPatternAgent(createInsufficientSimilarPatternFixtureInput());
check(insufficient.ok === false, 'insufficient fixture must be blocked.');
check(
  ['blocked_data_insufficient', 'blocked_candidate_insufficient'].includes(insufficient.status),
  'insufficient fixture must use data/candidate blocked status.',
);
check(insufficient.safety.rawKisPayloadExposed === false, 'insufficient safety raw KIS flag must be false.');

const invalidClose = runSimilarPatternAgent(createInvalidCloseSimilarPatternFixtureInput());
check(invalidClose.ok === false, 'invalid close fixture must be blocked.');
check(['fail_closed', 'blocked_data_insufficient'].includes(invalidClose.status), 'invalid close fixture must fail closed or data-block.');
check(invalidClose.safety.secretExposed === false, 'invalid close safety secret flag must be false.');
check(hasForbiddenText(invalidClose) === false, 'invalid close output must not include forbidden text.');

console.log(`Phase 3FF-A-SP-A smoke: PASS (${assertions}/${assertions} assertions passed)`);
