# Phase 3DP-OWNER-SMOKE-CLOSEOUT — Owner Portfolio Live Preview API Smoke Closeout: Result

## 1. Metadata

| Field | Value |
|-------|-------|
| Phase | 3DP-OWNER-SMOKE-CLOSEOUT |
| Type | Owner Portfolio Live Preview API Smoke Closeout |
| Status | **Completed — owner API smoke PASS** |
| Latest prior commit | `ee919d1` (chore: prepare portfolio live preview owner smoke) |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Runtime UI changes | None |
| API route changes | None in this phase |
| DB / Supabase schema changes | None |
| Live KIS calls by Claude Code | None |
| Live KIS calls by owner | Completed through local API smoke — PASS |
| Local API smoke by owner | Completed — PASS |
| Live FX calls | None |
| Live GNews calls | None |
| AI provider calls | None |
| External data fetch by Claude Code | None |
| Vercel production deployment | Not performed |

---

## 2. Final Owner Smoke Result

Owner manually ran `npm run smoke:portfolio-live-preview-api:owner` against the local dev server. The final run (Attempt 3) passed all contract checks.

| Field | Value |
|-------|-------|
| Endpoint | `POST /api/portfolio/valuation` |
| Execution | Owner manual local run |
| Local target label | `local-api` |
| `source` | `live` |
| `previewMode` | `owner` |
| `baseCurrency` | `KRW` |
| `positionCount` | `3` |
| Symbols | `005930`, `000660`, `069500` |
| HTTP status | `200` |
| Response parse | passed |
| Response contract | passed |
| `quoteSource` | `live` |
| `liveAttempted` | `true` |
| `providerStored` | `false` |
| Provider leakage check | passed |
| `staleState` | `fresh` |
| `rowCount` | `3` |
| `missingQuoteCount` | `0` |
| `unsupportedCount` | `0` |
| `unavailableRows` | `0` |
| `apiLivePreview` | `true` |
| `contractValidated` | `true` |
| Final result | passed |

### Sanitized Final Output (Attempt 3)

```text
phase3dp step=guard-check status=passed mode=live-approved sanitized=true
phase3dp step=runtime-check status=passed note=local-non-production-confirmed sanitized=true
phase3dp step=local-api-target-check status=passed target=local-api sanitized=true
phase3dp step=request-shape-check status=passed source=live previewMode=owner baseCurrency=KRW positionCount=3 symbols=005930,000660,069500 sanitized=true
phase3dp step=api-call status=passed httpStatus=200 sanitized=true
phase3dp step=response-parse status=passed sanitized=true
phase3dp step=response-contract status=passed ok=true source=live previewMode=owner quoteSource=live liveAttempted=true providerStored=false sanitized=true
phase3dp step=provider-leakage-check status=passed sanitized=true
phase3dp step=safe-summary status=passed staleState=fresh rowCount=3 missingQuoteCount=0 unsupportedCount=0 unavailableRows=0 sanitized=true
phase3dp step=final-result status=passed apiLivePreview=true contractValidated=true sanitized=true
```

---

## 3. Attempt History

| Attempt | Target | Outcome | Notes |
|---------|--------|---------|-------|
| 1 | `127.0.0.1` (default) | `api-call` failed — `API_CALL_EXCEPTION` | Local API connection issue; no HTTP response reached |
| 2 | `localhost:4321` | HTTP 200, contract passed, `staleState=unavailable`, `missingQuoteCount=3`, `unavailableRows=3` | KIS env vars not loaded before dev server start; quotes unavailable for all rows |
| 3 | `localhost:4321` | HTTP 200, contract passed, `staleState=fresh`, `missingQuoteCount=0`, `unavailableRows=0` — **PASS** | Final run after local runtime correction; all quotes fresh |

---

## 4. Product Interpretation

- The portfolio live preview API contract works correctly behind the owner gate in a local non-production environment.
- KR stock positions (`005930`, `000660`) and KR ETF position (`069500`) all resolved successfully through the gated live API path.
- The API response contract passed all validations: `source=live`, `previewMode=owner`, `quoteSource=live`, `liveAttempted=true`, `providerStored=false`.
- Fresh quote state was confirmed for all three rows (`staleState=fresh`, `missingQuoteCount=0`).
- No provider leakage was detected in the API response.
- Attempt 2 confirmed that KIS env vars must be loaded in the terminal session before starting the dev server — not just before running the smoke script.
- **This does not enable production UI live quotes.** Production UI continues to use fixture data only.
- **This does not enable public live API access.** The triple opt-in gate and runtime gate remain in place.
- **This does not validate US quotes.** US positions remain gated with `UNSUPPORTED_SOURCE`.
- **This does not validate real FX.** `baseCurrency=USD` remains gated.

---

## 5. Safety Review

| Category | Shared? |
|----------|---------|
| Full response body | No |
| Actual prices | No |
| `currentPrice`, `marketValue`, `costBasis`, `unrealizedPnl`, `totalMarketValue`, `totalCostBasis` | No |
| Raw KIS payload | No |
| `providerMeta` | No |
| Tokens or secrets | No |
| Account numbers | No |
| Stack traces | No |
| Request URLs | No — logs use `target=local-api` label only |

Only sanitized `phase3dp step=... sanitized=true` lines were shared by the owner.

---

## 6. Remaining Limitations

- No production UI live quote wiring — UI continues to use fixture data.
- No production deployment performed.
- No US quote support implemented.
- No real FX provider implemented.
- No public live API access — requires full triple opt-in owner gate.
- Local owner-only smoke only — not a production-scale load test.

---

## 7. Validation Results

| Command | Result |
|---------|--------|
| `npm run check:portfolio-live-preview-owner-smoke-closeout` | PASS — see checker run |
| `npm run check:portfolio-live-preview-owner-smoke` | PASS |
| `npm run check:portfolio-live-preview-api` | PASS |
| `npm run check:portfolio-valuation-api` | PASS |
| `npm run check:phase-3do-closeout` | PASS |
| `npm run check:kis-quote-fetch-diagnostics` | PASS |
| `npm run check:kr-quote-preview-plan` | PASS |
| `npm run check:kis-single-quote-preview` | PASS |
| `npm run check:kis-fx-mocked-adapter` | PASS |
| `npm run check:kis-fx-preview-smoke-plan` | PASS |
| `npm run check:kis-valuation-design` | PASS |
| `npm run check:kis-quote-adapter-mocked` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |

---

## 8. Recommended Next Phase

**Phase 3DQ — UI Preview Mode Wiring Plan**

The portfolio live preview API contract is validated end-to-end. Plan how the portfolio UI can optionally display live valuation data in owner/developer mode only.

Design considerations:
- Use freshness labels: `조회 시점 기준` (fresh), `최근 조회 기준` (stale-but-usable), `데이터 일시 불가` (unavailable), `연동 실패` (connection failure)
- No public live data exposure
- Scope to owner mode only — production users continue to see fixture data
- Handle `unavailableRows > 0` gracefully in the UI (partial data states)
