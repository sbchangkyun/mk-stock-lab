// Phase 3FD-C-PLAN static contract checker.
// Verifies the documentation-only role/usage schema approval package and confirms that the
// existing route, UI, and disabled scaffolds retain their approved boundaries. This checker does
// not execute database code, inspect environment values, or call any provider.

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

function assertHeadings(source, headings, label) {
  const missing = headings.filter((heading) => !source.includes(heading));
  assertTrue(missing.length === 0, `${label} is missing headings: ${missing.join(', ') || 'none'}`);
}

function assertIncludesAll(source, phrases, label) {
  for (const phrase of phrases) {
    assertTrue(source.includes(phrase), `${label} must include: ${phrase}`);
  }
}

function assertIncludesSet(source, phrases, label) {
  const missing = phrases.filter((phrase) => !source.includes(phrase));
  assertTrue(missing.length === 0, `${label} is missing required content: ${missing.join(', ') || 'none'}`);
}

const ROLE_DOC_PATH = 'docs/planning/phase_3fd_c_plan_role_assignment_schema_approval_v0.1.md';
const USAGE_DOC_PATH = 'docs/planning/phase_3fd_c_plan_usage_store_schema_approval_v0.1.md';
const POLICY_DOC_PATH = 'docs/planning/phase_3fd_c_plan_rls_retention_idempotency_policy_v0.1.md';
const MIGRATION_DOC_PATH = 'docs/planning/phase_3fd_c_plan_migration_execution_approval_checklist_v0.1.md';
const RESULT_DOC_PATH = 'docs/planning/phase_3fd_c_plan_role_usage_schema_migration_approval_result_v0.1.md';
const CHECKER_PATH = 'scripts/check_phase_3fd_c_plan_role_usage_schema_migration_approval_contract.mjs';
const PACKAGE_PATH = 'package.json';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const UI_PATH = 'src/pages/chart-ai.astro';
const ROLE_RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityRoleAssignmentResolver.ts';
const ROLE_TYPES_PATH = 'src/lib/server/chartSimilarity/similarityRoleAssignmentResolverTypes.ts';
const USAGE_STORE_PATH = 'src/lib/server/chartSimilarity/similarityUsageStore.ts';
const USAGE_TYPES_PATH = 'src/lib/server/chartSimilarity/similarityUsageStoreTypes.ts';
const PREVIOUS_RESULT_PATH =
  'docs/planning/phase_3fd_b_real_supabase_auth_subject_resolver_disabled_by_default_result_v0.1.md';

assertTrue(existsSync(path.join(repoRoot, CHECKER_PATH)), 'The Phase 3FD-C-PLAN checker must exist.');

const roleDoc = readSource(ROLE_DOC_PATH);
const usageDoc = readSource(USAGE_DOC_PATH);
const policyDoc = readSource(POLICY_DOC_PATH);
const migrationDoc = readSource(MIGRATION_DOC_PATH);
const resultDoc = readSource(RESULT_DOC_PATH);
const packageSource = readSource(PACKAGE_PATH);
const changelog = readSource(CHANGELOG_PATH);
const routeSource = readSource(ROUTE_PATH);
const uiSource = readSource(UI_PATH);
const roleResolver = readSource(ROLE_RESOLVER_PATH);
const roleTypes = readSource(ROLE_TYPES_PATH);
const usageStore = readSource(USAGE_STORE_PATH);
const usageTypes = readSource(USAGE_TYPES_PATH);
const previousResult = readSource(PREVIOUS_RESULT_PATH);

const roleFlat = flatten(roleDoc);
const usageFlat = flatten(usageDoc);
const policyFlat = flatten(policyDoc);
const migrationFlat = flatten(migrationDoc);
const resultFlat = flatten(resultDoc);
const allNewDocs = [roleDoc, usageDoc, policyDoc, migrationDoc, resultDoc].join('\n');

// Package and changelog wiring.
assertTrue(
  packageSource.includes(
    '"check:phase-3fd-c-plan-role-usage-schema-migration-approval": "node scripts/check_phase_3fd_c_plan_role_usage_schema_migration_approval_contract.mjs"',
  ),
  'package.json must contain the exact Phase 3FD-C-PLAN checker script.',
);
assertTrue(changelog.includes('## Phase 3FD-C-PLAN - 2026-07-04'), 'Changelog must contain the phase entry.');
assertTrue(
  changelog.indexOf('## Phase 3FD-C-PLAN - 2026-07-04') < changelog.indexOf('## Phase 3FD-B - 2026-07-04'),
  'Phase 3FD-C-PLAN must be the top phase entry.',
);

// Role assignment schema approval.
assertTrue(
  roleDoc.startsWith('# Phase 3FD-C-PLAN Role Assignment Schema Approval'),
  'Role document must use the exact title.',
);
assertHeadings(
  roleDoc,
  [
    '## 1. Purpose',
    '## 2. Current Role Boundary',
    '## 3. Proposed Role Assignment Table',
    '## 4. Proposed Constraints',
    '## 5. Proposed Indexes',
    '## 6. RLS Policy Proposal',
    '## 7. Audit and Admin Requirements',
    '## 8. Open Owner Decisions',
  ],
  'Role document',
);
assertIncludesSet(
  roleFlat,
  [
    'approval-planning',
    'no SQL file',
    'migration file',
    'database connection',
    'runtime code',
    'route change',
    'UI change',
    'Phase 3FC-D',
    'Phase 3FD-B',
    '`chart_similarity_role_assignments`',
    '`subject_ref`',
    '`granted_by_ref`',
    '`revoked_by_ref`',
    '`authenticated`',
    '`beta`',
    '`owner`',
    '`admin`',
    '`anonymous` is not stored',
    'client role claims are never trusted',
    'one active assignment',
    'No RLS policy is implemented',
    'Every grant',
    'raw Supabase user identifier',
    'Approve migration creation in a later phase',
  ],
  'Role document',
);

// Usage store schema approval.
assertTrue(
  usageDoc.startsWith('# Phase 3FD-C-PLAN Usage Store Schema Approval'),
  'Usage document must use the exact title.',
);
assertHeadings(
  usageDoc,
  [
    '## 1. Purpose',
    '## 2. Current Usage Boundary',
    '## 3. Usage Limit Policy Baseline',
    '## 4. Proposed Usage Counter Table',
    '## 5. Proposed Usage Event Table',
    '## 6. Proposed Constraints and Indexes',
    '## 7. Counter Update Model',
    '## 8. Open Owner Decisions',
  ],
  'Usage document',
);
assertIncludesAll(
  usageFlat,
  [
    'approval planning only',
    'no SQL or migration file',
    'Phase 3FC-E',
    'route success remains blocked',
    '| `anonymous` | 0 | 0 |',
    '| `authenticated` | 3 | 30 |',
    '| `beta` | 10 | 100 |',
    '| `owner` | 50 | 1000 |',
    '| `admin` | 100 | 3000 |',
    '`chart_similarity_usage_counters`',
    '`chart_similarity_usage_events`',
    '`idempotency_key`',
    '`subject_ref`',
    '`usage_scope`',
    '`period_start`',
    '`period_end`',
    '`used_count`',
    '`limit_count`',
    '`increment_amount`',
    '`metadata_safe` must be schema-bounded',
    'unique `idempotency_key`',
    'transactional counter increment',
    'event-first model',
    'fail closed',
    'Approve migration creation in a later phase',
  ],
  'Usage document',
);

// RLS, retention, and idempotency policy.
assertTrue(
  policyDoc.startsWith('# Phase 3FD-C-PLAN RLS Retention and Idempotency Policy'),
  'Policy document must use the exact title.',
);
assertHeadings(
  policyDoc,
  [
    '## 1. Purpose',
    '## 2. RLS Strategy',
    '## 3. Retention Strategy',
    '## 4. Idempotency Strategy',
    '## 5. Redaction Strategy',
    '## 6. Rollback and Backup Strategy',
    '## 7. Open Owner Decisions',
  ],
  'Policy document',
);
assertIncludesAll(
  policyFlat,
  [
    'planning only',
    'no executable RLS',
    'SQL',
    'migration',
    'runtime code',
    'Role assignment writes must be server/admin-only',
    'Usage counter writes must be server-only',
    'Usage event writes must be server-only',
    'Service-role use requires separate owner approval',
    'No RLS policy is implemented',
    'Exact retention periods require owner approval',
    'Every usage increment requires an idempotency key',
    'must not double-charge usage',
    'uncertain write result must fail closed',
    'Raw KIS payload',
    'Account, trading, order, or balance data',
    'migration rollback plan',
    'backup or snapshot',
    'must not enable route success',
    'Approve a future migration execution phase',
  ],
  'Policy document',
);

// Migration execution approval checklist.
assertTrue(
  migrationDoc.startsWith('# Phase 3FD-C-PLAN Migration Execution Approval Checklist'),
  'Migration checklist must use the exact title.',
);
assertHeadings(
  migrationDoc,
  [
    '## 1. Purpose',
    '## 2. Preconditions Before Migration Creation',
    '## 3. Preconditions Before Migration Execution',
    '## 4. Post-Migration Validation Plan',
    '## 5. Explicit Non-Approvals',
  ],
  'Migration checklist',
);
assertIncludesAll(
  migrationFlat,
  [
    'No migration is created or executed here',
    'no SQL file is created here',
    'Owner approves the role assignment table design',
    'Owner approves the usage counter table design',
    'Owner approves the usage event table design',
    'Owner approves the RLS strategy',
    'Owner approves the retention policy',
    'Owner approves the idempotency policy',
    'Owner approves the rollback and backup plan',
    'Target environment is confirmed',
    'Migration contains no secrets',
    'Route success remains disabled',
    'Confirm expected table existence',
    'Confirm client writes are blocked',
    'does not approve migration creation',
    'does not approve migration execution',
    'does not approve migration execution, real database runtime',
  ],
  'Migration checklist',
);

// Result document.
assertTrue(
  resultDoc.startsWith(
    '# Phase 3FD-C-PLAN — Role Assignment and Usage Store Schema/Migration Approval Package Result',
  ),
  'Result document must use the exact title.',
);
assertHeadings(
  resultDoc,
  [
    '## 1. Status',
    '## 2. Background',
    '## 3. Implemented Scope',
    '## 4. Role Assignment Plan Result',
    '## 5. Usage Store Plan Result',
    '## 6. RLS Retention Idempotency Result',
    '## 7. Migration Approval Result',
    '## 8. Boundary Preservation',
    '## 9. Validation',
    '## 10. Recommended Next Phase',
  ],
  'Result document',
);
assertIncludesAll(
  resultFlat,
  [
    'Prepared as a documentation-only approval package',
    'no runtime source change',
    'route source change',
    'UI change',
    'SQL file',
    'migration file',
    'schema file',
    'database connection',
    'Supabase client',
    'environment-value read',
    'package installation',
    'dependency change',
    'live KIS call',
    'deployment',
    'Phase 3FD-B',
    '`chart_similarity_role_assignments`',
    '`chart_similarity_usage_counters`',
    '`chart_similarity_usage_events`',
    'Migration creation is not approved',
    'Migration execution is not approved',
    'The API route is unchanged',
    '`/chart-ai` is unchanged',
    'Phase 3FD-C — Role Assignment and Usage Store Migration Draft, Not Executed',
    'Phase 3FD-B-HF1',
    'Phase 3FC-K',
  ],
  'Result document',
);

// Current runtime boundary and scaffold continuity.
const dispatchBranchCount = (routeSource.match(/if \(is(?:OwnerLocalMockedSimilarityApiRequestBody|OwnerLocalAuthUsageBridgeSimilarityApiRequestBody|GuardedRuntimeScaffoldSimilarityRequestBody)\(body\)\)/g) || []).length;
assertTrue(dispatchBranchCount === 3, `Route must retain exactly three dispatch branches; found ${dispatchBranchCount}.`);
assertTrue(routeSource.includes('isOwnerLocalMockedSimilarityApiRequestBody'), 'Owner-local mocked branch must remain.');
assertTrue(routeSource.includes('isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody'), 'Auth/usage bridge branch must remain.');
assertTrue(routeSource.includes('isGuardedRuntimeScaffoldSimilarityRequestBody'), 'Guarded scaffold branch must remain.');
assertTrue(uiSource.includes('chartAiOwnerLocalAuthUsageBridgePanel'), 'The owner-local UI panel must remain.');
assertTrue(roleResolver.includes('resolveSimilarityRoleAssignment'), 'Role resolver scaffold must remain.');
assertTrue(roleTypes.includes('SimilarityRoleAssignmentRecord'), 'Role assignment type contract must remain.');
assertTrue(usageStore.includes('recordSimilarityUsageIncrement'), 'Usage increment scaffold must remain.');
assertTrue(usageTypes.includes('SimilarityUsageEventRecord'), 'Usage event type contract must remain.');
assertTrue(previousResult.includes('Phase 3FD-B'), 'The Phase 3FD-B result document must remain.');
assertTrue(!routeSource.includes('similarityRealSupabaseAuthSubjectResolver'), 'Route must not wire the real-compatible resolver.');
assertTrue(!uiSource.includes('similarityRealSupabaseAuthSubjectResolver'), 'UI must not wire the real-compatible resolver.');

// Sensitive-value and executable-implementation guards. Conceptual schema terminology is allowed.
assertTrue(!/\bCREATE\s+TABLE\b/i.test(allNewDocs), 'New docs must not contain an executable table-creation statement.');
assertTrue(!/\bALTER\s+TABLE\b/i.test(allNewDocs), 'New docs must not contain an executable table-alteration statement.');
assertTrue(!/\bINSERT\s+INTO\b/i.test(allNewDocs), 'New docs must not contain an executable insert statement.');
assertTrue(!/\bUPDATE\s+[a-z_]+\s+SET\b/i.test(allNewDocs), 'New docs must not contain an executable update statement.');
assertTrue(!/\bDROP\s+TABLE\b/i.test(allNewDocs), 'New docs must not contain an executable drop statement.');
assertTrue(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(allNewDocs), 'New docs must not contain an email-address-shaped value.');
assertTrue(!/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/.test(allNewDocs), 'New docs must not contain a JWT-shaped value.');
assertTrue(!/sb_(?:secret|publishable)_[A-Za-z0-9_-]{8,}/.test(allNewDocs), 'New docs must not contain a Supabase key-shaped value.');
assertTrue(!/\.sql\b/i.test(allNewDocs), 'New docs must not claim or reference a created SQL file path.');
assertTrue(!/migrations\/[A-Za-z0-9_.-]+/i.test(allNewDocs), 'New docs must not reference a created migration path.');
assertTrue(!/connected to (?:the )?(?:real )?database/i.test(allNewDocs), 'New docs must not claim a database connection.');
assertTrue(!/created (?:a )?(?:real )?Supabase client/i.test(allNewDocs), 'New docs must not claim Supabase client creation.');
assertTrue(!/installed (?:a )?(?:new )?package/i.test(allNewDocs), 'New docs must not claim package installation.');
assertTrue(!/(?:deployed|pushed) (?:the )?(?:phase|changes|commit)/i.test(allNewDocs), 'New docs must not claim deployment or push.');

// Assertion-count discipline.
assertTrue(assertionCount >= 115, `Checker must run at least 115 assertions; ran ${assertionCount}.`);
assertTrue(assertionCount <= 150, `Checker must run at most 150 assertions; ran ${assertionCount}.`);

if (failureCount > 0) {
  console.error(`Phase 3FD-C-PLAN contract check FAILED: ${failureCount}/${assertionCount} assertions failed.`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FD-C-PLAN contract check passed: ${assertionCount}/${assertionCount} assertions passed.`);
