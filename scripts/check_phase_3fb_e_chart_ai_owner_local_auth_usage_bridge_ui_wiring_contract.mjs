/**
 * Static contract checker for Phase 3FB-E (Chart AI Owner-local Auth/Usage Bridge UI Wiring,
 * Live KIS Off).
 *
 * Inspects `src/pages/chart-ai.astro` and `package.json` as raw text (no build, no dev server, no
 * browser, no live KIS) and asserts: a new local-only, explicit opt-in owner-local auth/usage
 * bridge verification panel exists and is hidden unless both the localhost hostname gate and the
 * `?ownerLocalAuthUsageBridge=1` query opt-in are true; the panel never auto-runs and only calls
 * `/api/chart-ai/similarity` with the owner-local-auth-usage-bridge request contract on an explicit
 * click; the response is guarded and rendered only via sanitized, bucketed fields with
 * `textContent`, never raw JSON, raw errors, or response-derived `innerHTML`; the existing
 * Phase 3FB-C/D owner-local-mocked panel remains intact; and no server-side/API/provider/engine
 * source is touched by this phase. This is a focused checker (a bounded assertion list), not a
 * full historical checker suite.
 *
 * Run:
 *   npm run check:phase-3fb-e-chart-ai-owner-local-auth-usage-bridge-ui-wiring
 */

import { existsSync, readFileSync } from 'node:fs';

const failures = [];
let assertionCount = 0;

const assertTrue = (condition, message) => {
  assertionCount += 1;
  if (!condition) failures.push(message);
};

const assertMatchIn = (source, pattern, message) => {
  assertTrue(pattern.test(source), message);
};

const assertNotMatchIn = (source, pattern, message) => {
  assertTrue(!pattern.test(source), message);
};

const readSource = (path) => readFileSync(path, 'utf8');

// --- File existence ---------------------------------------------------------------------------

const CHART_AI_UI_PATH = 'src/pages/chart-ai.astro';
const PACKAGE_JSON_PATH = 'package.json';
// Only paths that the UI must never import directly (bypassing the HTTP route). This deliberately
// excludes `src/lib/chartSimilarity` and `src/data/chartSimilarity`, which chart-ai.astro has
// legitimately imported since Phase 3EX-D for the unrelated sample/mocked chart display and remain
// untouched by this phase; "must not modify" for those dirs is enforced by the git diff boundary
// check in validation, not by an import-absence check here.
const FORBIDDEN_SERVER_IMPORT_PATHS = [
  'src/pages/api',
  'src/lib/server/providers',
  'src/lib/server/chartSimilarity',
];

for (const path of [CHART_AI_UI_PATH, PACKAGE_JSON_PATH]) {
  assertTrue(existsSync(path), `Required file must exist: ${path}`);
}

const uiSource = readSource(CHART_AI_UI_PATH);
const packageJsonSource = readSource(PACKAGE_JSON_PATH);

// Scope the new panel's markup/script to a bounded substring so checks below cannot accidentally
// match unrelated, pre-existing panels (e.g. the Phase 3FB-C/D owner-local-mocked panel).
const markupStart = uiSource.indexOf('chartAiOwnerLocalAuthUsageBridgePanel');
const commentMarker = uiSource.indexOf('Owner-local auth/usage runtime bridge verification panel (Phase 3FB-E)');
// Scope starts at the first executable statement, deliberately excluding the leading doc comment
// above it (which legitimately documents forbidden fields in prose and would otherwise trip the
// forbidden-substring checks below).
const scriptStart = uiSource.indexOf("const authUsageBridgePanel = document.getElementById('chartAiOwnerLocalAuthUsageBridgePanel')");
assertTrue(markupStart !== -1, 'New panel markup marker (chartAiOwnerLocalAuthUsageBridgePanel) must exist');
assertTrue(commentMarker !== -1, 'New panel script doc comment (Phase 3FB-E) must exist');
assertTrue(scriptStart !== -1, 'New panel script code must start with the authUsageBridgePanel declaration');
const scriptEndMarker = uiSource.indexOf('renderChart();\n    };', scriptStart);
const newScriptSource = scriptStart !== -1
  ? uiSource.slice(scriptStart, scriptEndMarker !== -1 ? scriptEndMarker : uiSource.length)
  : '';

// --- Gate and panel ------------------------------------------------------------------------------

assertMatchIn(
  uiSource,
  /id="chartAiOwnerLocalAuthUsageBridgePanel"[\s\S]{0,40}class="chart-owner-local-auth-usage-bridge-panel"/,
  'New panel section must exist with the expected id/class',
);
assertMatchIn(
  uiSource,
  /id="chartAiOwnerLocalAuthUsageBridgePanel"[\s\S]{0,200}hidden/,
  'New panel must carry the hidden attribute by default in markup',
);
assertMatchIn(
  uiSource,
  /hostname === 'localhost' \|\| hostname === '127\.0\.0\.1' \|\| hostname === '::1'/,
  'Local hostname gate for localhost/127.0.0.1/::1 must exist (reused from the 3FB-C/D panel)',
);
assertMatchIn(
  newScriptSource,
  /isLocalOwnerHostname\(\)/,
  'New panel must call the existing isLocalOwnerHostname() helper',
);
assertMatchIn(
  newScriptSource,
  /get\('ownerLocalAuthUsageBridge'\) === '1'/,
  'URL query opt-in ?ownerLocalAuthUsageBridge=1 must exist',
);
assertMatchIn(
  newScriptSource,
  /authUsageBridgeEnabled\s*=\s*isLocalOwnerHostname\(\)\s*&&\s*authUsageBridgeOptIn/,
  'Both the hostname gate and the query opt-in must be required together (logical AND)',
);
assertMatchIn(
  newScriptSource,
  /authUsageBridgePanel\.hidden\s*=\s*!authUsageBridgeEnabled/,
  'Panel hidden state must be driven directly by the combined gate flag',
);
assertNotMatchIn(
  newScriptSource,
  /setup\(\)[\s\S]{0,80}fetch\('\/api\/chart-ai\/similarity'/,
  'The bridge fetch must not run unconditionally at setup()/page-load time',
);
assertMatchIn(
  newScriptSource,
  /if\s*\(authUsageBridgeButtons\.length > 0 && authUsageBridgeEnabled\)\s*\{/,
  'Click listeners must only be attached when the panel is enabled (gated)',
);
assertMatchIn(
  newScriptSource,
  /button\.addEventListener\('click', async \(\) => \{/,
  'Each scenario button must be wired via an explicit click listener',
);
assertMatchIn(
  uiSource,
  /id="chartAiOwnerLocalMockedPanel"/,
  'Existing Phase 3FB-C/D owner-local-mocked panel markup must remain present',
);
assertMatchIn(
  uiSource,
  /const ownerLocalMockedPanel = document\.getElementById\('chartAiOwnerLocalMockedPanel'\)/,
  'Existing Phase 3FB-C/D owner-local-mocked panel script must remain present',
);

// --- Request contract ----------------------------------------------------------------------------

assertMatchIn(newScriptSource, /fetch\('\/api\/chart-ai\/similarity'/, 'Fetch target must be /api/chart-ai/similarity');
assertMatchIn(newScriptSource, /method:\s*'POST'/, 'Request method must be POST');
assertMatchIn(newScriptSource, /'Content-Type':\s*'application\/json'/, 'Request must set Content-Type: application/json');
assertMatchIn(newScriptSource, /mode:\s*'owner-local-auth-usage-bridge'/, 'Request body must include mode: owner-local-auth-usage-bridge');
assertMatchIn(newScriptSource, /source:\s*'mocked-provider-compatible'/, 'Request body must include source: mocked-provider-compatible');
assertMatchIn(newScriptSource, /ownerLocalAuthUsageBridge:\s*true/, 'Request body must include ownerLocalAuthUsageBridge: true');
assertMatchIn(newScriptSource, /mockAuth:\s*\{/, 'Request body must include a mockAuth object');
assertMatchIn(newScriptSource, /mockUsage:\s*\{/, 'Request body must include a mockUsage object');
assertMatchIn(
  newScriptSource,
  /state:\s*'authenticated', role:\s*'owner'[\s\S]{0,120}used:\s*0, limit:\s*50, remaining:\s*50/,
  'Allowed owner scenario (authenticated/owner, used 0/limit 50/remaining 50) must exist',
);
assertMatchIn(
  newScriptSource,
  /state:\s*'anonymous', role:\s*'anonymous'[\s\S]{0,120}used:\s*0, limit:\s*3, remaining:\s*3/,
  'Anonymous blocked scenario (anonymous/anonymous, used 0/limit 3/remaining 3) must exist',
);
assertMatchIn(
  newScriptSource,
  /used:\s*50, limit:\s*50, remaining:\s*0/,
  'Usage-limited scenario (used 50/limit 50/remaining 0) must exist',
);
assertMatchIn(
  newScriptSource,
  /used:\s*10, limit:\s*5, remaining:\s*0/,
  'Invalid usage scenario (used 10/limit 5/remaining 0, used > limit) must exist',
);
assertMatchIn(newScriptSource, /selectedSymbol \|\| 'MOCKSYM'/, "Symbol fallback to deterministic 'MOCKSYM' must exist");
assertNotMatchIn(newScriptSource, /source:\s*'live'/, 'Request body must never set source: live');
assertNotMatchIn(newScriptSource, /source:\s*'auto'/, 'Request body must never set source: auto');
assertNotMatchIn(
  newScriptSource,
  /owner-local-quote-preview|owner-local-ohlc-preview/,
  'New panel handler must not call the existing KIS preview endpoints',
);

// --- Runtime hardening ----------------------------------------------------------------------------

assertMatchIn(newScriptSource, /new AbortController\(\)/, 'New panel must use its own AbortController');
assertMatchIn(newScriptSource, /AUTH_USAGE_BRIDGE_TIMEOUT_MS\s*=\s*8000/, 'Deterministic 8000ms timeout constant must exist');
assertMatchIn(newScriptSource, /abortController\.abort\(\)/, 'Timeout must call abortController.abort()');
assertMatchIn(newScriptSource, /window\.clearTimeout\(timeoutId\)/, 'finally block must clear the timeout');
assertMatchIn(newScriptSource, /\}\s*finally\s*\{/, 'Request handling must use a finally block for cleanup');
assertMatchIn(newScriptSource, /authUsageBridgeRequestInFlight/, 'In-flight request flag must exist');
assertMatchIn(
  newScriptSource,
  /if\s*\(authUsageBridgeRequestInFlight\)\s*return;/,
  'In-flight flag must short-circuit duplicate concurrent clicks',
);
assertMatchIn(
  newScriptSource,
  /authUsageBridgeButtons\.forEach\(\(btn\) => \{ btn\.disabled = true; \}\)/,
  'All scenario buttons must be disabled while a request is in flight',
);
assertMatchIn(
  newScriptSource,
  /authUsageBridgeButtons\.forEach\(\(btn\) => \{ btn\.disabled = false; \}\)/,
  'All scenario buttons must be re-enabled after completion',
);
assertMatchIn(newScriptSource, /setAttribute\('aria-busy', 'true'\)/, 'aria-busy must be set during loading');
assertMatchIn(newScriptSource, /removeAttribute\('aria-busy'\)/, 'aria-busy must be removed after completion');
assertMatchIn(newScriptSource, /isAuthUsageBridgeSuccessResponse/, 'Success response shape guard must exist');
assertMatchIn(newScriptSource, /isAuthUsageBridgeBlockedResponse/, 'Blocked response shape guard must exist');
assertMatchIn(
  newScriptSource,
  /if\s*\(isAuthUsageBridgeSuccessResponse\(parsedResponse\)\)\s*\{[\s\S]{0,40}renderAuthUsageBridgeSuccess\(parsedResponse\)/,
  'Success render path must only run after the response passes the success shape guard',
);
assertMatchIn(
  newScriptSource,
  /else if\s*\(isAuthUsageBridgeBlockedResponse\(parsedResponse\)\)\s*\{[\s\S]{0,40}renderAuthUsageBridgeBlocked\(parsedResponse\)/,
  'Blocked render path must only run after the response passes the blocked shape guard',
);
assertMatchIn(
  newScriptSource,
  /AUTH_USAGE_BRIDGE_BLOCKED_STATUSES\s*=\s*new Set\(\[[\s\S]*?'auth_required'[\s\S]*?'usage_limited'/,
  'Blocked status set must include auth_required and usage_limited',
);
assertMatchIn(
  newScriptSource,
  /\}\s*else\s*\{\s*\n\s*showAuthUsageBridgeMessage\('Auth\/usage bridge 실행 결과를 불러오지 못했습니다\./,
  'Malformed/unrecognized response must fall through to a safe static message',
);
assertNotMatchIn(newScriptSource, /thrownError\.message/, 'Raw thrown error message must never be rendered');
assertNotMatchIn(newScriptSource, /JSON\.stringify\(parsedResponse\)/, 'Raw response JSON must never be rendered');

// --- Safe rendering -------------------------------------------------------------------------------

assertNotMatchIn(newScriptSource, /\.innerHTML\s*=/, 'New panel must never assign innerHTML');
assertMatchIn(newScriptSource, /\.textContent\s*=/, 'New panel must render via textContent');

const successRenderStart = newScriptSource.indexOf('const renderAuthUsageBridgeSuccess');
const successRenderEnd = newScriptSource.indexOf('const renderAuthUsageBridgeBlocked');
const successRenderSource = successRenderStart !== -1 && successRenderEnd !== -1
  ? newScriptSource.slice(successRenderStart, successRenderEnd)
  : '';
assertTrue(successRenderSource.length > 0, 'renderAuthUsageBridgeSuccess function body must be found');

const SUCCESS_RENDERED_FIELDS = [
  'guardStatus', 'authState', 'role', 'usageWindow', 'usageRemainingBucket',
  'engineStatus', 'normalizedBarsAvailable', 'normalizedBarCountBucket',
  'matchCountBucket', 'dataPolicy', 'disclaimer',
];
assertTrue(
  SUCCESS_RENDERED_FIELDS.every((field) => successRenderSource.includes(field)),
  `Success render path must reference all sanitized fields: ${SUCCESS_RENDERED_FIELDS.join(', ')}`,
);

const blockedRenderStart = newScriptSource.indexOf('const renderAuthUsageBridgeBlocked');
const blockedRenderEnd = newScriptSource.indexOf('if (authUsageBridgeButtons.length > 0');
const blockedRenderSource = blockedRenderStart !== -1 && blockedRenderEnd !== -1
  ? newScriptSource.slice(blockedRenderStart, blockedRenderEnd)
  : '';
assertTrue(blockedRenderSource.length > 0, 'renderAuthUsageBridgeBlocked function body must be found');

const BLOCKED_RENDERED_FIELDS = ['data.status', 'data.error?.code', 'data.error?.retryable', 'data.error?.message'];
assertTrue(
  BLOCKED_RENDERED_FIELDS.every((field) => blockedRenderSource.includes(field)),
  `Blocked render path must reference all sanitized fields: ${BLOCKED_RENDERED_FIELDS.join(', ')}`,
);

const FORBIDDEN_RENDER_SUBSTRINGS = [
  'matches', 'similarityScore', 'forwardReturn', 'ohlc', 'volume', 'timestamp',
  'credential', 'process.env', 'token', 'sessionId', 'userId', 'ipAddress',
  'accountNumber', 'tradingBalance', 'orderId',
];
for (const substring of FORBIDDEN_RENDER_SUBSTRINGS) {
  assertNotMatchIn(
    newScriptSource,
    new RegExp(substring, 'i'),
    `New panel script must never reference forbidden raw field: ${substring}`,
  );
}

// --- Boundary --------------------------------------------------------------------------------------

for (const forbiddenPath of FORBIDDEN_SERVER_IMPORT_PATHS) {
  assertNotMatchIn(
    uiSource,
    new RegExp(`from ['"].*${forbiddenPath.replace('src/', '').replace(/\//g, '\\/')}`),
    `chart-ai.astro must not import from forbidden server path: ${forbiddenPath}`,
  );
}
assertNotMatchIn(newScriptSource, /process\.env/, 'New panel script must never read process.env');
assertNotMatchIn(newScriptSource, /\.env['"]/, 'New panel script must never reference an .env file path');
assertMatchIn(uiSource, /import Layout from '\.\.\/layouts\/Layout\.astro'/, 'Page layout import must remain unchanged');
assertMatchIn(
  uiSource,
  /import \{ scanSimilarity \} from '\.\.\/lib\/chartSimilarity'/,
  'Existing deterministic engine import must remain unchanged',
);

// --- package.json script registration --------------------------------------------------------------

assertMatchIn(
  packageJsonSource,
  /"check:phase-3fb-e-chart-ai-owner-local-auth-usage-bridge-ui-wiring":\s*"node scripts\/check_phase_3fb_e_chart_ai_owner_local_auth_usage_bridge_ui_wiring_contract\.mjs"/,
  'package.json must register the new Phase 3FB-E checker script',
);

// --- Report ------------------------------------------------------------------------------------

if (failures.length > 0) {
  console.error(`Phase 3FB-E checker: FAIL (${failures.length}/${assertionCount} assertions failed)`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FB-E checker: PASS (${assertionCount}/${assertionCount} assertions passed)`);
