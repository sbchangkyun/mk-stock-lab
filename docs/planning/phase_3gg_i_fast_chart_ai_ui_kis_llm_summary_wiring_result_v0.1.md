# Phase 3GG-I-FAST Result — Chart AI UI KIS + LLM Summary Wiring

- Status: Implemented. Static smoke and static contract checker pass. Manual owner-local browser QA is a separate owner action (see "Manual UI check status" below).
- Baseline: 722995a539a8e6e1580fc2fedc1f5555eb88a138
- Branch: rebuild/phase-1-ia-shell

## Owner-confirmed H-HF1 precondition

Per the owner's Phase 3GG-I-FAST work order, the following was reported as already confirmed and is recorded here, not re-verified in this session:

- G-FAST smoke: PASS (`symbol=005930`, `sourceStatus=ok`, `currentPricePresent=true`, `volumePresent=true`, `sanitized=true`).
- H-FAST/H-HF1 smoke: PASS (`symbol=005930`, `llmStatus=ok`, `summaryPresent=true`, `currentPricePresent=true`, `sanitized=true`).
- Model: `gpt-5.5`.
- Actual owner-local LLM network call occurred: yes.

## Files changed

- `src/pages/chart-ai.astro` — added the owner-local KIS + LLM summary UI panel, its client-side visibility gate, and its click-only fetch handler + renderers.
- `package.json` — added `smoke:phase-3gg-i-fast` and `check:phase-3gg-i-fast` scripts.
- `docs/planning/planning_changelog.md` — prepended the Phase 3GG-I-FAST entry.
- `scripts/smoke_phase_3gg_i_fast_chart_ai_ui_kis_llm_summary_wiring.mjs` — new static source smoke script.
- `scripts/check_phase_3gg_i_fast_contract.mjs` — new static contract checker.
- `docs/planning/phase_3gg_i_fast_chart_ai_ui_kis_llm_summary_wiring_result_v0.1.md` — this document.

No changes were made to `src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts`, `src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs`, `scripts/owner_smoke_phase_3gg_h_fast_local_only_llm_runtime_bridge.mjs`, `scripts/check_phase_3gg_h_fast_contract.mjs`, any KIS provider module, `.env`/`.env.local`, or any lockfile.

## UI wiring summary

A new owner-local section, `chartAiOwnerLocalKisLlmSummaryPanel`, was added to `chart-ai.astro` directly after the existing `chartAiOwnerLocalKisIntegrationPanel` (Phase 3GG-E-INTEGRATE). It is `hidden` in the markup by default. A client-side script block toggles `.hidden` off only when both the local-hostname check and the `ownerLocalKisLlm=1` query opt-in pass — mirroring the identical gating pattern used by every other owner-local panel on this page (mocked, auth-usage-bridge, deterministic-agents, guarded-productization-shell, kis-integration).

Inside the panel: a heading ("로컬 전용 KIS + LLM 요약"), an eyebrow label ("소유자 로컬 테스트 전용"), guide copy containing the three required safety phrases, a run button (`chartAiOwnerLocalKisLlmSummaryButton`), a status line (`chartAiOwnerLocalKisLlmSummaryStatus`), and a result container (`chartAiOwnerLocalKisLlmSummaryOutput`). The button's click handler is the only place in the file that calls the new route; no fetch to this route exists anywhere else in the script, including at top-level page-load scope.

On success, the panel renders only: the sanitized `summaryText`, `symbol`, `market`, `llmStatus`, `currentPricePresent`/`volumePresent` as Korean "반영됨/반영 안 됨" labels, a sanitized-data note, and the investment-advice disclaimer. On failure (`summary.ok !== true`), the panel renders only `sourceStatus`, `sanitizedErrorCode`, and any of the four UI-allowlisted diagnostics fields (`httpStatus`, `openAiErrorMessageClass`, `responseShapeKind`, `outputTextPresent`) that happen to be present — never `openAiErrorType`/`openAiErrorCode`/`openAiErrorParam`, even though those are allowlisted server-side by the Phase 3GG-H-HF1 bridge.

## Route called by UI

`GET /api/chart-ai/local-only-kis-llm-summary.json?ownerLocalKisLlm=1&symbol=005930` (Phase 3GG-H-FAST / 3GG-H-HF1 route, unmodified). Called with `credentials: 'omit'` (no cookies), no `Authorization` header, no request body, and a 15-second client-side `AbortController` timeout.

## Visibility gate

Client-side only, no server auth/Supabase/session/cookie/JWT/header parsing involved:

```ts
const ownerLocalKisLlmOptIn = chartAiQuery.get('ownerLocalKisLlm') === '1';
const ownerLocalKisLlmEnabled =
  mockedChartAiAccess.capabilities.canAccessChartAi && isLocalOwnerHostname() && ownerLocalKisLlmOptIn;
```

`isLocalOwnerHostname()` (pre-existing helper, unmodified) checks `window.location.hostname` against `localhost`/`127.0.0.1`/`::1`/`[::1]`. The panel stays hidden for any other hostname or when the query parameter is absent/not exactly `1`.

## Auto-fetch status

None. No fetch/KIS/LLM/route call occurs at page-load or script-evaluation time. The panel is idle after becoming visible; the single fetch call exists exclusively inside the button's `click` event listener, verified both by the new static smoke script (checks that exactly one executable `fetch()` call site references the H route, and that it sits inside the click handler block) and by manual source inspection.

## Manual UI check status

Pending. This session does not hold a running local dev server, `CHART_AI_ENABLE_LOCAL_LLM=true`, `OPENAI_API_KEY`, `CHART_AI_LLM_MODEL`, or local KIS credentials, so `npm run dev` plus a browser visit to `http://localhost:4321/chart-ai?ownerLocalKisLlm=1` was not performed in this session. The owner previously confirmed the underlying route works end-to-end (see "Owner-confirmed H-HF1 precondition" above); the new UI wiring itself has not yet been exercised in a live browser. The owner should perform this check and confirm: panel visible only after opt-in, no auto-fetch before click, button triggers only the H route, summary appears, no console error, no credential/prompt/raw-response/currentPrice-numeric exposure, and no layout overflow at ~375px width.

## Credential exposure status

None. `OPENAI_API_KEY`, KIS credentials, and any `Authorization`/cookie header are never read, logged, or rendered by the new panel's markup or script. The fetch call explicitly sets `credentials: 'omit'` and includes no headers beyond the browser's default `GET` request headers. Verified by both the smoke script (credential-token pattern scan restricted to the click handler block) and the contract checker (same scan against the full modified file).

## Raw KIS payload exposure status

None. The new panel never references raw KIS field names (`rt_cd`, `stck_prpr`, `acml_vol`, `prdy_vrss`, `prdy_ctrt`) and never touches the KIS provider layer directly — it only calls the existing sanitized H route, which itself already enforces this guarantee (Phase 3GG-E-INTEGRATE / 3GG-F-FAST).

## Raw LLM response exposure status

None. The new panel never reads or renders `summary.output`/`summary.usage`/the raw OpenAI response body, and never renders the prompt. Only the sanitized `summaryText` string and the narrow diagnostics allowlist are ever displayed.

## currentPrice numeric exposure status

None. The success renderer displays `currentPricePresent`/`volumePresent` as Korean presence labels ("반영됨"/"반영 안 됨") only; the actual numeric `currentPrice` value is never read from the response or rendered anywhere in the new panel.

## Validation results

- `npm run smoke:phase-3gg-i-fast` — PASS (29/29 checks passed).
- `npm run check:phase-3gg-i-fast` — PASS (see command output for assertion count).
- `npm run build` — PASS (astro build + postbuild completed successfully).
- `git diff --check` — no whitespace errors (only benign LF/CRLF line-ending warnings on Windows, consistent with prior phases).
- KIS provider diff check (against baseline `722995a539a8e6e1580fc2fedc1f5555eb88a138`) — empty.
- Forbidden diff check (H route/bridge/H-FAST scripts/MK Agent/Similar Pattern Agent/scaffold/Supabase/data/lockfiles/env, against the same baseline) — empty.
- `npm run check:phase-3gg-h-fast` — 132/136 assertions passed, run as a regression guard per the work order. The 4 failures are all the same known/expected shape: the H-FAST checker's own "no unexpected working-tree changes outside its scope" guard does not know about this phase's new files (`src/pages/chart-ai.astro`, the new smoke script, the new checker, the new result doc) and flags them as unexpected. All of the H-FAST checker's *functional* assertions (bridge exports, route gating, diagnostics allowlist, forbidden-pattern guards, HF1 result doc, changelog) still pass — this is not a functional regression of Phase 3GG-H-FAST/H-HF1. Per the work order's "do not modify unless absolutely necessary" constraint on the H-FAST checker, it was left unmodified rather than patched to recognize the new phase's files.

## Known limitations

- Manual owner-local browser QA has not been performed in this session (see "Manual UI check status" above); the UI wiring is implemented and statically verified only.
- The blocked-state renderer surfaces at most 4 diagnostics fields (`httpStatus`, `openAiErrorMessageClass`, `responseShapeKind`, `outputTextPresent`); if the bridge later adds a new diagnostics field, it will not be surfaced in the UI unless this panel is explicitly updated, by design (fail-closed on the display allowlist, not fail-open).
- No dedicated CSS media query was added for this panel; it relies on the same rem-based fluid layout already used by every other owner-local panel on this page, which prior phases have manually verified at ~375px width.

## Next recommended phase: Phase 3GG-I-QA — Owner-local Browser QA for Chart AI KIS + LLM Summary UI

The owner should run `npm run dev`, configure the required local env (`CHART_AI_ENABLE_LOCAL_LLM=true`, `OPENAI_API_KEY`, `CHART_AI_LLM_MODEL`, KIS credentials), open `http://localhost:4321/chart-ai?ownerLocalKisLlm=1`, and confirm the panel behaves exactly as specified above in a live browser before this UI is considered fully verified end-to-end.
