# Phase 3F.4 Portfolio Page Aggregate And Market Viewport Fit Result v0.1

## Status And Scope

Phase 3F.4 is complete on `rebuild/phase-1-ia-shell`. The implementation added a Portfolio page synthetic aggregate view and tuned Market chart sizing for better PC viewport fit. The phase stayed provider-free and did not change database schema, provider integration, deployment, visitor counting, ad-event tracking, or analytics.

## Files Changed

- `src/pages/portfolio.astro`
- `src/components/MarketShell.astro`
- `src/styles/style.css`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`
- `docs/planning/phase_3f4_portfolio_page_aggregate_market_fit_result_v0.1.md`

## Owner Phase 3F.3 Feedback Summary

Phase 3F.3 added aggregate behavior inside the Market My Portfolio sample model and switched Market chart labels to display-name-first labels. The remaining product gap was that `/portfolio` itself still required selecting one real portfolio at a time. The Market dashboard also needed tighter chart fit, especially in Treemap-only and Momentum / Trend-only modes.

## Portfolio Aggregate View Summary

The Portfolio page now prepends a synthetic `전체 보기` item when at least one real portfolio is loaded. The synthetic item uses the internal id `__all_portfolios__` and exists only in browser UI state. It is not sent to create, update, or delete endpoints.

The aggregate view merges cached real portfolio positions by stable `market + symbol` identity. Duplicate positions sum quantity and use weighted average buy price. Source portfolio names are shown as read-only context.

## Read-Only Guard Summary

The aggregate view hides the add-position button and renders aggregate rows with a `읽기 전용` badge instead of edit/delete buttons. Position submit handling also blocks synthetic aggregate mode. Portfolio edit, delete, and ordering controls remain available only on real portfolio cards.

## Valuation And Data Boundary Summary

The aggregate view preserves the existing placeholder valuation model. It does not invent current prices, live market values, P/L, FX conversion, or provider-backed valuation.

## Market Viewport Fit Summary

Market chart viewBox and CSS sizing were tuned so single Treemap and single Momentum / Trend views use less excessive vertical space. The Treemap height was reduced while preserving width and hierarchy. The scatter plot now uses more of its SVG canvas, with a larger plot rectangle and reduced margins.

## Preserved Behavior

- Preserved `d3-hierarchy`, `treemap`, and `treemapSquarify`.
- Preserved display-name-first Treemap and scatter labels.
- Preserved ticker metadata in titles and accessible labels.
- Preserved Market view modes: `Treemap`, `Momentum / Trend`, and `같이 보기`.
- Preserved `/market` as primary and `/heatmap` as backward compatible.
- Preserved browser-only fullscreen and PNG export.
- Preserved Home sticky ad behavior.
- Preserved Chart AI chart-first UX and server-only usage guard skeleton.
- Preserved Portfolio real portfolio CRUD and position CRUD.
- Preserved Header auth label stability and `Today: 000`.

## Security And Non-Goals

- No provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No Trading Economics, ETFshopping, Hankyung, or reference-site scraping/fetching was implemented.
- No DB migration was added.
- No direct SQL was run.
- No Supabase CLI or psql command was run.
- No production authenticated write validation was performed by Codex.
- No Auth user was created.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No real visitor count was implemented.
- No ad-event tracking was implemented.
- No secret values were requested or recorded.

## Provider Credential Status Note

Future provider phases may use already issued credentials only through approved server-only boundaries. No credential values were requested, printed, summarized, or recorded in this phase.

## Validation Results

- `npm run build`: passed.
- Vercel output: `.vercel/output/config.json`, `_render.func`, and static output were generated.
- `astro preview`: unavailable because the Vercel adapter does not support Astro preview.
- Local unauthenticated HTTP smoke with `astro dev`: `/`, `/portfolio`, `/chart-ai`, Chart AI prefill URL, `/lab`, `/heatmap`, and `/market` returned 200.
- Removed route HTTP smoke: `/seibro`, `/api/news`, `/api/list`, `/api/holdings`, `/api/stock`, `/api/etf`, and `/api/search` returned 404.
- Unauthenticated Chart AI API smoke: `POST /api/chart-ai/analyze` returned sanitized 401 `AUTH_REQUIRED`.
- Secret marker scan: no provider secret marker was found in generated browser/static assets. Source references were limited to expected public Supabase browser config names and server-only service-role helper code.
- Service-role scan: server-only helper references remained in server source; generated browser/static assets did not contain service-role markers.
- Disposable identifier scan: matches remained docs-only or validation-SQL-only.
- Browser automation: not used; owner browser smoke remains required for authenticated Portfolio aggregate visual behavior.

## Owner Manual Smoke Steps

Phase 3F.4 Portfolio 전체 보기/Market 화면 맞춤 재점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- `/portfolio` 진입: 통과/실패
- 포트폴리오가 1개 이상 있을 때 `전체 보기`가 목록 맨 위에 표시됨: 통과/실패
- `전체 보기` 선택 시 모든 포트폴리오 보유 종목이 합산 표시됨: 통과/실패
- 같은 시장/티커 종목이 하나의 행으로 합산됨: 통과/실패/미실행
- `전체 보기`에서 종목 추가 버튼이 보이지 않거나 사용할 수 없음: 통과/실패
- `전체 보기` 행에서 수정/삭제 대신 읽기 전용 상태가 표시됨: 통과/실패
- 개별 포트폴리오 선택 시 기존 종목 추가/수정/삭제 유지: 통과/실패/미실행
- 평가금액/현재가가 실제 시세처럼 표시되지 않고 기존 placeholder 유지: 통과/실패
- `/market` Treemap 단독 보기에서 차트가 PC 화면에 더 잘 맞음: 통과/실패
- `/market` Momentum / Trend 단독 보기에서 내부 여백이 줄고 plot 영역이 커짐: 통과/실패
- `/heatmap` 호환 진입 유지: 통과/실패
- Home sticky 광고 유지: 통과/실패/화면폭 부족
- Chart AI 차트 우선 UX 유지: 통과/실패
- Header 로그인 라벨 안정성 유지: 통과/실패
- `Today: 000` placeholder 유지: 통과/실패
- OpenAI/Gemini/KIS/OpenDART/Trading Economics/ETFshopping/한경 실제 호출 없음: 통과/실패
- 브라우저 콘솔에 token/key/raw DB error/stack trace 노출 없음: 통과/실패
- 비밀 정보 없는 메모:

## Remaining Risks

- Aggregate Portfolio behavior still needs owner authenticated browser smoke because Codex did not call authenticated Portfolio endpoints.
- Market visual fit should be judged in Chrome at the owner’s actual viewport size.
- Placeholder valuation remains intentionally incomplete until provider and valuation phases are approved.

## Recommended Next Action

Run the Phase 3F.4 owner manual smoke in Chrome, then proceed only with the next approved phase after confirming aggregate Portfolio behavior and Market viewport fit.
