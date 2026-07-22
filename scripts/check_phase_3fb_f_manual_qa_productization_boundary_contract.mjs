/**
 * Static contract checker for Phase 3FB-F (Chart AI Owner-local Auth/Usage Bridge Manual QA and
 * Productization Boundary Review, Live KIS Off).
 *
 * This phase adds no runtime capability. It only creates an owner-executable manual QA checklist
 * and a productization boundary review document, plus registers one npm script and one
 * changelog entry. This checker inspects those new documents, `package.json`, and
 * `planning_changelog.md` as raw text (no build, no dev server, no browser, no live KIS), and does
 * a light regression check that the Phase 3FB-C/3FB-E runtime identifiers this phase must not
 * touch are still present unchanged. This is a focused checker (a bounded assertion list), not a
 * full historical checker suite.
 *
 * Run:
 *   npm run check:phase-3fb-f-manual-qa-productization-boundary
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

const readSource = (path) => readFileSync(path, 'utf8');

// --- File existence ---------------------------------------------------------------------------

const QA_CHECKLIST_PATH = 'docs/planning/phase_3fb_f_manual_qa_checklist_v0.1.md';
const BOUNDARY_REVIEW_PATH =
  'docs/planning/phase_3fb_f_chart_ai_owner_local_auth_usage_bridge_manual_qa_productization_boundary_review_v0.1.md';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON_PATH = 'package.json';
const CHART_AI_UI_PATH = 'src/pages/chart-ai.astro';
const SIMILARITY_ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';

for (const path of [
  QA_CHECKLIST_PATH,
  BOUNDARY_REVIEW_PATH,
  CHANGELOG_PATH,
  PACKAGE_JSON_PATH,
  CHART_AI_UI_PATH,
  SIMILARITY_ROUTE_PATH,
]) {
  assertTrue(existsSync(path), `Required file must exist: ${path}`);
}

const qaSource = readSource(QA_CHECKLIST_PATH);
const boundarySource = readSource(BOUNDARY_REVIEW_PATH);
const changelogSource = readSource(CHANGELOG_PATH);
const packageJsonSource = readSource(PACKAGE_JSON_PATH);
const chartAiUiSource = readSource(CHART_AI_UI_PATH);
const similarityRouteSource = readSource(SIMILARITY_ROUTE_PATH);

// --- Manual QA checklist: required sections ----------------------------------------------------

const QA_REQUIRED_HEADERS = [
  /##\s*1\.\s*Preconditions/,
  /##\s*2\.\s*Local Review Setup/,
  /##\s*3\.\s*Default Public UI Check/,
  /##\s*4\.\s*Auth\/Usage Bridge Panel Visibility Check/,
  /##\s*5\.\s*Scenario QA.*Allowed Owner/,
  /##\s*6\.\s*Scenario QA.*Anonymous Blocked/,
  /##\s*7\.\s*Scenario QA.*Usage-limited/,
  /##\s*8\.\s*Scenario QA.*Invalid Usage/,
  /##\s*9\.\s*Duplicate-click\s*\/\s*Loading QA/,
  /##\s*10\.\s*Timeout\s*\/\s*Network Failure QA/,
  /##\s*11\.\s*Cross-panel Isolation QA/,
  /##\s*12\.\s*Production Boundary QA/,
  /##\s*13\.\s*Final Manual QA Decision/,
];

for (const pattern of QA_REQUIRED_HEADERS) {
  assertMatchIn(qaSource, pattern, `Manual QA checklist must include section matching: ${pattern}`);
}

assertMatchIn(qaSource, /npm run dev/, 'Manual QA checklist must instruct the owner to run the local dev server');
assertMatchIn(
  qaSource,
  /ownerLocalAuthUsageBridge=1/,
  'Manual QA checklist must reference the auth/usage bridge opt-in query parameter',
);
assertMatchIn(
  qaSource,
  /ownerLocalMocked=1/,
  'Manual QA checklist must reference the existing owner-local mocked opt-in query parameter for cross-panel isolation QA',
);
assertMatchIn(qaSource, /\bPASS\b/, 'Manual QA checklist must define a PASS outcome');
assertMatchIn(qaSource, /\bBLOCKED\b/, 'Manual QA checklist must define a BLOCKED outcome');
assertMatchIn(qaSource, /NOT TESTED/, 'Manual QA checklist must define a NOT TESTED outcome');
assertMatchIn(qaSource, /Do not deploy/i, 'Manual QA checklist must state that this QA does not require deployment');

// --- Boundary review: required sections ---------------------------------------------------------

const BOUNDARY_REQUIRED_HEADERS = [
  /##\s*1\.\s*Status/,
  /##\s*2\.\s*Current Implementation Summary/,
  /##\s*3\.\s*What This Phase Does/,
  /##\s*4\.\s*What This Phase Does Not Do/,
  /##\s*5\.\s*Productization Boundary Matrix/,
  /##\s*6\.\s*Go\/No-Go Criteria/,
  /##\s*7\.\s*Known Non-Blocking Issues/,
  /##\s*8\.\s*Required Owner Decisions Before Next Product Phase/,
  /##\s*9\.\s*Recommended Next Phase/,
];

for (const pattern of BOUNDARY_REQUIRED_HEADERS) {
  assertMatchIn(
    boundarySource,
    pattern,
    `Boundary review doc must include section matching: ${pattern}`,
  );
}

// --- Boundary review: explicit non-capability statements ----------------------------------------

assertMatchIn(
  boundarySource,
  /does not implement a real auth provider/i,
  'Boundary review doc must explicitly state no real auth provider is implemented',
);
assertMatchIn(
  boundarySource,
  /does not implement real usage persistence/i,
  'Boundary review doc must explicitly state no real usage persistence is implemented',
);
assertMatchIn(
  boundarySource,
  /does not enable public route success/i,
  'Boundary review doc must explicitly state no public route success is enabled',
);
assertMatchIn(
  boundarySource,
  /does not enable beta exposure/i,
  'Boundary review doc must explicitly state no beta exposure is enabled',
);
assertMatchIn(
  boundarySource,
  /does not call live kis/i,
  'Boundary review doc must explicitly state live KIS is not called',
);
assertMatchIn(
  boundarySource,
  /does not deploy/i,
  'Boundary review doc must explicitly state this phase does not deploy',
);
assertMatchIn(
  boundarySource,
  /does not push/i,
  'Boundary review doc must explicitly state this phase does not push',
);
assertMatchIn(
  boundarySource,
  /Productization Boundary Matrix/,
  'Boundary review doc must contain a productization boundary matrix',
);
assertMatchIn(
  boundarySource,
  /GO for internal local review/,
  'Boundary review doc must define GO criteria for internal local review',
);
assertMatchIn(
  boundarySource,
  /NO-GO for public\/beta exposure/,
  'Boundary review doc must define NO-GO criteria for public/beta exposure',
);
assertMatchIn(
  boundarySource,
  /check:phase-3fb-c-alt-auth-usage-runtime-bridge-for-similarity-route[\s\S]*?not a defect/i,
  'Boundary review doc must document the known Phase 3FB-C-ALT checker assertion mismatch as non-blocking',
);

// --- package.json: new script registered --------------------------------------------------------

assertMatchIn(
  packageJsonSource,
  /"check:phase-3fb-f-manual-qa-productization-boundary":\s*"node scripts\/check_phase_3fb_f_manual_qa_productization_boundary_contract\.mjs"/,
  'package.json must register the new Phase 3FB-F check script',
);

// --- planning_changelog.md: new top entry ---------------------------------------------------------

assertMatchIn(
  changelogSource,
  /##\s*Phase 3FB-F\s*-\s*2026-07-04/,
  'planning_changelog.md must contain a Phase 3FB-F entry',
);
assertMatchIn(
  changelogSource,
  /Chart AI Owner-local Auth\/Usage Bridge Manual QA and Productization Boundary Review/,
  'planning_changelog.md must describe the Phase 3FB-F entry title',
);

// --- Runtime non-drift regression: existing identifiers must remain present unchanged -----------

assertMatchIn(
  chartAiUiSource,
  /chartAiOwnerLocalAuthUsageBridgePanel/,
  'chart-ai.astro must still contain the Phase 3FB-E auth/usage bridge panel id (no runtime removal expected)',
);
assertMatchIn(
  chartAiUiSource,
  /chartAiOwnerLocalMockedPanel/,
  'chart-ai.astro must still contain the Phase 3FB-C/D owner-local mocked panel id (no runtime removal expected)',
);
assertMatchIn(
  similarityRouteSource,
  /isOwnerLocalMockedSimilarityApiRequestBody/,
  'similarity.ts must still contain the existing owner-local-mocked dispatch check (no new/removed branch expected)',
);
assertMatchIn(
  similarityRouteSource,
  /isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody/,
  'similarity.ts must still contain the existing auth/usage bridge dispatch check (no new/removed branch expected)',
);

const dispatchBranchCount = (similarityRouteSource.match(/if \(isOwnerLocal\w+\(body\)\)/g) ?? []).length;
assertTrue(
  dispatchBranchCount === 2,
  'similarity.ts must still have exactly the two existing owner-local dispatch branches, no third branch added by this phase',
);

// --- Report ---------------------------------------------------------------------------------------

if (failures.length > 0) {
  console.error(`Phase 3FB-F checker: FAIL (${failures.length}/${assertionCount} assertions failed)`);
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log(`Phase 3FB-F checker: PASS (${assertionCount}/${assertionCount} assertions passed)`);
