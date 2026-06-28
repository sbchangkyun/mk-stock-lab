# Phase 3DU-HF2 — PC Banner Admin Save Persistence Hotfix Result

## 1. Status

Implemented on `rebuild/phase-1-ia-shell`; owner re-test pending.

- Starting HEAD: `18dcc83 docs: prepare mobile home ad banner owner review`
- Owner-reported issue: PC slot 2 link URL and PC slot 3 active state reverted after save/reload.
- Mobile save observation: appeared to persist normally.
- Production deployment: not performed.

## 2. Source Investigation

The PC and mobile form paths both collect all five slots and include `active`, `imageUrl`, `linkUrl`, and `alt`. Both save functions use the same object merge and preserve the opposite banner group. `HomeRailAd.astro` filters managed desktop banners by `active`, a non-empty image URL, and an HTTP(S) scheme. No static sample fallback is rendered.

No PC-specific field omission or reversed merge was found in local source. Without owner credentials or live database inspection, the exact database-side reason for the reported failed write cannot be confirmed safely.

The confirmed persistence gap was that the client treated a successful upsert status as final without reading back and comparing the stored value. MyPage also left edited form values in place instead of reloading persisted state, so the UI could not immediately distinguish a verified save from a value that would later revert. Identical `저장` labels made the two independent group actions unnecessarily ambiguous.

## 3. Persistence Verification Hotfix

- The upsert now requests the stored `value` in the same response.
- The returned value is normalized through the same legacy-array/object compatibility path used by reads.
- Both `home_rail_banners` and `home_mobile_banners` are compared with the intended merged payload.
- Success is returned only when both groups match; mismatch returns a visible failure message.
- After verified success, MyPage reloads both groups before showing the result.
- PC and mobile save buttons are disabled during their writes and now have explicit labels.

## 4. Checkbox Behavior

The checkbox is the slot's `active` flag:

- checked: the slot is eligible when it also has a valid HTTP(S) image URL;
- unchecked: the slot is excluded even when an image URL exists.

Both admin subsections now state this behavior. The desktop rail already filtered by `active`; its zero-active branch now clears any stale managed cards and hides the rail during Astro client navigation.

## 5. Storage Compatibility

- Legacy array-shaped values continue to populate desktop slots 1–5, with missing slots defaulted inactive.
- Object-shaped values continue to contain `home_rail_banners` and `home_mobile_banners`.
- Desktop saves replace only the normalized desktop group and preserve current mobile settings.
- Mobile saves replace only the normalized mobile group and preserve current desktop settings.
- No database migration or new settings row was added.

## 6. Owner Re-test

1. Privately record current banner settings and use reversible test values.
2. Add a valid HTTP(S) link URL to PC slot 2.
3. Uncheck PC slot 3 and click `PC 배너 저장`.
4. Confirm the success message appears only after the form reloads.
5. Reload MyPage and confirm slot 2 link and slot 3 checkbox remain changed.
6. Reload Home at 1440px+ and confirm slot 3 is not eligible while unchecked.
7. Recheck slot 3, save, and confirm it becomes eligible again when its image URL is valid.
8. Confirm PC slots 1–5 and mobile slots 1–5 remain unchanged except for intentional edits.
9. Restore the original private baseline and verify after reload.

Share only PASS/FAIL and sanitized notes. Do not share raw URLs, database rows, secrets, cookies, session data, or screenshots exposing admin details.

## 7. Safety

- No `.env` or secret file was read.
- No live Supabase calls or database rows were inspected by Codex.
- No SQL was executed and no migration was added.
- No dev server, browser automation, smoke script, Vercel command, external API call, or push was performed.
- No production deployment was performed.
