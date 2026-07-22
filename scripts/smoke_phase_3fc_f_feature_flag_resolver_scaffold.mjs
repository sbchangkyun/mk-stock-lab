/**
 * Feature flag resolver scaffold smoke (Phase 3FC-F).
 *
 * Exercises the actual feature flag resolver module (`similarityFeatureFlagResolver.ts`) and its
 * fixtures through normal TypeScript bundling, without a dev server, without a real Supabase
 * client, without reading `process.env` or `import.meta.env`, and without any network call.
 * Confirms: (1) the default, disabled-by-default policy always resolves to `disabled` with all
 * five flags false and every runtime-capability gate false; (2) a mocked scaffold policy
 * correctly resolves an all-flags-off state, an auth-only state, an auth+usage+beta-ready state,
 * a beta-missing-auth state, a beta-missing-usage state, a public-requested state, and a
 * live-KIS-requested state; (3) a duplicate active flag record for the same key is ignored and
 * keeps the default false state; (4) `clientClaimedFlags` is always ignored and only produces a
 * safe warning; (5) `routeSuccessAllowed`, `betaExecutionAllowed`, `publicExecutionAllowed`, and
 * `liveKisAllowed` are always false regardless of dependency satisfaction; (6) the capability
 * helper behaves correctly; (7) the module never calls `fetch`, never imports a Supabase package,
 * a KIS provider module, or an API route module, and never accesses `process.env` or
 * `import.meta.env`. This is a focused smoke (a bounded assertion list), not a full historical
 * checker suite.
 *
 * Run:
 *   npm run smoke:phase-3fc-f-feature-flag-resolver-scaffold
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

const loadFeatureFlagResolverModule = async () => {
  const entryContents = [
    "export {",
    '  buildDefaultSimilarityFeatureFlagResolverPolicy,',
    '  buildMockedSimilarityFeatureFlagResolverPolicy,',
    '  buildDefaultSimilarityFeatureFlagStates,',
    '  normalizeSimilarityFeatureFlagResolverInput,',
    '  resolveSimilarityFeatureFlags,',
    '  isSimilarityFeatureCapabilityAllowed,',
    '  assertSimilarityFeatureFlagResolverResultIsSafe,',
    "} from './src/lib/server/chartSimilarity/similarityFeatureFlagResolver.ts';",
    "export {",
    '  buildMockedAllFlagsOffFeatureFlagResolverInput,',
    '  buildMockedAuthOnlyFeatureFlagResolverInput,',
    '  buildMockedAuthUsageBetaReadyFeatureFlagResolverInput,',
    '  buildMockedBetaMissingAuthFeatureFlagResolverInput,',
    '  buildMockedBetaMissingUsageFeatureFlagResolverInput,',
    '  buildMockedPublicRequestedFeatureFlagResolverInput,',
    '  buildMockedLiveKisRequestedFeatureFlagResolverInput,',
    '  buildMockedDuplicateFlagIgnoredFeatureFlagResolverInput,',
    '  buildMockedClientClaimedFlagsIgnoredFeatureFlagResolverInput,',
    "} from './src/lib/server/chartSimilarity/mockedSimilarityFeatureFlagResolverFixtures.ts';",
  ].join('\n');

  const bundle = await build({
    stdin: {
      contents: entryContents,
      resolveDir: root,
      sourcefile: 'feature-flag-resolver-scaffold-smoke-entry.ts',
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
  const { mod, bundledSource } = await loadFeatureFlagResolverModule();

  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = () => {
    fetchCalled = true;
    throw new Error('fetch must never be called by the feature flag resolver scaffold.');
  };

  let defaultResult;
  let allFlagsOffResult;
  let authOnlyResult;
  let authUsageBetaReadyResult;
  let betaMissingAuthResult;
  let betaMissingUsageResult;
  let publicRequestedResult;
  let liveKisRequestedResult;
  let duplicateIgnoredResult;
  let clientClaimIgnoredResult;

  try {
    const defaultPolicy = mod.buildDefaultSimilarityFeatureFlagResolverPolicy();
    const mockedPolicy = mod.buildMockedSimilarityFeatureFlagResolverPolicy();

    // --- A. Default disabled policy. ---
    defaultResult = mod.resolveSimilarityFeatureFlags(mod.buildMockedAuthUsageBetaReadyFeatureFlagResolverInput(), defaultPolicy);

    // --- B. All flags off. ---
    allFlagsOffResult = mod.resolveSimilarityFeatureFlags(mod.buildMockedAllFlagsOffFeatureFlagResolverInput(), mockedPolicy);

    // --- C. Auth only. ---
    authOnlyResult = mod.resolveSimilarityFeatureFlags(mod.buildMockedAuthOnlyFeatureFlagResolverInput(), mockedPolicy);

    // --- D. Auth + usage + beta ready. ---
    authUsageBetaReadyResult = mod.resolveSimilarityFeatureFlags(
      mod.buildMockedAuthUsageBetaReadyFeatureFlagResolverInput(),
      mockedPolicy,
    );

    // --- E. Beta missing auth. ---
    betaMissingAuthResult = mod.resolveSimilarityFeatureFlags(mod.buildMockedBetaMissingAuthFeatureFlagResolverInput(), mockedPolicy);

    // --- F. Beta missing usage. ---
    betaMissingUsageResult = mod.resolveSimilarityFeatureFlags(mod.buildMockedBetaMissingUsageFeatureFlagResolverInput(), mockedPolicy);

    // --- G. Public requested. ---
    publicRequestedResult = mod.resolveSimilarityFeatureFlags(mod.buildMockedPublicRequestedFeatureFlagResolverInput(), mockedPolicy);

    // --- H. Live KIS requested. ---
    liveKisRequestedResult = mod.resolveSimilarityFeatureFlags(
      mod.buildMockedLiveKisRequestedFeatureFlagResolverInput(),
      mockedPolicy,
    );

    // --- I. Duplicate flag ignored. ---
    duplicateIgnoredResult = mod.resolveSimilarityFeatureFlags(
      mod.buildMockedDuplicateFlagIgnoredFeatureFlagResolverInput(),
      mockedPolicy,
    );

    // --- J. Client-claimed flags ignored. ---
    clientClaimIgnoredResult = mod.resolveSimilarityFeatureFlags(
      mod.buildMockedClientClaimedFlagsIgnoredFeatureFlagResolverInput(),
      mockedPolicy,
    );

    // Safety assertions must not throw for any of the above safe results.
    mod.assertSimilarityFeatureFlagResolverResultIsSafe(defaultResult);
    mod.assertSimilarityFeatureFlagResolverResultIsSafe(allFlagsOffResult);
    mod.assertSimilarityFeatureFlagResolverResultIsSafe(authOnlyResult);
    mod.assertSimilarityFeatureFlagResolverResultIsSafe(authUsageBetaReadyResult);
    mod.assertSimilarityFeatureFlagResolverResultIsSafe(betaMissingAuthResult);
    mod.assertSimilarityFeatureFlagResolverResultIsSafe(betaMissingUsageResult);
    mod.assertSimilarityFeatureFlagResolverResultIsSafe(publicRequestedResult);
    mod.assertSimilarityFeatureFlagResolverResultIsSafe(liveKisRequestedResult);
    mod.assertSimilarityFeatureFlagResolverResultIsSafe(duplicateIgnoredResult);
    mod.assertSimilarityFeatureFlagResolverResultIsSafe(clientClaimIgnoredResult);
  } finally {
    globalThis.fetch = originalFetch;
  }

  // --- A. Default disabled policy. ---
  const defaultPolicy = mod.buildDefaultSimilarityFeatureFlagResolverPolicy();
  assertEqual(defaultPolicy.enabled, false, 'Default policy enabled');
  assertEqual(defaultPolicy.allowMockedFlagRead, false, 'Default policy allowMockedFlagRead');
  assertEqual(defaultPolicy.allowRealEnvRead, false, 'Default policy allowRealEnvRead');
  assertEqual(defaultPolicy.allowVercelEnvRead, false, 'Default policy allowVercelEnvRead');
  assertEqual(defaultPolicy.allowSupabaseClient, false, 'Default policy allowSupabaseClient');
  assertEqual(defaultPolicy.allowRouteSuccess, false, 'Default policy allowRouteSuccess');
  assertEqual(defaultPolicy.allowBetaExecution, false, 'Default policy allowBetaExecution');
  assertEqual(defaultPolicy.allowPublicExecution, false, 'Default policy allowPublicExecution');
  assertEqual(defaultPolicy.allowLiveKis, false, 'Default policy allowLiveKis');
  assertEqual(defaultResult.status, 'disabled', 'Default result status');
  assertEqual(defaultResult.ok, false, 'Default result ok');
  assertTrue(
    defaultResult.flags.every((flag) => flag.enabled === false),
    'Default result flags must all be disabled',
  );
  assertEqual(defaultResult.gates.routeSuccessAllowed, false, 'Default result gates.routeSuccessAllowed');
  assertEqual(defaultResult.gates.betaExecutionAllowed, false, 'Default result gates.betaExecutionAllowed');
  assertEqual(defaultResult.gates.publicExecutionAllowed, false, 'Default result gates.publicExecutionAllowed');
  assertEqual(defaultResult.gates.liveKisAllowed, false, 'Default result gates.liveKisAllowed');

  // --- Mocked scaffold policy still grants no real capability. ---
  const mockedPolicy = mod.buildMockedSimilarityFeatureFlagResolverPolicy();
  assertEqual(mockedPolicy.enabled, true, 'Mocked policy enabled');
  assertEqual(mockedPolicy.allowMockedFlagRead, true, 'Mocked policy allowMockedFlagRead');
  assertEqual(mockedPolicy.allowRealEnvRead, false, 'Mocked policy allowRealEnvRead');
  assertEqual(mockedPolicy.allowVercelEnvRead, false, 'Mocked policy allowVercelEnvRead');
  assertEqual(mockedPolicy.allowSupabaseClient, false, 'Mocked policy allowSupabaseClient');
  assertEqual(mockedPolicy.allowDbRead, false, 'Mocked policy allowDbRead');
  assertEqual(mockedPolicy.allowDbWrite, false, 'Mocked policy allowDbWrite');
  assertEqual(mockedPolicy.allowSql, false, 'Mocked policy allowSql');
  assertEqual(mockedPolicy.allowCookieRead, false, 'Mocked policy allowCookieRead');
  assertEqual(mockedPolicy.allowHeaderRead, false, 'Mocked policy allowHeaderRead');
  assertEqual(mockedPolicy.allowClientClaimedFlags, false, 'Mocked policy allowClientClaimedFlags');
  assertEqual(mockedPolicy.allowRouteSuccess, false, 'Mocked policy allowRouteSuccess');
  assertEqual(mockedPolicy.allowBetaExecution, false, 'Mocked policy allowBetaExecution');
  assertEqual(mockedPolicy.allowPublicExecution, false, 'Mocked policy allowPublicExecution');
  assertEqual(mockedPolicy.allowLiveKis, false, 'Mocked policy allowLiveKis');

  // --- B. All flags off. ---
  assertEqual(allFlagsOffResult.status, 'resolved', 'All-flags-off result status');
  assertEqual(allFlagsOffResult.ok, true, 'All-flags-off result ok');
  assertTrue(
    allFlagsOffResult.flags.every((flag) => flag.enabled === false),
    'All-flags-off result flags must all be disabled',
  );
  assertEqual(allFlagsOffResult.gates.authRuntimeReady, false, 'All-flags-off gates.authRuntimeReady');
  assertEqual(allFlagsOffResult.gates.betaDependenciesSatisfied, false, 'All-flags-off gates.betaDependenciesSatisfied');
  assertEqual(allFlagsOffResult.warnings.length, 0, 'All-flags-off result warnings must be empty');

  // --- C. Auth only. ---
  assertEqual(authOnlyResult.gates.authRuntimeReady, true, 'Auth-only gates.authRuntimeReady');
  assertEqual(authOnlyResult.gates.usageStorageReady, false, 'Auth-only gates.usageStorageReady');
  assertEqual(authOnlyResult.gates.betaDependenciesSatisfied, false, 'Auth-only gates.betaDependenciesSatisfied');
  assertEqual(authOnlyResult.requestedCapability, 'auth_runtime', 'Auth-only requestedCapability');
  assertEqual(authOnlyResult.requestedCapabilityAllowed, true, 'Auth-only requestedCapabilityAllowed');
  assertEqual(authOnlyResult.gates.routeSuccessAllowed, false, 'Auth-only gates.routeSuccessAllowed');
  assertTrue(
    mod.isSimilarityFeatureCapabilityAllowed(authOnlyResult, 'auth_runtime'),
    'Capability helper: auth_runtime allowed when authRuntimeReady',
  );
  assertTrue(
    !mod.isSimilarityFeatureCapabilityAllowed(authOnlyResult, 'route_success'),
    'Capability helper: route_success always false',
  );

  // --- D. Auth + usage + beta ready. ---
  assertEqual(authUsageBetaReadyResult.gates.authRuntimeReady, true, 'Beta-ready gates.authRuntimeReady');
  assertEqual(authUsageBetaReadyResult.gates.usageStorageReady, true, 'Beta-ready gates.usageStorageReady');
  assertEqual(authUsageBetaReadyResult.gates.betaFlagReady, true, 'Beta-ready gates.betaFlagReady');
  assertEqual(authUsageBetaReadyResult.gates.betaDependenciesSatisfied, true, 'Beta-ready gates.betaDependenciesSatisfied');
  assertEqual(authUsageBetaReadyResult.gates.betaExecutionAllowed, false, 'Beta-ready gates.betaExecutionAllowed must remain false');
  assertEqual(authUsageBetaReadyResult.status, 'resolved', 'Beta-ready result status');
  assertTrue(
    !authUsageBetaReadyResult.warnings.includes('beta_missing_auth_dependency'),
    'Beta-ready warnings must not include beta_missing_auth_dependency',
  );
  assertTrue(
    !authUsageBetaReadyResult.warnings.includes('beta_missing_usage_dependency'),
    'Beta-ready warnings must not include beta_missing_usage_dependency',
  );

  // --- E. Beta missing auth. ---
  assertEqual(betaMissingAuthResult.gates.betaFlagReady, true, 'Beta-missing-auth gates.betaFlagReady');
  assertEqual(betaMissingAuthResult.gates.authRuntimeReady, false, 'Beta-missing-auth gates.authRuntimeReady');
  assertEqual(betaMissingAuthResult.gates.betaDependenciesSatisfied, false, 'Beta-missing-auth gates.betaDependenciesSatisfied');
  assertEqual(betaMissingAuthResult.status, 'dependency_blocked', 'Beta-missing-auth result status');
  assertTrue(
    betaMissingAuthResult.warnings.includes('beta_missing_auth_dependency'),
    'Beta-missing-auth warnings must include beta_missing_auth_dependency',
  );

  // --- F. Beta missing usage. ---
  assertEqual(betaMissingUsageResult.gates.betaFlagReady, true, 'Beta-missing-usage gates.betaFlagReady');
  assertEqual(betaMissingUsageResult.gates.usageStorageReady, false, 'Beta-missing-usage gates.usageStorageReady');
  assertEqual(betaMissingUsageResult.status, 'dependency_blocked', 'Beta-missing-usage result status');
  assertTrue(
    betaMissingUsageResult.warnings.includes('beta_missing_usage_dependency'),
    'Beta-missing-usage warnings must include beta_missing_usage_dependency',
  );

  // --- G. Public requested. ---
  assertEqual(publicRequestedResult.gates.publicFlagReady, true, 'Public-requested gates.publicFlagReady');
  assertEqual(
    publicRequestedResult.gates.publicDependenciesSatisfied,
    true,
    'Public-requested gates.publicDependenciesSatisfied',
  );
  assertEqual(
    publicRequestedResult.gates.publicExecutionAllowed,
    false,
    'Public-requested gates.publicExecutionAllowed must remain false',
  );
  assertTrue(
    publicRequestedResult.warnings.includes('public_activation_not_approved'),
    'Public-requested warnings must include public_activation_not_approved',
  );
  assertTrue(
    !publicRequestedResult.warnings.includes('public_dependency_blocked'),
    'Public-requested warnings must not include public_dependency_blocked when dependencies are satisfied',
  );
  assertEqual(publicRequestedResult.requestedCapabilityAllowed, false, 'Public-requested requestedCapabilityAllowed');

  // --- H. Live KIS requested. ---
  assertEqual(liveKisRequestedResult.gates.liveKisFlagReady, true, 'Live-KIS-requested gates.liveKisFlagReady');
  assertEqual(liveKisRequestedResult.gates.liveKisAllowed, false, 'Live-KIS-requested gates.liveKisAllowed must remain false');
  assertTrue(
    liveKisRequestedResult.warnings.includes('live_kis_activation_not_approved'),
    'Live-KIS-requested warnings must include live_kis_activation_not_approved',
  );
  assertEqual(liveKisRequestedResult.requestedCapabilityAllowed, false, 'Live-KIS-requested requestedCapabilityAllowed');

  // --- I. Duplicate flag ignored. ---
  assertEqual(duplicateIgnoredResult.gates.authRuntimeReady, false, 'Duplicate-ignored gates.authRuntimeReady must stay false');
  assertTrue(
    duplicateIgnoredResult.warnings.includes('duplicate_flag_ignored'),
    'Duplicate-ignored warnings must include duplicate_flag_ignored',
  );
  assertEqual(duplicateIgnoredResult.requestedCapabilityAllowed, false, 'Duplicate-ignored requestedCapabilityAllowed');

  // --- J. Client-claimed flags ignored. ---
  assertEqual(
    clientClaimIgnoredResult.gates.usageStorageReady,
    false,
    'Client-claim-ignored gates.usageStorageReady must not be affected by the claim',
  );
  assertEqual(
    clientClaimIgnoredResult.gates.betaFlagReady,
    false,
    'Client-claim-ignored gates.betaFlagReady must not be affected by the claim',
  );
  assertTrue(
    clientClaimIgnoredResult.warnings.includes('client_claim_ignored'),
    'Client-claim-ignored warnings must include client_claim_ignored',
  );
  assertEqual(clientClaimIgnoredResult.gates.authRuntimeReady, true, 'Client-claim-ignored gates.authRuntimeReady from real mocked flag');

  // --- K. Invalid input handling. ---
  const invalidResult = mod.resolveSimilarityFeatureFlags('not-an-object', mockedPolicy);
  assertEqual(invalidResult.status, 'invalid_flag_set', 'Invalid input result status');
  assertEqual(invalidResult.ok, false, 'Invalid input result ok');
  const invalidShapeResult = mod.resolveSimilarityFeatureFlags({ mockedFlags: 'not-an-array' }, mockedPolicy);
  assertEqual(invalidShapeResult.status, 'invalid_flag_set', 'Invalid mockedFlags shape result status');
  const malformedRecordResult = mod.resolveSimilarityFeatureFlags(
    { mockedFlags: [{ key: 'AUTH_RUNTIME_ENABLED' }] },
    mockedPolicy,
  );
  assertEqual(malformedRecordResult.status, 'resolved', 'Malformed record ignored result status');
  assertTrue(
    malformedRecordResult.warnings.includes('flag_ignored'),
    'Malformed record ignored warnings must include flag_ignored',
  );
  assertEqual(malformedRecordResult.gates.authRuntimeReady, false, 'Malformed record ignored gates.authRuntimeReady stays false');

  // --- L. Runtime safety. ---
  assertTrue(!fetchCalled, 'fetch must never be called by the feature flag resolver scaffold');
  const bundledCode = stripComments(bundledSource);
  assertTrue(!/@supabase/.test(bundledCode), 'Bundled feature flag resolver module must not import a Supabase package');
  assertTrue(!/process\.env(\.\w+|\[)/.test(bundledCode), 'Bundled feature flag resolver module must not access process.env');
  assertTrue(
    !/import\.meta\.env(\.\w+|\[)/.test(bundledCode),
    'Bundled feature flag resolver module must not access import.meta.env',
  );
  assertTrue(
    !/VERCEL_ENV|VERCEL_URL|process\.env\[.VERCEL/i.test(bundledCode),
    'Bundled feature flag resolver module must not reference Vercel environment variables',
  );
  assertTrue(
    !/kisOhlcProvider|serverOnlyKisOhlcProvider|mockedKisOhlcAdapter/.test(bundledCode),
    'Bundled feature flag resolver module must not import a KIS provider module',
  );
  assertTrue(
    !/pages[\\/]api|similarityApiRouteShell/.test(bundledCode),
    'Bundled feature flag resolver module must not import an API route module',
  );
  assertTrue(
    !/\bCREATE TABLE\b|\bINSERT INTO\b|\/migrations\//i.test(bundledCode),
    'Bundled feature flag resolver module must not contain SQL or migration references',
  );

  // Source-level safety check against the actual on-disk resolver file (not just the bundle).
  const resolverCode = stripComments(readFileSync('src/lib/server/chartSimilarity/similarityFeatureFlagResolver.ts', 'utf8'));
  assertTrue(!/@supabase/.test(resolverCode), 'Feature flag resolver source must not import a Supabase package');
  assertTrue(!/process\.env(\.\w+|\[)/.test(resolverCode), 'Feature flag resolver source must not access process.env');
  assertTrue(
    !/import\.meta\.env(\.\w+|\[)/.test(resolverCode),
    'Feature flag resolver source must not access import.meta.env',
  );
  assertTrue(
    !/document\.cookie|req\.headers|request\.headers/.test(resolverCode),
    'Feature flag resolver source must not read cookies/headers',
  );
  assertTrue(!/\bfetch\(/.test(resolverCode), 'Feature flag resolver source must not call fetch');

  if (failures.length > 0) {
    process.stdout.write(`Phase 3FC-F smoke: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
    for (const failure of failures) {
      process.stdout.write(`  - ${failure}\n`);
    }
    return 1;
  }

  process.stdout.write(`Phase 3FC-F smoke: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  return 0;
};

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    process.stdout.write('Phase 3FC-F smoke: FAIL\n');
    process.stdout.write(`reason: ${error && error.message ? error.message : 'smoke script error'}\n`);
    process.exitCode = 1;
  });
