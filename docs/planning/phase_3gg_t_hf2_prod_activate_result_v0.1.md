# Phase 3GG-T-HF2-PROD-ACTIVATE Result: Durable KIS Token Activation Attempt

## Status / Classification

**`BLOCKED_KIS_DURABLE_TOKEN_ACTIVATION_INTERNAL_SCHEMA_NOT_POSTGREST_EXPOSED_ROLLED_BACK_TO_L1`**

Not the target `PASS_..._PRODUCTION_VERIFIED`, and **not** a duplicate-issuance FAIL (no duplicate token
was ever issued — durable mode failed **closed**). Production was safely rolled back to the working
L1-only path. The durable-token code is unchanged and remains locally verified (44/44 sim); activation is
blocked on a Supabase environment configuration that could not be completed/verified in this run.

- **Baseline**: `aedeb68` (Phase 3GG-T-HF2). **Branch**: `rebuild/phase-1-ia-shell`.
- **Push**: not performed.

## What was done

1. **Local gates** — HF2 smoke 44/44, all 7 contract checkers PASS (three sibling checkers were patched to
   tolerate the now-committed HF2 files that appear in `git diff` vs their baselines: `t_hf2` one-issuer
   grep narrowed to the actual fetch construction; `t_hf1`/`t_fast` supabase/provider diff filters extended
   to the HF2 migration + `providers/kis/` modules), `astro build` PASS, `git diff --check` clean.
2. **Migration** — `supabase/migrations/20260713_kis_token_lifecycle.sql` reviewed (additive, 0 destructive
   statements, RLS + revokes + `security definer`/fixed `search_path`, no token plaintext) and **applied to
   Production by the owner via the Supabase Dashboard SQL Editor** (repo has no Supabase CLI/linked project;
   the file header + convention require manual application).
3. **Production env (Vercel)** — set names only, values never printed:
   `KIS_DURABLE_TOKEN_ENABLED`, `KIS_TOKEN_NAMESPACE` (`mkstocklab-prod`), `KIS_TOKEN_ENCRYPTION_KEY`
   (generated via `openssl rand -base64 32`, piped directly into the secret, never displayed),
   `KIS_TOKEN_TELEMETRY_ENABLED=true`, `KIS_TOKEN_EMERGENCY_REFRESH_ENABLED=false`.
4. **First deploy (durable ON)** — `dpl_BGc2cfJH55Z6UQrDPmbFza5aUJie`, READY, aliased to
   `https://mkstocklab.vercel.app`. Unauthenticated: page 200, all five Chart AI routes fail closed 401
   with sanitized body (no token issued from deploy/unauth entry).
5. **Bootstrap attempt (owner)** — signed-in chart load produced **zero KIS push and market-data features
   failed to load** (fail-closed). Re-attempted after the owner added `internal` to Supabase "Exposed
   schemas" — still zero/failed.

## Root cause (confirmed)

The durable token manager reaches Supabase through the JS client's `.schema('internal').rpc(...)`. A
service-role probe shows the `internal` schema returns **`PGRST106`** (schema not exposed to PostgREST),
while `public` returns `PGRST202` (exposed; fn merely absent). With `internal` unreachable, the manager's
`acquireLease` / `readState` / `storeGeneration` calls fail, and the manager **fails closed** (no token
issued, market data unavailable) — exactly the safe behavior proven by the local store-failure tests. This
is an **environment/config blocker**, not a code defect: the code did not issue a duplicate token, did not
retry-spam, and leaked nothing.

Note: the exposure check was run with the local service-role credentials; the exact Production Supabase
project's exposed-schema state could not be independently confirmed from this environment (no Production DB
read access; `internal` unreadable). The owner's "still zero / feature failed" on the live site confirms
the Production durable path is not reaching the store.

## Rollback (performed)

Set `KIS_DURABLE_TOKEN_ENABLED=false` in Production and redeployed
(`mkstocklab-a1fotykz6-*`, READY). Chart AI reverts to the previous **L1-only** behavior (functional;
carries the original per-instance/cold-start duplicate-issuance risk again — acceptable temporarily).
`git diff --check` clean; unauth 401 fail-closed retained. **No migration object dropped.**

## Fail-closed / safety evidence

- No duplicate token issuance occurred (durable mode failed closed; L1-only issues normally).
- No token/credential/ciphertext/key/Authorization value was printed, logged, or committed.
- No account/order/balance/funds/trading endpoint was invoked.
- No runaway retry or request storm.

## Repair options for the next activation run (owner decision)

Either (fastest) or the robust code path:

- **Option A — expose `internal` on the exact Production Supabase project.** In the *Production* project:
  Settings → API → Exposed schemas → ensure `internal` is present and **saved**, then wait for the
  PostgREST schema reload. Verify with a service-role probe that `.schema('internal').rpc('<any>')` returns
  `PGRST202` (not `PGRST106`). Then re-set `KIS_DURABLE_TOKEN_ENABLED=true`, redeploy, and re-run the
  one-push bootstrap. (Security is unchanged — the objects stay RLS-enabled and revoked from
  anon/authenticated; only the service role can use them.)
- **Option B — relocate the durable token objects to the `public` schema** (guaranteed PostgREST-exposed)
  with the same RLS-deny + service-role-only grants, and switch `kisTokenStore.ts` from `.schema('internal')`
  to the default schema. This removes the dependency on the "Exposed schemas" setting entirely. It requires
  a follow-up migration + redeploy + re-verify.

## Acceptance snapshot

- KIS-PROD-01 (migration applied) PASS; -02 (RLS/roles in migration) PASS; -03..-05 (env names / durable on /
  emergency off) PASS; -16 first deploy READY PASS; -20 no trading scope PASS; -21 auth/zero-request
  regression PASS; -24 rollback flag documented + used PASS.
- KIS-PROD-06..-19, -22, -23 (single issuance, cross-feature reuse, redeploy reuse, telemetry) **NOT
  VERIFIED** — blocked by the `internal`-schema exposure (durable path never reached the store).

## Push / deploy

Two Production deploys performed (durable-ON then rollback). **No git push.** No deployment-record of a
successful activation (activation did not succeed).

## Next

Resolve the schema exposure (Option A or B), then re-run Phase 3GG-T-HF2-PROD-ACTIVATE. The durable code
itself is unchanged and locally validated.
