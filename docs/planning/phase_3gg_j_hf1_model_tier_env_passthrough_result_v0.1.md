# Phase 3GG-J-HF1 Result — Model Tier Env Passthrough for Local-only H Route

- **Status: Implemented**
- **Baseline: 8fa1501886a0dc7e5e0c57c050b8018b80002db2** (Phase 3GG-J-FAST)
- **Branch: rebuild/phase-1-ia-shell**

## 1. Purpose

Phase 3GG-J-FAST implemented a model tier/fallback policy module and wired it into the local-only LLM runtime bridge, but deliberately left the H route (the only real caller of that bridge) untouched. As a result, the new env keys the policy module supports had no way to reach the bridge in an actual route call. Phase 3GG-J-HF1 is a small, explicitly-scoped integration hotfix that closes that gap — nothing else.

## 2. Scope

This phase is **not** a feature-expansion phase. It changes exactly one runtime behavior: which environment variables the H route forwards into the bridge's `env` parameter.

## 3. Files changed

- `src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts` — added 5 new keys to the `env: {...}` object passed to `runLocalOnlyLlmRuntimeBridge`. No other line changed: gating (`ownerLocalKisLlm=1` + local hostname guard), symbol validation, `blockedSummaryResponse`, the KIS binding call, `createChartAiKisMarketDataContext`, the response shape (`{ ok: true, summary: llmSummary }`), and the `ALL` 405 handler are all unchanged.
- `scripts/check_phase_3gg_j_fast_contract.mjs` — tiny checker-only compatibility fix. The J-FAST checker's forbidden-diff list predates this authorized phase and would otherwise fail once the H route was legitimately modified. Removed the H route from that list (with an explanatory comment) and added a J-HF1 tolerance list to its working-tree scan. `src/pages/chart-ai.astro` remains forbidden in that checker, since the UI is unchanged this phase. This is a narrowing of a stale scope, not a weakening of any safety assertion.

## 4. Files created

- `scripts/smoke_phase_3gg_j_hf1_model_tier_env_passthrough.mjs` — 22-case deterministic, source-based smoke script.
- `scripts/check_phase_3gg_j_hf1_contract.mjs` — static contract checker for this phase.
- `docs/planning/phase_3gg_j_hf1_model_tier_env_passthrough_result_v0.1.md` — this document.

## 5. Env keys passed through

Newly added: `CHART_AI_LLM_MAIN_MODEL`, `CHART_AI_LLM_FALLBACK_MODEL`, `CHART_AI_LLM_TEST_MODEL`, `CHART_AI_LLM_MODERATION_MODEL`, `CHART_AI_LLM_EMBEDDING_MODEL`.

Preserved from before: `CHART_AI_ENABLE_LOCAL_LLM`, `OPENAI_API_KEY`, `CHART_AI_LLM_MODEL`.

## 6. Backward compatibility

The legacy `CHART_AI_LLM_MODEL` key continues to be passed through unchanged. No existing key was removed, renamed, or repurposed. The bridge's own model policy module resolves `CHART_AI_LLM_MAIN_MODEL` in preference to `CHART_AI_LLM_MODEL` when both are present (unchanged J-FAST behavior); this phase only ensures the new key can actually reach that resolution logic through a real route call.

## 7. Route contract status

Unchanged. The route still returns `{ ok: true, summary: llmSummary }` (or the sanitized blocked-response shape on gating failure); no new top-level response field was added; no model name is ever present in the response.

## 8. UI change status

None. `src/pages/chart-ai.astro` has zero diff from the Phase 3GG-J-FAST baseline (verified by `git diff --name-only` in both the smoke script and the checker).

## 9. Model policy change status

None. `src/lib/server/chart-ai/local-only-llm-model-policy.mjs` has zero diff from baseline this phase.

## 10. Bridge change status

None. `src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs` has zero diff from baseline this phase.

## 11. Credential exposure status

Not exposed. The route never logs `OPENAI_API_KEY` or an `Authorization` header value; verified by static regex checks in both the smoke script and the checker.

## 12. Raw KIS payload exposure status

Not exposed. No raw KIS field name (`rt_cd`, `stck_prpr`, `acml_vol`, `prdy_vrss`, `prdy_ctrt`) appears in the route source.

## 13. Raw LLM response exposure status

Not exposed. No `rawBody`, `parsedBody`, or `output_text` field appears in the route source; the route only ever forwards the sanitized `llmSummary` object returned by the bridge.

## 14. Prompt exposure status

Not exposed. The route does not construct or log any prompt text; prompt construction remains entirely inside the unmodified bridge module.

## 15. currentPrice numeric exposure status

Not exposed in this document or in any new script/checker output — no literal price value is printed or logged by the new deliverables.

## 16. KIS endpoint expansion status

None. The route still requests `category: 'current_price'` only; no order/account/balance/funds/portfolio/trading/personal endpoint was added or referenced.

## 17. Validation results

- `npm run smoke:phase-3gg-j-hf1` — PASS (22/22 cases).
- `npm run check:phase-3gg-j-hf1` — PASS.
- `npm run smoke:phase-3gg-j-fast` — PASS (regression check, unaffected by this phase).
- `npm run check:phase-3gg-j-fast` — PASS (regression check, confirms the checker compatibility fix works and no other J-FAST assertion regressed).
- `npm run build` — PASS.
- `git diff --check` — clean (no whitespace conflict markers).

## 18. Activation status

No public activation. No beta activation. No internal QA activation. No auto-fetch on page load. No MK Agent or Similar Pattern auto-run. No Supabase change. No dependency install. No lockfile change.

## 19. Preserved policy

Not pushed. Not deployed.

## 20. Next recommended phase

**Phase 3GG-K-FAST — Chart AI Summary Quality Upgrade.**
