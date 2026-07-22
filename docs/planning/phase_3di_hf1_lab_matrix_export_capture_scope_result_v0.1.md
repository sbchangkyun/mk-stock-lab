# Phase 3DI-HF1 — Lab Matrix Image Export Capture Scope Hotfix
## Result v0.1 — 2026-06-27

### Metadata

| Field | Value |
|---|---|
| Phase | 3DI-HF1 |
| Type | Production Hotfix — Lab Matrix Export Capture Scope |
| Status | Deployed |
| Latest prior commit | 9fbe73a feat: add lab matrix image export and deploy home sparklines |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Runtime UI changes | LabReturnMatrix.astro (captureId prop) + Lab detail pages (target ID) |
| API route changes | None |
| DB / Supabase schema changes | None |
| Live KIS calls | None |
| Live GNews calls | None |
| AI provider calls | None |
| External data fetch by Claude Code | None |
| Vercel production deployment | Performed |

---

## Owner Review Finding

Phase 3DI deployed "이미지로 저장" on both Lab detail pages. However, the captured PNG was too
broad — it captured the entire outer `.lab-matrix-export-card` wrapper which included:
- Lab detail page title/header
- Legend chips
- Hover/tap interaction hint copy
- Summary table
- Data policy aside
- Related links section
- Export button itself (partially)

The owner's intent was to export only the core ranking matrix content:
- The matrix table header row (순위, YTD, 2025, 2024, … 2020)
- All 12 ranking rows
- The matrix data note at the bottom

---

## Root Cause

The `data-exportable-card` attribute was on the outer `<div class="lab-matrix-export-card">` in
each Lab detail page. The `exportCardAsPng` utility captures whatever element has
`data-exportable-card` matching the `data-export-target` ID. The outer wrapper captured all
sibling and child elements of the page.

---

## Fix

**Before (Phase 3DI):**
- `data-export-target="lab-asset-matrix-card"` on the button
- `data-exportable-card` on the outer `<div class="lab-matrix-export-card" id="lab-asset-matrix-card">`

**After (Phase 3DI-HF1):**
- `data-export-target="asset-class-returns-matrix-capture"` on the button
- `captureId="asset-class-returns-matrix-capture"` passed as prop to `<LabReturnMatrix>`
- Inside `LabReturnMatrix.astro`: `<div class="lab-matrix-card" id={captureId} data-exportable-card={captureId ? true : undefined}>`
- Outer page wrapper: `data-exportable-card` and old `id` removed — now just `<div class="lab-matrix-export-card">`

The captured element is now the inner `.lab-matrix-card` which contains:
- `.lab-matrix-scroll` → `table.lab-return-matrix` (header row + 12 ranking rows)
- `.lab-matrix-data-note`

The captured element does NOT contain:
- `lab-section-header` (title, description, badge)
- `lab-matrix-legend` (category chips)
- `lab-matrix-interaction-hint`
- `lab-matrix-summary-block`
- Page-level header, data policy, related links, export button

### Files changed

| File | Change |
|---|---|
| `src/components/LabReturnMatrix.astro` | Added `captureId?: string` prop; applied `id` and `data-exportable-card` to `.lab-matrix-card` |
| `src/pages/lab/asset-class-returns.astro` | Updated: passes `captureId="asset-class-returns-matrix-capture"`, button `data-export-target` updated, outer `data-exportable-card` removed |
| `src/pages/lab/sp500-sectors.astro` | Updated: passes `captureId="sp500-sectors-matrix-capture"`, button `data-export-target` updated, outer `data-exportable-card` removed |
| `scripts/check_lab_matrix_image_export_static_contract.mjs` | Updated to verify narrowed capture scope, captureId prop, and no outer data-exportable-card |
| `docs/planning/phase_3di_hf1_lab_matrix_export_capture_scope_result_v0.1.md` | Created (this file) |
| `docs/planning/planning_changelog.md` | Prepended Phase 3DI-HF1 entry |

---

## Capture Boundary Map

```
[Captured by export]
  .lab-matrix-card
    .lab-matrix-scroll
      table.lab-return-matrix
        thead  (순위 / YTD / 2025 / ... / 2020)
        tbody  (12 ranking rows with colored cells)
    .lab-matrix-data-note  ("예시 데이터입니다...")

[NOT captured]
  .lab-section-header     (page heading, description, badge)
  .lab-matrix-legend      (category color chips)
  .lab-matrix-interaction-hint  (hover/tap copy)
  .lab-matrix-summary-block    (summary table)
  .lab-matrix-export-header    (includes camera button)
  .lab-data-policy        (data policy aside)
  .lab-detail-related     (related links)
```

---

## Validation Results

| Check | Result |
|---|---|
| `npm run check:lab-matrix-image-export` | PASS (80/80) |
| `npm run check:lab-return-matrix` | PASS (114/114) |
| `npm run build` | PASS |
| `git diff --check` | PASS |

---

## Owner Production Visual Checklist

### Lab asset page (`/lab/asset-class-returns`)
1. Open `https://mkstocklab.vercel.app/lab/asset-class-returns`.
2. Confirm full page renders — heading, legend, matrix, summary, data policy.
3. Click the camera icon button.
4. Confirm `asset-class-returns-YYYYMMDD.png` downloads.
5. Open the PNG — confirm it shows ONLY the ranking matrix table:
   - Header row: 순위, YTD, 2025, 2024, 2023, 2022, 2021, 2020
   - 12 ranking rows with colored cells
   - Data note at bottom
6. Confirm the PNG does NOT contain the page title/heading.
7. Confirm the PNG does NOT contain legend chips above the matrix.
8. Confirm the PNG does NOT contain the hover/tap hint copy.
9. Confirm the PNG does NOT contain the summary table.
10. Confirm the camera button is NOT visible in the PNG.
11. Confirm desktop hover highlight still works on the matrix.

### Lab sector page (`/lab/sp500-sectors`)
12. Open `https://mkstocklab.vercel.app/lab/sp500-sectors`.
13. Click the camera icon button.
14. Confirm `sp500-sectors-YYYYMMDD.png` downloads.
15. Open the PNG — confirm it shows only the sector ranking matrix table.
16. Confirm same exclusions as asset page (steps 6–10).
