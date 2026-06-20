# Phase 3E Market, Chart AI UX, And Home Ad Result v0.1

Date: 2026-06-20

## Status And Scope

Status: implementation and local validation completed.

Phase 3E activated the normal Home right-side ad rail, corrected Chart AI into a chart-first workflow, renamed the primary Heatmap navigation surface to Market, added a `/market` route while preserving `/heatmap`, and built provider-free Market heatmap/scatter card shells with browser-only PNG export buttons.

This phase did not implement provider calls, real AI analysis, real market-data fetching, database migrations, direct SQL, deployment, production authenticated write validation, real visitor counting, ad-event tracking, analytics, scraping, or external asset downloads.

## Files Changed

- `src/pages/index.astro`
- `src/components/HomeRailAd.astro`
- `src/components/Nav.astro`
- `src/components/MarketShell.astro`
- `src/pages/market.astro`
- `src/pages/heatmap.astro`
- `src/pages/chart-ai.astro`
- `src/pages/api/chart-ai/analyze.ts`
- `src/lib/chartAiClient.ts`
- `src/lib/exportCardImage.ts`
- `src/styles/style.css`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`
- `docs/planning/phase_3e_market_chart_ai_home_ad_result_v0.1.md`

Removed:

- `src/components/HomeRailPreviewPanel.astro`

## Owner Phase 3D Smoke Feedback Summary

- `/chart-ai` and selected-security prefill were visible.
- Chart AI skeleton and usage guard behavior were broadly aligned.
- Product flow needed correction away from free-form question input.
- Daily/weekly/monthly controls needed to belong to the chart area.
- A chart-loading action was needed near the security input.
- Home right-side ad rail needed to be visible in normal local Home usage.
- Heatmap needed to become a broader Market surface with heatmap/scatter cards and local image export.

## Home Actual Ad Rail Activation Summary

- Home now renders `HomeRailAd` directly on normal `/`.
- The rail remains Home-only because it is imported only by `src/pages/index.astro`.
- The display breakpoint was lowered to `1440px`.
- A Home-only content-width adjustment prevents the fixed `160x600` rail from covering primary Home content at the lower breakpoint.
- Existing local sample SVG banners and `src/data/homeAdBanners.json` are preserved.
- Zero active banners still render no rail.
- One active banner renders static.
- Two or more active banners rotate every 5 seconds.
- Hover pause and reduced-motion handling remain.

## Preview Panel Removal Decision

- The Phase 3C.12 in-page preview fallback panel was removed from product source.
- `/?railPreview=1` is no longer required for owner acceptance.
- The visible `HOME RAIL PREVIEW` panel is no longer part of normal Home usage.

## Chart AI UX Correction Summary

- Removed the free-form question input from `/chart-ai`.
- Removed `question` from the browser request payload.
- Kept server-side tolerance for older clients that may still send `question`.
- Moved daily/weekly/monthly controls into the chart area as chart interval buttons.
- Added `차트 불러오기` beside the security input.
- Query prefill still works for `symbol`, `name`, and `market`.
- If query prefill contains a symbol, the chart placeholder is ready immediately.
- `AI 분석 실행` remains a separate follow-up action after chart readiness.
- The API still returns deterministic placeholder output only.

Chart AI is now chart-first, not question-chat-first.

## Market Nav And Route Strategy

- Primary nav label changed from Heatmap to `시장`.
- New primary route: `/market`.
- Backward-compatible route: `/heatmap`.
- `/heatmap` renders the same Market shell and keeps the Market nav item active.

## Market Page Section Summary

The Market shell contains five sections:

- `KOSPI200`
- `KOSDAQ150`
- `S&P500`
- `NASDAQ100`
- `My Portfolio holdings`

Each section contains:

- one heatmap card
- one short-term momentum vs long-term trend scatter chart card
- one camera export button per card

## Heatmap Shell Summary

- Heatmap cards use static sample data.
- Tiles show labels, sample percentage changes, and positive/negative/neutral color direction.
- The cards avoid live wording and label data as sample/pre-provider.
- No external chart API or remote image is used.

## Scatter Chart Shell Summary

- Scatter cards are SVG-based and provider-free.
- X-axis: long-term trend.
- Y-axis: short-term momentum.
- Quadrant labels describe strong trend, rebound candidate, trend slowdown, and weak flow.
- Points use deterministic sample data only.

## Trading Economics Reference Handling

Trading Economics was treated only as a visual/concept reference for the scatter idea. Codex did not scrape, fetch, browse, call, or download Trading Economics content.

## Camera Export Implementation Summary

- Added `src/lib/exportCardImage.ts`.
- Export is browser-only.
- Export targets the specific card selected by the camera button.
- The helper clones the card, inlines computed presentation styles, serializes it through an SVG `foreignObject`, draws it to a browser canvas, and downloads a PNG locally.
- Filenames are sanitized and include a date suffix.
- Export does not upload files, store files in a database, or send analytics.

## Export Dependency Summary

No dependency was added. The implementation uses browser APIs only.

## Explicit Non-Goals

- No real provider call was implemented.
- No OpenAI, Gemini, KIS, OpenDART, Trading Economics, or market-data execution was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
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
- No FX conversion, valuation analytics, performance analytics, or provider autocomplete was implemented.
- No logo/banner scraping, remote discovery, or external asset download was implemented.

## Security Notes

- No browser service-role exposure was added.
- No token logging was added.
- No raw DB error display was added.
- No provider secrets were requested, read, recorded, or printed.
- Chart AI API continues to derive the user from server-validated auth and does not trust browser-submitted user IDs.

## Validation Results

- `npm run build`: pass.
- Vercel output generated:
  - `.vercel/output/config.json`
  - `.vercel/output/functions/_render.func`
  - `.vercel/output/static`
- Local unauthenticated HTTP smoke:
  - `/`: 200
  - `/portfolio`: 200
  - `/chart-ai`: 200
  - `/chart-ai?symbol=005930&name=Samsung&market=KR`: 200
  - `/lab`: 200
  - `/heatmap`: 200
  - `/market`: 200
- Removed legacy route smoke returned 404 for the expected removed routes.
- Unauthenticated POST to `/api/chart-ai/analyze`: sanitized 401.
- Browser automation availability remained limited; owner browser smoke is still required for visual export confirmation.

## Owner Manual Smoke Steps

```text
Phase 3E 시장/Chart AI/Home 광고 UX 점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- Home 일반 접속에서 오른쪽 광고 배너 표시: 통과/실패/화면폭 부족
- Home에서 `HOME RAIL PREVIEW` 패널이 더 이상 보이지 않음: 통과/실패
- Home 광고 배너가 2개 샘플로 5초마다 전환됨: 통과/실패/미실행
- `/chart-ai`, `/portfolio`, `/lab`, `/market` 또는 `/heatmap`에서 Home 광고 배너 미노출: 통과/실패
- 메뉴명이 `시장`으로 표시됨: 통과/실패
- 기존 Heatmap 메뉴명이 주요 메뉴에서 제거됨: 통과/실패
- 시장 페이지 진입: 통과/실패
- KOSPI200/KOSDAQ150/S&P500/NASDAQ100/My Portfolio 섹션 표시: 통과/실패
- 각 섹션의 Heatmap 카드와 산점도 카드 표시: 통과/실패
- 카메라 아이콘 클릭 시 PNG 이미지가 로컬에 저장됨: 통과/실패
- `/chart-ai` 질문 입력 칸 제거: 통과/실패
- `/chart-ai` 차트 불러오기 버튼 표시: 통과/실패
- `/chart-ai` 일봉/주봉/월봉 선택이 차트 영역에 표시: 통과/실패
- `AI 분석 실행`이 차트 준비 이후 후속 액션으로 보임: 통과/실패
- OpenAI/Gemini/KIS/OpenDART/Trading Economics 실제 호출 없음: 통과/실패
- 브라우저 콘솔에 token/key/raw DB error/stack trace 노출 없음: 통과/실패
- 비밀 정보 없는 메모:
```

## Remaining Risks

- Camera export needs owner browser confirmation because automated visual download verification was not completed.
- Market data remains static sample data.
- Chart AI still returns deterministic placeholder output only.
- Authenticated Chart AI usage function execution still needs owner-approved manual smoke with a real session.

## Recommended Next Action

Run the Phase 3E owner manual smoke. If it passes, proceed to the next approved Chart AI or market-data provider-boundary planning phase.
