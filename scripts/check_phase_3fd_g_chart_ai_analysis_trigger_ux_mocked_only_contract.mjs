/** Narrow Phase 3FD-G mocked-only Chart AI trigger UX contract checker. */

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
const RESULT_PATH = 'docs/planning/phase_3fd_g_chart_ai_analysis_trigger_ux_mocked_only_result_v0.1.md';
const CHECKER_PATH = 'scripts/check_phase_3fd_g_chart_ai_analysis_trigger_ux_mocked_only_contract.mjs';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_PATH = 'package.json';
const PLAN_RESULT_PATH = 'docs/planning/phase_3fd_g_plan_chart_ai_analysis_trigger_ux_login_usage_gate_design_result_v0.1.md';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';

assertTrue(existsSync(path.join(repoRoot, CHECKER_PATH)), 'Checker script must exist.');
const ui = readSource(UI_PATH);
const result = readSource(RESULT_PATH);
const changelog = readSource(CHANGELOG_PATH);
const packageSource = readSource(PACKAGE_PATH);
const planResult = readSource(PLAN_RESULT_PATH);
const route = readSource(ROUTE_PATH);

assertTrue(packageSource.includes('"check:phase-3fd-g-chart-ai-analysis-trigger-ux-mocked-only": "node scripts/check_phase_3fd_g_chart_ai_analysis_trigger_ux_mocked_only_contract.mjs"'), 'Package script must be exact.');
assertTrue(changelog.includes('## Phase 3FD-G - 2026-07-04'), 'Changelog must contain Phase 3FD-G.');
assertTrue(changelog.includes('Chart AI Analysis Trigger UX Mocked-only Implementation (Implemented)'), 'Changelog subtitle must be exact.');
assertTrue(changelog.indexOf('## Phase 3FD-G - 2026-07-04') < changelog.indexOf('## Phase 3FD-G-PLAN - 2026-07-04'), 'Phase 3FD-G must be the top entry.');
assertTrue(result.startsWith('# Phase 3FD-G — Chart AI Analysis Trigger UX Mocked-only Implementation Result'), 'Result title must be exact.');

assertIncludesAll(ui, [
  '유사 패턴 분석 시작',
  '현재 차트와 유사한 과거 패턴을 분석합니다.',
  '로그인 후 유사 패턴 분석을 실행할 수 있습니다.',
  '오늘 사용 가능 횟수: 베타 기간 제한 없음',
  '유사 패턴 분석을 진행 중입니다. 잠시만 기다려주세요.',
  '현재 차트 데이터를 기준으로 과거 유사 구간을 탐색하고 있습니다.',
  'MK AI 분석 시작',
  '차트 흐름과 유사 패턴 결과를 바탕으로 AI 해석을 제공합니다.',
  '로그인 후 MK AI 분석을 실행할 수 있습니다.',
  'MK AI 분석을 생성 중입니다. 잠시만 기다려주세요.',
  '차트 흐름과 유사 패턴 결과를 바탕으로 해석을 구성하고 있습니다.',
  '먼저 유사 패턴 분석을 실행하면 MK AI 분석을 사용할 수 있습니다.',
], '/chart-ai copy');

assertIncludesAll(ui, [
  "'idle'", "'login_required'", "'loading'", "'success'", "'usage_limited'", "'blocked'", "'error'",
], 'State model');
assertIncludesAll(ui, [
  'data-chart-ai-analysis-trigger="similar-pattern"',
  'data-chart-ai-analysis-trigger="mk-ai"',
  'data-chart-ai-analysis-state="similar-pattern"',
  'data-chart-ai-analysis-state="mk-ai"',
  'data-chart-ai-analysis-result="similar-pattern"',
  'data-chart-ai-analysis-result="mk-ai"',
  'data-chart-ai-usage-status="similar-pattern"',
  'data-chart-ai-usage-status="mk-ai"',
], 'Stable selectors');

assertIncludesAll(ui, [
  'Mocked client-side auth placeholder only',
  'not production auth',
  'no Supabase client',
  'session/JWT parsing',
  'chartAiMockLoggedOut',
  "source: 'mocked-client-only'",
  "analysisStates[kind] = 'login_required'",
], 'Mocked auth placeholder');
assertIncludesAll(ui, [
  'dailyLimitEnabled', 'dailyLimit', 'dailyUsed', 'dailyRemaining', 'usageWindow', 'usageResetAt',
  "usageDisplay: '오늘 사용 가능 횟수: 베타 기간 제한 없음'",
  'dailyLimitEnabled: false',
], 'Usage placeholder');

assertIncludesAll(ui, [
  'runMockedAnalysisTrigger',
  'activeAnalysisRun',
  'analysisMockedDelayTimer',
  'window.setTimeout',
  'window.clearTimeout',
  '}, 900)',
  "analysisStates[kind] === 'loading'",
  "kind === 'mk-ai'",
  "analysisStates['similar-pattern'] !== 'success'",
  "analysisStates[kind] = 'blocked'",
  "analysisStates[kind] = 'usage_limited'",
  "analysisStates[kind] = 'success'",
  'Duplicate and simultaneous run prevention',
  'renderAllMockedAnalysisStates',
  'resetAnalysisTriggers',
], 'Mocked trigger controller');

assertIncludesAll(ui, [
  'type="button" class="chart-analysis-trigger-button"',
  'aria-live="polite"',
  'aria-busy="false"',
  "card.setAttribute('aria-busy'",
  'trigger.disabled =',
  "result.hidden = state !== 'success'",
  "loading.hidden = state !== 'loading'",
  'chart-analysis-loading-cue',
  'chart-analysis-loading-dot',
  '.chart-analysis-result-reveal[hidden]',
  '.chart-analysis-trigger-button:focus-visible',
  '@keyframes chart-analysis-loading-pulse',
  '@media (max-width: 640px)',
  'grid-template-columns: minmax(0, 1fr)',
], 'Accessibility and responsive UI');

assertTrue(ui.includes('id="chartAiOwnerLocalMockedPanel"'), 'Owner-local mocked panel marker must remain.');
assertTrue(ui.includes('id="chartAiOwnerLocalAuthUsageBridgePanel"'), 'Owner-local auth/usage panel marker must remain.');
assertTrue(ui.includes("get('ownerLocalMocked') === '1'"), 'Owner-local mocked query gate must remain.');
assertTrue(ui.includes("get('ownerLocalAuthUsageBridge') === '1'"), 'Owner-local auth/usage query gate must remain.');

const dispatchCount = (route.match(/if \(is(?:OwnerLocalMockedSimilarityApiRequestBody|OwnerLocalAuthUsageBridgeSimilarityApiRequestBody|GuardedRuntimeScaffoldSimilarityRequestBody)\(body\)\)/g) || []).length;
assertTrue(dispatchCount === 3, `Route must retain exactly three branches; found ${dispatchCount}.`);
assertTrue(route.includes('runSimilarityGuardedRouteRuntimeComposition'), 'Route composition call must remain.');
assertTrue(route.includes('return jsonResponse(buildSimilarityApiRouteShellResult({}));'), 'Route safe disabled fallback must remain.');

const resultFlat = result.replace(/\s+/g, ' ').toLowerCase();
assertIncludesAll(resultFlat, [
  '## 1. status', '## 2. implemented scope', '## 3. ux result',
  '## 4. boundary preservation', '## 5. validation', '## 6. recommended next phase',
  'implemented', '`/chart-ai` ui-only', 'mocked-only analysis trigger ux',
  'no route source', 'no server runtime source', 'no api or llm call',
  'no database connection or supabase client', 'no environment value',
  'no migration execution or live kis call',
  'no actual usage limiting, payment or ad integration',
  'package installation, dependency change', 'deployment, or push occurred',
  'phase 3fd-g-manual-run — owner browser qa for analysis trigger ux',
], 'Result document');
assertTrue(planResult.includes('Phase 3FD-G-PLAN'), 'Phase 3FD-G-PLAN result must remain present.');
assertTrue(changelog.includes('no API call for the new trigger flow'), 'Changelog must preserve the no-API boundary.');
assertTrue(changelog.includes('no actual usage count limiting'), 'Changelog must preserve the no-limit boundary.');
assertTrue(changelog.includes('no payment/ad integration'), 'Changelog must preserve the monetization boundary.');

const triggerStart = ui.indexOf('const runMockedAnalysisTrigger');
const triggerEnd = ui.indexOf("document.querySelectorAll<HTMLButtonElement>('[data-chart-ai-analysis-trigger]')", triggerStart);
const triggerFlow = triggerStart >= 0 && triggerEnd > triggerStart ? ui.slice(triggerStart, triggerEnd) : '';
assertTrue(triggerFlow.length > 0, 'Mocked trigger function body must be inspectable.');
assertTrue(!/\bfetch\s*\(/.test(triggerFlow), 'New mocked trigger flow must not call fetch.');
assertTrue(!/@supabase\//.test(ui), '/chart-ai must not import Supabase.');
assertTrue(!/createClient\s*\(/.test(ui), '/chart-ai must not create a client.');
assertTrue(!/process\.env(?:\.|\[)/.test(ui), '/chart-ai must not read process env.');
assertTrue(!/import\.meta\.env/.test(ui), '/chart-ai must not read import meta env.');
assertTrue(!/(?:localStorage|sessionStorage)\s*[.(]/.test(triggerFlow), 'Trigger flow must not persist usage counts.');
assertTrue(!/(?:stripe|paddle|adsbygoogle|googletag)/i.test(triggerFlow), 'Trigger flow must not add payment or ad SDKs.');
assertTrue(!/allowRouteSuccess\s*:\s*true/.test(ui), '/chart-ai must not activate route success.');
assertTrue(!/\bKIS\b/.test(triggerFlow), 'New trigger controller must not add a live KIS path.');
assertTrue(!/\b(account|trading|order|balance)(?:Data|Record|Payload)?\s*[:=]/i.test(triggerFlow), 'Trigger flow must add no account or trading fields.');

assertTrue(assertionCount >= 120, `Checker must run at least 120 assertions; ran ${assertionCount}.`);
assertTrue(assertionCount <= 160, `Checker must run at most 160 assertions; ran ${assertionCount}.`);

if (failureCount > 0) {
  console.error(`Phase 3FD-G check FAILED: ${failureCount}/${assertionCount} assertions failed.`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FD-G check passed: ${assertionCount}/${assertionCount} assertions passed.`);
