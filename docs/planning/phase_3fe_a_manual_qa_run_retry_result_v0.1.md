# Phase 3FE-A-MANUAL-QA-RUN-RETRY — Owner-local API/Browser QA Retry for KIS OHLC Fixture Mode Result

## 1. Status

- Status: Partial.
- Static validation: executed and passed.
- Local loopback dev server: executed on `127.0.0.1:4321`.
- Local API QA: executed and passed for owner-local Similar Pattern synthetic mode, explicit KIS OHLC fixture mode, and fail-closed cases.
- Browser/browser-like QA: local page fetches executed and passed for HTTP availability and payload-safety checks. Full visual and client-side interaction QA was not executed and remains owner-required.
- No runtime source changed.
- No API route changed.
- No UI changed.
- No provider/helper source changed.
- No live KIS call occurred.
- No LLM call occurred.
- No MK AI route activation occurred.
- No Supabase client was created.
- No DB connection occurred.
- No env/session/JWT/cookie/header parsing occurred.
- No public/beta activation occurred.
- No dependency/lockfile change occurred.
- No deploy/push occurred.

## 2. Purpose

Retry local owner-only API/browser QA for the Phase 3FE-A fixture-only KIS OHLC provider boundary after Phase 3FE-A-MANUAL-QA-RUN-HF1 corrected the handoff checker scope blocker.

## 3. Baseline

- Current baseline before retry: `fb34d72`.
- Latest completed phase before retry: Phase 3FE-A-MANUAL-QA-RUN-HF1.
- Phase 3FE-A feature commit: `1b2a0f2`.
- Phase 3FE-A-HF1 evidence commit: `e6c7679`.
- Phase 3FE-A-HANDOFF commit: `b3a4679`.
- Phase 3FE-A-MANUAL-QA commit: `0e02130`.
- Phase 3FE-A-MANUAL-QA-RUN-HF1 commit: `fb34d72`.
- Branch: `rebuild/phase-1-ia-shell`.

## 4. What was executed

- Required repository state checks.
- Required source-of-truth file reads.
- Corrected static validation chain before dev server startup.
- Loopback-only dev server startup.
- Local-only API QA against `/api/chart-ai/similarity`.
- Browser-like local page fetches for `/chart-ai` query modes.
- Dev server shutdown and port cleanup.
- Retry result document.
- Retry static checker.
- Planning changelog entry.
- Package script.

## 5. What was not executed

- Full visual browser QA was not executed.
- Client-side click automation was not executed.
- Remote requests were not executed.
- Live KIS calls were not executed.
- LLM calls were not executed.
- MK AI route execution was not activated.
- Supabase, DB, env, session, JWT, cookie, or header auth runtime paths were not used.
- Public or beta activation was not performed.
- Deploy and push were not performed.

## 6. Static validation results

- `npm run check:phase-3fe-a-manual-qa-run-hf1`: passed, `46/46`.
- `npm run check:phase-3fe-a-manual-qa-run-result`: passed, `37/37`.
- `npm run check:phase-3fe-a-manual-qa-result`: passed, `55/55`.
- `npm run check:phase-3fe-a-handoff-chart-ai-new-chat-package`: passed, `89/89`.
- `npm run check:phase-3fe-a-kis-ohlc-provider-owner-local-integration`: passed, `188/188`.
- `npm run smoke:phase-3fe-a-kis-ohlc-provider-owner-local-integration`: passed, `141/141`, 3 provider fixtures.
- `npm run check:phase-3fd-j-similar-pattern-route-owner-local-activation`: passed, `213/213`.
- `npm run smoke:phase-3fd-j-similar-pattern-route-owner-local-activation`: passed, `377/377`, 16 fixtures.
- `npm run check:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off`: passed, `180/180`.
- `npm run smoke:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off`: passed, `197/197`, 14 fixtures.
- `npm run build`: passed.
- `git diff --check`: passed.

## 7. Dev server execution

- Command: `npm run dev -- --host 127.0.0.1 --port 4321`.
- Local URL: `http://127.0.0.1:4321`.
- Port: `4321`.
- Start result: passed; `/chart-ai` returned HTTP 200.
- Stop result: passed after stopping the parent process and the remaining loopback listener process.
- Notes: loopback-only server was used. No remote URL was called.

## 8. API QA results

All API cases used local-only requests to `http://127.0.0.1:4321/api/chart-ai/similarity`.

| Case | Method/path | Request summary | Expected | Actual | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Default/synthetic owner-local Similar Pattern | `POST /api/chart-ai/similarity` | guarded runtime scaffold, explicit owner-local activation, `similar_pattern`, user role | HTTP 200, `owner_local_similarity_success`, `synthetic_sample_only` | HTTP 200, `owner_local_similarity_success`, `synthetic_sample_only`, 5 matches | PASS | Sanitized keys only. |
| Explicit KIS OHLC fixture mode | `POST /api/chart-ai/similarity` | same owner-local route with `ownerLocalOhlcProviderMode: "kis_ohlc_fixture"` and deterministic fixture | HTTP 200, `owner_local_similarity_success`, `kis_ohlc_fixture_only` | HTTP 200, `owner_local_similarity_success`, `kis_ohlc_fixture_only`, 5 matches | PASS | Redacted diagnostics keys only. |
| Missing explicit activation | `POST /api/chart-ai/similarity` | guarded scaffold with activation flag false | HTTP 403, `blocked_explicit_activation_required` | HTTP 403, `blocked_explicit_activation_required` | PASS | Safe blocked. |
| Invalid provider fixture mode | `POST /api/chart-ai/similarity` | invalid `ownerLocalOhlcProviderMode` | HTTP 400, `blocked_invalid_request` | HTTP 400, `blocked_invalid_request` | PASS | Safe blocked. |
| Malformed JSON | `POST /api/chart-ai/similarity` | invalid JSON body | HTTP 503, `feature_disabled` fallback | HTTP 503, `feature_disabled` fallback | PASS | Safe default route shell fallback. |
| Anonymous role | `POST /api/chart-ai/similarity` | `subjectRole: "anonymous"` | HTTP 403, `blocked_anonymous` | HTTP 403, `blocked_anonymous` | PASS | Safe blocked. |
| Unknown role | `POST /api/chart-ai/similarity` | `subjectRole: "unknown"` | HTTP 403, `fail_closed` | HTTP 403, `fail_closed` | PASS | Safe fail-closed. |
| MK AI request kind | `POST /api/chart-ai/similarity` | `requestKind: "mk_ai"` | HTTP 403, `blocked_provider_disabled` | HTTP 403, `blocked_provider_disabled` | PASS | MK AI route remains disabled. |
| Malformed provider fixture | `POST /api/chart-ai/similarity` | `ownerLocalOhlcProviderMode: "kis_ohlc_fixture"` with malformed fixture | HTTP 403, `fail_closed` | HTTP 403, `fail_closed` | PASS | Provider boundary failed closed. |
| Remote host header | `POST /api/chart-ai/similarity` | local TCP request with non-local Host header | HTTP 403 safe block | HTTP 403 before route JSON parsing | PASS | Blocked locally by dev server host handling; no sensitive output. |

API response safety check:

- No raw KIS payload was returned.
- No raw OHLC rows were returned.
- No raw provider payload was returned.
- No raw master identifiers, raw emails, raw UIDs, tokens, cookies, sessions, JWTs, env values, stack traces, or internal exception details were returned by the tested API responses.
- No live KIS, LLM, Supabase, DB, env, session, JWT, cookie, or header-auth path was activated by these requests.

## 9. Browser/browser-like QA results

Browser-like local page fetches were executed against:

- `http://127.0.0.1:4321/chart-ai`
- `http://127.0.0.1:4321/chart-ai?chartAiMockLoggedOut=1`
- `http://127.0.0.1:4321/chart-ai?chartAiMockMaster=1`
- `http://127.0.0.1:4321/chart-ai?chartAiMockLoggedOut=1&chartAiMockMaster=1`
- `http://127.0.0.1:4321/chart-ai?ownerLocalSimilarPatternRoute=1`

Results:

- Default `/chart-ai`: HTTP 200, payload-safety check passed.
- Mocked logged-out mode URL: HTTP 200, payload-safety check passed.
- Mocked master mode URL: HTTP 200, payload-safety check passed.
- Logged-out plus master URL: HTTP 200, payload-safety check passed.
- Owner-local route opt-in URL: HTTP 200, payload-safety check passed.

Browser-like limitations:

- Full browser automation was not executed.
- Client-side query-mode behavior was not visually verified by Codex.
- Button-click route execution from the UI was not browser-automated.
- Full visual QA remains owner-required.
- The fetched page HTML includes pre-existing email-like literals from the existing Auth modal component. This retry did not introduce them, and they were not part of the tested API responses.

## 10. Security and boundary checks

- Runtime/source/API/UI/provider changed: no.
- Live KIS call: no.
- KIS account/trading/order/balance API: no.
- LLM call: no.
- MK AI route activation: no.
- Supabase client creation: no.
- DB connection: no.
- Env/session/JWT/cookie/header parsing: no.
- Public/beta activation: no.
- Dependency/lockfile change: no.
- Deploy/push: no.
- Raw KIS payload exposure: not detected in API responses or browser-like payload checks.
- Raw OHLC row exposure: not detected in API responses or browser-like payload checks.
- Provider payload exposure: not detected in API responses or browser-like payload checks.
- Raw master identifier exposure: not detected in changed files or tested API responses.

## 11. Findings

- Static validation blocker from the prior run is resolved.
- Local API QA passed for synthetic owner-local Similar Pattern mode.
- Local API QA passed for explicit `ownerLocalOhlcProviderMode: "kis_ohlc_fixture"` mode.
- Fail-closed API cases behaved safely.
- Browser-like page fetches returned HTTP 200 and passed payload-safety checks.
- Full browser visual/client-side interaction QA remains owner-required.
- No runtime issue was confirmed.

## 12. Changed files

- `docs/planning/phase_3fe_a_manual_qa_run_retry_result_v0.1.md`: retry execution result.
- `scripts/check_phase_3fe_a_manual_qa_run_retry_contract.mjs`: retry result checker.
- `docs/planning/planning_changelog.md`: retry changelog entry.
- `package.json`: retry checker package script.

## 13. Not completed / deferred

- Full owner visual browser QA.
- Browser automation for client-side click flow.
- Phase 3FF-A planning.
- Phase 3FF-A implementation.
- Live KIS integration.
- Public or beta activation.

## 14. Recommended next phase

- Recommendation: complete owner visual browser QA closeout or proceed to Phase 3FF-A-PLAN only as a planning-only phase after the owner accepts the remaining visual QA limitation.
- Alternative: Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT if the owner wants a separate closeout package for visual QA evidence.
- Hold: direct Phase 3FF-A implementation, live KIS, beta activation, and public activation remain blocked.
