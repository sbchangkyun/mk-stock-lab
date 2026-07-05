/** Narrow Phase 3FD-F-PLAN documentation-only contract checker. */

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

function assertIncludesAll(source, phrases, label) {
  for (const phrase of phrases) assertTrue(source.includes(phrase), `${label} must include: ${phrase}`);
}

const PLAN_PATH = 'docs/planning/phase_3fd_f_plan_owner_local_guarded_composition_manual_qa_activation_boundary_v0.1.md';
const RESULT_PATH = 'docs/planning/phase_3fd_f_plan_owner_local_guarded_composition_manual_qa_activation_boundary_result_v0.1.md';
const CHECKER_PATH = 'scripts/check_phase_3fd_f_plan_owner_local_guarded_composition_manual_qa_activation_boundary_contract.mjs';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_PATH = 'package.json';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const UI_PATH = 'src/pages/chart-ai.astro';
const PHASE_E_RESULT_PATH = 'docs/planning/phase_3fd_e_guarded_route_runtime_composition_scaffold_all_gates_off_result_v0.1.md';
const PHASE_E_PLAN_RESULT_PATH = 'docs/planning/phase_3fd_e_plan_guarded_route_runtime_composition_approval_result_v0.1.md';
const PHASE_D_RESULT_PATH = 'docs/planning/phase_3fd_d_role_usage_runtime_adapter_interface_mocked_db_only_result_v0.1.md';

assertTrue(existsSync(path.join(repoRoot, CHECKER_PATH)), 'Checker script must exist.');
const plan = readSource(PLAN_PATH);
const result = readSource(RESULT_PATH);
const changelog = readSource(CHANGELOG_PATH);
const packageSource = readSource(PACKAGE_PATH);
const route = readSource(ROUTE_PATH);
const ui = readSource(UI_PATH);
const phaseEResult = readSource(PHASE_E_RESULT_PATH);
const phaseEPlanResult = readSource(PHASE_E_PLAN_RESULT_PATH);
const phaseDResult = readSource(PHASE_D_RESULT_PATH);

assertTrue(
  packageSource.includes('"check:phase-3fd-f-plan-owner-local-guarded-composition-manual-qa-activation-boundary": "node scripts/check_phase_3fd_f_plan_owner_local_guarded_composition_manual_qa_activation_boundary_contract.mjs"'),
  'package.json must contain the exact checker script.',
);
assertTrue(changelog.includes('## Phase 3FD-F-PLAN - 2026-07-04'), 'Changelog must contain Phase 3FD-F-PLAN.');
assertTrue(changelog.includes('Owner-local Guarded Composition Manual QA and Activation Boundary Review, No Runtime Change (Prepared)'), 'Changelog subtitle must be exact.');
assertTrue(changelog.indexOf('## Phase 3FD-F-PLAN - 2026-07-04') < changelog.indexOf('## Phase 3FD-E - 2026-07-04'), 'New phase must be the top entry.');

assertTrue(plan.startsWith('# Phase 3FD-F-PLAN Owner-local Guarded Composition Manual QA and Activation Boundary Review'), 'Plan title must be exact.');
assertIncludesAll(plan, [
  '## 1. Purpose',
  '## 2. Current State',
  '## 3. Owner-local Manual QA Scope',
  '## 4. Suggested Owner-local QA Scenarios',
  '## 5. Activation Boundary',
  '## 6. Approval Gates Before Any Activation',
  '## 7. Go / No-go Criteria',
  '## 8. Known Non-blocking Documentation Cleanup',
  '## 9. Recommended Next Phase',
], 'Plan headings');
assertIncludesAll(plan, [
  'documentation-only',
  'no route source',
  'UI change',
  'runtime source change',
  'connects to no database',
  'creates no Supabase client',
  'reads no environment value',
  'executes no migration',
  'calls no live KIS',
  'route success',
  'exactly three dispatch branches',
  'All gates remain off',
  'Provider execution and route success remain disabled',
], 'Plan boundary');
assertIncludesAll(plan, [
  'Default POST without an approved body',
  'Malformed JSON falls back safely',
  'Guarded runtime scaffold body',
  'does not expose composition internals',
  'Owner-local mocked branch',
  'Owner-local auth/usage bridge branch',
  '/chart-ai?ownerLocalMocked=1',
  '/chart-ai?ownerLocalAuthUsageBridge=1',
  'No beta/public route is exposed',
  'No live KIS call occurs',
  'does not execute manual QA',
  'This phase does not edit prior result',
], 'Manual QA scope');
assertIncludesAll(plan, [
  'Owner approves route success semantics',
  'Owner approves the exact route request mode',
  'Owner approves auth runtime wiring',
  'Owner approves role/usage runtime wiring',
  'Owner approves feature flag gate wiring',
  'Owner approves the safe response shape',
  'Owner approves whether provider execution may run',
  'Owner approves beta/public activation scope',
  'Owner approves migration execution separately',
  'Owner approves live KIS separately',
  'Owner approves deployment separately',
], 'Approval gates');
assertIncludesAll(plan, [
  'Go for a future implementation phase only if',
  'No-go if any guarded path returns success',
  'replacement characters',
  'documentation formatting only',
  'non-blocking',
  'Phase 3FD-F — Owner-local Guarded Composition Manual QA Package',
  'Phase 3FD-E-HF1 — Guarded Composition Scaffold Revisions',
  'Phase 3FD-B-HF1 — Real Supabase Client Factory Approval Package',
], 'Decision and recommendation');

assertTrue(result.startsWith('# Phase 3FD-F-PLAN — Owner-local Guarded Composition Manual QA and Activation Boundary Review Result'), 'Result title must be exact.');
assertIncludesAll(result, [
  '## 1. Status', '## 2. Implemented Scope', '## 3. Manual QA Plan Result',
  '## 4. Activation Boundary Result', '## 5. Boundary Preservation',
  '## 6. Validation', '## 7. Recommended Next Phase',
  'documentation-only',
  'No route source, UI, or runtime source changed',
  'No database',
  'no Supabase client',
  'no environment value',
  'no migration',
  'no live KIS',
  'No package was installed',
  'no dependency changed',
  'No deployment or push occurred',
  'Phase 3FD-F — Owner-local Guarded Composition Manual QA Package',
], 'Result');

const dispatchCount = (route.match(/if \(is(?:OwnerLocalMockedSimilarityApiRequestBody|OwnerLocalAuthUsageBridgeSimilarityApiRequestBody|GuardedRuntimeScaffoldSimilarityRequestBody)\(body\)\)/g) || []).length;
assertTrue(dispatchCount === 3, `Route must retain exactly three dispatch branches; found ${dispatchCount}.`);
assertTrue(route.includes('runSimilarityGuardedRouteRuntimeComposition'), 'Route must import and call the composition scaffold.');
assertTrue(route.includes('return jsonResponse(buildSimilarityApiRouteShellResult({}));'), 'Route must preserve the safe disabled shell fallback.');
assertTrue(ui.includes('chartAiOwnerLocalAuthUsageBridgePanel'), '/chart-ai must retain the auth/usage bridge panel.');
assertTrue(phaseEResult.includes('all gates off'), 'Phase 3FD-E result must retain all-gates-off status.');
assertTrue(phaseEPlanResult.includes('Phase 3FD-E-PLAN'), 'Phase 3FD-E-PLAN result must remain present.');
assertTrue(phaseDResult.includes('mocked DB'), 'Phase 3FD-D result must remain present.');

const newDocs = `${plan}\n${result}`;
assertTrue(!/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(newDocs), 'New docs must contain no email-address-shaped value.');
assertTrue(!/(?:access|refresh)[_-]?token\s*[:=]\s*["'][^"']+/i.test(newDocs), 'New docs must contain no token value.');
assertTrue(!/(?:password|credential|secret)\s*[:=]\s*["'][^"']+/i.test(newDocs), 'New docs must contain no credential value.');
assertTrue(!/(?:KIS_APP_KEY|KIS_APP_SECRET|SUPABASE_SERVICE_ROLE_KEY)\s*=/.test(newDocs), 'New docs must contain no configuration value.');
assertTrue(!/\b(?:open|read|load)\s+\.env\b/i.test(newDocs), 'New docs must not direct environment-file inspection.');
assertTrue(!/\b(?:fetch|curl|invoke-webrequest)\s*\(/i.test(newDocs), 'New docs must not direct a network call.');
assertTrue(!/\b(?:CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)\s+(?:TABLE|POLICY|FUNCTION|INTO)\b/i.test(newDocs), 'New docs must contain no SQL execution.');
assertTrue(!/\b(?:deploy|push)\s+(?:now|immediately)\b/i.test(newDocs), 'New docs must not authorize deployment or push.');

assertTrue(assertionCount >= 90, `Checker must run at least 90 assertions; ran ${assertionCount}.`);
assertTrue(assertionCount <= 120, `Checker must run at most 120 assertions; ran ${assertionCount}.`);

if (failureCount > 0) {
  console.error(`Phase 3FD-F-PLAN check FAILED: ${failureCount}/${assertionCount} assertions failed.`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FD-F-PLAN check passed: ${assertionCount}/${assertionCount} assertions passed.`);
