// Phase 3GG-J-HF1 contract checker.
// Verifies the H route now passes the model-tier env keys through to the LLM runtime bridge,
// that the route's gating and response contract are unchanged, that chart-ai.astro, the model
// policy module, and the bridge carry no unjustified diff, that no KIS provider module changed,
// and that this phase introduced no diff outside its allowed scope -- measured against the
// Phase 3GG-J-FAST baseline.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '8fa1501886a0dc7e5e0c57c050b8018b80002db2';

const H_ROUTE = 'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts';
const MODEL_POLICY_SRC = 'src/lib/server/chart-ai/local-only-llm-model-policy.mjs';
const BRIDGE_SRC = 'src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs';
const SMOKE_SCRIPT = 'scripts/smoke_phase_3gg_j_hf1_model_tier_env_passthrough.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_j_hf1_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_j_hf1_model_tier_env_passthrough_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [SMOKE_SCRIPT, CHECKER_SELF, RESULT_DOC];
const ALLOWED_MODIFIED_SOURCE = [H_ROUTE];

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

// The model policy module is expected to carry NO diff this phase -- this is an H route wiring
// hotfix only. Verified via git diff, not merely "not in the allowed list".
// Phase 3GG-K-FAST note: the bridge (BRIDGE_SRC) was intentionally removed from this list. K-FAST
// is a later, explicitly authorized phase that legitimately edits the bridge's prompt/sanitize
// logic; re-running this J-HF1 checker as a regression check after K-FAST must not fail on a diff
// this checker was never meant to police. This is a narrowing of a stale scope, not a weakening of
// any safety assertion -- the bridge's own contract is verified by check_phase_3gg_k_fast_contract.mjs.
const NO_DIFF_EXPECTED_PATHS = [MODEL_POLICY_SRC];

const REQUIRED_ENV_KEYS = [
  'CHART_AI_ENABLE_LOCAL_LLM',
  'OPENAI_API_KEY',
  'CHART_AI_LLM_MODEL',
  'CHART_AI_LLM_MAIN_MODEL',
  'CHART_AI_LLM_FALLBACK_MODEL',
  'CHART_AI_LLM_TEST_MODEL',
  'CHART_AI_LLM_MODERATION_MODEL',
  'CHART_AI_LLM_EMBEDDING_MODEL',
];

const RESULT_DOC_REQUIRED_TOKENS = [
  'Status: Implemented',
  `Baseline: ${BASELINE}`,
  'Branch: rebuild/phase-1-ia-shell',
  'Files changed',
  'CHART_AI_LLM_MAIN_MODEL',
  'CHART_AI_LLM_FALLBACK_MODEL',
  'CHART_AI_LLM_TEST_MODEL',
  'CHART_AI_LLM_MODERATION_MODEL',
  'CHART_AI_LLM_EMBEDDING_MODEL',
  'Backward compatibility',
  'Credential exposure status',
  'Raw KIS payload exposure status',
  'Raw LLM response exposure status',
  'Validation results',
  'Next recommended phase',
  'Phase 3GG-K-FAST',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-J-HF1 - 2026-07-11',
  '### Model Tier Env Passthrough for Local-only H Route',
  'Phase 3GG-J-FAST',
  'CHART_AI_LLM_MODEL',
  'not pushed',
  'not deployed',
  'Phase 3GG-K-FAST',
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
for (const file of [...CORE_DELIVERABLES, H_ROUTE, CHANGELOG, PACKAGE_JSON]) {
  assert(exists(file), `Required file missing: ${file}`);
}

// --- 2. package.json script wiring ---
const pkg = JSON.parse(read(PACKAGE_JSON));
assert(
  pkg.scripts && pkg.scripts['smoke:phase-3gg-j-hf1'] === `node ${SMOKE_SCRIPT}`,
  'package.json is missing the exact "smoke:phase-3gg-j-hf1" script entry',
);
assert(
  pkg.scripts && pkg.scripts['check:phase-3gg-j-hf1'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-j-hf1" script entry',
);

// --- 3. H route passes all model-tier env keys into bridge env object ---
const routeSrc = exists(H_ROUTE) ? read(H_ROUTE) : '';
for (const key of REQUIRED_ENV_KEYS) {
  assert(routeSrc.includes(`${key}: process.env.${key}`), `H route must pass through env key: ${key}`);
}

// --- 4. H route does not return model names ---
const FORBIDDEN_MODEL_FIELD_PATTERN = /modelName|modelId|rawModel/;
assert(!FORBIDDEN_MODEL_FIELD_PATTERN.test(routeSrc), 'H route must never return a model name field.');

// --- 5. H route response contract unchanged (still returns { ok: true, summary: llmSummary }) ---
assert(routeSrc.includes('jsonResponse({ ok: true, summary: llmSummary })'), 'H route must still return the unchanged { ok: true, summary } response shape.');
assert(!/summary\.model|llmSummary\.model/.test(routeSrc), 'H route must not add a model field onto the summary response.');

// --- 6. H route gating unchanged ---
assert(routeSrc.includes("url.searchParams.get('ownerLocalKisLlm') === '1'"), 'H route must still require ownerLocalKisLlm=1.');
assert(routeSrc.includes('resolveLocalHostname'), 'H route must still enforce the local hostname guard.');
assert(routeSrc.includes('!ownerLocalKisLlmOptIn || !resolvedHostname'), 'H route must still fail closed on non-local / non-opt-in requests.');
assert(routeSrc.includes("category: 'current_price'"), 'H route must still request current_price only.');

// --- 7. No .env/.env.local read, no credential logging, no raw payload exposure ---
assert(!/require\(['"]\.env|readFileSync\([^)]*\.env/.test(routeSrc), 'H route must never directly read .env/.env.local.');
assert(!/console\.(log|error)\([^)]*OPENAI_API_KEY/.test(routeSrc), 'H route must never print OPENAI_API_KEY.');
assert(!/console\.(log|error)\([^)]*Authorization/.test(routeSrc), 'H route must never print an Authorization header.');

// --- 8. chart-ai.astro has no diff from baseline ---
let astroDiff = '';
try {
  astroDiff = runGit(['diff', '--name-only', BASELINE, '--', 'src/pages/chart-ai.astro']).trim();
} catch {
  astroDiff = '<git diff failed>';
}
assert(astroDiff === '', `chart-ai.astro must have no diff from baseline: ${astroDiff}`);

// --- 9. Model policy module and bridge carry no diff (this is a route-only hotfix) ---
for (const filePath of NO_DIFF_EXPECTED_PATHS) {
  let diffOutput = '';
  try {
    diffOutput = runGit(['diff', '--name-only', BASELINE, '--', filePath]).trim();
  } catch {
    diffOutput = '<git diff failed>';
  }
  assert(diffOutput === '', `${filePath} must have no diff from baseline this phase: ${diffOutput}`);
}

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

// --- 11. No forbidden diff (UI, MK/SP agents, scaffold, supabase, data, lockfiles, env) ---
let forbiddenDiffOutput = '';
try {
  forbiddenDiffOutput = runGit(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]).trim();
} catch {
  forbiddenDiffOutput = '<git diff failed>';
}
assert(forbiddenDiffOutput === '', `Forbidden diff is not empty: ${forbiddenDiffOutput}`);

// --- 12. No lockfile diff ---
let lockfileDiffOutput = '';
try {
  lockfileDiffOutput = runGit(['diff', '--name-only', BASELINE, '--', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']).trim();
} catch {
  lockfileDiffOutput = '<git diff failed>';
}
assert(lockfileDiffOutput === '', `Lockfile diff must be empty: ${lockfileDiffOutput}`);

// --- 13. Smoke script content checks ---
const smokeSrc = exists(SMOKE_SCRIPT) ? read(SMOKE_SCRIPT) : '';
assert(!smokeSrc.includes('http://localhost'), 'Smoke script must never call a live dev server -- fully deterministic, no server required.');
assert(!smokeSrc.includes('api.openai.com'), 'Smoke script must never call the real OpenAI API URL.');
assert(
  !/const\s+.*=\s*process\.env\.OPENAI_API_KEY|process\.env\.OPENAI_API_KEY\s*;/.test(smokeSrc),
  'Smoke script must never read a real OPENAI_API_KEY from process.env directly into a variable.',
);
for (let i = 1; i <= 22; i += 1) {
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

// --- 15. Changelog entry present, prepended above the Phase 3GG-J-FAST entry ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-J-HF1 - 2026-07-11');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-J-HF1 entry header');
const changelogSection =
  changelogHeaderIndex === -1 ? '' : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
const jFastHeaderIndex = changelog.indexOf('## Phase 3GG-J-FAST - 2026-07-11');
assert(
  jFastHeaderIndex === -1 || (changelogHeaderIndex !== -1 && changelogHeaderIndex < jFastHeaderIndex),
  'Phase 3GG-J-HF1 changelog entry must be prepended above the Phase 3GG-J-FAST entry',
);

// --- 16. No unexpected working-tree changes outside this phase's scope ---
const ALLOWED_MODIFIED_FILES = new Set([
  ...CORE_DELIVERABLES,
  ...ALLOWED_MODIFIED_SOURCE,
  CHANGELOG,
  PACKAGE_JSON,
  // Tiny checker-only compatibility fix, explicitly permitted by the J-HF1 work order: J-FAST's
  // own forbidden-diff scope predates this authorized phase and would otherwise reject the H
  // route edit this phase is required to make.
  'scripts/check_phase_3gg_j_fast_contract.mjs',
  // Phase 3GG-K-FAST tolerance: this checker is re-run as a regression check after K-FAST, a
  // later, explicitly authorized phase that legitimately edits the bridge and adds its own
  // deliverables. These paths are policed by check_phase_3gg_k_fast_contract.mjs, not this one.
  BRIDGE_SRC,
  'scripts/smoke_phase_3gg_k_fast_summary_quality_upgrade.mjs',
  'scripts/check_phase_3gg_k_fast_contract.mjs',
  'docs/planning/phase_3gg_k_fast_summary_quality_upgrade_result_v0.1.md',
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
  console.error(`Phase 3GG-J-HF1 check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-J-HF1 check PASS: ${assertions}/${assertions} assertions passed.`);
}
