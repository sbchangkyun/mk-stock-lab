import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const BASELINE = '3edc84b';
const PAGE = 'src/pages/chart-ai.astro';
const SMOKE = 'scripts/smoke_phase_3ff_a_ui_a_owner_local_deterministic_agent_ui_wiring.mjs';
const CHECKER = 'scripts/check_phase_3ff_a_ui_a_contract.mjs';
const RESULT = 'docs/planning/phase_3ff_a_ui_a_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';
const SP_A_SOURCE = 'src/lib/server/chart-ai/similar-pattern-agent.mjs';
const SP_A_FIXTURE = 'src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs';
const MK_A_SOURCE = 'src/lib/server/chart-ai/mk-agent.mjs';
const MK_A_FIXTURE = 'src/lib/server/chart-ai/mk-agent.fixture.mjs';

// Sibling checkers patched during Phase 3FF-A-UI-A so their own git-diff scope
// checks tolerate the chart-ai.astro diff. Tolerated here, not required.
const SIBLING_CHECKERS = [
  'scripts/check_phase_3fe_a_handoff_chart_ai_new_chat_package.mjs',
  'scripts/check_phase_3fe_a_manual_qa_result_contract.mjs',
  'scripts/check_phase_3fe_a_manual_qa_run_closeout_contract.mjs',
  'scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_contract.mjs',
  'scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_hf1_contract.mjs',
  'scripts/check_phase_3fe_a_manual_qa_run_closeout_hf1_contract.mjs',
  'scripts/check_phase_3fe_a_manual_qa_run_hf1_contract.mjs',
  'scripts/check_phase_3fe_a_manual_qa_run_result_contract.mjs',
  'scripts/check_phase_3fe_a_manual_qa_run_retry_contract.mjs',
  'scripts/check_phase_3ff_a_mk_a_contract.mjs',
  'scripts/check_phase_3ff_a_plan_contract.mjs',
  'scripts/check_phase_3ff_a_sp_a_contract.mjs',
];

// Phase 3FF-A-UI-B manual QA deliverables, tolerated here so this checker's
// git-diff scope check does not fail once UI-B's QA docs/checker exist on top
// of a32a52c. Tolerated here, not required.
const UI_B_TOLERATED_FILES = [
  'docs/planning/phase_3ff_a_ui_b_manual_qa_checklist_v0.1.md',
  'docs/planning/phase_3ff_a_ui_b_manual_qa_result_v0.1.md',
  'scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs',
];

// Phase 3FF-A-MK-B legitimately hardens the MK Agent source/fixture under
// src/lib/server/chart-ai and adds its own smoke/checker/result deliverables.
// Tolerated here, not required, so this checker's git-diff scope checks do
// not fail once MK-B's contract hardening exists on top of 3edc84b.
const MK_B_TOLERATED_FILES = [
  MK_A_SOURCE,
  MK_A_FIXTURE,
  'scripts/smoke_phase_3ff_a_mk_b_output_contract_hardening.mjs',
  'scripts/check_phase_3ff_a_mk_b_contract.mjs',
  'docs/planning/phase_3ff_a_mk_b_result_v0.1.md',
];

// Phase 3FF-A-SP-B legitimately hardens the Similar Pattern Agent
// source/fixture under src/lib/server/chart-ai and adds its own
// smoke/checker/result deliverables. Tolerated here, not required, so this
// checker's git-diff scope checks do not fail once SP-B's contract hardening
// exists on top of 3edc84b.
const SP_B_TOLERATED_FILES = [
  SP_A_SOURCE,
  SP_A_FIXTURE,
  'scripts/smoke_phase_3ff_a_sp_b_output_contract_hardening.mjs',
  'scripts/check_phase_3ff_a_sp_b_contract.mjs',
  'docs/planning/phase_3ff_a_sp_b_result_v0.1.md',
];

// Phase 3FF-A-MK-C's own deliverables, tolerated here so this checker's
// git-diff scope checks do not fail once MK-C's SP-B contract consumption
// pass exists (MK-C further edits MK_A_SOURCE/MK_A_FIXTURE, already
// tolerated via MK_B_TOLERATED_FILES above).
const MK_C_TOLERATED_FILES = [
  'scripts/smoke_phase_3ff_a_mk_c_sp_b_contract_consumption.mjs',
  'scripts/check_phase_3ff_a_mk_c_contract.mjs',
  'docs/planning/phase_3ff_a_mk_c_result_v0.1.md',
];

// Phase 3FF-A-UI-C manual QA deliverables, tolerated here so this checker's
// git-diff scope check does not fail once UI-C's QA docs/checker exist on top
// of 3edc84b. Tolerated here, not required.
const UI_C_TOLERATED_FILES = [
  'docs/planning/phase_3ff_a_ui_c_manual_qa_checklist_v0.1.md',
  'docs/planning/phase_3ff_a_ui_c_manual_qa_result_v0.1.md',
  'scripts/check_phase_3ff_a_ui_c_manual_qa_contract.mjs',
];

const CORE_DELIVERABLES = [PAGE, SMOKE, CHECKER, RESULT, CHANGELOG, PACKAGE_JSON];
const allowedFiles = new Set([...CORE_DELIVERABLES, ...SIBLING_CHECKERS, ...UI_B_TOLERATED_FILES, ...MK_B_TOLERATED_FILES, ...SP_B_TOLERATED_FILES, ...MK_C_TOLERATED_FILES, ...UI_C_TOLERATED_FILES]);

// Exact required forbidden-diff path list (Phase 3FF-A-UI-A task spec).
const REQUIRED_FORBIDDEN_DIFF_PATHS = [
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

const KNOWN_UNTOUCHED_PATHS = [
  '.agents/',
  '.vscode/settings.json',
  'docs/handoff/codex_state_inspection/',
  'skills-lock.json',
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

for (const file of [...CORE_DELIVERABLES, SP_A_SOURCE, SP_A_FIXTURE, MK_A_SOURCE, MK_A_FIXTURE]) {
  assert(exists(file), `${file} must exist.`);
}

const page = exists(PAGE) ? read(PAGE) : '';
const result = exists(RESULT) ? read(RESULT) : '';
const changelog = exists(CHANGELOG) ? read(CHANGELOG) : '';
const packageJson = exists(PACKAGE_JSON) ? JSON.parse(read(PACKAGE_JSON)) : {};

assert(
  packageJson.scripts?.['check:phase-3ff-a-ui-a'] === 'node scripts/check_phase_3ff_a_ui_a_contract.mjs',
  'check script must be exact.',
);
assert(
  packageJson.scripts?.['smoke:phase-3ff-a-ui-a'] ===
    'node scripts/smoke_phase_3ff_a_ui_a_owner_local_deterministic_agent_ui_wiring.mjs',
  'smoke script must be exact.',
);

// --- Owner-local gating structure markers ---
assert(page.includes("chartAiQuery.get('ownerLocalDeterministicAgents') === '1'"), 'page must gate behind explicit ownerLocalDeterministicAgents=1 opt-in.');
assert(page.includes('isLocalOwnerHostname()'), 'page must reuse the existing localhost guard helper.');
assert(
  page.includes('isLocalOwnerHostname() &&\n        ownerLocalDeterministicAgentsOptIn'),
  'deterministic agents panel must AND the localhost guard with the query opt-in.',
);
assert(
  page.includes("document.getElementById('chartAiOwnerLocalDeterministicAgentsPanel')"),
  'page must toggle the deterministic agents panel element by id.',
);
assert(page.includes('runSimilarPatternAgent'), 'page must reference runSimilarPatternAgent.');
assert(page.includes('createSimilarPatternFixtureInput'), 'page must reference createSimilarPatternFixtureInput.');
assert(page.includes('runMkAgent'), 'page must reference runMkAgent.');
assert(page.includes('createMkAgentFixtureInput'), 'page must reference createMkAgentFixtureInput.');
assert(
  page.includes('runSimilarPatternAgent(createSimilarPatternFixtureInput())'),
  'page must compute Similar Pattern result via deterministic fixture call.',
);
assert(page.includes('runMkAgent(createMkAgentFixtureInput())'), 'page must compute MK Agent result via deterministic fixture call.');
assert(
  page.includes("'../lib/server/chart-ai/similar-pattern-agent.mjs'"),
  'page must import Similar Pattern Agent from source module.',
);
assert(
  page.includes("'../lib/server/chart-ai/similar-pattern-agent.fixture.mjs'"),
  'page must import Similar Pattern Agent fixture from fixture module.',
);
assert(page.includes("'../lib/server/chart-ai/mk-agent.mjs'"), 'page must import MK Agent from source module.');
assert(page.includes("'../lib/server/chart-ai/mk-agent.fixture.mjs'"), 'page must import MK Agent fixture from fixture module.');

// --- Frontmatter-scoped forbidden runtime pattern check ---
// Astro frontmatter is server-side-only render code, delimited by the first
// matching `---` pair. Scoping to this block (rather than the whole file)
// avoids false positives against other, pre-existing owner-local panels'
// client-side <script> code (fetch/document/window usage elsewhere is
// legitimate and out of scope for this phase).
const frontmatterMatch = page.match(/^---\r?\n([\s\S]*?)\r?\n---/);
assert(frontmatterMatch !== null, 'page must have a parseable Astro frontmatter block.');
const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
const forbiddenFrontmatterPatterns = [
  'fetch(',
  'process.env',
  'createClient(',
  'createServerClient(',
  'Astro.cookies',
  'Astro.request.headers',
  'localStorage',
  'document.',
  'window.',
  'Math.random(',
  'Date.now(',
  'OPENAI_API_KEY',
  'appsecret',
  'access_token',
  'service_role',
];
for (const token of forbiddenFrontmatterPatterns) {
  assert(!frontmatter.includes(token), `frontmatter must not contain forbidden runtime token: ${token}`);
}
assert(!/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/.test(frontmatter), 'frontmatter must not include JWT-like values.');

// --- Required visible Korean strings, safety copy, mojibake and forbidden
// investment language, mirroring the smoke script's own content checks but
// scanning only the page (never this checker's or the smoke script's own
// pattern-definition source, which would otherwise self-match). ---
const requiredVisibleLabels = [
  'MK 에이전트',
  '전략 체크포인트',
  '오픈베타에서는 계정당 하루 3회까지 사용할 수 있어요.',
  '참고용',
  '매수·매도 추천이 아닙니다',
  '투자 자문이 아닙니다',
];
for (const text of requiredVisibleLabels) {
  assert(page.includes(text), `page must include required visible label: ${text}`);
}

const requiredSafetyCopy = [
  '이 결과는 fixture 기반 owner-local 검증용입니다.',
  '실제 KIS 데이터가 아닙니다.',
  'LLM을 호출하지 않습니다.',
  '투자 참고용이며 매수·매도 추천이 아닙니다.',
];
for (const text of requiredSafetyCopy) {
  assert(page.includes(text), `page must include required safety copy: ${text}`);
}

const mojibakePatterns = [
  '�',
  '?먯씠',
  '?꾨왂',
  '泥댄겕',
  '?ъ씤',
  '?쒖삤',
  '?덈쿋',
  '?쇱꽦',
  '留ㅼ닔',
  '紐⑺몴',
];
for (const token of mojibakePatterns) {
  assert(!page.includes(token), `page must not contain mojibake pattern: ${JSON.stringify(token)}`);
}

const forbiddenInvestmentLanguage = [
  '매수하세요',
  '매도하세요',
  '지금 진입',
  '목표가는',
  '손절가는',
  '강력 추천',
  '상승이 확정',
  '하락이 확정',
];
for (const token of forbiddenInvestmentLanguage) {
  assert(!page.includes(token), `page must not contain forbidden investment language: ${token}`);
}

// --- Known pre-existing untracked clutter must remain untouched ---
const cachedDiff = gitLines(['diff', '--cached', '--name-only', BASELINE]);
const trackedDiff = gitLines(['diff', '--name-only', BASELINE]);
for (const knownPath of KNOWN_UNTOUCHED_PATHS) {
  assert(
    !trackedDiff.some((file) => file === knownPath || file.startsWith(knownPath)),
    `${knownPath} must not appear in tracked diff vs baseline.`,
  );
  assert(
    !cachedDiff.some((file) => file === knownPath || file.startsWith(knownPath)),
    `${knownPath} must not be staged for commit.`,
  );
}

// --- Overall change-scope check (mirrors sibling checker convention) ---
const changedFiles = trackedDiff;
const statusChanged = runGit(['status', '--porcelain', '-uall'])
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => line.slice(3).trim())
  .filter((file) => allowedFiles.has(file));
const allChanged = [...new Set([...changedFiles, ...statusChanged])];
const unexpected = allChanged.filter((file) => !allowedFiles.has(file));
assert(unexpected.length === 0, `Only Phase 3FF-A-UI-A files may change. Unexpected: ${unexpected.join(', ')}`);
for (const file of CORE_DELIVERABLES) {
  assert(allChanged.includes(file), `Changed files must include ${file}.`);
}

// --- Required diff checks (exact commands from the Phase 3FF-A-UI-A task spec) ---
const forbiddenDiff = gitLines(['diff', '--name-only', BASELINE, '--', ...REQUIRED_FORBIDDEN_DIFF_PATHS]);
assert(forbiddenDiff.length === 0, `Forbidden pages/api|components|supabase|src/data|lockfile|env diff must be empty. Found: ${forbiddenDiff.join(', ')}`);

const allowedUiDiff = gitLines(['diff', '--name-only', BASELINE, '--', 'src/pages']);
assert(
  allowedUiDiff.length === 1 && allowedUiDiff[0] === PAGE,
  `Allowed UI diff must show exactly ${PAGE}. Found: ${allowedUiDiff.join(', ')}`,
);

const allowedSourceDiff = gitLines(['diff', '--name-only', BASELINE, '--', 'src/lib/server/chart-ai']);
const unexpectedSourceDiff = allowedSourceDiff.filter((file) => !allowedFiles.has(file));
assert(
  unexpectedSourceDiff.length === 0,
  `Allowed source diff under src/lib/server/chart-ai must be empty except explicitly tolerated later-phase files. Found: ${unexpectedSourceDiff.join(', ')}`,
);

// Defense in depth: no file anywhere under src/lib/server may change beyond
// explicitly tolerated later-phase files (still covers KIS provider modules
// and the SP-A engine/fixture source directly, since only MK-B's exact
// mk-agent.mjs/mk-agent.fixture.mjs pair is tolerated above).
const serverLibDiff = gitLines(['diff', '--name-only', BASELINE, '--', 'src/lib/server']);
const unexpectedServerLibDiff = serverLibDiff.filter((file) => !allowedFiles.has(file));
assert(
  unexpectedServerLibDiff.length === 0,
  `src/lib/server must not change beyond explicitly tolerated later-phase files (KIS provider modules, SP-A source stay off-limits). Found: ${unexpectedServerLibDiff.join(', ')}`,
);

// --- Result doc and changelog required content ---
for (const token of [
  'Phase 3FF-A-UI-A',
  'Baseline: `3edc84b`',
  'No live KIS',
  'No LLM',
  'No API route',
  'No deploy',
  'No push',
  'ownerLocalDeterministicAgents=1',
  'localhost',
]) {
  assert(result.includes(token), `result doc must include: ${token}`);
}

assert(changelog.includes('## Phase 3FF-A-UI-A - 2026-07-08'), 'changelog must include the Phase 3FF-A-UI-A entry header.');
// Later QA/hardening-only phases (no runtime/API/UI change) legitimately
// prepend their own entries above this one. Tolerate exactly this known
// allowlist of headers above the UI-A entry, in any order/count; any other
// header there would mean the changelog was reordered/corrupted by something
// other than an expected follow-up phase.
const TOLERATED_HEADERS_ABOVE_UI_A = ['## Phase 3FF-A-SP-B - 2026-07-08', '## Phase 3FF-A-UI-B - 2026-07-08', '## Phase 3FF-A-MK-B - 2026-07-08', '## Phase 3FF-A-MK-C - 2026-07-08', '## Phase 3FF-A-UI-C - 2026-07-09'];
const uiAEntryIndex = changelog.indexOf('## Phase 3FF-A-UI-A - 2026-07-08');
const headersAboveUiA = changelog.slice(0, uiAEntryIndex).match(/^## .+$/gm) ?? [];
assert(
  headersAboveUiA.every((header) => TOLERATED_HEADERS_ABOVE_UI_A.includes(header)),
  'changelog Phase 3FF-A-UI-A entry must be at the top, tolerating only a known allowlist of later-phase entries above it.',
);

// --- Smoke script must pass ---
execFileSync('node', [SMOKE], { stdio: 'pipe' });
assert(true, 'smoke script must pass when required by checker.');

console.log(
  failures.length
    ? `Phase 3FF-A-UI-A check FAILED: ${failures.length}/${assertions} assertions failed.`
    : `Phase 3FF-A-UI-A check passed: ${assertions}/${assertions} assertions passed.`,
);

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
