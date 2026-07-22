# Phase 3CB — Home Index Cards Fixture Data
## Result Document v0.1 — 2026-06-25

---

### Metadata

- **Phase**: 3CB
- **Type**: Home Index Cards Fixture Data
- **Status**: Implemented
- **Latest prior commit**: 4bf7ca1 fix: place banner admin rail and remove sample flash (Phase 3CA-HF3)
- **Runtime UI changes**: Home index snapshot cards section; MyPage admin rail width polish (340px → 420px, breakpoint 1099px → 1199px)
- **API route changes**: none
- **DB / Supabase schema changes**: none
- **Live KIS calls**: none
- **Live GNews calls**: none
- **External HTTP by Claude Code**: none
- **Vercel Preview calls by Claude Code**: none
- **Deployment**: not performed

---

### Business / Product Reason

The Home page previously showed only hero copy, a portfolio panel, feature-card navigation, and market news. Users visiting the site before live KIS/FX integration had no visible market-level context. Phase 3CB adds a compact market snapshot section using local fixture data:

- **High visible value**: nine major market indicators displayed in a clean card grid
- **Zero server load**: all data is static JSON, no API calls, no polling
- **Progressive enhancement path**: fixture values will be replaced by live data in a later KIS/FX integration phase
- **No live data risk**: values are explicitly labeled as sample/reference, not real-time

---

### Implementation Summary

#### New Files

| File | Description |
|---|---|
| `src/data/homeIndexCards.json` | Fixture data for 9 market indicators |
| `src/components/HomeIndexCards.astro` | MARKET SNAPSHOT section, renders from fixture |
| `scripts/check_home_index_cards_static_contract.mjs` | Static contract checker |
| `docs/planning/phase_3cb_home_index_cards_fixture_data_result_v0.1.md` | This document |

#### Modified Files

| File | Change |
|---|---|
| `src/pages/index.astro` | Import and render `<HomeIndexCards />` between hero section and feature cards |
| `src/styles/style.css` | Add `.index-card-*` styles; widen admin rail to 420px in carry-over polish |
| `package.json` | Add `check:home-index-cards` script |
| `scripts/check_mypage_shell_static_contract.mjs` | Add mp-top-area no-regression check |
| `docs/planning/planning_changelog.md` | Phase 3CB entry prepended |

#### Home Page Layout After 3CB

```
[Hero + Portfolio Panel]
[HomeIndexCards — MARKET SNAPSHOT (9 fixture cards)]
[grid-4 Feature Cards]
[HomeMarketNews]
[Home Sidebar Column → HomeRailAd (managed banners only)]
```

---

### Index Card Fixture Data

All values are sample/reference data. `asOfLabel: "예시 데이터"` and `note: "연동 전 표시값입니다"` on every entry.

| ID | Label | Caption | Value | Change | Direction |
|---|---|---|---|---|---|
| sp500 | S&P 500 | 미국 대형주 | 5,834 | +0.65% | up |
| nasdaq100 | Nasdaq 100 | 성장주 지수 | 20,421 | +1.21% | up |
| dowjones | Dow Jones | 우량주 지수 | 43,155 | -0.12% | down |
| kospi | KOSPI | 국내 대표 시장 | 2,512 | +0.03% | flat |
| kosdaq | KOSDAQ | 국내 성장 시장 | 721 | +0.47% | up |
| usdkrw | USD/KRW | 원/달러 환율 | 1,382 | -0.23% | down |
| dxy | Dollar Index | 달러 흐름 | 104.30 | -0.31% | down |
| gold | Gold | 안전자산 (USD/oz) | 2,658 | +0.88% | up |
| wti | WTI Oil | 에너지 기준가 (USD/bbl) | 72.45 | -1.44% | down |

---

### Fixture / Sample Data Policy

- **All values are sample values** for display and layout validation purposes only
- `asOfLabel` is `"예시 데이터"` on all 9 entries — visible to users in the card footer
- `note` field is `"연동 전 표시값입니다"` — machine-readable flag for tooling
- No use of `실시간`, `현재 시세`, `최신 시세`, `Live`, or `Real-time` wording anywhere in fixture or component
- Home index cards component does NOT call any API, fetch any endpoint, read any env var, or use Supabase
- Data is not auto-refreshed; no setInterval, polling, or cron added
- Values will be replaced by live KIS/FX data in a future integration phase

---

### MyPage Admin Rail Width Polish (Carry-Over from 3CA-HF3)

**What changed**: Admin rail column in `mp-page-layout--admin-visible` widened from `340px` to `420px`. Desktop-only breakpoint adjusted from `max-width: 1099px` to `max-width: 1199px`.

**Result on 1440px desktop** (the primary target screen):
- `site-main` ≈ 1325px; account column: 680px (full); admin rail: 420px; gap: 24px; used: 1124px
- `내 계정` card: 680px — unchanged ✓
- Admin rail: 420px (+80px wider than HF3) — better use of page space ✓

**Result at 1200px** (breakpoint boundary):
- `site-main` ≈ 1104px; account: min(680, 1104-24-420) = 660px; admin: 420px
- Account card slightly narrower (660px vs 680px) at the narrow desktop edge — acceptable

**Below 1200px**: single-column block layout; admin rail stacks below sections with `max-width: 680px` ✓

**Non-admin users**: `mp-admin-rail { display: none }` — no empty right column regardless of viewport ✓

**Not broken**:
- `mp-top-area` and `mp-top-area--active` are NOT reintroduced
- `내 계정` card remains at its pre-HF2 independent width on typical desktop
- Admin rail remains hidden for non-admin users

---

### Home Rail Banner No-Regression Confirmation

All Phase 3CA-HF3 no-sample-flash behaviors are preserved:

- `HomeRailAd.astro` does not import `homeAdBanners.json` for visible rendering
- Rail starts with `style="display:none"` and `data-managed-rail-pending`
- Client reveals rail only when active managed banners exist (`active && imageUrl.trim() && /^https?:\/\//i.test(...)`)
- If no active managed banners: rail stays hidden — Sample Banner 01/02/03 never shown
- No click/impression tracking
- Carousel teardown (`_railIntervalId`) preserved for re-navigation safety

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

1. Open `/` (Home page) on desktop (≥ 1440px)
2. **MARKET SNAPSHOT section**: confirm 9 cards appear between hero/portfolio panel and feature cards
3. **Card content**: confirm each card shows label, caption, value, change %, and `예시 데이터` label
4. **Direction colors**: confirm green for `up`, red for `down`, grey for `flat`
5. **Fixture wording**: confirm no card implies live or real-time data
6. **Home rail banner no-regression**: confirm no sample SVG banners flash on load
7. **Feature cards**: confirm Chart AI / 시장 / Lab / 포트폴리오 cards still appear below snapshot section
8. **Market news**: confirm HomeMarketNews section still appears
9. **MyPage admin rail (if logged in as master)**:
   - Navigate to `/mypage` on desktop ≥ 1440px
   - Confirm `운영 배너 관리` rail feels wider than before (≈420px vs 340px)
   - Confirm `내 계정` card still spans its full width on the left
   - Confirm non-admin accounts see no empty right column
10. **No regressions**: portfolio panel, password reset, home rail managed banners — all functioning as before

---

### Remaining Limitations

- **Fixture data only**: values in the 9 cards are sample/reference data, not live market prices
- **No auto-refresh**: fixture does not update; values are static until live integration is added
- **No charting**: no mini-charts in cards (deferred to future phase)
- **No FX conversion**: USD-denominated values shown as-is with no KRW equivalent
- **Ticker belt unchanged**: `Ticker.astro` still uses its own hardcoded label/caption data; it was not refactored to share `homeIndexCards.json` (out of scope to avoid unintended risk)

---

### Recommended Next Phase

**Option A — Phase 3CC: Security Metadata Coverage Expansion**
- Short safe pass: add OpenGraph tags, structured data, canonical URLs
- No live data risk; purely static/config work
- Improves SEO and link preview quality immediately

**Option B — Phase 3CC: MyPage MVP Completion**  
- Complete the MyPage account display (join date, session count, notification toggle persistence)
- Moderate scope; involves Supabase reads for user metadata
- High visible impact for returning users

**Recommendation**: Phase 3CC Security Metadata if user prefers a quick, safe pass; MyPage MVP if account page completeness is the priority.
