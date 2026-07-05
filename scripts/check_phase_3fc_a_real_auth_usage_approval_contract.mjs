/**
 * Static contract checker for Phase 3FC-A (Real Auth Provider Selection and Usage Storage
 * Approval, No Live KIS).
 *
 * This phase adds no runtime capability. It only creates an architecture decision/approval
 * package (a main decision document, a decision matrix, and an owner approval form), plus
 * registers one npm script and one changelog entry. This checker inspects those new documents,
 * `package.json`, and `planning_changelog.md` as raw text (no build, no dev server, no browser,
 * no live KIS), and does a light regression check that key Phase 3EY-C/3FB runtime identifiers
 * this phase must not touch are still present unchanged. This is a focused checker (a bounded
 * assertion list), not a full historical checker suite.
 *
 * Run:
 *   npm run check:phase-3fc-a-real-auth-usage-approval
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

const MAIN_DOC_PATH =
  'docs/planning/phase_3fc_a_real_auth_provider_selection_usage_storage_approval_v0.1.md';
const DECISION_MATRIX_PATH = 'docs/planning/phase_3fc_a_auth_usage_decision_matrix_v0.1.md';
const APPROVAL_FORM_PATH = 'docs/planning/phase_3fc_a_owner_approval_form_v0.1.md';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON_PATH = 'package.json';
const GUARD_TYPES_PATH = 'src/lib/server/chartSimilarity/similarityExecutionGuardTypes.ts';
const GUARD_POLICY_PATH = 'src/lib/server/chartSimilarity/similarityExecutionGuardPolicy.ts';
const CHART_AI_UI_PATH = 'src/pages/chart-ai.astro';
const SIMILARITY_ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';

for (const path of [
  MAIN_DOC_PATH,
  DECISION_MATRIX_PATH,
  APPROVAL_FORM_PATH,
  CHANGELOG_PATH,
  PACKAGE_JSON_PATH,
  GUARD_TYPES_PATH,
  GUARD_POLICY_PATH,
  CHART_AI_UI_PATH,
  SIMILARITY_ROUTE_PATH,
]) {
  assertTrue(existsSync(path), `Required file must exist: ${path}`);
}

const mainDocSource = readSource(MAIN_DOC_PATH);
const decisionMatrixSource = readSource(DECISION_MATRIX_PATH);
const approvalFormSource = readSource(APPROVAL_FORM_PATH);
const changelogSource = readSource(CHANGELOG_PATH);
const packageJsonSource = readSource(PACKAGE_JSON_PATH);
const guardTypesSource = readSource(GUARD_TYPES_PATH);
const guardPolicySource = readSource(GUARD_POLICY_PATH);
const chartAiUiSource = readSource(CHART_AI_UI_PATH);
const similarityRouteSource = readSource(SIMILARITY_ROUTE_PATH);

// --- Main decision doc: required sections -------------------------------------------------------

const MAIN_DOC_REQUIRED_HEADERS = [
  /##\s*1\.\s*Status/,
  /##\s*2\.\s*Background/,
  /##\s*3\.\s*Current Runtime Boundary/,
  /##\s*4\.\s*Auth Strategy Options/,
  /##\s*5\.\s*Usage Storage Options/,
  /##\s*6\.\s*Recommended Initial Architecture/,
  /##\s*7\.\s*Proposed Role Tiers and Usage Limits/,
  /##\s*8\.\s*Data Model Proposal/,
  /##\s*9\.\s*Route Integration Plan/,
  /##\s*10\.\s*Feature Flag and Release Gates/,
  /##\s*11\.\s*Go\/No-Go for Next Implementation Phase/,
  /##\s*12\.\s*Open Questions for Owner/,
  /##\s*13\.\s*Recommended Next Phase/,
];

for (const pattern of MAIN_DOC_REQUIRED_HEADERS) {
  assertMatchIn(mainDocSource, pattern, `Main decision doc must include section matching: ${pattern}`);
}

// --- Main decision doc: auth strategy option coverage --------------------------------------------

const AUTH_OPTIONS = [
  /App-native/,
  /Supabase Auth/,
  /Auth\.js\s*\/\s*NextAuth/,
  /[Mm]anaged identity provider/,
  /[Tt]emporary invite-code/,
];

for (const pattern of AUTH_OPTIONS) {
  assertMatchIn(mainDocSource, pattern, `Main decision doc auth strategy section must mention option matching: ${pattern}`);
}

// --- Main decision doc: usage storage option coverage ---------------------------------------------

const USAGE_OPTIONS = [
  /In-memory only/,
  /Local file/,
  /Vercel KV\s*\/\s*Redis-style/,
  /Postgres\/Supabase table/,
  /[Ee]xisting app database/,
  /Hybrid audit-log \+ counter/,
];

for (const pattern of USAGE_OPTIONS) {
  assertMatchIn(mainDocSource, pattern, `Main decision doc usage storage section must mention option matching: ${pattern}`);
}

// --- Main decision doc: role tier coverage --------------------------------------------------------

const ROLE_TIERS = [/anonymous/, /authenticated/, /\bbeta\b/, /\bowner\b/, /\badmin\b/];

for (const pattern of ROLE_TIERS) {
  assertMatchIn(mainDocSource, pattern, `Main decision doc role tier table must mention role matching: ${pattern}`);
}

// --- Main decision doc: required content assertions ------------------------------------------------

assertMatchIn(
  mainDocSource,
  /no runtime source was changed/i,
  'Main decision doc must explicitly state no runtime source was changed',
);
assertMatchIn(
  mainDocSource,
  /no real auth is implemented/i,
  'Main decision doc must explicitly state no real auth is implemented',
);
assertMatchIn(
  mainDocSource,
  /no usage\s+storage is implemented/i,
  'Main decision doc must explicitly state no usage storage is implemented',
);
assertMatchIn(
  mainDocSource,
  /[Ll]ive KIS remains off/,
  'Main decision doc must explicitly state live KIS remains off',
);
assertMatchIn(
  mainDocSource,
  /[Nn]o deploy, no push/,
  'Main decision doc must explicitly state no deploy, no push',
);
assertMatchIn(
  mainDocSource,
  /owner approval is required/i,
  'Main decision doc must explicitly state owner approval is required before implementation',
);
assertMatchIn(
  mainDocSource,
  /not a final decision/i,
  'Main decision doc must state it does not make the final decision on the owner\'s behalf',
);
assertMatchIn(
  mainDocSource,
  /AUTH_RUNTIME_ENABLED/,
  'Main decision doc must propose the AUTH_RUNTIME_ENABLED feature flag',
);
assertMatchIn(
  mainDocSource,
  /USAGE_STORAGE_ENABLED/,
  'Main decision doc must propose the USAGE_STORAGE_ENABLED feature flag',
);
assertMatchIn(
  mainDocSource,
  /CHART_AI_SIMILARITY_BETA_ENABLED/,
  'Main decision doc must propose the CHART_AI_SIMILARITY_BETA_ENABLED feature flag',
);
assertMatchIn(
  mainDocSource,
  /CHART_AI_SIMILARITY_PUBLIC_ENABLED/,
  'Main decision doc must propose the CHART_AI_SIMILARITY_PUBLIC_ENABLED feature flag',
);
assertMatchIn(
  mainDocSource,
  /LIVE_KIS_OHLC_ENABLED/,
  'Main decision doc must reference the separate LIVE_KIS_OHLC_ENABLED flag',
);
assertMatchIn(
  mainDocSource,
  /GO for the next implementation phase/,
  'Main decision doc must define GO criteria for the next implementation phase',
);
assertMatchIn(
  mainDocSource,
  /NO-GO/,
  'Main decision doc must define NO-GO criteria',
);

const openQuestionCount = (mainDocSource.match(/^\d+\.\s/gm) ?? []).length;
assertTrue(
  openQuestionCount >= 8,
  'Main decision doc must contain at least 8 numbered items across its numbered lists (including Open Questions for Owner)',
);

// --- Decision matrix doc: required sections ---------------------------------------------------------

const DECISION_MATRIX_REQUIRED_HEADERS = [
  /##\s*1\.\s*Decision Summary/,
  /##\s*2\.\s*Auth Options Matrix/,
  /##\s*3\.\s*Usage Storage Matrix/,
  /##\s*4\.\s*Initial Recommendation/,
  /##\s*5\.\s*Decision Needed Before Coding/,
];

for (const pattern of DECISION_MATRIX_REQUIRED_HEADERS) {
  assertMatchIn(decisionMatrixSource, pattern, `Decision matrix doc must include section matching: ${pattern}`);
}

assertMatchIn(
  decisionMatrixSource,
  /no implementation decision.*is final until.*owner/i,
  'Decision matrix doc must state no implementation decision is final until owner approval',
);
assertMatchIn(
  decisionMatrixSource,
  /[Dd]o not use in-memory or local-file storage/,
  'Decision matrix doc must state in-memory/local-file storage must not be used for public/beta enforcement',
);

// --- Owner approval form: required sections and checkboxes -------------------------------------------

const APPROVAL_FORM_REQUIRED_HEADERS = [
  /##\s*1\.\s*Auth Strategy Decision/,
  /##\s*2\.\s*Usage Storage Decision/,
  /##\s*3\.\s*Role\/Limit Approval/,
  /##\s*4\.\s*Data Persistence Approval/,
  /##\s*5\.\s*Feature Flag Approval/,
  /##\s*6\.\s*Next Phase Approval/,
  /##\s*7\.\s*Owner Sign-off/,
];

for (const pattern of APPROVAL_FORM_REQUIRED_HEADERS) {
  assertMatchIn(approvalFormSource, pattern, `Owner approval form must include section matching: ${pattern}`);
}

const checkboxCount = (approvalFormSource.match(/- \[ \]/g) ?? []).length;
assertTrue(
  checkboxCount >= 15,
  'Owner approval form must contain a substantial number of fillable checkboxes across its sections',
);

assertMatchIn(
  approvalFormSource,
  /Approver:/,
  'Owner approval form must include an Approver sign-off field',
);
assertMatchIn(
  approvalFormSource,
  /Decision date:/,
  'Owner approval form must include a Decision date sign-off field',
);

// --- package.json: new script registered --------------------------------------------------------

assertMatchIn(
  packageJsonSource,
  /"check:phase-3fc-a-real-auth-usage-approval":\s*"node scripts\/check_phase_3fc_a_real_auth_usage_approval_contract\.mjs"/,
  'package.json must register the new Phase 3FC-A check script',
);

// --- planning_changelog.md: new top entry ---------------------------------------------------------

assertMatchIn(
  changelogSource,
  /##\s*Phase 3FC-A\s*-\s*2026-07-04/,
  'planning_changelog.md must contain a Phase 3FC-A entry',
);
assertMatchIn(
  changelogSource,
  /Real Auth Provider Selection and Usage Storage Approval/,
  'planning_changelog.md must describe the Phase 3FC-A entry title',
);

// --- Runtime non-drift regression: existing identifiers must remain present unchanged -----------

assertMatchIn(
  guardTypesSource,
  /SimilarityExecutionRole/,
  'similarityExecutionGuardTypes.ts must still define SimilarityExecutionRole (no runtime change expected)',
);
assertMatchIn(
  guardPolicySource,
  /buildDefaultSimilarityExecutionGuardPolicy/,
  'similarityExecutionGuardPolicy.ts must still define buildDefaultSimilarityExecutionGuardPolicy (no runtime change expected)',
);
assertMatchIn(
  guardPolicySource,
  /feature_disabled|CHART_AI_SIMILARITY_EXECUTION_ENABLED/,
  'similarityExecutionGuardPolicy.ts must still reference the execution-enabled feature flag concept (no runtime change expected)',
);
assertMatchIn(
  chartAiUiSource,
  /chartAiOwnerLocalAuthUsageBridgePanel/,
  'chart-ai.astro must still contain the Phase 3FB-E auth/usage bridge panel id (no runtime removal expected)',
);
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

const dispatchBranchCount = (similarityRouteSource.match(/if \(isOwnerLocal\w+\(body\)\)/g) ?? []).length;
assertTrue(
  dispatchBranchCount === 2,
  'similarity.ts must still have exactly the two existing owner-local dispatch branches, no third branch added by this phase',
);

// --- Report ---------------------------------------------------------------------------------------

if (failures.length > 0) {
  console.error(`Phase 3FC-A checker: FAIL (${failures.length}/${assertionCount} assertions failed)`);
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log(`Phase 3FC-A checker: PASS (${assertionCount}/${assertionCount} assertions passed)`);
