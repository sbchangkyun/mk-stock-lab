/**
 * Static contract checker for Phase 3FC-D (Role Assignment Resolver Scaffold, Disabled by
 * Default, No Live KIS).
 *
 * Inspects the new source/doc/script files as raw text (no build, no dev server, no browser, no
 * live KIS) and asserts: the resolver type contract exposes the full anonymous/authenticated/
 * beta/owner/admin role set but never introduces a token/account/trading/balance field; the
 * default policy is disabled with every real-capability boolean false, including
 * `allowOwnerAdminBypassWithoutAssignment`; the resolver never imports Supabase/KIS/API route
 * modules, never reads process.env/cookies/headers, never calls fetch; beta/owner/admin are
 * producible only from an explicit, matching, active assignment record; a client-claimed role or
 * subject is always ignored and only produces a safe warning; the fixtures are synthetic and
 * deterministic; the pre-existing similarity route, chart-ai UI, and prior exports (including the
 * Phase 3FC-C auth subject resolver) are untouched by this phase. This is a focused checker (a
 * bounded assertion list), not a full historical checker suite.
 *
 * Run:
 *   npm run check:phase-3fc-d-role-assignment-resolver-scaffold
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

const TYPES_PATH = 'src/lib/server/chartSimilarity/similarityRoleAssignmentResolverTypes.ts';
const RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityRoleAssignmentResolver.ts';
const FIXTURES_PATH = 'src/lib/server/chartSimilarity/mockedSimilarityRoleAssignmentResolverFixtures.ts';
const INDEX_PATH = 'src/lib/server/chartSimilarity/index.ts';
const SMOKE_PATH = 'scripts/smoke_phase_3fc_d_role_assignment_resolver_scaffold.mjs';
const CONTRACT_DOC_PATH = 'docs/planning/phase_3fc_d_role_assignment_resolver_contract_v0.1.md';
const RESULT_DOC_PATH = 'docs/planning/phase_3fc_d_role_assignment_resolver_scaffold_result_v0.1.md';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON_PATH = 'package.json';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const CHART_AI_UI_PATH = 'src/pages/chart-ai.astro';
const AUTH_SUBJECT_RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityAuthSubjectResolver.ts';

for (const path of [
  TYPES_PATH,
  RESOLVER_PATH,
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
]) {
  assertTrue(existsSync(path), `Required file must exist: ${path}`);
}

const typesSource = readSource(TYPES_PATH);
const resolverSource = readSource(RESOLVER_PATH);
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

// --- package.json: new script lines registered --------------------------------------------------

assertMatchIn(
  packageJsonSource,
  /"smoke:phase-3fc-d-role-assignment-resolver-scaffold":\s*"node scripts\/smoke_phase_3fc_d_role_assignment_resolver_scaffold\.mjs"/,
  'package.json must register the new smoke script',
);
assertMatchIn(
  packageJsonSource,
  /"check:phase-3fc-d-role-assignment-resolver-scaffold":\s*"node scripts\/check_phase_3fc_d_role_assignment_resolver_scaffold_contract\.mjs"/,
  'package.json must register this checker script',
);

// --- Changelog entry -----------------------------------------------------------------------------

assertMatchIn(changelogSource, /##\s*Phase 3FC-D\s*-\s*2026-07-04/, 'planning_changelog.md must contain a Phase 3FC-D entry dated 2026-07-04');

// --- Type contract: required exported type names --------------------------------------------------

const REQUIRED_TYPE_NAMES = [
  'SimilarityRoleAssignmentRole',
  'SimilarityRoleAssignmentResolverStatus',
  'SimilarityRoleAssignmentSource',
  'SimilarityRoleAssignmentSubjectRef',
  'SimilarityRoleAssignmentRecord',
  'SimilarityRoleAssignmentResolverInput',
  'SimilarityRoleAssignmentResolverPolicy',
  'SimilarityRoleAssignmentResolverSafePolicySummary',
  'SimilarityRoleAssignmentResolverResult',
];
assertTrue(
  REQUIRED_TYPE_NAMES.every((typeName) => new RegExp(`export type ${typeName}\\b`).test(typesSource)),
  `Type contract must export all required type names (${REQUIRED_TYPE_NAMES.join(', ')})`,
);

// --- Type contract: full role set, and beta/owner/admin only via an assignable record -----------

assertMatchIn(
  typesSource,
  /export type SimilarityRoleAssignmentRole = 'anonymous' \| 'authenticated' \| 'beta' \| 'owner' \| 'admin';/,
  'SimilarityRoleAssignmentRole must include the full anonymous/authenticated/beta/owner/admin set',
);
assertMatchIn(
  typesSource,
  /role:\s*Exclude<SimilarityRoleAssignmentRole,\s*'anonymous'\s*\|\s*'authenticated'>;/,
  'SimilarityRoleAssignmentRecord.role must be restricted to beta/owner/admin only (Exclude anonymous|authenticated)',
);

// --- Type contract: forbidden field/type names ----------------------------------------------------

const FORBIDDEN_TYPE_FIELD_NAMES = ['userId', 'accessToken', 'refreshToken', 'jwt', 'account', 'trading', 'balance'];
assertTrue(
  FORBIDDEN_TYPE_FIELD_NAMES.every((forbiddenName) => !new RegExp(`\\b${forbiddenName}\\s*[:?]`, 'i').test(typesSource)),
  `Type contract must never declare a field named any of: ${FORBIDDEN_TYPE_FIELD_NAMES.join(', ')}`,
);

// --- Type contract: policy real-capability booleans fixed to false (literal type) ----------------

const POLICY_LITERAL_FALSE_FIELDS = [
  'allowRealRoleStore',
  'allowSupabaseClient',
  'allowEnvRead',
  'allowDbRead',
  'allowCookieRead',
  'allowHeaderRead',
  'allowClientClaimedRole',
  'allowClientClaimedSubject',
  'allowAnonymousExecution',
  'allowOwnerAdminBypassWithoutAssignment',
  'allowRouteSuccess',
  'allowPublicExecution',
  'allowBetaExecution',
];
assertTrue(
  POLICY_LITERAL_FALSE_FIELDS.every((field) => new RegExp(`${field}:\\s*false;`).test(typesSource)),
  `Policy type must fix all real-capability booleans to the literal type false (${POLICY_LITERAL_FALSE_FIELDS.join(', ')})`,
);

// --- Resolver module: required exported functions ---------------------------------------------

const REQUIRED_RESOLVER_FUNCTIONS = [
  'buildDefaultSimilarityRoleAssignmentResolverPolicy',
  'buildMockedSimilarityRoleAssignmentResolverPolicy',
  'normalizeSimilarityRoleAssignmentResolverInput',
  'resolveSimilarityRoleAssignment',
  'assertSimilarityRoleAssignmentResolverResultIsSafe',
];
assertTrue(
  REQUIRED_RESOLVER_FUNCTIONS.every((fnName) => new RegExp(`export const ${fnName}\\s*=`).test(resolverSource)),
  `Resolver module must export all required functions (${REQUIRED_RESOLVER_FUNCTIONS.join(', ')})`,
);

// --- Resolver module: default policy booleans (disabled + all real-capability false) -----------

assertMatchIn(resolverSource, /enabled:\s*false,/, 'Default policy builder must set enabled: false');
assertTrue(
  POLICY_LITERAL_FALSE_FIELDS.every((field) => new RegExp(`${field}:\\s*false,`).test(resolverSource)),
  `Default policy builder must set all real-capability booleans to false (${POLICY_LITERAL_FALSE_FIELDS.join(', ')})`,
);

// --- Resolver module: required status paths exist -----------------------------------------------

const REQUIRED_STATUS_PATHS = [
  "'disabled'",
  "'anonymous'",
  "'default_authenticated'",
  "'assigned'",
  "'invalid_subject'",
];
assertTrue(
  REQUIRED_STATUS_PATHS.every((status) => resolverSource.includes(status)),
  `Resolver must produce all required status paths (${REQUIRED_STATUS_PATHS.join(', ')})`,
);
assertMatchIn(resolverSource, /if \(!policy\.enabled\)/, 'Resolver must short-circuit when the policy is disabled');
assertMatchIn(
  resolverSource,
  /input\.authState === 'anonymous' \|\| input\.roleSeed === 'anonymous' \|\| !input\.subject/,
  'Resolver must treat anonymous authState, anonymous roleSeed, or a missing subject as anonymous',
);
assertMatchIn(
  resolverSource,
  /activeMatching\.length === 0/,
  'Resolver must explicitly branch on no active matching assignment (default-authenticated fallback)',
);
assertMatchIn(
  resolverSource,
  /activeMatching\.length > 1/,
  'Resolver must explicitly branch on multiple active matching assignments',
);
assertMatchIn(
  resolverSource,
  /record\.subjectRef === subject\.subjectRef && record\.active/,
  'Resolver must match assignment records by subjectRef and require active: true before escalating a role',
);

// --- Resolver module: inactive/multiple assignment ignored warnings -----------------------------

assertMatchIn(resolverSource, /'assignment_ignored'/, "Resolver must record an 'assignment_ignored' warning for an inactive/mismatched assignment");
assertMatchIn(
  resolverSource,
  /'multiple_assignments_ignored'/,
  "Resolver must record a 'multiple_assignments_ignored' warning when more than one active assignment matches",
);

// --- Resolver module: client-claimed role/subject ignored, only a warning is recorded ----------

assertMatchIn(
  resolverSource,
  /input\.clientClaimedRole \|\| input\.clientClaimedSubject/,
  'Resolver must check for a client-claimed role or subject',
);
assertMatchIn(
  resolverSource,
  /'client_claim_ignored'/,
  "Resolver must record a 'client_claim_ignored' warning rather than trusting the claim",
);
assertNotMatchIn(
  resolverSource,
  /role:\s*input\.clientClaimedRole|subjectRef:\s*input\.clientClaimedSubject/,
  'Resolver must never assign role or subjectRef directly from a client-claimed value',
);

// --- Resolver module: no owner/admin bypass without an explicit active assignment ----------------

assertNotMatchIn(
  resolverSource,
  /role:\s*'owner'|role:\s*'admin'/,
  'Resolver must never hardcode role: owner/admin outside of an assignment-derived value (no bypass)',
);
assertMatchIn(
  resolverSource,
  /role:\s*matched\.role/,
  'Resolver must derive an assigned role only from a matched assignment record, never a literal owner/admin',
);

// --- Resolver module: forbidden imports/operations ----------------------------------------------

assertNotMatchIn(resolverSource, /from ['"]@supabase\//i, 'Resolver module must not import a Supabase package');
assertNotMatchIn(resolverSource, /createClient\(/, 'Resolver module must not call createClient(...)');
assertNotMatchIn(resolverSource, /process\.env(\.\w+|\[)/, 'Resolver module must never access process.env');
assertNotMatchIn(resolverSource, /from ['"]dotenv['"]/, 'Resolver module must not import dotenv');
assertNotMatchIn(resolverSource, /readFileSync\(['"]\.env|\.env['"]/, 'Resolver module must not reference an .env file path');
assertNotMatchIn(resolverSource, /\bfetch\(/, 'Resolver module must never call fetch(...)');
assertNotMatchIn(
  resolverSource,
  /document\.cookie|req\.headers|request\.headers|\.headers\.get\(/,
  'Resolver module must never read cookies or request headers',
);
assertNotMatchIn(
  resolverSource,
  /kisOhlcProvider|serverOnlyKisOhlcProvider|mockedKisOhlcAdapter|from ['"]\.\.\/providers/,
  'Resolver module must not import a KIS provider module',
);
assertNotMatchIn(
  resolverSource,
  /pages[\\/]api|similarityApiRouteShell/,
  'Resolver module must not import an API route module',
);
assertNotMatchIn(
  resolverSource,
  /\bCREATE TABLE\b|\bINSERT INTO\b|\.sql['"]|\/migrations\//i,
  'Resolver module must not contain SQL or migration references',
);
assertNotMatchIn(
  resolverSource,
  /accountId|tradingAccount|orderId|balanceAmount/i,
  'Resolver module must not reference account/trading/order/balance API fields',
);

// --- Fixtures: required exported builders, synthetic values only --------------------------------

const REQUIRED_FIXTURE_NAMES = [
  'buildMockedAnonymousRoleAssignmentResolverInput',
  'buildMockedAuthenticatedNoAssignmentRoleResolverInput',
  'buildMockedBetaRoleAssignmentResolverInput',
  'buildMockedOwnerRoleAssignmentResolverInput',
  'buildMockedAdminRoleAssignmentResolverInput',
  'buildMockedInactiveAssignmentIgnoredResolverInput',
  'buildMockedMultipleAssignmentsIgnoredResolverInput',
  'buildMockedClientClaimedRoleIgnoredRoleResolverInput',
];
assertTrue(
  REQUIRED_FIXTURE_NAMES.every((fixtureName) => new RegExp(`export const ${fixtureName} = \\(`).test(fixturesSource)),
  `Fixtures must export all required builders (${REQUIRED_FIXTURE_NAMES.join(', ')})`,
);
assertNotMatchIn(
  fixturesSource,
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
  /subjectRef:\s*'mock-subject-|'mock-subject-/,
  'Fixtures must use synthetic mock-subject-* subject references',
);
assertMatchIn(
  fixturesSource,
  /'mock-role-assigner-/,
  'Fixtures must use a synthetic mock-role-assigner-* assignedByRef',
);

// --- Exports: index.ts exposes new types/functions/fixtures without disturbing prior exports ----

assertTrue(
  REQUIRED_TYPE_NAMES.every((typeName) => new RegExp(`${typeName},?`).test(indexSource)),
  `index.ts must export all required types (${REQUIRED_TYPE_NAMES.join(', ')})`,
);
assertTrue(
  REQUIRED_RESOLVER_FUNCTIONS.every((fnName) => new RegExp(`${fnName},`).test(indexSource)),
  `index.ts must export all required resolver functions (${REQUIRED_RESOLVER_FUNCTIONS.join(', ')})`,
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
  /buildOwnerLocalAuthUsageBridgeSimilarityApiResponse,/,
  'index.ts must still export the pre-existing buildOwnerLocalAuthUsageBridgeSimilarityApiResponse (no removed exports)',
);
assertMatchIn(
  indexSource,
  /runMockedProviderCompatibleSimilarityIntegration,/,
  'index.ts must still export the pre-existing runMockedProviderCompatibleSimilarityIntegration (no removed exports)',
);

// --- Runtime boundary: similarity route, chart-ai UI, and 3FC-C resolver unchanged --------------

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
  /similarityRoleAssignmentResolver|resolveSimilarityRoleAssignment/,
  'Route must not import or call the new role assignment resolver in this phase (no route integration yet)',
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
  /similarityRoleAssignmentResolver|resolveSimilarityRoleAssignment|SimilarityRoleAssignmentResolverInput/,
  'src/pages/chart-ai.astro must not reference the new Phase 3FC-D role assignment resolver in this phase',
);
assertNotMatchIn(
  authSubjectResolverSource,
  /similarityRoleAssignmentResolver|resolveSimilarityRoleAssignment/,
  'The Phase 3FC-C auth subject resolver must not be modified to reference the new role assignment resolver',
);
assertMatchIn(
  authSubjectResolverSource,
  /export const resolveSimilarityAuthSubject\s*=/,
  'The Phase 3FC-C auth subject resolver export must remain unchanged',
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

// --- Safety: result type has safeMessage/warnings, no token/session payload fields ---------------

assertMatchIn(typesSource, /safeMessage:\s*string;/, 'Resolver result type must declare safeMessage: string');
assertMatchIn(typesSource, /warnings:\s*string\[\];/, 'Resolver result type must declare warnings: string[]');
assertNotMatchIn(
  typesSource,
  /rawSessionPayload|sessionToken|tokenValue/i,
  'Resolver result type must not declare a raw session/token payload field',
);

// --- Contract doc: required section headers ------------------------------------------------------

const REQUIRED_CONTRACT_DOC_SECTIONS = [
  'Purpose',
  'Inputs',
  'Outputs',
  'Policy Defaults',
  'Mocked Scaffold Behavior',
  'Security Boundary',
  'Future Integration',
];
assertMatchIn(
  contractDocSource,
  /^# Phase 3FC-D Role Assignment Resolver Contract/m,
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
  'Resolver Contract',
  'Smoke Result',
  'Boundary Preservation',
  'Validation',
  'Implementation Implication',
  'Recommended Next Phase',
];
assertMatchIn(
  resultDocSource,
  /^# Phase 3FC-D — Role Assignment Resolver Scaffold Result/m,
  'Result doc must have the exact title heading',
);
assertTrue(
  REQUIRED_RESULT_DOC_SECTIONS.every((section) => new RegExp(`^##\\s*\\d+\\.\\s*${section}\\b`, 'm').test(resultDocSource)),
  `Result doc must contain all required numbered section headers (${REQUIRED_RESULT_DOC_SECTIONS.join(', ')})`,
);
assertMatchIn(
  resultDocSource,
  /Phase 3FC-E\b/,
  'Result doc must reference Phase 3FC-E as a recommended next phase',
);
assertMatchIn(
  resultDocSource,
  /Phase 3FC-E-ALT/,
  'Result doc must reference Phase 3FC-E-ALT as an alternative next phase',
);

if (failures.length > 0) {
  process.stdout.write(`Phase 3FC-D checker: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
  for (const failure of failures) {
    process.stdout.write(`  - ${failure}\n`);
  }
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3FC-D checker: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  process.exitCode = 0;
}
