# Phase 3DP-OWNER-SMOKE — Owner Portfolio Live Preview API Smoke: Result

## 1. Metadata

| Field | Value |
|-------|-------|
| Phase | 3DP-OWNER-SMOKE |
| Type | Owner Portfolio Live Preview API Smoke |
| Status | **Prepared — owner API smoke execution pending** |
| Latest prior commit | `c7859a5` (feat: add portfolio live preview api contract) |
| Canonical production URL | `https://mkstocklab.vercel.app` |
| Runtime UI changes | None |
| API route changes | None in this phase |
| DB / Supabase schema changes | None |
| Live KIS calls by Claude Code | None |
| Live KIS calls by owner | Pending |
| Local API smoke by owner | Pending |
| Live FX calls | None |
| Live GNews calls | None |
| AI provider calls | None |
| External data fetch by Claude Code | None |
| Vercel production deployment | Not performed |

---

## 2. Purpose

Phase 3DP implemented the guarded live preview branch for `POST /api/portfolio/valuation`. The owner API live preview smoke was confirmed pending at Phase 3DP completion.

This phase prepares a safe, owner-run local API smoke script and documents the manual runbook so the owner can test the live preview API contract locally without sharing sensitive data.

Claude Code did not run the live API smoke. The owner must run it manually after reviewing this document.

---

## 3. Phase 3DP Baseline

Phase 3DP implemented:

- `POST /api/portfolio/valuation` — guarded live preview branch added
- Triple opt-in gate: `source: "live"` + `previewMode: "owner"` + `allowLiveQuotes: true`
- Additional gates: non-production runtime, `KIS_ACCOUNT_NO` absent, `baseCurrency=KRW`, max 10 positions, KR-only
- Quote resolution: `getQuoteSnapshot()` — existing orchestration with in-memory cache, stale fallback, provider errors
- No fixture fallback on live failure
- `providerMeta` never exposed

Owner API live preview smoke was pending at Phase 3DP completion. This phase provides the tooling for that smoke.

---

## 4. Owner Smoke Script

### Script Path

```
scripts/owner_smoke_portfolio_live_preview_api.mjs
```

### Package Command

```
npm run smoke:portfolio-live-preview-api:owner
```

### Guard Variables

The script requires all five guard variables to enter live API mode. If any is missing or incorrect, the script runs a safe dry-run validation only — no API call is made.

| Variable | Required Value |
|----------|---------------|
| `PHASE_3DP_OWNER_API_SMOKE` | `OWNER_APPROVED` |
| `PHASE_3DP_RUNTIME_CONFIRMED` | `local-non-production-confirmed` |
| `PHASE_3DP_READ_ONLY_SCOPE_CONFIRMED` | `OWNER_CONFIRMS_READ_ONLY_PORTFOLIO_PREVIEW` |
| `PHASE_3DP_PROVIDER_QUOTA_RISK_ACCEPTED` | `OWNER_ACCEPTS_KIS_QUOTA_RISK` |
| `PHASE_3DP_NO_ACCOUNT_APIS_CONFIRMED` | `OWNER_CONFIRMS_NO_ACCOUNT_APIS` |

### Local-Only API Target

The script calls only local API endpoints. Before making any fetch call, it validates:

- `NODE_ENV` is not `production`
- `VERCEL_ENV` is not `production`
- `KIS_ACCOUNT_NO` is absent
- API base URL is one of: `http://127.0.0.1:4321` or `http://localhost:4321`

Non-local URL overrides are rejected with `NON_LOCAL_API_URL_REJECTED` before any network call.

The actual URL is never printed in logs. Logs use the label `target=local-api`.

Owner may override the API base with:

```
PHASE_3DP_OWNER_API_BASE_URL=http://localhost:4321
```

### Request Shape

The script uses a fixed safe sample body only. No real portfolio data, no account numbers, no credentials.

| Field | Value |
|-------|-------|
| `source` | `"live"` |
| `previewMode` | `"owner"` |
| `allowLiveQuotes` | `true` |
| `baseCurrency` | `"KRW"` |
| Symbols | `005930`, `000660`, `069500` |
| `buyPrice` | `1` (placeholder) |
| `quantity` | `1` (placeholder) |

### Safe Output Policy

The script emits only `phase3dp step=... status=... sanitized=true` lines. It never prints:

- Current prices or market values
- Cost basis, unrealized P/L, or total portfolio values
- Full response body or raw JSON
- `providerMeta` or any KIS provider field
- API keys, tokens, account numbers, or secrets
- Request URLs
- Stack traces

A sanitizer (`forbiddenOutputPattern`) blocks any output line containing sensitive patterns. Blocked lines emit `SAFE_OUTPUT_BLOCKED` and the script exits with a non-zero code.

---

## 5. Owner Manual Runbook

### Prerequisites

- Local dev server not yet running — start it first.
- KIS environment variables set locally (names only — do not share values):
  - `KIS_APP_KEY`
  - `KIS_APP_SECRET`
  - `KIS_BASE_URL`
  - `KIS_ENABLE_LIVE_QUOTES=true`
- `KIS_ACCOUNT_NO` must be **absent** (not set or empty).
- `NODE_ENV` must not be `production`.
- `VERCEL_ENV` must not be `production`.

### Step 1 — Start Local Dev Server (Terminal 1)

```powershell
npm run dev
```

Wait for the server to report ready on port 4321.

### Step 2 — Set Guard Variables (Terminal 2)

```powershell
$env:PHASE_3DP_OWNER_API_SMOKE = "OWNER_APPROVED"
$env:PHASE_3DP_RUNTIME_CONFIRMED = "local-non-production-confirmed"
$env:PHASE_3DP_READ_ONLY_SCOPE_CONFIRMED = "OWNER_CONFIRMS_READ_ONLY_PORTFOLIO_PREVIEW"
$env:PHASE_3DP_PROVIDER_QUOTA_RISK_ACCEPTED = "OWNER_ACCEPTS_KIS_QUOTA_RISK"
$env:PHASE_3DP_NO_ACCOUNT_APIS_CONFIRMED = "OWNER_CONFIRMS_NO_ACCOUNT_APIS"
```

### Step 3 — Run Owner Smoke

```powershell
npm run smoke:portfolio-live-preview-api:owner
```

### Step 4 — Share Only Safe Lines

Copy only the `phase3dp step=... sanitized=true` lines from the output. Do not share:

- Raw response bodies
- Actual price values
- Request headers or full URLs
- Any line not matching the `phase3dp step=... sanitized=true` format

---

## 6. Safe Report Template

After running the owner smoke, fill in the following fields only:

```
Phase 3DP-OWNER-SMOKE Owner Report

HTTP status:          [ ]
ok:                   [ ]
source:               [ ]
previewMode:          [ ]
quoteSource:          [ ]
liveAttempted:        [ ]
providerStored:       [ ]
staleState:           [ ]
rowCount:             [ ]
missingQuoteCount:    [ ]
unsupportedCount:     [ ]
unavailableRows:      [ ]
final-result status:  [ ]
```

Do not share:
- `currentPrice`, `marketValue`, `costBasis`, `unrealizedPnl`, `totalMarketValue`, `totalCostBasis`
- Full response JSON
- Provider-specific field names
- Stack traces

---

## 7. Sanitization Policy

The smoke script's `forbiddenOutputPattern` blocks output lines containing:

`KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_ACCOUNT_NO`, `access_token`, `appkey`, `appsecret`, `authorization`, `Bearer`, `stck_`, `prdy_`, `rt_cd`, `acml_`, `providerMeta`, `currentPrice`, `marketValue`, `costBasis`, `unrealizedPnl`, `totalMarketValue`, `totalCostBasis`, `portfolioId`, `raw` (standalone), `stack`, `password`, `SUPABASE_SERVICE_ROLE_KEY`

When a blocked pattern is detected, the script emits:

```
phase3dp step=safe-output-guard status=blocked code=SAFE_OUTPUT_BLOCKED sanitized=true
```

Then exits with non-zero code.

---

## 8. Validation Results

| Command | Result |
|---------|--------|
| `npm run check:portfolio-live-preview-owner-smoke` | PASS — see checker run |
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

Owner API smoke: Pending.

---

## 9. Known Limitations

- Owner API smoke not yet executed — results are pending.
- No production deployment was performed in this phase.
- Production UI does not use live quotes.
- No US quote support — US positions return 400 `UNSUPPORTED_SOURCE`.
- No real FX provider — `baseCurrency=USD` is gated.
- No public live API access — requires full triple opt-in gate.
- No raw response sharing — safe summary lines only.
- `providerMeta` is never exposed to API clients.

---

## 10. Recommended Next Phase

**If owner smoke PASS:**

> Phase 3DP-OWNER-SMOKE-CLOSEOUT — Record Owner Portfolio Live Preview API Smoke PASS

Record the safe summary lines from the owner smoke. Update this result doc status to `Completed`. Then proceed to Phase 3DQ — UI Preview Mode Wiring Plan.

**If owner smoke returns a safe API error (e.g., gate failure or provider unavailable):**

> Phase 3DP-HF1 — Portfolio Live Preview API Smoke Failure Fix

Diagnose using the safe `code=` field from the failed step. Fix the gate or provider path. Do not share raw error messages.

**If owner smoke fails because the local dev server is not running:**

> Phase 3DP-Retry — Owner Local API Smoke Retry

Ensure the dev server is running on port 4321 (`npm run dev`), then retry the smoke.
