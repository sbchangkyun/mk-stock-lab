# Phase 4B — Market Production Completion (Plan v0.1)

Baseline: `origin/main` = `bf27054` (Phase 4A closeout, docs-only commit; also carries the Phase 4A merge
commit `53def50`, PR #12).
Branch: `feature/phase-4b-market-production-completion` (cut from the exact Phase 4A merge commit; already
existed empty per Phase 4A's roadmap note).

## 1. Objective

Finish `/market` (and its `/heatmap` legacy alias) as a truthful, accessible, responsive, operationally
reliable production surface — a completion pass over the existing live Market dashboard
(`LiveMarketDashboard.astro`, Phase 3GJ/HF1/HF2/HF3), not a rewrite. No provider, data-source, formula, or
business-logic change.

**Roadmap-numbering correction**: Phase 4A's forward-looking roadmap entries (and the matching
`planning_changelog.md` entry) labeled Phase 4B as "Chart AI" and Phase 4C as "Market". This plan instead
executes **Phase 4B = Market**, **Phase 4C = Chart AI**, reversing that pair — the Market dashboard's
truthfulness/accessibility gaps (disclosure copy, tab a11y, modal focus trap, request-race guards) were
judged higher priority than Chart AI's, which already received substantial hardening in Phase 3GK/3GG-T.
`mk_stock_lab_master_roadmap_v2.1.md` and `planning_changelog.md` are corrected accordingly as part of this
phase's docs (§25 below), not left inconsistent.

## 2. Explicit non-goals

No change to: the KIS OHLCV/quote provider boundary, the tracked-universe registry's underlying
methodology (representative-ETF-proxy basis, not official index membership), the pure metrics formulas
(`computePeriodReturnPct`/`computeMomentum20dPct`/`computeSma60`/`computeTrendVsSma60Pct`/
`aggregateWeightedBreadth`), the server dashboard service's orchestration/concurrency/error-code contract,
the two API routes' request/response contract, Supabase schema, environment variables, or Vercel project
settings.

## 3. Planned changes (by spec section)

1. **Copy and disclosures (§5-6)** — truthful eyebrow/H1/lead disclosing the 12-tracked-symbol-sample +
   representative-ETF(proxy) basis and delayed-close (not real-time) basis; exactly 4 disclosure bullets.
2. **Summary/overview area (§7-8)** — 5-metric summary strip; per-proxy overview cards with freshness
   badges, `formatAsOfDate`, an honest `이용 불가` unavailable branch, never a fabricated `0.00%`; overview
   loader made period-aware (`loadOverview(period, forceRefresh?)`, cache key `` `overview:${period}` ``,
   fetch `` `/api/market/overview.json?period=${period}` ``) so the ETF overview respects the period tabs
   instead of being hardcoded to `1d`.
3. **Treemap and scatter (§9-10)** — accessible `role`/dynamic `aria-label` on both visualizations, native
   `<title>` tooltips, partial-notice population, strict filters so a failed/unresolved constituent is
   never fabricated into a tile or point, retained `d3-hierarchy` import.
4. **Breadth and freshness (§11-12)** — coverage/failed-count, advancers/decliners/unchanged, honestly
   disclaimed weighted-return + median-return, sector strongest/weakest via `sectorLabel()`,
   `FRESHNESS_LABELS` 5-state map, `requestToken`/`overviewRequestToken` stale-response guards, scoped
   cache keys, `inFlightRequests` dedup, no `localStorage`/`sessionStorage` persistence.
5. **Refresh UX (§12)** — explicit refresh control, `REFRESH_COOLDOWN_MS = 30_000`, non-reentrant guard,
   transient "갱신 중..." label, `aria-live` status region, `isRefreshOfCurrent` stale-preserve-on-failure
   vs. blank-on-new-selection, refresh calls `loadOverview(period, true)`/`loadDashboard(universeId,
   period, true)` — bypassing only the in-memory client cache, never a server cache-bypass query param.
6. **Tab accessibility (§13-14)** — full ARIA tablist (`role="tablist"`/`tab`, `aria-selected`,
   `aria-controls`, `tabindex` roving), Arrow/Home/End keyboard navigation via a shared
   `setupTabKeyboardNav` helper, auto-activation on arrow move, no separate Enter/Space interception
   (native `<button>` semantics suffice).
7. **Modal and responsive layout (§14-15)** — `role="dialog" aria-modal="true"` starting hidden, focus
   moved into the panel on open and restored to the opener on close, Tab/Shift+Tab focus trap, 44px minimum
   touch targets on tab/refresh buttons, a responsive modal panel width (`calc(100vw - 48px)`).
8. **`/heatmap` (§17)** — a permanent (301) redirect to `/market`, replacing whatever prior duplicate-render
   page existed, so there is exactly one execution path for this content.
9. **Tracked-registry audit (§18)** — confirm every one of the 4 tracked universes' constituent counts stay
   within `(0, 12]` and that all 4 benchmark-proxy symbols (`069500`/`229200`/`SPY`/`QQQ`) remain present,
   against the current instrument master.
10. **Tests (§23-24)** — new `scripts/check_phase_4b_market_production_completion_contract.mjs` (static
    contract, exactly 70 numbered assertions across 8 groups) and
    `scripts/smoke_phase_4b_market_production_completion.mjs` +
    `scripts/phase_4b_market_production_completion_testsrc.ts` (exercises the real
    `SECTOR_LABELS`/`sectorLabel` logic in `src/lib/market-dashboard/formatters.ts`), wired into
    `package.json` as `check:phase-4b-market-production-completion` /
    `smoke:phase-4b-market-production-completion`.
11. **Docs (§25 of this plan, §33 of the governing spec)** — this plan + its result doc; correct the
    Phase 4B/4C roadmap-lane swap described in §1 above; add a `planning_changelog.md` entry.

## 4. Sibling-checker impact (identified during implementation)

Two of this phase's deliberate improvements changed literal code shapes that the earlier
`check_phase_3gj_live_market_dashboard_contract.mjs` asserted against verbatim:

- The period-aware overview loader (item 2 above) replaced the old hardcoded
  `'/api/market/overview.json?period=1d'` / `fetchJsonCached('overview:1d'` / zero-arg
  `loadOverview()`/`loadOverview(true)` literals with period-parameterized equivalents.
- The ARIA tab-activation architecture (item 6 above) replaced the old
  `tab.addEventListener('click', () => { ... })` block-body `.forEach` literal with an implicit-return
  `.forEach((tab) => tab.addEventListener('click', () => activateUniverseTab(tab)))` form.

Per this project's established sibling-checker-reconciliation convention, `check_phase_3gj_*` was edited (5
assertions) to tolerate the new, intentional shapes while preserving each assertion's original protective
intent (single dedicated period-scoped overview loader; independently-keyed caches; explicit tab-click
gating; sequenced-not-concurrent initial load; refresh bypasses only the client cache). See the result doc
§4 for the exact before/after.

## 5. Verification plan

New Phase 4B smoke + checker suites; re-run `check:phase-3gj-live-market-dashboard` (the only sibling
checker with file overlap — Phase 4A/3GL/3GM/3GK suites cover Home/Chart AI/Admin files this phase never
touches) after reconciliation; `npm ls --depth=0`; `git diff --check`; `npm run build`. Diff review before
committing for scope creep, encoding corruption, secrets, and absolute local paths.

## 6. What this plan explicitly defers

- **Authenticated click-through / visual QA** — folded into the existing Phase 4F cross-page Owner QA
  closeout lane (no authenticated browser session available to this assistant), same as every recent phase.
- **Detailed all-symbol/all-period QA sweep** — remains scoped to Phase 3 Closeout as already recorded in
  the roadmap; this phase performs its own bounded acceptance sweep against the Preview/Production
  deployment (governing spec §28-29) as a lighter-weight functional smoke, not a substitute for that
  detailed sweep.

See `phase_4b_market_production_completion_result_v0.1.md` for the executed result, exact test totals, and
build outcome.
