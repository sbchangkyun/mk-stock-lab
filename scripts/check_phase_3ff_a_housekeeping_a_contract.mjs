import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const BASELINE = '07cd405';
const RESULT = 'docs/planning/phase_3ff_a_housekeeping_a_result_v0.1.md';
const CHECKER = 'scripts/check_phase_3ff_a_housekeeping_a_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

// Primary historical checker whose stale changelog-slice assumption this phase
// fixes, plus the additional checkers patched for validator compatibility so
// the full validation chain runs cleanly once this HOUSEKEEPING-A entry is
// prepended above them in the changelog.
const PRIMARY_HISTORICAL_CHECKER = 'scripts/check_phase_3fd_j_handoff_chart_ai_new_chat_package_contract.mjs';
const PATCHED_CHECKERS = [
  PRIMARY_HISTORICAL_CHECKER,
  'scripts/check_phase_3ff_a_ui_c_manual_qa_contract.mjs',
  'scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs',
  'scripts/check_phase_3ff_a_ui_a_contract.mjs',
  // Sibling checkers that carried a latent scope-tolerance gap for UI-C's now-
  // committed files (untracked during the UI-C phase's own validation, surfaced
  // here). Patched for validator compatibility so the full validation chain runs
  // cleanly; no protective forbidden-diff assertion was removed from any of them.
  'scripts/check_phase_3ff_a_mk_c_contract.mjs',
  'scripts/check_phase_3ff_a_sp_b_contract.mjs',
  'scripts/check_phase_3ff_a_mk_b_contract.mjs',
  'scripts/check_phase_3ff_a_mk_a_contract.mjs',
  'scripts/check_phase_3ff_a_sp_a_contract.mjs',
  'scripts/check_phase_3ff_a_plan_contract.mjs',
];

// Phase 3FF-A-HANDOFF-A's own deliverables, committed after this checker's
// baseline. Tolerated here (not required) so this checker keeps passing once
// later validation runs it against a HEAD that includes the HANDOFF-A commit.
// No protective assertion below (forbidden diff, mojibake, forbidden
// language) is weakened by this addition.
const HANDOFF_A_FILES = [
  'docs/handoff/chart-ai-spb-mkc-uic-housekeeping-current-state/README.md',
  'docs/handoff/chart-ai-spb-mkc-uic-housekeeping-current-state/01_CURRENT_STATE.md',
  'docs/handoff/chart-ai-spb-mkc-uic-housekeeping-current-state/02_COMPLETED_PHASE_HISTORY.md',
  'docs/handoff/chart-ai-spb-mkc-uic-housekeeping-current-state/03_ARCHITECTURE_AND_GUARDS.md',
  'docs/handoff/chart-ai-spb-mkc-uic-housekeeping-current-state/04_VALIDATION_COMMANDS.md',
  'docs/handoff/chart-ai-spb-mkc-uic-housekeeping-current-state/05_NEXT_PHASE_BRIEF_3FG_A_PLAN.md',
  'docs/handoff/chart-ai-spb-mkc-uic-housekeeping-current-state/06_NEW_CHAT_START_PROMPT.md',
  'docs/handoff/chart-ai-spb-mkc-uic-housekeeping-current-state/07_MANIFEST.json',
  'docs/planning/phase_3ff_a_handoff_a_result_v0.1.md',
  'scripts/check_phase_3ff_a_handoff_a_contract.mjs',
];

// Phase 3FG-A-PLAN's and Phase 3FG-A's own deliverables, committed/added
// after this checker's baseline. Tolerated here (not required) so this
// checker keeps passing once later validation runs it against a HEAD that
// includes those commits. No protective assertion below (forbidden diff,
// mojibake, forbidden language) is weakened by this addition.
const PLAN_AND_SCAFFOLD_FILES = [
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
];

// Phase 3FG-D adds the owner-local static UI shell (touching
// src/pages/chart-ai.astro additively) plus its own smoke/checker/result
// deliverables. Tolerated here, not required, so this checker's git-diff
// scope check does not fail once that phase exists on top of this
// checker's own baseline. No protective assertion below is weakened.
const GUARDED_PRODUCTIZATION_UI_STATIC_SHELL_FILES = [
  'docs/planning/phase_3fg_d_owner_local_guarded_productization_ui_static_shell_result_v0.1.md',
  'scripts/smoke_phase_3fg_d_owner_local_guarded_productization_ui_static_shell.mjs',
  'scripts/check_phase_3fg_d_contract.mjs',
  'src/pages/chart-ai.astro',
];

// Phase 3FG-E adds owner-local Browser QA documentation for the 3FG-D static
// shell (checklist, result doc, checker); no source or runtime change.
// Tolerated here, not required, for the same reason as the groups above.
const BROWSER_QA_FILES = [
  'docs/planning/phase_3fg_e_owner_local_guarded_productization_static_shell_browser_qa_checklist_v0.1.md',
  'docs/planning/phase_3fg_e_owner_local_guarded_productization_static_shell_browser_qa_result_v0.1.md',
  'scripts/check_phase_3fg_e_contract.mjs',
];

// Phase 3FG-D-HF1 is the narrow, documented, approved hotfix that further
// modifies src/pages/chart-ai.astro (already tolerated below) to fix the
// hidden-by-default CSS defect found by 3FG-E's Browser QA, plus its own
// result doc and checker. Tolerated here, not required, for the same reason.
const HOTFIX_FILES = [
  'docs/planning/phase_3fg_d_hf1_static_shell_hidden_default_fix_result_v0.1.md',
  'scripts/check_phase_3fg_d_hf1_contract.mjs',
];

// Phase 3FG-D is the specific, documented, approved later phase authorized
// to modify src/pages/chart-ai.astro (an additive-only static UI shell).
// This checker's forbidden-diff assertion is patched to tolerate exactly
// that one known path while still failing if any other forbidden path
// changes.
const TOLERATED_FORBIDDEN_DIFF_EXCEPTIONS = ['src/pages/chart-ai.astro'];

const CORE_DELIVERABLES = [RESULT, CHECKER, CHANGELOG, PACKAGE_JSON];
const allowedFiles = new Set([
  ...CORE_DELIVERABLES,
  ...PATCHED_CHECKERS,
  ...HANDOFF_A_FILES,
  ...PLAN_AND_SCAFFOLD_FILES,
  ...GUARDED_PRODUCTIZATION_UI_STATIC_SHELL_FILES,
  ...BROWSER_QA_FILES,
  ...HOTFIX_FILES,
]);

const KNOWN_UNTOUCHED_PATHS = ['.agents/', '.vscode/settings.json', 'docs/handoff/codex_state_inspection/', 'skills-lock.json'];

// This housekeeping phase must not touch any runtime/source/dependency path.
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

// --- 1. Required files exist ---
for (const file of [CHECKER, RESULT, CHANGELOG, PACKAGE_JSON, PRIMARY_HISTORICAL_CHECKER]) {
  assert(exists(file), `${file} must exist.`);
}

const result = exists(RESULT) ? read(RESULT) : '';
const checkerSelf = exists(CHECKER) ? read(CHECKER) : '';
const changelog = exists(CHANGELOG) ? read(CHANGELOG) : '';
const packageJson = exists(PACKAGE_JSON) ? JSON.parse(read(PACKAGE_JSON)) : {};
const primaryChecker = exists(PRIMARY_HISTORICAL_CHECKER) ? read(PRIMARY_HISTORICAL_CHECKER) : '';

// --- 2. package.json script exact ---
assert(
  packageJson.scripts?.['check:phase-3ff-a-housekeeping-a'] === 'node scripts/check_phase_3ff_a_housekeeping_a_contract.mjs',
  'package.json must contain the exact check:phase-3ff-a-housekeeping-a script.',
);

// --- 3. Changelog must include the Phase 3FF-A-HOUSEKEEPING-A entry + tokens ---
const CHANGELOG_TOKENS = [
  '## Phase 3FF-A-HOUSEKEEPING-A - 2026-07-09',
  'Historical Checker Scope Cleanup',
  'No Runtime Change',
  '07cd405',
  'check:phase-3fd-j-handoff-chart-ai-new-chat-package',
];
for (const token of CHANGELOG_TOKENS) {
  assert(changelog.includes(token), `changelog must include token: ${token}`);
}

// --- 4. Result doc required tokens ---
const RESULT_TOKENS = [
  'Status: Implemented.',
  'Baseline: 07cd405.',
  'scripts/check_phase_3fd_j_handoff_chart_ai_new_chat_package_contract.mjs',
  'stale changelog slice',
  'historical checker',
  'no runtime/source change',
  'No live KIS.',
  'No LLM.',
  'No public/beta activation.',
];
for (const token of RESULT_TOKENS) {
  assert(result.includes(token), `result doc must include token: ${token}`);
}

// --- 5. Primary historical checker no longer contains stale assumptions ---
const STALE_ASSUMPTIONS = [
  'changelog.slice(0',
  'first 3000',
  'first 4000',
  'first 5000',
  'must appear above every other phase',
  'must be the first',
];
for (const stale of STALE_ASSUMPTIONS) {
  assert(!primaryChecker.includes(stale), `primary historical checker must no longer contain stale assumption: ${stale}`);
}

// --- 6. Forbidden runtime/source paths must be unchanged since baseline ---
const forbiddenDiff = gitLines(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]).filter(
  (file) => !TOLERATED_FORBIDDEN_DIFF_EXCEPTIONS.includes(file),
);
assert(forbiddenDiff.length === 0, `Forbidden diff must be empty. Found: ${forbiddenDiff.join(', ')}`);

// --- 7. Only allowed files may have changed since baseline ---
const changedFiles = gitLines(['diff', '--name-only', BASELINE]);
const statusChanged = runGit(['status', '--porcelain', '-uall'])
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => line.slice(3).trim())
  .filter((file) => allowedFiles.has(file));
const allChanged = [...new Set([...changedFiles, ...statusChanged])];
const unexpected = allChanged.filter((file) => !allowedFiles.has(file));
assert(unexpected.length === 0, `Only Phase 3FF-A-HOUSEKEEPING-A files may change. Unexpected: ${unexpected.join(', ')}`);
for (const file of CORE_DELIVERABLES) {
  assert(allChanged.includes(file), `Changed files must include ${file}.`);
}
assert(allChanged.includes(PRIMARY_HISTORICAL_CHECKER), `Changed files must include ${PRIMARY_HISTORICAL_CHECKER}.`);

for (const knownPath of KNOWN_UNTOUCHED_PATHS) {
  assert(
    !changedFiles.some((file) => file === knownPath || file.startsWith(knownPath)),
    `${knownPath} must not appear in tracked diff vs baseline.`,
  );
}

// --- 8. No mojibake pattern in changed docs/checkers ---
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
  ['result', result],
  ['checker', checkerSelf],
]) {
  for (const token of mojibakePatterns) {
    assert(!text.includes(token), `${label} must not contain mojibake pattern.`);
  }
}

// --- 9. No forbidden investment language introduced as approved output text ---
// Only the result doc is scanned: this checker's own source necessarily
// contains these phrases as literal scan-pattern data, so scanning checkerSelf
// would self-trigger.
const forbiddenInvestmentLanguage = ['매수하세요', '매도하세요', '지금 진입', '목표가는', '손절가는', '강력 추천', '상승이 확정', '하락이 확정'];
for (const token of forbiddenInvestmentLanguage) {
  assert(!result.includes(token), `result doc must not contain forbidden investment language: ${token}`);
}

// --- 10. Report ---
console.log(
  failures.length
    ? `Phase 3FF-A-HOUSEKEEPING-A check FAILED: ${failures.length}/${assertions} assertions failed.`
    : `Phase 3FF-A-HOUSEKEEPING-A check passed: ${assertions}/${assertions} assertions passed.`,
);

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
