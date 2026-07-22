# Phase 3BE-R3 — GNews Live Smoke Query Simplification Patch Result v0.1

## 1. Title and Metadata

- **Phase**: 3BE-R3
- **Type**: GNews live smoke query simplification patch
- **Status**: Implemented
- **Live GNews calls by Claude Code**: not performed
- **Owner live smoke execution**: not performed in this patch phase
- **Dry-run validation**: performed
- **Theme-selection validation**: performed (behavioral, no network)
- **Query-profile validation**: performed (behavioral, no network)
- **API route runtime change**: none
- **Database changes**: none
- **Supabase changes**: none
- **Home integration**: none
- **Deployment**: not performed
- **Date**: 2026-06-24

---

## 2. Objective

Phase 3BE-R3 adds a smoke-only `--query-profile=<profile>` option to the owner-run GNews live smoke script (`scripts/owner_smoke_gnews_live_fetch.mjs`). This patch was motivated by Phase 3BE-R2 (owner-run attempts after the 3BE-R1 theme selector patch), during which multiple themes returned `provider_empty_result` under the policy query profile. The `simple` profile provides short single-term Korean query strings as a reduced-complexity alternative for smoke validation, without changing any production policy query definitions.

No live GNews call is performed in this phase. No route behavior is changed.

---

## 3. Phase 3BE-R2 Observation Summary

The following sanitized facts are recorded from owner-run live smoke attempts. No article content, raw payload, URL, title, description, or key value is recorded.

| Observation | Detail |
|---|---|
| Live smoke attempted | Yes — owner executed outside Claude Code using 3BE-R1 `--theme` option |
| Guard conditions | Passed in all attempts |
| theme=macro_policy | Failed: `provider_empty_result` |
| theme=fx | Failed: `provider_empty_result` |
| theme=market_stocks | Failed: `provider_empty_result` |
| theme=crypto_digital_assets | Failed: `provider_empty_result` |
| Article content recorded | No |
| Raw payload recorded | No |
| Hypothesis | OR-heavy policy query strings may be too complex or incompatible for the live provider under the owner's smoke environment |
| A previously exposed GNews API key | Must remain treated as compromised and rotated outside Claude Code. The key value is not recorded here. |

---

## 4. Implementation Summary

| Artifact | Action |
|---|---|
| `scripts/owner_smoke_gnews_live_fetch.mjs` | Patched — added `--query-profile` option, `SMOKE_QUERY_PROFILE_SIMPLE_MAP`, 3 new pure exports |
| `scripts/check_gnews_live_smoke_script_static_contract.mjs` | Updated — added Group 15 with 12 Phase 3BE-R3 checks |
| `scripts/check_gnews_live_smoke_script_dry_run.mjs` | Unchanged — existing 29 checks still pass (dry-run does not exercise query profile path) |
| `scripts/check_gnews_live_smoke_theme_selection.mjs` | Updated — added Group 9 with 17 Phase 3BE-R3 integration checks |
| `scripts/check_gnews_live_smoke_query_profile.mjs` | Created — behavioral query-profile checker, 66/66 PASS |
| `scripts/check_gnews_news_policy_static_contract.mjs` | Updated — added Phase 3BE-R3 artifact group (8 checks) |
| `package.json` | Updated — added `check:gnews-live-smoke-query-profile` |

**New exports from smoke script:**
- `SMOKE_QUERY_PROFILE_SIMPLE_MAP` — smoke-only short query map (6 entries)
- `SMOKE_ALLOWED_QUERY_PROFILES` — `Set(['policy', 'simple'])`
- `parseQueryProfileArg(argList)` — extracts `--query-profile=<value>` from CLI args; defaults to `'policy'`
- `validateQueryProfile(profile)` — returns `{ ok: true }` or `{ ok: false, code: 'invalid_query_profile' }`
- `applySmokeQueryProfile(definitions, profile)` — returns shallow clones; never mutates imported `GNEWS_QUERY_DEFINITIONS`

---

## 5. Query Profile Behavior

**CLI option:** `--query-profile=<profile>`

**Allowed profile values:**

| Profile | Behavior |
|---|---|
| `policy` | Uses original `GNEWS_QUERY_DEFINITIONS` query strings (default behavior) |
| `simple` | Applies smoke-only short query strings from `SMOKE_QUERY_PROFILE_SIMPLE_MAP` |

**Default:** `policy` (when `--query-profile` is absent or empty).

**Invalid profile behavior:** fails before any env read or fetch call, with sanitized reason code `invalid_query_profile`.

**Validation order in live branch:**
1. CLI flags checked (`--execute-live`, `--confirm-owner-approved`)
2. Theme validated against allowlist (pure, no env reads)
3. Query profile validated against allowlist (pure, no env reads)
4. Env vars read (`GNEWS_LIVE_ENABLED`, `VERCEL_ENV`, `GNEWS_BASE_URL`, `GNEWS_API_KEY`)
5. Definitions selected and profile applied
6. Live fetch executed

**Output for query profile (safe field only):**
- `queryProfile=simple` or `queryProfile=policy`

**Forbidden output:** actual query strings are never logged. The `q` parameter value is never printed. No URL, API key, article content, or raw JSON is printed.

---

## 6. Simple Profile Map

The following smoke-only query map is used when `--query-profile=simple` is selected. This map is for owner smoke validation only and is not the Phase 3AY production ingestion policy. It does not replace `GNEWS_QUERY_DEFINITIONS` in `gnewsLiveFetchAdapter.mjs`.

| queryKey | Simple smoke query |
|---|---|
| `market_stocks` | `주식` |
| `macro_policy` | `금리` |
| `fx` | `환율` |
| `oil_commodities` | `유가` |
| `crypto_digital_assets` | `비트코인` |
| `personal_finance` | `재테크` |

These single-term queries are shorter and less complex than the OR-joined policy query strings, reducing the likelihood of `provider_empty_result` responses in smoke validation.

---

## 7. Dry-Run and No-Network Validation

| Property | Confirmed |
|---|---|
| Dry-run performs no network calls | Yes — `globalThis.fetch` monkey-patched to throw in checker |
| Theme selection checker performs no network calls | Yes — monkey-patched, 0 fetch calls confirmed |
| Query profile checker performs no network calls | Yes — monkey-patched, 0 fetch calls confirmed |
| No env vars required for dry-run | Yes — `runDryRun()` reads no env |
| No env vars required for theme-selection checker | Yes — pure helpers only |
| No env vars required for query profile checker | Yes — pure helpers only |
| No live branch executed by Claude Code | Yes |
| queryString not in any output | Yes — verified by all checkers |
| Original `GNEWS_QUERY_DEFINITIONS` not mutated by `applySmokeQueryProfile` | Yes — verified structurally and by checker |

---

## 8. Validation Results

| Command | Result |
|---|---|
| `npm run check:gnews-news-policy` | All checks passed. Exit 0 |
| `npm run check:gnews-news-engine` | 57/57 PASS |
| `npm run check:gnews-news-api-route` | All 35 groups. Exit 0 |
| `npm run check:gnews-news-api-response` | 61/61 PASS |
| `npm run check:gnews-live-adapter-design` | All checks passed. Exit 0 |
| `npm run check:gnews-live-adapter-static` | All checks passed. Exit 0 |
| `npm run check:gnews-live-adapter-mocked` | 148/148 PASS |
| `npm run check:gnews-live-smoke-script` | All checks passed (Group 15 added). Exit 0 |
| `npm run check:gnews-live-smoke-dry-run` | 29/29 PASS |
| `npm run check:gnews-live-smoke-theme-selection` | 79/79 PASS (Group 9 added) |
| `npm run check:gnews-live-smoke-query-profile` | 66/66 PASS |
| `npm run smoke:gnews-live:dry` | PASS (liveAttempted=false). Exit 0 |
| `git diff --check` | LF/CRLF warnings only. Exit 0 |
| `git status --short` | Expected new and modified files only |

---

## 9. Route Boundary

- `src/pages/api/news/market-feed.ts` is unchanged
- Route still returns `source: "fixture"` and `liveEnabled: false`
- Route does not import `gnewsLiveFetchAdapter.mjs` or the owner smoke script
- `src/lib/news/gnewsMarketFeedResponse.mjs` is unchanged
- `src/lib/news/gnewsLiveFetchAdapter.mjs` is unchanged
- Home page does not import the live adapter or smoke script
- No `/news` page was created

---

## 10. Safety Boundaries

- No live GNews call was made by Claude Code
- No owner live smoke was executed in this patch phase
- No `gnews.io` request was made
- No external HTTP request was made
- No env var was read in dry-run, theme-selection, or query-profile checker
- No real API key value was used, printed, or inferred
- No route behavior was changed
- No database or migration file was added
- No Supabase query or write occurred
- No Home integration was implemented
- No `/news` page was created
- No deployment was performed
- No `.env*` file was read
- The previously exposed API key was not quoted, recorded, reused, or validated — owner must rotate it outside Claude Code
- `GNEWS_QUERY_DEFINITIONS` in `gnewsLiveFetchAdapter.mjs` was not modified

---

## 11. Remaining Limitations

- Owner must rotate the previously exposed API key outside Claude Code before any live retry
- Owner simple-profile live smoke not yet executed after this patch — `provider_empty_result` root cause unconfirmed
- Real GNews success response not yet validated
- Route source selector with `GNEWS_LIVE_ENABLED` kill switch not yet implemented
- Cache/persistent storage not implemented
- Scheduled refresh not implemented
- Home UI not connected to news data
- `/news` page not created
- Adapter not Production-enabled

---

## 12. Recommended Next Steps

| Phase | Title | Description |
|---|---|---|
| 3BE-R4 | Owner re-runs live smoke with simple profile | Owner rotates API key, sets endpoint-only `GNEWS_BASE_URL`, and runs `--execute-live --confirm-owner-approved --theme=macro_policy --query-profile=simple` or `--theme=fx --query-profile=simple`. Returns only sanitized count/category summary. |
| 3BF | Record owner live smoke result | If 3BE-R4 succeeds, record sanitized themeCount/successCount/articleCount only. |
| 3BG | Route source selector with kill switch | Wire `GNEWS_LIVE_ENABLED` kill switch into route; fixture fallback retained; Production still blocked. |
| 3BH | Home Market News UI integration | Wire top-6 articles from `/api/news/market-feed?mode=home` into Home shell via SSR fetch. |
| 3BI | Optional /news paginated list page | `/news` route with offset pagination. |

---

## 13. Confirmed Non-actions

- No live GNews call occurred
- No `gnews.io` request occurred
- No external HTTP request occurred
- No API route behavior was changed
- No database or migration file was added
- No Supabase query or write occurred from Claude Code
- No Vercel env value was inspected or mutated
- No `.env*` content was read
- No deployment was performed
- No deployed URL was called
- No secret, key value, raw payload, Preview URL, Supabase URL, or credential-like value was recorded
- No KIS provider logic was changed
- No Vercel config was changed
- No auth/session logic was changed
- No Home page runtime was changed
- No UI component was changed
- No root README.md was changed
- Claude memory files were not modified
- No `/news` page was created
- No scheduled job or Vercel cron was added
- No owner live smoke was executed
- `src/lib/news/gnewsLiveFetchAdapter.mjs` was not modified
