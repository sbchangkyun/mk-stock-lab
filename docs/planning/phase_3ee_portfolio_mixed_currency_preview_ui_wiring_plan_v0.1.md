# Phase 3EE - Portfolio Mixed-Currency Preview UI Wiring Plan

## 1. Status

Planned - Portfolio mixed-currency preview UI wiring plan completed; no runtime changes.

## 2. Background

- Phase 3EB implemented the strictly gated mixed-currency owner-preview API using mocked FX.
- Phase 3EC prepared the owner-run local smoke script, runbook, and sanitized result template.
- Phase 3ED recorded the owner active smoke PASS.
- The smoke confirmed HTTP 200, contract PASS, `mixedCurrencyPreview=true`, `mockedFx=true`, `fxSource=mocked`, `fxStaleState=sample`, provider-leakage PASS, and final result PASS.
- The observed result was `rowCount=2`, `unavailableRows=2`, `unsupportedCurrencyRows=0`, `missingQuoteRows=2`, and `aggregateState=null`.
- Unavailable rows and the null aggregate are accepted because real US quotes and real FX provider integration remain outside scope.
- Public production remains fixture-only.
- `source=auto` remains deferred.
- Real FX provider integration remains blocked pending explicit provider decisions.

## 3. Existing Portfolio UI Baseline

Static inspection of `src/pages/portfolio.astro` confirms the following baseline.

### 3.1 Activation and request behavior

- `isOwnerPreviewActive()` checks `window.location.hostname` and allows only `localhost` or `127.0.0.1` with `previewMode=owner` (`portfolio.astro:540-545`).
- `isLivePreviewEligible()` currently allows only one non-aggregate KRW portfolio with 1-10 positions, where every position is KR market/KRW currency and has valid symbol, buy price, and quantity (`portfolio.astro:546-561`).
- Eligible owner preview sends `source=live`, `previewMode=owner`, `allowLiveQuotes=true`, `baseCurrency=KRW`, and positions (`portfolio.astro:593-639`). It does not yet send `allowMockedFx` or `fxMode`.
- All other requests continue through the fixture request shape (`source=fixture`). This is the normal public/default path.
- The request is posted to the relative `/api/portfolio/valuation` route. There is no production owner-preview toggle or environment-variable UI toggle.

### 3.2 Response and state behavior

- UI state distinguishes fixture/live source and owner preview, but has no distinct mixed mocked-FX state or normalized FX metadata fields (`portfolio.astro:241-286`).
- The current live contract validator assumes KR-only metadata: `quoteSource=live`, `liveAttempted=true`, and `rawProviderStored=false` (`portfolio.astro:667-686`). Phase 3EB mixed preview instead reports `quoteSource=live-kr-only` or `unavailable`, plus `mixedCurrencyPreview`, `fxSource`, `fxStaleState`, and `unsupportedCurrencySymbols`; Phase 3EF must validate the correct branch-specific contract.
- Missing and unsupported symbol arrays are stored, but `unsupportedCurrencySymbols`, mocked-FX state, and aggregate availability are not yet represented explicitly.
- The UI parses normalized valuation rows only. It does not intentionally render provider metadata.

### 3.3 Freshness, unavailable rows, and aggregates

- Existing freshness concepts are fresh/query-time, stale-but-usable/recent-query, and unavailable/data-temporarily-unavailable (`portfolio.astro:562-569`).
- Owner-live unavailable rows render dashes for current price, market value, percentage P&L, and P&L, while keeping the row visible and showing a stale-state badge (`portfolio.astro:1167-1187`).
- In owner-live mode, KPI total market value becomes null if any row is unavailable or lacks market value; it does not use cost basis as a fallback (`portfolio.astro:1242-1256`). P&L is also withheld when that total is null (`portfolio.astro:1266-1282`).
- Fixture mode retains its existing cost-basis fallback behavior. Phase 3EF must not change that public/default behavior.
- The table currently contains a public column label equivalent to “current price.” Phase 3EF should not globally rename fixture copy, but mixed preview must add adjacent preview/sample labeling so unavailable or mocked data is never claimed as current market data.

### 3.4 Mobile and public safety baseline

- The route uses `.portfolio-mvp` and `.portfolio-dashboard` as shrink-safe shells.
- `.portfolio-bookmark-tabs` owns local horizontal scrolling for portfolio selection.
- `.positions-list-wrap` owns horizontal scrolling for category headers and holdings rows.
- Sheet panels use viewport-relative widths, including the narrower mobile rule.
- Phase 3DX prohibits fixed-width route roots, holdings rows outside the local wrapper, and body-level overflow suppression as the only fix.
- The hostname gate prevents owner preview on canonical production. Public production continues through fixture behavior.

Static evidence is sufficient for this plan. Phase 3EF must still review the state type block, `isOwnerPreviewActive()`, `isLivePreviewEligible()`, `loadValuation()`, live response contract validation, row rendering, KPI rendering, and the corresponding rules in `src/styles/style.css` before editing.

## 4. UI Activation Contract

The future mixed-currency preview UI must use an explicit local-only activation such as:

```text
http://localhost:4321/portfolio?previewMode=owner&fxPreview=mocked
```

Required policy:

- Permit activation only when hostname is exactly `localhost` or `127.0.0.1`.
- Require `previewMode=owner`.
- Require `fxPreview=mocked` or an equivalent explicit mocked-FX query value.
- Do not infer mocked FX merely because USD positions exist.
- Do not display owner-preview controls or labels on canonical production.
- Do not add a production-accessible toggle.
- Do not enable `source=auto`.
- Do not alter fixture default behavior.
- Preserve the existing KR-only owner preview when only `previewMode=owner` is present and KR-only eligibility succeeds.

Exact query names may be finalized in Phase 3EF, but activation must remain explicit, local-only, and independently gated from the existing KR-only owner preview.

## 5. API Request Mapping

When the local mixed mocked-FX activation is valid, the UI must call the existing Phase 3EB gate with:

```json
{
  "source": "live",
  "previewMode": "owner",
  "allowLiveQuotes": true,
  "allowMockedFx": true,
  "fxMode": "mocked",
  "baseCurrency": "KRW"
}
```

The existing normalized position array is appended to that request.

Additional rules:

- Use this shape only in local owner-preview mode.
- Keep the KR-only request shape unchanged when mixed mocked-FX activation is absent.
- Do not log or render the request body.
- Do not echo the response body into UI debug panels.
- Do not add production or environment-variable UI toggles.
- Do not use `source=auto`.
- Validate mixed response metadata separately: `mixedCurrencyPreview=true`, `fxSource=mocked`, `fxStaleState=sample`, safe row-count arrays, and the expected conservative aggregate state.

## 6. UI State Model

| State | Meaning | UI behavior |
| --- | --- | --- |
| `fixture` | Normal public/default path | Preserve current behavior and copy. |
| `owner-kr-live-preview` | Existing KR-only owner preview | Preserve current activation, request, and freshness behavior. |
| `owner-mixed-mocked-fx-preview` | Mixed KRW/USD owner preview using mocked FX | Local-only; show explicit owner-preview and mocked/sample FX labels. |
| `unavailable` | Quote or usable FX data is unavailable | Keep row visible, show unavailable state, withhold affected aggregate values. |
| `blocked` | Production host, invalid query gate, invalid request, or unsupported mode | Do not activate or show owner mixed preview; remain fixture/default or show a safe local-only block state. |

Phase 3EF should introduce one explicit discriminant for these modes rather than relying on multiple loosely related booleans. Mixed-preview metadata should be stored only as safe normalized fields.

## 7. Label and Copy Policy

Allowed concepts:

- owner preview
- mocked FX
- sample FX
- sample valuation
- data unavailable
- preview only
- not production data

Proposed Korean product copy for the future local-only UI:

- `오너 미리보기`
- `샘플 환율`
- `Mocked FX`
- `평가 불가`
- `데이터 일시 불가`
- `미리보기 전용`
- `실제 시세 아님`

Forbidden labels and claims:

- `real-time`
- `realtime`
- `실시간`
- `현재 시세`
- `실시간 시세`
- `live FX`
- `current FX`
- `actual market value`

Mocked FX must never be described as live, current, real-time, actual, or production-ready. Existing public fixture labels should remain unchanged; Phase 3EF should scope preview copy to the explicit owner mixed-preview state.

## 8. Row and Aggregate Display Policy

The Phase 3ED observed contract is:

```text
rowCount=2
unavailableRows=2
unsupportedCurrencyRows=0
missingQuoteRows=2
aggregateState=null
```

Required future UI behavior:

- Keep both rows visible and show an explicit row-level unavailable state.
- Do not calculate aggregate market value from cost basis.
- Do not show aggregate P&L or return when aggregate state is null.
- Show a neutral unavailable/sample explanation rather than an alarming provider error for this expected preview state.
- Distinguish missing quote rows from unsupported currency rows. A missing quote is not an unsupported currency.
- Preserve symbols and position identity while withholding unavailable financial values.
- Preserve fixture row and KPI behavior outside owner preview.
- Do not silently substitute fixture quotes into a failed owner-preview request.
- Do not treat `unavailableRows=2` as a failed UI contract when the metadata and aggregate-null behavior match the Phase 3ED result.

## 9. Metadata and Leakage Policy

The future UI must not expose, persist in UI state, or render:

- provider metadata;
- raw KIS fields;
- raw FX provider fields;
- request or response bodies;
- headers;
- tokens or account numbers;
- API URLs;
- stack traces;
- environment values.

The UI may use only safe normalized fields:

- `source`;
- `previewMode`;
- `mixedCurrencyPreview`;
- `mockedFx`/`sampleFx`;
- `fxSource`;
- `fxStaleState`;
- row counts and missing/unsupported counts;
- aggregate availability state.

Do not add a debug drawer, raw JSON viewer, provider badge containing internal identifiers, or console logging of request/response objects.

## 10. Mobile and Layout Constraints

Phase 3EF must preserve Phase 3DX constraints:

- Keep `.portfolio-mvp` and `.portfolio-dashboard` shrink-safe and within the route shell.
- Keep `.portfolio-bookmark-tabs` and `.positions-list-wrap` as local horizontal-scroll owners.
- Keep dense holdings rows inside `.positions-list-wrap`.
- Do not add fixed-width preview banners, status panels, or metadata tables.
- Preview banners/badges must wrap or stack safely at 390px.
- Keep sheet widths viewport-relative and preserve mobile form stacking.
- Do not widen `html`, `body`, `.site-main`, or the Portfolio route shell.
- Preserve mobile zoom and viewport usability.
- Run `npm run check:mobile-baseline` and the Phase 3DX checker for any UI change.
- Run `npm run guard:production-mobile-geometry` in dry-run mode during implementation.
- Run production geometry only after a future authorized deployment if public UI changes are made.

## 11. Owner Visual Review Scope

The later owner review should be limited to PASS/FAIL for:

1. Local owner mixed-preview activation.
2. Clear owner-preview banner or badge.
3. Mocked FX/sample label.
4. USD row unavailable display.
5. Aggregate null/unavailable display with no fabricated P&L.
6. No real-time/current-price wording in the preview state.
7. Mobile 390px layout without document-level overflow.
8. Fixture default unaffected when preview query parameters are absent.
9. Production preview blocked.

Codex should prepare a focused checklist and result template in Phase 3EG so the owner only returns PASS/FAIL. Screenshots are not required unless the owner voluntarily provides one.

## 12. Future Implementation Phase Scope

Recommended implementation phase:

```text
Phase 3EF - Portfolio Mixed-Currency Preview UI Implementation
```

Scope:

- implement explicit local-only mixed-preview activation;
- call the existing Phase 3EB gate only in owner preview;
- add safe owner-preview and mocked/sample FX labels;
- render unavailable rows and aggregate-null state clearly;
- add branch-specific response validation and safe metadata state;
- preserve fixture default and KR-only owner preview;
- preserve production blocking;
- no real FX provider or US quote provider;
- no live FX calls, `source=auto`, deployment, or public enablement.

## 13. Future Owner Review Phase

Recommended review phase:

```text
Phase 3EG - Owner Local Mixed-Currency Preview UI Review
```

Scope:

- Codex prepares the review runbook and result template.
- The owner visually reviews only the local UI.
- The owner shares PASS/FAIL only.
- No screenshots are required unless voluntarily provided.
- No prices, response body, server logs, or environment values are shared.

## 14. Validation Plan for Phase 3EF

```bash
npm run check:phase-3ef-mixed-currency-preview-ui
npm run check:phase-3eb-mixed-currency-owner-preview-api
npm run check:phase-3ed-owner-mixed-currency-smoke-closeout
npm run check:phase-3dx-ui-architecture-plan
npm run check:mobile-baseline
npm run check:portfolio-live-preview-api
npm run check:production-domain
npm run build
git diff --check
npm run guard:production-mobile-geometry
```

Do not run active owner smoke in Phase 3EF unless a separate task explicitly authorizes it.

## 15. Final Recommendation

Recommended next phase: Phase 3EF - Portfolio Mixed-Currency Preview UI Implementation.

Alternative: Phase 3EA-HF1 - Owner FX Provider Decision Closeout, if the owner wants to select a real FX provider before UI work.
