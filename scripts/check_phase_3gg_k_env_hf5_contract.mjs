// Phase 3GG-K-ENV-HF5 contract checker.
// Verifies the HF5 result doc, HF5 runtime-env diagnostic script, and package.json/changelog wiring
// are present; that the diagnostic script is safe (owner-approval gated, never reads .env/.env.local
// directly, never prints a raw env value, never prints the KIS_ENABLE_LIVE_QUOTES/KIS_BASE_URL raw
// value, app key/app secret/token, Authorization header, raw KIS request or response body, raw KIS
// error message, or currentPrice/volume numeric value, never references an order/account/balance/
// funds/portfolio/trading/personal endpoint); that this phase's SOURCE diff is limited to the three
// allowed local-provider binding files and introduces no forbidden source diff and no lockfile diff;
// that the local-only guard, the ownerLocalKisIntegration=1 gate, the deployed/production fail-closed
// logic, and current_price-only market-data scope all remain present; and that .env/.env.local were
// never staged or committed. Diff checks are measured against the Phase 3GG-K-ENV-HF4 baseline
// (c7e1789).
//
// Like HF4's checker, this checker isolates the diagnostic script's *print* call sites
// (logSanitized/console.log arguments) and asserts only those never interpolate a raw
// env/response/numeric value, and asserts the printed `report` object literal is built exclusively
// from the allowed sanitized field list.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = 'c7e1789';

const DIAGNOSTIC_SCRIPT = 'scripts/owner_diagnostic_phase_3gg_k_env_hf5_local_provider_runtime_env_readiness.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_k_env_hf5_minimal_local_provider_binding_fix_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3gg_k_env_hf5_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [RESULT_DOC, DIAGNOSTIC_SCRIPT, CHECKER_SELF];

const OWNER_APPROVAL_FLAG = '--owner-approved-local-provider-runtime-env-diagnostic';

// Source files this phase is explicitly authorized to modify with a minimal diff.
const ALLOWED_SOURCE_FILES = [
  'src/lib/server/providers/kisClient.ts',
  'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs',
  'src/pages/api/chart-ai/local-only-kis-current-price.json.ts',
];

const KIS_CLIENT = 'src/lib/server/providers/kisClient.ts';
const BINDING_MODULE = 'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs';
const CURRENT_PRICE_ROUTE = 'src/pages/api/chart-ai/local-only-kis-current-price.json.ts';

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
];

// Source files that must remain zero-diff vs the HF4 baseline (c7e1789) this phase.
const REQUIRED_FORBIDDEN_DIFF_SOURCE_FILES = [
  'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts',
  'src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs',
  'src/lib/server/chart-ai/local-only-llm-model-policy.mjs',
  'src/pages/chart-ai.astro',
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

const ALLOWED_REPORT_FIELDS = [
  'localDevServerReachable',
  'localCurrentPriceRouteReachable',
  'localCurrentPriceSourceStatus',
  'localCurrentPriceSanitizedErrorCode',
  'localCurrentPricePresent',
  'localVolumePresent',
  'shellKisLiveQuotesExactlyTrue',
  'routeRuntimeFlagEvidenceKind',
  'suspectedRuntimeEnvMismatch',
  'finalClassification',
];

// Raw-value interpolations that must never appear inside a print-call argument.
const FORBIDDEN_PRINT_INTERPOLATION_PATTERNS = [
  /\$\{process\.env/,
  /\$\{rawText\}/,
  /\$\{parsed\}/,
  /\$\{parsed\./,
  /\$\{context\}/,
  /\$\{context\./,
  /\$\{routeResult\}/,
  /\$\{routeResult\./,
  /\$\{localCurrentPrice(?!RouteReachable|SourceStatus|SanitizedErrorCode|Present)/,
  /Bearer\s+\$\{/,
  /authorization["']?\s*:\s*\$\{/i,
];

const RESULT_DOC_REQUIRED_TOKENS = [
  'KIS_ENABLE_LIVE_QUOTES runtime env mismatch',
  'localCurrentPriceSourceStatus',
  'localCurrentPriceSanitizedErrorCode',
  'localCurrentPricePresent',
  'localVolumePresent',
  'routeRuntimeFlagEvidenceKind',
  'suspectedRuntimeEnvMismatch',
  'Classification',
  'Owner-safe next action',
  'Not pushed',
  'Not deployed',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-K-ENV-HF5 - 2026-07-11',
  'Minimal Local Provider Binding Fix',
  'Builds on Phase 3GG-K-ENV-HF4',
  'HF4 proved OAuth token exchange and direct current_price quote both succeed',
  'isolated to local provider binding',
  'Implements the minimum safe fix for the local current_price route',
  'Does not print KIS_BASE_URL raw value',
  'Does not print credentials',
  'Does not print tokens',
  'Does not print Authorization headers',
  'Does not print raw KIS request or response body',
  'Does not print currentPrice/volume numeric values',
  'Does not print .env/.env.local contents',
  'Does not modify .env/.env.local',
  'Does not stage or commit .env/.env.local',
  'Preserves localhost-only guard',
  'Preserves ownerLocalKisIntegration=1 gate',
  'Preserves deployed/production fail-closed behavior',
  'No UI change',
  'No H route change',
  'No LLM bridge change',
  'No model policy change',
  'No KIS endpoint expansion',
  'current_price only for market data',
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
for (const file of [...CORE_DELIVERABLES, CHANGELOG, PACKAGE_JSON, ...ALLOWED_SOURCE_FILES]) {
  assert(exists(file), `Required file missing: ${file}`);
}

// --- 2. package.json script wiring ---
const pkg = JSON.parse(read(PACKAGE_JSON));
assert(
  pkg.scripts && pkg.scripts['owner-diagnostic:phase-3gg-k-env-hf5'] === `node ${DIAGNOSTIC_SCRIPT}`,
  'package.json is missing the exact "owner-diagnostic:phase-3gg-k-env-hf5" script entry',
);
assert(
  pkg.scripts && pkg.scripts['check:phase-3gg-k-env-hf5'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-k-env-hf5" script entry',
);

// --- 3. Diagnostic script safety checks ---
const diagSrc = exists(DIAGNOSTIC_SCRIPT) ? read(DIAGNOSTIC_SCRIPT) : '';

assert(diagSrc.includes(OWNER_APPROVAL_FLAG), 'Diagnostic script must require the explicit owner-approval CLI flag.');
assert(!/readFileSync\(.*\.env/.test(diagSrc), 'Diagnostic script must not read .env/.env.local directly.');
assert(!/['"]\.env(\.local)?['"]/.test(diagSrc), 'Diagnostic script must not reference a .env/.env.local file path.');
assert(
  !/(console\.log|logSanitized)\([^)]*process\.env/.test(diagSrc),
  'Diagnostic script must not print a process.env value directly.',
);

// Isolate print-call argument bodies and check each for forbidden raw-value interpolations.
const printCallBodies = [...diagSrc.matchAll(/(?:logSanitized|console\.log)\(([\s\S]*?)\);/g)].map((m) => m[1]);
assert(printCallBodies.length > 0, 'Diagnostic script must contain at least one sanitized print call.');
for (const body of printCallBodies) {
  for (const pattern of FORBIDDEN_PRINT_INTERPOLATION_PATTERNS) {
    assert(!pattern.test(body), `Diagnostic script print call must not interpolate a forbidden raw value: ${pattern}`);
  }
}

// The printed `report` object literal must be built exclusively from the allowed sanitized fields.
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

// Strip `//` documentary comment lines (which describe, in prose, which endpoints are NOT contacted)
// before scanning for actual forbidden endpoint path usage in code, avoiding a false positive on the
// safety documentation itself (same technique as the HF3/HF4 checkers).
const diagCodeOnly = diagSrc
  .split('\n')
  .filter((line) => !line.trim().startsWith('//'))
  .join('\n');
assert(
  !/\/order\b|\/account\b|\/balance\b|\/funds\b|\/portfolio\b|\/trading\b|\/personal\b/i.test(diagCodeOnly),
  'Diagnostic script must never reference an order/account/balance/funds/portfolio/trading/personal endpoint.',
);
// The diagnostic must construct no Authorization header and read no credential (route-probe only).
assert(!/authorization\s*:/i.test(diagCodeOnly), 'Diagnostic script must not construct an Authorization header.');
assert(
  !/\bappkey\b|\bappsecret\b|\baccess_token\b/i.test(diagCodeOnly.replace(/FORBIDDEN_CREDENTIAL_PATTERN[\s\S]*?;/, '')),
  'Diagnostic script must not read/construct app key/app secret/access token values.',
);
assert(
  diagSrc.includes('/api/chart-ai/local-only-kis-current-price.json'),
  'Diagnostic script must probe only the existing local current_price route.',
);

// --- 4. Result doc required content ---
const resultDoc = exists(RESULT_DOC) ? read(RESULT_DOC) : '';
for (const token of RESULT_DOC_REQUIRED_TOKENS) {
  assert(resultDoc.includes(token), `Result doc missing required token: ${token}`);
}
assert(
  !/OPENAI_API_KEY\s*=\s*sk-|Authorization:\s*Bearer\s+\S/.test(resultDoc),
  'Result doc must never contain a raw credential or Authorization header value.',
);
assert(!/currentPrice["`']?\s*[:=]\s*\d/.test(resultDoc), 'Result doc must never contain a literal currentPrice numeric value.');
assert(!/volume["`']?\s*[:=]\s*\d/.test(resultDoc), 'Result doc must never contain a literal volume numeric value.');
assert(
  !/KIS_APP_KEY\s*=\s*[^\s`]|KIS_APP_SECRET\s*=\s*[^\s`]|KIS_BASE_URL\s*=\s*https?:\/\/\S/.test(resultDoc),
  'Result doc must never contain a literal KIS_APP_KEY/KIS_APP_SECRET/KIS_BASE_URL value.',
);

// --- 5. Changelog entry present, prepended above the K-ENV-HF4 entry ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-K-ENV-HF5 - 2026-07-11');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-K-ENV-HF5 entry header');
const changelogSection =
  changelogHeaderIndex === -1 ? '' : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
const hf4HeaderIndex = changelog.indexOf('## Phase 3GG-K-ENV-HF4 - 2026-07-11');
assert(
  hf4HeaderIndex === -1 || (changelogHeaderIndex !== -1 && changelogHeaderIndex < hf4HeaderIndex),
  'Phase 3GG-K-ENV-HF5 changelog entry must be prepended above the Phase 3GG-K-ENV-HF4 entry',
);

// --- 6. Source diff is limited to the allowed local-provider binding files ---
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

// --- 7. No forbidden source diff / no lockfile diff ---
let forbiddenDiffOutput = '';
try {
  forbiddenDiffOutput = runGit(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]).trim();
} catch {
  forbiddenDiffOutput = '<git diff failed>';
}
assert(forbiddenDiffOutput === '', `Forbidden diff is not empty: ${forbiddenDiffOutput}`);

// --- 8. Local-only / owner-opt-in / production fail-closed / current_price-only guards preserved ---
const kisClientSrc = exists(KIS_CLIENT) ? read(KIS_CLIENT) : '';
const bindingSrc = exists(BINDING_MODULE) ? read(BINDING_MODULE) : '';
const routeSrc = exists(CURRENT_PRICE_ROUTE) ? read(CURRENT_PRICE_ROUTE) : '';

// localhost-only guard
assert(routeSrc.includes('resolveLocalHostname'), 'Route must still resolve/require a local hostname.');
assert(bindingSrc.includes('evaluateLocalOnlyGuard'), 'Binding must still evaluate the local-only guard.');
assert(bindingSrc.includes('LOCAL_ONLY_ALLOWED_HOSTNAMES'), 'Binding must still restrict to local-only hostnames.');
// ownerLocalKisIntegration=1 opt-in gate
assert(
  routeSrc.includes('ownerLocalKisIntegration') && /ownerLocalKisIntegration'\)\s*===\s*'1'/.test(routeSrc),
  'Route must still require the ownerLocalKisIntegration=1 opt-in gate.',
);
// deployed/production fail-closed
assert(
  kisClientSrc.includes("'vercel-production'") && kisClientSrc.includes('production_not_allowed'),
  'kisClient must still hard-block vercel-production / node-production runtimes.',
);
assert(
  bindingSrc.includes('deployed_environment_detected') && bindingSrc.includes('production_runtime_not_allowed'),
  'Binding must still fail closed on deployed/production runtimes.',
);
// current_price is the only market-data endpoint category
assert(
  bindingSrc.includes("ALLOWED_ENDPOINT_CATEGORIES = Object.freeze(['current_price'])"),
  'Binding must still allow current_price as the only market-data endpoint category.',
);
assert(routeSrc.includes("category: 'current_price'"), 'Route must still fix the endpoint category to current_price.');
// The fix itself: dual-source resolver present with a process.env fallback (preserves Node harness path)
assert(
  kisClientSrc.includes('readEnvValue') && /return process\.env\[name\]/.test(kisClientSrc),
  'kisClient must resolve env via readEnvValue with a process.env fallback.',
);

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
  ...ALLOWED_SOURCE_FILES,
  // Phase 3GG-K-ENV-HF5 sibling checker-compatibility tolerance (documented per this phase's work
  // order): this phase is the first in the K-ENV-HF family to legitimately change a source file
  // (kisClient.ts), so HF4's checker needed a small, documented patch to exclude kisClient.ts from
  // its zero-diff-vs-baseline assertion and to tolerate HF5's new files. Allow that sibling patch.
  'scripts/check_phase_3gg_k_env_hf4_contract.mjs',
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
  console.error(`Phase 3GG-K-ENV-HF5 check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-K-ENV-HF5 check PASS: ${assertions}/${assertions} assertions passed.`);
}
