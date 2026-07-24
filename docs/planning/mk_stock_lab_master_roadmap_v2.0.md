# MK Stock Lab Master Roadmap v2.0

Superscript of `roadmap_v0.1.md` (Phase 0–10 planning baseline, 2026-06-15), which used a coarse phase-number
scheme that no longer matches the fine-grained lettered/numbered phase history actually executed
(3A.. through 3GH as of this update). `roadmap_v0.1.md` is preserved unmodified as a historical planning
artifact; this document is the authoritative, current roadmap going forward. Written 2026-07-24 at the close
of Phase 3GH.

## 1. Current Production support — verified

Status label: `PRODUCTION_VERIFIED`. Only functionality actually deployed from `main` belongs in this section.
Phase 3GH live valuation is **not** included here — see §1a — because PR #4 is unmerged and no Production
deployment of it has occurred.

- **Home**: index cards, sparkline, market news, ad rail, portfolio panel summary link. `PRODUCTION_VERIFIED`.
- **Chart AI**: authenticated-only (`/chart-ai` requires a Supabase session — signed-out shows a lock card,
  zero provider/KIS/token requests until a chart is explicitly loaded); real KR/US OHLCV charts via KIS;
  Similarity engine with score guide, evidence level, and deterministic non-advisory insight; deterministic
  MK AI summary; Market Intelligence (benchmark, relative strength, USD/KRW via Frankfurter, commodities,
  volatility, regime — partial, interest rates and breadth not sourced); server-side daily usage guard
  (3 combined Similarity + MK Analysis runs/day/user, KST calendar boundary). `PRODUCTION_VERIFIED`.
- **Portfolio**: authenticated CRUD for multiple portfolios and KR/US positions is `PRODUCTION_VERIFIED`.
  Production valuation behavior remains whatever was deployed from `main` **before** Phase 3GH (Phase 3GH's
  authenticated KR/KRW live valuation has not been merged or deployed — see §1a).
- **Lab**: static S&P 500 sector / asset-class return matrices, cross-year hover, image export.
  `PRODUCTION_VERIFIED`.
- **Heatmap**: not yet implemented (still Phase 5 in the old roadmap — not started). `PLANNED`.
- **KIS instrument-master automation**: scheduled GitHub Actions refresh (KIS-only sources, PR-only, never
  auto-merges). `PRODUCTION_VERIFIED`.
- **Durable KIS token**: single-issuance, cross-request/cross-deploy reuse via Supabase-backed L2 store,
  PostgREST public bridge functions (service-role-only). `PRODUCTION_VERIFIED`.

## 1a. Phase 3GH release candidate — code/test/Preview verified

Status label: `PREVIEW_VERIFIED` for deployment state, `CODE_TEST_VERIFIED` for the implementation itself.
**Do not describe this section as Production until after PR #4 is merged and a Production deployment is
verified.**

- Authenticated, server-authoritative **live valuation MVP** for KR/KRW portfolio positions is implemented and
  covered by focused tests and a static contract checker (`CODE_TEST_VERIFIED`).
- PR `#4` (`feature/phase-3gh-portfolio-live-valuation-mvp` → `main`) is **open and unmerged**. No Production
  deployment has occurred and no Production Supabase mutation has occurred.
- Vercel Preview deployment for PR #4 has reached READY (`PREVIEW_VERIFIED`); Netlify Preview has not reported
  red.
- In-app Preview QA — both signed-out and authenticated — is `OWNER_QA_PENDING`: the Preview URL sits behind
  Vercel's Deployment Protection / SSO gate, which this assistant cannot authenticate through.
- US/USD positions are explicitly marked "supported in a future phase" rather than silently omitted or
  estimated, once this release candidate reaches Production.

## 2. What Phase 3GH implemented (`CODE_TEST_VERIFIED`; not yet `PRODUCTION_VERIFIED` — see §1a)

Authenticated, server-authoritative **live valuation MVP** for KR/KRW portfolio positions:

- New `POST /api/portfolio/valuation` (client sends only `portfolioId`; auth, ownership, position loading,
  quote resolution, and calculation all happen server-side).
- New pure calculation module `buildKrPortfolioValuation` (full/partial/unavailable/empty states; sanitized
  unsupported reasons; never fabricates a quote; weight computed only among priced rows).
- Scale/provider-safety limits enforced before any provider call (max 50 positions, max 30 unique KR symbols,
  quote concurrency capped at 3).
- Aggregate `__all_portfolios__` scope resolved as one authenticated server request over the user's own data.
- `portfolio.astro` UI rewritten: removed all Owner-Preview / Mocked-FX / fixture-mode code paths, replaced
  with the authenticated-live-only state model; partial state clearly labeled "지원 종목 기준"; unsupported
  rows shown (never hidden) with sanitized Korean copy; request-sequence guard prevents a stale response from
  overwriting a newer selection; refresh disabled while a request is pending.
- 10 obsolete fixture/owner-preview checker and smoke scripts retired (and their `package.json` entries
  removed); the pure calculation module has a dedicated 40-case smoke test and the full contract has an
  79-assertion static checker.

## 3. Explicitly deferred scope (not this phase)

- US/USD position live valuation.
- USD portfolio base-currency valuation and any live or mocked FX conversion.
- Dividends, realized P&L, transaction history, tax calculations, broker sync.
- Intraday charts and background/polling valuation refresh.
- Paid plans / advanced usage tiers for valuation.

## 4. Execution sequence

### Current implementation / release candidate

- **Phase 3GH — Portfolio Live Valuation MVP.** `CODE_TEST_VERIFIED` + `PREVIEW_VERIFIED`; PR #4 open and
  unmerged; not yet `PRODUCTION_VERIFIED`. See §1a.

### Next sequential product phases

1. **Phase 3GI — User Retention and Persistence.** `PLANNED`. Session durability, return-visit experience, and
   any lightweight engagement mechanics (e.g. watchlists, saved views) that don't require new paid
   infrastructure. Rationale: Chart AI and Portfolio now both have real authenticated value; retention
   determines whether that value compounds into repeat usage before further feature surface is added. Not
   started by this phase, per explicit Owner instruction.
2. **Phase 3GJ — Live Market Dashboard.** `PLANNED`. A home/market surface that surfaces live KR/US index and
   sector state using the same KIS orchestration and cache already proven in Chart AI and Portfolio, without
   adding a third bespoke data path.
3. **Phase 3GK — Chart AI Beta Productization.** `PLANNED`. Graduate Chart AI from "beta preview gated behind
   `chartAiBetaPreview`" toward a stable, fully-Production, no-flag experience — closing out remaining HF-scale
   UX debt (mobile/a11y edge cases, similarity explainability polish) identified across the 3GG-T-HF3B
   sub-phases.
4. **Phase 3GL — Operations and Admin MVP.** `PLANNED`. Minimal internal visibility into usage-guard counters,
   KIS token health, and quote-cache staleness — currently only inspectable via ad hoc Owner smoke scripts and
   Supabase Dashboard queries, not a real operational surface.

### Parallel post-release hardening lane (not a numbered product phase)

- Checker-suite consolidation — many phase-freeze checkers assert obsolete per-phase working-tree-scope
  invariants that fail on every subsequent phase (see §7). `DEFERRED`.
- Scheduled KIS instrument-master observation — periodic confirmation the automation continues to run
  KIS-only, PR-only, non-auto-merging. `DEFERRED`.
- `/api/market/quote` intent and rate-limit audit. `DEFERRED`.
- Authoritative active-gate manifest — a single source of truth for which checkers currently gate a merge vs.
  which are historical/superseded. `DEFERRED`.
- Stale Netlify dependency/configuration review. `DEFERRED`.
- Dead similarity code retirement. `DEFERRED`.
- `is_site_admin` SECURITY DEFINER permission review. `DEFERRED`.
- Leaked-password protection review. `DEFERRED`.
- Authenticated Chart AI usage-guard Owner QA. `OWNER_QA_PENDING`.
- Periodic re-verification that Production guards (Chart AI auth/usage, Preview access, KIS token, RLS,
  provider boundaries) have not regressed as new phases land. `DEFERRED`.

## 5. Top five risks

1. **Checker-suite decay.** A large and growing number of phase-freeze checkers (`check_phase_3xx_*`) assert
   "no other file changed since main," which is true only for the phase that introduced them and false for
   every phase after. This makes the true pass/fail signal of `npm run check:*` progressively less legible
   without manual per-phase triage (as done for this phase in §7 below).
2. **Historical fixture-contract checkers now assert a retired product behavior.** Several older Portfolio
   checkers (owner-review-prep, ticker-display-name, layout) assert that the UI still sends
   `source: fixture` / avoids real-time framing — the opposite of what Phase 3GH intentionally ships. They will
   continue to fail until explicitly retired or rewritten in a future phase; documented here so they are not
   mistaken for a live regression.
3. **US/USD valuation gap is now visible, not hidden.** Because unsupported rows are shown rather than
   omitted, users with US holdings will now see an explicit "not yet supported" state where before they saw
   nothing — correct per spec, but increases the visible pressure to ship Phase-3GH-scope US valuation sooner
   rather than later.
4. **KIS provider concurrency at portfolio scale.** The valuation route can issue up to 30 concurrent-batched
   KIS quote lookups per request (batches of 3); this has not yet been exercised under Production KIS rate
   limits with a real large multi-symbol portfolio.
5. **No production DB read access during this phase.** As with recent phases, code-level correctness was
   verified without a live Supabase connection; RLS/table-shape assumptions rely on the migration files, not
   live inspection.

## 6. Owner-only QA / decision items (this phase)

- Authenticated Preview QA of `/portfolio` live valuation (full/partial/unavailable states, US-row copy,
  refresh behavior, mobile layout) once a Preview session is available.
- Confirm the new PR's Preview deployment reaches READY with no secret printed.
- Decide whether to merge the Phase 3GH PR (not performed by this phase per explicit instruction).
- Decide whether/when to retire or rewrite the now-permanently-failing historical fixture-contract checkers
  named in §5.2 (out of scope for this phase — flagged, not fixed).

## 7. Historical checker triage performed this phase (for the record)

Running the closest-matching existing regression checkers against the Phase 3GH diff surfaced failures in:
`check:provider-boundaries` (pre-existing false positive on `chart-ai.astro`, a file this phase never
touched — confirmed via `git diff --stat HEAD -- src/pages/chart-ai.astro` returning empty),
`check:phase-3gg-t-hf2-hf1` / `check:phase-3gg-t-hf3a` / `check:phase-3gg-u-chart-ai-live-usage-guard`
(per-phase working-tree-scope freezes that assert no file outside their own phase changed since `main` —
false on any branch with more than one phase's commits, confirmed unrelated via `git diff --stat HEAD --
supabase/migrations/` returning empty), and `check:portfolio-owner-review-prep` /
`check:portfolio-ticker-display-name` / `check:portfolio-layout` (assert the old fixture-only contract this
phase intentionally retires per governing spec §16 — confirmed by inspecting the failing assertions
directly). `check:portfolio-holdings-category-header` failures (예상 연배당금 / dividend-yield category
markup) were confirmed pre-existing and unrelated via `git show HEAD:src/pages/portfolio.astro`, which shows
those strings absent from the phase's own baseline commit, before Phase 3GH touched the file. None of these
represent a regression introduced by this phase's diff. `check:phase-3gh-portfolio-live-valuation-mvp`
(86/86 as of the HF1 aggregate fail-closed hotfix, up from 79/79) and
`smoke:phase-3gh-portfolio-live-valuation-mvp` (55/55 as of HF1, up from 40/40) are the current-contract gates
for this phase's own change surface, alongside `check:kis-runtime-guard`, `check:kis-error-fallback`,
`check:phase-3gg-t-hf2` (durable KIS token), `check:portfolio-tab-order-persistence`,
`check:portfolio-create-sheet`, `check:portfolio-bookmark-tabs`, and `check:home-portfolio-panel`, all of
which pass clean.

## 8. Phase 3GH-HF1 hotfix (aggregate fail-closed correction)

A pre-merge hotfix on the same PR #4 branch corrected the aggregate (`__all_portfolios__`) valuation path in
`src/pages/api/portfolio/valuation.ts`: it previously converted an authoritative position-load failure for any
one owned portfolio into a silently empty position set (`if (!positionsResult.ok) return [];`), which could
return an incomplete aggregate valuation under HTTP 200 instead of failing closed. The aggregate loader
(`loadAggregateRecords`) now aborts the whole request and returns the existing sanitized failure response on
any position-load failure, with no quote/provider work started afterward. `CODE_TEST_VERIFIED`; not yet
`PRODUCTION_VERIFIED` (still gated on PR #4 merge — see §1a).
