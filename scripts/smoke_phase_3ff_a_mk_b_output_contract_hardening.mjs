import assert from 'node:assert/strict';
import {
  MK_AGENT_SECTION_KEYS,
  hasKoreanFinalConsonant,
  chooseKoreanTopicParticle,
  withKoreanTopicParticle,
  runMkAgent,
} from '../src/lib/server/chart-ai/mk-agent.mjs';
import {
  createMkAgentFixtureInput,
  createMkAgentKoreanParticleFixtureInput,
  createMkAgentNonHangulDisplayNameFixtureInput,
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
const output = runMkAgent(createMkAgentFixtureInput());

equal(output.ok, true, 'default output should be ok');
equal(output.status, 'mk_report_ready', 'default output should be ready');
equal(output.agentName, 'MK 에이전트', 'agent name should be exact');

const serialized = JSON.stringify(output);
check(serialized.includes('삼성전자는'), 'serialized output must contain the grammatically correct 삼성전자는');
check(!serialized.includes('삼성전자은'), 'serialized output must not contain the known buggy 삼성전자은');

check(output.report.sections.some((section) => section.title === '전략 체크포인트'), 'strategy title should be exact');
check(!output.report.sections.some((section) => section.title === '사전 체크포인트'), 'legacy strategy title should not exist');

check(output.report.usageNotice.includes('오픈베타'), 'usage notice should mention open beta');
check(output.report.usageNotice.includes('하루 3회'), 'usage notice should mention daily 3-use limit');
check(output.report.disclaimer.includes('참고용'), 'disclaimer should include reference-only language');
check(output.report.disclaimer.includes('매수·매도 추천이 아닙니다'), 'disclaimer should reject buy-sell recommendation');
check(output.report.disclaimer.includes('투자 자문이 아닙니다'), 'disclaimer should reject investment advice');

for (const key of requiredKeys) {
  check(output.report.sections.some((section) => section.key === key), `section key should exist: ${key}`);
}

equal(output.safety.containsBuySellRecommendation, false, 'no buy-sell recommendation');
equal(output.safety.containsTargetPrice, false, 'no target price');
equal(output.safety.containsStopLossInstruction, false, 'no stop-loss instruction');
equal(output.safety.rawPayloadExposed, false, 'no raw payload');
equal(output.safety.secretExposed, false, 'no secret');
equal(output.safety.llmCalled, false, 'no LLM called');

equal(hasKoreanFinalConsonant('삼성전자'), false, '삼성전자 should have no final consonant');
equal(chooseKoreanTopicParticle('삼성전자'), '는', '삼성전자 should take 는');
equal(withKoreanTopicParticle('삼성전자'), '삼성전자는', '삼성전자 + particle should be 삼성전자는');
equal(withKoreanTopicParticle('카카오'), '카카오는', '카카오 + particle should be 카카오는');
equal(hasKoreanFinalConsonant('한국'), true, '한국 should have a final consonant');
equal(chooseKoreanTopicParticle('한국'), '은', '한국 should take 은 (final-consonant example)');
equal(withKoreanTopicParticle('한국'), '한국은', '한국 + particle should be 한국은');
check(
  typeof withKoreanTopicParticle('원익IPS') === 'string' && withKoreanTopicParticle('원익IPS').length > 0,
  'non-Hangul input should produce a safe fallback string without crashing',
);

const repeat = runMkAgent(createMkAgentFixtureInput());
deepEqual(repeat, output, 'same input should produce deterministic deep-equal output');

const kakaoOutput = runMkAgent(createMkAgentKoreanParticleFixtureInput('카카오'));
equal(kakaoOutput.ok, true, '카카오 fixture output should be ok');
check(JSON.stringify(kakaoOutput).includes('카카오는'), '카카오 fixture output should contain 카카오는');

const hanGukOutput = runMkAgent(createMkAgentKoreanParticleFixtureInput('한국'));
equal(hanGukOutput.ok, true, '한국 fixture output should be ok');
check(JSON.stringify(hanGukOutput).includes('한국은'), '한국 fixture output should contain 한국은');

const nonHangulOutput = runMkAgent(createMkAgentNonHangulDisplayNameFixtureInput());
equal(nonHangulOutput.ok, true, 'non-Hangul displayName fixture output should be ok (safe fallback, no crash)');
check(JSON.stringify(nonHangulOutput).includes('원익IPS는'), 'non-Hangul displayName fixture output should contain the safe fallback phrase');

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
for (const token of mojibakePatterns) {
  check(!serialized.includes(token), 'successful output must not contain mojibake pattern');
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
  check(!serialized.includes(token), `successful output must not contain forbidden investment language: ${token}`);
}

check(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(serialized), 'successful output must not contain raw email-like values');
check(!/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(serialized), 'successful output must not contain JWT-like values');
check(!/appsecret|access_token|service_role|OPENAI_API_KEY|KIS_APP_SECRET/i.test(serialized), 'successful output must not contain secret-like tokens');

console.log(`Phase 3FF-A-MK-B smoke: PASS (${assertions}/${assertions} assertions passed)`);
