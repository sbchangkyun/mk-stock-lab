# Phase 3GG-I-QA — Owner-local Browser QA Result

- **Status**: Executed / Passed (no defects found)
- **Baseline: 5e51712e34081e5cf5aaf2f810af2b155baba8a1** (Phase 3GG-I-FAST)
- **Branch: rebuild/phase-1-ia-shell**
- **Scope**: QA only — no source feature changes. Files changed this phase: this result document, `phase_3gg_i_qa_owner_local_browser_qa_checklist_v0.1.md`, `scripts/check_phase_3gg_i_qa_contract.mjs`, `package.json` (new script entry), `docs/planning/planning_changelog.md` (new entry).

## QA environment

- Local Astro dev server (`npm run dev`), started via the sandboxed session's browser-preview tooling, reachable at `http://localhost:4321`.
- This Claude Code session does not hold owner-local KIS credentials, `CHART_AI_ENABLE_LOCAL_LLM`, `OPENAI_API_KEY`, or `CHART_AI_LLM_MODEL` by design (the project's established "Explicit Owner Run" pattern — see prior phases G-FAST/H-FAST/H-HF1). `.env`/`.env.local` were not opened or read.

## Owner-confirmed precondition (carried into this phase)

- G-FAST smoke PASS (`symbol=005930`, `sourceStatus=ok`, `currentPricePresent=true`, `volumePresent=true`, `sanitized=true`).
- H-FAST/H-HF1 smoke PASS (`symbol=005930`, `llmStatus=ok`, `summaryPresent=true`, `currentPricePresent=true`, `sanitized=true`); model `gpt-5.5`; a real owner-local LLM network call occurred.
- Phase 3GG-I-FAST committed at `5e51712e34081e5cf5aaf2f810af2b155baba8a1`, adding the hidden-by-default owner-local LLM summary panel.

## Case summary table

| Case | Description | Result |
| --- | --- | --- |
| 1 | Default page hidden state | PASS |
| 2 | Owner-local opt-in visible idle state | PASS |
| 3 | Click execution success | PASS |
| 4 | Blocked/unavailable state display | PASS |
| 5 | Mobile viewport | PASS |
| 6 | Network boundary | PASS |

Full detail per case is in `phase_3gg_i_qa_owner_local_browser_qa_checklist_v0.1.md`.

## Network boundary result

- URL tested: `http://localhost:4321/chart-ai` and `http://localhost:4321/chart-ai?ownerLocalKisLlm=1`.
- Pre-click network call count to the H route: 0 (no auto-fetch before click on either the default page or the opt-in visible idle state).
- Post-click network call count to the H route: 1 (`GET /api/chart-ai/local-only-kis-llm-summary.json?ownerLocalKisLlm=1&symbol=005930` → 200 OK).
- No order/account/balance/funds/portfolio/trading/personal route call detected.
- No MK Agent route call detected. No Similar Pattern route call detected.
- No Supabase/auth/session/JWT route introduced by the new panel.
- `forbiddenRouteCallDetected`: **false**.

## Console result

- Console error count across all cases: 0.

## Mobile result

- Viewport: ~375px width.
- Panel and button fit the viewport; no horizontal overflow attributable to the new panel; no console error.

## Sanitization result

- `summaryPresent`: false (full `llmStatus: ok` success path was not independently reproduced in this session because it lacks owner-local LLM/KIS credentials by design; this path was already confirmed working end-to-end, sanitized, during the Phase 3GG-I-FAST/H-HF1 owner-run smoke).
- `currentPriceNumericExposed`: false.
- `credentialExposed`: false.
- `rawKisPayloadExposed`: false.
- `rawLlmResponseExposed`: false.
- `promptExposed`: false.
- `forbiddenRouteCallDetected`: false.

## Credential / raw-payload / prompt exposure status

- Credential exposure status: not exposed.
- Raw KIS payload exposure status: not exposed.
- Raw LLM response exposure status: not exposed.
- Prompt exposure status: not exposed.
- currentPrice numeric exposure status: not exposed.

## Defects found

None.

## Next-phase recommendation

Phase 3GG-J-FAST — Model Tier and Fallback Policy.

## Push/deploy status

- Not pushed.
- Not deployed.
