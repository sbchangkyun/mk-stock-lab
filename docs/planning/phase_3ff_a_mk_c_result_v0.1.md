# Phase 3FF-A-MK-C — MK Agent Consumption of SP-B Similar Pattern Contract Result

## 1. Status

Status: Implemented.

This phase updated the deterministic fixture-only MK Agent so it consumes the hardened Similar Pattern Agent SP-B contract (`similar-pattern-agent.v0.2`) and reflects it in the MK Agent report output, while remaining fully backward compatible with legacy SP-A-shaped Similar Pattern output. No LLM. No live KIS. No API route activation. No public/beta activation.

## 2. Purpose

- Update the deterministic fixture-only MK Agent so it consumes the hardened Similar Pattern Agent SP-B contract fields and reflects them in the MK Agent report output.
- Use SP-B fields (`contractVersion`, `confidenceScore`, `confidenceLabel`, `patternQuality`, `matches[].matchReasonTags`, `outcomeDistribution`, `contractSummary`) when present.
- Preserve full backward compatibility with legacy SP-A-shaped Similar Pattern output (no SP-B fields present).
- No LLM.
- No live KIS.
- No UI runtime change.
- No public/beta activation.

## 3. Baseline

- Baseline: a1e2d7f.
- Current baseline before MK-C: a1e2d7f.
- Latest completed phase before MK-C: Phase 3FF-A-SP-B.
- Branch: rebuild/phase-1-ia-shell.

## 4. SP-B consumption summary

- Added `hasSpbSimilarPatternContract(similarPattern)`: a safe, fail-soft gate that returns `true` only when the input carries the `similar-pattern-agent.v0.2` `contractVersion` (or a later SP-B-shaped contract carrying the same required fields), `false` otherwise — never throws on missing/malformed input.
- Added `summarizeSpbContractForMkAgent(similarPattern)`: returns a Korean summary line built from `confidenceScore`/`confidenceLabel` (신뢰도) and `contractSummary`, or `null` when the SP-B contract is absent.
- Added `summarizeOutcomeDistributionForMkAgent(similarPattern)`: returns Korean D5/D20 평균(average)/중앙값(median)/최고/최저 bullets built from `outcomeDistribution.d5`/`outcomeDistribution.d20`, or `null` when absent.
- Added `summarizePatternQualityForMkAgent(similarPattern)`: returns a 패턴 품질(pattern quality) label/reasons/warnings bullet set built from `patternQuality`, always including the fixed disclaimer that historical similarity does not predict or guarantee future results (미래 성과를 보장하지 않습니다), or `null` when absent.
- Added `summarizeMatchReasonTagsForMkAgent(similarPattern)`: returns a Korean bullet summarizing the top match's `matchReasonTags`, or `[]` when absent.
- All four summarizers are woven into `createDeterministicMkAgentReport`'s `similarHistory` and `riskCheck` bullet lists via additive array-spread (`buildSpbHistoryBullets`, `buildSpbRiskBullets` private helpers), so SP-B-derived bullets append after the existing SP-A-derived bullets rather than replacing them.

## 5. Legacy fallback status

- Every new summarizer gates on `hasSpbSimilarPatternContract` first and returns `null`/`[]` immediately when the SP-B contract fields are absent, malformed, or `similarPattern` itself is missing/undefined — no exception is ever thrown.
- Legacy SP-A-shaped Similar Pattern output (no `contractVersion`, no `confidenceScore`, no `patternQuality`, no `matchReasonTags`, no `outcomeDistribution`, no `contractSummary`) produces byte-identical `createDeterministicMkAgentReport` output to the pre-MK-C behavior, verified by `createMkAgentLegacySimilarPatternFixtureInput` in the smoke script.
- A partial/malformed SP-B contract (`createMkAgentPartialSpbContractFixtureInput`, e.g. `contractVersion` present but `patternQuality`/`outcomeDistribution` missing) degrades field-by-field: only the summarizers whose required fields are actually present and well-formed contribute bullets; the rest safely return `null`/`[]` without throwing.

## 6. Files created

- `scripts/smoke_phase_3ff_a_mk_c_sp_b_contract_consumption.mjs`
- `scripts/check_phase_3ff_a_mk_c_contract.mjs`
- `docs/planning/phase_3ff_a_mk_c_result_v0.1.md`

## 7. Files modified

- `src/lib/server/chart-ai/mk-agent.mjs`
- `src/lib/server/chart-ai/mk-agent.fixture.mjs`
- `docs/planning/planning_changelog.md`
- `package.json`
- `scripts/check_phase_3ff_a_mk_b_contract.mjs` (scope tolerance for MK-C's own deliverables)
- `scripts/check_phase_3ff_a_sp_b_contract.mjs` (scope tolerance plus MK Agent diff-filter tolerance for MK-C's legitimate source/fixture edits)
- `scripts/check_phase_3ff_a_sp_a_contract.mjs` (scope tolerance for MK-C's own deliverables)
- `scripts/check_phase_3ff_a_mk_a_contract.mjs` (scope tolerance for MK-C's own deliverables)
- `scripts/check_phase_3ff_a_plan_contract.mjs` (scope tolerance for MK-C's own deliverables)
- `scripts/check_phase_3ff_a_ui_a_contract.mjs` (scope tolerance plus changelog-header tolerance)
- `scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs` (scope tolerance plus changelog-header tolerance)

## 8. Implementation summary

- Added `SPB_CONTRACT_VERSION` constant (`'similar-pattern-agent.v0.2'`) to `mk-agent.mjs`, used to detect the SP-B contract without hardcoding the version string in multiple places.
- Added `hasSpbSimilarPatternContract`, `summarizeSpbContractForMkAgent`, `summarizeOutcomeDistributionForMkAgent`, `summarizePatternQualityForMkAgent`, `summarizeMatchReasonTagsForMkAgent` exported functions, plus `buildSpbHistoryBullets`/`buildSpbRiskBullets` private helpers, all gated fail-soft on `hasSpbSimilarPatternContract`.
- Wired the new helpers' output into `createDeterministicMkAgentReport`'s `similarHistory`/`riskCheck` bullet arrays via array-spread, additive to the existing SP-A-derived bullets.
- Added three new deterministic fixtures to `mk-agent.fixture.mjs`: `createMkAgentSpbContractFixtureInput` (full SP-B contract), `createMkAgentLegacySimilarPatternFixtureInput` (SP-A-shaped, no SP-B fields), `createMkAgentPartialSpbContractFixtureInput` (partial/malformed SP-B fields).
- Kept `detectForbiddenInvestmentLanguage`'s 8-phrase forbidden list unchanged; deliberately did not add bare `확정`/`보장` tokens, since that would collide with the required safe disclaimer phrase `보장하지 않습니다` used throughout the codebase's established phrase-level-only forbidden-language convention.
- No UI file changed. No API route changed. No Similar Pattern Agent source or fixture changed. No KIS provider module changed.

## 9. Smoke result

- `npm run smoke:phase-3ff-a-mk-c`: passed (235/235 assertions).

## 10. Validation results

All required commands were executed against the working tree (baseline `a1e2d7f`) on 2026-07-09 and passed:

- `npm run smoke:phase-3ff-a-mk-c`: passed (235/235 assertions).
- `npm run check:phase-3ff-a-mk-c`: passed (186/186 assertions).
- `npm run smoke:phase-3ff-a-sp-b`: passed (243/243 assertions).
- `npm run check:phase-3ff-a-sp-b`: passed (190/190 assertions).
- `npm run smoke:phase-3ff-a-mk-b`: passed (61/61 assertions).
- `npm run check:phase-3ff-a-mk-b`: passed (156/156 assertions).
- `npm run check:phase-3ff-a-ui-b-manual-qa`: passed (89/89 assertions).
- `npm run smoke:phase-3ff-a-ui-a`: passed (58/58 assertions).
- `npm run check:phase-3ff-a-ui-a`: passed (102/102 assertions).
- `npm run smoke:phase-3ff-a-mk-a`: passed (114/114 assertions).
- `npm run check:phase-3ff-a-mk-a`: passed (174/174 assertions).
- `npm run smoke:phase-3ff-a-sp-a`: passed (69/69 assertions).
- `npm run check:phase-3ff-a-sp-a`: passed (80/80 assertions).
- `npm run check:phase-3ff-a-plan`: passed (106/106 assertions).
- `npm run build`: passed (astro build + postbuild repair-vercel-output completed with no errors).
- `git diff --check`: passed (exit 0, no whitespace/conflict-marker errors).

Scoped diff checks against baseline `a1e2d7f` also passed:

- Forbidden diff (`chart-ai.astro`, API routes, `components`, `supabase`, `src/data`, lockfiles, `.env`/`.env.local`): empty, as required.
- Allowed source diff (`src/lib/server/chart-ai`): exactly `mk-agent.mjs` and `mk-agent.fixture.mjs`, as required.
- Similar Pattern Agent source/fixture diff: empty, as required.
- `git status --short`: confirms only the declared created/modified files changed; known unrelated untracked paths (`.agents/`, `.claude/`, `.vscode/settings.json`, `docs/handoff/codex_state_inspection/`, `skills-lock.json`) remain untouched.

## 11. Boundary preservation

- No UI file changed.
- No API route changed.
- No Similar Pattern Agent source or fixture changed.
- No KIS provider module changed.
- No live KIS call occurred.
- No LLM call occurred.
- No Supabase client was created.
- No DB connection occurred.
- No env/session/JWT/cookie/header parsing occurred.
- No public/beta activation occurred.
- No dependency/lockfile change occurred.
- No deploy/push occurred.

## 12. Known out-of-scope issues

- None discovered during this phase.

## 13. Next recommended phase

- A UI consumption pass to surface the new SP-B-derived MK Agent bullets (confidence, pattern quality, outcome distribution, match reason tags) in the owner-local panel, or further owner-local manual QA of the existing panel.
- Direct live KIS, LLM activation, beta/public activation, deploy, and push remain blocked.
