// Phase 3FG-E contract checker.
// Verifies the owner-local Browser QA deliverables for the Phase 3FG-D guarded productization
// static UI shell (checklist doc, result doc, this checker) exist and contain all required
// tokens, that package.json and the planning changelog were updated correctly, that no forbidden
// runtime/source path has changed since the Phase 3FG-D baseline (including src/pages/chart-ai.astro
// itself, which this phase must not touch at all), that changed files are restricted to the
// allowed set, and that the new docs/checker contain no mojibake, no forbidden investment
// language, no raw secrets, and no claim of forbidden runtime activation. This phase is
// Browser-QA/documentation/checker-only: it does not activate live KIS, LLM, public/beta,
// API routes, Supabase/DB real runtime, or any real auth/session/JWT/cookie/header parsing.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = 'e4414e5';
// Phase 3FG-E's own completion commit. Assertions that verify what THIS phase itself guaranteed
// about src/pages/chart-ai.astro (namely: 3FG-E made zero changes to it) are pinned to this frozen
// historical range instead of live HEAD/working tree, because Phase 3FG-D-HF1 legitimately must
// change that file afterward (3FG-E's own changelog entry named HF1 as the required next step).
// Pinning to a frozen range restores what 3FG-E actually promised, without incorrectly extending
// that promise to forbid every later phase from ever touching the file again.
const FROZEN_HEAD_FOR_3FG_E = '4b620d2';

const CHART_AI_PAGE = 'src/pages/chart-ai.astro';
const CHECKLIST_DOC =
  'docs/planning/phase_3fg_e_owner_local_guarded_productization_static_shell_browser_qa_checklist_v0.1.md';
const RESULT_DOC =
  'docs/planning/phase_3fg_e_owner_local_guarded_productization_static_shell_browser_qa_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3fg_e_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [CHECKLIST_DOC, RESULT_DOC, CHECKER_SELF];
const MODIFIED_FILES = [CHANGELOG, PACKAGE_JSON];

// Sibling checkers patched during this phase so they keep passing against a HEAD that already
// includes this phase's files/changelog header. No protective assertion in any of these files
// may be weakened; each patch may only extend an existing tolerance allowlist. Populated only
// if validation surfaces a genuine compatibility gap (see the Phase 3FG-D / 3FG-C precedent).
const PATCHED_SIBLING_CHECKERS = [
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
  // Pre-existing gap discovered (not caused) by Phase 3GG-A-PLAN's validation run: these 6
  // checkers were legitimately patched by earlier phases after this phase's own e4414e5
  // baseline, but this allowlist was never updated to tolerate them. Additive-only fix.
  'scripts/check_phase_3ff_a_handoff_a_contract.mjs',
  'scripts/check_phase_3ff_a_housekeeping_a_contract.mjs',
  'scripts/check_phase_3ff_a_mk_b_contract.mjs',
  'scripts/check_phase_3ff_a_mk_c_contract.mjs',
  'scripts/check_phase_3ff_a_plan_contract.mjs',
  'scripts/check_phase_3ff_a_sp_b_contract.mjs',
];

// Files legitimately created or modified by a later phase (Phase 3FG-D-HF1) that this checker
// must tolerate seeing in the diff/status without treating them as unexpected. This does not
// weaken any protective assertion: it is a pure additive allowlist, matching the established
// TOLERATED_LATER_PHASE_FILES pattern already used by scripts/check_phase_3fg_d_contract.mjs.
const TOLERATED_LATER_PHASE_FILES = [
  'scripts/check_phase_3fg_d_hf1_contract.mjs',
  'docs/planning/phase_3fg_d_hf1_static_shell_hidden_default_fix_result_v0.1.md',
  CHART_AI_PAGE,
  // Phase 3GG-A-PLAN (planning-only; no runtime/source change).
  'docs/planning/phase_3gg_a_plan_live_kis_llm_approval_runtime_binding_v0.1.md',
  'docs/planning/phase_3gg_a_plan_result_v0.1.md',
  'scripts/check_phase_3gg_a_plan_contract.mjs',
];

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
];

// Unlike Phase 3FG-D, this phase's forbidden-diff list includes src/pages/chart-ai.astro itself,
// since Phase 3FG-E must not touch it at all.
const REQUIRED_FORBIDDEN_DIFF_PATHS = [
  CHART_AI_PAGE,
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
  'Phase 3FG-E',
  'e4414e5',
  'Phase 3FG-D',
  'Browser QA',
  'ownerLocalGuardedProductizationShell=1',
  'chartAiOwnerLocalGuardedProductizationStaticShell',
  'hidden by default',
  'PC viewport',
  'mobile viewport',
  'console',
  'network',
  'No live KIS',
  'No LLM',
  'No API route activation',
  'all real gates off',
];

const RESULT_DOC_REQUIRED_TOKENS = [
  'Status: Executed.',
  'Baseline: e4414e5.',
  'Phase 3FG-D',
  'Browser QA',
  'PC viewport',
  'Mobile viewport',
  'console errors',
  'network calls',
  'No source changes.',
  'No chart-ai.astro change.',
  'No API route changed.',
  'No scaffold source changed.',
  'No live KIS.',
  'No LLM.',
  'No public/beta activation.',
  'forbidden diff: empty',
  'controlled chart-ai diff: empty',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3FG-E - 2026-07-09',
  'Owner-local Guarded Productization Static Shell Browser QA',
  'All Real Gates Off',
  'e4414e5',
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

function extractBetween(source, startMarker, endMarker, label) {
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
// absence from live UI copy (e.g. "the forbidden phrases (`매수하세요`, ...) are absent").
// Strip backtick-quoted spans before scanning for forbidden phrases so this reference-only
// quoting cannot false-positive; a phrase appearing as live, unquoted text would still be caught.
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
  pkg.scripts && pkg.scripts['check:phase-3fg-e'] === 'node scripts/check_phase_3fg_e_contract.mjs',
  'package.json is missing the exact "check:phase-3fg-e" script entry',
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
// Tolerates only the known later Phase 3FG-D-HF1 header prepended above this entry (not a strict
// "must be the top entry" check, since Phase 3FG-D-HF1 legitimately added its own header above
// this one). Matches the established pattern in scripts/check_phase_3fg_d_contract.mjs.
const TOLERATED_HEADERS_ABOVE_3FG_E = [
  '## Phase 3FG-D-HF1 - 2026-07-09',
  '## Phase 3GG-A-PLAN - 2026-07-09',
];
const phaseHeaderIndex = changelog.indexOf('## Phase 3FG-E - 2026-07-09');
const precedingHeaders =
  phaseHeaderIndex >= 0 ? changelog.slice(0, phaseHeaderIndex).match(/^## Phase .*$/gm) || [] : [];
const unexpectedPrecedingHeaders = precedingHeaders.filter(
  (header) => !TOLERATED_HEADERS_ABOVE_3FG_E.includes(header.trim()),
);
assert(
  phaseHeaderIndex >= 0 && unexpectedPrecedingHeaders.length === 0,
  `Phase 3FG-E changelog entry has unexpected headers above it: ${unexpectedPrecedingHeaders.join(', ')}`,
);
const nextHeaderIndex = phaseHeaderIndex >= 0 ? changelog.indexOf('\n## Phase ', phaseHeaderIndex + 1) : -1;
assert(nextHeaderIndex > phaseHeaderIndex, 'Could not locate the end of the Phase 3FG-E changelog section');
const changelogSection =
  phaseHeaderIndex >= 0 && nextHeaderIndex > phaseHeaderIndex
    ? changelog.slice(phaseHeaderIndex, nextHeaderIndex)
    : '';
assert(changelogSection.includes('e4414e5'), 'Phase 3FG-E changelog entry must reference the e4414e5 baseline');

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

// --- 9. Controlled chart-ai diff is empty across what Phase 3FG-E itself actually committed ---
// (baseline through 3FG-E's own completion commit). This is pinned to the frozen historical range
// rather than live HEAD/working tree because Phase 3FG-D-HF1 legitimately changes this file
// afterward; see FROZEN_HEAD_FOR_3FG_E above.
const chartAiDiff = gitLines(['diff', '--name-only', BASELINE, FROZEN_HEAD_FOR_3FG_E, '--', CHART_AI_PAGE]);
assert(chartAiDiff.length === 0, `Controlled chart-ai diff must be empty, got: ${chartAiDiff.join(', ')}`);

// --- 10. Forbidden diff paths are empty since baseline (scaffold source, API, Supabase, ---
// --- lockfiles, .env). chart-ai.astro is checked separately above against the frozen range, ---
// --- since Phase 3FG-D-HF1 legitimately changes it after 3FG-E's own completion commit. ---
const forbiddenDiffPathsExcludingChartAi = REQUIRED_FORBIDDEN_DIFF_PATHS.filter((p) => p !== CHART_AI_PAGE);
const forbiddenDiff = gitLines(['diff', '--name-only', BASELINE, '--', ...forbiddenDiffPathsExcludingChartAi]);
assert(forbiddenDiff.length === 0, `Forbidden diff paths changed since baseline: ${forbiddenDiff.join(', ')}`);

// --- 11. No mojibake patterns in new docs/checker ---
const checkerSelfText = read(CHECKER_SELF);
for (const [label, text] of [
  [CHECKLIST_DOC, checklistDoc],
  [RESULT_DOC, resultDoc],
  [CHECKER_SELF, checkerSelfText],
]) {
  for (const marker of MOJIBAKE_MARKERS) {
    assert(!text.includes(marker), `Possible mojibake pattern detected in ${label}`);
  }
}

// --- 12. No forbidden investment language, no raw secrets, no forbidden activation claims in ---
// --- the new docs/checker (checklist doc, result doc, changelog's new Phase 3FG-E section) ---
const newDocsContent = [checklistDoc, resultDoc, changelogSection].join('\n');
const newDocsContentUnquoted = stripBacktickSpans(newDocsContent);
for (const phrase of FORBIDDEN_INVESTMENT_PHRASES) {
  assert(
    !newDocsContentUnquoted.includes(phrase),
    `Forbidden investment phrase found in new docs outside reference quoting: ${phrase}`,
  );
}
for (const pattern of SECRET_LIKE_PATTERNS) {
  assert(!pattern.test(newDocsContent), `Secret-like or private-identifier pattern found in new docs: ${pattern}`);
}
for (const phrase of FORBIDDEN_ACTIVATION_PHRASES) {
  assert(
    !newDocsContent.toLowerCase().includes(phrase.toLowerCase()),
    `Forbidden activation claim found in new docs: ${phrase}`,
  );
}

if (failures.length) {
  console.error(`Phase 3FG-E check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3FG-E check PASS: ${assertions}/${assertions} assertions passed.`);
}
