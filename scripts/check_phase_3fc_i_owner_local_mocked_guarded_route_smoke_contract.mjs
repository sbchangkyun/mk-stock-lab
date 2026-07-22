/**
 * Static contract checker for Phase 3FC-I (Owner-local Mocked Guarded Route Smoke, No Live KIS).
 *
 * Inspects the new smoke/checker/doc files as raw text (no build, no dev server, no browser, no
 * live KIS) and asserts: the required files exist and the two new package scripts are registered;
 * the changelog contains the required dated entry; the Chart Similarity API route still recognizes
 * all three mutually exclusive dispatch branches (the two pre-existing owner-local branches plus
 * the Phase 3FC-H guarded-runtime-scaffold branch) and `/chart-ai` is unchanged; the Phase
 * 3FC-C/3FC-D/3FC-E/3FC-F/3FC-H scaffold modules still export their required functions; the new
 * smoke covers all ten required scenario groups (A-J) and runs at least 90 assertions; neither the
 * new smoke nor this checker nor the new docs perform a forbidden operation (env/Vercel-env read,
 * Supabase import, KIS provider import, SQL/migration reference, account/trading/balance field, a
 * deploy/push claim); and the scenarios/result docs contain the required exact titles and numbered
 * sections. This is a focused checker (a bounded assertion list), not a full historical checker
 * suite. Per the governing Phase 3FC-I prompt, the Phase 3FC-G checker's stale route-dispatch-
 * branch-count-of-2 assertion remains superseded (by Phase 3FC-H) and must not be run as a gating
 * regression.
 *
 * Run:
 *   npm run check:phase-3fc-i-owner-local-mocked-guarded-route-smoke-no-live-kis
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

// --- File existence -----------------------------------------------------------------------------

const SMOKE_PATH = 'scripts/smoke_phase_3fc_i_owner_local_mocked_guarded_route_smoke_no_live_kis.mjs';
const CHECKER_PATH = 'scripts/check_phase_3fc_i_owner_local_mocked_guarded_route_smoke_contract.mjs';
const SCENARIO_DOC_PATH = 'docs/planning/phase_3fc_i_owner_local_mocked_guarded_route_smoke_scenarios_v0.1.md';
const RESULT_DOC_PATH = 'docs/planning/phase_3fc_i_owner_local_mocked_guarded_route_smoke_result_v0.1.md';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON_PATH = 'package.json';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const CHART_AI_UI_PATH = 'src/pages/chart-ai.astro';
const SCAFFOLD_PATH = 'src/lib/server/chartSimilarity/similarityGuardedRouteScaffold.ts';
const AUTH_SUBJECT_RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityAuthSubjectResolver.ts';
const ROLE_ASSIGNMENT_RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityRoleAssignmentResolver.ts';
const USAGE_STORE_PATH = 'src/lib/server/chartSimilarity/similarityUsageStore.ts';
const FEATURE_FLAG_RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityFeatureFlagResolver.ts';

const REQUIRED_FILES = [
  SMOKE_PATH,
  CHECKER_PATH,
  SCENARIO_DOC_PATH,
  RESULT_DOC_PATH,
  CHANGELOG_PATH,
  PACKAGE_JSON_PATH,
  ROUTE_PATH,
  CHART_AI_UI_PATH,
  SCAFFOLD_PATH,
  AUTH_SUBJECT_RESOLVER_PATH,
  ROLE_ASSIGNMENT_RESOLVER_PATH,
  USAGE_STORE_PATH,
  FEATURE_FLAG_RESOLVER_PATH,
];
for (const path of REQUIRED_FILES) {
  assertTrue(existsSync(path), `Required file must exist: ${path}`);
}

const smokeSource = readSource(SMOKE_PATH);
const checkerSelfSource = readSource(CHECKER_PATH);
const scenarioDocSource = readSource(SCENARIO_DOC_PATH);
const resultDocSource = readSource(RESULT_DOC_PATH);
const changelogSource = readSource(CHANGELOG_PATH);
const packageJsonSource = readSource(PACKAGE_JSON_PATH);
const routeSource = readSource(ROUTE_PATH);
const chartAiUiSource = readSource(CHART_AI_UI_PATH);
const scaffoldSource = readSource(SCAFFOLD_PATH);
const authSubjectResolverSource = readSource(AUTH_SUBJECT_RESOLVER_PATH);
const roleAssignmentResolverSource = readSource(ROLE_ASSIGNMENT_RESOLVER_PATH);
const usageStoreSource = readSource(USAGE_STORE_PATH);
const featureFlagResolverSource = readSource(FEATURE_FLAG_RESOLVER_PATH);

// --- package.json: new script lines registered --------------------------------------------------

assertMatchIn(
  packageJsonSource,
  /"smoke:phase-3fc-i-owner-local-mocked-guarded-route-smoke-no-live-kis":\s*"node scripts\/smoke_phase_3fc_i_owner_local_mocked_guarded_route_smoke_no_live_kis\.mjs"/,
  'package.json must register the new smoke script',
);
assertMatchIn(
  packageJsonSource,
  /"check:phase-3fc-i-owner-local-mocked-guarded-route-smoke-no-live-kis":\s*"node scripts\/check_phase_3fc_i_owner_local_mocked_guarded_route_smoke_contract\.mjs"/,
  'package.json must register this checker script',
);

// --- Changelog entry -----------------------------------------------------------------------------

assertMatchIn(
  changelogSource,
  /##\s*Phase 3FC-I\s*-\s*2026-07-04/,
  'planning_changelog.md must contain a Phase 3FC-I entry dated 2026-07-04',
);
assertMatchIn(
  changelogSource,
  /Owner-local Mocked Guarded Route Smoke, No Live KIS \(Prepared\)/,
  'planning_changelog.md Phase 3FC-I entry must use the required title',
);
assertTrue(
  changelogSource.indexOf('## Phase 3FC-I') < changelogSource.indexOf('## Phase 3FC-H'),
  'planning_changelog.md must place the Phase 3FC-I entry above the Phase 3FC-H entry',
);

// --- Runtime boundary: route still recognizes all three dispatch branches ------------------------

assertMatchIn(
  routeSource,
  /isOwnerLocalMockedSimilarityApiRequestBody\(body\)/,
  'Route must still preserve the pre-existing Phase 3FB-B owner-local-mocked branch guard',
);
assertMatchIn(
  routeSource,
  /isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody\(body\)/,
  'Route must still preserve the pre-existing Phase 3FB-C-ALT auth/usage bridge branch guard',
);
assertMatchIn(
  routeSource,
  /isGuardedRuntimeScaffoldSimilarityRequestBody\(body\)/,
  'Route must still preserve the Phase 3FC-H guarded-runtime-scaffold branch guard',
);
const dispatchBranchMatches = routeSource.match(/if \(is\w+\(body\)\)/g) || [];
assertTrue(
  dispatchBranchMatches.length === 3,
  `Route dispatch branch count must remain exactly 3 (found ${dispatchBranchMatches.length})`,
);
assertMatchIn(
  routeSource,
  /export const ALL: APIRoute = \(\) => jsonResponse\(buildSimilarityApiRouteShellResult\(\{\}\)\);/,
  'The ALL handler must remain unchanged (always feature-disabled)',
);
assertNotMatchIn(
  routeSource,
  /phase_3fc_i|Phase3FCI|PhaseThreeFCI/i,
  'Route file must not reference this smoke-only phase (no runtime source change)',
);

assertMatchIn(
  chartAiUiSource,
  /chartAiOwnerLocalAuthUsageBridgePanel/,
  'src/pages/chart-ai.astro must still contain the pre-existing chartAiOwnerLocalAuthUsageBridgePanel identifier',
);
assertMatchIn(
  chartAiUiSource,
  /owner-local-auth-usage-bridge/,
  'src/pages/chart-ai.astro must still contain the pre-existing owner-local-auth-usage-bridge identifier',
);
assertNotMatchIn(
  chartAiUiSource,
  /similarityGuardedRouteScaffold|runSimilarityGuardedRouteScaffold|guarded-runtime-scaffold/,
  'src/pages/chart-ai.astro must not reference the guarded route scaffold in this phase',
);

// --- Runtime boundary: Phase 3FC-H/3FC-C/3FC-D/3FC-E/3FC-F scaffolds still export required functions --

const REQUIRED_SCAFFOLD_FUNCTIONS = [
  'buildDefaultSimilarityGuardedRouteScaffoldPolicy',
  'buildRouteRecognizedSimilarityGuardedRouteScaffoldPolicy',
  'isGuardedRuntimeScaffoldSimilarityRequestBody',
  'normalizeSimilarityGuardedRouteScaffoldRequestBody',
  'runSimilarityGuardedRouteScaffold',
  'assertSimilarityGuardedRouteScaffoldResultIsSafe',
];
for (const fnName of REQUIRED_SCAFFOLD_FUNCTIONS) {
  assertMatchIn(
    scaffoldSource,
    new RegExp(`export const ${fnName}\\s*=`),
    `Phase 3FC-H scaffold module must still export function ${fnName}`,
  );
}
assertMatchIn(
  authSubjectResolverSource,
  /export const resolveSimilarityAuthSubject\s*=/,
  'The Phase 3FC-C auth subject resolver export must remain unchanged',
);
assertMatchIn(
  roleAssignmentResolverSource,
  /export const resolveSimilarityRoleAssignment\s*=/,
  'The Phase 3FC-D role assignment resolver export must remain unchanged',
);
assertMatchIn(
  usageStoreSource,
  /export const loadSimilarityUsageSnapshot\s*=/,
  'The Phase 3FC-E usage store export must remain unchanged',
);
assertMatchIn(
  featureFlagResolverSource,
  /export const resolveSimilarityFeatureFlags\s*=/,
  'The Phase 3FC-F feature flag resolver export must remain unchanged',
);

// --- Smoke coverage: all ten required scenario groups (A-J) are present --------------------------

const REQUIRED_SMOKE_SECTION_MARKERS = [
  '--- A. Harness safety',
  '--- B. Default unmatched request',
  '--- C. Existing owner-local mocked branch regression',
  '--- D. Existing owner-local auth/usage bridge branch regression',
  '--- E. New guarded-runtime-scaffold exact request',
  '--- F. Guarded partial request',
  '--- G. Guarded wrong source',
  '--- H. Guarded malformed request',
  '--- I. Direct scaffold module confirmation',
  '--- J. Branch mutual exclusion',
];
for (const marker of REQUIRED_SMOKE_SECTION_MARKERS) {
  assertTrue(smokeSource.includes(marker), `Smoke script must contain the required scenario section: ${marker}`);
}

assertMatchIn(smokeSource, /globalThis\.fetch\s*=/, 'Smoke script must monkeypatch fetch to detect any network call');
assertMatchIn(smokeSource, /fetchCalled/, 'Smoke script must assert fetch was never called');
assertMatchIn(smokeSource, /import\.meta\.env/, 'Smoke script must include an import.meta.env safety check');
assertMatchIn(
  smokeSource,
  /isGuardedRuntimeScaffoldSimilarityRequestBody/,
  'Smoke script must exercise the guarded-runtime-scaffold discriminator recognizer',
);
assertMatchIn(smokeSource, /mod\.POST\(/, 'Smoke script must exercise the real route POST handler directly');
assertMatchIn(smokeSource, /mod\.ALL\(/, 'Smoke script must exercise the real route ALL handler directly');
assertMatchIn(
  smokeSource,
  /buildJsonRequest\(null\)/,
  'Smoke script must exercise a null request body against the guarded branch',
);
assertMatchIn(
  smokeSource,
  /buildJsonRequest\('not-an-object'\)/,
  'Smoke script must exercise a non-object request body against the guarded branch',
);
assertMatchIn(
  smokeSource,
  /runSimilarityGuardedRouteScaffold\(/,
  'Smoke script must call the scaffold module directly, not only through the route',
);
assertMatchIn(
  smokeSource,
  /assertSimilarityGuardedRouteScaffoldResultIsSafe/,
  'Smoke script must confirm the direct scaffold result passes its own safety assertion',
);

// --- Smoke coverage: assertion-count floor (statically counted, no execution) ---------------------

const smokeAssertionCallCount = (smokeSource.match(/\bassert(?:True|Equal)\(/g) || []).length;
assertTrue(
  smokeAssertionCallCount >= 90,
  `Smoke script must contain at least 90 assertion calls (found ${smokeAssertionCallCount})`,
);
assertTrue(
  smokeAssertionCallCount <= 130,
  `Smoke script must contain at most 130 assertion calls (found ${smokeAssertionCallCount})`,
);

// --- Forbidden operations: smoke script, docs must never perform a forbidden operation -------------

const FORBIDDEN_PATTERN_CHECKS = [
  [/from ['"]@supabase\//i, 'must not import a Supabase package'],
  [/createClient\(/, 'must not call createClient(...)'],
  [/process\.env(\.\w+|\[)/, 'must never access process.env'],
  [/import\.meta\.env\.\w+\s*(!==|===|=[^=])/, 'must never read a specific import.meta.env value'],
  [/from ['"]dotenv['"]/, 'must not import dotenv'],
  [/readFileSync\(['"]\.env|['"]\.env(\.[\w-]+)?['"]/, 'must not reference an .env file path'],
  [/VERCEL_ENV|VERCEL_URL/, 'must not reference a Vercel environment variable'],
  [/\bCREATE TABLE\b|\bINSERT INTO\b|\.sql['"]|\/migrations\//i, 'must not contain SQL or migration references'],
  [/accountId|tradingAccount|orderId|balanceAmount/i, 'must not reference account/trading/order/balance API fields'],
  [/document\.cookie|req\.headers|request\.headers\.get\(['"]auth/i, 'must never read cookies or a real auth header'],
  [/npm run deploy|vercel deploy|git push\b/, 'must not claim a deploy or push occurred'],
];

for (const [pattern, description] of FORBIDDEN_PATTERN_CHECKS) {
  assertNotMatchIn(smokeSource, pattern, `Smoke script ${description}`);
}
for (const [pattern, description] of FORBIDDEN_PATTERN_CHECKS) {
  assertNotMatchIn(scenarioDocSource, pattern, `Scenarios doc ${description}`);
}
for (const [pattern, description] of FORBIDDEN_PATTERN_CHECKS) {
  assertNotMatchIn(resultDocSource, pattern, `Result doc ${description}`);
}

assertNotMatchIn(
  smokeSource,
  /kisOhlcProvider\(|serverOnlyKisOhlcProvider\(|mockedKisOhlcAdapter\(/,
  'Smoke script must not call a KIS provider function directly',
);
assertTrue(
  (packageJsonSource.match(/^\s*"smoke:phase-3fc-i/gm) || []).length === 1 &&
    (packageJsonSource.match(/^\s*"check:phase-3fc-i/gm) || []).length === 1,
  'package.json must register exactly one new smoke script line and one new check script line for this phase',
);

// --- Scenarios doc: exact title and required numbered sections ------------------------------------

assertMatchIn(
  scenarioDocSource,
  /^# Phase 3FC-I Owner-local Mocked Guarded Route Smoke Scenarios/m,
  'Scenarios doc must have the exact title heading',
);
const REQUIRED_SCENARIO_DOC_SECTIONS = [
  'Purpose',
  'Route Branches Under Test',
  'Exact Guarded Request',
  'Negative Guarded Requests',
  'Prior Branch Regression Cases',
  'Redaction and Safety Checks',
  'What This Phase Does Not Prove',
];
for (const section of REQUIRED_SCENARIO_DOC_SECTIONS) {
  assertMatchIn(
    scenarioDocSource,
    new RegExp(`^##\\s*\\d+\\.\\s*${section}\\b`, 'm'),
    `Scenarios doc must contain the numbered section header: ${section}`,
  );
}
assertMatchIn(scenarioDocSource, /no live KIS|live KIS network call/i, 'Scenarios doc must mention no live KIS call');
assertMatchIn(scenarioDocSource, /partial/i, 'Scenarios doc must describe a partial guarded request');
assertMatchIn(scenarioDocSource, /malformed/i, 'Scenarios doc must describe a malformed guarded request');

// --- Result doc: exact title and required numbered sections ----------------------------------------

assertMatchIn(
  resultDocSource,
  /^# Phase 3FC-I — Owner-local Mocked Guarded Route Smoke Result/m,
  'Result doc must have the exact title heading',
);
const REQUIRED_RESULT_DOC_SECTIONS = [
  'Status',
  'Background',
  'Implemented Scope',
  'Smoke Contract',
  'Expected Route Result',
  'Boundary Preservation',
  'Validation',
  'Supersession Note',
  'Recommended Next Phase',
];
for (const section of REQUIRED_RESULT_DOC_SECTIONS) {
  assertMatchIn(
    resultDocSource,
    new RegExp(`^##\\s*\\d+\\.\\s*${section}\\b`, 'm'),
    `Result doc must contain the numbered section header: ${section}`,
  );
}
assertMatchIn(resultDocSource, /Phase 3FC-J\b/, 'Result doc must reference Phase 3FC-J as the recommended next phase');
assertMatchIn(resultDocSource, /Phase 3FD-A\b/, 'Result doc must reference Phase 3FD-A as an alternative next phase');
assertMatchIn(
  resultDocSource,
  /superseded/i,
  'Result doc must record that the Phase 3FC-G route-branch-count assertion remains superseded',
);
assertMatchIn(
  resultDocSource,
  /no runtime source file was (modified|changed)/i,
  'Result doc must explicitly state no runtime source file was changed',
);

// --- Hard structural requirement: this checker must run at least 95 assertions --------------------

const MINIMUM_REQUIRED_ASSERTION_COUNT = 95;
assertTrue(
  assertionCount >= MINIMUM_REQUIRED_ASSERTION_COUNT,
  `Checker must run at least ${MINIMUM_REQUIRED_ASSERTION_COUNT} assertions (ran ${assertionCount})`,
);
assertTrue(
  assertionCount <= 125,
  `Checker should run at most 125 assertions to stay within the target range (ran ${assertionCount})`,
);
assertTrue(checkerSelfSource.length > 0, 'This checker file must be non-empty (self-reference sanity check)');

if (failures.length > 0) {
  process.stdout.write(`Phase 3FC-I checker: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
  for (const failure of failures) {
    process.stdout.write(`  - ${failure}\n`);
  }
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3FC-I checker: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  process.exitCode = 0;
}
