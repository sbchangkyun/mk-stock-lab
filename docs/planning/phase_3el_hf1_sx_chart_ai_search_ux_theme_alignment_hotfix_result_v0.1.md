# Phase 3EL-HF1-SX — Chart AI Search UX & Theme Alignment Hotfix Result

## 1. Status

Implemented — Chart AI search UX and chart theme alignment hotfix ready for owner review.

## 2. Background

- Phase 3EL-HF1 repositioned `/chart-ai` as a stock lookup-first page.
- Phase 3EL-OWNER-REVIEW-HF1 prepared the owner visual review.
- Owner review found search width, search result styling, idle result visibility, horizontal result layout, and chart theme mismatch issues.
- This phase addresses those issues only.

## 3. Owner Feedback Addressed

- The search input was too wide on desktop.
- The search result design did not match the site style and appeared as raw browser controls.
- Search results appeared before the user entered a stock name or code.
- Search results were laid out horizontally and needed to become a vertical list.
- The chart shell looked fixed dark in light mode.
- The chart shell needed to follow the site light/dark theme.

## 4. Implemented Scope

- Reduced the desktop search input/button group to a maximum width of `820px` while keeping the containing search card aligned with the page.
- Preserved contained, full-width mobile search behavior.
- Kept the dropdown, result count, result rows, and empty state hidden while the input is empty.
- Opened a vertical result list only while a non-empty query is active.
- Limited the no-match state to non-empty queries with zero results.
- Styled runtime-created result buttons as full-width, one-result-per-row controls using the existing surface, border, text, primary, hover, focus, and selected-state language.
- Preserved input clear, dropdown close, and stock-header update after selection.
- Preserved all six required query cases and the `전체`, `주식`, and `ETF` filters.
- Replaced fixed-dark chart-shell colors with page-level theme tokens based on the existing `body.dark-mode` selector.
- Made the light-mode chart shell light while preserving a dark shell in dark mode.
- Added no API, provider, live-data, KIS, FX, quote, or AI-result integration.

## 5. Search Behavior

### Idle state

An empty input closes the dropdown, clears rendered result rows, resets the hidden count, and hides the no-match message. Focusing the empty field, changing a filter, or pressing `조회` with no query does not expose results.

### Typing state

A trimmed non-empty query opens the dropdown and renders matching records as vertical, full-width rows with the Korean name as the primary line and symbol/exchange/type-or-currency metadata as the secondary line.

### No-match state

`ZZZ없는종목999` opens the dropdown with `검색 결과가 없습니다. 종목명이나 종목코드를 다시 확인해 주세요.` and no stale result rows.

### Selection state

Selecting a result updates the centralized stock header and metadata, clears the input, removes rendered results, and closes the dropdown while preserving the selected stock independently.

### Filters and required queries

The `전체`, `주식`, and `ETF` filters remain. Required deterministic coverage remains:

- `005930` → 삼성전자
- `삼성` → 삼성전자
- `000660` → SK하이닉스
- `하이닉스` → SK하이닉스
- `069500` → ETF seed record
- `KODEX` → at least one ETF seed record

## 6. Chart Theme Behavior

### Light mode

The chart uses a white/off-white shell, light rail and overlay surfaces, subtle grid and border colors, readable muted axis labels, and site positive/negative colors.

### Dark mode

The existing `body.dark-mode` state overrides the chart tokens with dark shell and rail surfaces, low-contrast light grid/border colors, readable axis labels, and brighter candle/volume placeholders.

### Theme strategy and scope

Chart panel, rail, border, grid, axis, muted text, placeholder candles, volume bars, overlay, active period, warning, and shadow colors use `--chart-shell-*` custom properties. This phase adds no OHLC dataset and no chart library.

## 7. Safety Confirmation

- No live KIS call.
- No live FX call.
- No quote API call.
- No provider import.
- No production call.
- No Supabase, SQL, or migration work.
- No secrets read or exposed.
- No deployment.
- No push.

## 8. Validation

- Phase 3EL-HF1-SX contract: 109/109 PASS.
- Phase 3EL-OWNER-REVIEW-HF1: 72/72 PASS.
- Phase 3EL-HF1: 112/112 PASS.
- Phase 3EL-UXR: 143/143 PASS.
- Phase 3EL-OWNER-REVIEW-CLOSEOUT: 77/77 PASS.
- Phase 3EL: 89/89 PASS.
- Phase 3EK: 245/245 PASS.
- Chart AI UX skeleton: 82/82 PASS.
- Mobile baseline: 74/74 PASS.
- Production domain: 33/33 PASS.
- Production build: PASS.
- `git diff --check`: PASS.
- Production mobile geometry guard: `DRY_RUN`; no browser or network request.

## 9. Preserved Policies

- Public `source=live` remains disabled.
- `source=auto` remains deferred.
- Public production remains fixture/default.
- A real FX provider is not selected.
- A US quote provider is not implemented.
- No real-time, live, or current-price claim was introduced.

## 10. Recommended Next Phase

Recommended: Phase 3EL-OWNER-REVIEW-HF1-SX — Owner Review of Search UX & Theme Alignment Hotfix.

Alternative: Phase 3EL-HF2 — Mocked Candlestick Chart and Volume Foundation.

Because the previous owner review identified visual UX issues, owner review is recommended before adding chart data.
