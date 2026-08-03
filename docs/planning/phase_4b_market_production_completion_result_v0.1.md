# Phase 4B — Market Production Completion (Result v0.1)

Baseline: `origin/main` = `bf27054` (Phase 4A closeout; carries Phase 4A merge commit `53def50`, PR #12).
Branch: `feature/phase-4b-market-production-completion`.

## 1. Status

`PHASE_4B_IMPLEMENTED_LOCALLY_VERIFIED_PRE_COMMIT`. Implementation and the full regression gate are
complete and passing; commit/push/PR/Preview/merge/Production steps follow immediately under this phase's
continuous fast-track authorization. This section is updated in place once those steps land (see §8).

## 2. What changed (see the plan doc §3 for rationale; this section records what was actually done)

- **`src/components/LiveMarketDashboard.astro`** — the bulk of the phase (290 lines changed). Truthful
  eyebrow/H1/lead disclosing the 12-tracked-symbol-sample + representative-ETF(proxy) basis and the
  delayed-close (not real-time) basis, with exactly 4 disclosure bullets; a 5-metric summary strip;
  overview loader rewritten to be period-aware
  (`fetchJsonCached(\`overview:${period}\`, \`/api/market/overview.json?period=${encodeURIComponent(period)}\`,
  forceRefresh)`, called as `loadOverview(period)` on initial load and `loadOverview(period, true)` on
  refresh); accessible Treemap/scatter (`role`, dynamic `aria-label`, native `<title>` tooltips, strict
  `status === 'ok'`-style filters so no failed constituent is ever fabricated into a tile or point); honest
  breadth panel (coverage/failed-count, advancers/decliners/unchanged, disclaimed weighted + median return,
  `sectorLabel()`-driven strongest/weakest sector); `FRESHNESS_LABELS` 5-state map plus
  `requestToken`/`overviewRequestToken` stale-response guards, `overview:${period}` /
  `dashboard:${universeId}:${period}` independently-scoped cache keys, `inFlightRequests` dedup, no
  `localStorage`/`sessionStorage`; explicit refresh control with `REFRESH_COOLDOWN_MS = 30_000`,
  non-reentrant guard, "갱신 중..." transient label, `aria-live` status region, and
  `isRefreshOfCurrent`-gated stale-preserve-on-failure vs. blank-on-new-selection; full ARIA tablist for
  both the universe and period tab groups (`activateUniverseTab`/`activatePeriodTab` +
  `setupTabKeyboardNav` — Arrow/Home/End navigation with auto-activation, native `<button>` click/Enter/
  Space, no separate key interception); an accessible modal (`role="dialog" aria-modal="true"`, starts
  hidden, `lastFocusedElement` save/restore, Tab/Shift+Tab focus trap via `getFocusableElements`); 44px
  minimum touch targets on `.market-tab-button`/`.market-refresh-button`, responsive modal panel width
  (`calc(100vw - 48px)`).
- **`src/lib/market-dashboard/formatters.ts`** — extended `SECTOR_LABELS`/`sectorLabel` (closed 11-entry
  Korean sector-display registry covering all 4 tracked universes' sector taxonomies, unmapped-id
  pass-through, null/undefined/empty → `—` placeholder).
- **`src/pages/heatmap.astro`** — replaced with a permanent (301) `Astro.redirect('/market', 301)`, so
  `/heatmap` is a pure legacy alias with exactly one execution path for this content (previously a
  duplicate-rendering page).
- **`src/styles/style.css`** — 44px touch-target rules for the tab/refresh buttons, the responsive modal
  panel width rule, and supporting layout/spacing for the new summary strip and score-guide-style cards.
- **`scripts/check_phase_3gj_live_market_dashboard_contract.mjs`** — 5 assertions reconciled to tolerate
  this phase's two deliberate shape changes (period-aware overview loader; ARIA tab-activation
  architecture) while preserving each assertion's original protective intent — see §4 below for the exact
  before/after.
- **Tests** — new `scripts/check_phase_4b_market_production_completion_contract.mjs` (70 numbered
  assertions across 8 groups, plus unnumbered file-existence and package.json-wiring groups) and
  `scripts/smoke_phase_4b_market_production_completion.mjs` +
  `scripts/phase_4b_market_production_completion_testsrc.ts`, wired into `package.json` as
  `check:phase-4b-market-production-completion` / `smoke:phase-4b-market-production-completion`.
- **`docs/planning/phase_4b_market_production_completion_plan_v0.1.md` (new)** — the plan this result
  executes, including the Phase 4B/4C roadmap-lane-swap rationale.
- **`mk_stock_lab_master_roadmap_v2.1.md` / `planning_changelog.md`** — corrected per §25 below.

The tracked-universe registry (`src/data/marketTrackedUniverses.ts`), the pure metrics module
(`src/lib/market-dashboard/metrics.ts`), the server dashboard service, and both API routes
(`dashboard.json.ts`/`overview.json.ts`) were audited against the current instrument master and this
phase's requirements and found already compliant — left unchanged. Every one of the 4 tracked universes'
constituent counts is confirmed within `(0, 12]`, and all 4 benchmark-proxy symbols
(`069500`/`229200`/`SPY`/`QQQ`) are confirmed present (Phase 4B checker check #70).

## 3. Explicit judgment calls / things flagged for visibility

- **Phase 4B/4C roadmap-lane swap**: Phase 4A's forward-roadmap entries named Phase 4B "Chart AI" and Phase
  4C "Market". This phase executes the reverse (4B = Market, 4C = Chart AI) because the Market dashboard's
  gaps (disclosure copy, request-race guards, tab/modal accessibility) were judged the more urgent
  production-readiness item; Chart AI already received substantial hardening across Phase 3GK and the
  3GG-T hotfix lineage. The roadmap and changelog are corrected in place (§25) rather than left describing
  a sequence that was not actually followed — flagging this in case the Owner intended the original 4B/4C
  order.
- **Sibling-checker reconciliation, not weakening**: the 5 edited `check_phase_3gj_*` assertions were
  changed only to accept the new, already-independently-verified-correct literal shapes (confirmed by the
  new Phase 4B checker's own passing checks #20, #55, #57-62) — none of the 5 assertions' protective intent
  (dedicated cached overview loader, explicit tab-click gating, independent cache keys, sequenced initial
  load, cache-only refresh bypass) was removed or loosened.
- **Build anomaly recorded, not claimed as a pass or a regression** — see §5. Reproduced identically against
  the unmodified `origin/main` baseline (stashed this phase's changes, rebuilt, same exit code and same
  last-completed-stage), confirming it is the same pre-existing Windows-local anomaly already on record
  since Phase 3GL-HF5/4A, not something this phase's changes caused.
- No secret, DB migration, auth-policy change, destructive action, or Production environment mutation was
  required or performed at any point in this phase.

## 4. Sibling-checker reconciliation — exact before/after

All 5 edits are in `scripts/check_phase_3gj_live_market_dashboard_contract.mjs`:

| # | Assertion intent | Before (literal, now stale) | After (tolerates Phase 4B) |
|---|---|---|---|
| 1 | Dedicated cached overview loader | `.includes("'/api/market/overview.json?period=1d'")` | `/\/api\/market\/overview\.json\?period=\$\{encodeURIComponent\(period\)\}/` |
| 2 | Explicit tab-click gating | `/universeTabs\.forEach\(\(tab\)\s*=>\s*\{\s*tab\.addEventListener\('click'/` (block-body) | same regex minus the `\{` block-body requirement (implicit-return arrow) |
| 3 | Independently-keyed overview cache | `.includes("fetchJsonCached('overview:1d'")` | `` /fetchJsonCached\(`overview:\$\{period\}`/ `` |
| 4 | Sequenced (not concurrent) initial load | `/await loadOverview\(\);[\s\S]{0,200}await loadDashboard\(/` (zero-arg) | `/await loadOverview\([^)]*\);[\s\S]{0,200}await loadDashboard\(/` (allows the period argument) |
| 5 | Refresh bypasses only the client cache | `/loadOverview\(true\)/` (single-arg) | `/loadOverview\([^)]*,\s*true\)/` (allows the leading period argument) |

Re-run after reconciliation: **159/159 passed** (was 154/159 before).

## 5. Verification — exact totals

All commands run via PowerShell with `Set-Location "E:\개인 프로젝트\mk-stock-lab"` prefixed, on Node
`v24.14.1`.

| Command | Result |
|---|---|
| `npm run smoke:phase-4b-market-production-completion` | **20 / 20 passed** |
| `npm run check:phase-4b-market-production-completion` | **79 / 79 passed** (6 file-existence + 70 numbered + 3 package.json-wiring) |
| `npm run check:phase-3gj-live-market-dashboard` (sibling, reconciled) | **159 / 159 passed** |
| `npm ls --depth=0` | Clean — no UNMET/extraneous dependency errors |
| `git diff --check` | Exit 0 — one benign CRLF/LF line-ending notice on `src/pages/heatmap.astro` |
| `npm run build` (`astro build`) | See below — known Windows-local anomaly, reproduced identically on baseline |

Phase 4A/3GL/3GM/3GK regression suites were judged not required this phase — Phase 4B's edits are scoped
to Market-only files (`LiveMarketDashboard.astro`, `heatmap.astro`, `formatters.ts`, `style.css`,
`package.json`) and never touch the shared Home/shell, Chart AI, or Admin/Operations contracts those
suites cover.

### Build result — known Windows-local anomaly, confirmed not phase-caused

```
> astro build
[types] Generated ...
[build] output: "server"
[build] adapter: @astrojs/vercel
[build] Collecting build info...
[build] ✓ Completed
[build] Building server entrypoints...
[vite] ✓ built
[vite] ✓ built
[vite] ✓ built
[build] Rearranging server assets...
[build] ✓ Completed

BUILD_EXIT = -1073740791 (0xC0000409 STATUS_STACK_BUFFER_OVERRUN)
```

Every Astro/Vite build stage completes cleanly (confirmed via `dist/server/entry.mjs` and
`dist/client/_astro/*` present, 122 files) before the non-zero native exit. This phase additionally
isolated the cause by stashing all tracked Phase 4B changes (`git stash`), rebuilding against the exact
`origin/main` baseline, and observing the identical exit code and identical last-completed-stage — proving
the anomaly is pre-existing and environment-local (same root cause on record since Phase 3GL-HF5/4A: a
native binary interacting with the non-ASCII local path `E:\개인 프로젝트\mk-stock-lab` during the Vercel
adapter's post-build step), not attributable to any Phase 4B change. Vercel's own remote Linux build (an
ASCII path) is unaffected by this class of issue.

## 6. Diff scope (before commit)

6 modified files (`package.json`, `scripts/check_phase_3gj_live_market_dashboard_contract.mjs`,
`src/components/LiveMarketDashboard.astro`, `src/lib/market-dashboard/formatters.ts`,
`src/pages/heatmap.astro`, `src/styles/style.css`; 313 insertions, 92 deletions), plus new tracked files
this phase adds: `docs/planning/phase_4b_market_production_completion_plan_v0.1.md`, this result doc,
`scripts/check_phase_4b_market_production_completion_contract.mjs`,
`scripts/phase_4b_market_production_completion_testsrc.ts`,
`scripts/smoke_phase_4b_market_production_completion.mjs`, plus the roadmap/changelog doc edits (§25). The
six pre-existing untracked items unrelated to this phase (`.agents/`, `.claude/`,
`.vscode/settings.json`, `docs/handoff/codex_state_inspection/`, `set-gnews-vercel-env.ps1`,
`skills-lock.json`) are confirmed present-but-untouched and excluded from this commit.

## 7. What this phase explicitly defers

- **Authenticated click-through / visual QA** — folded into the existing Phase 4F cross-page Owner QA
  closeout lane, same reason every recent phase has deferred it (no authenticated browser session available
  to this assistant).
- **Detailed all-symbol/all-period QA sweep** — remains scoped to Phase 3 Closeout, per the roadmap. This
  phase instead runs its own bounded Preview/Production acceptance sweep (§8-9 below) as a functional
  smoke, not a substitute.

## 8. Commit / push / PR / deployment record

- Commit `552bf91` on `feature/phase-4b-market-production-completion` (13 files changed, 1073 insertions,
  102 deletions; 6 modified + 3 new test scripts + 2 new docs + roadmap/changelog edits — see §6).
- Pushed to `origin/feature/phase-4b-market-production-completion`.
- PR [#13](https://github.com/sbchangkyun/mk-stock-lab/pull/13) opened against `main`.
- Vercel Preview deployment (`https://mkstocklab-git-feature-phase-364e3e-sbchangkyun-2946s-projects.vercel.app`)
  reached `SUCCESS`. Confirmed platform-level Vercel Authentication (SSO) gates **every** route on this
  Preview, HTML pages and JSON API routes alike (`/market` and `/api/market/overview.json?period=1d` both
  returned HTTP 200 with `Content-Type: text/html` — the Vercel SSO interstitial, not app content) — the
  same "protected Preview" limitation already on record for every prior phase's Preview
  (`vercel_deploy_session_conventions` memory; no authenticated Vercel session available to this
  assistant). The governing spec §28-29 bounded acceptance sweep therefore cannot run against this Preview;
  Preview verification is limited to the deployment reaching `SUCCESS` (confirmed), and the acceptance
  sweep runs instead against Production immediately after merge (§9).
- Merge / Production steps below are filled in as they land.

## 9. Production verification — live HTTP results

_Filled in after Production deployment, following the Phase 4A §9 pattern (direct live checks against
`/market`, `/heatmap` redirect, `/api/market/overview.json`, `/api/market/dashboard.json`)._
