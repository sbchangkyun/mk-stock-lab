# Phase 3GL — Home Live Data and GNews — Result v0.1

Replaces the Home page's static/fixture-era market ticker and market-news list with real, live data: one
shared server-side orchestrator serves both the 9-item ticker belt and the 4-card Market Snapshot from a
single closed-registry resolution pass, and a new server-only GNews client feeds a real, capped,
deterministically-classified market-news list. **Explicitly not this phase:** a client-controlled symbol
fan-out API, a second general stock-market data provider, a new KIS endpoint/TR ID, a new FX provider, any
account/order/balance/funds/trading capability, broad manual QA, merging the PR, a Production deploy, any
Vercel environment mutation, any Supabase migration, or starting Phase 3GM.

## 1. Executive classification

`IMPLEMENTED_LOCAL_REGRESSION_GATE_GREEN_COMMIT_PUSH_PR_VERIFICATION_PENDING`. All implementation and new
test-suite work for this phase is complete on branch `feature/phase-3gl-home-live-data-and-gnews` (created
from `origin/main` at `0e53cde`, the Phase 3GK merge commit). The full focused regression gate for this
phase (3GL smoke/check, 3GJ smoke/check, `npm ls --depth=0`, `npm run build`, `git diff --check`) is green
(see §5). No commit, no push, and no PR have been created yet — that is the next task in sequence (§6). No
Production deploy, no Vercel environment mutation, and no Supabase migration have been performed by this
phase.

## 2. Shared Home live-market orchestrator

`src/lib/server/homeLiveMarket/homeLiveMarket.ts` defines a closed, 9-entry `HOME_TICKER_REGISTRY`
(`sp500`, `nasdaq100`, `dowjones`, `kospi`, `kosdaq`, `usdkrw`, `dollarindex`, `gold`, `wti`) — 8 items
resolved via the existing shared KIS long-history OHLCV orchestration and instrument resolver (ETF proxies:
`SPY`, `QQQ`, `DIA`, `069500`, `229200`, `UUP`, `GLD`, `USO`), and `usdkrw` resolved via the existing
Frankfurter-backed `fetchUsdKrwContext`. No new KIS endpoint/TR ID and no new FX provider were introduced.
Resolution runs with the same bounded concurrency (limit 3) reused from `marketDashboard.ts`
(`mapWithConcurrency`, `resolveFreshnessDiagnosis`, and `parseMarketDataTimestampToUtcMs` were made
`export`-only — no behavior change — so this module could reuse them instead of re-implementing them).

`GET /api/home/live-market.json` calls this orchestrator once per request and returns `{ ok, generatedAt,
ticker, snapshot }`: `ticker` always carries all 9 items (each individually `status: 'ok'` or
`'unavailable'`, never fabricated), and `snapshot` is a fixed 4-item subset (`kospi`, `kosdaq`, `sp500`,
`nasdaq100`) that is **always present at length 4** — items that failed to resolve are included as
individually-unavailable cards rather than being dropped, so the Market Snapshot grid never reflows based on
data availability. The route reuses the existing `allowProductionMarketDashboardLiveData` readiness
exception (no new Vercel environment variable), returns `MARKET_DASHBOARD_SANITIZED_ERROR_CODES` values,
uses a 45s `s-maxage`/`stale-while-revalidate` cache on success and `no-store` on failure, reads zero query
parameters, and rejects non-GET methods.

`Ticker.astro` and `HomeLiveMarketSnapshot.astro` were rewritten to both consume this one shared route
(confirmed by test and by checker: exactly one `fetch()` call per component, no duplicate provider call
between the two components). Both refresh every 60s via a recursive `window.setTimeout` (never
`setInterval`), pause while `document.hidden`, guard against overlapping in-flight requests, never append a
cache-bypass query parameter, and never use `localStorage` to persist market data. Home no longer performs
its own SSR fetch to `/api/market/overview.json` or the old fixture-first market-feed route; the `/market`
page's own independent use of `/api/market/overview.json` and `/api/market/dashboard.json` is untouched.

## 3. GNews home feed

`src/lib/server/homeNews/gnewsHomeNewsProvider.mjs` is a new, self-contained, server-only module. It reads
no environment variable directly — the API key is always injected by the caller — issues exactly one
`COMBINED_QUERY` search per 5-minute cache window (deliberately not the existing multi-theme,
fixture-first `src/lib/news/gnewsLiveFetchAdapter.mjs` pipeline behind `/api/news/market-feed`, which is left
in place but now unreferenced by Home), and returns at most 6 client-safe, normalized articles. Each article
is classified into one of 6 categories (`DOMESTIC_STOCKS`, `OVERSEAS_STOCKS`, `FX`, `MACRO`, `COMMODITIES`,
`GENERAL_MARKET`) by Korean keyword matching, deduplicated by canonical URL (tracking parameters stripped)
and by normalized title, and sorted newest-first. Full article `content` is never requested or stored. An
absent/empty key returns a sanitized `NEWS_NOT_CONFIGURED` result — never a fixture fallback; provider
401/403 maps to `NEWS_UNAUTHORIZED`, 429 to `NEWS_RATE_LIMITED`, and any other failure (including a malformed
body) to a sanitized `NEWS_PROVIDER_ERROR` — the raw provider error is never thrown to the caller.

`GET /api/news/home.json` reads only `GNEWS_API_KEY` (never the pre-existing client-exposed
`PUBLIC_GNEWS_API_KEY`), reads zero query parameters, uses a `s-maxage=300, stale-while-revalidate=900`
cache on success and `no-store` on failure, rejects non-GET methods, and never logs or echoes the raw key.
`HomeMarketNews.astro` was rewritten into a client-fetching component (5-minute refresh, visibility pause,
in-flight guard) that renders an honest empty state when no articles are available, and defends against the
untrusted external content with an `escapeHtml` helper applied to every rendered field (category badge,
source name, title) and an `isSafeHttpUrl` guard restricting the rendered link to `http(s)` schemes only,
with the href itself escaped at interpolation time. It no longer accepts an `articles` prop — it owns its
own fetching.

## 4. New test suites

- `scripts/smoke_phase_3gl_home_live_data.mjs` (bundles `scripts/home_live_data_testsrc.ts` via esbuild, no
  network, no Supabase, no env read) — **58/58 passed.** Covers `getHomeLiveMarket`: full success (9/9
  ticker, snapshot exactly `[kospi, kosdaq, sp500, nasdaq100]` in order, `usdkrw` price sourced from FX not
  OHLCV, every item carries a non-empty `basisLabel`); partial KIS failure with FX still available (ticker
  degrades individual items to `unavailable` with null fields, snapshot still carries all 4 fixed ids marked
  unavailable rather than dropped); total failure (`ok: false`, `MARKET_DATA_UNAVAILABLE`, empty snapshot,
  ticker never empty); insufficient-history degradation; and bounded concurrency (`maxInFlight <= 3`). Covers
  `gnewsHomeNewsProvider.mjs`: article normalization/rejection rules, category classification priority order,
  the closed 6-category enum, dedupe-and-rank behavior, and `getHomeNewsFeed`'s not-configured/401/429/
  malformed-body/success/cache-hit/cache-expiry paths (including a direct assertion that the fake API key
  string is never echoed in any returned JSON).
- `scripts/check_phase_3gl_home_live_data_contract.mjs` (static, no-network) — **117/117 passed.** Asserts
  the closed 9-item registry and 4-item snapshot subset, the orchestration boundary (reuse only, no new
  KIS/FX surface, no direct KIS transport import), the `live-market.json` route's closed query/cache/error
  contract, the GNews provider's key handling and no-fixture-fallback guarantee, the `home.json` route's
  contract, all three client components' polling/localStorage/cache-bypass/visibility/in-flight/idempotent-
  setup discipline, `HomeMarketNews.astro`'s XSS-safe rendering, Home page wiring, absence of prohibited
  surfaces, and `package.json` script wiring.
- Four checker-authoring false positives were found and fixed during authoring (not source defects): a URL
  match regex that captured only the `https://` protocol prefix instead of the full literal (fixed to capture
  the full URL before checking it points at `frankfurter`); an overly broad `header` word match that flagged
  the route's own legitimate HTTP `headers: { 'Content-Type': ... }` object (narrowed to the specific
  provider-leak identifiers `accessToken`/`Authorization`/`rawPayload`/etc.); a bare `fixture` word match that
  flagged the provider's own doc-comment explaining it *has no* fixture fallback (narrowed to an actual
  `import ... fixture` or `const ...Fixture = ...` pattern); and an overly broad `localStorage` read/write
  match that flagged `Ticker.astro`'s pre-existing, unrelated theme-preference read (narrowed to `setItem`
  only, since the invariant under test is "never *persists* data," not "never reads").

## 5. Regression gate

- `npm run smoke:phase-3gl-home-live-data` — 58/58 passed.
- `npm run check:phase-3gl-home-live-data` — 117/117 passed.
- `npm run smoke:phase-3gj-live-market-dashboard` — 162/162 passed.
- `npm run check:phase-3gj-live-market-dashboard` — 159/159 passed (one ripple fixed this phase: the
  checker's Group 8b assertion hard-coded `HomeLiveMarketSnapshot.astro` fetching `/api/market/overview.json`
  directly; since this phase intentionally migrated that component onto the new shared
  `/api/home/live-market.json` route — §2 — the assertion was updated to accept either route while still
  requiring exactly one script-level `fetch()` call).
- `npm ls --depth=0` — clean, no unmet/invalid dependency.
- `npm run build` — Astro/Vite/Vercel-adapter build completed successfully, no error.
- `git diff --check` — exit 0 (only CRLF/LF line-ending advisories on 3 touched `.astro` files, no conflict
  markers, no trailing-whitespace errors).

## 6. Not yet performed (next steps in sequence)

- Pre-commit inspection (git status/diff/staged-diff review, staged secret scan, staged NUL-byte scan), one
  commit ("Phase 3GL: add live Home data and GNews feed"), push `feature/phase-3gl-home-live-data-and-gnews`,
  open one PR to `main`, wait for Vercel Preview `READY` and Netlify not-red, and perform the minimum Preview
  checklist — explicitly without merging (task in progress next).
- Merging the PR, Production deployment, and Production QA are Owner-only items not performed by this phase.

## 7. Next phase

**Phase 3GM — Operations and Admin MVP.** `PLANNED`, not started by this phase.
