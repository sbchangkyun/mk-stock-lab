// Phase 3GG-L-BETA-ACTIVATE contract checker.
// Verifies the beta-activation result doc and package.json/changelog wiring are present; that the
// source diff is limited to the three allowed files (chart-ai.astro, the LLM summary H route, and the
// optional protected-preview-beta guard module) with no forbidden source diff and no lockfile diff;
// that the beta activation is fail-closed by construction (Preview-only, owner-flag-gated, explicit
// query opt-in, production fail-closed) while the localhost owner path is preserved; that no forbidden
// endpoint / prompt rewrite / model-name / numeric rendering was introduced; and that .env/.env.local/
// .vercel are neither staged nor committed. Diff checks are measured against the Phase 3GG-L-FAST
// baseline (6892478).

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '6892478';

const RESULT_DOC = 'docs/planning/phase_3gg_l_beta_activate_protected_preview_chart_ai_beta_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3gg_l_beta_activate_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CHART_AI_ASTRO = 'src/pages/chart-ai.astro';
const LLM_SUMMARY_ROUTE = 'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts';
const BETA_GUARD = 'src/lib/server/chart-ai/protected-preview-beta-guard.mjs';
const BINDING_MODULE = 'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs';

const ALLOWED_SOURCE_FILES = [CHART_AI_ASTRO, LLM_SUMMARY_ROUTE, BETA_GUARD];

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
];

// Source files that must remain zero-diff vs the baseline this phase.
const REQUIRED_FORBIDDEN_DIFF_SOURCE_FILES = [
  'src/lib/server/providers/kisClient.ts',
  'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs',
  'src/pages/api/chart-ai/local-only-kis-current-price.json.ts',
  'src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs',
  'src/lib/server/chart-ai/local-only-llm-model-policy.mjs',
  'src/lib/server/chart-ai/mk-agent.mjs',
  'src/lib/server/chart-ai/similar-pattern-agent.mjs',
  'src/lib/server/chart-ai/guarded-productization-scaffold.mjs',
];

const REQUIRED_FORBIDDEN_DIFF_PATHS = [
  ...REQUIRED_FORBIDDEN_DIFF_SOURCE_FILES,
  'components',
  'supabase',
  'src/data',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
];

const RESULT_DOC_REQUIRED_TOKENS = [
  'PASS_SOURCE_READY_OWNER_VERCEL_ACTION_REQUIRED',
  'Protected Preview',
  'Deployment Protection',
  'Preview env name presence',
  'production deploy',
  'Not pushed',
  'no exposure',
  'current_price only',
  'H route only',
  'localhost owner flow preserved',
  'CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA',
  'chartAiBetaPreview=1',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-L-BETA-ACTIVATE - 2026-07-11',
  'Protected Preview-only Chart AI Beta Activation',
  'Builds on Phase 3GG-L-FAST',
  'L-FAST regression harness passed',
  'Activates real KIS + LLM Chart AI only for protected Vercel Preview beta',
  'Preserves localhost owner flow',
  'chartAiBetaPreview=1',
  'CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA=true',
  'VERCEL_ENV=preview',
  'Production remains fail-closed',
  'No production deploy',
  'No public activation',
  'No push',
  'No KIS endpoint expansion',
  'current_price only',
  'No prompt rewrite',
  'No model name exposure',
  'Deployment Protection must be verified before sharing the Preview URL',
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

function stripLineComments(src) {
  return src
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
}

// --- 1. Required files exist ---
for (const file of [RESULT_DOC, CHECKER_SELF, CHANGELOG, PACKAGE_JSON, CHART_AI_ASTRO, LLM_SUMMARY_ROUTE, BETA_GUARD]) {
  assert(exists(file), `Required file missing: ${file}`);
}

// --- 2. package.json script wiring ---
const pkg = JSON.parse(read(PACKAGE_JSON));
assert(
  pkg.scripts && pkg.scripts['check:phase-3gg-l-beta-activate'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-l-beta-activate" script entry',
);

// --- 3. Source content: fail-closed protected-preview-beta activation present ---
const guardSrc = exists(BETA_GUARD) ? read(BETA_GUARD) : '';
const routeSrc = exists(LLM_SUMMARY_ROUTE) ? read(LLM_SUMMARY_ROUTE) : '';
const astroSrc = exists(CHART_AI_ASTRO) ? read(CHART_AI_ASTRO) : '';
const combinedSource = `${guardSrc}\n${routeSrc}\n${astroSrc}`;

assert(combinedSource.includes('CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA'), 'Source must reference the CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA flag.');
assert(combinedSource.includes('chartAiBetaPreview'), 'Source must reference the chartAiBetaPreview beta opt-in query.');
assert(/chartAiBetaPreview'?\)\s*===\s*'1'/.test(combinedSource), 'Source must gate on the exact chartAiBetaPreview=1 opt-in value.');
assert(/VERCEL_ENV/.test(guardSrc) && /'preview'/.test(guardSrc), 'Beta guard must check VERCEL_ENV against preview.');
assert(/production_fail_closed|=== 'production'/.test(guardSrc), 'Beta guard must fail closed on production.');
// Localhost owner path preserved.
assert(/ownerLocalKisLlm'?\)\s*===\s*'1'/.test(routeSrc), 'H route must still gate the localhost owner path on ownerLocalKisLlm=1.');
assert(routeSrc.includes('resolveLocalHostname'), 'H route must still resolve/require a local hostname for the owner path.');
assert(routeSrc.includes("category: 'current_price'"), 'H route must still fix the market-data category to current_price.');

// --- 4. Source must NOT introduce forbidden endpoints / prompt rewrite / model-name or numeric rendering ---
const combinedCodeOnly = stripLineComments(combinedSource);
// KIS-endpoint-expansion scan is scoped to the server KIS/LLM code (guard + H route) only; the page
// file (chart-ai.astro) legitimately contains unrelated app nav links such as `/portfolio` that are
// not KIS endpoints and predate this phase.
const serverKisLlmCodeOnly = stripLineComments(`${guardSrc}\n${routeSrc}`);
assert(
  !/\/order\b|\/account\b|\/balance\b|\/funds\b|\/portfolio\b|\/trading\b|\/personal\b/i.test(serverKisLlmCodeOnly),
  'Server KIS/LLM source must not reference an order/account/balance/funds/portfolio/trading/personal endpoint.',
);
assert(!/systemPrompt\s*[:=]\s*["'`]|userPrompt\s*[:=]\s*["'`]/.test(combinedCodeOnly), 'Source must not embed a prompt literal (no prompt rewrite).');
assert(!/\bmodelName\b/.test(combinedCodeOnly), 'Source must not introduce raw model-name handling/rendering.');
// The route must keep returning the bridge summary verbatim -- it must not inject a raw model field or numeric.
assert(!/summary\.(currentPrice|volume)\b/.test(routeSrc), 'H route must not read/render a raw currentPrice/volume numeric.');

// --- 5. Result doc required content ---
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

// --- 6. Changelog entry present, prepended above the L-FAST entry ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-L-BETA-ACTIVATE - 2026-07-11');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-L-BETA-ACTIVATE entry header');
const changelogSection =
  changelogHeaderIndex === -1 ? '' : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
const lfastHeaderIndex = changelog.indexOf('## Phase 3GG-L-FAST - 2026-07-11');
assert(
  lfastHeaderIndex === -1 || (changelogHeaderIndex !== -1 && changelogHeaderIndex < lfastHeaderIndex),
  'Phase 3GG-L-BETA-ACTIVATE changelog entry must be prepended above the Phase 3GG-L-FAST entry',
);

// --- 7. Source diff is limited to the allowed files ---
let sourceDiffLines = [];
try {
  sourceDiffLines = runGit(['diff', '--name-only', BASELINE, '--', 'src'])
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
} catch {
  sourceDiffLines = ['<git diff failed>'];
}
for (const changed of sourceDiffLines) {
  assert(ALLOWED_SOURCE_FILES.includes(changed), `Source diff must be limited to allowed files; unexpected: ${changed}`);
}

// --- 8. No forbidden source diff / no lockfile diff ---
let forbiddenDiffOutput = '';
try {
  forbiddenDiffOutput = runGit(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]).trim();
} catch {
  forbiddenDiffOutput = '<git diff failed>';
}
assert(forbiddenDiffOutput === '', `Forbidden diff is not empty: ${forbiddenDiffOutput}`);

// The market-data binding (current_price-only allowlist) must remain unchanged.
const bindingSrc = exists(BINDING_MODULE) ? read(BINDING_MODULE) : '';
assert(
  bindingSrc.includes("ALLOWED_ENDPOINT_CATEGORIES = Object.freeze(['current_price'])"),
  'Binding must still allow current_price as the only KIS market-data endpoint category.',
);

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

// --- 10. No unexpected working-tree changes outside this phase's scope ---
const ALLOWED_MODIFIED_FILES = new Set([
  RESULT_DOC,
  CHECKER_SELF,
  CHANGELOG,
  PACKAGE_JSON,
  ...ALLOWED_SOURCE_FILES,
  // Phase 3GG-L-BETA-ACTIVATE sibling checker-compatibility tolerance (documented): L-FAST's checker
  // guarded chart-ai.astro / the LLM summary route as zero-diff; that sibling checker needed a small,
  // documented patch to exclude those two files (authorized here) and tolerate this phase's new files.
  'scripts/check_phase_3gg_l_fast_contract.mjs',
  // Phase 3GG-L-BETA-DEPLOY checker-compatibility tolerance (documented): that deploy-execution phase
  // adds its own new result doc + checker; tolerate their presence in this checker's working-tree scan.
  'docs/planning/phase_3gg_l_beta_deploy_protected_preview_beta_deploy_result_v0.1.md',
  'scripts/check_phase_3gg_l_beta_deploy_contract.mjs',
  // Phase 3GG-L-BETA-DEPLOY-RERUN checker-compatibility tolerance (documented): the rerun phase adds
  // its own new result doc + checker (and patches sibling checkers); tolerate them here too.
  'docs/planning/phase_3gg_l_beta_deploy_rerun_protected_preview_beta_deploy_result_v0.1.md',
  'scripts/check_phase_3gg_l_beta_deploy_rerun_contract.mjs',
  'scripts/check_phase_3gg_l_beta_deploy_contract.mjs',
  // Phase 3GG-L-BETA-DEPLOY-RERUN-2 checker-compatibility tolerance (documented): the rerun-2 phase
  // adds its own new result doc + checker (and patches sibling checkers); tolerate them here too.
  'docs/planning/phase_3gg_l_beta_deploy_rerun_2_protected_preview_beta_deploy_result_v0.1.md',
  'scripts/check_phase_3gg_l_beta_deploy_rerun_2_contract.mjs',
  // Phase 3GG-L-BETA-DEPLOY-RERUN-3 checker-compatibility tolerance (documented): the rerun-3 phase
  // adds its own new result doc + checker; tolerate them here too.
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
    // Phase 3GG-L-BETA-DEPLOY-RERUN-2 tolerance (documented): `vercel link` appended a `.env*` line to
    // .gitignore, left unstaged/uncommitted; tolerate it here as unstaged only, same as .env/.vercel.
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

// --- 11. No production-deploy marker in the result doc ---
{
  const src = exists(RESULT_DOC) ? read(RESULT_DOC) : '';
  assert(!/vercel\s+--prod|deploy\s+--prod|vercel\s+promote|promote to production\b(?!\.)/i.test(src.replace(/No promote to production/gi, '')), `${RESULT_DOC} must not contain a production-deploy command marker.`);
}

// --- 12. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-L-BETA-ACTIVATE check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-L-BETA-ACTIVATE check PASS: ${assertions}/${assertions} assertions passed.`);
}
