# Phase 3GG-K-QA Checklist — Owner-local Browser QA for Upgraded Chart AI Summary Quality

- **Phase**: Phase 3GG-K-QA
- **Baseline**: 37e892e (Phase 3GG-K-FAST)
- **Branch**: rebuild/phase-1-ia-shell
- **QA date**: 2026-07-11
- **QA method**: Browser MCP tool suite (`mcp__Claude_Browser__*`) against a real running `npm run dev` (Astro) server on `http://localhost:4321`

## Case 1 — Default page hidden state

- **URL**: `http://localhost:4321/chart-ai`
- **Expected**: `chartAiOwnerLocalKisLlmSummaryPanel` hidden/absent from visible layout; no H route fetch on page load; no LLM/KIS call triggered by the new panel; no console error.
- **Actual**: Panel present in DOM but `hidden` attribute set, `display: none`, `offsetParent === null`. No request to the H route recorded. Console showed only `[vite] connecting/connected` debug lines, no errors.
- **Result**: PASS
- **Notes**: —
- **Defects found**: None

## Case 2 — Owner-local opt-in visible idle state

- **URL**: `http://localhost:4321/chart-ai?ownerLocalKisLlm=1`
- **Expected**: Panel and button visible; Korean local-only/safety copy visible; no H route fetch before click; no console error.
- **Actual**: Panel `display: block`, `hidden` attribute absent, `offsetParent !== null`. Button visible. Panel text confirmed verbatim: "소유자 로컬 테스트 전용", "로컬 전용 KIS + LLM 요약", "페이지 로드시 자동 실행되지 않습니다.", "버튼 클릭 시에만 현재가 기반 요약을 요청합니다.", "투자 자문이 아니며 매수·매도 추천을 제공하지 않습니다.", idle status text "대기 중". No H route request recorded before click. No console errors.
- **Result**: PASS
- **Notes**: —
- **Defects found**: None

## Case 3 — Click execution and route boundary

- **URL**: `http://localhost:4321/chart-ai?ownerLocalKisLlm=1`
- **Expected**: Exactly one request to `/api/chart-ai/local-only-kis-llm-summary.json?ownerLocalKisLlm=1&symbol=005930`, method GET, credentials omitted, no Authorization header, no request body containing prompt/currentPrice/raw KIS data, no forbidden route call, no console error.
- **Actual**: Exactly one request to the exact expected URL, method GET (no body, as a GET request carries none), response `200 OK`. No forbidden route was called. No console errors observed during or after the click.
- **Result**: PASS
- **Notes**: Credentials-omit/no-Authorization-header behavior was verified statically by Phase 3GG-K-FAST/H-FAST source inspection (unchanged, zero-diff this phase) and is consistent with the observed network behavior (no auth prompt, no CORS/credential-related console error).
- **Defects found**: None

## Case 4 — Upgraded summary quality success path

- **Expected**: If owner-local KIS+LLM env is configured, route returns `summary.ok=true`, UI displays a 3-bullet Korean `summaryText` with required labels, no ASCII digits, no forbidden phrases, not-investment-advice statement present.
- **Actual**: This session's dev server holds no owner-local KIS/LLM credentials (same "Explicit Owner Run" limitation as every prior phase in this family — `.env`/`.env.local` were not opened or read, per hard safety boundary). The route returned `sourceStatus: unavailable` / `sanitizedErrorCode: SOURCE_UNAVAILABLE` before the LLM bridge was ever invoked, so no `summaryText` was ever produced to inspect.
- **Result**: Blocked by environment / not executed
- **Notes**: Full success-path summary-quality verification (3-bullet labels, digit absence, forbidden-phrase absence) requires an owner-run session with real KIS + `OPENAI_API_KEY` + `CHART_AI_LLM_MODEL` configured locally.
- **Defects found**: None (blocked, not failed)

## Case 5 — Numeric-output rejection / fail-closed behavior

- **Expected**: If the live LLM naturally triggers numeric-output rejection, `summary.ok=false`, `sanitizedErrorCode=FORBIDDEN_NUMERIC_OUTPUT_DETECTED`, no digits/raw response/prompt/currentPrice shown.
- **Actual**: Not naturally triggered — the KIS layer failed closed with `SOURCE_UNAVAILABLE` before the LLM bridge was ever called, so no LLM output (compliant or rejected) was produced in this session.
- **Result**: Not naturally triggered in browser
- **Notes**: Numeric-output rejection is already covered deterministically by Phase 3GG-K-FAST's smoke script (`scripts/smoke_phase_3gg_k_fast_summary_quality_upgrade.mjs`, 23/23 PASS, includes dedicated ASCII-digit-rejection cases). No source/env was modified to force this path, per the hard safety boundary against unsafe simulation.
- **Defects found**: None

## Case 6 — Blocked/unavailable state display

- **URL**: `http://localhost:4321/chart-ai?ownerLocalKisLlm=1`
- **Expected**: UI displays `sanitizedErrorCode` only, `sourceStatus` shown safely, diagnostics fields (if present) allowlisted only, no raw OpenAI error message, no raw response body, no prompt, no API key, no currentPrice numeric value, no console error.
- **Actual**: Response body: `{"ok":true,"summary":{"ok":false,"symbol":"005930","market":"KR","llmStatus":"unavailable","summaryText":null,"sanitizedErrorCode":"SOURCE_UNAVAILABLE","modelPresent":false,"sourceStatus":"unavailable","currentPricePresent":false,"volumePresent":false,"warnings":["source-unavailable"]}}`. All fields are sanitized/allowlisted booleans/status strings; `summaryText` is `null`; no raw KIS payload, no prompt, no API key, no currentPrice numeric value. UI rendered: "소스 상태: unavailable", "오류 코드: SOURCE_UNAVAILABLE", and a generic Korean fallback message ("로컬 전용 KIS + LLM 요약을 사용할 수 없습니다. 로컬 환경 설정을 확인해 주세요."). No `diagnostics` field was present (expected — a KIS-layer failure occurs before the LLM bridge, consistent with the Phase 3GG-I-QA precedent). No console errors.
- **Result**: PASS
- **Notes**: This response also serves as valid evidence for Case 3's sanitized-response-shape requirement.
- **Defects found**: None

## Case 7 — Mobile viewport

- **Viewport**: 375×812
- **Expected**: Panel fits viewport, button usable, summary/blocked message readable, no horizontal overflow, no console error.
- **Actual**: `document.documentElement.scrollWidth` = 375 = `window.innerWidth`, so `horizontalOverflow: false`. Panel bounding rect fully within viewport (`panelWithinViewport: true`). Button and output both visible (`offsetParent !== null`). No console errors.
- **Result**: PASS
- **Notes**: —
- **Defects found**: None

## Case 8 — Network boundary

- **Expected**: No order/account/balance/funds/portfolio/trading/personal route call; no MK Agent route call; no Similar Pattern route call; no Supabase/auth/session/JWT route introduced by the new panel; only the H summary route called by the new button.
- **Actual**: Full network log reviewed across the entire QA session. All requests were Vite/Astro dev asset loads, pre-existing unrelated page-bundle module loads (`supabase.ts` client library import — not an auth/session API call, `profileBootstrap.ts`, `chartScale.ts`, `mockedOhlc.ts`, `ohlcPreviewChart.ts`, `clientSymbolSearch.ts`, `normalize.ts`), and exactly one call to `/api/chart-ai/local-only-kis-llm-summary.json`. Zero calls to any order/account/balance/funds/portfolio/trading/personal/MK-agent/similar-pattern/Supabase-auth-session-JWT route.
- **Result**: PASS (`forbiddenRouteCallDetected: false`)
- **Notes**: —
- **Defects found**: None

## Summary

- **Cases executed with real evidence and PASS**: 1, 2, 3, 6, 7, 8 (6 of 8)
- **Cases Blocked/not-executed due to environment (not a defect)**: 4
- **Cases not naturally triggered (not a defect, covered by deterministic smoke)**: 5
- **Defects found**: None
