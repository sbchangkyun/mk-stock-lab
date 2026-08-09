# Phase 4F — Cross-Page Owner QA Closeout — Plan v0.1

Status: `PHASE_4F_CROSS_PAGE_OWNER_QA_PLAN_READY_QA_NOT_STARTED`

Baseline: `main` @ `198c24c9f70010bd5cc077555c69c9035066dc7c` (Phase 4A–4E all merged and
Production-verified). Branch: `docs/phase-4f-cross-page-owner-qa-plan`.

## §0 Scope and Hard Rule

This document is **plan only**. No application code, styles, scripts, migrations, config,
dependencies, or environment variables are touched by this phase's planning step. If a defect is
discovered while later executing this plan, it is recorded in the result doc first; a separate,
narrowly-scoped hotfix decision is made afterward — this plan does not pre-authorize any fix.

## §1 Purpose

Phases 4A–4E each shipped a "production readiness pass" for one page/surface (Home & common
shell, Market, Chart AI, Lab, Portfolio) and each deliberately deferred the QA that requires a
real authenticated browser session — visual, touch, keyboard, and screen-reader verification —
because the assistant executing those phases has no authenticated Owner session. Phase 4F is the
single closeout lane where the Owner performs that deferred QA, using this document as the test
plan and `phase_4f_cross_page_owner_qa_closeout_result_v0.1.md` as the evidence record.

## §2 Source-of-deferral audit

Extracted from the Phase 4A–4E plan and result docs. This is not new product scope — every item
below traces to an existing deferral or an already-shipped behavior that was never interactively
exercised.

### §2.1 Already deferred to Phase 4F, explicitly named in the docs

- **Home / common shell (4A)** — authenticated click-through QA (nav `aria-current`, focus-visible
  on brand mark / icon buttons / nav links / feature cards / footer links, 44px mobile touch
  targets); Production runtime-error-cluster dashboard review (assistant had no Vercel dashboard
  access this phase, used unauthenticated HTTP as a weak proxy only). *(plan §6; result §7)*
- **Market (4B)** — authenticated click-through/visual QA, named at an umbrella level only (no
  sub-items individually listed in the docs — see §3.4 below for how this plan resolves that).
  *(plan §6; result §7)*
- **Chart AI (4C)** — authenticated visual/touch/keyboard/screen-reader QA of every change this
  phase, explicitly including the restored Market Intelligence section; live-KIS and
  usage-counter Production QA; Vercel runtime-error dashboard query for `/chart-ai` and its 5 API
  routes (user-supplied claim, not independently verified by the assistant). *(plan §6; result §7,
  §9)*
- **Lab (4D)** — the most granular of the five: responsive layout at all breakpoints; pointer/touch
  interaction (matrix pin, `.lab-matrix-scroll` touch scroll); real keyboard traversal (legend
  buttons, `Escape`-clears-pin, keyboard-scroll of `tabindex="0"` regions); screen-reader
  announcement of the export-status live region; dark-mode contrast of new focus states. *(plan
  §15; result §6, §7)*
- **Portfolio (4E)** — authenticated CRUD; dialog focus trap; portfolio-selector tablist keyboard
  navigation; mobile breakpoint rendering (long names, large KRW/USD numbers, negative returns,
  sheets/dialogs); touch behavior. *(plan §19; result §6, §7)*

### §2.2 Already claimed verified — not re-tested by Owner unless a specific row below says so

- Every phase's bounded, unauthenticated Production HTTP/HTML-marker sweep (route 200/401/301
  checks, presence of specific truthful-copy strings and ARIA attributes in served HTML) —
  4A result §9, 4B result §9, 4C result §9, 4D result §6, 4E result §6.
- Every phase's own smoke/checker suite, run and green at merge time.

### §2.3 Explicitly out of scope for Phase 4F

- **Market's "detailed all-symbol/all-period QA sweep"** — the docs keep this in a separate
  "Phase 3 Closeout" lane, distinct from Phase 4F. Not included in the matrix below.
- **Ad vendor business behavior** beyond obvious layout interference with critical controls (per
  this task's own §6 instruction).
- **WCAG certification** — §12's accessibility pass is an Owner spot check, not a certification
  audit.
- **External Netlify Git integration** still connected and producing its own PR checks (noted in
  4C result §9 as an unresolved, non-QA infra item) — flagged for Owner awareness in §4 below, not
  a QA row.
- **Repairing historical/retired checker drift** (pre-existing failures already attributed to
  earlier phases, e.g. the 3 Phase-3BR checker-drift failures noted in 4E's result doc) — not
  repaired as part of this QA plan.

## §3 Ambiguities found in the Phase 4A–4E deferral record

1. **Vercel log/dashboard access inconsistency.** 4A's and 4C's result docs both state the
   assistant session had no Vercel dashboard/API/CLI/connector access and could not independently
   confirm runtime-error-cluster claims. 4B's result doc (§9.7), however, records the assistant
   itself running `vercel logs --project mkstocklab --environment production --since 20m --json`
   and getting real output. Historical Phase 4A/4B/4C records remain inconsistent about Vercel log
   access. For the current Phase 4F execution, that historical ambiguity is operationally resolved
   by using the currently available read-only Vercel connector. Production runtime-error review is
   therefore `AUTOMATABLE` under §15 and is not an Owner-manual QA row — strictly read-only, no
   Redeploy, no mutation, no environment/config change (see §15's connector-assisted gate).
2. **`@astrojs/netlify` dependency.** 4A deferred its removal as a tracked `DEFERRED` roadmap item;
   4C's result doc shows it was actually removed from `package.json` between those two phases, but
   this was never cross-referenced back to close the 4A item. The *dependency* is resolved; the
   *external Netlify Git integration* (still connected, still commenting on PRs) is not. This plan
   flags it as an out-of-scope infra note (§2.3) for Owner awareness, not a QA row — it is not a
   page-level behavior a QA pass can verify.
3. **Lab's empty-cell `aria-label="데이터 없음"` fallback** was explicitly *not* confirmed present in
   Production HTML by 4D's own result doc, because the live fixture currently has no empty cells to
   render it against — the one item in an otherwise "already verified" table that admits a gap.
   This plan carries it forward as a targeted, opportunistic Owner check (LAB-16) rather than
   silently treating it as already covered.
4. **Market's tab-keyboard-nav and modal-focus-trap were never individually named as deferred**,
   unlike Chart AI/Lab/Portfolio's granular lists — 4A and 4B only ever use the umbrella phrase
   "authenticated click-through/visual QA." Since both behaviors were concretely built in Phase 4B
   (plan §3 items 6–7), this plan treats them as deferred by inference from the implementation
   description and includes them as explicit rows (MARKET-03, MARKET-04, MARKET-10, MARKET-11)
   rather than leaving them folded into an umbrella item that could be mistaken for "nothing
   specific to check."
5. **Market's detailed all-symbol/all-period sweep is deliberately excluded from Phase 4F**
   because the roadmap assigns it to the separate Phase 3 Closeout lane, not because it was
   overlooked (see §2.3 and `MARKET-16`).
6. **Phase 4D's deployment-trigger anomaly and Phase 4E's recurrence test** are release/infra
   concerns interleaved into the Production-verification sections of those docs, not Owner-QA
   items. Not included in the matrix below.

## §4 Viewport testing convention

Applied by default to every row marked "Std" in the Viewport column, unless a row overrides it:

- **Desktop full functional pass** — 1440px or wider. Every functional scenario in that row is
  exercised here first.
- **Representative responsive full pass** — 768px, 390px, 320px. The same functional scenario is
  repeated in full at these three widths.
- **Targeted breakpoint-only pass** — 1024px, 412px, 360px. Layout/overflow/touch-target checks
  only at these widths; the full functional scenario is not repeated a fourth/fifth/sixth time.

Rows that are inherently desktop-only (e.g., hover-triggered native tooltips) or mobile-only (e.g.,
touch-target sizing) say so explicitly instead of "Std."

Classification legend used throughout §5–§11:

- `OWNER_MANUAL_REQUIRED` — needs a real authenticated browser session, human visual/interaction
  judgment, touch, or assistive-tech verification; cannot be scripted.
- `ALREADY_PRODUCTION_VERIFIED` — a specific Phase 4A–4E result-doc citation already confirms this;
  re-run only via the §15 automated gate, not as a new Owner-manual row.
- `OUT_OF_SCOPE` — explicitly deferred to a different lane or explicitly excluded by this task.
- `AUTOMATABLE` items (script-checkable without Owner interaction) are **not** itemized as
  individual matrix rows below — they are consolidated into the §15 Automated Support Gate, which
  is run once, before manual QA begins, to avoid duplicating the same route/HTML-marker check
  under two different headings.

## §5 QA Matrix — A. Home / Common Shell (`4F-SHELL`)

| ID | Viewport | Auth | Steps | Expected | Class |
|---|---|---|---|---|---|
| SHELL-01 | Std | In | Navigate Home → Chart AI → Market → Lab → Portfolio → Home | Session stays logged in throughout, no unexpected sign-out | OWNER_MANUAL_REQUIRED |
| SHELL-02 | Std | In | Visit each of the 5 pages | Active nav indicator matches current page on every page | OWNER_MANUAL_REQUIRED |
| SHELL-03 | Desktop | Either | Toggle dark/light theme | Theme switches immediately, no flash of unstyled content | OWNER_MANUAL_REQUIRED |
| SHELL-04 | Desktop | Either | Set theme, navigate to another page | Theme persists across navigation (if designed to persist) | OWNER_MANUAL_REQUIRED |
| SHELL-05 | Desktop | Either | Set theme, reload page | Theme persists across reload (if designed to persist) | OWNER_MANUAL_REQUIRED |
| SHELL-06 | Std | Either | Inspect header and footer on each page | Layout correct, no overlap/clipping | OWNER_MANUAL_REQUIRED |
| SHELL-07 | Std | Either | Observe ticker belt on Home | Displays/scrolls correctly, no clipped text | OWNER_MANUAL_REQUIRED |
| SHELL-08 | Std | Either | Load each of the 5 pages | No document-level horizontal overflow/scrollbar | OWNER_MANUAL_REQUIRED |
| SHELL-09 | Desktop + T768 | Either | Tab through brand mark, icon buttons, nav links, feature cards, footer links | Focus-visible outline appears on each | OWNER_MANUAL_REQUIRED |
| SHELL-10 | — | Either | Visit an unknown route (assistant already confirmed via unauthenticated HTTP) | 404 page content present | ALREADY_PRODUCTION_VERIFIED (4A result §9) |
| SHELL-11 | Std | Either | Visit an unknown route, inspect visually | 404 page laid out correctly, nav still functional from it | OWNER_MANUAL_REQUIRED |
| SHELL-12 | Std | Either | Inspect Home market cards | Display without clipping at every viewport | OWNER_MANUAL_REQUIRED |
| SHELL-13 | Desktop | Either | Inspect Home news cards against actual source | Headlines/content match source, nothing fabricated | OWNER_MANUAL_REQUIRED |
| SHELL-14 | Std | Either | Inspect ad slot placement relative to nav/CTA/form controls | Ad areas do not cover or overlap critical controls | OWNER_MANUAL_REQUIRED |
| SHELL-15 | — | — | (ad vendor's own behavior beyond layout interference) | — | OUT_OF_SCOPE |
| SHELL-16 | M412/M390/M360/M320 | Either | Exercise mobile nav/shell at each width | Layout usable, tap targets reachable | OWNER_MANUAL_REQUIRED |

`SHELL-17` (Vercel Production runtime-error review for shell/Home routes) is retired from this
Owner-manual matrix — it is now covered by the §15 connector-assisted automated gate.

## §6 QA Matrix — B. Chart AI (`4F-CHART`)

Quota-conservation plan for AI-backed actions is in §14 — CHART-07/08 are each executed **once**
across this entire matrix.

| ID | Viewport | Auth | Steps | Expected | Class |
|---|---|---|---|---|---|
| CHART-01 | Desktop | In | Load `/chart-ai` | Enters workspace, not lock state | OWNER_MANUAL_REQUIRED |
| CHART-02 | Desktop | In | Load `/chart-ai`, watch network tab | No automatic Samsung/OHLCV fetch merely from entering | OWNER_MANUAL_REQUIRED |
| CHART-03 | Desktop | In | Search and explicitly load a KR stock (e.g. 005930) | Real chart renders | OWNER_MANUAL_REQUIRED |
| CHART-04 | Desktop | In | Search and explicitly load a US stock (e.g. AAPL) | Real chart renders; no repeat Similarity/MK-Analysis call needed | OWNER_MANUAL_REQUIRED |
| CHART-05 | Desktop | In | Switch timeframe on the loaded KR chart | Chart updates correctly | OWNER_MANUAL_REQUIRED |
| CHART-06 | Desktop | In | Inspect rendered chart | No visual defects, no NaN/undefined axis labels | OWNER_MANUAL_REQUIRED |
| CHART-07 | Desktop | In | Trigger Similarity once, on the KR symbol | Real Top-5 + explainability UI renders | OWNER_MANUAL_REQUIRED |
| CHART-08 | Desktop | In | Trigger MK Analysis once, on the same KR symbol | Deterministic, non-advisory summary renders | OWNER_MANUAL_REQUIRED |
| CHART-09 | Desktop | In | After CHART-07/08, inspect usage counter | Daily usage-counter UI is understandable | OWNER_MANUAL_REQUIRED |
| CHART-10 | Desktop | In | Inspect Market Intelligence section | Partial/unavailable states (rates NOT_SOURCED, breadth unavailable) shown truthfully | OWNER_MANUAL_REQUIRED |
| CHART-11 | Desktop | In | Review entire page | No fabricated data anywhere | OWNER_MANUAL_REQUIRED |
| CHART-12 | Desktop | In | Search a bogus/nonexistent symbol | Sensible loading then error state, no crash | OWNER_MANUAL_REQUIRED |
| CHART-13 | Desktop | In | Tab through search, load, timeframe, Similarity/MK-Analysis controls | All keyboard-reachable in logical order | OWNER_MANUAL_REQUIRED |
| CHART-14 | Desktop | In | Same traversal | Focus-visible on every control | OWNER_MANUAL_REQUIRED |
| CHART-15 | M390/M320 | In | Load chart on mobile | No overflow, panels usable | OWNER_MANUAL_REQUIRED |
| CHART-16 | Desktop + M390 | In | Load a stock with an unusually long name | No overflow/truncation defect | OWNER_MANUAL_REQUIRED |
| CHART-17 | Desktop | Out | Load `/chart-ai` signed out | Correct lock state, zero fetches (cross-ref `4F-CROSS-06`, evidence recorded once) | OWNER_MANUAL_REQUIRED |
| CHART-18 | — | Out | 5 Chart AI API routes without auth | All return 401 `AUTH_REQUIRED` | ALREADY_PRODUCTION_VERIFIED (4C result §9) |
| CHART-19 | — | — | External Netlify Git integration still connected | — | OUT_OF_SCOPE (ambiguity #2, Owner awareness only) |

## §7 QA Matrix — C. Market (`4F-MARKET`)

| ID | Viewport | Auth | Steps | Expected | Class |
|---|---|---|---|---|---|
| MARKET-01 | Desktop | Either | Select each universe tab (representative subset, not every combo) | Each tab selectable, content updates | OWNER_MANUAL_REQUIRED |
| MARKET-02 | Desktop | Either | Select each period tab | Each tab selectable, content updates | OWNER_MANUAL_REQUIRED |
| MARKET-03 | Desktop | Either | ArrowLeft/ArrowRight/Home/End on universe tabs | Roving-tabindex keyboard behavior works | OWNER_MANUAL_REQUIRED |
| MARKET-04 | Desktop | Either | Same on period tabs | Roving-tabindex keyboard behavior works | OWNER_MANUAL_REQUIRED |
| MARKET-05 | Desktop | Either | Observe selected tab state | Visually understandable which tab is active | OWNER_MANUAL_REQUIRED |
| MARKET-06 | Desktop | Either | Click refresh | Data refreshes | OWNER_MANUAL_REQUIRED |
| MARKET-07 | Desktop | Either | Click refresh twice within 30s | Cooldown behavior shown correctly | OWNER_MANUAL_REQUIRED |
| MARKET-08 | Desktop | Either | Open Treemap/scatter detail modal | Modal opens correctly | OWNER_MANUAL_REQUIRED |
| MARKET-09 | Desktop | Either | Press Escape with modal open | Modal closes | OWNER_MANUAL_REQUIRED |
| MARKET-10 | Desktop | Either | Tab/Shift+Tab inside open modal | Focus trapped within modal (wraps both directions) | OWNER_MANUAL_REQUIRED |
| MARKET-11 | Desktop | Either | Close modal (Escape or close button) | Focus restored to the opening control | OWNER_MANUAL_REQUIRED |
| MARKET-12 | M390/M320 | Either | Load `/market` on mobile | No horizontal overflow | OWNER_MANUAL_REQUIRED |
| MARKET-13 | M412/M390/M360/M320 | Either | Tap tabs, refresh, modal close on touch device | All tap targets usable | OWNER_MANUAL_REQUIRED |
| MARKET-14 | — | Either | `/heatmap` | Redirects to `/market` | ALREADY_PRODUCTION_VERIFIED (4B result §9) |
| MARKET-15 | Desktop | Either | Review displayed data | No fixture/example data presented as live | OWNER_MANUAL_REQUIRED |
| MARKET-16 | — | — | Detailed all-symbol/all-period sweep | — | OUT_OF_SCOPE (belongs to separate Phase 3 Closeout lane, ambiguity #5) |

`MARKET-17` (Vercel runtime-error review for `/market` and its APIs) is retired from this
Owner-manual matrix — it is now covered by the §15 connector-assisted automated gate.

## §8 QA Matrix — D. Lab (`4F-LAB`)

| ID | Viewport | Auth | Steps | Expected | Class |
|---|---|---|---|---|---|
| LAB-01 | Std | Either | Load `/lab` | Landing page renders correctly | OWNER_MANUAL_REQUIRED |
| LAB-02 | Desktop | Either | Load `/lab/asset-class-returns` | Table/matrix readable | OWNER_MANUAL_REQUIRED |
| LAB-03 | Desktop | Either | Load `/lab/sp500-sectors` | Table/matrix readable | OWNER_MANUAL_REQUIRED |
| LAB-04 | Desktop | Either | Load `/lab/congress-stocks` | List readable | OWNER_MANUAL_REQUIRED |
| LAB-05 | Desktop | Either | Load `/lab/nps-holdings` | List readable | OWNER_MANUAL_REQUIRED |
| LAB-06 | Desktop | Either | Keyboard-focus and scroll a `tabindex="0"` matrix region | Horizontal scroll is keyboard accessible | OWNER_MANUAL_REQUIRED |
| LAB-07 | Desktop | Either | Hover/click matrix cells | Hover/selection (pin) behavior works | OWNER_MANUAL_REQUIRED |
| LAB-08 | Desktop | Either | Tab to legend buttons, press Enter/Space, then Escape | Legend buttons operable by keyboard, Escape clears pin | OWNER_MANUAL_REQUIRED |
| LAB-09 | Desktop | Either | Observe legend button state after toggling | `aria-pressed` visual state understandable | OWNER_MANUAL_REQUIRED |
| LAB-10 | Desktop | Either | Trigger image export | Export action succeeds | OWNER_MANUAL_REQUIRED |
| LAB-11 | Desktop | Either | Trigger export success and a forced failure if reproducible | Status feedback visible and announced via the `aria-live` region | OWNER_MANUAL_REQUIRED |
| LAB-12 | M390/M320 | Either | Load matrix pages on mobile | Matrix scrolls within its own region, no page-level overflow | OWNER_MANUAL_REQUIRED |
| LAB-13 | Desktop | Either | Review NPS/Congress module copy | "연동 예정" truthful pending-integration copy still accurate | OWNER_MANUAL_REQUIRED |
| LAB-14 | — | Either | `/lab/nps-portfolio` | Redirects to `/lab/nps-holdings` | ALREADY_PRODUCTION_VERIFIED (4D result §6) |
| LAB-15 | Desktop (dark mode) | Either | Toggle dark mode, tab to legend buttons and scroll regions | Focus states remain visibly contrasted in dark mode | OWNER_MANUAL_REQUIRED |
| LAB-16 | Desktop | Either | Look for a naturally-occurring empty matrix cell | If found: `aria-label="데이터 없음"` present. If not naturally reproducible with current data, record as an accepted limitation, not a failure (ambiguity #3) | OWNER_MANUAL_REQUIRED |

## §9 QA Matrix — E. Portfolio (`4F-PORT`)

The most important authenticated surface in this phase.

**Execution-order note:** the `PORT-NN` IDs below are stable evidence identifiers, not a mandatory
chronological execution order. In particular:

- `PORT-03` (delete the temporary QA portfolio) is **final cleanup** — execute it only after
  `PORT-38` and after every position/ETF/valuation test that depends on the QA portfolio still
  existing.
- `PORT-06` (delete the temporary ordinary QA position) executes only after every case that
  depends on that position is complete.
- The ETF position created in `PORT-07` does not need its own separate deletion step — it may be
  cleaned up as part of the final Portfolio deletion (`PORT-03`).

Do not delete the QA Portfolio before its dependent tests have run.

| ID | Viewport | Auth | Steps | Expected | Class |
|---|---|---|---|---|---|
| PORT-01 | Desktop | In | Create a new portfolio | Portfolio created and visible | OWNER_MANUAL_REQUIRED |
| PORT-02 | Desktop | In | Edit that portfolio's name/settings | Changes saved and reflected | OWNER_MANUAL_REQUIRED |
| PORT-03 | Desktop | In | Delete the temporary QA portfolio (cleanup) | Portfolio removed | OWNER_MANUAL_REQUIRED |
| PORT-04 | Desktop | In | Create a position in a portfolio | Position created and visible | OWNER_MANUAL_REQUIRED |
| PORT-05 | Desktop | In | Edit that position | Changes saved and reflected | OWNER_MANUAL_REQUIRED |
| PORT-06 | Desktop | In | Delete the temporary QA position | Position removed | OWNER_MANUAL_REQUIRED |
| PORT-07 | Desktop | In | Create an ETF position | ETF position created | OWNER_MANUAL_REQUIRED |
| PORT-08 | Desktop | In | Edit the ETF position without changing asset type | Edit succeeds | OWNER_MANUAL_REQUIRED |
| PORT-09 | Desktop | In | Re-check the edited position | Still classified as ETF | OWNER_MANUAL_REQUIRED |
| PORT-10 | Desktop | In | View a KR position's valuation | Real KIS-derived value shown | OWNER_MANUAL_REQUIRED |
| PORT-11 | Desktop | In | View a US/unsupported-currency position | Truthful unsupported-valuation disclosure shown | OWNER_MANUAL_REQUIRED |
| PORT-12 | Desktop | In | Observe valuation if a partial/unavailable state naturally occurs | Behavior is truthful, not opportunistically forced | OWNER_MANUAL_REQUIRED |
| PORT-13 | Desktop | In | Check KRW aggregate total | Matches sum of components, no silent FX conversion | OWNER_MANUAL_REQUIRED |
| PORT-14 | Desktop | In | Temporarily set the QA Portfolio's `baseCurrency` to USD and save it (restore afterward if needed for cleanup consistency) | USD metadata is preserved; aggregate valuation remains explicitly KRW-based; UI does not imply an actual USD conversion; truthful "USD 환산 미지원" disclosure remains present | OWNER_MANUAL_REQUIRED |
| PORT-15 | Desktop | In | Inspect currency labels | "현지" label shown correctly | OWNER_MANUAL_REQUIRED |
| PORT-16 | Desktop | In | Inspect KRW values | "₩" symbol shown correctly | OWNER_MANUAL_REQUIRED |
| PORT-17 | Desktop | In | Click a portfolio tab | Selection works via mouse | OWNER_MANUAL_REQUIRED |
| PORT-18 | Desktop | In | ArrowLeft on portfolio tabs | Moves selection left | OWNER_MANUAL_REQUIRED |
| PORT-19 | Desktop | In | ArrowRight on portfolio tabs | Moves selection right | OWNER_MANUAL_REQUIRED |
| PORT-20 | Desktop | In | Home key on portfolio tabs | Jumps to first tab | OWNER_MANUAL_REQUIRED |
| PORT-21 | Desktop | In | End key on portfolio tabs | Jumps to last tab | OWNER_MANUAL_REQUIRED |
| PORT-22 | Desktop | In | After PORT-17–21 | Exactly one tab is selected/keyboard-active at any time | OWNER_MANUAL_REQUIRED |
| PORT-23 | Desktop | In | Click "add position"/"add portfolio" opener | Dialog opens correctly | OWNER_MANUAL_REQUIRED |
| PORT-24 | Desktop | In | Tab repeatedly inside open dialog | Focus wraps forward within the dialog | OWNER_MANUAL_REQUIRED |
| PORT-25 | Desktop | In | Shift+Tab repeatedly inside open dialog | Focus wraps backward within the dialog | OWNER_MANUAL_REQUIRED |
| PORT-26 | Desktop | In | Press Escape with dialog open | Dialog closes | OWNER_MANUAL_REQUIRED |
| PORT-27 | Desktop | In | Click dialog's close button | Dialog closes | OWNER_MANUAL_REQUIRED |
| PORT-28 | Desktop | In | Close dialog (either method) | Focus restored to the opening control | OWNER_MANUAL_REQUIRED |
| PORT-29 | Desktop + M390 | In | Scroll holdings list horizontally | Scrolls correctly at both widths | OWNER_MANUAL_REQUIRED |
| PORT-30 | Desktop | In | Tab to horizontal-scroll holdings region | Focus-visible on the region | OWNER_MANUAL_REQUIRED |
| PORT-31 | Desktop | In | Use holdings sort controls | Sorting works correctly | OWNER_MANUAL_REQUIRED |
| PORT-32 | Desktop | In | Inspect dividend column | Shows honest "데이터 대기" placeholder, does not imply real dividend data | OWNER_MANUAL_REQUIRED |
| PORT-33 | M390/M320 | In | View a portfolio with a long name | No overflow | OWNER_MANUAL_REQUIRED |
| PORT-34 | M390/M320 | In | View a position with a long stock name/ticker | No overflow | OWNER_MANUAL_REQUIRED |
| PORT-35 | M390/M320 | In | View a position with a large KRW value | No overflow | OWNER_MANUAL_REQUIRED |
| PORT-36 | Desktop | In | View a position with a negative return | Sign/color displayed correctly | OWNER_MANUAL_REQUIRED |
| PORT-37 | T768/M390/M320 | In | Open create/edit forms and sheets | Usable at all three widths | OWNER_MANUAL_REQUIRED |
| PORT-38 | Std | In | Load `/portfolio` at every required width | No document-level horizontal overflow anywhere | OWNER_MANUAL_REQUIRED |

## §10 QA Matrix — F. Cross-page / Session (`4F-CROSS`)

| ID | Viewport | Auth | Steps | Expected | Class |
|---|---|---|---|---|---|
| CROSS-01 | Desktop | In | Navigate across all 5 pages repeatedly | Session remains authenticated throughout | OWNER_MANUAL_REQUIRED |
| CROSS-02 | Desktop | In | Exercise Home/Chart AI/Portfolio retention or resume features where present | State restores as designed | OWNER_MANUAL_REQUIRED |
| CROSS-03 | Desktop | In | Trigger an explicit "resume" action | Does not auto-navigate unexpectedly beyond what was requested | OWNER_MANUAL_REQUIRED |
| CROSS-04 | Desktop | In | Interact with watchlist entries | Does not trigger unintended quote/AI actions as a side effect | OWNER_MANUAL_REQUIRED |
| CROSS-05 | Desktop | In | Log out | All authenticated UI clears | OWNER_MANUAL_REQUIRED |
| CROSS-06 | Desktop | Out | Load `/chart-ai` signed out | Correct lock state (shared evidence with `CHART-17`) | OWNER_MANUAL_REQUIRED |
| CROSS-07 | Desktop | Out | Load `/portfolio` signed out | Correct lock state | OWNER_MANUAL_REQUIRED |
| CROSS-08 | Desktop | In | Sign back in after CROSS-05 | Correct authenticated surface restored | OWNER_MANUAL_REQUIRED |

## §11 Accessibility Spot Check (`4F-A11Y`, cross-cutting)

Owner manual spot check, not a WCAG certification.

| ID | Steps | Expected | Class |
|---|---|---|---|
| A11Y-01 | Tab through primary controls on each of the 5 pages | Logical, complete traversal | OWNER_MANUAL_REQUIRED |
| A11Y-02 | Shift+Tab reverse traversal on each page | Mirrors forward order correctly | OWNER_MANUAL_REQUIRED |
| A11Y-03 | Enter/Space on focused controls | Activates as expected | OWNER_MANUAL_REQUIRED |
| A11Y-04 | Escape with any open dialog/modal | Closes it (cross-ref `MARKET-09`, `PORT-26`) | OWNER_MANUAL_REQUIRED |
| A11Y-05 | Arrow-key tab-group navigation (cross-ref `MARKET-03/04`, `PORT-18–21`) | Confirmed once here as a cross-page summary, not re-recorded as new evidence | OWNER_MANUAL_REQUIRED |
| A11Y-06 | Observe focus indicator through all of the above | Visible on every interactive element reached | OWNER_MANUAL_REQUIRED |
| A11Y-07 | Attempt to tab out of each open dialog/modal | No unintended keyboard trap outside the intentional modal containment | OWNER_MANUAL_REQUIRED |
| A11Y-08 | Close every dialog/modal encountered | Focus restored logically each time | OWNER_MANUAL_REQUIRED |
| A11Y-09 | Enable screen reader, load each page | Page title / main heading announced correctly | OWNER_MANUAL_REQUIRED |
| A11Y-10 | Navigate shell with screen reader | Navigation landmark labels announced | OWNER_MANUAL_REQUIRED |
| A11Y-11 | Open a dialog with screen reader active | Dialog title announced on open | OWNER_MANUAL_REQUIRED |
| A11Y-12 | Trigger a status/live-region update (e.g. Lab export, Portfolio valuation status) | Announced via screen reader | OWNER_MANUAL_REQUIRED |
| A11Y-13 | Navigate Market/Portfolio tabs with screen reader | Tabs/tabpanels announced correctly | OWNER_MANUAL_REQUIRED |
| A11Y-14 | Navigate a horizontal-scroll region (Lab matrix, Portfolio holdings) with screen reader | Region label announced correctly | OWNER_MANUAL_REQUIRED |

## §12 Defect Severity

- **BLOCKER** — security/auth isolation failure, data loss/corruption, a Production route unusable,
  wrong-user Portfolio access, critical provider runaway/request loop.
- **HIGH** — a major advertised function is unusable, a dialog keyboard trap prevents use, severe
  mobile overflow blocks an action, a truthful-data boundary is violated.
- **MEDIUM** — a material UX/accessibility problem exists but has a workaround.
- **LOW** — cosmetic/minor copy or alignment issue.

Findings are recorded, not fixed, during the QA evidence phase.

## §13 Evidence Format

Each executed test is recorded in the result doc as:

```
ID:
Surface:
Viewport:
Auth state:
Steps:
Expected:
Actual:
Result: PASS / FAIL / BLOCKED
Severity (if failed):
Evidence reference (screenshot/log, if available):
Notes:
```

Never place passwords, bearer tokens, session cookies, or API secrets in screenshots or docs.

## §14 Chart AI Quota Conservation

Only **one** Similarity call and **one** MK Analysis call are planned across the entire Phase 4F
matrix (`CHART-07`, `CHART-08`), both against the single KR symbol used for `CHART-03/05/06/09/10`.
The US-symbol pass (`CHART-04`) only re-exercises chart load and is implicitly covered for
timeframe switching by `CHART-05`'s KR pass — it does not repeat Similarity or MK Analysis, since
both engines are symbol-agnostic and already exercised once, authenticated, with real KIS data.

## §15 Automated Support Gate (run before manual QA begins)

Read-only regression sweep using existing checks — no historical checker drift is repaired as part
of this:

```
npm run check:phase-4a-home-common-shell
npm run check:phase-4b-market-production-completion
npm run check:phase-4c-chart-ai-production-completion
npm run check:phase-4d-lab-production-completion
npm run smoke:phase-4e-portfolio-production-completion
npm run check:phase-4e-portfolio-production-completion
npm run check:mobile-baseline
npm run check:project-lightweight-roadmap
npm run smoke:phase-3gh-portfolio-live-valuation-mvp
npm run check:phase-3gh-portfolio-live-valuation-mvp
```

### Connector-assisted Vercel Production runtime review (supersedes former `SHELL-17`/`MARKET-17` rows)

The current Phase 4F execution environment has read-only Vercel connector access capable of
querying Production runtime logs, so Production runtime-error review is no longer
`OWNER_MANUAL_REQUIRED`. It runs here, as part of this automated gate, strictly read-only — no
Redeploy, no mutation, no environment/config change — covering at minimum:

- Home / common-shell relevant Production runtime errors (formerly `SHELL-17`)
- `/market` and its relevant Market API routes' runtime errors (formerly `MARKET-17`)
- `/chart-ai` and its relevant API routes' runtime errors (deferred at 4C, ambiguity noted in
  §2.1, but never previously given a discrete Owner-manual row)

The historical inconsistency about Vercel log access across 4A/4B/4C (ambiguity #1, §3) remains
documented as-is; this gate simply uses the connector capability available to the current Phase 4F
execution environment, regardless of that history.

## §16 Pass Rule

Phase 4F closes only when:

- zero BLOCKER findings remain;
- zero unresolved HIGH findings remain;
- every required Owner-manual test (§5–§11) has a PASS or an explicitly accepted limitation;
- the automated regression gate (§15) shows no new regression;
- all remaining MEDIUM/LOW findings are either fixed or explicitly accepted/deferred;
- evidence is recorded per §13;
- the roadmap and changelog accurately state the outcome.

## §17 Test Count Summary

| Surface | Owner-manual rows | Already-verified | Out-of-scope |
|---|---|---|---|
| A. Home / Common Shell | 14 | 1 | 1 |
| B. Chart AI | 17 | 1 | 1 |
| C. Market | 14 | 1 | 1 |
| D. Lab | 15 | 1 | 0 |
| E. Portfolio | 38 | 0 | 0 |
| F. Cross-page / Session | 8 | 0 | 0 |
| Accessibility spot check | 14 | 0 | 0 |
| **Total** | **120** | **4** | **3** |

`SHELL-17` and `MARKET-17` are excluded from these Owner-manual counts — they are now executed as
part of the §15 connector-assisted automated gate (see §3 and §15).

## §18 Status

Manual QA has **not** started. No application code has been touched by this planning step. Phase
4F remains `PHASE_4F_CROSS_PAGE_OWNER_QA_PLAN_READY_QA_NOT_STARTED` until the Owner executes the
matrix above and records evidence in
`docs/planning/phase_4f_cross_page_owner_qa_closeout_result_v0.1.md`.
