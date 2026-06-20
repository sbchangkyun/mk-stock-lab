# Phase 3E.4 Home Sidebar Sticky Range Fix Result v0.1

Date: 2026-06-20

## Status And Scope

Status: implementation completed; validation results are recorded below after the local validation run.

Phase 3E.4 fixes the Home sidebar ad sticky range by restructuring the Home page into a main content column and a right sidebar column inside a shared Home shell. The work preserves the in-flow sidebar architecture and does not reintroduce fixed viewport rail behavior.

## Files Changed

- `src/pages/index.astro`
- `src/styles/style.css`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`
- `docs/planning/phase_3e4_home_sidebar_sticky_range_fix_result_v0.1.md`

## Owner Phase 3E.3 Smoke Feedback Summary

- Home ad appeared in the right-side area.
- Home ad did not invade header/nav/ticker or footer/footer ad.
- Rotation, hover pause, non-Home absence, Market scatter fullscreen/export, Chart AI, Portfolio, Header auth, `Today: 000`, provider-call absence, and console safety passed.
- Remaining issue: the sticky behavior was not visually noticeable because the sticky parent did not provide a meaningful range.

## Sticky Failure Root-Cause Assessment

The sticky viewport existed, but the rail was still a direct grid item in the page main grid. Its local parent did not provide enough effective height for a visible sticky range. A sticky element needs a taller containing flow area to follow scroll and then stop when that containing area ends.

## Home Layout Wrapper And Sidebar Height Fix Summary

- Added a `home-shell` wrapper around Home content and the ad sidebar.
- Added a `home-main-column` for hero and feature cards.
- Added a `home-sidebar-column` for `HomeRailAd`.
- The Home shell switches to a two-column layout at the existing `1440px` breakpoint.
- The sidebar column stretches to the full Home shell height.
- `.home-rail-ad` remains normal-flow and fills the sidebar height.
- `.home-rail-viewport` remains the sticky inner frame.

## Sticky Parent And Range Fix Summary

- `.home-shell` provides the shared content/sidebar height.
- `.home-sidebar-column` spans the Home shell height.
- `.home-rail-ad` uses `height: 100%` inside the sidebar.
- `.home-rail-viewport` uses `position: sticky` with the Home-only sticky top offset.
- The sticky rail can now follow scroll within the Home content area and stop naturally when the Home shell ends.

## Reason Fixed Rail Was Not Reintroduced

Fixed viewport positioning caused previous header/footer collision risks. Phase 3E.4 uses only normal document flow plus CSS sticky inside the Home sidebar. No Home rail `position: fixed`, fixed right offset, or fixed viewport top/bottom calculation was added.

## Sticky Top Offset Strategy

- The Home-only `--home-rail-sticky-top` remains `112px`.
- The offset is intended to clear the visible header/nav/ticker area.
- The offset is scoped to `body.home-page .site-main` and does not affect other routes.

## Parent Overflow And Sticky-Blocker Audit Summary

- Home shell, main column, sidebar column, and outer rail do not set `overflow: hidden`, `overflow: auto`, or `overflow: scroll`.
- Market modal overflow remains scoped to Market modal selectors.
- The rail viewport keeps `overflow: hidden` only to clip the carousel, not as a sticky ancestor blocker.
- No transform or contain rule was added around the Home sticky sidebar.

## Collision Prevention Summary

- Header/nav/ticker: the `112px` sticky top offset remains.
- Main content: the rail is in a separate right sidebar column.
- Footer/footer ad: the sticky rail remains constrained to the Home shell and exits before the footer/footer ad.
- Footer/footer ad remains natural-flow and is not fixed or sticky.

## Banner Carousel Preservation Summary

- Local sample banners are preserved.
- Zero active banners still render no rail.
- One active banner remains static.
- Two or more active banners rotate every 5 seconds.
- Hover pause and reduced-motion handling remain.
- No ad-event tracking, analytics, click tracking, or external assets were added.

## Non-Home Isolation Preservation Summary

- `HomeRailAd` remains imported only by `src/pages/index.astro`.
- Non-Home routes do not render Home rail markup.

## Market Scatter Fullscreen And Export Preservation Summary

- Market scatter explicit SVG surfaces remain.
- White/light scatter backgrounds remain.
- Fullscreen modal close X and ESC close remain.
- Scatter and Heatmap PNG export remain browser-only.
- `/market` and `/heatmap` remain.
- Phase 3E.4 does not implement the Treemap redesign.

## Chart AI Preservation Summary

- Chart AI remains chart-first.
- The question input remains removed.
- The chart-load button and interval controls remain.
- Query prefill remains.
- `AI 분석 실행` remains a follow-up action after chart readiness.
- The server-only usage guard boundary remains.

## Portfolio, Header, And Today Preservation Summary

- Portfolio behavior is preserved by scope.
- Header auth label stability is preserved by scope.
- `Today: 000` remains a placeholder.
- No real visitor count was implemented.

## Phase 3F Planning Note

- Phase 3F should redesign Market from the current Heatmap-card shell into a Treemap dashboard.
- Phase 3F should replace visible `Heatmap` terminology with `Treemap` across product UI, docs/checklists, component names where safe, and product language.
- `/heatmap` may remain only as a backward-compatible route if needed.
- Visible product language should become `Treemap` during Phase 3F.
- Phase 3F should remain provider-free unless separately approved.
- Reference sites are concept-only; no scraping or fetching is approved.
- No Phase 3F Treemap implementation was performed in Phase 3E.4.

## Explicit Non-Goals

- No real provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No Trading Economics, ETFshopping, Hankyung, or reference-site scraping/fetching was implemented.
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
  - Home now has `home-shell`, `home-main-column`, and `home-sidebar-column`.
  - `.home-shell` switches to the right sidebar grid at `1440px`.
  - `.home-sidebar-column` stretches to the Home shell height at desktop width.
  - `.home-rail-ad` remains `position: static`.
  - `.home-rail-viewport` remains `position: sticky`.
  - `--home-rail-sticky-top` remains `112px`.
  - Home rail source does not use fixed `right`, fixed rail top calculations, or `.fixed-bottom-area`.
  - Carousel interval, hover pause, and reduced-motion hooks remain.
- Secret and boundary scans:
  - No provider secret marker names were found in generated static assets.
  - No service-role marker names were found in generated static assets.
  - Expected server-only service-role references remain in server helper/API source.
  - Expected public Supabase browser helper references remain in client auth source; no values are documented here.
  - Disposable validation identifiers remain docs/validation-only.
- Removed legacy route string scan:
  - No removed legacy route strings were found in product source or generated output.
- Provider and reference-site scans:
  - No OpenAI, Gemini, KIS, OpenDART, Trading Economics, ETFshopping, Hankyung, or market-data execution code was found.
  - No Trading Economics, ETFshopping, Hankyung, or reference-site scraping/fetching code was found.
- Visitor/ad-event scans:
  - No real visitor-count implementation was added.
  - No ad-event write/tracking route was added.
- Crypto scope scan:
  - Only approved asset-class context and bundled Supabase WebCrypto internals were matched.
  - No broad Crypto News or crypto ticker surface was added.
- Browser automation:
  - In-app browser automation was unavailable in this environment.
  - Owner Chrome visual smoke remains required for final sticky range confirmation.

## Owner Manual Smoke Steps

```text
Phase 3E.4 Home 광고 Sticky Range 보정 점검 결과:

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
- OpenAI/Gemini/KIS/OpenDART/Trading Economics/ETFshopping/한경 실제 호출 없음: 통과/실패
- Phase 3F에서 Heatmap 명칭을 Treemap으로 수정할 계획이 문서에 반영됨: 통과/실패
- 브라우저 콘솔에 token/key/raw DB error/stack trace 노출 없음: 통과/실패
- 비밀 정보 없는 메모:
```

## Remaining Risks

- Owner Chrome smoke is required for final visual confirmation of sticky scroll-follow and stop-before-footer behavior.
- The `112px` sticky offset may need minor adjustment if header/nav/ticker heights change.

## Recommended Next Action

Run the Phase 3E.4 owner manual smoke in Chrome. If it passes, proceed to Phase 3F planning/implementation only under a separate explicit Phase 3F request.
