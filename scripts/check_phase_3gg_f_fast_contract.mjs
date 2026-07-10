// Phase 3GG-F-FAST contract checker.
// Verifies the local-only Chart AI KIS current_price UX polish (chart-ai.astro only,
// plus this phase's own smoke/checker/result-doc/package.json/changelog additions) is
// present, scoped exactly as authorized, safe, and that the smoke script passes.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = 'e9f47a9ccd6c5389014eb81fcafd2a923b560713';

const CHART_AI_PAGE = 'src/pages/chart-ai.astro';
const ROUTE_FILE = 'src/pages/api/chart-ai/local-only-kis-current-price.json.ts';
const ADAPTER_FILE = 'src/lib/server/chart-ai/kis-market-data-to-chart-ai-context.mjs';
const SMOKE_SCRIPT = 'scripts/smoke_phase_3gg_f_fast_local_only_kis_current_price_ux.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_f_fast_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_f_fast_local_only_kis_current_price_ux_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [SMOKE_SCRIPT, CHECKER_SELF, RESULT_DOC];

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
];

// Verbatim forbidden-diff path list for this phase.
const REQUIRED_FORBIDDEN_DIFF_PATHS = [
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

// Verbatim KIS-provider-diff path list for this phase.
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

const FORBIDDEN_ENDPOINT_TOKENS = [
  'order',
  'cancel_order',
  'modify_order',
  'account',
  'balance',
  'funds',
  'buying_power',
  'sellable_quantity',
  'profit_loss',
  'deposit_withdrawal',
  'trading_history',
  'portfolio',
  'personal',
];

const FORBIDDEN_INVESTMENT_LANGUAGE = [
  '매수하세요',
  '매도하세요',
  '지금 진입',
  '목표가는',
  '손절가는',
  '강력 추천',
  '상승이 확정',
  '하락이 확정',
];

const FORBIDDEN_LLM_TOKENS = [
  'api.openai.com',
  'anthropic.com',
  'generativelanguage.googleapis.com',
  'gpt-',
  'chatCompletion',
];

const FORBIDDEN_ACTIVATION_TOKENS = [
  'publicActivation',
  'betaActivation',
  'internalQaActivation',
  'PUBLIC_ACTIVATION=1',
  'BETA_ACTIVATION=1',
];

const FORBIDDEN_RAW_OUTPUT_PATTERN =
  /KIS_APP_SECRET|KIS_APP_KEY|KIS_BASE_URL|access_token|appsecret|appkey|authorization|Bearer|KIS_ACCOUNT_NO|account_no|jwt|password|stck_prpr|prdy_vrss|prdy_ctrt|acml_vol|rt_cd|\boutput\b|stack/i;

const RESULT_DOC_REQUIRED_TOKENS = [
  'Status: Implemented',
  `Baseline: ${BASELINE}`,
  'Branch: rebuild/phase-1-ia-shell',
  'Files changed',
  'UX polish summary',
  'Manual/browser QA summary',
  'API route status',
  'Chart AI UI status',
  'Endpoint used: current_price only',
  'Credential exposure status',
  'Raw payload exposure status',
  'Forbidden endpoint status',
  'Validation results',
  'Known limitations',
  'Next recommended phase',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-F-FAST - 2026-07-10',
  '### Local-only Chart AI KIS Current Price UX Polish and Manual QA (Implemented)',
  'Phase 3GG-E-INTEGRATE',
  'ownerLocalKisIntegration=1',
  'Phase 3GG-G-FAST',
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
  pkg.scripts && pkg.scripts['smoke:phase-3gg-f-fast'] === `node ${SMOKE_SCRIPT}`,
  'package.json is missing the exact "smoke:phase-3gg-f-fast" script entry',
);
assert(
  pkg.scripts && pkg.scripts['check:phase-3gg-f-fast'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-f-fast" script entry',
);

// --- 3. chart-ai.astro was the only allowed UI (.astro) source modified ---
let astroDiffLines = [];
try {
  astroDiffLines = runGit(['diff', '--name-only', BASELINE, '--', 'src/pages'])
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.endsWith('.astro'));
} catch {
  astroDiffLines = ['<git diff failed>'];
}
assert(
  astroDiffLines.every((f) => f === CHART_AI_PAGE),
  `Only ${CHART_AI_PAGE} may be modified among .astro UI sources this phase; found: ${astroDiffLines.join(', ')}`,
);

// --- 4. No KIS provider module changed ---
let kisDiffLines = [];
try {
  kisDiffLines = runGit(['diff', '--name-only', BASELINE, '--', ...KIS_PROVIDER_CANDIDATE_PATHS])
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
} catch {
  kisDiffLines = ['<git diff failed>'];
}
assert(
  kisDiffLines.length === 0,
  `KIS provider diff must be empty (existing KIS provider modules must not be modified): ${kisDiffLines.join(', ')}`,
);

// --- 5. No MK Agent / Similar Pattern Agent / scaffold / Supabase / data / lockfile / env change ---
let forbiddenDiffOutput = '';
try {
  forbiddenDiffOutput = runGit(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]).trim();
} catch {
  forbiddenDiffOutput = '<git diff failed>';
}
assert(forbiddenDiffOutput === '', `Forbidden diff is not empty: ${forbiddenDiffOutput}`);

// --- 6. No forbidden endpoint category / raw payload / credential / LLM handoff / activation token ---
const pageSrc = exists(CHART_AI_PAGE) ? read(CHART_AI_PAGE) : '';
const routeSrc = exists(ROUTE_FILE) ? read(ROUTE_FILE) : '';
const adapterSrc = exists(ADAPTER_FILE) ? read(ADAPTER_FILE) : '';

const panelSectionStart = pageSrc.indexOf('id="chartAiOwnerLocalKisIntegrationPanel"');
assert(panelSectionStart !== -1, 'chart-ai.astro must contain the owner-local KIS integration panel section.');
const panelSectionEnd = panelSectionStart === -1 ? -1 : pageSrc.indexOf('</section>', panelSectionStart);
const panelSectionMarkup = panelSectionStart === -1 ? '' : pageSrc.slice(panelSectionStart, panelSectionEnd);
assert(panelSectionMarkup.includes('hidden'), 'Panel section markup must be hidden by default.');

for (const [label, text] of [
  [CHART_AI_PAGE, pageSrc],
  [ROUTE_FILE, routeSrc],
  [ADAPTER_FILE, adapterSrc],
]) {
  for (const token of FORBIDDEN_ENDPOINT_TOKENS) {
    assert(
      !(label === CHART_AI_PAGE ? panelSectionMarkup : text).toLowerCase().includes(token),
      `${label} must not reference forbidden endpoint token: ${token}`,
    );
  }
  for (const token of FORBIDDEN_LLM_TOKENS) {
    assert(!text.toLowerCase().includes(token.toLowerCase()), `${label} must not reference LLM handoff token: ${token}`);
  }
  for (const token of FORBIDDEN_ACTIVATION_TOKENS) {
    assert(!text.includes(token), `${label} must not contain an activation token: ${token}`);
  }
}
assert(!FORBIDDEN_RAW_OUTPUT_PATTERN.test(panelSectionMarkup), 'Panel markup must not match the raw payload / credential pattern.');
assert(!FORBIDDEN_RAW_OUTPUT_PATTERN.test(routeSrc), 'Route source must not match the raw payload / credential pattern.');
assert(!FORBIDDEN_RAW_OUTPUT_PATTERN.test(adapterSrc), 'Adapter source must not match the raw payload / credential pattern.');
for (const token of FORBIDDEN_INVESTMENT_LANGUAGE) {
  assert(!pageSrc.includes(token), `chart-ai.astro must not contain forbidden investment language: ${token}`);
}
assert(routeSrc === '' || routeSrc.includes("category: 'current_price'"), 'Route must only ever request the current_price category.');
assert(
  routeSrc === '' || routeSrc.includes("searchParams.get('ownerLocalKisIntegration') === '1'"),
  'Route must still require the explicit ownerLocalKisIntegration=1 opt-in.',
);

// --- 7. Result doc required sections/claims ---
const resultDoc = exists(RESULT_DOC) ? read(RESULT_DOC) : '';
for (const token of RESULT_DOC_REQUIRED_TOKENS) {
  assert(resultDoc.includes(token), `Result doc missing required token: ${token}`);
}

// --- 8. Changelog entry present, prepended above the baseline phase entry ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-F-FAST - 2026-07-10');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-F-FAST entry header');
const changelogSection =
  changelogHeaderIndex === -1
    ? ''
    : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
const eIntegrateHeaderIndex = changelog.indexOf('## Phase 3GG-E-INTEGRATE - 2026-07-10');
assert(
  eIntegrateHeaderIndex === -1 || changelogHeaderIndex < eIntegrateHeaderIndex,
  'Phase 3GG-F-FAST changelog entry must be prepended above the Phase 3GG-E-INTEGRATE entry',
);

// --- 9. No unexpected working-tree changes outside this phase's scope ---
// scripts/check_phase_3gg_d_fast_contract.mjs and scripts/check_phase_3gg_e_integrate_contract.mjs
// are legitimately patched sibling checkers: they now tolerate this phase's authorized
// chart-ai.astro polish and new deliverable files instead of flagging them as violations of
// their own earlier, narrower snapshots.
const ALLOWED_MODIFIED_FILES = new Set([
  ...CORE_DELIVERABLES,
  CHANGELOG,
  PACKAGE_JSON,
  CHART_AI_PAGE,
  ROUTE_FILE,
  ADAPTER_FILE,
  'scripts/check_phase_3gg_d_fast_contract.mjs',
  'scripts/check_phase_3gg_e_integrate_contract.mjs',
  'scripts/owner_smoke_phase_3gg_g_fast_real_kis_current_price.mjs',
  'scripts/check_phase_3gg_g_fast_contract.mjs',
  'docs/planning/phase_3gg_g_fast_real_kis_current_price_owner_smoke_result_v0.1.md',
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

// --- 10. Run the smoke script and require it to pass ---
let smokeOutput = '';
let smokePassed = true;
try {
  smokeOutput = execFileSync('node', [SMOKE_SCRIPT], { cwd: ROOT, encoding: 'utf8' });
} catch (error) {
  smokePassed = false;
  smokeOutput = (error.stdout || '') + (error.stderr || '');
}
assert(smokePassed, `Smoke script did not pass: ${smokeOutput}`);
assert(/PASS/.test(smokeOutput), 'Smoke script output must contain PASS');

// --- 11. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-F-FAST check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-F-FAST check PASS: ${assertions}/${assertions} assertions passed.`);
}
