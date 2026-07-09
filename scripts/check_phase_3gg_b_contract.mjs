// Phase 3GG-B contract checker.
// Verifies the Live KIS Approval Gate Checklist (owner-reviewable,
// documentation/checker only, no live KIS, no LLM, no public/beta
// activation, no API route, no scaffold/provider source change) is
// present, internally consistent, and has not touched any forbidden
// runtime/source path since the Phase 3GG-A-PLAN baseline.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '3d3bc4fa92d30030e0a2687a55af35166e100705';

const CHECKLIST_DOC = 'docs/planning/phase_3gg_b_live_kis_approval_gate_checklist_v0.1.md';
const RESULT_DOC = 'docs/planning/phase_3gg_b_live_kis_approval_gate_checklist_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3gg_b_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [CHECKLIST_DOC, RESULT_DOC, CHECKER_SELF];
const MODIFIED_FILES = [CHANGELOG, PACKAGE_JSON];

// Sibling phase checkers patched during this phase so they keep passing
// against a HEAD that already includes this phase's own changes. Every
// patch is additive-only (no protective assertion weakened or removed):
// each sibling's TOLERATED_LATER_PHASE_FILES / TOLERATED_HEADERS_ABOVE_*
// allowlist was extended to recognize this phase's 3 new deliverables and
// changelog header.
const PATCHED_SIBLING_CHECKERS = [
  'scripts/check_phase_3gg_a_plan_contract.mjs',
  'scripts/check_phase_3fg_d_hf1_contract.mjs',
  'scripts/check_phase_3fg_e_contract.mjs',
  'scripts/check_phase_3fg_d_contract.mjs',
  'scripts/check_phase_3fg_c_contract.mjs',
  'scripts/check_phase_3fg_b_contract.mjs',
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
  'scripts/check_phase_3ff_a_plan_contract.mjs',
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

// Literal candidate paths named in the work order. None of these exist in
// the repo at this baseline -- the real KIS provider tree lives under
// src/lib/server/providers/kis/ and several other src/lib/server/**/*kis*
// files. Checked literally for completeness, and supplemented below by a
// broad case-insensitive scan (assertion block 8b) over every changed file,
// since the literal list does not match the actual provider location.
const KIS_PROVIDER_CANDIDATE_PATHS = [
  'src/lib/server/kis',
  'src/lib/kis',
  'src/server/kis',
  'src/lib/server/chart-ai/kis',
];

const CHECKLIST_DOC_REQUIRED_TOKENS = [
  'Phase 3GG-B',
  '3d3bc4fa92d30030e0a2687a55af35166e100705',
  'Phase 3GG-A-PLAN',
  'Live KIS',
  'Owner-reviewable',
  'No Activation',
  'Pending Owner Review',
  'liveKisEnabled',
  'providerMode: live_kis',
  'Credential scope',
  'Endpoint allowlist',
  'Rate limit and quota ceiling',
  'Cost/budget ceiling',
  'Caching policy',
  'First activation audience',
  'Fail-closed behavior',
  'Response sanitization',
  'Audit and logging policy',
  'Rollback plan',
  'Commit-specific activation sign-off',
  'No account/trading/order/balance API',
  'Not ready — all gates pending owner review',
];

const RESULT_DOC_REQUIRED_TOKENS = [
  'Status: Prepared.',
  'Baseline: 3d3bc4fa92d30030e0a2687a55af35166e100705.',
  'Phase 3GG-A-PLAN',
  'Owner-reviewable',
  'Pending Owner Review',
  'Live KIS is still blocked',
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

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-B - 2026-07-09',
  'Live KIS Approval Gate Checklist',
  'Owner-reviewable',
  'No Activation',
  '3d3bc4fa92d30030e0a2687a55af35166e100705',
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

// Phrases that would falsely claim an activation occurred. None of these
// may appear anywhere in the checklist or result document, even in a
// hypothetical/future-tense framing, since this phase performs no
// activation of any kind and approves no gate.
const FALSE_ACTIVATION_CLAIMS = [
  'live KIS is now active',
  'live KIS has been activated',
  'live KIS is approved',
  'LLM is now active',
  'LLM has been activated',
  'public access is now available',
  'beta access is now available',
  'API route is now live',
  'API route has been activated',
  'deployed to production',
  'usage has been deducted',
  'paid entitlement unlocked',
  'ad unlock occurred',
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
  pkg.scripts && pkg.scripts['check:phase-3gg-b'] === 'node scripts/check_phase_3gg_b_contract.mjs',
  'package.json is missing the exact "check:phase-3gg-b" script entry',
);

// --- 3. Checklist doc contains all required tokens ---
const checklistDoc = read(CHECKLIST_DOC);
for (const token of CHECKLIST_DOC_REQUIRED_TOKENS) {
  assert(checklistDoc.includes(token), `Checklist doc missing required token: ${token}`);
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
const phaseHeaderIndex = changelog.indexOf('## Phase 3GG-B - 2026-07-09');
assert(phaseHeaderIndex >= 0, 'Phase 3GG-B changelog entry must exist');
assert(phaseHeaderIndex === 0 || changelog.slice(0, phaseHeaderIndex).trim() === '# MK Stock Lab Planning Changelog',
  'Phase 3GG-B changelog entry must be the topmost phase entry');
const nextHeaderIndex = phaseHeaderIndex >= 0
  ? changelog.indexOf('\n## Phase ', phaseHeaderIndex + 1)
  : -1;
assert(nextHeaderIndex > phaseHeaderIndex, 'Could not locate the end of the Phase 3GG-B changelog section');
const changelogSection = phaseHeaderIndex >= 0 && nextHeaderIndex > phaseHeaderIndex
  ? changelog.slice(phaseHeaderIndex, nextHeaderIndex)
  : '';
assert(changelogSection.includes('Phase 3GG-A-PLAN') || changelogSection.includes('3d3bc4f'),
  'Phase 3GG-B changelog entry must reference the Phase 3GG-A-PLAN / 3d3bc4f baseline');

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

// --- 8. No KIS provider module changed since baseline (literal candidates)
// -- none of these paths exist in this repo, so this is expected to always
// return empty; it is kept as a literal check per the work order in
// addition to the broad scan in 8b below.
const kisLiteralDiff = gitLines(['diff', '--name-only', BASELINE, '--', ...KIS_PROVIDER_CANDIDATE_PATHS]);
assert(kisLiteralDiff.length === 0, `KIS provider literal-candidate path changed since baseline: ${kisLiteralDiff.join(', ')}`);

// --- 8b. Broad defensive scan: no changed file with "kis" anywhere in its
// path (case-insensitive), other than this phase's own allowed deliverables
// (the checklist/result docs and this checker legitimately discuss "KIS" by
// name). This covers the actual provider tree (src/lib/server/providers/kis/,
// src/lib/server/kisClient.ts, src/lib/server/chartAiKisOhlcProviderBoundary*,
// src/lib/server/chartSimilarity/*Kis*), which does not match any of the 4
// literal candidate paths above.
const kisLikeChanged = allChanged.filter(
  (file) => /kis/i.test(file) && !allowedFiles.has(file),
);
assert(kisLikeChanged.length === 0, `Possible KIS provider path changed since baseline: ${kisLikeChanged.join(', ')}`);

// --- 9. No mojibake patterns in new docs/checker ---
for (const [label, text] of [
  [CHECKLIST_DOC, checklistDoc],
  [RESULT_DOC, resultDoc],
]) {
  for (const marker of MOJIBAKE_MARKERS) {
    assert(!text.includes(marker), `Possible mojibake pattern detected in ${label}`);
  }
}

// --- 10. No forbidden investment language present as approved text (this
// checker's own source is excluded: it must contain these phrases literally
// as pattern-match strings) ---
for (const [label, text] of [
  [CHECKLIST_DOC, checklistDoc],
  [RESULT_DOC, resultDoc],
  [CHANGELOG, changelogSection],
]) {
  for (const phrase of FORBIDDEN_INVESTMENT_PHRASES) {
    assert(!text.includes(phrase), `Forbidden investment phrase found in ${label}: ${phrase}`);
  }
}

// --- 11. No secrets / PII present ---
for (const [label, text] of [
  [CHECKLIST_DOC, checklistDoc],
  [RESULT_DOC, resultDoc],
  [CHANGELOG, changelogSection],
]) {
  for (const check of SECRET_LIKE_CHECKS) {
    assert(!check.regex.test(text), `Possible ${check.name} found in ${label}`);
  }
}

// --- 12. No false-activation claim present ---
for (const [label, text] of [
  [CHECKLIST_DOC, checklistDoc],
  [RESULT_DOC, resultDoc],
  [CHANGELOG, changelogSection],
]) {
  for (const claim of FALSE_ACTIVATION_CLAIMS) {
    assert(!text.includes(claim), `False activation claim found in ${label}: "${claim}"`);
  }
}

// --- 13. No Live KIS gate is marked Approved; all 11 remain Pending Owner
// Review ---
assert(
  !checklistDoc.includes('| Approved |') && !/Decision:\s*Approved(?!\s*\/)/.test(checklistDoc),
  'Checklist doc must not mark any gate as Approved',
);
const gateSummaryTable = checklistDoc.slice(
  checklistDoc.indexOf('## 6. Live KIS approval checklist summary'),
  checklistDoc.indexOf('## 7. Gate 1'),
);
const pendingCount = (gateSummaryTable.match(/Pending Owner Review/g) || []).length;
assert(pendingCount >= 11, `Expected all 11 gates marked Pending Owner Review in the summary table, found ${pendingCount}`);
assert(
  resultDoc.includes('All 11 Live KIS approval gates are **Pending Owner Review**'),
  'Result doc must state all 11 gates are Pending Owner Review',
);

// --- 14. Checklist recommends owner review/sign-off next, not
// implementation ---
assert(
  checklistDoc.includes('Phase 3GG-B-REVIEW'),
  'Checklist doc must recommend Phase 3GG-B-REVIEW (owner review) as a next-step option',
);
assert(
  checklistDoc.includes('The next actionable step is owner review/sign-off, not implementation.'),
  'Checklist doc decision summary must state the next actionable step is owner review, not implementation',
);

// --- 15. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-B check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-B check PASS: ${assertions}/${assertions} assertions passed.`);
}
