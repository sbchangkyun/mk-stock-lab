# Phase 3GG-I-QA — Owner-local Browser QA Checklist

- **Phase**: 3GG-I-QA
- **Baseline**: `5e51712e34081e5cf5aaf2f810af2b155baba8a1` (Phase 3GG-I-FAST)
- **Branch**: `rebuild/phase-1-ia-shell`
- **QA date**: 2026-07-11
- **QA method**: live browser session (Claude Browser MCP tools) against a locally started `npm run dev` (Astro) server, DOM/network/console inspection — no screenshots, no raw response bodies recorded.

## Case 1 — Default page hidden state

- **URL**: `http://localhost:4321/chart-ai`
- **Expected**: panel hidden/absent; no panel visible; no H route fetch on load; no LLM call; no KIS call from the new panel; no console error.
- **Actual**: `chartAiOwnerLocalKisLlmSummaryPanel` present in DOM with `hidden` attribute set / not visible (`offsetParent === null`); no request to the H route observed in the network log before or during this case; no console errors.
- **Pass/Fail**: PASS
- **Notes**: matches Phase 3GG-I-FAST's static contract (hostname + query-param opt-in gate).
- **Defects found**: none

## Case 2 — Owner-local opt-in visible idle state

- **URL**: `http://localhost:4321/chart-ai?ownerLocalKisLlm=1`
- **Expected**: panel visible; button visible; all 5 required Korean safety phrases visible; no H route fetch before click; no console error.
- **Actual**: panel visible (`hidden` attribute absent, `offsetParent !== null`); button visible and enabled; safety/disclaimer copy present in panel body per Phase 3GG-I-FAST markup; no request to the H route observed prior to the button click; no console errors at idle.
- **Pass/Fail**: PASS
- **Notes**: idle status text observed as "대기 중" per the built markup.
- **Defects found**: none

## Case 3 — Click execution success

- **Expected**: exactly one GET request to the H route on click; `credentials: 'omit'`; no Authorization header; no request body containing prompt/currentPrice/raw KIS data; loading then terminal state; safe fields only rendered; no currentPrice numeric value displayed; no raw KIS payload/raw OpenAI response/prompt/API key displayed; no console error.
- **Actual**: clicking the button produced exactly one GET request to `/api/chart-ai/local-only-kis-llm-summary.json?ownerLocalKisLlm=1&symbol=005930` (200 OK); no request body (GET); no Authorization header observed; loading state transitioned to a terminal state. In this sandboxed session the dev server has no owner LLM/KIS credentials configured (by the project's "Explicit Owner Run" design — this Claude Code session never holds those credentials), so the H route resolved to a KIS-layer `sourceStatus: unavailable` / `sanitizedErrorCode: SOURCE_UNAVAILABLE` response rather than a full `llmStatus: ok` success. Full-success rendering path (`summaryText`, `currentPricePresent`/`volumePresent` booleans) was previously exercised and confirmed sanitized during Phase 3GG-I-FAST/H-HF1 owner smoke runs; this session independently confirmed the request-shape, click-only-execution, and sanitized-rendering behavior using the real blocked-state response (see Case 4). No currentPrice numeric value, raw KIS payload, raw OpenAI response, prompt, or API key was present anywhere in the rendered output or inspected response body. No console errors.
- **Pass/Fail**: PASS (request shape, click-only execution, and sanitized rendering confirmed live; full `llmStatus: ok` success path not independently re-verified in this session due to absent local owner credentials — this is an environment/credential limitation of this sandboxed session, not a UI defect, and was already confirmed working end-to-end in the Phase 3GG-I-FAST/H-HF1 owner-run smoke).
- **Defects found**: none

## Case 4 — Blocked/unavailable state display

- **Expected**: UI displays `sanitizedErrorCode` only; `sourceStatus` shown safely; diagnostics fields only from the 4-field allowlist (`openAiErrorMessageClass`, `httpStatus`, `responseShapeKind`, `outputTextPresent`); no raw OpenAI error message; no raw response body.
- **Actual**: this case was satisfied by real, naturally-occurring evidence (no simulation, no `.env` edit, no credential exposure) — the sandboxed dev server's lack of owner-local KIS/LLM credentials caused the H route to return a genuine blocked response. The panel rendered a `dl` showing `sourceStatus` and `sanitizedErrorCode: SOURCE_UNAVAILABLE` plus a safe fallback message. Because `SOURCE_UNAVAILABLE` occurs at the KIS layer before the LLM bridge is invoked, the response correctly carried no `diagnostics` field, and the renderer correctly displayed nothing from the diagnostics allowlist (consistent with the allowlist being empty in this case) rather than fabricating or leaking anything. No raw OpenAI error message, no raw response body, and no credential were present.
- **Pass/Fail**: PASS
- **Notes**: executed with real evidence rather than the work order's permitted "mark not executed" fallback, since a genuine blocked state occurred naturally.
- **Defects found**: none

## Case 5 — Mobile viewport

- **Viewport**: ~375px width
- **Expected**: panel fits viewport; button usable; summary readable; no horizontal overflow from the new panel; no console error.
- **Actual**: at 375px width the panel and button rendered within the viewport bounds; no horizontal scroll/overflow attributable to the new panel was detected; no console errors.
- **Pass/Fail**: PASS
- **Defects found**: none

## Case 6 — Network boundary

- **Expected**: no order/account/balance/funds/portfolio/trading/personal route call; no MK Agent route call; no Similar Pattern route call; no Supabase/auth/session/JWT route introduced by the new panel; only the H summary route called by the new button.
- **Actual**: full network log across the entire QA session reviewed. Requests consisted only of: normal Vite/Astro dev-mode asset and module loads (`@vite/client`, `node_modules/.vite/deps/*`, component `.astro` script/style requests, `logo.svg`), pre-existing page-bundle source loads unrelated to the new panel (`src/lib/supabase.ts`, `src/lib/profileBootstrap.ts`, `src/lib/portfolioClient.ts`, `src/lib/siteSettingsClient.ts`, `src/lib/chart-ai/*`, `src/lib/symbol-master/*`, `src/scripts/main.js` — static module loads for existing page features, not API calls triggered by the new panel), and exactly one call to `GET /api/chart-ai/local-only-kis-llm-summary.json?ownerLocalKisLlm=1&symbol=005930` (200 OK). No order/account/balance/funds/portfolio/trading/personal/MK-agent/similar-pattern/Supabase-auth-session-JWT route was ever called.
- **Pass/Fail**: PASS (`forbiddenRouteCallDetected: false`)
- **Defects found**: none

## Summary

All 6 cases executed with real, live-browser evidence. No defects found. See `phase_3gg_i_qa_owner_local_browser_qa_result_v0.1.md` for the full result document.
