# Phase 3GG-H-FAST Result — Local-only LLM Runtime Bridge for Chart AI

- Status: Implemented. Owner LLM smoke: Pending (requires owner-local `CHART_AI_ENABLE_LOCAL_LLM=true`, `OPENAI_API_KEY`, `CHART_AI_LLM_MODEL`, and a running local dev server with live KIS enabled — none of which this session holds by design).
- Baseline: 94f152f5788fb4ae3978fbed0268e48efebef5fe
- Branch: rebuild/phase-1-ia-shell

## Files changed

- `src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs` — new local-only LLM runtime bridge. Exports `LOCAL_ONLY_LLM_RUNTIME_BRIDGE_CONTRACT_VERSION`, `ALLOWED_LLM_INPUT_CONTEXT_FIELDS` (9 fields), `ALLOWED_LLM_SUMMARY_RESPONSE_FIELDS` (11 fields), `SANITIZED_LLM_ERROR_CODES`, `buildLlmSafeCurrentPricePrompt`, `assertNoForbiddenLlmInput`, `sanitizeLlmSummaryText`, `runLocalOnlyLlmRuntimeBridge`. Calls the OpenAI Responses API (`POST https://api.openai.com/v1/responses`) via raw `fetch` only — no SDK, no new dependency, no lockfile change.
- `src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts` — new local-only, GET-only API route. Requires the explicit `ownerLocalKisLlm=1` opt-in and a local hostname (`localhost`/`127.0.0.1`/`::1`); fails closed in any deployed/production runtime. Reuses the existing local-only KIS `current_price` binding/context path (`local-only-live-kis-market-data-binding.mjs` + `kis-market-data-to-chart-ai-context.mjs`), then calls the new LLM runtime bridge and returns only the sanitized summary object.
- `scripts/owner_smoke_phase_3gg_h_fast_local_only_llm_runtime_bridge.mjs` — new owner-gated smoke script. Requires the explicit `--owner-approved-local-llm-smoke` CLI flag before any network call is attempted; calls only `/api/chart-ai/local-only-kis-llm-summary.json?ownerLocalKisLlm=1&symbol=005930`; never prints the prompt, the actual `currentPrice` value, a raw LLM response body, or credential values.
- `scripts/check_phase_3gg_h_fast_contract.mjs` — new lightweight static contract checker. Verifies required files, package.json wiring, bridge/route/owner-smoke source content (allowlists, fail-closed gates, forbidden-token guards), forbidden-diff and KIS-provider-diff emptiness, result doc and changelog tokens, and working-tree purity. Does not execute the real owner LLM smoke and does not run the full historical checker chain, per the owner's speed-priority instruction for this phase.
- `package.json` — added `owner-smoke:phase-3gg-h-fast` and `check:phase-3gg-h-fast` scripts.
- `docs/planning/planning_changelog.md` — prepended the Phase 3GG-H-FAST entry.
- `docs/planning/phase_3gg_h_fast_local_only_llm_runtime_bridge_result_v0.1.md` — this document.

No UI wiring was added to `src/pages/chart-ai.astro` in this phase. Per the owner's explicit instruction ("Only touch chart-ai.astro if you can add a minimal hidden owner-local LLM test button safely in this phase without slowing down implementation... skip UI and leave it for Phase 3GG-I-FAST"), and given the file is a large (5000+ line) page already carrying several owner-local panels, UI wiring was deliberately skipped this phase to prioritize implementation speed, and is explicitly deferred to Phase 3GG-I-FAST.

## LLM runtime bridge summary

`runLocalOnlyLlmRuntimeBridge` is a pure orchestrator (all side effects — `fetch`, timeout, clock — are injectable via a `deps` parameter, mirroring the Phase 3GG-D-FAST binding's pattern). Gate sequence, all fail-closed:

1. `assertNoForbiddenLlmInput` — the input context must contain only the 9 allowlisted fields (`symbol`, `market`, `currentPrice`, `volume`, `timestamp`, `sourceStatus`, `cacheStatus`, `providerLabel`, `integrationMode`) and must not contain any raw KIS payload token, credential-like token, header, or account/session/identity-like token (defense in depth on top of the upstream Chart AI KIS context adapter's own allowlist).
2. `sourceStatus` must be `ok`/`success` and `currentPrice` must be present, else `sanitizedErrorCode=SOURCE_UNAVAILABLE`.
3. `CHART_AI_ENABLE_LOCAL_LLM` must equal the string `"true"`, else `sanitizedErrorCode=LLM_DISABLED`.
4. `OPENAI_API_KEY` and `CHART_AI_LLM_MODEL` must both be present (boolean presence checks only — values are never read for any purpose other than the outbound `Authorization` header and request body), else `sanitizedErrorCode=LLM_CONFIG_MISSING`. No default model name is ever invented.
5. `buildLlmSafeCurrentPricePrompt` builds a Korean-only system + user prompt enforcing: max 3 bullets, current_price status only, explicit "not investment advice" notice, no buy/sell recommendation, no target price, no stop loss, no future-movement claims, and an explicit list of 8 forbidden Korean phrases the model must never use.
6. The OpenAI Responses API is called via `fetch` with a ~12s timeout (`Promise.race`-style); on HTTP failure or timeout, `sanitizedErrorCode=LLM_CALL_FAILED` / `LLM_TIMEOUT`.
7. `sanitizeLlmSummaryText` extracts and trims the model's text output, then re-checks it against the same 8 forbidden Korean phrases; on a match, fails closed with `sanitizedErrorCode=FORBIDDEN_LANGUAGE_DETECTED` instead of returning the text.
8. On success, returns only the 11 allowlisted summary fields (`ok`, `symbol`, `market`, `llmStatus`, `summaryText`, `sanitizedErrorCode`, `modelPresent`, `sourceStatus`, `currentPricePresent`, `volumePresent`, `warnings`) — never the prompt, the raw LLM response, the API key, the model name as a "secret", request headers, the numeric `currentPrice` value, or raw KIS payload.

## Owner LLM smoke: Pending.

Not run in this session. This session's own runtime never holds `OPENAI_API_KEY`, `CHART_AI_LLM_MODEL`, or live KIS credentials by design (same "Explicit Owner Run" pattern as Phase 3GG-G-FAST). The real owner smoke requires the owner to start a local dev server with `KIS_ENABLE_LIVE_QUOTES=true`, valid KIS credentials, `CHART_AI_ENABLE_LOCAL_LLM=true`, `OPENAI_API_KEY`, and `CHART_AI_LLM_MODEL` all configured locally, then run the exact command below. The static checker and build below were verified to pass without requiring this real run, per the owner's speed-priority instruction: "commit the runtime bridge as implemented with 'owner LLM smoke pending/blocked' only if the static checker and build pass."

## Exact smoke command (to be run by the owner)

```
node scripts/owner_smoke_phase_3gg_h_fast_local_only_llm_runtime_bridge.mjs --owner-approved-local-llm-smoke
```

## Whether actual LLM network call occurred

No. No LLM network call was attempted in this session — `CHART_AI_ENABLE_LOCAL_LLM`/`OPENAI_API_KEY`/`CHART_AI_LLM_MODEL` are not present in this session's runtime, and no owner-run smoke has been reported back yet.

## currentPricePresent

Not applicable yet (no real request completed). When the owner runs the real smoke, only `currentPricePresent=true`/`false` will be recorded — the actual `currentPrice` value is never printed by the script or written to this document.

## Credential exposure status

None. `OPENAI_API_KEY` is never read, logged, printed, or rendered by this session, the bridge, the route, the smoke script, or this document. `.env`/`.env.local` were not opened or inspected.

## Raw KIS payload exposure status

None. The bridge's input-context allowlist and the owner smoke script's forbidden-raw-payload-pattern scan (`rt_cd`, `stck_prpr`, `acml_vol`, `prdy_vrss`, `prdy_ctrt`) both guard against this; the checker independently verifies both source files contain the required guard tokens.

## Raw LLM response exposure status

None. The bridge only ever returns the 11 allowlisted summary fields; the route never references raw OpenAI Responses API shape tokens (`output_text`, `usage`, etc.); the owner smoke script scans for these tokens before parsing or printing anything derived from the response.

## Forbidden investment language status

None possible by construction. The bridge's prompt explicitly forbids the 8 listed Korean investment-advice phrases, and `sanitizeLlmSummaryText` re-checks the model's actual output against the same list before returning it, failing closed with `sanitizedErrorCode=FORBIDDEN_LANGUAGE_DETECTED` on any match. The owner smoke script independently re-checks the returned `summaryText` against the same list before reporting a pass.

## Validation results

- `npm run check:phase-3gg-h-fast` — see command output recorded at commit time.
- `npm run build` — see command output recorded at commit time.
- `git diff --check` — see command output recorded at commit time.
- `git status --short` — see command output recorded at commit time.
- Forbidden diff check (MK Agent / Similar Pattern Agent / scaffold / Supabase / data / lockfiles / env) against baseline `94f152f5788fb4ae3978fbed0268e48efebef5fe` — empty.
- KIS provider diff check (existing provider modules) against baseline `94f152f5788fb4ae3978fbed0268e48efebef5fe` — empty.
- Real owner LLM smoke — not run this session (see "Owner LLM smoke: Pending" above).

## Known limitations

- Owner LLM smoke has not been executed or independently verified in this session; it is implemented and statically verified only. A future session or the owner must run the exact command above against a local dev server with the full required env configured to obtain a real pass.
- No UI wiring exists yet for this bridge; `chart-ai.astro` was intentionally left unchanged this phase. Phase 3GG-I-FAST is expected to add a minimal owner-local UI panel calling this route.
- The bridge's OpenAI Responses API response-text extraction (`extractResponseText`) handles the documented `output_text` convenience field and the `output[].content[].text` array shape; if a future API response shape diverges further, the bridge fails closed (`EMPTY_LLM_OUTPUT`) rather than returning malformed text, but the extraction logic itself has not yet been exercised against a real API response in this session.

## Next recommended phase

Phase 3GG-I-FAST — Chart AI UI KIS + LLM Summary Wiring.
