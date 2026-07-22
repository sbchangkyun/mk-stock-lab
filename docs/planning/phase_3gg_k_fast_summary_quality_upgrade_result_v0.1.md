# Phase 3GG-K-FAST Result — Chart AI Summary Quality Upgrade

- **Status: Implemented**
- **Baseline: dac22b10f9800b55f66450fcf36cd280dd21f068** (Phase 3GG-J-HF1)
- **Branch: rebuild/phase-1-ia-shell**

## 1. Purpose

Phase 3GG-J-HF1 wired the model-tier env keys through the local-only H route so the bridge's model policy/fallback logic could actually receive them. Phase 3GG-K-FAST is a small, explicitly-scoped quality upgrade that improves the Korean summary the bridge produces — the prompt contract and output sanitization — without touching the H route, the UI, the model policy module, or any KIS endpoint.

## 2. Scope

Not a feature-expansion, UI, or KIS-expansion phase. It changes exactly two things inside the runtime bridge: the LLM prompt contract (`buildLlmSafeCurrentPricePrompt`) and the output sanitization contract (`sanitizeLlmSummaryText`).

## 3. Files changed

- `src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs` — upgraded `buildLlmSafeCurrentPricePrompt` to a structured 3-bullet Korean contract; the model is now given only presence/absence of `currentPrice`/`volume` data (never the raw numeric values); strengthened `sanitizeLlmSummaryText` with an ASCII-digit rejection guard and the new `FORBIDDEN_NUMERIC_OUTPUT_DETECTED` sanitized error code; added the `forbidden-numeric-output-detected` warning label to the response-building warnings map.
- `scripts/check_phase_3gg_j_hf1_contract.mjs` — tiny checker-only compatibility fix. J-HF1's checker asserted the bridge carries zero diff from the J-FAST baseline (a route-only-hotfix assumption that predates this authorized phase). Removed the bridge from that checker's `NO_DIFF_EXPECTED_PATHS` and added K-FAST's own deliverables to its working-tree tolerance list, with explanatory comments. This is a narrowing of a stale scope, not a weakening of any safety assertion — the bridge's contract is now verified by `check_phase_3gg_k_fast_contract.mjs`.

## 4. Files created

- `scripts/smoke_phase_3gg_k_fast_summary_quality_upgrade.mjs` — 23-case deterministic smoke script using injected fake env and fake fetch.
- `scripts/check_phase_3gg_k_fast_contract.mjs` — static contract checker for this phase.
- `docs/planning/phase_3gg_k_fast_summary_quality_upgrade_result_v0.1.md` — this document.

## 5. Summary quality changes

The final Korean summary is now structured as exactly 3 short bullets with the recommended labels `데이터 상태:`, `해석 범위:`, `유의사항:`, covering: whether current-price/volume data is available and its source status; that this information alone is not enough for an investment judgment; and an explicit statement that the summary is not investment advice.

## 6. Prompt contract changes

`buildLlmSafeCurrentPricePrompt` no longer interpolates the raw numeric `currentPrice`/`volume` values into the data shown to the model — only their presence/absence (`있음`/`없음`) and the source status string. The system prompt instructs the model to never output exact numeric price/volume values, to never recommend buy/sell, to never include a target price or stop-loss price, to never include an entry timing, and to never assert future price movement with certainty.

## 7. Numeric-output protection

`sanitizeLlmSummaryText` now rejects any final summary text containing an ASCII digit (`[0-9]`) before it can reach the response, using the new `SANITIZED_LLM_ERROR_CODES.FORBIDDEN_NUMERIC_OUTPUT_DETECTED` code and the `forbidden-numeric-output-detected` warning label. The rejection never inspects, prints, or returns which digit(s) were detected — the response's `summaryText` is `null` on rejection, identical to the existing forbidden-language and empty-output failure paths.

## 8. Forbidden language protection

Unchanged from prior phases: `FORBIDDEN_KOREAN_INVESTMENT_PHRASES` is still checked first, and the numeric-digit check runs after it, both fully independent fail-closed gates.

## 9. Fallback behavior status

Unchanged. `CHART_AI_LLM_MAIN_MODEL` is still preferred over legacy `CHART_AI_LLM_MODEL`; a distinct `CHART_AI_LLM_FALLBACK_MODEL` is still attempted exactly once, only on an approved fallback-eligible error class; no fallback on `invalid_api_key`, `bad_request`, timeout, invalid input, missing config, or forbidden language/numeric output (all of these still return their own fail-closed response without ever attempting a fallback call).

## 10. Backward compatibility status

Preserved. The legacy `CHART_AI_LLM_MODEL` key still resolves the main model role when `CHART_AI_LLM_MAIN_MODEL` is absent.

## 11. Route contract status

Unchanged. `src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts` has zero diff from baseline; the route still returns `{ ok: true, summary: llmSummary }`.

## 12. UI change status

None. `src/pages/chart-ai.astro` has zero diff from baseline.

## 13. Model exposure status

Not exposed. `ALLOWED_LLM_SUMMARY_RESPONSE_FIELDS` is unchanged from baseline — no model name field was added; no model name string appears in any response verified by the smoke script.

## 14. Credential exposure status

Not exposed. The bridge never logs `OPENAI_API_KEY` or an `Authorization` header value; verified by static regex checks in the checker and by a runtime console-output self-audit in the smoke script.

## 15. Raw KIS payload exposure status

Not exposed. No new raw KIS field reference was introduced this phase; the pre-existing `FORBIDDEN_INPUT_VALUE_PATTERN` denylist is unchanged.

## 16. Raw LLM response exposure status

Not exposed. The bridge continues to return only the sanitized `summaryText`/`sanitizedErrorCode`/`warnings`/allowlisted `diagnostics` fields — never the raw OpenAI response body or a raw nested `error` object; verified by the smoke script's fallback-failure case.

## 17. Prompt exposure status

Not exposed. The bridge never logs `systemPrompt` or `userPrompt`; verified by static regex check in the checker.

## 18. currentPrice numeric exposure status

Not exposed. The prompt no longer receives the raw numeric currentPrice/volume in its data lines (presence/absence only), and the numeric-output guard additionally rejects any ASCII digit in the final summary text as defense in depth.

## 19. KIS endpoint expansion status

None. Still `current_price` only; no order/account/balance/funds/portfolio/trading/personal endpoint referenced.

## 20. Validation results

- `npm run smoke:phase-3gg-k-fast` — PASS (23/23 cases).
- `npm run check:phase-3gg-k-fast` — PASS.
- `npm run smoke:phase-3gg-j-hf1` — PASS (regression check, unaffected by this phase).
- `npm run check:phase-3gg-j-hf1` — PASS (regression check, confirms the checker compatibility fix works and no other J-HF1 assertion regressed).
- `npm run smoke:phase-3gg-j-fast` — PASS (regression check, unaffected by this phase).
- `npm run check:phase-3gg-j-fast` — PASS (regression check, unaffected by this phase).
- `npm run build` — PASS.
- `git diff --check` — clean (no whitespace conflict markers).

## 21. Known limitations

The prompt instructs the model not to output exact numeric values and the sanitizer additionally rejects any ASCII digit as defense in depth; this means a compliant model output can never contain digits at all (e.g. no "3개월" style relative references with digits), which is an intentionally conservative trade-off in favor of never leaking the currentPrice/volume value. No real OpenAI call has been exercised this phase — validation is fully deterministic via fake env/fetch, consistent with prior phases' owner-local-only design.

## 22. Push/deploy status

Not pushed. Not deployed. No public activation. No beta activation. No internal QA activation.

## 23. Next recommended phase

**Phase 3GG-K-QA — Owner-local Browser QA for Upgraded Chart AI Summary Quality.**
