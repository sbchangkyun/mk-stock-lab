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

const checklistPath = 'docs/planning/phase_3fe_a_manual_qa_checklist_v0.1.md';
const resultPath = 'docs/planning/phase_3fe_a_manual_qa_result_v0.1.md';
const changelogPath = 'docs/planning/planning_changelog.md';
const packagePath = 'package.json';
const checkerPath = 'scripts/check_phase_3fe_a_manual_qa_result_contract.mjs';

for (const file of [checklistPath, resultPath, changelogPath, packagePath, checkerPath]) {
  assertTrue(exists(file), `${file} must exist.`);
}

const checklist = read(checklistPath);
const result = read(resultPath);
const changelog = read(changelogPath);
const packageJson = JSON.parse(read(packagePath));
const changedText = [checklist, result].join('\n');

assertTrue(changelog.includes('Phase 3FE-A-MANUAL-QA'), 'Changelog must contain Phase 3FE-A-MANUAL-QA.');
assertTrue(packageJson.scripts?.['check:phase-3fe-a-manual-qa-result'] === 'node scripts/check_phase_3fe_a_manual_qa_result_contract.mjs', 'package.json must contain exact manual QA checker script.');

assertTrue(checklist.includes('b3a4679'), 'Checklist must record baseline b3a4679.');
assertTrue(checklist.includes('1b2a0f2'), 'Checklist must record Phase 3FE-A feature commit 1b2a0f2.');
assertTrue(checklist.includes('Phase 3FE-A-HANDOFF commit: `b3a4679`'), 'Checklist must record handoff commit b3a4679.');
for (const section of [
  '## 1. Purpose',
  '## 2. Baseline',
  '## 3. Preconditions',
  '## 4. Required Safety Boundaries',
  '## 5. Static Validation Checklist',
  '## 6. API QA Checklist',
  '## 7. Browser QA Checklist',
  '## 8. Expected Safe Response Properties',
  '## 9. Fail-closed Cases',
  '## 10. Pass/fail Criteria',
  '## 11. Owner Execution Notes',
]) {
  assertTrue(checklist.includes(section), `Checklist must include ${section}.`);
}
for (const phrase of [
  'No live KIS',
  'No LLM',
  'No MK AI route activation',
  'No Supabase/DB/env/session/JWT',
  'No public/beta activation',
  'No dependency or lockfile change',
  'No deploy/push',
]) {
  assertTrue(checklist.includes(phrase), `Checklist must record ${phrase}.`);
}

const statusMatch = result.match(/## 1\. Status\s*\n\s*(Prepared|Partial|Executed|Blocked)\b/i);
assertTrue(Boolean(statusMatch), 'Result doc must record status as Prepared, Partial, Executed, or Blocked.');
const status = statusMatch?.[1] ?? 'not found';
assertTrue(result.includes('b3a4679'), 'Result doc must record baseline b3a4679.');
assertTrue(result.includes('Latest feature commit: `1b2a0f2`'), 'Result doc must record feature commit.');
assertTrue(result.includes('Latest evidence commit: `e6c7679`'), 'Result doc must record evidence commit.');
assertTrue(result.includes('Handoff commit: `b3a4679`'), 'Result doc must record handoff commit.');
assertTrue(result.includes('What Was Executed'), 'Result doc must record executed scope.');
assertTrue(result.includes('What Was Not Executed'), 'Result doc must record not executed scope.');
assertTrue(/pending final local validation|passed|not executed/i.test(result), 'Result doc must record validation results or not executed.');
assertTrue(result.includes('No runtime source changed.'), 'Result doc must record no runtime/source changes.');
assertTrue(result.includes('No API route changed.'), 'Result doc must record no API route changes.');
assertTrue(result.includes('No UI changed.'), 'Result doc must record no UI changes.');
assertTrue(result.includes('No provider/helper source changed.'), 'Result doc must record no provider changes.');
assertTrue(result.includes('No dependency/lockfile change occurred.'), 'Result doc must record no dependency/lockfile changes.');
assertTrue(result.includes('No deploy/push occurred.'), 'Result doc must record no deploy/push.');

if (status === 'Partial') {
  assertTrue(result.includes('Phase 3FE-A-MANUAL-QA-RUN'), 'Partial result must recommend manual QA completion or MANUAL-QA-RUN.');
}
if (status === 'Executed') {
  assertTrue(result.includes('Phase 3FF-A-PLAN'), 'Executed pass should recommend planning-only Phase 3FF-A-PLAN.');
}
if (status === 'Blocked') {
  assertTrue(result.includes('Blocked'), 'Blocked status must explain blocked state.');
}

const changelogStatusMatch = changelog.match(/## Phase 3FE-A-MANUAL-QA - 2026-07-07[\s\S]*?- \*\*Status\*\*: (Prepared|Partial|Executed|Blocked)/);
assertTrue(Boolean(changelogStatusMatch), 'Changelog must record manual QA status.');
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
  assertTrue(!regex.test(changedText), `Manual QA text must not contain ${label}.`);
}

const diffNames = new Set();
const collectDiff = (command) => {
  try {
    const output = execSync(command, { cwd: root, encoding: 'utf8' }).trim();
    if (output) output.split(/\r?\n/).forEach((line) => diffNames.add(line));
  } catch {
    // The content checks remain deterministic even outside a git checkout.
  }
};
collectDiff('git diff --name-only b3a4679');
collectDiff('git diff --cached --name-only');
const allowed = new Set([checklistPath, resultPath, changelogPath, checkerPath, packagePath]);
const unexpected = [...diffNames].filter((file) => !allowed.has(file));
assertTrue(unexpected.length === 0, `Only manual QA docs, checker, changelog, and package.json may change. Unexpected: ${unexpected.join(', ')}`);

if (assertions < 45) failures.push(`Checker assertion count too low: ${assertions}.`);

if (failures.length) {
  console.error(`Phase 3FE-A-MANUAL-QA check FAILED: ${failures.length}/${assertions} assertions failed.`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FE-A-MANUAL-QA check passed: ${assertions}/${assertions} assertions passed. Status: ${status}.`);
