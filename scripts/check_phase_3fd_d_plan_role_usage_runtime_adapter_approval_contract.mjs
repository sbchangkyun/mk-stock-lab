// Lean Phase 3FD-D-PLAN static checker.
// Reads only the current approval artifacts and boundary source text. It performs no runtime,
// database, migration, environment, client, network, or provider operation.

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

const PLAN_PATH = 'docs/planning/phase_3fd_d_plan_role_usage_runtime_adapter_approval_v0.1.md';
const RESULT_PATH = 'docs/planning/phase_3fd_d_plan_role_usage_runtime_adapter_approval_result_v0.1.md';
const CHECKER_PATH = 'scripts/check_phase_3fd_d_plan_role_usage_runtime_adapter_approval_contract.mjs';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_PATH = 'package.json';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const UI_PATH = 'src/pages/chart-ai.astro';
const PREVIOUS_RESULT_PATH = 'docs/planning/phase_3fd_c_role_usage_migration_draft_result_v0.1.md';
const PREVIOUS_REVIEW_PATH = 'docs/planning/phase_3fd_c_role_usage_migration_draft_review_v0.1.md';

assertTrue(existsSync(path.join(repoRoot, CHECKER_PATH)), 'The Phase 3FD-D-PLAN checker must exist.');

const plan = readSource(PLAN_PATH);
const result = readSource(RESULT_PATH);
const changelog = readSource(CHANGELOG_PATH);
const packageSource = readSource(PACKAGE_PATH);
const route = readSource(ROUTE_PATH);
const ui = readSource(UI_PATH);
const previousResult = readSource(PREVIOUS_RESULT_PATH);
const previousReview = readSource(PREVIOUS_REVIEW_PATH);
const planFlat = flatten(plan);
const resultFlat = flatten(result);
const newDocs = `${plan}\n${result}`;

// Wiring.
assertTrue(
  packageSource.includes(
    '"check:phase-3fd-d-plan-role-usage-runtime-adapter-approval": "node scripts/check_phase_3fd_d_plan_role_usage_runtime_adapter_approval_contract.mjs"',
  ),
  'package.json must contain the exact checker script.',
);
assertTrue(changelog.includes('## Phase 3FD-D-PLAN - 2026-07-04'), 'Changelog must contain Phase 3FD-D-PLAN.');
assertTrue(
  changelog.includes('Role/Usage Store Runtime Adapter Approval Package, No Runtime Change (Prepared)'),
  'Changelog must contain the exact phase subtitle.',
);
assertTrue(
  changelog.indexOf('## Phase 3FD-D-PLAN - 2026-07-04') < changelog.indexOf('## Phase 3FD-C - 2026-07-04'),
  'Phase 3FD-D-PLAN must be the top phase entry.',
);

// Consolidated approval plan.
assertTrue(
  plan.startsWith('# Phase 3FD-D-PLAN Role/Usage Store Runtime Adapter Approval Package'),
  'Approval plan must use the exact title.',
);
assertHeadings(
  plan,
  [
    '## 1. Purpose',
    '## 2. Current State',
    '## 3. Future Runtime Adapter Scope',
    '## 4. Role Assignment Adapter Plan',
    '## 5. Usage Store Adapter Plan',
    '## 6. Supabase Client and Service-role Boundary',
    '## 7. Transaction, Idempotency, and Fail-closed Policy',
    '## 8. Redaction and Forbidden Data',
    '## 9. Approval Gates Before Implementation',
    '## 10. Recommended Next Phase',
  ],
  'Approval plan',
);
assertIncludesAll(
  planFlat,
  [
    'approval planning only',
    'implements no runtime adapter',
    'no database connection',
    'Supabase client',
    'reads no environment value',
    'changes no route or UI',
    'enables no route success',
    'Phase 3FD-B',
    'disabled-by-default',
    'Phase 3FD-C',
    'migration draft that was not executed',
    'Role and usage persistence remain unimplemented',
    '`chart_similarity_role_assignments`',
    '`chart_similarity_usage_counters`',
    '`chart_similarity_usage_events`',
    'Client-supplied roles are never trusted',
    'all writes are server-owned',
    'route integration and activation require later, explicit approval',
    'safe internal `subject_ref`',
    '`authenticated`, `beta`, `owner`, and `admin`',
    '`anonymous` remains derived',
    'require an active, matching, server-owned assignment',
    'Expired, revoked, scheduled, malformed',
    'Multiple active matches fail closed',
    'no raw Supabase user identifier',
    'approved `usage_scope`',
    'daily and monthly counters',
    '`Asia/Seoul`',
    'approved role limits',
    'transactionally',
    'unique `idempotency_key`',
    'never double-charges usage',
    'uncertain read or write result fails closed',
    '`metadata_safe` remains bounded, redacted, and allowlisted',
    'No Supabase client is created in this phase',
    'future client factory requires separate owner approval',
    'Service-role runtime use is not approved',
    'ordinary user client must never write role or usage state',
    'Environment key names and values are not read here',
    'redaction tests, server-only isolation',
    'Role lookup errors',
    'Usage counter absence or ambiguity fails closed',
    'duplicate idempotency key returns its prior safe outcome',
    'Transaction failure or an uncertain commit does not grant execution',
    'Route success remains disabled',
    'Raw Supabase user identifier',
    'Access token, refresh token, JWT',
    'Cookie value, authorization-header value, environment value',
    'Raw KIS or OHLC payload',
    'Account, trading, order, or balance data',
    'Raw similarity score or return',
    'Owner approves role adapter implementation',
    'Owner approves usage adapter implementation',
    'Owner approves the Supabase client factory boundary',
    'Owner approves service-role handling',
    'Owner approves transaction and idempotency behavior',
    'Owner approves redaction test requirements',
    'Owner confirms the migration is still not executed',
    'Owner confirms route success remains disabled',
    'Phase 3FD-D — Role/Usage Store Runtime Adapter Interface Implementation',
    'Phase 3FD-B-HF1',
    'Phase 3FD-C-HF1',
  ],
  'Approval plan',
);

// Result document.
assertTrue(
  result.startsWith('# Phase 3FD-D-PLAN — Role/Usage Store Runtime Adapter Approval Package Result'),
  'Result doc must use the exact title.',
);
assertHeadings(
  result,
  [
    '## 1. Status',
    '## 2. Implemented Scope',
    '## 3. Runtime Adapter Approval Result',
    '## 4. Boundary Preservation',
    '## 5. Validation',
    '## 6. Recommended Next Phase',
  ],
  'Result doc',
);
assertIncludesAll(
  resultFlat,
  [
    'Prepared as a documentation-only approval package',
    'No runtime source, route source, or UI changed',
    'No database connection',
    'Supabase client',
    'environment-value read',
    'migration execution',
    'package installation',
    'dependency change',
    'live KIS call',
    'deployment',
    'One consolidated role/usage runtime adapter approval plan',
    'transactional counter/event behavior',
    'idempotency reconciliation',
    'service-role non-approval',
    'fail-closed handling',
    'The API route and `/chart-ai` are unchanged',
    'Server runtime source is unchanged',
    'migration draft remains unexecuted',
    'Phase 3FD-D — Role/Usage Store Runtime Adapter Interface Implementation',
    'Phase 3FD-B-HF1',
    'Phase 3FD-C-HF1',
  ],
  'Result doc',
);

// Latest-chain and runtime boundary continuity.
assertTrue(previousResult.includes('not executed'), 'Phase 3FD-C result must retain its non-execution boundary.');
assertTrue(previousReview.includes('Service-role usage requires separate approval'), 'Phase 3FD-C service-role boundary must remain.');
const dispatchCount = (route.match(/if \(is(?:OwnerLocalMockedSimilarityApiRequestBody|OwnerLocalAuthUsageBridgeSimilarityApiRequestBody|GuardedRuntimeScaffoldSimilarityRequestBody)\(body\)\)/g) || []).length;
assertTrue(dispatchCount === 3, `Route must retain exactly three dispatch branches; found ${dispatchCount}.`);
assertTrue(ui.includes('chartAiOwnerLocalAuthUsageBridgePanel'), '/chart-ai must retain its auth/usage bridge panel.');
assertTrue(!route.includes('phase_3fd_d_plan_role_usage_runtime_adapter'), 'Route must not reference the new plan.');
assertTrue(!ui.includes('phase_3fd_d_plan_role_usage_runtime_adapter'), 'UI must not reference the new plan.');
assertTrue(!/changes were deployed|commit was pushed/i.test(newDocs), 'Docs must not claim deploy or push occurred.');
assertTrue(!/installed (?:a )?(?:new )?package/i.test(newDocs), 'Docs must not claim package installation.');
assertTrue(!/dependency was (?:added|changed|upgraded)/i.test(newDocs), 'Docs must not claim dependency changes.');

// No secret-shaped values may appear. Policy vocabulary is allowed; concrete values are not.
assertTrue(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(newDocs), 'Docs must not contain an email-shaped value.');
assertTrue(!/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/.test(newDocs), 'Docs must not contain a JWT-shaped value.');
assertTrue(!/sb_(?:secret|publishable)_[A-Za-z0-9_-]{8,}/.test(newDocs), 'Docs must not contain a Supabase key-shaped value.');
assertTrue(!/Bearer\s+[A-Za-z0-9._-]{12,}/.test(newDocs), 'Docs must not contain an authorization value.');

assertTrue(assertionCount >= 90, `Checker must run at least 90 assertions; ran ${assertionCount}.`);
assertTrue(assertionCount <= 120, `Checker must run at most 120 assertions; ran ${assertionCount}.`);

if (failureCount > 0) {
  console.error(`Phase 3FD-D-PLAN check FAILED: ${failureCount}/${assertionCount} assertions failed.`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FD-D-PLAN check passed: ${assertionCount}/${assertionCount} assertions passed.`);
