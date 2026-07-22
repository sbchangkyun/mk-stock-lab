# Architecture and Guards

## Chart AI owner-local deterministic panel architecture

- `src/pages/chart-ai.astro` computes `runSimilarPatternAgent(createSimilarPatternFixtureInput())` and `runMkAgent(createMkAgentFixtureInput())` at server-render time only. No `fetch`, no API route, no live KIS, no LLM.
- Output is rendered into a hidden-by-default `<section id="chartAiOwnerLocalDeterministicAgentsPanel">`. A small client-side script only toggles the `.hidden` class/attribute on the pre-rendered element; it does not fetch or recompute anything client-side.
- This panel coexists with the pre-existing owner-local panels (`ownerLocalMocked`, `ownerLocalAuthUsageBridge`, `ownerLocalSimilarPatternRoute`) and the default mocked/sample Chart AI experience, all of which are unaffected.

## Similar Pattern Agent contract

- SP-A (`src/lib/server/chart-ai/similar-pattern-agent.mjs`): deterministic fixture-only engine — log returns, normalized path indexed to 100, correlation score, normalized RMSE score, direction match score, volatility penalty, forward D5/D20 outcomes, max drawdown after match. Output labeled `historical_shape_similarity_only`; no buy/sell recommendation.
- SP-B v0.2 (`contractVersion: 'similar-pattern-agent.v0.2'`) hardened output fields, additive to SP-A and fully backward compatible:
  - `contractVersion`
  - `confidenceScore` / `confidenceLabel` (높음/보통 이상/보통/낮음)
  - `patternQuality` (`{ score, label, reasons, warnings, limitations }`, always states historical similarity does not predict or guarantee future results)
  - `matchReasonTags` (per-match, e.g. 상관계수 높음, 정규화 경로 유사, 방향성 일치, 낙폭 유사, 변동성 주의, 성과 해석 주의)
  - `outcomeDistribution` (`{ d5, d20 }` positive/negative/flat counts and average/median/best/worst forward-return percentages)
  - `contractSummary` (compact roll-up for downstream consumers)

## MK Agent contract

- MK-A/MK-B (`src/lib/server/chart-ai/mk-agent.mjs`): deterministic fixture-only report contract. `agentName: MK 에이전트`; strategy section titled `전략 체크포인트`; 7 required report sections (`phase_supply`, `strategy_checkpoints`, `price_pattern`, `technical_indicators`, `support_resistance`, `similar_history`, `risk_check`); 6 safety flags (`containsBuySellRecommendation`, `containsTargetPrice`, `containsStopLossInstruction`, `rawPayloadExposed`, `secretExposed`, `llmCalled`), all false on successful output. MK-B fixed the `삼성전자은` → `삼성전자는` Korean topic-particle grammar defect via `hasKoreanFinalConsonant`/`chooseKoreanTopicParticle`/`withKoreanTopicParticle`.
- MK-C SP-B consumption helpers (fail-soft, never throw on missing/malformed input):
  - `hasSpbSimilarPatternContract(similarPattern)` — gate that detects the SP-B contract.
  - `summarizeSpbContractForMkAgent(similarPattern)` — 신뢰도 summary line.
  - `summarizeOutcomeDistributionForMkAgent(similarPattern)` — D5/D20 평균/중앙값/최고/최저 bullets.
  - `summarizePatternQualityForMkAgent(similarPattern)` — 패턴 품질 label/reasons/warnings bullets.
  - `summarizeMatchReasonTagsForMkAgent(similarPattern)` — top-match reason tag bullet.
  - All four summarizers are woven additively into `createDeterministicMkAgentReport`'s `similarHistory`/`riskCheck` bullet arrays; legacy SP-A-shaped input produces byte-identical output to pre-MK-C behavior.

## UI guard

- Panel id: `#chartAiOwnerLocalDeterministicAgentsPanel`.
- Activation requires ALL of:
  - `mockedChartAiAccess.capabilities.canAccessChartAi` is true (existing mocked-access gate, unchanged).
  - `isLocalOwnerHostname()` is true (hostname is `localhost`, `127.0.0.1`, or `::1`).
  - URL query string carries `ownerLocalDeterministicAgents=1`.
- Default `/chart-ai` (no query string, or non-localhost host) leaves the panel hidden and the default experience fully unchanged.
- This is not a public or beta feature; it cannot be reached without both the localhost condition and the explicit query opt-in.

## Server guard / historical context

- Phase 3FD-I established the real-auth server guard foundation with all gates off — the scaffolding exists (`smoke:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off`) but no real auth/session/usage gate is active.
- Phase 3FD-J wired an owner-local Similar Pattern route path, still gated behind owner-local activation only, no public exposure.
- Phase 3FE-A established the KIS OHLC fixture provider boundary; live KIS remains blocked.

## Guard boundaries (must remain true)

- No live KIS.
- No LLM.
- No MK AI route activation.
- No public/beta activation.
- No real Supabase/DB/session/JWT.
- No raw provider payload exposure.
