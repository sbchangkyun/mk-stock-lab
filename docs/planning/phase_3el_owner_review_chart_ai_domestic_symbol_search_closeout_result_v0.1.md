# Phase 3EL-OWNER-REVIEW-CLOSEOUT — Chart AI Owner Review Closeout Result

## 1. Status

Closed — owner review failed due to product direction; UX redesign required.

## 2. Decision

`FAIL_PRODUCT_DIRECTION / UX_REDESIGN_REQUIRED`

Phase 3EL should not proceed to deployment or deeper quote integration in its current UI form.

## 3. Background

Phase 3EK implemented the mocked-first domestic symbol master and deterministic search foundation. Phase 3EL wired that foundation into Chart AI as its first visible consumer. Phase 3EL-OWNER-REVIEW then prepared a safe manual local browser review package. The owner manually reviewed the local Chart AI UI and rejected the current product direction.

This is a structural product and UX failure, not a narrow search, filter, layout, or safety-copy defect.

## 4. Owner Review Evidence Summary

- The owner reviewed the local Chart AI page at `http://127.0.0.1:4321/chart-ai`.
- The owner shared a local screenshot and reference screenshots in chat.
- Screenshots are not committed, and no image files are added by this closeout.
- No raw API response, request/response body, secrets, cookies, browser storage, price payloads, account data, or provider payloads are recorded.
- This closeout records sanitized owner feedback only.

## 5. What Failed

### 5.1 Product Identity Failed

The page feels like an AI demo rather than a familiar stock lookup and chart page. It emphasizes an AI presentation before satisfying the basic stock-detail workflow. The future page identity should start with stock lookup and charting; Chart AI should be an optional feature layer.

### 5.2 Chart Expectation Failed

The sample bar/skeleton chart does not resemble the brokerage-style stock chart the owner expected. The redesign should make a candlestick OHLC chart the primary visual surface, support volume where practical, and provide familiar period controls. Mocked OHLC data is acceptable before an approved KIS chart-data phase when sample/source labels remain explicit.

### 5.3 Search Interaction Failed

The current selected-symbol state and temporary search-input state are mixed. Selecting or looking up a stock should not forcibly replace and retain the input with the selected stock code. The selected stock should appear separately in the stock header, while the input should clear or remain temporary. The current button label is too long; the preferred label is `조회`, with `종목 검색` as an acceptable alternative.

### 5.4 Information Hierarchy Failed

The stock name and code repeat across the result list, selected card, chart title, analysis title, and sample copy. Stock identity should be centralized and emphasized in the stock header. Lower sections should use concise local labels without repeatedly restating the same name and code.

### 5.5 AI-First Interaction Failed

Analysis sections should not be visible from the beginning. AI behavior should start only after the user activates `MK AI` near the chart. The interaction should present intro and usage guidance, staged loading messages, and then sequential analysis sections rather than revealing all analysis content immediately.

Example staged loading topics include price flow, volume changes, support/resistance, technical indicators, and risk review. This closeout records the interaction direction only and implements no loading or analysis behavior.

### 5.6 Missing Company/Profile Direction

The future design should include a company/security description area, represented by a `companyProfile` or equivalent contract. KIS support for metadata may be considered, but KIS natural-language company description availability must be verified later and is not assumed here.

## 6. Reference UX Direction

Familiar securities UX references: Naver Securities, Toss Securities, AlphaSquare, and NH Investment & Securities “차분이”. These references identify a familiar interaction category; this closeout does not copy their visual design or proprietary content.

Target pattern:

```text
search → stock header → candlestick chart → basic stock/company information → optional MK AI analysis
```

No raw screenshots are included.

## 7. Required Redesign Principles

1. Basic stock lookup comes first.
2. A candlestick chart is the main visual surface.
3. Search input and selected stock state must be separate.
4. Button copy should be short, preferably `조회`.
5. Stock identity should be centralized in the stock header.
6. AI analysis should be user-triggered through `MK AI`.
7. AI analysis should use intro → loading → sequential result reveal.
8. Company/profile description should be supported.
9. Sample/live/source labels must remain clear.
10. No real-time/live/current-price claims may appear unless supported by a later approved data phase.

## 8. Future Target Information Architecture

```text
Top search
Search result dropdown
Stock header
Primary tabs: 차트 / 종목정보 / 뉴스·공시 / AI 분석
Candlestick chart with volume
Period controls
Company/profile description
MK AI button near chart
MK AI intro and disclaimer
Staged analysis loading
Sequential AI analysis sections
```

Target sequential analysis sections:

- `국면·수급`
- `매매 전략`
- `가격 패턴`
- `기술적 지표`
- `지지·저항`
- `리스크 체크`

Each section should eventually support a summary, evidence, price or indicator checkpoints, and a risk or attention point.

## 9. Company/Profile Data Note

KIS may support some stock metadata and stock-information endpoints, but natural-language company description availability must be verified later. No KIS call is made in this closeout, and no final KIS company-description field is claimed.

The first redesign implementation should support mocked/static `companyProfile`. A later source decision may evaluate KIS, OpenDART, KRX, a manual/static seed, or another approved source. Potential profile fields include company name, symbol, market, exchange, asset type, industry, sector, description, source, `sourceAsOf`, and sample/stale state.

## 10. Safety Confirmation

- No runtime changes.
- No UI changes.
- No API route changes.
- No provider changes.
- No screenshot committed.
- No image file added.
- No dev server launched by Codex.
- No browser automation.
- No active owner smoke.
- No live KIS call.
- No live FX call.
- No production API call.
- No Supabase access, SQL, or migration.
- No Vercel environment or project change.
- No dependency added.
- No deployment.
- No push.

## 11. Next Phase Recommendation

Recommended: Phase 3EL-UXR — Chart AI Stock Lookup & MK AI Interaction Redesign Plan.

Purpose: Create a detailed redesign plan before any implementation.

Required future scope:

- Stock lookup-first page identity.
- Candlestick chart-first layout.
- Search input and selected-stock separation.
- Short lookup button.
- Reduced repeated symbol/name display.
- `MK AI` button.
- AI intro and disclaimer.
- Staged loading.
- Sequential analysis cards.
- Company/profile description area.
- Mocked OHLC and mocked `companyProfile` first.
- Later KIS data verification.

Alternative: None recommended before Phase 3EL-UXR.

Reason: The failure is structural, not a narrow hotfix.
