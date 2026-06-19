# Phase 3C.11 Home Rail Preview Visibility Fix Result v0.1

Date: 2026-06-19

## Status And Scope

Status: implementation and local validation completed.

Phase 3C.11 hard-fixed the Home rail preview visibility path for owner smoke testing. The work stayed limited to Home rail preview display, carousel support validation, route-isolation preservation, and planning documentation.

## Files Changed

- `src/components/HomeRailAd.astro`
- `src/styles/style.css`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`
- `docs/planning/phase_3c11_home_rail_preview_visibility_fix_result_v0.1.md`

## Owner Phase 3C.10 Smoke Feedback Summary

- Normal Home below the wide-desktop breakpoint hid the rail as expected.
- `/?railPreview=1` did not visibly show the rail in the owner browser.
- Rotation and hover pause could not be confirmed because the rail was not visible.
- Non-Home preview route isolation passed for Portfolio, Chart AI, and Lab.
- Header auth stability, hidden checking label, `Today: 000`, real visitor-count inactive state, Portfolio lock UI, bottom-sheet motion, Portfolio refresh icon, Chart AI prefill, and console safety passed.

## Root-Cause Analysis

The Phase 3C.10 route and marker logic was correct, but the visual preview path was not hard enough. The prior implementation relied on a class-only display override and ordinary CSS cascade behavior, while validation checked rendered markers rather than browser computed visibility and bounding boxes. Owner smoke showed that marker presence was not enough to guarantee visible placement in the local browser path.

The issue was not a non-Home route import problem. `HomeRailAd` remains imported only by the Home route.

## Preview Visibility Fix Summary

- Added a server-rendered inline root visibility style when Home preview mode is active.
- Added a stronger data-attribute CSS override for `.home-rail-ad[data-home-rail-preview="true"]`.
- Preserved the existing `.home-rail-ad.rail-preview` preview class path.
- Forced preview mode to use visible display, visibility, opacity, pointer events, fixed positioning, safe right/top values, width, and z-index.
- Kept preview positioning inside the viewport with a preview-specific max-height.
- Did not reserve layout space for preview mode.
- Did not change `.site-main` width.
- Did not show the rail on non-Home routes.

## CSS And DOM Marker Summary

- Home rail root marker remains `data-home-rail-ad`.
- Home preview marker remains `data-home-rail-preview="true"`.
- Home preview class remains `rail-preview`.
- Home preview inline style includes display, visibility, opacity, pointer events, fixed position, top, right, width, and z-index.
- CSS override selectors:
  - `.home-rail-ad[data-home-rail-preview="true"]`
  - `.home-rail-ad.rail-preview`
- Preview-specific rail viewport, track, card, and image height now use viewport-safe sizing.

## Client-Side Fallback Summary

Added a query-only Home rail client fallback. On Home only, where the rail component already exists, the rail script reads `railPreview=1` from `window.location.search` and reapplies the `rail-preview` class plus `data-home-rail-preview="true"`. It does not use localStorage or sessionStorage.

## Rotation Verification And Fix Summary

- Two active sample banners remain configured.
- The carousel script still starts only when at least two cards exist.
- The interval remains `5000ms`.
- Left-slide behavior remains implemented with `translateX(-${activeIndex * 100}%)`.
- Preview-specific sizing now ensures the track and cards have visible dimensions below the production breakpoint.
- Browser visual verification could not run because the in-app browser backend was unavailable.

## Hover Pause Verification And Fix Summary

- Hover pause remains implemented through `mouseenter` calling `stop`.
- Hover resume remains implemented through `mouseleave` calling `start`.
- Browser hover verification remains part of the owner manual smoke because the browser backend was unavailable to Codex.

## Reduced-Motion Preservation Summary

- The script still checks `prefers-reduced-motion: reduce`.
- The CSS reduced-motion override for the rail track remains present.
- Reduced motion keeps the same carousel state changes with shortened transition duration.

## Zero/One/Two-Plus Behavior Preservation

- Zero active banners: no rail DOM is rendered.
- One active banner: static rail renders without carousel behavior.
- Two or more active banners: carousel behavior runs.

## Normal Production Breakpoint Preservation

- Normal `/` behavior remains unchanged.
- The rail remains hidden below `1660px` unless Home preview mode is active.
- The wide-desktop production rail placement remains in the `min-width: 1660px` media query.

## Non-Home Route Isolation Preservation

- `HomeRailAd` remains imported only by `src/pages/index.astro`.
- `/portfolio?railPreview=1`, `/chart-ai?railPreview=1`, and `/lab?railPreview=1` do not render Home rail DOM.
- Lab detail routes remain rail-free.

## Owner Preview Smoke Instructions

Use these URLs:

- Home preview: `/?railPreview=1`
- Non-Home preview checks:
  - `/portfolio?railPreview=1`
  - `/chart-ai?railPreview=1`
  - `/lab?railPreview=1`

Expected results:

- `/?railPreview=1`: Home rail is visible inside the browser viewport.
- `/?railPreview=1`: two sample banners rotate every 5 seconds.
- `/?railPreview=1`: hover pauses rotation if tested.
- Non-Home preview URLs do not show the rail.
- `/` without preview still follows the wide-desktop breakpoint.

## Preserved Behavior

- Real visitor counting remains unimplemented.
- Ad-event tracking remains unimplemented.
- Header auth label stability is preserved.
- `Today: 000` remains a display-only placeholder.
- Chart AI selected-security prefill remains preserved.
- Portfolio lock UI, CRUD flow boundaries, position CRUD flow boundaries, sign-out clearing, re-login reload, logo/fallback avatar, country badge, ordering/sorting controls, compact money formatting, and currency toggle remain preserved.
- Lab `국회의원 보유 주식` label remains present.
- Pretendard and Korean UI remain preserved.

## Service-Role Boundary Preservation

- No service-role key was moved into browser code.
- No server-only helper was intentionally imported into client-executed scripts.
- No Supabase connection, SQL command, Supabase CLI command, `psql`, or DB command was run by Codex.

## Explicit Non-Goals

- No production write validation by Codex.
- No Portfolio production write calls by Codex.
- No DB mutation.
- No Auth user creation.
- No Vercel environment mutation.
- No deployment.
- No provider integration.
- No Chart AI provider call.
- No Chart AI usage guard implementation.
- No real visitor-count API or DB.
- No ad-event route.
- No analytics.
- No FX conversion.
- No valuation analytics.
- No performance analytics.
- No provider autocomplete.
- No logo or banner scraping.
- No external asset download.

## Provider Credential Status Note

KIS REST API APP KEY, KIS REST API APP Secret, and OpenDART API KEY have been issued for future phases. No actual values were requested, read, printed, summarized, or recorded.

## Validation Results

- Normal `npm run build` passed.
- `.vercel/output/config.json`, `.vercel/output/functions/_render.func`, and `.vercel/output/static` were generated.
- Local unauthenticated HTTP smoke returned 200 for required active and preview routes.
- Removed legacy routes returned 404.
- `/` rendered rail DOM without the preview marker.
- `/?railPreview=1` rendered rail DOM with the preview marker, preview class, and inline visibility style.
- Non-Home preview routes did not render rail DOM.
- Two active sample banners remain configured.
- Rotation interval remains 5000ms.
- Left-slide transform, hover pause, and reduced-motion handling remain present in source.
- Generated static browser assets did not contain server-only marker names.
- Disposable validation identifiers remained docs-only or validation-SQL-only.
- Removed legacy route strings remained absent from product source and generated output.
- Sample SVG banners did not reference external images.
- No logo/banner scraping, remote discovery, crawler, or external asset download code was added.
- Chart AI remained a prefill skeleton with no provider execution.
- No real visitor-count API, DB, migration, analytics, ad-event route, or tracking logic was added.
- Ignored-file coverage was confirmed for `.env*`, `.vercel`, `.vercel/output`, `dist`, `dist/`, `.astro`, `.omc`, key files, certificate files, credential files, and service-account JSON files.
- Browser visual smoke could not be completed because the in-app browser backend was unavailable and local Playwright was not installed.

## Updated Owner Manual Smoke Steps

Use the Phase 3C.11 section in `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3C.11 Home 배너 Preview 표시 재점검 결과:

* 테스트 대상: local / deployed
* 브라우저: Chrome 등
* Home 일반 접속에서 화면폭 부족 시 배너 숨김 유지: 통과/실패/화면폭 충분
* `/?railPreview=1`에서 Home 배너가 실제 화면 안에 보임: 통과/실패
* `/?railPreview=1`에서 배너 위치가 화면 오른쪽에 정상 표시됨: 통과/실패
* `/?railPreview=1`에서 2개 샘플 배너가 5초마다 왼쪽 슬라이드 전환: 통과/실패
* `/?railPreview=1`에서 배너 hover 시 전환 일시정지: 통과/실패/미실행
* `/portfolio?railPreview=1`에서 배너 미노출: 통과/실패
* `/chart-ai?railPreview=1`에서 배너 미노출: 통과/실패
* `/lab?railPreview=1`에서 배너 미노출: 통과/실패
* 로그인 상태에서 메뉴 이동 중 `로그아웃` 유지 및 `로그인` 순간 노출 없음: 통과/실패
* 메뉴 이동 중 불필요한 `확인 중` 표시 없음: 통과/실패
* 헤더의 연한 회색 `Today: 000` 표시 유지: 통과/실패
* 실제 방문자 집계가 아직 동작하지 않음: 통과/실패
* 포트폴리오 잠금 UI 유지: 통과/실패
* 바텀시트 모션 유지: 통과/실패
* 포트폴리오 새로고침 아이콘 유지: 통과/실패
* Chart AI 선택 종목 프리필 유지: 통과/실패
* 콘솔 비밀값/token/raw error 노출 없음: 통과/실패
* 비밀 정보 없는 메모:
```

## Remaining Risks

- Owner visual smoke is still required to confirm perceived slide motion and hover pause in the target browser.
- The in-app browser backend remained unavailable during Codex validation, and local Playwright was not installed.

## Recommended Next Action

Run the Phase 3C.11 owner smoke using `/?railPreview=1`. If it passes, choose the next planned integration phase without starting Phase 3D from this block.
