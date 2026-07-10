// Phase 3GG-H-FAST owner-gated local-only LLM runtime bridge smoke.
//
// Runs exactly ONE explicit owner-approved local-only LLM summary request against the new
// local-only route (Phase 3GG-H-FAST). Requires the explicit CLI flag
// --owner-approved-local-llm-smoke; without it, no network call is attempted at all. Never
// reads .env/.env.local, never reads or prints OPENAI_API_KEY/CHART_AI_LLM_MODEL values, never
// prints the actual currentPrice value, never prints the prompt, and never prints a raw LLM
// response body. Calls only the single LLM summary route -- no order, account, balance, or
// KIS-endpoint-expansion route is ever reachable from this script.

const OWNER_APPROVAL_FLAG = '--owner-approved-local-llm-smoke';
const DEFAULT_BASE_URL = 'http://localhost:4321';
const ROUTE_PATH = '/api/chart-ai/local-only-kis-llm-summary.json?ownerLocalKisLlm=1&symbol=005930';
const TARGET_SYMBOL = '005930';
const TARGET_MARKET = 'KR';

const ALLOWED_SUMMARY_FIELDS = Object.freeze([
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

// rt_cd / output / stck_prpr / acml_vol / prdy_vrss / prdy_ctrt: raw KIS payload field names.
const FORBIDDEN_RAW_PAYLOAD_PATTERN = /\brt_cd\b|\bstck_prpr\b|\bacml_vol\b|\bprdy_vrss\b|\bprdy_ctrt\b/i;

// KIS_APP_KEY / KIS_APP_SECRET / access_token / appsecret / appkey / Authorization / Bearer /
// OPENAI_API_KEY / sk-: credential-like tokens.
const FORBIDDEN_CREDENTIAL_PATTERN =
  /KIS_APP_KEY|KIS_APP_SECRET|KIS_BASE_URL|access_token|appsecret|appkey|authorization|Bearer|KIS_ACCOUNT_NO|account_no|jwt|password|OPENAI_API_KEY|\bsk-[A-Za-z0-9]/i;

// Raw OpenAI Responses API shape tokens that must never appear in the sanitized response.
const FORBIDDEN_RAW_LLM_RESPONSE_PATTERN = /"output_text"|"output"\s*:\s*\[|"usage"\s*:\s*\{|"model"\s*:\s*"gpt|response\.created/i;

const FORBIDDEN_KOREAN_INVESTMENT_PHRASES = [
  '매수하세요',
  '매도하세요',
  '지금 진입',
  '목표가',
  '손절가',
  '강력 추천',
  '상승 확정',
  '하락 확정',
];

const HANGUL_PATTERN = /[가-힣]/;

const logSanitized = (message) => {
  console.log(message);
};

const failClosed = (reason) => {
  logSanitized(`Phase 3GG-H-FAST owner local LLM runtime bridge smoke BLOCKED: reason=${reason} sanitized=true`);
  process.exitCode = 1;
};

async function main() {
  const args = process.argv.slice(2);

  // 1. Explicit owner-approval flag required before any network call is attempted.
  if (!args.includes(OWNER_APPROVAL_FLAG)) {
    failClosed('missing-owner-approval-flag');
    return;
  }

  const baseUrlArg = args.find((a) => a.startsWith('--base-url='));
  const baseUrl = baseUrlArg ? baseUrlArg.slice('--base-url='.length) : DEFAULT_BASE_URL;
  const requestUrl = `${baseUrl}${ROUTE_PATH}`;

  // 2. Fetch the local-only route. Any network-level failure (dev server not running, etc.)
  // fails closed with a sanitized reason only.
  let response;
  let rawText;
  try {
    response = await fetch(requestUrl, { method: 'GET' });
    rawText = await response.text();
  } catch {
    failClosed('local-dev-server-unreachable');
    return;
  }

  // 3. Scan the raw response text for forbidden raw-payload / credential / raw-LLM-response
  // patterns BEFORE parsing or printing anything derived from it. If found, never print the
  // raw body.
  if (FORBIDDEN_RAW_PAYLOAD_PATTERN.test(rawText)) {
    failClosed('raw-payload-pattern-detected');
    return;
  }
  if (FORBIDDEN_CREDENTIAL_PATTERN.test(rawText)) {
    failClosed('credential-pattern-detected');
    return;
  }
  if (FORBIDDEN_RAW_LLM_RESPONSE_PATTERN.test(rawText)) {
    failClosed('raw-llm-response-shape-detected');
    return;
  }

  if (response.status !== 200) {
    failClosed(`unexpected-http-status-${response.status}`);
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    failClosed('response-not-valid-json');
    return;
  }

  if (!parsed || parsed.ok !== true || !parsed.summary || typeof parsed.summary !== 'object') {
    failClosed('unexpected-response-shape');
    return;
  }

  const { summary } = parsed;

  // 4. Assert the summary contains only allowlisted fields -- nothing more, nothing less.
  const summaryKeys = Object.keys(summary);
  const hasOnlyAllowedFields = summaryKeys.every((key) => ALLOWED_SUMMARY_FIELDS.includes(key));
  if (!hasOnlyAllowedFields) {
    failClosed('summary-field-allowlist-mismatch');
    return;
  }

  // 5. If local LLM env is missing on the server, the route fails closed truthfully -- report
  // that as a blocker, never a pass.
  if (summary.ok !== true) {
    logSanitized(
      `Phase 3GG-H-FAST owner local LLM runtime bridge smoke BLOCKED: reason=llm-not-available ` +
        `sourceStatus=${summary.sourceStatus} sanitizedErrorCode=${summary.sanitizedErrorCode ?? 'null'} sanitized=true`,
    );
    process.exitCode = 1;
    return;
  }

  const currentPricePresent = summary.currentPricePresent === true;
  const volumePresentIsBoolean = typeof summary.volumePresent === 'boolean';
  const summaryTextPresent = typeof summary.summaryText === 'string' && summary.summaryText.trim().length > 0;
  const summaryTextIsKorean = summaryTextPresent && HANGUL_PATTERN.test(summary.summaryText);
  const summaryTextHasNoForbiddenPhrase =
    summaryTextPresent && !FORBIDDEN_KOREAN_INVESTMENT_PHRASES.some((phrase) => summary.summaryText.includes(phrase));

  const passes =
    summary.symbol === TARGET_SYMBOL &&
    summary.market === TARGET_MARKET &&
    summary.llmStatus === 'ok' &&
    summaryTextPresent &&
    summaryTextIsKorean &&
    summaryTextHasNoForbiddenPhrase &&
    currentPricePresent &&
    volumePresentIsBoolean;

  if (!passes) {
    logSanitized(
      `Phase 3GG-H-FAST owner local LLM runtime bridge smoke BLOCKED: reason=fail-closed-or-invalid-summary ` +
        `llmStatus=${summary.llmStatus} sanitizedErrorCode=${summary.sanitizedErrorCode ?? 'null'} sanitized=true`,
    );
    process.exitCode = 1;
    return;
  }

  logSanitized(
    `Phase 3GG-H-FAST owner local LLM runtime bridge smoke PASS: symbol=${summary.symbol} ` +
      `llmStatus=${summary.llmStatus} summaryPresent=true currentPricePresent=true sanitized=true`,
  );
}

main().catch(() => {
  logSanitized('Phase 3GG-H-FAST owner local LLM runtime bridge smoke BLOCKED: reason=unexpected-error sanitized=true');
  process.exitCode = 1;
});
