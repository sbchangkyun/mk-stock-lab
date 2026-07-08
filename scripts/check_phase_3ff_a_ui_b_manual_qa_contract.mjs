import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const BASELINE = 'a32a52c';
const CHECKLIST = 'docs/planning/phase_3ff_a_ui_b_manual_qa_checklist_v0.1.md';
const RESULT = 'docs/planning/phase_3ff_a_ui_b_manual_qa_result_v0.1.md';
const CHECKER = 'scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

// Sibling checkers patched during Phase 3FF-A-UI-B so their own git-diff
// scope checks tolerate this phase's new files existing on top of a32a52c.
const PATCHED_SIBLING_CHECKERS = [
  'scripts/check_phase_3ff_a_ui_a_contract.mjs',
  'scripts/check_phase_3ff_a_mk_a_contract.mjs',
  'scripts/check_phase_3ff_a_sp_a_contract.mjs',
  'scripts/check_phase_3ff_a_plan_contract.mjs',
];

const CORE_DELIVERABLES = [CHECKLIST, RESULT, CHECKER, CHANGELOG, PACKAGE_JSON];
const allowedFiles = new Set([...CORE_DELIVERABLES, ...PATCHED_SIBLING_CHECKERS]);

const KNOWN_UNTOUCHED_PATHS = ['.agents/', '.vscode/settings.json', 'docs/handoff/codex_state_inspection/', 'skills-lock.json'];

// Exact required forbidden-diff path list for Phase 3FF-A-UI-B. Unlike
// Phase 3FF-A-UI-A, this phase must NOT touch chart-ai.astro at all — it is
// QA/documentation only, so the page itself is explicitly in this list.
const REQUIRED_FORBIDDEN_DIFF_PATHS = [
  'src/pages/chart-ai.astro',
  'pages/api',
  'src/pages/api',
  'components',
  'src/lib/server/chart-ai',
  'supabase',
  'src/data',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.env',
  '.env.local',
];

let assertions = 0;
const failures = [];
const assert = (condition, message) => {
  assertions += 1;
  if (!condition) failures.push(message);
};

const exists = (file) => fs.existsSync(file);
const read = (file) => fs.readFileSync(file, 'utf8');
const runGit = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const gitLines = (args) => runGit(args).split(/\r?\n/).filter(Boolean);

// --- 1. Required files exist ---
for (const file of CORE_DELIVERABLES) {
  assert(exists(file), `${file} must exist.`);
}

const checklist = exists(CHECKLIST) ? read(CHECKLIST) : '';
const result = exists(RESULT) ? read(RESULT) : '';
const checkerSelf = exists(CHECKER) ? read(CHECKER) : '';
const changelog = exists(CHANGELOG) ? read(CHANGELOG) : '';
const packageJson = exists(PACKAGE_JSON) ? JSON.parse(read(PACKAGE_JSON)) : {};

// --- 2. package.json script exact ---
assert(
  packageJson.scripts?.['check:phase-3ff-a-ui-b-manual-qa'] === 'node scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs',
  'package.json must contain the exact check:phase-3ff-a-ui-b-manual-qa script.',
);

// --- 3. Checklist/result docs must include the 10 required tokens ---
const REQUIRED_TOKENS = [
  'Phase 3FF-A-UI-B',
  'a32a52c',
  'ownerLocalDeterministicAgents=1',
  'chartAiOwnerLocalDeterministicAgentsPanel',
  'MK 에이전트',
  '전략 체크포인트',
  'No live KIS',
  'No LLM',
  'No public/beta activation',
  'default /chart-ai unchanged',
];
for (const token of REQUIRED_TOKENS) {
  assert(checklist.includes(token), `checklist doc must include required token: ${token}`);
  assert(result.includes(token), `result doc must include required token: ${token}`);
}

// --- 4. Changelog must include the Phase 3FF-A-UI-B entry, at the top ---
assert(changelog.includes('## Phase 3FF-A-UI-B - 2026-07-08'), 'changelog must include the Phase 3FF-A-UI-B entry header.');
const firstEntryIndex = changelog.indexOf('\n## ');
assert(
  firstEntryIndex !== -1 && changelog.startsWith('## Phase 3FF-A-UI-B - 2026-07-08', firstEntryIndex + 1),
  'changelog Phase 3FF-A-UI-B entry must be the first ## entry (at the very top, below the H1 title).',
);

// --- 5. Only allowed files may have changed since baseline ---
const changedFiles = gitLines(['diff', '--name-only', BASELINE]);
const statusChanged = runGit(['status', '--porcelain', '-uall'])
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => line.slice(3).trim())
  .filter((file) => allowedFiles.has(file));
const allChanged = [...new Set([...changedFiles, ...statusChanged])];
const unexpected = allChanged.filter((file) => !allowedFiles.has(file));
assert(unexpected.length === 0, `Only Phase 3FF-A-UI-B files may change. Unexpected: ${unexpected.join(', ')}`);
for (const file of CORE_DELIVERABLES) {
  assert(allChanged.includes(file), `Changed files must include ${file}.`);
}

for (const knownPath of KNOWN_UNTOUCHED_PATHS) {
  assert(
    !changedFiles.some((file) => file === knownPath || file.startsWith(knownPath)),
    `${knownPath} must not appear in tracked diff vs baseline.`,
  );
}

// --- 6. Forbidden paths must be unchanged, including chart-ai.astro itself ---
const forbiddenDiff = gitLines(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]);
assert(forbiddenDiff.length === 0, `Forbidden diff must be empty. Found: ${forbiddenDiff.join(', ')}`);

// --- 7. No mojibake pattern in the new docs/checker ---
// Fragments are built from numeric code points via String.fromCharCode so
// this checker's own raw source text (read back via fs.readFileSync, never
// evaluated) cannot self-match: the source only ever contains ASCII digits,
// never the actual corrupted characters, while the runtime array value still
// equals the real corrupted-character fragments for comparison against docs.
const mojibakePatterns = [
  String.fromCharCode(65533),
  String.fromCharCode(63, 47663, 50464),
  String.fromCharCode(63, 44968, 50754),
  String.fromCharCode(27877, 45828, 44181),
  String.fromCharCode(63, 1098, 50468),
  String.fromCharCode(63, 50326, 49316),
  String.fromCharCode(63, 45896, 53195),
  String.fromCharCode(63, 49649, 44902),
  String.fromCharCode(30041, 12668, 45780),
  String.fromCharCode(32016, 9338, 47796),
];
for (const [label, text] of [
  ['checklist', checklist],
  ['result', result],
  ['checker', checkerSelf],
]) {
  for (const token of mojibakePatterns) {
    assert(!text.includes(token), `${label} must not contain mojibake pattern.`);
  }
}

// --- 8. No forbidden investment language as approved output language ---
const forbiddenInvestmentLanguage = ['매수하세요', '매도하세요', '지금 진입', '목표가는', '손절가는', '강력 추천', '상승이 확정', '하락이 확정'];
for (const [label, text] of [
  ['checklist', checklist],
  ['result', result],
]) {
  for (const token of forbiddenInvestmentLanguage) {
    assert(!text.includes(token), `${label} must not contain forbidden investment language: ${token}`);
  }
}

// --- 9. Result doc must not claim full visual PASS unless full visual/manual
// browser evidence is explicitly recorded ---
const statusSection = result.match(/## 1\. Status\r?\n+([\s\S]*?)(?=\r?\n## )/)?.[1] ?? '';
const claimsExecuted = /\bExecuted\b/.test(statusSection);
const claimsPartial = /\bPartial\b/.test(statusSection);
assert(claimsExecuted || claimsPartial || /\bBlocked\b|\bFailed\b/.test(statusSection), 'result doc Section 1 must declare a recognized Status (Executed, Partial, Blocked, or Failed).');
if (claimsExecuted) {
  const VISUAL_EVIDENCE_MARKERS = ['boundingBox', 'scrollWidth', 'clientWidth', 'screenshot'];
  const hasVisualEvidence = VISUAL_EVIDENCE_MARKERS.every((marker) => result.includes(marker));
  assert(
    hasVisualEvidence,
    'result doc claims Executed (full PASS) but does not record explicit visual/manual browser evidence (boundingBox/scrollWidth/clientWidth/screenshot markers).',
  );
  assert(result.includes('1280') && result.includes('375'), 'result doc claims Executed but does not record both PC (1280) and mobile (375) viewport measurements.');
  assert(!claimsPartial, 'result doc Section 1 must not simultaneously claim Executed and Partial.');
}

// --- 10. Report ---
console.log(
  failures.length
    ? `Phase 3FF-A-UI-B manual QA check FAILED: ${failures.length}/${assertions} assertions failed.`
    : `Phase 3FF-A-UI-B manual QA check passed: ${assertions}/${assertions} assertions passed.`,
);

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
