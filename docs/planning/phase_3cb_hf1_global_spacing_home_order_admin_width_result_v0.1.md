# Phase 3CB-HF1 — Global Page Spacing, Home Section Order, and MyPage Admin Rail Width Polish
## Result Document v0.1 — 2026-06-26

---

### Metadata

- **Phase**: 3CB-HF1
- **Type**: UI Polish Hotfix
- **Status**: Implemented
- **Latest prior commit**: 81a69b8 feat: add home index fixture cards (Phase 3CB)
- **Runtime UI changes**: Global page gutter widened; Home section order fixed; MyPage admin rail widened
- **API route changes**: none
- **DB / Supabase schema changes**: none
- **Live KIS calls**: none
- **Live GNews calls**: none
- **External HTTP by Claude Code**: none
- **Vercel Preview calls by Claude Code**: none
- **Deployment**: not performed

---

### Business / Product Reason

Owner review of Phase 3CB found three issues:

1. **Pages feel too full-width / dense** — major pages (Home, Chart AI, Market, Lab, Portfolio, MyPage) lacked sufficient left/right breathing room on typical desktop widths, making content feel cramped edge-to-edge.
2. **Home section order was wrong** — MARKET SNAPSHOT (HomeIndexCards) appeared *before* the feature-card navigation grid, but the intended reading flow is: Hero → Feature Cards → Market Snapshot → Market News.
3. **MyPage admin rail still slightly narrow** — 420px was wider than the original 340px but still left unused space; widening to 480px makes better use of the right column.

---

### Implementation Summary

#### Modified Files

| File | Change |
|---|---|
| `src/styles/style.css` | `--page-gutter-x` raised from `clamp(24px, 4vw, 72px)` to `clamp(32px, 5vw, 96px)` |
| `src/styles/style.css` | Admin rail column: `420px` → `480px`; breakpoint: `max-width: 1199px` → `max-width: 1299px` |
| `src/pages/index.astro` | `<HomeIndexCards />` moved below feature-card grid (after `</section class="grid-4">`) |
| `scripts/check_home_index_cards_static_contract.mjs` | Added ordering checks, spacing checks, rail dimension checks, HF1 result doc check; updated admin rail check from 420px to 480px |
| `docs/planning/planning_changelog.md` | Phase 3CB-HF1 entry prepended |

---

### Change 1: Global Page Gutter Spacing

**Before**: `--page-gutter-x: clamp(24px, 4vw, 72px)`
**After**: `--page-gutter-x: clamp(32px, 5vw, 96px)`

**Effect at key viewports** (gutter per side → total content width):

| Viewport | Before | After | Change |
|---|---|---|---|
| 1080px (min-width) | 43px → 994px content | 54px → 972px content | −22px content (more margin) |
| 1280px | 51px → 1178px content | 64px → 1152px content | −26px content |
| 1440px | 57.6px → 1325px content | 72px → 1296px content | −29px content (+14px per side) |
| 1920px | 72px → 1500px (capped) | 96px → 1500px (capped) | same (max-width cap applies) |

The 5vw factor gives a smoother, proportional increase across viewport widths. At 1440px (primary target), pages now have 72px of breathing room on each side (vs 57.6px before — a 25% increase).

**Home rail banner: not affected** — `.home-rail-ad { width: 160px }`, `.home-rail-viewport { width: 160px; height: 600px }`, `.home-rail-card { width: 160px }` are all pixel-fixed and unchanged.

---

### Change 2: Home Section Order

**Before (Phase 3CB)**:
```
[Hero + Portfolio Panel]
[HomeIndexCards — MARKET SNAPSHOT]   ← was here
[grid-4 Feature Cards]
[HomeMarketNews]
```

**After (Phase 3CB-HF1)**:
```
[Hero + Portfolio Panel]
[grid-4 Feature Cards]               ← moved up
[HomeIndexCards — MARKET SNAPSHOT]   ← moved down
[HomeMarketNews]
```

This matches the intended reading flow: users see the site's feature navigation first, then supporting market context data.

---

### Change 3: MyPage Admin Rail Width

**Before**: `grid-template-columns: minmax(0, 680px) 420px` — breakpoint `max-width: 1199px`
**After**: `grid-template-columns: minmax(0, 680px) 480px` — breakpoint `max-width: 1299px`

**Effect on 1440px desktop** (the primary target):
- `site-main` ≈ 1296px (with new gutter)
- Account column: `min(680, 1296-24-480) = min(680, 792) = 680px` — full width ✓
- Admin rail: 480px (+60px wider than before) — better use of right column ✓
- Total used: 680 + 24 + 480 = 1184px; remaining: 112px buffer ✓

**Effect at narrow desktop** (1300–1440px range):
- At 1300px: `site-main = min(1300-130, 1500) = 1170px`; account = `min(680, 1170-24-480) = 666px`; admin = 480px ✓
- Below 1300px: single-column block layout; account = full 680px; admin rail stacks below with `max-width: 680px` ✓

**Breakpoint move from 1199px to 1299px**: ensures the two-column layout activates at a wider viewport, giving the 480px admin rail enough room to coexist with the account card comfortably.

**Non-admin users**: `mp-admin-rail { display: none }` — no change; no empty right column for non-admin users regardless of viewport ✓

---

### Safety Constraints Verified

- Home rail dimensions (160px × 600px): **unchanged**
- `HomeRailAd` no-sample-flash behavior: **not touched**
- `mp-top-area` / `mp-top-area--active`: **not reintroduced**
- `내 계정` card: **full 680px on 1440px+ desktop** ✓
- No live API calls, no KIS, no GNews, no Supabase writes, no env reads
- No polling, cron, background timers, or setInterval added
- No new server-side admin APIs

---

### Validation Results

| Validator | Result |
|---|---|
| `npm run check:home-index-cards` | PASS |
| `npm run check:home-rail-banner-settings` | PASS |
| `npm run check:home-ad-slots` | PASS |
| `npm run check:mypage-shell` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |

---

### Manual Owner Browser Checklist

1. Open any major page (Home, `/chart-ai`, `/market`, `/lab`, `/portfolio`) at 1440px width
2. **Spacing**: confirm visible breathing room on left and right edges (≥72px from viewport edge to content at 1440px)
3. **Home section order**: confirm the feature-card grid (Chart AI / 시장 / Lab / 포트폴리오) appears *before* the MARKET SNAPSHOT section
4. **MARKET SNAPSHOT**: confirm 9 index cards appear below the feature cards and above MARKET NEWS
5. **Home rail banner**: confirm right rail banner is still 160px wide and 600px tall (no resize regression)
6. **MyPage admin rail (if logged in as master)**: confirm `운영 배너 관리` rail is noticeably wider (~480px vs ~420px before)
7. **`내 계정` card**: confirm it remains at full width on desktop (no squeeze)
8. **Non-admin users**: confirm no empty right column on MyPage

---

### Remaining Limitations

- **MARKET SNAPSHOT data**: still fixture/sample data (Phase 3CB); live KIS/FX integration is a future phase
- **No dark-mode specific gutter testing**: dark mode uses the same CSS variables; visual validation recommended
- **MyPage admin rail at 1300–1440px**: account card slightly under 680px (≈666px at exactly 1300px) — acceptable per design review
