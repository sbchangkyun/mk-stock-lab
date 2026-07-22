# Phase 3GG-T-HF2-PROD-ACTIVATE-RERUN Result: Durable KIS Single Issuance Verified in Production

## Status / Classification

`PASS_KIS_DURABLE_TOKEN_SINGLE_ISSUANCE_PRODUCTION_VERIFIED`

Durable KIS access-token mode is **live in Production** and verified end-to-end: the public PostgREST RPC
bridge removed the PGRST106 blocker, exactly **one** KIS token was issued for a full cross-feature session,
and a controlled second deploy (cold L1) **reused the durable L2 token with zero additional issuance**. No
rollback required. No `git push`.

- **Baseline HEAD**: `8146fe4` (`rebuild/phase-1-ia-shell`) — deployed unchanged for both Production deploys.
- **Source commit for this result**: _(this doc's commit: `Phase 3GG-T-HF2: verify durable KIS single issuance in Production`)_.

## Prior blocker (recap, not rewritten)

The earlier `3GG-T-HF2-PROD-ACTIVATE` failed closed with **PGRST106**: the durable store called Supabase via
`.schema('internal')`, but PostgREST does not expose `internal`. It was safely rolled back to L1-only (zero
tokens issued, no leak). `3GG-T-HF2-HF1` (commit `8146fe4`) added a public service-role-only RPC bridge that
delegates to the authoritative `internal` objects. This rerun activates that repair.

## Bridge migration (Owner Checkpoint A)

- Applied **only** `supabase/migrations/20260714_kis_token_postgrest_rpc_bridge.sql` via the Production
  Supabase Dashboard SQL Editor (no Supabase CLI in the runner). Owner confirmed: **ran clean**.
- `supabase/migrations/20260713_kis_token_lifecycle.sql` was **not** reapplied or modified.
- `internal` **removed from / not present in** Supabase Exposed schemas (owner confirmed) — the bridge makes
  internal exposure unnecessary.

## Bridge verification (Stage 7, metadata-safe)

Service-role probe of `public.kis_token_read_state` on a **guaranteed-nonexistent** scope (pure read; issues
no KIS token; touches no real row):

- `READ_STATE_SERVICE :: REACHABLE rows=0` → the public bridge exists and is service-role executable; **no
  PGRST106, no PGRST202**.
- `READ_STATE_ANON :: DENIED code=42501` (insufficient_privilege) → browser/anon role cannot execute the
  bridge. Grants are correct (service_role only).
- The remaining five bridge functions were created in the same clean migration apply and were exercised live
  during the bootstrap (read/lease/store/record) with no PGRST106.

## Production environment (names + states only; no values printed)

| Variable | State this phase |
| --- | --- |
| `KIS_DURABLE_TOKEN_ENABLED` | set `true` |
| `KIS_TOKEN_TELEMETRY_ENABLED` | set `true` |
| `KIS_TOKEN_EMERGENCY_REFRESH_ENABLED` | set `false` |
| `KIS_TOKEN_ENCRYPTION_KEY` | **preserved, untouched** (present) |
| `KIS_TOKEN_NAMESPACE` | **preserved, untouched** (present) |

The three flags were set `--no-sensitive` (non-secret booleans) so their stored values are verifiable; the
encryption key and namespace were left exactly as-is (never regenerated, never replaced). Note:
`KIS_TOKEN_NAMESPACE` and `KIS_TOKEN_ENCRYPTION_KEY` are **sensitive** in Vercel — the runtime receives their
values, but they are not readable via `vercel env pull` (see "Verification note" below).

## First Production deployment

- **Deployment ID**: `dpl_2ws3hK6mKPobV6DNGLVJhd51BJqD` — target `production`, `readyState: READY`,
  aliased to `https://mkstocklab.vercel.app`. Built on Vercel (no local vercel build).
- Pre-bootstrap regression (unauthenticated):
  - `/chart-ai` → **200**; login gate rendered.
  - All 5 protected routes (`instruments/search.json`, `market/ohlcv.json`, `similarity.json`,
    `mk-analysis.json`, `market-intelligence.json`) → **401** sanitized `AUTH_REQUIRED` before any provider
    work.
  - Bogus bearer → **401 `AUTH_INVALID`** (token validated, not merely present).
  - Zero KIS issuance on deploy; **no PGRST106** on entry.
- Pre-bootstrap durable state probe (best-effort scope): `NO_ROW` — clean zero-token baseline.

## Initial token bootstrap (Owner Checkpoint B)

Owner signed in and, in one sequence, loaded a KR chart, a US chart, then ran Similar Pattern, MK AI, and
Market Intelligence.

- **KIS token-issuance pushes received: exactly 1** (~21:42 KST, 2026-07-13).
- **All five features loaded successfully.**
- **TOKEN_ISSUED count: 1** (inferred from the authoritative KIS push count).
- No secret exposure.

## Cross-feature reuse

All consumers in the sequence — KR OHLCV, US OHLCV, Similar Pattern, MK AI, Market Intelligence — completed
with a **single** token issuance total (1 push). No feature triggered an additional issuance; no request
storm; no generic error triggered a refresh (emergency refresh disabled).

## Second Production deployment (controlled)

- **Deployment ID**: `dpl_GDA2wVWbi5ML9tsgQGdcJe4ssxzo` — target `production`, `READY`, same HEAD `8146fe4`,
  no code change. Purpose: replace warm instances / empty L1 to force a durable **L2** read.
- Post-redeploy regression: `/chart-ai` → 200; protected routes → 401 fail-closed.

## Post-redeploy L2 reuse (Owner Checkpoint C)

- Owner refreshed Chart AI (fresh, cold deployment) and loaded a chart.
- **Chart loaded successfully; additional KIS pushes: 0.**
- Interpretation: the new deployment (empty L1) read the still-valid token from durable **L2** — proving L2
  persistence and cross-deploy reuse. Total TOKEN_ISSUED across the whole activation remains **1**.

## Verification note (honest limitation)

The durable token-state **row** could not be read back directly through the public bridge for corroboration,
because `read_state` requires the exact scope key `kis:market-data:<namespace>:v1` and `KIS_TOKEN_NAMESPACE`
is a **sensitive** Vercel variable (not returned by `vercel env pull`, and absent from `.env.local`). This is
a verification-tooling limitation only — the runtime holds the real namespace. The authoritative
single-issuance evidence is therefore the **KIS push count** (the real count of tokens KIS issued: 1) plus
the **behavioral redeploy test** (cold L1 → 0 new push ⇒ token served from L2). Zero additional issuance after
a cold redeploy is only possible if the token was persisted to and read from L2.

## Security confirmation

No access token, ciphertext, IV, auth tag, encryption key, namespace value, app key/secret, Supabase key,
Authorization header, cookie, JWT, or raw provider/SQL row was printed, logged, or committed. All probes were
metadata-safe (nonexistent-scope reads; presence/length/hash-fingerprint only). Two throwaway probe scripts
and all pulled env files were deleted; none staged or committed. No account/order/balance/funds/trading
endpoint was invoked.

## Rollback

Not required. Durable mode remains **enabled** in Production.

## Not done

No `git push`. No account/trading scope. No dependency change. Original `20260713` migration untouched.
