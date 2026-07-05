/** Focused Phase 3FD-D mocked-DB-only runtime adapter smoke. */

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

const valuesOnlyLowercase = (value) => {
  const sink = [];
  const walk = (candidate) => {
    if (candidate === null || candidate === undefined) return;
    if (typeof candidate === 'string' || typeof candidate === 'number' || typeof candidate === 'boolean') {
      sink.push(String(candidate));
      return;
    }
    if (Array.isArray(candidate)) {
      for (const item of candidate) walk(item);
      return;
    }
    if (typeof candidate === 'object') {
      for (const key of Object.keys(candidate)) walk(candidate[key]);
    }
  };
  walk(value);
  return sink.join(' | ').toLowerCase();
};

const loadModule = async () => {
  const entryContents = [
    "export * from './src/lib/server/chartSimilarity/similarityRoleUsageRuntimeAdapter.ts';",
    "export * from './src/lib/server/chartSimilarity/mockedSimilarityRoleUsageRuntimeAdapterFixtures.ts';",
  ].join('\n');
  const bundle = await build({
    stdin: {
      contents: entryContents,
      resolveDir: root,
      sourcefile: 'phase-3fd-d-role-usage-runtime-adapter-smoke-entry.ts',
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

const assertSafeResult = (mod, result, label) => {
  assertTrue(
    result &&
      typeof result === 'object' &&
      result.decision &&
      typeof result.decision.allowed === 'boolean' &&
      ['disabled', 'mocked-db'].includes(result.source) &&
      result.policySummary.allowRealDb === false &&
      result.policySummary.allowSupabaseClient === false &&
      result.policySummary.allowEnvRead === false &&
      result.policySummary.allowServiceRole === false &&
      result.policySummary.allowRouteSuccess === false &&
      result.policySummary.allowUserClientWrite === false &&
      result.policySummary.allowRawDbEcho === false,
    `${label}: result structure/source/policy must remain safe.`,
  );
  assertTrue(!/@|accesstoken|refreshtoken|rawsession|rawuser|service_role|kis_app|ohlc|account|trading|balance/.test(valuesOnlyLowercase(result)), `${label}: primitive values must remain redacted.`);
  let safe = true;
  try {
    mod.assertSimilarityRoleUsageRuntimeAdapterResultIsSafe(result);
  } catch {
    safe = false;
  }
  assertTrue(safe, `${label}: safety assertion must accept the result.`);
};

const main = async () => {
  const { mod, bundledSource } = await loadModule();
  const request = mod.buildMockedRoleUsageRuntimeAdapterRequest();
  const policy = mod.buildMockedRoleUsageRuntimeAdapterPolicy();

  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = () => {
    fetchCalled = true;
    throw new Error('fetch must not be called by the mocked role/usage runtime adapter.');
  };

  try {
    const defaultDb = mod.buildMockedDbWithAuthenticatedUsageAvailable();
    const defaultResult = await mod.resolveSimilarityRoleUsageRuntimeAdapter(request, { mockDb: defaultDb });
    assertSafeResult(mod, defaultResult, 'A default disabled');
    assertEqual(defaultResult.status, 'disabled', 'A: default status');
    assertEqual(defaultResult.decision.allowed, false, 'A: default must block');
    assertEqual(defaultResult.decision.resolvedRole, 'anonymous', 'A: default role');
    assertEqual(defaultDb.getCommitCallCount(), 0, 'A: default must not commit');

    const unavailableResult = await mod.resolveSimilarityRoleUsageRuntimeAdapter(
      request,
      { mockDb: mod.buildMockedDbUnavailable() },
      policy,
    );
    assertSafeResult(mod, unavailableResult, 'B unavailable');
    assertEqual(unavailableResult.status, 'mock_db_unavailable', 'B: missing DB status');
    assertEqual(unavailableResult.decision.allowed, false, 'B: missing DB must block');
    assertEqual(unavailableResult.decision.resolvedRole, 'anonymous', 'B: missing DB role');

    const roleCases = [
      ['C authenticated', 'authenticated', mod.buildMockedDbWithAuthenticatedUsageAvailable()],
      ['D beta', 'beta', mod.buildMockedDbWithBetaRoleUsageAvailable()],
      ['E owner', 'owner', mod.buildMockedDbWithOwnerRoleUsageAvailable()],
      ['F admin', 'admin', mod.buildMockedDbWithAdminRoleUsageAvailable()],
    ];
    for (const [label, expectedRole, db] of roleCases) {
      const result = await mod.resolveSimilarityRoleUsageRuntimeAdapter(request, { mockDb: db }, policy);
      assertSafeResult(mod, result, label);
      assertEqual(result.status, 'resolved', `${label}: status`);
      assertEqual(result.ok, true, `${label}: ok`);
      assertEqual(result.decision.allowed, true, `${label}: allowed`);
      assertEqual(result.decision.resolvedRole, expectedRole, `${label}: role`);
      assertTrue(['low', 'available'].includes(result.decision.usageRemainingDailyBucket), `${label}: daily bucket`);
      assertTrue(['low', 'available'].includes(result.decision.usageRemainingMonthlyBucket), `${label}: monthly bucket`);
      assertEqual(db.getCommitCallCount(), 1, `${label}: one mocked commit`);
    }

    const limitedDb = mod.buildMockedDbWithUsageLimited();
    const limitedResult = await mod.resolveSimilarityRoleUsageRuntimeAdapter(request, { mockDb: limitedDb }, policy);
    assertSafeResult(mod, limitedResult, 'G limited');
    assertEqual(limitedResult.status, 'usage_limited', 'G: limited status');
    assertEqual(limitedResult.decision.allowed, false, 'G: limited must block');
    assertEqual(limitedResult.decision.usageRemainingDailyBucket, 'none', 'G: daily bucket exhausted');
    assertEqual(limitedDb.getCommitCallCount(), 0, 'G: limited must not commit');

    const replayDb = mod.buildMockedDbWithIdempotentReplay();
    const replayResult = await mod.resolveSimilarityRoleUsageRuntimeAdapter(request, { mockDb: replayDb }, policy);
    assertSafeResult(mod, replayResult, 'H replay');
    assertEqual(replayResult.status, 'idempotent_replay', 'H: replay status');
    assertEqual(replayResult.decision.allowed, true, 'H: prior safe outcome reused');
    assertEqual(replayDb.getCommitCallCount(), 0, 'H: replay must not commit again');
    assertTrue(replayResult.warnings.includes('idempotent_replay'), 'H: replay warning');

    const ambiguousDb = mod.buildMockedDbWithAmbiguousRoleAssignments();
    const ambiguousResult = await mod.resolveSimilarityRoleUsageRuntimeAdapter(request, { mockDb: ambiguousDb }, policy);
    assertSafeResult(mod, ambiguousResult, 'I ambiguous');
    assertEqual(ambiguousResult.status, 'role_ambiguous', 'I: ambiguous status');
    assertEqual(ambiguousResult.decision.allowed, false, 'I: ambiguous must block');
    assertEqual(ambiguousResult.decision.resolvedRole, 'anonymous', 'I: ambiguous role');
    assertEqual(ambiguousDb.getCommitCallCount(), 0, 'I: ambiguous must not commit');

    const expiredDb = mod.buildMockedDbWithExpiredRoleAssignment();
    const expiredResult = await mod.resolveSimilarityRoleUsageRuntimeAdapter(request, { mockDb: expiredDb }, policy);
    assertSafeResult(mod, expiredResult, 'J expired');
    assertEqual(expiredResult.status, 'resolved', 'J: expired status');
    assertEqual(expiredResult.decision.resolvedRole, 'authenticated', 'J: expired must not escalate');
    assertEqual(expiredResult.decision.allowed, true, 'J: derived authenticated may pass mocked usage');
    assertTrue(expiredResult.warnings.includes('inactive_assignment_ignored'), 'J: ignored warning');

    const malformedDb = mod.buildMockedDbWithMalformedRoleAssignment();
    const malformedResult = await mod.resolveSimilarityRoleUsageRuntimeAdapter(request, { mockDb: malformedDb }, policy);
    assertSafeResult(mod, malformedResult, 'K malformed');
    assertEqual(malformedResult.status, 'role_invalid', 'K: malformed status');
    assertEqual(malformedResult.decision.allowed, false, 'K: malformed must block');
    assertEqual(malformedResult.decision.resolvedRole, 'anonymous', 'K: malformed role');
    assertEqual(malformedDb.getCommitCallCount(), 0, 'K: malformed must not commit');

    const missingDb = mod.buildMockedDbWithMissingCounters();
    const missingResult = await mod.resolveSimilarityRoleUsageRuntimeAdapter(request, { mockDb: missingDb }, policy);
    assertSafeResult(mod, missingResult, 'L missing counters');
    assertEqual(missingResult.status, 'usage_not_found', 'L: missing counter status');
    assertEqual(missingResult.decision.allowed, false, 'L: missing counter must block');
    assertEqual(missingResult.decision.resolvedRole, 'authenticated', 'L: safe resolved role');
    assertEqual(missingDb.getCommitCallCount(), 0, 'L: missing counter must not commit');

    const failureDb = mod.buildMockedDbWithTransactionFailure();
    const failureResult = await mod.resolveSimilarityRoleUsageRuntimeAdapter(request, { mockDb: failureDb }, policy);
    assertSafeResult(mod, failureResult, 'M transaction failure');
    assertEqual(failureResult.status, 'transaction_failed', 'M: transaction status');
    assertEqual(failureResult.decision.allowed, false, 'M: transaction failure must block');
    assertEqual(failureResult.decision.resolvedRole, 'authenticated', 'M: safe resolved role');
    assertEqual(failureDb.getCommitCallCount(), 1, 'M: one failed mocked commit attempt');

    let unsafeRejected = false;
    try {
      mod.assertSimilarityRoleUsageRuntimeAdapterResultIsSafe({
        ...defaultResult,
        safeMessage: 'unsafe.person@example.test',
      });
    } catch {
      unsafeRejected = true;
    }
    assertTrue(unsafeRejected, 'N: safety assertion must reject an unsafe primitive value.');
    assertTrue(!fetchCalled, 'O: adapter must never call fetch.');

    const sourcePaths = [
      'src/lib/server/chartSimilarity/similarityRoleUsageRuntimeAdapterTypes.ts',
      'src/lib/server/chartSimilarity/similarityRoleUsageRuntimeAdapter.ts',
      'src/lib/server/chartSimilarity/mockedSimilarityRoleUsageRuntimeAdapterFixtures.ts',
    ];
    const sourceNoComments = sourcePaths.map((sourcePath) => stripComments(readFileSync(sourcePath, 'utf8'))).join('\n');
    assertTrue(!/@supabase\//.test(sourceNoComments), 'O: source must not import Supabase.');
    assertTrue(!/createClient\s*\(/.test(sourceNoComments), 'O: source must not create a client.');
    assertTrue(!/process\.env(?:\.|\[)/.test(sourceNoComments), 'O: source must not access process env values.');
    assertTrue(!/import\.meta\.env/.test(sourceNoComments), 'O: source must not access import meta env.');
    assertTrue(!/\bfetch\s*\(/.test(sourceNoComments), 'O: source must not call fetch.');
    assertTrue(!/pages\/api|pages\\api|chart-ai\.astro/.test(sourceNoComments), 'O: source must not import route or UI modules.');
    assertTrue(!/kisOhlcProvider|serverOnlyKis|mockedKis/.test(sourceNoComments), 'O: source must not import a KIS provider.');
    assertTrue(!/\bCREATE\s+TABLE\b|\bALTER\s+TABLE\b/i.test(sourceNoComments), 'O: source must not execute SQL.');
    assertTrue(!/@supabase\//.test(bundledSource), 'O: bundle must not import Supabase.');
    assertTrue(!/\bfetch\s*\(/.test(bundledSource), 'O: bundle must not call fetch.');
  } finally {
    globalThis.fetch = originalFetch;
  }

  assertTrue(assertionCount >= 90, `Smoke must run at least 90 assertions; ran ${assertionCount}.`);
  assertTrue(assertionCount <= 125, `Smoke must run at most 125 assertions; ran ${assertionCount}.`);

  if (failures.length > 0) {
    console.error(`Phase 3FD-D smoke FAILED: ${failures.length}/${assertionCount} assertions failed.`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log(`Phase 3FD-D smoke: PASS (${assertionCount}/${assertionCount} assertions passed)`);
};

await main();
