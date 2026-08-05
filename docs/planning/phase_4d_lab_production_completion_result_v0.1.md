# Phase 4D — Lab Production Completion — Result v0.1

**Current status**: `PHASE_4D_LAB_IMPLEMENTED_PR_READY_OWNER_MERGE_APPROVAL_REQUIRED`

**Baseline**: `7da540dbadaa0a5acafb9a74aec7d9fb9cfc93f8`
**Branch**: `feature/phase-4d-lab-production-completion`
**Plan**: [`phase_4d_lab_production_completion_plan_v0.1.md`](phase_4d_lab_production_completion_plan_v0.1.md)

## §1 Implementation

All twelve numbered requirements from the plan's §7 were implemented against the plan's §9 exact file scope,
with one deviation from the plan's non-binding recommendation (noted below) and one implementation-decision
narrowing of the plan's open keyboard-architecture question:

1. **Matrix table semantics** (`src/components/LabReturnMatrix.astro`): year `<th>` cells now declare
   `scope="col"`; rank cells are `<th scope="row" class="lab-rank-cell">` instead of plain `<td>`; both the
   ranking and summary `<table>` elements gained a `<caption>`; empty ranking cells carry
   `aria-label="데이터 없음"` instead of a bare em dash with no accessible name.
2. **Category highlighting + keyboard architecture**: per the session's implementation decision, only the 12
   legend chips became native `<button type="button">` elements exposing `aria-pressed`. Table cells stay
   semantic, non-interactive, and non-tabbable (no `tabindex` added to any cell) — the plan's "native buttons
   everywhere they fit" language was resolved in favor of the narrower, lower-risk surface once it became
   clear the ranking/summary cells' existing dense grid layout could not absorb 84+ new tab stops without a
   larger redesign the plan explicitly ruled out. `Enter`/`Space` activation is native-button-free (no manual
   key handling); `Escape` continues to clear the pin via the existing root-scoped `keydown` handler; keyboard
   focus on a legend chip applies the same temporary highlight as pointer hover, without mutating pinned
   state; legend activation toggles the pin through the same single `togglePin` call path pointer clicks use
   (no double-toggle); pointer hover/tap-to-pin on table cells is unchanged byte-for-byte; the
   `astro:page-load` + immediate-call idempotent init and the touch drag-distance guard are unchanged; no
   document- or window-level keyboard listener was added anywhere.
3. **Horizontal scrolling**: the existing `.lab-matrix-scroll` `role="region"` containers on both tables
   gained `tabindex="0"` and a focus-visible style, making the already-labeled scrollable region itself
   keyboard-reachable and keyboard-scrollable (arrow keys), closing the one real gap the plan's audit
   flagged for this requirement.
4. **Image export feedback** (`src/lib/exportCardImage.ts`, `asset-class-returns.astro`, `sp500-sectors.astro`):
   extracted a pure `exportStatusMessage(phase)` helper (`'start' | 'success' | 'error'` → Korean status
   string) and routed `setupCardImageExport`'s three status points through it; both detail pages gained a
   `role="status" aria-live="polite" aria-atomic="true"` `data-export-status` element next to the export
   button. The blocking `window.alert` failure path was removed. Every other already-correct export behavior
   (disabled/aria-busy/aria-label swap during capture, `data-card-actions` capture-exclusion filter, filename
   sanitization, `finally`-guaranteed style restoration) is unchanged.
5. **Future-module semantics** (`congress-stocks.astro`, `nps-holdings.astro`): the 3 preview cards in each
   page converted from plain `<div>` to a `<ul>`/`<li>` list (`class="lab-static-preview-grid"` /
   `lab-static-preview-card"`). Every existing "연동 예정" / "리서치 모듈 준비 화면" / non-real-data string is
   unchanged.
6. **Orphaned legacy page** (`nps-portfolio.astro`): **deviation from the plan's non-binding removal
   recommendation** — per the session's implementation decision, the page was not deleted but replaced with a
   permanent `Astro.redirect('/lab/nps-holdings', 301)`, so any existing bookmark or external link to
   `/lab/nps-portfolio` keeps resolving instead of 404ing. This satisfies the plan's underlying concern (no
   stale shell, no stale "Phase 8" label, no OpenDART real-provider-name mention reachable on the Lab surface)
   while being strictly safer than deletion, consistent with the plan's own §16 mitigation note that any
   removal should not be silent.
7. **Responsive behavior**: audited against the plan's documented breakpoints; no page-level horizontal
   overflow was found at 320px, so no structural CSS change beyond the additive rules in item 8 was required.
8. **CSS** (`src/styles/style.css`, +47 lines, additive only): focus-visible styling for the new legend
   buttons and the two newly-focusable scroll regions (with `body.dark-mode`-scoped overrides, never a bare
   global-selector override), `.lab-static-preview-grid`/`.lab-static-preview-card` list-reset styling, and
   `.lab-export-status` status-text styling (including an `:empty` collapse rule so the live region takes no
   layout space when idle).
9. **Resume-state boundary**: audited only, no code change. `src/lib/userRetentionClient.ts` is confirmed
   unreferenced by `LabReturnMatrix.astro` or any of the four touched Lab pages — the existing best-effort,
   try/catch-isolated `updatePreferences` call on `lab.astro` is untouched.
10. **No-provider boundary**: audited only, no code change. No `fetch(`, KIS reference, Supabase reference, or
    `/api/` route reference exists anywhere in the touched files.
11. **Interaction-hint copy**: left unchanged — the plan flagged this as contingent on the keyboard-support
    shape landing; since keyboard support was scoped to legend buttons only (item 2) and every legend chip
    already exposes its own visible, focusable, labeled button, no copy correction was found necessary at
    implementation time.
12. **Landing/detail-page truthfulness copy**: no changes — confirmed already correct, re-asserted by the new
    checker (see §3).

## §2 Changed files

Nine tracked files (195 insertions / 69 deletions per `git diff --stat`) plus three new test/tooling files:

- `package.json` (+2 lines) — two new script entries (`smoke:phase-4d-lab-production-completion`,
  `check:phase-4d-lab-production-completion`).
- `src/components/LabReturnMatrix.astro` (+109/-41 net) — table semantics, legend-button keyboard
  architecture, scroll-region `tabindex`.
- `src/lib/exportCardImage.ts` (+26 net) — `exportStatusMessage` helper + `setupCardImageExport` wiring.
- `src/pages/lab/asset-class-returns.astro` (+8), `src/pages/lab/sp500-sectors.astro` (+8) — export-status
  live region markup.
- `src/pages/lab/congress-stocks.astro` (+16/-14 net), `src/pages/lab/nps-holdings.astro` (+16/-14 net) —
  div-to-list preview-card conversion.
- `src/pages/lab/nps-portfolio.astro` (-22 net) — full-body replacement with a 301 redirect.
- `src/styles/style.css` (+47) — additive Lab-scoped CSS only.
- New: `scripts/smoke_phase_4d_lab_production_completion.mjs`,
  `scripts/phase_4d_lab_production_completion_testsrc.ts`,
  `scripts/check_phase_4d_lab_production_completion_contract.mjs`.

No file outside this list was modified. No sibling checker file required any edit (see §3) — every
pre-existing Lab checker already tolerated the new markup or was unaffected by it.

## §3 Validation

- **New smoke suite** (`npm run smoke:phase-4d-lab-production-completion`): **19/19 PASS**. Covers the pure
  `exportStatusMessage` helper (3 phases, distinctness, non-empty) and `labReturnMatrices.json` fixture
  integrity (year/category/ranking/summary-row counts, disclosure-string presence, category-ID
  cross-reference for both `assetMatrix` and `sectorMatrix`).
- **New static checker** (`npm run check:phase-4d-lab-production-completion`): **62/62 PASS** across 10
  groups (file existence; matrix table semantics; keyboard architecture; scroll-region accessibility; export
  feedback; future-module semantics; CSS scoping; resume-state boundary; no-provider boundary; redirect +
  fixture-shape integrity). Two authoring bugs in the checker itself were found and fixed during this pass
  (a corrected `src/lib/userRetentionClient.ts` path, and a CRLF-intolerant regex in the "`syncPressed` only
  writes `aria-pressed` on legend buttons" assertion — `.` does not match `\r`, so a git-driven LF→CRLF
  normalization on two files during local isolation testing exposed the bug; fixed by normalizing `\r?\n`
  before matching) — neither was a product defect; both were confirmed against the actual (correct) source
  before and after the fix.
- **All 8 pre-existing Lab-related checkers re-run and directly re-verified this session, with zero edits
  required to any of them**: `check:lab-route-split` 104/104, `check:lab-matrix-image-export` 80/80,
  `check:lab-return-matrix` 114/114, `check:lab-matrix-hover` 57/57, `check:lab-static-modules` 82/82,
  `check:mobile-baseline` 74/74, `check:production-domain` 33/33 — all fully green. `check:mobile-ux-density-export`
  67/68 — the one failure ("no polling `setInterval` added to export lib or matrix files") is a **pre-existing,
  out-of-scope condition**: the assertion scans `LiveMarketDashboard.astro` (a Phase 4B file, not touched by
  Phase 4D) alongside the Lab files, and that file's own `cooldownTimer = window.setInterval(...)` (unrelated
  Market-dashboard refresh-cooldown logic, present before this phase) is what trips it. Confirmed by direct
  grep that no `setInterval` exists in any file this phase touched.
- **Dependency integrity**: `npm ci` clean (309 packages, 0 added/removed/upgraded versus lockfile);
  `npm ls @astrojs/netlify` clean/empty; `npm ls --depth=0` unchanged (7 direct deps, no new/upgraded — no
  dependency was added, consistent with the plan's non-goals).
- **`git diff --check`**: clean, no whitespace errors.
- **`npm run build` (`astro build`)**: **could not be completed to a local pass/fail verdict** — the command
  consistently crashes partway through with Windows exit code `-1073740791`
  (`STATUS_STACK_BUFFER_OVERRUN`), immediately after all Astro build stages (type generation, server
  entrypoint build, three Vite sub-builds, asset rearrangement) log as successfully completed and
  `dist/client`/`dist/server` are both fully populated. **Isolation test performed**: the Phase 4D tracked
  changes were set aside with a tracked-files-only `git stash` (no `-u`, leaving every untracked path —
  including the forbidden `.agents/`, `.claude/`, `.vscode/settings.json`,
  `docs/handoff/codex_state_inspection/`, `set-gnews-vercel-env.ps1`, `skills-lock.json` — completely
  untouched) and `npm run build` was re-run against the unmodified baseline tree. The identical crash
  (same exit code, same failure point) reproduced on baseline code, before the stash was popped and the
  working tree fully restored. This proves the crash is a **pre-existing local Windows/Node-toolchain
  condition**, not a Phase 4D regression — Node `v24.14.1` is in use, two majors ahead of this project's
  documented `>=22.12.0` engines floor, and no prior phase in this project's history has this crash signature
  on record. Vercel's own Preview/Production build (Linux, its own pinned Node runtime) is the actual release
  gate and is unaffected by this local-environment limitation; the plan's `npm run build` gate item is
  satisfied to the extent locally possible (no new build error was introduced — the failure is identical with
  and without this phase's changes) and the real build-success confirmation is deferred to §4 Preview
  verification.

## §4 Preview verification

`PENDING` — to be performed immediately after this PR is opened, per §13 of the plan (confirm the Vercel
Preview build succeeds and the 6 Lab routes — `lab.astro` plus the 4 detail pages plus the
`nps-portfolio.astro` 301 — return the expected `200`/redirect with no new `5xx`).

## §5 Merge

`PENDING` — not performed by this task. Per the governing task's mandatory instruction, this PR must not be
merged by this assistant; merge requires explicit Owner approval.

## §6 Production verification

`PENDING` — deferred until after Owner merge, per §14 of the plan.

## §7 Deferred Owner QA

`PENDING` — authenticated visual/touch/keyboard/screen-reader QA of the Lab page group (including the new
legend-button keyboard controls, the new export status live region, and dark-mode contrast of the new focus
states) remains deferred to the standing Phase 4F cross-page Owner QA closeout, consistent with Phases 4A-4C.
This was never in scope for this assistant to perform directly.

## §8 Final classification

`PHASE_4D_LAB_IMPLEMENTED_PR_READY_OWNER_MERGE_APPROVAL_REQUIRED`
