# Phase 4B — Market Production Completion (Result v0.1)

Baseline: `origin/main` = `bf27054` (Phase 4A closeout; carries Phase 4A merge commit `53def50`, PR #12).
Branch: `feature/phase-4b-market-production-completion`.

## 1. Status

`PHASE_4B_MARKET_MERGED_PRODUCTION_VERIFIED`. The Owner merged PR #13 (merge commit `60b64dd`); Production
deployment `dpl_GH4fVxWmigqNgq4ajioqV6Cc2VrQ` reached `READY`; the full bounded acceptance sweep (§9) ran
against `https://mkstocklab.vercel.app` and passed in its entirety — all 4 remaining overview periods, all
16 universe×period dashboard combinations, invalid-input/method validation, the raw `/heatmap` 301, and the
full regression set. No Production runtime-error cluster was found. This phase is closed out by this
docs-only branch/PR.

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
- **Merge was Owner-performed.** `gh pr merge` was blocked by this session's safety classifier in the prior
  session (merging into `main` triggers a Production deployment, treated as an Owner-reserved action per
  established project practice — see e.g. `3GG-T-HF3B-HF2-PREMERGE-FINALIZATION`). The Owner merged PR
  [#13](https://github.com/sbchangkyun/mk-stock-lab/pull/13) directly on GitHub. Implementation head
  `1cfc6f417212a0970a37547b5b1702f1e9b29e4b`; merge commit `60b64dde731be60ed5a9a278114234a7e3042126`
  (confirmed via `gh pr view 13 --json state,mergeCommit`: `state=MERGED`, `mergeCommit.oid` matches).
- **Production deployment**: `dpl_GH4fVxWmigqNgq4ajioqV6Cc2VrQ`, immutable URL
  `https://mkstocklab-gi8b6x6jm-sbchangkyun-2946s-projects.vercel.app`, canonical
  `https://mkstocklab.vercel.app`. Verified deployment properties: `source=git`, `target=production`,
  `state=READY`, `readyState=READY`, `aliasError=null`, Git SHA `60b64dde731be60ed5a9a278114234a7e3042126`.
  Remote build completed all stages (`npm run build` → Astro/Vite → Vercel function bundling →
  static-file copy → postbuild → Build Completed → Deployment completed) on Vercel's Linux/ASCII-path
  builder — unaffected by the Windows-local native-build anomaly recorded in §5.

## 9. Production verification — live HTTP results

All requests run sequentially (no parallel requests, no cache-bypass parameters) against
`https://mkstocklab.vercel.app`, spaced ~1-2s apart, after deployment `dpl_GH4fVxWmigqNgq4ajioqV6Cc2VrQ`
reached `READY`.

### 9.1 Already-verified facts (from the independent pre-sweep check, not re-run)

- `GET /market` → HTTP 200; truthful representative-ETF disclosure, 12-tracked-constituent disclosure, and
  configured-weight/non-market-cap disclosure all present; ARIA tab structure present; Treemap title reads
  `추적 종목 Treemap`.
- `GET /heatmap` implements `Astro.redirect('/market', 301)`.
- `GET /api/market/overview.json?period=1d` → HTTP 200, `ok=true`, `period=1d`, 4 proxy entries, overall
  `freshness=fresh`.
- No Vercel runtime-error clusters found pre-sweep for `/market`, `/api/market/overview.json`,
  `/api/market/dashboard.json`, `/api/home/live-market.json`.

### 9.2 Overview — remaining periods (§3A)

| period | status | ok | period matches | proxies | freshness | metrics finite-or-honest-null |
|---|---|---|---|---|---|---|
| 1w | 200 | true | true | 4 | fresh | yes |
| 1m | 200 | true | true | 4 | cached | yes |
| 3m | 200 | true | true | 4 | cached | yes |

No secret/token/key/raw-provider-payload observed in any response body.

### 9.3 Dashboard — 16 universe×period combinations (§3B)

| universe | period | status | ok | universeId match | period match | constituents | breadth.requestedCount | breadth.successfulCount | freshness |
|---|---|---|---|---|---|---|---|---|---|
| kospi200 | 1d | 200 | true | true | true | 12 | 12 | 12 | fresh |
| kospi200 | 1w | 200 | true | true | true | 12 | 12 | 12 | cached |
| kospi200 | 1m | 200 | true | true | true | 12 | 12 | 12 | cached |
| kospi200 | 3m | 200 | true | true | true | 12 | 12 | 12 | cached |
| kosdaq150 | 1d | 200 | true | true | true | 12 | 12 | 12 | fresh |
| kosdaq150 | 1w | 200 | true | true | true | 12 | 12 | 12 | cached |
| kosdaq150 | 1m | 200 | true | true | true | 12 | 12 | 12 | cached |
| kosdaq150 | 3m | 200 | true | true | true | 12 | 12 | 12 | cached |
| sp500 | 1d | 200 | true | true | true | 12 | 12 | 12 | fresh |
| sp500 | 1w | 200 | true | true | true | 12 | 12 | 12 | cached |
| sp500 | 1m | 200 | true | true | true | 12 | 12 | 12 | cached |
| sp500 | 3m | 200 | true | true | true | 12 | 12 | 12 | cached |
| nasdaq100 | 1d | 200 | true | true | true | 12 | 12 | 12 | cached |
| nasdaq100 | 1w | 200 | true | true | true | 12 | 12 | 12 | cached |
| nasdaq100 | 1m | 200 | true | true | true | 12 | 12 | 12 | cached |
| nasdaq100 | 3m | 200 | true | true | true | 12 | 12 | 12 | cached |

All 16/16 passed. `breadth.successfulCount` met the existing render threshold in every row; all `asOf`
values valid; no raw provider response, token, API key, or account/order/trading data observed in any
response body. Vercel's own runtime log for the sweep window (`vercel logs --environment production
--level error`, plus the full unfiltered log for the same window) additionally confirms every one of these
16 requests server-side as `responseStatusCode: 200` with `byStatus:{"ok":12}` and zero `byErrorCode`
entries (per-request `[market-dashboard-diag]` log lines).

### 9.4 Validation and method boundaries (§4)

| check | expected | observed |
|---|---|---|
| `GET /api/market/dashboard.json?universe=invalid&period=1d` | 400 `VALIDATION_FAILED`, `Cache-Control: no-store` | 400, `{"ok":false,"code":"VALIDATION_FAILED"}`, `Cache-Control: no-store` — **match** |
| `GET /api/market/dashboard.json?universe=kospi200&period=invalid` | 400 `VALIDATION_FAILED`, `Cache-Control: no-store` | 400, `{"ok":false,"code":"VALIDATION_FAILED"}`, `Cache-Control: no-store` — **match** |
| `POST /api/market/dashboard.json?universe=kospi200&period=1d` (no `Origin` header) | — | 403 `Cross-site POST form submissions are forbidden` — Astro's built-in cross-site-POST guard (platform safeguard, not this route), confirmed via server log `responseStatusCode:403` |
| `POST /api/market/dashboard.json?universe=kospi200&period=1d` (same-origin `Origin` header, simulating a real same-site request) | 405 `VALIDATION_FAILED`, `Cache-Control: no-store` | 405, `{"ok":false,"code":"VALIDATION_FAILED"}`, `Cache-Control: no-store` — **match** |

The route's own method-validation behaves exactly as specified once a same-origin request reaches it;
Astro's default anti-CSRF guard intercepting an `Origin`-less cross-site POST earlier in the chain is
expected platform behavior, not a Phase 4B defect.

### 9.5 Route acceptance (§5)

- `GET /heatmap` (auto-redirect disabled) → raw HTTP 301, `Location: /market`.
- `GET /market` → HTTP 200.

### 9.6 Regression acceptance (§6)

| route | expected | observed |
|---|---|---|
| `GET /api/home/live-market.json` | 200, `ok=true`, `ticker.length=9`, `snapshot.length=9` | 200, `ok=true`, ticker 9, snapshot 9 — **match** |
| `GET /api/news/home.json` | 200, `ok=true`, `articles.length>=1`, valid `feedMode` | 200, `ok=true`, 6 articles, `feedMode=latest` — **match** |
| `GET /api/admin/operations/overview.json` (no auth) | 401 `AUTH_REQUIRED`, `Cache-Control: no-store` | 401, `{"ok":false,"code":"AUTH_REQUIRED","message":"로그인이 필요합니다."}`, `Cache-Control: no-store` — **match** |
| `GET /chart-ai` | 200 | 200 |
| `GET /portfolio` | 200 | 200 |
| `GET /lab` | 200 | 200 |
| `GET /admin/operations` | 200 | 200 |

No public-navigation regression observed.

### 9.7 Runtime error review (§7)

`vercel logs --project mkstocklab --environment production --since 20m --json` (single query, not
repeatedly polled) covering the entire acceptance-sweep window plus deployment activation returned 51 log
lines for deployment `dpl_GH4fVxWmigqNgq4ajioqV6Cc2VrQ`. Every entry is `level:"info"`; zero entries at
`level:"error"`/`"warning"`/`"fatal"`; the only non-2xx entries are the deliberately-triggered `400` (×3),
`403` (×1, the Astro CSRF guard above), `405` (×1), and `401` (×1) validation/auth checks — no unexpected
5xx or error-level entry anywhere in the window.

**`NO_PHASE_4B_PRODUCTION_RUNTIME_ERROR_CLUSTER`**

### 9.8 Defect handling (§8)

Not applicable — all 16 dashboard combinations, all 4 overview periods, all validation/method checks, the
redirect, and the full regression set passed. No hotfix branch required.
