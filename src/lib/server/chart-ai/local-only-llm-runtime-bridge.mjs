// Phase 3GG-H-FAST local-only LLM runtime bridge.
//
// Converts an already-sanitized Chart AI KIS current_price context (Phase 3GG-E-INTEGRATE)
// into an LLM-safe Korean prompt, calls the OpenAI Responses API via raw fetch (no SDK, no new
// dependency) only when explicitly enabled by local owner-controlled env vars, and returns a
// strictly allowlisted, sanitized summary response. Fails closed at every gate: disabled flag,
// missing API key, missing model, call failure/timeout, or forbidden investment language in the
// model output. Never reads, prints, logs, returns, or documents the OPENAI_API_KEY value.

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
]);

export const SANITIZED_LLM_ERROR_CODES = Object.freeze({
  LLM_DISABLED: 'LLM_DISABLED',
  LLM_CONFIG_MISSING: 'LLM_CONFIG_MISSING',
  INVALID_INPUT_CONTEXT: 'INVALID_INPUT_CONTEXT',
  SOURCE_UNAVAILABLE: 'SOURCE_UNAVAILABLE',
  LLM_CALL_FAILED: 'LLM_CALL_FAILED',
  LLM_TIMEOUT: 'LLM_TIMEOUT',
  FORBIDDEN_LANGUAGE_DETECTED: 'FORBIDDEN_LANGUAGE_DETECTED',
  EMPTY_LLM_OUTPUT: 'EMPTY_LLM_OUTPUT',
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

export function buildLlmSafeCurrentPricePrompt(context) {
  assertNoForbiddenLlmInput(context);

  const symbol = typeof context.symbol === 'string' ? context.symbol : '알 수 없음';
  const market = typeof context.market === 'string' ? context.market : '알 수 없음';
  const currentPrice =
    typeof context.currentPrice === 'number' && Number.isFinite(context.currentPrice) ? context.currentPrice : null;
  const volume = typeof context.volume === 'number' && Number.isFinite(context.volume) ? context.volume : null;
  const sourceStatus = typeof context.sourceStatus === 'string' ? context.sourceStatus : 'unavailable';

  const dataLines = [
    `종목코드: ${symbol}`,
    `시장: ${market}`,
    `현재가: ${currentPrice === null ? '데이터 없음' : currentPrice}`,
    `거래량: ${volume === null ? '데이터 없음' : volume}`,
    `데이터 상태: ${sourceStatus}`,
  ].join('\n');

  const systemPrompt = [
    '당신은 한국어로만 응답하는 주식 현재가 상태 요약 도우미입니다.',
    '반드시 아래 규칙을 지키세요:',
    '- 한국어로만 응답합니다.',
    '- 최대 3개의 짧은 불릿(bullet)으로만 응답합니다.',
    '- 제공된 현재가(current_price) 데이터가 나타내는 기본적인 상태만 설명합니다.',
    '- 이 요약은 투자 자문이 아니라는 점을 반드시 언급합니다.',
    '- 매수·매도 추천을 포함하지 않습니다.',
    '- 목표가를 포함하지 않습니다.',
    '- 손절가를 포함하지 않습니다.',
    '- 미래 가격 움직임을 단정하지 않습니다.',
    `- 다음 표현(또는 이와 동일한 의미의 표현)을 절대 사용하지 않습니다: ${FORBIDDEN_KOREAN_INVESTMENT_PHRASES.join(', ')}.`,
  ].join('\n');

  const userPrompt = `다음 현재가 데이터를 기반으로 기본 상태를 요약해 주세요.\n\n${dataLines}`;

  return { systemPrompt, userPrompt };
}

export function sanitizeLlmSummaryText(rawText) {
  if (typeof rawText !== 'string' || rawText.trim().length === 0) {
    return { safe: false, text: null, sanitizedErrorCode: SANITIZED_LLM_ERROR_CODES.EMPTY_LLM_OUTPUT };
  }
  const trimmed = rawText.trim().slice(0, MAX_SUMMARY_LENGTH);
  const hasForbiddenPhrase = FORBIDDEN_KOREAN_INVESTMENT_PHRASES.some((phrase) => trimmed.includes(phrase));
  if (hasForbiddenPhrase) {
    return { safe: false, text: null, sanitizedErrorCode: SANITIZED_LLM_ERROR_CODES.FORBIDDEN_LANGUAGE_DETECTED };
  }
  return { safe: true, text: trimmed, sanitizedErrorCode: null };
}

function extractResponseText(body) {
  if (!body || typeof body !== 'object') return '';
  if (typeof body.output_text === 'string') return body.output_text;
  if (Array.isArray(body.output)) {
    for (const item of body.output) {
      if (item && Array.isArray(item.content)) {
        for (const contentItem of item.content) {
          if (contentItem && typeof contentItem.text === 'string') {
            return contentItem.text;
          }
        }
      }
    }
  }
  return '';
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
  const hasModel = typeof env.CHART_AI_LLM_MODEL === 'string' && env.CHART_AI_LLM_MODEL.trim().length > 0;
  const modelPresent = hasModel;

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
  try {
    rawBody = await callWithTimeout(
      async () => {
        const response = await fetchImpl(OPENAI_RESPONSES_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: env.CHART_AI_LLM_MODEL,
            input: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
        });
        if (!response.ok) {
          throw new Error(`llm-http-${response.status}`);
        }
        return response.json();
      },
      timeoutMs,
      deps,
    );
  } catch (error) {
    const isTimeout = error instanceof Error && error.message === 'llm-call-timeout';
    return buildResponse({
      ...baseFields,
      modelPresent,
      sanitizedErrorCode: isTimeout ? SANITIZED_LLM_ERROR_CODES.LLM_TIMEOUT : SANITIZED_LLM_ERROR_CODES.LLM_CALL_FAILED,
      warnings: [isTimeout ? 'llm-timeout' : 'llm-call-failed'],
    });
  }

  const extracted = extractResponseText(rawBody);
  const sanitized = sanitizeLlmSummaryText(extracted);

  if (!sanitized.safe) {
    return buildResponse({
      ...baseFields,
      modelPresent,
      sanitizedErrorCode: sanitized.sanitizedErrorCode,
      warnings: [sanitized.sanitizedErrorCode === SANITIZED_LLM_ERROR_CODES.FORBIDDEN_LANGUAGE_DETECTED ? 'forbidden-language-detected' : 'empty-llm-output'],
    });
  }

  return buildResponse({
    ok: true,
    ...baseFields,
    llmStatus: 'ok',
    summaryText: sanitized.text,
    modelPresent,
  });
}
