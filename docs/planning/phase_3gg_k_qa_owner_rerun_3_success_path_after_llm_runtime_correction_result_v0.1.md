# Phase 3GG-K-QA-OWNER-RERUN-3 — Verify Success-path Summary Quality After LLM Runtime Correction — Result

## Status

Passed. The owner-local Chart AI KIS + LLM summary success path now renders end-to-end in the browser: KIS current_price → H route → LLM bridge → sanitized Korean summary panel. Click-only execution, a valid 3-bullet Korean summary with all required labels, zero exposure, no forbidden route, and mobile 375px usability were all verified.

## Classification

`PASS_SUCCESS_PATH_VERIFIED`

## Baseline

`4a37f05`

## Branch

`rebuild/phase-1-ia-shell`

## HEAD before

`4a37f05d78d178cdd9e5ffd81f90794d42ecad2b`

## HEAD after

(recorded post-commit; see final report)

## Purpose

Run the full owner-local browser QA for the now-working KIS + LLM success path after Phase 3GG-K-ENV-HF6 fixed the LLM runtime env readiness issue, verifying the same success path in the actual Chart AI browser UI.

## Files changed

- `docs/planning/phase_3gg_k_qa_owner_rerun_3_success_path_after_llm_runtime_correction_result_v0.1.md` (created)
- `scripts/check_phase_3gg_k_qa_owner_rerun_3_contract.mjs` (created)
- `package.json` (modified — 1 script entry added)
- `docs/planning/planning_changelog.md` (modified — entry prepended)

## Source diff status

Zero diff from baseline `4a37f05` for all forbidden-diff source files (kisClient.ts, the KIS market-data binding, both chart-ai API routes including the LLM summary H route, the LLM runtime bridge, the model policy module, `chart-ai.astro`, MK Agent, Similar Pattern agent, guarded productization scaffold, `components`, `supabase`, `src/data`, lockfiles, `.env`, `.env.local`). This is a QA-only phase: no source feature/UI/provider/route/bridge/model-policy change.

## Local dev server status

- Reachable: true
- Listening on 4321: true (single listener, PID 3288 — the fresh server from Phase 3GG-K-ENV-HF6)
- Fallback ports 5173/5174 listening: false
- devServerFreshOrExistingHealthy: true (existing healthy HF6 server, already carrying both the KIS and LLM runtime-env fixes)
- Restarted for QA: false

## Preflight readiness

- HF5 diagnostic (`npm run owner-diagnostic:phase-3gg-k-env-hf5 -- --owner-approved-local-provider-runtime-env-diagnostic --base-url=http://localhost:4321`): PASS — `route-ready`, `FIXED_RUNTIME_FLAG_INJECTION_CURRENT_PRICE_READY`.
- G-FAST owner smoke (`npm run owner-smoke:phase-3gg-g-fast -- --owner-approved-real-kis-smoke`): PASS — `sourceStatus=ok currentPricePresent=true volumePresent=true sanitized=true`.
- HF6 diagnostic (`npm run owner-diagnostic:phase-3gg-k-env-hf6 -- --owner-approved-llm-runtime-env-diagnostic --base-url=http://localhost:4321`): PASS — `FIXED_LLM_RUNTIME_ENV_READY` (summaryOk=true, llmStatus=ok, summaryLineCount=3, requiredLabelsPresent=true, asciiDigitPresentInSummary=false, forbiddenInvestmentPhrasePresent=false).

## Browser QA method

- Browser automation tool used: in-app Browser pane (Claude Browser MCP) driving the real dev server.
- URLs checked: `http://localhost:4321/chart-ai` (no query) and `http://localhost:4321/chart-ai?ownerLocalKisLlm=1`.
- Viewports: desktop 1280×720 and mobile 375×812.
- Per-page H route request counts measured with `performance.getEntriesByType('resource')` (resets on navigation) for unambiguous click-only accounting. No raw numeric, credential, key, payload, prompt, or model-name value was read into evidence.

## Default hidden state result

On `/chart-ai` with no query: owner-local KIS + LLM summary panel present in DOM but `hidden=true` and not rendered (`offsetParent === null`); no H route fetch on this page; no console error; no forbidden route. PASS.

## Opt-in visible idle state result

On `/chart-ai?ownerLocalKisLlm=1` (local hostname): panel visible, action button visible and enabled, status text `대기 중` (idle), output hidden; `hRouteRequestCount=0` on this page before click (no auto-fetch); no forbidden route; no console error. PASS.

## Click-only H route execution result

- H route request count before click: 0
- H route request count after click: 1
- Exact route matched: true — `/api/chart-ai/local-only-kis-llm-summary.json?ownerLocalKisLlm=1&symbol=005930` → HTTP 200 (2xx)
- No auto-fetch before click: true
- No forbidden route: true

## H route success-path result

- summary.ok: true
- sourceStatus: ok
- llmStatus: ok
- sanitizedErrorCode: null
- currentPricePresent: true
- volumePresent: true
- summaryTextPresent: true

## Browser rendered summary result

- renderedSummaryPresent: true (panel status text `완료` / complete)
- Exactly 3 Korean bullet lines: true (renderedSummaryLineCount = 3)
- Labels present:
  - `데이터 상태:`: true
  - `해석 범위:`: true
  - `유의사항:`: true
- ASCII digit present: false
- Forbidden investment phrase present: false

## Exposure status

- KIS_BASE_URL raw value exposure: Not exposed
- credential exposure: Not exposed
- OpenAI key exposure: Not exposed (no `sk-…` in page or response)
- token exposure: Not exposed
- Authorization header exposure: Not exposed (no `Bearer …` in page or response)
- raw KIS request exposure: Not exposed
- raw KIS payload exposure: Not exposed (no `rt_cd`/`stck_prpr`/`acml_vol`/`output` in response)
- raw KIS HTTP response body exposure: Not exposed
- raw KIS error message exposure: Not exposed
- raw OpenAI request exposure: Not exposed
- raw OpenAI response exposure: Not exposed (no `choices`/`usage`/`completion` in response)
- prompt exposure: Not exposed (no prompt field in response)
- model name exposure: Not exposed (response carries only a `modelPresent` boolean)
- currentPrice numeric exposure: Not exposed
- volume numeric exposure: Not exposed

## Mobile QA result

- Viewport width: 375px
- Panel visible: true
- Button usable: true
- Summary readable: true (rendered 3-bullet Korean summary visible and readable)
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
- HF6 diagnostic: PASS
- `npm run check:phase-3gg-k-qa-owner-rerun-3`: PASS
- `npm run check:phase-3gg-k-env-hf6`: PASS (regression)
- `npm run build`: PASS
- `git diff --check`: clean
- `git status --short`: reviewed, only authorized files staged

## Push/deploy status

Not pushed. Not deployed.

## Next recommended phase

Phase 3GG-L-FAST — Owner-local LLM Quality Regression Harness. The owner-local KIS + LLM summary success path is now fully verified end-to-end in the browser; the next phase should establish a repeatable quality regression harness for the LLM summary output.
