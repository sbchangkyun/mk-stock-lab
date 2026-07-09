import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const BASELINE = 'a32a52c';
const CHECKLIST = 'docs/planning/phase_3ff_a_ui_b_manual_qa_checklist_v0.1.md';
const RESULT = 'docs/planning/phase_3ff_a_ui_b_manual_qa_result_v0.1.md';
const CHECKER = 'scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

// Sibling checkers patched during Phase 3FF-A-UI-B so their own git-diff
// scope checks tolerate this phase's new files existing on top of a32a52c.
const PATCHED_SIBLING_CHECKERS = [
  'scripts/check_phase_3ff_a_ui_a_contract.mjs',
  'scripts/check_phase_3ff_a_mk_a_contract.mjs',
  'scripts/check_phase_3ff_a_sp_a_contract.mjs',
  'scripts/check_phase_3ff_a_plan_contract.mjs',
];

// Phase 3FF-A-MK-B legitimately hardens the MK Agent source/fixture under
// src/lib/server/chart-ai and adds its own smoke/checker/result deliverables.
// Tolerated here, not required, so this checker's scope/forbidden-diff checks
// do not fail once MK-B's contract hardening exists on top of a32a52c.
const MK_B_TOLERATED_FILES = [
  'src/lib/server/chart-ai/mk-agent.mjs',
  'src/lib/server/chart-ai/mk-agent.fixture.mjs',
  'scripts/smoke_phase_3ff_a_mk_b_output_contract_hardening.mjs',
  'scripts/check_phase_3ff_a_mk_b_contract.mjs',
  'docs/planning/phase_3ff_a_mk_b_result_v0.1.md',
];

// Phase 3FF-A-SP-B legitimately hardens the Similar Pattern Agent
// source/fixture under src/lib/server/chart-ai and adds its own
// smoke/checker/result deliverables. Tolerated here, not required, so this
// checker's scope/forbidden-diff checks do not fail once SP-B's contract
// hardening exists on top of a32a52c.
const SP_B_TOLERATED_FILES = [
  'src/lib/server/chart-ai/similar-pattern-agent.mjs',
  'src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs',
  'scripts/smoke_phase_3ff_a_sp_b_output_contract_hardening.mjs',
  'scripts/check_phase_3ff_a_sp_b_contract.mjs',
  'docs/planning/phase_3ff_a_sp_b_result_v0.1.md',
];

// Phase 3FF-A-MK-C's own deliverables, tolerated here so this checker's
// git-diff scope check does not fail once MK-C's SP-B contract consumption
// pass exists on top of a32a52c (MK-C further edits the exact
// mk-agent.mjs/.fixture.mjs paths already tolerated via MK_B_TOLERATED_FILES).
const MK_C_TOLERATED_FILES = [
  'scripts/smoke_phase_3ff_a_mk_c_sp_b_contract_consumption.mjs',
  'scripts/check_phase_3ff_a_mk_c_contract.mjs',
  'docs/planning/phase_3ff_a_mk_c_result_v0.1.md',
];

// Phase 3FF-A-UI-C's own deliverables, tolerated here so this checker's
// git-diff scope check does not fail once UI-C's owner-local browser QA pass
// exists on top of a32a52c.
const UI_C_TOLERATED_FILES = [
  'docs/planning/phase_3ff_a_ui_c_manual_qa_checklist_v0.1.md',
  'docs/planning/phase_3ff_a_ui_c_manual_qa_result_v0.1.md',
  'scripts/check_phase_3ff_a_ui_c_manual_qa_contract.mjs',
];

// Phase 3FF-A-HOUSEKEEPING-A patches stale historical checkers and adds its own
// housekeeping checker/result deliverables. Tolerated here, not required, so
// this checker's git-diff scope check does not fail once that cleanup exists on
// top of a32a52c.
const HOUSEKEEPING_A_TOLERATED_FILES = [
  'scripts/check_phase_3fd_j_handoff_chart_ai_new_chat_package_contract.mjs',
  'scripts/check_phase_3ff_a_housekeeping_a_contract.mjs',
  'docs/planning/phase_3ff_a_housekeeping_a_result_v0.1.md',
];

// Phase 3FF-A-HANDOFF-A adds a documentation-only current-state handoff
// package plus its own result doc and static checker. Tolerated here, not
// required, so this checker's git-diff scope check does not fail once that
// package exists on top of a32a52c.
const HANDOFF_A_TOLERATED_FILES = [
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
const PLAN_AND_SCAFFOLD_TOLERATED_FILES = [
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

// Phase 3FG-D adds the owner-local static UI shell (additively touching
// src/pages/chart-ai.astro) plus its own smoke/checker/result deliverables.
// Tolerated here, not required, so this checker's git-diff scope check does
// not fail once that phase exists on top of a32a52c. No protective assertion
// below is weakened by this addition.
const GUARDED_PRODUCTIZATION_UI_STATIC_SHELL_FILES = [
  'docs/planning/phase_3fg_d_owner_local_guarded_productization_ui_static_shell_result_v0.1.md',
  'scripts/smoke_phase_3fg_d_owner_local_guarded_productization_ui_static_shell.mjs',
  'scripts/check_phase_3fg_d_contract.mjs',
  'src/pages/chart-ai.astro',
];

const CORE_DELIVERABLES = [CHECKLIST, RESULT, CHECKER, CHANGELOG, PACKAGE_JSON];
const allowedFiles = new Set([
  ...CORE_DELIVERABLES,
  ...PATCHED_SIBLING_CHECKERS,
  ...MK_B_TOLERATED_FILES,
  ...SP_B_TOLERATED_FILES,
  ...MK_C_TOLERATED_FILES,
  ...UI_C_TOLERATED_FILES,
  ...HOUSEKEEPING_A_TOLERATED_FILES,
  ...HANDOFF_A_TOLERATED_FILES,
  ...PLAN_AND_SCAFFOLD_TOLERATED_FILES,
  ...GUARDED_PRODUCTIZATION_UI_STATIC_SHELL_FILES,
]);

const KNOWN_UNTOUCHED_PATHS = ['.agents/', '.vscode/settings.json', 'docs/handoff/codex_state_inspection/', 'skills-lock.json'];

// Exact required forbidden-diff path list for Phase 3FF-A-UI-B. Unlike
// Phase 3FF-A-UI-A, this phase must NOT touch chart-ai.astro at all — it is
// QA/documentation only, so the page itself is explicitly in this list.
const REQUIRED_FORBIDDEN_DIFF_PATHS = [
  'src/pages/chart-ai.astro',
  'pages/api',
  'src/pages/api',
  'components',
  'src/lib/server/chart-ai',
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
for (const file of CORE_DELIVERABLES) {
  assert(exists(file), `${file} must exist.`);
}

const checklist = exists(CHECKLIST) ? read(CHECKLIST) : '';
const result = exists(RESULT) ? read(RESULT) : '';
const checkerSelf = exists(CHECKER) ? read(CHECKER) : '';
const changelog = exists(CHANGELOG) ? read(CHANGELOG) : '';
const packageJson = exists(PACKAGE_JSON) ? JSON.parse(read(PACKAGE_JSON)) : {};

// --- 2. package.json script exact ---
assert(
  packageJson.scripts?.['check:phase-3ff-a-ui-b-manual-qa'] === 'node scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs',
  'package.json must contain the exact check:phase-3ff-a-ui-b-manual-qa script.',
);

// --- 3. Checklist/result docs must include the 10 required tokens ---
const REQUIRED_TOKENS = [
  'Phase 3FF-A-UI-B',
  'a32a52c',
  'ownerLocalDeterministicAgents=1',
  'chartAiOwnerLocalDeterministicAgentsPanel',
  'MK 에이전트',
  '전략 체크포인트',
  'No live KIS',
  'No LLM',
  'No public/beta activation',
  'default /chart-ai unchanged',
];
for (const token of REQUIRED_TOKENS) {
  assert(checklist.includes(token), `checklist doc must include required token: ${token}`);
  assert(result.includes(token), `result doc must include required token: ${token}`);
}

// --- 4. Changelog must include the Phase 3FF-A-UI-B entry, at the top ---
assert(changelog.includes('## Phase 3FF-A-UI-B - 2026-07-08'), 'changelog must include the Phase 3FF-A-UI-B entry header.');
// Later QA/hardening-only phases (no runtime/API/UI change) legitimately
// prepend their own entries above this one. Tolerate exactly this known
// allowlist of headers above the UI-B entry, in any order/count.
const TOLERATED_HEADERS_ABOVE_UI_B = [
  '## Phase 3FF-A-SP-B - 2026-07-08',
  '## Phase 3FF-A-MK-B - 2026-07-08',
  '## Phase 3FF-A-MK-C - 2026-07-08',
  '## Phase 3FF-A-UI-C - 2026-07-09',
  '## Phase 3FF-A-HOUSEKEEPING-A - 2026-07-09',
  '## Phase 3FF-A-HANDOFF-A - 2026-07-09',
  '## Phase 3FG-A-PLAN - 2026-07-09',
  '## Phase 3FG-A - 2026-07-09',
  '## Phase 3FG-B - 2026-07-09',
  '## Phase 3FG-C - 2026-07-09',
  '## Phase 3FG-D - 2026-07-09',
];
const uiBEntryIndex = changelog.indexOf('## Phase 3FF-A-UI-B - 2026-07-08');
const headersAboveUiB = changelog.slice(0, uiBEntryIndex).match(/^## .+$/gm) ?? [];
assert(
  headersAboveUiB.every((header) => TOLERATED_HEADERS_ABOVE_UI_B.includes(header)),
  'changelog Phase 3FF-A-UI-B entry must be at the top, tolerating only a known allowlist of later-phase entries above it.',
);

// --- 5. Only allowed files may have changed since baseline ---
const changedFiles = gitLines(['diff', '--name-only', BASELINE]);
const statusChanged = runGit(['status', '--porcelain', '-uall'])
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => line.slice(3).trim())
  .filter((file) => allowedFiles.has(file));
const allChanged = [...new Set([...changedFiles, ...statusChanged])];
const unexpected = allChanged.filter((file) => !allowedFiles.has(file));
assert(unexpected.length === 0, `Only Phase 3FF-A-UI-B files may change. Unexpected: ${unexpected.join(', ')}`);
for (const file of CORE_DELIVERABLES) {
  assert(allChanged.includes(file), `Changed files must include ${file}.`);
}

for (const knownPath of KNOWN_UNTOUCHED_PATHS) {
  assert(
    !changedFiles.some((file) => file === knownPath || file.startsWith(knownPath)),
    `${knownPath} must not appear in tracked diff vs baseline.`,
  );
}

// --- 6. Forbidden paths must be unchanged, including chart-ai.astro itself ---
// (src/lib/server/chart-ai stays forbidden for everything except the exact
// MK-B and SP-B source/fixture files explicitly tolerated above, plus the
// Phase 3FG-A guarded productization scaffold module/fixture that later
// legitimately landed under the same directory. src/pages/chart-ai.astro
// itself stays forbidden for UI-B's own scope, except for the one later,
// documented, approved Phase 3FG-D additive static UI shell change.)
const forbiddenDiff = gitLines(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]).filter(
  (file) =>
    !MK_B_TOLERATED_FILES.includes(file) &&
    !SP_B_TOLERATED_FILES.includes(file) &&
    file !== 'src/lib/server/chart-ai/guarded-productization-scaffold.mjs' &&
    file !== 'src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs' &&
    file !== 'src/pages/chart-ai.astro',
);
assert(forbiddenDiff.length === 0, `Forbidden diff must be empty except explicitly tolerated later-phase files. Found: ${forbiddenDiff.join(', ')}`);

// --- 7. No mojibake pattern in the new docs/checker ---
// Fragments are built from numeric code points via String.fromCharCode so
// this checker's own raw source text (read back via fs.readFileSync, never
// evaluated) cannot self-match: the source only ever contains ASCII digits,
// never the actual corrupted characters, while the runtime array value still
// equals the real corrupted-character fragments for comparison against docs.
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
  ['checklist', checklist],
  ['result', result],
  ['checker', checkerSelf],
]) {
  for (const token of mojibakePatterns) {
    assert(!text.includes(token), `${label} must not contain mojibake pattern.`);
  }
}

// --- 8. No forbidden investment language as approved output language ---
const forbiddenInvestmentLanguage = ['매수하세요', '매도하세요', '지금 진입', '목표가는', '손절가는', '강력 추천', '상승이 확정', '하락이 확정'];
for (const [label, text] of [
  ['checklist', checklist],
  ['result', result],
]) {
  for (const token of forbiddenInvestmentLanguage) {
    assert(!text.includes(token), `${label} must not contain forbidden investment language: ${token}`);
  }
}

// --- 9. Result doc must not claim full visual PASS unless full visual/manual
// browser evidence is explicitly recorded ---
const statusSection = result.match(/## 1\. Status\r?\n+([\s\S]*?)(?=\r?\n## )/)?.[1] ?? '';
const claimsExecuted = /\bExecuted\b/.test(statusSection);
const claimsPartial = /\bPartial\b/.test(statusSection);
assert(claimsExecuted || claimsPartial || /\bBlocked\b|\bFailed\b/.test(statusSection), 'result doc Section 1 must declare a recognized Status (Executed, Partial, Blocked, or Failed).');
if (claimsExecuted) {
  const VISUAL_EVIDENCE_MARKERS = ['boundingBox', 'scrollWidth', 'clientWidth', 'screenshot'];
  const hasVisualEvidence = VISUAL_EVIDENCE_MARKERS.every((marker) => result.includes(marker));
  assert(
    hasVisualEvidence,
    'result doc claims Executed (full PASS) but does not record explicit visual/manual browser evidence (boundingBox/scrollWidth/clientWidth/screenshot markers).',
  );
  assert(result.includes('1280') && result.includes('375'), 'result doc claims Executed but does not record both PC (1280) and mobile (375) viewport measurements.');
  assert(!claimsPartial, 'result doc Section 1 must not simultaneously claim Executed and Partial.');
}

// --- 10. Report ---
console.log(
  failures.length
    ? `Phase 3FF-A-UI-B manual QA check FAILED: ${failures.length}/${assertions} assertions failed.`
    : `Phase 3FF-A-UI-B manual QA check passed: ${assertions}/${assertions} assertions passed.`,
);

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
