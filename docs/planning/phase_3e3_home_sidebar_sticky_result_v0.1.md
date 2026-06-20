# Phase 3E.3 Home Sidebar Sticky Result v0.1

Date: 2026-06-20

## Status And Scope

Status: implementation completed; validation results are recorded below after the local validation run.

Phase 3E.3 adds safe sticky behavior to the existing Home in-flow right ad sidebar. The work is limited to Home rail CSS and planning documentation. It preserves the Phase 3E.2 Market scatter fullscreen/export fixes, Chart AI chart-first UX, Portfolio behavior, Header auth label stability, and `Today: 000`.

## Files Changed

- `src/styles/style.css`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`
- `docs/planning/phase_3e3_home_sidebar_sticky_result_v0.1.md`

## Owner Phase 3E.2 Smoke Feedback Summary

- Home ad no longer overlapped the footer or footer ad after conversion to in-flow placement.
- Home ad rotation, hover pause, and non-Home absence passed.
- Market scatter fullscreen and scatter PNG export no longer showed black boxes.
- Heatmap PNG export, Chart AI chart-first UX, selected-security prefill, Portfolio, Header auth, `Today: 000`, console safety, and provider-call absence remained acceptable.
- Remaining correction: the Home ad was too static while scrolling and needed safe scroll-follow behavior without returning to unsafe fixed viewport positioning.

## Home Sidebar Sticky Behavior Summary

- The outer `.home-rail-ad` remains in the Home grid right column and remains `position: static`.
- The inner `.home-rail-viewport` now uses `position: sticky`.
- The sticky rail follows scroll within the Home content area and remains constrained by the Home sidebar grid item.
- The rail remains hidden below the `1440px` breakpoint.
- The rail remains full `160x600` at or above the breakpoint.

## Reason Fixed Rail Was Not Reintroduced

The prior fixed rail could collide with header/nav/ticker and footer areas because it was independent of document flow. Phase 3E.3 keeps the rail in normal Home layout flow and uses sticky positioning only inside the sidebar, so the rail can follow scrolling while still stopping with its parent content.

## Sticky Top Offset Strategy

- A Home-only custom property, `--home-rail-sticky-top`, is set on `body.home-page .site-main`.
- The current value is `112px`.
- The offset leaves comfortable space below the sticky primary nav/header stack during scroll.
- The value is local to the Home page shell and does not affect Market, Portfolio, Chart AI, Lab, or modal layouts.

## Parent Overflow And Sticky-Blocker Audit Summary

- The Home `.site-main` grid does not set `overflow`.
- `.hero-section`, `.grid-4`, and `.home-rail-ad` do not set overflow that would block sticky behavior.
- `.home-rail-viewport` keeps `overflow: hidden` only for carousel clipping; this does not create an ancestor sticky blocker.
- Market modal overflow rules remain scoped to `.market-card-modal*` selectors and were not changed.

## Collision Prevention Summary

- Header/nav/ticker: sticky top offset keeps the rail below the visible sticky nav area.
- Main content: the rail remains in its own right grid column and does not overlay the main column.
- Footer/footer ad: the rail remains constrained by the Home content grid and naturally scrolls away before the footer/footer ad region.
- Footer/footer ad remains in normal document flow and does not become fixed or sticky.

## Banner Carousel Preservation Summary

- Existing local sample SVG banners are preserved.
- Zero active banners still render no rail.
- One active banner remains static.
- Two or more active banners rotate every 5 seconds.
- Hover pause remains.
- Reduced-motion handling remains.
- No ad-event tracking, outbound click tracking, or analytics was added.

## Non-Home Isolation Preservation Summary

- `HomeRailAd` remains imported only by `src/pages/index.astro`.
- `/market`, `/heatmap`, `/portfolio`, `/chart-ai`, `/lab`, and Lab detail routes do not render Home rail markup.

## Market Scatter Fullscreen And Export Preservation Summary

- Scatter SVG explicit white/light surfaces are preserved.
- Scatter cards still avoid `foreignObject`, SVG filters, masks, blend modes, and black overlay elements.
- Fullscreen modal close button and ESC close behavior are preserved.
- Browser-only PNG export remains local-only and does not upload or store files.
- Heatmap export is preserved.

## Chart AI Preservation Summary

- Chart AI remains chart-first.
- The question input remains removed.
- The chart-load button remains.
- Daily, weekly, and monthly interval controls remain in the chart area.
- Query prefill remains.
- `AI 분석 실행` remains a follow-up action after chart readiness.
- The Phase 3D server-only usage guard skeleton remains.

## Portfolio, Header, And Today Preservation Summary

- Portfolio behavior is preserved by scope.
- Header auth label stability is preserved by scope.
- `Today: 000` remains a placeholder.
- No real visitor count was implemented.

## Explicit Non-Goals

- No real provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No Trading Economics scraping or fetching was implemented.
- No DB migration was added.
- No direct SQL was run.
- No Supabase CLI was run.
- No `psql` was run.
- No production authenticated write validation was performed by Codex.
- No Auth user was created.
- No Vercel environment mutation was performed.
- No deployment was run.
- No real visitor count was implemented.
- No ad-event tracking was implemented.
- No FX conversion, valuation analytics, performance analytics, provider autocomplete, logo/banner scraping, remote discovery, or external asset download was implemented.

## Security Notes

- No browser service-role exposure was added.
- No token logging was added.
- No raw DB errors were added to browser-visible UI.
- No provider secrets were requested, read, recorded, or printed.
- Chart AI continues to rely on the server boundary for authenticated execution.

## Validation Results

- `npm run build`: pass.
- Vercel output exists:
  - `.vercel/output/config.json`
  - `.vercel/output/functions/_render.func`
  - `.vercel/output/static`
- Local unauthenticated HTTP smoke:
  - `/`: 200
  - `/portfolio`: 200
  - `/chart-ai`: 200
  - `/chart-ai?symbol=005930&name=...&market=KR`: 200
  - `/lab`: 200
  - `/heatmap`: 200
  - `/market`: 200
- Removed legacy routes returned 404:
  - `/seibro`
  - `/api/news`
  - `/api/list`
  - `/api/holdings`
  - `/api/stock`
  - `/api/etf`
  - `/api/search`
- Unauthenticated POST to `/api/chart-ai/analyze`: sanitized 401.
- Rendered HTML marker checks:
  - `/` includes one `data-home-rail-ad` marker.
  - `/market`, `/heatmap`, `/portfolio`, `/chart-ai`, and `/lab` include no `data-home-rail-ad` marker.
  - Checked pages include no `HOME RAIL PREVIEW` marker.
  - Checked pages still include `Today: 000`.
- Source validation:
  - `.home-rail-ad` remains `position: static`.
  - `.home-rail-viewport` uses `position: sticky`.
  - `--home-rail-sticky-top` is `112px`.
  - Desktop Home grid still uses a `176px` right sidebar column.
  - Home rail viewport keeps `160x600` dimensions.
  - Carousel interval remains `5000ms`.
  - Hover pause and reduced-motion hooks remain.
  - Footer wrapper remains `.bottom-document-area` with static positioning.
  - Market scatter SVG explicit white/light surface and point colors remain.
- Secret and boundary scans:
  - No provider secret marker names were found in generated static assets.
  - No service-role marker names were found in generated static assets.
  - Expected server-only service-role references remain in server helper/API source.
  - Expected public Supabase browser helper references remain in client auth source; no values are documented here.
  - Disposable validation identifiers remain docs/validation-only.
- Removed legacy route string scan:
  - No removed legacy route strings were found in product source or generated output.
- Provider and Trading Economics scans:
  - No OpenAI, Gemini, KIS, OpenDART, Trading Economics, or market-data execution code was found.
  - No Trading Economics scraping or fetching code was found.
- Visitor/ad-event scans:
  - No real visitor-count implementation was added.
  - No ad-event write/tracking route was added.
- Browser automation:
  - In-app browser automation was unavailable in this environment.
  - Owner Chrome visual smoke remains required for final sticky behavior confirmation.

## Owner Manual Smoke Steps

```text
Phase 3E.3 Home 광고 Sticky 보정 점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- Home 광고 배너가 본문 오른쪽 영역에 표시됨: 통과/실패/화면폭 부족
- Home 광고 배너가 스크롤 중 일정 위치에서 따라옴: 통과/실패
- Home 광고 배너가 header/nav/ticker 영역을 침범하지 않음: 통과/실패
- Home 광고 배너가 footer/footer ad 영역을 침범하지 않음: 통과/실패
- footer 근처에서 Home 광고 배너가 자연스럽게 멈추거나 본문과 함께 벗어남: 통과/실패
- Home 광고 배너가 2개 샘플로 5초마다 전환됨: 통과/실패/미실행
- Home 광고 배너 hover 시 전환 일시정지: 통과/실패/미실행
- 비 Home 페이지에서 Home 광고 배너 미노출: 통과/실패
- Market 산점도 카드 확대 보기에서 차트가 검은 영역 없이 표시됨: 통과/실패
- Market 산점도 PNG 저장 시 검은 사각형 없이 저장됨: 통과/실패/미실행
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

- Owner Chrome smoke is still required for final visual confirmation of sticky scroll behavior and browser-dependent PNG export behavior.
- The `112px` sticky top offset may need minor future adjustment if header/nav/ticker heights change.

## Recommended Next Action

Run the Phase 3E.3 owner manual smoke in Chrome. If it passes, proceed only to the next explicitly approved provider or data integration boundary.
