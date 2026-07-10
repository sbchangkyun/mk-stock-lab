// Phase 3FG-D-HF1 contract checker.
// Verifies the narrow hidden-by-default CSS hotfix for the Phase 3FG-D guarded productization
// static UI shell on src/pages/chart-ai.astro: the fix block exists and unambiguously restores
// `[hidden] { display: none }` for #chartAiOwnerLocalGuardedProductizationStaticShell, the
// pre-existing deterministic agents panel and all 8 static decision-state cards plus required
// Korean safety copy remain intact, the result doc and changelog exist with required tokens, no
// forbidden runtime/source path has changed since the Phase 3FG-E baseline, changed files are
// restricted to the allowed set, and the new checker/result-doc/fix content contains no
// mojibake, no forbidden investment language, no raw secrets, and no forbidden runtime
// activation claim. This phase is a CSS-only hotfix: it does not activate live KIS, LLM,
// public/beta, API routes, Supabase/DB real runtime, or any real auth/session/JWT/cookie/header
// parsing.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '4b620d2';

const CHART_AI_PAGE = 'src/pages/chart-ai.astro';
const RESULT_DOC = 'docs/planning/phase_3fg_d_hf1_static_shell_hidden_default_fix_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3fg_d_hf1_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [RESULT_DOC, CHECKER_SELF];
const MODIFIED_FILES = [CHART_AI_PAGE, CHANGELOG, PACKAGE_JSON];

// Sibling checkers patched during this phase so they keep passing against a HEAD that already
// includes this phase's chart-ai.astro fix, files, and changelog header. No protective
// assertion in any of these files may be weakened; each patch may only extend an existing
// tolerance allowlist (TOLERATED_LATER_PHASE_FILES / TOLERATED_HEADERS_ABOVE_* / a pinned
// historical diff endpoint for the Phase 3FG-E "chart-ai.astro untouched" guarantee, which
// covers only Phase 3FG-E's own commit range and does not forbid this phase's fix). Populated
// only because live validation surfaced a genuine compatibility gap (see the Phase 3FG-D /
// 3FG-C precedent for the pattern).
const PATCHED_SIBLING_CHECKERS = [
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
  'scripts/check_phase_3ff_a_mk_a_contract.mjs',
  'scripts/check_phase_3ff_a_sp_a_contract.mjs',
  'scripts/check_phase_3ff_a_plan_contract.mjs',
];

// Files legitimately created by a later phase (Phase 3GG-A-PLAN; planning-only, no runtime/
// source change) that this checker must tolerate seeing in the diff/status without treating
// them as unexpected. Pure additive allowlist, matching the established TOLERATED_LATER_PHASE_FILES
// pattern already used by scripts/check_phase_3fg_e_contract.mjs.
const TOLERATED_LATER_PHASE_FILES = [
  'docs/planning/phase_3gg_a_plan_live_kis_llm_approval_runtime_binding_v0.1.md',
  'docs/planning/phase_3gg_a_plan_result_v0.1.md',
  'scripts/check_phase_3gg_a_plan_contract.mjs',
  'docs/planning/phase_3gg_b_live_kis_approval_gate_checklist_v0.1.md',
  'docs/planning/phase_3gg_b_live_kis_approval_gate_checklist_result_v0.1.md',
  'scripts/check_phase_3gg_b_contract.mjs',
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
  // Phase 3GG-D-PLAN (documentation/checker-only; no runtime/source change).
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

// Per the Phase 3FG-D-HF1 work order, this forbidden-diff list intentionally excludes
// src/pages/chart-ai.astro itself: that file is this phase's sole, controlled, allowed change.
const REQUIRED_FORBIDDEN_DIFF_PATHS = [
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

// The exact CSS fix block: a higher-specificity id+attribute rule that restores
// `[hidden] { display: none }` for the static shell despite the pre-existing class rule's
// unconditional `display: grid` (a CSS cascade-origin defect, not a specificity defect).
const FIX_BLOCK_START = 'Phase 3FG-D-HF1: the class rule above sets `display: grid`';
const FIX_BLOCK_END = '.chart-owner-local-guarded-productization-shell-heading h3 {';

const CHART_AI_PRESERVED_TOKENS = [
  'chartAiOwnerLocalDeterministicAgentsPanel',
  'chartAiOwnerLocalGuardedProductizationStaticShell',
  'ownerLocalGuardedProductizationShell',
  'ownerLocalDeterministicAgents',
  '참고용',
  '매수·매도 추천이 아닙니다',
  '투자 자문이 아닙니다',
  '과거 유사 흐름은 미래 성과를 보장하지 않습니다',
  '모든 실제 상품화 게이트는 꺼져 있습니다',
  'No live KIS',
  'No LLM',
  'No public/beta activation',
  'No API route activation',
  'No Supabase/DB real runtime',
  'No env/session/JWT/cookie/header parsing',
];

const CHART_AI_REQUIRED_STATE_LABELS = [
  'Default fail-closed',
  'Owner-local without scaffoldOnlyAcknowledged',
  'Owner-local with explicit scaffoldOnlyAcknowledged',
  'Beta attempt blocked',
  'Public attempt blocked',
  'Live KIS attempt blocked',
  'LLM attempt blocked',
  'Real auth attempt blocked',
];

const RESULT_DOC_REQUIRED_TOKENS = [
  '**Status**: Implemented.',
  '**Baseline**: 4b620d2.',
  'Phase 3FG-E',
  '**Branch**: rebuild/phase-1-ia-shell.',
  '## 1. Defect Summary',
  '## 2. Root Cause',
  '## 3. Files Created',
  '## 4. Files Modified',
  '## 5. Fix Summary',
  '## 6. Browser QA Environment',
  '## 7. Browser QA Results',
  '### PC Viewport Result',
  '### Mobile Viewport Result',
  '### Console Result',
  '### Network Result',
  '## 10. Forbidden Diff Result',
  '## 11. Controlled Chart-AI Diff Result',
  '## 12. Boundary Preservation',
  '## 13. Known Out-of-Scope Issues',
  '## 14. Next Recommended Phase',
  'No live KIS.',
  'No LLM.',
  'No public/beta activation.',
  'No API route activation.',
  'No scaffold source change.',
  'No deploy.',
  'No push.',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3FG-D-HF1 - 2026-07-09',
  'Static Shell Browser QA Fixes',
  'Hidden by Default',
  'No Runtime Activation',
  '4b620d2',
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

// Constructed from a numeric code point so this checker's own text can never trip its own
// mojibake scan.
const MOJIBAKE_MARKERS = [String.fromCharCode(0xfffd)];

const SECRET_LIKE_PATTERNS = [
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
  /access_token/i,
  /appsecret/i,
  /service_role/i,
];

// Phrases that would claim forbidden runtime activation occurred during this phase.
const FORBIDDEN_ACTIVATION_PHRASES = [
  'activated live KIS',
  'activated the LLM',
  'activated public',
  'activated beta',
  'activated the API route',
  'unlocked paid entitlement',
  'unlocked ad',
  'deducted usage',
  'used real Supabase',
  'used real DB runtime',
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

function gitRawLines(args) {
  return runGit(args)
    .split('\n')
    .filter((line) => line.trim().length > 0);
}

function extractBetween(source, startMarker, endMarker) {
  const startIndex = source.indexOf(startMarker);
  if (startIndex === -1) {
    return null;
  }
  const endIndex = source.indexOf(endMarker, startIndex + startMarker.length);
  if (endIndex === -1) {
    return null;
  }
  return source.slice(startIndex, endIndex);
}

// QA documentation legitimately quotes forbidden phrases inside backticks to document their
// absence from live UI copy. Strip backtick-quoted spans before scanning for forbidden phrases
// so this reference-only quoting cannot false-positive; a phrase appearing as live, unquoted
// text would still be caught.
function stripBacktickSpans(text) {
  return text.replace(/`[^`]*`/g, '');
}

// --- 1. Required files exist ---
for (const file of [...CORE_DELIVERABLES, CHART_AI_PAGE, CHANGELOG, PACKAGE_JSON]) {
  assert(exists(file), `Required file missing: ${file}`);
}

// --- 2. package.json contains the exact phase script ---
const pkg = JSON.parse(read(PACKAGE_JSON));
assert(
  pkg.scripts && pkg.scripts['check:phase-3fg-d-hf1'] === 'node scripts/check_phase_3fg_d_hf1_contract.mjs',
  'package.json is missing the exact "check:phase-3fg-d-hf1" script entry',
);

// --- 3. chart-ai.astro contains the CSS hidden-default fix block ---
const chartAiPage = read(CHART_AI_PAGE);
const fixBlock = extractBetween(chartAiPage, FIX_BLOCK_START, FIX_BLOCK_END);
assert(fixBlock !== null, 'Could not locate the hidden-default CSS fix block in chart-ai.astro');
const fixBlockText = fixBlock ?? '';
assert(fixBlockText.includes('display: none;'), 'Hidden-default CSS fix block missing "display: none;"');
assert(
  fixBlockText.includes('Phase 3FG-D-HF1'),
  'Hidden-default CSS fix block missing an explanatory Phase 3FG-D-HF1 comment',
);

// --- 4. chart-ai.astro still includes the deterministic panel, all 8 state labels, and ---
// --- required Korean safety copy (no regression to pre-existing behavior) ---
for (const token of CHART_AI_PRESERVED_TOKENS) {
  assert(chartAiPage.includes(token), `chart-ai.astro missing previously-required token: ${token}`);
}
for (const label of CHART_AI_REQUIRED_STATE_LABELS) {
  assert(chartAiPage.includes(label), `chart-ai.astro missing required state label: ${label}`);
}

// --- 5. Result doc contains all required tokens ---
const resultDoc = read(RESULT_DOC);
for (const token of RESULT_DOC_REQUIRED_TOKENS) {
  assert(resultDoc.includes(token), `Result doc missing required token: ${token}`);
}

// --- 6. Changelog contains all required tokens, as the newest entry ---
const changelog = read(CHANGELOG);
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelog.includes(token), `Changelog missing required token: ${token}`);
}
// Tolerates only the known later Phase 3GG-A-PLAN header prepended above this entry (not a
// strict "must be the first entry" check, since Phase 3GG-A-PLAN legitimately added its own
// header above this one). Matches the established pattern in
// scripts/check_phase_3fg_e_contract.mjs.
const TOLERATED_HEADERS_ABOVE_3FG_D_HF1 = [
  '## Phase 3GG-A-PLAN - 2026-07-09',
  '## Phase 3GG-B - 2026-07-09',
  '## Phase 3GG-B-AUDIT - 2026-07-09',
  '## Phase 3GG-B-REVIEW-RECORD - 2026-07-09',
  '## Phase 3GG-C - 2026-07-09',
  '## Phase 3GG-D-PLAN - 2026-07-09',
];
const phaseHeaderIndex = changelog.indexOf('## Phase 3FG-D-HF1 - 2026-07-09');
const precedingHeaders =
  phaseHeaderIndex >= 0 ? changelog.slice(0, phaseHeaderIndex).match(/^## Phase .*$/gm) || [] : [];
const unexpectedPrecedingHeaders = precedingHeaders.filter(
  (header) => !TOLERATED_HEADERS_ABOVE_3FG_D_HF1.includes(header.trim()),
);
assert(
  phaseHeaderIndex >= 0 && unexpectedPrecedingHeaders.length === 0,
  `Phase 3FG-D-HF1 changelog entry has unexpected headers above it: ${unexpectedPrecedingHeaders.join(', ')}`,
);
const nextHeaderIndex = phaseHeaderIndex >= 0 ? changelog.indexOf('\n## Phase ', phaseHeaderIndex + 1) : -1;
assert(nextHeaderIndex > phaseHeaderIndex, 'Could not locate the end of the Phase 3FG-D-HF1 changelog section');
const changelogSection =
  phaseHeaderIndex >= 0 && nextHeaderIndex > phaseHeaderIndex
    ? changelog.slice(phaseHeaderIndex, nextHeaderIndex)
    : '';
assert(
  changelogSection.includes('4b620d2'),
  'Phase 3FG-D-HF1 changelog entry must reference the 4b620d2 baseline',
);

// --- 7. HEAD is a descendant of the expected baseline, and changed files since baseline are ---
// --- restricted to the allowed set ---
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

// --- 8. Controlled chart-ai diff is exactly src/pages/chart-ai.astro, and forbidden diff paths ---
// --- (scaffold source, API, Supabase, lockfiles, .env) are empty since baseline ---
const chartAiDiff = gitLines(['diff', '--name-only', BASELINE, '--', CHART_AI_PAGE]);
assert(
  chartAiDiff.length === 1 && chartAiDiff[0] === CHART_AI_PAGE,
  `Controlled chart-ai diff must be exactly [${CHART_AI_PAGE}], got: ${chartAiDiff.join(', ')}`,
);
const forbiddenDiff = gitLines(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]);
assert(forbiddenDiff.length === 0, `Forbidden diff paths changed since baseline: ${forbiddenDiff.join(', ')}`);

// --- 9. No mojibake patterns in the new checker, result doc, or chart-ai.astro ---
const checkerSelfText = read(CHECKER_SELF);
for (const [label, text] of [
  [RESULT_DOC, resultDoc],
  [CHECKER_SELF, checkerSelfText],
  [CHART_AI_PAGE, chartAiPage],
]) {
  for (const marker of MOJIBAKE_MARKERS) {
    assert(!text.includes(marker), `Possible mojibake pattern detected in ${label}`);
  }
}

// --- 10, 11, 12. No forbidden investment language, no raw secrets, no forbidden activation ---
// --- claims in the new docs/checker/fix content (scoped to new content only so this cannot ---
// --- false-positive against pre-existing, unrelated code elsewhere in the large chart-ai.astro ---
// --- file, e.g. the real MK AI trigger button's label) ---
// checkerSelfText is deliberately excluded here: this checker's own source necessarily contains
// the forbidden phrases/patterns below as string literals (it has to, in order to search for
// them), so scanning it here would always self-trip. The established sibling checkers (e.g.
// check_phase_3fg_d_contract.mjs) follow the same exclusion for this reason; CHECKER_SELF is
// still covered by the mojibake scan above, since a mojibake marker cannot legitimately appear
// in this file's own source.
const newDocsContent = [resultDoc, changelogSection, fixBlockText].join('\n');
const newDocsContentUnquoted = stripBacktickSpans(newDocsContent);
for (const phrase of FORBIDDEN_INVESTMENT_PHRASES) {
  assert(
    !newDocsContentUnquoted.includes(phrase),
    `Forbidden investment phrase found in new content outside reference quoting: ${phrase}`,
  );
}
for (const pattern of SECRET_LIKE_PATTERNS) {
  assert(!pattern.test(newDocsContent), `Secret-like or private-identifier pattern found in new content: ${pattern}`);
}
for (const phrase of FORBIDDEN_ACTIVATION_PHRASES) {
  assert(
    !newDocsContent.toLowerCase().includes(phrase.toLowerCase()),
    `Forbidden activation claim found in new content: ${phrase}`,
  );
}

// --- 13. PASS/FAIL summary ---
if (failures.length) {
  console.error(`Phase 3FG-D-HF1 check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3FG-D-HF1 check PASS: ${assertions}/${assertions} assertions passed.`);
}
