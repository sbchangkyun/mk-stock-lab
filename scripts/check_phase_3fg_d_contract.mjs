// Phase 3FG-D contract checker.
// Verifies the owner-local, hidden-by-default guarded productization static UI shell added to
// src/pages/chart-ai.astro exists, is wired correctly, includes all required static state
// labels and Korean safety/boundary copy, introduces no forbidden runtime/source tokens, no
// scaffold import/execution, no API route call, no forbidden CTA/investment-recommendation
// language, and that no forbidden runtime/source path has changed since the Phase 3FG-C
// baseline. This phase is UI-shell-only: it does not activate live KIS, LLM, public/beta,
// API routes, Supabase/DB real runtime, or any real auth/session/JWT/cookie/header parsing.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '99cd694';

const CHART_AI_PAGE = 'src/pages/chart-ai.astro';
const SMOKE_SCRIPT = 'scripts/smoke_phase_3fg_d_owner_local_guarded_productization_ui_static_shell.mjs';
const CHECKER_SELF = 'scripts/check_phase_3fg_d_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3fg_d_owner_local_guarded_productization_ui_static_shell_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [SMOKE_SCRIPT, CHECKER_SELF, RESULT_DOC];
const MODIFIED_FILES = [CHART_AI_PAGE, CHANGELOG, PACKAGE_JSON];

// Sibling checkers patched during this phase so they keep passing against a HEAD that already
// includes this phase's files/changelog header. No protective assertion in any of these files
// may be weakened; each patch may only extend an existing tolerance allowlist. Populated only
// if validation surfaces a genuine compatibility gap (see the Phase 3FG-A / 3FG-B / 3FG-C
// precedent for the pattern).
const PATCHED_SIBLING_CHECKERS = [
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

// Files legitimately added by the later Phase 3FG-E browser QA pass. Tolerated
// here only so this checker keeps passing against a HEAD that already includes
// that phase's deliverables; no protective assertion below is weakened.
const TOLERATED_LATER_PHASE_FILES = [
  'docs/planning/phase_3fg_e_owner_local_guarded_productization_static_shell_browser_qa_checklist_v0.1.md',
  'docs/planning/phase_3fg_e_owner_local_guarded_productization_static_shell_browser_qa_result_v0.1.md',
  'scripts/check_phase_3fg_e_contract.mjs',
  // Phase 3FG-D-HF1's deliverables, tolerated for the same reason.
  'docs/planning/phase_3fg_d_hf1_static_shell_hidden_default_fix_result_v0.1.md',
  'scripts/check_phase_3fg_d_hf1_contract.mjs',
  // Phase 3GG-A-PLAN's deliverables (planning-only; no runtime/source change), tolerated for
  // the same reason.
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

const CHART_AI_REQUIRED_TOKENS = [
  'chartAiOwnerLocalGuardedProductizationStaticShell',
  'ownerLocalGuardedProductizationShell',
  'No live KIS',
  'No LLM',
  'No public/beta activation',
  'No API route activation',
  'No Supabase/DB real runtime',
  'No env/session/JWT/cookie/header parsing',
  '참고용',
  '매수·매도 추천이 아닙니다',
  '투자 자문이 아닙니다',
  '과거 유사 흐름은 미래 성과를 보장하지 않습니다',
  '모든 실제 상품화 게이트는 꺼져 있습니다',
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
  'Status: Implemented.',
  'Baseline: 99cd694.',
  'Phase 3FG-C',
  'Hidden by Default',
  'No Runtime Activation',
  'No API route changed.',
  'No scaffold source changed.',
  'No live KIS.',
  'No LLM.',
  'No public/beta activation.',
  'forbidden diff: empty',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3FG-D - 2026-07-09',
  'Owner-local Guarded Productization UI Static Shell',
  'Hidden by Default',
  'No Runtime Activation',
  '99cd694',
];

const FORBIDDEN_CTA_COPY = ['AI 분석 시작', '지금 실행', '구매하기', '신청하기', '활성화하기', '여기를 눌러'];

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

const FORBIDDEN_RUNTIME_TOKENS = [
  'fetch(',
  'process.env',
  'createClient(',
  'createServerClient(',
  'Astro.cookies',
  'Astro.request.headers',
  'localStorage',
  'sessionStorage',
  'Math.random(',
  'Date.now(',
  'new OpenAI(',
  'new Anthropic(',
  'GoogleGenerativeAI(',
  'appsecret',
  'access_token',
  'service_role',
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

// Phrases that would authorize forbidden runtime activation by this static shell.
const FORBIDDEN_ACTIVATION_PHRASES = [
  'activates live KIS',
  'activates the LLM',
  'activates public',
  'activates beta',
  'activates the API route',
  'unlocks paid entitlement',
  'unlocks ad',
  'deducts usage',
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

// --- 1. Required files exist ---
for (const file of [...CORE_DELIVERABLES, CHART_AI_PAGE, CHANGELOG, PACKAGE_JSON]) {
  assert(exists(file), `Required file missing: ${file}`);
}

// --- 2. package.json contains the exact phase scripts ---
const pkg = JSON.parse(read(PACKAGE_JSON));
assert(
  pkg.scripts &&
    pkg.scripts['smoke:phase-3fg-d'] ===
      'node scripts/smoke_phase_3fg_d_owner_local_guarded_productization_ui_static_shell.mjs',
  'package.json is missing the exact "smoke:phase-3fg-d" script entry',
);
assert(
  pkg.scripts && pkg.scripts['check:phase-3fg-d'] === 'node scripts/check_phase_3fg_d_contract.mjs',
  'package.json is missing the exact "check:phase-3fg-d" script entry',
);

// --- 3. chart-ai.astro contains all required tokens ---
const chartAiPage = read(CHART_AI_PAGE);
for (const token of CHART_AI_REQUIRED_TOKENS) {
  assert(chartAiPage.includes(token), `chart-ai.astro missing required token: ${token}`);
}

// --- 4. chart-ai.astro contains all 8 required state labels ---
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
// Tolerates only the known later Phase 3FG-E header prepended above this
// entry (not a strict "must be the top entry" check, since Phase 3FG-E
// legitimately added its own header above this one).
const TOLERATED_HEADERS_ABOVE_3FG_D = [
  '## Phase 3FG-E - 2026-07-09',
  '## Phase 3FG-D-HF1 - 2026-07-09',
  '## Phase 3GG-A-PLAN - 2026-07-09',
  '## Phase 3GG-B - 2026-07-09',
  '## Phase 3GG-B-AUDIT - 2026-07-09',
  '## Phase 3GG-B-REVIEW-RECORD - 2026-07-09',
  '## Phase 3GG-C - 2026-07-09',
  '## Phase 3GG-D-PLAN - 2026-07-09',
];
const phaseHeaderIndex = changelog.indexOf('## Phase 3FG-D - 2026-07-09');
const precedingHeaders =
  phaseHeaderIndex >= 0 ? changelog.slice(0, phaseHeaderIndex).match(/^## Phase .*$/gm) || [] : [];
const unexpectedPrecedingHeaders = precedingHeaders.filter(
  (header) => !TOLERATED_HEADERS_ABOVE_3FG_D.includes(header.trim()),
);
assert(
  phaseHeaderIndex >= 0 && unexpectedPrecedingHeaders.length === 0,
  `Phase 3FG-D changelog entry has unexpected headers above it: ${unexpectedPrecedingHeaders.join(', ')}`,
);
const nextHeaderIndex = phaseHeaderIndex >= 0 ? changelog.indexOf('\n## Phase ', phaseHeaderIndex + 1) : -1;
assert(nextHeaderIndex > phaseHeaderIndex, 'Could not locate the end of the Phase 3FG-D changelog section');
const changelogSection =
  phaseHeaderIndex >= 0 && nextHeaderIndex > phaseHeaderIndex ? changelog.slice(phaseHeaderIndex, nextHeaderIndex) : '';
assert(changelogSection.includes('99cd694'), 'Phase 3FG-D changelog entry must reference the 99cd694 baseline');

// --- 7. HEAD is a descendant of the expected baseline ---
let isDescendant = true;
try {
  execFileSync('git', ['merge-base', '--is-ancestor', BASELINE, 'HEAD'], { cwd: ROOT, stdio: 'ignore' });
} catch {
  isDescendant = false;
}
assert(isDescendant, `HEAD is not a descendant of baseline ${BASELINE}`);

// --- 8. Changed files since baseline are restricted to the allowed set ---
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

// --- 9. Known untouched paths remain absent from the tracked diff ---
for (const known of KNOWN_UNTOUCHED_PATHS) {
  assert(
    !changedFiles.some((file) => file === known || file.startsWith(known)),
    `Known untouched path unexpectedly present in tracked diff: ${known}`,
  );
}

// --- 10. Controlled chart-ai diff is exactly src/pages/chart-ai.astro among UI/runtime files ---
const chartAiDiff = gitLines(['diff', '--name-only', BASELINE, '--', CHART_AI_PAGE]);
assert(
  chartAiDiff.length === 1 && chartAiDiff[0] === CHART_AI_PAGE,
  `Controlled chart-ai diff must be exactly [${CHART_AI_PAGE}], got: ${chartAiDiff.join(', ')}`,
);

// --- 11. Forbidden diff paths are empty since baseline (scaffold source, API, Supabase, lockfiles, .env) ---
const forbiddenDiff = gitLines(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]);
assert(forbiddenDiff.length === 0, `Forbidden diff paths changed since baseline: ${forbiddenDiff.join(', ')}`);

// --- 12. No mojibake patterns in new docs/checker/page diff ---
for (const [label, text] of [
  [SMOKE_SCRIPT, read(SMOKE_SCRIPT)],
  [CHECKER_SELF, read(CHECKER_SELF)],
  [RESULT_DOC, resultDoc],
  [CHART_AI_PAGE, chartAiPage],
]) {
  for (const marker of MOJIBAKE_MARKERS) {
    assert(!text.includes(marker), `Possible mojibake pattern detected in ${label}`);
  }
}

// --- New-content-only extraction from chart-ai.astro, so forbidden-token checks cannot ---
// --- false-positive against pre-existing, unrelated code elsewhere in this large file. ---
const newFrontmatterBlock = extractBetween(
  chartAiPage,
  '// Phase 3FG-D: owner-local, hidden-by-default static UI shell for the guarded productization',
  '\n---',
  'new frontmatter block',
);
const newMarkupBlock = extractBetween(
  chartAiPage,
  'id="chartAiOwnerLocalGuardedProductizationStaticShell"',
  '\n      </section>',
  'new markup section',
);
const newScriptBlock = extractBetween(
  chartAiPage,
  '// Owner-local guarded productization static shell (Phase 3FG-D).',
  'authGateCta?.addEventListener',
  'new script block',
);
const newStyleBlock = extractBetween(
  chartAiPage,
  '.chart-owner-local-guarded-productization-shell {',
  '.chart-company-placeholder small {',
  'new style block',
);
assert(newFrontmatterBlock !== null, 'Could not locate the new frontmatter block in chart-ai.astro');
assert(newMarkupBlock !== null, 'Could not locate the new markup section in chart-ai.astro');
assert(newScriptBlock !== null, 'Could not locate the new script block in chart-ai.astro');
assert(newStyleBlock !== null, 'Could not locate the new style block in chart-ai.astro');
const newChartAiContent = [newFrontmatterBlock, newMarkupBlock, newScriptBlock, newStyleBlock]
  .filter((block) => block !== null)
  .join('\n');

// --- 13. No forbidden investment language as approved recommendation text, no forbidden CTA copy, ---
// --- no forbidden runtime/source tokens, no raw secrets, and no forbidden activation authorization ---
for (const phrase of FORBIDDEN_INVESTMENT_PHRASES) {
  assert(!newChartAiContent.includes(phrase), `Forbidden investment phrase found in new shell content: ${phrase}`);
}
for (const phrase of FORBIDDEN_CTA_COPY) {
  assert(!newChartAiContent.includes(phrase), `Forbidden CTA copy found in new shell content: ${phrase}`);
}
for (const token of FORBIDDEN_RUNTIME_TOKENS) {
  assert(!newChartAiContent.includes(token), `Forbidden runtime/source token found in new shell content: ${token}`);
}
for (const pattern of SECRET_LIKE_PATTERNS) {
  assert(!pattern.test(newChartAiContent), `Secret-like or private-identifier pattern found in new shell content: ${pattern}`);
}
for (const phrase of FORBIDDEN_ACTIVATION_PHRASES) {
  assert(
    !newChartAiContent.toLowerCase().includes(phrase.toLowerCase()),
    `Forbidden activation authorization phrase found in new shell content: ${phrase}`,
  );
}
assert(!newChartAiContent.includes('/api/'), 'New shell content must not reference any API route path.');
assert(
  !newChartAiContent.includes('guarded-productization-scaffold'),
  'New shell content must not import or execute the guarded productization scaffold module.',
);

if (failures.length) {
  console.error(`Phase 3FG-D check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3FG-D check PASS: ${assertions}/${assertions} assertions passed.`);
}
