// Narrow Phase 3FD-D static checker for the disabled mocked-DB-only runtime adapter.

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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

function readSource(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  assertTrue(existsSync(fullPath), `Expected file to exist: ${relativePath}`);
  return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

function flatten(source) {
  return source.replace(/\s+/g, ' ').trim();
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function assertIncludesAll(source, phrases, label) {
  for (const phrase of phrases) assertTrue(source.includes(phrase), `${label} must include: ${phrase}`);
}

function assertIncludesSet(source, phrases, label) {
  const missing = phrases.filter((phrase) => !source.includes(phrase));
  assertTrue(missing.length === 0, `${label} is missing required content: ${missing.join(', ') || 'none'}`);
}

function assertHeadings(source, headings, label) {
  const missing = headings.filter((heading) => !source.includes(heading));
  assertTrue(missing.length === 0, `${label} is missing headings: ${missing.join(', ') || 'none'}`);
}

const TYPES_PATH = 'src/lib/server/chartSimilarity/similarityRoleUsageRuntimeAdapterTypes.ts';
const ADAPTER_PATH = 'src/lib/server/chartSimilarity/similarityRoleUsageRuntimeAdapter.ts';
const FIXTURES_PATH = 'src/lib/server/chartSimilarity/mockedSimilarityRoleUsageRuntimeAdapterFixtures.ts';
const INDEX_PATH = 'src/lib/server/chartSimilarity/index.ts';
const SMOKE_PATH = 'scripts/smoke_phase_3fd_d_role_usage_runtime_adapter_interface_mocked_db_only.mjs';
const CHECKER_PATH = 'scripts/check_phase_3fd_d_role_usage_runtime_adapter_interface_mocked_db_only_contract.mjs';
const RESULT_PATH = 'docs/planning/phase_3fd_d_role_usage_runtime_adapter_interface_mocked_db_only_result_v0.1.md';
const PACKAGE_PATH = 'package.json';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const UI_PATH = 'src/pages/chart-ai.astro';
const PLAN_RESULT_PATH = 'docs/planning/phase_3fd_d_plan_role_usage_runtime_adapter_approval_result_v0.1.md';
const PREVIOUS_RESULT_PATH = 'docs/planning/phase_3fd_c_role_usage_migration_draft_result_v0.1.md';

assertTrue(existsSync(path.join(repoRoot, CHECKER_PATH)), 'Checker script must exist.');

const types = readSource(TYPES_PATH);
const adapter = readSource(ADAPTER_PATH);
const fixtures = readSource(FIXTURES_PATH);
const indexSource = readSource(INDEX_PATH);
const smoke = readSource(SMOKE_PATH);
const result = readSource(RESULT_PATH);
const packageSource = readSource(PACKAGE_PATH);
const changelog = readSource(CHANGELOG_PATH);
const route = readSource(ROUTE_PATH);
const ui = readSource(UI_PATH);
const planResult = readSource(PLAN_RESULT_PATH);
const previousResult = readSource(PREVIOUS_RESULT_PATH);

const typesNoComments = stripComments(types);
const adapterNoComments = stripComments(adapter);
const fixturesNoComments = stripComments(fixtures);
const newRuntimeNoComments = `${typesNoComments}\n${adapterNoComments}\n${fixturesNoComments}`;
const resultFlat = flatten(result);

// Scripts and phase wiring.
assertTrue(
  packageSource.includes(
    '"check:phase-3fd-d-role-usage-runtime-adapter-interface-mocked-db-only": "node scripts/check_phase_3fd_d_role_usage_runtime_adapter_interface_mocked_db_only_contract.mjs"',
  ),
  'package.json must contain the exact checker script.',
);
assertTrue(
  packageSource.includes(
    '"smoke:phase-3fd-d-role-usage-runtime-adapter-interface-mocked-db-only": "node scripts/smoke_phase_3fd_d_role_usage_runtime_adapter_interface_mocked_db_only.mjs"',
  ),
  'package.json must contain the exact smoke script.',
);
assertTrue(changelog.includes('## Phase 3FD-D - 2026-07-04'), 'Changelog must contain Phase 3FD-D.');
assertTrue(
  changelog.includes('Role/Usage Store Runtime Adapter Interface Implementation, Disabled by Default, Mocked DB Only (Implemented)'),
  'Changelog must contain the exact Phase 3FD-D subtitle.',
);
assertTrue(
  changelog.indexOf('## Phase 3FD-D - 2026-07-04') < changelog.indexOf('## Phase 3FD-D-PLAN - 2026-07-04'),
  'Phase 3FD-D must appear above Phase 3FD-D-PLAN.',
);

// Type contract.
assertIncludesAll(
  types,
  [
    'SimilarityRoleUsageRuntimeAdapterStatus',
    'SimilarityRoleUsageRuntimeAdapterSource',
    'SimilarityRoleUsageRuntimeAdapterPolicy',
    'SimilarityRoleUsageRuntimeAdapterSafePolicySummary',
    'SimilarityRoleUsageRuntimeSubject',
    'SimilarityRoleUsageResolvedRole',
    'SimilarityRoleAssignmentRecord',
    'SimilarityUsageCounterRecord',
    'SimilarityUsageEventRecord',
    'SimilarityRoleUsageRuntimeAdapterRequest',
    'SimilarityRoleUsageRuntimeAdapterDecision',
    'SimilarityRoleUsageRuntimeAdapterResult',
    'SimilarityRoleUsageMockDb',
    'SimilarityRoleUsageRuntimeAdapterDeps',
    "'disabled'",
    "'resolved'",
    "'role_ambiguous'",
    "'role_invalid'",
    "'usage_not_found'",
    "'usage_limited'",
    "'idempotent_replay'",
    "'transaction_failed'",
    "'mock_db_unavailable'",
    "'redaction_failed'",
    "'mocked-db'",
    'allowRealDb: false',
    'allowSupabaseClient: false',
    'allowEnvRead: false',
    'allowServiceRole: false',
    'allowRouteSuccess: false',
    'allowUserClientWrite: false',
    'allowRawDbEcho: false',
    'findRoleAssignments(subjectRef: string)',
    'findUsageCounter(input:',
    'findUsageEventByIdempotencyKey(idempotencyKey: string)',
    'commitUsageEventAndCounter(input:',
  ],
  'Types file',
);
assertTrue(!/\b(accessToken|refreshToken|rawSession|rawUser|emailAddress|phoneNumber)\s*[?:]/.test(typesNoComments), 'Types must not define sensitive fields.');
assertTrue(!/\b(account|trading|order|balance)\s*[?:]/i.test(typesNoComments), 'Types must not define account or trading fields.');

// Adapter implementation.
assertIncludesAll(
  adapter,
  [
    'buildDefaultSimilarityRoleUsageRuntimeAdapterPolicy',
    'buildMockedDbSimilarityRoleUsageRuntimeAdapterPolicy',
    'normalizeSimilarityRoleUsageRuntimeAdapterRequest',
    'resolveSimilarityRoleUsageRuntimeAdapter',
    'resolveRoleFromAssignments',
    'computeUsageDecision',
    'mapUsageRemainingBucket',
    'assertSimilarityRoleUsageRuntimeAdapterResultIsSafe',
    'enabled: false',
    'allowMockedDb: false',
    'enabled: true',
    'allowMockedDb: true',
    "status: 'disabled'",
    "status: 'mock_db_unavailable'",
    "status: 'role_ambiguous'",
    "status: 'role_invalid'",
    "status: 'usage_not_found'",
    "status: 'usage_limited'",
    "status: 'idempotent_replay'",
    "status: 'transaction_failed'",
    'findUsageEventByIdempotencyKey',
    'commitUsageEventAndCounter',
    'multiple_active_assignments',
    'inactive_assignment_ignored',
    'usage_counter_unavailable',
    'transaction_failed',
    'collectPrimitiveValues',
    'EMAIL_ADDRESS_SHAPE_PATTERN',
  ],
  'Adapter',
);
assertTrue(
  /buildMockedDbSimilarityRoleUsageRuntimeAdapterPolicy[\s\S]{0,250}enabled:\s*true[\s\S]{0,100}allowMockedDb:\s*true/.test(adapter),
  'Mocked policy builder must only enable mocked execution.',
);
assertTrue(
  !/allowRealDb:\s*true|allowSupabaseClient:\s*true|allowEnvRead:\s*true|allowServiceRole:\s*true|allowRouteSuccess:\s*true/.test(adapterNoComments),
  'Adapter must never enable a real capability.',
);

// Fixtures and exports.
assertIncludesSet(
  fixtures,
  [
    'buildMockedRoleUsageRuntimeAdapterRequest',
    'buildMockedRoleUsageRuntimeAdapterPolicy',
    'buildMockedDbWithAuthenticatedUsageAvailable',
    'buildMockedDbWithBetaRoleUsageAvailable',
    'buildMockedDbWithOwnerRoleUsageAvailable',
    'buildMockedDbWithAdminRoleUsageAvailable',
    'buildMockedDbWithUsageLimited',
    'buildMockedDbWithIdempotentReplay',
    'buildMockedDbWithAmbiguousRoleAssignments',
    'buildMockedDbWithExpiredRoleAssignment',
    'buildMockedDbWithMalformedRoleAssignment',
    'buildMockedDbWithMissingCounters',
    'buildMockedDbWithTransactionFailure',
    'buildMockedDbUnavailable',
    'mock-subject-ref-001',
    'mock-assignment-ref-001',
    'mock-counter-ref-001',
    'mock-event-ref-001',
    'mock-idempotency-key-001',
    '2026-07-04T12:00:00.000+09:00',
    'getCommitCallCount',
  ],
  'Fixtures',
);
assertTrue(indexSource.includes("from './similarityRoleUsageRuntimeAdapterTypes'"), 'Index must export new types.');
assertTrue(indexSource.includes("from './similarityRoleUsageRuntimeAdapter'"), 'Index must export adapter functions.');
assertTrue(indexSource.includes("from './mockedSimilarityRoleUsageRuntimeAdapterFixtures'"), 'Index must export fixtures.');
assertTrue(indexSource.includes('SimilarityRoleUsageRuntimeAssignmentRecord'), 'Index must avoid the legacy assignment-name collision.');
assertTrue(indexSource.includes('resolveSimilarityAuthSubject'), 'Index must preserve previous auth exports.');
assertTrue(indexSource.includes('resolveSimilarityFeatureFlags'), 'Index must preserve previous flag exports.');

// Smoke coverage.
assertIncludesAll(
  smoke,
  [
    'A default disabled',
    'B unavailable',
    'C authenticated',
    'D beta',
    'E owner',
    'F admin',
    'G limited',
    'H replay',
    'I ambiguous',
    'J expired',
    'K malformed',
    'L missing counters',
    'M transaction failure',
    'N: safety assertion',
    'O: adapter must never call fetch',
    'getCommitCallCount()',
    'assertionCount >= 90',
  ],
  'Smoke script',
);

// Result and historical boundary.
assertTrue(
  result.startsWith('# Phase 3FD-D — Role/Usage Store Runtime Adapter Interface Implementation, Disabled by Default, Mocked DB Only Result'),
  'Result doc must use the exact title.',
);
assertHeadings(
  result,
  ['## 1. Status', '## 2. Implemented Scope', '## 3. Runtime Adapter Result', '## 4. Boundary Preservation', '## 5. Validation', '## 6. Recommended Next Phase'],
  'Result doc',
);
assertIncludesAll(
  resultFlat,
  [
    'disabled by default',
    'mocked DB',
    'No real database connection',
    'Supabase client',
    'environment-value read',
    'migration execution',
    'route source change',
    'UI change',
    'live KIS call',
    'The API route and `/chart-ai` are unchanged',
    'Server provider source is unchanged',
    'Phase 3FD-E-PLAN',
    'Phase 3FD-B-HF1',
    'Phase 3FD-D-HF1',
  ],
  'Result doc',
);
assertTrue(planResult.includes('Phase 3FD-D-PLAN'), 'Phase 3FD-D-PLAN result must remain present.');
assertTrue(previousResult.includes('not executed'), 'Phase 3FD-C result must retain non-execution status.');

// Forbidden operations and route/UI continuity.
assertTrue(!/@supabase\//.test(newRuntimeNoComments), 'New runtime files must not import Supabase.');
assertTrue(!/createClient\s*\(/.test(newRuntimeNoComments), 'New runtime files must not create a client.');
assertTrue(!/process\.env(?:\.|\[)/.test(newRuntimeNoComments), 'New runtime files must not access process env values.');
assertTrue(!/import\.meta\.env/.test(newRuntimeNoComments), 'New runtime files must not access import meta env.');
assertTrue(!/\bfetch\s*\(/.test(newRuntimeNoComments), 'New runtime files must not call fetch.');
assertTrue(!/pages\/api|pages\\api|chart-ai\.astro/.test(newRuntimeNoComments), 'New runtime files must not import route/UI source.');
assertTrue(!/kisOhlcProvider|serverOnlyKis|mockedKis/.test(newRuntimeNoComments), 'New runtime files must not import KIS providers.');
assertTrue(!/\bCREATE\s+TABLE\b|\bALTER\s+TABLE\b/i.test(newRuntimeNoComments), 'New runtime files must not execute SQL.');
const dispatchCount = (route.match(/if \(is(?:OwnerLocalMockedSimilarityApiRequestBody|OwnerLocalAuthUsageBridgeSimilarityApiRequestBody|GuardedRuntimeScaffoldSimilarityRequestBody)\(body\)\)/g) || []).length;
assertTrue(dispatchCount === 3, `Route must retain exactly three branches; found ${dispatchCount}.`);
assertTrue(ui.includes('chartAiOwnerLocalAuthUsageBridgePanel'), '/chart-ai must retain the auth/usage bridge panel.');

assertTrue(assertionCount >= 110, `Checker must run at least 110 assertions; ran ${assertionCount}.`);
assertTrue(assertionCount <= 145, `Checker must run at most 145 assertions; ran ${assertionCount}.`);

if (failureCount > 0) {
  console.error(`Phase 3FD-D contract check FAILED: ${failureCount}/${assertionCount} assertions failed.`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FD-D contract check passed: ${assertionCount}/${assertionCount} assertions passed.`);
