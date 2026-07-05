/**
 * Role assignment resolver scaffold smoke (Phase 3FC-D).
 *
 * Exercises the actual resolver module (`similarityRoleAssignmentResolver.ts`) and its fixtures
 * through normal TypeScript bundling, without a dev server, without a real Supabase client,
 * without reading `process.env`, and without any network call. Confirms: (1) the default,
 * disabled-by-default policy always resolves to `disabled`/anonymous/no-subject; (2) a mocked
 * scaffold policy correctly resolves anonymous/authenticated-no-assignment/beta/owner/admin
 * assignment cases; (3) an inactive assignment is ignored; (4) multiple active assignments for the
 * same subject are ignored for safety; (5) a client-claimed role or subject is always ignored and
 * only produces a safe warning; (6) the resolver never calls `fetch`, never imports a Supabase
 * package, a KIS provider module, or an API route module, and never accesses `process.env`. This
 * is a focused smoke (a bounded assertion list), not a full historical checker suite.
 *
 * Run:
 *   npm run smoke:phase-3fc-d-role-assignment-resolver-scaffold
 */

import { readFileSync } from 'node:fs';
import { build } from 'esbuild';

const root = process.cwd();

const failures = [];
let assertionCount = 0;

const assertTrue = (condition, message) => {
  assertionCount += 1;
  if (!condition) failures.push(message);
};

const assertEqual = (actual, expected, message) => {
  assertionCount += 1;
  if (actual !== expected) {
    failures.push(`${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
  }
};

// Strips block and line comments so doc-comment prose describing a guarantee (e.g. "never reads
// process.env") is not mistaken for actual code performing that access.
const stripComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

const loadResolverModule = async () => {
  const entryContents = [
    "export {",
    '  buildDefaultSimilarityRoleAssignmentResolverPolicy,',
    '  buildMockedSimilarityRoleAssignmentResolverPolicy,',
    '  normalizeSimilarityRoleAssignmentResolverInput,',
    '  resolveSimilarityRoleAssignment,',
    '  assertSimilarityRoleAssignmentResolverResultIsSafe,',
    "} from './src/lib/server/chartSimilarity/similarityRoleAssignmentResolver.ts';",
    "export {",
    '  buildMockedAnonymousRoleAssignmentResolverInput,',
    '  buildMockedAuthenticatedNoAssignmentRoleResolverInput,',
    '  buildMockedBetaRoleAssignmentResolverInput,',
    '  buildMockedOwnerRoleAssignmentResolverInput,',
    '  buildMockedAdminRoleAssignmentResolverInput,',
    '  buildMockedInactiveAssignmentIgnoredResolverInput,',
    '  buildMockedMultipleAssignmentsIgnoredResolverInput,',
    '  buildMockedClientClaimedRoleIgnoredRoleResolverInput,',
    "} from './src/lib/server/chartSimilarity/mockedSimilarityRoleAssignmentResolverFixtures.ts';",
  ].join('\n');

  const bundle = await build({
    stdin: {
      contents: entryContents,
      resolveDir: root,
      sourcefile: 'role-assignment-resolver-scaffold-smoke-entry.ts',
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    write: false,
    logLevel: 'silent',
  });

  return {
    mod: await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`),
    bundledSource: bundle.outputFiles[0].text,
  };
};

const main = async () => {
  const { mod, bundledSource } = await loadResolverModule();

  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = () => {
    fetchCalled = true;
    throw new Error('fetch must never be called by the role assignment resolver scaffold.');
  };

  let defaultPolicyResult;
  let anonymousResult;
  let noAssignmentResult;
  let betaResult;
  let ownerResult;
  let adminResult;
  let inactiveIgnoredResult;
  let multipleIgnoredResult;
  let claimIgnoredResult;

  try {
    const defaultPolicy = mod.buildDefaultSimilarityRoleAssignmentResolverPolicy();
    const mockedPolicy = mod.buildMockedSimilarityRoleAssignmentResolverPolicy();

    // --- A. Default disabled policy. ---
    defaultPolicyResult = mod.resolveSimilarityRoleAssignment(
      mod.buildMockedOwnerRoleAssignmentResolverInput(),
      defaultPolicy,
    );

    // --- B. Anonymous auth subject under mocked policy. ---
    anonymousResult = mod.resolveSimilarityRoleAssignment(mod.buildMockedAnonymousRoleAssignmentResolverInput(), mockedPolicy);

    // --- C. Authenticated, no assignment. ---
    noAssignmentResult = mod.resolveSimilarityRoleAssignment(
      mod.buildMockedAuthenticatedNoAssignmentRoleResolverInput(),
      mockedPolicy,
    );

    // --- D/E/F. Beta/owner/admin assignment. ---
    betaResult = mod.resolveSimilarityRoleAssignment(mod.buildMockedBetaRoleAssignmentResolverInput(), mockedPolicy);
    ownerResult = mod.resolveSimilarityRoleAssignment(mod.buildMockedOwnerRoleAssignmentResolverInput(), mockedPolicy);
    adminResult = mod.resolveSimilarityRoleAssignment(mod.buildMockedAdminRoleAssignmentResolverInput(), mockedPolicy);

    // --- G. Inactive assignment ignored. ---
    inactiveIgnoredResult = mod.resolveSimilarityRoleAssignment(
      mod.buildMockedInactiveAssignmentIgnoredResolverInput(),
      mockedPolicy,
    );

    // --- H. Multiple assignments ignored. ---
    multipleIgnoredResult = mod.resolveSimilarityRoleAssignment(
      mod.buildMockedMultipleAssignmentsIgnoredResolverInput(),
      mockedPolicy,
    );

    // --- I. Client-claimed role/subject ignored. ---
    claimIgnoredResult = mod.resolveSimilarityRoleAssignment(
      mod.buildMockedClientClaimedRoleIgnoredRoleResolverInput(),
      mockedPolicy,
    );

    // Safety assertions must not throw for any of the above safe results.
    mod.assertSimilarityRoleAssignmentResolverResultIsSafe(defaultPolicyResult);
    mod.assertSimilarityRoleAssignmentResolverResultIsSafe(anonymousResult);
    mod.assertSimilarityRoleAssignmentResolverResultIsSafe(noAssignmentResult);
    mod.assertSimilarityRoleAssignmentResolverResultIsSafe(betaResult);
    mod.assertSimilarityRoleAssignmentResolverResultIsSafe(ownerResult);
    mod.assertSimilarityRoleAssignmentResolverResultIsSafe(adminResult);
    mod.assertSimilarityRoleAssignmentResolverResultIsSafe(inactiveIgnoredResult);
    mod.assertSimilarityRoleAssignmentResolverResultIsSafe(multipleIgnoredResult);
    mod.assertSimilarityRoleAssignmentResolverResultIsSafe(claimIgnoredResult);
  } finally {
    globalThis.fetch = originalFetch;
  }

  // --- A. Default disabled policy. ---
  const defaultPolicy = mod.buildDefaultSimilarityRoleAssignmentResolverPolicy();
  assertEqual(defaultPolicy.enabled, false, 'Default policy enabled');
  assertEqual(defaultPolicy.allowRealRoleStore, false, 'Default policy allowRealRoleStore');
  assertEqual(defaultPolicy.allowSupabaseClient, false, 'Default policy allowSupabaseClient');
  assertEqual(defaultPolicy.allowOwnerAdminBypassWithoutAssignment, false, 'Default policy allowOwnerAdminBypassWithoutAssignment');
  assertEqual(defaultPolicy.allowRouteSuccess, false, 'Default policy allowRouteSuccess');
  assertEqual(defaultPolicyResult.status, 'disabled', 'Default policy result status');
  assertEqual(defaultPolicyResult.ok, false, 'Default policy result ok');
  assertEqual(defaultPolicyResult.role, 'anonymous', 'Default policy result role');
  assertEqual(defaultPolicyResult.roleSource, 'default', 'Default policy result roleSource');
  assertEqual(defaultPolicyResult.subject, null, 'Default policy result subject');
  assertEqual(defaultPolicyResult.assignment, null, 'Default policy result assignment');

  // --- Mocked scaffold policy still grants no real capability. ---
  const mockedPolicy = mod.buildMockedSimilarityRoleAssignmentResolverPolicy();
  assertEqual(mockedPolicy.enabled, true, 'Mocked policy enabled');
  assertEqual(mockedPolicy.allowRealRoleStore, false, 'Mocked policy allowRealRoleStore');
  assertEqual(mockedPolicy.allowSupabaseClient, false, 'Mocked policy allowSupabaseClient');
  assertEqual(mockedPolicy.allowEnvRead, false, 'Mocked policy allowEnvRead');
  assertEqual(mockedPolicy.allowDbRead, false, 'Mocked policy allowDbRead');
  assertEqual(mockedPolicy.allowCookieRead, false, 'Mocked policy allowCookieRead');
  assertEqual(mockedPolicy.allowHeaderRead, false, 'Mocked policy allowHeaderRead');
  assertEqual(mockedPolicy.allowClientClaimedRole, false, 'Mocked policy allowClientClaimedRole');
  assertEqual(mockedPolicy.allowClientClaimedSubject, false, 'Mocked policy allowClientClaimedSubject');
  assertEqual(mockedPolicy.allowAnonymousExecution, false, 'Mocked policy allowAnonymousExecution');
  assertEqual(mockedPolicy.allowOwnerAdminBypassWithoutAssignment, false, 'Mocked policy allowOwnerAdminBypassWithoutAssignment');
  assertEqual(mockedPolicy.allowRouteSuccess, false, 'Mocked policy allowRouteSuccess');
  assertEqual(mockedPolicy.allowPublicExecution, false, 'Mocked policy allowPublicExecution');
  assertEqual(mockedPolicy.allowBetaExecution, false, 'Mocked policy allowBetaExecution');

  // --- B. Anonymous auth subject under mocked policy. ---
  assertEqual(anonymousResult.status, 'anonymous', 'Anonymous result status');
  assertEqual(anonymousResult.ok, false, 'Anonymous result ok');
  assertEqual(anonymousResult.role, 'anonymous', 'Anonymous result role');
  assertEqual(anonymousResult.roleSource, 'default', 'Anonymous result roleSource');
  assertEqual(anonymousResult.subject, null, 'Anonymous result subject');
  assertEqual(anonymousResult.assignment, null, 'Anonymous result assignment');

  // --- C. Authenticated, no assignment. ---
  assertEqual(noAssignmentResult.status, 'default_authenticated', 'No-assignment result status');
  assertEqual(noAssignmentResult.ok, true, 'No-assignment result ok');
  assertEqual(noAssignmentResult.role, 'authenticated', 'No-assignment result role');
  assertEqual(noAssignmentResult.roleSource, 'default', 'No-assignment result roleSource');
  assertTrue(noAssignmentResult.subject !== null, 'No-assignment result subject exists');
  assertEqual(noAssignmentResult.assignment, null, 'No-assignment result assignment');

  // --- D. Beta assignment. ---
  assertEqual(betaResult.status, 'assigned', 'Beta result status');
  assertEqual(betaResult.ok, true, 'Beta result ok');
  assertEqual(betaResult.role, 'beta', 'Beta result role');
  assertEqual(betaResult.roleSource, 'mocked-assignment', 'Beta result roleSource');
  assertTrue(betaResult.assignment !== null, 'Beta result assignment exists');
  assertEqual(betaResult.assignment?.role, 'beta', 'Beta result assignment.role');

  // --- E. Owner assignment. ---
  assertEqual(ownerResult.status, 'assigned', 'Owner result status');
  assertEqual(ownerResult.ok, true, 'Owner result ok');
  assertEqual(ownerResult.role, 'owner', 'Owner result role');
  assertEqual(ownerResult.roleSource, 'mocked-assignment', 'Owner result roleSource');
  assertTrue(ownerResult.assignment !== null, 'Owner result assignment exists');
  assertEqual(ownerResult.assignment?.role, 'owner', 'Owner result assignment.role');

  // --- F. Admin assignment. ---
  assertEqual(adminResult.status, 'assigned', 'Admin result status');
  assertEqual(adminResult.ok, true, 'Admin result ok');
  assertEqual(adminResult.role, 'admin', 'Admin result role');
  assertEqual(adminResult.roleSource, 'mocked-assignment', 'Admin result roleSource');
  assertTrue(adminResult.assignment !== null, 'Admin result assignment exists');
  assertEqual(adminResult.assignment?.role, 'admin', 'Admin result assignment.role');

  // --- G. Inactive assignment ignored. ---
  assertEqual(inactiveIgnoredResult.status, 'default_authenticated', 'Inactive-ignored result status');
  assertEqual(inactiveIgnoredResult.ok, true, 'Inactive-ignored result ok');
  assertEqual(inactiveIgnoredResult.role, 'authenticated', 'Inactive-ignored result role must not escalate');
  assertEqual(inactiveIgnoredResult.assignment, null, 'Inactive-ignored result assignment');
  assertTrue(
    inactiveIgnoredResult.warnings.includes('assignment_ignored'),
    'Inactive-ignored result warnings must include assignment_ignored',
  );

  // --- H. Multiple assignments ignored. ---
  assertEqual(multipleIgnoredResult.status, 'default_authenticated', 'Multiple-ignored result status');
  assertEqual(multipleIgnoredResult.ok, true, 'Multiple-ignored result ok');
  assertEqual(multipleIgnoredResult.role, 'authenticated', 'Multiple-ignored result role must not escalate');
  assertEqual(multipleIgnoredResult.assignment, null, 'Multiple-ignored result assignment');
  assertTrue(
    multipleIgnoredResult.warnings.includes('multiple_assignments_ignored'),
    'Multiple-ignored result warnings must include multiple_assignments_ignored',
  );

  // --- I. Client-claimed role/subject ignored. ---
  assertEqual(claimIgnoredResult.status, 'default_authenticated', 'Claim-ignored result status');
  assertEqual(claimIgnoredResult.role, 'authenticated', 'Claim-ignored result role must not become admin');
  assertTrue(
    claimIgnoredResult.role !== 'admin' && claimIgnoredResult.role !== 'owner' && claimIgnoredResult.role !== 'beta',
    'Claim-ignored result role must never escalate from a client claim',
  );
  assertEqual(
    claimIgnoredResult.subject?.subjectRef,
    'mock-subject-authenticated-002',
    'Claim-ignored result subject must come only from the explicit subject input, not the claimed subject',
  );
  assertTrue(
    claimIgnoredResult.warnings.includes('client_claim_ignored'),
    'Claim-ignored result warnings must include client_claim_ignored',
  );

  // --- J. Runtime safety. ---
  assertTrue(!fetchCalled, 'fetch must never be called by the resolver scaffold');
  const bundledCode = stripComments(bundledSource);
  assertTrue(!/@supabase/.test(bundledCode), 'Bundled resolver module must not import a Supabase package');
  assertTrue(!/process\.env(\.\w+|\[)/.test(bundledCode), 'Bundled resolver module must not access process.env');
  assertTrue(
    !/kisOhlcProvider|serverOnlyKisOhlcProvider|mockedKisOhlcAdapter/.test(bundledCode),
    'Bundled resolver module must not import a KIS provider module',
  );
  assertTrue(
    !/pages[\\/]api|similarityApiRouteShell/.test(bundledCode),
    'Bundled resolver module must not import an API route module',
  );

  // Source-level safety check against the actual on-disk resolver file (not just the bundle).
  const resolverCode = stripComments(
    readFileSync('src/lib/server/chartSimilarity/similarityRoleAssignmentResolver.ts', 'utf8'),
  );
  assertTrue(!/@supabase/.test(resolverCode), 'Resolver source must not import a Supabase package');
  assertTrue(!/process\.env(\.\w+|\[)/.test(resolverCode), 'Resolver source must not access process.env');
  assertTrue(!/document\.cookie|req\.headers|request\.headers/.test(resolverCode), 'Resolver source must not read cookies/headers');
  assertTrue(!/\bfetch\(/.test(resolverCode), 'Resolver source must not call fetch');

  if (failures.length > 0) {
    process.stdout.write(`Phase 3FC-D smoke: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
    for (const failure of failures) {
      process.stdout.write(`  - ${failure}\n`);
    }
    return 1;
  }

  process.stdout.write(`Phase 3FC-D smoke: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  return 0;
};

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    process.stdout.write('Phase 3FC-D smoke: FAIL\n');
    process.stdout.write(`reason: ${error && error.message ? error.message : 'smoke script error'}\n`);
    process.exitCode = 1;
  });
