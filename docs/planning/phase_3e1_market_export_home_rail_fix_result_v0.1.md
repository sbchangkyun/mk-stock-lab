# Phase 3E.1 Market Export And Home Rail Fix Result v0.1

Date: 2026-06-20

## Status And Scope

Status: implementation and local validation completed.

Phase 3E.1 fixed the post-smoke Home rail/footer viewport issue, added Market card expanded viewing, and hardened browser-only PNG export. The work preserved the Phase 3E Market route strategy, Chart AI chart-first UX, and Phase 3D server-only usage guard skeleton.

## Files Changed

- `package.json`
- `package-lock.json`
- `src/components/Footer.astro`
- `src/components/MarketShell.astro`
- `src/lib/exportCardImage.ts`
- `src/styles/style.css`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`
- `docs/planning/phase_3e1_market_export_home_rail_fix_result_v0.1.md`

## Owner Phase 3E Smoke Feedback Summary

- Home preview panel was gone.
- Home rail rotated between two sample banners.
- Home rail stayed absent from non-Home pages.
- Market nav, route, sections, heatmap cards, scatter cards, and camera icons were visible.
- Chart AI chart-first corrections passed.
- Provider calls, Portfolio behavior, Header auth, `Today: 000`, and console safety remained stable.
- Corrections needed:
  - Home right rail was clipped at the bottom on the owner desktop viewport.
  - Bottom footer/ad followed scrolling and reduced visible area.
  - Market cards needed expanded/fullscreen inspection.
  - PNG export failed in Chrome.

## Footer Fixed Behavior Fix Summary

- Removed viewport-following behavior from `.fixed-bottom-area`.
- Removed the body bottom padding that existed only to compensate for the fixed bottom area.
- The footer/ad block now stays in normal document flow at the bottom of the page.
- Footer content and the existing close behavior were preserved.

## Home Rail Clipping Fix Summary

- The Home rail remains imported only by `src/pages/index.astro`.
- The rail remains absent from non-Home routes.
- The rail still uses existing local `160x600` sample SVG banners.
- The rail top offset was moved higher below the header/ticker/nav stack.
- The viewport now uses `height: min(600px, calc(100vh - 156px))`.
- The banner image uses `object-fit: contain` so the full creative is visible when the viewport cannot fit the full 600px height.

## Home Rail Breakpoint And Positioning Summary

- Breakpoint remains aligned with Phase 3E at `1440px`.
- Width remains `160px`.
- Full `160x600` display is preserved when vertical space allows.
- In shorter desktop viewports, the visible rail area scales down without cropping the bottom of the banner.
- The Home-only content-width adjustment from Phase 3E remains in place to avoid covering primary content.

## Market Card Fullscreen Summary

- Added an expand button next to each camera button.
- Expand opens a modal overlay with a larger copy of the selected card.
- The overlay preserves title, subtitle, chart content, and labels.
- The overlay closes through:
  - close button
  - backdrop click
  - ESC key
- The overlay does not navigate and does not trigger provider calls.
- The overlay also includes an export button for the expanded card.

## PNG Export Failure Root-Cause Assessment

The Phase 3E export path serialized DOM into SVG `foreignObject`, then drew that SVG to canvas. This is fragile in Chrome when computed styles, fonts, nested SVG, or unsupported CSS are present. The owner alert was consistent with that browser-side rendering path failing before PNG download.

## PNG Export Hardening Summary

- Replaced the hand-rolled `foreignObject` export implementation with `html-to-image`.
- Export remains browser-only.
- Export waits for document fonts when available.
- Export uses an explicit white background.
- Export filters out camera and expand action buttons.
- Export keeps sanitized card-specific filenames with a date suffix.
- Export still downloads locally through the browser.
- Export does not upload files, store files in DB, or send analytics.

## Export Dependency Summary

- Added `html-to-image`.
- Updated `package.json` and `package-lock.json`.
- Imported it only from `src/lib/exportCardImage.ts`, which is used by browser-executed Market page scripts.
- No server-side export dependency or browser automation dependency was added.

## Market Page Preservation Summary

- `/market` remains the primary Market route.
- `/heatmap` remains backward-compatible.
- `시장` remains the primary nav label.
- KOSPI200, KOSDAQ150, S&P500, NASDAQ100, and My Portfolio holdings remain.
- Heatmap and scatter cards remain.
- Short-term momentum vs long-term trend semantics remain.
- Static/sample data only remains.

## Chart AI Preservation Summary

- No question input.
- `차트 불러오기` remains.
- `일봉`, `주봉`, and `월봉` remain in the chart area.
- Query prefill remains.
- `AI 분석 실행` remains a follow-up action after chart readiness.
- Phase 3D server-only usage guard skeleton remains.

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

## Security Notes

- No browser service-role exposure was added.
- No token logging was added.
- No raw DB errors were added to browser-visible UI.
- No provider secrets were requested, read, recorded, or printed.
- Chart AI API continues to derive user identity from server-validated auth and does not trust browser-submitted user IDs.

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
- Removed legacy routes returned 404.
- Unauthenticated POST to `/api/chart-ai/analyze`: sanitized 401.
- Browser automation was unavailable in this environment; owner browser smoke remains required for final visual/export confirmation.

## Owner Manual Smoke Steps

```text
Phase 3E.1 Home 광고/시장 카드 보정 점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- Home 오른쪽 광고 배너가 하단 잘림 없이 표시됨: 통과/실패/화면폭 부족
- 하단 footer 또는 footer ad가 스크롤을 따라다니지 않음: 통과/실패
- Home 광고 배너가 2개 샘플로 5초마다 전환됨: 통과/실패/미실행
- 비 Home 페이지에서 Home 광고 배너 미노출: 통과/실패
- Market Heatmap 카드 확대 보기 열림/닫힘: 통과/실패
- Market 산점도 카드 확대 보기 열림/닫힘: 통과/실패
- ESC로 확대 보기 닫힘: 통과/실패/미실행
- 카메라 아이콘 클릭 시 PNG 이미지가 로컬에 저장됨: 통과/실패
- 저장된 PNG에 카드 제목과 차트 본문이 포함됨: 통과/실패/미실행
- 저장된 PNG에 카메라/확대 아이콘이 불필요하게 포함되지 않음: 통과/실패/미실행
- Chart AI 차트 우선 UX 유지: 통과/실패
- OpenAI/Gemini/KIS/OpenDART/Trading Economics 실제 호출 없음: 통과/실패
- 브라우저 콘솔에 token/key/raw DB error/stack trace 노출 없음: 통과/실패
- 비밀 정보 없는 메모:
```

## Remaining Risks

- Final Chrome download behavior must be confirmed by owner browser smoke.
- Export quality can vary by browser because DOM-to-image rendering remains browser-dependent.
- Market data remains static sample data.

## Recommended Next Action

Run the Phase 3E.1 owner manual smoke in Chrome at the owner desktop viewport. If it passes, proceed to the next approved provider-boundary or market-data planning phase.
