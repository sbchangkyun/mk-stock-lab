// Phase 3FD-B static contract checker.
// Verifies the real-compatible Supabase Auth subject resolver scaffold (types, module, fixtures,
// exports), its smoke script, its two new planning docs, the changelog entry, and the package.json
// script lines, and confirms no route/UI source file, dependency, or lockfile was touched by this
// phase. Does not start a dev server, does not read any environment variable, and does not call
// Supabase.

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

const TYPES_PATH = 'src/lib/server/chartSimilarity/similarityRealSupabaseAuthSubjectResolverTypes.ts';
const RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityRealSupabaseAuthSubjectResolver.ts';
const FIXTURES_PATH = 'src/lib/server/chartSimilarity/mockedSimilarityRealSupabaseAuthSubjectResolverFixtures.ts';
const INDEX_PATH = 'src/lib/server/chartSimilarity/index.ts';
const SMOKE_PATH = 'scripts/smoke_phase_3fd_b_real_supabase_auth_subject_resolver_disabled_by_default.mjs';
const CHECKER_PATH = 'scripts/check_phase_3fd_b_real_supabase_auth_subject_resolver_disabled_by_default_contract.mjs';
const CONTRACT_DOC_PATH = 'docs/planning/phase_3fd_b_real_supabase_auth_subject_resolver_contract_v0.1.md';
const RESULT_DOC_PATH = 'docs/planning/phase_3fd_b_real_supabase_auth_subject_resolver_disabled_by_default_result_v0.1.md';
const PACKAGE_JSON_PATH = 'package.json';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const CHART_AI_PAGE_PATH = 'src/pages/chart-ai.astro';
const AUTH_RESOLVER_TYPES_PATH = 'src/lib/server/chartSimilarity/similarityAuthSubjectResolverTypes.ts';
const AUTH_RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityAuthSubjectResolver.ts';
const FDA_APPROVAL_PACKAGE_PATH = 'docs/planning/phase_3fd_a_real_supabase_auth_runtime_approval_package_v0.1.md';
const FDA_RESULT_DOC_PATH = 'docs/planning/phase_3fd_a_real_supabase_auth_runtime_approval_setup_result_v0.1.md';
const ALT_TYPES_PATH = 'src/lib/server/chartSimilarity/similaritySupabaseAuthRuntimeAdapterTypes.ts';
const ALT_ADAPTER_PATH = 'src/lib/server/chartSimilarity/similaritySupabaseAuthRuntimeAdapter.ts';
const ALT_FIXTURES_PATH = 'src/lib/server/chartSimilarity/mockedSimilaritySupabaseAuthRuntimeAdapterFixtures.ts';

assertTrue(existsSync(path.join(repoRoot, CHECKER_PATH)), 'Checker script itself must exist.');

const typesSource = readSource(TYPES_PATH);
const resolverSource = readSource(RESOLVER_PATH);
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
const altTypesSource = readSource(ALT_TYPES_PATH);
const altAdapterSource = readSource(ALT_ADAPTER_PATH);
const altFixturesSource = readSource(ALT_FIXTURES_PATH);

const contractDocFlat = flatten(contractDocSource);
const resultDocFlat = flatten(resultDocSource);
const changelogFlat = flatten(changelogSource);

// ---------------------------------------------------------------------------
// 1. Files / scripts existence + changelog entry
// ---------------------------------------------------------------------------

assertTrue(
  packageJsonSource.includes(
    '"smoke:phase-3fd-b-real-supabase-auth-subject-resolver-disabled-by-default": "node scripts/smoke_phase_3fd_b_real_supabase_auth_subject_resolver_disabled_by_default.mjs"',
  ),
  'package.json must contain the Phase 3FD-B smoke script line.',
);
assertTrue(
  packageJsonSource.includes(
    '"check:phase-3fd-b-real-supabase-auth-subject-resolver-disabled-by-default": "node scripts/check_phase_3fd_b_real_supabase_auth_subject_resolver_disabled_by_default_contract.mjs"',
  ),
  'package.json must contain the Phase 3FD-B check script line.',
);
assertTrue(
  changelogFlat.includes('## Phase 3FD-B - 2026-07-04'),
  'planning_changelog.md must contain a Phase 3FD-B entry.',
);
assertTrue(
  changelogFlat.includes('Real Supabase Auth Subject Resolver Implementation, Disabled by Default (Implemented)'),
  'planning_changelog.md Phase 3FD-B entry must use the exact required subtitle.',
);
assertTrue(
  changelogSource.indexOf('## Phase 3FD-B - 2026-07-04') < changelogSource.indexOf('## Phase 3FD-B-ALT - 2026-07-04'),
  'Phase 3FD-B changelog entry must appear above the Phase 3FD-B-ALT entry.',
);

// ---------------------------------------------------------------------------
// 2. Type contract
// ---------------------------------------------------------------------------

const requiredTypeNames = [
  'SimilarityRealSupabaseAuthSubjectResolverStatus',
  'SimilarityRealSupabaseAuthSubjectResolverSource',
  'SimilarityRealSupabaseAuthSubjectResolverPolicy',
  'SimilarityRealSupabaseAuthSubjectResolverSafePolicySummary',
  'SimilaritySupabaseCompatibleGetUserInput',
  'SimilaritySupabaseCompatibleUser',
  'SimilaritySupabaseCompatibleGetUserResult',
  'SimilaritySupabaseCompatibleAuthClient',
  'SimilarityRealSupabaseAuthSubjectResolverInput',
  'SimilarityRealSupabaseAuthSubjectResolverDeps',
  'SimilarityRealSupabaseAuthSubject',
  'SimilarityRealSupabaseAuthSubjectResolverResult',
  'SimilarityRealSupabaseAuthSubjectResolverSubjectSeed',
];
assertTrue(
  requiredTypeNames.every((name) => typesSource.includes(name)),
  `Types file must declare all required type names (${requiredTypeNames.join(', ')}).`,
);

const requiredStatusValues = [
  "'disabled'",
  "'resolved'",
  "'missing_session'",
  "'invalid_session'",
  "'expired_session'",
  "'malformed_session'",
  "'client_unavailable'",
  "'redaction_failed'",
  "'error'",
];
assertTrue(
  requiredStatusValues.every((value) => typesSource.includes(value)),
  `Types file resolver status union must include all required states (${requiredStatusValues.join(', ')}).`,
);
assertTrue(
  typesSource.includes("'injected-supabase-compatible-client'"),
  'Types file must declare the injected-supabase-compatible-client source literal.',
);
const requiredPolicyRealCapabilityFields = [
  'allowRealSupabaseClientCreation: false',
  'allowEnvRead: false',
  'allowCookieRead: false',
  'allowHeaderRead: false',
  'allowJwtVerification: false',
  'allowRouteSuccess: false',
  'allowClientRoleTrust: false',
  'allowRawSessionEcho: false',
  'allowRawUserEcho: false',
];
assertTrue(
  requiredPolicyRealCapabilityFields.every((field) => typesSource.includes(field)),
  'Types file policy type must literal-type every real-capability field as false.',
);
assertTrue(
  /enabled:\s*boolean/.test(typesSource) && /allowInjectedSupabaseCompatibleClient:\s*boolean/.test(typesSource),
  'Types file policy type must allow enabled and allowInjectedSupabaseCompatibleClient to vary as booleans.',
);
assertTrue(
  /getUser\(input:\s*SimilaritySupabaseCompatibleGetUserInput\):\s*Promise<SimilaritySupabaseCompatibleGetUserResult>/.test(
    typesSource,
  ),
  'Types file injected client interface must declare an async getUser method returning a promised result.',
);
assertTrue(
  /sessionEvidenceRef:\s*string/.test(typesSource),
  'Types file getUser input shape must declare a redacted sessionEvidenceRef field.',
);
assertTrue(
  /userRef:\s*string/.test(typesSource),
  'Types file compatible user shape must declare a synthetic userRef field.',
);
assertTrue(
  /'email'\s*\|\s*'oauth'\s*\|\s*'unknown'/.test(typesSource),
  'Types file must declare the providerKind union with email/oauth/unknown.',
);
assertTrue(
  /authClient\?:\s*SimilaritySupabaseCompatibleAuthClient \| null/.test(typesSource),
  'Types file resolver deps shape must declare an optional injected authClient.',
);
assertTrue(
  /state:\s*SimilarityRealSupabaseAuthSubjectResolverAuthState/.test(typesSource) &&
    /subjectRef:\s*string \| null/.test(typesSource),
  'Types file resolver subject shape must declare state and subjectRef fields.',
);
assertTrue(
  /roleSeed:\s*SimilarityRealSupabaseAuthSubjectResolverRoleSeed/.test(typesSource),
  'Types file resolver subject shape must declare a roleSeed field bound to the anonymous/authenticated role seed type.',
);
assertTrue(
  /'anonymous' \| 'authenticated'/.test(typesSource),
  'Types file must restrict auth state / role seed unions to anonymous and authenticated only.',
);
assertTrue(
  /ok:\s*boolean/.test(typesSource) && /safeMessage:\s*string/.test(typesSource) && /warnings:\s*string\[\]/.test(typesSource),
  'Types file resolver result shape must declare ok, safeMessage, and warnings fields.',
);
assertTrue(
  !/accessToken|refreshToken|rawSession|rawUser/.test(typesSource),
  'Types file must not declare a forbidden raw token/session/user output field.',
);
assertTrue(
  typesSource.includes('SimilarityRealSupabaseAuthSubjectResolverSubjectSeed'),
  'Types file must declare a subject seed shape compatible with the Phase 3FC-C auth subject contract.',
);

// ---------------------------------------------------------------------------
// 3. Resolver module
// ---------------------------------------------------------------------------

const requiredResolverFunctionNames = [
  'buildDefaultSimilarityRealSupabaseAuthSubjectResolverPolicy',
  'buildInjectedMockSimilarityRealSupabaseAuthSubjectResolverPolicy',
  'normalizeSimilarityRealSupabaseAuthSubjectResolverInput',
  'resolveSimilarityRealSupabaseAuthSubject',
  'mapRealSupabaseAuthSubjectResultToAuthSubjectSeed',
  'assertSimilarityRealSupabaseAuthSubjectResolverResultIsSafe',
];
assertTrue(
  requiredResolverFunctionNames.every(
    (name) => resolverSource.includes(`function ${name}`) || resolverSource.includes(`export function ${name}`),
  ),
  `Resolver module must export all required functions (${requiredResolverFunctionNames.join(', ')}).`,
);
assertTrue(
  /export async function resolveSimilarityRealSupabaseAuthSubject/.test(resolverSource),
  'Resolver module main function must be declared async, since it awaits the injected client.',
);
assertTrue(
  /enabled:\s*false/.test(resolverSource.split('buildDefaultSimilarityRealSupabaseAuthSubjectResolverPolicy')[1]?.split('}')[0] ?? ''),
  'Default policy builder must set enabled to false.',
);
assertTrue(
  resolverSource.includes('allowInjectedSupabaseCompatibleClient: false'),
  'Default policy builder must set allowInjectedSupabaseCompatibleClient to false.',
);
assertTrue(
  resolverSource.includes('enabled: true') && resolverSource.includes('allowInjectedSupabaseCompatibleClient: true'),
  'Injected-mock policy builder must set enabled and allowInjectedSupabaseCompatibleClient to true.',
);
const injectedPolicyBody = resolverSource.split('buildInjectedMockSimilarityRealSupabaseAuthSubjectResolverPolicy')[1] ?? '';
assertTrue(
  !/allowRealSupabaseClientCreation:\s*true|allowEnvRead:\s*true|allowCookieRead:\s*true|allowHeaderRead:\s*true|allowJwtVerification:\s*true|allowRouteSuccess:\s*true|allowClientRoleTrust:\s*true/.test(
    injectedPolicyBody.slice(0, 400),
  ),
  'Injected-mock policy builder must not set any real-capability flag to true.',
);
assertTrue(
  /deps\.authClient\s*\?\?\s*null/.test(resolverSource) || /authClient\s*=\s*deps\.authClient/.test(resolverSource),
  'Resolver module must read the injected client only from the caller-supplied deps object.',
);
assertTrue(
  resolverSource.includes("'client_unavailable'"),
  'Resolver module must produce a client_unavailable status when no injected client is supplied.',
);
assertTrue(
  resolverSource.includes("'missing_session'") &&
    resolverSource.includes("'invalid_session'") &&
    resolverSource.includes("'expired_session'") &&
    resolverSource.includes("'malformed_session'") &&
    resolverSource.includes("'resolved'"),
  'Resolver module must handle all required injected client session states.',
);
assertTrue(
  resolverSource.includes("status === 'client_error'"),
  'Resolver module must handle the injected client error status.',
);
assertTrue(
  resolverSource.includes("state: 'anonymous'") && resolverSource.includes("state: 'authenticated'"),
  'Resolver module must produce both anonymous and authenticated subject states.',
);
assertTrue(
  /client_role_claim_ignored/.test(resolverSource),
  'Resolver module must emit the client_role_claim_ignored warning when a client-claimed role is present.',
);
assertTrue(
  !/roleSeed:\s*['"](beta|owner|admin)['"]/i.test(resolverSource),
  'Resolver module must never assign a beta/owner/admin role seed.',
);
assertTrue(
  resolverSource.includes('mapRealSupabaseAuthSubjectResultToAuthSubjectSeed'),
  'Resolver module must implement the mapping function to the Phase 3FC-C auth subject seed contract.',
);
const mappingBody = resolverSource.split('export function mapRealSupabaseAuthSubjectResultToAuthSubjectSeed')[1] ?? '';
assertTrue(
  /authState:\s*'anonymous'/.test(mappingBody) && /authState:\s*'authenticated'/.test(mappingBody),
  'Mapping function must map to both anonymous and authenticated auth states.',
);
assertTrue(
  !/beta|owner|admin/i.test(mappingBody.split('}')[0] + mappingBody.split('}')[1]),
  'Mapping function must never surface beta/owner/admin in its immediate branches.',
);
assertTrue(
  resolverSource.includes('assertSimilarityRealSupabaseAuthSubjectResolverResultIsSafe'),
  'Resolver module must implement a safety assertion function.',
);
assertTrue(
  /FORBIDDEN_RESULT_SUBSTRINGS/.test(resolverSource),
  'Resolver module must define a forbidden-substrings list used by the safety assertion.',
);
const forbiddenSubstringTerms = [
  'accesstoken',
  'refreshtoken',
  'jwt',
  'rawsession',
  'rawuser',
  'phone',
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
  forbiddenSubstringTerms.every((term) => resolverSource.toLowerCase().includes(`'${term}'`)),
  `Resolver module forbidden-substrings list must include all required terms (${forbiddenSubstringTerms.join(', ')}).`,
);
assertTrue(
  /'"source":"live"'/.test(resolverSource) && /'"source":"auto"'/.test(resolverSource),
  'Resolver module forbidden-substrings list must include the live/auto source markers.',
);
assertTrue(
  /EMAIL_ADDRESS_SHAPE_PATTERN/.test(resolverSource),
  'Resolver module must detect a real email-address-shaped value as forbidden, not merely the bare category word "email".',
);
assertTrue(
  !/createClient\(/.test(resolverSource),
  'Resolver module must not call createClient.',
);
assertTrue(
  normalizeFunctionOnlyReadsPlainObject(resolverSource),
  'Resolver module input normalizer must only read the explicit input object, never Request/cookies/headers/env.',
);
assertTrue(
  !/collectPrimitiveValues[\s\S]{0,200}Object\.keys\(value[\s\S]{0,60}\)\.join/.test(resolverSource),
  'Resolver module safety collector must not itself serialize key names into the checked haystack.',
);

function normalizeFunctionOnlyReadsPlainObject(source) {
  const body = source.split('export function normalizeSimilarityRealSupabaseAuthSubjectResolverInput')[1]?.split('export function')[0] ?? '';
  return body.length > 0 && !/process\.env|import\.meta\.env|document\.cookie|req\.headers|request\.headers|fetch\(/.test(body);
}

// ---------------------------------------------------------------------------
// 4. Forbidden operations (types, resolver, fixtures, index, smoke, source-level)
// ---------------------------------------------------------------------------

// Comment-stripped so that explanatory doc comments (which legitimately mention forbidden
// operation names to describe what the code never does) cannot trip these checks.
const typesNoComments = stripComments(typesSource);
const resolverNoComments = stripComments(resolverSource);
const fixturesNoComments = stripComments(fixturesSource);
const indexNoComments = stripComments(indexSource);

// These two new files must never reach for a real Supabase client, env, cookie/header, JWT
// library, SQL, or a live/auto source marker used as an actual constructed value (as opposed to
// the resolver module's own denylist of such markers, checked separately below).
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

// The resolver module intentionally embeds the JSON-shaped '"source":"live"'/'"source":"auto"'
// marker strings as denylist entries (checked earlier under FORBIDDEN_RESULT_SUBSTRINGS), so it
// is checked against every pattern except the source-marker one.
const RESOLVER_FORBIDDEN_PATTERN_CHECKS = DIRECT_FORBIDDEN_PATTERN_CHECKS;
assertTrue(
  RESOLVER_FORBIDDEN_PATTERN_CHECKS.every(([pattern]) => !pattern.test(resolverNoComments)),
  `Resolver module must not contain any forbidden operation (${RESOLVER_FORBIDDEN_PATTERN_CHECKS.map(([, d]) => d).join('; ')}).`,
);
assertTrue(
  !/\bsource:\s*['"]live['"]|\bsource:\s*['"]auto['"]/.test(resolverNoComments),
  'Resolver module must never construct a result with an actual live/auto source value (only the denylist string literal is permitted).',
);

// index.ts is the pre-existing central export barrel and legitimately re-exports the pre-existing
// KIS provider and route-shell modules from earlier approved phases, so only the operations that
// would be genuinely new/unexpected here are checked.
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

const requiredFixtureInputFunctionNames = [
  'buildMockedMissingSessionRealSupabaseAuthSubjectInput',
  'buildMockedInvalidSessionRealSupabaseAuthSubjectInput',
  'buildMockedExpiredSessionRealSupabaseAuthSubjectInput',
  'buildMockedMalformedSessionRealSupabaseAuthSubjectInput',
  'buildMockedValidEmailRealSupabaseAuthSubjectInput',
  'buildMockedValidOauthRealSupabaseAuthSubjectInput',
  'buildMockedClientRoleClaimRealSupabaseAuthSubjectInput',
  'buildMockedUnsafeLikeRealSupabaseAuthSubjectInputForRedactionTest',
];
const requiredFixtureClientFunctionNames = [
  'buildMockedMissingSessionSupabaseCompatibleAuthClient',
  'buildMockedInvalidSessionSupabaseCompatibleAuthClient',
  'buildMockedExpiredSessionSupabaseCompatibleAuthClient',
  'buildMockedMalformedSessionSupabaseCompatibleAuthClient',
  'buildMockedValidEmailSupabaseCompatibleAuthClient',
  'buildMockedValidOauthSupabaseCompatibleAuthClient',
  'buildMockedClientErrorSupabaseCompatibleAuthClient',
  'buildMockedClientRoleClaimSupabaseCompatibleAuthClient',
];
assertTrue(
  requiredFixtureInputFunctionNames.every((name) => fixturesSource.includes(`export function ${name}`)),
  `Fixtures file must export all required input builder functions (${requiredFixtureInputFunctionNames.join(', ')}).`,
);
assertTrue(
  requiredFixtureClientFunctionNames.every((name) => fixturesSource.includes(`export function ${name}`)),
  `Fixtures file must export all required mocked-client builder functions (${requiredFixtureClientFunctionNames.join(', ')}).`,
);
assertTrue(
  /sessionEvidenceRef:\s*'mock-redacted-session-ref-\d+'/.test(fixturesSource) ||
    /sessionEvidenceRef:\s*''/.test(fixturesSource),
  'Fixtures file must use synthetic mock-redacted-session-ref sessionEvidenceRef values.',
);
assertTrue(
  /userRef:\s*'mock-real-compatible-user-ref-\d+'/.test(fixturesSource),
  'Fixtures file must use synthetic mock-real-compatible-user-ref userRef values.',
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
  fixturesSource.includes('buildMockedUnsafeLikeRealSupabaseAuthSubjectInputForRedactionTest') &&
    !/SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['"][A-Za-z0-9._-]{10,}/.test(fixturesSource),
  'Redaction test fixture must not contain an actual secret value.',
);
assertTrue(
  /async getUser\(\)\s*\{/.test(fixturesSource) || /async getUser\(\)\s*\{[\s\S]*return result;/.test(fixturesSource),
  'Fixtures file mocked clients must implement getUser() as a deterministic local async function.',
);

// ---------------------------------------------------------------------------
// 6. Exports (index.ts)
// ---------------------------------------------------------------------------

assertTrue(
  indexSource.includes("from './similarityRealSupabaseAuthSubjectResolverTypes'"),
  'index.ts must export from the new resolver types module.',
);
assertTrue(
  indexSource.includes("from './similarityRealSupabaseAuthSubjectResolver'"),
  'index.ts must export from the new resolver module.',
);
assertTrue(
  indexSource.includes("from './mockedSimilarityRealSupabaseAuthSubjectResolverFixtures'"),
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
assertTrue(
  indexSource.includes("from './similaritySupabaseAuthRuntimeAdapterTypes'") &&
    indexSource.includes("from './similaritySupabaseAuthRuntimeAdapter'") &&
    indexSource.includes("from './mockedSimilaritySupabaseAuthRuntimeAdapterFixtures'"),
  'index.ts must still export the pre-existing Phase 3FD-B-ALT adapter exports.',
);

// ---------------------------------------------------------------------------
// 7. Smoke script content
// ---------------------------------------------------------------------------

assertTrue(
  smokeSource.includes('resolveSimilarityRealSupabaseAuthSubject'),
  'Smoke script must exercise resolveSimilarityRealSupabaseAuthSubject.',
);
assertTrue(
  smokeSource.includes('await mod.resolveSimilarityRealSupabaseAuthSubject'),
  'Smoke script must await the resolver call, since the resolver is asynchronous.',
);
assertTrue(
  smokeSource.includes('buildDefaultSimilarityRealSupabaseAuthSubjectResolverPolicy'),
  'Smoke script must exercise the default disabled policy case.',
);
assertTrue(
  smokeSource.includes('client_unavailable') && /authClient:\s*\{\}|,\s*\{\},\s*injectedPolicy/.test(smokeSource),
  'Smoke script must exercise the client_unavailable case with no injected client supplied.',
);
assertTrue(
  smokeSource.includes('buildMockedMissingSessionRealSupabaseAuthSubjectInput') &&
    smokeSource.includes('buildMockedInvalidSessionRealSupabaseAuthSubjectInput') &&
    smokeSource.includes('buildMockedExpiredSessionRealSupabaseAuthSubjectInput') &&
    smokeSource.includes('buildMockedMalformedSessionRealSupabaseAuthSubjectInput'),
  'Smoke script must exercise missing/invalid/expired/malformed session fixtures.',
);
assertTrue(
  smokeSource.includes('buildMockedValidEmailRealSupabaseAuthSubjectInput') &&
    smokeSource.includes('buildMockedValidOauthRealSupabaseAuthSubjectInput'),
  'Smoke script must exercise valid email and valid OAuth session fixtures.',
);
assertTrue(
  smokeSource.includes('buildMockedClientRoleClaimRealSupabaseAuthSubjectInput') &&
    smokeSource.includes('client_role_claim_ignored'),
  'Smoke script must exercise the client-claimed-role-ignored case.',
);
assertTrue(
  smokeSource.includes('buildMockedClientErrorSupabaseCompatibleAuthClient'),
  'Smoke script must exercise the injected client error case.',
);
assertTrue(
  smokeSource.includes('mapRealSupabaseAuthSubjectResultToAuthSubjectSeed'),
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
  /valuesOnlyLowercase|collectPrimitiveValues/.test(smokeSource),
  'Smoke script must check forbidden-content assertions against values only, never serialized key names.',
);
assertTrue(
  /assertionCount/.test(smokeSource) && /assertions (passed|failed)/.test(smokeSource),
  'Smoke script must print an assertion count summary.',
);

// ---------------------------------------------------------------------------
// 8. Docs — contract doc
// ---------------------------------------------------------------------------

assertTrue(
  contractDocSource.startsWith('# Phase 3FD-B Real Supabase Auth Subject Resolver Contract'),
  'Contract doc must start with the exact required title.',
);
assertHeadings(
  contractDocSource,
  [
    '## 1. Purpose',
    '## 2. Inputs',
    '## 3. Outputs',
    '## 4. Policy Defaults',
    '## 5. Injected Client Boundary',
    '## 6. Session State Handling',
    '## 7. Subject Mapping',
    '## 8. Redaction and Safety Boundary',
    '## 9. Relationship to Phase 3FD-A',
    '## 10. Future Integration',
  ],
  'Contract doc',
);
assertTrue(
  /real-compatible.{0,40}Supabase Auth subject resolver/i.test(contractDocFlat) && /no real Supabase call/i.test(contractDocFlat),
  'Contract doc Purpose must state real-compatible resolver and no real Supabase call.',
);
assertTrue(
  /no real Supabase client/i.test(contractDocFlat) && /injected/i.test(contractDocFlat),
  'Contract doc must state no real Supabase client and reference the injected client boundary.',
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
  /client_unavailable/.test(contractDocFlat),
  'Contract doc Session State Handling must reference the client_unavailable status.',
);
assertTrue(
  /Phase 3FD-C-PLAN/.test(contractDocFlat) && /Phase 3FD-B-HF1/.test(contractDocFlat),
  'Contract doc Future Integration must recommend Phase 3FD-C-PLAN and list Phase 3FD-B-HF1 as alternative.',
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
  resultDocSource.startsWith(
    '# Phase 3FD-B — Real Supabase Auth Subject Resolver Implementation, Disabled by Default Result',
  ),
  'Result doc must start with the exact required title.',
);
assertHeadings(
  resultDocSource,
  [
    '## 1. Status',
    '## 2. Background',
    '## 3. Implemented Scope',
    '## 4. Resolver Contract Result',
    '## 5. Smoke Result',
    '## 6. Boundary Preservation',
    '## 7. Validation',
    '## 8. Implementation Implication',
    '## 9. Recommended Next Phase',
  ],
  'Result doc',
);
assertTrue(
  /implemented\./i.test(resultDocFlat) && /disabled by default/i.test(resultDocFlat),
  'Result doc Status must state implemented and disabled by default.',
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
  /111\/111 assertions/i.test(resultDocFlat) || /assertions\s+passed/i.test(resultDocFlat),
  'Result doc Smoke Result must record the smoke assertion outcome.',
);
assertTrue(
  /Phase 3FD-C-PLAN/.test(resultDocFlat) && /Phase 3FD-B-HF1/.test(resultDocFlat) && /Phase 3FC-K/.test(resultDocFlat),
  'Result doc Recommended Next Phase must recommend Phase 3FD-C-PLAN, list Phase 3FD-B-HF1 as alternative, and Phase 3FC-K as hold alternative.',
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
  altTypesSource.length > 0 && altAdapterSource.length > 0 && altFixturesSource.length > 0,
  'The pre-existing Phase 3FD-B-ALT mocked adapter files must remain present.',
);
assertTrue(
  altAdapterSource.includes('resolveMockedSimilaritySupabaseAuthRuntimeAdapter'),
  'The pre-existing Phase 3FD-B-ALT mocked adapter contract must remain unmodified in kind.',
);
assertTrue(
  !/onGet|onPost/.test(typesSource) && !/onGet|onPost/.test(resolverSource),
  'The new resolver files must not define a route handler.',
);

// ---------------------------------------------------------------------------
// 11. Assertion-count discipline
// ---------------------------------------------------------------------------

assertTrue(
  assertionCount >= 115,
  `Checker should run at least 115 assertions to stay above the floor (ran ${assertionCount}).`,
);
assertTrue(
  assertionCount <= 150,
  `Checker should run at most 150 assertions to stay within the target range (ran ${assertionCount}).`,
);

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

if (failureCount > 0) {
  console.error(`Phase 3FD-B contract check FAILED: ${failureCount}/${assertionCount} assertions failed.`);
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3FD-B contract check passed: ${assertionCount}/${assertionCount} assertions passed.`);
}
