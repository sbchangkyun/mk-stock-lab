# Phase 3DO — Portfolio Live Preview API Plan

**Document type:** Design plan only. No implementation in this phase.

**Status:** Planned — pending KR quote expansion PASS and owner review before implementation phase begins.

---

## 1. Current API Policy

`POST /api/portfolio/valuation` current behavior:

| Source value | Response |
|-------------|---------|
| `source=fixture` (or absent) | 200 OK — fixture-backed valuation |
| `source=live` | 400 `UNSUPPORTED_SOURCE` — always rejected |
| Any other value | 400 `UNSUPPORTED_SOURCE` |

`source=fixture` is the current default and the only currently supported source. Fixture quotes only — no live KIS calls, no Supabase, no DB. `liveAttempted=false` always. `source=auto` remains deferred — it is not planned in Phase 3DP and will require a separate design decision.

This policy is unchanged in Phase 3DO. No API behavior changes are made here.

---

## 2. Future Activation Pattern

The recommended pattern for a later phase (Phase 3DP or later) is an explicit preview gate that requires two opt-in fields in the request body.

### 2.1 Request Shape (future)

```json
{
  "portfolioId": "...",
  "baseCurrency": "KRW",
  "source": "live",
  "previewMode": "owner",
  "allowLiveQuotes": true,
  "positions": [...]
}
```

Both `source: "live"` and `previewMode: "owner"` must be present together. Missing either one falls back to `UNSUPPORTED_SOURCE`.

Additional constraints:
- `allowLiveQuotes: true` must be explicit.
- Maximum 10 positions per live preview request (early preview limit).
- KR positions only — US positions rejected with explicit `SYMBOL_UNSUPPORTED` at validation time.

### 2.2 Server-Side Gate

The API route must check all of the following before calling any live provider:

1. `source === "live"` — explicit opt-in
2. `previewMode === "owner"` — explicit preview declaration
3. `allowLiveQuotes === true` — explicit acknowledgement
4. Server-side runtime class is not production (mirroring KIS `classifyRuntime()` guard)
5. No position with `market === "US"` — reject entire request if any US position is present
6. Position count ≤ 10

If any gate check fails, return 400 with a specific error code. Do not silently downgrade to fixture.

### 2.3 Response Shape (future)

```json
{
  "ok": true,
  "data": {
    "portfolioId": "...",
    "baseCurrency": "KRW",
    "source": "live",
    "previewMode": "owner",
    "valuation": {
      "rows": [...],
      "summary": {
        "totalCostBasis": ...,
        "totalMarketValue": ...,
        "totalUnrealizedPnl": ...,
        "totalUnrealizedPnlPct": ...,
        "staleState": "fresh | stale-but-usable | unavailable",
        "fxRequired": false
      }
    },
    "meta": {
      "quoteSource": "live",
      "liveAttempted": true,
      "rawProviderStored": false,
      "generatedAt": "...",
      "unsupportedSymbols": [],
      "missingQuoteSymbols": []
    }
  }
}
```

`providerMeta` is never exposed. Raw provider fields (`stck_prpr`, `rt_cd`, etc.) never appear in the response.

---

## 3. Live Quote Resolution Flow

When the preview gate passes, the live valuation route should:

1. **Validate request** — schema, required fields, position count, currency values.
2. **Validate preview gate** — `source`, `previewMode`, `allowLiveQuotes`, runtime class, market support.
3. **Reject unsupported markets before provider call** — any `market=US` position → return 400 `SYMBOL_UNSUPPORTED` immediately.
4. **Resolve KR quotes via existing `getQuoteSnapshot` orchestration** — pass `provider: getKisDomesticQuoteSnapshot` for each KR position.
5. **Apply cache policy** per the existing `getQuoteCacheState` state machine:
   - `fresh` → use cached quote
   - `stale-but-usable` → use cached quote, label row with `stale-but-usable`
   - `expired` / `unavailable` → call live provider; on failure, row becomes `unavailable`
6. **Build portfolio valuation rows** via existing `buildPortfolioValuationFromQuotes` or a KR-only variant.
7. **Compute totals** only if all required quotes are available and all positions share the same currency:
   - KR-only, all KRW → compute total
   - Mixed currency without real FX → `totalMarketValue=null`, `fxRequired=true`
8. **Return explicit stale/unavailable states** per row and in summary.
9. **Never silently fall back to fixture.** If a KR live quote fails and no usable cache exists, the row is `unavailable`, not substituted.
10. **Never expose raw provider payloads** in any response field.

---

## 4. Failure Policy

### 4.1 KIS Provider Failure

- If `getKisQuoteSnapshot` returns `ok: false`:
  - Check for stale cache: `stale-but-usable` → use it, label row
  - No usable cache: row `currentPrice=null`, `marketValue=null`, `staleState='unavailable'`
  - Summary `staleState` = `'stale-but-usable'` or `'unavailable'` depending on mix

### 4.2 Quote Unavailable

```json
{
  "symbol": "000660",
  "currentPrice": null,
  "marketValue": null,
  "staleState": "unavailable"
}
```

Summary `totalMarketValue=null` if any row is unavailable.

### 4.3 Unsupported US Symbol

Reject at validation, before any provider call:

```json
{
  "ok": false,
  "error": {
    "code": "SYMBOL_UNSUPPORTED",
    "message": "US market positions are not supported in live preview mode."
  }
}
```

### 4.4 FX Missing (Mixed Currency)

If all positions have quotes but currencies differ:
```json
{
  "summary": {
    "totalMarketValue": null,
    "fxRequired": true,
    "staleState": "unavailable"
  }
}
```

Do not use mocked FX rates in user-facing live API responses.

### 4.5 Live Failure — No Fixture Fallback

If a live quote fails:
- Do not silently substitute a fixture quote.
- Return `staleState='unavailable'` for the affected row.
- Return the overall result with partial data; caller may decide whether to show partial or reject.

---

## 5. Cache / Freshness Behavior

The existing `getQuoteCacheState` state machine applies:

| Cache state | Behavior |
|------------|---------|
| `fresh` (within 15s TTL) | Use cached quote immediately |
| `stale-but-usable` (within 120s TTL) | Use with label; avoid live call if provider quota is a concern |
| `expired` / `unavailable` | Must call live provider |

Both in-memory cache and Supabase persistent cache (if `QUOTE_CACHE_BACKEND=supabase`) are supported via the existing `getConfiguredQuoteCacheEntry()` path.

---

## 6. No providerMeta Exposure

`providerMeta` is stripped at the `buildPortfolioValuationFromQuotes` helper layer. It must never appear in:
- `PortfolioValuationRow` objects
- API response `data.valuation.rows`
- API response `data.meta`
- Any response body field

This invariant is already enforced in the existing implementation and must be preserved in the live preview path.

---

## 7. UI Freshness Label Plan

| API `staleState` | Planned Korean UI label |
|-----------------|------------------------|
| `fresh` | `조회 시점 기준` |
| `stale-but-usable` | `최근 조회 기준` |
| `unavailable` | `데이터 일시 불가` |
| Connection / provider failure | `연동 실패` |
| Partial quote unavailable | `일부 종목 조회 불가` |
| Potential delay note | `데이터 제공 지연 가능` |

Avoid UI wording:
- `실시간` — implies continuous real-time; KIS quote is point-in-time
- `현재 실시간 시세` — same concern
- `자동 최신화` — implies auto-refresh; not implemented
- `투자 추천`, `매수`, `매도` — regulated financial advice; never use

---

## 8. Risk Register

| Risk | Severity | Mitigation |
|------|---------|-----------|
| KIS quota exhaustion from repeated preview calls | Medium | 10-position limit; cache TTL 15s fresh / 120s stale; owner controls request frequency |
| Raw provider field leakage in error path | High | `providerMeta` stripped at helper layer; API error response never includes raw provider data |
| Account API accidentally called | High | `KIS_ACCOUNT_NO` must be absent; `checkAccountEnvAbsent()` enforced at runtime before any call |
| US position silently returning null instead of error | Medium | Reject US positions at validation, before provider call; return 400 `SYMBOL_UNSUPPORTED` |
| Mocked FX rate used in live API response | High | `buildPortfolioValuationFromQuotesWithFx` with mocked FX is permitted for contract testing only; live API path must not call it |
| Fixture fallback masking live failure | High | No fixture fallback; live failure = row unavailable, explicit in response |
| Production deployment before live path validated | High | Live preview gate requires `previewMode=owner`; production environment → runtime guard blocks KIS call regardless |
| KR ETF returning different field structure | Low | `getKisQuoteSnapshot` returns normalized fields; ETF uses same domestic endpoint; risk is low but ETF smoke is still required |

---

## 9. Suggested Implementation Phase Sequence

| Phase | Description | Gate |
|-------|-------------|------|
| 3DO-CLOSEOUT | Record KR quote expansion results (005930, 000660, 069500) | Owner runs all three symbols |
| 3DP | Portfolio Live Preview API contract implementation | All three symbols PASS + owner approves API design |
| 3DQ | Portfolio Live Preview API owner smoke | Owner runs POST with previewMode=owner and KR positions |
| 3DR | UI freshness labeling implementation | API smoke PASS |
| Later | US quote endpoint (separate provider, not KIS domestic) | Separate design phase |
| Later | Real FX provider integration | Separate provider decision |
| Later | `source=auto` activation | After live preview validated in production |

No phase should skip the owner validation step before UI or production enablement.
