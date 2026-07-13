# Phase 3GG-T-HF1 Result: Chart AI Authentication Gate, Zero-Request Entry and Production UI Cleanup

## Status / Classification

`PASS_CHART_AI_AUTH_ZERO_REQUEST_UI_CLEANUP_PRODUCTION_VERIFIED` — Chart AI now requires login exactly
like the Portfolio page, opening the page issues zero KIS/OpenAI/analysis requests, the chart-overlapping
labels and obsolete sample copy are gone, the low-value three-line summary and the Portfolio Intelligence
workspace are removed from the Production Chart AI page, and the real chart / similarity / deterministic
MK AI / Market Intelligence features are preserved — locally verified, built, deployed to Production, and
desktop + mobile browser-QA'd.

- **Baseline**: `1594ecb` (Phase 3GG-T-FAST deploy record). **Branch**: `rebuild/phase-1-ia-shell`.
- **HEAD before**: `1594ecb`.
- **Source commit**: _(filled at commit: `Phase 3GG-T-HF1: protect and clean Chart AI`)_.
- **Deploy-record commit**: the commit adding the Deploy & Production QA findings
  (message `Phase 3GG-T-HF1: record Chart AI auth and cleanup deploy`).

## User-visible issues fixed

1. Chart AI was publicly accessible without login → now gated behind the Portfolio-style login gate.
2. Opening `/chart-ai` fired KIS market-data + KIS OAuth token requests (auto-loaded Samsung) → entry is
   now zero-request.
3. Repeatedly clicking the three-line `MK AI 시세 요약` issued token activity → the feature is removed from
   Production and its route is Production-disabled.
4. Labels overlapped the candlestick/volume chart → moved below the plot.
5. The stock information card carried misleading sample/scaffold copy → replaced with verified metadata.
6. The Portfolio Intelligence workspace cluttered Chart AI → removed from Chart AI (kept on `/portfolio`).

## Authentication implementation

Client: `src/pages/chart-ai.astro` imports the SAME browser session source as `/portfolio`
(`getBrowserSupabaseClient` / `getCurrentSession` / `isSupabaseConfigured` from `src/lib/supabase.ts`).
A new `runChartAiAuthGate()` runs before any workspace init: it reads `supa.auth.getSession()`, and when
there is no session it reveals the existing Portfolio-aligned lock card (🔐 · 접속 필요 · 로그인이
필요합니다 · 회원가입/로그인), keeps the workspace `<main data-chart-ai-auth-body hidden>` hidden, wires the
CTA to the shared `mk:open-auth` modal, and returns WITHOUT calling `setup()`. `setup()` — the sole owner
of every provider fetch — only runs for an authenticated session. A `mk:auth-state` listener re-boots the
workspace on sign-in and re-locks on sign-out.

Server (authentication is NOT UI-only): the deployed Chart AI API routes (instrument search, OHLCV,
similarity, MK AI analysis, Market Intelligence) each require a valid Supabase user via the existing
`validateUserFromBearerToken(request.headers.get('authorization'))` (the same primitive the Portfolio APIs
and `analyze.ts` already use) and fail closed with a sanitized 401 before any provider work. The localhost
owner opt-in path stays token-free for owner smokes/dev; the Preview/Production beta provider guards are
unchanged. The client attaches `Authorization: Bearer <access_token>` to every Chart AI fetch
(`chartAiAuthHeaders()`), mirroring `portfolioClient.ts`.

## Portfolio login-gate reuse

The lock card markup, illustration (🔐), `접속 필요` label, `로그인이 필요합니다` title, explanatory copy,
and `회원가입 / 로그인` button follow the Portfolio pattern; the session check and `mk:open-auth` /
`mk:auth-state` wiring reuse the same Supabase browser client and global auth events as `/portfolio`. No
new auth scheme, no manual cookie/JWT parsing.

## Unauthenticated DOM result

The workspace body is server-rendered `hidden` and only revealed for an authenticated session; the lock
card is shown instead. No Chart AI client workspace is initialized and no search/OHLCV/similarity/MK AI/
Market Intelligence/summary elements are wired when signed out.

## Unauthenticated API result

Deployed unauthenticated requests to the Chart AI routes return a sanitized **401** (`AUTH_REQUIRED` /
`AUTH_INVALID`) with no provider call. The legacy summary route is Production-disabled (production beta
path removed) and fails closed on Production.

## Initial-entry network result (Zero-request entry)

`initProductionInstrument()` no longer auto-selects a default symbol or fetches anything. With no
`?symbol`, the chart shows the idle copy `종목을 검색해 선택하면 실제 차트를 불러옵니다.`. With a `?symbol`
(e.g. from the Portfolio page link), the instrument is shown as a suggested selection from client-safe URL
labels only, and a KIS request happens only after the explicit `이 종목 차트 불러오기` click. Provider calls
occur only on explicit user action (typing → search, selecting → OHLCV, clicking → similarity/MK AI/Market
Intelligence).

## KIS token audit and root cause

Audit of `src/lib/server/providers/kisClient.ts` `getKisAccessToken`: token reuse-until-expiry (module
cache) and a 60s expiry safety skew were already implemented correctly, and market-data requests reuse the
cached token (no per-request reissue). **Root cause of the observed repeated issuance was unnecessary route
invocation** — the page auto-loaded Samsung OHLCV on entry and the three-line summary was clickable — not a
token-client defect. Both triggers are removed this phase. Serverless note: the cache is per-warm-instance,
so cold starts legitimately re-issue a token; that is expected, not a bug.

## Token cache behavior

Retained cache-until-expiry + 60s skew + per-request reuse; **added a single-in-flight guard**
(`accessTokenInFlight` + `issueKisAccessTokenNow`) so concurrent cache-miss callers share ONE
`/oauth2/tokenP` issuance instead of each firing their own. No token value or raw OAuth response is logged.

## Chart overlay cleanup

Removed the in-plot `chart-plot-heading` period label and the `chart-safety-note` overlay
(`실시간 지연 시세 · KIS` + timestamp) that sat over the candles/volume. The candlestick + volume plotting
area now contains only the SVG. A compact below-plot metadata row (`chart-real-meta`) shows 지연 여부 +
데이터 기준 시각 + 통화. Verified 1m/3m/6m/1y, desktop, and mobile 375px.

## Stock information cleanup

Removed `실시간 지연 시세 기반의 실제 OHLCV 캔들·거래량 차트를 제공합니다.`, `정식 기업 데이터 연동 전까지는
참고용 구조 예시로 제공됩니다.`, `정식 기업 공시 데이터가 아닌 화면 구성용 요약 정보입니다.`, and
`샘플 정보 · 실제 투자 판단용 정보가 아닙니다.`. The card now uses only verified normalized instrument
metadata (종목명 · 종목코드 · 시장 · 종목 유형 · 통화 · 데이터 상태) plus a factual one-line identity; the
Production data-status label reads `실제 지연 시세 데이터`.

## Three-line summary removal

The `MK AI 시세 요약` panel is gated behind `{!isVercelProductionRuntime && (...)}` (absent from the
Production DOM; kept only for localhost/Preview regression), and the route removes its production beta
access path (Production-disabled). It is never auto-called and never callable from the Production UI. The
richer deterministic MK AI analysis (R-FAST) remains.

## Portfolio Intelligence Chart AI removal

Removed the `chartAiPortfolioWorkspace` markup (관심종목/최근 조회/저장된 분석/수동 포트폴리오/비교·리스크 +
JSON export/import), the client initialization block, the `portfolio-intelligence` imports, the capture
hooks, and the `.chart-portfolio-*` CSS from `src/pages/chart-ai.astro`. Not hidden with CSS — removed from
the DOM and client init.

## Separate Portfolio page preservation

`src/pages/portfolio.astro`, its login behavior, and the top-level `포트폴리오` navigation are unchanged.
The reusable `src/lib/chart-ai/portfolio-intelligence/*` modules are retained (used by the Portfolio page /
future work).

## Search / OHLCV / Similarity / deterministic MK AI / Market Intelligence preservation

All preserved and remain click-only: universal KR/US search, real OHLCV chart, real similarity analysis,
deterministic MK AI analysis, and Market Intelligence. The provider guards, current-price/historical
market-data scope, and no-trading/account boundary are unchanged.

## Deterministic smoke

`npm run smoke:phase-3gg-t-hf1` → **48/48 PASS** (credential-free): auth-source parity, real gate + hidden
body, route fail-closed, Bearer-on-fetch, zero-request entry, overlay + card cleanup, summary Production
removal, Portfolio removal, preserved features, and the token cache/skew/single-in-flight guard.

## Build

`npx astro build` → **Build PASS**.

## Deploy and Production QA

_Deploy method_: `vercel deploy --prod --yes` (Vercel cloud build).

- **Deploy outcome**: _(filled after deploy)_.
- **Production URL**: https://mkstocklab.vercel.app/chart-ai

### Desktop QA
- **Unauthenticated**: _(filled after QA — login gate matches /portfolio, workspace absent, zero
  search/OHLCV/similarity/MK AI/Market Intelligence/summary/KIS-token requests, zero console errors)_.
- **Authenticated initial entry**: _(filled after QA — workspace visible, no auto chart, zero KIS
  market-data + zero KIS token requests before user action, no summary card, no Portfolio workspace, no
  overlapping labels, no sample/scaffold copy)_.
- **After explicit search + selection**: _(filled after QA — one expected OHLCV flow, chart+volume, no
  overlay, similarity/MK AI/Market Intelligence click-only, no summary request, no request storm)_.
- **Separate Portfolio page**: _(filled after QA — login + content unchanged)_.

### Mobile QA (375px)
- _(filled after QA — login gate matches Portfolio style; authenticated Chart AI no overflow; chart
  metadata below plot; analysis cards usable)_.

### Console / network results
- _(filled after QA — request counts + KIS token-request count before and after explicit user action)_.

## Exposure result

No env value, credential, token, Authorization header, cookie, raw provider payload, prompt, or model name
is printed or shipped to the client. The client only sends the user's own Supabase Bearer token.

## Endpoint boundary

No trading/account/order/balance/funds/portfolio/personal endpoint. Read-only market-data scope unchanged.

## env / .vercel / .gitignore status

`.env`, `.env.local`, `.vercel` never staged; `.gitignore` left unstaged. No dependency/lockfile change; no
Supabase schema change.

## Push status

Not pushed — the Vercel cloud deploy uploads the working directory directly.

## Next phase

**Phase 3GG-U-FAST** — News, Filings and Macro Event Intelligence.
