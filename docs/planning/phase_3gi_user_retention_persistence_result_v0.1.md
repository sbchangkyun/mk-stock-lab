# Phase 3GI — User Retention and Persistence — Result v0.1

Implements session restoration hardening, persistent cross-session resume state, and a cross-device watchlist,
authenticated end-to-end and degrading silently (never erroring) while its new migration is unapplied.
**Explicitly not this phase:** any account/trading surface, quote polling, provider/KIS calls triggered by
retention or watchlist features, Similarity/MK-Analysis triggering or usage-quota consumption from this
surface, and persistence of any arbitrary/free-form URL. The new migration was **not applied** by any means,
and no merge, no Production deploy, and no Production Supabase mutation were performed — all per explicit
governing-spec instruction.

## 1. Executive classification

`IMPLEMENTED_PUSHED_PREVIEW_READY_DB_MIGRATION_APPROVAL_PENDING` (final value confirmed once push and Preview
verification complete — see the accompanying final report).

## 2. Product policy implemented

### 2a. Session restoration hardening

- Supabase client (`src/lib/supabase.ts`) now explicitly sets `persistSession: true` and
  `autoRefreshToken: true` rather than relying on library defaults.
- Auth-state handling (`src/components/Header.astro`) runs profile bootstrap exactly once per real auth
  transition: `INITIAL_SESSION` and `TOKEN_REFRESHED` are explicitly skipped as bootstrap triggers (the
  session is already known/unchanged-identity on those events); only a genuine `SIGNED_IN` transition
  re-bootstraps.
- `SIGNED_OUT` clears UI-visible auth-derived state and dispatches `mk:auth-state` with
  `{status: 'signed_out'}`, which every consuming surface (resume card, watchlist toggle) listens for to
  reset its own view.
- No token or `Session` object is ever passed to `console.*`, stored in `localStorage`/`sessionStorage`
  directly by application code, or persisted outside Supabase's own client-managed storage.

### 2b. Persistent resume state

- New `public.user_preferences` (one row per user, upsert semantics) stores: `last_surface`
  (`home`/`chart_ai`/`portfolio`), `last_portfolio_id` (FK to `public.portfolios`, validated owned before
  write), `last_chart_market` (`KR`/`US`), `last_chart_symbol`, `last_chart_name`, `last_chart_timeframe`,
  `last_activity_at`.
- Every field is either a closed enum, a bounded/trimmed string, a UUID validated against ownership, or an ISO
  timestamp — there is no free-form URL column in the schema, so an arbitrary URL can never reach persistence
  by construction, not by a reject-list (verified by a dedicated smoke case asserting a URL string passed
  where a timestamp is expected is rejected: `phase_3gi_user_retention_persistence_testsrc.ts` line 86).
- Resume is never automatic: `HomeRetentionPanel.astro` renders a resume card only when preference data
  exists, and the actual navigation only happens on an explicit user click.
- Writes are auth-gated (silently no-op when signed out), deduplicated (chart resume state only re-writes when
  the instrument identity actually changes, portfolio resume state only re-writes on an actual selection
  change), and single-in-flight per page (no overlapping writes from rapid interaction).

### 2c. Cross-device watchlist

- New `public.user_watchlist_items` (`market` KR/US, `symbol`, `name`, `asset_type` stock/etf, unique per
  user+market+symbol) with a server-enforced cap of 50 items per user (`MAX_WATCHLIST_ITEMS = 50` in
  `src/lib/server/userRetention.ts`, checked before insert).
- `GET/POST/DELETE /api/user/watchlist`: bearer-auth resolved before any DB work; sanitized error responses;
  `Cache-Control: no-store` on every response.
- Home renders a compact watchlist view; Chart AI exposes an add/remove toggle scoped to the currently active
  chart instrument (via `selected-symbol-integrity.mjs`'s `getActiveContext()`) plus a deep link back into a
  saved instrument.
- The watchlist causes zero quote polling, zero provider/KIS calls, and never triggers Similarity or MK
  Analysis or consumes their daily usage quota — it stores only a market/symbol/name/asset-type identity, no
  price or analysis data.

## 3. New migration — not applied

`supabase/migrations/20260724_user_retention_persistence.sql` — additive only (`CREATE TABLE`, RLS policies
mirroring `public.portfolios`' `(select auth.uid()) = user_id` pattern, a `CHECK` constraint on `market`/
`asset_type` enums, a foreign key from `user_watchlist_items`/`user_preferences.last_portfolio_id` to
`public.portfolios`, reuse — not redefinition — of the existing `public.set_updated_at()` trigger function). No
`DROP`/`DELETE`/`TRUNCATE`. **Not applied** to any Supabase project by this phase. Every server code path in
`src/lib/server/userRetention.ts` detects a missing-table error (`isMissingRetentionTableError`: Postgres
`42P01`, PostgREST `PGRST205`, or a bare "does not exist" message) and maps it to a sanitized
`RETENTION_API_NOT_READY` (503) rather than surfacing a raw DB error — so every consuming UI surface degrades
silently (hides the resume card / watchlist UI) rather than erroring, both before and after this migration is
eventually applied.

## 4. Implementation surface

- `src/lib/server/userRetention.ts` — auth-gated CRUD (`getPreferences`, `updatePreferences`,
  `listWatchlist`, `addWatchlistItem`, `removeWatchlistItem`), pure validation helpers (`optionalEnum`,
  `optionalBoundedString`, `optionalIsoTimestamp`, exported for direct smoke testing), `mapDbError`,
  `isMissingRetentionTableError`, `MAX_WATCHLIST_ITEMS`.
- `src/pages/api/user/retention.ts`, `src/pages/api/user/preferences.ts`, `src/pages/api/user/watchlist.ts` —
  `prerender = false`, bearer auth resolved before DB work, `methodNotAllowed` fallback on unsupported verbs,
  `Cache-Control: no-store`.
- `src/lib/userRetentionClient.ts` — new independent bespoke authenticated-fetch client (own
  `getAuthHeaders`/`parseResponse`/`requestJson`), matching the existing convention of separate bespoke client
  modules per feature area rather than one shared fetch helper; exposes `hasRetentionSession()`,
  `userRetentionApi.{getPreferences,updatePreferences,listWatchlist,addWatchlistItem,removeWatchlistItem}`,
  and `UserRetentionApiError`.
- `src/components/HomeRetentionPanel.astro` — Home resume card + compact watchlist, zero-request when signed
  out, silent degradation on `RETENTION_API_NOT_READY`.
- `src/pages/chart-ai.astro` — watchlist toggle scoped to the active chart instrument (dedicated
  in-flight guard, hidden when no chart is active or when signed out), and resume-state persistence deduped by
  instrument identity, both wired only after the pre-existing `selected-symbol-integrity` explicit-load gate,
  never before.
- `src/pages/portfolio.astro` — resume-state persistence for the last **owned** portfolio only (aggregate
  sentinel `__all_portfolios__` is explicitly excluded — `isAggregatePortfolioId` guard), deduped by portfolio
  id, and a `?portfolio=<id>` deep link that is only honored when the id is present in the user's own loaded
  portfolio list; otherwise the existing aggregate/first-portfolio fallback ordering is unchanged.
- `src/lib/supabase.ts`, `src/components/Header.astro` — session restoration hardening (§2a).

## 5. Tests

- `scripts/phase_3gi_user_retention_persistence_testsrc.ts` +
  `scripts/smoke_phase_3gi_user_retention_persistence.mjs` (`npm run smoke:phase-3gi-user-retention-persistence`)
  — 24/24 pure-function checks: enum/bounded-string/timestamp validation edge cases (including the explicit
  arbitrary-URL-rejected-as-timestamp case) and missing-table-error detection.
- `scripts/check_phase_3gi_user_retention_persistence_contract.mjs`
  (`npm run check:phase-3gi-user-retention-persistence`) — 106/106 static contract assertions across 11 groups:
  file existence; migration contract (RLS/CHECK/FK/trigger-reuse/no-anon-grant); server module contract
  (auth-before-DB, sanitized missing-table mapping, 50-item cap ordering, ownership check, no free-form URL
  field, cross-user isolation); route contracts (`prerender`/auth-ordering/`methodNotAllowed`/no-store/method
  presence); session restoration hardening; shared client module; Home/Chart AI/Portfolio UI integration
  (zero-request-signed-out, silent degradation, dedup, non-blocking, in-flight guard, no analysis triggering,
  aggregate-sentinel rejection, owned-only deep link); no account/trading/provider surface added; `package.json`
  wiring.

## 6. Regression gate list — this phase's run

| Gate | Result | Notes |
|---|---|---|
| `smoke:phase-3gi-user-retention-persistence` | 24/24 PASS | new |
| `check:phase-3gi-user-retention-persistence` | 106/106 PASS | new |
| `smoke:phase-3gh-portfolio-live-valuation-mvp` | 55/55 PASS | unaffected |
| `check:phase-3gh-portfolio-live-valuation-mvp` | 86/86 PASS | unaffected |
| `check:phase-3gg-t-hf1` | 78/79 PASS | 1 fail: working-tree-scope freeze (asserts only its own phase's files changed since `main`; lists all Phase 3GI files) — non-blocking, same documented pattern as prior phases |
| `smoke:phase-3gg-t-hf1` | 48/48 PASS | unaffected |
| `check:phase-3gg-u-chart-ai-live-usage-guard` | 129/130 PASS | 1 fail: same working-tree-scope-freeze pattern — non-blocking |
| `smoke:phase-3gg-u-chart-ai-usage` | 13/13 PASS | unaffected |
| `check:kis-runtime-guard` | 7/7 PASS | unaffected |
| `check:kis-error-fallback` | 48/48 PASS | unaffected |
| `check:phase-3gg-t-hf2` (durable KIS token) | 160/160 PASS | unaffected |
| `check:provider-boundaries` | 1 fail: `src/pages/chart-ai.astro: imports server module outside server boundary` | Confirmed pre-existing false positive, not a Phase 3GI regression — see §7 |
| `check:phase-3gg-t-hf3a` (selected-symbol integrity) | 86/87 PASS | 1 fail: same working-tree-scope-freeze pattern — non-blocking |
| `smoke:phase-3gg-t-hf3a` | 50/50 PASS | unaffected |
| `npm ls --depth=0` | clean | no dependency issues |
| `npm run build` | clean | Astro + Vite build completed, no errors |
| `git diff --check` | clean | no whitespace/conflict-marker issues |

## 7. `check:provider-boundaries` false-positive — confirmed, not a Phase 3GI regression

The checker (`scripts/check_server_only_provider_boundaries.mjs`) flags any file outside `src/lib/server/` and
`src/pages/api/` whose raw text matches `from\s+['"].*lib\/server` or `import\s*\(['"].*lib\/server`, with no
distinction between an Astro SSR frontmatter import and a client `<script>` import. `src/pages/chart-ai.astro`
has five such imports, all pre-existing and unrelated to this phase:

```
7:  import { runSimilarPatternAgent } from '../lib/server/chart-ai/similar-pattern-agent.mjs';
8:  import { createSimilarPatternFixtureInput } from '../lib/server/chart-ai/similar-pattern-agent.fixture.mjs';
9:  import { runMkAgent } from '../lib/server/chart-ai/mk-agent.mjs';
10: import { createMkAgentFixtureInput } from '../lib/server/chart-ai/mk-agent.fixture.mjs';
11: import { evaluateProductionChartAiBetaAccess } from '../lib/server/chart-ai/protected-preview-beta-guard.mjs';
```

Confirmed via direct inspection: the file's frontmatter fence runs from line 1 to the closing `---` at line
303 — all five imports sit inside it (server-only, never bundled to the client). Phase 3GI's own new import in
this file (`import { userRetentionApi, hasRetentionSession, UserRetentionApiError, type WatchlistItem } from
'../lib/userRetentionClient';`) targets `lib/userRetentionClient`, not `lib/server/*`, and does not match the
checker's pattern. This is the same false positive already documented against this file in a prior phase.

## 8. Owner-only items (not performed by this phase)

- Review and, if approved, apply `20260724_user_retention_persistence.sql`.
- Authenticated Preview QA of the resume card, watchlist (Home + Chart AI), and Portfolio deep-link behavior.
- Confirm the PR's Preview deployment reaches READY with no secret printed and Netlify Preview is not red.
- Decide whether to merge the Phase 3GI PR.

## 9. Phase 3GI-HF1 — pre-migration contract hardening (same PR #5, no second migration file)

Landed 2026-07-25, before the migration's first application anywhere, as one additional commit on the same
branch/PR. **Not** a new phase, branch, or PR; the migration is still not applied.

### 9a. Migration (`20260724_user_retention_persistence.sql`, edited in place)

- `last_surface` gained a `lab` value (Home/Chart AI/Portfolio/Lab all now persist resume state) with a
  `NOT NULL DEFAULT 'home'` contract, replacing the previous nullable-with-no-default column.
- New `user_preferences_chart_state_consistent` `CHECK`: a chart resume pointer must be either fully absent
  (all four of market/symbol/name/timeframe null) or fully identified (market + symbol both present) —
  rejects "market without symbol", "symbol without market", and "name/timeframe without an identified
  instrument".
- New `user_preferences_chart_symbol_format` and `user_watchlist_items_symbol_format` `CHECK` constraints
  validate `last_chart_symbol`/`symbol` against the same KR (`^[0-9A-Z]{6}$`) and US
  (`^[A-Z][A-Z0-9.-]{0,9}$`) patterns already authoritative in `src/lib/market-data/instrument.ts`, not merely
  a length bound.
- `last_chart_timeframe` is now `CHECK`-bounded to the exact set Chart AI's UI supports (`1m`, `3m`, `6m`,
  `1y`), not an open string.
- `user_preferences_insert_own`/`user_preferences_update_own` RLS policies now independently re-verify (defense
  in depth, alongside the existing server-side `ensurePortfolioOwned` check) that a non-null
  `last_portfolio_id` belongs to the same authenticated user via an `EXISTS` subquery against
  `public.portfolios` — a client bypassing the server route still cannot point another user's row at a
  foreign portfolio.

### 9b. Server hardening (`src/lib/server/userRetention.ts`)

- `last_activity_at` is now unconditionally set from `new Date().toISOString()`; a client-supplied
  `lastActivityAt` field is never read, so a caller cannot backdate/forward-date this column.
- New exported `validateChartResumeState`: chart resume state is validated as one complete unit (fully cleared
  or fully identified), extracted out of `updatePreferences` so it is directly unit-testable without a
  Supabase connection.
- New exported `validateMarketSymbol`: the same KR/US symbol contract reused by both the chart resume state
  and the watchlist (`addWatchlistItem`), never a third convention.
- `optionalIsoTimestamp` (no longer used once activity time became server-generated) was removed.
- `lab` added to the server-side `SURFACES` enum; `CHART_TIMEFRAMES` added mirroring the migration's
  `last_chart_timeframe` `CHECK` set.

### 9c. Chart AI timeframe persistence fix (`src/pages/chart-ai.astro`)

- The resume-state dedup key (`lastPersistedChartKey`) now combines instrument identity **and** the timeframe
  being persisted (`` `${identity}|${timeframe}` ``), so a timeframe-only change on an otherwise-unchanged
  instrument still triggers exactly one write — previously a dedup keyed on identity alone would silently drop
  a timeframe change.
- The key is recorded only **after** `updatePreferences` succeeds, so a failed/transient write remains
  retryable rather than being permanently (and incorrectly) treated as already persisted.
- A new `chartResumePersistInFlight` guard prevents two concurrent calls (e.g. rapid range clicks) from racing
  a duplicate write. None of this can block chart rendering — the write stays fire-and-forget (`void`) inside
  a `try`/`catch`.

### 9d. Watchlist failure feedback (`src/pages/chart-ai.astro`)

- A new `role="status" aria-live="polite"` status element shows sanitized Korean feedback on an add/remove
  failure — mapped from `RETENTION_API_NOT_READY`/`WATCHLIST_LIMIT_EXCEEDED` to fixed strings, with a generic
  fallback for anything else; no raw error text is ever shown, and the message auto-hides after 4 seconds.
- On failure the toggle button is restored to its pre-click state (`wasInWatchlist`) rather than assuming the
  mutation succeeded; the existing `watchlistToggleInFlight` guard still caps this to one request per click
  with no automatic retry.

### 9e. Lab surface resume-state persistence (`src/pages/lab.astro`)

- Added a best-effort `lastSurface: 'lab'` persistence call, following the exact pattern already used on
  Home/Chart AI/Portfolio (`persistPortfolioResumeState`): session-gated (`hasRetentionSession`), fire-and-
  forget, a failure never affects the page, and zero provider/KIS/analysis calls — `lab.astro` remains a
  purely static landing page otherwise.

### 9f. Tests

- `scripts/phase_3gi_user_retention_persistence_testsrc.ts` +
  `scripts/smoke_phase_3gi_user_retention_persistence.mjs`: grew from 24/24 to **35/35**. The three
  `optionalIsoTimestamp` cases (function removed) were replaced with coverage for `validateChartResumeState`
  (no-fields/market-without-symbol/symbol-without-market/name-without-identity/timeframe-without-identity/
  fully-cleared/valid-KR/valid-US/unsupported-timeframe/malformed-KR/malformed-US/partial-field-set) and
  `validateMarketSymbol` (valid KR/US, malformed KR/US, empty).
- `scripts/check_phase_3gi_user_retention_persistence_contract.mjs`: grew from 106/106 to **130/130** static
  assertions — new checks for the `lab` surface + `NOT NULL`/`DEFAULT`, the chart-state-consistency `CHECK`,
  both symbol-format `CHECK` constraints, the RLS `EXISTS`-subquery ownership re-verification, the server's
  `isKrSymbol`/`isUsSymbol` import and `validateChartResumeState`/`validateMarketSymbol` exports, the
  never-reads-`lastActivityAt` / always-server-sets-`last_activity_at` assertions, the Chart AI dedup-key-
  includes-timeframe and set-after-write-succeeds ordering, the watchlist sanitized-feedback and preserve-
  prior-state assertions, a new Lab UI integration group, and a check that exactly one migration file exists
  under `supabase/migrations/` matching the Phase 3GI naming (no second migration file).

### 9g. Regression gate re-run

| Gate | Result | Notes |
|---|---|---|
| `smoke:phase-3gi-user-retention-persistence` | 35/35 PASS | grew from 24/24 |
| `check:phase-3gi-user-retention-persistence` | 130/130 PASS | grew from 106/106 |
| `smoke:phase-3gh-portfolio-live-valuation-mvp` | 55/55 PASS | unaffected |
| `check:phase-3gh-portfolio-live-valuation-mvp` | 86/86 PASS | unaffected |
| `check:phase-3gg-t-hf1` | 77/79 PASS | 2 fails: same non-blocking working-tree-scope-freeze pattern as prior phases (lists the HF1-touched files) |
| `smoke:phase-3gg-t-hf1` | 48/48 PASS | unaffected |
| `check:phase-3gg-u-chart-ai-live-usage-guard` | 129/130 PASS | 1 fail: same working-tree-scope-freeze pattern — non-blocking |
| `smoke:phase-3gg-u-chart-ai-usage` | 13/13 PASS | unaffected |
| `check:kis-runtime-guard` | 7/7 PASS | unaffected |
| `check:kis-error-fallback` | 48/48 PASS | unaffected |
| `check:phase-3gg-t-hf2` (durable KIS token) | 160/160 PASS | unaffected |
| `check:provider-boundaries` | 1 fail: `src/pages/chart-ai.astro: imports server module outside server boundary` | Same pre-existing false positive already documented in §7, unrelated to HF1 |
| `check:phase-3gg-t-hf3a` (selected-symbol integrity) | 86/87 PASS | 1 fail: same working-tree-scope-freeze pattern — non-blocking |
| `smoke:phase-3gg-t-hf3a` | 50/50 PASS | unaffected |
| `npm ls --depth=0` | clean | no dependency issues |
| `npm run build` | clean | Astro + Vite build completed, no errors |
| `git diff --check` | clean (exit 0) | only benign LF→CRLF line-ending notices, no whitespace/conflict-marker issues |

### 9h. Scope discipline

No second migration file. Migration not applied. No merge. No Production deploy. No Production Supabase
mutation. No new branch or PR — same `feature/phase-3gi-user-retention-persistence` branch, same PR #5, one
additional commit (`Phase 3GI-HF1: harden retention persistence contracts`).
