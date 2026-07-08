import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const BASELINE = 'a191dfc';
const RESULT_DOC = 'docs/planning/phase_3fe_a_manual_qa_run_closeout_result_v0.1.md';
const CHECKLIST = 'docs/planning/phase_3fe_a_manual_qa_run_closeout_owner_visual_checklist_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_contract.mjs';
const PACKAGE_JSON = 'package.json';
const EVIDENCE_RESULT = 'docs/planning/phase_3fe_a_manual_qa_run_closeout_evidence_result_v0.1.md';
const EVIDENCE_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_contract.mjs';

const allowedChangedFiles = new Set([
  RESULT_DOC,
  CHECKLIST,
  CHANGELOG,
  CHECKER,
  PACKAGE_JSON,
]);
const toleratedLaterPhaseFiles = new Set([
  'docs/planning/phase_3fe_a_manual_qa_run_closeout_hf1_result_v0.1.md',
  EVIDENCE_RESULT,
  'scripts/check_phase_3fe_a_manual_qa_run_closeout_hf1_contract.mjs',
  EVIDENCE_CHECKER,
  'scripts/check_phase_3fe_a_manual_qa_run_hf1_contract.mjs',
  'scripts/check_phase_3fe_a_manual_qa_run_retry_contract.mjs',
  'scripts/check_phase_3fe_a_manual_qa_run_result_contract.mjs',
  'scripts/check_phase_3fe_a_manual_qa_result_contract.mjs',
  'scripts/check_phase_3fe_a_handoff_chart_ai_new_chat_package.mjs',
  'docs/planning/phase_3ff_a_sp_a_result_v0.1.md',
  'scripts/check_phase_3ff_a_sp_a_contract.mjs',
  'scripts/smoke_phase_3ff_a_sp_a_similar_pattern_agent_deterministic_fixture_engine.mjs',
  'src/lib/server/chart-ai/similar-pattern-agent.mjs',
  'src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs',
  'docs/planning/phase_3ff_a_mk_a_result_v0.1.md',
  'scripts/check_phase_3ff_a_mk_a_contract.mjs',
  'scripts/smoke_phase_3ff_a_mk_a_deterministic_report_contract.mjs',
  'src/lib/server/chart-ai/mk-agent.mjs',
  'src/lib/server/chart-ai/mk-agent.fixture.mjs',
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

const result = exists(RESULT_DOC) ? read(RESULT_DOC) : '';
const checklist = exists(CHECKLIST) ? read(CHECKLIST) : '';
const changelog = exists(CHANGELOG) ? read(CHANGELOG) : '';
const checker = exists(CHECKER) ? read(CHECKER) : '';
const packageJson = exists(PACKAGE_JSON) ? JSON.parse(read(PACKAGE_JSON)) : {};

const resultStatus = result.match(/- Status: (Prepared|Partial|Closed|Blocked)\./)?.[1] ?? null;
const changelogStatus = changelog.match(/## Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT - 2026-07-07[\s\S]*?- \*\*Status\*\*: (Prepared|Partial|Closed|Blocked)(?:\.| after)/)?.[1] ?? null;

assert(exists(RESULT_DOC), 'Closeout result document must exist.');
assert(exists(CHECKLIST), 'Owner visual checklist must exist.');
assert(exists(CHECKER), 'Closeout checker must exist.');
assert(exists(CHANGELOG), 'Planning changelog must exist.');
assert(exists(PACKAGE_JSON), 'package.json must exist.');
assert(packageJson.scripts?.['check:phase-3fe-a-manual-qa-run-closeout'] === 'node scripts/check_phase_3fe_a_manual_qa_run_closeout_contract.mjs', 'Package script must be exact.');
assert(changelog.includes('Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT'), 'Changelog must contain closeout phase entry.');
assert(changelog.includes('Owner Visual Browser QA Closeout for KIS OHLC Fixture Mode'), 'Changelog must contain closeout title.');
assert(['Prepared', 'Partial', 'Closed', 'Blocked'].includes(resultStatus), 'Result doc must record a valid closeout status.');
assert(changelogStatus === resultStatus, 'Changelog status must match result doc status.');

for (const token of [
  'Current baseline before closeout: `a191dfc`',
  'Latest completed phase before closeout: `Phase 3FE-A-MANUAL-QA-RUN-RETRY`',
  'Phase 3FE-A feature commit: `1b2a0f2`',
  'Phase 3FE-A-HF1 evidence commit: `e6c7679`',
  'Phase 3FE-A-HANDOFF commit: `b3a4679`',
  'Phase 3FE-A-MANUAL-QA commit: `0e02130`',
  'Phase 3FE-A-MANUAL-QA-RUN-HF1 commit: `fb34d72`',
  'Phase 3FE-A-MANUAL-QA-RUN-RETRY commit: `a191dfc`',
  'Branch: `rebuild/phase-1-ia-shell`',
]) {
  assert(result.includes(token), `Result doc must include baseline token: ${token}`);
  assert(checklist.includes(token), `Checklist must include baseline token: ${token}`);
}

for (const section of [
  '## 1. Status',
  '## 2. Purpose',
  '## 3. Baseline',
  '## 4. Evidence reviewed',
  '## 5. Visual QA closeout results',
  '## 6. Static validation results',
  '## 7. What was executed',
  '## 8. What was not executed',
  '## 9. Security and boundary checks',
  '## 10. Findings',
  '## 11. Changed files',
  '## 12. Not completed / deferred',
  '## 13. Recommended next phase',
]) {
  assert(result.includes(section), `Result doc must include ${section}.`);
}

for (const section of [
  '## 1. Purpose',
  '## 2. Baseline',
  '## 3. Preconditions',
  '## 4. Safety boundaries',
  '## 5. Owner visual QA cases',
  '## 6. Expected safe visual properties',
  '## 7. Pass/fail criteria',
  '## 8. Evidence recording template',
  '## 9. Owner sign-off template',
  '## 10. Next-step decision matrix',
]) {
  assert(checklist.includes(section), `Checklist must include ${section}.`);
}

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
  assert(checklist.includes(visualCase), `Checklist must include visual case ${visualCase}.`);
}

for (const urlToken of [
  '`/chart-ai`',
  '`/chart-ai?chartAiMockLoggedOut=1`',
  '`/chart-ai?chartAiMockMaster=1`',
  '`/chart-ai?chartAiMockLoggedOut=1&chartAiMockMaster=1`',
  '`/chart-ai?ownerLocalSimilarPatternRoute=1`',
  'ownerLocalOhlcProviderMode: "kis_ohlc_fixture"',
]) {
  assert(checklist.includes(urlToken), `Checklist must include URL/mode token ${urlToken}.`);
}

for (const boundary of [
  'This checklist does not approve live KIS.',
  'This checklist does not approve LLM.',
  'This checklist does not approve MK AI route activation.',
  'This checklist does not approve Supabase/DB/env/session/JWT runtime activation.',
  'This checklist does not approve public/beta activation.',
  'This checklist does not approve deploy/push.',
  'This checklist does not approve direct Phase 3FF-A implementation.',
]) {
  assert(checklist.includes(boundary), `Checklist must include boundary: ${boundary}`);
}

for (const token of [
  resultStatus === 'Closed' ? 'Owner visual evidence: provided on 2026-07-08' : 'Owner visual evidence: not found',
  resultStatus === 'Closed' ? 'Visual QA: closed from owner-provided screenshot evidence.' : 'Visual QA: not closed',
  resultStatus === 'Closed' ? 'Owner visual QA completed: yes.' : 'owner visual evidence was not found',
  resultStatus === 'Closed' ? 'Status: Closed' : 'Status: Prepared',
  resultStatus === 'Closed' ? 'No visual issues were found.' : 'owner execution of the visual checklist',
]) {
  assert(result.includes(token), `Result doc must record evidence/status token: ${token}`);
}

const expectedCaseResults = resultStatus === 'Closed'
  ? [
    '| Default `/chart-ai` | PASS |',
    '| Mocked logged-out mode | PASS |',
    '| Mocked master mode | PASS |',
    '| Logged-out precedence | PASS |',
    '| Owner-local Similar Pattern route-backed flow | PASS |',
    '| Explicit KIS OHLC fixture mode UI | NOT EXPOSED IN UI |',
    '| MK AI mocked state | PASS |',
    '| General visual safety | PASS |',
  ]
  : [
    '| Default `/chart-ai` | NOT CONFIRMED |',
    '| Mocked logged-out mode | NOT CONFIRMED |',
    '| Mocked master mode | NOT CONFIRMED |',
    '| Logged-out precedence | NOT CONFIRMED |',
    '| Owner-local Similar Pattern route-backed flow | NOT CONFIRMED |',
    '| Explicit KIS OHLC fixture mode UI | NOT CONFIRMED |',
    '| MK AI mocked state | NOT CONFIRMED |',
    '| General visual safety | NOT CONFIRMED |',
  ];
for (const caseResult of expectedCaseResults) {
  assert(result.includes(caseResult), `Result doc must record closeout case result: ${caseResult}`);
}

for (const command of [
  '`npm run check:phase-3fe-a-manual-qa-run-closeout`: passed.',
  '`npm run check:phase-3fe-a-manual-qa-run-retry`: passed.',
  '`npm run check:phase-3fe-a-manual-qa-run-hf1`: passed.',
  '`npm run check:phase-3fe-a-manual-qa-run-result`: passed.',
  '`npm run check:phase-3fe-a-manual-qa-result`: passed.',
  '`npm run check:phase-3fe-a-handoff-chart-ai-new-chat-package`: passed.',
  '`npm run check:phase-3fe-a-kis-ohlc-provider-owner-local-integration`: passed.',
  '`npm run smoke:phase-3fe-a-kis-ohlc-provider-owner-local-integration`: passed.',
  '`npm run check:phase-3fd-j-similar-pattern-route-owner-local-activation`: passed.',
  '`npm run smoke:phase-3fd-j-similar-pattern-route-owner-local-activation`: passed.',
  '`npm run check:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off`: passed.',
  '`npm run smoke:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off`: passed.',
  '`npm run build`: passed.',
  '`git diff --check`: passed.',
]) {
  assert(result.includes(command), `Result doc must record validation command: ${command}`);
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
  assert(result.includes(boundary), `Result doc must include boundary: ${boundary}`);
}

assert(changelog.includes('Baseline**: `a191dfc`'), 'Changelog must record closeout baseline.');
assert(changelog.includes('Close out or prepare closeout for the remaining owner visual/client-side browser QA limitation'), 'Changelog must record closeout purpose.');
assert(changelog.includes('owner visual QA closeout checklist'), 'Changelog must record checklist scope.');
assert(changelog.includes('actual owner evidence summary'), 'Changelog must reference owner evidence summary.');
assert(changelog.includes('no runtime/source/API/UI/provider changes'), 'Changelog must preserve no runtime/source policy.');
assert(changelog.includes('no live KIS'), 'Changelog must preserve no live KIS policy.');
assert(changelog.includes('no LLM'), 'Changelog must preserve no LLM policy.');
assert(changelog.includes('no MK AI route activation'), 'Changelog must preserve no MK AI route policy.');
assert(changelog.includes('no Supabase/DB/env/session/JWT'), 'Changelog must preserve Supabase/DB/env/session/JWT policy.');
assert(changelog.includes('no public/beta activation'), 'Changelog must preserve public/beta policy.');
assert(changelog.includes('no dependency/lockfile change'), 'Changelog must preserve dependency policy.');
assert(changelog.includes('no deploy/push'), 'Changelog must preserve deploy/push policy.');

const currentHead = runGit(['rev-parse', '--short', 'HEAD']);
if (currentHead === BASELINE) {
  const diffChanged = runGit(['diff', '--name-only', BASELINE]).split(/\r?\n/).filter(Boolean);
  const statusChanged = runGit(['status', '--short'])
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim())
    .filter((file) => allowedChangedFiles.has(file));
  const changedFiles = [...new Set([...diffChanged, ...statusChanged])];
  const unexpected = changedFiles.filter((file) => !allowedChangedFiles.has(file) && !toleratedLaterPhaseFiles.has(file));
  assert(unexpected.length === 0, `Current closeout diff from a191dfc must only contain closeout doc/checklist/checker/changelog/package files. Unexpected: ${unexpected.join(', ')}`);
  for (const file of allowedChangedFiles) {
    assert(changedFiles.includes(file), `Current closeout diff must include ${file}.`);
  }
}

const committedForbiddenDiff = runGit(['diff', '--name-only', BASELINE, 'HEAD', '--', ...forbiddenPaths]);
const workingTreeForbiddenDiff = runGit(['diff', '--name-only', '--', ...forbiddenPaths]);
const stagedForbiddenDiff = runGit(['diff', '--cached', '--name-only', '--', ...forbiddenPaths]);
const toleratedRuntimeArtifacts = new Set([
  'src/lib/server/chart-ai/similar-pattern-agent.mjs',
  'src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs',
  'src/lib/server/chart-ai/mk-agent.mjs',
  'src/lib/server/chart-ai/mk-agent.fixture.mjs',
  'src/pages/chart-ai.astro',
]);
const forbiddenDiff = [...new Set([
  ...committedForbiddenDiff.split(/\r?\n/).filter(Boolean),
  ...workingTreeForbiddenDiff.split(/\r?\n/).filter(Boolean),
  ...stagedForbiddenDiff.split(/\r?\n/).filter(Boolean),
])].filter((file) => !toleratedRuntimeArtifacts.has(file));
assert(forbiddenDiff.length === 0, 'Forbidden runtime/source/dependency/env path drift must be empty.');

const closeoutText = [result, checklist, changelog.split('## Phase 3FE-A-MANUAL-QA-RUN-RETRY - 2026-07-07')[0] ?? '', checker].join('\n');
const noEmailText = [result, checklist, checker, changelog.split('## Phase 3FE-A-MANUAL-QA-RUN-RETRY - 2026-07-07')[0] ?? ''].join('\n');
assert(!/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(noEmailText), 'Closeout changed text must not contain raw email literals.');
assert(!/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i.test(closeoutText), 'Closeout changed text must not contain UUID literals.');
assert(!/(?:api[_-]?key|secret|token|password|credential)\s*[:=]\s*['"][^'"]{4,}/i.test(closeoutText), 'Closeout changed text must not contain credential assignments.');
assert(!/\b(?:createClient|createServerClient)\s*\(/.test(closeoutText), 'Closeout changed text must not create a Supabase client.');
assert(!/\b(?:fetch|axios|XMLHttpRequest|WebSocket)\s*\(/.test(result + checklist), 'Closeout docs must not introduce network code.');

const claimText = [result, checklist, changelog.split('## Phase 3FE-A-MANUAL-QA-RUN-RETRY - 2026-07-07')[0] ?? ''].join('\n');
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
  const unsafeLines = claimText
    .split(/\r?\n/)
    .filter((line) => pattern.test(line) && !/no |not |blocked|must not|does not|without|false|forbidden|remain blocked|remains blocked|not detected/i.test(line));
  assert(unsafeLines.length === 0, `Closeout text must not claim ${label}.`);
}

console.log(
  failures.length
    ? `Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT check FAILED: ${failures.length}/${assertions} assertions failed.`
    : `Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT check passed: ${assertions}/${assertions} assertions passed. Status: ${resultStatus}.`,
);

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
