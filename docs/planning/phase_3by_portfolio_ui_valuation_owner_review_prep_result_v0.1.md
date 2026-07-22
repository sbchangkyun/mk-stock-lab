# Phase 3BY Portfolio UI Valuation Owner Browser Review Prep — Result v0.1

## 1. Title and Metadata

- **Phase**: 3BY
- **Type**: Portfolio UI Valuation Owner Browser Review Prep
- **Status**: Review-ready (pending owner browser inspection)
- **Latest prior commit**: c2fe1ad feat: map fixture valuation into portfolio ui
- **Runtime UI changes**: none
- **API route changes**: none
- **DB / Supabase changes**: none
- **Live KIS calls**: none
- **Live GNews calls**: none
- **Vercel Preview calls**: none
- **Deployment**: not performed

## 2. Objective

Prepare the owner browser review for the Phase 3BX fixture valuation UI mapping. No new implementation is introduced in this phase. Phase 3BY validates that all automated checks still pass, confirms no unintended drift occurred, and provides the owner with a concise manual checklist for final visual confirmation of the holdings table valuation display.

## 3. Automated Checks Performed

This phase runs a focused validation set only.

**Strategy:** This phase does not run every historical smoke test. Only portfolio valuation UI mapping, tab persistence, route fixture safety, and build checks are required. Broad GNews/KIS smoke tests are intentionally skipped.

**Rationale:**
- Project is on a basic server plan — avoid excessive API/smoke check overhead.
- Phase 3BY touches no KIS runtime, GNews runtime, Supabase schema, Home, Chart AI, Lab, MyPage, or deployment paths.
- Running all historical smoke tests in a review/prep phase slows the project without adding signal.

**Focused validator set run:**
- `npm run check:portfolio-owner-review-prep` — 44/44 PASS (new Phase 3BY checker)
- `npm run check:portfolio-ui-valuation-fixture` — 71/71 PASS
- `npm run check:portfolio-tab-order-persistence` — 61/61 PASS
- `npm run check:portfolio-bookmark-tabs` — 121/121 PASS
- `npm run check:portfolio-holdings-header` — 90/90 PASS
- `npm run check:portfolio-valuation-api` — 124/124 PASS
- `npm run build` — PASS
- `git diff --check` — clean
- `git status --short` — clean (only known pre-existing untracked files)

**Intentionally skipped (not run in this phase):**
- `check:gnews-news-policy`, `check:gnews-news-engine`, all GNews suite — not touched by 3BX/3BY
- `check:kis-quote-adapter-mocked`, `check:kis-valuation-design`, `check:kis-runtime-guard`, `check:kis-error-fallback` — not touched
- All `smoke:*` scripts — live/dry-run scope, not applicable here

## 4. What Must Be Visually Reviewed by Owner

Open `/portfolio` in a browser. Verify the following:

### 4.1 Fixture valuation display
- Add positions with KR fixture symbols: **005930**, **000660**, **035420**, **069500**
- Confirm **현재가** shows fixture price (e.g., 73,000원 for 005930)
- Confirm **평가금** shows fixture market value (price × quantity)
- Confirm **수익률** shows signed percent (e.g., +21.67%)
- Confirm **수익금** shows signed amount (e.g., +130,000원)

### 4.2 Unsupported symbols fall back correctly
- Add a symbol not in fixture (e.g., US stock AAPL, or any unlisted KR symbol)
- Confirm **현재가/평가금/수익률/수익금** all show **연동 예정** for that position

### 4.3 Dividend columns unchanged
- Confirm **배당률**, **예상 연배당금**, **배당주기** all show **데이터 대기**

### 4.4 Sorting behavior
- Sort by **평가금** — confirm positions with market values sort above positions with null (연동 예정)
- Sort by **수익률** — confirm ordering by return percent is plausible
- Sort by **수익금** — confirm ordering by unrealized P&L amount is plausible

### 4.5 Refresh behavior
- Click the refresh button
- Confirm fixture values reappear after refresh without any live/real-time wording

### 4.6 Fixture disclosure copy
- Confirm the status copy below the portfolio title is visible and reads clearly
- Expected: "Fixture 기준 평가값입니다. 실시간 시세가 아닙니다." or equivalent
- Confirm no copy in the UI claims **실시간**, **최신 시세**, or **KIS 연결 완료**

### 4.7 Tab order persistence (3BW-HF1 regression check)
- Reorder portfolio tabs using the left/right arrows
- Refresh the page
- Confirm the reordered tab order persists

## 5. Server-Load Policy

This review phase enforces:
- **No polling** — no `setInterval`, no repeated auto-refresh
- **No repeated smoke tests** — focused validation only
- **No live APIs** — no KIS, no GNews, no Vercel, no external HTTP
- **No cron/scheduler** — not added
- **No background refresh** — not added
- **No Vercel Preview call** — not performed
- **No deployment** — not performed
- **Static/build validation only** — all automated checks in this phase are no-network checkers

## 6. Boundary Confirmation

| Boundary | Status |
|---|---|
| Phase 3BX fixture UI mapping | Preserved (verified by checker) |
| Phase 3BW fixture valuation route | Preserved (route unchanged) |
| Phase 3BW-HF1 tab order persistence | Preserved (TAB_ORDER_STORAGE_KEY, read/save helpers intact) |
| Live KIS | Not introduced |
| Live GNews | Not introduced |
| External HTTP | Not introduced |
| DB / Supabase schema | Not changed |
| Supabase storage | Not changed |
| Supabase migrations | Not added |
| Home page / HomePortfolioPanel | Not modified |
| Chart AI page | Not modified |
| Lab page | Not modified |
| My Page | Not modified |
| /news page | Does not exist |
| Vercel config / deployment | Not modified |
| Server-side polling / cron | Not added |

## 7. Focused Validation Results

| Check | Result |
|---|---|
| `npm run check:portfolio-owner-review-prep` | 44/44 PASS |
| `npm run check:portfolio-ui-valuation-fixture` | 71/71 PASS |
| `npm run check:portfolio-tab-order-persistence` | 61/61 PASS |
| `npm run check:portfolio-bookmark-tabs` | 121/121 PASS |
| `npm run check:portfolio-holdings-header` | 90/90 PASS |
| `npm run check:portfolio-valuation-api` | 124/124 PASS |
| `npm run build` | PASS |
| `git diff --check` | clean |
| `git status --short` | clean |

**Intentionally not run** (broad smoke suite — not applicable to this phase):
- All GNews live/dry-run smoke tests
- All KIS live/dry-run smoke tests
- Home/Chart AI/Lab/MyPage suite

## 8. Owner Review Result

- **Status**: pending owner browser review
- Owner must update this status to **passed** or **failed** after browser inspection
- If any visual item fails, report findings and open a Phase 3BY-HF1 fix phase before advancing

## 9. Remaining Limitations

After Phase 3BX and 3BY review:
- **Fixture-only valuation** — all quote data is hard-coded synthetic; no real market prices
- **No live KIS integration** — planned but deferred pending execution plan update
- **No FX conversion** — USD positions cannot show KRW-equivalent values
- **No quote cache** — fixture data is re-resolved on every page load
- **No server-side tab order persistence** — order persists in browser localStorage only; not synced across devices
- **No dividend data** —배당률/예상 연배당금/배당주기 remain 데이터 대기
- **No Home index cards** — market overview cards not yet implemented
- **No Chart AI analysis** — deferred
- **No market menu live charts** — deferred
- **No Lab data modules** — deferred
- **My Page** — incomplete

## 10. Recommended Next Phase

Given project priorities and basic server plan constraints:

1. **If owner review passes**: Phase 3BZ — Fast Roadmap Reprioritization and Lightweight Execution Plan. Update project roadmap to reflect server constraints and new implementation priorities before jumping into heavy live integrations.
2. **Then**: Phase 3CA — Server-side Portfolio Tab Order Preference (lightweight Supabase column approach), if cross-device sync is needed.
3. **Then**: Phase 3CB — KIS/FX Preview Smoke Planning with minimized check scope, avoiding broad re-runs of historical smoke suite.

Do not jump directly into heavy live KIS work before the execution plan is updated.
