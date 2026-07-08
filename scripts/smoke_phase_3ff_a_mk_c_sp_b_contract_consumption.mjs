import assert from 'node:assert/strict';
import {
  MK_AGENT_SECTION_KEYS,
  hasSpbSimilarPatternContract,
  summarizeSpbContractForMkAgent,
  summarizeOutcomeDistributionForMkAgent,
  summarizePatternQualityForMkAgent,
  summarizeMatchReasonTagsForMkAgent,
  detectForbiddenInvestmentLanguage,
  runMkAgent,
} from '../src/lib/server/chart-ai/mk-agent.mjs';
import {
  createMkAgentFixtureInput,
  createMkAgentSpbContractFixtureInput,
  createMkAgentLegacySimilarPatternFixtureInput,
  createMkAgentPartialSpbContractFixtureInput,
} from '../src/lib/server/chart-ai/mk-agent.fixture.mjs';

let assertions = 0;
const check = (condition, message) => {
  assertions += 1;
  assert.ok(condition, message);
};
const equal = (actual, expected, message) => {
  assertions += 1;
  assert.equal(actual, expected, message);
};
const deepEqual = (actual, expected, message) => {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
};

const requiredKeys = Object.values(MK_AGENT_SECTION_KEYS);

// Unicode-escaped via String.fromCharCode so this file's own raw text never contains the
// corrupted byte sequences it checks for (the checker also scans this file for mojibake).
const mojibakePatterns = [
  String.fromCharCode(77, 75, 32, 63, 47663, 50464, 63, 44970, 46275),
  String.fromCharCode(63, 44968, 50754),
  String.fromCharCode(63971, 45828, 44181),
  String.fromCharCode(63, 1098, 50468),
  String.fromCharCode(63, 50326, 49316),
  String.fromCharCode(63, 45896, 53195),
  String.fromCharCode(63, 49649, 44902),
  String.fromCharCode(63949, 12668, 45780),
  String.fromCharCode(63951, 9338, 47796),
  String.fromCharCode(65533),
];

const checkSafeOutput = (output, label) => {
  const serialized = JSON.stringify(output);
  for (const token of mojibakePatterns) {
    check(!serialized.includes(token), `${label} must not contain mojibake pattern`);
  }
  for (const token of detectForbiddenInvestmentLanguage(serialized)) {
    check(false, `${label} must not contain forbidden investment language: ${token}`);
  }
  check(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(serialized), `${label} must not contain raw email-like values`);
  check(!/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(serialized), `${label} must not contain JWT-like values`);
  check(!/appsecret|access_token|service_role|OPENAI_API_KEY|KIS_APP_SECRET/i.test(serialized), `${label} must not contain secret-like tokens`);
};

const checkBaseContract = (output, label) => {
  equal(output.ok, true, `${label} should be ok`);
  equal(output.status, 'mk_report_ready', `${label} should be ready`);
  equal(output.agentName, 'MK 에이전트', `${label} agent name should be exact`);
  check(typeof output.uiMode === 'string' && output.uiMode.length > 0, `${label} uiMode should be a non-empty string`);
  for (const key of requiredKeys) {
    check(output.report.sections.some((section) => section.key === key), `${label} section key should exist: ${key}`);
  }
  check(output.report.sections.some((section) => section.title === '전략 체크포인트'), `${label} strategy title should be exact`);
  check(!output.report.sections.some((section) => section.title === '사전 체크포인트'), `${label} legacy strategy title should not exist`);
  equal(output.safety.containsBuySellRecommendation, false, `${label} no buy-sell recommendation`);
  equal(output.safety.containsTargetPrice, false, `${label} no target price`);
  equal(output.safety.containsStopLossInstruction, false, `${label} no stop-loss instruction`);
  equal(output.safety.rawPayloadExposed, false, `${label} no raw payload`);
  equal(output.safety.secretExposed, false, `${label} no secret`);
  equal(output.safety.llmCalled, false, `${label} no LLM called`);
  const serialized = JSON.stringify(output);
  check(serialized.includes('삼성전자는'), `${label} serialized output must contain the grammatically correct 삼성전자는`);
  check(!serialized.includes('삼성전자은'), `${label} serialized output must not contain the known buggy 삼성전자은`);
  checkSafeOutput(output, label);
};

// --- 1. New source exports resolve and are callable without throwing on empty input ---
equal(typeof hasSpbSimilarPatternContract, 'function', 'hasSpbSimilarPatternContract must be exported');
equal(typeof summarizeSpbContractForMkAgent, 'function', 'summarizeSpbContractForMkAgent must be exported');
equal(typeof summarizeOutcomeDistributionForMkAgent, 'function', 'summarizeOutcomeDistributionForMkAgent must be exported');
equal(typeof summarizePatternQualityForMkAgent, 'function', 'summarizePatternQualityForMkAgent must be exported');
equal(typeof summarizeMatchReasonTagsForMkAgent, 'function', 'summarizeMatchReasonTagsForMkAgent must be exported');
equal(hasSpbSimilarPatternContract(null), false, 'hasSpbSimilarPatternContract(null) must be false without throwing');
equal(hasSpbSimilarPatternContract(undefined), false, 'hasSpbSimilarPatternContract(undefined) must be false without throwing');
equal(hasSpbSimilarPatternContract({}), false, 'hasSpbSimilarPatternContract({}) must be false');
equal(summarizeSpbContractForMkAgent(null), null, 'summarizeSpbContractForMkAgent(null) must be null without throwing');
equal(summarizeOutcomeDistributionForMkAgent(null), null, 'summarizeOutcomeDistributionForMkAgent(null) must be null without throwing');
equal(summarizePatternQualityForMkAgent(null), null, 'summarizePatternQualityForMkAgent(null) must be null without throwing');
deepEqual(summarizeMatchReasonTagsForMkAgent(null), [], 'summarizeMatchReasonTagsForMkAgent(null) must be an empty array without throwing');
deepEqual(
  summarizeMatchReasonTagsForMkAgent({ contractVersion: 'similar-pattern-agent.v0.2', matches: [{}] }),
  [],
  'summarizeMatchReasonTagsForMkAgent must return an empty array when the top match has no matchReasonTags',
);

// --- 2. New fixture exports resolve and produce valid MK Agent input ---
equal(typeof createMkAgentSpbContractFixtureInput, 'function', 'createMkAgentSpbContractFixtureInput must be exported');
equal(typeof createMkAgentLegacySimilarPatternFixtureInput, 'function', 'createMkAgentLegacySimilarPatternFixtureInput must be exported');
equal(typeof createMkAgentPartialSpbContractFixtureInput, 'function', 'createMkAgentPartialSpbContractFixtureInput must be exported');

const spbInput = createMkAgentSpbContractFixtureInput();
const legacyInput = createMkAgentLegacySimilarPatternFixtureInput();
const partialInput = createMkAgentPartialSpbContractFixtureInput();

equal(hasSpbSimilarPatternContract(spbInput.similarPattern), true, 'SP-B fixture similarPattern must be detected as SP-B contract');
equal(hasSpbSimilarPatternContract(legacyInput.similarPattern), false, 'legacy fixture similarPattern must not be detected as SP-B contract');
equal(hasSpbSimilarPatternContract(partialInput.similarPattern), true, 'partial fixture similarPattern must still carry contractVersion');
equal(legacyInput.similarPattern.contractVersion, undefined, 'legacy fixture similarPattern must not carry contractVersion');
equal('outcomeDistribution' in partialInput.similarPattern, false, 'partial fixture similarPattern must have outcomeDistribution stripped');
equal('patternQuality' in partialInput.similarPattern, false, 'partial fixture similarPattern must have patternQuality stripped');

// --- 3. SP-B fixture path: full report reflects hardened contract fields ---
const spbOutput = runMkAgent(spbInput);
checkBaseContract(spbOutput, 'SP-B fixture output');
const spbHistorySection = spbOutput.report.sections.find((section) => section.key === MK_AGENT_SECTION_KEYS.similarHistory);
const spbHistoryText = spbHistorySection.bullets.join(' ');
check(spbHistoryText.includes('신뢰도'), 'SP-B similar-history bullets must mention 신뢰도');
check(['높음', '보통 이상', '보통', '낮음'].some((label) => spbHistoryText.includes(label)), 'SP-B similar-history bullets must include a known confidence label');
check(spbHistoryText.includes('D5'), 'SP-B similar-history bullets must mention D5');
check(spbHistoryText.includes('D20'), 'SP-B similar-history bullets must mention D20');
check(spbHistoryText.includes('평균'), 'SP-B similar-history bullets must mention 평균');
check(spbHistoryText.includes('중앙값'), 'SP-B similar-history bullets must mention 중앙값');
check(/상승 \d+건/.test(spbHistoryText), 'SP-B similar-history bullets must mention a positive-count figure');
check(/하락 \d+건/.test(spbHistoryText), 'SP-B similar-history bullets must mention a negative-count figure');
check(/보합 \d+건/.test(spbHistoryText), 'SP-B similar-history bullets must mention a flat-count figure');
check(spbHistoryText.includes('과거 유사 흐름'), 'SP-B similar-history bullets must mention 과거 유사 흐름');
check(spbHistoryText.includes('미래 성과를 보장하지 않습니다'), 'SP-B similar-history bullets must include the future-non-guarantee disclaimer');
const spbTopTags = summarizeMatchReasonTagsForMkAgent(spbInput.similarPattern);
check(spbTopTags.length > 0, 'SP-B fixture top match must carry at least one matchReasonTag for this assertion to be meaningful');
check(spbTopTags.some((tag) => spbHistoryText.includes(tag)), 'SP-B similar-history bullets must include at least one match reason tag');
const spbRiskSection = spbOutput.report.sections.find((section) => section.key === MK_AGENT_SECTION_KEYS.riskCheck);
const spbRiskText = spbRiskSection.bullets.join(' ');
check(spbRiskText.includes('패턴 품질'), 'SP-B risk-check bullets must mention 패턴 품질');

// --- 4. Legacy SP-A-shaped fixture path: no crash, output unchanged from pre-SP-B behavior ---
const legacyOutput = runMkAgent(legacyInput);
checkBaseContract(legacyOutput, 'legacy fixture output');
const legacyHistorySection = legacyOutput.report.sections.find((section) => section.key === MK_AGENT_SECTION_KEYS.similarHistory);
equal(legacyHistorySection.bullets.length, 2, 'legacy fixture similar-history bullets must not gain SP-B-only entries');
check(legacyHistorySection.bullets[0].startsWith('Top match score label: '), 'legacy fixture similar-history first bullet must be the pre-SP-B top-match-label bullet');
equal(legacyHistorySection.bullets[1], 'historical similarity does not predict the future.', 'legacy fixture similar-history second bullet must be the pre-SP-B fixed bullet');
const legacyRiskSection = legacyOutput.report.sections.find((section) => section.key === MK_AGENT_SECTION_KEYS.riskCheck);
equal(legacyRiskSection.bullets.length, 2, 'legacy fixture risk-check bullets must not gain SP-B-only entries');

// --- 5. Partial SP-B fixture path: fail-soft, no crash, present fields used, missing fields safely skipped ---
const partialOutput = runMkAgent(partialInput);
checkBaseContract(partialOutput, 'partial SP-B fixture output');
const partialHistorySection = partialOutput.report.sections.find((section) => section.key === MK_AGENT_SECTION_KEYS.similarHistory);
const partialHistoryText = partialHistorySection.bullets.join(' ');
check(partialHistoryText.includes('신뢰도'), 'partial fixture similar-history bullets must still mention 신뢰도 when confidence fields survive');
check(!partialHistoryText.includes('D5 기준'), 'partial fixture similar-history bullets must omit D5 average/median when outcomeDistribution is stripped');
check(!partialHistoryText.includes('D20 기준'), 'partial fixture similar-history bullets must omit D20 average/median when outcomeDistribution is stripped');
check(partialHistoryText.includes('구체적인 매치 근거 태그는 확인되지 않았어요'), 'partial fixture similar-history bullets must use the safe match-reason-tag fallback');
check(partialHistoryText.includes('미래 성과를 보장하지 않습니다'), 'partial fixture similar-history bullets must keep the future-non-guarantee disclaimer');
const partialRiskSection = partialOutput.report.sections.find((section) => section.key === MK_AGENT_SECTION_KEYS.riskCheck);
equal(partialRiskSection.bullets.length, 2, 'partial fixture risk-check bullets must omit patternQuality-derived entries when patternQuality is stripped');

// --- 6. Existing MK Agent output contract preserved (base fixture unaffected by MK-C changes) ---
const baseOutput = runMkAgent(createMkAgentFixtureInput());
checkBaseContract(baseOutput, 'base fixture output');
deepEqual(baseOutput, spbOutput, 'default fixture output must equal the SP-B contract fixture output (both use the SP-B-shaped default similarPattern)');

// --- 7. Korean grammar preserved across all fixture variants (regression guard) ---
for (const [label, output] of [
  ['SP-B', spbOutput],
  ['legacy', legacyOutput],
  ['partial', partialOutput],
]) {
  check(output.report.oneLineSummary.includes('삼성전자는'), `${label} oneLineSummary must contain 삼성전자는`);
}

// --- 8. Mojibake absence across all fixture variants (already covered by checkBaseContract, re-asserted directly) ---
checkSafeOutput(spbOutput, 'SP-B fixture output (direct)');
checkSafeOutput(legacyOutput, 'legacy fixture output (direct)');
checkSafeOutput(partialOutput, 'partial fixture output (direct)');

// --- 9. Forbidden investment language absence across all fixture variants (direct detector calls) ---
deepEqual(detectForbiddenInvestmentLanguage(JSON.stringify(spbOutput)), [], 'SP-B fixture output must trigger zero forbidden-language findings');
deepEqual(detectForbiddenInvestmentLanguage(JSON.stringify(legacyOutput)), [], 'legacy fixture output must trigger zero forbidden-language findings');
deepEqual(detectForbiddenInvestmentLanguage(JSON.stringify(partialOutput)), [], 'partial fixture output must trigger zero forbidden-language findings');

// --- 10. Determinism: identical input must produce deep-equal output ---
const spbRepeat = runMkAgent(createMkAgentSpbContractFixtureInput());
deepEqual(spbRepeat, spbOutput, 'SP-B fixture: same input should produce deterministic deep-equal output');
const legacyRepeat = runMkAgent(createMkAgentLegacySimilarPatternFixtureInput());
deepEqual(legacyRepeat, legacyOutput, 'legacy fixture: same input should produce deterministic deep-equal output');
const partialRepeat = runMkAgent(createMkAgentPartialSpbContractFixtureInput());
deepEqual(partialRepeat, partialOutput, 'partial fixture: same input should produce deterministic deep-equal output');

// --- 11. Blocked-path fixtures remain unaffected by SP-B consumption changes ---
const usageExceeded = runMkAgent({ ...createMkAgentFixtureInput(), usageContext: { openBetaDailyFreeUses: 3, usedToday: 3, remainingToday: 0, persistence: 'none' } });
equal(usageExceeded.ok, false, 'usage-exceeded input must remain blocked');
equal(usageExceeded.status, 'blocked_usage_exceeded', 'usage-exceeded input must keep its status');
const missingSimilar = runMkAgent({ ...createMkAgentFixtureInput(), similarPattern: null });
equal(missingSimilar.ok, false, 'missing similarPattern input must remain blocked');
equal(missingSimilar.status, 'blocked_similar_pattern_unavailable', 'missing similarPattern input must keep its status');

console.log(`Phase 3FF-A-MK-C smoke: PASS (${assertions}/${assertions} assertions passed)`);
