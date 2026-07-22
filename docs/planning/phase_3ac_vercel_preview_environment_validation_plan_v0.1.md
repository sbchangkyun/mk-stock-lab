# Phase 3AC Vercel Preview Environment Validation Plan v0.1

## 1. Title And Phase Metadata

- **Phase**: 3AC
- **Type**: Planning-only — no execution in this document
- **Target**: Vercel Preview environment validation of `/api/market/quote` with live KIS backing
- **Current status**: Planned, not executed
- **Previous validated phase**: Phase 3AB — owner-run live Supabase persistent cache + live KIS quote validation (all steps passed, `supabaseReadbackConclusive=true`)
- **Execution model for future phase**: Owner-approved Vercel Preview only — no Claude Code execution
- **Production status**: Blocked — `isProductionRuntime()` guard in `kisClient.ts` permanently blocks KIS calls when `NODE_ENV=production` or `VERCEL_ENV=production`
- **Created**: 2026-06-22

---

## 2. Background

### Completed Local Validation Milestones

| Phase | What Was Validated | Environment |
|---|---|---|
| Phase 3Z | Local live KIS token fetch + domestic quote fetch + normalization to `QuoteSnapshot` | Local non-production |
| Phase 3AA | Local `/api/market/quote` HTTP endpoint response shape with live KIS backing (HTTP 200, `ok: true`, `data`/`fallback` objects, `Cache-Control: no-store`, no raw KIS fields) | Local non-production |
| Phase 3AB | Live KIS fetch → Supabase persistent cache write → in-memory flush → Supabase readback as `cache-fresh` (`supabaseReadbackConclusive=true`) | Local non-production |

### Remaining Gap

All validation to date has been in a local non-production shell. Two gaps remain:

1. **Vercel Preview runtime behavior is not yet validated.** The quote route, KIS provider, Supabase cache, and response shape have never been exercised in a deployed Vercel function context.
2. **Vercel Production behavior remains permanently blocked** by the `isProductionRuntime()` guard in `kisClient.ts` and requires a separate owner-approved gate decision before any production KIS enablement can occur.

---

## 3. Objective

Phase 3AC defines the future validation of the `/api/market/quote` route in a Vercel Preview deployment. When executed (with explicit owner approval), the validation should:

- Confirm the deployed Preview runtime can serve `/api/market/quote` and return the expected response shape.
- Confirm Preview-only KIS environment variable configuration can support live KIS quote reads — **if and only if the current production guard does not block Preview** (see Section 5 and Section 6 for the critical gate risk).
- Confirm the response is sanitized in Preview: `Cache-Control: no-store`, no raw KIS fields, no secrets, no tokens, no raw errors, no stack traces.
- Confirm price values are not recorded in sanitized evidence.
- Keep Production KIS permanently blocked.

Phase 3AC does not authorize any execution. It defines what a future owner-approved execution would look like.

---

## 4. Explicit Non-Goals

Phase 3AC does **not** include and must not be extended to include any of the following:

- Vercel Production deployment validation
- Vercel Production KIS enablement
- Any change to `isProductionRuntime()` in `kisClient.ts`
- Any Vercel Production environment variable mutation
- UI live quote wiring (Market, Portfolio, Chart AI, Home, Lab, or any browser UI)
- Account, order, trading, balance, holdings, or WebSocket APIs
- `KIS_ACCOUNT_NO` — must remain absent throughout
- KIS rate-limit stress testing or repeated-call load testing
- Production load or performance testing
- Supabase schema changes
- SQL execution
- Migration file modification
- Any code change to source files in `src/`

---

## 5. Current Production Guard Analysis

### Location

`isProductionRuntime()` is defined in `src/lib/server/providers/kisClient.ts` at lines 60–64:

```typescript
const isProductionRuntime = () => {
  const nodeEnv = normalizeString(process.env.NODE_ENV).toLowerCase();
  const vercelEnv = normalizeString(process.env.VERCEL_ENV).toLowerCase();
  return nodeEnv === 'production' || vercelEnv === 'production';
};
```

### Blocking Condition

`isProductionRuntime()` returns `true` when **either**:
- `NODE_ENV` is `'production'` (case-insensitive), **or**
- `VERCEL_ENV` is `'production'` (case-insensitive)

When `isProductionRuntime()` returns `true`, `getKisQuoteConfigReadiness()` immediately returns:

```
{ ready: false, reason: 'production_not_allowed', productionAllowed: false }
```

This causes `getKisQuoteSnapshot()` to return a fail-closed `CONFIG_MISSING` error before any KIS API call, regardless of whether `KIS_ENABLE_LIVE_QUOTES=true` is set and regardless of whether KIS credentials are present.

### Why Production Remains Blocked

The guard is a deliberate fail-closed safety constraint. Setting Vercel Production environment variables alone cannot enable production KIS calls. A separate, explicit owner-approved code-change phase is required to modify the guard. That phase is not in scope for Phase 3AC.

### Critical Preview Gate Risk: NODE_ENV in Vercel Preview

**Vercel sets `NODE_ENV=production` in all deployed runtimes, including Preview deployments.**

This means the OR condition in `isProductionRuntime()` — `nodeEnv === 'production'` — will be `true` in a Vercel Preview deployment even when `VERCEL_ENV=preview`.

**Consequence for Phase 3AC:** Under the current guard, live KIS calls are likely blocked in Vercel Preview because `NODE_ENV=production`. A Preview deployment with `VERCEL_ENV=preview` will still trigger the guard via the `NODE_ENV` branch.

This is the most important finding in this planning document. **Phase 3AC must not assume Preview live KIS will work.** Before any live Preview KIS test is attempted, the owner must:

1. Confirm actual `NODE_ENV` and `VERCEL_ENV` values in a deployed Preview function (this can be verified with a non-secret diagnostic endpoint or function log, without exposing KIS credentials).
2. Decide whether to accept the blocked result as a gate finding (`blocked_by_runtime_guard`), or request a separate guard-decision phase.

### Preview Planning Must Not Weaken the Guard

This planning document does not modify `kisClient.ts`. The guard is not changed. Any future guard change requires a separate owner-approved gate-decision phase.

---

## 6. Preview Environment Variable Plan

Variable **names** only. Values must never be recorded, printed, or inferred.

### Required KIS Names For A Future Approved Preview Test

| Name | Value requirement | Secret | Notes |
|---|---|---|---|
| `KIS_APP_KEY` | Non-empty | Yes | Owner sets privately in Vercel UI — Preview scope only |
| `KIS_APP_SECRET` | Non-empty | Yes | Owner sets privately in Vercel UI — Preview scope only |
| `KIS_BASE_URL` | Non-empty | No — internal infra | Owner sets privately — Preview scope only |
| `KIS_ENABLE_LIVE_QUOTES` | Exactly `true` | No | Feature flag — must be string `true` |

### Required Supabase Cache Names If Preview Cache Validation Is Included

| Name | Value requirement | Secret | Notes |
|---|---|---|---|
| `QUOTE_CACHE_BACKEND` | Exactly `supabase` | No | Set to `supabase` to enable persistent cache path |
| `PUBLIC_SUPABASE_URL` | Non-empty | No — but project-identifying | Owner sets privately — Preview scope only |
| `PUBLIC_SUPABASE_ANON_KEY` | Non-empty | No — public scoped key | Owner sets privately — Preview scope only |
| `SUPABASE_SERVICE_ROLE_KEY` | Non-empty | Yes | Owner sets privately — Preview scope only |

### Runtime Environment Expectations

| Variable | Expected value in Vercel Preview | Notes |
|---|---|---|
| `VERCEL_ENV` | `preview` | Set automatically by Vercel for Preview deployments |
| `NODE_ENV` | `production` | **Vercel sets this to `production` in all deployed runtimes, including Preview — this is the gate risk** |
| `KIS_ACCOUNT_NO` | Must be absent | Must not be set in Preview or any other environment |

### Gate Risk Summary

Because `NODE_ENV=production` in Vercel Preview, `isProductionRuntime()` returns `true` and **live KIS calls in Preview will be blocked by the current guard**. The `VERCEL_ENV=preview` condition alone is not sufficient to allow KIS calls. Both conditions must be `false` for `isProductionRuntime()` to return `false`. In Vercel Preview, the `NODE_ENV` branch alone will block KIS.

This must be treated as a gate finding, not a bug, until the owner decides on a guard policy change.

---

## 7. Preview Gate Decision Matrix

| | **Option A** | **Option B** | **Option C** | **Option D** |
|---|---|---|---|---|
| **Name** | Preview plan only, no Vercel changes | Owner configures Vercel Preview env only | Owner deploys Preview and performs endpoint test | Defer until guard policy decided |
| **Description** | Complete Phase 3AC planning document only. No Vercel UI changes, no deployment, no env mutation. Review the guard risk (Section 5/6) before deciding next step. | Owner manually adds KIS and/or Supabase env vars in Vercel UI scoped to Preview only. No deployment triggered in this option. Confirms env is in place for a future test. | Owner adds Preview env vars (as in Option B), triggers a Preview deployment (git push or Vercel UI), and sends a sanitized GET request to the Preview URL. Records sanitized evidence including whether the guard blocked the request. | Owner explicitly defers all Vercel Preview work until the `isProductionRuntime()` guard policy for Preview is decided. No Vercel changes at all. |
| **Benefit** | Zero risk. No secrets exposed, no deployment, no env mutation. Fully reversible. | Prepares the env without risking a premature test. Owner can inspect env names in Vercel UI without triggering live calls. | Produces real Preview validation evidence — either passes or records `blocked_by_runtime_guard` as a finding. | Avoids any guard ambiguity. If Preview is expected to be blocked by `NODE_ENV`, waiting for the guard decision avoids wasted effort. |
| **Risk** | No progress toward Vercel runtime validation. | If owner accidentally scopes env vars to Production, production secrets could be exposed. Requires careful scoping in Vercel UI. | Requires live KIS credentials in Vercel Preview. Guard likely blocks KIS due to `NODE_ENV=production`. Evidence may only confirm `blocked_by_runtime_guard` rather than a live quote. | Delays validation. If guard decision requires a planning cycle, Vercel Preview validation may be pushed significantly. |
| **Required approval** | None — planning only | Explicit owner approval for Vercel Preview env mutation | Explicit owner approval for Vercel Preview env mutation AND Vercel Preview deployment | None — deferred state requires no action |
| **Source code change required** | No | No | No — unless guard blocks Preview and owner decides to fix it | No |
| **Vercel env mutation required** | No | Yes | Yes | No |
| **Deployment required** | No | Not necessarily | Yes | No |

---

## 8. Recommended Path

The safest sequence given the current guard analysis (Section 5/6):

1. **Complete Phase 3AC planning** (this document). No execution.
2. **Investigate actual Vercel Preview runtime env without secrets.** Before adding any KIS credentials to Vercel, the owner can check actual `NODE_ENV` and `VERCEL_ENV` values in a Preview deployment using a non-secret diagnostic (e.g., a safe status endpoint or a Vercel function log that prints only non-sensitive env var names/presence — not values). This confirms whether `NODE_ENV=production` actually applies to this project's Preview deployments.
3. **If `NODE_ENV=production` in Preview (expected):** The current guard blocks live KIS in Preview. Do not add KIS credentials to Vercel Preview yet. Create a separate guard-decision phase to decide whether to modify `isProductionRuntime()` to allow `VERCEL_ENV=preview` (and only `preview`) while keeping `NODE_ENV=production` blocked. That phase requires a separate planning document and explicit owner approval before any code change.
4. **If by some platform configuration `NODE_ENV` is not `production` in Preview:** Proceed with Option C only after explicit owner approval for both Vercel Preview env mutation and deployment. No code change needed.
5. **In all cases, keep Production blocked.** `VERCEL_ENV=production` check in the guard is not affected by any Preview guard decision.

---

## 9. Future Owner-Run Preview Endpoint Validation Procedure

This procedure is defined for future owner execution only. Claude Code must not run any step.

**Prerequisite:** Owner has received explicit approval for Vercel Preview env mutation and deployment (Options B and C above). The guard investigation from Section 8 step 2 has been completed.

### Step 1 — Set Preview environment variables in Vercel UI

The owner opens the Vercel project dashboard and adds the required env vars from Section 6, scoped to **Preview only** (not Production, not Development). Values are entered privately and never pasted into chat, logs, or documentation. The owner confirms `KIS_ACCOUNT_NO` is absent.

### Step 2 — Confirm scope

Before deploying, the owner confirms in the Vercel UI that no env vars were accidentally scoped to Production.

### Step 3 — Trigger a Preview deployment

The owner deploys via a git push to the branch associated with this project or via the Vercel UI "Redeploy" button. The owner waits for the deployment to succeed.

### Step 4 — Send the HTTP request

In a private browser or local HTTP client, the owner sends:

```
GET https://<preview-url>/api/market/quote?market=KR&symbol=<REDACTED_6_DIGIT_KR_CODE>
```

The actual Preview URL and actual stock symbol are not recorded. The owner inspects only the structure of the response.

### Step 5 — Record only sanitized evidence

The owner fills in the evidence template from Section 11. No actual price, no raw KIS fields, no tokens, no secrets, no stack traces are recorded.

### Step 6 — Record guard finding if blocked

If the response is `{ ok: false, code: 'CONFIG_MISSING' }` or similar production-guard-blocked response, the owner records this as `runtime guard blocked request: yes` with `sanitized reason category: production_not_allowed`. This is a gate finding, not a test failure.

### Step 7 — Remove Preview env vars

After the test (whether passed, blocked, or failed), the owner removes or rotates the Preview-scoped KIS env vars from the Vercel UI. Production env was not changed.

---

## 10. Expected Preview Response Criteria

### Success Case (guard allows Preview)

| Criterion | Expected value |
|---|---|
| HTTP status | `200` |
| `Cache-Control` | Includes `no-store` |
| JSON parse | Succeeds |
| `ok` | `true` |
| `data` object | Present |
| `fallback` object | Present |
| `data.market` | Present |
| `data.symbol` | Present |
| `data.price` | Present (finite number — do not record value) |
| `data.currency` | Present |
| `data.asOf` | Present |
| `fallback.state` | Present |
| `fallback.reason` | Present (`'provider-fresh'` or `'cache-fresh'`) |
| Raw KIS fields absent (`stck_prpr`, `prdy_vrss`, `prdy_ctrt`, `acml_vol`, `rt_cd`, `output`) | Confirmed absent |
| Secrets/tokens/raw errors/stack traces | Absent |
| Actual price recorded in evidence | No |

### Blocked Case (guard blocks Preview due to `NODE_ENV=production`)

If `isProductionRuntime()` returns `true` in Preview:

| Criterion | Expected value |
|---|---|
| HTTP status | Non-200 (likely `500` or similar error shape) |
| `ok` | `false` |
| Error code | `CONFIG_MISSING` or `PROVIDER_UNAVAILABLE` |
| Raw KIS fields | Absent (guard fires before any KIS call) |
| Secrets/tokens | Absent |
| Record as | `runtime guard blocked request: yes`, `sanitized reason category: production_not_allowed` |
| Treat as | Gate finding — not a test failure; leads to a separate guard-decision phase |

The blocked case must use the same sanitized evidence template. No raw error messages, no internal error details, no stack traces are recorded. The finding is recorded as a boolean (`blocked: true`) plus a sanitized reason category.

---

## 11. Sanitized Owner Evidence Template

```text
Phase 3AC Vercel Preview Endpoint Validation Evidence

Date/time: <YYYY-MM-DD HH:MM local time>
Vercel environment: Preview
Production environment touched: no
Vercel env mutation approved: yes / no
Deployment approved: yes / no
KIS_ACCOUNT_NO absent: yes / no
KIS env vars present in Preview (boolean only): yes / no
Supabase env vars present in Preview (boolean only): yes / no
Request path only: /api/market/quote?market=KR&symbol=<REDACTED_6_DIGIT_KR_CODE>
HTTP status: <code>
JSON parse ok: yes / no
Cache-Control no-store: yes / no
ok true: yes / no
data object present: yes / no
fallback object present: yes / no
required normalized fields present (market, symbol, price, currency, asOf): yes / no
raw KIS fields absent (stck_prpr, prdy_vrss, prdy_ctrt, acml_vol, rt_cd, output): yes / no
secrets / tokens / raw errors absent: yes / no
runtime guard blocked request: yes / no / unknown
if blocked, sanitized reason category: <production_not_allowed / config_missing / unknown>
actual symbol exposed: no
price value exposed: no
secret / token / url exposed: no
result: passed / failed / blocked / inconclusive

Optional notes (no secrets, no symbol, no price values):
```

---

## 12. Rollback And Cleanup Plan

This procedure is defined for future owner execution after a Preview test (whether passed, blocked, or failed).

1. In the Vercel UI, remove or rotate the Preview-scoped `KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL`, and `KIS_ENABLE_LIVE_QUOTES` entries. Confirm they are removed from Preview scope only.
2. If `SUPABASE_SERVICE_ROLE_KEY` was added to Preview scope for cache validation, remove or rotate it.
3. Confirm in the Vercel UI that Production env variables were not changed during the test.
4. Confirm `KIS_ACCOUNT_NO` was never added at any scope.
5. Record cleanup status using boolean evidence only:
   - `preview-kis-env-removed: yes / no`
   - `preview-supabase-service-key-removed: yes / no`
   - `production-env-unchanged: yes / no`
   - `account-no-never-added: yes / no`
6. Do not paste env values into any documentation, chat, or log during cleanup.

---

## 13. Approval Boundary

- **This document does not authorize Vercel env mutation.** No Vercel environment variable may be added, changed, or removed based on this document alone.
- **This document does not authorize deployment.** No Preview or Production deployment may be triggered based on this document alone.
- **This document does not authorize Production KIS.** The `isProductionRuntime()` guard is not changed. Production KIS remains permanently blocked.
- **This document does not authorize code changes.** No source file in `src/` or any script may be changed based on this document alone.
- **This document does not authorize UI wiring.** No browser UI is connected to live quote data.
- **Future Vercel Preview execution (Options B or C from Section 7) requires explicit owner approval** separate from this planning document.
- **Any production guard change (modifying `isProductionRuntime()` to permit `VERCEL_ENV=preview`)** requires a separate gate-decision planning phase and explicit owner approval before any code change is made.

---

## 14. Result Of This Phase

Phase 3AC planning-only Vercel Preview environment validation plan is complete when this document is created and the changelog is updated. No execution is included in Phase 3AC.

The key output of this phase is the finding documented in Section 5 and Section 6: **the current `isProductionRuntime()` guard in `kisClient.ts` likely blocks live KIS calls in Vercel Preview because `NODE_ENV=production` is set by Vercel in all deployed runtimes, including Preview.** This is the critical gate risk that must be resolved before any live Preview KIS test is attempted.

---

## 15. Recommended Next Step

After reviewing this plan, the owner should choose one of:

**Option 1 — Request a separate guard-decision document:**
If the owner agrees that `NODE_ENV=production` in Vercel Preview will block the current guard, and if the owner wants to fix this by allowing `VERCEL_ENV=preview` to pass, create a separate guard-decision planning phase. That phase would define exactly how to modify `isProductionRuntime()` safely (e.g., require `VERCEL_ENV` to be exactly `'production'` rather than treating any `NODE_ENV=production` as blocked). This requires explicit owner approval before any code change.

**Option 2 — First investigate Vercel Preview runtime env without secrets:**
Before deciding on a guard change, the owner can confirm whether `NODE_ENV` is actually `production` in this project's Preview deployments using a non-secret diagnostic endpoint or Vercel function logs. This resolves the uncertainty without exposing KIS credentials.

**Option 3 — Defer Vercel Preview and plan KIS error/fallback validation instead:**
If the owner prefers not to handle guard changes now, proceed with a separate phase to validate KIS error paths (429 rate-limit, non-`0` `rt_cd`, missing price field, network failure) in local non-production before moving to Vercel.

The gate decision (Phase 3X Option A/B/C for Production KIS enablement) remains pending and must be resolved separately from the Preview guard question above.
