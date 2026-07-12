// Phase 3GG-L-FAST contract checker (Lane A).
// Verifies the L-FAST regression-harness result doc, the harness script, and package.json/changelog
// wiring are present; that the harness is safe (owner-approval gated, never reads .env/.env.local,
// never prints raw summary text / model name / prompt / raw OpenAI request-response / raw KIS payload
// / currentPrice-volume numeric, never references an order/account/balance/funds/portfolio/trading/
// personal endpoint); that this phase introduces NO source diff, no lockfile diff, and neither stages
// nor commits .env/.env.local/.vercel, measured against the Phase 3GG-K-QA-OWNER-RERUN-3 baseline
// (7669123).
//
// Like the HF4/HF5/HF6 checkers, this checker isolates the harness's *print* call sites and asserts
// only those never interpolate a raw summary/response/model/numeric value, and asserts the printed
// `report` object literal is built exclusively from the allowed sanitized field list.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '7669123';

const HARNESS_SCRIPT = 'scripts/owner_regression_phase_3gg_l_fast_llm_quality_harness.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_l_fast_owner_local_llm_quality_regression_harness_result_v0.1.md';
const DEPLOY_DOC = 'docs/planning/phase_3gg_l_fast_vercel_preview_beta_deploy_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3gg_l_fast_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [RESULT_DOC, HARNESS_SCRIPT, CHECKER_SELF];

const OWNER_APPROVAL_FLAG = '--owner-approved-llm-quality-regression';

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
];

// This is a harness/QA-only phase: every source file below must remain zero-diff vs the baseline.
// Phase 3GG-L-BETA-ACTIVATE checker-compatibility tolerance (documented): the LLM summary H route and
// chart-ai.astro are intentionally excluded from L-FAST's zero-diff assertion because that phase is
// explicitly authorized to add the protected-preview-beta activation to those two files. Every other
// source file below remains protected by L-FAST's zero-diff guard.
const REQUIRED_FORBIDDEN_DIFF_SOURCE_FILES = [
  // kisClient.ts + local-only-live-kis-market-data-binding.mjs removed here: Phase 3GG-M-PROD-HF1 is a
  // later, separately-authorized phase allowed to modify them for the scoped production KIS exception
  // (documented tolerance, same convention already applied for this checker's other later siblings).
  'src/pages/api/chart-ai/local-only-kis-current-price.json.ts',
  'src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs',
  'src/lib/server/chart-ai/local-only-llm-model-policy.mjs',
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

// Phase 3GG-OP-FAST tolerance: OP-FAST added a universal-search/real-OHLCV surface and extended
// kisClient.ts + summary route + src/data under the SAME scoped production guard (documented sibling
// tolerance, same convention as this checker's other later siblings).
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

const ALLOWED_REPORT_FIELDS = [
  'runCount',
  'passCount',
  'failCount',
  'hRouteReachable',
  'hRouteHttpStatusClass',
  'summaryOk',
  'sourceStatus',
  'llmStatus',
  'sanitizedErrorCode',
  'currentPricePresent',
  'volumePresent',
  'summaryTextPresent',
  'summaryLineCount',
  'requiredLabelsPresent',
  'asciiDigitPresentInSummary',
  'forbiddenInvestmentPhrasePresent',
  'exposureDetected',
  'finalClassification',
];

const FORBIDDEN_PRINT_INTERPOLATION_PATTERNS = [
  /\$\{process\.env/,
  /\$\{summaryText\}/,
  /\$\{summary\}/,
  /\$\{summary\./,
  /\$\{results\}/,
  /\$\{last\}/,
  /\$\{last\.summaryText\}/,
  /\$\{r\.summaryText\}/,
  /\$\{rawText\}/,
  /\$\{parsed\}/,
  /\$\{parsed\./,
  /OPENAI_API_KEY/,
  /Bearer\s+\$\{/,
];

const RESULT_DOC_REQUIRED_TOKENS = [
  'PASS_LLM_QUALITY_REGRESSION',
  'summaryOk',
  'sourceStatus',
  'llmStatus',
  'currentPricePresent',
  'volumePresent',
  'summaryTextPresent',
  'Exactly 3 Korean bullet lines',
  '데이터 상태:',
  '해석 범위:',
  '유의사항:',
  'ASCII digit present: false',
  'Forbidden investment phrase present: false',
  'No exposure detected',
  'current_price only',
  'H route only',
  'Not pushed',
  'Not deployed before',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-L-FAST - 2026-07-11',
  'Owner-local LLM Quality Regression Harness',
  'Builds on Phase 3GG-K-QA-OWNER-RERUN-3',
  'The browser success path is already verified',
  'Adds a repeatable owner-local LLM quality regression harness',
  'Verifies summary.ok=true',
  'Verifies sourceStatus=ok and llmStatus=ok',
  '데이터 상태:',
  '해석 범위:',
  '유의사항:',
  'no ASCII digits',
  'no forbidden investment-advice phrasing',
  'no credential/OpenAI key/raw KIS/raw OpenAI/prompt/model/currentPrice numeric/volume numeric exposure',
  'No source feature changes',
  'No KIS provider change',
  'No UI change',
  'No H route change',
  'No LLM bridge change',
  'No model policy change',
  'No prompt rewrite',
  'No KIS endpoint expansion',
  'current_price only',
  'No production deployment',
  'No push',
  'Protected Vercel Preview beta deploy is the next lane',
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
  pkg.scripts && pkg.scripts['owner-regression:phase-3gg-l-fast'] === `node ${HARNESS_SCRIPT}`,
  'package.json is missing the exact "owner-regression:phase-3gg-l-fast" script entry',
);
assert(
  pkg.scripts && pkg.scripts['check:phase-3gg-l-fast'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-l-fast" script entry',
);

// --- 3. Harness safety checks ---
const harnessSrc = exists(HARNESS_SCRIPT) ? read(HARNESS_SCRIPT) : '';

assert(harnessSrc.includes(OWNER_APPROVAL_FLAG), 'Harness must require the explicit owner-approval CLI flag.');
assert(!/readFileSync\(.*\.env/.test(harnessSrc), 'Harness must not read .env/.env.local directly.');
assert(!/['"]\.env(\.local)?['"]/.test(harnessSrc), 'Harness must not reference a .env/.env.local file path.');
assert(!/(console\.log|logSanitized)\([^)]*process\.env/.test(harnessSrc), 'Harness must not print a process.env value directly.');

const printCallBodies = [...harnessSrc.matchAll(/(?:logSanitized|console\.log)\(([\s\S]*?)\);/g)].map((m) => m[1]);
assert(printCallBodies.length > 0, 'Harness must contain at least one sanitized print call.');
for (const body of printCallBodies) {
  for (const pattern of FORBIDDEN_PRINT_INTERPOLATION_PATTERNS) {
    assert(!pattern.test(body), `Harness print call must not interpolate a forbidden raw value: ${pattern}`);
  }
}

const reportLiteralMatch = harnessSrc.match(/const report = \{([\s\S]*?)\};/);
assert(reportLiteralMatch !== null, 'Harness must define a single sanitized `report` object literal.');
if (reportLiteralMatch) {
  const reportFieldNames = reportLiteralMatch[1]
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split(':')[0].replace(/,\s*$/, '').trim())
    .filter((n) => /^[a-zA-Z]/.test(n));
  for (const field of reportFieldNames) {
    assert(ALLOWED_REPORT_FIELDS.includes(field), `report object contains a field not in the allowed printed-field list: ${field}`);
  }
}

const harnessCodeOnly = harnessSrc
  .split('\n')
  .filter((line) => !line.trim().startsWith('//'))
  .join('\n');
assert(
  !/\/order\b|\/account\b|\/balance\b|\/funds\b|\/portfolio\b|\/trading\b|\/personal\b/i.test(harnessCodeOnly),
  'Harness must never reference an order/account/balance/funds/portfolio/trading/personal endpoint.',
);
assert(!/api\.openai\.com|\/v1\/chat\/completions|\/v1\/responses/i.test(harnessCodeOnly), 'Harness must not call OpenAI directly.');
assert(!/oauth2\/tokenP|inquire-price/i.test(harnessCodeOnly), 'Harness must not call KIS directly.');
assert(harnessSrc.includes('/api/chart-ai/local-only-kis-llm-summary.json'), 'Harness must probe only the existing owner-local LLM summary H route.');

// --- 4. Result doc required content ---
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

// --- 5. Changelog entry present, prepended above the K-QA-OWNER-RERUN-3 entry ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-L-FAST - 2026-07-11');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-L-FAST entry header');
const changelogSection =
  changelogHeaderIndex === -1 ? '' : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
const rerun3HeaderIndex = changelog.indexOf('## Phase 3GG-K-QA-OWNER-RERUN-3 - 2026-07-11');
assert(
  rerun3HeaderIndex === -1 || (changelogHeaderIndex !== -1 && changelogHeaderIndex < rerun3HeaderIndex),
  'Phase 3GG-L-FAST changelog entry must be prepended above the Phase 3GG-K-QA-OWNER-RERUN-3 entry',
);

// --- 6. No source feature diff ---
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

// --- 9. No unexpected working-tree changes outside this phase's scope ---
const ALLOWED_MODIFIED_FILES = new Set([
  ...CORE_DELIVERABLES,
  DEPLOY_DOC,
  CHANGELOG,
  PACKAGE_JSON,
  // Phase 3GG-L-FAST sibling checker-compatibility tolerance (documented per this phase's work
  // order): RERUN-3's checker needed a small, documented ALLOWED_MODIFIED_FILES patch to tolerate
  // this phase's new files. Allow that sibling patch here too.
  'scripts/check_phase_3gg_k_qa_owner_rerun_3_contract.mjs',
  // Phase 3GG-L-BETA-ACTIVATE checker-compatibility tolerance (documented): that phase adds the
  // protected-preview-beta guard + activation to chart-ai.astro and the LLM summary route (both
  // authorized there and excluded from L-FAST's zero-diff list above), plus its own new deliverables;
  // tolerate their presence in L-FAST's working-tree-purity scan.
  'src/pages/chart-ai.astro',
  'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts',
  'src/lib/server/chart-ai/protected-preview-beta-guard.mjs',
  'scripts/check_phase_3gg_l_beta_activate_contract.mjs',
  'docs/planning/phase_3gg_l_beta_activate_protected_preview_chart_ai_beta_result_v0.1.md',
  // Phase 3GG-L-BETA-DEPLOY checker-compatibility tolerance (documented): the deploy-execution phase
  // adds its own new result doc + checker (and patches the BETA-ACTIVATE sibling checker); tolerate
  // their presence in L-FAST's working-tree scan.
  'docs/planning/phase_3gg_l_beta_deploy_protected_preview_beta_deploy_result_v0.1.md',
  'scripts/check_phase_3gg_l_beta_deploy_contract.mjs',
  // Phase 3GG-L-BETA-DEPLOY-RERUN checker-compatibility tolerance (documented): the rerun phase adds
  // its own new result doc + checker (and patches sibling checkers); tolerate them in this scan too.
  'docs/planning/phase_3gg_l_beta_deploy_rerun_protected_preview_beta_deploy_result_v0.1.md',
  'scripts/check_phase_3gg_l_beta_deploy_rerun_contract.mjs',
  // Phase 3GG-L-BETA-DEPLOY-RERUN-2 checker-compatibility tolerance (documented): the rerun-2 phase
  // adds its own new result doc + checker (and patches sibling checkers); tolerate them in this scan too.
  'docs/planning/phase_3gg_l_beta_deploy_rerun_2_protected_preview_beta_deploy_result_v0.1.md',
  'scripts/check_phase_3gg_l_beta_deploy_rerun_2_contract.mjs',
  // Phase 3GG-L-BETA-DEPLOY-RERUN-3 checker-compatibility tolerance (documented): the rerun-3 phase
  // adds its own new result doc + checker; tolerate them in this scan too.
  'docs/planning/phase_3gg_l_beta_deploy_rerun_3_protected_preview_beta_deploy_result_v0.1.md',
  'scripts/check_phase_3gg_l_beta_deploy_rerun_3_contract.mjs',
  // Phase 3GG-M-PROD-BETA-DEPLOY checker-compatibility tolerance (documented): that later phase adds
  // its own new result doc + checker, modifies the 3 production-beta-guard source files (already
  // excluded from L-FAST's zero-diff list above), and patches sibling checkers; tolerate them here too.
  'docs/planning/phase_3gg_m_prod_beta_deploy_production_url_chart_ai_beta_result_v0.1.md',
  'scripts/check_phase_3gg_m_prod_beta_deploy_contract.mjs',
  'scripts/check_phase_3gg_l_beta_deploy_rerun_2_contract.mjs',
  // Phase 3GG-M-PROD-HF1 checker-compatibility tolerance (documented): that later phase adds its own
  // new result doc + checker, modifies kisClient.ts + the market-data binding for the scoped production
  // KIS exception (both now excluded from L-FAST's zero-diff list above), and patches sibling checkers.
  'docs/planning/phase_3gg_m_prod_hf1_guarded_production_kis_live_quotes_result_v0.1.md',
  'scripts/check_phase_3gg_m_prod_hf1_contract.mjs',
  'src/lib/server/providers/kisClient.ts',
  'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs',
  'src/lib/server/chart-ai/protected-preview-beta-guard.mjs',
  'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts',
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
    // Phase 3GG-L-BETA-DEPLOY-RERUN-2 tolerance (documented): `vercel link` appended a `.env*` line to
    // .gitignore, left unstaged/uncommitted; tolerate it here as unstaged only, same as .env/.vercel.
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

// --- 10. No production-deploy marker in the harness result doc ---
{
  const src = exists(RESULT_DOC) ? read(RESULT_DOC) : '';
  assert(!/--prod\b|vercel\s+--prod|deploy\s+--prod|promote to production/i.test(src), `${RESULT_DOC} must not contain a production-deploy marker.`);
}

// --- 11. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-L-FAST check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-L-FAST check PASS: ${assertions}/${assertions} assertions passed.`);
}
