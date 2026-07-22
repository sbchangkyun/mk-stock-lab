# Phase 3BK — Portfolio Experience Redesign Plan & State Contract
## Result v0.1

---

### 1. Phase identity

| Field | Value |
|-------|-------|
| Phase | 3BK |
| Type | Portfolio experience redesign plan and state contract |
| Status | Planned |
| Branch | `rebuild/phase-1-ia-shell` |
| Latest prior commit | `00323ac` — style: polish home market news section |
| Documentation-only phase | Yes |
| Runtime code changes | None |
| Home implementation changes | None |
| Portfolio implementation changes | None |
| API route changes | None |
| Database changes | None |
| Supabase changes | None |
| Deployment | Not performed |

---

### 2. Objective

This phase reorients the near-term roadmap around portfolio management as the core
product experience of MK Stock Lab. Rather than continuing with an optional /news list
page (Phase 3BI), the owner has determined that improving the Home and Portfolio pages
to clearly communicate the portfolio product's value and usability is a higher priority.

The deliverable of Phase 3BK is a planning document and state contract that translates
the owner's intent into a precise, implementation-ready specification. Later phases
(3BL, 3BM, 3BN) implement the design. Nothing in this document modifies runtime files.

---

### 3. Owner intent summary

**Home page changes (Phase 3BL)**

The current Market Coverage card on the Home page (`<aside class="panel market-panel">`)
is static and informational. It does not reflect the user's account status or portfolio
state. The owner wants to replace it with a portfolio-aware status panel that shows
different content depending on whether the visitor is signed out, signed in with no
portfolio, or signed in with at least one portfolio.

The three Home states are:
- **signed_out**: Show a four-step guide explaining how to start with MK Stock Lab.
- **signed_in_empty**: Show the same four-step guide with step 02 (포트폴리오 만들기)
  visually emphasized, since login is already done.
- **signed_in_with_portfolio**: Show a compact portfolio summary dashboard with key
  metrics. Clicking the panel navigates to the Portfolio page.

**Portfolio page changes (Phases 3BM, 3BN)**

The Portfolio page has three problems the owner wants to fix:

1. The top status bar showing "로그인됨 / 프로필 준비 완료 / API 사용 가능 / 평가 준비 중"
   looks like developer/debug output and is confusing for ordinary users. It should be removed.

2. The current two-column layout (sidebar with registration form + detail panel) makes
   the main dashboard area narrow. The sidebar should be removed as a permanent element.
   The full portfolio dashboard should occupy the main content width.

3. Portfolio selection is currently a list in the sidebar. It should be redesigned as
   a horizontal bookmark/tab UI at the top of the dashboard.
   - "전체 포트폴리오" tab: always pinned at the far left.
   - "추가(+)" tab: always pinned at the far right.
   - User portfolio tabs: between the two pinned tabs, reorderable.
   - On hover over a user tab (desktop): show `‹ {name} ›` directional arrows.
   - Clicking an arrow moves that tab one slot in the specified direction.
   - Tab order boundaries: cannot cross pinned tabs.

4. A refresh icon button should be added to the right of the "내 투자 포트폴리오"
   page heading. The initial behavior should be data reload (refetch from API), not live
   KIS market price refresh.

**Roadmap change**

Phase 3BI (optional /news paginated list page) is deferred. Portfolio experience
redesign takes priority.

---

### 4. Current implementation observations

#### 4.1 Home page (`src/pages/index.astro`)

- **Hero section** (`<section class="hero-section">`):
  - Left column: hero copy (`h1`, lead text, CTA buttons to Chart AI and Market).
  - Right column: `<aside class="panel market-panel">` — the current Market Coverage card.
    Content is entirely static: shows coverage labels for domestic stocks, US stocks,
    ETF, and a note that crypto is excluded. No auth awareness, no portfolio awareness.

- **Feature cards section** (`<section class="grid-4">`):
  - Four feature cards linking to Chart AI, Market, Lab, Portfolio.

- **HomeMarketNews section** (`<HomeMarketNews articles={newsArticles} />`):
  - SSR-fetches fixture-backed news articles.

- **Auth state**: The Home page has **no auth state awareness**. It renders identically
  for all visitors. The Market Coverage card is a pure static component.

- **SSR boundary**: Auth is Supabase-client-side only. The Home page runs SSR for news
  data but cannot access auth session at render time. The portfolio status panel will
  need client-side hydration to check auth state after page load.

#### 4.2 Portfolio page (`src/pages/portfolio.astro`)

The portfolio page is a 1,109-line Astro component with a large inline `<script>` block
that implements a full client-side state machine. Key structural observations:

**Status bar (to be removed in Phase 3BM)**

```html
<section class="portfolio-status-bar" id="portfolio-readiness" data-state="checking">
  <div class="portfolio-status-items" aria-label="포트폴리오 상태">
    <span class="status-pill" data-status-key="login">...</span>   <!-- 로그인 -->
    <span class="status-pill" data-status-key="profile">...</span> <!-- 프로필 -->
    <span class="status-pill" data-status-key="api">...</span>     <!-- API -->
    <span class="status-pill neutral">...</span>                   <!-- 평가 준비 중 -->
  </div>
  <p id="portfolio-readiness-copy">...</p>
</section>
```

This bar exposes 10 internal state transitions to the user. While useful for development,
it is not appropriate for production UX. It will be removed in Phase 3BM.

**Lock state (retained, possibly restyled in Phase 3BM)**

```html
<section class="portfolio-lock-state hidden" id="portfolio-lock-state">
  <!-- Sign-in prompt shown when signed_out -->
</section>
```

This section is appropriate and should be retained (possibly with visual polish).

**MVP layout (to be restructured in Phase 3BM)**

```html
<section class="portfolio-mvp hidden" id="portfolio-mvp">
  <aside class="portfolio-sidebar panel">
    <!-- Portfolio list + create/edit form + refresh button -->
  </aside>
  <section class="portfolio-detail panel">
    <!-- Positions for selected portfolio -->
  </section>
</section>
```

Current layout: sidebar (≈280px) + main detail column. The sidebar contains the
portfolio creation form inline, making the main area narrow on mid-size screens.
The refresh button (`#portfolio-refresh`) is currently inside the sidebar header.

**Aggregate portfolio**

An `__all_portfolios__` special ID is already implemented. When selected, it shows
a merged view of positions across all portfolios (deduplicated by market+symbol, quantities
summed, weighted-average buy price computed). This is the logical implementation backing
the "전체 포트폴리오" tab in Phase 3BN.

**Portfolio reorder**

Portfolio ordering is already implemented in `state.portfolioOrder` (client-side array).
It is currently exposed via "위로 / 아래로" buttons in each sidebar list item.
This will be redesigned as horizontal bookmark tab reorder in Phase 3BN.

#### 4.3 Portfolio data source

Portfolio data is **backend-backed** via Supabase:

- Auth: `supabase.auth.getSession()` (browser Supabase client, client-side only).
- Profile: `/api/auth/profile-bootstrap` endpoint ensures the user's profile row exists.
- Portfolios: `/api/portfolio/portfolios` (GET, POST, PATCH, DELETE).
- Positions: `/api/portfolio/positions?portfolioId=...` (GET, POST, PATCH, DELETE).
- Server implementation: `src/lib/server/portfolio.ts` — Supabase admin client, queries
  `portfolios` and `portfolio_positions` tables.

**Valuation status**: `src/lib/server/portfolioValuation.ts` builds placeholder-only
rows. `currentPrice`, `marketValue`, `unrealizedPnl`, and `unrealizedPnlPct` are all
`null`. Only `costBasis` (buyPrice × quantity) is computed. `staleState` is always
`'unavailable'`. KIS market data is **not connected** to portfolio valuation.

#### 4.4 Auth detection flow (client-side)

```
Page load
  → initPortfolioReadiness()
  → isSupabaseConfigured() / getBrowserSupabaseClient()
  → supabase.auth.getSession()
  → if no session → signed_out state
  → if session → bootstrapProfileForCurrentSession()
    → /api/auth/profile-bootstrap
    → if ready → loadPortfolioMvp()
      → portfolioApi.listPortfolios()
      → if empty → signed_in_empty (coarse)
      → if portfolios.length > 0 → signed_in_with_portfolio (coarse)
```

This same flow must be replicated (in simplified form) for the Home portfolio panel
in Phase 3BL.

#### 4.5 Current limitations and risks

- **Valuation data is all placeholder**: `totalValue`, `profitAmount`, and `profitRate`
  cannot be shown with real numbers. Any fields shown must clearly indicate they are
  based on cost basis only, not live market prices.
- **No SSR auth**: The Home portfolio panel cannot be server-side rendered for the
  correct state. It will briefly show a loading/skeleton state before auth resolves.
- **Supabase public key required**: The panel requires Supabase client to be configured
  in the preview/production environment. In environments without Supabase, the panel
  will display the signed_out state (or a graceful error).
- **Home signed_in_with_portfolio risk**: If the API call to list portfolios fails or
  is slow, the panel could briefly show incorrect state. Error handling must be careful.

---

### 5. Home portfolio status panel plan

The Market Coverage `<aside class="panel market-panel">` inside `<section class="hero-section">`
is replaced by a new component (e.g., `HomePortfolioPanel.astro`) that renders one of
three states based on client-detected auth + portfolio presence.

The component renders an SSR shell immediately, then client-side JS updates the panel
to the correct state. The shell can show a neutral placeholder or the signed_out guide
(safest default, overwritten if signed in).

#### State A: signed_out

| Field | Value |
|-------|-------|
| Purpose | Explain the portfolio product's value and prompt account creation |
| Layout | Four-step numbered guide with CTA button |
| Rendered by default | Yes — safest SSR fallback |
| Data dependency | None (pure static content) |

**Recommended copy:**

- Panel title: 포트폴리오 관리를 시작해보세요
- Lead: 계정을 만들고 보유 종목을 입력하면 자산 구성과 수익률을 한눈에 확인할 수 있습니다.
- Step list:
  - 01 무료 계정으로 시작
  - 02 포트폴리오 만들기
  - 03 보유 종목 입력
  - 04 투자 현황 확인
- CTA button: 무료로 시작하기 → opens auth modal (`mk:open-auth` event)

**Constraints:** No "실시간" or live data claim. Steps describe the onboarding flow
for MK Stock Lab, not a generic guide. Do not copy reference image text verbatim.

#### State B: signed_in_empty

| Field | Value |
|-------|-------|
| Purpose | Acknowledge sign-in is complete; prompt portfolio creation as the next step |
| Layout | Same four-step guide as signed_out, with step 02 visually emphasized |
| Emphasis treatment | Accent border, "다음 단계" badge, or highlighted card — restrained, not alarming |
| Data dependency | Auth session confirmed; portfolios array is empty (from API call) |

**Recommended copy:**

- Panel title: 첫 포트폴리오를 만들어보세요
- Lead: 계정 준비가 완료되었습니다. 이제 보유 종목을 추가해 투자 현황을 확인할 수 있습니다.
- Step list: same as signed_out (steps 01–04), step 02 highlighted
- Step 01 appearance: de-emphasized (completed)
- Step 02 appearance: primary accent — "포트폴리오 만들기 →"
- CTA button: 포트폴리오 만들기 → navigates to `/portfolio`

**Constraints:** Step 01 should appear completed or muted. Step 02 must be visually
prominent but not use animation or disruptive color. Steps 03 and 04 appear as future.

#### State C: signed_in_with_portfolio

| Field | Value |
|-------|-------|
| Purpose | Show a compact portfolio overview; drive navigation to Portfolio page |
| Layout | Compact metric dashboard; no table; click-to-navigate |
| Click behavior | Entire panel is a link or has a primary CTA navigating to `/portfolio` |
| Data dependency | Auth session; at least one portfolio exists; summary computed from loaded data |

**Compact dashboard fields:**

| Field | Source | Display |
|-------|--------|---------|
| 포트폴리오 수 | portfolios.length | e.g. "2개" |
| 보유 종목 수 | sum of position counts | e.g. "8종목" |
| 총 투자금 (비용) | sum of costBasis | e.g. "₩12,450,000" |
| 평가금액 | null — show placeholder | "시세 연동 예정" |
| 수익률 | null — show placeholder | "—" |
| 자산 배분 | allocationByRegion / allocationByAssetClass | mini bar or text (e.g. "국내 60% / 미국 40%") |
| 배당 주기 요약 | not yet available | omit or show "배당 정보 준비 중" |

- Panel title: 내 포트폴리오 요약
- CTA button: 포트폴리오 보기 → navigates to `/portfolio`

**Constraints:**
- Do not label any value as "실시간" or imply live market data.
- 평가금액 and 수익률 are explicitly marked as future placeholders.
- The panel must not require a live KIS call.
- If the API call to load portfolio summary fails, fall back to signed_in_empty state
  with an error note, or show a minimal "포트폴리오 불러오기 실패 — 다시 시도" prompt.

---

### 6. Portfolio state contract

The full type definitions are in `docs/schemas/portfolio_experience_state_contract_v0.1.md`.

Summary of types:

| Type | Purpose | Status |
|------|---------|--------|
| `PortfolioHomeState` | Three-state enum for Home panel | Planned — Phase 3BL |
| `PortfolioPageCoarseState` | Coarse state for Portfolio page UX layer | Planned — Phase 3BM |
| `PortfolioSummary` | Aggregate metrics for dashboard | Partially planned — Phase 3BL/BM |
| `PortfolioRecord` | Single portfolio with UI-only ordering fields | Planned — Phase 3BN |
| `HoldingSummary` | Per-position display row with placeholder valuation | Planned — Phase 3BM |
| `BookmarkTab` | Horizontal tab descriptor with pinned/reorder fields | Planned — Phase 3BN |
| `RefreshIntent` | Enumerated refresh semantics | Planned — Phase 3BM |

**Which fields are required immediately (Phase 3BL/BM):**

- `PortfolioHomeState`: all three states required in Phase 3BL.
- `PortfolioSummary.totalCost`, `portfolioCount`, `holdingCount`: required in Phase 3BL.
- `PortfolioSummary.allocationByRegion`, `allocationByAssetClass`: Phase 3BL optional;
  can be included if computation is simple (it is — from existing position.market and
  position.assetType fields).
- `RefreshIntent.reload_portfolio_data`: required in Phase 3BM.

**Which fields are future placeholders:**

- `PortfolioSummary.totalValue`, `profitAmount`, `profitRate`: placeholder — shown as
  "시세 연동 예정" or "—" until KIS live data is approved.
- `HoldingSummary.currentPrice`, `evaluatedAmount`, `profitAmount`, `profitRate`:
  placeholder until KIS live gate is enabled.
- `PortfolioSummary.allocationByDividendCycle`: requires dividend metadata not yet stored.
- `RefreshIntent.refetch_quote_later`, `sync_backend_later`: future.

---

### 7. Portfolio page redesign plan

#### 7.1 Remove status chips area (Phase 3BM)

Remove `<section class="portfolio-status-bar" id="portfolio-readiness">` entirely.
Remove associated CSS (`.portfolio-status-bar`, `.status-pill`, `.portfolio-status-items`
and all data-state selector variants).

This section's purpose (communicating loading state) is replaced by:
- A neutral loading indicator while auth/data is pending.
- The signed_out lock state (already exists as `#portfolio-lock-state`).
- The ready state showing the bookmark tab bar and dashboard content.

#### 7.2 Page header (Phase 3BM)

New page header structure:

```
┌─────────────────────────────────────────┐
│ 포트폴리오                              │  ← eyebrow
│ 내 투자 포트폴리오          [↻ refresh] │  ← h1 + refresh icon button on right
│ 국내와 미국 주식, ETF를 관리합니다.     │  ← lead
└─────────────────────────────────────────┘
```

- Refresh icon button: positioned at the right end of the h1 row.
- Aria label: "포트폴리오 새로고침"
- Tooltip: "현재 포트폴리오 다시 계산"
- Action: calls `loadPortfolioMvp()` (same as the current `#portfolio-refresh` handler).

#### 7.3 Layout change (Phase 3BM)

Current:
```
┌──────────────┬────────────────────────────┐
│  sidebar     │   portfolio detail         │
│  (portfolios │   (positions list)         │
│  + form)     │                            │
└──────────────┴────────────────────────────┘
```

New (Phase 3BM target):
```
┌──────────────────────────────────────────┐
│  [ 전체 포트폴리오 ] [ 국내계좌 ] [ 해외 ] [ + ]  ← bookmark tabs
├──────────────────────────────────────────┤
│                                          │
│           portfolio dashboard            │
│          (full width, expanded)          │
│                                          │
└──────────────────────────────────────────┘
```

The sidebar (`<aside class="portfolio-sidebar panel">`) is removed as a permanent
structural element. Its contents are redistributed:

- **Portfolio creation form**: moved to a `+` tab action that opens a modal or
  slide-over panel (see section 7.4).
- **Portfolio list**: replaced by bookmark tabs (see section 8).
- **Refresh button**: moved to the page header (see section 7.2).

#### 7.4 Portfolio creation UI (Phase 3BN)

When the user clicks the `+` tab, a portfolio creation panel appears.

Options evaluated:

| Option | Pros | Cons |
|--------|------|------|
| Modal | Standard for creation flows; focuses attention | Requires scroll lock, backdrop |
| Inline panel below tabs | Contextual; no overlay | Pushes content down; complex layout |
| Slide-over (right panel) | Already used for position entry (`position-sheet`); familiar pattern | Extra lateral space |

**Recommendation**: **Modal**. The position entry (adding holdings) uses a slide-over;
portfolio creation (a less frequent action) should use a modal to differentiate the
interaction tier and avoid conflicting with the position slide-over.

The modal contains the same fields as the current inline form: name, baseCurrency.

**Implementation note**: The existing position-sheet slide-over pattern in `portfolio.astro`
(`<div class="position-sheet">`) provides a reference for accessible overlay patterns.
The portfolio creation modal should follow the same accessibility pattern (role="dialog",
aria-modal="true", focus trap, Escape key close).

#### 7.5 Default visible view (Phase 3BM)

When a signed-in user with portfolios opens the Portfolio page, the default view must be
the aggregate portfolio ("전체 포트폴리오" tab). This matches the existing behavior
where `state.selectedPortfolioId` defaults to `aggregatePortfolioId` when portfolios exist.

---

### 8. Bookmark tab UX contract

See also `docs/schemas/portfolio_experience_state_contract_v0.1.md` for the `BookmarkTab` type.

#### 8.1 Tab structure

```
[ 전체 포트폴리오 ] [ 국내계좌 ] [ ‹ 해외주식 › ] [ + 추가 ]
      ↑ pinned-left    ↑ user tabs (reorderable)    ↑ pinned-right
```

- Aggregate tab (`type: 'aggregate'`, `id: '__all_portfolios__'`): always first, cannot move.
- User portfolio tabs (`type: 'portfolio'`): ordered by `state.portfolioOrder`.
- Add tab (`type: 'add'`, `id: '__add_portfolio__'`): always last, cannot move.

#### 8.2 Tab selection

Clicking the aggregate tab selects the aggregate portfolio view (existing `__all_portfolios__` logic).
Clicking a user portfolio tab selects that portfolio and loads its positions.
Clicking the add tab opens the portfolio creation modal (Phase 3BN).

#### 8.3 Hover reorder behavior (desktop)

When hovering over a user portfolio tab:
- The tab label changes to: `‹ {name} ›`
- `‹` (left arrow): move tab one slot to the left.
  - Disabled when the tab is already in position 0 (directly after aggregate tab).
  - Visually: lighter color or `cursor: default`.
- `›` (right arrow): move tab one slot to the right.
  - Disabled when the tab is in the last user-tab position (directly before add tab).
- Clicking either arrow fires the reorder action, not tab selection.
- Tab selection still occurs via clicking the label area between the arrows.

Implementation approach: CSS `:hover` on `.bookmark-tab[data-type="portfolio"]` reveals
`<button class="tab-arrow tab-arrow-left">` and `<button class="tab-arrow tab-arrow-right">`.
The arrows are always present in the DOM but hidden by default, revealed on hover.

#### 8.4 Keyboard accessibility

- All tabs are focusable (`tabindex="0"` or role="tab").
- Arrow keys (`←` / `→`) move focus between tabs (standard tab list pattern).
- `Enter` or `Space` on the label area activates the tab.
- `Enter` or `Space` on an arrow button fires reorder.
- Tab list should use `role="tablist"` / `role="tab"` / `aria-selected` pattern.

#### 8.5 Mobile behavior

Mobile devices lack hover state. Reorder arrows are not visible by default.

**Phase 3BN first implementation**: Long-press (500ms) on a user portfolio tab reveals
reorder mode for that tab (shows inline `‹` and `›` icon buttons). Tapping elsewhere
exits reorder mode.

Alternative approaches (deferred beyond Phase 3BN):
- Touch-drag reorder (complex; skip for now).
- Edit mode toggle button in the tab bar.

#### 8.6 Tab order persistence

First implementation (Phase 3BN): client-side memory only, using the existing
`state.portfolioOrder` array. Order resets on page reload.

Deferred:
- `localStorage` persistence (survives reload; single device).
- Backend persistence (survives devices; requires new API endpoint or column).

Owner decision required: see Section 12.

---

### 9. Refresh button semantics

#### 9.1 Current phase (Phase 3BM)

Refresh = **`reload_portfolio_data`**: re-call `portfolioApi.listPortfolios()` and
`portfolioApi.listPositions()` for the selected portfolio. This is the same action
as the current `loadPortfolioMvp()` function. No network call beyond the existing
Supabase-backed API routes.

The refresh button is moved from the sidebar header to the page header (beside the h1).

#### 9.2 UI

- Icon: circular arrow SVG (already in the existing `#portfolio-refresh` button).
- Aria label: `포트폴리오 새로고침`
- Tooltip: `현재 포트폴리오 다시 계산`
- Loading state: icon spins or button becomes disabled while loading is in progress.

#### 9.3 Not allowed in Phase 3BM

- Live KIS market price fetch.
- External API call of any kind.
- Any call that is not already safe in the current route architecture.

#### 9.4 Future behavior (not approved)

- **`refetch_quote_later`**: After KIS live gate is explicitly approved, the refresh
  button may also trigger a quote update for visible positions. Requires a new API
  endpoint or extension to the valuation route.
- **`sync_backend_later`**: After a backend quote-cache contract exists, refresh may
  sync the portfolio valuation cache.

---

### 10. Data and auth dependency analysis

#### 10.1 Auth detection

Auth is detected entirely client-side via `supabase.auth.getSession()`. SSR has no
session context. The Home portfolio panel and the Portfolio page both require client-side
JS to know the auth state.

A brief loading/skeleton state is unavoidable on both pages while auth resolves.
For the Home panel, the signed_out state is the safe SSR default (requires no data).

#### 10.2 Portfolio presence detection

Portfolio presence requires an authenticated API call to `GET /api/portfolio/portfolios`.
This call is made after auth resolves. It returns:

- An empty array → `signed_in_empty` state.
- A non-empty array → `signed_in_with_portfolio` state.

For the Home panel, this call must complete before state C can render. If the call
fails, the panel should fall back to a neutral error state (showing the signed_out
guide with an optional error note, or a "다시 시도" prompt).

#### 10.3 Portfolio data freshness

As of Phase 3BK, no field in `PortfolioSummary` depends on live market data.
The Home panel's state C (signed_in_with_portfolio) can show:

- `portfolioCount` (from portfolios.length) — exact.
- `holdingCount` (from sum of position counts) — exact.
- `totalCost` (from sum of buyPrice × quantity) — exact (cost basis only).
- `allocationByRegion` (from position.market: 'KR' vs 'US') — exact.
- `allocationByAssetClass` (from position.assetType: 'stock' vs 'etf') — exact.
- `totalValue`, `profitAmount`, `profitRate` — show as placeholder ("시세 연동 예정").

These computed values do not require KIS or any live data source.

#### 10.4 What needs to be implemented later

- Live market price fetch (KIS) → enables `totalValue`, `profitAmount`, `profitRate`.
- Dividend metadata storage → enables `allocationByDividendCycle` and dividend yield.
- Backend persistence for tab order → enables cross-device reorder sync.

#### 10.5 Risk: Home panel inferring portfolio existence too early

If the Home panel's client-side JS shows state C content before the portfolio API
call completes, the user might see incorrect state. Mitigations:
- Show `loading` skeleton until both auth and portfolio API calls resolve.
- Never render a portfolio count or metric until the API response is confirmed.
- If the portfolio API call fails, do not show state C. Fall back to `error` → display
  signed_out guide.

---

### 11. Implementation phase split

#### Phase 3BL — Home Portfolio Status Panel

**Goal**: Replace the Market Coverage aside with a client-side-aware portfolio status panel.

- Create `src/components/HomePortfolioPanel.astro`.
- Implement SSR shell rendering the signed_out guide as default (no auth required).
- Add client-side `<script>` to detect auth state and update panel to signed_in_empty
  or signed_in_with_portfolio.
- For state C: compute PortfolioSummary from loaded positions (cost basis only).
- No live KIS calls. No DB schema change. No new API routes.
- Replace `<aside class="panel market-panel">` in `src/pages/index.astro`.

**Constraint**: If Supabase is not configured, the panel stays in signed_out state.
This is safe — it matches the current Market Coverage card (informational, no auth).

#### Phase 3BM — Portfolio Page Layout Refactor

**Goal**: Remove status chips, expand main dashboard, move refresh to page header.

- Remove `<section class="portfolio-status-bar">` and all associated CSS.
- Add refresh button to the `<header class="page-header">` area, beside the h1.
- Remove `<aside class="portfolio-sidebar panel">` as permanent structure.
- Expand main content area to full width.
- Keep the positions/detail section (`portfolio-detail`) as the main content.
- Keep the existing aggregate/portfolio selection logic; tab UI comes in Phase 3BN.
- Add minimal portfolio selector (compact dropdown or interim list) until Phase 3BN.
- Keep the position sheet slide-over.
- Keep the lock state section.
- Do not change any API routes, data contracts, or CSS variables.

#### Phase 3BN — Portfolio Bookmark Tabs & Reorder UX

**Goal**: Implement the bookmark/tab UI and horizontal reorder behavior.

- Add `.portfolio-tabs` component at the top of the portfolio dashboard.
- Implement aggregate tab (pinned left), user portfolio tabs (movable), add tab (pinned right).
- Implement hover reorder affordance (`‹ {name} ›`) on user tabs.
- Implement click-to-reorder arrow behavior.
- Implement mobile long-press reorder mode.
- Replace interim selector from Phase 3BM.
- Implement portfolio creation modal triggered by + tab.
- Reorder persistence: client-side memory only (existing `state.portfolioOrder` array).

#### Phase 3BO — Portfolio Owner Browser Review

**Goal**: Visual and UX review of Phases 3BL, 3BM, and 3BN combined.

- Owner reviews in browser: Home panel state transitions, Portfolio page layout, tab UX.
- Report issues and confirm before merge.

#### Phase 3BI — /news Paginated List Page (Deferred)

Deferred indefinitely per owner decision. Resume after Phase 3BO if prioritized.

---

### 12. Open decisions for owner

| # | Question | Context | Impact |
|---|----------|---------|--------|
| 1 | Should the Home signed_in_with_portfolio panel use **real saved portfolios** only, or can it temporarily show **sample/mock data** if no portfolios exist yet? | Affects whether state C is reachable without real data during development | If real data required, state C only renders for users with actual portfolios saved |
| 2 | Should the `+` tab open a **modal**, **inline creation panel**, or **slide-over**? | Current recommendation: modal. The position entry uses slide-over, so a modal differentiates portfolio creation. | Affects Phase 3BN implementation approach |
| 3 | Should tab order persistence be **client memory only** (resets on reload), **localStorage** (persists on same device), or wait for **backend persistence**? | Phase 3BN first implementation assumes client memory only | If localStorage is acceptable, it can be added in Phase 3BN with minimal extra work |
| 4 | Should **refresh** initially mean data reload only (re-call `/api/portfolio/*`), or should it immediately also attempt to refresh quotes from KIS when available? | Current recommendation: reload only. Live KIS refresh requires a separate approval. | Affects how the refresh handler is designed in Phase 3BM |
| 5 | Should the Home portfolio summary (state C) show **dividend cycle info**, or keep the summary simpler with only count/cost/allocation fields? | Dividend cycle requires new metadata not yet stored | Affects Phase 3BL scope |
| 6 | Should the Portfolio page support **multiple currencies** (KRW + USD mixed display) immediately in Phase 3BM, or keep **KRW display first** with USD conversion deferred? | A mixed-currency portfolio is already supported by the data model (`baseCurrency: 'KRW' | 'USD'`). FX conversion for display is a separate feature. | Affects Phase 3BM dashboard design complexity |

---

### 13. Non-goals

This phase (Phase 3BK) produces only documentation. The following are non-goals for
all portfolio experience phases unless explicitly added to the phase scope:

- No runtime implementation in Phase 3BK.
- No live KIS market data integration.
- No live GNews calls.
- No database schema changes.
- No Supabase migrations.
- No deployment.
- No `/news` page.
- No actual account deletion, trading, or order management features.
- No portfolio data migration or backup functionality.
- No external analytics, tracking, or ad scripts.

---

### 14. Validation and safety

| Check | Result |
|-------|--------|
| `git diff --check` | PASS — no whitespace issues |
| `git status --short` | Only pre-existing `?? .vscode/settings.json` before this phase |
| Runtime files modified | None (`src/pages/`, `src/components/`, `src/styles/style.css`, API routes, etc.) |
| Live network calls | None |
| External HTTP requests | None |
| `.env` file reads | None |
| Secrets recorded | None |
| Build run | Not performed (documentation-only phase; no runtime changes) |

---

### 15. Recommended next step

**If owner approves the plan as-is**: Proceed to **Phase 3BL — Home Portfolio Status Panel**.
Create `HomePortfolioPanel.astro`, wire it into `index.astro`, implement the three-state
client-side logic, and commit as `feat: add home portfolio status panel`.

**If owner wants more detail first**: A **Phase 3BK-R1 Portfolio Data Source Audit**
can be performed to map the Supabase schema more precisely (table columns, RLS policies,
indexes), which would inform the exact fields available for Phase 3BL's summary computation.

**Deferred**: Phase 3BI (/news paginated list page) — resume after Phase 3BO.

---

### Appendix A: File paths for implementation phases

| Phase | Files to create | Files to modify |
|-------|----------------|-----------------|
| 3BL | `src/components/HomePortfolioPanel.astro` | `src/pages/index.astro`, `src/styles/style.css` |
| 3BM | — | `src/pages/portfolio.astro`, `src/styles/style.css` |
| 3BN | — | `src/pages/portfolio.astro`, `src/styles/style.css` |
| 3BO | — | None (owner review only) |

---

### Appendix B: Related documents

| Document | Path |
|----------|------|
| Portfolio state contract | `docs/schemas/portfolio_experience_state_contract_v0.1.md` |
| Phase 3BJ result (Home Market News polish) | `docs/planning/phase_3bj_home_market_news_owner_review_ui_polish_result_v0.1.md` |
| Phase 3BH result (Home Market News integration) | `docs/planning/phase_3bh_home_market_news_ui_integration_result_v0.1.md` |
| Planning changelog | `docs/planning/planning_changelog.md` |
| GNews news schema | `docs/schemas/gnews_market_news_schema_v0.1.md` |
