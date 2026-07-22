# Phase 3F.2 Treemap Engine And View Mode Result v0.1

Date: 2026-06-20

## Status And Scope

Status: implementation completed; validation results are recorded below.

Phase 3F.2 replaces the failed local Treemap packing helper with a hierarchy-based squarified layout using `d3-hierarchy`. It also adds a Market view-mode selector so Treemap, Momentum / Trend, and combined views can use the available page area more effectively. The phase remains provider-free and sample-data-only.

## Files Changed

- `package.json`
- `package-lock.json`
- `src/components/MarketShell.astro`
- `src/styles/style.css`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`
- `docs/planning/phase_3f2_treemap_engine_view_mode_result_v0.1.md`

## Owner Phase 3F.1 Smoke Result Summary

- Passed: `/market`, `/heatmap`, visible `Treemap` terminology, universe selector, period selector, chart presence, fullscreen, PNG export, PC width, Home sticky ad, Chart AI, Portfolio, Header auth, `Today: 000`, provider-call absence, and console safety.
- Needed correction: Treemap still looked strip-like, sector hierarchy did not read as a true nested Treemap, scatter remained constrained in side-by-side mode, and a view-mode selector was requested.

## Treemap Engine Failure Assessment

The Phase 3F.1 local helper still produced row/strip-like regions in some market universes. That failed the owner expectation for hierarchy-based Treemap composition with varied width and height at both sector and constituent levels.

## Treemap Engine Replacement Summary

- Added `d3-hierarchy`.
- Replaced the local packing helper with `hierarchy`, `treemap`, and `treemapSquarify`.
- Built a root -> sector -> constituent hierarchy.
- Applied value summing and descending sort before layout.
- Used SVG rectangles from the d3 rectangular hierarchy output.

## d3-hierarchy Dependency Decision And Usage Summary

- Added only `d3-hierarchy`, not the full D3 bundle.
- Used the package only in `src/components/MarketShell.astro`.
- Imported only:
  - `hierarchy`
  - `treemap`
  - `treemapSquarify`
  - `HierarchyRectangularNode` type.
- No provider, network, credential, or server-secret behavior is introduced by this dependency.

## Hierarchy Data Mapping Summary

- Root node: Market.
- Sector nodes: grouped from sample constituent `sector`.
- Leaf nodes: each sample constituent/security.
- Area value: sample `value`.
- Tile color: computed period return from `baseChangePct`, trend, and period multiplier.
- Sector area: sum of child values.
- Constituent area: individual sample value.

## New Treemap Layout Quality Summary

- Treemap now uses hierarchy-based squarified rectangles.
- Sector and constituent rectangles are computed by d3, not manual strip packing.
- The output supports varied width and height across levels.
- Small labels are hidden while native SVG titles remain available.
- Large tiles show symbol and return.
- Medium tiles show compact symbol labels.

## View-Mode Selector Summary

Added a Market view-mode selector:

- `Treemap`
- `Momentum / Trend`
- `같이 보기`

The selector is client-side and scoped to the Market dashboard root through `data-active-view`.

## Treemap Single-View Summary

`Treemap` mode is the default. It hides the scatter card and gives the Treemap a full-width chart surface.

## Momentum / Trend Single-View Summary

`Momentum / Trend` mode hides the Treemap card and gives the scatter chart a full-width chart surface.

## Combined-View Summary

`같이 보기` mode shows both cards in a balanced two-column layout.

## Color Legend Redesign Summary

- Kept the stepped market return scale from Phase 3F.1.
- Preserved Korean market convention:
  - positive: red.
  - negative: blue.
  - neutral: gray.
- The legend remains part of the Treemap card and therefore remains included in browser export.

## Scatter Readability Improvement Summary

- Single-view mode lets the scatter chart use the full dashboard width.
- Existing larger scatter SVG, quadrant labels, label staggering, and label filtering are preserved.
- `단기 모멘텀` remains outside the plot.
- `장기 트렌드` remains at the plot rectangle bottom-right.

## Fullscreen/Export Preservation Summary

- Fullscreen modal remains.
- Close button, ESC close, and backdrop close remain.
- Browser-only PNG export remains.
- Export filenames still use `treemap` for Treemap cards.
- No upload, DB storage, analytics, or ad-event tracking was added.

## PC Web Width Preservation Summary

Phase 3F.1 page-width improvements remain intact:

- Shared `1500px` page max width.
- Wider Home and Market page containers.
- Responsive side margins.
- No intentional horizontal scrolling was added.

## Visible Terminology And Route Strategy Summary

- Visible Market UI continues to use `Treemap`.
- `/market` remains primary.
- `/heatmap` remains backward-compatible.
- Internal `heatmap` compatibility route naming is retained only where needed.

## Home Sticky Ad Preservation Summary

- Home sticky ad code was not changed.
- Home-only rail behavior remains scoped to the Home route.
- Non-Home routes do not render Home rail markup.

## Chart AI Preservation Summary

- Chart AI chart-first UX is preserved by scope.
- Query prefill remains.
- The Phase 3D server-only usage guard skeleton remains.
- No provider execution was added.

## Portfolio/Header/Today Preservation Summary

- Portfolio behavior is preserved by scope.
- Header auth behavior is preserved by scope.
- `Today: 000` remains a placeholder.
- No real visitor count was implemented.

## Reference Handling Summary

- Owner-provided treemap learning/reference URLs were used only as concept references from the brief.
- ETFshopping was concept-only.
- Trading Economics was concept-only.
- Hankyung was concept-only.
- No reference site was fetched, scraped, crawled, copied, or downloaded.

## Explicit Non-Goals

- No real provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No reference-site scraping/fetching was implemented.
- No DB migration was added.
- No direct SQL was run.
- No Supabase CLI was run.
- No `psql` was run.
- No production authenticated write validation was performed by Codex.
- No real visitor count was implemented.
- No ad-event tracking was implemented.
- No Vercel environment mutation was performed.
- No deployment was run.

## Security Notes

- No browser service-role exposure was added.
- No token logging was added.
- No raw DB errors were added to browser-visible UI.
- No provider secrets were requested, read, recorded, printed, or summarized.
- No ignored `.env*` file contents were read.

## Validation Results

- `npm run build`: pass.
- Vercel output exists:
  - `.vercel/output/config.json`
  - `.vercel/output/functions/_render.func`
  - `.vercel/output/static`
- Local unauthenticated HTTP smoke used `npm run dev` on `127.0.0.1:4326`.
- Local route smoke:
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
- Unauthenticated POST to `/api/chart-ai/analyze`: sanitized 401 with no stack/token marker detected.
- Source validation:
  - `d3-hierarchy` import is present only in `MarketShell.astro`.
  - `hierarchy`, `treemap`, and `treemapSquarify` are used.
  - view-mode buttons are present.
  - `data-active-view` state is present.
  - view-mode CSS is present.
- Rendered markup validation:
  - `/market` contains the view-mode controls.
  - `/market` contains `Treemap`, `Momentum / Trend`, and `같이 보기`.
  - `/market` contains no uppercase `Heatmap` visible product term.
  - `/market` does not include Home rail markup.
- Browser automation:
  - Playwright is not installed locally.
  - No dependency was added solely for browser automation.
  - Owner Chrome visual smoke remains required for final visual confirmation.

## Owner Manual Smoke Steps

```text
Phase 3F.2 Treemap 엔진/보기 모드 재점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- `/market` 진입: 통과/실패
- `/heatmap` 호환 진입: 통과/실패
- visible UI에서 `Treemap` 명칭 유지: 통과/실패
- Treemap이 가로/세로 길이가 모두 다른 계층형 블록으로 보임: 통과/실패
- Treemap이 같은 폭 막대 또는 얇은 strip처럼 보이지 않음: 통과/실패
- 대형 종목 타일이 의미 있게 크게 보임: 통과/실패
- 중소형 종목 타일이 남은 영역을 촘촘히 채움: 통과/실패
- 섹터/그룹 구분이 자연스럽게 보임: 통과/실패
- Treemap 색상 범례가 직관적임: 통과/실패
- 보기 선택 `Treemap` 동작: 통과/실패
- 보기 선택 `Momentum / Trend` 동작: 통과/실패
- 보기 선택 `같이 보기` 동작: 통과/실패
- `Treemap` 단독 보기에서 차트가 넓게 표시됨: 통과/실패
- `Momentum / Trend` 단독 보기에서 산점도가 넓게 표시됨: 통과/실패
- 산점도 점/라벨이 이전보다 보기 쉬움: 통과/실패
- 산점도 `단기 모멘텀` 문구가 표 영역을 침범하지 않음: 통과/실패
- 산점도 `장기 트렌드` 문구가 plot 직사각형 우측 하단에 유지됨: 통과/실패
- Treemap 크게 보기 동작: 통과/실패
- 산점도 크게 보기 동작: 통과/실패
- Treemap PNG 저장: 통과/실패/미실행
- 산점도 PNG 저장: 통과/실패/미실행
- Home 광고 sticky 동작 유지: 통과/실패/화면폭 부족
- Chart AI 차트 우선 UX 유지: 통과/실패
- Portfolio 주요 기능 유지: 통과/실패/미실행
- Header 로그인 라벨 안정성 유지: 통과/실패
- `Today: 000` placeholder 유지: 통과/실패
- OpenAI/Gemini/KIS/OpenDART/Trading Economics/ETFshopping/한경/참고 URL 실제 호출 없음: 통과/실패
- 브라우저 콘솔에 token/key/raw DB error/stack trace 노출 없음: 통과/실패
- 비밀 정보 없는 메모:
```

## Remaining Risks

- Owner Chrome smoke is required for visual confirmation that the d3 squarified layout no longer reads as strips.
- Browser automation was unavailable in this environment.
- Treemap data remains deterministic sample data, not live provider data.

## Recommended Next Action

Run the Phase 3F.2 owner manual smoke in Chrome. If it passes, proceed only to the next explicitly requested phase.
