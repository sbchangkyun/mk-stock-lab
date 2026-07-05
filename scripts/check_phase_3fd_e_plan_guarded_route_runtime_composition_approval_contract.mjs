// Lean Phase 3FD-E-PLAN static checker for the guarded-route composition approval package.

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

function assertIncludesAll(source, phrases, label) {
  for (const phrase of phrases) assertTrue(source.includes(phrase), `${label} must include: ${phrase}`);
}

function assertHeadings(source, headings, label) {
  const missing = headings.filter((heading) => !source.includes(heading));
  assertTrue(missing.length === 0, `${label} is missing headings: ${missing.join(', ') || 'none'}`);
}

const PLAN_PATH = 'docs/planning/phase_3fd_e_plan_guarded_route_runtime_composition_approval_v0.1.md';
const RESULT_PATH = 'docs/planning/phase_3fd_e_plan_guarded_route_runtime_composition_approval_result_v0.1.md';
const CHECKER_PATH = 'scripts/check_phase_3fd_e_plan_guarded_route_runtime_composition_approval_contract.mjs';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_PATH = 'package.json';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const UI_PATH = 'src/pages/chart-ai.astro';
const D_RESULT_PATH = 'docs/planning/phase_3fd_d_role_usage_runtime_adapter_interface_mocked_db_only_result_v0.1.md';
const D_PLAN_RESULT_PATH = 'docs/planning/phase_3fd_d_plan_role_usage_runtime_adapter_approval_result_v0.1.md';
const C_RESULT_PATH = 'docs/planning/phase_3fd_c_role_usage_migration_draft_result_v0.1.md';

assertTrue(existsSync(path.join(repoRoot, CHECKER_PATH)), 'Checker script must exist.');

const plan = readSource(PLAN_PATH);
const result = readSource(RESULT_PATH);
const changelog = readSource(CHANGELOG_PATH);
const packageSource = readSource(PACKAGE_PATH);
const route = readSource(ROUTE_PATH);
const ui = readSource(UI_PATH);
const dResult = readSource(D_RESULT_PATH);
const dPlanResult = readSource(D_PLAN_RESULT_PATH);
const cResult = readSource(C_RESULT_PATH);
const planFlat = flatten(plan);
const resultFlat = flatten(result);
const newDocs = `${plan}\n${result}`;

// Wiring.
assertTrue(
  packageSource.includes(
    '"check:phase-3fd-e-plan-guarded-route-runtime-composition-approval": "node scripts/check_phase_3fd_e_plan_guarded_route_runtime_composition_approval_contract.mjs"',
  ),
  'package.json must contain the exact checker script.',
);
assertTrue(changelog.includes('## Phase 3FD-E-PLAN - 2026-07-04'), 'Changelog must contain Phase 3FD-E-PLAN.');
assertTrue(
  changelog.includes('Guarded Route Runtime Composition Approval Package, No Runtime Change (Prepared)'),
  'Changelog must contain the exact phase subtitle.',
);
assertTrue(
  changelog.indexOf('## Phase 3FD-E-PLAN - 2026-07-04') < changelog.indexOf('## Phase 3FD-D - 2026-07-04'),
  'Phase 3FD-E-PLAN must be the top phase entry.',
);

// Consolidated plan.
assertTrue(
  plan.startsWith('# Phase 3FD-E-PLAN Guarded Route Runtime Composition Approval Package'),
  'Approval plan must use the exact title.',
);
assertHeadings(
  plan,
  [
    '## 1. Purpose',
    '## 2. Current State',
    '## 3. Future Composition Sequence',
    '## 4. Runtime Components to Compose',
    '## 5. Fail-closed Matrix',
    '## 6. Safe Response Shape',
    '## 7. Approval Gates Before Implementation',
    '## 8. Explicit Non-Approvals',
    '## 9. Recommended Next Phase',
  ],
  'Approval plan',
);
assertIncludesAll(
  planFlat,
  [
    'approval planning only',
    'no route source change',
    'UI change',
    'runtime implementation change',
    'no database connection',
    'Supabase client',
    'reads no environment value',
    'executes no migration',
    'enables no route success',
    'auth subject resolver exists but is disabled by default',
    'role/usage runtime adapter exists but is disabled by default and mocked-DB-only',
    'feature flag resolver exists but remains disabled by default',
    'guarded route scaffold exists and still fails closed',
    'Route success, beta activation, public activation, and live KIS remain blocked',
    'Validate the request shape and explicit route mode',
    'Resolve the auth subject',
    'Resolve role and usage through the runtime adapter',
    'Evaluate feature flags and dependency gates',
    'Evaluate provider execution eligibility',
    'Run mocked/provider-compatible execution',
    'Shape a safe, bucketed API response',
    'Apply the final fail-closed fallback',
    'does not implement this sequence',
    'Route behavior remains unchanged',
    'Supabase Auth subject resolver boundary',
    'Role/usage runtime adapter boundary',
    'Feature flag resolver boundary',
    'Guarded route scaffold boundary',
    'Mocked provider-compatible similarity execution boundary',
    'Safe API response builder boundary',
    'No component independently grants route success',
    '| Malformed request |',
    '| Auth disabled |',
    '| Role ambiguous |',
    '| Usage limited |',
    '| Idempotent replay |',
    '| Feature flag disabled |',
    '| Provider execution unavailable |',
    '| Redaction failure |',
    '| Unexpected error |',
    'Route success allowed | Beta/public allowed | Raw data exposure',
    '`guardStatus`',
    '`authState` bucket',
    '`resolvedRole`',
    '`usageRemainingDailyBucket`',
    '`usageRemainingMonthlyBucket`',
    '`engineStatus` bucket',
    '`normalizedBarsAvailable` boolean',
    '`normalizedBarCountBucket`',
    '`matchCountBucket`',
    '`dataPolicy`',
    '`disclaimer`',
    '`safeMessage`',
    'Raw database records or raw usage counts',
    'Raw KIS payload or OHLC price, volume, or timestamp data',
    'Owner approves route composition implementation',
    'Owner approves the exact guarded route request mode',
    'Owner approves auth subject resolver wiring',
    'Owner approves mocked role/usage adapter wiring',
    'Owner approves feature flag gate wiring',
    'Owner approves the safe response shape',
    'Owner confirms route success remains disabled by default',
    'no real DB, Supabase, environment, or live KIS access',
    'does not approve route source changes',
    'Phase 3FD-E — Guarded Route Runtime Composition Scaffold',
    'Phase 3FD-B-HF1',
    'Phase 3FD-D-HF1',
  ],
  'Approval plan',
);

// Result doc.
assertTrue(
  result.startsWith('# Phase 3FD-E-PLAN — Guarded Route Runtime Composition Approval Package Result'),
  'Result doc must use the exact title.',
);
assertHeadings(
  result,
  ['## 1. Status', '## 2. Implemented Scope', '## 3. Composition Approval Result', '## 4. Boundary Preservation', '## 5. Validation', '## 6. Recommended Next Phase'],
  'Result doc',
);
assertIncludesAll(
  resultFlat,
  [
    'Prepared as a documentation-only approval package',
    'No route source, UI, or runtime source changed',
    'No database connection',
    'Supabase client',
    'environment-value read',
    'migration execution',
    'live KIS call',
    'package installation',
    'dependency change',
    'deployment',
    'consolidated guarded-route runtime composition approval plan',
    'dependency-ordered composition sequence',
    'fail-closed matrix',
    'safe response shape',
    'owner approval gates',
    'explicit non-approvals',
    'The API route and `/chart-ai` are unchanged',
    'Server runtime and provider source are unchanged',
    'migration draft remains unexecuted',
    'Phase 3FD-E — Guarded Route Runtime Composition Scaffold',
    'Phase 3FD-B-HF1',
    'Phase 3FD-D-HF1',
  ],
  'Result doc',
);

// Latest-chain and route/UI continuity.
assertTrue(dResult.includes('disabled by default'), 'Phase 3FD-D result must retain the disabled boundary.');
assertTrue(dPlanResult.includes('No database connection'), 'Phase 3FD-D-PLAN result must retain the DB boundary.');
assertTrue(cResult.includes('not executed'), 'Phase 3FD-C result must retain migration non-execution.');
const dispatchCount = (route.match(/if \(is(?:OwnerLocalMockedSimilarityApiRequestBody|OwnerLocalAuthUsageBridgeSimilarityApiRequestBody|GuardedRuntimeScaffoldSimilarityRequestBody)\(body\)\)/g) || []).length;
assertTrue(dispatchCount === 3, `Route must retain exactly three dispatch branches; found ${dispatchCount}.`);
assertTrue(ui.includes('chartAiOwnerLocalAuthUsageBridgePanel'), '/chart-ai must retain its auth/usage bridge panel.');
assertTrue(!route.includes('phase_3fd_e_plan_guarded_route_runtime_composition'), 'Route must not reference the new plan.');
assertTrue(!ui.includes('phase_3fd_e_plan_guarded_route_runtime_composition'), 'UI must not reference the new plan.');

// Policy vocabulary is allowed; concrete unsafe values and positive side-effect claims are not.
assertTrue(!/changes were deployed|commit was pushed/i.test(newDocs), 'Docs must not claim deploy or push occurred.');
assertTrue(!/installed (?:a )?(?:new )?package/i.test(newDocs), 'Docs must not claim package installation.');
assertTrue(!/dependency was (?:added|changed|upgraded)/i.test(newDocs), 'Docs must not claim dependency changes.');
assertTrue(
  !/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(newDocs) &&
    !/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/.test(newDocs) &&
    !/sb_(?:secret|publishable)_[A-Za-z0-9_-]{8,}/.test(newDocs),
  'Docs must not contain email-, JWT-, or key-shaped values.',
);

assertTrue(assertionCount >= 90, `Checker must run at least 90 assertions; ran ${assertionCount}.`);
assertTrue(assertionCount <= 120, `Checker must run at most 120 assertions; ran ${assertionCount}.`);

if (failureCount > 0) {
  console.error(`Phase 3FD-E-PLAN check FAILED: ${failureCount}/${assertionCount} assertions failed.`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FD-E-PLAN check passed: ${assertionCount}/${assertionCount} assertions passed.`);
