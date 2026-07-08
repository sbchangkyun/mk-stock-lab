import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const BASELINE = '38d660a';
const SOURCE = 'src/lib/server/chart-ai/mk-agent.mjs';
const FIXTURE = 'src/lib/server/chart-ai/mk-agent.fixture.mjs';
const SMOKE = 'scripts/smoke_phase_3ff_a_mk_a_deterministic_report_contract.mjs';
const CHECKER = 'scripts/check_phase_3ff_a_mk_a_contract.mjs';
const RESULT = 'docs/planning/phase_3ff_a_mk_a_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';
const PHASE_3FF_A_PLAN_CHECKER = 'scripts/check_phase_3ff_a_plan_contract.mjs';
const EVIDENCE_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_contract.mjs';
const EVIDENCE_HF1_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_hf1_contract.mjs';
const CLOSEOUT_HF1_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_hf1_contract.mjs';
const CLOSEOUT_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_contract.mjs';
const SP_A_CHECKER = 'scripts/check_phase_3ff_a_sp_a_contract.mjs';
const RETRY_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_retry_contract.mjs';
const QA_RUN_HF1_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_hf1_contract.mjs';
const QA_RUN_RESULT_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_result_contract.mjs';
const MANUAL_QA_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_result_contract.mjs';
const HANDOFF_CHECKER = 'scripts/check_phase_3fe_a_handoff_chart_ai_new_chat_package.mjs';

const allowedFiles = new Set([SOURCE, FIXTURE, SMOKE, CHECKER, RESULT, CHANGELOG, PACKAGE_JSON, PHASE_3FF_A_PLAN_CHECKER, EVIDENCE_CHECKER, EVIDENCE_HF1_CHECKER, CLOSEOUT_HF1_CHECKER, CLOSEOUT_CHECKER, SP_A_CHECKER, RETRY_CHECKER, QA_RUN_HF1_CHECKER, QA_RUN_RESULT_CHECKER, MANUAL_QA_CHECKER, HANDOFF_CHECKER]);
const forbiddenPaths = [
  'pages',
  'src/pages',
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

for (const file of [SOURCE, FIXTURE, SMOKE, CHECKER, RESULT, CHANGELOG, PACKAGE_JSON]) {
  assert(exists(file), `${file} must exist.`);
}

const source = exists(SOURCE) ? read(SOURCE) : '';
const fixture = exists(FIXTURE) ? read(FIXTURE) : '';
const smoke = exists(SMOKE) ? read(SMOKE) : '';
const result = exists(RESULT) ? read(RESULT) : '';
const changelog = exists(CHANGELOG) ? read(CHANGELOG) : '';
const packageSource = exists(PACKAGE_JSON) ? read(PACKAGE_JSON) : '{}';
const packageJson = JSON.parse(packageSource);

assert(packageJson.scripts?.['check:phase-3ff-a-mk-a'] === 'node scripts/check_phase_3ff_a_mk_a_contract.mjs', 'check script must be exact.');
assert(packageJson.scripts?.['smoke:phase-3ff-a-mk-a'] === 'node scripts/smoke_phase_3ff_a_mk_a_deterministic_report_contract.mjs', 'smoke script must be exact.');

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
  assert(new RegExp(`export\\s+(?:const|function)\\s+${exportedName}\\b`).test(source), `source must export ${exportedName}.`);
}

for (const exportedName of [
  'createMkAgentFixtureInput',
  'createMkAgentUsageExceededFixtureInput',
  'createMkAgentMissingSimilarPatternFixtureInput',
  'createMkAgentDataInsufficientFixtureInput',
  'createUnsafeMkAgentDraftForSanitizerFixture',
]) {
  assert(new RegExp(`export\\s+function\\s+${exportedName}\\b`).test(fixture), `fixture must export ${exportedName}.`);
}

assert(smoke.includes("../src/lib/server/chart-ai/mk-agent.mjs"), 'smoke must import MK Agent source.');
assert(smoke.includes("../src/lib/server/chart-ai/mk-agent.fixture.mjs"), 'smoke must import MK Agent fixture.');
assert(fixture.includes("from './similar-pattern-agent.mjs'"), 'fixture must import Similar Pattern Agent source.');
assert(fixture.includes("from './similar-pattern-agent.fixture.mjs'"), 'fixture must import Similar Pattern Agent fixture.');

const changedFiles = runGit(['diff', '--name-only', BASELINE]).split(/\r?\n/).filter(Boolean);
const statusChanged = execFileSync('git', ['status', '--porcelain', '-uall'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => line.slice(3))
  .filter((file) => allowedFiles.has(file));
const allChanged = [...new Set([...changedFiles, ...statusChanged])];
const unexpected = allChanged.filter((file) => !allowedFiles.has(file));
assert(unexpected.length === 0, `Only Phase 3FF-A-MK-A files may change. Unexpected: ${unexpected.join(', ')}`);

for (const pathName of forbiddenPaths) {
  const diff = runGit(['diff', '--name-only', BASELINE, '--', pathName]);
  assert(diff.length === 0, `Forbidden path must be unchanged: ${pathName}`);
}

const allowedSourceDiff = runGit(['diff', '--name-only', BASELINE, '--', 'src/lib/server/chart-ai'])
  .split(/\r?\n/)
  .filter(Boolean);
const unexpectedSource = [...new Set(allowedSourceDiff)].filter((file) => ![SOURCE, FIXTURE].includes(file));
assert(unexpectedSource.length === 0, `Only MK Agent source files may change under chart-ai. Unexpected: ${unexpectedSource.join(', ')}`);

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

for (const [label, text] of [['source', source], ['fixture', fixture]]) {
  assert(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(text), `${label} must not contain raw email literals.`);
  assert(!/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(text), `${label} must not contain JWT-like literals.`);
  assert(!/BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY/.test(text), `${label} must not contain private key markers.`);
  assert(!/rawKisPayload\s*:|rawProviderPayload\s*:|providerPayload\s*:/.test(text), `${label} must not contain provider raw payload labels.`);
}

for (const requiredText of [
  'MK ?먯씠?꾪듃',
  '?꾨왂 泥댄겕?ъ씤??',
  'No LLM',
  'No buy/sell recommendation',
  'reference only',
  'not investment advice',
]) {
  assert(source.includes(requiredText), `source must include marker: ${requiredText}`);
}
assert(!source.includes('?ъ쟾 泥댄겕?ъ씤??'), 'source must not include legacy strategy checkpoint title.');

for (const requiredText of [
  'Status: Implemented.',
  'Baseline: 38d660a.',
  'No LLM.',
  'No live KIS.',
  'No UI runtime activation.',
  'No API route changed.',
  'No deploy/push.',
]) {
  assert(result.includes(requiredText), `result doc must include: ${requiredText}`);
}

for (const requiredText of [
  '## Phase 3FF-A-MK-A - 2026-07-08',
  'MK Agent Deterministic Report Contract, No LLM, No UI Runtime Activation (Implemented)',
  'Baseline: 38d660a',
  'deterministic fixture-only MK Agent report contract',
  'no API route change',
  'no UI implementation change',
  'no live KIS',
  'no LLM',
  'no public/beta activation',
]) {
  assert(changelog.includes(requiredText), `changelog must include: ${requiredText}`);
}

const smokeOutput = execFileSync('node', [SMOKE], { encoding: 'utf8' });
assert(smokeOutput.includes('Phase 3FF-A-MK-A smoke: PASS'), 'smoke must pass from checker.');

if (failures.length > 0) {
  console.error(`Phase 3FF-A-MK-A check FAILED: ${failures.length}/${assertions} assertions failed.`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FF-A-MK-A check passed: ${assertions}/${assertions} assertions passed.`);
