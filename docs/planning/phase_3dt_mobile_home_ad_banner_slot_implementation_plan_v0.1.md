# Phase 3DT — Mobile Home Ad Banner Slot Implementation Plan

## 1. Metadata

| Field | Value |
|-------|-------|
| Phase | 3DT |
| Type | Mobile Home Ad Banner Slot Implementation Plan |
| Status | **Planned — implementation pending** |
| Latest prior commit | `f2bbfc3 docs: close out portfolio owner browser review` |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Runtime source changes | None in this phase |
| API route changes | None |
| DB / Supabase schema changes | None |
| Supabase live calls by Claude Code | None |
| Supabase bucket upload by Claude Code | None |
| Live KIS calls by Claude Code | None |
| Live API calls by Claude Code | None |
| Browser launch by Claude Code | None |
| Local dev server by Claude Code | None |
| Vercel production deployment | Not performed |

---

## 2. Owner Request Summary

- **Existing PC Home right-side banner**: `160×600` vertical strip, already live on site.
- **Existing PC banner management**: accessible from the master MyPage (`마이페이지`), under "운영 배너 관리" section.
- **Existing image workflow**: owner uploads images to a Supabase bucket manually, then registers the resulting HTTPS image URL in the master MyPage banner slot. No in-site file upload exists.
- **Existing PC banner max count**: 3 slots (slots 1–3).
- **Existing PC banner has automatic rotation**: uses `setInterval` at 5000ms (5 seconds). Pauses on hover.
- **Existing rotation interval to reuse**: 5000ms. Mobile banner must use the same interval.
- **New mobile-only Home banner slot requested**.
- **Mobile banner location**: between `MY PORTFOLIO` section and `MARKET SNAPSHOT` section on Home.
- **Mobile banner management**: same master MyPage registration/editing pattern as PC.
- **Mobile banner image flow**: same Supabase bucket URL registration flow.
- **PC and mobile max banner count**: both should become 5.
- **Recommended mobile creative size**: `720×225px`.

---

## 3. Existing PC Banner Implementation Findings

Source was inspected before planning. All findings are based on current source state.

### 3.1 Render File

- **File**: `src/components/HomeRailAd.astro`
- The component renders an `<aside class="home-rail-ad" data-home-rail-ad ...>` container, initially hidden (`style="display:none"`).
- On `astro:page-load` and on initial load, a client-side script calls `getHomeRailBanners()` from `siteSettingsClient.ts`.
- Active banners are filtered (must have `active: true`, non-empty `imageUrl`, valid `https?://` scheme).
- If zero active banners → rail stays hidden permanently.
- If one active banner → rail is shown, no rotation.
- If two or more active banners → rail shows and `setupRailCarousel(rail)` starts rotation.

### 3.2 Registration / Editing File

- **File**: `src/pages/mypage.astro`
- The master MyPage contains an `<aside class="mp-admin-rail">` section (right column, shown only to confirmed site admins).
- Inside it: `<section class="mp-banner-admin" id="mpBannerAdminPanel">` with an accordion toggle.
- Title: "운영 배너 관리"
- Description: "Home 우측 배너 URL을 관리합니다. 이미지 업로드는 이후 단계에서 지원합니다."
- Three identical slot blocks: `mpBannerSlot1`, `mpBannerSlot2`, `mpBannerSlot3`.
- Each slot has: active checkbox, imageUrl input (`type="url" maxlength="1000"`), linkUrl input (`type="url" maxlength="1000"`), alt text input (`maxlength="120"`), image preview.
- Save button calls `saveHomeRailBanners()` with slot objects collected from the form.

### 3.3 Data Structure

- **File**: `src/lib/siteSettingsClient.ts`
- **Type**:
  ```typescript
  type HomeRailBanner = {
    slot: 1 | 2 | 3;
    imageUrl: string;
    linkUrl: string;
    alt: string;
    active: boolean;
  };
  ```
- **Fields**: `slot` (number, 1–3), `imageUrl`, `linkUrl`, `alt`, `active`.
- **No explicit `order` field** — ordering is determined by slot number.
- **No hidden/inactive display** — inactive slots are filtered before rendering.
- **Default slots** (empty inactive placeholders):
  ```typescript
  const DEFAULT_SLOTS: HomeRailBanner[] = [
    { slot: 1, imageUrl: '', linkUrl: '', alt: '', active: false },
    { slot: 2, imageUrl: '', linkUrl: '', alt: '', active: false },
    { slot: 3, imageUrl: '', linkUrl: '', alt: '', active: false },
  ];
  ```
- **Supabase storage**: table `site_settings`, key `home_rail_banners`, value is a JSON array of `HomeRailBanner[]`.

### 3.4 Max-Count Validation Location

- **File**: `src/lib/siteSettingsClient.ts`
- `normalizeBanners()` rejects any slot not in `{1, 2, 3}`:
  ```typescript
  if (slot !== 1 && slot !== 2 && slot !== 3) continue;
  ```
- `DEFAULT_SLOTS` array has exactly 3 items.
- The TypeScript type `slot: 1 | 2 | 3` enforces the limit at the type level.
- The mypage.astro save handler iterates over `([1, 2, 3] as const)`.
- To raise the PC max count to 5: update the slot type union, the `DEFAULT_SLOTS` array, and the `normalizeBanners` condition in `siteSettingsClient.ts`, and the save handler loop in `mypage.astro`.

### 3.5 Rotation Implementation Location

- **File**: `src/components/HomeRailAd.astro` (inside `<script>` block)
- **Function**: `setupRailCarousel(rail: HTMLElement)`
- **Mechanism**: `window.setInterval(...)` stored on `rail._railIntervalId`
- **Teardown**: `clearInterval(rail._railIntervalId)` on before re-loading managed banners (prevents duplicate timers)
- **Hover behavior**: `mouseenter` → pause, `mouseleave` → resume
- **Reduced motion**: `window.matchMedia('(prefers-reduced-motion: reduce)')` shortens transition to 0ms if active
- **Multiple active cards check**: `if (active.length >= 2)` before starting carousel

### 3.6 Rotation Interval

- **Hardcoded in**: `src/components/HomeRailAd.astro`, `setupRailCarousel()`
- **Value**: `5000` (milliseconds — 5 seconds)
- The mobile banner implementation should reuse this same value. Do not introduce a separate configuration for mobile interval.

### 3.7 Image URL Storage

- Image URL registration is performed in the master MyPage admin section.
- Stored in `HomeRailBanner.imageUrl` (string, max 1000 characters)
- Read from Supabase `site_settings` row with `key = 'home_rail_banners'`
- Validated by `validateBannerUrl()`: must be `https?://` scheme, non-blocked, max 1000 chars
- Rendering: `img.src = safeImageUrl` after scheme validation

### 3.8 Link URL Storage

- Stored in `HomeRailBanner.linkUrl` (string, max 1000 characters)
- Optional — if empty, the card renders as a `<div role="img">` rather than an `<a>`
- If present and valid `https?://` scheme, renders as `<a target="_blank" rel="noopener noreferrer">`

### 3.9 Active/Hidden State Handling

- Per-slot `active: boolean` field.
- Only banners where `b.active === true && b.imageUrl.trim() !== '' && /^https?:\/\//i.test(b.imageUrl)` are displayed.
- If `active.length === 0`, the rail stays hidden (never shown). This is the default for an empty slot.

### 3.10 Ordering

- Ordering is determined by slot number (1, 2, 3 in `DEFAULT_SLOTS`).
- No separate `order` field exists. Slots are always rendered in slot-number order.

### 3.11 Empty State

- If zero valid active banners: rail container stays hidden (`display: none`).
- No placeholder/skeleton is shown.

### 3.12 Master/Admin Access Check

- **File**: `src/lib/siteSettingsClient.ts`
- **Function**: `isCurrentUserSiteAdmin(): Promise<boolean>`
- Reads from Supabase `site_admins` table, checks if current session `user_id` is present.
- If `isCurrentUserSiteAdmin()` returns false, the banner admin panel stays hidden in mypage.

### 3.13 Existing Checker Coverage

- **Script**: `scripts/check_home_ad_slots_static_contract.mjs`
- **Package script**: `check:home-ad-slots`
- Covers: file existence, `homeAdBanners.json` structure (exactly 3 entries), SVG content, Home page integration, HomeRailAd safety (no ad networks, no tracking, no fetch, no env reads), Phase 3CA managed banner support, Phase 3CA-HF2 active slot filtering.
- **The existing checker checks for exactly 3 entries in `homeAdBanners.json`**. Phase 3DU must update the checker if the JSON is updated, or confirm that the JSON is a legacy fixture and not the source of truth for managed banners.
- **Note**: `homeAdBanners.json` is a legacy static data file from before managed banners were added. The live site uses Supabase `site_settings` for actual banner data. The JSON is not used for live banner rendering (`HomeRailAd.astro` does not import it). The existing checker validates the static file remains intact.

### 3.14 Home Page Layout

- **File**: `src/pages/index.astro`
- Layout:
  - `home-shell` (flex row)
    - `home-main-column` (flex column)
      1. `hero-section` — hero copy + `HomePortfolioPanel` (contains `MY PORTFOLIO` eyebrow)
      2. `grid-4 home-feature-grid` — 4 feature cards
      3. `<HomeIndexCards />` — index snapshot section (contains `MARKET SNAPSHOT` eyebrow)
      4. `<HomeMarketNews />` — news articles
    - `home-sidebar-column` — contains `<HomeRailAd />` (desktop-only via CSS)
- The PC `HomeRailAd` is in the right sidebar column, always in DOM but revealed only on desktop breakpoint via CSS `.home-sidebar-column { display: none }` → `.home-sidebar-column { display: block }` at a media query.
- The `MY PORTFOLIO` eyebrow lives inside `HomePortfolioPanel` inside the `hero-section`.
- The `MARKET SNAPSHOT` eyebrow lives inside `HomeIndexCards`.
- **Mobile banner insertion point in `index.astro`**: a new mobile-only slot should be placed **between the `home-feature-grid` section and `<HomeIndexCards />`**, which is between the `MY PORTFOLIO` hero block and the `MARKET SNAPSHOT` section.

---

## 4. Proposed Data Model Extension

Based on actual source findings, the minimal safe extension is:

### 4.1 Desktop Slot Type — Extend from 3 to 5

**In `src/lib/siteSettingsClient.ts`** (changes for Phase 3DU):

```typescript
// Change slot type from 1|2|3 to 1|2|3|4|5
export type HomeRailBanner = {
  slot: 1 | 2 | 3 | 4 | 5;
  imageUrl: string;
  linkUrl: string;
  alt: string;
  active: boolean;
};

// Change DEFAULT_SLOTS to 5 items
const DEFAULT_SLOTS: HomeRailBanner[] = [
  { slot: 1, imageUrl: '', linkUrl: '', alt: '', active: false },
  { slot: 2, imageUrl: '', linkUrl: '', alt: '', active: false },
  { slot: 3, imageUrl: '', linkUrl: '', alt: '', active: false },
  { slot: 4, imageUrl: '', linkUrl: '', alt: '', active: false },
  { slot: 5, imageUrl: '', linkUrl: '', alt: '', active: false },
];

// Change normalizeBanners slot check
if (slot !== 1 && slot !== 2 && slot !== 3 && slot !== 4 && slot !== 5) continue;
```

Supabase key for desktop remains: `home_rail_banners` (existing data is preserved — slots 1–3 survive, slots 4–5 are new empty defaults).

### 4.2 Mobile Banner Separate Key

A separate Supabase `site_settings` key for mobile banners avoids mixing the desktop and mobile arrays:

```typescript
export type HomeMobileBanner = {
  slot: 1 | 2 | 3 | 4 | 5;
  imageUrl: string;
  linkUrl: string;
  alt: string;
  active: boolean;
};

const DEFAULT_MOBILE_SLOTS: HomeMobileBanner[] = [
  { slot: 1, imageUrl: '', linkUrl: '', alt: '', active: false },
  { slot: 2, imageUrl: '', linkUrl: '', alt: '', active: false },
  { slot: 3, imageUrl: '', linkUrl: '', alt: '', active: false },
  { slot: 4, imageUrl: '', linkUrl: '', alt: '', active: false },
  { slot: 5, imageUrl: '', linkUrl: '', alt: '', active: false },
];
```

Supabase key: `home_mobile_banners` (new key, no existing data to preserve).

New functions to add in `siteSettingsClient.ts`:
- `normalizeMobileBanners(raw: unknown): HomeMobileBanner[]`
- `getHomeMobileBanners(): Promise<HomeMobileBanner[] | null>`
- `saveHomeMobileBanners(banners: HomeMobileBanner[]): Promise<{ ok: boolean; message: string }>`

URL validation: reuse existing `validateBannerUrl()` — it is not slot-type-specific.

Admin access: reuse existing `isCurrentUserSiteAdmin()`.

---

## 5. Proposed Master MyPage UI Extension

Based on mypage.astro findings:

### 5.1 Existing PC Banner Section — Extend to 5 Slots

In `src/pages/mypage.astro`:

- Rename/update the section heading to clarify it is for PC Home right banner.
- Add helper text: "권장 PC 배너 크기: `160×600px`"
- Add slot blocks `mpBannerSlot4` and `mpBannerSlot5` following the same pattern as slots 1–3.
- Update the save handler loop: `([1, 2, 3, 4, 5] as const)`.
- Update the summary counter loop: `([1, 2, 3, 4, 5] as const)`.

### 5.2 New Mobile Home Banner Section

Add a second section below the PC banner section:

- Section ID: `mpMobileBannerAdminPanel`
- Heading: "모바일 Home 배너 관리" (or equivalent approved copy)
- Description: "Home 모바일 배너 URL을 관리합니다. 권장 크기: `720×225px`. 이미지는 Supabase 버킷에 직접 업로드 후 URL을 등록해주세요."
- Five slot blocks: `mpMobileBannerSlot1` through `mpMobileBannerSlot5`.
- Each slot: active checkbox, imageUrl input, linkUrl input, alt text input, image preview.
- Same field patterns and maxlength values as the PC slots.
- Same save/reload button pattern using `saveHomeMobileBanners()`.
- Same accordion toggle pattern.

Do NOT add file upload UI — the existing pattern is URL registration only.

---

## 6. Proposed Home Mobile Slot

In `src/pages/index.astro`:

- Add a new mobile-only component or inline slot between the `home-feature-grid` section and `<HomeIndexCards />`.
- Create a new component `src/components/HomeMobileAd.astro` following the same structure as `HomeRailAd.astro`.
- The new component renders a hidden container (`style="display:none"`), loads mobile banners client-side from `getHomeMobileBanners()`, and reveals only if active banners exist.

### 6.1 Placement in `index.astro`

```html
<!-- (existing) -->
<section class="grid-4 home-feature-grid"> ... </section>

<!-- NEW: mobile-only banner slot -->
<HomeMobileAd />

<!-- (existing) -->
<HomeIndexCards />
```

### 6.2 Responsive Display Policy

- **Show on mobile**: visible at narrow viewport.
- **Hide on desktop**: hidden when the PC right-rail banner is visible.
- Use CSS: hide `HomeMobileAd` at the same breakpoint where `.home-sidebar-column` (and thus `HomeRailAd`) becomes visible.
- Do not show both PC and mobile banners at the same viewport width.

### 6.3 Sizing

```css
.home-mobile-ad {
  display: none;  /* hidden by default; revealed by client script if active banners exist */
  width: 100%;
}

.home-mobile-ad-viewport {
  width: 100%;
  aspect-ratio: 720 / 225;  /* 16:5 ratio, matches 720×225 creative */
  overflow: hidden;
  position: relative;
}

.home-mobile-ad-track {
  display: flex;
  width: 100%;
  height: 100%;
}

.home-mobile-ad-card {
  flex: 0 0 100%;
  width: 100%;
}

.home-mobile-ad-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Hide mobile ad at desktop breakpoint (same as when sidebar becomes visible) */
@media (min-width: X) {
  .home-mobile-ad { display: none !important; }
}
```

The exact breakpoint must be confirmed by reading the desktop breakpoint in `style.css` where `.home-sidebar-column { display: block }` is declared.

---

## 7. Proposed Rotation Behavior

- Use the same automatic rotation behavior as the existing PC rail (5-second `setInterval` carousel).
- **Same interval**: `5000ms` (5 seconds), same as the PC rail.
- The `HomeMobileAd.astro` script should use the same `setupRailCarousel` pattern.
- Do not introduce a separate `rotationIntervalSeconds` configuration. Hardcode `5000` in the same way as the PC rail.
- If Phase 3DU introduces a shared carousel helper (e.g., `src/lib/railCarousel.ts`), both PC and mobile can import it. Otherwise, copy the function and ensure they use the same constant.
- Prevent duplicate timers: store interval ID on the container element (`el._railIntervalId`), clear on re-load.
- If only one banner is active, do not start rotation.
- If zero banners are active, keep the slot hidden.
- Pause on `touchstart` or `mouseenter`, resume on `touchend`/`mouseleave`.

---

## 8. Proposed Responsive Size Policy

| Slot | Creative Size | Aspect Ratio |
|------|--------------|--------------|
| PC right-side | `160×600px` | 4:15 |
| Mobile Home | `720×225px` | 16:5 |

Expected rendered sizes at common viewports:

| Mobile Viewport Width | Rendered Mobile Banner Size |
|----------------------|----------------------------|
| 360px | ~360×113px |
| 390px | ~390×122px |
| 430px | ~430×134px |

Owner must create sample mobile banner images at `720×225px`. PC banner samples remain `160×600px`. Mobile and PC creatives are separate and must not be cross-used.

---

## 9. Proposed Validation for Phase 3DU

A new or updated checker (`check:home-ad-slots` or a new Phase 3DU checker) should verify:

- Desktop `HomeRailBanner` type allows slots 1–5.
- Desktop `DEFAULT_SLOTS` has 5 items.
- Desktop `normalizeBanners` accepts slots 1–5.
- Mobile `HomeMobileBanner` type exists with slots 1–5.
- Mobile `getHomeMobileBanners()` and `saveHomeMobileBanners()` exist in `siteSettingsClient.ts`.
- Mobile banner size guidance `720×225` appears in mypage copy or validation.
- `HomeMobileAd.astro` exists.
- Mobile slot is placed between `MY PORTFOLIO` section and `MARKET SNAPSHOT` section in `index.astro`.
- Mobile banner is hidden at desktop breakpoint in CSS.
- PC right-side `HomeRailAd` is preserved on desktop.
- Mobile and PC banners do not both render at the same viewport (CSS media query separation).
- Supabase key `home_mobile_banners` is referenced in `siteSettingsClient.ts`.
- No Supabase upload implementation was added (URL-only workflow preserved).
- Existing `validateBannerUrl()` is reused for mobile.
- Carousel interval for mobile is `5000` (same as PC).
- No second independent interval config introduced.
- No live Supabase call is made by checker.
- No production deployment performed.
- Existing PC right-side `HomeRailAd` banner is preserved on desktop (not removed or replaced by this feature).
- Existing `homeAdBanners.json` still exists (legacy static file, not removed).

---

## 10. Implementation Plan for Phase 3DU

### Step 1 — Update Desktop Banner Constants and Type

File: `src/lib/siteSettingsClient.ts`

1. Change `slot` type union from `1 | 2 | 3` to `1 | 2 | 3 | 4 | 5` in `HomeRailBanner`.
2. Add slots 4 and 5 to `DEFAULT_SLOTS`.
3. Update `normalizeBanners()` condition to accept slots 1–5.
4. Add `HomeMobileBanner` type (same fields, slot `1 | 2 | 3 | 4 | 5`).
5. Add `DEFAULT_MOBILE_SLOTS` (5 empty inactive items).
6. Add `normalizeMobileBanners()`.
7. Add `getHomeMobileBanners()` reading key `home_mobile_banners`.
8. Add `saveHomeMobileBanners()` writing key `home_mobile_banners`.

### Step 2 — Update Master MyPage UI

File: `src/pages/mypage.astro`

1. Add size guidance text to the existing PC banner section: "권장 PC 배너 크기: 160×600px"
2. Add `mpBannerSlot4` and `mpBannerSlot5` blocks following the same pattern as slots 1–3.
3. Update the save handler loop to include slots 4 and 5.
4. Update the summary counter loop to include slots 4 and 5.
5. Add `populateSlots` support for slots 4 and 5.
6. Add a new mobile banner admin section `mpMobileBannerAdminPanel` below the PC section.
7. Add 5 mobile slot blocks (`mpMobileBannerSlot1` through `mpMobileBannerSlot5`).
8. Add save/reload buttons for mobile banners, calling `saveHomeMobileBanners()`.
9. Import `getHomeMobileBanners` and `saveHomeMobileBanners` from `siteSettingsClient`.

### Step 3 — Create Mobile Banner Component

File: `src/components/HomeMobileAd.astro` (new file)

1. Follow the same pattern as `HomeRailAd.astro`.
2. Use class `home-mobile-ad` for the container.
3. Use `getHomeMobileBanners()` instead of `getHomeRailBanners()`.
4. Render images at `width: 100%` with `aspect-ratio: 720 / 225`.
5. Use the same carousel rotation logic with `5000ms` interval.
6. Hide when zero active banners.

### Step 4 — Update Home Page

File: `src/pages/index.astro`

1. Import `HomeMobileAd` from `../components/HomeMobileAd.astro`.
2. Insert `<HomeMobileAd />` between the `home-feature-grid` section and `<HomeIndexCards />`.

### Step 5 — Update CSS

File: `src/styles/style.css`

1. Add `.home-mobile-ad` styles with `aspect-ratio: 720 / 225`, `width: 100%`.
2. Add responsive hide rule: at the same breakpoint where `.home-sidebar-column { display: block }` (desktop), also set `.home-mobile-ad { display: none !important }` to prevent both slots appearing simultaneously.

### Step 6 — Add/Update Checker

1. Update or create a Phase 3DU checker verifying all items in §9.
2. Confirm existing `check:home-ad-slots` still passes (it checks `homeAdBanners.json` which is not removed).

### Step 7 — Build and Local Owner Review

1. Run `npm run build` and confirm no errors.
2. Owner reviews locally at `http://localhost:4321` on a mobile viewport (390px).
3. Confirm mobile banner slot appears between `MY PORTFOLIO` and `MARKET SNAPSHOT`.
4. Confirm PC banner remains on desktop, does not appear on mobile.
5. No production deployment until owner confirms local review passes.

---

## 11. Non-Goals

- No implementation in Phase 3DT.
- No runtime source changes in Phase 3DT.
- No Supabase bucket upload. URL-only workflow is preserved.
- No new database schema. Uses existing `site_settings` table with a new key (`home_mobile_banners`).
- No new ad management system. Extension of existing PC banner system only.
- No production deployment in Phase 3DT.
- No live Supabase, KIS, GNews, or AI calls by Claude Code.
- No mobile banner creative generation by Claude Code.
- No sample image creation by Claude Code.
- No Playwright or Puppeteer automation.

---

## 12. Recommended Next Phase

`Phase 3DU — Mobile Home Ad Banner Slot Implementation`

Owner should prepare sample `720×225px` mobile banner images after the implementation plan is reviewed and before Phase 3DU implementation begins.

If source inspection in Phase 3DU reveals the existing PC banner implementation is more complex than found here (e.g., view transition edge cases, server-side rendering complications, Supabase row permission issues), Phase 3DU may be split into:

- `Phase 3DU-A — Banner Settings Expansion` (siteSettingsClient.ts + mypage.astro)
- `Phase 3DU-B — Mobile Home Slot Rendering` (HomeMobileAd.astro + index.astro + style.css)
