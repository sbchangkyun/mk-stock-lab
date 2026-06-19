# Phase 3D Chart AI Usage Guard Result v0.1

Date: 2026-06-19

## Status And Scope

Status: implementation and local unauthenticated validation completed.

Phase 3D added the Chart AI server-only execution skeleton and usage-guard boundary. The work did not implement real provider calls, market-data fetching, AI analysis, Chart AI cache writes, visitor counting, ad-event tracking, deployments, SQL, Supabase CLI, `psql`, Auth user creation, or production write validation by Codex.

## Files Changed

- `.gitignore`
- `src/lib/server/chartAiUsage.ts`
- `src/pages/api/chart-ai/analyze.ts`
- `src/lib/chartAiClient.ts`
- `src/pages/chart-ai.astro`
- `src/styles/style.css`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`
- `docs/planning/phase_3d_chart_ai_usage_guard_result_v0.1.md`

## Implementation Summary

- Added POST-only `/api/chart-ai/analyze`.
- Server route validates the bearer token through the existing server auth helper.
- The server derives the user ID from validated auth state and does not accept or trust a browser-submitted `user_id`.
- Request input is limited to `symbol`, `name`, `market`, `timeframe`, and `question`.
- Browser-supplied provider names, model names, user IDs, and usage values are ignored because they are not accepted fields.
- Added `src/lib/server/chartAiUsage.ts` as the server-only usage helper.
- The helper calls `internal.consume_chart_ai_usage` through the service-role admin boundary when runtime config is available.
- The helper normalizes the usage result into `allowed`, `used`, `limit`, `remaining`, `usageDateKst`, and `reason`.
- Errors are mapped to sanitized unavailable/limit/auth responses.
- Successful authenticated and allowed requests return deterministic placeholder content with `status: "ready_for_provider_integration"`.
- The placeholder explicitly avoids investment advice and provider execution.

## Usage Function Boundary

The migration defines `internal.consume_chart_ai_usage(uuid, integer)` with `p_free_limit` as the second argument. The server helper passes the current Phase 2 free limit of `3`; the database function consumes one usage per successful call internally.

Codex did not execute this function against production because Phase 3D did not include approval for authenticated production write validation.

## Chart AI UI Summary

- `/chart-ai` now includes an execution panel with:
  - selected security prefill preservation
  - timeframe selector
  - optional question field
  - `AI 분석 실행` action
  - loading, signed-out, setup/error, limit, and success states
- The client helper obtains the current browser Supabase session and sends only the access token as a bearer token.
- The client does not log, store, print, or expose tokens.
- The page does not call `/api/chart-ai/analyze` on initial load.
- Signed-out users can see the page but receive a login-required state when attempting execution.

## Validation Results

- `npm run build`: pass.
- Vercel output generated:
  - `.vercel/output/config.json`
  - `.vercel/output/functions/_render.func`
  - `.vercel/output/static`
- `npm run preview` could not be used because the Vercel adapter does not support Astro preview.
- Local HTTP smoke used `npm run dev` without authenticated tokens or production writes.
- Active route smoke:
  - `/`: 200
  - `/chart-ai`: 200
  - `/chart-ai?symbol=005930&name=Samsung&market=KR`: 200
  - `/portfolio`: 200
  - `/lab`: 200
  - `/heatmap`: 200
- Removed route smoke:
  - `/seibro`: 404
  - `/api/news`: 404
  - `/api/list`: 404
  - `/api/holdings`: 404
  - `/api/stock`: 404
  - `/api/etf`: 404
  - `/api/search`: 404
- Unauthenticated POST to `/api/chart-ai/analyze`: sanitized 401.
- Browser automation was not completed because Playwright was not installed and no browser-control tool was directly available.

## Secret And Server Boundary Scan

- Provider secret marker names were found only in expected Supabase helper source files.
- Generated static/browser assets did not contain provider secret marker names or server-only service-role markers.
- Service-role helper markers remained in server source only.
- No service-role helper import was added to browser-executed client code.
- Disposable validation identifiers remained limited to docs and validation SQL.
- Removed legacy route strings were absent from product source and generated output.
- Broad crypto scan found only the approved asset-class returns context and bundled library code.
- No logo/banner scraping, remote discovery, or external asset download code was added.
- No real visitor-count API, DB, migration, local counter, or analytics code was added.
- No ad-event route or tracking logic was added.

## Preserved Behavior

- Header auth label stability was preserved.
- The visible `확인 중` label remains absent from initial header UI.
- `Today: 000` remains a placeholder only.
- Portfolio behavior and client/server boundary were not changed.
- Chart AI selected-security prefill remains available through `symbol`, `name`, and `market` query parameters.
- Home rail preview fallback behavior was not changed.
- Provider credential status remains for future phases only:
  - KIS REST API APP KEY has been issued.
  - KIS REST API APP Secret has been issued.
  - OpenDART API KEY has been issued.
  - No actual values were requested, read, recorded, or printed.

## Explicit Non-Goals

- No production write validation by Codex.
- No authenticated Chart AI production call by Codex.
- No Portfolio production write call by Codex.
- No DB mutation.
- No SQL.
- No Supabase CLI.
- No `psql`.
- No Auth user creation.
- No Vercel environment mutation.
- No deployment.
- No OpenAI, Gemini, KIS, or OpenDART integration.
- No Chart AI provider call.
- No AI execution.
- No market-data ingestion.
- No `chart_ai_cache` writes.
- No ad-event route or tracking.
- No analytics.
- No real visitor-count API, DB table, migration, local counter, or analytics.
- No FX conversion.
- No valuation analytics.
- No performance analytics.
- No provider autocomplete.
- No logo/banner scraping.
- No remote discovery.
- No external asset download.

## Owner Smoke Instructions

```text
Phase 3D Chart AI 사용량 가드 Skeleton 점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- `/chart-ai` 진입: 통과/실패
- `/chart-ai?symbol=005930&name=삼성전자&market=KR` 선택 종목 프리필: 통과/실패
- 로그아웃 상태에서 `AI 분석 실행` 클릭 시 로그인 필요 상태 표시: 통과/실패
- 로그인 상태에서 `AI 분석 실행` 클릭 시 서버 사용량 가드 확인 시도: 통과/실패/미실행
- 성공 시 실제 AI 분석이 아니라 준비 상태 안내만 표시: 통과/실패/미실행
- 일일 한도 초과 시 한도 안내 표시: 통과/실패/미실행
- 서비스 설정 부족 시 설정 필요 안내 표시: 통과/실패/미실행
- 브라우저 콘솔에 token/key/raw DB error/stack trace 노출 없음: 통과/실패
- OpenAI/Gemini/KIS/OpenDART 실제 호출 없음: 통과/실패
- Portfolio 생성/수정/삭제 동작 유지: 통과/실패/미실행
- Header 로그인 라벨 안정성 유지: 통과/실패
- `Today: 000` placeholder 유지: 통과/실패
- 실제 방문자 집계가 아직 동작하지 않음: 통과/실패
- 비밀 정보 없는 메모:
```

Do not include credentials, tokens, project references, environment values, secret query strings, or screenshots containing secrets.

## Remaining Risks

- Authenticated runtime consumption of `internal.consume_chart_ai_usage` still needs owner-approved manual validation because Codex did not perform production authenticated write validation.
- Provider integration remains intentionally unimplemented.
- Browser visual automation was not available locally; owner browser smoke remains required.

## Recommended Next Action

Run the Phase 3D owner manual smoke. If it passes, proceed to the next approved phase for provider-boundary planning or controlled Chart AI provider integration preparation.
