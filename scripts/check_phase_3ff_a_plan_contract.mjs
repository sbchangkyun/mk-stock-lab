import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const BASELINE = 'bd8ebd3';
const SP_DOC = 'docs/planning/phase_3ff_a_plan_similar_pattern_agent_design_v0.1.md';
const MK_DOC = 'docs/planning/phase_3ff_a_plan_mk_agent_design_v0.1.md';
const RESULT_DOC = 'docs/planning/phase_3ff_a_plan_result_v0.1.md';
const HF1_RESULT = 'docs/planning/phase_3ff_a_plan_hf1_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const CHECKER = 'scripts/check_phase_3ff_a_plan_contract.mjs';
const PACKAGE_JSON = 'package.json';
const EVIDENCE_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_contract.mjs';
const EVIDENCE_HF1_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_hf1_contract.mjs';
const CLOSEOUT_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_contract.mjs';
const CLOSEOUT_HF1_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_hf1_contract.mjs';
const RETRY_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_retry_contract.mjs';
const QA_RUN_HF1_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_hf1_contract.mjs';
const QA_RUN_RESULT_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_result_contract.mjs';
const MANUAL_QA_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_result_contract.mjs';
const HANDOFF_CHECKER = 'scripts/check_phase_3fe_a_handoff_chart_ai_new_chat_package.mjs';
const PHASE_3FE_A_CHECKER = 'scripts/check_phase_3fe_a_kis_ohlc_provider_owner_local_integration_contract.mjs';
const PHASE_3FF_A_SP_A_RESULT = 'docs/planning/phase_3ff_a_sp_a_result_v0.1.md';
const PHASE_3FF_A_SP_A_CHECKER = 'scripts/check_phase_3ff_a_sp_a_contract.mjs';
const PHASE_3FF_A_SP_A_SMOKE = 'scripts/smoke_phase_3ff_a_sp_a_similar_pattern_agent_deterministic_fixture_engine.mjs';
const PHASE_3FF_A_SP_A_SOURCE = 'src/lib/server/chart-ai/similar-pattern-agent.mjs';
const PHASE_3FF_A_SP_A_FIXTURE = 'src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs';
const PHASE_3FF_A_MK_A_RESULT = 'docs/planning/phase_3ff_a_mk_a_result_v0.1.md';
const PHASE_3FF_A_MK_A_HF1_RESULT = 'docs/planning/phase_3ff_a_mk_a_hf1_result_v0.1.md';
const PHASE_3FF_A_MK_A_CHECKER = 'scripts/check_phase_3ff_a_mk_a_contract.mjs';
const PHASE_3FF_A_MK_A_SMOKE = 'scripts/smoke_phase_3ff_a_mk_a_deterministic_report_contract.mjs';
const PHASE_3FF_A_MK_A_SOURCE = 'src/lib/server/chart-ai/mk-agent.mjs';
const PHASE_3FF_A_MK_A_FIXTURE = 'src/lib/server/chart-ai/mk-agent.fixture.mjs';
const INCORRECT_STRATEGY_CHECKPOINT_LABEL = String.fromCodePoint(0xC0AC, 0xC804, 0x20, 0xCCB4, 0xD06C, 0xD3EC, 0xC778, 0xD2B8);
const CORRECT_STRATEGY_CHECKPOINT_LABEL = '전략 체크포인트';
// Phase 3FF-A-UI-B manual QA deliverables, tolerated here so this checker's
// git-diff scope check does not fail once UI-B's QA docs/checker exist.
const UI_B_CHECKLIST = 'docs/planning/phase_3ff_a_ui_b_manual_qa_checklist_v0.1.md';
const UI_B_RESULT = 'docs/planning/phase_3ff_a_ui_b_manual_qa_result_v0.1.md';
const UI_B_CHECKER = 'scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs';
// Phase 3FF-A-UI-A's own deliverables (the chart-ai.astro change itself was
// already tolerated below, but its result doc/checker/smoke script were not
// yet added to this scope check when they were created).
const UI_A_RESULT = 'docs/planning/phase_3ff_a_ui_a_result_v0.1.md';
const UI_A_CHECKER = 'scripts/check_phase_3ff_a_ui_a_contract.mjs';
const UI_A_SMOKE = 'scripts/smoke_phase_3ff_a_ui_a_owner_local_deterministic_agent_ui_wiring.mjs';
// Phase 3FF-A-MK-B's own deliverables, tolerated here so this checker's
// git-diff scope check does not fail once MK-B's hardening pass exists
// (MK-B further edits PHASE_3FF_A_MK_A_SOURCE/FIXTURE, already allowed below).
const MK_B_SMOKE = 'scripts/smoke_phase_3ff_a_mk_b_output_contract_hardening.mjs';
const MK_B_CHECKER = 'scripts/check_phase_3ff_a_mk_b_contract.mjs';
const MK_B_RESULT = 'docs/planning/phase_3ff_a_mk_b_result_v0.1.md';
// Phase 3FF-A-SP-B's own deliverables, tolerated here so this checker's
// git-diff scope check does not fail once SP-B's hardening pass exists
// (SP-B further edits PHASE_3FF_A_SP_A_SOURCE/FIXTURE, already allowed above).
const SP_B_SMOKE = 'scripts/smoke_phase_3ff_a_sp_b_output_contract_hardening.mjs';
const SP_B_CHECKER = 'scripts/check_phase_3ff_a_sp_b_contract.mjs';
const SP_B_RESULT = 'docs/planning/phase_3ff_a_sp_b_result_v0.1.md';
// Phase 3FF-A-MK-C's own deliverables, tolerated here so this checker's
// git-diff scope check does not fail once MK-C's SP-B contract consumption
// pass exists (MK-C further edits PHASE_3FF_A_MK_A_SOURCE/FIXTURE, already
// allowed above).
const MK_C_SMOKE = 'scripts/smoke_phase_3ff_a_mk_c_sp_b_contract_consumption.mjs';
const MK_C_CHECKER = 'scripts/check_phase_3ff_a_mk_c_contract.mjs';
const MK_C_RESULT = 'docs/planning/phase_3ff_a_mk_c_result_v0.1.md';
// Phase 3FG-E's own deliverables (owner-local Browser QA checklist/result
// docs and static checker for the 3FG-D static shell; no source or runtime
// change). Tolerated here so this checker's git-diff scope check does not
// fail once 3FG-E's documentation exists on top of this phase's baseline.
const PHASE_3FG_E_CHECKLIST = 'docs/planning/phase_3fg_e_owner_local_guarded_productization_static_shell_browser_qa_checklist_v0.1.md';
const PHASE_3FG_E_RESULT = 'docs/planning/phase_3fg_e_owner_local_guarded_productization_static_shell_browser_qa_result_v0.1.md';
const PHASE_3FG_E_CHECKER = 'scripts/check_phase_3fg_e_contract.mjs';
// Phase 3FG-D-HF1's own deliverables (the narrow, documented, approved
// hotfix that further modifies src/pages/chart-ai.astro, already tolerated
// above, to fix the hidden-by-default CSS defect found by 3FG-E's Browser
// QA), plus its own result doc and checker. Tolerated for the same reason.
const PHASE_3FG_D_HF1_RESULT = 'docs/planning/phase_3fg_d_hf1_static_shell_hidden_default_fix_result_v0.1.md';
const PHASE_3FG_D_HF1_CHECKER = 'scripts/check_phase_3fg_d_hf1_contract.mjs';

const allowedFiles = new Set([
  SP_DOC,
  MK_DOC,
  RESULT_DOC,
  HF1_RESULT,
  CHANGELOG,
  CHECKER,
  EVIDENCE_CHECKER,
  EVIDENCE_HF1_CHECKER,
  CLOSEOUT_CHECKER,
  CLOSEOUT_HF1_CHECKER,
  RETRY_CHECKER,
  QA_RUN_HF1_CHECKER,
  QA_RUN_RESULT_CHECKER,
  MANUAL_QA_CHECKER,
  HANDOFF_CHECKER,
  PHASE_3FE_A_CHECKER,
  PHASE_3FF_A_SP_A_RESULT,
  PHASE_3FF_A_SP_A_CHECKER,
  PHASE_3FF_A_SP_A_SMOKE,
  PHASE_3FF_A_SP_A_SOURCE,
  PHASE_3FF_A_SP_A_FIXTURE,
  PHASE_3FF_A_MK_A_RESULT,
  PHASE_3FF_A_MK_A_HF1_RESULT,
  PHASE_3FF_A_MK_A_CHECKER,
  PHASE_3FF_A_MK_A_SMOKE,
  PHASE_3FF_A_MK_A_SOURCE,
  PHASE_3FF_A_MK_A_FIXTURE,
  PACKAGE_JSON,
  'src/pages/chart-ai.astro',
  UI_B_CHECKLIST,
  UI_B_RESULT,
  UI_B_CHECKER,
  UI_A_RESULT,
  UI_A_CHECKER,
  UI_A_SMOKE,
  MK_B_SMOKE,
  MK_B_CHECKER,
  MK_B_RESULT,
  SP_B_SMOKE,
  SP_B_CHECKER,
  SP_B_RESULT,
  MK_C_SMOKE,
  MK_C_CHECKER,
  MK_C_RESULT,
  'docs/planning/phase_3ff_a_ui_c_manual_qa_checklist_v0.1.md',
  'docs/planning/phase_3ff_a_ui_c_manual_qa_result_v0.1.md',
  'scripts/check_phase_3ff_a_ui_c_manual_qa_contract.mjs',
  'scripts/check_phase_3fd_j_handoff_chart_ai_new_chat_package_contract.mjs',
  'scripts/check_phase_3ff_a_housekeeping_a_contract.mjs',
  'docs/planning/phase_3ff_a_housekeeping_a_result_v0.1.md',
  // Phase 3FF-A-HANDOFF-A's own deliverables, tolerated here so this
  // checker's git-diff scope check does not fail once the HANDOFF-A
  // documentation package exists on top of this phase's baseline.
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
  // Phase 3FG-A-PLAN and Phase 3FG-A's own deliverables, tolerated here so
  // this checker's git-diff scope check does not fail once those later
  // phases' planning docs, static checkers, scaffold module/fixture, and
  // smoke test exist on top of this phase's baseline.
  'docs/planning/phase_3fg_a_plan_guarded_productization_v0.1.md',
  'docs/planning/phase_3fg_a_plan_result_v0.1.md',
  'scripts/check_phase_3fg_a_plan_contract.mjs',
  'src/lib/server/chart-ai/guarded-productization-scaffold.mjs',
  'src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs',
  'scripts/smoke_phase_3fg_a_guarded_productization_scaffold_all_gates_off.mjs',
  'scripts/check_phase_3fg_a_contract.mjs',
  'docs/planning/phase_3fg_a_guarded_productization_scaffold_result_v0.1.md',
  // Phase 3FG-B's own deliverables (QA docs/checker only, no source change).
  'docs/planning/phase_3fg_b_owner_local_guarded_productization_qa_checklist_v0.1.md',
  'docs/planning/phase_3fg_b_owner_local_guarded_productization_qa_result_v0.1.md',
  'scripts/check_phase_3fg_b_contract.mjs',
  // Phase 3FG-C's own deliverables (UI readiness plan/result docs and static
  // checker; no runtime wiring). Tolerated here so this checker's git-diff
  // scope check does not fail once those files exist on top of this baseline.
  'docs/planning/phase_3fg_c_owner_local_guarded_productization_ui_readiness_plan_v0.1.md',
  'docs/planning/phase_3fg_c_owner_local_guarded_productization_ui_readiness_result_v0.1.md',
  'scripts/check_phase_3fg_c_contract.mjs',
  // Phase 3FG-D's own deliverables (owner-local static UI shell result doc,
  // smoke, and checker; the src/pages/chart-ai.astro change itself is already
  // tolerated above and in allowedCommittedRuntimeArtifacts below).
  'docs/planning/phase_3fg_d_owner_local_guarded_productization_ui_static_shell_result_v0.1.md',
  'scripts/smoke_phase_3fg_d_owner_local_guarded_productization_ui_static_shell.mjs',
  'scripts/check_phase_3fg_d_contract.mjs',
  PHASE_3FG_E_CHECKLIST,
  PHASE_3FG_E_RESULT,
  PHASE_3FG_E_CHECKER,
  PHASE_3FG_D_HF1_RESULT,
  PHASE_3FG_D_HF1_CHECKER,
  // Phase 3GG-A-PLAN (Live KIS/LLM approval & runtime binding plan,
  // planning-only) and Phase 3GG-B (Live KIS approval gate checklist,
  // owner-reviewable, no activation) add planning-only deliverables, no
  // source or runtime change. Tolerated here, not required, for the same
  // reason as the groups above; no protective assertion below is weakened.
  'docs/planning/phase_3gg_a_plan_live_kis_llm_approval_runtime_binding_v0.1.md',
  'docs/planning/phase_3gg_a_plan_result_v0.1.md',
  'scripts/check_phase_3gg_a_plan_contract.mjs',
  'docs/planning/phase_3gg_b_live_kis_approval_gate_checklist_v0.1.md',
  'docs/planning/phase_3gg_b_live_kis_approval_gate_checklist_result_v0.1.md',
  'scripts/check_phase_3gg_b_contract.mjs',
]);

const forbiddenPaths = [
  'src',
  'pages',
  'src/pages',
  'src/lib',
  'src/data',
  'components',
  'supabase',
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

for (const file of [SP_DOC, MK_DOC, RESULT_DOC, CHANGELOG, CHECKER, PACKAGE_JSON, EVIDENCE_CHECKER, EVIDENCE_HF1_CHECKER, CLOSEOUT_HF1_CHECKER]) {
  assert(exists(file), `${file} must exist.`);
}

const sp = exists(SP_DOC) ? read(SP_DOC) : '';
const mk = exists(MK_DOC) ? read(MK_DOC) : '';
const result = exists(RESULT_DOC) ? read(RESULT_DOC) : '';
const hf1 = exists(HF1_RESULT) ? read(HF1_RESULT) : '';
const changelog = exists(CHANGELOG) ? read(CHANGELOG) : '';
const checker = exists(CHECKER) ? read(CHECKER) : '';
const evidenceChecker = exists(EVIDENCE_CHECKER) ? read(EVIDENCE_CHECKER) : '';
const evidenceHf1Checker = exists(EVIDENCE_HF1_CHECKER) ? read(EVIDENCE_HF1_CHECKER) : '';
const closeoutHf1Checker = exists(CLOSEOUT_HF1_CHECKER) ? read(CLOSEOUT_HF1_CHECKER) : '';
const packageJson = exists(PACKAGE_JSON) ? JSON.parse(read(PACKAGE_JSON)) : {};

assert(packageJson.scripts?.['check:phase-3ff-a-plan'] === 'node scripts/check_phase_3ff_a_plan_contract.mjs', 'package.json must contain exact check:phase-3ff-a-plan script.');
assert(changelog.includes('## Phase 3FF-A-PLAN - 2026-07-08'), 'Changelog must include Phase 3FF-A-PLAN entry.');
assert(changelog.includes('### Similar Pattern Agent and MK Agent Contract Planning, No Runtime Change (Prepared)'), 'Changelog must include Phase 3FF-A-PLAN title.');

for (const token of [
  'Status: Prepared.',
  'Similar Pattern Agent',
  'same-symbol historical',
  '20 / 40 / 60',
  'Top 5',
  'log returns',
  'normalized path',
  'SimilarPatternAgentOutput',
  'raw KIS payload',
  'No buy/sell recommendation',
]) {
  assert(sp.includes(token), `Similar Pattern design doc must include: ${token}`);
}

for (const token of [
  'Status: Prepared.',
  'MK 에이전트',
  CORRECT_STRATEGY_CHECKPOINT_LABEL,
  'PC card',
  'mobile bottom sheet',
  '3 uses per account per day',
  'Similar Pattern Agent',
  'MkAgentInput',
  'MkAgentOutput',
  'containsBuySellRecommendation: false',
  'No live LLM call',
]) {
  assert(mk.includes(token), `MK Agent design doc must include: ${token}`);
}

for (const token of [
  'Status: Prepared.',
  'bd8ebd3',
  'No runtime source changed.',
  'No live KIS call occurred.',
  'No LLM call occurred.',
  'No deploy/push occurred.',
]) {
  assert(result.includes(token), `Result doc must include: ${token}`);
}

for (const token of [
  'MK Agent name: `MK 에이전트`',
  `Naming policy: use \`${CORRECT_STRATEGY_CHECKPOINT_LABEL}\``,
  'Support/resistance price levels are allowed as observation/checkpoints.',
  'Open beta free usage policy: 3 uses per account per day.',
  'Similar Pattern and MK Agent are separate agents connected through a sanitized contract.',
]) {
  assert(result.includes(token), `Result doc must reflect owner decision: ${token}`);
}

const changedFiles = runGit(['diff', '--name-only', BASELINE])
  .split(/\r?\n/)
  .filter(Boolean);
const statusChanged = runGit(['status', '--short'])
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => line.slice(3).trim())
  .filter((file) => allowedFiles.has(file));
const allChanged = [...new Set([...changedFiles, ...statusChanged])];
const unexpected = allChanged.filter((file) => !allowedFiles.has(file));
assert(unexpected.length === 0, `Only Phase 3FF-A-PLAN files may change. Unexpected: ${unexpected.join(', ')}`);
for (const file of [SP_DOC, MK_DOC, RESULT_DOC, CHANGELOG, CHECKER, PACKAGE_JSON]) {
  assert(allChanged.includes(file), `Changed files must include ${file}.`);
}
assert(evidenceChecker.includes('EVIDENCE_HF1_RESULT') && evidenceChecker.includes('EVIDENCE_HF1_CHECKER'), 'Evidence checker must tolerate its committed HF1 evidence files.');
assert(evidenceChecker.includes('PHASE_3FF_A_PLAN_MK_DOC') && evidenceChecker.includes('PHASE_3FF_A_PLAN_CHECKER'), 'Evidence checker must tolerate committed Phase 3FF-A planning files.');
assert(evidenceHf1Checker.includes('PHASE_3FF_A_PLAN_MK_DOC') && evidenceHf1Checker.includes('PHASE_3FF_A_PLAN_CHECKER'), 'Evidence HF1 checker must tolerate committed Phase 3FF-A planning files.');
assert(closeoutHf1Checker.includes('EVIDENCE_HF1_RESULT') && closeoutHf1Checker.includes('EVIDENCE_HF1_CHECKER'), 'Closeout HF1 checker must tolerate committed evidence HF1 files.');
assert(closeoutHf1Checker.includes('PHASE_3FF_A_PLAN_MK_DOC') && closeoutHf1Checker.includes('PHASE_3FF_A_PLAN_CHECKER'), 'Closeout HF1 checker must tolerate committed Phase 3FF-A planning files.');
if (allChanged.includes(HF1_RESULT)) {
  assert(hf1.includes('Implemented.'), 'HF1 result must record Implemented status.');
  assert(hf1.includes('Current baseline before HF1: `a2560eb`'), 'HF1 result must record baseline a2560eb.');
  assert(hf1.includes(`Correct owner-approved label: \`${CORRECT_STRATEGY_CHECKPOINT_LABEL}\``), 'HF1 result must record corrected owner-approved label.');
}

const allowedCommittedRuntimeArtifacts = new Set([
  PHASE_3FF_A_SP_A_SOURCE,
  PHASE_3FF_A_SP_A_FIXTURE,
  PHASE_3FF_A_MK_A_SOURCE,
  PHASE_3FF_A_MK_A_FIXTURE,
  'src/pages/chart-ai.astro',
  // Phase 3FG-A's guarded productization scaffold module/fixture, tolerated
  // here so this checker's forbidden-path diff does not fail once that
  // later phase's scaffold exists under src/lib on top of this baseline.
  'src/lib/server/chart-ai/guarded-productization-scaffold.mjs',
  'src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs',
]);
const forbiddenDiff = [
  ...runGit(['diff', '--name-only', BASELINE, 'HEAD', '--', ...forbiddenPaths]).split(/\r?\n/).filter(Boolean),
  ...runGit(['diff', '--name-only', '--', ...forbiddenPaths]).split(/\r?\n/).filter(Boolean),
  ...runGit(['diff', '--cached', '--name-only', '--', ...forbiddenPaths]).split(/\r?\n/).filter(Boolean),
].filter((file) => !allowedCommittedRuntimeArtifacts.has(file));
assert([...new Set(forbiddenDiff)].length === 0, 'Forbidden runtime/source/API/UI/provider/dependency/lockfile/env diff must be empty.');

const phasePlanChangelogEntry = changelog.match(/## Phase 3FF-A-PLAN - 2026-07-08[\s\S]*?(?=## Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-EVIDENCE-HF1 - 2026-07-08)/)?.[0] ?? '';
const combined = [sp, mk, result, changelog.split('## Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-EVIDENCE-HF1 - 2026-07-08')[0] ?? '', checker, evidenceChecker, evidenceHf1Checker, closeoutHf1Checker].join('\n');
const suspiciousSecretTokens = [
  'app' + 'secret',
  'access' + '_token',
  'service' + '_role',
  'OPENAI' + '_API' + '_KEY',
];
for (const forbidden of suspiciousSecretTokens) {
  assert(!combined.includes(forbidden), `New docs/checker must not include suspicious secret token: ${forbidden}`);
}
assert(!/KIS_APP_SECRET\s*[:=]\s*['"][^'"]+['"]/i.test(combined), 'New docs/checker must not include KIS_APP_SECRET value-like assignment.');
assert(!/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/.test(combined), 'New docs/checker must not include JWT-like long token patterns.');
assert(!/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(combined), 'New docs/checker must not include raw email literals.');
assert(!/\b(?:createClient|createServerClient)\s*\(/.test(combined), 'New docs/checker must not create Supabase clients.');
assert(!/\b(?:process\.env|import\.meta\.env)\b/.test(combined), 'New docs/checker must not read environment values.');

assert(!mk.includes('매매전략'), 'Legacy trading-strategy label must not appear in the MK Agent design doc.');
for (const [file, text] of [
  [MK_DOC, mk],
  [RESULT_DOC, result],
  [CHANGELOG, phasePlanChangelogEntry],
  [CHECKER, checker],
]) {
  assert(!text.includes(INCORRECT_STRATEGY_CHECKPOINT_LABEL), `${file} must not contain incorrect strategy checkpoint label.`);
  assert(text.includes(CORRECT_STRATEGY_CHECKPOINT_LABEL), `${file} must contain corrected strategy checkpoint label.`);
}
assert(mk.includes(CORRECT_STRATEGY_CHECKPOINT_LABEL), 'MK Agent design doc must include corrected strategy checkpoint label.');

const forbiddenSection = mk.match(/## 15\. Forbidden phrasing examples[\s\S]*?## 16\./)?.[0] ?? '';
for (const phrase of [
  '매수하세요.',
  '매도하세요.',
  '지금 진입하세요.',
  '목표가는 78,000원입니다.',
  '손절가는 70,000원입니다.',
  '강력 추천합니다.',
  '상승이 확정적입니다.',
]) {
  assert(forbiddenSection.includes(phrase), `Forbidden phrasing section must include: ${phrase}`);
  const outside = mk.replace(forbiddenSection, '');
  assert(!outside.includes(phrase), `Forbidden phrase must only appear in explicit forbidden-phrasing section: ${phrase}`);
}

for (const boundary of [
  'No runtime source changed.',
  'No API route changed.',
  'No UI implementation changed.',
  'No provider/helper source changed.',
  'No live KIS call occurred.',
  'No LLM call occurred.',
  'No MK AI route activation occurred.',
  'No Supabase client was created.',
  'No DB connection occurred.',
  'No env/session/JWT/cookie/header parsing occurred.',
  'No public/beta activation occurred.',
  'No dependency/lockfile change occurred.',
  'No deploy/push occurred.',
]) {
  assert(result.includes(boundary), `Result doc must preserve boundary: ${boundary}`);
}

console.log(
  failures.length
    ? `Phase 3FF-A-PLAN check FAILED: ${failures.length}/${assertions} assertions failed.`
    : `Phase 3FF-A-PLAN check passed: ${assertions}/${assertions} assertions passed.`,
);

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
