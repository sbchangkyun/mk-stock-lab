/**
 * Supabase Auth subject resolver scaffold smoke (Phase 3FC-C).
 *
 * Exercises the actual resolver module (`similarityAuthSubjectResolver.ts`) and its fixtures
 * through normal TypeScript bundling, without a dev server, without a real Supabase client,
 * without reading `process.env`, and without any network call. Confirms: (1) the default,
 * disabled-by-default policy always resolves to `disabled`/anonymous/no-subject; (2) a mocked
 * scaffold policy correctly resolves missing/valid/invalid mocked session candidates; (3) a
 * client-claimed role or subject is always ignored and only produces a safe warning; (4) the
 * resolver never calls `fetch`, never imports a Supabase package, a KIS provider module, or an
 * API route module, and never accesses `process.env`. This is a focused smoke (a bounded
 * assertion list), not a full historical checker suite.
 *
 * Run:
 *   npm run smoke:phase-3fc-c-supabase-auth-subject-resolver-scaffold
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
    '  buildDefaultSimilarityAuthSubjectResolverPolicy,',
    '  buildMockedSimilarityAuthSubjectResolverPolicy,',
    '  normalizeSimilarityAuthSubjectResolverInput,',
    '  resolveSimilarityAuthSubject,',
    '  assertSimilarityAuthSubjectResolverResultIsSafe,',
    "} from './src/lib/server/chartSimilarity/similarityAuthSubjectResolver.ts';",
    "export {",
    '  buildMockedMissingSupabaseSessionResolverInput,',
    '  buildMockedValidSupabaseSessionResolverInput,',
    '  buildMockedInvalidSupabaseSessionResolverInput,',
    '  buildMockedClientClaimedRoleIgnoredResolverInput,',
    "} from './src/lib/server/chartSimilarity/mockedSimilarityAuthSubjectResolverFixtures.ts';",
  ].join('\n');

  const bundle = await build({
    stdin: {
      contents: entryContents,
      resolveDir: root,
      sourcefile: 'auth-subject-resolver-scaffold-smoke-entry.ts',
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
    throw new Error('fetch must never be called by the Supabase auth subject resolver scaffold.');
  };

  let defaultPolicyResult;
  let missingResult;
  let validResult;
  let invalidResult;
  let claimIgnoredResult;

  try {
    const defaultPolicy = mod.buildDefaultSimilarityAuthSubjectResolverPolicy();
    const mockedPolicy = mod.buildMockedSimilarityAuthSubjectResolverPolicy();

    // --- A. Default disabled policy. ---
    defaultPolicyResult = mod.resolveSimilarityAuthSubject(
      mod.buildMockedValidSupabaseSessionResolverInput(),
      defaultPolicy,
    );

    // --- B/C/D. Mocked scaffold policy over missing/valid/invalid session candidates. ---
    missingResult = mod.resolveSimilarityAuthSubject(mod.buildMockedMissingSupabaseSessionResolverInput(), mockedPolicy);
    validResult = mod.resolveSimilarityAuthSubject(mod.buildMockedValidSupabaseSessionResolverInput(), mockedPolicy);
    invalidResult = mod.resolveSimilarityAuthSubject(mod.buildMockedInvalidSupabaseSessionResolverInput(), mockedPolicy);

    // --- E. Client-claimed role/subject ignored. ---
    claimIgnoredResult = mod.resolveSimilarityAuthSubject(
      mod.buildMockedClientClaimedRoleIgnoredResolverInput(),
      mockedPolicy,
    );

    // Safety assertions must not throw for any of the above safe results.
    mod.assertSimilarityAuthSubjectResolverResultIsSafe(defaultPolicyResult);
    mod.assertSimilarityAuthSubjectResolverResultIsSafe(missingResult);
    mod.assertSimilarityAuthSubjectResolverResultIsSafe(validResult);
    mod.assertSimilarityAuthSubjectResolverResultIsSafe(invalidResult);
    mod.assertSimilarityAuthSubjectResolverResultIsSafe(claimIgnoredResult);
  } finally {
    globalThis.fetch = originalFetch;
  }

  // --- A. Default disabled policy. ---
  const defaultPolicy = mod.buildDefaultSimilarityAuthSubjectResolverPolicy();
  assertEqual(defaultPolicy.enabled, false, 'Default policy enabled');
  assertEqual(defaultPolicy.allowRealSupabaseClient, false, 'Default policy allowRealSupabaseClient');
  assertEqual(defaultPolicy.allowRouteSuccess, false, 'Default policy allowRouteSuccess');
  assertEqual(defaultPolicyResult.status, 'disabled', 'Default policy result status');
  assertEqual(defaultPolicyResult.ok, false, 'Default policy result ok');
  assertEqual(defaultPolicyResult.subject, null, 'Default policy result subject');
  assertEqual(defaultPolicyResult.authState, 'anonymous', 'Default policy result authState');
  assertEqual(defaultPolicyResult.roleSeed, 'anonymous', 'Default policy result roleSeed');

  // --- Mocked scaffold policy still grants no real capability. ---
  const mockedPolicy = mod.buildMockedSimilarityAuthSubjectResolverPolicy();
  assertEqual(mockedPolicy.enabled, true, 'Mocked policy enabled');
  assertEqual(mockedPolicy.allowRealSupabaseClient, false, 'Mocked policy allowRealSupabaseClient');
  assertEqual(mockedPolicy.allowEnvRead, false, 'Mocked policy allowEnvRead');
  assertEqual(mockedPolicy.allowCookieRead, false, 'Mocked policy allowCookieRead');
  assertEqual(mockedPolicy.allowHeaderRead, false, 'Mocked policy allowHeaderRead');
  assertEqual(mockedPolicy.allowClientClaimedSubject, false, 'Mocked policy allowClientClaimedSubject');
  assertEqual(mockedPolicy.allowClientClaimedRole, false, 'Mocked policy allowClientClaimedRole');
  assertEqual(mockedPolicy.allowTokenEcho, false, 'Mocked policy allowTokenEcho');
  assertEqual(mockedPolicy.allowRawSessionEcho, false, 'Mocked policy allowRawSessionEcho');
  assertEqual(mockedPolicy.allowRouteSuccess, false, 'Mocked policy allowRouteSuccess');
  assertEqual(mockedPolicy.allowPublicExecution, false, 'Mocked policy allowPublicExecution');
  assertEqual(mockedPolicy.allowBetaExecution, false, 'Mocked policy allowBetaExecution');

  // --- B. Missing session under mocked policy. ---
  assertEqual(missingResult.status, 'anonymous', 'Missing session result status');
  assertEqual(missingResult.ok, false, 'Missing session result ok');
  assertEqual(missingResult.subject, null, 'Missing session result subject');
  assertEqual(missingResult.authState, 'anonymous', 'Missing session result authState');
  assertEqual(missingResult.roleSeed, 'anonymous', 'Missing session result roleSeed');
  assertEqual(missingResult.policy.allowRouteSuccess, false, 'Missing session result policy.allowRouteSuccess');

  // --- C. Valid mocked session under mocked policy. ---
  assertEqual(validResult.status, 'authenticated', 'Valid session result status');
  assertEqual(validResult.ok, true, 'Valid session result ok');
  assertTrue(validResult.subject !== null, 'Valid session result subject exists');
  assertEqual(validResult.subject?.provider, 'supabase', 'Valid session result subject.provider');
  assertEqual(validResult.subject?.source, 'mocked-scaffold', 'Valid session result subject.source');
  assertEqual(validResult.subject?.stableForUsageLookup, true, 'Valid session result subject.stableForUsageLookup');
  assertEqual(validResult.roleSeed, 'authenticated', 'Valid session result roleSeed');
  assertEqual(validResult.authState, 'authenticated', 'Valid session result authState');

  // --- D. Invalid mocked session under mocked policy. ---
  assertEqual(invalidResult.status, 'invalid_context', 'Invalid session result status');
  assertEqual(invalidResult.ok, false, 'Invalid session result ok');
  assertEqual(invalidResult.subject, null, 'Invalid session result subject');
  assertEqual(invalidResult.authState, 'anonymous', 'Invalid session result authState');
  assertEqual(invalidResult.roleSeed, 'anonymous', 'Invalid session result roleSeed');

  // --- E. Client-claimed role/subject ignored. ---
  assertEqual(claimIgnoredResult.status, 'authenticated', 'Claim-ignored result status');
  assertEqual(claimIgnoredResult.roleSeed, 'authenticated', 'Claim-ignored result roleSeed must not become beta/owner/admin');
  assertTrue(
    claimIgnoredResult.roleSeed !== 'beta' && claimIgnoredResult.roleSeed !== undefined,
    'Claim-ignored result roleSeed must remain within the anonymous/authenticated contract',
  );
  assertEqual(
    claimIgnoredResult.subject?.subjectRef,
    'mock-subject-authenticated-002',
    'Claim-ignored result subject must come only from serverSessionCandidate, not the claimed subject',
  );
  assertTrue(
    claimIgnoredResult.warnings.includes('client_claim_ignored'),
    'Claim-ignored result warnings must include client_claim_ignored',
  );

  // --- F. Runtime safety. ---
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
  const resolverCode = stripComments(readFileSync('src/lib/server/chartSimilarity/similarityAuthSubjectResolver.ts', 'utf8'));
  assertTrue(!/@supabase/.test(resolverCode), 'Resolver source must not import a Supabase package');
  assertTrue(!/process\.env(\.\w+|\[)/.test(resolverCode), 'Resolver source must not access process.env');
  assertTrue(!/document\.cookie|req\.headers|request\.headers/.test(resolverCode), 'Resolver source must not read cookies/headers');
  assertTrue(!/\bfetch\(/.test(resolverCode), 'Resolver source must not call fetch');

  if (failures.length > 0) {
    process.stdout.write(`Phase 3FC-C smoke: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
    for (const failure of failures) {
      process.stdout.write(`  - ${failure}\n`);
    }
    return 1;
  }

  process.stdout.write(`Phase 3FC-C smoke: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  return 0;
};

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    process.stdout.write('Phase 3FC-C smoke: FAIL\n');
    process.stdout.write(`reason: ${error && error.message ? error.message : 'smoke script error'}\n`);
    process.exitCode = 1;
  });
