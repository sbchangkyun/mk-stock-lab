# Phase 3CA-HF2 — MyPage Banner Admin UX and Active Slot Filtering Hotfix
## Result Document v0.1 — 2026-06-25

---

### Metadata

- **Phase**: 3CA-HF2
- **Type**: MyPage Banner Admin UX and Active Slot Filtering Hotfix
- **Status**: Implemented
- **Latest prior commit**: 0bae831 fix: add password reset flow
- **Runtime UI changes**: MyPage (login label, layout, accordion) + HomeRailAd (active slot filter + carousel teardown)
- **API route changes**: none
- **DB / Supabase schema changes**: none
- **Live KIS calls**: none
- **Live GNews calls**: none
- **External HTTP by Claude Code**: none
- **Vercel Preview calls by Claude Code**: none
- **Deployment**: not performed

---

### Owner Review Findings (Phase 3CA Browser Review)

After Phase 3CA-HF1 (password reset), the owner logged in as `kkamagi707@naver.com` (master account) and reviewed the MyPage and Home banner rail. Four issues were found:

1. **Login method label wrong**: `로그인 방식` displayed `Google 로그인` even though the master account uses email/password. The label was hardcoded in HTML.

2. **Banner admin panel placed too low**: `운영 배너 관리` appeared at the bottom of MyPage (after Legal and above Danger Zone), far from the `내 계정` section. Original intent was to use the right-side desktop space next to `내 계정`.

3. **Banner admin too long, needs accordion**: The 3-slot form is tall. Wanted a collapsible/expandable accordion to reduce visual clutter when not actively editing banners.

4. **Inactive/empty banner slots appearing in Home rotation**: Only slot 1 was configured and active, but the Home right rail rotated through blank white slots 2 and 3. The root cause was that the SSR carousel (with 3 static sample banners) was initialized before the managed banner loader ran. The loader replaced the track content but the old carousel interval kept running with stale DOM references, translating the track and hiding the single managed banner off-screen.

---

### Fix Summary

#### Fix 1: Login Method Label

- Removed hardcoded `<dd>Google 로그인</dd>` from HTML
- Added `<dd id="mpLoginMethod" class="mp-placeholder">확인 중</dd>`
- In `setupMyPage`, after `getSession()`, resolves the provider label dynamically:
  - Inspects `user.identities` array (most reliable; set by Supabase per identity provider)
  - Falls back to `user.app_metadata.provider` if identities is empty
  - If provider includes `email` → `이메일 로그인`
  - If provider includes `google` → `Google 로그인`
  - If both → `이메일 + Google`
  - If unknown → `확인 불가`
- Does not hard-code the owner email address
- Does not infer login method from email domain
- Does not expose raw user object in UI

#### Fix 2: Desktop Right-Side Layout

- Wrapped `내 계정` section and `운영 배너 관리` section in a shared `<div class="mp-top-area">`
- Moved `운영 배너 관리` section inside `mp-top-area`, immediately after the account section
- `mp-top-area` uses `display: contents` by default (transparent wrapper; children participate in the parent `mp-sections` grid as before)
- When the master admin panel is revealed, JS adds class `mp-top-area--active`:
  - Mobile: `grid-template-columns: 1fr` (stacks vertically)
  - Desktop (≥ 1024px): `grid-template-columns: minmax(0, 1fr) 340px` (account section left, admin rail right)
- Non-admin users: `mp-top-area` remains `display: contents`, no layout change visible

#### Fix 3: Accordion Behavior

- Added `<div class="mp-banner-accordion-header">` with:
  - `<h2>운영 배너 관리</h2>`
  - `<div class="mp-banner-accordion-meta">` with summary span and toggle button
- Toggle button (`id="mpBannerAccordionToggle"`) has `aria-expanded="false"` and `aria-controls="mpBannerAccordionBody"` by default (collapsed)
- Accordion body (`id="mpBannerAccordionBody"`) is `hidden` by default
- Clicking toggle: `setAccordion(open)` toggles `aria-expanded`, button text (`펼치기`/`접기`), and `hidden`
- `showMsg(msg, ok)`: if `ok === false`, calls `setAccordion(true)` to ensure error message is visible
- Summary span (`id="mpBannerAccordionSummary"`) shows `활성 배너 N개` (count of slots where `active && imageUrl.trim()`)
- Summary updated after `populateSlots` (on load / reload) and after successful save

#### Fix 4: Active Slot Filtering

Root cause: The SSR carousel was set up with 3 static sample banners. When `loadManagedBanners` ran async and replaced the track with 1 managed banner, the old carousel interval kept running (with a `cards` NodeList pointing to the old 3 DOM elements). The interval periodically set `track.style.transform: translateX(-100%)` and `translateX(-200%)`, hiding the single managed banner off-screen.

Changes in `HomeRailAd.astro`:
- Extracted carousel setup into `setupRailCarousel(rail)`, which stores the interval ID on the element: `rail._railIntervalId = window.setInterval(...)`
- Extracted init into `initRail()` which runs `setupRailCarousel` on all matching rails
- Before `loadManagedBanners` replaces content:
  1. `clearInterval(rail._railIntervalId)` — stop old carousel
  2. `delete rail._railIntervalId` — clear stored ID
  3. `rail.removeAttribute('data-ready')` — allow re-setup
  4. `track.style.transform = ''` — reset transform
  5. `track.style.transitionDuration = ''` — reset transition
- Strengthened filter: `b.active && b.imageUrl.trim() && /^https?:\/\//i.test(b.imageUrl.trim())`
  - `b.active === true`
  - `b.imageUrl.trim()` non-empty (excludes whitespace-only URLs)
  - `https?://` scheme validated (excludes invalid URLs)
- After replacing content: re-run `setupRailCarousel(rail)` only if `active.length >= 2`
- If `active.length === 0` (no active managed banners with valid imageUrl): returns early, static fallback SSR banners remain visible
- Consolidated two `<script>` blocks into one for correct teardown before re-initialization

---

### Active Slot Policy

| Condition | Result |
|---|---|
| `active: true` + valid imageUrl | Rendered in Home rail |
| `active: false` | Excluded — not rendered |
| `active: true` + empty imageUrl | Excluded — not rendered |
| `active: true` + whitespace-only imageUrl | Excluded — `.trim()` check |
| `active: true` + non-http imageUrl | Excluded — `https?://` check |
| `linkUrl` empty or missing | Image renders without link wrapping |
| `linkUrl` non-empty + valid https? | Renders as `<a>` with `target="_blank" rel="noopener noreferrer"` |
| No active valid managed banners | Static SSR fallback banners shown |
| 1 active valid banner | Single banner shown, no carousel |
| 2+ active valid banners | Carousel rotation among active managed banners only |

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
- No setInterval added outside carousel rotation
- No modification to KIS, GNews, Portfolio, Market, Chart AI, Lab runtime
- No deployment performed

---

### Files Changed

| File | Change |
|---|---|
| `src/pages/mypage.astro` | Login method dynamic resolver; `mp-top-area` wrapper; banner admin moved inside `mp-top-area`; accordion header + collapsible body; accordion open on error; summary count |
| `src/components/HomeRailAd.astro` | Extracted `setupRailCarousel`/`initRail`; carousel teardown before managed content replacement; strengthened active filter (`trim()` + `https?` check); consolidated into single script block |
| `src/styles/style.css` | Added `.mp-top-area`, `.mp-top-area--active`, `.mp-banner-accordion-*` classes |
| `scripts/check_mypage_shell_static_contract.mjs` | Added Phase 3CA-HF2 group: login resolver checks, accordion checks, layout checks |
| `scripts/check_home_rail_banner_settings_static_contract.mjs` | Added HF2 active filter checks, carousel teardown checks, HF2 result doc check |
| `scripts/check_home_ad_slots_static_contract.mjs` | Added Phase 3CA-HF2 active slot filtering group |
| `docs/planning/phase_3ca_hf2_mypage_banner_admin_ux_active_slot_filter_result_v0.1.md` | This document |
| `docs/planning/planning_changelog.md` | Phase 3CA-HF2 entry prepended |

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

1. Deploy or run locally, log in as `kkamagi707@naver.com`
2. Navigate to `/mypage`
3. **Login label**: Confirm `로그인 방식` shows `이메일 로그인` (not `Google 로그인`)
4. **Banner admin placement**: On desktop (≥ 1024px), confirm `운영 배너 관리` appears to the right of `내 계정`, not at the bottom of the page
5. **Accordion default**: Confirm `운영 배너 관리` panel is collapsed by default; only the title, summary count, and `펼치기` button are visible
6. **Expand accordion**: Click `펼치기` → confirm slots appear, button changes to `접기`
7. **Collapse accordion**: Click `접기` → confirm body hides
8. **Active summary**: Confirm `활성 배너 N개` count matches the number of slots that have active checked and a valid imageUrl
9. **Save and accordion on error**: Enter an invalid URL and save → confirm accordion stays open and error message is visible
10. **Active slot filtering**:
    a. Set only slot 1 active with valid imageUrl, slots 2 and 3 inactive — save
    b. Open Home page → confirm only slot 1 banner appears, no blank rotation
    c. Set slots 1 and 3 active with valid imageUrls, slot 2 inactive — save
    d. Open Home page → confirm carousel rotates between slot 1 and slot 3 only (no blank between them)
    e. Deactivate all slots — save
    f. Open Home page → confirm static sample banners (SVG fallback) appear
11. **Password reset no-regression**: Open login modal → confirm `비밀번호를 잊으셨나요?` link still present

---

### Remaining Limitations

- The `identities` field comes from `user.identities` on the Supabase client session. If the user's identity list is unavailable (edge case: some Supabase configurations may not return it), the fallback to `app_metadata.provider` is used. If both are empty, label shows `확인 불가`.
- The `mp-top-area--active` grid is only applied when the master admin is logged in. On non-admin accounts, `mp-top-area` uses `display: contents`.
- The 340px right column for the admin rail is fixed-width on desktop. On narrow desktop viewports (1024–1200px), the form fields in the admin rail may be constrained.
- Banner slot 1/2/3 ordering in Home carousel follows the order of `active` array (filtered from slots 1→3). No custom ordering is supported in this phase.

---

### Recommended Next Phase

**Phase 3CA Owner Browser Review continuation** — verify all four HF2 fixes with the master account. Then proceed to Phase 3CB (Home Index Cards Fixture Data) or Phase 3CB-Security (Security Metadata Coverage Expansion).
