# Phase 3EL-OWNER-REVIEW-HF1 — Chart AI Stock Lookup Layout Owner Runbook

## 1. Purpose

This review checks the redesigned local `/chart-ai` layout from Phase 3EL-HF1.

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

### Page identity

- The page feels like a stock lookup/chart page, not an AI demo page.
- `종목 차트` is visible and acceptable.
- Copy is concise and finance-service-like.
- Sample/non-live labels are visible but not overwhelming.

### Search UX

Test `005930`, `삼성`, `000660`, `하이닉스`, `069500`, and `KODEX`.

- The search input is clear and compact, and the short `조회` button is visible.
- `선택 종목 분석 보기` is not visible.
- The result dropdown/list is compact and its rows are easy to select.
- Selecting a result updates the stock header and clears the search input instead of replacing it with the stock code.
- `ZZZ없는종목999` shows a clear no-match state.

### Filters

- `전체`, `주식`, and `ETF` are compact and do not dominate the page.
- The active state is clear, and stock/ETF filtering feels natural.

### Stock header

- Selected-stock identity is centralized in the stock header.
- The header shows name, symbol, exchange, asset type, currency, and sample state.
- Stock name/code are not repeated excessively in lower sections.
- No live-price claim is shown.

### Chart shell

- The chart is the dominant visual surface and feels ready for a candlestick chart.
- A reserved volume area is visible or implied.
- Period controls `1일`, `1주`, `1개월`, `3개월`, and `1년` are visible.
- Chart copy clearly states sample/non-live status.
- The static shell is acceptable as a temporary Phase 3EL-HF1 state before HF2.

### MK AI CTA

- `MK AI` is visible near the chart and feels optional rather than the main page focus.
- No AI analysis cards are visible by default.
- Clicking `MK AI` does not show full analysis results in HF1.
- Any deferred-state message is concise and acceptable.

### Forbidden default AI analysis labels

Confirm these are not visible as default analysis cards: `추세 요약`, `모멘텀`, `변동성`, `지지 / 저항`, `리스크 체크`, `분석 템플릿`, `매매 전략`, `가격 패턴`, `기술적 지표`, and `국면·수급`.

These strings may exist in source comments, documentation, or checker names, but must not appear as default visible UI cards.

### Company/profile placeholder

- `기업 개요` and `샘플 정보` are visible.
- The placeholder is compact and does not bloat the page.
- It does not claim that KIS provides a company description.

### Mobile layout

Use browser responsive mode near 390px width.

- The search input and `조회` button fit, and search results remain inside the viewport.
- The stock header and chart panel remain readable.
- Period controls wrap or scroll safely.
- `MK AI` remains reachable.
- The company/profile placeholder remains compact.
- There is no right-side blank area or horizontal body overflow.

### Accessibility quick check

If convenient, confirm:

- the search input receives focus;
- `조회` is keyboard-focusable;
- result rows are keyboard-selectable;
- period controls are buttons;
- `MK AI` is keyboard-focusable;
- selected and active states are visually clear.

### Forbidden wording

Confirm there is no user-facing `실시간`, `실시간 시세`, `현재 시세`, `live`, `real-time`, `actual market value`, `완벽한 투자 판단`, `매수 추천`, or `매도 추천`.

Allowed safety wording includes `실제 시세 아님`, `샘플 데이터`, `샘플 차트`, `투자 참고용`, and `매수·매도 추천이 아닙니다`.

## 5. Decision Routing

```text
PASS → Phase 3EL-HF2 — Mocked Candlestick Chart and Volume Foundation
FAIL_LAYOUT_DIRECTION → Phase 3EL-HF1-Retry
FAIL_SEARCH_UX → Phase 3EL-HF1-SX
FAIL_CHART_SHELL → Phase 3EL-HF1-CX
FAIL_MK_AI_PLACEMENT → Phase 3EL-HF1-AX
FAIL_MOBILE_LAYOUT → Phase 3EL-HF1-MX
FAIL_SAFETY_COPY → Phase 3EL-HF1-SAFE
INCONCLUSIVE → clarify owner notes before next implementation
```

## 6. Owner Output Format

Return only:

- the filled PASS/FAIL result template;
- short notes for failed or inconclusive items;
- no screenshots unless necessary.
