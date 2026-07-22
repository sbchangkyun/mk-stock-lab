// Phase 3GG-I-FAST static source smoke: verifies the Chart AI owner-local LLM summary UI panel
// is wired safely, WITHOUT making any real network/KIS/OpenAI call. Reads only
// src/pages/chart-ai.astro from disk and asserts on its source text.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHART_AI_PATH = path.join(__dirname, '..', 'src', 'pages', 'chart-ai.astro');

const source = readFileSync(CHART_AI_PATH, 'utf8');

const checks = [];
const check = (name, pass) => checks.push({ name, pass: Boolean(pass) });

// 1. Panel id present, hidden by default.
check(
  'panel id present and hidden by default',
  /id="chartAiOwnerLocalKisLlmSummaryPanel"[\s\S]{0,200}hidden/.test(source),
);

// 2. Required child element ids present.
check('button id present', source.includes('id="chartAiOwnerLocalKisLlmSummaryButton"'));
check('output id present', source.includes('id="chartAiOwnerLocalKisLlmSummaryOutput"'));
check('status id present', source.includes('id="chartAiOwnerLocalKisLlmSummaryStatus"'));

// 3. Query opt-in gate present.
check('ownerLocalKisLlm=1 opt-in check present', source.includes("chartAiQuery.get('ownerLocalKisLlm') === '1'"));

// 4. Local hostname guard used for this panel's gate.
const gateBlockMatch = source.match(
  /const ownerLocalKisLlmOptIn[\s\S]{0,400}?ownerLocalKisLlmPanel\.hidden = !ownerLocalKisLlmEnabled;\s*\}/,
);
check('gate block present', Boolean(gateBlockMatch));
check('gate block uses isLocalOwnerHostname()', Boolean(gateBlockMatch && gateBlockMatch[0].includes('isLocalOwnerHostname()')));

// 5. H route path present, referencing the LLM summary route with correct query params.
const ROUTE_PATH = '/api/chart-ai/local-only-kis-llm-summary.json?ownerLocalKisLlm=1&symbol=005930';
check('H route path present', source.includes(ROUTE_PATH));

// 6. Route call occurs only inside the click handler, not at top-level page-load script scope.
const clickListenerIdx = source.indexOf("ownerLocalKisLlmSummaryButton.addEventListener('click'");
const nextSectionIdx = source.indexOf('// Owner-local auth/usage runtime bridge', clickListenerIdx);
const clickHandlerBlock =
  clickListenerIdx > -1 && nextSectionIdx > clickListenerIdx
    ? source.slice(clickListenerIdx, nextSectionIdx)
    : '';
const clickHandlerMatch = clickHandlerBlock ? [clickHandlerBlock] : null;
check('click handler block present', Boolean(clickHandlerBlock));
check('route call occurs inside the click handler', clickHandlerBlock.includes(ROUTE_PATH));
{
  // The route path also legitimately appears in explanatory comments above the panel markup
  // and above the click handler (documentation, not code) -- so only count `fetch(` calls that
  // reference this route path as the actual executable call sites.
  const fetchCallPattern = /fetch\(\s*\n\s*'\/api\/chart-ai\/local-only-kis-llm-summary\.json\?ownerLocalKisLlm=1&symbol=005930'/g;
  const fetchCallCount = (source.match(fetchCallPattern) ?? []).length;
  check('exactly one executable fetch() call site references the H route', fetchCallCount === 1);
  check(
    'that single fetch() call site is inside the click handler',
    fetchCallCount === 1 && clickHandlerBlock.match(fetchCallPattern) !== null,
  );
}

// 7. No Authorization header anywhere near the new panel's fetch call.
check(
  'no Authorization header on the fetch call',
  Boolean(clickHandlerMatch) && !clickHandlerMatch[0].includes('Authorization'),
);
check('credentials omitted on the fetch call', Boolean(clickHandlerMatch) && clickHandlerMatch[0].includes("credentials: 'omit'"));

// 8. No credential-like tokens anywhere in the new panel's code (heuristic scan of the whole
// file already covered by the contract checker's forbidden-diff check; here we scan just the
// click handler block for defense in depth).
const CREDENTIAL_PATTERN = /KIS_APP_KEY|KIS_APP_SECRET|OPENAI_API_KEY|appsecret|appkey|Bearer\s|access_token/i;
check(
  'no credential token inside the click handler block',
  Boolean(clickHandlerMatch) && !CREDENTIAL_PATTERN.test(clickHandlerMatch[0]),
);

// 9. No prompt text rendered.
check('no "prompt" field ever rendered', !/summary\.prompt\b/.test(source));

// 10. No raw OpenAI response rendered (no direct rendering of output/usage/model raw fields).
check(
  'no raw OpenAI response field ever rendered',
  !/summary\.output\b|summary\.usage\b|parsedResponse\.output\b|parsedResponse\.usage\b/.test(source),
);

// 11. No currentPrice numeric value rendered in the new panel (only the *Present boolean
// fields).
{
  const panelSectionMatch = source.match(
    /<section\s+id="chartAiOwnerLocalKisLlmSummaryPanel"[\s\S]*?<\/section>/,
  );
  const rendererMatch = source.match(
    /const renderOwnerLocalKisLlmSummarySuccess[\s\S]*?\n {6}\};/,
  );
  const combined = `${panelSectionMatch ? panelSectionMatch[0] : ''}${rendererMatch ? rendererMatch[0] : ''}`;
  check('panel markup found for currentPrice scan', Boolean(panelSectionMatch));
  check('renderer function found for currentPrice scan', Boolean(rendererMatch));
  check(
    'no summary.currentPrice numeric value rendered in the new panel',
    !/summary\.currentPrice\b(?!Present)/.test(combined),
  );
}

// 12. Required Korean safety copy present.
const REQUIRED_KOREAN_PHRASES = [
  '로컬 전용 KIS + LLM 요약',
  '소유자 로컬 테스트 전용',
  '페이지 로드시 자동 실행되지 않습니다.',
  '버튼 클릭 시에만 현재가 기반 요약을 요청합니다.',
  '투자 자문이 아니며 매수·매도 추천을 제공하지 않습니다.',
];
for (const phrase of REQUIRED_KOREAN_PHRASES) {
  check(`required Korean copy present: "${phrase}"`, source.includes(phrase));
}

// 13. Blocked/diagnostics output uses only the UI-allowlisted diagnostic field names.
check(
  'UI diagnostics allowlist restricted to httpStatus/openAiErrorMessageClass/responseShapeKind/outputTextPresent',
  source.includes('OWNER_LOCAL_KIS_LLM_SUMMARY_DIAGNOSTICS_UI_ALLOWLIST') &&
    /OWNER_LOCAL_KIS_LLM_SUMMARY_DIAGNOSTICS_UI_ALLOWLIST = \[\s*'httpStatus',\s*'openAiErrorMessageClass',\s*'responseShapeKind',\s*'outputTextPresent',\s*\]/.test(
      source,
    ),
);
check(
  'diagnostics allowlist excludes openAiErrorType/openAiErrorCode/openAiErrorParam',
  !/OWNER_LOCAL_KIS_LLM_SUMMARY_DIAGNOSTICS_UI_ALLOWLIST[\s\S]{0,200}(openAiErrorType|openAiErrorCode|openAiErrorParam)/.test(
    source,
  ),
);

// 14. No forbidden endpoint expansion: no order/account/balance/funds/portfolio/trading/personal
// route calls introduced by this panel.
const FORBIDDEN_ENDPOINT_TERMS = /\/api\/[^"'\s]*(order|account|balance|funds|portfolio|trading|personal)[^"'\s]*/i;
check('no forbidden endpoint route call introduced', !FORBIDDEN_ENDPOINT_TERMS.test(source));

// 15. No Supabase/auth/session/JWT/cookie requirement added for this panel's gate.
check(
  'gate block does not require Supabase/session/JWT/cookie',
  Boolean(gateBlockMatch) &&
    !/supabase|session|jwt|cookie/i.test(gateBlockMatch[0]),
);

const failed = checks.filter((c) => !c.pass);
for (const c of checks) {
  console.log(`${c.pass ? 'PASS' : 'FAIL'} - ${c.name}`);
}

if (failed.length > 0) {
  console.log(`\nPhase 3GG-I-FAST UI wiring smoke FAILED: ${failed.length}/${checks.length} checks failed.`);
  process.exitCode = 1;
} else {
  console.log(`\nPhase 3GG-I-FAST UI wiring smoke PASS: ${checks.length}/${checks.length} checks passed.`);
}
