# Phase 3DG — Market Page Fixture Chart Enhancement
## Result v0.1 — 2026-06-26

### Metadata

| Field | Value |
|---|---|
| Phase | 3DG |
| Type | Market Page Fixture Chart Enhancement |
| Status | Implemented |
| Latest prior commit | d60ca8d chore: consolidate production domain |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Runtime UI changes | Market page only |
| API route changes | None |
| DB / Supabase schema changes | None |
| Live KIS calls | None |
| Live GNews calls | None |
| AI provider calls | None |
| External data fetch by Claude Code | None |
| Vercel production deployment | Not performed in this phase |

---

## Product Reason

The Market page previously showed only the treemap/scatter dashboard. While technically rich, it
lacked a quick market summary section that communicates market status at a glance. Before live KIS
or FX integration is ready, a fixture-based summary makes the page feel usable and communicates the
intended product direction without misleading users.

A fixture dashboard:
- Improves visible UI without adding server load (no API calls, no Supabase, no polling).
- Keeps the basic Vercel server plan safe — all data is static.
- Shows the product's intended market analytics direction to the owner and stakeholders.

---

## Implementation Summary

### Files changed

| File | Change |
|---|---|
| `src/data/marketFixtureDashboard.json` | Created — fixture data for the new dashboard sections |
| `src/components/MarketFixtureDashboard.astro` | Created — new fixture dashboard component |
| `src/pages/market.astro` | Updated — imports and renders MarketFixtureDashboard after MarketShell |
| `src/styles/style.css` | Appended — Phase 3DG CSS section with all new classes |
| `scripts/check_market_fixture_chart_enhancement_static_contract.mjs` | Created — 76-check static contract |
| `package.json` | Added `check:market-fixture-chart` script |
| `docs/planning/phase_3dg_market_fixture_chart_enhancement_result_v0.1.md` | Created (this file) |
| `docs/planning/planning_changelog.md` | Prepended Phase 3DG entry |

### New sections added below the existing treemap/scatter dashboard

1. **Intro note** — eyebrow badge `데이터 연동 전 · 예시 데이터` + lead text
2. **Market summary cards** — 6 compact cards (KOSPI, KOSDAQ, S&P 500, Nasdaq 100, USD/KRW, Gold)
3. **Trend line chart** — SSR SVG with 3 series (KOSPI, S&P 500, Nasdaq 100) over 7 periods
4. **Comparison bars** — CSS horizontal bar chart comparing 6 assets by example change %
5. **Watch point memo cards** — 4 research memo cards (금리/환율, 위험자산 선호, 변동성, 원자재)
6. **Data policy / disclaimer** — explicitly labels all values as example data, no investment advice

---

## Fixture Data

### Summary cards (6)

| ID | Label | Category | Example value | Direction |
|---|---|---|---|---|
| kospi | KOSPI | 국내 주식 | 2,847.50 | up |
| kosdaq | KOSDAQ | 국내 주식 | 842.35 | down |
| sp500 | S&P 500 | 미국 주식 | 5,243.18 | up |
| nasdaq100 | Nasdaq 100 | 미국 주식 | 18,562.40 | up |
| usdkrw | USD/KRW | 환율 | 1,352.10 | down |
| gold | Gold | 원자재 | 2,347.80 | up |

All cards display `예시 데이터` badge. All values are fabricated — not current market data.

### Trend chart

- Title: `주요 지수 예시 흐름`
- Labels: D-6 through Today (7 periods)
- Series: KOSPI, S&P 500, Nasdaq 100 — all normalized to base 100
- Note: `예시 데이터입니다. 실제 시장 수치가 아닙니다.`

### Comparison items (6)

| Label | Example change | Direction |
|---|---|---|
| Nasdaq 100 | +1.42% | up |
| S&P 500 | +0.84% | up |
| KOSPI | +0.62% | up |
| Gold | +0.48% | up |
| KOSDAQ | -0.31% | down |
| USD/KRW | -0.22% | down |

Bars are proportionally sized relative to the largest absolute value. All values are example data.

### Watch point memo cards (4)

1. 금리/환율 — currency and interest rate context
2. 위험자산 선호 — global liquidity and risk asset context
3. 변동성 — volatility and options context
4. 원자재 — commodity and inflation context

All cards labeled `리서치 메모`. Language is non-actionable and non-prescriptive.

---

## Chart UI Details

### SVG trend line chart

- Implementation: SSR-only SVG `<polyline>` — no client-side JavaScript, no charting library, no canvas
- Points computed server-side in Astro frontmatter from fixture JSON values
- SVG viewBox: `0 0 600 205`
- Plot area: x=44, y=14, width=510, height=160
- Base-100 reference line (dashed) with y-axis label `100`
- X-axis labels for time periods (D-6 to Today)
- Three series: KOSPI (#2563eb), S&P 500 (#d54a3f), Nasdaq 100 (#16a34a)
- Legend chips below chart with series colors
- Fully static — determined at build/render time, no re-renders, no animation

### Comparison bars

- Implementation: CSS-only horizontal bars using inline `style="width: X%"`
- Width percentages computed server-side: `|change| / maxAbs * 100`
- Positive bars: `var(--positive)` (#118a4f, green)
- Negative bars: `var(--negative)` (#c43f3f, red)
- No JavaScript, no CSS animation, no canvas

---

## Safety and Scope

- No live data.
- No KIS API calls (no fetch, no oauth, no quote endpoint).
- No GNews API calls.
- No AI provider calls.
- No Supabase calls or imports.
- No DB migrations.
- No new API routes.
- No external HTTP of any kind.
- No deployment performed.
- No polling, setInterval, setTimeout, or WebSocket.
- No canvas element.
- No investment advice — explicitly states `자동화된 투자 권고를 제공하지 않습니다.`
- No `실시간`, `현재 시세`, `최신 데이터` wording in new code.
- No `매수`, `매도`, `추천 종목` wording in new code.

---

## Validation Results

| Check | Result |
|---|---|
| `npm run check:market-fixture-chart` | PASS (76/76) |
| `npm run check:market-quote-card` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| `git status --short` | Clean (only expected untracked) |

---

## Manual Owner Checklist

1. Open `/market` in browser.
2. Confirm the existing treemap + scatter dashboard still renders correctly.
3. Scroll down — confirm the new fixture dashboard sections are visible below the treemap.
4. Confirm 6 market summary cards (KOSPI, KOSDAQ, S&P 500, Nasdaq 100, USD/KRW, Gold) are visible.
5. Confirm the `주요 지수 예시 흐름` SVG line chart is visible with 3 colored series.
6. Confirm the `자산별 예시 등락률` horizontal bar section is visible.
7. Confirm 4 watch point memo cards (금리/환율, 위험자산 선호, 변동성, 원자재) are visible.
8. Confirm the data policy section is visible at the bottom.
9. Confirm all values display `예시 데이터` label.
10. Confirm no copy claims live, current, or realtime data.
11. Confirm no investment recommendation wording (매수, 매도, 추천 종목, AI 추천).
12. Confirm no production deployment was performed — page only visible on local dev server.

---

## Remaining Limitations

- All values are fixture/static — no live KIS, FX, or commodity feed.
- No live crypto or commodity prices.
- No news integration.
- No saved market preferences.
- No production deployment performed in this phase.

---

## Recommended Next Phase

**Phase 3DH — Production Deployment for Market Update**
Deploy Phase 3DG to the canonical production URL (`https://mkstocklab.vercel.app`) after the
owner confirms the local browser review passes.

or

**Phase 3DH — KIS + FX Preview Smoke Plan**
If the owner is ready to prepare controlled live credential wiring for market data.

Recommend production deployment only after owner local/browser review passes.
