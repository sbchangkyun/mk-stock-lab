# Phase 3GM — Operations and Admin MVP (Result v0.1)

Baseline: `origin/main` = `dc4f3b0c018aa16acee3d6c4bcaced5bc7ca1df4` (Phase 3GL-HF4 merge, PR #9,
closeout comment: https://github.com/sbchangkyun/mk-stock-lab/pull/9#issuecomment-5156323909).
Branch: `feature/phase-3gm-operations-admin-mvp`.

Status: **IMPLEMENTED (original + HF1 + HF2 + HF3), TESTED LOCALLY, PUSHED, PR OPENED — Owner
functional verification of HF1 is complete (see §0b); Owner visual/UX verification of the HF2 redesign
and Owner final visual verification of HF3 are pending; authenticated non-admin (403) verification
remains pending.** No merge, no manual deploy, no environment-variable change, no Supabase migration
was performed.

## 0. Phase 3GM-HF1 hotfix (same branch, same PR #10, 2026-08-02)

A follow-up hotfix corrected two display-layer defects found before Owner Preview verification of the
original commit `8fc3372`:

1. **Visible Korean text corruption.** `src/pages/admin/operations.astro`'s initial (pre-load)
   "last refreshed" placeholder rendered a corrupted variant of the intended `마지막 갱신: -` string
   (its second syllable had been replaced by a Unicode replacement character, U+FFFD, in the source
   literal) instead of the intended text. The dynamically-rendered
   post-load label further down the same file (`renderOverview()`) was already correct — only the
   static placeholder was corrupted. The complete Phase 3GM diff (all files touched in `8fc3372`) was
   re-scanned for any other U+FFFD occurrence; none was found.
2. **Incorrect normalized-OHLCV cache age contract.** `src/lib/server/adminOperations/quoteCacheHealth.ts`
   previously derived `newestEntryAgeMs` for the `normalized-ohlcv-cache` entry from remaining TTL
   (`msUntilExpiry`), which is not the same as entry age — TTL can be refreshed independent of
   insertion time, and the underlying cache (`src/lib/server/chart-ai/normalizedOhlcvCache.mjs`) never
   stores an insertion timestamp to begin with. `newestEntryAgeMs`, `oldestEntryAgeMs`, and
   `lastSuccessfulUpdateAtIso` for that cache entry now honestly return `null` rather than a fabricated
   value. `entryCount`, `freshCount`, `expiredCount`, `status`, and `durability: 'instance-local'` are
   unchanged. The **other** cache entry (`current-price-quote-cache`) was already correctly
   timestamp-derived from real `cachedAtMs` values in `quoteCache.ts` and remains untouched and
   unaffected by this fix (confirmed by a new regression assertion in the smoke suite).

This was a **display/aggregation-layer correction only** — no change to any existing cache's data
model, keys, values, TTLs, eviction, LRU, or single-flight behavior. The four existing-system files
the original Phase 3GM PR modified to add read-only inspection hooks (`normalizedOhlcvCache.mjs`,
`universalOhlcvProvider.ts`, `quoteCache.ts`, `kisClient.ts`) were **not** touched again in this
hotfix; a new checker assertion (`Group 12`) diffs each against the pre-3GM baseline commit `dc4f3b0`
and asserts zero deleted lines, confirming they remain purely-additive, unchanged read-only inspection
hooks. No migration, no environment-variable mutation, no Supabase change, no provider/KIS request,
and no token issuance occurred as part of this hotfix. Full detail in `planning_changelog.md`'s
"Phase 3GM-HF1" entry and in §6/§10 below.

## 0b. Phase 3GM-HF2 hotfix — UI/UX completion pass (same branch, same PR #10, 2026-08-03)

Owner completed an authenticated click-through of the HF1 commit and confirmed the page was
**functionally correct** (signed-out lock state shown correctly, admin sees full real data, no
secret/PII leakage) but **not visually release-ready**: an oversized English-first heading, the
site-wide floating slide-ad and bottom ad banner bleeding into the admin screen, a lock icon floating
off-center at the left edge in the signed-out state, plain 예/아니오-style KIS booleans, and a login
button that was never actually shown for the signed-out case. HF2 is a **presentation-layer-only**
rewrite of `src/pages/admin/operations.astro` addressing all of these; it changes **zero** API
response fields/shape, authorization logic, Supabase queries, usage-aggregation logic, KIS
token-inspection logic, cache-inspection logic, cache TTL behavior, or KIS issuance behavior.

- **Korean-first header**: eyebrow "관리자 전용", a single `<h1>운영 현황</h1>` with a scoped
  `.ops-h1 { font-size: 28px; }` override (previously inherited the site's bare global
  `h1 { font-size: 44px; }` rule with no override — the root cause of the oversized heading), and
  "Operations Overview" kept only as a small non-heading subtitle.
- **Client-side-only overall status**: a `worstStatus()` precedence helper (`unavailable` >
  `warning` > `healthy`) derives one "전체 상태" summary card purely in the browser from the three
  already-returned closed statuses (`usageGuard.status`, `kisToken.status`, worst of
  `quoteCaches[].status`). **No new API field was added** — `overview.json.ts`,
  `operationsAggregator.ts`, and `types.ts` are byte-for-byte unmodified by this hotfix.
- **Shared badge component**: one `buildBadge()` builder used everywhere a status is shown, always
  pairing an `aria-hidden` icon with a visible 정상/주의/정보 없음 text node (never color-only), with
  a dark-mode-safe warning color override.
- **Section A (Chart AI 사용량)**: promotes 오늘 사용 횟수 / 이용자 수 / 한도 도달 이용자 수 / 일일
  한도 to a top highlight-stat row; 기준 날짜 / 가장 최근 사용 시각 / 저장소 상태 moved to a
  secondary detail row.
- **Section B (KIS 토큰 상태)**: replaces plain 예/아니오 booleans with semantic wording
  (사용 가능/비활성, 토큰 있음/토큰 없음, 만료되지 않음/만료 또는 사용 불가); shows a
  "현재 운영 영향 없음" note **only** when `durableStoreReady` is false **and** the returned overall
  `kis.status` is genuinely `'healthy'` — never when the real status is `warning`/`unavailable`.
- **Section C (시세 캐시 상태)**: per-cache sub-cards (2-col desktop / 1-col mobile) with an honest
  empty-state ("현재 인스턴스에 저장된 캐시가 없습니다." / "실제 시세 조회 후 상태가
  표시됩니다.") when `entryCount === 0`, conditional age/update rows shown only when non-null, and
  the exact HF1-established null-age note ("이 캐시는 생성 시각을 저장하지 않아 항목 나이를
  제공하지 않습니다.") otherwise — no change to the underlying null-vs-real-age contract from HF1
  (§0/§7).
- **Instance-local disclosure**: a fixed notice above the cache cards
  ("캐시 정보는 현재 요청을 처리한 서버 인스턴스 기준입니다. 전체 Production 인스턴스의 합산
  상태가 아닙니다.").
- **Refresh toolbar**: last-refreshed timestamp left, a styled refresh button right; the existing
  `refreshInFlight` overlap guard is preserved (early-`return`, not replaced with an
  `AbortController`); the button label toggles 새로고침 ↔ 갱신 중 while a request is in flight; a
  `role="status" aria-live="polite"` region announces "운영 현황을 갱신했습니다." on success and
  "최신 정보를 불러오지 못해 이전 결과를 표시합니다." on failure while the previous good `lastGoodOverview`
  stays visible (this replaces HF1's shorter "이전 데이터를 표시합니다" copy with a more complete
  sentence — the underlying stale-data-preservation behavior is unchanged).
- **Signed-out lock state, bug fixed**: `#admin-ops-login-action` previously carried a hard-coded
  `hidden` attribute that was **never removed** for the signed-out (401) case — the login CTA was
  invisible exactly when it was most needed. It is now shown via `classList.remove('hidden')`
  whenever the signed-out state is entered, and dispatches the exact same
  `window.dispatchEvent(new CustomEvent('mk:open-auth'))` event used by `Header.astro`,
  `portfolio.astro`, and `chart-ai.astro` (no new auth-trigger mechanism invented). The lock-state
  container also gained `display: grid; justify-items: center;` (matching `portfolio.astro`'s
  `.portfolio-lock-state`), fixing a second bug where the shared 76×76px lock icon rendered pinned to
  the left edge instead of centered (the previous container only had `text-align: center`, which does
  not center a block-level child).
- **Non-admin (403) state**: distinct title "접근 권한이 없습니다" and copy
  "이 화면은 등록된 관리자만 볼 수 있습니다.", with the login button explicitly hidden (no CTA is
  offered for a state a login action cannot fix).
- **Admin-page-only distraction removal**: `<Layout pageClass="admin-operations-page">` (using
  `Layout.astro`'s existing, unmodified `pageClass` prop — the same convention already used by
  `index.astro`'s `home-page` class) plus a `:global()` rule scoped to
  `body.admin-operations-page #slidePopup` / `#bottomAdBanner`, hiding only the floating slide ad
  (`SlideAd.astro`) and the bottom ad banner (`Footer.astro`) on this one page. The wrapping
  `#bottomDocumentArea` (which also contains the real `<footer class="site-footer">`) is intentionally
  **not** hidden, so the real site footer is unaffected. Verified via the static checker that
  `index.astro` does not carry the admin-only `pageClass` and that `Layout.astro` itself was not
  touched.
- **Responsive/accessibility**: summary and highlight-stat grids collapse 4→2→1 columns at 900px/640px
  breakpoints; the cache grid collapses 2→1 column at 640px; a visible `:focus-visible` outline on all
  interactive controls; `@media (prefers-reduced-motion: reduce)` disables the refresh-icon spin; all
  decorative icons carry `aria-hidden="true"`; no external icon-font/library dependency was added (all
  icons are small inline `<svg>` markup built at runtime).

**Test-file scope decision**: `scripts/admin_operations_testsrc.ts` (the esbuild-bundled smoke suite)
exercises only the server-side pure functions (`authorizeAdminOperationsRequest`,
`getUsageGuardOverview`, `getKisTokenOverview`, `getQuoteCacheOverview`) via injected fakes — it has no
DOM/UI assertions and none of those functions changed in this hotfix, so it was left unmodified
(44/44 unchanged). All new UI-text/behavior/accessibility/responsive assertions for this hotfix were
instead added to the static checker (`scripts/check_phase_3gm_operations_admin_mvp_contract.mjs`,
new **Group 13**, 42 new checks), plus two pre-existing Group 7 assertions were updated in place to
match intentional new copy (the failure-notice wording, and the section headings moving from
mixed English/Korean to fully Korean) without weakening what they guarantee. See §6 for totals.

While updating this doc for HF2, one **pre-existing, HF2-unrelated** static-checker false-positive was
also corrected: `Group 10`'s repo-wide U+FFFD scan was flagging this result doc and
`planning_changelog.md` themselves, because both files' HF1 section quoted the corrupted string
verbatim (as an example of the bug) with the literal replacement character embedded in the Markdown.
Both docs were confirmed unmodified since the HF1 commit before this edit (`git diff` against `HEAD`
was empty for both paths), so this was not something HF2 introduced — the illustrative text was
reworded above (§0) to describe the corruption without embedding the literal character, preserving the
same historical meaning.

Owner authenticated visual/interaction re-verification of the HF2 redesign (mobile 375-390px,
touch/keyboard, non-admin 403 state specifically) is still **pending** — this hotfix has not yet had a
fresh Owner Preview QA pass performed against it.

## 0c. Phase 3GM-HF3 hotfix — honest operations-unavailable state (same branch, same PR #10, 2026-08-03)

HF2 completed the dashboard UI (§0b) but left one state-model defect in
`src/pages/admin/operations.astro`'s client-side script: **authentication denial and
operational-data unavailability were conflated.** Concretely, before this hotfix:

- On the very first load, if the authenticated-admin overview fetch failed for any reason other than
  HTTP 401/403 (a `500`, another non-401/403 HTTP status, invalid JSON, or a network exception) **and**
  no `lastGoodOverview` existed yet, the code either did nothing visible (leaving the page stuck on
  "로그인 상태를 확인하는 중입니다.", the checking state) or — in the `catch` branch specifically —
  incorrectly called `showLockState('signed-out')`, telling a genuinely signed-in, genuinely
  admin-authorized user that they needed to log in, which was false.
- There was no dedicated UI state at all for "you are authenticated and authorized, but the
  operational data itself could not be read right now" — every failure mode was forced into either the
  lock state, the checking state, or (only when a previous good load already existed) the existing
  HF2 stale-data notice.

This hotfix is a **narrow, additive fix to the client-side state machine only** — it does not redesign
the HF2 dashboard, does not touch the API route, the aggregator, any `adminOperations/*` health-read
module, `kisClient.ts`, `quoteCache.ts`, `normalizedOhlcvCache.mjs`, or `universalOhlcvProvider.ts` (all
verified byte-for-byte unchanged vs. the pre-HF3 baseline commit `82cfbc36a3f747602c9a215be5e4dfc9428a024b`
by a new checker git-diff guard, §6).

- **New dedicated state**: `#admin-ops-unavailable-state`, a fourth top-level state reusing HF2's
  existing `.ops-status-card` / `.ops-status-icon` / `.ops-status-copy` / `.ops-primary-btn` /
  `.ops-eyebrow` classes verbatim (no new CSS was written). Title "운영 정보를 불러오지 못했습니다",
  copy "로그인과 관리자 권한은 확인되었지만 현재 운영 데이터를 조회할 수 없습니다.", and a
  `#admin-ops-retry` "다시 시도" button that calls the same, single `loadOverview()` function used by
  the refresh button and the initial load — there is no second/duplicate fetch implementation.
- **Exactly four mutually-exclusive top-level states**: checking / auth-lock (signed-out or non-admin,
  same element as before, swapped copy) / unavailable (new) / dashboard-body. `showOnly()` now hides
  all four before revealing one, so no two can ever be visible simultaneously.
- **State-model fix**: a single new `handleOperationalDataUnavailable()` function is now the one place
  that decides what happens on any operational-read failure (HTTP failure other than 401/403, invalid
  JSON, malformed payload shape, or a network/runtime exception): if `lastGoodOverview` already exists,
  it keeps showing the dashboard with the existing HF2 stale-notice text ("최신 정보를 불러오지 못해
  이전 결과를 표시합니다.", unchanged, byte-for-byte) — this is the pre-existing, still-correct
  behavior for a refresh failure after a prior success. If no `lastGoodOverview` exists yet, it shows
  the new unavailable state — never the checking state, never the signed-out/non-admin lock copy. HTTP
  401 and 403 continue to route to the unchanged `showLockState('signed-out' | 'non-admin')` calls,
  verified still reachable.
- **New payload-shape validation**: `isValidOverviewShape()` checks that a parsed success payload
  actually has a string `generatedAtIso`, object `usageGuard`/`kisToken`, and an array `quoteCaches`
  before it is ever accepted as "good" data — a 200 response with syntactically-valid but
  unexpectedly-shaped JSON is now treated the same as any other operational-read failure, not rendered
  as a dashboard. This does not change what fields the client expects, only what it is willing to
  trust.
- **Retry button behavior**: shares the same busy-state toggle (`setControlsBusy()`) as the existing
  refresh button — disabled and `aria-busy="true"` while a request is in flight (guarded by the
  existing `refreshInFlight` flag, so refresh and retry can never overlap), label toggles "다시 시도" ↔
  "다시 시도 중", and restores after completion regardless of success or failure. No polling, no
  `setInterval`/`setTimeout` loop, no cache-bypass query parameter, no `alert()`, and no `localStorage`
  persistence were added.

**Test-file scope decision (same convention as HF2)**: `scripts/admin_operations_testsrc.ts` exercises
only server-side pure functions, none of which changed in this hotfix, so it was left unmodified
(44/44 unchanged). All new state-machine/text/behavior assertions for this hotfix were added to the
static checker (`scripts/check_phase_3gm_operations_admin_mvp_contract.mjs`, new **Group 14**, 41 new
checks) — every pre-existing Phase 3GM-HF1/HF2 assertion was preserved, none deleted or weakened. See
§6 for totals.

Owner final visual verification of this hotfix (confirming the new unavailable state renders correctly
on Preview, and that the retry button recovers the dashboard) is **pending**. Authenticated non-admin
(403) verification carried over from HF2 also remains **pending** — both are Owner-only Preview QA
steps outside this hotfix's local-implementation scope.

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

`src/pages/admin/operations.astro`. Mirrors the `portfolio.astro` auth-gate pattern, extended in HF3
(§0c) to a `checking → lock/denied → unavailable → body` four-state machine using
`getBrowserSupabaseClient()` / `isSupabaseConfigured()` (reused, unchanged). Signed-out or non-admin
users only ever see the lock card; the data body markup is never populated before both the session
check and the route's own 401/403 response are handled; an authenticated admin whose overview read
fails for any other reason (HTTP failure, invalid JSON, malformed payload shape, or a network/runtime
exception) sees the dedicated unavailable state instead of being misclassified as signed-out or left on
the checking state (HF3 fix, §0c). Exactly one fetch on initial load (`loadOverview()` called once,
guarded by `refreshInFlight` against overlap); one manual "새로고침" (refresh) button plus (as of HF3) a
"다시 시도" (retry) button on the unavailable state, both calling the same single `loadOverview()`
implementation; last-good data is preserved on a failed refresh (the existing HF2 "최신 정보를
불러오지 못해 이전 결과를 표시합니다." notice is shown, dashboard stays visible — unchanged by HF3); no
`localStorage`; no cache-bypass query parameter; no `setInterval`/polling. There is no repo-wide
`/admin` nav convention (confirmed via `Glob src/pages/admin/**` before this phase — this page is the
first file under that path), so per the task's own instruction, **no new public nav item was added**.

## 6. Testing

### New tests (Phase 3GM)

- `npm run smoke:phase-3gm-operations-admin-mvp` → esbuild-bundles `scripts/admin_operations_testsrc.ts`
  and runs it. **44/44 passed** (38/38 original + 6 new HF1 assertions). Covers: authorization
  (signed-out, bad scheme, non-admin, admin, admin-check-failure parity, config-missing,
  no-identity-leak), usage guard (healthy aggregate, empty day, config-unavailable, read-failure with
  no raw DB error leaked), KIS token (legacy L1 valid, legacy expired, legacy absent, durable healthy,
  durable store-unavailable, durable misconfigured, snapshot-throws, and a cross-scenario assertion
  that no scenario ever returns an `accessToken` field), quote/OHLCV caches (fresh, empty/never-called,
  all-expired, snapshot-throws, an assertion that no cache-health scenario ever invokes a
  provider/network function, and (HF1) that the normalized-OHLCV summary's `newestEntryAgeMs`/
  `oldestEntryAgeMs`/`lastSuccessfulUpdateAtIso` stay `null` even when the fake snapshot supplies
  `msUntilExpiry` values, while the current-price cache's age fields stay real/non-null pass-throughs).
- `npm run check:phase-3gm-operations-admin-mvp` → static contract checker. **185/185 passed** (144/144
  after HF2 + 41 new HF3 Group 14 assertions). Covers file existence,
  reused-resolver/reused-registry assertions, no-second-admin-system assertion, no-mutation-control
  assertions (cache purge/token refresh/role edit/trading/order/balance/env-edit — all absent),
  no-secret/PII assertions (no `accessToken` field, no email selection, no hardcoded
  bearer/service-role literal), closed health-enum assertions, additive-reuse assertions (health
  snapshot functions never call `acquire`/`getTokenHandle`/`delete`/`set`), UI-page behavior assertions
  (auth gate, single fetch, manual refresh, in-flight guard, last-good preservation, no `localStorage`,
  no cache-bypass param, no polling, no mutation control, Korean section labels), nav convention
  assertion (`Layout.astro` unmodified), package.json wiring assertions, (HF1, Groups 10-12) a
  repo-wide U+FFFD scan across every Phase 3GM UI/lib/doc file, an exact-match assertion on the
  corrected `마지막 갱신: -` label, source-level assertions that OHLCV age is never computed from
  `msUntilExpiry`/`configuredTtlMs` arithmetic, an additive-diff guard (`git diff dc4f3b0..HEAD
  --numstat`) asserting the four reused-cache files have zero deleted lines against the pre-3GM
  baseline, and (HF2, Group 13) single-H1/Korean-header assertions, client-side-only overall-status
  derivation assertions (and that no new `overallStatus`/`overallHealth` field was added to the
  route/aggregator/types), shared-badge honesty assertions, per-section content assertions, KIS
  semantic-wording assertions, the conditional "no operating impact" note assertion, empty/populated
  cache-branch assertions and the null-age note assertion, the instance-local disclosure text
  assertion, refresh-toolbar label-toggle and `aria-live` assertions, the signed-out/non-admin
  lock-state correctness assertions (icon-centering fix, login-button-visibility fix, dispatched
  `mk:open-auth` event, non-admin CTA absence), the admin-page-only ad-suppression scoping assertions
  (present on this page, absent from `index.astro`, `Layout.astro` itself untouched, real footer
  container never hidden), accessibility assertions (`:focus-visible`, reduced-motion,
  `aria-hidden` icons), and responsive-breakpoint assertions; and (HF3, Group 14, §0c) the new
  unavailable-state element and exact title/copy text, the four-state `showOnly()` mutual-exclusion
  assertion, the unified `handleOperationalDataUnavailable()` routing assertions (HTTP failure other
  than 401/403, invalid JSON via the `.json().catch(() => null)` collapse, and the new
  `isValidOverviewShape()` malformed-payload guard all route to the unavailable state when no
  `lastGoodOverview` exists, and to the unchanged HF2 stale-notice/dashboard path when it does), the
  catch-block assertion that a network/runtime exception no longer falls back to `showLockState`, the
  retry-button assertions (calls the existing `loadOverview()` with no duplicate `fetch()`, shares the
  busy-state toggle with refresh, label restores after completion, no login CTA inside the unavailable
  section), the still-reachable HTTP 401/403 lock-state assertions, the no-new-polling/no-`alert()`
  assertions, and a git-diff zero-change guard against the pre-HF3 baseline commit for every
  API/server/provider/cache "do not touch" file.

### Focused regression suites for reused modules (all passed, zero real network)

- `npm run smoke:phase-3gg-t-hf2` (KIS durable token lifecycle) — **44/44 passed**.
- `npm run smoke:phase-3gg-t-hf2-hf1` (KIS PostgREST RPC bridge) — **11/11 passed**.
- `npm run smoke:phase-3gg-u-chart-ai-usage` (Chart AI usage guard RPC contract) — **13/13 passed**.
- `npm run smoke:phase-3gg-op-fast` (symbol search + OHLCV normalization/caching path) — **32/32 passed**.
- Re-run identically after the HF1 hotfix (§0) — all four totals unchanged, confirming the hotfix (a
  display/aggregation-layer-only change) did not touch any of these reused code paths' behavior.
- Re-run identically again after the HF2 hotfix (§0b) — all four totals unchanged (44/44, 11/11,
  13/13, 32/32), confirming the presentation-only UI redesign did not touch any of these reused code
  paths' behavior either.
- Re-run identically again after the HF3 hotfix (§0c) — all four totals unchanged (44/44, 11/11,
  13/13, 32/32), confirming the client-only state-machine fix did not touch any of these reused code
  paths' behavior either.

### Environment/repo-hygiene checks

- `npm ls --depth=0` — clean, no missing/invalid peer dependency issues.
- `git diff --check` — clean (only benign LF/CRLF line-ending warnings on two pre-existing files, no
  actual whitespace-error conflict markers).
- Manual secret scan (regex for API-key/JWT/AWS-key/PEM-private-key patterns) + NUL-byte scan run
  directly against every new/changed file path (17 files: the four additive edits, the six new
  `adminOperations/*.ts` modules, the route, the UI page, the two new test/smoke/check scripts, the
  test-source module, `package.json`, and this phase's plan doc) — **clean on every file** (no NUL
  byte, no secret-pattern match).

**HF2 re-run**: `npm ls --depth=0` re-run — still clean. `git diff --check` re-run against the HF2
working tree — clean (only benign LF/CRLF line-ending warnings on the three HF2-touched files, no
actual whitespace-error conflict markers). `git status --short` confirmed exactly the four intended
HF2 files modified (`docs/planning/phase_3gm_operations_and_admin_mvp_result_v0.1.md`,
`docs/planning/planning_changelog.md`, `scripts/check_phase_3gm_operations_admin_mvp_contract.mjs`,
`src/pages/admin/operations.astro`) and every pre-existing untracked path
(`.agents/`, `.claude/`, `.vscode/settings.json`, `docs/handoff/codex_state_inspection/`,
`set-gnews-vercel-env.ps1`, `skills-lock.json`) left untouched.

**HF3 re-run**: `npm ls --depth=0` re-run — still clean (same 8 top-level dependencies, no
missing/invalid peer issues). `git diff --check` re-run — clean (only the same benign LF/CRLF
line-ending warnings, this time on `scripts/check_phase_3gm_operations_admin_mvp_contract.mjs` and
`src/pages/admin/operations.astro`, no actual whitespace-error conflict markers). `git diff --stat`
confirmed only those same two files changed before the documentation-file edits were added, and a new
checker assertion (Group 14, item 23) independently re-verifies via `git diff
82cfbc36a3f747602c9a215be5e4dfc9428a024b..HEAD --numstat` that every "do not touch"
API/server/provider/cache file listed in the hotfix scope has a byte-for-byte-zero diff against the
exact commit this hotfix branched from.

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

**HF1 re-run**: `npm run build` was re-run after the HF1 hotfix (§0) with the identical honest
observation — every reported stage completed (types, server entrypoints, three Vite builds, asset
rearrangement) and both `dist/` and `.vercel/output/{server,static}` were produced (confirmed present
and freshly written), then the Node process exited non-zero. The raw exit code observed this run was
`-1073740791`, which as an unsigned 32-bit value is `0xC0000409` (`STATUS_STACK_BUFFER_OVERRUN`) —
consistent with (though not necessarily byte-identical to) the previously-documented Windows-local
build-exit anomaly, and again not a compilation or type error. Remote Preview confirmation for the
HF1 commit is pending exactly as it was for the original commit.

**HF2 re-run**: `npm run build` was re-run again after the HF2 hotfix (§0b) with the identical honest
observation — every reported stage completed (`[types] Generated`, `[build] output: "server"`,
`Collecting build info...` completed, `Building server entrypoints...` with three separate Vite builds
each reporting `✓ built`, `Rearranging server assets... ✓ Completed`) and both `dist/` and
`.vercel/output/{server,static}` were confirmed present via `Test-Path` immediately afterward, then the
Node process exited non-zero with the exact same raw exit code as the HF1 run, `-1073740791`
(`0xC0000409` / `STATUS_STACK_BUFFER_OVERRUN` as an unsigned 32-bit value) — again not a compilation or
type error, and again only confirmable as non-blocking once the corresponding remote Vercel Preview
build reaches `Ready`.

**HF3 re-run**: `npm run build` was re-run again after the HF3 hotfix (§0c), and additionally
cross-checked directly against `npx astro build` with `dist/` and `.vercel/output` removed
beforehand — every reported stage completed identically (`[types] Generated`,
`[build] output: "server"`, `Collecting build info...` completed, three separate Vite builds each
`✓ built`, `Rearranging server assets... ✓ Completed`), `dist/` and `.vercel/output` were confirmed
present via `Test-Path` immediately afterward, then the process exited non-zero with the exact same raw
code, `-1073740791` (`0xC0000409` / `STATUS_STACK_BUFFER_OVERRUN`). To rule out this HF3 hotfix as the
cause, the working tree was `git stash`ed back to the pre-HF3 commit
(`82cfbc36a3f747602c9a215be5e4dfc9428a024b`) and `npx astro build` was re-run against that unmodified
baseline: it crashed identically, at the identical stage (immediately after
"Rearranging server assets... ✓ Completed"), with the identical exit code. This confirms the anomaly is
fully pre-existing and environment-level, not introduced or affected by this hotfix's client-only
change. The stash was then restored (`git stash pop`) and the checker was re-run (185/185 unchanged)
to confirm no state was lost in the process. Node `v24.14.1`, npm `11.11.0`.

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

**As of HF1 (§0)**: for the `normalized-ohlcv-cache` entry specifically, `newestEntryAgeMs`,
`oldestEntryAgeMs`, and `lastSuccessfulUpdateAtIso` are always `null` — the underlying cache has no
insertion timestamp to report, so these are honestly absent rather than derived from remaining TTL.
`entryCount`, `freshCount`, `expiredCount`, `status`, and `durability` are unaffected. For the
`current-price-quote-cache` entry these three fields are unchanged and remain real,
timestamp-derived values whenever the cache has entries.

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
- **HF3 (§0c) is client-only**: no server route, aggregator, health-read module, provider, token
  manager, cache, Supabase schema/data, environment variable, or Vercel configuration was touched by
  the HF3 hotfix — verified both by the "do not touch" file list this hotfix was scoped against and by
  an independent checker git-diff guard against the pre-HF3 baseline commit. Authentication denial
  (signed-out / non-admin) and operational-data unavailability are now distinct client-side states, but
  the underlying HTTP semantics (401/403/200/500), the bearer-token attachment, and the `site_admins`
  authorization check are all byte-for-byte unchanged. Last-good dashboard preservation on a refresh
  failure (the HF2 stale-notice behavior) is unchanged. Owner final visual verification of the new
  unavailable state, and authenticated non-admin (403) verification carried over from HF2, both remain
  pending.

## 9. Deferred / explicit non-goals

No cache purge, no token refresh/revoke, no counter reset, no role editing, no feature-flag editing,
no environment editing, no Supabase Studio-equivalent admin console, no trading/order/balance
surface, no LLM call, no new external provider. All confirmed absent by the static checker in §6.
