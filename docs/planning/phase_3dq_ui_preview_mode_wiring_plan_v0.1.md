# Phase 3DQ — UI Preview Mode Wiring Plan

## 1. Metadata

| Field | Value |
|-------|-------|
| Phase | 3DQ |
| Type | UI Preview Mode Wiring Plan |
| Status | **Planned — implementation pending** |
| Latest prior commit | `b944b8c` (docs: record portfolio live preview owner smoke pass) |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Runtime UI changes | None in this phase |
| API route changes | None |
| DB / Supabase schema changes | None |
| Live KIS calls by Claude Code | None |
| Live API calls by Claude Code | None |
| Live FX calls | None |
| Live GNews calls | None |
| AI provider calls | None |
| External data fetch by Claude Code | None |
| Vercel production deployment | Not performed |

---

## 2. Background

Phase 3DP-OWNER-SMOKE-CLOSEOUT confirmed the Portfolio Live Preview API contract works correctly in a local non-production environment. Owner manually ran `npm run smoke:portfolio-live-preview-api:owner` and reported the following final safe summary:

| Field | Value |
|-------|-------|
| HTTP status | `200` |
| `source` | `live` |
| `previewMode` | `owner` |
| `quoteSource` | `live` |
| `liveAttempted` | `true` |
| `providerStored` | `false` |
| `staleState` | `fresh` |
| `rowCount` | `3` |
| `missingQuoteCount` | `0` |
| `unsupportedCount` | `0` |
| `unavailableRows` | `0` |

The API contract is validated. The next step is to plan how the Portfolio UI can optionally display live valuation data in owner/developer mode without exposing live quotes to public or production users.

---

## 3. Current Portfolio UI Data Flow

Source inspected: `src/pages/portfolio.astro` (single-file Astro page with inline `<script>`).

### 3.1 Architecture

The Portfolio page renders an HTML shell in Astro and delegates all behavior to an inline TypeScript `<script>` block. There is no separate component file. All state, rendering, and API calls are in one file.

### 3.2 Core State

```typescript
type AppState = {
  portfolios: Portfolio[];
  positions: DisplayPortfolioPosition[];
  selectedPortfolioId: string | null;
  positionValuations: Record<string, PositionValuation>;
  valuationStatus: ValuationStatus;     // 'idle' | 'loading' | 'ready' | 'partial' | 'error'
  valuationMessage: string | null;
  currencyDisplayMode: 'local' | 'krw';
  // ...
};

type PositionValuation = {
  currentPrice: number | null;
  marketValue: number | null;
  unrealizedPnl: number | null;
  unrealizedPnlPct: number | null;
};
```

**Gap:** `staleState` per row is not stored in `PositionValuation`. The `meta.missingQuoteSymbols` and `meta.unsupportedSymbols` from the API response are not read. Phase 3DR must add these.

### 3.3 `loadValuation()` — Current Fixture Path

Location: `portfolio.astro`, approximately line 527.

```typescript
const loadValuation = async (portfolioId, positions) => {
  // ... filters valid positions ...
  const response = await fetch('/api/portfolio/valuation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      portfolioId,
      baseCurrency,
      source: 'fixture',        // ← hardcoded fixture
      positions: requestPositions,
    }),
  });
  // reads: data.valuation.rows → positionId, currentPrice, marketValue, unrealizedPnl, unrealizedPnlPct
  // does NOT read: staleState, missingQuoteSymbols, unsupportedSymbols, quoteSource, liveAttempted
};
```

### 3.4 Rendering — Current

- **Position card current price**: `posVal?.currentPrice` → formats as local currency; falls back to `'연동 예정'` if null.
- **Position card market value**: `posVal?.marketValue` → formats; falls back to `'연동 예정'`.
- **KPI summary `totalMarketValue`**: `posVal?.marketValue ?? (buyPrice * quantity)` — **falls back to cost basis** when `marketValue` is null. This fallback must be suppressed in live preview mode when `staleState=unavailable`.
- **Valuation status copy (`#valuation-status-copy`)**: shows loading message and error message. Currently shows `'Fixture 기준 평가값을 불러오는 중입니다.'` during loading.

### 3.5 Position Fields Available for API Request

From the existing request mapping (line ~546):

```typescript
{
  symbol:    pos.symbol,
  market:    pos.market as 'KR' | 'US',
  assetType: (pos.assetType || 'stock') as 'stock' | 'etf',
  buyPrice:  pos.buyPrice,
  quantity:  pos.quantity,
  currency:  pos.currency,
}
```

All required API fields are already available in the existing position objects. No new position fields are needed.

---

## 4. Proposed Owner Preview Mode

### 4.1 Recommended Activation Method

**Recommended: local-only URL query parameter `?previewMode=owner`**

Rationale:
- Ephemeral — does not persist across sessions or tabs unless intentionally shared
- No localStorage or cookie writes required
- Easy to reset (remove from URL or navigate away)
- Clearly visible in the URL bar for verification
- Easy to block in production via hostname check
- Does not add permanent app state

Rejected alternatives:
- **localStorage flag**: persists silently across sessions; harder to audit; risk of accidental persistence
- **Internal dev toggle rendered in DOM**: adds production DOM elements even if hidden; risk of accidental visibility
- **Build-time flag only**: not controllable at runtime by the owner without rebuilding

### 4.2 Production Gate

Before honoring the `?previewMode=owner` query parameter, the UI must verify:

1. **Hostname gate**: `window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'`
2. **Query param gate**: `new URLSearchParams(window.location.search).get('previewMode') === 'owner'`
3. **Portfolio currency gate**: `portfolio.baseCurrency === 'KRW'`
4. **Position scope gate**: all positions have `market === 'KR'`, count ≤ 10, not aggregate portfolio view
5. **No `source=auto` or silent escalation**: must be explicitly triggered per valuation load

Both hostname and query param gates must pass together. If either fails, the UI falls back to fixture mode silently — no error shown to public users.

### 4.3 What the Gate Must NOT Do

- Must not show live preview toggle in production (`mkstocklab.vercel.app`)
- Must not call the live preview API without all five conditions being true
- Must not default to live preview on page load
- Must not persist live preview across navigation unless the URL param is carried forward
- Must not expose `?previewMode=owner` as a public feature in any documentation or UI

### 4.4 Owner Indicator

In live preview mode (owner + local + KR-only):
- Show a subtle developer-only banner: `[Owner Preview] 조회 시점 기준 평가` (literal UI label example)
- This banner must not appear in production
- The banner must be distinguishable from normal fixture mode

---

## 5. Request Mapping

### 5.1 Live Preview Request Body

When all gate conditions pass, `loadValuation()` should send:

```json
{
  "portfolioId": "<selected portfolio id>",
  "source": "live",
  "previewMode": "owner",
  "allowLiveQuotes": true,
  "baseCurrency": "KRW",
  "positions": [
    {
      "symbol": "005930",
      "market": "KR",
      "assetType": "stock",
      "buyPrice": <number>,
      "quantity": <number>,
      "currency": "KRW"
    }
    // ...up to 10 KR positions
  ]
}
```

### 5.2 Position Field Mapping

All required fields are already available from `DisplayPortfolioPosition`:

| API field | UI source | Notes |
|-----------|-----------|-------|
| `symbol` | `pos.symbol` | Already mapped |
| `market` | `pos.market` | Must be `KR` — pre-validate before call |
| `assetType` | `pos.assetType \|\| 'stock'` | Already defaulted |
| `buyPrice` | `pos.buyPrice` | Must be finite, ≥ 0 |
| `quantity` | `pos.quantity` | Must be finite, > 0 |
| `currency` | `pos.currency` | Must be `KRW` for KR positions |

### 5.3 Pre-Validation Before Live Call

Before calling the live preview API, the UI must verify:

1. Not an aggregate portfolio view (`selectedPortfolioId !== '__all_portfolios__'`)
2. `portfolio.baseCurrency === 'KRW'`
3. All positions have `market === 'KR'`
4. Position count ≤ 10
5. All positions have valid `symbol`, `buyPrice`, `quantity`, `currency`

If any condition fails:
- Do NOT call the live preview API
- Show a safe disabled state with the message: `현재 포트폴리오는 미리보기 조건을 충족하지 않습니다.` (literal UI copy example)
- Log a safe developer-facing message only (no raw data)

Sample positions from Phase 3DO-CLOSEOUT: `005930`, `000660`, `069500` — all KR stocks/ETFs.

---

## 6. Response Mapping

### 6.1 Current Response Fields (Fixture Path)

The UI currently reads from `data.valuation.rows[]`:
- `positionId` → lookup key
- `currentPrice`
- `marketValue`
- `unrealizedPnl`
- `unrealizedPnlPct`

### 6.2 New Response Fields (Live Preview Path)

Phase 3DR must additionally read:
- `data.valuation.rows[].staleState` → freshness label per row
- `data.valuation.staleState` → summary freshness state
- `data.meta.quoteSource` → confirm `"live"`
- `data.meta.liveAttempted` → confirm `true`
- `data.meta.rawProviderStored` → confirm `false`
- `data.meta.missingQuoteSymbols` → list of symbols with unavailable quotes
- `data.meta.unsupportedSymbols` → list of unsupported symbols

### 6.3 Extended `PositionValuation` Type

Phase 3DR should extend the type:

```typescript
type PositionValuation = {
  currentPrice:    number | null;
  marketValue:     number | null;
  unrealizedPnl:   number | null;
  unrealizedPnlPct: number | null;
  staleState?:     'fresh' | 'stale-but-usable' | 'unavailable';
  quoteSource?:    'live' | 'fixture';
};
```

### 6.4 KPI Summary Behavior in Live Preview

**Critical**: the current KPI summary uses `posVal?.marketValue ?? (buyPrice * quantity)` — falling back to cost basis. In live preview mode this fallback is misleading:

- If `staleState === 'unavailable'` → `marketValue === null` — do NOT fall back to cost basis
- Instead, hide the total or show `—`
- If any rows are unavailable → show summary staleState as `unavailable` → total hidden

Phase 3DR must suppress the cost-basis fallback when `quoteSource === 'live'` and `staleState !== 'fresh'`.

---

## 7. Freshness and Failure State Labels

### 7.1 Korean UI Label Mapping

Use these labels as product copy candidates. These are literal UI copy strings — all Korean text below is approved literal copy:

| API `staleState` | Korean UI label | Meaning |
|-----------------|-----------------|---------|
| `fresh` | `조회 시점 기준` | Quote was live and fresh at request time |
| `stale-but-usable` | `최근 조회 기준` | Cached quote is usable but not fresh |
| `unavailable` | `데이터 일시 불가` | Quote unavailable; no fixture fallback |
| API failure | `연동 실패` | API request failed or contract check failed |

### 7.2 Prohibited Labels

- Do NOT use `실시간` in any user-facing copy.
- Do NOT use `실시간 시세`.
- Do NOT imply market-data-grade realtime accuracy.
- Do NOT use "realtime" or "real-time" in any label or tooltip.
- The live preview mode is for internal owner verification only, not for trading decisions.

### 7.3 Label Placement

- Per-row stale label: small badge or sub-text next to the current price cell
- Summary stale label: below the `#valuation-status-copy` element or near the KPI block
- Developer banner: above the portfolio panel (visible only in owner + local mode)

---

## 8. Partial Data Rules

### 8.1 All Rows Fresh (`staleState=fresh` for all rows)

- Show live preview values in all price/value cells
- Summary label: `조회 시점 기준`
- Row badges: `조회 시점 기준`
- No warning state
- Owner banner: `[Owner Preview] 조회 시점 기준 평가`

### 8.2 Some Rows Stale-but-Usable

- Show available stale values for affected rows
- Row badge: `최근 조회 기준`
- Summary: degraded label — use `최근 조회 기준`
- KPI total: computed only from non-null `marketValue` rows; if any are null → hide total or mark as incomplete

### 8.3 Some Rows Unavailable

- Unavailable rows show placeholder `—` in price and market value cells
- Row label: `데이터 일시 불가`
- Do NOT fall back to fixture data or cost-basis for unavailable rows
- Do NOT mix live and fixture data without clear labeling
- Summary total: hidden or `—` if any row is unavailable
- Show missing symbol count from `meta.missingQuoteSymbols`

### 8.4 API Failure (`valuationStatus === 'error'` in live preview mode)

- Show `연동 실패`
- Return to fixture display for the entire portfolio — do NOT show partial live data
- If returning to fixture, label clearly as `Fixture 기준 평가값` (not live preview)
- Do NOT expose raw error response or error message from the API

### 8.5 Unsupported Rows (`unsupportedSymbols` non-empty)

- If any symbol is in `meta.unsupportedSymbols`, log a developer warning only
- Do NOT render unsupported symbols with live data
- Show the same `—` placeholder as unavailable rows

### 8.6 Aggregate Portfolio (Multi-Portfolio View)

- Do NOT attempt live preview in aggregate view (`selectedPortfolioId === '__all_portfolios__'`)
- Aggregate positions may span multiple portfolios and contain US positions
- Fixture mode only for aggregate view

---

## 9. Security and Privacy Requirements

The following constraints must be enforced in the future Phase 3DR implementation:

| Constraint | Required behavior |
|-----------|------------------|
| No API keys in browser | KIS credentials must never appear in client-side code |
| No KIS credentials in browser | All KIS calls remain server-side only |
| No account numbers | `KIS_ACCOUNT_NO` must never be read, stored, or transmitted client-side |
| No `providerMeta` | The API never exposes `providerMeta`; UI must not render it even if present |
| No raw KIS field names | KIS response fields (e.g. `stck_` prefix, `rt_cd`, `prdy_`, `acml_`) must never appear in UI code |
| No full API response logging | Do not `console.log(response)` or `console.log(data)` |
| No price logging in console | Do not log `currentPrice` values or `marketValue` totals to console |
| No response body in localStorage | Do not write API response JSON to localStorage |
| No telemetry of live response | Do not post live quote data to any analytics service |
| No Supabase write of quote payloads | Do not write quote data to Supabase in this UI phase |

---

## 10. Mobile UX Considerations

### 10.1 Preserve Phase 3DJ-HF2 Mobile Improvements

Phase 3DJ-HF2 fixed mobile overflow and column density in the portfolio table. Phase 3DR must not regress this.

Key constraints:
- Do NOT add new columns to the positions table for the preview toggle or stale labels
- Do NOT add wide badges that break the mobile grid
- Use compact labels (2–4 characters where possible for badges)
- Korean labels `조회 시점 기준`, `최근 조회 기준`, `데이터 일시 불가` are compact enough for sub-text rows

### 10.2 Label Placement for Mobile

- Per-row stale labels: append as a new `<small>` sub-text below the current price cell (not a new column)
- Summary label: use the existing `#valuation-status-copy` element
- Developer banner: above the panel section, full-width, collapsible or dismissible
- No new table columns

### 10.3 No Mobile Overflow Regression

- Test the label additions against the existing `positions-category-grid` layout
- The stale label sub-text must use `text-overflow: ellipsis` or similar if needed
- No horizontal scroll added to the positions table

---

## 11. Implementation Plan for Phase 3DR

### 11.1 Files Likely to Change

| File | Planned change |
|------|---------------|
| `src/pages/portfolio.astro` | Add live preview gate, extend `PositionValuation`, update `loadValuation()`, add stale labels to position card, update KPI summary, add developer banner |

No other runtime files are expected to change in Phase 3DR (API route, server helpers, and database remain unchanged).

### 11.2 Recommended Implementation Sequence

**Step 1**: Extend `PositionValuation` type to include `staleState` and `quoteSource`.

**Step 2**: Add `valuationSource: 'fixture' | 'live'` to `AppState`.

**Step 3**: Add `isOwnerPreviewActive()` helper:
```typescript
const isOwnerPreviewActive = () =>
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
  new URLSearchParams(window.location.search).get('previewMode') === 'owner';
```

**Step 4**: Add `isLivePreviewEligible(portfolioId, positions, baseCurrency)` helper:
```typescript
// Returns false if aggregate, non-KRW, >10 positions, or any US market
const isLivePreviewEligible = (...) => {
  if (isAggregatePortfolioId(portfolioId)) return false;
  if (baseCurrency !== 'KRW') return false;
  if (positions.length > 10) return false;
  if (positions.some(p => p.market !== 'KR')) return false;
  return true;
};
```

**Step 5**: Modify `loadValuation()` to branch between fixture and live:
```typescript
const useLivePreview = isOwnerPreviewActive() && isLivePreviewEligible(portfolioId, validPositions, baseCurrency);
const requestBody = useLivePreview
  ? { portfolioId, baseCurrency, source: 'live', previewMode: 'owner', allowLiveQuotes: true, positions: requestPositions }
  : { portfolioId, baseCurrency, source: 'fixture', positions: requestPositions };
state.valuationSource = useLivePreview ? 'live' : 'fixture';
```

**Step 6**: Extend response parsing to read `staleState` per row and summary staleState from `data.valuation.staleState`.

**Step 7**: Update `renderPositions()` to show stale badges per row. For live preview:
- `staleState === 'fresh'` → `조회 시점 기준`
- `staleState === 'stale-but-usable'` → `최근 조회 기준`
- `staleState === 'unavailable'` → `데이터 일시 불가` + show `—` for price/value

**Step 8**: Fix the KPI summary cost-basis fallback for live preview:
```typescript
// In live preview, do not fall back to cost basis for unavailable rows
const mv = state.valuationSource === 'live'
  ? (posVal?.staleState === 'unavailable' ? null : posVal?.marketValue ?? null)
  : (posVal?.marketValue ?? (p.buyPrice * p.quantity));
```

**Step 9**: Add developer banner:
```typescript
if (state.valuationSource === 'live') {
  // Show developer-only banner near #valuation-status-copy
  // Label: '[Owner Preview] 조회 시점 기준 평가'
}
```

**Step 10**: Update `#valuation-status-copy` messages for live preview:
- Loading: `조회 시점 기준 평가값을 불러오는 중입니다.`
- Error: `연동 실패. Fixture 기준 평가값으로 전환합니다.`

### 11.3 Expected Checkers for Phase 3DR

- `check:portfolio-ui-preview-mode` — static checker verifying:
  - no `process.env` in UI script
  - `isOwnerPreviewActive()` gates on `localhost`/`127.0.0.1` + query param
  - `isLivePreviewEligible()` blocks aggregate, non-KRW, >10, US markets
  - `source: 'fixture'` remains default (live only if gate passes)
  - stale labels `조회 시점 기준`, `최근 조회 기준`, `데이터 일시 불가`, `연동 실패` present
  - KPI summary fallback suppressed for live unavailable rows
  - no `실시간` in UI copy
  - no raw KIS field names in client code
  - no `providerMeta` in client code
  - no `console.log` of price values

### 11.4 Owner Local Browser Review Steps (Phase 3DR)

1. Start local dev server: `npm run dev`
2. Navigate to: `http://localhost:4321/portfolio?previewMode=owner`
3. Sign in, select a KR-only KRW portfolio with ≤ 10 positions
4. Verify stale labels appear next to the current price
5. Verify KPI summary shows `조회 시점 기준` or `데이터 일시 불가`
6. Verify developer banner is visible
7. Navigate to production URL (`mkstocklab.vercel.app/portfolio`) — verify no live preview toggle/banner, no live API call
8. Reload without `?previewMode=owner` — verify fixture mode resumes

---

## 12. Non-Goals

The following are explicitly out of scope for Phase 3DQ and Phase 3DR:

- No production live quote exposure — production users always see fixture data
- No public live API access — `source=live` remains gated
- No US quote support — US positions remain unsupported
- No real FX conversion — `baseCurrency=USD` remains gated
- No Supabase writes of quote data
- No telemetry of live quote responses
- No deployment in this planning phase
- No `source=auto` implementation — remains deferred
- No removal of the fixture path or fixture fallback in production

---

## 13. Validation Results

| Command | Result |
|---------|--------|
| `npm run check:phase-3dq-ui-preview-plan` | PASS — see checker run |
| `npm run check:portfolio-live-preview-owner-smoke-closeout` | PASS |
| `npm run check:portfolio-live-preview-owner-smoke` | PASS |
| `npm run check:portfolio-live-preview-api` | PASS |
| `npm run check:portfolio-valuation-api` | PASS |
| All other existing checkers | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |

---

## 14. Recommended Next Phase

**Phase 3DR — Portfolio UI Preview Mode Implementation**

Implement the owner-gated live preview mode in `src/pages/portfolio.astro` as described in §11 of this plan:

- `isOwnerPreviewActive()` — hostname + query param gate
- `isLivePreviewEligible()` — scope validation (KR-only, ≤10, KRW, non-aggregate)
- Extended `PositionValuation` type with `staleState` and `quoteSource`
- Updated `loadValuation()` branching between fixture and live
- Stale badges in position card (`조회 시점 기준`, `최근 조회 기준`, `데이터 일시 불가`, `연동 실패`)
- Fixed KPI summary — no cost-basis fallback for live unavailable rows
- Developer banner (local only)
- `check:portfolio-ui-preview-mode` static checker
- Owner local browser review
