// Phase 3GG-I-QA contract checker.
// Verifies the owner-local browser QA documentation for the Chart AI KIS + LLM summary UI is
// present and complete, and that this QA-only phase introduced no source diff outside the
// allowed documentation/package.json/changelog files -- no KIS provider diff, no forbidden-scope
// diff, no lockfile diff, no .env/.env.local diff, all measured against the Phase 3GG-I-FAST
// baseline.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '5e51712e34081e5cf5aaf2f810af2b155baba8a1';

const QA_CHECKLIST_DOC = 'docs/planning/phase_3gg_i_qa_owner_local_browser_qa_checklist_v0.1.md';
const QA_RESULT_DOC = 'docs/planning/phase_3gg_i_qa_owner_local_browser_qa_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3gg_i_qa_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [QA_CHECKLIST_DOC, QA_RESULT_DOC, CHECKER_SELF, CHANGELOG, PACKAGE_JSON];

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
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

const RESULT_DOC_REQUIRED_TOKENS = [
  `Baseline: ${BASELINE}`,
  'Branch: rebuild/phase-1-ia-shell',
  'hidden',
  'ownerLocalKisLlm=1',
  'no auto-fetch',
  'H route',
  'credentialExposed`: false',
  'rawKisPayloadExposed`: false',
  'rawLlmResponseExposed`: false',
  'currentPriceNumericExposed`: false',
  'Mobile result',
  'Not pushed',
  'Not deployed',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-I-QA - 2026-07-11',
  '### Owner-local Browser QA for Chart AI KIS + LLM Summary UI',
  '3GG-I-FAST',
  'ownerLocalKisLlm=1',
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
for (const file of CORE_DELIVERABLES) {
  assert(exists(file), `Required file missing: ${file}`);
}

// --- 2. package.json script wiring ---
const pkg = JSON.parse(read(PACKAGE_JSON));
assert(
  pkg.scripts && pkg.scripts['check:phase-3gg-i-qa'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-i-qa" script entry',
);

// --- 3. QA checklist doc covers all 6 cases ---
const checklistDoc = exists(QA_CHECKLIST_DOC) ? read(QA_CHECKLIST_DOC) : '';
for (const caseHeader of [
  '## Case 1',
  '## Case 2',
  '## Case 3',
  '## Case 4',
  '## Case 5',
  '## Case 6',
]) {
  assert(checklistDoc.includes(caseHeader), `QA checklist doc missing required section: ${caseHeader}`);
}
assert(/Pass\/Fail/i.test(checklistDoc), 'QA checklist doc must record Pass/Fail per case.');

// --- 4. Result doc required sections/tokens ---
const resultDoc = exists(QA_RESULT_DOC) ? read(QA_RESULT_DOC) : '';
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

// --- 6. No forbidden-scope diff ---
let forbiddenDiffOutput = '';
try {
  forbiddenDiffOutput = runGit(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]).trim();
} catch {
  forbiddenDiffOutput = '<git diff failed>';
}
assert(forbiddenDiffOutput === '', `Forbidden diff is not empty: ${forbiddenDiffOutput}`);

// --- 7. No lockfile diff, no .env/.env.local diff ---
let lockAndEnvDiff = '';
try {
  lockAndEnvDiff = runGit([
    'diff',
    '--name-only',
    BASELINE,
    '--',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    '.env',
    '.env.local',
  ]).trim();
} catch {
  lockAndEnvDiff = '<git diff failed>';
}
assert(lockAndEnvDiff === '', `Lockfile/.env diff must be empty: ${lockAndEnvDiff}`);

// --- 8. Changelog entry present, prepended above the Phase 3GG-I-FAST entry ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-I-QA - 2026-07-11');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-I-QA entry header');
const changelogSection =
  changelogHeaderIndex === -1 ? '' : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
const iFastHeaderIndex = changelog.indexOf('## Phase 3GG-I-FAST - 2026-07-11');
assert(
  iFastHeaderIndex === -1 || (changelogHeaderIndex !== -1 && changelogHeaderIndex < iFastHeaderIndex),
  'Phase 3GG-I-QA changelog entry must be prepended above the Phase 3GG-I-FAST entry',
);

// --- 9. No unexpected working-tree changes outside this phase's scope ---
const ALLOWED_MODIFIED_FILES = new Set(CORE_DELIVERABLES);
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
for (const file of [QA_CHECKLIST_DOC, QA_RESULT_DOC]) {
  const src = exists(file) ? read(file) : '';
  assert(!/vercel deploy|git push/i.test(src), `${file} must not contain a deploy/push marker.`);
  assert(
    !/publicActivation|betaActivation|internalQaActivation|PUBLIC_ACTIVATION=1|BETA_ACTIVATION=1/.test(src),
    `${file} must not contain an activation token.`,
  );
}

// --- 11. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-I-QA check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-I-QA check PASS: ${assertions}/${assertions} assertions passed.`);
}
