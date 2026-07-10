// Phase 3GG-B-AUDIT contract checker.
// Verifies the Live KIS Approval Gate Evidence Audit (owner-minimal review,
// evidence audit only, no live KIS, no LLM, no public/beta activation, no
// API route, no scaffold/provider source change, no gate marked Approved)
// is present, internally consistent, and has not touched any forbidden
// runtime/source path since the Phase 3GG-B baseline.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '5d90b2c14c8210d7e8346fc613d8087791491201';

const AUDIT_DOC = 'docs/planning/phase_3gg_b_audit_live_kis_gate_evidence_review_v0.1.md';
const RESULT_DOC = 'docs/planning/phase_3gg_b_audit_live_kis_gate_evidence_review_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3gg_b_audit_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [AUDIT_DOC, RESULT_DOC, CHECKER_SELF];
const MODIFIED_FILES = [CHANGELOG, PACKAGE_JSON];

// Sibling phase checkers patched during this phase so they keep passing
// against a HEAD that already includes this phase's own changes. Every
// patch is additive-only (no protective assertion weakened or removed):
// each sibling's TOLERATED_LATER_PHASE_FILES / TOLERATED_HEADERS_ABOVE_*
// allowlist was extended to recognize this phase's 3 new deliverables and
// changelog header.
const PATCHED_SIBLING_CHECKERS = [
  'scripts/check_phase_3gg_b_contract.mjs',
  'scripts/check_phase_3gg_a_plan_contract.mjs',
  'scripts/check_phase_3fg_d_hf1_contract.mjs',
  'scripts/check_phase_3fg_e_contract.mjs',
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
  // Phase 3GG-B-REVIEW-RECORD's own cascade patch additively extended these
  // six further sibling checkers' tolerance lists to recognize its own
  // deliverables (a pre-existing gap: Phase 3GG-B-AUDIT never patched them).
  // Tolerated here retroactively for the same reason as the two entries
  // above; no protective assertion is weakened.
  'scripts/check_phase_3ff_a_handoff_a_contract.mjs',
  'scripts/check_phase_3ff_a_housekeeping_a_contract.mjs',
  'scripts/check_phase_3ff_a_mk_b_contract.mjs',
  'scripts/check_phase_3ff_a_mk_c_contract.mjs',
  'scripts/check_phase_3ff_a_plan_contract.mjs',
  'scripts/check_phase_3ff_a_sp_b_contract.mjs',
];

// Phase 3GG-B-REVIEW-RECORD legitimately added these 3 files on top of
// this baseline. A future phase that adds further files should extend
// this array in its own patch to this checker, not remove any existing
// assertion.
const TOLERATED_LATER_PHASE_FILES = [
  'docs/planning/phase_3gg_b_review_record_live_kis_owner_review_v0.1.md',
  'docs/planning/phase_3gg_b_review_record_result_v0.1.md',
  'scripts/check_phase_3gg_b_review_record_contract.mjs',
  // Phase 3GG-C legitimately added these 3 files on top of this baseline.
  'docs/planning/phase_3gg_c_live_kis_activation_decision_record_v0.1.md',
  'docs/planning/phase_3gg_c_live_kis_activation_decision_record_result_v0.1.md',
  'scripts/check_phase_3gg_c_contract.mjs',
  // Phase 3GG-D-PLAN legitimately added these 3 files on top of this baseline.
  'docs/planning/phase_3gg_d_plan_local_only_live_kis_provider_binding_plan_v0.1.md',
  'docs/planning/phase_3gg_d_plan_local_only_live_kis_provider_binding_plan_result_v0.1.md',
  'scripts/check_phase_3gg_d_plan_contract.mjs',
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

const AUDIT_DOC_REQUIRED_TOKENS = [
  'Phase 3GG-B-AUDIT',
  '5d90b2c14c8210d7e8346fc613d8087791491201',
  'Phase 3GG-B',
  'Live KIS',
  'Owner-minimal review',
  'No Activation',
  'Repo-verified, owner confirmation still required',
  'Partially repo-verified, owner input required',
  'Owner-only decision required',
  'Blocked / insufficient evidence',
  'Pending Owner Review',
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
  'Minimal owner questionnaire',
  'Not ready — evidence audit prepared, owner answers still required, no gate approved by this phase',
];

const RESULT_DOC_REQUIRED_TOKENS = [
  'Status: Prepared.',
  'Baseline: 5d90b2c14c8210d7e8346fc613d8087791491201.',
  'Phase 3GG-B',
  'Owner-minimal review',
  'Minimal owner questionnaire',
  'No gate approved',
  'Live KIS still blocked',
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
  '## Phase 3GG-B-AUDIT - 2026-07-09',
  'Live KIS Approval Gate Evidence Audit',
  'Owner-Minimal Review',
  'No Activation',
  '5d90b2c14c8210d7e8346fc613d8087791491201',
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
// occurred. None of these may appear anywhere in the audit or result
// document, even in a hypothetical/future-tense framing, since this phase
// performs no activation of any kind and approves no gate.
const FALSE_ACTIVATION_CLAIMS = [
  'live KIS is now active',
  'live KIS has been activated',
  'live KIS is approved',
  'live KIS has been approved',
  'LLM is now active',
  'LLM has been activated',
  'public access is now available',
  'beta access is now available',
  'API route is now live',
  'API route has been activated',
  'Supabase is connected',
  'database is connected',
  'usage has been deducted',
  'paid entitlement unlocked',
  'ad unlock occurred',
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
  pkg.scripts && pkg.scripts['check:phase-3gg-b-audit'] === 'node scripts/check_phase_3gg_b_audit_contract.mjs',
  'package.json is missing the exact "check:phase-3gg-b-audit" script entry',
);

// --- 3. Audit doc contains all required tokens ---
const auditDoc = read(AUDIT_DOC);
for (const token of AUDIT_DOC_REQUIRED_TOKENS) {
  assert(auditDoc.includes(token), `Audit doc missing required token: ${token}`);
}

// --- 4. Result doc contains all required tokens ---
const resultDoc = read(RESULT_DOC);
for (const token of RESULT_DOC_REQUIRED_TOKENS) {
  assert(resultDoc.includes(token), `Result doc missing required token: ${token}`);
}

// --- 5. Changelog contains all required tokens and its entry sits at the
// top, tolerating only the known later Phase 3GG-B-REVIEW-RECORD header
// legitimately prepended above this entry (not a strict "must be the
// first entry" check). ---
const changelog = read(CHANGELOG);
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelog.includes(token), `Changelog missing required token: ${token}`);
}
const TOLERATED_HEADERS_ABOVE_3GG_B_AUDIT = [
  '## Phase 3GG-B-REVIEW-RECORD - 2026-07-09',
  '## Phase 3GG-C - 2026-07-09',
  '## Phase 3GG-D-PLAN - 2026-07-09',
];
const phaseHeaderIndex = changelog.indexOf('## Phase 3GG-B-AUDIT - 2026-07-09');
assert(phaseHeaderIndex >= 0, 'Phase 3GG-B-AUDIT changelog entry must exist');
const precedingHeaders3ggBAudit =
  phaseHeaderIndex >= 0 ? changelog.slice(0, phaseHeaderIndex).match(/^## Phase .*$/gm) || [] : [];
const unexpectedPrecedingHeaders3ggBAudit = precedingHeaders3ggBAudit.filter(
  (header) => !TOLERATED_HEADERS_ABOVE_3GG_B_AUDIT.includes(header.trim()),
);
assert(
  unexpectedPrecedingHeaders3ggBAudit.length === 0,
  `Phase 3GG-B-AUDIT changelog entry has unexpected headers above it: ${unexpectedPrecedingHeaders3ggBAudit.join(', ')}`,
);
const nextHeaderIndex = phaseHeaderIndex >= 0
  ? changelog.indexOf('\n## Phase ', phaseHeaderIndex + 1)
  : -1;
assert(nextHeaderIndex > phaseHeaderIndex, 'Could not locate the end of the Phase 3GG-B-AUDIT changelog section');
const changelogSection = phaseHeaderIndex >= 0 && nextHeaderIndex > phaseHeaderIndex
  ? changelog.slice(phaseHeaderIndex, nextHeaderIndex)
  : '';
assert(changelogSection.includes('Phase 3GG-B') || changelogSection.includes('5d90b2c'),
  'Phase 3GG-B-AUDIT changelog entry must reference the Phase 3GG-B / 5d90b2c baseline');

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
// (the audit/result docs and this checker legitimately discuss "KIS" by
// name). This covers the actual provider tree (src/lib/server/providers/kis/,
// src/lib/server/kisClient.ts, src/lib/server/chartAiKisOhlcProviderBoundary*,
// src/lib/server/chartSimilarity/*Kis*), which does not match any of the 4
// literal candidate paths above.
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
  [AUDIT_DOC, auditDoc],
  [RESULT_DOC, resultDoc],
  [CHECKER_SELF, checkerSelfSource],
]) {
  for (const marker of MOJIBAKE_MARKERS) {
    assert(!text.includes(marker), `Possible mojibake pattern detected in ${label}`);
  }
}

// --- 11. No forbidden investment language present as approved text (this
// checker's own source is excluded from the "must not contain" framing
// above only insofar as it must contain these phrases literally as
// pattern-match strings; it is still scanned like any other file since none
// of its comments quote the phrases outside of the FORBIDDEN_INVESTMENT_PHRASES
// array definition itself, which is expected) ---
for (const [label, text] of [
  [AUDIT_DOC, auditDoc],
  [RESULT_DOC, resultDoc],
  [CHANGELOG, changelogSection],
]) {
  for (const phrase of FORBIDDEN_INVESTMENT_PHRASES) {
    assert(!text.includes(phrase), `Forbidden investment phrase found in ${label}: ${phrase}`);
  }
}

// --- 12. No secrets / PII present ---
for (const [label, text] of [
  [AUDIT_DOC, auditDoc],
  [RESULT_DOC, resultDoc],
  [CHANGELOG, changelogSection],
]) {
  for (const check of SECRET_LIKE_CHECKS) {
    assert(!check.regex.test(text), `Possible ${check.name} found in ${label}`);
  }
}

// --- 13. No false-activation claim present ---
for (const [label, text] of [
  [AUDIT_DOC, auditDoc],
  [RESULT_DOC, resultDoc],
  [CHANGELOG, changelogSection],
]) {
  for (const claim of FALSE_ACTIVATION_CLAIMS) {
    assert(!text.includes(claim), `False activation claim found in ${label}: "${claim}"`);
  }
}

// --- 14. Audit doc must not mark any of the 11 gates as Approved ---
assert(
  !auditDoc.includes('| Approved |') && !/Decision:\s*Approved(?!\s*\/)/.test(auditDoc) && !/Status:\s*Approved\b/.test(auditDoc),
  'Audit doc must not mark any gate as Approved',
);
const gateSummaryTable = auditDoc.slice(
  auditDoc.indexOf('## 6. Gate audit summary table'),
  auditDoc.indexOf('## 7. Gate 1'),
);
assert(
  !/\bApproved\b/.test(gateSummaryTable),
  'Gate audit status summary table must not contain the word "Approved"',
);
const allowedGateStatuses = [
  'Repo-verified, owner confirmation still required',
  'Partially repo-verified, owner input required',
  'Owner-only decision required',
  'Blocked / insufficient evidence',
];
const gateStatusRows = (gateSummaryTable.match(/^\|\s*\d+\s*\|.*\|$/gm) || []);
assert(gateStatusRows.length === 11, `Expected 11 gate rows in the gate audit status summary table, found ${gateStatusRows.length}`);
for (const row of gateStatusRows) {
  assert(
    allowedGateStatuses.some((status) => row.includes(status)),
    `Gate audit status summary row does not use an allowed evidence-classification status: ${row.trim()}`,
  );
}

// --- 15. Audit doc must recommend owner review answers next, not
// implementation ---
assert(
  auditDoc.includes('Not ready — evidence audit prepared, owner answers still required, no gate approved by this phase'),
  'Audit doc must state activation readiness is not ready and recommend owner answers next',
);
assert(
  auditDoc.includes('Implementation is not recommended as an immediate next step'),
  'Audit doc must explicitly state implementation is not the recommended next step',
);
assert(
  resultDoc.includes('Owner review') || resultDoc.includes('owner review'),
  'Result doc must reference owner review as the required next step',
);

// --- 16. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-B-AUDIT check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-B-AUDIT check PASS: ${assertions}/${assertions} assertions passed.`);
}
