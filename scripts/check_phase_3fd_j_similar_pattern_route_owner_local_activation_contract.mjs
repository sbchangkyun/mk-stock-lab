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

const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const UI_PATH = 'src/pages/chart-ai.astro';
const TYPES_PATH = 'src/lib/server/chartAiOwnerLocalSimilarPatternActivationTypes.ts';
const HELPER_PATH = 'src/lib/server/chartAiOwnerLocalSimilarPatternActivation.ts';
const FIXTURES_PATH = 'src/lib/server/chartAiOwnerLocalSimilarPatternActivationFixtures.ts';
const SMOKE_SOURCE_PATH = 'src/lib/server/chartAiOwnerLocalSimilarPatternActivationSmoke.ts';
const SMOKE_SCRIPT_PATH = 'scripts/smoke_phase_3fd_j_similar_pattern_route_owner_local_activation.mjs';
const CHECKER_PATH = 'scripts/check_phase_3fd_j_similar_pattern_route_owner_local_activation_contract.mjs';
const INDEX_PATH = 'src/lib/server/index.ts';
const RESULT_PATH = 'docs/planning/phase_3fd_j_similar_pattern_route_owner_local_activation_result_v0.1.md';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_PATH = 'package.json';
const PHASE_I_RESULT_PATH = 'docs/planning/phase_3fd_i_real_auth_server_guard_foundation_all_gates_off_result_v0.1.md';
const PHASE_H_HF1_RESULT_PATH = 'docs/planning/phase_3fd_h_hf1_chart_ai_login_gate_visual_alignment_result_v0.1.md';

assertTrue(existsSync(path.join(repoRoot, CHECKER_PATH)), 'Checker script must exist.');
const route = readSource(ROUTE_PATH);
const ui = readSource(UI_PATH);
const types = readSource(TYPES_PATH);
const helper = readSource(HELPER_PATH);
const fixtures = readSource(FIXTURES_PATH);
const smokeSource = readSource(SMOKE_SOURCE_PATH);
const smokeScript = readSource(SMOKE_SCRIPT_PATH);
const checker = readSource(CHECKER_PATH);
const indexSource = readSource(INDEX_PATH);
const result = readSource(RESULT_PATH);
const changelog = readSource(CHANGELOG_PATH);
const packageSource = readSource(PACKAGE_PATH);
const phaseIResult = readSource(PHASE_I_RESULT_PATH);
const phaseHHf1Result = readSource(PHASE_H_HF1_RESULT_PATH);

assertTrue(packageSource.includes('"check:phase-3fd-j-similar-pattern-route-owner-local-activation": "node scripts/check_phase_3fd_j_similar_pattern_route_owner_local_activation_contract.mjs"'), 'Package checker script must be exact.');
assertTrue(packageSource.includes('"smoke:phase-3fd-j-similar-pattern-route-owner-local-activation": "node scripts/smoke_phase_3fd_j_similar_pattern_route_owner_local_activation.mjs"'), 'Package smoke script must be exact.');
assertTrue(changelog.includes('## Phase 3FD-J - 2026-07-04'), 'Changelog must contain Phase 3FD-J.');
assertTrue(changelog.includes('### Similar Pattern Route Owner-local Activation (Implemented)'), 'Changelog subtitle must be exact.');
assertTrue(changelog.indexOf('## Phase 3FD-J - 2026-07-04') < changelog.indexOf('## Phase 3FD-I - 2026-07-04'), 'Phase 3FD-J must be the top entry.');
assertTrue(result.startsWith('# Phase 3FD-J — Similar Pattern Route Owner-local Activation Result'), 'Result title must be exact.');

assertIncludesAll(route, [
  "from '../../../lib/server/chartAiOwnerLocalSimilarPatternActivation'",
  'runOwnerLocalSimilarPatternActivation',
  'isGuardedRuntimeScaffoldSimilarityRequestBody(body)',
  'isOwnerLocalSimilarityActivationAttempt(body)',
  'ownerLocalSimilarPatternRouteActivation',
  'requestKind',
  'subjectRole',
  'new URL(request.url).hostname',
  'jsonOwnerLocalSimilarityResponse',
  'ownerLocalSimilarityHttpStatus',
  "status: 'fail_closed'",
  "mode: 'owner-local-similar-pattern-route'",
  "code: 'unexpected_error'",
  'return jsonResponse(buildSimilarityApiRouteShellResult(body));',
], 'API route');
assertTrue(!/@supabase\//.test(route), 'Route must not import Supabase.');
assertTrue(!/process\.env(?:\.|\[)/.test(route), 'Route must not read process env.');
assertTrue(!/import\.meta\.env/.test(route), 'Route must not read import meta env.');
assertTrue(!/createClient\s*\(/.test(route), 'Route must not create a client.');
assertTrue(!/authorization\s*[:=]/i.test(route), 'Route must not read authorization.');
assertTrue(!/request\.headers|get\(['"]cookie/i.test(route), 'Route must not parse headers or cookies.');
assertTrue(!/console\.(?:log|error|warn)/.test(route), 'Route must not log raw errors.');

assertIncludesAll(types, [
  'ChartAiOwnerLocalSimilarPatternStatus',
  'owner_local_similarity_success',
  'blocked_owner_local_required',
  'blocked_explicit_activation_required',
  'blocked_invalid_request',
  'blocked_anonymous',
  'blocked_feature_disabled',
  'blocked_usage_limited',
  'blocked_cooldown',
  'blocked_cost_guard',
  'blocked_provider_disabled',
  'blocked_route_success_disabled',
  'fail_closed',
  'ChartAiOwnerLocalSimilarPatternRequest',
  'ChartAiOwnerLocalSimilarPatternResponse',
  'ChartAiOwnerLocalSimilarPatternSuccess',
  'ChartAiOwnerLocalSimilarPatternBlocked',
  "resultSource: 'synthetic_sample_only'",
  'forwardReturn5Label',
  'forwardReturn20Label',
  'drawdownLabel',
], 'Activation types');

assertIncludesAll(helper, [
  "from './chartAiGuardFoundation'",
  'evaluateChartAiServerGuard',
  'assertChartAiServerGuardDecisionIsSafe',
  'buildAllGatesOffChartAiGuardDependencies',
  'buildMockedChartAiGuardSubject',
  'buildSyntheticOhlcvFixture',
  'scanSimilarity',
  "new Set(['localhost', '127.0.0.1', '::1', '[::1]'])",
  'isOwnerLocalHostname',
  'isOwnerLocalSimilarPatternGuardedBranchBody',
  'normalizeOwnerLocalSimilarPatternRequest',
  'runOwnerLocalSimilarPatternActivation',
  'assertOwnerLocalSimilarPatternResponseIsSafe',
  "record.ownerLocalSimilarPatternRouteActivation !== true",
  "record.requestKind === 'mk_ai'",
  "record.requestKind !== 'similar_pattern'",
  "role === 'anonymous'",
  "guardDecision.status !== 'blocked_route_success_disabled'",
  "status: 'owner_local_similarity_success'",
  "resultSource: 'synthetic_sample_only'",
  'currentWindowSize',
  'Synthetic match',
  'scoreLabel',
  'forwardReturn5Label',
  'forwardReturn20Label',
  'drawdownLabel',
], 'Activation helper');
assertTrue(!/@supabase\//.test(helper), 'Helper must not import Supabase.');
assertTrue(!/process\.env(?:\.|\[)|import\.meta\.env/.test(helper), 'Helper must not read environment values.');
assertTrue(!/\bfetch\s*\(/.test(helper), 'Helper must not call fetch.');
assertTrue(!/kisOhlcProvider|aiProviderClient|server[\\/]providers/.test(helper), 'Helper must not import a provider.');
assertTrue(!/\.(?:from|rpc)\s*\(/.test(helper), 'Helper must not query a database.');
assertTrue(!/routeSuccessEnabled\s*:\s*true/.test(helper), 'Helper must not enable Phase 3FD-I route success.');
assertTrue(!/normalizedPath\s*:|currentNormalizedPath\s*:/.test(helper), 'Helper response must not expose normalized paths.');
assertTrue(!/subjectId\s*:/.test(helper), 'Helper response must not expose subject identifiers.');

assertIncludesAll(fixtures, [
  'local_explicit_user_success',
  'local_explicit_master_success',
  'remote_explicit_user_blocked',
  'local_missing_explicit_activation',
  'local_anonymous_blocked',
  'local_unknown_role_fail_closed',
  'local_mk_ai_provider_disabled',
  'local_user_cooldown_active',
  'local_master_cooldown_bypass',
  'local_usage_limited',
  'local_cost_blocked',
  'local_provider_unavailable',
  'malformed_input_safe_blocked',
  'ownerLocalSimilarPatternRouteActivation',
], 'Activation fixtures');

assertIncludesAll(smokeSource, [
  'runChartAiOwnerLocalSimilarPatternActivationSmoke',
  'chartAiOwnerLocalSimilarPatternFixtures',
  'stable top-level shape',
  'response safety assertion',
  'no raw OHLC fields',
  'no subject reference',
  'deterministic repeat',
  'remote request blocked',
  'explicit activation required',
  'normal user cooldown blocked',
  'unknown role fails closed',
  'MK AI provider disabled',
  'assertionCount >= 120',
], 'Smoke source');
assertTrue(smokeScript.includes('runChartAiOwnerLocalSimilarPatternActivationSmoke'), 'Smoke script must execute the TS suite.');
assertTrue(smokeScript.includes('globalThis.fetch'), 'Smoke script must trap network calls.');
assertTrue(smokeScript.includes('report.assertionCount < 120'), 'Smoke script must enforce 120 assertions.');
assertTrue(smokeScript.includes('Phase 3FD-J smoke: PASS'), 'Smoke script must report a stable pass line.');
assertTrue(smokeScript.includes('Unexpected network call.'), 'Smoke script must fail unexpected network access.');

assertIncludesAll(ui, [
  'ownerLocalSimilarPatternRoute',
  'ownerLocalSimilarPatternRouteEnabled',
  'data-chart-ai-owner-local-similar-pattern-route',
  'data-chart-ai-owner-local-similar-pattern-route-status',
  'data-chart-ai-owner-local-similar-pattern-route-result',
  '오너 로컬 유사 패턴 라우트 검증 모드입니다.',
  "fetch('/api/chart-ai/similarity'",
  "method: 'POST'",
  "mode: 'guarded-runtime-scaffold'",
  "source: 'mocked-provider-compatible'",
  'guardedRuntimeScaffold: true',
  'ownerLocalSimilarPatternRouteActivation: true',
  "requestKind: 'similar_pattern'",
  'subjectRole: mockedChartAiAccess.role',
  'AbortController',
  'OWNER_LOCAL_SIMILAR_PATTERN_TIMEOUT_MS',
  'ownerLocalSimilarPatternRequestInFlight',
  'isOwnerLocalSimilarPatternSuccessResponse',
  'isOwnerLocalSimilarPatternBlockedResponse',
  'renderOwnerLocalSimilarPatternSuccess',
  'runOwnerLocalSimilarPatternRoute',
  'runMockedAnalysisTrigger',
  "kind === 'similar-pattern' && ownerLocalSimilarPatternRouteEnabled",
  "kind === 'mk-ai' && analysisStates['similar-pattern'] !== 'success'",
  'ANALYSIS_COOLDOWN_MS',
  'canBypassAnalysisCooldown',
  'chartAiMockLoggedOut',
  'chartAiMockMaster',
  'ownerLocalMocked',
  'ownerLocalAuthUsageBridge',
  'data-chart-ai-auth-gate="locked"',
], 'Chart AI UI');
assertTrue(!ui.includes('dangerouslySetInnerHTML'), 'UI must not use dangerouslySetInnerHTML.');
assertTrue(!/JSON\.stringify\(parsedResponse\)|textContent\s*=\s*JSON\./.test(ui), 'UI must not dump raw route JSON.');
assertTrue(!/console\.(?:log|error|warn)\([^)]*(?:parsedResponse|response|error)/.test(ui), 'UI must not log route response data.');
assertTrue(ui.includes("!chartAiMockLoggedOut && chartAiQuery.get('chartAiMockMaster') === '1'"), 'Logged-out mode must still win over master mode.');
assertTrue(ui.includes('mockedChartAiAccess.capabilities.canAccessChartAi &&'), 'Owner-local route mode must require mocked access.');

assertIncludesAll(indexSource, [
  "from './chartAiOwnerLocalSimilarPatternActivationTypes'",
  "from './chartAiOwnerLocalSimilarPatternActivation'",
  "from './chartAiOwnerLocalSimilarPatternActivationFixtures'",
  "from './chartAiOwnerLocalSimilarPatternActivationSmoke'",
], 'Server index');

const resultFlat = result.replace(/\s+/g, ' ');
assertIncludesAll(resultFlat, [
  '## 1. Status',
  '## 2. Implemented Scope',
  '## 3. Route Result',
  '## 4. UI Result',
  '## 5. Security and Boundary Preservation',
  '## 6. Validation',
  '## 7. Recommended Next Phase',
  'explicit owner-local-only Similar Pattern route activation',
  'no public or beta activation',
  'No live KIS or provider integration was added',
  'No LLM or MK AI route call was added',
  'No Supabase client, network call, or database connection was added',
  'No environment value, cookie, header, session, or JWT was read or parsed',
  'No raw master identifiers were committed',
  'Public route success remains blocked',
  'Default `/chart-ai` continues to use the existing mocked client-side Similar Pattern behavior',
  'ownerLocalSimilarPatternRoute=1',
  'Phase 3FE-A — KIS OHLC Provider Owner-local Integration',
  'Phase 3FD-J-HF1 — Similar Pattern Owner-local Route Revisions',
  'Phase 3FF-A — MK AI LLM Scaffold + Owner-local Activation',
], 'Result document');

const entryStart = changelog.indexOf('## Phase 3FD-J - 2026-07-04');
const entryEnd = changelog.indexOf('## Phase 3FD-I - 2026-07-04');
const entry = entryStart >= 0 && entryEnd > entryStart ? changelog.slice(entryStart, entryEnd) : '';
assertTrue(entry.length > 0, 'Phase 3FD-J changelog entry must be inspectable.');
assertIncludesAll(entry, [
  'owner-local-only Similar Pattern route activation',
  'no public route success',
  'no beta activation',
  'no live KIS call',
  'no LLM/API call',
  'no Supabase client creation',
  'no environment value read',
  'Phase 3FE-A — KIS OHLC Provider Owner-local Integration',
], 'Changelog entry');

assertTrue(phaseIResult.includes('all runtime gates off'), 'Phase 3FD-I all-gates-off result remains present.');
assertTrue(phaseIResult.replace(/\s+/g, ' ').includes('Route success remains disabled'), 'Phase 3FD-I route-success boundary remains documented.');
assertTrue(phaseHHf1Result.includes('Portfolio source'), 'Phase 3FD-H-HF1 Portfolio boundary remains documented.');

const newRuntimeSources = [types, helper, fixtures, smokeSource, indexSource].join('\n');
const sensitiveScan = [newRuntimeSources, route, ui, result, entry].join('\n');
const emailLiteralPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const uuidLiteralPattern = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
assertTrue(!emailLiteralPattern.test(sensitiveScan), 'Phase files must not contain an email literal.');
assertTrue(!uuidLiteralPattern.test(sensitiveScan), 'Phase files must not contain a UUID literal.');
assertTrue(!/MASTER_EMAIL\s*[:=]\s*['"]/.test(sensitiveScan), 'No master email may be assigned.');
assertTrue(!/MASTER_USER_ID\s*[:=]\s*['"]/.test(sensitiveScan), 'No master identifier may be assigned.');
assertTrue(!/@supabase\//.test(newRuntimeSources), 'New runtime files must not import Supabase.');
assertTrue(!/process\.env(?:\.|\[)|import\.meta\.env/.test(newRuntimeSources), 'New runtime files must not read env values.');
assertTrue(!/getSession\s*\(|verifyJwt\s*\(|verifyToken\s*\(/.test(newRuntimeSources), 'New runtime files must not parse auth sessions.');
assertTrue(!/service[_-]?role/i.test(newRuntimeSources), 'New runtime files must not use a service role.');
assertTrue(!/allowPublicExecution\s*:\s*true|allowBetaExecution\s*:\s*true/.test(newRuntimeSources), 'New runtime files must not activate public or beta execution.');
assertTrue(checker.includes('emailLiteralPattern') && checker.includes('uuidLiteralPattern'), 'Checker must use generic sensitive-literal regexes.');

assertTrue(assertionCount >= 170, `Checker must run at least 170 assertions; ran ${assertionCount}.`);
assertTrue(assertionCount <= 220, `Checker must run at most 220 assertions; ran ${assertionCount}.`);

if (failureCount > 0) {
  console.error(`Phase 3FD-J check FAILED: ${failureCount}/${assertionCount} assertions failed.`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FD-J check passed: ${assertionCount}/${assertionCount} assertions passed.`);
