// Phase 3GG-L-FAST owner-gated LLM quality regression harness.
//
// Repeatable owner-local regression check for the already-verified KIS + LLM summary quality path.
// Requires the explicit CLI flag --owner-approved-llm-quality-regression; without it, nothing runs.
//
// It probes ONLY the existing owner-local H route over localhost
// (GET /api/chart-ai/local-only-kis-llm-summary.json?ownerLocalKisLlm=1&symbol=005930), up to
// --repeat=3 times (default 1, to keep execution fast and OpenAI cost controlled). It makes no direct
// OpenAI call and no direct KIS call. It never reads .env/.env.local, never prints a raw summary
// text, raw KIS payload, raw OpenAI request/response, prompt, model name, or currentPrice/volume
// numeric value. current_price is the only KIS market-data category touched (indirectly, via the H
// route). No order/account/balance/funds/portfolio/trading/personal endpoint is ever contacted.

const OWNER_APPROVAL_FLAG = '--owner-approved-llm-quality-regression';
const DEFAULT_LOCAL_BASE_URL = 'http://localhost:4321';
const H_ROUTE_PATH = '/api/chart-ai/local-only-kis-llm-summary.json?ownerLocalKisLlm=1&symbol=005930';
const REQUEST_TIMEOUT_MS = 15000;
const MAX_REPEAT = 3;

const REQUIRED_SUMMARY_LABELS = ['데이터 상태:', '해석 범위:', '유의사항:'];

const FORBIDDEN_INVESTMENT_PHRASE_PATTERN =
  /매수|매도|목표가|목표\s?가격|손절|보장|확정\s?수익|진입\s?시점|매매\s?추천|buy\b|sell\b|target\s?price|stop-?loss|guaranteed/i;

// Exposure detection patterns applied to the raw H route response body (booleans only, never printed).
const EXPOSURE_PATTERNS = [
  /sk-[A-Za-z0-9]{12,}/, // OpenAI-style key
  /Bearer\s+[A-Za-z0-9]/, // Authorization header value
  /"prompt"\s*:|"systemPrompt"\s*:|"userPrompt"\s*:/, // prompt fields
  /"choices"\s*:|"completion"\s*:|"usage"\s*:/, // raw OpenAI response fields
  /"rt_cd"|"stck_prpr"|"acml_vol"/, // raw KIS payload fields
  /koreainvestment/i, // KIS base URL host
];

const logSanitized = (message) => {
  console.log(message);
};

const failClosed = (reason) => {
  logSanitized(`Phase 3GG-L-FAST owner regression BLOCKED: reason=${reason} sanitized=true`);
  process.exitCode = 1;
};

function statusToClass(status) {
  if (status >= 200 && status < 300) return '2xx';
  if (status >= 300 && status < 400) return '3xx';
  if (status >= 400 && status < 500) return '4xx';
  if (status >= 500 && status < 600) return '5xx';
  return 'unknown';
}

async function probeHRouteOnce(baseUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  let rawText;
  try {
    response = await fetch(`${baseUrl}${H_ROUTE_PATH}`, { method: 'GET', headers: { accept: 'application/json' }, signal: controller.signal });
    rawText = await response.text();
  } catch (error) {
    clearTimeout(timer);
    return { reachable: false, httpStatusClass: error?.name === 'AbortError' ? 'timeout' : 'network-error' };
  }
  clearTimeout(timer);

  const httpStatusClass = statusToClass(response.status);
  const exposureDetected = EXPOSURE_PATTERNS.some((p) => p.test(rawText));

  let parsed = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { reachable: true, httpStatusClass, parseError: true, exposureDetected };
  }
  const summary = parsed && typeof parsed === 'object' ? parsed.summary ?? parsed : null;

  const summaryText = summary && typeof summary.summaryText === 'string' ? summary.summaryText : '';
  const summaryLines = summaryText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  return {
    reachable: true,
    httpStatusClass,
    exposureDetected,
    summaryOk: summary ? summary.ok === true : false,
    sourceStatus: summary && typeof summary.sourceStatus === 'string' ? summary.sourceStatus : null,
    llmStatus: summary && typeof summary.llmStatus === 'string' ? summary.llmStatus : null,
    sanitizedErrorCode: summary && typeof summary.sanitizedErrorCode === 'string' ? summary.sanitizedErrorCode : null,
    currentPricePresent: summary ? summary.currentPricePresent === true : false,
    volumePresent: summary ? summary.volumePresent === true : false,
    summaryTextPresent: summaryText.length > 0,
    summaryLineCount: summaryLines.length,
    requiredLabelsPresent: REQUIRED_SUMMARY_LABELS.every((label) => summaryText.includes(label)),
    asciiDigitPresentInSummary: /[0-9]/.test(summaryText),
    forbiddenInvestmentPhrasePresent: FORBIDDEN_INVESTMENT_PHRASE_PATTERN.test(summaryText),
  };
}

function runPasses(r) {
  return (
    r.reachable === true &&
    r.httpStatusClass === '2xx' &&
    r.summaryOk === true &&
    r.sourceStatus === 'ok' &&
    r.llmStatus === 'ok' &&
    r.summaryTextPresent === true &&
    r.summaryLineCount === 3 &&
    r.requiredLabelsPresent === true &&
    r.asciiDigitPresentInSummary === false &&
    r.forbiddenInvestmentPhrasePresent === false &&
    r.exposureDetected === false
  );
}

async function main() {
  const args = process.argv.slice(2);

  // 1. Explicit owner-approval flag required before any probe is attempted.
  if (!args.includes(OWNER_APPROVAL_FLAG)) {
    failClosed('missing-owner-approval-flag');
    return;
  }

  const baseUrlArg = args.find((a) => a.startsWith('--base-url='));
  const baseUrl = baseUrlArg ? baseUrlArg.slice('--base-url='.length) : DEFAULT_LOCAL_BASE_URL;

  const repeatArg = args.find((a) => a.startsWith('--repeat='));
  let repeat = repeatArg ? Number.parseInt(repeatArg.slice('--repeat='.length), 10) : 1;
  if (!Number.isInteger(repeat) || repeat < 1) repeat = 1;
  if (repeat > MAX_REPEAT) {
    failClosed(`repeat-above-max-${MAX_REPEAT}`);
    return;
  }

  const results = [];
  for (let i = 0; i < repeat; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await probeHRouteOnce(baseUrl));
  }

  const passCount = results.filter(runPasses).length;
  const failCount = results.length - passCount;
  const last = results[results.length - 1] ?? {};

  const anyExposure = results.some((r) => r.exposureDetected === true);
  const anyKisRegression = results.some((r) => r.reachable && (r.sourceStatus !== 'ok' || r.currentPricePresent !== true) && r.sanitizedErrorCode !== 'LLM_DISABLED' && r.sanitizedErrorCode !== 'LLM_CONFIG_MISSING');
  const anyLlmRuntime = results.some((r) => r.sanitizedErrorCode === 'LLM_DISABLED' || r.sanitizedErrorCode === 'LLM_CONFIG_MISSING');
  const anyLlmCallFailed = results.some((r) => r.sanitizedErrorCode === 'LLM_CALL_FAILED' || r.sanitizedErrorCode === 'LLM_TIMEOUT');
  const anyContractFail = results.some(
    (r) => r.summaryOk === true && (r.summaryLineCount !== 3 || r.requiredLabelsPresent !== true || r.asciiDigitPresentInSummary === true || r.forbiddenInvestmentPhrasePresent === true),
  );
  const anyUnreachable = results.some((r) => r.reachable !== true);

  let finalClassification;
  if (anyExposure) {
    finalClassification = 'BLOCKED_EXPOSURE_RISK';
  } else if (anyKisRegression) {
    finalClassification = 'BLOCKED_KIS_CURRENT_PRICE_REGRESSION';
  } else if (anyLlmRuntime) {
    finalClassification = 'BLOCKED_LLM_RUNTIME_REGRESSION';
  } else if (anyLlmCallFailed) {
    finalClassification = 'BLOCKED_LLM_CALL_FAILED';
  } else if (anyContractFail) {
    finalClassification = 'BLOCKED_SUMMARY_CONTRACT';
  } else if (passCount === results.length && results.length > 0 && !anyUnreachable) {
    finalClassification = 'PASS_LLM_QUALITY_REGRESSION';
  } else {
    finalClassification = 'STILL_BLOCKED_UNKNOWN';
  }

  const report = {
    runCount: results.length,
    passCount,
    failCount,
    hRouteReachable: last.reachable === true,
    hRouteHttpStatusClass: last.httpStatusClass ?? 'unknown',
    summaryOk: last.summaryOk === true,
    sourceStatus: last.sourceStatus ?? null,
    llmStatus: last.llmStatus ?? null,
    sanitizedErrorCode: last.sanitizedErrorCode ?? null,
    currentPricePresent: last.currentPricePresent === true,
    volumePresent: last.volumePresent === true,
    summaryTextPresent: last.summaryTextPresent === true,
    summaryLineCount: last.summaryLineCount ?? 0,
    requiredLabelsPresent: last.requiredLabelsPresent === true,
    asciiDigitPresentInSummary: last.asciiDigitPresentInSummary === true,
    forbiddenInvestmentPhrasePresent: last.forbiddenInvestmentPhrasePresent === true,
    exposureDetected: anyExposure,
    finalClassification,
  };

  logSanitized(`Phase 3GG-L-FAST owner regression REPORT: ${JSON.stringify(report)}`);

  if (finalClassification === 'PASS_LLM_QUALITY_REGRESSION') {
    logSanitized('Phase 3GG-L-FAST owner regression PASS: LLM summary quality path is stable.');
  } else {
    logSanitized(`Phase 3GG-L-FAST owner regression BLOCKED: classification=${finalClassification} sanitized=true`);
    process.exitCode = 1;
  }
}

main().catch(() => {
  logSanitized('Phase 3GG-L-FAST owner regression BLOCKED: reason=unexpected-error sanitized=true');
  process.exitCode = 1;
});
