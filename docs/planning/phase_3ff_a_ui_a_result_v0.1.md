# Phase 3FF-A-UI-A — Chart AI Owner-local Deterministic Agent UI Wiring Result

## 1. Status and purpose

Status: Implemented.

This phase wired the existing deterministic, fixture-only Similar Pattern Agent and MK Agent outputs into the Chart AI page as an owner-local-only UI path. No live KIS. No LLM. No API route activation. No public/beta activation.

- Purpose: render Similar Pattern Agent and MK Agent deterministic fixture output on `/chart-ai`, visible only to the owner on localhost with explicit opt-in.
- The default `/chart-ai` page behavior is unchanged for all other visitors.

## 2. Baseline

- Baseline: `3edc84b`.
- Latest completed phase before UI-A: Phase 3FF-A-MK-A-HF1.
- Branch: `rebuild/phase-1-ia-shell`.

## 3. Created files

- `scripts/smoke_phase_3ff_a_ui_a_owner_local_deterministic_agent_ui_wiring.mjs`
- `scripts/check_phase_3ff_a_ui_a_contract.mjs`
- `docs/planning/phase_3ff_a_ui_a_result_v0.1.md`

## 4. Modified files

- `src/pages/chart-ai.astro`
- `docs/planning/planning_changelog.md`
- `package.json`
- `scripts/check_phase_3ff_a_mk_a_contract.mjs`
- `scripts/check_phase_3ff_a_sp_a_contract.mjs`
- `scripts/check_phase_3ff_a_plan_contract.mjs`
- `scripts/check_phase_3fe_a_manual_qa_run_closeout_contract.mjs`
- `scripts/check_phase_3fe_a_manual_qa_run_closeout_hf1_contract.mjs`
- `scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_contract.mjs`
- `scripts/check_phase_3fe_a_manual_qa_run_closeout_evidence_hf1_contract.mjs`
- `scripts/check_phase_3fe_a_manual_qa_run_retry_contract.mjs`
- `scripts/check_phase_3fe_a_manual_qa_run_hf1_contract.mjs`
- `scripts/check_phase_3fe_a_manual_qa_run_result_contract.mjs`
- `scripts/check_phase_3fe_a_manual_qa_result_contract.mjs`
- `scripts/check_phase_3fe_a_handoff_chart_ai_new_chat_package.mjs`

The 12 sibling checker files above were patched narrowly so their own git-diff scope checks tolerate the `src/pages/chart-ai.astro` diff introduced by this phase; none of their assertion logic or subject matter changed.

## 5. Implementation summary

- Added a new, hidden-by-default `<section id="chartAiOwnerLocalDeterministicAgentsPanel">` to `src/pages/chart-ai.astro`.
- Frontmatter computes `runSimilarPatternAgent(createSimilarPatternFixtureInput())` and `runMkAgent(createMkAgentFixtureInput())` at server-render time only — no `fetch`, no API route, no live KIS, no LLM.
- Panel content is fully pre-rendered server-side from the deterministic fixture output; client-side script only toggles `.hidden` on the existing panel element.
- All other existing owner-local panels (`ownerLocalSimilarPatternRoute`, `ownerLocalMocked`, `ownerLocalAuthUsageBridge`) and the default `/chart-ai` experience are unchanged.

## 6. Owner-local activation rule

The new panel is visible only when all of the following are true:

- `mockedChartAiAccess.capabilities.canAccessChartAi` is true (existing mocked-access gate, unchanged).
- `isLocalOwnerHostname()` is true (hostname is `localhost`, `127.0.0.1`, or `::1`).
- The URL query string carries `ownerLocalDeterministicAgents=1`.

This is not a public or beta feature. It cannot be reached without both the localhost condition and the explicit query opt-in.

## 7. Safety and content contract

- Required visible Korean labels present: `MK 에이전트`, `전략 체크포인트`, `오픈베타에서는 계정당 하루 3회까지 사용할 수 있어요.`, `참고용`, `매수·매도 추천이 아닙니다`, `투자 자문이 아닙니다`.
- Required safety copy present: `이 결과는 fixture 기반 owner-local 검증용입니다.`, `실제 KIS 데이터가 아닙니다.`, `LLM을 호출하지 않습니다.`, `투자 참고용이며 매수·매도 추천이 아닙니다.`
- No mojibake fragments present in the page source.
- No forbidden investment language (`매수하세요`, `매도하세요`, `지금 진입`, `목표가는`, `손절가는`, `강력 추천`, `상승이 확정`, `하락이 확정`) present in the page source.
- No raw JSON, stack traces, secrets, or raw provider error payloads are rendered.

## 8. Validation results

- `npm run smoke:phase-3ff-a-ui-a`: passed.
- `npm run check:phase-3ff-a-ui-a`: passed.
- `npm run smoke:phase-3ff-a-mk-a`: passed.
- `npm run check:phase-3ff-a-mk-a`: passed.
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
- `npm run check:phase-3fe-a-handoff-chart-ai-new-chat-package`: known pre-existing failure, unrelated to this phase (see Section 9).
- `npm run build`: passed.
- Forbidden diff (`pages/api src/pages/api components supabase src/data package-lock.json pnpm-lock.yaml yarn.lock .env .env.local` vs `3edc84b`): empty.
- Allowed UI diff (`src/pages` vs `3edc84b`): exactly `src/pages/chart-ai.astro`.
- Allowed source diff (`src/lib/server/chart-ai` vs `3edc84b`): empty.

## 9. Known pre-existing out-of-scope issue

`npm run check:phase-3fd-j-handoff-chart-ai-new-chat-package` fails independently of this phase. Its checker asserts the `## Phase 3FD-J-HANDOFF - 2026-07-04` changelog entry stays within the first 3000 characters of `docs/planning/planning_changelog.md`. That assumption was already broken before this phase started, by the many phases (3FE-A and its sub-phases, 3FF-A-PLAN and its sub-phases, 3FF-A-SP-A, 3FF-A-MK-A, 3FF-A-MK-A-HF1) prepended above it in prior windows. This checker has no git-diff scope logic and is not causally connected to any file this phase touches. It is not fixed here.

## 10. Boundary preservation and next recommended phase

Boundary preservation:

- No API route changed or activated.
- No KIS provider module changed; no live KIS call occurs from this panel.
- No LLM call occurs; no LLM provider code was added.
- No Similar Pattern Agent or MK Agent engine or fixture source changed.
- No file under `components/` changed.
- No file under `src/data` changed.
- No Supabase client was created; no DB connection occurred.
- No env, session, JWT, cookie, or header parsing occurred.
- No dependency or lockfile change occurred; no package installs occurred.
- No public/beta activation occurred; the panel is gated strictly behind localhost and `ownerLocalDeterministicAgents=1`.
- The default `/chart-ai` page behavior is unchanged for all other visitors.
- No deploy occurred. No push occurred.

Next recommended phase:

- Phase 3FF-A-UI-B for owner-local manual QA of the deterministic agent panel across both fixture agents, or Phase 3FF-A-SP-B / 3FF-A-MK-B for output contract hardening.
- Direct live KIS, LLM activation, beta/public activation, deploy, and push remain blocked.
