/**
 * Phase 4F (F-MED-01) test source (bundled + run by
 * scripts/smoke_phase_4f_portfolio_load_lifecycle.mjs via esbuild).
 *
 * Deterministic, DOM-free, network-free unit tests for
 * src/lib/portfolio/portfolioLoadLifecycle.ts -- the pure decision functions portfolio.astro now
 * calls to dedupe the redundant profile/portfolio bootstrap, the missing positions cache-check,
 * and the unbounded valuation refetching that produced the Owner-observed request bursts
 * (23x /api/portfolio/positions, 14x /api/portfolio/valuation, 10x /api/portfolio/portfolios in a
 * single session). Covers the fix's 17 numbered scenarios via the pure lifecycle decisions rather
 * than DOM matching, per instruction.
 */

import {
  decideBootstrapAction,
  decidePositionsFetch,
  decideValuationFetch,
  isValuationFresh,
  decideMutationForcesPositionsRefetch,
} from '../src/lib/portfolio/portfolioLoadLifecycle';

let passed = 0;
let failed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

export const runAll = async () => {
  // 1. Initial load: not ready, nothing in flight -> start a fresh bootstrap.
  check(
    '1. Initial page load starts exactly one bootstrap',
    decideBootstrapAction({ readyForSession: false, inFlight: false }) === 'start',
  );

  // 2. A second trigger (e.g. Header.astro's direct sync) arriving while the first is still
  //    running joins the same in-flight promise instead of starting a duplicate.
  check(
    '2. Concurrent duplicate trigger during an in-flight bootstrap joins it',
    decideBootstrapAction({ readyForSession: false, inFlight: true }) === 'join',
  );

  // 3. A third trigger (e.g. Header's mk:auth-state broadcast) after the session already reached
  //    ready is a pure no-op -- this is the fix for the triple-bootstrap root cause.
  check(
    '3. Duplicate trigger after the session is already ready is a no-op',
    decideBootstrapAction({ readyForSession: true, inFlight: false }) === 'skip',
  );
  check(
    '3b. Already-ready wins even if something else is (impossibly) marked in-flight',
    decideBootstrapAction({ readyForSession: true, inFlight: true }) === 'skip',
  );

  // 4. After a real sign-out resets readyForSession, a subsequent sign-in starts a fresh bootstrap.
  check(
    '4. Post-sign-out state starts a fresh bootstrap on next sign-in',
    decideBootstrapAction({ readyForSession: false, inFlight: false }) === 'start',
  );

  // 5. Selecting an already-visited portfolio tab reuses the cache (no positions refetch).
  check(
    '5. Selecting an already-cached portfolio tab reuses the cache',
    decidePositionsFetch({ force: false, hasCachedEntry: true }) === 'use-cache',
  );

  // 6. Selecting a portfolio never visited this session fetches it.
  check(
    '6. Selecting an uncached portfolio tab fetches it',
    decidePositionsFetch({ force: false, hasCachedEntry: false }) === 'fetch',
  );

  // 7. Explicit refresh always fetches, even for an already-cached portfolio.
  check(
    '7. Explicit refresh bypasses the positions cache',
    decidePositionsFetch({ force: true, hasCachedEntry: true }) === 'fetch',
  );

  // 8. Aggregate ("all portfolios") view: each owned portfolio is decided independently, so
  //    already-cached ones are skipped and only missing ones fetch -- the fix for the
  //    "4 simultaneous positions requests" pattern caused by a blanket force=true.
  check(
    '8a. Aggregate view reuses an already-cached member portfolio',
    decidePositionsFetch({ force: false, hasCachedEntry: true }) === 'use-cache',
  );
  check(
    '8b. Aggregate view still fetches a not-yet-cached member portfolio',
    decidePositionsFetch({ force: false, hasCachedEntry: false }) === 'fetch',
  );

  // 9. A fresh (within-TTL) cached valuation is reused outright -- no network call.
  check(
    '9. Fresh cached valuation is reused without a refetch',
    decideValuationFetch({ force: false, hasCachedResult: true, cacheAgeMs: 5_000, ttlMs: 20_000, inFlight: false }) ===
      'use-cache',
  );

  // 10. An expired cached valuation triggers a BACKGROUND refetch (prior numbers stay visible),
  //     not the full foreground "loading" takeover.
  check(
    '10. Expired cached valuation refetches in the background, keeping prior data visible',
    decideValuationFetch({ force: false, hasCachedResult: true, cacheAgeMs: 25_000, ttlMs: 20_000, inFlight: false }) ===
      'fetch-background',
  );

  // 11. A portfolio with no prior valuation at all shows the real foreground loading state.
  check(
    '11. First-ever valuation load for a portfolio uses the foreground loading state',
    decideValuationFetch({ force: false, hasCachedResult: false, cacheAgeMs: null, ttlMs: 20_000, inFlight: false }) ===
      'fetch-foreground',
  );

  // 12. A second valuation request for the same portfolio while one is already in flight joins it
  //     instead of firing a duplicate concurrent request.
  check(
    '12. Concurrent valuation request for the same portfolio joins the in-flight one',
    decideValuationFetch({ force: false, hasCachedResult: false, cacheAgeMs: null, ttlMs: 20_000, inFlight: true }) ===
      'join-inflight',
  );

  // 13. Explicit force always starts a real fetch, regardless of a fresh cache or an in-flight
  //     request -- explicit refresh must never silently no-op.
  check(
    '13a. force=true overrides a fresh cache',
    decideValuationFetch({ force: true, hasCachedResult: true, cacheAgeMs: 1_000, ttlMs: 20_000, inFlight: false }) !==
      'use-cache',
  );
  check(
    '13b. force=true overrides an in-flight join',
    decideValuationFetch({ force: true, hasCachedResult: false, cacheAgeMs: null, ttlMs: 20_000, inFlight: true }) !==
      'join-inflight',
  );

  // 14. isValuationFresh boundary correctness.
  check('14a. Age strictly below the TTL is fresh', isValuationFresh(1_000, 1_000 + 19_999, 20_000) === true);
  check('14b. Age at or beyond the TTL is not fresh', isValuationFresh(1_000, 1_000 + 20_000, 20_000) === false);

  // 15. A portfolio-metadata mutation (rename/create/delete the portfolio itself) never forces a
  //     positions refetch -- positions are unaffected by a metadata-only change (§3E).
  check(
    '15. Portfolio-metadata mutation does not force a positions refetch',
    decideMutationForcesPositionsRefetch('portfolio-metadata') === false,
  );

  // 16. A position-level mutation (create/update/delete a position) always forces a refetch for
  //     its own portfolio -- the data genuinely changed and stale cache must not be served back.
  check(
    '16. Position mutation forces a positions refetch',
    decideMutationForcesPositionsRefetch('position') === true,
  );

  // 17. Edge case: force=true with no prior cached result at all still resolves to the correct
  //     foreground-loading fetch decision (no crash, no false cache hit).
  check(
    '17. force=true with no prior cache still resolves to foreground loading',
    decideValuationFetch({ force: true, hasCachedResult: false, cacheAgeMs: null, ttlMs: 20_000, inFlight: false }) ===
      'fetch-foreground',
  );

  console.log(`\nphase_4f_portfolio_load_lifecycle_testsrc: ${passed} passed, ${failed} failed`);
  return failed === 0 ? 0 : 1;
};
