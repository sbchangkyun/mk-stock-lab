# Phase 4F-HF1 — Functional HIGH Defect Fixes — Result v0.1

**Classification: `PHASE_4F_HF1_IMPLEMENTED_PR_READY_PREMERGE_REVIEW_REQUIRED`.**

## 1. Scope

Fixes exactly two HIGH-severity functional defects surfaced by the Phase 4F Owner QA closeout
execution (`docs/phase-4f-owner-qa-execution`, not touched or merged by this phase):

- **F-HIGH-01 (maps to `CHART-05`).** Chart AI timeframe coverage/paging defect — longer chart
  ranges (6m/1y) silently returned incomplete data because `fetchUniversalOhlcv()` fetched exactly
  one provider page per request regardless of the requested range.
- **F-HIGH-02 (maps to `PORT-10`).** Portfolio Production KR live valuation defect — the
  authenticated `/api/portfolio/valuation` route could not obtain real KIS quotes in Vercel
  Production because the generic KIS quote path fails closed (`production_not_allowed`) there by
  design.

No other defect from the Owner QA execution record is addressed in this phase. No unrelated
redesign, refactor, or new feature was implemented (see §6 for the explicit forbidden-scope list
honored).

## 2. Baseline and branch

- Baseline: `main` @ `af52c624a724c728f8d71295c9891dfe58496d85`.
- Branch: `fix/phase-4f-hf1-high-functional-defects`.
- `docs/phase-4f-owner-qa-execution` (Owner QA evidence branch) was not read, touched, merged, or
  cherry-picked from.

## 3. F-HIGH-01 — Chart AI timeframe coverage/paging fix

- **Bounded chart-range paging** added to `src/lib/server/chart-ai/universalOhlcvProvider.ts`:
  KR walks the requested window backward using date boundaries; US reuses the existing BYMD
  backward cursor. Both dedupe by timestamp, sort ascending, keep existing OHLC validation and
  per-range candle caps, and stop when the window is sufficiently covered, no additional data is
  returned, the oldest date fails to move backward, or a bounded maximum of 4 pages is reached.
  The existing long-history engine (`fetchLongHistoryOhlcv`) was not rewritten or merged with this
  path — only its safe backward-cursor pattern was reused.
- **Coverage contract.** `UniversalOhlcvResponse` gained an additive
  `coverage: { requestedRange, requestedStartDate, actualStartDate, actualEndDate, candleCount, complete }`
  field. `complete` is calendar-tolerant (weekends/holidays do not by themselves flip it false), and
  a newly-listed security with genuinely short history is a valid `complete: false` case rather
  than an error. No secret or raw provider payload is included.
- **Client warning.** `src/pages/chart-ai.astro` shows a concise, truthful note when
  `sourceStatus === 'ok' && coverage.complete === false` (e.g. "요청한 1년 전체 구간을 제공하지
  못해 YYYY-MM-DD 이후 데이터만 표시합니다."), with no other UI redesign.
- **Tests.** `scripts/phase_4f_hf1_chart_ai_timeframe_testsrc.ts` — deterministic, credential-free,
  injected/mock-provider tests covering KR/US backward paging and coverage completeness across
  representative Production target ranges (3m, 6m, 1y), tolerant of holidays and newly-listed
  securities.

## 4. F-HIGH-02 — Portfolio Production KR live valuation fix

- **Narrow capability.** `src/lib/server/providers/kisClient.ts` adds an
  `allowProductionPortfolioValuationLiveData` option that lifts *only* the generic
  Vercel-Production hard block, and only when ALL of the following hold: Vercel Production runtime,
  the caller passed the option `true`, the new `KIS_ENABLE_PRODUCTION_PORTFOLIO_VALUATION` env flag
  is `'true'`, `KIS_ENABLE_LIVE_QUOTES` remains enabled, required KIS credentials exist, and
  `KIS_ACCOUNT_NO` remains absent. Every other existing readiness check still applies unchanged.
- **Sole opt-in call site.** `src/lib/server/marketData/quotes.ts` forwards the option through
  `getQuoteSnapshot`; `src/pages/api/portfolio/valuation.ts` is the **only** call site in the repo
  that sets `allowProductionPortfolioValuationLiveData: true`, after its existing
  auth/ownership flow. The generic `getKisQuoteSnapshot(...)` wrapper remains fail-closed in
  Production for every other caller (Home, Chart AI, Market, account/balance/order surfaces — none
  of which were touched).
- **Scope held to KR only.** No US Portfolio valuation, FX, USD conversion, account linkage, or
  trading was added in this phase.
- **Tests.** `scripts/phase_4f_hf1_portfolio_valuation_security_testsrc.ts` — fail-closed security
  tests for: capability + Production + option + flag + readiness → pass; Production without the
  option → blocked; option present but flag false/missing → blocked; `KIS_ACCOUNT_NO` present →
  blocked even with the option; missing KIS credentials → blocked; `KIS_ENABLE_LIVE_QUOTES`
  disabled → blocked; generic `getKisQuoteSnapshot` stays Production fail-closed; no new
  account/order/balance route exists.

## 5. Environment contract

No `.env.example` / `.env.template` file exists anywhere in this repository (confirmed by a
repo-wide search), so the original instruction to add the new flag to such a file using the
existing convention is not applicable — there is no existing convention or file to extend, and no
new env-doc system was invented for this phase.

**OWNER ACTION REQUIRED BEFORE PRODUCTION MERGE:** Set Vercel Production environment variable
`KIS_ENABLE_PRODUCTION_PORTFOLIO_VALUATION=true`. The value must be present before the post-merge
Production deployment that is expected to verify `PORT-10`. No real Vercel Production environment
variable was read, printed, pulled, added, updated, or removed by this phase.

## 6. Explicitly out of scope (not implemented, per instruction)

Chart AI report redesign; shared auth-required card; Home urgent-news styling; Market
content-first reorder; Portfolio dashboard/donut; Portfolio instrument autocomplete; Portfolio
SWR/sessionStorage; Lab NPS/Congress MVP; broad `chart-ai.astro` refactor; generic client data
layer; a KIS `productionScope` enum refactor.

## 7. New contract test/checker suites

- `scripts/smoke_phase_4f_hf1_functional_high.mjs` (new `smoke:phase-4f-hf1-functional-high` npm
  script) — 39 chart-timeframe assertions + 20 portfolio-valuation-security assertions, all
  green (59/59).
- `scripts/check_phase_4f_hf1_functional_high_contract.mjs` (new
  `check:phase-4f-hf1-functional-high` npm script) — 58 static-contract assertions across paging
  bounds, coverage contract, injectable test seams, bounded-loop structure, long-history-engine
  non-modification, sanitized payload shape, client partial-coverage note, the `PORT-10`
  capability/flag pair, `KIS_ACCOUNT_NO` hard-block ordering, generic-wrapper scope, and the
  single valuation-route opt-in call site. Green (58/58).

## 8. Regression gate (no Phase 4C/4E/3GH checker weakened)

All of the following ran green after this phase's changes, in the required order:

- `smoke:phase-4f-hf1-functional-high` — 39/39 + 20/20.
- `check:phase-4f-hf1-functional-high` — 58/58.
- `check:phase-4c-chart-ai-production-completion` — 35/35.
- `smoke:phase-4e-portfolio-production-completion` — 21/21.
- `check:phase-4e-portfolio-production-completion` — 65/65.
- `smoke:phase-3gh-portfolio-live-valuation-mvp` — 55/55.
- `check:phase-3gh-portfolio-live-valuation-mvp` — 86/86 (see §9 for a regression found and fixed
  during this run).
- `check:mobile-baseline` — 74/74.
- `check:phase-4a-home-common-shell` — 75/75.
- `check:phase-4b-market-production-completion` — 79/79.
- `check:phase-4d-lab-production-completion` — 62/62.
- `check:project-lightweight-roadmap` — 27/27.
- `git diff --check` — clean.
- `npm ls --depth=0` — clean.
- `npm run build` — the real Astro build (type generation, server entrypoints, 3 Vite builds,
  Vercel adapter output rearrangement) completed successfully and both `dist/` and
  `.vercel/output/{server,static}` were confirmed freshly written on disk; the process then exited
  with the known Windows-only post-build teardown crash (`-1073740791` / `STATUS_STACK_BUFFER_OVERRUN`),
  which is a process-teardown artifact after all real build work succeeded, not a compile error —
  classified separately per the phase's own pre-flagged caveat.

No UX1/Lab file was modified by this phase (confirmed by `git status --short` / `git diff --stat`
scope audit — see §9).

## 9. Regression found and fixed during validation

Running `check:phase-3gh-portfolio-live-valuation-mvp` initially returned 85/86: the pre-existing
Phase 3GH assertion `route never references KIS_ACCOUNT_NO` failed because this phase's own
explanatory comment in `valuation.ts` (above the sole opt-in call site) contained the literal
substring `KIS_ACCOUNT_NO` as prose, not as an account-API reference. Per the explicit instruction
not to weaken Phase 4C/4E/3GH checkers, the checker was left unchanged and the comment was reworded
to convey the identical meaning ("the KIS account-number absence safety check") without the literal
env-var name. Re-run: `check:phase-3gh-portfolio-live-valuation-mvp` 86/86,
`check:phase-4f-hf1-functional-high` unchanged at 58/58.

## 10. Changed files

- `package.json` — wires the two new HF1 npm scripts.
- `src/lib/server/chart-ai/universalOhlcvProvider.ts` — F-HIGH-01 bounded paging + coverage
  contract.
- `src/pages/chart-ai.astro` — F-HIGH-01 client partial-coverage note.
- `src/lib/server/providers/kisClient.ts` — F-HIGH-02 narrow capability + feature-flag gate.
- `src/lib/server/marketData/quotes.ts` — F-HIGH-02 option forwarding.
- `src/pages/api/portfolio/valuation.ts` — F-HIGH-02 sole opt-in call site.
- New: `scripts/phase_4f_hf1_chart_ai_timeframe_testsrc.ts`,
  `scripts/phase_4f_hf1_portfolio_valuation_security_testsrc.ts`,
  `scripts/smoke_phase_4f_hf1_functional_high.mjs`,
  `scripts/check_phase_4f_hf1_functional_high_contract.mjs`.

No Owner-local untracked file (`.agents/`, `.claude/`, `.vscode/settings.json`,
`docs/handoff/codex_state_inspection/`, `set-gnews-vercel-env.ps1`, `skills-lock.json`) was staged
or committed. `git add .` / `git add -A` was never used.

## 11. PR

- Title: "Phase 4F HF1: fix Chart AI timeframe and Portfolio valuation".
- Base: `main`. Head: `fix/phase-4f-hf1-high-functional-defects`.
- **Not merged** — pre-merge review required, and the Owner env action in §5 must be completed
  before the post-merge Production deployment.
