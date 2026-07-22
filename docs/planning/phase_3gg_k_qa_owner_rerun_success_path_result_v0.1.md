# Phase 3GG-K-QA-OWNER-RERUN — Owner-run Success-path QA for Upgraded Chart AI Summary Quality — Result v0.1

- **Status: Blocked**
- **Baseline: e056d4b**
- **Branch: rebuild/phase-1-ia-shell**
- **HEAD before: e056d4b**
- **HEAD after: e056d4b (before this phase's own commit)**

## 1. Scope

This is a narrow, owner-run QA rerun of Phase 3GG-K-QA's previously blocked owner-local success-path case.
The purpose was to verify the actual `llmStatus=ok` success path for the upgraded Chart AI KIS + LLM summary
using the owner's real local environment. No source feature changes, no UI change, no H route change, no
model policy change, no KIS endpoint expansion were made. Cases verified this rerun: panel visibility and no
H route fetch before click, single H route call on click, no console error, response exposure-safety fields,
mobile viewport (375px), and network boundary (no forbidden route calls).

## 2. Files changed

- Created `docs/planning/phase_3gg_k_qa_owner_rerun_success_path_result_v0.1.md` (this file).
- Created `scripts/check_phase_3gg_k_qa_owner_rerun_contract.mjs`.
- Modified `package.json` (added `check:phase-3gg-k-qa-owner-rerun` script).
- Modified `docs/planning/planning_changelog.md` (prepended Phase 3GG-K-QA-OWNER-RERUN entry).
- Zero diff confirmed on `src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs`,
  `src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts`, `src/pages/chart-ai.astro`, and
  `src/lib/server/chart-ai/local-only-llm-model-policy.mjs` vs baseline `e056d4b`.

## 3. QA environment

- Local dev server: `npm run dev` (Astro v6.1.1), `http://localhost:4321`.
- Owner's already-configured local environment was used as-is. `.env`/`.env.local` were never opened, read,
  or printed by this QA session.
- Browser method: Claude Browser MCP tool suite (navigate, javascript_tool DOM/JS inspection,
  read_network_requests, read_console_messages, resize_window) against the running dev server.

## 4. URL tested

- `http://localhost:4321/chart-ai?ownerLocalKisLlm=1`

## 5. Pre-click state

- Panel visible: confirmed (`chartAiOwnerLocalKisLlmSummaryPanel` present, non-empty, with button
  `chartAiOwnerLocalKisLlmSummaryButton` and status element `chartAiOwnerLocalKisLlmSummaryStatus` present).
- H route call count before click: 0 (confirmed via `read_network_requests` filtered to
  `local-only-kis-llm-summary` immediately after page load, before any click).
- Console error count before click: 0.

## 6. Click execution

- Owner-local LLM summary button ("로컬 전용 KIS + LLM 요약 요청 (005930)") clicked exactly once via a
  single DOM `.click()` invocation.
- H route call count after click: 1 (exactly one GET request to
  `/api/chart-ai/local-only-kis-llm-summary.json?ownerLocalKisLlm=1&symbol=005930`).
- No request body observed (GET request).
- No forbidden route call detected.
- No console error after click.

## 7. Route response result

- `summary.ok`: **false**
- `llmStatus`: **unavailable**
- `sanitizedErrorCode`: **SOURCE_UNAVAILABLE**
- `sourceStatus`: **unavailable**
- `currentPricePresent`: false
- `volumePresent`: false
- `modelPresent`: false
- `summaryText`: null

The KIS current-price source layer reported unavailable before the LLM bridge was ever invoked — the same
`SOURCE_UNAVAILABLE` outcome observed in Phase 3GG-K-QA's Case 6. This indicates the local dev session used
for this rerun did not have a working owner-local KIS credential/connectivity path at QA time, even though
the request was issued through the intended owner-local opt-in flow. This is a QA execution/environment
observation, not a source code defect (see Section 14).

## 8. Success-path summary quality result

**Not executed.** `summary.ok` was `false`, so the 3-bullet Korean summary quality checks (label presence,
ASCII digit absence, forbidden investment phrase absence, "not investment advice" implication) could not be
evaluated against real LLM output this rerun.

## 9. Numeric-output protection browser result

**Not naturally triggered.** `sanitizedErrorCode` was `SOURCE_UNAVAILABLE`, not
`FORBIDDEN_NUMERIC_OUTPUT_DETECTED` — the KIS layer failed closed before the LLM bridge was ever called, so
the numeric-rejection fail-closed path was not exercised this rerun either.

## 10. Network boundary result

- Exactly one call to the intended H route on click; zero calls before click.
- No calls to any MK Agent, Similar Pattern, order/account/balance/funds/portfolio/trading/personal, or
  KIS-endpoint-expansion route observed.
- Forbidden route call detected: **false**.

## 11. Console result

- No console errors observed before click, after click, or during mobile viewport check.

## 12. Mobile result

- At 375px viewport width: panel visible and readable, button usable (non-zero size), status text visible,
  no horizontal document overflow (`document.documentElement.scrollWidth` = 375, equal to viewport width).
- No console error at mobile viewport.

## 13. Sanitization / exposure result

All exposure checks below reflect what this QA session observed and printed — the raw response body was
inspected only for the allowlisted field names below; no numeric or free-text field values beyond those
allowlisted boolean/status fields were ever printed.

- Credential exposure status: **Not exposed**
- Raw KIS payload exposure status: **Not exposed**
- Raw LLM response exposure status: **Not exposed**
- Prompt exposure status: **Not exposed**
- Model name exposure status: **Not exposed**
- currentPrice numeric exposure status: **Not exposed**

## 14. Defects found

**None.** The fail-closed `SOURCE_UNAVAILABLE` behavior observed matches the existing, previously-verified
contract from Phase 3GG-K-FAST/3GG-K-QA — the KIS source layer correctly fails closed and the LLM bridge is
correctly never invoked when the source is unavailable, with no exposure of any forbidden field. This is not
a source code defect; it reflects that this QA session's local environment did not have a working owner-local
KIS connectivity/credential path at the time of this rerun.

## 15. Result summary table

| Field | Value |
|---|---|
| H route call count before click | 0 |
| H route call count after click | 1 |
| summary.ok | false |
| llmStatus | unavailable |
| sanitizedErrorCode | SOURCE_UNAVAILABLE |
| threeBulletLabelsPresent | not-executed |
| asciiDigitInSummaryDetected | not-executed |
| forbiddenInvestmentPhraseDetected | not-executed |
| numericRejectionObserved | false |
| currentPriceNumericExposed | false |
| credentialExposed | false |
| rawKisPayloadExposed | false |
| rawLlmResponseExposed | false |
| promptExposed | false |
| modelNameExposed | false |
| forbiddenRouteCallDetected | false |

## 16. Push/deploy status

- Not pushed.
- Not deployed.
- No public activation, no beta activation, no internal QA activation.

## 17. Next recommended phase

Per this phase's own conditional logic, since the route returned `SOURCE_UNAVAILABLE` (an "other blocked
state" rather than a clean `summary.ok=true` success or a clean `FORBIDDEN_NUMERIC_OUTPUT_DETECTED`
rejection): **recommend a focused environment/runtime correction** (verifying owner-local KIS credential
presence and connectivity outside of this QA session, without this session ever opening or printing
`.env`/`.env.local`) **before Phase 3GG-L-FAST — Owner-local LLM Quality Regression Harness.** A further
owner-run rerun of this same success-path QA is recommended once KIS connectivity/credentials are confirmed
working in the local environment.
