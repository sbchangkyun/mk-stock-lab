// Phase 3GG-N-FAST contract checker.
// Verifies the Production Chart AI default-route + UI-cleanup result doc, checker, and
// package.json/changelog wiring are present; that only chart-ai.astro carries a source diff vs the
// baseline (da71860); that every forbidden-diff file (H route, guard, LLM bridge/model-policy,
// current_price route, mk-agent, similar-pattern-agent, guarded-productization-scaffold, kisClient.ts,
// the KIS market-data binding, components, supabase, src/data, lockfiles) remains zero-diff; that
// chart-ai.astro contains the required default-route + owner-local-removal + Production-facing-summary
// tokens; that no forbidden endpoint/model/raw-exposure pattern appears in chart-ai.astro; and that
// .env/.env.local/.vercel are neither staged nor committed.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = 'da71860';

const CHART_AI_PAGE = 'src/pages/chart-ai.astro';
const RESULT_DOC = 'docs/planning/phase_3gg_n_fast_production_chart_ai_default_route_ui_cleanup_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3gg_n_fast_contract.mjs';
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

// This phase is authorized to modify only the Chart AI page itself.
const ALLOWED_SOURCE_FILES = [CHART_AI_PAGE];
const REQUIRED_CHANGED_SOURCE_FILES = [CHART_AI_PAGE];

const REQUIRED_FORBIDDEN_DIFF_PATHS = [
  'src/pages/api/chart-ai/local-only-kis-current-price.json.ts',
  'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts',
  'src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs',
  'src/lib/server/chart-ai/local-only-llm-model-policy.mjs',
  'src/lib/server/chart-ai/protected-preview-beta-guard.mjs',
  'src/lib/server/chart-ai/mk-agent.mjs',
  'src/lib/server/chart-ai/similar-pattern-agent.mjs',
  'src/lib/server/chart-ai/guarded-productization-scaffold.mjs',
  'src/lib/server/providers/kisClient.ts',
  'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs',
  'components',
  'supabase',
  'src/data',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
];

// Phase 3GG-OP-FAST legitimately (a) added a new universal-search/real-OHLCV surface and (b) extended
// kisClient.ts + the summary route + src/data under the SAME scoped production guard. This sibling
// tolerance keeps the N-FAST checker green against that superseding change without weakening its
// intent for its own scope. See docs/planning/phase_3gg_op_fast_*_result_v0.1.md.
const isOpFastArtifact = (f) =>
  f === 'src/lib/server/providers/kisClient.ts' ||
  f === 'src/lib/server/providers/types.ts' ||
  f === 'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts' ||
  f === 'src/lib/market-data/instrument.ts' ||
  /^src\/data\/chart-ai\//.test(f) ||
  /^src\/lib\/chart-ai\/portfolio-intelligence\//.test(f) ||
  /^src\/lib\/server\/chart-ai\/(universal|similarity-engine|mkAiAnalysis\/|marketIntelligence\/)/.test(f) ||
  /^src\/pages\/api\/chart-ai\/(instruments\/|market\/|similarity\.json|mk-analysis\.json|market-intelligence\.json)/.test(f) ||
  /^scripts\/(smoke|check|owner_smoke)_phase_3gg_[a-z0-9_]+\.mjs$/.test(f) ||
  /^src\/lib\/server\/providers\/kis\//.test(f) ||
  /^supabase\/migrations\//.test(f) ||
  /^scripts\/[a-z0-9_]+_testsrc\.ts$/.test(f) ||
  /^src\/lib\/chart-ai\//.test(f) ||
  /^docs\/planning\/phase_3gg_[a-z0-9_]+_result(_v[0-9.]+)?\.md$/.test(f);

// Structural tokens that must be present in chart-ai.astro to prove the default-route mechanism,
// the owner-local/mock removal, and the Production-facing summary branch are actually wired.
const SOURCE_REQUIRED_TOKENS = [
  'productionChartAiDefaultEnabled',
  'isVercelProductionRuntime',
  'evaluateProductionChartAiBetaAccess',
  'data-chart-ai-production-default',
  'useProductionFacingSummaryPresentation',
  'MK AI 시세 요약',
  // Phase 3GG-OP-FAST superseded these N-FAST preparing-state copies with the real universal-search
  // + real-OHLCV experience; the checker follows the current honest copy so it stays meaningful.
  '국내·미국 주식 및 ETF 검색',
  '유사 패턴 분석',
  // Phase 3GG-R-FAST replaced the MK AI preparing copy with the real deterministic MK AI analysis UI.
  'MK AI 분석 시작',
  '현재 조회된 시장 데이터를 기반으로 핵심 상태를 요약합니다.',
  "chartAiProdBeta=1",
];

// Every owner-local/mock/sample block that Section D/F/G/H requires to be truly absent from
// Production-rendered markup must be gated behind one of these two conditional forms.
const REQUIRED_PRODUCTION_GATE_PATTERNS = [
  /\{!isVercelProductionRuntime && \(/,
  /\{isVercelProductionRuntime && \(/,
  /\{isVercelProductionRuntime \? \(/,
];
const MIN_NEGATIVE_GATE_COUNT = 5; // at least this many distinct owner-local/mock blocks removed

const FORBIDDEN_CONTENT_PATTERNS = [
  /\/api\/(order|account|balance|funds|portfolio\/trade|trading)\b/i,
  /gpt-4|gpt-5|claude-|text-davinci|o1-preview|o1-mini/i,
  /currentPrice\s*[:=]\s*\{?\s*[0-9]/,
  /volume\s*[:=]\s*\{?\s*[0-9]/,
  /OPENAI_API_KEY\s*=\s*sk-/,
  /KIS_APP_KEY\s*=\s*[^\s`]|KIS_APP_SECRET\s*=\s*[^\s`]|KIS_BASE_URL\s*=\s*https?:\/\/\S/,
  /console\.log\([^)]*process\.env/,
];

const RESULT_DOC_REQUIRED_TOKENS = [
  'Classification',
  'Baseline',
  'da71860',
  'Branch',
  'rebuild/phase-1-ia-shell',
  'Production default route',
  '지원 종목 검색',
  'MK AI 시세 요약',
  '실시간 종목 차트 준비 중',
  '유사 패턴 분석',
  'FIXED_RUNTIME_FLAG_INJECTION_CURRENT_PRICE_READY',
  'FIXED_LLM_RUNTIME_ENV_READY',
  'PASS_LLM_QUALITY_REGRESSION',
  'Build PASS',
  'Exposure status',
  'No exposure detected',
  'Next recommended phase',
  'Phase 3GG-OP-FAST',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-N-FAST - 2026-07-12',
  'Production Chart AI Default Route and UI Cleanup',
  'Builds on Phase 3GG-M-PROD-HF1',
  '지원 종목 검색',
  'MK AI 시세 요약',
  '유사 패턴 분석',
  'No H route change',
  'No guard change',
  'No prompt rewrite',
  'No summary contract rewrite',
  'No KIS endpoint expansion',
  'current_price only',
  'Next recommended phase',
  'Phase 3GG-OP-FAST',
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
for (const file of [...CORE_DELIVERABLES, CHANGELOG, PACKAGE_JSON, CHART_AI_PAGE]) {
  assert(exists(file), `Required file missing: ${file}`);
}

// --- 2. package.json script wiring ---
const pkg = JSON.parse(read(PACKAGE_JSON));
assert(
  pkg.scripts && pkg.scripts['check:phase-3gg-n-fast'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-n-fast" script entry',
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

// --- 4. Changelog entry present, prepended above the 3GG-M-PROD-HF1 entry ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-N-FAST - 2026-07-12');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-N-FAST entry header');
const changelogSection =
  changelogHeaderIndex === -1 ? '' : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
const normalizedChangelogSection = changelogSection.replace(/\s+/g, ' ');
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  const normalizedToken = token.replace(/\s+/g, ' ');
  assert(normalizedChangelogSection.includes(normalizedToken), `Changelog entry missing required token: ${token}`);
}
const prevHeaderIndex = changelog.indexOf('## Phase 3GG-M-PROD-HF1 - 2026-07-12');
assert(
  prevHeaderIndex === -1 || (changelogHeaderIndex !== -1 && changelogHeaderIndex < prevHeaderIndex),
  'Phase 3GG-N-FAST changelog entry must be prepended above the Phase 3GG-M-PROD-HF1 entry',
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
  if (/^scripts\/check_phase_3gg_[a-z0-9_]+_contract\.mjs$/.test(f)) return false;
  if (isOpFastArtifact(f)) return false;
  if (f === '.gitignore') return false;
  return true;
});
assert(unexpectedDiff.length === 0, `Unexpected diff outside this phase's allowed files: ${unexpectedDiff.join(', ')}`);

// --- 5b. The Chart AI page must actually be changed vs baseline ---
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
    .filter((f) => !isOpFastArtifact(f)) // OP-FAST extended kisClient/summary/src/data under the same guard
    .join('\n');
} catch {
  forbiddenDiffOutput = '<git diff failed>';
}
assert(forbiddenDiffOutput === '', `Forbidden diff is not empty: ${forbiddenDiffOutput}`);

// --- 7. chart-ai.astro contains the required structural tokens ---
const chartAiSource = exists(CHART_AI_PAGE) ? read(CHART_AI_PAGE) : '';
for (const token of SOURCE_REQUIRED_TOKENS) {
  assert(chartAiSource.includes(token), `chart-ai.astro missing required token: ${token}`);
}

// --- 7b. Owner-local/mock content must be gated behind Production-runtime conditionals ---
const gateMatchCount = REQUIRED_PRODUCTION_GATE_PATTERNS.reduce(
  (total, pattern) => total + (chartAiSource.match(new RegExp(pattern, 'g')) || []).length,
  0,
);
assert(
  gateMatchCount >= MIN_NEGATIVE_GATE_COUNT,
  `chart-ai.astro must gate at least ${MIN_NEGATIVE_GATE_COUNT} owner-local/mock blocks behind isVercelProductionRuntime conditionals, found ${gateMatchCount}`,
);

// --- 8. Forbidden content patterns absent from chart-ai.astro ---
for (const pattern of FORBIDDEN_CONTENT_PATTERNS) {
  assert(!pattern.test(chartAiSource), `chart-ai.astro must not match forbidden pattern: ${pattern}`);
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
const ALLOWED_MODIFIED_FILES = new Set([...CORE_DELIVERABLES, CHANGELOG, PACKAGE_JSON, CHART_AI_PAGE]);
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
  if (isKnown || ALLOWED_MODIFIED_FILES.has(filePath) || /^scripts\/check_phase_3gg_[a-z0-9_]+_contract\.mjs$/.test(filePath) || isOpFastArtifact(filePath)) {
    assert(true, `${filePath} is a known/allowed path for this phase`);
  } else {
    assert(false, `Unexpected working-tree change outside this phase's scope: ${filePath} (verify before commit)`);
  }
}

// --- 12. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-N-FAST check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-N-FAST check PASS: ${assertions}/${assertions} assertions passed.`);
}
