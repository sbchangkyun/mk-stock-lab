/** Narrow Phase 3FD-F documentation-only manual QA package checker. */

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

function assertIncludesSet(source, phrases, label) {
  const missing = phrases.filter((phrase) => !source.includes(phrase));
  assertTrue(missing.length === 0, `${label} is missing: ${missing.join(', ') || 'none'}`);
}

const PACKAGE_DOC_PATH = 'docs/planning/phase_3fd_f_owner_local_guarded_composition_manual_qa_package_v0.1.md';
const RESULT_PATH = 'docs/planning/phase_3fd_f_owner_local_guarded_composition_manual_qa_package_result_v0.1.md';
const CHECKER_PATH = 'scripts/check_phase_3fd_f_owner_local_guarded_composition_manual_qa_package_contract.mjs';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_PATH = 'package.json';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const UI_PATH = 'src/pages/chart-ai.astro';
const PLAN_RESULT_PATH = 'docs/planning/phase_3fd_f_plan_owner_local_guarded_composition_manual_qa_activation_boundary_result_v0.1.md';
const PHASE_E_RESULT_PATH = 'docs/planning/phase_3fd_e_guarded_route_runtime_composition_scaffold_all_gates_off_result_v0.1.md';

assertTrue(existsSync(path.join(repoRoot, CHECKER_PATH)), 'Checker script must exist.');
const packageDoc = readSource(PACKAGE_DOC_PATH);
const result = readSource(RESULT_PATH);
const changelog = readSource(CHANGELOG_PATH);
const packageSource = readSource(PACKAGE_PATH);
const route = readSource(ROUTE_PATH);
const ui = readSource(UI_PATH);
const planResult = readSource(PLAN_RESULT_PATH);
const phaseEResult = readSource(PHASE_E_RESULT_PATH);

assertTrue(packageSource.includes('"check:phase-3fd-f-owner-local-guarded-composition-manual-qa-package": "node scripts/check_phase_3fd_f_owner_local_guarded_composition_manual_qa_package_contract.mjs"'), 'Package script must be exact.');
assertTrue(changelog.includes('## Phase 3FD-F - 2026-07-04'), 'Changelog must contain Phase 3FD-F.');
assertTrue(changelog.includes('Owner-local Guarded Composition Manual QA Package, No Runtime Change (Prepared)'), 'Changelog subtitle must be exact.');
assertTrue(changelog.indexOf('## Phase 3FD-F - 2026-07-04') < changelog.indexOf('## Phase 3FD-F-PLAN - 2026-07-04'), 'Phase 3FD-F must be the top entry.');

assertTrue(packageDoc.startsWith('# Phase 3FD-F Owner-local Guarded Composition Manual QA Package'), 'Manual QA package title must be exact.');
assertTrue(result.startsWith('# Phase 3FD-F — Owner-local Guarded Composition Manual QA Package Result'), 'Result title must be exact.');
assertIncludesAll(packageDoc, [
  '## 1. Purpose',
  '## 2. Preconditions for Future Owner-local QA',
  '## 3. QA Surface',
  '## 4. Owner-local API Request Examples',
  '## 5. Expected Safe Response Rules',
  '## 6. Pass Criteria',
  '## 7. Fail Criteria',
  '## 8. Manual QA Result Template',
  '## 9. Activation Boundary',
  '## 10. Recommended Next Phase',
], 'Package headings');
assertIncludesAll(packageDoc, [
  'documentation-only manual QA package',
  'Manual QA is not executed in this phase',
  'no route source change',
  'UI change',
  'runtime source change',
  'connects to no database',
  'Supabase client',
  'reads no environment value',
  'executes no migration',
  'calls no live KIS',
  'enables no route success',
  'performs no deployment or push',
], 'Purpose boundary');
assertIncludesSet(packageDoc, [
  'expected `rebuild/phase-1-ia-shell` branch',
  'tracked tree is clean',
  'latest targeted checkers and smokes pass',
  'owner intentionally starts a local development server',
  'no push or deployment',
  'live KIS remains disabled',
  'no real database, Supabase, or environment access',
], 'Future QA preconditions');
assertTrue(packageDoc.includes('does not start the development server'), 'Package must not start the server.');
assertTrue(packageDoc.includes('run browser automation'), 'Package must state browser automation is not run.');
assertTrue(packageDoc.includes('execute manual QA'), 'Package must state manual QA is not run.');
assertIncludesSet(packageDoc, [
  'API default safe disabled path', 'Malformed JSON fallback path', 'Guarded runtime scaffold path',
  'Owner-local mocked path', 'Owner-local auth/usage bridge path', '`/chart-ai` default page',
  '`/chart-ai?ownerLocalMocked=1`', '`/chart-ai?ownerLocalAuthUsageBridge=1`',
], 'QA surfaces');

assertIncludesAll(packageDoc, ['### 4.1 Default request body', '### 4.2 Malformed JSON', '### 4.3 Guarded runtime scaffold request', '### 4.4 Owner-local mocked request', '### 4.5 Owner-local auth/usage bridge request'], 'Request examples');
assertTrue(packageDoc.includes('"mode": "guarded-runtime-scaffold"'), 'Guarded request mode must be documented.');
assertTrue(packageDoc.includes('"source": "mocked-provider-compatible"'), 'Guarded request source must be documented.');
assertTrue(packageDoc.includes('"guardedRuntimeScaffold": true'), 'Guarded request gate must be documented.');
assertIncludesAll(packageDoc, ['Safe disabled shell', 'No crash', 'No raw error', 'Safe blocked/feature-disabled shell', 'No composition internals exposed', 'No provider execution', 'No route success'], 'Expected request results');
assertTrue(packageDoc.includes('this branch is not real auth') || packageDoc.includes('This branch is not real auth'), 'Owner branches must not claim real auth.');
assertTrue(packageDoc.includes('not real persistence'), 'Auth/usage bridge must not claim persistence.');

assertIncludesSet(packageDoc, ['`status`', '`mode`', '`ok`', '`dataPolicy`', '`safeMessage`', '`guardStatus`', '`authState`', '`resolvedRole`', '`usageWindow`', '`engineStatus`', '`normalizedBarsAvailable`', '`matchCountBucket`'], 'Allowed response fields');
assertIncludesSet(packageDoc, ['Raw Supabase user identifier', 'email address', 'access token', 'refresh token', 'JWT', 'Cookie or header value', 'Raw database record', 'Raw KIS payload', 'OHLC price', 'Raw similarity score', 'Account, trading, order, or balance data'], 'Forbidden response content');
assertIncludesSet(packageDoc, ['Manual QA may pass only if', 'default path remains safe disabled', 'malformed JSON falls back', 'both owner-local branches', 'no guarded route success', 'no forbidden raw data'], 'Pass criteria');
assertIncludesSet(packageDoc, ['Manual QA must fail if', 'guarded path returns success', 'provider execution runs', 'route branch count changes', 'owner-local branch', 'deployment or push occurs'], 'Fail criteria');
assertIncludesSet(packageDoc, ['Owner-local Manual QA Result', 'Date:', 'Operator:', 'Branch:', 'Commit:', 'Local URL:', 'PASS / FAIL / BLOCKED', 'Notes:'], 'Result template');
assertIncludesSet(packageDoc, ['does not approve route success', 'provider execution', 'beta activation', 'public activation', 'real database connection', 'Supabase client creation', 'migration execution', 'live KIS', 'deployment', 'push'], 'Activation boundary');
assertTrue(packageDoc.includes('Phase 3FD-F-MANUAL-RUN — Owner Executes Manual QA Locally and Reports Results'), 'Next phase recommendation');
assertTrue(packageDoc.includes('Phase 3FD-E-HF1 — Guarded Composition Scaffold Revisions'), 'Alternative phase');
assertTrue(packageDoc.includes('Phase 3FD-B-HF1 — Real Supabase Client Factory Approval Package'), 'Hold phase');

assertIncludesAll(result, [
  '## 1. Status', '## 2. Implemented Scope', '## 3. Manual QA Package Result',
  '## 4. Activation Boundary Result', '## 5. Boundary Preservation',
  '## 6. Validation', '## 7. Recommended Next Phase',
  'documentation-only', 'Manual QA was not executed',
  'No route source, UI', 'runtime source changed',
  'No database', 'Supabase client', 'environment value', 'live KIS',
  'No package was installed', 'dependency changed', 'No deployment or push occurred',
  'Phase 3FD-F-MANUAL-RUN — Owner Executes Manual QA Locally and Reports Results',
], 'Result');

const dispatchCount = (route.match(/if \(is(?:OwnerLocalMockedSimilarityApiRequestBody|OwnerLocalAuthUsageBridgeSimilarityApiRequestBody|GuardedRuntimeScaffoldSimilarityRequestBody)\(body\)\)/g) || []).length;
assertTrue(dispatchCount === 3, `Route must retain exactly three dispatch branches; found ${dispatchCount}.`);
assertTrue(route.includes('runSimilarityGuardedRouteRuntimeComposition'), 'Route must retain composition integration.');
assertTrue(route.includes('return jsonResponse(buildSimilarityApiRouteShellResult({}));'), 'Route must retain safe disabled fallback.');
assertTrue(ui.includes('chartAiOwnerLocalAuthUsageBridgePanel'), '/chart-ai must retain the bridge panel.');
assertTrue(planResult.includes('Phase 3FD-F-PLAN'), 'Phase 3FD-F-PLAN result must remain present.');
assertTrue(phaseEResult.includes('all gates off'), 'Phase 3FD-E all-gates-off result must remain present.');

const newDocs = `${packageDoc}\n${result}`;
assertTrue(!/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(newDocs), 'New docs must contain no email-address-shaped value.');
assertTrue(!/(?:access|refresh)[_-]?token\s*[:=]\s*["'][^"']+/i.test(newDocs), 'New docs must contain no token value.');
assertTrue(!/(?:password|credential|secret)\s*[:=]\s*["'][^"']+/i.test(newDocs), 'New docs must contain no credential value.');
assertTrue(!/(?:KIS_APP_KEY|KIS_APP_SECRET|SUPABASE_SERVICE_ROLE_KEY)\s*=/.test(newDocs), 'New docs must contain no configuration value.');
assertTrue(!/\b(?:CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)\s+(?:TABLE|POLICY|FUNCTION|INTO)\b/i.test(newDocs), 'New docs must contain no SQL execution.');
assertTrue(!/manual QA (?:passed|completed successfully)/i.test(result), 'Result must not claim manual QA execution.');
assertTrue(!/\b(?:deploy|push)\s+(?:now|immediately)\b/i.test(newDocs), 'New docs must not authorize deployment or push.');

assertTrue(assertionCount >= 90, `Checker must run at least 90 assertions; ran ${assertionCount}.`);
assertTrue(assertionCount <= 120, `Checker must run at most 120 assertions; ran ${assertionCount}.`);

if (failureCount > 0) {
  console.error(`Phase 3FD-F check FAILED: ${failureCount}/${assertionCount} assertions failed.`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FD-F check passed: ${assertionCount}/${assertionCount} assertions passed.`);
