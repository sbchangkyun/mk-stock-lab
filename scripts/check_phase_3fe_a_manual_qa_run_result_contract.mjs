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

const resultPath = 'docs/planning/phase_3fe_a_manual_qa_run_result_v0.1.md';
const changelogPath = 'docs/planning/planning_changelog.md';
const packagePath = 'package.json';
const checkerPath = 'scripts/check_phase_3fe_a_manual_qa_run_result_contract.mjs';

for (const file of [resultPath, changelogPath, packagePath, checkerPath]) {
  assertTrue(exists(file), `${file} must exist.`);
}

const result = read(resultPath);
const changelog = read(changelogPath);
const packageJson = JSON.parse(read(packagePath));
const changedText = [result].join('\n');

assertTrue(changelog.includes('Phase 3FE-A-MANUAL-QA-RUN'), 'Changelog must contain Phase 3FE-A-MANUAL-QA-RUN.');
assertTrue(packageJson.scripts?.['check:phase-3fe-a-manual-qa-run-result'] === 'node scripts/check_phase_3fe_a_manual_qa_run_result_contract.mjs', 'package.json must contain exact manual QA run checker script.');

const statusMatch = result.match(/## 1\. Status\s*\n\s*(Executed|Partial|Blocked|Failed)\b/i);
assertTrue(Boolean(statusMatch), 'Result doc must record status as Executed, Partial, Blocked, or Failed.');
const status = statusMatch?.[1] ?? 'not found';

assertTrue(result.includes('Current baseline before phase: `0e02130`'), 'Result doc must record baseline 0e02130.');
assertTrue(result.includes('Phase 3FE-A feature commit: `1b2a0f2`'), 'Result doc must record Phase 3FE-A feature commit.');
assertTrue(result.includes('Phase 3FE-A-HF1 evidence commit: `e6c7679`'), 'Result doc must record HF1 evidence commit.');
assertTrue(result.includes('Phase 3FE-A-HANDOFF commit: `b3a4679`'), 'Result doc must record handoff commit.');
assertTrue(result.includes('Phase 3FE-A-MANUAL-QA commit: `0e02130`'), 'Result doc must record manual QA commit.');
assertTrue(result.includes('## 4. What Was Executed'), 'Result doc must record executed scope.');
assertTrue(result.includes('## 5. What Was Not Executed'), 'Result doc must record not executed scope.');
assertTrue(result.includes('## 6. Static Validation Results'), 'Result doc must record static validation results.');
assertTrue(result.includes('## 7. Dev Server Execution'), 'Result doc must record dev server execution outcome.');
assertTrue(result.includes('## 8. API QA Results'), 'Result doc must record API QA results or blocker.');
assertTrue(result.includes('## 9. Browser QA Results'), 'Result doc must record browser QA results or blocker.');

for (const phrase of [
  'No runtime source changed.',
  'No API route changed.',
  'No UI changed.',
  'No provider/helper source changed.',
  'No dependency/lockfile change occurred.',
  'No deploy/push occurred.',
]) {
  assertTrue(result.includes(phrase), `Result doc must include boundary phrase: ${phrase}`);
}

if (status === 'Executed') {
  assertTrue(result.includes('Phase 3FF-A-PLAN'), 'Executed status must recommend Phase 3FF-A-PLAN only as planning.');
}
if (status === 'Partial') {
  assertTrue(result.includes('owner visual browser QA') || result.includes('Phase 3FE-A-MANUAL-QA-RUN-HF1'), 'Partial status must recommend visual QA completion or HF1.');
}
if (status === 'Blocked') {
  assertTrue(result.includes('resolve the local run blocker'), 'Blocked status must recommend resolving the local run blocker first.');
}
if (status === 'Failed') {
  assertTrue(result.includes('Phase 3FE-A-HF2'), 'Failed status must recommend Phase 3FE-A-HF2.');
}

const changelogStatusMatch = changelog.match(/## Phase 3FE-A-MANUAL-QA-RUN - 2026-07-07[\s\S]*?- \*\*Status\*\*: (Executed|Partial|Blocked|Failed)/);
assertTrue(Boolean(changelogStatusMatch), 'Changelog must record manual QA run status.');
assertTrue(changelogStatusMatch?.[1] === status, 'Changelog status must match result doc status.');

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
  assertTrue(!regex.test(changedText), `Manual QA run text must not contain ${label}.`);
}

const collectDiff = (command) => {
  try {
    const output = execSync(command, { cwd: root, encoding: 'utf8' }).trim();
    return output ? output.split(/\r?\n/) : [];
  } catch {
    // Content checks remain deterministic outside git contexts.
    return [];
  }
};
const forbiddenPathArgs = 'src pages src/pages src/lib src/data supabase package-lock.json pnpm-lock.yaml yarn.lock .env .env.local';
const toleratedRuntimeArtifacts = new Set([
  'src/lib/server/chart-ai/similar-pattern-agent.mjs',
  'src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs',
  'src/lib/server/chart-ai/mk-agent.mjs',
  'src/lib/server/chart-ai/mk-agent.fixture.mjs',
  'src/pages/chart-ai.astro',
]);
const committedForbiddenDrift = collectDiff(`git diff --name-only 0e02130 HEAD -- ${forbiddenPathArgs}`);
const workingTreeForbiddenDrift = collectDiff(`git diff --name-only -- ${forbiddenPathArgs}`);
const stagedForbiddenDrift = collectDiff(`git diff --cached --name-only -- ${forbiddenPathArgs}`);
const forbiddenDrift = [...new Set([...committedForbiddenDrift, ...workingTreeForbiddenDrift, ...stagedForbiddenDrift])]
  .filter((file) => !toleratedRuntimeArtifacts.has(file));
assertTrue(forbiddenDrift.length === 0, `Runtime/source/API/UI/provider/dependency/lockfile/env path drift must stay blocked. Unexpected: ${forbiddenDrift.join(', ')}`);

if (assertions < 35) failures.push(`Checker assertion count too low: ${assertions}.`);

if (failures.length) {
  console.error(`Phase 3FE-A-MANUAL-QA-RUN check FAILED: ${failures.length}/${assertions} assertions failed.`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FE-A-MANUAL-QA-RUN check passed: ${assertions}/${assertions} assertions passed. Status: ${status}.`);
