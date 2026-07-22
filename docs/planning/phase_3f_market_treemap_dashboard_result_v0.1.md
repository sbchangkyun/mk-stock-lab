# Phase 3F Market Treemap Dashboard Result v0.1

Date: 2026-06-20

## Status And Scope

Status: implementation completed; final validation results are recorded below.

Phase 3F redesigns the Market surface into a Treemap-first dashboard. `/market` remains the primary route and `/heatmap` remains a backward-compatible route to the same dashboard. Visible product language now uses `Treemap` instead of `Heatmap` where safe, while route compatibility and a few internal legacy CSS selectors remain by scope.

## Files Changed

- `src/components/MarketShell.astro`
- `src/data/marketTreemapSamples.ts`
- `src/pages/heatmap.astro`
- `src/pages/index.astro`
- `src/pages/market.astro`
- `src/styles/style.css`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`
- `docs/planning/phase_3f_market_treemap_dashboard_result_v0.1.md`

## Market Dashboard Redesign Summary

- Replaced the old multi-section Market card layout with a single selected-universe dashboard.
- Added universe controls for `KOSPI200`, `KOSDAQ150`, `S&P500`, `NASDAQ100`, and `My Portfolio`.
- Added period controls for `1일`, `1주`, `1개월`, `3개월`, `6개월`, and `1년`.
- Renders one large Treemap and one Momentum / Trend scatter card for the selected universe and period.
- Renders all dashboard states server-side and switches visible panels with a small local script.
- Uses deterministic sample data only.

## Treemap Implementation Summary

- Added `src/data/marketTreemapSamples.ts` with provider-free sample constituents.
- Treemap tiles are grouped by sector.
- Tile size is based on sample value weight.
- Tile color maps return direction and magnitude:
  - blue for negative returns
  - gray for neutral returns
  - red for positive returns
- Added a visible color legend.
- SVG tiles include sanitized clipPath ids for reliable rendering and export.
- Zero external data, external image, crawler, scraper, or provider fetch is used.

## Scatter Chart Fix Summary

- Rebuilt the Market scatter SVG with a larger plot margin.
- Moved `단기 모멘텀` and `장기 트렌드` labels outside the plot region.
- Preserved explicit chart backgrounds and point colors so fullscreen and PNG export remain readable.
- Scatter points use the same selected universe and selected period as the Treemap.

## Fullscreen And PNG Export Preservation Summary

- Preserved camera-icon PNG export for Treemap and scatter cards.
- Preserved expanded/fullscreen modal behavior.
- Export filenames now use `treemap` for Treemap cards.
- The export path remains browser-only and local-only.
- No upload, storage, analytics, or ad-event tracking was added.

## Backward Compatibility Summary

- `/market` remains the primary route.
- `/heatmap` remains available as a backward-compatible alias to the Market dashboard.
- The main navigation continues to display `시장`.
- The old visible `Heatmap` product language was removed from Market and Home copy where safe.

## Home, Chart AI, Portfolio, Header, And Today Preservation Summary

- Home sticky sidebar ad behavior is preserved by scope.
- Chart AI chart-first UX and selected-security prefill are preserved.
- Portfolio behavior is preserved by scope.
- Header auth label stability is preserved by scope.
- `Today: 000` remains a placeholder.
- No real visitor count was implemented.

## Provider And Reference-Site Boundary

- ETFshopping, Trading Economics, and Hankyung remain concept-only references for future planning.
- No provider call was implemented.
- No OpenAI, Gemini, KIS, OpenDART, Trading Economics, ETFshopping, Hankyung, or market-data execution code was added.
- No reference-site scraping, fetching, remote discovery, crawler, or external asset download was added.

## Explicit Non-Goals

- No production write validation by Codex.
- No Portfolio production write calls by Codex.
- No Supabase connection for writes.
- No SQL, Supabase CLI, `psql`, or DB command.
- No DB mutation.
- No Auth user creation.
- No Vercel environment mutation.
- No deployment.
- No provider integration.
- No Chart AI provider call.
- No AI execution.
- No Chart AI usage guard change.
- No real market-data fetch.
- No Trading Economics, ETFshopping, Hankyung, KIS, OpenDART, OpenAI, or Gemini call.
- No real visitor-count API, DB table, DB write, migration, local counting, or analytics.
- No ad-event route or tracking.
- No FX conversion.
- No valuation analytics.
- No performance analytics.
- No provider autocomplete.
- No logo/banner scraping.
- No remote discovery.
- No external asset download.
- No broad crypto feature expansion.

## Security Notes

- No service-role key exposure was added.
- No provider key exposure was added.
- No secret values were requested, read, recorded, printed, or summarized.
- No ignored `.env*` file contents were read.
- The provider credential status remains future-phase-only; actual values are not requested or recorded.

## Validation Results

- `npm run build`: pass.
- Vercel output exists:
  - `.vercel/output/config.json`
  - `.vercel/output/functions/_render.func`
  - `.vercel/output/static`
- `npm run preview`: not supported by the installed `@astrojs/vercel` adapter.
- Local HTTP smoke used `npm run dev` on `127.0.0.1:4324`.
- Local unauthenticated HTTP smoke:
  - `/`: 200
  - `/market`: 200
  - `/heatmap`: 200
  - `/portfolio`: 200
  - `/chart-ai`: 200
  - `/chart-ai?symbol=005930&name=...&market=KR`: 200
  - `/lab`: 200
  - `/market?railPreview=1`: 200
- Removed legacy routes returned 404:
  - `/seibro`
  - `/api/news`
  - `/api/list`
  - `/api/holdings`
  - `/api/stock`
  - `/api/etf`
  - `/api/search`
- Unauthenticated POST to `/api/chart-ai/analyze`: sanitized 401.
- Rendered markup checks:
  - `/market` contains Treemap dashboard markup.
  - `/market` contains universe controls.
  - `/market` contains period controls.
  - `/market` contains `market-treemap-svg`.
  - `/market` Treemap export filenames use `treemap`.
  - `/heatmap` returns the same Treemap dashboard.
  - `/portfolio?railPreview=1` does not include Home rail markup.
- Browser automation:
  - In-app browser automation was not available in this environment.
  - Owner Chrome visual smoke remains required for final visual confirmation of fullscreen, PNG download, and selector interactions.

## Owner Manual Smoke Steps

```text
Phase 3F 시장 Treemap 대시보드 재점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- 메뉴명이 `시장`으로 표시됨: 통과/실패
- 기존 주요 메뉴에서 `Heatmap` 메뉴명이 보이지 않음: 통과/실패
- `/market` 진입: 통과/실패
- `/heatmap` 진입 시 새 시장 Treemap 대시보드가 표시됨: 통과/실패
- KOSPI200 선택 버튼 표시: 통과/실패
- KOSDAQ150 선택 버튼 표시: 통과/실패
- S&P500 선택 버튼 표시: 통과/실패
- NASDAQ100 선택 버튼 표시: 통과/실패
- My Portfolio 선택 버튼 표시: 통과/실패
- 기간 선택 `1일`, `1주`, `1개월`, `3개월`, `6개월`, `1년` 표시: 통과/실패
- 선택한 시장과 기간에 맞는 큰 Treemap 카드 표시: 통과/실패
- Treemap 타일이 섹터별로 묶여 보임: 통과/실패
- Treemap 타일 크기가 비중에 따라 달라 보임: 통과/실패
- Treemap 색상 범례 표시: 통과/실패
- 선택한 시장과 기간에 맞는 Momentum / Trend 산점도 표시: 통과/실패
- 산점도 축 라벨 `단기 모멘텀`, `장기 트렌드`가 플롯 영역을 침범하지 않음: 통과/실패
- Treemap 카드 우측 상단 카메라 아이콘 표시: 통과/실패
- 산점도 카드 우측 상단 카메라 아이콘 표시: 통과/실패
- Treemap 카드 크게 보기 동작: 통과/실패
- 산점도 카드 크게 보기 동작: 통과/실패
- 카메라 아이콘 클릭 시 PNG 이미지가 로컬에 저장됨: 통과/실패/미실행
- Home 오른쪽 광고 배너 sticky 동작 유지: 통과/실패/화면폭 부족
- `/chart-ai`, `/portfolio`, `/lab`, `/market`, `/heatmap`에서 Home 광고 배너 미노출: 통과/실패
- Chart AI 선택 종목 프리필 유지: 통과/실패
- Portfolio 주요 기능 유지: 통과/실패/미실행
- Header 로그인 라벨 안정성 유지: 통과/실패
- `Today: 000` placeholder 유지: 통과/실패
- 실제 방문자 집계가 아직 동작하지 않음: 통과/실패
- OpenAI/Gemini/KIS/OpenDART/Trading Economics/ETFshopping/한국경제 실제 호출 없음: 통과/실패
- 브라우저 콘솔에 token/key/raw DB error/stack trace 노출 없음: 통과/실패
- 비밀 정보 없는 메모:
```

## Remaining Risks

- Owner Chrome smoke is still required for visual confirmation of selector behavior, fullscreen sizing, and PNG download.
- The Treemap uses deterministic sample data, not live provider data.
- Internal legacy `.heatmap-*` CSS selectors remain for older skeleton surfaces; they are not visible product language.

## Recommended Next Action

Run the Phase 3F owner manual smoke in Chrome. If it passes, proceed to the next explicitly requested phase.
