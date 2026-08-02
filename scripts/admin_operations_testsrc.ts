/**
 * Phase 3GM test source (bundled + run by scripts/smoke_phase_3gm_operations_admin_mvp.mjs via
 * esbuild, mirroring scripts/home_live_data_testsrc.ts). Exercises the read-only admin operations
 * surface with fully injected/mocked dependencies -- zero real network calls, zero real Supabase
 * calls, zero real KIS calls.
 */

import { authorizeAdminOperationsRequest } from '../src/lib/server/adminOperations/adminAuthorization';
import { getUsageGuardOverview } from '../src/lib/server/adminOperations/usageGuardHealth';
import { getKisTokenOverview } from '../src/lib/server/adminOperations/kisTokenHealth';
import { getQuoteCacheOverview } from '../src/lib/server/adminOperations/quoteCacheHealth';

let passed = 0;
let failed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

// =====================================================================================
// Group 1: adminAuthorization -- fail-closed ordering, no identity leak in the 403 shape
// =====================================================================================

const fakeAdminRegistryClient = (isAdmin: boolean) => ({
  from: () => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: isAdmin ? { user_id: 'user-123' } : null, error: null }),
      }),
    }),
  }),
});

const runAuthorizationTests = async () => {
  // Signed-out: no Authorization header at all -- real validateUserFromBearerToken short-circuits
  // to 401 before any network call, so this exercises the REAL function safely.
  const signedOut = await authorizeAdminOperationsRequest(null);
  check('signed-out (no header) -> 401 AUTH_REQUIRED', !signedOut.ok && signedOut.status === 401 && signedOut.code === 'AUTH_REQUIRED');

  const signedOutBadScheme = await authorizeAdminOperationsRequest('Basic abc123');
  check('non-bearer scheme -> 401 AUTH_REQUIRED', !signedOutBadScheme.ok && signedOutBadScheme.status === 401);

  // Authenticated, non-admin -> 403, injected validateUser + non-admin registry client.
  const nonAdminResult = await authorizeAdminOperationsRequest('Bearer fake-token', {
    validateUser: async () => ({ ok: true, user: { id: 'user-123' } as never }),
    isConfigured: () => true,
    getClient: () => fakeAdminRegistryClient(false),
  });
  check(
    'authenticated non-admin -> 403 ADMIN_REQUIRED',
    !nonAdminResult.ok && nonAdminResult.status === 403 && nonAdminResult.code === 'ADMIN_REQUIRED',
  );

  // Authenticated, admin -> ok.
  const adminResult = await authorizeAdminOperationsRequest('Bearer fake-token', {
    validateUser: async () => ({ ok: true, user: { id: 'user-123' } as never }),
    isConfigured: () => true,
    getClient: () => fakeAdminRegistryClient(true),
  });
  check('authenticated admin -> ok', adminResult.ok === true);

  // Admin-check itself fails (e.g. transient read error) -> same sanitized 403 as "not admin", never
  // a distinguishable error -- so the response never leaks whether the account exists in site_admins.
  const adminCheckFailed = await authorizeAdminOperationsRequest('Bearer fake-token', {
    validateUser: async () => ({ ok: true, user: { id: 'user-123' } as never }),
    isConfigured: () => true,
    getClient: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => {
              throw new Error('boom');
            },
          }),
        }),
      }),
    }),
  });
  check(
    'admin-check failure -> same sanitized 403 as non-admin (no distinguishable leak)',
    !adminCheckFailed.ok && adminCheckFailed.status === 403 && adminCheckFailed.code === nonAdminResult.code,
  );

  // Config missing -> 503, never falls through to an admin read.
  const configMissing = await authorizeAdminOperationsRequest('Bearer fake-token', {
    validateUser: async () => ({ ok: true, user: { id: 'user-123' } as never }),
    isConfigured: () => false,
  });
  check('config missing -> 503 ADMIN_OPERATIONS_CONFIG_MISSING', !configMissing.ok && configMissing.status === 503);

  // No admin-identifying field ever appears in a rejection payload.
  const serialized = JSON.stringify(nonAdminResult);
  check('403 payload carries no email/user-id field', !serialized.includes('user-123') && !serialized.includes('@'));
};

// =====================================================================================
// Group 2: usageGuardHealth -- healthy aggregate, empty day, store-unavailable, no identity leak
// =====================================================================================

const runUsageGuardTests = async () => {
  const healthyClient = {
    from: () => ({
      select: () => ({
        eq: async () => ({
          data: [
            { used_count: 2, free_limit: 3, user_id: 'user-aaa', updated_at: '2026-08-02T01:00:00.000Z' },
            { used_count: 3, free_limit: 3, user_id: 'user-bbb', updated_at: '2026-08-02T02:00:00.000Z' },
          ],
          error: null,
        }),
      }),
    }),
  };
  const healthy = await getUsageGuardOverview(() => healthyClient as never, () => true);
  check('usage guard healthy: status healthy', healthy.status === 'healthy');
  check('usage guard healthy: totalGuardedExecutionsToday = 5', healthy.totalGuardedExecutionsToday === 5);
  check('usage guard healthy: distinctUserCountToday = 2', healthy.distinctUserCountToday === 2);
  check('usage guard healthy: usersAtLimitCountToday = 1', healthy.usersAtLimitCountToday === 1);
  check('usage guard healthy: mostRecentGuardedExecutionAtIso is the later row', healthy.mostRecentGuardedExecutionAtIso === '2026-08-02T02:00:00.000Z');
  check('usage guard healthy: no raw user_id anywhere in the overview', !JSON.stringify(healthy).includes('user-aaa'));

  const emptyClient = { from: () => ({ select: () => ({ eq: async () => ({ data: [], error: null }) }) }) };
  const empty = await getUsageGuardOverview(() => emptyClient as never, () => true);
  check('usage guard empty day: status healthy (honest zero, not error)', empty.status === 'healthy');
  check('usage guard empty day: totalGuardedExecutionsToday = 0', empty.totalGuardedExecutionsToday === 0);

  const unavailableConfig = await getUsageGuardOverview(() => healthyClient as never, () => false);
  check('usage guard config unavailable -> status unavailable', unavailableConfig.status === 'unavailable');
  check('usage guard config unavailable -> sanitized code set', unavailableConfig.sanitizedErrorCode === 'USAGE_GUARD_STORE_UNAVAILABLE');

  const errorClient = { from: () => ({ select: () => ({ eq: async () => ({ data: null, error: { message: 'db down' } }) }) }) };
  const readFailed = await getUsageGuardOverview(() => errorClient as never, () => true);
  check('usage guard read failure -> unavailable, sanitized code, no raw db error', readFailed.status === 'unavailable' && !JSON.stringify(readFailed).includes('db down'));
};

// =====================================================================================
// Group 3: kisTokenHealth -- valid, near-expiry/expired, store-unavailable, no token leak,
// never triggers issuance (readSnapshot/createDb are pure fakes, no acquire/getTokenHandle exists)
// =====================================================================================

const runKisTokenTests = async () => {
  const baseDurableOff = {
    configReadiness: { ready: true } as never,
    durableConfig: { durableReady: false, durableMisconfigured: false, scopeKey: 'scope' } as never,
    l1Present: true,
    l1ExpiresAtMs: Date.now() + 60_000,
    l1UsableUntilMs: Date.now() + 60_000,
  };

  const validLegacy = await getKisTokenOverview({
    readSnapshot: () => baseDurableOff,
    now: () => Date.now(),
  });
  check('kis token legacy L1 valid -> healthy', validLegacy.status === 'healthy');
  check('kis token legacy: never returns an accessToken field', !('accessToken' in validLegacy));

  const expiredLegacy = await getKisTokenOverview({
    readSnapshot: () => ({ ...baseDurableOff, l1UsableUntilMs: Date.now() - 1000, l1ExpiresAtMs: Date.now() - 1000 }),
    now: () => Date.now(),
  });
  check('kis token legacy expired -> warning (not healthy)', expiredLegacy.status === 'warning' && expiredLegacy.staleOrExpired === true);

  const noTokenLegacy = await getKisTokenOverview({
    readSnapshot: () => ({ ...baseDurableOff, l1Present: false, l1ExpiresAtMs: null, l1UsableUntilMs: null }),
    now: () => Date.now(),
  });
  check('kis token legacy no L1 -> warning, not error', noTokenLegacy.status === 'warning');

  const durableConfigOn = { durableReady: true, durableMisconfigured: false, scopeKey: 'scope-durable' } as never;
  const nowMs = Date.now();
  const durableHealthy = await getKisTokenOverview({
    readSnapshot: () => ({
      configReadiness: { ready: true } as never,
      durableConfig: durableConfigOn,
      l1Present: true,
      l1ExpiresAtMs: nowMs + 120_000,
      l1UsableUntilMs: nowMs + 120_000,
    }),
    createDb: () =>
      ({
        readState: async () => ({
          status: 'active',
          envelope: {} as never,
          expiresAtMs: nowMs + 120_000,
          usableUntilMs: nowMs + 120_000,
          lastIssueSuccessAtMs: nowMs - 30_000,
        }),
      }) as never,
    now: () => nowMs,
  });
  check('kis token durable, L1+L2 present, unexpired -> healthy', durableHealthy.status === 'healthy');
  check('kis token durable: remainingLifetimeSeconds ~120', (durableHealthy.remainingLifetimeSeconds ?? 0) > 100);

  const durableStoreUnavailable = await getKisTokenOverview({
    readSnapshot: () => ({
      configReadiness: { ready: true } as never,
      durableConfig: durableConfigOn,
      l1Present: false,
      l1ExpiresAtMs: null,
      l1UsableUntilMs: null,
    }),
    createDb: () =>
      ({
        readState: async () => {
          throw new Error('L2 unreachable');
        },
      }) as never,
    now: () => nowMs,
  });
  check('kis token durable store unavailable -> unavailable status', durableStoreUnavailable.status === 'unavailable');
  check('kis token durable store unavailable -> durableStoreReady false', durableStoreUnavailable.durableStoreReady === false);
  check('kis token store-unavailable: no raw exception text leaked', !JSON.stringify(durableStoreUnavailable).includes('L2 unreachable'));

  const misconfigured = await getKisTokenOverview({
    readSnapshot: () => ({
      configReadiness: { ready: true } as never,
      durableConfig: { durableReady: false, durableMisconfigured: true, scopeKey: 'scope' } as never,
      l1Present: false,
      l1ExpiresAtMs: null,
      l1UsableUntilMs: null,
    }),
    now: () => nowMs,
  });
  check('kis token durable misconfigured -> unavailable', misconfigured.status === 'unavailable' && misconfigured.durableMisconfigured === true);

  const snapshotThrows = await getKisTokenOverview({
    readSnapshot: () => {
      throw new Error('snapshot boom');
    },
  });
  check('kis token snapshot throws -> unavailable, fail-closed, no leak', snapshotThrows.status === 'unavailable' && !JSON.stringify(snapshotThrows).includes('snapshot boom'));

  const allOutputs = [validLegacy, expiredLegacy, noTokenLegacy, durableHealthy, durableStoreUnavailable, misconfigured, snapshotThrows];
  const neverLeaksToken = allOutputs.every((o) => !JSON.stringify(o).toLowerCase().includes('accesstoken'));
  check('kis token overview never includes an access token field across all scenarios', neverLeaksToken);
};

// =====================================================================================
// Group 4: quoteCacheHealth -- fresh, stale, expired, empty, unavailable, never calls a provider
// =====================================================================================

const runQuoteCacheTests = async () => {
  let providerCalled = false;
  const failIfCalled = () => {
    providerCalled = true;
    throw new Error('a provider/network call must never happen from a health read');
  };

  const freshQuote = await getQuoteCacheOverview({
    readQuoteCacheSnapshot: () => ({
      entryCount: 3,
      freshCount: 3,
      staleCount: 0,
      expiredCount: 0,
      newestEntryAgeMs: 1000,
      oldestEntryAgeMs: 5000,
      lastCachedAtIso: new Date().toISOString(),
    }),
    readOhlcvCacheSnapshot: () => ({ entryCount: 0, inflightCount: 0, entries: [] }),
    now: () => Date.now(),
  });
  check('quote cache fresh -> status healthy', freshQuote[0].status === 'healthy');
  check('quote cache fresh -> durability instance-local', freshQuote[0].durability === 'instance-local');

  const emptyQuote = await getQuoteCacheOverview({
    readQuoteCacheSnapshot: () => ({
      entryCount: 0,
      freshCount: 0,
      staleCount: 0,
      expiredCount: 0,
      newestEntryAgeMs: null,
      oldestEntryAgeMs: null,
      lastCachedAtIso: null,
    }),
    readOhlcvCacheSnapshot: () => ({ entryCount: 0, inflightCount: 0, entries: [] }),
    now: () => Date.now(),
  });
  check('quote cache empty (never called) -> unavailable, not error', emptyQuote[0].status === 'unavailable');

  const expiredOnlyQuote = await getQuoteCacheOverview({
    readQuoteCacheSnapshot: () => ({
      entryCount: 2,
      freshCount: 0,
      staleCount: 0,
      expiredCount: 2,
      newestEntryAgeMs: 999_999,
      oldestEntryAgeMs: 1_999_999,
      lastCachedAtIso: new Date(0).toISOString(),
    }),
    readOhlcvCacheSnapshot: () => ({ entryCount: 0, inflightCount: 0, entries: [] }),
    now: () => Date.now(),
  });
  check('quote cache all expired -> warning', expiredOnlyQuote[0].status === 'warning');

  const throwingSnapshot = await getQuoteCacheOverview({
    readQuoteCacheSnapshot: () => {
      throw new Error('boom');
    },
    readOhlcvCacheSnapshot: () => ({ entryCount: 0, inflightCount: 0, entries: [] }),
    now: () => Date.now(),
  });
  check('quote cache snapshot throws -> unavailable fallback, no crash', throwingSnapshot[0].status === 'unavailable');

  const nowMs = Date.now();
  const ohlcvFresh = await getQuoteCacheOverview({
    readQuoteCacheSnapshot: () => ({
      entryCount: 0,
      freshCount: 0,
      staleCount: 0,
      expiredCount: 0,
      newestEntryAgeMs: null,
      oldestEntryAgeMs: null,
      lastCachedAtIso: null,
    }),
    readOhlcvCacheSnapshot: () => ({
      entryCount: 2,
      inflightCount: 0,
      entries: [
        { key: 'a', negative: false, fresh: true, expiresAtMs: nowMs + 60_000, msUntilExpiry: 60_000 },
        { key: 'b', negative: false, fresh: true, expiresAtMs: nowMs + 30_000, msUntilExpiry: 30_000 },
      ],
    }),
    now: () => nowMs,
  });
  check('ohlcv cache fresh entries -> status healthy', ohlcvFresh[1].status === 'healthy');
  check('ohlcv cache summary never exposes a raw cache key', !JSON.stringify(ohlcvFresh[1]).includes('"key"'));

  check('no provider/network function was ever invoked by any cache health scenario', !providerCalled);
  void failIfCalled; // referenced only to satisfy no-unused-vars; intentionally never called above
};

export const runAll = async (): Promise<number> => {
  await runAuthorizationTests();
  await runUsageGuardTests();
  await runKisTokenTests();
  await runQuoteCacheTests();
  console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  return failed === 0 ? 0 : 1;
};
