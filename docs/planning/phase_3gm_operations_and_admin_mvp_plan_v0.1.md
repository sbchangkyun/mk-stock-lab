# Phase 3GM — Operations and Admin MVP (Plan v0.1)

Baseline: `origin/main` = `dc4f3b0c018aa16acee3d6c4bcaced5bc7ca1df4` (Phase 3GL-HF4 merge).
Branch: `feature/phase-3gm-operations-admin-mvp`.

## 1. Objective

Provide one minimal, authenticated, **administrator-only, READ-ONLY** operational surface exposing
internal visibility into three signals that today are only inspectable via ad hoc Owner scripts or
direct Supabase Dashboard queries:

1. Chart AI usage-guard counters
2. KIS token health
3. Quote/market-data cache staleness

No trading, account, order, balance, mutation, or secret-management feature is added.

## 2. Reused existing mechanisms (nothing new invented)

| Concern | Reused module | Notes |
| --- | --- | --- |
| Authenticated user resolution | `validateUserFromBearerToken` (`src/lib/server/supabaseAdmin.ts`) | Same validator used by the Chart AI + Portfolio routes. |
| Admin registry | `public.site_admins` (migration `20260625_site_admins_and_settings.sql`) | Row presence = admin. Same contract as the existing client-side `isCurrentUserSiteAdmin`. |
| Service-role DB access | `getSupabaseAdminClient` / `isSupabaseServerConfigured` | Existing helper; no new key, no new grant. |
| Usage guard store | `public.ai_usage_daily` (base schema `20260615`), policy limit `defaultFreeLimit` from `src/lib/server/chartAiUsage.ts` | Read-only aggregate select; the write path (`consume_chart_ai_usage_v1`) is untouched. |
| KIS token lifecycle | `resolveKisDurableTokenConfig`, `createSupabaseKisTokenDb().readState`, `kisTokenManager.peekL1()`, `getKisQuoteConfigReadiness` | Metadata only. |
| Quote/OHLCV caches | `normalizedOhlcvCache` (`universalOhlcvProvider.ts`), GNews home cache (`gnewsHomeNewsProvider.mjs`), Frankfurter FX caches (`crossAssetProvider.mjs`) | New additive read-only `inspect*` accessors. |
| Client transport | `chartAiAuthenticatedFetch` (`src/lib/chart-ai/chart-ai-authenticated-fetch.ts`) | Same-origin + Supabase Bearer; already used by the protected Chart AI pages. |
| Protected page pattern | `src/pages/portfolio.astro` | Readiness → lock card → workspace, `mk:open-auth` event. |
| Route conventions | `src/pages/api/home/live-market.json.ts`, `src/pages/api/chart-ai/mk-analysis.json.ts` | `prerender = false`, `jsonResponse` helper, `Cache-Control: no-store`, `export const ALL` → 405. |

### 2.1 Judgment call — server-side admin authorization

The only pre-existing admin check, `isCurrentUserSiteAdmin` in `src/lib/siteSettingsClient.ts`, is a
**browser/RLS-based** check and is explicitly documented in `mk-analysis.json.ts` as *not* an
authoritative server-side resolver. Phase 3GM therefore adds a server-side resolver that reads the
**same** `public.site_admins` registry with the existing service-role client. This is reuse of the
existing admin contract, **not** a second role system: no new table, no new column, no new grant, no
new RLS policy, no migration.

## 3. Deliverables

### Server aggregator — `src/lib/server/adminOperations/`

- `adminOperationsTypes.ts` — closed status enum (`healthy` | `warning` | `unavailable`), sanitized code set.
- `adminAuthorization.ts` — `resolveAdminAccess()`: bearer validation → `site_admins` lookup. Fail-closed.
- `usageGuardOperations.ts` — section **A** (usageGuard).
- `kisTokenOperations.ts` — section **B** (kisToken).
- `quoteCacheOperations.ts` — section **C** (quoteCaches).
- `operationsOverview.ts` — composes A+B+C into one sanitized contract.

All modules are fully dependency-injected so the smoke suite runs with zero real network/DB access.

### Route — `GET /api/admin/operations/overview`

`src/pages/api/admin/operations/overview.ts`. GET only (`ALL` → 405), auth then admin check **before**
any operational read, `Cache-Control: no-store`, no query parameters, no raw exception output.

### Page — `/admin/operations`

`src/pages/admin/operations.astro`. Signed-out/non-admin users see only a lock/denied card; the
workspace markup stays hidden and no operational fetch is issued. Manual refresh only (no
auto-refresh, no polling), single request per load, in-flight guard, last-good preservation, no
`localStorage`, no cache-bypass parameter. No nav entry is added (the repo has no admin nav).

## 4. Field contract

**A. usageGuard** — `status`, `usageDateKst`, `dailyLimit`, `totalGuardedExecutionsToday`,
`distinctUserCountToday`, `usersAtLimitCount`, `mostRecentGuardedExecutionAt`, `storeReady`,
`sanitizedErrorCode`. Never any user identity.

**B. kisToken** — `status`, `kisConfigReady`, `kisConfigReason`, `durableStoreReady`,
`l1TokenPresent`, `l2TokenPresent`, `tokenExpiresAt`, `remainingLifetimeSeconds`, `tokenStale`,
`tokenExpired`, `lastIssueSuccessAt`, `sanitizedErrorCode`. Never the token, ciphertext, IV, auth
tag, encryption key, scope key or namespace. Inspection never issues or refreshes a token.

**C. quoteCaches** — per cache: `id`, `scope`, `dataType`, `durability` (`instance-local`),
`entryCount`, `configuredTtlSeconds`, `newestEntryAgeSeconds`, `oldestEntryAgeSeconds`,
`freshCount`, `staleCount`, `expiredCount`, `lastSuccessfulUpdateAt`, `status`,
`sanitizedErrorCode`. Never a cached market payload. Inspection triggers no provider request.

## 5. Health semantics (closed enum)

`healthy` / `warning` / `unavailable`. Configuration presence alone never yields `healthy`:
configured-but-expired token → `unavailable`; near-expiry → `warning`; durable store unreachable →
`unavailable`; usage store absent → `unavailable`; empty instance-local cache before first request →
`healthy` with an honest never-populated note (not an error); stale entries → `warning`.

## 6. Testing

- `npm run smoke:phase-3gm-operations-admin-mvp` — esbuild-bundled `scripts/admin_operations_testsrc.ts`,
  injected fakes only, zero real KIS/GNews/Frankfurter/Supabase/Vercel calls.
- `npm run check:phase-3gm-operations-admin-mvp` — static contract + secret scan + NUL-byte scan.
- Focused regressions: 3GL, 3GJ, 3GG-U, 3GG-T-HF1, 3GG-T-HF2, 3GG-T-HF2-HF1.

## 7. Explicit non-goals

No migration, no environment-variable change, no manual deploy, no merge. No cache purge, token
refresh/revoke, counter reset, role editing, feature-flag editing, or env editing control anywhere in
the API or the UI.
