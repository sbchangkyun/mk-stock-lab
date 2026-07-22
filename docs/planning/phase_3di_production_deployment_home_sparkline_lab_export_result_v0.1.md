# Phase 3DI — Production Deployment: Home Sparkline Update + Lab Matrix Image Export
## Result v0.1 — 2026-06-27

### Metadata

| Field | Value |
|---|---|
| Phase | 3DI |
| Type | Production Deployment — Home Sparkline + Lab Image Export |
| Status | Deployed |
| Latest prior commit before this phase | 9f26a29 feat: add home market snapshot sparklines |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Runtime UI changes | Lab detail pages (image export) only |
| API route changes | None |
| DB / Supabase schema changes | None |
| Live KIS calls | None |
| Live GNews calls | None |
| AI provider calls | None |
| External data fetch by Claude Code | None |
| Vercel production deployment | Performed |

---

## Deployment Content

This deployment brings three items to production:

### 1. Phase 3CB-HF2 — Home MARKET SNAPSHOT Mini Sparkline Cards (already committed)
Commit `9f26a29`: Static SSR SVG sparklines added to all 9 Home MARKET SNAPSHOT cards.
7-point fixture trend arrays; `computePoints()` in Astro frontmatter; no client JS, no chart
library, no canvas. All `예시 데이터` labels preserved.

### 2. Phase 3DH — Market and Lab UX Updates (already in production, no change needed)
Commits `1b94029`, `da2676e`, `fce80aa` — already on production as of Phase 3DH.

### 3. Phase 3DI — Lab Matrix Image Export (new in this phase)
"이미지로 저장" export button added to both Lab detail pages:
- `/lab/asset-class-returns`
- `/lab/sp500-sectors`

---

## Lab Matrix Image Export — Implementation

### Approach

Reuses the existing `exportCardAsPng` + `setupCardImageExport` utility from
`src/lib/exportCardImage.ts` (already used by Market Treemap). No new library, no canvas.

### Per-page structure

Each Lab detail page now has:
1. A `<div class="lab-matrix-export-card" id="lab-*-matrix-card" data-exportable-card>` wrapper
   around the `<LabReturnMatrix>` component.
2. A `.lab-matrix-export-header` row inside the wrapper with:
   - Left: subtitle label (e.g. `자산군 수익률 비교 · 예시 데이터`)
   - Right: `data-card-actions` div containing the `chart-export-button`
3. A `<script>` block importing and calling `setupCardImageExport()`, with `astro:page-load`
   listener for Astro view transitions compatibility.

### Export behavior

- User clicks the camera icon button.
- `setupCardImageExport` from `exportCardImage.ts` handles the click:
  - Button disables (`aria-label` → "이미지 저장 중")
  - `html-to-image` `toBlob` captures the `[data-exportable-card]` element
  - Elements inside `[data-card-actions]` are filtered out (the button itself disappears from export)
  - File downloads as `asset-class-returns-YYYYMMDD.png` or `sp500-sectors-YYYYMMDD.png`
  - Button re-enables after download or error
- Error state: `window.alert('이미지 저장을 완료하지 못했습니다. Chrome에서 다시 시도해 주세요.')`
  (same pattern as Market Treemap)

### Files changed in this phase

| File | Change |
|---|---|
| `src/pages/lab/asset-class-returns.astro` | Added export wrapper, header, button, and script |
| `src/pages/lab/sp500-sectors.astro` | Added export wrapper, header, button, and script |
| `src/styles/style.css` | Appended Phase 3DI export header CSS section |
| `scripts/check_lab_matrix_image_export_static_contract.mjs` | Created — 64-check static contract |
| `package.json` | Added `check:lab-matrix-image-export` script |
| `docs/planning/phase_3di_production_deployment_home_sparkline_lab_export_result_v0.1.md` | Created (this file) |
| `docs/planning/planning_changelog.md` | Prepended Phase 3DI entry |

---

## Validation Results

| Check | Result |
|---|---|
| `npm run check:lab-matrix-image-export` | PASS (64/64) |
| `npm run check:home-index-sparkline` | PASS (66/66) |
| `npm run check:home-index-cards` | PASS (73/73) |
| `npm run check:lab-return-matrix` | PASS (114/114) |
| `npm run check:lab-route-split` | PASS (104/104) |
| `npm run build` | PASS |
| `git diff --check` | PASS |

---

## Deployment Results

| Field | Value |
|---|---|
| Commit deployed | (see git log — Phase 3DI commit) |
| Deployment command | `npx vercel deploy --prod --yes` |
| Production URL | `https://mkstocklab.vercel.app` |
| Deployment status | Ready |

---

## Owner Production Visual Checklist

### Home page (`/`)
1. Open `https://mkstocklab.vercel.app`.
2. Scroll to MARKET SNAPSHOT section.
3. Confirm all 9 cards show compact mini sparklines on the right side.
4. Confirm sparklines: up cards → green, down cards → red, KOSPI → neutral.
5. Confirm no card height overflow and no live/realtime wording.

### Lab asset-class-returns (`/lab/asset-class-returns`)
6. Open `https://mkstocklab.vercel.app/lab/asset-class-returns`.
7. Confirm full matrix renders (ranking rows, year columns, legend).
8. Confirm the camera icon button appears above the matrix.
9. Click "이미지로 저장".
10. Confirm a PNG file named `asset-class-returns-YYYYMMDD.png` downloads.
11. Open the PNG — confirm it contains the matrix content (ranking cells, category chips).
12. Confirm the camera button itself is NOT in the exported image.
13. Confirm desktop hover highlight still works after clicking the export button.

### Lab sp500-sectors (`/lab/sp500-sectors`)
14. Open `https://mkstocklab.vercel.app/lab/sp500-sectors`.
15. Confirm full matrix renders.
16. Confirm the camera icon button appears above the matrix.
17. Click "이미지로 저장".
18. Confirm a PNG file named `sp500-sectors-YYYYMMDD.png` downloads.
19. Open the PNG — confirm it contains the sector matrix content.
20. Confirm the camera button itself is NOT in the exported image.

### Domain verification
21. Confirm site stays on `https://mkstocklab.vercel.app` during all navigation.
22. Confirm no redirect to `mk-stock-lab.vercel.app`.

---

## Known Limitations Carried Forward

- Lab matrix mobile/touch hover highlight does not work (from Phase 3DF-HF4). Non-critical.
  Export on mobile may work via tap but is not fully tested in this phase.
- All Lab matrix data is fixture/example data only — no live market feed.
- No interactive tooltip on sparkline (Home sparklines are static lines).
- No production Supabase Auth URL update — owner must do this manually.

---

## Cleanup Recommendation

If the owner has confirmed `https://mkstocklab.vercel.app` is working after this deployment,
the temporary `mk-stock-lab.vercel.app` Vercel project can be archived or deleted manually
via the Vercel dashboard. Do not perform deletion via Claude Code.

---

## Recommended Next Phase

**Phase 3DJ — Mobile Baseline Usability Pass**
Addresses mobile layout and the known mobile tap highlight limitation in Lab matrices.

or

**Phase 3DJ — KIS + FX Preview Smoke Plan**
If the owner prefers to prioritize live data integration for market data.
