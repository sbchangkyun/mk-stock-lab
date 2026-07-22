# Phase 3DV-HF1-DEPLOY-VERIFY - Production Deployment Alias and Asset Verification Result

## 1. Status

Investigation completed. Canonical production is serving the HF1 deployment artifact; `Phase 3DV-HF1-Retry` is required for the remaining production layout issue.

## 2. Owner Report

Local HF1 review passed, but production mobile continued to show the right-side blank area and desktop-scaled layout behavior.

## 3. Local Source Verification

- **Branch**: `rebuild/phase-1-ia-shell`
- **Starting HEAD**: `6a94659 docs: record mobile viewport hotfix deployment`
- **Tracked tree before investigation**: clean
- **Implementation commit**: `b04a79d fix: restore mobile viewport responsiveness`
- **Layout viewport marker**: PASS - `width=device-width`, `initial-scale=1`, and `viewport-fit=cover` are present; fixed-width and zoom-blocking directives are absent.
- **CSS global markers**: PASS - `html` / `body` width ceiling, `body` overflow guard, and `.site-main` shrink rules are present.
- **Shared containment**: PASS - `.site-main > *`, Home, Chart AI, Market, Lab, Portfolio, and MyPage route shells are included.
- **Static check**: `npm run check:phase-3dv-hf1-mobile-viewport` PASS (47/47).
- **Deployment contract check**: `npm run check:phase-3dv-production-deployment` PASS (32/32).
- **Production-domain check**: `npm run check:production-domain` PASS (33/33).
- **Production build**: `npm run build` PASS.
- **Whitespace validation**: `git diff --check` PASS.

## 4. Vercel Production Verification

- **Canonical URL**: `https://mkstocklab.vercel.app`
- **Local linked project count/name**: one project, exactly `mkstocklab`
- **Latest canonical production status**: READY
- **Deployment target**: production
- **Alias target**: `https://mkstocklab-h1huhdhxq-sbchangkyun-2946s-projects.vercel.app`
- **Recorded HF1 deployment URL**: `https://mkstocklab-h1huhdhxq-sbchangkyun-2946s-projects.vercel.app`
- **Alias points to recorded deployment**: yes
- **Deployment commit**: `b04a79d`, verified by the exact recorded deployment identity and matching production artifact markers. The Vercel CLI inspection JSON for this CLI deployment does not expose a Git SHA, so no unsupported metadata claim is made.
- **Wrong temporary project used**: no; inspected project name is `mkstocklab`, not `mk-stock-lab`.
- **New project or relink during verification**: no

## 5. Production HTML/CSS Verification

- **Production HTML viewport marker**: PASS - device width, initial scale, and `viewport-fit=cover` are present.
- **Forbidden viewport directives**: absent - no `user-scalable=no`, `maximum-scale=1`, `width=980`, or `width=1080`.
- **CSS asset checked**: `https://mkstocklab.vercel.app/_astro/Layout.BawJWM8C.css`
- **Global width ceiling**: PASS
- **Body overflow guard**: PASS
- **`.site-main` shrink markers**: PASS
- **Shared route-containment rule**: PASS - all required route selectors occur in the same compiled `min-width: 0; max-width: 100%` rule.
- **Result**: canonical production HTML and CSS contain the complete Phase 3DV-HF1 artifact markers.

## 6. Public HTTP and Cache Checks

- **`/`**: HTTP 200; effective URL `https://mkstocklab.vercel.app/`; zero redirects.
- **`/mypage`**: HTTP 200; effective URL `https://mkstocklab.vercel.app/mypage`; zero redirects.
- **HTML cache policy observed**: `public, max-age=0, must-revalidate`; Vercel cache MISS at verification time.
- **CSS cache policy observed**: `public, max-age=0, must-revalidate`; Vercel cache HIT with the current HF1 marker set.
- **Cache conclusion**: the public cache returned current HF1 CSS. Cache is not established as the cause. A private-tab or cleared-site-data owner check remains useful to distinguish an already-open mobile tab from the reproducible production layout behavior.

## 7. Conclusion

**Classification**: Deployment is correct; the remaining issue is a true production layout bug - `Phase 3DV-HF1-Retry`.

The canonical alias is neither stale nor pointed at the wrong project, and production HTML/CSS are not missing the HF1 changes. No redeploy or alias correction is justified by the current evidence. The next hotfix phase should identify the remaining element that expands or visually constrains the mobile layout in a real production mobile rendering context.

## 8. Owner Action

1. Re-check once in an incognito/private mobile tab or after clearing site data for `mkstocklab.vercel.app`.
2. If the blank area remains, open `Phase 3DV-HF1-Retry` and provide the route, device/browser, viewport orientation, and a fresh screenshot.
3. Do not request a blind redeploy: the canonical alias and public assets already match the HF1 artifact.

## 9. Safety

- No secrets, Vercel project IDs, or Vercel org IDs were printed.
- No Supabase database rows were inspected.
- No SQL or migration was run.
- No Supabase Storage operation occurred.
- No Vercel environment variables were changed.
- No Vercel project was created or relinked.
- No runtime source files were changed.
- No redeployment occurred.
- No browser automation or login occurred.
- No remote push was performed.
