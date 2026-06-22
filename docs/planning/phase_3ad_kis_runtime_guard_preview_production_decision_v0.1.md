# Phase 3AD KIS Runtime Guard Preview/Production Decision v0.1

## 1. Title And Phase Metadata

- **Phase**: 3AD
- **Type**: Decision-only — no code change in this document
- **Target**: KIS runtime guard policy for Local, Vercel Preview, and Vercel Production
- **Current status**: Decision documented, pending owner confirmation for implementation
- **Previous phase**: Phase 3AC — Vercel Preview environment validation plan
- **Implementation status**: Not started — implementation requires separate owner approval
- **Production KIS status**: Blocked — `isProductionRuntime()` guard is unchanged
- **Created**: 2026-06-22

---

## 2. Background

### Completed Local Validation Milestones

| Phase | What Was Validated |
|---|---|
| Phase 3Z | Local live KIS token fetch + domestic quote fetch + normalization to `QuoteSnapshot` |
| Phase 3AA | Local `/api/market/quote` HTTP endpoint response shape with live KIS backing |
| Phase 3AB | Live KIS fetch → Supabase persistent cache write → in-memory flush → Supabase readback (`supabaseReadbackConclusive=true`) |
| Phase 3AC | Planning-only Vercel Preview validation plan; identified guard-blocks-Preview risk |

### Phase 3AC Critical Finding

Phase 3AC documented that the current `isProductionRuntime()` guard likely blocks live KIS calls in Vercel Preview because Vercel sets `NODE_ENV=production` in all deployed runtimes including Preview deployments. Even when `VERCEL_ENV=preview`, the `NODE_ENV` branch of the OR condition triggers the guard.

This makes Vercel Preview validation impossible without either:
1. A guard policy change that distinguishes Preview from Production, or
2. Accepting that Preview validation will produce only a `blocked_by_runtime_guard` finding.

### Remaining Gaps

- Vercel Preview live KIS behavior is unvalidated.
- Vercel Production KIS must remain permanently blocked until a separate explicit owner-approved gate decision.

---

## 3. Current Guard Behavior

### Source Reference

`isProductionRuntime()` is defined in `src/lib/server/providers/kisClient.ts` at lines 60–64:

```typescript
const isProductionRuntime = () => {
  const nodeEnv = normalizeString(process.env.NODE_ENV).toLowerCase();
  const vercelEnv = normalizeString(process.env.VERCEL_ENV).toLowerCase();
  return nodeEnv === 'production' || vercelEnv === 'production';
};
```

### Call Site

`getKisQuoteConfigReadiness()` at line 82 calls `isProductionRuntime()` before any live KIS call. When it returns `true`, the function immediately returns:

```
{ ready: false, reason: 'production_not_allowed', productionAllowed: false }
```

This causes `getKisQuoteSnapshot()` to return a fail-closed `CONFIG_MISSING` error with no KIS API call attempted, regardless of whether `KIS_ENABLE_LIVE_QUOTES=true` is set and regardless of credential presence.

### Provider Registry

`src/lib/server/providers/providerEnv.ts` marks all four KIS credential env names (`KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL`, `KIS_ENABLE_LIVE_QUOTES`) with `productionAllowed: false`. This registry does not currently have a Preview-specific policy field.

### Per-Runtime Behavior Under Current Guard

| Runtime | `NODE_ENV` | `VERCEL_ENV` | `isProductionRuntime()` result | KIS allowed |
|---|---|---|---|---|
| Local development | `development` or unset | unset | `false` | Yes, if feature flag + credentials present |
| Vercel Preview | `production` (Vercel default) | `preview` | **`true` — via `NODE_ENV` branch** | **No — blocked** |
| Vercel Production | `production` (Vercel default) | `production` | `true` — via both branches | No — blocked |

The critical observation: the current guard cannot distinguish Vercel Preview from Vercel Production because both have `NODE_ENV=production`.

---

## 4. Decision Problem

### The Question

**Should mk-stock-lab allow live KIS quote calls in Vercel Preview while keeping Vercel Production blocked?**

### Context

- Preview validation is a necessary step before UI live quote wiring can be safely approved.
- If Preview is permanently blocked by `NODE_ENV=production`, the only path to UI wiring would be to skip Preview validation entirely and go directly to Production — which is unacceptable given the risk.
- Production KIS must remain blocked regardless of the Preview decision, until a separate gate decision is made.
- Any Preview allowance must be:
  - Explicit (requiring additional env var opt-in, not automatic)
  - Fail-closed (default state is blocked)
  - Owner-approved (env mutation and deployment require separate approval)

### Non-Question

This document does not decide whether to enable Production KIS. Production KIS remains blocked. That is a separate gate decision.

---

## 5. Runtime Policy Options

### Option A — Keep current guard unchanged

| Field | Value |
|---|---|
| **Summary** | Make no change to `isProductionRuntime()`. Accept that Vercel Preview live KIS is blocked by the current guard. |
| **Local behavior** | Unchanged — KIS allowed when feature flag + credentials present |
| **Preview behavior** | Blocked — `NODE_ENV=production` triggers guard |
| **Production behavior** | Blocked — unchanged |
| **Benefits** | Zero implementation risk. No code change. No possibility of accidentally enabling Production KIS. Safest from a guard-integrity standpoint. |
| **Risks** | Vercel Preview live KIS validation is permanently impossible without a future guard change. UI live quote wiring cannot be validated in a deployed environment. Preview endpoint test produces only `blocked_by_runtime_guard` finding, not a real validation. |
| **Implementation required** | None |
| **Approval required** | None |
| **Recommended** | No — defers the problem without solving it |

---

### Option B — Allow Preview when VERCEL_ENV=preview and explicit Preview guard env is set

| Field | Value |
|---|---|
| **Summary** | Modify the guard to treat `VERCEL_ENV=preview` as a distinct runtime class. Block KIS unless a new explicit Preview guard env var (`KIS_ENABLE_PREVIEW_LIVE_QUOTES`) is set to `true`. Keep `VERCEL_ENV=production` as an absolute hard block. Keep `NODE_ENV=production` as a hard block ONLY when `VERCEL_ENV` is `production` or absent. |
| **Local behavior** | Unchanged — local non-production runtime allowed when feature flag + credentials present |
| **Preview behavior** | Allowed only when: `VERCEL_ENV=preview` AND `KIS_ENABLE_PREVIEW_LIVE_QUOTES=true` AND `KIS_ENABLE_LIVE_QUOTES=true` AND required KIS credentials present AND `KIS_ACCOUNT_NO` absent |
| **Production behavior** | Blocked absolutely — `VERCEL_ENV=production` remains a hard block |
| **Preview guard env name** | `KIS_ENABLE_PREVIEW_LIVE_QUOTES` (name only; value must be exactly `'true'` at implementation time) |
| **Benefits** | Enables Vercel Preview validation. Preview requires explicit double opt-in (`KIS_ENABLE_PREVIEW_LIVE_QUOTES` + `KIS_ENABLE_LIVE_QUOTES`). Production remains hard-blocked. Local behavior unchanged. The Preview gate is fail-closed by default. |
| **Risks** | Any code change to the guard carries a risk of unintentionally weakening the Production block. Must be implemented carefully with clear test cases for all runtime classifications. |
| **Implementation required** | Yes — `kisClient.ts` guard logic change + `providerEnv.ts` registry update for new env name; separate owner-approved implementation phase required |
| **Approval required** | Explicit owner approval before any code change; separate approval for Vercel Preview env mutation and deployment after code validation |
| **Recommended** | **Yes — see Section 6** |

---

### Option C — Replace NODE_ENV-based production blocking with VERCEL_ENV-specific blocking

| Field | Value |
|---|---|
| **Summary** | Remove `NODE_ENV === 'production'` from the guard entirely. Block only when `VERCEL_ENV === 'production'`. No additional Preview guard env required. |
| **Local behavior** | Unchanged — local non-production runtime allowed when feature flag + credentials present |
| **Preview behavior** | Allowed when `VERCEL_ENV=preview` and feature flag + credentials present — no additional Preview-specific guard required |
| **Production behavior** | Blocked — `VERCEL_ENV=production` remains a hard block |
| **Benefits** | Simpler implementation than Option B. Preview works automatically without an additional env var. |
| **Risks** | Removes a safety layer. If a non-Vercel build system sets only `NODE_ENV=production` without setting `VERCEL_ENV`, KIS would no longer be blocked. The `NODE_ENV` check exists as a defense-in-depth fallback; removing it makes the Production block depend entirely on `VERCEL_ENV` being set correctly. |
| **Implementation required** | Yes — `kisClient.ts` guard logic change; separate owner-approved implementation phase required |
| **Approval required** | Explicit owner approval before any code change |
| **Recommended** | No — removing the `NODE_ENV` safety layer is less safe than Option B's explicit Preview opt-in |

---

### Option D — Add strict runtime mode enum

| Field | Value |
|---|---|
| **Summary** | Introduce a new env var `KIS_RUNTIME_POLICY` with allowed values (`local_only`, `preview_allowed`, `production_allowed`). Guard reads this enum to determine allowed runtime class. If absent or invalid, default is `local_only` (fail-closed). |
| **Local behavior** | Allowed when `KIS_RUNTIME_POLICY=local_only` or `preview_allowed` and feature flag + credentials present |
| **Preview behavior** | Allowed only when `KIS_RUNTIME_POLICY=preview_allowed` and feature flag + credentials present |
| **Production behavior** | Only allowed when `KIS_RUNTIME_POLICY=production_allowed` — which should never be set until a separate production gate decision |
| **Benefits** | Explicit, auditable policy. Makes runtime intent clear from env var value. Easy to grep for policy state. |
| **Risks** | More complex to implement and validate. Introduces a new enum string that must be exactly matched. If `KIS_RUNTIME_POLICY` is not set in a deployed environment, default `local_only` would correctly block, but could cause confusion. The string `production_allowed` in any env var value is a footgun if accidentally copied. |
| **Implementation required** | Yes — `kisClient.ts` guard logic change + `providerEnv.ts` registry update; separate owner-approved implementation phase required |
| **Approval required** | Explicit owner approval before any code change |
| **Recommended** | No — more complexity than needed for the current scope; Option B achieves the same safety with simpler semantics |

---

### Option E — Defer all Vercel live KIS testing

| Field | Value |
|---|---|
| **Summary** | Accept the current blocked state. Do not change the guard. Proceed with other work (KIS error/fallback validation, UI layout, etc.) until a decision is made. |
| **Local behavior** | Unchanged |
| **Preview behavior** | Blocked — unchanged |
| **Production behavior** | Blocked — unchanged |
| **Benefits** | Zero risk. No code change. No guard weakening. UI layout work can proceed independently. |
| **Risks** | Delays the path to UI live quote wiring. If KIS error/fallback validation is done next and then UI wiring is needed, the guard decision will have to be made at that point anyway — deferring is not eliminating the problem. |
| **Implementation required** | None |
| **Approval required** | None |
| **Recommended** | No — delays without benefit; the decision must be made at some point before UI wiring |

---

## 6. Recommended Decision

**Recommended option: Option B.**

### Rationale

Option B satisfies all of the following constraints simultaneously:

1. **Production remains hard-blocked.** `VERCEL_ENV=production` is an absolute block. No KIS call ever happens in Production under any env var configuration. This is unchanged from the current guard.
2. **Preview is explicitly opt-in, not automatic.** A new guard env var (`KIS_ENABLE_PREVIEW_LIVE_QUOTES`) must be set to `true` in Vercel Preview scope before Preview live KIS is allowed. This prevents accidental enablement if someone deploys to Preview without intending to test live KIS.
3. **Double opt-in for Preview.** Both `KIS_ENABLE_PREVIEW_LIVE_QUOTES=true` AND `KIS_ENABLE_LIVE_QUOTES=true` must be present. A single env var misconfiguration cannot enable Preview KIS.
4. **Local behavior is unchanged.** Existing local smoke harnesses, local endpoint tests, and local development workflows are unaffected.
5. **Defense-in-depth via `VERCEL_ENV`.** The guard pivot from `NODE_ENV` to `VERCEL_ENV` for the production block is well-defined because Vercel sets `VERCEL_ENV` to exactly `'production'`, `'preview'`, or `'development'`. Using `VERCEL_ENV` for runtime classification is more semantically correct than relying on `NODE_ENV` for environment-context decisions.
6. **`KIS_ACCOUNT_NO` remains absent.** The new guard does not introduce any account-context capability.

### Policy Summary Under Option B

| Runtime | Allowed | Additional requirement beyond current guard |
|---|---|---|
| Local non-production | Yes (unchanged) | None |
| Vercel Preview | Yes — only with explicit opt-in | `VERCEL_ENV=preview` + `KIS_ENABLE_PREVIEW_LIVE_QUOTES=true` |
| Vercel Production | No — hard block (unchanged) | N/A |

---

## 7. Proposed Future Implementation Shape

This section is conceptual only. No code change is made in Phase 3AD. This is provided to clarify what a future Phase 3AE implementation would look like in principle.

### Runtime Classification Logic (Conceptual)

The future guard should classify the runtime into one of three explicit categories before allowing any KIS call:

```
runtime class = classify(NODE_ENV, VERCEL_ENV)

where:
  if VERCEL_ENV === 'production'  → class = 'vercel-production'  (hard block, unconditional)
  if VERCEL_ENV === 'preview'     → class = 'vercel-preview'      (allowed only with explicit Preview guard)
  if VERCEL_ENV === 'development' → class = 'vercel-development'  (allowed, treated as local)
  if VERCEL_ENV is absent         →
    if NODE_ENV === 'production'  → class = 'node-production'     (hard block, fail-closed for non-Vercel production)
    otherwise                     → class = 'local'               (allowed)
  default                         → class = 'unknown'             (hard block, fail-closed)
```

### Preview Gate Logic (Conceptual)

When `runtime class = 'vercel-preview'`, the guard additionally requires:
- `KIS_ENABLE_PREVIEW_LIVE_QUOTES === 'true'` (Preview-specific opt-in)
- `KIS_ENABLE_LIVE_QUOTES === 'true'` (existing feature flag)
- All required KIS credential env names present
- `KIS_ACCOUNT_NO` absent

If any of these conditions is not met, the result is a fail-closed block with a descriptive reason code (e.g., `preview_guard_missing`, `production_not_allowed`).

### Provider Registry Update (Conceptual)

`providerEnv.ts` would need a new entry for `KIS_ENABLE_PREVIEW_LIVE_QUOTES` to reflect its purpose. The registry type may also need a `previewAllowed` field to distinguish Preview-capable env names from Production-capable ones.

No changes to `providerEnv.ts` are made in Phase 3AD.

---

## 8. Future Validation Plan After Implementation Approval

If the owner approves Option B implementation, the following sequence applies. None of this is executed in Phase 3AD.

1. **Phase 3AE — Implement guard change:** Modify `isProductionRuntime()` logic in `kisClient.ts` and register new env name in `providerEnv.ts`. No Vercel env mutation yet.
2. **Dry-run / unit-style validation:** Validate runtime classification logic with all combinations of `VERCEL_ENV` and `NODE_ENV` values in a local harness or test. Confirm:
   - Production is blocked when `VERCEL_ENV=production`.
   - Preview is blocked when `VERCEL_ENV=preview` and `KIS_ENABLE_PREVIEW_LIVE_QUOTES` is absent.
   - Preview is allowed only when `VERCEL_ENV=preview` and `KIS_ENABLE_PREVIEW_LIVE_QUOTES=true` and all other guards pass.
   - Local behavior is unchanged.
3. **Changelog and commit:** Document the guard change with a clear before/after behavior table.
4. **Phase 3AF — Vercel Preview env mutation (separate approval):** Owner adds Preview-scoped env vars in Vercel UI. No Production env touched.
5. **Phase 3AG — Vercel Preview deployment and endpoint validation:** Owner triggers Preview deployment and performs sanitized endpoint test per the Phase 3AC procedure template.

---

## 9. Explicit Non-Goals

Phase 3AD does **not** include and must not be extended to include any of the following:

- Any code change (`kisClient.ts`, `providerEnv.ts`, or any other source file)
- Vercel env mutation
- Vercel Preview or Production deployment
- Live KIS calls
- Live Supabase queries or writes
- Production KIS enablement
- UI live quote wiring
- Account, order, trading, balance, holdings, or WebSocket APIs
- `KIS_ACCOUNT_NO` usage
- SQL execution
- Migration file modification

---

## 10. Risk Assessment

| Risk | Description | Mitigation |
|---|---|---|
| Accidentally enabling Production KIS | A guard change could inadvertently weaken the Production block | Option B keeps `VERCEL_ENV=production` as an absolute hard block. Any implementation must be validated with an explicit `VERCEL_ENV=production` test confirming KIS is blocked. |
| Preview env secrets mis-scoped to Production | Owner adds KIS secrets to Vercel UI and accidentally selects "All Environments" instead of "Preview only" | Owner must confirm per-environment scoping in Vercel UI before deployment. Cleanup procedure (Phase 3AC Section 12) requires removing Preview-scoped vars after testing. |
| `NODE_ENV=production` misclassification | If non-Vercel build tools set `NODE_ENV=production` without `VERCEL_ENV`, the guard must still block | Option B retains a `NODE_ENV=production` block when `VERCEL_ENV` is absent. This is the defense-in-depth fallback for non-Vercel environments. |
| Ambiguous Vercel runtime | Vercel may not set `VERCEL_ENV` in all build contexts (e.g., during `vercel build` locally) | Guard must default to fail-closed (`unknown` → block) when `VERCEL_ENV` is absent and `NODE_ENV=production`. Option B covers this via the `NODE_ENV` fallback. |
| Exposing provider errors or price values | Preview endpoint test could surface raw KIS fields or price values in sanitized evidence | Phase 3AC evidence template requires boolean-only recording. Forbidden output pattern in harnesses blocks raw KIS fields. |
| UI wiring before runtime validation | Connecting browser UI to `/api/market/quote` before Preview is validated exposes users to an unvalidated path | UI wiring must remain blocked until Preview validation passes (Phase 3AC procedure) and owner explicitly approves wiring. |

---

## 11. Decision Record

| Field | Value |
|---|---|
| **Decision status** | Proposed — pending owner confirmation for implementation |
| **Recommended policy** | Option B — allow Preview only with explicit `KIS_ENABLE_PREVIEW_LIVE_QUOTES=true` guard |
| **Production KIS** | Remain blocked — `VERCEL_ENV=production` is an absolute hard block, unchanged |
| **Preview KIS** | Allowed only after: (1) separate implementation approval and code change, (2) `KIS_ENABLE_PREVIEW_LIVE_QUOTES=true` set in Vercel Preview scope, (3) separate deployment approval |
| **Local KIS** | Unchanged — allowed when feature flag + credentials present in non-production shell |
| **UI wiring** | Remain blocked until Preview validation passes and owner explicitly approves |
| **Vercel env mutation/deployment** | Remain blocked until separate owner approval after guard implementation is validated |

---

## 12. Owner Approval Checklist

The owner may use this checklist when deciding to proceed with Phase 3AE implementation:

```text
Phase 3AD — Owner Decision Checklist

Approve Option B guard implementation (Phase 3AE): yes / no
Approve Preview-only KIS env mutation after implementation validated: yes / no
Approve Preview deployment after env mutation approved: yes / no
Confirm Production env must not be changed: yes / no
Confirm KIS_ACCOUNT_NO must remain absent in all environments: yes / no
Confirm UI wiring remains blocked until Preview validation passes: yes / no
```

---

## 13. Recommended Next Step

After the owner reviews this Phase 3AD decision document, the recommended next step is one of:

**Option 1 — Approve Option B and proceed to Phase 3AE (guard implementation):**
The owner confirms the Option B decision. Claude Code implements the guard change in `kisClient.ts` and `providerEnv.ts` in a separate implementation phase (Phase 3AE), with dry-run/unit validation before any Vercel env mutation or deployment.

**Option 2 — Defer Vercel Preview and proceed to KIS error/fallback validation:**
The owner defers the guard decision and plans a local phase to validate KIS error paths (429 rate-limit, non-`0` `rt_cd`, missing price field, network failure) before returning to Vercel Preview.

**Option 3 — Proceed with unrelated UI layout refinement:**
If Vercel Preview work is deferred and no local KIS validation is needed immediately, the owner may proceed with UI layout or other non-quote-wiring work as a separate independent task. Quote wiring remains blocked in all cases.

The Phase 3X gate decision (Production KIS enablement) is separate from any Preview decision and must not be conflated with the Option B implementation above.
