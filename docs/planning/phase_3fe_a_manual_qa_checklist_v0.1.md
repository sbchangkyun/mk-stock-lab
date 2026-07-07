# Phase 3FE-A-MANUAL-QA - Owner-local Browser/API QA Checklist

## 1. Purpose

Prepare owner-local manual QA for the Phase 3FE-A KIS OHLC fixture mode after the verified Phase 3FE-A-HANDOFF baseline.

This checklist does not approve live KIS. This checklist does not approve LLM. This checklist does not approve MK AI route activation. This checklist does not approve Supabase/DB/env/session/JWT runtime activation. This checklist does not approve public/beta activation. This checklist does not approve deploy/push.

Any failure should lead to `Phase 3FE-A-HF2`, not direct implementation drift.

## 2. Baseline

- Current baseline before phase: `b3a4679`
- Latest completed phase before phase: `Phase 3FE-A-HANDOFF`
- Phase 3FE-A feature commit: `1b2a0f2`
- Phase 3FE-A-HF1 evidence commit: `e6c7679`
- Phase 3FE-A-HANDOFF commit: `b3a4679`
- Branch: `rebuild/phase-1-ia-shell`

## 3. Preconditions

- Work from local repository root.
- Confirm tracked tree is clean before QA.
- Use local loopback only if API/browser QA is executed.
- Do not inspect `.env`, `.env.local`, or `.env.*`.
- Do not use credentials.
- Do not call remote URLs or external APIs.

## 4. Required Safety Boundaries

- No live KIS.
- No LLM.
- No MK AI route activation.
- No Supabase/DB/env/session/JWT/cookie/header parsing.
- No public/beta activation.
- No dependency or lockfile change.
- No deploy/push.
- No KIS account/trading/order/balance APIs.

## 5. Static Validation Checklist

Run and record:

- `npm run check:phase-3fe-a-manual-qa-result`
- `npm run check:phase-3fe-a-handoff-chart-ai-new-chat-package`
- `npm run check:phase-3fe-a-kis-ohlc-provider-owner-local-integration`
- `npm run smoke:phase-3fe-a-kis-ohlc-provider-owner-local-integration`
- `npm run check:phase-3fd-j-similar-pattern-route-owner-local-activation`
- `npm run smoke:phase-3fd-j-similar-pattern-route-owner-local-activation`
- `npm run check:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off`
- `npm run smoke:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off`
- `npm run build`
- `git diff --check`

## 6. API QA Checklist

If a local dev server is safely started by the owner, verify:

- Owner-local route query works only locally.
- Default owner-local Similar Pattern route flow remains synthetic/sample.
- Explicit `ownerLocalOhlcProviderMode: "kis_ohlc_fixture"` uses the fixture provider boundary.
- Provider fixture mode is available only through the existing explicit owner-local guarded Similar Pattern route path.
- Remote, anonymous, unknown-role, missing dependency, and malformed request cases fail closed.
- API output contains sanitized labels, counts, and bucketed diagnostics only.

## 7. Browser QA Checklist

Owner browser QA should verify:

- Default `/chart-ai` remains mocked.
- Mocked logged-out mode remains available through `chartAiMockLoggedOut=1`.
- Mocked master mode remains available through `chartAiMockMaster=1`.
- Logged-out state wins over master mock mode.
- Owner-local Similar Pattern route-backed flow remains available through `ownerLocalSimilarPatternRoute=1`.
- MK AI remains mocked.

## 8. Expected Safe Response Properties

API/UI output must not expose:

- Raw KIS payloads.
- Raw OHLC rows.
- Provider payloads.
- Raw master identifiers.
- Raw emails or raw UIDs.
- Tokens, cookies, sessions, JWTs, env values, stack traces, or internal exception details.

## 9. Fail-closed Cases

Verify fail-closed behavior for:

- Remote request.
- Anonymous request.
- Unknown role.
- Missing dependency.
- Malformed request.
- Invalid provider fixture mode.

## 10. Pass/fail Criteria

Pass requires static validations, local owner-only API QA, and browser QA to pass without boundary violations. Partial means static validations pass but API/browser QA remains not executed or owner-required. Any boundary violation fails and should route to `Phase 3FE-A-HF2`.

## 11. Owner Execution Notes

- Use local loopback only.
- Do not print full raw responses if a response appears to contain sensitive material.
- Stop local dev server after testing.
- Keep live KIS, LLM, public/beta activation, deploy, and push blocked.
