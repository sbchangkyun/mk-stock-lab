# Phase 3EL-UXR — Chart AI Stock Lookup & MK AI Interaction Redesign Plan

## 1. Status

Planned — Chart AI stock lookup and MK AI interaction redesign plan completed; no runtime changes.

## 2. Background

Phase 3EK implemented the mocked-first domestic symbol master and deterministic search foundation. Phase 3EL wired that foundation to Chart AI as its first visible consumer. Phase 3EL-OWNER-REVIEW-CLOSEOUT then recorded `FAIL_PRODUCT_DIRECTION / UX_REDESIGN_REQUIRED` after the owner’s local review.

The current UI must not proceed to deployment or deeper quote integration in its current form. This phase creates the required structural redesign plan before any implementation.

## 3. Product Repositioning

Reposition the product:

- From: AI demo-first Chart AI page.
- To: stock lookup-first chart page with optional MK AI analysis.

Target pattern:

```text
search → stock header → candlestick chart → basic stock/company information → optional MK AI analysis
```

`Chart AI` becomes a feature layer, tab, or call to action rather than the initial page’s dominant identity.

| Option | Description | Recommendation |
| --- | --- | --- |
| `종목 차트` | Most direct chart-first identity | Recommended |
| `종목 조회` | Broad lookup-first identity | Acceptable |
| `Chart AI` | Keep as feature/tab/CTA, not primary identity | Not recommended as initial dominant title |

Recommended default: `종목 차트`.

## 4. Benchmark Interpretation

UX category references are Naver Securities, Toss Securities, AlphaSquare, and NH Investment & Securities “차분이”.

- Do not copy their exact UI, proprietary content, or visual system.
- Use familiar stock-detail conventions: stock header, price/basic information, candlestick chart, period controls, tabs, and an optional AI layer.
- Use “차분이” only as an interaction reference for AI introduction, loading, and sequential result behavior.

## 5. Target Information Architecture

### PC Target

```text
Top search
Search result dropdown
Stock header
Primary tabs: 차트 / 종목정보 / 뉴스·공시 / AI 분석
Candlestick chart with volume
Period controls
Company/profile description
Basic stock metadata
MK AI button near chart
MK AI intro/disclaimer
Staged loading
Sequential AI analysis sections
```

### Mobile Target

```text
Compact top search or search icon
Stock header
Price/basic info area
Primary tabs: 차트 / 종목정보 / 뉴스 / AI 분석
Candlestick chart first
Period controls
MK AI button near chart
Company/profile summary below chart
AI result bottom sheet or stacked cards after activation
```

Mobile must be designed from 390px width first.

## 6. Search UX Redesign

- Search input is temporary query state.
- Selected stock is separate persistent state.
- Selecting a result updates the stock header and clears the search input.
- The lookup button label is `조회`; `종목 검색` is an acceptable fallback.
- Search results use a compact dropdown/list.
- Keyboard and empty-result behavior remain explicit.

Recommended stock row:

```text
삼성전자
005930 · KOSPI · 주식
```

Recommended ETF row:

```text
KODEX 200
069500 · ETF · KRW
```

Stock name and code are emphasized primarily in the stock header and are not repeated excessively in every section.

## 7. Stock Header Design

Required fields:

```text
nameKo
symbol
exchange
assetType
currency
sample/live/source label
```

Optional future fields:

```text
current price
change
changePercent
asOf
marketState
```

Mocked values are allowed only with clear labeling. Recommended safe labels:

- `샘플 데이터`
- `실제 시세 아님`
- `조회 시점 기준`
- `최근 조회 기준`
- `데이터 일시 불가`

Forbidden unless a later approved data phase supports the claim:

- `실시간`
- `실시간 시세`
- `현재 시세`
- `live`
- `real-time`
- `actual market value`

## 8. Candlestick Chart Plan

The first implementation uses a mocked-first candlestick OHLC chart with:

- OHLC candles.
- Volume bars.
- Period controls.
- Price axis.
- Date axis.
- Sample/source label.

Recommended period controls are `1일`, `1주`, `1개월`, `3개월`, and `1년`; a compact `일`, `주`, `월`, `년` set is acceptable.

Mocked/static OHLC data is acceptable first. The redesign implementation must not call KIS or claim real market data. KIS chart-data integration belongs to a separate later phase.

Future KIS candidates to verify later include daily price, period price, minute bars, and ETF/ETN quote data. None are claimed as integrated.

## 9. Company/Profile Description Plan

Planning contract:

```ts
type CompanyProfile = {
  symbol: string;
  nameKo: string;
  market: 'KR';
  exchange: 'KOSPI' | 'KOSDAQ' | 'ETF' | 'UNKNOWN';
  assetType: 'stock' | 'etf' | 'etn' | 'other';
  industryNameKo: string | null;
  sectorNameKo: string | null;
  descriptionKo: string | null;
  source: 'mocked' | 'kis' | 'opendart' | 'krx' | 'manual';
  sourceAsOf: string | null;
  staleState: 'sample' | 'fresh' | 'stale-but-usable' | 'unavailable';
};
```

- Initial implementation can use mocked/static `companyProfile`.
- No KIS call occurs in this phase.
- KIS natural-language company description availability must be verified later.
- If unavailable, later options include OpenDART, KRX, manual/static seed, or another approved source.

Place this content in the `종목정보` tab or a compact company-overview card below the chart.

Example planned copy:

```text
기업 개요
삼성전자는 반도체, 모바일, 디스플레이, 가전 등을 주요 사업으로 영위하는 국내 대표 전자 기업입니다.
데이터: 샘플 정보
```

## 10. MK AI Activation Plan

- Place an `MK AI` button near the upper-left chart area.
- No analysis content is visible before user activation.
- First activation opens intro/usage guidance and a disclaimer.
- A “do not show today” option may be added later if feasible.
- The user explicitly starts analysis.

Planned intro:

```text
MK AI는 선택한 종목의 차트 흐름을 여러 관점에서 분석합니다.
분석 결과는 투자 참고용이며, 매수·매도 추천이 아닙니다.
```

Buttons: `분석 시작`, `닫기`, `오늘 하루 보지 않기`.

## 11. MK AI Loading Plan

Required staged loading copy:

```text
분석 중이에요.
조금만 기다려주세요.
가격 흐름을 확인하고 있어요.
거래량 변화를 살펴보고 있어요.
지지선과 저항선을 찾고 있어요.
기술적 지표를 비교하고 있어요.
리스크 요인을 점검하고 있어요.
```

- The UI may show short staged progress even when mocked/local results are ready.
- Staged loading must build anticipation without implying live provider calls or real-time analysis.
- Loading is cancel-safe, mobile-safe, and never blocks the page permanently.
- Recommended mocked/local preview duration: 1.5s to 3.5s total.

## 12. MK AI Result Reveal Plan

Required sequential sections:

- `국면·수급`
- `매매 전략`
- `가격 패턴`
- `기술적 지표`
- `지지·저항`
- `리스크 체크`

Each section follows:

```text
summary
evidence
checkpoints
risk or attention point
```

Reveal the overall summary first and then one section at a time. Users may switch with button-based chips/tabs. Avoid rendering every card at page load. Cards should remain concise while providing deeper evidence than the interaction reference.

Example planned structure:

```text
국면·수급
요약: 단기 조정 이후 상승 흐름은 유지되고 있습니다.
근거: 최근 고점 이후 거래량은 줄었지만 주요 이동평균 위에서 가격이 유지됩니다.
확인 구간: 320,000원 지지, 350,000원 저항
주의점: 고점권 변동성이 커질 수 있습니다.
```

## 13. Data Model Planning

### Chart OHLC Data

```ts
type MockedOhlcPoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
```

### Stock Lookup View Model

```ts
type StockLookupViewModel = {
  symbol: string;
  nameKo: string;
  exchange: string;
  assetType: string;
  currency: 'KRW';
  sourceLabel: 'sample' | 'owner-preview' | 'live-approved' | 'unavailable';
  quote?: {
    price: number | null;
    change: number | null;
    changePercent: number | null;
    asOf: string | null;
  };
  companyProfile?: CompanyProfile;
  chart?: MockedOhlcPoint[];
};
```

### MK AI Analysis Model

```ts
type MkAiAnalysisSection = {
  id: 'phase-flow' | 'strategy' | 'price-pattern' | 'technical-indicators' | 'support-resistance' | 'risk-check';
  titleKo: string;
  summaryKo: string;
  evidenceKo: string[];
  checkpointsKo: string[];
  riskKo: string | null;
  source: 'mocked' | 'computed' | 'llm' | 'unavailable';
};
```

Implementation starts with mocked/static models and connects to approved quote, chart, and profile infrastructure only in later phases.

## 14. UX Copy Policy

Use concise financial-service copy.

Recommended: `조회`, `종목 검색`, `종목 차트`, `샘플 데이터`, `실제 시세 아님`, `기업 개요`, `MK AI`, `분석 시작`, `분석 중이에요.`, `조금만 기다려주세요.`

Avoid: `선택 종목 분석 보기`, `대단한 AI 분석`, `실시간 분석`, `현재 시세 분석`, `완벽한 투자 판단`, `매수 추천`, `매도 추천`.

The service must avoid investment-advice claims.

## 15. Mobile-First Rules

- Design at 390px first.
- The chart must not widen document/body.
- Chart controls scroll locally if needed.
- AI result bottom sheets fit the mobile viewport.
- No horizontal body overflow.
- The stock header remains readable.
- Search dropdown does not cover the entire page unnecessarily.
- Dense analysis chips scroll locally.
- Preserve Phase 3DX and Phase 3DW geometry constraints.

## 16. Accessibility and Interaction Rules

- Search input has an accessible label.
- Result rows are keyboard-selectable.
- `MK AI` is keyboard-focusable.
- A future modal/bottom sheet has focus management.
- Loading state uses a polite live region.
- Analysis chips are buttons, not plain text.
- Selected state is visually clear.
- Empty search state is clear.

## 17. Source and Safety Policy

- Public `source=live` remains disabled.
- `source=auto` remains deferred.
- The real FX provider remains unselected.
- The US quote provider remains unimplemented.
- No KIS call in UXR.
- No quote/API/provider integration in UXR.
- No real-time/live/current-price wording is introduced.
- No raw provider payload.
- No secrets.
- No account or trading API.

## 18. Implementation Roadmap

1. Phase 3EL-HF1 — Chart AI Stock Lookup Layout Redesign.
2. Phase 3EL-HF2 — Mocked Candlestick Chart and Volume Foundation.
3. Phase 3EL-HF3 — Search Input / Dropdown / Lookup UX Fix.
4. Phase 3EL-HF4 — MK AI Activation, Intro, and Staged Loading.
5. Phase 3EL-HF5 — MK AI Sequential Analysis Cards.
6. Phase 3EL-HF6 — Mocked CompanyProfile Overview.
7. Phase 3EL-OWNER-REVIEW-RETRY — Redesigned Chart AI Owner Review.
8. Phase 3EM — Normalized Quote / Chart / Profile Data Infrastructure Plan.

Implementation is split into bounded phases to isolate layout, charting, search state, AI interaction, analysis content, and profile-data risk before owner review.

## 19. Owner Decision Matrix

| Decision | Options | Recommended default | Needed before |
| --- | --- | --- | --- |
| Primary page title | `종목 차트` / `종목 조회` / `Chart AI` | `종목 차트` | HF1 |
| Search button label | `조회` / `종목 검색` | `조회` | HF1 |
| Candlestick mocked data allowed | Yes / No | Yes | HF2 |
| CompanyProfile mocked data allowed | Yes / No | Yes | HF6 |
| MK AI intro required | Required / Skip | Required | HF4 |
| MK AI loading duration | None / 1.5–3.5s / Longer | 1.5s to 3.5s | HF4 |
| AI result reveal style | Sequential cards / All at once | Sequential cards | HF5 |
| Default mobile tab | 차트 / 종목정보 / AI 분석 | 차트 | HF1 |
| Price display in mocked phase | Labeled sample / Hide | Allowed only if labeled sample; otherwise hide | HF1/HF2 |
| Buy/order CTAs | Include / Exclude | Do not include | HF1 |
| Keep Chart AI as nav label | Keep / Rename now | Keep for now; page content says `종목 차트` | HF1 |
| Redesign review before quote infrastructure | Yes / No | Yes | Before Phase 3EM |

## 20. Risk Register

| Risk | Mitigation |
| --- | --- |
| AI demo feel remains too strong | Keep lookup, stock header, and chart visually dominant. |
| Candlestick chart looks fake | Use coherent OHLC fixtures, realistic axes, and explicit sample labels. |
| Sample data confused as live data | Repeat restrained sample/source labels at the header and chart. |
| Search state remains confusing | Separate query state from selected-stock state and clear input after selection. |
| Mobile chart overflow | Design and statically guard at 390px first. |
| Analysis cards are too verbose | Use progressive reveal and concise summaries. |
| Analysis cards are too shallow | Require evidence, checkpoints, and risk fields. |
| Investment-advice wording risk | Block recommendation and certainty claims in copy checks. |
| KIS company profile availability uncertain | Start mocked/static and verify sources later. |
| Future quote/chart data integration complexity | Keep view models provider-neutral. |
| Provider leakage risk | Project client-safe fields only. |
| Owner review fails again due to visual quality | Run redesigned owner review before quote infrastructure. |

## 21. Validation Plan for Future Implementation

Every future implementation phase runs:

```bash
npm run check:mobile-baseline
npm run check:production-domain
npm run build
git diff --check
npm run guard:production-mobile-geometry
```

Feature-specific checkers validate stock lookup layout, search-input clear behavior, candlestick structure, volume display, sample/non-live labels, `MK AI` activation, intro modal/bottom sheet, staged loading, sequential cards, companyProfile card, forbidden wording, and mobile 390px containment.

Production geometry runs only after deployment and explicit owner approval.

## 22. Final Recommendation

Recommended next phase: Phase 3EL-HF1 — Chart AI Stock Lookup Layout Redesign.

Alternative: Phase 3EL-HF2 — Mocked Candlestick Chart and Volume Foundation, only if the owner wants chart visual fidelity before layout restructuring.

Start with Phase 3EL-HF1 because the failure is information architecture first, not chart rendering alone.
