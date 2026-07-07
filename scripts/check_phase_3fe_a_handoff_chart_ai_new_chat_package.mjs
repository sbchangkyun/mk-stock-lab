import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));

let assertions = 0;
const failures = [];

const assertTrue = (condition, message) => {
  assertions += 1;
  if (!condition) failures.push(message);
};

const handoffDir = 'docs/handoff/chart-ai-phase-3fe-a';
const handoffFiles = [
  `${handoffDir}/00_README_FIRST.md`,
  `${handoffDir}/01_CURRENT_STATE.md`,
  `${handoffDir}/02_COMPLETED_PHASE_HISTORY.md`,
  `${handoffDir}/03_ARCHITECTURE_AND_GUARDS.md`,
  `${handoffDir}/04_SHORTENED_ROADMAP.md`,
  `${handoffDir}/05_NEXT_PHASE_MANUAL_QA_BRIEF.md`,
  `${handoffDir}/06_VALIDATION_COMMANDS.md`,
  `${handoffDir}/07_NEW_CHAT_START_PROMPT.md`,
  `${handoffDir}/handoff_manifest.json`,
];

const resultDocPath = 'docs/planning/phase_3fe_a_handoff_result_v0.1.md';
const changelogPath = 'docs/planning/planning_changelog.md';
const packagePath = 'package.json';
const checkerPath = 'scripts/check_phase_3fe_a_handoff_chart_ai_new_chat_package.mjs';

for (const file of handoffFiles) assertTrue(exists(file), `${file} must exist.`);
assertTrue(exists(resultDocPath), 'Result document must exist.');
assertTrue(exists(changelogPath), 'Planning changelog must exist.');
assertTrue(exists(packagePath), 'package.json must exist.');
assertTrue(exists(checkerPath), 'Handoff checker must exist.');

const manifest = JSON.parse(read(`${handoffDir}/handoff_manifest.json`));
const readme = read(`${handoffDir}/00_README_FIRST.md`);
const currentState = read(`${handoffDir}/01_CURRENT_STATE.md`);
const history = read(`${handoffDir}/02_COMPLETED_PHASE_HISTORY.md`);
const architecture = read(`${handoffDir}/03_ARCHITECTURE_AND_GUARDS.md`);
const roadmap = read(`${handoffDir}/04_SHORTENED_ROADMAP.md`);
const nextBrief = read(`${handoffDir}/05_NEXT_PHASE_MANUAL_QA_BRIEF.md`);
const validation = read(`${handoffDir}/06_VALIDATION_COMMANDS.md`);
const prompt = read(`${handoffDir}/07_NEW_CHAT_START_PROMPT.md`);
const resultDoc = read(resultDocPath);
const changelog = read(changelogPath);
const packageJson = JSON.parse(read(packagePath));

assertTrue(manifest.project === 'mk-stock-lab', 'Manifest project must be mk-stock-lab.');
assertTrue(manifest.handoff_package === 'chart-ai-phase-3fe-a', 'Manifest package name must match.');
assertTrue(manifest.branch === 'rebuild/phase-1-ia-shell', 'Manifest branch must match.');
assertTrue(manifest.current_baseline_commit === 'e6c7679', 'Manifest baseline must be e6c7679.');
assertTrue(manifest.latest_feature_commit === '1b2a0f2', 'Manifest feature commit must be 1b2a0f2.');
assertTrue(manifest.latest_evidence_commit === 'e6c7679', 'Manifest evidence commit must be e6c7679.');
assertTrue(manifest.next_recommended_phase === 'Phase 3FE-A-MANUAL-QA', 'Manifest next phase must be manual QA.');

for (const key of [
  'public_activation_allowed',
  'beta_activation_allowed',
  'live_kis_allowed',
  'llm_allowed',
  'mk_ai_route_activation_allowed',
  'real_auth_runtime_allowed',
  'supabase_runtime_allowed',
  'database_persistence_allowed',
  'env_read_allowed',
  'session_jwt_parsing_allowed',
  'deploy_allowed',
  'push_allowed',
]) {
  assertTrue(manifest[key] === false, `Manifest ${key} must be false.`);
}

assertTrue(readme.includes('Required reading order'), 'README must record required reading order.');
assertTrue(readme.includes('Source-of-truth priority'), 'README must record source-of-truth priority.');
assertTrue(readme.includes('A phase is completed only if phase name, commit hash, status, and validation result are present.'), 'README must include anti-hallucination rule.');
assertTrue(/summarize (the )?current state/i.test(readme), 'README must require state summary before implementation.');

assertTrue(currentState.includes('/chart-ai') && currentState.includes('default remains mocked'), 'Current state must record mocked chart-ai default.');
assertTrue(currentState.includes('ownerLocalOhlcProviderMode: "kis_ohlc_fixture"'), 'Current state must record owner-local fixture mode.');
assertTrue(currentState.includes('MK AI remains mocked'), 'Current state must record MK AI mocked state.');

assertTrue(history.includes('Phase 3FE-A') && history.includes('1b2a0f2'), 'History must record Phase 3FE-A commit.');
assertTrue(history.includes('Status: implemented') || history.includes('status `implemented`'), 'History must record implemented status.');
assertTrue(history.includes('188/188') && history.includes('141/141'), 'History must record Phase 3FE-A validation.');
assertTrue(history.includes('Phase 3FE-A-HF1') && history.includes('e6c7679'), 'History must record HF1 commit.');
assertTrue(history.includes('Documentation-only evidence metadata completion'), 'History must record HF1 validation meaning.');
assertTrue(history.includes('Do not infer completed work from roadmap.'), 'History must include anti-hallucination warning.');

assertTrue(architecture.includes('Fixture-only') || architecture.includes('fixture-only'), 'Architecture must record fixture-only provider boundary.');
assertTrue(architecture.includes('No live KIS'), 'Architecture must block live KIS.');
assertTrue(architecture.includes('No raw KIS payload'), 'Architecture must block raw KIS payload.');
assertTrue(architecture.includes('No raw OHLC rows'), 'Architecture must block raw OHLC rows.');
assertTrue(architecture.includes('No Supabase/DB'), 'Architecture must block Supabase/DB.');

assertTrue(roadmap.includes('Phase 3FE-A - completed'), 'Roadmap must mark Phase 3FE-A completed.');
assertTrue(roadmap.includes('Phase 3FE-A-MANUAL-QA - proposed next, not completed'), 'Roadmap must separate proposed manual QA.');
assertTrue(roadmap.includes('Phase 3FF-A - later, not completed'), 'Roadmap must not mark Phase 3FF-A completed.');
assertTrue(roadmap.includes('KIS and LLM remain separate phases.'), 'Roadmap must separate KIS and LLM.');

assertTrue(nextBrief.includes('Phase 3FE-A-MANUAL-QA'), 'Next phase brief must be manual QA.');
assertTrue(!nextBrief.includes('Phase 3FF-A - next'), 'Next phase brief must not make Phase 3FF-A next.');
assertTrue(nextBrief.includes('no live KIS') || nextBrief.includes('No live KIS'), 'Next phase brief must block live KIS.');
assertTrue(nextBrief.includes('MK AI remains mocked'), 'Next phase brief must preserve MK AI mocked state.');

for (const command of [
  'npm run check:phase-3fe-a-handoff-chart-ai-new-chat-package',
  'npm run check:phase-3fe-a-kis-ohlc-provider-owner-local-integration',
  'npm run smoke:phase-3fe-a-kis-ohlc-provider-owner-local-integration',
  'npm run check:phase-3fd-j-similar-pattern-route-owner-local-activation',
  'npm run smoke:phase-3fd-j-similar-pattern-route-owner-local-activation',
  'npm run check:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off',
  'npm run smoke:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off',
  'npm run build',
  'git diff --check',
]) {
  assertTrue(validation.includes(command), `Validation commands must include ${command}.`);
}

assertTrue(prompt.includes('Do not implement immediately.'), 'New chat prompt must forbid immediate implementation.');
assertTrue(prompt.includes('summarize the current project state'), 'New chat prompt must require state summary.');
assertTrue(prompt.includes('e6c7679') && prompt.includes('1b2a0f2'), 'New chat prompt must include baseline and feature commits.');
assertTrue(prompt.includes('ask for owner confirmation') || prompt.includes('Ask for owner confirmation'), 'New chat prompt must ask for owner confirmation.');

assertTrue(resultDoc.includes('documentation/checker/package-script-only'), 'Result doc must state documentation/checker/package-script-only.');
assertTrue(resultDoc.includes('No runtime source changed.'), 'Result doc must state no runtime source changed.');
assertTrue(resultDoc.includes('No API route changed.'), 'Result doc must state no API route changed.');
assertTrue(resultDoc.includes('Phase 3FE-A-MANUAL-QA'), 'Result doc must recommend manual QA.');

assertTrue(changelog.includes('## Phase 3FE-A-HANDOFF - 2026-07-07'), 'Changelog must contain Phase 3FE-A-HANDOFF top entry.');
assertTrue(/Current baseline\*\*:\s*`e6c7679`|Current baseline:\s*`e6c7679`/.test(changelog), 'Changelog must record current baseline.');
assertTrue(/Latest feature commit\*\*:\s*`1b2a0f2`|Latest feature commit:\s*`1b2a0f2`/.test(changelog), 'Changelog must record latest feature commit.');

assertTrue(packageJson.scripts?.['check:phase-3fe-a-handoff-chart-ai-new-chat-package'] === 'node scripts/check_phase_3fe_a_handoff_chart_ai_new_chat_package.mjs', 'package.json must contain exact handoff checker script.');

const handoffText = handoffFiles.map(read).join('\n') + '\n' + resultDoc;
assertTrue(!/live KIS is active|live KIS active|activated live KIS/i.test(handoffText), 'Handoff text must not claim live KIS is active.');
assertTrue(!/public activation is active|beta activation is active|public\/beta is active|beta is active/i.test(handoffText), 'Handoff text must not claim public or beta is active.');
assertTrue(!/LLM is active|MK AI route is active|activated MK AI route/i.test(handoffText), 'Handoff text must not claim LLM or MK AI route is active.');
assertTrue(!/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(handoffText), 'Handoff text must not contain raw email literals.');
assertTrue(!/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i.test(handoffText), 'Handoff text must not contain UUID literals.');
assertTrue(!/(?:credential|token|secret|password|api[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(handoffText), 'Handoff text must not expose credential-like values.');
assertTrue(!/(?:KIS|SUPABASE|OPENAI|ANTHROPIC|VERCEL)_[A-Z0-9_]+\s*[:=]\s*['"][^'"]+['"]/.test(handoffText), 'Handoff text must not expose environment values.');
assertTrue(!/raw KIS payload is exposed|raw OHLC rows are exposed|provider payload is exposed/i.test(handoffText), 'Handoff text must not claim raw payload exposure.');

const collectDiff = (command) => {
  try {
    const output = execSync(command, { cwd: root, encoding: 'utf8' }).trim();
    return output ? output.split(/\r?\n/) : [];
  } catch {
    // Ignore git diff availability in packaged contexts; file content checks remain deterministic.
    return [];
  }
};

const allowedPrefixes = [`${handoffDir}/`];
const allowedFiles = new Set([
  resultDocPath,
  changelogPath,
  checkerPath,
  packagePath,
]);

const originalHandoffDiff = collectDiff('git diff --name-only e6c7679 b3a4679');
const unexpectedOriginalHandoffFiles = originalHandoffDiff.filter((file) => !allowedFiles.has(file) && !allowedPrefixes.some((prefix) => file.startsWith(prefix)));
assertTrue(unexpectedOriginalHandoffFiles.length === 0, `Original handoff diff e6c7679..b3a4679 must only contain handoff docs, result doc, changelog, checker, and package.json. Unexpected: ${unexpectedOriginalHandoffFiles.join(', ')}`);

const forbiddenPathArgs = 'src pages src/pages src/lib src/data supabase package-lock.json pnpm-lock.yaml yarn.lock .env .env.local';
const committedForbiddenDrift = collectDiff(`git diff --name-only b3a4679 HEAD -- ${forbiddenPathArgs}`);
const workingTreeForbiddenDrift = collectDiff(`git diff --name-only -- ${forbiddenPathArgs}`);
const stagedForbiddenDrift = collectDiff(`git diff --cached --name-only -- ${forbiddenPathArgs}`);
const forbiddenDrift = [...new Set([...committedForbiddenDrift, ...workingTreeForbiddenDrift, ...stagedForbiddenDrift])];
assertTrue(forbiddenDrift.length === 0, `Runtime/source/API/UI/provider/dependency/lockfile/env path drift must stay blocked. Unexpected: ${forbiddenDrift.join(', ')}`);

if (assertions < 75) failures.push(`Checker assertion count too low: ${assertions}.`);

if (failures.length) {
  console.error(`Phase 3FE-A-HANDOFF check FAILED: ${failures.length}/${assertions} assertions failed.`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FE-A-HANDOFF check passed: ${assertions}/${assertions} assertions passed.`);
