// Phase 3GG-K-QA-OWNER-RERUN-2 contract checker.
// Verifies the K-QA-OWNER-RERUN-2 result doc and package.json/changelog wiring are present; that
// the result doc records the required sanitized QA evidence (classification, H route success-path
// fields, summary-quality contract markers, exposure booleans, mobile QA, network boundary, and the
// not-pushed/not-deployed status); and that this QA-only phase introduced NO source diff of any
// kind (KIS provider, binding, both chart-ai routes, LLM bridge, model policy, chart-ai.astro, MK
// Agent, Similar Pattern agent, guarded scaffold, components, supabase, src/data) and no lockfile
// diff, measured against the Phase 3GG-K-ENV-HF5 baseline (b34d850). Also asserts the local-only
// guard, the ownerLocalKisLlm=1 gate, the H route fail-closed logic, and current_price-only scope
// remain present, and that .env/.env.local were never staged or committed.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = 'b34d850';

const RESULT_DOC = 'docs/planning/phase_3gg_k_qa_owner_rerun_2_success_path_after_kis_runtime_correction_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3gg_k_qa_owner_rerun_2_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [RESULT_DOC, CHECKER_SELF];

const LLM_SUMMARY_ROUTE = 'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts';
const CURRENT_PRICE_ROUTE = 'src/pages/api/chart-ai/local-only-kis-current-price.json.ts';
const BINDING_MODULE = 'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs';

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
];

// This is a QA-only phase: every source file below must remain zero-diff vs the HF5 baseline.
const REQUIRED_FORBIDDEN_DIFF_SOURCE_FILES = [
  'src/lib/server/providers/kisClient.ts',
  'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs',
  'src/pages/api/chart-ai/local-only-kis-current-price.json.ts',
  'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts',
  'src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs',
  'src/lib/server/chart-ai/local-only-llm-model-policy.mjs',
  'src/pages/chart-ai.astro',
];

const REQUIRED_FORBIDDEN_DIFF_PATHS = [
  ...REQUIRED_FORBIDDEN_DIFF_SOURCE_FILES,
  'src/lib/server/chart-ai/mk-agent.mjs',
  'src/lib/server/chart-ai/similar-pattern-agent.mjs',
  'src/lib/server/chart-ai/guarded-productization-scaffold.mjs',
  'components',
  'supabase',
  'src/data',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
];

const RESULT_DOC_REQUIRED_TOKENS = [
  'BLOCKED_LLM_ENV_MISSING',
  'summary.ok',
  'sourceStatus',
  'llmStatus',
  'currentPricePresent',
  'volumePresent',
  'Korean bullet lines',
  '데이터 상태:',
  '해석 범위:',
  '유의사항:',
  'ASCII digit present: false',
  'Forbidden investment phrase present: false',
  'credential exposure',
  'raw KIS payload exposure',
  'raw LLM response exposure',
  'prompt exposure',
  'model name exposure',
  'currentPrice numeric exposure',
  'volume numeric exposure',
  'Mobile QA',
  'No forbidden route',
  'current_price only',
  'H route only',
  'Not pushed',
  'Not deployed',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-K-QA-OWNER-RERUN-2 - 2026-07-11',
  'Verify Success-path Summary Quality After KIS Runtime Correction',
  'Builds on Phase 3GG-K-ENV-HF5',
  'HF5 fixed the local current_price route',
  'Re-runs the previously blocked success-path QA',
  'Verifies owner-local Chart AI KIS + LLM summary success path',
  'Verifies click-only H route execution',
  '데이터 상태:',
  '해석 범위:',
  '유의사항:',
  'no ASCII digits',
  'no forbidden investment-advice phrasing',
  'no credential/raw KIS/raw LLM/prompt/model/currentPrice numeric/volume numeric exposure',
  'mobile 375px usability',
  'No source feature changes',
  'No KIS provider change',
  'No UI change',
  'No H route change',
  'No LLM bridge change',
  'No model policy change',
  'No KIS endpoint expansion',
  'current_price only',
  'No public/beta/internal QA activation',
  'Not pushed',
  'Not deployed',
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
  pkg.scripts && pkg.scripts['check:phase-3gg-k-qa-owner-rerun-2'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-k-qa-owner-rerun-2" script entry',
);

// --- 3. Result doc required content ---
const resultDoc = exists(RESULT_DOC) ? read(RESULT_DOC) : '';
for (const token of RESULT_DOC_REQUIRED_TOKENS) {
  assert(resultDoc.includes(token), `Result doc missing required token: ${token}`);
}
// The result doc must never leak a raw secret/numeric/model value.
assert(
  !/OPENAI_API_KEY\s*=\s*sk-|Authorization:\s*Bearer\s+\S/.test(resultDoc),
  'Result doc must never contain a raw credential or Authorization header value.',
);
assert(!/currentPrice["`']?\s*[:=]\s*\d/.test(resultDoc), 'Result doc must never contain a literal currentPrice numeric value.');
assert(!/volume["`']?\s*[:=]\s*\d/.test(resultDoc), 'Result doc must never contain a literal volume numeric value.');
assert(
  !/KIS_APP_KEY\s*=\s*[^\s`]|KIS_APP_SECRET\s*=\s*[^\s`]|KIS_BASE_URL\s*=\s*https?:\/\/\S/.test(resultDoc),
  'Result doc must never contain a literal KIS_APP_KEY/KIS_APP_SECRET/KIS_BASE_URL value.',
);

// --- 4. Changelog entry present, prepended above the K-ENV-HF5 entry ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-K-QA-OWNER-RERUN-2 - 2026-07-11');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-K-QA-OWNER-RERUN-2 entry header');
const changelogSection =
  changelogHeaderIndex === -1 ? '' : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
const hf5HeaderIndex = changelog.indexOf('## Phase 3GG-K-ENV-HF5 - 2026-07-11');
assert(
  hf5HeaderIndex === -1 || (changelogHeaderIndex !== -1 && changelogHeaderIndex < hf5HeaderIndex),
  'Phase 3GG-K-QA-OWNER-RERUN-2 changelog entry must be prepended above the Phase 3GG-K-ENV-HF5 entry',
);

// --- 5. No source feature diff (QA-only phase) ---
let sourceDiffLines = [];
try {
  sourceDiffLines = runGit(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_SOURCE_FILES])
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
} catch {
  sourceDiffLines = ['<git diff failed>'];
}
assert(sourceDiffLines.length === 0, `Source feature diff must be empty: ${sourceDiffLines.join(', ')}`);

// --- 6. No forbidden diff / no lockfile diff ---
let forbiddenDiffOutput = '';
try {
  forbiddenDiffOutput = runGit(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]).trim();
} catch {
  forbiddenDiffOutput = '<git diff failed>';
}
assert(forbiddenDiffOutput === '', `Forbidden diff is not empty: ${forbiddenDiffOutput}`);

// --- 7. Guards preserved: local-only, ownerLocalKisLlm=1, H route fail-closed, current_price only ---
const llmRouteSrc = exists(LLM_SUMMARY_ROUTE) ? read(LLM_SUMMARY_ROUTE) : '';
const currentPriceRouteSrc = exists(CURRENT_PRICE_ROUTE) ? read(CURRENT_PRICE_ROUTE) : '';
const bindingSrc = exists(BINDING_MODULE) ? read(BINDING_MODULE) : '';

assert(llmRouteSrc.includes('resolveLocalHostname'), 'H route must still resolve/require a local hostname.');
assert(
  llmRouteSrc.includes('ownerLocalKisLlm') && /ownerLocalKisLlm'\)\s*===\s*'1'/.test(llmRouteSrc),
  'H route must still require the ownerLocalKisLlm=1 opt-in gate.',
);
assert(
  llmRouteSrc.includes('blockedSummaryResponse') && llmRouteSrc.includes('NON_LOCAL_REQUEST'),
  'H route must still fail closed to a sanitized blocked summary on non-local/opt-out requests.',
);
assert(llmRouteSrc.includes("category: 'current_price'"), 'H route must still fix the market-data category to current_price.');
assert(currentPriceRouteSrc.includes('resolveLocalHostname'), 'current_price route must still require a local hostname.');
assert(
  bindingSrc.includes("ALLOWED_ENDPOINT_CATEGORIES = Object.freeze(['current_price'])"),
  'Binding must still allow current_price as the only market-data endpoint category (no KIS endpoint expansion).',
);

// --- 8. .env / .env.local never staged, never committed ---
assert(runGit(['ls-files', '--', '.env', '.env.local']).trim() === '', '.env/.env.local must never be tracked/committed.');
let stagedFiles = [];
try {
  stagedFiles = runGit(['diff', '--cached', '--name-only'])
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
} catch {
  stagedFiles = [];
}
assert(!stagedFiles.includes('.env') && !stagedFiles.includes('.env.local'), '.env/.env.local must never be staged for commit.');

// --- 9. No unexpected working-tree changes outside this phase's scope ---
const ALLOWED_MODIFIED_FILES = new Set([
  ...CORE_DELIVERABLES,
  CHANGELOG,
  PACKAGE_JSON,
  // Phase 3GG-K-QA-OWNER-RERUN-2 sibling checker-compatibility tolerance (documented per this
  // phase's work order): HF5's checker needed a small, documented ALLOWED_MODIFIED_FILES patch to
  // tolerate this phase's 2 new QA files. Allow that sibling patch here too.
  'scripts/check_phase_3gg_k_env_hf5_contract.mjs',
]);
let statusLines = [];
try {
  statusLines = runGit(['status', '--porcelain']).split('\n').filter(Boolean);
} catch {
  statusLines = [];
}
for (const line of statusLines) {
  const indexStatus = line[0];
  const filePath = line.slice(3).trim();
  if (filePath === '.env' || filePath === '.env.local') {
    assert(indexStatus === ' ' || indexStatus === '?', `${filePath} must not be staged (index status must be unstaged/untracked)`);
    continue;
  }
  const isKnown = KNOWN_UNTOUCHED_PATHS.some((p) => filePath === p || filePath.startsWith(p));
  if (isKnown || ALLOWED_MODIFIED_FILES.has(filePath)) {
    assert(true, `${filePath} is a known/allowed path for this phase`);
  } else {
    assert(false, `Unexpected working-tree change outside this phase's scope: ${filePath} (verify before commit)`);
  }
}

// --- 10. No deploy/push/activation marker in the new doc ---
{
  const src = exists(RESULT_DOC) ? read(RESULT_DOC) : '';
  assert(!/vercel deploy|git push/i.test(src), `${RESULT_DOC} must not contain a deploy/push marker.`);
  assert(
    !/publicActivation|betaActivation|internalQaActivation|PUBLIC_ACTIVATION=1|BETA_ACTIVATION=1/.test(src),
    `${RESULT_DOC} must not contain an activation token.`,
  );
}

// --- 11. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-K-QA-OWNER-RERUN-2 check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-K-QA-OWNER-RERUN-2 check PASS: ${assertions}/${assertions} assertions passed.`);
}
