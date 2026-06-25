# Phase 3DF-HF1 — Lab Return Matrix Redesign
## Result Document v0.1 — 2026-06-26

---

### Metadata

- **Phase**: 3DF-HF1
- **Type**: Lab Return Matrix Redesign (hotfix / visual redesign)
- **Status**: Implemented
- **Latest prior commit**: 4f1ee4c feat: add lab static module shells
- **Runtime UI changes**: Lab page only (`src/pages/lab.astro`, `src/components/LabReturnMatrix.astro`)
- **API route changes**: none
- **DB / Supabase schema changes**: none
- **Live KIS calls**: none
- **Live GNews calls**: none
- **AI provider calls**: none
- **External HTTP by Claude Code**: none
- **Vercel Preview calls by Claude Code**: none
- **Deployment**: not performed

---

### Owner Review Finding

Phase 3DF (Lab Static Module Shells) was implemented and committed, but owner review found the design did not match the intended product direction:

- The 4-card module grid felt like a placeholder, not a research tool.
- The `S&P 500 섹터 수익률` and `자산군 수익률` sections showed simple label rows, not a meaningful data visualization.
- The desired reference direction is a **matrix-first, data-dense research visualization** similar to ETF-style research pages.
- Both return matrices should be the primary visual focus, using colored ranking tables showing year-by-year rank changes.

---

### Design Policy

- Reference pages used for **layout intent only** — not for data, values, or branding.
- Did not scrape, copy, or reproduce exact values from any reference page or live data source.
- Did not include ETFSHOPPING.COM branding, watermark, or trade name.
- All fixture data is generated example/static values — clearly labeled as such.
- No current/live/realtime data claim is made anywhere in the page, component, or fixture.

---

### Implementation Summary

| File | Change |
|---|---|
| `src/pages/lab.astro` | Full rewrite — matrix-first layout replacing card grid |
| `src/components/LabReturnMatrix.astro` | New reusable matrix component |
| `src/data/labReturnMatrices.json` | New fixture file with full matrix data |
| `src/styles/style.css` | Added Phase 3DF-HF1 CSS classes (~280 lines) |
| `scripts/check_lab_return_matrix_redesign_static_contract.mjs` | New focused checker (10 groups, 110 checks) |
| `scripts/check_lab_static_module_shells_static_contract.mjs` | Updated to accept matrix-first design |
| `package.json` | Added `check:lab-return-matrix` script |
| `docs/planning/planning_changelog.md` | Phase 3DF-HF1 entry prepended |

#### Old Design Removed

- 2×2 module card grid (`lab-module-grid`, `lab-module-card`) removed as primary UI
- Static preview tables (simple list rows) removed
- Roadmap panel removed
- All four module concepts (국회의원 보유 주식, 국민연금 보유 현황, S&P 500 섹터, 자산군 수익률) preserved — two as matrix sections, two as demoted future module cards

---

### New Page Structure

1. **Page header** — eyebrow `Lab`, h1 `리서치 Lab`, lead copy, `예시 데이터 · 데이터 연동 전` badge
2. **Primary section: 자산군 수익률 비교** — asset-class return matrix (first, appears above sectors)
3. **Secondary section: S&P 500 섹터별 수익률** — sector return matrix
4. **Future modules section** — 국회의원 보유 주식 and 국민연금 보유 현황 as small `연동 예정` cards
5. **Data policy disclaimer** — example-only, no investment advice, no recommendation

---

### Fixture Data Details

**File**: `src/data/labReturnMatrices.json`

#### Asset Matrix (`assetMatrix`)

| Field | Value |
|---|---|
| Categories | 12 (S&P500, 나스닥100, 코스피, 전세계, 신흥국, 리츠, 종합채권, 하이일드채권, 단기국채, 금, 비트코인, 미국외글로벌) |
| Year columns | 7 (YTD + 2025 + 2024 + 2023 + 2022 + 2021 + 2020) |
| Rank rows | 12 |
| Total cells | 84 |
| Summary rows | 12 (one per category) |

All return values are example numbers (e.g., "+52.3%", "-65.2%"). No value claims to be current, official, or sourced from any provider. Each category is ranked once per year (no duplicates per column). 2022 correctly shows most categories with negative returns. Bitcoin volatility is exaggerated to make the example matrix feel illustrative.

#### Sector Matrix (`sectorMatrix`)

| Field | Value |
|---|---|
| Categories | 12 (IT, 통신서비스, 헬스케어, 금융, 산업재, 경기소비재, 필수소비재, 에너지, 소재, 유틸리티, 부동산, S&P 500 benchmark) |
| Year columns | 7 (YTD + 2025 + 2024 + 2023 + 2022 + 2021 + 2020) |
| Rank rows | 12 |
| Total cells | 84 |
| Summary rows | 12 |

All 11 GICS sectors plus the S&P 500 index as a benchmark reference. Energy ranked #1 in 2021 and 2022 — plausible-looking example. Technology ranked last in 2022 — also plausible-looking example.

**Strict data policy** (both matrices):
- No entry claims to be actual historical returns
- Note field in both matrices: "예시 데이터입니다. 실제 수익률이 아니며 데이터 연동 전 화면입니다."
- No `실시간` in any field
- No ETFShopping or other third-party branding
- No buy/sell recommendation anywhere

---

### Matrix UI Details

#### LabReturnMatrix Component (`src/components/LabReturnMatrix.astro`)

- **Section header**: title h2, description, `예시 데이터 · 연동 전` badge
- **Legend chips**: one colored chip per category (uses `lab-matrix-chip` + `lab-return-cell--{id}` color class)
- **Horizontal scroll wrapper**: `div.lab-matrix-scroll` wraps the table — enables horizontal scrolling on narrow viewports without compressing content
- **Table**: `table.lab-return-matrix`, `min-width: 700px`
  - First column: rank (`순위`, `1위`, `2위`, ...) — sticky-left, visually distinct
  - Column headers: year labels (YTD, 2025, ...) — muted background
  - Body cells: `div.lab-return-cell.lab-return-cell--{categoryId}` with two spans:
    - `span.lab-return-cell-label` — category name (10px, bold)
    - `span.lab-return-cell-value` — return value (12px, bold)
- **Matrix data note**: below the table, explains it is example data
- **Summary table**: `table.lab-summary-table`
  - Columns: 구분 / 예시 평균 / 예시 최고 / 예시 최저
  - One row per category
  - Best/worst colored green/red via `.lab-summary-cell--best` / `.lab-summary-cell--worst`

#### Category Color System

Each category has a dedicated CSS custom property set via a class:

```css
.lab-return-cell--{id} { --cell-bg: <color>; --cell-fg: #fff; }
```

Applied to both the cell block and the legend chip. Color assignment:
- **bitcoin** → dark amber (#92400E)
- **nasdaq100** → violet (#5B21B6)
- **sp500** → blue (#1D4ED8)
- **kospi** → cyan (#0E7490)
- **world** → teal (#0F766E)
- **em** → green (#15803D)
- **reits** → orange (#C2410C)
- **bond** → slate (#475569)
- **hiyield** → amber (#B45309)
- **shortgov** → light slate (#64748B)
- **gold** → yellow (#A16207)
- **exus** → indigo (#3730A3)
- **technology** → blue (#1D4ED8) — same shade as sp500 asset
- **communication** → violet (#5B21B6)
- **healthcare** → green (#15803D)
- **financials** → dark blue (#1E40AF)
- **industrials** → cyan (#0E7490)
- **consumer_disc** → orange (#C2410C)
- **consumer_stap** → teal (#0F766E)
- **energy** → dark amber (#92400E)
- **materials** → lime (#3F6212)
- **utilities** → purple (#6B21A8)
- **realestate** → red (#991B1B)
- **spx** → slate (#334155) — benchmark is always neutral

All backgrounds pass WCAG AA contrast ratio ≥4.5:1 against white text.

No JavaScript needed — pure SSR with Astro frontmatter JSON import. Zero client-side script.

---

### Safety and Scope

- No AI provider added (no OpenAI / Anthropic / Gemini)
- No live data claim (no 실시간, no live KIS, no live index data)
- No KIS / GNews / external HTTP
- No Supabase call or import
- No DB migration
- No API route added or modified
- No screenshot capture
- No investment advice (no buy/sell signals, no profit guarantee, no recommendation)
- No Home / Chart AI / MyPage / Portfolio / Market files modified
- No `.env` reads
- No SQL executed
- No setInterval, setTimeout, localStorage, canvas, or charting library

---

### Validation Results

| Validator | Result |
|---|---|
| `npm run check:lab-return-matrix` | PASS (110/110) |
| `npm run check:lab-static-modules` | PASS (82/82) |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| `git status --short` | Clean (only known pre-existing untracked files) |

---

### Manual Owner Checklist

1. Open `/lab`
2. **Matrix-first layout** — no large card grid visible, return matrices are the main content
3. **"자산군 수익률 비교" section appears first** — above S&P 500 sectors
4. **Asset-class legend chips** — 12 colored chips visible (S&P500 blue, 비트코인 dark amber, 금 yellow, etc.)
5. **Asset ranking matrix** — table with year columns (YTD, 2025, 2024...) and rank rows (1위 through 12위)
6. **Colored cells** — each cell shows category name + return value on a category-specific background color
7. **Horizontal scroll** — matrix can be scrolled left/right if viewport is narrow
8. **Asset summary table** — 구분 / 예시 평균 / 예시 최고 / 예시 최저 below asset matrix
9. **"S&P 500 섹터별 수익률" section** — appears below asset matrix
10. **Sector legend chips** — 12 colored chips visible
11. **Sector ranking matrix** — same structure, 11 sectors + S&P 500 benchmark
12. **Sector summary table** — same structure as asset summary
13. **Future modules section** — small cards: 국회의원 보유 주식 / 국민연금 보유 현황 with 연동 예정 badge
14. **Data policy disclaimer** — 예시 데이터, no investment advice wording
15. **No numeric claims** — page header and badges say "예시 데이터 · 데이터 연동 전"
16. **No wording** claiming current/live data, buy/sell recommendation, or third-party source

---

### Remaining Limitations

- Fixture data only — no real historical returns
- No live data ingestion from any source
- No per-category detail pages
- No filtering by year range or category subset
- No sortable columns
- No export or download functionality
- No tabs between asset classes and sectors — single-page linear layout

---

### Recommended Next Phase

**Option A — Phase 3DG: Market Page Fixture Chart Enhancement**
- Improve Market page with a deterministic fixture-based chart or enhanced market snapshot
- High-visibility improvement to the market analytics section
- No live data risk

**Option B — Phase 3DG: KIS + FX Preview Smoke Plan**
- Prepare a controlled document for live KIS credential and FX data smoke steps
- Only when owner is ready to set up credentials and controlled live testing

**Recommendation**: Phase 3DG Market Page Fixture Chart Enhancement if the goal is continued visible UI progress without live data risk.
