/**
 * Provider-compatible OHLC to similarity engine integration smoke (Phase 3FB-A).
 *
 * Exercises `similarityProviderIntegration.ts` and its mocked fixtures entirely with mocked,
 * provider-compatible `OhlcBar[]` data. Never calls live KIS, never calls an API route, never
 * reads `process.env`/`.env` KIS credentials, and never prints a raw provider payload, an actual
 * KIS market value, a credential, a token, or an environment value. This is a focused smoke (a
 * bounded assertion list), not a full historical checker suite.
 *
 * Run:
 *   npm run smoke:phase-3fb-a-provider-compatible-ohlc-to-similarity-engine-integration
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
];

const assertNoForbiddenSubstrings = (serialized, label) => {
  const found = FORBIDDEN_SUBSTRINGS.filter((needle) => serialized.includes(needle));
  assertTrue(found.length === 0, `${label} must not contain any forbidden substring (found: ${found.join(', ')})`);
};

const loadIntegrationModule = async () => {
  const entryContents = [
    "export {",
    "  buildDefaultSimilarityProviderIntegrationPolicy,",
    "  buildOwnerLocalMockedSimilarityProviderIntegrationPolicy,",
    "  normalizeSimilarityProviderIntegrationRequest,",
    "  bucketProviderNormalizedBarCount,",
    "  bucketSimilarityMatchCount,",
    "  runSimilarityProviderIntegrationWithBars,",
    "  runMockedProviderCompatibleSimilarityIntegration,",
    "} from './src/lib/server/chartSimilarity/similarityProviderIntegration.ts';",
    "export {",
    "  buildMockedProviderIntegrationRequest,",
    "  buildMockedProviderIntegrationPolicy,",
    "  buildMockedProviderCompatibleIntegrationReadyResult,",
    "  buildMockedProviderCompatibleIntegrationBlockedResult,",
    "} from './src/lib/server/chartSimilarity/mockedSimilarityProviderIntegrationFixtures.ts';",
  ].join('\n');

  const bundle = await build({
    stdin: {
      contents: entryContents,
      resolveDir: root,
      sourcefile: 'provider-integration-smoke-entry.ts',
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

const main = async () => {
  const mod = await loadIntegrationModule();

  // Guard against any accidental network call: fetch must never be invoked by this integration.
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error('fetch must never be called by the provider-compatible similarity integration.');
  };

  let readyResult;
  let blockedResult;
  let disabledResult;
  let liveKisNotAllowedResult;

  try {
    readyResult = mod.buildMockedProviderCompatibleIntegrationReadyResult();
    blockedResult = mod.buildMockedProviderCompatibleIntegrationBlockedResult();

    const defaultPolicy = mod.buildDefaultSimilarityProviderIntegrationPolicy();
    const disabledRequest = mod.normalizeSimilarityProviderIntegrationRequest();
    disabledResult = mod.runSimilarityProviderIntegrationWithBars(disabledRequest, [], defaultPolicy);

    const ownerLocalPolicy = mod.buildOwnerLocalMockedSimilarityProviderIntegrationPolicy();
    const liveKisRequest = mod.normalizeSimilarityProviderIntegrationRequest({ source: 'kis-normalized-future' });
    liveKisNotAllowedResult = mod.runSimilarityProviderIntegrationWithBars(liveKisRequest, [], ownerLocalPolicy);
  } finally {
    globalThis.fetch = originalFetch;
  }

  const readySerialized = JSON.stringify(readyResult, null, 2);
  const blockedSerialized = JSON.stringify(blockedResult, null, 2);
  const disabledSerialized = JSON.stringify(disabledResult, null, 2);

  // Ready-path assertions (mocked, provider-compatible, engine actually invoked).
  assertEqual(readyResult.status, 'ready', 'Ready result status');
  assertEqual(readyResult.mode, 'owner-local-mocked', 'Ready result mode');
  assertEqual(readyResult.source, 'mocked-provider-compatible', 'Ready result source');
  assertEqual(readyResult.providerStatus, 'ready', 'Ready result providerStatus');
  assertEqual(readyResult.engineStatus, 'ready', 'Ready result engineStatus');
  assertEqual(readyResult.normalizedBarsAvailable, true, 'Ready result normalizedBarsAvailable');
  assertTrue(readyResult.normalizedBarCountBucket !== 'none', 'Ready result normalizedBarCountBucket must not be none');
  assertTrue(readyResult.matchCountBucket !== 'none', 'Ready result matchCountBucket must not be none');
  assertEqual(readyResult.dataPolicy.allowLiveKis, false, 'Ready result dataPolicy.allowLiveKis');
  assertEqual(readyResult.dataPolicy.allowRouteSuccess, false, 'Ready result dataPolicy.allowRouteSuccess');
  assertEqual(readyResult.dataPolicy.allowPublicExecution, false, 'Ready result dataPolicy.allowPublicExecution');
  assertEqual(readyResult.dataPolicy.ownerLocalOnly, true, 'Ready result dataPolicy.ownerLocalOnly');
  assertTrue(!!readyResult.result, 'Ready result must include a mocked engine result payload');
  assertTrue(Array.isArray(readyResult.result?.matches) && readyResult.result.matches.length > 0, 'Ready result.result.matches must be non-empty');
  assertNoForbiddenSubstrings(readySerialized, 'Ready result JSON');

  // Blocked-path assertions (deliberately insufficient bars).
  assertEqual(blockedResult.status, 'blocked', 'Blocked result status');
  assertEqual(blockedResult.engineStatus, 'not_run', 'Blocked result engineStatus');
  assertEqual(blockedResult.matchCountBucket, 'none', 'Blocked result matchCountBucket');
  assertNoForbiddenSubstrings(blockedSerialized, 'Blocked result JSON');

  // Disabled-policy assertions (feature-flag-off default policy).
  assertEqual(disabledResult.status, 'disabled', 'Disabled result status');
  assertEqual(disabledResult.mode, 'feature-flag-off', 'Disabled result mode');
  assertEqual(disabledResult.engineStatus, 'not_run', 'Disabled result engineStatus');
  assertNoForbiddenSubstrings(disabledSerialized, 'Disabled result JSON');

  // kis-normalized-future source must remain blocked even under an enabled owner-local policy.
  assertEqual(liveKisNotAllowedResult.status, 'blocked', 'kis-normalized-future result status');
  assertEqual(liveKisNotAllowedResult.engineStatus, 'not_run', 'kis-normalized-future result engineStatus');
  assertEqual(liveKisNotAllowedResult.providerStatus, 'blocked', 'kis-normalized-future result providerStatus');

  // Pure bucket helper assertions.
  assertEqual(mod.bucketProviderNormalizedBarCount(0), 'none', 'bucketProviderNormalizedBarCount(0)');
  assertEqual(mod.bucketProviderNormalizedBarCount(150), 'over_one_hundred', 'bucketProviderNormalizedBarCount(150)');
  assertEqual(mod.bucketSimilarityMatchCount(0), 'none', 'bucketSimilarityMatchCount(0)');
  assertEqual(mod.bucketSimilarityMatchCount(30), 'over_twenty', 'bucketSimilarityMatchCount(30)');

  // Request normalization assertions.
  const defaultedRequest = mod.normalizeSimilarityProviderIntegrationRequest();
  assertTrue(typeof defaultedRequest.symbol === 'string' && defaultedRequest.symbol.length > 0, 'Defaulted request symbol is a non-empty string');
  assertEqual(defaultedRequest.market, 'KR', 'Defaulted request market');
  const clampedRequest = mod.normalizeSimilarityProviderIntegrationRequest({ baseWindow: 999999 });
  assertTrue(clampedRequest.baseWindow <= 250, 'Clamped request baseWindow must be clamped to at most 250');

  // Fixture helper assertions.
  const fixtureRequest = mod.buildMockedProviderIntegrationRequest();
  assertEqual(fixtureRequest.source, 'mocked-provider-compatible', 'Fixture request source');
  const fixturePolicy = mod.buildMockedProviderIntegrationPolicy();
  assertEqual(fixturePolicy.enabled, true, 'Fixture policy enabled');

  if (failures.length > 0) {
    process.stdout.write(`Phase 3FB-A smoke: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
    for (const failure of failures) {
      process.stdout.write(`  - ${failure}\n`);
    }
    return 1;
  }

  process.stdout.write(`Phase 3FB-A smoke: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  return 0;
};

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    process.stdout.write('Phase 3FB-A smoke: FAIL\n');
    process.stdout.write(`reason: ${error && error.message ? error.message : 'smoke script error'}\n`);
    process.exitCode = 1;
  });
