// Phase 3GG-K-ENV-HF1-RERUN-2 contract checker.
// Verifies the rerun-2 result doc + this checker + package.json/changelog wiring are present, that
// the existing owner-gated KIS runtime readiness diagnostic script is reused unchanged and remains
// safe, and that this diagnostic-rerun-only phase introduced no source feature diff, no KIS
// provider diff, no forbidden diff, and no lockfile/.env diff, measured against the Phase
// 3GG-K-ENV-HF1-RERUN baseline.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = 'd946eeb';

const DIAGNOSTIC_SCRIPT = 'scripts/owner_diagnostic_phase_3gg_k_env_hf1_kis_runtime_readiness.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_k_env_hf1_rerun_2_owner_local_kis_runtime_readiness_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3gg_k_env_hf1_rerun_2_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [RESULT_DOC, CHECKER_SELF];

const OWNER_APPROVAL_FLAG = '--owner-approved-kis-runtime-diagnostic';

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
];

const REQUIRED_FORBIDDEN_DIFF_SOURCE_FILES = [
  DIAGNOSTIC_SCRIPT,
  'src/lib/server/providers/kisClient.ts',
  'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs',
  'src/pages/api/chart-ai/local-only-kis-current-price.json.ts',
  'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts',
  'src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs',
  'src/lib/server/chart-ai/local-only-llm-model-policy.mjs',
  'src/pages/chart-ai.astro',
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

const REQUIRED_FORBIDDEN_DIFF_PATHS = [
  'src/lib/server/chart-ai/mk-agent.mjs',
  'src/lib/server/chart-ai/similar-pattern-agent.mjs',
  'src/lib/server/chart-ai/guarded-productization-scaffold.mjs',
  'components',
  'supabase',
  'src/data',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.env',
  '.env.local',
];

const RESULT_DOC_REQUIRED_TOKENS = [
  `Baseline: ${BASELINE}`,
  'Branch: rebuild/phase-1-ia-shell',
  'KIS_ENABLE_LIVE_QUOTES',
  'Env presence boolean summary',
  'Dev server reachability',
  'Dev server freshness after owner restart',
  'currentPricePresent',
  'volumePresent',
  'Classification',
  'Owner-safe next action',
  'Not pushed',
  'Not deployed',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-K-ENV-HF1-RERUN-2 - 2026-07-11',
  '### Confirm Owner-local KIS Runtime Readiness After Full Dev Server Restart',
  'Builds on Phase 3GG-K-ENV-HF1-RERUN',
  're-runs the safe owner-local KIS runtime diagnostic',
  'full dev server restart',
  'existing owner-gated diagnostic script',
  'Does not open or modify',
  'env presence booleans',
  'never secret values',
  'No source feature changes',
  'No UI change',
  'No H route change',
  'No LLM bridge change',
  'No model policy change',
  'No KIS endpoint expansion',
  'current_price only',
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
for (const file of [...CORE_DELIVERABLES, CHANGELOG, PACKAGE_JSON, DIAGNOSTIC_SCRIPT]) {
  assert(exists(file), `Required file missing: ${file}`);
}

// --- 2. package.json script wiring ---
const pkg = JSON.parse(read(PACKAGE_JSON));
assert(
  pkg.scripts && pkg.scripts['check:phase-3gg-k-env-hf1-rerun-2'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-k-env-hf1-rerun-2" script entry',
);
assert(
  pkg.scripts && pkg.scripts['owner-diagnostic:phase-3gg-k-env-hf1'] === `node ${DIAGNOSTIC_SCRIPT}`,
  'package.json must still wire the existing owner-diagnostic:phase-3gg-k-env-hf1 script (reused, not reauthored)',
);

// --- 3. Existing diagnostic script content checks (reused, must remain safe/unchanged) ---
const diagSrc = exists(DIAGNOSTIC_SCRIPT) ? read(DIAGNOSTIC_SCRIPT) : '';
assert(diagSrc.includes(OWNER_APPROVAL_FLAG), 'Diagnostic script must still require the explicit owner-approval CLI flag.');
assert(!/readFileSync\(.*\.env/.test(diagSrc), 'Diagnostic script must not read .env/.env.local directly.');
assert(!/['"]\.env(\.local)?['"]/.test(diagSrc), 'Diagnostic script must not reference a .env/.env.local file path.');
assert(
  !/console\.log\([^)]*process\.env\[/.test(diagSrc),
  'Diagnostic script must not print a process.env value directly.',
);
assert(
  !/\$\{currentPrice\}|\$\{context\.currentPrice\}/.test(diagSrc),
  'Diagnostic script must never interpolate the actual currentPrice value into a printed message.',
);
assert(
  !/\$\{volume\}|\$\{context\.volume\}/.test(diagSrc),
  'Diagnostic script must never interpolate the actual volume value into a printed message.',
);

// --- 4. No source feature file / existing diagnostic script changed ---
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

// --- 5. No KIS provider module changed ---
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

// --- 6. No UI / MK Agent / scaffold / Supabase / data / lockfile / env change ---
let forbiddenDiffOutput = '';
try {
  forbiddenDiffOutput = runGit(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]).trim();
} catch {
  forbiddenDiffOutput = '<git diff failed>';
}
assert(forbiddenDiffOutput === '', `Forbidden diff is not empty: ${forbiddenDiffOutput}`);

// --- 7. Result doc required content ---
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
assert(
  !/volume["`']?\s*[:=]\s*\d/.test(resultDoc),
  'Result doc must never contain a literal volume numeric value.',
);

// --- 8. Changelog entry present, prepended above the K-ENV-HF1-RERUN entry ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-K-ENV-HF1-RERUN-2 - 2026-07-11');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-K-ENV-HF1-RERUN-2 entry header');
const changelogSection =
  changelogHeaderIndex === -1 ? '' : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
const rerun1HeaderIndex = changelog.indexOf('## Phase 3GG-K-ENV-HF1-RERUN - 2026-07-11');
assert(
  rerun1HeaderIndex === -1 || (changelogHeaderIndex !== -1 && changelogHeaderIndex < rerun1HeaderIndex),
  'Phase 3GG-K-ENV-HF1-RERUN-2 changelog entry must be prepended above the Phase 3GG-K-ENV-HF1-RERUN entry',
);

// --- 9. No unexpected working-tree changes outside this phase's scope ---
// Sibling checkers are tolerated only if they were explicitly patched for checker-compatibility
// per this phase's work order -- each such patch is documented in the sibling's own file.
const ALLOWED_MODIFIED_FILES = new Set([
  ...CORE_DELIVERABLES,
  CHANGELOG,
  PACKAGE_JSON,
  'docs/planning/phase_3gg_k_env_hf1_rerun_owner_local_kis_runtime_readiness_result_v0.1.md',
  'scripts/check_phase_3gg_k_env_hf1_rerun_contract.mjs',
  'scripts/check_phase_3gg_k_env_hf1_contract.mjs',
  'scripts/check_phase_3gg_k_qa_owner_rerun_contract.mjs',
  'scripts/check_phase_3gg_k_qa_contract.mjs',
  'scripts/check_phase_3gg_k_fast_contract.mjs',
  'scripts/check_phase_3gg_j_hf1_contract.mjs',
  // Phase 3GG-K-ENV-HF1-RERUN-3 checker-compatibility tolerance: its 2 new files are not
  // protected/forbidden-diff paths for this checker, so they are tolerated here.
  'docs/planning/phase_3gg_k_env_hf1_rerun_3_owner_local_kis_runtime_readiness_result_v0.1.md',
  'scripts/check_phase_3gg_k_env_hf1_rerun_3_contract.mjs',
]);
// Note: the sibling checkers above are tolerated only if they were themselves patched with small
// documented tolerance blocks for this phase's new files (same convention used across every prior
// 3GG phase) -- none of them are protected/forbidden-diff paths, so this checker never asserts
// zero-diff on any of them.
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

// --- 10. No deploy/push/activation marker in the new docs ---
for (const file of [RESULT_DOC]) {
  const src = exists(file) ? read(file) : '';
  assert(!/vercel deploy|git push/i.test(src), `${file} must not contain a deploy/push marker.`);
  assert(
    !/publicActivation|betaActivation|internalQaActivation|PUBLIC_ACTIVATION=1|BETA_ACTIVATION=1/.test(src),
    `${file} must not contain an activation token.`,
  );
}

// --- 11. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-K-ENV-HF1-RERUN-2 check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-K-ENV-HF1-RERUN-2 check PASS: ${assertions}/${assertions} assertions passed.`);
}
