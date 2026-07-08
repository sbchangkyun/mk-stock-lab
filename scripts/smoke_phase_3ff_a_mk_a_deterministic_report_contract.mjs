import assert from 'node:assert/strict';
import {
  MK_AGENT_SECTION_KEYS,
  detectForbiddenInvestmentLanguage,
  runMkAgent,
  sanitizeMkAgentReport,
} from '../src/lib/server/chart-ai/mk-agent.mjs';
import {
  createMkAgentDataInsufficientFixtureInput,
  createMkAgentFixtureInput,
  createMkAgentMissingSimilarPatternFixtureInput,
  createMkAgentUsageExceededFixtureInput,
  createUnsafeMkAgentDraftForSanitizerFixture,
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
equal(output.agentName, 'MK ?먯씠?꾪듃', 'agent name should be exact');
check(['pc_card', 'mobile_bottom_sheet'].includes(output.uiMode), 'uiMode should be supported');
check(typeof output.report.oneLineSummary === 'string' && output.report.oneLineSummary.length > 0, 'one line summary should be non-empty');
check(/[가-힣?]/.test(output.report.oneLineSummary), 'one line summary should be Korean-compatible text');
check(Array.isArray(output.report.sections), 'sections should be an array');

for (const key of requiredKeys) {
  check(output.report.sections.some((section) => section.key === key), `section key should exist: ${key}`);
}

check(output.report.sections.some((section) => section.title === '?꾨왂 泥댄겕?ъ씤??'), 'strategy title should be exact');
check(!output.report.sections.some((section) => section.title === '?ъ쟾 泥댄겕?ъ씤??'), 'legacy strategy title should not exist');
check(output.report.disclaimer.includes('참고용'), 'disclaimer should include reference-only language');
check(output.report.disclaimer.includes('매수·매도 추천이 아니고'), 'disclaimer should reject buy-sell recommendation');
check(output.report.disclaimer.includes('투자 자문도 아닙니다'), 'disclaimer should reject investment advice');
check(output.report.usageNotice.includes('3'), 'usage notice should include 3 daily uses');

equal(output.safety.containsBuySellRecommendation, false, 'no buy-sell recommendation');
equal(output.safety.containsTargetPrice, false, 'no target price');
equal(output.safety.containsStopLossInstruction, false, 'no stop-loss instruction');
equal(output.safety.rawPayloadExposed, false, 'no raw payload');
equal(output.safety.secretExposed, false, 'no secret');
equal(output.safety.llmCalled, false, 'no LLM called');

const repeat = runMkAgent(createMkAgentFixtureInput());
deepEqual(repeat, output, 'same input should produce deterministic deep-equal output');

const mobile = runMkAgent(createMkAgentFixtureInput({ uiMode: 'mobile_bottom_sheet' }));
equal(mobile.ok, true, 'mobile bottom-sheet output should be ok');
equal(mobile.uiMode, 'mobile_bottom_sheet', 'mobile bottom-sheet mode should be preserved');

const usageExceeded = runMkAgent(createMkAgentUsageExceededFixtureInput());
equal(usageExceeded.ok, false, 'usage exceeded should be blocked');
equal(usageExceeded.status, 'blocked_usage_exceeded', 'usage exceeded status should be exact');

const missingSimilar = runMkAgent(createMkAgentMissingSimilarPatternFixtureInput());
equal(missingSimilar.ok, false, 'missing similar pattern should be blocked');
equal(missingSimilar.status, 'blocked_similar_pattern_unavailable', 'missing similar pattern status should be exact');

const insufficient = runMkAgent(createMkAgentDataInsufficientFixtureInput());
equal(insufficient.ok, false, 'data insufficient should be blocked');
equal(insufficient.status, 'blocked_data_insufficient', 'data insufficient status should be exact');

const unsafeDraft = createUnsafeMkAgentDraftForSanitizerFixture();
const unsafeFindings = detectForbiddenInvestmentLanguage(unsafeDraft);
check(unsafeFindings.length >= 4, 'unsafe sanitizer fixture should detect forbidden language');
const sanitizerResult = sanitizeMkAgentReport(unsafeDraft);
equal(sanitizerResult.ok, false, 'unsafe sanitizer fixture should fail sanitizer');
equal(sanitizerResult.status, 'blocked_sanitizer_failure', 'unsafe sanitizer status should be exact');

const serialized = JSON.stringify(output);
const forbiddenSuccessfulOutput = [
  '?ъ쟾 泥댄겕?ъ씤??',
  '留ㅼ닔?섏꽭??',
  '留ㅻ룄?섏꽭??',
  '吏湲? 吏꾩엯',
  '紐⑺몴媛??',
  '?먯젅媛??',
  '媛뺣젰 異붿쿇',
  '?곸듅???뺤젙',
  '?섎씫???뺤젙',
  'appsecret',
  'access_token',
  'service_role',
  'OPENAI_API_KEY',
  'KIS_APP_SECRET',
];

for (const token of forbiddenSuccessfulOutput) {
  check(!serialized.includes(token), `successful output must not contain ${token}`);
}

check(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(serialized), 'successful output must not contain raw email-like values');
check(!/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(serialized), 'successful output must not contain JWT-like values');

for (const section of output.report.sections) {
  check(typeof section.key === 'string' && requiredKeys.includes(section.key), 'section key should be valid');
  check(typeof section.title === 'string' && section.title.length > 0, 'section title should be non-empty');
  check(typeof section.body === 'string' && section.body.length > 0, 'section body should be non-empty');
  check(Array.isArray(section.bullets), 'section bullets should be an array');
  check(typeof section.severity === 'string' && section.severity.length > 0, 'section severity should be non-empty');
  check(typeof section.confidence === 'string' && section.confidence.length > 0, 'section confidence should be non-empty');
  check(Array.isArray(section.limitations), 'section limitations should be an array');
}

console.log(`Phase 3FF-A-MK-A smoke: PASS (${assertions}/${assertions} assertions passed)`);
