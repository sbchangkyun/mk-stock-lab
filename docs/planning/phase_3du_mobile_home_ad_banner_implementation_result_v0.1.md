# Phase 3DU — Mobile Home Ad Banner Slot Implementation Result

## 1. Status

Completed on `rebuild/phase-1-ia-shell`. Safe local validation passed.

- Starting HEAD: `3b70a39 docs: plan mobile home ad banner slot`
- Canonical production URL: `https://mkstocklab.vercel.app`
- Production deployment: not performed
- Live Supabase/provider calls: not performed

## 2. Implemented Scope

- Expanded desktop Home rail banner management from three to five slots.
- Added five mobile Home banner slots with the same fields, URL validation, admin gate, and full-array save pattern.
- Added `HomeMobileAd.astro` after the mobile-hidden feature grid and before `HomeIndexCards`.
- Limited the mobile banner to `max-width: 859px` and retained the desktop rail's existing 1440px breakpoint.
- Reserved `aspect-ratio: 720 / 225` and used `object-fit: contain`.
- Matched the existing 5000ms rotation behavior and reduced-motion transition policy.
- Kept banner image management URL-only; no file input or Supabase Storage upload was added.

## 3. Storage Compatibility Decision

The checked-in RLS policy permits anonymous and authenticated reads only when the `site_settings.key` is `home_rail_banners`. A separate database row named `home_mobile_banners` would therefore be unreadable to public Home visitors without a migration, and migrations are outside Phase 3DU scope.

Phase 3DU keeps the permitted `home_rail_banners` row and stores a backward-compatible object in its `value`:

```text
home_rail_banners: desktop slot array
home_mobile_banners: mobile slot array
```

Legacy values where `value` is directly the desktop array remain supported. The next successful admin save upgrades the stored shape while preserving both banner groups.

## 4. Safety Boundaries

- No `.env` or secret file was read.
- No live Supabase call or Storage upload was made.
- No SQL was executed and no migration was added.
- No API route or unrelated Portfolio preview file was changed.
- No dev server, browser automation, smoke script, Vercel command, deployment, push, or external API call was run.

## 5. Validation

| Command | Result |
|---|---|
| `npm run check:home-ad-slots` | PASS |
| `npm run check:home-rail-banner-settings` | PASS — 111/111 checks |
| `npm run check:phase-3du-mobile-home-ad-banner` | PASS — 59/59 checks |
| `npm run build` | PASS |
| `git diff --check` | PASS |
