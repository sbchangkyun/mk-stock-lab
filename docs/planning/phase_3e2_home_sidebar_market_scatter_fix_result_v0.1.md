# Phase 3E.2 Home Sidebar And Market Scatter Fix Result v0.1

Date: 2026-06-20

## Status And Scope

Status: implementation and local validation completed.

Phase 3E.2 converts the Home ad rail from a viewport-fixed rail into an in-flow Home-only sidebar, fixes the Market expanded scatter modal layout, and hardens scatter chart SVG/export rendering. The scope is limited to Home layout, footer class naming, Market modal/export presentation, and planning documentation.

## Files Changed

- `src/components/Footer.astro`
- `src/components/MarketShell.astro`
- `src/lib/exportCardImage.ts`
- `src/styles/style.css`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`
- `docs/planning/phase_3e2_home_sidebar_market_scatter_fix_result_v0.1.md`

## Owner Phase 3E.1 Smoke Feedback Summary

- Home ad rail appeared and rotated, but its fixed viewport placement could enter the header/nav area and invade the footer area.
- Footer no longer followed scroll, but Home rail placement still needed a stronger layout fix.
- Heatmap fullscreen was acceptable.
- Scatter fullscreen showed a black or incorrect chart area and did not fit comfortably in one modal viewport.
- Scatter PNG export could produce a black rectangle or incorrect image.
- The fullscreen close `X` was not visually clear enough.
- Chart AI chart-first behavior, provider-call absence, Header auth label stability, `Today: 000`, and core Portfolio behavior remained acceptable.

## Root Cause Analysis

- The Home rail used `position: fixed` with viewport offsets, so it could overlap header/ticker/nav layers and remain independent from page/footer flow.
- The Phase 3E.1 rail height workaround reduced clipping but did not remove the underlying fixed-position behavior.
- The Market expanded modal used an auto-scrolling panel with a large minimum card height, which allowed internal scroll and inconsistent scatter sizing.
- Scatter export depended partly on CSS-applied SVG paint values. Browser DOM-to-image conversion can mishandle computed SVG styles and produce dark or incorrect output.
- The close icon path was a line path rendered through a button rule that primarily filled SVG paths, making the `X` visually weak.

## Home In-Flow Sidebar Fix Summary

- Home now uses a Home-only grid on `.site-main`.
- The rail remains a direct Home child and is placed in the grid right column at the desktop breakpoint.
- `.home-rail-ad` no longer uses fixed positioning, viewport `top`, viewport `right`, or special z-index placement.
- The rail remains hidden below the `1440px` breakpoint.
- At or above the breakpoint, the rail is a normal in-flow sidebar with a fixed `160px` width and full `600px` creative height.
- Footer and bottom ad remain in natural document flow.
- No production ad tracking or ad-event write was added.

## Market Fullscreen Layout Fix Summary

- The modal panel now uses a bounded grid layout with hidden overflow.
- Modal content uses `min-height: 0` grid constraints so the cloned card fits the modal body.
- Expanded scatter and heatmap cards use modal-specific sizing to avoid internal scroll.
- The modal close button is larger and more visually distinct.
- The close `X` path now uses explicit stroke attributes.

## Scatter SVG And Export Fix Summary

- Scatter SVG now includes an explicit white root background rectangle.
- Plot background, axes, points, and point label colors use explicit SVG attributes.
- The scatter chart avoids `foreignObject`, SVG filters, masks, blend modes, and external assets.
- `html-to-image` remains the browser-only export path from Phase 3E.1.
- Export filters now also exclude modal close controls.
- Heatmap export behavior is preserved.

## Carousel Preservation Summary

- Existing two local sample SVG banners remain active.
- Zero active banners still render no Home rail.
- One active banner remains static.
- Two or more active banners rotate every 5 seconds.
- Hover pause remains bound to the rail.
- Reduced-motion handling remains bound to the rail track transition.

## Route And Feature Preservation Summary

- Home rail remains Home-only because `HomeRailAd` is imported only by `src/pages/index.astro`.
- `/market` and `/heatmap` are preserved.
- `/chart-ai`, `/portfolio`, `/lab`, and Lab detail pages are preserved.
- Chart AI selected-security prefill and chart-first flow are preserved.
- Portfolio behavior, lock UI, bottom-sheet motion, refresh icon, CRUD labels, and sign-out clearing are preserved by scope.
- Header auth label stability and `Today: 000` placeholder are preserved by scope.
- `국회의원 보유 주식` remains the intended Lab label.

## Explicit Non-Goals

- No production write validation by Codex.
- No Portfolio production write calls by Codex.
- No DB mutation.
- No Auth user creation.
- No SQL.
- No Supabase CLI.
- No `psql`.
- No Vercel environment mutation.
- No deployment.
- No provider integration.
- No Chart AI provider call.
- No Chart AI usage guard implementation change.
- No real visitor-count API, DB, local counter, or analytics.
- No ad-event route or tracking.
- No real market-data fetching.
- No Trading Economics fetching or scraping.
- No OpenAI, Gemini, KIS, or OpenDART execution.
- No FX conversion.
- No valuation analytics.
- No performance analytics.
- No provider autocomplete.
- No logo or banner scraping.
- No external asset download.

## Provider Credential Status Note

Future phases may use already issued provider credentials through approved server-only boundaries. No credential values were requested, read, printed, stored, or documented in this phase.

## Validation Results

- `npm run build`: pass.
- Vercel output exists:
  - `.vercel/output/config.json`
  - `.vercel/output/functions/_render.func`
  - `.vercel/output/static`
- Local unauthenticated HTTP smoke:
  - `/`: 200
  - `/market`: 200
  - `/heatmap`: 200
  - `/portfolio`: 200
  - `/chart-ai`: 200
  - `/chart-ai?symbol=005930&name=...&market=KR`: 200
  - `/lab`: 200
  - `/lab/congress-stocks`: 200
  - `/lab/nps-portfolio`: 200
  - `/lab/sp500-sectors`: 200
  - `/lab/asset-class-returns`: 200
- Removed legacy route smoke:
  - `/seibro`: 404
  - `/api/news`: 404
  - `/api/list`: 404
  - `/api/holdings`: 404
  - `/api/stock`: 404
  - `/api/etf`: 404
  - `/api/search`: 404
- Unauthenticated POST to `/api/chart-ai/analyze`: sanitized 401.
- Rendered HTML marker checks:
  - `/` includes one `data-home-rail-ad` marker.
  - `/market`, `/heatmap`, `/portfolio`, `/chart-ai`, and `/lab` include no `data-home-rail-ad` marker.
  - Checked pages include no `HOME RAIL PREVIEW` marker.
  - Checked pages still include `Today: 000`.
- Source validation:
  - Home rail CSS uses in-flow `position: static`.
  - Home rail desktop placement uses the Home `.site-main` grid.
  - Home rail viewport keeps `160x600` dimensions.
  - Carousel interval remains `5000ms`.
  - Hover pause and reduced-motion hooks remain.
  - Scatter SVG has explicit white background, plot background, axis strokes, point colors, and point label colors.
  - Scatter source does not add `foreignObject`, SVG filter, mask, or blend-mode export paths.
  - Footer wrapper is no longer named or styled as a fixed bottom area.
- Secret and boundary scans:
  - No provider secret marker names were found in generated static assets.
  - No service-role marker names were found in generated static assets.
  - Expected server-only service-role references remain in server helper/API source.
  - Expected public Supabase browser helper references remain in client auth source; no values are documented here.
  - Disposable validation identifiers remain docs/validation-only.
- Removed legacy route string scan:
  - No removed legacy route strings were found in product source or generated output.
- Browser automation:
  - In-app browser automation was unavailable in this environment.
  - Owner Chrome visual/export smoke remains required.

## Owner Manual Smoke Steps

```text
Phase 3E.2 Home 광고/시장 산점도 재점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- Home 일반 접속에서 오른쪽 광고 배너가 헤더/메뉴와 겹치지 않음: 통과/실패/화면폭 부족
- Home 일반 접속에서 오른쪽 광고 배너가 footer 또는 하단 광고와 겹치지 않음: 통과/실패/화면폭 부족
- Home 광고 배너가 2개 샘플로 5초마다 전환됨: 통과/실패/미실행
- Home 광고 배너 hover 시 전환 일시정지: 통과/실패/미실행
- `/chart-ai`, `/portfolio`, `/lab`, `/market`, `/heatmap`에서 Home 광고 배너 미노출: 통과/실패
- Market 산점도 카드 확대 보기에서 차트가 검은 영역 없이 표시됨: 통과/실패
- Market 산점도 카드 확대 보기가 한 화면 안에 표시되고 내부 스크롤이 과하지 않음: 통과/실패
- Market 확대 보기 닫기 X가 명확히 보임: 통과/실패
- Market 산점도 PNG 저장 시 검은 사각형 없이 저장됨: 통과/실패/미실행
- Market Heatmap PNG 저장은 유지됨: 통과/실패/미실행
- Chart AI 차트 우선 UX 유지: 통과/실패
- Chart AI 선택 종목 프리필 유지: 통과/실패
- Portfolio 주요 기능 유지: 통과/실패/미실행
- Header 로그인 라벨 안정성 유지: 통과/실패
- `Today: 000` placeholder 유지: 통과/실패
- 실제 방문자 집계가 아직 동작하지 않음: 통과/실패
- OpenAI/Gemini/KIS/OpenDART/Trading Economics 실제 호출 없음: 통과/실패
- 브라우저 콘솔에 token/key/raw DB error/stack trace 노출 없음: 통과/실패
- 비밀 정보 없는 메모:
```

## Remaining Risks

- Owner Chrome smoke is still required for final visual/export confirmation because browser automation may be unavailable in the Codex environment.
- DOM-to-image export remains browser-dependent, though the scatter SVG now avoids the known fragile paths.
- Market data remains static sample data.

## Recommended Next Action

Run the Phase 3E.2 owner manual smoke in Chrome. If it passes, the next phase can focus on the next explicitly approved provider or data integration boundary.
