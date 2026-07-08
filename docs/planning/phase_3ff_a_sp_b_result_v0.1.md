# Phase 3FF-A-SP-B — Similar Pattern Output Contract Hardening Result

## 1. Status

Status: Implemented.

This phase hardened the deterministic fixture-only Similar Pattern Agent output contract so it is more useful and safer for MK Agent consumption and future UI/productization, while preserving full backward compatibility with existing SP-A output. No LLM. No live KIS. No API route activation. No public/beta activation.

## 2. Purpose

- Harden the deterministic fixture-only Similar Pattern Agent output contract.
- Add contract versioning, a confidence score distinct from per-match similarity, a pattern-quality assessment, per-match reason tags, an outcome distribution, and a contract summary roll-up.
- Preserve every existing SP-A output field, export, and fixture unchanged.
- No LLM.
- No live KIS.
- No UI runtime change.
- No public/beta activation.

## 3. Baseline

- Baseline: 3d4b7d2.
- Current baseline before SP-B: 3d4b7d2.
- Latest completed phase before SP-B: Phase 3FF-A-MK-B.
- Branch: rebuild/phase-1-ia-shell.

## 4. Backward compatibility

- All existing SP-A output fields (`ok`, `status`, `source`, `summary`, `currentWindow`, `matches[].rank/similarityScore/scoreLabel/scoreBreakdown/forwardReturnD5Pct/forwardReturnD20Pct/maxDrawdownAfterPct/normalizedPath/drawdownLabel/outcomeLabel`, `aggregateOutcomes`, `safety`, `error`) are unchanged in shape and value for the default fixture.
- All existing SP-A exports (`DEFAULT_SIMILAR_PATTERN_OPTIONS`, `SCORE_LABELS`, `createSimilarPatternAgentInput`, `runSimilarPatternAgent`, `computeLogReturns`, `computeNormalizedPath`, `computePearsonCorrelation`, `computeRmse`, `computeDirectionMatchPct`, `computeMaxDrawdownPct`, `computeForwardReturnPct`, `computeSimilarityScore`, `labelSimilarityScore`, `validateSimilarPatternInput`) are unchanged.
- All existing SP-A fixtures (`createSimilarPatternFixtureInput`, `createInsufficientSimilarPatternFixtureInput`, `createInvalidCloseSimilarPatternFixtureInput`) are unchanged and still block/pass exactly as before.
- New fields (`contractVersion`, `confidenceScore`, `confidenceLabel`, `patternQuality`, `outcomeDistribution`, `contractSummary`, per-match `matchReasonTags`) and new fixtures are strictly additive.
- Output remains fully deterministic: identical input produces byte-identical JSON output across repeated calls.

## 5. Files created

- `scripts/smoke_phase_3ff_a_sp_b_output_contract_hardening.mjs`
- `scripts/check_phase_3ff_a_sp_b_contract.mjs`
- `docs/planning/phase_3ff_a_sp_b_result_v0.1.md`

## 6. Files modified

- `src/lib/server/chart-ai/similar-pattern-agent.mjs`
- `src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs`
- `docs/planning/planning_changelog.md`
- `package.json`

## 7. Implementation summary

- Added `SIMILAR_PATTERN_CONTRACT_VERSION = 'similar-pattern-agent.v0.2'`, exposed as `contractVersion` on every success and blocked output.
- Added `computeConfidenceScore`/`labelConfidenceScore`: a deterministic 0-100 confidence score (weighted blend of top-match strength, top-5 score spread, eligible-candidate pool depth, average volatility penalty, and D5/D20 outcome-data availability), distinct from per-match `similarityScore`, labeled 높음 (>=85) / 보통 이상 (>=70) / 보통 (>=55) / 낮음 (below 55).
- Added `computePatternQuality`: a top-level `patternQuality: { score, label, reasons, warnings, limitations }` assessment (candidate-pool depth, current-window data sufficiency, average volatility, worst historical forward drawdown), labeled 우수/양호/주의/낮음, whose `limitations` always states that historical similarity does not predict or guarantee future results, and which never contains buy/sell/target-price/stop-loss language.
- Added `classifyMatchReasonTags`: deterministic per-match tags (상관계수 높음, 정규화 경로 유사, 방향성 일치, 낙폭 유사, 변동성 주의, 성과 해석 주의) derived from each match's existing `scoreBreakdown`/`drawdownLabel`/`outcomeLabel`; every match's `matchReasonTags` array is guaranteed non-empty via a safe fallback tag.
- Added `computeOutcomeDistribution`/`computeMedian`: a top-level `outcomeDistribution: { d5, d20 }` with positive/negative/flat counts and average/median/best/worst forward-return percentages, computed from the existing Top-K matches without altering `aggregateOutcomes`.
- Added `createSimilarPatternContractSummary`: a compact `contractSummary` roll-up (market, symbol, asOfDate, baseWindow, topK, candidate counts, top-match score/label, confidence, pattern-quality label, D5/D20 direction balance, primary limitations) for downstream consumers that only need a summary view.
- Added three new deterministic edge fixtures to `similar-pattern-agent.fixture.mjs`: `createLowConfidenceSimilarPatternFixtureInput` (natural-drift current window, no injected pattern, so it always scores a strictly lower `confidenceScore` than the default fixture), `createHighVolatilitySimilarPatternFixtureInput` (default history with an alternating +-5% swing tail, which reliably triggers the `patternQuality.warnings` volatility caution), and `createFlatOutcomeSimilarPatternFixtureInput` (a widened-spacing injected-pattern layout with one deliberately flattened historical window, guaranteeing at least one flat D5/D20 match in `outcomeDistribution`).
- No UI file changed. No API route changed. No MK Agent source or fixture changed. No KIS provider module changed.

## 8. Smoke result

- `npm run smoke:phase-3ff-a-sp-b`: passed (243/243 assertions).

## 9. Validation results

All required commands were executed against the working tree (baseline `3d4b7d2`) and passed:

- `npm run smoke:phase-3ff-a-sp-b`: passed (243/243 assertions).
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

Scoped diff checks against baseline `3d4b7d2` also passed:

- Forbidden diff (`chart-ai.astro`, API routes, `components`, `supabase`, `src/data`, lockfiles, `.env`/`.env.local`): empty, as required.
- Allowed source diff (`src/lib/server/chart-ai`): exactly `similar-pattern-agent.mjs` and `similar-pattern-agent.fixture.mjs`, as required.
- MK Agent source/fixture diff: empty, as required.

## 10. Boundary preservation

- No UI file changed.
- No API route changed.
- No MK Agent source or fixture changed.
- No KIS provider module changed.
- No live KIS call occurred.
- No LLM call occurred.
- No Supabase client was created.
- No DB connection occurred.
- No env/session/JWT/cookie/header parsing occurred.
- No public/beta activation occurred.
- No dependency/lockfile change occurred.
- No deploy/push occurred.

## 11. Known out-of-scope issues

- None discovered during this phase. The low-confidence fixture's confidence-score gap versus the default fixture is real and strictly enforced by the smoke script, but numerically modest (both currently round to the same 높음 label); this is noted as a possible future refinement, not a defect.

## 12. Next recommended phase

- A UI/MK Agent consumption pass for the new hardened fields (`confidenceScore`, `patternQuality`, `matchReasonTags`, `outcomeDistribution`, `contractSummary`), or further owner-local manual QA of the existing panel.
- Direct live KIS, LLM activation, beta/public activation, deploy, and push remain blocked.
