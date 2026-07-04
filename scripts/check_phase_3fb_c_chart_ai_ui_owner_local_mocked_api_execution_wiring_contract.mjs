/**
 * Static contract checker for Phase 3FB-C (Chart AI UI Owner-local Mocked API Execution Wiring).
 *
 * Inspects `src/pages/chart-ai.astro` as raw text (no build, no dev server, no browser) and
 * asserts the local-only owner-local mocked panel is wired correctly: hidden by default,
 * gated by both a local hostname check and an explicit `?ownerLocalMocked=1` query opt-in,
 * never auto-run, calls only the existing owner-local mocked branch of
 * `/api/chart-ai/similarity` with the exact required request body, renders only sanitized
 * bucketed fields, and never leaks raw provider payload, credentials, or forbidden identifiers.
 * This is a focused checker (a bounded assertion list), not a full historical checker suite.
 *
 * Run:
 *   npm run check:phase-3fb-c-chart-ai-ui-owner-local-mocked-api-execution-wiring
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

// --- Panel presence and default-hidden state ---------------------------------------------

assertMatch(
  /id="chartAiOwnerLocalMockedPanel"/,
  'Owner-local mocked panel element must exist with id="chartAiOwnerLocalMockedPanel"',
);
assertMatch(
  /id="chartAiOwnerLocalMockedPanel"[\s\S]{0,120}hidden/,
  'Owner-local mocked panel must be hidden by default in the static markup',
);
assertMatch(
  /id="chartAiOwnerLocalMockedRunBtn"/,
  'Explicit owner-local mocked run button must exist with id="chartAiOwnerLocalMockedRunBtn"',
);
const ownerLocalMockedButtonTagMatch = source.match(/<button[^>]*id="chartAiOwnerLocalMockedRunBtn"[^>]*>/);
assertTrue(
  ownerLocalMockedButtonTagMatch !== null && /type="button"/.test(ownerLocalMockedButtonTagMatch[0]),
  'Owner-local mocked run button must be type="button" (not a form submit)',
);
assertMatch(
  /id="chartAiOwnerLocalMockedResult"/,
  'Owner-local mocked result container must exist with id="chartAiOwnerLocalMockedResult"',
);

// --- Local hostname gate -------------------------------------------------------------------

assertMatch(/hostname === 'localhost'/, "Local hostname gate must check for 'localhost'");
assertMatch(/hostname === '127\.0\.0\.1'/, "Local hostname gate must check for '127.0.0.1'");
assertMatch(/hostname === '::1'/, "Local hostname gate must check for '::1'");
assertMatch(
  /isLocalOwnerHostname\s*=\s*\(\)\s*:\s*boolean\s*=>/,
  'A dedicated local-hostname-check function must exist',
);

// --- URL query opt-in gate -----------------------------------------------------------------

assertMatch(
  /URLSearchParams\(window\.location\.search\)\.get\('ownerLocalMocked'\)\s*===\s*'1'/,
  "URL query opt-in gate must check ownerLocalMocked === '1'",
);
assertMatch(
  /ownerLocalMockedEnabled\s*=\s*isLocalOwnerHostname\(\)\s*&&\s*ownerLocalMockedOptIn/,
  'Panel enablement must require BOTH the local hostname gate AND the query opt-in gate',
);
assertMatch(
  /ownerLocalMockedPanel\.hidden\s*=\s*!ownerLocalMockedEnabled/,
  'Panel visibility must be toggled based on the combined gate result',
);

// --- No auto-run on page load ----------------------------------------------------------------

const clickListenerIndex = indexOfPattern(/ownerLocalMockedRunBtn\.addEventListener\('click'/);
const fetchCallIndex = indexOfPattern(/fetch\('\/api\/chart-ai\/similarity'/);

assertTrue(clickListenerIndex !== -1, 'Owner-local mocked run button must register a click listener');
assertTrue(fetchCallIndex !== -1, "A fetch call to '/api/chart-ai/similarity' must exist");
assertTrue(
  clickListenerIndex !== -1 && fetchCallIndex !== -1 && clickListenerIndex < fetchCallIndex,
  'The fetch call must be located inside the click listener (click registration must precede the fetch call in source), confirming no auto-run on page load',
);
assertMatch(
  /if\s*\(ownerLocalMockedRunBtn\s*&&\s*ownerLocalMockedEnabled\)\s*\{\s*\n\s*ownerLocalMockedRunBtn\.addEventListener\('click'/,
  'The click listener must only be registered when the panel is gate-enabled',
);

// --- Fetch target and request body ----------------------------------------------------------

assertMatch(
  /fetch\('\/api\/chart-ai\/similarity',\s*\{/,
  'Owner-local mocked panel must call POST /api/chart-ai/similarity',
);
assertMatch(/method:\s*'POST'/, 'Request must use method POST');
assertMatch(
  /'Content-Type':\s*'application\/json'/,
  'Request must set Content-Type: application/json',
);
assertMatch(
  /mode:\s*'owner-local-mocked'/,
  "Request body must include mode: 'owner-local-mocked'",
);
assertMatch(
  /source:\s*'mocked-provider-compatible'/,
  "Request body must include source: 'mocked-provider-compatible'",
);
assertMatch(
  /ownerLocalMocked:\s*true/,
  'Request body must include ownerLocalMocked: true',
);
assertMatch(
  /symbol:\s*selectedSymbol\s*\|\|\s*'MOCKSYM'/,
  "Request body must use the current selected symbol with a deterministic safe fallback ('MOCKSYM')",
);

// --- No other endpoint called from this panel's handler --------------------------------------

const ownerLocalMockedHandlerMatch = source.match(
  /ownerLocalMockedRunBtn\.addEventListener\('click',\s*async\s*\(\)\s*=>\s*\{[\s\S]*?\n\s{8}\}\);/,
);
assertTrue(ownerLocalMockedHandlerMatch !== null, 'Owner-local mocked click handler body must be extractable for isolated inspection');
const handlerBody = ownerLocalMockedHandlerMatch ? ownerLocalMockedHandlerMatch[0] : '';
assertTrue(
  (handlerBody.match(/fetch\(/g) || []).length === 1,
  'Owner-local mocked click handler must call fetch exactly once',
);
assertTrue(
  !/owner-local-quote-preview|owner-local-ohlc-preview/.test(handlerBody),
  'Owner-local mocked click handler must not call the KIS owner-local preview endpoints',
);

// --- Sanitized response rendering -------------------------------------------------------------

assertMatch(/resultData\.engineStatus/, 'UI must render data.engineStatus');
assertMatch(/resultData\.normalizedBarsAvailable/, 'UI must render data.normalizedBarsAvailable');
assertMatch(/resultData\.normalizedBarCountBucket/, 'UI must render data.normalizedBarCountBucket');
assertMatch(/resultData\.matchCountBucket/, 'UI must render data.matchCountBucket');
assertMatch(/resultData\.dataPolicy/, 'UI must render data.dataPolicy');
assertMatch(/resultData\.disclaimer/, 'UI must render the disclaimer text returned by the API');

// --- Fields intentionally NOT rendered ---------------------------------------------------------

assertNotMatch(/resultData\.matches\b/, 'UI must not render a raw matches array from the owner-local mocked response');
assertNotMatch(/resultData\.similarityScore/, 'UI must not render raw similarity scores');
assertNotMatch(/resultData\.ohlc/i, 'UI must not render raw OHLC values');
assertNotMatch(/resultData\.volume/i, 'UI must not render raw volume values');

// --- UI copy: local-dev-only, mocked/sample, no live KIS claim ---------------------------------

assertMatch(/로컬 개발 검증용/, 'Panel must state this is for local development verification only');
assertMatch(
  /실제 KIS 데이터가 아닌 mocked\/sample 데이터입니다\./,
  'Panel must state the data is mocked/sample, not real KIS data (no live KIS claim)',
);
assertMatch(
  /실서비스 인증·사용량·실시간 시세 연동 전 단계입니다\./,
  'Panel must state this precedes real auth/usage/live-quote integration',
);
assertMatch(/Owner-local mocked 실행/, 'Panel must use the literal label "Owner-local mocked 실행"');

// --- Forbidden content: no live/auto source markers, no credentials, no restricted APIs --------

assertNotMatch(/source:\s*['"]live['"]/, 'File must not set request source to "live"');
assertNotMatch(/source:\s*['"]auto['"]/, 'File must not set request source to "auto"');
assertNotMatch(/process\.env/, 'File must never read process.env');
assertNotMatch(/KIS_APP_KEY|KIS_APP_SECRET|KIS_BASE_URL/, 'File must never reference raw KIS credential env names');
assertNotMatch(/accessToken|appSecret|appKey/i, 'File must never reference raw provider credential fields');
assertNotMatch(/\baccount\b|\btrading\b|\bbalance\b/i, 'File must never reference account/trading/balance fields');
assertNotMatch(/\bcredential\b|\btoken\b/i, 'File must never reference credential/token fields');

// --- No unrelated boundary violations ------------------------------------------------------------

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
  process.stdout.write(`Phase 3FB-C checker: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
  for (const failure of failures) {
    process.stdout.write(`  - ${failure}\n`);
  }
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3FB-C checker: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  process.exitCode = 0;
}
