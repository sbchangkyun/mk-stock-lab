# Phase 3FF-A-PLAN — Similar Pattern Agent and MK Agent Contract Planning Result

## 1. Status

Status: Prepared.

## 2. Purpose

- Record that Phase 3FF-A-PLAN prepared the Similar Pattern Agent and MK Agent planning package.
- No runtime change.

## 3. Baseline

- Current baseline before plan: `bd8ebd3`.
- Branch: `rebuild/phase-1-ia-shell`.
- Latest completed phase: `Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-EVIDENCE-HF1`.

## 4. Created files

- `docs/planning/phase_3ff_a_plan_similar_pattern_agent_design_v0.1.md`
- `docs/planning/phase_3ff_a_plan_mk_agent_design_v0.1.md`
- `docs/planning/phase_3ff_a_plan_result_v0.1.md`
- `scripts/check_phase_3ff_a_plan_contract.mjs`

## 5. Modified files

- `docs/planning/planning_changelog.md`
- `package.json`
- `scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_contract.mjs`
- `scripts/check_phase_3fe_a_manual_qa_run_closeout_hf1_contract.mjs`

## 6. Boundary preservation

- No runtime source changed.
- No API route changed.
- No UI implementation changed.
- No provider/helper source changed.
- No live KIS call occurred.
- No LLM call occurred.
- No MK AI route activation occurred.
- No Supabase client was created.
- No DB connection occurred.
- No env/session/JWT/cookie/header parsing occurred.
- No public/beta activation occurred.
- No dependency/lockfile change occurred.
- No deploy/push occurred.

## 7. Owner decisions reflected

- MK Agent name: `MK 에이전트`.
- Naming policy: use `사전 체크포인트`.
- Support/resistance price levels are allowed as observation/checkpoints.
- Open beta free usage policy: 3 uses per account per day.
- Similar Pattern and MK Agent are separate agents connected through a sanitized contract.
- Similar Pattern Agent is quantitative.
- MK Agent is the user-facing report agent.
- Similar Pattern MVP is limited to same-symbol historical comparison.
- PC card-style UI and mobile bottom-sheet UI are equally important.

## 8. Validation commands run and results

- `npm run check:phase-3ff-a-plan`: passed.
- Prior evidence and closeout HF1 checker compatibility was narrowed to tolerate the already-committed evidence HF1 files.
- `npm run check:phase-3fe-a-manual-qa-run-closeout-evidence-hf1`: passed.
- `npm run check:phase-3fe-a-manual-qa-run-closeout-evidence`: passed.
- `npm run check:phase-3fe-a-manual-qa-run-closeout-hf1`: passed.
- `npm run check:phase-3fe-a-manual-qa-run-closeout`: passed.
- `npm run check:phase-3fe-a-manual-qa-run-retry`: passed.
- `npm run check:phase-3fe-a-manual-qa-run-hf1`: passed.
- `npm run check:phase-3fe-a-manual-qa-run-result`: passed.
- `npm run check:phase-3fe-a-manual-qa-result`: passed.
- `npm run check:phase-3fe-a-handoff-chart-ai-new-chat-package`: passed.
- `npm run check:phase-3fe-a-kis-ohlc-provider-owner-local-integration`: passed.
- `npm run smoke:phase-3fe-a-kis-ohlc-provider-owner-local-integration`: passed.
- `npm run check:phase-3fd-j-similar-pattern-route-owner-local-activation`: passed.
- `npm run smoke:phase-3fd-j-similar-pattern-route-owner-local-activation`: passed.
- `npm run check:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off`: passed.
- `npm run smoke:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.

## 9. Recommended next phase

- Recommendation: `Phase 3FF-A-SP-PLAN` or `Phase 3FF-A-SP-A` for Similar Pattern deterministic fixture-only engine planning/implementation.
- Alternative: `Phase 3FF-A-MK-PLAN` or `Phase 3FF-A-MK-A` for MK Agent deterministic report planning/implementation.
- No direct live KIS/LLM/beta/public activation.

## 10. Hold

- live KIS.
- LLM activation.
- beta activation.
- public activation.
- deploy.
- push.
