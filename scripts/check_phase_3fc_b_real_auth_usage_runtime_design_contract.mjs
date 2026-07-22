/**
 * Static contract checker for Phase 3FC-B (Real Auth/Usage Runtime Design Finalization from Owner
 * Decisions, No Live KIS).
 *
 * This phase adds no runtime capability. It only finalizes a design package (a main runtime
 * design document, a Supabase auth/usage storage design document, a future runtime module plan,
 * and a beta release gate checklist), plus registers one npm script and one changelog entry. This
 * checker inspects those new documents, `package.json`, and `planning_changelog.md` as raw text
 * (no build, no dev server, no browser, no live KIS), and does a light regression check that key
 * Phase 3EY-C/3FB runtime identifiers this phase must not touch are still present unchanged. This
 * is a focused checker (a bounded assertion list), not a full historical checker suite.
 *
 * Run:
 *   npm run check:phase-3fc-b-real-auth-usage-runtime-design
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

const MAIN_DOC_PATH = 'docs/planning/phase_3fc_b_real_auth_usage_runtime_design_finalization_v0.1.md';
const SUPABASE_DOC_PATH = 'docs/planning/phase_3fc_b_supabase_auth_usage_storage_design_v0.1.md';
const MODULE_PLAN_PATH = 'docs/planning/phase_3fc_b_runtime_module_plan_v0.1.md';
const BETA_GATE_PATH = 'docs/planning/phase_3fc_b_beta_release_gate_checklist_v0.1.md';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON_PATH = 'package.json';
const SIMILARITY_ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const GUARD_TYPES_PATH = 'src/lib/server/chartSimilarity/similarityExecutionGuardTypes.ts';
const GUARD_PATH = 'src/lib/server/chartSimilarity/similarityExecutionGuard.ts';
const CHART_AI_UI_PATH = 'src/pages/chart-ai.astro';

for (const path of [
  MAIN_DOC_PATH,
  SUPABASE_DOC_PATH,
  MODULE_PLAN_PATH,
  BETA_GATE_PATH,
  CHANGELOG_PATH,
  PACKAGE_JSON_PATH,
  SIMILARITY_ROUTE_PATH,
  GUARD_TYPES_PATH,
  GUARD_PATH,
  CHART_AI_UI_PATH,
]) {
  assertTrue(existsSync(path), `Required file must exist: ${path}`);
}

const mainDocSource = readSource(MAIN_DOC_PATH);
const supabaseDocSource = readSource(SUPABASE_DOC_PATH);
const modulePlanSource = readSource(MODULE_PLAN_PATH);
const betaGateSource = readSource(BETA_GATE_PATH);
const changelogSource = readSource(CHANGELOG_PATH);
const packageJsonSource = readSource(PACKAGE_JSON_PATH);
const similarityRouteSource = readSource(SIMILARITY_ROUTE_PATH);
const guardTypesSource = readSource(GUARD_TYPES_PATH);
const guardSource = readSource(GUARD_PATH);
const chartAiUiSource = readSource(CHART_AI_UI_PATH);

// --- Main design doc: required sections ----------------------------------------------------------

const MAIN_DOC_REQUIRED_HEADERS = [
  /##\s*1\.\s*Status/,
  /##\s*2\.\s*Approved Inputs/,
  /##\s*3\.\s*Current Runtime Boundary/,
  /##\s*4\.\s*Target Runtime Architecture/,
  /##\s*5\.\s*Supabase Auth Mapping Design/,
  /##\s*6\.\s*Usage Storage Design/,
  /##\s*7\.\s*Role and Limit Policy/,
  /##\s*8\.\s*Usage Transaction Design/,
  /##\s*9\.\s*Feature Flag Design/,
  /##\s*10\.\s*Safe Response Contract/,
  /##\s*11\.\s*Future Module Plan/,
  /##\s*12\.\s*Implementation Sequence/,
  /##\s*13\.\s*Risks and Mitigations/,
  /##\s*14\.\s*Go\/No-Go Criteria/,
  /##\s*15\.\s*Recommended Next Phase/,
];

for (const pattern of MAIN_DOC_REQUIRED_HEADERS) {
  assertMatchIn(mainDocSource, pattern, `Main design doc must include section matching: ${pattern}`);
}

// --- Main design doc: approved inputs must match owner-approved decisions ------------------------

assertMatchIn(mainDocSource, /Supabase Auth/, 'Main design doc must record Supabase Auth as the approved auth strategy');
assertMatchIn(
  mainDocSource,
  /Postgres\/Supabase-style/,
  'Main design doc must record Postgres/Supabase-style table as the approved usage storage',
);
assertMatchIn(mainDocSource, /anonymous\s*\|\s*0\s*\|\s*0\s*\|\s*No/, 'Main design doc role table must record anonymous: 0/0/No');
assertMatchIn(
  mainDocSource,
  /authenticated\s*\|\s*3\s*\|\s*30\s*\|\s*Yes/,
  'Main design doc role table must record authenticated: 3/30/Yes',
);
assertMatchIn(mainDocSource, /beta\s*\|\s*10\s*\|\s*100\s*\|\s*Yes/, 'Main design doc role table must record beta: 10/100/Yes');
assertMatchIn(
  mainDocSource,
  /owner\s*\|\s*50\s*\|\s*1,000\s*\|\s*Yes/,
  'Main design doc role table must record owner: 50/1,000/Yes',
);
assertMatchIn(
  mainDocSource,
  /admin\s*\|\s*100\s*\|\s*3,000\s*\|\s*Yes/,
  'Main design doc role table must record admin: 100/3,000/Yes',
);
assertMatchIn(mainDocSource, /AUTH_RUNTIME_ENABLED/, 'Main design doc must reference AUTH_RUNTIME_ENABLED');
assertMatchIn(mainDocSource, /USAGE_STORAGE_ENABLED/, 'Main design doc must reference USAGE_STORAGE_ENABLED');
assertMatchIn(
  mainDocSource,
  /CHART_AI_SIMILARITY_BETA_ENABLED/,
  'Main design doc must reference CHART_AI_SIMILARITY_BETA_ENABLED',
);
assertMatchIn(
  mainDocSource,
  /CHART_AI_SIMILARITY_PUBLIC_ENABLED[\s\S]{0,80}[Nn]ot approved/,
  'Main design doc must state CHART_AI_SIMILARITY_PUBLIC_ENABLED is not approved for activation',
);
assertMatchIn(
  mainDocSource,
  /LIVE_KIS_OHLC_ENABLED/,
  'Main design doc must reference LIVE_KIS_OHLC_ENABLED as not approved for activation',
);

// --- Main design doc: required content assertions --------------------------------------------------

assertMatchIn(
  mainDocSource,
  /no runtime source was changed/i,
  'Main design doc must explicitly state no runtime source was changed',
);
assertMatchIn(
  mainDocSource,
  /No\s+Supabase implementation exists/i,
  'Main design doc must explicitly state no Supabase implementation exists',
);
assertMatchIn(
  mainDocSource,
  /No usage storage implementation exists/i,
  'Main design doc must explicitly state no usage storage implementation exists',
);
assertMatchIn(
  mainDocSource,
  /No SQL\/migration was\s+created/i,
  'Main design doc must explicitly state no SQL/migration was created',
);
assertMatchIn(mainDocSource, /No live KIS call was made/i, 'Main design doc must explicitly state no live KIS call was made');
assertMatchIn(mainDocSource, /No deploy, no push/i, 'Main design doc must explicitly state no deploy, no push');
assertMatchIn(
  mainDocSource,
  /evaluateSimilarityExecutionGuard/,
  'Main design doc target runtime architecture must reference evaluateSimilarityExecutionGuard',
);
assertMatchIn(
  mainDocSource,
  /usage increment transaction/i,
  'Main design doc must describe a usage increment transaction',
);
assertMatchIn(
  mainDocSource,
  /idempotency key/i,
  'Main design doc usage transaction design must reference an idempotency key',
);
assertMatchIn(
  mainDocSource,
  /never include|must continue to exclude|must not|never expose/i,
  'Main design doc safe response contract must state forbidden fields are excluded',
);

// --- Supabase design doc: required sections ---------------------------------------------------------

const SUPABASE_DOC_REQUIRED_HEADERS = [
  /##\s*1\.\s*Purpose/,
  /##\s*2\.\s*Supabase Auth Boundary/,
  /##\s*3\.\s*Role Assignment Model/,
  /##\s*4\.\s*Usage Counter Model/,
  /##\s*5\.\s*Usage Event Model/,
  /##\s*6\.\s*Feature Flag Model/,
  /##\s*7\.\s*Conceptual Schema/,
  /##\s*8\.\s*RLS\s*\/\s*Permission Considerations/,
  /##\s*9\.\s*Implementation Preconditions/,
];

for (const pattern of SUPABASE_DOC_REQUIRED_HEADERS) {
  assertMatchIn(supabaseDocSource, pattern, `Supabase design doc must include section matching: ${pattern}`);
}

assertMatchIn(
  supabaseDocSource,
  /session validation happens only on the server/i,
  'Supabase design doc must state server-only session validation',
);
assertMatchIn(
  supabaseDocSource,
  /no access token, refresh token, or raw session payload is echoed/i,
  'Supabase design doc must state no token echo',
);
assertMatchIn(
  supabaseDocSource,
  /no client-side privilege is trusted/i,
  'Supabase design doc must state no client-side privilege is trusted',
);
assertMatchIn(
  supabaseDocSource,
  /role_assignments/,
  'Supabase design doc must reference role_assignments',
);
assertMatchIn(
  supabaseDocSource,
  /usage_counters/,
  'Supabase design doc must reference usage_counters',
);
assertMatchIn(
  supabaseDocSource,
  /usage_events/,
  'Supabase design doc must reference usage_events',
);
assertMatchIn(
  supabaseDocSource,
  /##\s*7\.\s*Conceptual Schema[\s\S]*\|/,
  'Supabase design doc conceptual schema section must contain a markdown table',
);
assertMatchIn(
  supabaseDocSource,
  /##\s*8\.\s*RLS[\s\S]*?server-side/i,
  'Supabase design doc RLS/permission section must discuss server-side access',
);

// --- Runtime module plan: required sections and modules ---------------------------------------------

const MODULE_PLAN_REQUIRED_HEADERS = [
  /##\s*1\.\s*Scope/,
  /##\s*2\.\s*Proposed Modules/,
  /##\s*3\.\s*Route Flow/,
  /##\s*4\.\s*Failure Modes/,
  /##\s*5\.\s*Checker\/Smoke Plan/,
];

for (const pattern of MODULE_PLAN_REQUIRED_HEADERS) {
  assertMatchIn(modulePlanSource, pattern, `Runtime module plan must include section matching: ${pattern}`);
}

const REQUIRED_MODULES = [
  /Auth subject resolver/,
  /Role resolver/,
  /Usage snapshot loader/,
  /Usage incrementer/,
  /Feature flag resolver/,
  /Route integration adapter/,
  /Redaction\/safe response verifier/,
];

for (const pattern of REQUIRED_MODULES) {
  assertMatchIn(modulePlanSource, pattern, `Runtime module plan must list module matching: ${pattern}`);
}

// --- Beta release gate checklist: required sections and gates ---------------------------------------

const BETA_GATE_REQUIRED_HEADERS = [
  /##\s*1\.\s*Purpose/,
  /##\s*2\.\s*Required Before Beta/,
  /##\s*3\.\s*Required Before Public/,
  /##\s*4\.\s*Explicitly Not Approved Yet/,
];

for (const pattern of BETA_GATE_REQUIRED_HEADERS) {
  assertMatchIn(betaGateSource, pattern, `Beta release gate checklist must include section matching: ${pattern}`);
}

assertMatchIn(betaGateSource, /Real auth implemented/, 'Beta gate checklist must require real auth implemented before beta');
assertMatchIn(
  betaGateSource,
  /Usage storage implemented/,
  'Beta gate checklist must require usage storage implemented before beta',
);
assertMatchIn(
  betaGateSource,
  /Public feature flag[\s\S]{0,80}approval/,
  'Beta gate checklist must require public feature flag approval before public',
);
assertMatchIn(
  betaGateSource,
  /Live KIS[\s\S]{0,40}enabled only if separately resolved/,
  'Beta gate checklist must require live KIS to remain separately resolved before public',
);

const betaGateCheckboxCount = (betaGateSource.match(/- \[ \]/g) ?? []).length;
assertTrue(betaGateCheckboxCount >= 15, 'Beta gate checklist must contain a substantial number of fillable checkboxes');

// --- package.json: new script registered --------------------------------------------------------

assertMatchIn(
  packageJsonSource,
  /"check:phase-3fc-b-real-auth-usage-runtime-design":\s*"node scripts\/check_phase_3fc_b_real_auth_usage_runtime_design_contract\.mjs"/,
  'package.json must register the new Phase 3FC-B check script',
);

// --- planning_changelog.md: new top entry ---------------------------------------------------------

assertMatchIn(changelogSource, /##\s*Phase 3FC-B\s*-\s*2026-07-04/, 'planning_changelog.md must contain a Phase 3FC-B entry');
assertMatchIn(
  changelogSource,
  /Real Auth\/Usage Runtime Design Finalization/,
  'planning_changelog.md must describe the Phase 3FC-B entry title',
);

// --- Runtime non-drift regression: existing identifiers must remain present unchanged -----------

assertMatchIn(
  similarityRouteSource,
  /owner-local-auth-usage-bridge/,
  'similarity.ts must still contain the owner-local-auth-usage-bridge mode string (no runtime removal expected)',
);
assertMatchIn(
  similarityRouteSource,
  /buildSimilarityApiRouteShellResult/,
  'similarity.ts must still default to the feature-disabled shell response builder (no runtime removal expected)',
);
assertMatchIn(
  guardSource,
  /evaluateSimilarityExecutionGuard/,
  'similarityExecutionGuard.ts must still export evaluateSimilarityExecutionGuard (no runtime removal expected)',
);
assertMatchIn(
  guardTypesSource,
  /SimilarityExecutionRole/,
  'similarityExecutionGuardTypes.ts must still define SimilarityExecutionRole (no runtime change expected)',
);
assertMatchIn(
  chartAiUiSource,
  /chartAiOwnerLocalAuthUsageBridgePanel/,
  'chart-ai.astro must still contain the Phase 3FB-E auth/usage bridge panel id (no runtime removal expected)',
);

const dispatchBranchCount = (similarityRouteSource.match(/if \(isOwnerLocal\w+\(body\)\)/g) ?? []).length;
assertTrue(
  dispatchBranchCount === 2,
  'similarity.ts must still have exactly the two existing owner-local dispatch branches, no third branch added by this phase',
);

// --- Report ---------------------------------------------------------------------------------------

if (failures.length > 0) {
  console.error(`Phase 3FC-B checker: FAIL (${failures.length}/${assertionCount} assertions failed)`);
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log(`Phase 3FC-B checker: PASS (${assertionCount}/${assertionCount} assertions passed)`);
