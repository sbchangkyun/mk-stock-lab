# Phase 3GH — Authenticated KR Portfolio Live Valuation MVP — Result v0.1

Implements an authenticated, server-authoritative live valuation MVP for KR/KRW portfolio positions, reusing
the existing KIS quote orchestration Chart AI already depends on. **Explicitly not this phase:** US/USD
valuation, any FX conversion (live or mocked), dividends, realized P&L, transaction history, broker sync,
intraday charts, background polling. No Supabase migration was needed or created. No merge, no Production
deploy, no Production Supabase mutation was performed — all per explicit Owner instruction.

## 1. Executive classification

`IMPLEMENTED_PUSHED_PREVIEW_READY_OWNER_QA_PENDING` (final classification confirmed once the PR's Preview
deployment is verified READY — see the accompanying final report for the fully-verified value at time of
delivery).

## 2. Product policy implemented

- Authenticated-only: client sends only `portfolioId`; the server independently resolves the user, validates
  Supabase configuration, validates the payload, verifies ownership, and only then loads positions and
  resolves quotes.
- KR/KRW scope only. A position is only eligible for real valuation when `market === 'KR'` and
  `currency === 'KRW'` and it has a syntactically valid 6-character KR symbol and a positive
  quantity/buyPrice; every other case resolves to a sanitized `unsupportedReason` and is still shown in the
  UI (never silently hidden).
- Aggregate scope (`__all_portfolios__`) is resolved as one authenticated server-side request loading only
  the calling user's own portfolios and positions — never as N per-portfolio browser requests.
- Provider-safety limits enforced before any KIS call: max 50 position rows, max 30 unique KR symbols,
  provider concurrency capped at 3, symbols deduped by market+symbol.
- Aggregate states: `full` (all positions valued), `partial` (some valued, some not — always labeled
  "지원 종목 기준" and shows the excluded-row count), `unavailable` (no position could be valued),
  `empty` (no positions at all). Partial/unavailable totals are never presented as a complete portfolio value.
- Never fabricates a quote: an unresolved KR quote produces `currentPrice: null` / `marketValue: null` with
  reason `quote_unavailable`, not a stale or cost-basis-derived substitute.

## 3. Retired old contract

Removed the previous Owner-Preview / mocked-FX / fixture-provider valuation contract entirely (client-supplied
`positions`, `source: 'fixture' | 'live'`, `previewMode`, `allowLiveQuotes`, `allowMockedFx`, `fxMode`) per
governing spec §16 — live authenticated valuation is now the only deployed browser contract; fixture providers
remain available only as injectable test doubles in the new test suite.

Ten now-unreferenced scripts were deleted, and their `package.json` entries removed:
`check_kr_quote_preview_expansion_portfolio_live_preview_plan_static_contract.mjs`,
`check_phase_3eb_portfolio_mixed_currency_owner_preview_api_contract.mjs`,
`check_phase_3ee_portfolio_mixed_currency_preview_ui_wiring_plan_static_contract.mjs`,
`check_portfolio_live_preview_api_contract.mjs`,
`check_portfolio_live_preview_owner_smoke_closeout_static_contract.mjs`,
`check_portfolio_live_preview_owner_smoke_static_contract.mjs`,
`check_portfolio_ui_valuation_fixture_mapping_static_contract.mjs`,
`check_portfolio_valuation_api_route_fixture_contract.mjs`,
`owner_smoke_portfolio_live_preview_api.mjs`, `owner_smoke_portfolio_mixed_currency_preview_api.mjs`.

### 3.1 Historical phase-freeze checkers left unmodified (documented, not silently waived)

The following pre-existing checkers now fail as a direct, expected consequence of the §16-authorized
retirement above, and were deliberately left unmodified (consistent with this codebase's established
treatment of phase-freeze checkers across prior phases):

- `check_gnews_news_policy_static_contract.mjs` and `check_kis_valuation_pre_design_static_contract.mjs` —
  each contains a historical "Phase 3BW artifact checks" section asserting `existsSync` on
  `check_portfolio_valuation_api_route_fixture_contract.mjs` and a `package.json` entry for
  `check:portfolio-valuation-api`, both now retired.
- `check_phase_3dq_ui_preview_mode_wiring_plan_static_contract.mjs` and
  `check_phase_3ec_owner_mixed_currency_preview_smoke_static_contract.mjs` — each references the now-deleted
  owner-smoke scripts `owner_smoke_portfolio_live_preview_api.mjs` /
  `owner_smoke_portfolio_mixed_currency_preview_api.mjs`.
- `check:portfolio-owner-review-prep`, `check:portfolio-ticker-display-name`, `check:portfolio-layout` —
  assert the old fixture-only / non-real-time-framing UI contract this phase intentionally supersedes.
- `check_phase_3gg_t_hf2_hf1_bridge`, `check_phase_3gg_t_hf3a`, `check_phase_3gg_u_chart_ai_live_usage_guard`
  — each is a per-phase working-tree-scope freeze ("only my phase's own files changed since `main`"), which is
  necessarily false once any later phase changes a shared file; each failure was independently confirmed
  unrelated to this phase's diff (see §5 gate table).

None of the above represent a regression introduced by this phase; each is either a proven pre-existing/
unrelated failure or a proven, spec-authorized contract supersession.

## 4. Implementation surface

- `src/lib/server/portfolioValuation.ts` — pure `buildKrPortfolioValuation` calculation (already implemented
  prior to this result doc being written; unchanged this segment). Server-only via `assertServerRuntime`.
- `src/pages/api/portfolio/valuation.ts` — `POST` route: auth → payload validation → ownership → limits →
  bounded-concurrency KIS quote resolution → `buildKrPortfolioValuation` → sanitized JSON response with
  `Cache-Control: no-store`. Error codes: `AUTH_REQUIRED`, `PORTFOLIO_API_DISABLED`, `INVALID_PAYLOAD`,
  `PORTFOLIO_NOT_FOUND`, `PORTFOLIO_VALUATION_LIMIT_EXCEEDED`, `PORTFOLIO_VALUATION_UNAVAILABLE`,
  `INTERNAL_ERROR`, all with Korean messages.
- `src/lib/portfolioClient.ts` — `getValuation(portfolioId)` using the same authenticated `requestJson` helper
  as existing CRUD calls; posts `{ portfolioId }` only.
- `src/pages/portfolio.astro` — rewritten valuation UI: signed-out/loading/empty/valuation-loading/full/
  partial/unavailable/stale-but-usable/refresh-pending/sanitized-error states; request-sequence guard against
  stale-response overwrite; refresh disabled while pending; unsupported rows always shown with sanitized
  Korean copy; summary shows total evaluated assets, cost basis, unrealized P/L and %, coverage, last quote
  time, and a stale notice.

## 5. Test coverage and regression gates

- New `smoke:phase-3gh-portfolio-live-valuation-mvp` (`portfolio_valuation_testsrc.ts`, bundled via esbuild) —
  **40/40 passed**. Covers empty/full/partial/unavailable states, all five reachable sanitized unsupported
  reasons, never-fabricated-quote behavior, weight normalization among valued rows only, mixed staleness
  aggregation, and calculation determinism.
- New `check:phase-3gh-portfolio-live-valuation-mvp` static contract checker — **79/79 passed** across 12
  groups (file existence; authenticated server boundary; retired-contract absence; scale/provider-safety
  limits; aggregate scope isolation; response contract; sanitized reasons; shared provider types; client
  integration; UI retirement; no account/trading surfaces; `package.json` wiring).
- Regression surface run clean: `npm ls --depth=0`; `npm run build`; `git diff --check`;
  `check:kis-runtime-guard` (7/7); `check:kis-error-fallback` (48/48); `check:phase-3gg-t-hf2` durable KIS
  token (160/160); `check:portfolio-tab-order-persistence` (61/61); `check:portfolio-create-sheet` (79/79);
  `check:portfolio-bookmark-tabs` (121/121); `check:home-portfolio-panel` (102/102).
- Gates independently investigated and classified as pre-existing/unrelated or legitimate spec-authorized
  supersession (evidence in each case via `git diff --stat HEAD -- <file>` or `git show HEAD:<file>` showing
  the asserted content absent from or unrelated to this phase's own diff): `check:provider-boundaries`,
  `check:portfolio-owner-review-prep`, `check:portfolio-ticker-display-name`, `check:portfolio-holdings-header`,
  `check:portfolio-layout`, `check:phase-3gg-t-hf2-hf1`, `check:phase-3gg-t-hf3a`,
  `check:phase-3gg-u-chart-ai-live-usage-guard`.

## 6. Database boundary

No migration was created or applied. The route reads existing `public.portfolios` and
`public.portfolio_positions` (already RLS-scoped to the owning user) and the existing KIS quote path
(`public.market_quote_cache` via the existing quote orchestration); it persists no prices, valuations, or raw
provider responses. No Production Supabase mutation occurred this phase.

## 7. Deployment status

Feature branch `feature/phase-3gh-portfolio-live-valuation-mvp` pushed to origin; one PR opened targeting
`main` per governing spec §21. Not merged. No Production deploy triggered. Preview deployment verification
status is reported in the accompanying final report, not duplicated here to avoid staleness between this
document and the actual verification run.

## 8. Roadmap

See `docs/planning/mk_stock_lab_master_roadmap_v2.0.md`, newly created this phase (the prior
`roadmap_v0.1.md` used an incompatible Phase 0–10 numbering scheme and is preserved unmodified as a historical
artifact). Next phase order: 3GI (User Retention/Persistence) → 3GJ (Live Market Dashboard) → 3GK (Chart AI
Beta Productization) → 3GL (Operations/Admin MVP), plus a parallel hardening lane. **Phase 3GI is not started
by this phase**, per explicit Owner instruction.
