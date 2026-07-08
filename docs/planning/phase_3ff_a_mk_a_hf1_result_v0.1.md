# Phase 3FF-A-MK-A-HF1 — MK Agent Korean Copy Encoding Correction Result

## 1. Status

Status: Implemented.

This phase corrected a Korean copy encoding defect in the Phase 3FF-A-MK-A deterministic MK Agent report contract. No runtime behavior changed. No LLM. No live KIS. No UI runtime activation. No API route activation.

## 2. Purpose

- Correct MK Agent Korean copy encoding defect.
- Preserve deterministic fixture-only MK Agent report contract.
- No LLM.
- No live KIS.
- No UI runtime activation.
- No API route activation.

## 3. Baseline

- Current baseline before HF1: 60395f0.
- Latest completed phase before HF1: Phase 3FF-A-MK-A.
- Branch: rebuild/phase-1-ia-shell.

## 4. Defect

- MK Agent Korean user-facing copy was mojibake-corrupted in `src/lib/server/chart-ai/mk-agent.mjs` and `src/lib/server/chart-ai/mk-agent.fixture.mjs`.
- Corrupted examples included the agent name, the strategy checkpoint section title, the open beta usage notice, section titles, forbidden-language test fixtures, and the fixture display name.
- The Phase 3FF-A-MK-A smoke assertions incorrectly validated the corrupted mojibake strings instead of correct Korean strings, so the defect passed smoke and checker validation at the time.
- The original `docs/planning/phase_3ff_a_mk_a_result_v0.1.md` also recorded the corrupted strings in its report contract summary.

## 5. Corrections

- `MK 에이전트` restored as the agent name.
- `전략 체크포인트` restored as the strategy checkpoint section title.
- `삼성전자` restored as the fixture display name.
- `오픈베타에서는 계정당 하루 3회까지 사용할 수 있어요.` restored as the open beta usage notice.
- Korean disclaimer restored to include `참고용`, `매수·매도 추천이 아닙니다`, `투자 자문이 아닙니다`, and `최종 투자 판단의 책임은 이용자 본인에게 있습니다`.
- Remaining section titles (구간·수급, 가격 패턴, 기술적 지표, 지지·저항, 유사 과거 흐름, 리스크 체크) restored to readable Korean.
- Forbidden investment-language pattern list de-duplicated to correct Korean phrases only: 매수하세요, 매도하세요, 지금 진입, 목표가는, 손절가는, 강력 추천, 상승이 확정, 하락이 확정.
- Unsafe sanitizer test fixture restored to readable Korean forbidden-language test strings.
- Smoke script updated to assert correct Korean strings and to reject mojibake patterns and forbidden investment language in successful output.
- Checker script updated to require correct Korean tokens and reject corrupted mojibake tokens across source, fixture, smoke, checker, and MK-A result docs.
- Original `docs/planning/phase_3ff_a_mk_a_result_v0.1.md` corrected in place (agentName and strategy section title references).

## 6. Files corrected

- `src/lib/server/chart-ai/mk-agent.mjs`
- `src/lib/server/chart-ai/mk-agent.fixture.mjs`
- `scripts/smoke_phase_3ff_a_mk_a_deterministic_report_contract.mjs`
- `scripts/check_phase_3ff_a_mk_a_contract.mjs`
- `docs/planning/phase_3ff_a_mk_a_result_v0.1.md`

## 7. Files created

- `docs/planning/phase_3ff_a_mk_a_hf1_result_v0.1.md` (this document).

## 8. Files modified (non-source)

- `docs/planning/planning_changelog.md`

## 9. Validation results

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
- `npm run check:phase-3fe-a-handoff-chart-ai-new-chat-package`: passed.
- `npm run check:phase-3fe-a-kis-ohlc-provider-owner-local-integration`: passed.
- `npm run smoke:phase-3fe-a-kis-ohlc-provider-owner-local-integration`: passed.
- `npm run check:phase-3fd-j-similar-pattern-route-owner-local-activation`: passed.
- `npm run smoke:phase-3fd-j-similar-pattern-route-owner-local-activation`: passed.
- `npm run check:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off`: passed.
- `npm run smoke:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.
- Repository-wide mojibake fragment search after edits: no remaining matches in tracked source/doc content.

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
- No API route activation.

## 11. Next recommended phase

- Phase 3FF-A-SP-B for Similar Pattern output contract hardening.
- Or Phase 3FF-A-MK-B for MK Agent edge-case hardening and report card polish.
- Direct live KIS, LLM activation, beta/public activation, deploy, and push remain blocked.
