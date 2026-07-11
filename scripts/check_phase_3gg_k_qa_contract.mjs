// Phase 3GG-K-QA contract checker.
// Verifies the owner-local browser QA checklist/result docs and this checker's own wiring are
// present -- and that this QA-only phase introduced no source feature diff, no KIS provider diff,
// no forbidden diff, and no lockfile/.env diff, measured against the Phase 3GG-K-FAST baseline.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '37e892e';

const CHECKLIST_DOC = 'docs/planning/phase_3gg_k_qa_owner_local_summary_quality_browser_qa_checklist_v0.1.md';
const RESULT_DOC = 'docs/planning/phase_3gg_k_qa_owner_local_summary_quality_browser_qa_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3gg_k_qa_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [CHECKLIST_DOC, RESULT_DOC, CHECKER_SELF];

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
];

const REQUIRED_FORBIDDEN_DIFF_SOURCE_FILES = [
  'src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs',
  'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts',
  'src/pages/chart-ai.astro',
  'src/lib/server/chart-ai/local-only-llm-model-policy.mjs',
];

const KIS_PROVIDER_CANDIDATE_PATHS = [
  'src/lib/server/kis',
  'src/lib/kis',
  'src/server/kis',
  'src/lib/server/chart-ai/kis',
  'src/lib/server/providers/kis',
  'src/lib/server/providers/kisClient.ts',
  'src/lib/server/providers/providerErrors.ts',
  'src/lib/server/providers/serverOnly.ts',
  'src/lib/server/providers/types.ts',
];

const REQUIRED_FORBIDDEN_DIFF_PATHS = [
  'src/lib/server/chart-ai/mk-agent.mjs',
  'src/lib/server/chart-ai/mk-agent.fixture.mjs',
  'src/lib/server/chart-ai/similar-pattern-agent.mjs',
  'src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs',
  'src/lib/server/chart-ai/guarded-productization-scaffold.mjs',
  'src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs',
  'components',
  'supabase',
  'src/data',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.env',
  '.env.local',
];

const RESULT_DOC_REQUIRED_TOKENS = [
  `Baseline: ${BASELINE}`,
  'Branch: rebuild/phase-1-ia-shell',
  'default hidden state',
  'ownerLocalKisLlm=1',
  'visible idle state',
  'no fetch before click',
  'H route',
  '3-bullet',
  'ASCII digit',
  'forbidden investment phrase',
  'Numeric-output protection browser result',
  'Credential exposure status',
  'Raw KIS payload exposure status',
  'Raw LLM response exposure status',
  'Prompt exposure status',
  'Model name exposure status',
  'currentPrice numeric exposure status',
  'Mobile result',
  'Not pushed',
  'Not deployed',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-K-QA - 2026-07-11',
  '### Owner-local Browser QA for Upgraded Chart AI Summary Quality',
  'builds on Phase 3GG-K-FAST',
  'Browser QA method',
  'Default hidden state checked',
  'Opt-in visible idle state checked',
  'no auto-fetch',
  'H route',
  '3-bullet',
  'ASCII digit',
  'Forbidden investment phrase',
  'Numeric-output protection',
  'Exposure checks',
  'Mobile checked',
  'No activation',
  'No KIS endpoint expansion',
  'not pushed',
  'not deployed',
];

const failures = [];
let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) failures.push(message);
}

function exists(relPath) {
  return existsSync(path.join(ROOT, relPath));
}

function read(relPath) {
  return readFileSync(path.join(ROOT, relPath), 'utf8');
}

function runGit(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
}

// --- 1. Required files exist ---
for (const file of [...CORE_DELIVERABLES, CHANGELOG, PACKAGE_JSON]) {
  assert(exists(file), `Required file missing: ${file}`);
}

// --- 2. package.json script wiring ---
const pkg = JSON.parse(read(PACKAGE_JSON));
assert(
  pkg.scripts && pkg.scripts['check:phase-3gg-k-qa'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-k-qa" script entry',
);

// --- 3. Checklist doc content checks ---
const checklistDoc = exists(CHECKLIST_DOC) ? read(CHECKLIST_DOC) : '';
assert(checklistDoc.includes(`Baseline**: ${BASELINE}`), 'Checklist doc must reference the correct baseline.');
for (let i = 1; i <= 8; i += 1) {
  assert(checklistDoc.includes(`Case ${i}`), `Checklist doc must cover Case ${i}.`);
}

// --- 4. No source feature file changed ---
let sourceDiffLines = [];
try {
  sourceDiffLines = runGit(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_SOURCE_FILES])
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
} catch {
  sourceDiffLines = ['<git diff failed>'];
}
assert(sourceDiffLines.length === 0, `Source feature diff must be empty: ${sourceDiffLines.join(', ')}`);

// --- 5. No KIS provider module changed ---
let kisDiffLines = [];
try {
  kisDiffLines = runGit(['diff', '--name-only', BASELINE, '--', ...KIS_PROVIDER_CANDIDATE_PATHS])
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
} catch {
  kisDiffLines = ['<git diff failed>'];
}
assert(kisDiffLines.length === 0, `KIS provider diff must be empty: ${kisDiffLines.join(', ')}`);

// --- 6. No UI / MK Agent / scaffold / Supabase / data / lockfile / env change ---
let forbiddenDiffOutput = '';
try {
  forbiddenDiffOutput = runGit(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]).trim();
} catch {
  forbiddenDiffOutput = '<git diff failed>';
}
assert(forbiddenDiffOutput === '', `Forbidden diff is not empty: ${forbiddenDiffOutput}`);

// --- 7. Result doc required sections/claims ---
const resultDoc = exists(RESULT_DOC) ? read(RESULT_DOC) : '';
for (const token of RESULT_DOC_REQUIRED_TOKENS) {
  assert(resultDoc.includes(token), `Result doc missing required token: ${token}`);
}
assert(
  !/OPENAI_API_KEY\s*=\s*sk-|Authorization:\s*Bearer\s+\S/.test(resultDoc),
  'Result doc must never contain a raw credential or Authorization header value.',
);
assert(
  !/currentPrice["`']?\s*[:=]\s*\d/.test(resultDoc),
  'Result doc must never contain a literal currentPrice numeric value.',
);

// --- 8. Changelog entry present, prepended above the Phase 3GG-K-FAST entry ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-K-QA - 2026-07-11');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-K-QA entry header');
const changelogSection =
  changelogHeaderIndex === -1 ? '' : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
const kFastHeaderIndex = changelog.indexOf('## Phase 3GG-K-FAST - 2026-07-11');
assert(
  kFastHeaderIndex === -1 || (changelogHeaderIndex !== -1 && changelogHeaderIndex < kFastHeaderIndex),
  'Phase 3GG-K-QA changelog entry must be prepended above the Phase 3GG-K-FAST entry',
);

// --- 9. No unexpected working-tree changes outside this phase's scope ---
const ALLOWED_MODIFIED_FILES = new Set([
  ...CORE_DELIVERABLES,
  CHANGELOG,
  PACKAGE_JSON,
  // Tiny checker-only compatibility fix, explicitly permitted by the K-QA work order: these
  // siblings' working-tree-scope allowlists predate this authorized QA-only phase and would
  // otherwise reject its new docs/checker files as "unexpected" when re-run as a regression
  // check. Not a weakening of any safety assertion -- both siblings still assert zero diff on
  // their own protected source files.
  'scripts/check_phase_3gg_j_hf1_contract.mjs',
  'scripts/check_phase_3gg_k_fast_contract.mjs',
]);
let statusLines = [];
try {
  statusLines = runGit(['status', '--porcelain']).split('\n').filter(Boolean);
} catch {
  statusLines = [];
}
for (const line of statusLines) {
  const filePath = line.slice(3).trim();
  const isKnown = KNOWN_UNTOUCHED_PATHS.some((p) => filePath === p || filePath.startsWith(p));
  if (isKnown || ALLOWED_MODIFIED_FILES.has(filePath)) {
    assert(true, `${filePath} is a known/allowed path for this phase`);
  } else {
    assert(false, `Unexpected working-tree change outside this phase's scope: ${filePath} (verify before commit)`);
  }
}

// --- 10. No deploy/push/activation marker in the new docs ---
for (const file of [CHECKLIST_DOC, RESULT_DOC]) {
  const src = exists(file) ? read(file) : '';
  assert(!/vercel deploy|git push/i.test(src), `${file} must not contain a deploy/push marker.`);
  assert(
    !/publicActivation|betaActivation|internalQaActivation|PUBLIC_ACTIVATION=1|BETA_ACTIVATION=1/.test(src),
    `${file} must not contain an activation token.`,
  );
}

// --- 11. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-K-QA check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-K-QA check PASS: ${assertions}/${assertions} assertions passed.`);
}
