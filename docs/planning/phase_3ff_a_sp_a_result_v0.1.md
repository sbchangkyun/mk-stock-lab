# Phase 3FF-A-SP-A — Similar Pattern Agent Deterministic Fixture Engine Result

## 1. Status

Status: Implemented.

## 2. Purpose

- Implement deterministic fixture-only Similar Pattern Agent engine.
- No live KIS.
- No UI runtime activation.
- No API route activation.

## 3. Baseline

- Baseline: `c4be878`.
- Current baseline before SP-A: `c4be878`.
- Latest completed phase before SP-A: `Phase 3FF-A-PLAN-HF1`.
- Branch: `rebuild/phase-1-ia-shell`.

## 4. Created files

- `src/lib/server/chart-ai/similar-pattern-agent.mjs`
- `src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs`
- `scripts/smoke_phase_3ff_a_sp_a_similar_pattern_agent_deterministic_fixture_engine.mjs`
- `scripts/check_phase_3ff_a_sp_a_contract.mjs`
- `docs/planning/phase_3ff_a_sp_a_result_v0.1.md`

## 5. Modified files

- `docs/planning/planning_changelog.md`
- `package.json`
- `scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_contract.mjs`
- `scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_hf1_contract.mjs`
- `scripts/check_phase_3fe_a_manual_qa_run_closeout_hf1_contract.mjs`
- `scripts/check_phase_3fe_a_kis_ohlc_provider_owner_local_integration_contract.mjs`
- `scripts/check_phase_3ff_a_plan_contract.mjs`

## 6. Implementation summary

- Pure deterministic calculation module.
- Synthetic fixture module.
- Smoke test.
- Static checker.
- Package scripts.
- Changelog update.

## 7. Algorithm summary

- log returns.
- normalized path indexed to 100.
- correlation score.
- normalized RMSE score.
- direction match score.
- volatility penalty.
- forward D5/D20 outcomes.
- max drawdown after match.

## 8. Output contract summary

- SimilarPatternAgentOutput-shaped result.
- safety flags all false.
- `historical_shape_similarity_only`.
- Source is `normalized_ohlcv`.
- Similarity means historical shape similarity only.
- No buy/sell recommendation.

## 9. Validation results

- `npm run smoke:phase-3ff-a-sp-a`: passed.
- `npm run check:phase-3ff-a-sp-a`: passed.
- `npm run check:phase-3ff-a-plan`: passed.
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

## 10. Boundary preservation

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
- No UI runtime activation.
- No live KIS.
- No LLM.

## 11. Next recommended phase

- Recommendation: `Phase 3FF-A-SP-B` for output contract hardening and edge-case fixture smoke.
- Alternative: `Phase 3FF-A-MK-A` for deterministic MK Agent report contract using fixture Similar Pattern output.
- Hold: direct live KIS, LLM activation, beta/public activation, deploy, and push remain blocked.
