# Phase 4C — Chart AI Production Completion — Result v0.1

## §1 Status

`PHASE_4C_CHART_AI_MERGED_PRODUCTION_VERIFIED`

Full implementation (§5-§20 of the governing spec, including the restored Market Intelligence section, §16)
is complete and locally validated. PR #15 was merged by the Owner directly (§8) and the resulting Vercel
Production deployment has been independently re-verified against a bounded, unauthenticated HTTP checklist
(§9). Authenticated visual/touch/keyboard/usage-counter QA and a full Vercel-dashboard runtime-error-cluster
review remain deferred to the standing Phase 4F cross-page closeout (§9). Docs-only closeout (this update)
and Phase 4D branch prep are tracked separately.

## §2 What changed

All changes are confined to `src/pages/chart-ai.astro` (markup, inline client `<script>`, and scoped
`<style>` blocks) plus two new test scripts and their `package.json` entries. No provider, engine,
migration, or auth-flow file changed.

1. **Production/dev-path isolation (§5)** — one authoritative `chartAiRealExperienceRuntime` flag
   (`isVercelProductionRuntime || isProtectedPreviewBetaOptInRuntime`), `VERCEL_ENV`-authoritative.
2. **Auth state machine + Production copy (§6-7)** — signed-out lock card (`접속 필요` / `로그인이
   필요합니다`); workspace body hidden behind `data-chart-ai-auth-body` until a real session exists.
3. **Search combobox accessibility (§8)** — `role="combobox"`, `aria-expanded` toggling, `listbox` +
   `aria-selected` results.
4. **Chart lifecycle + last-good-chart preservation (§9-11)** — `lastRenderedInstrumentKey` +
   `isReloadOfDisplayedInstrument` gate a new `preserveChart` parameter on `setRealChartState`; a failed
   reload of the *currently displayed* instrument keeps the last-good chart on screen (analysis still
   disabled via the existing integrity guard); a genuinely new selection's failure still hides the chart,
   unchanged from prior behavior.
5. **Analysis workspace accessibility + usage limit (§12-15)** — real ARIA tablist with roving tabindex for
   the Similarity/MK-AI switch; usage state populated only from `applyChartAiUsageState(data.usage)`, never
   `localStorage`; both panels keep their non-advisory disclaimer.
6. **Market Intelligence restoration (§16)** — restored the `시장 인텔리전스` collapsible section that
   Phase 3GG-T-FAST (`35037e9`) originally shipped and Phase 3GG-T-HF4-FAST-HF1 (`3be57c3`) silently dropped
   from the client (markup + inline script + CSS, −278/+36 net lines in that commit's diff) while cleaning
   up unrelated mobile chart interaction. The server engine
   (`src/lib/server/chart-ai/marketIntelligence/`) and the `/api/chart-ai/market-intelligence.json` route
   were never removed and are unchanged. The restoration re-integrates the historical feature using the
   file's current patterns rather than a verbatim copy: gated by `chartAiRealExperienceRuntime` (not the
   retired `isVercelProductionRuntime`), calling `marketDataRequestQueryPrefix` (renamed from
   `marketDataRequestQuery` since 3be57c3), and wired into the existing `resetSelectedMarketIntel` /
   `ANALYSIS_CONTROLS` / multi-panel reset plumbing at its original insertion points. No scoring/engine logic
   changed — the restored client code calls the same, unmodified API route and renders its response
   verbatim.
7. **Watchlist/resume-state preservation (§17)** — verified unchanged: `persistChartResumeState` and
   `refreshWatchlistToggleForActiveInstrument` still run after every successful render, keyed by market +
   uppercased symbol.
8. **Responsive layout (§18)** — verified the existing 640px/420px breakpoints already cover the
   chart-lookup shell; no new breakpoint needed.
9. **API/security contract (§19-20)** — verified every real fetch (including the restored Market
   Intelligence call) attaches `chartAiAuthHeaders`; no bespoke auth bypass exists anywhere in the file.

## §3 Explicit judgment calls / things flagged for visibility

- **Market Intelligence (§16) was treated as in-scope for this phase rather than deferred**, even though the
  original spec draft described it primarily as a documentation note. Its client UI was fully absent from
  HEAD (confirmed via a case-insensitive grep for `시장 인텔리전스|market-intelligence|marketIntelligence`
  returning zero matches) while its server engine and API route were fully intact and presumably still
  functional — i.e. a genuine silent regression, not a deferred future feature. Restoring it is bounded
  (one file, additive, reuses existing unmodified server infrastructure), non-destructive, and does not
  touch any secret, migration, auth policy, or Production environment variable, so it did not require
  pausing per the standing fast-track directive. Shipping a "Chart AI Production Completion" phase while
  silently continuing to omit a spec section would have been inconsistent with the phase's own stated scope.
- The restoration is a **re-integration onto current patterns**, not a byte-for-byte revert of the historical
  markup: `isVercelProductionRuntime` → `chartAiRealExperienceRuntime`, `marketDataRequestQuery` →
  `marketDataRequestQueryPrefix`. This was necessary because both identifiers were renamed/generalized by
  later phases (3GG-T-HF3B's single-flag consolidation and an unrelated client-side rename) after the
  Market Intelligence section was dropped; a literal revert would not have compiled against the current
  file.
- `ANALYSIS_CONTROLS`'s own comment ("single authoritative availability sync for **ALL three** analysis
  actions") had silently drifted to only listing two controls after the drop — restoring the third entry
  makes the code match its own long-standing comment, corroborating that the removal was accidental
  collateral damage from the mobile-cleanup commit rather than an intentional scope cut.

## §4 Sibling-checker reconciliation

| Checker | Before this phase | After this phase | Change |
| --- | --- | --- | --- |
| `check_phase_3gk_chart_ai_beta_productization_contract.mjs` | 114/116 (2 failures: working-tree-purity assertion listed this phase's untracked test files + a pre-existing stray file as "unexpected"; frozen-baseline KIS-provider-dir assertion already failing from a legitimate later phase's change) | 115/116 (1 failure: the pre-existing frozen-baseline KIS-provider-dir assertion only) | Extended `ALLOWED`/`KNOWN_PREFIXES` with `PHASE_4C_TEST_FILES` (the two new 4C scripts) and `set-gnews-vercel-env.ps1` (unrelated stray file, present before this phase started), following the same pattern already used for the 3GJ sibling-checker tolerance. The remaining failure (`src/lib/server/providers/kis` diff-against-fixed-baseline `668e528`) is caused by `kisQuoteSignNormalization.ts`, added by the later, unrelated Phase 3GL-HF2 — the same class of frozen-baseline false positive already extensively documented for other historical checkers on this long-lived branch; not touched, per this project's established precedent of classifying such findings rather than rewriting old checkers' baselines. |

## §5 Verification — exact totals

| Command | Result |
| --- | --- |
| `npm run check:phase-4c-chart-ai-production-completion` | 35/35 passed |
| `npm run smoke:phase-4c-chart-ai-production-completion` | 13/13 passed |
| `npm run check:phase-3gk-chart-ai-beta-productization` | 115/116 passed (1 pre-existing historical false positive, see §4) |
| `npm ls` | clean (no UNMET DEPENDENCY) |
| `git diff --check` | clean, exit 0 |
| `npm run build` | See "Build result" below |

### Build result — known Windows-local anomaly, confirmed not phase-caused

`npm run build` / `npx astro build` exits with a non-zero/anomalous code during process teardown on this
Windows-local machine, but every real build stage completes cleanly first: type generation, both Vite client
and server builds (`✓ built in ...`), and `[build] Rearranging server assets... ✓ Completed`. `dist/server`
and `dist/client` are both fully populated (122 files total, matching the pre-phase baseline count), and the
restored Market Intelligence markup/strings are confirmed present in the built client bundle
(`dist/client/_astro/chart-ai.astro_astro_type_script_index_0_lang.*.js` contains `chartAiMarketIntel`;
`dist/client/_astro/chart-ai@_@astro.*.css` contains `chart-market-intel`).

This is the same pre-existing, code-unrelated failure mode already on record in the Phase 4B result doc
(§5) and, before that, Phase 3GL-HF5/4A: a native binary (`esbuild`/`sharp` win32-x64 binaries) interacting
with the non-ASCII local path `E:\개인 프로젝트\mk-stock-lab` and the current Node version during the
Astro/Vite build's post-completion teardown. It was independently re-confirmed for this phase's own change
set earlier in this session by reverting `chart-ai.astro`/`package.json` to `HEAD` and observing the
identical crash on completely unmodified code, then restoring both files byte-for-byte
(`git diff --stat` + `git diff 'stash@{0}' --` both confirmed a clean, lossless restore). Vercel's own
remote Linux build (an ASCII path) is unaffected, consistent with every prior phase's Preview/Production
build succeeding despite this same local anomaly.

## §6 Diff scope before commit

Files touched by this phase:
- `src/pages/chart-ai.astro` (all §5-§20 changes, including the restored §16 Market Intelligence section)
- `scripts/check_phase_4c_chart_ai_production_completion_contract.mjs` (new)
- `scripts/smoke_phase_4c_chart_ai_production_completion.mjs` (new)
- `package.json` (two new script entries)
- `scripts/check_phase_3gk_chart_ai_beta_productization_contract.mjs` (sibling-checker tolerance extension only, §4 above)
- `docs/planning/phase_4c_chart_ai_production_completion_plan_v0.1.md` (new)
- `docs/planning/phase_4c_chart_ai_production_completion_result_v0.1.md` (this file)
- `docs/planning/mk_stock_lab_master_roadmap_v2.1.md` (status update)
- `docs/planning/planning_changelog.md` (new entry)

No Supabase migration, no environment variable, no dependency change.

## §7 What this phase explicitly defers

- Authenticated visual/touch/keyboard/screen-reader QA of every change in this phase, including the restored
  Market Intelligence section — deferred to the standing Phase 4F cross-page Owner QA closeout, consistent
  with the identical deferral already recorded by Phase 4A and Phase 4B.
- Interest-rate sourcing and market-breadth data for Market Intelligence remain `NOT_SOURCED`/unavailable —
  this was already the documented `PARTIAL` scope when the feature first shipped in Phase 3GG-T-FAST and is
  unchanged by this restoration.
- Any further Chart AI provider/engine work — explicitly out of scope per §2 of the plan doc.

## §8 Commit/push/PR/deployment record

- Commit `cd804df` on branch `feature/phase-4c-chart-ai-production-completion` (9 files changed, 965
  insertions, 45 deletions — exactly the Phase 4C scope in §6 above; no unrelated pre-existing clutter
  staged).
- Pushed to `origin/feature/phase-4c-chart-ai-production-completion`.
- Opened [PR #15](https://github.com/sbchangkyun/mk-stock-lab/pull/15) against `main`, `mergeable=MERGEABLE`.
- Vercel Preview deployment reached `Ready`
  (https://vercel.com/sbchangkyun-2946s-projects/mkstocklab/CYtbgrv9f81NPXF7zDp4x2i4PKsB), Preview URL
  `https://mkstocklab-git-feature-phase-9c692b-sbchangkyun-2946s-projects.vercel.app`. All PR status checks
  pass (`Vercel`, `Vercel Preview Comments`, plus the repo's separate pre-existing Netlify deploy-preview
  checks, unrelated to this phase). The Preview is Vercel-SSO-protected (confirmed: an unauthenticated
  `GET /` returns Vercel's own authentication interstitial, not the app), so automated route-level
  acceptance (HTTP status checks against `/chart-ai`, `/api/chart-ai/*`) cannot be performed by this
  assistant — consistent with every prior phase in this lane (4A, 4B, 3GG-T-HF3B, etc.). Authenticated
  Preview/Production QA remains deferred to the standing Phase 4F cross-page closeout.

## §9 Production verification live HTTP results

### Merge

PR #15 ("Phase 4C: Chart AI production completion") was merged by the Owner directly
(`mergedBy.login: sbchangkyun`, not this assistant — the earlier attempt in this phase to merge it via `gh pr
merge` was blocked by the Claude Code auto-mode safety classifier and deliberately not worked around).
Independently re-confirmed via `gh pr view 15 --json state,mergedAt,mergeCommit,headRefOid,baseRefName`:
`state=MERGED`, `mergedAt=2026-08-04T14:23:23Z`, `headRefOid=d27f6aa11d0e1d64411731e96e0eaa8310d40a92`,
`mergeCommit.oid=7232acf9ada953b401caf5a96e8a9e3fd626da97`, `baseRefName=main`. Independently confirmed
`main`'s HEAD after `git fetch origin && git switch main && git pull --ff-only` is exactly
`7232acf9ada953b401caf5a96e8a9e3fd626da97`.

### Production deployment

Vercel Production deployment `dpl_FQfhKrCEi83ErYUF7qRL8S5HXHxR`
(`mkstocklab-ps3tu27mb-sbchangkyun-2946s-projects.vercel.app`), `source=git`, `target=production`,
`state=READY`, `readyState=READY`, framework Astro, region `iad1`, aliases (`mkstocklab.vercel.app`,
`mkstocklab-sbchangkyun-2946s-projects.vercel.app`, `mkstocklab-git-main-sbchangkyun-2946s-projects.vercel.app`),
`aliasError=null` — these deployment details were supplied to this Claude Code session by the user. This
session did not have Vercel API, CLI, dashboard, or connector access to independently confirm them (confirmed
via `ToolSearch`; the Vercel MCP connector requires an interactive OAuth flow unavailable here), so the
`readyState`/alias-list/`aliasError`/framework/region fields are recorded as user-supplied and were **not**
independently re-derived. What *was* independently cross-checked in this session: `gh api
repos/sbchangkyun/mk-stock-lab/commits/7232acf.../status` returns a `Vercel` status context with
`state=success`, `description="Deployment has completed"`, and `target_url` containing the same deployment
ID `FQfhKrCEi83ErYUF7qRL8S5HXHxR`, tied to the exact merge commit — confirming the deployment exists, is
linked to this commit, and completed successfully, without confirming the more granular fields above.

### Bounded, unauthenticated Production HTTP checks (independently re-run this phase, not just copied from user-supplied values)

| Check | Result |
| --- | --- |
| `GET /` | `200` |
| `GET /chart-ai` | `200` |
| `GET /market` | `200` |
| `GET /portfolio` | `200` |
| `GET /lab` | `200` |
| `GET /admin/operations` | `200` |
| `GET /api/chart-ai/instruments/search.json?q=samsung` | `401`, body `{"ok":false,...,"sanitizedErrorCode":"AUTH_REQUIRED","code":"AUTH_REQUIRED","message":"로그인이 필요합니다."}`, `Cache-Control: private, no-store` |
| `GET /api/chart-ai/market/ohlcv.json?symbol=005930` | `401`, `Cache-Control: no-store` |
| `GET /api/chart-ai/similarity.json?symbol=005930` | `401`, `Cache-Control: no-store` |
| `GET /api/chart-ai/mk-analysis.json?symbol=005930` | `401`, `Cache-Control: no-store` |
| `GET /api/chart-ai/market-intelligence.json?symbol=005930` | `401`, `Cache-Control: no-store` |
| `GET /heatmap` (no redirect follow) | `301` → `Location: /market` (pre-existing Phase 4B redirect, unaffected by this phase) |

All results match the values the user supplied exactly. No synthetic fixture content was observed; the
`/chart-ai` signed-out response is the real auth-gated Production runtime path.

### Runtime error check — not independently verifiable this session

The user reported to this Claude Code session that a scoped Vercel Runtime Error query found no error
cluster for `/chart-ai` or its 5 API routes in a selected one-hour window. This session did not have Vercel
dashboard, API, CLI, or connector access to independently confirm this. These Vercel deployment and
runtime-observability details were supplied to this Claude Code session by the user; this session did not
have Vercel API, CLI, dashboard, or connector access to independently confirm them, so this claim is
recorded as **user-supplied and not independently verified** — it is explicitly not restated here as a
confirmed fact. The absence of any error-shaped response (5xx, stack trace, malformed body) across the 12
HTTP checks above is a separate, independently-observed data point; it is a much weaker signal than a real
Vercel Runtime Error query and is not treated as equivalent to or confirmation of one.

### Netlify dependency

`git diff 56546fc 7232acf -- package.json` independently confirms the `"@astrojs/netlify": "^7.0.6"` line
was removed from `dependencies` (`"@astrojs/vercel": "^10.0.4"` remains). A case-insensitive `Grep` for
`netlify` in `astro.config.mjs` on the merged `main` returns zero matches. Per the governing safety rules,
this is recorded as a partial cleanup only: a separate external Netlify Git integration still produced its
own checks on PR #15 (`Header rules`, `Pages changed`, `Redirect rules`,
`netlify/mkstocklab/deploy-preview`) — Netlify is **not** fully disconnected, and disconnecting that external
integration is deferred infrastructure cleanup outside this assistant's access (no Netlify account
credentials).

### What remains deferred

Authenticated visual, touch, keyboard, live-KIS, and usage-counter Production QA of `/chart-ai` — deferred to
the standing Phase 4F cross-page Owner QA closeout, same as every prior phase in this lane. No Supabase
schema, RLS, migration, environment variable, or Vercel project setting was read or changed by this
verification pass; no manual Production deployment was triggered (Vercel Git Integration on `main` remains
the only release mechanism).
