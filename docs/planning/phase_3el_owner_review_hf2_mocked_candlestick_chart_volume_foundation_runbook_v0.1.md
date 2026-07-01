# Phase 3EL-OWNER-REVIEW-HF2 — Mocked Candlestick Chart and Volume Foundation Runbook

## 1. Purpose

This review checks the local `/chart-ai` mocked candlestick chart and volume foundation from Phase 3EL-HF2.

This review checks visible UI and interaction behavior only. It does not validate real quotes, real historical prices, KIS data, FX data, API responses, AI analysis quality, or production deployment.

## 2. Safety Rules

Do not share:

- API responses;
- request/response bodies;
- browser storage;
- cookies;
- secrets;
- real prices;
- P&L;
- account numbers;
- provider payloads.

You may share:

- PASS/FAIL fields;
- short visual notes;
- cropped screenshots only if needed and only without sensitive data.

No screenshots are required.

## 3. Local Setup

From the repository root, run:

```bash
npm run dev -- --host 127.0.0.1 --port 4321
```

Review:

```text
http://127.0.0.1:4321/chart-ai
```

No production review is required in this phase.

## 4. Review Checklist

### Page Load and Preserved Layout

- `/chart-ai` loads normally.
- `종목 차트` remains visible.
- The approved compact search panel remains visually unchanged from SX2.
- The stock header remains clear.
- The `MK AI` CTA remains visible near the chart.
- The `기업 개요` placeholder remains compact.
- No default MK AI analysis cards are visible.

### Chart First Impression

- The chart area no longer feels like a placeholder.
- The chart looks closer to a familiar brokerage candlestick chart.
- Candles are visually recognizable.
- The chart does not feel overly decorative or toy-like.
- The chart remains the dominant visual surface.

### Candlestick Readability

Confirm:

- candle bodies are visible;
- candle wicks are visible;
- the up/down candle distinction is understandable;
- the hollow/filled non-color-only distinction is understandable;
- candle density is readable for each period;
- the price/value axis is readable;
- date/time labels are readable.

### Volume Readability

Confirm:

- the volume band is visible below the candle area;
- volume bars are readable;
- volume bars align visually with the candles;
- the volume band does not overpower the candle chart;
- the volume band remains visible on mobile.

### Period Controls

Test `1일`, `1주`, `1개월`, `3개월`, and `1년`.

Confirm:

- each button is visible;
- the active state changes clearly;
- the chart rerenders when each period is selected;
- candle density changes naturally by period;
- volume bars change with the period;
- period controls remain usable on mobile.

### Selected-Symbol Chart Update

Test search and selection with `005930`, `삼성`, `000660`, `하이닉스`, `069500`, and `KODEX`.

Confirm:

- search results still work;
- selecting a result updates the stock header;
- selecting a result clears the input and closes the dropdown;
- chart identity updates to the selected stock;
- the candle pattern changes by selected stock;
- the volume pattern changes by selected stock;
- no real/live price claim appears.

### Sample and Safety Labels

Confirm that `샘플 차트`, `샘플 OHLC·거래량 데이터`, and `실제 시세 아님` are visible.

Confirm:

- labels are clear;
- labels do not overwhelm the chart;
- no wording implies real historical market prices.

### Light/Dark Theme

In light mode, confirm the chart shell is light; candles, wicks, grid, labels, and volume bars are readable; and the chart does not look fixed dark-only.

In dark mode, confirm the chart shell is dark; candles, wicks, grid, labels, and volume bars are readable; and the chart matches the site dark theme.

### Mobile Layout

Check browser responsive mode around 390px width.

Confirm:

- the chart remains within the viewport;
- there is no right-side blank area;
- there is no horizontal body overflow;
- candles remain visible;
- the volume band remains visible;
- axes and labels do not break the layout;
- period controls wrap or scroll safely;
- the compact search panel remains usable;
- the stock header remains readable.

### Accessibility Quick Check

Review if convenient:

- the chart has an accessible label or screen-reader equivalent;
- period controls are keyboard-focusable buttons;
- the active period state is visible;
- search input focus works;
- result row keyboard selection works;
- the `MK AI` button focus works;
- information is not conveyed by color alone.

### Forbidden Wording

Confirm there is no affirmative user-facing `실시간`, `실시간 시세`, `현재 시세`, `live`, `real-time`, `actual market value`, `완벽한 투자 판단`, `매수 추천`, or `매도 추천` claim.

Allowed safety wording includes `실제 시세 아님`, `샘플 데이터`, `샘플 차트`, `투자 참고용`, and `매수·매도 추천이 아닙니다`.

## 5. Decision Routing

```text
PASS → Phase 3EL-OWNER-REVIEW-HF2-CLOSEOUT
FAIL_CHART_VISUAL_QUALITY → Phase 3EL-HF2-CX
FAIL_CANDLE_READABILITY → Phase 3EL-HF2-CR
FAIL_VOLUME_READABILITY → Phase 3EL-HF2-VX
FAIL_PERIOD_INTERACTION → Phase 3EL-HF2-PX
FAIL_SYMBOL_CHART_UPDATE → Phase 3EL-HF2-SYMBOL
FAIL_MOBILE_CHART_LAYOUT → Phase 3EL-HF2-MX
FAIL_THEME_ALIGNMENT → Phase 3EL-HF2-THEME
FAIL_SEARCH_REGRESSION → Phase 3EL-HF2-SEARCH
FAIL_SAFETY_COPY → Phase 3EL-HF2-SAFE
INCONCLUSIVE → clarify owner notes before next implementation
```

## 6. Owner Output Format

Return only:

- the filled PASS/FAIL result template;
- short notes for failed or inconclusive items;
- no screenshots unless necessary.
