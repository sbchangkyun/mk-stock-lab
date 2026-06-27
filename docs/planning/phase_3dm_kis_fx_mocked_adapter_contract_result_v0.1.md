# Phase 3DM — KIS + FX Mocked Adapter Contract Hardening: Result

## 1. Metadata

| Field | Value |
|-------|-------|
| Phase | 3DM |
| Type | KIS + FX Mocked Adapter Contract Hardening |
| Status | Implemented, awaiting owner review |
| Latest prior commit | `777ddce` (docs: add kis fx preview smoke plan) |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Runtime UI changes | None |
| API route changes | None (conservative policy — source=live still returns 400) |
| DB / Supabase schema changes | None |
| Live KIS calls | None |
| Live FX calls | None |
| Live GNews calls | None |
| AI provider calls | None |
| External data fetch by Claude Code | None |
| Vercel production deployment | Not performed |

---

## 2. Purpose

Phase 3DL prepared the smoke plan and documented the existing KIS + quote/cache/valuation scaffolding.

Phase 3DM hardens the no-network mocked contracts so the future owner-run live KIS smoke has a verified behavioral foundation before any real credentials are used.

The specific goals were:
1. Add an FX mocked adapter contract (`getMockedFxRate`, `convertCurrencyMocked`).
2. Harden KIS validation and readiness guard coverage through mocked behavioral tests.
3. Verify all quote cache state transitions (fresh → stale-but-usable → expired) with synthetic timestamps.
4. Add a FX-assisted portfolio valuation helper (`buildPortfolioValuationFromQuotesWithFx`) with full behavioral coverage.
5. Confirm the conservative API route policy is in place (source=live blocked, no route change).
6. All verified by a static + mocked checker (119 checks, 119/119 PASS).

No live calls occurred. No credentials were used. No deployment was performed.

---

## 3. Codebase Findings Reconfirmed

These findings from Phase 3DL were reconfirmed before coding:

| Component | Status |
|-----------|--------|
| KIS domestic (KR) adapter | Fully implemented — runtime guard, token cache, sanitized errors, hard production block |
| KIS US/overseas adapter | Not implemented — SYMBOL_UNSUPPORTED returned for non-KR market |
| In-memory quote cache | Implemented — fresh TTL 15s, stale TTL 120s, state machine complete |
| Supabase persistent cache | Implemented — opt-in via `QUOTE_CACHE_BACKEND=supabase` |
| Portfolio valuation (no FX) | Implemented — totalMarketValue=null for mixed-currency portfolios |
| FX adapter | Not implemented before this phase |
| Valuation API `source=live` | Returns 400 UNSUPPORTED_SOURCE — unchanged |

---

## 4. Implementation Summary

### 4.1 New: `src/lib/server/providers/fxMockAdapter.ts`

A pure no-network, no-env FX mock adapter for contract testing and future preview flow.

**Exports:**
- `FxRateSnapshot` — type for a single FX rate snapshot with `pair`, `baseCurrency`, `quoteCurrency`, `rate`, `asOf`, `source`, `staleState`, `provider`.
- `FxRateResult` — union type: `{ ok: true; data: FxRateSnapshot; staleState: 'sample' }` | error envelope.
- `getMockedFxRate(baseCurrency, quoteCurrency)` — returns fixed USD/KRW mocked rate.
- `convertCurrencyMocked(amount, fromCurrency, toCurrency)` — converts amount using mocked rate.

**Behavior:**
- USD/KRW: rate = 1350 (fixed, synthetic, not a real or current rate).
- KRW/USD: rate = 1/1350 (inverse).
- Same-currency (identity): rate = 1.
- Unsupported pair: `ok: false`, code `NOT_IMPLEMENTED`.
- `source: 'mocked'`, `staleState: 'sample'`, `provider: 'fx-mock'` on all success results.
- No fetch, no env reads, no Supabase. Calls `assertServerRuntime`.

**Safety:**
- Never labeled `실시간` (real-time). Must not be shown to users as live data.
- Rate constant is a compile-time literal — never read from env.

### 4.2 Modified: `src/lib/server/portfolioValuation.ts`

Added `buildPortfolioValuationFromQuotesWithFx()` — a pure server helper for cross-currency portfolio valuation with an optional mocked FX rate.

**Signature:**
```typescript
buildPortfolioValuationFromQuotesWithFx(input: {
  portfolioId: string;
  baseCurrency: 'KRW' | 'USD';
  positions: Array<PortfolioPositionInput & { id?: string }>;
  quotesBySymbol: Record<string, QuoteSnapshot | null>;
  fxRate?: { baseCurrency: 'KRW' | 'USD'; quoteCurrency: 'KRW' | 'USD'; rate: number; source: string } | null;
}): PortfolioValuationSummary
```

**Behavior:**
- If all positions share `baseCurrency`: identical to `buildPortfolioValuationFromQuotes` (no FX needed).
- If positions span multiple currencies AND `fxRate` provided: converts all `marketValue`s to `baseCurrency` using standard FX semantics:
  - `fxRate.baseCurrency/fxRate.quoteCurrency = fxRate.rate`
  - e.g., USD/KRW = 1350 → USD position × 1350 = KRW value
  - e.g., KRW position / 1350 = USD value (for USD-based portfolio)
- If mixed currencies and `fxRate` absent: `totalMarketValue = null` — never fabricated.
- If `fxRate.source === 'mocked'` and FX conversion was applied: `staleState` is capped at `stale-but-usable` (not `fresh`) to signal mocked data quality.
- No live calls, no env reads, no Supabase. Calls `assertServerRuntime`.
- `providerMeta` is never copied from quotes to valuation rows (unchanged contract).

**FxRateInput type (local to portfolioValuation.ts):**
```typescript
type FxRateInput = {
  baseCurrency: 'KRW' | 'USD';
  quoteCurrency: 'KRW' | 'USD';
  rate: number;
  source: string;
};
```
This is structurally compatible with `FxRateSnapshot` from `fxMockAdapter.ts`, so callers can pass `getMockedFxRate(...).data` directly.

### 4.3 New: `scripts/check_kis_fx_mocked_adapter_contract_static.mjs`

Static + mocked behavioral checker with 9 groups covering:
- File existence (9 checks)
- Safety boundary (8 checks)
- FX mock contract (14 checks)
- KIS mock contract (19 checks)
- Cache state transitions (16 checks)
- Portfolio valuation mocked-live (21 checks)
- API route policy (7 checks)
- Documentation (11 checks)
- Forbidden patterns (10 checks + network safety + output scan)

Total: 119 checks. All pass.

### 4.4 Updated: `package.json`

Added: `"check:kis-fx-mocked-adapter": "node scripts/check_kis_fx_mocked_adapter_contract_static.mjs"`

---

## 5. API Policy Decision: Conservative

**Chosen policy: Conservative** — `POST /api/portfolio/valuation` is unchanged.

`source=live` continues to return `400 UNSUPPORTED_SOURCE`:
```
"Only source=fixture is supported. Live quote sources are not enabled."
```

**Why conservative:**
- `buildPortfolioValuationFromQuotesWithFx` provides full behavioral coverage for the mocked live path without exposing any API endpoint change.
- The public API remains a single stable contract (`source=fixture`).
- No risk of accidentally exposing mocked data through the production API.
- The next phase can activate `source=live` with a focused, well-tested changeset once the owner confirms live KIS quote output via `smoke:kis-quote-live:dry`.

**What is NOT done in this phase:**
- No `source=live` activation in the API route.
- No `providerMode: "mocked"` or `previewMode: "mocked"` field in the route.
- No `source=auto`.
- No UI change to call a live or mocked-live source.

---

## 6. FX Mocked Contract

| Field | Value |
|-------|-------|
| Supported pairs | USD/KRW, KRW/USD, KRW/KRW (identity), USD/USD (identity) |
| USD/KRW rate | 1350 (fixed, synthetic — not a real rate) |
| KRW/USD rate | 1/1350 (derived) |
| Source label | `'mocked'` |
| staleState | `'sample'` |
| Provider | `'fx-mock'` |
| Live provider | None |
| Env reads | None |
| Fetch calls | None |
| Wording restriction | Never show as `실시간`, current, or real-time in UI |

**Conversion semantics:**

Rate = `baseCurrency/quoteCurrency`, e.g., USD/KRW = 1350 means 1 USD = 1350 KRW.

To convert:
- Amount in `baseCurrency` → `quoteCurrency`: multiply by rate.
- Amount in `quoteCurrency` → `baseCurrency`: divide by rate.

---

## 7. KIS Mocked Contract

| Scenario | Result |
|----------|--------|
| KR stock `005930` | Passes `validateKisDomesticQuoteInput`, proceeds to quote |
| KR ETF `069500` | Passes (6-digit code, KR market) |
| US market `AAPL` | `SYMBOL_UNSUPPORTED` immediately |
| Non-6-digit KR code `1234` | `VALIDATION_FAILED` |
| 6-char non-digit KR code `ABCDEF` | `VALIDATION_FAILED` |
| Empty symbol | `VALIDATION_FAILED` |
| `vercel-production` runtime | `production_not_allowed` |
| `node-production` runtime | `production_not_allowed` |
| `KIS_ACCOUNT_NO` present | `production_not_allowed` (quote-only scope enforced) |
| `vercel-preview` without guard | `preview_guard_required` |
| `KIS_ENABLE_LIVE_QUOTES` not `"true"` | `disabled` |
| Missing required env vars | `config_missing` |
| All conditions met (local, no account no, flag=true, all env) | `ready: true` |

All error envelopes have `ok: false`, typed `code`, and `staleState: 'unavailable'`. No raw KIS fields (`stck_prpr`, `prdy_vrss`, etc.) appear in any output.

---

## 8. Cache State Transition Coverage

Transitions verified with synthetic timestamps (no real time, no sleeping):

| Scenario | `nowMs` relative to `cachedAtMs` | Result |
|----------|----------------------------------|--------|
| No entry | — | `unavailable` |
| Within fresh TTL (`< 15s`) | `≤ freshUntilMs` | `fresh` |
| At fresh TTL boundary | `= freshUntilMs` | `fresh` |
| 1ms past fresh TTL | `freshUntilMs + 1` | `stale-but-usable` |
| Within stale TTL (15-120s) | `≤ staleUntilMs` | `stale-but-usable` |
| At stale TTL boundary | `= staleUntilMs` | `stale-but-usable` |
| 1ms past stale TTL | `staleUntilMs + 1` | `expired` |
| Past stale TTL + margin | `staleUntilMs + 60000` | `expired` |
| Stale entry + provider failure | (past fresh, within stale) | `stale-but-usable` fallback |
| Provider success after stale | new cache entry | `fresh`, new price reflected |

**No fixture fallback:** On provider failure + expired cache, the orchestration returns the provider error envelope. No fixture quotes are substituted silently.

---

## 9. Portfolio Valuation Mocked-Live Coverage

| Scenario | `totalMarketValue` | `staleState` |
|----------|--------------------|--------------|
| KR-only, all fresh | Computed in KRW | `fresh` |
| KR-only, one stale | Computed in KRW | `stale-but-usable` |
| Mixed KRW+USD with mocked FX (base=KRW) | Computed (USD × 1350 → KRW) | `stale-but-usable` (mocked) |
| Mixed KRW+USD without FX | `null` | `stale-but-usable` (partial) |
| US position with null quote (unsupported) | `null` (partial coverage) | `stale-but-usable` |
| No quotes at all | `null` | `unavailable` |

**KR-only numerical example:**
- Samsung `005930`: costBasis = 70000 × 10 = 700000, marketValue = 73000 × 10 = 730000
- SK Hynix `000660`: costBasis = 190000 × 5 = 950000, marketValue = 198000 × 5 = 990000
- KODEX 200 `069500`: costBasis = 33000 × 20 = 660000, marketValue = 34000 × 20 = 680000
- Total costBasis: 2,310,000 KRW | totalMarketValue: 2,400,000 KRW | totalUnrealizedPnl: 90,000 KRW

**Mixed KRW+USD example (baseCurrency=KRW, FX=USD/KRW=1350):**
- Samsung KR: marketValue = 730,000 KRW
- Synth US: marketValue = 160 × 3 = 480 USD → 480 × 1350 = 648,000 KRW
- totalMarketValue: 1,378,000 KRW

**Provider metadata safety:** `providerMeta` is never copied from `QuoteSnapshot` to `PortfolioValuationRow`. No raw KIS fields appear in any row JSON.

---

## 10. Validation Results

| Command | Result |
|---------|--------|
| `npm run check:kis-fx-mocked-adapter` | 119/119 PASS |
| `npm run check:kis-fx-preview-smoke-plan` | 52/52 PASS |
| `npm run check:kis-valuation-design` | 73/73 PASS |
| `npm run check:kis-quote-adapter-mocked` | 101/101 PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS (exit 0) |
| `git status --short` | Only expected untracked files |

---

## 11. Owner Review Checklist

- [ ] Confirm no live credentials were used (none required for this phase).
- [ ] Confirm no `.env` values were read (checker verified, no env reads in new code).
- [ ] Confirm no external provider was called (network blocked in checker, new code has no fetch).
- [ ] Confirm mocked USD/KRW rate exists in `fxMockAdapter.ts` (rate = 1350, source = 'mocked').
- [ ] Confirm KR stock/ETF mocked validation cases pass (005930, 069500 → no validation error).
- [ ] Confirm US unsupported behavior is explicit (AAPL → SYMBOL_UNSUPPORTED immediately).
- [ ] Confirm mixed-currency valuation requires FX (`totalMarketValue = null` without FX).
- [ ] Confirm mocked FX produces `staleState = 'stale-but-usable'` (not `'fresh'`).
- [ ] Confirm no fixture fallback on mocked-live failure (no `resolveFixtureQuotes` in new FX path).
- [ ] Confirm API route is unchanged (`source=live` still returns 400 UNSUPPORTED_SOURCE).
- [ ] Confirm conservative policy is acceptable for current stage.

---

## 12. Known Limitations

- **Real FX provider not selected.** USD/KRW rate in `fxMockAdapter.ts` is a fixed synthetic constant (1350), not a live or daily rate. Users must not see this rate labeled as current.
- **Real US KIS quote endpoint not implemented.** US stocks/ETFs remain `SYMBOL_UNSUPPORTED`. `buildPortfolioValuationFromQuotesWithFx` can accept a US mocked quote if one is provided externally, but the KIS adapter cannot produce one.
- **Owner-run KIS smoke not yet executed.** `smoke:kis-quote-live:dry` requires real credentials and guard env vars. This phase prepared the mocked foundation; the owner must run the live smoke separately.
- **Production UI unchanged.** Portfolio page still calls `source=fixture` via the valuation API. No live data is shown to any user.
- **`source=auto` remains deferred.** No auto-selection between live/stale/fixture is implemented.
- **`source=live` not yet enabled in API.** Will require a focused Phase 3DN changeset after live smoke confirms KIS quote returns correctly formatted data.

---

## 13. Recommended Next Phase

**Phase 3DN — Owner-Run KIS Single Quote Preview**

Rationale: The mocked contract foundation is now complete. The owner can now:
1. Set guard env vars and KIS credentials locally.
2. Run `npm run smoke:kis-quote-live:dry` (existing script, owner-only).
3. Confirm a real `005930` KR stock quote returns `staleState=fresh` and `sanitized=true`.
4. Report the sanitized result (no raw values).

If the live smoke succeeds, Phase 3DN can activate `source=live` in `POST /api/portfolio/valuation` (with a new explicit guard env var or deploy-time flag), allowing the owner to preview real quote data in the portfolio UI without exposing it to other users.

**Alternative: Phase 3DN — Portfolio Live Preview API Activation (mocked-safe)** — if the owner prefers to activate the API route change before running a live smoke, using `buildPortfolioValuationFromQuotesWithFx` with the mocked adapter as a `providerMode: "mocked"` path behind an explicit request flag.
