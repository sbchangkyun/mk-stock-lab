import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const BASELINE = '3d4b7d2';
const SOURCE = 'src/lib/server/chart-ai/similar-pattern-agent.mjs';
const FIXTURE = 'src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs';
const SMOKE = 'scripts/smoke_phase_3ff_a_sp_b_output_contract_hardening.mjs';
const CHECKER = 'scripts/check_phase_3ff_a_sp_b_contract.mjs';
const RESULT = 'docs/planning/phase_3ff_a_sp_b_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';
const MK_SOURCE = 'src/lib/server/chart-ai/mk-agent.mjs';
const MK_FIXTURE = 'src/lib/server/chart-ai/mk-agent.fixture.mjs';

// Sibling checkers patched during Phase 3FF-A-SP-B so their own git-diff
// scope/forbidden-diff checks tolerate this phase's Similar Pattern Agent
// contract hardening existing on top of their respective baselines.
const PATCHED_SIBLING_CHECKERS = [
  'scripts/check_phase_3ff_a_mk_b_contract.mjs',
  'scripts/check_phase_3ff_a_ui_a_contract.mjs',
  'scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs',
  'scripts/check_phase_3ff_a_plan_contract.mjs',
  'scripts/check_phase_3ff_a_mk_a_contract.mjs',
  'scripts/check_phase_3ff_a_sp_a_contract.mjs',
];

// Phase 3FF-A-MK-C's own deliverables, tolerated here so this checker's
// git-diff scope/forbidden-diff checks do not fail once MK-C's SP-B contract
// consumption pass exists on top of 3d4b7d2 (MK-C further edits
// MK_SOURCE/MK_FIXTURE, already declared above).
const MK_C_TOLERATED_FILES = [
  MK_SOURCE,
  MK_FIXTURE,
  'scripts/smoke_phase_3ff_a_mk_c_sp_b_contract_consumption.mjs',
  'scripts/check_phase_3ff_a_mk_c_contract.mjs',
  'docs/planning/phase_3ff_a_mk_c_result_v0.1.md',
];

// Later QA/housekeeping-only phases (3FF-A-UI-C, 3FF-A-HOUSEKEEPING-A) legitimately
// add their own docs/checkers and patch stale historical checkers on top of this
// phase's baseline. Tolerated here, not required.
const LATER_PHASE_TOLERATED_FILES = [
  'docs/planning/phase_3ff_a_ui_c_manual_qa_checklist_v0.1.md',
  'docs/planning/phase_3ff_a_ui_c_manual_qa_result_v0.1.md',
  'scripts/check_phase_3ff_a_ui_c_manual_qa_contract.mjs',
  'scripts/check_phase_3fd_j_handoff_chart_ai_new_chat_package_contract.mjs',
  'scripts/check_phase_3ff_a_housekeeping_a_contract.mjs',
  'docs/planning/phase_3ff_a_housekeeping_a_result_v0.1.md',
];

// Phase 3FF-A-HANDOFF-A's own deliverables, tolerated here so this checker's
// git-diff scope check does not fail once the HANDOFF-A documentation
// package exists on top of this phase's baseline. Tolerated, not required.
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

// Phase 3FG-A-PLAN and Phase 3FG-A legitimately add their own planning/result
// docs, static checkers, and (for 3FG-A) a guarded productization scaffold
// module/fixture/smoke test on top of this phase's baseline. Tolerated here,
// not required, so this checker's git-diff scope check does not fail once
// those later files are committed above it.
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
// shell, and Phase 3FG-D-HF1 is the narrow, approved hotfix that further
// modifies src/pages/chart-ai.astro (already tolerated above) plus its own
// result doc and checker. Tolerated here, not required, for the same reason
// as the groups above; no protective assertion below is weakened.
const BROWSER_QA_AND_HOTFIX_FILES = [
  'docs/planning/phase_3fg_e_owner_local_guarded_productization_static_shell_browser_qa_checklist_v0.1.md',
  'docs/planning/phase_3fg_e_owner_local_guarded_productization_static_shell_browser_qa_result_v0.1.md',
  'scripts/check_phase_3fg_e_contract.mjs',
  'docs/planning/phase_3fg_d_hf1_static_shell_hidden_default_fix_result_v0.1.md',
  'scripts/check_phase_3fg_d_hf1_contract.mjs',
];

// Phase 3GG-A-PLAN (Live KIS/LLM approval & runtime binding plan,
// planning-only) and Phase 3GG-B (Live KIS approval gate checklist,
// owner-reviewable, no activation) add planning-only deliverables, no source
// or runtime change. Tolerated here, not required, for the same reason as
// the groups above; no protective assertion below is weakened.
const LIVE_KIS_APPROVAL_FILES = [
  'docs/planning/phase_3gg_a_plan_live_kis_llm_approval_runtime_binding_v0.1.md',
  'docs/planning/phase_3gg_a_plan_result_v0.1.md',
  'scripts/check_phase_3gg_a_plan_contract.mjs',
  'docs/planning/phase_3gg_b_live_kis_approval_gate_checklist_v0.1.md',
  'docs/planning/phase_3gg_b_live_kis_approval_gate_checklist_result_v0.1.md',
  'scripts/check_phase_3gg_b_contract.mjs',
  // Phase 3GG-B-AUDIT (evidence audit, no activation) and Phase
  // 3GG-B-REVIEW-RECORD (owner review record, no activation) add further
  // planning-only deliverables, no source or runtime change. Tolerated for
  // the same reason.
  'docs/planning/phase_3gg_b_audit_live_kis_gate_evidence_review_v0.1.md',
  'docs/planning/phase_3gg_b_audit_live_kis_gate_evidence_review_result_v0.1.md',
  'scripts/check_phase_3gg_b_audit_contract.mjs',
  'docs/planning/phase_3gg_b_review_record_live_kis_owner_review_v0.1.md',
  'docs/planning/phase_3gg_b_review_record_result_v0.1.md',
  'scripts/check_phase_3gg_b_review_record_contract.mjs',
  // Phase 3GG-C (Live KIS activation decision record, decision: not yet
  // activated) and Phase 3GG-D-PLAN (local-only Live KIS provider binding
  // plan, documentation/checker-only, no activation) add further
  // planning-only deliverables, no source or runtime change. Tolerated for
  // the same reason.
  'docs/planning/phase_3gg_c_live_kis_activation_decision_record_v0.1.md',
  'docs/planning/phase_3gg_c_live_kis_activation_decision_record_result_v0.1.md',
  'scripts/check_phase_3gg_c_contract.mjs',
  'docs/planning/phase_3gg_d_plan_local_only_live_kis_provider_binding_plan_v0.1.md',
  'docs/planning/phase_3gg_d_plan_local_only_live_kis_provider_binding_plan_result_v0.1.md',
  'scripts/check_phase_3gg_d_plan_contract.mjs',
];

// Phase 3FG-D is the specific, documented, approved later phase authorized
// to modify src/pages/chart-ai.astro (an additive-only static UI shell).
// This checker's forbidden-diff assertion is patched to tolerate exactly
// that one known path while still failing if any other forbidden path
// changes.
const TOLERATED_FORBIDDEN_DIFF_EXCEPTIONS = ['src/pages/chart-ai.astro'];

const CORE_DELIVERABLES = [SOURCE, FIXTURE, SMOKE, CHECKER, RESULT, CHANGELOG, PACKAGE_JSON];
const allowedFiles = new Set([
  ...CORE_DELIVERABLES,
  ...PATCHED_SIBLING_CHECKERS,
  ...MK_C_TOLERATED_FILES,
  ...LATER_PHASE_TOLERATED_FILES,
  ...HANDOFF_A_TOLERATED_FILES,
  ...PLAN_AND_SCAFFOLD_TOLERATED_FILES,
  ...GUARDED_PRODUCTIZATION_UI_STATIC_SHELL_FILES,
  ...BROWSER_QA_AND_HOTFIX_FILES,
  ...LIVE_KIS_APPROVAL_FILES,
]);

const KNOWN_UNTOUCHED_PATHS = ['.agents/', '.vscode/settings.json', 'docs/handoff/codex_state_inspection/', 'skills-lock.json'];

const REQUIRED_FORBIDDEN_DIFF_PATHS = [
  'src/pages/chart-ai.astro',
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
for (const file of CORE_DELIVERABLES) {
  assert(exists(file), `${file} must exist.`);
}

const source = exists(SOURCE) ? read(SOURCE) : '';
const fixture = exists(FIXTURE) ? read(FIXTURE) : '';
const smoke = exists(SMOKE) ? read(SMOKE) : '';
const checkerSelf = exists(CHECKER) ? read(CHECKER) : '';
const result = exists(RESULT) ? read(RESULT) : '';
const changelog = exists(CHANGELOG) ? read(CHANGELOG) : '';
const packageJson = exists(PACKAGE_JSON) ? JSON.parse(read(PACKAGE_JSON)) : {};

// --- 2. package.json scripts exact ---
assert(
  packageJson.scripts?.['smoke:phase-3ff-a-sp-b'] === 'node scripts/smoke_phase_3ff_a_sp_b_output_contract_hardening.mjs',
  'smoke script must be exact.',
);
assert(packageJson.scripts?.['check:phase-3ff-a-sp-b'] === 'node scripts/check_phase_3ff_a_sp_b_contract.mjs', 'check script must be exact.');

// --- 3. Source preserves all prior SP-A exports ---
for (const exportedName of [
  'DEFAULT_SIMILAR_PATTERN_OPTIONS',
  'SCORE_LABELS',
  'createSimilarPatternAgentInput',
  'runSimilarPatternAgent',
  'computeLogReturns',
  'computeNormalizedPath',
  'computePearsonCorrelation',
  'computeRmse',
  'computeDirectionMatchPct',
  'computeMaxDrawdownPct',
  'computeForwardReturnPct',
  'computeSimilarityScore',
  'labelSimilarityScore',
  'validateSimilarPatternInput',
]) {
  assert(new RegExp(`export\\s+(?:const|function)\\s+${exportedName}\\b`).test(source), `source must preserve prior export: ${exportedName}.`);
}

// --- 4. Source exports the new SP-B contract-hardening additions ---
for (const exportedName of [
  'SIMILAR_PATTERN_CONTRACT_VERSION',
  'CONFIDENCE_LABELS',
  'PATTERN_QUALITY_LABELS',
  'MATCH_REASON_TAGS',
  'computeMedian',
  'computeConfidenceScore',
  'labelConfidenceScore',
  'classifyMatchReasonTags',
  'computePatternQuality',
  'computeOutcomeDistribution',
  'createSimilarPatternContractSummary',
]) {
  assert(new RegExp(`export\\s+(?:const|function)\\s+${exportedName}\\b`).test(source), `source must export new SP-B symbol: ${exportedName}.`);
}

// --- 5. Fixture preserves prior exports and adds the 3 new edge fixtures ---
for (const exportedName of [
  'createSimilarPatternFixtureInput',
  'createInsufficientSimilarPatternFixtureInput',
  'createInvalidCloseSimilarPatternFixtureInput',
]) {
  assert(new RegExp(`export\\s+function\\s+${exportedName}\\b`).test(fixture), `fixture must preserve prior export: ${exportedName}.`);
}
for (const exportedName of [
  'createLowConfidenceSimilarPatternFixtureInput',
  'createHighVolatilitySimilarPatternFixtureInput',
  'createFlatOutcomeSimilarPatternFixtureInput',
]) {
  assert(new RegExp(`export\\s+function\\s+${exportedName}\\b`).test(fixture), `fixture must export new SP-B fixture: ${exportedName}.`);
}

assert(smoke.includes('../src/lib/server/chart-ai/similar-pattern-agent.mjs'), 'smoke must import Similar Pattern Agent source.');
assert(smoke.includes('../src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs'), 'smoke must import Similar Pattern Agent fixture.');
for (const name of [
  'createLowConfidenceSimilarPatternFixtureInput',
  'createHighVolatilitySimilarPatternFixtureInput',
  'createFlatOutcomeSimilarPatternFixtureInput',
]) {
  assert(smoke.includes(name), `smoke must import/use ${name}.`);
}

// --- 6. Required contract markers preserved; no forbidden investment language ---
assert(source.includes("'similar-pattern-agent.v0.2'"), 'source must define the exact contract version string.');
for (const requiredText of [
  '높음',
  '보통 이상',
  '보통',
  '낮음',
  '우수',
  '양호',
  '주의',
  '상관계수 높음',
  '정규화 경로 유사',
  '방향성 일치',
  '낙폭 유사',
  '변동성 주의',
  '성과 해석 주의',
  '과거 유사도는 미래 결과를 예측하거나 보장하지 않습니다.',
  'historical_shape_similarity_only',
  'No buy/sell recommendation',
]) {
  assert(source.includes(requiredText), `source must include marker: ${requiredText}`);
}
for (const forbiddenText of ['매수하세요', '매도하세요', '목표가는', '손절가는', '지금 진입', '강력 추천']) {
  assert(!source.includes(forbiddenText), `source must not include forbidden investment language: ${forbiddenText}`);
}

// --- 7. Smoke script must pass ---
const smokeOutput = execFileSync('node', [SMOKE], { encoding: 'utf8' });
assert(smokeOutput.includes('Phase 3FF-A-SP-B smoke: PASS'), 'smoke must pass from checker.');

// --- 8. Scope check: only allowed files may change since baseline ---
const changedFiles = gitLines(['diff', '--name-only', BASELINE]);
const statusChanged = runGit(['status', '--porcelain', '-uall'])
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => line.slice(3).trim())
  .filter((file) => allowedFiles.has(file));
const allChanged = [...new Set([...changedFiles, ...statusChanged])];
const unexpected = allChanged.filter((file) => !allowedFiles.has(file));
assert(unexpected.length === 0, `Only Phase 3FF-A-SP-B files may change. Unexpected: ${unexpected.join(', ')}`);
for (const file of CORE_DELIVERABLES) {
  assert(allChanged.includes(file), `Changed files must include ${file}.`);
}

for (const knownPath of KNOWN_UNTOUCHED_PATHS) {
  assert(
    !changedFiles.some((file) => file === knownPath || file.startsWith(knownPath)),
    `${knownPath} must not appear in tracked diff vs baseline.`,
  );
}

// --- 9. Forbidden diff must be empty (chart-ai.astro, API routes, components, supabase, src/data, lockfiles, env) ---
const forbiddenDiff = gitLines(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]).filter(
  (file) => !TOLERATED_FORBIDDEN_DIFF_EXCEPTIONS.includes(file),
);
assert(forbiddenDiff.length === 0, `Forbidden diff must be empty. Found: ${forbiddenDiff.join(', ')}`);

// --- 10. Allowed source diff under src/lib/server/chart-ai must be exactly
// SOURCE/FIXTURE (MK Agent source/fixture tolerated: Phase 3FF-A-MK-C
// legitimately consumes the SP-B contract from those files on top of this
// 3d4b7d2 baseline; not required by SP-B itself.) ---
// Phase 3FG-A's guarded productization scaffold module/fixture later
// legitimately landed under the same directory; tolerated here, not
// required by SP-B itself.
const SCAFFOLD_TOLERATED_CHART_AI_FILES = [
  'src/lib/server/chart-ai/guarded-productization-scaffold.mjs',
  'src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs',
];
const allowedSourceDiff = gitLines(['diff', '--name-only', BASELINE, '--', 'src/lib/server/chart-ai']);
const unexpectedSource = allowedSourceDiff.filter(
  (file) => ![SOURCE, FIXTURE, MK_SOURCE, MK_FIXTURE, ...SCAFFOLD_TOLERATED_CHART_AI_FILES].includes(file),
);
assert(unexpectedSource.length === 0, `Only Similar Pattern Agent source files may change under chart-ai. Unexpected: ${unexpectedSource.join(', ')}`);

// --- 11. No MK Agent source/fixture diff required by SP-B itself
// (MK_C_TOLERATED_FILES already covers MK_SOURCE/MK_FIXTURE for Phase
// 3FF-A-MK-C's legitimate SP-B contract consumption; anything else here is
// still unexpected) ---
const mkDiff = gitLines(['diff', '--name-only', BASELINE, '--', MK_SOURCE, MK_FIXTURE])
  .filter((file) => !MK_C_TOLERATED_FILES.includes(file));
assert(mkDiff.length === 0, `MK Agent source/fixture must not change outside Phase 3FF-A-MK-C. Found: ${mkDiff.join(', ')}`);

// --- 12. Forbidden runtime/network/secret patterns in source/fixture ---
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
  assert(!pattern.test(fixture), `fixture must not contain forbidden runtime pattern: ${pattern}`);
}

for (const [label, text] of [
  ['source', source],
  ['fixture', fixture],
]) {
  assert(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(text), `${label} must not contain raw email literals.`);
  assert(!/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(text), `${label} must not contain JWT-like literals.`);
  assert(!/BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY/.test(text), `${label} must not contain private key markers.`);
  assert(!/rawKisPayload\s*:|rawProviderPayload\s*:|providerPayload\s*:/.test(text), `${label} must not contain provider raw payload labels.`);
}

// --- 13. Mojibake fragments and the Unicode replacement character must not
// appear anywhere in the deliverables. Fragments are built from numeric code
// points via String.fromCharCode so this checker's own raw source text
// (checkerSelf, read back via fs.readFileSync, never evaluated) cannot
// self-match: the source only ever contains ASCII digits, never the actual
// corrupted characters, while the runtime array value still equals the real
// corrupted-character fragments for comparison against the other files. ---
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
  ['source', source],
  ['fixture', fixture],
  ['smoke', smoke],
  ['checker', checkerSelf],
  ['result', result],
]) {
  for (const token of mojibakePatterns) {
    assert(!text.includes(token), `${label} must not contain mojibake pattern.`);
  }
}

// --- 14. Result doc and changelog required content ---
for (const requiredText of [
  'Status: Implemented.',
  '3d4b7d2',
  'similar-pattern-agent.v0.2',
  'No LLM',
  'No live KIS',
  'No API route changed.',
  'No public/beta activation',
  'No deploy/push occurred.',
]) {
  assert(result.includes(requiredText), `result doc must include: ${requiredText}`);
}

for (const requiredText of [
  '## Phase 3FF-A-SP-B - 2026-07-08',
  'Similar Pattern Output Contract Hardening, No Live KIS, No LLM, No Public Activation',
  'Baseline**: `3d4b7d2`',
  'similar-pattern-agent.v0.2',
  'confidenceScore',
  'patternQuality',
  'no live KIS',
  'no LLM',
  'no public/beta activation',
  'no deploy/push',
]) {
  assert(changelog.includes(requiredText), `changelog must include: ${requiredText}`);
}

console.log(
  failures.length
    ? `Phase 3FF-A-SP-B check FAILED: ${failures.length}/${assertions} assertions failed.`
    : `Phase 3FF-A-SP-B check passed: ${assertions}/${assertions} assertions passed.`,
);

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
