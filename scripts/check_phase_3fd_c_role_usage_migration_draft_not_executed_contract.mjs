// Phase 3FD-C static checker for the review-only migration draft.
// Reads repository text only. It does not execute SQL, connect to a database, inspect environment
// values, create a client, start a server, or call any provider.

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

function stripSqlComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');
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

const SQL_PATH = 'supabase/migrations/draft_3fd_c_chart_similarity_role_usage_not_executed.sql';
const REVIEW_PATH = 'docs/planning/phase_3fd_c_role_usage_migration_draft_review_v0.1.md';
const RESULT_PATH = 'docs/planning/phase_3fd_c_role_usage_migration_draft_result_v0.1.md';
const CHECKER_PATH = 'scripts/check_phase_3fd_c_role_usage_migration_draft_not_executed_contract.mjs';
const PACKAGE_PATH = 'package.json';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const UI_PATH = 'src/pages/chart-ai.astro';
const ROLE_PLAN_PATH = 'docs/planning/phase_3fd_c_plan_role_assignment_schema_approval_v0.1.md';
const USAGE_PLAN_PATH = 'docs/planning/phase_3fd_c_plan_usage_store_schema_approval_v0.1.md';
const POLICY_PLAN_PATH = 'docs/planning/phase_3fd_c_plan_rls_retention_idempotency_policy_v0.1.md';
const MIGRATION_PLAN_PATH = 'docs/planning/phase_3fd_c_plan_migration_execution_approval_checklist_v0.1.md';
const PLAN_RESULT_PATH = 'docs/planning/phase_3fd_c_plan_role_usage_schema_migration_approval_result_v0.1.md';

assertTrue(existsSync(path.join(repoRoot, CHECKER_PATH)), 'The Phase 3FD-C checker must exist.');

const sql = readSource(SQL_PATH);
const review = readSource(REVIEW_PATH);
const result = readSource(RESULT_PATH);
const packageSource = readSource(PACKAGE_PATH);
const changelog = readSource(CHANGELOG_PATH);
const route = readSource(ROUTE_PATH);
const ui = readSource(UI_PATH);
const rolePlan = readSource(ROLE_PLAN_PATH);
const usagePlan = readSource(USAGE_PLAN_PATH);
const policyPlan = readSource(POLICY_PLAN_PATH);
const migrationPlan = readSource(MIGRATION_PLAN_PATH);
const planResult = readSource(PLAN_RESULT_PATH);

const sqlFlat = flatten(sql);
const sqlCode = stripSqlComments(sql);
const reviewFlat = flatten(review);
const resultFlat = flatten(result);

// Package and changelog wiring.
assertTrue(
  packageSource.includes(
    '"check:phase-3fd-c-role-usage-migration-draft-not-executed": "node scripts/check_phase_3fd_c_role_usage_migration_draft_not_executed_contract.mjs"',
  ),
  'package.json must contain the exact Phase 3FD-C checker script.',
);
assertTrue(changelog.includes('## Phase 3FD-C - 2026-07-04'), 'Changelog must contain Phase 3FD-C.');
assertTrue(
  changelog.includes('Role Assignment and Usage Store Migration Draft, Not Executed (Implemented)'),
  'Changelog must contain the exact Phase 3FD-C subtitle.',
);
assertTrue(
  changelog.indexOf('## Phase 3FD-C - 2026-07-04') < changelog.indexOf('## Phase 3FD-C-PLAN - 2026-07-04'),
  'Phase 3FD-C must appear above Phase 3FD-C-PLAN.',
);

// Draft-only safety header.
assertIncludesAll(
  sqlFlat,
  [
    'Phase 3FD-C',
    'DRAFT ONLY',
    'NOT EXECUTED',
    'NOT APPROVED FOR EXECUTION',
    'Requires explicit owner approval before execution',
    'Contains no secrets or environment values',
    'Contains no raw user, session, token, KIS, OHLC, account, trading, order, or balance fields',
    'User-facing reads are not approved by default',
    'Service-role usage requires separate approval',
    'Route success must remain disabled',
  ],
  'Draft SQL header',
);

// Tables and approved columns.
assertTrue(
  (sqlCode.match(/create table\s+chart_similarity_/gi) || []).length === 3,
  'Draft SQL must contain exactly three Chart Similarity table drafts.',
);
assertIncludesAll(
  sqlCode,
  [
    'create table chart_similarity_role_assignments',
    'create table chart_similarity_usage_counters',
    'create table chart_similarity_usage_events',
    'subject_ref text not null',
    'granted_by_ref text not null',
    'grant_reason text not null',
    'valid_from timestamptz not null',
    'revoked_by_ref text',
    'usage_scope text not null',
    'period_type text not null',
    'used_count integer not null default 0',
    'limit_count integer not null',
    'idempotency_key text not null',
    'increment_amount integer not null',
    'metadata_safe jsonb not null',
  ],
  'Draft SQL table definitions',
);

// Constraints, approved values, and update guarantees.
assertIncludesAll(
  sqlCode,
  [
    "role in ('authenticated', 'beta', 'owner', 'admin')",
    "status in ('active', 'scheduled', 'expired', 'revoked')",
    "usage_scope = 'chart_similarity_scan'",
    "period_type in ('daily', 'monthly')",
    'used_count >= 0',
    'limit_count >= 0',
    'used_count <= limit_count',
    'increment_amount > 0',
    'unique (idempotency_key)',
    'unique (subject_ref, usage_scope, period_type, period_start)',
    "where status = 'active'",
    'status <> \'revoked\'',
    "jsonb_typeof(metadata_safe) = 'object'",
    'octet_length(metadata_safe::text) <= 2048',
  ],
  'Draft SQL constraints',
);

// Indexes and retention support.
assertIncludesAll(
  sqlCode,
  [
    'chart_similarity_role_assignments_one_active_subject_role_idx',
    'chart_similarity_role_assignments_subject_ref_idx',
    'chart_similarity_role_assignments_role_status_idx',
    'chart_similarity_role_assignments_validity_audit_idx',
    'chart_similarity_usage_counters_subject_period_idx',
    'chart_similarity_usage_counters_retention_idx',
    'chart_similarity_usage_events_subject_period_idx',
    'chart_similarity_usage_events_idempotency_idx',
    'chart_similarity_usage_events_status_retention_idx',
  ],
  'Draft SQL indexes',
);
assertTrue(sqlFlat.includes('counters 24 months'), 'Draft must state the 24-month counter retention target.');
assertTrue(sqlFlat.includes('events 12 months'), 'Draft must state the 12-month event retention target.');
assertTrue(sqlFlat.includes('role audit 5 years'), 'Draft must state the five-year role-audit target.');
assertTrue(sqlFlat.includes('uncertain writes must fail closed'), 'Draft must state the fail-closed rule.');

// RLS is deny-by-default review text only.
assertTrue(
  (sqlCode.match(/enable row level security/gi) || []).length === 3,
  'Draft SQL must include conceptual RLS enablement for all three tables.',
);
assertTrue((sqlCode.match(/create policy/gi) || []).length === 3, 'Draft SQL must contain three deny policies.');
assertTrue((sqlCode.match(/using \(false\)/gi) || []).length === 3, 'Every draft user policy must deny reads.');
assertTrue((sqlCode.match(/with check \(false\)/gi) || []).length === 3, 'Every draft user policy must deny writes.');
assertTrue(sqlFlat.includes('No RLS statement was executed') === false, 'Execution claims belong in review docs, not SQL.');

// Review document.
assertTrue(
  review.startsWith('# Phase 3FD-C Role Usage Migration Draft Review'),
  'Review doc must use the exact title.',
);
assertHeadings(
  review,
  [
    '## 1. Purpose',
    '## 2. Owner Decisions Applied',
    '## 3. Draft Tables',
    '## 4. Draft Constraints and Indexes',
    '## 5. Draft RLS Model',
    '## 6. Redaction Review',
    '## 7. Execution Gate',
    '## 8. Open Items Before Execution',
  ],
  'Review doc',
);
assertIncludesAll(
  reviewFlat,
  [
    'not executed',
    'no database connection',
    'no Supabase client',
    'no route, UI, or runtime source is changed',
    '`chart_similarity_role_assignments`',
    '`chart_similarity_usage_counters`',
    '`chart_similarity_usage_events`',
    '`chart_similarity_scan`',
    '`Asia/Seoul`',
    'unique `idempotency_key`',
    'transactionally',
    '24 months for counters',
    '12 months for events',
    '5 years for role assignment audit',
    'User-facing reads are not approved by default',
    'Service-role usage requires separate approval',
    'No RLS statement was executed',
    'raw Supabase user identifier',
    'Migration execution is not approved',
    'Route success must remain disabled',
    'Owner approves migration execution',
  ],
  'Review doc',
);

// Result document.
assertTrue(
  result.startsWith('# Phase 3FD-C — Role Assignment and Usage Store Migration Draft, Not Executed Result'),
  'Result doc must use the exact title.',
);
assertHeadings(
  result,
  [
    '## 1. Status',
    '## 2. Background',
    '## 3. Implemented Scope',
    '## 4. Migration Draft Result',
    '## 5. Boundary Preservation',
    '## 6. Validation',
    '## 7. Recommended Next Phase',
  ],
  'Result doc',
);
assertIncludesAll(
  resultFlat,
  [
    'Implemented',
    'review-only migration draft',
    'was not executed',
    'No database connection',
    'Supabase client',
    'environment-value read',
    'route source change',
    'UI change',
    'runtime source change',
    'package installation',
    'dependency change',
    'live KIS call',
    'deployment',
    'The API route and `/chart-ai` are unchanged',
    'Server runtime source is unchanged',
    'Phase 3FD-D-PLAN',
    'Phase 3FD-C-HF1',
    'Phase 3FC-K',
  ],
  'Result doc',
);

// Existing plan and runtime boundaries.
assertTrue(rolePlan.includes('chart_similarity_role_assignments'), 'Role plan must remain present.');
assertTrue(usagePlan.includes('chart_similarity_usage_counters'), 'Usage plan must remain present.');
assertTrue(policyPlan.includes('Idempotency Strategy'), 'Policy plan must remain present.');
assertTrue(migrationPlan.includes('Migration Execution Approval Checklist'), 'Migration checklist must remain present.');
assertTrue(planResult.includes('Phase 3FD-C-PLAN'), 'Phase 3FD-C-PLAN result must remain present.');
const dispatchCount = (route.match(/if \(is(?:OwnerLocalMockedSimilarityApiRequestBody|OwnerLocalAuthUsageBridgeSimilarityApiRequestBody|GuardedRuntimeScaffoldSimilarityRequestBody)\(body\)\)/g) || []).length;
assertTrue(dispatchCount === 3, `Route must retain exactly three dispatch branches; found ${dispatchCount}.`);
assertTrue(ui.includes('chartAiOwnerLocalAuthUsageBridgePanel'), '/chart-ai must retain the auth/usage bridge panel.');
assertTrue(!route.includes('draft_3fd_c_chart_similarity_role_usage_not_executed'), 'Route must not import the draft.');
assertTrue(!ui.includes('draft_3fd_c_chart_similarity_role_usage_not_executed'), 'UI must not reference the draft.');

// Unsafe schema content and execution-instruction guards. Comments are excluded from field checks.
assertTrue(!/\b(access_token|refresh_token|jwt|raw_session|raw_user|email|phone)\b/i.test(sqlCode), 'Draft schema must not define identity-secret fields.');
assertTrue(!/\b(cookie|authorization_header|service_role_key|environment_value)\b/i.test(sqlCode), 'Draft schema must not define configuration-secret fields.');
assertTrue(!/\b(kis|ohlc|price|volume)\b/i.test(sqlCode), 'Draft schema must not define provider or market-data fields.');
assertTrue(!/\b(account|trading|order|balance)\b/i.test(sqlCode), 'Draft schema must not define account or trading fields.');
assertTrue(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(sql), 'Draft must not contain an email-shaped value.');
assertTrue(!/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/.test(sql), 'Draft must not contain a JWT-shaped value.');
assertTrue(!/sb_(?:secret|publishable)_[A-Za-z0-9_-]{8,}/.test(sql), 'Draft must not contain a key-shaped value.');
assertTrue(!/^\s*\\(?:connect|i)\b/im.test(sql), 'Draft must not contain psql connection/include commands.');
assertTrue(!/\bsupabase\s+(?:db|migration|link|start)\b/i.test(sql), 'Draft must not contain Supabase CLI commands.');
assertTrue(!/^\s*(?:begin|commit|rollback)\s*;/im.test(sqlCode), 'Draft must not contain transaction execution instructions.');
assertTrue(!/\bpsql\b/i.test(sqlCode), 'Draft SQL code must not invoke psql.');
assertTrue(!/createClient\s*\(/.test(sql), 'Draft must not create a Supabase client.');

assertTrue(assertionCount >= 110, `Checker must run at least 110 assertions; ran ${assertionCount}.`);
assertTrue(assertionCount <= 145, `Checker must run at most 145 assertions; ran ${assertionCount}.`);

if (failureCount > 0) {
  console.error(`Phase 3FD-C migration draft check FAILED: ${failureCount}/${assertionCount} assertions failed.`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FD-C migration draft check passed: ${assertionCount}/${assertionCount} assertions passed.`);
