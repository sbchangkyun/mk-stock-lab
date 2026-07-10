// Phase 3GG-J-FAST deterministic smoke script.
// Verifies the local-only LLM model tier and fallback policy end-to-end using injected fake
// env and a fake fetch transport. Never calls real OpenAI, never calls real KIS, never reads a
// real .env, and never starts a dev server -- fully deterministic and safe to run in CI or by
// any contributor with no local credentials.

import {
  LOCAL_ONLY_LLM_MODEL_POLICY_CONTRACT_VERSION,
  LLM_MODEL_ROLES,
  buildLocalOnlyLlmModelPolicy,
  resolveLlmModelForRole,
  normalizeModelName,
  shouldAttemptFallbackForLlmFailure,
  FALLBACK_ELIGIBLE_ERROR_CLASSES,
} from '../src/lib/server/chart-ai/local-only-llm-model-policy.mjs';
import { runLocalOnlyLlmRuntimeBridge } from '../src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs';

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS: ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL: ${label}`);
  }
}

const VALID_CONTEXT = {
  symbol: '005930',
  market: 'KR',
  currentPrice: 71000,
  volume: 12345,
  timestamp: '2026-07-11T00:00:00Z',
  sourceStatus: 'ok',
  cacheStatus: 'fresh',
  providerLabel: 'kis',
  integrationMode: 'local-only',
};

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

// --- Case 1: contract version present ---
check('Case 1: model policy module exports contract version', typeof LOCAL_ONLY_LLM_MODEL_POLICY_CONTRACT_VERSION === 'string');

// --- Case 2: backward compatibility -- legacy CHART_AI_LLM_MODEL resolves main_summary ---
{
  const policy = buildLocalOnlyLlmModelPolicy({ CHART_AI_LLM_MODEL: 'gpt-5.5' });
  check(
    'Case 2: legacy CHART_AI_LLM_MODEL resolves main_summary role',
    resolveLlmModelForRole(policy, LLM_MODEL_ROLES.MAIN_SUMMARY) === 'gpt-5.5',
  );
}

// --- Case 3: CHART_AI_LLM_MAIN_MODEL takes precedence over legacy key ---
{
  const policy = buildLocalOnlyLlmModelPolicy({ CHART_AI_LLM_MAIN_MODEL: 'gpt-6-main', CHART_AI_LLM_MODEL: 'gpt-5.5' });
  check(
    'Case 3: CHART_AI_LLM_MAIN_MODEL takes precedence over legacy CHART_AI_LLM_MODEL',
    resolveLlmModelForRole(policy, LLM_MODEL_ROLES.MAIN_SUMMARY) === 'gpt-6-main',
  );
}

// --- Case 4: normalizeModelName rejects invalid/credential-like tokens ---
{
  const rejections = [
    normalizeModelName(''),
    normalizeModelName('   '),
    normalizeModelName('gpt 5.5'),
    normalizeModelName('gpt"5.5'),
    normalizeModelName('gpt/5.5'),
    normalizeModelName('gpt`5.5'),
    normalizeModelName('sk-api_key-123'),
    normalizeModelName('OPENAI_API_KEY'),
    normalizeModelName(undefined),
    normalizeModelName(123),
  ];
  check('Case 4: normalizeModelName rejects all invalid/credential-like tokens', rejections.every((v) => v === null));
  check('Case 4b: normalizeModelName accepts a well-formed model name', normalizeModelName('gpt-5.5-mini') === 'gpt-5.5-mini');
}

// --- Case 5: exactly the 5 approved classes are fallback-eligible ---
{
  const expected = ['model_not_found', 'permission_denied', 'quota_or_rate_limit', 'billing_or_quota', 'server_error'];
  check(
    'Case 5: FALLBACK_ELIGIBLE_ERROR_CLASSES is exactly the 5 approved classes',
    FALLBACK_ELIGIBLE_ERROR_CLASSES.length === 5 && expected.every((c) => FALLBACK_ELIGIBLE_ERROR_CLASSES.includes(c)),
  );
  check('Case 5b: bad_request is never fallback-eligible', shouldAttemptFallbackForLlmFailure('bad_request') === false);
  check('Case 5c: invalid_api_key is never fallback-eligible', shouldAttemptFallbackForLlmFailure('invalid_api_key') === false);
  check('Case 5d: unknown_openai_error is never fallback-eligible', shouldAttemptFallbackForLlmFailure('unknown_openai_error') === false);
  check('Case 5e: model_not_found is fallback-eligible', shouldAttemptFallbackForLlmFailure('model_not_found') === true);
}

// --- Case 6: bridge fails closed with LLM_DISABLED when flag is not 'true' ---
{
  const result = await runLocalOnlyLlmRuntimeBridge({
    context: VALID_CONTEXT,
    env: { CHART_AI_ENABLE_LOCAL_LLM: 'false', CHART_AI_LLM_MODEL: 'gpt-5.5', OPENAI_API_KEY: 'sk-fake' },
  });
  check('Case 6: LLM_DISABLED when CHART_AI_ENABLE_LOCAL_LLM is not "true"', result.sanitizedErrorCode === 'LLM_DISABLED');
}

// --- Case 7: bridge fails closed with LLM_CONFIG_MISSING when no model resolves ---
{
  const result = await runLocalOnlyLlmRuntimeBridge({
    context: VALID_CONTEXT,
    env: { CHART_AI_ENABLE_LOCAL_LLM: 'true', OPENAI_API_KEY: 'sk-fake' },
  });
  check('Case 7: LLM_CONFIG_MISSING when neither main nor legacy model env is set', result.sanitizedErrorCode === 'LLM_CONFIG_MISSING');
}

// --- Case 8: main call success, no fallback configured -- ok, no fallback warning ---
{
  const { fetchImpl, calls } = makeFakeFetch([jsonResponse(200, { output_text: '기본 상태 요약입니다.' })]);
  const result = await runLocalOnlyLlmRuntimeBridge(
    {
      context: VALID_CONTEXT,
      env: { CHART_AI_ENABLE_LOCAL_LLM: 'true', OPENAI_API_KEY: 'sk-fake', CHART_AI_LLM_MODEL: 'gpt-5.5' },
    },
    { fetchImpl, timeoutMs: 2000 },
  );
  check('Case 8: main call success -> ok=true', result.ok === true);
  check('Case 8b: main call success -> no llm-fallback-used warning', !result.warnings.includes('llm-fallback-used'));
  check('Case 8c: main call success -> exactly one fetch call', calls.length === 1);
}

// --- Case 9: main call fails with model_not_found (fallback-eligible), fallback succeeds ---
{
  const { fetchImpl, calls } = makeFakeFetch([
    jsonResponse(404, { error: { type: 'invalid_request_error', code: 'model_not_found' } }),
    jsonResponse(200, { output_text: '대체 모델 요약입니다.' }),
  ]);
  const result = await runLocalOnlyLlmRuntimeBridge(
    {
      context: VALID_CONTEXT,
      env: {
        CHART_AI_ENABLE_LOCAL_LLM: 'true',
        OPENAI_API_KEY: 'sk-fake',
        CHART_AI_LLM_MODEL: 'gpt-5.5',
        CHART_AI_LLM_FALLBACK_MODEL: 'gpt-5.5-fallback',
      },
    },
    { fetchImpl, timeoutMs: 2000 },
  );
  check('Case 9: fallback-eligible failure + fallback success -> ok=true', result.ok === true);
  check('Case 9b: fallback-eligible failure + fallback success -> llm-fallback-used warning present', result.warnings.includes('llm-fallback-used'));
  check('Case 9c: fallback-eligible failure + fallback success -> exactly two fetch calls', calls.length === 2);
}

// --- Case 10: main call fails with model_not_found, fallback also fails -> fail closed ---
{
  const { fetchImpl, calls } = makeFakeFetch([
    jsonResponse(404, { error: { type: 'invalid_request_error', code: 'model_not_found' } }),
    jsonResponse(500, { error: { type: 'server_error', code: 'internal_error' } }),
  ]);
  const result = await runLocalOnlyLlmRuntimeBridge(
    {
      context: VALID_CONTEXT,
      env: {
        CHART_AI_ENABLE_LOCAL_LLM: 'true',
        OPENAI_API_KEY: 'sk-fake',
        CHART_AI_LLM_MODEL: 'gpt-5.5',
        CHART_AI_LLM_FALLBACK_MODEL: 'gpt-5.5-fallback',
      },
    },
    { fetchImpl, timeoutMs: 2000 },
  );
  check('Case 10: fallback also fails -> sanitizedErrorCode=LLM_CALL_FAILED', result.sanitizedErrorCode === 'LLM_CALL_FAILED');
  check('Case 10b: fallback also fails -> llm-fallback-failed warning present', result.warnings.includes('llm-fallback-failed'));
  check('Case 10c: fallback also fails -> exactly two fetch calls', calls.length === 2);
}

// --- Case 11: main call fails with bad_request (not fallback-eligible) -- fail closed, no fallback attempted ---
{
  const { fetchImpl, calls } = makeFakeFetch([jsonResponse(400, { error: { type: 'invalid_request_error', code: 'bad_request' } })]);
  const result = await runLocalOnlyLlmRuntimeBridge(
    {
      context: VALID_CONTEXT,
      env: {
        CHART_AI_ENABLE_LOCAL_LLM: 'true',
        OPENAI_API_KEY: 'sk-fake',
        CHART_AI_LLM_MODEL: 'gpt-5.5',
        CHART_AI_LLM_FALLBACK_MODEL: 'gpt-5.5-fallback',
      },
    },
    { fetchImpl, timeoutMs: 2000 },
  );
  check('Case 11: bad_request -> sanitizedErrorCode=LLM_CALL_FAILED', result.sanitizedErrorCode === 'LLM_CALL_FAILED');
  check('Case 11b: bad_request -> no fallback attempted (exactly one fetch call)', calls.length === 1);
  check('Case 11c: bad_request -> no llm-fallback-used or llm-fallback-failed warning', !result.warnings.some((w) => w.startsWith('llm-fallback')));
}

// --- Case 12: main call fails with model_not_found but no fallback model configured -- no fallback attempted ---
{
  const { fetchImpl, calls } = makeFakeFetch([jsonResponse(404, { error: { type: 'invalid_request_error', code: 'model_not_found' } })]);
  const result = await runLocalOnlyLlmRuntimeBridge(
    {
      context: VALID_CONTEXT,
      env: { CHART_AI_ENABLE_LOCAL_LLM: 'true', OPENAI_API_KEY: 'sk-fake', CHART_AI_LLM_MODEL: 'gpt-5.5' },
    },
    { fetchImpl, timeoutMs: 2000 },
  );
  check('Case 12: no fallback model configured -> exactly one fetch call', calls.length === 1);
  check('Case 12b: no fallback model configured -> sanitizedErrorCode=LLM_CALL_FAILED', result.sanitizedErrorCode === 'LLM_CALL_FAILED');
}

// --- Case 13: fallback model equal to main model -- treated as not distinct, no fallback attempted ---
{
  const { fetchImpl, calls } = makeFakeFetch([jsonResponse(404, { error: { type: 'invalid_request_error', code: 'model_not_found' } })]);
  const result = await runLocalOnlyLlmRuntimeBridge(
    {
      context: VALID_CONTEXT,
      env: {
        CHART_AI_ENABLE_LOCAL_LLM: 'true',
        OPENAI_API_KEY: 'sk-fake',
        CHART_AI_LLM_MODEL: 'gpt-5.5',
        CHART_AI_LLM_FALLBACK_MODEL: 'gpt-5.5',
      },
    },
    { fetchImpl, timeoutMs: 2000 },
  );
  check('Case 13: fallback model equals main model -> exactly one fetch call', calls.length === 1);
  check('Case 13b: fallback model equals main model -> sanitizedErrorCode=LLM_CALL_FAILED', result.sanitizedErrorCode === 'LLM_CALL_FAILED');
}

// --- Case 14: timeout never triggers a fallback attempt, even if a distinct fallback model is present ---
{
  const neverResolvingFetch = async () => new Promise(() => {});
  const result = await runLocalOnlyLlmRuntimeBridge(
    {
      context: VALID_CONTEXT,
      env: {
        CHART_AI_ENABLE_LOCAL_LLM: 'true',
        OPENAI_API_KEY: 'sk-fake',
        CHART_AI_LLM_MODEL: 'gpt-5.5',
        CHART_AI_LLM_FALLBACK_MODEL: 'gpt-5.5-fallback',
      },
    },
    { fetchImpl: neverResolvingFetch, timeoutMs: 30 },
  );
  check('Case 14: timeout -> sanitizedErrorCode=LLM_TIMEOUT', result.sanitizedErrorCode === 'LLM_TIMEOUT');
  check('Case 14b: timeout -> no llm-fallback-used or llm-fallback-failed warning', !result.warnings.some((w) => w.startsWith('llm-fallback')));
}

// --- Case 15: model names are never exposed anywhere in the response ---
{
  const { fetchImpl } = makeFakeFetch([
    jsonResponse(404, { error: { type: 'invalid_request_error', code: 'model_not_found' } }),
    jsonResponse(200, { output_text: '요약입니다.' }),
  ]);
  const result = await runLocalOnlyLlmRuntimeBridge(
    {
      context: VALID_CONTEXT,
      env: {
        CHART_AI_ENABLE_LOCAL_LLM: 'true',
        OPENAI_API_KEY: 'sk-fake',
        CHART_AI_LLM_MODEL: 'gpt-5.5-unique-main-token',
        CHART_AI_LLM_FALLBACK_MODEL: 'gpt-5.5-unique-fallback-token',
      },
    },
    { fetchImpl, timeoutMs: 2000 },
  );
  const serialized = JSON.stringify(result);
  check(
    'Case 15: response never contains the resolved main or fallback model name',
    !serialized.includes('gpt-5.5-unique-main-token') && !serialized.includes('gpt-5.5-unique-fallback-token'),
  );
  check('Case 15b: response has no modelName/modelId/rawModel fields', !('modelName' in result) && !('modelId' in result) && !('rawModel' in result));
}

console.log(`\nPhase 3GG-J-FAST smoke: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
}
