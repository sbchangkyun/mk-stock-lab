# Phase 3GG-K-QA Result — Owner-local Browser QA for Upgraded Chart AI Summary Quality

- **Status: Executed / Partial**
- **Baseline: 37e892e**
- **Branch: rebuild/phase-1-ia-shell**

## 1. Scope

This is a QA-only phase — no source feature changes. It performs owner-local browser QA against the upgraded Chart AI KIS + LLM summary quality contract introduced in Phase 3GG-K-FAST (structured 3-bullet Korean prompt contract, ASCII digit output rejection), using the real `/chart-ai` page served by `npm run dev`. Cases verified: default hidden state at `/chart-ai` (Case 1), owner-local opt-in visible idle state with `ownerLocalKisLlm=1` (Case 2, no fetch before click), click execution and H route boundary (Case 3), summary quality success path (Case 4, blocked by environment), numeric-output rejection (Case 5, not naturally triggered), blocked/unavailable state display (Case 6), mobile viewport (Case 7), and network boundary — no forbidden route call, no forbidden investment phrase, and no fetch before click on the idle panel (Case 8).

## 2. Files changed

- `docs/planning/phase_3gg_k_qa_owner_local_summary_quality_browser_qa_checklist_v0.1.md` (created)
- `docs/planning/phase_3gg_k_qa_owner_local_summary_quality_browser_qa_result_v0.1.md` (created, this document)
- `scripts/check_phase_3gg_k_qa_contract.mjs` (created)
- `package.json` (modified — added `check:phase-3gg-k-qa`)
- `docs/planning/planning_changelog.md` (modified — prepended Phase 3GG-K-QA entry)

No source feature file was modified: `src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs`, `src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts`, `src/pages/chart-ai.astro`, and `src/lib/server/chart-ai/local-only-llm-model-policy.mjs` all carry zero diff from baseline `37e892e`.

## 3. QA environment

Real running `npm run dev` (Astro) server on `http://localhost:4321`, driven via the Claude Browser MCP tool suite (`mcp__Claude_Browser__*`: navigate, read_page, read_console_messages, read_network_requests, javascript_tool for DOM/state inspection, resize_window for mobile viewport). No browser automation dependency was added to the project; the tooling is external to the repository.

## 4. Owner-local precondition

This session's dev server holds no owner-local KIS or LLM credentials by design (`.env`/`.env.local` were never opened or read, per the hard safety boundary) — the same "Explicit Owner Run" limitation documented in every prior phase in this family (Phase 3GG-G-FAST, H-HF1, I-QA). The route returned `sourceStatus: unavailable` / `sanitizedErrorCode: SOURCE_UNAVAILABLE` before the LLM bridge was ever invoked, so the upgraded summary-quality success path (Case 4) and the live numeric-rejection path (Case 5) could not be observed directly in this session.

## 5. Case summary table

| Case | Description | Result |
|---|---|---|
| 1 | Default page hidden state | PASS |
| 2 | Owner-local opt-in visible idle state | PASS |
| 3 | Click execution and route boundary | PASS |
| 4 | Upgraded summary quality success path | Blocked by environment / not executed |
| 5 | Numeric-output rejection / fail-closed behavior | Not naturally triggered in browser |
| 6 | Blocked/unavailable state display | PASS |
| 7 | Mobile viewport | PASS |
| 8 | Network boundary | PASS |

## 6. Summary quality result

Not independently re-verified live this session (Case 4 blocked by environment). The upgraded 3-bullet Korean prompt contract (labels 데이터 상태:/해석 범위:/유의사항:) was already fully verified deterministically during Phase 3GG-K-FAST's own smoke script (23/23 PASS) and static contract checker (110/110 PASS), both of which remain unchanged and passing as of this phase's baseline.

## 7. Numeric-output protection browser result

Not naturally triggered in this browser session (Case 5) — the KIS layer failed closed before the LLM bridge was ever called, so no LLM output (compliant or digit-containing) was produced to test the browser rendering path against. Numeric-output rejection itself (`FORBIDDEN_NUMERIC_OUTPUT_DETECTED`) is fully covered by Phase 3GG-K-FAST's deterministic smoke script, unaffected by this QA-only phase.

## 8. Network boundary result

PASS. Full network log reviewed across the whole QA session: only Vite/Astro dev asset loads, pre-existing unrelated page-bundle module loads (Supabase client library import, profile bootstrap, chart-ai chart-scale/mocked-OHLC modules, symbol-master modules), and exactly one call to `/api/chart-ai/local-only-kis-llm-summary.json?ownerLocalKisLlm=1&symbol=005930`. Zero calls to any order/account/balance/funds/portfolio/trading/personal/MK-agent/similar-pattern/Supabase-auth-session-JWT route. `forbiddenRouteCallDetected: false`.

## 9. Console result

Zero console errors across all 8 cases (default hidden state, opt-in idle state, click execution, blocked-state display, mobile viewport). Only benign `[vite] connecting/connected` debug lines were observed.

## 10. Mobile result

PASS at 375×812 viewport. `document.documentElement.scrollWidth` (375) equaled `window.innerWidth` (375) — no horizontal overflow. Panel bounding rect fully contained within the viewport. Button and output both visible and usable.

## 11. Sanitization result

PASS for the observed blocked-state response. The H route's response body contained only sanitized/allowlisted fields (`ok`, `symbol`, `market`, `llmStatus`, `summaryText: null`, `sanitizedErrorCode`, `modelPresent`, `sourceStatus`, `currentPricePresent`, `volumePresent`, `warnings: ["source-unavailable"]`) — no raw KIS payload, no prompt, no API key, no currentPrice numeric value, no `diagnostics` field (correctly absent, since the KIS-layer failure occurred before the LLM bridge was ever invoked, consistent with the Phase 3GG-I-QA precedent). The UI rendered only `sourceStatus`, `sanitizedErrorCode`, and a generic Korean fallback message.

## 12. Credential exposure status

Not exposed. No `OPENAI_API_KEY`, KIS credential, or Authorization header value was observed in any DOM state, network request, or response body across the session.

## 13. Raw KIS payload exposure status

Not exposed. No raw KIS field name or payload structure appeared in any response body or rendered UI text.

## 14. Raw LLM response exposure status

Not exposed. `summaryText` was `null` in the only response observed this session (blocked state); no raw OpenAI response body was ever returned or rendered.

## 15. Prompt exposure status

Not exposed. No prompt text (system or user prompt) appeared in any response body, console log, or rendered UI text.

## 16. Model name exposure status

Not exposed. No model name string appeared in any response body or rendered UI text; `modelPresent: false` was the only model-related field, a boolean per the existing allowlist.

## 17. currentPrice numeric exposure status

Not exposed. `currentPricePresent: false` / `volumePresent: false` booleans only; no numeric currentPrice or volume value appeared anywhere.

## 18. Defects found

None. All 6 directly-executable cases (1, 2, 3, 6, 7, 8) passed with real evidence. Cases 4 and 5 could not be executed due to the absence of owner-local KIS/LLM credentials in this session — an environment limitation, not a defect, consistent with every prior phase in this family.

## 19. Next recommended phase

Since no defects were found but the full success path (Case 4: upgraded 3-bullet summary quality; Case 5: live numeric-rejection behavior) could not be verified due to environment limitations: **recommend an owner-run success-path QA rerun** (with real KIS + `OPENAI_API_KEY` + `CHART_AI_LLM_MODEL` configured locally) **before Phase 3GG-L-FAST — Owner-local LLM Quality Regression Harness.**

## 20. Push/deploy status

- Not pushed.
- Not deployed.
- No public activation.
- No beta activation.
- No internal QA activation.
