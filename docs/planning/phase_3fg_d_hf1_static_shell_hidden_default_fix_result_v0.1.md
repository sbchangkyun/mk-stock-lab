# Phase 3FG-D-HF1 — Static Shell Browser QA Fixes, Hidden by Default, No Runtime Activation — Result

- **Status**: Implemented.
- **Purpose**: fix the Phase 3FG-E confirmed Case 1 browser QA defect where the owner-local guarded productization static shell rendered visibly on default `/chart-ai` despite carrying the `hidden` attribute. This is a narrow hotfix phase: fix only the hidden-by-default defect. No static shell content, decision-card, safety-copy, scaffold-source, API-route, or runtime-behavior change.
- **Baseline**: 4b620d2.
- **Latest completed phase before this phase**: Phase 3FG-E.
- **Branch**: rebuild/phase-1-ia-shell.

## 1. Defect Summary

Phase 3FG-E's owner-local Browser QA found that on default `/chart-ai` (no query params, no owner-local opt-in), `#chartAiOwnerLocalGuardedProductizationStaticShell` was visually rendered — non-zero layout box, `getComputedStyle(el).display === "grid"`, `offsetParent !== null` — even though:

- the `hidden` attribute was present in the server-rendered markup, and
- `element.hasAttribute('hidden')` and `element.hidden` both evaluated `true` client-side.

This was a genuine UI regression relative to the intended hidden-by-default behavior and relative to the pre-existing, correctly-behaving `#chartAiOwnerLocalDeterministicAgentsPanel`, which used `display: none` (no unconditional `display` override) and rendered correctly hidden.

## 2. Root Cause

`src/pages/chart-ai.astro`'s Phase 3FG-D style block declared:

```css
.chart-owner-local-guarded-productization-shell {
  ...
  display: grid;
  gap: 1rem;
}
```

This is a normal-priority, author-stylesheet declaration. The browser's UA stylesheet also declares `[hidden] { display: none }` at normal priority. Per CSS cascade rules, when two declarations of equal origin and importance (both "normal", one UA and one author) target the same element, **the author-stylesheet declaration always wins over the UA-stylesheet declaration**, regardless of selector specificity or source order. This is an *origin*-priority rule, not a specificity rule. Consequently `.chart-owner-local-guarded-productization-shell { display: grid; }` unconditionally overrode `[hidden] { display: none }` any time the class was present, independent of whether the `hidden` attribute was also present.

## 3. Files Created

- `scripts/check_phase_3fg_d_hf1_contract.mjs`
- `docs/planning/phase_3fg_d_hf1_static_shell_hidden_default_fix_result_v0.1.md` (this document)

## 4. Files Modified

- `src/pages/chart-ai.astro` (CSS-only fix, see Fix Summary)
- `docs/planning/planning_changelog.md` (new Phase 3FG-D-HF1 entry, prepended)
- `package.json` (one new script: `check:phase-3fg-d-hf1`)

No other file was created or modified. No scaffold source, API route, component, Supabase/DB module, or lockfile was touched.

## 5. Fix Summary

Added a single higher-specificity, id+attribute author-stylesheet rule immediately after the existing class rule:

```css
.chart-owner-local-guarded-productization-shell {
  margin: 1.25rem 0;
  padding: 1.1rem 1.25rem;
  border-radius: 14px;
  border: 1px dashed color-mix(in srgb, var(--primary) 45%, var(--chart-shell-border));
  background: color-mix(in srgb, var(--primary) 6%, transparent);
  display: grid;
  gap: 1rem;
}

#chartAiOwnerLocalGuardedProductizationStaticShell[hidden] {
  display: none;
}
```

Because both rules are author-stylesheet declarations of equal origin/importance, the tie is broken by specificity: `#id[attr]` is 1-1-0, strictly higher than the class rule's 0-1-0. This unambiguously restores `display: none` whenever the `hidden` attribute is present, while leaving the `display: grid` layout untouched for the shown state (the `[hidden]` rule simply does not apply once the attribute is removed). No `!important` was needed or used. No markup, script, copy, or other CSS rule was changed.

## 6. Browser QA Environment

- Tool: `mcp__Claude_Preview__*` (Astro dev server, owner-local browser session).
- Host: `localhost` (satisfies the existing `isLocalOwnerHostname()` guard).
- Verification method: multi-signal DOM/CSS introspection via `preview_eval` (`getComputedStyle().display`, `getBoundingClientRect()`, `element.offsetParent`, `hasAttribute('hidden')`, `.hidden` property, `innerText` substring/context extraction, direct interactive-element queries), `preview_console_logs` (all/error levels), `preview_network` (failed-only filter and full session history), and `preview_resize` for PC/mobile viewports. No single signal was trusted in isolation; every case cross-checked at least two independent signals.

## 7. Browser QA Results

All six required cases (A-F) passed.

### Case A — Default hidden-state regression

Navigated to `/chart-ai` with no query params. Result: `getComputedStyle(el).display === "none"`, `hasAttribute('hidden') === true`, `.hidden === true`, `getBoundingClientRect()` width/height both `0`, `offsetParent === null`. The Case 1 defect from Phase 3FG-E is closed: the shell is now genuinely hidden, not merely marked hidden while rendering visibly.

### Case B — Owner-local opt-in visible state

Navigated to `/chart-ai?ownerLocalGuardedProductizationShell=1` on localhost. Result: `getComputedStyle(el).display === "grid"`, `hasAttribute('hidden') === false`, `.hidden === false`, non-zero bounding rect (approx. 1096.8 x 955.9), `offsetParent !== null`. All 8 static decision-state cards present (`Default fail-closed`, `Owner-local without scaffoldOnlyAcknowledged`, `Owner-local with explicit scaffoldOnlyAcknowledged`, `Beta attempt blocked`, `Public attempt blocked`, `Live KIS attempt blocked`, `LLM attempt blocked`, `Real auth attempt blocked`). Required Korean safety copy present (`참고용`, `투자 자문이 아닙니다`, `매수·매도 추천이 아닙니다`). Blocked-boundary copy present (`No live KIS`, `No LLM`, `No public/beta activation`, `No API route activation`, `No Supabase/DB real runtime`, `No env/session/JWT/cookie/header parsing`). Zero interactive elements found via `button, a, [role="button"], input[type="submit"]` query — no execution CTA. Every occurrence of "실행" in the shell's text was checked in context and is a negation-form safety statement (e.g. "이 상태에서는 실제 실행이 전혀 발생하지 않습니다", "실제 실행 아님"), not an actionable call to action.

### Case C — Coexistence with the pre-existing deterministic agents panel

At `/chart-ai?ownerLocalDeterministicAgents=1&ownerLocalGuardedProductizationShell=1`: both `#chartAiOwnerLocalDeterministicAgentsPanel` and `#chartAiOwnerLocalGuardedProductizationStaticShell` rendered visible simultaneously (`display: block` and `display: grid` respectively), with no bounding-box overlap between the two sections and no added horizontal document overflow (`document.scrollWidth` remained within the viewport width). Separately, at `/chart-ai?ownerLocalDeterministicAgents=1` alone, the deterministic panel rendered correctly and the guarded productization shell remained correctly hidden (`display: none`, `hidden` attribute/property both `true`, `offsetParent === null`) — confirming zero regression to the pre-existing, unrelated flow.

### Case D — PC viewport (1280x900)

Default state: no horizontal overflow, shell hidden as in Case A. Owner-local opt-in state: no horizontal overflow, shell visible with the same non-zero layout as Case B.

### Case E — Mobile viewport (375x812)

Default state: no horizontal overflow (`document.scrollWidth === 375`), shell hidden as in Case A. Owner-local opt-in state: no horizontal overflow, all 8 cards present (correctly scoped to `.chart-owner-local-guarded-productization-shell-card`, `cardCount === 8`), no clipped content, required Korean safety and blocked-boundary copy present.

### Case F — Console and network

Console: zero errors across all cases (both `all` and `error`-only levels checked). Network: zero failed requests during this phase's own navigations; the one `ERR_ABORTED` entry present in the full session history predates any `/chart-ai` navigation and is unrelated to this fix. The full session network history was grepped for `openai|anthropic|gemini|/api/|kis\.|kis-|llm` — zero matches, confirming no forbidden live KIS, LLM, or new API-route call occurred anywhere in the session.

### PC Viewport Result

PASS. See Case D above: default state hidden with no overflow; owner-local opt-in state visible with no overflow at 1280x900.

### Mobile Viewport Result

PASS. See Case E above: default state hidden with no overflow; owner-local opt-in state visible with all 8 cards, no clipped content, at 375x812.

### Console Result

PASS. Zero console errors across every case in this phase, at both the `all` and `error`-only log levels.

### Network Result

PASS. Zero failed requests caused by this phase's navigations; zero forbidden-call matches (`openai|anthropic|gemini|/api/|kis\.|kis-|llm`) across the full session's network history.

## 8. Smoke/Checker Results

No smoke script is required or created for this narrow CSS hotfix (per the work order's exactly-2-new-files scope). Checker: `npm run check:phase-3fg-d-hf1` — see Section 9.

## 9. Full Validation Results

| Command | Result |
| --- | --- |
| `npm run check:phase-3fg-d-hf1` | PASS |
| `npm run check:phase-3fg-e` | PASS (patched, see below) |
| `npm run smoke:phase-3fg-d` | PASS |
| `npm run check:phase-3fg-d` | PASS (patched, see below) |
| `npm run check:phase-3fg-c` | PASS (patched, see below) |
| `npm run check:phase-3fg-b` | PASS (patched, see below) |
| `npm run smoke:phase-3fg-a` | PASS |
| `npm run check:phase-3fg-a` | PASS (patched, see below) |
| `npm run check:phase-3fg-a-plan` | PASS (patched, see below) |
| `npm run check:phase-3ff-a-handoff-a` | PASS (patched, see below) |
| `npm run check:phase-3ff-a-housekeeping-a` | PASS (patched, see below) |
| `npm run check:phase-3ff-a-ui-c-manual-qa` | PASS (patched, see below) |
| `npm run smoke:phase-3ff-a-mk-c` | PASS |
| `npm run check:phase-3ff-a-mk-c` | PASS (patched, see below) |
| `npm run smoke:phase-3ff-a-sp-b` | PASS |
| `npm run check:phase-3ff-a-sp-b` | PASS (patched, see below) |
| `npm run smoke:phase-3ff-a-mk-b` | PASS |
| `npm run check:phase-3ff-a-mk-b` | PASS (patched, see below) |
| `npm run check:phase-3ff-a-ui-b-manual-qa` | PASS (patched, see below) |
| `npm run smoke:phase-3ff-a-ui-a` | PASS |
| `npm run check:phase-3ff-a-ui-a` | PASS (patched, see below) |
| `npm run smoke:phase-3ff-a-mk-a` | PASS |
| `npm run check:phase-3ff-a-mk-a` | PASS (patched, see below) |
| `npm run smoke:phase-3ff-a-sp-a` | PASS |
| `npm run check:phase-3ff-a-sp-a` | PASS (patched, see below) |
| `npm run check:phase-3ff-a-plan` | PASS (patched, see below) |
| `npm run build` | PASS |
| `git diff --check` | PASS (no whitespace conflicts) |
| `git status --short` | Clean except this phase's allowed files |

**Sibling checkers patched (additive-only, no protective assertion weakened or removed):** `scripts/check_phase_3fg_e_contract.mjs`, `scripts/check_phase_3fg_d_contract.mjs`, `scripts/check_phase_3fg_c_contract.mjs`, `scripts/check_phase_3fg_b_contract.mjs`, `scripts/check_phase_3fg_a_contract.mjs`, `scripts/check_phase_3fg_a_plan_contract.mjs`, `scripts/check_phase_3ff_a_handoff_a_contract.mjs`, `scripts/check_phase_3ff_a_housekeeping_a_contract.mjs`, `scripts/check_phase_3ff_a_ui_c_manual_qa_contract.mjs`, `scripts/check_phase_3ff_a_mk_c_contract.mjs`, `scripts/check_phase_3ff_a_sp_b_contract.mjs`, `scripts/check_phase_3ff_a_mk_b_contract.mjs`, `scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs`, `scripts/check_phase_3ff_a_ui_a_contract.mjs`, `scripts/check_phase_3ff_a_mk_a_contract.mjs`, `scripts/check_phase_3ff_a_sp_a_contract.mjs`, `scripts/check_phase_3ff_a_plan_contract.mjs`. Each patch extends an existing `TOLERATED_LATER_PHASE_FILES`-style allowlist or `TOLERATED_HEADERS_ABOVE_*`-style changelog-header tolerance with this phase's two new file paths and its new changelog header. `scripts/check_phase_3fg_e_contract.mjs` additionally required pinning its "3FG-E made zero chart-ai.astro changes" guarantee to the frozen historical commit range `e4414e5..4b620d2` (3FG-E's own baseline through 3FG-E's own completion commit) instead of an implicit live-HEAD comparison — this is a strictly more precise statement of what Phase 3FG-E itself actually guaranteed, and does not loosen that guarantee for any commit inside that range; it correctly stops attributing a "chart-ai.astro must never change again" guarantee to Phase 3FG-E, which Phase 3FG-E's own changelog entry never claimed (it explicitly named Phase 3FG-D-HF1 as the required next step to change that exact file).

## 10. Forbidden Diff Result

```
git diff --name-only 4b620d2 -- src/lib/server/chart-ai/guarded-productization-scaffold.mjs src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs src/lib/server/chart-ai/mk-agent.mjs src/lib/server/chart-ai/mk-agent.fixture.mjs src/lib/server/chart-ai/similar-pattern-agent.mjs src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs pages/api src/pages/api components supabase src/data package-lock.json pnpm-lock.yaml yarn.lock .env .env.local
```

Result: empty. No forbidden runtime/source path changed since baseline.

## 11. Controlled Chart-AI Diff Result

```
git diff --name-only 4b620d2 -- src/pages/chart-ai.astro
```

Result: `src/pages/chart-ai.astro` — exactly the one allowed, controlled change.

## 12. Boundary Preservation

- [x] No live KIS.
- [x] No LLM.
- [x] No public/beta activation.
- [x] No API route activation.
- [x] No scaffold source change.
- [x] No MK Agent source/fixture change.
- [x] No Similar Pattern Agent source/fixture change.
- [x] No Supabase/DB real runtime.
- [x] No env/session/JWT/cookie/header parsing.
- [x] No usage deduction.
- [x] No paid entitlement.
- [x] No ad unlock.
- [x] No dependency/lockfile change.
- [x] No package install.
- [x] No deploy.
- [x] No push.
- [x] `docs/handoff/codex_state_inspection/` and all other known unrelated untracked paths untouched.

## 13. Known Out-of-Scope Issues

None discovered that fall within this phase's fix scope. This phase intentionally did not touch static shell content, decision-card copy, scaffold source, or any runtime activation gate — those remain exactly as delivered by Phase 3FG-D and verified (apart from the Case 1 CSS defect) by Phase 3FG-E.

## 14. Next Recommended Phase

Phase 3FG-E-HF1 — re-run the full owner-local Browser QA pass to confirm the Case 1 defect is closed under the same 12-case methodology used in Phase 3FG-E, and record a clean 12/12 result.
