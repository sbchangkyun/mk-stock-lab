# Phase 3CB-HF2 — Home Market Snapshot Mini Sparkline Cards
## Result v0.1 — 2026-06-26

### Metadata

| Field | Value |
|---|---|
| Phase | 3CB-HF2 |
| Type | Home Market Snapshot Mini Sparkline Cards |
| Status | Implemented |
| Latest prior commit | fce80aa chore: deploy market and lab ux updates |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Runtime UI changes | Home MARKET SNAPSHOT component only |
| API route changes | None |
| DB / Supabase schema changes | None |
| Live KIS calls | None |
| Live GNews calls | None |
| AI provider calls | None |
| External data fetch by Claude Code | None |
| Vercel production deployment | Not performed in this phase |

---

## Owner Request

The existing Home MARKET SNAPSHOT cards showed only index name, value, and change percentage.
The owner found this too plain and requested a compact mini sparkline on each card — similar to
the compact market/crypto cards that show a ticker, value, change %, and a small trend line
alongside the text data.

---

## Implementation Summary

### Approach

Static SSR SVG sparklines were computed server-side in the Astro frontmatter of
`HomeIndexCards.astro`. No client-side JavaScript was added. No chart library or canvas was used.

Each card's sparkline is a `<polyline>` inside a compact `<svg viewBox="0 0 120 36">`, with points
normalized independently per card from its `trend` array in the fixture data.

### Card layout change

Previously all content was stacked vertically in the card. With the sparkline enhancement:
- Left column: label, caption, value, change, `예시 데이터` label (wrapped in `.index-card-main`)
- Right column: compact SVG sparkline aligned to center (`.index-card-sparkline`)
- The `.index-card` becomes a flex row

### SVG computation

```typescript
const computePoints = (trend: number[]): string => {
  const SVG_W = 120; const SVG_H = 36; const PAD_X = 2; const PAD_Y = 4;
  const minV = Math.min(...trend);
  const maxV = Math.max(...trend);
  const rangeV = maxV - minV || 1;
  const n = trend.length;
  return trend.map((v, i) => {
    const x = PAD_X + (i / (n - 1)) * (SVG_W - PAD_X * 2);
    const y = (SVG_H - PAD_Y) - ((v - minV) / rangeV) * (SVG_H - PAD_Y * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
};
```

Points are normalized individually per card. Each sparkline fills the SVG height regardless of
the trend's absolute range — this keeps all sparklines visually readable even for flat cards.

### Files changed

| File | Change |
|---|---|
| `src/data/homeIndexCards.json` | Added `trend` array (7 points each) to all 9 cards |
| `src/components/HomeIndexCards.astro` | Added `computePoints` function + sparkline SVG per card |
| `src/styles/style.css` | Appended Phase 3CB-HF2 sparkline CSS section |
| `scripts/check_home_index_sparkline_static_contract.mjs` | Created — 66-check static contract |
| `package.json` | Added `check:home-index-sparkline` script |
| `docs/planning/phase_3cb_hf2_home_market_snapshot_sparkline_result_v0.1.md` | Created (this file) |
| `docs/planning/planning_changelog.md` | Prepended Phase 3CB-HF2 entry |

---

## Fixture Data

| Card | Direction | Trend (7 points, base 100) |
|---|---|---|
| S&P 500 | up | 100, 100.4, 101.2, 100.8, 101.9, 102.5, 103.2 |
| Nasdaq 100 | up | 100, 101.0, 102.4, 101.8, 103.2, 104.1, 105.4 |
| Dow Jones | down | 100, 100.2, 99.6, 100.0, 99.2, 99.4, 98.9 |
| KOSPI | flat | 100, 100.1, 99.8, 100.2, 100.0, 100.3, 100.1 |
| KOSDAQ | up | 100, 100.6, 101.0, 100.7, 101.5, 102.0, 102.8 |
| USD/KRW | down | 100, 100.1, 99.7, 99.4, 99.6, 99.0, 98.8 |
| Dollar Index | down | 100, 99.8, 99.4, 99.7, 99.2, 99.0, 98.7 |
| Gold | up | 100, 100.8, 101.6, 101.2, 102.4, 103.0, 103.9 |
| WTI Oil | down | 100, 99.2, 98.6, 99.0, 98.2, 97.5, 97.1 |

All values are static example values. No current or live market data is used.
Trend direction broadly matches each card's `direction` field:
- up cards: last value > first value
- down cards: last value < first value
- flat cards: minimal movement, end near start

---

## Safety and Scope

- No live market data
- No KIS API calls
- No GNews API calls
- No AI provider calls
- No Supabase calls or imports
- No DB migrations
- No new API routes
- No external HTTP of any kind
- No Vercel deployment performed
- No `setInterval`, `setTimeout`, `localStorage`, `sessionStorage`
- No canvas, no charting library (Chart.js, D3, Recharts, etc.)
- No React components added
- No investment advice or recommendation copy added
- No live/current/realtime wording added
- `예시 데이터` labeling preserved on all cards

---

## Validation Results

| Check | Result |
|---|---|
| `npm run check:home-index-sparkline` | PASS (66/66) |
| `npm run check:home-index-cards` | PASS (73/73) — no regressions |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| `git status --short` | Clean (expected untracked only) |

---

## Manual Owner Checklist

### Home page (`/`)

1. Open `https://mkstocklab.vercel.app` (after next deployment).
2. Scroll to `MARKET SNAPSHOT` section.
3. Confirm 9 market snapshot cards are visible.
4. Confirm each card shows: label, caption, value, change %, `예시 데이터`.
5. Confirm each card has a compact sparkline on the right side.
6. Confirm sparklines for up-direction cards use a green/positive stroke.
7. Confirm sparklines for down-direction cards use a red/negative stroke.
8. Confirm KOSPI sparkline is roughly flat and uses neutral stroke.
9. Confirm cards do not become excessively tall with the sparkline added.
10. Confirm no live/current/realtime wording on any card.
11. Confirm no investment recommendation wording.
12. Quick mobile check: cards remain readable (sparkline visible, not overflowing).

---

## Remaining Limitations

- Fixture data only — no live market feed.
- No interactive tooltip on sparkline hover.
- No zoom or time range selection.
- No production deployment in this phase.
- Mobile layout not fully optimized in this phase.
- Sparklines are fully static — they will not change until live data is wired.

---

## Recommended Next Phase

**Phase 3DI — Production Deployment for Home Sparkline Update**
Deploy Phase 3CB-HF2 along with the already-deployed Phases 3DG and 3DF-HF4 after the owner
confirms local browser review passes.

or

**Phase 3DI — Mobile Baseline Usability Pass**
Address mobile layout comprehensively before the next deployment.
