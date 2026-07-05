/**
 * Static contract checker for Phase 3FC-J (Guarded Route Manual QA and Productization Boundary
 * Review, No Runtime Change).
 *
 * Inspects the four new planning docs, the changelog, and package.json as raw text (no build, no
 * dev server, no browser, no live KIS). Also re-reads the Chart Similarity API route and
 * `/chart-ai` as raw text to confirm this documentation-only phase left the runtime boundary
 * untouched. This is a focused checker (a bounded assertion list), not a full historical checker
 * suite, and it does not duplicate the Phase 3FC-H/3FC-I checkers' full coverage.
 *
 * Run:
 *   npm run check:phase-3fc-j-guarded-route-manual-qa-productization-boundary
 */

import { existsSync, readFileSync } from 'node:fs';

const failures = [];
let assertionCount = 0;

const assertTrue = (condition, message) => {
  assertionCount += 1;
  if (!condition) failures.push(message);
};

const assertMatchIn = (source, pattern, message) => {
  assertTrue(pattern.test(source), message);
};

const assertNotMatchIn = (source, pattern, message) => {
  assertTrue(!pattern.test(source), message);
};

const readSource = (path) => readFileSync(path, 'utf8');
const flatten = (source) => source.replace(/\s+/g, ' ');

// --- File existence -----------------------------------------------------------------------------

const QA_CHECKLIST_PATH = 'docs/planning/phase_3fc_j_guarded_route_manual_qa_checklist_v0.1.md';
const BOUNDARY_REVIEW_PATH = 'docs/planning/phase_3fc_j_guarded_route_productization_boundary_review_v0.1.md';
const DECISION_MATRIX_PATH = 'docs/planning/phase_3fc_j_real_runtime_entry_decision_matrix_v0.1.md';
const RESULT_DOC_PATH = 'docs/planning/phase_3fc_j_guarded_route_manual_qa_productization_boundary_result_v0.1.md';
const CHECKER_PATH = 'scripts/check_phase_3fc_j_guarded_route_manual_qa_productization_boundary_contract.mjs';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON_PATH = 'package.json';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const CHART_AI_UI_PATH = 'src/pages/chart-ai.astro';
const PHASE_3FC_I_SMOKE_PATH = 'scripts/smoke_phase_3fc_i_owner_local_mocked_guarded_route_smoke_no_live_kis.mjs';
const PHASE_3FC_I_RESULT_DOC_PATH = 'docs/planning/phase_3fc_i_owner_local_mocked_guarded_route_smoke_result_v0.1.md';
const PHASE_3FC_H_SCAFFOLD_CONTRACT_PATH = 'docs/planning/phase_3fc_h_guarded_route_integration_scaffold_contract_v0.1.md';
const PHASE_3FC_H_RESULT_DOC_PATH = 'docs/planning/phase_3fc_h_guarded_route_integration_scaffold_all_flags_off_result_v0.1.md';

const REQUIRED_FILES = [
  QA_CHECKLIST_PATH,
  BOUNDARY_REVIEW_PATH,
  DECISION_MATRIX_PATH,
  RESULT_DOC_PATH,
  CHECKER_PATH,
  CHANGELOG_PATH,
  PACKAGE_JSON_PATH,
  ROUTE_PATH,
  CHART_AI_UI_PATH,
  PHASE_3FC_I_SMOKE_PATH,
  PHASE_3FC_I_RESULT_DOC_PATH,
  PHASE_3FC_H_SCAFFOLD_CONTRACT_PATH,
  PHASE_3FC_H_RESULT_DOC_PATH,
];
for (const path of REQUIRED_FILES) {
  assertTrue(existsSync(path), `Required file must exist: ${path}`);
}

const qaChecklistSource = readSource(QA_CHECKLIST_PATH);
const boundaryReviewSource = readSource(BOUNDARY_REVIEW_PATH);
const decisionMatrixSource = readSource(DECISION_MATRIX_PATH);
const resultDocSource = readSource(RESULT_DOC_PATH);
const checkerSelfSource = readSource(CHECKER_PATH);
const changelogSource = readSource(CHANGELOG_PATH);
const packageJsonSource = readSource(PACKAGE_JSON_PATH);
const routeSource = readSource(ROUTE_PATH);
const chartAiUiSource = readSource(CHART_AI_UI_PATH);

const qaChecklistFlat = flatten(qaChecklistSource);
const boundaryReviewFlat = flatten(boundaryReviewSource);
const decisionMatrixFlat = flatten(decisionMatrixSource);
const resultDocFlat = flatten(resultDocSource);

// --- package.json: new script line registered ----------------------------------------------------

assertMatchIn(
  packageJsonSource,
  /"check:phase-3fc-j-guarded-route-manual-qa-productization-boundary":\s*"node scripts\/check_phase_3fc_j_guarded_route_manual_qa_productization_boundary_contract\.mjs"/,
  'package.json must register this checker script',
);

// --- Changelog entry -----------------------------------------------------------------------------

assertMatchIn(
  changelogSource,
  /##\s*Phase 3FC-J\s*-\s*2026-07-04/,
  'planning_changelog.md must contain a Phase 3FC-J entry dated 2026-07-04',
);
assertMatchIn(
  changelogSource,
  /Guarded Route Manual QA and Productization Boundary Review, No Runtime Change \(Prepared\)/,
  'planning_changelog.md Phase 3FC-J entry must use the required title',
);
assertTrue(
  changelogSource.indexOf('## Phase 3FC-J') < changelogSource.indexOf('## Phase 3FC-I'),
  'planning_changelog.md must place the Phase 3FC-J entry above the Phase 3FC-I entry',
);
assertMatchIn(
  changelogSource,
  /No runtime source file was changed/,
  'planning_changelog.md Phase 3FC-J entry must state no runtime source file was changed',
);

// --- Manual QA checklist: exact title and required numbered sections ------------------------------

assertMatchIn(
  qaChecklistSource,
  /^# Phase 3FC-J Guarded Route Manual QA Checklist/m,
  'Manual QA checklist doc must have the exact title heading',
);
const REQUIRED_QA_CHECKLIST_SECTIONS = [
  'Purpose',
  'Preconditions',
  'Manual QA Environment Rules',
  'Route-level QA Cases',
  'UI-level QA Cases',
  'Redaction QA',
  'Failure-state QA',
  'Regression QA',
  'QA Decision Record',
];
for (const section of REQUIRED_QA_CHECKLIST_SECTIONS) {
  assertMatchIn(
    qaChecklistSource,
    new RegExp(`^##\\s*\\d+\\.\\s*${section}\\b`, 'm'),
    `Manual QA checklist doc must contain the numbered section header: ${section}`,
  );
}
assertMatchIn(qaChecklistSource, /owner-local-mocked/, 'Manual QA checklist must reference the owner-local-mocked branch');
assertMatchIn(
  qaChecklistSource,
  /owner-local-auth-usage-bridge/,
  'Manual QA checklist must reference the owner-local-auth-usage-bridge branch',
);
assertMatchIn(qaChecklistSource, /guarded-runtime-scaffold/, 'Manual QA checklist must reference the guarded-runtime-scaffold branch');
assertMatchIn(qaChecklistSource, /non-POST/i, 'Manual QA checklist must include a non-POST route case');
assertMatchIn(qaChecklistSource, /malformed/i, 'Manual QA checklist must include a malformed guarded request case');
assertMatchIn(qaChecklistSource, /partial/i, 'Manual QA checklist must include a partial guarded request case');
assertMatchIn(qaChecklistSource, /wrong.source/i, 'Manual QA checklist must include a wrong-source guarded request case');
assertMatchIn(qaChecklistFlat, /start a dev server/i, 'Manual QA checklist must state no dev server is started by this phase');
assertMatchIn(
  qaChecklistFlat,
  /does not execute any manual browser QA/i,
  'Manual QA checklist must state no manual browser QA is executed by this phase',
);
assertMatchIn(qaChecklistSource, /\.env/, 'Manual QA checklist must reference .env file avoidance');
const qaRedactionItemCount = (qaChecklistSource.match(/^\s*- \[ \]/gm) || []).length;
assertTrue(
  qaRedactionItemCount >= 15,
  `Manual QA checklist must contain at least 15 checkbox items across its checklists (found ${qaRedactionItemCount})`,
);

// --- Productization boundary review: exact title and required numbered sections -------------------

assertMatchIn(
  boundaryReviewSource,
  /^# Phase 3FC-J Guarded Route Productization Boundary Review/m,
  'Productization boundary review doc must have the exact title heading',
);
const REQUIRED_BOUNDARY_REVIEW_SECTIONS = [
  'Purpose',
  'Current Capability',
  'Not Yet Product-ready',
  'Required Productization Gates',
  'Real Supabase Boundary',
  'Real DB Boundary',
  'Beta/Public Boundary',
  'Live KIS Boundary',
  'Go/No-Go Summary',
];
for (const section of REQUIRED_BOUNDARY_REVIEW_SECTIONS) {
  assertMatchIn(
    boundaryReviewSource,
    new RegExp(`^##\\s*\\d+\\.\\s*${section.replace(/\//g, '\\/')}\\b`, 'm'),
    `Productization boundary review doc must contain the numbered section header: ${section}`,
  );
}
assertMatchIn(
  boundaryReviewFlat,
  /scaffold readiness|scaffold-ready/i,
  'Productization boundary review must state the scaffold is scaffold-ready',
);
assertMatchIn(
  boundaryReviewFlat,
  /not product-ready|not yet product-ready|product readiness/i,
  'Productization boundary review must state the scaffold is not product-ready',
);
assertMatchIn(boundaryReviewSource, /real Supabase/i, 'Productization boundary review must discuss the real Supabase boundary');
assertMatchIn(boundaryReviewSource, /real DB|real database/i, 'Productization boundary review must discuss the real DB boundary');
assertMatchIn(boundaryReviewSource, /beta activation/i, 'Productization boundary review must discuss beta activation');
assertMatchIn(boundaryReviewSource, /public activation/i, 'Productization boundary review must discuss public activation');
assertMatchIn(boundaryReviewSource, /live KIS/i, 'Productization boundary review must discuss the live KIS boundary');
assertMatchIn(boundaryReviewSource, /legal.{0,20}disclaimer|disclaimer/i, 'Productization boundary review must mention legal/disclaimer');
assertMatchIn(boundaryReviewSource, /monitoring.{0,10}logging|logging/i, 'Productization boundary review must mention monitoring/logging');
assertMatchIn(boundaryReviewSource, /abuse.{0,10}rate.limit|rate-limit/i, 'Productization boundary review must mention abuse/rate-limit');
assertMatchIn(boundaryReviewSource, /rollback/i, 'Productization boundary review must mention a rollback plan');
assertMatchIn(boundaryReviewSource, /Go.{0,3}No.Go|Go.{0,3}no.go/i, 'Productization boundary review must contain a go/no-go summary');
assertMatchIn(boundaryReviewSource, /No-go/i, 'Productization boundary review go/no-go summary must include at least one No-go item');
assertMatchIn(boundaryReviewSource, /Phase 3FD-A/, 'Productization boundary review must reference Phase 3FD-A');
assertMatchIn(boundaryReviewSource, /Phase 3FD-C/, 'Productization boundary review must reference Phase 3FD-C');
const notYetProductReadyItemCount = (boundaryReviewSource.match(/^- No /gm) || []).length;
const gateTableRowCount = (boundaryReviewSource.match(/^\|\s*[\w\s/]+\s*\|.*\|.*\|.*\|.*\|$/gm) || []).length;
assertTrue(
  notYetProductReadyItemCount >= 10 && gateTableRowCount >= 10,
  `Productization boundary review must contain at least 10 Not Yet Product-ready items (found ${notYetProductReadyItemCount}) and at least 10 Required Productization Gates table rows (found ${gateTableRowCount})`,
);

// --- Decision matrix: exact title and required numbered sections ----------------------------------

assertMatchIn(
  decisionMatrixSource,
  /^# Phase 3FC-J Real Runtime Entry Decision Matrix/m,
  'Decision matrix doc must have the exact title heading',
);
const REQUIRED_DECISION_MATRIX_SECTIONS = [
  'Purpose',
  'Decision Options',
  'Recommended Path',
  '3FD-A Entry Criteria',
  '3FD-A Non-goals',
  'KIS Entry Criteria',
  'Decision Record Template',
];
for (const section of REQUIRED_DECISION_MATRIX_SECTIONS) {
  assertMatchIn(
    decisionMatrixSource,
    new RegExp(`^##\\s*\\d+\\.\\s*${section}\\b`, 'm'),
    `Decision matrix doc must contain the numbered section header: ${section}`,
  );
}
assertMatchIn(decisionMatrixSource, /\|\s*A\s*\|.*Phase 3FD-A/, 'Decision matrix must list Option A as Phase 3FD-A');
assertMatchIn(decisionMatrixSource, /\|\s*B\s*\|.*Phase 3FC-K/, 'Decision matrix must list Option B as Phase 3FC-K');
assertMatchIn(decisionMatrixSource, /\|\s*C\s*\|.*Phase 3FE-A/, 'Decision matrix must list Option C as Phase 3FE-A');
assertMatchIn(decisionMatrixSource, /\|\s*D\s*\|.*Hold/i, 'Decision matrix must list Option D as a hold/stabilize option');
assertMatchIn(
  decisionMatrixSource,
  /Primary.{0,10}Phase 3FD-A|Phase 3FD-A.{0,80}if the owner is ready/i,
  'Decision matrix must recommend Phase 3FD-A as the primary path if the owner is ready',
);
assertMatchIn(decisionMatrixSource, /No package install unless/i, 'Decision matrix 3FD-A non-goals must exclude an unauthorized package install');
assertMatchIn(decisionMatrixSource, /No live KIS/i, 'Decision matrix 3FD-A non-goals must exclude live KIS');
assertMatchIn(decisionMatrixSource, /Network\/TCP reachability|network.{0,10}TCP reachability/i, 'Decision matrix KIS entry criteria must mention network/TCP reachability');
assertTrue(
  /\[ \] Proceed to Phase 3FD-A/.test(decisionMatrixSource) &&
    /\[ \] Proceed to Phase 3FC-K/.test(decisionMatrixSource) &&
    /\[ \] Proceed to Phase 3FE-A/.test(decisionMatrixSource) &&
    /\[ \] Hold/.test(decisionMatrixSource),
  'Decision matrix decision record template must include Proceed to 3FD-A/3FC-K/3FE-A and Hold checkboxes',
);

// --- Result doc: exact title and required numbered sections ----------------------------------------

assertMatchIn(
  resultDocSource,
  /^# Phase 3FC-J — Guarded Route Manual QA and Productization Boundary Review Result/m,
  'Result doc must have the exact title heading',
);
const REQUIRED_RESULT_DOC_SECTIONS = [
  'Status',
  'Background',
  'Implemented Scope',
  'QA Boundary Result',
  'Productization Boundary Result',
  'Real Runtime Entry Result',
  'Boundary Preservation',
  'Validation',
  'Recommended Next Phase',
];
for (const section of REQUIRED_RESULT_DOC_SECTIONS) {
  assertMatchIn(
    resultDocSource,
    new RegExp(`^##\\s*\\d+\\.\\s*${section}\\b`, 'm'),
    `Result doc must contain the numbered section header: ${section}`,
  );
}
assertMatchIn(resultDocFlat, /documentation-only/i, 'Result doc must state this phase is documentation-only');
assertMatchIn(
  resultDocFlat,
  /no runtime source file was changed/i,
  'Result doc must explicitly state no runtime source file was changed',
);
assertMatchIn(resultDocFlat, /no route source file was changed/i, 'Result doc must explicitly state no route source file was changed');
assertMatchIn(resultDocFlat, /no UI file was changed/i, 'Result doc must explicitly state no UI file was changed');
assertMatchIn(
  resultDocFlat,
  /no real Supabase or real database was implemented/i,
  'Result doc must explicitly state no real Supabase or real database was implemented',
);
assertMatchIn(resultDocFlat, /no live KIS call was made/i, 'Result doc must explicitly state no live KIS call was made');
assertMatchIn(resultDocSource, /Phase 3FD-A/, 'Result doc must reference Phase 3FD-A as the primary recommended next phase');
assertMatchIn(resultDocSource, /Phase 3FC-K/, 'Result doc must reference Phase 3FC-K as an alternative next phase');
assertMatchIn(resultDocSource, /Phase 3FE-A/, 'Result doc must reference Phase 3FE-A as the KIS alternative next phase');

// --- Runtime boundary: route and /chart-ai must remain exactly as Phase 3FC-I left them ------------

assertMatchIn(
  routeSource,
  /isOwnerLocalMockedSimilarityApiRequestBody\(body\)/,
  'Route must still preserve the owner-local-mocked branch guard',
);
assertMatchIn(
  routeSource,
  /isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody\(body\)/,
  'Route must still preserve the auth/usage bridge branch guard',
);
assertMatchIn(
  routeSource,
  /isGuardedRuntimeScaffoldSimilarityRequestBody\(body\)/,
  'Route must still preserve the guarded-runtime-scaffold branch guard',
);
const dispatchBranchMatches = routeSource.match(/if \(is\w+\(body\)\)/g) || [];
assertTrue(
  dispatchBranchMatches.length === 3,
  `Route dispatch branch count must remain exactly 3 (found ${dispatchBranchMatches.length})`,
);
assertNotMatchIn(
  routeSource,
  /phase_3fc_j|Phase3FCJ|PhaseThreeFCJ/i,
  'Route file must not reference this documentation-only phase (no runtime source change)',
);
assertMatchIn(
  chartAiUiSource,
  /chartAiOwnerLocalAuthUsageBridgePanel/,
  'src/pages/chart-ai.astro must still contain the pre-existing chartAiOwnerLocalAuthUsageBridgePanel identifier',
);
assertNotMatchIn(
  chartAiUiSource,
  /similarityGuardedRouteScaffold|runSimilarityGuardedRouteScaffold|phase_3fc_j/i,
  'src/pages/chart-ai.astro must not reference the guarded route scaffold or this phase',
);

// --- Forbidden content across the four new docs and the changelog entry ---------------------------

const FORBIDDEN_PATTERN_CHECKS = [
  [/from ['"]@supabase\//i, 'must not import a Supabase package'],
  [/createClient\(/, 'must not call createClient(...)'],
  [/process\.env(\.\w+|\[)/, 'must never access process.env'],
  [/import\.meta\.env\.\w+\s*(!==|===|=[^=])/, 'must never read a specific import.meta.env value'],
  [/from ['"]dotenv['"]/, 'must not import dotenv'],
  [/readFileSync\(['"]\.env|['"]\.env(\.[\w-]+)?['"]/, 'must not reference an .env file path'],
  [/VERCEL_ENV|VERCEL_URL/, 'must not reference a Vercel environment variable'],
  [/\bCREATE TABLE\b|\bINSERT INTO\b|\.sql['"]|\/migrations\//i, 'must not contain SQL or migration references'],
  [/accountId|tradingAccount|orderId|balanceAmount/i, 'must not reference account/trading/order/balance API fields'],
  [/document\.cookie|req\.headers|request\.headers\.get\(['"]auth/i, 'must never read cookies or a real auth header'],
  [/npm run deploy|vercel deploy|git push\b/, 'must not claim a deploy or push occurred'],
  [/npm install @supabase|pnpm add @supabase|package was installed/i, 'must not claim a package install occurred'],
  [/(?<!no )live KIS call (was made|succeeded)|called the live KIS/i, 'must not claim a live KIS call was made'],
];

const ALL_NEW_DOCS_JOINED = [qaChecklistFlat, boundaryReviewFlat, decisionMatrixFlat, resultDocFlat].join('\n');
for (const [pattern, description] of FORBIDDEN_PATTERN_CHECKS) {
  assertNotMatchIn(ALL_NEW_DOCS_JOINED, pattern, `The Phase 3FC-J planning docs ${description}`);
}

assertNotMatchIn(
  checkerSelfSource.replace(/^\/\*\*[\s\S]*?\*\/\n/, ''),
  /from ['"]@supabase\//i,
  'This checker script must not import a Supabase package',
);

// --- Hard structural requirement: this checker must run within the target assertion range ---------

const MINIMUM_REQUIRED_ASSERTION_COUNT = 95;
const MAXIMUM_TARGET_ASSERTION_COUNT = 125;
assertTrue(
  assertionCount >= MINIMUM_REQUIRED_ASSERTION_COUNT,
  `Checker must run at least ${MINIMUM_REQUIRED_ASSERTION_COUNT} assertions (ran ${assertionCount})`,
);
assertTrue(
  assertionCount <= MAXIMUM_TARGET_ASSERTION_COUNT,
  `Checker should run at most ${MAXIMUM_TARGET_ASSERTION_COUNT} assertions to stay within the target range (ran ${assertionCount})`,
);
assertTrue(checkerSelfSource.length > 0, 'This checker file must be non-empty (self-reference sanity check)');

if (failures.length > 0) {
  process.stdout.write(`Phase 3FC-J checker: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
  for (const failure of failures) {
    process.stdout.write(`  - ${failure}\n`);
  }
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3FC-J checker: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  process.exitCode = 0;
}
