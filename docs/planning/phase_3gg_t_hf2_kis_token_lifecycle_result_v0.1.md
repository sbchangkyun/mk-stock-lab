# Phase 3GG-T-HF2 Result: Durable KIS Access-Token Lifecycle

## Status / Classification

`PASS_KIS_DURABLE_TOKEN_LIFECYCLE_IMPLEMENTED_LOCAL_VALIDATION_COMPLETE_PRODUCTION_ACTIVATION_PENDING`

Local implementation complete and fully validated with deterministic tests that never call the real KIS
token endpoint. Migration created but **not applied**; no Production env change; no deploy; no push.

- **Baseline**: `39830c9` (Phase 3GG-T-HF1 deploy record). **Branch**: `rebuild/phase-1-ia-shell`.
- **HEAD before work**: `39830c9`.
- **Source commit**: _(filled at commit: `Phase 3GG-T-HF2: add durable KIS token lifecycle`)_.

## Problem

The KIS access token was cached only in process memory (`accessTokenCache`) with a process-local
single-flight guard. On Vercel, cold starts / new instances / redeploys each issued a new token — duplicate
issuance within the 24h validity window, risking KIS usage restriction (P0-OPS).

## Implemented architecture

- **L1** — per-instance memory cache inside the manager (fast path; reuse until `usableUntil`).
- **L2** — durable Supabase Postgres store (`internal.kis_token_state`) shared by all instances, holding an
  **AES-256-GCM** encrypted token envelope (ciphertext/iv/authTag + key version), never plaintext.
- **Distributed lease** — DB-backed lease with **fencing** (`lease_version` bump) via
  `internal.acquire_kis_token_lease`; only the lease holder may issue.
- **Double-check after lease** — the holder re-reads L2 before issuing; if another instance already stored a
  valid generation it reuses it.
- **Fencing on write** — `internal.store_kis_token_generation` stores + releases atomically only for the
  current `lease_owner + lease_version`; stale holders are rejected.
- **Encryption** — Node built-in `crypto` AES-256-GCM; AAD binds `scopeKey|generationId|keyVersion`; random
  12-byte IV; decrypt failure fails closed (`KIS_TOKEN_DECRYPT_FAILED`, never auto-issues).
- **Expiry** — timezone-safe: prefers `expires_in`; the KIS KST absolute string is parsed explicitly at
  `+09:00` (never fed tz-less to `Date.parse`); `usableUntil = expiresAt − 15min` safety window.
- **Cooldown** — 10-minute successful-issuance cooldown in durable state; blocks a fresh issuance when no
  usable token exists (`TOKEN_ISSUE_BLOCKED_BY_COOLDOWN`, fail closed).
- **Emergency refresh** — implemented in the executor but **disabled by default** (empty token-invalid
  allowlist + `KIS_TOKEN_EMERGENCY_REFRESH_ENABLED` off); generic provider/data errors never refresh.
- **Telemetry** — secret-safe events to `internal.kis_token_event` via a strict metadata allowlist; token/
  key/ciphertext/headers can never be persisted; telemetry failure never breaks token reuse.
- **Flag** — `KIS_DURABLE_TOKEN_ENABLED` off ⇒ preserves the previous L1-only behavior; on-without-key ⇒
  fail closed (never silently issues).

## Database migration

- **Path**: `supabase/migrations/20260713_kis_token_lifecycle.sql` — additive, forward-only, **not applied**.
- **Tables** (`internal` schema, RLS enabled, revoked from anon/authenticated, service_role only):
  `kis_token_state`, `kis_token_event`.
- **RPCs** (security definer, `search_path=''`, granted to `service_role` only):
  `acquire_kis_token_lease`, `release_kis_token_lease`, `store_kis_token_generation`,
  `invalidate_kis_token_generation`, `record_kis_token_event`.

## KIS consumer integration

- One authoritative issuer `issueKisTokenFromEndpoint` (single `/oauth2/tokenP` fetch, 8s timeout, no
  caching). All four transports (`getKisDomesticQuoteSnapshot`, `getKisDomesticDailyOhlcSeries`,
  `getKisOverseasDailyOhlcSeries`, `getKisOverseasQuoteSnapshot`) route through
  `executeKisRequestWithToken(getKisExecutorDeps(), …)` → the shared `KisTokenManager`. The old
  `getKisAccessToken` / `accessTokenCache` / `accessTokenInFlight` / tz-risky `parseTokenExpiry` are removed
  (superseded). Static instrument search stays token-free; the Production-disabled legacy summary route is
  unchanged.

## Tests run (no real token issued)

`npm run smoke:phase-3gg-t-hf2` → **44/44 PASS** (esbuild-bundled TS harness, mock issuer + faithful
in-memory store/lease mock): AES-256-GCM roundtrip/wrong-key/AAD/malformed/key-length; config + env
defaults; expiry (`expires_in` + KST `+09:00`, safety window, bad-lifetime rejection); lease backoff bound;
empty classifier; telemetry redaction; L1 reuse (no L2 read); **multi-instance 20 concurrent → issuer
called exactly once, one shared generation**; cold-start reuse; redeploy reuse; lease-owner crash + fencing
rejection of the stale write; store-read/lease/db-write/telemetry failure policies; issue cooldown;
generation-scoped invalidation; emergency-refresh-disabled; secret scan.

`npm run check:phase-3gg-t-hf2` → static contract + secret scan PASS.

## Acceptance (local)

KIS-TOKEN-01..20 evaluated in the final report; all local-verifiable criteria PASS; real-issuance / real
cross-instance behavior is **Production-only verification pending** (not deployed).

## Known limitations

- Emergency refresh is disabled because no confirmed KIS token-invalid code exists in the repo (allowlist
  empty by design).
- Multi-instance / cold-start / redeploy guarantees are proven by simulation; real-runtime confirmation
  requires Production activation.

## Production prerequisites (activation pending; not performed)

1. Apply `supabase/migrations/20260713_kis_token_lifecycle.sql` via the Supabase SQL editor.
2. Set env (names only): `KIS_DURABLE_TOKEN_ENABLED=true`, `KIS_TOKEN_NAMESPACE=<label>`,
   `KIS_TOKEN_ENCRYPTION_KEY=<base64 32-byte>`, `KIS_TOKEN_TELEMETRY_ENABLED=true`,
   `KIS_TOKEN_EMERGENCY_REFRESH_ENABLED=false`.
3. Deploy; the first authenticated market-data request issues exactly one token (one KIS push); subsequent
   cold starts / redeploys reuse the durable token (no additional push). Rollback: set
   `KIS_DURABLE_TOKEN_ENABLED=false` (reverts to L1-only).

## Deploy / push

Deployment **not performed** (not authorized this run). Push **not performed**. Migration **not applied**.

## Next

Production activation run (owner-gated), then Phase 3GG-U-FAST.
