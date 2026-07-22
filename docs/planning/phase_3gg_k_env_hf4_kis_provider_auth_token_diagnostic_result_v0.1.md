# Phase 3GG-K-ENV-HF4 — Owner-local KIS Provider Auth/Token Diagnostic Result

## Status

Still blocked (local route only) — but the KIS OAuth token and current_price quote layers are confirmed working end-to-end with real, owner-supplied credentials.

## Classification

`TOKEN_AND_DIRECT_QUOTE_OK_LOCAL_ROUTE_UNAVAILABLE`

## Baseline

`1ba4652`

## Branch

`rebuild/phase-1-ia-shell`

## HEAD before

`1ba4652e346c995166247728bf60f68f399e1bce`

## HEAD after

(recorded post-commit; see final report)

## Purpose

Diagnose the remaining owner-local KIS provider blocker after Phase 3GG-K-ENV-HF3 confirmed that `KIS_BASE_URL` base network reachability (DNS/TCP/TLS/HTTP) is fully OK, by safely isolating whether the remaining `PROVIDER_UNAVAILABLE` condition sits in the KIS OAuth token exchange layer, the current_price quote authorization/entitlement/request-shape layer, or the existing local current_price route binding.

## Files changed

- `scripts/owner_diagnostic_phase_3gg_k_env_hf4_kis_provider_auth_token_readiness.mjs` (created)
- `scripts/check_phase_3gg_k_env_hf4_contract.mjs` (created)
- `docs/planning/phase_3gg_k_env_hf4_kis_provider_auth_token_diagnostic_result_v0.1.md` (created)
- `package.json` (modified — 2 script entries added)
- `docs/planning/planning_changelog.md` (modified — entry prepended)

## Source diff status

Zero diff from baseline `1ba4652` for all forbidden-diff files (`kisClient.ts`, the local-only KIS market-data binding module, both chart-ai API routes, the LLM runtime bridge, the model policy module, `chart-ai.astro`, the HF1 and HF3 diagnostic scripts, MK Agent, Similar Pattern agent, guarded productization scaffold, `components`, `supabase`, `src/data`, lockfiles, `.env`, `.env.local`).

## Local dev server status

- Reachable: true
- Listening on 4321: true (single listener, PID 19240)
- Fallback ports 5173/5174 listening: false

## Auth/token diagnostic command used

```
npm run owner-diagnostic:phase-3gg-k-env-hf4 -- --owner-approved-kis-auth-token-diagnostic --base-url=http://localhost:4321
```

## Auth env boolean summary

- appKeyPresent: true
- appSecretPresent: true
- baseUrlPresent: true
- requiredAuthEnvPresent: true
- kisLiveQuotesShellFlagExactlyTrue: false

## Token diagnostic summary

- tokenEndpointShapeKind: expected-provider-shape
- tokenRequestAttempted: true
- tokenHttpStatusClass: 2xx
- tokenResponseShapeKind: access-token-present
- tokenPresent: true
- tokenErrorClass: none

## Quote diagnostic summary

- quoteRequestAttempted: true
- quoteHttpStatusClass: 2xx
- quoteResponseShapeKind: output-present
- quoteKisStatusClass: ok
- quoteCurrentPricePresent: true
- quoteVolumePresent: true
- quoteErrorClass: none

## Existing local current_price route result

- localCurrentPriceRouteReachable: true
- localCurrentPriceSourceStatus: unavailable
- localCurrentPriceSanitizedErrorCode: PROVIDER_UNAVAILABLE
- localCurrentPricePresent: false
- localVolumePresent: false

## G-FAST owner smoke result

Ran `npm run owner-smoke:phase-3gg-g-fast -- --owner-approved-real-kis-smoke`. Result: `BLOCKED reason=fail-closed-or-unavailable sourceStatus=unavailable sanitizedErrorCode=PROVIDER_UNAVAILABLE sanitized=true`. Corroborates the local-route-side blocker; no secrets, raw payload, or numeric price/volume were printed.

## Classification rationale

The diagnostic script obtained a real KIS OAuth access token (2xx, `access-token-present`, `tokenPresent=true`) using the real `KIS_APP_KEY`/`KIS_APP_SECRET`, then used that in-memory token to call the real current_price quote endpoint for symbol 005930 and received a 2xx response with `rt_cd == '0'` (`quoteKisStatusClass=ok`), `output` present, and both `stck_prpr` and `acml_vol` fields present (`quoteCurrentPricePresent=true`, `quoteVolumePresent=true`). This proves KIS OAuth token exchange, app authorization, quote-endpoint entitlement, and request shape (TR_ID `FHKST01010100`, `FID_COND_MRKT_DIV_CODE=J`, `FID_INPUT_ISCD=005930`) are all correct and functioning end-to-end outside of the local route.

Immediately afterward, the existing local `current_price` route (`/api/chart-ai/local-only-kis-current-price.json`) was queried through localhost using the same running dev server and returned `sourceStatus=unavailable` / `sanitizedErrorCode=PROVIDER_UNAVAILABLE`, matching the exact blocked state observed since HF2/HF3. Because the external KIS auth/network/quote path is now proven functional with real credentials while the local route remains blocked, the condition is not a KIS-side problem — it is isolated to the local provider binding / `kisClient.ts` runtime wiring / local route handling layer (e.g., a runtime-only gate such as the `KIS_ENABLE_LIVE_QUOTES` shell flag observed as not exactly `"true"` in this diagnostic's own env read, a stale in-process module cache, or an internal binding condition not part of the base network or KIS auth path).

## Owner-safe next action

No .env correction is diagnosable from this sanitized report alone beyond noting that `kisLiveQuotesShellFlagExactlyTrue=false` was observed during this diagnostic run — the owner should confirm, outside this chat, that `KIS_ENABLE_LIVE_QUOTES=true` is actually set in the environment the running dev server process loaded (not just the `.env` file on disk), then proceed to Phase 3GG-K-ENV-HF5 (Minimal Local Provider Binding Fix) to trace why the local route's own gate/binding still resolves to `PROVIDER_UNAVAILABLE` despite a working direct token+quote path.

## Exposure status

- KIS_BASE_URL raw value exposure: Not exposed
- Credential exposure: Not exposed
- Token exposure: Not exposed
- Authorization header exposure: Not exposed
- Raw KIS request exposure: Not exposed
- Raw KIS payload exposure: Not exposed
- Raw KIS HTTP response body exposure: Not exposed
- Raw KIS error message exposure: Not exposed
- Raw LLM response exposure: Not exposed
- Prompt exposure: Not exposed
- currentPrice numeric exposure: Not exposed
- volume numeric exposure: Not exposed

## KIS endpoint expansion status

- OAuth token endpoint only: confirmed (`/oauth2/tokenP`)
- current_price quote endpoint only: confirmed (`/uapi/domestic-stock/v1/quotations/inquire-price`, symbol 005930 only)
- No order/account/balance/funds/portfolio/trading/personal endpoint contacted: confirmed

## Env file status

- `.env`/`.env.local` not printed: confirmed
- `.env`/`.env.local` not modified: confirmed
- `.env`/`.env.local` not staged: confirmed
- `.env`/`.env.local` not committed: confirmed

## Validation results

- `npm run owner-diagnostic:phase-3gg-k-env-hf4 -- --owner-approved-kis-auth-token-diagnostic --base-url=http://localhost:4321`: ran, sanitized report printed, exit code 1 (blocked classification, expected)
- `npm run owner-smoke:phase-3gg-g-fast -- --owner-approved-real-kis-smoke`: ran, sanitized blocked result, corroborates
- `npm run check:phase-3gg-k-env-hf4`: PASS (see validation chain below)
- `npm run check:phase-3gg-k-env-hf3`: PASS (regression check)
- `npm run build`: PASS
- `git diff --check`: clean
- `git status --short`: reviewed, only authorized files staged

## Push/deploy status

Not pushed. Not deployed.

## Next recommended phase

Phase 3GG-K-ENV-HF5 — Minimal Local Provider Binding Fix (direct token + direct quote succeed with real credentials; the existing local current_price route still returns PROVIDER_UNAVAILABLE, pointing to the local provider binding/kisClient/local route handling layer rather than KIS external auth/network).
