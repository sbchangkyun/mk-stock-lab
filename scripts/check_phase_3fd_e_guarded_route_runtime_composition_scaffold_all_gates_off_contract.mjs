/** Narrow Phase 3FD-E static checker for the all-gates-off guarded composition scaffold. */

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

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function assertIncludesAll(source, phrases, label) {
  for (const phrase of phrases) assertTrue(source.includes(phrase), `${label} must include: ${phrase}`);
}

const TYPES_PATH = 'src/lib/server/chartSimilarity/similarityGuardedRouteRuntimeCompositionTypes.ts';
const IMPLEMENTATION_PATH = 'src/lib/server/chartSimilarity/similarityGuardedRouteRuntimeComposition.ts';
const FIXTURES_PATH = 'src/lib/server/chartSimilarity/mockedSimilarityGuardedRouteRuntimeCompositionFixtures.ts';
const INDEX_PATH = 'src/lib/server/chartSimilarity/index.ts';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const UI_PATH = 'src/pages/chart-ai.astro';
const SMOKE_PATH = 'scripts/smoke_phase_3fd_e_guarded_route_runtime_composition_scaffold_all_gates_off.mjs';
const RESULT_PATH = 'docs/planning/phase_3fd_e_guarded_route_runtime_composition_scaffold_all_gates_off_result_v0.1.md';
const PACKAGE_PATH = 'package.json';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PLAN_RESULT_PATH = 'docs/planning/phase_3fd_e_plan_guarded_route_runtime_composition_approval_result_v0.1.md';
const PREVIOUS_RESULT_PATH = 'docs/planning/phase_3fd_d_role_usage_runtime_adapter_interface_mocked_db_only_result_v0.1.md';

assertTrue(existsSync(path.join(repoRoot, 'scripts/check_phase_3fd_e_guarded_route_runtime_composition_scaffold_all_gates_off_contract.mjs')), 'Checker script must exist.');
const types = readSource(TYPES_PATH);
const implementation = readSource(IMPLEMENTATION_PATH);
const fixtures = readSource(FIXTURES_PATH);
const indexSource = readSource(INDEX_PATH);
const route = readSource(ROUTE_PATH);
const ui = readSource(UI_PATH);
const smoke = readSource(SMOKE_PATH);
const result = readSource(RESULT_PATH);
const packageSource = readSource(PACKAGE_PATH);
const changelog = readSource(CHANGELOG_PATH);
const planResult = readSource(PLAN_RESULT_PATH);
const previousResult = readSource(PREVIOUS_RESULT_PATH);

assertTrue(packageSource.includes('"check:phase-3fd-e-guarded-route-runtime-composition-scaffold-all-gates-off": "node scripts/check_phase_3fd_e_guarded_route_runtime_composition_scaffold_all_gates_off_contract.mjs"'), 'Package checker script');
assertTrue(packageSource.includes('"smoke:phase-3fd-e-guarded-route-runtime-composition-scaffold-all-gates-off": "node scripts/smoke_phase_3fd_e_guarded_route_runtime_composition_scaffold_all_gates_off.mjs"'), 'Package smoke script');
assertTrue(changelog.includes('## Phase 3FD-E - 2026-07-04'), 'Changelog phase entry');
assertTrue(changelog.includes('Guarded Route Runtime Composition Scaffold, All Gates Off, Mocked Runtime Only (Implemented)'), 'Changelog subtitle');
assertTrue(changelog.indexOf('## Phase 3FD-E - 2026-07-04') < changelog.indexOf('## Phase 3FD-E-PLAN - 2026-07-04'), 'Changelog ordering');

assertIncludesAll(types, [
  'SimilarityGuardedRouteRuntimeCompositionStatus',
  'SimilarityGuardedRouteRuntimeCompositionSource',
  'SimilarityGuardedRouteRuntimeCompositionPolicy',
  'SimilarityGuardedRouteRuntimeCompositionRequest',
  'SimilarityGuardedRouteRuntimeCompositionSafeResponse',
  'SimilarityGuardedRouteRuntimeCompositionResult',
  'SimilarityGuardedRouteRuntimeCompositionDeps',
  "'disabled'", "'invalid_request'", "'auth_blocked'", "'role_usage_blocked'", "'feature_flag_blocked'",
  "'provider_blocked'", "'route_success_disabled'", "'redaction_failed'", "'safe_error'", "'mocked-runtime'",
  'allowRealAuth: false', 'allowRealDb: false', 'allowSupabaseClient: false', 'allowEnvRead: false',
  'allowCookieHeaderSessionRead: false', 'allowJwtVerification: false', 'allowLiveKis: false',
  'allowProviderExecution: false', 'allowRouteSuccess: false', 'allowBetaExecution: false',
  'allowPublicExecution: false', 'allowRawDataEcho: false',
  'guardStatus: string', 'authState:', 'resolvedRole:', 'usageWindow:', 'engineStatus:',
  'mockedProviderRunner?:',
], 'Types');

assertIncludesAll(implementation, [
  'buildDefaultSimilarityGuardedRouteRuntimeCompositionPolicy',
  'buildAllGatesOffMockedRuntimeCompositionPolicy',
  'normalizeSimilarityGuardedRouteRuntimeCompositionRequest',
  'runSimilarityGuardedRouteRuntimeComposition',
  'buildBlockedGuardedRouteRuntimeCompositionResult',
  'assertSimilarityGuardedRouteRuntimeCompositionResultIsSafe',
  'enabled: false', 'allowMockedRuntime: false', 'enabled: true', 'allowMockedRuntime: true',
  '// 1. Request normalization.', '// 2. Auth resolver boundary.', '// 3. Role and usage adapter boundary.',
  '// 4. Feature flag and dependency gate boundary.', '// 5. Provider execution eligibility boundary.',
  '// 6. Mocked provider execution boundary.', '// 7. Safe response shaping.', '// 8. Final fail-closed fallback.',
  "'invalid_request'", "'auth_blocked'", "'role_usage_blocked'", "'feature_flag_blocked'",
  "'provider_blocked'", "'route_success_disabled'", "'redaction_failed'", "'safe_error'",
  'collectPrimitiveValues', 'EMAIL_ADDRESS_SHAPE_PATTERN', 'routeSuccessAllowed: false',
  'providerExecutionAllowed: false', 'betaExecutionAllowed: false', 'publicExecutionAllowed: false',
], 'Implementation');
assertTrue(!/allow(?:RealAuth|RealDb|SupabaseClient|EnvRead|CookieHeaderSessionRead|JwtVerification|LiveKis|ProviderExecution|RouteSuccess|BetaExecution|PublicExecution|RawDataEcho):\s*true/.test(stripComments(implementation)), 'No real capability enabled');

assertIncludesAll(fixtures, [
  'buildMockedGuardedRouteRuntimeCompositionRequest', 'buildAllGatesOffMockedRuntimeCompositionPolicy',
  'buildMockedCompositionDepsAllBlocked', 'buildMockedCompositionDepsAuthBlocked',
  'buildMockedCompositionDepsRoleUsageBlocked', 'buildMockedCompositionDepsFeatureFlagBlocked',
  'buildMockedCompositionDepsProviderBlocked', 'buildMockedCompositionDepsMostFavorableStillRouteDisabled',
  'buildMockedCompositionDepsUnsafeOutputAttempt', 'mock-guarded-request-ref-001',
  '2026-07-04T12:00:00.000+09:00',
], 'Fixtures');

assertTrue(indexSource.includes("from './similarityGuardedRouteRuntimeCompositionTypes'"), 'Index type export');
assertTrue(indexSource.includes("from './similarityGuardedRouteRuntimeComposition'"), 'Index implementation export');
assertTrue(indexSource.includes("from './mockedSimilarityGuardedRouteRuntimeCompositionFixtures'"), 'Index fixture export');
assertTrue(indexSource.includes('resolveSimilarityRealSupabaseAuthSubject'), 'Existing auth export preserved');
assertTrue(indexSource.includes('resolveSimilarityRoleUsageRuntimeAdapter'), 'Existing role usage export preserved');
assertTrue(indexSource.includes('resolveSimilarityFeatureFlags'), 'Existing flag export preserved');

const dispatchCount = (route.match(/if \(is(?:OwnerLocalMockedSimilarityApiRequestBody|OwnerLocalAuthUsageBridgeSimilarityApiRequestBody|GuardedRuntimeScaffoldSimilarityRequestBody)\(body\)\)/g) || []).length;
assertTrue(dispatchCount === 3, `Route must retain exactly three branches; found ${dispatchCount}.`);
assertTrue(route.includes("from '../../../lib/server/chartSimilarity/similarityGuardedRouteRuntimeComposition'"), 'Route imports composition');
assertTrue(route.includes('await runSimilarityGuardedRouteRuntimeComposition({'), 'Route calls composition');
assertTrue(route.indexOf('await runSimilarityGuardedRouteRuntimeComposition({') > route.indexOf('if (isGuardedRuntimeScaffoldSimilarityRequestBody(body))'), 'Call is inside guarded branch');
assertTrue(route.includes('return jsonResponse(buildSimilarityApiRouteShellResult({}));'), 'Safe route fallback preserved');
assertTrue(route.includes('isOwnerLocalMockedSimilarityApiRequestBody'), 'Owner-local mocked branch preserved');
assertTrue(route.includes('isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody'), 'Owner auth-usage branch preserved');
assertTrue(!/allowRouteSuccess\s*:\s*true|allowBetaExecution\s*:\s*true|allowPublicExecution\s*:\s*true/.test(stripComments(route)), 'No route activation');
assertTrue(ui.includes('chartAiOwnerLocalAuthUsageBridgePanel'), 'UI bridge panel unchanged');

assertIncludesAll(smoke, [
  'A default disabled', 'B malformed request', 'C auth blocked', 'D role usage blocked',
  'E feature flag blocked', 'F provider blocked', 'G favorable route disabled', 'H unsafe output',
  'callableProviderCalls', 'dispatchCount', 'assertionCount >= 90',
], 'Smoke');

assertTrue(result.startsWith('# Phase 3FD-E ??Guarded Route Runtime Composition Scaffold, All Gates Off, Mocked Runtime Only Result'), 'Result title');
assertIncludesAll(result, [
  '## 1. Status', '## 2. Implemented Scope', '## 3. Composition Result', '## 4. Route Result',
  '## 5. Boundary Preservation', '## 6. Validation', '## 7. Recommended Next Phase',
  'all gates off', 'mocked runtime only', 'route success disabled', 'no new route branch',
  'Phase 3FD-F-PLAN', 'Phase 3FD-E-HF1', 'Phase 3FD-B-HF1',
], 'Result');
assertTrue(planResult.includes('Phase 3FD-E-PLAN'), 'Approval result preserved');
assertTrue(previousResult.includes('mocked DB'), 'Previous implementation result preserved');

const runtimeNoComments = stripComments(`${types}\n${implementation}\n${fixtures}`);
assertTrue(!/@supabase\//.test(runtimeNoComments), 'No Supabase import');
assertTrue(!/createClient\s*\(/.test(runtimeNoComments), 'No client creation');
assertTrue(!/process\.env(?:\.|\[)/.test(runtimeNoComments), 'No process env read');
assertTrue(!/import\.meta\.env/.test(runtimeNoComments), 'No import meta env read');
assertTrue(!/\.env(?:\.|\s|$)/.test(runtimeNoComments), 'No env file read');
assertTrue(!/\bfetch\s*\(/.test(runtimeNoComments), 'No fetch call');
assertTrue(!/server\/providers|server\\providers|kisOhlcProvider/.test(runtimeNoComments), 'No provider import');
assertTrue(!/pages\/api|pages\\api|chart-ai\.astro/.test(runtimeNoComments), 'No UI or route import');
assertTrue(!/\b(?:CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)\s+(?:TABLE|POLICY|FUNCTION|INTO)\b/i.test(runtimeNoComments), 'No SQL execution');
assertTrue(!/migration\s+(?:up|apply|execute)/i.test(runtimeNoComments), 'No migration execution');
assertTrue(!/\b(account|trading|order|balance)(?:Data|Record|Payload)?\s*[?:]/i.test(runtimeNoComments), 'No account or trading fields');
assertTrue(!packageSource.includes('@supabase/ssr'), 'No new dependency required');

assertTrue(assertionCount >= 120, `Checker must run at least 120 assertions; ran ${assertionCount}.`);
assertTrue(assertionCount <= 155, `Checker must run at most 155 assertions; ran ${assertionCount}.`);

if (failureCount > 0) {
  console.error(`Phase 3FD-E contract check FAILED: ${failureCount}/${assertionCount} assertions failed.`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FD-E contract check passed: ${assertionCount}/${assertionCount} assertions passed.`);
