# Phase 3EL-OWNER-REVIEW-HF1 — Chart AI Stock Lookup Layout Owner Result

## 1. Review Environment

- Review date:
- Local URL:
- Browser:
- Desktop reviewed: PASS / FAIL / NOT CHECKED
- Mobile 390px or similar reviewed: PASS / FAIL / NOT CHECKED

## 2. Page Identity

- Page feels like stock lookup/chart page, not AI demo page: PASS / FAIL
- `종목 차트` is visible and acceptable: PASS / FAIL
- Sample/non-live labels are visible but not overwhelming: PASS / FAIL

## 3. Search UX

- Search input is clear and compact: PASS / FAIL
- `조회` button is visible: PASS / FAIL
- `선택 종목 분석 보기` is not visible: PASS / FAIL
- Result dropdown/list is compact: PASS / FAIL
- `005930` returns 삼성전자: PASS / FAIL
- `삼성` returns 삼성전자: PASS / FAIL
- `000660` returns SK하이닉스: PASS / FAIL
- `하이닉스` returns SK하이닉스: PASS / FAIL
- `069500` returns ETF seed record: PASS / FAIL
- `KODEX` returns at least one ETF seed record: PASS / FAIL
- Selecting a result updates the stock header: PASS / FAIL
- Search input clears after selection: PASS / FAIL
- No-match query shows clear empty state: PASS / FAIL

## 4. Filters

- `전체` filter works and is compact: PASS / FAIL
- `주식` filter works and is compact: PASS / FAIL
- `ETF` filter works and is compact: PASS / FAIL
- Active filter state is clear: PASS / FAIL

## 5. Stock Header

- Stock identity is centralized in the header: PASS / FAIL
- Header shows name, symbol, exchange, asset type, currency, and sample state: PASS / FAIL
- Stock name/code are not repeated excessively below: PASS / FAIL
- No live price claim is shown: PASS / FAIL

## 6. Chart Shell

- Chart is the dominant visual surface: PASS / FAIL
- Chart area feels candlestick-ready: PASS / FAIL
- Reserved volume area is visible or implied: PASS / FAIL
- Period controls `1일`, `1주`, `1개월`, `3개월`, `1년` are visible: PASS / FAIL
- Chart copy clearly states sample/non-live status: PASS / FAIL
- Temporary HF1 chart shell is acceptable before HF2: PASS / FAIL

## 7. MK AI CTA

- `MK AI` button is visible near the chart: PASS / FAIL
- `MK AI` feels optional, not the main page focus: PASS / FAIL
- No analysis cards are visible by default: PASS / FAIL
- Clicking `MK AI` does not show full analysis results in HF1: PASS / FAIL
- Deferred-state message is concise and acceptable: PASS / FAIL / NOT CHECKED

## 8. Forbidden Default AI Analysis Labels

- No default `추세 요약`: PASS / FAIL
- No default `모멘텀`: PASS / FAIL
- No default `변동성`: PASS / FAIL
- No default `지지 / 저항`: PASS / FAIL
- No default `리스크 체크`: PASS / FAIL
- No default `분석 템플릿`: PASS / FAIL
- No default `매매 전략`: PASS / FAIL
- No default `가격 패턴`: PASS / FAIL
- No default `기술적 지표`: PASS / FAIL
- No default `국면·수급`: PASS / FAIL

## 9. Company/Profile Placeholder

- `기업 개요` is visible: PASS / FAIL
- `샘플 정보` is visible: PASS / FAIL
- Placeholder is compact: PASS / FAIL
- No KIS company-description claim is shown: PASS / FAIL

## 10. Mobile / Layout

- Search input and `조회` button fit at 390px: PASS / FAIL / NOT CHECKED
- Search results fit within viewport: PASS / FAIL / NOT CHECKED
- Stock header remains readable: PASS / FAIL / NOT CHECKED
- Chart panel remains readable: PASS / FAIL / NOT CHECKED
- Period controls wrap or scroll safely: PASS / FAIL / NOT CHECKED
- `MK AI` button remains reachable: PASS / FAIL / NOT CHECKED
- Company/profile placeholder remains compact: PASS / FAIL / NOT CHECKED
- No right-side blank area: PASS / FAIL / NOT CHECKED
- No horizontal body overflow: PASS / FAIL / NOT CHECKED

## 11. Accessibility Quick Check

- Search input focus works: PASS / FAIL / NOT CHECKED
- `조회` button focus works: PASS / FAIL / NOT CHECKED
- Result row keyboard selection works: PASS / FAIL / NOT CHECKED
- Period controls are keyboard-focusable buttons: PASS / FAIL / NOT CHECKED
- `MK AI` button focus works: PASS / FAIL / NOT CHECKED
- Active/selected states are visually clear: PASS / FAIL / NOT CHECKED

## 12. Forbidden Wording

- No user-facing `실시간`: PASS / FAIL
- No user-facing `실시간 시세`: PASS / FAIL
- No user-facing `현재 시세`: PASS / FAIL
- No user-facing `live`: PASS / FAIL
- No user-facing `real-time`: PASS / FAIL
- No user-facing `actual market value`: PASS / FAIL
- No `완벽한 투자 판단`: PASS / FAIL
- No `매수 추천`: PASS / FAIL
- No `매도 추천`: PASS / FAIL

## 13. Safety

- No API response shared: PASS / FAIL
- No request/response body shared: PASS / FAIL
- No browser storage/cookies shared: PASS / FAIL
- No secrets shared: PASS / FAIL
- No prices/P&L/account data shared: PASS / FAIL

## 14. Final Decision

Choose one:

- PASS
- FAIL_LAYOUT_DIRECTION
- FAIL_SEARCH_UX
- FAIL_CHART_SHELL
- FAIL_MK_AI_PLACEMENT
- FAIL_MOBILE_LAYOUT
- FAIL_SAFETY_COPY
- INCONCLUSIVE

## 15. Notes

Only include short visual notes for failed or inconclusive items.
