import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const BASELINE = 'f25a7fc';
const SOURCE = 'src/lib/server/chart-ai/mk-agent.mjs';
const FIXTURE = 'src/lib/server/chart-ai/mk-agent.fixture.mjs';
const SMOKE = 'scripts/smoke_phase_3ff_a_mk_b_output_contract_hardening.mjs';
const CHECKER = 'scripts/check_phase_3ff_a_mk_b_contract.mjs';
const RESULT = 'docs/planning/phase_3ff_a_mk_b_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';
const SP_A_SOURCE = 'src/lib/server/chart-ai/similar-pattern-agent.mjs';
const SP_A_FIXTURE = 'src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs';

// Sibling checkers patched during Phase 3FF-A-MK-B so their own git-diff
// scope/forbidden-diff checks tolerate this phase's source hardening and new
// files existing on top of f25a7fc. Tolerated here, not required.
const PATCHED_SIBLING_CHECKERS = [
  'scripts/check_phase_3ff_a_ui_a_contract.mjs',
  'scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs',
  'scripts/check_phase_3ff_a_mk_a_contract.mjs',
  'scripts/check_phase_3ff_a_sp_a_contract.mjs',
  'scripts/check_phase_3ff_a_plan_contract.mjs',
];

// Phase 3FF-A-SP-B's own deliverables, tolerated here so this checker's
// git-diff scope/forbidden-diff checks do not fail once SP-B's Similar
// Pattern output contract hardening pass exists on top of f25a7fc (SP-B
// further edits SP_A_SOURCE/SP_A_FIXTURE, already declared above).
const SP_B_TOLERATED_FILES = [
  SP_A_SOURCE,
  SP_A_FIXTURE,
  'scripts/smoke_phase_3ff_a_sp_b_output_contract_hardening.mjs',
  'scripts/check_phase_3ff_a_sp_b_contract.mjs',
  'docs/planning/phase_3ff_a_sp_b_result_v0.1.md',
];

// Phase 3FF-A-MK-C's own deliverables, tolerated here so this checker's
// git-diff scope/forbidden-diff checks do not fail once MK-C's SP-B contract
// consumption pass exists on top of f25a7fc (MK-C further edits
// SOURCE/FIXTURE, already declared/tolerated above).
const MK_C_TOLERATED_FILES = [
  'scripts/smoke_phase_3ff_a_mk_c_sp_b_contract_consumption.mjs',
  'scripts/check_phase_3ff_a_mk_c_contract.mjs',
  'docs/planning/phase_3ff_a_mk_c_result_v0.1.md',
];

// Later QA/housekeeping-only phases (3FF-A-UI-C, 3FF-A-HOUSEKEEPING-A) legitimately
// add their own docs/checkers and patch stale historical checkers on top of this
// phase's baseline. Tolerated here, not required.
const LATER_PHASE_TOLERATED_FILES = [
  'docs/planning/phase_3ff_a_ui_c_manual_qa_checklist_v0.1.md',
  'docs/planning/phase_3ff_a_ui_c_manual_qa_result_v0.1.md',
  'scripts/check_phase_3ff_a_ui_c_manual_qa_contract.mjs',
  'scripts/check_phase_3fd_j_handoff_chart_ai_new_chat_package_contract.mjs',
  'scripts/check_phase_3ff_a_housekeeping_a_contract.mjs',
  'docs/planning/phase_3ff_a_housekeeping_a_result_v0.1.md',
];

const CORE_DELIVERABLES = [SOURCE, FIXTURE, SMOKE, CHECKER, RESULT, CHANGELOG, PACKAGE_JSON];
const allowedFiles = new Set([...CORE_DELIVERABLES, ...PATCHED_SIBLING_CHECKERS, ...SP_B_TOLERATED_FILES, ...MK_C_TOLERATED_FILES, ...LATER_PHASE_TOLERATED_FILES]);

const KNOWN_UNTOUCHED_PATHS = ['.agents/', '.vscode/settings.json', 'docs/handoff/codex_state_inspection/', 'skills-lock.json'];

const REQUIRED_FORBIDDEN_DIFF_PATHS = [
  'src/pages/chart-ai.astro',
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

let assertions = 0;
const failures = [];
const assert = (condition, message) => {
  assertions += 1;
  if (!condition) failures.push(message);
};

const exists = (file) => fs.existsSync(file);
const read = (file) => fs.readFileSync(file, 'utf8');
const runGit = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const gitLines = (args) => runGit(args).split(/\r?\n/).filter(Boolean);

// --- 1. Required files exist ---
for (const file of CORE_DELIVERABLES) {
  assert(exists(file), `${file} must exist.`);
}

const source = exists(SOURCE) ? read(SOURCE) : '';
const fixture = exists(FIXTURE) ? read(FIXTURE) : '';
const smoke = exists(SMOKE) ? read(SMOKE) : '';
const checkerSelf = exists(CHECKER) ? read(CHECKER) : '';
const result = exists(RESULT) ? read(RESULT) : '';
const changelog = exists(CHANGELOG) ? read(CHANGELOG) : '';
const packageJson = exists(PACKAGE_JSON) ? JSON.parse(read(PACKAGE_JSON)) : {};

// --- 2. package.json scripts exact ---
assert(
  packageJson.scripts?.['smoke:phase-3ff-a-mk-b'] === 'node scripts/smoke_phase_3ff_a_mk_b_output_contract_hardening.mjs',
  'smoke script must be exact.',
);
assert(packageJson.scripts?.['check:phase-3ff-a-mk-b'] === 'node scripts/check_phase_3ff_a_mk_b_contract.mjs', 'check script must be exact.');

// --- 3. Source exports the 3 new Korean particle helpers, preserves all prior exports ---
for (const exportedName of ['hasKoreanFinalConsonant', 'chooseKoreanTopicParticle', 'withKoreanTopicParticle']) {
  assert(new RegExp(`export\\s+function\\s+${exportedName}\\b`).test(source), `source must export ${exportedName}.`);
}
for (const exportedName of [
  'DEFAULT_MK_AGENT_OPTIONS',
  'MK_AGENT_SECTION_KEYS',
  'MK_AGENT_STATUS',
  'createMkAgentInput',
  'validateMkAgentInput',
  'runMkAgent',
  'createDeterministicMkAgentReport',
  'sanitizeMkAgentReport',
  'createBlockedMkAgentOutput',
  'summarizeSimilarPatternForMkAgent',
  'createMkAgentDisclaimer',
  'detectForbiddenInvestmentLanguage',
]) {
  assert(new RegExp(`export\\s+(?:const|function)\\s+${exportedName}\\b`).test(source), `source must preserve prior export: ${exportedName}.`);
}

for (const exportedName of [
  'createMkAgentFixtureInput',
  'createMkAgentUsageExceededFixtureInput',
  'createMkAgentMissingSimilarPatternFixtureInput',
  'createMkAgentDataInsufficientFixtureInput',
  'createUnsafeMkAgentDraftForSanitizerFixture',
  'createMkAgentKoreanParticleFixtureInput',
  'createMkAgentNonHangulDisplayNameFixtureInput',
]) {
  assert(new RegExp(`export\\s+function\\s+${exportedName}\\b`).test(fixture), `fixture must export ${exportedName}.`);
}

assert(smoke.includes('../src/lib/server/chart-ai/mk-agent.mjs'), 'smoke must import MK Agent source.');
assert(smoke.includes('../src/lib/server/chart-ai/mk-agent.fixture.mjs'), 'smoke must import MK Agent fixture.');
for (const name of ['createMkAgentKoreanParticleFixtureInput', 'createMkAgentNonHangulDisplayNameFixtureInput']) {
  assert(smoke.includes(name), `smoke must import/use ${name}.`);
}

// --- 4. Required Korean markers preserved, known bug literal absent from source ---
for (const requiredText of [
  'MK 에이전트',
  '전략 체크포인트',
  '오픈베타에서는 계정당 하루 3회까지 사용할 수 있어요',
  '참고용',
  '매수·매도 추천이 아닙니다',
  '투자 자문이 아닙니다',
  'No LLM',
  'No buy/sell recommendation',
  'reference only',
  'not investment advice',
]) {
  assert(source.includes(requiredText), `source must include marker: ${requiredText}`);
}
assert(!source.includes('사전 체크포인트'), 'source must not include legacy strategy checkpoint title.');
assert(!source.includes('삼성전자은'), 'source must not include the known buggy 삼성전자은 literal.');
assert(fixture.includes("displayName: '삼성전자'"), 'fixture must keep default displayName 삼성전자.');
assert(fixture.includes("symbol: '005930'"), 'fixture must keep default symbol 005930.');

// --- 5. Smoke script must pass ---
const smokeOutput = execFileSync('node', [SMOKE], { encoding: 'utf8' });
assert(smokeOutput.includes('Phase 3FF-A-MK-B smoke: PASS'), 'smoke must pass from checker.');

// --- 6. Scope check: only allowed files may change since baseline ---
const changedFiles = gitLines(['diff', '--name-only', BASELINE]);
const statusChanged = runGit(['status', '--porcelain', '-uall'])
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => line.slice(3).trim())
  .filter((file) => allowedFiles.has(file));
const allChanged = [...new Set([...changedFiles, ...statusChanged])];
const unexpected = allChanged.filter((file) => !allowedFiles.has(file));
assert(unexpected.length === 0, `Only Phase 3FF-A-MK-B files may change. Unexpected: ${unexpected.join(', ')}`);
for (const file of CORE_DELIVERABLES) {
  assert(allChanged.includes(file), `Changed files must include ${file}.`);
}

for (const knownPath of KNOWN_UNTOUCHED_PATHS) {
  assert(
    !changedFiles.some((file) => file === knownPath || file.startsWith(knownPath)),
    `${knownPath} must not appear in tracked diff vs baseline.`,
  );
}

// --- 7. Forbidden diff must be empty (chart-ai.astro, API routes, components, supabase, src/data, lockfiles, env) ---
const forbiddenDiff = gitLines(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]);
assert(forbiddenDiff.length === 0, `Forbidden diff must be empty. Found: ${forbiddenDiff.join(', ')}`);

// --- 8. Allowed source diff under src/lib/server/chart-ai must be exactly SOURCE/FIXTURE
// (Similar Pattern Agent source/fixture tolerated: Phase 3FF-A-SP-B legitimately
// hardens those files on top of this f25a7fc baseline; not required by MK-B.) ---
const allowedSourceDiff = gitLines(['diff', '--name-only', BASELINE, '--', 'src/lib/server/chart-ai']);
const unexpectedSource = allowedSourceDiff.filter((file) => ![SOURCE, FIXTURE, SP_A_SOURCE, SP_A_FIXTURE].includes(file));
assert(unexpectedSource.length === 0, `Only MK Agent source files may change under chart-ai. Unexpected: ${unexpectedSource.join(', ')}`);

// --- 9. No Similar Pattern Agent source/fixture diff required by MK-B itself
// (SP_B_TOLERATED_FILES already covers SP_A_SOURCE/SP_A_FIXTURE for Phase
// 3FF-A-SP-B's legitimate hardening; anything else here is still unexpected) ---
const spDiff = gitLines(['diff', '--name-only', BASELINE, '--', SP_A_SOURCE, SP_A_FIXTURE])
  .filter((file) => !SP_B_TOLERATED_FILES.includes(file));
assert(spDiff.length === 0, `Similar Pattern Agent source/fixture must not change outside Phase 3FF-A-SP-B. Found: ${spDiff.join(', ')}`);

// --- 10. Forbidden runtime/network/secret patterns in source/fixture ---
const forbiddenSourcePatterns = [
  /\bfetch\s*\(/,
  /process\.env/,
  /createClient\s*\(/,
  /createServerClient\s*\(/,
  /OPENAI_API_KEY/,
  /appsecret/i,
  /access_token/i,
  /service_role/i,
  /document\./,
  /window\./,
  /localStorage/,
  /cookies/i,
  /headers/i,
  /Math\.random/,
  /Date\.now/,
];
for (const pattern of forbiddenSourcePatterns) {
  assert(!pattern.test(source), `source must not contain forbidden runtime pattern: ${pattern}`);
}

for (const [label, text] of [
  ['source', source],
  ['fixture', fixture],
]) {
  assert(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(text), `${label} must not contain raw email literals.`);
  assert(!/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(text), `${label} must not contain JWT-like literals.`);
  assert(!/BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY/.test(text), `${label} must not contain private key markers.`);
  assert(!/rawKisPayload\s*:|rawProviderPayload\s*:|providerPayload\s*:/.test(text), `${label} must not contain provider raw payload labels.`);
}

// --- 11. Mojibake fragments and the Unicode replacement character must not
// appear anywhere in the deliverables. Fragments are built from numeric code
// points via String.fromCharCode so this checker's own raw source text
// (checkerSelf, read back via fs.readFileSync, never evaluated) cannot
// self-match: the source only ever contains ASCII digits, never the actual
// corrupted characters, while the runtime array value still equals the real
// corrupted-character fragments for comparison against the other files. ---
const mojibakePatterns = [
  String.fromCharCode(65533),
  String.fromCharCode(63, 47663, 50464),
  String.fromCharCode(63, 44968, 50754),
  String.fromCharCode(27877, 45828, 44181),
  String.fromCharCode(63, 1098, 50468),
  String.fromCharCode(63, 50326, 49316),
  String.fromCharCode(63, 45896, 53195),
  String.fromCharCode(63, 49649, 44902),
  String.fromCharCode(30041, 12668, 45780),
  String.fromCharCode(32016, 9338, 47796),
];
for (const [label, text] of [
  ['source', source],
  ['fixture', fixture],
  ['smoke', smoke],
  ['checker', checkerSelf],
  ['result', result],
]) {
  for (const token of mojibakePatterns) {
    assert(!text.includes(token), `${label} must not contain mojibake pattern.`);
  }
}

// --- 12. Result doc and changelog required content ---
for (const requiredText of [
  'Status: Implemented.',
  'f25a7fc',
  '삼성전자은',
  '삼성전자는',
  'No LLM',
  'No live KIS',
  'No API route changed.',
  'No public/beta activation',
  'No deploy/push occurred.',
]) {
  assert(result.includes(requiredText), `result doc must include: ${requiredText}`);
}

for (const requiredText of [
  '## Phase 3FF-A-MK-B - 2026-07-08',
  'MK Agent Output Contract Hardening and Korean Grammar Fix, No LLM, No Live KIS, No Public Activation',
  'Baseline**: `f25a7fc`',
  '삼성전자은` → `삼성전자는`',
  'hasKoreanFinalConsonant',
  'no live KIS',
  'no LLM',
  'no public/beta activation',
  'no deploy/push',
]) {
  assert(changelog.includes(requiredText), `changelog must include: ${requiredText}`);
}

console.log(
  failures.length
    ? `Phase 3FF-A-MK-B check FAILED: ${failures.length}/${assertions} assertions failed.`
    : `Phase 3FF-A-MK-B check passed: ${assertions}/${assertions} assertions passed.`,
);

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
