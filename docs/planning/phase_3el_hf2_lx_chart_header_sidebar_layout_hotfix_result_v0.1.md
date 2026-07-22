# Phase 3EL-HF2-LX — Chart AI Chart Header and Sidebar Layout Hotfix Result

## 1. Status

Implemented — Chart AI chart header and sidebar layout hotfix ready for owner review.

Starting HEAD: `8f518a2` (`docs: prepare chart ai hf2 owner review`).

## 2. Background

- Phase 3EL-HF1 repositioned `/chart-ai` as a stock lookup-first chart page.
- Phase 3EL-HF1-SX and SX2 refined search UX, compact search panel behavior, and chart theme alignment.
- Phase 3EL-HF2 implemented the mocked candlestick chart and volume foundation.
- During owner review of the HF2 chart surface, the owner asked to remove the duplicated
  standalone selected-stock header card, fold the selected-stock identity into the gray chart
  header, remove the duplicate right-side `종목 정보` card, keep `기업 개요` as the first sidebar card,
  and move the MK AI button below `기업 개요` at the sidebar card width.
- This hotfix addresses that layout feedback without touching chart rendering, search UX, or data.

## 3. Owner Feedback Addressed

- Removed the standalone white selected-stock header/identity card (`chart-stock-header`).
- Moved selected-stock identity into the gray chart header as `chart-market-identity-row`.
- Displayed the stock identity as a compact row: name, symbol, exchange, asset type, currency.
- Removed the duplicate right-side `종목 정보` metadata card (`chart-stock-metadata`).
- Kept `기업 개요` (`chart-company-placeholder`) as the first visible right-sidebar card.
- Moved the MK AI button below `기업 개요` inside the right sidebar.
- Made the MK AI button match the sidebar/company-card width (full-width, `chart-sidebar-mk-ai`).

## 4. Runtime Changes

- The selected-stock identity now renders inside the chart header rail as
  `chart-market-identity-row`, containing `chartAiSelectedName`, `chartAiSelectedSymbol`,
  `chartAiSelectedExchange`, `chartAiSelectedAssetType`, and `chartAiSelectedCurrency`.
- The chart header still shows `차트`, `샘플 차트`, `샘플 OHLC·거래량 데이터`, and `실제 시세 아님`.
- The standalone `chart-stock-header` section, the `chart-stock-identity` / `chart-stock-source`
  header structures, and the duplicated in-plot chart identity (`chartAiChartIdentity`) were removed.
- The right-side `종목 정보` metadata card and its `chartAiMetaExchange`, `chartAiMetaAssetType`,
  `chartAiMetaCurrency`, and `chartAiMetaDataStatus` fields were removed.
- The MK AI button (`chartAiMkAiBtn`) and deferred note (`chartAiMkAiNote`, hidden) now live in the
  right sidebar after `기업 개요`, with the button styled full-width to match the company card.
- Selection still updates the identity row via `updateSelection` and rerenders the chart.

## 5. Preserved

- Mocked candlestick rendering (candle bodies and wicks, up/down distinction).
- Volume rendering (volume band and volume bars).
- Period controls (`1일`, `1주`, `1개월`, `3개월`, `1년`).
- Selected-symbol chart update and period-based rerendering.
- Compact SX2 search UX (`540px` panel, attached dropdown, result-header filters, one-line rows).
- Deterministic search behavior for `005930`, `삼성`, `000660`, `하이닉스`, `069500`, and `KODEX`.
- Light/dark chart theme tokens and alignment.
- Mobile containment of the chart and sidebar.
- MK AI remains a deferred, non-blocking note; no MK AI modal/loading/results were added.
- No API/provider/live integration was added.

## 6. Safety Confirmation

- No KIS call, FX call, quote API call, production API call, or provider import.
- No Supabase access, SQL, migration, secret read, or environment read.
- No dependency or lockfile change.
- No deployment and no push.

## 7. Validation

- `npm run check:phase-3el-hf2-lx-chart-header-sidebar-layout-hotfix`: PASS.
- `npm run check:phase-3el-owner-review-hf2-mocked-candlestick-chart-volume-foundation`: PASS.
- `npm run check:phase-3el-hf2-mocked-candlestick-chart-volume-foundation`: PASS.
- `npm run check:phase-3el-owner-review-hf1-sx2-closeout`: PASS.
- `npm run check:phase-3el-hf1-sx2-chart-ai-compact-search-panel-hotfix`: PASS.
- `npm run check:phase-3el-owner-review-hf1-sx-chart-ai-search-ux-theme-alignment`: PASS.
- `npm run check:phase-3el-hf1-sx-chart-ai-search-ux-theme-alignment-hotfix`: PASS.
- `npm run check:phase-3el-owner-review-hf1-chart-ai-stock-lookup-layout`: PASS.
- `npm run check:phase-3el-hf1-chart-ai-stock-lookup-layout-redesign`: PASS.
- `npm run check:phase-3el-uxr-chart-ai-stock-lookup-mk-ai-redesign-plan`: PASS.
- `npm run check:phase-3el-owner-review-closeout`: PASS.
- `npm run check:phase-3el-chart-ai-domestic-symbol-search-wiring`: PASS.
- `npm run check:phase-3ek-domestic-symbol-master-search-index-mocked-first`: PASS.
- `npm run check:chart-ai-ux-skeleton`: PASS.
- `npm run check:mobile-baseline`: PASS.
- `npm run check:production-domain`: PASS.
- `npm run build`: PASS.
- `git diff --check`: PASS.
- `npm run guard:production-mobile-geometry`: `DRY_RUN`; no browser and no network.

## 8. Preserved Policies

- Public `source=live` remains disabled.
- `source=auto` remains deferred.
- Production remains fixture/default.
- A real FX provider is not selected.
- A US quote provider is not implemented.
- No real-time/live/current-price claims are introduced.
- No account or trading API is added.

## 9. Recommended Next Phase

Recommended: Phase 3EL-OWNER-REVIEW-HF2-LX — Owner Review of the Chart Header and Sidebar Layout Hotfix.

Alternative: Phase 3EL-HF3 — MK AI Activation Intro and Staged Loading Foundation.

Owner review of the refined layout is recommended before adding MK AI interaction because the chart
header and sidebar composition is the primary owner-facing feedback item for this surface.
