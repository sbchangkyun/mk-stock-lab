# Phase 3GM — Operations and Admin MVP (Result v0.1)

Baseline: `origin/main` = `dc4f3b0c018aa16acee3d6c4bcaced5bc7ca1df4` (Phase 3GL-HF4 merge, PR #9,
closeout comment: https://github.com/sbchangkyun/mk-stock-lab/pull/9#issuecomment-5156323909).
Branch: `feature/phase-3gm-operations-admin-mvp`.

Status: **IMPLEMENTED, TESTED LOCALLY, PUSHED, PR OPENED — Owner Preview verification pending.**
No merge, no manual deploy, no environment-variable change, no Supabase migration was performed.

## 1. Objective (unchanged from plan)

One minimal, authenticated, administrator-only, **read-only** operational surface for: (1) Chart AI
usage-guard counters, (2) KIS token health, (3) quote/market-data cache staleness. No trading,
account, order, balance, mutation, or secret-management feature was added.

## 2. Authorization boundary (as implemented)

- `src/lib/server/adminOperations/adminAuthorization.ts` — `authorizeAdminOperationsRequest(header, deps?)`.
  Order: (1) `validateUserFromBearerToken` (reused, unchanged, from `src/lib/server/supabaseAdmin.ts`)
  — signed-out / invalid token → 401 before any further read; (2) `isSupabaseServerConfigured()` check
  → 503 `ADMIN_OPERATIONS_CONFIG_MISSING` if the server-role client isn't configured; (3) a
  service-role `SELECT ... FROM site_admins WHERE user_id = ?` lookup against the **existing**
  `public.site_admins` registry (migration `20260625_site_admins_and_settings.sql`, not modified, not
  re-created) — not-admin **or** the lookup itself failing both return the identical sanitized
  `403 ADMIN_REQUIRED`, so the response never reveals whether a signed-in account exists in
  `site_admins`. No new admin-role table, column, RPC, or migration was added. `deps` is optional and
  defaults to the real implementations for every production call site (the API route calls it with no
  second argument); tests supply fakes.

## 3. Server aggregator — `src/lib/server/adminOperations/`

| File | Purpose |
| --- | --- |
| `types.ts` | Closed contract types: `OperationsHealthStatus = 'healthy' \| 'warning' \| 'unavailable'`, `UsageGuardOverview`, `KisTokenOverview`, `QuoteCacheSummary`, `AdminOperationsOverview`. |
| `adminAuthorization.ts` | See §2. |
| `usageGuardHealth.ts` | `getUsageGuardOverview(getClient?, isConfigured?)` — reads `public.ai_usage_daily` directly via the existing service-role admin client (already grants `service_role` unrestricted `select` per the base schema migration — no new RPC/migration) for the current Asia/Seoul calendar date, aggregates `totalGuardedExecutionsToday`, `distinctUserCountToday`, `usersAtLimitCountToday`, `mostRecentGuardedExecutionAtIso`. Never returns a `user_id` or email. |
| `kisTokenHealth.ts` | `getKisTokenOverview(deps?)` — reads L1 presence via the new `getKisTokenHealthSnapshot()` (uses the existing `peekL1()` test/inspection accessor; never calls `acquire`/`getTokenHandle`, so a health read can never trigger an OAuth issuance) and, when durable mode is on, L2 presence via the existing `createSupabaseKisTokenDb().readState()` plain read (no lease/issue call). Never returns the plaintext access token. |
| `quoteCacheHealth.ts` | `getQuoteCacheOverview(deps?)` — wraps the two new pure snapshot readers below into two `QuoteCacheSummary` entries, each labeled `durability: 'instance-local'`. |
| `operationsAggregator.ts` | `getAdminOperationsOverview()` — combines the three sections; explicitly documented as **not** re-checking authorization itself (the route must call `authorizeAdminOperationsRequest` first). |

### Additive, non-behavioral exports added to existing modules (reused, not redesigned)

- `src/lib/server/providers/kisClient.ts` — `getKisTokenHealthSnapshot()`: returns `{ configReadiness, durableConfig, l1Present, l1ExpiresAtMs, l1UsableUntilMs }`. Never returns `accessToken`. Fails closed to `l1Present: false` on any internal error.
- `src/lib/server/marketData/quoteCache.ts` — `getQuoteCacheHealthSnapshot(nowMs?)`: pure, non-mutating iteration over the existing `quoteCache` Map (no delete/set).
- `src/lib/server/chart-ai/normalizedOhlcvCache.mjs` — `entriesHealthSnapshot(nowMs?)` method on the cache object: pure read, never evicts/deletes an entry.
- `src/lib/server/chart-ai/universalOhlcvProvider.ts` — `getOhlcvCacheHealthSnapshot(nowMs?)`: thin wrapper calling the above.

None of these four edits change any existing caller's behavior — every new export is additive and
was verified via the focused regression suites in §6.

## 4. Route — `GET /api/admin/operations/overview.json`

`src/pages/api/admin/operations/overview.json.ts`. `prerender = false`. `export const GET` calls
`authorizeAdminOperationsRequest` **before** `getAdminOperationsOverview()` (verified by the static
checker). `export const ALL` rejects every other method with a sanitized `405
METHOD_NOT_ALLOWED`. Every response (success and failure) sets `Cache-Control: no-store`. No query
parameter influences the read. No raw exception/stack trace is ever returned — the one internal
`catch` returns a fixed `500 ADMIN_OPERATIONS_READ_FAILED`.

## 5. UI page — `/admin/operations`

`src/pages/admin/operations.astro`. Mirrors the `portfolio.astro` auth-gate pattern: a
`checking → lock/denied → body` state machine using `getBrowserSupabaseClient()` /
`isSupabaseConfigured()` (reused, unchanged). Signed-out or non-admin users only ever see the lock
card; the data body markup is never populated before both the session check and the route's own
403 response are handled. Exactly one fetch on initial load (`loadOverview()` called once, guarded
by `refreshInFlight` against overlap); one manual "새로고침" (refresh) button; last-good data is
preserved on a failed refresh (only a small "이전 데이터를 표시합니다" notice is shown); no
`localStorage`; no cache-bypass query parameter; no `setInterval`/polling. There is no repo-wide
`/admin` nav convention (confirmed via `Glob src/pages/admin/**` before this phase — this page is the
first file under that path), so per the task's own instruction, **no new public nav item was added**.

## 6. Testing

### New tests (Phase 3GM)

- `npm run smoke:phase-3gm-operations-admin-mvp` → esbuild-bundles `scripts/admin_operations_testsrc.ts`
  and runs it. **38/38 passed.** Covers: authorization (signed-out, bad scheme, non-admin, admin,
  admin-check-failure parity, config-missing, no-identity-leak), usage guard (healthy aggregate, empty
  day, config-unavailable, read-failure with no raw DB error leaked), KIS token (legacy L1 valid,
  legacy expired, legacy absent, durable healthy, durable store-unavailable, durable misconfigured,
  snapshot-throws, and a cross-scenario assertion that no scenario ever returns an `accessToken`
  field), quote/OHLCV caches (fresh, empty/never-called, all-expired, snapshot-throws, and an assertion
  that no cache-health scenario ever invokes a provider/network function).
- `npm run check:phase-3gm-operations-admin-mvp` → static contract checker. **70/70 passed.** Covers
  file existence, reused-resolver/reused-registry assertions, no-second-admin-system assertion,
  no-mutation-control assertions (cache purge/token refresh/role edit/trading/order/balance/env-edit —
  all absent), no-secret/PII assertions (no `accessToken` field, no email selection, no hardcoded
  bearer/service-role literal), closed health-enum assertions, additive-reuse assertions (health
  snapshot functions never call `acquire`/`getTokenHandle`/`delete`/`set`), UI-page behavior
  assertions (auth gate, single fetch, manual refresh, in-flight guard, last-good preservation, no
  `localStorage`, no cache-bypass param, no polling, no mutation control, Korean section labels), nav
  convention assertion (`Layout.astro` unmodified), and package.json wiring assertions.

### Focused regression suites for reused modules (all passed, zero real network)

- `npm run smoke:phase-3gg-t-hf2` (KIS durable token lifecycle) — **44/44 passed**.
- `npm run smoke:phase-3gg-t-hf2-hf1` (KIS PostgREST RPC bridge) — **11/11 passed**.
- `npm run smoke:phase-3gg-u-chart-ai-usage` (Chart AI usage guard RPC contract) — **13/13 passed**.
- `npm run smoke:phase-3gg-op-fast` (symbol search + OHLCV normalization/caching path) — **32/32 passed**.

### Environment/repo-hygiene checks

- `npm ls --depth=0` — clean, no missing/invalid peer dependency issues.
- `git diff --check` — clean (only benign LF/CRLF line-ending warnings on two pre-existing files, no
  actual whitespace-error conflict markers).
- Manual secret scan (regex for API-key/JWT/AWS-key/PEM-private-key patterns) + NUL-byte scan run
  directly against every new/changed file path (17 files: the four additive edits, the six new
  `adminOperations/*.ts` modules, the route, the UI page, the two new test/smoke/check scripts, the
  test-source module, `package.json`, and this phase's plan doc) — **clean on every file** (no NUL
  byte, no secret-pattern match).

### Build

`npm run build` (`astro build`, adapter `@astrojs/vercel`) completed all reported stages
successfully — types generated, server entrypoints built, three Vite builds completed, server assets
rearranged, and both `dist/` and `.vercel/output/{server,static}` were produced — but the Node
process still exited with a non-zero code (**exit code 9**) after all build output had already been
written. This matches the previously-documented **pre-existing Windows-local build anomaly** (an
exit-time native/process issue on this machine, not a compilation or type error) that in prior phases
was only confirmed non-blocking once the corresponding remote Vercel Preview build reached `Ready`.
**That confirmation has NOT been obtained for this commit** — Preview verification is explicitly
listed as pending in §8. Node `v24.14.1`, npm `11.11.0`.

## 7. Field contract (as actually shipped — supersedes the plan doc's placeholder field names)

**A. `usageGuard`** (`UsageGuardOverview`): `status`, `storeReady`, `usageDateKst`,
`configuredDailyLimit`, `totalGuardedExecutionsToday`, `distinctUserCountToday`,
`usersAtLimitCountToday`, `mostRecentGuardedExecutionAtIso`, `sanitizedErrorCode`. No user id, no
email, no per-user row.

**B. `kisToken`** (`KisTokenOverview`): `status`, `kisConfigReady`, `durableStoreReady`,
`durableMisconfigured`, `l1TokenPresent`, `l2TokenPresent`, `tokenExpiresAtIso`,
`remainingLifetimeSeconds`, `staleOrExpired`, `lastIssueOrReuseAtIso`, `sanitizedErrorCode`. No
token, ciphertext, IV, auth tag, encryption key, scope key, or namespace.

**C. `quoteCaches`** (`QuoteCacheSummary[]`, two entries — `current-price-quote-cache`,
`normalized-ohlcv-cache`): `cacheId`, `scope`, `durability: 'instance-local'`, `entryCount`,
`configuredTtlMs`, `newestEntryAgeMs`, `oldestEntryAgeMs`, `freshCount`, `staleCount`,
`expiredCount`, `lastSuccessfulUpdateAtIso`, `status`. No cached market payload, no cache key.

## 8. Explicit disclosures

- **Durable vs. instance-local**: both cache summaries are explicitly labeled
  `durability: 'instance-local'` — they reflect only the current warm serverless instance's
  in-memory state, never a cross-instance/global Production total. The KIS token overview's `l1*`
  fields are similarly instance-local; only the `l2*` fields (when durable mode is on) reflect the
  cross-instance Supabase-backed store.
- **No migration**: zero new tables/columns/RPCs/policies. The usage-guard aggregate reads
  `public.ai_usage_daily` directly because `service_role` already has direct table grants (verified
  in the base schema migration) — no new bridge RPC was needed for a read.
- **No environment-variable mutation**: no `vercel env` command was run; no `.env*` file was touched.
- **No provider call triggered by a health inspection**: the KIS snapshot reader only calls
  `peekL1()` (a pure in-memory read) and, for L2, a plain `readState` select — neither can issue,
  refresh, or invalidate a token. The quote/OHLCV cache readers only iterate already-populated
  in-memory `Map`s.
- **Preview verification pending**: this result records only local implementation and local test
  results. Owner/Preview-level confirmation (chart/route reachability behind Vercel SSO, and
  confirmation that the documented Windows-local build-exit anomaly does not block the remote
  Preview build) has not been performed as part of this phase and remains outstanding.

## 9. Deferred / explicit non-goals

No cache purge, no token refresh/revoke, no counter reset, no role editing, no feature-flag editing,
no environment editing, no Supabase Studio-equivalent admin console, no trading/order/balance
surface, no LLM call, no new external provider. All confirmed absent by the static checker in §6.
