# Phase 3GG-J-FAST — Model Tier and Fallback Policy Result

- **Status**: Implemented and validated (deterministic smoke + static checker + build).
- **Baseline: 444481268d97576b1af78acafcb5b6aa29b00f12** (Phase 3GG-I-QA)
- **Branch: rebuild/phase-1-ia-shell**
- **Goal**: stabilize model selection and fallback behavior for the Chart AI KIS + LLM summary flow before improving summary quality. This phase does not expand product features.

## Files changed

- `src/lib/server/chart-ai/local-only-llm-model-policy.mjs` (new) — pure model tier/fallback policy module.
- `src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs` (modified) — integrates the model policy: resolves the main model via the policy, attempts one conservative fallback on eligible failures.
- `scripts/smoke_phase_3gg_j_fast_model_tier_fallback_policy.mjs` (new) — deterministic smoke script, 15 cases / 32 assertions, fake env + fake fetch, no real network.
- `scripts/check_phase_3gg_j_fast_contract.mjs` (new) — static contract checker.
- `docs/planning/phase_3gg_j_fast_model_tier_fallback_policy_result_v0.1.md` (new, this file).
- `package.json` (modified) — added `smoke:phase-3gg-j-fast` and `check:phase-3gg-j-fast` script entries.
- `docs/planning/planning_changelog.md` (modified) — prepended the Phase 3GG-J-FAST entry.

## Model policy summary

- **Roles**: `main_summary`, `fallback_summary`, `test_summary`, `moderation_future` (metadata only, unused this phase), `embedding_future` (metadata only, unused this phase).
- **Env keys supported**: `CHART_AI_LLM_MAIN_MODEL` (new), `CHART_AI_LLM_FALLBACK_MODEL` (new), `CHART_AI_LLM_TEST_MODEL` (new), `CHART_AI_LLM_MODERATION_MODEL` (new, unused), `CHART_AI_LLM_EMBEDDING_MODEL` (new, unused), `CHART_AI_LLM_MODEL` (legacy, still supported).
- **Sanitization**: `normalizeModelName` rejects empty/whitespace-only values, values containing whitespace/control characters/quotes/slashes/backticks/shell metacharacters, and any value matching a credential-like token (`api_key`, `secret`, `token`, `bearer`, `password`). Only `[A-Za-z0-9._:-]+` is accepted.

## Backward compatibility

- `CHART_AI_LLM_MODEL` continues to resolve the `main_summary` role when `CHART_AI_LLM_MAIN_MODEL` is absent.
- `CHART_AI_LLM_MAIN_MODEL` takes precedence over `CHART_AI_LLM_MODEL` when both are set.
- The bridge's existing `LLM_DISABLED` / `LLM_CONFIG_MISSING` / `INVALID_INPUT_CONTEXT` / `SOURCE_UNAVAILABLE` / `LLM_TIMEOUT` / `FORBIDDEN_LANGUAGE_DETECTED` / `EMPTY_LLM_OUTPUT` gates and their sanitized error codes are unchanged.

## Fallback behavior

- On a main-model call failure classified as `model_not_found`, `permission_denied`, `quota_or_rate_limit`, `billing_or_quota`, or `server_error`, and only when a distinct, present `CHART_AI_LLM_FALLBACK_MODEL` is configured, exactly one fallback call is attempted.
- `bad_request` and `invalid_api_key` classified failures are never eligible for fallback (fail closed immediately, matching prior behavior).
- A timeout on the main call never triggers a fallback attempt, even when a distinct fallback model is configured.
- Fallback success: `ok: true`, `llmStatus: 'ok'`, `summaryText` present, `warnings` includes `llm-fallback-used`.
- Fallback failure: fails closed with `sanitizedErrorCode: LLM_CALL_FAILED`, `warnings` includes `llm-fallback-failed`, diagnostics prefer the fallback call's own failure diagnostics.
- Verified deterministically via fake-fetch call-count assertions: exactly 1 fetch call for non-fallback-eligible failures or missing/identical fallback model; exactly 2 fetch calls when a fallback attempt is correctly triggered.

## UI change status

- Not changed. `src/pages/chart-ai.astro` was not modified this phase.

## H route change status

- Not changed. `src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts` was not modified this phase.

## Credential / raw-payload / prompt / currentPrice exposure status

- Credential exposure status: not exposed. `OPENAI_API_KEY` is never read into a diagnostic, log, or response field beyond its existing presence check.
- Raw KIS payload exposure status: not exposed. No change to raw-payload handling this phase.
- Raw LLM response exposure status: not exposed. No change to raw-response handling this phase.
- Prompt exposure status: not exposed. No new prompt-related response field was added.
- currentPrice numeric exposure status: not exposed. The response contract still exposes only `currentPricePresent` (boolean), never the numeric value.
- Model name exposure status: not exposed. Verified in smoke Case 15 that neither the resolved main nor fallback model name ever appears in the serialized response.

## KIS endpoint expansion status

- None. No new KIS endpoint or provider module was touched this phase.

## Validation results

- `npm run smoke:phase-3gg-j-fast`: PASS (32/32 assertions across 15 cases).
- `npm run check:phase-3gg-j-fast`: PASS.
- `npm run build`: PASS.
- `git diff --check`: clean (no whitespace errors).

## Known limitations

- The `moderation_future` and `embedding_future` roles are metadata-only placeholders this phase; no moderation or embedding call is wired up yet.
- This phase did not re-run a live owner LLM smoke (no real OpenAI/KIS network call was made) — it is fully deterministic and static per the work order's explicit requirement.

## Next recommended phase

Continue stabilizing LLM summary quality and model observability, or proceed to another owner-approved QA/review phase, per the work order's stated priority: stabilize model selection and fallback behavior first, improve summary quality next.

## Push/deploy status

- Not pushed.
- Not deployed.
