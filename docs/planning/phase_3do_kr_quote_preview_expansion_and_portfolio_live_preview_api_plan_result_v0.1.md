# Phase 3DO — KR Quote Preview Expansion and Portfolio Live Preview API Plan: Result

## 1. Metadata

| Field | Value |
|-------|-------|
| Phase | 3DO |
| Type | KR Quote Preview Expansion and Portfolio Live Preview API Plan |
| Status | **Prepared — owner KR expansion execution pending** |
| Latest prior commit | `df42fe1` (docs: record owner kis single quote pass) |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Runtime UI changes | None |
| API route changes | None |
| DB / Supabase schema changes | None |
| Live KIS calls by Claude Code | None |
| Live KIS calls by owner | Pending |
| Live FX calls | None |
| Live GNews calls | None |
| AI provider calls | None |
| External data fetch by Claude Code | None |
| Vercel production deployment | Not performed |

---

## 2. Purpose

Phase 3DN confirmed that `005930` (KR domestic stock) can be retrieved, sanitized, normalized, and cached via a live owner-only smoke using the existing `scripts/owner_smoke_kis_quote_live.mjs` script.

Phase 3DO expands coverage from one KR stock to a small but representative controlled set:

| Symbol | Market | Type | Expected currency | Purpose |
|--------|--------|------|------------------|---------|
| `005930` | KR | stock | KRW | Regression check — already passed in Phase 3DN |
| `000660` | KR | stock | KRW | Second KR large-cap stock validation |
| `069500` | KR | ETF | KRW | KR ETF validation through KIS domestic endpoint |

In addition to expanding the live smoke coverage, Phase 3DO creates a concrete design plan for a later Portfolio Live Preview API activation (`source=live` preview gate). This plan is documentation only — no API behavior changes are made in this phase.

---

## 3. Phase 3DN Baseline

Phase 3DN (commit `df42fe1`) established:

- The existing `scripts/owner_smoke_kis_quote_live.mjs` correctly reads `PHASE_3Y_SMOKE_MARKET` and `PHASE_3Y_SMOKE_SYMBOL` from the environment (lines 262–263 of the script).
- Any 6-digit numeric string passes `validateKrIdentity` — both `000660` (6-digit) and `069500` (6-digit) are structurally expected to work with the KIS domestic endpoint.
- The `forbiddenOutputPattern` sanitizer operates consistently regardless of symbol.
- All five live guard variables must be set with exact values for live mode.
- `KIS_ACCOUNT_NO` must be absent.
- Phase 3DN found one setup gap: missing `PHASE_3Y_SMOKE_MARKET` / `PHASE_3Y_SMOKE_SYMBOL` — this phase explicitly documents both for all three symbols.

Current API policy unchanged from Phase 3DN:

- `source=fixture` is the only accepted source.
- `source=live` returns 400 `UNSUPPORTED_SOURCE`.
- `source=auto` is deferred.
- Production UI does not use live quotes.

---

## 4. KR Quote Expansion Target Set

| Symbol | Market | Type | Expected currency | Status |
|--------|--------|------|------------------|--------|
| `005930` | `KR` | stock | `KRW` | Regression — previously PASS in Phase 3DN |
| `000660` | `KR` | stock | `KRW` | Pending owner execution |
| `069500` | `KR` | ETF | `KRW` | Pending owner execution |

**Note on KR ETF (`069500`):** KR ETFs trade on the KSE domestic market and use 6-digit codes. The KIS domestic quote endpoint (`getKisQuoteSnapshot`) does not distinguish stocks from ETFs by symbol format — both use 6-digit domestic codes. Structural support exists, but live ETF retrieval has not been owner-confirmed before this phase.

---

## 5. Owner Execution Runbook

The existing `scripts/owner_smoke_kis_quote_live.mjs` already supports per-symbol override via `PHASE_3Y_SMOKE_MARKET` and `PHASE_3Y_SMOKE_SYMBOL`. No script changes are needed.

### Required Environment (names only — never share values)

**KIS credentials (must be present, names only):**
| Variable | Purpose |
|----------|---------|
| `KIS_APP_KEY` | KIS developer app key |
| `KIS_APP_SECRET` | KIS developer app secret |
| `KIS_BASE_URL` | KIS API base URL |
| `KIS_ENABLE_LIVE_QUOTES` | Must be exact string `true` |

**Scope enforcement:**
| Variable | Required state |
|----------|--------------|
| `KIS_ACCOUNT_NO` | Must be ABSENT — script blocks if set |

**Live guard variables:**
| Variable | Required value |
|----------|--------------|
| `PHASE_3Y_LIVE_KIS_SMOKE` | `OWNER_APPROVED` |
| `PHASE_3Y_RUNTIME_CONFIRMED` | `local-non-production-confirmed` |
| `PHASE_3Y_READ_ONLY_SCOPE_CONFIRMED` | `OWNER_CONFIRMS_READ_ONLY_QUOTE_ONLY` |
| `PHASE_3Y_PROVIDER_QUOTA_RISK_ACCEPTED` | `OWNER_ACCEPTS_KIS_QUOTA_RISK` |
| `PHASE_3Y_NO_ACCOUNT_APIS_CONFIRMED` | `OWNER_CONFIRMS_NO_ACCOUNT_APIS` |

**Smoke identity variables (set per run):**
| Variable | Value for each run |
|----------|-------------------|
| `PHASE_3Y_SMOKE_MARKET` | `KR` (all three runs) |
| `PHASE_3Y_SMOKE_SYMBOL` | `005930` / `000660` / `069500` (one per run) |

### Run Sequence (PowerShell)

Run each of the following from your local terminal. Set `PHASE_3Y_SMOKE_SYMBOL` to the target symbol before each run.

**Run 1 — `005930` (regression):**
```powershell
$env:PHASE_3Y_SMOKE_MARKET = "KR"
$env:PHASE_3Y_SMOKE_SYMBOL = "005930"
npm run smoke:kis-quote-live:dry
```

**Run 2 — `000660`:**
```powershell
$env:PHASE_3Y_SMOKE_MARKET = "KR"
$env:PHASE_3Y_SMOKE_SYMBOL = "000660"
npm run smoke:kis-quote-live:dry
```

**Run 3 — `069500` (KR ETF):**
```powershell
$env:PHASE_3Y_SMOKE_MARKET = "KR"
$env:PHASE_3Y_SMOKE_SYMBOL = "069500"
npm run smoke:kis-quote-live:dry
```

Between runs, a brief pause (15–30 seconds) is recommended to stay within KIS quota.

### Expected Outcome Per Symbol

All three symbols are expected to pass. All are 6-digit KR domestic codes. If a symbol fails at `quote-fetch` with `PROVIDER_UNAVAILABLE` or `PROVIDER_RATE_LIMITED`, wait 60+ seconds and retry once. If it still fails, report the error category code only — do not share raw error messages.

---

## 6. Owner Results

Owner has not yet executed the KR expansion smoke. Results will be recorded after the owner provides sanitized output using the report template at `docs/planning/phase_3do_owner_kr_quote_expansion_report_template_v0.1.md`.

| Symbol | Status |
|--------|--------|
| `005930` | Pending |
| `000660` | Pending |
| `069500` | Pending |

---

## 7. Sanitization Policy

Owner may share only sanitized `step=... status=... sanitized=true` labeled lines.

Do NOT paste API key values, secrets, tokens, or account numbers — only safe labeled step output is acceptable.

Owner must never share:
- `KIS_APP_KEY` value
- `KIS_APP_SECRET` value
- `KIS_BASE_URL` value
- Any access token or bearer token
- Any authorization header
- Any raw KIS JSON response
- Any field starting with `stck_`, `prdy_`, `rt_cd`, `acml_`, `appkey`, `appsecret`
- `KIS_ACCOUNT_NO` value
- Supabase URL or service role key
- Stack traces or raw error objects

Owner may share:
- Command name: `npm run smoke:kis-quote-live:dry`
- Symbol and market
- PASS / FAIL
- `step=... status=... sanitized=true` lines
- `staleState` value
- `pricePresent=true/false`
- Error category code only (e.g. `PROVIDER_UNAVAILABLE`), if failed
- `rawPayloadShared: no`
- `secretsShared: no`

---

## 8. Portfolio Live Preview API Plan

See the companion document `docs/planning/phase_3do_portfolio_live_preview_api_plan_v0.1.md` for the full design.

Summary:

- `source=fixture` remains the default and the only currently supported source.
- `source=live` will be enabled in a future phase behind an explicit preview gate requiring both `source: "live"` and `previewMode: "owner"` in the request body.
- Normal `source=live` without the preview gate will continue to return 400 `UNSUPPORTED_SOURCE`.
- KR-only scope for initial live preview activation.
- US positions → explicit `SYMBOL_UNSUPPORTED` row.
- Mixed-currency totals without real FX → `totalMarketValue=null`.
- No fixture fallback on live provider failure.
- No `providerMeta` exposed to client.
- `source=auto` remains deferred to a later phase.

---

## 9. Source Policy

| Source value | Current behavior |
|-------------|-----------------|
| `source=fixture` | Supported — default and only accepted value |
| `source=live` | Returns 400 `UNSUPPORTED_SOURCE` |
| `source=auto` | Deferred — not implemented |
| `source=live` + `previewMode=owner` | Future — planned in Phase 3DP or later |

Production UI does not call the live valuation path. Fixture/static data only.

---

## 10. UI Freshness Label Plan

The following Korean UI labels are planned for future freshness states when live data is eventually displayed. No UI changes are made in this phase.

| Freshness state | Planned Korean label |
|----------------|---------------------|
| `fresh` | `조회 시점 기준` |
| `stale-but-usable` | `최근 조회 기준` |
| `unavailable` | `데이터 일시 불가` |
| Provider error / connection failure | `연동 실패` |
| Partial quote missing | `일부 종목 조회 불가` |
| Potential delay | `데이터 제공 지연 가능` |

Avoid using:
- `실시간` (real-time)
- `자동 최신화`
- `현재 실시간 시세`
- `투자 추천`
- `매수`
- `매도`

---

## 11. Known Limitations

- KR ETF (`069500`) live smoke has not been executed yet in this phase.
- `000660` live smoke has not been executed yet in this phase.
- US quote endpoint is not implemented — US positions remain `SYMBOL_UNSUPPORTED`.
- Real FX provider is not implemented — mixed-currency portfolio total remains `null` unless mocked adapter is used (not in live API path).
- `POST /api/portfolio/valuation` source=fixture remains the default — the API still returns 400 for any other source value.
- Portfolio `source=live` is still disabled (`source=live` returns 400 `UNSUPPORTED_SOURCE`).
- Production UI remains fixture/static for all users.
- `source=auto` remains deferred.

---

## 12. Preflight Validation Results

| Command | Result |
|---------|--------|
| `npm run check:kis-single-quote-preview` | 61/61 PASS |
| `npm run check:kis-fx-mocked-adapter` | 119/119 PASS |
| `npm run check:kis-fx-preview-smoke-plan` | 52/52 PASS |
| `npm run check:kis-valuation-design` | 73/73 PASS |
| `npm run check:kis-quote-adapter-mocked` | 101/101 PASS |
| `npm run check:kr-quote-preview-plan` | PASS (see checker run) |
| `npm run build` | PASS |
| `git diff --check` | PASS |

---

## 13. Recommended Next Phase

**If owner KR expansion result is not yet provided:**

Phase 3DO-CLOSEOUT — Record KR Quote Expansion Results

- Owner runs three symbols, shares only sanitized step output
- Update result doc with per-symbol PASS/FAIL table

**If all three symbols PASS:**

Phase 3DP — Portfolio Live Preview API Contract Implementation

- Add `source=live` + `previewMode=owner` preview gate to `POST /api/portfolio/valuation`
- Implement KR-only live quote resolution via existing `getQuoteSnapshot` orchestration
- Return explicit stale/unavailable states
- No fixture fallback
- No `providerMeta` to client

**If one or more symbols fail (owner environment issue):**

Phase 3DO-Retry — Owner KR Quote Expansion Retry

- Owner re-checks `PHASE_3Y_SMOKE_MARKET`, `PHASE_3Y_SMOKE_SYMBOL`, credentials, guard values
- No code changes required

**If failure suggests KIS script issue:**

Phase 3DO-HF1 — KR Quote Smoke Script Expansion Fix

- Inspect `scripts/owner_smoke_kis_quote_live.mjs` for the issue
- Fix and re-verify with owner
