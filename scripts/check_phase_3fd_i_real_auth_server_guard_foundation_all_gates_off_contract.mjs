/** Narrow Phase 3FD-I real-auth-compatible guard foundation static checker. */

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

const TYPES_PATH = 'src/lib/server/chartAiGuardFoundationTypes.ts';
const IMPLEMENTATION_PATH = 'src/lib/server/chartAiGuardFoundation.ts';
const FIXTURES_PATH = 'src/lib/server/chartAiGuardFoundationFixtures.ts';
const SMOKE_SOURCE_PATH = 'src/lib/server/chartAiGuardFoundationSmoke.ts';
const SMOKE_SCRIPT_PATH = 'scripts/smoke_phase_3fd_i_real_auth_server_guard_foundation_all_gates_off.mjs';
const CHECKER_PATH = 'scripts/check_phase_3fd_i_real_auth_server_guard_foundation_all_gates_off_contract.mjs';
const INDEX_PATH = 'src/lib/server/index.ts';
const RESULT_PATH = 'docs/planning/phase_3fd_i_real_auth_server_guard_foundation_all_gates_off_result_v0.1.md';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_PATH = 'package.json';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const UI_PATH = 'src/pages/chart-ai.astro';
const PREVIOUS_RESULT_PATH = 'docs/planning/phase_3fd_h_hf1_chart_ai_login_gate_visual_alignment_result_v0.1.md';

assertTrue(existsSync(path.join(repoRoot, CHECKER_PATH)), 'Checker script must exist.');
const types = readSource(TYPES_PATH);
const implementation = readSource(IMPLEMENTATION_PATH);
const fixtures = readSource(FIXTURES_PATH);
const smokeSource = readSource(SMOKE_SOURCE_PATH);
const smokeScript = readSource(SMOKE_SCRIPT_PATH);
const checker = readSource(CHECKER_PATH);
const indexSource = readSource(INDEX_PATH);
const result = readSource(RESULT_PATH);
const changelog = readSource(CHANGELOG_PATH);
const packageSource = readSource(PACKAGE_PATH);
const route = readSource(ROUTE_PATH);
const ui = readSource(UI_PATH);
const previousResult = readSource(PREVIOUS_RESULT_PATH);

assertTrue(packageSource.includes('"smoke:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off": "node scripts/smoke_phase_3fd_i_real_auth_server_guard_foundation_all_gates_off.mjs"'), 'Package smoke script must be exact.');
assertTrue(packageSource.includes('"check:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off": "node scripts/check_phase_3fd_i_real_auth_server_guard_foundation_all_gates_off_contract.mjs"'), 'Package checker script must be exact.');
assertTrue(changelog.includes('## Phase 3FD-I - 2026-07-04'), 'Changelog must contain Phase 3FD-I.');
assertTrue(changelog.includes('Real Auth and Server Guard Foundation, All Runtime Gates Off (Implemented)'), 'Changelog subtitle must be exact.');
assertTrue(changelog.indexOf('## Phase 3FD-I - 2026-07-04') < changelog.indexOf('## Phase 3FD-H-HF1 - 2026-07-04'), 'Phase 3FD-I must be the top entry.');
assertTrue(result.startsWith('# Phase 3FD-I — Real Auth and Server Guard Foundation, All Runtime Gates Off Result'), 'Result title must be exact.');

assertIncludesAll(types, [
  'ChartAiGuardSubjectState',
  'ChartAiGuardRole',
  'ChartAiGuardSubjectSource',
  'ChartAiGuardRequestKind',
  'ChartAiGuardStatus',
  'ChartAiGuardSubject',
  'ChartAiGuardCapabilities',
  'ChartAiGuardDependencies',
  'ChartAiServerGuardDecision',
  'ChartAiGuardCooldownDecision',
  'ChartAiGuardUsageDecision',
  'ChartAiGuardCacheDecision',
  'ChartAiGuardCostDecision',
  'ChartAiGuardAuditDecision',
  'ChartAiGuardRuntimeGates',
  "'blocked_anonymous'",
  "'blocked_feature_disabled'",
  "'blocked_usage_limited'",
  "'blocked_cooldown'",
  "'blocked_cost_guard'",
  "'blocked_provider_disabled'",
  "'blocked_route_success_disabled'",
  "'fail_closed'",
  'canAccessChartAi',
  'canRunSimilarPattern',
  'canRunMkAi',
  'canBypassAnalysisCooldown',
  'canUseOwnerLocalPanels',
  'canUseLiveKis: false',
  'canUseLlm: false',
  'routeSuccessAllowed: false',
  'persistenceAllowed: false',
  'chargeAllowed: false',
  'writeAllowed: false',
  "'page_access' | 'similar_pattern' | 'mk_ai'",
], 'Guard types');

assertIncludesAll(implementation, [
  'CHART_AI_ALL_RUNTIME_GATES_OFF',
  'resolveChartAiGuardCapabilities',
  'evaluateChartAiServerGuard',
  'assertChartAiServerGuardDecisionIsSafe',
  'realAuthAllowed: false',
  'realDbAllowed: false',
  'supabaseClientAllowed: false',
  'envReadAllowed: false',
  'requestContextReadAllowed: false',
  'jwtVerificationAllowed: false',
  'usagePersistenceAllowed: false',
  'cachePersistenceAllowed: false',
  'liveKisAllowed: false',
  'llmAllowed: false',
  'providerExecutionAllowed: false',
  'routeSuccessAllowed: false',
  'publicActivationAllowed: false',
  "subject.state === 'anonymous'",
  "'blocked_anonymous'",
  "'blocked_feature_disabled'",
  "'blocked_usage_limited'",
  "'blocked_cooldown'",
  "'blocked_cost_guard'",
  "'blocked_provider_disabled'",
  "'blocked_route_success_disabled'",
  "'fail_closed'",
  "'unknown_role'",
  "'required_dependency_unavailable'",
], 'Guard implementation');

assertIncludesAll(fixtures, [
  'subject_mock_user',
  'subject_mock_master',
  'subject_anonymous',
  'anonymous_page_access',
  'anonymous_similar_pattern',
  'authenticated_user_page_access',
  'authenticated_user_similar_pattern_all_guards_off',
  'authenticated_user_similar_pattern_route_success_disabled',
  'authenticated_user_cooldown_active',
  'authenticated_user_usage_limited',
  'authenticated_user_cost_blocked',
  'authenticated_user_provider_disabled',
  'authenticated_master_page_access',
  'authenticated_master_similar_pattern_cooldown_bypass_route_disabled',
  'authenticated_master_mk_ai_llm_disabled',
  'authenticated_unknown_role',
  'missing_dependency_fail_closed',
  'routeSuccessEnabled: false',
], 'Deterministic fixtures');

assertIncludesAll(smokeSource, [
  'runChartAiGuardFoundationSmoke',
  'chartAiGuardFoundationFixtures',
  'EXPECTED_DECISION_KEYS',
  'stable decision shape',
  'sanitized decision',
  'anonymous page blocked',
  'authenticated page capability allowed',
  'master bypass capability represented',
  'master cannot enable route success',
  'normal user cooldown enforced',
  'unknown role fails closed',
  'missing dependency fails closed',
  'assertionCount >= 80',
  'fixture coverage includes at least twelve scenarios',
  'deterministic output',
], 'Smoke source');

assertTrue(smokeScript.includes('runChartAiGuardFoundationSmoke'), 'Executable smoke must invoke the TS smoke suite.');
assertTrue(smokeScript.includes('globalThis.fetch'), 'Executable smoke must trap network access.');
assertTrue(smokeScript.includes('report.assertionCount < 80'), 'Executable smoke must enforce at least 80 assertions.');
assertTrue(smokeScript.includes('Phase 3FD-I smoke: PASS'), 'Executable smoke must report a stable pass line.');

assertTrue(indexSource.includes("from './chartAiGuardFoundationTypes'"), 'Server index exports guard types.');
assertTrue(indexSource.includes("from './chartAiGuardFoundation'"), 'Server index exports guard implementation.');
assertTrue(indexSource.includes("from './chartAiGuardFoundationFixtures'"), 'Server index exports fixtures.');
assertTrue(indexSource.includes("from './chartAiGuardFoundationSmoke'"), 'Server index exports smoke suite.');

const dispatchCount = (route.match(/if \(is(?:OwnerLocalMockedSimilarityApiRequestBody|OwnerLocalAuthUsageBridgeSimilarityApiRequestBody|GuardedRuntimeScaffoldSimilarityRequestBody)\(body\)\)/g) || []).length;
assertTrue(dispatchCount === 3, `Route must retain exactly three dispatch branches; found ${dispatchCount}.`);
assertTrue(route.includes('return jsonResponse(buildSimilarityApiRouteShellResult(body));'), 'Route safe disabled fallback remains.');
assertTrue(!route.includes('chartAiGuardFoundation'), 'API route must not import the new foundation.');
assertTrue(!ui.includes('chartAiGuardFoundation'), '/chart-ai must not import the new foundation.');
assertTrue(ui.includes('data-chart-ai-auth-gate="locked"'), 'Existing Chart AI login gate remains present.');
assertTrue(previousResult.includes('Phase 3FD-H-HF1'), 'Previous visual-alignment result remains present.');
assertTrue(previousResult.includes('Portfolio, route, server runtime, providers, deterministic engine, and data are unchanged'), 'Previous boundary remains documented.');

const resultFlat = result.replace(/\s+/g, ' ');
assertIncludesAll(resultFlat, [
  '## 1. Status',
  '## 2. Implemented Scope',
  '## 3. Guard Foundation Result',
  '## 4. Boundary Preservation',
  '## 5. Validation',
  '## 6. Shortened Roadmap Position',
  '## 7. Recommended Next Phase',
  'server-only guard foundation with all runtime gates off',
  'Route success remains disabled',
  'No `/chart-ai` UI behavior, Portfolio source, or API route source changed',
  'No real auth runtime was activated',
  'no Supabase client was created',
  'no environment value was read',
  'No KIS, LLM, or API call occurred',
  'No raw master identifiers were committed',
  'Unknown roles and missing dependencies fail closed',
  'step 1 of the six-step shortened Chart AI roadmap',
  'Phase 3FD-J — Similar Pattern Route Owner-local Activation',
  'Phase 3FD-I-HF1 — Guard Foundation Revisions, All Gates Off',
  'Phase 3FE-A — KIS OHLC Provider Owner-local Integration',
], 'Result document');

const entryStart = changelog.indexOf('## Phase 3FD-I - 2026-07-04');
const entryEnd = changelog.indexOf('## Phase 3FD-H-HF1 - 2026-07-04');
const entry = entryStart >= 0 && entryEnd > entryStart ? changelog.slice(entryStart, entryEnd) : '';
assertTrue(entry.length > 0, 'Phase 3FD-I changelog entry must be inspectable.');
assertIncludesAll(entry, [
  'all runtime gates off',
  'Route success remains disabled',
  'no KIS call',
  'no LLM/API call',
  'no Supabase client creation',
  'no environment value read',
], 'Changelog entry');

const newRuntimeSources = [types, implementation, fixtures, smokeSource, indexSource].join('\n');
const newFilesForSensitiveScan = [newRuntimeSources, smokeScript, result, entry, checker].join('\n');
const emailLiteralPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const uuidLiteralPattern = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
assertTrue(!emailLiteralPattern.test(newFilesForSensitiveScan), 'New files must not contain an email address literal.');
assertTrue(!uuidLiteralPattern.test(newFilesForSensitiveScan), 'New files must not contain a UUID literal.');
assertTrue(!/MASTER_EMAIL\s*[:=]\s*['"]/.test(newFilesForSensitiveScan), 'No master email value may be assigned.');
assertTrue(!/MASTER_USER_ID\s*[:=]\s*['"]/.test(newFilesForSensitiveScan), 'No master user identifier value may be assigned.');
assertTrue(!/service[_-]?role/i.test(newRuntimeSources), 'Runtime sources must not reference service-role use.');
assertTrue(!/raw[_-]?(?:email|uid|user.?id)/i.test(newRuntimeSources), 'Runtime sources must not expose raw identity fields.');
assertTrue(!/authorization\s*[:=]/i.test(newRuntimeSources), 'Runtime sources must not construct authorization values.');
assertTrue(!/bearer\s+/i.test(newRuntimeSources), 'Runtime sources must not construct bearer credentials.');
assertTrue(!/cookie\s*[:=]/i.test(newRuntimeSources), 'Runtime sources must not read cookies.');
assertTrue(!/session\s*[:=]/i.test(newRuntimeSources), 'Runtime sources must not read sessions.');

assertTrue(!/@supabase\//.test(newRuntimeSources), 'Runtime sources must not import Supabase.');
assertTrue(!/createClient\s*\(/.test(newRuntimeSources), 'Runtime sources must not create a client.');
assertTrue(!/process\.env(?:\.|\[)/.test(newRuntimeSources), 'Runtime sources must not read process env.');
assertTrue(!/import\.meta\.env/.test(newRuntimeSources), 'Runtime sources must not read import meta env.');
assertTrue(!/\bfetch\s*\(/.test(newRuntimeSources), 'Runtime sources must not call fetch.');
assertTrue(!/\.(?:from|rpc)\s*\(/.test(newRuntimeSources), 'Runtime sources must not query a database.');
assertTrue(!/(?:getSession|verifyJwt|verifyToken)\s*\(/.test(newRuntimeSources), 'Runtime sources must not parse or verify auth state.');
assertTrue(!/server[\\/]providers|kisOhlcProvider|aiProviderClient/.test(newRuntimeSources), 'Runtime sources must not import providers.');
assertTrue(!/allowRouteSuccess\s*:\s*true/.test(newRuntimeSources), 'Runtime sources must never enable route success.');
assertTrue(!/routeSuccessEnabled\s*:\s*true/.test(newRuntimeSources), 'Fixtures must never request route success.');

assertTrue(assertionCount >= 135, `Checker must run at least 135 assertions; ran ${assertionCount}.`);
assertTrue(assertionCount <= 180, `Checker must run at most 180 assertions; ran ${assertionCount}.`);

if (failureCount > 0) {
  console.error(`Phase 3FD-I check FAILED: ${failureCount}/${assertionCount} assertions failed.`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FD-I check passed: ${assertionCount}/${assertionCount} assertions passed.`);
