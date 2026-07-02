# Phase 3ET — Chart AI Owner-Local OHLC Preview Wiring Result

## 1. Status

Implemented — owner-local Chart AI OHLC preview wiring is in place. Public production Chart AI
still renders the mocked/sample candlestick chart by default; no live KIS OHLC call is possible
outside the full owner-local gate.

## 2. Background

Phase 3ES-OWNER-SMOKE-CLOSEOUT closed with an owner-local KIS OHLC smoke `PASS_WITH_OWNER_LOCAL_RUN`:
KR `005930`, stock, period `1m`, endpoint `KR_STOCK_DAILY_OHLC` (verified against official KIS
documentation), HTTP `2xx`, point count `27`, renderable `true`, open/high/low/close/volume
field-presence booleans all `true`, source `kis-local`, freshness `delayed`, isLive `true`,
providerStatus `ok`. That smoke confirmed the verified endpoint and transport chain work end to
end, but it deliberately returned no actual OHLC values (a smoke-test contract only) and no Chart
AI wiring existed yet. This phase adds the first Chart AI-facing owner-local OHLC preview path.

## 3. Implemented Scope

- `src/lib/server/providers/kis/kisOwnerLocalOhlcPreview.ts` — new server-side adapter,
  `runOwnerLocalOhlcPreview(request, context, deps)`. Unlike the Phase 3ES smoke client, this
  adapter returns actual sanitized numeric OHLC points to the caller, but only after the full
  owner-local gate passes and the endpoint resolves as verified. It reuses the existing
  `evaluateKisOwnerLocalGate`, `buildKisOhlcRequestDescriptor`, `mapSanitizedKisOhlcToSeries`, and
  the shared `getKisDomesticDailyOhlcSeries` kisClient transport (the sole file permitted to call
  `fetch` for KIS). Transport is injectable for static/behavioral testing.
- `src/pages/api/chart-ai/owner-local-ohlc-preview.ts` — new GET-only API route. Blocked by
  default; requires `source=owner-local` and `preview=ohlc`, a localhost request, and the three
  explicit env flags (`KIS_OWNER_LOCAL_SMOKE=1`, `KIS_ALLOW_LIVE_QUOTE=1`,
  `KIS_ENABLE_LIVE_QUOTES=true`) before calling the adapter. KR only this phase; US is blocked at
  the route level. `Cache-Control: no-store` on every response; no raw errors, no raw KIS
  response, no secrets.
- `src/lib/chart-ai/ohlcPreviewChart.ts` — new small adapter converting the nullable
  `NormalizedOhlcPoint`-shaped preview points into the existing non-nullable `MockedOhlcPoint`
  shape required by `buildMockedChartGeometry`, so the existing chart geometry/rendering code is
  reused unchanged rather than rewritten.
- `src/pages/chart-ai.astro` — added an owner-local-gated "KIS OHLC 프리뷰 확인" control next to the
  chart period controls. The control is disabled unless the page URL carries
  `source=owner-local`. On click it fetches the new preview route for the selected symbol and the
  currently active period and, on a renderable success response, re-renders the existing SVG chart
  from the returned points via the new adapter and shows the tag "지연 시세 · 오너 로컬 OHLC · KRW".
  On any blocked/unavailable/malformed/insufficient response, it falls back to the sample chart
  and shows a safe Korean message. It never auto-fetches on page load or on selection; only an
  explicit button click triggers a request. Selecting a different symbol or a different period
  resets the OHLC preview state back to sample until the button is clicked again. The existing KIS
  quote preview card, its route, and its behavior are unchanged.

## 4. Owner-Local Gate

Identical gate to the quote and OHLC smoke preview paths, unchanged:

- Client/query: `/chart-ai?source=owner-local` plus `preview=ohlc` on the API request, with
  explicit `symbol`/`market`/`assetType`/`period`.
- Host: localhost, 127.0.0.1, or `::1` only.
- Server env flags: `KIS_OWNER_LOCAL_SMOKE=1`, `KIS_ALLOW_LIVE_QUOTE=1`,
  `KIS_ENABLE_LIVE_QUOTES=true`.
- Provider gate: `mode='owner-local'`, `allowNetwork=true`, `allowKisLive=true`.
- Endpoint: only `KR_STOCK_DAILY_OHLC` (verified) is used; unverified endpoints (intraday, US)
  remain blocked at both the descriptor and route level.
- Any missing condition returns a safe `blocked`/`unavailable` response; the UI falls back to the
  sample chart.

## 5. Chart AI Behavior

- Default `/chart-ai` (no `source=owner-local`) is unchanged: the OHLC preview button stays
  disabled, no OHLC preview fetch is ever attempted, and the sample chart renders exactly as
  before.
- With `source=owner-local`, the OHLC preview button becomes enabled; clicking it fetches the
  owner-local OHLC preview for the selected symbol/period. Period buttons keep working as before —
  changing period resets any active OHLC preview back to the sample chart and re-renders the
  sample series for the new period (a fresh OHLC preview requires another explicit click).
  Changing the selected symbol resets the OHLC preview state the same way.
- Existing sample chart labels are preserved unmodified: "샘플 차트", "샘플 OHLC·거래량 데이터",
  "실제 시세 아님".
- The existing "KIS 로컬 프리뷰" quote preview card and its wiring are untouched.

## 6. Production Boundary

- Public production Chart AI never calls the OHLC preview route and never renders live OHLC data;
  the mocked/sample chart remains the default and only publicly reachable chart data source.
- No public (non-owner-local) OHLC API route was added — the sole OHLC route added this phase is
  the owner-local-gated one.
- No `source=live` and no `source=auto` were introduced anywhere in this phase.
- No account/trading/order/balance API was added or called, and `KIS_ACCOUNT_NO` is not used.
- No Supabase, SQL, migration, or storage changes. No Vercel environment changes. No dependency
  was added.

## 7. Safety

- No actual OHLC values, raw KIS response fields, or secret-looking values are recorded in this
  document, the changelog, the checker, or any committed fixture.
- The API route and adapter never expose a raw provider payload, authorization header, app key,
  app secret, access token, or `.env` value; provider failures are converted into safe
  blocked/unavailable JSON responses, never a raw server error or stack trace.
- `safety.rawResponsePrinted`, `safety.secretsPrinted` are always `false` and
  `safety.publicProductionBlocked` is always `true` in every adapter/route response.
- No `.env` file was read as part of this phase.
- No deployment. No push.

## 8. Validation

- `npm run check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring`: PASS (62/62).
- `npm run check:phase-3es-owner-local-kis-ohlc-smoke-closeout`: `37/38` — pre-existing checker-design
  issue, not a defect in this phase (see §9).
- `npm run check:phase-3es-owner-local-kis-ohlc-smoke`: PASS (70/70).
- `npm run check:phase-3ep-chart-ai-owner-local-quote-preview-wiring`: PASS (49/49).
- `npm run check:phase-3eo-owner-local-kis-quote-smoke`: PASS (58/58).
- `npm run check:phase-3en-kis-quote-adapter-owner-local-gate`: PASS (87/87).
- `npm run check:provider-boundaries`: PASS.
- `npm run check:kis-runtime-guard`: PASS (7/7).
- `npm run check:kis-error-fallback`: PASS (48/48).
- `npm run check:chart-ai-ux-skeleton`: PASS (82/82).
- `npm run check:mobile-baseline`: PASS (74/74).
- `npm run check:production-domain`: PASS (33/33).
- `npm run build`: PASS.
- `git diff --check`: PASS.
- `npm run guard:production-mobile-geometry`: `DRY_RUN`; no browser and no network.

Known unrelated failures observed but not fixed in this phase (see §9):

- `npm run check:kis-quote-adapter-mocked`: `100/101` — pre-existing, unrelated to this phase.
- `npm run check:phase-3es-owner-local-kis-ohlc-smoke-closeout`: `37/38` — the failing check is "No
  src runtime files changed in this closeout," which diffs from a pinned starting commit with no
  pinned ending commit. This phase's `src/` additions (adapter, route, chart adapter, page wiring)
  trip that assumption. The closeout checker was not fixed or weakened.

## 9. Known Legacy Checker Notes

- `check:kis-quote-adapter-mocked` remains `100/101` — the failing check is "Valuation route (when
  present) is fixture-only — no live source", failing because `src/pages/api/portfolio/valuation.ts`
  contains the `source=live` string. That file is unchanged by this phase; the checker was not
  fixed or weakened.
- `check:phase-3er-kis-ohlc-contract-mocked-adapter`: that checker asserts all OHLC endpoints stay
  `unverified`, an assumption Phase 3ES's verified-endpoint scope intentionally supersedes. Not
  fixed or weakened in this phase.
- `check:phase-3eq-kis-chart-ohlc-feasibility-plan`, `check:phase-3ep-owner-review-closeout`, and
  `check:phase-3es-owner-local-kis-ohlc-smoke-closeout` (now `37/38`): all diff from a pinned
  starting commit with no pinned ending commit, so any later phase's `src/` changes (including this
  phase's) trip their "no runtime change" assumption. Not fixed or weakened in this phase.
- These are all pre-existing, unrelated checker-design issues, not defects introduced by this
  phase.

## 10. Recommended Next Phase

Recommended: Phase 3ET-OWNER-REVIEW — Owner Local Review of Chart AI OHLC Preview.

Alternative: Phase 3EN-HF1 — Legacy KIS Checker Cleanup.

Rationale: The owner-local OHLC preview path is now wired end to end from the API route through
the adapter to the Chart AI UI, with the sample chart preserved as the default and fallback in
every case. The next natural step is an owner-run local review confirming the preview renders
correctly against a live owner-local KIS session, mirroring the Phase 3EP-OWNER-REVIEW pattern
used for the quote preview.
