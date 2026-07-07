import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const RESULT_DOC = 'docs/planning/phase_3fe_a_manual_qa_run_retry_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';
const CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_retry_contract.mjs';
const BASELINE = 'fb34d72';

const requiredChangedFiles = new Set([
  RESULT_DOC,
  CHANGELOG,
  CHECKER,
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

const read = (file) => fs.readFileSync(file, 'utf8');
const exists = (file) => fs.existsSync(file);

const runGit = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

const packageJson = JSON.parse(read(PACKAGE_JSON));
const resultDoc = exists(RESULT_DOC) ? read(RESULT_DOC) : '';
const changelog = exists(CHANGELOG) ? read(CHANGELOG) : '';
const checker = exists(CHECKER) ? read(CHECKER) : '';

const statusMatch = resultDoc.match(/- Status: (Executed|Partial|Blocked|Failed)\./);
const resultStatus = statusMatch?.[1] ?? null;
const changelogStatusMatch = changelog.match(/## Phase 3FE-A-MANUAL-QA-RUN-RETRY[\s\S]*?- \*\*Status\*\*: (Executed|Partial|Blocked|Failed)\./);
const changelogStatus = changelogStatusMatch?.[1] ?? null;

assert(exists(RESULT_DOC), 'Retry result document must exist.');
assert(exists(CHECKER), 'Retry checker must exist.');
assert(exists(CHANGELOG), 'Planning changelog must exist.');
assert(exists(PACKAGE_JSON), 'package.json must exist.');
assert(packageJson.scripts?.['check:phase-3fe-a-manual-qa-run-retry'] === 'node scripts/check_phase_3fe_a_manual_qa_run_retry_contract.mjs', 'Package script must be exact.');
assert(changelog.includes('Phase 3FE-A-MANUAL-QA-RUN-RETRY'), 'Changelog must contain retry phase entry.');
assert(changelog.includes('Owner-local API/Browser QA Retry for KIS OHLC Fixture Mode'), 'Changelog must contain retry title.');
assert(['Executed', 'Partial', 'Blocked', 'Failed'].includes(resultStatus), 'Result doc must record a valid status.');
assert(changelogStatus === resultStatus, 'Changelog status must match result document status.');

for (const token of [
  'Current baseline before retry: `fb34d72`',
  'Latest completed phase before retry: Phase 3FE-A-MANUAL-QA-RUN-HF1',
  'Phase 3FE-A feature commit: `1b2a0f2`',
  'Phase 3FE-A-HF1 evidence commit: `e6c7679`',
  'Phase 3FE-A-HANDOFF commit: `b3a4679`',
  'Phase 3FE-A-MANUAL-QA commit: `0e02130`',
  'Phase 3FE-A-MANUAL-QA-RUN-HF1 commit: `fb34d72`',
  'Branch: `rebuild/phase-1-ia-shell`',
]) {
  assert(resultDoc.includes(token), `Result doc must include baseline token: ${token}`);
}

for (const section of [
  '## 1. Status',
  '## 2. Purpose',
  '## 3. Baseline',
  '## 4. What was executed',
  '## 5. What was not executed',
  '## 6. Static validation results',
  '## 7. Dev server execution',
  '## 8. API QA results',
  '## 9. Browser/browser-like QA results',
  '## 10. Security and boundary checks',
  '## 11. Findings',
  '## 12. Changed files',
  '## 13. Not completed / deferred',
  '## 14. Recommended next phase',
]) {
  assert(resultDoc.includes(section), `Result doc must include section ${section}.`);
}

for (const token of [
  'local owner-only API/browser QA',
  'Static validation: executed and passed.',
  'Local API QA: executed and passed',
  'Browser/browser-like QA: local page fetches executed',
  'Full visual browser QA was not executed.',
  'Full browser visual/client-side interaction QA remains owner-required.',
  'No runtime source changed.',
  'No API route changed.',
  'No UI changed.',
  'No provider/helper source changed.',
  'No dependency/lockfile change occurred.',
  'No deploy/push occurred.',
]) {
  assert(resultDoc.includes(token), `Result doc must record execution/boundary token: ${token}`);
}

for (const commandResult of [
  '`npm run check:phase-3fe-a-manual-qa-run-hf1`: passed, `46/46`',
  '`npm run check:phase-3fe-a-manual-qa-run-result`: passed, `37/37`',
  '`npm run check:phase-3fe-a-manual-qa-result`: passed, `55/55`',
  '`npm run check:phase-3fe-a-handoff-chart-ai-new-chat-package`: passed, `89/89`',
  '`npm run check:phase-3fe-a-kis-ohlc-provider-owner-local-integration`: passed, `188/188`',
  '`npm run smoke:phase-3fe-a-kis-ohlc-provider-owner-local-integration`: passed, `141/141`',
  '`npm run check:phase-3fd-j-similar-pattern-route-owner-local-activation`: passed, `213/213`',
  '`npm run smoke:phase-3fd-j-similar-pattern-route-owner-local-activation`: passed, `377/377`',
  '`npm run check:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off`: passed, `180/180`',
  '`npm run smoke:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off`: passed, `197/197`',
  '`npm run build`: passed.',
  '`git diff --check`: passed.',
]) {
  assert(resultDoc.includes(commandResult), `Result doc must record validation result: ${commandResult}`);
}

for (const apiToken of [
  'Default/synthetic owner-local Similar Pattern',
  'Explicit KIS OHLC fixture mode',
  'Missing explicit activation',
  'Invalid provider fixture mode',
  'Malformed JSON',
  'Anonymous role',
  'Unknown role',
  'MK AI request kind',
  'Malformed provider fixture',
  'Remote host header',
  'No raw KIS payload was returned.',
  'No raw OHLC rows were returned.',
  'No raw provider payload was returned.',
]) {
  assert(resultDoc.includes(apiToken), `Result doc must record API QA token: ${apiToken}`);
}

for (const browserToken of [
  'http://127.0.0.1:4321/chart-ai',
  'chartAiMockLoggedOut=1',
  'chartAiMockMaster=1',
  'ownerLocalSimilarPatternRoute=1',
  'HTTP 200, payload-safety check passed',
  'pre-existing email-like literals',
]) {
  assert(resultDoc.includes(browserToken), `Result doc must record browser/browser-like token: ${browserToken}`);
}

for (const blocked of [
  'No live KIS call occurred.',
  'No LLM call occurred.',
  'No MK AI route activation occurred.',
  'No Supabase client was created.',
  'No DB connection occurred.',
  'No env/session/JWT/cookie/header parsing occurred.',
  'No public/beta activation occurred.',
]) {
  assert(resultDoc.includes(blocked), `Result doc must preserve blocked boundary: ${blocked}`);
}

assert(changelog.includes('Baseline**: `fb34d72`'), 'Changelog must record retry baseline.');
assert(changelog.includes('Retry local owner-only API/browser QA after the HF1 handoff checker scope correction.'), 'Changelog must record purpose.');
assert(changelog.includes('no runtime/source/API/UI/provider changes'), 'Changelog must preserve no runtime/source policy.');
assert(changelog.includes('no live KIS'), 'Changelog must preserve no live KIS policy.');
assert(changelog.includes('no LLM'), 'Changelog must preserve no LLM policy.');
assert(changelog.includes('no MK AI route activation'), 'Changelog must preserve no MK AI route activation policy.');
assert(changelog.includes('no Supabase/DB/env/session/JWT'), 'Changelog must preserve Supabase/DB/env/session/JWT policy.');
assert(changelog.includes('no public/beta activation'), 'Changelog must preserve public/beta policy.');
assert(changelog.includes('no dependency/lockfile change'), 'Changelog must preserve dependency/lockfile policy.');
assert(changelog.includes('no deploy/push'), 'Changelog must preserve deploy/push policy.');

const diffChangedFiles = runGit(['diff', '--name-only', BASELINE]).split(/\r?\n/).filter(Boolean);
const statusChangedFiles = runGit(['status', '--short'])
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => line.slice(3).trim())
  .filter((file) => requiredChangedFiles.has(file));
const changedFiles = [...new Set([...diffChangedFiles, ...statusChangedFiles])];
const unexpected = changedFiles.filter((file) => !requiredChangedFiles.has(file));
assert(unexpected.length === 0, `Only retry doc/checker/changelog/package files may change. Unexpected: ${unexpected.join(', ')}`);
for (const file of requiredChangedFiles) {
  assert(changedFiles.includes(file), `Changed files should include ${file}.`);
}

const forbiddenDiff = runGit(['diff', '--name-only', BASELINE, '--', ...forbiddenPaths]);
assert(forbiddenDiff.length === 0, 'Forbidden runtime/source/dependency/env path diff must be empty.');

const changedText = [resultDoc, changelog].join('\n');
const noEmailText = [resultDoc, checker].join('\n');
const newChangelogEntry = changelog.split('## Phase 3FE-A-MANUAL-QA-RUN-HF1 - 2026-07-07')[0] ?? '';
assert(!/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(noEmailText), 'Retry result/checker must not contain raw email literals.');
assert(!/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(newChangelogEntry), 'Retry changelog entry must not contain raw email literals.');
assert(!/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i.test(changedText), 'Retry changed text must not contain UUID literals.');
assert(!/(?:api[_-]?key|secret|token|password|credential)\s*[:=]\s*['"][^'"]{4,}/i.test(changedText), 'Retry changed text must not contain credential assignments.');
assert(!/\b(?:createClient|createServerClient)\s*\(/.test(changedText), 'Retry changed text must not create a Supabase client.');
assert(!/\b(?:fetch|axios)\s*\(/.test(resultDoc), 'Retry result doc must not introduce network code.');

const unsafeClaimPatterns = [
  ['live KIS active', /live\s+KIS\s+(?:is\s+)?(?:active|enabled|activated|connected)/i],
  ['LLM active', /LLM\s+(?:is\s+)?(?:active|enabled|activated|connected)/i],
  ['MK AI route active', /MK\s+AI\s+route\s+(?:is\s+)?(?:active|enabled|activated|connected)/i],
  ['public beta active', /(?:public|beta)\s+(?:is\s+)?(?:active|enabled|activated|connected)/i],
  ['Supabase active', /Supabase(?:\/DB)?\s+(?:is\s+)?(?:active|enabled|activated|connected)/i],
  ['payload exposed', /(?:raw\s+KIS\s+payload|raw\s+OHLC\s+row|provider\s+payload)\s+(?:is\s+)?(?:exposed|returned|visible)/i],
];
for (const [label, pattern] of unsafeClaimPatterns) {
  const unsafeLines = changedText
    .split(/\r?\n/)
    .filter((line) => pattern.test(line) && !/no |not |blocked|must not|does not|without|false|forbidden|remain blocked|remains blocked|not detected/i.test(line));
  assert(unsafeLines.length === 0, `Retry changed text must not claim ${label}.`);
}

console.log(
  failures.length
    ? `Phase 3FE-A-MANUAL-QA-RUN-RETRY check FAILED: ${failures.length}/${assertions} assertions failed.`
    : `Phase 3FE-A-MANUAL-QA-RUN-RETRY check passed: ${assertions}/${assertions} assertions passed. Status: ${resultStatus}.`,
);

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
