# Phase 3FB-C — Chart AI UI Owner-local Mocked API Execution Wiring Result

## 1. Status

Implemented. `/chart-ai` now has a local-only, explicit opt-in owner-local mocked execution
control that calls the existing owner-local mocked branch of `/api/chart-ai/similarity` (Phase
3FB-B) and renders only sanitized, bucketed response fields. Default public `/chart-ai` behavior
is unchanged. Live KIS remains disabled. No deploy, no push.

## 2. Background

Phase 3FB-A connected provider-compatible mocked OHLC to the deterministic similarity engine.
Phase 3FB-B wired that integration into the real `/api/chart-ai/similarity` API route as an
owner-local mocked-only branch, while default route behavior stayed `feature_disabled`. Live KIS
network reachability remains externally blocked, so this phase continues forward-looking
implementation by wiring the `/chart-ai` UI to call the existing mocked route branch, for local
development verification only.

## 3. Implemented Scope

- `src/pages/chart-ai.astro` — added a local-only, hidden-by-default panel
  (`id="chartAiOwnerLocalMockedPanel"`) inside the Chart AI analysis workspace, gated by both a
  local hostname check (`localhost` / `127.0.0.1` / `::1`) and an explicit
  `?ownerLocalMocked=1` URL query opt-in. The panel contains one explicit button
  (`chartAiOwnerLocalMockedRunBtn`); clicking it calls `POST /api/chart-ai/similarity` with the
  exact owner-local-mocked request body and renders only sanitized, bucketed response fields into
  `chartAiOwnerLocalMockedResult`. No auto-run on page load. Minimal scoped CSS was added
  alongside the existing panel styles; no existing styles, layout, navigation, or other panels
  were changed.
- `scripts/check_phase_3fb_c_chart_ai_ui_owner_local_mocked_api_execution_wiring_contract.mjs` —
  new 49-assertion static contract checker, added as
  `npm run check:phase-3fb-c-chart-ai-ui-owner-local-mocked-api-execution-wiring` in
  `package.json`. Inspects `chart-ai.astro` as raw text — no build, no dev server, no browser.
- No change to `src/pages/api/chart-ai/similarity.ts` or any other API route: source inspection
  confirmed the existing Phase 3FB-B request/response contract already matched what this phase
  needed, so no route contract mismatch was found and no route code was touched.
- No change to `src/lib/server/providers/**`, `src/lib/chartSimilarity/**`, or
  `src/data/chartSimilarity/**`.

## 4. UI Contract

- **Hidden by default**: the panel is `hidden` in the static markup and stays hidden unless both
  gate conditions are true in the browser.
- **Visibility gate**: `window.location.hostname` is `localhost`, `127.0.0.1`, or `::1` **and**
  the URL query string contains `ownerLocalMocked=1`. If either condition is false, the panel
  stays hidden and no fetch is made.
- **No auto-run**: the API call only happens inside the button's `click` event listener; there is
  no call on page load.
- **Explicit click only**: one button, `Owner-local mocked 실행`.
- **Single endpoint**: calls only `POST /api/chart-ai/similarity` — no other endpoint, no KIS
  provider call, no external service call.
- **Request body**: `{ mode: "owner-local-mocked", source: "mocked-provider-compatible",
  ownerLocalMocked: true, symbol: <selectedSymbol or "MOCKSYM"> }`.
- **Mocked/sample only**: the panel text states this is local-development-only, mocked/sample
  data, not real KIS data, and precedes real auth/usage/live-quote integration.

## 5. Response Rendering

- **Rendered fields**: `status`, `mode`, `request.source`, `data.engineStatus`,
  `data.normalizedBarsAvailable`, `data.normalizedBarCountBucket`, `data.matchCountBucket`,
  `data.dataPolicy` (all five boolean flags), `data.disclaimer`.
- **Intentionally not rendered**: raw provider payload, OHLC values, prices, volume, real
  timestamps, raw matches array, similarity scores, forward returns, credentials, env values,
  tokens, account/trading/order/balance fields.
- **Loading state**: button is disabled and shows `불러오는 중…`; the result area shows the same
  message while the request is in flight.
- **Success state**: renders the sanitized summary list, data-policy list, and disclaimer text
  described above.
- **Error / feature-disabled / network-error states**: render one safe, static Korean message
  only (`Owner-local mocked 실행 결과를 불러오지 못했습니다...`); no raw thrown error, stack
  trace, or response body is ever rendered directly.

## 6. Boundary Preservation

- `src/pages/api/chart-ai/similarity.ts` was inspected but not modified — no request/response
  contract mismatch was found, so no route code change was needed or made.
- `src/lib/server/providers/**` (including the KIS provider), `src/lib/chartSimilarity/**`, and
  `src/data/chartSimilarity/**` are all unchanged — confirmed by an empty
  `git diff --name-only da3eb47` against those paths.
- No live KIS call, no network diagnostic.
- No real auth runtime, usage storage, DB/cache runtime, SQL, or migration was added.
- No account/trading/order/balance API was called.
- No dependency or lockfile change.
- No deployment, no push.
- Existing `/chart-ai` public behavior (search, sample chart, existing similarity/MK AI tab
  interaction, existing disclaimers, layout, mobile behavior) is unchanged for every visitor who
  does not meet both gate conditions.
- No raw KIS/OHLC/volume/timestamp/credential/env value appears anywhere in the new code.

## 7. Validation

- `npm run check:phase-3fb-c-chart-ai-ui-owner-local-mocked-api-execution-wiring` — `PASS
  (49/49 assertions passed)`.
- `npm run smoke:phase-3fb-b-owner-local-mocked-similarity-api-route-integration` — `PASS
  (36/36 assertions passed)`, confirming no regression to the Phase 3FB-B route.
- `npm run smoke:phase-3fb-a-provider-compatible-ohlc-to-similarity-engine-integration` — `PASS
  (35/35 assertions passed)`, confirming no regression to the Phase 3FB-A integration layer.
- `npm run build` — passed.
- `git diff --check` — no whitespace errors (only a benign LF/CRLF line-ending notice from git,
  not a diff error).
- `git diff --name-only da3eb47 -- src/pages/api src/lib/server/providers src/lib/chartSimilarity src/data/chartSimilarity`
  — no output (no forbidden-path change).
- `git diff --name-only da3eb47` — limited to `package.json` and `src/pages/chart-ai.astro`
  (modified), plus the new checker script (untracked/new).
- Live KIS smoke was not re-run. No network diagnostic was run.

## 8. Implementation Implication

The full local UI-to-engine mocked execution chain (`/chart-ai` local panel → `POST
/api/chart-ai/similarity` → owner-local mocked branch → Phase 3FB-A provider-compatible
integration → deterministic similarity engine → sanitized bucketed response → UI display) is now
testable end to end without any dependency on live KIS reachability, and without any change to
default public UI behavior. Live KIS network reachability remains a separate, externally blocked
track. The next phase can either harden this owner-local mocked UI path (loading/error-state
polish) or begin the real auth/usage runtime bridge needed before any public execution can be
considered.

## 9. Recommended Next Phase

Phase 3FB-D — Chart AI Owner-local Mocked UI Runtime Polish and Failure-state Hardening, Live KIS
Off. Alternative: Phase 3FB-C-ALT — Auth/Usage Runtime Bridge for Similarity Route, No Live KIS.
