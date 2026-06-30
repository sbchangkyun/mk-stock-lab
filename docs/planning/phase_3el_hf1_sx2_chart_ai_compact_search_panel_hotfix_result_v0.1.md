# Phase 3EL-HF1-SX2 — Chart AI Compact Search Panel Hotfix Result

## 1. Status

Implemented — Chart AI compact search panel hotfix ready for owner review.

## 2. Background

- Phase 3EL-HF1 repositioned `/chart-ai` as a stock lookup-first page.
- Phase 3EL-HF1-SX refined search UX and theme alignment.
- Phase 3EL-OWNER-REVIEW-HF1-SX prepared the owner review.
- Owner review found that the search panel remained too wide, the visible search card background retained too much empty space, the result dropdown needed to match the search panel width, the example query text should be removed, filters should move into the result header, and result rows should become compact one-line rows.
- This phase addresses those issues only.

## 3. Owner Feedback Addressed

- The search input was still too wide.
- The visible search panel background was still too wide.
- The result dropdown needed to match the search panel width.
- The result dropdown needed to appear directly below the search input.
- The permanent example query text needed to be removed.
- `전체`, `주식`, and `ETF` needed to move into the result header.
- Each result needed a compact one-line row.

## 4. Implemented Scope

- Reduced the desktop search panel and visible card to `540px`, within the requested `520px`–`560px` range.
- Kept the input/button group at the full inner width of that compact card.
- Preserved full-width, contained mobile behavior below 640px.
- Removed the permanent query example text from the UI while retaining deterministic coverage for all six queries.
- Tied the dropdown width to the compact panel with `calc(100% + 2px)` to align the outer borders exactly.
- Positioned the dropdown at the panel’s bottom edge and joined their border radii while open.
- Moved `전체`, `주식`, and `ETF` into the result header beside `검색 결과` and the result count.
- Kept filters hidden whenever the dropdown is inactive because they now live inside it.
- Converted result buttons to compact flex rows with name and metadata on one line, truncating metadata safely when needed.
- Preserved the vertical one-result-per-row list and safe wrapping below 350px.
- Preserved idle, typing, no-match, selection, keyboard, stock-header, and six-query behavior.
- Preserved light/dark chart theme alignment.
- Added no API, provider, live-data, KIS, FX, quote, or AI-result integration.

## 5. Search Behavior

### Idle state

An empty input clears rendered results, resets the hidden count, hides the no-match message, closes the dropdown, and therefore hides the filters.

### Typing state

A non-empty trimmed query opens the attached dropdown. The result header exposes the count and `전체`/`주식`/`ETF` filters, followed by a vertical list of compact one-line result buttons.

### No-match state

A non-empty query with zero matches shows only the no-match message and no stale results. Clearing the query closes the dropdown.

### Selection state

Selecting a result updates the stock header and metadata, clears the input, removes previous rows, closes the dropdown, and hides the filters.

### Filters and required queries

Filters remain accessible and update results only while a query is active. Deterministic coverage remains:

- `005930` → 삼성전자
- `삼성` → 삼성전자
- `000660` → SK하이닉스
- `하이닉스` → SK하이닉스
- `069500` → ETF seed record
- `KODEX` → at least one ETF seed record

## 6. Layout and Visual Behavior

- Compact desktop width: `540px` for the visible search card.
- Compact background: the card itself, not only its inner controls, uses the compact width.
- Dropdown alignment: attached directly below the card and sized from the same width.
- Result rows: one name-plus-metadata line per vertical result on desktop and normal 390px mobile.
- Mobile: the card returns to full content width; the input and `조회` can stack through existing responsive rules.
- Containment: dropdown and result rows use intrinsic bounds, truncation, and narrow-width wrapping without widening the document.

## 7. Safety Confirmation

- No live KIS call.
- No live FX call.
- No quote API call.
- No provider import.
- No production call.
- No Supabase, SQL, or migration work.
- No secrets read or exposed.
- No dependency added.
- No deployment.
- No push.

## 8. Validation

- Phase 3EL-HF1-SX2 contract: 112/112 PASS.
- Phase 3EL-OWNER-REVIEW-HF1-SX: 78/78 PASS.
- Phase 3EL-HF1-SX: 109/109 PASS.
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

Recommended: Phase 3EL-OWNER-REVIEW-HF1-SX2 — Owner Review of Compact Search Panel Hotfix.

Alternative: Phase 3EL-HF2 — Mocked Candlestick Chart and Volume Foundation.

Because the prior owner review identified search panel proportion issues, owner review is recommended before adding chart data.
