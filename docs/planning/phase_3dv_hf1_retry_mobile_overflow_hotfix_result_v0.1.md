# Phase 3DV-HF1-Retry - Production Mobile Overflow Hotfix Result

## 1. Status

Implemented and deployed - owner production re-check pending.

Implementation commit: `9f7f4a1 fix: contain production mobile overflow`.

## 2. Background

Local HF1 review passed, but production still showed the mobile blank-area issue. Phase 3DV-HF1-DEPLOY-VERIFY confirmed production was serving the HF1 artifact, so this was a real production layout bug rather than a stale deployment.

## 3. Diagnosis

- **Routes checked**: `/`, `/chart-ai`, `/market`, `/lab`, `/portfolio`, `/mypage`, and the public login modal state.
- **Viewports checked**: 390x844, 412x915, and 430x932 with an isolated, temporary mobile Chrome profile and no login, cookies, owner profile, storage reads, or private data collection.
- **Baseline width metrics**:
  - 390px device: visual/document client width 390px; layout/document/body scroll width 559px.
  - 412px device: visual/document client width 412px; layout/document/body scroll width 570px.
  - 430px device: visual/document client width 430px; layout/document/body scroll width 579px.
- **Offending elements**: `.footer-ad-wrapper` and its injected partner-ad `ins`/iframe.
- **Offender geometry**: the 728px ad was centered from -169px to 559px at 390px, -158px to 570px at 412px, and -149px to 579px at 430px.
- **Confirmed root cause**: `Footer.astro` requests a fixed 728x70 partner ad. The centered flex wrapper had no explicit width/overflow isolation, so the injected fixed-width ad expanded the mobile layout viewport. The expanded layout width also made `100vw`-based login modal sizing too wide.
- **Non-causes confirmed**: ticker and nav descendants extend inside their intended horizontal scroll containers, but did not determine document scroll width after footer-ad containment.
- **Candidate result**: targeted footer-ad containment restored `window.innerWidth`, document/body client width, and document/body scroll width to exactly 390px, 412px, and 430px on every route/state above.

## 4. Fix Summary

- **Files changed**: `src/styles/style.css` plus focused checker and planning documentation.
- **CSS/layout behavior**: `.bottom-document-area`, `.bottom-ad-banner`, and `.footer-ad-wrapper` now use `width: 100%`, `min-width: 0`, `max-width: 100vw`, and local horizontal overflow containment. Injected footer-ad `ins`/iframe elements are capped at `max-width: 100%`.
- **Internal scroll behavior preserved**: ticker/nav, Portfolio holdings, generic tables, and Lab matrices retain their local horizontal scrolling.
- **Banner behavior preserved**: mobile Home banner remains enabled through 859px and hidden from 860px; the PC Home rail remains enabled from 1440px; the separate 320px top slide ad remains unchanged.

## 5. Validation

- `npm run check:phase-3dv-hf1-retry-mobile-overflow`: PASS (41/41)
- `npm run check:phase-3dv-hf1-mobile-viewport`: PASS (47/47)
- `npm run check:mobile-baseline`: PASS (74/74)
- `npm run check:phase-3du-mobile-home-ad-banner`: PASS (59/59)
- `npm run check:phase-3du-hf2-banner-admin-persistence`: PASS (43/43)
- `npm run check:phase-3dv-production-deployment`: PASS (32/32)
- `npm run check:production-domain`: PASS (33/33)
- `npm run build`: PASS
- `git diff --check`: PASS

## 6. Deployment

- **Performed**: yes
- **Commit**: `9f7f4a1 fix: contain production mobile overflow`
- **Deployment URL**: `https://mkstocklab-ro7hfpfq4-sbchangkyun-2946s-projects.vercel.app`
- **Canonical URL**: `https://mkstocklab.vercel.app`
- **READY**: yes
- **`/`**: HTTP 200, zero redirects
- **`/mypage`**: HTTP 200, zero redirects
- **Production CSS asset**: `https://mkstocklab.vercel.app/_astro/Layout.BL4g4Qg5.css` contains both retry containment rules
- **Production mobile geometry**: PASS (21/21 route/state/viewport combinations)
- **390px**: layout, visual, document, body, footer wrapper, injected ad, and iframe widths all 390px; login modal 350px
- **412px**: corresponding widths all 412px; login modal 372px
- **430px**: corresponding widths all 430px; login modal 390px
- **Documentation commit**: not included in the deployed artifact

## 7. Safety

- No secrets, Vercel project IDs, or Vercel org IDs were read or printed.
- No Supabase database rows were inspected.
- No SQL or migration was run.
- No Supabase Storage operation occurred.
- No API route, provider, backend, auth, or database logic was changed.
- No Vercel environment variables were changed.
- No Vercel project was created or relinked.
- Browser diagnostics used a disposable public-only profile without login or owner data.
- No remote push was performed.

## 8. Owner Re-check

After deployment, verify:

- Home, Chart AI, Market, Lab, Portfolio, and MyPage fill the mobile viewport without a right-side blank area.
- The login modal is centered and fully visible.
- The bottom ad and top slide ad do not widen the page.
- The mobile Home banner remains correctly placed through 859px.
- Portfolio and Lab dense sections retain local scrolling.
- The PC Home rail remains correct at 1440px and above.
