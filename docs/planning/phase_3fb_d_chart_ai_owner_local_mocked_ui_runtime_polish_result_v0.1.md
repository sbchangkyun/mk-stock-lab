# Phase 3FB-D — Chart AI Owner-local Mocked UI Runtime Polish and Failure-state Hardening Result

## 1. Status

Implemented. The local-only, explicit opt-in owner-local mocked execution panel on `/chart-ai`
now has a hardened runtime: a response shape guard, an 8-second request timeout with abort
support, repeated-click prevention, `aria-busy` loading state, and a retry-ready button state
after every completion (success, error, timeout, or malformed response). Default public
`/chart-ai` behavior is unchanged. Live KIS remains disabled. No deploy, no push.

## 2. Background

Phase 3FB-C connected `/chart-ai` to the existing owner-local mocked branch of
`/api/chart-ai/similarity` behind a local-hostname-plus-query-opt-in gate, with a single
click-triggered fetch and sanitized rendering. That wiring worked for the happy path but had no
explicit handling for malformed responses, slow/hung requests, repeated clicks, or stale loading
state. This phase hardens those runtime states without changing the feature's scope, its gate, or
its request/response contract. Live KIS network reachability remains externally blocked and out
of scope for this phase.

## 3. Implemented Scope

- `src/pages/chart-ai.astro` — hardened the existing owner-local mocked click handler in place:
  - **Response shape guard**: a new `isOwnerLocalMockedSuccessResponse` type guard validates
    `ok === true`, `status === 'success'`, `mode === 'owner-local-mocked'`,
    `request.source === 'mocked-provider-compatible'`, and the presence/type of
    `data.engineStatus`, `data.normalizedBarsAvailable`, `data.normalizedBarCountBucket`,
    `data.matchCountBucket`, `data.dataPolicy`, and `data.disclaimer` before any success render.
  - **Timeout/abort handling**: an `AbortController` with an 8000ms (`OWNER_LOCAL_MOCKED_TIMEOUT_MS`)
    timeout aborts the in-flight fetch; an `AbortError` renders a distinct, safe timeout message.
  - **Repeated-click / stale-state prevention**: an `ownerLocalMockedRequestInFlight` flag makes
    the click handler a no-op while a request is already running; the button is disabled during
    loading and always re-enabled in a `finally` block, so the panel can never get stuck loading.
  - **Retry-ready state**: after any completion (success, error, timeout, or malformed response)
    the button label becomes "다시 실행" ("run again").
  - **Accessibility**: the result container is marked `aria-busy="true"` while loading and the
    attribute is cleared in `finally`; it keeps its existing `aria-live="polite"` region; it is
    made programmatically focusable (`tabIndex = -1`) for lightweight focus handling.
  - **Safe rendering preserved**: all response-derived values continue to be assigned via
    `textContent`/DOM node construction; no `innerHTML` is used anywhere in this panel, and no raw
    thrown error or raw response JSON is ever rendered — only static Korean copy for every
    non-success outcome.
  - Added one scoped `aria-busy` opacity CSS rule alongside the existing panel styles.
- `scripts/check_phase_3fb_d_chart_ai_owner_local_mocked_ui_runtime_polish_contract.mjs` — new
  67-assertion static contract checker, added as
  `npm run check:phase-3fb-d-chart-ai-owner-local-mocked-ui-runtime-polish` in `package.json`.
  Inspects `chart-ai.astro` as raw text — no build, no dev server, no browser.
- No change to `src/pages/api/chart-ai/similarity.ts` or any other API route: no request/response
  contract mismatch was found during inspection, so no route code was touched.
- No change to `src/lib/server/providers/**`, `src/lib/server/chartSimilarity/**`,
  `src/lib/chartSimilarity/**`, or `src/data/chartSimilarity/**`.
- The gate (local hostname + `?ownerLocalMocked=1`), the request body contract, and the set of
  rendered/omitted fields from Phase 3FB-C are all unchanged.

## 4. Runtime Contract

- **Hidden by default**: unchanged — the panel stays hidden unless both gate conditions are true.
- **Visible only on local + query opt-in**: unchanged — `localhost`/`127.0.0.1`/`::1` AND
  `?ownerLocalMocked=1`.
- **No auto-run**: unchanged — the fetch only happens inside the button's `click` handler.
- **Explicit click only**: unchanged — one button, now additionally guarded by an in-flight flag.
- **Single endpoint**: unchanged — only `POST /api/chart-ai/similarity`.
- **Timeout behavior**: if no response arrives within 8000ms, the request is aborted and a safe
  "요청 시간이 초과되었습니다. 다시 실행 버튼으로 재시도해 주세요." message is shown.
- **Retry-ready behavior**: after every completion the button is re-enabled and labeled "다시
  실행"; clicking it starts a fresh, independent request.
- **Malformed response behavior**: if `response.json()` throws or the parsed body does not pass
  the shape guard, the panel shows the same safe static feature-disabled/error message used for a
  non-success response — never a partial render, never raw JSON.
- **Non-success response behavior**: unchanged in outcome (safe static message), now reached via
  the shape guard rather than an ad hoc field check.

## 5. Safe Rendering

- **Rendered fields**: `status`, `mode`, `request.source`, `data.engineStatus`,
  `data.normalizedBarsAvailable`, `data.normalizedBarCountBucket`, `data.matchCountBucket`,
  `data.dataPolicy` (five boolean flags), `data.disclaimer` — unchanged from Phase 3FB-C.
- **Omitted fields**: raw provider payload, OHLC values, prices, volume, real timestamps, raw
  matches array, similarity scores, forward returns, credentials, env values, tokens,
  account/trading/order/balance fields — unchanged.
- **No raw errors**: catch blocks only ever call `showOwnerLocalMockedMessage` with a fixed static
  string; no thrown error object, its `.message`, or `String(error)` is ever passed to the DOM.
- **No raw JSON**: the parsed response is only ever passed to `renderOwnerLocalMockedSuccess`
  after passing the shape guard, and that function only reads the specific sanitized fields above
  — the raw object is never serialized into the DOM.
- **No response-derived HTML injection**: the panel does not use `innerHTML` anywhere; all
  response-derived text uses `textContent` or `document.createElement` + `textContent`.

## 6. Boundary Preservation

- API route (`src/pages/api/chart-ai/similarity.ts`) unchanged — confirmed no request/response
  contract mismatch, so no route code was modified.
- KIS provider source (`src/lib/server/providers/**`) unchanged.
- Deterministic engine source (`src/lib/chartSimilarity/**`) unchanged.
- No public/beta execution enabled; the gate remains local-hostname + query opt-in only.
- No real auth runtime, usage storage, DB/cache runtime, SQL, or migration added.
- No account/trading/order/balance API called.
- No dependency or lockfile change.
- No deployment, no push.
- No raw KIS/OHLC/volume/timestamp/credential/env value appears anywhere in the new code.

## 7. Validation

- `npm run check:phase-3fb-d-chart-ai-owner-local-mocked-ui-runtime-polish` — `PASS (67/67
  assertions passed)`.
- `npm run check:phase-3fb-c-chart-ai-ui-owner-local-mocked-api-execution-wiring` — `PASS
  (49/49 assertions passed)`, confirming no regression to the Phase 3FB-C gate/contract.
- `npm run smoke:phase-3fb-b-owner-local-mocked-similarity-api-route-integration` — `PASS
  (36/36 assertions passed)`.
- `npm run smoke:phase-3fb-a-provider-compatible-ohlc-to-similarity-engine-integration` — `PASS
  (35/35 assertions passed)`.
- `npm run build` — passed.
- `git diff --check` — no diff errors.
- Forbidden-path diff against `src/pages/api src/lib/server/providers
  src/lib/server/chartSimilarity src/lib/chartSimilarity src/data/chartSimilarity` (relative to
  `db28b7a`) — no output.
- Changed-files diff (relative to `db28b7a`) — limited to the 5 allowed files.
- Live KIS smoke was not re-run. No network diagnostic was run.

## 8. Manual Review

For the owner to run locally (not performed by Claude Code in this session):

1. Run `npm run dev`.
2. Open `http://localhost:4321/chart-ai?ownerLocalMocked=1`.
   - Expected: panel visible; clicking "Owner-local mocked 실행" shows a loading state, then a
     sanitized success result; the button becomes "다시 실행" and can be clicked again
     immediately for a fresh request; no raw JSON, raw error, live KIS data, OHLC values, volume,
     timestamps, scores, returns, credentials, env values, or account/trading/balance fields ever
     appear.
3. Open `http://localhost:4321/chart-ai` (no query opt-in).
   - Expected: panel remains hidden; default UI unchanged.

Do not deploy this for review.

## 9. Implementation Implication

The owner-local mocked UI path is now safer for local runtime review: it cannot get stuck in a
loading state, cannot silently render a malformed or unexpected response, and cannot fire
duplicate concurrent requests from repeated clicks. Live KIS remains separately blocked by
external network reachability, unrelated to this phase. The next phase can proceed either to a
real auth/usage runtime bridge for the similarity route, or to a manual QA and productization
boundary review of this same mocked path — both without requiring live KIS.

## 10. Recommended Next Phase

Phase 3FB-C-ALT — Auth/Usage Runtime Bridge for Similarity Route, No Live KIS.

Alternative: Phase 3FB-E — Chart AI Owner-local Mocked Manual QA and Productization Boundary
Review, Live KIS Off.
