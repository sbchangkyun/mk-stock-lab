# Phase 3EL-OWNER-REVIEW-HF1-SX — Chart AI Search UX & Theme Alignment Owner Runbook

## 1. Purpose

This review checks the local `/chart-ai` search UX and chart theme alignment hotfix from Phase 3EL-HF1-SX.

This review checks visible UI and interaction behavior only. It does not validate real quotes, real candlestick data, KIS data, FX data, API responses, AI analysis quality, or production deployment.

## 2. Safety Rules

Do not share:

- API responses or request/response bodies;
- browser storage or cookies;
- secrets;
- prices or P&L;
- account numbers;
- provider payloads.

You may share:

- completed PASS/FAIL fields;
- short visual notes;
- cropped screenshots only if needed and only when they contain no sensitive data.

No screenshots are required.

## 3. Local Setup

From the project root, run:

```bash
npm run dev -- --host 127.0.0.1 --port 4321
```

Review:

```text
http://127.0.0.1:4321/chart-ai
```

No production review is required in this phase.

## 4. Review Checklist

### Search width

On desktop:

- The search input/button group no longer stretches across nearly the full content width.
- Search controls look compact and subordinate to the stock header/chart.
- The width feels appropriate for a focused lookup control.
- The search card remains naturally aligned with the page.

Near 390px mobile width:

- The input and `조회` button fit.
- There is no horizontal body overflow or right-side blank area.

### Idle search state

With the input empty, confirm the dropdown, result count, result rows, and empty-state message are hidden. The default selected-stock header may remain visible.

### Typing state and vertical result list

Test `삼성`, `KODEX`, `005930`, `000660`, `하이닉스`, and `069500`.

- Results appear only after typing and stack vertically, one result per row.
- Rows never appear side-by-side.
- Each row has a primary name line and secondary metadata line.
- Rows match MK Stock Lab styling rather than raw browser buttons.
- Hover, focus, and selected states are clear.
- Dense results scroll inside the dropdown/list.

### Result row content

Expected stock row:

```text
삼성전자
005930 · KOSPI · 주식
```

Expected ETF row:

```text
KODEX 200
069500 · ETF · KRW
```

### Selection behavior

- Selecting a result updates the stock header.
- The search input clears and the dropdown closes.
- Previous result rows are no longer visible.
- Selected-stock state remains visible in the stock header.

### No-match state

Use `ZZZ없는종목999`.

- The no-match message appears only for this non-empty query.
- No stale previous results remain.
- Clearing the input hides the no-match message.

### Filters

- `전체`, `주식`, and `ETF` still work and remain compact.
- The active state is clear.
- Changing a filter while the input is empty does not expose results.

### Chart theme alignment

In light mode:

- The chart shell is white/off-white or otherwise light, not fixed dark-only.
- Grid, axis, candle placeholders, and volume placeholders are readable.
- The shell matches the surrounding light site theme.

In dark mode:

- The chart shell changes to a dark surface.
- Grid, axis, candle placeholders, and volume placeholders remain readable.
- The shell matches the surrounding dark site theme.

### Preserved HF1 layout

- `종목 차트`, the stock header, period controls, chart-level `MK AI`, and compact `기업 개요` remain visible.
- No default AI analysis cards are visible.

### Mobile layout

At around 390px width:

- Search controls and dropdown stay inside the viewport.
- Result rows stack vertically and dense results scroll internally.
- The chart shell remains readable and period controls wrap or scroll safely.
- There is no right-side blank area or horizontal body overflow.

### Accessibility quick check

If convenient, confirm the search input and `조회` receive focus, result rows are keyboard-selectable with visible focus, filter buttons remain accessible, and period controls remain buttons.

### Forbidden wording

Confirm there is no user-facing `실시간`, `실시간 시세`, `현재 시세`, `live`, `real-time`, `actual market value`, `완벽한 투자 판단`, `매수 추천`, or `매도 추천`.

Allowed safety wording includes `실제 시세 아님`, `샘플 데이터`, `샘플 차트`, `투자 참고용`, and `매수·매도 추천이 아닙니다`.

## 5. Decision Routing

```text
PASS → Phase 3EL-HF2 — Mocked Candlestick Chart and Volume Foundation
FAIL_SEARCH_WIDTH → Phase 3EL-HF1-SX-WIDTH
FAIL_IDLE_RESULTS → Phase 3EL-HF1-SX-IDLE
FAIL_RESULT_LIST_STYLE → Phase 3EL-HF1-SX-LIST
FAIL_SELECTION_BEHAVIOR → Phase 3EL-HF1-SX-SELECT
FAIL_CHART_THEME → Phase 3EL-HF1-SX-THEME
FAIL_MOBILE_LAYOUT → Phase 3EL-HF1-SX-MOBILE
FAIL_SAFETY_COPY → Phase 3EL-HF1-SX-SAFE
INCONCLUSIVE → clarify owner notes before next implementation
```

## 6. Owner Output Format

Return only:

- the filled PASS/FAIL result template;
- short notes for failed or inconclusive items;
- no screenshots unless necessary.
