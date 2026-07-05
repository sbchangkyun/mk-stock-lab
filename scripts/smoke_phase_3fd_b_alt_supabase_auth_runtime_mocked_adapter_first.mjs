/**
 * Supabase Auth runtime mocked adapter smoke (Phase 3FD-B-ALT).
 *
 * Exercises the actual adapter module (`similaritySupabaseAuthRuntimeAdapter.ts`) and its
 * fixtures through normal TypeScript bundling, without a dev server, without a real Supabase
 * client, without reading `process.env`/`import.meta.env`, without cookie/header parsing, and
 * without any network call. Confirms: (A) default disabled policy always resolves to
 * disabled/anonymous/safe; (B-E) missing/invalid/expired/malformed mocked sessions all resolve to
 * anonymous/safe; (F/G) valid email/OAuth mocked sessions resolve to an authenticated subject
 * seed with a safe synthetic subjectRef and no raw email/token/session field; (H) a client-claimed
 * role is always ignored and never escalates the role seed; (I) mapping to the Phase 3FC-C auth
 * subject seed contract is anonymous/authenticated only, never beta/owner/admin; (J) the adapter
 * never calls fetch, never imports a Supabase package, a KIS provider module, or a route module,
 * and never reads env/cookies/headers. This is a focused smoke (a bounded assertion list), not a
 * full historical checker suite.
 *
 * Run:
 *   npm run smoke:phase-3fd-b-alt-supabase-auth-runtime-mocked-adapter-first
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

const loadAdapterModule = async () => {
  const entryContents = [
    "export {",
    '  buildDefaultSimilaritySupabaseAuthRuntimeAdapterPolicy,',
    '  buildMockedSimilaritySupabaseAuthRuntimeAdapterPolicy,',
    '  normalizeSimilaritySupabaseAuthRuntimeAdapterInput,',
    '  resolveMockedSimilaritySupabaseAuthRuntimeAdapter,',
    '  mapSupabaseAuthAdapterResultToAuthSubjectSeed,',
    '  assertSimilaritySupabaseAuthRuntimeAdapterResultIsSafe,',
    "} from './src/lib/server/chartSimilarity/similaritySupabaseAuthRuntimeAdapter.ts';",
    "export {",
    '  buildMockedMissingSupabaseAuthRuntimeAdapterInput,',
    '  buildMockedInvalidSupabaseAuthRuntimeAdapterInput,',
    '  buildMockedExpiredSupabaseAuthRuntimeAdapterInput,',
    '  buildMockedMalformedSupabaseAuthRuntimeAdapterInput,',
    '  buildMockedValidEmailSupabaseAuthRuntimeAdapterInput,',
    '  buildMockedValidOauthSupabaseAuthRuntimeAdapterInput,',
    '  buildMockedValidWithClientRoleClaimSupabaseAuthRuntimeAdapterInput,',
    '  buildMockedUnsafeLikeSupabaseAuthRuntimeAdapterInputForRedactionTest,',
    "} from './src/lib/server/chartSimilarity/mockedSimilaritySupabaseAuthRuntimeAdapterFixtures.ts';",
  ].join('\n');

  const bundle = await build({
    stdin: {
      contents: entryContents,
      resolveDir: root,
      sourcefile: 'supabase-auth-runtime-mocked-adapter-smoke-entry.ts',
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
  const { mod, bundledSource } = await loadAdapterModule();

  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = () => {
    fetchCalled = true;
    throw new Error('fetch must never be called by the Supabase auth runtime mocked adapter.');
  };

  let defaultPolicyResult;
  let missingResult;
  let invalidResult;
  let expiredResult;
  let malformedResult;
  let validEmailResult;
  let validOauthResult;
  let clientRoleClaimResult;
  let unsafeLikeResult;

  const defaultPolicy = mod.buildDefaultSimilaritySupabaseAuthRuntimeAdapterPolicy();
  const mockedPolicy = mod.buildMockedSimilaritySupabaseAuthRuntimeAdapterPolicy();

  try {
    // --- A. Default disabled policy. ---
    defaultPolicyResult = mod.resolveMockedSimilaritySupabaseAuthRuntimeAdapter(
      mod.buildMockedValidEmailSupabaseAuthRuntimeAdapterInput(),
      defaultPolicy,
    );

    // --- B/C/D/E. Session state handling under mocked policy. ---
    missingResult = mod.resolveMockedSimilaritySupabaseAuthRuntimeAdapter(mod.buildMockedMissingSupabaseAuthRuntimeAdapterInput(), mockedPolicy);
    invalidResult = mod.resolveMockedSimilaritySupabaseAuthRuntimeAdapter(mod.buildMockedInvalidSupabaseAuthRuntimeAdapterInput(), mockedPolicy);
    expiredResult = mod.resolveMockedSimilaritySupabaseAuthRuntimeAdapter(mod.buildMockedExpiredSupabaseAuthRuntimeAdapterInput(), mockedPolicy);
    malformedResult = mod.resolveMockedSimilaritySupabaseAuthRuntimeAdapter(mod.buildMockedMalformedSupabaseAuthRuntimeAdapterInput(), mockedPolicy);

    // --- F/G. Valid mocked sessions. ---
    validEmailResult = mod.resolveMockedSimilaritySupabaseAuthRuntimeAdapter(mod.buildMockedValidEmailSupabaseAuthRuntimeAdapterInput(), mockedPolicy);
    validOauthResult = mod.resolveMockedSimilaritySupabaseAuthRuntimeAdapter(mod.buildMockedValidOauthSupabaseAuthRuntimeAdapterInput(), mockedPolicy);

    // --- H. Client-claimed role ignored. ---
    clientRoleClaimResult = mod.resolveMockedSimilaritySupabaseAuthRuntimeAdapter(
      mod.buildMockedValidWithClientRoleClaimSupabaseAuthRuntimeAdapterInput(),
      mockedPolicy,
    );

    // --- Redaction test fixture. ---
    unsafeLikeResult = mod.resolveMockedSimilaritySupabaseAuthRuntimeAdapter(
      mod.buildMockedUnsafeLikeSupabaseAuthRuntimeAdapterInputForRedactionTest(),
      mockedPolicy,
    );

    // Safety assertions must not throw for any of the above safe results.
    mod.assertSimilaritySupabaseAuthRuntimeAdapterResultIsSafe(defaultPolicyResult);
    mod.assertSimilaritySupabaseAuthRuntimeAdapterResultIsSafe(missingResult);
    mod.assertSimilaritySupabaseAuthRuntimeAdapterResultIsSafe(invalidResult);
    mod.assertSimilaritySupabaseAuthRuntimeAdapterResultIsSafe(expiredResult);
    mod.assertSimilaritySupabaseAuthRuntimeAdapterResultIsSafe(malformedResult);
    mod.assertSimilaritySupabaseAuthRuntimeAdapterResultIsSafe(validEmailResult);
    mod.assertSimilaritySupabaseAuthRuntimeAdapterResultIsSafe(validOauthResult);
    mod.assertSimilaritySupabaseAuthRuntimeAdapterResultIsSafe(clientRoleClaimResult);
    mod.assertSimilaritySupabaseAuthRuntimeAdapterResultIsSafe(unsafeLikeResult);
  } finally {
    globalThis.fetch = originalFetch;
  }

  // --- A. Default disabled policy. ---
  assertEqual(defaultPolicy.enabled, false, 'Default policy enabled');
  assertEqual(defaultPolicy.allowMockedSession, false, 'Default policy allowMockedSession');
  assertEqual(defaultPolicy.allowRealSupabaseClient, false, 'Default policy allowRealSupabaseClient');
  assertEqual(defaultPolicy.allowEnvRead, false, 'Default policy allowEnvRead');
  assertEqual(defaultPolicy.allowCookieRead, false, 'Default policy allowCookieRead');
  assertEqual(defaultPolicy.allowHeaderRead, false, 'Default policy allowHeaderRead');
  assertEqual(defaultPolicy.allowJwtVerification, false, 'Default policy allowJwtVerification');
  assertEqual(defaultPolicy.allowRouteSuccess, false, 'Default policy allowRouteSuccess');
  assertEqual(defaultPolicy.allowClientRoleTrust, false, 'Default policy allowClientRoleTrust');
  assertEqual(defaultPolicyResult.status, 'disabled', 'Default policy result status');
  assertEqual(defaultPolicyResult.ok, false, 'Default policy result ok');
  assertEqual(defaultPolicyResult.source, 'disabled', 'Default policy result source');
  assertEqual(defaultPolicyResult.subject.state, 'anonymous', 'Default policy result subject.state');
  assertEqual(defaultPolicyResult.subject.subjectRef, null, 'Default policy result subject.subjectRef');
  assertEqual(defaultPolicyResult.subject.roleSeed, 'anonymous', 'Default policy result subject.roleSeed');
  assertEqual(defaultPolicyResult.policy.allowRouteSuccess, false, 'Default policy result policy.allowRouteSuccess');

  // --- Mocked scaffold policy still grants no real capability. ---
  assertEqual(mockedPolicy.enabled, true, 'Mocked policy enabled');
  assertEqual(mockedPolicy.allowMockedSession, true, 'Mocked policy allowMockedSession');
  assertEqual(mockedPolicy.allowRealSupabaseClient, false, 'Mocked policy allowRealSupabaseClient');
  assertEqual(mockedPolicy.allowEnvRead, false, 'Mocked policy allowEnvRead');
  assertEqual(mockedPolicy.allowCookieRead, false, 'Mocked policy allowCookieRead');
  assertEqual(mockedPolicy.allowHeaderRead, false, 'Mocked policy allowHeaderRead');
  assertEqual(mockedPolicy.allowJwtVerification, false, 'Mocked policy allowJwtVerification');
  assertEqual(mockedPolicy.allowRouteSuccess, false, 'Mocked policy allowRouteSuccess');
  assertEqual(mockedPolicy.allowClientRoleTrust, false, 'Mocked policy allowClientRoleTrust');

  // --- B. Missing session. ---
  assertEqual(missingResult.status, 'missing_session', 'Missing session result status');
  assertEqual(missingResult.ok, false, 'Missing session result ok');
  assertEqual(missingResult.subject.state, 'anonymous', 'Missing session result subject.state');
  assertEqual(missingResult.subject.subjectRef, null, 'Missing session result subject.subjectRef');
  assertEqual(missingResult.subject.roleSeed, 'anonymous', 'Missing session result subject.roleSeed');

  // --- C. Invalid session. ---
  assertEqual(invalidResult.status, 'invalid_session', 'Invalid session result status');
  assertEqual(invalidResult.ok, false, 'Invalid session result ok');
  assertEqual(invalidResult.subject.state, 'anonymous', 'Invalid session result subject.state');
  assertEqual(invalidResult.subject.subjectRef, null, 'Invalid session result subject.subjectRef');
  assertEqual(invalidResult.subject.roleSeed, 'anonymous', 'Invalid session result subject.roleSeed');

  // --- D. Expired session. ---
  assertEqual(expiredResult.status, 'expired_session', 'Expired session result status');
  assertEqual(expiredResult.ok, false, 'Expired session result ok');
  assertEqual(expiredResult.subject.state, 'anonymous', 'Expired session result subject.state');
  assertEqual(expiredResult.subject.subjectRef, null, 'Expired session result subject.subjectRef');
  assertEqual(expiredResult.subject.roleSeed, 'anonymous', 'Expired session result subject.roleSeed');

  // --- E. Malformed session. ---
  assertEqual(malformedResult.status, 'malformed_session', 'Malformed session result status');
  assertEqual(malformedResult.ok, false, 'Malformed session result ok');
  assertEqual(malformedResult.subject.state, 'anonymous', 'Malformed session result subject.state');
  assertEqual(malformedResult.subject.subjectRef, null, 'Malformed session result subject.subjectRef');
  assertEqual(malformedResult.subject.roleSeed, 'anonymous', 'Malformed session result subject.roleSeed');

  // --- F. Valid email mocked session. ---
  assertEqual(validEmailResult.status, 'mocked_resolved', 'Valid email result status');
  assertEqual(validEmailResult.ok, true, 'Valid email result ok');
  assertEqual(validEmailResult.subject.state, 'authenticated', 'Valid email result subject.state');
  assertEqual(validEmailResult.subject.roleSeed, 'authenticated', 'Valid email result subject.roleSeed');
  assertEqual(validEmailResult.subject.providerKind, 'email', 'Valid email result subject.providerKind');
  assertTrue(
    typeof validEmailResult.subject.subjectRef === 'string' && validEmailResult.subject.subjectRef.startsWith('mocked-supabase-auth-subject:'),
    'Valid email result subject.subjectRef must be a safe synthetic reference',
  );
  const validEmailSerialized = JSON.stringify(validEmailResult).toLowerCase();
  assertTrue(!validEmailSerialized.includes('mock-email-ref'), 'Valid email result must not carry a raw email reference field');
  assertTrue(!validEmailSerialized.includes('accesstoken') && !validEmailSerialized.includes('refreshtoken'), 'Valid email result must not carry a token field');

  // --- G. Valid OAuth mocked session. ---
  assertEqual(validOauthResult.status, 'mocked_resolved', 'Valid OAuth result status');
  assertEqual(validOauthResult.ok, true, 'Valid OAuth result ok');
  assertEqual(validOauthResult.subject.state, 'authenticated', 'Valid OAuth result subject.state');
  assertEqual(validOauthResult.subject.providerKind, 'oauth', 'Valid OAuth result subject.providerKind');
  assertEqual(validOauthResult.subject.roleSeed, 'authenticated', 'Valid OAuth result subject.roleSeed');
  const validOauthSerialized = JSON.stringify(validOauthResult).toLowerCase();
  assertTrue(!validOauthSerialized.includes('provider_metadata'), 'Valid OAuth result must not carry raw provider metadata');

  // --- H. Client-claimed role ignored. ---
  assertEqual(clientRoleClaimResult.status, 'mocked_resolved', 'Client role claim result status');
  assertEqual(clientRoleClaimResult.subject.roleSeed, 'authenticated', 'Client role claim result subject.roleSeed must stay authenticated');
  assertTrue(
    clientRoleClaimResult.subject.roleSeed !== 'owner' && clientRoleClaimResult.subject.roleSeed !== 'beta' && clientRoleClaimResult.subject.roleSeed !== 'admin',
    'Client role claim result subject.roleSeed must never become beta/owner/admin',
  );
  assertTrue(
    clientRoleClaimResult.warnings.includes('client_role_claim_ignored'),
    'Client role claim result warnings must include client_role_claim_ignored',
  );
  const clientRoleClaimSerialized = JSON.stringify(clientRoleClaimResult).toLowerCase();
  assertTrue(!clientRoleClaimSerialized.includes('"owner"'), 'Client role claim result must not surface the literal claimed role value');

  // --- Redaction test fixture. ---
  assertEqual(unsafeLikeResult.ok, true, 'Redaction test fixture result ok');
  const unsafeLikeSerialized = JSON.stringify(unsafeLikeResult).toLowerCase();
  assertTrue(!unsafeLikeSerialized.includes('rawsession') && !unsafeLikeSerialized.includes('rawuser'), 'Redaction test fixture result must not carry raw session/user markers');

  // --- I. Mapping to the Phase 3FC-C auth subject seed contract. ---
  const anonymousSeed = mod.mapSupabaseAuthAdapterResultToAuthSubjectSeed(missingResult);
  assertEqual(anonymousSeed.authState, 'anonymous', 'Anonymous seed authState');
  assertEqual(anonymousSeed.roleSeed, 'anonymous', 'Anonymous seed roleSeed');
  assertEqual(anonymousSeed.subjectRef, null, 'Anonymous seed subjectRef');

  const authenticatedSeed = mod.mapSupabaseAuthAdapterResultToAuthSubjectSeed(validEmailResult);
  assertEqual(authenticatedSeed.authState, 'authenticated', 'Authenticated seed authState');
  assertEqual(authenticatedSeed.roleSeed, 'authenticated', 'Authenticated seed roleSeed');
  assertEqual(authenticatedSeed.subjectRef, validEmailResult.subject.subjectRef, 'Authenticated seed subjectRef must match the resolved subject.subjectRef');
  assertTrue(
    authenticatedSeed.roleSeed !== 'beta' && authenticatedSeed.roleSeed !== 'owner' && authenticatedSeed.roleSeed !== 'admin',
    'Authenticated seed roleSeed must never be beta/owner/admin',
  );
  const seedSerialized = JSON.stringify(authenticatedSeed).toLowerCase();
  assertTrue(!seedSerialized.includes('mock-email-ref'), 'Authenticated seed must not carry a raw email reference');
  assertTrue(
    authenticatedSeed.subjectRef !== 'mock-user-ref-001',
    'Authenticated seed subjectRef must be a derived safe reference, not the bare raw idRef',
  );

  const clientRoleClaimSeed = mod.mapSupabaseAuthAdapterResultToAuthSubjectSeed(clientRoleClaimResult);
  assertEqual(clientRoleClaimSeed.roleSeed, 'authenticated', 'Client role claim seed roleSeed must stay authenticated, never the claimed role');

  // --- J. Runtime safety. ---
  assertTrue(!fetchCalled, 'fetch must never be called by the adapter');
  const bundledCode = stripComments(bundledSource);
  assertTrue(!/@supabase/.test(bundledCode), 'Bundled adapter module must not import a Supabase package');
  assertTrue(!/createClient\s*\(/.test(bundledCode), 'Bundled adapter module must not call createClient');
  assertTrue(!/process\.env(\.\w+|\[)/.test(bundledCode), 'Bundled adapter module must not access process.env');
  assertTrue(!/import\.meta\.env/.test(bundledCode), 'Bundled adapter module must not access import.meta.env');
  assertTrue(!/document\.cookie|req\.headers|request\.headers|getHeader\(/.test(bundledCode), 'Bundled adapter module must not read cookies/headers');
  assertTrue(
    !/kisOhlcProvider|serverOnlyKisOhlcProvider|mockedKisOhlcAdapter/.test(bundledCode),
    'Bundled adapter module must not import a KIS provider module',
  );
  assertTrue(
    !/pages[\\/]api|similarityApiRouteShell|similarityGuardedRouteScaffold/.test(bundledCode),
    'Bundled adapter module must not import a route or guarded route scaffold module',
  );
  assertTrue(!/\bCREATE TABLE\b|\bALTER TABLE\b|\.sql['"]/i.test(bundledCode), 'Bundled adapter module must not contain SQL/migration statements');
  assertTrue(
    !/\baccountBalance\b|\btradingOrder\b|\borderId\b/.test(bundledCode),
    'Bundled adapter module must not contain account/trading/order/balance fields',
  );

  // Source-level safety check against the actual on-disk adapter file (not just the bundle).
  const adapterCode = stripComments(readFileSync('src/lib/server/chartSimilarity/similaritySupabaseAuthRuntimeAdapter.ts', 'utf8'));
  assertTrue(!/@supabase/.test(adapterCode), 'Adapter source must not import a Supabase package');
  assertTrue(!/createClient\s*\(/.test(adapterCode), 'Adapter source must not call createClient');
  assertTrue(!/process\.env(\.\w+|\[)/.test(adapterCode), 'Adapter source must not access process.env');
  assertTrue(!/import\.meta\.env/.test(adapterCode), 'Adapter source must not access import.meta.env');
  assertTrue(!/document\.cookie|req\.headers|request\.headers/.test(adapterCode), 'Adapter source must not read cookies/headers');
  assertTrue(!/\bfetch\(/.test(adapterCode), 'Adapter source must not call fetch');

  const fixturesCode = stripComments(
    readFileSync('src/lib/server/chartSimilarity/mockedSimilaritySupabaseAuthRuntimeAdapterFixtures.ts', 'utf8'),
  );
  assertTrue(!/@supabase/.test(fixturesCode), 'Fixtures source must not import a Supabase package');
  assertTrue(!/process\.env(\.\w+|\[)/.test(fixturesCode), 'Fixtures source must not access process.env');
  assertTrue(!/@[\w.-]+\.[\w.-]+/.test(fixturesCode.replace(/mock-email-ref-\d+/g, '')), 'Fixtures source must not contain a real-looking email address');

  if (failures.length > 0) {
    process.stdout.write(`Phase 3FD-B-ALT smoke: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
    for (const failure of failures) {
      process.stdout.write(`  - ${failure}\n`);
    }
    return 1;
  }

  process.stdout.write(`Phase 3FD-B-ALT smoke: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  return 0;
};

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    process.stdout.write('Phase 3FD-B-ALT smoke: FAIL\n');
    process.stdout.write(`reason: ${error && error.message ? error.message : 'smoke script error'}\n`);
    process.exitCode = 1;
  });
