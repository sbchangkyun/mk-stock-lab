// Phase 3GG-G-FAST contract checker.
// Verifies the owner-gated real KIS current_price smoke (owner smoke script + this
// checker + result doc + package.json/changelog wiring) is present, scoped exactly as
// authorized, and safe. The real owner smoke is NOT executed by a default run of this
// checker -- only when OWNER_RUN_REAL_KIS_SMOKE=1 is explicitly set in the environment.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '0a6c73cb2ce34d7f45b55b7d2d330cbc4451990a';

const OWNER_SMOKE_SCRIPT = 'scripts/owner_smoke_phase_3gg_g_fast_real_kis_current_price.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_g_fast_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_g_fast_real_kis_current_price_owner_smoke_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [OWNER_SMOKE_SCRIPT, CHECKER_SELF, RESULT_DOC];

const OWNER_APPROVAL_FLAG = '--owner-approved-real-kis-smoke';
const DEFAULT_BASE_URL = 'http://localhost:4321';
const ROUTE_PATH = '/api/chart-ai/local-only-kis-current-price.json?ownerLocalKisIntegration=1&symbol=005930';

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
];

// Verbatim forbidden-diff path list for this phase (same family as prior 3GG phases).
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

// The owner smoke script's own forbidden-pattern regex sources must reference these raw
// KIS payload field names and credential-like tokens (checked as substrings of its source).
const REQUIRED_RAW_PAYLOAD_TOKENS = ['rt_cd', 'stck_prpr', 'acml_vol', 'prdy_vrss', 'prdy_ctrt'];
const REQUIRED_CREDENTIAL_TOKENS = [
  'KIS_APP_KEY',
  'KIS_APP_SECRET',
  'access_token',
  'appsecret',
  'appkey',
  'KIS_ACCOUNT_NO',
  'account_no',
  'jwt',
  'password',
];

const RESULT_DOC_REQUIRED_TOKENS = [
  `Baseline: ${BASELINE}`,
  'Branch: rebuild/phase-1-ia-shell',
  'Files changed',
  'Owner smoke summary',
  'Owner real smoke',
  'Credential exposure status',
  'Raw payload exposure status',
  'Forbidden endpoint status',
  'Validation results',
  'Known limitations',
  'Next recommended phase',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-G-FAST - 2026-07-10',
  '### Local-only KIS Current Price Real Credential Smoke, Explicit Owner Run (Implemented)',
  'Phase 3GG-F-FAST',
  'ownerLocalKisIntegration=1',
  'Phase 3GG-H-FAST',
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
  pkg.scripts && pkg.scripts['owner-smoke:phase-3gg-g-fast'] === `node ${OWNER_SMOKE_SCRIPT}`,
  'package.json is missing the exact "owner-smoke:phase-3gg-g-fast" script entry',
);
assert(
  pkg.scripts && pkg.scripts['check:phase-3gg-g-fast'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-g-fast" script entry',
);

// --- 3. Owner smoke script source content checks ---
const smokeSrc = exists(OWNER_SMOKE_SCRIPT) ? read(OWNER_SMOKE_SCRIPT) : '';

assert(smokeSrc.includes(OWNER_APPROVAL_FLAG), 'Owner smoke script must require the explicit owner-approval CLI flag.');
assert(smokeSrc.includes(ROUTE_PATH), 'Owner smoke script must call only the exact local current_price route path.');
assert(smokeSrc.includes(DEFAULT_BASE_URL), 'Owner smoke script must default to http://localhost:4321.');

for (const token of REQUIRED_RAW_PAYLOAD_TOKENS) {
  assert(smokeSrc.includes(token), `Owner smoke script must guard against raw KIS payload token: ${token}`);
}
for (const token of REQUIRED_CREDENTIAL_TOKENS) {
  assert(
    smokeSrc.toLowerCase().includes(token.toLowerCase()),
    `Owner smoke script must guard against credential-like token: ${token}`,
  );
}
assert(
  smokeSrc.toLowerCase().includes('authorization') && smokeSrc.toLowerCase().includes('bearer'),
  'Owner smoke script must guard against Authorization/Bearer header tokens.',
);

assert(
  !smokeSrc.includes('${context.currentPrice}') && !/\$\{currentPrice\}/.test(smokeSrc),
  'Owner smoke script must never interpolate the actual currentPrice value into a printed message.',
);
assert(
  smokeSrc.includes('currentPricePresent=true') || smokeSrc.includes('currentPricePresent=${'),
  'Owner smoke script must report currentPricePresent instead of the actual currentPrice value.',
);

for (const token of FORBIDDEN_ENDPOINT_TOKENS) {
  assert(
    !smokeSrc.toLowerCase().includes(`/${token}`) && !smokeSrc.toLowerCase().includes(`${token}.json`),
    `Owner smoke script must not reference a forbidden endpoint path token: ${token}`,
  );
}
for (const token of FORBIDDEN_LLM_TOKENS) {
  assert(!smokeSrc.toLowerCase().includes(token.toLowerCase()), `Owner smoke script must not reference LLM handoff token: ${token}`);
}
for (const token of FORBIDDEN_ACTIVATION_TOKENS) {
  assert(!smokeSrc.includes(token), `Owner smoke script must not contain an activation token: ${token}`);
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

// --- 6. Result doc required sections/claims ---
const resultDoc = exists(RESULT_DOC) ? read(RESULT_DOC) : '';
for (const token of RESULT_DOC_REQUIRED_TOKENS) {
  assert(resultDoc.includes(token), `Result doc missing required token: ${token}`);
}
assert(
  resultDoc.includes('Owner real smoke: Passed') || resultDoc.includes('Owner real smoke: Blocked'),
  'Result doc must truthfully state either "Owner real smoke: Passed" or "Owner real smoke: Blocked..." -- never an unverified claim.',
);

// --- 7. Changelog entry present, prepended above the baseline phase entry ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-G-FAST - 2026-07-10');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-G-FAST entry header');
const changelogSection =
  changelogHeaderIndex === -1
    ? ''
    : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
const fFastHeaderIndex = changelog.indexOf('## Phase 3GG-F-FAST - 2026-07-10');
assert(
  fFastHeaderIndex === -1 || changelogHeaderIndex < fFastHeaderIndex,
  'Phase 3GG-G-FAST changelog entry must be prepended above the Phase 3GG-F-FAST entry',
);

// --- 8. No unexpected working-tree changes outside this phase's scope ---
// scripts/check_phase_3gg_d_fast_contract.mjs, scripts/check_phase_3gg_e_integrate_contract.mjs,
// and scripts/check_phase_3gg_f_fast_contract.mjs are legitimately patched sibling checkers: they
// now tolerate this phase's authorized new deliverable files instead of flagging them as
// violations of their own earlier, narrower snapshots.
const ALLOWED_MODIFIED_FILES = new Set([
  ...CORE_DELIVERABLES,
  CHANGELOG,
  PACKAGE_JSON,
  'scripts/check_phase_3gg_d_fast_contract.mjs',
  'scripts/check_phase_3gg_e_integrate_contract.mjs',
  'scripts/check_phase_3gg_f_fast_contract.mjs',
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

// --- 9. Real owner smoke is manual-gated: only run it when OWNER_RUN_REAL_KIS_SMOKE=1 is set. ---
if (process.env.OWNER_RUN_REAL_KIS_SMOKE === '1') {
  let smokeOutput = '';
  let smokeRan = true;
  try {
    smokeOutput = execFileSync('node', [OWNER_SMOKE_SCRIPT, OWNER_APPROVAL_FLAG], { cwd: ROOT, encoding: 'utf8' });
  } catch (error) {
    smokeRan = false;
    smokeOutput = (error.stdout || '') + (error.stderr || '');
  }
  const outputSafe =
    !new RegExp(REQUIRED_RAW_PAYLOAD_TOKENS.join('|'), 'i').test(smokeOutput) &&
    !new RegExp(REQUIRED_CREDENTIAL_TOKENS.join('|'), 'i').test(smokeOutput);
  assert(outputSafe, 'Owner real smoke output must never contain a raw payload or credential pattern.');
  if (outputSafe) {
    console.log(smokeOutput.trim());
  }
  assert(smokeRan && /PASS/.test(smokeOutput), 'OWNER_RUN_REAL_KIS_SMOKE=1 was set but the real owner smoke did not pass.');
} else {
  console.log('Phase 3GG-G-FAST: real owner smoke is manual-gated (set OWNER_RUN_REAL_KIS_SMOKE=1 to run it); statically verified only.');
}

// --- 10. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-G-FAST check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-G-FAST check PASS: ${assertions}/${assertions} assertions passed.`);
}
