# MK Stock Lab Master Roadmap v2.1

Renamed from `mk_stock_lab_master_roadmap_v2.0.md` (same document lineage; v2.0 no longer exists as a separate
file — `roadmap_v0.1.md` remains the separately-preserved Phase 0–10 planning baseline). Written 2026-07-24 at
the close of Phase 3GI. The main correction from the prior v2.0 content: Phase 3GH's PR #4
(`feature/phase-3gh-portfolio-live-valuation-mvp` → `main`) has since **merged** (merge commit `64d58e9`),
which the prior version recorded as still open. This version also records Phase 3GI's status.

## 1. Current Production support — verified

Status label: `PRODUCTION_VERIFIED`. Only functionality actually deployed from `main` belongs in this section.

- **Home**: index cards, sparkline, market news (bounded two-stage GNews cascade + last-good runtime
  fallback, Phase 3GL-HF5), ad rail, portfolio panel summary link. `PRODUCTION_VERIFIED`.
- **Chart AI**: authenticated-only (`/chart-ai` requires a Supabase session — signed-out shows a lock card,
  zero provider/KIS/token requests until a chart is explicitly loaded); real KR/US OHLCV charts via KIS;
  Similarity engine with score guide, evidence level, and deterministic non-advisory insight; deterministic
  MK AI summary; Market Intelligence (benchmark, relative strength, USD/KRW via Frankfurter, commodities,
  volatility, regime — partial, interest rates and breadth not sourced); server-side daily usage guard
  (3 combined Similarity + MK Analysis runs/day/user, KST calendar boundary). As of Phase 3GK, Chart AI is a
  stable always-on Production product (no beta flag/query gate); see §1c. `PRODUCTION_VERIFIED`.
- **Portfolio**: authenticated CRUD for multiple portfolios and KR/US positions is `PRODUCTION_VERIFIED`.
- **Lab**: static S&P 500 sector / asset-class return matrices, cross-year hover, image export.
  `PRODUCTION_VERIFIED`.
- **Heatmap**: not yet implemented (still Phase 5 in the old roadmap — not started). `PLANNED`.
- **KIS instrument-master automation**: scheduled GitHub Actions refresh (KIS-only sources, PR-only, never
  auto-merges). `PRODUCTION_VERIFIED`.
- **Durable KIS token**: single-issuance, cross-request/cross-deploy reuse via Supabase-backed L2 store,
  PostgREST public bridge functions (service-role-only). `PRODUCTION_VERIFIED`.
- **Operations and Admin**: read-only admin-only usage-guard/KIS-token-health/quote-cache-staleness
  overview (`/admin/operations`, `GET /api/admin/operations/overview.json`), reusing the existing
  bearer-auth resolver and `site_admins` registry. `PRODUCTION_VERIFIED`.

## 1a. Phase 3GH — merged to main; Production deployment/DB-migration state is Owner-confirm

Status label: `MERGED_TO_MAIN`. PR `#4` merged (merge commit `64d58e9`). No tooling in this repo confirms
whether the merge has since been deployed to Production or whether the Phase 3GH migration has been applied to
the Production Supabase project — that confirmation is an Owner-only item, not re-verified here. Do not describe
Phase 3GH as `PRODUCTION_VERIFIED` in this document until an Owner confirms both.

- Authenticated, server-authoritative **live valuation MVP** for KR/KRW portfolio positions
  (`buildKrPortfolioValuation`, `POST /api/portfolio/valuation`) is implemented, tested (86/86 checker, 55/55
  smoke as of the HF1 aggregate fail-closed hotfix), and merged.
- US/USD positions remain explicitly marked "supported in a future phase."

## 1b. Phase 3GI — merged to main; Production deployment/DB-migration state is Owner-confirm

**Correction from the prior version of this document:** the section below originally described Phase 3GI as
"this phase" awaiting an Owner merge decision. Since then, PR `#5`
(`feature/phase-3gi-user-retention-persistence` → `main`) has **merged** (merge commit `16eee94`/
`16eee948c0ce34f5b92394e98b3527e5545bf4a7`), confirmed via `git log` on `origin/main`. Status label:
`MERGED_TO_MAIN`, classification `MERGED_PRODUCTION_READY_OWNER_RETENTION_QA_PENDING` qualified with
`DETAILED_QA_DEFERRED_BY_OWNER` (see `phase_3gi_user_retention_persistence_result_v0.1.md`). As with Phase 3GH,
no tooling in this repo confirms Production deployment or Supabase migration-application state independently —
both the original migration (`20260724_user_retention_persistence.sql`) and the Phase 3GI-HF2 forward-only
privilege-lockdown migration (`20260725_user_retention_table_privilege_lockdown.sql`) are Owner-reported applied
to Production Supabase (via the Supabase Dashboard SQL Editor), not independently re-verified this phase.

- **Session restoration hardening**: explicit `persistSession`/`autoRefreshToken` on the Supabase client;
  a single profile-bootstrap per auth transition; no duplicate init on `TOKEN_REFRESHED`; UI state cleared on
  `SIGNED_OUT`; no token or `Session` object is ever manually stored or logged.
- **Persistent resume state**: last surface, last owned portfolio, last Chart AI instrument/market/display
  name/timeframe, last activity timestamp — server-validated (enum/bounded-string/ISO-timestamp, no free-form
  URL field exists in the schema by construction), resumed only on an explicit user click, never via
  auto-navigation.
- **Cross-device watchlist**: KR/US stocks/ETFs, add/remove/list, server-enforced 50-item cap, a compact Home
  view, and a Chart AI toggle + deep link — zero quote polling, zero provider/KIS calls, zero Similarity/MK
  Analysis triggering or usage-quota consumption.
- New authenticated routes: `GET /api/user/retention`, `PATCH /api/user/preferences`,
  `GET/POST/DELETE /api/user/watchlist` — bearer-auth-before-DB-work, sanitized errors,
  `Cache-Control: no-store`, and a `RETENTION_API_NOT_READY` (503) response while the new tables are unapplied.
- Exactly one new, additive, collision-free migration (`20260724_user_retention_persistence.sql`) creating
  `public.user_preferences` and `public.user_watchlist_items` with RLS — **intentionally not applied** by any
  means this phase; every server code path degrades silently (not an error) when the tables don't exist yet.
- New tests: `smoke:phase-3gi-user-retention-persistence` (35/35, unchanged by HF2 — HF2 adds no new
  TypeScript logic) and `check:phase-3gi-user-retention-persistence` (149/149 after HF2's added assertions),
  plus a full pre-existing regression gate re-run (see `phase_3gi_user_retention_persistence_result_v0.1.md`
  for the complete list and non-blocking classifications).
- **Phase 3GI-HF1 (pre-migration contract hardening, same PR, no second migration file)**: before the
  migration's first application anywhere, the still-unapplied `20260724_user_retention_persistence.sql` was
  edited in place to add a `lab` surface value (Home/Chart AI/Portfolio/Lab now all persist resume state) with
  a `NOT NULL DEFAULT 'home'` contract, a chart-state-consistency `CHECK` rejecting a partial resume pointer,
  KR/US symbol-format `CHECK` constraints reusing the same pattern as `src/lib/market-data/instrument.ts`, a
  `last_chart_timeframe` `CHECK` bounded to Chart AI's exact supported set, and `user_preferences`
  INSERT/UPDATE RLS policies that independently re-verify `last_portfolio_id` ownership via an `EXISTS`
  subquery (defense in depth alongside the existing server-side check). Server hardening: `last_activity_at`
  is now always server-generated (a client-supplied value is never read); chart resume state is validated as
  one complete unit; watchlist symbol validation reuses the same KR/US rules. Chart AI's resume-state dedup key
  now includes the timeframe (a timeframe-only change on the same instrument still persists) and is recorded
  only after a successful write (a failed write stays retryable); a watchlist add/remove failure now shows
  sanitized Korean status feedback and preserves the pre-click toggle state instead of assuming success.
- **Phase 3GI-HF2 (forward-only table privilege lockdown, applied after the original migration went live)**:
  after the Owner applied `20260724_user_retention_persistence.sql` to Production Supabase, live structural
  verification found the `authenticated` role held unintended `TRUNCATE`/`REFERENCES`/`TRIGGER` table
  privileges on both `public.user_preferences` and `public.user_watchlist_items` — a gap RLS does not cover,
  since RLS governs row visibility, not table-level privilege grants. Rather than edit the already-applied
  migration, a second, strictly additive migration
  (`supabase/migrations/20260725_user_retention_table_privilege_lockdown.sql`) revokes all privileges from
  `public`/`anon`/`authenticated` on both tables, re-grants only `SELECT, INSERT, UPDATE, DELETE` to
  `authenticated`, and preserves full `service_role` access — no schema, RLS, trigger, constraint, index, or
  data change. The Owner reports this HF2 migration applied and TRUNCATE denial verified live (0 rows in
  either table, no new Security Advisor finding). Not independently re-verified in this session (no Supabase
  tool connected).

## 1c. Phase 3GK — merged to main and released to Production

Status label: `PRODUCTION_RELEASED`. PR `#7` ("Phase 3GK: productize stable Chart AI") merged via
`gh pr merge --match-head-commit` at approved Head `b22ddf8f7f2d36717050ad54fb2bbb798b40fd47` (merge commit
`0e53cdee24658d819f0f7140bd66843bf42c6b3d`). The Git-integrated Production deployment
(`dpl_CRd7KFZ2eyscG1tbAfxdqMgPhh1A`) reached `READY`. Post-release signed-out auth-boundary, route-isolation,
and page-safety checks all passed with no anomaly; no environment variable, Vercel setting, or Supabase
schema/data was mutated by the release. Classification: `PRODUCTION_RELEASED_PHASE_3GK_AUTHENTICATED_RUNTIME_QA_OWNER_PENDING`.
Authenticated Production runtime QA (explicit chart-load, live usage-guard interactive verification) remains
Owner-pending — folded into `DETAILED_QA_DEFERRED_UNTIL_PHASE_3_CLOSEOUT` (see §4 and
`phase_3gk_chart_ai_beta_productization_result_v0.1.md`).

- Graduated Chart AI from "beta preview gated behind `CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA` +
  `?chartAiProdBeta=1`" to a stable, always-on, authenticated Production product
  (`evaluateStableProductionChartAiAccess`; `allowProductionChartAiBetaLiveQuotes` renamed
  `allowProductionChartAiLiveData` end-to-end). The protected-Preview beta guard stays fully independent and
  untouched.
- `smoke:phase-3gk-chart-ai-beta-productization` (17/17) and `check:phase-3gk-chart-ai-beta-productization`
  (116/116); full regression gate clean at merge time.

## 3. Explicitly deferred scope (not Phase 3GJ, not Phase 3GI, not Phase 3GH)

- US/USD position live valuation; USD portfolio base-currency valuation and any live or mocked FX conversion.
- Dividends, realized P&L, transaction history, tax calculations, broker sync.
- Intraday charts and background/polling valuation refresh.
- Paid plans / advanced usage tiers.
- Any persisted "arbitrary URL" resume target — resume state is limited to a closed, server-validated set of
  fields (surface name, owned portfolio id, instrument identity, market, timeframe, display name, timestamp).

## 4. Execution sequence

### Completed

- **Phase 3GH — Portfolio Live Valuation MVP.** `MERGED_TO_MAIN` (PR #4, `64d58e9`). Production
  deployment/migration-application status is Owner-confirm. See §1a.
- **Phase 3GI — User Retention and Persistence, including HF2 privilege lockdown.** `MERGED_TO_MAIN` (PR #5,
  merge commit `16eee94`). See `phase_3gi_user_retention_persistence_result_v0.1.md` for the full
  classification. See §1b.
- **Phase 3GJ — Live Market Dashboard, including HF1/HF2/HF3 pre-merge correctness hotfixes.** `MERGED_TO_MAIN`
  (PR #6, `668e528`). Replaces the fixture-driven Home index-card snapshot and public Market page with a live
  dashboard for `kospi200`/`kosdaq150`/`sp500`/`nasdaq100`, sourced entirely from the existing shared KIS OHLCV
  orchestration and durable token manager. See `phase_3gj_live_market_dashboard_result_v0.1.md` for the full
  classification.
- **Phase 3GK — Chart AI Beta Productization.** `PRODUCTION_RELEASED` (PR #7 merged, merge commit `0e53cde`,
  Production deployment `dpl_CRd7KFZ2eyscG1tbAfxdqMgPhh1A` READY). See §1c.
- **Phase 3GL — Home Live Data and GNews, including HF4 GNews provider-compatibility hotfix.**
  `PRODUCTION_VERIFIED` (PR #9 merged, hotfix commit `43518b6a5e1ac6cc71bbea96f6cb52405353eb3f`, merge
  commit `dc4f3b0c018aa16acee3d6c4bcaced5bc7ca1df4`, Production deployment
  `dpl_9qQHPbH9amFKvuGkhwdYxXDSYcv6`). Replaces the Home page's separate live-market call
  (`/api/market/overview.json`) and the fixture-default news feed with one shared server-side Home market
  orchestrator + one public route (`GET /api/home/live-market.json`) serving both the 9-item ticker belt
  (S&P 500/Nasdaq 100/Dow Jones/KOSPI/KOSDAQ/USD-KRW/Dollar Index/Gold/WTI Oil, each an existing resolvable
  KIS-backed ETF proxy or the existing Frankfurter FX source, honestly basis-labeled) and the 4-card Market
  Snapshot from the same underlying fetch, plus a new server-only GNews client and `GET /api/news/home.json`
  route (single combined query per refresh, at most 6 client-safe articles, sanitized
  `NEWS_NOT_CONFIGURED` state when `GNEWS_API_KEY` is absent — no fixture fallback). No new KIS endpoint/TR ID,
  no second market-data or FX provider. Closeout classification `PHASE_3GL_HF4_MERGED_PRODUCTION_VERIFIED`
  recorded on PR #9. See `phase_3gl_home_live_data_and_gnews_result_v0.1.md` for full detail.
  **Phase 3GL-HF5 — reliable latest-available Home news** is a further hotfix on top of the HF4-verified
  baseline, addressing a Production reliability gap where the single-strategy Home news feed could return
  an avoidable zero-article `NEWS_NO_RESULTS`. Replaces the single-strategy feed with a bounded two-stage
  cascade (GNews Top Headlines primary, bounded GNews Search "latest available" fallback, ≤2 requests/load)
  plus a runtime-local last-good fallback. `PRODUCTION_VERIFIED` (PR #11 merged, hotfix commit `76cdec1`,
  merge commit `0fc7012`). See §1e of the result doc for full detail.
- **Phase 3GM — Operations and Admin MVP, including HF1/HF2/HF3 pre-merge hotfixes.**
  `PRODUCTION_VERIFIED` (PR #10 merged, merge commit `be4fbaa`). Minimal internal visibility into
  usage-guard counters, KIS token health, and quote-cache staleness — previously only inspectable via ad
  hoc Owner smoke scripts and Supabase Dashboard queries. Implemented as one read-only, admin-only surface
  (`GET /api/admin/operations/overview.json` + `/admin/operations` page) reusing the existing bearer-auth
  resolver and `site_admins` registry — no second admin-role system, no migration, no mutation control. See
  `phase_3gm_operations_and_admin_mvp_plan_v0.1.md` and `phase_3gm_operations_and_admin_mvp_result_v0.1.md`
  for full detail.
- **Phase 4A — Home and Common Shell Production Readiness.** `PHASE_4A_MERGED_PRODUCTION_VERIFIED` (PR #12
  merged, merge commit `53def508a07636ed37023eb1703bd67e4f97ea1e`, Preview deployment `5723714642`
  success, Production deployment `5723798085` success). A presentation/copy/accessibility/responsive-shell
  readiness pass over the Home page and the shared Header/Nav/Footer/Layout/404 shell: removes staged
  "Preview" hero wording and a fabricated visitor-count placeholder, corrects the four Home feature-card
  descriptions to match each target page's actual verified scope, adds `aria-current`/focus-visible
  accessibility to the shared nav and shell controls, adds a real `404.astro`, and clarifies the Vercel-only
  deployment policy. No provider, auth, schema, or business-logic change. All 10 required live-Production
  HTTP checks (Home/Chart AI/Market/Lab/Portfolio/Admin pages, unknown-route 404, news/live-market/admin-
  overview APIs) passed exactly as specified. Authenticated click-through QA and a Vercel-dashboard
  runtime-error-cluster review remain deferred to Phase 4F (Owner-only, no authenticated session available
  to this assistant). See `phase_4a_home_common_shell_production_plan_v0.1.md` and
  `phase_4a_home_common_shell_production_result_v0.1.md` for full detail.
- **Phase 4B — Market Production Completion.** `PHASE_4B_MARKET_MERGED_PRODUCTION_VERIFIED` (PR #13
  merged, merge commit `60b64dde731be60ed5a9a278114234a7e3042126`, Production deployment
  `dpl_GH4fVxWmigqNgq4ajioqV6Cc2VrQ` `READY`). A completion pass over the existing live Market dashboard
  (`LiveMarketDashboard.astro`): truthful sample/proxy/delayed-close disclosures, a period-aware overview
  loader, accessible treemap/scatter, honest breadth/freshness reporting, request-race guards, a
  30s-cooldown refresh control, full ARIA tablist + keyboard navigation for the universe/period tabs, a
  focus-trapped accessible modal, 44px touch targets, and a permanent `/heatmap` → `/market` redirect. No
  provider/business-logic change. The full bounded Production acceptance sweep (4 overview periods, 16
  universe×period dashboard combinations, invalid-input/method validation, raw redirect check, and the
  full regression set) passed in its entirety with no runtime-error cluster found. Authenticated
  visual/touch/screen-reader QA remains deferred to Phase 4F. See
  `phase_4b_market_production_completion_plan_v0.1.md` and
  `phase_4b_market_production_completion_result_v0.1.md` for full detail.

  **Roadmap-numbering correction**: Phase 4A's forward-looking entries below originally labeled Phase 4B as
  "Chart AI" and Phase 4C as "Market" (and `planning_changelog.md`'s Phase 4A entry said the same). This
  phase instead executed **Phase 4B = Market**, **Phase 4C = Chart AI** — the Market dashboard's
  truthfulness/accessibility gaps were judged the more urgent production-readiness item; Chart AI already
  received substantial hardening in Phase 3GK/3GG-T. The "Next sequential product phases" list below is
  corrected accordingly. See `phase_4b_market_production_completion_plan_v0.1.md` §1 for the full rationale.

- **Phase 4C — Chart AI Production Completion.** `PHASE_4C_CHART_AI_MERGED_PRODUCTION_VERIFIED` (PR #15
  "Phase 4C: Chart AI production completion" merged by the Owner directly, merge commit
  `7232acf9ada953b401caf5a96e8a9e3fd626da97`; Production deployment `dpl_FQfhKrCEi83ErYUF7qRL8S5HXHxR`
  `READY` was supplied to this Claude Code session by the user and not independently confirmed, cross-checked
  independently in this session via the GitHub commit-status API,
  which confirms the same deployment ID and a "Deployment has completed" success state tied to this exact
  merge commit). A production-readiness pass over `/chart-ai`: one authoritative
  `chartAiRealExperienceRuntime` flag, a real signed-out auth lock with the workspace body hidden until a
  session exists, an accessible search combobox, last-good-chart preservation on a failed reload of the
  currently displayed instrument, a real ARIA tablist for the Similarity/MK-AI switch, and usage-limit
  presentation sourced only from the server response. Also restores the `시장 인텔리전스` client section that
  a prior Phase 3GG hotfix had silently dropped, reusing its existing, unmodified server engine and API
  route. Removed the unused `@astrojs/netlify` dependency (independently confirmed absent from
  `package.json` post-merge, and no Netlify reference remains in `astro.config.mjs`); the separate external
  Netlify Git-integration checks seen on PR #15 are unrelated leftover infrastructure, not yet disconnected —
  tracked as deferred cleanup, not resolved by this phase. Independently re-verified post-merge on live
  Production without credentials: `/`, `/chart-ai`, `/market`, `/portfolio`, `/lab`, `/admin/operations` all
  return `200`; all 5 unauthenticated Chart AI API routes (`instruments/search.json`, `market/ohlcv.json`,
  `similarity.json`, `mk-analysis.json`, `market-intelligence.json`) return a sanitized `401 AUTH_REQUIRED`
  with `no-store` caching; the pre-existing `/heatmap` → `/market` redirect still returns `301`. The more
  granular Vercel deployment facts (`readyState`, alias list, `aliasError`, framework, region) and a claimed
  Production runtime-error-cluster query result could not be independently re-derived in this session (no
  Vercel CLI/API/dashboard/connector access). These Vercel deployment and runtime-observability details were
  supplied to this Claude Code session by the user; this session did not have Vercel API, CLI, dashboard, or
  connector access to independently confirm them. Authenticated
  visual/touch/keyboard/usage-counter QA remains deferred to Phase 4F. See
  `phase_4c_chart_ai_production_completion_plan_v0.1.md` and
  `phase_4c_chart_ai_production_completion_result_v0.1.md` for full detail.

- **Phase 4D — Lab Production Completion.** `PHASE_4D_LAB_MERGED_PRODUCTION_VERIFIED` (PR #17 "Phase 4D: Lab
  production completion" merged by the Owner, merge commit
  `14c0ee993dbf03639d73f12bfca39f67047e508a`; Production deployment `dpl_E4r84x9S5NLoDFLrgHqi9heJ2GvQ`
  `READY`, target `production`, at that exact SHA). Implemented the governing plan's audit findings over
  `/lab` and its detail pages: `<table>` semantics
  (`scope="col"`/`scope="row"`/`<caption>`/labeled empty cells) on `LabReturnMatrix.astro`'s ranking and
  summary tables; the 12 category-legend chips converted to native, keyboard-focusable `<button aria-pressed>`
  elements (table cells stay semantic and non-tabbable) with `Enter`/`Space` via native semantics, `Escape`
  clearing the pin through the existing root-scoped handler, and byte-for-byte-preserved pointer/tap behavior;
  both `.lab-matrix-scroll` regions made keyboard-reachable (`tabindex="0"` + focus-visible style); a
  non-blocking `role="status" aria-live="polite"` export-status region (backed by a new pure
  `exportStatusMessage` helper in `exportCardImage.ts`) replacing the previous blocking `window.alert` failure
  path on both `asset-class-returns.astro` and `sp500-sectors.astro`; the Congress/NPS-holdings preview cards
  converted from plain `<div>` to `<ul>`/`<li>` list semantics with every honesty string unchanged; and the
  orphaned, unlinked `nps-portfolio.astro` (stale shell, stale "Phase 8" label, the Lab surface's only
  real-provider-name mention) replaced with a permanent 301 redirect to `/lab/nps-holdings` rather than
  deleted, so no bookmark breaks. New smoke suite (19/19) and static contract checker (62/62); all 8
  pre-existing Lab-related checkers re-verified with zero edits required (one,
  `check:mobile-ux-density-export`, carries one pre-existing, out-of-scope failure from a Phase 4B file this
  phase never touched). Local `npm run build` could not reach a verdict due to a pre-existing local
  Windows/Node-toolchain crash confirmed unrelated to this phase's changes (identical crash reproduces on the
  unmodified baseline); Vercel's own Production build is the actual release gate and completed successfully.
  Production verification is bounded and unauthenticated: `/lab`, `/lab/asset-class-returns`,
  `/lab/sp500-sectors`, `/lab/congress-stocks`, `/lab/nps-holdings` all `200`, and `/lab/nps-portfolio` `301`
  → `/lab/nps-holdings`; the deployed HTML independently confirms the table captions/scoping, the
  `aria-pressed` legend buttons, the keyboard-reachable scroll regions, the export status live region, the
  Congress/NPS `ul`/`li` semantics, and the truthful example-data / pending-integration copy. Authenticated
  visual/touch/keyboard/screen-reader QA remains deferred to Phase 4F.

- **Phase 4E — Portfolio Production Completion.** `PHASE_4E_PORTFOLIO_MERGED_PRODUCTION_VERIFIED` (PR #19
  "Phase 4E: Portfolio production completion" merged by the Owner, merge commit
  `6cca38aba04c875abf985cb979625a26cf2a340c`; automatic Vercel Production deployment
  `dpl_AxKXATutrX9ALjkzHruUcRFjEr6L` `READY`, target `production`, `githubCommitRef: main`, at that
  exact SHA, with no manual Create Deployment/Redeploy required). Phase 4E-A (plan-only) audited the
  full `/portfolio` production surface and produced a 20-section implementation plan; Phase 4E-A.1
  corrected that plan per Owner review; Phase 4E-B implemented all 10 approved requirements (ETF
  entry in the asset-type select; fixed mislabeled currency-toggle button; explicit KRW-only/
  USD-unsupported valuation copy; removed dividend sort affordance with honest `데이터 대기`
  placeholders; `aria-live` on the two dynamic status paragraphs; a real dialog focus-trap/
  restoration lifecycle on both CRUD sheets; a complete portfolio tablist with `role="tabpanel"` and
  full Arrow/Home/End roving-tabindex navigation; removal of invalid `role="row"`/
  `role="columnheader"` markup from the holdings header; `role="region"`/`aria-label`/`tabindex="0"`
  plus matching `:focus-visible` CSS on the horizontal-scroll holdings wrapper; and a responsive
  dead-CSS fix); Phase 4E-B.HF1 then corrected an internally-contradictory baseCurrency disclosure
  and completed the approved Portfolio-scoped keyboard focus-visible coverage before merge. New pure
  module `src/lib/portfolio/portfolioKeyboardNav.ts` backs the two keyboard-navigation patterns. New
  required tests both pass at 100% (`smoke:phase-4e-portfolio-production-completion` 21/21,
  `check:phase-4e-portfolio-production-completion` 65/65); the one affected sibling checker
  (`check:portfolio-holdings-header`) was narrowly reconciled for the dividend-sort removal and now
  passes 81/84, with the remaining 3 failures confirmed to be pre-existing Phase-3BR checker drift
  predating this phase's baseline. No security, scope, or Hard-Rule boundary was crossed. Production
  verification is bounded and unauthenticated: `/portfolio` returns HTTP `200`, and the deployed HTML
  independently confirms the ETF selector, the truthful "현지" currency-toggle label, the corrected
  baseCurrency disclosure and its `aria-describedby` wiring, the status/live-region semantics, the
  `role="tabpanel"` detail panel, the `role="region"`/`aria-label`/`tabindex="0"` positions list, the
  absent dividend-sort affordance, and the absent invalid holdings row/columnheader roles.
  Authenticated CRUD, dialog focus-trap, mobile breakpoint, and touch-behavior QA remain deferred to
  Phase 4F. See `phase_4e_portfolio_production_completion_plan_v0.1.md` and
  `phase_4e_portfolio_production_completion_result_v0.1.md` for full detail.

  **Release-trigger anomaly (infrastructure, not application code) — RESOLVED, ONE-OFF, recurrence test
  PASS/CLOSED.** The automatic Vercel Production deployment did **not** fire after the PR #17 merge; the
  Owner recovered the release manually via Vercel Dashboard → Create Deployment against `main`. No Vercel
  project setting was changed to achieve this, and a full project-configuration audit found nothing blocking.
  Independent corroboration: the sole `Vercel` commit status and the only Production deployment record for
  the merge SHA were both created ~34 hours after the merge, and that deployment's `ref` is the raw commit
  SHA rather than `main` — the signature of a manual Dashboard deployment, not a branch-push trigger. The
  recurrence test was: does the next `main` merge deploy automatically? **PR #18** (merge SHA
  `b3254aa35db76fe264cbb8167f20c47291b87838`, the Phase 4D docs-only closeout) was that next merge, and it
  produced automatic Vercel Production deployment `dpl_D8TEboHCAD5S1uky3Yf6mXoJjUK3` (`target: production`,
  `state: READY`, `githubCommitRef: main`, matching `githubCommitSha`) within seconds of the push, with no
  Create Deployment/Redeploy or other manual step. One miss out of two observed merges, followed by a clean
  automatic deploy on the very next merge, is a **one-off incident**, not a recurring integration fault —
  recurrence is answered and the test is **CLOSED (PASS)**. Every subsequent phase's merge still gets routine
  post-merge deployment verification (per the standing pattern), but none of them are themselves "the
  recurrence test" going forward. See `phase_4d_lab_production_completion_plan_v0.1.md`,
  `phase_4d_lab_production_completion_result_v0.1.md` §6, and
  `phase_4e_portfolio_production_completion_plan_v0.1.md` §18 for full detail.

### In progress

- **Phase 4F-A — Cross-page Owner QA closeout plan.**
  `PHASE_4F_CROSS_PAGE_OWNER_QA_PLAN_READY_QA_NOT_STARTED`. Plan-only: audited every QA item
  deferred by Phases 4A–4E and produced a 120-case Owner-manual QA matrix across Home/Common
  Shell, Chart AI, Market, Lab, Portfolio, and cross-page/session behavior, plus an accessibility
  spot check, a defect-severity scale, an evidence format, and an automated pre-QA regression gate
  that now also covers Home/Market/Chart AI Production runtime-error review via read-only Vercel
  connector access (previously `SHELL-17`/`MARKET-17`, now consolidated there). See
  `phase_4f_cross_page_owner_qa_closeout_plan_v0.1.md`. Manual QA execution has **not** started and
  no application code was touched by this planning step.

- **Phase 4F-HF1 — functional HIGH defect fixes.**
  `PHASE_4F_HF1_IMPLEMENTED_PR_READY_PREMERGE_REVIEW_REQUIRED`. Fixes exactly the two HIGH
  functional defects surfaced by the Phase 4F Owner QA closeout execution: `CHART-05` (Chart AI
  6m/1y ranges silently returned incomplete data — fixed with bounded backward-paging + an
  additive coverage contract + a truthful client note) and `PORT-10` (Portfolio Production KR
  live valuation was blocked by the generic KIS Production fail-closed gate — fixed with a narrow,
  single-call-site `allowProductionPortfolioValuationLiveData` capability gated behind a new
  `KIS_ENABLE_PRODUCTION_PORTFOLIO_VALUATION` env flag; every other caller stays Production
  fail-closed). PR open, not merged; Owner must set the new env flag in Vercel Production before
  the post-merge deployment that verifies `PORT-10`. See
  `phase_4f_hf1_functional_high_defects_result_v0.1.md`.

- **Phase 4F-HF2 — Portfolio canonical instrument identity.**
  `PHASE_4F_HF2_IMPLEMENTED_PR_READY_PREMERGE_REVIEW_REQUIRED`. Fixes `F-HIGH-03`: replaced
  Portfolio's free-text/heuristic identity system (typed Korean names stored verbatim as `symbol`,
  a `securityLogos.json` lookup, ticker-like regex, market/currency heuristics) with a canonical
  identity contract sourced entirely from the existing Universal Instrument Master — no new symbol
  database. Adds an exact identity resolver (`resolveUniversalInstrumentExact`, distinct from
  ranked search — never auto-selects fuzzy/ambiguous matches), an accessible instrument combobox in
  Portfolio reusing the existing `/api/chart-ai/instruments/search.json` route, server-authoritative
  canonicalization on create/update (`resolveCanonicalOrFail` — client-supplied identity tuples are
  never trusted), and an in-memory-only legacy-compatibility resolver
  (`resolveLegacyKrIdentity`) that lets existing free-text KR rows (e.g. legacy "삼성전자") value
  correctly without bulk DB migration or DB mutation on read. `PORT-10`'s HF1 security boundary is
  unchanged. 112 new deterministic assertions (60 smoke + 52 checker); two pre-existing
  `check:phase-4e-portfolio-production-completion` assertions (A1, K9) were narrowly reconciled for
  this phase's spec-mandated changes, not weakened. PR open, not merged; neither `PORT-10` nor
  `F-HIGH-03` may be declared CLOSED before an Owner completes the Production proving path (legacy
  row → resolved to canonical symbol → real KIS quote → numeric valuation). See
  `phase_4f_hf2_portfolio_instrument_identity_result_v0.1.md`.

### Next sequential product phases

Phases 4B–4E repeat the same navigation-based production-readiness pattern established by Phase 4A —
truthful copy, accessibility, and responsive-shell correctness only, no provider/business-logic change —
one target page (or page group) at a time, each gated by its own automated smoke/checker suite before a PR
is opened. Phase 4F is the cross-page Owner QA closeout that every phase in this lane defers to, since none
of 4A–4E can be authenticated-click-through-verified by this assistant. All phases in this lane deploy only
through the existing Vercel Git integration (`main` branch) — no Netlify configuration is added or restored
(see the Netlify note in the parallel hardening lane below).

1. **Phase 3 Closeout.** `PLANNED`. Performs the detailed responsive/cross-browser/accessibility/
   all-symbol/all-market/long-session QA sweep deferred by Phase 3GK (§7 of its result doc) and Phase 3GL,
   plus any other cross-cutting Phase 3 closeout verification.
2. **Phase 4A — Home and Common Shell.** `PHASE_4A_MERGED_PRODUCTION_VERIFIED`. See "Completed" above.
3. **Phase 4B — Market production readiness pass.** `PHASE_4B_MARKET_MERGED_PRODUCTION_VERIFIED`. See
   "Completed" above.
4. **Phase 4C — Chart AI production readiness pass.** `PHASE_4C_CHART_AI_MERGED_PRODUCTION_VERIFIED`. See
   "Completed" above.
5. **Phase 4D — Lab production readiness pass.** `PHASE_4D_LAB_MERGED_PRODUCTION_VERIFIED`.
   Copy/a11y/responsive-shell audit of `/lab`, including its own already-honest "연동 예정" labeling of the
   NPS/Congress modules. See "Completed" above.
6. **Phase 4E — Portfolio production readiness pass.**
   `PHASE_4E_PORTFOLIO_MERGED_PRODUCTION_VERIFIED`. See "Completed" above.
7. **Phase 4F — Cross-page Owner QA closeout.**
   `PHASE_4F_CROSS_PAGE_OWNER_QA_PLAN_READY_QA_NOT_STARTED`. Owner-only authenticated click-through
   across 4A–4E on Production (visual, mobile, touch, keyboard, screen-reader spot checks) — the
   single point where the Owner QA deferred by every phase in this lane is actually performed. A
   120-case QA matrix now exists (see "In progress" above); manual QA execution has not started.

Phase 3 Closeout is explicitly **not** started. Phase 4F has a ready QA plan but manual QA
execution has not started. Phase 4E is now merged and Production-verified (see "Completed" above),
alongside Phases 4A–4D — this section only records the sequencing.

### Parallel post-release hardening lane (not a numbered product phase)

- Checker-suite consolidation — many phase-freeze checkers assert obsolete per-phase working-tree-scope
  invariants that fail on every subsequent phase (reconfirmed this phase — see §5.1). `DEFERRED`.
- Scheduled KIS instrument-master observation. `DEFERRED`.
- `/api/market/quote` intent and rate-limit audit. `DEFERRED`.
- Authoritative active-gate manifest. `DEFERRED`.
- Stale Netlify dependency/configuration review. `PARTIALLY_DONE`. Deployment policy is Vercel-only
  (`astro.config.mjs` wires only `@astrojs/vercel`; no Netlify adapter, no `netlify.toml`, no Netlify
  project) — reconfirmed as part of Phase 4A. Phase 4C removed the unused `@astrojs/netlify` entry from
  `package.json` `dependencies` (independently confirmed absent post-merge). What remains `DEFERRED`: a
  separate external Netlify Git-integration still produces its own PR checks (seen on PR #15) unrelated to
  any dependency in this repo — Netlify has not been fully disconnected, and disconnecting that external
  integration is out of scope for this assistant (no Netlify account access).
- Dead similarity code retirement. `DEFERRED`.
- `is_site_admin` SECURITY DEFINER permission review. `DEFERRED`.
- Leaked-password protection review. `DEFERRED`.
- Authenticated Chart AI usage-guard Owner QA. `OWNER_QA_PENDING`.
- Periodic re-verification that Production guards (Chart AI auth/usage, Preview access, KIS token, RLS,
  provider boundaries) have not regressed as new phases land. `DEFERRED`.
- Confirm Phase 3GH's Production deployment and Supabase migration-application state. `OWNER_QA_PENDING`.

## 5. Top risks

1. **Checker-suite decay** (carried from the prior version, worse with each phase). A large and growing number
   of phase-freeze checkers (`check_phase_3xx_*`) assert "no other file changed since main," true only for the
   phase that introduced them. Phase 3GI re-confirmed three more instances
   (`check:phase-3gg-t-hf1`, `check:phase-3gg-u-chart-ai-live-usage-guard`, `check:phase-3gg-t-hf3a`) — see
   `phase_3gi_user_retention_persistence_result_v0.1.md` for the specific non-blocking failures.
2. **`check:provider-boundaries` false positive on `chart-ai.astro` persists.** The checker does a raw-text
   `lib/server` import match across an entire file without distinguishing SSR frontmatter from a client
   `<script>` block; `chart-ai.astro`'s five `lib/server` imports are all pre-existing SSR-frontmatter lines
   (7–11, before the `---` delimiter at line 303), unrelated to any phase's client-side code. Confirmed again
   this phase. Not fixed (out of Phase 3GI's scope) — flagged for the checker-suite-consolidation lane.
3. **DB migration backlog.** Phase 3GH's migration and both of Phase 3GI's migrations (Owner-reported applied,
   not independently re-verified this session) require Owner confirmation before their respective Production
   deployment states can be marked `PRODUCTION_VERIFIED` in this document. Phase 3GJ introduces no migration.
4. **No production DB read access during this phase**, same as prior phases — code-level correctness was
   verified without a live Supabase connection.
5. **US/USD valuation gap** (carried from the prior version) remains unresolved and increasingly visible as
   more surfaces (now including the watchlist, which is market-agnostic) add cross-market functionality
   around it.
6. **Phase 3GJ Production activation completed** (`KIS_ENABLE_PRODUCTION_MARKET_DASHBOARD=true` set, PR #6
   merged, Production deployment reached READY, controlled live-data acceptance passed) — no longer an open
   risk; carried here only as a closed-item reference.
7. **Phase 3GK released to Production, authenticated runtime QA Owner-pending.** PR #7 merged (`0e53cde`) and
   the Production deployment reached `READY`; unauthenticated auth-boundary/isolation/page-safety checks all
   passed. Authenticated interactive verification (explicit chart-load, live usage-guard check) is
   Owner-pending — folded into `DETAILED_QA_DEFERRED_UNTIL_PHASE_3_CLOSEOUT`. See §1c.

## 6. Owner-only QA / decision items

- Confirm Phase 3GH's Production deployment status and apply/confirm its Supabase migration if not already
  done.
- Confirm Phase 3GI's Production deployment status (PR #5 merged, merge commit `16eee94`) and that both its
  migrations (Owner-reported applied) are actually live and correct on the target Supabase project(s).
- Authenticated Preview/Production QA of Phase 3GI's resume card, watchlist (Home + Chart AI), and Portfolio
  deep-link behavior.
- ~~Review and, if approved, set `KIS_ENABLE_PRODUCTION_MARKET_DASHBOARD=true` in Production~~ — done; Phase
  3GJ is merged and its live market dashboard is Production-activated.
- Full signed-out/public detailed QA of Phase 3GJ's Market dashboard (all four universes/periods) and Home live
  snapshot, including mobile viewport and treemap/scatter export, plus the analogous detailed sweep for Phase
  3GK — both explicitly deferred to Phase 3 Closeout (see Phase 3GK result doc §7).
- Perform authenticated Production runtime QA of Phase 3GK (explicit chart-load, live usage-guard interactive
  verification) — deferred to Phase 3 Closeout.
- Decide whether to merge the Phase 3GL PR once opened (not performed by this phase per explicit instruction).
- If Phase 3GL's Preview shows `GNEWS_API_KEY` unset, decide whether/when to set it in Vercel so the GNews
  feed activates (no Vercel env mutation performed this phase).
- ~~Decide whether to merge the Phase 4A PR~~ — done; Phase 4A is merged (PR #12, merge commit
  `53def50`) and Production-deployment-verified (deployment `5723798085`).
- Perform the Phase 4F cross-page Owner QA closeout (authenticated click-through of the Phase 4A Home/shell
  changes plus Phases 4B–4E once they land) — deferred by every phase in the 4A–4E lane, same reason as the
  Phase 3GK/3GJ detailed-QA deferrals above (no authenticated browser session available to this assistant).
- Confirm no new Vercel Production runtime-error clusters via the Vercel dashboard for Phase 4A's
  deployment `5723798085` — could not be checked this phase (Vercel MCP/dashboard session unauthenticated);
  10/10 direct live HTTP checks showed no error signatures as a proxy.
- ~~Provide a dedicated Phase 4B specification before any Phase 4B implementation begins~~ — done; a full
  Phase 4B specification ("Market Production Completion") was provided and executed on branch
  `feature/phase-4b-market-production-completion`. ~~Decide whether to merge the Phase 4B PR once opened~~ —
  done; the Owner merged PR #13 (merge commit `60b64dd`) directly, and the full Production acceptance sweep
  passed. See `phase_4b_market_production_completion_result_v0.1.md` §9.
- ~~Decide whether to merge the Phase 4C PR~~ — done; the Owner merged PR #15 directly (merge commit
  `7232acf`), and the bounded unauthenticated Production HTTP sweep passed. The user supplied to this Claude
  Code session a claim of no new Vercel Production runtime-error clusters for `/chart-ai` and its 5 API
  routes, plus granular Vercel deployment facts (`readyState`, aliases, `aliasError`, framework, region); this
  session had no Vercel dashboard/API/CLI/connector access to independently confirm either, so both remain
  recorded as user-supplied and unverified rather than confirmed. Independently confirming them via the
  Vercel dashboard/API `OWNER_QA_PENDING`.
- Disconnect or reconfigure the separate external Netlify Git integration that still runs its own checks on
  PRs (unrelated to the `@astrojs/netlify` package dependency, which Phase 4C removed) — requires Netlify
  account access this assistant does not have. `DEFERRED`.
- ~~Implement the Phase 4D plan (`phase_4d_lab_production_completion_plan_v0.1.md`) on branch
  `feature/phase-4d-lab-production-completion`~~ — done; the Owner merged PR #17 (merge commit `14c0ee9`) and
  the bounded unauthenticated Production route + deployed-HTML sweep passed. Authenticated
  visual/touch/keyboard/screen-reader QA remains `OWNER_QA_PENDING`, deferred to Phase 4F per the standing
  pattern. See "Completed" above.
- ~~**Vercel automatic Production deployment trigger — recurrence test outstanding.**~~ — `PASS / CLOSED`.
  The PR #17 merge produced no automatic Production deployment; the Owner recovered it manually via Vercel
  Dashboard → Create Deployment, with no Vercel project setting changed. The recurrence test was the next
  `main` merge: **PR #18** (merge SHA `b3254aa35db76fe264cbb8167f20c47291b87838`) deployed automatically
  (`dpl_D8TEboHCAD5S1uky3Yf6mXoJjUK3`, `READY`, `githubCommitRef: main`) within seconds of the push, with no
  manual step. Classified as a **one-off** trigger miss, not a recurring pattern. Routine post-merge
  deployment verification continues for every future phase, but it is no longer a "recurrence test" — see
  `phase_4e_portfolio_production_completion_plan_v0.1.md` §18.
