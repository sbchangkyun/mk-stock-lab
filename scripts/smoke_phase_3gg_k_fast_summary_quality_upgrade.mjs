// Phase 3GG-K-FAST deterministic smoke script.
// Verifies the upgraded Korean summary-quality prompt contract and the new numeric-output
// rejection guard, using injected fake env and a fake fetch transport. Never calls real OpenAI,
// never calls real KIS, never reads a real .env, and never starts a dev server -- fully
// deterministic and safe to run in CI or by any contributor with no local credentials.
//
// This script also self-audits its own console output at the end (Case 20) to guarantee it never
// prints the fake API key, the fake numeric currentPrice/volume values, prompt text, or a raw
// OpenAI response body -- consistent with the "never print sensitive data" rule this phase must
// preserve.

import {
  buildLlmSafeCurrentPricePrompt,
  sanitizeLlmSummaryText,
  runLocalOnlyLlmRuntimeBridge,
  SANITIZED_LLM_ERROR_CODES,
} from '../src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs';

let passed = 0;
let failed = 0;

const consoleBuffer = [];
const originalLog = console.log.bind(console);
const originalError = console.error.bind(console);
console.log = (...args) => {
  consoleBuffer.push(args.map(String).join(' '));
  originalLog(...args);
};
console.error = (...args) => {
  consoleBuffer.push(args.map(String).join(' '));
  originalError(...args);
};

function check(label, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS: ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL: ${label}`);
  }
}

const FAKE_API_KEY = 'sk-fake-k-secret-token';
const CURRENT_PRICE_VALUE = 71000;
const VOLUME_VALUE = 12345;

const VALID_CONTEXT = {
  symbol: '005930',
  market: 'KR',
  currentPrice: CURRENT_PRICE_VALUE,
  volume: VOLUME_VALUE,
  timestamp: '2026-07-11T00:00:00Z',
  sourceStatus: 'ok',
  cacheStatus: 'fresh',
  providerLabel: 'kis',
  integrationMode: 'local-only',
};

const COMPLIANT_SUMMARY =
  '데이터 상태: 현재가와 거래량 데이터가 확인되었습니다.\n해석 범위: 이 정보만으로는 투자 판단을 내리기 어렵습니다.\n유의사항: 이 요약은 투자 자문이 아닙니다.';

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  };
}

function makeFakeFetch(responses) {
  const calls = [];
  const queue = [...responses];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    const next = queue.shift();
    if (!next) throw new Error('fake fetch: no more queued responses');
    return next;
  };
  return { fetchImpl, calls };
}

// --- Case 1: prompt includes Korean summary-quality instructions ---
{
  const { systemPrompt } = buildLlmSafeCurrentPricePrompt(VALID_CONTEXT);
  check(
    'Case 1: prompt includes Korean summary-quality instructions (3-bullet structure)',
    systemPrompt.includes('정확히 3개의 짧은 불릿') && systemPrompt.includes('데이터 상태:') && systemPrompt.includes('해석 범위:') && systemPrompt.includes('유의사항:'),
  );
}

// --- Case 2: prompt includes "not investment advice" requirement ---
{
  const { systemPrompt } = buildLlmSafeCurrentPricePrompt(VALID_CONTEXT);
  check('Case 2: prompt includes "not investment advice" requirement', systemPrompt.includes('투자 자문이 아니라는 점'));
}

// --- Case 3: prompt forbids buy/sell recommendation ---
{
  const { systemPrompt } = buildLlmSafeCurrentPricePrompt(VALID_CONTEXT);
  check('Case 3: prompt forbids buy/sell recommendation', systemPrompt.includes('매수·매도 추천을 포함하지 않습니다'));
}

// --- Case 4: prompt forbids target price ---
{
  const { systemPrompt } = buildLlmSafeCurrentPricePrompt(VALID_CONTEXT);
  check('Case 4: prompt forbids target price', systemPrompt.includes('목표가를 포함하지 않습니다'));
}

// --- Case 5: prompt forbids stop-loss price ---
{
  const { systemPrompt } = buildLlmSafeCurrentPricePrompt(VALID_CONTEXT);
  check('Case 5: prompt forbids stop-loss price', systemPrompt.includes('손절가를 포함하지 않습니다'));
}

// --- Case 6: prompt forbids exact numeric price/volume output ---
{
  const { systemPrompt } = buildLlmSafeCurrentPricePrompt(VALID_CONTEXT);
  check(
    'Case 6: prompt forbids exact numeric price/volume output',
    systemPrompt.includes('정확한 숫자를 절대 출력하지 않습니다'),
  );
}

// --- Case 7: prompt does not ask the model to repeat the exact currentPrice numeric value ---
{
  const { systemPrompt, userPrompt } = buildLlmSafeCurrentPricePrompt(VALID_CONTEXT);
  const combined = `${systemPrompt}\n${userPrompt}`;
  check(
    'Case 7: prompt never contains the exact currentPrice or volume numeric value',
    !combined.includes(String(CURRENT_PRICE_VALUE)) && !combined.includes(String(VOLUME_VALUE)),
  );
}

// --- Case 8: valid Korean 3-bullet summary returns ok ---
{
  const { fetchImpl } = makeFakeFetch([jsonResponse(200, { output_text: COMPLIANT_SUMMARY })]);
  const result = await runLocalOnlyLlmRuntimeBridge(
    { context: VALID_CONTEXT, env: { CHART_AI_ENABLE_LOCAL_LLM: 'true', OPENAI_API_KEY: FAKE_API_KEY, CHART_AI_LLM_MODEL: 'gpt-5.5' } },
    { fetchImpl, timeoutMs: 2000 },
  );
  check('Case 8: valid Korean 3-bullet summary -> ok=true', result.ok === true);
  check('Case 8b: valid Korean 3-bullet summary text preserved', result.summaryText === COMPLIANT_SUMMARY);
}

// --- Case 9: summary with forbidden buy phrase fails closed ---
{
  const { fetchImpl } = makeFakeFetch([jsonResponse(200, { output_text: '매수하세요 지금 사세요' })]);
  const result = await runLocalOnlyLlmRuntimeBridge(
    { context: VALID_CONTEXT, env: { CHART_AI_ENABLE_LOCAL_LLM: 'true', OPENAI_API_KEY: FAKE_API_KEY, CHART_AI_LLM_MODEL: 'gpt-5.5' } },
    { fetchImpl, timeoutMs: 2000 },
  );
  check('Case 9: forbidden buy phrase -> fails closed', result.ok === false && result.sanitizedErrorCode === SANITIZED_LLM_ERROR_CODES.FORBIDDEN_LANGUAGE_DETECTED);
}

// --- Case 10: summary with target-price phrase fails closed ---
{
  const { fetchImpl } = makeFakeFetch([jsonResponse(200, { output_text: '목표가는 여기입니다' })]);
  const result = await runLocalOnlyLlmRuntimeBridge(
    { context: VALID_CONTEXT, env: { CHART_AI_ENABLE_LOCAL_LLM: 'true', OPENAI_API_KEY: FAKE_API_KEY, CHART_AI_LLM_MODEL: 'gpt-5.5' } },
    { fetchImpl, timeoutMs: 2000 },
  );
  check('Case 10: target-price phrase -> fails closed', result.ok === false && result.sanitizedErrorCode === SANITIZED_LLM_ERROR_CODES.FORBIDDEN_LANGUAGE_DETECTED);
}

// --- Case 11: summary with stop-loss phrase fails closed ---
{
  const { fetchImpl } = makeFakeFetch([jsonResponse(200, { output_text: '손절가를 설정하세요' })]);
  const result = await runLocalOnlyLlmRuntimeBridge(
    { context: VALID_CONTEXT, env: { CHART_AI_ENABLE_LOCAL_LLM: 'true', OPENAI_API_KEY: FAKE_API_KEY, CHART_AI_LLM_MODEL: 'gpt-5.5' } },
    { fetchImpl, timeoutMs: 2000 },
  );
  check('Case 11: stop-loss phrase -> fails closed', result.ok === false && result.sanitizedErrorCode === SANITIZED_LLM_ERROR_CODES.FORBIDDEN_LANGUAGE_DETECTED);
}

// --- Case 12: summary containing ASCII digits fails closed with safe warning ---
let numericRejectionResult;
{
  const { fetchImpl } = makeFakeFetch([jsonResponse(200, { output_text: `현재 지수는 ${CURRENT_PRICE_VALUE} 부근입니다` })]);
  numericRejectionResult = await runLocalOnlyLlmRuntimeBridge(
    { context: VALID_CONTEXT, env: { CHART_AI_ENABLE_LOCAL_LLM: 'true', OPENAI_API_KEY: FAKE_API_KEY, CHART_AI_LLM_MODEL: 'gpt-5.5' } },
    { fetchImpl, timeoutMs: 2000 },
  );
  check(
    'Case 12: ASCII-digit summary -> fails closed with FORBIDDEN_NUMERIC_OUTPUT_DETECTED and safe warning',
    numericRejectionResult.ok === false &&
      numericRejectionResult.sanitizedErrorCode === SANITIZED_LLM_ERROR_CODES.FORBIDDEN_NUMERIC_OUTPUT_DETECTED &&
      numericRejectionResult.warnings.includes('forbidden-numeric-output-detected'),
  );
}

// --- Case 13: numeric rejection does not expose the detected number ---
{
  const serialized = JSON.stringify(numericRejectionResult);
  check(
    'Case 13: numeric rejection response never contains the rejected numeric value',
    numericRejectionResult.summaryText === null && !serialized.includes(String(CURRENT_PRICE_VALUE)),
  );
}

// --- Case 14: empty output still fails closed ---
{
  const { fetchImpl } = makeFakeFetch([jsonResponse(200, { output_text: '' })]);
  const result = await runLocalOnlyLlmRuntimeBridge(
    { context: VALID_CONTEXT, env: { CHART_AI_ENABLE_LOCAL_LLM: 'true', OPENAI_API_KEY: FAKE_API_KEY, CHART_AI_LLM_MODEL: 'gpt-5.5' } },
    { fetchImpl, timeoutMs: 2000 },
  );
  check('Case 14: empty output -> fails closed with EMPTY_LLM_OUTPUT', result.ok === false && result.sanitizedErrorCode === SANITIZED_LLM_ERROR_CODES.EMPTY_LLM_OUTPUT);
}

// --- Case 15: fallback success still returns ok with llm-fallback-used ---
{
  const { fetchImpl, calls } = makeFakeFetch([
    jsonResponse(404, { error: { type: 'invalid_request_error', code: 'model_not_found' } }),
    jsonResponse(200, { output_text: COMPLIANT_SUMMARY }),
  ]);
  const result = await runLocalOnlyLlmRuntimeBridge(
    {
      context: VALID_CONTEXT,
      env: { CHART_AI_ENABLE_LOCAL_LLM: 'true', OPENAI_API_KEY: FAKE_API_KEY, CHART_AI_LLM_MODEL: 'gpt-5.5', CHART_AI_LLM_FALLBACK_MODEL: 'gpt-5.5-fallback' },
    },
    { fetchImpl, timeoutMs: 2000 },
  );
  check('Case 15: fallback success -> ok=true', result.ok === true);
  check('Case 15b: fallback success -> llm-fallback-used warning present', result.warnings.includes('llm-fallback-used'));
  check('Case 15c: fallback success -> exactly two fetch calls', calls.length === 2);
}

// --- Case 16: fallback failure still fails closed without raw response ---
{
  const { fetchImpl } = makeFakeFetch([
    jsonResponse(404, { error: { type: 'invalid_request_error', code: 'model_not_found' } }),
    jsonResponse(500, { error: { type: 'server_error', code: 'internal_error' } }),
  ]);
  const result = await runLocalOnlyLlmRuntimeBridge(
    {
      context: VALID_CONTEXT,
      env: { CHART_AI_ENABLE_LOCAL_LLM: 'true', OPENAI_API_KEY: FAKE_API_KEY, CHART_AI_LLM_MODEL: 'gpt-5.5', CHART_AI_LLM_FALLBACK_MODEL: 'gpt-5.5-fallback' },
    },
    { fetchImpl, timeoutMs: 2000 },
  );
  // Note: diagnostics.openAiErrorCode is an intentionally allowlisted, classified field
  // (Phase 3GG-H-HF1) -- distinct from the raw response body/object, which must never appear.
  const serialized = JSON.stringify(result);
  check(
    'Case 16: fallback failure -> fails closed without a raw nested response body',
    result.ok === false &&
      result.sanitizedErrorCode === SANITIZED_LLM_ERROR_CODES.LLM_CALL_FAILED &&
      result.warnings.includes('llm-fallback-failed') &&
      !('error' in result) &&
      !serialized.includes('"error":{'),
  );
}

// --- Case 17: legacy CHART_AI_LLM_MODEL still works ---
{
  const { fetchImpl } = makeFakeFetch([jsonResponse(200, { output_text: COMPLIANT_SUMMARY })]);
  const result = await runLocalOnlyLlmRuntimeBridge(
    { context: VALID_CONTEXT, env: { CHART_AI_ENABLE_LOCAL_LLM: 'true', OPENAI_API_KEY: FAKE_API_KEY, CHART_AI_LLM_MODEL: 'gpt-legacy-model' } },
    { fetchImpl, timeoutMs: 2000 },
  );
  check('Case 17: legacy CHART_AI_LLM_MODEL still resolves and returns ok=true', result.ok === true);
}

// --- Case 18: CHART_AI_LLM_MAIN_MODEL override still works ---
{
  const { fetchImpl } = makeFakeFetch([jsonResponse(200, { output_text: COMPLIANT_SUMMARY })]);
  const result = await runLocalOnlyLlmRuntimeBridge(
    {
      context: VALID_CONTEXT,
      env: { CHART_AI_ENABLE_LOCAL_LLM: 'true', OPENAI_API_KEY: FAKE_API_KEY, CHART_AI_LLM_MAIN_MODEL: 'gpt-6-main', CHART_AI_LLM_MODEL: 'gpt-legacy-model' },
    },
    { fetchImpl, timeoutMs: 2000 },
  );
  check('Case 18: CHART_AI_LLM_MAIN_MODEL override still resolves and returns ok=true', result.ok === true);
}

// --- Case 19: no model name appears in returned summary/response ---
{
  const { fetchImpl } = makeFakeFetch([jsonResponse(200, { output_text: COMPLIANT_SUMMARY })]);
  const result = await runLocalOnlyLlmRuntimeBridge(
    {
      context: VALID_CONTEXT,
      env: { CHART_AI_ENABLE_LOCAL_LLM: 'true', OPENAI_API_KEY: FAKE_API_KEY, CHART_AI_LLM_MAIN_MODEL: 'gpt-6-unique-model-token' },
    },
    { fetchImpl, timeoutMs: 2000 },
  );
  const serialized = JSON.stringify(result);
  check('Case 19: no model name appears anywhere in the returned response', !serialized.includes('gpt-6-unique-model-token'));
}

// --- Case 20: smoke never prints prompt/currentPrice/raw KIS/API key/raw OpenAI response ---
{
  const combinedOutput = consoleBuffer.join('\n');
  check(
    'Case 20: smoke console output never leaks the fake API key, numeric price/volume, or raw OpenAI response body',
    !combinedOutput.includes(FAKE_API_KEY) &&
      !combinedOutput.includes(String(CURRENT_PRICE_VALUE)) &&
      !combinedOutput.includes(String(VOLUME_VALUE)) &&
      !combinedOutput.includes('internal_error') &&
      !combinedOutput.includes('output_text'),
  );
}

console.log = originalLog;
console.error = originalError;

console.log(`\nPhase 3GG-K-FAST smoke: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
}
