# Phase 4E — Portfolio Production Completion — Result v0.1

**Current status**: `PHASE_4E_PORTFOLIO_MERGED_PRODUCTION_VERIFIED`

**Baseline**: `b3254aa35db76fe264cbb8167f20c47291b87838`
**Branch**: `feature/phase-4e-portfolio-production-completion`
**Plan**: [`phase_4e_portfolio_production_completion_plan_v0.1.md`](phase_4e_portfolio_production_completion_plan_v0.1.md)
**Plan-review correction**: commit `99c58e4aed993bc757fd1db25c95506f9c2cbdb0` (Phase 4E-A.1)

Phase 4E-A (plan-only audit) and Phase 4E-A.1 (owner-review correction) produced and corrected the
approved implementation plan with no application code change. This document reports the results of
**Phase 4E-B**, the implementation task that carried out all 10 approved requirements (A–J).

## §1 Implementation

`IMPLEMENTED`. All 10 approved requirements from the plan's §6 were implemented in
`src/pages/portfolio.astro` (plus a small new pure module and Portfolio-scoped CSS):

- **A — ETF UI exposure**: lead copy now reads "국내와 미국 주식, ETF 보유 종목을 관리합니다."; the
  asset-type select gained an `<option value="etf">ETF</option>`.
- **B — Currency toggle truthfulness**: the `현지`/`₩` segmented control (`#currency-display-toggle`)
  no longer implies a live FX conversion it doesn't perform.
- **C — baseCurrency truthfulness**: added explicit copy — `#portfolio-base-currency-hint`
  ("합산 평가금액은 원화(KRW) 기준으로 계산됩니다. USD를 선택해도 원화 환산은 현재 미지원입니다.") and
  a matching `.kpi-note` ("KRW 기준 합산 · USD 환산 현재 미지원"). **Corrected in Phase 4E-B.HF1**: the
  original wording was internally contradictory (it disclosed "원화 환산은 현재 미지원" — KRW conversion
  unsupported — right next to stating the aggregate is already KRW-based). Replaced with "현재 합산
  평가금액은 원화(KRW) 기준으로 제공되며, USD 환산은 지원하지 않습니다." and wired the select to the hint
  programmatically via `aria-describedby="portfolio-base-currency-hint"` on `#portfolio-base-currency`.
- **D — Dividend surface honesty**: removed the dividend sort affordance entirely (no
  `data-sort-column`, no `sort-arrow-button`, no `dividend-yield-*`/`annual-dividend-*` sort keys —
  the dividend column was consolidated to a single, non-sortable 배당률/배당주기 header group cell);
  no dividend provider exists, so both dividend value cells honestly render
  `<strong class="metric-placeholder">데이터 대기</strong>` /
  `<small class="metric-placeholder">데이터 대기</small>` rather than a fabricated figure. The
  previously-planned separate "예상 연배당금" (estimated annual dividend) figure was also confirmed
  removed rather than left half-wired.
- **E — Dynamic status accessibility**: `#portfolio-readiness` and `#valuation-status-copy` both carry
  `role="status" aria-live="polite" aria-atomic="true"`.
- **F — Dialog focus lifecycle**: opener-focus capture/restore (`restoreOpenerFocus`) and a real
  focus trap (`getDialogFocusableElements` + `computeDialogFocusWrap`) wired into the shared dialog
  keydown handler for both the portfolio-create and position sheets.
- **G — Complete portfolio tab semantics**: full ARIA tablist pattern — `role="tab"`,
  `aria-selected`, `aria-controls`, roving `tabIndex` (0/-1), `computeTabRovingNavigation` handling
  ArrowLeft/ArrowRight/Home/End, and `aria-labelledby` kept in sync on the detail panel.
- **H — Holdings semantics**: removed the invalid `role="row"` / `role="columnheader"` markup (the
  holdings surface stays a non-table card grid, per the Hard Rule against a full HTML table
  redesign).
- **I — Horizontal scroll accessibility**: `#positions-list-wrap` now has
  `role="region" aria-label="보유 종목 목록, 좌우로 스크롤 가능" tabindex="0"`, plus a matching
  `.positions-list-wrap:focus-visible` CSS rule (light + `body.dark-mode`).
- **J — Responsive completion**: static audit found and fixed one dead-CSS defect (a
  `.portfolio-mvp` rule inside the `max-width: 980px` media query that could never match); live-
  browser breakpoint QA at 320–1024px is explicitly deferred to Owner QA / Phase 4F, since
  `/portfolio` requires an authenticated Supabase session that is not feasible to exercise under
  assistant policy (this deferral was pre-approved in the plan's own §19 boundary).

New pure module: `src/lib/portfolio/portfolioKeyboardNav.ts` — exports `computeDialogFocusWrap`
(item F) and `computeTabRovingNavigation` (item G), both pure, DOM-free index math, consumed by
`portfolio.astro` and exercised directly by the new smoke test.

### Phase 4E-B.HF1 — pre-merge review hotfix

A narrow pre-merge review pass identified and fixed two remaining gaps before PR #19 merge, without
expanding Phase 4E's scope:

- **baseCurrency wording correction** (item C): see the corrected copy and `aria-describedby` wiring
  noted above under item C.
- **Completed the approved focus-visible coverage** (plan §9): added Portfolio-scoped
  `:focus-visible` styling for `.portfolio-mvp .segmented-control button` (the currency display
  toggle), `.position-name-link` (the per-position chart-link), and the two dialog sheets' action
  controls (`.portfolio-sheet .table-action-button:focus-visible`,
  `.position-sheet .table-action-button:focus-visible`) — all additive, none globally scoped, none
  duplicating the already-correct `.portfolio-bookmark-tab`, `.portfolio-tab-inline-action`,
  `.portfolio-tab-reorder-btn`, `.sort-arrow-button`, or `.positions-list-wrap` focus rules.
- No business/provider/API scope change; no server or migration touched.

## §2 Changed files

- `src/pages/portfolio.astro` (modified — items A–J)
- `src/styles/style.css` (modified — Portfolio-scoped `.positions-list-wrap` focus-visible rules,
  item J dead-rule removal)
- `src/lib/portfolio/portfolioKeyboardNav.ts` (new — pure keyboard-navigation module)
- `scripts/phase_4e_portfolio_production_completion_testsrc.ts` (new — smoke test source, 21 checks)
- `scripts/smoke_phase_4e_portfolio_production_completion.mjs` (new — esbuild-bundled smoke runner)
- `scripts/check_phase_4e_portfolio_production_completion_contract.mjs` (new — static contract
  checker, 61 checks across Groups 0/A–J/K)
- `scripts/check_portfolio_holdings_category_header_static_contract.mjs` (modified — narrow
  reconciliation of the dividend-sort-specific assertions in Groups 4/5/6/7 to match item D's
  honest, sort-free dividend column; see §3 for detail)
- `package.json` (modified — added `smoke:phase-4e-portfolio-production-completion` and
  `check:phase-4e-portfolio-production-completion` script entries)
- `docs/planning/phase_4e_portfolio_production_completion_plan_v0.1.md` (modified — typo fix, "all 9
  numbered items above" → "all 10 numbered items above")
- `docs/planning/phase_4e_portfolio_production_completion_result_v0.1.md` (modified, this file)
- `docs/planning/mk_stock_lab_master_roadmap_v2.1.md` (modified — Phase 4E entry updated)
- `docs/planning/planning_changelog.md` (modified — new top entry)

No API route, migration, environment, or `.gitignore` file was changed. No npm dependency was added
(`npm ls --depth=0` unchanged: `@astrojs/vercel`, `@supabase/supabase-js`, `astro`, `chart.js`,
`d3-hierarchy`, `html-to-image`, `pretendard`).

## §3 Test/checker results

**New tests (both required by plan §7/§13, both 100% passing on first run):**

- `npm run smoke:phase-4e-portfolio-production-completion` → **21/21 PASS** (pure
  `computeDialogFocusWrap` / `computeTabRovingNavigation` index-math assertions, esbuild-bundled, no
  network/DOM/Supabase).
- `npm run check:phase-4e-portfolio-production-completion` → **65/65 PASS** (static markup/contract
  checker covering Group 0 file existence, Groups A–J mapped to the 10 approved requirements, Group
  K's 12 Hard-Rule safety-boundary assertions — no trading/order/brokerage, no US quote/FX/dividend
  provider, no KIS account API, no LLM, no Supabase migration, no raw `fetch()` in `portfolio.astro`,
  no non-Portfolio `/api/` route, `portfolioKeyboardNav.ts` stays pure, no `<table>` element — and, as
  of Phase 4E-B.HF1, Group L's 3 focus-visible coverage assertions. Group C grew from 4 to 5
  assertions in HF1: the two stale checks tied to the old contradictory copy were rewritten to assert
  the corrected wording, its absence-of-contradiction, and the new `aria-describedby` wiring.)

**Sibling checker reconciliation** (`check_portfolio_holdings_category_header_static_contract.mjs`,
Phase 3BR): item D removed the dividend sort affordance and the separate "예상 연배당금" figure, which
made several of this checker's older dividend-sort-specific assertions (Groups 4, 5, 6, 7) newly
false. Reconciled narrowly — each stale "assert dividend sort/label exists" check was replaced with
an explicit "assert dividend sort/label is intentionally absent" check, documenting the Phase 4E item
D rationale inline; no other group, and none of the `데이터 대기` text assertions, were touched.
Result: `npm run check:portfolio-holdings-header` → **81/84 PASS** (3 pre-existing failures —
`카테고리` eyebrow label, `연동 예정` placeholder text, and the `.position-card` `repeat(10,)`
CSS column-count assertion — confirmed via `git show 99c58e4:...` to already be absent/failing at
this phase's own baseline commit, i.e. drift from an earlier phase (3BR) predating any Phase 4E-B
edit. Out of this task's narrow reconciliation scope; not "fixed" merely to pass, per the plan's
own instruction to classify honestly rather than force unrelated checkers green).

**Full regression gate** (all commands run from `E:\개인 프로젝트\mk-stock-lab` on
`feature/phase-4e-portfolio-production-completion`):

| Command | Result |
|---|---|
| `npm ci` | PASS (309 packages, clean install) |
| `smoke:phase-4e-portfolio-production-completion` | 21/21 PASS (unchanged by HF1 — pure keyboard-nav math, not touched) |
| `check:phase-4e-portfolio-production-completion` | 65/65 PASS (was 61/61 before HF1; +1 Group C assertion, +3 Group L assertions) |
| `smoke:phase-3gh-portfolio-live-valuation-mvp` | 55/55 PASS |
| `check:phase-3gh-portfolio-live-valuation-mvp` | 86/86 PASS |
| `check:portfolio-bookmark-tabs` | 121/121 PASS |
| `check:portfolio-create-sheet` | 79/79 PASS |
| `check:portfolio-holdings-header` | 81/84 (3 pre-existing baseline failures, documented above) |
| `check:home-portfolio-panel` | 102/102 PASS |
| `check:mobile-baseline` | 74/74 PASS |
| `check:phase-4a-home-common-shell` | 75/75 PASS |
| `check:phase-4b-market-production-completion` | 79/79 PASS |
| `check:phase-4c-chart-ai-production-completion` | 35/35 PASS |
| `check:phase-4d-lab-production-completion` | 62/62 PASS |
| `check:project-lightweight-roadmap` | 27/27 PASS |
| `git diff --check` | clean (0 whitespace errors) |
| `npm run build` | all real build stages completed ("✓ Completed in 11.96s", `dist/` written with 122 files); process then hit the known Windows-only `STATUS_STACK_BUFFER_OVERRUN` (exit `-1073740791`) teardown crash established in Phase 4D as a benign Node/Windows quirk unrelated to code correctness — Vercel's Linux Preview build (§4) is the authoritative build gate |
| `npm ls --depth=0` | clean, no missing/extraneous/new dependency |

The three deliberately-retired checkers (`check:portfolio-owner-review-prep`,
`check:portfolio-ticker-display-name`, `check:portfolio-layout`) were **not** run or "fixed" — they
remain classified as retired per the plan, not part of this phase's regression surface.

## §4 Preview validation

Verified final exact-Head record:

- PR: #19
- exact PR Head: `8cec77555cbc50501dc890e56cc3d60fe8dfe03b`
- Vercel Preview deployment: `dpl_3sUvf12uSCojM8RLefZqNSUZTQeE`
- state: `READY`
- target: `Preview` / `target=null`
- source: `git`
- githubCommitRef: `feature/phase-4e-portfolio-production-completion`
- githubCommitSha: `8cec77555cbc50501dc890e56cc3d60fe8dfe03b`
- githubPrId: `19`
- exact-Head requirement: `PASS`

Route-level result: `SSO_BLOCKED`. Recorded honestly — ordinary Preview navigation redirects to
Vercel authentication; no Deployment Protection bypass URL was created; no share URL was created; no
protection setting was changed. Therefore application-route Preview behavior was **not** claimed as
independently verified. Authenticated Portfolio interaction remains deferred to Phase 4F Owner QA.

## §5 Merge

`MERGED`. PR #19 was reviewed and merged by the Owner into `main`.

- PR: #19
- Owner merged
- merge commit: `6cca38aba04c875abf985cb979625a26cf2a340c`

## §6 Production verification

`VERIFIED` (bounded, unauthenticated verification only — see below).

- Automatic Vercel Production deployment: `dpl_AxKXATutrX9ALjkzHruUcRFjEr6L`
- state: `READY`
- target: `production`
- source: `git`
- githubCommitRef: `main`
- githubCommitSha: `6cca38aba04c875abf985cb979625a26cf2a340c` — exactly matches the merge commit
- commit verification: `verified`
- the automatic Production deployment trigger fired normally after merge; no manual
  Create Deployment / Redeploy was required

**Production route verification**: `https://mkstocklab.vercel.app/portfolio` → HTTP `200`.

**Bounded deployed-HTML verification** (unauthenticated, static-markup checks only), confirmed
present in the Production response:

- ETF asset-type selector exists
- the local/native currency control is labeled "현지", not a fake "$ / 달러 기준"
- the truthful baseCurrency disclosure is present: "현재 합산 평가금액은 원화(KRW) 기준으로 제공되며,
  USD 환산은 지원하지 않습니다."
- `portfolio-base-currency` uses `aria-describedby`
- `portfolio-readiness` and `valuation-status-copy` carry status/live-region semantics
- the portfolio detail panel uses `role="tabpanel"`
- `positions-list-wrap` uses `role="region"`, `aria-label`, `tabindex="0"`
- the dividend sort affordance is absent
- no invalid holdings `role="row"`/`role="columnheader"` structure remains

**Not claimed** (explicitly deferred to Phase 4F Owner QA, not interactively re-tested in
Production this phase):

- authenticated CRUD was **not** interactively re-tested in Production
- the dialog focus trap was **not** interactively verified
- mobile breakpoint rendering was **not** interactively verified
- touch behavior was **not** interactively verified

## §7 Deferred Owner QA

Item J's live-browser breakpoint QA (320/360/390/412/768/1024px rendering checks for long names,
large KRW/USD numbers, negative returns, and the sheets/dialogs) is explicitly deferred to Owner QA
or Phase 4F, since `/portfolio` requires an authenticated Supabase session that assistant policy
cannot exercise. This deferral was pre-approved in the plan's own §19 boundary and does not block
this implementation from being considered complete for PR review purposes.

## §8 Final classification

`PHASE_4E_PORTFOLIO_MERGED_PRODUCTION_VERIFIED`. All 10 approved requirements (A–J) are implemented,
both new required tests pass at 100%, the one affected sibling checker was narrowly and honestly
reconciled, the full regression gate was green except for 3 pre-existing unrelated checker-drift
failures documented above, no Hard Rule boundary was crossed, PR #19 was merged by the Owner
(merge commit `6cca38aba04c875abf985cb979625a26cf2a340c`), and the automatic Vercel Production
deployment (`dpl_AxKXATutrX9ALjkzHruUcRFjEr6L`) reached `READY` with `/portfolio` returning HTTP 200
and the bounded unauthenticated Production HTML checks passing. Authenticated CRUD, dialog focus
trap, mobile breakpoint rendering, and touch behavior remain deferred to Phase 4F Owner QA.
