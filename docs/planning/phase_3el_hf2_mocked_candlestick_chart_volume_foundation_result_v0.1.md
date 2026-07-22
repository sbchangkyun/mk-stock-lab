# Phase 3EL-HF2 — Mocked Candlestick Chart and Volume Foundation Result

## 1. Status

Implemented — mocked candlestick chart and volume foundation ready for owner review.

Starting HEAD: `c1e8821` (`docs: close out chart ai sx2 owner review`).

## 2. Background

- Phase 3EL-HF1 repositioned `/chart-ai` as a stock lookup-first page.
- Phase 3EL-HF1-SX and SX2 refined search UX, compact search panel behavior, and chart theme alignment.
- Phase 3EL-OWNER-REVIEW-HF1-SX2-CLOSEOUT recorded owner review `PASS`.
- This phase implements the next deferred scope: mocked candlestick chart and volume foundation.

## 3. Implemented Scope

- Added a client-safe mocked OHLC data contract and fixed-seed deterministic generator for every supported symbol and period.
- Replaced the chart placeholder with SVG candlestick bodies, candle wicks, and non-color-only up/down data state.
- Added sample value and date/time axes, a separated volume band, and volume bars.
- Connected period controls and selected-symbol changes to deterministic chart rerendering.
- Extended the existing light/dark chart tokens to the grid, axes, candles, wicks, and volume.
- Kept the SVG and chart panel contained at desktop and mobile sizes.
- Preserved the approved compact search panel and its selection behavior.
- Added no API/provider/live integration and no chart dependency.

## 4. Mocked Data Behavior

`MockedOhlcPoint` contains `date`, `open`, `high`, `low`, `close`, and `volume`. Supported period keys are `1d`, `1w`, `1m`, `3m`, and `1y`, with 24, 7, 22, 42, and 56 points respectively.

The generator uses a stable symbol-and-period seed and a fixed UTC anchor, so the same input produces the same series across renders. Every series enforces `high >= max(open, close)`, `low <= min(open, close)`, and `volume >= 0`.

The values are generated samples. They contain no live data, no KIS data, and no provider payloads, and they do not represent historical prices.

## 5. Chart Behavior

- Selecting a symbol updates the stock header, chart identity, candle series, and volume series.
- Selecting a period updates the active state, candle series, volume series, and period label.
- `샘플 차트`, `샘플 OHLC·거래량 데이터`, and `실제 시세 아님` remain visible.
- The chart has a selected-symbol/period accessibility label; period controls remain real buttons.
- SVG geometry provides responsive candle widths and a visible volume band without adding a chart dependency.

## 6. Preserved Search UX

- Compact `540px` desktop panel with the example query text removed.
- Dropdown attached to and aligned with the compact panel.
- `전체` / `주식` / `ETF` filters remain in the result header and hidden while inactive.
- One-line, one-result-per-row presentation remains.
- Queries `005930`, `삼성`, `000660`, `하이닉스`, `069500`, and `KODEX` retain deterministic matches.
- Selection still clears the input, closes the dropdown, and updates the stock header.

## 7. Safety Confirmation

- No live KIS call, live FX call, quote API call, provider import, or production call.
- No Supabase access, SQL, migration, secret read, or environment read.
- No dependency or lockfile change.
- No deployment and no push.

## 8. Validation

- `npm run check:phase-3el-hf2-mocked-candlestick-chart-volume-foundation`: 134/134 PASS.
- `npm run check:phase-3el-owner-review-hf1-sx2-closeout`: 79/79 PASS.
- `npm run check:phase-3el-hf1-sx2-chart-ai-compact-search-panel-hotfix`: 112/112 PASS.
- `npm run check:phase-3el-owner-review-hf1-sx-chart-ai-search-ux-theme-alignment`: 78/78 PASS.
- `npm run check:phase-3el-hf1-sx-chart-ai-search-ux-theme-alignment-hotfix`: 109/109 PASS.
- `npm run check:phase-3el-owner-review-hf1-chart-ai-stock-lookup-layout`: 72/72 PASS.
- `npm run check:phase-3el-hf1-chart-ai-stock-lookup-layout-redesign`: 112/112 PASS.
- `npm run check:phase-3el-uxr-chart-ai-stock-lookup-mk-ai-redesign-plan`: 143/143 PASS.
- `npm run check:phase-3el-owner-review-closeout`: 77/77 PASS.
- `npm run check:phase-3el-chart-ai-domestic-symbol-search-wiring`: 89/89 PASS.
- `npm run check:phase-3ek-domestic-symbol-master-search-index-mocked-first`: 245/245 PASS.
- `npm run check:chart-ai-ux-skeleton`: 82/82 PASS.
- `npm run check:mobile-baseline`: 74/74 PASS.
- `npm run check:production-domain`: 33/33 PASS.
- `npm run build`: PASS.
- `git diff --check`: PASS.
- `npm run guard:production-mobile-geometry`: `DRY_RUN`; no browser and no network.

## 9. Preserved Policies

- Public `source=live` remains disabled.
- `source=auto` remains deferred.
- Production remains fixture/default.
- A real FX provider is not selected.
- A US quote provider is not implemented.
- No real-time/live/current-price claims are introduced.
- No account or trading API is added.

## 10. Recommended Next Phase

Recommended: Phase 3EL-OWNER-REVIEW-HF2 — Owner Review of Mocked Candlestick Chart and Volume Foundation.

Alternative: Phase 3EL-HF3 — MK AI Activation Intro and Staged Loading Foundation.

Owner review is recommended before adding MK AI interaction because the chart visual quality is the core surface of the page.
