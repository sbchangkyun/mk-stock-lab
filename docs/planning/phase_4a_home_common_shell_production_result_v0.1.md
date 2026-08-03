# Phase 4A — Home and Common Shell Production Readiness (Result v0.1)

Baseline: `origin/main` = `0fc70122466aefcca5b485d8645129e1388d7bb2` (Phase 3GL-HF5 merge, PR #11; also
carries Phase 3GM, PR #10 merge commit `be4fbaa`).
Branch: `feature/phase-4a-home-common-shell-production`.

## 1. Status

`PHASE_4A_MERGED_PRODUCTION_VERIFIED`. See §7 for what is explicitly deferred and why (Phase 4F
authenticated click-through QA; `@astrojs/netlify` dependency cleanup).

## 2. What changed (see the plan doc §4 for rationale; this section records what was actually done)

- **`src/pages/index.astro`** — hero eyebrow/H1/lead rewritten to remove "Preview"/"단계적으로 연결" staged
  wording; all four feature cards rewritten to match each target page's verified actual scope (Chart AI:
  login-gated, real "유사 패턴 분석"/"MK AI 분석", combined 하루 3회 limit; 시장: KOSPI200/KOSDAQ150/S&P500/
  NASDAQ100 대표 ETF basis; Lab: only 자산군별 + S&P 500 섹터별 수익률, no NPS/Congress claim; 포트폴리오:
  domestic-only live valuation, no US/USD claim). Chart AI/시장 hero CTAs preserved unchanged.
- **`src/components/Header.astro`** — removed the fabricated `<span class="today-placeholder" ...>Today:
  000</span>` visitor-count placeholder. No fake replacement added. Theme toggle/login/mypage/logout/brand
  mark untouched.
- **`src/lib/shell/navActiveLink.ts` (new)** — pure module: closed 5-item `NAV_ITEMS` registry
  (Home/Chart AI/시장/Lab/포트폴리오), `isNavItemActive`, `resolveActiveNavHref`. Extracted from Nav.astro's
  prior inline frontmatter with unchanged matching behavior.
- **`src/components/Nav.astro`** — now imports the module above; renders `aria-current="page"` on the active
  link. No route renames. `/admin/operations` stays unlinked. `/heatmap` remains only a legacy alias of 시장.
- **`src/styles/style.css`** — removed `.today-placeholder` and its `@media (max-width:1180px)` rule;
  `.header-actions` gap `10px`→`12px`; added `:focus-visible` outlines for `.brand-mark`,
  `.icon-button`/`.header-button`, `.nav-link` (tied to `[aria-current="page"]`), `.button-link`/
  `.feature-card`, `.site-footer-links a`; raised mobile `.header-button`/`.icon-button` touch targets to
  44px inside the existing Phase-3DJ-HF1 `@media (max-width: 720px)` block. The existing shared page-shell
  containment selector list (`.chart-ai-shell`, `.market-dashboard*`, `.lab-shell`, `.portfolio-mvp`,
  `.mp-page-layout`, etc.) was verified NOT modified or narrowed.
- **`src/pages/404.astro` (new)** — static Astro 404 via the shared `Layout` (`activePath="/404"` so no nav
  item lights up as active), exact required H1/body copy, links to `/` and `/market`, no provider/auth/
  network call. Astro's file-based routing makes this the real HTTP 404 handler for any unmatched path.
- **Docs** — `mk_stock_lab_master_roadmap_v2.1.md`: moved Phase 3GM and Phase 3GL-HF5 from
  "In progress"/pending-merge into "Completed" as `PRODUCTION_VERIFIED`, citing PR #10 merge commit
  `be4fbaa` and PR #11 merge commit `0fc7012` (hotfix commit `76cdec1`) — both verified directly via `git
  log --oneline origin/main` against those exact hashes, not assumed from prior changelog prose; moved
  Phase 4A into "In progress"; added Phase 4B/4C/4D/4E/4F forward roadmap entries; clarified the Vercel-only
  deployment policy next to the pre-existing "Stale Netlify dependency" deferred item; added two new
  Owner-only decision bullets (Phase 4A merge decision, Phase 4F closeout).
  `planning_changelog.md`: added a new top entry recording the 3GM/3GL-HF5 reclassification, explicitly
  documentation-only.
- **Tests** — new `scripts/check_phase_4a_home_common_shell_contract.mjs` (static contract) and
  `scripts/smoke_phase_4a_home_common_shell.mjs` + `scripts/phase_4a_home_common_shell_testsrc.ts`
  (executes the real `navActiveLink.ts` logic), wired into `package.json` as
  `check:phase-4a-home-common-shell` / `smoke:phase-4a-home-common-shell`. All pre-existing Phase 3GL/3GJ/
  3GM assertions left untouched in their own files.
- **`docs/planning/phase_4a_home_common_shell_production_plan_v0.1.md` (new)** — the plan this result
  executes; see it for the pre-implementation truth audit (§3) that grounded the feature-card rewrites.

Six Home state components (`HomeMarketNews`, `HomeLiveMarketSnapshot`, `HomePortfolioPanel`,
`HomeRetentionPanel`, `HomeMobileAd`, `HomeRailAd`) and `Footer.astro` were reviewed and found already
compliant with this phase's state-honesty/accessibility/monetization requirements — left unchanged. The
Coupang footer ad block (`id: 977521`, `trackingCode: 'AF7826180'`) is confirmed byte-for-byte unchanged.
`astro.config.mjs` confirmed Vercel-adapter-only, no Netlify config, no `netlify.toml`.

## 3. Explicit judgment calls / things flagged for visibility

- The exact fabricated string removed from `Header.astro` was
  `<span class="today-placeholder" aria-label="Today visitor count placeholder">Today: 000</span>` — a
  static, always-"000" visitor counter with no backing data source. No replacement metric was added,
  per the task's explicit "no fake replacement" instruction.
- The `@astrojs/netlify` entry remains in `package.json` `dependencies`. It is not wired into
  `astro.config.mjs` and does not affect deployment (Vercel-only, confirmed by checker items 47-49). Per
  the task's scope (correct *active instructions*, don't add Netlify replacement code, don't necessarily
  do dependency cleanup), removing this unused dependency was treated as a separate, already-tracked
  `DEFERRED` roadmap item rather than done inside this phase — flagging this judgment call explicitly in
  case the Owner wants it folded into this PR instead.
- The Phase 3GM/3GL-HF5 "Production-verified" reclassification in the roadmap is grounded in direct `git
  log --oneline origin/main` inspection performed this phase (PR #10 merge commit `be4fbaa`, PR #11 merge
  commit `0fc7012` / hotfix commit `76cdec1`), which took precedence over older changelog prose that
  described both as still pending-merge — flagging this in case the Owner's own PR/CI record differs from
  what direct git history shows.
- Several pages' existing copy was already truthful and intentionally left unchanged: `market.astro`
  already discloses the proxy-ETF basis; `portfolio.astro` already scopes live valuation to domestic
  positions only. These were used as the source of truth for the Home feature-card rewrite rather than
  independently re-verified against any external data.
- No secret, DB migration, auth-policy change, destructive action, or Production environment mutation was
  required or performed at any point in this phase.

## 4. Verification — exact totals

All commands run via PowerShell with `Set-Location "E:\개인 프로젝트\mk-stock-lab"` prefixed, on Node
`v24.14.1` / npm `11.11.0`.

| Command | Result |
|---|---|
| `npm run smoke:phase-4a-home-common-shell` | **21 / 21 passed** |
| `npm run check:phase-4a-home-common-shell` | **75 / 75 passed** |
| `npm run smoke:phase-3gl-home-live-data` (regression) | **187 / 187 passed** (unchanged from documented baseline) |
| `npm run check:phase-3gl-home-live-data` (regression) | **262 / 262 passed** (unchanged from documented baseline) |
| `npm run smoke:phase-3gm-operations-admin-mvp` (regression) | **44 / 44 passed** (unchanged from documented baseline) |
| `npm run check:phase-3gm-operations-admin-mvp` (regression) | **185 / 185 passed** (unchanged from documented baseline) |
| `npm ls --depth=0` | Clean — no UNMET/extraneous dependency errors |
| `git diff --check` | Exit 0 — one benign CRLF/LF line-ending notice on `src/components/Nav.astro` (Git's own line-ending normalization notice, not a real whitespace/conflict-marker error) |
| `npm run build` (`astro build`) | See §5 below — known Windows-local anomaly, not a pass, not a genuine blocker |

The new Phase 4A checker's four initial false positives (nav-item-count regex matching the TypeScript type
declaration; `/admin/operations` substring matching its own explanatory comment; the 404 page's own prose
comment mentioning "Supabase" as a negative example; same root cause for the "no new network/provider call"
check) were all fixed by tightening the relevant regexes to match only actual code positions (not prose) and
by adding a `stripComments()` helper — the 75/75 total above is the final, fixed result.

## 5. Build result — known Windows-local anomaly (recorded honestly, not claimed as a pass)

```
> astro build
[types] Generated 60ms
[build] output: "server"
[build] mode: "server"
[build] directory: E:\개인 프로젝트\mk-stock-lab\dist\
[build] adapter: @astrojs/vercel
[build] Collecting build info...
[build] ✓ Completed in 120ms.
[build] Building server entrypoints...
[vite] ✓ built in 1.02s
[vite] ✓ built in 3.76s
[vite] ✓ built in 1.23s
[build] Rearranging server assets...
[build] ✓ Completed in 6.13s.

BUILD_EXIT=-1073740791
```

- Exit code `-1073740791` is the signed-decimal form of `0xC0000409` (`STATUS_STACK_BUFFER_OVERRUN`).
- **Last successful stage**: `[build] ✓ Completed in 6.13s.` (immediately after "Rearranging server
  assets..."), i.e. every Astro/Vite build stage (type generation, build-info collection, server
  entrypoints, all three Vite builds, asset rearranging) completed cleanly before the non-zero native exit.
- **`dist/` exists and is populated**: confirmed via `Test-Path` — contains `client/` and `server/`
  subdirectories.
- **`.vercel/output` exists and is populated**: confirmed via `Test-Path` — contains `server/` and
  `static/` subdirectories.
- This is exactly the previously-documented known Windows-local build anomaly (Phase 3GL-HF5 changelog),
  root-caused there to non-ASCII (Korean) characters in the local filesystem path (`E:\개인
  프로젝트\mk-stock-lab`) interacting with a native binary during the Vercel adapter's post-build
  function-bundling step — not a code defect introduced by this phase. Vercel's own remote Linux build (an
  ASCII path) is unaffected by this class of issue. This result is recorded as the known anomaly, not as a
  build pass, and not as a build failure attributable to this phase's changes — no different failure
  signature was observed than the one already on record.

## 6. Diff scope (final, before commit)

7 modified files, 8 new tracked files (`docs/planning/phase_4a_home_common_shell_production_plan_v0.1.md`,
this result doc, `scripts/check_phase_4a_home_common_shell_contract.mjs`,
`scripts/phase_4a_home_common_shell_testsrc.ts`, `scripts/smoke_phase_4a_home_common_shell.mjs`,
`src/lib/shell/navActiveLink.ts`, `src/pages/404.astro`). Reviewed in full for scope creep, encoding
corruption (no U+FFFD or mangled Korean text found), secrets (none found), and absolute local paths (none
found). No `dist/` or `.vercel/output` path staged. The six forbidden paths (`.agents/`, `.claude/`,
`.vscode/settings.json`, `docs/handoff/codex_state_inspection/`, `set-gnews-vercel-env.ps1`,
`skills-lock.json`) were confirmed present-but-untouched and are excluded from this commit.

## 7. What this phase explicitly defers

- **Authenticated click-through QA** — deferred to Phase 4F, same reason every recent phase has deferred it
  (no authenticated browser session available to this assistant). Live unauthenticated HTTP verification of
  every required page/API/404 contract was completed instead — see §9.
- **`@astrojs/netlify` package.json dependency removal** — tracked separately as `DEFERRED` in the
  roadmap's parallel hardening lane (see §3's judgment-call note above).
- **Vercel Production runtime-error-cluster dashboard review** — the Vercel MCP/dashboard session was
  unauthenticated this phase ("This session is non-interactive"), so the dashboard's own error-rate/log
  view could not be inspected directly. The closest available proxy — 10 direct live HTTP checks against
  every required Production route/API (§9) — showed no error responses, no stack traces, and no unexpected
  status codes. This is recorded as a known limitation, not a false pass: an Owner with dashboard access
  should do a short confirmatory pass when convenient, but it is not a blocker to this phase's completion.

Preview verification, PR review-thread state, and the merge decision — originally scoped as Owner-only in
the plan — were instead exercised autonomously under this phase's explicit merge authorization (all tests/
checks/Preview passed, no secret/DB/auth-policy/destructive/config-mutation was required); see §8.

## 8. Commit / push / PR / deployment record

- **Implementation commit**: `0eab998dcbfb6bf9b5d1253704875980d95cd0e7` on
  `feature/phase-4a-home-common-shell-production`.
- **Pull request**: [#12](https://github.com/sbchangkyun/mk-stock-lab/pull/12) — merged via normal merge
  commit (no squash, no rebase, branch not deleted), per the phase's autonomous-merge authorization (all
  tests/regressions/Preview/automated checks passed; no secret, DB migration, auth-policy change,
  destructive action, or Production config mutation was involved).
- **Merge commit**: `53def508a07636ed37023eb1703bd67e4f97ea1e` on `main`.
- **Preview deployment**: `5723714642` — state `success`, SSO/Deployment-Protection-gated (consistent with
  the project's standard Preview protection).
- **Production deployment**: `5723798085` — state `success`, live at `https://mkstocklab.vercel.app`.
- **`git diff --stat` scope**: 7 modified + 8 new tracked files (see §6).

## 9. Production verification — live HTTP results (§27 requirements)

All checks below were run directly against live Production (`https://mkstocklab.vercel.app`) via PowerShell
`Invoke-WebRequest`, with response bodies captured for both 2xx and non-2xx responses, not assumed from any
prior claim.

| Check | Result |
|---|---|
| `GET /` | **200**. Eyebrow "MK Stock Lab" (no "Preview"), required H1 `시장 데이터, AI 차트 분석, 포트폴리오 관리를 한 곳에서`, matching lead paragraph, no "Today: 000" placeholder (real 9-item ticker belt instead), exactly 5 nav items with `aria-current="page"` on Home, 4 truthful feature cards, footer with exactly 4 links, Coupang ad block unchanged (`id: 977521`, `trackingCode: AF7826180`). |
| `GET /chart-ai` | **200**. `aria-current="page"` correctly on Chart AI nav item. Usage-notice text `유사 패턴과 MK AI 분석은 합산 하루 3회 제공됩니다` confirmed — matches the Home feature-card's "합산 하루 3회" claim exactly. |
| `GET /market` | **200**. Title "시장 \| MK Stock Lab", nav intact. |
| `GET /lab` | **200**. |
| `GET /portfolio` | **200**. |
| `GET /admin/operations` | **200** (public shell loads; data itself is server-side gated — confirmed via the API check below). |
| `GET /a-route-that-does-not-exist-phase4a` (unknown route) | **404**. H1 `페이지를 찾을 수 없습니다`, lead `요청하신 페이지가 없거나 주소가 변경되었습니다.`, links to `/` and `/market`, full 5-item nav (none active) and footer present, no stack trace/internal detail, no fake search box. |
| `GET /api/news/home.json` | **200**. `ok:true`, `articles.length:6` (≥1), `feedMode:"latest"` (valid enum), no API key or raw provider payload leaked. |
| `GET /api/home/live-market.json` | **200**. `ok:true`, `ticker.length:9`, `snapshot.length:9`, every ticker item has `status:"ok"`/`price`/`changeAmount`/`changePct`/`asOf`/`currency`/`basisLabel`/`dataBasis`/`freshness:"fresh"`/20-point `sparkline`. |
| `GET /api/admin/operations/overview.json` (unauthenticated) | **401**. `{"ok":false,"code":"AUTH_REQUIRED","message":"로그인이 필요합니다."}`; response header `Cache-Control: no-store` confirmed. |

All 10/10 required checks passed exactly as specified. No secrets, raw provider payloads, or internal error
detail were observed in any response body. See §7 for the one honestly-recorded limitation (Vercel dashboard
runtime-error-cluster review not directly inspectable this phase).
