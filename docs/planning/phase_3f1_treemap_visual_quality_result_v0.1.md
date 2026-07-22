# Phase 3F.1 Treemap Visual Quality Result v0.1

Date: 2026-06-20

## Status And Scope

Status: implementation completed; validation results are recorded below.

Phase 3F.1 improves the Market Treemap visual quality, scatter readability, and PC web page width while preserving the Phase 3F provider-free and sample-data-only boundary. `/market` remains primary and `/heatmap` remains a backward-compatible route to the same dashboard.

## Files Changed

- `src/components/MarketShell.astro`
- `src/data/marketTreemapSamples.ts`
- `src/styles/style.css`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`
- `docs/planning/phase_3f1_treemap_visual_quality_result_v0.1.md`

## Owner Phase 3F Smoke Result Summary

- Passed: route entry, navigation naming, universe selector, period selector, Treemap card presence, Momentum / Trend scatter presence, camera icons, fullscreen, PNG export, Home sticky ad, Chart AI selected-security prefill, Portfolio, Header auth, `Today: 000`, provider-call absence, and console safety.
- Needed correction: Treemap looked like vertical sector columns rather than nested reference-style rectangles, tile sizing did not strongly communicate value weight, the legend looked too simple, scatter was too small, `장기 트렌드` needed bottom-right placement, and PC web side whitespace was too wide.

## Treemap Visual Failure Assessment

The Phase 3F Treemap used a weighted slice layout for both sector groups and constituent tiles. That made sectors appear as vertical strips and made the whole card read closer to a grouped bar layout than a squarified treemap.

## Squarified/Nested Treemap Correction Summary

- Replaced the slice-only layout with a deterministic squarified helper.
- Squarified sector blocks inside the full Treemap rectangle.
- Squarified constituent tiles inside each sector block.
- Kept sector hierarchy visible without reserving large empty label bands.
- Preserved full-rectangle fill with small gaps and strokes.
- Large constituents now dominate more visibly and smaller constituents pack into remaining space.

## Treemap Algorithm/Dependency Decision

No new dependency was added. The implementation uses a local deterministic squarified treemap helper in `src/components/MarketShell.astro`. This avoided package and lockfile churn while satisfying the visual correction scope.

## Treemap Sample Weighting Adjustment Summary

- Increased selected large-cap sample weights for KOSPI200, KOSDAQ150, S&P500, and NASDAQ100.
- Kept minimum item counts unchanged:
  - KOSPI200: 20 items.
  - KOSDAQ150: 20 items.
  - S&P500: 20 items.
  - NASDAQ100: 20 items.
  - My Portfolio: 8 items.
- Kept all data deterministic and provider-free.

## Treemap Visual Polish Summary

- Increased Treemap viewBox to `1120x560`.
- Reduced empty label space by overlaying sector labels only when there is enough room.
- Added compact text rules for medium tiles and hidden text on small tiles.
- Preserved native SVG titles for small tiles.
- Kept light chart background and explicit tile strokes.

## Color Scale/Legend Polish Summary

- Replaced the three-chip legend with a stepped return scale.
- Added labels:
  - `-5% 이하`
  - `-3%`
  - `-1%`
  - `0%`
  - `+1%`
  - `+3%`
  - `+5% 이상`
- Preserved color direction:
  - negative returns: blue.
  - neutral returns: gray.
  - positive returns: red.

## PC Web Width Optimization Summary

- Added `--page-max-width: 1500px`.
- Widened `.site-main`, nav inner width, slide ad content width, and slide ad footer width.
- Kept safe responsive side margins through `width: min(calc(100% - 48px), var(--page-max-width))`.
- Kept mobile margin protection with a smaller width subtraction under `640px`.
- Preserved the `1440px` Home sticky ad breakpoint.

## Market Card Ratio/Layout Summary

- Changed the Market dashboard grid to give the Treemap a stronger dominant width.
- Increased minimum card height for both Treemap and scatter cards.
- Kept scatter beside Treemap on PC while making both cards more data-dense.
- Kept single-column responsive behavior below `980px`.

## Scatter Size And Axis-Label Correction Summary

- Increased scatter viewBox to `720x520`.
- Increased normal scatter rendered height.
- Expanded the plot rectangle.
- Kept `단기 모멘텀` outside the plot area.
- Moved `장기 트렌드` to the bottom-right of the plot rectangle.
- Preserved quadrant labels:
  - `반등 후보`
  - `강한 추세`
  - `약한 흐름`
  - `추세 둔화`
- Reduced point-label collisions by hiding lower-priority labels and alternating label offsets.

## Fullscreen/Export Preservation Summary

- Preserved fullscreen modal open, visible close button, backdrop close, and ESC close behavior.
- Preserved browser-only PNG export.
- Export filenames still use `treemap` for Treemap cards.
- No server upload, DB storage, analytics, or ad-event tracking was added.

## Home Sticky Ad Preservation Summary

- Home sticky ad code was not reworked in this phase.
- The Home in-flow sticky sidebar architecture remains in place.
- Home-only rail behavior and non-Home rail absence are preserved by scope.

## Chart AI Preservation Summary

- Chart AI chart-first UX is preserved by scope.
- The question input remains removed.
- `차트 불러오기` remains.
- `일봉`, `주봉`, and `월봉` controls remain in the chart area.
- Query prefill remains.
- The Phase 3D server-only usage guard skeleton remains.
- No provider execution call was added.

## Portfolio/Header/Today Preservation Summary

- Portfolio behavior is preserved by scope.
- Header auth label stability is preserved by scope.
- `Today: 000` remains a placeholder.
- No real visitor count was implemented.

## Reference Handling Summary

- ETFshopping was used only as a concept reference from the owner brief.
- Trading Economics was used only as a concept reference from the owner brief.
- Hankyung was used only as a concept reference from the owner brief.
- No reference site was fetched, scraped, copied, crawled, or downloaded.

## Explicit Non-Goals

- No real provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No Trading Economics, ETFshopping, or Hankyung scraping/fetching was implemented.
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
- Local unauthenticated HTTP smoke used `npm run dev` on `127.0.0.1:4325`.
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
  - `squarify` helper is present.
  - old `layoutWeighted` helper is removed.
  - granular return scale is present.
  - `단기 모멘텀` and `장기 트렌드` source labels are present.
  - shared page max width is widened.
  - export filenames still use `treemap`.
- Rendered markup validation:
  - `/market` contains Treemap dashboard markup.
  - `/market` contains the return scale.
  - `/market` contains no uppercase `Heatmap` visible product term.
  - `/market` does not include Home rail markup.
  - `/` includes Home rail markup.
- Browser automation:
  - Playwright is not installed locally.
  - No dependency was added solely for browser automation.
  - Owner Chrome visual smoke remains required for final visual confirmation.

## Owner Manual Smoke Steps

```text
Phase 3F.1 Treemap 시각화 품질 재점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- `/market` 진입: 통과/실패
- `/heatmap` 호환 진입: 통과/실패
- visible UI에서 `Treemap` 명칭 유지: 통과/실패
- Treemap이 세로 막대 나열이 아니라 크고 작은 직사각형 블록 조합처럼 보임: 통과/실패
- Treemap이 직사각형 영역을 빈틈 적게 채움: 통과/실패
- 섹터/그룹 구분이 자연스럽게 보임: 통과/실패
- 대형 종목 타일이 의미 있게 크게 보임: 통과/실패
- 중소형 종목 타일이 남은 영역을 촘촘히 채움: 통과/실패
- Treemap 색상 범례가 명확함: 통과/실패
- PC Web 좌우 여백이 줄어듦: 통과/실패
- Home 본문 영역이 이전보다 넓게 느껴짐: 통과/실패
- Market dashboard가 이전보다 넓게 느껴짐: 통과/실패
- Momentum / Trend 산점도가 이전보다 크게 보임: 통과/실패
- 산점도 `단기 모멘텀` 문구가 표 영역을 침범하지 않음: 통과/실패
- 산점도 `장기 트렌드` 문구가 plot 직사각형 우측 하단에 배치됨: 통과/실패
- Treemap 크게 보기 동작: 통과/실패
- 산점도 크게 보기 동작: 통과/실패
- Treemap PNG 저장: 통과/실패/미실행
- 산점도 PNG 저장: 통과/실패/미실행
- Home 광고 sticky 동작 유지: 통과/실패/화면폭 부족
- Chart AI 차트 우선 UX 유지: 통과/실패
- Portfolio 주요 기능 유지: 통과/실패/미실행
- Header 로그인 라벨 안정성 유지: 통과/실패
- `Today: 000` placeholder 유지: 통과/실패
- OpenAI/Gemini/KIS/OpenDART/Trading Economics/ETFshopping/한경 실제 호출 없음: 통과/실패
- 브라우저 콘솔에 token/key/raw DB error/stack trace 노출 없음: 통과/실패
- 비밀 정보 없는 메모:
```

## Remaining Risks

- Owner Chrome smoke is required for visual confirmation of the squarified composition, fullscreen sizing, PNG export, and Home sticky ad behavior.
- The Treemap still uses deterministic sample data, not live provider data.

## Recommended Next Action

Run the Phase 3F.1 owner manual smoke in Chrome. If it passes, proceed only to the next explicitly requested phase.
