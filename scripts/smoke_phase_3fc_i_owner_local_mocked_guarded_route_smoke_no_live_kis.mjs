/**
 * Owner-local mocked guarded route smoke (Phase 3FC-I).
 *
 * Exercises the real Astro API route handlers (`POST`, `ALL`) exported from
 * `src/pages/api/chart-ai/similarity.ts` and the Phase 3FC-H guarded route scaffold module
 * directly, without starting a dev server, without a real Supabase client, without reading
 * `process.env`/`import.meta.env`, and without any network call. Confirms: (A) the harness itself
 * never calls `fetch`/live KIS and the bundled route output never accesses env or a Supabase
 * package; (B) a default unmatched request still resolves to the existing feature-disabled shell;
 * (C) the existing owner-local-mocked branch (Phase 3FB-B) is unchanged; (D) the existing
 * owner-local auth/usage bridge branch (Phase 3FB-C-ALT) is unchanged; (E) the exact
 * guarded-runtime-scaffold request (Phase 3FC-H) is route-recognized but still falls back to the
 * safe disabled shell, with no success, no provider execution, and no scaffold internals leaked;
 * (F/G/H) a partial, wrong-source, or malformed/null guarded request never matches the guarded
 * branch and always resolves safely; (I) the scaffold module itself, called directly, always
 * returns a safe disabled/blocked status; (J) the three branch discriminators are mutually
 * exclusive. This is a focused smoke (a bounded assertion list), not a full historical checker
 * suite. No runtime source file is modified by this phase.
 *
 * Run:
 *   npm run smoke:phase-3fc-i-owner-local-mocked-guarded-route-smoke-no-live-kis
 */

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

const FORBIDDEN_SUBSTRINGS = [
  'KIS_APP_KEY',
  'KIS_APP_SECRET',
  'KIS_BASE_URL',
  'accessToken',
  'refreshToken',
  'appSecret',
  'appKey',
  'account',
  'trading',
  'balance',
  'credential',
  'jwt',
  '"source":"live"',
  '"source":"auto"',
];

const assertNoForbiddenSubstrings = (serialized, label) => {
  const found = FORBIDDEN_SUBSTRINGS.filter((needle) => serialized.includes(needle));
  assertTrue(found.length === 0, `${label} must not contain any forbidden substring (found: ${found.join(', ')})`);
};

const loadModules = async () => {
  const entryContents = [
    "export { POST, ALL } from './src/pages/api/chart-ai/similarity.ts';",
    "export {",
    '  isGuardedRuntimeScaffoldSimilarityRequestBody,',
    '  runSimilarityGuardedRouteScaffold,',
    '  buildDefaultSimilarityGuardedRouteScaffoldPolicy,',
    '  assertSimilarityGuardedRouteScaffoldResultIsSafe,',
    "} from './src/lib/server/chartSimilarity/similarityGuardedRouteScaffold.ts';",
    "export {",
    '  buildMockedGuardedRuntimeScaffoldRequestBody,',
    '  buildMockedMalformedGuardedRuntimeScaffoldRequestBody,',
    '  buildMockedPartialGuardedRuntimeScaffoldRequestBody,',
    "} from './src/lib/server/chartSimilarity/mockedSimilarityGuardedRouteScaffoldFixtures.ts';",
    "export {",
    '  isOwnerLocalMockedSimilarityApiRequestBody,',
    '  isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody,',
    "} from './src/lib/server/chartSimilarity/similarityApiResponseBuilder.ts';",
    "export {",
    '  buildMockedOwnerAuthUsageBridgeAllowedRequestBody,',
    "} from './src/lib/server/chartSimilarity/mockedSimilarityAuthUsageRouteBridgeFixtures.ts';",
  ].join('\n');

  const bundle = await build({
    stdin: {
      contents: entryContents,
      resolveDir: root,
      sourcefile: 'owner-local-mocked-guarded-route-smoke-entry.ts',
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

const buildJsonRequest = (body) =>
  new Request('http://localhost/api/chart-ai/similarity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const main = async () => {
  const { mod, bundledSource } = await loadModules();

  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = () => {
    fetchCalled = true;
    throw new Error('fetch must never be called by the owner-local mocked guarded route smoke.');
  };

  const guardedExactBody = mod.buildMockedGuardedRuntimeScaffoldRequestBody();
  const guardedMalformedBody = mod.buildMockedMalformedGuardedRuntimeScaffoldRequestBody();
  const guardedPartialBody = mod.buildMockedPartialGuardedRuntimeScaffoldRequestBody();
  const guardedWrongSourceBody = {
    mode: 'guarded-runtime-scaffold',
    source: 'live',
    guardedRuntimeScaffold: true,
  };
  const ownerLocalMockedBody = {
    mode: 'owner-local-mocked',
    source: 'mocked-provider-compatible',
    ownerLocalMocked: true,
    symbol: 'MOCKSYM',
  };
  const authUsageBridgeAllowedBody = mod.buildMockedOwnerAuthUsageBridgeAllowedRequestBody();

  let defaultResponse;
  let allHandlerResponse;
  let ownerLocalMockedResponse;
  let authUsageBridgeResponse;
  let guardedExactResponse;
  let guardedPartialResponse;
  let guardedWrongSourceResponse;
  let guardedMalformedResponse;
  let guardedNullResponse;
  let guardedNonObjectResponse;

  try {
    defaultResponse = await mod.POST({ request: buildJsonRequest({}) });
    allHandlerResponse = mod.ALL();

    ownerLocalMockedResponse = await mod.POST({ request: buildJsonRequest(ownerLocalMockedBody) });
    authUsageBridgeResponse = await mod.POST({ request: buildJsonRequest(authUsageBridgeAllowedBody) });

    guardedExactResponse = await mod.POST({ request: buildJsonRequest(guardedExactBody) });
    guardedPartialResponse = await mod.POST({ request: buildJsonRequest(guardedPartialBody) });
    guardedWrongSourceResponse = await mod.POST({ request: buildJsonRequest(guardedWrongSourceBody) });
    guardedMalformedResponse = await mod.POST({ request: buildJsonRequest(guardedMalformedBody) });
    guardedNullResponse = await mod.POST({ request: buildJsonRequest(null) });
    guardedNonObjectResponse = await mod.POST({ request: buildJsonRequest('not-an-object') });
  } finally {
    globalThis.fetch = originalFetch;
  }

  const defaultBody = await defaultResponse.json();
  const allHandlerBody = await allHandlerResponse.json();
  const ownerLocalMockedResponseBody = await ownerLocalMockedResponse.json();
  const authUsageBridgeResponseBody = await authUsageBridgeResponse.json();
  const guardedExactResponseBody = await guardedExactResponse.json();
  const guardedPartialResponseBody = await guardedPartialResponse.json();
  const guardedWrongSourceResponseBody = await guardedWrongSourceResponse.json();
  const guardedMalformedResponseBody = await guardedMalformedResponse.json();
  const guardedNullResponseBody = await guardedNullResponse.json();
  const guardedNonObjectResponseBody = await guardedNonObjectResponse.json();

  // --- A. Harness safety. ---
  assertTrue(!fetchCalled, 'fetch must never be called by the smoke harness');
  assertTrue(
    !/process\.env(\.\w+|\[)/.test(bundledSource),
    'Bundled output must not access process.env',
  );
  assertTrue(
    !/import\.meta\.env(\.\w+|\[)/.test(bundledSource),
    'Bundled output must not access import.meta.env',
  );
  assertTrue(!/from ['"]@supabase\//.test(bundledSource), 'Bundled output must not import a Supabase package');
  assertNoForbiddenSubstrings(JSON.stringify(defaultBody), 'Default response');
  assertNoForbiddenSubstrings(JSON.stringify(ownerLocalMockedResponseBody), 'Owner-local mocked response');
  assertNoForbiddenSubstrings(JSON.stringify(authUsageBridgeResponseBody), 'Auth/usage bridge response');
  assertNoForbiddenSubstrings(JSON.stringify(guardedExactResponseBody), 'Guarded-exact response');
  assertNoForbiddenSubstrings(JSON.stringify(guardedMalformedResponseBody), 'Guarded-malformed response');

  // --- B. Default unmatched request. ---
  assertEqual(defaultResponse.status, 503, 'Default POST httpStatus');
  assertEqual(defaultBody.ok, false, 'Default POST response ok');
  assertEqual(defaultBody.status, 'feature_disabled', 'Default POST response status');
  assertEqual(defaultBody.mode, 'feature-flag-off', 'Default POST response mode');
  assertEqual(defaultBody.data, null, 'Default POST response data');
  assertEqual(defaultBody.error.code, 'feature_disabled', 'Default POST response error.code');
  assertTrue(Array.isArray(defaultBody.warnings), 'Default POST response warnings is an array');
  assertEqual(allHandlerBody.status, 'feature_disabled', 'ALL handler response status');
  assertEqual(allHandlerBody.mode, 'feature-flag-off', 'ALL handler response mode');
  assertEqual(
    defaultResponse.headers.get('cache-control'),
    'no-store',
    'Default POST Cache-Control header',
  );
  assertTrue(
    (defaultResponse.headers.get('content-type') || '').includes('application/json'),
    'Default POST Content-Type header',
  );

  // --- C. Existing owner-local mocked branch regression (Phase 3FB-B). ---
  assertEqual(ownerLocalMockedResponse.status, 200, 'Owner-local mocked POST httpStatus (regression)');
  assertEqual(ownerLocalMockedResponseBody.ok, true, 'Owner-local mocked POST response ok (regression)');
  assertEqual(ownerLocalMockedResponseBody.mode, 'owner-local-mocked', 'Owner-local mocked POST response mode (regression)');
  assertEqual(
    ownerLocalMockedResponseBody.request.source,
    'mocked-provider-compatible',
    'Owner-local mocked POST request.source (regression)',
  );
  assertTrue(
    typeof ownerLocalMockedResponseBody.data.engineStatus === 'string',
    'Owner-local mocked POST response data.engineStatus present (regression)',
  );
  assertEqual(ownerLocalMockedResponseBody.error, null, 'Owner-local mocked POST response error (regression)');
  assertTrue(Array.isArray(ownerLocalMockedResponseBody.warnings), 'Owner-local mocked POST response warnings is an array (regression)');
  assertEqual(
    ownerLocalMockedResponse.headers.get('cache-control'),
    'no-store',
    'Owner-local mocked POST Cache-Control header (regression)',
  );
  assertTrue(
    (ownerLocalMockedResponse.headers.get('content-type') || '').includes('application/json'),
    'Owner-local mocked POST Content-Type header (regression)',
  );

  // --- D. Existing owner-local auth/usage bridge branch regression (Phase 3FB-C-ALT). ---
  assertEqual(authUsageBridgeResponse.status, 200, 'Auth/usage bridge POST httpStatus (regression)');
  assertEqual(authUsageBridgeResponseBody.ok, true, 'Auth/usage bridge POST response ok (regression)');
  assertEqual(
    authUsageBridgeResponseBody.mode,
    'owner-local-auth-usage-bridge',
    'Auth/usage bridge POST response mode (regression)',
  );
  assertEqual(authUsageBridgeResponseBody.data.guardStatus, 'allowed', 'Auth/usage bridge POST data.guardStatus (regression)');
  assertEqual(authUsageBridgeResponseBody.data.role, 'owner', 'Auth/usage bridge POST data.role (regression)');
  assertEqual(
    authUsageBridgeResponseBody.data.dataPolicy.allowLiveKis,
    false,
    'Auth/usage bridge POST data.dataPolicy.allowLiveKis (regression)',
  );
  assertTrue(!('matches' in authUsageBridgeResponseBody.data), 'Auth/usage bridge POST data must not include a raw matches array');
  assertEqual(authUsageBridgeResponseBody.error, null, 'Auth/usage bridge POST response error (regression)');
  assertTrue(
    Array.isArray(authUsageBridgeResponseBody.warnings),
    'Auth/usage bridge POST response warnings is an array (regression)',
  );
  assertEqual(
    authUsageBridgeResponse.headers.get('cache-control'),
    'no-store',
    'Auth/usage bridge POST Cache-Control header (regression)',
  );
  assertTrue(
    (authUsageBridgeResponse.headers.get('content-type') || '').includes('application/json'),
    'Auth/usage bridge POST Content-Type header (regression)',
  );

  // --- E. New guarded-runtime-scaffold exact request. ---
  assertTrue(
    mod.isGuardedRuntimeScaffoldSimilarityRequestBody(guardedExactBody),
    'Exact guarded request body must be route-recognized enough to execute the Phase 3FC-H branch',
  );
  assertEqual(guardedExactResponse.status, 503, 'Guarded-exact POST httpStatus falls back to safe disabled shell');
  assertEqual(guardedExactResponseBody.ok, false, 'Guarded-exact POST response ok falls back to safe disabled shell');
  assertEqual(
    guardedExactResponseBody.status,
    'feature_disabled',
    'Guarded-exact POST response status falls back to safe disabled shell',
  );
  assertEqual(
    guardedExactResponseBody.mode,
    'feature-flag-off',
    'Guarded-exact POST response mode falls back to safe disabled shell',
  );
  assertEqual(guardedExactResponseBody.data, null, 'Guarded-exact POST response data falls back to safe disabled shell');
  assertTrue(
    !('summary' in guardedExactResponseBody) && !('safeMessage' in guardedExactResponseBody) && !('policy' in guardedExactResponseBody),
    'Guarded-exact POST response must not leak scaffold-internal fields to the client',
  );
  assertEqual(guardedExactResponseBody.error.code, 'feature_disabled', 'Guarded-exact POST response error.code');
  assertTrue(Array.isArray(guardedExactResponseBody.warnings), 'Guarded-exact POST response warnings is an array');
  assertEqual(
    guardedExactResponse.headers.get('cache-control'),
    'no-store',
    'Guarded-exact POST Cache-Control header',
  );
  assertTrue(
    (guardedExactResponse.headers.get('content-type') || '').includes('application/json'),
    'Guarded-exact POST Content-Type header',
  );

  // --- F. Guarded partial request. ---
  assertTrue(
    !mod.isGuardedRuntimeScaffoldSimilarityRequestBody(guardedPartialBody),
    'Partial guarded request body must not match the guarded branch',
  );
  assertEqual(guardedPartialResponse.status, 503, 'Guarded-partial POST httpStatus falls back to shell');
  assertEqual(guardedPartialResponseBody.status, 'feature_disabled', 'Guarded-partial POST response status falls back to shell');
  assertEqual(guardedPartialResponseBody.mode, 'feature-flag-off', 'Guarded-partial POST response mode falls back to shell');
  assertEqual(guardedPartialResponseBody.ok, false, 'Guarded-partial POST response ok falls back to shell');
  assertEqual(guardedPartialResponseBody.data, null, 'Guarded-partial POST response data falls back to shell');
  assertNoForbiddenSubstrings(JSON.stringify(guardedPartialResponseBody), 'Guarded-partial response');
  assertTrue(
    !mod.isOwnerLocalMockedSimilarityApiRequestBody(guardedPartialBody),
    'Partial guarded request must not match the owner-local-mocked branch predicate',
  );
  assertTrue(
    !mod.isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody(guardedPartialBody),
    'Partial guarded request must not match the owner-local auth/usage bridge branch predicate',
  );

  // --- G. Guarded wrong source. ---
  assertTrue(
    !mod.isGuardedRuntimeScaffoldSimilarityRequestBody(guardedWrongSourceBody),
    'Wrong-source guarded request body must not match the guarded branch',
  );
  assertEqual(guardedWrongSourceResponse.status, 503, 'Guarded-wrong-source POST httpStatus falls back to shell');
  assertEqual(
    guardedWrongSourceResponseBody.status,
    'feature_disabled',
    'Guarded-wrong-source POST response status falls back to shell',
  );
  assertEqual(guardedWrongSourceResponseBody.ok, false, 'Guarded-wrong-source POST response ok falls back to shell');
  assertEqual(guardedWrongSourceResponseBody.data, null, 'Guarded-wrong-source POST response data falls back to shell');
  assertNoForbiddenSubstrings(JSON.stringify(guardedWrongSourceResponseBody), 'Guarded-wrong-source response');

  // --- H. Guarded malformed request (including null and non-object bodies). ---
  assertTrue(
    !mod.isGuardedRuntimeScaffoldSimilarityRequestBody(guardedMalformedBody),
    'Malformed guarded request body must not match the guarded branch',
  );
  assertTrue(!mod.isGuardedRuntimeScaffoldSimilarityRequestBody(null), 'null body must not match the guarded branch');
  assertTrue(
    !mod.isGuardedRuntimeScaffoldSimilarityRequestBody('not-an-object'),
    'Non-object body must not match the guarded branch',
  );
  assertTrue(
    !mod.isOwnerLocalMockedSimilarityApiRequestBody(guardedMalformedBody),
    'Malformed guarded request must not match the owner-local-mocked branch predicate',
  );
  assertTrue(
    !mod.isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody(guardedMalformedBody),
    'Malformed guarded request must not match the owner-local auth/usage bridge branch predicate',
  );
  assertEqual(guardedMalformedResponse.status, 503, 'Guarded-malformed POST httpStatus falls back to shell safely');
  assertEqual(guardedMalformedResponseBody.status, 'feature_disabled', 'Guarded-malformed POST response status falls back to shell safely');
  assertEqual(guardedMalformedResponseBody.ok, false, 'Guarded-malformed POST response ok falls back to shell safely');
  assertEqual(guardedMalformedResponseBody.data, null, 'Guarded-malformed POST response data falls back to shell safely');
  assertNoForbiddenSubstrings(JSON.stringify(guardedMalformedResponseBody), 'Guarded-malformed response (H)');
  assertEqual(guardedNullResponse.status, 503, 'Guarded null-body POST httpStatus falls back to shell safely');
  assertEqual(guardedNullResponseBody.status, 'feature_disabled', 'Guarded null-body POST response status falls back to shell safely');
  assertEqual(guardedNullResponseBody.ok, false, 'Guarded null-body POST response ok falls back to shell safely');
  assertEqual(guardedNullResponseBody.data, null, 'Guarded null-body POST response data falls back to shell safely');
  assertNoForbiddenSubstrings(JSON.stringify(guardedNullResponseBody), 'Guarded null-body response');
  assertEqual(guardedNonObjectResponse.status, 503, 'Guarded non-object-body POST httpStatus falls back to shell safely');
  assertEqual(
    guardedNonObjectResponseBody.status,
    'feature_disabled',
    'Guarded non-object-body POST response status falls back to shell safely',
  );
  assertEqual(guardedNonObjectResponseBody.ok, false, 'Guarded non-object-body POST response ok falls back to shell safely');
  assertEqual(guardedNonObjectResponseBody.data, null, 'Guarded non-object-body POST response data falls back to shell safely');
  assertNoForbiddenSubstrings(JSON.stringify(guardedNonObjectResponseBody), 'Guarded non-object-body response');

  // --- I. Direct scaffold module confirmation. ---
  const defaultPolicy = mod.buildDefaultSimilarityGuardedRouteScaffoldPolicy();
  assertEqual(defaultPolicy.enabled, false, 'Default policy enabled');
  assertEqual(defaultPolicy.allowRouteBranchRecognition, false, 'Default policy allowRouteBranchRecognition');
  assertEqual(defaultPolicy.allowRouteSuccess, false, 'Default policy allowRouteSuccess');
  assertEqual(defaultPolicy.allowMockedProviderExecution, false, 'Default policy allowMockedProviderExecution');
  assertEqual(defaultPolicy.allowLiveKis, false, 'Default policy allowLiveKis');
  assertEqual(defaultPolicy.allowRealSupabase, false, 'Default policy allowRealSupabase');
  assertEqual(defaultPolicy.allowRealDb, false, 'Default policy allowRealDb');
  assertEqual(defaultPolicy.allowEnvRead, false, 'Default policy allowEnvRead');
  assertEqual(defaultPolicy.allowCookieRead, false, 'Default policy allowCookieRead');
  assertEqual(defaultPolicy.allowHeaderAuthRead, false, 'Default policy allowHeaderAuthRead');
  assertEqual(defaultPolicy.allowPublicExecution, false, 'Default policy allowPublicExecution');
  assertEqual(defaultPolicy.allowBetaExecution, false, 'Default policy allowBetaExecution');
  const directScaffoldResult = mod.runSimilarityGuardedRouteScaffold(guardedExactBody, defaultPolicy);
  assertTrue(
    directScaffoldResult.status === 'disabled' || directScaffoldResult.status === 'feature_flag_blocked',
    'Direct scaffold module call must return disabled or feature_flag_blocked',
  );
  assertEqual(directScaffoldResult.ok, false, 'Direct scaffold module call result ok');
  assertEqual(directScaffoldResult.summary.routeSuccessAllowed, false, 'Direct scaffold module call summary.routeSuccessAllowed');
  assertEqual(directScaffoldResult.summary.liveKisAllowed, false, 'Direct scaffold module call summary.liveKisAllowed');
  assertEqual(
    directScaffoldResult.summary.providerStatus,
    'mocked_provider_not_invoked',
    'Direct scaffold module call summary.providerStatus',
  );
  assertTrue(
    (() => {
      try {
        mod.assertSimilarityGuardedRouteScaffoldResultIsSafe(directScaffoldResult);
        return true;
      } catch {
        return false;
      }
    })(),
    'Direct scaffold module call result must pass the safety assertion',
  );

  // --- J. Branch mutual exclusion. ---
  assertTrue(
    !mod.isOwnerLocalMockedSimilarityApiRequestBody(guardedExactBody),
    'Guarded request must not match the owner-local-mocked branch predicate',
  );
  assertTrue(
    !mod.isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody(guardedExactBody),
    'Guarded request must not match the owner-local auth/usage bridge branch predicate',
  );
  assertTrue(
    !mod.isGuardedRuntimeScaffoldSimilarityRequestBody(ownerLocalMockedBody),
    'Owner-local-mocked request must not match the guarded branch predicate',
  );
  assertTrue(
    !mod.isGuardedRuntimeScaffoldSimilarityRequestBody(authUsageBridgeAllowedBody),
    'Owner-local auth/usage bridge request must not match the guarded branch predicate',
  );
  assertTrue(
    !mod.isOwnerLocalMockedSimilarityApiRequestBody(authUsageBridgeAllowedBody),
    'Owner-local auth/usage bridge request must not match the owner-local-mocked branch predicate',
  );
  assertTrue(
    !mod.isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody(ownerLocalMockedBody),
    'Owner-local-mocked request must not match the owner-local auth/usage bridge branch predicate',
  );

  if (failures.length > 0) {
    process.stdout.write(`Phase 3FC-I smoke: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
    for (const failure of failures) {
      process.stdout.write(`  - ${failure}\n`);
    }
    return 1;
  }

  process.stdout.write(`Phase 3FC-I smoke: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  return 0;
};

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    process.stdout.write('Phase 3FC-I smoke: FAIL\n');
    process.stdout.write(`reason: ${error && error.message ? error.message : 'smoke script error'}\n`);
    process.exitCode = 1;
  });
