# Phase 3DK — Production Deployment for Mobile UX Hotfixes: Result

## Metadata

| Field | Value |
|-------|-------|
| Phase | 3DK |
| Type | Production Deployment for Mobile UX Hotfixes |
| Status | Deployed |
| Latest reviewed commit before deployment | `8e00cac` |
| Docs commit deployed | see §5 |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Runtime code changes in this phase | None |
| API route changes | None |
| DB / Supabase schema changes | None |
| Live KIS calls | None |
| Live GNews calls | None |
| AI provider calls | None |
| External data fetch by Claude Code | None |
| Vercel production deployment | Performed |

---

## 1. Deployment Content

This production deployment includes:

### Phase 3DJ — Mobile Baseline Usability Pass (`a44a8d0`)
- Removed global `min-width: 1080px` desktop lock on body
- Added baseline responsive breakpoints for header, nav, hero, grids
- Lab matrix: improved mobile tap highlight via pointerdown/pointerup
- All major page grids stack or compress on mobile

### Phase 3DJ-HF1 — Mobile UX Density and Export Consistency Hotfix (`adebaf9`)
- Home feature card grid hidden on mobile (duplicate of nav)
- Header auth buttons compacted on mobile (≤720px)
- Home news cards: summary hidden, title clamped; tighter card padding
- Portfolio: redundant copy removed, 13→9 grouped columns, `$ / ₩` compact symbols, `카테고리` label added to control bar, security names line-clamped
- Lab: duplicate inner header removed from `LabReturnMatrix`; export label text removed
- Export: `exportCardAsPng` uses `scrollWidth` + `data-export-width` attribute; forces inline width during capture with `.is-exporting-image` class; produces desktop-size PNG regardless of mobile viewport

### Phase 3DJ-HF2 — Mobile Snapshot and Portfolio Usability Hotfix (`8e00cac`)
- Home MARKET SNAPSHOT: 2-column at 390px (root cause: `@media max-width: 400px` → `340px`); `minmax(0, 1fr)` prevents sparkline overflow; sparkline SVG shrinks on mobile
- Portfolio: `카테고리` label removed from control bar; `justify-content: flex-end` right-aligns `$ / ₩`
- Portfolio header alignment: `positions-category-header` gets `padding: 0 14px 2px`; grid min-width 740→712px
- Portfolio sort tap area: `data-sort-column` attributes on 비중/금액/수익/배당 cells; full-cell click toggles desc→asc; `▲▼` arrows preserved
- Portfolio KPI summary: `portfolio-kpi-summary` block shows 총 자산 + 총 수익 computed from in-memory state

---

## 2. Owner Review Before Deployment

- Phase 3DJ initially failed owner review ("desktop page squeezed into narrow viewport").
- Phase 3DJ-HF1 addressed density and export but was found to still have Home snapshot and Portfolio issues.
- Phase 3DJ-HF2 resolved all outstanding review items. Owner confirmed local/mobile review passed.
- Owner explicitly approved Phase 3DK production deployment.

---

## 3. Pre-Deployment Validation Results

| Checker | Result |
|---------|--------|
| `check:mobile-snapshot-portfolio` | 49/49 PASS |
| `check:mobile-baseline` | 74/74 PASS |
| `check:mobile-ux-density-export` | 68/68 PASS |
| `check:lab-matrix-image-export` | 80/80 PASS |
| `check:lab-matrix-hover` | 57/57 PASS |
| `check:home-index-sparkline` | 66/66 PASS |
| `check:home-index-cards` | 73/73 PASS |
| `check:market-fixture-chart` | 76/76 PASS |
| `check:production-domain` | 33/33 PASS |
| `npm run build` | PASS (server + postbuild) |
| `git diff --check` | PASS (exit 0) |
| `git status --short` | Only expected untracked files |

---

## 4. Deployment Results

| Field | Value |
|-------|-------|
| Deployment command | `npx vercel deploy --prod --yes` |
| Runtime commit deployed | `8e00cac` (Phase 3DJ-HF2) |
| Docs commit deployed | see git log after docs commit |
| Production URL | `https://mkstocklab.vercel.app` |
| Deployment status | Deployed |
| Vercel deployment ID | see deployment output |

---

## 5. Production Visual Checklist for Owner

### Home (`https://mkstocklab.vercel.app`)
- [ ] Header actions are compact on mobile (smaller buttons, tighter padding)
- [ ] Home top content is shorter and denser on mobile (no feature cards)
- [ ] MARKET SNAPSHOT shows **two columns** at normal mobile width (390px)
- [ ] All 9 snapshot index cards are readable in 2-col layout
- [ ] MARKET NEWS cards are compact (no article summary text on mobile)

### Portfolio (`/portfolio`)
- [ ] Portfolio KPI summary appears (총 자산 + 총 수익 line) after selecting a portfolio
- [ ] `카테고리` visible label is **not** present in the controls bar
- [ ] `$` and `₩` controls remain visible and right-aligned
- [ ] `종목 추가` button is in the upper-right of the portfolio panel header
- [ ] Category column headers align with row content (no horizontal offset)
- [ ] Tapping a sortable column label (비중, 금액, 수익, 배당) toggles sort direction
- [ ] `▲▼` direction arrows remain visible and functional
- [ ] Long security names are clamped to 2 lines

### Lab (`/lab/asset-class-returns`)
- [ ] Mobile tap highlight works (tap a cell to pin highlight)
- [ ] Image export captures only the matrix card (not full page)
- [ ] Exported PNG uses desktop-size output regardless of mobile viewport
- [ ] Repeat on `/lab/sp500-sectors`

### Market (`/market`)
- [ ] Treemap image export produces desktop-size (1200px) PNG
- [ ] Momentum / Trend scatter export produces desktop-size (800px) PNG

### Domain
- [ ] All pages load on `https://mkstocklab.vercel.app`
- [ ] No redirect to `https://mk-stock-lab.vercel.app`

---

## 6. Known Limitations

- This phase deploys mobile UX hotfixes, not a full mobile design-system overhaul.
- Portfolio and Home UX improvements are targeted; some spacing/density decisions may benefit from further design review on very small screens (< 360px).
- Image export consistency fix relies on inline style override during capture; very long content that depends on browser paint may still vary slightly across devices.
- KPI summary shows cost-basis values (not live market values) until live KIS integration is enabled.
- MARKET SNAPSHOT sparklines use fixture data, not live prices.

---

## 7. Recommended Next Phase

**Phase 3DL — KIS + FX Preview Smoke Plan** — if the owner wants to move toward live data integration (real-time prices in portfolio KPI, MARKET SNAPSHOT, and sparklines).

Alternatively: **Phase 3DL — UI Architecture Refactor Plan** — if the owner wants to stabilize the component/design system before adding live data complexity.

Phase 3DK-HF1 is only recommended if this production deployment reveals a deployment-specific issue.
