# Phase 3EL-OWNER-REVIEW — Chart AI Domestic Symbol Search Runbook

## 1. Purpose

This runbook guides the owner through a manual local review of the Chart AI domestic symbol search UI introduced in Phase 3EL.

This review checks visible UI behavior only. It does not validate live quotes, live AI analysis, KIS data, FX data, API responses, or production deployment.

## 2. Safety Rules

Do not share:

- Screenshots containing account data.
- API responses or request/response bodies.
- Browser storage or cookies.
- Secrets, account numbers, or provider payloads.
- Prices, P&L, or other account data.

You may share:

- PASS/FAIL fields from the result template.
- Short visual notes for failed or inconclusive items.
- A cropped screenshot only if needed and only when it contains no sensitive data.

No screenshots are required.

## 3. Local Setup

From the project root, run:

```bash
npm run dev -- --host 127.0.0.1 --port 4321
```

Open:

```text
http://127.0.0.1:4321/chart-ai
```

No production review is required in this phase.

## 4. Review Checklist

### Page Load

- Confirm the Chart AI page loads without a visible layout break.
- Confirm there is no horizontal blank area on desktop.
- Note any obvious console-level UI error only if you happen to notice one.
- Confirm the existing fixture/demo analysis area remains present.

### Required Labels

Confirm these labels are visible:

- `국내 종목 검색`
- `국내 주식·ETF`
- `샘플 종목 데이터`
- `검색 결과`
- `선택 종목`
- `실제 시세 아님`

### Search Queries

Test each query:

| Query | Expected visible result |
| --- | --- |
| `005930` | 삼성전자 |
| `삼성` | 삼성전자 |
| `000660` | SK하이닉스 |
| `하이닉스` | SK하이닉스 |
| `069500` | ETF seed record |
| `KODEX` | At least one ETF seed record |

### Filters

- `전체` shows both stock and ETF sample records.
- `주식` limits the list to stock records.
- `ETF` limits the list to ETF records.
- The active filter state is visually clear.

### Selection

- Select a result and confirm `선택 종목` updates.
- Confirm the summary shows symbol, Korean name, asset type, exchange, and currency.
- Confirm the sample analysis title or summary reflects the selected sample symbol.
- Confirm no price, P&L, current market value, or live freshness label appears.

### Empty State

- Enter `ZZZ없는종목999`.
- Confirm a clear empty state appears without breaking the layout.

### Keyboard and Accessibility

Review if convenient:

- The search input can receive focus.
- Result buttons can be selected with the keyboard.
- Arrow Down from the search input moves focus to the first result.
- The selected state is visible.

### Mobile Visual Check

Use browser responsive mode near 390px width or a mobile device view. Confirm:

- The search input remains usable.
- The result list scrolls locally if needed.
- There is no right-side blank area or horizontal body overflow.
- The selected-symbol card remains readable.
- The sample-data notice remains visible.

### Forbidden Wording

Confirm the new Chart AI search UI does not show:

- `실시간`
- `실시간 시세`
- `현재 시세`
- User-facing `live`
- User-facing `real-time`
- `actual market value`

Browser/dev tooling, file names, and non-user-facing checker or script names are outside this visual review.

## 5. Failure Routing

```text
PASS → Phase 3EL-OWNER-REVIEW-CLOSEOUT
Search mismatch → Phase 3EL-HF1
Filter/selection issue → Phase 3EL-HF2
Mobile/layout issue → Phase 3EL-HF3
Safety wording issue → Phase 3EL-HF4
```

## 6. Owner Output Format

Return only the filled result template and short notes for failed or inconclusive items. No screenshots are required.
