/** Narrow Phase 3FD-H mocked-only Chart AI login gate and cooldown exemption checker. */

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

const UI_PATH = 'src/pages/chart-ai.astro';
const RESULT_PATH = 'docs/planning/phase_3fd_h_chart_ai_login_gate_master_cooldown_exemption_mocked_ui_result_v0.1.md';
const CHECKER_PATH = 'scripts/check_phase_3fd_h_chart_ai_login_gate_master_cooldown_exemption_mocked_ui_contract.mjs';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_PATH = 'package.json';
const PLAN_RESULT_PATH = 'docs/planning/phase_3fd_h_plan_chart_ai_login_gate_master_cooldown_exemption_design_result_v0.1.md';
const COOLDOWN_RESULT_PATH = 'docs/planning/phase_3fd_g_hf1_analysis_trigger_cooldown_ux_mocked_only_result_v0.1.md';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const PORTFOLIO_PATH = 'src/pages/portfolio.astro';

assertTrue(existsSync(path.join(repoRoot, CHECKER_PATH)), 'Checker script must exist.');
const ui = readSource(UI_PATH);
const result = readSource(RESULT_PATH);
const checker = readSource(CHECKER_PATH);
const changelog = readSource(CHANGELOG_PATH);
const packageSource = readSource(PACKAGE_PATH);
const planResult = readSource(PLAN_RESULT_PATH);
const cooldownResult = readSource(COOLDOWN_RESULT_PATH);
const route = readSource(ROUTE_PATH);
const portfolio = readSource(PORTFOLIO_PATH);

assertTrue(packageSource.includes('"check:phase-3fd-h-chart-ai-login-gate-master-cooldown-exemption-mocked-ui": "node scripts/check_phase_3fd_h_chart_ai_login_gate_master_cooldown_exemption_mocked_ui_contract.mjs"'), 'Package script must be exact.');
assertTrue(changelog.includes('## Phase 3FD-H - 2026-07-04'), 'Changelog must contain Phase 3FD-H.');
assertTrue(changelog.includes('Chart AI Login Gate and Master Cooldown Exemption Mocked-only UI Implementation (Implemented)'), 'Changelog subtitle must be exact.');
assertTrue(changelog.indexOf('## Phase 3FD-H - 2026-07-04') < changelog.indexOf('## Phase 3FD-H-PLAN - 2026-07-04'), 'Phase 3FD-H must be the top phase entry.');
assertTrue(result.startsWith('# Phase 3FD-H — Chart AI Login Gate and Master Cooldown Exemption Mocked-only UI Implementation Result'), 'Result title must be exact.');

assertIncludesAll(ui, [
  "type ChartAiMockAuthState = 'anonymous' | 'authenticated'",
  "type ChartAiMockRole = 'user' | 'master'",
  "const chartAiMockLoggedOut = chartAiQuery.get('chartAiMockLoggedOut') === '1'",
  "const chartAiMockMaster = !chartAiMockLoggedOut && chartAiQuery.get('chartAiMockMaster') === '1'",
  'const mockedChartAiAccess',
  'authState: ChartAiMockAuthState',
  'role: ChartAiMockRole',
  'capabilities:',
  'canAccessChartAi: boolean',
  'canBypassAnalysisCooldown: boolean',
  'canRunSimilarPattern: boolean',
  'canRunMkAi: boolean',
  "authState: chartAiMockLoggedOut ? 'anonymous' : 'authenticated'",
  "role: chartAiMockMaster ? 'master' : 'user'",
  'canAccessChartAi: !chartAiMockLoggedOut',
  'canBypassAnalysisCooldown: chartAiMockMaster',
  'canRunSimilarPattern: !chartAiMockLoggedOut',
  'canRunMkAi: !chartAiMockLoggedOut',
  'Mocked page capability model only',
  'no real identity, session, or authorization data',
], 'Mocked capability model');

assertIncludesAll(ui, [
  'data-chart-ai-auth-gate="locked"',
  'data-chart-ai-auth-gate-card',
  'data-chart-ai-auth-gate-cta',
  'data-chart-ai-auth-state="authenticated"',
  'data-chart-ai-auth-body',
  'data-chart-ai-master-mode="false"',
  'data-chart-ai-cooldown-bypass="false"',
  'data-chart-ai-master-notice',
  '접속 필요',
  '로그인이 필요합니다',
  '회원가입 또는 로그인 후 Chart AI 분석 기능을 사용할 수 있습니다.',
  '회원가입 / 로그인',
  '마스터 권한으로 재분석 대기 시간이 적용되지 않습니다.',
  'chart-ai-auth-lock-visual',
  'chart-ai-auth-gate-card',
  'chart-ai-auth-gate-cta',
  'chart-ai-master-mode-notice',
  'aria-labelledby="chart-ai-auth-gate-title"',
], 'Login gate markup and copy');

assertIncludesAll(ui, [
  'authShell.dataset.chartAiAuthState = mockedChartAiAccess.authState',
  'authShell.dataset.chartAiMasterMode = String(chartAiMockMaster)',
  'authShell.dataset.chartAiCooldownBypass = String(mockedChartAiAccess.capabilities.canBypassAnalysisCooldown)',
  'authGate.hidden = mockedChartAiAccess.capabilities.canAccessChartAi',
  'authBody.hidden = !mockedChartAiAccess.capabilities.canAccessChartAi',
  'masterModeNotice.hidden = !chartAiMockMaster',
  "window.dispatchEvent(new CustomEvent('mk:open-auth'))",
  'authenticated: mockedChartAiAccess.capabilities.canAccessChartAi',
  '!mockedAnalysisAuth.authenticated || !mockedChartAiAccess.capabilities.canAccessChartAi',
  "analysisStates[kind] = 'login_required'",
  "kind === 'similar-pattern' && !mockedChartAiAccess.capabilities.canRunSimilarPattern",
  "kind === 'mk-ai' && !mockedChartAiAccess.capabilities.canRunMkAi",
  'mockedChartAiAccess.capabilities.canBypassAnalysisCooldown',
  'clearAnalysisCooldownTimer(kind)',
  'analysisCooldowns[kind].cooldownUntil = null',
  'analysisCooldowns[kind].cooldownRemainingMs = 0',
  'analysisCooldowns[kind].isCooldownActive = false',
  'startAnalysisCooldown(kind)',
  'mockedChartAiAccess.capabilities.canAccessChartAi && isLocalOwnerHostname() && ownerLocalMockedOptIn',
  'mockedChartAiAccess.capabilities.canAccessChartAi && isLocalOwnerHostname() && authUsageBridgeOptIn',
  "chartAiQuery.get('chartAiMockLoggedOut')",
  "chartAiQuery.get('chartAiMockMaster')",
  'chartAiMockMaster = !chartAiMockLoggedOut',
  'if (authGate) authGate.hidden',
  'if (authBody) authBody.hidden',
], 'Login and master behavior');

assertIncludesAll(ui, [
  'const ANALYSIS_COOLDOWN_MS = 5 * 60 * 1000;',
  '05:00 후 다시 분석 가능',
  '다시 분석 가능까지',
  '재분석 대기 중',
  '다시 분석할 수 있습니다.',
  '유사 패턴 분석 시작',
  'MK AI 분석 시작',
  "'idle'", "'login_required'", "'loading'", "'success'", "'usage_limited'", "'blocked'", "'error'",
  'activeAnalysisRun',
  'analysisMockedDelayTimer',
  'Duplicate and simultaneous run prevention',
  "kind === 'mk-ai' && analysisStates['similar-pattern'] !== 'success'",
  "analysisStates[kind] = 'blocked'",
  "analysisStates[kind] = 'success'",
  "result.hidden = state !== 'success'",
  'window.setInterval(() => updateAnalysisCooldown(kind), 1000)',
  "window.addEventListener('pagehide'",
  "window.addEventListener('pageshow'",
  'id="chartAiOwnerLocalMockedPanel"',
  'id="chartAiOwnerLocalAuthUsageBridgePanel"',
  "get('ownerLocalMocked') === '1'",
  "get('ownerLocalAuthUsageBridge') === '1'",
], 'Existing Chart AI behavior');

assertIncludesAll(ui, [
  '.chart-ai-auth-shell',
  '.chart-ai-auth-gate',
  'place-items: center',
  '.chart-ai-auth-gate[hidden]',
  '[data-chart-ai-auth-body][hidden]',
  '.chart-ai-auth-gate-card',
  '.chart-ai-master-mode-notice',
], 'Login gate presentation');

const dispatchCount = (route.match(/if \(is(?:OwnerLocalMockedSimilarityApiRequestBody|OwnerLocalAuthUsageBridgeSimilarityApiRequestBody|GuardedRuntimeScaffoldSimilarityRequestBody)\(body\)\)/g) || []).length;
assertTrue(dispatchCount === 3, `Route must retain exactly three dispatch branches; found ${dispatchCount}.`);
assertTrue(route.includes('runSimilarityGuardedRouteRuntimeComposition'), 'Route composition call must remain.');
assertTrue(route.includes('return jsonResponse(buildSimilarityApiRouteShellResult(body));'), 'Route safe disabled fallback must remain.');

const resultFlat = result.replace(/\s+/g, ' ');
assertIncludesAll(resultFlat, [
  '## 1. Status',
  '## 2. Implemented Scope',
  '## 3. UX Result',
  '## 4. Security and Privacy Result',
  '## 5. Boundary Preservation',
  '## 6. Validation',
  '## 7. Recommended Next Phase',
  '`/chart-ai` UI-only mocked implementation',
  'No real auth was implemented',
  'no database was connected',
  'no Supabase client was created',
  'no environment value was read',
  'No cookie, header, session, or JWT was parsed',
  'No API or LLM call, live KIS access',
  'No raw master identifiers were committed',
  'No client-side comparison against a raw identifier',
  'mocked `canBypassAnalysisCooldown` capability',
  'Portfolio, route, server runtime, providers, deterministic engine, and data are unchanged',
  'No actual server-side usage limiting or persistence was added',
  'Phase 3FD-H-MANUAL-RUN — Owner Browser QA for Chart AI Login Gate and Master Cooldown Exemption',
  'Phase 3FD-H-HF1 — Login Gate or Master Exemption Mocked-only UI Revisions',
  'Phase 3FD-B-HF1 — Real Supabase Client Factory Approval Package, No Runtime Change',
  'Owner-local panels remain available in authenticated mock modes',
  'MK AI prerequisite and loading duplicate prevention remain active',
  'without showing a cooldown countdown',
], 'Result document');

const phaseHChangelogStart = changelog.indexOf('## Phase 3FD-H - 2026-07-04');
const phaseHChangelogEnd = changelog.indexOf('## Phase 3FD-H-PLAN - 2026-07-04');
const phaseHChangelog = phaseHChangelogStart >= 0 && phaseHChangelogEnd > phaseHChangelogStart
  ? changelog.slice(phaseHChangelogStart, phaseHChangelogEnd)
  : '';
assertTrue(phaseHChangelog.length > 0, 'Phase 3FD-H changelog entry must be inspectable.');
assertIncludesAll(phaseHChangelog, [
  'Raw master identifiers are sensitive',
  'mocked capabilities only',
  'no raw master identifiers committed',
  '`chartAiMockLoggedOut=1`',
  '`chartAiMockMaster=1`',
], 'Changelog entry');

assertTrue(planResult.includes('Phase 3FD-H-PLAN'), 'Phase 3FD-H-PLAN result must remain present.');
assertTrue(planResult.replace(/\s+/g, ' ').includes('master user may bypass only that client-side cooldown UX'), 'Phase 3FD-H-PLAN decision must remain present.');
assertTrue(cooldownResult.includes('five-minute client-side cooldown'), 'Phase 3FD-G-HF1 cooldown baseline must remain present.');
assertTrue(portfolio.length > 0, 'Portfolio reference source must remain inspectable.');

const emailLiteralPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const uuidLiteralPattern = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
assertTrue(!emailLiteralPattern.test(result), 'Result must not contain an email address literal.');
assertTrue(!uuidLiteralPattern.test(result), 'Result must not contain a UUID literal.');
assertTrue(!emailLiteralPattern.test(checker), 'Checker must not contain an email address literal.');
assertTrue(!uuidLiteralPattern.test(checker), 'Checker must not contain a UUID literal.');
assertTrue(!emailLiteralPattern.test(phaseHChangelog), 'Phase 3FD-H changelog entry must not contain an email address literal.');
assertTrue(!uuidLiteralPattern.test(phaseHChangelog), 'Phase 3FD-H changelog entry must not contain a UUID literal.');
assertTrue(!emailLiteralPattern.test(ui), '/chart-ai must not contain an email address literal.');
assertTrue(!uuidLiteralPattern.test(ui), '/chart-ai must not contain a UUID literal.');

const authFlowStart = ui.indexOf('type ChartAiMockAuthState');
const authFlowEnd = ui.indexOf('const setText', authFlowStart);
const authFlow = authFlowStart >= 0 && authFlowEnd > authFlowStart ? ui.slice(authFlowStart, authFlowEnd) : '';
assertTrue(authFlow.length > 0, 'Mocked page capability flow must be inspectable.');
assertTrue(!/\bfetch\s*\(/.test(authFlow), 'Mocked page capability flow must not call fetch.');
assertTrue(!/@supabase\//.test(authFlow), 'Mocked page capability flow must not import Supabase.');
assertTrue(!/createClient\s*\(/.test(authFlow), 'Mocked page capability flow must not create a client.');
assertTrue(!/process\.env(?:\.|\[)/.test(ui), '/chart-ai must not read process env.');
assertTrue(!/import\.meta\.env/.test(ui), '/chart-ai must not read import meta env.');
assertTrue(!/(?:localStorage|sessionStorage)\s*[.(]/.test(authFlow), 'Mocked page capability flow must not persist role state.');
assertTrue(!/allowRouteSuccess\s*:\s*true/.test(ui), '/chart-ai must not activate route success.');

assertTrue(assertionCount >= 135, `Checker must run at least 135 assertions; ran ${assertionCount}.`);
assertTrue(assertionCount <= 170, `Checker must run at most 170 assertions; ran ${assertionCount}.`);

if (failureCount > 0) {
  console.error(`Phase 3FD-H check FAILED: ${failureCount}/${assertionCount} assertions failed.`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FD-H check passed: ${assertionCount}/${assertionCount} assertions passed.`);
