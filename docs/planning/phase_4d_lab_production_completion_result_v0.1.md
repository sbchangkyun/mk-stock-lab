# Phase 4D — Lab Production Completion — Result v0.1

**Current status**: `PHASE_4D_LAB_MERGED_PRODUCTION_VERIFIED`

**Baseline**: `7da540dbadaa0a5acafb9a74aec7d9fb9cfc93f8`
**Branch**: `feature/phase-4d-lab-production-completion` (merged into `main` — see §5)
**Merge commit**: `14c0ee993dbf03639d73f12bfca39f67047e508a`
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

This section distinguishes two different diff scopes, both re-derived directly via `git diff --stat` /
`git diff --name-status` this session (not taken on faith from any prior draft):

**Full PR scope** — base `7da540dbadaa0a5acafb9a74aec7d9fb9cfc93f8` → final Head
`4f4ea1368d70a78b566a3a7dca7547cf441857f8` (3 commits ahead): **16 files changed, 11 modified + 5 added**
(1221 insertions(+) / 75 deletions(-)).

**Implementation-stage scope** — plan commit `df337b7ac85d0aab5fcef84cd58f3afac9f7e617` → final Head (2 commits
ahead, i.e. everything after the plan itself was committed): **15 files changed, 12 modified + 3 added**
(731 insertions(+) / 99 deletions(-)).

The two scopes differ because the plan commit itself already added `phase_4d_lab_production_completion_plan_v0.1.md`
and a stub of this result doc before implementation began. Relative to the full-PR base, both of those planning
files are net-new (`Added`); relative to the plan commit, this result doc was already present as a stub and is
therefore `Modified` (filled in), while the plan doc itself received no further change after the plan commit.

**Product/test files** (unchanged in either scope — 9 files, all `Modified`):

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

**New test/tooling files** (unchanged in either scope — 3 files, `Added` in both):

- `scripts/smoke_phase_4d_lab_production_completion.mjs`
- `scripts/phase_4d_lab_production_completion_testsrc.ts`
- `scripts/check_phase_4d_lab_production_completion_contract.mjs`

**Planning files** (the source of the scope difference — 4 files, all part of the full 16-file PR total):

- `docs/planning/phase_4d_lab_production_completion_plan_v0.1.md` — `Added` in the full-PR diff (created by
  the plan commit, before implementation); not present at all in the implementation-stage diff (no change
  after the plan commit).
- `docs/planning/phase_4d_lab_production_completion_result_v0.1.md` (this file) — `Added` in the full-PR diff
  (existed only as a stub at the plan commit, so base→Head shows it as newly present); `Modified` in the
  implementation-stage diff (plan-commit→Head shows the stub being filled in, including this correction).
- `docs/planning/mk_stock_lab_master_roadmap_v2.1.md` — `Modified` in both scopes.
- `docs/planning/planning_changelog.md` — `Modified` in both scopes.

No file outside the 16 full-PR files above was modified. No sibling checker file required any edit (see §3) —
every pre-existing Lab checker already tolerated the new markup or was unaffected by it.

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

`PARTIAL — BUILD CONFIRMED READY FOR FINAL HEAD, ROUTE-LEVEL CONTENT BLOCKED BY SSO`.

This section distinguishes two sequential commits on PR #17
(https://github.com/sbchangkyun/mk-stock-lab/pull/17, `feature/phase-4d-lab-production-completion` → `main`):
the **implementation commit** `8fc1666` (the 9 product/test files + 3 new scripts + the initial planning-doc
fill-in, opened as the PR head at that time) and the **final PR Head** `4f4ea1368d70a78b566a3a7dca7547cf441857f8`
(a later commit that added only this Preview-verification record to this doc, per §2's implementation-stage
accounting). Everything below is re-verified against the final Head, not the implementation commit.

**Independently confirmed this session** (via `gh api repos/sbchangkyun/mk-stock-lab/commits/<sha>/status` and
`gh api repos/sbchangkyun/mk-stock-lab/deployments`, both run directly against final Head
`4f4ea1368d70a78b566a3a7dca7547cf441857f8`):

- The GitHub `Vercel` commit-status context reports `state: success` for the final Head, confirming the
  Preview build (Linux, Vercel's own pinned Node runtime) completed successfully for this exact commit — the
  release-gate confirmation deferred from §3's local `npm run build` finding. The status `target_url` contains
  deployment id `9ptxfhuLHQ2wusKiSKyQAva9u4dR` (i.e. `dpl_9ptxfhuLHQ2wusKiSKyQAva9u4dR`).
- GitHub's own Deployments API independently corroborates the same deployment: one deployment record with
  `sha` exactly equal to the final Head, `environment: "Preview"`, and a deployment-status `state: "success"`
  (`description: "Deployment has completed"`), exposing a per-deployment URL
  (`https://mkstocklab-f68lpbmns-sbchangkyun-2946s-projects.vercel.app`) that is scoped to this exact
  deployment/commit, distinct from the mutable branch-alias URL used for the implementation-commit sweep in
  the prior draft of this section.
- The GitHub `netlify/mkstocklab/deploy-preview` commit-status context also now reports `state: success` for
  the final Head (superseding the "IN_PROGRESS/PENDING" observation recorded against the implementation
  commit in the prior draft of this section). Per the governing task's Rule #11 (this correction's item 5),
  Netlify is recorded here only as an external status that later reached `success` — it is **not** used as
  release evidence or a merge gate; the `Vercel` context alone is this project's release gate.

**User-supplied, not independently re-derived this session** (this session has no direct Vercel API/CLI/
dashboard access — no `VERCEL_TOKEN`, and the Vercel MCP connector requires an interactive OAuth flow this
non-interactive session cannot run — so the following granular Vercel-native fields are recorded as supplied
by the Owner rather than confirmed via Vercel's own API, consistent with this project's standing verification-
honesty convention): deployment `dpl_9ptxfhuLHQ2wusKiSKyQAva9u4dR`, deployment commit
`4f4ea1368d70a78b566a3a7dca7547cf441857f8`, state `READY`, readyState `READY`, source `git`, framework
`astro`, region `iad1`, aliasError `null`, and that the remote `npm run build`, Astro server build,
`@astrojs/vercel` bundling, postbuild, and deployment steps all completed. These are consistent with (and not
contradicted by) the independently-confirmed `success` status and deployment record above, but the exact
dashboard-only field values themselves were not re-derived from Vercel directly this session.

**Route-level limitation (unchanged from the prior draft, re-confirmed this session against the exact-Head
deployment URL, not just the branch alias)**: an unauthenticated, bounded HTTP sweep of the 6 target Lab
routes (`/lab`, `/lab/asset-class-returns`, `/lab/sp500-sectors`, `/lab/congress-stocks`, `/lab/nps-holdings`,
`/lab/nps-portfolio`) against `https://mkstocklab-f68lpbmns-sbchangkyun-2946s-projects.vercel.app` (the exact
per-deployment URL for the final Head) returned `302` to `vercel.com/sso-api` for all 6 routes — this is this
project's standing Vercel Deployment Protection (SSO) behavior (every Preview on this project has been
SSO-gated across every prior phase on record), applies uniformly to every path before any application routing
runs, and so cannot distinguish a `200` page from the expected `nps-portfolio` `301` from a `404` at this
protection layer. No SSO bypass or share-link was attempted, per the governing task's mandatory rule against
creating one. Route-level content verification (the 5×`200` + 1×`301` expectation) and any authenticated
visual/interaction check therefore remain `OWNER_QA_PENDING`, deferred to the standing Phase 4F cross-page
Owner QA closeout (§7) — the fact this session adds beyond that deferral is the successful, READY Preview
build for the exact final Head, not route-level content access.

## §5 Merge

`COMPLETE — merged by the Owner`.

[PR #17](https://github.com/sbchangkyun/mk-stock-lab/pull/17)
(`feature/phase-4d-lab-production-completion` → `main`, "Phase 4D: Lab production completion") was merged by
the **Owner**, not by this assistant. This assistant did not merge this PR at any point; the governing task
forbade it, and the merge actor on record is the Owner's own account.

Independently re-confirmed this closeout via `gh pr view 17 --json state,mergedAt,mergeCommit,mergedBy,baseRefName,headRefOid`:

| Field | Value |
| --- | --- |
| `state` | `MERGED` |
| `mergedBy.login` | `sbchangkyun` (Owner) |
| `mergeCommit.oid` | `14c0ee993dbf03639d73f12bfca39f67047e508a` |
| `mergedAt` | `2026-08-06T15:10:54Z` |
| `headRefOid` | `98a6c88fc62414bd35536e948750ff7f16755572` |
| `baseRefName` | `main` |

The merge commit subject is `Merge pull request #17 from sbchangkyun/feature/phase-4d-lab-production-completion`
/ `Phase 4D: Lab production completion`, authored by `sbchangkyun <sbchangkyun@gmail.com>`. `main`'s HEAD after
`git fetch origin && git checkout main && git pull --ff-only origin main` is exactly
`14c0ee993dbf03639d73f12bfca39f67047e508a` (a clean fast-forward `7da540d..14c0ee9`, 16 files / 1285
insertions / 75 deletions — matching the full-PR scope accounted for in §2). No reset, rebase, or history
rewrite was performed.

Note `headRefOid` `98a6c88` is one commit beyond the `4f4ea13` Head referenced in §4: `98a6c88` is the
docs-only PR-record correction commit (result-doc §2 diff accounting and §4 Preview metadata), applied before
merge. It changed no application source.

## §6 Production verification

`VERIFIED — bounded, unauthenticated Production route + deployed-HTML checks pass; automatic deployment
trigger did NOT fire and the release was recovered manually by the Owner`.

### Deployment record

| Field | Value | Source |
| --- | --- | --- |
| Deployment ID | `dpl_E4r84x9S5NLoDFLrgHqi9heJ2GvQ` | Owner-supplied; ID independently corroborated (below) |
| State | `READY` | Owner-supplied; `success` independently corroborated |
| Target | `production` | Owner-supplied; `environment: Production` independently corroborated |
| Git ref | `main` | Owner-supplied (see the anomaly finding below — GitHub's record shows a raw SHA ref) |
| Git SHA | `14c0ee993dbf03639d73f12bfca39f67047e508a` | Independently confirmed |
| Commit verification | `verified` | Owner-supplied |

**Independently confirmed this closeout** (this session has no Vercel API/CLI/dashboard/connector access — no
`VERCEL_TOKEN`, and the Vercel MCP connector requires an interactive OAuth flow this non-interactive session
cannot run — so Vercel-native facts are corroborated through GitHub's own APIs, per this project's standing
verification-honesty convention):

- `gh api repos/sbchangkyun/mk-stock-lab/commits/14c0ee99.../status` → `state: success`, `total_count: 1`,
  sole context `Vercel: success`, `target_url`
  `https://vercel.com/sbchangkyun-2946s-projects/mkstocklab/E4r84x9S5NLoDFLrgHqi9heJ2GvQ` — the deployment ID
  embedded in the status URL matches the Owner-supplied `dpl_E4r84x9S5NLoDFLrgHqi9heJ2GvQ` exactly.
- `gh api repos/sbchangkyun/mk-stock-lab/deployments?sha=14c0ee99...` → exactly one deployment record
  `5804154318`, `environment: Production`, `original_environment: Production`, `sha` exactly the merge commit,
  `creator: vercel[bot]`.
- Its status: `state: success`, `environment: Production`, `description: "Deployment has completed"`,
  per-deployment URL `https://mkstocklab-e67y9pdb9-sbchangkyun-2946s-projects.vercel.app`, at
  `2026-08-08T00:57:48Z`.

Not independently re-derived (Owner-supplied dashboard-only fields): `readyState`, the `main` git-ref label,
and the `verified` commit-verification flag. These are consistent with, and not contradicted by, the
corroborated facts above.

### Automatic-trigger anomaly and manual recovery (recorded accurately — the automatic trigger did NOT succeed)

The automatic Vercel Production deployment **did not appear** after the PR #17 merge. The release was
recovered by the **Owner** using **Vercel Dashboard → Create Deployment** against `main`. This closeout does
**not** claim the original automatic Git-integration trigger succeeded.

Observations at the time of the anomaly (Owner-reported): GitHub Actions refresh checks were successful; the
GitHub legacy combined commit status for the merge SHA returned `statuses: []` / `total_count: 0`; GitHub
Deployments contained no deployment for the merge SHA; and a full Vercel project-configuration audit found
nothing blocking — repository `sbchangkyun/mk-stock-lab`, Production Branch `main`, Framework Astro, Root
Directory `/`, Ignored Build Step `Automatic`, "skip deployments when no root changes" **Disabled**, project
not paused, no Deployment Checks configured.

Two pieces of **independent** evidence gathered this closeout corroborate the manual-recovery narrative
rather than an automatic push-triggered deploy:

1. **~34-hour gap.** The merge landed `2026-08-06T15:10:54Z`, but both the sole `Vercel` commit status and the
   only Production deployment record for that SHA were created `2026-08-08T00:57:47Z`. A push-triggered
   deployment is created within seconds of the push, not a day and a half later.
2. **`ref` is a raw SHA, not a branch.** Deployment `5804154318` carries
   `ref: 14c0ee993dbf03639d73f12bfca39f67047e508a` rather than `ref: main`. A branch-push-triggered Vercel
   deployment records the branch name; a Dashboard "Create Deployment" against a specific commit records the
   commit SHA — which is exactly what is on record here.

**No Vercel project setting was changed** to obtain this deployment, by the Owner or by this assistant. The
recovery was a manual deployment creation only. This assistant performed no deployment.

**Recurrence status: UNDETERMINED — one observation is not a pattern.** This is recorded as a *single*
Git/Vercel integration trigger miss. The **next `main` merge is the recurrence test**: if that merge produces
an automatic Production deployment, this was a one-off trigger miss; if the automatic deployment is absent
again, it must be escalated as a **recurring Git/Vercel integration incident** and reported before any further
manual workaround is applied, rather than silently worked around. This is a platform/integration matter, not
an application-code defect — nothing in the Phase 4D diff can affect whether Vercel's Git integration fires.

### Bounded, unauthenticated Production route sweep (independently run this closeout)

Against `https://mkstocklab.vercel.app`, using a non-redirect-following request (`HttpWebRequest` with
`AllowAutoRedirect = false`) so redirects are observed rather than followed. This is the route-level
verification that was permanently blocked on Preview by Vercel Deployment Protection (§4) — Production is
publicly reachable, so it can finally be confirmed directly:

| Route | Result |
| --- | --- |
| `GET /lab` | `200` |
| `GET /lab/asset-class-returns` | `200` |
| `GET /lab/sp500-sectors` | `200` |
| `GET /lab/congress-stocks` | `200` |
| `GET /lab/nps-holdings` | `200` |
| `GET /lab/nps-portfolio` | `301` → `Location: /lab/nps-holdings` |

Exactly the 5×`200` + 1×`301` expectation from the plan, confirming the §1 item-6 redirect deviation behaves
as documented in Production.

### Deployed-HTML marker checks (independently run this closeout)

Fetched with explicit UTF-8 decoding. Counts on `/lab/asset-class-returns` and `/lab/sp500-sectors` (identical
on both, as expected — both render the shared `LabReturnMatrix.astro`):

| Marker | Count | Confirms |
| --- | --- | --- |
| `<caption` | 2 | §1 item 1 — captions on both the ranking and summary tables |
| `scope="col"` | 12 | §1 item 1 — column header scoping |
| `scope="row"` | 24 | §1 item 1 — row header scoping |
| `aria-pressed` | 13 | §1 item 2 — native legend buttons with pressed state |
| `lab-matrix-scroll` | 2 | §1 item 3 — both scroll regions present |
| `role="region"` | 2 | §1 item 3 |
| `tabindex="0"` on both scroll regions | 2 | §1 item 3 — keyboard reachability |
| `data-export-status` | 1 | §1 item 4 — export status region |
| `role="status"` | 2 | §1 item 4 |
| `aria-live="polite"` | 1 | §1 item 4 |

Both scroll regions render as
`<div class="lab-matrix-scroll" role="region" aria-label="…, 좌우로 스크롤 가능" tabindex="0">`.

Truthfulness/disclosure copy (§1 items 11-12), confirmed present in the deployed HTML:

| Page | `연동 예정` | `예시 데이터` | `투자 판단` | `리서치 모듈 준비` |
| --- | --- | --- | --- | --- |
| `/lab/asset-class-returns` | 2 | 3 | 2 | 0 |
| `/lab/congress-stocks` | 2 | 0 | 1 | 3 |
| `/lab/nps-holdings` | 2 | 0 | 1 | 3 |

List semantics (§1 item 5) on `/lab/congress-stocks` and `/lab/nps-holdings`: one
`<ul class="lab-static-preview-grid">` and three `<li class="lab-static-preview-card">` per page.

**One marker explicitly NOT confirmed present, and why.** The empty-cell fallback `aria-label="데이터 없음"`
(part of §1 item 1) matches **0** times in the deployed HTML. This is expected and **not** a defect: the
complete 12×7 example fixture leaves no empty ranking cells, so that fallback branch never renders. Its
presence in Production HTML therefore cannot be — and is not — claimed as verified here. The source-level
assertion for it remains covered by the Phase 4D checker (§3).

### Scope limit of this Production verification

The above is a bounded, unauthenticated HTTP + HTML-marker check. It does **not** cover rendered visual
layout, pointer/touch interaction, real keyboard traversal, screen-reader announcement of the live region, or
dark-mode contrast. Those remain deferred to Phase 4F (§7).

## §7 Deferred Owner QA

`PENDING` — unchanged by this closeout. Authenticated visual/touch/keyboard/screen-reader QA of the Lab page
group (including the new legend-button keyboard controls, the new export status live region, and dark-mode
contrast of the new focus states) remains deferred to the standing **Phase 4F** cross-page Owner QA closeout,
consistent with Phases 4A-4C. This was never in scope for this assistant to perform directly, and the §6
Production verification above — being HTTP/HTML-level only — does not discharge it.

## §8 Final classification

`PHASE_4D_LAB_MERGED_PRODUCTION_VERIFIED`

Phase 4D is closed: implemented, locally validated (§3), merged by the Owner (§5), and Production-verified
within the bounded scope stated in §6. Two items remain open and are tracked elsewhere, neither blocking this
closeout: Phase 4F Owner QA (§7), and the Vercel automatic-deployment-trigger recurrence test on the next
`main` merge (§6).
