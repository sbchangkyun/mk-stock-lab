# Phase 3GG-A-PLAN — Live KIS / LLM Approval & Runtime Binding Plan, No Activation — Result v0.1

## 1. Status

Status: Prepared.

## 2. Purpose

Create a goal-first, planning-only approval and runtime-binding plan for progressing Chart AI from the current owner-local static shell / deterministic fixture state toward guarded runtime binding, live KIS approval, and LLM approval. Planning/documentation/checker only — no runtime, source, or scaffold change.

## 3. Baseline

- Baseline: 6fda354ced5281e08ccbcbea1aa9b76894304874.
- Latest completed phase before this phase: Phase 3FG-D-HF1.
- Branch: `rebuild/phase-1-ia-shell`.

## 4. Files created

- `docs/planning/phase_3gg_a_plan_live_kis_llm_approval_runtime_binding_v0.1.md`
- `docs/planning/phase_3gg_a_plan_result_v0.1.md` (this document)
- `scripts/check_phase_3gg_a_plan_contract.mjs`

## 5. Files modified

- `docs/planning/planning_changelog.md` (new `## Phase 3GG-A-PLAN - 2026-07-09` entry prepended).
- `package.json` (new `check:phase-3gg-a-plan` script entry).
- 12 sibling checkers patched for validator compatibility only (additive-only; no protective assertion weakened), required by the validation chain (see Section 12 for details): `scripts/check_phase_3fg_e_contract.mjs`, `scripts/check_phase_3fg_d_hf1_contract.mjs`, `scripts/check_phase_3fg_d_contract.mjs`, `scripts/check_phase_3fg_c_contract.mjs`, `scripts/check_phase_3fg_b_contract.mjs`, `scripts/check_phase_3fg_a_contract.mjs`, `scripts/check_phase_3fg_a_plan_contract.mjs`, `scripts/check_phase_3ff_a_ui_c_manual_qa_contract.mjs`, `scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs`, `scripts/check_phase_3ff_a_ui_a_contract.mjs`, `scripts/check_phase_3ff_a_mk_a_contract.mjs`, `scripts/check_phase_3ff_a_sp_a_contract.mjs`.

**No runtime change.** No `src/pages/chart-ai.astro` change. No scaffold/agent source or fixture change. No API route created.

## 6. Planning summary

The planning document defines 20 sections covering: current verified foundation (Phase 3FG-A through 3FG-D-HF1); the goal-first shortened path; six productization lanes (owner-local fixture-only through public); the Live KIS approval plan (11 gates, 7 non-goals); the LLM approval plan (11 gates, 5 non-goals); a 7-stage API route activation plan; an 11-step runtime binding sequence; a 4-tier × 9-capability approval matrix; flag/configuration policy; auth/usage/cache/audit ordering; data minimization policy; safety/Korean-copy policy; a 13-condition fail-closed failure mode table; a minimum validation plan; recommended next phases; a 12-item non-goals list; and a decision summary. It is derived directly from the ground-truth flag names, approval labels, safety copy, and blocked-boundary copy already present in `src/lib/server/chart-ai/guarded-productization-scaffold.mjs` (read-only inspection; not modified).

## 7. Goal-first shortened path summary

Per the owner's explicit direction, this phase skips nonessential handoff/freeze-style work. Phase 3FG-F (Guarded Productization Current State Handoff Package) — previously recommended next by the Phase 3FG-D-HF1 result document — is explicitly postponed, not cancelled: it remains available later only if a context-continuity handoff package becomes operationally necessary. The plan instead recommends Phase 3GG-B (Live KIS Approval Gate Checklist) as the next phase, directly advancing toward an owner-approvable Live KIS decision.

## 8. Live KIS approval plan summary

Enabling `providerMode: 'live_kis'` and/or `flags.liveKisEnabled: true` requires 11 individually-signed-off owner approval gates covering credential scoping, rate limits, cost ceiling, caching policy, audience scope (owner-local only for first activation), fail-closed error/fallback behavior, no raw payload exposure, audit/logging policy, no implicit beta/public unlock, a tested rollback plan, and an explicit sign-off on the specific activation commit. This phase performs none of the 7 listed non-goals (no credential read, no live call, no scaffold/provider modification, no flag flip, no route creation, no audience expansion, no committed activation date).

## 9. LLM approval plan summary

Enabling `agentMode: 'llm'` and/or `flags.llmEnabled: true` requires 11 individually-signed-off owner approval gates covering provider/model selection and data-handling terms, API key scoping, cost ceiling, prompt template review, deterministic safety-copy post-processing, forbidden-phrase exclusion, a hallucination content-filter layer, audience scope (owner-local only for first activation), fail-closed fallback to deterministic fixture output, audit/logging policy, and an explicit sign-off on the specific activation commit. This phase performs none of the 5 listed non-goals (no LLM provider call, no agent/fixture modification, no flag flip, no real prompt template stored as code, no audience expansion).

## 10. API route activation plan summary

A 7-stage plan (Stage 0 — no route exists, through Stage 6 — public activation), each stage specifying its allowed flags, required approvals, forbidden flag combinations, response envelope shape, and fail-closed failure behavior. No stage beyond Stage 0 (the current state) exists yet; no route file is created by this phase.

## 11. Runtime binding sequence summary

An 11-step minimum safe sequence: owner approval sign-off → single-flag-flip commit → re-run existing scaffold CLI QA → implement the corresponding API route stage (owner-local only, all-gates-off smoke + checker) → 12-case Browser QA → hotfix any defects → re-verify → document/changelog → (separately, later) plan beta/public expansion only after owner-local is proven stable → complete auth/usage/cache/audit wiring before any beta/public expansion → full approval-label sign-off plus deploy/push approval before public activation.

## 12. Validation results

All 29 commands from the work order's validation chain were executed in order after the three deliverable files were created and `package.json`/`planning_changelog.md` were updated: `check:phase-3gg-a-plan`, `check:phase-3fg-d-hf1`, `check:phase-3fg-e`, `smoke:phase-3fg-d`, `check:phase-3fg-d`, `check:phase-3fg-c`, `check:phase-3fg-b`, `smoke:phase-3fg-a`, `check:phase-3fg-a`, `check:phase-3fg-a-plan`, `check:phase-3ff-a-handoff-a`, `check:phase-3ff-a-housekeeping-a`, `check:phase-3ff-a-ui-c-manual-qa`, `smoke:phase-3ff-a-mk-c`, `check:phase-3ff-a-mk-c`, `smoke:phase-3ff-a-sp-b`, `check:phase-3ff-a-sp-b`, `smoke:phase-3ff-a-mk-b`, `check:phase-3ff-a-mk-b`, `check:phase-3ff-a-ui-b-manual-qa`, `smoke:phase-3ff-a-ui-a`, `check:phase-3ff-a-ui-a`, `smoke:phase-3ff-a-mk-a`, `check:phase-3ff-a-mk-a`, `smoke:phase-3ff-a-sp-a`, `check:phase-3ff-a-sp-a`, `check:phase-3ff-a-plan`, `npm run build`, `git diff --check`, `git status --short`. All 29 passed on the final run. Full command-by-command results are recorded in the final report delivered at the end of this phase.

12 sibling checkers required an additive-only cascade patch (no protective assertion weakened) so their changelog-header-position and changed-files-scope assertions tolerate this phase's new changelog entry and 3 new deliverable files: `scripts/check_phase_3fg_e_contract.mjs`, `scripts/check_phase_3fg_d_hf1_contract.mjs`, `scripts/check_phase_3fg_d_contract.mjs`, `scripts/check_phase_3fg_c_contract.mjs`, `scripts/check_phase_3fg_b_contract.mjs`, `scripts/check_phase_3fg_a_contract.mjs`, `scripts/check_phase_3fg_a_plan_contract.mjs`, `scripts/check_phase_3ff_a_ui_c_manual_qa_contract.mjs`, `scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs`, `scripts/check_phase_3ff_a_ui_a_contract.mjs`, `scripts/check_phase_3ff_a_mk_a_contract.mjs`, `scripts/check_phase_3ff_a_sp_a_contract.mjs`. Two of these (`check_phase_3ff_a_mk_a_contract.mjs`, `check_phase_3ff_a_sp_a_contract.mjs`) also had a pre-existing gap discovered (not caused) by this phase — their scope allowlist was missing Phase 3FG-D-HF1's own deliverables — fixed in the same additive patch. This phase's own new checker (`scripts/check_phase_3gg_a_plan_contract.mjs`) was additionally self-patched to list all 12 sibling-checker paths in its own `PATCHED_SIBLING_CHECKERS` allowlist, once the cascade touched them.

## 13. Forbidden diff result

Command:

```
git diff --name-only 6fda354ced5281e08ccbcbea1aa9b76894304874 -- src/pages/chart-ai.astro src/lib/server/chart-ai/guarded-productization-scaffold.mjs src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs src/lib/server/chart-ai/mk-agent.mjs src/lib/server/chart-ai/mk-agent.fixture.mjs src/lib/server/chart-ai/similar-pattern-agent.mjs src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs pages/api src/pages/api components supabase src/data package-lock.json pnpm-lock.yaml yarn.lock .env .env.local
```

Result: forbidden diff: empty. No forbidden path touched.

## 14. Boundary preservation

No live KIS. No LLM. No public/beta activation. No API route activation. No scaffold source change. No MK Agent source/fixture change. No Similar Pattern Agent source/fixture change. No KIS provider module change. No `chart-ai.astro` change. No Supabase/DB real runtime. No env/session/JWT/cookie/header parsing. No usage deduction. No paid entitlement. No ad unlock. No package installs. No deploy. No push. `.agents/`, `.claude/`, `.vscode/settings.json`, `docs/handoff/codex_state_inspection/`, and `skills-lock.json` were left untouched.

## 15. Known out-of-scope issues

- This phase is planning-only; none of the 22 approval gates (Sections 7-8 of the planning document) have been individually reviewed or signed off by the owner yet — that review is deferred to Phase 3GG-B (Live KIS gates) and Phase 3GG-C (LLM gates).
- No API route, smoke script, or browser QA was created or run in this phase, since no runtime-visible surface changed.

## 16. Next recommended phase

**Phase 3GG-B — Live KIS Approval Gate Checklist** (owner-reviewable, planning-only, no activation), per the goal-first shortened path. Phase 3FG-F remains postponed. Live KIS, LLM, beta/public activation, API route activation, scaffold source change, deploy, and push all remain blocked and were not exercised in this phase.
