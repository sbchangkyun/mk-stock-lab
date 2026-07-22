# Phase 3C.12 Home Rail Preview Fallback Result v0.1

Date: 2026-06-19

## Status And Scope

Status: implementation and local validation completed.

Phase 3C.12 added a guaranteed visible, Home-only, query-only in-page preview fallback panel for owner smoke testing at `/?railPreview=1`. The work did not start Phase 3D and did not add provider, analytics, database, deployment, or external asset behavior.

## Files Changed

- `src/pages/index.astro`
- `src/components/HomeRailPreviewPanel.astro`
- `src/styles/style.css`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`
- `docs/planning/phase_3c12_home_rail_preview_fallback_result_v0.1.md`

## Owner Phase 3C.11 Smoke Feedback Summary

- Normal Home below the wide-desktop breakpoint hid the rail as expected.
- `/?railPreview=1` still did not visibly show the fixed rail in the owner browser.
- Rotation and hover pause could not be confirmed because the fixed rail remained invisible.
- Non-Home preview route isolation passed for Portfolio, Chart AI, and Lab.
- Header auth stability, hidden checking label, `Today: 000`, real visitor-count inactive state, Portfolio lock UI, bottom-sheet motion, Portfolio refresh icon, Chart AI prefill, and console safety passed.

## Root-Cause Assessment

Phase 3C.11 marker, inline style, and CSS hardening were still insufficient in the owner browser. Fixed route isolation was not the problem: the rail remained Home-only. The visible failure was tied to relying on the fixed right-rail surface as the only acceptance surface. Phase 3C.12 therefore adds a guaranteed in-page fallback preview surface inside Home content.

## Fallback Preview Panel Summary

- Added `src/components/HomeRailPreviewPanel.astro`.
- Rendered the panel only from `src/pages/index.astro` when `railPreview=1` is present.
- Placed the panel above the hero section so it appears immediately in the normal local viewport.
- Added the required marker `data-home-rail-preview-panel`.
- Added the required class `home-rail-preview-panel`.
- Added the visible label `HOME RAIL PREVIEW`.
- Added concise owner-facing helper copy: `Preview mode only: 2 sample banners / 5s rotation.`
- The panel does not render on normal `/`.
- The panel does not render on non-Home routes.

## Banner Image Fallback Summary

- Reused `src/data/homeAdBanners.json`.
- Reused the two existing local sample SVG banners.
- Did not add or download external assets.
- Each carousel card includes a visible text fallback:
  - `Sample Banner 01`
  - `Sample Banner 02`
- Added small side thumbnails so both sample banner entries are visible immediately in the panel.

## Carousel Behavior Summary

- The fallback panel uses a preview-specific carousel script.
- Two active sample banners rotate every 5 seconds.
- The carousel uses left-slide `translateX(-${activeIndex * 100}%)`.
- The active index is exposed through `data-preview-banner-index` on `data-preview-banner-track`.
- Banner cards use `data-preview-banner-card`.

## Hover Pause Summary

- Hover pause is implemented on the fallback panel with `mouseenter`.
- Hover resume is implemented with `mouseleave`.
- Browser hover verification remains part of owner smoke because the in-app browser backend was unavailable.

## Reduced-Motion Preservation Summary

- The fallback carousel checks `prefers-reduced-motion: reduce`.
- Reduced motion changes transition duration to `0ms`.
- CSS also reduces fallback track transition duration under `prefers-reduced-motion: reduce`.

## Fixed Rail Behavior Decision

The fixed rail remains the normal production rail for `/`. During `/?railPreview=1`, the fixed rail is hidden by not rendering `HomeRailAd`; the in-page fallback panel is the single preview acceptance surface. This avoids confusing duplicate preview surfaces and stops owner smoke from depending on the repeatedly invisible fixed rail.

## Normal Production Breakpoint Preservation

- Normal `/` behavior remains unchanged.
- The production fixed rail remains hidden below `1660px`.
- The production fixed rail remains available for wide desktop normal Home.
- `.site-main` width was not changed.

## Non-Home Route Isolation Preservation

- The fallback panel is imported only by `src/pages/index.astro`.
- Non-Home preview routes do not render `data-home-rail-preview-panel`.
- Non-Home preview routes do not render `home-rail-preview-panel`.
- Non-Home preview routes do not render `data-home-rail-ad`.
- Lab detail preview routes remain rail-free and panel-free.

## Owner Preview Smoke Instructions

Use these URLs:

- Home preview fallback: `/?railPreview=1`
- Non-Home preview checks:
  - `/portfolio?railPreview=1`
  - `/chart-ai?railPreview=1`
  - `/lab?railPreview=1`
  - `/heatmap?railPreview=1`

Expected results:

- `/?railPreview=1`: in-page panel appears near the top of Home content.
- The panel shows `HOME RAIL PREVIEW`.
- The panel shows sample banner images or the text fallback labels.
- The carousel rotates every 5 seconds.
- Hover pauses rotation if tested.
- Non-Home preview URLs do not show the panel or fixed rail.
- `/` without preview still follows the wide-desktop production breakpoint.

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
- `/` rendered production rail DOM and no fallback panel.
- `/?railPreview=1` rendered `data-home-rail-preview-panel`, `home-rail-preview-panel`, `HOME RAIL PREVIEW`, two `data-preview-banner-card` markers, and both sample fallback labels.
- `/?railPreview=1` did not render the fixed rail marker.
- Non-Home preview routes did not render panel or rail markers.
- Two active sample banners remain configured.
- Fallback carousel interval remains 5000ms.
- Fallback left-slide transform, hover pause, and reduced-motion handling are present in source.
- Generated static browser assets did not contain server-only marker names.
- Disposable validation identifiers remained docs-only or validation-SQL-only.
- Removed legacy route strings remained absent from product source and generated output.
- Sample SVG banners did not reference external images beyond the standard SVG namespace URI.
- No logo/banner scraping, remote discovery, crawler, or external asset download code was added.
- Chart AI remained a prefill skeleton with no provider execution.
- No real visitor-count API, DB, migration, analytics, ad-event route, or tracking logic was added.
- Ignored-file coverage was confirmed for `.env*`, `.vercel`, `.vercel/output`, `dist`, `dist/`, `.astro`, `.omc`, key files, certificate files, credential files, and service-account JSON files.
- Browser visual smoke could not be completed because the in-app browser backend was unavailable.

## Updated Owner Manual Smoke Steps

Use the Phase 3C.12 section in `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`. Do not include credentials, tokens, keys, project references, environment values, secret query strings, or screenshots containing secrets.

```text
Phase 3C.12 Home 배너 Preview Fallback 재점검 결과:

* 테스트 대상: local / deployed
* 브라우저: Chrome 등
* Home 일반 접속에서 화면폭 부족 시 기존 배너 숨김 유지: 통과/실패/화면폭 충분
* `/?railPreview=1`에서 Home 본문 안에 Preview 패널이 보임: 통과/실패
* Preview 패널에 `HOME RAIL PREVIEW` 또는 식별 가능한 라벨이 보임: 통과/실패
* Preview 패널에서 Sample Banner 01/02 이미지 또는 텍스트 fallback이 보임: 통과/실패
* Preview 패널에서 2개 샘플 배너가 5초마다 전환됨: 통과/실패
* Preview 패널 hover 시 전환 일시정지: 통과/실패/미실행
* `/portfolio?railPreview=1`에서 Preview 패널 미노출: 통과/실패
* `/chart-ai?railPreview=1`에서 Preview 패널 미노출: 통과/실패
* `/lab?railPreview=1`에서 Preview 패널 미노출: 통과/실패
* `/heatmap?railPreview=1`에서 Preview 패널 미노출: 통과/실패
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
- The in-app browser backend remained unavailable during Codex validation.

## Recommended Next Action

Run the Phase 3C.12 owner smoke using `/?railPreview=1`. If it passes, choose the next planned integration phase without starting Phase 3D from this block.
