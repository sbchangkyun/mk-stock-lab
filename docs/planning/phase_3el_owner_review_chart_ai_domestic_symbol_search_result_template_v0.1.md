# Phase 3EL-OWNER-REVIEW — Chart AI Domestic Symbol Search Owner Result

## 1. Review Environment

- Review date:
- Local URL:
- Browser:
- Desktop width reviewed: PASS / FAIL / NOT CHECKED
- Mobile 390px or similar reviewed: PASS / FAIL / NOT CHECKED

## 2. Page Load

- Chart AI page loads: PASS / FAIL
- No visible layout break: PASS / FAIL
- Existing fixture/demo analysis remains present: PASS / FAIL

## 3. Required Labels

- `국내 종목 검색`: PASS / FAIL
- `국내 주식·ETF`: PASS / FAIL
- `샘플 종목 데이터`: PASS / FAIL
- `검색 결과`: PASS / FAIL
- `선택 종목`: PASS / FAIL
- `실제 시세 아님`: PASS / FAIL

## 4. Search Queries

- `005930` returns 삼성전자: PASS / FAIL
- `삼성` returns 삼성전자: PASS / FAIL
- `000660` returns SK하이닉스: PASS / FAIL
- `하이닉스` returns SK하이닉스: PASS / FAIL
- `069500` returns ETF seed record: PASS / FAIL
- `KODEX` returns at least one ETF seed record: PASS / FAIL

## 5. Filters

- `전체` shows mixed stock/ETF sample records: PASS / FAIL
- `주식` limits to stock records: PASS / FAIL
- `ETF` limits to ETF records: PASS / FAIL
- Filter active state is clear: PASS / FAIL

## 6. Selection Behavior

- Selecting a result updates selected-symbol summary: PASS / FAIL
- Summary shows symbol, Korean name, asset type, exchange, and currency: PASS / FAIL
- Sample analysis reflects selected sample symbol: PASS / FAIL
- No price/P&L/current market value appears: PASS / FAIL

## 7. Empty State

- Nonsense query shows empty state: PASS / FAIL
- Empty state does not break layout: PASS / FAIL

## 8. Keyboard / Accessibility

- Input focus works: PASS / FAIL / NOT CHECKED
- Result button keyboard selection works: PASS / FAIL / NOT CHECKED
- Arrow Down from input focuses first result: PASS / FAIL / NOT CHECKED

## 9. Mobile / Layout

- Mobile width remains readable: PASS / FAIL / NOT CHECKED
- Result list scrolls locally if needed: PASS / FAIL / NOT CHECKED
- No right-side blank area: PASS / FAIL / NOT CHECKED
- Selected-symbol card remains readable: PASS / FAIL / NOT CHECKED

## 10. Forbidden Wording

- No `실시간`: PASS / FAIL
- No `실시간 시세`: PASS / FAIL
- No `현재 시세`: PASS / FAIL
- No user-facing `live`: PASS / FAIL
- No user-facing `real-time`: PASS / FAIL
- No `actual market value`: PASS / FAIL

## 11. Safety

- No API response shared: PASS / FAIL
- No request/response body shared: PASS / FAIL
- No browser storage/cookies shared: PASS / FAIL
- No secrets shared: PASS / FAIL
- No prices/P&L/account data shared: PASS / FAIL

## 12. Final Decision

Choose one:

- PASS
- FAIL_SEARCH
- FAIL_FILTER_SELECTION
- FAIL_MOBILE_LAYOUT
- FAIL_SAFETY_WORDING
- INCONCLUSIVE

## 13. Notes

Only include short visual notes for failed or inconclusive items.
