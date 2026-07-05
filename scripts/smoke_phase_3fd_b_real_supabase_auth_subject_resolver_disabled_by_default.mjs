/**
 * Real-compatible Supabase Auth subject resolver smoke (Phase 3FD-B).
 *
 * Exercises the actual resolver module (`similarityRealSupabaseAuthSubjectResolver.ts`) and its
 * fixtures through normal TypeScript bundling, without a dev server, without a real Supabase
 * client, without reading `process.env`/`import.meta.env`, without cookie/header parsing, and
 * without any network call. Confirms: (A) default disabled policy always resolves to
 * disabled/anonymous/safe; (B) an enabled policy with no injected client resolves to
 * client_unavailable/anonymous/safe; (C-F) injected missing/invalid/expired/malformed mocked
 * sessions all resolve to anonymous/safe; (G/H) injected valid email/OAuth mocked sessions resolve
 * to an authenticated subject seed with a safe synthetic subjectRef and no raw email/token/session
 * field; (I) a client-claimed role is always ignored and never escalates the role seed; (J) an
 * injected client error resolves to a safe error status, never a raw error object; (K) mapping to
 * the Phase 3FC-C auth subject seed contract is anonymous/authenticated only, never
 * beta/owner/admin; (L) the resolver never calls fetch, never imports a Supabase package, a JWT
 * library, a KIS provider module, or a route module, and never reads env/cookies/headers. This is
 * a focused smoke (a bounded assertion list), not a full historical checker suite.
 *
 * Run:
 *   npm run smoke:phase-3fd-b-real-supabase-auth-subject-resolver-disabled-by-default
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

// Collects only primitive values (never key names) so that a safe field name like
// `allowRawSessionEcho`/`allowRawUserEcho` does not itself trigger a false-positive forbidden-
// content match — mirrors the resolver's own `collectPrimitiveValues` safety-check approach.
const valuesOnlyLowercase = (value) => {
  const sink = [];
  const walk = (v) => {
    if (v === null || v === undefined) return;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      sink.push(String(v));
      return;
    }
    if (Array.isArray(v)) {
      for (const item of v) walk(item);
      return;
    }
    if (typeof v === 'object') {
      for (const key of Object.keys(v)) walk(v[key]);
    }
  };
  walk(value);
  return sink.join(' | ').toLowerCase();
};

const loadResolverModule = async () => {
  const entryContents = [
    "export {",
    '  buildDefaultSimilarityRealSupabaseAuthSubjectResolverPolicy,',
    '  buildInjectedMockSimilarityRealSupabaseAuthSubjectResolverPolicy,',
    '  normalizeSimilarityRealSupabaseAuthSubjectResolverInput,',
    '  resolveSimilarityRealSupabaseAuthSubject,',
    '  mapRealSupabaseAuthSubjectResultToAuthSubjectSeed,',
    '  assertSimilarityRealSupabaseAuthSubjectResolverResultIsSafe,',
    "} from './src/lib/server/chartSimilarity/similarityRealSupabaseAuthSubjectResolver.ts';",
    "export {",
    '  buildMockedMissingSessionRealSupabaseAuthSubjectInput,',
    '  buildMockedInvalidSessionRealSupabaseAuthSubjectInput,',
    '  buildMockedExpiredSessionRealSupabaseAuthSubjectInput,',
    '  buildMockedMalformedSessionRealSupabaseAuthSubjectInput,',
    '  buildMockedValidEmailRealSupabaseAuthSubjectInput,',
    '  buildMockedValidOauthRealSupabaseAuthSubjectInput,',
    '  buildMockedClientRoleClaimRealSupabaseAuthSubjectInput,',
    '  buildMockedUnsafeLikeRealSupabaseAuthSubjectInputForRedactionTest,',
    '  buildMockedMissingSessionSupabaseCompatibleAuthClient,',
    '  buildMockedInvalidSessionSupabaseCompatibleAuthClient,',
    '  buildMockedExpiredSessionSupabaseCompatibleAuthClient,',
    '  buildMockedMalformedSessionSupabaseCompatibleAuthClient,',
    '  buildMockedValidEmailSupabaseCompatibleAuthClient,',
    '  buildMockedValidOauthSupabaseCompatibleAuthClient,',
    '  buildMockedClientErrorSupabaseCompatibleAuthClient,',
    '  buildMockedClientRoleClaimSupabaseCompatibleAuthClient,',
    "} from './src/lib/server/chartSimilarity/mockedSimilarityRealSupabaseAuthSubjectResolverFixtures.ts';",
  ].join('\n');

  const bundle = await build({
    stdin: {
      contents: entryContents,
      resolveDir: root,
      sourcefile: 'real-supabase-auth-subject-resolver-smoke-entry.ts',
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
    throw new Error('fetch must never be called by the real-compatible Supabase Auth subject resolver.');
  };

  let defaultPolicyResult;
  let clientUnavailableResult;
  let missingResult;
  let invalidResult;
  let expiredResult;
  let malformedResult;
  let validEmailResult;
  let validOauthResult;
  let clientRoleClaimResult;
  let clientErrorResult;
  let unsafeLikeResult;

  const defaultPolicy = mod.buildDefaultSimilarityRealSupabaseAuthSubjectResolverPolicy();
  const injectedPolicy = mod.buildInjectedMockSimilarityRealSupabaseAuthSubjectResolverPolicy();

  try {
    // --- A. Default disabled policy. ---
    defaultPolicyResult = await mod.resolveSimilarityRealSupabaseAuthSubject(
      mod.buildMockedValidEmailRealSupabaseAuthSubjectInput(),
      { authClient: mod.buildMockedValidEmailSupabaseCompatibleAuthClient() },
      defaultPolicy,
    );

    // --- B. Enabled policy but no injected client. ---
    clientUnavailableResult = await mod.resolveSimilarityRealSupabaseAuthSubject(
      mod.buildMockedValidEmailRealSupabaseAuthSubjectInput(),
      {},
      injectedPolicy,
    );

    // --- C/D/E/F. Session state handling via injected mocked client. ---
    missingResult = await mod.resolveSimilarityRealSupabaseAuthSubject(
      mod.buildMockedMissingSessionRealSupabaseAuthSubjectInput(),
      { authClient: mod.buildMockedMissingSessionSupabaseCompatibleAuthClient() },
      injectedPolicy,
    );
    invalidResult = await mod.resolveSimilarityRealSupabaseAuthSubject(
      mod.buildMockedInvalidSessionRealSupabaseAuthSubjectInput(),
      { authClient: mod.buildMockedInvalidSessionSupabaseCompatibleAuthClient() },
      injectedPolicy,
    );
    expiredResult = await mod.resolveSimilarityRealSupabaseAuthSubject(
      mod.buildMockedExpiredSessionRealSupabaseAuthSubjectInput(),
      { authClient: mod.buildMockedExpiredSessionSupabaseCompatibleAuthClient() },
      injectedPolicy,
    );
    malformedResult = await mod.resolveSimilarityRealSupabaseAuthSubject(
      mod.buildMockedMalformedSessionRealSupabaseAuthSubjectInput(),
      { authClient: mod.buildMockedMalformedSessionSupabaseCompatibleAuthClient() },
      injectedPolicy,
    );

    // --- G/H. Valid injected sessions. ---
    validEmailResult = await mod.resolveSimilarityRealSupabaseAuthSubject(
      mod.buildMockedValidEmailRealSupabaseAuthSubjectInput(),
      { authClient: mod.buildMockedValidEmailSupabaseCompatibleAuthClient() },
      injectedPolicy,
    );
    validOauthResult = await mod.resolveSimilarityRealSupabaseAuthSubject(
      mod.buildMockedValidOauthRealSupabaseAuthSubjectInput(),
      { authClient: mod.buildMockedValidOauthSupabaseCompatibleAuthClient() },
      injectedPolicy,
    );

    // --- I. Client-claimed role ignored. ---
    clientRoleClaimResult = await mod.resolveSimilarityRealSupabaseAuthSubject(
      mod.buildMockedClientRoleClaimRealSupabaseAuthSubjectInput(),
      { authClient: mod.buildMockedClientRoleClaimSupabaseCompatibleAuthClient() },
      injectedPolicy,
    );

    // --- J. Injected client error. ---
    clientErrorResult = await mod.resolveSimilarityRealSupabaseAuthSubject(
      mod.buildMockedValidEmailRealSupabaseAuthSubjectInput(),
      { authClient: mod.buildMockedClientErrorSupabaseCompatibleAuthClient() },
      injectedPolicy,
    );

    // --- Redaction test fixture. ---
    unsafeLikeResult = await mod.resolveSimilarityRealSupabaseAuthSubject(
      mod.buildMockedUnsafeLikeRealSupabaseAuthSubjectInputForRedactionTest(),
      { authClient: mod.buildMockedValidEmailSupabaseCompatibleAuthClient() },
      injectedPolicy,
    );

    // Safety assertions must not throw for any of the above safe results.
    mod.assertSimilarityRealSupabaseAuthSubjectResolverResultIsSafe(defaultPolicyResult);
    mod.assertSimilarityRealSupabaseAuthSubjectResolverResultIsSafe(clientUnavailableResult);
    mod.assertSimilarityRealSupabaseAuthSubjectResolverResultIsSafe(missingResult);
    mod.assertSimilarityRealSupabaseAuthSubjectResolverResultIsSafe(invalidResult);
    mod.assertSimilarityRealSupabaseAuthSubjectResolverResultIsSafe(expiredResult);
    mod.assertSimilarityRealSupabaseAuthSubjectResolverResultIsSafe(malformedResult);
    mod.assertSimilarityRealSupabaseAuthSubjectResolverResultIsSafe(validEmailResult);
    mod.assertSimilarityRealSupabaseAuthSubjectResolverResultIsSafe(validOauthResult);
    mod.assertSimilarityRealSupabaseAuthSubjectResolverResultIsSafe(clientRoleClaimResult);
    mod.assertSimilarityRealSupabaseAuthSubjectResolverResultIsSafe(clientErrorResult);
    mod.assertSimilarityRealSupabaseAuthSubjectResolverResultIsSafe(unsafeLikeResult);
  } finally {
    globalThis.fetch = originalFetch;
  }

  // --- A. Default disabled policy. ---
  assertEqual(defaultPolicy.enabled, false, 'Default policy enabled');
  assertEqual(defaultPolicy.allowInjectedSupabaseCompatibleClient, false, 'Default policy allowInjectedSupabaseCompatibleClient');
  assertEqual(defaultPolicy.allowRealSupabaseClientCreation, false, 'Default policy allowRealSupabaseClientCreation');
  assertEqual(defaultPolicy.allowEnvRead, false, 'Default policy allowEnvRead');
  assertEqual(defaultPolicy.allowCookieRead, false, 'Default policy allowCookieRead');
  assertEqual(defaultPolicy.allowHeaderRead, false, 'Default policy allowHeaderRead');
  assertEqual(defaultPolicy.allowJwtVerification, false, 'Default policy allowJwtVerification');
  assertEqual(defaultPolicy.allowRouteSuccess, false, 'Default policy allowRouteSuccess');
  assertEqual(defaultPolicy.allowClientRoleTrust, false, 'Default policy allowClientRoleTrust');
  assertEqual(defaultPolicy.allowRawSessionEcho, false, 'Default policy allowRawSessionEcho');
  assertEqual(defaultPolicy.allowRawUserEcho, false, 'Default policy allowRawUserEcho');
  assertEqual(defaultPolicyResult.status, 'disabled', 'Default policy result status');
  assertEqual(defaultPolicyResult.ok, false, 'Default policy result ok');
  assertEqual(defaultPolicyResult.source, 'disabled', 'Default policy result source');
  assertEqual(defaultPolicyResult.subject.state, 'anonymous', 'Default policy result subject.state');
  assertEqual(defaultPolicyResult.subject.subjectRef, null, 'Default policy result subject.subjectRef');
  assertEqual(defaultPolicyResult.subject.roleSeed, 'anonymous', 'Default policy result subject.roleSeed');
  assertEqual(defaultPolicyResult.policy.allowRouteSuccess, false, 'Default policy result policy.allowRouteSuccess');

  // --- Injected mocked policy still grants no real capability. ---
  assertEqual(injectedPolicy.enabled, true, 'Injected policy enabled');
  assertEqual(injectedPolicy.allowInjectedSupabaseCompatibleClient, true, 'Injected policy allowInjectedSupabaseCompatibleClient');
  assertEqual(injectedPolicy.allowRealSupabaseClientCreation, false, 'Injected policy allowRealSupabaseClientCreation');
  assertEqual(injectedPolicy.allowEnvRead, false, 'Injected policy allowEnvRead');
  assertEqual(injectedPolicy.allowCookieRead, false, 'Injected policy allowCookieRead');
  assertEqual(injectedPolicy.allowHeaderRead, false, 'Injected policy allowHeaderRead');
  assertEqual(injectedPolicy.allowJwtVerification, false, 'Injected policy allowJwtVerification');
  assertEqual(injectedPolicy.allowRouteSuccess, false, 'Injected policy allowRouteSuccess');
  assertEqual(injectedPolicy.allowClientRoleTrust, false, 'Injected policy allowClientRoleTrust');

  // --- B. Client unavailable. ---
  assertEqual(clientUnavailableResult.status, 'client_unavailable', 'Client unavailable result status');
  assertEqual(clientUnavailableResult.ok, false, 'Client unavailable result ok');
  assertEqual(clientUnavailableResult.subject.state, 'anonymous', 'Client unavailable result subject.state');
  assertEqual(clientUnavailableResult.subject.subjectRef, null, 'Client unavailable result subject.subjectRef');
  assertEqual(clientUnavailableResult.subject.roleSeed, 'anonymous', 'Client unavailable result subject.roleSeed');

  // --- C. Missing session. ---
  assertEqual(missingResult.status, 'missing_session', 'Missing session result status');
  assertEqual(missingResult.ok, false, 'Missing session result ok');
  assertEqual(missingResult.subject.state, 'anonymous', 'Missing session result subject.state');
  assertEqual(missingResult.subject.subjectRef, null, 'Missing session result subject.subjectRef');
  assertEqual(missingResult.subject.roleSeed, 'anonymous', 'Missing session result subject.roleSeed');

  // --- D. Invalid session. ---
  assertEqual(invalidResult.status, 'invalid_session', 'Invalid session result status');
  assertEqual(invalidResult.ok, false, 'Invalid session result ok');
  assertEqual(invalidResult.subject.state, 'anonymous', 'Invalid session result subject.state');
  assertEqual(invalidResult.subject.subjectRef, null, 'Invalid session result subject.subjectRef');
  assertEqual(invalidResult.subject.roleSeed, 'anonymous', 'Invalid session result subject.roleSeed');

  // --- E. Expired session. ---
  assertEqual(expiredResult.status, 'expired_session', 'Expired session result status');
  assertEqual(expiredResult.ok, false, 'Expired session result ok');
  assertEqual(expiredResult.subject.state, 'anonymous', 'Expired session result subject.state');
  assertEqual(expiredResult.subject.subjectRef, null, 'Expired session result subject.subjectRef');
  assertEqual(expiredResult.subject.roleSeed, 'anonymous', 'Expired session result subject.roleSeed');

  // --- F. Malformed session. ---
  assertEqual(malformedResult.status, 'malformed_session', 'Malformed session result status');
  assertEqual(malformedResult.ok, false, 'Malformed session result ok');
  assertEqual(malformedResult.subject.state, 'anonymous', 'Malformed session result subject.state');
  assertEqual(malformedResult.subject.subjectRef, null, 'Malformed session result subject.subjectRef');
  assertEqual(malformedResult.subject.roleSeed, 'anonymous', 'Malformed session result subject.roleSeed');

  // --- G. Valid email injected session. ---
  assertEqual(validEmailResult.status, 'resolved', 'Valid email result status');
  assertEqual(validEmailResult.ok, true, 'Valid email result ok');
  assertEqual(validEmailResult.subject.state, 'authenticated', 'Valid email result subject.state');
  assertEqual(validEmailResult.subject.roleSeed, 'authenticated', 'Valid email result subject.roleSeed');
  assertEqual(validEmailResult.subject.providerKind, 'email', 'Valid email result subject.providerKind');
  assertTrue(
    typeof validEmailResult.subject.subjectRef === 'string' &&
      validEmailResult.subject.subjectRef.startsWith('real-supabase-auth-subject:'),
    'Valid email result subject.subjectRef must be a safe synthetic reference',
  );
  const validEmailSerialized = valuesOnlyLowercase(validEmailResult);
  assertTrue(!validEmailSerialized.includes('mock-redacted-session-ref-001'), 'Valid email result must not carry the raw sessionEvidenceRef');
  assertTrue(!validEmailSerialized.includes('accesstoken') && !validEmailSerialized.includes('refreshtoken'), 'Valid email result must not carry a token field');

  // --- H. Valid OAuth injected session. ---
  assertEqual(validOauthResult.status, 'resolved', 'Valid OAuth result status');
  assertEqual(validOauthResult.ok, true, 'Valid OAuth result ok');
  assertEqual(validOauthResult.subject.state, 'authenticated', 'Valid OAuth result subject.state');
  assertEqual(validOauthResult.subject.providerKind, 'oauth', 'Valid OAuth result subject.providerKind');
  assertEqual(validOauthResult.subject.roleSeed, 'authenticated', 'Valid OAuth result subject.roleSeed');
  const validOauthSerialized = valuesOnlyLowercase(validOauthResult);
  assertTrue(!validOauthSerialized.includes('provider_metadata'), 'Valid OAuth result must not carry raw provider metadata');

  // --- I. Client-claimed role ignored. ---
  assertEqual(clientRoleClaimResult.status, 'resolved', 'Client role claim result status');
  assertEqual(clientRoleClaimResult.subject.roleSeed, 'authenticated', 'Client role claim result subject.roleSeed must stay authenticated');
  assertTrue(
    clientRoleClaimResult.subject.roleSeed !== 'owner' &&
      clientRoleClaimResult.subject.roleSeed !== 'beta' &&
      clientRoleClaimResult.subject.roleSeed !== 'admin',
    'Client role claim result subject.roleSeed must never become beta/owner/admin',
  );
  assertTrue(
    clientRoleClaimResult.warnings.includes('client_role_claim_ignored'),
    'Client role claim result warnings must include client_role_claim_ignored',
  );
  const clientRoleClaimSerialized = valuesOnlyLowercase(clientRoleClaimResult);
  assertTrue(!clientRoleClaimSerialized.includes('"owner"'), 'Client role claim result must not surface the literal claimed role value');

  // --- J. Injected client error. ---
  assertEqual(clientErrorResult.status, 'error', 'Client error result status');
  assertEqual(clientErrorResult.ok, false, 'Client error result ok');
  assertEqual(clientErrorResult.subject.state, 'anonymous', 'Client error result subject.state');
  assertTrue(clientErrorResult.safeMessage.includes('network'), 'Client error result safeMessage must include the safe error category');
  const clientErrorSerialized = valuesOnlyLowercase(clientErrorResult);
  assertTrue(!clientErrorSerialized.includes('stack'), 'Client error result must not carry a raw error stack');
  assertTrue(clientErrorResult.warnings.length === 0, 'Client error result warnings must be empty when no client-claimed role was present');

  // --- Redaction test fixture. ---
  assertEqual(unsafeLikeResult.ok, true, 'Redaction test fixture result ok');
  const unsafeLikeSerialized = valuesOnlyLowercase(unsafeLikeResult);
  assertTrue(!unsafeLikeSerialized.includes('rawsession') && !unsafeLikeSerialized.includes('rawuser'), 'Redaction test fixture result must not carry raw session/user markers');

  // --- K. Mapping to the Phase 3FC-C auth subject seed contract. ---
  const anonymousSeed = mod.mapRealSupabaseAuthSubjectResultToAuthSubjectSeed(missingResult);
  assertEqual(anonymousSeed.authState, 'anonymous', 'Anonymous seed authState');
  assertEqual(anonymousSeed.roleSeed, 'anonymous', 'Anonymous seed roleSeed');
  assertEqual(anonymousSeed.subjectRef, null, 'Anonymous seed subjectRef');

  const authenticatedSeed = mod.mapRealSupabaseAuthSubjectResultToAuthSubjectSeed(validEmailResult);
  assertEqual(authenticatedSeed.authState, 'authenticated', 'Authenticated seed authState');
  assertEqual(authenticatedSeed.roleSeed, 'authenticated', 'Authenticated seed roleSeed');
  assertEqual(
    authenticatedSeed.subjectRef,
    validEmailResult.subject.subjectRef,
    'Authenticated seed subjectRef must match the resolved subject.subjectRef',
  );
  assertTrue(
    authenticatedSeed.roleSeed !== 'beta' && authenticatedSeed.roleSeed !== 'owner' && authenticatedSeed.roleSeed !== 'admin',
    'Authenticated seed roleSeed must never be beta/owner/admin',
  );
  assertTrue(
    authenticatedSeed.subjectRef !== 'mock-real-compatible-user-ref-001',
    'Authenticated seed subjectRef must be a derived safe reference, not the bare raw userRef',
  );

  const clientRoleClaimSeed = mod.mapRealSupabaseAuthSubjectResultToAuthSubjectSeed(clientRoleClaimResult);
  assertEqual(clientRoleClaimSeed.roleSeed, 'authenticated', 'Client role claim seed roleSeed must stay authenticated, never the claimed role');

  const disabledSeed = mod.mapRealSupabaseAuthSubjectResultToAuthSubjectSeed(defaultPolicyResult);
  assertEqual(disabledSeed.authState, 'anonymous', 'Disabled result seed authState must be anonymous');

  // --- L. Runtime safety. ---
  assertTrue(!fetchCalled, 'fetch must never be called by the resolver');
  const bundledCode = stripComments(bundledSource);
  assertTrue(!/@supabase/.test(bundledCode), 'Bundled resolver module must not import a Supabase package');
  assertTrue(!/createClient\s*\(/.test(bundledCode), 'Bundled resolver module must not call createClient');
  assertTrue(!/process\.env(\.\w+|\[)/.test(bundledCode), 'Bundled resolver module must not access process.env');
  assertTrue(!/import\.meta\.env/.test(bundledCode), 'Bundled resolver module must not access import.meta.env');
  assertTrue(!/document\.cookie|req\.headers|request\.headers|getHeader\(/.test(bundledCode), 'Bundled resolver module must not read cookies/headers');
  assertTrue(!/jsonwebtoken|jose\b|verifyJwt|decodeJwt/.test(bundledCode), 'Bundled resolver module must not use a JWT library');
  assertTrue(
    !/kisOhlcProvider|serverOnlyKisOhlcProvider|mockedKisOhlcAdapter/.test(bundledCode),
    'Bundled resolver module must not import a KIS provider module',
  );
  assertTrue(
    !/pages[\\/]api|similarityApiRouteShell|similarityGuardedRouteScaffold/.test(bundledCode),
    'Bundled resolver module must not import a route or guarded route scaffold module',
  );
  assertTrue(!/\bCREATE TABLE\b|\bALTER TABLE\b|\.sql['"]/i.test(bundledCode), 'Bundled resolver module must not contain SQL/migration statements');
  assertTrue(
    !/\baccountBalance\b|\btradingOrder\b|\borderId\b/.test(bundledCode),
    'Bundled resolver module must not contain account/trading/order/balance fields',
  );

  // Source-level safety check against the actual on-disk resolver file (not just the bundle).
  const resolverCode = stripComments(
    readFileSync('src/lib/server/chartSimilarity/similarityRealSupabaseAuthSubjectResolver.ts', 'utf8'),
  );
  assertTrue(!/@supabase/.test(resolverCode), 'Resolver source must not import a Supabase package');
  assertTrue(!/createClient\s*\(/.test(resolverCode), 'Resolver source must not call createClient');
  assertTrue(!/process\.env(\.\w+|\[)/.test(resolverCode), 'Resolver source must not access process.env');
  assertTrue(!/import\.meta\.env/.test(resolverCode), 'Resolver source must not access import.meta.env');
  assertTrue(!/document\.cookie|req\.headers|request\.headers/.test(resolverCode), 'Resolver source must not read cookies/headers');
  assertTrue(!/\bfetch\(/.test(resolverCode), 'Resolver source must not call fetch');

  const typesCode = stripComments(
    readFileSync('src/lib/server/chartSimilarity/similarityRealSupabaseAuthSubjectResolverTypes.ts', 'utf8'),
  );
  assertTrue(!/@supabase/.test(typesCode), 'Types source must not import a Supabase package');
  assertTrue(!/process\.env(\.\w+|\[)/.test(typesCode), 'Types source must not access process.env');

  const fixturesCode = stripComments(
    readFileSync('src/lib/server/chartSimilarity/mockedSimilarityRealSupabaseAuthSubjectResolverFixtures.ts', 'utf8'),
  );
  assertTrue(!/@supabase/.test(fixturesCode), 'Fixtures source must not import a Supabase package');
  assertTrue(!/process\.env(\.\w+|\[)/.test(fixturesCode), 'Fixtures source must not access process.env');
  assertTrue(
    !/@[\w.-]+\.[\w.-]+/.test(fixturesCode.replace(/mock-real-compatible-user-ref-\d+/g, '').replace(/mock-redacted-session-ref-\d+/g, '')),
    'Fixtures source must not contain a real-looking email address',
  );

  if (failures.length > 0) {
    process.stdout.write(`Phase 3FD-B smoke: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
    for (const failure of failures) {
      process.stdout.write(`  - ${failure}\n`);
    }
    return 1;
  }

  process.stdout.write(`Phase 3FD-B smoke: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  return 0;
};

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    process.stdout.write('Phase 3FD-B smoke: FAIL\n');
    process.stdout.write(`reason: ${error && error.message ? error.message : 'smoke script error'}\n`);
    process.exitCode = 1;
  });
