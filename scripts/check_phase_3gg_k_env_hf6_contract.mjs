// Phase 3GG-K-ENV-HF6 contract checker.
// Verifies the HF6 result doc, HF6 LLM runtime-env diagnostic script, and package.json/changelog
// wiring are present; that the diagnostic script is safe (owner-approval gated, never reads
// .env/.env.local directly, never prints a process.env/import.meta.env value, OPENAI_API_KEY, a model
// name, a prompt, a raw OpenAI request/response, or a currentPrice/volume numeric value, never
// references an order/account/balance/funds/portfolio/trading/personal endpoint); that this phase's
// SOURCE diff is limited to the three allowed owner-local LLM files and introduces no forbidden
// source diff and no lockfile diff; that the local-only guard, the ownerLocalKisLlm=1 gate, the
// deployed/production fail-closed logic, current_price-only KIS scope, and the no-prompt-rewrite /
// no-model-name-exposure invariants remain intact; and that .env/.env.local were never staged or
// committed. Diff checks are measured against the Phase 3GG-K-QA-OWNER-RERUN-2 baseline (536450e).
//
// Like the HF4/HF5 checkers, this checker isolates the diagnostic script's *print* call sites and
// asserts only those never interpolate a raw env/response/model/numeric value, and asserts the
// printed `report` object literal is built exclusively from the allowed sanitized field list.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '536450e';

const DIAGNOSTIC_SCRIPT = 'scripts/owner_diagnostic_phase_3gg_k_env_hf6_llm_runtime_env_readiness.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_k_env_hf6_llm_runtime_readiness_result_v0.1.md';
const CHECKER_SELF = 'scripts/check_phase_3gg_k_env_hf6_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const CORE_DELIVERABLES = [RESULT_DOC, DIAGNOSTIC_SCRIPT, CHECKER_SELF];

const OWNER_APPROVAL_FLAG = '--owner-approved-llm-runtime-env-diagnostic';

// Source files this phase is explicitly authorized to modify with a minimal diff.
const ALLOWED_SOURCE_FILES = [
  'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts',
  'src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs',
  'src/lib/server/chart-ai/local-only-llm-model-policy.mjs',
];

const LLM_SUMMARY_ROUTE = 'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts';
const BINDING_MODULE = 'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs';

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.claude/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
];

// Source files that must remain zero-diff vs the baseline (536450e) this phase.
const REQUIRED_FORBIDDEN_DIFF_SOURCE_FILES = [
  'src/lib/server/providers/kisClient.ts',
  'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs',
  'src/pages/api/chart-ai/local-only-kis-current-price.json.ts',
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
  'llmDisabled',
  'llmCallFailed',
  'llmEnvEvidenceKind',
  'suspectedRuntimeEnvMismatch',
  'finalClassification',
];

// Raw-value interpolations that must never appear inside a print-call argument.
const FORBIDDEN_PRINT_INTERPOLATION_PATTERNS = [
  /\$\{process\.env/,
  /\$\{getImportMetaEnv/,
  /\$\{summaryText\}/,
  /\$\{summary\}/,
  /\$\{summary\./,
  /\$\{summaryLines\}/,
  /\$\{probe\}/,
  /\$\{probe\./,
  /\$\{parsed\}/,
  /\$\{parsed\./,
  /\$\{rawText\}/,
  /\$\{rawBody\}/,
  /OPENAI_API_KEY/,
  /Bearer\s+\$\{/,
  /authorization["']?\s*:\s*\$\{/i,
];

const RESULT_DOC_REQUIRED_TOKENS = [
  'LLM_DISABLED',
  'CHART_AI_ENABLE_LOCAL_LLM runtime env mismatch',
  'summaryOk',
  'sourceStatus',
  'llmStatus',
  'sanitizedErrorCode',
  'currentPricePresent',
  'volumePresent',
  'summaryTextPresent',
  'requiredLabelsPresent',
  'asciiDigitPresentInSummary',
  'forbiddenInvestmentPhrasePresent',
  'llmEnvEvidenceKind',
  'suspectedRuntimeEnvMismatch',
  'Classification',
  'Owner-safe next action',
  'Not pushed',
  'Not deployed',
];

const CHANGELOG_REQUIRED_TOKENS = [
  '## Phase 3GG-K-ENV-HF6 - 2026-07-11',
  'LLM Runtime Readiness Rerun or Safe Diagnostics',
  'Builds on Phase 3GG-K-QA-OWNER-RERUN-2',
  'KIS side is confirmed working through the H route',
  'Diagnoses the LLM_DISABLED blocker',
  'Adds an owner-gated LLM runtime env diagnostic script',
  'import.meta.env-first / process.env-fallback env resolver',
  'Does not print OPENAI_API_KEY',
  'Does not print model names',
  'Does not print prompt text',
  'Does not print raw OpenAI request or response',
  'Does not print currentPrice/volume numeric values',
  'Does not print .env/.env.local contents',
  'Does not modify .env/.env.local',
  'Does not stage or commit .env/.env.local',
  'Preserves localhost-only guard',
  'Preserves ownerLocalKisLlm=1 gate',
  'Preserves deployed/production fail-closed behavior',
  'No UI change',
  'No prompt rewrite',
  'No summary contract rewrite',
  'No KIS provider change',
  'No current_price route change',
  'No KIS endpoint expansion',
  'current_price only for KIS market data',
  'No public/beta/internal QA activation',
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
for (const file of [...CORE_DELIVERABLES, CHANGELOG, PACKAGE_JSON, LLM_SUMMARY_ROUTE]) {
  assert(exists(file), `Required file missing: ${file}`);
}

// --- 2. package.json script wiring ---
const pkg = JSON.parse(read(PACKAGE_JSON));
assert(
  pkg.scripts && pkg.scripts['owner-diagnostic:phase-3gg-k-env-hf6'] === `node ${DIAGNOSTIC_SCRIPT}`,
  'package.json is missing the exact "owner-diagnostic:phase-3gg-k-env-hf6" script entry',
);
assert(
  pkg.scripts && pkg.scripts['check:phase-3gg-k-env-hf6'] === `node ${CHECKER_SELF}`,
  'package.json is missing the exact "check:phase-3gg-k-env-hf6" script entry',
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
assert(
  !/(console\.log|logSanitized)\([^)]*import\.meta\.env/.test(diagSrc),
  'Diagnostic script must not print an import.meta.env value directly.',
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

// Strip `//` documentary comment lines before scanning for actual forbidden endpoint path usage in
// code (same technique as the HF3/HF4/HF5 checkers).
const diagCodeOnly = diagSrc
  .split('\n')
  .filter((line) => !line.trim().startsWith('//'))
  .join('\n');
assert(
  !/\/order\b|\/account\b|\/balance\b|\/funds\b|\/portfolio\b|\/trading\b|\/personal\b/i.test(diagCodeOnly),
  'Diagnostic script must never reference an order/account/balance/funds/portfolio/trading/personal endpoint.',
);
// The diagnostic must call OpenAI/KIS only through the existing H route -- no direct provider call.
assert(!/api\.openai\.com|\/v1\/chat\/completions|\/v1\/responses/i.test(diagCodeOnly), 'Diagnostic script must not call OpenAI directly.');
assert(!/oauth2\/tokenP|inquire-price/i.test(diagCodeOnly), 'Diagnostic script must not call KIS directly.');
assert(
  diagSrc.includes('/api/chart-ai/local-only-kis-llm-summary.json'),
  'Diagnostic script must probe only the existing owner-local LLM summary H route.',
);

// --- 4. Result doc required content ---
const resultDoc = exists(RESULT_DOC) ? read(RESULT_DOC) : '';
for (const token of RESULT_DOC_REQUIRED_TOKENS) {
  assert(resultDoc.includes(token), `Result doc missing required token: ${token}`);
}
assert(
  !/OPENAI_API_KEY\s*=\s*sk-|Authorization:\s*Bearer\s+\S|sk-[A-Za-z0-9]{10}/.test(resultDoc),
  'Result doc must never contain a raw OpenAI key or Authorization header value.',
);
assert(!/currentPrice["`']?\s*[:=]\s*\d/.test(resultDoc), 'Result doc must never contain a literal currentPrice numeric value.');
assert(!/volume["`']?\s*[:=]\s*\d/.test(resultDoc), 'Result doc must never contain a literal volume numeric value.');
assert(
  !/KIS_APP_KEY\s*=\s*[^\s`]|KIS_APP_SECRET\s*=\s*[^\s`]|KIS_BASE_URL\s*=\s*https?:\/\/\S/.test(resultDoc),
  'Result doc must never contain a literal KIS_APP_KEY/KIS_APP_SECRET/KIS_BASE_URL value.',
);

// --- 5. Changelog entry present, prepended above the K-QA-OWNER-RERUN-2 entry ---
const changelog = read(CHANGELOG);
const changelogHeaderIndex = changelog.indexOf('## Phase 3GG-K-ENV-HF6 - 2026-07-11');
assert(changelogHeaderIndex !== -1, 'planning_changelog.md is missing the Phase 3GG-K-ENV-HF6 entry header');
const changelogSection =
  changelogHeaderIndex === -1 ? '' : changelog.slice(changelogHeaderIndex, changelog.indexOf('\n## ', changelogHeaderIndex + 1));
for (const token of CHANGELOG_REQUIRED_TOKENS) {
  assert(changelogSection.includes(token), `Changelog entry missing required token: ${token}`);
}
const rerun2HeaderIndex = changelog.indexOf('## Phase 3GG-K-QA-OWNER-RERUN-2 - 2026-07-11');
assert(
  rerun2HeaderIndex === -1 || (changelogHeaderIndex !== -1 && changelogHeaderIndex < rerun2HeaderIndex),
  'Phase 3GG-K-ENV-HF6 changelog entry must be prepended above the Phase 3GG-K-QA-OWNER-RERUN-2 entry',
);

// --- 6. Source diff is limited to the allowed owner-local LLM files ---
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

// --- 8. Guards preserved: local-only, ownerLocalKisLlm=1, fail-closed, current_price only, no prompt rewrite ---
const llmRouteSrc = exists(LLM_SUMMARY_ROUTE) ? read(LLM_SUMMARY_ROUTE) : '';
const bindingSrc = exists(BINDING_MODULE) ? read(BINDING_MODULE) : '';

assert(llmRouteSrc.includes('resolveLocalHostname'), 'H route must still resolve/require a local hostname.');
assert(
  llmRouteSrc.includes('ownerLocalKisLlm') && /ownerLocalKisLlm'\)\s*===\s*'1'/.test(llmRouteSrc),
  'H route must still require the ownerLocalKisLlm=1 opt-in gate.',
);
assert(
  llmRouteSrc.includes('blockedSummaryResponse') && llmRouteSrc.includes('NON_LOCAL_REQUEST'),
  'H route must still fail closed to a sanitized blocked summary on non-local/opt-out requests.',
);
assert(llmRouteSrc.includes("category: 'current_price'"), 'H route must still fix the market-data category to current_price.');
// The fix itself: dual-source resolver present with a process.env fallback.
assert(
  llmRouteSrc.includes('readServerEnvValue') && /return process\.env\[name\]/.test(llmRouteSrc),
  'H route must resolve LLM env via readServerEnvValue with a process.env fallback.',
);
// No prompt rewrite / no model-name exposure: the route must not embed a hardcoded prompt or model
// literal (prompts live in the bridge; models resolve via policy from env). Guard against obvious
// prompt/model literals sneaking into the route.
assert(!/systemPrompt\s*[:=]\s*["'`]/.test(llmRouteSrc), 'H route must not embed a prompt literal (no prompt rewrite).');
assert(
  bindingSrc.includes("ALLOWED_ENDPOINT_CATEGORIES = Object.freeze(['current_price'])"),
  'Binding must still allow current_price as the only KIS market-data endpoint category.',
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
  // Phase 3GG-K-ENV-HF6 sibling checker-compatibility tolerance (documented): this phase applies the
  // authorized minimal LLM runtime-env fix to the LLM summary route, which RERUN-2's checker guarded
  // as zero-diff; that sibling checker needed a small, documented patch to exclude the route and
  // tolerate HF6's new files. Allow that sibling patch here too.
  'scripts/check_phase_3gg_k_qa_owner_rerun_2_contract.mjs',
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

// --- 11. No deploy/push/activation marker in the new doc ---
{
  const src = exists(RESULT_DOC) ? read(RESULT_DOC) : '';
  assert(!/vercel deploy|git push/i.test(src), `${RESULT_DOC} must not contain a deploy/push marker.`);
  assert(
    !/publicActivation|betaActivation|internalQaActivation|PUBLIC_ACTIVATION=1|BETA_ACTIVATION=1/.test(src),
    `${RESULT_DOC} must not contain an activation token.`,
  );
}

// --- 12. Final result ---
if (failures.length) {
  console.error(`Phase 3GG-K-ENV-HF6 check FAIL: ${assertions - failures.length}/${assertions} assertions passed.`);
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3GG-K-ENV-HF6 check PASS: ${assertions}/${assertions} assertions passed.`);
}
