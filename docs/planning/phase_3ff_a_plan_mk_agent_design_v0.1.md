# Phase 3FF-A-PLAN — MK Agent Design

## 1. Status

Status: Prepared.

## 2. Purpose

- Define the planning contract for MK Agent.
- No runtime change.
- This document is planning-only and does not implement UI, API route, LLM, KIS, Supabase, database, or usage runtime behavior.

## 3. Baseline

- Current baseline before plan: `bd8ebd3`.
- Latest completed phase: `Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-EVIDENCE-HF1`.
- Branch: `rebuild/phase-1-ia-shell`.

## 4. Product role

- MK Agent is the user-facing Chart AI report agent.
- MK Agent receives Similar Pattern Agent output.
- MK Agent creates the final friendly analysis report.
- MK Agent is not just an LLM wrapper.
- MK Agent combines deterministic safety rules, structured Similar Pattern Agent input, report formatting, and future optional LLM assistance.
- MK Agent remains a separate Chart AI tab.

## 5. Agent name

- Agent/service name: `MK 에이전트`.
- The name should be used consistently in first-use guidance and report UI copy.

## 6. UX benchmark

Inspired by NH 나무증권 character-style UX:

- AI entry point.
- first-use guidance.
- bottom sheet/modal.
- staged loading.
- sequential reveal.
- friendly character tone.

Improvements over the benchmark:

- deeper explanation.
- safer investment-language constraints.
- clearer separation between historical observation and recommendation.
- explicit source/limitation labeling.
- stronger mobile bottom-sheet structure.

## 7. Required UI modes

- PC card-style UI.
- Mobile bottom sheet UI.
- Treat both as equally important.
- PC mode should use readable cards and progressive detail expansion.
- Mobile mode should prioritize a bottom sheet, summary-first layout, and staged reveal.

## 8. User flow

1. User selects stock.
2. User opens MK Agent tab.
3. Guidance modal/bottom sheet appears.
4. User starts analysis.
5. Staged loading appears.
6. Similar Pattern Agent output is received.
7. MK Agent report is generated.
8. Summary appears first.
9. Detail cards are revealed.

## 9. First-use guidance copy in Korean

Required copy direction:

- Must include `MK 에이전트`.
- Must say it is for reference only.
- Must say it is not buy/sell recommendation or investment advice.

Example:

```text
MK 에이전트가 차트와 유사 과거 흐름을 참고해 이해하기 쉬운 리포트를 준비해드릴게요.
이 내용은 참고용이며, 매수·매도 추천이나 투자 자문이 아닙니다.
```

## 10. Loading copy in Korean

Friendly staged loading messages:

```text
차트 흐름을 살펴보고 있어요.
비슷했던 과거 구간을 확인하고 있어요.
위험 체크포인트를 정리하고 있어요.
MK 에이전트 리포트를 준비하고 있어요.
```

## 11. Analysis categories

- One-line summary.
- 구간·수급.
- 전략 체크포인트.
- 가격 패턴.
- 기술적 지표.
- 지지·저항.
- 유사 과거 흐름.
- 리스크 체크.

## 12. Naming policy

- Use `전략 체크포인트`.
- Do not use the legacy trading-strategy label.
- The label must frame observations and scenarios, not trading instructions.

## 13. Support/resistance policy

- Price levels may be mentioned.
- Must use observation/checkpoint/scenario language.
- Must not use buy/sell instruction language.
- Support/resistance language belongs inside `전략 체크포인트`, `지지·저항`, or risk sections as observational context.

## 14. Allowed phrasing examples

Allowed examples:

- `82,000원 부근의 단기 지지 여부를 관찰할 수 있는 구간이에요.`
- `85,000원 부근에서는 매물 부담이 커질 수 있어요.`
- `유사했던 과거 흐름에서는 이후 결과가 엇갈렸기 때문에 방향성을 단정하기는 어려워요.`
- `이 가격대는 매수 지점이 아니라 관찰 체크포인트로만 다뤄야 해요.`
- `지지와 저항은 확정된 신호가 아니라 시나리오 점검용 기준이에요.`

## 15. Forbidden phrasing examples

These examples are forbidden and may appear only in this explicit forbidden-phrasing section:

- `매수하세요.`
- `매도하세요.`
- `지금 진입하세요.`
- `목표가는 78,000원입니다.`
- `손절가는 70,000원입니다.`
- `강력 추천합니다.`
- `상승이 확정적입니다.`

## 16. MkAgentInput TypeScript-style contract

```ts
export interface MkAgentInput {
  market: 'KR';
  symbol: string;
  displayName: string;
  asOfDate: string;
  selectedTab: 'mk_agent';
  similarPattern: SimilarPatternAgentOutput;
  userContext: {
    accountState: 'authenticated';
    usageRemainingToday: number;
    isOwnerOrAdminBypass?: boolean;
  };
  uiMode: 'pc_card' | 'mobile_bottom_sheet';
  language: 'ko';
}
```

## 17. MkAgentOutput TypeScript-style contract

```ts
export interface MkAgentOutput {
  ok: boolean;
  status:
    | 'mk_report_ready'
    | 'blocked_similar_pattern_unavailable'
    | 'blocked_usage_exceeded'
    | 'blocked_data_insufficient'
    | 'blocked_kis_unavailable'
    | 'blocked_llm_unavailable'
    | 'blocked_sanitizer_failure'
    | 'fail_closed';
  agentName: 'MK 에이전트';
  report: {
    oneLineSummary: string;
    sections: Array<{
      key:
        | 'supply_demand'
        | 'pre_checkpoints'
        | 'price_pattern'
        | 'technical_indicators'
        | 'support_resistance'
        | 'similar_history'
        | 'risk_check';
      title: string;
      body: string;
      severity?: 'info' | 'watch' | 'risk';
    }>;
    disclaimer: string;
  };
  safety: {
    containsBuySellRecommendation: false;
    containsTargetPrice: false;
    containsStopLossInstruction: false;
    rawPayloadExposed: false;
    secretExposed: false;
  };
  error: null | {
    code: string;
    message: string;
  };
}
```

## 18. Safety object requirements

- `containsBuySellRecommendation: false`
- `containsTargetPrice: false`
- `containsStopLossInstruction: false`
- `rawPayloadExposed: false`
- `secretExposed: false`

## 19. Usage policy

- Open beta free usage: 3 uses per account per day.
- Reset the next day.
- Login required.
- Future ad viewing/watching can unlock additional uses.
- Future paid subscribers may receive unrestricted or high-limit use.
- owner/admin may have development bypass.
- This phase does not activate usage runtime or persistence.

## 20. LLM policy

- MVP planning should prefer deterministic summary first.
- LLM activation is deferred to a separate owner-approved phase.
- No live LLM call in this phase.
- Future LLM output must pass sanitizer checks before UI display.

## 21. Output sanitizer policy

- Block buy/sell recommendation.
- Block target price instruction.
- Block stop-loss instruction.
- Block certainty language.
- Block raw payload-like dumps.
- Block secrets/env/session/JWT patterns.
- Require disclaimer.
- Require reference-only wording.
- Require observation/checkpoint/scenario language for price levels.

## 22. Fallback policy

- Similar Pattern failure.
- LLM failure.
- usage exceeded.
- data insufficient.
- KIS unavailable.
- sanitizer failure.
- fail closed.

Fallback copy must be friendly, short, and safe.

## 23. Validation checklist

- Confirms `MK 에이전트` name.
- Confirms PC card layout planning.
- Confirms mobile bottom sheet planning.
- Confirms Similar Pattern Agent input dependency.
- Confirms `전략 체크포인트` naming.
- Confirms the legacy trading-strategy label is not used as recommended copy.
- Confirms support/resistance language is observational only.
- Confirms 3 uses per account per day open beta policy.
- Confirms LLM activation is deferred.
- Confirms no live LLM call.
- Confirms no buy/sell recommendation.
- Confirms sanitizer safety object.
- Confirms no runtime source change in this phase.

## 24. Future phase proposal

- MK-A deterministic report contract with fixtures.
- MK-B PC card UI and mobile bottom-sheet scaffold.
- MK-C Similar Pattern handoff integration.
- MK-D open beta 3/day usage policy integration.
- MK-E sanitizer and safety checker.
- MK-F optional owner-local LLM scaffold.
- MK-G owner QA and beta readiness.
