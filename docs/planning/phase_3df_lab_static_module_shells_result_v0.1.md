# Phase 3DF — Lab Static Module Shells
## Result Document v0.1 — 2026-06-26

---

### Metadata

- **Phase**: 3DF
- **Type**: Lab Static Module Shells
- **Status**: Implemented
- **Latest prior commit**: 7dc5624 feat: enhance chart ai ux skeleton
- **Runtime UI changes**: Lab page only (`src/pages/lab.astro`)
- **API route changes**: none
- **DB / Supabase schema changes**: none
- **Live KIS calls**: none
- **Live GNews calls**: none
- **AI provider calls**: none
- **External HTTP by Claude Code**: none
- **Vercel Preview calls by Claude Code**: none
- **Deployment**: not performed

---

### Product Reason

The Lab page was a thin 4-card grid linking to sub-pages that don't exist yet. Users clicking into Lab saw an empty skeleton with no real content or sense of what the feature would deliver.

A static research hub shell:
- Makes Lab feel like a credible, intentional research section
- Shows exactly what each module will cover before live data is wired up
- Uses only local fixture data — zero server load, zero external API dependency
- Sets clear expectations: all values are examples, not live market data

---

### Implementation Summary

#### Changes Made

| File | Change |
|---|---|
| `src/pages/lab.astro` | Full rewrite — research hub layout with 4 module cards, preview tables, roadmap, disclaimer |
| `src/data/labStaticModules.json` | New fixture file (modules, sectorSamples, assetSamples) |
| `src/styles/style.css` | Added Phase 3DF CSS classes (~100 lines) |
| `scripts/check_lab_static_module_shells_static_contract.mjs` | New focused checker (11 groups, 82 checks) |
| `package.json` | Added `check:lab-static-modules` script |
| `docs/planning/planning_changelog.md` | Phase 3DF entry prepended |

#### Previous Lab Page Removed

The old lab.astro rendered a `grid-4` of `route-card` elements linking to `/lab/congress-stocks`, `/lab/nps-portfolio`, `/lab/sp500-sectors`, `/lab/asset-class-returns` — sub-pages that do not exist. These routes have been replaced by the new self-contained research hub layout.

#### New Page Structure

1. **Page header** — eyebrow `Lab`, h1 `리서치 Lab`, lead explaining staged research module approach
2. **Research module grid** (2×2) — four module cards, each with category eyebrow, status badge, title, description, scope label, and feature preview tags
3. **Static preview section** — two-column preview tables: S&P 500 sector rows (Technology, Healthcare, Financials, Industrials, Consumer Discretionary) and asset-class rows (US Equities, Korean Equities, Bonds, Gold, USD/KRW)
4. **Roadmap / connection plan panel** — four bullet items naming the expected data sources per module
5. **Disclaimer / data policy** — four-item list covering example-only data, investment decision warning, no recommendation, future real data commitment

No client-side JavaScript added — pure SSR with Astro frontmatter JSON import.

---

### Module List

| Module ID | Title | Status Label |
|---|---|---|
| `congress-stocks` | 국회의원 보유 주식 | 정적 모듈 준비 |
| `nps-holdings` | 국민연금 보유 현황 | 리서치 모듈 |
| `sp500-sectors` | S&P 500 섹터 | 예시 데이터 |
| `asset-class-returns` | 자산군 수익률 | 예시 데이터 |

Each module card shows:
- Category eyebrow (공시 기반 리서치 / 기관 투자자 리서치 / 미국 시장 리서치 / 자산 배분 리서치)
- Status badge (정적 모듈 준비 / 리서치 모듈 / 예시 데이터)
- Title
- Description
- Scope label (데이터 연동 전 화면 / 연동 예정)
- Preview tag pills (feature areas of the module)

---

### Fixture / Static Data

**File**: `src/data/labStaticModules.json`

**Strict data policy**:
- All `sectorSamples` and `assetSamples` entries have `"note": "정적 표시값"` — no numeric values, no real percentages
- `sampleWeight` and `sampleReturn` fields show `예시 비중` / `예시 수익률` as placeholders, not numbers
- No entry claims actual NPS holdings, lawmaker holdings, current index weights, or current returns
- No `실시간` in any field

**Sector samples** (S&P 500 섹터 preview):
Technology, Healthcare, Financials, Industrials, Consumer Discretionary

**Asset samples** (자산군 수익률 preview):
US Equities, Korean Equities (KOSPI), Bonds, Gold, USD/KRW

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
- No setInterval or polling

---

### Validation Results

| Validator | Result |
|---|---|
| `npm run check:lab-static-modules` | PASS (82/82) |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| `git status --short` | Clean (only known pre-existing untracked files) |

---

### Manual Owner Checklist

1. Open `/lab`
2. **Improved layout** — h1 "리서치 Lab", lead copy, research hub structure
3. **Four module cards visible** in 2×2 grid:
   - 국회의원 보유 주식 / 정적 모듈 준비
   - 국민연금 보유 현황 / 리서치 모듈
   - S&P 500 섹터 / 예시 데이터
   - 자산군 수익률 / 예시 데이터
4. **Status badges** visible on each card (정적 모듈 준비, 리서치 모듈, 예시 데이터)
5. **Preview tables** — two columns: S&P 500 sector rows and asset-class rows
6. **"정적 표시값 · 연동 전" label** visible on preview section
7. **Roadmap panel** — "데이터 연동 계획" + four bullet items listing data sources
8. **Disclaimer panel** — "데이터 정책", example-only note, no investment advice
9. **No numeric values** in any preview row (all show "예시 비중" / "예시 수익률")
10. **No links to non-existent sub-pages** (old route cards removed)
11. **Home feature card** — `/lab` link still works from Home page

---

### Remaining Limitations

- No real public disclosure data (국회의원 재산 신고)
- No real NPS holdings data
- No live S&P 500 sector weights or returns
- No live asset-class return data
- No saved Lab preferences or user personalization
- No export or download functionality
- No sub-page detail views for individual modules

---

### Recommended Next Phase

**Option A — Phase 3DG: Market Page Fixture Chart Enhancement**
- Improve Market page with deterministic fixture chart or enhanced market snapshot
- High visibility improvement to the market analytics section

**Option B — Phase 3DG: KIS + FX Preview Smoke Plan**
- Prepare a controlled document for live KIS credential and FX data smoke steps
- Only suitable if owner is ready to set up credentials and controlled live testing

**Recommendation**: Market Page Fixture Chart Enhancement if the next milestone is continued visible UI progress without any live data risk. KIS + FX Preview Smoke Plan only when the owner is ready for the controlled live integration prep phase.
