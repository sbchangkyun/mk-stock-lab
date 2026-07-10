// Phase 3GG-C contract checker.
// Verifies the Live KIS Activation Decision Record (decision-record only,
// no live KIS, no LLM, no public/beta activation, no API route, no
// scaffold/provider source change, no live KIS activation) is present,
// internally consistent, and has not touched any forbidden runtime/source
// path since the Phase 3GG-B-REVIEW-RECORD baseline.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '1ab8c8ba478fef909761c059e013cb2ab63ecd29';

const DECISION_DOC = 'docs/planning/phase_3gg_c_live_kis_activation_decision_record_v0.1.md';
const RESULT_DOC = 'docs/planning/phase_3gg_c_live_kis_activation_decision_record_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3gg_c_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [DECISION_DOC, RESULT_DOC, CHECKER_SELF];
const MODIFIED_FILES = [CHANGELOG, PACKAGE_JSON];

// Sibling phase checkers patched during this phase so they keep passing
// against a HEAD that already includes this phase's own changes. Every
// patch is additive-only (no protective assertion weakened or removed):
// each sibling's TOLERATED_LATER_PHASE_FILES allowlist was extended to
// recognize this phase's 3 new deliverables. Populated only with checkers
// an actual validation run demonstrated needed a patch -- see the phase
// result doc for the exact list applied.
const PATCHED_SIBLING_CHECKERS = [
  'scripts/check_phase_3gg_b_review_record_contract.mjs',
  'scripts/check_phase_3gg_b_audit_contract.mjs',
  'scripts/check_phase_3gg_b_contract.mjs',
  'scripts/check_phase_3gg_a_plan_contract.mjs',
  'scripts/check_phase_3ff_a_ui_c_manual_qa_contract.mjs',
  'scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs',
  'scripts/check_phase_3ff_a_ui_a_contract.mjs',
  'scripts/check_phase_3ff_a_mk_a_contract.mjs',
  'scripts/check_phase_3ff_a_sp_a_contract.mjs',
  'scripts/check_phase_3fg_a_plan_contract.mjs',
  'scripts/check_phase_3fg_a_contract.mjs',
  'scripts/check_phase_3fg_b_contract.mjs',
  'scripts/check_phase_3fg_c_contract.mjs',
  'scripts/check_phase_3fg_d_contract.mjs',
  'scripts/check_phase_3fg_e_contract.mjs',
  'scripts/check_phase_3fg_d_hf1_contract.mjs',
];

// No later phase exists on top of this baseline yet, so this list starts
// empty. A future phase that legitimately adds files on top of this one
// should extend this array in its own patch to this checker, not remove
// any existing assertion.
const TOLERATED_LATER_PHASE_FILES = [];

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

// Literal candidate paths named in the work order.
// src/lib/server/providers/kis is the real, pre-existing provider tree.
const KIS_PROVIDER_CANDIDATE_PATHS = [
  'src/lib/server/kis',
  'src/lib/kis',
  'src/server/kis',
  'src/lib/server/chart-ai/kis',
  'src/lib/server/providers/kis',
];

// --- 3. Decision record doc required literal tokens (exhaustive) ---
const DECISION_DOC_REQUIRED_TOKENS = [
  'Phase 3GG-C',
  '1ab8c8b',
  'Phase 3GG-B-REVIEW-RECORD',
  'Live KIS',
  'Activation Decision Record',
  'No Activation',
  'Approved with condition',
  'Approved',
  'general local only',
  'Live KIS remains blocked',
  'no gate remains Pending',
  'no gate remains Rejected',
  'no gate remains Needs revision',
  'conditionally ready for next no-activation implementation planning',
  'actual activation requires separate future commit/PR sign-off',
  'Phase 3GG-D-PLAN',
];

// --- 4. Result doc required tokens ---
const RESULT_DOC_REQUIRED_TOKENS = [
  'Status: Prepared.',
  'Baseline: 1ab8c8b',
  'Phase 3GG-B-REVIEW-RECORD',
  'Gate review status summary',
  'Owner condition summary',
  'Live KIS remains blocked',
  'No source changes.',
  'No chart-ai.astro change.',
  'No API route changed.',
  'No scaffold source changed.',
  'No provider source changed.',
  'No live KIS.',
  'No LLM.',
  'No public/beta activation.',
  'forbidden diff: empty',
];

// --- 5. Changelog required tokens ---
const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-C - 2026-07-09',
  'Live KIS Activation Decision Record',
  'No Activation',
  '1ab8c8b',
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

// Phrases that would falsely claim an activation, approval, or unlock
// occurred. None of these may appear anywhere in the decision or result
// document, even in a hypothetical/future-tense framing, since this phase
// performs no activation of any kind -- it only records the decision state
// after owner review.
const FALSE_ACTIVATION_CLAIMS = [
  'live KIS is now active',
  'live KIS has been activated',
  'live KIS is currently active',
  'LLM is now active',
  'LLM has been activated',
  'public access is now available',
  'beta access is now available',
  'internal QA is now available',
  'API route is now live',
  'API route has been activated',
  'Supabase is connected',
  'database is connected',
  'usage has been deducted',
  'paid entitlement unlocked',
  'ad unlock occurred',
  'deployed to production',
];

// Phrases that would recommend immediate implementation/activation rather
// than the safer Phase 3GG-D-PLAN planning phase.
const IMMEDIATE_IMPLEMENTATION_CLAIMS = [
  'implement live KIS now',
  'begin live KIS implementation immediately',
  'start implementation now',
  'proceed directly to implementation',
  'activate live KIS now',
  'activate live KIS immediately',
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
  pkg.scripts && pkg.scripts['check:phase-3gg-c'] === 'node scripts/check_phase_3gg_c_contract.mjs',
  'package.json is missing the exact "check:phase-3gg-c" script entry',
);

// --- 3. Decision record doc contains all required tokens ---
const decisionDoc = read(DECISION_DOC);
for (const token of DECISION_DOC_REQUIRED_TOKENS) {
  assert(decisionDoc.includes(token), `Decision record doc missing required token: ${token}`);
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
const phaseHeaderIndex = changelog.indexOf('## Phase 3GG-C - 2026-07-09');
assert(phaseHeaderIndex >= 0, 'Phase 3GG-C changelog entry must exist');
assert(phaseHeaderIndex === 0 || changelog.slice(0, phaseHeaderIndex).trim() === '# MK Stock Lab Planning Changelog',
  'Phase 3GG-C changelog entry must be the topmost phase entry');
const nextHeaderIndex = phaseHeaderIndex >= 0
  ? changelog.indexOf('\n## Phase ', phaseHeaderIndex + 1)
  : -1;
assert(nextHeaderIndex > phaseHeaderIndex, 'Could not locate the end of the Phase 3GG-C changelog section');
const changelogSection = phaseHeaderIndex >= 0 && nextHeaderIndex > phaseHeaderIndex
  ? changelog.slice(phaseHeaderIndex, nextHeaderIndex)
  : '';
assert(changelogSection.includes('Phase 3GG-B-REVIEW-RECORD') || changelogSection.includes('1ab8c8b'),
  'Phase 3GG-C changelog entry must reference the Phase 3GG-B-REVIEW-RECORD / 1ab8c8b baseline');

// --- 6. Changed files since baseline are restricted to the allowed set ---
let isDescendant = true;
try {
  execFileSync('git', ['merge-base', '--is-ancestor', BASELINE, 'HEAD'], { cwd: ROOT, stdio: 'ignore' });
} catch {
  isDescendant = false;
}
assert(isDescendant, `HEAD is not a descendant of baseline ${BASELINE}`);

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

for (const known of KNOWN_UNTOUCHED_PATHS) {
  assert(
    !changedFiles.some((file) => file === known || file.startsWith(known)),
    `Known untouched path unexpectedly present in tracked diff: ${known}`,
  );
}

// --- 7. No forbidden runtime/source paths changed since baseline (no
// tolerated exceptions in this phase: it is not authorized to touch any of
// them) ---
const forbiddenDiff = gitLines(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]);
assert(forbiddenDiff.length === 0, `Forbidden diff paths changed since baseline: ${forbiddenDiff.join(', ')}`);

// --- 8. No KIS provider module changed since baseline (literal candidates,
// including the real src/lib/server/providers/kis tree) plus a broad
// defensive case-insensitive scan over every changed file, excluding this
// phase's own allowed deliverables (which legitimately discuss "KIS" by
// name) ---
const kisLiteralDiff = gitLines(['diff', '--name-only', BASELINE, '--', ...KIS_PROVIDER_CANDIDATE_PATHS]);
assert(kisLiteralDiff.length === 0, `KIS provider literal-candidate path changed since baseline: ${kisLiteralDiff.join(', ')}`);

const kisLikeChanged = allChanged.filter(
  (file) => /kis/i.test(file) && !allowedFiles.has(file),
);
assert(kisLikeChanged.length === 0, `Possible KIS provider path changed since baseline: ${kisLikeChanged.join(', ')}`);

// --- 9. No .env / .env.local read or modified (already covered structurally
// by the forbidden-diff path list in assertion 7; re-asserted directly here
// against the full changed-file set for defense in depth) ---
const envTouched = allChanged.filter((file) => file === '.env' || file === '.env.local');
assert(envTouched.length === 0, `.env/.env.local unexpectedly present in changed files: ${envTouched.join(', ')}`);

// --- 10. No mojibake patterns in new docs/checker ---
const checkerSelfSource = read(CHECKER_SELF);
for (const [label, text] of [
  [DECISION_DOC, decisionDoc],
  [RESULT_DOC, resultDoc],
  [CHECKER_SELF, checkerSelfSource],
]) {
  for (const marker of MOJIBAKE_MARKERS) {
    assert(!text.includes(marker), `Possible mojibake pattern detected in ${label}`);
  }
}

// --- 11. No forbidden investment language present as approved text ---
for (const [label, text] of [
  [DECISION_DOC, decisionDoc],
  [RESULT_DOC, resultDoc],
  [CHANGELOG, changelogSection],
]) {
  for (const phrase of FORBIDDEN_INVESTMENT_PHRASES) {
    assert(!text.includes(phrase), `Forbidden investment phrase found in ${label}: ${phrase}`);
  }
}

// --- 12. No secrets / PII present ---
// CHECKER_SELF is intentionally excluded: this checker's own source
// necessarily contains the literal strings it scans for (e.g. the regex
// source text "access_token"), matching the established precedent in
// check_phase_3gg_b_review_record_contract.mjs.
for (const [label, text] of [
  [DECISION_DOC, decisionDoc],
  [RESULT_DOC, resultDoc],
  [CHANGELOG, changelogSection],
]) {
  for (const check of SECRET_LIKE_CHECKS) {
    assert(!check.regex.test(text), `Possible ${check.name} found in ${label}`);
  }
}

// --- 13. No false-activation claim present ---
for (const [label, text] of [
  [DECISION_DOC, decisionDoc],
  [RESULT_DOC, resultDoc],
  [CHANGELOG, changelogSection],
]) {
  for (const claim of FALSE_ACTIVATION_CLAIMS) {
    assert(!text.includes(claim), `False activation claim found in ${label}: "${claim}"`);
  }
}

// --- 14. Decision record must not state that live KIS is currently active
// (covered by the "live KIS is currently active" / "live KIS is now
// active" / "live KIS has been activated" entries in assertion 13 above;
// re-asserted directly here per the work order's spirit, mirroring the
// Phase 3GG-B-REVIEW-RECORD checker's precedent) ---
assert(
  !decisionDoc.includes('live KIS is currently active') && !decisionDoc.includes('Live KIS is currently active'),
  'Decision record must not state that live KIS is currently active',
);
assert(
  decisionDoc.includes('Live KIS remains blocked'),
  'Decision record must affirmatively state Live KIS remains blocked',
);

// --- 15. Decision record must not recommend direct implementation
// activation; it must recommend Phase 3GG-D-PLAN first ---
for (const claim of IMMEDIATE_IMPLEMENTATION_CLAIMS) {
  assert(!decisionDoc.includes(claim), `Decision record must not recommend immediate activation: "${claim}"`);
}
assert(
  decisionDoc.includes('Do not recommend direct activation'),
  'Decision record must explicitly state that direct activation is not recommended',
);
assert(
  decisionDoc.includes('Phase 3GG-D-PLAN'),
  'Decision record must recommend Phase 3GG-D-PLAN as the chosen safer next phase',
);

// --- 16. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-C check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-C check PASS: ${assertions}/${assertions} assertions passed.`);
}
