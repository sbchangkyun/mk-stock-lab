import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (file) => readFileSync(resolve(root, file), 'utf8');
const exists = (file) => existsSync(resolve(root, file));

let assertionCount = 0;
const failures = [];

const assert = (condition, message) => {
  assertionCount += 1;
  if (!condition) failures.push(message);
};

const includes = (text, needle) => text.includes(needle);
const assertIncludesAll = (content, needles, label) => {
  const missing = needles.filter((needle) => !includes(content, needle));
  assert(missing.length === 0, `${label} missing: ${missing.join(', ')}`);
};
const emailLiteral = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const uuidLiteral = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;

const handoffFiles = [
  'docs/handoff/chart-ai-new-chat/00_README_FIRST.md',
  'docs/handoff/chart-ai-new-chat/01_CURRENT_STATE.md',
  'docs/handoff/chart-ai-new-chat/02_COMPLETED_PHASE_HISTORY.md',
  'docs/handoff/chart-ai-new-chat/03_ARCHITECTURE_AND_GUARDS.md',
  'docs/handoff/chart-ai-new-chat/04_SHORTENED_ROADMAP.md',
  'docs/handoff/chart-ai-new-chat/05_NEXT_PHASE_3FE_A_BRIEF.md',
  'docs/handoff/chart-ai-new-chat/06_VALIDATION_COMMANDS.md',
  'docs/handoff/chart-ai-new-chat/07_NEW_CHAT_START_PROMPT.md',
  'docs/handoff/chart-ai-new-chat/handoff_manifest.json',
];

const requiredFiles = [
  ...handoffFiles,
  'docs/planning/phase_3fd_j_handoff_chart_ai_new_chat_package_result_v0.1.md',
  'scripts/check_phase_3fd_j_handoff_chart_ai_new_chat_package_contract.mjs',
  'docs/planning/planning_changelog.md',
  'package.json',
  'docs/planning/phase_3fd_j_similar_pattern_route_owner_local_activation_result_v0.1.md',
  'docs/planning/phase_3fd_i_real_auth_server_guard_foundation_all_gates_off_result_v0.1.md',
];

for (const file of requiredFiles) assert(exists(file), `Missing required file: ${file}`);

const readme = read('docs/handoff/chart-ai-new-chat/00_README_FIRST.md');
const current = read('docs/handoff/chart-ai-new-chat/01_CURRENT_STATE.md');
const history = read('docs/handoff/chart-ai-new-chat/02_COMPLETED_PHASE_HISTORY.md');
const architecture = read('docs/handoff/chart-ai-new-chat/03_ARCHITECTURE_AND_GUARDS.md');
const roadmap = read('docs/handoff/chart-ai-new-chat/04_SHORTENED_ROADMAP.md');
const nextBrief = read('docs/handoff/chart-ai-new-chat/05_NEXT_PHASE_3FE_A_BRIEF.md');
const validation = read('docs/handoff/chart-ai-new-chat/06_VALIDATION_COMMANDS.md');
const prompt = read('docs/handoff/chart-ai-new-chat/07_NEW_CHAT_START_PROMPT.md');
const manifestText = read('docs/handoff/chart-ai-new-chat/handoff_manifest.json');
const resultDoc = read('docs/planning/phase_3fd_j_handoff_chart_ai_new_chat_package_result_v0.1.md');
const changelog = read('docs/planning/planning_changelog.md');
const packageJson = JSON.parse(read('package.json'));
const phaseJ = read('docs/planning/phase_3fd_j_similar_pattern_route_owner_local_activation_result_v0.1.md');
const phaseI = read('docs/planning/phase_3fd_i_real_auth_server_guard_foundation_all_gates_off_result_v0.1.md');

let manifest;
try {
  manifest = JSON.parse(manifestText);
  assert(true, 'Manifest parses as JSON');
} catch {
  manifest = {};
  assert(false, 'Manifest must parse as JSON');
}

assert(manifest.project === 'mk-stock-lab', 'Manifest project mismatch');
assert(manifest.handoff_package === 'chart-ai-new-chat', 'Manifest package mismatch');
assert(manifest.branch === 'rebuild/phase-1-ia-shell', 'Manifest branch mismatch');
assert(manifest.latest_completed_phase === 'Phase 3FD-J', 'Manifest latest phase mismatch');
assert(manifest.latest_commit === '6a7a51d', 'Manifest latest commit mismatch');
assert(manifest.next_recommended_phase === 'Phase 3FE-A', 'Manifest next phase mismatch');
assert(manifest.shortened_roadmap_step === 3, 'Manifest roadmap step mismatch');

for (const key of [
  'public_activation_allowed',
  'beta_activation_allowed',
  'live_kis_allowed',
  'llm_allowed',
  'mk_ai_route_activation_allowed',
  'real_auth_runtime_allowed',
  'supabase_runtime_allowed',
  'database_persistence_allowed',
  'env_read_allowed',
  'session_jwt_parsing_allowed',
  'deploy_allowed',
  'push_allowed',
]) {
  assert(manifest[key] === false, `Manifest boundary must be false: ${key}`);
}

assert(Array.isArray(manifest.required_reading_order), 'Manifest reading order exists');
assert(manifest.required_reading_order.length >= 8, 'Manifest reading order is complete');
assert(Array.isArray(manifest.validation_commands), 'Manifest validation commands exist');
assert(manifest.validation_commands.includes('npm run check:phase-3fd-j-handoff-chart-ai-new-chat-package'), 'Manifest includes handoff checker command');

assertIncludesAll(readme, [
  'mk-stock-lab',
  'rebuild/phase-1-ia-shell',
  'Phase 3FD-J',
  '6a7a51d',
  'Phase 3FE-A',
  'Required Reading Order',
  'Source-of-Truth Priority',
  'Current Git HEAD and branch',
  'docs/handoff/chart-ai-new-chat/',
  'docs/planning/planning_changelog.md',
  'Phase result documents',
  'Actual source files',
  "Owner's latest instruction",
  'Do not infer completed work from the roadmap. Only treat a phase as completed if it is listed in CURRENT_STATE or COMPLETED_PHASE_HISTORY with a commit hash and validation result.',
  'The new chat must summarize the current state before writing any implementation prompt.',
], 'README');

assertIncludesAll(current, [
  'Repository path',
  'Latest completed phase: `Phase 3FD-J`',
  'Latest commit: `6a7a51d`',
  'Next recommended phase: `Phase 3FE-A',
  'Chart AI mocked UI is complete.',
  'Portfolio-aligned login gate is complete.',
  'Server-only guard foundation is complete.',
  'Owner-local Similar Pattern route-backed flow is complete.',
  'Default `/chart-ai` remains mocked unless the owner-local route query is used.',
  'MK AI remains mocked.',
  'KIS provider is not integrated.',
  'LLM is not integrated.',
  'Public/beta activation is not allowed.',
  'Real auth runtime is not active.',
  'Supabase/DB persistence is not active.',
], 'Current state');

for (const phase of [
  'Phase 3FD-G',
  'Phase 3FD-G-HF1',
  'Phase 3FD-H-PLAN',
  'Phase 3FD-H',
  'Phase 3FD-H-HF1',
  'Phase 3FD-I',
  'Phase 3FD-J',
]) {
  assert(includes(history, `## ${phase}`), `History missing ${phase}`);
}

for (const text of ['Commit:', 'Status:', 'Purpose:', 'Implemented scope:', 'Preserved boundaries:', 'Validation:', 'Recommended next phase at that time:']) {
  assert(includes(history, text), `History missing section field ${text}`);
}

for (const text of ['9c3106f', '943dafe', '89b4419', '3e7e6d1', '12cb432', 'a3f5024', '6a7a51d']) {
  assert(includes(history, text), `History missing confirmed commit ${text}`);
}

assertIncludesAll(architecture, [
  'UI Layer: `/chart-ai`',
  'API Route Layer: `/api/chart-ai/similarity`',
  'Server Guard Foundation',
  'Owner-local Similar Pattern Activation Helper',
  'Deterministic Synthetic Similarity Engine',
  'Mocked MK AI State',
  'Login Gate Behavior',
  'Cooldown Behavior',
  'Master Cooldown Bypass Policy',
  'Owner-local Route Opt-in',
  'Data Redaction Policy',
  'Raw Identity Protection Policy',
  'Explicitly Blocked',
  'Supabase client creation',
  'DB connection',
  'KIS live call before Phase 3FE-A approval',
  'LLM call before Phase 3FF-A approval',
  'Account, trading, order, or balance APIs',
], 'Architecture');

assertIncludesAll(roadmap, [
  'Phase 3FD-I — Real Auth + Server Guard Foundation — completed',
  'Phase 3FD-J — Similar Pattern Route Owner-local Activation — completed',
  'Phase 3FE-A — KIS OHLC Provider Owner-local Integration — next',
  'Phase 3FF-A — MK AI LLM Scaffold + Owner-local Activation — later',
  'Phase 3FG-A — Beta Release Gate Package — later',
  'Phase 3FG-B — Limited Beta Activation — later',
  'KIS and LLM must remain separate phases.',
  'The beta gate must remain separate from limited beta activation.',
  'Phase 3FE-A must not include MK AI or LLM.',
  'Completion criteria',
], 'Roadmap');

assertIncludesAll(nextBrief, [
  'Phase 3FE-A — KIS OHLC Provider Owner-local Integration',
  'current owner-local Similar Pattern route uses synthetic/sample data',
  'Add owner-local KIS OHLC provider integration',
  'No account API.',
  'No order API.',
  'No balance API.',
  'No trading API.',
  'No public/beta activation.',
  'No LLM.',
  'No MK AI.',
  'No raw KIS payload in UI or public response.',
  'No deploy/push.',
  'Environment credentials must not be printed.',
  '`.env` must not be inspected unless a future owner-approved phase explicitly allows it.',
], 'Next phase brief');

for (const command of [
  'git status --short',
  'git branch --show-current',
  'git rev-parse --short HEAD',
  'npm run check:phase-3fd-j-similar-pattern-route-owner-local-activation',
  'npm run smoke:phase-3fd-j-similar-pattern-route-owner-local-activation',
  'npm run check:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off',
  'npm run smoke:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off',
  'npm run check:phase-3fd-h-hf1-chart-ai-login-gate-visual-alignment',
  'npm run check:phase-3fd-h-chart-ai-login-gate-master-cooldown-exemption-mocked-ui',
  'npm run check:phase-3fd-e-guarded-route-runtime-composition-scaffold-all-gates-off',
  'npm run smoke:phase-3fd-e-guarded-route-runtime-composition-scaffold-all-gates-off',
  'npm run build',
  'git diff --check',
]) {
  assert(includes(validation, command), `Validation guide missing ${command}`);
}

for (const text of [
  'Do not implement immediately.',
  'summarize the current project state',
  'Identify the latest completed phase and latest commit.',
  'Confirm the next recommended phase.',
  'Restate hard blocked boundaries.',
  'Ask for owner confirmation before writing the Phase 3FE-A Codex prompt.',
  'Current state I understand',
  'Latest completed phase',
  'Next recommended phase',
  'Hard blocked boundaries',
  'Files I will treat as source of truth',
  'Items not confirmed',
  'Confirmation needed before Phase 3FE-A',
]) {
  assert(includes(prompt, text), `New chat prompt missing ${text}`);
}

assertIncludesAll(resultDoc, [
  '# Phase 3FD-J-HANDOFF — Chart AI New Chat Handoff Package Result',
  'documentation-only handoff package',
  'No source/runtime/UI/route/provider/data files',
  'No KIS, LLM, Supabase, database, environment',
  'No raw master identifiers',
  'Recommended:',
], 'Result doc');

// Historical stability: this entry is no longer near the top of the changelog
// because later phases are legitimately prepended above it. Locate the
// Phase 3FD-J-HANDOFF section by its own header and scope the checks to that
// section (header -> next `## Phase ` header), instead of assuming it stays in
// a fixed-size top-of-file slice.
const handoffEntryStart = changelog.indexOf('## Phase 3FD-J-HANDOFF - 2026-07-04');
const handoffNextHeader = changelog.indexOf('\n## Phase ', handoffEntryStart + 1);
const topEntry = handoffEntryStart >= 0
  ? changelog.slice(handoffEntryStart, handoffNextHeader > handoffEntryStart ? handoffNextHeader : undefined)
  : '';
assert(includes(topEntry, '## Phase 3FD-J-HANDOFF - 2026-07-04'), 'Changelog entry missing Phase 3FD-J-HANDOFF');
assert(includes(topEntry, 'Chart AI New Chat Handoff Package, No Runtime Change (Implemented)'), 'Changelog title missing');
assert(includes(topEntry, 'No source, route, UI, server runtime, provider, data, KIS, LLM, Supabase, database, environment, session/JWT, dependency, lockfile, deploy, or push changes occurred.'), 'Changelog no runtime statement missing');
assert(includes(topEntry, 'Phase 3FE-A — KIS OHLC Provider Owner-local Integration'), 'Changelog next phase missing');

assert(
  packageJson.scripts?.['check:phase-3fd-j-handoff-chart-ai-new-chat-package'] === 'node scripts/check_phase_3fd_j_handoff_chart_ai_new_chat_package_contract.mjs',
  'Package checker script mismatch',
);

assert(includes(phaseJ, 'Phase 3FD-J — Similar Pattern Route Owner-local Activation Result'), 'Phase J result source missing title');
assert(includes(phaseJ, 'Phase 3FE-A — KIS OHLC Provider Owner-local Integration'), 'Phase J result missing next phase');
assert(includes(phaseI, 'Phase 3FD-I — Real Auth and Server Guard Foundation'), 'Phase I result source missing title');
assert(includes(phaseI, 'all runtime gates off'), 'Phase I result missing all gates off statement');

for (const file of handoffFiles) {
  const content = read(file);
  assert(!emailLiteral.test(content) && !uuidLiteral.test(content), `Sensitive identifier-like literal found in ${file}`);
}

for (const [name, content] of [
  ['result doc', resultDoc],
  ['changelog top entry', topEntry],
]) {
  assert(!emailLiteral.test(content), `Email-like literal found in ${name}`);
  assert(!uuidLiteral.test(content), `UUID-like literal found in ${name}`);
}

const blockedClaims = [
  [/KIS (is|was) complete/i, 'KIS must not be claimed complete'],
  [/LLM (is|was) complete/i, 'LLM must not be claimed complete'],
  [/real auth (is|was) complete/i, 'Real auth must not be claimed complete'],
  [/Supabase (is|was) complete/i, 'Supabase must not be claimed complete'],
  [/beta (is|was) complete/i, 'Beta must not be claimed complete'],
  [/deploy(?:ed|ment) occurred/i, 'Deploy must not be claimed occurred'],
  [/push(?:ed)? occurred/i, 'Push must not be claimed occurred'],
];

for (const file of handoffFiles) {
  const content = read(file);
  const blockedFailures = blockedClaims
    .filter(([pattern]) => pattern.test(content))
    .map(([, message]) => message);
  assert(blockedFailures.length === 0, `Blocked completion/deploy claim in ${file}: ${blockedFailures.join(', ')}`);
}

for (const phrase of [
  'public_activation_allowed": false',
  'beta_activation_allowed": false',
  'live_kis_allowed": false',
  'llm_allowed": false',
  'real_auth_runtime_allowed": false',
  'supabase_runtime_allowed": false',
  'database_persistence_allowed": false',
  'env_read_allowed": false',
  'session_jwt_parsing_allowed": false',
  'deploy_allowed": false',
  'push_allowed": false',
]) {
  assert(includes(manifestText, phrase), `Manifest false boundary missing ${phrase}`);
}

assert(assertionCount >= 130, `Expected at least 130 assertions, got ${assertionCount}`);
assert(assertionCount <= 180, `Expected no more than 180 assertions, got ${assertionCount}`);

if (failures.length > 0) {
  console.error(`Phase 3FD-J-HANDOFF checker failed (${assertionCount} assertions).`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FD-J-HANDOFF checker passed (${assertionCount}/${assertionCount} assertions).`);
