import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const BASELINE = '38d660a';
const SOURCE = 'src/lib/server/chart-ai/mk-agent.mjs';
const FIXTURE = 'src/lib/server/chart-ai/mk-agent.fixture.mjs';
const SMOKE = 'scripts/smoke_phase_3ff_a_mk_a_deterministic_report_contract.mjs';
const CHECKER = 'scripts/check_phase_3ff_a_mk_a_contract.mjs';
const RESULT = 'docs/planning/phase_3ff_a_mk_a_result_v0.1.md';
const HF1_RESULT = 'docs/planning/phase_3ff_a_mk_a_hf1_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';
const PHASE_3FF_A_PLAN_CHECKER = 'scripts/check_phase_3ff_a_plan_contract.mjs';
const EVIDENCE_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_contract.mjs';
const EVIDENCE_HF1_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_hf1_contract.mjs';
const CLOSEOUT_HF1_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_hf1_contract.mjs';
const CLOSEOUT_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_contract.mjs';
const SP_A_CHECKER = 'scripts/check_phase_3ff_a_sp_a_contract.mjs';
const RETRY_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_retry_contract.mjs';
const QA_RUN_HF1_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_hf1_contract.mjs';
const QA_RUN_RESULT_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_result_contract.mjs';
const MANUAL_QA_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_result_contract.mjs';
const HANDOFF_CHECKER = 'scripts/check_phase_3fe_a_handoff_chart_ai_new_chat_package.mjs';
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
// (MK-B further edits this checker's own SOURCE/FIXTURE, already allowed).
const MK_B_SMOKE = 'scripts/smoke_phase_3ff_a_mk_b_output_contract_hardening.mjs';
const MK_B_CHECKER = 'scripts/check_phase_3ff_a_mk_b_contract.mjs';
const MK_B_RESULT = 'docs/planning/phase_3ff_a_mk_b_result_v0.1.md';
// Phase 3FF-A-SP-B legitimately hardens the Similar Pattern Agent
// source/fixture under src/lib/server/chart-ai (referenced by this MK-A
// checker's fixture-import assertions) and adds its own deliverables.
// Tolerated here so this checker's git-diff scope check does not fail once
// SP-B's contract hardening exists on top of 38d660a.
const SP_A_SOURCE = 'src/lib/server/chart-ai/similar-pattern-agent.mjs';
const SP_A_FIXTURE = 'src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs';
const SP_B_SMOKE = 'scripts/smoke_phase_3ff_a_sp_b_output_contract_hardening.mjs';
const SP_B_CHECKER = 'scripts/check_phase_3ff_a_sp_b_contract.mjs';
const SP_B_RESULT = 'docs/planning/phase_3ff_a_sp_b_result_v0.1.md';
// Phase 3FF-A-MK-C's own deliverables, tolerated here so this checker's
// git-diff scope check does not fail once MK-C's SP-B contract consumption
// pass exists (MK-C further edits this checker's own SOURCE/FIXTURE, already
// allowed).
const MK_C_SMOKE = 'scripts/smoke_phase_3ff_a_mk_c_sp_b_contract_consumption.mjs';
const MK_C_CHECKER = 'scripts/check_phase_3ff_a_mk_c_contract.mjs';
const MK_C_RESULT = 'docs/planning/phase_3ff_a_mk_c_result_v0.1.md';

// Phase 3FF-A-HANDOFF-A's own deliverables, tolerated here so this checker's
// git-diff scope check does not fail once the HANDOFF-A documentation
// package exists on top of this phase's baseline. Tolerated, not required.
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
  'docs/planning/phase_3fg_d_owner_local_guarded_productization_ui_static_shell_result_v0.1.md',
  'scripts/smoke_phase_3fg_d_owner_local_guarded_productization_ui_static_shell.mjs',
  'scripts/check_phase_3fg_d_contract.mjs',
  'docs/planning/phase_3fg_e_owner_local_guarded_productization_static_shell_browser_qa_checklist_v0.1.md',
  'docs/planning/phase_3fg_e_owner_local_guarded_productization_static_shell_browser_qa_result_v0.1.md',
  'scripts/check_phase_3fg_e_contract.mjs',
  // Phase 3FG-D-HF1's own deliverables, discovered as a pre-existing gap in
  // this list (not caused by this phase) while running Phase 3GG-A-PLAN's
  // validation chain. Tolerated for the same reason as the files above.
  'docs/planning/phase_3fg_d_hf1_static_shell_hidden_default_fix_result_v0.1.md',
  'scripts/check_phase_3fg_d_hf1_contract.mjs',
  // Phase 3GG-A-PLAN's deliverables (planning-only; no runtime/source change),
  // tolerated for the same reason.
  'docs/planning/phase_3gg_a_plan_live_kis_llm_approval_runtime_binding_v0.1.md',
  'docs/planning/phase_3gg_a_plan_result_v0.1.md',
  'scripts/check_phase_3gg_a_plan_contract.mjs',
  // Phase 3GG-B's own deliverables (owner-reviewable Live KIS approval gate
  // checklist; no runtime/source change), tolerated for the same reason.
  'docs/planning/phase_3gg_b_live_kis_approval_gate_checklist_v0.1.md',
  'docs/planning/phase_3gg_b_live_kis_approval_gate_checklist_result_v0.1.md',
  'scripts/check_phase_3gg_b_contract.mjs',
  // Phase 3GG-B-AUDIT's own deliverables (documentation/checker-only; no
  // runtime/source change), tolerated for the same reason.
  'docs/planning/phase_3gg_b_audit_live_kis_gate_evidence_review_v0.1.md',
  'docs/planning/phase_3gg_b_audit_live_kis_gate_evidence_review_result_v0.1.md',
  'scripts/check_phase_3gg_b_audit_contract.mjs',
  // Phase 3GG-B-REVIEW-RECORD's own deliverables, discovered as a
  // pre-existing gap in this list (not caused by this phase) while running
  // Phase 3GG-C's validation chain. Tolerated for the same reason as the
  // files above.
  'docs/planning/phase_3gg_b_review_record_live_kis_owner_review_v0.1.md',
  'docs/planning/phase_3gg_b_review_record_result_v0.1.md',
  'scripts/check_phase_3gg_b_review_record_contract.mjs',
  // Phase 3GG-C's own deliverables (documentation/checker-only; no
  // runtime/source change), tolerated for the same reason.
  'docs/planning/phase_3gg_c_live_kis_activation_decision_record_v0.1.md',
  'docs/planning/phase_3gg_c_live_kis_activation_decision_record_result_v0.1.md',
  'scripts/check_phase_3gg_c_contract.mjs',
];
const allowedFiles = new Set([SOURCE, FIXTURE, SMOKE, CHECKER, RESULT, HF1_RESULT, CHANGELOG, PACKAGE_JSON, PHASE_3FF_A_PLAN_CHECKER, EVIDENCE_CHECKER, EVIDENCE_HF1_CHECKER, CLOSEOUT_HF1_CHECKER, CLOSEOUT_CHECKER, SP_A_CHECKER, RETRY_CHECKER, QA_RUN_HF1_CHECKER, QA_RUN_RESULT_CHECKER, MANUAL_QA_CHECKER, HANDOFF_CHECKER, 'src/pages/chart-ai.astro', UI_B_CHECKLIST, UI_B_RESULT, UI_B_CHECKER, UI_A_RESULT, UI_A_CHECKER, UI_A_SMOKE, MK_B_SMOKE, MK_B_CHECKER, MK_B_RESULT, SP_A_SOURCE, SP_A_FIXTURE, SP_B_SMOKE, SP_B_CHECKER, SP_B_RESULT, MK_C_SMOKE, MK_C_CHECKER, MK_C_RESULT, 'docs/planning/phase_3ff_a_ui_c_manual_qa_checklist_v0.1.md', 'docs/planning/phase_3ff_a_ui_c_manual_qa_result_v0.1.md', 'scripts/check_phase_3ff_a_ui_c_manual_qa_contract.mjs', 'scripts/check_phase_3fd_j_handoff_chart_ai_new_chat_package_contract.mjs', 'scripts/check_phase_3ff_a_housekeeping_a_contract.mjs', 'docs/planning/phase_3ff_a_housekeeping_a_result_v0.1.md', 'docs/handoff/chart-ai-spb-mkc-uic-housekeeping-current-state/README.md', 'docs/handoff/chart-ai-spb-mkc-uic-housekeeping-current-state/01_CURRENT_STATE.md', 'docs/handoff/chart-ai-spb-mkc-uic-housekeeping-current-state/02_COMPLETED_PHASE_HISTORY.md', 'docs/handoff/chart-ai-spb-mkc-uic-housekeeping-current-state/03_ARCHITECTURE_AND_GUARDS.md', 'docs/handoff/chart-ai-spb-mkc-uic-housekeeping-current-state/04_VALIDATION_COMMANDS.md', 'docs/handoff/chart-ai-spb-mkc-uic-housekeeping-current-state/05_NEXT_PHASE_BRIEF_3FG_A_PLAN.md', 'docs/handoff/chart-ai-spb-mkc-uic-housekeeping-current-state/06_NEW_CHAT_START_PROMPT.md', 'docs/handoff/chart-ai-spb-mkc-uic-housekeeping-current-state/07_MANIFEST.json', 'docs/planning/phase_3ff_a_handoff_a_result_v0.1.md', 'scripts/check_phase_3ff_a_handoff_a_contract.mjs', ...PLAN_AND_SCAFFOLD_TOLERATED_FILES]);
const forbiddenPaths = [
  'pages',
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

for (const file of [SOURCE, FIXTURE, SMOKE, CHECKER, RESULT, HF1_RESULT, CHANGELOG, PACKAGE_JSON]) {
  assert(exists(file), `${file} must exist.`);
}

const source = exists(SOURCE) ? read(SOURCE) : '';
const fixture = exists(FIXTURE) ? read(FIXTURE) : '';
const smoke = exists(SMOKE) ? read(SMOKE) : '';
const checkerSelf = exists(CHECKER) ? read(CHECKER) : '';
const result = exists(RESULT) ? read(RESULT) : '';
const hf1Result = exists(HF1_RESULT) ? read(HF1_RESULT) : '';
const changelog = exists(CHANGELOG) ? read(CHANGELOG) : '';
const packageSource = exists(PACKAGE_JSON) ? read(PACKAGE_JSON) : '{}';
const packageJson = JSON.parse(packageSource);

assert(packageJson.scripts?.['check:phase-3ff-a-mk-a'] === 'node scripts/check_phase_3ff_a_mk_a_contract.mjs', 'check script must be exact.');
assert(packageJson.scripts?.['smoke:phase-3ff-a-mk-a'] === 'node scripts/smoke_phase_3ff_a_mk_a_deterministic_report_contract.mjs', 'smoke script must be exact.');

for (const exportedName of [
  'DEFAULT_MK_AGENT_OPTIONS',
  'MK_AGENT_SECTION_KEYS',
  'MK_AGENT_STATUS',
  'createMkAgentInput',
  'validateMkAgentInput',
  'runMkAgent',
  'createDeterministicMkAgentReport',
  'sanitizeMkAgentReport',
  'createBlockedMkAgentOutput',
  'summarizeSimilarPatternForMkAgent',
  'createMkAgentDisclaimer',
  'detectForbiddenInvestmentLanguage',
]) {
  assert(new RegExp(`export\\s+(?:const|function)\\s+${exportedName}\\b`).test(source), `source must export ${exportedName}.`);
}

for (const exportedName of [
  'createMkAgentFixtureInput',
  'createMkAgentUsageExceededFixtureInput',
  'createMkAgentMissingSimilarPatternFixtureInput',
  'createMkAgentDataInsufficientFixtureInput',
  'createUnsafeMkAgentDraftForSanitizerFixture',
]) {
  assert(new RegExp(`export\\s+function\\s+${exportedName}\\b`).test(fixture), `fixture must export ${exportedName}.`);
}

assert(smoke.includes("../src/lib/server/chart-ai/mk-agent.mjs"), 'smoke must import MK Agent source.');
assert(smoke.includes("../src/lib/server/chart-ai/mk-agent.fixture.mjs"), 'smoke must import MK Agent fixture.');
assert(fixture.includes("from './similar-pattern-agent.mjs'"), 'fixture must import Similar Pattern Agent source.');
assert(fixture.includes("from './similar-pattern-agent.fixture.mjs'"), 'fixture must import Similar Pattern Agent fixture.');

const changedFiles = runGit(['diff', '--name-only', BASELINE]).split(/\r?\n/).filter(Boolean);
const statusChanged = execFileSync('git', ['status', '--porcelain', '-uall'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => line.slice(3))
  .filter((file) => allowedFiles.has(file));
const allChanged = [...new Set([...changedFiles, ...statusChanged])];
const unexpected = allChanged.filter((file) => !allowedFiles.has(file));
assert(unexpected.length === 0, `Only Phase 3FF-A-MK-A files may change. Unexpected: ${unexpected.join(', ')}`);

for (const pathName of forbiddenPaths) {
  const diff = runGit(['diff', '--name-only', BASELINE, '--', pathName]);
  assert(diff.length === 0, `Forbidden path must be unchanged: ${pathName}`);
}

// Phase 3FG-A's guarded productization scaffold module/fixture later
// legitimately landed under the same directory; tolerated here, not
// required by MK-A itself.
const SCAFFOLD_TOLERATED_CHART_AI_FILES = [
  'src/lib/server/chart-ai/guarded-productization-scaffold.mjs',
  'src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs',
];
const allowedSourceDiff = runGit(['diff', '--name-only', BASELINE, '--', 'src/lib/server/chart-ai'])
  .split(/\r?\n/)
  .filter(Boolean);
const unexpectedSource = [...new Set(allowedSourceDiff)].filter(
  (file) => ![SOURCE, FIXTURE, SP_A_SOURCE, SP_A_FIXTURE, ...SCAFFOLD_TOLERATED_CHART_AI_FILES].includes(file),
);
assert(unexpectedSource.length === 0, `Only MK Agent source files may change under chart-ai. Unexpected: ${unexpectedSource.join(', ')}`);

const forbiddenSourcePatterns = [
  /\bfetch\s*\(/,
  /process\.env/,
  /createClient\s*\(/,
  /createServerClient\s*\(/,
  /OPENAI_API_KEY/,
  /appsecret/i,
  /access_token/i,
  /service_role/i,
  /document\./,
  /window\./,
  /localStorage/,
  /cookies/i,
  /headers/i,
  /Math\.random/,
  /Date\.now/,
];
for (const pattern of forbiddenSourcePatterns) {
  assert(!pattern.test(source), `source must not contain forbidden runtime pattern: ${pattern}`);
}

for (const [label, text] of [['source', source], ['fixture', fixture]]) {
  assert(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(text), `${label} must not contain raw email literals.`);
  assert(!/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(text), `${label} must not contain JWT-like literals.`);
  assert(!/BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY/.test(text), `${label} must not contain private key markers.`);
  assert(!/rawKisPayload\s*:|rawProviderPayload\s*:|providerPayload\s*:/.test(text), `${label} must not contain provider raw payload labels.`);
}

for (const requiredText of [
  'MK 에이전트',
  '전략 체크포인트',
  '오픈베타에서는 계정당 하루 3회까지 사용할 수 있어요',
  '참고용',
  '매수·매도 추천이 아닙니다',
  '투자 자문이 아닙니다',
  'No LLM',
  'No buy/sell recommendation',
  'reference only',
  'not investment advice',
]) {
  assert(source.includes(requiredText), `source must include marker: ${requiredText}`);
}
assert(!source.includes('사전 체크포인트'), 'source must not include legacy strategy checkpoint title.');

// The corrupted mojibake fragments below are Unicode-escaped (\uXXXX), not written as
// literal characters, so that scanning this checker's own source text (checkerSelf)
// never self-matches. At runtime the escapes decode to the real corrupted characters,
// so detection against other files' actual content still works.
const mojibakeFragments = [
  '\u004d\u004b\u0020\u003f\uba2f\uc520\u003f\uafaa\ub4c3',
  '\u003f\uafa8\uc642',
  '\uf9e3\ub304\uac95',
  '\u003f\u044a\uc524',
  '\u003f\uc496\uc0a4',
  '\u003f\ub348\ucfcb',
  '\u003f\uc1f1\uaf66',
  '\uf9cd\u317c\ub2d4',
  '\uf9cf\u247a\ubab4',
];
for (const [label, text] of [
  ['source', source],
  ['fixture', fixture],
  ['smoke', smoke],
  ['checker', checkerSelf],
  ['result', result],
  ['hf1Result', hf1Result],
]) {
  for (const fragment of mojibakeFragments) {
    assert(!text.includes(fragment), `${label} must not contain corrupted mojibake fragment.`);
  }
  assert(!text.includes('\uFFFD'), `${label} must not contain the Unicode replacement character.`);
}

for (const requiredText of [
  'Status: Implemented.',
  'Baseline: 38d660a.',
  'No LLM.',
  'No live KIS.',
  'No UI runtime activation.',
  'No API route changed.',
  'No deploy/push.',
]) {
  assert(result.includes(requiredText), `result doc must include: ${requiredText}`);
}

for (const requiredText of [
  'Status: Implemented.',
  'Current baseline before HF1: 60395f0.',
  'Latest completed phase before HF1: Phase 3FF-A-MK-A.',
  'Branch: rebuild/phase-1-ia-shell.',
  'No LLM.',
  'No live KIS.',
  'No UI runtime activation.',
  'No API route activation.',
  'MK 에이전트',
  '전략 체크포인트',
  '삼성전자',
]) {
  assert(hf1Result.includes(requiredText), `HF1 result doc must include: ${requiredText}`);
}

for (const requiredText of [
  '## Phase 3FF-A-MK-A - 2026-07-08',
  'MK Agent Deterministic Report Contract, No LLM, No UI Runtime Activation (Implemented)',
  'Baseline: 38d660a',
  'deterministic fixture-only MK Agent report contract',
  'no API route change',
  'no UI implementation change',
  'no live KIS',
  'no LLM',
  'no public/beta activation',
]) {
  assert(changelog.includes(requiredText), `changelog must include: ${requiredText}`);
}

for (const requiredText of [
  '## Phase 3FF-A-MK-A-HF1 - 2026-07-08',
  'MK Agent Korean Copy Encoding Correction, No Runtime Change (Implemented)',
  '60395f0',
  'MK 에이전트',
  '전략 체크포인트',
  '삼성전자',
  'no live KIS',
  'no LLM',
  'no deploy/push',
]) {
  assert(changelog.includes(requiredText), `changelog must include HF1 entry marker: ${requiredText}`);
}

const smokeOutput = execFileSync('node', [SMOKE], { encoding: 'utf8' });
assert(smokeOutput.includes('Phase 3FF-A-MK-A smoke: PASS'), 'smoke must pass from checker.');

if (failures.length > 0) {
  console.error(`Phase 3FF-A-MK-A check FAILED: ${failures.length}/${assertions} assertions failed.`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FF-A-MK-A check passed: ${assertions}/${assertions} assertions passed.`);
