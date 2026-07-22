/**
 * Static contract checker for Phase 3FC-H (Guarded Route Integration Scaffold, All Flags Off,
 * No Live KIS).
 *
 * Inspects the new source/doc/script files as raw text (no build, no dev server, no browser, no
 * live KIS) and asserts: the guarded route scaffold type contract exposes the required status,
 * mode, source, request-body, policy, summary, and result types while fixing every real-capability
 * boolean to the literal type `false`; the scaffold module's default and route-recognized policy
 * builders never enable a real capability; the request discriminator recognizer/normalizer never
 * matches a partial or malformed body; the scaffold module never imports Supabase/KIS/API route
 * modules, never reads process.env/import.meta.env/cookies/headers, never calls fetch, and never
 * invokes the mocked provider-compatible integration or the deterministic engine; the fixtures are
 * synthetic and deterministic; the route now recognizes exactly three mutually exclusive dispatch
 * branches (the two pre-existing owner-local branches plus this phase's new guarded-runtime-
 * scaffold branch), and the new branch always falls back to the existing feature-disabled shell
 * response; the pre-existing chart-ai UI and prior Phase 3FC-C/3FC-D/3FC-E/3FC-F exports are
 * untouched; the contract and result docs contain the required numbered sections and explicitly
 * record that the Phase 3FC-G route-branch-count-of-2 assertion is superseded. This is a focused
 * checker (a bounded assertion list), not a full historical checker suite. Per the governing
 * Phase 3FC-H prompt, this checker replaces the Phase 3FC-G checker's stale route-dispatch-branch-
 * count-of-2 assertion; the Phase 3FC-G checker must not be re-run as a gating regression after
 * this phase.
 *
 * Run:
 *   npm run check:phase-3fc-h-guarded-route-integration-scaffold-all-flags-off
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

// Strips block and line comments so doc-comment prose describing a guarantee (e.g. "no fetch()")
// is not mistaken for actual code performing that call.
const stripComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

// --- File existence -----------------------------------------------------------------------------

const TYPES_PATH = 'src/lib/server/chartSimilarity/similarityGuardedRouteScaffoldTypes.ts';
const SCAFFOLD_PATH = 'src/lib/server/chartSimilarity/similarityGuardedRouteScaffold.ts';
const FIXTURES_PATH = 'src/lib/server/chartSimilarity/mockedSimilarityGuardedRouteScaffoldFixtures.ts';
const INDEX_PATH = 'src/lib/server/chartSimilarity/index.ts';
const SMOKE_PATH = 'scripts/smoke_phase_3fc_h_guarded_route_integration_scaffold_all_flags_off.mjs';
const CHECKER_PATH = 'scripts/check_phase_3fc_h_guarded_route_integration_scaffold_all_flags_off_contract.mjs';
const CONTRACT_DOC_PATH = 'docs/planning/phase_3fc_h_guarded_route_integration_scaffold_contract_v0.1.md';
const RESULT_DOC_PATH = 'docs/planning/phase_3fc_h_guarded_route_integration_scaffold_all_flags_off_result_v0.1.md';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON_PATH = 'package.json';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const CHART_AI_UI_PATH = 'src/pages/chart-ai.astro';
const AUTH_SUBJECT_RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityAuthSubjectResolver.ts';
const ROLE_ASSIGNMENT_RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityRoleAssignmentResolver.ts';
const USAGE_STORE_PATH = 'src/lib/server/chartSimilarity/similarityUsageStore.ts';
const FEATURE_FLAG_RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityFeatureFlagResolver.ts';

const REQUIRED_FILES = [
  TYPES_PATH,
  SCAFFOLD_PATH,
  FIXTURES_PATH,
  INDEX_PATH,
  SMOKE_PATH,
  CHECKER_PATH,
  CONTRACT_DOC_PATH,
  RESULT_DOC_PATH,
  CHANGELOG_PATH,
  PACKAGE_JSON_PATH,
  ROUTE_PATH,
  CHART_AI_UI_PATH,
  AUTH_SUBJECT_RESOLVER_PATH,
  ROLE_ASSIGNMENT_RESOLVER_PATH,
  USAGE_STORE_PATH,
  FEATURE_FLAG_RESOLVER_PATH,
];
for (const path of REQUIRED_FILES) {
  assertTrue(existsSync(path), `Required file must exist: ${path}`);
}

const typesSource = readSource(TYPES_PATH);
const scaffoldSource = readSource(SCAFFOLD_PATH);
const fixturesSource = readSource(FIXTURES_PATH);
const indexSource = readSource(INDEX_PATH);
const smokeSource = readSource(SMOKE_PATH);
const contractDocSource = readSource(CONTRACT_DOC_PATH);
const resultDocSource = readSource(RESULT_DOC_PATH);
const changelogSource = readSource(CHANGELOG_PATH);
const packageJsonSource = readSource(PACKAGE_JSON_PATH);
const routeSource = readSource(ROUTE_PATH);
const chartAiUiSource = readSource(CHART_AI_UI_PATH);
const authSubjectResolverSource = readSource(AUTH_SUBJECT_RESOLVER_PATH);
const roleAssignmentResolverSource = readSource(ROLE_ASSIGNMENT_RESOLVER_PATH);
const usageStoreSource = readSource(USAGE_STORE_PATH);

// --- package.json: new script lines registered --------------------------------------------------

assertMatchIn(
  packageJsonSource,
  /"smoke:phase-3fc-h-guarded-route-integration-scaffold-all-flags-off":\s*"node scripts\/smoke_phase_3fc_h_guarded_route_integration_scaffold_all_flags_off\.mjs"/,
  'package.json must register the new smoke script',
);
assertMatchIn(
  packageJsonSource,
  /"check:phase-3fc-h-guarded-route-integration-scaffold-all-flags-off":\s*"node scripts\/check_phase_3fc_h_guarded_route_integration_scaffold_all_flags_off_contract\.mjs"/,
  'package.json must register this checker script',
);

// --- Changelog entry -----------------------------------------------------------------------------

assertMatchIn(
  changelogSource,
  /##\s*Phase 3FC-H\s*-\s*2026-07-04/,
  'planning_changelog.md must contain a Phase 3FC-H entry dated 2026-07-04',
);

// --- Type contract: required exported type names --------------------------------------------------

const REQUIRED_TYPE_NAMES = [
  'SimilarityGuardedRouteScaffoldStatus',
  'SimilarityGuardedRouteScaffoldMode',
  'SimilarityGuardedRouteScaffoldSource',
  'SimilarityGuardedRouteScaffoldRequestBody',
  'SimilarityGuardedRouteScaffoldPolicy',
  'SimilarityGuardedRouteScaffoldSafePolicySummary',
  'SimilarityGuardedRouteScaffoldSummary',
  'SimilarityGuardedRouteScaffoldResult',
];
for (const typeName of REQUIRED_TYPE_NAMES) {
  assertMatchIn(
    typesSource,
    new RegExp(`export type ${typeName}\\b`),
    `Type contract must export type ${typeName}`,
  );
}

// --- Type contract: required status literal values -------------------------------------------------

const REQUIRED_STATUS_LITERALS = [
  'disabled',
  'feature_flag_blocked',
  'auth_not_evaluated',
  'role_not_evaluated',
  'usage_not_evaluated',
  'guard_not_evaluated',
  'mocked_provider_not_invoked',
  'invalid_request',
  'error',
];
for (const status of REQUIRED_STATUS_LITERALS) {
  assertTrue(
    typesSource.includes(`'${status}'`),
    `Type contract must include the status literal '${status}'`,
  );
}

// --- Type contract: exact request discriminator literal fields ------------------------------------

assertMatchIn(
  typesSource,
  /mode:\s*'guarded-runtime-scaffold';/,
  "Type contract must fix the request body's mode field to the literal 'guarded-runtime-scaffold'",
);
assertMatchIn(
  typesSource,
  /source:\s*'mocked-provider-compatible';/,
  "Type contract must fix the request body's source field to the literal 'mocked-provider-compatible'",
);
assertMatchIn(
  typesSource,
  /guardedRuntimeScaffold:\s*true;/,
  "Type contract must fix the request body's guardedRuntimeScaffold field to the literal true",
);

// --- Type contract: policy real-capability booleans fixed to false (literal type) ----------------

const POLICY_LITERAL_FALSE_FIELDS = [
  'allowRouteSuccess',
  'allowMockedProviderExecution',
  'allowLiveKis',
  'allowRealSupabase',
  'allowRealDb',
  'allowEnvRead',
  'allowCookieRead',
  'allowHeaderAuthRead',
  'allowPublicExecution',
  'allowBetaExecution',
];
assertTrue(
  POLICY_LITERAL_FALSE_FIELDS.every((field) => new RegExp(`${field}:\\s*false;`).test(typesSource)),
  `Policy type must fix all real-capability booleans to the literal type false (${POLICY_LITERAL_FALSE_FIELDS.join(', ')})`,
);

// --- Type contract: summary/result must never declare a forbidden field ---------------------------

const FORBIDDEN_TYPE_FIELD_NAMES = ['accessToken', 'refreshToken', 'jwt', 'account', 'trading', 'balance', 'rawPrice', 'rawVolume'];
assertTrue(
  FORBIDDEN_TYPE_FIELD_NAMES.every((forbiddenName) => !new RegExp(`\\b${forbiddenName}\\s*[:?]`, 'i').test(typesSource)),
  `Type contract must never declare a field named any of: ${FORBIDDEN_TYPE_FIELD_NAMES.join(', ')}`,
);

// --- Scaffold module: required exported functions --------------------------------------------------

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
    `Scaffold module must export function ${fnName}`,
  );
}

// --- Scaffold module: default policy sets every capability boolean to false ------------------------

assertMatchIn(scaffoldSource, /enabled:\s*false,/, 'Default policy builder must set enabled: false');
assertMatchIn(
  scaffoldSource,
  /allowRouteBranchRecognition:\s*false,/,
  'Default policy builder must set allowRouteBranchRecognition: false',
);
assertTrue(
  POLICY_LITERAL_FALSE_FIELDS.every((field) => new RegExp(`${field}:\\s*false,`).test(scaffoldSource)),
  `Default policy builder must set all real-capability booleans to false (${POLICY_LITERAL_FALSE_FIELDS.join(', ')})`,
);

// --- Scaffold module: route-recognized policy still grants no real capability ----------------------

assertMatchIn(
  scaffoldSource,
  /buildRouteRecognizedSimilarityGuardedRouteScaffoldPolicy\s*=\s*\(\):\s*SimilarityGuardedRouteScaffoldPolicy\s*=>\s*\(\{\s*\n\s*\.\.\.buildDefaultSimilarityGuardedRouteScaffoldPolicy\(\),\s*\n\s*enabled:\s*true,\s*\n\s*allowRouteBranchRecognition:\s*true,/,
  'Route-recognized policy builder must spread the default policy and only flip enabled/allowRouteBranchRecognition to true',
);

// --- Scaffold module: required status paths and safe short-circuits --------------------------------

const REQUIRED_SCAFFOLD_STATUS_PATHS = ["'invalid_request'", "'disabled'", "'feature_flag_blocked'"];
for (const status of REQUIRED_SCAFFOLD_STATUS_PATHS) {
  assertTrue(
    scaffoldSource.includes(status),
    `Scaffold module must produce the status path ${status}`,
  );
}
assertMatchIn(scaffoldSource, /if \(!normalized\)/, 'Scaffold module must short-circuit on a non-exact-match body');
assertMatchIn(scaffoldSource, /if \(!policy\.enabled\)/, 'Scaffold module must short-circuit when the policy is disabled');
assertMatchIn(scaffoldSource, /routeSuccessAllowed:\s*false,/, 'Scaffold module must always set routeSuccessAllowed: false');
assertMatchIn(scaffoldSource, /liveKisAllowed:\s*false,/, 'Scaffold module must always set liveKisAllowed: false');
assertMatchIn(
  scaffoldSource,
  /providerStatus:\s*'mocked_provider_not_invoked',/,
  "Scaffold module must always set providerStatus: 'mocked_provider_not_invoked'",
);

// --- Scaffold module: composes with the Phase 3FC-F feature flag resolver only ----------------------

assertMatchIn(
  scaffoldSource,
  /resolveSimilarityFeatureFlags\(/,
  'Scaffold module must call the Phase 3FC-F resolveSimilarityFeatureFlags',
);
assertMatchIn(
  scaffoldSource,
  /buildDefaultSimilarityFeatureFlagResolverPolicy\(\)/,
  'Scaffold module must compose with the default, all-flags-off feature flag resolver policy',
);
assertNotMatchIn(
  scaffoldSource,
  /buildMockedSimilarityFeatureFlagResolverPolicy/,
  'Scaffold module must never use the mocked (enabled) feature flag resolver policy',
);

// --- Scaffold module: forbidden imports/operations -----------------------------------------------

assertNotMatchIn(scaffoldSource, /from ['"]@supabase\//i, 'Scaffold module must not import a Supabase package');
assertNotMatchIn(scaffoldSource, /createClient\(/, 'Scaffold module must not call createClient(...)');
assertNotMatchIn(scaffoldSource, /process\.env(\.\w+|\[)/, 'Scaffold module must never access process.env');
assertNotMatchIn(
  scaffoldSource,
  /import\.meta\.env(\.\w+|\[)/,
  'Scaffold module must never access import.meta.env',
);
assertNotMatchIn(scaffoldSource, /from ['"]dotenv['"]/, 'Scaffold module must not import dotenv');
assertNotMatchIn(scaffoldSource, /readFileSync\(['"]\.env|\.env['"]/, 'Scaffold module must not reference an .env file path');
assertNotMatchIn(scaffoldSource, /VERCEL_ENV|VERCEL_URL/, 'Scaffold module must not reference a Vercel environment variable');
assertNotMatchIn(scaffoldSource, /\bfetch\(/, 'Scaffold module must never call fetch(...)');
assertNotMatchIn(
  scaffoldSource,
  /document\.cookie|req\.headers|request\.headers|\.headers\.get\(/,
  'Scaffold module must never read cookies or request headers',
);
assertNotMatchIn(
  scaffoldSource,
  /kisOhlcProvider|serverOnlyKisOhlcProvider|mockedKisOhlcAdapter|from ['"]\.\.\/providers/,
  'Scaffold module must not import a KIS provider module',
);
assertNotMatchIn(
  scaffoldSource,
  /pages[\\/]api|similarityApiRouteShell/,
  'Scaffold module must not import an API route module',
);
assertNotMatchIn(
  scaffoldSource,
  /\bCREATE TABLE\b|\bINSERT INTO\b|\.sql['"]|\/migrations\//i,
  'Scaffold module must not contain SQL or migration references',
);
assertNotMatchIn(
  scaffoldSource,
  /accountId|tradingAccount|orderId|balanceAmount/i,
  'Scaffold module must not reference account/trading/order/balance API fields',
);
assertNotMatchIn(
  scaffoldSource,
  /runMockedProviderCompatibleSimilarityIntegration|runSimilarityProviderIntegrationWithBars/,
  'Scaffold module must never invoke the mocked provider-compatible integration or the deterministic engine',
);
assertNotMatchIn(
  scaffoldSource,
  /resolveSimilarityAuthSubject\(|resolveSimilarityRoleAssignment\(|loadSimilarityUsageSnapshot\(|recordSimilarityUsageIncrement\(/,
  'Scaffold module must not call the Phase 3FC-C/3FC-D/3FC-E resolvers/store in this phase (statuses are placeholders only)',
);

// --- Scaffold module: safety assertion helper never trusts key names, only primitive values ---------

assertMatchIn(
  scaffoldSource,
  /export const assertSimilarityGuardedRouteScaffoldResultIsSafe\s*=/,
  'Scaffold module must export assertSimilarityGuardedRouteScaffoldResultIsSafe',
);
assertMatchIn(
  scaffoldSource,
  /collectPrimitiveValues/,
  'Scaffold module must collect only primitive values (never key names) when checking result safety',
);
assertTrue(
  scaffoldSource.includes("'price'") && scaffoldSource.includes("'volume'"),
  'Scaffold module safety assertion must forbid leaked price/volume values',
);

// --- Fixtures: required exported builders, synthetic values only ------------------------------------

const REQUIRED_FIXTURE_NAMES = [
  'buildMockedGuardedRuntimeScaffoldRequestBody',
  'buildMockedMalformedGuardedRuntimeScaffoldRequestBody',
  'buildMockedPartialGuardedRuntimeScaffoldRequestBody',
];
for (const fixtureName of REQUIRED_FIXTURE_NAMES) {
  assertMatchIn(
    fixturesSource,
    new RegExp(`export const ${fixtureName} = \\(`),
    `Fixtures must export builder ${fixtureName}`,
  );
}
assertNotMatchIn(
  stripComments(fixturesSource),
  /Date\.now\(\)|Math\.random\(\)|new Date\(\)/,
  'Fixtures must be deterministic (no Date.now, Math.random, or new Date)',
);
assertNotMatchIn(
  fixturesSource,
  /@[\w.-]+\.\w{2,}|accessToken|refreshToken|\bjwt\b/i,
  'Fixtures must not contain email-like strings or token-like fields',
);
assertMatchIn(
  fixturesSource,
  /'MOCK-SYNTH-/,
  'Fixtures must use a synthetic MOCK-SYNTH-* symbol',
);
assertNotMatchIn(
  fixturesSource,
  /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
  'Fixtures must not contain an IP-address-like string',
);

// --- Exports: index.ts exposes new types/functions/fixtures without disturbing prior exports --------

assertTrue(
  REQUIRED_TYPE_NAMES.every((typeName) => new RegExp(`${typeName},?`).test(indexSource)),
  `index.ts must export all required types (${REQUIRED_TYPE_NAMES.join(', ')})`,
);
assertTrue(
  REQUIRED_SCAFFOLD_FUNCTIONS.every((fnName) => new RegExp(`${fnName},`).test(indexSource)),
  `index.ts must export all required functions (${REQUIRED_SCAFFOLD_FUNCTIONS.join(', ')})`,
);
assertTrue(
  REQUIRED_FIXTURE_NAMES.every((fixtureName) => new RegExp(`${fixtureName},`).test(indexSource)),
  `index.ts must export all required fixture builders (${REQUIRED_FIXTURE_NAMES.join(', ')})`,
);

const REQUIRED_PRIOR_EXPORTS = [
  'resolveSimilarityFeatureFlags,',
  'resolveSimilarityAuthSubject,',
  'resolveSimilarityRoleAssignment,',
  'loadSimilarityUsageSnapshot,',
  'recordSimilarityUsageIncrement,',
  'buildOwnerLocalAuthUsageBridgeSimilarityApiResponse,',
  'runMockedProviderCompatibleSimilarityIntegration,',
];
assertTrue(
  REQUIRED_PRIOR_EXPORTS.every((priorExport) => indexSource.includes(priorExport)),
  `index.ts must still export all pre-existing required symbols (${REQUIRED_PRIOR_EXPORTS.join(', ')}) — no removed exports`,
);

// --- Runtime boundary: similarity route dispatch now has exactly three branches --------------------

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
  'Route must recognize the new Phase 3FC-H guarded-runtime-scaffold branch guard',
);
const dispatchBranchMatches = routeSource.match(/if \(is\w+\(body\)\)/g) || [];
assertTrue(
  dispatchBranchMatches.length === 3,
  `Route dispatch branch count must now be exactly 3 (found ${dispatchBranchMatches.length}) — this phase intentionally supersedes the Phase 3FC-G branch-count-of-2 assertion`,
);
assertMatchIn(
  routeSource,
  /isGuardedRuntimeScaffoldSimilarityRequestBody\(body\)\)\s*\{\s*\n\s*try\s*\{[\s\S]{0,200}runSimilarityGuardedRouteScaffold\(body\);\s*\n\s*return jsonResponse\(buildSimilarityApiRouteShellResult\(\{\}\)\);/,
  'The new guarded-runtime-scaffold branch must always fall back to the existing feature-disabled shell response and never expose a new success shape',
);
assertNotMatchIn(
  routeSource,
  /jsonApiResponse\([^)]*runSimilarityGuardedRouteScaffold/,
  'The new guarded-runtime-scaffold branch must never pass the scaffold result to a client-facing API response',
);
assertMatchIn(
  routeSource,
  /export const ALL: APIRoute = \(\) => jsonResponse\(buildSimilarityApiRouteShellResult\(\{\}\)\);/,
  'The ALL handler must remain unchanged (always feature-disabled)',
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
  'src/pages/chart-ai.astro must not reference the new Phase 3FC-H guarded route scaffold in this phase',
);
assertNotMatchIn(
  authSubjectResolverSource,
  /similarityGuardedRouteScaffold/,
  'The Phase 3FC-C auth subject resolver must not be modified to reference the new guarded route scaffold module',
);
assertMatchIn(
  authSubjectResolverSource,
  /export const resolveSimilarityAuthSubject\s*=/,
  'The Phase 3FC-C auth subject resolver export must remain unchanged',
);
assertNotMatchIn(
  roleAssignmentResolverSource,
  /similarityGuardedRouteScaffold/,
  'The Phase 3FC-D role assignment resolver must not be modified to reference the new guarded route scaffold module',
);
assertMatchIn(
  roleAssignmentResolverSource,
  /export const resolveSimilarityRoleAssignment\s*=/,
  'The Phase 3FC-D role assignment resolver export must remain unchanged',
);
assertNotMatchIn(
  usageStoreSource,
  /similarityGuardedRouteScaffold/,
  'The Phase 3FC-E usage store must not be modified to reference the new guarded route scaffold module',
);
assertMatchIn(
  usageStoreSource,
  /export const loadSimilarityUsageSnapshot\s*=/,
  'The Phase 3FC-E usage store export must remain unchanged',
);

// --- Smoke script: forbidden patterns and required safety checks -----------------------------------

assertNotMatchIn(smokeSource, /from ['"]@supabase\//i, 'Smoke script must not import a Supabase package');
assertMatchIn(smokeSource, /globalThis\.fetch\s*=/, 'Smoke script must monkeypatch fetch to detect any network call');
assertMatchIn(smokeSource, /fetchCalled/, 'Smoke script must assert fetch was never called');
assertMatchIn(smokeSource, /import\.meta\.env/, 'Smoke script must include an import.meta.env safety check');
assertMatchIn(
  smokeSource,
  /isGuardedRuntimeScaffoldSimilarityRequestBody/,
  'Smoke script must exercise the new discriminator recognizer',
);
assertMatchIn(
  smokeSource,
  /routeMod\.POST/,
  'Smoke script must exercise the real route POST handler directly',
);

// --- Safety: result types have safeMessage/warnings, no token fields --------------------------------

assertMatchIn(typesSource, /safeMessage:\s*string;/, 'Guarded route scaffold result types must declare safeMessage: string');
assertMatchIn(typesSource, /warnings:\s*string\[\];/, 'Guarded route scaffold result types must declare warnings: string[]');
assertNotMatchIn(
  typesSource,
  /rawSessionPayload|sessionToken|tokenValue/i,
  'Guarded route scaffold result types must not declare a raw session/token payload field',
);

// --- Contract doc: required section headers ---------------------------------------------------------

const REQUIRED_CONTRACT_DOC_SECTIONS = [
  'Purpose',
  'Request Discriminator',
  'Route Behavior',
  'Scaffold Composition',
  'All-Flags-Off Policy',
  'Safe Disabled Response',
  'Preserved Existing Branches',
  'Security Boundary',
  'Future Integration',
];
assertMatchIn(
  contractDocSource,
  /^# Phase 3FC-H Guarded Route Integration Scaffold Contract/m,
  'Contract doc must have the exact title heading',
);
for (const section of REQUIRED_CONTRACT_DOC_SECTIONS) {
  assertMatchIn(
    contractDocSource,
    new RegExp(`^##\\s*\\d+\\.\\s*${section}\\b`, 'm'),
    `Contract doc must contain the numbered section header: ${section}`,
  );
}
assertMatchIn(
  contractDocSource,
  /dispatchBranchMatches\.length === 2.{0,40}superseded|superseded[\s\S]{0,120}dispatchBranchMatches\.length === 2/,
  'Contract doc must explicitly state that the Phase 3FC-G branch-count-of-2 assertion is superseded',
);

// --- Result doc: required section headers -------------------------------------------------------

const REQUIRED_RESULT_DOC_SECTIONS = [
  'Status',
  'Background',
  'Implemented Scope',
  'Route Scaffold Result',
  'Boundary Preservation',
  'Validation',
  'Files Changed',
  'Implementation Implication',
  'Recommended Next Phase',
];
assertMatchIn(
  resultDocSource,
  /^# Phase 3FC-H — Guarded Route Integration Scaffold, All Flags Off Result/m,
  'Result doc must have the exact title heading',
);
for (const section of REQUIRED_RESULT_DOC_SECTIONS) {
  assertMatchIn(
    resultDocSource,
    new RegExp(`^##\\s*\\d+\\.\\s*${section}\\b`, 'm'),
    `Result doc must contain the numbered section header: ${section}`,
  );
}
assertMatchIn(resultDocSource, /Phase 3FC-I\b/, 'Result doc must reference Phase 3FC-I as the recommended next phase');
assertMatchIn(resultDocSource, /Phase 3FC-I-ALT/, 'Result doc must reference Phase 3FC-I-ALT as an alternative next phase');
assertMatchIn(
  resultDocSource,
  /intentionally superseded/,
  'Result doc must explicitly state that the Phase 3FC-G branch-count assertion is intentionally superseded',
);

// --- Hard structural requirement: this checker must run at least 100 assertions ------------------

const MINIMUM_REQUIRED_ASSERTION_COUNT = 100;
assertTrue(
  assertionCount >= MINIMUM_REQUIRED_ASSERTION_COUNT,
  `Checker must run at least ${MINIMUM_REQUIRED_ASSERTION_COUNT} assertions (ran ${assertionCount})`,
);

if (failures.length > 0) {
  process.stdout.write(`Phase 3FC-H checker: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
  for (const failure of failures) {
    process.stdout.write(`  - ${failure}\n`);
  }
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3FC-H checker: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  process.exitCode = 0;
}
