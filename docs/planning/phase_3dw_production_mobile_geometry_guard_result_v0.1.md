# Phase 3DW - Production Mobile Geometry Guard Result

## 1. Status

Implemented - owner-run production geometry guard ready.

## 2. Background

Phase 3DV is closed. The prior production mobile blank-area issue was caused by a fixed 728x70 footer partner ad injected into `.footer-ad-wrapper`. This phase adds a reusable guard to detect similar production mobile geometry regressions.

## 3. Guard Scope

- **Public production origin**: `https://mkstocklab.vercel.app`
- **Routes**: `/`, `/chart-ai`, `/market`, `/lab`, `/portfolio`, `/mypage`
- **Viewports**: 390x844, 412x915, 430x932
- **Login modal state**: opened from the public `#open-login-btn` without entering credentials, then measured at each viewport
- **Metrics**: `innerWidth`, `innerHeight`, document client/scroll width, body client/scroll width, and visual viewport width/height
- **Pass threshold**: document/body client and scroll widths must each be less than or equal to `innerWidth + 2`; the login modal panel must also fit within that limit

## 4. Safety Model

- No login or credential entry.
- No cookies, local storage, or session storage reads.
- No screenshots.
- No page text collection.
- No request or response body logging.
- Public routes only.
- Explicit guard variable required for production execution.
- Disposable browser profile; the owner browser profile is not used.
- Sanitized output is limited to numeric geometry and short tag/id/class metadata.

## 5. Implementation Summary

- **Script**: `scripts/owner_check_production_mobile_geometry.mjs`
- **Package command**: `npm run guard:production-mobile-geometry`
- **Browser automation strategy**: dependency-free Chrome DevTools Protocol automation through an installed Chrome or Edge executable and Node's built-in web APIs
- **Dependency decision**: no Playwright, Puppeteer, or other heavy browser dependency was added
- **Fallback behavior**: if no supported browser executable is available, the script exits safely with `NOT_EXECUTED_BROWSER_UNAVAILABLE` and emits a sanitized DevTools Console geometry snippet
- **Offender reporting**: failures report only the top 25 elements, sorted by greatest overflow, using truncated tag/id/class values and numeric bounds

## 6. Validation

- `check:phase-3dw-production-mobile-geometry-guard`: PASS (58/58)
- Guard dry-run: PASS (`DRY_RUN`; no browser launch or network request)
- Guard production run: PASS (21/21 public route/state/viewport combinations)
- Production width result: document and body widths matched 390px, 412px, and 430px exactly; login modal panel widths were 350px, 372px, and 390px
- Origin rejection checks: PASS for a non-canonical public origin and an unguarded local origin
- Prior closeout checker: PASS (41/41)
- Retry overflow checker: PASS (41/41)
- Production domain checker: PASS (33/33)
- Build: PASS
- `git diff --check`: PASS

## 7. Usage

Dry-run:

```bash
npm run guard:production-mobile-geometry
```

Production public check:

```bash
# macOS/Linux
PHASE_3DW_ALLOW_PRODUCTION_GEOMETRY=YES npm run guard:production-mobile-geometry
```

```powershell
# Windows PowerShell
$env:PHASE_3DW_ALLOW_PRODUCTION_GEOMETRY="YES"; npm run guard:production-mobile-geometry; Remove-Item Env:\PHASE_3DW_ALLOW_PRODUCTION_GEOMETRY
```

Optional explicit canonical target:

```powershell
$env:PHASE_3DW_TARGET_ORIGIN="https://mkstocklab.vercel.app"
$env:PHASE_3DW_ALLOW_PRODUCTION_GEOMETRY="YES"
npm run guard:production-mobile-geometry
Remove-Item Env:\PHASE_3DW_ALLOW_PRODUCTION_GEOMETRY
Remove-Item Env:\PHASE_3DW_TARGET_ORIGIN
```

Approved local development check:

```powershell
$env:PHASE_3DW_TARGET_ORIGIN="http://localhost:4321"
$env:PHASE_3DW_ALLOW_LOCAL_GEOMETRY="YES"
npm run guard:production-mobile-geometry
Remove-Item Env:\PHASE_3DW_ALLOW_LOCAL_GEOMETRY
Remove-Item Env:\PHASE_3DW_TARGET_ORIGIN
```

## 8. Result Interpretation

- **PASS**: all 21 route/state/viewport combinations satisfy the two-pixel document/body width tolerance, and every measured login modal panel fits the viewport.
- **FAIL**: at least one route or modal state exceeds the width threshold or cannot be safely measured. Review its sanitized top-offender list before changing runtime code.
- **Browser automation unavailable**: no supported installed browser executable was found. The script prints a sanitized manual console snippet and records the production run as not executed rather than claiming a pass.
- **Next action after failure**: open a separate diagnosis/hotfix phase, reproduce the failing route and viewport, and inspect only the reported geometry boundary. Do not deploy from this guard phase.

## 9. Safety

- No secrets were read or printed.
- No Supabase database rows were inspected.
- No SQL or migration was performed.
- No Supabase Storage operation was performed.
- No runtime source, API route, provider, auth, or database logic was changed.
- No Vercel environment or project setting was changed.
- No deployment was performed.
- No remote push was performed.
