// Phase 3GG-E-INTEGRATE contract checker.
// Verifies the local-only KIS current_price -> Chart AI context integration (adapter,
// API route, chart-ai.astro panel) is present, internally consistent, current_price-only,
// sanitized, local-only + opt-in gated, and safe, and that the smoke script passes.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = 'bb2569401a2d6190174f53c9f8a4813dde8be8bc';

const ADAPTER_FILE = 'src/lib/server/chart-ai/kis-market-data-to-chart-ai-context.mjs';
const ROUTE_FILE = 'src/pages/api/chart-ai/local-only-kis-current-price.json.ts';
const CHART_AI_PAGE = 'src/pages/chart-ai.astro';
const SMOKE_SCRIPT = 'scripts/smoke_phase_3gg_e_integrate_local_only_kis_chart_ai_context.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_e_integrate_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_e_integrate_local_only_kis_chart_ai_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [ADAPTER_FILE, ROUTE_FILE, SMOKE_SCRIPT, CHECKER_SELF, RESULT_DOC];

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
];

// This phase is explicitly allowed to modify chart-ai.astro and package.json; the D-FAST
// forbidden-diff list is narrowed accordingly (chart-ai.astro removed).
const REQUIRED_FORBIDDEN_DIFF_PATHS = [
  'src/lib/server/chart-ai/mk-agent.mjs',
  'src/lib/server/chart-ai/mk-agent.fixture.mjs',
  'src/lib/server/chart-ai/similar-pattern-agent.mjs',
  'src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs',
  'src/lib/server/chart-ai/guarded-productization-scaffold.mjs',
  'src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs',
  'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs',
  'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.fixture.mjs',
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

const ADAPTER_REQUIRED_EXPORT_TOKENS = [
  'KIS_CHART_AI_CONTEXT_CONTRACT_VERSION',
  'ALLOWED_CHART_AI_KIS_CONTEXT_FIELDS',
  'assertNoRawKisPayloadInChartAiContext',
  'createChartAiKisMarketDataContext',
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

// Same word-boundary raw-payload/credential pattern the smoke script uses.
const FORBIDDEN_RAW_OUTPUT_PATTERN =
  /KIS_APP_SECRET|KIS_APP_KEY|KIS_BASE_URL|access_token|appsecret|appkey|authorization|Bearer|KIS_ACCOUNT_NO|account_no|jwt|password|stck_prpr|prdy_vrss|prdy_ctrt|acml_vol|rt_cd|\boutput\b|stack/i;

const RESULT_DOC_REQUIRED_TOKENS = [
  'Status: Implemented.',
  'Baseline: bb2569401a2d6190174f53c9f8a4813dde8be8bc',
  'Branch: rebuild/phase-1-ia-shell.',
  'Files changed',
  'Integration summary',
  'Sanitized fields displayed',
  'Activation status',
  'Credential exposure status',
  'Raw payload exposure status',
  'Forbidden endpoint status',
  'Validation results',
  'Known limitations',
  'Next recommended phase',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-E-INTEGRATE - 2026-07-10',
  '### Local-only KIS Data to Chart AI Integration (Implemented)',
  'Phase 3GG-D-FAST',
  'ownerLocalKisIntegration=1',
  'Phase 3GG-F-FAST',
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
  pkg.scripts && pkg.scripts['smoke:phase-3gg-e-integrate'] === `node ${SMOKE_SCRIPT}`,
  'package.json is missing the exact "smoke:phase-3gg-e-integrate" script entry',
);
assert(
  pkg.scripts && pkg.scripts['check:phase-3gg-e-integrate'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-e-integrate" script entry',
);

// --- 3. Adapter module required exports ---
const adapterSrc = exists(ADAPTER_FILE) ? read(ADAPTER_FILE) : '';
for (const token of ADAPTER_REQUIRED_EXPORT_TOKENS) {
  assert(adapterSrc.includes(token), `Adapter module missing required export/token: ${token}`);
}
// --- 4. Route is local-only and opt-in only ---
const routeSrc = exists(ROUTE_FILE) ? read(ROUTE_FILE) : '';
assert(exists(ROUTE_FILE), `Route file missing: ${ROUTE_FILE}`);
assert(routeSrc.includes('LOCAL_ONLY_ALLOWED_HOSTNAMES'), 'Route must reuse the Phase 3GG-D-FAST local-only hostname allowlist.');
assert(routeSrc.includes('resolveLocalHostname'), 'Route must resolve and check the request hostname.');
assert(
  routeSrc.includes("searchParams.get('ownerLocalKisIntegration') === '1'"),
  'Route must require the explicit ownerLocalKisIntegration=1 opt-in.',
);
assert(routeSrc.includes("category: 'current_price'"), 'Route must only ever request the current_price category.');
assert(routeSrc.includes("Cache-Control': 'no-store'"), 'Route responses must be Cache-Control: no-store.');

// --- 5. chart-ai.astro contains ownerLocalKisIntegration but does not trigger default behavior ---
const pageSrc = exists(CHART_AI_PAGE) ? read(CHART_AI_PAGE) : '';
assert(pageSrc.includes('ownerLocalKisIntegration'), 'chart-ai.astro must reference ownerLocalKisIntegration.');
assert(
  pageSrc.includes('ownerLocalKisIntegrationPanel.hidden = !ownerLocalKisIntegrationEnabled'),
  'chart-ai.astro panel visibility must default to hidden and only flip via the local-only + opt-in guard.',
);
const panelSectionStart = pageSrc.indexOf('id="chartAiOwnerLocalKisIntegrationPanel"');
assert(panelSectionStart !== -1, 'chart-ai.astro must contain the owner-local KIS integration panel section.');
const panelSectionEnd = panelSectionStart === -1 ? -1 : pageSrc.indexOf('</section>', panelSectionStart);
const panelSectionMarkup = panelSectionStart === -1 ? '' : pageSrc.slice(panelSectionStart, panelSectionEnd);
assert(panelSectionMarkup.includes('hidden'), 'Panel section markup must be hidden by default.');

// --- 6. No forbidden endpoint category allowed anywhere in this phase's new files ---
for (const [label, text] of [
  [ADAPTER_FILE, adapterSrc],
  [ROUTE_FILE, routeSrc],
]) {
  for (const token of FORBIDDEN_ENDPOINT_TOKENS) {
    assert(!text.toLowerCase().includes(token), `${label} must not reference forbidden endpoint token: ${token}`);
  }
}
for (const token of FORBIDDEN_ENDPOINT_TOKENS) {
  assert(
    !panelSectionMarkup.toLowerCase().includes(token),
    `chart-ai.astro panel markup must not reference forbidden endpoint token: ${token}`,
  );
}

// --- 7. No raw payload exposure / no credential exposure ---
for (const [label, text] of [
  [ADAPTER_FILE, adapterSrc],
  [ROUTE_FILE, routeSrc],
]) {
  assert(!FORBIDDEN_RAW_OUTPUT_PATTERN.test(text), `${label} must not match the raw payload / credential pattern.`);
}
assert(
  !FORBIDDEN_RAW_OUTPUT_PATTERN.test(panelSectionMarkup),
  'chart-ai.astro panel markup must not match the raw payload / credential pattern.',
);

// --- 8. No LLM handoff ---
for (const [label, text] of [
  [ADAPTER_FILE, adapterSrc],
  [ROUTE_FILE, routeSrc],
  [CHART_AI_PAGE, pageSrc],
]) {
  for (const token of FORBIDDEN_LLM_TOKENS) {
    assert(!text.toLowerCase().includes(token.toLowerCase()), `${label} must not reference LLM handoff token: ${token}`);
  }
}

// --- 9. No forbidden investment language ---
for (const token of FORBIDDEN_INVESTMENT_LANGUAGE) {
  assert(!pageSrc.includes(token), `chart-ai.astro must not contain forbidden investment language: ${token}`);
}

// --- 10. No public/beta/internal QA activation ---
for (const [label, text] of [
  [ADAPTER_FILE, adapterSrc],
  [ROUTE_FILE, routeSrc],
  [CHART_AI_PAGE, pageSrc],
]) {
  for (const token of FORBIDDEN_ACTIVATION_TOKENS) {
    assert(!text.includes(token), `${label} must not contain an activation token: ${token}`);
  }
}

// --- 11. Result doc required sections/claims ---
const resultDoc = exists(RESULT_DOC) ? read(RESULT_DOC) : '';
for (const token of RESULT_DOC_REQUIRED_TOKENS) {
  assert(resultDoc.includes(token), `Result doc missing required token: ${token}`);
}

// --- 12. Changelog entry present and prepended above the baseline phase entries ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-E-INTEGRATE - 2026-07-10');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-E-INTEGRATE entry header');
const changelogSection =
  changelogHeaderIndex === -1
    ? ''
    : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
const dFastHeaderIndex = changelog.indexOf('## Phase 3GG-D-FAST - 2026-07-10');
assert(
  dFastHeaderIndex === -1 || changelogHeaderIndex < dFastHeaderIndex,
  'Phase 3GG-E-INTEGRATE changelog entry must be prepended above the Phase 3GG-D-FAST entry',
);

// --- 13. No lockfile change, no Supabase change, no MK Agent/Similar Pattern Agent source change ---
let forbiddenDiffOutput = '';
try {
  forbiddenDiffOutput = runGit(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]).trim();
} catch {
  forbiddenDiffOutput = '<git diff failed>';
}
assert(forbiddenDiffOutput === '', `Forbidden diff is not empty: ${forbiddenDiffOutput}`);

// --- 14. KIS provider diff since baseline is empty (existing KIS provider modules untouched) ---
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

// --- 15. Known untouched paths remain untouched / no unexpected working-tree changes ---
// scripts/check_phase_3gg_d_fast_contract.mjs is a legitimately patched sibling checker:
// it now tolerates this phase's authorized chart-ai.astro / new-file changes instead of
// flagging them as violations of its own earlier, narrower snapshot. Phase 3GG-F-FAST is a
// later, explicitly authorized follow-on phase that polishes CHART_AI_PAGE and adds its own
// deliverable files; those are tolerated here for the same reason.
const ALLOWED_MODIFIED_FILES = new Set([
  ...CORE_DELIVERABLES,
  CHANGELOG,
  PACKAGE_JSON,
  CHART_AI_PAGE,
  'scripts/check_phase_3gg_d_fast_contract.mjs',
  'scripts/smoke_phase_3gg_f_fast_local_only_kis_current_price_ux.mjs',
  'scripts/check_phase_3gg_f_fast_contract.mjs',
  'docs/planning/phase_3gg_f_fast_local_only_kis_current_price_ux_result_v0.1.md',
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

// --- 16. Run the smoke script and require it to pass ---
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

// --- 17. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-E-INTEGRATE check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-E-INTEGRATE check PASS: ${assertions}/${assertions} assertions passed.`);
}
