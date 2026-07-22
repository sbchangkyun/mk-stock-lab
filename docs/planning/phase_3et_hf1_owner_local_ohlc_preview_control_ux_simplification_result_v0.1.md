# Phase 3ET-HF1 — Owner-Local OHLC Preview Control UX Simplification Result

## 1. Status

Implemented — owner-local OHLC preview control UX simplified.

## 2. Background

- Phase 3ET wired Chart AI owner-local OHLC preview.
- Phase 3ET-OWNER-REVIEW closed out with the feature working end-to-end.
- During that owner visual review, the chart-left controls were flagged as too technical and visually
  unnecessary for the main chart area.

## 3. Owner Feedback

- The owner visually reviewed `/chart-ai?source=owner-local` and found the chart-left control area
  too technical and visually unnecessary.
- Specifically flagged: the "KIS OHLC 프리뷰 확인" button, the "지연 시세 · 오너 로컬 OHLC · KRW" tag,
  and the guide text "오너 로컬 OHLC 프리뷰가 활성화되었습니다. 버튼을 눌러 선택 종목의 OHLC 데이터를
  확인하세요." sitting directly inside the main chart panel.
- The chart update itself worked correctly; only placement and copy needed simplifying.

## 4. Implemented Changes

1. Removed the OHLC preview button row, tag, and guide paragraph from the main chart panel
   (`src/pages/chart-ai.astro`), leaving the main chart area focused on title/selected symbol,
   period controls, chart, and a concise chart status line.
2. Moved the OHLC preview control into the existing right-side "KIS 로컬 프리뷰" sidebar card,
   alongside the existing quote preview control, inside a new `.chart-preview-actions` two-button
   row.
3. Combined the sidebar card guide copy into a single sentence covering both controls:
   "오너 로컬 환경에서만 지연 시세와 OHLC 차트 프리뷰를 확인할 수 있습니다."
4. Renamed button labels to be less technical: "KIS 프리뷰 확인" → "KIS 시세 프리뷰 확인" (quote),
   "KIS OHLC 프리뷰 확인" → "KIS 차트 프리뷰 확인" (chart/OHLC).
5. Replaced the sidebar OHLC tag text "지연 시세 · 오너 로컬 OHLC · KRW" with the simplified
   "지연 시세 · KIS OHLC · KRW", and replaced the success/blocked/unavailable messages with the
   product-facing copy: "KIS OHLC 차트가 반영되었습니다.", "오너 로컬 환경에서만 사용할 수 있습니다.",
   "KIS OHLC 데이터를 일시적으로 불러올 수 없습니다. 샘플 차트를 유지합니다."
6. Added a `setChartStatus()` helper so the main chart panel's concise status line
   (`chartAiChartStatus` / `chartAiChartStatusStrong`) automatically shows "샘플 OHLC·거래량 데이터" /
   "실제 시세 아님" for the sample chart, and "지연 시세 · KIS OHLC · KRW" / "오너 로컬 전용" once an
   OHLC preview has been successfully applied.
7. Updated the CSS: removed the now-orphaned `.chart-ohlc-preview-row` / `.chart-ohlc-preview-guide`
   rules, added `.chart-preview-actions` (flex-wrap two-button row), and resized
   `.chart-ohlc-preview-btn` / `.chart-quote-preview-btn` to match each other so the two sidebar
   buttons look consistent on desktop and wrap cleanly on mobile.

## 5. Behavior After HF1

1. Default `/chart-ai` still renders the sample chart and performs no OHLC fetch of any kind.
2. `/chart-ai?source=owner-local` enables both sidebar buttons; the OHLC preview still requires an
   explicit click — no auto-fetch.
3. A successful OHLC preview updates the chart, sets the concise "지연 시세 · KIS OHLC · KRW" /
   "오너 로컬 전용" chart status, and shows "KIS OHLC 차트가 반영되었습니다." plus the OHLC tag in the
   sidebar card.
4. Period change and symbol change both reset the OHLC preview state and re-render the sample chart,
   exactly as before.
5. Blocked/unavailable/malformed/insufficient responses fall back to the sample chart with a safe
   Korean message in the sidebar card — never a raw error, provider payload, or stack trace.
6. The existing KIS quote preview control is untouched in behavior (only its button label changed)
   and now sits next to the OHLC control in the same sidebar card.

## 6. Safety

Confirmed for this phase:

- No change to the owner-local OHLC preview API route's gate logic.
- No change to the owner-local gate evaluation (`evaluateKisOwnerLocalGate`).
- `source=owner-local`, `preview=ohlc`, localhost-only, and the three env flags remain required.
- No `source=live` introduced.
- No `source=auto` introduced.
- No new public (non-owner-local) OHLC API route added.
- No live KIS call made by Codex during this phase.
- No dev server launched by Codex.
- No browser opened by Codex.
- No `.env` read.
- No actual OHLC values recorded in this document or the checker.
- No raw KIS response fields or secrets recorded.
- No account/trading/order/balance API usage or `KIS_ACCOUNT_NO` introduced.
- No Supabase/SQL/migration, Vercel, or dependency changes; no deployment; no push.

## 7. Validation

- `npm run check:phase-3et-hf1-owner-local-ohlc-preview-control-ux-simplification`: PASS (46/46).
- `npm run check:phase-3et-owner-review-chart-ai-ohlc-preview`: FAIL (37/38) — expected. This checker
  pins a starting commit with no ending commit and asserts "no src runtime files changed" since that
  commit; this phase's own genuine, requested edit to `src/pages/chart-ai.astro` trips that assumption.
  Same pre-existing open-ended diff checker fragility class as the two smoke checkers below, newly
  observed on this checker because this is the first phase after it to touch a `src/` file. See §8.
- `npm run check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring`: FAIL (61/62) — expected. Check
  #37 asserts the literal old tag text `지연 시세 · 오너 로컬 OHLC · KRW`, which this phase intentionally
  replaced with the simplified `지연 시세 · KIS OHLC · KRW` per the owner's copy-simplification request.
  See §8.
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
- `npm run guard:production-mobile-geometry`: DRY_RUN; no browser and no network.

## 8. Known Legacy Checker Notes

- `check:phase-3et-owner-review-chart-ai-ohlc-preview` — `37/38`, expected regression caused by this
  phase's own genuine, requested scope. The failing check is "No src runtime files changed in this
  phase" — that checker pins only a starting commit with no ending commit, so any later phase's
  legitimate `src/` change trips its "no runtime change since owner-review-prep" assumption. This is
  the same open-ended diff checker fragility class already documented for the Phase 3ES smoke and
  smoke-closeout checkers, now also observed on this checker because HF1 is the first phase since it
  landed to touch a `src/` file.
- `check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring` — `61/62`, expected regression caused by
  this phase's own genuine, requested scope. Check #37 does a literal string match on the pre-HF1 tag
  text `지연 시세 · 오너 로컬 OHLC · KRW`. This phase replaced that text with the owner-requested
  simplified copy `지연 시세 · KIS OHLC · KRW`. This is an intentional, documented consequence of the
  copy-simplification request, not a defect and not something hidden or gamed via a duplicate/invisible
  string.
- `check:kis-quote-adapter-mocked` — `100/101`. The failing check is "Valuation route (when present)
  is fixture-only — no live source", failing because `src/pages/api/portfolio/valuation.ts` contains
  the `source=live` string. That file is unrelated to and untouched by this phase.
- `check:phase-3es-owner-local-kis-ohlc-smoke-closeout` — `37/38`. Pre-existing open-ended diff
  checker fragility: it pins only a starting commit with no ending commit, so later phases' legitimate
  `src/` changes trip its "no runtime file changed" assumption. Unrelated to this phase's own scope.
- `check:phase-3es-owner-local-kis-ohlc-smoke` — `68/70`. Same open-ended diff issue, tripped by
  Phase 3ET's already-committed `src/pages/api/chart-ai/owner-local-ohlc-preview.ts` addition, not by
  this phase.

## 9. Recommended Next Phase

Recommended:
Phase 3ET-OWNER-REVIEW-RETRY — Owner Local Review Retry after OHLC Preview UX Simplification.

Alternative:
Phase 3EN-HF1 — Legacy KIS Checker Cleanup.

Rationale: the owner's specific UX feedback has been addressed (button/tag/guide moved out of the
main chart area and copy simplified) while preserving the full owner-local gated OHLC preview
behavior, so the natural next step is a short owner re-review of the same `/chart-ai?source=owner-local`
flow to confirm the simplified layout reads well before closing the phase out. The legacy checker
cleanup remains a valid, lower-priority alternative unrelated to this phase's own scope.
