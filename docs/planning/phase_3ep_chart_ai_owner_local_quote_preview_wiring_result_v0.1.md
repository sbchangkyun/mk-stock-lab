# Phase 3EP — Chart AI Owner-Local Quote Preview Wiring Result

## 1. Status

Implemented — owner-local Chart AI quote preview wired behind gate.

Starting HEAD: `c85e1f8` (`docs: record owner local kis quote smoke pass`).

## 2. Background

- Phase 3EO owner-run smoke closed as `PASS_WITH_INTERMITTENT_PROVIDER_NOTE`.
- KR `005930` KIS quote connectivity is proven through the verified `KR_STOCK_QUOTE` endpoint.
- The immediate retry showed `PROVIDER_UNAVAILABLE`, so the preview must include a safe unavailable
  fallback.
- This phase wires the preview only behind the owner-local gate; it never exposes live KIS quotes in
  public production.

## 3. Implemented Scope

- Owner-local preview adapter: `src/lib/server/providers/kis/kisOwnerLocalQuotePreview.ts`.
- Owner-local preview API route: `src/pages/api/chart-ai/owner-local-quote-preview.ts`.
- Chart AI preview UI section (right sidebar, below `기업 개요`).
- Selected-symbol preview request handling.
- Blocked / unavailable / provider-unavailable fallback states.
- No public production live quote; no default/public live fetch; no deployment; no push.

## 4. Owner-Local Gate

The preview returns actual quote values only when ALL of the following hold:

- Query flags: `source=owner-local` and `preview=quote`.
- Local-host request: `localhost`, `127.0.0.1`, or `::1`.
- Server env flags: `KIS_OWNER_LOCAL_SMOKE=1`, `KIS_ALLOW_LIVE_QUOTE=1`, `KIS_ENABLE_LIVE_QUOTES=true`
  (read at runtime only; values are never logged, returned, or committed).
- Provider gate: `mode='owner-local'`, `allowNetwork=true`, `allowKisLive=true`.

If any condition is missing, the route returns a safe `blocked` JSON response (never a raw server
error). Because public production never supplies the owner-local query flags, is not local-host, and
does not set the owner-local env flags, public production cannot trigger a live KIS call. The route
also sets `Cache-Control: no-store` on every response.

## 5. UI Behavior

- Default public state: the preview card shows `KIS 로컬 프리뷰` with guidance that the real preview
  is available only in the owner-local environment; the button is disabled and nothing is fetched.
- Owner-local source flag (`/chart-ai?source=owner-local`): the button is enabled; clicking it fetches
  the gated preview route for the currently selected symbol.
- Success state: shows price, previous close, change, change rate, volume, `기준시각` (asOf), and a
  `지연 시세 · 오너 로컬 전용` label.
- Unavailable state: shows `일시적으로 시세를 불러올 수 없습니다.` plus the coarse provider status and
  retry guidance; no raw error is shown.
- Blocked state: shows `오너 로컬 프리뷰 조건이 충족되지 않았습니다.`.
- Selected-symbol behavior: the preview uses the currently selected symbol; selecting a new symbol
  resets the preview. Only KR stock/ETF symbols are eligible; other types show an unsupported message.

## 6. Intermittent Provider Handling

- `PROVIDER_UNAVAILABLE` (and rate-limit / network / malformed transport results) map to the safe
  `unavailable` UI state, matching the intermittent behavior observed in Phase 3EO.
- `CONFIG_MISSING` maps to the `blocked` state.
- No raw error details, no raw provider response, and no secrets are ever surfaced or logged.

## 7. Safety

- No raw provider payload is returned (only sanitized numeric fields and coarse status metadata).
- No secrets, app key, app secret, access token, or authorization header are returned or logged.
- No account/trading APIs are called.
- No actual price values are recorded in this document.
- No public API live access: the preview route is blocked by default and gated to owner-local.
- No deployment and no push.

## 8. Validation

- `npm run check:phase-3ep-chart-ai-owner-local-quote-preview-wiring`: PASS.
- `npm run check:phase-3eo-owner-local-kis-quote-smoke-closeout`: PASS.
- `npm run check:phase-3eo-owner-local-kis-quote-smoke`: PASS.
- `npm run check:phase-3en-kis-quote-adapter-owner-local-gate`: PASS.
- `npm run check:phase-3em-kis-quote-integration-foundation`: PASS.
- `npm run check:phase-3el-owner-review-hf2-lx-closeout`: PASS.
- `npm run check:phase-3el-hf2-lx-chart-header-sidebar-layout-hotfix`: PASS.
- `npm run check:phase-3el-hf2-mocked-candlestick-chart-volume-foundation`: PASS.
- `npm run check:phase-3el-hf1-sx2-chart-ai-compact-search-panel-hotfix`: PASS.
- `npm run check:phase-3el-chart-ai-domestic-symbol-search-wiring`: PASS.
- `npm run check:phase-3ek-domestic-symbol-master-search-index-mocked-first`: PASS.
- `npm run check:phase-3ej-kis-symbol-master-quote-infrastructure-plan`: PASS.
- `npm run check:provider-boundaries`: PASS.
- `npm run check:kis-runtime-guard`: PASS.
- `npm run check:kis-error-fallback`: PASS.
- `npm run check:chart-ai-ux-skeleton`: PASS.
- `npm run check:mobile-baseline`: PASS.
- `npm run check:production-domain`: PASS.
- `npm run build`: PASS.
- `git diff --check`: PASS.
- `npm run guard:production-mobile-geometry`: `DRY_RUN`; no browser and no network.

### Prior-checker maintenance (no safety weakened)

Five Chart AI page checkers previously asserted "no `fetch()` on the page" as a proxy for "no live
data wiring on the mocked page" (`check_chart_ai_ux_skeleton`, HF1-SX2, domestic-symbol-wiring,
HF2-LX, HF2). Because this phase intentionally adds a gated owner-local preview fetch, those five
assertions were evolved to "no ungated fetch — only the gated owner-local preview is permitted"
(they now allow a page fetch only when it targets `owner-local-quote-preview` and carries the
`owner-local` guard). The KIS safety gate lives in the route/adapter/gate and was not weakened.

## 9. Known Legacy Checker Note

`check:kis-quote-adapter-mocked` remains `100/101` due to the pre-existing unrelated `source=live`
string in `src/pages/api/portfolio/valuation.ts`. That file was not changed in this phase and the
checker was not weakened. Recommended separate cleanup: Phase 3EN-HF1 — Legacy KIS Checker Cleanup.

## 10. Recommended Next Phase

Recommended: Phase 3EP-OWNER-REVIEW — Owner Local Review of Chart AI Quote Preview.

Alternative: Phase 3EN-HF1 — Legacy KIS Checker Cleanup.

Rationale: The gated owner-local preview is wired with resilient fallback; the owner should review it
locally (including the intermittent-provider path) before any broader exposure is considered.
