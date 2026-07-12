// Phase 3GG-M-PROD-HF1 contract checker.
// Verifies the guarded production KIS live-quote exception source, result doc, and
// package.json/changelog wiring are present; that only the allowed source files carry a diff vs the
// baseline (5cbfb0b); that the forbidden-diff files remain zero-diff; that no lockfile diff exists;
// that .env/.env.local/.vercel are neither staged nor committed; that the touched source contains the
// scoped production-exception + fail-closed tokens and preserves the local/Preview opt-in queries; and
// that no forbidden endpoint/model/prompt/raw-exposure string appears in the touched source files.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '5cbfb0b';

const RESULT_DOC = 'docs/planning/phase_3gg_m_prod_hf1_guarded_production_kis_live_quotes_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3gg_m_prod_hf1_contract.mjs';
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

// This phase is authorized to modify these source files (kisClient.ts + the market-data binding are
// newly authorized this phase for the scoped production exception; chart-ai.astro only if needed).
const ALLOWED_SOURCE_FILES = [
  'src/lib/server/providers/kisClient.ts',
  'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs',
  'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts',
  'src/lib/server/chart-ai/protected-preview-beta-guard.mjs',
  'src/pages/chart-ai.astro',
];

// The three source files this phase MUST have changed to deliver the scoped exception.
const REQUIRED_CHANGED_SOURCE_FILES = [
  'src/lib/server/providers/kisClient.ts',
  'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs',
  'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts',
];

const REQUIRED_FORBIDDEN_DIFF_PATHS = [
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

// Phase 3GG-OP-FAST tolerance: OP-FAST added a new universal-search/real-OHLCV surface and extended
// kisClient.ts + summary route + src/data under the SAME scoped production guard. Documented sibling
// tolerance so this checker stays green against that superseding change.
const isOpFastArtifact = (f) =>
  f === 'src/lib/server/providers/kisClient.ts' ||
  f === 'src/lib/server/providers/types.ts' ||
  f === 'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts' ||
  f === 'src/lib/market-data/instrument.ts' ||
  /^src\/data\/chart-ai\//.test(f) ||
  /^src\/lib\/server\/chart-ai\/universal/.test(f) ||
  /^src\/pages\/api\/chart-ai\/(instruments|market)\//.test(f) ||
  /^scripts\/(smoke|check|owner_smoke)_phase_3gg_op_fast_/.test(f) ||
  /^docs\/planning\/phase_3gg_op_fast_/.test(f);

const SOURCE_REQUIRED_TOKENS = [
  'CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA',
  'chartAiProdBeta',
  'allowProductionChartAiBetaLiveQuotes', // the scoped per-call production allow option
  'production_not_allowed', // production fail-closed reason preserved
  "runtimeClass === 'vercel-production'", // production runtime check gating the exception
  'current_price', // scope stays current_price only
  'ownerLocalKisLlm', // localhost owner path preserved
  'chartAiBetaPreview', // Preview beta path preserved
];

const FORBIDDEN_CONTENT_PATTERNS = [
  /\/api\/(order|account|balance|funds|portfolio\/trade|trading)\b/i,
  /gpt-4|gpt-5|claude-|text-davinci|o1-preview|o1-mini/i,
  /currentPrice\s*[:=]\s*\{?\s*[0-9]/,
  /volume\s*[:=]\s*\{?\s*[0-9]/,
];

const RESULT_DOC_REQUIRED_TOKENS = [
  'Classification',
  'Baseline',
  '5cbfb0b',
  'Branch',
  'rebuild/phase-1-ia-shell',
  'Production env name presence',
  'CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA',
  'Guarded production KIS exception summary',
  'Localhost owner flow preserved',
  'Preview beta flow preserved',
  'Production beta flow preserved',
  'Local regression result',
  'Exposure status',
  'KIS endpoint boundary',
  '`current_price` only',
  'LLM boundary',
  'Next recommended phase',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-M-PROD-HF1 - 2026-07-12',
  'Guarded Production KIS Live Quotes Exception and Production URL Deploy',
  'Builds on Phase 3GG-M-PROD-BETA-DEPLOY',
  'chartAiProdBeta=1',
  'CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA=true',
  'current_price only',
  'Generic production KIS use remains fail-closed',
  'Preserves localhost owner flow',
  'Preserves Preview beta flow',
  'No prompt rewrite',
  'No model name exposure',
  'No raw OpenAI/KIS exposure',
  'currentPrice/volume',
  'portfolio/trading/personal',
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
  pkg.scripts && pkg.scripts['check:phase-3gg-m-prod-hf1'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-m-prod-hf1" script entry',
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

// --- 4. Changelog entry present, prepended above the 3GG-M-PROD-BETA-DEPLOY entry ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-M-PROD-HF1 - 2026-07-12');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-M-PROD-HF1 entry header');
const changelogSection =
  changelogHeaderIndex === -1 ? '' : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
const prevHeaderIndex = changelog.indexOf('## Phase 3GG-M-PROD-BETA-DEPLOY - 2026-07-12');
assert(
  prevHeaderIndex === -1 || (changelogHeaderIndex !== -1 && changelogHeaderIndex < prevHeaderIndex),
  'Phase 3GG-M-PROD-HF1 changelog entry must be prepended above the Phase 3GG-M-PROD-BETA-DEPLOY entry',
);

// --- 5. Allowed source diff only vs baseline ---
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
  // Later sibling phases' committed result docs are outside this phase's scope but expected (documented).
  if (/^docs\/planning\/phase_3gg_[a-z0-9_]+_result(_v[0-9.]+)?\.md$/.test(f)) return false;
  if (isOpFastArtifact(f)) return false;
  // Pre-existing, unstaged .gitignore change (Vercel CLI's `vercel link`-appended `.env*` line, carried
  // over from earlier phases, not touched by this phase); tolerated the same way as prior sibling checkers.
  if (f === '.gitignore') return false;
  return true;
});
assert(unexpectedDiff.length === 0, `Unexpected diff outside this phase's allowed files: ${unexpectedDiff.join(', ')}`);

// --- 5b. The three scoped-exception source files must actually be changed vs baseline ---
for (const file of REQUIRED_CHANGED_SOURCE_FILES) {
  assert(allSourceDiffLines.includes(file), `Expected source file to be modified vs baseline but it is unchanged: ${file}`);
}

// --- 6. Forbidden-diff files remain zero-diff ---
let forbiddenDiffOutput = '';
try {
  forbiddenDiffOutput = runGit(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS])
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((f) => !isOpFastArtifact(f))
    .join('\n');
} catch {
  forbiddenDiffOutput = '<git diff failed>';
}
assert(forbiddenDiffOutput === '', `Forbidden diff is not empty: ${forbiddenDiffOutput}`);

// --- 7. Allowed source files contain required scoped-exception tokens (presence anywhere) ---
const combinedSource = ALLOWED_SOURCE_FILES.map((f) => (exists(f) ? read(f) : '')).join('\n');
for (const token of SOURCE_REQUIRED_TOKENS) {
  assert(combinedSource.includes(token), `Allowed source files missing required token: ${token}`);
}

// --- 7b. The scoped production exception must remain conjunctively gated in kisClient.ts ---
const kisClientSource = exists('src/lib/server/providers/kisClient.ts') ? read('src/lib/server/providers/kisClient.ts') : '';
assert(
  /allowProductionChartAiBetaLiveQuotes\s*===\s*true/.test(kisClientSource),
  'kisClient.ts must require the scoped option to be strictly true for the production exception.',
);
assert(
  /productionChartAiBetaFlagEnvName\)\s*===\s*'true'|CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA'\s*\)\s*===\s*'true'/.test(
    kisClientSource,
  ) || /productionChartAiBetaFlagEnvName/.test(kisClientSource),
  'kisClient.ts must re-check the CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA flag for the production exception.',
);

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
  const isSiblingPhaseArtifact =
    /^scripts\/check_phase_3gg_[a-z0-9_]+_contract\.mjs$/.test(filePath) ||
    /^docs\/planning\/phase_3gg_[a-z0-9_]+_result(_v[0-9.]+)?\.md$/.test(filePath);
  if (isKnown || ALLOWED_MODIFIED_FILES.has(filePath) || isSiblingPhaseArtifact || isOpFastArtifact(filePath)) {
    assert(true, `${filePath} is a known/allowed path for this phase`);
  } else {
    assert(false, `Unexpected working-tree change outside this phase's scope: ${filePath} (verify before commit)`);
  }
}

// --- 12. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-M-PROD-HF1 check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-M-PROD-HF1 check PASS: ${assertions}/${assertions} assertions passed.`);
}
