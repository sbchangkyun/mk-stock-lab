# Phase 3FF-A-PLAN — Similar Pattern Agent Design

## 1. Status

Status: Prepared.

## 2. Purpose

- Define the planning contract for the Similar Pattern Agent.
- No runtime change.
- This document is planning-only and does not implement API, UI, provider, database, KIS, or LLM behavior.

## 3. Baseline

- Current baseline before plan: `bd8ebd3`.
- Latest completed phase: `Phase 3FE-A-MANUAL-QA-RUN-CLOSEOUT-EVIDENCE-HF1`.
- Branch: `rebuild/phase-1-ia-shell`.

## 4. Product role

- Similar Pattern Agent is the quantitative analysis agent.
- It compares the current chart with same-symbol historical windows.
- It does not generate the final user-facing report.
- It provides sanitized structured output to MK Agent.
- Similar Pattern remains a separate Chart AI tab.
- The Similar Pattern Agent and MK Agent are separate agents connected through a sanitized contract.

## 5. MVP scope

- Market scope: KR domestic stock.
- Data source shape: KIS OHLCV daily bars after approved provider/cache phases.
- Comparison scope: same-symbol historical comparison only.
- Base windows: 20 / 40 / 60 trading days.
- Default base window: 20 trading days.
- Lookback period: 3 years.
- Top K: 5.
- Forward outcome windows: 5 and 20 trading days.
- Volume is auxiliary only in MVP.
- DTW is excluded from MVP and deferred to future enhancement.
- Whole-market scan is excluded.
- Minute-bar analysis is excluded.
- Cross-symbol pattern search is excluded from MVP.
- Live KIS activation is not approved by this plan.

## 6. Data policy

- Use normalized OHLCV only.
- Do not expose raw KIS payload.
- Do not expose raw provider error.
- Do not expose KIS credentials.
- Do not expose tokens, app key values, application secret values, env values, cookies, sessions, JWTs, user email, or raw user identifiers.
- Do not expose raw provider payloads in API or UI responses.
- Sanitized output may include labels, scores, bucketed diagnostics, and summarized forward outcome metrics.

## 7. Transformation policy

- Use log returns for analysis.
- Use normalized path indexed to 100 for UI overlay.
- Do not compare raw prices directly.
- Normalize the current window and candidate windows using the same transformation.
- Validate sufficient OHLCV data before scoring.
- Reject invalid windows with missing close prices, non-positive prices, or insufficient forward outcome data.

## 8. MVP scoring formula

The MVP scoring formula uses:

- correlation score.
- normalized RMSE score.
- direction match score.
- volatility penalty.

Overall score:

```text
similarityScore =
  corrScore * 0.45
  + rmseScore * 0.35
  + directionScore * 0.20
  - volatilityPenalty
```

Weights are MVP defaults and owner-adjustable later.

Score interpretation:

- Higher score means stronger historical shape similarity.
- The score does not predict future price movement.
- Similarity means historical shape similarity, not future prediction.

## 9. Candidate search policy

- Use rolling window over same-symbol historical data.
- Exclude overlapping current windows.
- Exclude windows without forward outcome data.
- Exclude invalid or insufficient data.
- Exclude windows with non-positive close prices.
- Exclude windows with malformed date ordering.
- Sort by `similarityScore` descending.
- Return Top 5 results by default.

## 10. Forward outcome metrics

The Similar Pattern Agent should compute:

- `forwardReturnD5Pct`.
- `forwardReturnD20Pct`.
- `maxDrawdownAfterPct`.
- positive/negative counts.
- average forward return.
- median forward return.
- result distribution labels.
- drawdown bucket labels.

Forward metrics must be framed as historical outcomes of matched windows, not future predictions.

## 11. SimilarPatternAgentInput TypeScript-style contract

```ts
export type SimilarPatternAgentMarket = 'KR';
export type SimilarPatternAgentTimeframe = 'D';

export interface SimilarPatternAgentInput {
  market: SimilarPatternAgentMarket;
  symbol: string;
  timeframe: SimilarPatternAgentTimeframe;
  asOfDate: string;
  baseWindow: 20 | 40 | 60;
  lookbackYears: 3;
  topK: 5;
  ohlcv: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }>;
  options?: {
    includeVolumeDiagnostics?: boolean;
    excludeOverlappingCurrentWindow?: boolean;
  };
}
```

## 12. SimilarPatternAgentOutput TypeScript-style contract

```ts
export interface SimilarPatternAgentOutput {
  ok: boolean;
  status:
    | 'similar_patterns_ready'
    | 'blocked_data_insufficient'
    | 'blocked_kis_unavailable'
    | 'blocked_candidate_insufficient'
    | 'blocked_usage_exceeded'
    | 'fail_closed';
  source: 'normalized_ohlcv';
  summary: {
    market: 'KR';
    symbol: string;
    timeframe: 'D';
    baseWindow: 20 | 40 | 60;
    lookbackYears: 3;
    topK: 5;
    matchCount: number;
    similarityMeaning: 'historical_shape_similarity_only';
  };
  currentWindow: {
    startDate: string;
    endDate: string;
    normalizedPathIndexBase: 100;
  };
  matches: Array<{
    rank: number;
    startDate: string;
    endDate: string;
    similarityScore: number;
    scoreLabel: string;
    forwardReturnD5Pct: number | null;
    forwardReturnD20Pct: number | null;
    maxDrawdownAfterPct: number | null;
    outcomeLabel: string;
    drawdownLabel: string;
  }>;
  aggregateOutcomes: {
    positiveCountD5: number;
    negativeCountD5: number;
    positiveCountD20: number;
    negativeCountD20: number;
    averageForwardReturnD5Pct: number | null;
    medianForwardReturnD5Pct: number | null;
    averageForwardReturnD20Pct: number | null;
    medianForwardReturnD20Pct: number | null;
  };
  safety: {
    rawKisPayloadExposed: false;
    rawProviderErrorExposed: false;
    secretExposed: false;
    buySellRecommendation: false;
  };
  error: null | {
    code: string;
    message: string;
  };
}
```

## 13. API planning

- Future endpoint candidate: `POST /api/chart-ai/similarity`.
- This phase must not create the endpoint.
- Future endpoint must remain guarded and fail-closed.
- Future endpoint must accept only sanitized request inputs.
- Future endpoint must return the SimilarPatternAgentOutput contract or a safe blocked response.

## 14. UI planning

- PC card-style layout.
- Mobile card/bottom-sheet-friendly layout.
- Top 1 summary first on mobile.
- Top 5 table/card expansion.
- Current-window summary card.
- Historical match cards with score labels and outcome labels.
- Sanitized chart overlay may use normalized path indexed to 100.
- No raw KIS payload, raw provider payload, or raw OHLC rows in UI.

## 15. Cache/usage planning

Cache key pattern:

```text
chart_similarity:KR:{symbol}:D:{baseWindow}:3y:same_symbol_history:{asOfDate}
```

- Same request cache reuse.
- No raw KIS payload cache.
- Cache stores normalized/sanitized analysis-ready data only.
- Usage enforcement is not activated by this plan.
- Future usage policy should coordinate with the MK Agent open beta policy.

## 16. Fallback policy

Fallback statuses:

- data insufficient.
- KIS unavailable.
- candidate insufficient.
- usage exceeded.
- fail closed.

Fallback copy must avoid investment advice and must not expose provider internals.

## 17. Safety language

- Similarity means historical shape similarity, not future prediction.
- No buy/sell recommendation.
- No target price instruction.
- No stop-loss instruction.
- No certainty language.
- Forward outcomes are historical observations only.

## 18. Validation checklist

- Confirms same-symbol historical comparison only.
- Confirms 20 / 40 / 60 base windows.
- Confirms default 20 trading-day base window.
- Confirms 3-year lookback.
- Confirms Top 5 output.
- Confirms log returns and normalized path are used.
- Confirms raw prices are not compared directly.
- Confirms raw KIS payload is not exposed.
- Confirms no buy/sell recommendation.
- Confirms no live KIS activation.
- Confirms no runtime source change in this phase.

## 19. Future phase proposal

- SP-A deterministic engine with fixtures only.
- SP-B output contract and smoke tests.
- SP-C owner-local API route, no live KIS.
- SP-D UI integration with fixture/cache mode.
- SP-E owner-approved KIS cache/provider integration.
- SP-F owner QA and beta readiness.
