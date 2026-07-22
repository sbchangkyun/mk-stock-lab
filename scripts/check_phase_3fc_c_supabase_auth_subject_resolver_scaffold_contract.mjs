/**
 * Static contract checker for Phase 3FC-C (Supabase Auth Subject Resolver Scaffold, Disabled by
 * Default, No Live KIS).
 *
 * Inspects the new source/doc/script files as raw text (no build, no dev server, no browser, no
 * live KIS) and asserts: the resolver type contract is scoped to anonymous/authenticated role
 * seeds only and never introduces a token/account/trading/balance field; the default policy is
 * disabled with every real-capability boolean false; the resolver never imports Supabase/KIS/API
 * route modules, never reads process.env/cookies/headers, never calls fetch; client-claimed
 * role/subject is always ignored and only produces a safe warning; the fixtures are synthetic and
 * deterministic; the pre-existing similarity route, chart-ai UI, and prior exports are untouched
 * by this phase. This is a focused checker (a bounded assertion list), not a full historical
 * checker suite.
 *
 * Run:
 *   npm run check:phase-3fc-c-supabase-auth-subject-resolver-scaffold
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

const TYPES_PATH = 'src/lib/server/chartSimilarity/similarityAuthSubjectResolverTypes.ts';
const RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityAuthSubjectResolver.ts';
const FIXTURES_PATH = 'src/lib/server/chartSimilarity/mockedSimilarityAuthSubjectResolverFixtures.ts';
const INDEX_PATH = 'src/lib/server/chartSimilarity/index.ts';
const SMOKE_PATH = 'scripts/smoke_phase_3fc_c_supabase_auth_subject_resolver_scaffold.mjs';
const CONTRACT_DOC_PATH = 'docs/planning/phase_3fc_c_auth_subject_resolver_contract_v0.1.md';
const RESULT_DOC_PATH = 'docs/planning/phase_3fc_c_supabase_auth_subject_resolver_scaffold_result_v0.1.md';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON_PATH = 'package.json';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const CHART_AI_UI_PATH = 'src/pages/chart-ai.astro';

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

// --- package.json: new script lines registered --------------------------------------------------

assertMatchIn(
  packageJsonSource,
  /"smoke:phase-3fc-c-supabase-auth-subject-resolver-scaffold":\s*"node scripts\/smoke_phase_3fc_c_supabase_auth_subject_resolver_scaffold\.mjs"/,
  'package.json must register the new smoke script',
);
assertMatchIn(
  packageJsonSource,
  /"check:phase-3fc-c-supabase-auth-subject-resolver-scaffold":\s*"node scripts\/check_phase_3fc_c_supabase_auth_subject_resolver_scaffold_contract\.mjs"/,
  'package.json must register this checker script',
);

// --- Changelog entry -----------------------------------------------------------------------------

assertMatchIn(changelogSource, /##\s*Phase 3FC-C\s*-\s*2026-07-04/, 'planning_changelog.md must contain a Phase 3FC-C entry dated 2026-07-04');

// --- Type contract: required exported type names --------------------------------------------------

const REQUIRED_TYPE_NAMES = [
  'SimilarityAuthSubjectProvider',
  'SimilarityAuthSubjectResolverStatus',
  'SimilarityAuthSubjectAuthState',
  'SimilarityAuthSubjectRoleSeed',
  'SimilarityAuthSubjectResolverInput',
  'SimilarityAuthSubjectMockSessionCandidate',
  'SimilarityAuthSubjectSafeRef',
  'SimilarityAuthSubjectResolverPolicy',
  'SimilarityAuthSubjectResolverResult',
];
assertTrue(
  REQUIRED_TYPE_NAMES.every((typeName) => new RegExp(`export type ${typeName}\\b`).test(typesSource)),
  `Type contract must export all required type names (${REQUIRED_TYPE_NAMES.join(', ')})`,
);

// --- Type contract: role seed is scoped to anonymous/authenticated only --------------------------

assertMatchIn(
  typesSource,
  /export type SimilarityAuthSubjectRoleSeed = 'anonymous' \| 'authenticated';/,
  'SimilarityAuthSubjectRoleSeed must be limited to anonymous | authenticated only',
);
assertNotMatchIn(
  typesSource,
  /SimilarityAuthSubjectRoleSeed\s*=[^;]*'beta'|SimilarityAuthSubjectRoleSeed\s*=[^;]*'owner'|SimilarityAuthSubjectRoleSeed\s*=[^;]*'admin'/,
  'SimilarityAuthSubjectRoleSeed must never include beta/owner/admin in this phase',
);

// --- Type contract: forbidden field/type names ----------------------------------------------------

const FORBIDDEN_TYPE_FIELD_NAMES = ['userId', 'accessToken', 'refreshToken', 'jwt', 'account', 'trading', 'balance'];
assertTrue(
  FORBIDDEN_TYPE_FIELD_NAMES.every((forbiddenName) => !new RegExp(`\\b${forbiddenName}\\s*[:?]`, 'i').test(typesSource)),
  `Type contract must never declare a field named any of: ${FORBIDDEN_TYPE_FIELD_NAMES.join(', ')}`,
);

// --- Type contract: policy real-capability booleans fixed to false (literal type) ----------------

const POLICY_LITERAL_FALSE_FIELDS = [
  'allowRealSupabaseClient',
  'allowEnvRead',
  'allowCookieRead',
  'allowHeaderRead',
  'allowClientClaimedSubject',
  'allowClientClaimedRole',
  'allowTokenEcho',
  'allowRawSessionEcho',
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
  'buildDefaultSimilarityAuthSubjectResolverPolicy',
  'buildMockedSimilarityAuthSubjectResolverPolicy',
  'normalizeSimilarityAuthSubjectResolverInput',
  'resolveSimilarityAuthSubject',
  'assertSimilarityAuthSubjectResolverResultIsSafe',
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

// --- Resolver module: default-disabled / missing-session / invalid-session paths exist ---------

assertMatchIn(resolverSource, /if \(!policy\.enabled\)/, 'Resolver must short-circuit when the policy is disabled');
assertMatchIn(resolverSource, /'disabled'/, "Resolver must produce a 'disabled' status path");
assertMatchIn(resolverSource, /'anonymous'/, "Resolver must produce an 'anonymous' status path");
assertMatchIn(resolverSource, /'invalid_context'/, "Resolver must produce an 'invalid_context' status path");
assertMatchIn(resolverSource, /'authenticated'/, "Resolver must produce an 'authenticated' status path");
assertMatchIn(
  resolverSource,
  /candidate\.state === 'invalid'/,
  'Resolver must explicitly branch on an invalid mocked session candidate state',
);
assertMatchIn(
  resolverSource,
  /candidate\.state === 'missing'|!candidate \|\| candidate\.state === 'missing'/,
  'Resolver must explicitly branch on a missing mocked session candidate state',
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
  /roleSeed:\s*input\.clientClaimedRole|subjectRef:\s*input\.clientClaimedSubject/,
  'Resolver must never assign roleSeed or subjectRef directly from a client-claimed value',
);

// --- Resolver module: valid-mocked-session-only-under-mocked-policy (guarded by policy.enabled) --

const enabledCheckIndex = resolverSource.indexOf('if (!policy.enabled)');
const candidateCheckIndex = resolverSource.indexOf('const candidate = input.serverSessionCandidate');
assertTrue(
  enabledCheckIndex !== -1 && candidateCheckIndex !== -1 && enabledCheckIndex < candidateCheckIndex,
  'Resolver must check policy.enabled before ever branching on the mocked session candidate',
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
  'buildMockedMissingSupabaseSessionResolverInput',
  'buildMockedValidSupabaseSessionResolverInput',
  'buildMockedInvalidSupabaseSessionResolverInput',
  'buildMockedClientClaimedRoleIgnoredResolverInput',
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
  /subjectRef:\s*'mock-subject-/,
  'Fixtures must use synthetic mock-subject-* subject references',
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
  /buildOwnerLocalAuthUsageBridgeSimilarityApiResponse,/,
  'index.ts must still export the pre-existing buildOwnerLocalAuthUsageBridgeSimilarityApiResponse (no removed exports)',
);
assertMatchIn(
  indexSource,
  /runMockedProviderCompatibleSimilarityIntegration,/,
  'index.ts must still export the pre-existing runMockedProviderCompatibleSimilarityIntegration (no removed exports)',
);

// --- Runtime boundary: similarity route and chart-ai UI unchanged by this phase -----------------

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
  /similarityAuthSubjectResolver|resolveSimilarityAuthSubject/,
  'Route must not import or call the new auth subject resolver in this phase (no route integration yet)',
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
  /similarityAuthSubjectResolver|resolveSimilarityAuthSubject|SimilarityAuthSubjectResolverInput/,
  'src/pages/chart-ai.astro must not reference the new Phase 3FC-C auth subject resolver in this phase',
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
  /^# Phase 3FC-C Auth Subject Resolver Contract/m,
  'Contract doc must have the exact title heading',
);
assertTrue(
  REQUIRED_CONTRACT_DOC_SECTIONS.every((section) => new RegExp(`^##\\s*${section}\\b`, 'm').test(contractDocSource)),
  `Contract doc must contain all required section headers (${REQUIRED_CONTRACT_DOC_SECTIONS.join(', ')})`,
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
  /^# Phase 3FC-C — Supabase Auth Subject Resolver Scaffold Result/m,
  'Result doc must have the exact title heading',
);
assertTrue(
  REQUIRED_RESULT_DOC_SECTIONS.every((section) => new RegExp(`^##\\s*${section}\\b`, 'm').test(resultDocSource)),
  `Result doc must contain all required section headers (${REQUIRED_RESULT_DOC_SECTIONS.join(', ')})`,
);
assertMatchIn(
  resultDocSource,
  /Phase 3FC-D/,
  'Result doc must reference Phase 3FC-D as a recommended next phase',
);
assertMatchIn(
  resultDocSource,
  /Phase 3FC-D-ALT/,
  'Result doc must reference Phase 3FC-D-ALT as an alternative next phase',
);

if (failures.length > 0) {
  process.stdout.write(`Phase 3FC-C checker: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
  for (const failure of failures) {
    process.stdout.write(`  - ${failure}\n`);
  }
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3FC-C checker: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  process.exitCode = 0;
}
