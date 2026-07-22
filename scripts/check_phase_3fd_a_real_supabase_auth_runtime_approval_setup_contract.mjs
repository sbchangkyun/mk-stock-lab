// Phase 3FD-A static contract checker.
// Documentation-only contract check: verifies the six new Phase 3FD-A planning docs, the
// changelog entry, and the package.json script line, and confirms no runtime/route/UI source file
// or dependency was touched by this phase. Does not start a dev server, does not read any
// environment variable, does not call KIS, and does not import Supabase.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

let assertionCount = 0;
let failureCount = 0;
const failures = [];

function assertTrue(condition, message) {
  assertionCount += 1;
  if (!condition) {
    failureCount += 1;
    failures.push(message);
  }
}

function flatten(source) {
  return source.replace(/\s+/g, ' ');
}

function assertHeadings(source, headings, docLabel) {
  const missing = headings.filter(
    (heading) => !new RegExp(`^${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm').test(source)
  );
  assertTrue(
    missing.length === 0,
    `${docLabel} must contain all required section headings (missing: ${missing.join(', ') || 'none'}).`
  );
}

function assertNoUnnegatedClaim(text, regex, description) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const violated = sentences.some((sentence) => regex.test(sentence) && !/\bno\b/i.test(sentence));
  assertTrue(!violated, description);
}

function readDoc(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  assertTrue(existsSync(fullPath), `Expected file to exist: ${relativePath}`);
  if (!existsSync(fullPath)) {
    return '';
  }
  return readFileSync(fullPath, 'utf8');
}

// ---------------------------------------------------------------------------
// 1. Files / scripts existence
// ---------------------------------------------------------------------------

const APPROVAL_PACKAGE_PATH = 'docs/planning/phase_3fd_a_real_supabase_auth_runtime_approval_package_v0.1.md';
const DEP_ENV_PLAN_PATH = 'docs/planning/phase_3fd_a_supabase_dependency_and_env_key_plan_v0.1.md';
const IMPL_PLAN_PATH = 'docs/planning/phase_3fd_a_supabase_auth_runtime_implementation_plan_v0.1.md';
const REDACTION_POLICY_PATH = 'docs/planning/phase_3fd_a_auth_redaction_and_subject_mapping_policy_v0.1.md';
const APPROVAL_FORM_PATH = 'docs/planning/phase_3fd_a_owner_approval_form_v0.1.md';
const RESULT_DOC_PATH = 'docs/planning/phase_3fd_a_real_supabase_auth_runtime_approval_setup_result_v0.1.md';
const CHECKER_PATH = 'scripts/check_phase_3fd_a_real_supabase_auth_runtime_approval_setup_contract.mjs';
const PACKAGE_JSON_PATH = 'package.json';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const CHART_AI_PAGE_PATH = 'src/pages/chart-ai.astro';
const AUTH_RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityAuthSubjectResolver.ts';
const ROLE_RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityRoleAssignmentResolver.ts';
const USAGE_STORE_PATH = 'src/lib/server/chartSimilarity/similarityUsageStore.ts';
const FLAG_RESOLVER_PATH = 'src/lib/server/chartSimilarity/similarityFeatureFlagResolver.ts';
const GUARDED_SCAFFOLD_PATH = 'src/lib/server/chartSimilarity/similarityGuardedRouteScaffold.ts';

assertTrue(existsSync(path.join(repoRoot, CHECKER_PATH)), 'Checker script itself must exist.');

const approvalPackageSource = readDoc(APPROVAL_PACKAGE_PATH);
const depEnvPlanSource = readDoc(DEP_ENV_PLAN_PATH);
const implPlanSource = readDoc(IMPL_PLAN_PATH);
const redactionPolicySource = readDoc(REDACTION_POLICY_PATH);
const approvalFormSource = readDoc(APPROVAL_FORM_PATH);
const resultDocSource = readDoc(RESULT_DOC_PATH);
const packageJsonSource = readDoc(PACKAGE_JSON_PATH);
const changelogSource = readDoc(CHANGELOG_PATH);
const routeSource = readDoc(ROUTE_PATH);
const chartAiSource = readDoc(CHART_AI_PAGE_PATH);
const authResolverSource = readDoc(AUTH_RESOLVER_PATH);
const roleResolverSource = readDoc(ROLE_RESOLVER_PATH);
const usageStoreSource = readDoc(USAGE_STORE_PATH);
const flagResolverSource = readDoc(FLAG_RESOLVER_PATH);
const guardedScaffoldSource = readDoc(GUARDED_SCAFFOLD_PATH);

const approvalPackageFlat = flatten(approvalPackageSource);
const depEnvPlanFlat = flatten(depEnvPlanSource);
const implPlanFlat = flatten(implPlanSource);
const redactionPolicyFlat = flatten(redactionPolicySource);
const approvalFormFlat = flatten(approvalFormSource);
const resultDocFlat = flatten(resultDocSource);
const changelogFlat = flatten(changelogSource);

assertTrue(
  packageJsonSource.includes('"check:phase-3fd-a-real-supabase-auth-runtime-approval-setup": "node scripts/check_phase_3fd_a_real_supabase_auth_runtime_approval_setup_contract.mjs"'),
  'package.json must contain the Phase 3FD-A check script line.'
);

assertTrue(
  changelogFlat.includes('## Phase 3FD-A - 2026-07-04'),
  'planning_changelog.md must contain a Phase 3FD-A entry.'
);
assertTrue(
  changelogFlat.includes('Real Supabase Auth Runtime Approval and Setup Package, No Runtime Change (Prepared)'),
  'planning_changelog.md Phase 3FD-A entry must use the exact required subtitle.'
);
assertTrue(
  changelogSource.indexOf('## Phase 3FD-A - 2026-07-04') < changelogSource.indexOf('## Phase 3FC-J - 2026-07-04'),
  'Phase 3FD-A changelog entry must appear above the Phase 3FC-J entry.'
);

// ---------------------------------------------------------------------------
// 2. Approval package content
// ---------------------------------------------------------------------------

assertTrue(
  approvalPackageSource.startsWith('# Phase 3FD-A Real Supabase Auth Runtime Approval Package'),
  'Approval package must start with the exact required title.'
);
assertHeadings(
  approvalPackageSource,
  [
    '## 1. Purpose',
    '## 2. Current Position',
    '## 3. Approval Required Before Implementation',
    '## 4. Explicit Non-Approvals',
    '## 5. Proposed Future Runtime Scope',
    '## 6. Owner Decision Summary',
  ],
  'Approval package'
);
assertTrue(
  /approval and setup package only/i.test(approvalPackageFlat),
  'Approval package must state it is an approval and setup package only.'
);
assertTrue(
  /does not implement real Supabase Auth runtime/i.test(approvalPackageFlat),
  'Approval package must state it does not implement real Supabase Auth runtime.'
);
assertTrue(
  /no package is installed/i.test(approvalPackageFlat),
  'Approval package must state no package is installed.'
);
assertTrue(
  /no real\s*Supabase client is created/i.test(approvalPackageFlat),
  'Approval package must state no real Supabase client is created.'
);
assertTrue(
  /no environment variable value is read/i.test(approvalPackageFlat),
  'Approval package must state no environment variable value is read.'
);
assertTrue(
  /no route success path is enabled/i.test(approvalPackageFlat),
  'Approval package must state no route success path is enabled.'
);
assertTrue(
  /no live KIS call is made/i.test(approvalPackageFlat),
  'Approval package must state no live KIS call is made.'
);
const approvalItemCount = (approvalPackageFlat.match(/(?=Using Supabase Auth as the real auth provider|Using the already-present|Candidate environment variable key names only|The proposed server-side session resolution design|The proposed cookie\/header handling design|The auth redaction policy|The subject mapping policy connecting|The feature-flag dependency rules|The explicit non-goals)/g) || []).length;
assertTrue(
  approvalItemCount >= 9,
  'Approval package Section 3 must list at least 9 required approvals.'
);
const nonApprovalCount = (approvalPackageFlat.match(/(?=Installing, removing, or upgrading any package|Configuring or reading any environment variable value|Creating a real Supabase client anywhere in runtime source|Any route integration change|Enabling a route success path|Any database schema or migration work|Real usage counter or usage event persistence|Real role assignment persistence|Beta or public activation|Live KIS connectivity)/g) || []).length;
assertTrue(
  nonApprovalCount >= 10,
  'Approval package Section 4 must list at least 10 explicit non-approvals.'
);
assertTrue(
  (approvalPackageSource.match(/^- \[ \]/gm) || []).length === 4,
  'Approval package Owner Decision Summary must contain exactly 4 checkboxes.'
);
assertTrue(
  /Phase 3FD-B/.test(approvalPackageFlat),
  'Approval package must reference Phase 3FD-B as the future implementation phase.'
);

// ---------------------------------------------------------------------------
// 3. Dependency / env key plan content
// ---------------------------------------------------------------------------

assertTrue(
  depEnvPlanSource.startsWith('# Phase 3FD-A Supabase Dependency and Environment Key Plan'),
  'Dependency/env key plan must start with the exact required title.'
);
assertHeadings(
  depEnvPlanSource,
  [
    '## 1. Purpose',
    '## 2. Current Dependency Inventory',
    '## 3. Candidate Additional Packages',
    '## 4. Candidate Environment Variable Key Names',
    '## 5. Environment Value Handling Policy',
    '## 6. Future Setup Checklist',
  ],
  'Dependency/env key plan'
);
assertTrue(
  /no package is installed, removed, or upgraded in this phase/i.test(depEnvPlanFlat),
  'Dependency/env key plan must state no package is installed, removed, or upgraded in this phase.'
);
assertTrue(
  /no dependency entry or lockfile is modified/i.test(depEnvPlanFlat),
  'Dependency/env key plan must state no dependency entry or lockfile is modified.'
);
assertTrue(
  /no environment variable value is read/i.test(depEnvPlanFlat),
  'Dependency/env key plan must state no environment variable value is read.'
);
assertTrue(
  /@supabase\/supabase-js.*already lists|already lists.*@supabase\/supabase-js/i.test(depEnvPlanFlat),
  'Dependency/env key plan must record whether @supabase/supabase-js is present in package.json.'
);
const supabaseDepPresent = /"@supabase\/supabase-js"\s*:\s*"/.test(packageJsonSource);
assertTrue(
  supabaseDepPresent,
  'package.json must actually list @supabase/supabase-js as a dependency, matching the plan doc claim.'
);
assertTrue(
  /existing dependency's presence does not itself approve real Supabase Auth runtime usage/i.test(depEnvPlanFlat),
  "Dependency/env key plan must state the existing dependency's presence does not itself approve real Supabase Auth runtime usage."
);
assertTrue(
  /Candidate Additional Packages/.test(depEnvPlanSource) && /no package should be installed in this phase/i.test(depEnvPlanFlat),
  'Dependency/env key plan must list candidate additional packages as approval-required only, not installed in this phase.'
);
const requiredEnvKeyNames = [
  'PUBLIC_SUPABASE_URL',
  'PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'AUTH_RUNTIME_ENABLED',
  'USAGE_STORAGE_ENABLED',
  'CHART_AI_SIMILARITY_BETA_ENABLED',
];
assertTrue(
  requiredEnvKeyNames.every((key) => depEnvPlanSource.includes(key)),
  `Dependency/env key plan must list all required candidate environment variable key names (${requiredEnvKeyNames.join(', ')}).`
);
assertTrue(
  /SUPABASE_SERVICE_ROLE_KEY.{0,40}\*\*high-risk\*\*|\*\*high-risk\*\*.{0,80}SUPABASE_SERVICE_ROLE_KEY/is.test(depEnvPlanFlat),
  'Dependency/env key plan must mark SUPABASE_SERVICE_ROLE_KEY as high-risk near its own mention.'
);
assertTrue(
  /values must never be printed in logs, documentation, or chat output/i.test(depEnvPlanFlat),
  'Dependency/env key plan must state values are never printed in logs, documentation, or chat output.'
);
assertTrue(
  (depEnvPlanSource.match(/^- \[ \]/gm) || []).length === 5,
  'Dependency/env key plan Future Setup Checklist must contain exactly 5 checkboxes.'
);

// ---------------------------------------------------------------------------
// 4. Implementation plan content
// ---------------------------------------------------------------------------

assertTrue(
  implPlanSource.startsWith('# Phase 3FD-A Supabase Auth Runtime Implementation Plan'),
  'Implementation plan must start with the exact required title.'
);
assertHeadings(
  implPlanSource,
  [
    '## 1. Purpose',
    '## 2. Target Future Module',
    '## 3. Proposed Future Flow',
    '## 4. Subject Mapping Policy',
    '## 5. Failure Modes',
    '## 6. Validation Plan',
    '## 7. Future Phase Proposal',
  ],
  'Implementation plan'
);
assertTrue(
  /future implementation plan only/i.test(implPlanFlat),
  'Implementation plan must state it is a future implementation plan only.'
);
assertTrue(
  /similarityAuthSubjectResolver\.ts/.test(implPlanSource),
  'Implementation plan must reference the existing similarityAuthSubjectResolver.ts scaffold.'
);
assertTrue(
  /AUTH_RUNTIME_ENABLED/.test(implPlanSource),
  'Implementation plan must gate the future module behind AUTH_RUNTIME_ENABLED.'
);
assertTrue(
  (implPlanSource.match(/^\d+\. /gm) || []).length >= 8,
  'Implementation plan Proposed Future Flow must contain at least 8 numbered steps.'
);
assertTrue(
  /No raw Supabase user id is echoed to the client/i.test(implPlanFlat),
  'Implementation plan Subject Mapping Policy must state no raw Supabase user id is echoed to the client.'
);
assertTrue(
  /client-supplied role claim is always ignored/i.test(implPlanFlat),
  'Implementation plan Subject Mapping Policy must state a client-supplied role claim is always ignored.'
);
const failureModeRowCount = (implPlanSource.match(/^\| .+ \| .+ \| .+ \| .+ \|$/gm) || []).length - 1;
assertTrue(
  failureModeRowCount >= 7,
  'Implementation plan Failure Modes table must contain at least 7 data rows.'
);
assertTrue(
  /Recommended.*Phase 3FD-B/is.test(implPlanFlat) && /Alternative.*Phase 3FD-B-ALT/is.test(implPlanFlat),
  'Implementation plan Future Phase Proposal must recommend Phase 3FD-B and list Phase 3FD-B-ALT as the alternative.'
);
assertTrue(
  /no live KIS call at any point in that phase's validation/i.test(implPlanFlat),
  'Implementation plan Validation Plan must state no live KIS call at any point in that phase.'
);

// ---------------------------------------------------------------------------
// 5. Redaction policy content
// ---------------------------------------------------------------------------

assertTrue(
  redactionPolicySource.startsWith('# Phase 3FD-A Auth Redaction and Subject Mapping Policy'),
  'Redaction policy must start with the exact required title.'
);
assertHeadings(
  redactionPolicySource,
  [
    '## 1. Purpose',
    '## 2. Forbidden Outputs',
    '## 3. Allowed Safe Outputs',
    '## 4. Subject Ref Design',
    '## 5. Error Redaction',
    '## 6. Test Requirements',
  ],
  'Redaction policy'
);
const forbiddenOutputsSection = redactionPolicySource.split('## 3. Allowed Safe Outputs')[0];
const forbiddenOutputsBulletCount = (forbiddenOutputsSection.match(/^- /gm) || []).length;
assertTrue(
  forbiddenOutputsBulletCount >= 12,
  'Redaction policy Forbidden Outputs must list at least 12 forbidden output items.'
);
assertTrue(
  /auth state bucket/i.test(redactionPolicyFlat) && /role seed/i.test(redactionPolicyFlat),
  'Redaction policy Allowed Safe Outputs must mention auth state bucket and role seed.'
);
assertTrue(
  /SimilarityAuthSubjectSafeRef/.test(redactionPolicySource),
  'Redaction policy must reference the SimilarityAuthSubjectSafeRef contract type.'
);
assertTrue(
  /no user-enumeration signal/i.test(redactionPolicyFlat),
  'Redaction policy Error Redaction must state no user-enumeration signal is revealed.'
);
assertTrue(
  (redactionPolicySource.split('## 6. Test Requirements')[1].match(/^- /gm) || []).length >= 5,
  'Redaction policy Test Requirements must list at least 5 test requirements.'
);

// ---------------------------------------------------------------------------
// 6. Owner approval form content
// ---------------------------------------------------------------------------

assertTrue(
  approvalFormSource.startsWith('# Phase 3FD-A Owner Approval Form'),
  'Owner approval form must start with the exact required title.'
);
assertHeadings(
  approvalFormSource,
  ['## 1. Approval Scope', '## 2. Approval Items', '## 3. Explicit Exclusions', '## 4. Owner Decision Record'],
  'Owner approval form'
);
const approvalItemsSection = approvalFormSource.split('## 3. Explicit Exclusions')[0];
const exclusionsSection = approvalFormSource.split('## 3. Explicit Exclusions')[1].split('## 4. Owner Decision Record')[0];
assertTrue(
  (approvalItemsSection.match(/^- \[ \]/gm) || []).length >= 9,
  'Owner approval form Approval Items must contain at least 9 checkboxes.'
);
assertTrue(
  (exclusionsSection.match(/^- \[ \]/gm) || []).length >= 7,
  'Owner approval form Explicit Exclusions must contain at least 7 checkboxes.'
);
assertTrue(
  /no real database implementation occurs in phase 3fd-a/i.test(flatten(exclusionsSection)),
  'Owner approval form Explicit Exclusions must state no real database implementation occurs in Phase 3FD-A.'
);
assertTrue(
  /no beta or public activation occurs in phase 3fd-a/i.test(flatten(exclusionsSection)),
  'Owner approval form Explicit Exclusions must state no beta or public activation occurs in Phase 3FD-A.'
);
assertTrue(
  /no live kis call occurs in phase 3fd-a/i.test(flatten(exclusionsSection)),
  'Owner approval form Explicit Exclusions must state no live KIS call occurs in Phase 3FD-A.'
);
const requiredDecisionRecordFields = ['**Decision**', '**Date**', '**Notes**', '**Required changes**', '**Explicit exclusions confirmed**'];
assertTrue(
  requiredDecisionRecordFields.every((field) => approvalFormSource.includes(field)),
  `Owner approval form Owner Decision Record must contain all required fields (${requiredDecisionRecordFields.join(', ')}).`
);

// ---------------------------------------------------------------------------
// 7. Result doc content
// ---------------------------------------------------------------------------

assertTrue(
  resultDocSource.startsWith('# Phase 3FD-A — Real Supabase Auth Runtime Approval and Setup Package Result'),
  'Result doc must start with the exact required title.'
);
assertHeadings(
  resultDocSource,
  [
    '## 1. Status',
    '## 2. Background',
    '## 3. Implemented Scope',
    '## 4. Approval Package Result',
    '## 5. Dependency and Env Key Result',
    '## 6. Runtime Implementation Plan Result',
    '## 7. Redaction Policy Result',
    '## 8. Boundary Preservation',
    '## 9. Validation',
    '## 10. Recommended Next Phase',
  ],
  'Result doc'
);
assertTrue(
  /prepared\.\s*this is a documentation-only phase/i.test(resultDocFlat),
  'Result doc Status must state it is prepared and documentation-only.'
);
assertTrue(
  /no runtime source file was changed/i.test(resultDocFlat),
  'Result doc must explicitly state no runtime source file was changed.'
);
assertTrue(
  /no route source file was changed/i.test(resultDocFlat),
  'Result doc must explicitly state no route source file was changed.'
);
assertTrue(
  /no package was installed/i.test(resultDocFlat),
  'Result doc must explicitly state no package was installed.'
);
assertTrue(
  /no dependency was changed/i.test(resultDocFlat),
  'Result doc must explicitly state no dependency was changed.'
);
assertTrue(
  /no real Supabase client was created/i.test(resultDocFlat),
  'Result doc must explicitly state no real Supabase client was created.'
);
assertTrue(
  /no real database was implemented/i.test(resultDocFlat),
  'Result doc must explicitly state no real database was implemented.'
);
assertTrue(
  /no live KIS call was made/i.test(resultDocFlat),
  'Result doc must explicitly state no live KIS call was made.'
);
assertTrue(
  /Phase 3FD-B — Real Supabase Auth Subject Resolver Implementation, Disabled by Default/.test(resultDocFlat),
  'Result doc Recommended Next Phase must recommend Phase 3FD-B by exact name.'
);
assertTrue(
  /Phase 3FD-B-ALT/.test(resultDocFlat) && /Phase 3FC-K/.test(resultDocFlat),
  'Result doc Recommended Next Phase must list Phase 3FD-B-ALT as alternative and Phase 3FC-K as hold alternative.'
);

// ---------------------------------------------------------------------------
// 8. Runtime boundary preservation
// ---------------------------------------------------------------------------

assertTrue(
  /isOwnerLocalMockedSimilarityApiRequestBody/.test(routeSource),
  'Route file must still contain the owner-local-mocked dispatch branch discriminator.'
);
assertTrue(
  /isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody/.test(routeSource),
  'Route file must still contain the owner-local-auth-usage-bridge dispatch branch discriminator.'
);
assertTrue(
  /isGuardedRuntimeScaffoldSimilarityRequestBody/.test(routeSource),
  'Route file must still contain the guarded-runtime-scaffold dispatch branch discriminator.'
);
assertTrue(
  /chartAiOwnerLocalAuthUsageBridgePanel/.test(chartAiSource),
  '/chart-ai must still contain the owner-local auth/usage bridge panel identifier.'
);
assertTrue(
  !/@supabase\/supabase-js/.test(routeSource) && !/@supabase\/supabase-js/.test(chartAiSource),
  'Neither the route file nor /chart-ai may import @supabase/supabase-js.'
);
assertTrue(
  !/@supabase\/supabase-js/.test(authResolverSource) &&
    !/@supabase\/supabase-js/.test(roleResolverSource) &&
    !/@supabase\/supabase-js/.test(usageStoreSource) &&
    !/@supabase\/supabase-js/.test(flagResolverSource) &&
    !/@supabase\/supabase-js/.test(guardedScaffoldSource),
  'No Chart Similarity scaffold module may import @supabase/supabase-js in this phase.'
);
assertTrue(
  authResolverSource.includes('resolveSimilarityAuthSubject'),
  'The Phase 3FC-C auth subject resolver export must still exist unmodified in kind.'
);
assertTrue(
  existsSync(path.join(repoRoot, GUARDED_SCAFFOLD_PATH)),
  'The Phase 3FC-H guarded route scaffold module must still exist.'
);

// ---------------------------------------------------------------------------
// 9. Forbidden content (checked once against all new docs joined)
// ---------------------------------------------------------------------------

const ALL_NEW_DOCS_JOINED = [
  approvalPackageFlat,
  depEnvPlanFlat,
  implPlanFlat,
  redactionPolicyFlat,
  approvalFormFlat,
  resultDocFlat,
].join(' \n ');

// Direct forbidden content: patterns that would never legitimately appear, even inside a negated
// sentence, so no negation handling is needed.
const DIRECT_FORBIDDEN_PATTERN_CHECKS = [
  [/PUBLIC_SUPABASE_URL\s*=\s*['"]?https?:\/\//i, 'must not contain an actual PUBLIC_SUPABASE_URL value'],
  [/SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"]?[A-Za-z0-9._-]{10,}/i, 'must not contain an actual SUPABASE_SERVICE_ROLE_KEY value'],
  [/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, 'must not contain a raw JWT-shaped token'],
  [/npm install @supabase/i, 'must not instruct running npm install for a Supabase package'],
  [/createClient\(/, 'must not contain an actual createClient( call'],
  [/CREATE TABLE/i, 'must not contain an actual SQL statement'],
  [/git push (origin|--force)/i, 'must not instruct a git push'],
  [/process\.env\.[A-Z_]+\s*=\s*['"][^'"]+['"]/i, 'must not contain an actual assigned environment value'],
];

for (const [pattern, description] of DIRECT_FORBIDDEN_PATTERN_CHECKS) {
  assertTrue(!pattern.test(ALL_NEW_DOCS_JOINED), `Phase 3FD-A docs ${description}.`);
}

// Claim-style forbidden content: a bare phrase like "migration file was created" is expected to
// appear only inside a negated sentence (for example "No database, SQL, or migration file was
// created."). Checked per-sentence so a negation earlier in the sentence correctly clears it,
// instead of relying on a fixed-distance lookbehind.
const NEGATABLE_CLAIM_PATTERN_CHECKS = [
  [/package (was|has been) installed/i, 'must not claim a package was installed'],
  [/real Supabase client (was|is) created/i, 'must not claim a real Supabase client was created'],
  [/live KIS call (was made|succeeded)|called the live KIS/i, 'must not claim a live KIS call was made'],
  [/(sql|migration) file (was|has been) created/i, 'must not claim a SQL/migration file was created'],
  [/route success (was|has been) enabled/i, 'must not claim route success was enabled'],
  [/deploy(ed|ment) (was|has been) (triggered|completed)/i, 'must not claim a deploy occurred'],
  [/cookie (was|is) parsed|authorization header (was|is) read/i, 'must not claim cookie or authorization header parsing occurred'],
];

for (const [pattern, description] of NEGATABLE_CLAIM_PATTERN_CHECKS) {
  assertNoUnnegatedClaim(ALL_NEW_DOCS_JOINED, pattern, `Phase 3FD-A docs ${description}.`);
}

// ---------------------------------------------------------------------------
// 10. Assertion-count discipline
// ---------------------------------------------------------------------------

assertTrue(
  assertionCount >= 104,
  `Checker should run at least 105 assertions to stay above the floor (ran ${assertionCount}).`
);
assertTrue(
  assertionCount <= 140,
  `Checker should run at most 140 assertions to stay within the target range (ran ${assertionCount}).`
);

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

if (failureCount > 0) {
  console.error(`Phase 3FD-A contract check FAILED: ${failureCount}/${assertionCount} assertions failed.`);
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
} else {
  console.log(`Phase 3FD-A contract check passed: ${assertionCount}/${assertionCount} assertions passed.`);
}
