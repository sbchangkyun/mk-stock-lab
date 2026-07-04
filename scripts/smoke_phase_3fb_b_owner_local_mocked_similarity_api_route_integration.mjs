/**
 * Owner-local mocked similarity API route integration smoke (Phase 3FB-B).
 *
 * Exercises the real Astro API route handlers (`POST`, `ALL`) exported from
 * `src/pages/api/chart-ai/similarity.ts` directly, without starting a dev server, using
 * constructed `Request` objects. Confirms: (1) default/non-owner-local-mocked requests remain
 * feature-disabled exactly as before; (2) an explicit owner-local mocked request reaches the
 * Phase 3FB-A provider-compatible mocked similarity integration and returns a sanitized, bucketed
 * success response; (3) no live KIS call, no network call, no raw provider payload, and no
 * credential/env value ever appears. This is a focused smoke (a bounded assertion list), not a
 * full historical checker suite.
 *
 * Run:
 *   npm run smoke:phase-3fb-b-owner-local-mocked-similarity-api-route-integration
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
  const entryContents = "export { POST, ALL } from './src/pages/api/chart-ai/similarity.ts';";

  const bundle = await build({
    stdin: {
      contents: entryContents,
      resolveDir: root,
      sourcefile: 'owner-local-mocked-similarity-route-smoke-entry.ts',
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

const buildRawBodyRequest = (rawBody) =>
  new Request('http://localhost/api/chart-ai/similarity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: rawBody,
  });

const main = async () => {
  const mod = await loadRouteModule();

  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = () => {
    fetchCalled = true;
    throw new Error('fetch must never be called by the owner-local mocked similarity route path.');
  };

  let defaultResponse;
  let ownerLocalMockedResponse;
  let malformedResponse;
  let partialApprovalResponse;
  let wrongSourceResponse;
  let allHandlerResponse;

  try {
    defaultResponse = await mod.POST({ request: buildJsonRequest({}) });

    ownerLocalMockedResponse = await mod.POST({
      request: buildJsonRequest({
        mode: 'owner-local-mocked',
        source: 'mocked-provider-compatible',
        ownerLocalMocked: true,
        symbol: 'MOCKSYM',
      }),
    });

    malformedResponse = await mod.POST({ request: buildRawBodyRequest('{not valid json') });

    partialApprovalResponse = await mod.POST({
      request: buildJsonRequest({
        mode: 'owner-local-mocked',
        source: 'mocked-provider-compatible',
        ownerLocalMocked: false,
      }),
    });

    wrongSourceResponse = await mod.POST({
      request: buildJsonRequest({
        mode: 'owner-local-mocked',
        source: 'mocked',
        ownerLocalMocked: true,
      }),
    });

    allHandlerResponse = mod.ALL();
  } finally {
    globalThis.fetch = originalFetch;
  }

  const defaultBody = await defaultResponse.json();
  const ownerLocalMockedBody = await ownerLocalMockedResponse.json();
  const malformedBody = await malformedResponse.json();
  const partialApprovalBody = await partialApprovalResponse.json();
  const wrongSourceBody = await wrongSourceResponse.json();
  const allHandlerBody = await allHandlerResponse.json();

  const ownerLocalMockedSerialized = JSON.stringify(ownerLocalMockedBody, null, 2);
  const defaultSerialized = JSON.stringify(defaultBody, null, 2);

  // Default route (no owner-local-mocked approval): unchanged feature-disabled contract.
  assertEqual(defaultResponse.status, 503, 'Default POST httpStatus');
  assertEqual(defaultBody.status, 'feature_disabled', 'Default POST response status');
  assertEqual(defaultBody.mode, 'feature-flag-off', 'Default POST response mode');
  assertEqual(defaultBody.data, null, 'Default POST response data');
  assertEqual(defaultResponse.headers.get('cache-control'), 'no-store', 'Default POST Cache-Control header');
  assertTrue(
    (defaultResponse.headers.get('content-type') || '').includes('application/json'),
    'Default POST Content-Type header',
  );

  // Owner-local mocked route (explicit approval): reaches the Phase 3FB-A integration.
  assertEqual(ownerLocalMockedResponse.status, 200, 'Owner-local mocked POST httpStatus');
  assertEqual(ownerLocalMockedBody.ok, true, 'Owner-local mocked POST response ok');
  assertEqual(ownerLocalMockedBody.status, 'success', 'Owner-local mocked POST response status');
  assertEqual(ownerLocalMockedBody.mode, 'owner-local-mocked', 'Owner-local mocked POST response mode');
  assertEqual(
    ownerLocalMockedBody.request.source,
    'mocked-provider-compatible',
    'Owner-local mocked POST request.source',
  );
  assertEqual(
    ownerLocalMockedBody.data.normalizedBarsAvailable,
    true,
    'Owner-local mocked POST data.normalizedBarsAvailable',
  );
  assertTrue(
    ownerLocalMockedBody.data.normalizedBarCountBucket !== 'none',
    'Owner-local mocked POST data.normalizedBarCountBucket must not be none',
  );
  assertTrue(
    ownerLocalMockedBody.data.matchCountBucket !== 'none',
    'Owner-local mocked POST data.matchCountBucket must not be none',
  );
  assertEqual(ownerLocalMockedBody.data.engineStatus, 'ready', 'Owner-local mocked POST data.engineStatus');
  assertTrue(
    typeof ownerLocalMockedBody.data.disclaimer === 'string' && ownerLocalMockedBody.data.disclaimer.length > 0,
    'Owner-local mocked POST data.disclaimer present',
  );
  assertEqual(
    ownerLocalMockedBody.data.dataPolicy.ownerLocalOnly,
    true,
    'Owner-local mocked POST data.dataPolicy.ownerLocalOnly',
  );
  assertEqual(
    ownerLocalMockedBody.data.dataPolicy.allowLiveKis,
    false,
    'Owner-local mocked POST data.dataPolicy.allowLiveKis',
  );
  assertEqual(
    ownerLocalMockedBody.data.dataPolicy.allowRouteSuccess,
    false,
    'Owner-local mocked POST data.dataPolicy.allowRouteSuccess',
  );
  assertEqual(
    ownerLocalMockedBody.data.dataPolicy.allowPublicExecution,
    false,
    'Owner-local mocked POST data.dataPolicy.allowPublicExecution',
  );
  assertEqual(ownerLocalMockedBody.usage, null, 'Owner-local mocked POST response usage');
  assertEqual(ownerLocalMockedBody.error, null, 'Owner-local mocked POST response error');
  assertTrue(
    !('matches' in ownerLocalMockedBody.data),
    'Owner-local mocked POST data must not include a raw matches array',
  );
  assertEqual(
    ownerLocalMockedResponse.headers.get('cache-control'),
    'no-store',
    'Owner-local mocked POST Cache-Control header',
  );
  assertTrue(
    (ownerLocalMockedResponse.headers.get('content-type') || '').includes('application/json'),
    'Owner-local mocked POST Content-Type header',
  );
  assertNoForbiddenSubstrings(ownerLocalMockedSerialized, 'Owner-local mocked POST response JSON');
  assertNoForbiddenSubstrings(defaultSerialized, 'Default POST response JSON');

  // Malformed JSON must never throw and must fall back to the safe default contract.
  assertEqual(malformedResponse.status, 503, 'Malformed JSON POST httpStatus');
  assertEqual(malformedBody.status, 'feature_disabled', 'Malformed JSON POST response status');

  // Partial/incomplete owner-local-mocked approval must not trigger the integration path.
  assertEqual(partialApprovalResponse.status, 503, 'Partial-approval POST httpStatus');
  assertEqual(partialApprovalBody.status, 'feature_disabled', 'Partial-approval POST response status');
  assertEqual(wrongSourceResponse.status, 503, 'Wrong-source POST httpStatus');
  assertEqual(wrongSourceBody.status, 'feature_disabled', 'Wrong-source POST response status');

  // Non-POST / catch-all handler remains feature-disabled.
  assertEqual(allHandlerBody.status, 'feature_disabled', 'ALL handler response status');
  assertEqual(allHandlerBody.mode, 'feature-flag-off', 'ALL handler response mode');

  // No network call was attempted anywhere in this path.
  assertTrue(!fetchCalled, 'fetch must never be called by this route');

  if (failures.length > 0) {
    process.stdout.write(`Phase 3FB-B smoke: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
    for (const failure of failures) {
      process.stdout.write(`  - ${failure}\n`);
    }
    return 1;
  }

  process.stdout.write(`Phase 3FB-B smoke: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  return 0;
};

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    process.stdout.write('Phase 3FB-B smoke: FAIL\n');
    process.stdout.write(`reason: ${error && error.message ? error.message : 'smoke script error'}\n`);
    process.exitCode = 1;
  });
