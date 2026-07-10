// Phase 3GG-A-PLAN contract checker.
// Verifies the Live KIS / LLM approval and runtime-binding plan (planning-
// only, no live KIS, no LLM, no public/beta activation, no API route, no
// scaffold/source change) is present, internally consistent, and has not
// touched any forbidden runtime/source path since the Phase 3FG-D-HF1
// baseline.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '6fda354ced5281e08ccbcbea1aa9b76894304874';

const PLANNING_DOC = 'docs/planning/phase_3gg_a_plan_live_kis_llm_approval_runtime_binding_v0.1.md';
const RESULT_DOC = 'docs/planning/phase_3gg_a_plan_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3gg_a_plan_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [PLANNING_DOC, RESULT_DOC, CHECKER_SELF];
const MODIFIED_FILES = [CHANGELOG, PACKAGE_JSON];

// Sibling phase checkers patched during this phase so they keep passing
// against a HEAD that already includes this phase's own changes. Populated
// only if the validation chain surfaces a cascade failure; every patch is
// additive-only (no protective assertion weakened or removed).
const PATCHED_SIBLING_CHECKERS = [
  'scripts/check_phase_3fg_e_contract.mjs',
  'scripts/check_phase_3fg_d_hf1_contract.mjs',
  'scripts/check_phase_3fg_d_contract.mjs',
  'scripts/check_phase_3fg_c_contract.mjs',
  'scripts/check_phase_3fg_b_contract.mjs',
  'scripts/check_phase_3fg_a_contract.mjs',
  'scripts/check_phase_3fg_a_plan_contract.mjs',
  'scripts/check_phase_3ff_a_ui_c_manual_qa_contract.mjs',
  'scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs',
  'scripts/check_phase_3ff_a_ui_a_contract.mjs',
  'scripts/check_phase_3ff_a_mk_a_contract.mjs',
  'scripts/check_phase_3ff_a_sp_a_contract.mjs',
];

// Files legitimately created by a later phase (Phase 3GG-B; documentation/
// checker only, no runtime/source change) that this checker must tolerate
// seeing in the diff/status without treating them as unexpected. Pure
// additive allowlist.
const TOLERATED_LATER_PHASE_FILES = [
  'docs/planning/phase_3gg_b_live_kis_approval_gate_checklist_v0.1.md',
  'docs/planning/phase_3gg_b_live_kis_approval_gate_checklist_result_v0.1.md',
  'scripts/check_phase_3gg_b_contract.mjs',
  // Phase 3GG-B additively patched these sibling checkers' own scope-tolerance
  // arrays so the full validation chain runs cleanly once 3GG-B's deliverables
  // exist on top of this checker's baseline. No protective assertion in any
  // of them was weakened; each patch only added new tolerated file entries.
  'scripts/check_phase_3ff_a_handoff_a_contract.mjs',
  'scripts/check_phase_3ff_a_housekeeping_a_contract.mjs',
  'scripts/check_phase_3ff_a_ui_c_manual_qa_contract.mjs',
  'scripts/check_phase_3ff_a_mk_c_contract.mjs',
  'scripts/check_phase_3ff_a_sp_b_contract.mjs',
  'scripts/check_phase_3ff_a_mk_b_contract.mjs',
  'scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs',
  'scripts/check_phase_3ff_a_ui_a_contract.mjs',
  'scripts/check_phase_3ff_a_plan_contract.mjs',
  // Phase 3GG-B-AUDIT additively patched this checker's own scope-tolerance
  // arrays so the full validation chain runs cleanly once 3GG-B-AUDIT's
  // deliverables exist on top of this checker's baseline. No protective
  // assertion was weakened; only new tolerated file entries were added.
  'docs/planning/phase_3gg_b_audit_live_kis_gate_evidence_review_v0.1.md',
  'docs/planning/phase_3gg_b_audit_live_kis_gate_evidence_review_result_v0.1.md',
  'scripts/check_phase_3gg_b_audit_contract.mjs',
  // Phase 3GG-B-REVIEW-RECORD additively patched this checker's own
  // scope-tolerance arrays so the full validation chain runs cleanly once
  // 3GG-B-REVIEW-RECORD's deliverables exist on top of this checker's
  // baseline. No protective assertion was weakened; only new tolerated
  // file entries were added.
  'docs/planning/phase_3gg_b_review_record_live_kis_owner_review_v0.1.md',
  'docs/planning/phase_3gg_b_review_record_result_v0.1.md',
  'scripts/check_phase_3gg_b_review_record_contract.mjs',
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

const PLANNING_DOC_REQUIRED_TOKENS = [
  'Phase 3GG-A-PLAN',
  '6fda354ced5281e08ccbcbea1aa9b76894304874',
  'Phase 3FG-D-HF1',
  'planning-only',
  'No Activation',
  'owner-local',
  'beta',
  'public',
  'Live KIS approval',
  'LLM approval',
  'fail-closed',
  'Live KIS remains blocked',
  'LLM is not active',
  '참고용',
  '매수·매도 추천이 아닙니다',
  '투자 자문이 아닙니다',
  '과거 유사 흐름은 미래 성과를 보장하지 않습니다',
  'Phase 3GG-B',
  'Phase 3FG-F',
  'postponed',
  'No live KIS',
  'No LLM',
  'No public/beta activation',
];

const RESULT_DOC_REQUIRED_TOKENS = [
  'Status: Prepared.',
  'Baseline: 6fda354ced5281e08ccbcbea1aa9b76894304874.',
  'Phase 3FG-D-HF1',
  'Phase 3GG-A-PLAN',
  'Phase 3GG-B',
  'No live KIS.',
  'No LLM.',
  'No public/beta activation.',
  'No API route activation.',
  'No scaffold source change.',
  'No deploy.',
  'No push.',
  'Runtime binding sequence summary',
  'Live KIS approval plan summary',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-A-PLAN - 2026-07-09',
  'Live KIS / LLM Approval',
  'No Activation',
  '6fda354',
  'Phase 3GG-B',
  'Prepared',
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

// Secret/PII-like patterns that must never appear in a planning-only
// document. Regex-based (JWT shape, email shape) plus literal substrings
// for the specific credential-field names named in the work order.
const SECRET_LIKE_CHECKS = [
  { name: 'JWT-like value', regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { name: 'email address', regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
  { name: '"access_token" literal', regex: /access_token/i },
  { name: '"appsecret" literal', regex: /appsecret/i },
  { name: '"service_role" literal', regex: /service_role/i },
];

// Phrases that would falsely claim a real activation occurred. None of
// these may appear anywhere in the planning or result document, even in a
// hypothetical/future-tense framing, since this phase performs no
// activation of any kind.
const FALSE_ACTIVATION_CLAIMS = [
  'live KIS is now active',
  'live KIS has been activated',
  'LLM is now active',
  'LLM has been activated',
  'public access is now available',
  'beta access is now available',
  'API route is now live',
  'API route has been activated',
  'deployed to production',
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
  pkg.scripts && pkg.scripts['check:phase-3gg-a-plan'] === 'node scripts/check_phase_3gg_a_plan_contract.mjs',
  'package.json is missing the exact "check:phase-3gg-a-plan" script entry',
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

// --- 5. Changelog contains all required tokens and its entry sits at the
// top (this is the newest phase in the repository as of its own baseline,
// so no "tolerated headers above" allowance is needed) ---
const changelog = read(CHANGELOG);
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelog.includes(token), `Changelog missing required token: ${token}`);
}
// Tolerates only the known later Phase 3GG-B header prepended above this
// entry (not a strict "must be the first entry" check, since Phase 3GG-B
// legitimately added its own header above this one).
const TOLERATED_HEADERS_ABOVE_3GG_A_PLAN = [
  '## Phase 3GG-B - 2026-07-09',
  '## Phase 3GG-B-AUDIT - 2026-07-09',
  '## Phase 3GG-B-REVIEW-RECORD - 2026-07-09',
];
const phaseHeaderIndex = changelog.indexOf('## Phase 3GG-A-PLAN - 2026-07-09');
assert(phaseHeaderIndex >= 0, 'Phase 3GG-A-PLAN changelog entry must exist');
const precedingHeaders3ggAPlan =
  phaseHeaderIndex >= 0 ? changelog.slice(0, phaseHeaderIndex).match(/^## Phase .*$/gm) || [] : [];
const unexpectedPrecedingHeaders3ggAPlan = precedingHeaders3ggAPlan.filter(
  (header) => !TOLERATED_HEADERS_ABOVE_3GG_A_PLAN.includes(header.trim()),
);
assert(
  unexpectedPrecedingHeaders3ggAPlan.length === 0,
  `Phase 3GG-A-PLAN changelog entry has unexpected headers above it: ${unexpectedPrecedingHeaders3ggAPlan.join(', ')}`,
);
const nextHeaderIndex = phaseHeaderIndex >= 0
  ? changelog.indexOf('\n## Phase ', phaseHeaderIndex + 1)
  : -1;
assert(nextHeaderIndex > phaseHeaderIndex, 'Could not locate the end of the Phase 3GG-A-PLAN changelog section');
const changelogSection = phaseHeaderIndex >= 0 && nextHeaderIndex > phaseHeaderIndex
  ? changelog.slice(phaseHeaderIndex, nextHeaderIndex)
  : '';
assert(changelogSection.includes('Phase 3FG-D-HF1') || changelogSection.includes('6fda354'),
  'Phase 3GG-A-PLAN changelog entry must reference the Phase 3FG-D-HF1 / 6fda354 baseline');

// --- 6. HEAD is a descendant of the expected baseline ---
let isDescendant = true;
try {
  execFileSync('git', ['merge-base', '--is-ancestor', BASELINE, 'HEAD'], { cwd: ROOT, stdio: 'ignore' });
} catch {
  isDescendant = false;
}
assert(isDescendant, `HEAD is not a descendant of baseline ${BASELINE}`);

// --- 6b. Changed files since baseline are restricted to the allowed set ---
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

// --- 6c. Known untouched paths remain absent from the tracked diff ---
for (const known of KNOWN_UNTOUCHED_PATHS) {
  assert(
    !changedFiles.some((file) => file === known || file.startsWith(known)),
    `Known untouched path unexpectedly present in tracked diff: ${known}`,
  );
}

// --- 7. Forbidden diff paths are empty since baseline (no tolerated
// exceptions in this phase: it is not authorized to touch any of them) ---
const forbiddenDiff = gitLines(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]);
assert(forbiddenDiff.length === 0, `Forbidden diff paths changed since baseline: ${forbiddenDiff.join(', ')}`);

// --- 8. No mojibake patterns in new/changed docs ---
for (const [label, text] of [
  [PLANNING_DOC, planningDoc],
  [RESULT_DOC, resultDoc],
]) {
  for (const marker of MOJIBAKE_MARKERS) {
    assert(!text.includes(marker), `Possible mojibake pattern detected in ${label}`);
  }
}

// --- 9. No forbidden investment language present as approved text ---
// The planning doc's Section 15 is required (by spec) to enumerate the
// exact forbidden phrase list as reference policy content, mirroring the
// established repo convention (e.g. phase_3ff_a_plan_mk_agent_design_v0.1.md
// lines 134-138: "These examples are forbidden and may appear only in this
// explicit forbidden-phrasing section"). That doc is intentionally excluded
// from this literal-absence scan, but is instead checked to ensure the list
// is framed as forbidden, not approved, copy. The result doc and changelog
// summarize outcomes and must never need to quote the forbidden phrases
// verbatim, so they remain scanned. (This checker's own source is also
// excluded: it must contain these phrases literally as pattern-match
// strings.)
assert(
  planningDoc.includes('8 forbidden phrases') && planningDoc.includes('must never appear as approved output copy'),
  'Planning doc Section 15 must frame its forbidden-phrase list as forbidden, not approved, copy',
);
for (const [label, text] of [
  [RESULT_DOC, resultDoc],
  [CHANGELOG, changelogSection],
]) {
  for (const phrase of FORBIDDEN_INVESTMENT_PHRASES) {
    assert(!text.includes(phrase), `Forbidden investment phrase found in ${label}: ${phrase}`);
  }
}

// --- 10. No secrets / PII present ---
for (const [label, text] of [
  [PLANNING_DOC, planningDoc],
  [RESULT_DOC, resultDoc],
  [CHANGELOG, changelogSection],
]) {
  for (const check of SECRET_LIKE_CHECKS) {
    assert(!check.regex.test(text), `Possible ${check.name} found in ${label}`);
  }
}

// --- 11. No false-activation claim present ---
for (const [label, text] of [
  [PLANNING_DOC, planningDoc],
  [RESULT_DOC, resultDoc],
  [CHANGELOG, changelogSection],
]) {
  for (const claim of FALSE_ACTIVATION_CLAIMS) {
    assert(!text.includes(claim), `False activation claim found in ${label}: "${claim}"`);
  }
}

// --- 12. Plan recommends Phase 3GG-B next, not Phase 3FG-F ---
assert(
  planningDoc.includes('next recommended phase is **Phase 3GG-B**') || planningDoc.includes('The next recommended phase is **Phase 3GG-B**'),
  'Planning doc must explicitly recommend Phase 3GG-B as the next phase',
);
assert(
  planningDoc.includes('Phase 3FG-F is postponed'),
  'Planning doc must explicitly state that Phase 3FG-F is postponed (not recommended next)',
);
assert(
  resultDoc.includes('Phase 3GG-B — Live KIS Approval Gate Checklist') || resultDoc.includes('Phase 3GG-B'),
  'Result doc must name Phase 3GG-B as the next recommended phase',
);
assert(
  !resultDoc.includes('Next recommended phase: Phase 3FG-F') && !resultDoc.includes('Next Recommended Phase\n\nPhase 3FG-F'),
  'Result doc must not recommend Phase 3FG-F as the next phase',
);

// --- 13. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-A-PLAN check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-A-PLAN check PASS: ${assertions}/${assertions} assertions passed.`);
}
