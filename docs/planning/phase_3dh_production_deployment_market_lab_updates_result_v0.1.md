# Phase 3DH — Production Deployment for Market and Lab UX Updates
## Result v0.1 — 2026-06-26

### Metadata

| Field | Value |
|---|---|
| Phase | 3DH |
| Type | Production Deployment for Market and Lab UX Updates |
| Status | Deployed |
| Latest prior commit deployed | da2676e feat: add lab matrix hover highlighting |
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

## Deployment Content

This deployment brings two phases to production:

### Phase 3DG — Market Page Fixture Chart Enhancement
- Added fixture-based market analytics sections below the existing treemap/scatter dashboard
- 6 market summary cards (KOSPI, KOSDAQ, S&P 500, Nasdaq 100, USD/KRW, Gold)
- SSR SVG line chart (3 series — KOSPI, S&P 500, Nasdaq 100 — over 7 example periods)
- CSS horizontal comparison bars (6 asset classes)
- 4 watch point memo cards (금리/환율, 위험자산 선호, 변동성, 원자재)
- Data policy disclaimer
- All values are static fixture/example data — no live providers

### Phase 3DF-HF4 — Lab Matrix Cross-Year Hover Highlight
- Same-category cross-year hover highlight on `/lab/asset-class-returns` and `/lab/sp500-sectors`
- Desktop: `pointerover` highlights matching cells; `pointerleave` clears unless pinned
- Click/tap: toggles pinned highlight for mobile and desktop
- Legend chips participate in hover and click
- Escape key clears pinned state
- CSS: `.is-highlighted` ring, `.is-dimmed` opacity 0.3, `prefers-reduced-motion` safe

---

## Owner Review Status Before Deployment

| Item | Status |
|---|---|
| Phase 3DG Market local/browser review | Passed |
| Lab matrix desktop hover highlight | Passed |
| Lab matrix mobile/touch tap highlight | Did not work in owner review |
| Owner decision on mobile tap issue | Accepted as non-critical; proceed with deployment |

---

## Known Limitation — Mobile/Touch Lab Matrix Highlight

**Issue:** The tap/click highlight toggle for the Lab return matrix did not work during owner
mobile review.

**Affected:** `/lab/asset-class-returns` and `/lab/sp500-sectors` on mobile/touch devices.

**Not affected:** Desktop hover highlight behavior, matrix data, Lab route structure, all
other pages.

**Root cause:** Not investigated in this phase — likely related to mobile browser event handling
differences (`pointerover` or `click` event propagation on touch surfaces).

**Decision:** Owner accepted this as non-critical and approved proceeding with deployment.
Desktop hover behavior is the primary accepted interaction.

**Planned fix:** Phase 3DI — Mobile Baseline Usability Pass. The mobile tap behavior should be
revisited alongside other mobile layout concerns.

---

## Pre-Deployment Validation Results

| Check | Result |
|---|---|
| `npm run check:market-fixture-chart` | PASS (76/76) |
| `npm run check:lab-matrix-hover` | PASS (57/57) |
| `npm run check:lab-return-matrix` | PASS (114/114) |
| `npm run check:production-domain` | PASS (33/33) |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| `git status --short` | Clean (expected untracked only) |

---

## Deployment Results

| Field | Value |
|---|---|
| Commit deployed | da2676e feat: add lab matrix hover highlighting (or later docs commit) |
| Deployment command | `npx vercel deploy --prod --yes` |
| Production URL | `https://mkstocklab.vercel.app` |
| Deployment status | Ready |

---

## Production Route Checklist

Owner should verify each route on the canonical production URL:

- `https://mkstocklab.vercel.app` — Home page
- `https://mkstocklab.vercel.app/market` — Market page with fixture dashboard
- `https://mkstocklab.vercel.app/lab` — Lab landing (실험실, 4 cards)
- `https://mkstocklab.vercel.app/lab/asset-class-returns` — 자산군 수익률 비교 matrix with hover
- `https://mkstocklab.vercel.app/lab/sp500-sectors` — S&P 500 섹터별 수익률 matrix with hover
- `https://mkstocklab.vercel.app/lab/congress-stocks` — 국회의원 보유 주식 (연동 예정)
- `https://mkstocklab.vercel.app/lab/nps-holdings` — 국민연금 보유 현황 (연동 예정)
- `https://mkstocklab.vercel.app/portfolio` — Portfolio page
- `https://mkstocklab.vercel.app/chart-ai` — Chart AI skeleton
- `https://mkstocklab.vercel.app/mypage` — MyPage

---

## Owner Production Visual Checklist

### Market page (`/market`)
1. Open `https://mkstocklab.vercel.app/market`.
2. Confirm the existing treemap and scatter dashboard renders at the top.
3. Scroll down — confirm 6 market summary cards (KOSPI, KOSDAQ, S&P 500, Nasdaq 100, USD/KRW, Gold).
4. Confirm `주요 지수 예시 흐름` SVG line chart is visible with 3 colored lines.
5. Confirm `자산별 예시 등락률` horizontal bar section is visible.
6. Confirm 4 watch point memo cards are visible.
7. Confirm data policy disclaimer is visible at the bottom.
8. Confirm all values are labeled `예시 데이터`.
9. Confirm no live/current/realtime claims.

### Lab pages (`/lab/asset-class-returns`, `/lab/sp500-sectors`)
10. Open `https://mkstocklab.vercel.app/lab/asset-class-returns`.
11. On desktop: hover a matrix cell — confirm same asset cells highlight across all years.
12. Confirm non-matching cells dim.
13. Confirm legend chip for the same asset also highlights.
14. Click a cell — confirm pinned highlight stays after pointer leaves.
15. Press Escape — confirm highlight clears.
16. Repeat steps 11–15 on `/lab/sp500-sectors`.
17. **On mobile:** tap highlight may not work — this is a known limitation. Document but do not attempt to fix.

### General
18. Confirm no redirect to `mk-stock-lab.vercel.app` during navigation.
19. Confirm no investment recommendation wording on any page.
20. Confirm login/auth flow still works on `https://mkstocklab.vercel.app`.

---

## Cleanup Recommendation

The temporary `mk-stock-lab.vercel.app` Vercel project was created accidentally during Phase
3DF-HF2. If the owner has confirmed that `https://mkstocklab.vercel.app` is fully working after
this deployment, the temporary project can be archived or deleted manually via the Vercel dashboard.

**Owner action:** Archive or delete the `mk-stock-lab` Vercel project in the Vercel dashboard
after confirming canonical production works.

**Note:** Do not perform this deletion via Claude Code.

---

## Recommended Next Phase

**Phase 3DI — Mobile Baseline Usability Pass** *(Recommended first)*
Address mobile layout and interaction issues including the known mobile tap highlight limitation.
This stabilizes the mobile experience before adding more features.

**Phase 3DI — KIS + FX Preview Smoke Plan** *(Alternative)*
If the owner prefers to prioritize live data integration for market data.

Recommended order: Mobile Baseline Usability Pass first → KIS integration second.
