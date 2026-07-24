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
  (3 combined Similarity + MK Analysis runs/day/user, KST calendar boundary). `PRODUCTION_VERIFIED`.
- **Portfolio**: authenticated CRUD for multiple portfolios and KR/US positions is `PRODUCTION_VERIFIED`.
- **Lab**: static S&P 500 sector / asset-class return matrices, cross-year hover, image export.
  `PRODUCTION_VERIFIED`.
- **Heatmap**: not yet implemented (still Phase 5 in the old roadmap — not started). `PLANNED`.
- **KIS instrument-master automation**: scheduled GitHub Actions refresh (KIS-only sources, PR-only, never
  auto-merges). `PRODUCTION_VERIFIED`.
- **Durable KIS token**: single-issuance, cross-request/cross-deploy reuse via Supabase-backed L2 store,
  PostgREST public bridge functions (service-role-only). `PRODUCTION_VERIFIED`.

## 1a. Phase 3GH — merged to main; Production deployment/DB-migration state is Owner-confirm

Status label: `MERGED_TO_MAIN`. PR `#4` merged (merge commit `64d58e9`). This phase (3GI) has no tooling to
confirm whether the merge has since been deployed to Production or whether the Phase 3GH migration has been
applied to the Production Supabase project — that confirmation is an Owner-only item, not re-verified here. Do
not describe Phase 3GH as `PRODUCTION_VERIFIED` in this document until an Owner confirms both.

- Authenticated, server-authoritative **live valuation MVP** for KR/KRW portfolio positions
  (`buildKrPortfolioValuation`, `POST /api/portfolio/valuation`) is implemented, tested (86/86 checker, 55/55
  smoke as of the HF1 aggregate fail-closed hotfix), and merged.
- US/USD positions remain explicitly marked "supported in a future phase."

## 2. Phase 3GI — User Retention and Persistence (this phase)

Status label: `IMPLEMENTED_PUSHED_PREVIEW_READY_DB_MIGRATION_APPROVAL_PENDING` (final classification recorded
in `phase_3gi_user_retention_persistence_result_v0.1.md`; not `PRODUCTION_VERIFIED` — unmerged, and its new
migration has intentionally not been applied anywhere).

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
- New tests: `smoke:phase-3gi-user-retention-persistence` (35/35) and
  `check:phase-3gi-user-retention-persistence` (130/130), plus a full pre-existing regression gate re-run (see
  `phase_3gi_user_retention_persistence_result_v0.1.md` for the complete list and non-blocking classifications).
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

## 3. Explicitly deferred scope (not Phase 3GI, not Phase 3GH)

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
- **Phase 3GI — User Retention and Persistence.** `IMPLEMENTED_PUSHED_PREVIEW_READY_DB_MIGRATION_APPROVAL_PENDING`.
  See §2.

### Next sequential product phases

1. **Phase 3GJ — Live Market Dashboard.** `PLANNED`. A home/market surface that surfaces live KR/US index and
   sector state using the same KIS orchestration and cache already proven in Chart AI and Portfolio, without
   adding a third bespoke data path.
2. **Phase 3GK — Chart AI Beta Productization.** `PLANNED`. Graduate Chart AI from "beta preview gated behind
   `chartAiBetaPreview`" toward a stable, fully-Production, no-flag experience — closing out remaining HF-scale
   UX debt (mobile/a11y edge cases, similarity explainability polish) identified across the 3GG-T-HF3B
   sub-phases.
3. **Phase 3GL — Operations and Admin MVP.** `PLANNED`. Minimal internal visibility into usage-guard counters,
   KIS token health, and quote-cache staleness — currently only inspectable via ad hoc Owner smoke scripts and
   Supabase Dashboard queries, not a real operational surface.

Phase 3GJ is explicitly **not** started by this document or this phase — this section only records that it is
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
3. **DB migration backlog.** Both Phase 3GH's and Phase 3GI's migrations require separate Owner review and
   application before their respective server features stop degrading to their "not ready" fallback state in
   Production.
4. **No production DB read access during this phase**, same as prior phases — code-level correctness was
   verified without a live Supabase connection.
5. **US/USD valuation gap** (carried from the prior version) remains unresolved and increasingly visible as
   more surfaces (now including the watchlist, which is market-agnostic) add cross-market functionality
   around it.

## 6. Owner-only QA / decision items

- Confirm Phase 3GH's Production deployment status and apply/confirm its Supabase migration if not already
  done.
- Review and, if approved, apply the Phase 3GI migration (`20260724_user_retention_persistence.sql`) to the
  target Supabase project(s) — not performed by this phase per explicit instruction.
- Authenticated Preview QA of Phase 3GI's resume card, watchlist (Home + Chart AI), and Portfolio deep-link
  behavior, once a Preview session is available.
- Confirm the Phase 3GI PR's Preview deployment reaches READY with no secret printed, and that Netlify Preview
  is not red.
- Decide whether to merge the Phase 3GI PR (not performed by this phase per explicit instruction).
