// Phase 3GG-K-ENV-HF3 contract checker.
// Verifies the HF3 result doc, HF3 diagnostic script, and package.json/changelog wiring are
// present, that the new provider network diagnostic script is safe (owner-approval gated, never
// reads .env/.env.local directly, never prints a raw env value, never prints KIS_BASE_URL raw,
// never prints currentPrice/volume numeric values, never attaches Authorization headers, never
// references an order/account/balance/funds/portfolio/trading/personal endpoint), that .env/
// .env.local were never staged or committed, and that this phase introduced no source feature
// diff, no KIS provider diff, no forbidden diff, and no lockfile diff, measured against the
// Phase 3GG-K-ENV-HF2 baseline.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '8c31b1b';

const DIAGNOSTIC_SCRIPT = 'scripts/owner_diagnostic_phase_3gg_k_env_hf3_kis_provider_network_readiness.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_k_env_hf3_kis_provider_network_base_url_diagnostic_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3gg_k_env_hf3_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [RESULT_DOC, DIAGNOSTIC_SCRIPT, CHECKER_SELF];

const OWNER_APPROVAL_FLAG = '--owner-approved-kis-provider-network-diagnostic';

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
];

const REQUIRED_FORBIDDEN_DIFF_SOURCE_FILES = [
  'scripts/owner_diagnostic_phase_3gg_k_env_hf1_kis_runtime_readiness.mjs',
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

const RESULT_DOC_REQUIRED_TOKENS = [
  'baseUrlPresent',
  'baseUrlParseOk',
  'dnsLookupOk',
  'tcpConnectOk',
  'tlsHandshakeOk',
  'httpBaseProbeStatusClass',
  'currentPricePresent',
  'volumePresent',
  'Classification',
  'Owner-safe next action',
  'Not pushed',
  'Not deployed',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-K-ENV-HF3 - 2026-07-11',
  'Owner-local KIS Provider Network/Base URL Diagnostic',
  'Builds on Phase 3GG-K-ENV-HF2',
  'Diagnoses the provider network/base URL blocker after env-missing was resolved',
  'Adds an owner-gated provider network diagnostic script',
  'Does not print KIS_BASE_URL raw value',
  'Does not print .env/.env.local contents',
  'Does not modify .env/.env.local',
  'Does not stage or commit .env/.env.local',
  'Uses only sanitized DNS/TCP/TLS/HTTP status classes',
  'Uses the existing local current_price route for the only market-data endpoint check',
  'No source feature changes',
  'No UI change',
  'No H route change',
  'No LLM bridge change',
  'No model policy change',
  'No KIS provider change',
  'No KIS endpoint expansion',
  'current_price only',
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
  pkg.scripts && pkg.scripts['owner-diagnostic:phase-3gg-k-env-hf3'] === `node ${DIAGNOSTIC_SCRIPT}`,
  'package.json is missing the exact "owner-diagnostic:phase-3gg-k-env-hf3" script entry',
);
assert(
  pkg.scripts && pkg.scripts['check:phase-3gg-k-env-hf3'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-k-env-hf3" script entry',
);

// --- 3. New diagnostic script safety checks ---
const diagSrc = exists(DIAGNOSTIC_SCRIPT) ? read(DIAGNOSTIC_SCRIPT) : '';
// Code-only, detection-pattern-stripped view: removes `//` comment lines (which document what the
// script does NOT do, e.g. "never attaches an Authorization header") and removes the two
// FORBIDDEN_*_PATTERN regex constants (defensive credential/payload leak *detectors* applied to
// inbound response text, not outbound usage) so neither trips a usage-pattern check below.
const diagCodeOnly = diagSrc
  .replace(/const FORBIDDEN_RAW_PAYLOAD_PATTERN[\s\S]*?;\n/, '')
  .replace(/const FORBIDDEN_CREDENTIAL_PATTERN[\s\S]*?;\n/, '')
  .split('\n')
  .filter((line) => !line.trim().startsWith('//'))
  .join('\n');
assert(diagSrc.includes(OWNER_APPROVAL_FLAG), 'Diagnostic script must require the explicit owner-approval CLI flag.');
assert(!/readFileSync\(.*\.env/.test(diagSrc), 'Diagnostic script must not read .env/.env.local directly.');
assert(!/['"]\.env(\.local)?['"]/.test(diagSrc), 'Diagnostic script must not reference a .env/.env.local file path.');
assert(
  !/(console\.log|logSanitized)\([^)]*process\.env/.test(diagSrc),
  'Diagnostic script must not print a process.env value directly.',
);
assert(
  !/\$\{rawBaseUrlValue\}|\$\{parsedUrl\.href\}|\$\{parsedUrl\.toString\(\)\}|\$\{parsedUrl\}/.test(diagSrc),
  'Diagnostic script must never print the raw KIS_BASE_URL value.',
);
assert(
  !/\$\{currentPrice\}|\$\{context\.currentPrice\}/.test(diagSrc),
  'Diagnostic script must never interpolate the actual currentPrice value into a printed message.',
);
assert(
  !/\$\{volume\}|\$\{context\.volume\}/.test(diagSrc),
  'Diagnostic script must never interpolate the actual volume value into a printed message.',
);
assert(!/Authorization|Bearer/i.test(diagCodeOnly), 'Diagnostic script must never attach an Authorization header.');
assert(
  !/appkey|appsecret|access_token/i.test(diagCodeOnly),
  'Diagnostic script must never attach a KIS app key/secret/access token.',
);
assert(
  !/\/order\b|\/account\b|\/balance\b|\/funds\b|\/portfolio\b|\/trading\b|\/personal\b/i.test(diagCodeOnly),
  'Diagnostic script must never reference an order/account/balance/funds/portfolio/trading/personal endpoint.',
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
assert(
  !/currentPrice["`']?\s*[:=]\s*\d/.test(resultDoc),
  'Result doc must never contain a literal currentPrice numeric value.',
);
assert(
  !/volume["`']?\s*[:=]\s*\d/.test(resultDoc),
  'Result doc must never contain a literal volume numeric value.',
);
assert(
  !/KIS_APP_KEY\s*=\s*[^\s`]|KIS_APP_SECRET\s*=\s*[^\s`]|KIS_BASE_URL\s*=\s*https?:\/\/\S/.test(resultDoc),
  'Result doc must never contain a literal KIS_APP_KEY/KIS_APP_SECRET/KIS_BASE_URL value.',
);

// --- 5. Changelog entry present, prepended above the K-ENV-HF2 entry ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-K-ENV-HF3 - 2026-07-11');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-K-ENV-HF3 entry header');
const changelogSection =
  changelogHeaderIndex === -1 ? '' : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
const hf2HeaderIndex = changelog.indexOf('## Phase 3GG-K-ENV-HF2 - 2026-07-11');
assert(
  hf2HeaderIndex === -1 || (changelogHeaderIndex !== -1 && changelogHeaderIndex < hf2HeaderIndex),
  'Phase 3GG-K-ENV-HF3 changelog entry must be prepended above the Phase 3GG-K-ENV-HF2 entry',
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
assert(
  runGit(['ls-files', '--', '.env', '.env.local']).trim() === '',
  '.env/.env.local must never be tracked/committed.',
);
let stagedFiles = [];
try {
  stagedFiles = runGit(['diff', '--cached', '--name-only'])
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
} catch {
  stagedFiles = [];
}
assert(
  !stagedFiles.includes('.env') && !stagedFiles.includes('.env.local'),
  '.env/.env.local must never be staged for commit.',
);

// --- 10. No unexpected working-tree changes outside this phase's scope ---
const ALLOWED_MODIFIED_FILES = new Set([
  ...CORE_DELIVERABLES,
  CHANGELOG,
  PACKAGE_JSON,
  // Phase 3GG-K-ENV-HF3 sibling checker-compatibility tolerance (documented per this phase's
  // work order): HF2's checker's working-tree-purity scan required a small, documented
  // ALLOWED_MODIFIED_FILES patch to tolerate HF3's new files. Allow that sibling patch here too.
  'scripts/check_phase_3gg_k_env_hf2_contract.mjs',
  // Phase 3GG-K-ENV-HF4 sibling checker-compatibility tolerance (documented per that phase's
  // work order): HF4 added its own new deliverables (auth/token diagnostic script, checker,
  // result doc); tolerate their presence in HF3's working-tree-purity scan.
  'docs/planning/phase_3gg_k_env_hf4_kis_provider_auth_token_diagnostic_result_v0.1.md',
  'scripts/owner_diagnostic_phase_3gg_k_env_hf4_kis_provider_auth_token_readiness.mjs',
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
  console.error(`Phase 3GG-K-ENV-HF3 check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-K-ENV-HF3 check PASS: ${assertions}/${assertions} assertions passed.`);
}
