// Phase 3GG-I-FAST contract checker (lightweight, per the owner's speed-priority instruction).
// Verifies the Chart AI owner-local KIS + LLM summary UI wiring in chart-ai.astro, this phase's
// smoke script, package.json wiring, the result doc, and the changelog entry -- without running
// any real KIS/OpenAI network call and without touching the KIS provider or the H route/bridge.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '722995a539a8e6e1580fc2fedc1f5555eb88a138';

const CHART_AI_ASTRO = 'src/pages/chart-ai.astro';
const SMOKE_SCRIPT = 'scripts/smoke_phase_3gg_i_fast_chart_ai_ui_kis_llm_summary_wiring.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_i_fast_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_i_fast_chart_ai_ui_kis_llm_summary_wiring_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

// Files this phase is allowed to modify or create -- must match the work order's explicit lists.
const CORE_DELIVERABLES = [CHART_AI_ASTRO, SMOKE_SCRIPT, CHECKER_SELF, RESULT_DOC, CHANGELOG, PACKAGE_JSON];

const H_ROUTE_PATH = '/api/chart-ai/local-only-kis-llm-summary.json?ownerLocalKisLlm=1&symbol=005930';

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
];

// Files/paths this phase must NOT modify -- do not touch the H route, the LLM bridge, the
// H-FAST owner smoke script/checker, the KIS provider, MK Agent / Similar Pattern Agent,
// Supabase, data, lockfiles, or env files.
const REQUIRED_FORBIDDEN_DIFF_PATHS = [
  'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts',
  'src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs',
  'scripts/owner_smoke_phase_3gg_h_fast_local_only_llm_runtime_bridge.mjs',
  'scripts/check_phase_3gg_h_fast_contract.mjs',
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

const FORBIDDEN_ENDPOINT_TERMS = /\/api\/[^"'\s]*(order|account|balance|funds|portfolio|trading|personal)[^"'\s]*/i;

const RESULT_DOC_REQUIRED_TOKENS = [
  `Baseline: ${BASELINE}`,
  'Branch: rebuild/phase-1-ia-shell',
  'Files changed',
  'Owner-confirmed H-HF1 precondition',
  'UI wiring summary',
  'Route called by UI',
  'Visibility gate',
  'Auto-fetch status',
  'Manual UI check status',
  'Credential exposure status',
  'Raw KIS payload exposure status',
  'Raw LLM response exposure status',
  'currentPrice numeric exposure status',
  'Validation results',
  'Next recommended phase: Phase 3GG-I-QA',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-I-FAST - 2026-07-11',
  '### Chart AI UI KIS + LLM Summary Wiring (Implemented)',
  'ownerLocalKisLlm=1',
  'chartAiOwnerLocalKisLlmSummaryPanel',
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
for (const file of CORE_DELIVERABLES) {
  assert(exists(file), `Required file missing: ${file}`);
}

// --- 2. package.json script wiring ---
const pkg = JSON.parse(read(PACKAGE_JSON));
assert(
  pkg.scripts && pkg.scripts['smoke:phase-3gg-i-fast'] === `node ${SMOKE_SCRIPT}`,
  'package.json is missing the exact "smoke:phase-3gg-i-fast" script entry',
);
assert(
  pkg.scripts && pkg.scripts['check:phase-3gg-i-fast'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-i-fast" script entry',
);

// --- 3. chart-ai.astro UI wiring content checks ---
const astroSrc = exists(CHART_AI_ASTRO) ? read(CHART_AI_ASTRO) : '';

assert(
  /id="chartAiOwnerLocalKisLlmSummaryPanel"[\s\S]{0,200}hidden/.test(astroSrc),
  'chart-ai.astro must define the new panel, hidden by default.',
);
assert(astroSrc.includes('id="chartAiOwnerLocalKisLlmSummaryButton"'), 'chart-ai.astro must define the button id.');
assert(astroSrc.includes('id="chartAiOwnerLocalKisLlmSummaryOutput"'), 'chart-ai.astro must define the output id.');
assert(astroSrc.includes('id="chartAiOwnerLocalKisLlmSummaryStatus"'), 'chart-ai.astro must define the status id.');
assert(
  astroSrc.includes("chartAiQuery.get('ownerLocalKisLlm') === '1'"),
  'chart-ai.astro must gate the panel on the ownerLocalKisLlm=1 query opt-in.',
);
assert(
  /ownerLocalKisLlmEnabled\s*=\s*\n?\s*mockedChartAiAccess\.capabilities\.canAccessChartAi\s*&&\s*isLocalOwnerHostname\(\)\s*&&\s*ownerLocalKisLlmOptIn/.test(
    astroSrc,
  ),
  'chart-ai.astro must gate the panel on isLocalOwnerHostname() AND the query opt-in.',
);
assert(astroSrc.includes(H_ROUTE_PATH), 'chart-ai.astro must call the exact H route path.');

// No automatic fetch on page load: the route call must occur only inside the click handler.
{
  const clickListenerIdx = astroSrc.indexOf("ownerLocalKisLlmSummaryButton.addEventListener('click'");
  const fetchCallPattern = /fetch\(\s*\n\s*'\/api\/chart-ai\/local-only-kis-llm-summary\.json\?ownerLocalKisLlm=1&symbol=005930'/g;
  const fetchCallCount = (astroSrc.match(fetchCallPattern) ?? []).length;
  assert(clickListenerIdx > -1, 'chart-ai.astro must register a click listener on the new button.');
  assert(fetchCallCount === 1, 'chart-ai.astro must call the H route from exactly one executable fetch() call site.');
  const clickHandlerBlock =
    clickListenerIdx > -1 ? astroSrc.slice(clickListenerIdx, clickListenerIdx + 4000) : '';
  assert(
    fetchCallPattern.test(clickHandlerBlock) || clickHandlerBlock.includes(H_ROUTE_PATH),
    'The H route fetch() call must be inside the click handler, not at top-level script scope.',
  );
}

assert(
  astroSrc.includes("credentials: 'omit'"),
  'chart-ai.astro must fetch the H route with credentials: "omit" (no cookies).',
);
{
  const clickListenerIdx = astroSrc.indexOf("ownerLocalKisLlmSummaryButton.addEventListener('click'");
  const clickHandlerBlock =
    clickListenerIdx > -1 ? astroSrc.slice(clickListenerIdx, clickListenerIdx + 4000) : '';
  assert(!clickHandlerBlock.includes('Authorization'), 'The click handler must never set an Authorization header.');
  assert(
    !/KIS_APP_KEY|KIS_APP_SECRET|OPENAI_API_KEY|appsecret|appkey|Bearer\s|access_token/i.test(clickHandlerBlock),
    'The click handler must never reference a credential-like token.',
  );
}

// No raw payload / prompt / raw LLM response / currentPrice numeric rendering.
assert(!/rt_cd|stck_prpr|acml_vol|prdy_vrss|prdy_ctrt/.test(astroSrc), 'chart-ai.astro must never reference raw KIS payload field names.');
assert(!/summary\.prompt\b/.test(astroSrc), 'chart-ai.astro must never render a prompt field.');
assert(
  !/summary\.output\b|summary\.usage\b|parsedResponse\.output\b|parsedResponse\.usage\b/.test(astroSrc),
  'chart-ai.astro must never render a raw OpenAI response field.',
);
{
  const rendererMatch = astroSrc.match(/const renderOwnerLocalKisLlmSummarySuccess[\s\S]*?\n {6}\};/);
  assert(Boolean(rendererMatch), 'chart-ai.astro must define renderOwnerLocalKisLlmSummarySuccess.');
  assert(
    Boolean(rendererMatch) && !/summary\.currentPrice\b(?!Present)/.test(rendererMatch[0]),
    'The success renderer must never render summary.currentPrice as a numeric value (only currentPricePresent).',
  );
}

// Required Korean safety copy.
const REQUIRED_KOREAN_PHRASES = [
  '로컬 전용 KIS + LLM 요약',
  '소유자 로컬 테스트 전용',
  '페이지 로드시 자동 실행되지 않습니다.',
  '버튼 클릭 시에만 현재가 기반 요약을 요청합니다.',
  '투자 자문이 아니며 매수·매도 추천을 제공하지 않습니다.',
];
for (const phrase of REQUIRED_KOREAN_PHRASES) {
  assert(astroSrc.includes(phrase), `chart-ai.astro missing required Korean safety copy: "${phrase}"`);
}

// Blocked diagnostics UI allowlist restricted to the 4 work-order-authorized fields.
assert(
  astroSrc.includes('OWNER_LOCAL_KIS_LLM_SUMMARY_DIAGNOSTICS_UI_ALLOWLIST'),
  'chart-ai.astro must define a narrow UI diagnostics display allowlist.',
);
assert(
  /OWNER_LOCAL_KIS_LLM_SUMMARY_DIAGNOSTICS_UI_ALLOWLIST = \[\s*'httpStatus',\s*'openAiErrorMessageClass',\s*'responseShapeKind',\s*'outputTextPresent',\s*\]/.test(
    astroSrc,
  ),
  'The UI diagnostics allowlist must contain exactly httpStatus/openAiErrorMessageClass/responseShapeKind/outputTextPresent.',
);
assert(
  !/OWNER_LOCAL_KIS_LLM_SUMMARY_DIAGNOSTICS_UI_ALLOWLIST[\s\S]{0,200}(openAiErrorType|openAiErrorCode|openAiErrorParam)/.test(
    astroSrc,
  ),
  'The UI diagnostics allowlist must not include openAiErrorType/openAiErrorCode/openAiErrorParam.',
);

// No forbidden endpoint expansion.
assert(!FORBIDDEN_ENDPOINT_TERMS.test(astroSrc), 'chart-ai.astro must not introduce an order/account/balance/funds/portfolio/trading/personal route call.');

// No Supabase/auth/session/JWT/cookie requirement added for this panel's gate.
{
  const gateBlockMatch = astroSrc.match(
    /const ownerLocalKisLlmOptIn[\s\S]{0,400}?ownerLocalKisLlmPanel\.hidden = !ownerLocalKisLlmEnabled;\s*\}/,
  );
  assert(Boolean(gateBlockMatch), 'chart-ai.astro must define the visibility gate block.');
  assert(
    Boolean(gateBlockMatch) && !/supabase|session|jwt|cookie/i.test(gateBlockMatch[0]),
    'The visibility gate must not require Supabase/session/JWT/cookie.',
  );
}

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
assert(kisDiffLines.length === 0, `KIS provider diff must be empty: ${kisDiffLines.join(', ')}`);

// --- 5. No forbidden-scope diff (H route/bridge/H-FAST scripts/MK Agent/Similar Pattern/scaffold/Supabase/data/lockfiles/env) ---
let forbiddenDiffOutput = '';
try {
  forbiddenDiffOutput = runGit(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]).trim();
} catch {
  forbiddenDiffOutput = '<git diff failed>';
}
assert(forbiddenDiffOutput === '', `Forbidden diff is not empty: ${forbiddenDiffOutput}`);

// --- 6. No lockfile diff, no .env/.env.local diff (redundant with #5, kept explicit per work order) ---
let lockAndEnvDiff = '';
try {
  lockAndEnvDiff = runGit([
    'diff',
    '--name-only',
    BASELINE,
    '--',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    '.env',
    '.env.local',
  ]).trim();
} catch {
  lockAndEnvDiff = '<git diff failed>';
}
assert(lockAndEnvDiff === '', `Lockfile/.env diff must be empty: ${lockAndEnvDiff}`);

// --- 7. Result doc required sections ---
const resultDoc = exists(RESULT_DOC) ? read(RESULT_DOC) : '';
for (const token of RESULT_DOC_REQUIRED_TOKENS) {
  assert(resultDoc.includes(token), `Result doc missing required token: ${token}`);
}
assert(
  !/OPENAI_API_KEY\s*=\s*sk-|Authorization:\s*Bearer\s+\S/.test(resultDoc),
  'Result doc must never contain a raw credential or Authorization header value.',
);

// --- 8. Changelog entry present, prepended above the Phase 3GG-H-HF1 entry ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-I-FAST - 2026-07-11');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-I-FAST entry header');
const changelogSection =
  changelogHeaderIndex === -1 ? '' : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
const hf1HeaderIndex = changelog.indexOf('## Phase 3GG-H-HF1 - 2026-07-11');
assert(
  hf1HeaderIndex === -1 || (changelogHeaderIndex !== -1 && changelogHeaderIndex < hf1HeaderIndex),
  'Phase 3GG-I-FAST changelog entry must be prepended above the Phase 3GG-H-HF1 entry',
);

// --- 9. No unexpected working-tree changes outside this phase's scope ---
const ALLOWED_MODIFIED_FILES = new Set(CORE_DELIVERABLES);
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

// --- 10. No deploy/push/activation marker in the new smoke script or the modified astro file ---
for (const file of [CHART_AI_ASTRO, SMOKE_SCRIPT]) {
  const src = exists(file) ? read(file) : '';
  assert(!/vercel deploy|git push/i.test(src), `${file} must not contain a deploy/push marker.`);
  assert(
    !/publicActivation|betaActivation|internalQaActivation|PUBLIC_ACTIVATION=1|BETA_ACTIVATION=1/.test(src),
    `${file} must not contain an activation token.`,
  );
}

// --- 11. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-I-FAST check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-I-FAST check PASS: ${assertions}/${assertions} assertions passed.`);
}
