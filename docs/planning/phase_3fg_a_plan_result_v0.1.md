# Phase 3FG-A-PLAN — Guarded Productization Planning Result

## 1. Status

Status: Prepared.

## 2. Purpose

Define the guarded productization path and approval boundaries for Chart AI after the verified SP-B/MK-C/UI-C/HOUSEKEEPING/HANDOFF-A baseline, before any runtime implementation. No runtime change. No live KIS. No LLM. No public/beta activation.

## 3. Baseline

- Baseline: dc36043.
- Latest completed phase before this phase: Phase 3FF-A-HANDOFF-A.
- Branch: rebuild/phase-1-ia-shell.

## 4. Files created

- `docs/planning/phase_3fg_a_plan_guarded_productization_v0.1.md`
- `docs/planning/phase_3fg_a_plan_result_v0.1.md` (this document)
- `scripts/check_phase_3fg_a_plan_contract.mjs`

## 5. Files modified

- `docs/planning/planning_changelog.md` — prepended the Phase 3FG-A-PLAN entry.
- `package.json` — added the `check:phase-3fg-a-plan` script.
- `scripts/check_phase_3ff_a_housekeeping_a_contract.mjs` — added a HANDOFF-A file-scope tolerance list (pre-existing gap; see Section 9).
- `scripts/check_phase_3ff_a_mk_c_contract.mjs` — added a HANDOFF-A file-scope tolerance list (pre-existing gap; see Section 9).
- `scripts/check_phase_3ff_a_sp_b_contract.mjs` — added a HANDOFF-A file-scope tolerance list (pre-existing gap; see Section 9).
- `scripts/check_phase_3ff_a_mk_b_contract.mjs` — added a HANDOFF-A file-scope tolerance list (pre-existing gap; see Section 9).
- `scripts/check_phase_3ff_a_mk_a_contract.mjs` — added a HANDOFF-A file-scope tolerance list (pre-existing gap; see Section 9).
- `scripts/check_phase_3ff_a_sp_a_contract.mjs` — added a HANDOFF-A file-scope tolerance list (pre-existing gap; see Section 9).
- `scripts/check_phase_3ff_a_plan_contract.mjs` — added a HANDOFF-A file-scope tolerance list (pre-existing gap; see Section 9).
- `scripts/check_phase_3ff_a_ui_a_contract.mjs` — added this phase's changelog header to its tolerated-headers allowlist (see Section 9).
- `scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs` — added this phase's changelog header to its tolerated-headers allowlist (see Section 9).
- `scripts/check_phase_3ff_a_ui_c_manual_qa_contract.mjs` — added this phase's changelog header to its tolerated-headers allowlist (see Section 9).
- `scripts/check_phase_3ff_a_handoff_a_contract.mjs` — extended its own sibling-checker tolerance list to cover the 6 files above it did not already tolerate (see Section 9).

All 11 checker modifications are additive tolerance-allowlist changes only (new entries appended to existing arrays). No protective assertion — forbidden-diff scope, mojibake scan, forbidden-investment-language scan, or required-token check — was removed or weakened in any of them.

## 6. Planning summary

`docs/planning/phase_3fg_a_plan_guarded_productization_v0.1.md` defines, in 17 sections, the guarded productization plan for Chart AI: current verified foundation; the productization objective; a real auth boundary plan (anonymous / authenticated / owner-admin-master, role/capability resolver, auth subject resolver, session/JWT/cookie/header boundary — still blocked); a feature flag / environment separation plan (owner-local, internal QA, beta, public audience tiers, plus independent provider-mode and agent-mode gates, all default off); a usage/cooldown/cache/cost/audit policy design (planning-only, no real persistence); a provider boundary plan (fixture, KIS OHLC fixture, live-KIS approval gap — live KIS remains blocked); the MK Agent deterministic-vs-LLM approval gap (LLM is not active); public/beta readiness criteria; a failure mode / fail-closed policy table; legal/safety copy and no-investment-advice constraints; proposed next implementation phases; explicit non-goals; approval gates; and a validation plan. This phase is planning-only: no product behavior was implemented and no runtime source file was modified.

## 7. Validation results

Reaching a fully clean run required remediating checker-compatibility gaps discovered mid-phase (11 sibling checker files patched; see Section 9 for the full account). After remediation, all required commands were re-run end to end and passed cleanly against the working tree (baseline `dc36043`):

- `npm run check:phase-3fg-a-plan`: passed.
- `npm run check:phase-3ff-a-handoff-a`: passed.
- `npm run check:phase-3ff-a-housekeeping-a`: passed.
- `npm run check:phase-3ff-a-ui-c-manual-qa`: passed.
- `npm run smoke:phase-3ff-a-mk-c`: passed.
- `npm run check:phase-3ff-a-mk-c`: passed.
- `npm run smoke:phase-3ff-a-sp-b`: passed.
- `npm run check:phase-3ff-a-sp-b`: passed.
- `npm run smoke:phase-3ff-a-mk-b`: passed.
- `npm run check:phase-3ff-a-mk-b`: passed.
- `npm run check:phase-3ff-a-ui-b-manual-qa`: passed.
- `npm run smoke:phase-3ff-a-ui-a`: passed.
- `npm run check:phase-3ff-a-ui-a`: passed.
- `npm run smoke:phase-3ff-a-mk-a`: passed.
- `npm run check:phase-3ff-a-mk-a`: passed.
- `npm run smoke:phase-3ff-a-sp-a`: passed.
- `npm run check:phase-3ff-a-sp-a`: passed.
- `npm run check:phase-3ff-a-plan`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.
- `git status --short`: reviewed — only Phase 3FG-A-PLAN allowed files and pre-existing known untracked paths present.

Forbidden diff vs `dc36043`: empty (no forbidden runtime/source path changed).

## 8. Boundary preservation

- No runtime change.
- No UI file changed.
- No API route changed.
- No MK Agent source/fixture changed.
- No Similar Pattern Agent source/fixture changed.
- No KIS provider source changed.
- No live KIS.
- No LLM.
- No MK AI route activation occurred.
- No Supabase client was created.
- No DB connection occurred.
- No env/session/JWT/cookie/header parsing occurred.
- No public/beta activation.
- No usage deduction occurred.
- No paid entitlement occurred.
- No ad unlock occurred.
- No dependency/lockfile change occurred.
- No package installed.
- No deploy/push occurred.

This phase's changes are documentation and package-script wiring only.

## 9. Known out-of-scope issues

Three checker-compatibility gaps were discovered while running the Section 17 validation plan. All three were remediated as minimal, additive allowlist patches (per the Phase 3FF-A-HOUSEKEEPING-A precedent) with no protective assertion weakened, and are documented here for traceability rather than left silent.

- **Pre-existing scope-tolerance gap left by Phase 3FF-A-HANDOFF-A (7 files).** `check_phase_3ff_a_housekeeping_a_contract.mjs`, `check_phase_3ff_a_mk_c_contract.mjs`, `check_phase_3ff_a_sp_b_contract.mjs`, `check_phase_3ff_a_mk_b_contract.mjs`, `check_phase_3ff_a_mk_a_contract.mjs`, `check_phase_3ff_a_sp_a_contract.mjs`, and `check_phase_3ff_a_plan_contract.mjs` had no tolerance entry for the 10 files Phase 3FF-A-HANDOFF-A's own commit (`dc36043`) added, so each failed its "only Phase X files may change" scope assertion with `git diff --name-only <its own baseline>` now spanning the HANDOFF-A commit. Fixed by adding a `HANDOFF_A_TOLERATED_FILES` / `HANDOFF_A_FILES` array (the same 10 file paths) to each checker's `allowedFiles` construction. This gap was not introduced by this phase; it was latent in the baseline and surfaced only because this phase is the first to run these 7 checkers' full validation chain against a HEAD that includes `dc36043`.
- **Missing tolerance for this phase's own changelog header (3 files).** `check_phase_3ff_a_ui_a_contract.mjs`, `check_phase_3ff_a_ui_b_manual_qa_contract.mjs`, and `check_phase_3ff_a_ui_c_manual_qa_contract.mjs` already had complete HANDOFF-A tolerance (both file-scope and changelog-position, correctly patched by Phase 3FF-A-HANDOFF-A itself) but could not have anticipated this phase's new `## Phase 3FG-A-PLAN - 2026-07-09` changelog header, since it did not exist until this phase prepended it. Each checker's changelog-position assertion parses the phase headers appearing above its own entry against a fixed allowlist; fixed by appending the new header string to each of `TOLERATED_HEADERS_ABOVE_UI_A`, `TOLERATED_HEADERS_ABOVE_UI_B`, and `TOLERATED_HEADERS_ABOVE_UI_C`.
- **Regression in `check_phase_3ff_a_handoff_a_contract.mjs` caused by the first fix (1 file).** Patching the 7 files in the first bullet modified their working-tree content, which made `check:phase-3ff-a-handoff-a` (validation command #2) start failing its own "only Phase 3FF-A-HANDOFF-A files may change" scope assertion for 6 of them (`mk-a`, `mk-b`, `mk-c`, `sp-a`, `sp-b`, `check_phase_3ff_a_plan_contract.mjs`) — the 4th, `check_phase_3ff_a_housekeeping_a_contract.mjs`, was already tolerated. This checker passed before this phase's edits and only broke as a side effect of them. Fixed by extending its existing `PATCHED_SIBLING_CHECKERS` allowlist with the 6 newly-affected paths.

No forbidden-diff, mojibake, or forbidden-investment-language assertion was touched by any of the above; all three fixes are scoped to tolerance-allowlist arrays only, consistent with the phase's "validator compatibility checker files only if absolutely required by validation" authorization.

## 10. Next recommended phase

- Phase 3FG-A — Guarded Productization Scaffold, All Gates Off.
- Live KIS, LLM, beta/public activation, deploy, and push remain blocked pending separate explicit approval.
