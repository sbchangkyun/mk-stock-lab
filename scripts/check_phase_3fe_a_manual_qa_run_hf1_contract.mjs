import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));

let assertions = 0;
const failures = [];

const assertTrue = (condition, message) => {
  assertions += 1;
  if (!condition) failures.push(message);
};

const hf1ResultPath = 'docs/planning/phase_3fe_a_manual_qa_run_hf1_result_v0.1.md';
const qaRunResultPath = 'docs/planning/phase_3fe_a_manual_qa_run_result_v0.1.md';
const changelogPath = 'docs/planning/planning_changelog.md';
const packagePath = 'package.json';
const handoffCheckerPath = 'scripts/check_phase_3fe_a_handoff_chart_ai_new_chat_package.mjs';
const hf1CheckerPath = 'scripts/check_phase_3fe_a_manual_qa_run_hf1_contract.mjs';

for (const file of [hf1ResultPath, qaRunResultPath, changelogPath, packagePath, handoffCheckerPath, hf1CheckerPath]) {
  assertTrue(exists(file), `${file} must exist.`);
}

const hf1Result = read(hf1ResultPath);
const qaRunResult = read(qaRunResultPath);
const changelog = read(changelogPath);
const packageJson = JSON.parse(read(packagePath));
const handoffChecker = read(handoffCheckerPath);
const changedText = [hf1Result, qaRunResult].join('\n');

assertTrue(changelog.includes('Phase 3FE-A-MANUAL-QA-RUN-HF1'), 'Changelog must contain Phase 3FE-A-MANUAL-QA-RUN-HF1.');
assertTrue(packageJson.scripts?.['check:phase-3fe-a-manual-qa-run-result'] === 'node scripts/check_phase_3fe_a_manual_qa_run_result_contract.mjs', 'QA-RUN result checker package script must remain.');
assertTrue(packageJson.scripts?.['check:phase-3fe-a-manual-qa-run-hf1'] === 'node scripts/check_phase_3fe_a_manual_qa_run_hf1_contract.mjs', 'HF1 package script must exist.');

assertTrue(handoffChecker.includes('git diff --name-only e6c7679 b3a4679'), 'Handoff checker must reference fixed handoff commit range e6c7679..b3a4679.');
assertTrue(handoffChecker.includes('forbiddenPathArgs'), 'Handoff checker must keep forbidden path drift checks.');
assertTrue(handoffChecker.includes('Runtime/source/API/UI/provider/dependency/lockfile/env path drift must stay blocked'), 'Handoff checker must still block runtime/source/API/UI/provider path drift.');
assertTrue(!handoffChecker.includes("collectDiff('git diff --name-only e6c7679')"), 'Handoff checker must not use broad e6c7679 working tree diff.');
assertTrue(!handoffChecker.includes("collectDiff('git diff --name-only e6c7679 HEAD')"), 'Handoff checker must not use broad e6c7679..HEAD diff.');
assertTrue(handoffChecker.includes('committedForbiddenDrift'), 'Handoff checker must inspect committed forbidden path drift.');
assertTrue(handoffChecker.includes('workingTreeForbiddenDrift'), 'Handoff checker must inspect working tree forbidden path drift.');
assertTrue(handoffChecker.includes('stagedForbiddenDrift'), 'Handoff checker must inspect staged forbidden path drift.');

assertTrue(/## 1\. Status\s*\n\s*Implemented\b/.test(hf1Result), 'HF1 result doc must record status Implemented.');
assertTrue(hf1Result.includes('Current baseline before HF1: `0e02130`'), 'HF1 result doc must record baseline 0e02130.');
assertTrue(hf1Result.includes('Phase 3FE-A feature commit: `1b2a0f2`'), 'HF1 result doc must record Phase 3FE-A feature commit.');
assertTrue(hf1Result.includes('Phase 3FE-A-HF1 evidence commit: `e6c7679`'), 'HF1 result doc must record HF1 evidence commit.');
assertTrue(hf1Result.includes('Phase 3FE-A-HANDOFF commit: `b3a4679`'), 'HF1 result doc must record handoff commit.');
assertTrue(hf1Result.includes('Phase 3FE-A-MANUAL-QA commit: `0e02130`'), 'HF1 result doc must record manual QA commit.');
assertTrue(hf1Result.includes('Root Cause'), 'HF1 result doc must record root cause.');
assertTrue(hf1Result.includes('checker scope issue'), 'HF1 result doc must identify checker scope issue.');

for (const phrase of [
  'No runtime source changed.',
  'No API route changed.',
  'No UI changed.',
  'No provider/helper source changed.',
  'No dependency/lockfile change occurred.',
  'No deploy/push occurred.',
]) {
  assertTrue(hf1Result.includes(phrase), `HF1 result doc must include boundary phrase: ${phrase}`);
}

assertTrue(hf1Result.includes('Phase 3FE-A-MANUAL-QA-RUN-RETRY') || hf1Result.includes('rerun `Phase 3FE-A-MANUAL-QA-RUN`'), 'HF1 result doc must recommend rerunning manual QA run.');
assertTrue(qaRunResult.includes('Status') && qaRunResult.includes('Blocked'), 'QA-RUN blocked evidence must be preserved.');
assertTrue(qaRunResult.includes('Dev server was not started'), 'QA-RUN evidence must preserve dev server not started.');
assertTrue(qaRunResult.includes('API QA was not executed'), 'QA-RUN evidence must preserve API QA not executed.');

const changelogStatusMatch = changelog.match(/## Phase 3FE-A-MANUAL-QA-RUN-HF1 - 2026-07-07[\s\S]*?- \*\*Status\*\*: Implemented/);
assertTrue(Boolean(changelogStatusMatch), 'Changelog must record HF1 status Implemented.');

const rx = (...parts) => new RegExp(parts.join(''), 'i');
const forbiddenClaims = [
  ['live KIS active', rx('live KIS', '\\s+', 'is active', '|', 'activated ', 'live KIS', '|', 'enable ', 'live KIS', ' now')],
  ['public beta active', rx('public activation', '\\s+', 'is active', '|', 'beta activation', '\\s+', 'is active', '|', 'activated ', 'public', '|', 'activated ', 'beta')],
  ['LLM or MK AI active', rx('LLM', '\\s+', 'is active', '|', 'activated ', 'LLM', '|', 'MK AI route', '\\s+', 'is active', '|', 'activated ', 'MK AI route')],
  ['Supabase DB env session active', rx('Supabase/DB/env/session/JWT runtime', '\\s+', 'is active', '|', 'created ', 'Supabase client', '|', 'DB connection', '\\s+', 'is active')],
  ['raw email', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
  ['uuid-like identifier', /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i],
  ['credential value', /(?:credential|token|secret|password|api[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i],
  ['environment value', /(?:KIS|SUPABASE|OPENAI|ANTHROPIC|VERCEL)_[A-Z0-9_]+\s*[:=]\s*['"][^'"]+['"]/],
  ['raw payload exposed', rx('raw KIS payload', '\\s+', 'is exposed', '|', 'raw OHLC rows', '\\s+', 'are exposed', '|', 'provider payload', '\\s+', 'is exposed')],
];

for (const [label, regex] of forbiddenClaims) {
  assertTrue(!regex.test(changedText), `HF1 text must not contain ${label}.`);
}

const collectDiff = (command) => {
  try {
    const output = execSync(command, { cwd: root, encoding: 'utf8' }).trim();
    return output ? output.split(/\r?\n/) : [];
  } catch {
    return [];
  }
};
const originalPhaseDiffNames = new Set(collectDiff('git diff --name-only 0e02130 fb34d72'));
const allowed = new Set([
  qaRunResultPath,
  hf1ResultPath,
  changelogPath,
  'scripts/check_phase_3fe_a_manual_qa_run_result_contract.mjs',
  'scripts/check_phase_3fe_a_manual_qa_result_contract.mjs',
  hf1CheckerPath,
  handoffCheckerPath,
  packagePath,
]);
const unexpectedOriginalPhaseFiles = [...originalPhaseDiffNames].filter((file) => !allowed.has(file));
assertTrue(unexpectedOriginalPhaseFiles.length === 0, `Original QA-RUN/HF1 diff 0e02130..fb34d72 must only contain allowed docs/checkers/package files. Unexpected: ${unexpectedOriginalPhaseFiles.join(', ')}`);

const forbiddenPathArgs = 'src pages src/pages src/lib src/data supabase package-lock.json pnpm-lock.yaml yarn.lock .env .env.local';
const committedForbiddenDrift = collectDiff(`git diff --name-only fb34d72 HEAD -- ${forbiddenPathArgs}`);
const workingTreeForbiddenDrift = collectDiff(`git diff --name-only -- ${forbiddenPathArgs}`);
const stagedForbiddenDrift = collectDiff(`git diff --cached --name-only -- ${forbiddenPathArgs}`);
const forbiddenDrift = [...new Set([...committedForbiddenDrift, ...workingTreeForbiddenDrift, ...stagedForbiddenDrift])];
assertTrue(forbiddenDrift.length === 0, `Runtime/source/API/UI/provider/dependency/lockfile/env path drift must stay blocked. Unexpected: ${forbiddenDrift.join(', ')}`);

if (assertions < 45) failures.push(`Checker assertion count too low: ${assertions}.`);

if (failures.length) {
  console.error(`Phase 3FE-A-MANUAL-QA-RUN-HF1 check FAILED: ${failures.length}/${assertions} assertions failed.`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FE-A-MANUAL-QA-RUN-HF1 check passed: ${assertions}/${assertions} assertions passed.`);
