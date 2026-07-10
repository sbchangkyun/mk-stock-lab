# Phase 3GG-H-HF1 Result — LLM_CALL_FAILED Safe Diagnostics

- Status: Implemented (hotfix). Static checker and build pass. Owner LLM smoke: Pending (requires owner-local `CHART_AI_ENABLE_LOCAL_LLM=true`, `OPENAI_API_KEY`, `CHART_AI_LLM_MODEL`, and a running local dev server — none of which this session holds by design).
- Baseline: 4806d29aad5e5cb6948ecd31137c12269bf8b74d
- Branch: rebuild/phase-1-ia-shell

## Previous failure

The owner ran the Phase 3GG-H-FAST owner LLM smoke against a local dev server with real KIS credentials configured (KIS smoke already passing) and got:

```
sourceStatus=ok sanitizedErrorCode=LLM_CALL_FAILED
```

No further detail was available: the original bridge's fetch handler threw `Error('llm-http-${status}')` on any non-2xx OpenAI response without ever reading the response body, so there was no way to distinguish an invalid API key, a wrong model name, a rate limit, a permission error, or a genuine server error. On a 2xx response, if the model's output text could not be extracted, the bridge only had a single response-shape assumption (`output_text` or `output[].content[].text`), so any other valid OpenAI response shape silently produced `EMPTY_LLM_OUTPUT` with no indication of why.

## Files changed

- `src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs` — added safe OpenAI failure diagnostics and response-shape diagnostics; widened response-text extraction compatibility.
- `scripts/owner_smoke_phase_3gg_h_fast_local_only_llm_runtime_bridge.mjs` — prints the new safe diagnostic fields when `summary.ok` is false; added a diagnostics field allowlist and shape validation.
- `scripts/check_phase_3gg_h_fast_contract.mjs` — added assertions for the new diagnostics exports/functions, credential/raw-body non-exposure, smoke-script diagnostics printing, and this HF1 result doc's required sections.
- `docs/planning/planning_changelog.md` — prepended the Phase 3GG-H-HF1 entry.
- `docs/planning/phase_3gg_h_hf1_llm_call_failed_safe_diagnostics_result_v0.1.md` — this document.

No changes were made to `src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts`, `package.json`, any KIS provider module, `.env`/`.env.local`, or any lockfile.

## New safe diagnostics

1. **OpenAI HTTP failure diagnostics** (non-2xx response): the bridge now always calls `response.text()` first, attempts `JSON.parse`, and — on `!response.ok` — throws an error carrying a `.diagnostics` object built from `httpStatus` plus `error.type`/`error.code`/`error.param` (each clamped to 80 chars, newlines stripped, via `safeShortString`). `classifyOpenAiError` maps these to exactly one of 8 fixed labels: `invalid_api_key` (401), `model_not_found` (404), `permission_denied` (403), `quota_or_rate_limit` (429), `billing_or_quota` (quota/billing error codes), `server_error` (5xx), `bad_request` (400), or `unknown_openai_error`. The classification never reads or exposes `error.message`.
2. **Invalid-JSON diagnostics**: if a 2xx response body fails to parse as JSON, the bridge throws with `diagnostics = { httpStatus, responseShapeKind: 'invalid_json', outputTextPresent: false }`.
3. **Response-shape diagnostics** (2xx response, no extractable text): `classifyResponseShape` mirrors the extraction logic and returns one of `output_text_present`, `output_array_text_present`, `message_content_text_present`, `no_text_output_found`, or `unknown_shape`, plus `outputTextPresent: true|false`.
4. **Extraction compatibility widened**: `extractResponseText` now also supports the nested `output[].content[].text.value` string shape (via a new `extractTextFromContentItem` helper) and the chat-completions-style `choices[].message.content` string shape, in addition to the existing `output_text` and `output[].content[].text` shapes.
5. All diagnostic fields are filtered through `buildDiagnostics`, which deletes any key not present in the frozen `ALLOWED_LLM_DIAGNOSTICS_FIELDS` allowlist (`httpStatus`, `openAiErrorType`, `openAiErrorCode`, `openAiErrorParam`, `openAiErrorMessageClass`, `responseShapeKind`, `outputTextPresent`) before being attached to the response under the new allowlisted `diagnostics` field on `ALLOWED_LLM_SUMMARY_RESPONSE_FIELDS`.
6. The owner smoke script's BLOCKED branch now prints these fields (only when present, only from the allowlist) alongside the existing `sourceStatus`/`sanitizedErrorCode` output, e.g.:
   ```
   Phase 3GG-H-FAST owner local LLM runtime bridge smoke BLOCKED: reason=llm-not-available sourceStatus=ok sanitizedErrorCode=LLM_CALL_FAILED httpStatus=404 openAiErrorCode=model_not_found openAiErrorMessageClass=model_not_found sanitized=true
   ```

## Owner smoke result

Not run in this session. This session's runtime does not hold `OPENAI_API_KEY`, `CHART_AI_LLM_MODEL`, live KIS credentials, or a running local dev server, by design (same "Explicit Owner Run" pattern as prior 3GG phases). The owner must run the exact command below against their local dev server.

## Exact smoke command (to be run by the owner)

```
node scripts/owner_smoke_phase_3gg_h_fast_local_only_llm_runtime_bridge.mjs --owner-approved-local-llm-smoke
```

Expected after this hotfix: if the OpenAI call still fails, the smoke output will now safely reveal whether it is `model_not_found`, `invalid_api_key`, `quota_or_rate_limit`, `permission_denied`, `billing_or_quota`, `server_error`, `bad_request`, or a response-shape issue (`responseShapeKind`/`outputTextPresent`) — instead of the previously opaque `LLM_CALL_FAILED` alone.

## Actual LLM network call occurred

No. No LLM network call was attempted in this session — the required local env and local dev server are not present in this session's runtime.

## Sanitized OpenAI error class

Not applicable yet — no real call was made this session. The owner must run the smoke command above to obtain a real `openAiErrorMessageClass` (or `responseShapeKind`) value.

## Credential exposure status

None. `OPENAI_API_KEY` is never read, logged, printed, or rendered by this session, the bridge, the owner smoke script, or this document. `error.message`/`error.type`/`error.code`/`error.param` are read only inside the bridge (never in the smoke script), clamped to 80 characters, and only surfaced as classified enum labels — never as raw text. `.env`/`.env.local` were not opened or inspected.

## Raw KIS payload exposure status

None. Unchanged from Phase 3GG-H-FAST — the bridge's input-context allowlist and the owner smoke script's forbidden-raw-payload-pattern scan (`rt_cd`, `stck_prpr`, `acml_vol`, `prdy_vrss`, `prdy_ctrt`) both continue to guard against this; the checker independently verifies the guard tokens remain present.

## Raw LLM response exposure status

None. The bridge reads the OpenAI response body internally (as text, then parsed JSON) but never returns it — only the allowlisted `summaryText` (on success) or the allowlisted `diagnostics` fields (on failure) are ever returned. The owner smoke script's `FORBIDDEN_RAW_LLM_RESPONSE_PATTERN` scan (`"output_text"`, `"output": [`, `"usage": {`, `"model": "gpt`, `response.created`) still runs against the full raw response text before any parsing or printing; verified this does not false-positive against the new `responseShapeKind: "output_text_present"` label (the pattern requires an exact `"output_text"` substring with a closing quote immediately after `output_text`, which `"output_text_present"` does not contain).

## Validation results

- `npm run check:phase-3gg-h-fast` — PASS (133/133 assertions passed after this hotfix's additions).
- `npm run build` — PASS (astro build + postbuild completed successfully).
- `git diff --check` — no whitespace errors (only benign LF/CRLF line-ending warnings on Windows).
- `git status --short` — only this phase's expected files plus pre-existing known-untouched paths (`.agents/`, `.claude/`, `.vscode/settings.json`, `docs/handoff/codex_state_inspection/`, `skills-lock.json`).
- KIS provider diff check (against baseline `4806d29aad5e5cb6948ecd31137c12269bf8b74d`) — empty.
- Forbidden diff check (MK Agent / Similar Pattern Agent / scaffold / Supabase / data / lockfiles / env, against the same baseline) — empty.
- Real owner LLM smoke — not run this session (see "Owner smoke result" above).

## Known limitations

- Owner LLM smoke has not been executed or independently verified in this session; it is implemented and statically verified only. A future session or the owner must run the exact command above against a local dev server with the full required env configured to obtain a real diagnostic value.
- The 8-way `classifyOpenAiError` mapping and 6-way `classifyResponseShape` mapping cover the common/documented OpenAI Responses API error and response shapes as of this session's knowledge; if OpenAI introduces a materially different error or response shape in the future, the bridge fails closed to `unknown_openai_error` / `unknown_shape` rather than misclassifying or leaking raw data, but the classification logic itself has not yet been exercised against a real API response in this session.
- No UI wiring was added or touched in this hotfix, per the explicit hard safety boundary.

## Next recommended phase

Obtain the real owner LLM smoke run (owner action, using the command above) to confirm the specific diagnostic class and, once the LLM call is confirmed working end-to-end, proceed to Phase 3GG-I-FAST — Chart AI UI KIS + LLM Summary Wiring.
