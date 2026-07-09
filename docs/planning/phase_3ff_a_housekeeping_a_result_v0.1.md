# Phase 3FF-A-HOUSEKEEPING-A — Historical Checker Scope Cleanup Result

## 1. Status

Status: Implemented.

## 2. Purpose

- Clean up stale historical checker scope/changelog assumptions that fail after many later phases are prepended to `docs/planning/planning_changelog.md`.
- No runtime change: this phase touches only validator/checker scripts, documentation, and the package script wiring. It does not change product behavior, runtime code, UI, API routes, agents, providers, Supabase, DB, dependencies, lockfiles, env files, deploy state, or push state.

## 3. Baseline

- Baseline: 07cd405. (Current baseline before HOUSEKEEPING-A.)
- Latest completed phase before HOUSEKEEPING-A: Phase 3FF-A-UI-C.
- Branch: rebuild/phase-1-ia-shell.

## 4. Known issue fixed

- Historical checker failure caused by a stale changelog slice/top-entry assumption: the checker assumed its phase entry stayed within a fixed top-of-file window (`changelog.slice(0, 3000)`), which became invalid once newer phases were legitimately prepended above it.
- Primary target: `check:phase-3fd-j-handoff-chart-ai-new-chat-package` (`scripts/check_phase_3fd_j_handoff_chart_ai_new_chat_package_contract.mjs`). Before this phase it failed with 4 assertions (top-entry header, title, no-runtime statement, next-phase) because the Phase 3FD-J-HANDOFF entry is no longer near the top of `planning_changelog.md`.

## 5. Files created

- `scripts/check_phase_3ff_a_housekeeping_a_contract.mjs` — housekeeping static checker.
- `docs/planning/phase_3ff_a_housekeeping_a_result_v0.1.md` — this result document.

## 6. Files modified

- `scripts/check_phase_3fd_j_handoff_chart_ai_new_chat_package_contract.mjs` — replaced the stale `changelog.slice(0, 3000)` top-of-file window with a header-scoped lookup of the Phase 3FD-J-HANDOFF section (from its own `## Phase` header to the next `## Phase ` header).
- `scripts/check_phase_3ff_a_ui_c_manual_qa_contract.mjs` — relaxed the "UI-C entry must appear above every other phase" assertion to a known-allowlist tolerance so it no longer fails once this HOUSEKEEPING-A entry is prepended above it (forbidden-diff protection unchanged).
- `scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs` — added the HOUSEKEEPING-A changelog header to the tolerated-headers allowlist and this phase's files to the scope-tolerance allowlist so its validation stays stable.
- `scripts/check_phase_3ff_a_ui_a_contract.mjs` — same validator-compatibility patch as the UI-B checker.
- `scripts/check_phase_3ff_a_mk_c_contract.mjs`, `scripts/check_phase_3ff_a_sp_b_contract.mjs`, `scripts/check_phase_3ff_a_mk_b_contract.mjs`, `scripts/check_phase_3ff_a_mk_a_contract.mjs`, `scripts/check_phase_3ff_a_sp_a_contract.mjs`, `scripts/check_phase_3ff_a_plan_contract.mjs` — validator-compatibility scope patches. These carried a latent scope-tolerance gap for Phase 3FF-A-UI-C's deliverables: those UI-C files were untracked (uncommitted) during the UI-C phase's own validation run, so `git diff --name-only <baseline>` never surfaced them; now that UI-C is committed they appear against each sibling's older baseline. Each was extended to tolerate the UI-C and HOUSEKEEPING-A files. No protective forbidden-diff/source-drift assertion was removed from any of them.
- `docs/planning/planning_changelog.md` — prepended the Phase 3FF-A-HOUSEKEEPING-A entry.
- `package.json` — added the `check:phase-3ff-a-housekeeping-a` script.

## 7. Implementation summary

- Replaced fragile changelog prefix/top-entry assumptions with full-document historical entry checks: the primary historical checker now locates its phase entry by its own `## Phase` header and scopes assertions to that section, instead of a fixed-size top-of-file slice. This is the same robust pattern already used by sibling checkers that slice from a discovered section start.
- Preserved forbidden runtime/source/dependency drift protections: no protective forbidden-diff assertion was removed. The primary checker still verifies the Phase 3FD-J handoff package files and manifest, the required package script, and the no-runtime-change boundary; it still rejects sensitive-identifier literals and blocked completion/deploy claims.
- Latest-checker future tolerance: the UI-C checker continues to prove the UI-C entry exists and keeps its forbidden-diff protection, but no longer requires UI-C to be the top phase entry.
- Added the housekeeping checker and `check:phase-3ff-a-housekeeping-a` package script.
- Scope discipline: only checkers that actually failed the validation chain or that grep evidence showed carried the stale top/slice assumption were patched. No runtime/source change, and no speculative mass edits to unaffected checkers.

## 8. Validation results

| Command | Result |
|---|---|
| `npm run check:phase-3ff-a-housekeeping-a` | PASS |
| `npm run check:phase-3fd-j-handoff-chart-ai-new-chat-package` | PASS (136/136) |
| `npm run smoke:phase-3fd-j-similar-pattern-route-owner-local-activation` | PASS |
| `npm run check:phase-3fd-j-similar-pattern-route-owner-local-activation` | PASS |
| `npm run smoke:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off` | PASS |
| `npm run check:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off` | PASS |
| `npm run check:phase-3ff-a-ui-c-manual-qa` | PASS |
| `npm run smoke:phase-3ff-a-mk-c` | PASS |
| `npm run check:phase-3ff-a-mk-c` | PASS |
| `npm run smoke:phase-3ff-a-sp-b` | PASS |
| `npm run check:phase-3ff-a-sp-b` | PASS |
| `npm run smoke:phase-3ff-a-mk-b` | PASS |
| `npm run check:phase-3ff-a-mk-b` | PASS |
| `npm run check:phase-3ff-a-ui-b-manual-qa` | PASS |
| `npm run smoke:phase-3ff-a-ui-a` | PASS |
| `npm run check:phase-3ff-a-ui-a` | PASS |
| `npm run smoke:phase-3ff-a-mk-a` | PASS |
| `npm run check:phase-3ff-a-mk-a` | PASS |
| `npm run smoke:phase-3ff-a-sp-a` | PASS |
| `npm run check:phase-3ff-a-sp-a` | PASS |
| `npm run check:phase-3ff-a-plan` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS (no whitespace/conflict-marker errors) |
| `git status --short` | Reviewed — only HOUSEKEEPING-A allowed files and pre-existing untracked paths present |
| Forbidden diff vs 07cd405 | Empty (no forbidden runtime/source path changed) |

## 9. Boundary preservation

- No UI file changed.
- No API route changed.
- No MK Agent source/fixture changed.
- No Similar Pattern Agent source/fixture changed.
- No KIS provider source changed.
- No live KIS call occurred.
- No LLM call occurred.
- No MK AI route activation occurred.
- No Supabase client was created.
- No DB connection occurred.
- No env/session/JWT/cookie/header parsing occurred.
- No public/beta activation occurred.
- No dependency/lockfile change occurred.
- No deploy/push occurred.

This phase's changes are validator/checker scripts, documentation, and package-script wiring only — no runtime/source change. No live KIS. No LLM. No public/beta activation.

## 10. Known out-of-scope issues

- Other historical checkers that slice the changelog do so from a discovered section-start index (e.g. `changelog.slice(sectionStart, sectionEnd)`), which is robust to prepended phases and did not fail the validation chain; they were intentionally left untouched to avoid speculative edits.
- No live KIS, LLM, Supabase, or public/beta concerns are in scope for this housekeeping phase.

## 11. Next recommended phase

- Phase 3FF-A-HANDOFF-A for a current-state handoff package.
- Or Phase 3FG-A-PLAN for guarded productization planning.
- Direct live KIS, LLM activation, beta/public activation, deploy, and push remain blocked.
