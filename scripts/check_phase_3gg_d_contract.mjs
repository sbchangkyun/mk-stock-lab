// Phase 3GG-D contract checker.
// Verifies the Local-only Live KIS Provider Binding Scaffold (all gates
// off, no live call, no credential read, no API route activation) is
// present, internally consistent, safe (no network/env/credential
// primitives, no secrets, no false activation claims), and has not touched
// any forbidden runtime/source path since the Phase 3GG-D-PLAN baseline.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '2490e3be6e8429f7b7f33d2e684ddac6f5f9942c';

const SCAFFOLD_SRC = 'src/lib/server/chart-ai/local-only-live-kis-provider-binding-scaffold.mjs';
const SCAFFOLD_FIXTURE = 'src/lib/server/chart-ai/local-only-live-kis-provider-binding-scaffold.fixture.mjs';
const SMOKE_SCRIPT = 'scripts/smoke_phase_3gg_d_local_only_live_kis_provider_binding_scaffold.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_d_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_d_local_only_live_kis_provider_binding_scaffold_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [SCAFFOLD_SRC, SCAFFOLD_FIXTURE, SMOKE_SCRIPT, CHECKER_SELF, RESULT_DOC];
const MODIFIED_FILES = [CHANGELOG, PACKAGE_JSON];

// Sibling phase checkers patched during this phase so they keep passing
// against a HEAD that already includes this phase's own changes. Every
// patch is additive-only (no protective assertion weakened or removed).
// Populated only with checkers an actual validation run demonstrated
// needed a patch -- see the phase result doc for the exact list applied.
const PATCHED_SIBLING_CHECKERS = [
  'scripts/check_phase_3fg_a_plan_contract.mjs',
  'scripts/check_phase_3fg_a_contract.mjs',
  'scripts/check_phase_3fg_b_contract.mjs',
  'scripts/check_phase_3fg_c_contract.mjs',
  'scripts/check_phase_3fg_d_contract.mjs',
  'scripts/check_phase_3fg_e_contract.mjs',
  'scripts/check_phase_3fg_d_hf1_contract.mjs',
  'scripts/check_phase_3gg_a_plan_contract.mjs',
  'scripts/check_phase_3gg_b_contract.mjs',
  'scripts/check_phase_3gg_b_audit_contract.mjs',
  'scripts/check_phase_3gg_b_review_record_contract.mjs',
  'scripts/check_phase_3gg_c_contract.mjs',
  'scripts/check_phase_3gg_d_plan_contract.mjs',
  'scripts/check_phase_3ff_a_sp_a_contract.mjs',
  'scripts/check_phase_3ff_a_mk_a_contract.mjs',
  'scripts/check_phase_3ff_a_ui_a_contract.mjs',
  'scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs',
  'scripts/check_phase_3ff_a_ui_c_manual_qa_contract.mjs',
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
// The two new scaffold/fixture files also match /kis/i by filename but are
// allowed deliverables of this phase (handled separately below).
const KIS_PROVIDER_CANDIDATE_PATHS = [
  'src/lib/server/kis',
  'src/lib/kis',
  'src/server/kis',
  'src/lib/server/chart-ai/kis',
  'src/lib/server/providers/kis',
];

// --- Required exports in the scaffold source (verbatim names) ---
const SCAFFOLD_REQUIRED_EXPORT_TOKENS = [
  'LOCAL_ONLY_LIVE_KIS_BINDING_CONTRACT_VERSION',
  'DEFAULT_LOCAL_ONLY_LIVE_KIS_BINDING_FLAGS',
  'APPROVED_MARKET_DATA_ENDPOINT_CATEGORIES',
  'FORBIDDEN_KIS_ENDPOINT_CATEGORIES',
  'LOCAL_ONLY_ALLOWED_HOSTNAMES',
  'LOCAL_ONLY_BLOCKED_AUDIENCES',
  'DEFAULT_LOCAL_ONLY_RATE_LIMIT',
  'DEFAULT_LOCAL_ONLY_CACHE_POLICY',
  'DEFAULT_LOCAL_ONLY_COST_POLICY',
  'createFailClosedLocalOnlyLiveKisBindingDecision',
  'isLocalOnlyRuntime',
  'classifyKisEndpointCategory',
  'evaluateEndpointAllowlist',
  'evaluateLocalOnlyRateLimit',
  'evaluateLocalOnlyCachePolicy',
  'createSanitizedKisMarketDataPreview',
  'createMinimalKisAuditLogPreview',
  'createLocalOnlyLiveKisRollbackDecision',
  'evaluateLocalOnlyLiveKisProviderBindingScaffold',
  'assertNoLocalOnlyLiveKisRuntimeActivation',
];

const SCAFFOLD_REQUIRED_LITERAL_TOKENS = [
  'providerCallAllowed: false',
  'credentialReadAllowed: false',
  'apiRouteActivationAllowed: false',
  'liveKisActivated: false',
  'rawPayloadExposureAllowed: false',
  'llmHandoffAllowed: false',
  'fixture-only/no-live-KIS',
  '5/min, 30/hour, 100/day',
  '300',
];

const FIXTURE_REQUIRED_EXPORT_TOKENS = [
  'createDefaultLocalOnlyLiveKisScaffoldFixture',
  'createAcknowledgedLocalOnlyScaffoldFixture',
  'createNonLocalLiveKisScaffoldAttemptFixture',
  'createPublicLiveKisScaffoldAttemptFixture',
  'createBetaLiveKisScaffoldAttemptFixture',
  'createInternalQaLiveKisScaffoldAttemptFixture',
  'createLiveKisProviderModeAttemptFixture',
  'createForbiddenEndpointAttemptFixture',
  'createUnlistedEndpointAttemptFixture',
  'createRateLimitExceededAttemptFixture',
  'createCacheHitFixture',
  'createRawPayloadExposureAttemptFixture',
  'createLlmHandoffAttemptFixture',
  'createRollbackFixture',
];

const SMOKE_REQUIRED_KEYWORD_TOKENS = [
  'default fixture fails closed',
  'acknowledged local scaffold fixture',
  'non-local request',
  'public request',
  'beta request',
  'internal QA request',
  'providerMode live_kis attempt',
  'forbidden endpoint category',
  'unlisted endpoint category',
  'rate limit exceeded',
  'cache hit skips provider call',
  'raw payload exposure attempt',
  'LLM handoff attempt',
  'rollback decision',
  'assertNoLocalOnlyLiveKisRuntimeActivation',
];

// Network/env/credential primitives that must never appear in the new
// scaffold or fixture source files.
const FORBIDDEN_SOURCE_SUBSTRINGS = [
  'fetch(',
  'axios',
  'XMLHttpRequest',
  'http.request',
  'https.request',
  'process.env',
  'readFile',
  'readFileSync',
  'dotenv',
  '.env',
  'access_token',
  'appsecret',
  'service_role',
  'Authorization',
  'Bearer',
  'Set-Cookie',
  'document.cookie',
  'localStorage',
  'sessionStorage',
];

const RESULT_DOC_REQUIRED_TOKENS = [
  'Status: Implemented.',
  'Baseline: 2490e3be6e8429f7b7f33d2e684ddac6f5f9942c',
  'Phase 3GG-D-PLAN',
  'Scaffold summary',
  'Fixture summary',
  'Smoke summary',
  'Owner condition preservation',
  'Local-only guard summary',
  'Endpoint allowlist summary',
  'Rate/cache/cost/fail-closed/logging/rollback summary',
  'Activation status',
  'Validation results',
  'Forbidden diff result',
  'KIS provider diff result',
  'Boundary preservation',
  'Known out-of-scope issues',
  'Next recommended phase',
  'Live KIS remains blocked and inactive',
  'No live KIS call.',
  'No credential or .env read.',
  'No API route created or activated.',
  'No existing KIS provider module modified.',
  'isolated scaffold source/fixture',
  'No deploy.',
  'No push.',
  'forbidden diff: empty',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-D - 2026-07-10',
  'Local-only Live KIS Provider Binding Scaffold',
  'All Gates Off',
  'No Live Call',
  '2490e3be6e8429f7b7f33d2e684ddac6f5f9942c',
  'Phase 3GG-E-PLAN',
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

const SECRET_LIKE_CHECKS = [
  { name: 'JWT-like value', regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { name: 'email address', regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
  { name: 'private key block', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'long digit sequence (possible account number)', regex: /\b\d{10,}\b/ },
  { name: '"access_token" literal', regex: /access_token/i },
  { name: '"appsecret" literal', regex: /appsecret/i },
  { name: '"service_role" literal', regex: /service_role/i },
];

// Affirmative activation-claim phrases (lowercase). A phrase found inside a
// sentence that also contains a negation word (no/not/never/without/none)
// anywhere before the phrase within that same sentence is treated as a
// compliant negated statement, not a violation -- this project's result
// docs are required to state e.g. "No credential or .env read happened.",
// which legitimately contains the substring ".env read".
const FORBIDDEN_ACTIVATION_CLAIM_PHRASES = [
  'live kis activated',
  'live kis called',
  'real kis provider called',
  'credential read',
  'credentials read',
  '.env read',
  'llm activated',
  'public activation',
  'beta activation',
  'internal qa activation',
  'api route activated',
  'supabase real runtime used',
  'db real runtime used',
  'usage deducted',
  'paid entitlement unlocked',
  'ad unlock occurred',
  'deploy occurred',
  'push occurred',
];

const NEGATION_WORDS = /\b(no|not|never|without|none|zero)\b/;

function splitIntoSentences(text) {
  return text.split(/(?<=[.!?\n])/);
}

function hasUnnegatedClaim(text, phrase) {
  const sentences = splitIntoSentences(text);
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    const idx = lower.indexOf(phrase);
    if (idx === -1) continue;
    const before = lower.slice(0, idx);
    const after = lower.slice(idx + phrase.length, idx + phrase.length + 20);
    if (!NEGATION_WORDS.test(before) && !NEGATION_WORDS.test(after)) {
      return true;
    }
  }
  return false;
}

// Constructed from numeric code points (not written as a literal mojibake
// byte sequence in source) so this checker's own text can never trip its
// own mojibake scan.
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
  pkg.scripts && pkg.scripts['smoke:phase-3gg-d'] === `node ${SMOKE_SCRIPT}`,
  'package.json is missing the exact "smoke:phase-3gg-d" script entry',
);
assert(
  pkg.scripts && pkg.scripts['check:phase-3gg-d'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-d" script entry',
);

// --- 3. Scaffold source required tokens ---
const scaffoldSrc = read(SCAFFOLD_SRC);
for (const token of SCAFFOLD_REQUIRED_EXPORT_TOKENS) {
  assert(scaffoldSrc.includes(token), `Scaffold source missing required export: ${token}`);
}
for (const token of SCAFFOLD_REQUIRED_LITERAL_TOKENS) {
  assert(scaffoldSrc.includes(token), `Scaffold source missing required literal token: ${token}`);
}

// --- 4. Fixture source required tokens ---
const fixtureSrc = read(SCAFFOLD_FIXTURE);
for (const token of FIXTURE_REQUIRED_EXPORT_TOKENS) {
  assert(fixtureSrc.includes(token), `Fixture source missing required export: ${token}`);
}

// --- 5. Smoke script required keyword tokens ---
const smokeSrc = read(SMOKE_SCRIPT);
for (const token of SMOKE_REQUIRED_KEYWORD_TOKENS) {
  assert(smokeSrc.includes(token), `Smoke script missing required keyword: ${token}`);
}
assert(
  smokeSrc.includes("from '../src/lib/server/chart-ai/local-only-live-kis-provider-binding-scaffold.mjs'")
    && smokeSrc.includes("from '../src/lib/server/chart-ai/local-only-live-kis-provider-binding-scaffold.fixture.mjs'"),
  'Smoke script must import only the new scaffold and fixture modules',
);
assert(!/\bfetch\s*\(/.test(smokeSrc), 'Smoke script must not call fetch()');
assert(!smokeSrc.includes('.env'), 'Smoke script must not reference .env');

// --- 6. Result doc required tokens ---
const resultDoc = read(RESULT_DOC);
for (const token of RESULT_DOC_REQUIRED_TOKENS) {
  assert(resultDoc.includes(token), `Result doc missing required token: ${token}`);
}

// --- 7. Changelog contains required tokens and its entry sits at the top ---
const changelog = read(CHANGELOG);
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelog.includes(token), `Changelog missing required token: ${token}`);
}
const phaseHeaderIndex = changelog.indexOf('## Phase 3GG-D - 2026-07-10');
assert(phaseHeaderIndex >= 0, 'Phase 3GG-D changelog entry must exist');
assert(
  phaseHeaderIndex === 0 || changelog.slice(0, phaseHeaderIndex).trim() === '# MK Stock Lab Planning Changelog',
  'Phase 3GG-D changelog entry must be the topmost phase entry',
);
const nextHeaderIndex = phaseHeaderIndex >= 0
  ? changelog.indexOf('\n## Phase ', phaseHeaderIndex + 1)
  : -1;
assert(nextHeaderIndex > phaseHeaderIndex, 'Could not locate the end of the Phase 3GG-D changelog section');
const changelogSection = phaseHeaderIndex >= 0 && nextHeaderIndex > phaseHeaderIndex
  ? changelog.slice(phaseHeaderIndex, nextHeaderIndex)
  : '';
assert(
  changelogSection.includes('Phase 3GG-D-PLAN') || changelogSection.includes('2490e3be6e8429f7b7f33d2e684ddac6f5f9942c'),
  'Phase 3GG-D changelog entry must reference the Phase 3GG-D-PLAN / baseline commit',
);

// --- 8. Changed files since baseline are restricted to the allowed set ---
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

// --- 9. No forbidden runtime/source paths changed since baseline ---
const forbiddenDiff = gitLines(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]);
assert(forbiddenDiff.length === 0, `Forbidden diff paths changed since baseline: ${forbiddenDiff.join(', ')}`);

// --- 10. No existing KIS provider module changed since baseline. The two
// new scaffold/fixture files are allowed deliverables of this phase even
// though their filenames contain "kis". ---
const kisLiteralDiff = gitLines(['diff', '--name-only', BASELINE, '--', ...KIS_PROVIDER_CANDIDATE_PATHS]);
assert(kisLiteralDiff.length === 0, `KIS provider literal-candidate path changed since baseline: ${kisLiteralDiff.join(', ')}`);

const kisLikeChanged = allChanged.filter(
  (file) => /kis/i.test(file) && !allowedFiles.has(file),
);
assert(kisLikeChanged.length === 0, `Possible KIS provider path changed since baseline: ${kisLikeChanged.join(', ')}`);

// --- 11. New scaffold/fixture source files must not contain network/env/
// credential primitives ---
for (const [label, text] of [
  [SCAFFOLD_SRC, scaffoldSrc],
  [SCAFFOLD_FIXTURE, fixtureSrc],
]) {
  for (const substring of FORBIDDEN_SOURCE_SUBSTRINGS) {
    assert(!text.includes(substring), `${label} must not contain forbidden substring: ${substring}`);
  }
}

// --- 12. No secrets / PII present in any new file. CHECKER_SELF is
// intentionally excluded from the literal-name checks (its own source
// necessarily contains the literal strings it scans for), matching
// established precedent from prior phase checkers, but is still scanned
// for JWT/email/private-key/long-digit patterns. ---
const checkerSelfSource = read(CHECKER_SELF);
const secretScanTargets = [
  [SCAFFOLD_SRC, scaffoldSrc],
  [SCAFFOLD_FIXTURE, fixtureSrc],
  [SMOKE_SCRIPT, smokeSrc],
  [RESULT_DOC, resultDoc],
  [CHANGELOG, changelogSection],
];
for (const [label, text] of secretScanTargets) {
  for (const check of SECRET_LIKE_CHECKS) {
    assert(!check.regex.test(text), `Possible ${check.name} found in ${label}`);
  }
}
for (const check of SECRET_LIKE_CHECKS.filter((c) => c.name === 'JWT-like value' || c.name === 'email address' || c.name === 'private key block')) {
  assert(!check.regex.test(checkerSelfSource), `Possible ${check.name} found in ${CHECKER_SELF}`);
}

// --- 13. No mojibake patterns in new files ---
for (const [label, text] of [
  [SCAFFOLD_SRC, scaffoldSrc],
  [SCAFFOLD_FIXTURE, fixtureSrc],
  [SMOKE_SCRIPT, smokeSrc],
  [RESULT_DOC, resultDoc],
  [CHECKER_SELF, checkerSelfSource],
]) {
  for (const marker of MOJIBAKE_MARKERS) {
    assert(!text.includes(marker), `Possible mojibake pattern detected in ${label}`);
  }
}

// --- 14. No forbidden investment language present as approved text ---
for (const [label, text] of [
  [SCAFFOLD_SRC, scaffoldSrc],
  [SCAFFOLD_FIXTURE, fixtureSrc],
  [SMOKE_SCRIPT, smokeSrc],
  [RESULT_DOC, resultDoc],
  [CHANGELOG, changelogSection],
]) {
  for (const phrase of FORBIDDEN_INVESTMENT_PHRASES) {
    assert(!text.includes(phrase), `Forbidden investment phrase found in ${label}: ${phrase}`);
  }
}

// --- 15. No unnegated false-activation claim present ---
for (const [label, text] of [
  [RESULT_DOC, resultDoc],
  [CHANGELOG, changelogSection],
]) {
  for (const phrase of FORBIDDEN_ACTIVATION_CLAIM_PHRASES) {
    assert(!hasUnnegatedClaim(text, phrase), `Unnegated activation claim found in ${label}: "${phrase}"`);
  }
}

// --- 16. Run the smoke script and require it to pass ---
let smokeOutput = '';
let smokePassed = true;
try {
  smokeOutput = execFileSync('node', [SMOKE_SCRIPT], { cwd: ROOT, encoding: 'utf8' });
} catch (error) {
  smokePassed = false;
  smokeOutput = (error.stdout || '') + (error.stderr || '');
}
assert(smokePassed, `Smoke script did not pass: ${smokeOutput}`);
assert(/^PASS:/m.test(smokeOutput), 'Smoke script output must start a line with "PASS:"');

// --- 17. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-D check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-D check PASS: ${assertions}/${assertions} assertions passed.`);
}
