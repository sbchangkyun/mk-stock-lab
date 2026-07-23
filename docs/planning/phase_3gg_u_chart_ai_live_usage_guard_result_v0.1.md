# Phase 3GG-U — Live Chart AI Daily Usage Guard — Result v0.1

Implements a live, server-side, fail-closed daily usage guard for Chart AI's real analytical execution
(Similarity + MK Analysis), replacing the previously mocked/unlimited client usage state. **No Supabase
migration applied, no Production DB mutation, no Production deploy, no main push, no PR merge.**

## 1. Executive classification

**`IMPLEMENTED_PUSHED_PREVIEW_READY_DB_MIGRATION_APPROVAL_PENDING`** (target, pending §17 full local gate,
§19 commit/push/PR, and §20 Preview verification — this document is written and committed alongside the
implementation per §14 and is updated in place, not as a separate commit, if any of those later steps
change its content).

## 2. Product policy implemented

Daily combined Chart AI analysis limit: **3 executions per authenticated free user per KST (Asia/Seoul)
calendar day**, one shared counter across Similarity + MK Analysis (not separate quotas). Reset boundary is
the Asia/Seoul calendar date at KST midnight, computed server-side only
(`(timezone('Asia/Seoul', now()))::date` in the migration; never client time). Local owner diagnostic routes
(localhost opt-in) stay usage-free — no usage rows are written for that path. No admin/master bypass, no
pricing tier, no paid subscription this phase.

## 3. Migration (not applied)

New additive migration `supabase/migrations/20260723_chart_ai_live_usage_guard.sql` adds two **public**,
`security definer`, empty-`search_path`, fully-qualified bridge functions operating on the existing
`public.ai_usage_daily` table (present in `20260615_rebuild_schema_v0_1.sql`, cross-verified this phase):

- `public.consume_chart_ai_usage_v1(p_user_id uuid, p_free_limit integer default 3)` — self-contained
  atomic upsert on `public.ai_usage_daily`. **Policy-pinned (HF1, see below):** stores
  `free_limit = p_free_limit` (never `greatest(...)`) and authorizes the increment only while
  `used_count < p_free_limit`.
- `public.refund_chart_ai_usage_v1(p_user_id uuid)` — decrements today's `used_count` on
  `public.ai_usage_daily`, floored at zero, keyed by the KST calendar date.

### 3.1 HF1 policy pinning (Phase 3GG-U-HF1-USAGE-LIMIT-POLICY-PINNING)

The consume bridge originally delegated to the already-applied `internal.consume_chart_ai_usage`, which
stores `free_limit = greatest(stored, incoming)` and gates on `used_count < stored free_limit`. A
pre-existing `public.ai_usage_daily` row carrying a historically higher `free_limit` would therefore
authorize more than the approved policy (exactly 3/day). The internal function is already applied and is
**not modified**; the unapplied `public.consume_chart_ai_usage_v1` bridge no longer calls it at all.

**Two-step atomic reservation.** An initial single-statement rewrite (`INSERT ... ON CONFLICT DO UPDATE ...
WHERE used_count < p_free_limit`) still had a gap: the `WHERE` clause on that UPDATE branch causes Postgres
to skip the *entire* update — including the `free_limit` pin — whenever the row is already at or above the
limit, so a historically stored `free_limit` was corrected only in the value the RPC *returned*, never in the
row actually stored in the database for a rejected call. The bridge is now a self-contained, independent,
non-delegating two-step reservation directly on `public.ai_usage_daily`:

- **Step A (unconditional):** `INSERT ... ON CONFLICT DO UPDATE SET free_limit = p_free_limit, updated_at =
  now();` — no `WHERE` clause, so this always runs and always pins the stored `free_limit` to the current
  server policy, whether or not step B below goes on to approve the call. Taking the row lock here (even
  when only `free_limit` changes) serializes any concurrent caller for the same `(user_id, usage_date_kst)`
  key until this transaction commits.
- **Step B (conditional):** a separate `UPDATE ... SET used_count = used_count + 1 ... WHERE used_count <
  p_free_limit;` — increments by exactly one only while strictly below the server policy value; eligibility
  is never compared against the stored `free_limit` column, only against `p_free_limit`. `allowed` is set
  from PL/pgSQL's `found` variable, true only when this call actually incremented.
- **Step C:** re-selects the now-already-pinned row and reports it directly — `free_limit` in the response
  is always `p_free_limit`, in every case, including rejection.

Verified against all required policy cases: first/third/fourth same-day execution; a historically higher
stored limit both at and below the new boundary (now corrected to the current policy in the stored row, not
just the response, even when step B rejects); a historically lower stored limit; a stored count already at
or above the current limit; and concurrent calls for the same user/day (step A's unconditional, `WHERE`-free
`ON CONFLICT DO UPDATE` always takes the row lock, so exactly one concurrent caller's step B increment
succeeds and the final stored state is deterministic). `public.refund_chart_ai_usage_v1` is unchanged and
was reviewed for compatibility: it floors with `greatest(used_count - 1, 0)`, so a historical row whose
`used_count` exceeds a newly-pinned lower limit still cannot refund to a negative value. No new migration
file was created, no DB was mutated, and the internal function and all KIS token migrations are untouched.

Both are `revoke all ... from public, anon, authenticated;` then `grant execute ... to service_role;` —
mirrors the established public-bridge pattern from `20260714_kis_token_postgrest_rpc_bridge.sql`. No new
schema, no new table, no `internal` exposure through PostgREST, no user-callable RPC, no change to any
existing KIS token migration. **Not applied to any environment this phase** — DB application is an
Owner-confirm item, same as the PR #1 base-schema migrations.

## 4. Server usage module

`src/lib/server/chartAiUsage.ts` exports `consumeChartAiUsage(userId)` / `refundChartAiUsage(userId)`, both
calling the public bridge RPCs above via `getSupabaseAdminClient().rpc(...)` — never `.schema('internal')`.
Single authoritative `defaultFreeLimit = 3`. Normalized state
`{ allowed, used, limit, remaining, usageDateKst, reason }` with
`reason: 'allowed' | 'limit_reached' | 'usage_guard_unavailable'`. Fails closed
(`usage_guard_unavailable`) on missing server config, RPC error, or a malformed/empty row; never throws;
never logs the user id, token, service-role key, or any raw RPC payload. Refund is best-effort and never
throws — a refund failure never surfaces as a route error. Both functions accept injectable
`getClient`/`isConfigured` parameters (mirroring `kisTokenStore.ts`'s `createSupabaseKisTokenDb` pattern) so
the RPC-call path is fully exercisable offline without a real Supabase client.

## 5. Route integration (Similarity + MK Analysis only)

`similarity.json.ts` and `mk-analysis.json.ts` both follow the same order: bearer auth → resolve user →
Preview/Production access → params + instrument validation → **reserve one usage execution** → 503
`CHART_AI_USAGE_GUARD_UNAVAILABLE` if the guard is unavailable → 429 `CHART_AI_DAILY_LIMIT_REACHED` if the
limit is reached → only then cache/provider/engine work. A cache hit still counts as one execution (the
reservation happens before the cache lookup, intentionally). On any failure that never produces a usable
analysis (history fetch failure, insufficient history, provider/engine error, uncaught exception), the
reservation is refunded exactly once via a single `refundReservedUsage()` closure. Every response that
carries a usage outcome spreads a `usage` field with the current `ChartAiUsageState`. The local owner
opt-in path skips consume/refund entirely — no Supabase usage row is written. `search.json.ts`,
`ohlcv`/`market/ohlcv.json.ts`, and auth routes are untouched — the guard applies only to the two analytical
routes.

## 6. Admin / master bypass decision

**No bypass.** The only existing admin check, `isCurrentUserSiteAdmin()` (backed by `is_site_admin()` /
`site_admins`), is client-side/browser-RLS-based and used solely to gate a UI banner — it is not an
authoritative server-side resolver either route can trust, and building one is out of scope this phase. The
daily limit therefore applies to every deployed authenticated user, including site admins. This decision is
documented inline in both routes directly above the usage-reservation block.

## 7. `analyze.ts` placeholder

`src/pages/api/chart-ai/analyze.ts` is unused by the live UI (no page calls it). Its independent usage
consumption was removed so it cannot double-consume the shared quota if it were ever re-wired; it keeps its
existing fail-closed auth check and is documented as a deprecated placeholder pointing at the two live
routes as the source of truth.

## 8. Client UX

`chart-ai.astro`'s real-experience branch (`chartAiRealExperienceRuntime`) gained one shared, `aria-live`
usage notice (`#chartAiUsageNotice`) reused by both the Similarity and MK Analysis panels, plus a single
shared in-memory `chartAiUsageDisplayState`:

- Initial authenticated copy: "유사 패턴과 MK AI 분석은 합산 하루 3회 제공됩니다."
- After any usage-carrying response: "오늘 남은 분석 횟수: {remaining}/{limit}" (server-reported values only).
- Exhausted: "오늘 사용 가능한 분석 횟수를 모두 사용했습니다. 자정 이후 다시 이용해 주세요." — both start
  buttons disable via `updateAnalysisAvailability`'s `usageBlocked` check, independent of instrument
  readiness.
- Guard unavailable: "분석 사용량을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."

No automatic usage request on page entry (the notice element sits inside the already-gated
`<main data-chart-ai-auth-body hidden>`, so it satisfies the zero-request unauthenticated contract for
free). `runSimilarity`/`runMkai` both handle top-level 429/503 before reading the nested analytical payload
and apply any returned `usage` field, including on otherwise-blocked responses. No `localStorage` usage
authority; no client-computed KST boundary.

## 9. Tests

- `smoke:phase-3gg-u-chart-ai-usage` — 13/13 (`scripts/chart_ai_usage_testsrc.ts`, esbuild-bundled fake
  recording client: consume/refund success, exhausted, RPC error, malformed row, not-configured, plus
  global "only the two approved public RPC names, never `internal.*`, no secret-like value" assertions).
- `check:phase-3gg-u-chart-ai-live-usage-guard` — new static contract checker (migration shape/grants,
  usage-module fail-closed behavior, route integration order and exact codes/Korean copy, `analyze.ts`
  placeholder treatment, client notice copy/state/button-gating, out-of-scope immutability, secret scan,
  working-tree purity).
- Regression: `check:phase-3gg-t-hf1`, `check:phase-3gg-t-hf3a`,
  `check:phase-3gg-t-hf3b-hf2-hf2b`, `check:phase-3gg-r-fast`,
  `check:phase-3gg-t-hf3b-hf2-hf2b-hf1`, `check:phase-3gg-t-hf2`, `check:phase-3gg-t-hf2-hf1`, and
  sibling fast-checkers — re-run after extending each affected checker's working-tree-purity tolerance list
  for this phase's new/changed files (the same reconciliation pattern used by every prior phase that touched
  shared files).

## 10. Immutability

KIS durable token provider/store/migrations, the similarity scoring engine, MK AI analysis engine, the
instrument master + manifest, and the KIS instrument-master-refresh workflow are all byte-for-byte unchanged
this phase (verified via `git diff --name-only` against the branch baseline). No dependency changes
(`package-lock.json` untouched). No account/order/balance/trading endpoint added.

## 11. Git / safety

One implementation commit (`Phase 3GG-U: enforce live Chart AI daily usage guard`), pushed to
`feature/phase-3gg-u-chart-ai-live-usage-guard` only. One PR opened targeting `main`. No merge, no
auto-merge, no push to `main`, no migration applied, no Production env/deploy change, no Vercel
project-setting change, no dependency install/upgrade, no history rewrite.

## 12. Resume point

Owner-only, separate decision: review the PR, apply the `20260723` migration via the Dashboard SQL Editor
(after confirming the same additive-only review applied to prior migrations), confirm the two
`public.*_chart_ai_usage_v1` functions are `service_role`-executable only, then merge → Preview/Production
usage-guard QA (verify 429 at the 4th same-day execution, 503 simulated-unavailable behavior, and the KST
midnight reset) before treating the guard as live for real users.
