// Phase 3GG-K-ENV-HF6 owner-gated LLM runtime-env readiness diagnostic.
//
// Verifies whether the owner-local KIS + LLM summary H route reaches LLM runtime readiness. Requires
// the explicit CLI flag --owner-approved-llm-runtime-env-diagnostic; without it, nothing runs.
//
// This diagnostic probes ONLY the existing owner-local H route over localhost
// (GET /api/chart-ai/local-only-kis-llm-summary.json?ownerLocalKisLlm=1&symbol=005930). It makes no
// direct OpenAI call and no direct KIS call. It never reads .env/.env.local directly, never prints a
// process.env or import.meta.env value directly, never prints OPENAI_API_KEY, a model name, a
// prompt, a raw OpenAI request/response, a raw KIS payload, or a currentPrice/volume numeric value.
// current_price is the only KIS market-data category touched (indirectly, through the H route). No
// order/account/balance/funds/portfolio/trading/personal endpoint is ever contacted.

const OWNER_APPROVAL_FLAG = '--owner-approved-llm-runtime-env-diagnostic';
const DEFAULT_LOCAL_BASE_URL = 'http://localhost:4321';
const H_ROUTE_PATH = '/api/chart-ai/local-only-kis-llm-summary.json?ownerLocalKisLlm=1&symbol=005930';
const REQUEST_TIMEOUT_MS = 15000;

const REQUIRED_SUMMARY_LABELS = ['데이터 상태:', '해석 범위:', '유의사항:'];

// Conservative forbidden investment-advice phrase detection (Korean + English), booleans only.
const FORBIDDEN_INVESTMENT_PHRASE_PATTERN =
  /매수|매도|목표가|목표\s?가격|손절|보장|확정\s?수익|진입\s?시점|매매\s?추천|buy\b|sell\b|target\s?price|stop-?loss|guaranteed/i;

const logSanitized = (message) => {
  console.log(message);
};

const failClosed = (reason) => {
  logSanitized(`Phase 3GG-K-ENV-HF6 owner diagnostic BLOCKED: reason=${reason} sanitized=true`);
  process.exitCode = 1;
};

function classifyHttpErrorFromCatch(error) {
  if (error?.name === 'AbortError') return 'timeout';
  const code = String(error?.cause?.code || error?.code || '');
  if (code) return 'network-error';
  return 'unknown';
}

function statusToClass(status) {
  if (status >= 200 && status < 300) return '2xx';
  if (status >= 300 && status < 400) return '3xx';
  if (status >= 400 && status < 500) return '4xx';
  if (status >= 500 && status < 600) return '5xx';
  return 'unknown';
}

async function checkLocalServerReachable(baseUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}/`, { method: 'GET', signal: controller.signal });
    clearTimeout(timer);
    return response.status > 0;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

async function probeHRoute(baseUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  let rawText;
  try {
    response = await fetch(`${baseUrl}${H_ROUTE_PATH}`, { method: 'GET', headers: { accept: 'application/json' }, signal: controller.signal });
    rawText = await response.text();
  } catch (error) {
    clearTimeout(timer);
    return { reachable: false, httpStatusClass: classifyHttpErrorFromCatch(error) };
  }
  clearTimeout(timer);

  const httpStatusClass = statusToClass(response.status);
  let parsed = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { reachable: true, httpStatusClass, parseError: true };
  }
  return { reachable: true, httpStatusClass, parsed };
}

async function main() {
  const args = process.argv.slice(2);

  // 1. Explicit owner-approval flag required before any route probe is attempted.
  if (!args.includes(OWNER_APPROVAL_FLAG)) {
    failClosed('missing-owner-approval-flag');
    return;
  }

  const baseUrlArg = args.find((a) => a.startsWith('--base-url='));
  const localBaseUrl = baseUrlArg ? baseUrlArg.slice('--base-url='.length) : DEFAULT_LOCAL_BASE_URL;

  // 2. Local dev server + H route reachability.
  const localDevServerReachable = await checkLocalServerReachable(localBaseUrl);
  const probe = await probeHRoute(localBaseUrl);
  const hRouteReachable = probe.reachable === true;
  const hRouteHttpStatusClass = probe.httpStatusClass ?? 'unknown';

  // 3. Extract only sanitized fields from the H route summary object.
  const summary = probe.parsed && typeof probe.parsed === 'object' ? probe.parsed.summary ?? probe.parsed : null;

  const summaryOk = summary ? summary.ok === true : false;
  const sourceStatus = summary && typeof summary.sourceStatus === 'string' ? summary.sourceStatus : null;
  const llmStatus = summary && typeof summary.llmStatus === 'string' ? summary.llmStatus : null;
  const sanitizedErrorCode = summary && typeof summary.sanitizedErrorCode === 'string' ? summary.sanitizedErrorCode : null;
  const currentPricePresent = summary ? summary.currentPricePresent === true : false;
  const volumePresent = summary ? summary.volumePresent === true : false;

  const summaryText = summary && typeof summary.summaryText === 'string' ? summary.summaryText : '';
  const summaryTextPresent = summaryText.length > 0;
  const summaryLines = summaryText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const summaryLineCount = summaryLines.length;
  const requiredLabelsPresent = REQUIRED_SUMMARY_LABELS.every((label) => summaryText.includes(label));
  const asciiDigitPresentInSummary = /[0-9]/.test(summaryText);
  const forbiddenInvestmentPhrasePresent = FORBIDDEN_INVESTMENT_PHRASE_PATTERN.test(summaryText);

  const llmDisabled = sanitizedErrorCode === 'LLM_DISABLED';
  const llmCallFailed = sanitizedErrorCode === 'LLM_CALL_FAILED' || sanitizedErrorCode === 'LLM_TIMEOUT';

  // 4. LLM env evidence classification (coarse buckets only).
  let llmEnvEvidenceKind;
  if (summaryOk && llmStatus === 'ok' && summaryTextPresent) {
    const contractOk = requiredLabelsPresent && summaryLineCount === 3 && !asciiDigitPresentInSummary && !forbiddenInvestmentPhrasePresent;
    llmEnvEvidenceKind = contractOk ? 'route-ready' : 'llm-summary-contract-failed';
  } else if (llmDisabled) {
    llmEnvEvidenceKind = 'llm-disabled';
  } else if (sanitizedErrorCode === 'LLM_CONFIG_MISSING') {
    llmEnvEvidenceKind = 'llm-config-missing';
  } else if (llmCallFailed) {
    llmEnvEvidenceKind = 'llm-call-failed';
  } else if (sanitizedErrorCode === 'FORBIDDEN_LANGUAGE_DETECTED' || sanitizedErrorCode === 'FORBIDDEN_NUMERIC_OUTPUT_DETECTED' || sanitizedErrorCode === 'EMPTY_LLM_OUTPUT') {
    llmEnvEvidenceKind = 'llm-summary-contract-failed';
  } else {
    llmEnvEvidenceKind = 'unknown';
  }

  // A runtime-env mismatch is "suspected" whenever the route reports LLM_DISABLED: the KIS side works
  // (proving the runtime is otherwise healthy), so a disabled flag most likely means the LLM enable
  // flag is visible only via import.meta.env (.env), not process.env, the same class HF5 fixed.
  const suspectedRuntimeEnvMismatch = llmDisabled;

  // 5. Final classification.
  let finalClassification;
  if (!localDevServerReachable || !hRouteReachable) {
    finalClassification = 'STILL_BLOCKED_UNKNOWN';
  } else if (sourceStatus !== 'ok' || !currentPricePresent) {
    finalClassification = 'BLOCKED_KIS_CURRENT_PRICE_REGRESSION';
  } else if (llmEnvEvidenceKind === 'route-ready') {
    finalClassification = 'FIXED_LLM_RUNTIME_ENV_READY';
  } else if (llmEnvEvidenceKind === 'llm-summary-contract-failed') {
    finalClassification = 'BLOCKED_SUMMARY_CONTRACT';
  } else if (llmEnvEvidenceKind === 'llm-disabled') {
    finalClassification = 'BLOCKED_LLM_ENV_NOT_CONFIGURED';
  } else if (llmEnvEvidenceKind === 'llm-config-missing') {
    finalClassification = 'BLOCKED_LLM_ENV_NOT_CONFIGURED';
  } else if (llmEnvEvidenceKind === 'llm-call-failed') {
    finalClassification = 'BLOCKED_LLM_CALL_FAILED';
  } else {
    finalClassification = 'STILL_BLOCKED_UNKNOWN';
  }

  // 6. Print only safe booleans/enums -- never a raw env value, key, model name, prompt, or numeric.
  const report = {
    localDevServerReachable,
    hRouteReachable,
    hRouteHttpStatusClass,
    summaryOk,
    sourceStatus,
    llmStatus,
    sanitizedErrorCode,
    currentPricePresent,
    volumePresent,
    summaryTextPresent,
    summaryLineCount,
    requiredLabelsPresent,
    asciiDigitPresentInSummary,
    forbiddenInvestmentPhrasePresent,
    llmDisabled,
    llmCallFailed,
    llmEnvEvidenceKind,
    suspectedRuntimeEnvMismatch,
    finalClassification,
  };

  logSanitized(`Phase 3GG-K-ENV-HF6 owner diagnostic REPORT: ${JSON.stringify(report)}`);

  if (finalClassification === 'FIXED_LLM_RUNTIME_ENV_READY') {
    logSanitized('Phase 3GG-K-ENV-HF6 owner diagnostic PASS: owner-local LLM summary path is ready.');
  } else {
    logSanitized(`Phase 3GG-K-ENV-HF6 owner diagnostic BLOCKED: classification=${finalClassification} sanitized=true`);
    process.exitCode = 1;
  }
}

main().catch(() => {
  logSanitized('Phase 3GG-K-ENV-HF6 owner diagnostic BLOCKED: reason=unexpected-error sanitized=true');
  process.exitCode = 1;
});
