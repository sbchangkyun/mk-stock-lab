/**
 * Static contract checker for Phase 3FC-G (Guarded Route Integration Plan Refresh, No Runtime
 * Change).
 *
 * This phase is documentation-only, so this checker only inspects the four new planning docs,
 * package.json, planning_changelog.md, and — as raw text, read-only — the existing route/UI
 * files and the Phase 3FC-C/3FC-D/3FC-E/3FC-F scaffold files, to confirm no runtime drift was
 * introduced and that the docs cover the required topics. It is intentionally narrow: it does not
 * duplicate the historical checkers for prior phases.
 *
 * Run:
 *   npm run check:phase-3fc-g-guarded-route-integration-plan-refresh
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

// --- File paths ------------------------------------------------------------------------------

const MAIN_PLAN_PATH = 'docs/planning/phase_3fc_g_guarded_route_integration_plan_refresh_v0.1.md';
const ROUTE_MATRIX_PATH = 'docs/planning/phase_3fc_g_route_contract_matrix_v0.1.md';
const ROADMAP_KIS_PATH = 'docs/planning/phase_3fc_g_chart_ai_remaining_roadmap_and_kis_stage_v0.1.md';
const APPROVAL_CHECKLIST_PATH = 'docs/planning/phase_3fc_g_owner_approval_gate_checklist_v0.1.md';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON_PATH = 'package.json';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const CHART_AI_UI_PATH = 'src/pages/chart-ai.astro';
const AUTH_SUBJECT_RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityAuthSubjectResolver.ts';
const ROLE_ASSIGNMENT_RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityRoleAssignmentResolver.ts';
const USAGE_STORE_PATH = 'src/lib/server/chartSimilarity/similarityUsageStore.ts';
const FEATURE_FLAG_RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityFeatureFlagResolver.ts';

for (const path of [
  MAIN_PLAN_PATH,
  ROUTE_MATRIX_PATH,
  ROADMAP_KIS_PATH,
  APPROVAL_CHECKLIST_PATH,
  CHANGELOG_PATH,
  PACKAGE_JSON_PATH,
  ROUTE_PATH,
  CHART_AI_UI_PATH,
  AUTH_SUBJECT_RESOLVER_PATH,
  ROLE_ASSIGNMENT_RESOLVER_PATH,
  USAGE_STORE_PATH,
  FEATURE_FLAG_RESOLVER_PATH,
]) {
  assertTrue(existsSync(path), `Required file must exist: ${path}`);
}

const mainPlanSource = readSource(MAIN_PLAN_PATH);
const routeMatrixSource = readSource(ROUTE_MATRIX_PATH);
const roadmapKisSource = readSource(ROADMAP_KIS_PATH);
const approvalChecklistSource = readSource(APPROVAL_CHECKLIST_PATH);
const changelogSource = readSource(CHANGELOG_PATH);
const packageJsonSource = readSource(PACKAGE_JSON_PATH);
const routeSource = readSource(ROUTE_PATH);
const chartAiUiSource = readSource(CHART_AI_UI_PATH);
const authSubjectResolverSource = readSource(AUTH_SUBJECT_RESOLVER_PATH);
const roleAssignmentResolverSource = readSource(ROLE_ASSIGNMENT_RESOLVER_PATH);
const usageStoreSource = readSource(USAGE_STORE_PATH);
const featureFlagResolverSource = readSource(FEATURE_FLAG_RESOLVER_PATH);

// --- package.json / changelog -------------------------------------------------------------------

assertMatchIn(
  packageJsonSource,
  /"check:phase-3fc-g-guarded-route-integration-plan-refresh":\s*"node scripts\/check_phase_3fc_g_guarded_route_integration_plan_refresh_contract\.mjs"/,
  'package.json must register this checker script',
);
assertMatchIn(changelogSource, /##\s*Phase 3FC-G\s*-\s*2026-07-04/, 'planning_changelog.md must contain a Phase 3FC-G entry dated 2026-07-04');

// --- Main plan: title and required numbered sections ---------------------------------------------

assertMatchIn(
  mainPlanSource,
  /^# Phase 3FC-G — Guarded Route Integration Plan Refresh/m,
  'Main plan doc must have the exact title heading',
);

const REQUIRED_MAIN_PLAN_SECTIONS = [
  'Status',
  'Current Scaffold Inventory',
  'Existing Route Boundary',
  'Future Guarded Route Branch Concept',
  'Proposed Future Route Flow',
  'Feature Flag Gate Rules',
  'Safe Failure Mapping',
  'Redaction and Response Policy',
  'Usage Increment Policy',
  'Route Non-Regression Requirements',
  'Validation Plan Before Route Code Change',
  'Actual KIS API Connection Stage',
  'Recommended Next Phase',
];
for (const section of REQUIRED_MAIN_PLAN_SECTIONS) {
  assertMatchIn(
    mainPlanSource,
    new RegExp(`^##\\s*\\d+\\.\\s*${section}\\b`, 'm'),
    `Main plan doc must contain the required numbered section header: ${section}`,
  );
}
assertMatchIn(mainPlanSource, /Phase 3FC-H\b/, 'Main plan doc must recommend Phase 3FC-H as the next phase');
assertMatchIn(mainPlanSource, /Phase 3FC-H-ALT\b/, 'Main plan doc must reference Phase 3FC-H-ALT as an alternative next phase');

// --- Main plan: content assertions for specific required statements ------------------------------

assertMatchIn(mainPlanSource, /no runtime source was changed/i, 'Main plan doc must state no runtime source was changed');
assertMatchIn(mainPlanSource, /no route integration/i, 'Main plan doc must state there is no route integration');
assertMatchIn(mainPlanSource, /no live KIS/i, 'Main plan doc must state no live KIS');
assertMatchIn(
  mainPlanSource,
  /routeSuccessAllowed[\s\S]{0,80}false|remains false/i,
  'Main plan doc must state route success remains false',
);
assertMatchIn(
  mainPlanSource,
  /network\/TCP reachability|TCP reachability/i,
  'Main plan doc must reference network/TCP reachability for the KIS stage',
);
assertMatchIn(
  mainPlanSource,
  /betaDependenciesSatisfied|beta.*auth.*usage.*beta flag|auth runtime.*usage storage.*beta flag/i,
  'Main plan doc must describe the beta dependency requirement (auth + usage + beta flag)',
);

// --- Route matrix: title and required numbered sections -------------------------------------------

assertMatchIn(
  routeMatrixSource,
  /^# Phase 3FC-G Route Contract Matrix/m,
  'Route matrix doc must have the exact title heading',
);

const REQUIRED_ROUTE_MATRIX_SECTIONS = [
  'Purpose',
  'Current Route Branches',
  'Future Branch Proposal',
  'Future Response Mapping',
  'Mutual Exclusion Rules',
  'Regression Requirements',
];
for (const section of REQUIRED_ROUTE_MATRIX_SECTIONS) {
  assertMatchIn(
    routeMatrixSource,
    new RegExp(`^##\\s*\\d+\\.\\s*${section}\\b`, 'm'),
    `Route matrix doc must contain the required numbered section header: ${section}`,
  );
}
assertMatchIn(
  routeMatrixSource,
  /isOwnerLocalMockedSimilarityApiRequestBody|owner-local-mocked/,
  'Route matrix doc must reference the current owner-local mocked branch',
);
assertMatchIn(
  routeMatrixSource,
  /isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody|owner-local-auth-usage-bridge/,
  'Route matrix doc must reference the current owner-local auth/usage bridge branch',
);
assertMatchIn(
  routeMatrixSource,
  /guarded-runtime-scaffold/,
  'Route matrix doc must reference the future guarded-runtime-scaffold branch proposal',
);
assertMatchIn(
  routeMatrixSource,
  /feature-disabled shell|feature disabled/i,
  'Route matrix doc must reference the current default feature-disabled shell branch',
);

// --- Roadmap/KIS doc: title and required numbered sections -----------------------------------------

assertMatchIn(
  roadmapKisSource,
  /^# Phase 3FC-G Chart AI Remaining Roadmap and Actual KIS API Stage/m,
  'Roadmap/KIS doc must have the exact title heading',
);

const REQUIRED_ROADMAP_SECTIONS = [
  'Current Position',
  'Recommended Roadmap',
  'Actual KIS API Connection Status',
  'KIS Approval Requirements',
  'Public/Beta Activation Requirements',
  'Recommended Decision',
];
for (const section of REQUIRED_ROADMAP_SECTIONS) {
  assertMatchIn(
    roadmapKisSource,
    new RegExp(`^##\\s*\\d+\\.\\s*${section.replace('/', '\\/')}\\b`, 'm'),
    `Roadmap/KIS doc must contain the required numbered section header: ${section}`,
  );
}

const REQUIRED_ROADMAP_PHASE_REFERENCES = [
  '3FC-H',
  '3FC-I',
  '3FC-J',
  '3FD-A',
  '3FD-B',
  '3FD-C',
  '3FD-D',
  '3FD-E',
  '3FE-A',
  '3FE-B',
  '3FE-C',
];
for (const phaseRef of REQUIRED_ROADMAP_PHASE_REFERENCES) {
  assertTrue(
    roadmapKisSource.includes(phaseRef),
    `Roadmap/KIS doc must reference the required future phase: ${phaseRef}`,
  );
}
assertMatchIn(roadmapKisSource, /not connected/i, 'Roadmap/KIS doc must state actual KIS is not connected');
assertMatchIn(
  roadmapKisSource,
  /separate(ly)? approv/i,
  'Roadmap/KIS doc must state KIS requires separate approval',
);
assertMatchIn(
  roadmapKisSource,
  /network\/TCP reachability|TCP reachability/i,
  'Roadmap/KIS doc must state network/TCP reachability must be confirmed',
);
assertMatchIn(
  roadmapKisSource,
  /no raw.*KIS.*print|no OHLC price\/volume\/timestamp printing/i,
  'Roadmap/KIS doc must state no raw KIS values should be printed',
);
assertMatchIn(
  roadmapKisSource,
  /LIVE_KIS_OHLC_ENABLED/,
  'Roadmap/KIS doc must state LIVE_KIS_OHLC_ENABLED remains separately gated',
);

// --- Owner approval checklist: title and required numbered sections ---------------------------------

assertMatchIn(
  approvalChecklistSource,
  /^# Phase 3FC-G Owner Approval Gate Checklist/m,
  'Owner approval checklist doc must have the exact title heading',
);

const REQUIRED_APPROVAL_SECTIONS = [
  'Purpose',
  'Route Scaffold Approval',
  'Real Supabase Approval',
  'Real DB Approval',
  'Beta Approval',
  'Live KIS Approval',
];
for (const section of REQUIRED_APPROVAL_SECTIONS) {
  assertMatchIn(
    approvalChecklistSource,
    new RegExp(`^##\\s*\\d+\\.\\s*${section}\\b`, 'm'),
    `Owner approval checklist doc must contain the required numbered section header: ${section}`,
  );
}
assertMatchIn(
  approvalChecklistSource,
  /- \[ \] Approve Phase 3FC-H route scaffold/,
  'Owner approval checklist must include a route scaffold approval checkbox for Phase 3FC-H',
);
assertMatchIn(
  approvalChecklistSource,
  /- \[ \] Approve package install/,
  'Owner approval checklist must include a package install approval checkbox',
);
assertMatchIn(
  approvalChecklistSource,
  /- \[ \] Approve SQL\/migration design/,
  'Owner approval checklist must include a SQL/migration design approval checkbox',
);
assertMatchIn(
  approvalChecklistSource,
  /- \[ \] Legal\/disclaimer review/,
  'Owner approval checklist must include a legal/disclaimer review checkbox under beta approval',
);
assertMatchIn(
  approvalChecklistSource,
  /- \[ \] Confirm network\/TCP reachability/,
  'Owner approval checklist must include a network/TCP reachability confirmation checkbox under live KIS approval',
);
assertMatchIn(
  approvalChecklistSource,
  /- \[ \] Confirm `?LIVE_KIS_OHLC_ENABLED`? remains false/,
  'Owner approval checklist must include a checkbox confirming LIVE_KIS_OHLC_ENABLED remains false until separate approval',
);

// --- Runtime boundary: route/UI/scaffold files must show no drift from this documentation phase ----

assertMatchIn(
  routeSource,
  /isOwnerLocalMockedSimilarityApiRequestBody\(body\)/,
  'Route file must still contain the owner-local mocked branch guard',
);
assertMatchIn(
  routeSource,
  /isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody\(body\)/,
  'Route file must still contain the owner-local auth/usage bridge branch guard',
);
const dispatchBranchMatches = routeSource.match(/isOwnerLocal\w+\(body\)/g) || [];
assertTrue(
  dispatchBranchMatches.length === 2,
  `Route dispatch branch count must remain exactly 2 (found ${dispatchBranchMatches.length}) — this documentation-only phase adds no new route branch`,
);
assertNotMatchIn(
  routeSource,
  /guarded-runtime-scaffold|similarityFeatureFlagResolver|similarityRoleAssignmentResolver|similarityUsageStore|similarityAuthSubjectResolver/,
  'Route file must not import or reference any of the four scaffold modules or the future guarded-runtime-scaffold branch in this phase',
);

assertMatchIn(
  chartAiUiSource,
  /chartAiOwnerLocalAuthUsageBridgePanel/,
  'chart-ai.astro must still contain the chartAiOwnerLocalAuthUsageBridgePanel identifier',
);
assertNotMatchIn(
  chartAiUiSource,
  /guarded-runtime-scaffold|similarityFeatureFlagResolver|similarityRoleAssignmentResolver|similarityUsageStore\b|similarityAuthSubjectResolver/,
  'chart-ai.astro must not reference any of the four scaffold modules or the future guarded-runtime-scaffold branch in this phase',
);

assertMatchIn(
  authSubjectResolverSource,
  /export const resolveSimilarityAuthSubject\s*=/,
  'The Phase 3FC-C auth subject resolver export must remain unchanged',
);
assertMatchIn(
  roleAssignmentResolverSource,
  /export const resolveSimilarityRoleAssignment\s*=/,
  'The Phase 3FC-D role assignment resolver export must remain unchanged',
);
assertMatchIn(
  usageStoreSource,
  /export const loadSimilarityUsageSnapshot\s*=/,
  'The Phase 3FC-E usage store export must remain unchanged',
);
assertMatchIn(
  featureFlagResolverSource,
  /export const resolveSimilarityFeatureFlags\s*=/,
  'The Phase 3FC-F feature flag resolver export must remain unchanged',
);

// --- Forbidden documentation content across all four new docs -------------------------------------

const ALL_NEW_DOC_SOURCES = [mainPlanSource, routeMatrixSource, roadmapKisSource, approvalChecklistSource];
const combinedDocSource = ALL_NEW_DOC_SOURCES.join('\n');

assertNotMatchIn(
  combinedDocSource,
  /process\.env\.\w+\s*=\s*['"][^'"]/,
  'Planning docs must not contain an actual credential/env value assignment',
);
assertNotMatchIn(
  combinedDocSource,
  /KIS_APP_KEY\s*[:=]\s*['"][\w-]{6,}|KIS_APP_SECRET\s*[:=]\s*['"][\w-]{6,}/,
  'Planning docs must not contain an actual KIS credential value',
);
assertNotMatchIn(
  combinedDocSource,
  /"open"\s*:\s*\d|"close"\s*:\s*\d|"volume"\s*:\s*\d/,
  'Planning docs must not contain a raw OHLC/volume payload example with numeric values',
);
assertNotMatchIn(
  combinedDocSource,
  /accountId["'\s:]+\d|balanceAmount["'\s:]+\d|orderId["'\s:]+\d/i,
  'Planning docs must not contain raw account/trading/order/balance data examples',
);
assertNotMatchIn(
  combinedDocSource,
  /migration (has been|was) (run|executed|applied)/i,
  'Planning docs must not claim a SQL migration has actually been executed',
);
assertNotMatchIn(
  combinedDocSource,
  /(has been|was) (deployed|pushed) to (production|main|remote)/i,
  'Planning docs must not claim a deploy or push has actually occurred',
);

// --- Hard structural requirement: this checker must run at least 90 assertions ------------------

const MINIMUM_REQUIRED_ASSERTION_COUNT = 90;
assertTrue(
  assertionCount >= MINIMUM_REQUIRED_ASSERTION_COUNT,
  `Checker must run at least ${MINIMUM_REQUIRED_ASSERTION_COUNT} assertions (ran ${assertionCount})`,
);

if (failures.length > 0) {
  process.stdout.write(`Phase 3FC-G checker: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
  for (const failure of failures) {
    process.stdout.write(`  - ${failure}\n`);
  }
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3FC-G checker: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  process.exitCode = 0;
}
