# Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT — Owner Visual Browser QA Checklist

## 1. Purpose

Provide the owner-executable visual/browser QA checklist needed to close the remaining visual/client-side verification gap after Phase 3FE-A-MANUAL-QA-RUN-RETRY.

This checklist is documentation-only. It does not approve runtime activation, provider activation, route behavior changes, deployment, or public release.

## 2. Baseline

- Current baseline before closeout: `a191dfc`.
- Latest completed phase before closeout: `Phase 3FE-A-MANUAL-QA-RUN-RETRY`.
- Phase 3FE-A feature commit: `1b2a0f2`.
- Phase 3FE-A-HF1 evidence commit: `e6c7679`.
- Phase 3FE-A-HANDOFF commit: `b3a4679`.
- Phase 3FE-A-MANUAL-QA commit: `0e02130`.
- Phase 3FE-A-MANUAL-QA-RUN-HF1 commit: `fb34d72`.
- Phase 3FE-A-MANUAL-QA-RUN-RETRY commit: `a191dfc`.
- Branch: `rebuild/phase-1-ia-shell`.

## 3. Preconditions

- Use the local repository only.
- Use a loopback-only dev server if visual execution is performed.
- Use only `localhost` or `127.0.0.1`.
- Do not use credentials.
- Do not inspect `.env`, `.env.local`, or `.env.*`.
- Do not call remote URLs.
- Do not call external APIs.
- Do not call live KIS.
- Do not call an LLM.
- Do not deploy.
- Do not push.

## 4. Safety boundaries

- This checklist does not approve live KIS.
- This checklist does not approve LLM.
- This checklist does not approve MK AI route activation.
- This checklist does not approve Supabase/DB/env/session/JWT runtime activation.
- This checklist does not approve public/beta activation.
- This checklist does not approve deploy/push.
- This checklist does not approve direct Phase 3FF-A implementation.
- If visual QA fails, the next phase should be `Phase 3FE-A-HF2` or a focused UI-only hotfix, not direct implementation drift.

## 5. Owner visual QA cases

### A. Default `/chart-ai`

URL:

`/chart-ai`

Verify:

- Page loads normally.
- Default state remains mocked.
- No production, beta, public, live KIS, or live provider labels are shown.
- No raw payload or sensitive identifiers are visible.

Result:

- PASS / FAIL / NOT CONFIRMED:
- Evidence reference:
- Notes:

### B. Mocked logged-out mode

URL:

`/chart-ai?chartAiMockLoggedOut=1`

Verify:

- Login-required or locked state appears.
- Main Chart AI application body is hidden or inaccessible as designed.
- No sensitive identifiers are visible.

Result:

- PASS / FAIL / NOT CONFIRMED:
- Evidence reference:
- Notes:

### C. Mocked master mode

URL:

`/chart-ai?chartAiMockMaster=1`

Verify:

- Mocked master state is available.
- Master cooldown behavior is represented as expected.
- No raw master identifier is visible.

Result:

- PASS / FAIL / NOT CONFIRMED:
- Evidence reference:
- Notes:

### D. Logged-out precedence

URL:

`/chart-ai?chartAiMockLoggedOut=1&chartAiMockMaster=1`

Verify:

- Logged-out state wins over master mock mode.
- Locked state appears.
- No master-only body is exposed.

Result:

- PASS / FAIL / NOT CONFIRMED:
- Evidence reference:
- Notes:

### E. Owner-local Similar Pattern route-backed flow

URL:

`/chart-ai?ownerLocalSimilarPatternRoute=1`

Verify:

- Owner-local route-backed Similar Pattern flow is visible or available as designed.
- Default owner-local flow remains synthetic/sample unless explicit provider fixture mode is requested.
- No live KIS indication appears.
- No raw payload appears.

Result:

- PASS / FAIL / NOT CONFIRMED:
- Evidence reference:
- Notes:

### F. Explicit KIS OHLC fixture mode

If the UI exposes a way to trigger it, verify:

- `ownerLocalOhlcProviderMode: "kis_ohlc_fixture"` remains fixture-only.
- Result copy and diagnostics are sanitized.
- No raw KIS payload, raw OHLC rows, provider payload, stack traces, tokens, sessions, env values, raw master identifiers, raw emails, or raw UIDs are displayed.

If the UI does not expose a direct visual control for this mode:

- Mark UI trigger as `not exposed in UI`.
- Reference the passing API QA from `Phase 3FE-A-MANUAL-QA-RUN-RETRY`.

Result:

- PASS / FAIL / NOT CONFIRMED / NOT EXPOSED IN UI:
- Evidence reference:
- Notes:

### G. MK AI mocked state

Verify:

- MK AI remains mocked.
- No LLM route or live AI call appears active.
- No paid or cost-incurring behavior is exposed.

Result:

- PASS / FAIL / NOT CONFIRMED:
- Evidence reference:
- Notes:

### H. General visual safety

Verify:

- No live KIS language.
- No beta/public activation language.
- No LLM active language.
- No Supabase/DB/env/session/JWT language.
- No raw response dumps.
- No stack traces.
- No credential-like values.

Result:

- PASS / FAIL / NOT CONFIRMED:
- Evidence reference:
- Notes:

## 6. Expected safe visual properties

- All tested URLs remain owner-local or mocked-only.
- Default `/chart-ai` remains mocked.
- Logged-out mock mode remains visibly locked.
- Master mock mode does not expose raw identifiers.
- Owner-local route-backed flow does not show live KIS or public/beta language.
- KIS OHLC fixture mode, if visible, is described as fixture-only and sanitized.
- MK AI remains mocked.
- No raw response dumps, stack traces, tokens, sessions, env values, raw KIS payloads, raw OHLC rows, provider payloads, raw master identifiers, raw emails, or raw UIDs are visible.

## 7. Pass/fail criteria

- PASS: the case was visually inspected by the owner and all expected safe properties were confirmed.
- FAIL: the case was visually inspected and any expected property was violated.
- NOT CONFIRMED: the case was not visually inspected or evidence was insufficient.
- NOT EXPOSED IN UI: the explicit fixture mode has no direct UI trigger, and the passing API QA from Phase 3FE-A-MANUAL-QA-RUN-RETRY is used as the non-visual reference.

All required visual cases must be PASS, or explicitly NOT EXPOSED IN UI for the direct fixture control case, before this visual closeout can be treated as fully closed.

## 8. Evidence recording template

Use sanitized evidence only:

- Reviewer:
- Date:
- Local URL:
- Browser/device:
- Case ID:
- Result:
- Evidence reference:
- Sanitized notes:
- Sensitive data removed: yes / no / not applicable

Do not attach or record secrets, credentials, tokens, cookies, sessions, JWTs, env values, raw user IDs, raw emails, raw master identifiers, raw KIS payloads, raw OHLC rows, provider payloads, stack traces, account data, order data, balance data, or trading data.

## 9. Owner sign-off template

- Owner visual QA completed: yes / no
- All required cases passed or correctly marked not exposed in UI: yes / no
- Issues found: yes / no
- If issues found, recommended follow-up:
- Owner sign-off:
- Date:

## 10. Next-step decision matrix

- All cases pass and no issues are found: proceed to `Phase 3FF-A-PLAN` only as a planning-only next step.
- Some cases are not confirmed: complete the missing owner visual QA cases.
- Any visual issue is found: open `Phase 3FE-A-HF2` or a focused UI-only hotfix.
- Runtime/provider/security boundary issue is found: stop and open a focused investigation/hotfix phase.
- Live KIS, beta activation, public activation, and direct Phase 3FF-A implementation remain blocked regardless of this checklist outcome.
