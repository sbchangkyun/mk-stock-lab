# Phase 3DU-OWNER-REVIEW — Mobile Home Ad Banner Owner Review Runbook

## 1. Purpose and Status

This runbook prepares the owner to manually review the Phase 3DU mobile Home banner and the expanded desktop banner controls. It does not add or change runtime behavior.

| Field | Value |
|---|---|
| Phase | 3DU-OWNER-REVIEW |
| Status | Prepared — owner manual browser/admin review pending |
| Implementation baseline | `06549cc feat: add mobile home ad banner slots` |
| Branch | `rebuild/phase-1-ia-shell` |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Production deployment | Not performed |
| Review executor | Owner only |

Codex does not start the dev server, open a browser, call Supabase, upload files, or perform this review.

## 2. Prerequisites

- Use the local checkout at commit `06549cc` or a later explicitly approved review-preparation commit.
- Use a local browser and a local development server started manually by the owner.
- Confirm the local application is configured through the owner's existing private environment. Do not reveal configuration values.
- Have access to the master/admin account and, if available, a non-admin account or signed-out session for gate verification.
- Prepare owner-controlled HTTP(S) image URLs for `160×600` PC creatives and `720×225` mobile creatives. Uploading assets is outside this runbook.
- Before editing, privately record the current active state and URLs for all PC and mobile slots so they can be restored. Do not paste this record into ChatGPT, Codex, issues, or the report.
- Use reversible test values and restore the original configuration after review.

### Owner-only local startup

The owner may start the application locally from the repository root:

```powershell
npm run dev
```

Codex must not run this command. The expected local pages are:

```text
http://localhost:4321/
http://localhost:4321/mypage
```

If the local port differs, record only the non-sensitive local URL in the report.

## 3. Safety Rules

- Do not share `.env` contents, Supabase keys, tokens, cookies, request headers, or session identifiers.
- Do not share raw database rows or Supabase responses. Banner URLs may contain private project identifiers; treat them as sensitive unless explicitly approved for sharing.
- Do not share screenshots exposing email addresses, account details, admin/session data, private URLs, browser storage, or developer-tool payloads.
- Do not share Network-tab request or response bodies.
- Do not paste secrets or sensitive values into the report template.
- Do not test against the production URL. Phase 3DU has not been deployed.
- Do not run SQL, migrations, Vercel commands, deployment commands, live smoke scripts, or external-provider diagnostics.
- Share only pass/fail status, sanitized issue descriptions, viewport width, and non-sensitive browser/version information.

## 4. Baseline and Recovery Record

Before changing any banner setting, privately record:

- PC slots 1–5: active state and whether image/link/alt values are present.
- Mobile slots 1–5: active state and whether image/link/alt values are present.
- Which PC banner is currently visible at 1440px or wider.
- Whether the Home page currently has zero, one, or multiple active mobile banners.

Do not copy raw URLs into the shared report. At the end of the review, restore this baseline and reload both MyPage and Home to confirm restoration.

## 5. Owner Review Steps

### A. Admin gate and MyPage structure

1. Open `http://localhost:4321/mypage` while signed out or as a non-admin user.
2. Confirm the banner admin panel and its controls are not exposed before admin verification.
3. Sign in with the master/admin account and reload MyPage.
4. Confirm the banner admin panel appears only after admin verification.
5. Expand the banner administration accordion.
6. Confirm the `PC Home` subsection shows size guidance `160×600` and slots 1–5.
7. Confirm the `Mobile Home` subsection shows size guidance `720×225` and slots 1–5.
8. For every slot, confirm the presence of:
   - active checkbox;
   - image URL input;
   - link URL input;
   - alt text input;
   - preview area when a valid image URL is entered.
9. Confirm there is no file upload input and no in-app Supabase Storage upload control.

### B. URL validation and preview

Use one inactive test slot and restore it afterward.

1. Enter an owner-approved HTTPS image URL. Confirm its preview appears.
2. Confirm a valid HTTP(S) image URL can be saved.
3. Test each blocked scheme as text in the image URL field, one at a time:
   - `javascript:`
   - `data:`
   - `file:`
   - `vbscript:`
4. For every blocked scheme, confirm preview remains hidden and save returns a validation failure without changing stored settings.
5. Confirm an empty link URL remains valid and produces a non-linked banner.
6. Confirm a valid HTTP(S) link URL remains accepted.

Do not use a real secret, credential-bearing URL, or uncontrolled third-party tracking URL.

### C. Save and storage compatibility

1. Reload MyPage before editing.
2. Confirm existing PC slots 1–3 remain populated and editable as expected from the pre-Phase-3DU configuration.
3. Populate PC slots 4–5 with reversible test values and save the PC group once.
4. Reload MyPage. Confirm PC slots 1–5 persist and the mobile group remains unchanged.
5. Populate mobile slots 1–5 as needed for the state tests below and save the mobile group once.
6. Reload MyPage. Confirm the mobile group persists and PC slots 1–5 remain unchanged.
7. Modify and save one group again; confirm the other group remains preserved after reload.
8. Confirm each save is presented as one group-level action, not one save action per slot.
9. If the pre-review PC settings originated from the legacy array-shaped `home_rail_banners` value, successful loading of PC slots 1–3 followed by preserved PC/mobile values after save is the compatibility acceptance signal. Do not inspect or share raw database rows.

### D. Mobile Home zero-banner state

1. In MyPage, deactivate all mobile slots or clear their image URLs and save the mobile group.
2. Open `http://localhost:4321/` at 390px width.
3. Confirm no mobile banner is visible and no empty framed banner remains.
4. Repeat at 430px and 859px.

### E. Mobile Home one-banner state

1. Activate exactly one mobile slot with a valid owner-controlled image URL and save.
2. At 390px, confirm the visible order is:
   1. Home hero containing `MY PORTFOLIO`;
   2. mobile banner;
   3. `MARKET SNAPSHOT`.
3. Wait at least 12 seconds. Confirm the single banner does not rotate or flicker.
4. Confirm the full creative is visible without cropping (`object-fit: contain`).
5. Confirm the banner keeps the `720 / 225` ratio during loading and does not visibly jump after the image appears.
6. Repeat placement and layout checks at 430px and 859px.

### F. Mobile Home multiple-banner rotation

1. Activate at least two mobile slots with distinct owner-controlled images and save.
2. At 390px, confirm the first transition occurs after approximately 5000ms.
3. Observe at least two transitions. Confirm one banner is shown at a time and rotation continues at approximately 5000ms.
4. Confirm reloading the page does not create visibly accelerated or competing rotation timers.
5. Repeat at 430px and confirm placement is unchanged.

### G. Responsive visibility boundaries

With at least one valid active mobile banner:

1. At 859px, confirm the mobile banner can appear.
2. At exactly 860px, confirm the mobile banner is hidden.
3. At a tablet/small desktop width above 860px, confirm it remains hidden.
4. At 1440px or wider, confirm the mobile placement is hidden and the PC rail is the only eligible banner placement.
5. Resize across 859px and 860px and confirm desktop and mobile placements are never visible together.

### H. PC Home rail regression at 1440px+

1. Use a viewport width of at least 1440px.
2. Confirm the PC right rail uses the existing `160×600` layout and contained image fit.
3. Confirm PC slots 1–5 are available from MyPage and eligible for display.
4. Test zero valid active PC banners: the rail remains hidden.
5. Test exactly one valid active PC banner: it appears without rotation.
6. Test two or more valid active PC banners: they rotate at approximately 5000ms.
7. Reload Home and confirm no accelerated or competing timer is visible.
8. Confirm the mobile banner placement remains hidden throughout the desktop test.

### I. Restore baseline

1. Restore the private baseline values recorded before review.
2. Save the PC group and mobile group separately.
3. Reload MyPage and Home.
4. Confirm both groups match the original state and no test URL remains.

## 6. Width Matrix

| Width | Expected result |
|---|---|
| 390px | Mobile banner eligible; order is `MY PORTFOLIO`, banner, `MARKET SNAPSHOT` |
| 430px | Same mobile order and contained creative |
| 859px | Mobile banner eligible when valid and active |
| 860px | Mobile banner hidden |
| 861px–1439px | Mobile banner hidden; PC rail not yet visible |
| 1440px+ | Mobile banner hidden; PC rail eligible |

## 7. Pass/Fail Criteria

### PASS

- All admin-gate, five-slot, preview, URL-validation, save-preservation, placement, responsive, rotation, and PC regression checks pass.
- Original banner settings are restored.
- No sensitive data is included in the shared result.

### FAIL

Any of these is blocking:

- non-admin users can see banner controls;
- PC slots 1–3 are lost or overwritten;
- saving one group erases or changes the other group;
- invalid URL schemes are saved;
- mobile banner appears at 860px or wider;
- mobile and PC placements appear together;
- zero-banner state leaves a visible empty banner;
- one-banner state rotates;
- multiple banners do not rotate near 5000ms;
- mobile creative is cropped or placement order is wrong;
- PC rail behavior regresses.

## 8. Sanitized Result Format

Complete `phase_3du_owner_review_mobile_home_ad_banner_report_template_v0.1.md` using only `PASS`, `FAIL`, `NOT TESTED`, short sanitized notes, viewport widths, and non-sensitive browser information.

Do not include raw URLs, database rows, screenshots with private data, secrets, tokens, cookies, account details, or Network-tab payloads.

## 9. Decision Routing

- PASS: Phase 3DU-OWNER-REVIEW-CLOSEOUT.
- Minor visual or responsive issue: Phase 3DU-HF1.
- Storage, admin gate, or save-preservation issue: Phase 3DU-HF2.
- PASS plus explicit owner deployment approval: Phase 3DV — Production Deployment for Mobile Home Ad Banner.
