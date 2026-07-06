/** Narrow Phase 3FD-H-PLAN documentation-only design contract checker. */

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

const PLAN_PATH = 'docs/planning/phase_3fd_h_plan_chart_ai_login_gate_master_cooldown_exemption_design_v0.1.md';
const RESULT_PATH = 'docs/planning/phase_3fd_h_plan_chart_ai_login_gate_master_cooldown_exemption_design_result_v0.1.md';
const CHECKER_PATH = 'scripts/check_phase_3fd_h_plan_chart_ai_login_gate_master_cooldown_exemption_design_contract.mjs';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_PATH = 'package.json';
const BASELINE_RESULT_PATH = 'docs/planning/phase_3fd_g_hf1_analysis_trigger_cooldown_ux_mocked_only_result_v0.1.md';
const UI_PATH = 'src/pages/chart-ai.astro';
const PORTFOLIO_PATH = 'src/pages/portfolio.astro';

assertTrue(existsSync(path.join(repoRoot, CHECKER_PATH)), 'Checker script must exist.');
const plan = readSource(PLAN_PATH);
const result = readSource(RESULT_PATH);
const checker = readSource(CHECKER_PATH);
const changelog = readSource(CHANGELOG_PATH);
const packageSource = readSource(PACKAGE_PATH);
const baselineResult = readSource(BASELINE_RESULT_PATH);
const ui = readSource(UI_PATH);
const portfolio = readSource(PORTFOLIO_PATH);
const planFlat = plan.replace(/\s+/g, ' ');

assertTrue(plan.startsWith('# Phase 3FD-H-PLAN Chart AI Login Gate and Master Cooldown Exemption Design'), 'Plan title must be exact.');
assertTrue(result.startsWith('# Phase 3FD-H-PLAN — Chart AI Login Gate and Master Cooldown Exemption Design Result'), 'Result title must be exact.');
assertTrue(packageSource.includes('"check:phase-3fd-h-plan-chart-ai-login-gate-master-cooldown-exemption-design": "node scripts/check_phase_3fd_h_plan_chart_ai_login_gate_master_cooldown_exemption_design_contract.mjs"'), 'Package script must be exact.');
assertTrue(changelog.includes('## Phase 3FD-H-PLAN - 2026-07-04'), 'Changelog must contain Phase 3FD-H-PLAN.');
assertTrue(changelog.indexOf('## Phase 3FD-H-PLAN - 2026-07-04') < changelog.indexOf('## Phase 3FD-G-HF1 - 2026-07-04'), 'Phase 3FD-H-PLAN must be the top phase entry.');

assertIncludesAll(planFlat, [
  '## 1. Purpose',
  '## 2. Background',
  '## 3. Product Decisions',
  '## 4. Sensitive Identifier Policy',
  '## 5. Login Gate UX Model',
  '## 6. Portfolio Alignment',
  '## 7. Master Cooldown Exemption Policy',
  '## 8. Role and Capability Model',
  '## 9. Mocked-only Implementation Option',
  '## 10. Real-auth Implementation Option',
  '## 11. Server-side Protection Requirement',
  '## 12. Next Implementation Boundary',
  '## 13. Recommended Next Phase',
], 'Plan sections');

assertIncludesAll(planFlat, [
  'documentation-only design',
  'no UI source change',
  'route source change',
  'runtime source change',
  'auth implementation',
  'no Supabase client',
  'no database connection',
  'reads no environment',
  'cookie, header, session, or JWT',
  'executes no migration',
  'no KIS/LLM/API call',
  'dependency or lockfile change',
], 'Documentation-only boundary');

assertIncludesAll(planFlat, [
  '`/chart-ai` is accessible only to authenticated users',
  'Anonymous users see a login-required screen or card',
  'aligns with the existing Portfolio visual pattern',
  'Authenticated normal users retain the five-minute analysis cooldown',
  'Authenticated master users bypass the analysis cooldown',
  'server-side or trusted-runtime responsibility',
  'Do not commit a raw master email',
  'Do not commit a raw master UID',
  'Do not expose master identifiers in the client bundle',
  'Do not perform a client-side string comparison',
  '`MASTER_USER_ID`',
  '`MASTER_EMAIL`',
  '`isMasterUser`',
  '`serverResolvedMaster`',
  'client may receive only a safe boolean capability',
  'only variable names may be committed',
  'not include real identifiers',
  'user-editable profile metadata',
  'Hide Chart AI search, chart, sidebar, analysis workspace, and analysis buttons',
  'Do not execute analysis triggers or start cooldowns',
], 'Access and sensitive identifier policy');

assertIncludesAll(planFlat, [
  '`authState`: `anonymous` | `authenticated`',
  '`role`: `user` | `master`',
  '`capabilities.canAccessChartAi`',
  '`capabilities.canBypassAnalysisCooldown`',
  '`capabilities.canRunSimilarPattern`',
  '`capabilities.canRunMkAi`',
  '`cooldownPolicy.enabled`',
  '`cooldownPolicy.durationMs`',
  '`canAccessChartAi = false`',
  '`canBypassAnalysisCooldown = false`',
  '`canBypassAnalysisCooldown = true`',
  '`?chartAiMockLoggedOut=1`',
  '`?chartAiMockMaster=1`',
  'Default to an authenticated normal user',
  'Do not call Supabase',
  'This option is not approved in Phase 3FD-H-PLAN',
  'separate approval',
  'safe booleans or capabilities',
], 'Capability and implementation options');

assertIncludesAll(planFlat, [
  'Account-level server-side rate limits',
  'Function-level cooldowns',
  'Usage quotas',
  'Identical-request cache reuse',
  'Cost guards and hard caps',
  'Abuse detection',
  'Provider-failure and backoff handling',
  'Audit logging',
], 'Server-side protection requirements');

assertIncludesAll(result, [
  '## 1. Status',
  '## 2. Implemented Scope',
  '## 3. Design Result',
  '## 4. Boundary Preservation',
  '## 5. Validation',
  '## 6. Recommended Next Phase',
], 'Result sections');

const resultFlat = result.replace(/\s+/g, ' ');
assertIncludesAll(resultFlat, [
  'Prepared as documentation-only work',
  'No UI, route, runtime, or auth implementation source changed',
  'No Supabase client was created',
  'no database was connected',
  'no environment value was read',
  'No cookie, header, session, or JWT was parsed',
  'no KIS, LLM, or API call',
  'No raw master identifier was committed',
  '`/chart-ai` and `src/pages/portfolio.astro` are unchanged',
  'Phase 3FD-H — Chart AI Login Gate and Master Cooldown Exemption Mocked-only UI Implementation',
  'Phase 3FD-H-HF1 — Login Gate/Master Exemption Design Revisions, No Runtime Change',
  'Phase 3FD-B-HF1 — Real Supabase Client Factory Approval Package, No Runtime Change',
], 'Result contract');

assertIncludesAll(changelog, [
  'Chart AI Login Gate and Master Cooldown Exemption Design, No Runtime Change (Prepared)',
  'Raw master account identifiers are sensitive',
  'no raw master identifiers committed',
  'no `/chart-ai` source change',
  'real-auth future option requiring separate approval',
  'Phase 3FD-H — Chart AI Login Gate and Master Cooldown Exemption Mocked-only UI Implementation',
], 'Changelog contract');

assertTrue(baselineResult.includes('five-minute client-side cooldown'), 'Phase 3FD-G-HF1 baseline must mention the five-minute cooldown.');
assertTrue(ui.includes('const ANALYSIS_COOLDOWN_MS = 5 * 60 * 1000;'), '/chart-ai must retain the cooldown constant.');
assertTrue(ui.includes('data-chart-ai-cooldown="similar-pattern"'), '/chart-ai must retain the Similar Pattern cooldown marker.');
assertTrue(ui.includes('data-chart-ai-cooldown="mk-ai"'), '/chart-ai must retain the MK AI cooldown marker.');
assertTrue(portfolio.length > 0, 'Portfolio reference source must remain inspectable.');
assertTrue(plan.includes('`src/pages/portfolio.astro`'), 'Plan must identify the inspected Portfolio reference file.');

const emailLiteralPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const uuidLiteralPattern = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
assertTrue(!emailLiteralPattern.test(plan), 'Plan must not contain an email address literal.');
assertTrue(!emailLiteralPattern.test(result), 'Result must not contain an email address literal.');
assertTrue(!uuidLiteralPattern.test(plan), 'Plan must not contain a UUID literal.');
assertTrue(!uuidLiteralPattern.test(result), 'Result must not contain a UUID literal.');
assertTrue(!emailLiteralPattern.test(checker), 'Checker must not contain an email address literal.');
assertTrue(!uuidLiteralPattern.test(checker), 'Checker must not contain a UUID literal.');

assertTrue(!/createClient\s*\(/.test(plan + result), 'New docs must not prescribe client creation in this phase.');
assertTrue(!/process\.env(?:\.|\[)/.test(plan + result), 'New docs must not read process env.');
assertTrue(!/import\.meta\.env/.test(plan + result), 'New docs must not read import meta env.');
assertTrue(!/allowRouteSuccess\s*:\s*true/.test(plan + result), 'New docs must not activate route success.');
assertTrue(!/(?:stripe|paddle|adsbygoogle|googletag)/i.test(plan + result), 'New docs must not add payment or ad integration.');
assertTrue(!/\bfetch\s*\(/.test(plan + result), 'New docs must not add a network call.');
assertTrue(!/\b(?:SELECT|INSERT|UPDATE|DELETE|CREATE TABLE)\b/.test(plan + result), 'New docs must not add executable SQL.');

assertTrue(assertionCount >= 105, `Checker must run at least 105 assertions; ran ${assertionCount}.`);
assertTrue(assertionCount <= 135, `Checker must run at most 135 assertions; ran ${assertionCount}.`);

if (failureCount > 0) {
  console.error(`Phase 3FD-H-PLAN check FAILED: ${failureCount}/${assertionCount} assertions failed.`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FD-H-PLAN check passed: ${assertionCount}/${assertionCount} assertions passed.`);
