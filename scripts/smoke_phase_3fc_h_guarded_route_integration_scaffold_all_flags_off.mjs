/**
 * Guarded route integration scaffold, all flags off, smoke (Phase 3FC-H).
 *
 * Exercises the actual guarded route scaffold module (`similarityGuardedRouteScaffold.ts`), its
 * fixtures, and the real Astro API route handlers (`POST`, `ALL`) exported from
 * `src/pages/api/chart-ai/similarity.ts`, without starting a dev server, without a real Supabase
 * client, without reading `process.env` or `import.meta.env`, and without any network call.
 * Confirms: (A) the scaffold module's default policy is disabled with no route success, no
 * mocked provider execution, and no live KIS, and the safety assertion passes; (B) the request
 * discriminator exact-matches only the full `guarded-runtime-scaffold` shape and rejects partial
 * or malformed bodies; (C) running the scaffold against an exact guarded request always returns a
 * safe `disabled` or `feature_flag_blocked` result with `routeSuccessAllowed`/`liveKisAllowed`
 * false and `providerStatus` `mocked_provider_not_invoked`; (D) the route still behaves exactly as
 * before for the default shell and the two existing owner-local branches, and the new guarded
 * branch always falls back to the existing feature-disabled shell response with no new success
 * shape; (E) no `fetch` call, no Supabase import, no `process.env`/`import.meta.env` access, and
 * no KIS provider import occur anywhere in this path. This is a focused smoke (a bounded assertion
 * list), not a full historical checker suite.
 *
 * Run:
 *   npm run smoke:phase-3fc-h-guarded-route-integration-scaffold-all-flags-off
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

const stripComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

const FORBIDDEN_ROUTE_SUBSTRINGS = [
  'KIS_APP_KEY',
  'KIS_APP_SECRET',
  'KIS_BASE_URL',
  'accessToken',
  'appSecret',
  'appKey',
  'account',
  'trading',
  'balance',
  'credential',
  'token',
  'price',
  'volume',
  '"source":"live"',
  '"source":"auto"',
];

const assertNoForbiddenSubstrings = (serialized, label) => {
  const found = FORBIDDEN_ROUTE_SUBSTRINGS.filter((needle) => serialized.includes(needle));
  assertTrue(found.length === 0, `${label} must not contain any forbidden substring (found: ${found.join(', ')})`);
};

const loadScaffoldModule = async () => {
  const entryContents = [
    "export {",
    '  buildDefaultSimilarityGuardedRouteScaffoldPolicy,',
    '  buildRouteRecognizedSimilarityGuardedRouteScaffoldPolicy,',
    '  isGuardedRuntimeScaffoldSimilarityRequestBody,',
    '  normalizeSimilarityGuardedRouteScaffoldRequestBody,',
    '  runSimilarityGuardedRouteScaffold,',
    '  assertSimilarityGuardedRouteScaffoldResultIsSafe,',
    "} from './src/lib/server/chartSimilarity/similarityGuardedRouteScaffold.ts';",
    "export {",
    '  buildMockedGuardedRuntimeScaffoldRequestBody,',
    '  buildMockedMalformedGuardedRuntimeScaffoldRequestBody,',
    '  buildMockedPartialGuardedRuntimeScaffoldRequestBody,',
    "} from './src/lib/server/chartSimilarity/mockedSimilarityGuardedRouteScaffoldFixtures.ts';",
  ].join('\n');

  const bundle = await build({
    stdin: {
      contents: entryContents,
      resolveDir: root,
      sourcefile: 'guarded-route-scaffold-smoke-entry.ts',
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

const loadRouteModule = async () => {
  const entryContents = "export { POST, ALL } from './src/pages/api/chart-ai/similarity.ts';";

  const bundle = await build({
    stdin: {
      contents: entryContents,
      resolveDir: root,
      sourcefile: 'guarded-route-scaffold-route-smoke-entry.ts',
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    write: false,
    logLevel: 'silent',
  });

  return import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
};

const buildJsonRequest = (body) =>
  new Request('http://localhost/api/chart-ai/similarity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const main = async () => {
  const { mod, bundledSource } = await loadScaffoldModule();
  const routeMod = await loadRouteModule();

  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = () => {
    fetchCalled = true;
    throw new Error('fetch must never be called by the guarded route scaffold or the route.');
  };

  let defaultPolicy;
  let routeRecognizedPolicy;
  let exactRequestBody;
  let malformedRequestBody;
  let partialRequestBody;
  let defaultPolicyResult;
  let routeRecognizedResult;
  let malformedResult;
  let partialResult;

  let defaultRouteResponse;
  let ownerLocalMockedRouteResponse;
  let authUsageBridgeRouteResponse;
  let guardedScaffoldRouteResponse;
  let guardedScaffoldPartialRouteResponse;
  let guardedScaffoldMalformedRouteResponse;
  let allHandlerResponse;

  try {
    defaultPolicy = mod.buildDefaultSimilarityGuardedRouteScaffoldPolicy();
    routeRecognizedPolicy = mod.buildRouteRecognizedSimilarityGuardedRouteScaffoldPolicy();

    exactRequestBody = mod.buildMockedGuardedRuntimeScaffoldRequestBody();
    malformedRequestBody = mod.buildMockedMalformedGuardedRuntimeScaffoldRequestBody();
    partialRequestBody = mod.buildMockedPartialGuardedRuntimeScaffoldRequestBody();

    defaultPolicyResult = mod.runSimilarityGuardedRouteScaffold(exactRequestBody, defaultPolicy);
    routeRecognizedResult = mod.runSimilarityGuardedRouteScaffold(exactRequestBody, routeRecognizedPolicy);
    malformedResult = mod.runSimilarityGuardedRouteScaffold(malformedRequestBody, routeRecognizedPolicy);
    partialResult = mod.runSimilarityGuardedRouteScaffold(partialRequestBody, routeRecognizedPolicy);

    mod.assertSimilarityGuardedRouteScaffoldResultIsSafe(defaultPolicyResult);
    mod.assertSimilarityGuardedRouteScaffoldResultIsSafe(routeRecognizedResult);
    mod.assertSimilarityGuardedRouteScaffoldResultIsSafe(malformedResult);
    mod.assertSimilarityGuardedRouteScaffoldResultIsSafe(partialResult);

    defaultRouteResponse = await routeMod.POST({ request: buildJsonRequest({}) });

    ownerLocalMockedRouteResponse = await routeMod.POST({
      request: buildJsonRequest({
        mode: 'owner-local-mocked',
        source: 'mocked-provider-compatible',
        ownerLocalMocked: true,
        symbol: 'MOCKSYM',
      }),
    });

    authUsageBridgeRouteResponse = await routeMod.POST({
      request: buildJsonRequest({
        mode: 'owner-local-auth-usage-bridge',
        source: 'mocked-provider-compatible',
        ownerLocalAuthUsageBridge: true,
        mockAuth: { role: 'anonymous', authState: 'anonymous' },
        mockUsage: {},
      }),
    });

    guardedScaffoldRouteResponse = await routeMod.POST({ request: buildJsonRequest(exactRequestBody) });
    guardedScaffoldPartialRouteResponse = await routeMod.POST({ request: buildJsonRequest(partialRequestBody) });
    guardedScaffoldMalformedRouteResponse = await routeMod.POST({
      request: buildJsonRequest(malformedRequestBody),
    });

    allHandlerResponse = routeMod.ALL();
  } finally {
    globalThis.fetch = originalFetch;
  }

  // --- A. Scaffold module default policy. ---
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
  assertEqual(defaultPolicyResult.ok, false, 'Default-policy result ok');
  assertEqual(defaultPolicyResult.status, 'disabled', 'Default-policy result status');
  assertEqual(defaultPolicyResult.summary.routeSuccessAllowed, false, 'Default-policy summary.routeSuccessAllowed');
  assertEqual(defaultPolicyResult.summary.liveKisAllowed, false, 'Default-policy summary.liveKisAllowed');
  assertEqual(
    defaultPolicyResult.summary.providerStatus,
    'mocked_provider_not_invoked',
    'Default-policy summary.providerStatus',
  );

  // --- Route-recognized policy still grants no runtime capability. ---
  assertEqual(routeRecognizedPolicy.enabled, true, 'Route-recognized policy enabled');
  assertEqual(routeRecognizedPolicy.allowRouteBranchRecognition, true, 'Route-recognized allowRouteBranchRecognition');
  assertEqual(routeRecognizedPolicy.allowRouteSuccess, false, 'Route-recognized allowRouteSuccess');
  assertEqual(routeRecognizedPolicy.allowMockedProviderExecution, false, 'Route-recognized allowMockedProviderExecution');
  assertEqual(routeRecognizedPolicy.allowLiveKis, false, 'Route-recognized allowLiveKis');
  assertEqual(routeRecognizedPolicy.allowRealSupabase, false, 'Route-recognized allowRealSupabase');
  assertEqual(routeRecognizedPolicy.allowRealDb, false, 'Route-recognized allowRealDb');
  assertEqual(routeRecognizedPolicy.allowPublicExecution, false, 'Route-recognized allowPublicExecution');
  assertEqual(routeRecognizedPolicy.allowBetaExecution, false, 'Route-recognized allowBetaExecution');

  // --- B. Request discriminator exact match. ---
  assertTrue(
    mod.isGuardedRuntimeScaffoldSimilarityRequestBody(exactRequestBody),
    'Exact guarded request body must match the discriminator',
  );
  assertTrue(
    !mod.isGuardedRuntimeScaffoldSimilarityRequestBody(partialRequestBody),
    'Partial guarded request body must not match the discriminator',
  );
  assertTrue(
    !mod.isGuardedRuntimeScaffoldSimilarityRequestBody(malformedRequestBody),
    'Malformed guarded request body must not match the discriminator',
  );
  assertTrue(!mod.isGuardedRuntimeScaffoldSimilarityRequestBody(null), 'null body must not match the discriminator');
  assertTrue(
    !mod.isGuardedRuntimeScaffoldSimilarityRequestBody('not-an-object'),
    'Non-object body must not match the discriminator',
  );
  assertTrue(
    !mod.isGuardedRuntimeScaffoldSimilarityRequestBody({
      mode: 'owner-local-mocked',
      source: 'mocked-provider-compatible',
      ownerLocalMocked: true,
    }),
    'Owner-local-mocked body must not collide with the guarded-runtime-scaffold discriminator',
  );
  const normalizedExact = mod.normalizeSimilarityGuardedRouteScaffoldRequestBody(exactRequestBody);
  assertEqual(normalizedExact.mode, 'guarded-runtime-scaffold', 'Normalized exact request mode');
  assertEqual(normalizedExact.source, 'mocked-provider-compatible', 'Normalized exact request source');
  assertEqual(normalizedExact.guardedRuntimeScaffold, true, 'Normalized exact request guardedRuntimeScaffold');
  assertEqual(
    mod.normalizeSimilarityGuardedRouteScaffoldRequestBody(partialRequestBody),
    null,
    'Normalized partial request must be null',
  );
  assertEqual(
    mod.normalizeSimilarityGuardedRouteScaffoldRequestBody(malformedRequestBody),
    null,
    'Normalized malformed request must be null',
  );

  // --- C. Scaffold execution against an exact guarded request. ---
  assertTrue(
    routeRecognizedResult.status === 'disabled' || routeRecognizedResult.status === 'feature_flag_blocked',
    'Route-recognized result status must be disabled or feature_flag_blocked',
  );
  assertEqual(routeRecognizedResult.ok, false, 'Route-recognized result ok');
  assertEqual(routeRecognizedResult.summary.routeSuccessAllowed, false, 'Route-recognized summary.routeSuccessAllowed');
  assertEqual(routeRecognizedResult.summary.liveKisAllowed, false, 'Route-recognized summary.liveKisAllowed');
  assertEqual(
    routeRecognizedResult.summary.providerStatus,
    'mocked_provider_not_invoked',
    'Route-recognized summary.providerStatus',
  );
  assertEqual(
    routeRecognizedResult.summary.authSubjectStatus,
    'auth_not_evaluated',
    'Route-recognized summary.authSubjectStatus',
  );
  assertEqual(
    routeRecognizedResult.summary.roleAssignmentStatus,
    'role_not_evaluated',
    'Route-recognized summary.roleAssignmentStatus',
  );
  assertEqual(
    routeRecognizedResult.summary.usageSnapshotStatus,
    'usage_not_evaluated',
    'Route-recognized summary.usageSnapshotStatus',
  );
  assertEqual(
    routeRecognizedResult.summary.executionGuardStatus,
    'guard_not_evaluated',
    'Route-recognized summary.executionGuardStatus',
  );
  assertTrue(
    typeof routeRecognizedResult.safeMessage === 'string' && routeRecognizedResult.safeMessage.length > 0,
    'Route-recognized safeMessage present',
  );
  assertEqual(malformedResult.status, 'invalid_request', 'Malformed-body scaffold result status');
  assertEqual(malformedResult.ok, false, 'Malformed-body scaffold result ok');
  assertEqual(partialResult.status, 'invalid_request', 'Partial-body scaffold result status');
  assertEqual(partialResult.ok, false, 'Partial-body scaffold result ok');

  // --- D. Route behavior. ---
  const defaultRouteBody = await defaultRouteResponse.json();
  const ownerLocalMockedRouteBody = await ownerLocalMockedRouteResponse.json();
  const authUsageBridgeRouteBody = await authUsageBridgeRouteResponse.json();
  const guardedScaffoldRouteBody = await guardedScaffoldRouteResponse.json();
  const guardedScaffoldPartialRouteBody = await guardedScaffoldPartialRouteResponse.json();
  const guardedScaffoldMalformedRouteBody = await guardedScaffoldMalformedRouteResponse.json();
  const allHandlerBody = await allHandlerResponse.json();

  assertEqual(defaultRouteResponse.status, 503, 'Default POST httpStatus unchanged');
  assertEqual(defaultRouteBody.status, 'feature_disabled', 'Default POST response status unchanged');
  assertEqual(defaultRouteBody.mode, 'feature-flag-off', 'Default POST response mode unchanged');

  assertEqual(ownerLocalMockedRouteResponse.status, 200, 'Owner-local mocked POST still succeeds');
  assertEqual(ownerLocalMockedRouteBody.ok, true, 'Owner-local mocked POST response ok unchanged');
  assertEqual(ownerLocalMockedRouteBody.mode, 'owner-local-mocked', 'Owner-local mocked POST response mode unchanged');

  assertTrue(
    [200, 401, 422, 429, 503].includes(authUsageBridgeRouteResponse.status),
    'Auth/usage bridge POST still reaches its own branch',
  );
  assertTrue(
    typeof authUsageBridgeRouteBody.mode === 'string' && authUsageBridgeRouteBody.mode.length > 0,
    'Auth/usage bridge POST response mode present',
  );

  assertEqual(guardedScaffoldRouteResponse.status, 503, 'Guarded-scaffold POST httpStatus falls back to shell');
  assertEqual(guardedScaffoldRouteBody.status, 'feature_disabled', 'Guarded-scaffold POST response status falls back to shell');
  assertEqual(guardedScaffoldRouteBody.mode, 'feature-flag-off', 'Guarded-scaffold POST response mode falls back to shell');
  assertEqual(guardedScaffoldRouteBody.data, null, 'Guarded-scaffold POST response data falls back to shell');
  assertTrue(
    !('summary' in guardedScaffoldRouteBody) && !('safeMessage' in guardedScaffoldRouteBody),
    'Guarded-scaffold POST response must not expose scaffold-internal fields',
  );
  assertEqual(
    guardedScaffoldPartialRouteResponse.status,
    503,
    'Guarded-scaffold partial-body POST httpStatus falls back to shell',
  );
  assertEqual(
    guardedScaffoldPartialRouteBody.status,
    'feature_disabled',
    'Guarded-scaffold partial-body POST response status falls back to shell',
  );
  assertEqual(
    guardedScaffoldMalformedRouteResponse.status,
    503,
    'Guarded-scaffold malformed-body POST httpStatus falls back to shell',
  );
  assertEqual(
    guardedScaffoldMalformedRouteBody.status,
    'feature_disabled',
    'Guarded-scaffold malformed-body POST response status falls back to shell',
  );

  assertEqual(allHandlerBody.status, 'feature_disabled', 'ALL handler response status unchanged');
  assertEqual(allHandlerBody.mode, 'feature-flag-off', 'ALL handler response mode unchanged');

  assertNoForbiddenSubstrings(JSON.stringify(guardedScaffoldRouteBody), 'Guarded-scaffold POST response JSON');
  assertNoForbiddenSubstrings(JSON.stringify(defaultRouteBody), 'Default POST response JSON');

  // --- E. Runtime safety. ---
  assertTrue(!fetchCalled, 'fetch must never be called by the guarded route scaffold or the route');
  const bundledCode = stripComments(bundledSource);
  assertTrue(!/@supabase/.test(bundledCode), 'Bundled guarded route scaffold module must not import a Supabase package');
  assertTrue(!/createClient/.test(bundledCode), 'Bundled guarded route scaffold module must not reference createClient');
  assertTrue(
    !/process\.env(\.\w+|\[)/.test(bundledCode),
    'Bundled guarded route scaffold module must not access process.env',
  );
  assertTrue(
    !/import\.meta\.env(\.\w+|\[)/.test(bundledCode),
    'Bundled guarded route scaffold module must not access import.meta.env',
  );
  assertTrue(
    !/kisOhlcProvider|serverOnlyKisOhlcProvider|mockedKisOhlcAdapter/.test(bundledCode),
    'Bundled guarded route scaffold module must not import a KIS provider module',
  );
  assertTrue(
    !/document\.cookie|req\.headers|request\.headers/.test(bundledCode),
    'Bundled guarded route scaffold module must not read cookies/headers',
  );
  assertTrue(
    !/\bCREATE TABLE\b|\bINSERT INTO\b|\/migrations\//i.test(bundledCode),
    'Bundled guarded route scaffold module must not contain SQL or migration references',
  );

  const scaffoldSource = stripComments(
    readFileSync('src/lib/server/chartSimilarity/similarityGuardedRouteScaffold.ts', 'utf8'),
  );
  assertTrue(!/@supabase/.test(scaffoldSource), 'Scaffold source must not import a Supabase package');
  assertTrue(!/process\.env(\.\w+|\[)/.test(scaffoldSource), 'Scaffold source must not access process.env');
  assertTrue(
    !/import\.meta\.env(\.\w+|\[)/.test(scaffoldSource),
    'Scaffold source must not access import.meta.env',
  );
  assertTrue(!/\bfetch\(/.test(scaffoldSource), 'Scaffold source must not call fetch');
  assertTrue(
    !/runMockedProviderCompatibleSimilarityIntegration|runSimilarityProviderIntegrationWithBars/.test(scaffoldSource),
    'Scaffold source must not invoke the mocked provider-compatible integration or the engine',
  );

  const routeSource = stripComments(readFileSync('src/pages/api/chart-ai/similarity.ts', 'utf8'));
  assertTrue(!/@supabase/.test(routeSource), 'Route source must not import a Supabase package');
  assertTrue(!/process\.env(\.\w+|\[)/.test(routeSource), 'Route source must not access process.env');
  assertTrue(!/import\.meta\.env(\.\w+|\[)/.test(routeSource), 'Route source must not access import.meta.env');
  assertTrue(!/document\.cookie|request\.headers/.test(routeSource), 'Route source must not read cookies/headers');

  if (failures.length > 0) {
    process.stdout.write(`Phase 3FC-H smoke: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
    for (const failure of failures) {
      process.stdout.write(`  - ${failure}\n`);
    }
    return 1;
  }

  process.stdout.write(`Phase 3FC-H smoke: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  return 0;
};

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    process.stdout.write('Phase 3FC-H smoke: FAIL\n');
    process.stdout.write(`reason: ${error && error.message ? error.message : 'smoke script error'}\n`);
    process.exitCode = 1;
  });
