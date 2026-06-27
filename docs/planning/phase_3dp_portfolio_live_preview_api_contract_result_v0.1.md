# Phase 3DP — Portfolio Live Preview API Contract: Result

## 1. Metadata

| Field | Value |
|-------|-------|
| Phase | 3DP |
| Type | Portfolio Live Preview API Contract Implementation |
| Status | **Implemented — owner API live preview smoke pending** |
| Latest prior commit | `7e5ed98` (docs: close out kr quote expansion results) |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Runtime UI changes | None |
| API route changes | Yes — guarded preview contract added to existing route |
| DB / Supabase schema changes | None |
| Live KIS calls by Claude Code | None |
| Live KIS calls by owner | Completed through local API smoke — PASS (Phase 3DP-OWNER-SMOKE-CLOSEOUT) |
| Live FX calls | None |
| Live GNews calls | None |
| AI provider calls | None |
| External data fetch by Claude Code | None |
| Vercel production deployment | Not performed |

---

## 2. Background

Phase 3DO-CLOSEOUT confirmed all three KR domestic quote expansion targets passed:

| Symbol | Market | Type | Final result |
|--------|--------|------|-------------|
| `005930` | `KR` | KR stock | PASS |
| `000660` | `KR` | KR stock | PASS |
| `069500` | `KR` | KR ETF | PASS after HF1 rerun |

The KIS domestic quote path is confirmed for owner-run use. Phase 3DP adds the guarded API contract that can later be owner-tested.

---

## 3. Implementation Summary

### Files Modified

| File | Change |
|------|--------|
| `src/pages/api/portfolio/valuation.ts` | Added live preview gate: triple opt-in, KR-only, max 10 positions, runtime guard |
| `src/lib/server/marketData/quotes.ts` | Added `isLivePreviewGateReady()` — runtime + account environment gate helper |

### What Changed

- Fixture path is preserved exactly. Behavior is unchanged for existing callers.
- Added live preview branch: activated only when all three gates are present in the request body.
- `isLivePreviewGateReady()` in `quotes.ts` checks `VERCEL_ENV`, `NODE_ENV`, and `KIS_ACCOUNT_NO` without exposing values — returns a safe boolean result only.
- Live quotes resolved via `getQuoteSnapshot()` (existing orchestration with in-memory cache, stale fallback, and provider error handling).
- `providerMeta` is never forwarded: `buildPortfolioValuationFromQuotes` uses only `price`, `staleState`, and `asOf` from each `QuoteSnapshot`.
- No UI changes. No Supabase changes. No DB migrations. No deployment.

---

## 4. API Contract

### 4.1 Fixture Request (Unchanged)

```json
{
  "portfolioId": "port-001",
  "baseCurrency": "KRW",
  "positions": [
    {
      "symbol": "005930",
      "market": "KR",
      "assetType": "stock",
      "buyPrice": 60000,
      "quantity": 10,
      "currency": "KRW"
    }
  ]
}
```

`source` omitted or `"fixture"`. No `previewMode`. No `allowLiveQuotes`.

### 4.2 Live Preview Request

```json
{
  "portfolioId": "port-001",
  "source": "live",
  "previewMode": "owner",
  "allowLiveQuotes": true,
  "baseCurrency": "KRW",
  "positions": [
    {
      "symbol": "005930",
      "market": "KR",
      "assetType": "stock",
      "buyPrice": 60000,
      "quantity": 10,
      "currency": "KRW"
    }
  ]
}
```

All three gates must be present. Max 10 positions. KR-only. baseCurrency must be `KRW`.

### 4.3 Live Preview Response Shape

```json
{
  "ok": true,
  "data": {
    "portfolioId": "port-001",
    "baseCurrency": "KRW",
    "source": "live",
    "previewMode": "owner",
    "valuation": {
      "scope": "single",
      "portfolioId": "port-001",
      "rows": [
        {
          "symbol": "005930",
          "market": "KR",
          "currentPrice": null,
          "marketValue": null,
          "costBasis": 600000,
          "unrealizedPnl": null,
          "staleState": "unavailable"
        }
      ],
      "totalCostBasis": 600000,
      "totalMarketValue": null,
      "totalUnrealizedPnl": null,
      "baseCurrency": "KRW",
      "staleState": "unavailable"
    },
    "meta": {
      "quoteSource": "live",
      "liveAttempted": true,
      "rawProviderStored": false,
      "generatedAt": "2026-06-27T...",
      "unsupportedSymbols": [],
      "missingQuoteSymbols": ["005930"]
    }
  }
}
```

Row `staleState` values: `fresh` | `stale-but-usable` | `unavailable`

When all quotes are available and fresh:
- `totalMarketValue` is computed
- `staleState` is `fresh`
- `missingQuoteSymbols` is `[]`

When a quote is unavailable:
- Row `currentPrice=null`, `marketValue=null`, `staleState="unavailable"`
- Symbol added to `missingQuoteSymbols`
- Summary `totalMarketValue=null`

When a quote is stale-but-usable:
- Row uses the stale cached price
- Row `staleState="stale-but-usable"`
- Summary `staleState` reflects the worst row state

### 4.4 Error Response Shape

```json
{
  "ok": false,
  "error": { "code": "LIVE_PREVIEW_GATE_FAILED", "message": "..." },
  "meta": { "liveAttempted": false, "rawProviderStored": false }
}
```

---

## 5. Source Policy

| Source value | Current behavior |
|-------------|-----------------|
| `source=fixture` (default) | Supported — returns fixture-backed valuation |
| `source` omitted | Treated as `source=fixture` |
| `source="live"` without full gate | 400 `UNSUPPORTED_SOURCE` — no provider call |
| `source="live"` + `previewMode="owner"` + `allowLiveQuotes=true` | Live preview — KR-only, max 10 positions, non-production only |
| `source="auto"` | 400 `UNSUPPORTED_SOURCE` — deferred, not implemented |

Production UI does not call the live valuation path. Fixture/static data only.

`source=fixture` remains the default and the only publicly accepted source.

---

## 6. Failure Semantics

| Case | Response |
|------|---------|
| `source="live"` without `previewMode="owner"` or `allowLiveQuotes=true` | 400 `UNSUPPORTED_SOURCE` |
| `source="auto"` | 400 `UNSUPPORTED_SOURCE` |
| Production runtime (`VERCEL_ENV=production` or `NODE_ENV=production`) | 400 `LIVE_PREVIEW_GATE_FAILED` |
| Unknown runtime (`VERCEL_ENV` set but not preview/development) | 400 `LIVE_PREVIEW_GATE_FAILED` |
| `KIS_ACCOUNT_NO` is present | 400 `LIVE_PREVIEW_GATE_FAILED` |
| `baseCurrency` not `KRW` | 400 `LIVE_PREVIEW_GATE_FAILED` |
| More than 10 positions | 400 `LIVE_PREVIEW_GATE_FAILED` |
| Any US position (`market="US"`) | 400 `UNSUPPORTED_SOURCE` |
| Invalid KR symbol (not 6-digit) | Handled by `getQuoteSnapshot` → `unavailable` row |
| Provider unavailable or rate limited | Quote becomes `null` → `unavailable` row; no fixture substitute |
| Provider stale-but-usable | Quote used with `staleState="stale-but-usable"` |

No fixture fallback on live quote failure. Unavailable rows remain unavailable.

No raw provider messages, stack traces, or field names in any error response.

---

## 7. Sanitization and Provider Leakage Review

| Category | Exposed in API response? |
|----------|------------------------|
| `providerMeta` | No — stripped by `buildPortfolioValuationFromQuotes` |
| Raw KIS JSON fields (`stck_prpr`, `rt_cd`, etc.) | No |
| KIS access token or bearer token | No |
| KIS app key or secret | No |
| Account number (`KIS_ACCOUNT_NO`) | No |
| Provider error messages | No — `unavailable` row or safe error code only |
| Stack traces | No |
| Request URLs or headers | No |
| Actual live price values (non-normalized) | No — only normalized `QuoteSnapshot.price` field |

`rawProviderStored: false` in all responses.

---

## 8. Validation Results

| Command | Result |
|---------|--------|
| `npm run check:portfolio-live-preview-api` | PASS (see checker run) |
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

## 9. Owner API Smoke Runbook

Owner should verify the live preview API contract after reviewing this implementation. The owner smoke is a separate phase (Phase 3DP-OWNER-SMOKE).

**What to test:**
- POST to `/api/portfolio/valuation` with `source: "live"`, `previewMode: "owner"`, `allowLiveQuotes: true`
- Symbols: `005930`, `000660`, `069500` (from Phase 3DO-CLOSEOUT confirmation)
- baseCurrency: `KRW`
- Run from local (non-production) environment with KIS credentials set

**Safety requirements:**
- Do NOT share raw response bodies
- Do NOT share actual price values from live quotes
- Do NOT share request URLs containing credentials
- Report only: HTTP status, `ok` field, `meta.quoteSource`, `meta.liveAttempted`, `meta.missingQuoteSymbols`, `staleState`
- Do NOT include `KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL`, or `KIS_ACCOUNT_NO` in any shared output

**Owner instructions:**
1. Ensure `KIS_ACCOUNT_NO` is NOT set
2. All KIS env vars and `KIS_ENABLE_LIVE_QUOTES=true` must be set (names only — do not share values)
3. Run from local non-production environment
4. Do not set `VERCEL_ENV=production`

Claude Code did not run live KIS. Owner must run the API smoke manually.

---

## 10. Known Limitations

- US quote support is not implemented — US positions return 400 `UNSUPPORTED_SOURCE`.
- Real FX provider is not implemented — `baseCurrency=USD` returns 400 `LIVE_PREVIEW_GATE_FAILED`.
- Mixed-currency `totalMarketValue` remains `null` in any future multi-currency scenario until real FX is implemented.
- `source=auto` is deferred — not implemented.
- Production UI does not use the live valuation path.
- No production deployment was performed.
- Live preview API is not publicly accessible — requires the full triple opt-in gate.
- `providerMeta` is never exposed to API clients.
- mocked FX adapter (`fxMockAdapter.ts`) is not used in the live API path.

---

## 11. Recommended Next Phase

**Phase 3DP-OWNER-SMOKE — Owner Portfolio Live Preview API Smoke**

Owner verifies the live preview API contract by calling POST `/api/portfolio/valuation` locally with:
- `source: "live"`, `previewMode: "owner"`, `allowLiveQuotes: true`
- `baseCurrency: "KRW"`
- One or more KR positions (`005930`, `000660`, `069500`)

After a successful owner smoke:

**Phase 3DQ — UI Preview Mode Wiring Plan**

- Plan how the portfolio UI can optionally display live valuation data
- Scope to owner/developer mode only
- Use freshness labels (`조회 시점 기준`, `최근 조회 기준`, `데이터 일시 불가`, `연동 실패`)
- No public live data exposure
