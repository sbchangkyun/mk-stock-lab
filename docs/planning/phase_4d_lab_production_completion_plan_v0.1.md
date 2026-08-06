# Phase 4D — Lab Production Completion — Plan v0.1

**Planning status**: `PHASE_4D_LAB_PRODUCTION_COMPLETION_PLAN_READY_IMPLEMENTATION_NOT_STARTED`

## §1 Exact baseline and branch

- **Repository**: `E:\개인 프로젝트\mk-stock-lab`
- **Baseline commit**: `7da540dbadaa0a5acafb9a74aec7d9fb9cfc93f8` — confirmed identical across local `HEAD`,
  `origin/main`, and `origin/feature/phase-4d-lab-production-completion` at the start of this task (no
  mismatch).
- **Branch**: `feature/phase-4d-lab-production-completion`, already created from the baseline commit and
  already tracking the matching origin branch.
- This document is itself the only work product of this task. No application code has been changed.

## §2 Objective

Phase 4D is a **truthfulness / accessibility / responsive-layout / interaction-quality / reliability
completion pass** over the existing Lab page group (`/lab` and its detail pages), following the same method
and scope discipline as Phase 4A (Home/Common Shell), Phase 4B (Market), and Phase 4C (Chart AI). It is
explicitly:

- **Not** a real-data integration phase for asset-class/sector returns, Congress stock disclosures, or NPS
  holdings.
- **Not** an NPS data project or a public-official wealth-disclosure data project.
- **Not** a provider change, a new API phase, or a new Supabase-backed feature.
- **Not** a redesign from scratch — the existing card grid, matrix component, and detail-page shell are the
  starting point.
- **Not** an authentication or persistence phase — the existing best-effort resume-state call is audited for
  regression risk only.
- **Not** an investment-analysis engine phase.

The existing example-data and future-module honesty boundaries (already present and correct in every Lab
page) must remain honest and explicit throughout.

## §3 Existing Lab architecture

Confirmed by direct read of every file in this section (not assumed from naming).

- **`src/pages/lab.astro`** (138 lines) — Lab landing page. Renders 4 cards: 자산군 수익률 비교
  (`/lab/asset-class-returns`), S&P 500 섹터별 수익률 (`/lab/sp500-sectors`), 국회의원 보유 주식
  (`/lab/congress-stocks`, "연동 예정"), 국민연금 보유 현황 (`/lab/nps-holdings`, "연동 예정"). Each card
  has an explicit example-data or pending badge and a decorative `aria-hidden` mini-matrix preview (color
  swatches only, no text — but non-semantic/decorative, so this does not currently violate the
  no-color-alone-meaning principle). A bottom `<script>` performs best-effort resume-state persistence via
  `userRetentionApi.updatePreferences({ lastSurface: 'lab' })`, wrapped in try/catch, explicitly documented
  as "must never affect the Lab page itself" on failure.
- **`src/pages/lab/asset-class-returns.astro`** (86 lines) and **`src/pages/lab/sp500-sectors.astro`**
  (86 lines) — structurally identical detail pages. Each renders: back link, header (eyebrow/H1/lead from
  `matrices.json` description/status badge "예시 데이터 · 데이터 연동 전"), an export button
  (`data-export-card`, `aria-label="이미지로 저장"`), a `<LabReturnMatrix>` instance with a `captureId`, a
  `data-policy` `<aside>` with 4 explicit example-data/non-advisory bullet points, and a 2-card "다른 Lab
  보기" related-navigation section. Bottom `<script>` wires `setupCardImageExport` on `astro:page-load` and
  immediate call (idempotent, per `exportCardImage.ts`'s own `dataset.exportReady` guard).
- **`src/pages/lab/congress-stocks.astro`** (69 lines) and **`src/pages/lab/nps-holdings.astro`** (69 lines)
  — structurally identical future-module preparation pages. Each renders: back link, header with a
  "연동 예정" pending badge, an explicit "리서치 모듈 준비 화면" section containing 3 plain
  `<div class="lab-static-preview-card">` cards (no list/article semantics — plain divs), a `data-policy`
  `<aside>` with 4 explicit non-real-data/non-advisory bullet points, and a 3-card related-navigation
  section. No matrix, no export button, no client script.
- **`src/pages/lab/nps-portfolio.astro`** (29 lines) — **an orphaned legacy page not named in the original
  audit-scope list, discovered during this audit.** It predates the Phase 3DF route split: it uses the
  generic `.grid-3`/`.panel` shell classes instead of the shared `lab-detail-shell`/`lab-data-policy`
  pattern used by every other detail page, its eyebrow reads "Phase 8 Lab 페이지" (a stale internal phase
  label, not user-facing product copy), and its lead sentence explicitly names a real external data source —
  **"OpenDART 국내 데이터"** — a real-world provider name that no other Lab page ever mentions (every other
  Lab page's honesty copy is deliberately data-source-agnostic, e.g. "공개 재산 신고 데이터", "국민연금 공시
  데이터"). It is not linked from `lab.astro` or from any other Lab page's related-navigation section, and no
  existing checker (see §4) references it. It is reachable only by a user typing its exact URL. See §5 gap 5
  and §7 requirement 8 for the planned resolution.
- **`src/components/LabReturnMatrix.astro`** (225 lines) — the shared matrix component used by the two
  return-comparison detail pages. Renders a category legend (`<span>` chips, color + text label), an
  interaction hint ("셀 또는 범례에 마우스를 올리거나 탭하면...", pointer/tap wording only, no keyboard
  mention), a ranking `<table>` (header cells are plain `<th>` with no `scope="col"`; rank cells are plain
  `<td class="lab-rank-cell">`, not `<th scope="row">`; empty cells render a bare `<td class="lab-return-cell-empty">—</td>`
  with no accessible-name treatment), and a summary `<table>`. Every ranking cell already pairs a category
  color class with a text label (`cell.label`) and a value (`cell.return`) — category identity is **already**
  conveyed through text, not color alone, at the cell level. The `captureId` prop is applied to the
  `.lab-matrix-card` wrapper, which contains the scrollable table **and** the `.lab-matrix-data-note`
  disclosure paragraph — confirmed by direct read that the exported PNG capture boundary already includes
  the example-data disclosure note. The legend chips and interaction hint sit outside `.lab-matrix-card` and
  are therefore excluded from the exported image; this is not a truthfulness gap because every captured cell
  already repeats its own category label as text. The client `<script>` IIFE implements pointer-only
  highlighting (`pointerover`/`pointerleave`/`pointerdown`/`pointerup` with a 10px drag-distance threshold to
  distinguish tap-to-pin from touch-scroll) plus a `keydown` handler that only handles `Escape` (clears a
  pinned state) — there is no keyboard path to set or cycle the highlight itself. Init is idempotent
  (`dataset.labMatrixReady` guard) and registered on both `astro:page-load` and an immediate call, so the
  existing "no duplicate init after Astro navigation" requirement is already satisfied and must be preserved.
- **`src/data/labReturnMatrices.json`** — `{ assetMatrix, sectorMatrix }`, each
  `{ title, description, note, years[7], categories[12], rankings[12], summary[12] }`. Every `note` field
  reads (asset matrix) "예시 데이터입니다. 실제 수익률이 아니며 데이터 연동 전 화면입니다. 투자 판단에 사용할
  수 없습니다." and the equivalent S&P-500-scoped wording for the sector matrix. Category IDs are consistent
  across `categories`, `rankings[].cells[].categoryId`, and `summary[].categoryId` (spot-checked; a full
  cross-reference is planned as an automated smoke assertion, §10).
- **`src/data/labStaticModules.json`** — **a second Lab data file not named in the original audit-scope
  list, discovered during this audit.** Contains `{ modules[4], sectorSamples[5], assetSamples[5] }`, every
  entry explicitly labeled "예시"/"정적 표시값". Referenced by the future-module preview cards' underlying
  content model (per the Phase 3DF static-module-shells checker, §4).
- **`src/lib/exportCardImage.ts`** (127 lines, confirmed `.ts`) — exports `exportCardAsPng(card, baseFilename,
  requestedExportWidth?)` and `setupCardImageExport()`. Confirmed by direct read: the export button is
  `disabled` for the duration of the capture (busy state + repeat-click protection in one mechanism), its
  `aria-label` is swapped to "이미지 저장 중" during capture and restored afterward (busy state is
  accessible-name-announced, not just visual), the `toBlob` `filter` option excludes
  `[data-card-actions], [data-export-card], [data-expand-card], [data-close-expanded-card]` elements from the
  capture (no accidental capture of hidden/interactive controls), the filename is sanitized
  (`sanitizeFilename`, lowercased, non-`[a-z0-9._-]` collapsed, 120-char cap) and date-stamped, and all
  temporary inline-style overrides are restored in a `finally` block even on error. **Confirmed gap**:
  failure feedback is a blocking `window.alert(...)`, and there is no explicit success feedback beyond the
  browser's own file-download indicator — a screen-reader user has no in-page confirmation that the export
  actually completed. **Confirmed gap**: the export always forces `backgroundColor: '#ffffff'` /
  `color: '#172033'` regardless of the page's current light/dark theme, so the exported PNG is always
  light-themed; this is a deliberate, already-consistent choice (every export looks the same regardless of
  viewer theme) rather than a theme-leak bug, but it is currently undocumented and untested.
- **`src/styles/style.css`** — Lab-specific rule blocks located (approximate ranges, confirmed present):
  landing card grid and mini-matrix preview (~340-342), the bulk of the matrix/legend/summary/detail-shell
  styling (~4615-5565), mobile-density adjustments from Phase 3DJ/3DJ-HF1 (~5875-5928, ~6098-6103). No Lab
  rule was found that conveys meaning through color alone at a functional (non-decorative) element.
- **`src/layouts/Layout.astro`** (57 lines) — shared shell (`SlideAd`/`Header`/`Ticker`/`Nav`/`main`/`Footer`)
  used unchanged by every Lab page. Dark/light theme toggling lives in `src/scripts/main.js`
  (`applyTheme()`/`toggleTheme()`, `.dark-mode` on `document.body`, wired via `#themeToggle`), not in
  `Layout.astro` itself. No Lab-specific layout override exists.
- **`package.json`** — confirmed directly: no `smoke:phase-4d-lab-production-completion` or
  `check:phase-4d-lab-production-completion` script exists yet. Existing Lab scripts are all `check:`-only —
  `check:lab-matrix-image-export`, `check:lab-matrix-hover`, `check:lab-static-modules`,
  `check:lab-return-matrix`, `check:lab-route-split` — there is no Lab `smoke:` script today. `html-to-image`
  (the sole export dependency) is already present in `dependencies`.
- **Repo-wide keyboard-handler audit**: confirmed by direct grep that no global `keydown` listener exists
  anywhere in the codebase. Every existing `keydown` listener is component-scoped
  (`LabReturnMatrix.astro`, `chart-ai.astro` ×5, `portfolio.astro`, `LiveMarketDashboard.astro` ×2). Any new
  Lab keyboard-accessibility handling must stay scoped to `LabReturnMatrix.astro`'s own root element,
  consistent with this existing pattern.

## §4 Source audit findings — existing checkers

Eight existing checker scripts read Lab source files. None of them implement a git-diff/`git status`-based
"changed file" purity assertion (confirmed by a direct grep of all eight for `ALLOWED_MODIFIED_FILES`,
`execSync`, `git diff`, and `changedFiles` — zero matches). Every "fixed file list" check found in this
codebase is a **content** assertion against a hardcoded path list, not a **VCS-state** assertion. This is
important for §11: a Lab-focused Phase 4D commit cannot trip a scope-mismatch failure through that mechanism
because it does not exist for Lab checkers.

| Checker | Origin phase | Scope |
| --- | --- | --- |
| `check_lab_route_split_static_contract.mjs` (295 lines) | 3DF-HF2 | Route-split shape: 4 detail pages exist, each imports the correct data slice / renders the correct badge. |
| `check_lab_matrix_image_export_static_contract.mjs` (231 lines) | 3DI / 3DI-HF1 | `captureId` wiring, `data-card-actions` exclusion filter, `exportCardImage.ts` contract. |
| `check_lab_return_matrix_redesign_static_contract.mjs` (377 lines) | 3DF-HF1 | `LabReturnMatrix.astro` table/legend/summary structure. |
| `check_lab_matrix_cross_year_hover_static_contract.mjs` (285 lines) | 3DF-HF4 | Pointer/hover highlighting script contract. |
| `check_lab_static_module_shells_static_contract.mjs` (355 lines) | 3DF | Congress/NPS preparation-screen copy and `labStaticModules.json` shape. |
| `check_mobile_ux_density_export_consistency_static_contract.mjs` (170 lines) | 3DJ-HF1 | Fixed-file-list mobile/export consistency safety net. |
| `check_mobile_baseline_usability_static_contract.mjs` (392 lines) | 3DJ | Fixed two-file (`style.css`, `LabReturnMatrix.astro`) mobile-baseline safety net. |
| `check_production_domain_consolidation_static_contract.mjs` (242 lines) | 3DF-HF3 | Re-reads `lab.astro`/`asset-class-returns.astro` for an unrelated domain-consolidation assertion. |

## §5 Confirmed gaps

1. **Matrix table semantics** (`LabReturnMatrix.astro`): no `scope="col"` on year `<th>` cells, rank cells
   are `<td>` not `<th scope="row">`, empty cells have no accessible-name treatment beyond a bare "—".
2. **Matrix keyboard interaction** (`LabReturnMatrix.astro`): the highlight can be set/cycled only via
   pointer events; `Escape` is the only keyboard affordance, and it can only clear, never set, a highlight.
   Cells and legend chips are not native focusable/interactive elements.
3. **Export feedback** (`exportCardImage.ts`): failure uses a blocking `window.alert`; there is no in-page
   success confirmation for assistive-technology users.
4. **Future-module card semantics** (`congress-stocks.astro`, `nps-holdings.astro`): the 3 preview cards in
   each page are plain `<div>`s with no list (`<ul>`/`<li>`) or `<article>` grouping semantics.
5. **Orphaned legacy page** (`nps-portfolio.astro`): stale shell classes, a stale internal phase label in
   user-facing copy, and the only Lab-surface mention anywhere of a real external data-source name
   ("OpenDART"), unlinked and uncovered by any checker.
6. **Interaction hint text** (`LabReturnMatrix.astro`): describes only "마우스" (mouse) and "탭" (tap)
   affordances; does not mention keyboard operation, which will become inaccurate once keyboard support is
   added.

## §6 Items inspected and found already correct

- Every landing-card and detail-page truthfulness label (example-data badges, "연동 예정" pending badges,
  data-policy asides, non-advisory bullet points) is already honest, already visible without interaction, and
  contains no fabricated real names, holdings, quantities, or disclosure records.
- Every matrix cell already conveys category identity through paired text + color, never color alone.
- The exported PNG capture boundary already includes the example-data disclosure note.
- `exportCardImage.ts` already provides a busy state (disabled + accessible-name change), repeat-click
  protection (the same `disabled` flag), sanitized filenames, and guaranteed style restoration via `finally`.
- The matrix component's client-script initialization is already idempotent across Astro page navigations
  (`dataset.labMatrixReady` guard on both `astro:page-load` and an immediate call) — no regression risk here,
  only a pattern to preserve.
- The Lab landing page's resume-state persistence call is already best-effort and fail-silent by design
  (try/catch wrapping, explicit comment stating it must never affect the page itself).
- No Lab page performs any provider/KIS/Supabase-content fetch today; the "no-provider boundary" (requirement
  11) currently holds with zero exceptions.
- No global keyboard handler exists anywhere in the codebase to collide with a new Lab-scoped one.

## §7 Planned implementation by numbered requirement

1. **Landing-page truthfulness**: no changes planned — already correct per §6; re-assert via the new checker
   (§10) so future edits cannot silently regress it.
2. **Detail-page truthfulness**: no changes planned to wording — already correct per §6; re-assert via the
   new checker. The matrix interaction hint (§5 gap 6) will be reworded to also describe keyboard operation
   once requirement 4's implementation lands, without weakening the existing example-data/non-advisory
   copy.
3. **Matrix table semantics**: add `scope="col"` to every year `<th>`, convert rank cells to
   `<th scope="row" class="lab-rank-cell">`, add a `<caption>` (visually-hideable, not currently present) to
   both the ranking and summary tables, and give the empty-cell placeholder an explicit accessible label
   (e.g. `aria-label="데이터 없음"`) instead of a bare em dash. Tables remain real `<table>` markup — no
   div-grid replacement.
4. **Matrix category highlighting**: convert legend chips and matrix cells from decorative elements to
   native `<button type="button">` elements (or add `tabindex="0"` + `role` only where a native element is
   impractical — native buttons are preferred everywhere they fit) so they are keyboard-focusable with a
   visible focus outline; wire `Enter`/`Space` activation via native button semantics (no manual key
   handling needed for native buttons); expose the pinned state via `aria-pressed`; keep `Escape` clearing
   the pinned state; keep the existing pointer/tap/drag-threshold behavior byte-for-byte unchanged; keep
   `astro:page-load` + immediate-call idempotent init; add no new global keyboard handler — all new listeners
   stay scoped to the matrix component's root element, consistent with the rest of the codebase.
5. **Horizontal scrolling**: the existing `.lab-matrix-scroll` `role="region" aria-label="... 순위 매트릭스"`
   container is already the correct pattern (a labeled, scrollable region distinct from document-level
   overflow); audit will confirm it is natively focusable (native scrollable regions with `tabindex` where
   needed) and that no page-level horizontal overflow exists at 320px. No structural change planned unless
   the audit's static-width check (§12) finds an actual overflow.
6. **Image export**: add an in-page, non-blocking success/failure status message (e.g. an `aria-live`
   region near the export button) to replace/augment the current `window.alert`-only failure path, while
   keeping every already-correct behavior in §6 unchanged. No new dependency — `html-to-image` stays the
   only export dependency.
7. **Responsive behavior**: static audit only in this phase (documented breakpoints 320/360/390/412/768/1024
   plus desktop); no site-wide shell redesign. Any concrete CSS fix identified during implementation will
   target only the Lab-specific rule ranges in `style.css` identified in §3.
8. **Future-module accessibility and honesty**: convert the 3 preview cards in `congress-stocks.astro` and
   `nps-holdings.astro` from plain `<div>`s to an `<ul>`/`<li>` list (each card is one item in a set of
   preparation-module previews — list semantics fit better than `<article>`, since the cards are not
   independently distributable content, they are members of one enumerated set). Preserve every existing
   "연동 예정" / "리서치 모듈 준비 화면" / non-real-data string unchanged. For the orphaned
   `nps-portfolio.astro` (§5 gap 5): the plan recommends **removing** the page in the implementation phase,
   since it is unlinked, uses a stale pre-route-split shell, and is the only place in the Lab surface that
   names a real external data source — all three problems disappear if analogous coverage already exists at
   `/lab/nps-holdings`, which it does. This is a recommendation for the implementation task to execute and
   verify (e.g. via a redirect or a clean route removal), not a decision made or executed by this plan-only
   task.
9. **Resume-state behavior**: audit only, no code change planned. The existing try/catch-wrapped, best-effort
   `updatePreferences` call is already correctly isolated from page rendering; the new checker will assert
   that this isolation is not weakened by any other requirement's implementation.
10. **Dark mode, contrast, and focus**: audit existing Lab CSS rule ranges (§3) for any missing dark-mode
    variant, insufficient contrast, or missing focus outline on the new focusable matrix controls introduced
    by requirement 4. Category identity will continue to be verified as available through text, not color
    alone, at both the cell level (already true) and the legend-chip level (already true — every chip
    already renders `cat.label` text).
11. **No-provider boundary**: no implementation change — this boundary already holds. The new checker
    (§10) adds a permanent automated assertion protecting it (no fetch/KIS/Supabase-content call anywhere in
    the Lab page group).
12. **Existing checker impact**: see §11.

## §8 Explicit non-goals

- No real asset-class, sector, Congress, or NPS data integration of any kind.
- No new external API, provider, or Supabase table/column/RLS policy.
- No new environment variable.
- No new dependency (image export continues to use the already-installed `html-to-image`).
- No redesign of the site-wide shell (`Layout.astro`, global nav, ticker, theme toggle) completed in Phase
  4A.
- No change to the resume-state/retention API surface, its persistence fields, or its call sites beyond
  verifying existing isolation.
- No authenticated click-through QA performed by this assistant in this or the implementation phase — that
  remains deferred to Phase 4F, per every prior phase in this lane.
- No merge, no PR, no deployment of any kind in this plan-only task.

## §9 Exact intended file scope (for the later implementation task, not this task)

- `src/pages/lab.astro` — interaction-hint copy only, if requirement 2 touches it.
- `src/pages/lab/asset-class-returns.astro`, `src/pages/lab/sp500-sectors.astro` — no structural change
  expected; possible minor copy touch if the interaction hint text is duplicated per-page rather than owned
  solely by `LabReturnMatrix.astro` (to be confirmed at implementation time — currently the hint lives only
  in the shared component).
- `src/pages/lab/congress-stocks.astro`, `src/pages/lab/nps-holdings.astro` — preview-card markup semantics
  (div → list).
- `src/pages/lab/nps-portfolio.astro` — planned removal (§7 requirement 8), pending implementation-time
  confirmation that no external link or bookmark depends on it.
- `src/components/LabReturnMatrix.astro` — table semantics, keyboard-accessible controls, interaction-hint
  copy, `aria-live` export-status region.
- `src/lib/exportCardImage.ts` — success/failure status reporting only; no dependency change.
- `src/styles/style.css` — Lab-scoped rule additions only (new focus states, new `aria-live` status styling,
  any confirmed responsive fix), never a site-wide rule change.
- `src/data/labReturnMatrices.json`, `src/data/labStaticModules.json` — no planned content change; read-only
  reference for the new smoke suite.
- New: `scripts/smoke_phase_4d_lab_production_completion.mjs`,
  `scripts/check_phase_4d_lab_production_completion_contract.mjs`, corresponding `package.json` script
  entries, and the four planning documents this task creates.
- Any of the 8 existing checkers in §4/§11, only if their hardcoded content assertions are invalidated by the
  above changes.

This task itself changes exactly the four files listed in §11 of the result-doc scope — no file in this list
is touched by this plan-only task.

## §10 New smoke/checker design

**`npm run smoke:phase-4d-lab-production-completion`** (proposed) — pure-logic/data-shape assertions against
`labReturnMatrices.json` and `labStaticModules.json` directly (no DOM, no network), covering at minimum:
- Unique category IDs within each matrix.
- Every `rankings[].cells[].categoryId` and `summary[].categoryId` references a category ID that exists in
  that matrix's `categories` array.
- Complete year coverage: every configured year in `years[]` has a corresponding cell in every ranking row
  (or an intentionally-empty cell, distinguishable from a data error).
- Valid rank structure: ranks are unique, sequential, and match the row count.
- Every matrix's `note` field contains an explicit example-data disclosure string.
- No matrix or static-module field contains a real-world provider/data-source name (reusing the existing
  project convention of asserting the absence of specific strings such as ETF쇼핑, opendart, dart.fss,
  data.go.kr, assembly.go.kr — extended to also assert the absence of "OpenDART" specifically, closing the
  gap found in `nps-portfolio.astro`).
- `labStaticModules.json` future-module entries remain data-free placeholders (every entry still labeled
  "예시"/"정적 표시값").

Exact assertion count is not decided in this plan-only task — it will be derived from the actual
implementation and finalized in the result doc, per the task's explicit instruction not to invent a total in
advance.

**`npm run check:phase-4d-lab-production-completion`** (proposed) — static source-contract assertions across
all five (or four, if `nps-portfolio.astro` is removed per §7) Lab routes, covering at minimum:
- Every landing-card and detail-page truthfulness label/badge/data-policy bullet remains present and
  unchanged in intent.
- `LabReturnMatrix.astro`'s ranking and summary tables use `scope="col"`/`scope="row"`/`<caption>` correctly.
- The matrix's category controls are keyboard-focusable native elements exposing `aria-pressed`, with no new
  global `keydown` listener added anywhere in the repo.
- The `.lab-matrix-scroll` region keeps its `role="region"` + accessible label.
- The export button's accessible name, busy-state label swap, `data-card-actions` exclusion filter, and new
  status-message mechanism are all present; the disclosure note stays inside the capture boundary.
- Documented responsive breakpoints (320/360/390/412/768/1024/desktop) are represented in `style.css` for
  every audited Lab element class.
- No `fetch(`, KIS import, or Supabase-content query exists anywhere in the Lab page group except the
  existing, unchanged best-effort retention call.
- Congress/NPS pages keep every pending-module honesty string; preview cards use list semantics.
- `package.json` correctly wires both new script names to their script files.

Exact assertion count is likewise not decided here; it will be derived and documented in the result doc.

## §11 Sibling-checker impact

Because no Lab checker implements a git-diff-based purity assertion (§4), the risk surface is limited to each
checker's own hardcoded content expectations about the specific files this phase's implementation would
touch:

- `check_lab_return_matrix_redesign_static_contract.mjs` and
  `check_mobile_baseline_usability_static_contract.mjs` both read `LabReturnMatrix.astro` structurally; if
  either asserts the exact current (non-`scope`) `<th>`/`<td>` markup or the exact current interaction-hint
  string, the implementation task must extend (not weaken) those specific assertions to accept the corrected
  semantics, documented assertion-by-assertion in that task's own result doc.
- `check_lab_matrix_cross_year_hover_static_contract.mjs` asserts today's pointer-only script contract; the
  implementation task must confirm it still passes unchanged (pointer/tap behavior is preserved byte-for-byte
  per requirement 4) and only add new assertions for the additive keyboard behavior, never remove the
  existing pointer assertions.
- `check_lab_matrix_image_export_static_contract.mjs` asserts today's `exportCardImage.ts`/`captureId`
  contract; the implementation task must confirm the new status-message addition is additive and does not
  invalidate any existing assertion about the exclusion filter or capture boundary.
- `check_lab_static_module_shells_static_contract.mjs` asserts today's Congress/NPS div-based preview-card
  markup; converting to list semantics will require this checker's markup-shape assertions to be updated to
  the new `<ul>`/`<li>` structure while preserving every honesty-string assertion unchanged.
- `check_lab_route_split_static_contract.mjs` and `check_production_domain_consolidation_static_contract.mjs`
  both assume `nps-portfolio.astro`'s absence from the router surface is irrelevant (neither currently
  references it); removing it should not require changes to either, but the implementation task must confirm
  this directly rather than assume it.
- `check_mobile_ux_density_export_consistency_static_contract.mjs`'s fixed-file-list safety check should be
  re-read at implementation time to confirm its list does not need extending for any newly touched file; if
  it does, the extension must be additive and documented, never a broad allowlist widening.

No sibling-checker reconciliation is performed in this plan-only task — this section documents what the
later implementation task must check and (minimally, additively) fix.

## §12 Local verification plan (for the implementation task)

1. `npm run smoke:phase-4d-lab-production-completion` (new).
2. `npm run check:phase-4d-lab-production-completion` (new).
3. Re-run all 8 existing Lab-related checkers listed in §4/§11 and confirm pass (with documented, minimal,
   additive extensions where §11 identifies a needed change).
4. `npm ls` (dependency-tree sanity — confirm no dependency was added).
5. `npm run build` (confirm `dist/client` contains the updated Lab markup/CSS and no build error).
6. `git diff --check` (no whitespace errors).
7. Manual static review of every changed file's diff for stray fabricated data, real provider names, or
   past-tense verification claims.

## §13 Preview verification plan (for the implementation task)

Push the implementation branch, open a PR, and confirm the Vercel Preview build succeeds and the 4-5 Lab
routes return `200` (or the correct redirect, if `nps-portfolio.astro` is removed) with no new `5xx`. This
plan-only task does not push, deploy, or claim any such verification occurred.

## §14 Production verification plan (for the implementation task)

After the Owner merges the implementation PR, re-run the same bounded unauthenticated HTTP sweep pattern used
by every prior phase in this lane (Lab routes return `200`, no unexpected `5xx`), and record any
Vercel-deployment-specific fact supplied by the user (not independently observed by this session) using the
same explicit "supplied to this Claude Code session by the user, not independently verified" attribution
established in the Phase 4C closeout.

## §15 Phase 4F Owner-QA deferral

Authenticated visual/touch/keyboard/screen-reader QA of the Lab page group (including the new keyboard
matrix controls, the new export status messaging, and dark-mode contrast of any new focus states) remains
deferred to the standing Phase 4F cross-page Owner QA closeout, consistent with Phases 4A-4C.

## §16 Risks and rollback boundary

- **Risk**: converting matrix cells/legend chips to native `<button>` elements could alter existing CSS
  selectors or default browser button styling (padding, border, background) in a way that visually regresses
  the matrix. Mitigation (implementation-time): explicit CSS reset scoped to the new button elements, visual
  diff against the current pointer-only rendering.
- **Risk**: adding `<caption>`/`scope` attributes could shift the existing checkers' exact-string assertions
  in a way broader than intended. Mitigation: each sibling-checker change must be assertion-by-assertion, per
  §11.
- **Risk**: removing `nps-portfolio.astro` could be a surprise if the Owner has an external bookmark or link
  to it. Mitigation: the implementation task should flag this explicitly for Owner confirmation before
  deleting (rather than silently removing), and this plan does not authorize its removal — it only documents
  the recommendation.
- **Rollback boundary**: every change in this lane is docs-only or Lab-scoped source/CSS; nothing touches
  Supabase, environment variables, auth, or provider code, so a rollback (revert commit or PR close) carries
  no data-migration or credential risk.

## §17 Stop conditions

- If the initial-state SHA check (§1) had mismatched, this task would have stopped immediately and reported
  the mismatch — it did not.
- If any of the forbidden untracked items (`.agents/`, `.claude/`, `.vscode/settings.json`,
  `docs/handoff/codex_state_inspection/`, `set-gnews-vercel-env.ps1`, `skills-lock.json`) were found modified
  during this task, the task would stop and report it — none were touched.
- If drafting this plan required inventing a Vercel/Netlify/Production-runtime claim not actually observed in
  this session, the task would stop and ask — no such claim appears in this document.

## §18 Final planned classification

`PHASE_4D_LAB_PRODUCTION_COMPLETION_PLAN_READY_IMPLEMENTATION_NOT_STARTED`
