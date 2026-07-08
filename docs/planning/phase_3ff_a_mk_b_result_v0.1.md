# Phase 3FF-A-MK-B — MK Agent Output Contract Hardening and Korean Grammar Fix Result

## 1. Status

Status: Implemented.

This phase hardened the deterministic fixture-only MK Agent output contract and fixed a known Korean grammar defect. No LLM. No live KIS. No API route activation. No public/beta activation.

## 2. Purpose

- Harden the deterministic fixture-only MK Agent output contract.
- Fix the Korean topic-particle grammar defect in the MK Agent report summary.
- No LLM.
- No live KIS.
- No UI runtime change.
- No public/beta activation.

## 3. Baseline

- Baseline: f25a7fc.
- Current baseline before MK-B: f25a7fc.
- Latest completed phase before MK-B: Phase 3FF-A-UI-B.
- Branch: rebuild/phase-1-ia-shell.

## 4. Known issue fixed

- Fixed: `삼성전자은` → `삼성전자는`.
- The MK Agent `oneLineSummary` used a hardcoded Korean topic particle (`은`) after the stock display name, which is grammatically incorrect for display names whose last syllable has no final consonant (e.g. `삼성전자`).
- A deterministic Korean topic-particle helper now derives the correct particle (`은`/`는`) from the display name's last character using Unicode Hangul syllable-block arithmetic, with a safe non-Hangul fallback.
- Successful MK Agent report output now contains `삼성전자는` and no longer contains `삼성전자은`.

## 5. Files created

- `scripts/smoke_phase_3ff_a_mk_b_output_contract_hardening.mjs`
- `scripts/check_phase_3ff_a_mk_b_contract.mjs`
- `docs/planning/phase_3ff_a_mk_b_result_v0.1.md`

## 6. Files modified

- `src/lib/server/chart-ai/mk-agent.mjs`
- `src/lib/server/chart-ai/mk-agent.fixture.mjs`
- `docs/planning/planning_changelog.md`
- `package.json`
- `scripts/check_phase_3ff_a_ui_a_contract.mjs`
- `scripts/check_phase_3ff_a_ui_b_manual_qa_contract.mjs`
- `scripts/check_phase_3ff_a_mk_a_contract.mjs`
- `scripts/check_phase_3ff_a_sp_a_contract.mjs`
- `scripts/check_phase_3ff_a_plan_contract.mjs`

## 7. Implementation summary

- Added a deterministic Korean topic-particle helper (`hasKoreanFinalConsonant`, `chooseKoreanTopicParticle`, `withKoreanTopicParticle`) to `mk-agent.mjs`, computed via Unicode code-point arithmetic on the Hangul syllable block (U+AC00–U+D7A3). No Intl, no runtime locale, no network, no random, no clock.
- Replaced the hardcoded `${displayName}은` in `createDeterministicMkAgentReport`'s `oneLineSummary` with `withKoreanTopicParticle(displayName)`.
- Preserved the deterministic fixture-only report contract: `ok`, `status`, `agentName`, `report.oneLineSummary`, `report.summaryBullets`, `report.sections`, `report.usageNotice`, `report.disclaimer`, and all 7 required section keys (`phase_supply`, `strategy_checkpoints`, `price_pattern`, `technical_indicators`, `support_resistance`, `similar_history`, `risk_check`) unchanged.
- Preserved the visible strategy section title `전략 체크포인트` and the forbidden legacy title `사전 체크포인트` remains absent.
- Preserved all 6 safety flags (`containsBuySellRecommendation`, `containsTargetPrice`, `containsStopLossInstruction`, `rawPayloadExposed`, `secretExposed`, `llmCalled`) as false on successful output.
- Added optional fixture helpers `createMkAgentKoreanParticleFixtureInput` and `createMkAgentNonHangulDisplayNameFixtureInput` to `mk-agent.fixture.mjs` for particle-grammar and non-Hangul fallback coverage. No real KIS payload, secrets, emails, tokens, env values, cookies, sessions, JWTs, or raw provider payload were added.
- No UI file changed. No API route changed. No MK AI route activation.

## 8. Validation results

All 12 commands were executed against the working tree (baseline `f25a7fc`) and passed:

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
- `npm run build`: passed (astro build + postbuild completed with no errors).
- `git diff --check`: passed (no whitespace errors; CRLF-will-be-used informational warnings only).

Scoped diff checks against baseline `f25a7fc` also passed:

- Forbidden diff (`chart-ai.astro`, API routes, `components`, `supabase`, `src/data`, lockfiles, `.env`/`.env.local`): empty, as required.
- Allowed source diff (`src/lib/server/chart-ai`): exactly `mk-agent.mjs` and `mk-agent.fixture.mjs`, as required.
- Similar Pattern Agent source/fixture diff: empty, as required.

## 9. Boundary preservation

- No UI file changed.
- No API route changed.
- No Similar Pattern Agent source or fixture changed.
- No live KIS call occurred.
- No LLM call occurred.
- No MK AI route activation occurred.
- No Supabase client was created.
- No DB connection occurred.
- No env/session/JWT/cookie/header parsing occurred.
- No public/beta activation occurred.
- No dependency/lockfile change occurred.
- No deploy/push occurred.

## 10. Next recommended phase

- Phase 3FF-A-SP-B for Similar Pattern output contract hardening.
- Or Phase 3FF-A-UI-C / an owner-local manual QA hotfix pass if browser-level visual confirmation of the Korean grammar fix is desired.
- Direct live KIS, LLM activation, beta/public activation, deploy, and push remain blocked.
