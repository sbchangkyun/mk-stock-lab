// Phase 3GG-K-ENV-HF4 contract checker.
// Verifies the HF4 result doc, HF4 diagnostic script, and package.json/changelog wiring are
// present, that the new auth/token diagnostic script is safe (owner-approval gated, never reads
// .env/.env.local directly, never prints a raw env value, never prints KIS_BASE_URL/app key/app
// secret/access token/Authorization header/raw request or response body/raw KIS error message/
// currentPrice/volume numeric value, never references an order/account/balance/funds/portfolio/
// trading/personal endpoint), that .env/.env.local were never staged or committed, and that this
// phase introduced no source feature diff, no KIS provider diff, no forbidden diff, and no
// lockfile diff, measured against the Phase 3GG-K-ENV-HF3 baseline (1ba4652).
//
// Unlike HF1/HF3's checkers, this phase's diagnostic script legitimately constructs real
// Authorization/appkey/appsecret headers and reads real access_token/appkey/appsecret values
// in order to make the owner-approved live token/quote calls -- so this checker cannot blanket-
// forbid those substrings anywhere in the file. Instead it isolates the script's *print* call
// sites (logSanitized/console.log arguments) and asserts only those never interpolate a raw
// secret/token/response value, and separately asserts the printed `report` object literal is
// built exclusively from the allowed sanitized field list.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '1ba4652';

const DIAGNOSTIC_SCRIPT = 'scripts/owner_diagnostic_phase_3gg_k_env_hf4_kis_provider_auth_token_readiness.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_k_env_hf4_kis_provider_auth_token_diagnostic_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3gg_k_env_hf4_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [RESULT_DOC, DIAGNOSTIC_SCRIPT, CHECKER_SELF];

const OWNER_APPROVAL_FLAG = '--owner-approved-kis-auth-token-diagnostic';

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
];

const REQUIRED_FORBIDDEN_DIFF_SOURCE_FILES = [
  'scripts/owner_diagnostic_phase_3gg_k_env_hf1_kis_runtime_readiness.mjs',
  'scripts/owner_diagnostic_phase_3gg_k_env_hf3_kis_provider_network_readiness.mjs',
  'src/lib/server/providers/kisClient.ts',
  'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs',
  'src/pages/api/chart-ai/local-only-kis-current-price.json.ts',
  'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts',
  'src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs',
  'src/lib/server/chart-ai/local-only-llm-model-policy.mjs',
  'src/pages/chart-ai.astro',
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

const ALLOWED_REPORT_FIELDS = [
  'requiredAuthEnvPresent',
  'appKeyPresent',
  'appSecretPresent',
  'baseUrlPresent',
  'kisLiveQuotesShellFlagExactlyTrue',
  'baseUrlParseOk',
  'baseUrlHostKind',
  'tokenEndpointShapeKind',
  'tokenRequestAttempted',
  'tokenHttpStatusClass',
  'tokenResponseShapeKind',
  'tokenPresent',
  'tokenErrorClass',
  'quoteRequestAttempted',
  'quoteHttpStatusClass',
  'quoteResponseShapeKind',
  'quoteKisStatusClass',
  'quoteCurrentPricePresent',
  'quoteVolumePresent',
  'quoteErrorClass',
  'localCurrentPriceRouteReachable',
  'localCurrentPriceSourceStatus',
  'localCurrentPriceSanitizedErrorCode',
  'localCurrentPricePresent',
  'localVolumePresent',
  'finalClassification',
];

// Raw-value interpolations that must never appear inside a print-call argument.
const FORBIDDEN_PRINT_INTERPOLATION_PATTERNS = [
  /\$\{token\}/,
  /\$\{inMemoryToken\}/,
  /\$\{rawText\}/,
  /\$\{parsed\}/,
  /\$\{parsed\./,
  /\$\{output\}/,
  /\$\{tokenResult\}/,
  /\$\{quoteResult\}/,
  /\$\{appKey\}/,
  /\$\{appSecret\}/,
  /\$\{process\.env/,
  /\$\{rawBaseUrlValue\}|\$\{parsedBaseUrl\.href\}|\$\{parsedBaseUrl\.toString\(\)\}|\$\{parsedBaseUrl\}/,
  /\$\{currentPricePresent\s*\?\s*[^:]*:/i, // guards against accidentally printing a numeric branch
  /Bearer\s+\$\{/,
  /authorization["']?\s*:\s*\$\{/i,
];

const RESULT_DOC_REQUIRED_TOKENS = [
  'tokenRequestAttempted',
  'tokenHttpStatusClass',
  'tokenResponseShapeKind',
  'tokenPresent',
  'tokenErrorClass',
  'quoteRequestAttempted',
  'quoteHttpStatusClass',
  'quoteResponseShapeKind',
  'quoteKisStatusClass',
  'quoteCurrentPricePresent',
  'quoteVolumePresent',
  'quoteErrorClass',
  'Classification',
  'Owner-safe next action',
  'Not pushed',
  'Not deployed',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-K-ENV-HF4 - 2026-07-11',
  'Owner-local KIS Provider Auth/Token Diagnostic',
  'Builds on Phase 3GG-K-ENV-HF3',
  'Diagnoses the KIS OAuth token',
  'current_price quote authorization layer',
  'Adds an owner-gated auth/token diagnostic script',
  'Uses KIS OAuth token endpoint only for auth diagnosis',
  'Uses current_price quote endpoint only for quote diagnosis',
  'Does not print KIS_BASE_URL raw value',
  'Does not print credentials',
  'Does not print tokens',
  'Does not print Authorization headers',
  'Does not print raw KIS request or response body',
  'Does not print currentPrice/volume numeric values',
  'Does not print .env/.env.local contents',
  'Does not modify .env/.env.local',
  'Does not stage or commit .env/.env.local',
  'No source feature changes',
  'No UI change',
  'No H route change',
  'No LLM bridge change',
  'No model policy change',
  'No KIS provider source change',
  'No KIS endpoint expansion',
  'Not pushed',
  'Not deployed',
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
  pkg.scripts && pkg.scripts['owner-diagnostic:phase-3gg-k-env-hf4'] === `node ${DIAGNOSTIC_SCRIPT}`,
  'package.json is missing the exact "owner-diagnostic:phase-3gg-k-env-hf4" script entry',
);
assert(
  pkg.scripts && pkg.scripts['check:phase-3gg-k-env-hf4'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-k-env-hf4" script entry',
);

// --- 3. New diagnostic script safety checks ---
const diagSrc = exists(DIAGNOSTIC_SCRIPT) ? read(DIAGNOSTIC_SCRIPT) : '';

assert(diagSrc.includes(OWNER_APPROVAL_FLAG), 'Diagnostic script must require the explicit owner-approval CLI flag.');
assert(!/readFileSync\(.*\.env/.test(diagSrc), 'Diagnostic script must not read .env/.env.local directly.');
assert(!/['"]\.env(\.local)?['"]/.test(diagSrc), 'Diagnostic script must not reference a .env/.env.local file path.');
assert(
  !/(console\.log|logSanitized)\([^)]*process\.env/.test(diagSrc),
  'Diagnostic script must not print a process.env value directly.',
);

// Isolate print-call argument bodies (logSanitized(...) / console.log(...)) and check each one
// individually for forbidden raw-value interpolations. This distinguishes "attaches a real
// Authorization header to an outbound HTTP request" (required by this phase) from "prints a
// secret/token/raw response to the console" (forbidden in all phases).
const printCallBodies = [...diagSrc.matchAll(/(?:logSanitized|console\.log)\(([\s\S]*?)\);/g)].map((m) => m[1]);
assert(printCallBodies.length > 0, 'Diagnostic script must contain at least one sanitized print call.');
for (const body of printCallBodies) {
  for (const pattern of FORBIDDEN_PRINT_INTERPOLATION_PATTERNS) {
    assert(!pattern.test(body), `Diagnostic script print call must not interpolate a forbidden raw value: ${pattern}`);
  }
}

// Extract the `const report = { ... };` object literal and assert every shorthand property name
// is drawn only from the allowed sanitized field list (no raw secret/token/body field sneaked in).
const reportLiteralMatch = diagSrc.match(/const report = \{([\s\S]*?)\};/);
assert(reportLiteralMatch !== null, 'Diagnostic script must define a single sanitized `report` object literal.');
if (reportLiteralMatch) {
  const reportFieldNames = reportLiteralMatch[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const field of reportFieldNames) {
    assert(ALLOWED_REPORT_FIELDS.includes(field), `report object contains a field not in the allowed printed-field list: ${field}`);
  }
}

// Strips `//` documentary comment lines (which describe, in prose, which endpoints are NOT
// contacted -- e.g. "No order/account/balance/... endpoint is ever contacted") before scanning
// for actual forbidden endpoint path usage in code, avoiding a false positive on the safety
// documentation itself.
const diagCodeOnly = diagSrc
  .split('\n')
  .filter((line) => !line.trim().startsWith('//'))
  .join('\n');
assert(
  !/\/order\b|\/account\b|\/balance\b|\/funds\b|\/portfolio\b|\/trading\b|\/personal\b/i.test(diagCodeOnly),
  'Diagnostic script must never reference an order/account/balance/funds/portfolio/trading/personal endpoint.',
);
assert(
  diagSrc.includes('/oauth2/tokenP') && diagSrc.includes('/uapi/domestic-stock/v1/quotations/inquire-price'),
  'Diagnostic script must use only the OAuth token endpoint and the current_price quote endpoint.',
);
assert(diagSrc.includes("SYMBOL = '005930'"), 'Diagnostic script must restrict the quote call to symbol 005930 only.');

// --- 4. Result doc required content ---
const resultDoc = exists(RESULT_DOC) ? read(RESULT_DOC) : '';
for (const token of RESULT_DOC_REQUIRED_TOKENS) {
  assert(resultDoc.includes(token), `Result doc missing required token: ${token}`);
}
assert(
  !/OPENAI_API_KEY\s*=\s*sk-|Authorization:\s*Bearer\s+\S/.test(resultDoc),
  'Result doc must never contain a raw credential or Authorization header value.',
);
assert(
  !/currentPrice["`']?\s*[:=]\s*\d/.test(resultDoc),
  'Result doc must never contain a literal currentPrice numeric value.',
);
assert(!/volume["`']?\s*[:=]\s*\d/.test(resultDoc), 'Result doc must never contain a literal volume numeric value.');
assert(
  !/KIS_APP_KEY\s*=\s*[^\s`]|KIS_APP_SECRET\s*=\s*[^\s`]|KIS_BASE_URL\s*=\s*https?:\/\/\S/.test(resultDoc),
  'Result doc must never contain a literal KIS_APP_KEY/KIS_APP_SECRET/KIS_BASE_URL value.',
);

// --- 5. Changelog entry present, prepended above the K-ENV-HF3 entry ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-K-ENV-HF4 - 2026-07-11');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-K-ENV-HF4 entry header');
const changelogSection =
  changelogHeaderIndex === -1 ? '' : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
const hf3HeaderIndex = changelog.indexOf('## Phase 3GG-K-ENV-HF3 - 2026-07-11');
assert(
  hf3HeaderIndex === -1 || (changelogHeaderIndex !== -1 && changelogHeaderIndex < hf3HeaderIndex),
  'Phase 3GG-K-ENV-HF4 changelog entry must be prepended above the Phase 3GG-K-ENV-HF3 entry',
);

// --- 6. No source feature file changed ---
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

// --- 7. No KIS provider module changed ---
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

// --- 8. No UI / MK Agent / scaffold / Supabase / data / lockfile change ---
let forbiddenDiffOutput = '';
try {
  forbiddenDiffOutput = runGit(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]).trim();
} catch {
  forbiddenDiffOutput = '<git diff failed>';
}
assert(forbiddenDiffOutput === '', `Forbidden diff is not empty: ${forbiddenDiffOutput}`);

// --- 9. .env / .env.local never staged, never committed ---
assert(runGit(['ls-files', '--', '.env', '.env.local']).trim() === '', '.env/.env.local must never be tracked/committed.');
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

// --- 10. No unexpected working-tree changes outside this phase's scope ---
const ALLOWED_MODIFIED_FILES = new Set([
  ...CORE_DELIVERABLES,
  CHANGELOG,
  PACKAGE_JSON,
  // Phase 3GG-K-ENV-HF4 sibling checker-compatibility tolerance (documented per this phase's
  // work order): HF3's checker required a small, documented ALLOWED_MODIFIED_FILES patch to
  // tolerate HF4's new files. Allow that sibling patch here too.
  'scripts/check_phase_3gg_k_env_hf3_contract.mjs',
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
  if (filePath === '.env' || filePath === '.env.local') {
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

// --- 11. No deploy/push/activation marker in the new docs ---
for (const file of [RESULT_DOC]) {
  const src = exists(file) ? read(file) : '';
  assert(!/vercel deploy|git push/i.test(src), `${file} must not contain a deploy/push marker.`);
  assert(
    !/publicActivation|betaActivation|internalQaActivation|PUBLIC_ACTIVATION=1|BETA_ACTIVATION=1/.test(src),
    `${file} must not contain an activation token.`,
  );
}

// --- 12. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-K-ENV-HF4 check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-K-ENV-HF4 check PASS: ${assertions}/${assertions} assertions passed.`);
}
