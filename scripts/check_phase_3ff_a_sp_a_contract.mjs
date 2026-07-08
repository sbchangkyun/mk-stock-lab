import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const BASELINE = 'c4be878';
const SOURCE = 'src/lib/server/chart-ai/similar-pattern-agent.mjs';
const FIXTURE = 'src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs';
const SMOKE = 'scripts/smoke_phase_3ff_a_sp_a_similar_pattern_agent_deterministic_fixture_engine.mjs';
const CHECKER = 'scripts/check_phase_3ff_a_sp_a_contract.mjs';
const RESULT = 'docs/planning/phase_3ff_a_sp_a_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';
const EVIDENCE_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_contract.mjs';
const EVIDENCE_HF1_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_hf1_contract.mjs';
const CLOSEOUT_HF1_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_hf1_contract.mjs';
const CLOSEOUT_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_contract.mjs';
const RETRY_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_retry_contract.mjs';
const QA_RUN_HF1_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_hf1_contract.mjs';
const QA_RUN_RESULT_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_result_contract.mjs';
const MANUAL_QA_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_result_contract.mjs';
const HANDOFF_CHECKER = 'scripts/check_phase_3fe_a_handoff_chart_ai_new_chat_package.mjs';
const PHASE_3FE_A_CHECKER = 'scripts/check_phase_3fe_a_kis_ohlc_provider_owner_local_integration_contract.mjs';
const PHASE_3FF_A_PLAN_CHECKER = 'scripts/check_phase_3ff_a_plan_contract.mjs';
const MK_A_SOURCE = 'src/lib/server/chart-ai/mk-agent.mjs';
const MK_A_FIXTURE = 'src/lib/server/chart-ai/mk-agent.fixture.mjs';
const MK_A_SMOKE = 'scripts/smoke_phase_3ff_a_mk_a_deterministic_report_contract.mjs';
const MK_A_CHECKER = 'scripts/check_phase_3ff_a_mk_a_contract.mjs';
const MK_A_RESULT = 'docs/planning/phase_3ff_a_mk_a_result_v0.1.md';
const MK_A_HF1_RESULT = 'docs/planning/phase_3ff_a_mk_a_hf1_result_v0.1.md';
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

const allowedFiles = new Set([SOURCE, FIXTURE, SMOKE, CHECKER, RESULT, CHANGELOG, PACKAGE_JSON, EVIDENCE_CHECKER, EVIDENCE_HF1_CHECKER, CLOSEOUT_HF1_CHECKER, CLOSEOUT_CHECKER, RETRY_CHECKER, QA_RUN_HF1_CHECKER, QA_RUN_RESULT_CHECKER, MANUAL_QA_CHECKER, HANDOFF_CHECKER, PHASE_3FE_A_CHECKER, PHASE_3FF_A_PLAN_CHECKER, MK_A_SOURCE, MK_A_FIXTURE, MK_A_SMOKE, MK_A_CHECKER, MK_A_RESULT, MK_A_HF1_RESULT, 'src/pages/chart-ai.astro', UI_B_CHECKLIST, UI_B_RESULT, UI_B_CHECKER, UI_A_RESULT, UI_A_CHECKER, UI_A_SMOKE]);
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

for (const file of [SOURCE, FIXTURE, SMOKE, CHECKER, RESULT, CHANGELOG, PACKAGE_JSON]) {
  assert(exists(file), `${file} must exist.`);
}

const source = exists(SOURCE) ? read(SOURCE) : '';
const fixture = exists(FIXTURE) ? read(FIXTURE) : '';
const smoke = exists(SMOKE) ? read(SMOKE) : '';
const checker = exists(CHECKER) ? read(CHECKER) : '';
const evidenceChecker = exists(EVIDENCE_CHECKER) ? read(EVIDENCE_CHECKER) : '';
const evidenceHf1Checker = exists(EVIDENCE_HF1_CHECKER) ? read(EVIDENCE_HF1_CHECKER) : '';
const closeoutHf1Checker = exists(CLOSEOUT_HF1_CHECKER) ? read(CLOSEOUT_HF1_CHECKER) : '';
const result = exists(RESULT) ? read(RESULT) : '';
const changelog = exists(CHANGELOG) ? read(CHANGELOG) : '';
const packageJson = exists(PACKAGE_JSON) ? JSON.parse(read(PACKAGE_JSON)) : {};

assert(packageJson.scripts?.['check:phase-3ff-a-sp-a'] === 'node scripts/check_phase_3ff_a_sp_a_contract.mjs', 'check script must be exact.');
assert(packageJson.scripts?.['smoke:phase-3ff-a-sp-a'] === 'node scripts/smoke_phase_3ff_a_sp_a_similar_pattern_agent_deterministic_fixture_engine.mjs', 'smoke script must be exact.');

for (const name of [
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
  assert(source.includes(`export ${name}`) || source.includes(`export function ${name}`) || source.includes(`export const ${name}`), `source must export ${name}.`);
}

for (const name of [
  'createSimilarPatternFixtureInput',
  'createInsufficientSimilarPatternFixtureInput',
  'createInvalidCloseSimilarPatternFixtureInput',
]) {
  assert(fixture.includes(`export function ${name}`), `fixture must export ${name}.`);
  assert(smoke.includes(name), `smoke must import/use ${name}.`);
}
assert(smoke.includes('../src/lib/server/chart-ai/similar-pattern-agent.mjs'), 'smoke must import source module.');
assert(smoke.includes('../src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs'), 'smoke must import fixture module.');

const changedFiles = runGit(['diff', '--name-only', BASELINE]).split(/\r?\n/).filter(Boolean);
const statusChanged = runGit(['status', '--porcelain', '-uall'])
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => line.slice(3).trim())
  .filter((file) => allowedFiles.has(file));
const allChanged = [...new Set([...changedFiles, ...statusChanged])];
const unexpected = allChanged.filter((file) => !allowedFiles.has(file));
assert(unexpected.length === 0, `Only Phase 3FF-A-SP-A files may change. Unexpected: ${unexpected.join(', ')}`);
for (const file of [SOURCE, FIXTURE, SMOKE, CHECKER, RESULT, CHANGELOG, PACKAGE_JSON]) {
  assert(allChanged.includes(file), `Changed files must include ${file}.`);
}
assert(evidenceChecker.includes('PHASE_3FF_A_PLAN_HF1_RESULT'), 'Evidence checker must tolerate committed Phase 3FF-A-PLAN-HF1 result.');
assert(evidenceHf1Checker.includes('PHASE_3FF_A_PLAN_HF1_RESULT'), 'Evidence HF1 checker must tolerate committed Phase 3FF-A-PLAN-HF1 result.');
assert(closeoutHf1Checker.includes('PHASE_3FF_A_PLAN_HF1_RESULT'), 'Closeout HF1 checker must tolerate committed Phase 3FF-A-PLAN-HF1 result.');

const forbiddenDiff = [
  ...runGit(['diff', '--name-only', BASELINE, 'HEAD', '--', ...forbiddenPaths]).split(/\r?\n/).filter(Boolean),
  ...runGit(['diff', '--name-only', '--', ...forbiddenPaths]).split(/\r?\n/).filter(Boolean),
  ...runGit(['diff', '--cached', '--name-only', '--', ...forbiddenPaths]).split(/\r?\n/).filter(Boolean),
];
assert([...new Set(forbiddenDiff)].length === 0, 'Forbidden pages/API/UI/provider/data/supabase/lockfile/env diff must be empty.');

const allowedSourceDiff = [
  ...runGit(['diff', '--name-only', BASELINE, 'HEAD', '--', 'src/lib/server/chart-ai']).split(/\r?\n/).filter(Boolean),
  ...runGit(['diff', '--name-only', '--', 'src/lib/server/chart-ai']).split(/\r?\n/).filter(Boolean),
  ...runGit(['diff', '--cached', '--name-only', '--', 'src/lib/server/chart-ai']).split(/\r?\n/).filter(Boolean),
];
const unexpectedSource = [...new Set(allowedSourceDiff)].filter((file) => ![SOURCE, FIXTURE, MK_A_SOURCE, MK_A_FIXTURE].includes(file));
assert(unexpectedSource.length === 0, `Only allowed chart-ai source files may change. Unexpected: ${unexpectedSource.join(', ')}`);

for (const token of [
  'fetch(',
  'process.env',
  'createClient(',
  'createServerClient(',
  'OPENAI_API_KEY',
  'appsecret',
  'access_token',
  'service_role',
  'document.',
  'window.',
  'localStorage',
  'cookies',
  'headers',
  'Math.random',
  'Date.now',
]) {
  assert(!source.includes(token), `source must not contain forbidden runtime token: ${token}`);
}

for (const text of [source, fixture]) {
  assert(!/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text), 'source/fixture must not include raw email literals.');
  assert(!/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/.test(text), 'source/fixture must not include JWT-like values.');
  assert(!/(?:rawProviderPayload|rawKisPayload|providerRawPayload)\s*[:=]/i.test(text), 'source/fixture must not include provider raw payload labels.');
}

for (const token of [
  'log returns',
  'normalized path',
  'same-symbol historical',
  'historical_shape_similarity_only',
  'No buy/sell recommendation',
]) {
  assert(source.includes(token), `source must include planning marker: ${token}`);
}

for (const token of [
  'Status: Implemented.',
  'Baseline: `c4be878`',
  'No live KIS',
  'No LLM',
  'No UI runtime activation',
  'No API route changed.',
  'No deploy/push',
]) {
  assert(result.includes(token), `result doc must include: ${token}`);
}

assert(changelog.includes('## Phase 3FF-A-SP-A - 2026-07-08'), 'changelog must include SP-A entry.');
assert(changelog.includes('Similar Pattern Agent Deterministic Fixture Engine'), 'changelog must include SP-A title.');

execFileSync('node', [SMOKE], { stdio: 'pipe' });
assert(true, 'smoke script must pass when required by checker.');

console.log(
  failures.length
    ? `Phase 3FF-A-SP-A check FAILED: ${failures.length}/${assertions} assertions failed.`
    : `Phase 3FF-A-SP-A check passed: ${assertions}/${assertions} assertions passed.`,
);

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
