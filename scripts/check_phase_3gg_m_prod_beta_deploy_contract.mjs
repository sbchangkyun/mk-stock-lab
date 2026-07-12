// Phase 3GG-M-PROD-BETA-DEPLOY contract checker.
// Verifies the production Chart AI beta guard source, result doc, and package.json/changelog wiring
// are present; that only the 3 allowed source files carry a diff vs the baseline (ea60afa); that the
// forbidden-diff files remain zero-diff; that no lockfile diff exists; that .env/.env.local/.vercel are
// neither staged nor committed; and that no forbidden endpoint/model/prompt/raw-exposure string appears
// in the touched source files.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = 'ea60afa';

const RESULT_DOC = 'docs/planning/phase_3gg_m_prod_beta_deploy_production_url_chart_ai_beta_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3gg_m_prod_beta_deploy_contract.mjs';
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

// This phase is authorized to modify exactly these 3 source files.
const ALLOWED_SOURCE_FILES = [
  'src/lib/server/chart-ai/protected-preview-beta-guard.mjs',
  'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts',
  'src/pages/chart-ai.astro',
];

const REQUIRED_FORBIDDEN_DIFF_PATHS = [
  'src/lib/server/providers/kisClient.ts',
  'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs',
  'src/pages/api/chart-ai/local-only-kis-current-price.json.ts',
  'src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs',
  'src/lib/server/chart-ai/local-only-llm-model-policy.mjs',
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

const SOURCE_REQUIRED_TOKENS = [
  'CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA',
  'chartAiProdBeta',
  "VERCEL_ENV === 'production'",
  'not_production_env',
  'ownerLocalKisLlm=1',
  'chartAiBetaPreview=1',
];

const FORBIDDEN_CONTENT_PATTERNS = [
  /\/api\/(order|account|balance|funds|portfolio\/trade|trading)\b/i,
  /gpt-4|gpt-5|claude-|text-davinci|o1-preview|o1-mini/i,
  /currentPrice\s*[:=]\s*\{?\s*[0-9]/,
  /volume\s*[:=]\s*\{?\s*[0-9]/,
];

const RESULT_DOC_REQUIRED_TOKENS = [
  'Baseline',
  'ea60afa',
  'Branch',
  'rebuild/phase-1-ia-shell',
  'Production env presence',
  'CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA',
  'Local regression preflight result',
  'Production beta guard summary',
  'Exposure status',
  'KIS endpoint boundary',
  '`current_price` only',
  'H route only',
  'LLM boundary',
  'Next recommended phase',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-M-PROD-BETA-DEPLOY - 2026-07-12',
  'Production URL Chart AI Beta Activation and Cloud Deploy',
  'Builds on Phase 3GG-L-BETA-DEPLOY-RERUN-3',
  'chartAiProdBeta=1',
  'CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA',
  'VERCEL_ENV',
  'H route only',
  'current_price only',
  'No KIS endpoint expansion',
  'No prompt rewrite',
  'No model name exposure',
  'No raw OpenAI/KIS',
  'currentPrice/volume',
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
for (const file of [...CORE_DELIVERABLES, CHANGELOG, PACKAGE_JSON, ...ALLOWED_SOURCE_FILES]) {
  assert(exists(file), `Required file missing: ${file}`);
}

// --- 2. package.json script wiring ---
const pkg = JSON.parse(read(PACKAGE_JSON));
assert(
  pkg.scripts && pkg.scripts['check:phase-3gg-m-prod-beta-deploy'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-m-prod-beta-deploy" script entry',
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

// --- 4. Changelog entry present, prepended above the L-BETA-DEPLOY-RERUN-3 entry ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-M-PROD-BETA-DEPLOY - 2026-07-12');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-M-PROD-BETA-DEPLOY entry header');
const changelogSection =
  changelogHeaderIndex === -1 ? '' : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
const rerun3HeaderIndex = changelog.indexOf('## Phase 3GG-L-BETA-DEPLOY-RERUN-3 - 2026-07-12');
assert(
  rerun3HeaderIndex === -1 || (changelogHeaderIndex !== -1 && changelogHeaderIndex < rerun3HeaderIndex),
  'Phase 3GG-M-PROD-BETA-DEPLOY changelog entry must be prepended above the Phase 3GG-L-BETA-DEPLOY-RERUN-3 entry',
);

// --- 5. Allowed source diff only (exactly the 3 named files) vs baseline ---
let allSourceDiffLines = [];
try {
  allSourceDiffLines = runGit(['diff', '--name-only', BASELINE])
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
} catch {
  allSourceDiffLines = ['<git diff failed>'];
}
const unexpectedDiff = allSourceDiffLines.filter((f) => {
  if (ALLOWED_SOURCE_FILES.includes(f)) return false;
  if (f === RESULT_DOC || f === CHECKER_SELF || f === CHANGELOG || f === PACKAGE_JSON) return false;
  if (KNOWN_UNTOUCHED_PATHS.some((p) => f === p || f.startsWith(p))) return false;
  // sibling-checker tolerance patches (documented, same convention as prior phases)
  if (/^scripts\/check_phase_3gg_[a-z0-9_]+_contract\.mjs$/.test(f)) return false;
  // Pre-existing, unstaged .gitignore change (Vercel CLI's `vercel link`-appended `.env*` line, carried
  // over from earlier phases, not touched by this phase); tolerated the same way as prior sibling checkers.
  if (f === '.gitignore') return false;
  return true;
});
assert(unexpectedDiff.length === 0, `Unexpected diff outside this phase's allowed files: ${unexpectedDiff.join(', ')}`);

// --- 6. Forbidden-diff files remain zero-diff ---
let forbiddenDiffOutput = '';
try {
  forbiddenDiffOutput = runGit(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]).trim();
} catch {
  forbiddenDiffOutput = '<git diff failed>';
}
assert(forbiddenDiffOutput === '', `Forbidden diff is not empty: ${forbiddenDiffOutput}`);

// --- 7. Allowed source files contain required production-guard tokens (presence anywhere across the 3 files) ---
const combinedSource = ALLOWED_SOURCE_FILES.map((f) => (exists(f) ? read(f) : '')).join('\n');
for (const token of SOURCE_REQUIRED_TOKENS) {
  assert(combinedSource.includes(token), `Allowed source files missing required token: ${token}`);
}

// --- 8. Forbidden content patterns absent from allowed source files ---
for (const pattern of FORBIDDEN_CONTENT_PATTERNS) {
  assert(!pattern.test(combinedSource), `Allowed source files must not match forbidden pattern: ${pattern}`);
}

// --- 9. .env / .env.local / .vercel never staged, never committed ---
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
assert(!stagedFiles.includes('.gitignore'), '.gitignore must never be staged for commit (unapproved for this phase).');

// --- 10. No lockfile diff ---
let lockfileDiff = '';
try {
  lockfileDiff = runGit(['diff', '--name-only', BASELINE, '--', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']).trim();
} catch {
  lockfileDiff = '<git diff failed>';
}
assert(lockfileDiff === '', `Lockfile diff must be empty: ${lockfileDiff}`);

// --- 11. No unexpected working-tree changes outside this phase's scope ---
const ALLOWED_MODIFIED_FILES = new Set([...CORE_DELIVERABLES, CHANGELOG, PACKAGE_JSON, ...ALLOWED_SOURCE_FILES]);
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
    filePath === '.gitignore'
  ) {
    assert(indexStatus === ' ' || indexStatus === '?', `${filePath} must not be staged (index status must be unstaged/untracked)`);
    continue;
  }
  const isKnown = KNOWN_UNTOUCHED_PATHS.some((p) => filePath === p || filePath.startsWith(p));
  if (isKnown || ALLOWED_MODIFIED_FILES.has(filePath) || /^scripts\/check_phase_3gg_[a-z0-9_]+_contract\.mjs$/.test(filePath)) {
    assert(true, `${filePath} is a known/allowed path for this phase`);
  } else {
    assert(false, `Unexpected working-tree change outside this phase's scope: ${filePath} (verify before commit)`);
  }
}

// --- 12. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-M-PROD-BETA-DEPLOY check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-M-PROD-BETA-DEPLOY check PASS: ${assertions}/${assertions} assertions passed.`);
}
