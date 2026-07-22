/** Narrow Phase 3FD-G-PLAN documentation-only UX/gate design checker. */

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

const PLAN_PATH = 'docs/planning/phase_3fd_g_plan_chart_ai_analysis_trigger_ux_login_usage_gate_design_v0.1.md';
const RESULT_PATH = 'docs/planning/phase_3fd_g_plan_chart_ai_analysis_trigger_ux_login_usage_gate_design_result_v0.1.md';
const CHECKER_PATH = 'scripts/check_phase_3fd_g_plan_chart_ai_analysis_trigger_ux_login_usage_gate_design_contract.mjs';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_PATH = 'package.json';
const UI_PATH = 'src/pages/chart-ai.astro';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const PHASE_F_RESULT_PATH = 'docs/planning/phase_3fd_f_owner_local_guarded_composition_manual_qa_package_result_v0.1.md';
const PHASE_F_PLAN_RESULT_PATH = 'docs/planning/phase_3fd_f_plan_owner_local_guarded_composition_manual_qa_activation_boundary_result_v0.1.md';

assertTrue(existsSync(path.join(repoRoot, CHECKER_PATH)), 'Checker script must exist.');
const plan = readSource(PLAN_PATH);
const result = readSource(RESULT_PATH);
const changelog = readSource(CHANGELOG_PATH);
const packageSource = readSource(PACKAGE_PATH);
const ui = readSource(UI_PATH);
const route = readSource(ROUTE_PATH);
const phaseFResult = readSource(PHASE_F_RESULT_PATH);
const phaseFPlanResult = readSource(PHASE_F_PLAN_RESULT_PATH);

assertTrue(packageSource.includes('"check:phase-3fd-g-plan-chart-ai-analysis-trigger-ux-login-usage-gate-design": "node scripts/check_phase_3fd_g_plan_chart_ai_analysis_trigger_ux_login_usage_gate_design_contract.mjs"'), 'Package script must be exact.');
assertTrue(changelog.includes('## Phase 3FD-G-PLAN - 2026-07-04'), 'Changelog must contain Phase 3FD-G-PLAN.');
assertTrue(changelog.includes('Chart AI Analysis Trigger UX and Login/Usage Gate Design, No Runtime Change (Prepared)'), 'Changelog subtitle must be exact.');
assertTrue(changelog.indexOf('## Phase 3FD-G-PLAN - 2026-07-04') < changelog.indexOf('## Phase 3FD-F - 2026-07-04'), 'Phase 3FD-G-PLAN must be the top entry.');
assertTrue(plan.startsWith('# Phase 3FD-G-PLAN Chart AI Analysis Trigger UX and Login/Usage Gate Design'), 'Plan title must be exact.');
assertTrue(result.startsWith('# Phase 3FD-G-PLAN — Chart AI Analysis Trigger UX and Login/Usage Gate Design Result'), 'Result title must be exact.');

assertIncludesAll(plan, [
  '## 1. Purpose', '## 2. Background', '## 3. Product Decisions', '## 4. Target UX Model',
  '## 5. State Model', '## 6. Login Gate Design', '## 7. Daily Usage Limit Design',
  '## 8. Analysis Execution Order', '## 9. Loading and Duplicate Request Prevention',
  '## 10. Result Reveal Design', '## 11. Future Gate Extension Points',
  '## 12. Next Implementation Boundary', '## 13. Recommended Next Phase',
], 'Plan headings');
assertIncludesAll(plan, [
  'documentation-only UX and gate design', 'no UI, route, or runtime source change',
  'connects to no database', 'creates no Supabase client', 'reads no environment value',
  'migration', 'calls no live KIS or LLM/API', 'no payment or ad integration',
  'no deployment or push',
], 'Plan boundary');
assertIncludesSet(plan, [
  'separate trigger button', 'free at initial launch', 'both require login',
  'Account-level daily usage limit structure', 'must not apply actual usage limiting',
  'Loading feedback', 'duplicate request prevention', 'overlapping/post-it-style',
  'permission, ad, and paid gate extension points',
], 'Product decisions');
assertIncludesSet(plan, [
  'tab header', 'brief explanation', 'login-required notice', 'daily usage status placeholder',
  'trigger button', 'result body remains hidden', 'checks login and usage policy',
], 'Target UX model');
assertTrue(plan.includes('`유사 패턴 분석 시작`'), 'Similar Pattern trigger copy must exist.');
assertTrue(plan.includes('`MK AI 분석 시작`'), 'MK AI trigger copy must exist.');
assertTrue(plan.includes('`로그인 후 유사 패턴 분석을 실행할 수 있습니다.`'), 'Similar Pattern login copy must exist.');
assertTrue(plan.includes('`로그인 후 MK AI 분석을 실행할 수 있습니다.`'), 'MK AI login copy must exist.');
assertTrue(plan.includes('`오늘 사용 가능 횟수: 베타 기간 제한 없음`'), 'Usage copy must exist.');
assertTrue(plan.includes('잠시만 기다려주세요'), 'Loading copy must exist.');

assertIncludesAll(plan, ['`idle`', '`login_required`', '`loading`', '`success`', '`usage_limited`', '`blocked`', '`error`'], 'State model');
assertIncludesSet(plan, ['Both functions require login', 'Anonymous users must not run either analysis', 'mocked or client-side auth-state placeholder', 'must not create a Supabase client', 'call no analysis execution'], 'Login gate');
assertIncludesSet(plan, ['Account-level daily usage-limit structure', 'actual usage limiting', 'no database or Supabase persistence', '`dailyLimitEnabled`', '`dailyLimit`', '`dailyUsed`', '`dailyRemaining`', '`usageWindow`', '`usageResetAt`', '`dailyLimitEnabled: false`', '3/day'], 'Usage design');
assertIncludesSet(plan, ['Similar Pattern Analysis runs first', 'MK AI Analysis becomes available after Similar Pattern Analysis succeeds', 'cost control', 'future LLM', 'paid or ad gating'], 'Execution order');
assertTrue(plan.includes('먼저 유사 패턴 분석을 실행하면 MK AI 분석을 사용할 수 있습니다.'), 'Prerequisite copy must exist.');
assertIncludesSet(plan, ['Disable the active trigger while loading', 'spinner or skeleton', 'prevent duplicate clicks', 'prevent simultaneous', 'Restore the applicable button'], 'Loading and duplicate prevention');
assertIncludesSet(plan, ['Preserve the existing overlapping/post-it-style cards', 'hide each result body until `success`', 'sample or mocked content', 'must not imply live KIS', 'investment advice'], 'Result reveal');
assertIncludesSet(plan, ['`premium_required`', '`ad_required`', '`beta_only`', '`owner_only`', '`maintenance_disabled`', 'design-only'], 'Future gates');
assertIncludesSet(plan, ['mocked-only `/chart-ai` UI work', 'separate trigger buttons', 'mocked delay', 'behavior remains unchanged', 'no API, LLM, database, Supabase, or live KIS call', 'actual usage count limiting'], 'Next implementation boundary');
assertTrue(plan.includes('Phase 3FD-G — Chart AI Analysis Trigger UX Mocked-only Implementation'), 'Recommendation must exist.');
assertTrue(plan.includes('Phase 3FD-G-HF1 — Analysis Trigger UX Design Revisions'), 'Alternative must exist.');
assertTrue(plan.includes('Phase 3FD-B-HF1 — Real Supabase Client Factory Approval Package'), 'Hold must exist.');

assertIncludesAll(result, [
  '## 1. Status', '## 2. Implemented Scope', '## 3. Design Result',
  '## 4. Next Implementation Boundary', '## 5. Boundary Preservation',
  '## 6. Validation', '## 7. Recommended Next Phase',
  'documentation-only', 'No UI, route, or runtime source changed',
  'No database', 'Supabase client', 'environment value', 'live KIS', 'LLM/API',
  'package installed', 'dependency changed', 'deployment performed', 'push made',
  'Phase 3FD-G — Chart AI Analysis Trigger UX Mocked-only Implementation',
], 'Result');

assertTrue(ui.includes('chartAiSimilarityTab'), '/chart-ai must retain Similar Pattern tab marker.');
assertTrue(ui.includes('chartAiMkAiTab'), '/chart-ai must retain MK AI tab marker.');
assertTrue(ui.includes('chartAiOwnerLocalAuthUsageBridgePanel'), '/chart-ai must retain bridge panel.');
const dispatchCount = (route.match(/if \(is(?:OwnerLocalMockedSimilarityApiRequestBody|OwnerLocalAuthUsageBridgeSimilarityApiRequestBody|GuardedRuntimeScaffoldSimilarityRequestBody)\(body\)\)/g) || []).length;
assertTrue(dispatchCount === 3, `Route must retain exactly three branches; found ${dispatchCount}.`);
assertTrue(route.includes('return jsonResponse(buildSimilarityApiRouteShellResult({}));'), 'Route must retain safe disabled fallback.');
assertTrue(phaseFResult.includes('Phase 3FD-F'), 'Phase 3FD-F result must remain present.');
assertTrue(phaseFPlanResult.includes('Phase 3FD-F-PLAN'), 'Phase 3FD-F-PLAN result must remain present.');

const newDocs = `${plan}\n${result}`;
assertTrue(!/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(newDocs), 'New docs must contain no email-address-shaped value.');
assertTrue(!/(?:access|refresh)[_-]?token\s*[:=]\s*["'][^"']+/i.test(newDocs), 'New docs must contain no token value.');
assertTrue(!/(?:password|credential|secret)\s*[:=]\s*["'][^"']+/i.test(newDocs), 'New docs must contain no credential value.');
assertTrue(!/(?:KIS_APP_KEY|KIS_APP_SECRET|SUPABASE_SERVICE_ROLE_KEY)\s*=/.test(newDocs), 'New docs must contain no configuration value.');
assertTrue(!/\b(?:CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)\s+(?:TABLE|POLICY|FUNCTION|INTO)\b/i.test(newDocs), 'New docs must contain no SQL execution.');
assertTrue(!/\b(?:deploy|push)\s+(?:now|immediately)\b/i.test(newDocs), 'New docs must not authorize deployment or push.');

assertTrue(assertionCount >= 95, `Checker must run at least 95 assertions; ran ${assertionCount}.`);
assertTrue(assertionCount <= 125, `Checker must run at most 125 assertions; ran ${assertionCount}.`);

if (failureCount > 0) {
  console.error(`Phase 3FD-G-PLAN check FAILED: ${failureCount}/${assertionCount} assertions failed.`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FD-G-PLAN check passed: ${assertionCount}/${assertionCount} assertions passed.`);
