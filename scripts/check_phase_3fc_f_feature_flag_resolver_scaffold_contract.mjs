/**
 * Static contract checker for Phase 3FC-F (Feature Flag Resolver Scaffold, Disabled by Default,
 * No Live KIS).
 *
 * Inspects the new source/doc/script files as raw text (no build, no dev server, no browser, no
 * live KIS) and asserts: the feature flag type contract exposes the five approved flag keys and
 * the required capability/status/source sets but never introduces a token/account/trading/balance
 * field; the default policy is disabled with every real-capability boolean false; the mocked
 * scaffold policy still grants no real capability; the resolver module never imports
 * Supabase/KIS/API route modules, never reads process.env/import.meta.env/cookies/headers, never
 * calls fetch; `routeSuccessAllowed`/`betaExecutionAllowed`/`publicExecutionAllowed`/`liveKisAllowed`
 * always remain false; a client-claimed flag set is always ignored and only produces a safe
 * warning; the fixtures are synthetic and deterministic; the pre-existing similarity route,
 * chart-ai UI, and prior exports (including the Phase 3FC-C auth subject resolver, Phase 3FC-D
 * role assignment resolver, and Phase 3FC-E usage store) are untouched by this phase. This is a
 * focused checker (a bounded assertion list), not a full historical checker suite.
 *
 * Run:
 *   npm run check:phase-3fc-f-feature-flag-resolver-scaffold
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

const TYPES_PATH = 'src/lib/server/chartSimilarity/similarityFeatureFlagResolverTypes.ts';
const RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityFeatureFlagResolver.ts';
const FIXTURES_PATH = 'src/lib/server/chartSimilarity/mockedSimilarityFeatureFlagResolverFixtures.ts';
const INDEX_PATH = 'src/lib/server/chartSimilarity/index.ts';
const SMOKE_PATH = 'scripts/smoke_phase_3fc_f_feature_flag_resolver_scaffold.mjs';
const CONTRACT_DOC_PATH = 'docs/planning/phase_3fc_f_feature_flag_resolver_contract_v0.1.md';
const RESULT_DOC_PATH = 'docs/planning/phase_3fc_f_feature_flag_resolver_scaffold_result_v0.1.md';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON_PATH = 'package.json';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const CHART_AI_UI_PATH = 'src/pages/chart-ai.astro';
const AUTH_SUBJECT_RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityAuthSubjectResolver.ts';
const ROLE_ASSIGNMENT_RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityRoleAssignmentResolver.ts';
const USAGE_STORE_PATH = 'src/lib/server/chartSimilarity/similarityUsageStore.ts';

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
  ROLE_ASSIGNMENT_RESOLVER_PATH,
  USAGE_STORE_PATH,
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
const roleAssignmentResolverSource = readSource(ROLE_ASSIGNMENT_RESOLVER_PATH);
const usageStoreSource = readSource(USAGE_STORE_PATH);

// --- package.json: new script lines registered --------------------------------------------------

assertMatchIn(
  packageJsonSource,
  /"smoke:phase-3fc-f-feature-flag-resolver-scaffold":\s*"node scripts\/smoke_phase_3fc_f_feature_flag_resolver_scaffold\.mjs"/,
  'package.json must register the new smoke script',
);
assertMatchIn(
  packageJsonSource,
  /"check:phase-3fc-f-feature-flag-resolver-scaffold":\s*"node scripts\/check_phase_3fc_f_feature_flag_resolver_scaffold_contract\.mjs"/,
  'package.json must register this checker script',
);

// --- Changelog entry -----------------------------------------------------------------------------

assertMatchIn(changelogSource, /##\s*Phase 3FC-F\s*-\s*2026-07-04/, 'planning_changelog.md must contain a Phase 3FC-F entry dated 2026-07-04');

// --- Type contract: required exported type names --------------------------------------------------

const REQUIRED_TYPE_NAMES = [
  'SimilarityFeatureFlagKey',
  'SimilarityFeatureFlagResolverStatus',
  'SimilarityFeatureFlagSource',
  'SimilarityFeatureFlagCapability',
  'SimilarityFeatureFlagRecord',
  'SimilarityFeatureFlagResolverInput',
  'SimilarityFeatureFlagResolverPolicy',
  'SimilarityFeatureFlagResolverSafePolicySummary',
  'SimilarityFeatureFlagState',
  'SimilarityFeatureFlagGateState',
  'SimilarityFeatureFlagResolverResult',
];
assertTrue(
  REQUIRED_TYPE_NAMES.every((typeName) => new RegExp(`export type ${typeName}\\b`).test(typesSource)),
  `Type contract must export all required type names (${REQUIRED_TYPE_NAMES.join(', ')})`,
);

// --- Type contract: five approved flag keys, six capabilities -------------------------------------

const REQUIRED_FLAG_KEYS = [
  'AUTH_RUNTIME_ENABLED',
  'USAGE_STORAGE_ENABLED',
  'CHART_AI_SIMILARITY_BETA_ENABLED',
  'CHART_AI_SIMILARITY_PUBLIC_ENABLED',
  'LIVE_KIS_OHLC_ENABLED',
];
assertTrue(
  REQUIRED_FLAG_KEYS.every((key) => typesSource.includes(`'${key}'`)),
  `Type contract must include all five approved flag keys (${REQUIRED_FLAG_KEYS.join(', ')})`,
);

const REQUIRED_CAPABILITIES = [
  'auth_runtime',
  'usage_storage',
  'beta_similarity',
  'public_similarity',
  'live_kis_ohlc',
  'route_success',
];
assertTrue(
  REQUIRED_CAPABILITIES.every((capability) => typesSource.includes(`'${capability}'`)),
  `Type contract must include all required capability keys (${REQUIRED_CAPABILITIES.join(', ')})`,
);

// --- Type contract: gate state must include every required boolean field -------------------------

const REQUIRED_GATE_FIELDS = [
  'authRuntimeReady',
  'usageStorageReady',
  'betaFlagReady',
  'betaDependenciesSatisfied',
  'publicFlagReady',
  'publicDependenciesSatisfied',
  'liveKisFlagReady',
  'routeSuccessAllowed',
  'betaExecutionAllowed',
  'publicExecutionAllowed',
  'liveKisAllowed',
];
assertTrue(
  REQUIRED_GATE_FIELDS.every((field) => new RegExp(`${field}:\\s*boolean;`).test(typesSource)),
  `SimilarityFeatureFlagGateState must declare all required gate fields (${REQUIRED_GATE_FIELDS.join(', ')})`,
);

// --- Type contract: forbidden field/type names ----------------------------------------------------

const FORBIDDEN_TYPE_FIELD_NAMES = ['userId', 'accessToken', 'refreshToken', 'jwt', 'account', 'trading', 'balance'];
assertTrue(
  FORBIDDEN_TYPE_FIELD_NAMES.every((forbiddenName) => !new RegExp(`\\b${forbiddenName}\\s*[:?]`, 'i').test(typesSource)),
  `Type contract must never declare a field named any of: ${FORBIDDEN_TYPE_FIELD_NAMES.join(', ')}`,
);

// --- Type contract: policy real-capability booleans fixed to false (literal type) ----------------

const POLICY_LITERAL_FALSE_FIELDS = [
  'allowRealEnvRead',
  'allowVercelEnvRead',
  'allowSupabaseClient',
  'allowDbRead',
  'allowDbWrite',
  'allowSql',
  'allowCookieRead',
  'allowHeaderRead',
  'allowClientClaimedFlags',
  'allowRouteSuccess',
  'allowBetaExecution',
  'allowPublicExecution',
  'allowLiveKis',
];
assertTrue(
  POLICY_LITERAL_FALSE_FIELDS.every((field) => new RegExp(`${field}:\\s*false;`).test(typesSource)),
  `Policy type must fix all real-capability booleans to the literal type false (${POLICY_LITERAL_FALSE_FIELDS.join(', ')})`,
);

// --- Resolver module: required exported functions --------------------------------------------

const REQUIRED_RESOLVER_FUNCTIONS = [
  'buildDefaultSimilarityFeatureFlagResolverPolicy',
  'buildMockedSimilarityFeatureFlagResolverPolicy',
  'buildDefaultSimilarityFeatureFlagStates',
  'normalizeSimilarityFeatureFlagResolverInput',
  'resolveSimilarityFeatureFlags',
  'isSimilarityFeatureCapabilityAllowed',
  'assertSimilarityFeatureFlagResolverResultIsSafe',
];
assertTrue(
  REQUIRED_RESOLVER_FUNCTIONS.every((fnName) => new RegExp(`export const ${fnName}\\s*=`).test(resolverSource)),
  `Feature flag resolver module must export all required functions (${REQUIRED_RESOLVER_FUNCTIONS.join(', ')})`,
);

// --- Resolver module: default policy booleans (disabled + all real-capability false) --------

assertMatchIn(resolverSource, /enabled:\s*false,/, 'Default policy builder must set enabled: false');
assertTrue(
  POLICY_LITERAL_FALSE_FIELDS.every((field) => new RegExp(`${field}:\\s*false,`).test(resolverSource)),
  `Default policy builder must set all real-capability booleans to false (${POLICY_LITERAL_FALSE_FIELDS.join(', ')})`,
);

// --- Resolver module: mocked policy still grants no real capability ------------------------------

assertMatchIn(
  resolverSource,
  /buildMockedSimilarityFeatureFlagResolverPolicy = \(\): SimilarityFeatureFlagResolverPolicy => \(\{\s*\n\s*\.\.\.buildDefaultSimilarityFeatureFlagResolverPolicy\(\),\s*\n\s*enabled:\s*true,\s*\n\s*allowMockedFlagRead:\s*true,/,
  'Mocked policy builder must spread the default policy and only flip enabled/allowMockedFlagRead to true',
);

// --- Resolver module: required status paths exist --------------------------------------------

const REQUIRED_STATUS_PATHS = ["'disabled'", "'resolved'", "'dependency_blocked'", "'invalid_flag_set'"];
assertTrue(
  REQUIRED_STATUS_PATHS.every((status) => resolverSource.includes(status)),
  `Feature flag resolver module must produce all required status paths (${REQUIRED_STATUS_PATHS.join(', ')})`,
);
assertMatchIn(resolverSource, /if \(!policy\.enabled\)/, 'Feature flag resolver module must short-circuit when the policy is disabled');

// --- Resolver module: dependency gate formulas ----------------------------------------------------

assertMatchIn(
  resolverSource,
  /betaDependenciesSatisfied\s*=\s*betaFlagReady\s*&&\s*authRuntimeReady\s*&&\s*usageStorageReady/,
  'Feature flag resolver module must compute betaDependenciesSatisfied as betaFlagReady && authRuntimeReady && usageStorageReady',
);
assertMatchIn(
  resolverSource,
  /publicDependenciesSatisfied\s*=\s*publicFlagReady\s*&&\s*betaDependenciesSatisfied/,
  'Feature flag resolver module must compute publicDependenciesSatisfied as publicFlagReady && betaDependenciesSatisfied',
);
assertMatchIn(
  resolverSource,
  /routeSuccessAllowed:\s*false,/,
  'Feature flag resolver module must always set routeSuccessAllowed: false',
);
assertMatchIn(
  resolverSource,
  /betaExecutionAllowed:\s*false,/,
  'Feature flag resolver module must always set betaExecutionAllowed: false',
);
assertMatchIn(
  resolverSource,
  /publicExecutionAllowed:\s*false,/,
  'Feature flag resolver module must always set publicExecutionAllowed: false',
);
assertMatchIn(
  resolverSource,
  /liveKisAllowed:\s*false,/,
  'Feature flag resolver module must always set liveKisAllowed: false',
);

// --- Resolver module: required warnings exist ------------------------------------------------

const REQUIRED_WARNINGS = [
  'beta_missing_auth_dependency',
  'beta_missing_usage_dependency',
  'public_dependency_blocked',
  'public_activation_not_approved',
  'live_kis_activation_not_approved',
  'duplicate_flag_ignored',
  'flag_ignored',
  'client_claim_ignored',
];
assertTrue(
  REQUIRED_WARNINGS.every((warning) => resolverSource.includes(`'${warning}'`)),
  `Feature flag resolver module must record all required warnings (${REQUIRED_WARNINGS.join(', ')})`,
);

// --- Resolver module: client claim always ignored, never trusted ---------------------------------

assertMatchIn(
  resolverSource,
  /input\.clientClaimedFlags\s*!==\s*undefined/,
  'Feature flag resolver module must check for a client-claimed flags value',
);
assertNotMatchIn(
  resolverSource,
  /flags:\s*input\.clientClaimedFlags|stateMap\.set\([^)]*clientClaimedFlags/,
  'Feature flag resolver module must never assign flag state directly from a client-claimed value',
);

// --- Resolver module: forbidden imports/operations ---------------------------------------------

assertNotMatchIn(resolverSource, /from ['"]@supabase\//i, 'Feature flag resolver module must not import a Supabase package');
assertNotMatchIn(resolverSource, /createClient\(/, 'Feature flag resolver module must not call createClient(...)');
assertNotMatchIn(resolverSource, /process\.env(\.\w+|\[)/, 'Feature flag resolver module must never access process.env');
assertNotMatchIn(
  resolverSource,
  /import\.meta\.env(\.\w+|\[)/,
  'Feature flag resolver module must never access import.meta.env',
);
assertNotMatchIn(resolverSource, /from ['"]dotenv['"]/, 'Feature flag resolver module must not import dotenv');
assertNotMatchIn(resolverSource, /readFileSync\(['"]\.env|\.env['"]/, 'Feature flag resolver module must not reference an .env file path');
assertNotMatchIn(resolverSource, /VERCEL_ENV|VERCEL_URL/, 'Feature flag resolver module must not reference a Vercel environment variable');
assertNotMatchIn(resolverSource, /\bfetch\(/, 'Feature flag resolver module must never call fetch(...)');
assertNotMatchIn(
  resolverSource,
  /document\.cookie|req\.headers|request\.headers|\.headers\.get\(/,
  'Feature flag resolver module must never read cookies or request headers',
);
assertNotMatchIn(
  resolverSource,
  /kisOhlcProvider|serverOnlyKisOhlcProvider|mockedKisOhlcAdapter|from ['"]\.\.\/providers/,
  'Feature flag resolver module must not import a KIS provider module',
);
assertNotMatchIn(
  resolverSource,
  /pages[\\/]api|similarityApiRouteShell/,
  'Feature flag resolver module must not import an API route module',
);
assertNotMatchIn(
  resolverSource,
  /\bCREATE TABLE\b|\bINSERT INTO\b|\.sql['"]|\/migrations\//i,
  'Feature flag resolver module must not contain SQL or migration references',
);
assertNotMatchIn(
  resolverSource,
  /accountId|tradingAccount|orderId|balanceAmount/i,
  'Feature flag resolver module must not reference account/trading/order/balance API fields',
);

// --- Resolver module: safety assertion helper never trusts key names, only primitive values ------

assertMatchIn(
  resolverSource,
  /export const assertSimilarityFeatureFlagResolverResultIsSafe\s*=/,
  'Feature flag resolver module must export assertSimilarityFeatureFlagResolverResultIsSafe',
);
assertMatchIn(
  resolverSource,
  /collectPrimitiveValues/,
  'Feature flag resolver module must collect only primitive values (never key names) when checking result safety',
);

// --- Fixtures: required exported builders, synthetic values only --------------------------------

const REQUIRED_FIXTURE_NAMES = [
  'buildMockedAllFlagsOffFeatureFlagResolverInput',
  'buildMockedAuthOnlyFeatureFlagResolverInput',
  'buildMockedAuthUsageBetaReadyFeatureFlagResolverInput',
  'buildMockedBetaMissingAuthFeatureFlagResolverInput',
  'buildMockedBetaMissingUsageFeatureFlagResolverInput',
  'buildMockedPublicRequestedFeatureFlagResolverInput',
  'buildMockedLiveKisRequestedFeatureFlagResolverInput',
  'buildMockedDuplicateFlagIgnoredFeatureFlagResolverInput',
  'buildMockedClientClaimedFlagsIgnoredFeatureFlagResolverInput',
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
  /'mock-feature-flag-admin-/,
  'Fixtures must use a synthetic mock-feature-flag-admin-* updatedByRef',
);
assertNotMatchIn(
  fixturesSource,
  /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
  'Fixtures must not contain an IP-address-like string',
);

// --- Exports: index.ts exposes new types/functions/fixtures without disturbing prior exports ----

assertTrue(
  REQUIRED_TYPE_NAMES.every((typeName) => new RegExp(`${typeName},?`).test(indexSource)),
  `index.ts must export all required types (${REQUIRED_TYPE_NAMES.join(', ')})`,
);
assertTrue(
  REQUIRED_RESOLVER_FUNCTIONS.every((fnName) => new RegExp(`${fnName},`).test(indexSource)),
  `index.ts must export all required feature flag resolver functions (${REQUIRED_RESOLVER_FUNCTIONS.join(', ')})`,
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
  /loadSimilarityUsageSnapshot,/,
  'index.ts must still export the pre-existing Phase 3FC-E loadSimilarityUsageSnapshot (no removed exports)',
);
assertMatchIn(
  indexSource,
  /recordSimilarityUsageIncrement,/,
  'index.ts must still export the pre-existing Phase 3FC-E recordSimilarityUsageIncrement (no removed exports)',
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

// --- Runtime boundary: similarity route, chart-ai UI, and prior scaffolds unchanged -------------

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
  /similarityFeatureFlagResolver|resolveSimilarityFeatureFlags/,
  'Route must not import or call the new feature flag resolver module in this phase (no route integration yet)',
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
  /similarityFeatureFlagResolver|resolveSimilarityFeatureFlags|SimilarityFeatureFlagResolverInput/,
  'src/pages/chart-ai.astro must not reference the new Phase 3FC-F feature flag resolver module in this phase',
);
assertNotMatchIn(
  authSubjectResolverSource,
  /similarityFeatureFlagResolver|resolveSimilarityFeatureFlags/,
  'The Phase 3FC-C auth subject resolver must not be modified to reference the new feature flag resolver module',
);
assertMatchIn(
  authSubjectResolverSource,
  /export const resolveSimilarityAuthSubject\s*=/,
  'The Phase 3FC-C auth subject resolver export must remain unchanged',
);
assertNotMatchIn(
  roleAssignmentResolverSource,
  /similarityFeatureFlagResolver|resolveSimilarityFeatureFlags/,
  'The Phase 3FC-D role assignment resolver must not be modified to reference the new feature flag resolver module',
);
assertMatchIn(
  roleAssignmentResolverSource,
  /export const resolveSimilarityRoleAssignment\s*=/,
  'The Phase 3FC-D role assignment resolver export must remain unchanged',
);
assertNotMatchIn(
  usageStoreSource,
  /similarityFeatureFlagResolver|resolveSimilarityFeatureFlags/,
  'The Phase 3FC-E usage store must not be modified to reference the new feature flag resolver module',
);
assertMatchIn(
  usageStoreSource,
  /export const loadSimilarityUsageSnapshot\s*=/,
  'The Phase 3FC-E usage store export must remain unchanged',
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
assertMatchIn(smokeSource, /import\.meta\.env/, 'Smoke script must include an import.meta.env safety check');

// --- Safety: result types have safeMessage/warnings/requestedCapabilityAllowed, no token fields --

assertMatchIn(typesSource, /safeMessage:\s*string;/, 'Feature flag resolver result types must declare safeMessage: string');
assertMatchIn(typesSource, /warnings:\s*string\[\];/, 'Feature flag resolver result types must declare warnings: string[]');
assertMatchIn(
  typesSource,
  /requestedCapabilityAllowed:\s*boolean;/,
  'Feature flag resolver result types must declare requestedCapabilityAllowed: boolean',
);
assertNotMatchIn(
  typesSource,
  /rawSessionPayload|sessionToken|tokenValue/i,
  'Feature flag resolver result types must not declare a raw session/token payload field',
);

// --- Contract doc: required section headers ------------------------------------------------------

const REQUIRED_CONTRACT_DOC_SECTIONS = [
  'Purpose',
  'Inputs',
  'Outputs',
  'Policy Defaults',
  'Feature Flag Keys',
  'Dependency Rules',
  'Mocked Scaffold Behavior',
  'Security Boundary',
  'Future Integration',
];
assertMatchIn(
  contractDocSource,
  /^# Phase 3FC-F Feature Flag Resolver Contract/m,
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
  'Feature Flag Resolver Contract Result',
  'Smoke Result',
  'Boundary Preservation',
  'Validation',
  'Implementation Implication',
  'Recommended Next Phase',
];
assertMatchIn(
  resultDocSource,
  /^# Phase 3FC-F — Feature Flag Resolver Scaffold Result/m,
  'Result doc must have the exact title heading',
);
assertTrue(
  REQUIRED_RESULT_DOC_SECTIONS.every((section) => new RegExp(`^##\\s*\\d+\\.\\s*${section}\\b`, 'm').test(resultDocSource)),
  `Result doc must contain all required numbered section headers (${REQUIRED_RESULT_DOC_SECTIONS.join(', ')})`,
);
assertMatchIn(
  resultDocSource,
  /Phase 3FC-G\b/,
  'Result doc must reference Phase 3FC-G as a recommended next phase',
);
assertMatchIn(
  resultDocSource,
  /Phase 3FC-G-ALT/,
  'Result doc must reference Phase 3FC-G-ALT as an alternative next phase',
);

// --- Hard structural requirement: this checker must run at least 95 assertions ------------------

const MINIMUM_REQUIRED_ASSERTION_COUNT = 95;
assertTrue(
  assertionCount >= MINIMUM_REQUIRED_ASSERTION_COUNT,
  `Checker must run at least ${MINIMUM_REQUIRED_ASSERTION_COUNT} assertions (ran ${assertionCount})`,
);

if (failures.length > 0) {
  process.stdout.write(`Phase 3FC-F checker: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
  for (const failure of failures) {
    process.stdout.write(`  - ${failure}\n`);
  }
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3FC-F checker: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  process.exitCode = 0;
}
