import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const BASELINE = '2ddcf7e';
const EVIDENCE_RESULT = 'docs/planning/phase_3fe_a_manual_qa_run_closeout_evidence_result_v0.1.md';
const CLOSEOUT_RESULT = 'docs/planning/phase_3fe_a_manual_qa_run_closeout_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_contract.mjs';
const CLOSEOUT_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_contract.mjs';
const CLOSEOUT_HF1_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_hf1_contract.mjs';
const PACKAGE_JSON = 'package.json';
const EXPECTED_REVIEWER = String.fromCodePoint(0xAE40, 0xCC3D, 0xADE0);
const EXPECTED_REVIEWER_HEX = 'eab980ecb0bdeab7a0';
const EVIDENCE_HF1_RESULT = 'docs/planning/phase_3fe_a_manual_qa_run_closeout_evidence_hf1_result_v0.1.md';
const EVIDENCE_HF1_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_hf1_contract.mjs';
const PHASE_3FF_A_PLAN_SP_DOC = 'docs/planning/phase_3ff_a_plan_similar_pattern_agent_design_v0.1.md';
const PHASE_3FF_A_PLAN_MK_DOC = 'docs/planning/phase_3ff_a_plan_mk_agent_design_v0.1.md';
const PHASE_3FF_A_PLAN_RESULT = 'docs/planning/phase_3ff_a_plan_result_v0.1.md';
const PHASE_3FF_A_PLAN_CHECKER = 'scripts/check_phase_3ff_a_plan_contract.mjs';

const allowedFiles = new Set([
  EVIDENCE_RESULT,
  CLOSEOUT_RESULT,
  CHANGELOG,
  CHECKER,
  CLOSEOUT_CHECKER,
  CLOSEOUT_HF1_CHECKER,
  EVIDENCE_HF1_RESULT,
  EVIDENCE_HF1_CHECKER,
  PHASE_3FF_A_PLAN_SP_DOC,
  PHASE_3FF_A_PLAN_MK_DOC,
  PHASE_3FF_A_PLAN_RESULT,
  PHASE_3FF_A_PLAN_CHECKER,
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

for (const file of [EVIDENCE_RESULT, CLOSEOUT_RESULT, CHANGELOG, CHECKER, PACKAGE_JSON]) {
  assert(exists(file), `${file} must exist.`);
}

const evidence = exists(EVIDENCE_RESULT) ? read(EVIDENCE_RESULT) : '';
const closeout = exists(CLOSEOUT_RESULT) ? read(CLOSEOUT_RESULT) : '';
const changelog = exists(CHANGELOG) ? read(CHANGELOG) : '';
const checker = exists(CHECKER) ? read(CHECKER) : '';
const packageJson = exists(PACKAGE_JSON) ? JSON.parse(read(PACKAGE_JSON)) : {};

assert(Buffer.from(EXPECTED_REVIEWER, 'utf8').toString('hex') === EXPECTED_REVIEWER_HEX, 'Expected reviewer UTF-8 hex must match the approved code points.');
assert(packageJson.scripts?.['check:phase-3fe-a-manual-qa-run-closeout-evidence'] === 'node scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_contract.mjs', 'Evidence package script must be exact.');
assert(changelog.includes('Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-EVIDENCE'), 'Changelog must include evidence phase entry.');
assert(changelog.includes('- **Status**: Implemented.'), 'Changelog must record evidence phase status Implemented.');
assert(changelog.includes('Phase 3FF-A-PLAN') && changelog.includes('planning-only'), 'Changelog must recommend Phase 3FF-A-PLAN only as planning-only.');

for (const token of [
  'Implemented.',
  'Current baseline before evidence phase: `2ddcf7e`',
  'Latest completed phase before evidence phase: `Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-HF1`',
  'Phase 3FE-A feature commit: `1b2a0f2`',
  'Phase 3FE-A-HF1 evidence commit: `e6c7679`',
  'Phase 3FE-A-HANDOFF commit: `b3a4679`',
  'Phase 3FE-A-MANUAL-QA commit: `0e02130`',
  'Phase 3FE-A-MANUAL-QA-RUN-HF1 commit: `fb34d72`',
  'Phase 3FE-A-MANUAL-QA-RUN-RETRY commit: `a191dfc`',
  'Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-HF1 commit: `2ddcf7e`',
  'Branch: `rebuild/phase-1-ia-shell`',
  'Review date: 2026-07-08',
  `Reviewer: ${EXPECTED_REVIEWER}`,
  'Owner visual QA evidence is sufficient to close the visual checklist.',
  'Closeout status updated to Closed.',
  '`Phase 3FF-A-PLAN` may proceed only as a planning-only step.',
]) {
  assert(evidence.includes(token), `Evidence result must include token: ${token}`);
}

for (const [file, text] of [
  [EVIDENCE_RESULT, evidence],
  [CLOSEOUT_RESULT, closeout],
  [CHECKER, checker],
]) {
  const reviewerLines = text
    .split(/\r?\n/)
    .map((line, index) => ({ line, index: index + 1 }))
    .filter(({ line }) => line.includes('Reviewer:'))
    .filter(({ line }) => !line.includes("line.includes('Reviewer:"))
    .filter(({ line }) => !line.includes('line.match(/Reviewer:'));
  assert(reviewerLines.length > 0, `${file} must include at least one reviewer line or assertion.`);
  for (const { line, index } of reviewerLines) {
    const isExpectedReviewerAssertion = line.includes('Reviewer: ${EXPECTED_REVIEWER}');
    const reviewerValue = line.match(/Reviewer:\s*([^.`']+)(?:[.`']|$)/)?.[1]?.trim();
    const isExpectedReviewerValue = reviewerValue === EXPECTED_REVIEWER;
    assert(isExpectedReviewerAssertion || isExpectedReviewerValue, `${file}:${index} reviewer value must equal the approved codepoint-generated reviewer.`);
    assert(!/\uFFFD|\?{2,}/u.test(line), `${file}:${index} reviewer line must not contain replacement characters or question-mark corruption.`);
  }
}

for (const label of [
  'default_chart_ai',
  'mocked_logged_out',
  'mocked_master',
  'logged_out_precedence',
  'owner_local_route_backed_flow',
]) {
  assert(evidence.includes(label), `Evidence result must include screenshot label ${label}.`);
  assert(closeout.includes(label), `Closeout result must include screenshot label ${label}.`);
}

for (const row of [
  '| Default `/chart-ai` | PASS | owner-provided screenshot `default_chart_ai` | Page loaded normally; mocked/sample state preserved; no sensitive exposure observed. |',
  '| Mocked logged-out mode | PASS | owner-provided screenshot `mocked_logged_out` | Login-required locked state appeared; main body not exposed. |',
  '| Mocked master mode | PASS | owner-provided screenshot `mocked_master` | Mocked master page loaded; no raw master identifier visible. |',
  '| Logged-out precedence | PASS | owner-provided screenshot `logged_out_precedence` | Logged-out state took precedence; master-only body not exposed. |',
  '| Owner-local Similar Pattern route-backed flow | PASS | owner-provided screenshot `owner_local_route_backed_flow` | Owner-local route-backed flow appeared; no live KIS or raw payload shown. |',
  '| Explicit KIS OHLC fixture mode UI | NOT EXPOSED IN UI | owner screenshots plus prior retry API QA | No direct UI control visible; prior API QA passed explicit fixture mode. |',
  '| MK AI mocked state | PASS | owner-provided screenshots | MK AI tab visible; no LLM route activation or live AI call observed. |',
  '| General visual safety | PASS | owner-provided screenshots | No raw dumps, stack traces, credentials, tokens, sessions, JWTs, env values, raw KIS/OHLC/provider payloads, raw master identifiers, raw emails, or raw UIDs observed. |',
]) {
  assert(evidence.includes(row), `Evidence result must include visual result row: ${row}`);
}

assert(closeout.includes('- Status: Closed.'), 'Closeout result must record status Closed.');
assert(closeout.includes('Owner visual QA completed: yes.'), 'Closeout result must record owner visual QA completed.');
assert(closeout.includes('Issues found: no.'), 'Closeout result must record no issues found.');
assert(closeout.includes('Sensitive data removed: not applicable.'), 'Closeout result must record sensitive data removed not applicable.');
assert(!/Direct Phase 3FF-A implementation remains allowed|live KIS is active|LLM is active|public activation is active|beta activation is active/i.test(closeout), 'Closeout result must not claim blocked activation.');

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
  assert(evidence.includes(boundary), `Evidence result must preserve boundary: ${boundary}`);
  assert(closeout.includes(boundary), `Closeout result must preserve boundary: ${boundary}`);
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
assert(unexpected.length === 0, `Only evidence doc/checker/changelog/package and compatibility checkers may change. Unexpected: ${unexpected.join(', ')}`);
for (const file of [EVIDENCE_RESULT, CLOSEOUT_RESULT, CHANGELOG, CHECKER, PACKAGE_JSON]) {
  assert(allChanged.includes(file), `Changed files must include ${file}.`);
}

const forbiddenDiff = [
  ...runGit(['diff', '--name-only', BASELINE, 'HEAD', '--', ...forbiddenPaths]).split(/\r?\n/).filter(Boolean),
  ...runGit(['diff', '--name-only', '--', ...forbiddenPaths]).split(/\r?\n/).filter(Boolean),
  ...runGit(['diff', '--cached', '--name-only', '--', ...forbiddenPaths]).split(/\r?\n/).filter(Boolean),
];
assert([...new Set(forbiddenDiff)].length === 0, 'Runtime/source/API/UI/provider/dependency/lockfile/env diff must be empty.');

const newChangelogEntry = changelog.split('## Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-HF1 - 2026-07-07')[0] ?? '';
const changedText = [evidence, closeout, newChangelogEntry, checker].join('\n');
assert(!/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(changedText), 'Changed text must not contain raw email literals.');
assert(!/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i.test(changedText), 'Changed text must not contain UUID literals.');
assert(!/(?:api[_-]?key|secret|token|password|credential)\s*[:=]\s*['"][^'"]{4,}/i.test(changedText), 'Changed text must not contain credential assignments.');
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
    ? `Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-EVIDENCE check FAILED: ${failures.length}/${assertions} assertions failed.`
    : `Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-EVIDENCE check passed: ${assertions}/${assertions} assertions passed.`,
);

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
