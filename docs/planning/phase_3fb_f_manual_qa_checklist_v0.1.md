# Phase 3FB-F Manual QA Checklist — Chart AI Owner-local Auth/Usage Bridge

This checklist is for the owner to execute locally in a browser. Claude Code did not run a dev
server or perform browser QA as part of preparing this checklist — every result below must be
filled in by the owner after manual review.

## 1. Preconditions

- [ ] Local repository is on branch `rebuild/phase-1-ia-shell`.
- [ ] Current HEAD is `255c72b` or a later commit that has not reverted Phase 3FB-C-ALT/3FB-E/3FB-F.
- [ ] No push or deploy is required to run this checklist.
- [ ] No live KIS connectivity is required.
- [ ] No KIS credentials are required.
- [ ] No real auth provider is required.
- [ ] No usage database or cache is required.

## 2. Local Review Setup

Only if dependencies are not already installed:

```
npm install
```

Start the local dev server:

```
npm run dev
```

Open:

```
http://localhost:4321/chart-ai?ownerLocalAuthUsageBridge=1
```

Also review:

```
http://localhost:4321/chart-ai
```

Do not deploy for this QA. All review happens against the local dev server only.

## 3. Default Public UI Check

URL: `http://localhost:4321/chart-ai`

Expected:
- [ ] Auth/usage bridge panel is hidden.
- [ ] Owner-local mocked panel is hidden.
- [ ] Normal sample chart UI is visible.
- [ ] Search is still usable.
- [ ] Similarity/MK AI tab behavior is unchanged.
- [ ] No automatic API call fires on page load.
- [ ] No live KIS data appears anywhere.
- [ ] No raw debug data appears anywhere.

Result: PASS / FAIL / NOT TESTED

## 4. Auth/Usage Bridge Panel Visibility Check

URL: `http://localhost:4321/chart-ai?ownerLocalAuthUsageBridge=1`

Expected:
- [ ] Auth/usage bridge panel is visible.
- [ ] The existing owner-local mocked panel remains hidden unless `?ownerLocalMocked=1` is also
      present in the URL.
- [ ] Panel copy clearly states: local development only, mock auth/usage only, no real
      login/session, no usage persistence, no live KIS, not investment advice.
- [ ] No automatic API call fires before a scenario button is clicked.

Result: PASS / FAIL / NOT TESTED

## 5. Scenario QA — Allowed Owner

Steps:
- [ ] Click the allowed-owner scenario button.

Expected:
- [ ] A loading state appears.
- [ ] All four scenario buttons are disabled during the request.
- [ ] A success state appears.
- [ ] The result shows:
  - [ ] a success/`ok`-equivalent indicator
  - [ ] mode `owner-local-auth-usage-bridge`
  - [ ] source `mocked-provider-compatible`
  - [ ] a guard status indicating allowed/pass
  - [ ] role `owner`
  - [ ] auth state `authenticated`
  - [ ] a usage-remaining bucket value
  - [ ] an engine status indicating ready/pass
  - [ ] `normalizedBarsAvailable` true
  - [ ] bucketed bar-count and match-count fields
  - [ ] a disclaimer
- [ ] No raw JSON is shown.
- [ ] No raw thrown error is shown.
- [ ] No live KIS data appears.
- [ ] No OHLC values, prices, volume, timestamps, similarity scores, or forward returns appear.
- [ ] The button set returns to a retry-ready (re-enabled) state.

Result: PASS / FAIL / NOT TESTED

## 6. Scenario QA — Anonymous Blocked

Steps:
- [ ] Click the anonymous-blocked scenario button.

Expected:
- [ ] A loading state appears.
- [ ] A blocked / `auth_required`-equivalent result appears.
- [ ] No success/integration fields are rendered as if the request succeeded.
- [ ] A safe error code and message are shown.
- [ ] No raw JSON is shown.
- [ ] No raw thrown error is shown.
- [ ] The button set returns to a retry-ready state.

Result: PASS / FAIL / NOT TESTED

## 7. Scenario QA — Usage-limited

Steps:
- [ ] Click the usage-limited scenario button.

Expected:
- [ ] A loading state appears.
- [ ] A `usage_limited`-equivalent result appears.
- [ ] No success/integration fields are rendered as if the request succeeded.
- [ ] A safe error code and message are shown.
- [ ] No raw JSON is shown.
- [ ] No raw thrown error is shown.
- [ ] The button set returns to a retry-ready state.

Result: PASS / FAIL / NOT TESTED

## 8. Scenario QA — Invalid Usage

Steps:
- [ ] Click the invalid-usage scenario button.

Expected:
- [ ] A blocked/invalid-equivalent result appears.
- [ ] No guard-allowed success is shown.
- [ ] No integration success is rendered.
- [ ] A safe error code and message are shown.
- [ ] The button set returns to a retry-ready state.

Result: PASS / FAIL / NOT TESTED

## 9. Duplicate-click / Loading QA

Steps:
- [ ] Click any scenario button several times in quick succession.

Expected:
- [ ] Only one request is in flight at a time.
- [ ] All four buttons are disabled during loading.
- [ ] No duplicate or interleaved result corruption occurs.
- [ ] All four buttons are re-enabled after the single request completes.

Result: PASS / FAIL / NOT TESTED

## 10. Timeout / Network Failure QA

Manual browser simulation guidance (optional, owner's discretion):
- [ ] Use browser devtools network throttling or offline mode to simulate a slow/failed request,
      then click a scenario button.

Expected:
- [ ] A safe timeout/error message is shown.
- [ ] No raw thrown error is shown.
- [ ] The button set is re-enabled after the failure.
- [ ] Retry is possible by clicking again.

Result: PASS / FAIL / NOT TESTED

## 11. Cross-panel Isolation QA

URLs to check:
- `http://localhost:4321/chart-ai?ownerLocalMocked=1`
- `http://localhost:4321/chart-ai?ownerLocalAuthUsageBridge=1`
- `http://localhost:4321/chart-ai?ownerLocalMocked=1&ownerLocalAuthUsageBridge=1`

Expected:
- [ ] Each panel follows only its own query-parameter gate.
- [ ] The owner-local mocked panel still works independently of the auth/usage bridge panel.
- [ ] The auth/usage bridge panel works independently of the owner-local mocked panel.
- [ ] Both panels are visible only when both of their respective query parameters are present in
      the combined-query case.
- [ ] Neither panel calls the other panel's request body/branch.

Result: PASS / FAIL / NOT TESTED

## 12. Production Boundary QA (optional)

URL: the deployed production URL, only if the owner explicitly chooses to check it manually.

Expected:
- [ ] Both owner-local panels remain hidden on a non-local hostname even if the query parameter is
      present.
- [ ] No public execution occurs.
- [ ] No live KIS data appears.
- [ ] No private/debug panel becomes visible.

Mark as optional unless the owner explicitly tests production. Do not perform this step as part of
required local QA.

Result: PASS / FAIL / NOT TESTED / SKIPPED

## 13. Final Manual QA Decision

Choose one:

- [ ] **PASS** — the local-only mocked auth/usage bridge is safe for internal review.
- [ ] **PASS WITH NOTES** — minor copy/layout issues only, no safety or boundary concern.
- [ ] **BLOCKED** — any public exposure, raw data leak, broken default UI, or route behavior
      mismatch was observed.
- [ ] **NOT TESTED** — the owner has not yet run this manual QA checklist.

Notes:

_(owner to fill in)_
