// Phase 3GG-H-FAST contract checker (lightweight, per the owner's speed-priority instruction).
// Verifies the local-only LLM runtime bridge, its API route, its owner smoke script, and this
// checker's own wiring/scope are present and safe. Does not run the full historical checker
// chain and does not execute the real owner LLM smoke (that remains a separate, manually-run,
// owner-approved script).

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '94f152f5788fb4ae3978fbed0268e48efebef5fe';

const BRIDGE_SRC = 'src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs';
const ROUTE_SRC = 'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts';
const OWNER_SMOKE_SCRIPT = 'scripts/owner_smoke_phase_3gg_h_fast_local_only_llm_runtime_bridge.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_h_fast_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_h_fast_local_only_llm_runtime_bridge_result_v0.1.md';
const HF1_RESULT_DOC = 'docs/planning/phase_3gg_h_hf1_llm_call_failed_safe_diagnostics_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [BRIDGE_SRC, ROUTE_SRC, OWNER_SMOKE_SCRIPT, CHECKER_SELF, RESULT_DOC, HF1_RESULT_DOC];

const OWNER_APPROVAL_FLAG = '--owner-approved-local-llm-smoke';
const ROUTE_OPT_IN_PARAM = 'ownerLocalKisLlm=1';

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
];

const REQUIRED_FORBIDDEN_DIFF_PATHS = [
  'src/lib/server/chart-ai/mk-agent.mjs',
  'src/lib/server/chart-ai/mk-agent.fixture.mjs',
  'src/lib/server/chart-ai/similar-pattern-agent.mjs',
  'src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs',
  'src/lib/server/chart-ai/guarded-productization-scaffold.mjs',
  'src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs',
  'components',
  'supabase',
  'src/data',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.env',
  '.env.local',
];

const KIS_PROVIDER_CANDIDATE_PATHS = [
  'src/lib/server/kis',
  'src/lib/kis',
  'src/server/kis',
  'src/lib/server/chart-ai/kis',
  'src/lib/server/providers/kis',
  'src/lib/server/providers/kisClient.ts',
  'src/lib/server/providers/providerErrors.ts',
  'src/lib/server/providers/serverOnly.ts',
  'src/lib/server/providers/types.ts',
];

const FORBIDDEN_ACTIVATION_TOKENS = [
  'publicActivation',
  'betaActivation',
  'internalQaActivation',
  'PUBLIC_ACTIVATION=1',
  'BETA_ACTIVATION=1',
];

// Mirrors the owner smoke script's own forbidden-raw-LLM-response pattern, used only for a local
// sanity check that the new diagnostics label does not false-positive against it.
const FORBIDDEN_RAW_LLM_RESPONSE_PATTERN = /"output_text"|"output"\s*:\s*\[|"usage"\s*:\s*\{|"model"\s*:\s*"gpt|response\.created/i;

const REQUIRED_RAW_PAYLOAD_TOKENS = ['rt_cd', 'stck_prpr', 'acml_vol', 'prdy_vrss', 'prdy_ctrt'];
const REQUIRED_CREDENTIAL_TOKENS = ['KIS_APP_KEY', 'access_token', 'appsecret', 'appkey', 'jwt', 'password', 'OPENAI_API_KEY'];
const REQUIRED_FORBIDDEN_PHRASE_TOKENS = ['매수하세요', '목표가', '손절가'];

const RESULT_DOC_REQUIRED_TOKENS = [
  `Baseline: ${BASELINE}`,
  'Branch: rebuild/phase-1-ia-shell',
  'Files changed',
  'Owner LLM smoke',
  'currentPricePresent',
  'Credential exposure status',
  'Raw KIS payload exposure status',
  'Raw LLM response exposure status',
  'Forbidden investment language status',
  'Validation results',
  'Known limitations',
  'Next recommended phase',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-H-FAST - 2026-07-10',
  '### Local-only LLM Runtime Bridge for Chart AI (Implemented)',
  'Phase 3GG-G-FAST',
  ROUTE_OPT_IN_PARAM,
  'CHART_AI_ENABLE_LOCAL_LLM=true',
  'Phase 3GG-I-FAST',
];

const failures = [];
let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) failures.push(message);
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

// --- 1. Required files exist ---
for (const file of [...CORE_DELIVERABLES, CHANGELOG, PACKAGE_JSON]) {
  assert(exists(file), `Required file missing: ${file}`);
}

// --- 2. package.json script wiring ---
const pkg = JSON.parse(read(PACKAGE_JSON));
assert(
  pkg.scripts && pkg.scripts['owner-smoke:phase-3gg-h-fast'] === `node ${OWNER_SMOKE_SCRIPT}`,
  'package.json is missing the exact "owner-smoke:phase-3gg-h-fast" script entry',
);
assert(
  pkg.scripts && pkg.scripts['check:phase-3gg-h-fast'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-h-fast" script entry',
);

// --- 3. Bridge source content checks ---
const bridgeSrc = exists(BRIDGE_SRC) ? read(BRIDGE_SRC) : '';
assert(bridgeSrc.includes('LOCAL_ONLY_LLM_RUNTIME_BRIDGE_CONTRACT_VERSION'), 'Bridge must export LOCAL_ONLY_LLM_RUNTIME_BRIDGE_CONTRACT_VERSION.');
assert(bridgeSrc.includes('ALLOWED_LLM_INPUT_CONTEXT_FIELDS'), 'Bridge must export ALLOWED_LLM_INPUT_CONTEXT_FIELDS.');
assert(bridgeSrc.includes('ALLOWED_LLM_SUMMARY_RESPONSE_FIELDS'), 'Bridge must export ALLOWED_LLM_SUMMARY_RESPONSE_FIELDS.');
assert(bridgeSrc.includes('SANITIZED_LLM_ERROR_CODES'), 'Bridge must export SANITIZED_LLM_ERROR_CODES.');
assert(bridgeSrc.includes('function buildLlmSafeCurrentPricePrompt'), 'Bridge must export buildLlmSafeCurrentPricePrompt.');
assert(bridgeSrc.includes('function assertNoForbiddenLlmInput'), 'Bridge must export assertNoForbiddenLlmInput.');
assert(bridgeSrc.includes('function sanitizeLlmSummaryText'), 'Bridge must export sanitizeLlmSummaryText.');
assert(bridgeSrc.includes('function runLocalOnlyLlmRuntimeBridge'), 'Bridge must export runLocalOnlyLlmRuntimeBridge.');

assert(bridgeSrc.includes('https://api.openai.com/v1/responses'), 'Bridge must call the OpenAI Responses API URL by raw fetch.');
assert(bridgeSrc.includes("env.CHART_AI_ENABLE_LOCAL_LLM !== 'true'"), 'Bridge must fail closed unless CHART_AI_ENABLE_LOCAL_LLM === "true".');
assert(bridgeSrc.includes('OPENAI_API_KEY'), 'Bridge must check OPENAI_API_KEY presence.');
assert(bridgeSrc.includes('CHART_AI_LLM_MODEL'), 'Bridge must check CHART_AI_LLM_MODEL presence.');
assert(bridgeSrc.includes('LLM_CONFIG_MISSING'), 'Bridge must fail closed with sanitizedErrorCode=LLM_CONFIG_MISSING when model/key is missing.');
assert(!/CHART_AI_LLM_MODEL\s*(\|\||\?\?)\s*['"]/.test(bridgeSrc), 'Bridge must not invent a default model name.');
assert(!bridgeSrc.includes('console.log(env.OPENAI_API_KEY') && !bridgeSrc.includes('console.log(apiKey'), 'Bridge must never print OPENAI_API_KEY.');

for (const phrase of REQUIRED_FORBIDDEN_PHRASE_TOKENS) {
  assert(bridgeSrc.includes(phrase), `Bridge must reference forbidden Korean investment phrase for filtering: ${phrase}`);
}

// --- 3b. HF1 safe diagnostics content checks ---
assert(bridgeSrc.includes('ALLOWED_LLM_DIAGNOSTICS_FIELDS'), 'Bridge must export ALLOWED_LLM_DIAGNOSTICS_FIELDS.');
assert(bridgeSrc.includes('OPENAI_ERROR_MESSAGE_CLASSES'), 'Bridge must export OPENAI_ERROR_MESSAGE_CLASSES.');
assert(bridgeSrc.includes('RESPONSE_SHAPE_KINDS'), 'Bridge must export RESPONSE_SHAPE_KINDS.');
assert(bridgeSrc.includes('function classifyOpenAiError'), 'Bridge must define classifyOpenAiError.');
assert(bridgeSrc.includes('function classifyResponseShape'), 'Bridge must define classifyResponseShape.');
assert(bridgeSrc.includes('function buildDiagnostics'), 'Bridge must define buildDiagnostics.');
assert(bridgeSrc.includes('response.text()'), 'Bridge must read the OpenAI response body as text before branching on status.');
assert(bridgeSrc.includes('err.diagnostics'), 'Bridge must attach safe diagnostics to the thrown error on OpenAI HTTP failure.');
assert(
  !/error\.message\b.*openAiErrorMessageClass|openAiErrorMessageClass.*=.*error\.message\b/.test(bridgeSrc),
  'Bridge must never derive openAiErrorMessageClass from a raw free-text error message.',
);
assert(!/console\.(log|error)\([^)]*parsedBody/.test(bridgeSrc), 'Bridge must never print the raw parsed OpenAI response body.');
assert(!/console\.(log|error)\([^)]*rawBody/.test(bridgeSrc), 'Bridge must never print the raw OpenAI response body.');

// --- 4. API route source content checks ---
const routeSrc = exists(ROUTE_SRC) ? read(ROUTE_SRC) : '';
assert(
  routeSrc.includes("get('ownerLocalKisLlm')") && routeSrc.includes("=== '1'"),
  'Route must require the explicit ownerLocalKisLlm=1 opt-in.',
);
assert(routeSrc.includes('LOCAL_ONLY_ALLOWED_HOSTNAMES'), 'Route must gate on local-only hostnames.');
assert(routeSrc.includes('export const GET'), 'Route must define a GET handler.');
assert(routeSrc.includes('export const ALL') && routeSrc.includes(', 405)'), 'Route must return 405 for non-GET methods.');
assert(routeSrc.includes('runLocalOnlyLlmRuntimeBridge'), 'Route must call the local-only LLM runtime bridge.');
assert(routeSrc.includes('createChartAiKisMarketDataContext'), 'Route must reuse the existing Chart AI KIS context adapter.');
assert(!routeSrc.includes('systemPrompt') && !routeSrc.includes('userPrompt'), 'Route must never expose prompt text.');
assert(!/rt_cd|stck_prpr|acml_vol/.test(routeSrc), 'Route must never reference raw KIS payload field names.');
assert(!/output_text|"usage"/.test(routeSrc), 'Route must never reference raw LLM response shape fields.');

// --- 5. Owner smoke script source content checks ---
const smokeSrc = exists(OWNER_SMOKE_SCRIPT) ? read(OWNER_SMOKE_SCRIPT) : '';
assert(smokeSrc.includes(OWNER_APPROVAL_FLAG), 'Owner smoke script must require the explicit owner-approval CLI flag.');
assert(smokeSrc.includes(ROUTE_OPT_IN_PARAM), 'Owner smoke script must call the route with ownerLocalKisLlm=1.');
assert(smokeSrc.includes('http://localhost:4321'), 'Owner smoke script must default to http://localhost:4321.');
assert(
  !smokeSrc.includes('${summary.currentPrice}') && !/\$\{currentPrice\}/.test(smokeSrc),
  'Owner smoke script must never interpolate the actual currentPrice value into a printed message.',
);
assert(smokeSrc.includes('currentPricePresent=true'), 'Owner smoke script must report currentPricePresent instead of the actual value.');
for (const token of REQUIRED_RAW_PAYLOAD_TOKENS) {
  assert(smokeSrc.includes(token), `Owner smoke script must guard against raw KIS payload token: ${token}`);
}
for (const token of REQUIRED_CREDENTIAL_TOKENS) {
  assert(smokeSrc.toLowerCase().includes(token.toLowerCase()), `Owner smoke script must guard against credential-like token: ${token}`);
}
for (const phrase of REQUIRED_FORBIDDEN_PHRASE_TOKENS) {
  assert(smokeSrc.includes(phrase), `Owner smoke script must guard against forbidden investment phrase: ${phrase}`);
}
for (const token of FORBIDDEN_ACTIVATION_TOKENS) {
  assert(!smokeSrc.includes(token), `Owner smoke script must not contain an activation token: ${token}`);
}

// --- 5b. HF1 owner smoke safe diagnostics printing checks ---
assert(smokeSrc.includes('ALLOWED_DIAGNOSTICS_FIELDS'), 'Owner smoke script must define an allowlist for diagnostics fields.');
assert(smokeSrc.includes('httpStatus'), 'Owner smoke script must be able to print httpStatus diagnostics.');
assert(smokeSrc.includes('openAiErrorMessageClass'), 'Owner smoke script must be able to print openAiErrorMessageClass diagnostics.');
assert(smokeSrc.includes('responseShapeKind'), 'Owner smoke script must be able to print responseShapeKind diagnostics.');
assert(smokeSrc.includes('outputTextPresent'), 'Owner smoke script must be able to print outputTextPresent diagnostics.');
assert(
  !/error\.type|error\.code|error\.param|error\.message/.test(smokeSrc),
  'Owner smoke script must never read raw OpenAI error.message/type/code/param fields directly -- only the bridge\'s classified diagnostics.',
);
assert(
  FORBIDDEN_RAW_LLM_RESPONSE_PATTERN.test('"output_text_present"') === false,
  'Sanity check: the forbidden raw-LLM-response pattern must not false-positive on the safe responseShapeKind label "output_text_present".',
);

// --- 6. No KIS provider module changed ---
let kisDiffLines = [];
try {
  kisDiffLines = runGit(['diff', '--name-only', BASELINE, '--', ...KIS_PROVIDER_CANDIDATE_PATHS])
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
} catch {
  kisDiffLines = ['<git diff failed>'];
}
assert(kisDiffLines.length === 0, `KIS provider diff must be empty: ${kisDiffLines.join(', ')}`);

// --- 7. No MK Agent / Similar Pattern Agent / scaffold / Supabase / data / lockfile / env change ---
let forbiddenDiffOutput = '';
try {
  forbiddenDiffOutput = runGit(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]).trim();
} catch {
  forbiddenDiffOutput = '<git diff failed>';
}
assert(forbiddenDiffOutput === '', `Forbidden diff is not empty: ${forbiddenDiffOutput}`);

// --- 8. Result doc required sections/claims ---
const resultDoc = exists(RESULT_DOC) ? read(RESULT_DOC) : '';
for (const token of RESULT_DOC_REQUIRED_TOKENS) {
  assert(resultDoc.includes(token), `Result doc missing required token: ${token}`);
}
assert(
  resultDoc.includes('Owner LLM smoke: Passed') ||
    resultDoc.includes('Owner LLM smoke: Blocked') ||
    resultDoc.includes('Owner LLM smoke: Pending'),
  'Result doc must truthfully state Owner LLM smoke as Passed, Blocked, or Pending -- never an unverified claim.',
);

// --- 8b. HF1 result doc required sections/claims ---
const HF1_RESULT_DOC_REQUIRED_TOKENS = [
  `Baseline: 4806d29aad5e5cb6948ecd31137c12269bf8b74d`,
  'Branch: rebuild/phase-1-ia-shell',
  'Files changed',
  'Previous failure',
  'New safe diagnostics',
  'Owner smoke result',
  'Actual LLM network call',
  'Credential exposure status',
  'Raw KIS payload exposure status',
  'Raw LLM response exposure status',
  'Validation results',
  'Next recommended phase',
];
const hf1ResultDoc = exists(HF1_RESULT_DOC) ? read(HF1_RESULT_DOC) : '';
for (const token of HF1_RESULT_DOC_REQUIRED_TOKENS) {
  assert(hf1ResultDoc.includes(token), `HF1 result doc missing required token: ${token}`);
}
assert(
  !/OPENAI_API_KEY\s*=\s*sk-|Authorization:\s*Bearer\s+\S/.test(hf1ResultDoc),
  'HF1 result doc must never contain a raw credential or Authorization header value.',
);

// --- 9. Changelog entry present, prepended above the baseline phase entry ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-H-FAST - 2026-07-10');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-H-FAST entry header');
const changelogSection =
  changelogHeaderIndex === -1 ? '' : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
const gFastHeaderIndex = changelog.indexOf('## Phase 3GG-G-FAST - 2026-07-10');
assert(
  gFastHeaderIndex === -1 || changelogHeaderIndex < gFastHeaderIndex,
  'Phase 3GG-H-FAST changelog entry must be prepended above the Phase 3GG-G-FAST entry',
);

// --- 9b. HF1 changelog entry present, prepended above the Phase 3GG-H-FAST entry ---
const HF1_CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-H-HF1 - 2026-07-11',
  '### LLM_CALL_FAILED Safe Diagnostics for Local-only LLM Runtime Bridge',
  'LLM_CALL_FAILED',
  'diagnostics',
];
const hf1ChangelogHeaderIndex = changelog.indexOf('## Phase 3GG-H-HF1 - 2026-07-11');
assert(hf1ChangelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-H-HF1 entry header');
const hf1ChangelogSection =
  hf1ChangelogHeaderIndex === -1
    ? ''
    : changelog.slice(hf1ChangelogHeaderIndex, changelog.indexOf('\n## ', hf1ChangelogHeaderIndex + 1));
for (const token of HF1_CHANGELOG_REQUIRED_TOKENS) {
  assert(hf1ChangelogSection.includes(token), `HF1 changelog entry missing required token: ${token}`);
}
assert(
  hf1ChangelogHeaderIndex !== -1 && changelogHeaderIndex !== -1 && hf1ChangelogHeaderIndex < changelogHeaderIndex,
  'Phase 3GG-H-HF1 changelog entry must be prepended above the Phase 3GG-H-FAST entry',
);

// --- 10. No unexpected working-tree changes outside this phase's scope ---
const ALLOWED_MODIFIED_FILES = new Set([...CORE_DELIVERABLES, CHANGELOG, PACKAGE_JSON]);
let statusLines = [];
try {
  statusLines = runGit(['status', '--porcelain']).split('\n').filter(Boolean);
} catch {
  statusLines = [];
}
for (const line of statusLines) {
  const filePath = line.slice(3).trim();
  const isKnown = KNOWN_UNTOUCHED_PATHS.some((p) => filePath === p || filePath.startsWith(p));
  if (isKnown || ALLOWED_MODIFIED_FILES.has(filePath)) {
    assert(true, `${filePath} is a known/allowed path for this phase`);
  } else {
    assert(false, `Unexpected working-tree change outside this phase's scope: ${filePath} (verify before commit)`);
  }
}

// --- 11. No deploy/push marker anywhere in this phase's new runtime source files ---
// (CHECKER_SELF is excluded: this very assertion's pattern literal would always self-match.)
for (const file of [BRIDGE_SRC, ROUTE_SRC, OWNER_SMOKE_SCRIPT]) {
  const src = exists(file) ? read(file) : '';
  assert(!/vercel deploy|git push/i.test(src), `${file} must not contain a deploy/push marker.`);
}

// --- 12. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-H-FAST check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-H-FAST check PASS: ${assertions}/${assertions} assertions passed.`);
}
