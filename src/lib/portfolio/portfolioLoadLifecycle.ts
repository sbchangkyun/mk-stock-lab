/**
 * Phase 4F (F-MED-01) — pure, DOM-free decisions for the Portfolio page's data-load lifecycle.
 * portfolio.astro owns all DOM/network/state mutation; this module only computes what a given
 * lifecycle event SHOULD do, so the dedup/cache/TTL policy is testable without a browser.
 *
 * Root causes this module's decisions are designed to eliminate:
 * 1. Portfolio.astro's own init, a direct call from Header.astro's auth sync, and Header's
 *    `mk:auth-state` broadcast each independently drove a full profile+portfolio bootstrap for
 *    the same signed-in session -> decideBootstrapAction.
 * 2. Selecting an already-visited portfolio tab always refetched its positions -> decidePositionsFetch.
 * 3. Every full bootstrap/mutation force-reloaded the aggregate "all portfolios" position set,
 *    even when nothing in it had changed -> decidePositionsFetch (force is now opt-in, not blanket).
 * 4. Valuation had no freshness policy, so switching away and back within seconds re-fetched
 *    real quotes every time -> decideValuationFetch + isValuationFresh.
 */

export type BootstrapAction = 'skip' | 'join' | 'start';

/**
 * Decides what a profile/portfolio bootstrap trigger (initial page load, `mk:profile-bootstrap`
 * 'ready', or `mk:auth-state` 'signed_in') should do. Once a session has successfully reached
 * `ready`, further triggers for the SAME session are no-ops ('skip') instead of re-running the
 * whole chain; a trigger that arrives while a bootstrap is already running joins that one
 * in-flight promise ('join') instead of starting a second, independent one.
 */
export const decideBootstrapAction = (input: {
  readyForSession: boolean;
  inFlight: boolean;
}): BootstrapAction => {
  if (input.readyForSession) return 'skip';
  if (input.inFlight) return 'join';
  return 'start';
};

export type PositionsFetchDecision = 'use-cache' | 'fetch';

/**
 * Decides whether loading a portfolio's positions (single or the `__all_portfolios__` aggregate)
 * can reuse the already-cached client copy. `force` (explicit refresh, or a mutation that
 * actually changed this portfolio's positions) always bypasses the cache; an ordinary tab
 * selection or an unrelated portfolio-metadata mutation should not.
 */
export const decidePositionsFetch = (input: {
  force: boolean;
  hasCachedEntry: boolean;
}): PositionsFetchDecision => (!input.force && input.hasCachedEntry ? 'use-cache' : 'fetch');

export type ValuationFetchDecision = 'use-cache' | 'join-inflight' | 'fetch-background' | 'fetch-foreground';

/**
 * Decides how to (re)load a portfolio's valuation. A fresh cached result (within `ttlMs`) is
 * reused outright. A stale-but-present cached result triggers a background refetch that keeps
 * the old numbers on screen with only a subtle indicator, rather than blanking the view. A
 * concurrent identical request is joined instead of duplicated. Only a portfolio with no prior
 * usable data at all shows the full foreground "loading" state.
 */
export const decideValuationFetch = (input: {
  force: boolean;
  hasCachedResult: boolean;
  cacheAgeMs: number | null;
  ttlMs: number;
  inFlight: boolean;
}): ValuationFetchDecision => {
  if (!input.force && input.hasCachedResult && input.cacheAgeMs !== null && input.cacheAgeMs < input.ttlMs) {
    return 'use-cache';
  }
  if (!input.force && input.inFlight) return 'join-inflight';
  return input.hasCachedResult ? 'fetch-background' : 'fetch-foreground';
};

/** Pure freshness check used by decideValuationFetch's cacheAgeMs computation at the call site. */
export const isValuationFresh = (fetchedAt: number, now: number, ttlMs: number): boolean =>
  now - fetchedAt < ttlMs;

/**
 * Portfolio-metadata mutations (create/update/delete a portfolio itself) never change any
 * existing portfolio's positions, so they must never force a positions refetch -- only a
 * position-level mutation (create/update/delete a position within a portfolio) does, and only
 * for that one portfolio.
 */
export const decideMutationForcesPositionsRefetch = (
  mutationKind: 'portfolio-metadata' | 'position',
): boolean => mutationKind === 'position';
