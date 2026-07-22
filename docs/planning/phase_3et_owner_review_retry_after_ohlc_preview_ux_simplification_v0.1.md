# Phase 3ET-OWNER-REVIEW-RETRY — Owner Local Review Retry after OHLC Preview UX Simplification

## 1. Status

Prepared — owner visual/runtime review retry pending.

## 2. Background

- Phase 3ET wired Chart AI owner-local OHLC preview.
- The initial owner review found the main chart-left OHLC preview controls too technical and
  visually unnecessary.
- Phase 3ET-HF1 simplified the UI by moving the OHLC preview control into the right-side
  "KIS 로컬 프리뷰" sidebar card and simplifying the copy.
- This phase prepares the owner review retry only.

## 3. Review Scope

The owner must verify:

1. Default /chart-ai behavior
   - Open /chart-ai without source=owner-local.
   - Confirm sample chart still renders.
   - Confirm no OHLC request is auto-triggered.
   - Confirm the sidebar OHLC preview button remains disabled.

2. Main chart area simplification
   - Confirm the main chart panel no longer shows the OHLC preview button, tag, or long guide
     text that were previously located chart-left.
   - Confirm the main chart area stays focused on title/selected symbol, period controls, the
     chart itself, and a concise chart status line.

3. Owner-local sidebar controls
   - Open /chart-ai?source=owner-local.
   - Confirm the right-side "KIS 로컬 프리뷰" card shows two buttons side by side:
     "KIS 시세 프리뷰 확인" and "KIS 차트 프리뷰 확인".
   - Confirm both buttons are enabled.
   - Confirm the sample chart is still shown before either button is clicked.

4. OHLC preview success path
   - Click "KIS 차트 프리뷰 확인".
   - Confirm the chart updates from owner-local OHLC data.
   - Confirm the sidebar shows "KIS OHLC 차트가 반영되었습니다." and the tag
     "지연 시세 · KIS OHLC · KRW".
   - Confirm no raw response, secret, stack trace, or request header appears on screen.
   - Confirm there are no actual OHLC values shown outside the chart visualization unless
     intentionally part of the chart rendering.

5. Chart status after OHLC preview
   - Confirm the main chart status line shows "지연 시세 · KIS OHLC · KRW" / "오너 로컬 전용"
     after a successful OHLC preview.
   - Confirm the sample-state chart status shows "샘플 OHLC·거래량 데이터" / "실제 시세 아님"
     before any preview click and after a reset.

6. Period behavior
   - After a successful preview, click 1일 / 1주 / 1개월 / 3개월 / 1년.
   - Confirm changing period resets the chart to sample.
   - Confirm another explicit preview click is required to fetch OHLC again.
   - Confirm no auto-fetch occurs on period change.

7. Symbol behavior
   - Select another supported Korean symbol, for example 000660 or 069500 if available.
   - Confirm selected-symbol change resets the chart to sample.
   - Confirm another explicit preview click is required.
   - Confirm unsupported or unavailable cases fall back safely.

8. Failure/fallback behavior
   - Temporarily test a blocked condition if feasible without exposing secrets:
     - open /chart-ai without source=owner-local;
     - or remove only the query flag, not secrets;
     - or test US symbol if UI allows it.
   - Confirm blocked/unavailable state keeps or restores the sample chart.
   - Confirm a safe Korean message appears in the sidebar card.
   - Confirm no raw server error, provider payload, or stack trace appears.

9. Quote preview preservation
   - Confirm the existing KIS 로컬 프리뷰 quote card still behaves as before under its renamed
     button "KIS 시세 프리뷰 확인".
   - Confirm the OHLC preview UX simplification did not break quote preview.

Also verify layout/theme/mobile:

- Check desktop layout.
- Check 390px mobile width if practical.
- Check light/dark theme if practical.
- Confirm chart, sidebar buttons, status, and fallback messages remain readable, and the two
  sidebar buttons wrap cleanly on narrow widths.

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
Do not paste KIS_APP_KEY, KIS_APP_SECRET, access token, raw provider response, request headers,
browser storage, screenshots containing sensitive data, or actual OHLC price values into chat.

## 5. PASS Criteria

PASS only if all are true:

- Default /chart-ai remains sample/mocked and performs no OHLC live fetch.
- The main chart area no longer shows the old chart-left OHLC preview button, tag, or guide.
- /chart-ai?source=owner-local enables both sidebar buttons ("KIS 시세 프리뷰 확인" and
  "KIS 차트 프리뷰 확인").
- OHLC preview requires an explicit click.
- A successful preview renders a chart from owner-local OHLC data.
- The chart remains readable.
- Chart status copy clearly indicates the owner-local delayed KIS OHLC state after a successful
  preview, and the sample state before/after reset.
- Period change resets to sample and does not auto-fetch.
- Symbol change resets to sample and does not auto-fetch.
- Failure/blocked states fall back to the sample chart with a safe message.
- Existing quote preview remains functional.
- No raw response, secret, header, stack trace, or actual OHLC values are exposed outside the
  allowed chart rendering.
- Mobile/basic responsive layout is not broken, and the sidebar buttons wrap cleanly.
- Public production boundary remains conceptually intact.

## 6. FAIL Routing

If owner reports failure, route as follows:

- Button disabled even with source=owner-local:
  Phase 3ET-HF2 — Owner-Local OHLC Preview Gate/UI Enablement Fix

- API blocked despite all flags present:
  Phase 3ET-HF3 — Owner-Local OHLC Preview Route/Gate Fix

- Provider unavailable or intermittent:
  Phase 3ET-HF4 — KIS OHLC Preview Provider Availability/Fallback Fix

- Chart renders incorrectly or unreadably:
  Phase 3ET-HF5 — OHLC Chart Rendering/Geometry Fix

- Period or symbol reset behavior broken:
  Phase 3ET-HF6 — OHLC Preview State Reset Fix

- Quote preview regressed:
  Phase 3ET-HF7 — Quote Preview Regression Fix

- Mobile/theme layout broken:
  Phase 3ET-HF8 — OHLC Preview Responsive/Layout Fix

- Raw response, secret, stack trace, or unsafe output appears:
  Phase 3ET-HF9 — Critical Safety Regression Fix

- Main chart still shows old technical OHLC control/guide:
  Phase 3ET-HF1A — Remove Remaining OHLC Preview Technical Copy

- Sidebar button layout looks broken or unclear:
  Phase 3ET-HF1B — KIS Local Preview Sidebar Layout Fix

- Everything passes:
  Phase 3ET-OWNER-REVIEW-CLOSEOUT — Close out owner review as PASS

## 7. Owner Response Template

Ask the owner to return only this template after manual review:

```
Phase 3ET Owner Review Retry Result

Decision:
PASS / FAIL / INCONCLUSIVE

Environment:
- URL reviewed:
- Browser:
- Desktop/mobile:
- source=owner-local used: yes/no

Checklist:
1. Default /chart-ai sample behavior: PASS / FAIL / N/A
2. Main chart simplification: PASS / FAIL / N/A
3. Sidebar quote/chart button layout: PASS / FAIL / N/A
4. Explicit-click OHLC preview success: PASS / FAIL / N/A
5. Chart status after OHLC preview: PASS / FAIL / N/A
6. Chart readability after OHLC preview: PASS / FAIL / N/A
7. Period reset behavior: PASS / FAIL / N/A
8. Symbol reset behavior: PASS / FAIL / N/A
9. Blocked/unavailable fallback: PASS / FAIL / N/A
10. Quote preview preserved: PASS / FAIL / N/A
11. No unsafe output: PASS / FAIL / N/A
12. Mobile/theme layout: PASS / FAIL / N/A

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
- No Chart AI UI change in this phase.
- No API route change in this phase.
- No KIS provider/adapter change in this phase.
- No live KIS call by Codex.
- No dev server launched by Codex.
- No browser opened by Codex.
- No Playwright or Puppeteer used.
- No `.env` read.
- No actual OHLC values recorded.
- No raw response recorded.
- No secrets recorded.
- No account/trading APIs used or called.
- No public OHLC API change.
- No Supabase/SQL/migration change.
- No Vercel changes.
- No dependency added; no deployment; no push.

## 9. Validation

- `npm run check:phase-3et-owner-review-retry-after-ohlc-preview-ux-simplification`: PASS (44/44).
- `npm run check:phase-3et-hf1-owner-local-ohlc-preview-control-ux-simplification`: PASS (46/46).
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
- `git diff --check`: PASS (informational CRLF warnings only, exit code 0).
- `npm run guard:production-mobile-geometry`: DRY_RUN; no browser and no network.

Known unrelated failures observed but not run/fixed in this phase (documented from Phase A and
prior phases; see §10):

- `check:kis-quote-adapter-mocked`: `100/101` — pre-existing, unrelated to this phase.
- `check:phase-3et-owner-review-chart-ai-ohlc-preview`: `37/38` — pre-existing open-ended diff
  checker fragility, unrelated to this phase's own scope.
- `check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring`: `61/62` — pre-existing literal-string
  checker fragility from Phase 3ET-HF1's requested copy change, unrelated to this phase's own scope.
- `check:phase-3es-owner-local-kis-ohlc-smoke-closeout`: `37/38` — pre-existing open-ended diff
  checker fragility, unrelated to this phase's own scope.
- `check:phase-3es-owner-local-kis-ohlc-smoke`: `68/70` — pre-existing open-ended diff checker
  fragility, unrelated to this phase's own scope.

## 10. Known Legacy Checker Notes

- `check:kis-quote-adapter-mocked` — `100/101`. The failing check is "Valuation route (when
  present) is fixture-only — no live source", failing because `src/pages/api/portfolio/valuation.ts`
  contains the `source=live` string. That file is unrelated to and untouched by this phase.
- `check:phase-3et-owner-review-chart-ai-ohlc-preview` — `37/38`. Pre-existing open-ended diff
  checker fragility: it pins only a starting commit with no ending commit and asserts "no src
  runtime files changed" since that commit; Phase 3ET-HF1's legitimate `src/pages/chart-ai.astro`
  edit trips that assumption. Unrelated to and not caused by this phase.
- `check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring` — `61/62`. Check #37 does a literal
  string match on the pre-HF1 tag text `지연 시세 · 오너 로컬 OHLC · KRW`, which Phase 3ET-HF1
  intentionally replaced with the simplified `지연 시세 · KIS OHLC · KRW` per the owner's
  copy-simplification request. Unrelated to and not caused by this phase.
- `check:phase-3es-owner-local-kis-ohlc-smoke-closeout` — `37/38`. Same open-ended diff checker
  fragility class, unrelated to this phase's own scope.
- `check:phase-3es-owner-local-kis-ohlc-smoke` — `68/70`. Same open-ended diff checker fragility
  class, unrelated to this phase's own scope.
- Older open-ended diff checkers (for example `check:phase-3eq-kis-chart-ohlc-feasibility-plan`,
  `check:phase-3ep-owner-review-closeout`) remain pre-existing and unrelated to this phase.

## 11. Recommended Next Step

Recommended:
Owner performs manual local review retry using the template.

If PASS:
Phase 3ET-OWNER-REVIEW-CLOSEOUT — Close out Chart AI OHLC Preview Owner Review

If FAIL:
Route to the relevant Phase 3ET-HF* hotfix listed above.

Alternative:
Phase 3EN-HF1 — Legacy KIS Checker Cleanup
