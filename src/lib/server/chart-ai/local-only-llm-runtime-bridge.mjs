// Phase 3GG-H-FAST local-only LLM runtime bridge.
// Phase 3GG-H-HF1: added safe OpenAI failure diagnostics (httpStatus/errorType/errorCode/
// errorParam/classified error label) and response-shape diagnostics, so LLM_CALL_FAILED /
// EMPTY_LLM_OUTPUT are no longer opaque. Diagnostics never include the raw OpenAI error message
// text, the raw response body, or the model's raw output text -- only short, allowlisted,
// enum-like fields.
// Phase 3GG-J-FAST: main model is now resolved via the model tier policy module
// (CHART_AI_LLM_MAIN_MODEL, falling back to the legacy CHART_AI_LLM_MODEL for backward
// compatibility). On a fallback-eligible classified failure, exactly one fallback call is
// attempted against a distinct CHART_AI_LLM_FALLBACK_MODEL, if present. Model names are never
// exposed in the response -- only the existing allowlisted warnings/diagnostics fields.
//
// Converts an already-sanitized Chart AI KIS current_price context (Phase 3GG-E-INTEGRATE)
// into an LLM-safe Korean prompt, calls the OpenAI Responses API via raw fetch (no SDK, no new
// dependency) only when explicitly enabled by local owner-controlled env vars, and returns a
// strictly allowlisted, sanitized summary response. Fails closed at every gate: disabled flag,
// missing API key, missing model, call failure/timeout, or forbidden investment language in the
// model output. Never reads, prints, logs, returns, or documents the OPENAI_API_KEY value.

import {
  buildLocalOnlyLlmModelPolicy,
  resolveLlmModelForRole,
  shouldAttemptFallbackForLlmFailure,
  LLM_MODEL_ROLES,
} from './local-only-llm-model-policy.mjs';

export const LOCAL_ONLY_LLM_RUNTIME_BRIDGE_CONTRACT_VERSION = 'local-only-llm-runtime-bridge.v0.1';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_TIMEOUT_MS = 12000;
const OK_SOURCE_STATUSES = Object.freeze(['ok', 'success']);
const MAX_SUMMARY_LENGTH = 800;

export const ALLOWED_LLM_INPUT_CONTEXT_FIELDS = Object.freeze([
  'symbol',
  'market',
  'currentPrice',
  'volume',
  'timestamp',
  'sourceStatus',
  'cacheStatus',
  'providerLabel',
  'integrationMode',
]);

export const ALLOWED_LLM_SUMMARY_RESPONSE_FIELDS = Object.freeze([
  'ok',
  'symbol',
  'market',
  'llmStatus',
  'summaryText',
  'sanitizedErrorCode',
  'modelPresent',
  'sourceStatus',
  'currentPricePresent',
  'volumePresent',
  'warnings',
  'diagnostics',
]);

// Phase 3GG-H-HF1: safe diagnostic fields only -- never the raw OpenAI error message text, never
// the raw response body, never the raw model output text.
export const ALLOWED_LLM_DIAGNOSTICS_FIELDS = Object.freeze([
  'httpStatus',
  'openAiErrorType',
  'openAiErrorCode',
  'openAiErrorParam',
  'openAiErrorMessageClass',
  'responseShapeKind',
  'outputTextPresent',
]);

// Phase 3GG-H-HF1: classified OpenAI failure labels. Never derived from or exposing the raw
// human-readable OpenAI error message -- classification uses only httpStatus + error.type/code.
export const OPENAI_ERROR_MESSAGE_CLASSES = Object.freeze({
  INVALID_API_KEY: 'invalid_api_key',
  MODEL_NOT_FOUND: 'model_not_found',
  PERMISSION_DENIED: 'permission_denied',
  QUOTA_OR_RATE_LIMIT: 'quota_or_rate_limit',
  BILLING_OR_QUOTA: 'billing_or_quota',
  SERVER_ERROR: 'server_error',
  BAD_REQUEST: 'bad_request',
  UNKNOWN_OPENAI_ERROR: 'unknown_openai_error',
});

// Phase 3GG-H-HF1: classified response-shape labels for when the OpenAI call succeeds (2xx) but
// no usable summary text could be extracted from the body.
export const RESPONSE_SHAPE_KINDS = Object.freeze({
  OUTPUT_TEXT_PRESENT: 'output_text_present',
  OUTPUT_ARRAY_TEXT_PRESENT: 'output_array_text_present',
  MESSAGE_CONTENT_TEXT_PRESENT: 'message_content_text_present',
  NO_TEXT_OUTPUT_FOUND: 'no_text_output_found',
  INVALID_JSON: 'invalid_json',
  UNKNOWN_SHAPE: 'unknown_shape',
});

export const SANITIZED_LLM_ERROR_CODES = Object.freeze({
  LLM_DISABLED: 'LLM_DISABLED',
  LLM_CONFIG_MISSING: 'LLM_CONFIG_MISSING',
  INVALID_INPUT_CONTEXT: 'INVALID_INPUT_CONTEXT',
  SOURCE_UNAVAILABLE: 'SOURCE_UNAVAILABLE',
  LLM_CALL_FAILED: 'LLM_CALL_FAILED',
  LLM_TIMEOUT: 'LLM_TIMEOUT',
  FORBIDDEN_LANGUAGE_DETECTED: 'FORBIDDEN_LANGUAGE_DETECTED',
  EMPTY_LLM_OUTPUT: 'EMPTY_LLM_OUTPUT',
  // Phase 3GG-K-FAST: the UI displays summaryText verbatim, so any ASCII digit in the final
  // summary risks leaking the exact currentPrice/volume numeric value. Fail closed instead.
  FORBIDDEN_NUMERIC_OUTPUT_DETECTED: 'FORBIDDEN_NUMERIC_OUTPUT_DETECTED',
});

// Fixed list of Korean investment-advice phrases that must never appear in LLM output.
export const FORBIDDEN_KOREAN_INVESTMENT_PHRASES = Object.freeze([
  '매수하세요',
  '매도하세요',
  '지금 진입',
  '목표가',
  '손절가',
  '강력 추천',
  '상승 확정',
  '하락 확정',
]);

// Defense-in-depth: input context values must never carry raw KIS payload field names,
// credential-like tokens, headers, account/trading fields, or session/identity data, even
// though the upstream Chart AI KIS context adapter already strips these.
const FORBIDDEN_INPUT_VALUE_PATTERN =
  /\brt_cd\b|\boutput\b|\bstck_prpr\b|\bacml_vol\b|\bprdy_vrss\b|\bprdy_ctrt\b|KIS_APP_KEY|KIS_APP_SECRET|KIS_BASE_URL|access_token|appsecret|appkey|authorization|bearer|KIS_ACCOUNT_NO|account_no|\baccount\b|\bbalance\b|\border\b|\bfunds\b|\bportfolio\b|\btrading\b|jwt|cookie|session|password|email|user_id|userid/i;

const jsonSafeString = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
};

export function assertNoForbiddenLlmInput(context) {
  if (!context || typeof context !== 'object') {
    throw new TypeError('LLM input context must be a plain object.');
  }
  for (const key of Object.keys(context)) {
    if (!ALLOWED_LLM_INPUT_CONTEXT_FIELDS.includes(key)) {
      throw new Error(`Unexpected field "${key}" in LLM input context.`);
    }
  }
  if (FORBIDDEN_INPUT_VALUE_PATTERN.test(jsonSafeString(context))) {
    throw new Error('LLM input context contains a forbidden raw-payload, credential, or identity-like token.');
  }
  return true;
}

// Phase 3GG-K-FAST: recommended bullet labels for the structured 3-bullet Korean summary
// contract. Exported so the prompt and any downstream formatting stay in sync.
export const LLM_SUMMARY_BULLET_LABELS = Object.freeze(['데이터 상태:', '해석 범위:', '유의사항:']);

export function buildLlmSafeCurrentPricePrompt(context) {
  assertNoForbiddenLlmInput(context);

  const symbol = typeof context.symbol === 'string' ? context.symbol : '알 수 없음';
  const market = typeof context.market === 'string' ? context.market : '알 수 없음';
  const currentPriceAvailable =
    typeof context.currentPrice === 'number' && Number.isFinite(context.currentPrice);
  const volumeAvailable = typeof context.volume === 'number' && Number.isFinite(context.volume);
  const sourceStatus = typeof context.sourceStatus === 'string' ? context.sourceStatus : 'unavailable';

  // Phase 3GG-K-FAST: the model is given only presence/absence of current_price and volume data,
  // never the raw numeric values, so it has nothing numeric to echo back into the summary.
  const dataLines = [
    `종목코드: ${symbol}`,
    `시장: ${market}`,
    `현재가 데이터 여부: ${currentPriceAvailable ? '있음' : '없음'}`,
    `거래량 데이터 여부: ${volumeAvailable ? '있음' : '없음'}`,
    `데이터 상태: ${sourceStatus}`,
  ].join('\n');

  const systemPrompt = [
    '당신은 한국어로만 응답하는 주식 현재가 상태 요약 도우미입니다.',
    '반드시 아래 규칙을 지키세요:',
    '- 한국어로만 응답합니다.',
    '- 응답은 정확히 3개의 짧은 불릿(bullet)으로만 작성합니다.',
    `- 첫 번째 불릿은 "${LLM_SUMMARY_BULLET_LABELS[0]}"로 시작하여 현재가/거래량 데이터가 존재하는지와 데이터 상태만 설명합니다.`,
    `- 두 번째 불릿은 "${LLM_SUMMARY_BULLET_LABELS[1]}"로 시작하여 이 정보만으로는 투자 판단을 내리기에 충분하지 않다는 해석 범위의 한계를 설명합니다.`,
    `- 세 번째 불릿은 "${LLM_SUMMARY_BULLET_LABELS[2]}"로 시작하여 이 요약이 투자 자문이 아니라는 점을 반드시 언급합니다.`,
    '- 현재가(current_price)나 거래량의 정확한 숫자를 절대 출력하지 않습니다. 데이터의 존재 여부와 상태만 설명합니다.',
    '- 매수·매도 추천을 포함하지 않습니다.',
    '- 목표가를 포함하지 않습니다.',
    '- 손절가를 포함하지 않습니다.',
    '- 매수·매도 진입 시점을 포함하지 않습니다.',
    '- 미래 가격 움직임을 단정하거나 강한 확신을 담은 예측 표현을 사용하지 않습니다.',
    `- 다음 표현(또는 이와 동일한 의미의 표현)을 절대 사용하지 않습니다: ${FORBIDDEN_KOREAN_INVESTMENT_PHRASES.join(', ')}.`,
  ].join('\n');

  const userPrompt = `다음 현재가 데이터 상태를 기반으로 기본 상태를 요약해 주세요. 숫자 값은 제공되지 않으며, 데이터의 존재 여부와 상태만 설명해야 합니다.\n\n${dataLines}`;

  return { systemPrompt, userPrompt };
}

// Phase 3GG-K-FAST: summaryText is displayed verbatim by the UI, so any ASCII digit could leak
// the exact currentPrice/volume numeric value. This check never inspects or reports which digit
// was found -- it only decides safe/unsafe.
const ASCII_DIGIT_PATTERN = /[0-9]/;

export function sanitizeLlmSummaryText(rawText) {
  if (typeof rawText !== 'string' || rawText.trim().length === 0) {
    return { safe: false, text: null, sanitizedErrorCode: SANITIZED_LLM_ERROR_CODES.EMPTY_LLM_OUTPUT };
  }
  const trimmed = rawText.trim().slice(0, MAX_SUMMARY_LENGTH);
  const hasForbiddenPhrase = FORBIDDEN_KOREAN_INVESTMENT_PHRASES.some((phrase) => trimmed.includes(phrase));
  if (hasForbiddenPhrase) {
    return { safe: false, text: null, sanitizedErrorCode: SANITIZED_LLM_ERROR_CODES.FORBIDDEN_LANGUAGE_DETECTED };
  }
  if (ASCII_DIGIT_PATTERN.test(trimmed)) {
    return { safe: false, text: null, sanitizedErrorCode: SANITIZED_LLM_ERROR_CODES.FORBIDDEN_NUMERIC_OUTPUT_DETECTED };
  }
  return { safe: true, text: trimmed, sanitizedErrorCode: null };
}

function extractTextFromContentItem(contentItem) {
  if (!contentItem || typeof contentItem !== 'object') return null;
  if (typeof contentItem.text === 'string') return contentItem.text;
  if (contentItem.text && typeof contentItem.text.value === 'string') return contentItem.text.value;
  return null;
}

function extractResponseText(body) {
  if (!body || typeof body !== 'object') return '';
  if (typeof body.output_text === 'string' && body.output_text.trim().length > 0) return body.output_text;
  if (Array.isArray(body.output)) {
    for (const item of body.output) {
      if (item && Array.isArray(item.content)) {
        for (const contentItem of item.content) {
          const text = extractTextFromContentItem(contentItem);
          if (text) return text;
        }
      }
    }
  }
  if (Array.isArray(body.choices)) {
    for (const choice of body.choices) {
      const content = choice && choice.message && choice.message.content;
      if (typeof content === 'string' && content.trim().length > 0) return content;
    }
  }
  return '';
}

function classifyResponseShape(body) {
  if (body === null || typeof body !== 'object') return RESPONSE_SHAPE_KINDS.UNKNOWN_SHAPE;
  if (typeof body.output_text === 'string' && body.output_text.trim().length > 0) {
    return RESPONSE_SHAPE_KINDS.OUTPUT_TEXT_PRESENT;
  }
  if (Array.isArray(body.output)) {
    for (const item of body.output) {
      if (item && Array.isArray(item.content)) {
        for (const contentItem of item.content) {
          if (extractTextFromContentItem(contentItem)) return RESPONSE_SHAPE_KINDS.OUTPUT_ARRAY_TEXT_PRESENT;
        }
      }
    }
  }
  if (Array.isArray(body.choices)) {
    for (const choice of body.choices) {
      const content = choice && choice.message && choice.message.content;
      if (typeof content === 'string' && content.trim().length > 0) return RESPONSE_SHAPE_KINDS.MESSAGE_CONTENT_TEXT_PRESENT;
    }
  }
  return RESPONSE_SHAPE_KINDS.NO_TEXT_OUTPUT_FOUND;
}

function safeShortString(value, maxLen = 80) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen).replace(/[\r\n]+/g, ' ');
}

function classifyOpenAiError({ httpStatus, errorType, errorCode }) {
  const type = typeof errorType === 'string' ? errorType.toLowerCase() : '';
  const code = typeof errorCode === 'string' ? errorCode.toLowerCase() : '';
  if (httpStatus === 401 || code.includes('invalid_api_key') || code.includes('invalid_authentication')) {
    return OPENAI_ERROR_MESSAGE_CLASSES.INVALID_API_KEY;
  }
  if (httpStatus === 404 || code.includes('model_not_found') || code.includes('unknown_model')) {
    return OPENAI_ERROR_MESSAGE_CLASSES.MODEL_NOT_FOUND;
  }
  if (httpStatus === 403 || code.includes('permission') || type.includes('permission')) {
    return OPENAI_ERROR_MESSAGE_CLASSES.PERMISSION_DENIED;
  }
  if (httpStatus === 429 || code.includes('rate_limit') || type.includes('rate_limit')) {
    return OPENAI_ERROR_MESSAGE_CLASSES.QUOTA_OR_RATE_LIMIT;
  }
  if (code.includes('quota') || code.includes('billing')) {
    return OPENAI_ERROR_MESSAGE_CLASSES.BILLING_OR_QUOTA;
  }
  if (typeof httpStatus === 'number' && httpStatus >= 500) {
    return OPENAI_ERROR_MESSAGE_CLASSES.SERVER_ERROR;
  }
  if (httpStatus === 400 || type.includes('invalid_request')) {
    return OPENAI_ERROR_MESSAGE_CLASSES.BAD_REQUEST;
  }
  return OPENAI_ERROR_MESSAGE_CLASSES.UNKNOWN_OPENAI_ERROR;
}

function buildDiagnostics(fields) {
  const diagnostics = { ...fields };
  for (const key of Object.keys(diagnostics)) {
    if (!ALLOWED_LLM_DIAGNOSTICS_FIELDS.includes(key)) {
      delete diagnostics[key];
    }
  }
  return diagnostics;
}

function extractOpenAiErrorDiagnostics(httpStatus, parsedBody) {
  const errorObj = parsedBody && typeof parsedBody === 'object' ? parsedBody.error : null;
  const errorType = safeShortString(errorObj && errorObj.type);
  const errorCode = safeShortString(errorObj && errorObj.code);
  const errorParam = safeShortString(errorObj && errorObj.param);
  const openAiErrorMessageClass = classifyOpenAiError({ httpStatus, errorType, errorCode });
  return {
    diagnostics: buildDiagnostics({
      httpStatus,
      openAiErrorType: errorType,
      openAiErrorCode: errorCode,
      openAiErrorParam: errorParam,
      openAiErrorMessageClass,
    }),
    errorClass: openAiErrorMessageClass,
  };
}

function callWithTimeout(promiseFactory, timeoutMs, deps) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('llm-call-timeout'));
    }, timeoutMs);
    promiseFactory()
      .then((value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      });
    void deps;
  });
}

function buildResponse(base) {
  const response = {
    ok: false,
    symbol: null,
    market: null,
    llmStatus: 'unavailable',
    summaryText: null,
    sanitizedErrorCode: null,
    modelPresent: false,
    sourceStatus: 'unavailable',
    currentPricePresent: false,
    volumePresent: false,
    warnings: [],
    ...base,
  };
  const keys = Object.keys(response);
  for (const key of keys) {
    if (!ALLOWED_LLM_SUMMARY_RESPONSE_FIELDS.includes(key)) {
      delete response[key];
    }
  }
  return response;
}

async function callOpenAiModelOnce({ modelName, systemPrompt, userPrompt, env, fetchImpl, timeoutMs, deps }) {
  return callWithTimeout(
    async () => {
      const response = await fetchImpl(OPENAI_RESPONSES_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: modelName,
          input: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });
      const responseText = await response.text();
      let parsedBody = null;
      let parseFailed = false;
      try {
        parsedBody = responseText ? JSON.parse(responseText) : null;
      } catch {
        parseFailed = true;
      }
      if (!response.ok) {
        const { diagnostics, errorClass } = extractOpenAiErrorDiagnostics(response.status, parsedBody);
        const err = new Error('llm-http-error');
        err.diagnostics = diagnostics;
        err.errorClass = errorClass;
        throw err;
      }
      if (parseFailed) {
        const err = new Error('llm-invalid-json');
        err.diagnostics = buildDiagnostics({
          httpStatus: response.status,
          responseShapeKind: RESPONSE_SHAPE_KINDS.INVALID_JSON,
          outputTextPresent: false,
        });
        err.errorClass = null;
        throw err;
      }
      return parsedBody;
    },
    timeoutMs,
    deps,
  );
}

export async function runLocalOnlyLlmRuntimeBridge(input, deps = {}) {
  const context = input && typeof input === 'object' ? input.context : null;
  const env = input && typeof input === 'object' && input.env ? input.env : {};
  const fetchImpl = typeof deps.fetchImpl === 'function' ? deps.fetchImpl : globalThis.fetch;
  const timeoutMs = typeof deps.timeoutMs === 'number' ? deps.timeoutMs : DEFAULT_TIMEOUT_MS;

  let safeContext;
  try {
    assertNoForbiddenLlmInput(context);
    safeContext = context;
  } catch {
    return buildResponse({ sanitizedErrorCode: SANITIZED_LLM_ERROR_CODES.INVALID_INPUT_CONTEXT, warnings: ['invalid-input-context'] });
  }

  const symbol = typeof safeContext.symbol === 'string' ? safeContext.symbol : null;
  const market = typeof safeContext.market === 'string' ? safeContext.market : null;
  const sourceStatus = typeof safeContext.sourceStatus === 'string' ? safeContext.sourceStatus : 'unavailable';
  const currentPricePresent =
    typeof safeContext.currentPrice === 'number' && Number.isFinite(safeContext.currentPrice);
  const volumePresent = typeof safeContext.volume === 'number' && Number.isFinite(safeContext.volume);

  const baseFields = { symbol, market, sourceStatus, currentPricePresent, volumePresent };

  if (!OK_SOURCE_STATUSES.includes(sourceStatus) || !currentPricePresent) {
    return buildResponse({
      ...baseFields,
      sanitizedErrorCode: SANITIZED_LLM_ERROR_CODES.SOURCE_UNAVAILABLE,
      warnings: ['source-unavailable'],
    });
  }

  if (env.CHART_AI_ENABLE_LOCAL_LLM !== 'true') {
    return buildResponse({ ...baseFields, sanitizedErrorCode: SANITIZED_LLM_ERROR_CODES.LLM_DISABLED, warnings: ['llm-disabled'] });
  }

  const hasApiKey = typeof env.OPENAI_API_KEY === 'string' && env.OPENAI_API_KEY.trim().length > 0;
  const modelPolicy = buildLocalOnlyLlmModelPolicy(env);
  const mainModel = resolveLlmModelForRole(modelPolicy, LLM_MODEL_ROLES.MAIN_SUMMARY);
  const fallbackModel = resolveLlmModelForRole(modelPolicy, LLM_MODEL_ROLES.FALLBACK_SUMMARY);
  const hasModel = Boolean(mainModel);
  const modelPresent = hasModel;
  const fallbackEligibleAndPresent = Boolean(fallbackModel) && fallbackModel !== mainModel;

  if (!hasApiKey || !hasModel) {
    return buildResponse({
      ...baseFields,
      modelPresent,
      sanitizedErrorCode: SANITIZED_LLM_ERROR_CODES.LLM_CONFIG_MISSING,
      warnings: ['llm-config-missing'],
    });
  }

  const { systemPrompt, userPrompt } = buildLlmSafeCurrentPricePrompt(safeContext);

  let rawBody;
  let usedFallback = false;
  try {
    rawBody = await callOpenAiModelOnce({ modelName: mainModel, systemPrompt, userPrompt, env, fetchImpl, timeoutMs, deps });
  } catch (mainError) {
    const isTimeout = mainError instanceof Error && mainError.message === 'llm-call-timeout';
    const mainDiagnostics = !isTimeout && mainError && typeof mainError === 'object' ? mainError.diagnostics : undefined;
    const mainErrorClass = !isTimeout && mainError && typeof mainError === 'object' ? mainError.errorClass : null;

    if (!isTimeout && fallbackEligibleAndPresent && shouldAttemptFallbackForLlmFailure(mainErrorClass)) {
      try {
        rawBody = await callOpenAiModelOnce({ modelName: fallbackModel, systemPrompt, userPrompt, env, fetchImpl, timeoutMs, deps });
        usedFallback = true;
      } catch (fallbackError) {
        const fallbackIsTimeout = fallbackError instanceof Error && fallbackError.message === 'llm-call-timeout';
        const fallbackDiagnostics =
          !fallbackIsTimeout && fallbackError && typeof fallbackError === 'object' ? fallbackError.diagnostics : undefined;
        return buildResponse({
          ...baseFields,
          modelPresent,
          sanitizedErrorCode: fallbackIsTimeout ? SANITIZED_LLM_ERROR_CODES.LLM_TIMEOUT : SANITIZED_LLM_ERROR_CODES.LLM_CALL_FAILED,
          warnings: [fallbackIsTimeout ? 'llm-timeout' : 'llm-call-failed', 'llm-fallback-failed'],
          diagnostics: fallbackDiagnostics ?? mainDiagnostics,
        });
      }
    } else {
      return buildResponse({
        ...baseFields,
        modelPresent,
        sanitizedErrorCode: isTimeout ? SANITIZED_LLM_ERROR_CODES.LLM_TIMEOUT : SANITIZED_LLM_ERROR_CODES.LLM_CALL_FAILED,
        warnings: [isTimeout ? 'llm-timeout' : 'llm-call-failed'],
        diagnostics: mainDiagnostics,
      });
    }
  }

  const extracted = extractResponseText(rawBody);
  const sanitized = sanitizeLlmSummaryText(extracted);

  if (!sanitized.safe) {
    const shapeDiagnostics =
      sanitized.sanitizedErrorCode === SANITIZED_LLM_ERROR_CODES.EMPTY_LLM_OUTPUT
        ? buildDiagnostics({
            responseShapeKind: classifyResponseShape(rawBody),
            outputTextPresent: extracted.trim().length > 0,
          })
        : undefined;
    // Phase 3GG-K-FAST: sanitizedErrorCode -> warning label. Never derived from or including the
    // rejected text itself -- only a fixed, safe label per error code.
    const sanitizeWarningByCode = {
      [SANITIZED_LLM_ERROR_CODES.FORBIDDEN_LANGUAGE_DETECTED]: 'forbidden-language-detected',
      [SANITIZED_LLM_ERROR_CODES.FORBIDDEN_NUMERIC_OUTPUT_DETECTED]: 'forbidden-numeric-output-detected',
      [SANITIZED_LLM_ERROR_CODES.EMPTY_LLM_OUTPUT]: 'empty-llm-output',
    };
    return buildResponse({
      ...baseFields,
      modelPresent,
      sanitizedErrorCode: sanitized.sanitizedErrorCode,
      warnings: [
        sanitizeWarningByCode[sanitized.sanitizedErrorCode] ?? 'empty-llm-output',
        ...(usedFallback ? ['llm-fallback-used'] : []),
      ],
      diagnostics: shapeDiagnostics,
    });
  }

  return buildResponse({
    ok: true,
    ...baseFields,
    llmStatus: 'ok',
    summaryText: sanitized.text,
    warnings: usedFallback ? ['llm-fallback-used'] : [],
    modelPresent,
  });
}
