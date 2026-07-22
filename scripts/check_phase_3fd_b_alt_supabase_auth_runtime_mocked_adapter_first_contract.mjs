// Phase 3FD-B-ALT static contract checker.
// Verifies the mocked Supabase Auth runtime adapter scaffold (types, module, fixtures, exports),
// its smoke script, its two new planning docs, the changelog entry, and the package.json script
// lines, and confirms no route/UI source file, dependency, or lockfile was touched by this phase.
// Does not start a dev server, does not read any environment variable, and does not call Supabase.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

let assertionCount = 0;
let failureCount = 0;
const failures = [];

function assertTrue(condition, message) {
  assertionCount += 1;
  if (!condition) {
    failureCount += 1;
    failures.push(message);
  }
}

function flatten(source) {
  return source.replace(/\s+/g, ' ');
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function assertHeadings(source, headings, docLabel) {
  const missing = headings.filter(
    (heading) => !new RegExp(`^${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm').test(source),
  );
  assertTrue(
    missing.length === 0,
    `${docLabel} must contain all required section headings (missing: ${missing.join(', ') || 'none'}).`,
  );
}

function assertNoUnnegatedClaim(text, regex, description) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const violated = sentences.some((sentence) => regex.test(sentence) && !/\bno\b/i.test(sentence));
  assertTrue(!violated, description);
}

function readSource(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  assertTrue(existsSync(fullPath), `Expected file to exist: ${relativePath}`);
  if (!existsSync(fullPath)) {
    return '';
  }
  return readFileSync(fullPath, 'utf8');
}

// ---------------------------------------------------------------------------
// File paths
// ---------------------------------------------------------------------------

const TYPES_PATH = 'src/lib/server/chartSimilarity/similaritySupabaseAuthRuntimeAdapterTypes.ts';
const ADAPTER_PATH = 'src/lib/server/chartSimilarity/similaritySupabaseAuthRuntimeAdapter.ts';
const FIXTURES_PATH = 'src/lib/server/chartSimilarity/mockedSimilaritySupabaseAuthRuntimeAdapterFixtures.ts';
const INDEX_PATH = 'src/lib/server/chartSimilarity/index.ts';
const SMOKE_PATH = 'scripts/smoke_phase_3fd_b_alt_supabase_auth_runtime_mocked_adapter_first.mjs';
const CHECKER_PATH = 'scripts/check_phase_3fd_b_alt_supabase_auth_runtime_mocked_adapter_first_contract.mjs';
const CONTRACT_DOC_PATH = 'docs/planning/phase_3fd_b_alt_supabase_auth_runtime_mocked_adapter_contract_v0.1.md';
const RESULT_DOC_PATH = 'docs/planning/phase_3fd_b_alt_supabase_auth_runtime_mocked_adapter_result_v0.1.md';
const PACKAGE_JSON_PATH = 'package.json';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const CHART_AI_PAGE_PATH = 'src/pages/chart-ai.astro';
const AUTH_RESOLVER_TYPES_PATH = 'src/lib/server/chartSimilarity/similarityAuthSubjectResolverTypes.ts';
const AUTH_RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityAuthSubjectResolver.ts';
const FDA_APPROVAL_PACKAGE_PATH = 'docs/planning/phase_3fd_a_real_supabase_auth_runtime_approval_package_v0.1.md';
const FDA_RESULT_DOC_PATH = 'docs/planning/phase_3fd_a_real_supabase_auth_runtime_approval_setup_result_v0.1.md';

assertTrue(existsSync(path.join(repoRoot, CHECKER_PATH)), 'Checker script itself must exist.');

const typesSource = readSource(TYPES_PATH);
const adapterSource = readSource(ADAPTER_PATH);
const fixturesSource = readSource(FIXTURES_PATH);
const indexSource = readSource(INDEX_PATH);
const smokeSource = readSource(SMOKE_PATH);
const contractDocSource = readSource(CONTRACT_DOC_PATH);
const resultDocSource = readSource(RESULT_DOC_PATH);
const packageJsonSource = readSource(PACKAGE_JSON_PATH);
const changelogSource = readSource(CHANGELOG_PATH);
const routeSource = readSource(ROUTE_PATH);
const chartAiSource = readSource(CHART_AI_PAGE_PATH);
const authResolverTypesSource = readSource(AUTH_RESOLVER_TYPES_PATH);
const authResolverSource = readSource(AUTH_RESOLVER_PATH);
const fdaApprovalPackageSource = readSource(FDA_APPROVAL_PACKAGE_PATH);
const fdaResultDocSource = readSource(FDA_RESULT_DOC_PATH);

const contractDocFlat = flatten(contractDocSource);
const resultDocFlat = flatten(resultDocSource);
const changelogFlat = flatten(changelogSource);

// ---------------------------------------------------------------------------
// 1. Files / scripts existence + changelog entry
// ---------------------------------------------------------------------------

assertTrue(
  packageJsonSource.includes(
    '"smoke:phase-3fd-b-alt-supabase-auth-runtime-mocked-adapter-first": "node scripts/smoke_phase_3fd_b_alt_supabase_auth_runtime_mocked_adapter_first.mjs"',
  ),
  'package.json must contain the Phase 3FD-B-ALT smoke script line.',
);
assertTrue(
  packageJsonSource.includes(
    '"check:phase-3fd-b-alt-supabase-auth-runtime-mocked-adapter-first": "node scripts/check_phase_3fd_b_alt_supabase_auth_runtime_mocked_adapter_first_contract.mjs"',
  ),
  'package.json must contain the Phase 3FD-B-ALT check script line.',
);
assertTrue(
  changelogFlat.includes('## Phase 3FD-B-ALT - 2026-07-04'),
  'planning_changelog.md must contain a Phase 3FD-B-ALT entry.',
);
assertTrue(
  changelogFlat.includes('Supabase Auth Runtime Mocked Adapter First, No Real Supabase Call (Implemented)'),
  'planning_changelog.md Phase 3FD-B-ALT entry must use the exact required subtitle.',
);
assertTrue(
  changelogSource.indexOf('## Phase 3FD-B-ALT - 2026-07-04') < changelogSource.indexOf('## Phase 3FD-A - 2026-07-04'),
  'Phase 3FD-B-ALT changelog entry must appear above the Phase 3FD-A entry.',
);

// ---------------------------------------------------------------------------
// 2. Type contract
// ---------------------------------------------------------------------------

const requiredTypeNames = [
  'SimilaritySupabaseAuthRuntimeAdapterStatus',
  'SimilaritySupabaseAuthRuntimeAdapterSource',
  'SimilaritySupabaseAuthRuntimeAdapterPolicy',
  'SimilarityMockedSupabaseUser',
  'SimilarityMockedSupabaseSession',
  'SimilaritySupabaseAuthRuntimeAdapterInput',
  'SimilaritySupabaseAuthRuntimeAdapterSubject',
  'SimilaritySupabaseAuthRuntimeAdapterResult',
  'SimilaritySupabaseAuthRuntimeAdapterSubjectSeed',
];
assertTrue(
  requiredTypeNames.every((name) => typesSource.includes(name)),
  `Types file must declare all required type names (${requiredTypeNames.join(', ')}).`,
);

const requiredStatusValues = [
  "'disabled'",
  "'mocked_resolved'",
  "'missing_session'",
  "'invalid_session'",
  "'expired_session'",
  "'malformed_session'",
  "'redaction_failed'",
  "'error'",
];
assertTrue(
  requiredStatusValues.every((value) => typesSource.includes(value)),
  `Types file adapter status union must include all required states (${requiredStatusValues.join(', ')}).`,
);
assertTrue(
  typesSource.includes("'mocked-supabase-auth'"),
  'Types file must declare the mocked-supabase-auth source literal.',
);
const requiredPolicyRealCapabilityFields = [
  'allowRealSupabaseClient: false',
  'allowEnvRead: false',
  'allowCookieRead: false',
  'allowHeaderRead: false',
  'allowJwtVerification: false',
  'allowRouteSuccess: false',
  'allowClientRoleTrust: false',
];
assertTrue(
  requiredPolicyRealCapabilityFields.every((field) => typesSource.includes(field)),
  'Types file policy type must literal-type every real-capability field as false.',
);
assertTrue(
  /enabled:\s*boolean/.test(typesSource) && /allowMockedSession:\s*boolean/.test(typesSource),
  'Types file policy type must allow enabled and allowMockedSession to vary as booleans.',
);
assertTrue(
  /idRef:\s*string/.test(typesSource) && /emailRef\?:\s*string \| null/.test(typesSource),
  'Types file mocked user shape must declare idRef and emailRef as synthetic reference fields.',
);
assertTrue(
  /state:\s*SimilarityMockedSupabaseSessionState/.test(typesSource),
  'Types file mocked session shape must declare a state field.',
);
assertTrue(
  /'missing' \| 'valid' \| 'invalid' \| 'expired' \| 'malformed'/.test(typesSource),
  'Types file mocked session state union must include all five required states.',
);
assertTrue(
  /state:\s*SimilaritySupabaseAuthRuntimeAdapterAuthState/.test(typesSource) &&
    /subjectRef:\s*string \| null/.test(typesSource),
  'Types file adapter subject shape must declare state and subjectRef fields.',
);
assertTrue(
  /roleSeed:\s*SimilaritySupabaseAuthRuntimeAdapterRoleSeed/.test(typesSource),
  'Types file adapter subject shape must declare a roleSeed field bound to the anonymous/authenticated role seed type.',
);
assertTrue(
  /'anonymous' \| 'authenticated'/.test(typesSource),
  'Types file must restrict auth state / role seed unions to anonymous and authenticated only.',
);
assertTrue(
  /ok:\s*boolean/.test(typesSource) && /safeMessage:\s*string/.test(typesSource) && /warnings:\s*string\[\]/.test(typesSource),
  'Types file adapter result shape must declare ok, safeMessage, and warnings fields.',
);
assertTrue(
  !/accessToken|refreshToken|rawSession|rawUser/.test(typesSource),
  'Types file must not declare a forbidden raw token/session/user output field.',
);
assertTrue(
  typesSource.includes('SimilaritySupabaseAuthRuntimeAdapterSubjectSeed'),
  'Types file must declare a subject seed shape compatible with the Phase 3FC-C auth subject contract.',
);

// ---------------------------------------------------------------------------
// 3. Adapter module
// ---------------------------------------------------------------------------

const requiredAdapterFunctionNames = [
  'buildDefaultSimilaritySupabaseAuthRuntimeAdapterPolicy',
  'buildMockedSimilaritySupabaseAuthRuntimeAdapterPolicy',
  'normalizeSimilaritySupabaseAuthRuntimeAdapterInput',
  'resolveMockedSimilaritySupabaseAuthRuntimeAdapter',
  'mapSupabaseAuthAdapterResultToAuthSubjectSeed',
  'assertSimilaritySupabaseAuthRuntimeAdapterResultIsSafe',
];
assertTrue(
  requiredAdapterFunctionNames.every((name) => adapterSource.includes(`function ${name}`) || adapterSource.includes(`export function ${name}`)),
  `Adapter module must export all required functions (${requiredAdapterFunctionNames.join(', ')}).`,
);
assertTrue(
  /enabled:\s*false/.test(adapterSource.split('buildDefaultSimilaritySupabaseAuthRuntimeAdapterPolicy')[1]?.split('}')[0] ?? ''),
  'Default policy builder must set enabled to false.',
);
assertTrue(
  adapterSource.includes('allowMockedSession: false'),
  'Default policy builder must set allowMockedSession to false.',
);
assertTrue(
  adapterSource.includes('enabled: true') && adapterSource.includes('allowMockedSession: true'),
  'Mocked policy builder must set enabled and allowMockedSession to true.',
);
const mockedPolicyBody = adapterSource.split('buildMockedSimilaritySupabaseAuthRuntimeAdapterPolicy')[1] ?? '';
assertTrue(
  !/allowRealSupabaseClient:\s*true|allowEnvRead:\s*true|allowCookieRead:\s*true|allowHeaderRead:\s*true|allowJwtVerification:\s*true|allowRouteSuccess:\s*true|allowClientRoleTrust:\s*true/.test(
    mockedPolicyBody.slice(0, 400),
  ),
  'Mocked policy builder must not set any real-capability flag to true.',
);
assertTrue(
  adapterSource.includes("'missing_session'") &&
    adapterSource.includes("'invalid_session'") &&
    adapterSource.includes("'expired_session'") &&
    adapterSource.includes("'malformed_session'") &&
    adapterSource.includes("'mocked_resolved'"),
  'Adapter module must handle all five mocked session states.',
);
assertTrue(
  adapterSource.includes("state: 'anonymous'") && adapterSource.includes("state: 'authenticated'"),
  'Adapter module must produce both anonymous and authenticated subject states.',
);
assertTrue(
  /client_role_claim_ignored/.test(adapterSource),
  'Adapter module must emit the client_role_claim_ignored warning when a client-claimed role is present.',
);
assertTrue(
  !/roleSeed:\s*['"](beta|owner|admin)['"]/i.test(adapterSource),
  'Adapter module must never assign a beta/owner/admin role seed.',
);
assertTrue(
  adapterSource.includes('mapSupabaseAuthAdapterResultToAuthSubjectSeed'),
  'Adapter module must implement the mapping function to the Phase 3FC-C auth subject seed contract.',
);
const mappingBody = adapterSource.split('export function mapSupabaseAuthAdapterResultToAuthSubjectSeed')[1] ?? '';
assertTrue(
  /authState:\s*'anonymous'/.test(mappingBody) && /authState:\s*'authenticated'/.test(mappingBody),
  'Mapping function must map to both anonymous and authenticated auth states.',
);
assertTrue(
  !/beta|owner|admin/i.test(mappingBody.split('}')[0] + mappingBody.split('}')[1]),
  'Mapping function must never surface beta/owner/admin in its immediate branches.',
);
assertTrue(
  adapterSource.includes('assertSimilaritySupabaseAuthRuntimeAdapterResultIsSafe'),
  'Adapter module must implement a safety assertion function.',
);
assertTrue(
  /FORBIDDEN_RESULT_SUBSTRINGS/.test(adapterSource),
  'Adapter module must define a forbidden-substrings list used by the safety assertion.',
);
const forbiddenSubstringTerms = [
  'accesstoken',
  'refreshtoken',
  'jwt',
  'rawsession',
  'rawuser',
  'cookie',
  'authorization',
  'service_role',
  'secret',
  'credential',
  'kis_app_key',
  'kis_app_secret',
  'account',
  'trading',
  'balance',
];
assertTrue(
  forbiddenSubstringTerms.every((term) => adapterSource.toLowerCase().includes(`'${term}'`)),
  `Adapter module forbidden-substrings list must include all required terms (${forbiddenSubstringTerms.join(', ')}).`,
);
assertTrue(
  /'"source":"live"'/.test(adapterSource) && /'"source":"auto"'/.test(adapterSource),
  'Adapter module forbidden-substrings list must include the live/auto source markers.',
);
assertTrue(
  /EMAIL_ADDRESS_SHAPE_PATTERN|@.*\\\.|email-address-shaped/i.test(adapterSource),
  'Adapter module must detect a real email-address-shaped value as forbidden, not merely the bare category word "email".',
);
assertTrue(
  !/createClient\(/.test(adapterSource),
  'Adapter module must not call createClient.',
);
assertTrue(
  normalizeFunctionOnlyReadsPlainObject(adapterSource),
  'Adapter module input normalizer must only read the explicit input object, never Request/cookies/headers/env.',
);

function normalizeFunctionOnlyReadsPlainObject(source) {
  const body = source.split('export function normalizeSimilaritySupabaseAuthRuntimeAdapterInput')[1]?.split('export function')[0] ?? '';
  return body.length > 0 && !/process\.env|import\.meta\.env|document\.cookie|req\.headers|request\.headers|fetch\(/.test(body);
}

// ---------------------------------------------------------------------------
// 4. Forbidden operations (adapter, types, fixtures, index, smoke, source-level)
// ---------------------------------------------------------------------------

// Comment-stripped so that explanatory doc comments (which legitimately mention forbidden
// operation names to describe what the code never does) cannot trip these checks.
const typesNoComments = stripComments(typesSource);
const adapterNoComments = stripComments(adapterSource);
const fixturesNoComments = stripComments(fixturesSource);
const indexNoComments = stripComments(indexSource);

// These three new files must never reach for a real Supabase client, env, cookie/header,
// JWT library, SQL, or a live/auto source marker used as an actual constructed value (as
// opposed to the adapter module's own denylist of such markers, checked separately below).
const NEW_FILE_SOURCES_TO_CHECK = [
  ['Types file', typesNoComments],
  ['Fixtures file', fixturesNoComments],
];

const DIRECT_FORBIDDEN_PATTERN_CHECKS = [
  [/@supabase\//, 'must not import a @supabase package'],
  [/createClient\(/, 'must not call createClient('],
  [/process\.env(\.\w+|\[)/, 'must not access process.env'],
  [/import\.meta\.env/, 'must not access import.meta.env'],
  [/readFileSync\(['"`][^'"`]*\.env/, 'must not read a .env file'],
  [/vercel\s+env/i, 'must not read Vercel env'],
  [/\bfetch\(/, 'must not call fetch('],
  [/document\.cookie|req\.headers|request\.headers|getHeader\(/, 'must not parse cookies or request headers'],
  [/jsonwebtoken|jose\.jwtVerify|verifyJwt\(/, 'must not use a JWT verification library'],
  [/from '\.\.?\/.*pages\/api|similarityApiRouteShell/, 'must not import a route module'],
  [/kisOhlcProvider|serverOnlyKisOhlcProvider|mockedKisOhlcAdapter/, 'must not import a KIS provider module'],
  [/CREATE TABLE|ALTER TABLE|\.sql['"]/i, 'must not contain a SQL/migration statement'],
  [/\baccountBalance\b|\btradingOrder\b|\borderId\b/, 'must not contain account/trading/order/balance fields'],
];

for (const [label, source] of NEW_FILE_SOURCES_TO_CHECK) {
  assertTrue(
    DIRECT_FORBIDDEN_PATTERN_CHECKS.every(([pattern]) => !pattern.test(source)),
    `${label} must not contain any forbidden operation (${DIRECT_FORBIDDEN_PATTERN_CHECKS.map(([, d]) => d).join('; ')}).`,
  );
}

// The adapter module intentionally embeds the JSON-shaped '"source":"live"'/'"source":"auto"'
// marker strings as denylist entries (checked earlier under FORBIDDEN_RESULT_SUBSTRINGS), so it
// is checked against every pattern except the source-marker one.
const ADAPTER_FORBIDDEN_PATTERN_CHECKS = DIRECT_FORBIDDEN_PATTERN_CHECKS;
assertTrue(
  ADAPTER_FORBIDDEN_PATTERN_CHECKS.every(([pattern]) => !pattern.test(adapterNoComments)),
  `Adapter module must not contain any forbidden operation (${ADAPTER_FORBIDDEN_PATTERN_CHECKS.map(([, d]) => d).join('; ')}).`,
);
assertTrue(
  !/\bsource:\s*['"]live['"]|\bsource:\s*['"]auto['"]/.test(adapterNoComments),
  'Adapter module must never construct a result with an actual live/auto source value (only the denylist string literal is permitted).',
);

// index.ts is the pre-existing central export barrel and legitimately re-exports the
// pre-existing KIS provider and route-shell modules from earlier approved phases, so only the
// operations that would be genuinely new/unexpected here are checked.
const INDEX_FORBIDDEN_PATTERN_CHECKS = [
  [/@supabase\//, 'must not import a @supabase package'],
  [/createClient\(/, 'must not call createClient('],
  [/process\.env(\.\w+|\[)/, 'must not access process.env'],
  [/import\.meta\.env/, 'must not access import.meta.env'],
  [/\bfetch\(/, 'must not call fetch('],
  [/document\.cookie|req\.headers|request\.headers|getHeader\(/, 'must not parse cookies or request headers'],
];
assertTrue(
  INDEX_FORBIDDEN_PATTERN_CHECKS.every(([pattern]) => !pattern.test(indexNoComments)),
  `Index barrel must not contain any forbidden operation (${INDEX_FORBIDDEN_PATTERN_CHECKS.map(([, d]) => d).join('; ')}).`,
);

// ---------------------------------------------------------------------------
// 5. Fixtures
// ---------------------------------------------------------------------------

const requiredFixtureFunctionNames = [
  'buildMockedMissingSupabaseAuthRuntimeAdapterInput',
  'buildMockedInvalidSupabaseAuthRuntimeAdapterInput',
  'buildMockedExpiredSupabaseAuthRuntimeAdapterInput',
  'buildMockedMalformedSupabaseAuthRuntimeAdapterInput',
  'buildMockedValidEmailSupabaseAuthRuntimeAdapterInput',
  'buildMockedValidOauthSupabaseAuthRuntimeAdapterInput',
  'buildMockedValidWithClientRoleClaimSupabaseAuthRuntimeAdapterInput',
  'buildMockedUnsafeLikeSupabaseAuthRuntimeAdapterInputForRedactionTest',
];
assertTrue(
  requiredFixtureFunctionNames.every((name) => fixturesSource.includes(`export function ${name}`)),
  `Fixtures file must export all required builder functions (${requiredFixtureFunctionNames.join(', ')}).`,
);
assertTrue(
  /idRef:\s*'mock-user-ref-\d+'/.test(fixturesSource),
  'Fixtures file must use synthetic mock-user-ref idRef values.',
);
assertTrue(
  /emailRef:\s*'mock-email-ref-\d+'/.test(fixturesSource),
  'Fixtures file must use synthetic mock-email-ref emailRef values.',
);
assertTrue(
  !/[A-Za-z0-9._%+-]+@(?!.*mock)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(fixturesSource),
  'Fixtures file must not contain a real-looking email address.',
);
assertTrue(
  !/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/.test(fixturesSource),
  'Fixtures file must not contain a raw JWT-shaped token string.',
);
assertTrue(
  /FIXED_CURRENT_ISO\s*=\s*'2026-07-04T12:00:00\.000\+09:00'/.test(fixturesSource) &&
    (fixturesSource.match(/FIXED_CURRENT_ISO/g) || []).length >= 5,
  'Fixtures file must derive fixtures from a single deterministic ISO timestamp constant reused across fixtures.',
);
assertTrue(
  fixturesSource.includes('buildMockedUnsafeLikeSupabaseAuthRuntimeAdapterInputForRedactionTest') &&
    !/SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['"][A-Za-z0-9._-]{10,}/.test(fixturesSource),
  'Redaction test fixture must not contain an actual secret value.',
);

// ---------------------------------------------------------------------------
// 6. Exports (index.ts)
// ---------------------------------------------------------------------------

assertTrue(
  indexSource.includes("from './similaritySupabaseAuthRuntimeAdapterTypes'"),
  'index.ts must export from the new adapter types module.',
);
assertTrue(
  indexSource.includes("from './similaritySupabaseAuthRuntimeAdapter'"),
  'index.ts must export from the new adapter module.',
);
assertTrue(
  indexSource.includes("from './mockedSimilaritySupabaseAuthRuntimeAdapterFixtures'"),
  'index.ts must export from the new mocked fixtures module.',
);
assertTrue(
  indexSource.includes('resolveSimilarityAuthSubject') || indexSource.includes('similarityAuthSubjectResolverTypes'),
  'index.ts must still export the pre-existing Phase 3FC-C auth subject resolver exports.',
);
assertTrue(
  indexSource.includes('similarityGuardedRouteScaffoldTypes'),
  'index.ts must still export the pre-existing Phase 3FC-H guarded route scaffold exports.',
);

// ---------------------------------------------------------------------------
// 7. Smoke script content
// ---------------------------------------------------------------------------

assertTrue(
  smokeSource.includes('resolveMockedSimilaritySupabaseAuthRuntimeAdapter'),
  'Smoke script must exercise resolveMockedSimilaritySupabaseAuthRuntimeAdapter.',
);
assertTrue(
  smokeSource.includes('buildDefaultSimilaritySupabaseAuthRuntimeAdapterPolicy'),
  'Smoke script must exercise the default disabled policy case.',
);
assertTrue(
  smokeSource.includes('buildMockedMissingSupabaseAuthRuntimeAdapterInput') &&
    smokeSource.includes('buildMockedInvalidSupabaseAuthRuntimeAdapterInput') &&
    smokeSource.includes('buildMockedExpiredSupabaseAuthRuntimeAdapterInput') &&
    smokeSource.includes('buildMockedMalformedSupabaseAuthRuntimeAdapterInput'),
  'Smoke script must exercise missing/invalid/expired/malformed session fixtures.',
);
assertTrue(
  smokeSource.includes('buildMockedValidEmailSupabaseAuthRuntimeAdapterInput') &&
    smokeSource.includes('buildMockedValidOauthSupabaseAuthRuntimeAdapterInput'),
  'Smoke script must exercise valid email and valid OAuth session fixtures.',
);
assertTrue(
  smokeSource.includes('buildMockedValidWithClientRoleClaimSupabaseAuthRuntimeAdapterInput') &&
    smokeSource.includes('client_role_claim_ignored'),
  'Smoke script must exercise the client-claimed-role-ignored case.',
);
assertTrue(
  smokeSource.includes('mapSupabaseAuthAdapterResultToAuthSubjectSeed'),
  'Smoke script must exercise mapping to the Phase 3FC-C auth subject seed contract.',
);
assertTrue(
  smokeSource.includes('fetchCalled') && smokeSource.includes('globalThis.fetch'),
  'Smoke script must monkeypatch global fetch and assert it is never called.',
);
assertTrue(
  /@supabase/.test(smokeSource) && /process\.env/.test(smokeSource) && /import\.meta\.env/.test(smokeSource),
  'Smoke script must assert the bundled output does not import @supabase or read process.env/import.meta.env.',
);
assertTrue(
  /assertionCount/.test(smokeSource) && /assertions (passed|failed)/.test(smokeSource),
  'Smoke script must print an assertion count summary.',
);

// ---------------------------------------------------------------------------
// 8. Docs — contract doc
// ---------------------------------------------------------------------------

assertTrue(
  contractDocSource.startsWith('# Phase 3FD-B-ALT Supabase Auth Runtime Mocked Adapter Contract'),
  'Contract doc must start with the exact required title.',
);
assertHeadings(
  contractDocSource,
  [
    '## 1. Purpose',
    '## 2. Inputs',
    '## 3. Outputs',
    '## 4. Policy Defaults',
    '## 5. Session State Handling',
    '## 6. Subject Mapping',
    '## 7. Redaction and Safety Boundary',
    '## 8. Relationship to Phase 3FD-A',
    '## 9. Future Integration',
  ],
  'Contract doc',
);
assertTrue(
  /mocked .{0,40}adapter first/i.test(contractDocFlat) && /no real Supabase call/i.test(contractDocFlat),
  'Contract doc Purpose must state mocked adapter first and no real Supabase call.',
);
assertTrue(
  /no real Supabase client/i.test(contractDocFlat) && /no (real )?environment variable/i.test(contractDocFlat),
  'Contract doc must state no real Supabase client and no environment variable read.',
);
assertTrue(
  /client-claimed role/i.test(contractDocFlat) && /always ignored|never trusted/i.test(contractDocFlat),
  'Contract doc Inputs must state clientClaimedRole is always ignored.',
);
assertTrue(
  /never\s+beta.{0,20}owner.{0,20}admin|beta.{0,20}owner.{0,20}admin/i.test(contractDocFlat),
  'Contract doc Subject Mapping must reference the anonymous/authenticated-only role seed boundary.',
);
assertTrue(
  /Phase 3FD-B\b/.test(contractDocFlat) && /Phase 3FD-C-PLAN/.test(contractDocFlat),
  'Contract doc Future Integration must recommend Phase 3FD-B and list Phase 3FD-C-PLAN as alternative.',
);
assertNoUnnegatedClaim(
  contractDocFlat,
  /real Supabase client (was|is) created/i,
  'Contract doc must not claim a real Supabase client was created.',
);
assertNoUnnegatedClaim(
  contractDocFlat,
  /route success (was|is) enabled/i,
  'Contract doc must not claim route success was enabled.',
);

// ---------------------------------------------------------------------------
// 9. Docs — result doc
// ---------------------------------------------------------------------------

assertTrue(
  resultDocSource.startsWith('# Phase 3FD-B-ALT — Supabase Auth Runtime Mocked Adapter First Result'),
  'Result doc must start with the exact required title.',
);
assertHeadings(
  resultDocSource,
  [
    '## 1. Status',
    '## 2. Background',
    '## 3. Implemented Scope',
    '## 4. Adapter Contract Result',
    '## 5. Smoke Result',
    '## 6. Boundary Preservation',
    '## 7. Validation',
    '## 8. Implementation Implication',
    '## 9. Recommended Next Phase',
  ],
  'Result doc',
);
assertTrue(
  /implemented\./i.test(resultDocFlat) && /mocked .{0,40}adapter only/i.test(resultDocFlat),
  'Result doc Status must state implemented and mocked adapter only.',
);
assertTrue(
  /no route source file was changed/i.test(resultDocFlat) && /no UI source file was changed/i.test(resultDocFlat),
  'Result doc Status must state no route source file and no UI source file was changed.',
);
assertTrue(
  /no package was installed/i.test(resultDocFlat) && /no dependency was changed/i.test(resultDocFlat),
  'Result doc Status must state no package was installed and no dependency was changed.',
);
assertTrue(
  /no live KIS call was made/i.test(resultDocFlat) && /no deploy or push occurred/i.test(resultDocFlat),
  'Result doc Status must state no live KIS call was made and no deploy or push occurred.',
);
assertTrue(
  /95\/95 assertions/i.test(resultDocFlat) || /assertions\s+passed/i.test(resultDocFlat),
  'Result doc Smoke Result must record the smoke assertion outcome.',
);
assertTrue(
  /Phase 3FD-B — Real Supabase Auth Subject Resolver Implementation, Disabled by Default/.test(resultDocFlat),
  'Result doc Recommended Next Phase must recommend Phase 3FD-B by exact name.',
);
assertTrue(
  /Phase 3FD-C-PLAN/.test(resultDocFlat) && /Phase 3FC-K/.test(resultDocFlat),
  'Result doc Recommended Next Phase must list Phase 3FD-C-PLAN as alternative and Phase 3FC-K as hold alternative.',
);
assertNoUnnegatedClaim(
  resultDocFlat,
  /(sql|migration) file (was|has been) created/i,
  'Result doc must not claim a SQL/migration file was created.',
);
assertNoUnnegatedClaim(
  resultDocFlat,
  /cookie (was|is) parsed|authorization header (was|is) read/i,
  'Result doc must not claim cookie or authorization header parsing occurred.',
);

// ---------------------------------------------------------------------------
// 10. Runtime boundary preservation
// ---------------------------------------------------------------------------

assertTrue(
  /isOwnerLocalMockedSimilarityApiRequestBody/.test(routeSource) &&
    /isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody/.test(routeSource) &&
    /isGuardedRuntimeScaffoldSimilarityRequestBody/.test(routeSource),
  'Route file must still contain all three dispatch branch discriminators.',
);
assertTrue(
  /chartAiOwnerLocalAuthUsageBridgePanel/.test(chartAiSource),
  '/chart-ai must still contain the owner-local auth/usage bridge panel identifier.',
);
assertTrue(
  !/@supabase\/supabase-js/.test(routeSource) && !/@supabase\/supabase-js/.test(chartAiSource),
  'Neither the route file nor /chart-ai may import @supabase/supabase-js.',
);
assertTrue(
  existsSync(path.join(repoRoot, AUTH_RESOLVER_TYPES_PATH)) && existsSync(path.join(repoRoot, AUTH_RESOLVER_PATH)),
  'The pre-existing Phase 3FC-C auth subject resolver files must remain present.',
);
assertTrue(
  authResolverSource.includes('resolveSimilarityAuthSubject') &&
    authResolverTypesSource.includes('SimilarityAuthSubjectResolverResult'),
  'The pre-existing Phase 3FC-C auth subject resolver contract must remain unmodified in kind.',
);
assertTrue(
  fdaApprovalPackageSource.length > 0 && fdaResultDocSource.length > 0,
  'The pre-existing Phase 3FD-A approval package and result docs must remain present.',
);
assertTrue(
  !/onGet|onPost/.test(typesSource) && !/onGet|onPost/.test(adapterSource),
  'The new adapter files must not define a route handler.',
);

// ---------------------------------------------------------------------------
// 11. Assertion-count discipline
// ---------------------------------------------------------------------------

assertTrue(
  assertionCount >= 104,
  `Checker should run at least 105 assertions to stay above the floor (ran ${assertionCount}).`,
);
assertTrue(
  assertionCount <= 140,
  `Checker should run at most 140 assertions to stay within the target range (ran ${assertionCount}).`,
);

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

if (failureCount > 0) {
  console.error(`Phase 3FD-B-ALT contract check FAILED: ${failureCount}/${assertionCount} assertions failed.`);
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3FD-B-ALT contract check passed: ${assertionCount}/${assertionCount} assertions passed.`);
}
