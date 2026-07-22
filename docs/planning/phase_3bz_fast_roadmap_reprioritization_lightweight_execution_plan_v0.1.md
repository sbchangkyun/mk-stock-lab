# Phase 3BZ Fast Roadmap Reprioritization and Lightweight Execution Plan — v0.1

## 1. Title and Metadata

- **Phase**: 3BZ
- **Type**: Fast Roadmap Reprioritization and Lightweight Execution Plan
- **Status**: Planned / execution-ready
- **Latest prior commit**: 239c738 fix: resolve portfolio ticker display names locally
- **Runtime UI changes**: none
- **API route changes**: none
- **DB / Supabase changes**: none
- **Live KIS calls**: none
- **Live GNews calls**: none
- **Vercel Preview calls**: none
- **Deployment**: not performed

---

## 2. Executive Summary

The project must now prioritize **speed, low server load, and focused validation**.

Key principles for all future phases:

- **Do not run broad smoke suites by default.** Each phase runs only the checker set relevant to what it touched.
- **Defer server-heavy or live-provider-heavy work** until the prerequisites (KIS credentials, Vercel Preview env, FX source decision) are confirmed ready.
- **Prefer fixture/local/static-first implementation** for all UI-heavy areas. Introduce live data incrementally, after fixture UI is visually accepted.
- **Owner manually reviews only browser/visual behavior.** Claude Code validates structure, contracts, and safety boundaries automatically via focused no-network checkers.
- **No polling, no cron, no background refresh** unless explicitly scoped by a phase.
- **No source=auto** until quote cache and freshness policy are stable.

---

## 3. Current Project Baseline

### Completed areas

| Area | Status |
|---|---|
| Portfolio UX redesign (tabs, sort, dashboard layout) | Complete |
| Portfolio fixture valuation mapping (3BX) | Complete — source=fixture only |
| Portfolio tab order localStorage persistence (3BW-HF1) | Complete |
| Local ticker display-name resolver (3BY-HF1) | Complete — 2 entries in securityLogos.json |
| Home portfolio status panel (3BL) | Complete — fixture/static |
| Home market news fixture integration (3BH/3BJ) | Complete — source=fixture |
| GNews fixture route, source selector, kill-switch (3BG) | Complete — live gate present but locked |
| KIS valuation design and fixture route (3BU–3BW) | Complete — route exists, source=live blocked |
| Portfolio create sheet / tab UX polish (3BN–3BQ) | Complete |

### Current missing areas

| Area | Status |
|---|---|
| Live KIS quote integration | Not started |
| FX conversion (USD/KRW) | Not started |
| Lightweight quote cache | Not started |
| Dividend data | Not started |
| Home index / market summary cards | Shell only |
| Chart AI real analysis engine | Skeleton only |
| Market page real or fixture charts | MarketShell component, not yet wired |
| Lab data modules (congress stocks, NPS, S&P sectors) | Static cards only |
| MyPage completion | Basic shell only |
| securityLogos.json coverage | 2 entries only (005930, KO) |
| Server-side portfolio tab order persistence | Not started |
| /news list page | Deferred |

---

## 4. Server-Load Policy

This policy applies to all future phases until explicitly revised:

- **Basic server plan assumed.** Do not introduce heavy server-side compute, long-running jobs, or memory-intensive operations.
- **No polling.** No client-side `setInterval` for live refresh.
- **No cron.** No scheduled background jobs.
- **No background refresh.** No auto-refresh patterns.
- **No repeated live checks.** Smoke tests are one-pass, owner-run; not automated loops.
- **No full historical smoke suite by default.** Each phase runs only what it touched.
- **No live provider call during normal page render** unless explicitly enabled by the phase and confirmed by owner.
- **Prefer on-demand refresh** triggered by explicit user action (button click), not automatic.
- **Default UI is static/fixture/local-first** until live source is explicitly approved per phase.
- **Avoid source=auto** until a lightweight cache and freshness policy are finalized and tested.
- **rawProviderStored must remain false** for all KIS-touching routes.

---

## 5. Future Validation Policy

Each phase category has a defined validation scope. Phase instructions must not expand beyond this scope without explicit justification.

| Phase Category | Run | Do Not Run |
|---|---|---|
| **Planning-only** | Roadmap/doc checker + build (if package/docs touched) | All smoke, all portfolio/Home/KIS/GNews checks |
| **Portfolio UI** | Portfolio checker subset + build | GNews/KIS smoke, Home checkers, Lab checkers |
| **Home** | Home checker subset + build | Portfolio/KIS/GNews smoke, Lab checkers |
| **Chart AI** | Chart AI checker subset + build | KIS live, GNews smoke |
| **Market** | Market checker subset + build | Live provider (unless explicitly scoped) |
| **Lab** | Lab checker subset + build | Live provider (unless scoped) |
| **MyPage** | MyPage checker subset + build | Provider smoke |
| **Security metadata (local JSON)** | Ticker/metadata checker + build | Live lookups, provider smoke |
| **KIS/FX planning** | Static contract checker only | Live calls, smoke |
| **KIS/FX smoke execution** | One controlled owner-run dry/preview smoke | Repeated suite, GNews suite |
| **API/server route** | Route-specific checker + impacted UI checker + build | Unrelated domain checkers |
| **Deployment** | Deployment checklist only | All dev/smoke suites |

**Rule:** If a phase does not touch KIS/GNews/Supabase/deployment, those suites are not run. No exceptions.

---

## 6. Manual Review Policy

### What owner must review visually

- UI layout changes and visual hierarchy
- Korean copy accuracy and tone
- Chart appearance and readability
- User flows requiring actual browser interaction (auth, data entry, navigation)
- Data plausibility when fixture or live data is displayed (values look reasonable)
- Any behavior that depends on real Vercel Preview environment
- Wording of disclosure copy (e.g., fixture status message, live data disclaimer)

### What Claude Code verifies automatically (no manual review required)

- File existence and structural integrity
- Presence/absence of key identifiers (helpers, types, constants)
- No forbidden live/provider code paths
- No environment variable leaks in client-side code
- No API route drift (fixture-only guard still present)
- No /news page created unless scoped
- No polling/cron/setInterval
- No DB/migration/Supabase schema drift
- No external fetch calls in checker scripts
- Build passes
- Focused static contract checks per phase

---

## 7. Reprioritized Roadmap

### Near-term: fast local / fixture / UI wins

These phases have no live provider dependency, low server load, and deliver immediate visible value.

---

#### Phase 3CA — Security Metadata Coverage Expansion (Local JSON)

- **Type**: local data + short implementation
- **Goal**: expand `securityLogos.json` with additional KR stocks/ETFs (at minimum: 000660, 035420, 069500, and a few major KR/US names) so the ticker display-name resolver covers the fixture valuation symbols.
- **Scope**: add JSON entries only; no code change needed. If helper changes are needed, scope them tightly to portfolio.astro.
- **Rationale**: phase 3BY-HF1 introduced the resolver but only 2 symbols are mapped. The 4 KR fixture symbols (005930, 000660, 035420, 069500) should all display names, not raw codes.
- **Validation**: check:portfolio-ticker-display-name + build.
- **Estimated effort**: small (data only).

---

#### Phase 3CB — Home Index Cards Fixture Data

- **Type**: UI implementation (fixture/static)
- **Goal**: add market overview index cards to the Home page using fixture/static data (e.g., KOSPI, KOSDAQ, S&P 500, NASDAQ — last known fixture values).
- **Scope**: index.astro and/or a new HomeIndexCards component. No live provider.
- **Rationale**: Home currently shows only market news and portfolio panel. Index summary cards are a standard investor homepage feature and add visible value without server load.
- **Validation**: Home checker subset + build.
- **Estimated effort**: medium.

---

#### Phase 3CC — MyPage MVP Completion

- **Type**: UI implementation (local/static)
- **Goal**: complete the My Page shell with: account summary (email, sign-in method, join date populated from Supabase auth client), notification preferences (local toggles), portfolio shortcuts (link to /portfolio), about/help section, and sign-out button.
- **Scope**: mypage.astro, no new API routes, Supabase auth client-side only (already available).
- **Rationale**: current My Page is a near-empty shell. Completing the MVP shell closes a visible gap.
- **Validation**: MyPage checker subset + build.
- **Estimated effort**: medium.

---

#### Phase 3CD — Chart AI Analysis UX Skeleton Enhancement

- **Type**: UI implementation (local/placeholder)
- **Goal**: enhance the Chart AI page skeleton: symbol search/prefill from URL params (already partially done), a deterministic placeholder analysis output panel, clear "AI analysis pending" state, and improve the load flow. No real AI provider call yet.
- **Scope**: chart-ai.astro, local helpers only.
- **Rationale**: current Chart AI is a sparse skeleton. A clearer skeleton with a pending-state panel sets the visual contract for when real AI analysis is connected.
- **Validation**: Chart AI checker subset + build.
- **Estimated effort**: medium.

---

#### Phase 3CE — Lab Menu Static Module Shells

- **Type**: UI implementation (static/fixture)
- **Goal**: add static sub-page shells for:
  - Lawmaker stock holdings (국회의원 보유 주식) — `/lab/congress-stocks`
  - National Pension portfolio (국민연금 포트폴리오) — `/lab/nps-portfolio`
  - S&P 500 sector returns (S&P 500 섹터) — `/lab/sp500-sectors`
  - Asset-class returns (자산군 수익률) — `/lab/asset-class-returns`
  - Each sub-page shows: title, description, methodology note, and a fixture/placeholder data table or chart shell.
- **Scope**: new Astro pages, static data only, no live scraping.
- **Rationale**: Lab card links currently 404. Static shells fulfill the navigation promise.
- **Validation**: Lab checker subset + build.
- **Estimated effort**: medium per sub-page.

---

#### Phase 3CF — Market Page Fixture Chart Enhancement

- **Type**: UI implementation (fixture/static)
- **Goal**: wire the Market page with fixture/static chart data for major indices (KOSPI, KOSDAQ, S&P 500). No live provider. Charts should use static or computed placeholder series data.
- **Scope**: MarketShell.astro or equivalent, fixture data, no live API.
- **Rationale**: Market page currently shows MarketShell with no wired data. Fixture chart gives visible content without server load.
- **Validation**: Market checker subset + build.
- **Estimated effort**: medium-large.

---

### Data foundation: planning and design phases

These phases require owner decisions and are planning-first before implementation.

---

#### Phase 3CG — Lightweight Server-side Portfolio Tab Order Preference Plan

- **Type**: planning
- **Goal**: design a minimal Supabase preference record approach for server-side tab order. One row per user, JSON column for ordered portfolio IDs.
- **Scope**: documentation only. No schema change yet.
- **Prerequisite**: owner confirms whether Supabase schema changes are allowed and prioritized.
- **Rationale**: current localStorage persistence is accepted for now; server-side is a future enhancement.
- **Validation**: roadmap doc checker + build.
- **Estimated effort**: small (planning only).

---

#### Phase 3CH — KIS + FX Preview Smoke Plan

- **Type**: planning
- **Goal**: produce a written plan for live KIS + FX smoke including: symbol list (KR stocks/ETFs, US stocks/ETFs), FX source decision, Vercel Preview env setup checklist, endpoint list, expected response shapes, error conditions, and rollback strategy.
- **Scope**: documentation only. No live calls. No code changes.
- **Prerequisite**: owner confirms KIS credentials, environment type (paper/production), and Vercel Preview env readiness.
- **Validation**: roadmap doc checker + build.
- **Estimated effort**: small (planning only).

---

#### Phase 3CI — KIS + FX Preview Smoke Execution

- **Type**: owner-run live smoke (controlled)
- **Goal**: execute one controlled dry/preview smoke pass against Vercel Preview environment. Owner-run only. Claude Code must not execute live calls.
- **Scope**: one smoke pass, minimal symbol set, owner-initiated.
- **Prerequisite**: 3CH plan approved; Vercel Preview env ready with KIS credentials set.
- **Validation**: owner manually checks smoke result; Claude Code validates static boundaries only.
- **Estimated effort**: owner-run only.

---

#### Phase 3CJ — Live Quote Contract for KR/US Without UI Default Enablement

- **Type**: API/server implementation
- **Goal**: wire source=live to the valuation route for KR stocks/ETFs and US stocks/ETFs, with FX conversion. Source=live is route-level only; UI does not default to live (still shows fixture unless explicitly toggled). On live failure: unavailable/stale-safe response, not fixture fallback.
- **Scope**: `/api/portfolio/valuation`, KIS adapter, FX adapter, static contract checker.
- **Prerequisite**: 3CI smoke passed.
- **Validation**: valuation API checker + portfolio UI checker + build.
- **Estimated effort**: large.

---

#### Phase 3CK — FX Conversion Contract

- **Type**: API/server implementation
- **Goal**: define and implement USD/KRW FX lookup (one provider, lightweight, no fabricated rate). FX rate stored per-response, not persisted. No FX polling.
- **Scope**: FX adapter, rate lookup, valuation route integration.
- **Prerequisite**: 3CJ live quote contract done.
- **Validation**: FX contract checker + valuation API checker + build.
- **Estimated effort**: medium.

---

#### Phase 3CL — Lightweight Quote Cache Design and Implementation

- **Type**: API/server implementation
- **Goal**: introduce a short-TTL server-side quote cache to reduce provider call frequency. rawProviderStored remains false. Cache key: provider + market + symbol + assetType + quoteDateBucket. Explicit freshness state. No polling. No heavy writes.
- **Scope**: cache adapter, valuation route integration, freshness state in response.
- **Prerequisite**: 3CJ and 3CK done. Source=auto is unlocked only after cache is stable.
- **Validation**: cache contract checker + valuation API checker + build.
- **Estimated effort**: medium-large.

---

#### Phase 3CM — Cached/Live Portfolio Valuation UI Mode

- **Type**: UI implementation (live-enabled)
- **Goal**: add UI support for source=cached/live in the portfolio valuation display. Show appropriate wording: "조회 시점 기준" or "최근 조회 기준". Allow explicit user refresh. No source=auto yet.
- **Scope**: portfolio.astro, cache-aware wording, user-triggered refresh flow.
- **Prerequisite**: 3CL quote cache done.
- **Validation**: portfolio UI checker + valuation API checker + build.
- **Estimated effort**: medium.

---

### Later feature phases

---

#### Phase 3CN — Dividend Data Strategy

- **Type**: planning
- **Goal**: decide dividend data source (manual fixture JSON, provider, or deferred). No automation until quote/FX foundations are stable.
- **Prerequisite**: 3CM done.
- **Estimated effort**: planning only.

#### Phase 3CO — Dividend UI Fixture Prototype

Implement dividend columns (배당률, 예상 연배당금, 배당주기) using fixture/static dividend data. Replace 데이터 대기 for known dividend-paying symbols.

#### Phase 3CP — Chart AI Real Analysis Engine

Connect chart AI to a real AI provider (e.g., Claude API). Define usage guard, token budget, and user-facing output contract.

#### Phase 3CQ — Market Live Charts

Wire Market page to live or refreshable chart data. Define data source and refresh policy.

#### Phase 3CR — Lab Data Modules Implementation

Wire Lab sub-pages to real or refreshable data sources. Define update frequency and freshness policy per module.

#### Phase 3CS — Production Readiness and Deployment QA

Final QA pass: error handling, load testing, security review, GDPR/privacy check, and production deployment plan.

---

## 8. Priority Decision Matrix

| Work Item | User-visible Value | Server Load | Implementation Risk | Dependency Risk | Recommended Priority | Recommended Validation Scope |
|---|---|---|---|---|---|---|
| Security metadata coverage | High (display names) | None | Minimal (data only) | None | **1 — immediate (3CA)** | ticker checker + build |
| Home index cards (fixture) | High (homepage UX) | Low (static) | Low | None | **2 — next (3CB)** | Home checker + build |
| MyPage completion | Medium | Low (auth client) | Low | None | **3 (3CC)** | MyPage checker + build |
| Chart AI skeleton enhancement | Medium | Low (no AI yet) | Low | None | **4 (3CD)** | Chart AI checker + build |
| Lab static shells | Medium (4 404 pages) | None (static) | Low | None | **5 (3CE)** | Lab checker + build |
| Market fixture charts | Medium | Low (static) | Medium | None | **6 (3CF)** | Market checker + build |
| Server-side tab order | Low (localStorage works) | Low-Medium | Low-Medium | Supabase schema decision | **7 (3CG)** | roadmap checker + build |
| KIS/FX smoke planning | None (planning) | None | None | Owner credentials | **8 (3CH)** | roadmap checker + build |
| KIS/FX smoke execution | None (validation) | Low (one pass) | Medium | 3CH + credentials | **9 (3CI)** | owner-run only |
| Live quote adapter | High (real prices) | Medium-High | High | 3CI passed | **10 (3CJ)** | valuation checker + build |
| FX conversion | High (USD portfolios) | Medium | Medium | 3CJ done | **11 (3CK)** | FX checker + build |
| Quote cache | High (load reduction) | Medium | High | 3CJ + 3CK done | **12 (3CL)** | cache checker + build |
| Live valuation UI | High (real values) | Medium | Medium | 3CL done | **13 (3CM)** | portfolio + valuation checker + build |
| Dividends | Medium | Low-Medium | Medium | 3CM done | **14+ (3CN–3CO)** | dividend checker + build |
| Production deployment | Critical (shipping) | Varies | High | All prior | **Last (3CS)** | deployment checklist |

---

## 9. KIS/FX Scope Policy

These decisions were confirmed by the owner and apply to all future KIS/FX phases:

- **KR stocks/ETFs and US stocks/ETFs** are both in scope for the first live valuation.
- **FX conversion (USD/KRW)** is included in the first live valuation scope.
- **source=live first** — use explicit live source before introducing source=auto.
- **source=auto deferred** — do not introduce automatic source selection until quote cache and freshness policy are stable and tested.
- **Live failure handling**: on KIS failure, return unavailable/stale-safe response. Do not fall back to fixture data. The UI should display a clear unavailability state, not silently substitute fixture values.
- **Vercel Preview smoke** is allowed in Phase 3CI only — not earlier.
- **Wording**: do not use "실시간" (real-time). Use:
  - "조회 시점 기준" — as-of-query-time basis
  - "최근 조회 기준" — based on most recent query
  - "시세 조회 기준" — based on quote lookup
- **No rawProviderStored**: provider response payloads must never be stored as-is in DB.

---

## 10. Quote Cache Policy

- Quote cache is necessary to reduce provider call frequency and improve response time.
- **Do not build cache prematurely.** Introduce after live quote and FX contracts are stable.
- **Start with planning and route-level contract** (Phase 3CL) before any implementation.
- **Avoid heavy server writes.** Cache should be lightweight (short TTL, in-memory or minimal KV store).
- **Short TTL**: suitable for market data (e.g., 15–60 seconds for live quotes, longer for EOD/daily data).
- **Explicit freshness state**: every cached response must include a freshness indicator (stale/fresh/unavailable).
- **rawProviderStored must remain false** for all routes, even with cache.
- **Cache key**: provider + market + symbol + assetType + quoteDateBucket.
- **Source=auto unlocked only after cache is stable and tested** in Vercel Preview environment.

---

## 11. Portfolio Server-side Tab Order Policy

- Owner wants eventual account/server persistence for portfolio tab order.
- **Current localStorage behavior is accepted** and passes visual review.
- **Do not implement server-side persistence until roadmap plan is finalized** (Phase 3CG) and owner confirms priority.
- **Implementation approach**: lightweight Supabase preference record — one JSON column per user storing ordered portfolio IDs. No separate table needed.
- **No polling.** Save only on explicit user reorder action.
- **Avoid excessive writes.** One write per user reorder, debounced if needed.
- **No drag-and-drop** unless explicitly scoped.

---

## 12. Security Metadata Policy

- Current `securityLogos.json` has 2 entries (005930/Samsung Electronics, KO/Coca-Cola).
- **Phase 3CA** will expand coverage for at minimum the 4 KR fixture valuation symbols (005930, 000660, 035420, 069500) and a selection of common KR/US names.
- **Expansion requires only JSON data changes** — no code change is needed.
- **Short-term approach**: manually curate a local JSON master.
- **Medium-term approach**: KIS official naming can override local names for KR securities when live KIS is enabled (Phase 3CJ).
- **No live symbol search or autocomplete** until a search strategy is explicitly scoped.
- **Logo URLs** can continue to use the existing CDN pattern (Toss Invest images) or be updated per symbol.
- The `resolveSecurityMetadata` helper in portfolio.astro is ready to consume any entries added to the JSON.

---

## 13. Owner Preparation Checklist

Before live KIS/FX phases (3CH–3CJ) can proceed, the owner must confirm:

- [ ] **KIS app key and app secret** are active and confirmed (not expired/revoked)
- [ ] **KIS environment type**: paper trading (virtual) vs. production — which should smoke use first?
- [ ] **KR quote permission**: confirmed (domestic stock/ETF quote permission)
- [ ] **US quote permission**: confirmed (overseas stock/ETF quote permission, if needed for first smoke)
- [ ] **Vercel Preview environment readiness**: KIS credentials set in Vercel Preview env vars, not in production
- [ ] **FX data source decision**: use KIS FX endpoint, or a separate lightweight source?
- [ ] **Supabase schema changes approved**: for quote cache and portfolio tab preference persistence?
- [ ] **Home index cards priority**: which indices? KOSPI, KOSDAQ, S&P 500, NASDAQ? Any others?
- [ ] **Chart AI output format**: what should the AI analysis panel show? Key levels, pattern label, summary text?
- [ ] **Lab module launch priority**: which of the 4 lab modules should be built first (congress stocks, NPS portfolio, S&P sectors, asset class returns)?
- [ ] **MyPage required functions**: sign-out, profile view, notification toggles — anything else?
- [ ] **Dividend automation decision**: manual fixture JSON, KIS dividend API, or fully deferred?

---

## 14. Recommended Next Phase

Two candidates for the next implementation phase:

**Option A — Phase 3CA: Security Metadata Coverage Expansion**
- Very low risk, no code change, immediate display-name improvement for the 4 KR fixture symbols.
- Unblocks fixture valuation display being fully useful.
- Recommended if owner wants to finalize the 3BY/3BX visual before moving to new areas.

**Option B — Phase 3CB: Home Index Cards Fixture Data**
- High visible value, adds real content to the homepage.
- Independent of KIS/live provider.
- Recommended if owner wants to advance the overall product surface area faster.

**Recommendation**: start with **Phase 3CA** (short, data-only) to close the ticker display gap exposed in 3BY review, then immediately proceed to **Phase 3CB** for high-value Home UX.

Phase 3CA is expected to take one short instruction pass. Phase 3CB will take a normal implementation pass.

---

## 15. Explicit Non-Goals for Phase 3BZ

This phase (3BZ) is planning-only. The following are explicitly not performed:

- No runtime UI implementation
- No API route changes
- No live KIS or GNews calls
- No external HTTP
- No Vercel Preview smoke
- No Supabase schema changes
- No DB migrations
- No deployment
- No quote cache implementation
- No FX implementation
- No dividend implementation
- No server-side tab order implementation
- No /news page
- No broad historical smoke suite
