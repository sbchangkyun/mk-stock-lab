/**
 * Static contract checker for Phase 3FB-C-ALT (Auth/Usage Runtime Bridge for the Similarity
 * Route, No Live KIS).
 *
 * Inspects the new/modified source files as raw text (no build, no dev server, no browser, no
 * live KIS) and asserts: the owner-local auth/usage bridge module evaluates the existing
 * `evaluateSimilarityExecutionGuard` before running the Phase 3FB-A mocked integration; the API
 * route wires a distinct, mutually exclusive branch for the bridge while preserving the default
 * feature-disabled behavior and the existing Phase 3FB-B owner-local-mocked branch; the bridge and
 * its response builder never import a real auth provider, a real usage store, the KIS provider, or
 * `fetch`, and never read `process.env`/`.env`; the response contract exposes only sanitized,
 * bucketed fields; and `src/pages/chart-ai.astro` remains untouched by this phase. This is a
 * focused checker (a bounded assertion list), not a full historical checker suite.
 *
 * Run:
 *   npm run check:phase-3fb-c-alt-auth-usage-runtime-bridge-for-similarity-route
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

const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const BRIDGE_TYPES_PATH = 'src/lib/server/chartSimilarity/similarityAuthUsageRouteBridgeTypes.ts';
const BRIDGE_PATH = 'src/lib/server/chartSimilarity/similarityAuthUsageRouteBridge.ts';
const FIXTURES_PATH = 'src/lib/server/chartSimilarity/mockedSimilarityAuthUsageRouteBridgeFixtures.ts';
const RESPONSE_TYPES_PATH = 'src/lib/server/chartSimilarity/similarityApiResponseTypes.ts';
const RESPONSE_BUILDER_PATH = 'src/lib/server/chartSimilarity/similarityApiResponseBuilder.ts';
const INDEX_PATH = 'src/lib/server/chartSimilarity/index.ts';
const CHART_AI_UI_PATH = 'src/pages/chart-ai.astro';
const PACKAGE_JSON_PATH = 'package.json';

for (const path of [
  ROUTE_PATH,
  BRIDGE_TYPES_PATH,
  BRIDGE_PATH,
  FIXTURES_PATH,
  RESPONSE_TYPES_PATH,
  RESPONSE_BUILDER_PATH,
  INDEX_PATH,
  CHART_AI_UI_PATH,
  PACKAGE_JSON_PATH,
]) {
  assertTrue(existsSync(path), `Required file must exist: ${path}`);
}

const routeSource = readSource(ROUTE_PATH);
const bridgeTypesSource = readSource(BRIDGE_TYPES_PATH);
const bridgeSource = readSource(BRIDGE_PATH);
const fixturesSource = readSource(FIXTURES_PATH);
const responseTypesSource = readSource(RESPONSE_TYPES_PATH);
const responseBuilderSource = readSource(RESPONSE_BUILDER_PATH);
const indexSource = readSource(INDEX_PATH);
const chartAiUiSource = readSource(CHART_AI_UI_PATH);
const packageJsonSource = readSource(PACKAGE_JSON_PATH);

// --- Route wiring: distinct branch, default preserved, existing 3FB-B branch preserved ---------

assertMatchIn(
  routeSource,
  /isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody\(body\)/,
  'Route must guard the new branch with isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody(body)',
);
assertMatchIn(
  routeSource,
  /buildOwnerLocalAuthUsageBridgeSimilarityApiResponse\(body\)/,
  'Route must call buildOwnerLocalAuthUsageBridgeSimilarityApiResponse(body) in the new branch',
);
assertMatchIn(
  routeSource,
  /mapAuthUsageBridgeApiStatusToHttpStatus\(response\.status\)/,
  'Route must map the bridge response status to an HTTP status via mapAuthUsageBridgeApiStatusToHttpStatus',
);
assertMatchIn(
  routeSource,
  /isOwnerLocalMockedSimilarityApiRequestBody\(body\)/,
  'Route must still preserve the existing Phase 3FB-B owner-local-mocked branch guard',
);
assertMatchIn(
  routeSource,
  /buildOwnerLocalMockedSimilarityApiResponse\(body\)/,
  'Route must still preserve the existing Phase 3FB-B owner-local-mocked response builder call',
);
assertMatchIn(
  routeSource,
  /return jsonResponse\(buildSimilarityApiRouteShellResult\(body\)\);\s*\n\};/,
  'Route must still fall back to the default feature-disabled shell result for unmatched requests',
);
assertMatchIn(
  routeSource,
  /export const ALL: APIRoute = \(\) => jsonResponse\(buildSimilarityApiRouteShellResult\(\{\}\)\);/,
  'The ALL handler must remain unchanged (always feature-disabled)',
);

const mockedBranchIndex = routeSource.indexOf('isOwnerLocalMockedSimilarityApiRequestBody(body)');
const bridgeBranchIndex = routeSource.indexOf('isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody(body)');
const defaultReturnIndex = routeSource.lastIndexOf('buildSimilarityApiRouteShellResult(body)');
assertTrue(
  mockedBranchIndex !== -1 && bridgeBranchIndex !== -1 && mockedBranchIndex < bridgeBranchIndex,
  'The owner-local-mocked branch must appear before the new auth/usage bridge branch',
);
assertTrue(
  bridgeBranchIndex !== -1 && defaultReturnIndex !== -1 && bridgeBranchIndex < defaultReturnIndex,
  'The new auth/usage bridge branch must appear before the final default fallback return',
);

// --- Bridge types: required type and policy field literals --------------------------------------

const REQUIRED_BRIDGE_TYPE_NAMES = [
  'SimilarityAuthUsageBridgeMode',
  'SimilarityAuthUsageBridgeSource',
  'SimilarityAuthUsageBridgeAuthState',
  'SimilarityAuthUsageBridgeRole',
  'SimilarityAuthUsageBridgeUsageWindow',
  'SimilarityAuthUsageBridgeMockAuth',
  'SimilarityAuthUsageBridgeMockUsage',
  'SimilarityAuthUsageBridgeRequestBody',
  'SimilarityAuthUsageBridgeNormalizedRequest',
  'SimilarityAuthUsageBridgePolicy',
  'SimilarityAuthUsageBridgeResult',
];
assertTrue(
  REQUIRED_BRIDGE_TYPE_NAMES.every((typeName) => new RegExp(`export type ${typeName}\\b`).test(bridgeTypesSource)),
  `Bridge types must export all required type names (${REQUIRED_BRIDGE_TYPE_NAMES.join(', ')})`,
);
assertMatchIn(bridgeTypesSource, /ownerLocalOnly:\s*true;/, 'Bridge policy type must fix ownerLocalOnly to true');
assertMatchIn(bridgeTypesSource, /allowLiveKis:\s*false;/, 'Bridge policy type must fix allowLiveKis to false');
assertMatchIn(
  bridgeTypesSource,
  /allowPublicExecution:\s*false;/,
  'Bridge policy type must fix allowPublicExecution to false',
);
assertMatchIn(
  bridgeTypesSource,
  /allowRealAuthProvider:\s*false;/,
  'Bridge policy type must fix allowRealAuthProvider to false',
);
assertMatchIn(
  bridgeTypesSource,
  /allowUsagePersistence:\s*false;/,
  'Bridge policy type must fix allowUsagePersistence to false',
);
assertMatchIn(
  bridgeTypesSource,
  /allowRawProviderPayload:\s*false;/,
  'Bridge policy type must fix allowRawProviderPayload to false',
);

// --- Bridge module: guard-first, integration-after-allowed, safe request handling --------------

assertMatchIn(
  bridgeSource,
  /import \{ evaluateSimilarityExecutionGuard \} from '\.\/similarityExecutionGuard';/,
  'Bridge module must import evaluateSimilarityExecutionGuard from the existing guard module',
);
assertMatchIn(
  bridgeSource,
  /import \{ runMockedProviderCompatibleSimilarityIntegration \} from '\.\/similarityProviderIntegration';/,
  'Bridge module must import runMockedProviderCompatibleSimilarityIntegration from the existing Phase 3FB-A integration module',
);
assertMatchIn(
  bridgeSource,
  /evaluateSimilarityExecutionGuard\(guardRequest,\s*\{/,
  'Bridge module must call evaluateSimilarityExecutionGuard with the mapped guard request',
);

const invalidReturnIndex = bridgeSource.indexOf('if (!normalizedRequest) {');
const guardCallIndex = bridgeSource.indexOf('evaluateSimilarityExecutionGuard(guardRequest');
const guardNotOkReturnIndex = bridgeSource.indexOf('if (!guardResult.ok) {');
const integrationCallIndex = bridgeSource.indexOf('runMockedProviderCompatibleSimilarityIntegration(');
assertTrue(
  invalidReturnIndex !== -1 && guardCallIndex !== -1 && invalidReturnIndex < guardCallIndex,
  'Invalid-request short-circuit must be checked before the guard is ever evaluated',
);
assertTrue(
  guardCallIndex !== -1 && guardNotOkReturnIndex !== -1 && guardCallIndex < guardNotOkReturnIndex,
  'The guard-not-ok short-circuit must be checked after the guard evaluation call',
);
assertTrue(
  guardNotOkReturnIndex !== -1 && integrationCallIndex !== -1 && guardNotOkReturnIndex < integrationCallIndex,
  'The mocked integration must only be called after the guard-not-ok short-circuit (i.e., only when the guard allowed execution)',
);

assertMatchIn(
  bridgeSource,
  /isOwnerLocalAuthUsageBridgeRequestBody\s*=\s*\(/,
  'Bridge module must export a request body type guard function',
);
assertMatchIn(
  bridgeSource,
  /normalizeSimilarityAuthUsageBridgeRequestBody\s*=\s*\(/,
  'Bridge module must export a request normalization function',
);
assertMatchIn(
  bridgeSource,
  /mapBridgeRequestToSimilarityExecutionGuardRequest\s*=\s*\(/,
  'Bridge module must export a function mapping the bridge request to a guard request',
);
assertMatchIn(
  bridgeSource,
  /mapBridgeUsageToGuardUsageSnapshot\s*=\s*\(/,
  'Bridge module must export a function mapping bridge usage to a guard usage snapshot',
);
assertMatchIn(bridgeSource, /used > limit\) return false;/, 'Bridge usage validation must reject used > limit');
assertMatchIn(
  bridgeSource,
  /remaining > limit\) return false;/,
  'Bridge usage validation must reject remaining > limit',
);
assertMatchIn(
  bridgeSource,
  /allowPublicKisExecution:\s*false,/,
  'The internal bridge guard policy must keep allowPublicKisExecution false',
);

// --- Fixtures: four deterministic builders -------------------------------------------------------

for (const fixtureName of [
  'buildMockedOwnerAuthUsageBridgeAllowedRequestBody',
  'buildMockedAnonymousAuthUsageBridgeBlockedRequestBody',
  'buildMockedUsageLimitedAuthUsageBridgeRequestBody',
  'buildMockedInvalidAuthUsageBridgeRequestBody',
] ) {
  assertMatchIn(fixturesSource, new RegExp(`export const ${fixtureName} = \\(`), `Fixtures must export ${fixtureName}`);
}
assertNotMatchIn(fixturesSource, /Date\.now\(\)|Math\.random\(\)|new Date\(\)/, 'Fixtures must be deterministic (no Date.now, Math.random, or new Date)');

// --- Response contract: new mode and sanitized success data type ---------------------------------

assertMatchIn(
  responseTypesSource,
  /'owner-local-auth-usage-bridge'/,
  "SimilarityApiResponseMode must include 'owner-local-auth-usage-bridge'",
);
assertMatchIn(
  responseTypesSource,
  /export type SimilarityApiAuthUsageBridgeSuccessData = \{/,
  'Response types must export SimilarityApiAuthUsageBridgeSuccessData',
);
const REQUIRED_BRIDGE_SUCCESS_DATA_FIELDS = [
  'guardStatus',
  'authState',
  'role',
  'usageWindow',
  'usageRemainingBucket',
  'engineStatus',
  'normalizedBarsAvailable',
  'normalizedBarCountBucket',
  'matchCountBucket',
  'disclaimer',
  'dataPolicy',
];
assertTrue(
  REQUIRED_BRIDGE_SUCCESS_DATA_FIELDS.every((field) => new RegExp(`${field}:`).test(responseTypesSource)),
  `SimilarityApiAuthUsageBridgeSuccessData must declare all required fields (${REQUIRED_BRIDGE_SUCCESS_DATA_FIELDS.join(', ')})`,
);
assertMatchIn(
  responseTypesSource,
  /data:\s*\n(\s*\|[^\n]*\n)*\s*\|\s*SimilarityApiAuthUsageBridgeSuccessData/,
  'SimilarityApiResponse.data union must include SimilarityApiAuthUsageBridgeSuccessData',
);

// --- Response builder: sanitized packaging only ---------------------------------------------------

assertMatchIn(
  responseBuilderSource,
  /export const buildOwnerLocalAuthUsageBridgeSimilarityApiResponse = \(body: unknown\): SimilarityApiResponse => \{/,
  'Response builder must export buildOwnerLocalAuthUsageBridgeSimilarityApiResponse',
);
assertMatchIn(
  responseBuilderSource,
  /runSimilarityAuthUsageRouteBridge\(body\)/,
  'Response builder must call runSimilarityAuthUsageRouteBridge with the raw request body',
);
assertMatchIn(
  responseBuilderSource,
  /mode:\s*'owner-local-auth-usage-bridge'/,
  "Response builder must tag responses with mode: 'owner-local-auth-usage-bridge'",
);
assertMatchIn(
  responseBuilderSource,
  /source:\s*'mocked-provider-compatible'/,
  "Response builder must tag the safe request with source: 'mocked-provider-compatible'",
);
assertNotMatchIn(
  responseBuilderSource,
  /source:\s*['"]live['"]|source:\s*['"]auto['"]/,
  'Response builder must never set source to "live" or "auto"',
);
const authUsageBridgeSectionStart = responseBuilderSource.indexOf(
  'export const isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody',
);
assertTrue(
  authUsageBridgeSectionStart !== -1,
  'Response builder must contain an isolatable owner-local auth/usage bridge section',
);
const authUsageBridgeSection =
  authUsageBridgeSectionStart !== -1 ? responseBuilderSource.slice(authUsageBridgeSectionStart) : '';
assertNotMatchIn(
  authUsageBridgeSection,
  /\bmatches\s*:|\bscores\s*:|\bforwardReturn\d*d\s*:|\bohlc\s*:|\bvolume\s*:|\btimestamps?\s*:/i,
  'Response builder auth/usage bridge section must not include raw matches/scores/returns/OHLC/volume/timestamp fields',
);

// --- Boundary: no real auth provider, no DB/cache, no live network, no env echo -------------------

const HIGH_RISK_SOURCE_FILES = [
  { label: 'bridge module', source: bridgeSource },
  { label: 'response builder', source: responseBuilderSource },
];

for (const { label, source } of HIGH_RISK_SOURCE_FILES) {
  assertNotMatchIn(
    source,
    /from ['"](@supabase\/|@auth0\/|next-auth|@clerk\/|firebase|passport)/i,
    `${label} must not import a real external auth provider (Supabase/Auth0/NextAuth/Clerk/Firebase/Passport)`,
  );
  assertNotMatchIn(
    source,
    /from ['"]\.\.\/\.\.\/\.\.\/lib\/server\/providers/,
    `${label} must not import a KIS provider server module`,
  );
  assertNotMatchIn(source, /\bfetch\(/, `${label} must never call fetch(...)`);
  assertNotMatchIn(source, /process\.env\.|process\.env\[/, `${label} must never read process.env`);
  assertNotMatchIn(source, /\.env['"]|readFileSync\(['"]\.env/, `${label} must never reference an .env file path`);
  assertNotMatchIn(
    source,
    /\bCREATE TABLE\b|\bINSERT INTO\b|\.sql['"]|\/migrations\//i,
    `${label} must not contain SQL or migration references`,
  );
}

const REMAINING_SOURCE_FILES = [
  { label: 'route', source: routeSource },
  { label: 'bridge types', source: bridgeTypesSource },
  { label: 'fixtures', source: fixturesSource },
  { label: 'response types', source: responseTypesSource },
  { label: 'index', source: indexSource },
];
const BOUNDARY_VIOLATION_PATTERN =
  /from ['"](@supabase\/|@auth0\/|next-auth|@clerk\/|firebase|passport)|from ['"]\.\.\/\.\.\/\.\.\/lib\/server\/providers|\bfetch\(|process\.env\.|process\.env\[|\.env['"]|readFileSync\(['"]\.env|\bCREATE TABLE\b|\bINSERT INTO\b|\.sql['"]|\/migrations\//i;
assertTrue(
  REMAINING_SOURCE_FILES.every(({ source }) => !BOUNDARY_VIOLATION_PATTERN.test(source)),
  'Route, bridge types, fixtures, response types, and index must not import a real auth provider/KIS provider, call fetch, read process.env/.env, or reference SQL/migrations',
);

// --- chart-ai.astro must remain untouched by this phase -------------------------------------------

assertNotMatchIn(
  chartAiUiSource,
  /owner-local-auth-usage-bridge|ownerLocalAuthUsageBridge|mockAuth|mockUsage/,
  'src/pages/chart-ai.astro must not reference the new Phase 3FB-C-ALT auth/usage bridge in this phase',
);

// --- package.json: new script lines registered -----------------------------------------------------

assertMatchIn(
  packageJsonSource,
  /"smoke:phase-3fb-c-alt-auth-usage-runtime-bridge-for-similarity-route":\s*"node scripts\/smoke_phase_3fb_c_alt_auth_usage_runtime_bridge_for_similarity_route\.mjs"/,
  'package.json must register the new smoke script',
);
assertMatchIn(
  packageJsonSource,
  /"check:phase-3fb-c-alt-auth-usage-runtime-bridge-for-similarity-route":\s*"node scripts\/check_phase_3fb_c_alt_auth_usage_runtime_bridge_for_similarity_route_contract\.mjs"/,
  'package.json must register this checker script',
);

// --- index.ts: new exports present without disturbing prior exports --------------------------------

assertMatchIn(indexSource, /buildDefaultSimilarityAuthUsageRouteBridgePolicy,/, 'index.ts must export buildDefaultSimilarityAuthUsageRouteBridgePolicy');
assertMatchIn(indexSource, /runSimilarityAuthUsageRouteBridge,/, 'index.ts must export runSimilarityAuthUsageRouteBridge');
assertMatchIn(indexSource, /buildMockedOwnerAuthUsageBridgeAllowedRequestBody,/, 'index.ts must export buildMockedOwnerAuthUsageBridgeAllowedRequestBody');
assertMatchIn(indexSource, /buildOwnerLocalAuthUsageBridgeSimilarityApiResponse,/, 'index.ts must export buildOwnerLocalAuthUsageBridgeSimilarityApiResponse');
assertMatchIn(
  indexSource,
  /runMockedProviderCompatibleSimilarityIntegration,/,
  'index.ts must still export the pre-existing runMockedProviderCompatibleSimilarityIntegration (no removed exports)',
);
assertMatchIn(
  indexSource,
  /buildOwnerLocalMockedSimilarityApiResponse,/,
  'index.ts must still export the pre-existing buildOwnerLocalMockedSimilarityApiResponse (no removed exports)',
);

if (failures.length > 0) {
  process.stdout.write(`Phase 3FB-C-ALT checker: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
  for (const failure of failures) {
    process.stdout.write(`  - ${failure}\n`);
  }
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3FB-C-ALT checker: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  process.exitCode = 0;
}
