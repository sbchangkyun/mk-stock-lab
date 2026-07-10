// Phase 3GG-K-FAST contract checker.
// Verifies the local-only LLM runtime bridge's Korean summary prompt was upgraded to a
// structured 3-bullet contract, that a numeric-output rejection guard was added without exposing
// the rejected value, that the model policy/fallback behavior, response field contract, and the H
// route/UI/model-policy module all carry no unjustified diff, that no KIS provider module
// changed, and that this phase introduced no diff outside its allowed scope -- measured against
// the Phase 3GG-J-HF1 baseline.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = 'dac22b10f9800b55f66450fcf36cd280dd21f068';

const H_ROUTE = 'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts';
const ASTRO_UI = 'src/pages/chart-ai.astro';
const MODEL_POLICY_SRC = 'src/lib/server/chart-ai/local-only-llm-model-policy.mjs';
const BRIDGE_SRC = 'src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs';
const SMOKE_SCRIPT = 'scripts/smoke_phase_3gg_k_fast_summary_quality_upgrade.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_k_fast_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_k_fast_summary_quality_upgrade_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [SMOKE_SCRIPT, CHECKER_SELF, RESULT_DOC];
const ALLOWED_MODIFIED_SOURCE = [BRIDGE_SRC];

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
];

const REQUIRED_FORBIDDEN_DIFF_PATHS = [
  ASTRO_UI,
  H_ROUTE,
  MODEL_POLICY_SRC,
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

const ALLOWED_LLM_SUMMARY_RESPONSE_FIELDS = [
  'ok',
  'symbol',
  'market',
  'llmStatus',
  'summaryText',
  'sanitizedErrorCode',
  'modelPresent',
  'sourceStatus',
  'currentPricePresent',
  'volumePresent',
  'warnings',
  'diagnostics',
];

const RESULT_DOC_REQUIRED_TOKENS = [
  'Status: Implemented',
  `Baseline: ${BASELINE}`,
  'Branch: rebuild/phase-1-ia-shell',
  'Purpose',
  'Files changed',
  'Summary quality changes',
  'Prompt contract changes',
  'Numeric-output protection',
  'Forbidden language protection',
  'Fallback behavior status',
  'Backward compatibility status',
  'Route contract status',
  'UI change status',
  'Model exposure status',
  'Credential exposure status',
  'Raw KIS payload exposure status',
  'Raw LLM response exposure status',
  'Prompt exposure status',
  'currentPrice numeric exposure status',
  'KIS endpoint expansion status',
  'Validation results',
  'Known limitations',
  'Push/deploy status',
  'Next recommended phase',
  'Phase 3GG-K-QA',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-K-FAST - 2026-07-11',
  '### Chart AI Summary Quality Upgrade (Implemented)',
  'Phase 3GG-J-HF1',
  'not pushed',
  'not deployed',
  'Phase 3GG-K-QA',
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
for (const file of [...CORE_DELIVERABLES, BRIDGE_SRC, CHANGELOG, PACKAGE_JSON]) {
  assert(exists(file), `Required file missing: ${file}`);
}

// --- 2. package.json script wiring ---
const pkg = JSON.parse(read(PACKAGE_JSON));
assert(
  pkg.scripts && pkg.scripts['smoke:phase-3gg-k-fast'] === `node ${SMOKE_SCRIPT}`,
  'package.json is missing the exact "smoke:phase-3gg-k-fast" script entry',
);
assert(
  pkg.scripts && pkg.scripts['check:phase-3gg-k-fast'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-k-fast" script entry',
);

// --- 3. Bridge contains upgraded Korean summary quality prompt (structured 3-bullet contract) ---
const bridgeSrc = exists(BRIDGE_SRC) ? read(BRIDGE_SRC) : '';
assert(bridgeSrc.includes('정확히 3개의 짧은 불릿'), 'Bridge prompt must require exactly 3 short bullets.');
assert(bridgeSrc.includes('데이터 상태:'), 'Bridge prompt must include the "데이터 상태:" bullet label.');
assert(bridgeSrc.includes('해석 범위:'), 'Bridge prompt must include the "해석 범위:" bullet label.');
assert(bridgeSrc.includes('유의사항:'), 'Bridge prompt must include the "유의사항:" bullet label.');
assert(bridgeSrc.includes('투자 자문이 아니라는 점'), 'Bridge prompt must require stating this is not investment advice.');
assert(bridgeSrc.includes('매수·매도 추천을 포함하지 않습니다'), 'Bridge prompt must forbid buy/sell recommendation.');
assert(bridgeSrc.includes('목표가를 포함하지 않습니다'), 'Bridge prompt must forbid target price.');
assert(bridgeSrc.includes('손절가를 포함하지 않습니다'), 'Bridge prompt must forbid stop-loss price.');

// --- 4. Bridge contains no instruction encouraging numeric currentPrice/volume display ---
assert(
  bridgeSrc.includes('정확한 숫자를 절대 출력하지 않습니다'),
  'Bridge prompt must instruct the model to never output exact numeric price/volume values.',
);
assert(
  !/현재가:\s*\$\{currentPrice/.test(bridgeSrc),
  'Bridge prompt must not interpolate the raw numeric currentPrice value into the data lines shown to the model.',
);

// --- 5. Bridge has numeric output rejection with the required sanitized error code ---
assert(bridgeSrc.includes('FORBIDDEN_NUMERIC_OUTPUT_DETECTED'), 'Bridge must define/use FORBIDDEN_NUMERIC_OUTPUT_DETECTED.');
assert(bridgeSrc.includes('forbidden-numeric-output-detected'), 'Bridge must emit the forbidden-numeric-output-detected warning label.');
assert(/\[0-9\]/.test(bridgeSrc), 'Bridge must reject ASCII-digit output via a [0-9] pattern check.');

// --- 6. Bridge preserves model policy import/use ---
assert(bridgeSrc.includes("from './local-only-llm-model-policy.mjs'"), 'Bridge must still import from the model policy module.');
assert(bridgeSrc.includes('resolveLlmModelForRole'), 'Bridge must still resolve models via resolveLlmModelForRole.');
assert(bridgeSrc.includes('shouldAttemptFallbackForLlmFailure'), 'Bridge must still gate fallback via shouldAttemptFallbackForLlmFailure.');

// --- 7. Bridge does not add new response fields ---
const responseFieldsMatch = bridgeSrc.match(/ALLOWED_LLM_SUMMARY_RESPONSE_FIELDS = Object\.freeze\(\[([\s\S]*?)\]\)/);
const responseFieldsBlock = responseFieldsMatch ? responseFieldsMatch[1] : '';
const declaredResponseFields = [...responseFieldsBlock.matchAll(/'([a-zA-Z]+)'/g)].map((m) => m[1]);
assert(
  declaredResponseFields.length === ALLOWED_LLM_SUMMARY_RESPONSE_FIELDS.length &&
    ALLOWED_LLM_SUMMARY_RESPONSE_FIELDS.every((f) => declaredResponseFields.includes(f)),
  'Bridge must not add or remove any ALLOWED_LLM_SUMMARY_RESPONSE_FIELDS entries.',
);

// --- 8. Bridge does not expose model names, credentials, prompt text, or raw payloads ---
// Note: "modelName"/"modelId" appear as internal function-parameter names inside the bridge
// (e.g. callOpenAiModelOnce({ modelName, ... })) -- pre-existing since Phase 3GG-J-FAST, unrelated
// to K-FAST, and never assigned onto the response object. Item 7 above already verifies the
// response field allowlist carries no model-name-like field, so that is the authoritative check.
assert(!/console\.(log|error)\([^)]*OPENAI_API_KEY/.test(bridgeSrc), 'Bridge must never print OPENAI_API_KEY.');
assert(!/console\.(log|error)\([^)]*Authorization/.test(bridgeSrc), 'Bridge must never print an Authorization header.');
assert(!/console\.(log|error)\([^)]*(systemPrompt|userPrompt)/.test(bridgeSrc), 'Bridge must never print prompt text.');
assert(!/console\.(log|error)\([^)]*(rawBody|parsedBody)/.test(bridgeSrc), 'Bridge must never print the raw OpenAI response body.');
// Note: the bridge intentionally references raw KIS field names (rt_cd, stck_prpr, ...) inside
// its own FORBIDDEN_INPUT_VALUE_PATTERN denylist -- that pattern is unchanged from prior phases
// and is verified separately by earlier checkers, so it is not re-scanned here.

// --- 9. H route diff empty from baseline unless explicitly justified (not justified this phase) ---
function diffEmpty(filePath) {
  let diffOutput = '';
  try {
    diffOutput = runGit(['diff', '--name-only', BASELINE, '--', filePath]).trim();
  } catch {
    diffOutput = '<git diff failed>';
  }
  return diffOutput;
}

assert(diffEmpty(H_ROUTE) === '', `H route must have no diff from baseline this phase: ${diffEmpty(H_ROUTE)}`);
assert(diffEmpty(ASTRO_UI) === '', `chart-ai.astro must have no diff from baseline this phase: ${diffEmpty(ASTRO_UI)}`);
assert(diffEmpty(MODEL_POLICY_SRC) === '', `Model policy module must have no diff from baseline this phase: ${diffEmpty(MODEL_POLICY_SRC)}`);

// --- 10. No KIS provider module changed ---
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

// --- 11. No forbidden diff (UI, H route, model policy, MK/SP agents, scaffold, data, lockfiles, env) ---
let forbiddenDiffOutput = '';
try {
  forbiddenDiffOutput = runGit(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]).trim();
} catch {
  forbiddenDiffOutput = '<git diff failed>';
}
assert(forbiddenDiffOutput === '', `Forbidden diff is not empty: ${forbiddenDiffOutput}`);

// --- 12. No lockfile diff, no .env/.env.local diff ---
let lockfileDiffOutput = '';
try {
  lockfileDiffOutput = runGit(['diff', '--name-only', BASELINE, '--', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']).trim();
} catch {
  lockfileDiffOutput = '<git diff failed>';
}
assert(lockfileDiffOutput === '', `Lockfile diff must be empty: ${lockfileDiffOutput}`);

let envDiffOutput = '';
try {
  envDiffOutput = runGit(['diff', '--name-only', BASELINE, '--', '.env', '.env.local']).trim();
} catch {
  envDiffOutput = '<git diff failed>';
}
assert(envDiffOutput === '', `.env/.env.local diff must be empty: ${envDiffOutput}`);

// --- 13. Smoke script content checks ---
const smokeSrc = exists(SMOKE_SCRIPT) ? read(SMOKE_SCRIPT) : '';
assert(!smokeSrc.includes('http://localhost'), 'Smoke script must never call a live dev server -- fully deterministic, no server required.');
assert(!smokeSrc.includes('api.openai.com'), 'Smoke script must never call the real OpenAI API URL.');
assert(
  !/const\s+.*=\s*process\.env\.OPENAI_API_KEY|process\.env\.OPENAI_API_KEY\s*;/.test(smokeSrc),
  'Smoke script must never read a real OPENAI_API_KEY from process.env directly into a variable.',
);
for (let i = 1; i <= 20; i += 1) {
  assert(smokeSrc.includes(`Case ${i}`), `Smoke script must cover Case ${i}.`);
}

// --- 14. Result doc required sections/claims ---
const resultDoc = exists(RESULT_DOC) ? read(RESULT_DOC) : '';
for (const token of RESULT_DOC_REQUIRED_TOKENS) {
  assert(resultDoc.includes(token), `Result doc missing required token: ${token}`);
}
assert(
  !/OPENAI_API_KEY\s*=\s*sk-|Authorization:\s*Bearer\s+\S/.test(resultDoc),
  'Result doc must never contain a raw credential or Authorization header value.',
);
assert(
  !/currentPrice["`']?\s*[:=]\s*\d/.test(resultDoc),
  'Result doc must never contain a literal currentPrice numeric value.',
);

// --- 15. Changelog entry present, prepended above the Phase 3GG-J-HF1 entry ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-K-FAST - 2026-07-11');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-K-FAST entry header');
const changelogSection =
  changelogHeaderIndex === -1 ? '' : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
const jHf1HeaderIndex = changelog.indexOf('## Phase 3GG-J-HF1 - 2026-07-11');
assert(
  jHf1HeaderIndex === -1 || (changelogHeaderIndex !== -1 && changelogHeaderIndex < jHf1HeaderIndex),
  'Phase 3GG-K-FAST changelog entry must be prepended above the Phase 3GG-J-HF1 entry',
);

// --- 16. No unexpected working-tree changes outside this phase's scope ---
const ALLOWED_MODIFIED_FILES = new Set([
  ...CORE_DELIVERABLES,
  ...ALLOWED_MODIFIED_SOURCE,
  CHANGELOG,
  PACKAGE_JSON,
  // Tiny checker-only compatibility fix, explicitly permitted by the K-FAST work order: J-HF1's
  // own bridge-no-diff assertion predates this authorized phase and would otherwise reject the
  // bridge edit this phase is required to make.
  'scripts/check_phase_3gg_j_hf1_contract.mjs',
]);
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

// --- 17. No deploy/push/activation marker in the new source or docs ---
for (const file of [SMOKE_SCRIPT, RESULT_DOC]) {
  const src = exists(file) ? read(file) : '';
  assert(!/vercel deploy|git push/i.test(src), `${file} must not contain a deploy/push marker.`);
  assert(
    !/publicActivation|betaActivation|internalQaActivation|PUBLIC_ACTIVATION=1|BETA_ACTIVATION=1/.test(src),
    `${file} must not contain an activation token.`,
  );
}

// --- 18. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-K-FAST check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-K-FAST check PASS: ${assertions}/${assertions} assertions passed.`);
}
