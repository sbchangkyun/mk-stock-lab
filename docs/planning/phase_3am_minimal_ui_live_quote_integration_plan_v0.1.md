# Phase 3AM Minimal UI Live Quote Integration Plan v0.1

## 1. Title and Metadata

- **Phase**: 3AM
- **Type**: Minimal UI live quote integration plan
- **Status**: Planned
- **Execution mode**: Documentation-only planning
- **Implementation changes**: none
- **UI live quote wiring**: not implemented
- **Live KIS**: not used
- **Live Supabase**: not used
- **Vercel**: not used
- **Deployment**: not performed
- **Related gate decision**: `docs/planning/phase_3al_validation_sufficiency_ui_integration_gate_decision_v0.1.md`
- **Related no-network validation**: `docs/planning/phase_3ak_no_network_kis_error_fallback_validation_result_v0.1.md`
- **Related successful-path validation**: `docs/planning/phase_3af_owner_vercel_preview_endpoint_validation_result_v0.1.md`
- **Date**: 2026-06-23

---

## 2. Objective

Phase 3AM defines the minimal safe UI integration plan for displaying read-only live quote data on the Market page using the existing normalized `/api/market/quote` contract. No wiring is implemented in this phase. The plan establishes the exact target surface, UX state specification, data contract mapping, feature flag strategy, sanitization requirements, browser review checklist, implementation boundary, and acceptance criteria for a subsequent Phase 3AN implementation.

Phase 3AN implementation must only proceed after explicit owner approval of this plan.

---

## 3. Evidence Basis

This plan is predicated on the following accumulated validation evidence:

- **Phase 3AF** (owner-run Vercel Preview endpoint validation): `/api/market/quote` returned HTTP 200 with a valid normalized JSON envelope in a live Vercel Preview environment. All 14 success criteria passed. `RawKisFieldsAbsent=True`, `ForbiddenTermsFoundCount=0`, `SecretsTokensRawErrorsAbsent=True`.
- **Phase 3AK** (no-network mock harness): 40/40 scenarios passed across groups A–F (runtime guard, env readiness, provider failure, cache fallback, sanitization, request validation). `RawKisFieldsAbsent=true`, `ForbiddenTermsFoundCount=0`, build passed, no `src/` changes.
- **Phase 3AL** (gate decision): Determined that the above evidence is sufficient to conditionally open a UI live quote integration planning phase. Direct implementation remains blocked until a separate explicit owner approval after this Phase 3AM plan is reviewed.
- **Production KIS**: Remains blocked by the `VERCEL_ENV=production` hard block in `getKisQuoteConfigReadiness()`. No Production endpoint validation has been or will be performed.
- **UI implementation**: Blocked in this phase. No quote card has been implemented, rendered, or tested in a browser.

---

## 4. Recommended First UI Surface

### Primary Target: Market Page Only

The first UI live quote integration must target the **Market page** (`src/pages/market.astro` → `src/components/MarketShell.astro`) and no other page.

### Non-Targets for First Implementation

The following pages must not receive live quote wiring during Phase 3AN:

| Page | Reason deferred |
|---|---|
| **Home** (`index.astro`) | Broader visibility; greater layout risk; decouple from first integration |
| **Chart AI** (`chart-ai.astro`) | Conflates live quote display with AI analysis; higher coupling risk |
| **Portfolio** (`portfolio.astro`) | Conflates quote data with account/holdings context; out of approved scope |
| **Lab** (`lab.astro`) | Experimental; separate from the main quote integration scope |
| **Heatmap** (`heatmap.astro`) | Not identified as a target for live quote display |

### Rationale for Market Page First

- The Market page is the most contextually appropriate surface for a live quote display: it already presents market data (sample treemap, momentum scatter), and the existing lead paragraph explicitly acknowledges sample data and notes that "실시간 연동은 다음 단계에서 다룹니다" (real-time integration is covered in the next phase).
- It limits UX impact to a single contained surface, enabling owner review before any broader rollout.
- It avoids conflating live quote display with AI analysis (Chart AI), portfolio holdings (Portfolio), or high-visibility home page layout concerns.
- The integration remains read-only: no trading, no order placement, no account connection.
- Future expansion to Home, Chart AI, or other pages can be considered only after the Market page Phase 3AN owner browser review passes.

---

## 5. Proposed UI Placement on the Market Page

### Existing Page Structure (from source inspection)

`MarketShell.astro` renders:

1. `<header class="page-header market-page-header">` — page eyebrow, `<h1>시장</h1>`, and a lead paragraph.
2. `<section class="market-dashboard">` — the main dashboard: universe/period/view tab controls and the treemap/scatter chart stage.
3. `<div class="market-card-modal">` — expand modal for fullscreen chart view.
4. `<script>` — client-side tab controls and modal setup.

The page has **no ad rail** (unlike the Home page which uses `HomeRailAd.astro`). The dashboard uses the full content width under `--page-gutter-x`.

### Recommended Placement

Insert a compact **Live Quote Snapshot** section **between the `<header>` and the `<section class="market-dashboard">`** — as a new top-level section within `MarketShell.astro`.

**Why this placement:**

- It is page-level, not view-level: it shows a single quote snapshot independent of which universe/period tab is active in the dashboard below.
- It does not require modification of the per-dashboard-panel rendering loop.
- It does not interfere with the treemap or scatter chart layout.
- It is visually discoverable above the fold alongside the page header.
- It can be hidden (when disabled or unavailable) without affecting the rest of the page.
- It does not require touching the modal or existing tab control logic.

### Recommended Card Characteristics

The Live Quote Snapshot card must:

- Be visually **compact and secondary** — it must not dominate the page or compete with the treemap dashboard.
- Use a **single selected symbol** surfaced via a UI control (e.g., a small input or dropdown of approved KR market symbols), or a safe hardcoded default placeholder during the first implementation — whichever the owner approves at Phase 3AN review.
- Fit within the existing `--page-gutter-x` layout system and respect `--page-max-width`.
- Use existing CSS design tokens: `--surface`, `--border`, `--text`, `--text-muted`, `--positive`, `--negative`, `--neutral`, `--shadow`.
- Not disrupt the 160×600 ad rail — **no ad rail exists on the Market page**, so there is no rail to preserve here; the Home page rail is unaffected.
- Not record actual symbol values or price values in any documentation.
- Show a **data freshness label** whenever the fallback state is not `fresh`.

### Lead Paragraph Update

The current lead paragraph in `MarketShell.astro` reads:
> "현재 수치는 샘플 데이터이며 실시간 연동은 다음 단계에서 다룹니다."

When live quote wiring is implemented in Phase 3AN, this paragraph should be updated to reflect that the quote card now uses live data (in Preview). The exact wording is to be determined during Phase 3AN with owner approval.

---

## 6. Data Contract Mapping

Future Phase 3AN implementation must use **only** the following normalized API contract:

### Endpoint

```
GET /api/market/quote?market=KR&symbol=<REDACTED_6_DIGIT_KR_CODE>
```

- `market`: must be `KR` (only KR is supported by the KIS provider)
- `symbol`: must be a valid 6-digit Korean market code; must be sourced from a UI control or approved default, not hardcoded in documentation

### Allowed Response Fields

**On success (`ok: true`)**:

| Field | Display use |
|---|---|
| `data.market` | Symbol metadata label |
| `data.symbol` | Symbol display (with appropriate redaction in docs) |
| `data.price` | Price display (with appropriate redaction in docs) |
| `data.currency` | Currency label (e.g., KRW) |
| `data.change` | Change display (positive/negative indicator) |
| `data.changePct` | Change percentage display |
| `data.volume` | Volume display (optional, if available) |
| `data.marketState` | Market state label (open/closed/delayed/unknown) |
| `data.asOf` | Timestamp display |
| `data.staleState` | Determines freshness label and copy |
| `data.providerMeta.provider` | May be used for internal state only (not prominently displayed) |
| `data.providerMeta.source` | May be used for internal state only |
| `fallback.state` | Determines freshness label |
| `fallback.reason` | Determines fallback copy (`provider-fresh`, `cache-fresh`, `cache-stale-provider-failed`) |
| `fallback.cache.hit` | Optional: may inform internal state |
| `fallback.cache.cachedAt` | Optional: may inform "last updated" copy |
| `fallback.cache.freshUntil` | Optional: may inform freshness window |
| `fallback.cache.staleUntil` | Optional: may inform stale window |

**On error (`ok: false`)**:

| Field | Display use |
|---|---|
| `code` | Used internally to determine which UI error state to show; must not be rendered raw to the user |

### Prohibitions

Browser code must not:

- Use raw KIS API field names (`stck_prpr`, `rt_cd`, `msg_cd`, `acml_vol`, `prdy_vrss`, `access_token`, etc.).
- Call KIS directly (no browser-to-KIS fetch).
- Call Supabase directly for live quote data.
- Expose raw upstream error bodies, raw error messages, or stack traces.
- Display token/key/account data.
- Render any field not listed above from the API response.

---

## 7. UX State Specification

The Live Quote Snapshot card must implement all of the following UI states.

### A. Initial Idle State

- Displayed before any quote request has been made (page load before fetch, or feature flag off).
- Show a neutral instruction such as: "종목을 선택하면 시세를 확인할 수 있습니다." or a neutral placeholder label.
- Do not imply live data is loaded or available.
- Do not make a network request in this state.

### B. Loading State

- Displayed while the fetch to `/api/market/quote` is in flight.
- Show a compact loading indicator (skeleton or spinner).
- Avoid layout shift: the card must maintain a stable minimum height during loading.
- The loading indicator must be readable and accessible (e.g., `aria-busy="true"`, `aria-label` on the region).

### C. Fresh Success State (`staleState: fresh`, `fallback.reason: provider-fresh`)

- Displays: price, currency, change, change percentage.
- Optionally displays: volume (if present), market state label, timestamp (`asOf`).
- Label: "시세" or "Live Quote" with a freshness indicator.
- Do not assert "실시간" (real-time) unless the contract guarantees it; prefer "최신 시세" (latest quote) to avoid overclaiming.
- Price and change direction must use `--positive` (green) and `--negative` (red) CSS tokens for color. Color must not be the only indicator: include an arrow symbol or +/− text label.
- Timestamp should display in a human-readable format; raw ISO string is acceptable if formatted.

### D. Cache Fresh State (`staleState: fresh`, `fallback.reason: cache-fresh`)

- The provider was not called; the cache served a fresh entry.
- Display the same fields as C.
- Label: "최근 업데이트" (recently updated) or equivalent conservative copy.
- Avoid implying a direct live provider call occurred.

### E. Stale Fallback State (`staleState: stale-but-usable`, `fallback.reason: cache-stale-provider-failed`)

- The provider failed or was unavailable; the cache served a stale (but within stale TTL) entry.
- Display price, currency, change, change percentage, and timestamp.
- Label prominently: "마지막 시세" (last available quote) or "시세 지연 중" (quote delayed).
- Include the cached timestamp to indicate when the last data was obtained.
- Avoid investment/trading language such as "현재가" (current price) when stale.
- Avoid asserting market-open freshness for stale data.
- The stale state indicator must be visually distinct from the fresh state (e.g., use `--neutral` or `--text-muted` for the label).

### F. Unavailable State (`ok: false`)

- The provider failed and no usable cache entry exists.
- Show a user-friendly message: "시세를 불러올 수 없습니다." (Quote unavailable.) or equivalent.
- Do not expose the raw `code` value (e.g., do not show "PROVIDER_UNAVAILABLE" to the user).
- Do not expose any upstream payload.
- Provide a retry affordance (e.g., a "다시 시도" / "Retry" button or link).
- Distinguish from validation error states (see G) in the user copy.

### G. Validation Error State

- Triggered when the request input is malformed or the symbol is unsupported.
- Expected API codes: `VALIDATION_FAILED`, `SYMBOL_UNSUPPORTED`.
- Show a controlled message: "지원하지 않는 종목입니다." (Symbol not supported) or "유효하지 않은 입력입니다." (Invalid input).
- Do not display raw query string, symbol value in a raw error context, or raw validation code.
- The user should understand they need to select a different symbol, not that an internal error occurred.

### H. Disabled / Kill-Switch State

- When the live quote feature flag is off (see Section 8).
- Do not render the quote card at all, or render a neutral disabled placeholder with no network request.
- Recommended: when the flag is off, the card section is not emitted in the server-rendered HTML (Astro SSR conditional rendering).
- If a client-side disabled state is used instead, the component must not issue any fetch to `/api/market/quote` while disabled.

---

## 8. Feature Flag and Kill Switch Plan

### Recommended Approach: Astro SSR Environment Variable Flag

The project already uses server-side environment variable flags (`KIS_ENABLE_LIVE_QUOTES`, `KIS_ENABLE_PREVIEW_LIVE_QUOTES`) for the KIS provider layer. The recommended approach for the UI layer is consistent with this pattern:

**Proposed flag name**: `KIS_ENABLE_MARKET_QUOTE_CARD`

- **Default value**: absent or `false` — the card section is not rendered.
- **Enable value**: `"true"` — the card section is rendered and issues client-side fetches to `/api/market/quote`.
- **Disable behavior**: When the flag is absent or not `"true"`, `MarketShell.astro` does not render the `<section class="market-quote-snapshot">` element. No HTML is emitted, no JavaScript is loaded for the card, and no network request is made.
- **Implementation**: The `MarketShell.astro` frontmatter reads `import.meta.env.KIS_ENABLE_MARKET_QUOTE_CARD` at build/render time. Since the project is Vercel SSR (not static), this is evaluated per-request in the Vercel function context.

### Constraints

- Disabling the UI flag must not change the backend KIS runtime guard behavior (`getKisQuoteConfigReadiness()` remains unaffected).
- Disabling the UI flag must not affect the KIS provider layer, the `/api/market/quote` route, or any other page.
- The flag value must not be exposed in browser-visible HTML or JavaScript output.
- If the flag approach is changed in Phase 3AN (e.g., a client-side constant is used instead), the owner must approve that change, and the implementation must still guarantee zero network requests when disabled.

---

## 9. Sanitization and Security Requirements

Future Phase 3AN implementation must adhere to all of the following:

- **No raw provider response rendered**: The API response JSON must never be rendered directly to the browser. Only normalized fields listed in Section 6 may be used.
- **No raw error messages rendered**: Error `message` field from the API must not be rendered directly. Use controlled UI copy only.
- **No stack traces rendered**: Under no circumstances should a JavaScript or server stack trace appear in any browser-visible element.
- **No token/key/account values rendered**: `KIS_APP_KEY`, `KIS_APP_SECRET`, `access_token`, `KIS_ACCOUNT_NO`, Supabase keys, or connection strings must never appear in any browser-side code, rendered HTML, or error output.
- **No raw KIS field names displayed**: Field names such as `stck_prpr`, `rt_cd`, `msg_cd`, `prdy_vrss`, `acml_vol`, `appkey`, `appsecret`, `grant_type`, `fhkst` must never appear in any browser-visible output.
- **No actual symbol or price values in documentation**: Phase 3AN result documentation must use redacted placeholders (`<REDACTED_6_DIGIT_KR_CODE>`, `<REDACTED_PRICE>`) for any symbol and price value.
- **KIS credentials server-only**: `KIS_APP_KEY`, `KIS_APP_SECRET`, and related values must remain exclusively in the Vercel server-side function context. They must not be passed to Astro's `client:*` directives or any browser bundle.
- **No direct KIS browser call**: The browser must only call `/api/market/quote`; it must never call the KIS API directly.
- **No direct Supabase browser call for quote data**: The browser must not call Supabase to fetch quote cache data.
- **`KIS_ACCOUNT_NO` must remain absent** from all Vercel env scopes.
- **Production KIS remains blocked**: The `VERCEL_ENV=production` hard block must not be removed or bypassed in Phase 3AN.
- **Conservative copy for stale/unavailable states**: Avoid financial-action language (e.g., "현재가", "실시간 체결가") when data is stale or unavailable.

---

## 10. Accessibility and Responsive Requirements

### Desktop

- Fully functional at 1280px, 1440px, and 1920px viewport widths.
- Card must respect `--page-gutter-x: clamp(24px, 4vw, 72px)` and `--page-max-width: 1500px`.
- Card must not exceed the existing content width.

### Mobile

- No horizontal scroll introduced at 375–390px viewport widths.
- The `body { min-width: 1080px }` rule currently applies globally; the quote card must not worsen or introduce additional mobile overflow.
- If the card uses flex or grid layout, it must collapse gracefully on narrow viewports.

### Treemap and Dashboard Integrity

- The Phase 3AN implementation must not alter the treemap/scatter dashboard layout.
- The card is inserted above `<section class="market-dashboard">` and must not affect the dashboard's tab controls, panel rendering, or expand modal.
- The dashboard's CSS class names (`market-dashboard`, `market-control-panel`, `market-dashboard-stage`, `market-chart-card`) must not be modified.

### Visual Accessibility

- **Color is not the only change-direction indicator**: Positive/negative change must be communicated with both color (`--positive`, `--negative`) and a text/symbol indicator (e.g., "+1.23%", "▲1.23%").
- **Numeric values must have labels**: Price must be labeled with currency; change must be labeled with "변동" or equivalent; percentage must include a "%" suffix with context.
- **Timestamp must be understandable**: Display "as of HH:MM" or equivalent; raw ISO timestamp is acceptable if accompanied by a label.
- **Loading state must be announced**: The loading region should use `aria-busy="true"` or an `aria-live` region, or an equivalent screen-reader-friendly loading state.
- **Stale/unavailable states must be readable**: Text contrast must meet WCAG AA (4.5:1 minimum) against the card background using the existing `--text-muted` / `--text` token system.
- **Keyboard accessibility**: If a symbol selector control is introduced, it must be keyboard-navigable (focus visible, Tab/Enter/Space behavior).

### Auto-Refresh

- The initial Phase 3AN implementation must **not** implement automatic polling or auto-refresh unless explicitly approved by the owner at Phase 3AN review.
- If manual refresh affordance (a "Refresh" button) is included, it must not be triggered more frequently than the API cache TTL (15 seconds fresh TTL as documented in `quoteCache.ts`).

---

## 11. Browser Review Checklist for Future Implementation

The following checklist must be completed by the owner after Phase 3AN implementation and before any further rollout:

- [ ] Market page loads without layout shift.
- [ ] Page header, lead paragraph, and eyebrow remain intact and unchanged in structure.
- [ ] Market dashboard (treemap, scatter chart, tab controls) remains fully functional.
- [ ] Live Quote Snapshot card appears in the correct position (between header and dashboard).
- [ ] Card is visually modest — it does not dominate the page or obscure the dashboard controls.
- [ ] No raw error message appears when the quote is unavailable; only user-friendly copy is shown.
- [ ] Stale/fallback state copy is conservative; "마지막 시세" or equivalent is shown, not "현재가".
- [ ] Mobile (375–390px) layout has no new horizontal scroll.
- [ ] Card respects page gutters; no overflow outside `--page-gutter-x` inset.
- [ ] Ad rail on the Market page: **not present** (confirmed via source inspection — no rail on Market page; the Home page rail is unaffected by this integration).
- [ ] Disabling the feature flag (`KIS_ENABLE_MARKET_QUOTE_CARD`) removes or neutralizes the card without breaking the page.
- [ ] No raw KIS field names (`stck_prpr`, `rt_cd`, `access_token`, etc.) are visible in the DOM or network response.
- [ ] No token, key, or secret-like text is visible in any browser-visible output.
- [ ] Browser network tab: only one fetch to `/api/market/quote` per user action; no direct KIS or Supabase calls.
- [ ] `Cache-Control: no-store` header is present on the API response.
- [ ] No actual price value is recorded in any Phase 3AN result documentation.
- [ ] No actual symbol value is recorded in any Phase 3AN result documentation.

---

## 12. Phase 3AN Implementation Boundary

### Allowed in Phase 3AN

After explicit owner approval of this Phase 3AM plan:

- Implement a minimal Live Quote Snapshot card section in `src/components/MarketShell.astro`, inserted between the `<header>` and `<section class="market-dashboard">`.
- Client-side fetch to `/api/market/quote?market=KR&symbol=<APPROVED_SYMBOL>` only.
- Read-only display of normalized `QuoteSnapshot` fields (see Section 6).
- All required UI states: idle, loading, fresh, cache-fresh, stale-fallback, unavailable, validation error, disabled.
- Feature flag: Astro SSR environment variable `KIS_ENABLE_MARKET_QUOTE_CARD` (or a client-side constant if owner approves at Phase 3AN review).
- Safe formatting helpers for price, change, change percentage, and timestamp — defined within the component or a new private utility file, not modifying existing utilities.
- Minor additions to `src/styles/style.css` for card layout (new classes only; no modification of existing classes).
- A Phase 3AN result document and changelog entry.

### Forbidden in Phase 3AN

- Direct KIS browser call.
- Direct Supabase browser call for live quote data.
- New backend API endpoints or modifications to `/api/market/quote`.
- Any modification to `src/lib/server/providers/kisClient.ts`, `quotes.ts`, `quoteCache.ts`, or `providerErrors.ts`.
- Any modification to the KIS runtime guard (`getKisQuoteConfigReadiness`, `classifyRuntime`).
- Production KIS enablement or removal of the `VERCEL_ENV=production` hard block.
- Trading, account, order placement, balance, holdings, or WebSocket features.
- AI analysis coupling (no connection to Chart AI or OpenAI/Gemini endpoints).
- Portfolio connection or use of Supabase portfolio data.
- Live quote wiring on any page other than Market.
- Recording actual symbol or price values in documentation.
- Raw error rendering or raw KIS field rendering in any UI state.
- Deployment (unless owner initiates a separate Preview redeploy for browser review).
- Modifications to migration files or production SQL pack files.

---

## 13. Acceptance Criteria for Phase 3AN

Phase 3AN is complete when all of the following are satisfied:

| Criterion | Required |
|---|---|
| `npm run build` passes | Yes |
| `git diff --check` passes | Yes |
| `npm run check:kis-error-fallback` passes | Yes |
| `npm run check:provider-boundaries` passes | Yes |
| `npm run check:kis-runtime-guard` passes | Yes |
| UI integration limited to Market page only | Yes |
| Feature can be disabled via flag | Yes |
| UI uses `/api/market/quote` only | Yes |
| UI uses normalized `QuoteSnapshot` fields only (Section 6) | Yes |
| All 8 UX states implemented (idle, loading, fresh, cache-fresh, stale, unavailable, validation error, disabled) | Yes |
| Error states show sanitized copy only; no raw errors displayed | Yes |
| No raw KIS field names visible in DOM or network output | Yes |
| No token/secret-like text visible in any browser output | Yes |
| No account, trading, or order scope added | Yes |
| Existing Market page layout and dashboard remain intact | Yes |
| No ad rail affected (Market page has none; Home page rail unaffected) | Yes |
| Phase 3AN result document records only sanitized evidence | Yes |
| Owner browser review checklist (Section 11) completed by owner | Yes |

---

## 14. Remaining Risks and Limitations

- **No live KIS outage validated**: Provider error paths (429, non-200, `rt_cd` nonzero, network failure) have been validated only under no-network mock conditions, not against the real KIS provider in a live environment.
- **No live Supabase outage validated**: Supabase cache failure paths validated via mock injection only. Real Supabase unavailability in a Vercel function invocation has not been exercised.
- **Vercel cold-start token cache behavior uncharacterized**: The in-memory `accessTokenCache` in `kisClient.ts` resets on each function cold start. Token fetch frequency and rate limit exposure under real Vercel Preview traffic are uncharacterized.
- **Production endpoint unvalidated and blocked**: The `VERCEL_ENV=production` hard block prevents live KIS in Production. No Production endpoint has been or will be validated until a separate owner-approved production readiness phase.
- **UI rendering not yet implemented**: Browser-side loading state, success state, stale state, and unavailable state have not been implemented or rendered. All browser behavior is untested.
- **Future implementation must avoid overclaiming real-time behavior**: The KIS quote contract is subject to a 15-second fresh TTL and 120-second stale TTL. UI copy must reflect this; asserting "실시간" (real-time) is not appropriate given the caching semantics.
- **Single-symbol scope**: The initial implementation targets a single selected symbol on the Market page. Multi-symbol or batch quote display is out of scope for Phase 3AN.

---

## 15. Recommended Next Phase

### Phase 3AN: Minimal Market Page Live Quote Card Implementation

Phase 3AN should implement the minimal quote card defined in this plan on the Market page only.

**Precondition**: Phase 3AN must only proceed after the owner explicitly approves this Phase 3AM plan. Approval is not implied by the Phase 3AL gate opening.

**Scope**: The implementation should remain small and reversible. The quote card is a single new section in `MarketShell.astro`. If the browser review reveals any issue (layout, error handling, performance, copy), it must be resolved before any further page is connected.

**No other pages** should be connected to live quote data during Phase 3AN. Home, Chart AI, Portfolio, Lab, and Heatmap pages must remain disconnected from live quote data until Phase 3AN passes owner review.

---

## 16. Confirmed Non-Actions for Phase 3AM

- No source code was changed.
- No scripts were changed.
- No `package.json` was changed.
- No API logic was changed.
- No KIS runtime guard was changed.
- No Supabase logic was changed.
- No Vercel configuration was changed.
- No live KIS call was run.
- No live Supabase query or write was run.
- No SQL was executed.
- No Vercel CLI command was run.
- No Vercel environment variable was mutated.
- No deployment occurred.
- No HTTP request was made to any deployed URL.
- No `.env*` file contents were read.
- No UI live quote wiring was implemented.
- No account, order, trading, balance, holdings, or WebSocket feature was implemented.
- No actual stock symbol was recorded.
- No price value was recorded.
- No Preview URL was recorded.
- No bypass secret was recorded.
- No secret, token, key, raw KIS field value, account data, raw error, stack trace, Supabase URL, project ref, service-role key, anon key, connection string, or JWT secret was recorded.
- No migration files were changed.
- No production SQL pack files were changed.
- No root `README.md` was changed.
- No Claude memory files were changed.
