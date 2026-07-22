# Phase 3FB-E — Chart AI Owner-local Auth/Usage Bridge UI Wiring Result

## 1. Status

Implemented. `/chart-ai` now has a second local-only, explicit opt-in panel that calls the
Phase 3FB-C-ALT `owner-local-auth-usage-bridge` branch of `POST /api/chart-ai/similarity` with
caller-supplied mock auth/usage state and renders only sanitized, bucketed fields. Default public
`/chart-ai` behavior and the existing Phase 3FB-C/D owner-local-mocked panel are unchanged. Live
KIS remains disabled and was not called. No deploy, no push.

## 2. Background

Phase 3FB-C-ALT added an owner-local-only branch to `/api/chart-ai/similarity` that evaluates the
existing `evaluateSimilarityExecutionGuard` against caller-supplied mock auth/usage state before
allowing mocked execution, but that branch had no UI caller. This phase wires that route branch
into a new, independently gated `/chart-ai` panel — reusing the hostname + query opt-in gate,
timeout/abort, in-flight, and response-shape-guard patterns already established in Phase 3FB-C/D —
without modifying the route, the guard, or the deterministic engine.

## 3. Implemented Scope

- `src/pages/chart-ai.astro` gained:
  - A new `chartAiOwnerLocalAuthUsageBridgePanel` section, hidden by default, with four scenario
    buttons (allowed/owner, anonymous/blocked, usage-limited, invalid-usage) and a single
    `aria-live="polite"` result region. Inserted immediately after the existing owner-local-mocked
    panel; does not move, replace, or restyle any existing section.
  - A gate reusing the existing shared `isLocalOwnerHostname()` helper combined with a new,
    independent `?ownerLocalAuthUsageBridge=1` query opt-in — both panels' gates are fully
    independent (separate query params, separate in-flight flags, separate button sets).
  - Four scenario request builders matching the required test-scenario bodies exactly, using
    `selectedSymbol || 'MOCKSYM'` as the symbol fallback.
  - `isAuthUsageBridgeSuccessResponse` / `isAuthUsageBridgeBlockedResponse` client-side shape
    guards validating every required field before any render occurs.
  - An `AbortController` with an `AUTH_USAGE_BRIDGE_TIMEOUT_MS = 8000` timeout, an
    `authUsageBridgeRequestInFlight` flag disabling all four buttons together during a request and
    re-enabling them together in `finally`, and `aria-busy` toggling on the result region.
  - Sanitized, DOM-construction-only rendering (`textContent`/`createElement`, never `innerHTML`)
    for both success and blocked/error outcomes.
  - A new `.chart-owner-local-auth-usage-bridge-*` CSS class family mirroring the existing
    `.chart-owner-local-mocked-*` family's styling, plus one added flex-row rule for the
    four-button scenario group.
- `scripts/check_phase_3fb_e_chart_ai_owner_local_auth_usage_bridge_ui_wiring_contract.mjs` — new
  81-assertion static contract checker, registered as
  `npm run check:phase-3fb-e-chart-ai-owner-local-auth-usage-bridge-ui-wiring` in `package.json`.
  Inspects `chart-ai.astro` as raw text — no build, no dev server, no browser.
- No change to `src/pages/api/chart-ai/similarity.ts` or any other API route: the Phase 3FB-C-ALT
  request/response contract was used as-is; no mismatch was found, so no route code was touched.
- No change to `src/lib/server/providers/**`, `src/lib/server/chartSimilarity/**`,
  `src/lib/chartSimilarity/**`, or `src/data/chartSimilarity/**`.

## 4. UI Contract

- **Hidden by default**: the new panel stays hidden unless both gate conditions are true.
- **Visible only on local + query opt-in**: `localhost`/`127.0.0.1`/`::1` AND
  `?ownerLocalAuthUsageBridge=1`.
- **No auto-run**: the fetch only happens inside a scenario button's `click` handler; listeners are
  only attached when the panel is enabled.
- **Four explicit scenarios**: allowed/owner (`authenticated`/`owner`, `used:0, limit:50,
  remaining:50`), anonymous/blocked (`anonymous`/`anonymous`, `used:0, limit:3, remaining:3`),
  usage-limited (`authenticated`/`owner`, `used:50, limit:50, remaining:0`), and invalid-usage
  (`authenticated`/`owner`, `used:10, limit:5, remaining:0`).
- **Single endpoint**: only `POST /api/chart-ai/similarity`, with `Content-Type: application/json`;
  no other endpoint and no call from the older owner-local-mocked panel's code.
- **Timeout behavior**: an unanswered request aborts at 8000ms and shows a safe, static timeout
  message.
- **Duplicate-request prevention**: all four buttons are disabled together while any one request is
  in flight and re-enabled together in `finally`, regardless of outcome.

## 5. Response Rendering

- **Rendered success fields**: `status`, `mode`, `request.source`, `data.guardStatus`,
  `data.authState`, `data.role`, `data.usageWindow`, `data.usageRemainingBucket`,
  `data.engineStatus`, `data.normalizedBarsAvailable`, `data.normalizedBarCountBucket`,
  `data.matchCountBucket`, `data.dataPolicy` (flags), `data.disclaimer`.
- **Rendered blocked/error fields**: `status`, `mode`, `error.code`, `error.message`,
  `error.retryable`.
- **Omitted fields**: raw provider payload, raw matches, similarity scores, forward returns, OHLC
  values, prices, volume, real timestamps, secret material, env values, real user/session id, IP
  address, and brokerage-sensitive (account/trading/order/balance) fields — none of these appear
  anywhere in the new code.
- **No raw errors, no raw JSON**: catch blocks only call a fixed static-message helper; a response
  failing both shape guards falls through to the same safe static message; `innerHTML` is never
  used anywhere in the new code.

## 6. Boundary Preservation

- API route (`src/pages/api/chart-ai/similarity.ts`) unchanged — the Phase 3FB-C-ALT contract was
  used as-is; no request/response mismatch was found, so no route code was modified.
- KIS provider source (`src/lib/server/providers/**`) unchanged.
- Deterministic engine source (`src/lib/chartSimilarity/**`) unchanged.
- No public/beta execution enabled; the new panel's gate is local-hostname + query opt-in only,
  independent from and non-interfering with the existing owner-local-mocked panel's gate.
- No real auth provider import, no real usage DB/cache runtime, no SQL/migration, no dependency or
  lockfile change, no deployment, no push.
- No account/trading/order/balance API called; no raw KIS/OHLC/volume/timestamp/secret/env value
  appears anywhere in the new code.

## 7. Validation

- `npm run check:phase-3fb-e-chart-ai-owner-local-auth-usage-bridge-ui-wiring` — `PASS (81/81
  assertions passed)`.
- `npm run smoke:phase-3fb-c-alt-auth-usage-runtime-bridge-for-similarity-route` — `PASS (59/59
  assertions passed)`.
- `npm run check:phase-3fb-c-alt-auth-usage-runtime-bridge-for-similarity-route` — one assertion
  ("`src/pages/chart-ai.astro` must not reference the new Phase 3FB-C-ALT auth/usage bridge in
  this phase") failed on the first run and is expected: that assertion enforced a scope boundary
  for Phase 3FB-C-ALT itself (that phase's mandate was route-only, so `chart-ai.astro` had to stay
  untouched at that time). This phase's explicit, approved mandate is to add exactly that
  reference. The checker script is outside this phase's allowed-file list, so it was left
  unmodified; this single, expected mismatch is a stale prior-phase scope assertion, not a defect
  in this phase's implementation. All other 75/76 assertions in that checker passed.
- `npm run check:phase-3fb-d-chart-ai-owner-local-mocked-ui-runtime-polish` — failed once on first
  run (`File must never reference account/trading/balance/credential/token fields`) because a new
  explanatory doc comment in this phase's own code used those literal words in prose. Fixed by
  rewording the comment (no meaning change) to avoid the literal forbidden words; re-run passed
  `PASS (67/67 assertions passed)`.
- `npm run check:phase-3fb-c-chart-ai-ui-owner-local-mocked-api-execution-wiring` — `PASS (49/49
  assertions passed)`.
- `npm run smoke:phase-3fb-b-owner-local-mocked-similarity-api-route-integration` — `PASS (36/36
  assertions passed)`.
- `npm run smoke:phase-3fb-a-provider-compatible-ohlc-to-similarity-engine-integration` — `PASS
  (35/35 assertions passed)`.
- `npm run build` — passed.
- `git diff --check` — no diff errors.
- Forbidden-path diff against `src/pages/api src/lib/server/providers
  src/lib/server/chartSimilarity src/lib/chartSimilarity src/data/chartSimilarity` (relative to
  `220adcf`) — no output.
- Changed-files diff (relative to `220adcf`) — limited to the 5 allowed files:
  `src/pages/chart-ai.astro`, `scripts/check_phase_3fb_e_chart_ai_owner_local_auth_usage_bridge_ui_wiring_contract.mjs`,
  `docs/planning/phase_3fb_e_chart_ai_owner_local_auth_usage_bridge_ui_wiring_result_v0.1.md`,
  `docs/planning/planning_changelog.md`, `package.json`.
- Live KIS smoke was not re-run. No network diagnostic was run.

## 8. Manual Review

For the owner to run locally (not performed by Claude Code in this session):

1. Run `npm run dev`.
2. Open `http://localhost:4321/chart-ai?ownerLocalAuthUsageBridge=1`.
   - Expected: the new auth/usage bridge panel is visible; all four scenario buttons work
     independently; the allowed/owner scenario shows a sanitized success result; the anonymous and
     usage-limited scenarios show safe blocked messages; the invalid-usage scenario shows a safe
     blocked message; no raw JSON, raw error, live KIS data, OHLC values, volume, timestamps,
     scores, returns, secret material, env values, or account/trading/balance fields ever appear;
     the existing owner-local-mocked panel (`?ownerLocalMocked=1`) continues to work unchanged.
3. Open `http://localhost:4321/chart-ai` (no query opt-in).
   - Expected: both owner-local panels remain hidden; default UI, search, sample chart, tabs, and
     disclaimers are unchanged.

Do not deploy this for review.

## 9. Implementation Implication

The owner-local auth/usage bridge route branch built in Phase 3FB-C-ALT is now reachable and
verifiable from the browser, entirely gated to local development, with no change to production
behavior. Live KIS remains separately blocked by external network reachability, unrelated to this
phase. The next phase can proceed to a manual QA/productization boundary review of this panel, or
to a real auth/usage runtime design discussion, without requiring live KIS.

## 10. Recommended Next Phase

Phase 3FB-F — Chart AI Owner-local Auth/Usage Bridge Manual QA and Productization Boundary Review,
Live KIS Off.

Alternative: a design-only phase evaluating what a real (non-mocked) auth/usage runtime would
require, without implementing it.
