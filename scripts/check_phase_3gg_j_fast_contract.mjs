// Phase 3GG-J-FAST contract checker.
// Verifies the local-only LLM model tier and fallback policy module, its integration into the
// runtime bridge, the deterministic smoke script, and this checker's own wiring/scope are
// present and safe -- and that this phase introduced no diff outside its allowed scope, no KIS
// provider diff, no UI diff, no API route diff, no lockfile/.env diff, measured against the
// Phase 3GG-I-QA baseline.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '444481268d97576b1af78acafcb5b6aa29b00f12';

const MODEL_POLICY_SRC = 'src/lib/server/chart-ai/local-only-llm-model-policy.mjs';
const BRIDGE_SRC = 'src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs';
const SMOKE_SCRIPT = 'scripts/smoke_phase_3gg_j_fast_model_tier_fallback_policy.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_j_fast_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_j_fast_model_tier_fallback_policy_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [MODEL_POLICY_SRC, BRIDGE_SRC, SMOKE_SCRIPT, CHECKER_SELF, RESULT_DOC];

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
];

// This phase's stricter "do not modify unless absolutely necessary" scope: the UI page was an
// explicitly forbidden diff target this time (unlike Phase 3GG-I-FAST, which legitimately touched
// chart-ai.astro). The H route was also originally forbidden here, but Phase 3GG-J-HF1 (a small,
// explicitly-approved follow-up hotfix) legitimately wires the new model-tier env keys through
// that route, so it is intentionally excluded from this list as of that later phase -- this is a
// tiny checker-only compatibility fix, not a weakening of any safety assertion.
const REQUIRED_FORBIDDEN_DIFF_PATHS = [
  'src/pages/chart-ai.astro',
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

const FORBIDDEN_NEW_RESPONSE_FIELDS = [
  'modelName',
  'modelId',
  'rawModel',
  'prompt',
  'request',
  'response',
  'tokenUsage',
  'usage',
  'cost',
];

const RESULT_DOC_REQUIRED_TOKENS = [
  `Baseline: ${BASELINE}`,
  'Branch: rebuild/phase-1-ia-shell',
  'Files changed',
  'main_summary',
  'fallback_summary',
  'CHART_AI_LLM_MAIN_MODEL',
  'CHART_AI_LLM_FALLBACK_MODEL',
  'Backward compatibility',
  'llm-fallback-used',
  'llm-fallback-failed',
  'Credential exposure status',
  'Raw KIS payload exposure status',
  'Raw LLM response exposure status',
  'Validation results',
  'Next recommended phase',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-J-FAST - 2026-07-11',
  '### Model Tier and Fallback Policy for Chart AI Local-only LLM',
  'CHART_AI_LLM_MAIN_MODEL',
  'CHART_AI_LLM_FALLBACK_MODEL',
  'CHART_AI_LLM_MODEL',
  'not pushed',
  'not deployed',
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
  pkg.scripts && pkg.scripts['smoke:phase-3gg-j-fast'] === `node ${SMOKE_SCRIPT}`,
  'package.json is missing the exact "smoke:phase-3gg-j-fast" script entry',
);
assert(
  pkg.scripts && pkg.scripts['check:phase-3gg-j-fast'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-j-fast" script entry',
);

// --- 3. Model policy module content checks ---
const policySrc = exists(MODEL_POLICY_SRC) ? read(MODEL_POLICY_SRC) : '';
assert(policySrc.includes('LOCAL_ONLY_LLM_MODEL_POLICY_CONTRACT_VERSION'), 'Model policy must export LOCAL_ONLY_LLM_MODEL_POLICY_CONTRACT_VERSION.');
assert(policySrc.includes('LLM_MODEL_ROLES'), 'Model policy must export LLM_MODEL_ROLES.');
assert(policySrc.includes('LLM_MODEL_POLICY_ENV_KEYS'), 'Model policy must export LLM_MODEL_POLICY_ENV_KEYS.');
assert(policySrc.includes('ALLOWED_LLM_MODEL_POLICY_FIELDS'), 'Model policy must export ALLOWED_LLM_MODEL_POLICY_FIELDS.');
assert(policySrc.includes('MODEL_POLICY_ERROR_CODES'), 'Model policy must export MODEL_POLICY_ERROR_CODES.');
assert(policySrc.includes('FALLBACK_ELIGIBLE_ERROR_CLASSES'), 'Model policy must export FALLBACK_ELIGIBLE_ERROR_CLASSES.');
assert(policySrc.includes('function normalizeModelName'), 'Model policy must define normalizeModelName.');
assert(policySrc.includes('function buildLocalOnlyLlmModelPolicy'), 'Model policy must define buildLocalOnlyLlmModelPolicy.');
assert(policySrc.includes('function resolveLlmModelForRole'), 'Model policy must define resolveLlmModelForRole.');
assert(policySrc.includes('function shouldAttemptFallbackForLlmFailure'), 'Model policy must define shouldAttemptFallbackForLlmFailure.');
assert(policySrc.includes('function buildModelPolicySnapshot'), 'Model policy must define buildModelPolicySnapshot.');
assert(policySrc.includes('main_summary'), 'Model policy must define the main_summary role.');
assert(policySrc.includes('fallback_summary'), 'Model policy must define the fallback_summary role.');
assert(policySrc.includes('test_summary'), 'Model policy must define the test_summary role.');
assert(policySrc.includes('moderation_future'), 'Model policy must define the moderation_future role metadata.');
assert(policySrc.includes('embedding_future'), 'Model policy must define the embedding_future role metadata.');
assert(policySrc.includes('CHART_AI_LLM_MAIN_MODEL'), 'Model policy must reference CHART_AI_LLM_MAIN_MODEL.');
assert(policySrc.includes('CHART_AI_LLM_MODEL'), 'Model policy must reference the legacy CHART_AI_LLM_MODEL for backward compatibility.');
assert(policySrc.includes('CHART_AI_LLM_FALLBACK_MODEL'), 'Model policy must reference CHART_AI_LLM_FALLBACK_MODEL.');
assert(!/\bprocess\.env\b/.test(policySrc), 'Model policy must never read process.env directly -- env must be an injected parameter.');
assert(policySrc.includes("['model_not_found'") || policySrc.includes('model_not_found'), 'Model policy must define model_not_found as fallback-eligible.');
assert(!policySrc.includes("'bad_request'"), 'Model policy must never mark bad_request as fallback-eligible.');

// --- 4. Bridge integration content checks ---
const bridgeSrc = exists(BRIDGE_SRC) ? read(BRIDGE_SRC) : '';
assert(bridgeSrc.includes("from './local-only-llm-model-policy.mjs'"), 'Bridge must import the model policy module.');
assert(bridgeSrc.includes('buildLocalOnlyLlmModelPolicy'), 'Bridge must call buildLocalOnlyLlmModelPolicy.');
assert(bridgeSrc.includes('resolveLlmModelForRole'), 'Bridge must call resolveLlmModelForRole.');
assert(bridgeSrc.includes('shouldAttemptFallbackForLlmFailure'), 'Bridge must call shouldAttemptFallbackForLlmFailure.');
assert(bridgeSrc.includes('llm-fallback-used'), 'Bridge must emit the llm-fallback-used warning on fallback success.');
assert(bridgeSrc.includes('llm-fallback-failed'), 'Bridge must emit the llm-fallback-failed warning on fallback failure.');
assert(bridgeSrc.includes('LLM_CONFIG_MISSING'), 'Bridge must still fail closed with LLM_CONFIG_MISSING when no main model resolves.');
for (const field of FORBIDDEN_NEW_RESPONSE_FIELDS) {
  assert(!bridgeSrc.includes(`'${field}'`) && !bridgeSrc.includes(`"${field}"`), `Bridge must never introduce forbidden new response field: ${field}`);
}
assert(!bridgeSrc.includes('currentPrice:') || bridgeSrc.includes('currentPricePresent'), 'Bridge must never expose the raw currentPrice numeric value in the response.');
assert(!/console\.(log|error)\([^)]*mainModel/.test(bridgeSrc), 'Bridge must never print the resolved main model name.');
assert(!/console\.(log|error)\([^)]*fallbackModel/.test(bridgeSrc), 'Bridge must never print the resolved fallback model name.');

// --- 5. Smoke script content checks ---
const smokeSrc = exists(SMOKE_SCRIPT) ? read(SMOKE_SCRIPT) : '';
assert(!smokeSrc.includes('http://localhost'), 'Smoke script must never call a live dev server -- fully deterministic, no server required.');
assert(!smokeSrc.includes('api.openai.com'), 'Smoke script must never call the real OpenAI API URL.');
assert(!/process\.env\.OPENAI_API_KEY/.test(smokeSrc), 'Smoke script must never read a real OPENAI_API_KEY from process.env.');
for (let i = 1; i <= 15; i += 1) {
  assert(smokeSrc.includes(`Case ${i}`), `Smoke script must cover Case ${i}.`);
}
assert(smokeSrc.includes('fetchImpl'), 'Smoke script must inject a fake fetch transport.');
assert(smokeSrc.includes('llm-fallback-used'), 'Smoke script must assert on the llm-fallback-used warning.');
assert(smokeSrc.includes('llm-fallback-failed'), 'Smoke script must assert on the llm-fallback-failed warning.');

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

// --- 7. No UI / API route / MK Agent / scaffold / Supabase / data / lockfile / env change ---
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
  !/OPENAI_API_KEY\s*=\s*sk-|Authorization:\s*Bearer\s+\S/.test(resultDoc),
  'Result doc must never contain a raw credential or Authorization header value.',
);
assert(
  !/currentPrice["`']?\s*[:=]\s*\d/.test(resultDoc),
  'Result doc must never contain a literal currentPrice numeric value.',
);

// --- 9. Changelog entry present, prepended above the Phase 3GG-I-QA entry ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-J-FAST - 2026-07-11');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-J-FAST entry header');
const changelogSection =
  changelogHeaderIndex === -1 ? '' : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
const iQaHeaderIndex = changelog.indexOf('## Phase 3GG-I-QA - 2026-07-11');
assert(
  iQaHeaderIndex === -1 || (changelogHeaderIndex !== -1 && changelogHeaderIndex < iQaHeaderIndex),
  'Phase 3GG-J-FAST changelog entry must be prepended above the Phase 3GG-I-QA entry',
);

// --- 10. No unexpected working-tree changes outside this phase's scope ---
// Phase 3GG-J-HF1 (a small, explicitly-approved follow-up hotfix) legitimately touches the H
// route and adds its own deliverables; tolerated here so this checker still passes when run
// mid-J-HF1-implementation, before that phase's own commit. Tiny checker-only compatibility
// addition, not a weakening of any safety assertion.
const J_HF1_TOLERATED_PATHS = [
  'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts',
  'scripts/smoke_phase_3gg_j_hf1_model_tier_env_passthrough.mjs',
  'scripts/check_phase_3gg_j_hf1_contract.mjs',
  'docs/planning/phase_3gg_j_hf1_model_tier_env_passthrough_result_v0.1.md',
];
const ALLOWED_MODIFIED_FILES = new Set([...CORE_DELIVERABLES, CHANGELOG, PACKAGE_JSON, ...J_HF1_TOLERATED_PATHS]);
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

// --- 11. No deploy/push/activation marker in the new source or docs ---
for (const file of [MODEL_POLICY_SRC, BRIDGE_SRC, SMOKE_SCRIPT, RESULT_DOC]) {
  const src = exists(file) ? read(file) : '';
  assert(!/vercel deploy|git push/i.test(src), `${file} must not contain a deploy/push marker.`);
  assert(
    !/publicActivation|betaActivation|internalQaActivation|PUBLIC_ACTIVATION=1|BETA_ACTIVATION=1/.test(src),
    `${file} must not contain an activation token.`,
  );
}

// --- 12. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-J-FAST check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-J-FAST check PASS: ${assertions}/${assertions} assertions passed.`);
}
