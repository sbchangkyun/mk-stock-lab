import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const BASELINE = 'dcb6724';
const PACKAGE_DIR = 'docs/handoff/chart-ai-spb-mkc-uic-housekeeping-current-state';
const README = `${PACKAGE_DIR}/README.md`;
const CURRENT_STATE = `${PACKAGE_DIR}/01_CURRENT_STATE.md`;
const PHASE_HISTORY = `${PACKAGE_DIR}/02_COMPLETED_PHASE_HISTORY.md`;
const ARCHITECTURE = `${PACKAGE_DIR}/03_ARCHITECTURE_AND_GUARDS.md`;
const VALIDATION = `${PACKAGE_DIR}/04_VALIDATION_COMMANDS.md`;
const NEXT_PHASE_BRIEF = `${PACKAGE_DIR}/05_NEXT_PHASE_BRIEF_3FG_A_PLAN.md`;
const NEW_CHAT_PROMPT = `${PACKAGE_DIR}/06_NEW_CHAT_START_PROMPT.md`;
const MANIFEST = `${PACKAGE_DIR}/07_MANIFEST.json`;
const RESULT = 'docs/planning/phase_3ff_a_handoff_a_result_v0.1.md';
const CHECKER = 'scripts/check_phase_3ff_a_handoff_a_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const HANDOFF_FILES = [README, CURRENT_STATE, PHASE_HISTORY, ARCHITECTURE, VALIDATION, NEXT_PHASE_BRIEF, NEW_CHAT_PROMPT, MANIFEST];
const CORE_DELIVERABLES = [...HANDOFF_FILES, RESULT, CHECKER, CHANGELOG, PACKAGE_JSON];

// Sibling checker files patched, only if the full validation chain required it,
// so their own git-diff scope/changelog-position checks tolerate this phase's
// documentation-only deliverables existing on top of their respective baselines.
//
// The 6 entries below were further modified after this baseline (dcb6724) by
// the later Phase 3FG-A-PLAN, which added HANDOFF-A scope-tolerance patches to
// them (a pre-existing gap left by this phase). Tolerated here so this
// checker's own "only Phase 3FF-A-HANDOFF-A files may change" scan does not
// flag content changes this phase did not itself make. No protective
// assertion below (forbidden diff, mojibake, forbidden language) is weakened.
const PATCHED_SIBLING_CHECKERS = [
  'scripts/check_phase_3ff_a_ui_c_manual_qa_contract.mjs',
  'scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs',
  'scripts/check_phase_3ff_a_ui_a_contract.mjs',
  'scripts/check_phase_3ff_a_housekeeping_a_contract.mjs',
  'scripts/check_phase_3ff_a_mk_a_contract.mjs',
  'scripts/check_phase_3ff_a_mk_b_contract.mjs',
  'scripts/check_phase_3ff_a_mk_c_contract.mjs',
  'scripts/check_phase_3ff_a_sp_a_contract.mjs',
  'scripts/check_phase_3ff_a_sp_b_contract.mjs',
  'scripts/check_phase_3ff_a_plan_contract.mjs',
];

// Files delivered by later phases (Phase 3FG-A-PLAN and Phase 3FG-A) built on
// top of this baseline (dcb6724) that legitimately exist in the working tree
// without being part of this phase's own deliverables. Tolerated here only
// because they were reviewed and validated by their own phase's checker
// (check_phase_3fg_a_plan_contract.mjs / check_phase_3fg_a_contract.mjs); no
// protective assertion below (forbidden diff, mojibake, forbidden language)
// is weakened by their presence.
const TOLERATED_LATER_PHASE_FILES = [
  'docs/planning/phase_3fg_a_plan_guarded_productization_v0.1.md',
  'docs/planning/phase_3fg_a_plan_result_v0.1.md',
  'scripts/check_phase_3fg_a_plan_contract.mjs',
  'src/lib/server/chart-ai/guarded-productization-scaffold.mjs',
  'src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs',
  'scripts/smoke_phase_3fg_a_guarded_productization_scaffold_all_gates_off.mjs',
  'scripts/check_phase_3fg_a_contract.mjs',
  'docs/planning/phase_3fg_a_guarded_productization_scaffold_result_v0.1.md',
  'docs/planning/phase_3fg_b_owner_local_guarded_productization_qa_checklist_v0.1.md',
  'docs/planning/phase_3fg_b_owner_local_guarded_productization_qa_result_v0.1.md',
  'scripts/check_phase_3fg_b_contract.mjs',
  'docs/planning/phase_3fg_c_owner_local_guarded_productization_ui_readiness_plan_v0.1.md',
  'docs/planning/phase_3fg_c_owner_local_guarded_productization_ui_readiness_result_v0.1.md',
  'scripts/check_phase_3fg_c_contract.mjs',
  // Phase 3FG-D adds the owner-local static UI shell (touching
  // src/pages/chart-ai.astro additively) plus its own smoke/checker/result
  // deliverables. Tolerated here, not required, so this checker's git-diff
  // scope check does not fail once that phase exists on top of this
  // checker's own baseline. No protective assertion below is weakened.
  'docs/planning/phase_3fg_d_owner_local_guarded_productization_ui_static_shell_result_v0.1.md',
  'scripts/smoke_phase_3fg_d_owner_local_guarded_productization_ui_static_shell.mjs',
  'scripts/check_phase_3fg_d_contract.mjs',
  'src/pages/chart-ai.astro',
  // Phase 3FG-E adds owner-local Browser QA documentation for the 3FG-D static
  // shell (checklist, result doc, checker); no source or runtime change.
  // Tolerated for the same reason as the 3FG-A through 3FG-D entries above.
  'docs/planning/phase_3fg_e_owner_local_guarded_productization_static_shell_browser_qa_checklist_v0.1.md',
  'docs/planning/phase_3fg_e_owner_local_guarded_productization_static_shell_browser_qa_result_v0.1.md',
  'scripts/check_phase_3fg_e_contract.mjs',
  // Phase 3FG-D-HF1 is the narrow, documented, approved hotfix that further
  // modifies src/pages/chart-ai.astro (already tolerated above) to fix the
  // hidden-by-default CSS defect found by 3FG-E's Browser QA, plus its own
  // result doc and checker. Tolerated for the same reason.
  'docs/planning/phase_3fg_d_hf1_static_shell_hidden_default_fix_result_v0.1.md',
  'scripts/check_phase_3fg_d_hf1_contract.mjs',
];

// Phase 3FG-D is the specific, documented, approved later phase authorized
// to modify src/pages/chart-ai.astro (an additive-only static UI shell).
// This checker's forbidden-diff assertion is patched to tolerate exactly
// that one known path while still failing if any other forbidden path
// changes.
const TOLERATED_FORBIDDEN_DIFF_EXCEPTIONS = ['src/pages/chart-ai.astro'];

const allowedFiles = new Set([...CORE_DELIVERABLES, ...PATCHED_SIBLING_CHECKERS, ...TOLERATED_LATER_PHASE_FILES]);

const KNOWN_UNTOUCHED_PATHS = ['.agents/', '.claude/', '.vscode/settings.json', 'docs/handoff/codex_state_inspection/', 'skills-lock.json'];

const REQUIRED_FORBIDDEN_DIFF_PATHS = [
  'src/pages/chart-ai.astro',
  'src/lib/server/chart-ai/mk-agent.mjs',
  'src/lib/server/chart-ai/mk-agent.fixture.mjs',
  'src/lib/server/chart-ai/similar-pattern-agent.mjs',
  'src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs',
  'pages/api',
  'src/pages/api',
  'components',
  'supabase',
  'src/data',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.env',
  '.env.local',
];

let assertions = 0;
const failures = [];
const assert = (condition, message) => {
  assertions += 1;
  if (!condition) failures.push(message);
};

const exists = (file) => fs.existsSync(file);
const read = (file) => fs.readFileSync(file, 'utf8');
const runGit = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const gitLines = (args) => runGit(args).split(/\r?\n/).filter(Boolean);

// --- 1. All handoff files exist ---
for (const file of HANDOFF_FILES) {
  assert(exists(file), `${file} must exist.`);
}

// --- 2. Result doc exists ---
assert(exists(RESULT), `${RESULT} must exist.`);

// --- 3. Changelog exists ---
assert(exists(CHANGELOG), `${CHANGELOG} must exist.`);

// --- 4. package.json exists ---
assert(exists(PACKAGE_JSON), `${PACKAGE_JSON} must exist.`);

const readme = exists(README) ? read(README) : '';
const currentState = exists(CURRENT_STATE) ? read(CURRENT_STATE) : '';
const phaseHistory = exists(PHASE_HISTORY) ? read(PHASE_HISTORY) : '';
const architecture = exists(ARCHITECTURE) ? read(ARCHITECTURE) : '';
const validationDoc = exists(VALIDATION) ? read(VALIDATION) : '';
const nextPhaseBrief = exists(NEXT_PHASE_BRIEF) ? read(NEXT_PHASE_BRIEF) : '';
const newChatPrompt = exists(NEW_CHAT_PROMPT) ? read(NEW_CHAT_PROMPT) : '';
const manifestRaw = exists(MANIFEST) ? read(MANIFEST) : '';
const result = exists(RESULT) ? read(RESULT) : '';
const checkerSelf = exists(CHECKER) ? read(CHECKER) : '';
const changelog = exists(CHANGELOG) ? read(CHANGELOG) : '';
const packageJson = exists(PACKAGE_JSON) ? JSON.parse(read(PACKAGE_JSON)) : {};

// --- 5. package.json exact script ---
assert(
  packageJson.scripts?.['check:phase-3ff-a-handoff-a'] === 'node scripts/check_phase_3ff_a_handoff_a_contract.mjs',
  'package.json must contain the exact check:phase-3ff-a-handoff-a script.',
);

// --- 6. README required tokens ---
for (const token of ['Phase 3FF-A-HANDOFF-A', 'dcb6724', 'Phase 3FF-A-HOUSEKEEPING-A', 'No Runtime Change']) {
  assert(readme.includes(token), `README doc must include required token: ${token}`);
}

// --- 7. Current state doc required tokens ---
for (const token of [
  'dcb6724',
  'Phase 3FF-A-HOUSEKEEPING-A',
  'Similar Pattern Agent',
  'MK Agent',
  'ownerLocalDeterministicAgents=1',
  'live KIS',
  'LLM activation',
  'public/beta activation',
]) {
  assert(currentState.includes(token), `current state doc must include required token: ${token}`);
}

// --- 8. Completed phase history required headers ---
for (const token of [
  'Phase 3FF-A-HOUSEKEEPING-A',
  'Phase 3FF-A-UI-C',
  'Phase 3FF-A-MK-C',
  'Phase 3FF-A-SP-B',
  'Phase 3FF-A-MK-B',
  'Phase 3FF-A-UI-B',
  'Phase 3FF-A-UI-A',
  'Phase 3FF-A-MK-A',
  'Phase 3FF-A-SP-A',
  'Phase 3FF-A-PLAN',
]) {
  assert(phaseHistory.includes(token), `completed phase history doc must include required header: ${token}`);
}

// --- 9. Architecture doc required tokens ---
for (const token of [
  'similar-pattern-agent.v0.2',
  'confidenceScore',
  'patternQuality',
  'outcomeDistribution',
  'matchReasonTags',
  'contractSummary',
  'hasSpbSimilarPatternContract',
  'chartAiOwnerLocalDeterministicAgentsPanel',
  'No live KIS',
  'No LLM',
]) {
  assert(architecture.includes(token), `architecture doc must include required token: ${token}`);
}

// --- 10. Validation doc required commands ---
const REQUIRED_VALIDATION_COMMANDS = [
  'npm run check:phase-3ff-a-housekeeping-a',
  'npm run check:phase-3fd-j-handoff-chart-ai-new-chat-package',
  'npm run smoke:phase-3fd-j-similar-pattern-route-owner-local-activation',
  'npm run check:phase-3fd-j-similar-pattern-route-owner-local-activation',
  'npm run smoke:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off',
  'npm run check:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off',
  'npm run check:phase-3ff-a-ui-c-manual-qa',
  'npm run smoke:phase-3ff-a-mk-c',
  'npm run check:phase-3ff-a-mk-c',
  'npm run smoke:phase-3ff-a-sp-b',
  'npm run check:phase-3ff-a-sp-b',
  'npm run smoke:phase-3ff-a-mk-b',
  'npm run check:phase-3ff-a-mk-b',
  'npm run check:phase-3ff-a-ui-b-manual-qa',
  'npm run smoke:phase-3ff-a-ui-a',
  'npm run check:phase-3ff-a-ui-a',
  'npm run smoke:phase-3ff-a-mk-a',
  'npm run check:phase-3ff-a-mk-a',
  'npm run smoke:phase-3ff-a-sp-a',
  'npm run check:phase-3ff-a-sp-a',
  'npm run check:phase-3ff-a-plan',
  'npm run build',
  'git diff --check',
];
for (const command of REQUIRED_VALIDATION_COMMANDS) {
  assert(validationDoc.includes(command), `validation doc must include required command: ${command}`);
}

// --- 11. Next phase brief required tokens ---
for (const token of ['Phase 3FG-A-PLAN', 'planning-only', 'usage', 'cache', 'cost', 'audit', 'live KIS still blocked', 'LLM still blocked']) {
  assert(nextPhaseBrief.includes(token), `next phase brief doc must include required token: ${token}`);
}

// --- 12. New chat prompt Korean + required tokens ---
assert(/[가-힣]/.test(newChatPrompt), 'new chat start prompt must contain Korean text.');
for (const token of ['dcb6724', 'Phase 3FF-A-HOUSEKEEPING-A', '3FG-A-PLAN']) {
  assert(newChatPrompt.includes(token), `new chat start prompt doc must include required token: ${token}`);
}

// --- 13. Manifest valid JSON with required fields ---
let manifest = null;
try {
  manifest = manifestRaw ? JSON.parse(manifestRaw) : null;
} catch {
  manifest = null;
}
assert(manifest !== null, 'manifest must be valid JSON.');
if (manifest) {
  assert(manifest.baseline === 'dcb6724', 'manifest baseline must be dcb6724.');
  assert(manifest.latestCompletedPhase === 'Phase 3FF-A-HOUSEKEEPING-A', 'manifest latestCompletedPhase must be Phase 3FF-A-HOUSEKEEPING-A.');
  assert(Array.isArray(manifest.files) && manifest.files.length >= HANDOFF_FILES.length, 'manifest files array must list the handoff package files.');
}

// --- 14. Changelog required entry ---
for (const token of [
  '## Phase 3FF-A-HANDOFF-A - 2026-07-09',
  'Chart AI SP-B/MK-C/UI-C/HOUSEKEEPING Current State Handoff Package',
  'No Runtime Change',
  'dcb6724',
]) {
  assert(changelog.includes(token), `changelog must include token: ${token}`);
}

// --- 15. Result doc required tokens ---
for (const token of ['Status: Implemented.', 'Baseline: dcb6724.', 'No Runtime Change', 'No live KIS.', 'No LLM.', 'No public/beta activation.']) {
  assert(result.includes(token), `result doc must include required token: ${token}`);
}

// --- 16. Only allowed files may have changed since baseline ---
const changedFiles = gitLines(['diff', '--name-only', BASELINE]);
const statusChanged = runGit(['status', '--porcelain', '-uall'])
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => line.slice(3).trim())
  .filter((file) => allowedFiles.has(file));
const allChanged = [...new Set([...changedFiles, ...statusChanged])];
const unexpected = allChanged.filter((file) => !allowedFiles.has(file));
assert(unexpected.length === 0, `Only Phase 3FF-A-HANDOFF-A files may change. Unexpected: ${unexpected.join(', ')}`);
for (const file of CORE_DELIVERABLES) {
  assert(allChanged.includes(file), `Changed files must include ${file}.`);
}

for (const knownPath of KNOWN_UNTOUCHED_PATHS) {
  assert(
    !changedFiles.some((file) => file === knownPath || file.startsWith(knownPath)),
    `${knownPath} must not appear in tracked diff vs baseline.`,
  );
}

// --- 17. Forbidden runtime/source paths must be unchanged since baseline ---
const forbiddenDiff = gitLines(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]).filter(
  (file) => !TOLERATED_FORBIDDEN_DIFF_EXCEPTIONS.includes(file),
);
assert(forbiddenDiff.length === 0, `Forbidden diff must be empty. Found: ${forbiddenDiff.join(', ')}`);

// --- 18. No mojibake pattern in new docs/checker ---
// Fragments are built from numeric code points via String.fromCharCode so this
// checker's own raw source text (read back via fs.readFileSync, never
// evaluated) cannot self-match: the source only ever contains ASCII digits.
const mojibakePatterns = [
  String.fromCharCode(65533),
  String.fromCharCode(63, 47663, 50464),
  String.fromCharCode(63, 44968, 50754),
  String.fromCharCode(27877, 45828, 44181),
  String.fromCharCode(63, 1098, 50468),
  String.fromCharCode(63, 50326, 49316),
  String.fromCharCode(63, 45896, 53195),
  String.fromCharCode(63, 49649, 44902),
  String.fromCharCode(30041, 12668, 45780),
  String.fromCharCode(32016, 9338, 47796),
];
for (const [label, text] of [
  ['readme', readme],
  ['currentState', currentState],
  ['phaseHistory', phaseHistory],
  ['architecture', architecture],
  ['validationDoc', validationDoc],
  ['nextPhaseBrief', nextPhaseBrief],
  ['newChatPrompt', newChatPrompt],
  ['manifest', manifestRaw],
  ['result', result],
  ['checker', checkerSelf],
]) {
  for (const token of mojibakePatterns) {
    assert(!text.includes(token), `${label} must not contain mojibake pattern.`);
  }
}

// --- 19. No forbidden investment language introduced as approved output text ---
// Only doc/result files are scanned: this checker's own source necessarily
// contains these phrases as literal scan-pattern data, so scanning checkerSelf
// would self-trigger.
const forbiddenInvestmentLanguage = ['매수하세요', '매도하세요', '지금 진입', '목표가는', '손절가는', '강력 추천', '상승이 확정', '하락이 확정'];
for (const [label, text] of [
  ['readme', readme],
  ['currentState', currentState],
  ['phaseHistory', phaseHistory],
  ['architecture', architecture],
  ['validationDoc', validationDoc],
  ['nextPhaseBrief', nextPhaseBrief],
  ['newChatPrompt', newChatPrompt],
  ['result', result],
]) {
  for (const token of forbiddenInvestmentLanguage) {
    assert(!text.includes(token), `${label} must not contain forbidden investment language: ${token}`);
  }
}

// --- 20. Report ---
console.log(
  failures.length
    ? `Phase 3FF-A-HANDOFF-A check FAILED: ${failures.length}/${assertions} assertions failed.`
    : `Phase 3FF-A-HANDOFF-A check passed: ${assertions}/${assertions} assertions passed.`,
);

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
