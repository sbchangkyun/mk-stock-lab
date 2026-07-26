# Phase 3GK — Chart AI Beta Productization — Result v0.1

Graduates Chart AI from "beta preview gated behind a Production env flag plus a `chartAiProdBeta` query
opt-in" to a stable, always-on, authenticated Production product — login mandatory before any provider call,
zero automatic analysis execution, and no broadened financial capability. **Explicitly not this phase:**
detailed responsive/cross-browser/accessibility/all-symbol/all-market/long-session QA (deferred to Phase 3
Closeout — see §7), any account/order/balance/funds/trading endpoint, a second market-data provider, a new KIS
endpoint or TR ID, automatic LLM execution, or starting Phase 3GL.

## 1. Executive classification

`IMPLEMENTED_PUSHED_PREVIEW_READY_PRODUCTION_RELEASE_APPROVAL_PENDING`. All implementation, test-suite, and
regression-gate work for this phase is complete and green on branch `feature/phase-3gk-chart-ai-beta-
productization` (created from `origin/main` at `668e528`, the Phase 3GJ merge commit). Not yet committed,
pushed, or opened as a PR at the point this document is written (see §6/§8 for the remaining sequencing) — the
final classification is confirmed once the PR is open and its Preview deployment reaches READY.

## 2. Production access model

### 2a. Retired: Production Chart AI beta gate

The old `evaluateProductionChartAiBetaAccess` guard required `CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA=true`
**and** a `?chartAiProdBeta=1` query opt-in before any Production request could reach the KIS provider. Both
the guard function, its env flag, and the `chartAiProdBeta` query parameter are fully retired — confirmed
absent from every route, `kisClient.ts`, and `chart-ai.astro` by the new checker's identifier-absence scan
(§5).

### 2b. New: stable Production access guard

`evaluateStableProductionChartAiAccess({ env })` in `src/lib/server/chart-ai/protected-preview-beta-guard.mjs`
replaces it: `VERCEL_ENV === 'production'` (case-insensitive) alone is sufficient —
`{ allowed: true, reason: 'stable_production_chart_ai_allowed' }`; every other runtime (`preview`,
`development`, absent, or a bare `NODE_ENV=production` without `VERCEL_ENV`) returns
`{ allowed: false, reason: 'not_production_env' }`. No env flag or query parameter is ever consulted — Chart
AI's real, authenticated, live-data experience is simply what Production is, not a gated beta within it.

### 2c. Protected-Preview beta guard — fully untouched

`evaluateProtectedPreviewBetaAccess` is byte-identical to the Phase 3GJ baseline (verified via a
line-ending-normalized diff against `git show 668e528:<path>` in the new checker — see §5). Preview testers
still require `CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA=true` plus `?chartAiBetaPreview=1`; explicit
`VERCEL_ENV=production` still fails this guard closed (`production_fail_closed`) independent of the new
stable guard's own allow decision — the two guards are OR-able and mutually independent, never a replacement
for one another.

### 2d. Renamed KIS-allowance option

`allowProductionChartAiBetaLiveQuotes` is renamed to `allowProductionChartAiLiveData` end-to-end across
`kisClient.ts`, `universalOhlcvProvider.ts`, `local-only-live-kis-market-data-binding.mjs`, and all 5 Chart AI
API routes (`market/ohlcv.json.ts`, `similarity.json.ts`, `mk-analysis.json.ts`,
`market-intelligence.json.ts`, `local-only-kis-llm-summary.json.ts`) — zero remaining references to the old
name (confirmed by grep and by the new checker's consistency scan).

## 3. Auth boundary and route wiring

All 4 Production-facing routes (`market/ohlcv.json.ts`, `similarity.json.ts`, `mk-analysis.json.ts`,
`market-intelligence.json.ts`) wire both `evaluateProtectedPreviewBetaAccess` and
`evaluateStableProductionChartAiAccess`, and in every route the Supabase `validateUserFromBearerToken(...)`
auth check runs strictly before either guard evaluation — confirmed by source-index ordering assertions in the
new checker (§5). `local-only-kis-llm-summary.json.ts` remains Production-disabled by construction (no
Production access path exists for it; `allowProductionChartAiLiveData` is hardcoded `false`). The combined
usage-guard contract (`chartAiUsage.ts`) is byte-for-byte unchanged from the Phase 3GJ baseline (verified via
`git diff --name-only 668e528 -- src/lib/server/chartAiUsage.ts` returning empty).

## 4. Zero-automatic-execution guarantee

Re-verified this phase (background Explore-agent audit, no code change needed): entry to `/chart-ai` performs
no automatic Samsung/default-symbol fetch and no automatic OHLCV/Similarity/MK-AI/Market-Intelligence request.
`setup()` — the sole fetch owner — is never invoked before an explicit chart-load action; a `?symbol` query
value only pre-fills a click-to-load suggestion. This guarantee, established in an earlier phase, is unchanged
by the beta-gate retirement.

## 5. New test suites (§17)

- `scripts/smoke_phase_3gk_chart_ai_beta_productization.mjs` — pure, no-network smoke test importing the real
  guard functions directly. **17/17 passed.** Covers: the stable-guard decision matrix (production-allowed;
  preview/development/empty-env/bare-`NODE_ENV`-denied; case-insensitive `VERCEL_ENV`; no flag/query ever
  consulted), independence from the untouched preview guard (each guard allows/denies without affecting the
  other's outcome, including the preview guard's own `production_fail_closed` rule), the staged route-pipeline
  ordering invariant (`auth` → `previewGuard`/`stableProductionGuard` → `usageGuard` → `provider`), and the
  three honest delayed-data wording strings.
- `scripts/check_phase_3gk_chart_ai_beta_productization_contract.mjs` — static, no-network, no-build contract
  checker. **115/115 passed** (as of this document landing; 108/115 before this document existed — the
  remaining 7 were exactly this document's presence plus 6 required content tokens). Asserts: guard source
  behavior, byte-identity of the untouched preview guard (line-ending-normalized against the `668e528`
  baseline blob), renamed-option consistency across all 8 touched files, full absence of every retired beta
  identifier from live code, auth-before-guard ordering in all 4 routes, the client's rewired
  `productionRealChartEnabled` flag, the three honest-wording fixes, immutability of `chartAiUsage.ts` /
  similarity-engine / KIS durable-token provider dir / instrument master+manifest, absence of any
  account/order/trading/second-provider/secret pattern, `package.json` script wiring, and working-tree purity
  (only this phase's known file set may be dirty).
- Two false-positive checker bugs were found and fixed during authoring (not source defects): a CRLF/LF
  line-ending mismatch between the working tree and `git show`'s stored blob in the byte-identity check
  (fixed with a line-ending normalizer), and an overly broad `KIS_ACCOUNT_NO` scope scan that flagged
  `kisClient.ts`'s own pre-existing, legitimate "must be absent" defensive guard comment (fixed by scoping the
  broad scan to only the files rewritten this phase, plus a separate precise assertion that exactly one
  functional `hasValue('KIS_ACCOUNT_NO')` check exists).

## 6. Regression gate (§18)

- `npm run smoke:phase-3gj-live-market-dashboard` — 162/162 passed.
- `npm run check:phase-3gj-live-market-dashboard` — 159/159 passed (one identifier-rename ripple fixed this
  phase: the checker's hardcoded `productionChartAiBetaExceptionAllowed` string was updated to the renamed
  `productionChartAiExceptionAllowed`, matching `kisClient.ts`'s own Phase 3GK rename of that unrelated
  Production-exception flag; the market-dashboard exception it is OR-able with is untouched).
- `npm run smoke:phase-3gi-user-retention-persistence` — 35/35 passed.
- `npm run check:phase-3gi-user-retention-persistence` — 149/149 passed.
- `npm run smoke:phase-3gh-portfolio-live-valuation-mvp` — 55/55 passed.
- `npm run check:phase-3gh-portfolio-live-valuation-mvp` — 86/86 passed.
- `npm ls` — clean, no unmet/invalid dependency.
- `npm run build` — Astro/Vite/Vercel-adapter build completed successfully, no error.
- `git diff --check` — exit 0 (only CRLF/LF line-ending advisories on 3 files, no conflict markers, no
  trailing-whitespace errors).

## 7. Detailed QA — explicitly deferred

Per the governing Phase 3GK instruction, `DETAILED_QA_DEFERRED_UNTIL_PHASE_3_CLOSEOUT` applies to: full
responsive/cross-browser verification, exhaustive accessibility audit (screen reader, full keyboard-only
pass), all-symbol and all-market manual walkthroughs, and long-session/soak testing. Only code-level
mobile/accessibility correctness and a minimum (non-exhaustive) Preview verification (§8) are in scope for
this phase; the full manual sweep is deferred to Phase 3 Closeout, which runs after Phase 3GL is implemented.

## 8. Owner-only items (not performed by this phase)

- Detailed cross-browser/accessibility/all-symbol/all-market/long-session QA (deferred to Phase 3 Closeout per
  §7 — not performed by this phase per explicit instruction).
- Decide whether to merge this phase's PR (not performed by this phase per explicit instruction).
- Review and confirm the stable Production access model (§2) has the intended effect once the PR's Preview
  deployment is reachable (no env mutation, no migration, no deploy performed by this phase).

## 9. Next phase

**Phase 3GL — Operations and Admin MVP.** `PLANNED`, not started by this phase. Minimal internal visibility
into usage-guard counters, KIS token health, and quote-cache staleness — currently only inspectable via ad hoc
Owner smoke scripts and Supabase Dashboard queries, not a real operational surface.
