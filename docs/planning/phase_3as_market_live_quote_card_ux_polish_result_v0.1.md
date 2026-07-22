# Phase 3AS Market Live Quote Card UX Polish + Static Validation Hardening Result v0.1

## 1. Title and Metadata

- **Phase**: 3AS
- **Type**: Market Live Quote Card UX polish and static validation hardening
- **Status**: Implemented
- **Target surface**: Market page only
- **Feature flag**: `KIS_ENABLE_MARKET_QUOTE_CARD`
- **Implementation scope**: UI polish and static validation only
- **Live KIS by Claude Code**: not used
- **Live Supabase by Claude Code**: not used
- **Vercel by Claude Code**: not used
- **Deployment**: not performed
- **Date**: 2026-06-23

---

## 2. Objective

Phase 3AS improves the already implemented Market quote card UX and strengthens static safety validation without expanding scope. No backend contract, API route, KIS provider, Supabase, Vercel configuration, or other page integration was changed.

---

## 3. UX Changes Summary

### Component changes (`src/components/MarketLiveQuoteCard.astro`)

| Change | Before | After |
|---|---|---|
| Section eyebrow | `Live Quote` | `시세 조회` (matches section `aria-label`; avoids overclaiming live data) |
| Hint text | `국내 주식 6자리 종목 코드를 입력하세요.` | `국내 주식 종목 코드 6자리를 입력하세요.` (natural word order) |
| Disabled note | `시세 조회를 사용할 수 없습니다.` | `시세를 조회할 수 없습니다.` (plainer user-facing language) |
| `mqc-unavailable` div | No `aria-live`, no `role` | Added `role="status"` and `aria-live="polite"` — screen readers now announce failure state |
| Retry button | No `aria-label` | Added `aria-label="다시 시도"` — explicit accessible label |
| New search button | No `aria-label` | Added `aria-label="다른 종목 조회"` — explicit accessible label |
| Timestamp | `기준 ${timeStr}` | `${timeStr} 기준` — time first, label second; more natural Korean reading order |
| Currency in result | `data.currency ?? ''` (inline) | Extracted `currencyLabel` local variable with type guard — cleaner |

### TypeScript annotations (pre-existing implicit `any` errors fixed)

All function parameters in the `<script>` block were untyped (implicit `any`). Explicit types added:

| Function | Parameter types added |
|---|---|
| `showUnavailable` | `msg: string \| null \| undefined` |
| `fmtPrice` | `price: unknown, currency: string` |
| `fmtSigned` | `v: unknown, decimals: number` |
| `fmtVolume` | `v: unknown` |
| `fmtTime` | `asOf: unknown` |
| `changeCls` | `change: unknown` |
| `dirArrow` | `change: unknown` |
| `freshnessLabel` | `staleState: unknown, reason: unknown` |
| `renderResult` | `data: Record<string, unknown>, fallback: Record<string, unknown> \| null \| undefined` |
| `doFetch` | `symbol: string` |

### CSS changes (`src/styles/style.css`)

| Class | Change |
|---|---|
| `.mqc-submit` | Added `font-size: 14px` — button text size now explicit and consistent with input |
| `.mqc-result-label` | Removed `text-transform: uppercase` — Korean label text unaffected by this rule; removing it prevents unexpected uppercasing if labels change to include Latin characters |
| `.mqc-result-time` | Changed `font-weight: 700` → `font-weight: 400` — timestamp is secondary info; muted color + light weight gives cleaner visual hierarchy |

---

## 4. Static Validation Hardening Summary

Extended `scripts/check_market_quote_card_static_contract.mjs` from 23 checks to **32 checks**.

### New check groups added

**API contract (extended):**
- Component does not reference Vercel deployment API URL (`.vercel.app`, `.vercel.com`, `api.vercel`)
- All fetch string-literal calls target `/api/market/quote` only (regex verification)

**User-triggered interaction (new group):**
- Submit event listener present (`addEventListener('submit'`)
- Click event listener present (`addEventListener('click'`)

**Browser storage hygiene (new group):**
- No `localStorage` use in component
- No `sessionStorage` use in component

**Secret/token patterns absent (new group):**
- No `Bearer `, `Authorization:`, or `x-api-key:` patterns in component

### Final check count: 32/32 passed, exit 0

---

## 5. Preserved Behavior

- **Market page only**: No other page was modified.
- **Feature flag default disabled**: `KIS_ENABLE_MARKET_QUOTE_CARD` absent = disabled; no change to this logic.
- **No auto-fetch on page load**: User must submit the form before any network request is issued.
- **User-triggered lookup only**: Fetch only occurs inside the `submit` event handler.
- **Existing `/api/market/quote` only**: No other API endpoint is referenced.
- **No raw KIS/Supabase/browser direct provider calls**: All sanitization properties from Phase 3AN preserved.
- **No other page integration**: Home, Chart AI, Portfolio, Lab, and Heatmap unchanged.
- **All 8 UX states preserved**: disabled, idle, validation error, loading, fresh, cache-fresh, stale fallback, unavailable.

---

## 6. Validation Results

| Command | Result |
|---|---|
| `npm run check:market-quote-card` | **32/32 checks passed, exit 0** |
| `npm run check:kis-error-fallback` | **40/40 scenarios passed, exit 0** |
| `npm run build` | Build complete, exit 0 |
| `git diff --check` | Passed — no whitespace errors |
| `git status --short` | 3 expected files changed (all in `src/` and `scripts/`) |

---

## 7. Confirmed Non-Actions

- No API route logic changed.
- No KIS provider logic changed (`kisClient.ts`, `quotes.ts`, `quoteCache.ts` unchanged).
- No KIS runtime guard changed.
- No Supabase logic changed.
- No Vercel configuration changed.
- No deployment performed.
- No live KIS call by Claude Code.
- No live Supabase query or write by Claude Code.
- No SQL executed.
- No deployed URL HTTP request by Claude Code.
- No `.env*` file content read.
- No Production KIS enabled.
- No `KIS_ENABLE_MARKET_QUOTE_CARD` enabled.
- No Home, Chart AI, Portfolio, or Lab live quote wiring added.
- No account, order, trading, balance, holdings, or WebSocket feature implemented.
- No actual symbol, price, Preview URL, bypass secret, secret, token, raw KIS field, raw error, or stack trace recorded.

---

## 8. Owner Browser Review Checklist

- [ ] Disabled state still shows `시세를 조회할 수 없습니다.` with no form or network request.
- [ ] Enabled idle state shows eyebrow `시세 조회` and input with updated hint text.
- [ ] Empty or non-6-digit input shows validation error with no network request.
- [ ] Loading state shows spinner and `조회 중...` text.
- [ ] Fresh result shows `최신 시세` label in primary color, price, currency, change with arrow direction.
- [ ] Cache-fresh result shows `최근 업데이트` label in primary color.
- [ ] Stale fallback result shows `마지막 시세` label in muted color with timestamp.
- [ ] Unavailable state shows error message and `다시 시도` retry button.
- [ ] Timestamp in result reads as `HH:MM:SS 기준` (time first, label second).
- [ ] No raw KIS field names visible in any state.
- [ ] No token or secret-like text visible in any state.
- [ ] No raw error body or stack trace visible in any state.
- [ ] Mobile width (375–390px): no new horizontal scroll.
- [ ] Market dashboard treemap/scatter controls remain fully functional.
- [ ] Home, Chart AI, Portfolio, and Lab remain unchanged.

---

## 9. Remaining Limitations

- **Owner browser review pending**: polished card UX has not yet been re-validated in the browser by the owner.
- **Preview disabled deployment result not yet recorded**: Phase 3AR disabled-state Preview deployment result was not completed due to missing owner evidence. It can be resumed once the owner performs the Phase 3AQ deployment procedure.
- **Active Preview quote lookup blocked**: enabling `KIS_ENABLE_MARKET_QUOTE_CARD` in Vercel Preview still requires a separate explicit owner approval.
- **Live KIS outage behavior unvalidated**: provider error paths validated under mock only (Phase 3AK).
- **Live Supabase outage behavior unvalidated**: Supabase failure paths validated via mock only.
- **Vercel cold-start token cache behavior uncharacterized**.
- **Production KIS remains blocked**: `VERCEL_ENV=production` guard unchanged.
- **Market page only**: Home, Chart AI, Portfolio, Lab, and Heatmap remain disconnected.

---

## 10. Recommended Next Steps

| Option | Description |
|---|---|
| **Owner browser review** | Review the polished card against the checklist in section 8. |
| **Resume Phase 3AR** | Complete the Phase 3AQ disabled-state Vercel Preview deployment and submit sanitized evidence for Phase 3AR recording. |
| **Phase 3AT (future)** | Decide whether to enable `KIS_ENABLE_MARKET_QUOTE_CARD` in Vercel Preview for active quote lookup validation, after Phase 3AR passes. |
| **No expansion** | Do not connect Home, Chart AI, Portfolio, or Lab to live quote data until separate explicit owner approval. |
