# Phase 3AN Minimal Market Page Live Quote Card Result v0.1

## 1. Title and Metadata

- **Phase**: 3AN
- **Type**: Minimal Market page live quote card implementation
- **Status**: Implemented
- **Target surface**: Market page only
- **Feature flag**: `KIS_ENABLE_MARKET_QUOTE_CARD`
- **Default state**: disabled unless `KIS_ENABLE_MARKET_QUOTE_CARD === 'true'`
- **Live KIS by Claude Code**: not used
- **Live Supabase by Claude Code**: not used
- **Vercel by Claude Code**: not used
- **Deployment**: not performed
- **Related plan**: `docs/planning/phase_3am_minimal_ui_live_quote_integration_plan_v0.1.md`
- **Date**: 2026-06-23

---

## 2. Objective

Phase 3AN implements a minimal, read-only Market page Live Quote Snapshot card using the existing normalized `/api/market/quote` contract. The card is placed between the Market page header and the treemap dashboard. It requires an explicit user action (entering a 6-digit KR code and pressing the lookup button) before issuing any network request. All eight required UX states are implemented.

---

## 3. Implementation Summary

### Files Changed

| File | Change |
|---|---|
| `src/components/MarketLiveQuoteCard.astro` | New component — quote card with all 8 UX states and client-side script |
| `src/components/MarketShell.astro` | Added import, feature flag constant, and `<MarketLiveQuoteCard>` insertion |
| `src/styles/style.css` | Added market quote card CSS classes (new rules only; no existing rules modified) |
| `scripts/check_market_quote_card_static_contract.mjs` | New static validation script (25 checks) |
| `package.json` | Added `check:market-quote-card` npm script |

### Component

**Path**: `src/components/MarketLiveQuoteCard.astro`

**Props**: `enabled: boolean`

When `enabled=false`: renders a compact disabled section (`market-quote-card--disabled`) with no script behavior and no network request.

When `enabled=true`: renders the full interactive card (`id="marketQuoteCard"`) with a symbol input form and all active UX states. The client script only runs if `document.getElementById('marketQuoteCard')` is found, so a disabled render produces no script side effects.

### Placement in MarketShell

In `src/components/MarketShell.astro`:

```
import MarketLiveQuoteCard from './MarketLiveQuoteCard.astro';
const isMarketQuoteCardEnabled = import.meta.env.KIS_ENABLE_MARKET_QUOTE_CARD === 'true';
```

Insertion point: between `</header>` and `<section class="market-dashboard">`.

### Feature Flag

- **Variable**: `import.meta.env.KIS_ENABLE_MARKET_QUOTE_CARD`
- **Enable**: set to `'true'` in Vercel env (Preview scope) or local `.env`
- **Disable**: absent or any non-`'true'` value → card not rendered, no script active, no network request
- **Default**: disabled (absent = disabled)

### User-Triggered Fetch

The card does not issue any fetch on page load. A fetch to `/api/market/quote` is only initiated after:

1. The user enters a value in the symbol input
2. The user submits the form (button click or Enter)
3. Client-side validation passes (exactly 6 digits)

If validation fails, the form shows a validation error and no fetch is issued.

### UX States Implemented

All 8 states are implemented as defined in Phase 3AM:
A. Disabled, B. Idle, C. Validation error, D. Loading, E. Fresh success, F. Cache-fresh, G. Stale fallback, H. Unavailable.

### Normalized Contract Fields Used

Only the following fields from the API response are used in UI rendering:

- `ok` — determines success vs error routing
- `data.price` — formatted with `Intl.NumberFormat`
- `data.currency` — displayed as label (e.g., KRW)
- `data.change` — formatted with sign and direction arrow
- `data.changePct` — formatted with sign and %
- `data.volume` — formatted with `Intl.NumberFormat` if present
- `data.asOf` — formatted with `toLocaleTimeString` if present
- `data.staleState` — determines freshness label and CSS state
- `fallback.reason` — determines `'cache-fresh'` vs `'provider-fresh'` vs `'cache-stale-provider-failed'` label
- `body.code` — used only to distinguish `VALIDATION_FAILED`/`SYMBOL_UNSUPPORTED` from general failure; not displayed raw

Fields `data.symbol`, `data.market`, `data.providerMeta.*`, `fallback.cache.*` are not rendered in the UI in this implementation.

### Static Validation Script

**Path**: `scripts/check_market_quote_card_static_contract.mjs`

**Package command**: `npm run check:market-quote-card`

**Checks (25 total)**: file existence, MarketShell integration, API contract, hardcoded defaults absent, all 8 UX state markers present, console hygiene, forbidden KIS field names absent, feature flag reference.

---

## 4. UI Behavior Summary

### A. Disabled State

When `KIS_ENABLE_MARKET_QUOTE_CARD` is not `'true'`, MarketShell renders only:
```html
<section class="market-quote-card market-quote-card--disabled">
  <p class="mqc-disabled-note">시세 조회를 사용할 수 없습니다.</p>
</section>
```
No script runs. No network request is made. The page is otherwise fully functional.

### B. Idle State

When enabled and no quote has been requested: shows a labeled input for a 6-digit KR symbol, a "조회" (Lookup) submit button, and a hint text. The input has `inputmode="numeric"`, `maxlength="6"`, and an accessible `aria-describedby` linking to the hint and validation error.

### C. Validation Error State

If the submitted value is empty, non-numeric, or not exactly 6 digits: shows a Korean error message below the form (`6자리 숫자 종목 코드를 입력해 주세요.`). No network request is made. The error is announced via `aria-live="polite"` and `role="alert"`. The error clears automatically when the user edits the input.

### D. Loading State

While the fetch is in flight: the form is replaced with a spinner and "조회 중..." text. The submit button is disabled. The minimum height of the loading region matches the idle form height to reduce layout shift.

### E. Fresh Success State (`provider-fresh`)

Displays: price (formatted, large), currency, directional change text (▲/▼ sign + value + percentage), volume if available, and timestamp. Label: "최신 시세" in primary color. Change direction uses both color (`--positive`/`--negative`) AND a text arrow symbol.

### F. Cache-Fresh State (`cache-fresh`)

Same data display as E. Label: "최근 업데이트" in primary color, indicating the response served a fresh cache entry without calling the provider.

### G. Stale Fallback State (`cache-stale-provider-failed`)

Same data display as E/F. Label: "마지막 시세" in muted color (`mqc-result-label--stale`), clearly indicating the data is from a stale cache. Timestamp shown to clarify when the data was cached. Avoids financial-action copy.

### H. Unavailable State

Provider returned a non-`ok` response or fetch failed entirely. Shows: "시세를 불러올 수 없습니다." or a context-specific message for `VALIDATION_FAILED`/`SYMBOL_UNSUPPORTED`. No raw error body, no `code` value, no upstream payload shown. A "다시 시도" (Retry) button re-issues the last attempted fetch.

### Responsive Behavior

- Desktop: card uses full content width within `--page-gutter-x` and `--page-max-width`; form row uses flex layout
- Mobile: `mqc-form-row` wraps naturally; no fixed widths that cause horizontal scroll
- `margin-bottom: 20px` separates the card from the market dashboard below

---

## 5. Safety and Sanitization Result

| Property | Result |
|---|---|
| No direct browser KIS call | Confirmed — browser only calls `/api/market/quote` |
| No direct browser Supabase call for quote | Confirmed — no Supabase URL in component |
| No raw KIS fields rendered | Confirmed — `stck_prpr`, `rt_cd`, etc. absent from component |
| No raw upstream errors rendered | Confirmed — only controlled Korean copy shown to user |
| No stack traces rendered | Confirmed — `catch` blocks call `showUnavailable()` only |
| No token/key/account values rendered | Confirmed — none referenced or rendered |
| No hardcoded actual stock symbol | Confirmed — `placeholder="000000"` is UI placeholder only; no `value=` default |
| No hardcoded actual price | Confirmed |
| Console logging avoided | Confirmed — no `console.log(` or `console.error(` in component |
| Documentation records no actual symbol | Confirmed — no symbol recorded in this document |
| Documentation records no actual price | Confirmed — no price recorded in this document |

---

## 6. Validation Results

| Command | Result |
|---|---|
| `npm run check:market-quote-card` | 25/25 checks passed, exit 0 |
| `npm run check:kis-error-fallback` | 40/40 scenarios passed, exit 0 |
| `npm run build` | Build complete, server built in ~5.6s, exit 0 |
| `git diff --check` | Passed — no whitespace errors |
| `git status --short` | 5 expected files changed (2 new, 3 modified) |

---

## 7. Confirmed Non-Actions

- No API route logic changed.
- No KIS provider logic changed (`kisClient.ts`, `quotes.ts`, `quoteCache.ts` unchanged).
- No KIS runtime guard changed.
- No Supabase logic changed.
- No Vercel configuration changed.
- No live KIS call by Claude Code.
- No live Supabase query or write by Claude Code.
- No SQL executed.
- No Vercel CLI command run.
- No deployment performed.
- No deployed URL called by Claude Code.
- No `.env*` file content read.
- No Production KIS enabled.
- No Home, Chart AI, Portfolio, or Lab live quote wiring added.
- No account, order, trading, balance, holdings, or WebSocket feature implemented.
- No actual stock symbol recorded.
- No price value recorded.
- No Preview URL recorded.
- No bypass secret recorded.
- No secret, token, key, raw KIS field value, account data, raw error, stack trace, Supabase URL, project ref, service-role key, anon key, or connection string recorded.

---

## 8. Owner Browser Review Checklist

The following checklist should be completed by the owner with a local `astro dev` server before any deployment:

- [ ] Start local app with `KIS_ENABLE_MARKET_QUOTE_CARD` absent or not `'true'`: Market page shows a compact "시세 조회를 사용할 수 없습니다." card and makes no network request.
- [ ] Start local app with `KIS_ENABLE_MARKET_QUOTE_CARD=true`: Market page shows the Live Quote Snapshot card with an input, a "조회" button, and a hint text.
- [ ] Submit the form with an empty input: validation error appears below the form ("6자리 숫자 종목 코드를 입력해 주세요.").
- [ ] Submit the form with letters or fewer than 6 digits: validation error appears.
- [ ] Submit the form with a valid 6-digit KR symbol: loading state appears (spinner + "조회 중..."), then one of the safe result states (fresh, cache-fresh, stale, or unavailable) appears.
- [ ] No raw KIS field names (`stck_prpr`, `rt_cd`, etc.) are visible in any state.
- [ ] No raw error body or status code is visible in the unavailable state.
- [ ] No token or secret-like text is visible in any state.
- [ ] Stale fallback state shows "마지막 시세" with muted color, not "현재가" or "실시간".
- [ ] "다른 종목 조회" button (shown after a result) returns to idle form.
- [ ] "다시 시도" button (shown in unavailable state) re-issues the last fetch.
- [ ] Desktop widths 1280px, 1440px, 1920px: card fits within page gutters; dashboard below is intact.
- [ ] Mobile width 375–390px: no new horizontal scroll introduced.
- [ ] Market dashboard controls (treemap, scatter, period tabs) remain fully functional.
- [ ] Disabling the flag removes the card; the page continues to load and function normally.

---

## 9. Remaining Limitations

- **Owner browser review pending**: browser rendering, loading state, stale state, and failure state UX are yet to be validated by the owner. This is the primary remaining gate.
- **No automated browser or e2e test**: browser-side behavior is not covered by any automated test in this phase.
- **Live KIS outage not validated against real provider**: provider error paths have been validated only under no-network mock conditions.
- **Live Supabase outage not validated**: Supabase failure paths validated via mock only.
- **Vercel cold-start token cache behavior uncharacterized**: `accessTokenCache` resets on cold start; frequency of token fetch under real Preview traffic is unknown.
- **Production KIS remains blocked**: `VERCEL_ENV=production` hard block is unchanged.
- **Market page only**: Home, Chart AI, Portfolio, Lab, and Heatmap remain disconnected from live quote data.

---

## 10. Recommended Next Steps

| Option | Description |
|---|---|
| **Phase 3AO** | Owner browser review of the Phase 3AN implementation. If approved, record the review result and decide whether to keep, adjust, or expand. |
| Adjustment (Phase 3AO or inline) | If browser review reveals layout, copy, or behavior issues, address them before any further page is connected. |
| Future expansion | Do not connect Home, Chart AI, Portfolio, or Lab to live quote data until Phase 3AN passes owner review and a separate explicit owner approval is given for the next surface. |

**No other pages should be connected during Phase 3AN or until Phase 3AO owner review passes.**
