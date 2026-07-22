/**
 * Auth/usage runtime bridge for similarity route smoke (Phase 3FB-C-ALT).
 *
 * Exercises the real Astro API route handlers (`POST`, `ALL`) exported from
 * `src/pages/api/chart-ai/similarity.ts` directly, without starting a dev server, using
 * constructed `Request` objects. Confirms: (1) default behavior and the existing Phase 3FB-B
 * owner-local-mocked path remain unchanged; (2) an explicit owner-local auth/usage bridge request
 * with an owner/admin role and safe usage evaluates the existing
 * `evaluateSimilarityExecutionGuard` and, when allowed, reaches the Phase 3FB-A mocked
 * provider-compatible integration and returns a sanitized, bucketed success response; (3)
 * anonymous auth is blocked with `auth_required`; (4) usage-at-limit is blocked with
 * `usage_limited`; (5) an internally inconsistent usage snapshot is rejected as invalid before the
 * guard ever runs; (6) no live KIS call, no network call, no raw provider payload, and no
 * credential/env/token/account/trading/balance value ever appears. This is a focused smoke (a
 * bounded assertion list), not a full historical checker suite.
 *
 * Run:
 *   npm run smoke:phase-3fb-c-alt-auth-usage-runtime-bridge-for-similarity-route
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
  'appSecret',
  'appKey',
  'account',
  'trading',
  'balance',
  'credential',
  'token',
  'NaN',
  'Infinity',
  '"source":"live"',
  '"source":"auto"',
];

const assertNoForbiddenSubstrings = (serialized, label) => {
  const found = FORBIDDEN_SUBSTRINGS.filter((needle) => serialized.includes(needle));
  assertTrue(found.length === 0, `${label} must not contain any forbidden substring (found: ${found.join(', ')})`);
};

const loadRouteModule = async () => {
  const entryContents = [
    "export { POST, ALL } from './src/pages/api/chart-ai/similarity.ts';",
    "export {",
    '  buildMockedOwnerAuthUsageBridgeAllowedRequestBody,',
    '  buildMockedAnonymousAuthUsageBridgeBlockedRequestBody,',
    '  buildMockedUsageLimitedAuthUsageBridgeRequestBody,',
    '  buildMockedInvalidAuthUsageBridgeRequestBody,',
    "} from './src/lib/server/chartSimilarity/mockedSimilarityAuthUsageRouteBridgeFixtures.ts';",
  ].join('\n');

  const bundle = await build({
    stdin: {
      contents: entryContents,
      resolveDir: root,
      sourcefile: 'auth-usage-bridge-similarity-route-smoke-entry.ts',
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
  const mod = await loadRouteModule();

  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = () => {
    fetchCalled = true;
    throw new Error('fetch must never be called by the owner-local auth/usage bridge similarity route path.');
  };

  let defaultResponse;
  let allHandlerResponse;
  let ownerLocalMockedResponse;
  let allowedResponse;
  let anonymousResponse;
  let usageLimitedResponse;
  let invalidResponse;

  try {
    defaultResponse = await mod.POST({ request: buildJsonRequest({}) });
    allHandlerResponse = mod.ALL();

    ownerLocalMockedResponse = await mod.POST({
      request: buildJsonRequest({
        mode: 'owner-local-mocked',
        source: 'mocked-provider-compatible',
        ownerLocalMocked: true,
        symbol: 'MOCKSYM',
      }),
    });

    allowedResponse = await mod.POST({ request: buildJsonRequest(mod.buildMockedOwnerAuthUsageBridgeAllowedRequestBody()) });
    anonymousResponse = await mod.POST({
      request: buildJsonRequest(mod.buildMockedAnonymousAuthUsageBridgeBlockedRequestBody()),
    });
    usageLimitedResponse = await mod.POST({
      request: buildJsonRequest(mod.buildMockedUsageLimitedAuthUsageBridgeRequestBody()),
    });
    invalidResponse = await mod.POST({ request: buildJsonRequest(mod.buildMockedInvalidAuthUsageBridgeRequestBody()) });
  } finally {
    globalThis.fetch = originalFetch;
  }

  const defaultBody = await defaultResponse.json();
  const allHandlerBody = await allHandlerResponse.json();
  const ownerLocalMockedBody = await ownerLocalMockedResponse.json();
  const allowedBody = await allowedResponse.json();
  const anonymousBody = await anonymousResponse.json();
  const usageLimitedBody = await usageLimitedResponse.json();
  const invalidBody = await invalidResponse.json();

  const allowedSerialized = JSON.stringify(allowedBody, null, 2);
  const anonymousSerialized = JSON.stringify(anonymousBody, null, 2);
  const usageLimitedSerialized = JSON.stringify(usageLimitedBody, null, 2);
  const invalidSerialized = JSON.stringify(invalidBody, null, 2);
  const defaultSerialized = JSON.stringify(defaultBody, null, 2);

  // --- A. Default behavior remains unchanged. ---
  assertEqual(defaultResponse.status, 503, 'Default POST httpStatus');
  assertEqual(defaultBody.status, 'feature_disabled', 'Default POST response status');
  assertEqual(defaultBody.mode, 'feature-flag-off', 'Default POST response mode');
  assertEqual(allHandlerBody.status, 'feature_disabled', 'ALL handler response status');
  assertEqual(allHandlerBody.mode, 'feature-flag-off', 'ALL handler response mode');
  assertEqual(ownerLocalMockedResponse.status, 200, 'Existing owner-local-mocked POST httpStatus (regression)');
  assertEqual(ownerLocalMockedBody.mode, 'owner-local-mocked', 'Existing owner-local-mocked POST response mode (regression)');
  assertEqual(ownerLocalMockedBody.ok, true, 'Existing owner-local-mocked POST response ok (regression)');

  // --- B. Auth/usage bridge allowed (owner role, safe usage). ---
  assertEqual(allowedResponse.status, 200, 'Allowed bridge POST httpStatus');
  assertEqual(allowedBody.ok, true, 'Allowed bridge POST response ok');
  assertEqual(allowedBody.status, 'success', 'Allowed bridge POST response status');
  assertEqual(allowedBody.mode, 'owner-local-auth-usage-bridge', 'Allowed bridge POST response mode');
  assertEqual(allowedBody.request.source, 'mocked-provider-compatible', 'Allowed bridge POST request.source');
  assertEqual(allowedBody.usage, null, 'Allowed bridge POST response usage');
  assertEqual(allowedBody.error, null, 'Allowed bridge POST response error');
  assertEqual(allowedBody.data.guardStatus, 'allowed', 'Allowed bridge POST data.guardStatus');
  assertEqual(allowedBody.data.authState, 'authenticated', 'Allowed bridge POST data.authState');
  assertEqual(allowedBody.data.role, 'owner', 'Allowed bridge POST data.role');
  assertEqual(allowedBody.data.usageWindow, 'daily', 'Allowed bridge POST data.usageWindow');
  assertTrue(
    ['none', 'low', 'available', 'unknown'].includes(allowedBody.data.usageRemainingBucket),
    'Allowed bridge POST data.usageRemainingBucket must be a known bucket',
  );
  assertEqual(allowedBody.data.engineStatus, 'ready', 'Allowed bridge POST data.engineStatus');
  assertEqual(allowedBody.data.normalizedBarsAvailable, true, 'Allowed bridge POST data.normalizedBarsAvailable');
  assertTrue(
    allowedBody.data.normalizedBarCountBucket !== 'none',
    'Allowed bridge POST data.normalizedBarCountBucket must not be none',
  );
  assertTrue(allowedBody.data.matchCountBucket !== 'none', 'Allowed bridge POST data.matchCountBucket must not be none');
  assertTrue(
    typeof allowedBody.data.disclaimer === 'string' && allowedBody.data.disclaimer.length > 0,
    'Allowed bridge POST data.disclaimer present',
  );
  assertEqual(allowedBody.data.dataPolicy.ownerLocalOnly, true, 'Allowed bridge POST data.dataPolicy.ownerLocalOnly');
  assertEqual(allowedBody.data.dataPolicy.allowLiveKis, false, 'Allowed bridge POST data.dataPolicy.allowLiveKis');
  assertEqual(
    allowedBody.data.dataPolicy.allowPublicExecution,
    false,
    'Allowed bridge POST data.dataPolicy.allowPublicExecution',
  );
  assertTrue(!('matches' in allowedBody.data), 'Allowed bridge POST data must not include a raw matches array');
  assertTrue(!('scores' in allowedBody.data), 'Allowed bridge POST data must not include raw scores');
  assertTrue(!('returns' in allowedBody.data), 'Allowed bridge POST data must not include raw returns');
  assertTrue(!('ohlc' in allowedBody.data), 'Allowed bridge POST data must not include raw OHLC');
  assertTrue(!('volume' in allowedBody.data), 'Allowed bridge POST data must not include raw volume');
  assertTrue(!('timestamps' in allowedBody.data), 'Allowed bridge POST data must not include raw timestamps');
  assertEqual(
    allowedResponse.headers.get('cache-control'),
    'no-store',
    'Allowed bridge POST Cache-Control header',
  );
  assertTrue(
    (allowedResponse.headers.get('content-type') || '').includes('application/json'),
    'Allowed bridge POST Content-Type header',
  );
  assertNoForbiddenSubstrings(allowedSerialized, 'Allowed bridge POST response JSON');

  // --- C. Auth required / blocked (anonymous). ---
  assertEqual(anonymousBody.ok, false, 'Anonymous bridge POST response ok');
  assertEqual(anonymousBody.mode, 'owner-local-auth-usage-bridge', 'Anonymous bridge POST response mode');
  assertEqual(anonymousBody.status, 'auth_required', 'Anonymous bridge POST response status');
  assertEqual(anonymousResponse.status, 401, 'Anonymous bridge POST httpStatus');
  assertEqual(anonymousBody.data, null, 'Anonymous bridge POST response data');
  assertTrue(
    typeof anonymousBody.error?.message === 'string' && anonymousBody.error.message.length > 0,
    'Anonymous bridge POST error.message present',
  );
  assertNoForbiddenSubstrings(anonymousSerialized, 'Anonymous bridge POST response JSON');

  // --- D. Usage limited. ---
  assertEqual(usageLimitedBody.ok, false, 'Usage-limited bridge POST response ok');
  assertEqual(usageLimitedBody.mode, 'owner-local-auth-usage-bridge', 'Usage-limited bridge POST response mode');
  assertEqual(usageLimitedBody.status, 'usage_limited', 'Usage-limited bridge POST response status');
  assertEqual(usageLimitedResponse.status, 429, 'Usage-limited bridge POST httpStatus');
  assertEqual(usageLimitedBody.data, null, 'Usage-limited bridge POST response data');
  assertNoForbiddenSubstrings(usageLimitedSerialized, 'Usage-limited bridge POST response JSON');

  // --- E. Invalid request (used > limit). ---
  assertEqual(invalidBody.ok, false, 'Invalid bridge POST response ok');
  assertEqual(invalidBody.mode, 'owner-local-auth-usage-bridge', 'Invalid bridge POST response mode');
  assertTrue(
    invalidBody.status === 'blocked' || invalidBody.status === 'error',
    'Invalid bridge POST response status must be blocked or error',
  );
  assertEqual(invalidResponse.status, 422, 'Invalid bridge POST httpStatus');
  assertEqual(invalidBody.data, null, 'Invalid bridge POST response data');
  assertTrue(
    typeof invalidBody.error?.message === 'string' && invalidBody.error.message.length > 0,
    'Invalid bridge POST error.message present',
  );
  assertNoForbiddenSubstrings(invalidSerialized, 'Invalid bridge POST response JSON');

  // --- F. Network safety: fetch must never be called by any bridge path. ---
  assertTrue(!fetchCalled, 'fetch must never be called by the owner-local auth/usage bridge route path');
  assertNoForbiddenSubstrings(defaultSerialized, 'Default POST response JSON');

  if (failures.length > 0) {
    process.stdout.write(`Phase 3FB-C-ALT smoke: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
    for (const failure of failures) {
      process.stdout.write(`  - ${failure}\n`);
    }
    return 1;
  }

  process.stdout.write(`Phase 3FB-C-ALT smoke: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  return 0;
};

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    process.stdout.write('Phase 3FB-C-ALT smoke: FAIL\n');
    process.stdout.write(`reason: ${error && error.message ? error.message : 'smoke script error'}\n`);
    process.exitCode = 1;
  });
