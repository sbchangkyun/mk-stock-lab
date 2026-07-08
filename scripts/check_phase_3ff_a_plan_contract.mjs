import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const BASELINE = 'bd8ebd3';
const SP_DOC = 'docs/planning/phase_3ff_a_plan_similar_pattern_agent_design_v0.1.md';
const MK_DOC = 'docs/planning/phase_3ff_a_plan_mk_agent_design_v0.1.md';
const RESULT_DOC = 'docs/planning/phase_3ff_a_plan_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const CHECKER = 'scripts/check_phase_3ff_a_plan_contract.mjs';
const PACKAGE_JSON = 'package.json';
const EVIDENCE_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_contract.mjs';
const CLOSEOUT_HF1_CHECKER = 'scripts/check_phase_3fe_a_manual_qa_run_closeout_hf1_contract.mjs';

const allowedFiles = new Set([
  SP_DOC,
  MK_DOC,
  RESULT_DOC,
  CHANGELOG,
  CHECKER,
  EVIDENCE_CHECKER,
  CLOSEOUT_HF1_CHECKER,
  PACKAGE_JSON,
]);

const forbiddenPaths = [
  'src',
  'pages',
  'src/pages',
  'src/lib',
  'src/data',
  'components',
  'supabase',
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

for (const file of [SP_DOC, MK_DOC, RESULT_DOC, CHANGELOG, CHECKER, PACKAGE_JSON, EVIDENCE_CHECKER, CLOSEOUT_HF1_CHECKER]) {
  assert(exists(file), `${file} must exist.`);
}

const sp = exists(SP_DOC) ? read(SP_DOC) : '';
const mk = exists(MK_DOC) ? read(MK_DOC) : '';
const result = exists(RESULT_DOC) ? read(RESULT_DOC) : '';
const changelog = exists(CHANGELOG) ? read(CHANGELOG) : '';
const checker = exists(CHECKER) ? read(CHECKER) : '';
const evidenceChecker = exists(EVIDENCE_CHECKER) ? read(EVIDENCE_CHECKER) : '';
const closeoutHf1Checker = exists(CLOSEOUT_HF1_CHECKER) ? read(CLOSEOUT_HF1_CHECKER) : '';
const packageJson = exists(PACKAGE_JSON) ? JSON.parse(read(PACKAGE_JSON)) : {};

assert(packageJson.scripts?.['check:phase-3ff-a-plan'] === 'node scripts/check_phase_3ff_a_plan_contract.mjs', 'package.json must contain exact check:phase-3ff-a-plan script.');
assert(changelog.includes('## Phase 3FF-A-PLAN - 2026-07-08'), 'Changelog must include Phase 3FF-A-PLAN entry.');
assert(changelog.includes('### Similar Pattern Agent and MK Agent Contract Planning, No Runtime Change (Prepared)'), 'Changelog must include Phase 3FF-A-PLAN title.');

for (const token of [
  'Status: Prepared.',
  'Similar Pattern Agent',
  'same-symbol historical',
  '20 / 40 / 60',
  'Top 5',
  'log returns',
  'normalized path',
  'SimilarPatternAgentOutput',
  'raw KIS payload',
  'No buy/sell recommendation',
]) {
  assert(sp.includes(token), `Similar Pattern design doc must include: ${token}`);
}

for (const token of [
  'Status: Prepared.',
  'MK 에이전트',
  '사전 체크포인트',
  'PC card',
  'mobile bottom sheet',
  '3 uses per account per day',
  'Similar Pattern Agent',
  'MkAgentInput',
  'MkAgentOutput',
  'containsBuySellRecommendation: false',
  'No live LLM call',
]) {
  assert(mk.includes(token), `MK Agent design doc must include: ${token}`);
}

for (const token of [
  'Status: Prepared.',
  'bd8ebd3',
  'No runtime source changed.',
  'No live KIS call occurred.',
  'No LLM call occurred.',
  'No deploy/push occurred.',
]) {
  assert(result.includes(token), `Result doc must include: ${token}`);
}

for (const token of [
  'MK Agent name: `MK 에이전트`',
  'Naming policy: use `사전 체크포인트`',
  'Support/resistance price levels are allowed as observation/checkpoints.',
  'Open beta free usage policy: 3 uses per account per day.',
  'Similar Pattern and MK Agent are separate agents connected through a sanitized contract.',
]) {
  assert(result.includes(token), `Result doc must reflect owner decision: ${token}`);
}

const changedFiles = runGit(['diff', '--name-only', BASELINE])
  .split(/\r?\n/)
  .filter(Boolean);
const statusChanged = runGit(['status', '--short'])
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => line.slice(3).trim())
  .filter((file) => allowedFiles.has(file));
const allChanged = [...new Set([...changedFiles, ...statusChanged])];
const unexpected = allChanged.filter((file) => !allowedFiles.has(file));
assert(unexpected.length === 0, `Only Phase 3FF-A-PLAN files may change. Unexpected: ${unexpected.join(', ')}`);
for (const file of [SP_DOC, MK_DOC, RESULT_DOC, CHANGELOG, CHECKER, PACKAGE_JSON]) {
  assert(allChanged.includes(file), `Changed files must include ${file}.`);
}
assert(evidenceChecker.includes('EVIDENCE_HF1_RESULT') && evidenceChecker.includes('EVIDENCE_HF1_CHECKER'), 'Evidence checker must tolerate its committed HF1 evidence files.');
assert(closeoutHf1Checker.includes('EVIDENCE_HF1_RESULT') && closeoutHf1Checker.includes('EVIDENCE_HF1_CHECKER'), 'Closeout HF1 checker must tolerate committed evidence HF1 files.');

const forbiddenDiff = [
  ...runGit(['diff', '--name-only', BASELINE, 'HEAD', '--', ...forbiddenPaths]).split(/\r?\n/).filter(Boolean),
  ...runGit(['diff', '--name-only', '--', ...forbiddenPaths]).split(/\r?\n/).filter(Boolean),
  ...runGit(['diff', '--cached', '--name-only', '--', ...forbiddenPaths]).split(/\r?\n/).filter(Boolean),
];
assert([...new Set(forbiddenDiff)].length === 0, 'Forbidden runtime/source/API/UI/provider/dependency/lockfile/env diff must be empty.');

const combined = [sp, mk, result, changelog.split('## Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-EVIDENCE-HF1 - 2026-07-08')[0] ?? '', checker, evidenceChecker, closeoutHf1Checker].join('\n');
const suspiciousSecretTokens = [
  'app' + 'secret',
  'access' + '_token',
  'service' + '_role',
  'OPENAI' + '_API' + '_KEY',
];
for (const forbidden of suspiciousSecretTokens) {
  assert(!combined.includes(forbidden), `New docs/checker must not include suspicious secret token: ${forbidden}`);
}
assert(!/KIS_APP_SECRET\s*[:=]\s*['"][^'"]+['"]/i.test(combined), 'New docs/checker must not include KIS_APP_SECRET value-like assignment.');
assert(!/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/.test(combined), 'New docs/checker must not include JWT-like long token patterns.');
assert(!/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(combined), 'New docs/checker must not include raw email literals.');
assert(!/\b(?:createClient|createServerClient)\s*\(/.test(combined), 'New docs/checker must not create Supabase clients.');
assert(!/\b(?:process\.env|import\.meta\.env)\b/.test(combined), 'New docs/checker must not read environment values.');

assert(!mk.includes('매매전략'), 'Legacy trading-strategy label must not appear in the MK Agent design doc.');
assert(mk.includes('사전 체크포인트'), 'MK Agent design doc must include 사전 체크포인트.');

const forbiddenSection = mk.match(/## 15\. Forbidden phrasing examples[\s\S]*?## 16\./)?.[0] ?? '';
for (const phrase of [
  '매수하세요.',
  '매도하세요.',
  '지금 진입하세요.',
  '목표가는 78,000원입니다.',
  '손절가는 70,000원입니다.',
  '강력 추천합니다.',
  '상승이 확정적입니다.',
]) {
  assert(forbiddenSection.includes(phrase), `Forbidden phrasing section must include: ${phrase}`);
  const outside = mk.replace(forbiddenSection, '');
  assert(!outside.includes(phrase), `Forbidden phrase must only appear in explicit forbidden-phrasing section: ${phrase}`);
}

for (const boundary of [
  'No runtime source changed.',
  'No API route changed.',
  'No UI implementation changed.',
  'No provider/helper source changed.',
  'No live KIS call occurred.',
  'No LLM call occurred.',
  'No MK AI route activation occurred.',
  'No Supabase client was created.',
  'No DB connection occurred.',
  'No env/session/JWT/cookie/header parsing occurred.',
  'No public/beta activation occurred.',
  'No dependency/lockfile change occurred.',
  'No deploy/push occurred.',
]) {
  assert(result.includes(boundary), `Result doc must preserve boundary: ${boundary}`);
}

console.log(
  failures.length
    ? `Phase 3FF-A-PLAN check FAILED: ${failures.length}/${assertions} assertions failed.`
    : `Phase 3FF-A-PLAN check passed: ${assertions}/${assertions} assertions passed.`,
);

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
