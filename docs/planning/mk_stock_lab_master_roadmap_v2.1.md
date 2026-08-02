# MK Stock Lab Master Roadmap v2.1

Renamed from `mk_stock_lab_master_roadmap_v2.0.md` (same document lineage; v2.0 no longer exists as a separate
file — `roadmap_v0.1.md` remains the separately-preserved Phase 0–10 planning baseline). Written 2026-07-24 at
the close of Phase 3GI. The main correction from the prior v2.0 content: Phase 3GH's PR #4
(`feature/phase-3gh-portfolio-live-valuation-mvp` → `main`) has since **merged** (merge commit `64d58e9`),
which the prior version recorded as still open. This version also records Phase 3GI's status.

## 1. Current Production support — verified

Status label: `PRODUCTION_VERIFIED`. Only functionality actually deployed from `main` belongs in this section.

- **Home**: index cards, sparkline, market news, ad rail, portfolio panel summary link. `PRODUCTION_VERIFIED`.
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

### In progress

- **Phase 3GL — Home Live Data and GNews.** Replaces the Home page's separate live-market call
  (`/api/market/overview.json`) and the fixture-default news feed with one shared server-side Home market
  orchestrator + one public route (`GET /api/home/live-market.json`) serving both the 9-item ticker belt
  (S&P 500/Nasdaq 100/Dow Jones/KOSPI/KOSDAQ/USD-KRW/Dollar Index/Gold/WTI Oil, each an existing resolvable
  KIS-backed ETF proxy or the existing Frankfurter FX source, honestly basis-labeled) and the 4-card Market
  Snapshot from the same underlying fetch, plus a new server-only GNews client and `GET /api/news/home.json`
  route (single combined query per refresh, at most 6 client-safe articles, sanitized
  `NEWS_NOT_CONFIGURED` state when `GNEWS_API_KEY` is absent — no fixture fallback). No new KIS endpoint/TR ID,
  no second market-data or FX provider. See `phase_3gl_home_live_data_and_gnews_result_v0.1.md` for full detail.

### Next sequential product phases

1. **Phase 3GM — Operations and Admin MVP.** `PLANNED`. Minimal internal visibility into usage-guard counters,
   KIS token health, and quote-cache staleness — currently only inspectable via ad hoc Owner smoke scripts and
   Supabase Dashboard queries, not a real operational surface.
2. **Phase 3 Closeout.** `PLANNED`. Runs after Phase 3GM — performs the detailed responsive/cross-browser/
   accessibility/all-symbol/all-market/long-session QA sweep deferred by Phase 3GK (§7 of its result doc) and
   Phase 3GL, plus any other cross-cutting Phase 3 closeout verification.

Phase 3GM is explicitly **not** started by this document or this phase — this section only records that it is
next in sequence, per the governing spec's instruction not to begin it here.

### Parallel post-release hardening lane (not a numbered product phase)

- Checker-suite consolidation — many phase-freeze checkers assert obsolete per-phase working-tree-scope
  invariants that fail on every subsequent phase (reconfirmed this phase — see §5.1). `DEFERRED`.
- Scheduled KIS instrument-master observation. `DEFERRED`.
- `/api/market/quote` intent and rate-limit audit. `DEFERRED`.
- Authoritative active-gate manifest. `DEFERRED`.
- Stale Netlify dependency/configuration review. `DEFERRED`.
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
