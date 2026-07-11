# Phase 3GG-K-QA-OWNER-RERUN-2 — Verify Success-path Summary Quality After KIS Runtime Correction — Result

## Status

Blocked on the LLM layer only. The KIS current_price side of the owner-local Chart AI summary path is fully working end-to-end through the H route (`sourceStatus=ok`), confirming the Phase 3GG-K-ENV-HF5 fix flows through this route too. The LLM summary itself did not reach `summary.ok=true` because the local LLM feature is disabled in the running runtime (`sanitizedErrorCode=LLM_DISABLED`), so the panel safely rendered a sanitized Korean "unavailable" message.

## Classification

`BLOCKED_LLM_ENV_MISSING`

## Baseline

`b34d850`

## Branch

`rebuild/phase-1-ia-shell`

## HEAD before

`b34d850f2da7bb0db42254395722a05d81ace55d`

## HEAD after

(recorded post-commit; see final report)

## Purpose

Re-run the previously blocked owner-local Chart AI KIS + LLM summary success-path QA after Phase 3GG-K-ENV-HF5 fixed the local provider binding runtime-env issue, verifying the real owner-local success path: KIS current_price → H route → LLM bridge → sanitized Korean summary UI.

## Files changed

- `docs/planning/phase_3gg_k_qa_owner_rerun_2_success_path_after_kis_runtime_correction_result_v0.1.md` (created)
- `scripts/check_phase_3gg_k_qa_owner_rerun_2_contract.mjs` (created)
- `package.json` (modified — 1 script entry added)
- `docs/planning/planning_changelog.md` (modified — entry prepended)

## Source diff status

Zero diff from baseline `b34d850` for all forbidden-diff source files (kisClient.ts, the local-only KIS market-data binding, both chart-ai API routes including the LLM summary H route, the LLM runtime bridge, the model policy module, `chart-ai.astro`, MK Agent, Similar Pattern agent, guarded productization scaffold, `components`, `supabase`, `src/data`, lockfiles, `.env`, `.env.local`). This is a QA-only phase: no source feature/UI/provider/route/bridge/model-policy change.

## Local dev server status

- Reachable: true
- Listening on 4321: true (single listener, PID 10020 — the fresh server from Phase 3GG-K-ENV-HF5)
- Fallback ports 5173/5174 listening: false
- Restarted for QA: false (existing HF5 server was healthy and already carries the kisClient fix)

## Preflight current_price readiness

- HF5 diagnostic (`npm run owner-diagnostic:phase-3gg-k-env-hf5 -- --owner-approved-local-provider-runtime-env-diagnostic --base-url=http://localhost:4321`): PASS — `route-ready`, localCurrentPriceSourceStatus=ok, localCurrentPricePresent=true, localVolumePresent=true, `FIXED_RUNTIME_FLAG_INJECTION_CURRENT_PRICE_READY`.
- G-FAST owner smoke (`npm run owner-smoke:phase-3gg-g-fast -- --owner-approved-real-kis-smoke`): PASS — `sourceStatus=ok currentPricePresent=true volumePresent=true sanitized=true`.

## Browser QA method

- Browser automation tool used: in-app Browser pane (Claude Browser MCP) driving the real dev server.
- URLs checked: `http://localhost:4321/chart-ai` (no query) and `http://localhost:4321/chart-ai?ownerLocalKisLlm=1`.
- Viewports: desktop 1280×720 and mobile 375×812.
- Evidence collected via read_page / DOM inspection / network capture / console capture. No raw numeric, credential, payload, prompt, or model-name value was read into evidence.

## Default hidden state result

On `/chart-ai` with no query: owner-local KIS + LLM summary panel present in DOM but `hidden=true` and not rendered (`offsetParent === null`); no H route fetch recorded; no console error. PASS.

## Opt-in visible idle state result

On `/chart-ai?ownerLocalKisLlm=1` (local hostname): panel visible, action button visible and enabled, status text `대기 중` (idle), output hidden; no auto-fetch before click; no forbidden route request; no console error. PASS.

## Click-only H route execution result

- H route request count before click: 0
- H route request count after click: 1
- Exact route matched: true — `/api/chart-ai/local-only-kis-llm-summary.json?ownerLocalKisLlm=1&symbol=005930` → HTTP 200 (2xx)
- No auto-fetch before click: true

## H route success-path result

- summary.ok: false
- sourceStatus: ok
- llmStatus: unavailable
- sanitizedErrorCode: LLM_DISABLED
- currentPricePresent: true (KIS current_price resolved successfully through the H route)
- volumePresent: true
- summaryTextPresent: false

## Summary quality result

The 3-bullet summary contract was **not reached** because the LLM layer is disabled (no summary text was produced). The panel instead rendered a single sanitized Korean "unavailable" notice (variant `unavailable`). Against the rendered output:

- Exactly 3 Korean bullet lines: not reached (blocked before summary generation)
- Labels present (`데이터 상태:`, `해석 범위:`, `유의사항:`): not reached (blocked before summary generation)
- ASCII digit present: false (the rendered blocked message contains no `[0-9]`)
- Forbidden investment phrase present: false (the rendered blocked message contains no buy/sell/target-price/stop-loss/timing/personalized-advice language)

## Root cause (read-only diagnosis, no fix applied this phase)

The LLM summary H route (`src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts`) reads every LLM env value — `CHART_AI_ENABLE_LOCAL_LLM`, `OPENAI_API_KEY`, and the model vars — **exclusively from `process.env`**, and the LLM runtime bridge returns `LLM_DISABLED` (fail-closed, before any OpenAI call) when `CHART_AI_ENABLE_LOCAL_LLM !== 'true'`. This is the same class of runtime-env mismatch that Phase 3GG-K-ENV-HF5 corrected for the KIS side: in the Astro dev/SSR runtime, `.env`-file values are exposed via `import.meta.env`, not `process.env`. The KIS path now works because `kisClient.ts` resolves env with an `import.meta.env`-first dual-source resolver, but the LLM env reads in the H route did not receive that treatment. (The alternative possibility — that `CHART_AI_ENABLE_LOCAL_LLM`/`OPENAI_API_KEY` are simply not set for this local runtime — is also consistent with the evidence.) Either way, the fix/diagnosis belongs to a dedicated phase; the H route and LLM bridge are forbidden-diff files here. No env value was read or printed to determine this.

## Exposure status

- KIS_BASE_URL raw value exposure: Not exposed
- credential exposure: Not exposed
- token exposure: Not exposed
- Authorization header exposure: Not exposed
- raw KIS request exposure: Not exposed
- raw KIS payload exposure: Not exposed
- raw KIS HTTP response body exposure: Not exposed
- raw KIS error message exposure: Not exposed
- raw LLM response exposure: Not exposed
- prompt exposure: Not exposed
- model name exposure: Not exposed (only a `modelPresent` boolean was observed)
- currentPrice numeric exposure: Not exposed
- volume numeric exposure: Not exposed

## Mobile QA result

- Viewport width: 375px
- Panel visible: true
- Button usable: true
- Summary readable: true (the sanitized blocked message is visible and readable)
- Horizontal overflow: false (neither document nor panel exceeds the viewport width)
- Console errors: 0

## Network boundary result

- current_price only: true (the H route internally resolves current_price only)
- H route only: true (exactly one request, to the LLM summary H route)
- No forbidden route: true (no order/account/balance/funds/portfolio/trading/personal request recorded)
- No order/account/balance/funds/portfolio/trading/personal endpoints: confirmed

## Local-only guard preservation

- localhost required: preserved (panel hidden off-local; H route resolves local hostname)
- ownerLocalKisLlm=1 required: preserved (panel hidden without the opt-in query)
- deployed/production fail-closed not changed: preserved (no source change this phase)

## Env file status

- `.env`/`.env.local` not printed: confirmed
- `.env`/`.env.local` not modified: confirmed
- `.env`/`.env.local` not staged: confirmed
- `.env`/`.env.local` not committed: confirmed

## Validation results

- HF5 diagnostic preflight: PASS
- G-FAST owner smoke: PASS
- `npm run check:phase-3gg-k-qa-owner-rerun-2`: PASS
- `npm run check:phase-3gg-k-env-hf5`: PASS (regression)
- `npm run build`: PASS
- `git diff --check`: clean
- `git status --short`: reviewed, only authorized files staged

## Push/deploy status

Not pushed. Not deployed.

## Next recommended phase

Phase 3GG-K-ENV-HF6 — LLM Runtime Readiness Rerun or Safe Diagnostics. Diagnose (and, if it is the same `import.meta.env`-vs-`process.env` runtime-env mismatch HF5 fixed for KIS, apply the equivalent minimal dual-source fix to the LLM env reads) so `CHART_AI_ENABLE_LOCAL_LLM`/`OPENAI_API_KEY`/model policy become visible to the H route runtime and the success-path summary QA can be re-run. (If instead the LLM call reaches OpenAI and fails, the follow-up is the same HF6 LLM readiness phase; if a summary is produced but violates the 3-label/no-digit/no-forbidden-phrase contract, the follow-up is Phase 3GG-K-HF2 — Summary Contract Hotfix.)
