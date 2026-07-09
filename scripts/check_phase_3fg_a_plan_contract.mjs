// Phase 3FG-A-PLAN contract checker.
// Verifies the guarded productization planning package (planning-only, no
// live KIS, no LLM, no public/beta activation) is present, internally
// consistent, and has not touched any forbidden runtime/source path since
// the Phase 3FF-A-HANDOFF-A baseline.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = 'dc36043';

const PLANNING_DOC = 'docs/planning/phase_3fg_a_plan_guarded_productization_v0.1.md';
const RESULT_DOC = 'docs/planning/phase_3fg_a_plan_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3fg_a_plan_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [PLANNING_DOC, RESULT_DOC, CHECKER_SELF];
const MODIFIED_FILES = [CHANGELOG, PACKAGE_JSON];

// Sibling phase checkers patched during this phase so they keep passing
// against a HEAD that already includes the Phase 3FF-A-HANDOFF-A commit
// (7 files: a pre-existing scope-tolerance gap left by that phase) and
// against this phase's own new "## Phase 3FG-A-PLAN" changelog header
// (3 files: the UI-A/UI-B/UI-C manual-QA checkers' changelog-position
// tolerance lists). No protective assertion in any of these files was
// weakened; each patch only extends an existing tolerance allowlist.
const PATCHED_SIBLING_CHECKERS = [
  'scripts/check_phase_3ff_a_handoff_a_contract.mjs',
  'scripts/check_phase_3ff_a_housekeeping_a_contract.mjs',
  'scripts/check_phase_3ff_a_mk_c_contract.mjs',
  'scripts/check_phase_3ff_a_sp_b_contract.mjs',
  'scripts/check_phase_3ff_a_mk_b_contract.mjs',
  'scripts/check_phase_3ff_a_mk_a_contract.mjs',
  'scripts/check_phase_3ff_a_sp_a_contract.mjs',
  'scripts/check_phase_3ff_a_plan_contract.mjs',
  'scripts/check_phase_3ff_a_ui_a_contract.mjs',
  'scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs',
  'scripts/check_phase_3ff_a_ui_c_manual_qa_contract.mjs',
];

// Files delivered by Phase 3FG-A (a later phase built on top of this
// baseline) that legitimately exist in the working tree without being part
// of this phase's own deliverables. Tolerated here only because they were
// reviewed and validated by their own phase's checker
// (scripts/check_phase_3fg_a_contract.mjs); no protective assertion in this
// file is weakened by their presence.
const TOLERATED_LATER_PHASE_FILES = [
  'src/lib/server/chart-ai/guarded-productization-scaffold.mjs',
  'src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs',
  'scripts/smoke_phase_3fg_a_guarded_productization_scaffold_all_gates_off.mjs',
  'scripts/check_phase_3fg_a_contract.mjs',
  'docs/planning/phase_3fg_a_guarded_productization_scaffold_result_v0.1.md',
  'docs/planning/phase_3fg_b_owner_local_guarded_productization_qa_checklist_v0.1.md',
  'docs/planning/phase_3fg_b_owner_local_guarded_productization_qa_result_v0.1.md',
  'scripts/check_phase_3fg_b_contract.mjs',
  'docs/planning/phase_3fg_c_owner_local_guarded_productization_ui_readiness_plan_v0.1.md',
  'docs/planning/phase_3fg_c_owner_local_guarded_productization_ui_readiness_result_v0.1.md',
  'scripts/check_phase_3fg_c_contract.mjs',
];

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
];

const REQUIRED_FORBIDDEN_DIFF_PATHS = [
  'src/pages/chart-ai.astro',
  'src/lib/server/chart-ai/mk-agent.mjs',
  'src/lib/server/chart-ai/mk-agent.fixture.mjs',
  'src/lib/server/chart-ai/similar-pattern-agent.mjs',
  'src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs',
  'pages/api',
  'src/pages/api',
  'components',
  'supabase',
  'src/data',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.env',
  '.env.local',
];

const PLANNING_DOC_REQUIRED_TOKENS = [
  'Phase 3FG-A-PLAN',
  'dc36043',
  'Phase 3FF-A-HANDOFF-A',
  'planning-only',
  'real auth boundary',
  'feature flag',
  'owner-local',
  'beta',
  'public',
  'usage',
  'cooldown',
  'cache',
  'cost',
  'audit',
  'provider boundary',
  'live KIS remains blocked',
  'LLM is not active',
  'fail-closed',
  'No investment advice',
  '과거 유사 흐름은 미래 성과를 보장하지 않습니다',
];

const RESULT_DOC_REQUIRED_TOKENS = [
  'Status: Prepared.',
  'Baseline: dc36043.',
  'No runtime change.',
  'No live KIS.',
  'No LLM.',
  'No public/beta activation.',
  'Phase 3FG-A',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3FG-A-PLAN - 2026-07-09',
  'Guarded Productization Planning',
  'No Live KIS',
  'No LLM',
  'No Public Activation',
  'dc36043',
];

const FORBIDDEN_INVESTMENT_PHRASES = [
  '매수하세요',
  '매도하세요',
  '지금 진입',
  '목표가는',
  '손절가는',
  '강력 추천',
  '상승이 확정',
  '하락이 확정',
];

// Constructed from numeric code points (not written as a literal mojibake
// byte sequence in source) so this checker's own text can never trip its
// own mojibake scan. Represents the well-known cp1252-misread artifact of
// the Korean syllable "한" (U+D55C) when its UTF-8 bytes are misdecoded.
const MOJIBAKE_MARKERS = [
  String.fromCharCode(0xfffd),
  String.fromCharCode(0x00ed, 0x2022, 0x0153),
];

const failures = [];
let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) {
    failures.push(message);
  }
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

function gitLines(args) {
  return runGit(args)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

// Preserves leading characters (e.g. the porcelain status-code column) that
// gitLines() would strip via per-line trim().
function gitRawLines(args) {
  return runGit(args)
    .split('\n')
    .filter((line) => line.trim().length > 0);
}

// --- 1. Required files exist ---
for (const file of [...CORE_DELIVERABLES, CHANGELOG, PACKAGE_JSON]) {
  assert(exists(file), `Required file missing: ${file}`);
}

// --- 2. package.json contains the exact phase script ---
const pkg = JSON.parse(read(PACKAGE_JSON));
assert(
  pkg.scripts && pkg.scripts['check:phase-3fg-a-plan'] === 'node scripts/check_phase_3fg_a_plan_contract.mjs',
  'package.json is missing the exact "check:phase-3fg-a-plan" script entry',
);

// --- 3. Planning doc contains all required tokens ---
const planningDoc = read(PLANNING_DOC);
for (const token of PLANNING_DOC_REQUIRED_TOKENS) {
  assert(planningDoc.includes(token), `Planning doc missing required token: ${token}`);
}

// --- 4. Result doc contains all required tokens ---
const resultDoc = read(RESULT_DOC);
for (const token of RESULT_DOC_REQUIRED_TOKENS) {
  assert(resultDoc.includes(token), `Result doc missing required token: ${token}`);
}

// --- 5. Changelog contains all required tokens ---
const changelog = read(CHANGELOG);
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelog.includes(token), `Changelog missing required token: ${token}`);
}

// --- 5b. Changelog entry is present, tolerating only known later-phase
// headers prepended above it (not a strict "must be the top entry" check,
// since Phase 3FG-A legitimately added its own header above this one) ---
const TOLERATED_HEADERS_ABOVE_3FG_A_PLAN = [
  '## Phase 3FG-A - 2026-07-09',
  '## Phase 3FG-B - 2026-07-09',
  '## Phase 3FG-C - 2026-07-09',
];
const phaseHeaderIndex = changelog.indexOf('## Phase 3FG-A-PLAN - 2026-07-09');
assert(phaseHeaderIndex >= 0, 'Phase 3FG-A-PLAN changelog entry must exist');
const precedingHeaders = phaseHeaderIndex >= 0 ? changelog.slice(0, phaseHeaderIndex).match(/^## Phase .*$/gm) || [] : [];
const unexpectedPrecedingHeaders = precedingHeaders.filter(
  (header) => !TOLERATED_HEADERS_ABOVE_3FG_A_PLAN.includes(header.trim()),
);
assert(
  unexpectedPrecedingHeaders.length === 0,
  `Phase 3FG-A-PLAN changelog entry has unexpected headers above it: ${unexpectedPrecedingHeaders.join(', ')}`,
);
const nextHeaderIndex = phaseHeaderIndex >= 0
  ? changelog.indexOf('\n## Phase ', phaseHeaderIndex + 1)
  : -1;
assert(nextHeaderIndex > phaseHeaderIndex, 'Could not locate the end of the Phase 3FG-A-PLAN changelog section');
const changelogSection = phaseHeaderIndex >= 0 && nextHeaderIndex > phaseHeaderIndex
  ? changelog.slice(phaseHeaderIndex, nextHeaderIndex)
  : '';
assert(changelogSection.includes('Phase 3FF-A-HANDOFF-A') || changelogSection.includes('dc36043'),
  'Phase 3FG-A-PLAN changelog entry must reference the Phase 3FF-A-HANDOFF-A / dc36043 baseline');

// --- 6. HEAD is a descendant of the expected baseline ---
let isDescendant = true;
try {
  execFileSync('git', ['merge-base', '--is-ancestor', BASELINE, 'HEAD'], { cwd: ROOT, stdio: 'ignore' });
} catch {
  isDescendant = false;
}
assert(isDescendant, `HEAD is not a descendant of baseline ${BASELINE}`);

// --- 7. Changed files since baseline are restricted to the allowed set ---
const changedFiles = gitLines(['diff', '--name-only', BASELINE]);
const statusFiles = gitRawLines(['status', '--porcelain', '-uall'])
  .map((line) => line.slice(3).trim())
  .filter(Boolean);
const relevantStatusFiles = statusFiles.filter(
  (file) => !KNOWN_UNTOUCHED_PATHS.some((known) => file === known || file.startsWith(known)),
);
const allChanged = [...new Set([...changedFiles, ...relevantStatusFiles])];
const allowedFiles = new Set([
  ...CORE_DELIVERABLES,
  ...MODIFIED_FILES,
  ...PATCHED_SIBLING_CHECKERS,
  ...TOLERATED_LATER_PHASE_FILES,
]);
const unexpected = allChanged.filter((file) => !allowedFiles.has(file));
assert(unexpected.length === 0, `Unexpected changed files since baseline: ${unexpected.join(', ')}`);

// --- 8. Known untouched paths remain absent from the tracked diff ---
for (const known of KNOWN_UNTOUCHED_PATHS) {
  assert(
    !changedFiles.some((file) => file === known || file.startsWith(known)),
    `Known untouched path unexpectedly present in tracked diff: ${known}`,
  );
}

// --- 9. Forbidden diff paths are empty since baseline ---
const forbiddenDiff = gitLines(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]);
assert(forbiddenDiff.length === 0, `Forbidden diff paths changed since baseline: ${forbiddenDiff.join(', ')}`);

// --- 10. No mojibake patterns in new/changed docs ---
for (const [label, text] of [
  [PLANNING_DOC, planningDoc],
  [RESULT_DOC, resultDoc],
]) {
  for (const marker of MOJIBAKE_MARKERS) {
    assert(!text.includes(marker), `Possible mojibake pattern detected in ${label}`);
  }
}

// --- 11. No forbidden investment language present as approved text ---
// (This checker's own source is intentionally excluded: it must contain
// these phrases literally as pattern-match strings.)
for (const [label, text] of [
  [PLANNING_DOC, planningDoc],
  [RESULT_DOC, resultDoc],
  [CHANGELOG, changelogSection],
]) {
  for (const phrase of FORBIDDEN_INVESTMENT_PHRASES) {
    assert(!text.includes(phrase), `Forbidden investment phrase found in ${label}: ${phrase}`);
  }
}

if (failures.length) {
  console.error(`Phase 3FG-A-PLAN check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3FG-A-PLAN check PASS: ${assertions}/${assertions} assertions passed.`);
}
