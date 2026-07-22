# Phase 3EL-OWNER-REVIEW-HF1-SX — Chart AI Search UX & Theme Alignment Owner Result

## 1. Review Environment

- Review date:
- Local URL:
- Browser:
- Desktop reviewed: PASS / FAIL / NOT CHECKED
- Mobile 390px or similar reviewed: PASS / FAIL / NOT CHECKED
- Light mode reviewed: PASS / FAIL / NOT CHECKED
- Dark mode reviewed: PASS / FAIL / NOT CHECKED

## 2. Search Width

- Desktop search controls are no longer unnecessarily wide: PASS / FAIL
- Search controls feel compact and subordinate to chart/header: PASS / FAIL
- Search card still aligns naturally with the page: PASS / FAIL
- Mobile search input and `조회` button fit: PASS / FAIL / NOT CHECKED

## 3. Idle Search State

- Empty input hides dropdown: PASS / FAIL
- Empty input hides result count: PASS / FAIL
- Empty input hides result rows: PASS / FAIL
- Empty input hides no-match message: PASS / FAIL
- Changing filters with empty input does not expose results: PASS / FAIL

## 4. Typing State and Result List

- Results appear only after typing: PASS / FAIL
- Results are vertical, one result per row: PASS / FAIL
- Results do not appear side-by-side: PASS / FAIL
- Each row has a primary name line: PASS / FAIL
- Each row has secondary metadata line: PASS / FAIL
- Result rows match site styling: PASS / FAIL
- Result rows do not look like raw browser buttons: PASS / FAIL
- Dense results scroll internally: PASS / FAIL / NOT CHECKED

## 5. Required Queries

- `005930` returns 삼성전자: PASS / FAIL
- `삼성` returns 삼성전자: PASS / FAIL
- `000660` returns SK하이닉스: PASS / FAIL
- `하이닉스` returns SK하이닉스: PASS / FAIL
- `069500` returns ETF seed record: PASS / FAIL
- `KODEX` returns at least one ETF seed record: PASS / FAIL

## 6. Selection Behavior

- Selecting a result updates stock header: PASS / FAIL
- Search input clears after selection: PASS / FAIL
- Dropdown closes after selection: PASS / FAIL
- Previous rows are not left visible after selection: PASS / FAIL
- Selected stock state remains visible in stock header: PASS / FAIL

## 7. No-Match State

- `ZZZ없는종목999` shows no-match message: PASS / FAIL
- No stale previous results are shown: PASS / FAIL
- Clearing input hides no-match message: PASS / FAIL

## 8. Filters

- `전체` works and remains compact: PASS / FAIL
- `주식` works and remains compact: PASS / FAIL
- `ETF` works and remains compact: PASS / FAIL
- Active filter state is clear: PASS / FAIL

## 9. Chart Theme Alignment

- Light mode chart shell is light: PASS / FAIL / NOT CHECKED
- Light mode chart shell no longer looks fixed dark-only: PASS / FAIL / NOT CHECKED
- Light mode grid/axis/candle/volume placeholders are readable: PASS / FAIL / NOT CHECKED
- Dark mode chart shell is dark: PASS / FAIL / NOT CHECKED
- Dark mode grid/axis/candle/volume placeholders are readable: PASS / FAIL / NOT CHECKED
- Chart shell visually matches current site theme: PASS / FAIL

## 10. Preserved HF1 Layout

- `종목 차트` remains visible: PASS / FAIL
- Stock header remains clear: PASS / FAIL
- Period controls remain visible: PASS / FAIL
- `MK AI` CTA remains near chart: PASS / FAIL
- `기업 개요` placeholder remains visible and compact: PASS / FAIL
- No default AI analysis cards are visible: PASS / FAIL

## 11. Mobile / Layout

- Search controls fit at 390px: PASS / FAIL / NOT CHECKED
- Dropdown stays within viewport: PASS / FAIL / NOT CHECKED
- Result rows stack vertically: PASS / FAIL / NOT CHECKED
- Dropdown scrolls internally if dense: PASS / FAIL / NOT CHECKED
- Chart shell remains readable: PASS / FAIL / NOT CHECKED
- Period controls wrap or scroll safely: PASS / FAIL / NOT CHECKED
- No right-side blank area: PASS / FAIL / NOT CHECKED
- No horizontal body overflow: PASS / FAIL / NOT CHECKED

## 12. Accessibility Quick Check

- Search input focus works: PASS / FAIL / NOT CHECKED
- `조회` button focus works: PASS / FAIL / NOT CHECKED
- Result row keyboard selection works: PASS / FAIL / NOT CHECKED
- Result row focus state is visible: PASS / FAIL / NOT CHECKED
- Filter buttons remain accessible: PASS / FAIL / NOT CHECKED
- Period controls are keyboard-focusable buttons: PASS / FAIL / NOT CHECKED

## 13. Forbidden Wording

- No user-facing `실시간`: PASS / FAIL
- No user-facing `실시간 시세`: PASS / FAIL
- No user-facing `현재 시세`: PASS / FAIL
- No user-facing `live`: PASS / FAIL
- No user-facing `real-time`: PASS / FAIL
- No user-facing `actual market value`: PASS / FAIL
- No `완벽한 투자 판단`: PASS / FAIL
- No `매수 추천`: PASS / FAIL
- No `매도 추천`: PASS / FAIL

## 14. Safety

- No API response shared: PASS / FAIL
- No request/response body shared: PASS / FAIL
- No browser storage/cookies shared: PASS / FAIL
- No secrets shared: PASS / FAIL
- No prices/P&L/account data shared: PASS / FAIL

## 15. Final Decision

Choose one:

- PASS
- FAIL_SEARCH_WIDTH
- FAIL_IDLE_RESULTS
- FAIL_RESULT_LIST_STYLE
- FAIL_SELECTION_BEHAVIOR
- FAIL_CHART_THEME
- FAIL_MOBILE_LAYOUT
- FAIL_SAFETY_COPY
- INCONCLUSIVE

## 16. Notes

Only include short visual notes for failed or inconclusive items.
