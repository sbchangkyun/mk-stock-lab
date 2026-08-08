# Phase 4E — Portfolio Production Completion — Plan v0.1

**Status: `PHASE_4E_PORTFOLIO_PRODUCTION_COMPLETION_PLAN_READY_IMPLEMENTATION_NOT_STARTED`**

This is a plan-only document. No application code, CSS, script, package.json, migration, or
environment file has been changed to produce this plan. It follows the same navigation-based
production-readiness pattern established by Phases 4A–4D (truthful copy, accessibility, and
responsive-shell correctness only — no provider/business-logic change) applied to `/portfolio`.

---

## 1. Exact baseline SHA

`b3254aa35db76fe264cbb8167f20c47291b87838` (main, merge commit for PR #18, the Phase 4D docs-only
closeout). Verified via `git rev-parse HEAD` after `git fetch origin` + `git checkout main` +
`git pull --ff-only origin main` before branching. Working tree was clean except the standing
Owner-local untracked items (`.agents/`, `.claude/`, `.vscode/settings.json`,
`docs/handoff/codex_state_inspection/`, `set-gnews-vercel-env.ps1`, `skills-lock.json`), none of
which are touched by this or any prior phase.

## 2. Branch

`feature/phase-4e-portfolio-production-completion`, created from the baseline above. This plan
commit lands on this same branch (per established Phase 4D pattern: the plan commit lives on the
eventual implementation branch, and a later commit on the same branch adds the implementation).

## 3. Current product architecture

- **Page**: `src/pages/portfolio.astro` — a single Astro page with an embedded client-side
  TypeScript state machine (`AppState`, `PortfolioState`) driving the whole authenticated CRUD +
  valuation UI. No server-rendered data; everything loads after mount via `portfolioClient.ts`.
- **Client API layer**: `src/lib/portfolioClient.ts` — typed fetch wrapper; every request is
  Bearer-authenticated via `getAuthHeaders()` → `getCurrentSession()`; throws `PortfolioApiError`
  with a sanitized `{status, code, message}` shape on failure.
- **Server CRUD**: `src/lib/server/portfolio.ts` — `listPortfolios/createPortfolio/updatePortfolio
  /deletePortfolio` and `listPositions/createPosition/updatePosition/deletePosition`. Every
  function takes `userId` as an explicit parameter derived server-side from
  `getPortfolioRequestContext(request)` (which calls `validateUserFromBearerToken`); the request
  body is never read for a user/owner id. Position mutations are additionally scoped through
  `ensurePortfolioOwned(userId, portfolioId)` before any write.
- **Server valuation**: `src/lib/server/portfolioValuation.ts` — `buildKrPortfolioValuation` is the
  only valuation function actually wired into a route (`POST /api/portfolio/valuation.ts`). It
  requires `market==='KR' && currency==='KRW'` plus a valid 6-character symbol
  (`classifyPositionSupport`); anything else is marked `unsupported_market` /
  `market_currency_mismatch` / etc. and never receives a live quote. A second function,
  `buildPortfolioValuationFromQuotesWithFx`, contains real cross-currency conversion logic but is
  **dead code** — not imported by any route, referenced only by pre-3GH legacy static checkers.
- **Routes**: `src/pages/api/portfolio/{portfolios,positions,valuation}.ts`. All three resolve auth
  via the same `getPortfolioRequestContext` helper and delegate all field/enum validation to
  `portfolio.ts`. `valuation.ts` additionally enforces `MAX_POSITIONS=50`,
  `MAX_UNIQUE_KR_SYMBOLS=30`, `QUOTE_CONCURRENCY=3` before any quote fetch, and the aggregate path
  (`__all_portfolios__`) fails closed on any single-portfolio load error rather than silently
  degrading.
- **Schema**: `supabase/migrations/20260615_rebuild_schema_v0_1.sql` defines `portfolios`
  (`user_id`, `name`, `base_currency CHECK IN ('KRW','USD')`) and `portfolio_positions`
  (`asset_type CHECK IN ('stock','etf')`, `market CHECK IN ('KR','US')`,
  `currency CHECK IN ('KRW','USD')`), both RLS-enabled with `user_id = auth.uid()` /
  ownership-via-`EXISTS`-subquery policies. The server uses the service-role admin client (RLS is a
  defense-in-depth backstop, not the active enforcement path — enforcement is 100%
  application-code today).
- **Styling**: `src/styles/style.css`, Portfolio-scoped selectors from line ~1120
  (`.portfolio-bookmark-tab*`) and ~2316–2810 (`.positions-list-wrap`, `.position-card`,
  `.position-sheet*`, `.portfolio-sheet*`, `.toast`), plus one page-scoped `<style>` block in
  `portfolio.astro` (`.valuation-stale-badge*`).
- **Precedent pattern to reuse**: Phase 4D's `.lab-matrix-scroll` (accessible horizontal-scroll
  region: `role="region"` + `aria-label` + `tabindex="0"` + `:focus-visible` outline,
  `src/components/LabReturnMatrix.astro:68-72,116-120` + `src/styles/style.css:4927-4931,5896-5905`)
  and Phase 4B's `LiveMarketDashboard.astro` modal (`src/components/LiveMarketDashboard.astro:
  755-838` — the only complete focus-trap/keyboard/focus-restoration lifecycle in the codebase).

## 4. Confirmed findings (CONFIRMED_GAP / PARTIAL_GAP)

| # | Area | Classification | Evidence |
|---|------|-----------------|----------|
| A | ETF truthfulness | **CONFIRMED_GAP** | Backend fully supports `assetType: 'etf'` end-to-end — DB `CHECK (asset_type IN ('stock','etf'))` (`20260615_rebuild_schema_v0_1.sql:56`), server validator `assetTypeValue()` (`server/portfolio.ts:151-155`), client types (`portfolioClient.ts:16,38,62`), and the valuation engine's `classifyPositionSupport` (`portfolioValuation.ts`) never branches on `assetType` — a KR-listed ETF gets identical live valuation to a KR stock. Only the UI form hardcodes `assetType: 'stock'` (`portfolio.astro:1510` submit handler, `:178` hidden input `value="stock"`). |
| B | Currency-display toggle mislabeling | **CONFIRMED_GAP** | `data-display-mode="local"` button is labeled `aria-label="달러 기준"`/`title="달러 기준"` with a `$` glyph (`portfolio.astro:65`), but "local" mode means *"show each position in its own native currency"* (`portfolio.astro:517-521`: for KRW positions this renders `₩...원`, not `$`). For an all-KRW portfolio the "달러 기준" label is actively false. |
| C | `baseCurrency` (KRW/USD) has no observable effect | **CONFIRMED_GAP** | `portfolios.base_currency` is selectable at creation (`portfolio.astro:151`) and stored/validated (`server/portfolio.ts:238,267`), but the only live-wired valuation path (`buildKrPortfolioValuation`) never reads it, and the KPI total is unconditionally rendered via `formatLocalAmount('KRW', totalMarketValue)` (`portfolio.astro:1149,1164`) regardless of `baseCurrency`. Selecting `USD` as base currency currently changes nothing the user can see. The only FX-conversion code (`buildPortfolioValuationFromQuotesWithFx`) is dead/unreachable. |
| D | Dividend columns/sorting | **CONFIRMED_GAP** | Zero dividend fields exist anywhere in the stack: no DB column, no server type, no client type (`grep dividend` across `src/lib` → no matches). `portfolio.astro` nonetheless renders sortable headers "배당률"/"배당주기" with `data-sort="dividend-yield-desc"` etc. (`:114-123`), includes the sort kinds in `state.positionSort`'s type (`:257`) and `PositionSortKind` (`:603`), but `getPositionSortValue()` (`:604-614`) always falls through to `return null` for both — the sort buttons are wired to nothing. The rendered cell is a static placeholder `데이터 대기` (`:1117-1120`). Phase 3GH's own result doc lists dividends as an explicit non-goal of the shipped valuation feature. |
| E | Dynamic status accessibility (partial) | **PARTIAL_GAP** | `#portfolio-lock-state` (`:29`), `#portfolio-list` (`:42`), and `#portfolio-toast` (`:216`, additionally `role="status"`) already carry `aria-live="polite"`. But `#portfolio-readiness` (the initial "포트폴리오 데이터를 불러오는 중입니다." loading copy, `:25-27`) and `#valuation-status-copy` (`:51`) have **no** `role`/`aria-live` at all — a screen-reader user gets no announcement when these dynamic status paragraphs update. |
| F | Dialog focus lifecycle | **PARTIAL_GAP** | Both `#portfolio-sheet` and `#position-sheet` (`portfolio.astro:133,164`) already correctly declare `role="dialog" aria-modal="true" aria-labelledby="..."`, already have working `Escape`-closes behavior (`:1338-1346`), and reduced-motion is already correctly handled for both (`style.css:2713-2719,2804-2810`) — this existing baseline is real and does not need to be rebuilt. What's missing is narrower: no initial-focus-into-panel, no `Tab`/`Shift+Tab` containment, and no focus-restoration-to-opener. `LiveMarketDashboard.astro:755-838` (Phase 4B) has the complete 4-part pattern (`lastFocusedElement` capture, `modalPanel.focus()` on open, wrap-around `Tab`/`Shift+Tab` cycling among focusable descendants, `lastFocusedElement.focus()` on close) — the only such reference in the codebase, directly reusable. |
| G | Portfolio selector (tablist) | **PARTIAL_GAP** | `role="tablist"` on the container (`:42`), `role="tab"` + `aria-selected` correctly toggled per tab button (`:891-892,947-948`), and `.portfolio-bookmark-tab:focus-visible` CSS already exists (`style.css:1160-1164`). But there is no `aria-controls` linking a tab to a `role="tabpanel"`, no associated `role="tabpanel"` element exists at all, and there is no `ArrowLeft`/`ArrowRight`/`Home`/`End` keyboard handling or roving `tabindex` (grep for `ArrowLeft`/`ArrowRight`/`tabIndex` in the file → no matches). The floating edit/delete/reorder buttons (`.portfolio-tab-inline-action`, `.portfolio-tab-reorder-btn`) have no `:focus-visible` styling either. |
| H | Holdings header/row ARIA mismatch | **CONFIRMED_GAP** | The column-header row uses `role="row"` on `.positions-category-grid` and `role="columnheader"` on each `.positions-category-cell` (`:73-123`), which per the ARIA spec requires an ancestor `role="grid"`/`role="table"` and sibling data rows with `role="row"`/`role="gridcell"`. No such ancestor or data-row role exists: `.position-card` items are rendered as plain, role-less `<div>`s (`portfolio.astro:1082`, confirmed no `role=` assignment anywhere in the render path). This is an incomplete/invalid ARIA table pattern, not a merely-incomplete one. |
| I | `.positions-list-wrap` horizontal-scroll accessibility | **CONFIRMED_GAP** | `.positions-list-wrap { overflow-x: auto }` exists (`style.css:2316-2320`) and is protected by `check:mobile-baseline` Group 6/9, but the wrapper carries none of `role="region"`, `aria-label`, or `tabindex="0"` — a keyboard-only user cannot discover or scroll it. This is the exact shape the Phase 4D `.lab-matrix-scroll` pattern was built to solve. `.portfolio-bookmark-tabs` has the same `overflow-x: auto`-without-accessible-region gap. |
| J | Responsive behavior | **PARTIAL_GAP** | General breakpoints exist and are checker-protected (`@media (max-width: 980px)` collapses `.portfolio-mvp` to one column; `@media (max-width: 640px)` stacks `.portfolio-panel-header`/`.portfolio-select`, resizes `.position-sheet-panel`/`.portfolio-sheet-panel` via `min()`, repositions `.toast`). `check:mobile-baseline` is a **static source-pattern checker, not a rendered-viewport test** — it asserts none of the literal 320/360/390/412px widths named in the brief. No regression exists at the breakpoint-category level, but literal narrow-phone rendering (long portfolio/stock names, large KRW numbers, negative returns at 320–412px) has not been checked and should be verified during implementation, not redesigned. |
| K | State-machine content truthfulness | **ALREADY_CORRECT** (see §5) | Cross-referenced here because E's accessibility gap sits on top of K's content, which is itself accurate — see §5. |

## 5. Already-correct findings (ALREADY_CORRECT)

- **Auth/ownership boundary (protected area A)**: Bearer auth resolved server-side only; browser
  never supplies a trusted user/owner id; every position mutation re-verifies ownership through the
  containing portfolio (`ensurePortfolioOwned`) even though the underlying Supabase client is
  service-role (RLS is a correct, matching second line of defense). No defect found.
- **KR/KRW-only live-valuation scope (protected area B)**: `classifyPositionSupport` correctly
  gates on `market==='KR' && currency==='KRW'` plus a 6-digit symbol; `MAX_POSITIONS=50`,
  `MAX_UNIQUE_KR_SYMBOLS=30`, `QUOTE_CONCURRENCY=3` are all present and enforced before any quote
  call, exactly as the Phase 3GH checker (Group 4) requires. No fabricated quote (`currentPrice:
  position.buyPrice`) exists anywhere; unsupported/unavailable rows always render explicit
  placeholder copy, never a fabricated number.
- **11-state `PortfolioState` machine** (`checking → public_config_missing/signed_out → signed_in →
  profile_pending/profile_ready/profile_failed/profile_config_missing → api_pending/
  portfolio_config_missing → ready`, `portfolio.astro:232-243,285+`) has dedicated, honest Korean
  copy for every state with no fixture/fabricated fallback. `ValuationState` (`idle/loading/full/
  partial/unavailable/empty/error`) and `staleState` (`fresh/stale-but-usable/unavailable`) are
  likewise fully enumerated and rendered without fabrication.
- **Reduced-motion handling** for both `.position-sheet*` and `.portfolio-sheet*` is already
  correctly implemented (`style.css:2713-2719,2804-2810`).
- **Basic focus-visible styling** already exists for `.portfolio-bookmark-tab` and
  `.sort-arrow-button` (`style.css:1160-1164,2378-2383`).
- **USD position display honesty**: when a USD position can't yet be shown in KRW, the UI already
  renders explicit "원화 환산 예정" / "FX 연동 후 원화 표시" copy (`portfolio.astro:519,525`) rather
  than fabricating a converted number — this is the correct existing pattern for any new
  currency-related copy this phase adds (see §11).
- **Phase 4A shared-shell constraints**: the shared containment selector list explicitly already
  includes `.portfolio-mvp`; the Phase 4A focus-visible baseline pass covered shell chrome
  (`.nav-link`, `.icon-button`, etc.) but explicitly did **not** cover Portfolio's own interactive
  elements — this phase is expected to add that coverage, not assume it already exists.

## 6. Exact implementation requirements

1. **Asset-type selector (A)**: add a minimal `<select name="assetType">` (or equivalent) to the
   position-creation/edit form offering `주식`/`ETF`, replacing the hardcoded
   `assetType: 'stock'` in the submit handler and the hidden-input default. No new architecture —
   the DB/server/client plumbing already exists; this is a UI-only addition. **Locked decisions**:
   on edit, the selector must initialize from the existing `position.assetType` (never default to
   `stock` on an edit form); editing an ETF position without changing its asset type must persist
   `'etf'` unchanged (no silent normalization back to `'stock'` on save).
2. **Currency-toggle relabeling (B)**: rename the `local` mode's label/`aria-label`/`title` away
   from "달러 기준"/`$` to accurately describe "각 종목의 원래 통화" (native/local currency per
   holding) — exact copy to be finalized during implementation, not fabricated here. Do not remove
   the toggle's function, only its misleading label.
3. **`baseCurrency` truthfulness (C)**: the smallest truthful correction — do not fabricate FX
   conversion. **Locked decisions**: preserve the existing `KRW`/`USD` stored metadata and existing
   USD-`baseCurrency` records exactly as stored — do not silently normalize any existing `USD`
   portfolio to `KRW`; do not add FX conversion logic of any kind. Add explicit, truthful UI copy
   near the base-currency selector and/or the KPI total stating that aggregate valuation is
   computed in KRW today and USD conversion is not yet supported (mirroring the existing "원화 환산
   예정" honesty pattern). This is a copy-only correction — the `USD` option and any existing `USD`
   record must remain selectable/intact, never hidden or force-converted.
4. **Dividend columns (D)**: remove the non-functional sort affordance from the 배당률/배당주기
   headers (drop `role="columnheader"` sort-button wiring / `data-sort-column` for those two
   columns only) while keeping the columns present with an explicit "not yet available" static
   label — no dividend provider, no new field.
5. **Status-region accessibility (E)**: add `role="status" aria-live="polite" aria-atomic="true"`
   to `#portfolio-readiness` and `#valuation-status-copy`, matching the existing
   `#portfolio-lock-state`/`#portfolio-toast` pattern. Verify no duplicate/overlapping
   announcements result (e.g., toast + status region firing for the same event).
6. **Dialog focus lifecycle (F)**: implement the `LiveMarketDashboard.astro:755-838` four-part
   pattern (opener capture, initial focus into panel, `Tab`/`Shift+Tab` containment, focus
   restoration on close) for both `#portfolio-sheet` and `#position-sheet`, layered on top of — not
   replacing — the existing `role="dialog"`/`aria-modal`/`aria-labelledby`/`Escape`-close/
   reduced-motion behavior, which is already correct and must not regress. The `Tab`/`Shift+Tab`
   wrap-around decision (which focusable index to move to next) must be implemented as a small,
   pure, unit-testable function — see §13's locked smoke-target decision — rather than inlined
   ad hoc DOM-walking logic.
7. **Tablist completion (G)**: add `role="tabpanel"` to the associated content region and
   `aria-controls`/`id` linking; implement `ArrowLeft`/`ArrowRight` (and `Home`/`End`) keyboard
   navigation with roving `tabindex` across the tab buttons; add `:focus-visible` styling to the
   floating edit/delete/reorder buttons. Chosen architecture: **finish correct tab semantics**
   (option 1) — basic roles already exist, so completing them is the minimal path, not replacing
   them. **Locked decisions**: the selected tab carries `tabindex="0"` and every unselected tab
   carries `tabindex="-1"` (standard roving-tabindex, not all-tabbable); `ArrowLeft`/`ArrowRight`
   move focus between tab buttons with wrap-around, `Home`/`End` jump to the first/last tab;
   **automatic activation** (moving focus also activates/selects the tab) is acceptable and
   preferred over manual activation, matching the simplest correct ARIA Authoring Practices
   pattern; each tab button has a stable, unique `id` and an `aria-controls` pointing at the one
   shared `tabpanel` element; the `tabpanel` carries `role="tabpanel"` and its `aria-labelledby` is
   updated to reference whichever tab is currently selected; arrow-key navigation must target the
   tab buttons only — it must never move focus onto the inline edit/delete/reorder action buttons
   that float over/beside a tab. The `ArrowLeft`/`ArrowRight`/`Home`/`End` → next-index computation
   must be implemented as the same kind of small, pure, unit-testable function used for item 6's
   focus-trap wrap-around (see §13).
8. **Holdings header semantics (H)**: remove the invalid `role="row"`/`role="columnheader"` pairing
   (no minimal way to make it valid without a full `role="grid"`/`role="table"` + matching
   `role="row"`/`role="gridcell"` redesign of the card layout, which is explicitly out of scope).
   Replace with a semantically honest non-table pattern — e.g., plain header labels plus the
   already-present `aria-label="~ 기준 정렬"` on each sort button, which already conveys sort
   affordance without a table role. Exact markup finalized during implementation.
9. **Scroll-region accessibility (I)**: apply the exact `lab-matrix-scroll` pattern to
   `.positions-list-wrap` — `role="region"`, `aria-label` (e.g. "보유 종목 목록, 좌우로 스크롤
   가능"), `tabindex="0"` on the wrapper, plus a matching `.positions-list-wrap:focus-visible`
   CSS rule (light + `body.dark-mode`) mirroring `style.css:5896-5905`.
10. **Responsive verification (J)**: verify (not redesign) rendering at 320/360/390/412/768/1024px
    for long names, large KRW/USD numbers, negative returns, and the sheets/dialogs; fix only
    concrete overflow/clipping defects found, without touching the checker-protected breakpoint
    structure.

## 7. Exact intended file scope (implementation phase)

- `src/pages/portfolio.astro` (markup + embedded client script — all 9 numbered items above)
- `src/styles/style.css` (Portfolio-scoped selectors only: `.positions-list-wrap`,
  `.portfolio-bookmark-tab*`/`.position-name-link` focus-visible additions, new `:focus-visible`
  rules, no change to any non-Portfolio selector. **Locked decision**: any new rule must be scoped
  to a Portfolio-specific selector or ancestor (e.g. `.portfolio-mvp .segmented-control button`),
  never a bare `.segmented-control button` rule — `.segmented-control` is a generic class name and
  must be verified during implementation for use outside `/portfolio` before any global rule is
  added; if it is shared, the new focus style must be scoped under a Portfolio-specific ancestor).
- New small pure module for the keyboard-navigation index math needed by items 6 and 7 (dialog
  Tab-trap wrap-around, tablist Arrow/Home/End roving-tabindex) — e.g.
  `src/lib/portfolio/portfolioKeyboardNav.ts` — following the existing codebase convention of
  extracting pure, DOM-free calculation functions (`exportStatusMessage` in `exportCardImage.ts`,
  `classifyPositionSupport` in `portfolioValuation.ts`) rather than leaving the logic as inline,
  untestable DOM-event-handler code. See §13.
- New phase-specific test scripts: `scripts/smoke_phase_4e_portfolio_production_completion.mjs`,
  `scripts/check_phase_4e_portfolio_production_completion_contract.mjs`
- `package.json` (two new script entries only, following the exact existing naming convention)
- Planning docs updated at implementation-close time (result doc, roadmap, changelog) — already
  partially covered by this plan-phase commit for the plan doc itself

No other file is expected to change. `src/lib/portfolioClient.ts`, `src/lib/server/portfolio.ts`,
`src/lib/server/portfolioValuation.ts`, and all Supabase migrations are audit-only inputs, not
edit targets, unless implementation discovers a concrete defect (see §8, §12).

## 8. Explicit non-goals

- No trading, order placement, or brokerage account surface of any kind.
- No new KIS account API, no `KIS_ACCOUNT_NO` usage.
- No OpenAI/Gemini/LLM integration.
- No new US-market quote provider; US/global live valuation stays out of scope.
- No FX provider or live/mocked currency-conversion logic added or re-activated
  (`buildPortfolioValuationFromQuotesWithFx` stays dead code).
- No dividend-data provider of any kind.
- No new Supabase schema, table, column, or migration — unless a concrete security defect is
  found and reported separately (none was found; see §12).
- No new secrets or environment variables.
- No new npm dependency without exceptional, explicitly justified need (none anticipated).
- No redesign of the responsive card/grid layout into a literal desktop HTML table.
- No new UI framework or component library.
- No weakening of the Phase 3GH checker (`check:phase-3gh-portfolio-live-valuation-mvp`) or its
  protected constants (`MAX_POSITIONS=50`, `MAX_UNIQUE_KR_SYMBOLS=30`, `QUOTE_CONCURRENCY=3`).

## 9. Accessibility requirements

- `role="status"`/`aria-live="polite"`/`aria-atomic="true"` on `#portfolio-readiness` and
  `#valuation-status-copy` (§6.5), without duplicating announcements already made by
  `#portfolio-toast`.
- Full focus-trap lifecycle (initial focus, `Tab`/`Shift+Tab` containment, `Escape`-close, focus
  restoration to opener) for `#portfolio-sheet` and `#position-sheet` (§6.6), reusing the
  `LiveMarketDashboard.astro` pattern.
- Complete ARIA tab pattern for the portfolio selector: `role="tablist"`/`role="tab"`/
  `aria-selected` (already present) plus `role="tabpanel"`/`aria-controls` and
  `ArrowLeft`/`ArrowRight`/`Home`/`End` roving-tabindex keyboard navigation (§6.7).
  `:focus-visible` added to all currently-unstyled interactive Portfolio elements identified in the
  CSS audit (segmented-control buttons, `.position-name-link`, `.portfolio-tab-inline-action`,
  `.portfolio-tab-reorder-btn`, sheet close/danger buttons) — each rule scoped per §7's locked CSS
  decision (a Portfolio-specific selector/ancestor, never a bare global class rule if that class is
  shared outside `/portfolio`).
- Valid ARIA structure for the holdings list/header (§6.8) — no `role="columnheader"` without a
  matching table/grid ancestor and matching data-row roles.
- Accessible horizontal-scroll region on `.positions-list-wrap` (§6.9): `role="region"` +
  `aria-label` + `tabindex="0"` + visible focus outline, matching `.lab-matrix-scroll`.
- Touch targets on all newly-touched interactive elements held to the existing 44px shell baseline
  established in Phase 4A/4B.

## 10. Responsive requirements

- No new document-level horizontal overflow introduced by any change.
- Verify (not redesign) 320/360/390/412/768/1024/desktop rendering of: portfolio tab row, KPI
  summary, currency toggle, holdings header + cards (long names/tickers, large KRW/USD numbers,
  negative returns), sort controls, action buttons, both sheets/dialogs, and the toast.
- Preserve every existing checker-protected CSS pattern (`check:mobile-baseline` Groups 6 and 9):
  `.positions-list-wrap`/`.portfolio-bookmark-tabs` `overflow-x: auto`, `.position-sheet-panel`/
  `.portfolio-sheet-panel` `min()` widths, `.portfolio-panel-header`/`.form-grid` stacking at
  their existing breakpoints.

## 11. Truthfulness requirements

- No UI control may imply working functionality that does not exist (dividend sort, `USD` base
  currency, ETF entry) without either (a) completing the already-existing backend wiring (ETF —
  confirmed available) or (b) correcting/removing the misleading affordance (dividends — confirmed
  unavailable; `baseCurrency` — confirmed inert).
- Any new copy describing a partial/unavailable state must follow the existing honest pattern
  already used elsewhere on this page ("원화 환산 예정", "데이터 대기", "평가 불가", "지원 종목
  기준 총 자산") — explicit, specific, and never a silent fallback number.
- No fixture, sample, or hardcoded value may be introduced to make a control appear functional.

## 12. Protected auth/ownership/provider boundaries

- Bearer-token server-side auth resolution (`getPortfolioRequestContext` /
  `validateUserFromBearerToken`) must not change.
- `ensurePortfolioOwned` ownership scoping on every position mutation must not change.
- RLS policies on `portfolios`/`portfolio_positions` must not change (no migration in this phase
  unless a concrete defect is found — audit found none: ownership enforcement is correctly
  layered at both the application-code level, service-role client and RLS backstop).
- `MAX_POSITIONS=50`, `MAX_UNIQUE_KR_SYMBOLS=30`, `QUOTE_CONCURRENCY=3` in
  `src/pages/api/portfolio/valuation.ts` must remain exactly as-is (Phase 3GH checker Group 4).
- KR/KRW-only live-valuation scope (`classifyPositionSupport`) must not be broadened to US/USD in
  this phase.
- The aggregate fail-closed behavior (`loadAggregateRecords`) must not regress to a silent
  `if (!ok) return []` pattern (Phase 3GH-HF1 checker Group 13).

## 13. Automated test strategy

- New `scripts/check_phase_4e_portfolio_production_completion_contract.mjs` (static
  regex/string-pattern checker, no network — following the exact established pattern of
  `check_phase_4d_lab_production_completion_contract.mjs`/`check_phase_3gh_..._contract.mjs`):
  assert presence of the asset-type selector, corrected currency-toggle labels, removed
  dividend-sort wiring (headers remain, sort handlers for those two keys removed), the new
  `role="status"`/`aria-live` attributes, the focus-trap lifecycle functions (opener capture, Tab
  containment, restoration), `role="tabpanel"`/`aria-controls`/arrow-key handling, the corrected
  holdings-header roles, and the `lab-matrix-scroll`-equivalent markup + CSS on
  `.positions-list-wrap`. Also assert absence of any new provider/schema/env/dependency reference
  (mirroring Phase 4D checker's safety-boundary group).
- **Locked decision: both commands ship.** `npm run smoke:phase-4e-portfolio-production-completion`
  and `npm run check:phase-4e-portfolio-production-completion` are both required deliverables of
  this phase, resolving any earlier ambiguity between §7 and this section.
  - New `src/lib/portfolio/portfolioKeyboardNav.ts` extracts the two pure, DOM-free index-computation
    functions that the dialog focus-trap (item F) and tablist roving-tabindex (item G) requirements
    already need as their logic core — following the established codebase precedent of extracting
    small deterministic calculation functions out of DOM-event-handler code specifically so they are
    unit-testable (e.g. `exportStatusMessage` in `exportCardImage.ts`, `classifyPositionSupport` in
    `portfolioValuation.ts`). This is not architecture invented solely to satisfy a test: the
    functions must exist regardless to implement F/G correctly; extracting them into a pure module
    only makes them callable from a smoke script instead of requiring a DOM harness.
  - `scripts/smoke_phase_4e_portfolio_production_completion.mjs` imports
    `portfolioKeyboardNav.ts` directly and asserts real behavior with concrete inputs: dialog
    Tab-trap wrap-around (first focusable → Shift+Tab → last focusable; last focusable → Tab → first
    focusable; a single-focusable-element dialog stays on that element) and tablist Home/End/
    ArrowLeft/ArrowRight roving-tabindex (wrap-around at both ends, correct next-index for a
    3-to-5-tab list, no movement when the list has exactly one tab). This is meaningful,
    non-duplicative coverage of new deterministic logic, not a placeholder.
  - **Fallback governed by the Owner's instruction:** if, once implementation specifics are
    finalized, no such pure function ends up existing (e.g. the accepted implementation approach
    turns out to require no extractable pure logic at all), do not invent an artificial one to
    satisfy this section — stop and report that no meaningful smoke target exists rather than
    shipping a dummy/empty-PASS script. The current plan's approach above already identifies a real,
    non-artificial target, so this fallback is not expected to trigger.
- Full regression gate before commit: `npm run check:phase-3gh-portfolio-live-valuation-mvp`,
  `npm run smoke:phase-3gh-portfolio-live-valuation-mvp`, `npm run check:mobile-baseline`,
  `npm run check:phase-4a-home-common-shell`, `npm run check:phase-4b-market-production-completion`,
  `npm run check:phase-4c-chart-ai-production-completion`,
  `npm run check:phase-4d-lab-production-completion`, `npm run check:project-lightweight-roadmap`,
  `npm run build`, `git diff --check`.

## 14. Pre-existing checker risks

- `check:portfolio-owner-review-prep`, `check:portfolio-ticker-display-name`,
  `check:portfolio-layout` are **already, deliberately failing** (Phase 3GH result doc §3.1,
  asserting a retired fixture/preview UI contract) — any continued failure from these three during
  Phase 4E is pre-existing and must not be "fixed" by editing them to match new markup; they should
  be left exactly as the Phase 3GH precedent left them.
- `check:mobile-baseline` Group 9 hard-asserts several exact selector/property strings
  (`.positions-list-wrap { overflow-x: auto }`, `.position-sheet-panel`/`.portfolio-sheet-panel`
  `min()`, `.portfolio-panel-header`/`.form-grid` stacking) — implementation must preserve these
  exact patterns even while adding new attributes/roles around them.
- `check:portfolio-bookmark-tabs`, `check:portfolio-create-sheet`, `check:portfolio-holdings-header`
  may assert markup shapes that change once the ARIA/keyboard work lands — each must be read and,
  if genuinely superseded by a truthful improvement (not weakened), reconciled the same way Phase
  4D reconciled its 8 sibling checkers: adjusted narrowly, never gutted.
- `check:home-portfolio-panel` may assert Home-page copy referencing Portfolio's live-valuation
  scope — must remain consistent with any copy correction made under item C.

## 15. Build/environment risk

- No new dependency, so `npm ls` risk is minimal.
- `astro build` risk is limited to any TypeScript type surface change from the new asset-type
  selector or focus-trap helper functions — must be verified with a full build before commit.
- No environment variable or Vercel project-setting change of any kind.
- No Supabase migration in this phase — zero DB-apply risk.
- **Known local Windows/Node build-crash signature.** Phase 4D previously observed `npm run build`
  exit with Windows code `-1073740791` (`STATUS_STACK_BUFFER_OVERRUN`). At the time, the identical
  failure was reproduced on the untouched baseline (before any Phase 4D change was applied),
  proving it was a pre-existing local Windows/Node/toolchain condition, not a Phase 4D regression.
  If the same signature recurs during Phase 4E:
  1. Do not immediately classify it as a Phase 4E regression.
  2. Perform the same narrow isolation used in Phase 4D: `git stash` (or an equivalent clean
     checkout) of only the tracked files this phase changed, rebuild the baseline in isolation, and
     confirm whether the crash reproduces with zero Phase 4E changes present.
  3. Never touch, move, or delete Owner-local untracked files (`.agents/`, `.claude/`,
     `.vscode/settings.json`, `docs/handoff/codex_state_inspection/`, `set-gnews-vercel-env.ps1`,
     `skills-lock.json`) while isolating — the isolation is tracked-file-only.
  4. If the baseline reproduces the crash, record this limitation honestly in the result doc (local
     Windows build inconclusive; pre-existing, not phase-caused) and treat the exact-Head Vercel
     Linux Preview build reaching `READY` (§16) as the authoritative release-build gate instead of
     the local Windows build.

## 16. Preview validation plan

- Push the implementation branch, open the PR, and confirm the **exact final PR Head commit**
  receives its own Vercel Preview deployment and that deployment reaches `READY`. If the PR gains
  additional commits after a Preview is checked, re-verify against the new Head's deployment — an
  earlier commit's `READY` Preview does not satisfy this requirement for a later Head.
- Do not create a Deployment Protection bypass link or a share URL to work around SSO. If the
  Preview is behind Vercel Deployment Protection (SSO) and that blocks route-level access to
  `/portfolio` from this environment, **record the outcome honestly as `SSO_BLOCKED`** — do not
  attempt a bypass and do not claim signed-out UI/content was verified when SSO prevented the
  request from ever reaching application routing (an SSO-wall response is not evidence about
  `/portfolio`'s own behavior).
- Where route-level access is not blocked, unauthenticated verification only (this assistant has no
  authenticated browser session): confirm `/portfolio` still renders the signed-out lock state
  correctly, no console errors, no unexpected network calls pre-login (mirrors the Phase 4C/4D
  Preview-verification pattern).
- Authenticated CRUD/dialog/tab/scroll-region interaction verification — and any route-level
  authenticated interaction that SSO blocks from this environment regardless — is explicitly
  deferred to Phase 4F (§19), not worked around here.

## 17. Production post-merge plan

- After Owner merge, independently verify the resulting Vercel Production deployment reaches
  `READY` at the merge SHA (GitHub commit-status + Deployments API cross-check, the same method
  used for Phases 4B/4C/4D — no Vercel API/CLI/dashboard access in this environment).
- Run the same bounded unauthenticated HTTP/HTML sweep pattern used in the Phase 4D closeout
  (`/portfolio` reachability, key copy strings present, no fabricated-data strings present).

## 18. Vercel automatic Production-trigger verification

- **Recurrence test result: PASS / CLOSED.** The Phase 4D closeout recorded a release-trigger
  anomaly (automatic deploy did not fire after PR #17's merge) and left recurrence `UNDETERMINED`
  pending "the next `main` merge." **PR #18** (merge SHA
  `b3254aa35db76fe264cbb8167f20c47291b87838`) was that next merge, and it is the recurrence test:
  the automatic Vercel Production deployment `dpl_D8TEboHCAD5S1uky3Yf6mXoJjUK3` (`target:
  production`, `state: READY`, `githubCommitRef: main`, `githubCommitSha:
  b3254aa35db76fe264cbb8167f20c47291b87838`) fired on its own within seconds of the `main` push —
  no Create Deployment/Redeploy or any other manual intervention. One miss out of two observed
  merges, with the very next merge deploying automatically and cleanly, is evidence of a **one-off
  incident**, not a recurring integration fault. The recurrence question opened by the Phase 4D
  closeout is answered and closed.
- **Phase 4E post-merge implication.** Phase 4E's own merge is an ordinary post-merge verification,
  not a second recurrence test: after the Owner merges the Phase 4E implementation PR, still
  independently verify (per §17) that the automatic Vercel Production deployment fires and reaches
  `READY` at the exact merge SHA — this is standard release verification for every phase in this
  lane, not special monitoring carried over from the closed PR #17 anomaly. If an automatic
  deployment failure is observed at that point, it would be a *new, separate* incident to
  investigate on its own merits (three misses across three-plus observed merges would itself
  warrant re-opening the recurrence question) — it must not be assumed related to the already-closed
  PR #17 anomaly.

## 19. Phase 4F deferred Owner QA boundary

- Authenticated click-through QA of `/portfolio` — real login, real dialog open/close/focus-trap
  behavior, real keyboard tab-navigation through the portfolio selector, real touch/mobile
  interaction — remains `OWNER_QA_PENDING` under the standing cross-page Phase 4F closeout,
  consistent with every phase in the 4A–4E lane. This plan's own Preview/Production verification
  (§16–17) is bounded to unauthenticated HTTP/HTML-level checks and does not discharge it.

## 20. Rollback criteria

- If the implementation phase's automated checker/smoke suite cannot reach green without weakening
  a protected boundary (§12) or an existing sibling checker beyond narrow, evidence-based
  reconciliation (§14), stop and report rather than force a pass.
- If any change is found during implementation to require touching
  `buildPortfolioValuationFromQuotesWithFx`, live FX, or any dividend/US-valuation logic to satisfy
  a truthfulness fix, stop — that would violate §8's non-goals — and instead choose the
  copy/UI-only correction path.
- If the Preview deployment shows any authenticated-path console error or unexpected network call
  introduced by this phase's changes (detectable even without login, e.g. via a signed-out smoke
  pass), do not open the PR for merge until root-caused and fixed.
- The §18 recurrence test is closed (PASS); this is no longer "a second time." If Phase 4E's own
  post-merge automatic Vercel Production deployment fails to trigger, treat it as a new, separate
  incident: halt further Portfolio-phase work and escalate the platform/integration issue before
  proceeding to any subsequent phase, and note in the result doc whether this is the second observed
  miss overall (which would warrant re-opening the recurrence question per §18).
