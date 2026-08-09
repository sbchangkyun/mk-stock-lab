# Phase 4F-HF2 — Portfolio Canonical Instrument Identity — Result v0.1

**Classification: `PHASE_4F_HF2_IMPLEMENTED_PR_READY_PREMERGE_REVIEW_REQUIRED`.**

**Addendum (2026-08-09): HF2-A1 fixes a raw exact-entry market-hint leak found during independent
premerge review of this PR — see §14. Still premerge; F-HIGH-02/F-HIGH-03 remain not-CLOSED; Owner
QA remains 0/120.**

## 1. Scope

Fixes **F-HIGH-03 (HIGH severity)** completely: Portfolio's free-text/heuristic identity system
(typed Korean names stored verbatim as `symbol`, `securityLogos.json` lookup, ticker-like regex,
market/currency heuristics) is replaced with a canonical identity contract sourced from the
existing Universal Instrument Master. Using the corrected canonical identity, this phase also
proves whether **F-HIGH-02 (`PORT-10`)**, implemented in Phase 4F-HF1 but Production-verification
blocked because Portfolio identity itself was invalid, now works end-to-end with a real six-digit
KR symbol.

Per explicit instruction, this phase did **not** attempt to preserve free-text identity semantics —
the identity contract itself was replaced.

Explicitly excluded (unchanged from the governing instruction): Portfolio dashboard/donut redesign;
Portfolio SWR; Chart AI report redesign; shared `AuthRequiredState`; Market content-first work; Home
breaking-news styling; Lab implementation; US live Portfolio valuation; FX; trading/order/account/
balance APIs; broad MPA/client-state refactor.

## 2. Baseline and branch

- Baseline: `main` @ `af2d74b2e3cdae87515bf02b3e286b242ce0f6a8` (Phase 4F-HF1 / PR #22 merged).
- Branch: `fix/phase-4f-hf2-portfolio-instrument-identity`.
- No Owner-local untracked file (`.agents/`, `.claude/`, `.vscode/settings.json`,
  `docs/handoff/codex_state_inspection/`, `set-gnews-vercel-env.ps1`, `skills-lock.json`) was
  touched, staged, or committed. `git add .` / `git add -A` was never used.

## 3. Canonical identity source (no new data source)

The sole source of truth remains `src/data/chart-ai/universalInstrumentMaster.json`, accessed via
the existing `src/lib/server/chart-ai/universal-instrument-search.mjs` module and the existing
`GET /api/chart-ai/instruments/search.json` route. No competing Portfolio symbol database was
created. `securityLogos.json` is not used as an identity source anywhere in the new code.

Two new pure functions were added to `universal-instrument-search.mjs`:

- **`resolveUniversalInstrumentExact({ query, country? })`** — distinct from ranked search. Accepts
  only: an exact canonical symbol match; an exact normalized `displayName` match; an exact
  normalized `englishName` match; or an exact alias match **only when the alias is unique** across
  the master. Prefix/substring/multi-alias ambiguity is rejected (returns `null`/ambiguous), never
  silently resolved to a ranked first result.
- **`resolveCanonicalPortfolioInstrument({ symbol, market })`** — wraps the exact resolver, adds the
  server-authoritative market-contradiction check (§8), and returns the canonical
  `{ symbol, displayName, country, exchange, assetType, currency }` tuple or a typed error code.

`resolveCanonicalOrFail(symbolValue, marketValue)` in `src/lib/server/portfolio.ts` (exported)
wraps `resolveCanonicalPortfolioInstrument`, translating error codes to `ApiFailure` objects with
the exact required Korean messages:

- `INSTRUMENT_SYMBOL_REQUIRED` → `'티커 또는 종목명을 입력해 주세요.'`
- `INSTRUMENT_MARKET_MISMATCH` → `'선택한 시장과 종목 정보가 일치하지 않습니다.'`
- `INSTRUMENT_NOT_RESOLVED` (includes ambiguous input) → `'검색 결과에서 종목을 선택해 주세요.'`

## 4. Combobox and accessibility (§4-§7)

`src/pages/portfolio.astro` replaces the free-text `종목명 또는 티커` field with an authenticated
instrument combobox reusing the existing search route (`fetchChartAiJson`, the same authenticated
fetch helper Chart AI already uses — no raw `fetch()` call was added).

- Dedicated canonical selection state (`selectedPositionInstrument`): `symbol`, `displayName`,
  `country`, `exchange`, `market`, `assetType`, `currency`. The existing hidden `#position-symbol`
  field is reused as a genuine canonical-state field, not a free-text mirror.
- Full accessibility contract: `role="combobox"`, `aria-expanded`, `aria-controls`,
  `aria-activedescendant`; results render as `role="listbox"` / `role="option"`; ArrowDown/ArrowUp/
  Enter/Escape are handled; Tab continues normal navigation; visible focus; click/touch selection;
  no focus trap.
- **Input invalidation (§6):** the input listener calls `clearSelectedInstrument()` (nulling
  `selectedPositionInstrument` and the hidden symbol field) before re-triggering search on every
  keystroke — editing visible text after a selection immediately clears canonical state.
- **Exact-entry convenience (§7):** an exact canonical symbol/name submitted without a prior click
  is resolved server-side by `resolveCanonicalOrFail` at submit time; fuzzy/prefix/contains matches
  are never auto-selected — ambiguous input surfaces
  `'검색 결과에서 종목을 선택해 주세요.'` instead of guessing.

## 5. Server-authoritative create/update (§8, §13, §14)

`createPosition` and `updatePosition` in `src/lib/server/portfolio.ts` never trust the client-
supplied symbol/market/currency/assetType tuple. Both call `resolveCanonicalOrFail(body.symbol,
body.market)` before any Supabase write and use only the resolved instrument's fields
(`instrument.symbol`, `instrument.country`, `instrument.assetType`, `instrument.displayName`) in
the insert/update payload. A contradictory pair (e.g. `symbol=005930, market=US`) is rejected with
the exact Korean message, never silently corrected. `updatePosition` only re-resolves when the PATCH
body actually touches identity (`symbol`/`market`/`assetType`/`currency`/`name` present), so
non-identity edits (e.g. quantity/buy price) do not force an unnecessary re-resolution. Arbitrary
Korean company text can no longer be persisted into the `symbol` column — every successful create/
update path passes through the resolver first. `assetType`/`currency` are derived from the
canonical master once an instrument is selected and rendered read-only (`disabled aria-readonly`)
in the form, per §14.

## 6. Legacy position compatibility (§10-§12)

`resolveLegacyKrIdentity(position)` in `src/pages/api/portfolio/valuation.ts` (exported, pure):

- Short-circuits unchanged (`identityResolved: false`) for non-KR positions and for already-
  canonical KR rows (`symbol` matches `KR_SYMBOL_PATTERN = /^[0-9A-Z]{6}$/`).
- Otherwise attempts **exact-only** resolution, first by the position's stored `symbol` text
  (scoped `country: 'KR'`), then by its stored `name` text.
- On success, returns the canonical `symbol`/`name` for **in-memory valuation use only** — the DB
  row is never mutated by a read. Ambiguous or unresolvable legacy rows stay `identityResolved:
  false` and unsupported rather than being fuzzy-repaired to a guessed symbol.
- `toRecordInput` builds the valuation record from `resolveLegacyKrIdentity`'s resolved
  `symbol`/`name`, carrying `identityResolved` through to the client so the UI can render the
  canonical pair truthfully (e.g. "삼성전자 / 005930") without fabricating a symbol or writing to
  the DB merely because a valuation read occurred.

The exact §12 proving path — a legacy "삼성전자 / 티커 미확인" row, edited via the combobox (or by
entering exact `005930`) and saved — persists `symbol=005930, name=삼성전자, market=KR,
assetType=stock, currency=KRW`; a subsequent GET returns the canonical row; the UI shows "삼성전자 /
005930". This is covered by the deterministic create/edit contract tests in §7 below (Production
verification with a real KIS quote remains Owner-pending — see §9).

## 7. New contract test/checker suites (§16-§20)

- `scripts/smoke_phase_4f_hf2_portfolio_identity.mjs` (new
  `smoke:phase-4f-hf2-portfolio-identity` npm script) — esbuild-bundles and runs three deterministic,
  credential-free, network-free test sources against the real Universal Master JSON:
  - `scripts/phase_4f_hf2_resolver_testsrc.ts` (23 assertions): 005930 → 삼성전자; 삼성전자 →
    unique 005930; NAVER → 035420; AAPL/US identity; ambiguous "삼성" → not authoritative; unknown
    symbol → null; contradictory market/currency → server-side rejection.
  - `scripts/phase_4f_hf2_legacy_compatibility_testsrc.ts` (15 assertions): legacy 삼성전자/삼성전자
    → resolves to 005930 in memory; legacy 네이버/네이버 → resolves to 035420; byName fallback
    branch; already-canonical 005930 passes through unchanged; ambiguous legacy 삼성 stays
    unsupported and unmutated; fully unresolvable legacy row stays unchanged; US positions are never
    attempted this phase.
  - `scripts/phase_4f_hf2_create_edit_contract_testsrc.ts` (22 assertions): new selection persists
    canonical 005930; §12 edit-with-no-market-hint path resolves; exact Korean name resolves without
    a click; contradictory market is rejected with the exact message; ambiguous input is rejected
    with the exact message; empty symbol is rejected with the exact "required" message; unknown
    symbol is rejected; NAVER/KR and AAPL/US both resolve correctly.
  - Total: **60/60 passing.**
- `scripts/check_phase_4f_hf2_portfolio_identity_contract.mjs` (new
  `check:phase-4f-hf2-portfolio-identity` npm script) — 52 static-contract assertions (Groups 0,
  A-J) verifying: no competing master was introduced; the exact resolver exists and is distinct
  from ranked search; the Portfolio combobox reuses the existing instrument-search route; canonical
  selection state and full accessibility markup exist; input mutation clears canonical selection;
  `createPosition`/`updatePosition` both call `resolveCanonicalOrFail` before any DB write; legacy
  exact-resolution compatibility exists and never mutates the DB; valuation renders the canonical KR
  symbol; the generic KIS Production security boundary
  (`KIS_ENABLE_PRODUCTION_PORTFOLIO_VALUATION`, `allowProductionPortfolioValuationLiveData`, the
  unconditional `KIS_ACCOUNT_NO` hard block) is unchanged; no UX1/Lab file was touched. **52/52
  passing.**

No test in either suite merely checks source-text existence where behavioral testing against the
real resolver/legacy functions was practical.

## 8. Regression gate (§21 — no existing checker weakened to force green)

All of the following ran green after this phase's changes, in the required order:

- `smoke:phase-4f-hf2-portfolio-identity` — 60/60 (23 + 15 + 22).
- `check:phase-4f-hf2-portfolio-identity` — 52/52.
- `smoke:phase-4f-hf1-functional-high` — 39/39 + 20/20.
- `check:phase-4f-hf1-functional-high` — 58/58.
- `check:phase-4c-chart-ai-production-completion` — 35/35.
- `smoke:phase-4e-portfolio-production-completion` — 21/21.
- `check:phase-4e-portfolio-production-completion` — 65/65 (two assertions reconciled — see §9).
- `smoke:phase-3gh-portfolio-live-valuation-mvp` — 55/55.
- `check:phase-3gh-portfolio-live-valuation-mvp` — 86/86.
- `check:mobile-baseline` — 74/74.
- `check:project-lightweight-roadmap` — 27/27.
- Full 10-command Phase 4F gate (`check:phase-4a-home-common-shell` 75/75,
  `check:phase-4b-market-production-completion` 79/79,
  `check:phase-4c-chart-ai-production-completion` 35/35,
  `check:phase-4d-lab-production-completion` 62/62,
  `smoke:phase-4e-portfolio-production-completion` 21/21,
  `check:phase-4e-portfolio-production-completion` 65/65, `check:mobile-baseline` 74/74,
  `check:project-lightweight-roadmap` 27/27,
  `smoke:phase-3gh-portfolio-live-valuation-mvp` 55/55,
  `check:phase-3gh-portfolio-live-valuation-mvp` 86/86) — all green.
- `git diff --check` — clean.
- `npm ls --depth=0` — clean (no `UNMET`/`invalid`/`missing`/`extraneous`).
- `npm run build` — the real Astro build (type generation, server entrypoints, 3 Vite builds,
  Vercel adapter output rearrangement) completed successfully and `dist/{client,server}` were
  confirmed freshly written on disk (123 files); the process then exited with a nonzero code, the
  same known Windows-only post-build teardown artifact documented in the HF1 result doc — not a
  compile error.

## 9. Sibling checker reconciliation (`check:phase-4e-portfolio-production-completion`)

Two pre-HF2 assertions in `scripts/check_phase_4e_portfolio_production_completion_contract.mjs`
were invalidated by this phase's spec-mandated changes and were narrowly updated (never broadly
weakened):

- **A1** (`position-asset-type select offers an ETF option`) — the regex assumed
  `<select id="position-asset-type">` had no attributes. Per §14, this phase made the select
  canonical-derived (`disabled aria-readonly="true"` once an instrument is selected), adding
  attributes between the `id` and the closing `>`. The ETF `<option>` itself is unchanged and still
  present. Fix: widened the tag-open match to `<select id="position-asset-type"[^>]*>` while still
  requiring the literal `<option value="etf">ETF</option>` within the same window.
- **K9** (`no new /api/ route reference beyond the existing valuation/portfolio client calls`) — the
  negative lookahead assumed every `/api/` string literal in `portfolio.astro` was `/api/portfolio/
  ...`. Per §3/§4, the HF2 combobox reuses the existing, pre-existing Chart AI instrument-search
  route (`/api/chart-ai/instruments/search.json`, called via the shared authenticated
  `fetchChartAiJson` helper, not a raw `fetch()` or a newly-invented endpoint). Fix: the lookahead
  now allow-lists exactly this one reused path in addition to `/api/portfolio`; any other new
  non-portfolio `/api/` route reference in `portfolio.astro` still fails the check.

Re-run after both fixes: `check:phase-4e-portfolio-production-completion` 65/65.

## 10. Security boundary (§19 — unchanged)

No change was made to Phase 4F-HF1's KIS Production security boundary:
`KIS_ENABLE_PRODUCTION_PORTFOLIO_VALUATION`, `allowProductionPortfolioValuationLiveData`, the
generic KIS fail-closed behavior, and the unconditional `KIS_ACCOUNT_NO` hard block are all
untouched (confirmed by `check:phase-4f-hf2-portfolio-identity` Group I, 6/6, and by
`check:phase-4f-hf1-functional-high` remaining 58/58). No account/balance/order/trade/FX/US-live
scope was expanded.

## 11. Status of F-HIGH-01/02/03

- **F-HIGH-01 (`CHART-05`): CLOSED** (Owner-verified in a prior phase; not touched by HF2).
- **F-HIGH-02 (`PORT-10`): IMPLEMENTED / BLOCKED-UNTIL-HF2-MERGE.** The valuation route's narrow
  Production capability from HF1 is unchanged and untouched; it remains blocked on this phase's
  merge plus a real canonical KR symbol to value against (previously unobtainable because identity
  itself was broken).
- **F-HIGH-03: IMPLEMENTED / PRODUCTION-VERIFICATION-REQUIRED.** The canonical identity contract,
  combobox, legacy-compatibility resolver, and server-authoritative create/update are complete and
  covered by 60 smoke + 52 checker assertions (112 total), but per §15 neither F-HIGH-02 nor
  F-HIGH-03 may be declared CLOSED before an Owner performs the Production proving path: legacy row
  → resolved/edited to canonical symbol → valuation route → real KIS quote → numeric 현재가/
  평가금액/수익률/수익금.

**Owner QA formal count remains 0/120** — no Production QA has been executed for this phase.

## 12. Changed files

- `src/lib/server/chart-ai/universal-instrument-search.mjs` — `resolveUniversalInstrumentExact` +
  `resolveCanonicalPortfolioInstrument`.
- `src/lib/server/portfolio.ts` — `resolveCanonicalOrFail`; `createPosition`/`updatePosition`
  server-authoritative canonicalization.
- `src/pages/api/portfolio/valuation.ts` — `resolveLegacyKrIdentity`; `toRecordInput` legacy-aware
  record construction.
- `src/lib/server/portfolioValuation.ts` — plumbs `identityResolved` through
  `buildKrPortfolioValuation`'s three return branches (unsupported/quote-unavailable/valued) so the
  pure calc function's output carries it end-to-end to the client.
- `src/pages/portfolio.astro` — accessible instrument combobox, canonical selection state, input
  invalidation, read-only asset-type/currency derivation, edit-position legacy-symbol prefill.
- `src/lib/portfolioClient.ts` / `src/lib/server/providers/types.ts` — additive
  `identityResolved` field on the valuation row/record-input types.
- `package.json` — wires the two new HF2 npm scripts.
- `scripts/check_phase_4e_portfolio_production_completion_contract.mjs` — narrow A1/K9
  reconciliation (§9).
- New: `scripts/phase_4f_hf2_resolver_testsrc.ts`,
  `scripts/phase_4f_hf2_legacy_compatibility_testsrc.ts`,
  `scripts/phase_4f_hf2_create_edit_contract_testsrc.ts`,
  `scripts/smoke_phase_4f_hf2_portfolio_identity.mjs`,
  `scripts/check_phase_4f_hf2_portfolio_identity_contract.mjs`.

No Owner-local untracked file was staged or committed. `git add .` / `git add -A` was never used.

## 13. PR

- Title: "Phase 4F HF2: fix Portfolio instrument identity".
- Base: `main`. Head: `fix/phase-4f-hf2-portfolio-instrument-identity` (PR #23).
- **Not merged** — pre-merge review required. Owner Production proving path (§11/§15) must be
  completed before F-HIGH-02/F-HIGH-03 can be declared CLOSED.

## 14. HF2-A1 — fix raw exact-entry market-hint leak (2026-08-09)

An independent premerge review of PR #23 found one contract defect, isolated entirely to the
**client submit-decision path** (the canonical resolver, the legacy KR resolver, and the server-side
`resolveCanonicalOrFail` were all already correct and were not touched by A1).

**Defect.** The portfolio form carries a hidden `<input type="hidden" id="position-market"
value="KR" />`. The submit handler derived `market = selectedPositionInstrument?.country ||
hiddenMarket || 'KR'`. A user who typed an exact US symbol (e.g. `AAPL`) directly into the field
without clicking a combobox suggestion therefore submitted `symbol=AAPL, market=KR`; the server
correctly rejected this as `INSTRUMENT_MARKET_MISMATCH`, breaking the §7 exact-entry convenience
contract for any non-KR raw entry.

**Fix — three distinct identity-submit states.** A new pure, DOM-free function
`resolvePositionSubmitIdentity` (`src/lib/portfolio/portfolioPositionIdentity.ts`) makes the submit
decision explicit and is the single source of truth the submit handler now calls:

1. **Canonical combobox selection exists** → submit its `symbol`/`country`, regardless of any stale
   hidden field.
2. **No selection, but an existing position was reopened and its identity text was not modified** →
   submit the hidden `symbol`/`market` (the stable edit/re-save path). `hiddenMarket` is read only
   inside the `hiddenSymbol`-non-empty branch — **hiddenMarket is only ever trusted when hiddenSymbol
   is also non-empty** (§3's required invariant).
3. **Visible text was manually entered or modified and no canonical selection exists** → submit the
   raw visible text as `symbol` with `market` **omitted** (`undefined`), never defaulted to `'KR'`
   and never regex-inferred. The existing, unmodified server-side `resolveCanonicalOrFail` already
   handles `market === undefined` correctly, so no server change was required.

`portfolio.astro`'s `clearSelectedInstrument()` now clears the hidden **market** field alongside the
hidden symbol field (previously only the symbol was cleared), keeping the DOM state itself honest so
a stale hidden market value cannot survive into state 2 above after an edit invalidates the prior
selection.

**New behavioral test suite (§4 — all 10 required cases, plus one additional safety case):**
`scripts/phase_4f_hf2_a1_submit_identity_testsrc.ts` (new, 34 assertions), calling the real
`resolvePositionSubmitIdentity` and, where the spec required proving the end-to-end path, chaining
its output into the real `resolveCanonicalOrFail`:

1. Raw `AAPL`, no selection, no hidden symbol → market omitted → server resolves US/AAPL/USD.
2. Raw `005930` → market omitted → server resolves KR/삼성전자/KRW.
3. Raw `삼성전자` (exact name, no click) → market omitted → server resolves to `005930`.
4. Canonical selection `AAPL`/`US` (with a stale `hiddenMarket=KR`) → selection wins: `AAPL`/`US`.
5. Canonical selection `005930`/`KR` → `005930`/`KR`.
6. Unmodified existing KR row reopened for edit → hidden `005930`/`KR` resubmitted unchanged.
7. Unmodified existing US row reopened for edit → hidden `AAPL`/`US` resubmitted unchanged.
8. Legacy row (`hiddenSymbol=삼성전자`, `hiddenMarket=KR`) left unmodified → resubmits `삼성전자`/`KR`
   → server exact-resolves to `005930` (the §12 legacy-edit path, still correct).
9. Legacy row **modified** (invalidation already cleared both hidden fields) → falls through to the
   raw path: `AAPL`, market omitted.
   - 9b. Additional safety case: a stale `hiddenMarket=KR` surviving alongside an empty
     `hiddenSymbol` must still never leak into the decision — market stays omitted.
10. Ambiguous `삼성` → market omitted (raw path) → server rejects with the exact required message
    `'검색 결과에서 종목을 선택해 주세요.'`, never auto-picking a candidate.

All 34/34 pass.

**§5 fix to the existing create/edit contract test:**
`scripts/phase_4f_hf2_create_edit_contract_testsrc.ts` — corrected the comment on the pre-existing
`resolveCanonicalOrFail('005930', undefined)` case to state that, as of A1, this genuinely matches a
real raw-entry client submission (not just a server-side hypothetical), and added a new case 2b
(`resolveCanonicalOrFail('AAPL', undefined)` → US/AAPL/USD) proving the same no-market-hint path
resolves correctly for a US symbol, not only KR. Now **26/26** (up from 22/22).

**Smoke/checker totals updated by A1:**

- `smoke:phase-4f-hf2-portfolio-identity` — now **93/93** (23 resolver + 15 legacy-compatibility +
  26 create-edit-contract + 34 new a1-submit-identity), up from 60/60. The new
  `phase_4f_hf2_a1_submit_identity_testsrc.ts` entry was wired into
  `scripts/smoke_phase_4f_hf2_portfolio_identity.mjs`'s `ENTRIES` array.
- `check:phase-4f-hf2-portfolio-identity` — now **63/63** (up from 52/52), adding two new file-
  existence checks (0j: A1 test source exists; 0k: `portfolioPositionIdentity.ts` module exists) and
  a new **Group K** (9 assertions): the pure helper is exported and never defaults raw entry to
  `'KR'`; the hiddenMarket-only-with-hiddenSymbol invariant is structurally present; `portfolio.astro`
  imports and calls the helper (not a manual `||` fallback chain); the old leak pattern
  (`selectedPositionInstrument?.country || hiddenMarket || 'KR'`) is gone; `clearSelectedInstrument`
  clears both hidden fields; `PositionInput.market` is optional in `portfolioClient.ts`; the new A1
  test source is wired into the smoke runner.

**Sibling reconciliation within this phase's own checker** (same narrow-fix convention as §9):
adding an explanatory comment block inside `clearSelectedInstrument` (between its opening `{` and its
first statement) broke two regex assertions that assumed whitespace-only content there — the
pre-existing **E1** (`clearSelectedInstrument` nulls the selection and hidden symbol) and the new
**K7** (`clearSelectedInstrument` also clears the hidden market). Both were widened from `\s*` to
`[\s\S]*?` immediately after the opening brace to tolerate the comment, without loosening what either
assertion actually requires. Re-run after the fix: 63/63.

**Regression gate — re-run in the exact required order, all green:**
`smoke:phase-4f-hf2-portfolio-identity` (93/93), `check:phase-4f-hf2-portfolio-identity` (63/63),
`smoke:phase-4f-hf1-functional-high` (39/39 + 20/20), `check:phase-4f-hf1-functional-high` (58/58),
`check:phase-4c-chart-ai-production-completion` (35/35),
`smoke:phase-4e-portfolio-production-completion` (21/21),
`check:phase-4e-portfolio-production-completion` (65/65, unchanged from §9),
`smoke:phase-3gh-portfolio-live-valuation-mvp` (55/55),
`check:phase-3gh-portfolio-live-valuation-mvp` (86/86), `check:mobile-baseline` (74/74),
`check:project-lightweight-roadmap` (27/27); the full 10-command Phase 4F gate (same 10 commands and
counts as §8, all green); `git diff --check` (clean); `npm ls --depth=0` (clean); `npm run build`
(all real build stages completed successfully — types, server entrypoints, 3 Vite builds, Vercel
adapter rearrangement — `dist/{client,server}` confirmed freshly written on disk; the process then
exited nonzero, the same known Windows-only post-build teardown artifact documented in §8/HF1 — not a
compile error).

**Changed/new files in A1** (in addition to the §12 list, which stays otherwise accurate):

- New: `src/lib/portfolio/portfolioPositionIdentity.ts` — `resolvePositionSubmitIdentity`.
- New: `scripts/phase_4f_hf2_a1_submit_identity_testsrc.ts` — the 34-assertion §4 behavioral suite.
- Modified: `src/pages/portfolio.astro` — submit handler now derives identity via
  `resolvePositionSubmitIdentity`; `clearSelectedInstrument` also clears the hidden market field.
- Modified: `src/lib/portfolioClient.ts` — `PositionInput.market` changed from required
  `'KR' | 'US'` to optional `market?: 'KR' | 'US'`.
- Modified: `scripts/phase_4f_hf2_create_edit_contract_testsrc.ts` — corrected comment + new case 2b.
- Modified: `scripts/smoke_phase_4f_hf2_portfolio_identity.mjs` — wired in the new A1 test entry.
- Modified: `scripts/check_phase_4f_hf2_portfolio_identity_contract.mjs` — new Group K + 2 new
  file-existence checks + the E1/K7 regex reconciliation above.

**Explicitly not changed by A1** (per scope): the exact resolver matching rules, the legacy KR
in-memory resolver, the Portfolio KIS Production feature gate, the `KIS_ACCOUNT_NO` block, valuation
scope, the Universal Master, the combobox visual design, the Portfolio dashboard, SWR, Chart AI,
Market, Home, or Lab.

**Status.** F-HIGH-02 and F-HIGH-03 remain **not CLOSED** — Owner QA remains 0/120 and Production
verification (§11) is still required. This addendum only fixes a client-side contract defect found
during premerge review; it does not change the Owner-verification requirement in any way.

**Overall classification after A1: `PHASE_4F_HF2_A1_COMPLETE_PREMERGE_REVIEW_REQUIRED`.** PR #23 is
still **not merged**.
