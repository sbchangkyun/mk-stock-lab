// Phase 3FG-A contract checker.
// Verifies the guarded productization scaffold (all real productization
// gates off) is present, internally consistent, exports its required
// symbols, avoids forbidden runtime APIs/secrets, and has not touched any
// forbidden runtime/source path since the Phase 3FG-A-PLAN baseline.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '176893e';

const SOURCE_MODULE = 'src/lib/server/chart-ai/guarded-productization-scaffold.mjs';
const FIXTURE_MODULE = 'src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs';
const SMOKE_SCRIPT = 'scripts/smoke_phase_3fg_a_guarded_productization_scaffold_all_gates_off.mjs';
const CHECKER_SELF = 'scripts/check_phase_3fg_a_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3fg_a_guarded_productization_scaffold_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [SOURCE_MODULE, FIXTURE_MODULE, SMOKE_SCRIPT, CHECKER_SELF, RESULT_DOC];
const MODIFIED_FILES = [CHANGELOG, PACKAGE_JSON];

// Sibling checkers patched during this phase so they keep passing against a
// HEAD that already includes this phase's files/changelog header. No
// protective assertion in any of these files may be weakened; each patch
// may only extend an existing tolerance allowlist. Populated only if
// validation surfaces a genuine compatibility gap (see the Phase
// 3FG-A-PLAN precedent for the pattern).
const PATCHED_SIBLING_CHECKERS = [
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
];

// Files legitimately added by the later Phase 3FG-B QA pass. Tolerated here
// only so this checker keeps passing against a HEAD that already includes
// that phase's deliverables; no protective assertion is weakened.
const TOLERATED_LATER_PHASE_FILES = [
  'docs/planning/phase_3fg_b_owner_local_guarded_productization_qa_checklist_v0.1.md',
  'docs/planning/phase_3fg_b_owner_local_guarded_productization_qa_result_v0.1.md',
  'scripts/check_phase_3fg_b_contract.mjs',
  // Sibling checkers patched as part of Phase 3FG-B's own validation chain
  // (validator-compatibility only; no protective assertion weakened).
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
  // Files legitimately added by the later Phase 3FG-C UI readiness plan.
  'docs/planning/phase_3fg_c_owner_local_guarded_productization_ui_readiness_plan_v0.1.md',
  'docs/planning/phase_3fg_c_owner_local_guarded_productization_ui_readiness_result_v0.1.md',
  'scripts/check_phase_3fg_c_contract.mjs',
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
  // Phase 3GG-D-PLAN (documentation/checker-only; no runtime/source change).
  'docs/planning/phase_3gg_d_plan_local_only_live_kis_provider_binding_plan_v0.1.md',
  'docs/planning/phase_3gg_d_plan_local_only_live_kis_provider_binding_plan_result_v0.1.md',
  'scripts/check_phase_3gg_d_plan_contract.mjs',
  // Phase 3GG-D (local-only Live KIS provider binding scaffold; all gates
  // off, no live call; scaffold/fixture/smoke/checker/result only), tolerated
  // for the same reason.
  'src/lib/server/chart-ai/local-only-live-kis-provider-binding-scaffold.mjs',
  'src/lib/server/chart-ai/local-only-live-kis-provider-binding-scaffold.fixture.mjs',
  'scripts/smoke_phase_3gg_d_local_only_live_kis_provider_binding_scaffold.mjs',
  'scripts/check_phase_3gg_d_contract.mjs',
  'docs/planning/phase_3gg_d_local_only_live_kis_provider_binding_scaffold_result_v0.1.md',
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

const SOURCE_REQUIRED_EXPORTS = [
  'GUARDED_PRODUCTIZATION_SCAFFOLD_VERSION',
  'DEFAULT_GUARDED_PRODUCTIZATION_FLAGS',
  'createDefaultGuardedProductizationFlags',
  'createGuardedProductizationContext',
  'evaluateGuardedProductizationAccess',
  'createFailClosedDecision',
  'summarizeGuardedProductizationDecision',
  'assertNoRuntimeActivation',
];

const FIXTURE_REQUIRED_EXPORTS = [
  'createDefaultGuardedProductizationFixture',
  'createOwnerLocalFixtureRequest',
  'createBetaAttemptFixtureRequest',
  'createPublicAttemptFixtureRequest',
  'createLiveKisAttemptFixtureRequest',
  'createLlmAttemptFixtureRequest',
  'createRealAuthAttemptFixtureRequest',
];

const REQUIRED_DEFAULT_GATE_KEYS = [
  'ownerLocalEnabled',
  'internalQaEnabled',
  'betaEnabled',
  'publicEnabled',
  'liveKisEnabled',
  'llmEnabled',
  'mkAiRouteEnabled',
  'realAuthEnabled',
  'supabaseEnabled',
  'dbEnabled',
  'usageDeductionEnabled',
  'paidEntitlementEnabled',
  'adUnlockEnabled',
  'deployEnabled',
  'pushEnabled',
];

const SMOKE_REQUIRED_SCENARIOS = [
  'default flags are all false',
  'default decision is fail-closed',
  'owner-local fixture is still blocked unless explicitly allowed by a safe scaffold-only path',
  'beta attempt is blocked',
  'public attempt is blocked',
  'live_kis provider mode is blocked',
  'llm agent mode is blocked',
  'real auth attempt is blocked',
  'Supabase/DB/env/session/JWT/cookie/header are not used',
  'no forbidden investment recommendation phrases are emitted',
  'safety copy exists',
  'decision output is deterministic across repeated calls',
];

const RESULT_DOC_REQUIRED_TOKENS = [
  'Status: Implemented.',
  'Baseline: 176893e.',
  'Phase 3FG-A-PLAN',
  'rebuild/phase-1-ia-shell',
  'Phase 3FG-B',
  'live KIS',
  'LLM',
  'beta/public activation',
  'deploy',
  'push',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3FG-A - 2026-07-09',
  'Guarded Productization Scaffold, All Gates Off',
  '176893e',
  'Phase 3FG-B',
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

// Constructed from numeric code points so this checker's own text can never
// trip its own mojibake scan.
const MOJIBAKE_MARKERS = [String.fromCharCode(0xfffd)];

// Call-pattern denylist (not bare words) so it never collides with the
// required "No env/session/JWT/cookie/header parsing" boundary copy, which
// necessarily contains the plain words "env", "cookie", "header", "JWT".
const RUNTIME_DENYLIST_PATTERNS = [
  'fetch(',
  'process.env',
  'createClient(',
  '.cookies(',
  'Astro.cookies',
  '.headers(',
  'Astro.request.headers',
  'jwt.verify(',
  'jwt.sign(',
  'jsonwebtoken',
  'localStorage.',
  'sessionStorage.',
  'Math.random(',
  'Date.now(',
  'new OpenAI(',
  'new Anthropic(',
  'GoogleGenerativeAI(',
];
const SECRET_TOKEN_PATTERN = /appsecret|access_token|service_role/i;

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

// --- 2. package.json contains the exact phase scripts ---
const pkg = JSON.parse(read(PACKAGE_JSON));
assert(
  pkg.scripts &&
    pkg.scripts['smoke:phase-3fg-a'] ===
      'node scripts/smoke_phase_3fg_a_guarded_productization_scaffold_all_gates_off.mjs',
  'package.json is missing the exact "smoke:phase-3fg-a" script entry',
);
assert(
  pkg.scripts && pkg.scripts['check:phase-3fg-a'] === 'node scripts/check_phase_3fg_a_contract.mjs',
  'package.json is missing the exact "check:phase-3fg-a" script entry',
);

// --- 3. Source module exports all required symbols ---
const sourceText = read(SOURCE_MODULE);
for (const symbol of SOURCE_REQUIRED_EXPORTS) {
  assert(
    new RegExp(`export\\s+(const|function)\\s+${symbol}\\b`).test(sourceText),
    `Source module missing required export: ${symbol}`,
  );
}

// --- 4. Fixture module exports all required symbols ---
const fixtureText = read(FIXTURE_MODULE);
for (const symbol of FIXTURE_REQUIRED_EXPORTS) {
  assert(
    new RegExp(`export\\s+function\\s+${symbol}\\b`).test(fixtureText),
    `Fixture module missing required export: ${symbol}`,
  );
}

// --- 5. Default gate keys are all false in source ---
for (const key of REQUIRED_DEFAULT_GATE_KEYS) {
  assert(
    new RegExp(`${key}:\\s*false`).test(sourceText),
    `Source module DEFAULT_GUARDED_PRODUCTIZATION_FLAGS missing false default for: ${key}`,
  );
}

// --- 6. Smoke script includes all required scenario names ---
const smokeText = read(SMOKE_SCRIPT);
for (const scenario of SMOKE_REQUIRED_SCENARIOS) {
  assert(smokeText.includes(scenario), `Smoke script missing required scenario name: ${scenario}`);
}

// --- 7. Result doc contains all required tokens ---
const resultDoc = read(RESULT_DOC);
for (const token of RESULT_DOC_REQUIRED_TOKENS) {
  assert(resultDoc.includes(token), `Result doc missing required token: ${token}`);
}

// --- 8. Changelog contains all required tokens ---
const changelog = read(CHANGELOG);
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelog.includes(token), `Changelog missing required token: ${token}`);
}

// --- 8b. Changelog entry is present, tolerating only known later-phase
// headers prepended above it (not a strict "must be the top entry" check,
// since Phase 3FG-B legitimately added its own header above this one) ---
const TOLERATED_HEADERS_ABOVE_3FG_A = [
  '## Phase 3FG-B - 2026-07-09',
  '## Phase 3FG-C - 2026-07-09',
  '## Phase 3FG-D - 2026-07-09',
  '## Phase 3FG-E - 2026-07-09',
  '## Phase 3FG-D-HF1 - 2026-07-09',
  '## Phase 3GG-A-PLAN - 2026-07-09',
  '## Phase 3GG-B - 2026-07-09',
  '## Phase 3GG-B-AUDIT - 2026-07-09',
  '## Phase 3GG-B-REVIEW-RECORD - 2026-07-09',
  '## Phase 3GG-C - 2026-07-09',
  '## Phase 3GG-D-PLAN - 2026-07-09',
  '## Phase 3GG-D - 2026-07-10',
];
const phaseHeaderIndex = changelog.indexOf('## Phase 3FG-A - 2026-07-09');
const precedingHeaders = phaseHeaderIndex >= 0 ? changelog.slice(0, phaseHeaderIndex).match(/^## Phase .*$/gm) || [] : [];
const unexpectedPrecedingHeaders = precedingHeaders.filter(
  (header) => !TOLERATED_HEADERS_ABOVE_3FG_A.includes(header.trim()),
);
assert(
  phaseHeaderIndex >= 0 && unexpectedPrecedingHeaders.length === 0,
  `Phase 3FG-A changelog entry has unexpected headers above it: ${unexpectedPrecedingHeaders.join(', ')}`,
);
const nextHeaderIndex = phaseHeaderIndex >= 0 ? changelog.indexOf('\n## Phase ', phaseHeaderIndex + 1) : -1;
assert(nextHeaderIndex > phaseHeaderIndex, 'Could not locate the end of the Phase 3FG-A changelog section');
const changelogSection =
  phaseHeaderIndex >= 0 && nextHeaderIndex > phaseHeaderIndex ? changelog.slice(phaseHeaderIndex, nextHeaderIndex) : '';
assert(changelogSection.includes('176893e'), 'Phase 3FG-A changelog entry must reference the 176893e baseline');

// --- 9. HEAD is a descendant of the expected baseline ---
let isDescendant = true;
try {
  execFileSync('git', ['merge-base', '--is-ancestor', BASELINE, 'HEAD'], { cwd: ROOT, stdio: 'ignore' });
} catch {
  isDescendant = false;
}
assert(isDescendant, `HEAD is not a descendant of baseline ${BASELINE}`);

// --- 10. Changed files since baseline are restricted to the allowed set ---
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

// --- 11. Known untouched paths remain absent from the tracked diff ---
for (const known of KNOWN_UNTOUCHED_PATHS) {
  assert(
    !changedFiles.some((file) => file === known || file.startsWith(known)),
    `Known untouched path unexpectedly present in tracked diff: ${known}`,
  );
}

// --- 12. Forbidden diff paths are empty since baseline (also covers .env/.env.local/lockfiles) ---
const forbiddenDiff = gitLines(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]).filter(
  (file) => !TOLERATED_FORBIDDEN_DIFF_EXCEPTIONS.includes(file),
);
assert(forbiddenDiff.length === 0, `Forbidden diff paths changed since baseline: ${forbiddenDiff.join(', ')}`);

// --- 13. No mojibake patterns in new/changed docs and source ---
for (const [label, text] of [
  [SOURCE_MODULE, sourceText],
  [FIXTURE_MODULE, fixtureText],
  [SMOKE_SCRIPT, smokeText],
  [RESULT_DOC, resultDoc],
]) {
  for (const marker of MOJIBAKE_MARKERS) {
    assert(!text.includes(marker), `Possible mojibake pattern detected in ${label}`);
  }
}

// --- 14. No forbidden investment language present as approved text ---
// (This checker's own source and the smoke script are intentionally
// excluded: they must contain these phrases literally as pattern-match
// strings in order to test that they never appear in real output.)
for (const [label, text] of [
  [SOURCE_MODULE, sourceText],
  [FIXTURE_MODULE, fixtureText],
  [RESULT_DOC, resultDoc],
  [CHANGELOG, changelogSection],
]) {
  for (const phrase of FORBIDDEN_INVESTMENT_PHRASES) {
    assert(!text.includes(phrase), `Forbidden investment phrase found in ${label}: ${phrase}`);
  }
}

// --- 15. No forbidden runtime APIs or secret-like tokens in the new scaffold source ---
for (const [label, text] of [
  [SOURCE_MODULE, sourceText],
  [FIXTURE_MODULE, fixtureText],
]) {
  for (const pattern of RUNTIME_DENYLIST_PATTERNS) {
    assert(!text.includes(pattern), `Forbidden runtime API pattern found in ${label}: ${pattern}`);
  }
  assert(!SECRET_TOKEN_PATTERN.test(text), `Secret-like token pattern found in ${label}`);
}

if (failures.length) {
  console.error(`Phase 3FG-A check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3FG-A check PASS: ${assertions}/${assertions} assertions passed.`);
}
