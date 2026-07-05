/**
 * Static contract checker for Phase 3FC-E (Usage Store Interface Scaffold, Disabled by Default,
 * No Live KIS).
 *
 * Inspects the new source/doc/script files as raw text (no build, no dev server, no browser, no
 * live KIS) and asserts: the usage store type contract exposes the full anonymous/authenticated/
 * beta/owner/admin role set and the daily/monthly window set but never introduces a token/account/
 * trading/balance field; the default policy is disabled with every real-capability boolean false;
 * the approved daily/monthly limit table matches the owner-approved baseline; the module never
 * imports Supabase/KIS/API route modules, never reads process.env/cookies/headers, never calls
 * fetch; anonymous role or a missing subject always blocks both snapshot loading and increment; a
 * client-claimed role or usage value is always ignored and only produces a safe warning; the
 * fixtures are synthetic and deterministic; the pre-existing similarity route, chart-ai UI, and
 * prior exports (including the Phase 3FC-C auth subject resolver and Phase 3FC-D role assignment
 * resolver) are untouched by this phase. This is a focused checker (a bounded assertion list), not
 * a full historical checker suite.
 *
 * Run:
 *   npm run check:phase-3fc-e-usage-store-interface-scaffold
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

// Strips block and line comments so doc-comment prose describing a guarantee (e.g. "no Date.now()")
// is not mistaken for actual code performing that call.
const stripComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

// --- File existence -----------------------------------------------------------------------------

const TYPES_PATH = 'src/lib/server/chartSimilarity/similarityUsageStoreTypes.ts';
const STORE_PATH = 'src/lib/server/chartSimilarity/similarityUsageStore.ts';
const FIXTURES_PATH = 'src/lib/server/chartSimilarity/mockedSimilarityUsageStoreFixtures.ts';
const INDEX_PATH = 'src/lib/server/chartSimilarity/index.ts';
const SMOKE_PATH = 'scripts/smoke_phase_3fc_e_usage_store_interface_scaffold.mjs';
const CONTRACT_DOC_PATH = 'docs/planning/phase_3fc_e_usage_store_interface_contract_v0.1.md';
const RESULT_DOC_PATH = 'docs/planning/phase_3fc_e_usage_store_interface_scaffold_result_v0.1.md';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON_PATH = 'package.json';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const CHART_AI_UI_PATH = 'src/pages/chart-ai.astro';
const AUTH_SUBJECT_RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityAuthSubjectResolver.ts';
const ROLE_ASSIGNMENT_RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityRoleAssignmentResolver.ts';

for (const path of [
  TYPES_PATH,
  STORE_PATH,
  FIXTURES_PATH,
  INDEX_PATH,
  SMOKE_PATH,
  CONTRACT_DOC_PATH,
  RESULT_DOC_PATH,
  CHANGELOG_PATH,
  PACKAGE_JSON_PATH,
  ROUTE_PATH,
  CHART_AI_UI_PATH,
  AUTH_SUBJECT_RESOLVER_PATH,
  ROLE_ASSIGNMENT_RESOLVER_PATH,
]) {
  assertTrue(existsSync(path), `Required file must exist: ${path}`);
}

const typesSource = readSource(TYPES_PATH);
const storeSource = readSource(STORE_PATH);
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

// --- package.json: new script lines registered --------------------------------------------------

assertMatchIn(
  packageJsonSource,
  /"smoke:phase-3fc-e-usage-store-interface-scaffold":\s*"node scripts\/smoke_phase_3fc_e_usage_store_interface_scaffold\.mjs"/,
  'package.json must register the new smoke script',
);
assertMatchIn(
  packageJsonSource,
  /"check:phase-3fc-e-usage-store-interface-scaffold":\s*"node scripts\/check_phase_3fc_e_usage_store_interface_scaffold_contract\.mjs"/,
  'package.json must register this checker script',
);

// --- Changelog entry -----------------------------------------------------------------------------

assertMatchIn(changelogSource, /##\s*Phase 3FC-E\s*-\s*2026-07-04/, 'planning_changelog.md must contain a Phase 3FC-E entry dated 2026-07-04');

// --- Type contract: required exported type names --------------------------------------------------

const REQUIRED_TYPE_NAMES = [
  'SimilarityUsageStoreRole',
  'SimilarityUsageStoreWindow',
  'SimilarityUsageStoreStatus',
  'SimilarityUsageStoreSource',
  'SimilarityUsageStoreSubjectRef',
  'SimilarityUsageCounterRecord',
  'SimilarityUsageEventRecord',
  'SimilarityUsageStoreInput',
  'SimilarityUsageStorePolicy',
  'SimilarityUsageStoreSafePolicySummary',
  'SimilarityUsageSnapshot',
  'SimilarityUsageStoreSnapshotResult',
  'SimilarityUsageStoreIncrementResult',
];
assertTrue(
  REQUIRED_TYPE_NAMES.every((typeName) => new RegExp(`export type ${typeName}\\b`).test(typesSource)),
  `Type contract must export all required type names (${REQUIRED_TYPE_NAMES.join(', ')})`,
);

// --- Type contract: full role set, full window set, counters restricted away from anonymous ----

assertMatchIn(
  typesSource,
  /export type SimilarityUsageStoreRole = 'anonymous' \| 'authenticated' \| 'beta' \| 'owner' \| 'admin';/,
  'SimilarityUsageStoreRole must include the full anonymous/authenticated/beta/owner/admin set',
);
assertMatchIn(
  typesSource,
  /export type SimilarityUsageStoreWindow = 'daily' \| 'monthly';/,
  'SimilarityUsageStoreWindow must include the full daily/monthly set',
);
assertMatchIn(
  typesSource,
  /role:\s*Exclude<SimilarityUsageStoreRole,\s*'anonymous'>;/,
  'SimilarityUsageCounterRecord.role and SimilarityUsageEventRecord.role must exclude anonymous',
);

// --- Type contract: forbidden field/type names ----------------------------------------------------

const FORBIDDEN_TYPE_FIELD_NAMES = ['userId', 'accessToken', 'refreshToken', 'jwt', 'account', 'trading', 'balance'];
assertTrue(
  FORBIDDEN_TYPE_FIELD_NAMES.every((forbiddenName) => !new RegExp(`\\b${forbiddenName}\\s*[:?]`, 'i').test(typesSource)),
  `Type contract must never declare a field named any of: ${FORBIDDEN_TYPE_FIELD_NAMES.join(', ')}`,
);

// --- Type contract: policy real-capability booleans fixed to false (literal type) ----------------

const POLICY_LITERAL_FALSE_FIELDS = [
  'allowRealUsageStore',
  'allowSupabaseClient',
  'allowEnvRead',
  'allowDbRead',
  'allowDbWrite',
  'allowSql',
  'allowCookieRead',
  'allowHeaderRead',
  'allowClientClaimedRole',
  'allowClientClaimedUsage',
  'allowAnonymousExecution',
  'allowRouteSuccess',
  'allowPublicExecution',
  'allowBetaExecution',
];
assertTrue(
  POLICY_LITERAL_FALSE_FIELDS.every((field) => new RegExp(`${field}:\\s*false;`).test(typesSource)),
  `Policy type must fix all real-capability booleans to the literal type false (${POLICY_LITERAL_FALSE_FIELDS.join(', ')})`,
);

// --- Usage store module: required exported functions --------------------------------------------

const REQUIRED_STORE_FUNCTIONS = [
  'buildDefaultSimilarityUsageStorePolicy',
  'buildMockedSimilarityUsageStorePolicy',
  'getApprovedSimilarityUsageLimit',
  'normalizeSimilarityUsageStoreInput',
  'loadSimilarityUsageSnapshot',
  'recordSimilarityUsageIncrement',
  'assertSimilarityUsageStoreResultIsSafe',
];
assertTrue(
  REQUIRED_STORE_FUNCTIONS.every((fnName) => new RegExp(`export const ${fnName}\\s*=`).test(storeSource)),
  `Usage store module must export all required functions (${REQUIRED_STORE_FUNCTIONS.join(', ')})`,
);

// --- Usage store module: default policy booleans (disabled + all real-capability false) --------

assertMatchIn(storeSource, /enabled:\s*false,/, 'Default policy builder must set enabled: false');
assertTrue(
  POLICY_LITERAL_FALSE_FIELDS.every((field) => new RegExp(`${field}:\\s*false,`).test(storeSource)),
  `Default policy builder must set all real-capability booleans to false (${POLICY_LITERAL_FALSE_FIELDS.join(', ')})`,
);

// --- Usage store module: approved daily/monthly limit table matches the owner-approved baseline --

assertMatchIn(storeSource, /anonymous:\s*0,\s*\n\s*authenticated:\s*3,\s*\n\s*beta:\s*10,\s*\n\s*owner:\s*50,\s*\n\s*admin:\s*100,/, 'Approved daily limit table must match anonymous:0, authenticated:3, beta:10, owner:50, admin:100');
assertMatchIn(storeSource, /anonymous:\s*0,\s*\n\s*authenticated:\s*30,\s*\n\s*beta:\s*100,\s*\n\s*owner:\s*1000,\s*\n\s*admin:\s*3000,/, 'Approved monthly limit table must match anonymous:0, authenticated:30, beta:100, owner:1000, admin:3000');

// --- Usage store module: required status paths exist --------------------------------------------

const REQUIRED_STATUS_PATHS = [
  "'disabled'",
  "'loaded'",
  "'limit_reached'",
  "'increment_recorded'",
  "'increment_blocked'",
  "'anonymous_blocked'",
  "'invalid_subject'",
  "'invalid_role'",
  "'counter_unavailable'",
];
assertTrue(
  REQUIRED_STATUS_PATHS.every((status) => storeSource.includes(status)),
  `Usage store module must produce all required status paths (${REQUIRED_STATUS_PATHS.join(', ')})`,
);
assertMatchIn(storeSource, /if \(!policy\.enabled\)/, 'Usage store module must short-circuit when the policy is disabled');
assertMatchIn(
  storeSource,
  /input\.role === 'anonymous' \|\| !input\.subject/,
  'Usage store module must treat an anonymous role or a missing subject as anonymous_blocked',
);

// --- Usage store module: mismatched counter ignored, client claim ignored ------------------------

assertMatchIn(storeSource, /'counter_ignored'/, "Usage store module must record a 'counter_ignored' warning for a mismatched mocked counter");
assertMatchIn(
  storeSource,
  /input\.clientClaimedRole \|\| input\.clientClaimedUsage !== undefined/,
  'Usage store module must check for a client-claimed role or usage value',
);
assertMatchIn(
  storeSource,
  /'client_claim_ignored'/,
  "Usage store module must record a 'client_claim_ignored' warning rather than trusting the claim",
);
assertNotMatchIn(
  storeSource,
  /role:\s*input\.clientClaimedRole|usage:\s*input\.clientClaimedUsage/,
  'Usage store module must never assign role or usage directly from a client-claimed value',
);

// --- Usage store module: increment blocked for invalid amount and quota exceeded -----------------

assertMatchIn(storeSource, /'invalid_increment_amount'/, "Usage store module must record an 'invalid_increment_amount' warning for a missing/non-integer/non-positive increment");
assertMatchIn(storeSource, /'quota_exceeded'/, "Usage store module must record a 'quota_exceeded' warning when an increment would exceed the approved limit");
assertMatchIn(
  storeSource,
  /before\.used \+ incrementBy > before\.limit/,
  'Usage store module must block an increment that would exceed the approved limit',
);

// --- Usage store module: forbidden imports/operations ---------------------------------------------

assertNotMatchIn(storeSource, /from ['"]@supabase\//i, 'Usage store module must not import a Supabase package');
assertNotMatchIn(storeSource, /createClient\(/, 'Usage store module must not call createClient(...)');
assertNotMatchIn(storeSource, /process\.env(\.\w+|\[)/, 'Usage store module must never access process.env');
assertNotMatchIn(storeSource, /from ['"]dotenv['"]/, 'Usage store module must not import dotenv');
assertNotMatchIn(storeSource, /readFileSync\(['"]\.env|\.env['"]/, 'Usage store module must not reference an .env file path');
assertNotMatchIn(storeSource, /\bfetch\(/, 'Usage store module must never call fetch(...)');
assertNotMatchIn(
  storeSource,
  /document\.cookie|req\.headers|request\.headers|\.headers\.get\(/,
  'Usage store module must never read cookies or request headers',
);
assertNotMatchIn(
  storeSource,
  /kisOhlcProvider|serverOnlyKisOhlcProvider|mockedKisOhlcAdapter|from ['"]\.\.\/providers/,
  'Usage store module must not import a KIS provider module',
);
assertNotMatchIn(
  storeSource,
  /pages[\\/]api|similarityApiRouteShell/,
  'Usage store module must not import an API route module',
);
assertNotMatchIn(
  storeSource,
  /\bCREATE TABLE\b|\bINSERT INTO\b|\.sql['"]|\/migrations\//i,
  'Usage store module must not contain SQL or migration references',
);
assertNotMatchIn(
  storeSource,
  /accountId|tradingAccount|orderId|balanceAmount/i,
  'Usage store module must not reference account/trading/order/balance API fields',
);

// --- Fixtures: required exported builders, synthetic values only --------------------------------

const REQUIRED_FIXTURE_NAMES = [
  'buildMockedAnonymousUsageStoreInput',
  'buildMockedAuthenticatedFreshDailyUsageStoreInput',
  'buildMockedAuthenticatedAtDailyLimitUsageStoreInput',
  'buildMockedBetaPartialDailyUsageStoreInput',
  'buildMockedBetaAtMonthlyLimitUsageStoreInput',
  'buildMockedOwnerPartialDailyUsageStoreInput',
  'buildMockedAdminPartialMonthlyUsageStoreInput',
  'buildMockedCounterMismatchIgnoredUsageStoreInput',
  'buildMockedClientClaimedUsageIgnoredUsageStoreInput',
];
assertTrue(
  REQUIRED_FIXTURE_NAMES.every((fixtureName) => new RegExp(`export const ${fixtureName} = \\(`).test(fixturesSource)),
  `Fixtures must export all required builders (${REQUIRED_FIXTURE_NAMES.join(', ')})`,
);
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
  /'mock-subject-/,
  'Fixtures must use synthetic mock-subject-* subject references',
);
assertMatchIn(
  fixturesSource,
  /'mock-usage-request-/,
  'Fixtures must use a synthetic mock-usage-request-* requestRef',
);

// --- Exports: index.ts exposes new types/functions/fixtures without disturbing prior exports ----

assertTrue(
  REQUIRED_TYPE_NAMES.every((typeName) => new RegExp(`${typeName},?`).test(indexSource)),
  `index.ts must export all required types (${REQUIRED_TYPE_NAMES.join(', ')})`,
);
assertTrue(
  REQUIRED_STORE_FUNCTIONS.every((fnName) => new RegExp(`${fnName},`).test(indexSource)),
  `index.ts must export all required usage store functions (${REQUIRED_STORE_FUNCTIONS.join(', ')})`,
);
assertTrue(
  REQUIRED_FIXTURE_NAMES.every((fixtureName) => new RegExp(`${fixtureName},`).test(indexSource)),
  `index.ts must export all required fixture builders (${REQUIRED_FIXTURE_NAMES.join(', ')})`,
);
assertMatchIn(
  indexSource,
  /resolveSimilarityAuthSubject,/,
  'index.ts must still export the pre-existing Phase 3FC-C resolveSimilarityAuthSubject (no removed exports)',
);
assertMatchIn(
  indexSource,
  /resolveSimilarityRoleAssignment,/,
  'index.ts must still export the pre-existing Phase 3FC-D resolveSimilarityRoleAssignment (no removed exports)',
);
assertMatchIn(
  indexSource,
  /buildOwnerLocalAuthUsageBridgeSimilarityApiResponse,/,
  'index.ts must still export the pre-existing buildOwnerLocalAuthUsageBridgeSimilarityApiResponse (no removed exports)',
);
assertMatchIn(
  indexSource,
  /runMockedProviderCompatibleSimilarityIntegration,/,
  'index.ts must still export the pre-existing runMockedProviderCompatibleSimilarityIntegration (no removed exports)',
);

// --- Runtime boundary: similarity route, chart-ai UI, and 3FC-C/3FC-D resolvers unchanged -------

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
const dispatchBranchMatches = routeSource.match(/isOwnerLocal\w+\(body\)/g) || [];
assertTrue(
  dispatchBranchMatches.length === 2,
  `Route dispatch branch count must remain exactly 2 (found ${dispatchBranchMatches.length}) — this phase adds no new route branch`,
);
assertNotMatchIn(
  routeSource,
  /similarityUsageStore|loadSimilarityUsageSnapshot|recordSimilarityUsageIncrement/,
  'Route must not import or call the new usage store module in this phase (no route integration yet)',
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
  /similarityUsageStore|loadSimilarityUsageSnapshot|recordSimilarityUsageIncrement|SimilarityUsageStoreInput/,
  'src/pages/chart-ai.astro must not reference the new Phase 3FC-E usage store module in this phase',
);
assertNotMatchIn(
  authSubjectResolverSource,
  /similarityUsageStore|loadSimilarityUsageSnapshot|recordSimilarityUsageIncrement/,
  'The Phase 3FC-C auth subject resolver must not be modified to reference the new usage store module',
);
assertMatchIn(
  authSubjectResolverSource,
  /export const resolveSimilarityAuthSubject\s*=/,
  'The Phase 3FC-C auth subject resolver export must remain unchanged',
);
assertNotMatchIn(
  roleAssignmentResolverSource,
  /similarityUsageStore|loadSimilarityUsageSnapshot|recordSimilarityUsageIncrement/,
  'The Phase 3FC-D role assignment resolver must not be modified to reference the new usage store module',
);
assertMatchIn(
  roleAssignmentResolverSource,
  /export const resolveSimilarityRoleAssignment\s*=/,
  'The Phase 3FC-D role assignment resolver export must remain unchanged',
);

// --- Smoke script: forbidden imports/operations, and must not import a route module -------------

assertNotMatchIn(smokeSource, /from ['"]@supabase\//i, 'Smoke script must not import a Supabase package');
assertNotMatchIn(
  smokeSource,
  /pages[\\/]api[\\/]chart-ai[\\/]similarity/,
  'Smoke script must not import the similarity API route module',
);
assertMatchIn(smokeSource, /globalThis\.fetch\s*=/, 'Smoke script must monkeypatch fetch to detect any network call');
assertMatchIn(smokeSource, /fetchCalled/, 'Smoke script must assert fetch was never called');

// --- Safety: result types have safeMessage/warnings, no token/session payload fields -------------

assertMatchIn(typesSource, /safeMessage:\s*string;/, 'Usage store result types must declare safeMessage: string');
assertMatchIn(typesSource, /warnings:\s*string\[\];/, 'Usage store result types must declare warnings: string[]');
assertNotMatchIn(
  typesSource,
  /rawSessionPayload|sessionToken|tokenValue/i,
  'Usage store result types must not declare a raw session/token payload field',
);

// --- Contract doc: required section headers ------------------------------------------------------

const REQUIRED_CONTRACT_DOC_SECTIONS = [
  'Purpose',
  'Inputs',
  'Outputs',
  'Policy Defaults',
  'Approved Limit Table',
  'Mocked Scaffold Behavior',
  'Security Boundary',
  'Future Integration',
];
assertMatchIn(
  contractDocSource,
  /^# Phase 3FC-E Usage Store Interface Contract/m,
  'Contract doc must have the exact title heading',
);
assertTrue(
  REQUIRED_CONTRACT_DOC_SECTIONS.every((section) => new RegExp(`^##\\s*\\d+\\.\\s*${section}\\b`, 'm').test(contractDocSource)),
  `Contract doc must contain all required numbered section headers (${REQUIRED_CONTRACT_DOC_SECTIONS.join(', ')})`,
);

// --- Result doc: required section headers --------------------------------------------------------

const REQUIRED_RESULT_DOC_SECTIONS = [
  'Status',
  'Background',
  'Implemented Scope',
  'Usage Store Contract Result',
  'Smoke Result',
  'Boundary Preservation',
  'Validation',
  'Implementation Implication',
  'Recommended Next Phase',
];
assertMatchIn(
  resultDocSource,
  /^# Phase 3FC-E — Usage Store Interface Scaffold Result/m,
  'Result doc must have the exact title heading',
);
assertTrue(
  REQUIRED_RESULT_DOC_SECTIONS.every((section) => new RegExp(`^##\\s*\\d+\\.\\s*${section}\\b`, 'm').test(resultDocSource)),
  `Result doc must contain all required numbered section headers (${REQUIRED_RESULT_DOC_SECTIONS.join(', ')})`,
);
assertMatchIn(
  resultDocSource,
  /Phase 3FC-F\b/,
  'Result doc must reference Phase 3FC-F as a recommended next phase',
);
assertMatchIn(
  resultDocSource,
  /Phase 3FC-F-ALT/,
  'Result doc must reference Phase 3FC-F-ALT as an alternative next phase',
);

if (failures.length > 0) {
  process.stdout.write(`Phase 3FC-E checker: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
  for (const failure of failures) {
    process.stdout.write(`  - ${failure}\n`);
  }
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3FC-E checker: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  process.exitCode = 0;
}
