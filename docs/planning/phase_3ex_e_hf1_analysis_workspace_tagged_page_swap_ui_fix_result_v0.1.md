# Phase 3EX-E-HF1 — Analysis Workspace Tagged Page Swap UI Fix Result

## 1. Status

Implemented — `/chart-ai` analysis workspace now behaves as a real tagged page-swap interface. No backend, runtime, route, KIS, or auth change was made.

## 2. Background

Owner feedback (owner review of the Phase 3EX-E polished analysis workspace) reported that the "유사 패턴 분석 보기" and "MK AI 분석 보기" controls visually toggled active state, but the content below still read as one continuous long page instead of two clearly separated pages. This phase is a pure frontend/UI hotfix, targeting only `src/pages/chart-ai.astro`, to make the tag/page interaction feel like a real post-it/page-index page swap: click a tag and the whole content canvas swaps to a distinct page, with only one page visible at a time.

## 3. Implemented Scope

- Restructured the analysis workspace markup in `src/pages/chart-ai.astro`:
  - `#chartAiAnalysisWorkspace` now wraps a `.chart-analysis-book` element.
  - `.chart-analysis-book` contains `.chart-analysis-tags` (`role="tablist"`), holding the two tag buttons `#chartAiSimilarityTab` (`class="chart-analysis-tag active"`, `role="tab"`, `aria-selected="true"`) and `#chartAiMkAiTab` (`class="chart-analysis-tag"`, `role="tab"`, `aria-selected="false"`, `tabindex="-1"`), both with `aria-controls` pointing at their panel.
  - `.chart-analysis-book` also contains `.chart-analysis-page-canvas`, which wraps the two page sections: `#chartAiSimilarityPanel` (`class="chart-analysis-page active"`, `role="tabpanel"`, visible by default) and `#chartAiMkAiPanel` (`class="chart-analysis-page"`, `role="tabpanel"`, `hidden` by default).
- Updated the client-side tab script (`activateAnalysisTab`) so a single call toggles `active` class, `aria-selected`, `tabindex`, and the panel `hidden` attribute together for both tag and panel, keeping them in sync. Click handlers were kept on both tags; keyboard handling was added for `ArrowLeft`/`ArrowRight` (toggle to the other tag) and `Home`/`End` (jump to similarity/MK AI respectively), each moving focus to the newly active tag.
- Added post-it/page-canvas CSS: `.chart-analysis-tag` (inactive, "behind" look via `translateY(2px)` and muted surface), `.chart-analysis-tag.active` (raised, attached to the canvas via a seam-covering `::after`), `.chart-analysis-page-canvas` (single document-like surface with border/shadow/radius), `.chart-analysis-page[hidden] { display: none !important; }`, and a `chart-analysis-page-swap-enter` keyframe fade/translate under 180ms applied only to `.chart-analysis-page.active`.
- Added `prefers-reduced-motion` handling that disables both the tag transition and the page-swap animation, and a mobile (`max-width: 640px`) layout that stacks the tags into a single column without horizontal overflow.
- Added this result document, the static checker (`scripts/check_phase_3ex_e_hf1_analysis_workspace_tagged_page_swap_ui_fix_contract.mjs`), and the matching `package.json` script entry.
- Prepended the Phase 3EX-E-HF1 entry to `docs/planning/planning_changelog.md`.

## 4. UI Behavior Result

- Default state: similarity page is active and visible; MK AI page is `hidden`.
- Clicking a tag sets that tag `active`/`aria-selected="true"`/`tabindex="0"`, sets the other tag inactive/`aria-selected="false"`/`tabindex="-1"`, and toggles the `hidden` attribute on the two panels so exactly one page is visible at any time.
- `.chart-analysis-page[hidden] { display: none !important; }` guarantees the inactive page never renders even if `hidden`'s default styling is overridden elsewhere.
- The active tag is visually raised and its bottom seam is painted over by an `::after` pseudo-element so it reads as physically attached to the page canvas below; the inactive tag sits lower with a softer, muted background.
- The page-swap transition is a short (160ms) fade/translate keyframe on the newly active page only; there is no page-flip animation, no scroll-into-inactive-page behavior, and no layout jank. Under `prefers-reduced-motion: reduce`, both the tag transition and the page-swap animation are disabled.
- Keyboard support: `ArrowLeft`/`ArrowRight` switches between the two tags; `Home` selects the similarity tag; `End` selects the MK AI tab; in all cases focus moves to the newly active tag and remains visible.
- Mobile: tags stack into a single column with no horizontal overflow; the active tag remains clearly distinguished; the page canvas remains readable and internal tables continue to scroll independently.

## 5. Content Separation Result

- Confirmed (pre-existing, unaffected by this hotfix) that the similarity page contains only similarity content: 유사 패턴 분석 결과, 현재 패턴 요약, 유사 구간 Top 5, 기준일 100 정규화 오버레이, 사후 성과 요약, 데이터 한계 / 투자 유의, and the similarity-specific disclaimers.
- Confirmed the MK AI page contains only MK AI content: MK AI 해석, AI 분석 미리보기, 요약, 핵심 해석, 시나리오 점검, 분석 근거, 확인 체크리스트, 리스크 체크리스트, 데이터 한계, and the MK AI-specific disclaimers.
- Confirmed the MK AI page does not contain the Top 5 table or the normalized overlay chart, and the similarity page does not contain the MK AI panel wrapper — the two pages are structurally independent siblings inside `.chart-analysis-page-canvas`, not a single nested stack.

## 6. Preserved Boundaries

- No change to `src/pages/api/chart-ai/similarity.ts` or any other API route.
- No KIS call, no live similarity execution, no import of `src/lib/server/providers/kis/**` or `kisClient`.
- No real auth integration (no Supabase/Auth0/NextAuth/Clerk/Firebase/Passport), no usage storage implementation, no DB/cache client import.
- No cookie/header reads, no `localStorage`/`sessionStorage` use, no `.env`/`process.env` read, no external AI API call, no `source=live`/`source=auto` literal introduced, no account/trading/order/balance API reference.
- No dependency or devDependency change, no Vercel file change, no SQL/migration file, no deployment, no push.
- Existing behavior fully preserved: search input/result behavior, sample chart behavior, selected-symbol company overview, KIS preview buttons and copy, all sample/mock/investment/KIS-not-real/no-external-AI disclaimers, and the Phase 3EX-D/E chart/sidebar stretch-fix CSS.
- The exact Korean labels "유사 패턴 분석 보기" and "MK AI 분석 보기" were not renamed.

## 7. Validation

The Phase 3EX-E-HF1 static checker (97 checks) and the full established checker/smoke suite (Phase 3FA-B, 3FA-A, 3EZ-C, 3EZ-B, 3EZ-A, 3EX-E, 3EY-D + smoke, 3EY-C + smoke, 3EX-C smoke, 3EW-C, 3EW-B, 3EW-A, 3EV-B, 3EV-A, `check:provider-boundaries`, `check:kis-runtime-guard`, `check:kis-error-fallback`, `check:production-domain`) were run, followed by `npm run build` and `git diff --check`. See the final phase report for the itemized pass/fail list.

## 8. Known Non-gating Notes

- `check:phase-3ex-e-similarity-result-ui-owner-review-polish` was authored against the previous `chart-analysis-tab`/`chart-analysis-panel`/`chart-analysis-tabs` class names and indentation. Since this hotfix intentionally renames those classes to `chart-analysis-tag`/`chart-analysis-page`/`chart-analysis-tags` (kept) as part of fixing the reported UI bug, that older checker is expected to report new failures. Per phase instructions, it was left unmodified and is treated as non-gating for this phase; the new Phase 3EX-E-HF1 checker is the gating contract going forward.
- Other historical phase checkers with their own fixed allowed-changed-path lists may continue to show their previously known non-gating "allowed changed files" failures, unrelated to this phase's markup.

## 9. Recommended Next Phase

- **Recommended**: Phase 3FA-C — Owner-local KIS Similarity Smoke Harness, Disabled by Default.
- **Alternative**: Phase 3EX-E-HF2 — further analysis workspace UI polish, if owner review of this hotfix surfaces additional interaction feedback.
