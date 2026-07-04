/**
 * Static contract checker for Phase 3FB-D (Chart AI Owner-local Mocked UI Runtime Polish and
 * Failure-state Hardening).
 *
 * Inspects `src/pages/chart-ai.astro` as raw text (no build, no dev server, no browser) and
 * asserts the local-only owner-local mocked panel introduced in Phase 3FB-C still has its
 * gating, request contract, and endpoint scope intact, and that the runtime hardening added in
 * this phase (response shape guard, AbortController timeout, repeated-click prevention,
 * aria-busy loading state, safe rendering, no raw error/JSON leakage) is present. This is a
 * focused checker (a bounded assertion list), not a full historical checker suite.
 *
 * Run:
 *   npm run check:phase-3fb-d-chart-ai-owner-local-mocked-ui-runtime-polish
 */

import { readFileSync } from 'node:fs';

const filePath = 'src/pages/chart-ai.astro';
const source = readFileSync(filePath, 'utf8');

const failures = [];
let assertionCount = 0;

const assertTrue = (condition, message) => {
  assertionCount += 1;
  if (!condition) failures.push(message);
};

const assertMatch = (pattern, message) => {
  assertTrue(pattern.test(source), message);
};

const assertNotMatch = (pattern, message) => {
  assertTrue(!pattern.test(source), message);
};

const indexOfPattern = (pattern) => {
  const match = source.match(pattern);
  return match ? match.index : -1;
};

// --- Gate preservation (must remain intact from Phase 3FB-C) --------------------------------

assertMatch(
  /id="chartAiOwnerLocalMockedPanel"/,
  'Owner-local mocked panel element must still exist with id="chartAiOwnerLocalMockedPanel"',
);
assertMatch(
  /id="chartAiOwnerLocalMockedPanel"[\s\S]{0,120}hidden/,
  'Owner-local mocked panel must still be hidden by default in the static markup',
);
assertTrue(
  /hostname === 'localhost'/.test(source) && /hostname === '127\.0\.0\.1'/.test(source) && /hostname === '::1'/.test(source),
  "Local hostname gate must still check for 'localhost', '127.0.0.1', and '::1'",
);
assertMatch(
  /isLocalOwnerHostname\s*=\s*\(\)\s*:\s*boolean\s*=>/,
  'The dedicated local-hostname-check function must still exist',
);
assertMatch(
  /URLSearchParams\(window\.location\.search\)\.get\('ownerLocalMocked'\)\s*===\s*'1'/,
  "URL query opt-in gate must still check ownerLocalMocked === '1'",
);
assertMatch(
  /ownerLocalMockedEnabled\s*=\s*isLocalOwnerHostname\(\)\s*&&\s*ownerLocalMockedOptIn/,
  'Panel enablement must still require BOTH the local hostname gate AND the query opt-in gate',
);
assertMatch(
  /ownerLocalMockedPanel\.hidden\s*=\s*!ownerLocalMockedEnabled/,
  'Panel visibility must still be toggled based on the combined gate result',
);

const clickListenerIndex = indexOfPattern(/ownerLocalMockedRunBtn\.addEventListener\('click'/);
const fetchCallIndex = indexOfPattern(/fetch\('\/api\/chart-ai\/similarity'/);
assertTrue(clickListenerIndex !== -1, 'Owner-local mocked run button must still register a click listener');
assertTrue(fetchCallIndex !== -1, "A fetch call to '/api/chart-ai/similarity' must still exist");
assertTrue(
  clickListenerIndex !== -1 && fetchCallIndex !== -1 && clickListenerIndex < fetchCallIndex,
  'The fetch call must remain inside the click listener, confirming no auto-run on page load',
);
assertMatch(
  /if\s*\(ownerLocalMockedRunBtn\s*&&\s*ownerLocalMockedEnabled\)\s*\{\s*\n\s*ownerLocalMockedRunBtn\.addEventListener\('click'/,
  'The click listener must still only be registered when the panel is gate-enabled',
);

// --- Request preservation ---------------------------------------------------------------------

assertMatch(
  /fetch\('\/api\/chart-ai\/similarity',\s*\{/,
  'Owner-local mocked panel must still call POST /api/chart-ai/similarity',
);
assertMatch(/method:\s*'POST'/, 'Request must still use method POST');
assertMatch(
  /'Content-Type':\s*'application\/json'/,
  'Request must still set Content-Type: application/json',
);
assertMatch(/mode:\s*'owner-local-mocked'/, "Request body must still include mode: 'owner-local-mocked'");
assertMatch(
  /source:\s*'mocked-provider-compatible'/,
  "Request body must still include source: 'mocked-provider-compatible'",
);
assertMatch(/ownerLocalMocked:\s*true/, 'Request body must still include ownerLocalMocked: true');
assertMatch(
  /symbol:\s*selectedSymbol\s*\|\|\s*'MOCKSYM'/,
  "Request body must still use the current selected symbol with a deterministic safe fallback ('MOCKSYM')",
);

const ownerLocalMockedHandlerMatch = source.match(
  /ownerLocalMockedRunBtn\.addEventListener\('click',\s*async\s*\(\)\s*=>\s*\{[\s\S]*?\n\s{8}\}\);/,
);
assertTrue(
  ownerLocalMockedHandlerMatch !== null,
  'Owner-local mocked click handler body must be extractable for isolated inspection',
);
const handlerBody = ownerLocalMockedHandlerMatch ? ownerLocalMockedHandlerMatch[0] : '';
assertTrue(
  (handlerBody.match(/fetch\(/g) || []).length === 1,
  'Owner-local mocked click handler must call fetch exactly once',
);
assertTrue(
  !/owner-local-quote-preview|owner-local-ohlc-preview/.test(handlerBody),
  'Owner-local mocked click handler must not call the KIS owner-local preview endpoints',
);

// --- Runtime hardening: timeout / abort -------------------------------------------------------

assertMatch(/new AbortController\(\)/, 'An AbortController must be created for the owner-local mocked request');
assertMatch(
  /OWNER_LOCAL_MOCKED_TIMEOUT_MS\s*=\s*8000/,
  'A deterministic 8000ms timeout constant must exist',
);
assertMatch(
  /window\.setTimeout\(\(\)\s*=>\s*abortController\.abort\(\),\s*OWNER_LOCAL_MOCKED_TIMEOUT_MS\)/,
  'The timeout must abort the in-flight request via the AbortController',
);
assertMatch(
  /signal:\s*abortController\.signal/,
  'The fetch call must pass the AbortController signal',
);
assertTrue(
  /finally\s*\{[\s\S]*?window\.clearTimeout\(timeoutId\)/.test(handlerBody),
  'The timeout must be cleared in a finally block',
);
assertMatch(
  /thrownError instanceof DOMException\s*&&\s*thrownError\.name === 'AbortError'/,
  'The catch block must distinguish an AbortError (timeout) from other failures',
);
assertMatch(
  /요청 시간이 초과되었습니다/,
  'A safe, static Korean timeout message must exist',
);

// --- Runtime hardening: repeated-click / stale-state prevention -------------------------------

assertMatch(
  /let ownerLocalMockedRequestInFlight\s*=\s*false/,
  'An in-flight request flag must exist to prevent duplicate concurrent requests',
);
assertTrue(
  /if\s*\(ownerLocalMockedRequestInFlight\)\s*return;/.test(handlerBody),
  'The click handler must return early if a request is already in flight',
);
assertTrue(
  /ownerLocalMockedRequestInFlight\s*=\s*true/.test(handlerBody),
  'The click handler must mark the in-flight flag true before starting the request',
);
assertTrue(
  /finally\s*\{[\s\S]*?ownerLocalMockedRequestInFlight\s*=\s*false/.test(handlerBody),
  'The click handler must reset the in-flight flag to false in a finally block (never stuck loading)',
);
assertTrue(
  /ownerLocalMockedRunBtn\.disabled\s*=\s*true/.test(handlerBody),
  'The run button must be disabled while the request is loading',
);
assertTrue(
  /finally\s*\{[\s\S]*?ownerLocalMockedRunBtn\.disabled\s*=\s*false/.test(handlerBody),
  'The run button must be re-enabled after completion (retry-ready), regardless of outcome',
);
assertMatch(
  /다시 실행/,
  'The run button must offer a retry-ready label ("다시 실행") after a request completes',
);

// --- Accessibility: aria-busy -------------------------------------------------------------------

assertTrue(
  /setAttribute\('aria-busy',\s*'true'\)/.test(handlerBody),
  'The result container must be marked aria-busy="true" while loading',
);
assertTrue(
  /finally\s*\{[\s\S]*?removeAttribute\('aria-busy'\)/.test(handlerBody),
  'The result container aria-busy attribute must be cleared in a finally block',
);
assertMatch(
  /aria-live="polite"/,
  'The result container must keep an aria-live="polite" region for screen-reader announcements',
);
assertMatch(
  /ownerLocalMockedResult\.tabIndex\s*=\s*-1/,
  'The result container must be made programmatically focusable for lightweight focus handling',
);

// --- Response shape guard -----------------------------------------------------------------------

assertMatch(
  /isOwnerLocalMockedSuccessResponse\s*=\s*\(value:\s*unknown\)\s*:\s*value is OwnerLocalMockedSuccessResponse\s*=>/,
  'A dedicated response shape guard function must exist',
);
assertTrue(
  /record\.ok !== true/.test(source) && /record\.status !== 'success'/.test(source) && /record\.mode !== 'owner-local-mocked'/.test(source),
  "The guard must check ok === true, status === 'success', and mode === 'owner-local-mocked'",
);
assertMatch(
  /source !== 'mocked-provider-compatible'/,
  "The guard must check request.source === 'mocked-provider-compatible'",
);
assertTrue(
  /typeof resultData\.engineStatus !== 'string'/.test(source) &&
    /typeof resultData\.normalizedBarsAvailable !== 'boolean'/.test(source) &&
    /typeof resultData\.normalizedBarCountBucket !== 'string'/.test(source) &&
    /typeof resultData\.matchCountBucket !== 'string'/.test(source),
  'The guard must check engineStatus/normalizedBarCountBucket/matchCountBucket are strings and normalizedBarsAvailable is a boolean',
);
assertTrue(
  /resultData\.dataPolicy \|\| typeof resultData\.dataPolicy !== 'object'/.test(source) &&
    /typeof resultData\.disclaimer !== 'string'/.test(source),
  'The guard must check data.dataPolicy exists and data.disclaimer is a string',
);
assertTrue(
  /isOwnerLocalMockedSuccessResponse\(parsedResponse\)\)\s*\{\s*\n\s*renderOwnerLocalMockedSuccess\(parsedResponse\)/.test(handlerBody),
  'renderOwnerLocalMockedSuccess must only be called after the response shape guard validates the parsed response',
);

// --- Malformed / non-success / feature-disabled handling ----------------------------------------

assertTrue(
  /let parsedResponse: unknown = null;[\s\S]*?catch\s*\{\s*\n\s*parsedResponse = null;/.test(handlerBody),
  'A malformed (non-JSON) response body must be handled safely and fall through to the guard-failure path',
);
assertTrue(
  /else\s*\{\s*\n\s*showOwnerLocalMockedMessage\('Owner-local mocked 실행 결과를 불러오지 못했습니다\./.test(handlerBody),
  'A non-success or malformed response must render a safe static feature-disabled/error message',
);

// --- No raw error / no raw JSON rendering --------------------------------------------------------

assertNotMatch(
  /showOwnerLocalMockedMessage\(\s*(String\(|thrownError|err\.message|error\.message)/,
  'The UI must never render a raw thrown error message',
);
assertNotMatch(
  /showOwnerLocalMockedMessage\(\s*JSON\.stringify/,
  'The UI must never render raw JSON as a message',
);
assertNotMatch(
  /ownerLocalMockedResult\.innerHTML/,
  'The owner-local mocked result container must never be assigned via innerHTML',
);
assertNotMatch(
  /\.innerHTML\s*=\s*(parsedResponse|resultData|data)\b/,
  'Response-derived values must never be injected as innerHTML',
);

// --- Safe rendering: response-derived fields use textContent -------------------------------------

assertMatch(/resultData\.engineStatus/, 'UI must still render data.engineStatus');
assertMatch(/resultData\.normalizedBarsAvailable/, 'UI must still render data.normalizedBarsAvailable');
assertMatch(/resultData\.normalizedBarCountBucket/, 'UI must still render data.normalizedBarCountBucket');
assertMatch(/resultData\.matchCountBucket/, 'UI must still render data.matchCountBucket');
assertMatch(/resultData\.dataPolicy/, 'UI must still render data.dataPolicy');
assertMatch(/resultData\.disclaimer/, 'UI must still render the disclaimer text returned by the API');
assertTrue(
  /dt\.textContent = label;/.test(source) && /dd\.textContent = value;/.test(source),
  'Summary labels and values must be assigned via textContent, not innerHTML',
);
assertTrue(
  /message\.textContent = text;/.test(source) && /disclaimer\.textContent = resultData\.disclaimer;/.test(source),
  'Status/error messages and the disclaimer must be assigned via textContent, not innerHTML',
);

// --- Fields intentionally NOT rendered ------------------------------------------------------------

assertNotMatch(
  /resultData\.matches\b|resultData\.similarityScore/,
  'UI must not render a raw matches array or raw similarity scores from the owner-local mocked response',
);
assertNotMatch(
  /resultData\.ohlc|resultData\.volume|resultData\.forwardReturn|resultData\.timestamp/i,
  'UI must not render raw OHLC values, volume, forward returns, or timestamps',
);

// --- Forbidden content: no live/auto source markers, no credentials, no restricted APIs ----------

assertNotMatch(
  /source:\s*['"]live['"]|source:\s*['"]auto['"]/,
  'File must not set request source to "live" or "auto"',
);
assertNotMatch(/process\.env/, 'File must never read process.env');
assertNotMatch(
  /KIS_APP_KEY|KIS_APP_SECRET|KIS_BASE_URL|accessToken|appSecret|appKey/i,
  'File must never reference raw KIS credential env names or provider credential fields',
);
assertNotMatch(
  /\baccount\b|\btrading\b|\bbalance\b|\bcredential\b|\btoken\b/i,
  'File must never reference account/trading/balance/credential/token fields',
);

// --- Boundary: no engine/provider source touched from this panel's script ------------------------

assertNotMatch(
  /import[^\n]*from ['"]\.\.\/lib\/server\/providers/,
  'chart-ai.astro must not import KIS provider server modules directly',
);
const ownerLocalMockedSectionStart = indexOfPattern(/const ownerLocalMockedPanel = document\.getElementById/);
const ownerLocalMockedSection = ownerLocalMockedSectionStart !== -1 ? source.slice(ownerLocalMockedSectionStart) : '';
assertTrue(
  ownerLocalMockedSectionStart !== -1 && !/scanSimilarity\(/.test(ownerLocalMockedSection),
  'The owner-local mocked panel script must not call the deterministic engine (scanSimilarity) directly from the UI — it must go through the API route',
);

if (failures.length > 0) {
  process.stdout.write(`Phase 3FB-D checker: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
  for (const failure of failures) {
    process.stdout.write(`  - ${failure}\n`);
  }
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3FB-D checker: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  process.exitCode = 0;
}
