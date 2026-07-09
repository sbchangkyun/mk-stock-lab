# Completed Phase History (reverse chronological)

## Phase 3FF-A-HOUSEKEEPING-A

- Status: Implemented. Baseline: `07cd405`.
- Purpose: clean up stale historical checker changelog-slice/top-entry assumptions that fail once many later phases are prepended above them in `docs/planning/planning_changelog.md`.
- Implemented scope: fixed the primary historical checker (`check_phase_3fd_j_handoff_chart_ai_new_chat_package_contract.mjs`) to locate its phase entry by header instead of a fixed `changelog.slice(0, 3000)` window; relaxed UI-C's own changelog-position assertion to a known-allowlist tolerance; patched 6 additional sibling checkers (MK-C, SP-B, MK-B, MK-A, SP-A, PLAN) for a latent scope-tolerance gap surfaced once UI-C's files became tracked.
- Preserved boundaries: no runtime/source/UI/API/agent/provider/dependency/lockfile/env change; no live KIS; no LLM; no public/beta activation; no deploy/push.
- Next-step relevance: this phase's checker-scope pattern (header-based section lookup, tolerated-headers allowlist) is the template future phases should reuse instead of fixed-offset slicing.

## Phase 3FF-A-UI-C

- Status: Executed. Baseline: `86050be`.
- Purpose: real-browser owner-local QA of the deterministic Chart AI panel after SP-B and MK-C landed, confirming the improved MK Agent output (confidence, D5/D20 stats, pattern quality, match reason tags, `삼성전자는` grammar fix) renders correctly with no regression.
- Implemented scope: QA checklist and result documents covering default-page safety, owner-local opt-in, Similar Pattern panel, MK Agent panel, existing tab/regression checks, PC (1280×900) and mobile (375×812) responsive QA with explicit overflow measurement, and negative/safety text scans.
- Preserved boundaries: no UI/API/agent source change; no live KIS; no LLM; no public/beta activation; no deploy/push.
- Next-step relevance: confirms the SP-B/MK-C output is production-quality at the UI layer before further hardening.

## Phase 3FF-A-MK-C

- Status: Implemented. Baseline: `a1e2d7f`.
- Purpose: update the deterministic fixture-only MK Agent so it consumes the hardened Similar Pattern Agent SP-B contract fields and reflects them in the MK Agent report output.
- Implemented scope: `hasSpbSimilarPatternContract`, `summarizeSpbContractForMkAgent`, `summarizeOutcomeDistributionForMkAgent`, `summarizePatternQualityForMkAgent`, `summarizeMatchReasonTagsForMkAgent`, woven additively into `createDeterministicMkAgentReport`'s `similarHistory`/`riskCheck` bullets; three new fixtures (full SP-B, legacy SP-A-shaped, partial/malformed SP-B).
- Preserved boundaries: fully backward compatible with legacy SP-A output (byte-identical when SP-B fields absent); no UI/API change; no live KIS; no LLM.
- Next-step relevance: this is the MK Agent output that Phase 3FF-A-UI-C QA'd.

## Phase 3FF-A-SP-B

- Status: Implemented. Baseline: `3d4b7d2`.
- Purpose: harden the deterministic fixture-only Similar Pattern Agent output contract for MK Agent consumption and future productization.
- Implemented scope: `SIMILAR_PATTERN_CONTRACT_VERSION = 'similar-pattern-agent.v0.2'`; `computeConfidenceScore`/`labelConfidenceScore`; `computePatternQuality`; `classifyMatchReasonTags`; `computeOutcomeDistribution`/`computeMedian`; `createSimilarPatternContractSummary`; three new edge-case fixtures (low confidence, high volatility, flat outcome).
- Preserved boundaries: every existing SP-A field/export/fixture unchanged in shape and value; new fields strictly additive; deterministic output preserved.
- Next-step relevance: this is the contract that Phase 3FF-A-MK-C consumes.

## Phase 3FF-A-MK-B

- Status: Implemented. Baseline: `f25a7fc`.
- Purpose: harden the deterministic MK Agent output contract and fix a known Korean grammar defect.
- Implemented scope: fixed `삼성전자은` → `삼성전자는` via a deterministic Korean topic-particle helper (`hasKoreanFinalConsonant`, `chooseKoreanTopicParticle`, `withKoreanTopicParticle`) computed from Unicode Hangul syllable-block arithmetic; preserved all 7 required report sections and 6 safety flags.
- Preserved boundaries: no UI/API change; no live KIS; no LLM.
- Next-step relevance: fixed the grammar defect discovered during Phase 3FF-A-UI-B QA.

## Phase 3FF-A-UI-B

- Status: Executed. Baseline: `a32a52c`.
- Purpose: owner-local manual QA of the deterministic agent panel (Similar Pattern Agent + MK Agent) added to `/chart-ai` in Phase 3FF-A-UI-A.
- Implemented scope: real-browser QA of all 7 scenarios (default-page safety, owner-local opt-in, Similar Pattern panel, MK Agent panel, existing tab/regression, responsive PC+mobile, negative/safety checks); discovered and documented the `삼성전자은` grammar defect (fixed later in MK-B).
- Preserved boundaries: no product/engine/API change; no live KIS; no LLM; no public/beta activation.
- Next-step relevance: validated the UI wiring from Phase 3FF-A-UI-A before SP-B/MK-B hardening began.

## Phase 3FF-A-UI-A

- Status: Implemented. Baseline: `3edc84b`.
- Purpose: wire the existing deterministic, fixture-only Similar Pattern Agent and MK Agent outputs into `/chart-ai` as an owner-local-only UI path.
- Implemented scope: added hidden-by-default `<section id="chartAiOwnerLocalDeterministicAgentsPanel">` to `src/pages/chart-ai.astro`; server-render-time-only fixture computation (no fetch, no API route); visible only when localhost + `ownerLocalDeterministicAgents=1` query opt-in are both true.
- Preserved boundaries: default `/chart-ai` behavior unchanged for all other visitors; no API route activated; no live KIS; no LLM.
- Next-step relevance: this is the panel that all later UI-B/UI-C QA and SP-B/MK-B/MK-C content phases build on.

## Phase 3FF-A-MK-A-HF1

- Minor hotfix phase preceding UI-A. Refer to `docs/planning/planning_changelog.md` for detail; no source/runtime boundary changes relevant to this handoff's scope beyond what MK-A itself established.

## Phase 3FF-A-MK-A

- Status: Implemented. Baseline: `38d660a`.
- Purpose: implement the deterministic fixture-only MK Agent report contract.
- Implemented scope: `src/lib/server/chart-ai/mk-agent.mjs` and `mk-agent.fixture.mjs`; `MkAgentOutput`-shaped result; `agentName: MK 에이전트`; strategy section titled `전략 체크포인트`; PC card and mobile bottom-sheet output modes; deterministic forbidden-investment-language sanitizer; required disclaimer.
- Preserved boundaries: no UI/API change; no live KIS; no LLM.
- Next-step relevance: the foundational MK Agent contract that MK-B and MK-C later hardened.

## Phase 3FF-A-SP-A

- Status: Implemented. Baseline: `c4be878`.
- Purpose: implement the deterministic fixture-only Similar Pattern Agent engine.
- Implemented scope: `src/lib/server/chart-ai/similar-pattern-agent.mjs` and `similar-pattern-agent.fixture.mjs`; log returns, normalized path, correlation score, RMSE score, direction match score, volatility penalty, forward D5/D20 outcomes, max drawdown; output labeled `historical_shape_similarity_only`, no buy/sell recommendation.
- Preserved boundaries: no UI/API change; no live KIS; no LLM.
- Next-step relevance: the foundational Similar Pattern contract that SP-B later hardened and MK-A/MK-C consume.

## Phase 3FF-A-PLAN-HF1 / Phase 3FF-A-PLAN

- Planning-only phases that scoped the deterministic fixture-first Chart AI agent approach before SP-A/MK-A implementation began. Refer to `docs/planning/planning_changelog.md` for full detail.

## Route/guard history context (brief)

- Phase 3FE-A established the KIS OHLC fixture provider boundary used by the owner-local similarity smoke/route work, with live KIS still gated off.
- Phase 3FD-J wired an owner-local Similar Pattern route path (`smoke:phase-3fd-j-similar-pattern-route-owner-local-activation`), still gated behind owner-local activation only.
- Phase 3FD-I established the real-auth server guard foundation with all gates off (`smoke:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off`), i.e. the guard scaffolding exists but no real auth/session/usage gate is active yet.

These three are mentioned only to explain the pre-existing route/guard history that the current SP-B/MK-C/UI-C/HOUSEKEEPING work builds on top of; they are not part of this handoff's own deliverable set.
