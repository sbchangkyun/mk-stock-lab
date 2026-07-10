// Phase 3GG-D-FAST contract checker.
// Verifies the local-only Live KIS minimal end-to-end market-data path
// (single approved endpoint, no public route, no credential exposure, no
// raw payload exposure, no forbidden endpoint category) is present,
// internally consistent, and safe, and that the smoke script passes.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = 'cdd9bd18a6b8993d8a9320b2c7a80c5d6bb5b110';

const BINDING_SRC = 'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs';
const BINDING_FIXTURE = 'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.fixture.mjs';
const SMOKE_SCRIPT = 'scripts/smoke_phase_3gg_d_fast_local_only_live_kis_market_data.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_d_fast_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_d_fast_local_only_live_kis_market_data_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [BINDING_SRC, BINDING_FIXTURE, SMOKE_SCRIPT, CHECKER_SELF, RESULT_DOC];

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
];

// Phase 3GG-E-INTEGRATE (a later, explicitly authorized follow-on phase) is permitted to
// modify src/pages/chart-ai.astro and to add its own deliverable files; this checker's
// working-tree-purity scan (see below) tolerates exactly those known later-phase paths so
// this D-FAST checker keeps validating D-FAST's own binding module without re-litigating a
// later phase's already-authorized, already-reviewed changes.
const KNOWN_LATER_PHASE_PATHS = [
  'src/pages/chart-ai.astro',
  'src/pages/api/chart-ai/local-only-kis-current-price.json.ts',
  'src/lib/server/chart-ai/kis-market-data-to-chart-ai-context.mjs',
  'scripts/smoke_phase_3gg_e_integrate_local_only_kis_chart_ai_context.mjs',
  'scripts/check_phase_3gg_e_integrate_contract.mjs',
  'docs/planning/phase_3gg_e_integrate_local_only_kis_chart_ai_result_v0.1.md',
  'scripts/smoke_phase_3gg_f_fast_local_only_kis_current_price_ux.mjs',
  'scripts/check_phase_3gg_f_fast_contract.mjs',
  'docs/planning/phase_3gg_f_fast_local_only_kis_current_price_ux_result_v0.1.md',
  'scripts/owner_smoke_phase_3gg_g_fast_real_kis_current_price.mjs',
  'scripts/check_phase_3gg_g_fast_contract.mjs',
  'docs/planning/phase_3gg_g_fast_real_kis_current_price_owner_smoke_result_v0.1.md',
];

const REQUIRED_FORBIDDEN_DIFF_PATHS = [
  'src/lib/server/chart-ai/guarded-productization-scaffold.mjs',
  'src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs',
  'src/lib/server/chart-ai/mk-agent.mjs',
  'src/lib/server/chart-ai/mk-agent.fixture.mjs',
  'src/lib/server/chart-ai/similar-pattern-agent.mjs',
  'src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs',
  'pages/api',
  'src/pages/api',
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

const BINDING_REQUIRED_EXPORT_TOKENS = [
  'LOCAL_ONLY_LIVE_KIS_MARKET_DATA_BINDING_CONTRACT_VERSION',
  'LOCAL_ONLY_ALLOWED_HOSTNAMES',
  'ALLOWED_ENDPOINT_CATEGORIES',
  'FORBIDDEN_ENDPOINT_CATEGORIES',
  'DEFAULT_RATE_LIMIT_POLICY',
  'DEFAULT_CACHE_TTL_MS',
  'DEFAULT_CALL_TIMEOUT_MS',
  'SANITIZED_ERROR_CODES',
  'ALLOWED_SANITIZED_RESPONSE_FIELDS',
  'ALLOWED_LOG_FIELDS',
  'evaluateLocalOnlyGuard',
  'evaluateEndpointAllowlist',
  'evaluateCredentialPresence',
  'createRateLimiter',
  'createQuoteCache',
  'sanitizeQuoteResponse',
  'buildLogEntry',
  'runLocalOnlyLiveKisMarketDataRequest',
];

const BINDING_REQUIRED_LITERAL_TOKENS = [
  "'current_price'",
  '5,',
  '30,',
  '100,',
  '300_000',
  'NON_LOCAL_REQUEST',
  'MISSING_CREDENTIAL',
  'ENDPOINT_NOT_ALLOWLISTED',
  'ENDPOINT_FORBIDDEN',
  'RATE_LIMITED',
  'PROVIDER_TIMEOUT',
  'PROVIDER_UNAVAILABLE',
  'MALFORMED_RESPONSE',
];

const FORBIDDEN_ENDPOINT_CONCEPTS = [
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
  'portfolio_holdings',
  'personal',
];

// Network/env/credential-reading primitives that must never appear in the
// pure binding module (real transport wiring is confined to the smoke
// script, never the binding module).
const FORBIDDEN_BINDING_SOURCE_SUBSTRINGS = [
  'fetch(',
  'axios',
  'XMLHttpRequest',
  'http.request',
  'https.request',
  'process.env',
  'readFileSync',
  'dotenv',
  '.env',
  'access_token',
  'appsecret',
  'appkey',
  'Authorization',
  'Bearer',
  'Set-Cookie',
  'document.cookie',
  'localStorage',
  'sessionStorage',
];

// Case-sensitive and matched only as a standalone lowercase/snake_case
// token so legitimate boolean presence-flag identifiers such as
// `hasAppSecret`/`hasAppKey` (camelCase, required by the local credential
// policy) never trip this scan -- only a literal raw-field-shaped
// occurrence (as KIS's own API uses: `appsecret`, `appkey`, `access_token`)
// would match.
const SECRET_LIKE_CHECKS = [
  { name: 'JWT-like value', regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { name: 'email address', regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
  { name: 'private key block', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: '"access_token" literal', regex: /\baccess_token\b/ },
  { name: '"appsecret" literal', regex: /\bappsecret\b/ },
  { name: '"service_role" literal', regex: /\bservice_role\b/ },
];

const RESULT_DOC_REQUIRED_TOKENS = [
  'Status: Implemented.',
  'Baseline: cdd9bd18a6b8993d8a9320b2c7a80c5d6bb5b110',
  'Phase 3GG-D',
  'current_price',
  'Validation results',
  'Forbidden diff result',
  'KIS provider diff result',
  'Boundary preservation',
  'Next recommended phase',
  'No order endpoint',
  'No account endpoint',
  'No balance endpoint',
  'No public route',
  'No credential value',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-D-FAST - 2026-07-10',
  'Local-only Live KIS',
  'cdd9bd18a6b8993d8a9320b2c7a80c5d6bb5b110',
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
  pkg.scripts && pkg.scripts['smoke:phase-3gg-d-fast'] === `node ${SMOKE_SCRIPT}`,
  'package.json is missing the exact "smoke:phase-3gg-d-fast" script entry',
);
assert(
  pkg.scripts && pkg.scripts['check:phase-3gg-d-fast'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-d-fast" script entry',
);

// --- 3. Binding module required exports ---
const bindingSrc = exists(BINDING_SRC) ? read(BINDING_SRC) : '';
for (const token of BINDING_REQUIRED_EXPORT_TOKENS) {
  assert(bindingSrc.includes(token), `Binding module missing required export/token: ${token}`);
}
for (const token of BINDING_REQUIRED_LITERAL_TOKENS) {
  assert(bindingSrc.includes(token), `Binding module missing required literal: ${token}`);
}

// --- 4. Binding module is single-endpoint (current_price only) ---
assert(
  /ALLOWED_ENDPOINT_CATEGORIES = Object\.freeze\(\['current_price'\]\)/.test(bindingSrc),
  'ALLOWED_ENDPOINT_CATEGORIES must be exactly [\'current_price\']',
);
for (const concept of FORBIDDEN_ENDPOINT_CONCEPTS) {
  assert(
    new RegExp(`'${concept}'`).test(bindingSrc),
    `Binding module FORBIDDEN_ENDPOINT_CATEGORIES must literally list '${concept}'`,
  );
}

// --- 5. Binding module contains no direct network/env/credential primitives ---
for (const [label, text] of [
  [BINDING_SRC, bindingSrc],
  [BINDING_FIXTURE, exists(BINDING_FIXTURE) ? read(BINDING_FIXTURE) : ''],
]) {
  for (const forbidden of FORBIDDEN_BINDING_SOURCE_SUBSTRINGS) {
    assert(!text.includes(forbidden), `Forbidden primitive "${forbidden}" found in ${label}`);
  }
}

// --- 6. Smoke script covers all 11 required scenario labels ---
const smokeSrc = exists(SMOKE_SCRIPT) ? read(SMOKE_SCRIPT) : '';
const REQUIRED_SMOKE_STEP_LABELS = [
  'local-guard-pass',
  'non-local-guard-fails-closed',
  'missing-credential-fails-closed',
  'forbidden-endpoint-fails-closed',
  'unlisted-endpoint-fails-closed',
  'rate-limit-exceeded-blocks',
  'cache-hit-skips-provider-call',
  'sanitized-response-fields-only',
  'raw-payload-not-exposed',
  'no-forbidden-endpoint-category-reachable',
  'real-transport-request',
];
for (const label of REQUIRED_SMOKE_STEP_LABELS) {
  assert(smokeSrc.includes(label), `Smoke script missing required scenario label: ${label}`);
}
assert(
  smokeSrc.includes('forbiddenOutputPattern') && smokeSrc.includes('SAFE_OUTPUT_BLOCKED'),
  'Smoke script must include a forbidden-output guard before printing any log line',
);
assert(
  !smokeSrc.includes("KIS_ENABLE_LIVE_QUOTES: 'true'") && !smokeSrc.includes('KIS_ENABLE_LIVE_QUOTES ='),
  'Smoke script must never set KIS_ENABLE_LIVE_QUOTES itself',
);

// --- 7. No secret-like literal committed in this phase's non-defensive
// files. SMOKE_SCRIPT and CHECKER_SELF are excluded from this scan because
// both intentionally list these words inside their own forbidden-output/
// secret-detection patterns (the same self-referential exclusion the
// sibling Phase 3GG-D checker applies to its own mojibake markers). ---
for (const file of [BINDING_SRC, BINDING_FIXTURE, RESULT_DOC]) {
  if (!exists(file)) continue;
  const text = read(file);
  for (const check of SECRET_LIKE_CHECKS) {
    assert(!check.regex.test(text), `${check.name} pattern found in ${file}`);
  }
}

// --- 8. Result doc required sections/claims ---
const resultDoc = exists(RESULT_DOC) ? read(RESULT_DOC) : '';
for (const token of RESULT_DOC_REQUIRED_TOKENS) {
  assert(resultDoc.includes(token), `Result doc missing required token: ${token}`);
}

// --- 9. Changelog entry present ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-D-FAST - 2026-07-10');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-D-FAST entry header');
const changelogSection =
  changelogHeaderIndex === -1 ? '' : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
assert(
  changelogHeaderIndex < changelog.indexOf('## Phase 3GG-D - 2026-07-10'),
  'Phase 3GG-D-FAST changelog entry must be prepended above the Phase 3GG-D entry',
);

// --- 10. Forbidden diff since baseline is empty (excluding paths explicitly
// authorized by later, already-reviewed phases; see KNOWN_LATER_PHASE_PATHS) ---
let forbiddenDiffOutput = '';
try {
  forbiddenDiffOutput = runGit(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS])
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((filePath) => !KNOWN_LATER_PHASE_PATHS.includes(filePath))
    .join(', ');
} catch {
  forbiddenDiffOutput = '<git diff failed>';
}
assert(forbiddenDiffOutput === '', `Forbidden diff is not empty: ${forbiddenDiffOutput}`);

// --- 11. KIS provider diff since baseline touches only allowed candidates ---
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

// --- 12. Known untouched paths remain untouched ---
let statusLines = [];
try {
  statusLines = runGit(['status', '--porcelain'])
    .split('\n')
    .filter(Boolean);
} catch {
  statusLines = [];
}
for (const line of statusLines) {
  const filePath = line.slice(3).trim();
  const isKnown =
    KNOWN_UNTOUCHED_PATHS.some((p) => filePath === p || filePath.startsWith(p)) ||
    KNOWN_LATER_PHASE_PATHS.includes(filePath);
  const isThisPhaseFile =
    CORE_DELIVERABLES.includes(filePath) || filePath === CHANGELOG || filePath === PACKAGE_JSON;
  if (isKnown) {
    assert(true, `${filePath} is a known pre-existing untouched path`);
  } else if (!isThisPhaseFile) {
    // Not a hard failure by itself (other uncommitted work may exist in the
    // working tree), but flagged so a reviewer notices anything unexpected.
    assert(
      false,
      `Unexpected working-tree change outside this phase's scope: ${filePath} (verify before commit)`,
    );
  }
}

// --- 13. Run the smoke script and require it to pass ---
let smokeOutput = '';
let smokePassed = true;
try {
  smokeOutput = execFileSync('node', [SMOKE_SCRIPT], { cwd: ROOT, encoding: 'utf8' });
} catch (error) {
  smokePassed = false;
  smokeOutput = (error.stdout || '') + (error.stderr || '');
}
assert(smokePassed, `Smoke script did not pass: ${smokeOutput}`);
assert(/^PASS:/m.test(smokeOutput), 'Smoke script output must start a line with "PASS:"');
assert(!smokeOutput.includes('status=failed'), 'Smoke script output must not contain any failed step');

// --- 14. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-D-FAST check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-D-FAST check PASS: ${assertions}/${assertions} assertions passed.`);
}
