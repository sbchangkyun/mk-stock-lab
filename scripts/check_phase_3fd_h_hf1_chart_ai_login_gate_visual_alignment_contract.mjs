/** Narrow Phase 3FD-H-HF1 Chart AI login-gate visual alignment checker. */

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
const PORTFOLIO_PATH = 'src/pages/portfolio.astro';
const RESULT_PATH = 'docs/planning/phase_3fd_h_hf1_chart_ai_login_gate_visual_alignment_result_v0.1.md';
const CHECKER_PATH = 'scripts/check_phase_3fd_h_hf1_chart_ai_login_gate_visual_alignment_contract.mjs';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_PATH = 'package.json';
const PHASE_H_RESULT_PATH = 'docs/planning/phase_3fd_h_chart_ai_login_gate_master_cooldown_exemption_mocked_ui_result_v0.1.md';

assertTrue(existsSync(path.join(repoRoot, CHECKER_PATH)), 'Checker script must exist.');
const ui = readSource(UI_PATH);
const portfolio = readSource(PORTFOLIO_PATH);
const result = readSource(RESULT_PATH);
const checker = readSource(CHECKER_PATH);
const changelog = readSource(CHANGELOG_PATH);
const packageSource = readSource(PACKAGE_PATH);
const phaseHResult = readSource(PHASE_H_RESULT_PATH);

assertTrue(packageSource.includes('"check:phase-3fd-h-hf1-chart-ai-login-gate-visual-alignment": "node scripts/check_phase_3fd_h_hf1_chart_ai_login_gate_visual_alignment_contract.mjs"'), 'Package script must be exact.');
assertTrue(changelog.includes('## Phase 3FD-H-HF1 - 2026-07-04'), 'Changelog must contain Phase 3FD-H-HF1.');
assertTrue(changelog.includes('Chart AI Login Gate Visual Alignment with Portfolio, Mocked-only UI Revision (Implemented)'), 'Changelog subtitle must be exact.');
assertTrue(changelog.indexOf('## Phase 3FD-H-HF1 - 2026-07-04') < changelog.indexOf('## Phase 3FD-H - 2026-07-04'), 'Phase 3FD-H-HF1 must be the top phase entry.');
assertTrue(result.startsWith('# Phase 3FD-H-HF1 — Chart AI Login Gate Visual Alignment Result'), 'Result title must be exact.');

assertIncludesAll(ui, [
  'data-chart-ai-auth-gate="locked"',
  'data-chart-ai-auth-gate-card',
  'data-chart-ai-auth-gate-cta',
  'data-chart-ai-auth-state="authenticated"',
  'data-chart-ai-auth-body',
  'data-chart-ai-master-mode="false"',
  'data-chart-ai-cooldown-bypass="false"',
  '접속 필요',
  '로그인이 필요합니다',
  '회원가입 또는 로그인 후 Chart AI 분석 기능을 사용할 수 있습니다.',
  '회원가입 / 로그인',
  'Portfolio-aligned lock state',
  'portfolio-aligned-lock-state',
  'primary-action chart-ai-auth-gate-cta',
], 'Login gate structure');

assertIncludesAll(portfolio, [
  'class="portfolio-lock-state hidden"',
  'class="lock-visual"',
  'class="primary-action"',
], 'Portfolio reference structure');

assertIncludesAll(ui, [
  '.chart-ai-auth-gate {',
  'justify-items: center',
  'gap: 14px',
  'margin-top: 18px',
  'padding: 34px 24px',
  'border: 1px solid var(--border)',
  'border-radius: 8px',
  'background: var(--surface)',
  'box-shadow: var(--shadow)',
  'text-align: center',
  'width: 76px',
  'height: 76px',
  'background: transparent',
  'font-size: 58px',
  'line-height: 1',
  '.chart-ai-auth-gate-card {',
  'box-sizing: border-box',
  '.chart-ai-auth-gate-cta:focus-visible',
], 'Portfolio-aligned styling');

const gateStyleStart = ui.indexOf('.chart-ai-auth-gate {');
const gateStyleEnd = ui.indexOf('.chart-ai-auth-gate[hidden]', gateStyleStart);
const gateStyle = gateStyleStart >= 0 && gateStyleEnd > gateStyleStart ? ui.slice(gateStyleStart, gateStyleEnd) : '';
assertTrue(gateStyle.length > 0, 'Login-gate style block must be inspectable.');
assertTrue(!/linear-gradient/.test(gateStyle), 'Login gate must not retain the chart-grid gradient.');
assertTrue(!/background-size/.test(gateStyle), 'Login gate must not retain grid background sizing.');
assertTrue(!/min-height\s*:\s*430px/.test(gateStyle), 'Login gate must not retain the oversized chart-stage height.');
assertTrue(!/border-radius\s*:\s*16px/.test(gateStyle), 'Login gate must not retain the former outer shell radius.');

assertIncludesAll(ui, [
  "const chartAiMockLoggedOut = chartAiQuery.get('chartAiMockLoggedOut') === '1'",
  "const chartAiMockMaster = !chartAiMockLoggedOut && chartAiQuery.get('chartAiMockMaster') === '1'",
  'const mockedChartAiAccess',
  'canAccessChartAi: boolean',
  'canBypassAnalysisCooldown: boolean',
  'canRunSimilarPattern: boolean',
  'canRunMkAi: boolean',
  'canBypassAnalysisCooldown: chartAiMockMaster',
  'authGate.hidden = mockedChartAiAccess.capabilities.canAccessChartAi',
  'authBody.hidden = !mockedChartAiAccess.capabilities.canAccessChartAi',
  'const ANALYSIS_COOLDOWN_MS = 5 * 60 * 1000;',
  '다시 분석 가능까지',
  '05:00 후 다시 분석 가능',
  '마스터 권한으로 재분석 대기 시간이 적용되지 않습니다.',
  'mockedChartAiAccess.capabilities.canBypassAnalysisCooldown',
  "kind === 'mk-ai' && analysisStates['similar-pattern'] !== 'success'",
  'Duplicate and simultaneous run prevention',
  'id="chartAiOwnerLocalMockedPanel"',
  'id="chartAiOwnerLocalAuthUsageBridgePanel"',
  'mockedChartAiAccess.capabilities.canAccessChartAi && isLocalOwnerHostname() && ownerLocalMockedOptIn',
  'mockedChartAiAccess.capabilities.canAccessChartAi && isLocalOwnerHostname() && authUsageBridgeOptIn',
  "'idle'", "'login_required'", "'loading'", "'success'", "'usage_limited'", "'blocked'", "'error'",
], 'Phase 3FD-H behavior preservation');

assertIncludesAll(phaseHResult, [
  'Phase 3FD-H',
  'logged-out precedence',
  'Master cooldown bypass',
  'Owner-local panels remain available in authenticated mock modes',
], 'Phase 3FD-H baseline');

const resultFlat = result.replace(/\s+/g, ' ');
assertIncludesAll(resultFlat, [
  '## 1. Status',
  '## 2. Implemented Scope',
  '## 3. UX Result',
  '## 4. Boundary Preservation',
  '## 5. Validation',
  '## 6. Recommended Next Phase',
  '`/chart-ai` UI-only visual revision',
  'Portfolio source, route, server runtime',
  'No real auth was implemented',
  'no database was connected',
  'no Supabase client was created',
  'no environment value was read',
  'No API or LLM call or live KIS access occurred',
  'No raw master identifiers were committed',
  'single-card hierarchy',
  'desktop and mobile',
  'Default authenticated and master modes remain functionally unchanged',
  'Phase 3FD-H-MANUAL-RUN — Owner Browser QA for Chart AI Login Gate Visual Alignment',
  'Phase 3FD-H-HF2 — Login Gate Copy/Spacing Polish, Mocked-only UI Revision',
  'Phase 3FD-B-HF1 — Real Supabase Client Factory Approval Package, No Runtime Change',
], 'Result document');

const entryStart = changelog.indexOf('## Phase 3FD-H-HF1 - 2026-07-04');
const entryEnd = changelog.indexOf('## Phase 3FD-H - 2026-07-04');
const entry = entryStart >= 0 && entryEnd > entryStart ? changelog.slice(entryStart, entryEnd) : '';
assertTrue(entry.length > 0, 'Phase 3FD-H-HF1 changelog entry must be inspectable.');
assertIncludesAll(entry, [
  'Portfolio login-required pattern',
  'UI-only',
  'logged-out precedence',
  'no raw master identifiers committed',
  'Phase 3FD-H-MANUAL-RUN',
], 'Changelog entry');

const emailLiteralPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const uuidLiteralPattern = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
assertTrue(!emailLiteralPattern.test(result), 'Result must not contain an email address literal.');
assertTrue(!uuidLiteralPattern.test(result), 'Result must not contain a UUID literal.');
assertTrue(!emailLiteralPattern.test(checker), 'Checker must not contain an email address literal.');
assertTrue(!uuidLiteralPattern.test(checker), 'Checker must not contain a UUID literal.');
assertTrue(!emailLiteralPattern.test(entry), 'New changelog entry must not contain an email address literal.');
assertTrue(!uuidLiteralPattern.test(entry), 'New changelog entry must not contain a UUID literal.');
assertTrue(!emailLiteralPattern.test(ui), '/chart-ai must not contain an email address literal.');
assertTrue(!uuidLiteralPattern.test(ui), '/chart-ai must not contain a UUID literal.');

assertTrue(!/@supabase\//.test(ui), '/chart-ai must not import Supabase.');
assertTrue(!/createClient\s*\(/.test(ui), '/chart-ai must not create a client.');
assertTrue(!/process\.env(?:\.|\[)/.test(ui), '/chart-ai must not read process env.');
assertTrue(!/import\.meta\.env/.test(ui), '/chart-ai must not read import meta env.');
assertTrue(!/allowRouteSuccess\s*:\s*true/.test(ui), '/chart-ai must not activate route success.');
assertTrue(!/(?:stripe|paddle|adsbygoogle|googletag)/i.test(entry), 'Hotfix must not add payment or ad integration.');
assertTrue(!/\bfetch\s*\(/.test(gateStyle), 'Login-gate styling must not add a network call.');

assertTrue(assertionCount >= 95, `Checker must run at least 95 assertions; ran ${assertionCount}.`);
assertTrue(assertionCount <= 130, `Checker must run at most 130 assertions; ran ${assertionCount}.`);

if (failureCount > 0) {
  console.error(`Phase 3FD-H-HF1 check FAILED: ${failureCount}/${assertionCount} assertions failed.`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FD-H-HF1 check passed: ${assertionCount}/${assertionCount} assertions passed.`);
