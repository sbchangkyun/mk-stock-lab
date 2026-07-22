/** Focused Phase 3FD-E guarded composition smoke. */

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
  if (actual !== expected) failures.push(`${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
};

const stripComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

const primitiveValues = (value) => {
  const values = [];
  const walk = (candidate) => {
    if (candidate === null || candidate === undefined) return;
    if (typeof candidate === 'string' || typeof candidate === 'number' || typeof candidate === 'boolean') {
      values.push(String(candidate));
    } else if (Array.isArray(candidate)) {
      for (const item of candidate) walk(item);
    } else if (typeof candidate === 'object') {
      for (const item of Object.values(candidate)) walk(item);
    }
  };
  walk(value);
  return values.join(' | ').toLowerCase();
};

const loadModule = async () => {
  const entryContents = [
    "export * from './src/lib/server/chartSimilarity/similarityGuardedRouteRuntimeComposition.ts';",
    "export { buildMockedGuardedRouteRuntimeCompositionRequest, buildMockedCompositionDepsAllBlocked, buildMockedCompositionDepsAuthBlocked, buildMockedCompositionDepsRoleUsageBlocked, buildMockedCompositionDepsFeatureFlagBlocked, buildMockedCompositionDepsProviderBlocked, buildMockedCompositionDepsMostFavorableStillRouteDisabled, buildMockedCompositionDepsUnsafeOutputAttempt } from './src/lib/server/chartSimilarity/mockedSimilarityGuardedRouteRuntimeCompositionFixtures.ts';",
  ].join('\n');
  const bundle = await build({
    stdin: {
      contents: entryContents,
      resolveDir: root,
      sourcefile: 'phase-3fd-e-guarded-composition-smoke-entry.ts',
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

const assertSafeBlockedResult = (mod, result, label) => {
  assertTrue(result && typeof result === 'object', `${label}: result object`);
  assertEqual(result.ok, false, `${label}: result blocked`);
  assertEqual(result.routeSuccessAllowed, false, `${label}: route success disabled`);
  assertEqual(result.providerExecutionAllowed, false, `${label}: provider execution disabled`);
  assertEqual(result.betaExecutionAllowed, false, `${label}: beta execution disabled`);
  assertEqual(result.publicExecutionAllowed, false, `${label}: public execution disabled`);
  assertTrue(result.safeResponse && typeof result.safeResponse.safeMessage === 'string', `${label}: safe response`);
  assertTrue(
    result.policySummary.allowRealAuth === false &&
      result.policySummary.allowRealDb === false &&
      result.policySummary.allowSupabaseClient === false &&
      result.policySummary.allowEnvRead === false &&
      result.policySummary.allowLiveKis === false &&
      result.policySummary.allowProviderExecution === false &&
      result.policySummary.allowRouteSuccess === false,
    `${label}: all real gates off`,
  );
  let accepted = true;
  try {
    mod.assertSimilarityGuardedRouteRuntimeCompositionResultIsSafe(result);
  } catch {
    accepted = false;
  }
  assertTrue(accepted, `${label}: safety assertion accepts result`);
  assertTrue(!/@|accesstoken|refreshtoken|rawsession|rawuser|service_role|kis_app|ohlc|account|trading|balance/.test(primitiveValues(result)), `${label}: primitive values redacted`);
};

const main = async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error('Unexpected network call.');
  };

  try {
    const { mod, bundledSource } = await loadModule();
    const request = mod.buildMockedGuardedRouteRuntimeCompositionRequest();
    const policy = mod.buildAllGatesOffMockedRuntimeCompositionPolicy();

    const defaultResult = await mod.runSimilarityGuardedRouteRuntimeComposition(request);
    assertSafeBlockedResult(mod, defaultResult, 'A default disabled');
    assertEqual(defaultResult.status, 'disabled', 'A: disabled status');
    assertEqual(defaultResult.source, 'disabled', 'A: disabled source');

    const malformedResult = await mod.runSimilarityGuardedRouteRuntimeComposition({}, {}, policy);
    assertSafeBlockedResult(mod, malformedResult, 'B malformed request');
    assertEqual(malformedResult.status, 'invalid_request', 'B: invalid request status');
    assertEqual(malformedResult.source, 'mocked-runtime', 'B: mocked source');

    const authResult = await mod.runSimilarityGuardedRouteRuntimeComposition(request, mod.buildMockedCompositionDepsAuthBlocked(), policy);
    assertSafeBlockedResult(mod, authResult, 'C auth blocked');
    assertEqual(authResult.status, 'auth_blocked', 'C: auth status');
    assertEqual(authResult.safeResponse.authState, 'anonymous', 'C: anonymous bucket');

    const roleResult = await mod.runSimilarityGuardedRouteRuntimeComposition(request, mod.buildMockedCompositionDepsRoleUsageBlocked(), policy);
    assertSafeBlockedResult(mod, roleResult, 'D role usage blocked');
    assertEqual(roleResult.status, 'role_usage_blocked', 'D: role usage status');
    assertEqual(roleResult.safeResponse.usageRemainingDailyBucket, 'none', 'D: daily bucket');

    const flagResult = await mod.runSimilarityGuardedRouteRuntimeComposition(request, mod.buildMockedCompositionDepsFeatureFlagBlocked(), policy);
    assertSafeBlockedResult(mod, flagResult, 'E feature flag blocked');
    assertEqual(flagResult.status, 'feature_flag_blocked', 'E: feature flag status');
    assertEqual(flagResult.safeResponse.resolvedRole, 'authenticated', 'E: safe role');

    const providerResult = await mod.runSimilarityGuardedRouteRuntimeComposition(request, mod.buildMockedCompositionDepsProviderBlocked(), policy);
    assertSafeBlockedResult(mod, providerResult, 'F provider blocked');
    assertEqual(providerResult.status, 'provider_blocked', 'F: provider status');
    assertEqual(providerResult.safeResponse.engineStatus, 'blocked', 'F: engine blocked');

    const favorableResult = await mod.runSimilarityGuardedRouteRuntimeComposition(request, mod.buildMockedCompositionDepsMostFavorableStillRouteDisabled(), policy);
    assertSafeBlockedResult(mod, favorableResult, 'G favorable route disabled');
    assertEqual(favorableResult.status, 'route_success_disabled', 'G: route disabled status');
    assertEqual(favorableResult.safeResponse.engineStatus, 'not_run', 'G: engine never ran');

    const unsafeResult = await mod.runSimilarityGuardedRouteRuntimeComposition(request, mod.buildMockedCompositionDepsUnsafeOutputAttempt(), policy);
    assertSafeBlockedResult(mod, unsafeResult, 'H unsafe output');
    assertTrue(['redaction_failed', 'safe_error'].includes(unsafeResult.status), 'H: unsafe output fails closed');
    assertTrue(unsafeResult.warnings.includes('redaction_failed') || unsafeResult.warnings.includes('safe_error'), 'H: safe warning');

    let callableProviderCalls = 0;
    const callableDeps = {
      ...mod.buildMockedCompositionDepsMostFavorableStillRouteDisabled(),
      mockedProviderRunner: () => {
        callableProviderCalls += 1;
        throw new Error('Runner must not execute.');
      },
    };
    const callableResult = await mod.runSimilarityGuardedRouteRuntimeComposition(request, callableDeps, policy);
    assertEqual(callableProviderCalls, 0, 'I: callable provider runner is not invoked');
    assertEqual(callableResult.status, 'provider_blocked', 'I: callable provider is blocked');
    assertEqual(callableResult.providerExecutionAllowed, false, 'I: execution remains disabled');

    const route = readFileSync('src/pages/api/chart-ai/similarity.ts', 'utf8');
    const routeNoComments = stripComments(route);
    const dispatchCount = (route.match(/if \(is(?:OwnerLocalMockedSimilarityApiRequestBody|OwnerLocalAuthUsageBridgeSimilarityApiRequestBody|GuardedRuntimeScaffoldSimilarityRequestBody)\(body\)\)/g) || []).length;
    assertEqual(dispatchCount, 3, 'J: route retains exactly three dispatch branches');
    assertTrue(route.includes('runSimilarityGuardedRouteRuntimeComposition'), 'J: guarded composition imported and called');
    assertTrue(route.indexOf('runSimilarityGuardedRouteRuntimeComposition') < route.lastIndexOf('buildSimilarityApiRouteShellResult({})'), 'J: call precedes safe fallback');
    assertTrue(route.includes('isOwnerLocalMockedSimilarityApiRequestBody'), 'K: owner-local mocked helper preserved');
    assertTrue(route.includes('buildOwnerLocalMockedSimilarityApiResponse'), 'K: owner-local mocked response preserved');
    assertTrue(route.includes('isOwnerLocalAuthUsageBridgeSimilarityApiRequestBody'), 'L: owner auth-usage helper preserved');
    assertTrue(route.includes('buildOwnerLocalAuthUsageBridgeSimilarityApiResponse'), 'L: owner auth-usage response preserved');
    assertTrue(!/allowRouteSuccess\s*:\s*true/.test(routeNoComments), 'J: no route success activation');

    const sourcePaths = [
      'src/lib/server/chartSimilarity/similarityGuardedRouteRuntimeCompositionTypes.ts',
      'src/lib/server/chartSimilarity/similarityGuardedRouteRuntimeComposition.ts',
      'src/lib/server/chartSimilarity/mockedSimilarityGuardedRouteRuntimeCompositionFixtures.ts',
    ];
    const sourceNoComments = sourcePaths.map((sourcePath) => stripComments(readFileSync(sourcePath, 'utf8'))).join('\n');
    assertTrue(!/@supabase\//.test(sourceNoComments), 'L: no Supabase import');
    assertTrue(!/createClient\s*\(/.test(sourceNoComments), 'L: no client creation');
    assertTrue(!/process\.env(?:\.|\[)/.test(sourceNoComments), 'L: no process env read');
    assertTrue(!/import\.meta\.env/.test(sourceNoComments), 'L: no import meta env read');
    assertTrue(!/\bfetch\s*\(/.test(sourceNoComments), 'L: no fetch call');
    assertTrue(!/pages\/api|pages\\api|chart-ai\.astro/.test(sourceNoComments), 'L: no route or UI import');
    assertTrue(!/server\/providers|server\\providers|kisOhlcProvider/.test(sourceNoComments), 'L: no provider import');
    assertTrue(!fetchCalled, 'L: smoke observed no fetch call');
    assertTrue(!/@supabase\//.test(bundledSource), 'L: bundle has no Supabase import');
  } finally {
    globalThis.fetch = originalFetch;
  }

  assertTrue(assertionCount >= 90, `Smoke must run at least 90 assertions; ran ${assertionCount}.`);
  assertTrue(assertionCount <= 125, `Smoke must run at most 125 assertions; ran ${assertionCount}.`);

  if (failures.length > 0) {
    console.error(`Phase 3FD-E smoke FAILED: ${failures.length}/${assertionCount} assertions failed.`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log(`Phase 3FD-E smoke: PASS (${assertionCount}/${assertionCount} assertions passed)`);
};

await main();
