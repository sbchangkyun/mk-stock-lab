import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const BASELINE = '907f959';
const HF1_RESULT = 'docs/planning/phase_3fe_a_manual_qa_run_closeout_evidence_hf1_result_v0.1.md';
const EVIDENCE_RESULT = 'docs/planning/phase_3fe_a_manual_qa_run_closeout_evidence_result_v0.1.md';
const CLOSEOUT_RESULT = 'docs/planning/phase_3fe_a_manual_qa_run_closeout_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const HF1_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_hf1_contract.mjs';
const EVIDENCE_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_contract.mjs';
const CLOSEOUT_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_contract.mjs';
const CLOSEOUT_HF1_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_hf1_contract.mjs';
const PACKAGE_JSON = 'package.json';
const EXPECTED_REVIEWER = String.fromCodePoint(0xAE40, 0xCC3D, 0xADE0);
const EXPECTED_REVIEWER_HEX = 'eab980ecb0bdeab7a0';
const CORRUPTED_REVIEWER = Buffer.from('e6ba90c280efa7a1ec8e84ed878f', 'hex').toString('utf8');
const PHASE_3FF_A_PLAN_SP_DOC = 'docs/planning/phase_3ff_a_plan_similar_pattern_agent_design_v0.1.md';
const PHASE_3FF_A_PLAN_MK_DOC = 'docs/planning/phase_3ff_a_plan_mk_agent_design_v0.1.md';
const PHASE_3FF_A_PLAN_RESULT = 'docs/planning/phase_3ff_a_plan_result_v0.1.md';
const PHASE_3FF_A_PLAN_CHECKER = 'scripts/check_phase_3ff_a_plan_contract.mjs';
const PHASE_3FF_A_PLAN_HF1_RESULT = 'docs/planning/phase_3ff_a_plan_hf1_result_v0.1.md';
const PHASE_3FE_A_CHECKER = 'scripts/check_phase_3fe_a_kis_ohlc_provider_owner_local_integration_contract.mjs';

const allowedFiles = new Set([
  HF1_RESULT,
  EVIDENCE_RESULT,
  CLOSEOUT_RESULT,
  CHANGELOG,
  HF1_CHECKER,
  EVIDENCE_CHECKER,
  CLOSEOUT_CHECKER,
  CLOSEOUT_HF1_CHECKER,
  PHASE_3FF_A_PLAN_SP_DOC,
  PHASE_3FF_A_PLAN_MK_DOC,
  PHASE_3FF_A_PLAN_RESULT,
  PHASE_3FF_A_PLAN_CHECKER,
  PHASE_3FF_A_PLAN_HF1_RESULT,
  PHASE_3FE_A_CHECKER,
  PACKAGE_JSON,
]);

const forbiddenPaths = [
  'src',
  'pages',
  'src/pages',
  'src/lib',
  'src/data',
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

for (const file of [HF1_RESULT, EVIDENCE_RESULT, CLOSEOUT_RESULT, CHANGELOG, HF1_CHECKER, EVIDENCE_CHECKER, PACKAGE_JSON]) {
  assert(exists(file), `${file} must exist.`);
}

const hf1 = exists(HF1_RESULT) ? read(HF1_RESULT) : '';
const evidence = exists(EVIDENCE_RESULT) ? read(EVIDENCE_RESULT) : '';
const closeout = exists(CLOSEOUT_RESULT) ? read(CLOSEOUT_RESULT) : '';
const changelog = exists(CHANGELOG) ? read(CHANGELOG) : '';
const hf1Checker = exists(HF1_CHECKER) ? read(HF1_CHECKER) : '';
const evidenceChecker = exists(EVIDENCE_CHECKER) ? read(EVIDENCE_CHECKER) : '';
const packageJson = exists(PACKAGE_JSON) ? JSON.parse(read(PACKAGE_JSON)) : {};

assert(Buffer.from(EXPECTED_REVIEWER, 'utf8').toString('hex') === EXPECTED_REVIEWER_HEX, 'Reviewer code points must produce the approved UTF-8 hex.');
assert(packageJson.scripts?.['check:phase-3fe-a-manual-qa-run-closeout-evidence-hf1'] === 'node scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_hf1_contract.mjs', 'HF1 package script must be exact.');
assert(hf1.includes('Implemented.'), 'HF1 result must record status Implemented.');
assert(changelog.includes('Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-EVIDENCE-HF1'), 'Changelog must contain HF1 entry.');
assert(changelog.includes('- **Status**: Implemented.'), 'Changelog must record HF1 status Implemented.');

for (const token of [
  'Current baseline before HF1: `907f959`',
  'Latest completed phase before HF1: `Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-EVIDENCE`',
  'Phase 3FE-A feature commit: `1b2a0f2`',
  'Phase 3FE-A-HF1 evidence commit: `e6c7679`',
  'Phase 3FE-A-HANDOFF commit: `b3a4679`',
  'Phase 3FE-A-MANUAL-QA commit: `0e02130`',
  'Phase 3FE-A-MANUAL-QA-RUN-HF1 commit: `fb34d72`',
  'Phase 3FE-A-MANUAL-QA-RUN-RETRY commit: `a191dfc`',
  'Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-HF1 commit: `2ddcf7e`',
  'Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-EVIDENCE commit: `907f959`',
  'Branch: `rebuild/phase-1-ia-shell`',
  'Expected reviewer UTF-8 hex: `eab980ecb0bdeab7a0`',
  'No runtime issue was confirmed.',
  'Closeout remains `Closed`.',
]) {
  assert(hf1.includes(token), `HF1 result must include token: ${token}`);
}

assert(evidence.includes(`Reviewer: ${EXPECTED_REVIEWER}.`), 'Evidence result must contain the codepoint-generated reviewer name.');
assert(closeout.includes(`Reviewer: ${EXPECTED_REVIEWER}.`), 'Closeout result must contain the codepoint-generated reviewer name.');
assert(evidenceChecker.includes('String.fromCodePoint(0xAE40, 0xCC3D, 0xADE0)'), 'Evidence checker must construct the reviewer from code points.');
assert(evidenceChecker.includes("const EXPECTED_REVIEWER_HEX = 'eab980ecb0bdeab7a0'"), 'Evidence checker must validate the approved reviewer UTF-8 hex.');
assert(evidenceChecker.includes('Buffer.from(EXPECTED_REVIEWER, \'utf8\').toString(\'hex\')'), 'Evidence checker must compute reviewer UTF-8 hex.');
assert(evidenceChecker.includes('Reviewer: ${EXPECTED_REVIEWER}'), 'Evidence checker must assert the codepoint-generated reviewer token.');

for (const [file, text] of [
  [EVIDENCE_RESULT, evidence],
  [CLOSEOUT_RESULT, closeout],
]) {
  const reviewerLines = text.split(/\r?\n/).filter((line) => line.includes('Reviewer:'));
  assert(reviewerLines.length > 0, `${file} must include reviewer lines.`);
  for (const line of reviewerLines) {
    const value = line.match(/Reviewer:\s*([^.`]+)(?:[.`]|$)/)?.[1]?.trim();
    assert(value === EXPECTED_REVIEWER, `${file} reviewer line must equal the approved reviewer.`);
    assert(Buffer.from(value ?? '', 'utf8').toString('hex') === EXPECTED_REVIEWER_HEX, `${file} reviewer line must match approved UTF-8 hex.`);
  }
}

for (const [file, text] of [
  [EVIDENCE_RESULT, evidence],
  [CLOSEOUT_RESULT, closeout],
  [CHANGELOG, changelog],
  [EVIDENCE_CHECKER, evidenceChecker],
  [HF1_RESULT, hf1],
  [HF1_CHECKER, hf1Checker],
]) {
  assert(!text.includes(CORRUPTED_REVIEWER), `${file} must not contain the known corrupted reviewer value.`);
  const reviewerLines = text
    .split(/\r?\n/)
    .filter((line) => line.includes('Reviewer:'))
    .filter((line) => !line.includes("line.includes('Reviewer:"))
    .filter((line) => !line.includes('line.match(/Reviewer:'));
  for (const line of reviewerLines) {
    assert(!/\uFFFD|\?{2,}/u.test(line), `${file} reviewer line must not contain replacement characters or question-mark corruption.`);
  }
}

assert(closeout.includes('- Status: Closed.'), 'Closeout result must remain Closed.');
assert(closeout.includes('Owner visual QA completed: yes.'), 'Owner visual QA must remain completed.');
for (const row of [
  '| Default `/chart-ai` | PASS |',
  '| Mocked logged-out mode | PASS |',
  '| Mocked master mode | PASS |',
  '| Logged-out precedence | PASS |',
  '| Owner-local Similar Pattern route-backed flow | PASS |',
  '| Explicit KIS OHLC fixture mode UI | NOT EXPOSED IN UI |',
  '| MK AI mocked state | PASS |',
  '| General visual safety | PASS |',
]) {
  assert(closeout.includes(row), `Closeout result must preserve visual QA row: ${row}`);
}

assert(changelog.includes('Phase 3FF-A-PLAN') && changelog.includes('planning-only'), 'Changelog must recommend Phase 3FF-A-PLAN only as planning-only.');

for (const boundary of [
  'No runtime source changed.',
  'No API route changed.',
  'No UI changed.',
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
  assert(hf1.includes(boundary), `HF1 result must preserve boundary: ${boundary}`);
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
assert(unexpected.length === 0, `Only HF1 documentation/checker/package files may change. Unexpected: ${unexpected.join(', ')}`);
for (const file of [HF1_RESULT, EVIDENCE_RESULT, CLOSEOUT_RESULT, CHANGELOG, HF1_CHECKER, EVIDENCE_CHECKER, PACKAGE_JSON]) {
  assert(allChanged.includes(file), `Changed files must include ${file}.`);
}

const forbiddenDiff = [
  ...runGit(['diff', '--name-only', BASELINE, 'HEAD', '--', ...forbiddenPaths]).split(/\r?\n/).filter(Boolean),
  ...runGit(['diff', '--name-only', '--', ...forbiddenPaths]).split(/\r?\n/).filter(Boolean),
  ...runGit(['diff', '--cached', '--name-only', '--', ...forbiddenPaths]).split(/\r?\n/).filter(Boolean),
];
assert([...new Set(forbiddenDiff)].length === 0, 'Runtime/source/API/UI/provider/dependency/lockfile/env diff must be empty.');

const hf1ChangelogEntry = changelog.split('## Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-EVIDENCE - 2026-07-08')[0] ?? '';
const changedText = [hf1, evidence, closeout, hf1ChangelogEntry, evidenceChecker, hf1Checker].join('\n');
assert(!/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(changedText), 'Changed text must not contain raw email literals.');
assert(!/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i.test(changedText), 'Changed text must not contain UUID literals.');
assert(!/(?:api[_-]?key|secret|token|password|credential)\s*[:=]\s*['"][^'"]{4,}/i.test(changedText), 'Changed text must not contain credential assignments.');
assert(!/\b(?:process\.env|import\.meta\.env)\b/.test(changedText), 'Changed text must not read environment values.');
assert(!/\b(?:createClient|createServerClient)\s*\(/.test(changedText), 'Changed text must not create Supabase clients.');

const unsafeClaimPatterns = [
  ['live KIS active', /live\s+KIS\s+(?:is\s+)?(?:active|enabled|activated|connected)/i],
  ['public beta active', /(?:public|beta)\s+(?:is\s+)?(?:active|enabled|activated|connected)/i],
  ['LLM active', /LLM\s+(?:is\s+)?(?:active|enabled|activated|connected)/i],
  ['MK AI route active', /MK\s+AI\s+route\s+(?:is\s+)?(?:active|enabled|activated|connected)/i],
  ['Supabase active', /Supabase(?:\/DB)?\s+(?:is\s+)?(?:active|enabled|activated|connected)/i],
  ['DB connection active', /DB\s+connection\s+(?:is\s+)?(?:active|enabled|opened|connected)/i],
  ['payload exposed', /(?:raw\s+KIS\s+payload|raw\s+OHLC\s+row|provider\s+payload)\s+(?:is\s+)?(?:exposed|returned|visible)/i],
];
for (const [label, pattern] of unsafeClaimPatterns) {
  const unsafeLines = changedText
    .split(/\r?\n/)
    .filter((line) => pattern.test(line))
    .filter((line) => !line.trim().startsWith("['"))
    .filter((line) => !/no |not |blocked|must not|does not|without|false|forbidden|remain blocked|remains blocked|not detected/i.test(line));
  assert(unsafeLines.length === 0, `Changed text must not claim ${label}.`);
}

console.log(
  failures.length
    ? `Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-EVIDENCE-HF1 check FAILED: ${failures.length}/${assertions} assertions failed.`
    : `Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-EVIDENCE-HF1 check passed: ${assertions}/${assertions} assertions passed.`,
);

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
