// Phase 3FG-B contract checker.
// Verifies the owner-local guarded productization QA checklist and result
// documents exist, contain the required tokens, are free of forbidden
// investment language / mojibake / secret-like tokens, and that no
// forbidden runtime/source path has changed since the Phase 3FG-A baseline.
// This phase is QA/documentation/checker only: it does not modify scaffold
// source, does not wire the scaffold into UI, and activates no real gate.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '7a3ed70';

const CHECKLIST_DOC = 'docs/planning/phase_3fg_b_owner_local_guarded_productization_qa_checklist_v0.1.md';
const RESULT_DOC = 'docs/planning/phase_3fg_b_owner_local_guarded_productization_qa_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3fg_b_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [CHECKLIST_DOC, RESULT_DOC, CHECKER_SELF];
const MODIFIED_FILES = [CHANGELOG, PACKAGE_JSON];

// Sibling checkers patched during this phase so they keep passing against a
// HEAD that already includes this phase's files/changelog header. No
// protective assertion in any of these files may be weakened; each patch
// may only extend an existing tolerance allowlist. Populated only if
// validation surfaces a genuine compatibility gap (see the Phase 3FG-A
// precedent for the pattern).
const PATCHED_SIBLING_CHECKERS = [
  'scripts/check_phase_3fg_a_contract.mjs',
  'scripts/check_phase_3fg_a_plan_contract.mjs',
  'scripts/check_phase_3ff_a_ui_c_manual_qa_contract.mjs',
  'scripts/check_phase_3ff_a_mk_c_contract.mjs',
  'scripts/check_phase_3ff_a_sp_b_contract.mjs',
  'scripts/check_phase_3ff_a_mk_b_contract.mjs',
  'scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs',
  'scripts/check_phase_3ff_a_ui_a_contract.mjs',
  'scripts/check_phase_3ff_a_mk_a_contract.mjs',
  'scripts/check_phase_3ff_a_sp_a_contract.mjs',
  'scripts/check_phase_3ff_a_plan_contract.mjs',
];

// Files legitimately added by the later Phase 3FG-C UI readiness plan.
// Tolerated here only so this checker keeps passing against a HEAD that
// already includes that phase's deliverables; no protective assertion is
// weakened.
const TOLERATED_LATER_PHASE_FILES = [
  'docs/planning/phase_3fg_c_owner_local_guarded_productization_ui_readiness_plan_v0.1.md',
  'docs/planning/phase_3fg_c_owner_local_guarded_productization_ui_readiness_result_v0.1.md',
  'scripts/check_phase_3fg_c_contract.mjs',
  // Sibling checkers patched as part of Phase 3FG-C's own validation chain
  // (validator-compatibility only; no protective assertion weakened).
  'scripts/check_phase_3fg_a_contract.mjs',
  'scripts/check_phase_3fg_a_plan_contract.mjs',
  'scripts/check_phase_3ff_a_handoff_a_contract.mjs',
  'scripts/check_phase_3ff_a_housekeeping_a_contract.mjs',
  'scripts/check_phase_3ff_a_ui_c_manual_qa_contract.mjs',
  'scripts/check_phase_3ff_a_mk_c_contract.mjs',
  'scripts/check_phase_3ff_a_sp_b_contract.mjs',
  'scripts/check_phase_3ff_a_mk_b_contract.mjs',
  'scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs',
  'scripts/check_phase_3ff_a_ui_a_contract.mjs',
  'scripts/check_phase_3ff_a_mk_a_contract.mjs',
  'scripts/check_phase_3ff_a_sp_a_contract.mjs',
  // Files legitimately added/modified by the later Phase 3FG-D static UI
  // shell (validator-compatibility only; no protective assertion weakened).
  'docs/planning/phase_3fg_d_owner_local_guarded_productization_ui_static_shell_result_v0.1.md',
  'scripts/smoke_phase_3fg_d_owner_local_guarded_productization_ui_static_shell.mjs',
  'scripts/check_phase_3fg_d_contract.mjs',
  'src/pages/chart-ai.astro',
  // Files legitimately added by the later Phase 3FG-E browser QA pass
  // (validator-compatibility only; no protective assertion weakened).
  'docs/planning/phase_3fg_e_owner_local_guarded_productization_static_shell_browser_qa_checklist_v0.1.md',
  'docs/planning/phase_3fg_e_owner_local_guarded_productization_static_shell_browser_qa_result_v0.1.md',
  'scripts/check_phase_3fg_e_contract.mjs',
  // Phase 3FG-D-HF1's own deliverables (validator-compatibility only; no
  // protective assertion weakened).
  'docs/planning/phase_3fg_d_hf1_static_shell_hidden_default_fix_result_v0.1.md',
  'scripts/check_phase_3fg_d_hf1_contract.mjs',
  // Phase 3GG-A-PLAN's deliverables (planning-only; no runtime/source change),
  // tolerated for the same reason.
  'docs/planning/phase_3gg_a_plan_live_kis_llm_approval_runtime_binding_v0.1.md',
  'docs/planning/phase_3gg_a_plan_result_v0.1.md',
  'scripts/check_phase_3gg_a_plan_contract.mjs',
  // Phase 3GG-B (documentation/checker-only; no runtime/source change).
  'docs/planning/phase_3gg_b_live_kis_approval_gate_checklist_v0.1.md',
  'docs/planning/phase_3gg_b_live_kis_approval_gate_checklist_result_v0.1.md',
  'scripts/check_phase_3gg_b_contract.mjs',
  // Phase 3GG-B-AUDIT (documentation/checker-only; no runtime/source change).
  'docs/planning/phase_3gg_b_audit_live_kis_gate_evidence_review_v0.1.md',
  'docs/planning/phase_3gg_b_audit_live_kis_gate_evidence_review_result_v0.1.md',
  'scripts/check_phase_3gg_b_audit_contract.mjs',
  // Phase 3GG-B-REVIEW-RECORD (documentation/checker-only; no runtime/source change).
  'docs/planning/phase_3gg_b_review_record_live_kis_owner_review_v0.1.md',
  'docs/planning/phase_3gg_b_review_record_result_v0.1.md',
  'scripts/check_phase_3gg_b_review_record_contract.mjs',
  // Phase 3GG-C (documentation/checker-only; no runtime/source change).
  'docs/planning/phase_3gg_c_live_kis_activation_decision_record_v0.1.md',
  'docs/planning/phase_3gg_c_live_kis_activation_decision_record_result_v0.1.md',
  'scripts/check_phase_3gg_c_contract.mjs',
];

// Phase 3FG-D is the specific, documented, approved later phase authorized
// to modify src/pages/chart-ai.astro (an additive-only static UI shell).
// This checker's forbidden-diff assertion is patched to tolerate exactly
// that one known path while still failing if any other forbidden path
// (scaffold source, API routes, Supabase, lockfiles, .env, etc.) changes.
const TOLERATED_FORBIDDEN_DIFF_EXCEPTIONS = ['src/pages/chart-ai.astro'];

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
];

const REQUIRED_FORBIDDEN_DIFF_PATHS = [
  'src/pages/chart-ai.astro',
  'src/lib/server/chart-ai/guarded-productization-scaffold.mjs',
  'src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs',
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

const CHECKLIST_REQUIRED_TOKENS = [
  'Phase 3FG-B',
  '7a3ed70',
  'Phase 3FG-A',
  'command-line QA only',
  'no UI wiring',
  'no API route activation',
  'No live KIS',
  'No LLM',
  'all real gates off',
  'owner-local',
  'scaffoldOnlyAcknowledged',
  'fail-closed',
  'beta attempt',
  'public attempt',
  'live KIS attempt',
  'LLM attempt',
  'real auth attempt',
  'deterministic',
];

const RESULT_DOC_REQUIRED_TOKENS = [
  'Status: Executed.',
  'Baseline: 7a3ed70.',
  'Phase 3FG-A',
  'owner-local fixture without scaffoldOnlyAcknowledged',
  'owner-local fixture with explicit scaffoldOnlyAcknowledged',
  'beta attempt',
  'public attempt',
  'live KIS attempt',
  'LLM attempt',
  'real auth attempt',
  'No runtime source changed.',
  'No live KIS.',
  'No LLM.',
  'No public/beta activation.',
  'forbidden diff: empty',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3FG-B - 2026-07-09',
  'Owner-local Guarded Productization QA',
  'All Real Gates Off',
  '7a3ed70',
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

// Constructed from a numeric code point so this checker's own text can
// never trip its own mojibake scan.
const MOJIBAKE_MARKERS = [String.fromCharCode(0xfffd)];

const SECRET_LIKE_PATTERNS = [
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
  /access_token/i,
  /appsecret/i,
  /service_role/i,
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
  pkg.scripts && pkg.scripts['check:phase-3fg-b'] === 'node scripts/check_phase_3fg_b_contract.mjs',
  'package.json is missing the exact "check:phase-3fg-b" script entry',
);

// --- 3. Checklist doc contains all required tokens ---
const checklistDoc = read(CHECKLIST_DOC);
for (const token of CHECKLIST_REQUIRED_TOKENS) {
  assert(checklistDoc.includes(token), `Checklist doc missing required token: ${token}`);
}

// --- 4. Result doc contains all required tokens ---
const resultDoc = read(RESULT_DOC);
for (const token of RESULT_DOC_REQUIRED_TOKENS) {
  assert(resultDoc.includes(token), `Result doc missing required token: ${token}`);
}

// --- 5. Changelog contains all required tokens, as the newest entry ---
const changelog = read(CHANGELOG);
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelog.includes(token), `Changelog missing required token: ${token}`);
}
// Tolerates only the known later Phase 3FG-C header prepended above this
// entry (not a strict "must be the top entry" check, since Phase 3FG-C
// legitimately added its own header above this one).
const TOLERATED_HEADERS_ABOVE_3FG_B = [
  '## Phase 3FG-C - 2026-07-09',
  '## Phase 3FG-D - 2026-07-09',
  '## Phase 3FG-E - 2026-07-09',
  '## Phase 3FG-D-HF1 - 2026-07-09',
  '## Phase 3GG-A-PLAN - 2026-07-09',
  '## Phase 3GG-B - 2026-07-09',
  '## Phase 3GG-C - 2026-07-09',
  '## Phase 3GG-B-AUDIT - 2026-07-09',
  '## Phase 3GG-B-REVIEW-RECORD - 2026-07-09',
];
const phaseHeaderIndex = changelog.indexOf('## Phase 3FG-B - 2026-07-09');
const precedingHeaders = phaseHeaderIndex >= 0 ? changelog.slice(0, phaseHeaderIndex).match(/^## Phase .*$/gm) || [] : [];
const unexpectedPrecedingHeaders = precedingHeaders.filter(
  (header) => !TOLERATED_HEADERS_ABOVE_3FG_B.includes(header.trim()),
);
assert(
  phaseHeaderIndex >= 0 && unexpectedPrecedingHeaders.length === 0,
  `Phase 3FG-B changelog entry has unexpected headers above it: ${unexpectedPrecedingHeaders.join(', ')}`,
);
const nextHeaderIndex = phaseHeaderIndex >= 0 ? changelog.indexOf('\n## Phase ', phaseHeaderIndex + 1) : -1;
assert(nextHeaderIndex > phaseHeaderIndex, 'Could not locate the end of the Phase 3FG-B changelog section');
const changelogSection =
  phaseHeaderIndex >= 0 && nextHeaderIndex > phaseHeaderIndex ? changelog.slice(phaseHeaderIndex, nextHeaderIndex) : '';
assert(changelogSection.includes('7a3ed70'), 'Phase 3FG-B changelog entry must reference the 7a3ed70 baseline');

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

// --- 9. Forbidden diff paths are empty since baseline (scaffold source, UI, API, Supabase, KIS/MK agents, lockfiles, .env) ---
const forbiddenDiff = gitLines(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]).filter(
  (file) => !TOLERATED_FORBIDDEN_DIFF_EXCEPTIONS.includes(file),
);
assert(forbiddenDiff.length === 0, `Forbidden diff paths changed since baseline: ${forbiddenDiff.join(', ')}`);

// --- 10. No mojibake patterns in new docs/checker ---
for (const [label, text] of [
  [CHECKLIST_DOC, checklistDoc],
  [RESULT_DOC, resultDoc],
]) {
  for (const marker of MOJIBAKE_MARKERS) {
    assert(!text.includes(marker), `Possible mojibake pattern detected in ${label}`);
  }
}

// --- 11. No forbidden investment language present as approved text ---
// (This checker's own source is intentionally excluded: it must contain
// these phrases literally as pattern-match strings in order to test that
// they never appear in real output.)
for (const [label, text] of [
  [CHECKLIST_DOC, checklistDoc],
  [RESULT_DOC, resultDoc],
  [CHANGELOG, changelogSection],
]) {
  for (const phrase of FORBIDDEN_INVESTMENT_PHRASES) {
    assert(!text.includes(phrase), `Forbidden investment phrase found in ${label}: ${phrase}`);
  }
}

// --- 12. New QA docs/checker must not contain raw secrets, emails, JWT-like values, or secret-token keywords ---
for (const [label, text] of [
  [CHECKLIST_DOC, checklistDoc],
  [RESULT_DOC, resultDoc],
]) {
  for (const pattern of SECRET_LIKE_PATTERNS) {
    assert(!pattern.test(text), `Secret-like or private-identifier pattern found in ${label}: ${pattern}`);
  }
}

if (failures.length) {
  console.error(`Phase 3FG-B check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3FG-B check PASS: ${assertions}/${assertions} assertions passed.`);
}
