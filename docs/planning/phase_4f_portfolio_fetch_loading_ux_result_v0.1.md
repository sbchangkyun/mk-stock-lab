# Phase 4F — Portfolio fetch/loading UX dedup (F-MED-01) — Result v0.1

**Classification: `PHASE_4F_MED01_IMPLEMENTED_PR_READY_PREMERGE_REVIEW_REQUIRED`.**

## 1. Scope

**Fixes exactly one finding: `F-MED-01` (new, first MEDIUM-severity finding recorded for MK Stock
Lab).** Owner observed redundant Portfolio API traffic and intrusive loading-state churn on
`https://mkstocklab.vercel.app/portfolio` in Production: 23x `/api/portfolio/positions`, 14x
`/api/portfolio/valuation`, and 10x `/api/portfolio/portfolios` requests in a single session,
including 4 simultaneous `positions` calls. This phase fixes the **request/loading-UX behavior
only** — no scoring, valuation math, identity resolution, or auth logic changed.

**Explicitly excluded from this phase (unchanged):**

- `F-HIGH-02`/`PORT-10` (Portfolio Production KR live valuation) — the live-valuation call path in
  `src/pages/api/portfolio/valuation.ts` is untouched; Owner QA on this finding remains PASS as
  already recorded and is not re-verified or re-scored here.
- `F-HIGH-03` (canonical instrument identity, Phase 4F-HF2) — `resolvePositionSubmitIdentity` and
  the canonical resolver/combobox contract are untouched. **This phase does not close F-HIGH-03**;
  it remains Owner-verification-pending exactly as before.
- Phase 4F-UX1-A/A1 (Home surface guard) — untouched.
- PR #25 — untouched, not merged, unrelated to this branch.
- No broad refactor: the fix is four narrowly-scoped changes (bootstrap coalescing, positions
  cache-check, opt-in aggregate force flag, valuation freshness TTL) inside the existing
  `src/pages/portfolio.astro` client script, plus one new pure decision module. No new API routes,
  no schema change, no dependency change.

## 2. Baseline and branch

- **Baseline:** `main` @ `7a40ef8a4154c322362b2192084db6c5004b9d54` (PR #24 / Phase 4F-UX1-A1
  merged; matches the confirmed Production deployment `dpl_FWwp96hnzqHAAQTpcDzoDy9USdm7`).
- **Branch:** `fix/phase-4f-portfolio-fetch-loading-ux`, created from `origin/main` at the baseline
  above.
- No direct push to `main`. No Production environment variable, Supabase schema/data, secret, or
  Vercel project setting was modified. `git status --short` confirms the only tracked-file changes
  are `package.json` and `src/pages/portfolio.astro`, plus four new files (below); the owner-local
  untracked paths (`.agents/`, `.claude/`, `.vscode/settings.json`,
  `docs/handoff/codex_state_inspection/`, `set-gnews-vercel-env.ps1`, `skills-lock.json`) were not
  touched or staged.

## 3. Root Cause 1 — triple independent bootstrap

**Owner-observed symptom:** 10x `/api/portfolio/portfolios` requests in one session; multiple
simultaneous request bursts at page load.

**Root cause:** three independent triggers — the page-load init path, the `mk:profile-bootstrap`
`'ready'` event listener, and the `mk:auth-state` `'signed_in'` event listener — each called the
same portfolio bootstrap loader directly, with no shared state to tell them a bootstrap was already
running or already complete. On a normal sign-in, Header.astro's own sync logic and both those
events fire close together, so all three ran the full bootstrap independently.

**Fix:** a single coalescing entry point, `ensureProfileAndPortfolioReady()`, backed by two new
module-level flags:

- `portfolioReadyForSession: boolean` — set once the first successful bootstrap completes.
- `bootstrapInFlight: Promise<void> | null` — set while a bootstrap is running.

The decision of what a given trigger should do is delegated to the new pure function
`decideBootstrapAction({ readyForSession, inFlight })` in
`src/lib/portfolio/portfolioLoadLifecycle.ts`, returning `'start' | 'join' | 'skip'`. All three
triggers now call `ensureProfileAndPortfolioReady()` instead of the raw loader; a sign-out resets
`portfolioReadyForSession = false` so the next sign-in starts a fresh bootstrap.

## 4. Root Cause 2 — tab switch always refetched positions

**Owner-observed symptom:** repeated `/api/portfolio/positions` calls when switching between
already-visited portfolio tabs, contributing to the 23x total.

**Root cause:** `loadPositions(portfolioId, force)`'s single-portfolio branch had no cache check —
every tab selection fetched positions unconditionally, even for a portfolio already loaded earlier
in the same session.

**Fix:** `loadPositions` now calls `decidePositionsFetch({ force, hasCachedEntry })` before
fetching. `'use-cache'` short-circuits with the existing `state.positionsByPortfolioId[portfolioId]`
entry and makes no request; `'fetch'` proceeds as before. A shared in-flight dedup helper,
`fetchPositionsDeduped(portfolioId)` backed by a `positionsInFlight` map, additionally collapses
concurrent requests for the same portfolio (the direct fix for the Owner-observed "4 simultaneous
positions calls").

## 5. Root Cause 3 — unconditional aggregate force-reload

**Owner-observed symptom:** every portfolio mutation (and the aggregate/"all portfolios" view)
re-fetched positions for every owned portfolio, regardless of whether that portfolio's data had
actually changed.

**Root cause:** `loadPortfolios()` hardcoded `force = true` on its internal
`loadPositions(state.selectedPortfolioId, true)` call (and the aggregate helper
`loadAllPortfolioPositions` had the equivalent unconditional force baked in), so **every** call
site — including read-only navigation flows that merely re-rendered the portfolio list — paid the
cost of a full re-fetch.

**Fix:** `loadPortfolios({ forcePositions = false } = {})` now takes an opt-in parameter, forwarded
to `loadPositions(state.selectedPortfolioId, forcePositions)`; the default is `false`, so a plain
`loadPortfolios()` call reuses cache. `loadAllPortfolioPositions` was changed the same way, calling
`decidePositionsFetch` per member portfolio so only genuinely uncached members fetch. The **only**
call site that still explicitly passes `forcePositions: true` is the refresh-button handler (§6) —
every portfolio-metadata mutation handler (create/rename/delete portfolio) now calls the safe
no-arg `loadPortfolios()`.

## 6. Root Cause 4 — no valuation freshness policy (loading-UX churn)

**Owner-observed symptom:** 14x `/api/portfolio/valuation` requests; visible "loading" flicker each
time a previously-viewed portfolio's valuation was requested again, even seconds later.

**Root cause:** `loadValuation` had no cache/TTL concept at all — every call, including ones fired
in rapid succession by the bootstrap/tab-switch/mutation paths above, issued a live KIS-backed
valuation request and blanked the UI into the foreground loading state while it resolved.

**Fix:** a named `VALUATION_FRESHNESS_TTL_MS = 20_000` constant, a `valuationInFlight` in-flight
dedup map, and the pure function `decideValuationFetch({ force, hasCachedResult, cacheAgeMs, ttlMs,
inFlight })` (returns `'use-cache' | 'fetch-foreground' | 'fetch-background' | 'join-inflight'`).
Behavior:

- Fresh cache (age < TTL): reused, no request.
- Expired cache: a **background** refetch — `state.valuationRefreshing = true` is set instead of the
  foreground `loading` flag, so the previously-fetched numbers stay visible while the refresh runs
  (status copy: `'시세를 새로고침하는 중입니다.'`, see §9 for why this exact string was chosen).
- No cache yet (first load for that portfolio): the real foreground loading state, unchanged from
  before.
- A concurrent request for the same portfolio joins the in-flight promise instead of firing a
  duplicate.
- `force: true` (explicit refresh) always bypasses cache and in-flight join and performs a real
  fetch — refresh must never silently no-op.

The explicit refresh button (`explicitRefreshInFlight` busy-guard) calls
`loadPortfolios({ forcePositions: true })` directly — **not** through `loadPortfolioMvp`/
`setPortfolioState` — so an explicit refresh no longer flashes the full readiness/loading screen,
only its own targeted reload.

Position-level mutations (create/update/delete a position) are unaffected by the freshness policy:
they still force a positions refetch for their own portfolio (`decideMutationForcesPositionsRefetch`
returns `true` for `'position'`, `false` for `'portfolio-metadata'`), since that data has genuinely
changed and must never be served stale.

## 7. "티커 미확인" investigation (no code change)

Investigated as part of this phase's Owner-observed symptom review. Conclusion: this is a
**transient loading-state display artifact**, not a data-correctness defect. `getPositionSecondaryLabel`
renders a placeholder ("티커 미확인" / ticker-not-yet-resolved copy) for the brief window between a
position row rendering from cached/partial state and its canonical instrument metadata resolving —
the same window that Root Causes 2–4 above made needlessly wide and needlessly repeated. With
positions/valuation now cached and deduped instead of being re-fetched on every tab switch, the
window in which this placeholder is visible shrinks to the genuine first-load case, but the
placeholder logic itself was correct before this phase and is unchanged by it. **No code change was
made for this item** — it is not a distinct defect, it is a visible symptom of Root Causes 1–4 that
this phase's fix already addresses indirectly. It is not promoted to its own finding ID.

## 8. New deterministic test suite (17 scenarios, pure lifecycle helpers)

Per instruction, tests target the new pure, DOM-free, network-free decision module
`src/lib/portfolio/portfolioLoadLifecycle.ts` rather than DOM matching. New file
`scripts/phase_4f_portfolio_load_lifecycle_testsrc.ts`, run via the existing esbuild-bundle-to-temp-
ESM smoke pattern (`scripts/smoke_phase_4f_portfolio_load_lifecycle.mjs`):

| # | Scenario | Assertion |
|---|----------|-----------|
| 1 | Initial page load | `decideBootstrapAction` → `'start'` |
| 2 | Concurrent duplicate trigger while in-flight | → `'join'` |
| 3 / 3b | Duplicate trigger after session ready | → `'skip'` (even if impossibly marked in-flight) |
| 4 | Post-sign-out restart | → `'start'` again |
| 5 | Already-cached tab selected | `decidePositionsFetch` → `'use-cache'` |
| 6 | Uncached tab selected | → `'fetch'` |
| 7 | Explicit refresh, cached | → `'fetch'` (bypasses cache) |
| 8a / 8b | Aggregate view: cached member reused / uncached member fetched | `'use-cache'` / `'fetch'` |
| 9 | Fresh cached valuation | `decideValuationFetch` → `'use-cache'` |
| 10 | Expired cached valuation | → `'fetch-background'` |
| 11 | First-ever valuation load | → `'fetch-foreground'` |
| 12 | Concurrent valuation request | → `'join-inflight'` |
| 13a / 13b | `force: true` overrides fresh cache / in-flight join | asserts `!==` the bypassed state |
| 14a / 14b | `isValuationFresh` TTL boundary (age < TTL vs age ≥ TTL) | `true` / `false` |
| 15 | Portfolio-metadata mutation | `decideMutationForcesPositionsRefetch` → `false` |
| 16 | Position mutation | → `true` |
| 17 | `force: true` with no prior cache (edge case) | → `'fetch-foreground'`, no crash |

**Result: 21/21 assertions pass** (17 numbered scenarios, 4 of which assert two sub-cases each).

New static contract checker `scripts/check_phase_4f_portfolio_load_lifecycle_contract.mjs`
(`check:phase-4f-portfolio-load-lifecycle`) verifies via source inspection only (no execution, no
network — `globalThis.fetch` is blocked) that the actual wiring in `portfolio.astro` matches this
design: Group 0 file existence (4), Group A pure-module export contract (6), Group B the page
actually imports/calls the pure functions (4), Group C Root-Cause-1 bootstrap coalescing wiring (7),
Group D Root-Cause-2 positions cache-check + dedup wiring (5), Group E Root-Cause-3 `forcePositions`
opt-in wiring (3), Group F valuation TTL + background-refresh wiring (7), Group G explicit-refresh
and mutation-force semantics (5). **Result: 41/41 assertions pass.**

Both new npm scripts wired into `package.json` immediately after `check:phase-4f-hf2-portfolio-
identity`:

```json
"smoke:phase-4f-portfolio-load-lifecycle": "node scripts/smoke_phase_4f_portfolio_load_lifecycle.mjs",
"check:phase-4f-portfolio-load-lifecycle": "node scripts/check_phase_4f_portfolio_load_lifecycle_contract.mjs",
```

## 9. Request-budget model (4 portfolios, 4 scenarios, before/after)

This is an **analytical model derived from the code's request-decision logic** (pre-fix: every
listed path always fetched; post-fix: per the pure-function contracts in §8), not a live-traffic
measurement — the Owner's Production log evidence (23x/14x/10x) is the qualitative symptom this
model explains, not a number this model attempts to reproduce exactly, since it depends on session
length and click pattern. Four portfolios, labeled A (default/active at login), B, C, D.

**Scenario 1 — Session bootstrap** (login; A is the default active tab; the three real triggers —
init, `mk:profile-bootstrap` ready, `mk:auth-state` signed_in — all fire, matching the Owner-observed
triple-bootstrap pattern):

| | portfolios | positions (A) | valuation (A) | Total |
|---|---|---|---|---|
| Before | 3 | 3 | 3 | **9** |
| After | 1 | 1 | 1 | **3** |

**Scenario 2 — First visit to B, C, D (once each, no revisits):**

| | positions (B/C/D) | valuation (B/C/D) | Total |
|---|---|---|---|
| Before | 3 | 3 | **6** |
| After | 3 | 3 | **6** |

No reduction here by design — a genuine first-time load has nothing to cache yet and must fetch in
both versions; the fix removes redundant refetches, not legitimate ones.

**Scenario 3 — Revisit cycle A→B→C→D→A→B (6 switches, all previously visited, within the 20s
valuation TTL):**

| | positions | valuation | Total |
|---|---|---|---|
| Before | 6 | 6 | **12** |
| After | 0 | 0 | **0** |

**Scenario 4 — Explicit refresh on A, then one position mutation on A, then one aggregate
(Home portfolio-panel) view load** (each of the other three flows was already exercised at least
once earlier in this session, so their entries are warm caches by this point):

| | portfolios | positions | valuation | Total |
|---|---|---|---|---|
| Before | 3 (1 refresh + 1 mutation follow-up + 1 aggregate) | 9 (1 refresh(A) + 4 mutation-follow-up-forces-all + 4 aggregate-forces-all) | 1 | **13** |
| After | 3 (same 3 calls) | 2 (1 refresh(A) forced + 1 mutation(A) forced; follow-up `loadPortfolios()` and aggregate view both reuse cache) | 1 (refresh forces bypass) | **6** |

**Grand total across all 4 scenarios:** Before = 9 + 6 + 12 + 13 = **40** requests. After =
3 + 6 + 0 + 6 = **15** requests. **≈62.5% reduction (25 fewer requests)**, concentrated entirely in
genuinely redundant re-fetches (Scenarios 1, 3, 4); Scenario 2's legitimate first-load traffic is
untouched, which is the correct and intended outcome, not a gap in the fix.

## 10. Full regression gate

Run in this exact order, from the branch, against the working tree described in §2:

1. `npm run build` — **PASS** (dist output on disk; known benign Windows post-build exit-code
   artifact, consistent with every prior Phase 4F phase).
2. `npm run smoke:phase-4f-portfolio-load-lifecycle` — **21/21 PASS** (new).
3. `npm run check:phase-4f-portfolio-load-lifecycle` — **41/41 PASS** (new).
4. `npm run smoke:phase-4f-hf1-functional-high` — **59/59 PASS**, unchanged.
5. `npm run check:phase-4f-hf1-functional-high` — **58/58 PASS**, unchanged. Confirms K1/K2:
   `src/pages/api/portfolio/valuation.ts` remains the sole
   `allowProductionPortfolioValuationLiveData: true` call site — `F-HIGH-02` untouched.
6. `npm run smoke:phase-4f-hf2-portfolio-identity` — **34/34 PASS**, unchanged.
7. `npm run check:phase-4f-hf2-portfolio-identity` — **63/63 PASS**, unchanged. Confirms Group K
   (`resolvePositionSubmitIdentity` contract) — `F-HIGH-03` untouched.
8. `npm run check:portfolio-owner-review-prep` — matches the exact unmodified `origin/main` baseline
   failure count (**7/50 failing**, all pre-existing/stale — see below).
9. `npm run check:portfolio-ticker-display-name` — matches baseline (**18/73 failing**, pre-existing).
10. `npm run check:portfolio-holdings-header` — matches baseline (**3/84 failing**, pre-existing).
11. `npm run check:portfolio-layout` — matches baseline (**1/73 failing**, pre-existing).
12. `npm run check:mobile-snapshot-portfolio` — matches baseline (**6/49 failing**, pre-existing).
13. `git diff --check` — clean, no whitespace errors.

**Baseline-comparison methodology (for items 8–12):** rather than assume these five broader,
pre-existing portfolio checkers' failures were automatically stale (the prior-phase convention),
each was empirically verified against the unmodified baseline: `git stash push --quiet --
src/pages/portfolio.astro`, re-run the checker against `origin/main`'s actual file, record the exact
failing-check names/count, `git stash pop --quiet`, re-run against this phase's change, and diff the
two result sets. Three of the five (`ticker-display-name`, `layout`, `mobile-snapshot-portfolio`)
had **zero delta** from the start. Two (`owner-review-prep`, `holdings-header`) initially showed
**+1 delta each**, both traced to the same single cause: this phase's original background-refresh
status copy, `'최신 시세로 업데이트하는 중입니다.'` (§6), collided with a stale, pre-live-valuation
-era literal-string assertion in each checker (`!portfolioContent.includes('최신 시세')`, written
when Portfolio still used fixture data and any "latest quote" claim would have been false). Rather
than modify either checker's assertion (the sibling-reconciliation pattern used in Phase 4F-HF2),
the new string was rewritten to `'시세를 새로고침하는 중입니다.'` — semantically equivalent, avoids
the stale literal — which restored both checkers to their exact baseline failure counts with zero
checks weakened or ignored. This is recorded as a **zero-regression result**, not an accepted
regression.

## 11. Security boundary (unchanged)

- `src/pages/api/portfolio/valuation.ts` remains the only call site passing
  `allowProductionPortfolioValuationLiveData: true` (confirmed by `check:phase-4f-hf1-functional-
  high` K1/K2, unchanged, 58/58).
- `resolvePositionSubmitIdentity` / `resolveCanonicalOrFail` / the canonical combobox contract are
  untouched (confirmed by `check:phase-4f-hf2-portfolio-identity` Group K, unchanged, 63/63).
- No auth check, ownership check, or RLS-relevant query was modified. All caching introduced by this
  phase is client-side, in-memory, per-session module state (`state.positionsByPortfolioId`,
  `state.valuationByPortfolioId`-equivalent freshness tracking, `positionsInFlight`,
  `valuationInFlight`) — nothing persists across page reloads, nothing is written to storage, and no
  cache key crosses a user/session boundary.
- No new `/api/` route was added; no existing route's request/response contract changed.

## 12. Status of F-HIGH-01/02/03

- **`F-HIGH-01`/`CHART-05`** — stays CLOSED (untouched by this phase).
- **`F-HIGH-02`/`PORT-10`** — remains **PASS** per Owner QA already recorded (live KR valuation
  working); untouched and unre-verified by this phase. Not re-scored here.
- **`F-HIGH-03`** — remains **IMPLEMENTED / OWNER-VERIFICATION-PENDING**. This phase does **not**
  mark it CLOSED. Owner QA formal count is unchanged by this phase.
- **`F-MED-01`** (this phase) — **IMPLEMENTED / PR-READY / PREMERGE-REVIEW-REQUIRED.** Owner QA for
  this finding (reduced/eliminated redundant requests, preserved loading UX correctness) is
  **pending** — see the Owner QA Runbook in the final chat report (§16 of the original task
  instructions covers the runbook format; delivered directly in the chat response, not duplicated
  here to avoid drift between two copies).

## 13. Changed files

- `src/pages/portfolio.astro` — modified (bootstrap coalescing, positions cache-check + dedup,
  `forcePositions` opt-in, valuation freshness TTL + background refresh, explicit-refresh handler,
  mutation-force semantics; see §3–§6).
- `package.json` — modified (2 new npm scripts).
- `src/lib/portfolio/portfolioLoadLifecycle.ts` — new (pure decision module).
- `scripts/phase_4f_portfolio_load_lifecycle_testsrc.ts` — new (17-scenario/21-assertion test
  source).
- `scripts/smoke_phase_4f_portfolio_load_lifecycle.mjs` — new (smoke runner).
- `scripts/check_phase_4f_portfolio_load_lifecycle_contract.mjs` — new (41-assertion static
  contract checker).
- `docs/planning/phase_4f_portfolio_fetch_loading_ux_result_v0.1.md` — new (this document).
- `docs/planning/planning_changelog.md` — modified (new entry, §14).
- `docs/planning/mk_stock_lab_master_roadmap_v2.1.md` — modified (new entry, §14).

## 14. PR

- **Title:** "Phase 4F: reduce Portfolio refetches and loading-state churn"
- **Base:** `main` — **Head:** `fix/phase-4f-portfolio-fetch-loading-ux`
- **Not merged.** Opened for premerge review only, per explicit instruction. Does not touch, does
  not merge, and is not merged into PR #25.
