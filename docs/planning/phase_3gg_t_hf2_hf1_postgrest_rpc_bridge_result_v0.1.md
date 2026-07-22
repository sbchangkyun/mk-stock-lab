# Phase 3GG-T-HF2-HF1 Result: Public PostgREST RPC Bridge for the Durable KIS Token Store

## Status / Classification

`PASS_KIS_POSTGREST_PUBLIC_RPC_BRIDGE_IMPLEMENTED_LOCAL_VALIDATION_COMPLETE_PRODUCTION_RERUN_PENDING`

Local implementation complete and fully validated with deterministic offline tests (no real KIS token, no
network, no Supabase credentials). New bridge migration created but **not applied**; no Production env change;
no deploy; no push. This does **not** claim Production verification — the HF2 Production activation must be
re-run by the owner after the bridge migration is applied.

- **Baseline**: `fbe6646` (`rebuild/phase-1-ia-shell`). **HEAD before work**: `fbe6646`.
- **Source commit**: _(filled at commit: `Phase 3GG-T-HF2-HF1: add PostgREST RPC bridge for durable KIS token store`)_.

## Problem (why the prior activation failed closed)

The durable token manager (Phase 3GG-T-HF2) reaches Supabase through the supabase-js client, which the store
originally called via `.schema('internal').rpc(...)` / `.from('kis_token_state')`. PostgREST only serves
schemas listed in its "Exposed schemas" (`db-schemas`) setting; `internal` is **not** exposed. So every
durable-path call returned **PGRST106** ("schema must be one of the following: public, ...") and the manager
failed closed. The HF2 Production activation was consequently rolled back.

Exposing the whole `internal` schema through PostgREST would widen the attack surface (all internal tables/
functions become reachable by any role PostgREST authenticates). We rejected that.

## Fix — Option C: a narrow public RPC bridge

Keep all sensitive token tables/logic in `internal`. Add **six SECURITY DEFINER functions in `public`** (the
always-exposed schema) that delegate to the authoritative `internal` objects. Only these six narrow,
service_role-only functions are reachable through PostgREST; the `internal` schema stays unexposed.

| public bridge function | delegates to | returns |
| --- | --- | --- |
| `public.kis_token_read_state(text)` | `internal.kis_token_state` (select) | metadata + **encrypted envelope only** |
| `public.kis_token_acquire_lease(text,text,integer)` | `internal.acquire_kis_token_lease` | `(acquired, lease_version, lease_expires_at)` |
| `public.kis_token_release_lease(text,text,bigint)` | `internal.release_kis_token_lease` | boolean |
| `public.kis_token_store_generation(text,text,bigint,uuid,text,text,text,integer,timestamptz,timestamptz,timestamptz)` | `internal.store_kis_token_generation` | boolean |
| `public.kis_token_invalidate_generation(text,uuid)` | `internal.invalidate_kis_token_generation` | boolean |
| `public.kis_token_record_event(text,text,uuid,text,text,text,integer,text,jsonb)` | `internal.record_kis_token_event` | void |

Each function is `SECURITY DEFINER`, `SET search_path = ''`, uses fully-qualified `internal.*` references, has
**no dynamic SQL** and **no secret literals**, is `REVOKE ALL ... FROM public, anon, authenticated`, and is
`GRANT EXECUTE ... TO service_role` (exact signatures). `read_state` returns the AES-256-GCM envelope
(ciphertext/iv/authTag + key version) and metadata only — **never plaintext**, and there is **no public
token table or view**. The five write/lease/event delegates re-implement no logic; they call the internal
functions so all fencing, cooldown, allowlist, and atomicity semantics stay in one authoritative place.

## Changes

- **New migration** `supabase/migrations/20260714_kis_token_postgrest_rpc_bridge.sql` — additive, forward-only.
  The already-applied `20260713_kis_token_lifecycle.sql` is **byte-for-byte unchanged** (verified by checker).
- **Runtime** `src/lib/server/providers/kis/kisTokenStore.ts` — converted from `.schema('internal').rpc(...)`
  to the default public bridge RPC names (`getSupabaseAdminClient().rpc('kis_token_*', {...})`). The
  `KisTokenDb` port, the envelope-only `rowToState` mapper, and every error/fail-closed path are unchanged.
  A small injectable `clientFactory` was added purely so the RPC-mapping test can pass a fake recording
  client; the default remains the real service-role admin client.

**Unchanged** (explicitly preserved): encryption (AES-256-GCM), expiry/safety-window, cooldown, single
`/oauth2/tokenP` issuance, lease polling, fencing (`lease_version`), emergency-refresh policy (default off),
telemetry allowlist, and every external Chart AI API contract. No dependency added; no Cron; no account/
trading/balance/order/funds scope introduced.

## Tests & gates (local, safe only)

- **Bridge RPC-mapping smoke** `scripts/smoke_phase_3gg_t_hf2_hf1_bridge.mjs` — **11/11**. A fake client that
  implements only `.rpc(...)` (any `.schema()`/`.from()` would throw) proves each store method calls the
  correct public bridge RPC with the right params, the envelope is passed (never plaintext), only the six
  approved names are used, and no legacy internal RPC name leaks.
- **Bridge contract checker** `scripts/check_phase_3gg_t_hf2_hf1_contract.mjs` — migration contract (new file
  additive; `20260713` unchanged vs committed; six functions SECURITY DEFINER + `search_path=''` +
  fully-qualified delegation + service_role-only grants; no DROP/TRUNCATE/ALTER internal; no public token
  table/view; no PostgREST-exposure toggle), runtime source contract (no `.schema('internal')`, no direct
  token-table access, only the six approved RPC names), and a secret scan.
- **Regression**: HF2 smoke **44/44**, HF2 checker **160/160** (store conversion is non-regressive because the
  HF2 tests inject an in-memory mock db); plus the sibling checkers and `astro build`.

## Database migration status

`supabase/migrations/20260714_kis_token_postgrest_rpc_bridge.sql` is **not applied**. Apply it via the
Supabase Dashboard SQL Editor. It creates only the six `public` bridge functions and their grants; it does not
touch `internal` objects, RLS, or the PostgREST exposed-schemas setting.

## Not done this phase (owner-gated, out of scope)

Production database migration, Production env change, Production deploy, real KIS token issuance, and
`git push` were **not** performed. The HF2 Production activation is a **re-run** after this bridge lands.

### Prerequisites for `Phase 3GG-T-HF2-PROD-ACTIVATE-RERUN`

1. Apply `20260714_kis_token_postgrest_rpc_bridge.sql` in the Production Supabase project (Dashboard SQL Editor).
2. Confirm the six `public.kis_token_*` functions exist and are executable by `service_role` only.
   Do **not** add `internal` to Supabase "Exposed schemas".
3. Ensure the durable-token env contract is set in Production (`KIS_DURABLE_TOKEN_ENABLED`,
   `KIS_TOKEN_ENCRYPTION_KEY`, `KIS_TOKEN_NAMESPACE`, telemetry flag) — values owner-only.
4. Deploy the branch and run the owner-local live KIS smoke + Production Chart AI QA. A successful durable
   read/lease/store cycle should return **no PGRST106** and issue at most one token per validity window.
