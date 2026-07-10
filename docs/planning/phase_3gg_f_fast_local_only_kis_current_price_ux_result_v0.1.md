# Phase 3GG-F-FAST Result — Local-only Chart AI KIS Current Price UX Polish and Manual QA

- Status: Implemented.
- Baseline: e9f47a9ccd6c5389014eb81fcafd2a923b560713
- Branch: rebuild/phase-1-ia-shell

## Files changed

- `src/pages/chart-ai.astro` — presentational-only UX polish to the existing owner-local KIS `current_price` panel (only allowed UI source modified this phase).
- `package.json` — added `smoke:phase-3gg-f-fast` and `check:phase-3gg-f-fast` scripts.
- `docs/planning/planning_changelog.md` — prepended the Phase 3GG-F-FAST entry.
- `scripts/smoke_phase_3gg_f_fast_local_only_kis_current_price_ux.mjs` — new static smoke script (99 assertions).
- `scripts/check_phase_3gg_f_fast_contract.mjs` — new static contract checker.
- `docs/planning/phase_3gg_f_fast_local_only_kis_current_price_ux_result_v0.1.md` — this document.

No changes were made to `src/pages/api/chart-ai/local-only-kis-current-price.json.ts` or `src/lib/server/chart-ai/kis-market-data-to-chart-ai-context.mjs` — on inspection, both already satisfied this phase's requirements (current_price-only scope, explicit opt-in gate, sanitized-context-only response) without needing a narrow fix.

## UX polish summary

- Added an endpoint/symbol meta summary (`대상 엔드포인트: current_price 전용`, `기본 종목코드: 005930`) to the panel heading.
- Added a Korean safety-notice list (`OWNER_LOCAL_KIS_INTEGRATION_SAFETY_NOTICES`) covering: local-only test, not investment advice, current_price-only scope, and that raw response/credential data are never displayed.
- Updated the run button label to include the default symbol: "로컬 전용 KIS 현재가 불러오기 (005930)".
- Added a distinct loading-state message/class (`chart-owner-local-kis-integration-msg-loading`) shown immediately on click, before the distinct unavailable-state message/class (`chart-owner-local-kis-integration-msg-unavailable`).
- Added a sanitized-error-code-to-Korean-message map (`OWNER_LOCAL_KIS_INTEGRATION_ERROR_MESSAGES`) covering all 9 `SANITIZED_ERROR_CODES` values, with a generic fail-closed fallback message for any unrecognized code — no stack traces or raw provider text are ever shown.
- Formatted `currentPrice` and `volume` with `toLocaleString('ko-KR')` and 원/주 unit suffixes for readability.
- No CSS was added; the panel remains structurally/textually polished only, consistent with how sibling owner-local panels in this file are already unstyled.

## Manual/browser QA summary

Browser automation (Chrome preview tooling) was available in this environment and was used for a live browser QA session against a local `astro dev` server (`http://localhost:4321`), in addition to the static smoke script (99/99 assertions passing). All 6 QA categories from the work order were exercised live:

1. **Default `/chart-ai` hidden, no auto-fetch, no console error**: navigated to `http://localhost:4321/chart-ai` (no query string). DOM check confirmed `#chartAiOwnerLocalKisIntegrationPanel` exists with `hidden === true`. Console log capture showed no errors. Network log for the full page load showed no request to `/api/chart-ai/local-only-kis-current-price.json`.
2. **`?ownerLocalKisIntegration=1` panel visible on localhost, button visible, no auto-fetch before click**: navigated to `http://localhost:4321/chart-ai?ownerLocalKisIntegration=1`. DOM check confirmed the panel now has `hidden === false` and the run button exists with the expected label "로컬 전용 KIS 현재가 불러오기 (005930)". Console log capture showed no errors. Network log confirmed no request to the KIS route occurred on page load — only after the button was clicked.
3. **Click run button → sanitized result or fail-closed unavailable state, no raw payload/credential/stack trace**: clicked `#chartAiOwnerLocalKisIntegrationRunBtn`. The panel rendered the fail-closed unavailable message "실시간 KIS 연동이 꺼져 있어 사용할 수 없습니다." (expected, since `KIS_ENABLE_LIVE_QUOTES` is not set in this local environment, consistent with Phase 3GG-D-FAST's established environment state). The actual network request `GET /api/chart-ai/local-only-kis-current-price.json?ownerLocalKisIntegration=1&symbol=005930` returned `200 OK` with a response body inspected directly: `{"ok":true,"context":{"symbol":"005930","market":"KR","currentPrice":null,"volume":null,"timestamp":"...","sourceStatus":"unavailable","cacheStatus":"miss","sanitizedErrorCode":"PROVIDER_UNAVAILABLE","providerLabel":"KIS","integrationMode":"local-only","warnings":["sanitizedErrorCode:PROVIDER_UNAVAILABLE","source-unavailable"]}}` — containing only the 11 allowed sanitized fields, no raw KIS payload keys, no credential values, no stack trace.
4. **Non-local/static source check — local-only guards exist, opt-in required**: confirmed via the smoke script's gating-block AND-condition check (`isLocalOwnerHostname() && ownerLocalKisIntegrationOptIn`), and cross-confirmed live by observing the panel stay hidden without the query param (case 1) and become visible only with both the localhost origin and the query param present (case 2).
5. **Responsive check**: resized the browser viewport to 375×812 (mobile preset). DOM measurement confirmed the panel width (305px) stayed within the viewport width (375px) and `document.body.scrollWidth` (375px) did not exceed `window.innerWidth` (375px) — no horizontal overflow. A screenshot at this viewport confirmed the panel, safety notices, button, and result message all render legibly stacked in a single column.
6. **Safety copy — no forbidden investment language, no LLM copy, current_price only**: confirmed visually via the mobile screenshot and DOM text — all 4 safety notices render ("로컬 전용 테스트입니다.", "투자 자문이 아닙니다.", "current_price(현재가) 조회만 지원합니다.", "원본 응답 데이터와 인증 정보는 표시되지 않습니다."), plus the disclaimer sentence "매수·매도 추천 또는 투자자문이 아닙니다." No LLM-related copy or request was present, and the endpoint meta line reads "대상 엔드포인트: current_price 전용".

A full-session console error check (`level: error`) after completing all 6 cases returned no console logs at all — no errors occurred at any point during the QA session. No forbidden endpoint, credential value, or raw payload was observed in any DOM state, network request, or response body during this live session.

## API route status

Unchanged from Phase 3GG-E-INTEGRATE. `src/pages/api/chart-ai/local-only-kis-current-price.json.ts` still: requires `ownerLocalKisIntegration=1` AND a local hostname; requests only the `current_price` category; delegates to the Phase 3GG-D-FAST binding; returns only a sanitized Chart AI context built via `createChartAiKisMarketDataContext`; responds `Cache-Control: no-store`.

## Chart AI UI status

Default `/chart-ai` behavior is unaffected — the panel remains hidden unless both the localhost guard and the `?ownerLocalKisIntegration=1` query opt-in are present. No other panel on the page was modified.

## Endpoint used: current_price only

No other KIS endpoint category is reachable through this panel, route, or adapter.

## Whether outbound KIS network call occurred

No. During live browser QA, the local-only API route (`/api/chart-ai/local-only-kis-current-price.json`) was called once via the run button, and it returned `200 OK`. However, since `KIS_ENABLE_LIVE_QUOTES` is not set in this local environment (unchanged from Phase 3GG-D-FAST), the request fail-closed inside `local-only-live-kis-market-data-binding.mjs` before reaching the real `kisClient.ts` transport, producing `sanitizedErrorCode: "PROVIDER_UNAVAILABLE"` with `currentPrice`/`volume` both `null`. No request left the local machine to the real KIS API at any point in this phase's work.

## Credential exposure status

None. No credential value was read, logged, printed, or rendered at any point in this phase's work.

## Raw payload exposure status

None. The smoke script and checker both assert the absence of raw KIS payload field names (`rt_cd`, `output`, `stck_prpr`, `acml_vol`, `prdy_vrss`, `prdy_ctrt`) in the new panel content.

## Forbidden endpoint status

None added. No order, cancel/modify order, account, balance, funds, buying power, sellable quantity, profit/loss, deposit/withdrawal, trading history, portfolio/holdings, or personal endpoint exists anywhere in this phase's changes.

## Validation results

- `npm run smoke:phase-3gg-f-fast` — PASS (99/99 assertions).
- `npm run check:phase-3gg-f-fast` — PASS (132/132 assertions).
- `npm run smoke:phase-3gg-e-integrate` — PASS (113/113 assertions).
- `npm run check:phase-3gg-e-integrate` — PASS (140/140 assertions).
- `npm run smoke:phase-3gg-d-fast` — PASS (11/11 scenarios).
- `npm run check:phase-3gg-d-fast` — PASS (155/155 assertions).
- `npm run build` — PASS.
- `git diff --check` — clean (only pre-existing LF/CRLF line-ending warnings, no whitespace errors).
- Forbidden diff check (MK Agent / Similar Pattern Agent / scaffold / Supabase / data / lockfiles / env) — empty.
- KIS provider diff check (existing provider modules) — empty.

Two sibling-checker false positives were discovered and fixed while running this chain, both scoped to the sibling checkers only (no behavior change):

- A code comment added to `chart-ai.astro`'s click handler ("...never the raw provider payload or a call/stack trace...") tripped the Phase 3GG-E-INTEGRATE smoke script's `FORBIDDEN_RAW_OUTPUT_PATTERN` regex on the literal substring "stack". Reworded the comment to "an internal error trace" — no behavior change, comment-only fix in `src/pages/chart-ai.astro`.
- `scripts/check_phase_3gg_d_fast_contract.mjs` and `scripts/check_phase_3gg_e_integrate_contract.mjs` did not yet know about this phase's new deliverable files (or, for D-FAST, about the already-authorized Phase 3GG-E-INTEGRATE API route path in its forbidden-diff scan), so both were patched to tolerate this phase's already-reviewed, in-scope changes — the same "patch sibling checkers as needed" pattern used in every prior phase of this series. `scripts/check_phase_3gg_f_fast_contract.mjs`'s own working-tree-purity allowlist was updated to include these two patched sibling checker files.

## Known limitations

- No real-credential run was performed; the live QA session observed the fail-closed `PROVIDER_UNAVAILABLE` path (since `KIS_ENABLE_LIVE_QUOTES` is unset locally), not a live successful `current_price` value from the real KIS API. A real-credential run is deferred to the next phase per the work order's scope boundaries.
- No CSS styling was added to the new `<dl>`/`<ul>` markup; it inherits only the page's default unstyled presentation, matching sibling panels.

## Next recommended phase

Phase 3GG-G-FAST — Local-only KIS Current Price Real Credential Smoke, Explicit Owner Run.
