# Phase 3CA — Home Rail Banner URL Settings MVP
## Result Document v0.1 — 2026-06-25

---

### Summary

Phase 3CA implements a minimal operator-controlled banner management system for the Home right-side rail. The trigger was an urgent advertising inquiry that required the owner to quickly test custom banner URLs without a separate admin page or deployment cycle.

Scope: URL-first banner configuration only. No image upload. No click tracking. No separate admin route. No polling.

---

### Files Created

| File | Purpose |
|---|---|
| `supabase/migrations/20260625_site_admins_and_settings.sql` | DB schema + RLS (owner-applied) |
| `src/lib/siteSettingsClient.ts` | Browser-side Supabase helper for banner settings |
| `scripts/check_home_rail_banner_settings_static_contract.mjs` | Phase 3CA static contract checker |
| `docs/planning/phase_3ca_home_rail_banner_url_settings_mvp_result_v0.1.md` | This document |

### Files Modified

| File | Change |
|---|---|
| `src/components/HomeRailAd.astro` | Added managed banner loader script |
| `src/pages/mypage.astro` | Added Section G admin panel HTML + script logic |
| `src/styles/style.css` | Added banner admin CSS classes |
| `scripts/check_home_ad_slots_static_contract.mjs` | Added Phase 3CA group (3 checks) |
| `scripts/check_mypage_shell_static_contract.mjs` | Added Phase 3CA group (10 checks) |
| `docs/planning/planning_changelog.md` | Added Phase 3CA entry |
| `package.json` | Added `check:home-rail-banner-settings` script |

---

### Database Schema

**`public.site_admins`**
- `user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
- `role text NOT NULL DEFAULT 'master' CHECK (role IN ('master'))`
- `created_at timestamptz NOT NULL DEFAULT now()`

**`public.site_settings`**
- `key text PRIMARY KEY`
- `value jsonb NOT NULL DEFAULT '{}'`
- `updated_by uuid REFERENCES auth.users(id)`
- `updated_at timestamptz NOT NULL DEFAULT now()`

**`public.is_site_admin()`** — security definer function returns `boolean`; checks if `auth.uid()` has a row in `site_admins`. Used by RLS policies.

**RLS policies:**
- `site_admins`: authenticated user may SELECT own row only
- `site_settings`: anon + authenticated may SELECT where `key = 'home_rail_banners'`
- `site_settings`: only `is_site_admin()` may INSERT or UPDATE

---

### Owner Setup Steps

1. Apply migration via Supabase Dashboard > SQL Editor
2. Find your Supabase Auth User ID (Dashboard > Authentication > Users)
3. Insert admin row:
   ```sql
   insert into public.site_admins (user_id, role)
   values ('<YOUR_AUTH_USER_ID>', 'master');
   ```
4. Sign in to the site and navigate to /mypage
5. The `운영 배너 관리` section will appear
6. Enter banner URLs and click 저장

---

### Banner Data Contract

```typescript
type HomeRailBanner = {
  slot: 1 | 2 | 3;
  imageUrl: string;  // http/https only, max 1000 chars
  linkUrl: string;   // http/https only, max 1000 chars; empty = no link
  alt: string;       // max 120 chars
  active: boolean;
};
```

URL validation blocks: `javascript:`, `data:`, `file:`, `vbscript:`. Requires `http://` or `https://`.

---

### Runtime Behavior

**HomeRailAd.astro (client-side, one load per page)**
1. If Supabase not configured → return early, show static sample banners
2. Call `getHomeRailBanners()` → read `site_settings` where `key = 'home_rail_banners'`
3. Filter for `active = true AND imageUrl ≠ ''`
4. If none found → return early, keep static sample banners
5. Replace `home-rail-track` content with managed banner cards
6. Links: `target="_blank" rel="noopener noreferrer"` for http/https linkUrl; no link element for empty linkUrl
7. No carousel rotation for managed banners (MVP)

**MyPage admin panel**
1. On page load: call `isCurrentUserSiteAdmin()` → checks `site_admins` for current user
2. If not admin → panel stays hidden
3. If admin → reveal panel, call `getHomeRailBanners()` to populate current values
4. On 저장: validate all URLs client-side, call `saveHomeRailBanners()`, show Korean result message (4s auto-hide)
5. On 다시 불러오기: reload from Supabase, repopulate fields

---

### Safety Constraints Verified

- No raw `fetch()` call in component files (uses Supabase client methods)
- No `@supabase` direct import in mypage.astro (uses local lib module)
- No `auth.signOut`, `auth.updateUser`, `auth.signUp` added
- No `console.log`, `console.error` added
- No `localStorage`, `sessionStorage` added
- No `setInterval` added for polling (existing carousel `setInterval` unchanged)
- No external ad network scripts
- No click tracking / impression counting
- No Supabase Storage (no image upload)
- No live KIS calls
- No live GNews calls
- No Vercel Preview / Production URL calls

---

### Validation Results

| Checker | Result |
|---|---|
| `check:home-rail-banner-settings` | PASS |
| `check:home-ad-slots` | PASS |
| `check:mypage-shell` | PASS |
| `astro build` | PASS |

---

### Non-Goals (Deferred)

- Image upload via Supabase Storage
- Click tracking / impression analytics
- Banner scheduling (time-based activation)
- Multiple admin roles (only 'master' currently)
- Admin management UI (owner seeded via SQL only)
- Banner preview on the Home page for admins before publishing
