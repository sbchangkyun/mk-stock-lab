// Phase 3GG-L-BETA-DEPLOY-RERUN-2 contract checker.
// Verifies the rerun-2 deploy-execution result doc and package.json/changelog wiring are present; that
// this deploy/documentation-only rerun introduced NO source diff of any kind and no lockfile diff,
// measured against the Phase 3GG-L-BETA-DEPLOY-RERUN-2 baseline (5bc8142); that no production-deploy
// command appears in the new doc/checker; and that .env/.env.local/.vercel are neither staged nor
// committed.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '5bc8142';

const RESULT_DOC = 'docs/planning/phase_3gg_l_beta_deploy_rerun_2_protected_preview_beta_deploy_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3gg_l_beta_deploy_rerun_2_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [RESULT_DOC, CHECKER_SELF];

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
];

// This is a deploy/doc-only rerun phase: every source file below must remain zero-diff vs the baseline.
const REQUIRED_FORBIDDEN_DIFF_SOURCE_FILES = [
  'src/lib/server/providers/kisClient.ts',
  'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs',
  'src/pages/api/chart-ai/local-only-kis-current-price.json.ts',
  'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts',
  'src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs',
  'src/lib/server/chart-ai/local-only-llm-model-policy.mjs',
  'src/lib/server/chart-ai/protected-preview-beta-guard.mjs',
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
  'BLOCKED_DEPLOYMENT_PROTECTION_NOT_VERIFIED',
  'Protected Preview',
  'Deployment Protection',
  'Preview env name presence',
  'Deployment environment',
  'preview',
  'Production deploy: false',
  'Promoted to production: false',
  'vercelProjectLinked: true',
  'current_price only',
  'H route only',
  'No exposure',
  'not staged',
  'Not pushed',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-L-BETA-DEPLOY-RERUN-2 - 2026-07-11',
  'Protected Preview Beta Deploy Execution Rerun 2',
  'Builds on Phase 3GG-L-BETA-DEPLOY-RERUN',
  'Vercel project link is now owner-approved and verified',
  'Verifies Deployment Protection before live beta testing',
  'Verifies Preview env name presence as booleans only',
  'Runs local regression before deploy',
  'Runs vercel build and vercel deploy for Preview only if allowed',
  'Does not deploy production',
  'Does not promote to production',
  'Does not push',
  'Does not print Vercel env values',
  'Does not print secrets',
  'Does not print model names',
  'Does not print prompt text',
  'Does not print raw OpenAI/KIS payloads',
  'Does not print currentPrice/volume numeric values',
  'Does not commit `.vercel`',
  'current_price only',
  'H route only',
  'No KIS endpoint expansion',
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
  pkg.scripts && pkg.scripts['check:phase-3gg-l-beta-deploy-rerun-2'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-l-beta-deploy-rerun-2" script entry',
);

// --- 3. Result doc required content ---
const resultDoc = exists(RESULT_DOC) ? read(RESULT_DOC) : '';
for (const token of RESULT_DOC_REQUIRED_TOKENS) {
  assert(resultDoc.includes(token), `Result doc missing required token: ${token}`);
}
assert(
  !/OPENAI_API_KEY\s*=\s*sk-|Authorization:\s*Bearer\s+\S|sk-[A-Za-z0-9]{12,}/.test(resultDoc),
  'Result doc must never contain a raw OpenAI key or Authorization header value.',
);
assert(!/currentPrice["`']?\s*[:=]\s*\d/.test(resultDoc), 'Result doc must never contain a literal currentPrice numeric value.');
assert(!/volume["`']?\s*[:=]\s*\d/.test(resultDoc), 'Result doc must never contain a literal volume numeric value.');
assert(
  !/KIS_APP_KEY\s*=\s*[^\s`]|KIS_APP_SECRET\s*=\s*[^\s`]|KIS_BASE_URL\s*=\s*https?:\/\/\S/.test(resultDoc),
  'Result doc must never contain a literal KIS_APP_KEY/KIS_APP_SECRET/KIS_BASE_URL value.',
);

// --- 4. No production-deploy command in the new doc or this checker ---
const prodCommandPattern = /vercel\s+--prod\b|vercel\s+deploy\s+--prod\b|vercel\s+build\s+--prod\b|vercel\s+promote\b/i;
assert(!prodCommandPattern.test(resultDoc), 'Result doc must not contain a production-deploy command.');
assert(!prodCommandPattern.test(read(CHECKER_SELF)), 'Checker must not contain a production-deploy command.');

// --- 5. Changelog entry present, prepended above the L-BETA-DEPLOY-RERUN entry ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-L-BETA-DEPLOY-RERUN-2 - 2026-07-11');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-L-BETA-DEPLOY-RERUN-2 entry header');
const changelogSection =
  changelogHeaderIndex === -1 ? '' : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
const rerunHeaderIndex = changelog.indexOf('## Phase 3GG-L-BETA-DEPLOY-RERUN - 2026-07-11');
assert(
  rerunHeaderIndex === -1 || (changelogHeaderIndex !== -1 && changelogHeaderIndex < rerunHeaderIndex),
  'Phase 3GG-L-BETA-DEPLOY-RERUN-2 changelog entry must be prepended above the Phase 3GG-L-BETA-DEPLOY-RERUN entry',
);

// --- 6. No source diff (deploy/doc-only rerun phase) ---
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

// --- 7. No forbidden diff / no lockfile diff ---
let forbiddenDiffOutput = '';
try {
  forbiddenDiffOutput = runGit(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]).trim();
} catch {
  forbiddenDiffOutput = '<git diff failed>';
}
assert(forbiddenDiffOutput === '', `Forbidden diff is not empty: ${forbiddenDiffOutput}`);

// --- 8. .env / .env.local / .vercel never staged, never committed ---
assert(runGit(['ls-files', '--', '.env', '.env.local']).trim() === '', '.env/.env.local must never be tracked/committed.');
assert(runGit(['ls-files', '--', '.vercel', '.vercel/**']).trim() === '', '.vercel must never be tracked/committed.');
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
assert(!stagedFiles.some((f) => f === '.vercel' || f.startsWith('.vercel/')), '.vercel must never be staged for commit.');
assert(!stagedFiles.includes('.gitignore'), '.gitignore must never be staged for commit (owner/Vercel-CLI local change, unapproved for commit).');

// --- 9. No unexpected working-tree changes outside this phase's scope ---
const ALLOWED_MODIFIED_FILES = new Set([
  ...CORE_DELIVERABLES,
  CHANGELOG,
  PACKAGE_JSON,
  // Phase 3GG-L-BETA-DEPLOY-RERUN-2 sibling checker-compatibility tolerance (documented per this
  // phase's work order): the L-BETA-DEPLOY-RERUN, L-BETA-DEPLOY, L-BETA-ACTIVATE, and L-FAST checkers
  // needed small, documented ALLOWED_MODIFIED_FILES patches to tolerate this phase's 2 new rerun-2
  // files. Allow those sibling patches here too.
  'scripts/check_phase_3gg_l_beta_deploy_rerun_contract.mjs',
  'scripts/check_phase_3gg_l_beta_deploy_contract.mjs',
  'scripts/check_phase_3gg_l_beta_activate_contract.mjs',
  'scripts/check_phase_3gg_l_fast_contract.mjs',
  // Phase 3GG-L-BETA-DEPLOY-RERUN-3 checker-compatibility tolerance (documented): the rerun-3 phase
  // adds its own new result doc + checker (and patches sibling checkers, including this one); tolerate
  // them here too.
  'docs/planning/phase_3gg_l_beta_deploy_rerun_3_protected_preview_beta_deploy_result_v0.1.md',
  'scripts/check_phase_3gg_l_beta_deploy_rerun_3_contract.mjs',
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
  if (
    filePath === '.env' ||
    filePath === '.env.local' ||
    filePath === '.vercel' ||
    filePath.startsWith('.vercel/') ||
    // Phase 3GG-L-BETA-DEPLOY-RERUN-2 tolerance (documented): the Vercel CLI's `vercel link` run
    // appended a `.env*` line to .gitignore. This is left unstaged/uncommitted per this phase's
    // explicit instructions; the working-tree scan tolerates it as unstaged only, same as .env/.vercel.
    filePath === '.gitignore'
  ) {
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

// --- 10. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-L-BETA-DEPLOY-RERUN-2 check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-L-BETA-DEPLOY-RERUN-2 check PASS: ${assertions}/${assertions} assertions passed.`);
}
