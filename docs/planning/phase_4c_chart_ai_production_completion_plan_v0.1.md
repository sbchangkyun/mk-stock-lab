# Phase 4C — Chart AI Production Completion — Plan v0.1

**Baseline**: `main` (post Phase 4B merge, `9de40e8`/`8146fe4` lineage per prior `PASS_...PRODUCTION_VERIFIED` phases)
**Branch**: `rebuild/phase-4c-chart-ai-production-completion` (or current working branch continuing the same lineage)

## §1 Objective

Phase 4C is a **truthfulness / accessibility / responsiveness / reliability completion pass** over the
already-functional Production `/chart-ai` page (`src/pages/chart-ai.astro`) — analogous in scope and method
to Phase 4A (Home/Common Shell) and Phase 4B (Market). It is explicitly **not** a re-implementation of the
provider, engines, auth gate, or usage-guard layers already hardened across Phase 3GG-T / 3GJ / 3GK. Those
layers (KIS durable-token client, similarity/MK-AI engines, `chartAiUsage.ts` combined usage guard, Supabase
auth) are treated as a fixed, correct foundation; Phase 4C closes remaining copy/a11y/lifecycle/layout gaps
on top of that foundation.

Concretely, this phase:
- Makes the Production/dev-path split authoritative on `VERCEL_ENV` (not `NODE_ENV`), consistent with
  `kisClient`'s existing runtime classification.
- Hardens the signed-out auth state machine and its Korean copy.
- Adds real combobox/listbox ARIA semantics to the symbol search.
- Adds last-good-chart preservation so a transient reload failure for the *currently displayed* instrument
  no longer blanks a chart the user was already looking at, while a genuinely new selection still fails
  honestly.
- Adds ARIA-tablist semantics + roving tabindex to the Similarity/MK-AI analysis workspace switch, and
  verifies the daily usage-limit display is populated only from the server response (never a client-side
  guess).
- Verifies watchlist/resume-state persistence and mobile responsive breakpoints.
- Restores the **Market Intelligence** (시장 인텔리전스) section that Phase 3GG-T-FAST originally shipped and
  Phase 3GG-T-HF4-FAST-HF1 silently dropped from the client markup/script while refactoring mobile chart
  interaction (its server engine and `/api/chart-ai/market-intelligence.json` route were never removed).

## §2 Explicit non-goals

- No change to the KIS durable-token provider, `similarity-engine.mjs` scoring formula, `chartAiUsage.ts`
  combined usage-guard contract, Supabase auth flow, or instrument master data.
- No new Supabase migration, no new environment variable, no new external provider.
- No rewrite of the Similarity or MK AI analysis engines/copy beyond the accessibility wrapper described
  above.
- No authenticated Owner click-through QA performed by this assistant (deferred to the standing Phase
  4F cross-page closeout, per the Phase 4A/4B precedent) — this phase relies on static contract checks +
  pure-module smoke tests + Vercel Preview build/route acceptance only.

## §3 Planned changes (by spec section)

| Spec section | Change |
| --- | --- |
| §5 | One authoritative `chartAiRealExperienceRuntime` flag (`isVercelProductionRuntime \|\| isProtectedPreviewBetaOptInRuntime`), `VERCEL_ENV`-authoritative, replacing scattered `isVercelProductionRuntime` markup gates. |
| §6-7 | Signed-out lock card copy (`접속 필요` / `로그인이 필요합니다`); workspace body `<main data-chart-ai-auth-body hidden>` revealed only on a real Supabase session. |
| §8 | `role="combobox"` search input with `aria-expanded` toggling + `listbox`/`aria-selected` results. |
| §9-11 | `lastRenderedInstrumentKey` + `isReloadOfDisplayedInstrument` gate `setRealChartState(..., preserveChart)`; a reload of the *same* displayed instrument that fails keeps the last-good chart visible (analysis still disabled); a genuinely new selection's failure still hides the chart. |
| §12-15 | ARIA tablist for the Similarity/MK-AI switch; usage state populated solely via `applyChartAiUsageState(data.usage)`; both analysis panels keep the non-advisory disclaimer. |
| §16 | Restore the Market Intelligence collapsible section (markup + CSS + client script), gated by `chartAiRealExperienceRuntime`, wired to the unchanged `/api/chart-ai/market-intelligence.json` route via the shared `chartAiAuthHeaders`/`integrity.beginAnalysis` patterns. |
| §17 | Verify `persistChartResumeState`/`refreshWatchlistToggleForActiveInstrument` still run after every successful render, keyed by market + uppercased symbol. |
| §18 | Verify the existing 640px/420px responsive breakpoints cover the chart-lookup shell. |
| §19-20 | Verify every real fetch still attaches `chartAiAuthHeaders` and no bespoke auth bypass was introduced. |

## §4 Sibling-checker impact

- `check_phase_3gk_chart_ai_beta_productization_contract.mjs` (§11, working-tree purity assertion): its
  `ALLOWED`/`KNOWN_PREFIXES` allowlist predates this phase's new test files. Extended (not rewritten) with
  `PHASE_4C_TEST_FILES` the same way it already tolerates the 3GJ sibling-checker reconciliation, plus a
  tolerance entry for a pre-existing unrelated stray file (`set-gnews-vercel-env.ps1`) already present in the
  working tree before this phase started.
- No other sibling checker references `chart-ai.astro` markup/script in a way this phase's changes intersect.

## §5 Verification plan

1. `npm run check:phase-4c-chart-ai-production-completion` (new, static source contract).
2. `npm run smoke:phase-4c-chart-ai-production-completion` (new, pure `selected-symbol-integrity.mjs`
   lifecycle contract that the last-good-chart logic depends on).
3. `npm run check:phase-3gk-chart-ai-beta-productization` (sibling; expect the pre-existing, already-documented
   frozen-baseline KIS-provider-dir false-positive to remain the only failure — see Phase 4C result doc §5).
4. `npm ls` (dependency tree sanity) + `git diff --check` (no whitespace errors).
5. `npm run build` (expect the already-documented Windows-local native-teardown exit-code anomaly; verify
   `dist/server` + `dist/client` are both fully populated and the restored Market Intelligence markup/CSS is
   present in the built client bundle).
6. Push to a PR, verify the Vercel Preview build succeeds and route acceptance holds (no new 500s on
   `/chart-ai` or `/api/chart-ai/*`).

## §6 What this plan explicitly defers

- Authenticated visual/touch/keyboard/screen-reader QA of the restored Market Intelligence section and the
  other §5-§18 changes (Phase 4F cross-page closeout, consistent with every prior phase in this lane).
- Any interest-rate or market-breadth data sourcing for Market Intelligence (already-documented `PARTIAL`
  scope from Phase 3GG-T-FAST; unchanged by this restoration).
- Production environment variable changes — none are required; `chartAiRealExperienceRuntime`'s Preview leg
  reuses the existing `chartAiBetaPreview=1` protected-Preview opt-in already wired in Phase 3GG-T-HF3B.
