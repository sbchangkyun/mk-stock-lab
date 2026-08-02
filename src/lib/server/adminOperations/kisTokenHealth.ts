/**
 * Phase 3GM: read-only KIS durable-token health view.
 *
 * Reuses the EXISTING durable token manager metadata:
 *  - L1 (process memory) presence via the new, additive `getKisTokenHealthSnapshot()` accessor in
 *    src/lib/server/providers/kisClient.ts, which itself calls the existing test/inspection-only
 *    `peekL1()` on the same warm-instance token-manager singleton the real request paths use. It
 *    never calls getTokenHandle/acquire, so reading this can never trigger a token issuance/refresh.
 *  - L2 (durable Supabase store) presence via the EXISTING `createSupabaseKisTokenDb().readState()`
 *    read path (src/lib/server/providers/kis/kisTokenStore.ts) -- a plain read, no lease/issue call.
 *
 * The plaintext access token is never read into this module and never appears in the returned
 * overview -- only presence booleans and non-secret expiry/lifetime metadata.
 */

import { getKisTokenHealthSnapshot } from '../providers/kisClient';
import { createSupabaseKisTokenDb, type KisTokenDb } from '../providers/kis/kisTokenStore';
import type { KisTokenOverview } from './types';

export type KisTokenHealthDeps = {
  readSnapshot: typeof getKisTokenHealthSnapshot;
  createDb: () => KisTokenDb;
  now: () => number;
};

const defaultDeps: KisTokenHealthDeps = {
  readSnapshot: getKisTokenHealthSnapshot,
  createDb: () => createSupabaseKisTokenDb(),
  now: () => Date.now(),
};

export const getKisTokenOverview = async (
  deps: Partial<KisTokenHealthDeps> = {},
): Promise<KisTokenOverview> => {
  const { readSnapshot, createDb, now } = { ...defaultDeps, ...deps };

  let snapshot: ReturnType<typeof getKisTokenHealthSnapshot>;
  try {
    snapshot = readSnapshot();
  } catch {
    return {
      status: 'unavailable',
      kisConfigReady: false,
      durableStoreReady: false,
      durableMisconfigured: false,
      l1TokenPresent: false,
      l2TokenPresent: false,
      tokenExpiresAtIso: null,
      remainingLifetimeSeconds: null,
      staleOrExpired: true,
      lastIssueOrReuseAtIso: null,
      sanitizedErrorCode: 'KIS_TOKEN_HEALTH_SNAPSHOT_FAILED',
    };
  }

  const nowMs = now();
  const kisConfigReady = snapshot.configReadiness.ready;
  const durableConfig = snapshot.durableConfig;

  if (!durableConfig.durableReady) {
    // Durable mode OFF (legacy L1-only) or misconfigured -- only L1 presence is meaningful; L2 is
    // never read in this mode (reading it would imply a durable contract that isn't active).
    const l1Present = snapshot.l1Present;
    const staleOrExpired = !l1Present || (snapshot.l1UsableUntilMs !== null && nowMs >= snapshot.l1UsableUntilMs);
    return {
      status: durableConfig.durableMisconfigured
        ? 'unavailable'
        : !kisConfigReady
          ? 'unavailable'
          : l1Present && !staleOrExpired
            ? 'healthy'
            : 'warning',
      kisConfigReady,
      durableStoreReady: false,
      durableMisconfigured: durableConfig.durableMisconfigured,
      l1TokenPresent: l1Present,
      l2TokenPresent: false,
      tokenExpiresAtIso: snapshot.l1ExpiresAtMs === null ? null : new Date(snapshot.l1ExpiresAtMs).toISOString(),
      remainingLifetimeSeconds:
        snapshot.l1ExpiresAtMs === null ? null : Math.max(0, Math.round((snapshot.l1ExpiresAtMs - nowMs) / 1000)),
      staleOrExpired,
      lastIssueOrReuseAtIso: null,
      sanitizedErrorCode: durableConfig.durableMisconfigured ? 'KIS_TOKEN_DURABLE_MISCONFIGURED' : null,
    };
  }

  let l2Present = false;
  let l2ExpiresAtMs: number | null = null;
  let l2UsableUntilMs: number | null = null;
  let lastIssueSuccessAtMs: number | null = null;
  let l2ReadFailed = false;
  try {
    const state = await createDb().readState(durableConfig.scopeKey);
    if (state && state.envelope && state.status !== 'invalidated') {
      l2Present = true;
      l2ExpiresAtMs = state.expiresAtMs;
      l2UsableUntilMs = state.usableUntilMs;
    }
    lastIssueSuccessAtMs = state?.lastIssueSuccessAtMs ?? null;
  } catch {
    l2ReadFailed = true;
  }

  const effectiveExpiresAtMs = snapshot.l1Present ? snapshot.l1ExpiresAtMs : l2ExpiresAtMs;
  const effectiveUsableUntilMs = snapshot.l1Present ? snapshot.l1UsableUntilMs : l2UsableUntilMs;
  const tokenPresent = snapshot.l1Present || l2Present;
  const staleOrExpired =
    !tokenPresent || (effectiveUsableUntilMs !== null && nowMs >= effectiveUsableUntilMs);

  const status: KisTokenOverview['status'] = l2ReadFailed
    ? 'unavailable'
    : !kisConfigReady
      ? 'unavailable'
      : tokenPresent && !staleOrExpired
        ? 'healthy'
        : tokenPresent
          ? 'warning'
          : 'warning';

  return {
    status,
    kisConfigReady,
    durableStoreReady: !l2ReadFailed,
    durableMisconfigured: false,
    l1TokenPresent: snapshot.l1Present,
    l2TokenPresent: l2Present,
    tokenExpiresAtIso: effectiveExpiresAtMs === null ? null : new Date(effectiveExpiresAtMs).toISOString(),
    remainingLifetimeSeconds:
      effectiveExpiresAtMs === null ? null : Math.max(0, Math.round((effectiveExpiresAtMs - nowMs) / 1000)),
    staleOrExpired,
    lastIssueOrReuseAtIso: lastIssueSuccessAtMs === null ? null : new Date(lastIssueSuccessAtMs).toISOString(),
    sanitizedErrorCode: l2ReadFailed ? 'KIS_TOKEN_STORE_READ_FAILED' : null,
  };
};
