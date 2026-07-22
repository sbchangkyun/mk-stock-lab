/** Narrow Phase 3FD-G-HF1 mocked-only analysis cooldown UX contract checker. */

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
const RESULT_PATH = 'docs/planning/phase_3fd_g_hf1_analysis_trigger_cooldown_ux_mocked_only_result_v0.1.md';
const CHECKER_PATH = 'scripts/check_phase_3fd_g_hf1_analysis_trigger_cooldown_ux_mocked_only_contract.mjs';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_PATH = 'package.json';
const PHASE_G_RESULT_PATH = 'docs/planning/phase_3fd_g_chart_ai_analysis_trigger_ux_mocked_only_result_v0.1.md';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';

assertTrue(existsSync(path.join(repoRoot, CHECKER_PATH)), 'Checker script must exist.');
const ui = readSource(UI_PATH);
const result = readSource(RESULT_PATH);
const changelog = readSource(CHANGELOG_PATH);
const packageSource = readSource(PACKAGE_PATH);
const phaseGResult = readSource(PHASE_G_RESULT_PATH);
const route = readSource(ROUTE_PATH);

assertTrue(packageSource.includes('"check:phase-3fd-g-hf1-analysis-trigger-cooldown-ux-mocked-only": "node scripts/check_phase_3fd_g_hf1_analysis_trigger_cooldown_ux_mocked_only_contract.mjs"'), 'Package script must be exact.');
assertTrue(changelog.includes('## Phase 3FD-G-HF1 - 2026-07-04'), 'Changelog must contain Phase 3FD-G-HF1.');
assertTrue(changelog.includes('Analysis Trigger Cooldown UX, Mocked-only UI Revision (Implemented)'), 'Changelog subtitle must be exact.');
assertTrue(changelog.indexOf('## Phase 3FD-G-HF1 - 2026-07-04') < changelog.indexOf('## Phase 3FD-G - 2026-07-04'), 'Phase 3FD-G-HF1 must precede Phase 3FD-G.');
assertTrue(result.startsWith('# Phase 3FD-G-HF1 — Analysis Trigger Cooldown UX Mocked-only UI Revision Result'), 'Result title must be exact.');

assertIncludesAll(ui, [
  'const ANALYSIS_COOLDOWN_MS = 5 * 60 * 1000;',
  'Mocked client-side cooldown UX only. Production protection must be enforced server-side before real KIS/LLM activation.',
  'type ChartAiAnalysisCooldown = {',
  'cooldownUntil: number | null;',
  'cooldownRemainingMs: number;',
  'cooldownTimer: number | null;',
  'isCooldownActive: boolean;',
  'const analysisCooldowns: Record<ChartAiAnalysisKind, ChartAiAnalysisCooldown>',
], 'Cooldown model');

assertIncludesAll(ui, [
  'data-chart-ai-cooldown="similar-pattern"',
  'data-chart-ai-cooldown="mk-ai"',
  'data-chart-ai-cooldown-remaining="similar-pattern"',
  'data-chart-ai-cooldown-remaining="mk-ai"',
  'data-chart-ai-cooldown-label="similar-pattern"',
  'data-chart-ai-cooldown-label="mk-ai"',
  'data-chart-ai-cooldown-support="similar-pattern"',
  'data-chart-ai-cooldown-support="mk-ai"',
  '다시 분석 가능까지',
  '후 다시 분석 가능',
  '다시 분석할 수 있습니다.',
  '재분석 대기 중',
  '과도한 반복 분석 요청을 방지하기 위해 잠시 후 다시 실행할 수 있습니다.',
], 'Cooldown UI');

assertIncludesAll(ui, [
  'const formatAnalysisCooldown',
  'Math.ceil(remainingMs / 1000)',
  'Math.floor(remainingSeconds / 60)',
  ".padStart(2, '0')",
  'const clearAnalysisCooldownTimer',
  'window.clearInterval(cooldown.cooldownTimer)',
  'const updateAnalysisCooldown',
  '(cooldown.cooldownUntil ?? 0) - Date.now()',
  'cooldown.cooldownRemainingMs === 0',
  'cooldown.cooldownUntil = null',
  'cooldown.isCooldownActive = false',
  'const startAnalysisCooldown',
  'Date.now() + ANALYSIS_COOLDOWN_MS',
  'cooldown.cooldownRemainingMs = ANALYSIS_COOLDOWN_MS',
  'cooldown.isCooldownActive = true',
  'window.setInterval(() => updateAnalysisCooldown(kind), 1000)',
  'startAnalysisCooldown(kind)',
], 'Cooldown timer lifecycle');

assertIncludesAll(ui, [
  'const showCooldownStatus = state === \'success\'',
  'card.dataset.cooldownActive = String(cooldown.isCooldownActive)',
  'cooldownStatus.hidden = !showCooldownStatus',
  "cooldownLabel.textContent = cooldown.isCooldownActive ? '다시 분석 가능까지' : '다시 분석할 수 있습니다.'",
  'cooldownRemaining.hidden = !cooldown.isCooldownActive',
  'cooldownRemaining.textContent = formatAnalysisCooldown(cooldown.cooldownRemainingMs)',
  'cooldownSupport.hidden = !cooldown.isCooldownActive',
  'activeAnalysisRun !== null || cooldown.isCooldownActive',
  "cooldown.isCooldownActive\n          ? '재분석 대기 중'",
  "analysisCooldowns[kind].isCooldownActive) return",
  "result.hidden = state !== 'success'",
], 'Cooldown rendering and execution guard');

assertIncludesAll(ui, [
  "'idle'", "'login_required'", "'loading'", "'success'", "'usage_limited'", "'blocked'", "'error'",
  "analysisStates[kind] = 'login_required'",
  "kind === 'mk-ai' && analysisStates['similar-pattern'] !== 'success'",
  "analysisStates[kind] = 'blocked'",
  "analysisStates[kind] = 'usage_limited'",
  "analysisStates[kind] = 'success'",
  'activeAnalysisRun',
  'analysisMockedDelayTimer',
  'Duplicate and simultaneous run prevention',
], 'Phase 3FD-G state preservation');

assertIncludesAll(ui, [
  'aria-live="polite"',
  'aria-live="off"',
  'font-variant-numeric: tabular-nums',
  '.chart-analysis-cooldown-status',
  '.chart-analysis-cooldown-status[hidden]',
  '[data-cooldown-active="true"] .chart-analysis-trigger-button:disabled',
  'cursor: not-allowed',
  '@media (max-width: 640px)',
  '@media (prefers-reduced-motion: reduce)',
], 'Accessible responsive presentation');

assertIncludesAll(ui, [
  "(['similar-pattern', 'mk-ai'] as const).forEach",
  'clearAnalysisCooldownTimer(kind)',
  "analysisCooldowns[kind].cooldownUntil = null",
  "analysisCooldowns[kind].cooldownRemainingMs = 0",
  "analysisCooldowns[kind].isCooldownActive = false",
  "window.addEventListener('pagehide'",
  "clearAnalysisCooldownTimer('similar-pattern')",
  "clearAnalysisCooldownTimer('mk-ai')",
], 'Cooldown cleanup');

assertTrue(ui.includes('id="chartAiOwnerLocalMockedPanel"'), 'Owner-local mocked panel marker must remain.');
assertTrue(ui.includes('id="chartAiOwnerLocalAuthUsageBridgePanel"'), 'Owner-local auth/usage panel marker must remain.');
assertTrue(ui.includes("get('ownerLocalMocked') === '1'"), 'Owner-local mocked query gate must remain.');
assertTrue(ui.includes("get('ownerLocalAuthUsageBridge') === '1'"), 'Owner-local auth/usage query gate must remain.');
assertTrue(phaseGResult.includes('# Phase 3FD-G — Chart AI Analysis Trigger UX Mocked-only Implementation Result'), 'Phase 3FD-G result must remain present.');

const dispatchCount = (route.match(/if \(is(?:OwnerLocalMockedSimilarityApiRequestBody|OwnerLocalAuthUsageBridgeSimilarityApiRequestBody|GuardedRuntimeScaffoldSimilarityRequestBody)\(body\)\)/g) || []).length;
assertTrue(dispatchCount === 3, `Route must retain exactly three branches; found ${dispatchCount}.`);
assertTrue(route.includes('runSimilarityGuardedRouteRuntimeComposition'), 'Route composition call must remain.');
assertTrue(route.includes('return jsonResponse(buildSimilarityApiRouteShellResult({}));'), 'Route safe disabled fallback must remain.');

const resultFlat = result.replace(/\s+/g, ' ').toLowerCase();
assertIncludesAll(resultFlat, [
  '## 1. status',
  '## 2. implemented scope',
  '## 3. ux result',
  '## 4. product risk mitigation',
  '## 5. boundary preservation',
  '## 6. validation',
  '## 7. recommended next phase',
  'five-minute client-side cooldown',
  'result remains visible',
  'logged-out',
  'prerequisite-blocked outcomes do not start a cooldown',
  'server-side rate limiting',
  'cache reuse',
  'usage quotas',
  'cost guards',
  'no route, server runtime, provider',
  'no database was connected and no supabase client was created',
  'no environment value, cookie, header, session, or jwt',
  'no api, llm, or live kis call',
  'no actual server-side usage limiting, persistence, payment, or ad integration',
  'no package was installed; no dependency or lockfile changed',
  'no route success, beta/public activation, deployment, or push occurred',
  'phase 3fd-g-manual-run — owner browser qa for analysis trigger cooldown ux',
  'phase 3fd-g-hf2 — cooldown ux copy/visual polish, mocked-only ui revision',
  'phase 3fd-b-hf1 — real supabase client factory approval package, no runtime change',
], 'Result document');

assertTrue(changelog.includes('client-side UX friction only'), 'Changelog must identify the client-side-only mitigation.');
assertTrue(changelog.includes('production protection still requires server-side rate limiting, cache reuse, usage quotas, and cost guards'), 'Changelog must preserve production protection requirements.');
assertTrue(changelog.includes('no API call for the new trigger/cooldown flow'), 'Changelog must preserve the no-API boundary.');
assertTrue(changelog.includes('no actual server-side usage limiting'), 'Changelog must preserve the no-server-limit boundary.');
assertTrue(changelog.includes('no dependency or lockfile change'), 'Changelog must preserve the dependency boundary.');

const triggerStart = ui.indexOf('const runMockedAnalysisTrigger');
const triggerEnd = ui.indexOf("document.querySelectorAll<HTMLButtonElement>('[data-chart-ai-analysis-trigger]')", triggerStart);
const triggerFlow = triggerStart >= 0 && triggerEnd > triggerStart ? ui.slice(triggerStart, triggerEnd) : '';
assertTrue(triggerFlow.length > 0, 'Mocked trigger function body must be inspectable.');
assertTrue(!/\bfetch\s*\(/.test(triggerFlow), 'New mocked trigger/cooldown flow must not call fetch.');
assertTrue(!/@supabase\//.test(ui), '/chart-ai must not import Supabase.');
assertTrue(!/createClient\s*\(/.test(ui), '/chart-ai must not create a client.');
assertTrue(!/process\.env(?:\.|\[)/.test(ui), '/chart-ai must not read process env.');
assertTrue(!/import\.meta\.env/.test(ui), '/chart-ai must not read import meta env.');
assertTrue(!/(?:localStorage|sessionStorage)\s*[.(]/.test(triggerFlow), 'Cooldown flow must not persist state.');
assertTrue(!/(?:stripe|paddle|adsbygoogle|googletag)/i.test(triggerFlow), 'Cooldown flow must not add payment or ad SDKs.');
assertTrue(!/allowRouteSuccess\s*:\s*true/.test(ui), '/chart-ai must not activate route success.');
assertTrue(!/\bKIS\b/.test(triggerFlow), 'New trigger/cooldown controller must not add a live KIS path.');
assertTrue(!/\b(account|trading|order|balance)(?:Data|Record|Payload)?\s*[:=]/i.test(triggerFlow), 'Cooldown flow must add no account or trading fields.');

assertTrue(assertionCount >= 115, `Checker must run at least 115 assertions; ran ${assertionCount}.`);
assertTrue(assertionCount <= 150, `Checker must run at most 150 assertions; ran ${assertionCount}.`);

if (failureCount > 0) {
  console.error(`Phase 3FD-G-HF1 check FAILED: ${failureCount}/${assertionCount} assertions failed.`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FD-G-HF1 check passed: ${assertionCount}/${assertionCount} assertions passed.`);
