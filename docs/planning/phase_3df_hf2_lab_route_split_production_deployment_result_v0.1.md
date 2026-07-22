# Phase 3DF-HF2 — Lab Landing Route Split and Production Deployment
## Result v0.1 — 2026-06-26

### Status: IMPLEMENTED

---

## What changed

Lab was restructured from a single page that rendered everything at `/lab` into a proper
card-gallery landing page plus four distinct detail routes.

### Route structure (after HF2)

| Route                       | File                                    | Content                              |
|-----------------------------|----------------------------------------|--------------------------------------|
| `/lab`                      | `src/pages/lab.astro`                  | Card gallery landing (실험실)         |
| `/lab/asset-class-returns`  | `src/pages/lab/asset-class-returns.astro` | 자산군 수익률 비교 matrix             |
| `/lab/sp500-sectors`        | `src/pages/lab/sp500-sectors.astro`    | S&P 500 섹터별 수익률 matrix          |
| `/lab/congress-stocks`      | `src/pages/lab/congress-stocks.astro`  | 국회의원 보유 주식 (연동 예정 shell)   |
| `/lab/nps-holdings`         | `src/pages/lab/nps-holdings.astro`     | 국민연금 보유 현황 (연동 예정 shell)   |

---

## Landing page (`/lab`)

- Heading: `실험실`, lead copy: `데이터 시각화와 리서치 모듈을 모아 보는 공간.`
- 4 cards arranged in responsive grid (`.lab-card-grid`)
- Each card: visual preview area, eyebrow, badge, title, copy, "열기 →" link
- Matrix cards: CSS-only mini colored cell grid using existing `.lab-return-cell--{id}` color tokens
- Future module cards: placeholder shell with `연동 예정` badge
- No `LabReturnMatrix` component rendered on the landing page
- No data fixture imported on the landing page

---

## Detail pages

### `/lab/asset-class-returns` and `/lab/sp500-sectors`
- Back link to `/lab`
- Detail header with eyebrow, h1, description, `예시 데이터 · 데이터 연동 전` badge
- `LabReturnMatrix` component with full ranking matrix and summary table
- Data policy panel: `lab-data-policy` class, includes `자동화된 투자 권고를 제공하지 않습니다.`
- Related Lab section with 3 links to other Lab pages

### `/lab/congress-stocks` and `/lab/nps-holdings`
- Back link to `/lab`
- `연동 예정` badge in detail header
- Static preview sections: 3 cards each showing planned module structure (no real data)
- Data policy panel with same safe wording
- Related Lab section

---

## New CSS classes added (Phase 3DF-HF2)

Landing: `.lab-landing-shell`, `.lab-card-grid`, `.lab-card`, `.lab-card-preview`,
`.lab-card-preview--matrix`, `.lab-card-preview--future`, `.lab-card-mini-matrix`,
`.lab-card-mini-row`, `.lab-mini-cell`, `.lab-card-meta`, `.lab-card-badge`,
`.lab-card-badge--pending`, `.lab-card-title`, `.lab-card-copy`, `.lab-card-link`,
`.lab-card-preview-shell`, `.lab-card-preview-soon`, `.lab-card-preview-desc`,
`.lab-card-preview-label`

Detail: `.lab-detail-shell`, `.lab-detail-backlink`, `.lab-detail-header`,
`.lab-detail-header-text`, `.lab-detail-badge`, `.lab-detail-badge--pending`

Shared: `.lab-data-policy`, `.lab-detail-related`, `.lab-related-heading`,
`.lab-related-grid`, `.lab-related-card`, `.lab-related-title`, `.lab-related-badge`

Future shells: `.lab-static-preview`, `.lab-static-preview-heading`,
`.lab-static-preview-note`, `.lab-static-preview-grid`, `.lab-static-preview-card`,
`.lab-static-preview-card-desc`, `.lab-static-tag`

---

## Disclaimer wording

All detail pages use the new safe wording: `자동화된 투자 권고를 제공하지 않습니다.`
(replacing the former `특정 종목의 매수 또는 매도를 권고하지 않습니다.`)

---

## Checker results

| Checker                                     | Result  | Checks |
|---------------------------------------------|---------|--------|
| `check:lab-route-split`                     | PASS    | 104/104 |
| `check:lab-return-matrix`                   | PASS    | 114/114 |
| `check:lab-static-modules`                  | PASS    | 82/82  |

---

## Files created / modified

### New
- `src/pages/lab/nps-holdings.astro`
- `scripts/check_lab_route_split_static_contract.mjs`
- `docs/planning/phase_3df_hf2_lab_route_split_production_deployment_result_v0.1.md`

### Modified
- `src/pages/lab.astro` — rewritten as card gallery landing (실험실)
- `src/pages/lab/asset-class-returns.astro` — full rewrite with LabReturnMatrix
- `src/pages/lab/sp500-sectors.astro` — full rewrite with LabReturnMatrix
- `src/pages/lab/congress-stocks.astro` — rewritten as static future shell
- `src/styles/style.css` — ~250 lines of landing/detail CSS appended
- `scripts/check_lab_return_matrix_redesign_static_contract.mjs` — updated for route split
- `scripts/check_lab_static_module_shells_static_contract.mjs` — updated for route split
- `package.json` — added `check:lab-route-split` script

### Not modified
- `src/components/LabReturnMatrix.astro` — unchanged (still used by detail pages)
- `src/data/labReturnMatrices.json` — unchanged
- `src/data/labStaticModules.json` — unchanged
- `src/pages/lab/nps-portfolio.astro` — unchanged (different route, not linked from new structure)

---

## Safety constraints respected

- No KIS, GNews, AI provider, Supabase, or DB calls
- No API routes added
- No setInterval, setTimeout, cron, or polling
- No canvas, charting library, or external images
- No process.env or import.meta.env reads in new pages
- No real NPS or lawmaker holdings data
- All example data labeled explicitly as 예시 데이터
