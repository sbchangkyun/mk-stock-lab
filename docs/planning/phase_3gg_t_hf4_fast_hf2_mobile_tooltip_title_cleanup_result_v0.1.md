# Phase 3GG-T-HF4-FAST-HF2 — Mobile Tooltip Refinement + Duplicate Title Cleanup — Result v0.1

## 1. Baseline

- Project path: `C:\Users\kkama\OneDrive\문서\Project\mk-stock-lab`
- Branch: `rebuild/phase-1-ia-shell`
- Starting HEAD: `3be57c3` (`Phase 3GG-T-HF4-FAST-HF1: clean up mobile chart interaction`)
- Pre-hotfix Production deployment: `dpl_6GWfz1EgwxSTC6wKoveFW8kfZgYN` at `https://mkstocklab.vercel.app`
- Confirmed matching before implementation began; no checkout/reset/stash/rebase performed.

## 2. Prior Owner QA result (HF4-FAST-HF1)

A. Loading message removal: PASS
B. OHLCV strip spacing: PASS
C. Mobile tooltip size/transparency: **FAIL**
D. Outside-tap reset: PASS
E. Desktop hover/keyboard: PASS
F. Market Intelligence removal: PASS
G. Samsung/AAPL Similar Pattern and MK AI: PASS
H. Additional KIS token issuance pushes: 0

Remaining defects addressed this phase: DEFECT-1 (tooltip too large), DEFECT-2 (tooltip too opaque),
DEFECT-3 (one-label-per-row vertical layout), DEFECT-4 (duplicate Similar Pattern title), DEFECT-5
(duplicate MK AI title).

## 3. Mobile tooltip problem and fix

Prior mobile `.chart-tooltip` used a 165px max-width, the fully-opaque `--chart-shell-overlay` background,
and the same one-label-per-row `<dl>` markup as desktop. This phase:

- Shrinks max-width to 140px (within the 130-145px target band), width/height auto (no minimum height),
  padding 6px 7px, font-size 10.5px, line-height 1.25, restrained 6px border radius.
- Introduces a dedicated `--chart-tooltip-mobile-surface` custom property (light 72% alpha, dark 74% alpha)
  instead of reusing the opaque shared overlay variable, with backdrop blur reduced from 6px to 4px.
- Preserves all existing positioning/interaction behavior (clamping, edge flipping, `pointer-events: none`,
  desktop pointerleave reset, mobile outside-tap reset, keyboard Escape/Arrow navigation, latest-candle
  restoration) — none of that logic was touched.

## 4. Compact mobile content layout

The tooltip JS builder (`selectChartCandle`) now constructs both a `detailedHtml` (desktop, unchanged `<dl>`
structure: 날짜/시/고/저/종/변동) and a `compactHtml` (mobile) string in the same render call, wrapped as
`<div class="chart-tooltip-detailed">...</div><div class="chart-tooltip-compact">...</div>`. CSS toggles
visibility: desktop shows `.chart-tooltip-detailed` by default; the `@media (max-width: 640px)` block hides
it and shows `.chart-tooltip-compact`. No interaction state or request logic is duplicated — both variants
come from one function call per candle selection.

Compact price tooltip: date once as a `<p class="chart-tooltip-compact-date">` heading (no separate 날짜
label), then a two-column CSS grid (`grid-template-columns: 1fr 1fr`) with 시/고 on one row and 저/종 on the
next, followed by change amount and percent as the final row. Compact volume tooltip: date heading + a
single concise `거래량 N주` line, with the turnover estimate preserved as a secondary line when present.

## 5. Transparency adjustment

- Light mode: `--chart-tooltip-mobile-surface: rgb(255 255 255 / 72%)`
- Dark mode: `--chart-tooltip-mobile-surface: rgb(13 23 40 / 74%)`
- Backdrop blur reduced to 4px (previously 6px against a fully-opaque background).
- Scoped locally to the Chart AI tooltip; no global panel background changed.

## 6. Duplicate title removal

- Removed `<h2 id="chart-similarity-panel-heading">유사 패턴 분석</h2>` from the Similar Pattern panel's
  Production markup branch. The `id` moved to the existing `<p class="eyebrow">` element so no
  `aria-labelledby` reference breaks (none referenced this particular id, but the pattern was applied
  consistently).
- Removed `<h3 id="chart-mk-ai-heading">MK AI 해석</h3>` from the MK AI panel. The `id` moved to the
  `<p class="eyebrow">MK AI</p>` element; the existing `aria-labelledby="chart-mk-ai-heading"` reference in
  the non-production/sample code path (`chartAiMkAiNote`) continues to resolve correctly.
- Both headings were removed from rendered markup, not CSS-hidden, per spec.
- The non-production/sample-only Similar Pattern heading ("유사 패턴 분석 결과" — different text, not an
  exact duplicate) was left untouched, matching the narrow scope of this phase.

## 7. Preserved labels, tabs, and executions

- Small blue eyebrow labels: "유사 패턴 분석" and "MK AI" — both remain, now carrying the moved heading ids.
- Tab labels: "유사 패턴 분석 보기" and "MK AI 분석 보기" — both remain unchanged.
- Both analyses still execute through the shared HF3A `selected-symbol-integrity` guard
  (`integrity.beginAnalysis('similar-pattern')` / `integrity.beginAnalysis('mk-ai')`), unchanged this phase.
- The shared `.chart-similarity-panel-heading, .chart-mk-ai-panel-heading { display: grid; gap: 0.5rem; }`
  container rule required no edit — vertical spacing collapses automatically when the grid child (the
  removed heading) is gone.

## 7a. Sibling checker reconciliation (narrow)

Only the HF4-FAST-HF1 smoke/checker required reconciliation: their mobile-tooltip font-size/padding/
background assertions now tolerate either the HF1 (165px/0.7-0.73rem/`--chart-shell-overlay`) or HF2
(140px/10.5px/6px 7px/`--chart-tooltip-mobile-surface`) generation of values, since HF2 intentionally
supersedes those exact figures as an approved visual refinement. Separately, a pre-existing
`String.replace` (single-occurrence) bug in the turnover bare-label check was fixed to `replaceAll`, since
a second correctly-labeled "추정 거래대금" string now legitimately exists in the new compact mobile view.
No other sibling checkers required changes.

## 8. Regression scope

Explicitly re-verified unaffected by this phase: initial no-active-symbol state, pending-selection-only
search flow, explicit chart load requirement, analysis-disabled-before-chart-success gating, active-chart
guard for both analyses, stale chart/analysis response protection, Samsung→AAPL reset, loading panel
READY-state collapse, OHLCV strip padding, desktop pointerleave reset, keyboard navigation, Korean
red-up/blue-down candle convention, current-price dashed line, Market Intelligence absence from Chart AI
(backend route + engine untouched), durable KIS token reuse, zero automatic provider requests on entry, and
no hidden Samsung default.

## 9. Local test results

- `node scripts/smoke_phase_3gg_t_hf4_fast_hf2_mobile_tooltip_title_cleanup.mjs` — 44/44 PASS
- `node scripts/check_phase_3gg_t_hf4_fast_hf2_contract.mjs` — 85/85 PASS
- Focused regression gates (Section 15 list): HF4-FAST-HF1 smoke/checker, HF4-FAST checker, HF3A
  smoke/checker, T-HF1 checker, Q-FAST checker, R-FAST checker, updated T-FAST checker — all PASS
  (see the Regression Results section of the Owner Checkpoint report delivered alongside this doc).
- `npx astro build` — PASS (`[build] Complete!`)
- `git diff --check` — clean, no whitespace errors

## 10. Implementation commit

- Commit message: `Phase 3GG-T-HF4-FAST-HF2: refine mobile tooltip and remove duplicate titles`
- Files changed: `src/pages/chart-ai.astro`,
  `scripts/smoke_phase_3gg_t_hf4_fast_hf2_mobile_tooltip_title_cleanup.mjs`,
  `scripts/check_phase_3gg_t_hf4_fast_hf2_contract.mjs`, `package.json`,
  `docs/planning/planning_changelog.md`, this result document.
- No push performed (`GIT_PUSH_AUTHORIZED: NO`).

## 11. Production deployment

- Deployed via `vercel deploy --prod --yes` only (no local `vercel build`).
- Deployment metadata (id, READY state, alias, deployed commit hash) recorded in the Owner Checkpoint
  report delivered alongside this commit — no environment values printed.

## 12. Safe unauthenticated Production regression

Performed after deployment: `GET /chart-ai` → 200; the five protected Chart AI API routes → sanitized 401
with no stack trace or secret; no provider/KIS work triggered by unauthenticated entry; deployed page HTML
contains no Market Intelligence UI and no hidden Samsung default; deployed CSS contains the mobile tooltip
max-width ≤145px and the new translucent mobile surface variable; deployed HTML no longer contains the two
duplicate large heading elements.

## 13. Owner QA — pending

Owner Checkpoint delivered per spec Section 19; final classification
`PASS_SELECTED_SYMBOL_INTEGRITY_AND_CHART_FOUNDATION_PRODUCTION_VERIFIED` is **not** assigned until the
Owner reports all checkpoint items PASS in a future turn.
