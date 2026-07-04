# Phase 3EX-E — Similarity Result UI Owner Review and Polish Result

## 1. Status

Implemented — `/chart-ai` sidebar and chart-lower analysis layout restructured per owner review
feedback. No API route, real auth, usage storage, DB/cache, or live KIS execution was added or
changed.

## 2. Background

- Phase 3EX-D integrated a mocked "유사 패턴 분석" (similar pattern analysis) result UI into
  `/chart-ai`, using the deterministic chart similarity engine run against synthetic fixture data
  only.
- Phases 3EY-A through 3EY-D built a server-only planning/contract track (KIS OHLC provider
  foundation, mocked adapter contract, auth/usage guard foundation, sanitized mocked API response
  contract) with no API route, real auth, usage storage, live KIS call, or UI change.
- The owner reviewed the `/chart-ai` UI from Phase 3EX-D and reported that the "유사 패턴 분석
  보기" and "MK AI" sidebar controls felt awkward, that the two controls had inconsistent visual
  treatment (a white card versus a standalone button), and that the similarity and MK AI content
  should share one chart-lower area with tab-style switching instead of one long vertical stack.
  The owner also asked for the "MK AI" button label to become "MK AI 분석 보기".

## 3. Implemented Scope

- **Sidebar cleanup** (`src/pages/chart-ai.astro`): removed the `chartAiSimilarityCard` section
  (including the `chartAiSimilarityViewBtn` button) and the standalone `chartAiMkAiBtn` button
  from `<aside class="chart-stock-sidebar">`. The sidebar now ends with a short passive note,
  `chart-sidebar-analysis-note`: "분석 결과는 차트 하단의 차트 분석 영역에서 확인할 수 있습니다."
  The sidebar retains only 종목 개요 and the `chartAiQuotePreview` KIS 연결 프리뷰 panel.
- **Chart analysis workspace**: introduced `#chartAiAnalysisWorkspace`
  (`class="chart-analysis-workspace"`), positioned below the existing chart/sidebar grid, with:
  - a header (`chart-analysis-header`) showing the eyebrow "차트 분석" and heading "차트 기반 분석
    결과";
  - an accessible tablist (`role="tablist"`) with two `role="tab"` buttons —
    `chartAiSimilarityTab` ("유사 패턴 분석 보기", default `aria-selected="true"`, `tabindex="0"`)
    and `chartAiMkAiTab` ("MK AI 분석 보기", `aria-selected="false"`, `tabindex="-1"`) — each using
    `type="button"`, `aria-controls`, and a shared `.chart-analysis-tab` class for visual
    consistency;
  - two `role="tabpanel"` panels, `chartAiSimilarityPanel` (visible by default) and
    `chartAiMkAiPanel` (`hidden` by default), each `aria-labelledby` its corresponding tab.
- **Content relocation, not rewrite**: the similarity result content (현재 패턴 요약, 유사 구간
  Top 5 table, 기준일 100 정규화 오버레이, 사후 성과 요약, 데이터 한계 / 투자 유의) was kept in
  `chartAiSimilarityPanel` with its original headings and disclaimer chips ("샘플 데이터", "실제
  KIS 데이터 아님", "매수·매도 추천 또는 투자자문이 아님") unchanged. The MK AI interpretation
  content (MK AI 해석, 요약, 핵심 해석, 시나리오 점검, 분석 근거, 확인 체크리스트, 리스크
  체크리스트, 데이터 한계, readiness notes) was moved out of its former nested position inside the
  similarity panel into the new top-level `chartAiMkAiPanel`, with all text content preserved
  verbatim.
- **JavaScript**: replaced the old MK AI button click handler (`aria-expanded`/`hidden`/scroll
  toggle) and the old similarity-view scroll-into-view handler with a single
  `activateAnalysisTab('similarity' | 'mk-ai')` function that toggles `.active`,
  `aria-selected`, `tabindex`, and `hidden` on the two tabs/panels via local DOM APIs only — no
  `fetch`, no storage, no network, no new dependency. Removed the now-dead `mkAiButton`/`mkAiNote`
  DOM lookups that referenced the deleted sidebar button.
- **CSS**: removed `.chart-mk-ai-button`, `.chart-sidebar-mk-ai`, `.chart-similarity-card`/
  `-status`/`-guide`/`small`, `.chart-similarity-view-btn`, and the old card-style
  `.chart-similarity-panel` rule. Added `.chart-sidebar-analysis-note`,
  `.chart-analysis-workspace`, `.chart-analysis-header`/`-guide`, `.chart-analysis-tabs`,
  `.chart-analysis-tab`/`.active`, `.chart-analysis-panel`, and shared
  `.chart-similarity-panel-heading`/`.chart-mk-ai-panel-heading` rules. Renamed
  `.chart-similarity-mkai-intro` to `.chart-mk-ai-intro` to match the relocated markup, folded the
  orphaned `.chart-similarity-mkai-section .chart-mk-ai-note` scoped rule's `display: grid; gap:
  1rem;` into the base `.chart-mk-ai-note` rule, updated the shared focus-visible selector list and
  the `prefers-reduced-motion` transition-disabling list to reference `.chart-analysis-tab` instead
  of the removed `.chart-mk-ai-button`, and added a mobile rule inside the existing
  `@media (max-width: 640px)` block so `.chart-analysis-tabs` stacks vertically with each
  `.chart-analysis-tab` at `flex: 1 1 auto`. The existing chart/sidebar stretch fix
  (`align-items: start` / `align-self: start`) was left untouched.

## 4. UI Decision

- Both analysis entry points are now visually identical buttons in one shared tablist, resolving
  the "inconsistent UI treatment" feedback.
- The sidebar is now limited to compact status/metadata (종목 개요, KIS 연결 프리뷰) plus a short
  passive note, per the owner's direction to remove primary analysis controls from the sidebar.
- Similarity and MK AI content live in one "차트 분석" workspace and swap via tabs; only the active
  tab's panel is visible at a time (`hidden` on the inactive panel), reducing total page height
  compared to the previous always-stacked layout.
- The "MK AI" label was renamed to "MK AI 분석 보기" everywhere it appears as a control label.

## 5. Preserved Boundaries

- No `/api/chart-ai/similarity` or any other API route was added.
- No KIS call made anywhere in this phase.
- No import of `src/lib/server/providers/kis/**`, `kisClient`, or any server-only provider module.
- No real auth, no Supabase auth import, no external auth provider import.
- No usage storage, no DB/cache runtime, no SQL/migration.
- No external AI API call.
- No dependency or devDependency added.
- No `.env`/`process.env` read.
- No `source=live`/`source=auto` literal produced anywhere in the page.
- No account/trading/order/balance API referenced.
- No raw KIS response field or secret-looking value introduced.
- The owner-local KIS preview gating (`source=owner-local` param, disabled-by-default preview
  buttons) is unchanged.
- All required sample/mocked disclaimers and data-limitation/investment-caution copy for both the
  similarity and MK AI panels are preserved verbatim.
- No deployment performed. No `git push` performed.

## 6. Validation

The full required validation suite (static checker for this phase, the established Phase 3EY-D /
3EY-C / 3EX-C / 3EW-C / 3EW-B / 3EW-A / 3EV-B / 3EV-A checkers, `check:provider-boundaries`,
`check:kis-runtime-guard`, `check:kis-error-fallback`, `check:production-domain`, `npm run build`,
and `git diff --check`) was run in the specified order. `npm run build` completed successfully,
confirming the restructured `chart-ai.astro` page compiles cleanly with no unused-declaration or
type errors after the `mkAiButton`/`mkAiNote` cleanup. See the final phase report for the itemized
pass/fail list of every command.

## 7. Known Non-gating Notes

- `check:phase-3ex-a-*` (if present) is not gating for this phase unless separately repaired.
- `check:phase-3ex-d-similarity-result-ui-mocked-integration-*` may assert the pre-3EX-E sidebar
  card/button placement or the old "MK AI" label; if it fails solely for that reason, it was
  updated narrowly to accept the new tab-based UI without weakening any safety assertion.
- `check:phase-3ey-a-*`/`check:phase-3ey-b-*` may carry historical allowed-changed-path assertions
  that do not account for later phases; this is a pre-existing condition unrelated to this phase's
  scope and was not modified here.
- Any stale Phase 3EY-D doc-count mismatch was left unmodified, since it is out of this phase's
  scope and was not required for this phase's own validation to pass.

## 8. Recommended Next Phase

- **Recommended**: Phase 3EZ-A — Real Auth Integration Design for Similarity Execution.
- **Alternative**: Phase 3EY-D-HF1 — narrow doc-count hotfix, only if required by a failing
  pre-existing checker unrelated to this phase's own validation.
