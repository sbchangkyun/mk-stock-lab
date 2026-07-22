# Phase 3FG-E — Owner-local Guarded Productization Static Shell Browser QA Checklist v0.1

## 1. Phase identity

- **Phase**: Phase 3FG-E — Owner-local Guarded Productization Static Shell Browser QA, All Real Gates Off.
- **Baseline**: `e4414e5`.
- **Latest completed phase before this QA**: Phase 3FG-D (Owner-local Guarded Productization UI Static Shell, Hidden by Default, No Runtime Activation).
- **Branch**: `rebuild/phase-1-ia-shell`.

## 2. QA objective

Perform owner-local browser QA for the Phase 3FG-D guarded productization static UI shell added to `/chart-ai`. Confirm the shell's default-hidden state, owner-local opt-in visible state, coexistence with the pre-existing `chartAiOwnerLocalDeterministicAgentsPanel`, PC viewport and mobile viewport rendering, all 8 static state cards, all required Korean safety copy, absence of forbidden CTA/investment-recommendation language, console cleanliness, network boundary (no live KIS / no LLM / no Supabase / no new API route call), DOM/source boundary, and default-flow regression. Browser QA / documentation / checker only — this phase does not change `src/pages/chart-ai.astro` or any other source file.

## 3. QA environment

- Local Astro dev server (`astro dev`), loopback only, `http://localhost:4321`.
- Browser: Claude Preview tool (Chromium-based headless preview), not a production build.
- Viewports tested: 1280×900 (PC) and 375×812 (mobile).
- No live KIS, no LLM, no Supabase/DB real runtime, no env/session/JWT/cookie/header parsing were exercised during this QA. All real productization gates remain off, per the Phase 3FG-A scaffold's `DEFAULT_GUARDED_PRODUCTIZATION_FLAGS`.

**Explicit statement**: this phase is browser QA only. No source/UI code changes were made. No API route activation occurred. No live KIS was called. No LLM was called. all real gates off — every real productization gate is off, exactly as delivered in Phase 3FG-D.

## 4. QA checklist — 12 cases

| # | Case | URL / setup | Expected result | Outcome |
|---|------|--------------|------------------|---------|
| 1 | Default `/chart-ai` hidden state | `/chart-ai` | Shell not visible; no shell content visible; no console errors; no forbidden network calls | **FAIL** — `hidden` DOM attribute/property correctly `true`, but shell is visually rendered (`display: grid`, full layout box, readable text) due to a CSS specificity/origin defect. See Section 6 of the result document. |
| 2 | Owner-local shell opt-in visible state | `/chart-ai?ownerLocalGuardedProductizationShell=1` | Shell visible on localhost; static/read-only; 8 cards visible; Korean safety copy visible; blocked-boundary copy visible; no execution CTA; no buttons/forms; no console errors; no forbidden network calls | PASS |
| 3 | Existing deterministic panel preservation | `/chart-ai?ownerLocalDeterministicAgents=1`, and combined with case 2's param | `chartAiOwnerLocalDeterministicAgentsPanel` behavior preserved; no additional mocked-access query param required beyond each panel's own opt-in flag; shell and deterministic panel coexist without layout collision when both activated | PASS |
| 4 | PC viewport visual QA | 1280×900, opt-in URL | No horizontal overflow; cards readable; safety/boundary copy readable; shell visually separate from deterministic panel | PASS |
| 5 | Mobile viewport (mobile viewport) visual QA | 375×812, opt-in URL | No horizontal overflow; cards stack/read correctly; Korean labels readable; no clipped text; hidden by default without param, visible only with param | PASS (visibility-with-param mechanics pass; the underlying default-hidden defect from Case 1 also reproduces at mobile width — same root cause, not a mobile-specific regression) |
| 6 | State card content QA | opt-in URL | All 8 states present, each with label/status/explanation/safety note/no-execution statement; scaffold-only card clearly differentiated | PASS |
| 7 | Safety copy QA | opt-in URL | All 6 required Korean safety phrases present | PASS |
| 8 | Forbidden CTA/recommendation language QA | opt-in URL | Forbidden CTA/investment phrases absent as approved UI copy | PASS |
| 9 | Console QA | all tested URLs | 0 console errors; no warnings caused by the new static shell | PASS |
| 10 | Network QA | all tested URLs | No live KIS/LLM/Supabase call triggered by the shell; no new API route call caused by the shell | PASS |
| 11 | DOM/source boundary QA | all tested URLs | No scaffold import/execution; no API route call; no fetch introduced by shell; no env/session/JWT/cookie/header parsing; no localStorage/sessionStorage introduced by shell | PASS |
| 12 | Regression QA | `/chart-ai` default | Existing tabs/nav links, search input, period buttons, and deterministic-panel default-hidden state remain intact and unchanged | PASS |

## 5. Boundary preservation checklist

- [x] No live KIS call observed in any tested state.
- [x] No LLM (OpenAI/Anthropic/Gemini) call observed in any tested state.
- [x] No MK AI route activation observed.
- [x] No API route activation observed (no new API route call caused by the shell).
- [x] No public/beta activation observed.
- [x] No Supabase/DB real runtime call triggered by the shell (pre-existing site-wide Supabase calls for Home rail banners / site settings occur during Home page load, unrelated to `/chart-ai` or the shell).
- [x] No env/session/JWT/cookie/header parsing observed.
- [x] No usage deduction observed.
- [x] No paid entitlement unlock observed.
- [x] No ad unlock caused by the shell.
- [x] No new localStorage/sessionStorage key introduced by the shell (only pre-existing site-wide keys: `theme`, `adPopupExpire`, `mk-stock-lab-auth-ui-hint`).
- [x] No deploy performed.
- [x] No push performed.
- [x] No source file modified (`src/pages/chart-ai.astro` untouched by this phase).
- [x] No scaffold/agent source or fixture file modified.

## 6. Forbidden diff checklist

Command:

```
git diff --name-only e4414e5 -- src/pages/chart-ai.astro src/lib/server/chart-ai/guarded-productization-scaffold.mjs src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs src/lib/server/chart-ai/mk-agent.mjs src/lib/server/chart-ai/mk-agent.fixture.mjs src/lib/server/chart-ai/similar-pattern-agent.mjs src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs pages/api src/pages/api components supabase src/data package-lock.json pnpm-lock.yaml yarn.lock .env .env.local
```

Expected: empty output (unlike Phase 3FG-D, this phase's forbidden list includes `src/pages/chart-ai.astro` itself, since Phase 3FG-E must not touch it at all).

Controlled chart-ai diff command:

```
git diff --name-only e4414e5 -- src/pages/chart-ai.astro
```

Expected: empty output (this phase makes zero changes to `chart-ai.astro`, unlike Phase 3FG-D which was allowed exactly that one file).

## 7. Validation command list

1. `npm run check:phase-3fg-e`
2. `npm run smoke:phase-3fg-d`
3. `npm run check:phase-3fg-d`
4. `npm run check:phase-3fg-c`
5. `npm run check:phase-3fg-b`
6. `npm run check:phase-3fg-a`
7. `npm run check:phase-3fg-a-plan`
8. `npm run smoke:phase-3fg-a`
9. `npm run check:phase-3ff-a-handoff-a`
10. `npm run check:phase-3ff-a-housekeeping-a`
11. `npm run check:phase-3ff-a-ui-c-manual-qa`
12. `npm run check:phase-3ff-a-mk-c`
13. `npm run smoke:phase-3ff-a-mk-c`
14. `npm run check:phase-3ff-a-sp-b`
15. `npm run smoke:phase-3ff-a-sp-b`
16. `npm run check:phase-3ff-a-mk-b`
17. `npm run smoke:phase-3ff-a-mk-b`
18. `npm run check:phase-3ff-a-ui-b-manual-qa`
19. `npm run check:phase-3ff-a-ui-a`
20. `npm run smoke:phase-3ff-a-ui-a`
21. `npm run check:phase-3ff-a-mk-a`
22. `npm run smoke:phase-3ff-a-mk-a`
23. `npm run check:phase-3ff-a-sp-a`
24. `npm run smoke:phase-3ff-a-sp-a`
25. `npm run check:phase-3ff-a-plan`
26. `npm run build`
27. `git diff --check`
28. `git status --short`

(Numbering above follows the work order's 27-command chain plus the trailing `git status --short`; exact pass/fail results are recorded in the result document.)

## 8. Pass/fail criteria

- A QA case is **PASS** if the observed browser behavior matches the expected result exactly, verified via DOM/CSS/console/network introspection (not visual inspection alone).
- A QA case is **FAIL** if observed behavior diverges from the expected result, regardless of severity.
- This phase's overall QA verdict is **11 of 12 cases PASS, 1 case (Case 1: default hidden state) FAIL** due to a confirmed CSS visibility defect in `src/pages/chart-ai.astro` (not fixed in this phase, per the forbidden-changes boundary).
- All real-gate boundary preservation checks (Section 5) PASS without exception.

## 9. Next recommended phase

Because this QA phase found a genuine UI defect (Case 1: the static shell is not actually hidden by default despite the `hidden` DOM attribute being correctly set), the next recommended phase is:

**Phase 3FG-D-HF1 — Static Shell Browser QA Fixes, Hidden by Default, No Runtime Activation.**

This hotfix phase should correct the CSS rule that currently overrides the browser's built-in `[hidden] { display: none }` behavior for `#chartAiOwnerLocalGuardedProductizationStaticShell`, re-verify all 12 QA cases (especially Case 1 and Case 5), and re-run this phase's full validation chain. Only after that hotfix passes should Phase 3FG-F (Guarded Productization Current State Handoff Package, No Runtime Change) proceed.
