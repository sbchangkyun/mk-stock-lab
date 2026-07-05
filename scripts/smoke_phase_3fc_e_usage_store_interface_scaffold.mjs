/**
 * Usage store interface scaffold smoke (Phase 3FC-E).
 *
 * Exercises the actual usage store module (`similarityUsageStore.ts`) and its fixtures through
 * normal TypeScript bundling, without a dev server, without a real Supabase client, without
 * reading `process.env`, and without any network call. Confirms: (1) the default, disabled-by-
 * default policy always resolves to `disabled` for both snapshot loading and increment; (2) the
 * approved daily/monthly limit table matches the owner-approved baseline for every role; (3) an
 * anonymous role or missing subject always blocks both snapshot loading and increment; (4) a
 * mocked scaffold policy correctly resolves fresh/at-limit snapshots and increment success/
 * blocked outcomes for authenticated/beta/owner/admin roles; (5) a mismatched counter is ignored
 * for safety; (6) a client-claimed role or usage value is always ignored and only produces a safe
 * warning; (7) the module never calls `fetch`, never imports a Supabase package, a KIS provider
 * module, or an API route module, and never accesses `process.env`. This is a focused smoke (a
 * bounded assertion list), not a full historical checker suite.
 *
 * Run:
 *   npm run smoke:phase-3fc-e-usage-store-interface-scaffold
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

const loadUsageStoreModule = async () => {
  const entryContents = [
    "export {",
    '  buildDefaultSimilarityUsageStorePolicy,',
    '  buildMockedSimilarityUsageStorePolicy,',
    '  getApprovedSimilarityUsageLimit,',
    '  normalizeSimilarityUsageStoreInput,',
    '  loadSimilarityUsageSnapshot,',
    '  recordSimilarityUsageIncrement,',
    '  assertSimilarityUsageStoreResultIsSafe,',
    "} from './src/lib/server/chartSimilarity/similarityUsageStore.ts';",
    "export {",
    '  buildMockedAnonymousUsageStoreInput,',
    '  buildMockedAuthenticatedFreshDailyUsageStoreInput,',
    '  buildMockedAuthenticatedAtDailyLimitUsageStoreInput,',
    '  buildMockedBetaPartialDailyUsageStoreInput,',
    '  buildMockedBetaAtMonthlyLimitUsageStoreInput,',
    '  buildMockedOwnerPartialDailyUsageStoreInput,',
    '  buildMockedAdminPartialMonthlyUsageStoreInput,',
    '  buildMockedCounterMismatchIgnoredUsageStoreInput,',
    '  buildMockedClientClaimedUsageIgnoredUsageStoreInput,',
    "} from './src/lib/server/chartSimilarity/mockedSimilarityUsageStoreFixtures.ts';",
  ].join('\n');

  const bundle = await build({
    stdin: {
      contents: entryContents,
      resolveDir: root,
      sourcefile: 'usage-store-interface-scaffold-smoke-entry.ts',
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
  const { mod, bundledSource } = await loadUsageStoreModule();

  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = () => {
    fetchCalled = true;
    throw new Error('fetch must never be called by the usage store interface scaffold.');
  };

  let defaultSnapshotResult;
  let defaultIncrementResult;
  let anonymousSnapshotResult;
  let anonymousIncrementResult;
  let freshDailyResult;
  let atDailyLimitResult;
  let betaPartialSnapshotResult;
  let betaPartialIncrementResult;
  let betaAtMonthlyLimitSnapshotResult;
  let betaAtMonthlyLimitIncrementResult;
  let ownerPartialIncrementResult;
  let adminPartialIncrementResult;
  let mismatchIgnoredResult;
  let claimIgnoredResult;

  try {
    const defaultPolicy = mod.buildDefaultSimilarityUsageStorePolicy();
    const mockedPolicy = mod.buildMockedSimilarityUsageStorePolicy();

    // --- A. Default disabled policy. ---
    defaultSnapshotResult = mod.loadSimilarityUsageSnapshot(mod.buildMockedOwnerPartialDailyUsageStoreInput(), defaultPolicy);
    defaultIncrementResult = mod.recordSimilarityUsageIncrement(mod.buildMockedOwnerPartialDailyUsageStoreInput(), defaultPolicy);

    // --- C. Anonymous role. ---
    anonymousSnapshotResult = mod.loadSimilarityUsageSnapshot(mod.buildMockedAnonymousUsageStoreInput(), mockedPolicy);
    anonymousIncrementResult = mod.recordSimilarityUsageIncrement(mod.buildMockedAnonymousUsageStoreInput(), mockedPolicy);

    // --- D. Authenticated fresh daily snapshot. ---
    freshDailyResult = mod.loadSimilarityUsageSnapshot(mod.buildMockedAuthenticatedFreshDailyUsageStoreInput(), mockedPolicy);

    // --- E. Authenticated at daily limit. ---
    atDailyLimitResult = mod.loadSimilarityUsageSnapshot(mod.buildMockedAuthenticatedAtDailyLimitUsageStoreInput(), mockedPolicy);

    // --- F. Beta partial daily increment. ---
    betaPartialSnapshotResult = mod.loadSimilarityUsageSnapshot(mod.buildMockedBetaPartialDailyUsageStoreInput(), mockedPolicy);
    betaPartialIncrementResult = mod.recordSimilarityUsageIncrement(mod.buildMockedBetaPartialDailyUsageStoreInput(), mockedPolicy);

    // --- G. Beta monthly at limit. ---
    betaAtMonthlyLimitSnapshotResult = mod.loadSimilarityUsageSnapshot(mod.buildMockedBetaAtMonthlyLimitUsageStoreInput(), mockedPolicy);
    betaAtMonthlyLimitIncrementResult = mod.recordSimilarityUsageIncrement(
      mod.buildMockedBetaAtMonthlyLimitUsageStoreInput(),
      mockedPolicy,
    );

    // --- H. Owner partial daily increment. ---
    ownerPartialIncrementResult = mod.recordSimilarityUsageIncrement(mod.buildMockedOwnerPartialDailyUsageStoreInput(), mockedPolicy);

    // --- I. Admin partial monthly increment. ---
    adminPartialIncrementResult = mod.recordSimilarityUsageIncrement(mod.buildMockedAdminPartialMonthlyUsageStoreInput(), mockedPolicy);

    // --- J. Counter mismatch ignored. ---
    mismatchIgnoredResult = mod.loadSimilarityUsageSnapshot(mod.buildMockedCounterMismatchIgnoredUsageStoreInput(), mockedPolicy);

    // --- K. Client-claimed usage/role ignored. ---
    claimIgnoredResult = mod.loadSimilarityUsageSnapshot(mod.buildMockedClientClaimedUsageIgnoredUsageStoreInput(), mockedPolicy);

    // Safety assertions must not throw for any of the above safe results.
    mod.assertSimilarityUsageStoreResultIsSafe(defaultSnapshotResult);
    mod.assertSimilarityUsageStoreResultIsSafe(defaultIncrementResult);
    mod.assertSimilarityUsageStoreResultIsSafe(anonymousSnapshotResult);
    mod.assertSimilarityUsageStoreResultIsSafe(anonymousIncrementResult);
    mod.assertSimilarityUsageStoreResultIsSafe(freshDailyResult);
    mod.assertSimilarityUsageStoreResultIsSafe(atDailyLimitResult);
    mod.assertSimilarityUsageStoreResultIsSafe(betaPartialSnapshotResult);
    mod.assertSimilarityUsageStoreResultIsSafe(betaPartialIncrementResult);
    mod.assertSimilarityUsageStoreResultIsSafe(betaAtMonthlyLimitSnapshotResult);
    mod.assertSimilarityUsageStoreResultIsSafe(betaAtMonthlyLimitIncrementResult);
    mod.assertSimilarityUsageStoreResultIsSafe(ownerPartialIncrementResult);
    mod.assertSimilarityUsageStoreResultIsSafe(adminPartialIncrementResult);
    mod.assertSimilarityUsageStoreResultIsSafe(mismatchIgnoredResult);
    mod.assertSimilarityUsageStoreResultIsSafe(claimIgnoredResult);
  } finally {
    globalThis.fetch = originalFetch;
  }

  // --- A. Default disabled policy. ---
  const defaultPolicy = mod.buildDefaultSimilarityUsageStorePolicy();
  assertEqual(defaultPolicy.enabled, false, 'Default policy enabled');
  assertEqual(defaultPolicy.allowMockedUsageRead, false, 'Default policy allowMockedUsageRead');
  assertEqual(defaultPolicy.allowMockedUsageIncrement, false, 'Default policy allowMockedUsageIncrement');
  assertEqual(defaultPolicy.allowRealUsageStore, false, 'Default policy allowRealUsageStore');
  assertEqual(defaultPolicy.resetTimezone, 'Asia/Seoul', 'Default policy resetTimezone');
  assertEqual(defaultSnapshotResult.status, 'disabled', 'Default snapshot result status');
  assertEqual(defaultSnapshotResult.ok, false, 'Default snapshot result ok');
  assertEqual(defaultSnapshotResult.usage, null, 'Default snapshot result usage');
  assertEqual(defaultIncrementResult.status, 'disabled', 'Default increment result status');
  assertEqual(defaultIncrementResult.ok, false, 'Default increment result ok');
  assertEqual(defaultIncrementResult.event, null, 'Default increment result event');

  // --- Mocked scaffold policy still grants no real capability. ---
  const mockedPolicy = mod.buildMockedSimilarityUsageStorePolicy();
  assertEqual(mockedPolicy.enabled, true, 'Mocked policy enabled');
  assertEqual(mockedPolicy.allowMockedUsageRead, true, 'Mocked policy allowMockedUsageRead');
  assertEqual(mockedPolicy.allowMockedUsageIncrement, true, 'Mocked policy allowMockedUsageIncrement');
  assertEqual(mockedPolicy.allowRealUsageStore, false, 'Mocked policy allowRealUsageStore');
  assertEqual(mockedPolicy.allowSupabaseClient, false, 'Mocked policy allowSupabaseClient');
  assertEqual(mockedPolicy.allowEnvRead, false, 'Mocked policy allowEnvRead');
  assertEqual(mockedPolicy.allowDbRead, false, 'Mocked policy allowDbRead');
  assertEqual(mockedPolicy.allowDbWrite, false, 'Mocked policy allowDbWrite');
  assertEqual(mockedPolicy.allowSql, false, 'Mocked policy allowSql');
  assertEqual(mockedPolicy.allowCookieRead, false, 'Mocked policy allowCookieRead');
  assertEqual(mockedPolicy.allowHeaderRead, false, 'Mocked policy allowHeaderRead');
  assertEqual(mockedPolicy.allowClientClaimedRole, false, 'Mocked policy allowClientClaimedRole');
  assertEqual(mockedPolicy.allowClientClaimedUsage, false, 'Mocked policy allowClientClaimedUsage');
  assertEqual(mockedPolicy.allowAnonymousExecution, false, 'Mocked policy allowAnonymousExecution');
  assertEqual(mockedPolicy.allowRouteSuccess, false, 'Mocked policy allowRouteSuccess');
  assertEqual(mockedPolicy.allowPublicExecution, false, 'Mocked policy allowPublicExecution');
  assertEqual(mockedPolicy.allowBetaExecution, false, 'Mocked policy allowBetaExecution');
  assertEqual(mockedPolicy.resetTimezone, 'Asia/Seoul', 'Mocked policy resetTimezone');

  // --- B. Approved limit table. ---
  assertEqual(mod.getApprovedSimilarityUsageLimit('anonymous', 'daily'), 0, 'Anonymous daily limit');
  assertEqual(mod.getApprovedSimilarityUsageLimit('anonymous', 'monthly'), 0, 'Anonymous monthly limit');
  assertEqual(mod.getApprovedSimilarityUsageLimit('authenticated', 'daily'), 3, 'Authenticated daily limit');
  assertEqual(mod.getApprovedSimilarityUsageLimit('authenticated', 'monthly'), 30, 'Authenticated monthly limit');
  assertEqual(mod.getApprovedSimilarityUsageLimit('beta', 'daily'), 10, 'Beta daily limit');
  assertEqual(mod.getApprovedSimilarityUsageLimit('beta', 'monthly'), 100, 'Beta monthly limit');
  assertEqual(mod.getApprovedSimilarityUsageLimit('owner', 'daily'), 50, 'Owner daily limit');
  assertEqual(mod.getApprovedSimilarityUsageLimit('owner', 'monthly'), 1000, 'Owner monthly limit');
  assertEqual(mod.getApprovedSimilarityUsageLimit('admin', 'daily'), 100, 'Admin daily limit');
  assertEqual(mod.getApprovedSimilarityUsageLimit('admin', 'monthly'), 3000, 'Admin monthly limit');

  // --- C. Anonymous role. ---
  assertEqual(anonymousSnapshotResult.status, 'anonymous_blocked', 'Anonymous snapshot result status');
  assertEqual(anonymousSnapshotResult.ok, false, 'Anonymous snapshot result ok');
  assertEqual(anonymousSnapshotResult.usage, null, 'Anonymous snapshot result usage');
  assertEqual(anonymousIncrementResult.status, 'increment_blocked', 'Anonymous increment result status');
  assertEqual(anonymousIncrementResult.ok, false, 'Anonymous increment result ok');
  assertEqual(anonymousIncrementResult.event, null, 'Anonymous increment result event');

  // --- D. Authenticated fresh daily snapshot. ---
  assertEqual(freshDailyResult.status, 'loaded', 'Fresh daily result status');
  assertEqual(freshDailyResult.ok, true, 'Fresh daily result ok');
  assertEqual(freshDailyResult.role, 'authenticated', 'Fresh daily result role');
  assertEqual(freshDailyResult.window, 'daily', 'Fresh daily result window');
  assertEqual(freshDailyResult.usage?.used, 0, 'Fresh daily result usage.used');
  assertEqual(freshDailyResult.usage?.limit, 3, 'Fresh daily result usage.limit');
  assertEqual(freshDailyResult.usage?.remaining, 3, 'Fresh daily result usage.remaining');
  assertEqual(freshDailyResult.usage?.isLimitReached, false, 'Fresh daily result usage.isLimitReached');

  // --- E. Authenticated at daily limit. ---
  assertEqual(atDailyLimitResult.status, 'limit_reached', 'At-limit result status');
  assertEqual(atDailyLimitResult.ok, true, 'At-limit result ok');
  assertEqual(atDailyLimitResult.usage?.used, 3, 'At-limit result usage.used');
  assertEqual(atDailyLimitResult.usage?.limit, 3, 'At-limit result usage.limit');
  assertEqual(atDailyLimitResult.usage?.remaining, 0, 'At-limit result usage.remaining');
  const atDailyLimitIncrementResult = mod.recordSimilarityUsageIncrement(
    mod.buildMockedAuthenticatedAtDailyLimitUsageStoreInput(),
    mockedPolicy,
  );
  assertEqual(atDailyLimitIncrementResult.status, 'increment_blocked', 'At-limit increment result status');
  assertEqual(atDailyLimitIncrementResult.ok, false, 'At-limit increment result ok');
  assertEqual(atDailyLimitIncrementResult.after, null, 'At-limit increment result after');

  // --- F. Beta partial daily increment. ---
  assertEqual(betaPartialSnapshotResult.status, 'loaded', 'Beta partial snapshot result status');
  assertEqual(betaPartialIncrementResult.status, 'increment_recorded', 'Beta partial increment result status');
  assertEqual(betaPartialIncrementResult.ok, true, 'Beta partial increment result ok');
  assertEqual(betaPartialIncrementResult.before?.used, 4, 'Beta partial increment result before.used');
  assertEqual(betaPartialIncrementResult.after?.used, 5, 'Beta partial increment result after.used');
  assertEqual(betaPartialIncrementResult.after?.remaining, 5, 'Beta partial increment result after.remaining');
  assertTrue(betaPartialIncrementResult.event !== null, 'Beta partial increment result event exists');
  assertEqual(betaPartialIncrementResult.event?.incrementBy, 1, 'Beta partial increment result event.incrementBy');
  assertEqual(betaPartialIncrementResult.event?.guardStatus, 'allowed', 'Beta partial increment result event.guardStatus');

  // --- G. Beta monthly at limit. ---
  assertEqual(betaAtMonthlyLimitSnapshotResult.status, 'limit_reached', 'Beta monthly at-limit snapshot result status');
  assertEqual(betaAtMonthlyLimitIncrementResult.status, 'increment_blocked', 'Beta monthly at-limit increment result status');
  assertEqual(betaAtMonthlyLimitIncrementResult.ok, false, 'Beta monthly at-limit increment result ok');
  assertEqual(betaAtMonthlyLimitIncrementResult.after, null, 'Beta monthly at-limit increment result after');

  // --- H. Owner partial daily increment. ---
  assertEqual(ownerPartialIncrementResult.status, 'increment_recorded', 'Owner partial increment result status');
  assertEqual(ownerPartialIncrementResult.before?.limit, 50, 'Owner partial increment result before.limit');
  assertEqual(ownerPartialIncrementResult.after?.used, 25, 'Owner partial increment result after.used');

  // --- I. Admin partial monthly increment. ---
  assertEqual(adminPartialIncrementResult.status, 'increment_recorded', 'Admin partial increment result status');
  assertEqual(adminPartialIncrementResult.before?.limit, 3000, 'Admin partial increment result before.limit');
  assertEqual(adminPartialIncrementResult.after?.used, 1510, 'Admin partial increment result after.used');

  // --- J. Counter mismatch ignored. ---
  assertEqual(mismatchIgnoredResult.status, 'loaded', 'Mismatch-ignored result status');
  assertEqual(mismatchIgnoredResult.usage?.used, 0, 'Mismatch-ignored result usage.used must fall back to zero');
  assertEqual(mismatchIgnoredResult.usage?.limit, 3, 'Mismatch-ignored result usage.limit must use the approved limit');
  assertTrue(
    mismatchIgnoredResult.warnings.includes('counter_ignored'),
    'Mismatch-ignored result warnings must include counter_ignored',
  );

  // --- K. Client-claimed usage/role ignored. ---
  assertEqual(claimIgnoredResult.role, 'authenticated', 'Claim-ignored result role must never become admin');
  assertEqual(claimIgnoredResult.usage?.used, 0, 'Claim-ignored result usage.used must not be affected by the claim');
  assertEqual(claimIgnoredResult.usage?.limit, 3, 'Claim-ignored result usage.limit must use the approved authenticated limit');
  assertTrue(
    claimIgnoredResult.warnings.includes('client_claim_ignored'),
    'Claim-ignored result warnings must include client_claim_ignored',
  );

  // --- L. Runtime safety. ---
  assertTrue(!fetchCalled, 'fetch must never be called by the usage store scaffold');
  const bundledCode = stripComments(bundledSource);
  assertTrue(!/@supabase/.test(bundledCode), 'Bundled usage store module must not import a Supabase package');
  assertTrue(!/process\.env(\.\w+|\[)/.test(bundledCode), 'Bundled usage store module must not access process.env');
  assertTrue(
    !/kisOhlcProvider|serverOnlyKisOhlcProvider|mockedKisOhlcAdapter/.test(bundledCode),
    'Bundled usage store module must not import a KIS provider module',
  );
  assertTrue(
    !/pages[\\/]api|similarityApiRouteShell/.test(bundledCode),
    'Bundled usage store module must not import an API route module',
  );
  assertTrue(
    !/\bCREATE TABLE\b|\bINSERT INTO\b|\/migrations\//i.test(bundledCode),
    'Bundled usage store module must not contain SQL or migration references',
  );

  // Source-level safety check against the actual on-disk usage store file (not just the bundle).
  const usageStoreCode = stripComments(readFileSync('src/lib/server/chartSimilarity/similarityUsageStore.ts', 'utf8'));
  assertTrue(!/@supabase/.test(usageStoreCode), 'Usage store source must not import a Supabase package');
  assertTrue(!/process\.env(\.\w+|\[)/.test(usageStoreCode), 'Usage store source must not access process.env');
  assertTrue(
    !/document\.cookie|req\.headers|request\.headers/.test(usageStoreCode),
    'Usage store source must not read cookies/headers',
  );
  assertTrue(!/\bfetch\(/.test(usageStoreCode), 'Usage store source must not call fetch');

  if (failures.length > 0) {
    process.stdout.write(`Phase 3FC-E smoke: FAIL (${failures.length}/${assertionCount} assertions failed)\n`);
    for (const failure of failures) {
      process.stdout.write(`  - ${failure}\n`);
    }
    return 1;
  }

  process.stdout.write(`Phase 3FC-E smoke: PASS (${assertionCount}/${assertionCount} assertions passed)\n`);
  return 0;
};

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    process.stdout.write('Phase 3FC-E smoke: FAIL\n');
    process.stdout.write(`reason: ${error && error.message ? error.message : 'smoke script error'}\n`);
    process.exitCode = 1;
  });
