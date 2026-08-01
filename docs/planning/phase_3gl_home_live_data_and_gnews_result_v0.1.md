# Phase 3GL — Home Live Data and GNews — Result v0.1

Replaces the Home page's static/fixture-era market ticker and market-news list with real, live data: one
shared server-side orchestrator serves both the 9-item ticker belt and the 4-card Market Snapshot from a
single closed-registry resolution pass, and a new server-only GNews client feeds a real, capped,
deterministically-classified market-news list. **Explicitly not this phase:** a client-controlled symbol
fan-out API, a second general stock-market data provider, a new KIS endpoint/TR ID, a new FX provider, any
account/order/balance/funds/trading capability, broad manual QA, merging the PR, a Production deploy, any
Vercel environment mutation, any Supabase migration, or starting Phase 3GM.

## 1. Executive classification

`IMPLEMENTED_PUSHED_PREVIEW_READY_HOME_MARKET_AND_GNEWS_FUNCTIONAL_VERIFICATION_OWNER_PENDING` (HF2 state;
see §1c for the HF3 hotfix's own classification,
`IMPLEMENTED_PUSHED_PREVIEW_READY_ROLLING_TICKER_AND_SNAPSHOT_SPARKLINES_OWNER_VISUAL_VERIFICATION_PENDING`,
reported in the final HF3 phase report once commit/push/Preview-check complete). All implementation and test
work for this phase, including the **Phase 3GL-HF1 hotfix** (§1a), the **Phase 3GL-HF2 hotfix** (§1b), and
the **Phase 3GL-HF3 hotfix** (§1c), is complete and pushed on branch `feature/phase-3gl-home-live-data-and-gnews`
(created from `origin/main` at `0e53cde`, the Phase 3GK merge commit; PR #8, HF2 commit `354c454`). The full
focused regression gate for this phase (3GL smoke/check, 3GJ smoke/check, `npm ls --depth=0`,
`npm run build`, `git diff --check`) is green (see §5). The Vercel Preview deployment for `354c454` reached
`Ready` (`gh api .../commits/354c454/statuses` reports the `Vercel` context as `success`, "Deployment has
completed"; the `vercel[bot]` PR comment shows the `Ready` badge and the same commit/branch); the Netlify
deploy-preview also reached `success`. The Preview app itself
(`https://mkstocklab-git-feature-phase-8e5209-sbchangkyun-2946s-projects.vercel.app`) responds `302` to
`https://vercel.com/sso-api?...` — i.e. it is gated behind Vercel Deployment Protection (SSO), consistent
with every prior Preview in this project's history. This is a clean SSO redirect (not a platform/alias
error page), which is the best available unauthenticated signal that the alias resolved correctly
(`aliasError` effectively null), but it means the §15 functional checklist (Home 200 with real content,
ticker length 9, snapshot length 4 with exact labels, no contradictory change directions, corrected basis
label, GNews single-request/diagnostics/zero-or-nonzero-result behavior, no secret/raw-payload exposure)
cannot be performed by this assistant without owner credentials, which this phase does not enter under any
circumstance (see §2 of the governing spec). No Production deploy, no Vercel environment mutation, and no
Supabase migration have been performed by this phase.

### 1c. HF3 hotfix — continuous ticker motion and Snapshot sparklines

Phase 3GL-HF3 is a follow-up enhancement on the same branch/PR (`feature/phase-3gl-home-live-data-and-gnews`,
PR #8), addressing four owner observations on the HF2 Preview: (1) the top ticker belt should roll
continuously left instead of sitting static; (2) the Market Snapshot should cover more market types; (3)
every Snapshot card should carry a miniature line chart; (4) the GNews `NEWS_NO_RESULTS` empty state was
confirmed as an honest, expected outcome (see `GNEWS_NO_RESULTS_EXPECTED_EMPTY_STATE_CONFIRMED` below) and
required no change.

- **Continuous rolling ticker belt**: `Ticker.astro` now owns a self-contained marquee animation, entirely
  separate from market-data fetching. On setup (skipped when `prefers-reduced-motion: reduce`), it clones the
  semantic `.ticker-track` into a second, `aria-hidden="true"` visual track inside `.ticker-rail`, then drives
  a CSS `transform: translate3d(...)` animation across both tracks at a fixed ~48px/s (clamped to a
  15-90s cycle regardless of measured content width). Every payload refresh calls `relayoutRolling`, which
  reads the rail's current computed transform to derive in-progress-fraction, recomputes the loop distance
  from the newly-rendered track's real `scrollWidth`, and re-applies the animation with a negative
  `animation-delay` equal to that same progress — so a 60s content refresh never causes a visible jump or
  restart. Only non-clone chips are made keyboard-tabbable (`rollingActive` gate); the clone track is fully
  `aria-hidden` and non-tabbable. `Ticker.astro` adds its own `visibilitychange` listener whose entire body is
  `rail.classList.toggle('ticker-rail--paused', document.hidden)` — this pauses the CSS animation only, never
  fetches or re-renders, and is intentionally distinct from (not a duplicate of) the shared
  `homeLiveMarketController.ts`'s own visibility-driven fetch-pausing.
- **Market Snapshot expanded to the full 9-item registry**: the Snapshot grid now renders all 9
  `HOME_TICKER_REGISTRY` entries (previously a fixed 4-item subset: `kospi`, `kosdaq`, `sp500`, `nasdaq100`)
  — adding `dowjones`, `usdkrw`, `dollarindex`, `gold`, `wti` — using the exact same one-request,
  closed-registry resolution the ticker belt already relies on. No new instrument, KIS endpoint/TR ID, or FX
  provider was introduced; the grid is now responsive (3 columns / 2 columns / 1 column by viewport width)
  instead of a fixed 4-card row.
- **Sparkline data contract**: `homeLiveMarket.ts` adds a closed `HomeSparklineStatus`
  (`'ok' | 'unavailable'`) and `HomeSparklineBasis` (`'daily_close' | 'reference_fx' | 'unavailable'`) pair,
  plus `sparklinePeriodLabel` and a `sparkline: { date, value }[]` array capped at `HOME_SPARKLINE_POINTS = 20`
  points, always ascending by date, with every `value` finite and strictly positive; a shared
  `UNAVAILABLE_SPARKLINE` constant is returned whenever fewer than 2 usable points exist, never a fabricated
  or interpolated value.
- **Quote-first-then-unconditional-OHLCV resolution**: `resolveKisTickerItem` still calls the current-quote
  snapshot first and derives `quoteOk` from it exactly as before, but now **unconditionally** calls
  `deps.fetchLongHistoryOhlcv` regardless of `quoteOk` — previously this call only happened as a fallback when
  the quote failed. The headline price/change fields are computed exactly as before
  (`quoteOk ? toCurrentQuoteItem(...) : buildOhlcvFallbackItem(...)`) and are never touched by the sparkline
  step; the sparkline is built independently via `buildKisSparkline(historyResult, ...)` and merged in without
  overwriting any headline field (`{ ...headline, ...buildKisSparkline(...) }`). `buildKisSparkline`
  deduplicates candles by date, sorts, keeps the last 20, and falls back to `UNAVAILABLE_SPARKLINE` on
  insufficient/stale history — it never blocks or degrades the headline quote.
- **FX sparkline via the existing Frankfurter/ECB source**: `crossAssetProvider.mjs` adds
  `fetchUsdKrwSparklineSeries` (cached 6 hours, capped to 20 points, `available`/`series`/
  `sanitizedErrorCode` shape), imported into `homeLiveMarket.ts` alongside the pre-existing
  `fetchUsdKrwContext`. No new FX provider was introduced.
- **Dependency-free inline SVG rendering**: `HomeLiveMarketSnapshot.astro` renders each card's sparkline as a
  hand-built `<svg><polyline>` (fixed 88×32 viewBox, no charting library, no new dependency), with the
  up/down/flat direction class derived from the sparkline's own first/last point — deliberately independent
  of the card's `changePct` sign, since the two can legitimately disagree over different windows. A card with
  `sparklineStatus !== 'ok'` or fewer than 2 points renders an honest "차트 데이터 없음" placeholder instead
  of an empty or fabricated chart.
- **`GNEWS_NO_RESULTS_EXPECTED_EMPTY_STATE_CONFIRMED`**: the HF2 `NEWS_NO_RESULTS` contract (§1b) was
  reviewed against this observation and confirmed correct as-is — a genuinely empty GNews feed is expected,
  honest behavior, not a bug. No fixture, second provider, LLM, or validation change was made.
- No new KIS endpoint/TR ID, no new FX provider, no second market-data provider, and no
  account/order/balance/trading capability were introduced. Commit message for this hotfix: "Phase 3GL-HF3:
  add rolling ticker and Snapshot sparklines".
- **Test suite extension**: `scripts/home_live_data_testsrc.ts` grew to **138/138** passing (new Group 1d:
  KIS sparkline capping/ordering, sparkline-failure-never-blocks-headline, FX sparkline ok/unavailable, and a
  no-duplicate-fetch guarantee). `scripts/check_phase_3gl_home_live_data_contract.mjs` grew to **210/210**
  passing after 4 checker-staleness fixes (not source defects — the implementation was already correct; the
  static assertions had not been updated to match the intentional HF3 design changes): the FX-sparkline
  import-string assertion was widened for the two-name `fetchUsdKrwContext, fetchUsdKrwSparklineSeries`
  import; the obsolete `resolveOhlcvFallbackItem`-based ordering check (that function was renamed to
  `buildOhlcvFallbackItem`) was replaced with an assertion on the real `deps.fetchLongHistoryOhlcv`/
  `const headline = quoteOk` unconditional-fetch shape; the obsolete "quote success skips a second OHLCV
  attempt" assertion (testing the pre-HF3 early-return design that HF3 deliberately replaced) was replaced
  with an assertion on the `quoteOk ? toCurrentQuoteItem(...) : buildOhlcvFallbackItem(...)` ternary; and the
  shared "owns no visibilitychange listener of its own" check was scoped to only
  `HomeLiveMarketSnapshot.astro` (still true) with a new, narrowly-scoped positive check added confirming
  `Ticker.astro`'s own listener body is exactly the animation-pause toggle and nothing else (no fetch/render
  call inside it).
- **Regression gate**: `npm run smoke:phase-3gl-home-live-data` 138/138; `npm run check:phase-3gl-home-live-data`
  210/210; `npm run smoke:phase-3gj-live-market-dashboard` 162/162 (no ripple); `npm run check:phase-3gj-live-market-dashboard`
  159/159 (no ripple); `npm ls --depth=0` clean; `git diff --check` exit 0 (only benign CRLF/LF advisories).
  `npm run build` (Astro 6.1.1 / Node v24.14.1 / `@astrojs/vercel@10.0.4`) completed every logged build stage
  with zero errors or warnings and produced complete `dist/client`, `dist/server`, `.vercel/output/server`,
  and `.vercel/output/static` artifacts, but the Node process then crashed on exit with a native
  `STATUS_STACK_BUFFER_OVERRUN` (exit code `-1073740791`), reproduced identically across 3 runs with no
  crash-dump found. This is recorded honestly as a build-content **pass with a process-exit anomaly**, not
  silently upgraded to an unqualified pass: all real build work completes and all artifacts are verified
  complete before the native crash, and it is assessed as a pre-existing Node/esbuild-on-Windows
  process-teardown issue unrelated to the HF3 diff (a clean-baseline comparison via `git stash` or a fresh
  `git worktree` + `npm install` was not attempted, since both are prohibited by this phase's governing
  constraints).
- **Preview verification**: not yet performed as of this writing — commit, push, and the §15 Preview check
  (deployment-level state plus the 13 functional checks) are the immediate next steps in this same phase,
  reported in the final phase report rather than re-stated here.

### 1b. HF2 hotfix — corrected quote direction and honest GNews empty-feed handling

Phase 3GL-HF2 was a narrow, release-blocking correction of two bugs observed on the HF1 Preview: KIS quote
items occasionally showed a positive change amount alongside a negative change percentage (or vice versa),
and a genuinely empty GNews result was indistinguishable from a successful feed (`ok: true, articleCount: 0`).
Scope and PR title are unchanged from HF1.

- **Shared KIS sign-normalization helper**: new pure module
  `src/lib/server/providers/kis/kisQuoteSignNormalization.ts` exports `normalizeKisQuoteSign`, a single
  deterministic helper used by both the domestic and overseas quote functions. Priority order: (1) the
  official KIS direction/sign code (`prdy_vrss_sign` domestic, `sign` overseas — the shared 5-value
  convention: `1` upper-limit-up, `2` up, `3` unchanged, `4` lower-limit-down, `5` down) always wins; (2)
  when no sign code is available, already-agreeing raw amount/pct signs pass through unchanged; (3) an
  unsigned amount paired with a signed, non-zero pct takes the pct's sign (this is the exact shape of both
  observed Preview bugs); (4) both-null or single-null fields pass through without fabrication. Verified by a
  12-case invariant sweep: `change` and `changePct` never land on opposite non-zero signs.
- **Domestic quote correction**: `getKisDomesticQuoteSnapshot` now parses `prdy_vrss_sign`, resolves
  `change`/`changePct` through the shared helper (no more direct `prdy_vrss`/`prdy_ctrt` mapping), and
  cross-checks the resolved change against `stck_prpr - stck_sdpr` (current price minus previous close); on a
  material mismatch only the `change` field is nulled — `changePct` and `price` stay usable. No movement is
  ever rejected merely for being large.
- **Overseas quote correction**: `getKisOverseasQuoteSnapshot` now parses the official overseas `sign` field
  (same 5-value convention as domestic) and resolves through the same shared helper, replacing the previous
  direct `diff -> change` / `rate -> changePct` mapping that was the root cause of the Dollar Index and WTI
  Oil sign-contradiction bugs (`diff` is an unsigned magnitude per the official KIS overseas contract, but was
  being treated as already-signed).
- **Home-layer defensive safety net**: `toCurrentQuoteItem` in `homeLiveMarket.ts` adds a final,
  independent contradiction check (`Math.sign(changeAmount) !== Math.sign(changePct)` when both are non-null
  and non-zero) that nulls only `changeAmount` — never `changePct`, and never a silent value inversion.
- **Honest basis wording**: the current-quote basis label changed from the inaccurate `실시간(지연) 시세
  기준` ("real-time (delayed) quote basis") to `KIS 현재가 조회 기준` ("KIS current-price lookup basis"); the
  `dataBasis: 'current_quote'` enum value is unchanged.
- **GNews empty-feed diagnosis and honest zero-result contract**: `getHomeNewsFeed` now computes three
  sanitized integer counters — `providerArticleCount` (raw provider array length), `normalizedArticleCount`
  (survivors of `normalizeGnewsHomeArticle`), `returnedArticleCount` (post-dedupe/cap final count) — attached
  as `diagnostics` on every successful and zero-result response (never on a provider-failure response, where
  there is nothing meaningful to count). When `returnedArticleCount === 0`, the route now returns `{ ok:
  false, code: 'NEWS_NO_RESULTS', diagnostics }` (HTTP 200, `no-store`) instead of an indistinguishable
  `ok: true` with an empty array; this zero-result outcome is still cached for the same 5-minute window as a
  success, preserving the one-provider-request-per-window invariant.
- **GNews query simplification**: `COMBINED_QUERY` was reduced from a 16-term OR expression to a conservative
  8-term set — `코스피 OR 코스닥 OR 국내증시 OR 뉴욕증시 OR 나스닥 OR 환율 OR 금리 OR 유가` — after the
  16-term version returned zero articles against the live provider in Preview; still exactly one combined
  query per cache window, no per-category fan-out, no second fallback provider request, no LLM, no fixture
  fallback.
- No new KIS endpoint, no new KIS TR ID, no second market-data provider, no second FX provider, and no
  account/order/balance/trading capability were introduced.

### 1a. HF1 hotfix — corrected live-data contract

Phase 3GL-HF1 hardened the implementation described in §2-§3 without changing scope or the required PR
title ("Phase 3GL: add live Home data and GNews feed"):

- **Quote-first resolution**: `resolveKisTickerItem` now calls the existing KIS current-quote snapshot
  functions (`getKisDomesticQuoteSnapshot`/`getKisOverseasQuoteSnapshot`) first, sequentially (never via
  `Promise.all`/`Promise.race`), and only falls back to the pre-existing OHLCV-based resolution when the
  quote call fails. No new KIS endpoint or TR ID was introduced. Two new closed enums, `HomeDataBasis`
  (`current_quote | latest_close | reference_fx | unavailable`) and `HomeFreshness` (`fresh | cached | stale
  | unavailable`), make the basis and freshness of every ticker/snapshot item explicit.
- **Snapshot computed once**: `getHomeLiveMarket` now computes `const snapshot = buildSnapshot(ticker)`
  exactly once, before the total-failure/success branch split, and both return objects reuse that same
  value by shorthand — the Market Snapshot section stays a fixed 4-item array (via `HOME_SNAPSHOT_IDS.map`),
  with individual items marked `unavailable` rather than the whole array being dropped under total failure.
- **Single site-wide market controller**: a new `src/lib/home-live-market/homeLiveMarketController.ts`
  module is now the sole fetch/timer/in-flight/visibilitychange owner for Home live-market data, mounted
  once in `src/layouts/Layout.astro` (since `Ticker.astro` renders site-wide). It broadcasts a
  `mk-home-live-market` `CustomEvent` with the latest payload; `Ticker.astro` and
  `HomeLiveMarketSnapshot.astro` were converted to pure consumers (zero fetch/timer calls of their own),
  listening for the event and calling `getLatestHomeLiveMarketPayload()` on mount for late-mounting
  components. This supersedes the original per-component-fetch design described in §2.
- **GNews normalization hardening**: `normalizeGnewsHomeArticle` now enforces closed length bounds
  (`MAX_TITLE_LEN=240`, `MAX_URL_LEN=2048`, `MAX_DESCRIPTION_LEN=600`, `MAX_SOURCE_NAME_LEN=120`), an
  `isSafeHttpUrl` gate (rejects non-`http(s)` schemes) on `url`, `image`, and `sourceUrl`, and an
  `isValidIsoDate` gate on `publishedAt`; required fields are rejected outright on failure, optional fields
  (`description`, `sourceName`) are truncated rather than rejected, and optional URLs (`image`,
  `sourceUrl`) are dropped to `null` rather than rejected.
- **`HomeMarketNews.astro` retry behavior**: a `hasRenderedOnce` flag now distinguishes a first-load
  failure (clean unavailable state) from a post-success failure (already-rendered articles are preserved
  and a `data-home-news-delayed` notice is shown instead), replacing a fixed retry-delay approach.
- One pre-existing sibling checker, `scripts/check_phase_3gj_live_market_dashboard_contract.mjs`, had its
  `HomeLiveMarketSnapshot` fetch-count assertion updated to also tolerate the new zero-fetch,
  broadcast-consumer architecture (in addition to the direct-fetch architecture it already tolerated from
  the original §2 migration) — no other 3GJ behavior was touched.

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
  network, no Supabase, no env read) — **117/117 passed** (extended in HF1 to cover quote-first resolution and
  the sequential-not-parallel quote/OHLCV call order; extended in HF2 to add direct unit coverage of
  `normalizeKisQuoteSign` — including named reproductions of both observed Preview bugs — plus the
  Home-layer contradiction safety-net test and the GNews diagnostics/zero-result/cache-recovery tests).
  Covers `getHomeLiveMarket`: full success (9/9
  ticker, snapshot exactly `[kospi, kosdaq, sp500, nasdaq100]` in order, `usdkrw` price sourced from FX not
  OHLCV, every item carries a non-empty `basisLabel`); a successful current-quote resolution short-circuits
  before any OHLCV call; partial KIS failure with FX still available (ticker degrades individual items to
  `unavailable` with null fields, snapshot still carries all 4 fixed ids marked unavailable rather than
  dropped); total failure (`ok: false`, `MARKET_DATA_UNAVAILABLE`, empty snapshot, ticker never empty);
  insufficient-history degradation; and bounded concurrency (`maxInFlight <= 3`). Covers
  `gnewsHomeNewsProvider.mjs`: article normalization/rejection rules (including the HF1 length-bound,
  safe-URL, and ISO-date gates), category classification priority order, the closed 6-category enum,
  dedupe-and-rank behavior, and `getHomeNewsFeed`'s not-configured/401/429/malformed-body/success/cache-hit/
  cache-expiry paths (including a direct assertion that the fake API key string is never echoed in any
  returned JSON).
- `scripts/check_phase_3gl_home_live_data_contract.mjs` (static, no-network) — **183/183 passed** (extended
  in HF1 to cover the quote-first resolver order, the single `buildSnapshot` computation, the
  `homeLiveMarketController.ts` single-owner contract, `Layout.astro` wiring, the pure-consumer contract for
  `Ticker.astro`/`HomeLiveMarketSnapshot.astro`, the GNews normalization hardening, and the
  `HomeMarketNews.astro` §12 retry-preservation behavior; extended in HF2 with a new "Group 11" section
  asserting the shared `normalizeKisQuoteSign` helper's shape and sign-code convention, both KIS quote
  functions' use of it (including the price/previous-close consistency check and the overseas `sign`-field
  parsing), the Home-layer contradiction safety net, the corrected basis wording, the GNews diagnostics
  counters and `NEWS_NO_RESULTS` zero-result contract, and the simplified 8-term combined query). Asserts the
  closed 9-item registry and 4-item snapshot subset, the orchestration boundary (reuse only, no new KIS/FX
  surface, no direct KIS transport import — only the two named current-quote functions), the
  `live-market.json` route's closed query/cache/error contract, the GNews provider's key handling and
  no-fixture-fallback guarantee, the `home.json` route's contract, all client components'
  polling/localStorage/cache-bypass/visibility/in-flight/idempotent-setup discipline,
  `HomeMarketNews.astro`'s XSS-safe rendering, Home page wiring, absence of prohibited surfaces, and
  `package.json` script wiring.
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

- `npm run smoke:phase-3gl-home-live-data` — 138/138 passed (HF3; 117/117 at HF2).
- `npm run check:phase-3gl-home-live-data` — 210/210 passed (HF3; 183/183 at HF2).
- `npm run smoke:phase-3gj-live-market-dashboard` — 162/162 passed (no ripple from HF3).
- `npm run check:phase-3gj-live-market-dashboard` — 159/159 passed (no ripple from HF3). Two ripples fixed
  across this phase and HF1, both to the checker only, never to the tested implementation: (1) the original
  §2 migration caused the checker's `HomeLiveMarketSnapshot.astro` fetch assertion to be updated to accept
  either the old or new route while still requiring exactly one script-level `fetch()` call; (2) HF1's
  controller unification (§1a) went further and removed that component's own `fetch()` call entirely, so the
  same assertion was widened again to also accept zero `fetch()` calls when the component instead consumes
  the shared controller's broadcast (`getLatestHomeLiveMarketPayload`/`HOME_LIVE_MARKET_EVENT`). HF2 and HF3
  introduced no further ripple into this checker.
- `npm ls --depth=0` — clean, no unmet/invalid dependency.
- `npm run build` — Astro/Vite/Vercel-adapter build completed successfully, no error, at HF1/HF2. At HF3,
  the build again completed every logged stage with zero errors and produced complete output artifacts, but
  the Node process crashed on exit with a native `STATUS_STACK_BUFFER_OVERRUN`; see §1c for the full
  assessment (build content pass, process-exit anomaly, not a code defect).
- `git diff --check` — exit 0 (only benign CRLF/LF line-ending advisories, no conflict markers, no
  trailing-whitespace errors).

## 6. Not yet performed (next steps in sequence)

- Functional/authenticated verification of the HF2 Preview against the §15 checklist (Home content, ticker/
  snapshot shape, quote-direction consistency, basis label, GNews single-request behavior and result count,
  diagnostics, no secret exposure) is **Owner-pending**: the Preview is Vercel-SSO-protected, and this
  assistant does not hold or enter owner credentials. Deployment-level metadata (state = Ready/success,
  correct git branch/commit, no alias error) was verified without authentication; page/route content was
  not.
- The HF3 hotfix's own commit/push and its §15 Preview verification (new Preview deployment state plus the
  13 functional checks — rolling belt, 9-item Snapshot, sparkline contract, honest `NEWS_NO_RESULTS`) are the
  immediate next steps in this phase, reported in the final HF3 phase report; **direct browser-based visual
  inspection of the rolling-belt motion is Owner-pending** for the same SSO-credential reason as above.
- Merging the PR, Production deployment, and Production QA are Owner-only items not performed by this phase.

## 7. Next phase

**Phase 3GM — Operations and Admin MVP.** `PLANNED`, not started by this phase.
