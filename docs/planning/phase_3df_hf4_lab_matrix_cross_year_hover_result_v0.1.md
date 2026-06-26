# Phase 3DF-HF4 — Lab Matrix Cross-Year Hover Highlight
## Result v0.1 — 2026-06-26

### Metadata

| Field | Value |
|---|---|
| Phase | 3DF-HF4 |
| Type | Lab Matrix Cross-Year Hover Highlight |
| Status | Implemented |
| Latest prior commit | 1b94029 feat: enhance market fixture dashboard |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Runtime UI changes | LabReturnMatrix.astro component only |
| API route changes | None |
| DB / Supabase schema changes | None |
| Live KIS calls | None |
| Live GNews calls | None |
| AI provider calls | None |
| External data fetch by Claude Code | None |
| Vercel production deployment | Not performed in this phase |

---

## Owner Request

When scanning the return matrix on `/lab/asset-class-returns` or `/lab/sp500-sectors`, users have
to visually search the entire table to find where a specific asset/sector appears across different
years. The owner requested that hovering (desktop) or tapping (mobile) a cell should highlight all
same-category cells across all year columns, making year-over-year position tracking effortless.

---

## Implementation Summary

### Files changed

| File | Change |
|---|---|
| `src/components/LabReturnMatrix.astro` | Updated — added data attributes, hint copy, and inline interaction script |
| `src/styles/style.css` | Appended — Phase 3DF-HF4 CSS section with highlight/dim states |
| `scripts/check_lab_matrix_cross_year_hover_static_contract.mjs` | Created — 57-check static contract |
| `package.json` | Added `check:lab-matrix-hover` script |
| `docs/planning/phase_3df_hf4_lab_matrix_cross_year_hover_result_v0.1.md` | Created (this file) |
| `docs/planning/planning_changelog.md` | Prepended Phase 3DF-HF4 entry |

### What was added to LabReturnMatrix.astro

1. **`data-lab-return-matrix-root`** attribute on the `<section>` element — scopes all interaction
   to each matrix instance independently.

2. **`data-lab-category-id`** + **`data-lab-category-chip`** on legend chips (both in the top
   legend bar and in the summary table rows) — allows the script to identify chips by category.

3. **`data-lab-category-id`** + **`data-lab-matrix-cell`** on ranking matrix cells (`<div
   class="lab-return-cell">`) — allows the script to identify cells by category.

4. **Interaction hint copy** below the legend:
   `셀 또는 범례에 마우스를 올리거나 탭하면 같은 항목의 연도별 위치가 강조됩니다.`

5. **Inline `<script>`** with IIFE — all interaction logic, no external imports.

---

## Interaction Behavior

### Desktop hover

1. User moves pointer over any `[data-lab-category-id]` element (cell or chip).
2. Script reads the category ID and calls `applyHighlight(root, categoryId)`.
3. All elements with the same `data-lab-category-id` within the root section receive
   `.is-highlighted`. All others receive `.is-dimmed`.
4. The root section receives `.lab-matrix-has-active` which enables the highlight CSS.
5. When the pointer leaves the root section (`pointerleave`), if no pin is active, all highlights
   clear via `clearHighlight(root)`.
6. While a pin is active, pointer leaving the root re-applies the pinned highlight (not cleared).

### Click / tap fallback (mobile + desktop)

1. User taps or clicks a cell or chip.
2. If the tapped category matches the current pin → pin clears, highlight clears.
3. If the tapped category is different from the pin → pin switches to new category.
4. If no pin was active → pin activates for tapped category.
5. Tapping anywhere inside the root that is NOT a `[data-lab-category-id]` element clears the pin.

### Legend chip interaction

Both the top legend bar chips and the summary table chips carry `data-lab-category-chip` and
`data-lab-category-id`, so they participate fully in both hover and click highlighting. Hovering or
clicking a legend chip triggers the same cross-year highlight as hovering a matrix cell.

### Escape key clear

Pressing `Escape` while the matrix root is in scope clears the pinned state and removes all
highlights. The root's `keydown` listener handles this.

### Per-matrix scoping

Each `[data-lab-return-matrix-root]` section gets its own `setupMatrix()` call with a local
`pinned` and `lastHovered` variable. If the page ever renders multiple matrices, each operates
fully independently.

---

## Safety and Scope

- No data values changed in `labReturnMatrices.json`.
- No Lab route split architecture changed.
- No live data.
- No KIS API calls.
- No GNews API calls.
- No AI provider calls.
- No Supabase calls or imports.
- No DB migrations.
- No new API routes.
- No external HTTP of any kind.
- No deployment performed.
- No `setInterval`, no `setTimeout`, no `localStorage`, no `sessionStorage`.
- No canvas, no charting library.
- No investment advice.

---

## Validation Results

| Check | Result |
|---|---|
| `npm run check:lab-matrix-hover` | PASS (57/57) |
| `npm run check:lab-return-matrix` | PASS (114/114) |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| `git status --short` | Clean (only expected untracked) |

---

## Manual Owner Checklist

### `/lab/asset-class-returns`

1. Open the page.
2. Hover `비트코인` cell in the YTD column.
3. Confirm all other 비트코인 cells across all year columns are highlighted.
4. Confirm non-비트코인 cells are visually dimmed.
5. Confirm the 비트코인 legend chip is also highlighted.
6. Move pointer off the matrix — confirm highlights clear.
7. Click/tap a `금` cell — confirm the gold highlight pins across all years.
8. Click/tap the same `금` cell again — confirm the pin clears.
9. Click/tap a `나스닥100` chip in the legend — confirm nasdq100 cells highlight.
10. Press Escape — confirm the pin clears.

### `/lab/sp500-sectors`

11. Open the page.
12. Hover `IT` or `에너지` sector cell — confirm cross-year highlight works.
13. Confirm no data values have changed.
14. Confirm no matrix layout jumps occur.

### Mobile

15. Tap a matrix cell on mobile — confirm pinned highlight toggles.
16. Tap again to clear — confirm highlight clears.
17. Tap a legend chip — confirm highlight activates.

### General

18. Confirm the interaction hint text is visible below the legend.
19. Confirm no live/current/realtime wording appears.
20. Confirm no investment recommendation wording appears.
21. Confirm no production deployment was performed.

---

## Remaining Limitations

- No real market data (fixture data only).
- No persistent highlight across page navigations.
- No keyboard navigation to each individual cell.
- No export/download functionality.
- No production deployment in this phase.

---

## Recommended Next Phase

**Phase 3DH — Production Deployment for Market and Lab UX Updates**
Deploy Phases 3DG and 3DF-HF4 to the canonical production URL
(`https://mkstocklab.vercel.app`) after the owner confirms local browser review passes.

or

**Phase 3DH — Mobile Baseline Usability Pass**
If the owner wants to address mobile layout fundamentals before adding more features.
