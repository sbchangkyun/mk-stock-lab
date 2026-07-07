import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const BASELINE = 'a191dfc';
const HF1_RESULT = 'docs/planning/phase_3fe_a_manual_qa_run_closeout_hf1_result_v0.1.md';
const CLOSEOUT_RESULT = 'docs/planning/phase_3fe_a_manual_qa_run_closeout_result_v0.1.md';
const CLOSEOUT_CHECKLIST = 'docs/planning/phase_3fe_a_manual_qa_run_closeout_owner_visual_checklist_v0.1.md';
const CLOSEOUT_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_contract.mjs';
const HF1_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_hf1_contract.mjs';
const QA_RUN_HF1_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_hf1_contract.mjs';
const RETRY_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_retry_contract.mjs';
const HANDOFF_CHECKER = 'scripts/check_phase_3fe_a_handoff_chart_ai_new_chat_package.mjs';
const MANUAL_QA_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_result_contract.mjs';
const QA_RUN_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_result_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const allowedFiles = new Set([
  CLOSEOUT_CHECKLIST,
  CLOSEOUT_RESULT,
  HF1_RESULT,
  CHANGELOG,
  CLOSEOUT_CHECKER,
  HF1_CHECKER,
  QA_RUN_HF1_CHECKER,
  RETRY_CHECKER,
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

for (const file of [
  HF1_RESULT,
  CLOSEOUT_RESULT,
  CLOSEOUT_CHECKLIST,
  CLOSEOUT_CHECKER,
  HF1_CHECKER,
  QA_RUN_HF1_CHECKER,
  RETRY_CHECKER,
  HANDOFF_CHECKER,
  MANUAL_QA_CHECKER,
  QA_RUN_CHECKER,
  CHANGELOG,
  PACKAGE_JSON,
]) {
  assert(exists(file), `${file} must exist.`);
}

const hf1Result = exists(HF1_RESULT) ? read(HF1_RESULT) : '';
const closeoutResult = exists(CLOSEOUT_RESULT) ? read(CLOSEOUT_RESULT) : '';
const closeoutChecklist = exists(CLOSEOUT_CHECKLIST) ? read(CLOSEOUT_CHECKLIST) : '';
const closeoutChecker = exists(CLOSEOUT_CHECKER) ? read(CLOSEOUT_CHECKER) : '';
const qaRunHf1Checker = exists(QA_RUN_HF1_CHECKER) ? read(QA_RUN_HF1_CHECKER) : '';
const retryChecker = exists(RETRY_CHECKER) ? read(RETRY_CHECKER) : '';
const handoffChecker = exists(HANDOFF_CHECKER) ? read(HANDOFF_CHECKER) : '';
const manualQaChecker = exists(MANUAL_QA_CHECKER) ? read(MANUAL_QA_CHECKER) : '';
const qaRunChecker = exists(QA_RUN_CHECKER) ? read(QA_RUN_CHECKER) : '';
const changelog = exists(CHANGELOG) ? read(CHANGELOG) : '';
const packageJson = exists(PACKAGE_JSON) ? JSON.parse(read(PACKAGE_JSON)) : {};

assert(packageJson.scripts?.['check:phase-3fe-a-manual-qa-run-closeout'] === 'node scripts/check_phase_3fe_a_manual_qa_run_closeout_contract.mjs', 'Closeout package script must remain exact.');
assert(packageJson.scripts?.['check:phase-3fe-a-manual-qa-run-closeout-hf1'] === 'node scripts/check_phase_3fe_a_manual_qa_run_closeout_hf1_contract.mjs', 'Closeout HF1 package script must be exact.');
assert(changelog.includes('Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-HF1'), 'Changelog must contain closeout HF1 entry.');
assert(changelog.includes('Validation Chain Checker Scope Hardening, No Runtime Change'), 'Changelog must contain closeout HF1 title.');
assert(changelog.includes('- **Status**: Implemented.'), 'Changelog must record HF1 status Implemented.');

for (const token of [
  'Implemented.',
  'Current baseline before HF1: `a191dfc`',
  'Latest completed phase before HF1: `Phase 3FE-A-MANUAL-QA-RUN-RETRY`',
  'Blocked attempted phase: `Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT`',
  'Phase 3FE-A feature commit: `1b2a0f2`',
  'Phase 3FE-A-HF1 evidence commit: `e6c7679`',
  'Phase 3FE-A-HANDOFF commit: `b3a4679`',
  'Phase 3FE-A-MANUAL-QA commit: `0e02130`',
  'Phase 3FE-A-MANUAL-QA-RUN-HF1 commit: `fb34d72`',
  'Phase 3FE-A-MANUAL-QA-RUN-RETRY commit: `a191dfc`',
  'Branch: `rebuild/phase-1-ia-shell`',
  'checker-scope issue',
  'No runtime issue was confirmed.',
  'Checkers inspected:',
  'Checkers corrected:',
  'Checkers left unchanged:',
  'Safe checker-scope pattern applied:',
]) {
  assert(hf1Result.includes(token), `HF1 result must include ${token}.`);
}

for (const checkerName of [
  HANDOFF_CHECKER,
  MANUAL_QA_CHECKER,
  QA_RUN_CHECKER,
  QA_RUN_HF1_CHECKER,
  RETRY_CHECKER,
  CLOSEOUT_CHECKER,
]) {
  assert(hf1Result.includes(checkerName), `HF1 result must document inspected checker ${checkerName}.`);
}

for (const changedChecker of [QA_RUN_HF1_CHECKER, RETRY_CHECKER, CLOSEOUT_CHECKER]) {
  assert(hf1Result.includes(changedChecker), `HF1 result must document corrected checker ${changedChecker}.`);
}

for (const unchangedChecker of [HANDOFF_CHECKER, MANUAL_QA_CHECKER, QA_RUN_CHECKER]) {
  assert(hf1Result.includes(`${unchangedChecker}`), `HF1 result must document unchanged checker ${unchangedChecker}.`);
}

assert(closeoutResult.includes('- Status: Prepared.'), 'Closeout result must remain Prepared.');
assert(closeoutResult.includes('Owner visual evidence: not found'), 'Closeout result must continue to state owner evidence not found.');
assert(closeoutResult.includes('Visual QA: not closed'), 'Closeout result must continue to state visual QA not closed.');
assert(!/Status: Closed/.test(closeoutResult), 'Closeout result must not claim Closed.');
assert(!/Visual QA: passed|visual QA: pass\b|full visual QA pass is claimed/i.test(closeoutResult), 'Closeout result must not claim visual QA passed.');

for (const visualCase of [
  '### A. Default `/chart-ai`',
  '### B. Mocked logged-out mode',
  '### C. Mocked master mode',
  '### D. Logged-out precedence',
  '### E. Owner-local Similar Pattern route-backed flow',
  '### F. Explicit KIS OHLC fixture mode',
  '### G. MK AI mocked state',
  '### H. General visual safety',
]) {
  assert(closeoutChecklist.includes(visualCase), `Closeout checklist must retain ${visualCase}.`);
}

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
  assert(hf1Result.includes(boundary), `HF1 result must preserve boundary: ${boundary}`);
  assert(closeoutResult.includes(boundary), `Closeout result must preserve boundary: ${boundary}`);
}

const checkerCorrections = [
  [QA_RUN_HF1_CHECKER, qaRunHf1Checker, 'git diff --name-only 0e02130 fb34d72', 'fb34d72 HEAD'],
  [RETRY_CHECKER, retryChecker, "'diff', '--name-only', BASELINE, 'a191dfc'", "'a191dfc', 'HEAD'"],
  [CLOSEOUT_CHECKER, closeoutChecker, 'currentHead === BASELINE', "BASELINE, 'HEAD'"],
];
for (const [file, text, originalRangeToken, forbiddenRangeToken] of checkerCorrections) {
  assert(text.includes(originalRangeToken), `${file} must contain fixed original or documented current phase range token.`);
  assert(text.includes('committedForbidden') || text.includes('committedForbiddenDrift'), `${file} must contain committed forbidden drift check.`);
  assert(text.includes('workingTreeForbidden') || text.includes('workingTreeForbiddenDrift'), `${file} must contain working tree forbidden drift check.`);
  assert(text.includes('stagedForbidden') || text.includes('stagedForbiddenDrift'), `${file} must contain staged forbidden drift check.`);
  assert(text.includes(forbiddenRangeToken), `${file} must contain safe forbidden range token ${forbiddenRangeToken}.`);
  assert(!text.includes("git diff --name-only 0e02130')"), `${file} must not contain stale broad 0e02130 diff rejection.`);
  if (file !== CLOSEOUT_CHECKER) {
    assert(!text.includes("runGit(['diff', '--name-only', BASELINE])"), `${file} must not contain stale broad BASELINE diff rejection.`);
  } else {
    assert(text.includes('currentHead === BASELINE'), `${file} must document the safe current closeout range guard.`);
  }
}

assert(handoffChecker.includes('git diff --name-only e6c7679 b3a4679'), 'Handoff checker must keep fixed handoff range.');
assert(handoffChecker.includes('committedForbiddenDrift'), 'Handoff checker must keep committed forbidden drift.');
assert(manualQaChecker.includes('committedForbiddenDrift'), 'Manual QA checker must keep committed forbidden drift.');
assert(qaRunChecker.includes('committedForbiddenDrift'), 'QA-RUN result checker must keep committed forbidden drift.');

const diffChanged = runGit(['diff', '--name-only', BASELINE]).split(/\r?\n/).filter(Boolean);
const statusChanged = runGit(['status', '--short'])
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => line.slice(3).trim())
  .filter((file) => allowedFiles.has(file));
const changedFiles = [...new Set([...diffChanged, ...statusChanged])];
const unexpected = changedFiles.filter((file) => !allowedFiles.has(file));
assert(unexpected.length === 0, `Only closeout/HF1 docs/checkers/package files may change. Unexpected: ${unexpected.join(', ')}`);
for (const file of allowedFiles) {
  assert(changedFiles.includes(file), `Changed files must include ${file}.`);
}

const forbiddenDiff = [
  ...runGit(['diff', '--name-only', BASELINE, 'HEAD', '--', ...forbiddenPaths]).split(/\r?\n/).filter(Boolean),
  ...runGit(['diff', '--name-only', '--', ...forbiddenPaths]).split(/\r?\n/).filter(Boolean),
  ...runGit(['diff', '--cached', '--name-only', '--', ...forbiddenPaths]).split(/\r?\n/).filter(Boolean),
];
assert([...new Set(forbiddenDiff)].length === 0, 'Runtime/source/API/UI/provider/dependency/lockfile/env diff must be empty.');

const closeoutHf1ChangelogEntry = changelog.split('## Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT - 2026-07-07')[0] ?? '';
const changedText = [hf1Result, closeoutResult, closeoutChecklist, closeoutHf1ChangelogEntry, HF1_CHECKER].join('\n');
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
    .filter((line) => pattern.test(line) && !/no |not |blocked|must not|does not|without|false|forbidden|remain blocked|remains blocked|not detected/i.test(line));
  assert(unsafeLines.length === 0, `Changed text must not claim ${label}.`);
}

console.log(
  failures.length
    ? `Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-HF1 check FAILED: ${failures.length}/${assertions} assertions failed.`
    : `Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-HF1 check passed: ${assertions}/${assertions} assertions passed.`,
);

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
