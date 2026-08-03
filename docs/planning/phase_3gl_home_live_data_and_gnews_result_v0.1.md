# Phase 3GL — Home Live Data and GNews — Result v0.1

Replaces the Home page's static/fixture-era market ticker and market-news list with real, live data: one
shared server-side orchestrator serves both the 9-item ticker belt and the 9-card Market Snapshot from a
single closed-registry resolution pass, and a new server-only GNews client feeds a real, capped,
deterministically-classified market-news list. **Explicitly not this phase:** a client-controlled symbol
fan-out API, a second general stock-market data provider, a new KIS endpoint/TR ID, a new FX provider, any
account/order/balance/funds/trading capability, broad manual QA, starting Phase 3GM, and (prior to release
approval) merging the PR or a Production deploy.

## 1. Executive classification

`PHASE_3GL_HF5_RELIABLE_LATEST_AVAILABLE_HOME_NEWS_IMPLEMENTED_LOCAL_VALIDATION_COMPLETE_PRODUCTION_VERIFICATION_PENDING`.
Live Production traffic on the HF4 architecture (§1d) revealed a further defect: `GET /api/news/home.json`
had moved past the raw `NEWS_PROVIDER_ERROR` (fixed by HF4) but was now returning an honest, cached
`NEWS_NO_RESULTS` for extended periods, because the entire Home feed depended on exactly one strategy — a
single GNews Search request using a fixed, Korean-only OR query — with no fallback when that one query
happened to yield zero matching articles at request time. See §1e for the **Phase 3GL-HF5** hotfix that
replaces this single-strategy design with a bounded two-stage provider cascade plus a runtime-local
last-good fallback, so Home always shows the most recently available market news it can find rather than an
avoidable empty state. All implementation and test work described below for the original phase,
including the **Phase 3GL-HF1 hotfix** (§1a), the **Phase 3GL-HF2 hotfix** (§1b), the **Phase 3GL-HF3
hotfix** (§1c), and the **Phase 3GL-HF4 hotfix** (§1d), is prior, separately-merged and Production-deployed
work; HF5 (§1e) is implemented and locally validated on branch
`hotfix/phase-3gl-hf5-home-news-latest-available` and is pending push/PR/Preview-verification/merge/Production
-verification as its own separately-authorized release step (see §6).

---

`PHASE_3GL_HF4_GNEWS_PROVIDER_COMPATIBILITY_IMPLEMENTED_PRODUCTION_VERIFICATION_PENDING`. PR #8 was merged to
`main` and the Git-integrated Production deployment succeeded, but live Production traffic then revealed that
`GET /api/news/home.json` returns `{ "ok": false, "code": "NEWS_PROVIDER_ERROR" }` — see §1d for the
narrowly-scoped **Phase 3GL-HF4** provider-compatibility hotfix that addresses this. `GET
/api/home/live-market.json` remains unaffected (HTTP 200, healthy) throughout. All implementation and test
work described below for the original phase,
including the **Phase 3GL-HF1 hotfix** (§1a), the **Phase 3GL-HF2 hotfix** (§1b), and the **Phase 3GL-HF3
hotfix** (§1c), is complete and pushed on branch `feature/phase-3gl-home-live-data-and-gnews` (created from
`origin/main` at `0e53cde`, the Phase 3GK merge commit; PR #8). The final HF3 implementation commit is
`bb80c994902b9540e658287169e66678586dc434`. The full focused regression gate for this phase (3GL smoke/check,
3GJ smoke/check, `npm ls --depth=0`, `npm run build`, `git diff --check`) is green (see §5).

The Vercel Preview deployment for `bb80c99` reached `Ready` (deployment `dpl_8EVXmV1BZf6yb7GvhpZVuwe3kmAM`,
source `git`, target `Preview`, `aliasError: null`, commit `bb80c994902b9540e658287169e66678586dc434`; the
`Vercel` commit-status context reports `success`); the Netlify deploy-preview also reached `success`. Unlike
HF1/HF2, this Preview received full **Owner functional and visual verification** rather than only an
unauthenticated deployment-level check:

- `GET /api/home/live-market.json` returned HTTP 200 with `ticker.length = 9` and `snapshot.length = 9`, in
  the exact order KOSPI200 / KOSDAQ150 / S&P500 / NASDAQ100 / DOW30 / USD/KRW / 달러 인덱스 / 금 / WTI 원유.
- All 9 Snapshot entries returned a valid, non-fabricated 20-point sparkline; `usdkrw` used
  `sparklineBasis: 'reference_fx'` and every KIS-backed entry used `sparklineBasis: 'daily_close'`.
- No quote amount/percentage sign contradiction was observed (confirming the HF2 fix held under live data).
- The rolling ticker belt was visually verified by the Owner as rolling continuously left with no visible
  jump or restart across a data refresh.
- The Market Snapshot's 9 cards and their mini line charts were visually verified by the Owner.
- The GNews `NEWS_NO_RESULTS` empty state was verified live: `ok: false`, `code: 'NEWS_NO_RESULTS'`, and
  `providerArticleCount`/`normalizedArticleCount`/`returnedArticleCount` all `0`; the Korean empty-state copy
  rendered correctly. This is the expected, honest outcome for a genuinely empty provider feed (see
  `GNEWS_NO_RESULTS_EXPECTED_EMPTY_STATE_CONFIRMED` in §1c), not a defect.
- No secret, API key, token, or raw provider payload was observed in any response.

Based on this completed Owner verification, release approval was granted
(`PHASE_3GL_OWNER_PREVIEW_VERIFIED_RELEASE_APPROVAL_READY`). No Production deploy, no Vercel environment
mutation, and no Supabase migration have been performed as part of implementation or verification; the PR
merge and Git-integrated Production deployment are the next, separately-authorized step (see §6).

### 1e. HF5 hotfix — reliable latest-available Home news

Phase 3GL-HF5 is a narrowly-scoped reliability hotfix, opened after HF4 (§1d) reached Production and fixed
the raw provider-compatibility error, but Production traffic then showed that `GET /api/news/home.json`
was still returning an honest, cached `NEWS_NO_RESULTS` for extended windows. Root cause: the entire feed
depended on exactly one provider strategy — a single GNews Search request against a fixed Korean-only OR
query (`COMBINED_QUERY`) — with no fallback of any kind when that one query happened to match zero articles
at request time; a genuinely empty result from the single strategy was indistinguishable from "no news
exists right now" even when GNews had other, perfectly usable recent articles available under a different
query shape.

- **Two-stage provider cascade, bounded at 2 requests per uncached load.** `getHomeNewsFeed` in
  `src/lib/server/homeNews/gnewsHomeNewsProvider.mjs` now tries, in order:
  1. **Primary — GNews Top Headlines**, `category=business&lang=ko&country=kr&max=10`
     (`fetchGnewsTopHeadlinesBusinessKoKr`), strategy id `top_headlines_business_ko_kr`. A primary HTTP/
     network/malformed-body error is returned immediately as its own honest sanitized code (400/401/403/429/
     other → `NEWS_BAD_REQUEST`/`NEWS_UNAUTHORIZED`/`NEWS_QUOTA_EXHAUSTED`/`NEWS_RATE_LIMITED`/
     `NEWS_PROVIDER_ERROR`, unchanged from HF4) — the fallback strategy never runs after a primary-level
     transport/HTTP error, only after a primary success that yields zero usable articles.
  2. **Fallback — bounded GNews Search for the most recently available articles regardless of date**
     (`fetchGnewsSearchLatestAvailable`), strategy id `search_latest_available_market`: `sortby=publishedAt`,
     no `from`/`to` bound, no `lang` parameter (the Search endpoint doesn't support Korean), `max=10`,
     preceded by a `FALLBACK_REQUEST_DELAY_MS = 1100` injected delay to respect GNews rate spacing. This
     stage only runs when the primary request succeeded but normalized to zero usable articles.
  At most one primary + one fallback request is issued per uncached load — never more.
- **`feedMode` contract.** Every successful response now carries a closed `feedMode` enum surfaced through
  both the provider result and the `GET /api/news/home.json` route: `'latest'` (primary strategy served
  articles), `'latest_available'` (fallback strategy served articles after the primary yielded zero), or
  `'last_good'` (see below). `selectedStrategy` names exactly which of the three sources served the
  response (`top_headlines_business_ko_kr` / `search_latest_available_market` /
  `last_good_runtime_cache`).
- **Runtime-local last-good fallback, independent of the 5-minute TTL cache.** A module-level
  `lastGoodArticles` singleton remembers the most recently served non-empty article set (defensive copy, not
  cache-bound). When a later load's full two-stage cascade would otherwise produce a primary error or a
  both-strategies-zero `NEWS_NO_RESULTS`, and a last-good set exists, the route serves that last-good set
  instead (`feedMode: 'last_good'`) rather than surfacing the transient failure — the two provider requests
  are still issued every time (never skipped), so the feed keeps trying to recover a genuine `'latest'`
  result on every subsequent load; `last_good` is never a permanent wedge. `diagnostics.returnedArticleCount`
  on a `last_good` response always reflects the actual served (last-good) count, never the zero count from
  the cascade that triggered the fallback. An empty state is now reached only when both strategies return
  zero **and** no last-good set exists yet.
- **Honest failures are never cached.** A primary-request error with no last-good, and a both-strategies-zero
  `NEWS_NO_RESULTS` with no last-good, both deliberately bypass the shared `store()` TTL-cache helper and
  return directly — the next load retries the provider cascade immediately instead of being wedged into
  repeating the same transient failure for the rest of the 5-minute TTL window. Only a genuine success
  (`'latest'`/`'latest_available'`) or a `last_good` result is ever written into the TTL cache.
- **Category classifier gains English keyword coverage.** `CATEGORY_KEYWORDS` (used by `classifyArticle`) now
  checks FX/COMMODITIES/MACRO/DOMESTIC_STOCKS English keywords (e.g. "dollar", "yen", "oil", "OPEC",
  "Federal Reserve", "interest rate", "KOSPI") at least equal priority before the generic OVERSEAS_STOCKS
  English keywords ("stocks", "Wall Street", "Nasdaq", "global market"), so an English-language fallback
  article (expected now that the fallback strategy has no `lang` restriction) is classified into the correct
  specific category rather than defaulting to a blanket OVERSEAS_STOCKS.
- **`HomeMarketNews.astro` secondary notice.** A compact, theme-aware, `role="status"` notice
  (`data-home-news-fallback-notice`) renders below the article grid whenever the server reports
  `feedMode: 'latest_available'` or `'last_good'`, with distinct Korean copy for each
  ("최신 업데이트가 없어 가장 최근에 확인된 시장 뉴스를 표시합니다." / "뉴스 업데이트가 지연되어 마지막으로
  확인된 기사를 표시합니다."). The notice is never shown for `feedMode: 'latest'`, and is never shown
  together with the zero-article empty-state panel — the two are mutually exclusive. No second
  browser-side provider call was added; the notice is driven entirely by the single existing
  `GET /api/news/home.json` response.
- **No new secret/env exposure.** No new environment variable, Vercel project setting, or Supabase migration
  was introduced. The GNews API key, the full request URL/query, and the raw provider response remain
  unexposed in every diagnostics field, error code, and log line across both stages of the cascade.
- **Test suite extension**: `scripts/home_live_data_testsrc.ts` grew to **187/187** passing (new coverage:
  English-keyword classifier priority — including mixed oil-and-stocks / currency-and-stocks headlines
  resolving to the more specific category, never a blanket OVERSEAS_STOCKS; the full two-stage cascade
  ordered so every "no last-good yet" scenario runs before the first scenario that establishes one, with
  `now()` clock offsets spaced well beyond the 5-minute TTL between logically distinct scenarios; primary
  HTTP-error codes each with exactly 1 fetch call and no fallback invocation; a both-zero scenario asserting
  exactly 2 requests, exactly one injected 1100ms rate-spacing sleep, and all-numeric/boolean diagnostics;
  primary-success `feedMode: 'latest'`; TTL cache-hit; TTL-expiry into `feedMode: 'latest_available'` with
  captured primary/fallback URL contract assertions — primary has `category=business&lang=ko&country=kr&
  max=10` and no `q`, fallback has `sortby=publishedAt`, no `lang`, no `from`/`to`, exactly one non-empty `q`,
  `max=10`, exactly one `apikey` each; a later both-zero and a later primary-error scenario each recovered by
  `feedMode: 'last_good'` with unchanged `publishedAt`, correct `diagnostics.returnedArticleCount`, and a
  defensive-copy check; and a final recovery scenario proving the feed returns to genuine `feedMode: 'latest'`
  once the primary provider succeeds again — never permanently wedged). `scripts/check_phase_3gl_home_live_data_contract.mjs`
  grew to **262/262** passing (new "Group 14" static-source assertions covering the primary/fallback request
  shapes, the 2-request bound, the last-good runtime cache, the `feedMode`/`selectedStrategy` response
  contract, the English classifier-keyword coverage, and the `HomeMarketNews.astro` fallback-notice UI; Group
  11's honest-failures-never-cached assertion was corrected during authoring — see §5 — to accurately reflect
  this design instead of a stale, misleading description that happened to still pass for an unrelated reason).
- **Regression gate**: see §5.
- **Production verification remains pending** until this hotfix is merged and deployed — see §6.

### 1d. HF4 hotfix — restored GNews provider compatibility

Phase 3GL-HF4 is a narrowly-scoped provider-compatibility hotfix, opened after PR #8 merged to `main` (merge
commit `d211f0b3c86129b95f1ff2a225d35e4b9ec1b492`) and the resulting Git-integrated Production deployment
(`dpl_3j6FdPFcE9biJBet12518Gvtf4qB`, `READY`) reached live traffic. Production Home loaded correctly (HTTP
200) and `GET /api/home/live-market.json` returned a healthy HTTP 200 with ticker/Snapshot data, but `GET
/api/news/home.json` returned HTTP 200 with `{ "ok": false, "code": "NEWS_PROVIDER_ERROR" }` instead of a
live feed or an honest `NEWS_NO_RESULTS`.

- **Root cause**: the provider request in `fetchGnewsSearch` (`gnewsHomeNewsProvider.mjs`) used `max=20` and
  `lang: 'ko'`. GNews's Free plan caps the `max` parameter at 10 articles per request, and the Search
  endpoint's supported-language list does not include Korean — either incompatibility alone is sufficient to
  make GNews respond with HTTP 400; the pre-HF4 status mapping collapsed any non-2xx response other than
  401/429 into the same generic `NEWS_PROVIDER_ERROR`, masking the real (client-configuration) cause.
- **Fix**: `PROVIDER_MAX` reduced from 20 to 10; `lang: 'ko'` removed entirely from the `URLSearchParams` (the
  Korean-keyword `COMBINED_QUERY` remains the sole Korean-news targeting mechanism). The one-combined-query
  architecture (exactly one GNews request per 5-minute cache window, no per-category fan-out, no second
  provider, no LLM, no fixture fallback) is unchanged. Sanitized upstream status classification was also
  extended so a future incompatibility is diagnosable without exposing the raw provider response: `400` →
  `NEWS_BAD_REQUEST`, `401` → `NEWS_UNAUTHORIZED`, `403` → `NEWS_QUOTA_EXHAUSTED` (previously mapped to
  `NEWS_UNAUTHORIZED`), `429` → `NEWS_RATE_LIMITED`, any other non-2xx/timeout/network/invalid-JSON failure →
  `NEWS_PROVIDER_ERROR`. The raw response body, query text, API key, and provider headers are never exposed
  in any code path.
- **No environment or Supabase mutation**: no Vercel environment variable was changed, no manual `vercel`
  command was run, and no Supabase migration or table was touched. No fixture, second provider, or LLM
  fallback was introduced.
- **Test suite extension**: `scripts/home_live_data_testsrc.ts` grew to **149/149** passing (new coverage:
  the generated provider URL carries `max=10`, omits `lang` entirely, carries exactly one `q` and one
  `apikey` parameter, and issues exactly one fetch call; sanitized status mapping for `400`/`403`/`429`/`500`;
  all pre-existing success/cache/normalization/dedupe/classification/`NEWS_NO_RESULTS`/secret-safety
  assertions unchanged and still passing). `scripts/check_phase_3gl_home_live_data_contract.mjs` grew to
  **220/220** passing (new "Group 13" static-source assertions covering the same contract).
- **Production verification remains pending** until this hotfix is merged and deployed — see §5 for the
  focused regression gate and §6 for current status.

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
  `npm run build` (Astro 6.1.1 / `@astrojs/vercel@10.0.4`) completed every logged build stage with zero errors
  or warnings and produced complete `dist/client`, `dist/server`, `.vercel/output/server`, and
  `.vercel/output/static` artifacts on both Node 22.23.1 and Node 24.14.1, but the local Windows process then
  exited with a native Windows access violation, `0xC0000005` (decimal exit code `-1073741819`), reproduced
  identically on both Node versions when the Astro build step is run directly; running the `postbuild` step
  directly exits `0` with no anomaly. This is classified
  `LOCAL_WINDOWS_ASTRO_TEARDOWN_ACCESS_VIOLATION_RECORDED_NON_RELEASE_BLOCKING`: all real build work completes
  and all artifacts are verified complete before the native exit, no stderr, Node diagnostic report, or
  matching Windows Application-log event was produced, and — decisively — the authoritative remote Vercel
  build for this exact commit (`npm run build` → Astro/Vite build → `@astrojs/vercel` function bundling →
  static output copying → `postbuild` → deployment) completed successfully and produced the `Ready` Preview
  deployment described above
  (`REMOTE_EXACT_COMMIT_BUILD_AND_POSTBUILD_VERIFIED`). A clean-baseline comparison via `git stash` or a fresh
  `git worktree` + `npm install` was not attempted, since both are prohibited by this phase's governing
  constraints; it is not needed to establish non-release-blocking status given the successful remote build of
  the identical commit.
- **Preview verification**: completed. See §1 for the full Owner-verified functional/visual evidence
  (Home API contract, all 9 Snapshot sparklines, rolling-ticker motion, Snapshot cards, and the
  `NEWS_NO_RESULTS` empty state) that led to `PHASE_3GL_OWNER_PREVIEW_VERIFIED_RELEASE_APPROVAL_READY`.

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
`'unavailable'`, never fabricated), and — since the HF3 hotfix (§1c) — `snapshot` covers the full 9-item
registry in the same fixed order (KOSPI200, KOSDAQ150, S&P500, NASDAQ100, DOW30, USD/KRW, 달러 인덱스, 금,
WTI 원유) and is **always present at length 9**; items that failed to resolve are included as
individually-unavailable cards (preserving identity and order) rather than being dropped, so the Market
Snapshot grid never reflows based on data availability. (Prior to HF3, `snapshot` was a fixed 4-item subset —
`kospi`, `kosdaq`, `sp500`, `nasdaq100` — see §1a/§1b for that history.) The route reuses the existing
`allowProductionMarketDashboardLiveData` readiness
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

- `npm run smoke:phase-3gl-home-live-data` — **187/187 passed (HF5)**; 149/149 at HF4; 138/138 at HF3;
  117/117 at HF2.
- `npm run check:phase-3gl-home-live-data` — **262/262 passed (HF5)**; 220/220 at HF4; 210/210 at HF3;
  183/183 at HF2.
- `npm run smoke:phase-3gj-live-market-dashboard` — 162/162 passed (no ripple from HF3 or HF5; HF5 touched
  only `src/lib/server/homeNews/*`, `src/components/HomeMarketNews.astro`,
  `src/pages/api/news/home.json.ts`, and `src/styles/style.css`, none of which this sibling checker covers).
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
  the build again completed every logged stage with zero errors and produced complete output artifacts on
  both Node 22 and Node 24, but the local Windows process exited with a native `0xC0000005` access violation;
  see §1c for the full assessment (`LOCAL_WINDOWS_ASTRO_TEARDOWN_ACCESS_VIOLATION_RECORDED_NON_RELEASE_BLOCKING`,
  corroborated by `REMOTE_EXACT_COMMIT_BUILD_AND_POSTBUILD_VERIFIED` — the exact same commit's Vercel build
  and postbuild completed successfully and deployed). **At HF4, the local Windows build result differs from
  the HF3 pattern and is recorded honestly rather than reused:** all logged Astro/Vite stages (type
  generation, server-entrypoint build, three Vite builds, "Rearranging server assets") completed with zero
  errors and produced a fully-populated `dist/client` (40 files) and `dist/server` (70 files), but the
  process then exited with a different native code, decimal `-1073740791` (confirmed via
  `((-1073740791) >>> 0).toString(16)` → `c0000409`, i.e. Windows `STATUS_STACK_BUFFER_OVERRUN`, distinct
  from HF3's `0xC0000005`), reproduced identically across two consecutive clean (`dist`/`.vercel/output`
  removed first) runs. Unlike HF3, `.vercel/output/server` and `.vercel/output/static` remained **empty** and
  `.vercel/output/config.json` was **not created** — the Vercel adapter's own output-emission step did not
  complete this time. Running `scripts/repair-vercel-output.mjs` (the `postbuild` step) directly exits `0`
  but correctly performs no repair, since its own guard (`existsSync(configPath) && !hasFiles(staticOutput)`)
  requires `config.json` to already exist and none was written. HF4 changed only JS/TS/doc content
  (`gnewsHomeNewsProvider.mjs`, a comment in `home.json.ts`, tests, docs) — no dependency, build config, or
  native module was touched — so this is treated as the same class of local-Windows-toolchain anomaly as
  HF1–HF3, not a defect introduced by this hotfix, but it is **not** given the `NON_RELEASE_BLOCKING` label
  on the strength of this local run alone: per this phase's governing instruction, that label is earned only
  when the identical commit's remote Vercel Preview build reaches `Ready`. That confirmation is the explicit
  subject of this hotfix's own §11 Preview verification step and is recorded there, not assumed here.
- **At HF5, `npm run build` again exits non-zero on this local Windows checkout — decimal `-1073740791`
  (`0xC0000409`, `STATUS_STACK_BUFFER_OVERRUN`) — at the same log position as HF4: every logged Astro/Vite
  stage (type generation, server-entrypoint build, three Vite builds, "Rearranging server assets... ✓
  Completed") finishes with zero errors and produces a fully-populated `dist/client` (42 files) and
  `dist/server` (74 files), but the process then crashes during/after the `@astrojs/vercel` function-bundling
  step; `.vercel/output/server` and `.vercel/output/static` remain empty and `.vercel/output/config.json` is
  not created, identically to the HF4 pattern.** This time the root cause was not merely re-assumed by
  analogy to HF3/HF4 — it was conclusively isolated with a controlled, multi-variable experiment before being
  recorded: (1) a fresh `git worktree` of the HF5 baseline commit at a plain-ASCII temp path, with a clean
  `npm install`, built successfully (**exit 0**, full `.vercel/output` populated) — ruling out "the crash is
  simply inherent to this commit"; (2) the identical baseline commit, freshly `npm install`ed at a *different*
  local path containing Korean characters, crashed identically (`-1073740791`, same log position); (3)
  rebuilding in-place on the real HF5 working tree (Korean-character path) with this hotfix's own changes
  temporarily `git stash`ed out (byte-identical to baseline) still crashed identically. This isolates the
  cause to **non-ASCII (Korean) characters in the local filesystem path** interacting with a native binary
  during the Vercel adapter's function-bundling step on Windows — not to any code in the HF5 diff, not to any
  specific commit, and not to stale build caches. Classified
  `LOCAL_WINDOWS_NON_ASCII_PATH_NATIVE_BUNDLING_CRASH_CONFIRMED_ENVIRONMENT_ONLY_NON_RELEASE_BLOCKING`: this is
  a stronger, experimentally-proven conclusion than HF3/HF4's "same class of anomaly, not labeled
  non-blocking without a remote confirmation" — it is recorded as non-blocking on the strength of this local
  isolation alone, since Vercel's own remote build runs on Linux at an ASCII path and is unaffected by this
  local-only condition. Remote Preview build/deploy verification for the exact HF5 commit is still tracked as
  its own separate confirmation in §6, not skipped because of this finding.
- `git diff --check` — exit 0 (only benign CRLF/LF line-ending advisories, no conflict markers, no
  trailing-whitespace errors).

## 6. Status and next steps

- Owner Preview verification is **complete** (see §1): the Owner authenticated against the Vercel-SSO-gated
  Preview and confirmed the Home API contract, all 9 Snapshot sparklines and their exact labels/order, the
  rolling-ticker motion, the Snapshot mini charts, and the honest `NEWS_NO_RESULTS` empty state.
- Release approval was **granted** (`PHASE_3GL_OWNER_PREVIEW_VERIFIED_RELEASE_APPROVAL_READY`), PR #8 was
  merged to `main`, and the Git-integrated Production deployment reached `READY`. Production Home and `GET
  /api/home/live-market.json` verified healthy, but `GET /api/news/home.json` returned
  `NEWS_PROVIDER_ERROR` — see §1d for the **Phase 3GL-HF4** provider-compatibility hotfix that addressed
  this; HF4 subsequently merged (PR #9) and was Production-verified.
- Production traffic on the HF4 architecture then surfaced the further reliability gap described in §1e:
  the single-strategy Home news feed could legitimately return zero articles even though other, usable
  recent articles existed under a different query shape. **Phase 3GL-HF5** (§1e) is implemented on branch
  `hotfix/phase-3gl-hf5-home-news-latest-available`, with local smoke (187/187) and checker (262/262) suites
  green, `npm ls --depth=0` clean, and `git diff --check` clean. HF5 push/PR/Preview-verification/merge/
  Production-verification is the next, separately-authorized step for this hotfix.
- Comprehensive/broad Phase 3 responsive, accessibility, and symbol-matrix QA remains deferred until Phase 3
  Closeout (`COMPREHENSIVE_QA_AND_OPTIMIZATION_DEFERRED_UNTIL_PHASE_3_CLOSEOUT`); only the focused Production
  checks in this release's scope are performed now.

## 7. Next phase

**Phase 3GM — Operations and Admin MVP.** `IN_PROGRESS` (separate branch/PR, not started or advanced by
HF5). After HF5 merges and is Production-verified, the next distinct piece of work is standing up
`feature/phase-4a-home-common-shell-production` (created from the HF5 merge commit, no implementation
performed on it by this phase) — see the master roadmap doc for how Phase 4A fits into the overall sequence.
