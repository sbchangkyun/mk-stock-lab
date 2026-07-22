# Phase 3ET-OWNER-REVIEW — Owner Local Review of Chart AI OHLC Preview

## 1. Status

Prepared — owner visual/runtime review pending.

## 2. Background

- Phase 3ET wired Chart AI owner-local OHLC preview.
- Phase 3ES owner-local OHLC smoke PASSed.
- The preview is owner-local only.
- Public production remains mocked/sample.
- This phase prepares manual owner review only.

## 3. Review Scope

The owner must verify:

1. Default /chart-ai behavior
   - Open /chart-ai without source=owner-local.
   - Confirm sample chart still renders.
   - Confirm KIS OHLC preview button is disabled.
   - Confirm no OHLC request is auto-triggered.

2. Owner-local page state
   - Open /chart-ai?source=owner-local.
   - Confirm KIS OHLC preview button is enabled.
   - Confirm existing KIS quote preview still works or remains available.
   - Confirm sample chart is still shown before any OHLC preview click.

3. OHLC preview success path
   - Click KIS OHLC 프리뷰 확인.
   - Confirm chart updates from owner-local OHLC data.
   - Confirm chart status/tag indicates owner-local delayed OHLC state.
   - Confirm no raw response, secret, stack trace, or request header appears on screen.
   - Confirm there are no actual OHLC values shown outside the chart visualization unless intentionally part of the chart rendering.

4. Period behavior
   - After successful preview, click 1일 / 1주 / 1개월 / 3개월 / 1년.
   - Confirm changing period resets the chart to sample.
   - Confirm another explicit preview click is required to fetch OHLC again.
   - Confirm no auto-fetch occurs on period change.

5. Symbol behavior
   - Select another supported Korean symbol, for example 000660 or 069500 if available.
   - Confirm selected-symbol change resets the chart to sample.
   - Confirm another explicit preview click is required.
   - Confirm unsupported or unavailable cases fall back safely.

6. Failure/fallback behavior
   - Temporarily test a blocked condition if feasible without exposing secrets:
     - open /chart-ai without source=owner-local;
     - or remove only the query flag, not secrets;
     - or test US symbol if UI allows it.
   - Confirm blocked/unavailable state keeps or restores the sample chart.
   - Confirm safe Korean message appears.
   - Confirm no raw server error, provider payload, or stack trace appears.

7. Quote preview preservation
   - Confirm the existing KIS 로컬 프리뷰 quote card still behaves as before.
   - Confirm OHLC preview work did not break quote preview.

8. Layout/theme/mobile
   - Check desktop layout.
   - Check 390px mobile width if practical.
   - Check light/dark theme if practical.
   - Confirm chart, button, status, and fallback messages remain readable.

## 4. Owner Local Setup

Provide command instructions WITHOUT secret values.

PowerShell:

```powershell
cd "E:\개인 프로젝트\mk-stock-lab"

$env:KIS_APP_KEY="your local value"
$env:KIS_APP_SECRET="your local value"
$env:KIS_BASE_URL="https://openapi.koreainvestment.com:9443"
$env:KIS_MODE="real"

$env:KIS_OWNER_LOCAL_SMOKE="1"
$env:KIS_ALLOW_LIVE_QUOTE="1"
$env:KIS_ENABLE_LIVE_QUOTES="true"

npm run dev
```

Review URL:

`http://localhost:4321/chart-ai?source=owner-local`

Also check default URL:

`http://localhost:4321/chart-ai`

Explicit safety instruction:
Do not paste KIS_APP_KEY, KIS_APP_SECRET, access token, raw provider response, request headers, browser storage, or actual OHLC price values into chat.

## 5. PASS Criteria

PASS only if all are true:

- Default /chart-ai remains sample/mocked and performs no OHLC live fetch.
- /chart-ai?source=owner-local enables the OHLC preview button.
- OHLC preview requires explicit click.
- Successful preview renders a chart from owner-local OHLC data.
- The chart remains readable.
- source/freshness/status copy clearly indicates owner-local delayed OHLC.
- Period change resets to sample and does not auto-fetch.
- Symbol change resets to sample and does not auto-fetch.
- Failure/blocked states fall back to sample chart with safe message.
- Existing quote preview remains functional.
- No raw response, secret, header, stack trace, or actual OHLC values are exposed outside the allowed chart rendering.
- Mobile/basic responsive layout is not broken.
- Public production boundary remains conceptually intact.

## 6. FAIL Routing

If owner reports failure, route as follows:

- Button disabled even with source=owner-local:
  Phase 3ET-HF1 — Owner-Local OHLC Preview Gate/UI Enablement Fix

- API blocked despite all flags present:
  Phase 3ET-HF2 — Owner-Local OHLC Preview Route/Gate Fix

- Provider unavailable or intermittent:
  Phase 3ET-HF3 — KIS OHLC Preview Provider Availability/Fallback Fix

- Chart renders incorrectly or unreadably:
  Phase 3ET-HF4 — OHLC Chart Rendering/Geometry Fix

- Period or symbol reset behavior broken:
  Phase 3ET-HF5 — OHLC Preview State Reset Fix

- Quote preview regressed:
  Phase 3ET-HF6 — Quote Preview Regression Fix

- Mobile/theme layout broken:
  Phase 3ET-HF7 — OHLC Preview Responsive/Layout Fix

- Raw response, secret, stack trace, or unsafe output appears:
  Phase 3ET-HF8 — Critical Safety Regression Fix

- Everything passes:
  Phase 3ET-OWNER-REVIEW-CLOSEOUT — Close out owner review as PASS

## 7. Owner Response Template

Ask the owner to return only this template after manual review:

```
Phase 3ET Owner Review Result

Decision:
PASS / FAIL / INCONCLUSIVE

Environment:
- URL reviewed:
- Browser:
- Desktop/mobile:
- source=owner-local used: yes/no

Checklist:
1. Default /chart-ai sample behavior: PASS / FAIL / N/A
2. Owner-local button enablement: PASS / FAIL / N/A
3. Explicit-click OHLC preview success: PASS / FAIL / N/A
4. Chart readability after OHLC preview: PASS / FAIL / N/A
5. Period reset behavior: PASS / FAIL / N/A
6. Symbol reset behavior: PASS / FAIL / N/A
7. Blocked/unavailable fallback: PASS / FAIL / N/A
8. Quote preview preserved: PASS / FAIL / N/A
9. No unsafe output: PASS / FAIL / N/A
10. Mobile/theme layout: PASS / FAIL / N/A

Sanitized notes:
- Do not include actual OHLC values.
- Do not include raw KIS responses.
- Do not include secrets.
- Do not include request headers.
- Do not include screenshots unless specifically requested later.

Observed issue summary:
- If FAIL or INCONCLUSIVE, describe visible UI behavior only.
```

## 8. Safety

Confirmed for this phase:

- No runtime source change in this phase.
- No live KIS call by Codex.
- No dev server launched by Codex.
- No browser opened by Codex.
- No `.env` read.
- No actual OHLC values recorded.
- No raw response.
- No secrets.
- No account/trading APIs.
- No public OHLC API change.
- No Chart AI behavior change.
- No Supabase/SQL/migration.
- No Vercel changes.
- No deployment.
- No push.

## 9. Validation

- `npm run check:phase-3et-owner-review-chart-ai-ohlc-preview`: PASS (38/38).
- `npm run check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring`: PASS (62/62).
- `npm run check:phase-3ep-chart-ai-owner-local-quote-preview-wiring`: PASS (49/49).
- `npm run check:phase-3eo-owner-local-kis-quote-smoke`: PASS (58/58).
- `npm run check:phase-3en-kis-quote-adapter-owner-local-gate`: PASS (87/87).
- `npm run check:provider-boundaries`: PASS.
- `npm run check:kis-runtime-guard`: PASS (7/7).
- `npm run check:kis-error-fallback`: PASS (48/48).
- `npm run check:chart-ai-ux-skeleton`: PASS (82/82).
- `npm run check:mobile-baseline`: PASS (74/74).
- `npm run check:production-domain`: PASS (33/33).
- `npm run build`: PASS.
- `git diff --check`: PASS.
- `npm run guard:production-mobile-geometry`: `DRY_RUN`; no browser and no network.

Known unrelated failures observed but not fixed in this phase (see §10):

- `npm run check:kis-quote-adapter-mocked`: `100/101` — pre-existing, unrelated to this phase.
- `npm run check:phase-3es-owner-local-kis-ohlc-smoke-closeout`: `37/38` — pre-existing open-ended
  diff checker fragility, unrelated to this phase's own scope.
- `npm run check:phase-3es-owner-local-kis-ohlc-smoke`: `68/70` — the failing checks are "No public
  OHLC API route added" and "No API route file changed." That checker diffs from a pinned starting
  commit (`bab2119`) with no pinned ending commit, so it now picks up Phase 3ET's already-committed
  addition of `src/pages/api/chart-ai/owner-local-ohlc-preview.ts` (commit `f44bdf3`) as a false
  violation. Same pre-existing open-ended diff checker fragility as the closeout checker above;
  unrelated to this phase's own scope and not fixed here.

## 10. Known Legacy Checker Notes

Known unrelated checker issues still present, not fixed in this phase:

- `check:kis-quote-adapter-mocked` — `100/101`. The failing check is "Valuation route (when present)
  is fixture-only — no live source", failing because `src/pages/api/portfolio/valuation.ts` contains
  the `source=live` string. That file is unrelated to and untouched by this phase.
- `check:phase-3es-owner-local-kis-ohlc-smoke-closeout` — open-ended diff issue. That checker diffs
  from a pinned starting commit with no pinned ending commit, so any later phase's `src/` changes
  trip its "no runtime file changed" assumption. This phase adds only `docs/planning`, `scripts`, and
  `package.json` files, so no `src/` runtime file is touched by this phase itself, but the checker's
  diff window still includes prior phases' `src/` changes.
- `check:phase-3es-owner-local-kis-ohlc-smoke` — same open-ended diff issue, newly observed at `68/70`
  during this phase's validation run. That checker pins `startingCommit = 'bab2119'` with no ending
  commit, so its "no public OHLC API route added" / "no API route file changed" checks now trip on
  Phase 3ET's own already-committed `src/pages/api/chart-ai/owner-local-ohlc-preview.ts` (commit
  `f44bdf3`), a legitimate, already-accepted addition from the prior phase. Not caused by this phase
  and not fixed here.
- Older checker assumptions superseded by endpoint verification (e.g.
  `check:phase-3er-kis-ohlc-contract-mocked-adapter`) or open-ended diff fragility (e.g.
  `check:phase-3eq-kis-chart-ohlc-feasibility-plan`, `check:phase-3ep-owner-review-closeout`) remain
  pre-existing and unrelated to this phase.

## 11. Recommended Next Step

Recommended:
Owner performs manual local review using the template.

If PASS:
Phase 3ET-OWNER-REVIEW-CLOSEOUT — Close out Chart AI OHLC Preview Owner Review

If FAIL:
Route to the relevant Phase 3ET-HF* hotfix listed above.

Alternative:
Phase 3EN-HF1 — Legacy KIS Checker Cleanup
