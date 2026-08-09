# Phase 4F-UX1-A — Remove Unintended Home Resume Surface + Stateful UI Guard

**Result document v0.1**

## 1. Origin

While reviewing the merged PR #23 (Phase 4F-HF2/A1, Portfolio canonical instrument identity),
the Owner observed an unintended "이어서 보기" (resume) surface rendering on the Home page,
between MARKET SNAPSHOT and MARKET NEWS, showing the duplicate label "포트폴리오 · 포트폴리오".
No PR in this session touched Home; the surface had been dormant since Phase 3GI and became
visible purely because of persisted retention state accumulated during recent Portfolio QA
activity.

## 2. Root cause

`src/components/HomeRetentionPanel.astro` (Phase 3GI) renders a resume card whenever
`GET /api/user/retention` returns `preferences.lastSurface` plus a matching resume target
(`lastChartSymbol`/`lastChartMarket` for `chart_ai`, or `lastPortfolioId` for `portfolio`). Its
`renderResume()` builds the visible text as:

```ts
const surfaceLabel = preferences?.lastSurface ? SURFACE_LABEL[preferences.lastSurface] ?? '' : '';
text.textContent = `${surfaceLabel} · ${resume.label}`;
```

For the `portfolio` branch, `buildResumeHref()` hardcodes `resume.label = '포트폴리오'` while
`SURFACE_LABEL.portfolio` is also the literal string `'포트폴리오'` — producing the exact
duplicate "포트폴리오 · 포트폴리오" the Owner observed. The panel itself was working as coded; the
defect is that the panel was rendered on Home at all, and that it re-surfaces without any code
change once a session persists a resumable `lastSurface`.

## 3. Classification

**UX-08 — UNINTENDED STATE-ACTIVATED HOME SURFACE.** Severity: **MEDIUM**. A hidden/dormant UI
element became visible purely due to persisted user state, not a code change — no PR touching
Home was reviewed for this specific transition.

## 4. Owner decision (§1 scope)

- **(A)** Remove `HomeRetentionPanel` from the Home page's visible render — implemented.
- **(B)** Keep the Phase 3GI retention/preferences backend fully intact — implemented (nothing
  deleted; component file, migrations, routes, and client module all preserved).
- **(C)** Add a regression guard against unapproved state-dependent Home surfaces reappearing
  between Snapshot and News — implemented (`scripts/check_phase_4f_ux1a_home_surface_contract.mjs`
  + `src/lib/home/homeDynamicSurfaceGuard.ts`).
- **(D)** Record the finding and fix — this document.

Explicitly excluded from this phase: Chart AI redesign, Portfolio dashboard/SWR/visual redesign,
shared `AuthRequiredState`, Market reorder, Home urgent-news styling
(`[급보]`/`[단독]`/`[긴급]`/`[속보]`), Lab MVP, F-HIGH-02/F-HIGH-03 code changes, retention
DB/API removal, Supabase migrations, watchlist removal.

## 5. Implementation

### 5.1 `src/pages/index.astro`

Removed the import `import HomeRetentionPanel from '../components/HomeRetentionPanel.astro';`
and removed its render block. The Home visible sequence changed from:

```astro
<HomeLiveMarketSnapshot />

<HomeRetentionPanel />

<HomeMarketNews />
```

to:

```astro
<HomeLiveMarketSnapshot />

<HomeMarketNews />
```

`HomeRetentionPanel.astro` itself was **not** deleted — it remains in the repository as a
dormant, unreferenced-from-Home component. Its cross-device watchlist compact list and resume
logic are unchanged; nothing about the component's internals was touched.

### 5.2 Retention backend — preserved untouched

No changes to: the Phase 3GI/HF1/HF2 Supabase migrations, `src/lib/server/userRetention.ts`,
`src/pages/api/user/retention.ts`, `src/pages/api/user/preferences.ts`,
`src/pages/api/user/watchlist.ts`, `src/lib/userRetentionClient.ts`, `lastSurface`/
`lastPortfolioId`/`lastChartSymbol`/`lastChartMarket` persistence, Chart AI watchlist/resume
persistence, or Portfolio resume-state persistence (`persistPortfolioResumeState` in
`portfolio.astro`). No database cleanup was performed or requested.

### 5.3 Stateful UI regression guard (§6)

New pure module `src/lib/home/homeDynamicSurfaceGuard.ts` — a small, documented allowlist (not a
new framework):

- `APPROVED_HOME_DYNAMIC_SURFACES` — `home-portfolio-panel` (`HomePortfolioPanel.astro`'s
  resolving/signed_out/signed_in_empty/signed_in_with_portfolio states) and `header-auth-state`
  (`Header.astro`'s signed-in vs signed-out controls).
- `REJECTED_HOME_DYNAMIC_SURFACES` — `home-retention-panel`, explicitly recorded as removed by
  this phase rather than silently omitted.
- `isApprovedHomeDynamicSurface(id)` / `isExplicitlyRejectedHomeDynamicSurface(id)` helpers.

`scripts/check_phase_4f_ux1a_home_surface_contract.mjs` validates this registry's content
statically and, independently, asserts by source inspection that `index.astro` neither imports
nor renders `HomeRetentionPanel` and that nothing else renders between
`HomeLiveMarketSnapshot` and `HomeMarketNews`.

### 5.4 Process rule — VISIBILITY-STATE DIFF (§7, recorded verbatim)

> A "user-visible surface" includes not only what a code diff adds or removes, but any hidden or
> dormant UI that can become visible purely from a change in state: authentication state,
> database state, browser storage, retention/preference records, feature flags, query
> parameters, or API response shape/content. A PR review that only inspects the CODE DIFF can
> miss a UX regression caused entirely by a STATE transition, because the code enabling that
> surface may have shipped, unreviewed for this effect, in an earlier, unrelated PR. PR review
> must therefore inspect both the CODE DIFF **and** a VISIBILITY-STATE DIFF — an explicit
> accounting of which state-dependent surfaces exist on the page, which states activate them, and
> whether any newly-reachable state (via a new feature, a migrated field, accumulated QA/session
> data, etc.) would flip one of them visible without a corresponding code change to that surface
> itself.

### 5.5 Automated coverage vs. VISIBILITY-STATE DIFF (§6, UX1-A1 clarification)

The UX1-A1 hotfix (§13 below) turned the registry into an enforced render-tree invariant, but
that automation has a precise, bounded scope. To avoid overclaiming complete coverage:

**AUTOMATED (enforced by `check_phase_4f_ux1a_home_surface_contract.mjs` on every run):**

- The exact set of top-level `Home*.astro` components rendered by `index.astro` matches the
  `APPROVED_HOME_SURFACES` registry exactly — no missing approved component, no unregistered
  new component, in any position (including after `HomeMarketNews`).
- No `REJECTED_HOME_SURFACES` component (e.g. `HomeRetentionPanel`) is ever rendered.
- Main-column order: `HomePortfolioPanel` → `HomeMobileAd` → `HomeLiveMarketSnapshot` →
  `HomeMarketNews`; `HomeRailAd` confirmed present but excluded from that linear order (sidebar
  branch).
- `HomeLiveMarketSnapshot` immediately precedes `HomeMarketNews` with nothing rendered between
  them.

**STILL MANUAL / PROCESS REVIEW (the VISIBILITY-STATE DIFF in §4 above, unchanged):**

- A new internal state *inside* an already-approved component (e.g. a fifth
  `HomePortfolioPanel` state, or a new conditional branch inside `HomeMarketNews`) — the
  checker only inventories top-level component identity, not a component's internal states.
- An auth/API/DB/localStorage/feature-flag change that exposes a previously-hidden state or
  surface *without* adding or removing a `Home*.astro` component tag — e.g. UX-08 itself (a
  persisted-state transition inside `HomeRetentionPanel`, at a time when it was still imported)
  would not have been caught by a render-tree checker alone, because the render-tree checker can
  only fail when a rejected component's tag literally appears in `index.astro`. This category
  remains why the VISIBILITY-STATE DIFF stays mandatory during PR review — it is not superseded
  by the new automation.

## 6. Sibling-checker reconciliation

Two pre-existing static checkers asserted that `index.astro` renders `HomeRetentionPanel`; both
were narrowly updated to assert the opposite, with a comment citing this phase and pointing at
the new dedicated guard checker:

- `scripts/check_phase_4a_home_common_shell_contract.mjs` check #38 — was "index.astro still
  renders all six Home state components"; now "index.astro still renders the five approved Home
  state components (no accidental removal)", requiring `HomePortfolioPanel`, `HomeMobileAd`,
  `HomeLiveMarketSnapshot`, `HomeMarketNews`, `HomeRailAd` (dropping `HomeRetentionPanel` from the
  list). Check #35 (`HomeRetentionPanel.astro exists and makes no cross-device/other-user state
  claim`) was left unchanged — it only asserts the component file's own content, which is still
  true.
- `scripts/check_phase_3gi_user_retention_persistence_contract.mjs` Group 7 — was "index.astro
  renders HomeRetentionPanel"; now "index.astro no longer renders HomeRetentionPanel (Phase
  4F-UX1-A removal)". All other Group 7 assertions (which test `HomeRetentionPanel.astro`'s own
  internal behavior, not `index.astro`'s render) were left unchanged.

No assertion was broadened beyond what the change actually requires.

## 7. New tests

- `scripts/phase_4f_ux1a_home_surface_guard_testsrc.ts` — 8 behavioral assertions against the
  real `homeDynamicSurfaceGuard.ts` module (approved/rejected list shape and membership,
  unlisted-id neutrality, rejected-entry naming).
- `scripts/smoke_phase_4f_ux1a_home_surface.mjs` — esbuild-bundles and runs the above. **8/8
  passed.**
- `scripts/check_phase_4f_ux1a_home_surface_contract.mjs` — static contract: resume-surface
  removal (3 checks), approved Home section order (5 checks), the stateful UI guard itself (7
  checks), retention backend preservation (9 checks), no-scope-creep (2 checks), and package.json
  wiring (2 checks). **28/28 passed.**
- `package.json` — added `smoke:phase-4f-ux1a-home-surface` and
  `check:phase-4f-ux1a-home-surface`.

## 8. Regression gate (§11, exact order, all green)

- `smoke:phase-4f-ux1a-home-surface` — **8/8**.
- `check:phase-4f-ux1a-home-surface` — **28/28**.
- `check:phase-4a-home-common-shell` — **75/75**.
- `check:phase-4b-market-production-completion` — **79/79**.
- `check:phase-4c-chart-ai-production-completion` — **35/35**.
- `check:phase-4d-lab-production-completion` — **62/62**.
- `smoke:phase-4e-portfolio-production-completion` — **21/21**.
- `check:phase-4e-portfolio-production-completion` — **65/65**.
- `smoke:phase-4f-hf1-functional-high` — **20/20**.
- `check:phase-4f-hf1-functional-high` — **58/58**.
- `smoke:phase-4f-hf2-portfolio-identity` — **93/93**.
- `check:phase-4f-hf2-portfolio-identity` — **63/63**.
- `check:mobile-baseline` — **74/74**.
- `check:project-lightweight-roadmap` — **27/27**.
- Full 10-command Phase 4F gate (`check:phase-4a-home-common-shell` 75/75,
  `check:phase-4b-market-production-completion` 79/79,
  `check:phase-4c-chart-ai-production-completion` 35/35,
  `check:phase-4d-lab-production-completion` 62/62,
  `smoke:phase-4e-portfolio-production-completion` 21/21,
  `check:phase-4e-portfolio-production-completion` 65/65, `check:mobile-baseline` 74/74,
  `check:project-lightweight-roadmap` 27/27, `smoke:phase-3gh-portfolio-live-valuation-mvp` 55/55,
  `check:phase-3gh-portfolio-live-valuation-mvp` 86/86) — all green, unchanged from prior phases.
- `git diff --check` — clean.
- `npm ls --depth=0` — clean (no `UNMET`/`invalid`/`missing`/`extraneous`).
- `npm run build` — all real build stages completed successfully (types generated, server
  entrypoints built, 3 Vite builds, Vercel adapter server-asset rearrangement); the process then
  exited nonzero on this Windows machine, the same known post-build teardown artifact documented
  in prior Phase 4F/4E result docs — not a compile error.

## 9. Scope audit (§12)

`git status --short` / `git diff --stat` confirm a very small, correctly-scoped diff:

- Modified: `package.json` (2 lines — new npm scripts).
- Modified: `scripts/check_phase_3gi_user_retention_persistence_contract.mjs` (sibling
  reconciliation).
- Modified: `scripts/check_phase_4a_home_common_shell_contract.mjs` (sibling reconciliation).
- Modified: `src/pages/index.astro` (import + render removal only, 3 lines removed).
- New: `src/lib/home/homeDynamicSurfaceGuard.ts`.
- New: `scripts/phase_4f_ux1a_home_surface_guard_testsrc.ts`.
- New: `scripts/smoke_phase_4f_ux1a_home_surface.mjs`.
- New: `scripts/check_phase_4f_ux1a_home_surface_contract.mjs`.
- New: this document.

No changes to `src/pages/portfolio.astro`, portfolio valuation code, KIS providers, or any
Chart AI/Market/Lab UI file. Pre-existing Owner-local untracked files (`.agents/`, `.claude/`,
`.vscode/settings.json`, `docs/handoff/codex_state_inspection/`, `set-gnews-vercel-env.ps1`,
`skills-lock.json`) were left untouched and were not staged.

## 10. F-HIGH status (§9 — unchanged, preserved exactly)

- **F-HIGH-01 / CHART-05** — **CLOSED.**
- **F-HIGH-02 / PORT-10** — **IMPLEMENTED. PRODUCTION OWNER VERIFICATION STILL REQUIRED.**
- **F-HIGH-03 (Portfolio canonical identity)** — **IMPLEMENTED. PRODUCTION OWNER VERIFICATION
  STILL REQUIRED.**

Owner QA remains formally **0/120**. This phase does not alter F-HIGH-02 or F-HIGH-03 in any way
— it is a Home-only visibility fix.

## 11. Preview

See the final report for the exact-Head Vercel Preview deployment ID and verification result.

## 12. UX1-A1 — bind the registry to the actual render tree (premerge-review hotfix)

### 12.1 Finding

Premerge review of PR #24 (this phase) found that while UX-08 itself was correctly fixed, the
new `homeDynamicSurfaceGuard.ts` registry from §5.3 above was **documentation-only**: the
original checker verified `HomeRetentionPanel` absence, the Snapshot→News adjacency, and that a
short list of literal `id: '...'` strings existed in the guard source — but it never compared
the registry against what `index.astro` actually renders. A brand-new, unregistered
`Home*.astro` component added anywhere in `index.astro` (including after `HomeMarketNews`)
would have passed the old checker undetected. Separately, `HomeMobileAd` and `HomeRailAd` are
real top-level state-dependent Home surfaces (ad slots) that were missing from the original
2-entry registry (`home-portfolio-panel`, `header-auth-state`).

### 12.2 Registry model change

`src/lib/home/homeDynamicSurfaceGuard.ts` was rewritten around a three-way
`HomeSurfaceVisibility = 'always' | 'stateful' | 'rejected'` model (`HomeSurface { id,
component, visibility, description }`), covering every top-level `Home*.astro` component
`index.astro` renders:

| id | component | visibility |
|---|---|---|
| `home-portfolio-panel` | `HomePortfolioPanel` | `always` |
| `home-mobile-ad` | `HomeMobileAd` | `stateful` |
| `home-live-market-snapshot` | `HomeLiveMarketSnapshot` | `always` |
| `home-market-news` | `HomeMarketNews` | `always` |
| `home-rail-ad` | `HomeRailAd` | `stateful` |
| `home-retention-panel` | `HomeRetentionPanel` | `rejected` (zero renders required) |

`header-auth-state` (`Header`) was moved out to a new `GLOBAL_SHELL_SURFACES` array with an
ownership comment — it is Common-Shell/Layout state, not a direct Home*.astro component, and is
never mixed into the Home render-tree comparison. Internal loading/empty substates inside an
already-approved component are deliberately not tracked as separate surfaces (see §5.5).

A new pure function, `compareHomeSurfaceInventory({ actualComponents, approvedComponents,
rejectedComponents })`, returns `{ ok, missing, unexpected, rejectedRendered }` via `Set`
membership checks — this is the enforcement primitive both the smoke test and the checker now
exercise.

### 12.3 Checker enforcement

`scripts/check_phase_4f_ux1a_home_surface_contract.mjs` now parses the actual `<Home[A-Z]...`
tags rendered by `index.astro` (deduplicated), parses the approved/rejected component-name lists
from their own registry blocks in `homeDynamicSurfaceGuard.ts` source text, and applies the same
missing/unexpected/rejectedRendered comparison as `compareHomeSurfaceInventory`. Required
invariant: `ACTUAL_RENDERED_HOME_COMPONENTS == APPROVED_RENDERED_HOME_COMPONENTS`, excluding
rejected components (which must have zero renders). This enforcement is independent of, and in
addition to, the pre-existing Snapshot→News adjacency assertion — it is not limited to that gap.
A full main-column order assertion (`HomePortfolioPanel` → `HomeMobileAd` →
`HomeLiveMarketSnapshot` → `HomeMarketNews`) was added, with `HomeRailAd` explicitly confirmed
present in the sidebar branch and excluded from that ordering.

This enforcement was manually verified against real failures before being trusted: a temporary
`<HomeUnexpectedPanel />` appended after `<HomeMarketNews />` in `index.astro` correctly failed
the checker (`unexpected: HomeUnexpectedPanel`), and a temporary `<HomeRetentionPanel />` reinserted
between Snapshot and News correctly failed it on four independent assertions
(`rejectedRendered`, the exact-match invariant, the adjacency check, and the explicit
HomeRetentionPanel-in-the-gap check). Both edits were reverted immediately after confirming the
failure, and the checker was re-run clean (46/46) before proceeding.

### 12.4 New tests (§5 required cases A–F)

`scripts/phase_4f_ux1a_home_surface_guard_testsrc.ts` was rewritten to exercise the real
`compareHomeSurfaceInventory` function against the real registry's derived component-name
arrays, covering all six required cases: (A) actual == approved → PASS; (B) actual contains an
unregistered `HomeUnexpectedPanel` → FAIL/unexpected; (C) actual omits `HomeMarketNews` →
FAIL/missing; (D) actual renders `HomeRetentionPanel` → FAIL/rejected-rendered; (E)
`HomeMobileAd`/`HomeRailAd` are approved stateful surfaces, full match → PASS; (F) a new unknown
component appended after `HomeMarketNews` → still FAIL/unexpected (proving the premerge finding
in §12.1 is fixed). **25/25 assertions passed** (12 registry-shape assertions + 13 across
cases A–F).

### 12.5 Regression gate (all green)

- `smoke:phase-4f-ux1a-home-surface` — **25/25** (was 8/8; grew with the new A–F enforcement
  cases).
- `check:phase-4f-ux1a-home-surface` — **46/46** (was 28/28; grew with the new render-tree
  enforcement group, the full order-contract group, and the refined registry-structure group).
- `check:phase-4a-home-common-shell` — **75/75** (no change needed).
- `check:phase-3gi-user-retention-persistence` — **149/149** (no change needed).
- `smoke:phase-4f-hf1-functional-high` — **59/59** (39 + 20 across the two testsrc suites it
  bundles).
- `check:phase-4f-hf1-functional-high` — **58/58**.
- `smoke:phase-4f-hf2-portfolio-identity` — **98/98** (23 + 15 + 26 + 34 across its four testsrc
  suites).
- `check:phase-4f-hf2-portfolio-identity` — **63/63**.
- `smoke:phase-4e-portfolio-production-completion` — **21/21**.
- `check:phase-4e-portfolio-production-completion` — **65/65**.
- `git diff --check` — clean (only benign LF→CRLF line-ending warnings on the three touched
  files).
- `npm ls --depth=0` — clean.
- `npm run build` — all real build stages completed successfully (types generated, server
  entrypoints built, 3 Vite builds, Vercel adapter server-asset rearrangement); same known
  nonzero-exit Windows teardown artifact as prior phases, not a compile error.

No check was weakened to recover green; every total that changed grew because new, stricter
assertions were added.

### 12.6 Scope

Changed files for UX1-A1: `src/lib/home/homeDynamicSurfaceGuard.ts` (rewritten registry model),
`scripts/check_phase_4f_ux1a_home_surface_contract.mjs` (rewritten enforcement), `scripts/phase_4f_ux1a_home_surface_guard_testsrc.ts`
(rewritten test cases), this document (§5.5 and §12 added). No changes to
`HomeRetentionPanel.astro` internals, retention APIs, retention DB/migrations, Portfolio, KIS,
Chart AI, Market, or Lab. The resume panel was not restored.

Committed to the **existing** `fix/phase-4f-ux1a-home-surface-guard` branch (PR #24) — no new PR
was opened and PR #24 was not merged.

## 13. Final classification

**`PHASE_4F_UX1A_A1_COMPLETE_PREMERGE_REVIEW_REQUIRED`**
