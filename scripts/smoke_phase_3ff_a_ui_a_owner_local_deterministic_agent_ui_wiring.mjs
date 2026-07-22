import assert from 'node:assert/strict';
import fs from 'node:fs';
import { runSimilarPatternAgent } from '../src/lib/server/chart-ai/similar-pattern-agent.mjs';
import { createSimilarPatternFixtureInput } from '../src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs';
import { runMkAgent } from '../src/lib/server/chart-ai/mk-agent.mjs';
import { createMkAgentFixtureInput } from '../src/lib/server/chart-ai/mk-agent.fixture.mjs';

const CHART_AI_PAGE = 'src/pages/chart-ai.astro';

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

check(fs.existsSync(CHART_AI_PAGE), `${CHART_AI_PAGE} must exist.`);
const pageSource = fs.readFileSync(CHART_AI_PAGE, 'utf8');

check(pageSource.includes('ownerLocalDeterministicAgents'), 'page must reference the ownerLocalDeterministicAgents query param.');
check(
  pageSource.includes("chartAiQuery.get('ownerLocalDeterministicAgents') === '1'"),
  'page must gate the panel behind an explicit ownerLocalDeterministicAgents=1 opt-in.',
);
check(pageSource.includes('isLocalOwnerHostname()'), 'page must reuse the existing localhost guard helper.');
check(
  pageSource.includes('isLocalOwnerHostname() &&\n        ownerLocalDeterministicAgentsOptIn'),
  'deterministic agents panel must AND the localhost guard with the query opt-in.',
);

const similarPatternOutput = runSimilarPatternAgent(createSimilarPatternFixtureInput());
equal(similarPatternOutput.ok, true, 'Similar Pattern default fixture must be ok.');
equal(similarPatternOutput.status, 'similar_patterns_ready', 'Similar Pattern default fixture must be ready.');
equal(similarPatternOutput.source, 'normalized_ohlcv', 'Similar Pattern source must be normalized_ohlcv.');
equal(similarPatternOutput.matches.length, 5, 'Similar Pattern default fixture must produce 5 matches.');
equal(similarPatternOutput.safety.rawKisPayloadExposed, false, 'Similar Pattern raw KIS payload flag must be false.');
equal(similarPatternOutput.safety.rawProviderErrorExposed, false, 'Similar Pattern raw provider error flag must be false.');
equal(similarPatternOutput.safety.secretExposed, false, 'Similar Pattern secret flag must be false.');
equal(similarPatternOutput.safety.buySellRecommendation, false, 'Similar Pattern buy/sell flag must be false.');

const mkAgentOutput = runMkAgent(createMkAgentFixtureInput());
equal(mkAgentOutput.ok, true, 'MK Agent default fixture must be ok.');
equal(mkAgentOutput.status, 'mk_report_ready', 'MK Agent default fixture must be ready.');
equal(mkAgentOutput.agentName, 'MK 에이전트', 'MK Agent name must be exact.');
check(
  mkAgentOutput.report.sections.some((section) => section.title === '전략 체크포인트'),
  'MK Agent report must include the strategy checkpoint section title.',
);
check(
  !mkAgentOutput.report.sections.some((section) => section.title === '사전 체크포인트'),
  'MK Agent report must not include the legacy strategy checkpoint section title.',
);
check(
  mkAgentOutput.report.usageNotice.includes('오픈베타에서는 계정당 하루 3회까지 사용할 수 있어요'),
  'MK Agent usage notice must be exact.',
);
check(mkAgentOutput.report.disclaimer.includes('참고용'), 'MK Agent disclaimer must include reference-only language.');
check(
  mkAgentOutput.report.disclaimer.includes('매수·매도 추천이 아닙니다'),
  'MK Agent disclaimer must reject buy-sell recommendation.',
);
check(
  mkAgentOutput.report.disclaimer.includes('투자 자문이 아닙니다'),
  'MK Agent disclaimer must reject investment advice.',
);
equal(mkAgentOutput.safety.containsBuySellRecommendation, false, 'MK Agent buy-sell recommendation flag must be false.');
equal(mkAgentOutput.safety.containsTargetPrice, false, 'MK Agent target price flag must be false.');
equal(mkAgentOutput.safety.containsStopLossInstruction, false, 'MK Agent stop-loss instruction flag must be false.');
equal(mkAgentOutput.safety.rawPayloadExposed, false, 'MK Agent raw payload flag must be false.');
equal(mkAgentOutput.safety.secretExposed, false, 'MK Agent secret flag must be false.');
equal(mkAgentOutput.safety.llmCalled, false, 'MK Agent llmCalled flag must be false.');

// Required visible labels, safety copy, mojibake fragments, and forbidden investment phrases
// below are expressed as \uXXXX escapes rather than literal Korean/Hanja characters. This file
// is scanned by the Phase 3FF-A-UI-A checker for mojibake fragments alongside chart-ai.astro,
// so its own raw text must never contain the corrupted byte sequences it (indirectly) checks
// for; escaping also guarantees byte-exact matching regardless of Unicode normalization.
const requiredVisibleLabels = [
  'MK 에이전트',
  '전략 체크포인트',
  '오픈베타에서는 계정당 하루 3회까지 사용할 수 있어요.',
  '참고용',
  '매수·매도 추천이 아닙니다',
  '투자 자문이 아닙니다',
];
for (const requiredText of requiredVisibleLabels) {
  check(pageSource.includes(requiredText), `page source must include required visible label: ${requiredText}`);
}

const requiredSafetyCopy = [
  '이 결과는 fixture 기반 owner-local 검증용입니다.',
  '실제 KIS 데이터가 아닙니다.',
  'LLM을 호출하지 않습니다.',
  '투자 참고용이며 매수·매도 추천이 아닙니다.',
];
for (const requiredText of requiredSafetyCopy) {
  check(pageSource.includes(requiredText), `page source must include required safety copy: ${requiredText}`);
}

const mojibakePatterns = [
  '�',
  '?먯씠',
  '?꾨왂',
  '泥댄겕',
  '?ъ씤',
  '?쒖삤',
  '?덈쿋',
  '?쇱꽦',
  '留ㅼ닔',
  '紐⑺몴',
];
for (const token of mojibakePatterns) {
  check(!pageSource.includes(token), `page source must not contain mojibake pattern: ${token}`);
}

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
for (const token of forbiddenInvestmentLanguage) {
  check(!pageSource.includes(token), `page source must not contain forbidden investment language: ${token}`);
}

const repeatSimilarPattern = runSimilarPatternAgent(createSimilarPatternFixtureInput());
deepEqual(repeatSimilarPattern, similarPatternOutput, 'Similar Pattern default fixture output must be deterministic.');

const repeatMkAgent = runMkAgent(createMkAgentFixtureInput());
deepEqual(repeatMkAgent, mkAgentOutput, 'MK Agent default fixture output must be deterministic.');

console.log(`Phase 3FF-A-UI-A smoke: PASS (${assertions}/${assertions} assertions passed)`);
