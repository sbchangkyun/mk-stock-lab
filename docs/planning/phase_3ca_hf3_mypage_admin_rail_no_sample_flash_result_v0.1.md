# Phase 3CA-HF3 — MyPage Admin Rail Placement and No Sample Banner Flash Hotfix
## Result Document v0.1 — 2026-06-25

---

### Metadata

- **Phase**: 3CA-HF3
- **Type**: MyPage Admin Rail Placement and No Sample Banner Flash Hotfix
- **Status**: Implemented
- **Latest prior commit**: 6500745 fix: polish banner admin and active slots (Phase 3CA-HF2)
- **Runtime UI changes**: MyPage (admin rail restructure), HomeRailAd (no SSR sample banners), style.css (mp-page-layout classes)
- **API route changes**: none
- **DB / Supabase schema changes**: none
- **Live KIS calls**: none
- **Live GNews calls**: none
- **External HTTP by Claude Code**: none
- **Vercel Preview calls by Claude Code**: none
- **Deployment**: not performed

---

### Owner Review Findings (Phase 3CA-HF2 Browser Review)

After Phase 3CA-HF2, the owner reviewed the MyPage and Home rail with the master account. Two blocking issues were found:

**Issue 1 — MyPage account card compressed**

The `운영 배너 관리` card was placed inside the `mp-top-area` grid alongside `내 계정`, both constrained to the `mp-sections` max-width of 680px. The `mp-top-area--active` grid split this 680px space into `minmax(0, 1fr) 340px`, leaving the account card with only ~320px instead of its full 680px. The owner expected `내 계정` to retain its full width with `운영 배너 관리` placed in the large empty right-side space of the page.

**Issue 2 — Sample Banner 01/02/03 flash on Home**

Before managed banner images loaded from Supabase, the SSR-rendered sample SVG banners (Sample Banner 01, 02, 03) were briefly visible in the Home right rail. In real operation, these sample banners must never appear. The Home rail should show only managed banners; if none are configured or active, show nothing.

---

### Fix Summary

#### Fix 1: MyPage Admin Rail Placement

Root cause: `mp-top-area--active { grid-template-columns: minmax(0, 1fr) 340px }` was applied inside `mp-sections { max-width: 680px }`, splitting the 680px container. The admin panel was inside the constrained area.

**Structural changes in `src/pages/mypage.astro`**:
- Removed the `<div class="mp-top-area">` wrapper that grouped `내 계정` and `운영 배너 관리` inside `mp-sections`
- Moved `운영 배너 관리` section outside `mp-sections` entirely, into a new `<aside class="mp-admin-rail">`
- Wrapped the entire page content in `<div class="mp-page-layout" id="mpPageLayout">`:
  ```html
  <div class="mp-page-layout" id="mpPageLayout">
    <div class="mp-sections">
      <!-- A. 내 계정 (full 680px width restored) -->
      <!-- B–F. other sections -->
    </div>
    <aside class="mp-admin-rail">
      <!-- G. 운영 배너 관리 (in separate right column) -->
      <section id="mpBannerAdminPanel" hidden>...</section>
    </aside>
  </div>
  ```

**JS changes in `setupBannerAdmin`**:
- Removed `topArea?.classList.add('mp-top-area--active')`
- Added: `panel.closest('.mp-page-layout')?.classList.add('mp-page-layout--admin-visible')`
- The admin rail is hidden by CSS (`.mp-admin-rail { display: none }`) by default; the CSS rule `.mp-page-layout--admin-visible .mp-admin-rail { display: block }` reveals it when the class is added

**CSS changes in `src/styles/style.css`**:
- Replaced `.mp-top-area` / `.mp-top-area--active` block with `.mp-page-layout` / `.mp-admin-rail` / `.mp-page-layout--admin-visible`
- Two-column grid on ≥ 1100px: `grid-template-columns: minmax(0, 680px) 340px; gap: 24px`
- Below 1100px: `display: block` with admin rail stacking below sections (`margin-top: 16px; max-width: 680px`)
- `내 계정` card: `max-width: 680px` (from `.mp-sections`) is now fully respected — no grid split

**For non-admin users**: JS never adds `mp-page-layout--admin-visible`, so `mp-admin-rail` stays hidden (CSS `display: none`) and `mp-page-layout` is just a block container. The right side of the page remains empty, consistent with pre-admin layout.

#### Fix 2: Remove Sample Banner Flash

Root cause: `HomeRailAd.astro` imported `homeAdBanners.json` and rendered all three sample SVG banners in the SSR HTML output. On screens ≥ 1440px where `.home-rail-ad { display: block }` was triggered by media query, these sample banners were briefly visible before `loadManagedBanners` ran async and replaced them.

**Changes in `src/components/HomeRailAd.astro`**:
- Removed `import homeAdBanners from '../data/homeAdBanners.json'` and associated SSR rendering entirely
- New SSR template renders only an empty container, initially hidden:
  ```html
  <aside class="home-rail-ad" data-home-rail-ad data-managed-rail-pending
    aria-label="Home banner rail" style="display:none">
    <div class="home-rail-viewport">
      <div class="home-rail-track"></div>
    </div>
  </aside>
  ```
- `style="display:none"`: inline style overrides the `@media (min-width: 1440px) { .home-rail-ad { display: block } }` rule, preventing any empty box flash before managed banners load
- `data-managed-rail-pending`: attribute removed by JS once loading is settled (regardless of outcome)

**Updated `loadManagedBanners` client script**:
1. Removes `data-managed-rail-pending` once loading is settled
2. Cancels any existing carousel interval (defensive for SPA re-navigation with view transitions)
3. If `active.length === 0`: returns — rail stays hidden with `style="display:none"`. Sample banners never shown
4. If active managed banners found: populates track, updates carousel state, calls `rail.style.display = ''` to reveal (restoring CSS control), calls `setupRailCarousel` if >= 2 banners
- `homeAdBanners.json` data file is NOT modified (JSON structure is preserved; file just no longer referenced by the component)
- The `setupRailCarousel` function is unchanged

**Result**: On screens ≥ 1440px with no configured managed banners: the rail never appears (hidden). With configured managed banners: brief blank loading period (the neutral empty bordered box is not shown because `style="display:none"` hides the whole element), then managed banners appear. Sample Banner 01/02/03 SVG images never shown in production.

---

### Admin Rail Visibility Rules

| Condition | mp-admin-rail | mp-page-layout layout |
|---|---|---|
| Non-admin user | Hidden (CSS `display: none`) | `display: block` (unchanged) |
| Admin user, viewport < 1100px | Block (stacked below sections) | `display: block` |
| Admin user, viewport ≥ 1100px | Block (right column: 340px) | `display: grid; grid-template-columns: minmax(0, 680px) 340px` |

### Sample Banner Flash Policy (HF3)

| Condition | Behavior |
|---|---|
| SSR (all screen sizes) | Empty track, `style="display:none"` — nothing visible |
| No active managed banners | Rail stays hidden — no fallback to sample banners |
| Active managed banners present | Rail revealed, carousel runs with managed banners only |
| View transitions (re-navigation) | Rail re-hides (SSR resets), managed banners reload |

---

### Scope Boundaries

- No DB migration
- No new Supabase table or column
- No image upload
- No Supabase Storage
- No click tracking
- No impression tracking
- No banner scheduling
- No auto-refresh
- No polling
- No cron
- No `setInterval` added outside carousel rotation
- No modification to KIS, GNews, Portfolio, Market, Chart AI, Lab runtime
- No deployment performed

---

### Files Changed

| File | Change |
|---|---|
| `src/pages/mypage.astro` | Removed `mp-top-area` wrapper; moved `운영 배너 관리` to `mp-admin-rail` aside; wrapped page in `mp-page-layout`; JS now adds `mp-page-layout--admin-visible` class instead of `mp-top-area--active` |
| `src/components/HomeRailAd.astro` | Removed `homeAdBanners.json` import and SSR sample rendering; empty hidden container; `loadManagedBanners` reveals rail only when active managed banners found; no sample fallback |
| `src/styles/style.css` | Replaced `mp-top-area`/`mp-top-area--active` CSS block with `mp-page-layout`/`mp-admin-rail`/`mp-page-layout--admin-visible`; breakpoint at 1100px for stacking |
| `scripts/check_mypage_shell_static_contract.mjs` | Phase 3CA-HF2/HF3 admin UX group: replaced `mp-top-area`/`mp-top-area--active` checks with `mp-page-layout`/`mp-admin-rail`/`mp-page-layout--admin-visible` checks |
| `scripts/check_home_rail_banner_settings_static_contract.mjs` | Added HF3 result doc and changelog checks in Group 1; replaced `homeAdBanners` import check in Group 4 with HF3 no-sample-flash policy checks |
| `scripts/check_home_ad_slots_static_contract.mjs` | Replaced `homeAdBanners` import check and `Static fallback preserved` check with HF3 no-sample-flash policy checks |
| `docs/planning/phase_3ca_hf3_mypage_admin_rail_no_sample_flash_result_v0.1.md` | This document |
| `docs/planning/planning_changelog.md` | Phase 3CA-HF3 entry prepended |

---

### Validation Results

| Validator | Result |
|---|---|
| `npm run check:home-rail-banner-settings` | PASS |
| `npm run check:home-ad-slots` | PASS |
| `npm run check:mypage-shell` | PASS |
| `npm run check:password-reset-flow` | PASS (no-regression) |
| `npm run build` | PASS |
| `git diff --check` | PASS |

---

### Manual Owner Browser Checklist

1. Deploy or run locally, log in as master account (`kkamagi707@naver.com`)
2. Navigate to `/mypage` on a desktop (≥ 1440px)
3. **Account card width**: Confirm `내 계정` card spans full 680px — not compressed to ~320px
4. **Admin rail placement**: Confirm `운영 배너 관리` appears in the right column, separate from the account section, not inside the left 680px column
5. **Admin rail only for admin**: Log out and log in as a non-admin account — confirm no empty right column appears on MyPage
6. **Accordion preserved**: Click `펼치기` → slots expand; click `접기` → slots collapse
7. **Summary count preserved**: Confirm `활성 배너 N개` count is accurate
8. **No sample banner flash**: Open `/` (Home) on a 1440px+ screen with no configured managed banners — confirm no sample SVG banners flash or appear
9. **Managed banners show**: Configure at least one slot with a valid imageUrl and `active: true` → save → reload Home → confirm managed banner appears, not sample banner
10. **Password reset no-regression**: Open login modal → confirm `비밀번호를 잊으셨나요?` link still present

---

### Remaining Limitations

- The 340px right column for the admin rail on desktop is a fixed width. On 1100–1199px viewports, the account column may be narrower than 680px (grid auto-distributes: `minmax(0, 680px)` gives all space up to 680px; remaining space goes to the 340px admin column). At 1100px, site-main ≈ 1012px, account gets 1012−340−24=648px — slightly under 680px but visually acceptable.
- `homeAdBanners.json` SVG files are still bundled in the public directory. They are never served to production users (not referenced in SSR output), but they remain as static files in `public/ads/home-rail/`. They can be removed in a future cleanup phase once confirmed unused.
- The `data-managed-rail-pending` attribute remains on the element until `loadManagedBanners` completes. On very slow connections, there is a brief period where the rail is neither loading-indicated nor visible — this is acceptable (no flash, no spinner required).

---

### Recommended Next Step

Owner browser review — verify both HF3 fixes with the master account:
1. Account card width restored on desktop
2. Admin rail in right column on desktop, stacked on narrow viewports
3. No sample banner flash on Home
4. All prior accordion / save / active-slot behaviors preserved
