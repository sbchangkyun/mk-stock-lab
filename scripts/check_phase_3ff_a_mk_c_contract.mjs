import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const BASELINE = 'a1e2d7f';
const SOURCE = 'src/lib/server/chart-ai/mk-agent.mjs';
const FIXTURE = 'src/lib/server/chart-ai/mk-agent.fixture.mjs';
const SMOKE = 'scripts/smoke_phase_3ff_a_mk_c_sp_b_contract_consumption.mjs';
const CHECKER = 'scripts/check_phase_3ff_a_mk_c_contract.mjs';
const RESULT = 'docs/planning/phase_3ff_a_mk_c_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';
const SP_SOURCE = 'src/lib/server/chart-ai/similar-pattern-agent.mjs';
const SP_FIXTURE = 'src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs';

// Sibling checkers patched during Phase 3FF-A-MK-C so their own git-diff
// scope/forbidden-diff checks tolerate this phase's MK Agent SP-B contract
// consumption existing on top of their respective baselines.
const PATCHED_SIBLING_CHECKERS = [
  'scripts/check_phase_3ff_a_mk_b_contract.mjs',
  'scripts/check_phase_3ff_a_sp_b_contract.mjs',
  'scripts/check_phase_3ff_a_sp_a_contract.mjs',
  'scripts/check_phase_3ff_a_mk_a_contract.mjs',
  'scripts/check_phase_3ff_a_plan_contract.mjs',
  'scripts/check_phase_3ff_a_ui_a_contract.mjs',
  'scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs',
];

// Later QA/housekeeping-only phases (3FF-A-UI-C, 3FF-A-HOUSEKEEPING-A) legitimately
// add their own docs/checkers and patch stale historical checkers on top of this
// phase's baseline. Tolerated here, not required, so this checker's git-diff scope
// check does not fail once those later files are committed above it.
const LATER_PHASE_TOLERATED_FILES = [
  'docs/planning/phase_3ff_a_ui_c_manual_qa_checklist_v0.1.md',
  'docs/planning/phase_3ff_a_ui_c_manual_qa_result_v0.1.md',
  'scripts/check_phase_3ff_a_ui_c_manual_qa_contract.mjs',
  'scripts/check_phase_3fd_j_handoff_chart_ai_new_chat_package_contract.mjs',
  'scripts/check_phase_3ff_a_housekeeping_a_contract.mjs',
  'docs/planning/phase_3ff_a_housekeeping_a_result_v0.1.md',
];

const CORE_DELIVERABLES = [SOURCE, FIXTURE, SMOKE, CHECKER, RESULT, CHANGELOG, PACKAGE_JSON];
const allowedFiles = new Set([...CORE_DELIVERABLES, ...PATCHED_SIBLING_CHECKERS, ...LATER_PHASE_TOLERATED_FILES]);

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
  packageJson.scripts?.['smoke:phase-3ff-a-mk-c'] === 'node scripts/smoke_phase_3ff_a_mk_c_sp_b_contract_consumption.mjs',
  'smoke script must be exact.',
);
assert(packageJson.scripts?.['check:phase-3ff-a-mk-c'] === 'node scripts/check_phase_3ff_a_mk_c_contract.mjs', 'check script must be exact.');

// --- 3. Source preserves all prior MK-A/MK-B exports and adds the SP-B consumption helpers ---
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
  'hasKoreanFinalConsonant',
  'chooseKoreanTopicParticle',
  'withKoreanTopicParticle',
]) {
  assert(new RegExp(`export\\s+(?:const|function)\\s+${exportedName}\\b`).test(source), `source must preserve prior export: ${exportedName}.`);
}
for (const exportedName of [
  'hasSpbSimilarPatternContract',
  'summarizeSpbContractForMkAgent',
  'summarizeOutcomeDistributionForMkAgent',
  'summarizePatternQualityForMkAgent',
  'summarizeMatchReasonTagsForMkAgent',
]) {
  assert(new RegExp(`export\\s+function\\s+${exportedName}\\b`).test(source), `source must export new SP-B consumption symbol: ${exportedName}.`);
}

// --- 4. Fixture preserves prior exports and adds the 3 new SP-B/legacy/partial fixtures ---
for (const exportedName of [
  'createMkAgentFixtureInput',
  'createMkAgentUsageExceededFixtureInput',
  'createMkAgentMissingSimilarPatternFixtureInput',
  'createMkAgentDataInsufficientFixtureInput',
  'createUnsafeMkAgentDraftForSanitizerFixture',
  'createMkAgentKoreanParticleFixtureInput',
  'createMkAgentNonHangulDisplayNameFixtureInput',
]) {
  assert(new RegExp(`export\\s+function\\s+${exportedName}\\b`).test(fixture), `fixture must preserve prior export: ${exportedName}.`);
}
for (const exportedName of [
  'createMkAgentSpbContractFixtureInput',
  'createMkAgentLegacySimilarPatternFixtureInput',
  'createMkAgentPartialSpbContractFixtureInput',
]) {
  assert(new RegExp(`export\\s+function\\s+${exportedName}\\b`).test(fixture), `fixture must export new SP-B fixture: ${exportedName}.`);
}

assert(smoke.includes('../src/lib/server/chart-ai/mk-agent.mjs'), 'smoke must import MK Agent source.');
assert(smoke.includes('../src/lib/server/chart-ai/mk-agent.fixture.mjs'), 'smoke must import MK Agent fixture.');
for (const name of [
  'createMkAgentSpbContractFixtureInput',
  'createMkAgentLegacySimilarPatternFixtureInput',
  'createMkAgentPartialSpbContractFixtureInput',
]) {
  assert(smoke.includes(name), `smoke must import/use ${name}.`);
}

// --- 5. Required Korean/contract markers preserved, known bug literals still absent ---
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
  'similar-pattern-agent.v0.2',
  '신뢰도',
  'D5',
  'D20',
  '평균',
  '중앙값',
  '과거 유사 흐름',
  '미래 성과를 보장하지 않습니다',
  '패턴 품질',
]) {
  assert(source.includes(requiredText), `source must include marker: ${requiredText}`);
}
assert(!source.includes('사전 체크포인트'), 'source must not include legacy strategy checkpoint title.');
assert(!source.includes('삼성전자은'), 'source must not include the known buggy 삼성전자은 literal.');
assert(fixture.includes("displayName: '삼성전자'"), 'fixture must keep default displayName 삼성전자.');
assert(fixture.includes("symbol: '005930'"), 'fixture must keep default symbol 005930.');

// --- 6. Smoke script must pass ---
const smokeOutput = execFileSync('node', [SMOKE], { encoding: 'utf8' });
assert(smokeOutput.includes('Phase 3FF-A-MK-C smoke: PASS'), 'smoke must pass from checker.');

// --- 7. Scope check: only allowed files may change since baseline ---
const changedFiles = gitLines(['diff', '--name-only', BASELINE]);
const statusChanged = runGit(['status', '--porcelain', '-uall'])
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => line.slice(3).trim())
  .filter((file) => allowedFiles.has(file));
const allChanged = [...new Set([...changedFiles, ...statusChanged])];
const unexpected = allChanged.filter((file) => !allowedFiles.has(file));
assert(unexpected.length === 0, `Only Phase 3FF-A-MK-C files may change. Unexpected: ${unexpected.join(', ')}`);
for (const file of CORE_DELIVERABLES) {
  assert(allChanged.includes(file), `Changed files must include ${file}.`);
}

for (const knownPath of KNOWN_UNTOUCHED_PATHS) {
  assert(
    !changedFiles.some((file) => file === knownPath || file.startsWith(knownPath)),
    `${knownPath} must not appear in tracked diff vs baseline.`,
  );
}

// --- 8. Forbidden diff must be empty (chart-ai.astro, API routes, components, supabase, src/data, lockfiles, env) ---
const forbiddenDiff = gitLines(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]);
assert(forbiddenDiff.length === 0, `Forbidden diff must be empty. Found: ${forbiddenDiff.join(', ')}`);

// --- 9. Allowed source diff under src/lib/server/chart-ai must be exactly SOURCE/FIXTURE ---
const allowedSourceDiff = gitLines(['diff', '--name-only', BASELINE, '--', 'src/lib/server/chart-ai']);
const unexpectedSource = allowedSourceDiff.filter((file) => ![SOURCE, FIXTURE].includes(file));
assert(unexpectedSource.length === 0, `Only MK Agent source files may change under chart-ai. Unexpected: ${unexpectedSource.join(', ')}`);

// --- 10. Similar Pattern Agent source/fixture must not change at all in Phase 3FF-A-MK-C ---
const spDiff = gitLines(['diff', '--name-only', BASELINE, '--', SP_SOURCE, SP_FIXTURE]);
assert(spDiff.length === 0, `Similar Pattern Agent source/fixture must not change in Phase 3FF-A-MK-C. Found: ${spDiff.join(', ')}`);

// --- 11. Forbidden runtime/network/secret patterns in source/fixture ---
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
  assert(!pattern.test(fixture), `fixture must not contain forbidden runtime pattern: ${pattern}`);
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

// --- 12. Mojibake fragments and the Unicode replacement character must not
// appear anywhere in the deliverables. Fragments are built from numeric code
// points via String.fromCharCode so this checker's own raw source text
// (checkerSelf, read back via fs.readFileSync, never evaluated) cannot
// self-match: the source only ever contains ASCII digits, never the actual
// corrupted characters, while the runtime array value still equals the real
// corrupted-character fragments for comparison against the other files. ---
const mojibakePatterns = [
  String.fromCharCode(77, 75, 32, 63, 47663, 50464, 63, 44970, 46275),
  String.fromCharCode(63, 44968, 50754),
  String.fromCharCode(63971, 45828, 44181),
  String.fromCharCode(63, 1098, 50468),
  String.fromCharCode(63, 50326, 49316),
  String.fromCharCode(63, 45896, 53195),
  String.fromCharCode(63, 49649, 44902),
  String.fromCharCode(63949, 12668, 45780),
  String.fromCharCode(63951, 9338, 47796),
  String.fromCharCode(65533),
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

// --- 13. Result doc and changelog required content ---
for (const requiredText of [
  'Status: Implemented.',
  'a1e2d7f',
  'similar-pattern-agent.v0.2',
  'No LLM',
  'No live KIS',
  'No API route changed.',
  'No public/beta activation',
  'No deploy/push occurred.',
]) {
  assert(result.includes(requiredText), `result doc must include: ${requiredText}`);
}

for (const requiredText of [
  '## Phase 3FF-A-MK-C - 2026-07-08',
  'Baseline**: `a1e2d7f`',
  'similar-pattern-agent.v0.2',
  'no live KIS',
  'no LLM',
  'no public/beta activation',
  'no deploy/push',
]) {
  assert(changelog.includes(requiredText), `changelog must include: ${requiredText}`);
}

console.log(
  failures.length
    ? `Phase 3FF-A-MK-C check FAILED: ${failures.length}/${assertions} assertions failed.`
    : `Phase 3FF-A-MK-C check passed: ${assertions}/${assertions} assertions passed.`,
);

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
