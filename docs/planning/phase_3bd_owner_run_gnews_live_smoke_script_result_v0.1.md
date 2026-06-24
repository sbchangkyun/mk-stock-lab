# Phase 3BD — Owner-Run GNews Live Smoke Script Result v0.1

## 1. Title and Metadata

- **Phase**: 3BD
- **Type**: Owner-run GNews live smoke script
- **Status**: Implemented
- **Live GNews calls by Claude Code**: not performed
- **Owner live smoke execution**: not performed in this phase
- **Dry-run validation**: performed
- **API route runtime change**: none
- **Database changes**: none
- **Supabase changes**: none
- **Home integration**: none
- **Deployment**: not performed
- **Date**: 2026-06-24

---

## 2. Objective

Phase 3BD creates the owner-run GNews live smoke script (`scripts/owner_smoke_gnews_live_fetch.mjs`) with strict multi-condition guards for live execution, and validates only the dry-run mode and static safety properties in this phase. The script defaults to dry-run mode and requires explicit owner-set CLI flags and environment variable conditions before any live GNews request is attempted. Claude Code does not execute the live branch in this phase.

---

## 3. Implementation Summary

| Artifact | Path |
|---|---|
| Owner smoke script | `scripts/owner_smoke_gnews_live_fetch.mjs` |
| Static smoke checker | `scripts/check_gnews_live_smoke_script_static_contract.mjs` |
| Dry-run smoke checker | `scripts/check_gnews_live_smoke_script_dry_run.mjs` |
| Policy static checker (updated) | `scripts/check_gnews_news_policy_static_contract.mjs` |
| Package scripts added | `check:gnews-live-smoke-script`, `check:gnews-live-smoke-dry-run`, `smoke:gnews-live:dry` |

Adapter functions reused from Phase 3BC (`src/lib/news/gnewsLiveFetchAdapter.mjs`):
- `GNEWS_QUERY_DEFINITIONS` — 6 theme definitions
- `GNEWS_ADAPTER_POLICY` — policy constants including `MAX_THEMES_PER_SMOKE: 2`
- `fetchGnewsMarketNewsBatch` — multi-theme batch fetch with `maxThemes` cap
- `summarizeGnewsLiveFetchResult` — sanitized summary (no URLs, titles, descriptions, API key)

The smoke script exports `runDryRun(out)` as a named export for direct invocation by the dry-run checker without subprocess spawning. The `main()` function is guarded by a `process.argv[1]` check so importing the module does not execute the live path.

---

## 4. Live Execution Guard

All of the following conditions must be satisfied before any live GNews request is made:

| Condition | Type | Value / Behavior |
|---|---|---|
| `--execute-live` | CLI flag | Must be present |
| `--confirm-owner-approved` | CLI flag | Must be present |
| `GNEWS_LIVE_ENABLED` | Env var | Must equal `"true"` |
| `GNEWS_BASE_URL` | Env var | Must be present and non-empty |
| `GNEWS_API_KEY` | Env var (preferred) | Must be present, OR `PUBLIC_GNEWS_API_KEY` as fallback |
| `PUBLIC_GNEWS_API_KEY` | Env var (server-side fallback only) | Used only if `GNEWS_API_KEY` is absent |
| `maxThemes` | Runtime clamp | Clamped to `Math.min(max(1, rawValue), 2)` |
| `VERCEL_ENV` | Env var | Must NOT equal `"production"` (blocked) |

If any condition fails, the script exits non-zero, prints a sanitized reason code, and does not call `fetch`.

Sanitized reason codes for failed guard conditions:
- `missing_execute_live_flag`
- `missing_owner_confirmation`
- `live_disabled`
- `missing_base_url`
- `missing_api_key`
- `production_blocked`
- `invalid_theme_limit`

All env var reads occur exclusively inside `checkLiveGuards()`, which is only called after both CLI flags are confirmed. The `runDryRun()` function performs no env reads.

---

## 5. Dry-Run Behavior

**Default command:** `node scripts/owner_smoke_gnews_live_fetch.mjs --dry-run`

**Package script:** `npm run smoke:gnews-live:dry`

The dry-run path:
- Performs no network calls
- Reads no environment variables
- Reads no API keys
- Uses no `fetch` (global or injected)
- Exits with code 0

Output format (all lines include `sanitized=true`):
```
gnews3bd step=mode-check status=confirmed mode=dry-run note=no-network-no-env-reads sanitized=true
gnews3bd step=live-blocked-by-default status=confirmed note=live-requires-execute-live-flag-plus-all-guard-conditions sanitized=true
gnews3bd step=max-requests-policy status=confirmed maxRequests=2 maxThemes=2 note=hard-cap-two-requests-per-live-run sanitized=true
gnews3bd step=output-sanitizer status=active note=article-urls-titles-descriptions-key-values-raw-json-blocked sanitized=true
gnews3bd step=route-boundary status=confirmed source=fixture liveEnabled=false note=market-feed-route-unchanged-fixture-backed sanitized=true
gnews3bd step=dry-run-result status=passed liveAttempted=false sanitized=true
gnews3bd mode=dry-run liveAttempted=false maxRequests=2 result=PASS sanitized=true
```

The dry-run checker (`check_gnews_live_smoke_script_dry_run.mjs`) verifies this output by:
1. Monkey-patching `globalThis.fetch` to throw before import
2. Importing `runDryRun` from the smoke script
3. Calling `runDryRun` with a captured output collector
4. Verifying all required output content is present
5. Verifying no forbidden output content appears (URLs, key values, raw JSON)
6. Verifying no network was attempted

**Dry-run validation result:** 27/27 PASS

---

## 6. Owner-Run Live Smoke Output Policy

### Allowed output (sanitized summary only)

| Field | Description |
|---|---|
| `ok` | Boolean result |
| `provider` | Always `'gnews'` |
| `liveAttempted` | Always `true` in live mode |
| `themeCount` | Number of themes attempted |
| `successCount` | Number of successful theme fetches |
| `failureCount` | Number of failed theme fetches |
| `articleCount` | Total normalized article count |
| `categories` | Category enum array (e.g. `MARKET_STOCKS`) — no article content |
| `warningCount` | Count of normalization warnings |
| `errorCodes` | Array of sanitized error codes |

### Forbidden output (blocked by sanitizer)

| Forbidden | Reason |
|---|---|
| API key values | Secret leakage risk |
| Full request URLs (including API key in query param) | Secret leakage risk |
| Article URLs | Content privacy |
| Article titles | Content privacy |
| Article descriptions | Content privacy |
| Raw JSON from provider | May contain key values or sensitive content |
| Raw provider error messages | May expose endpoint structure |
| Stack traces | May expose implementation details |

The `safeLog` function scans each output string against `FORBIDDEN_OUTPUT_PATTERN` before writing. If forbidden content is detected, a `SAFE_OUTPUT_BLOCKED` code is emitted instead and an error is thrown.

### Owner live command pattern

To execute the live smoke in the future, the owner sets server-side environment variables in the shell, then runs:

```
node scripts/owner_smoke_gnews_live_fetch.mjs --execute-live --confirm-owner-approved --max-themes=2
```

(Real environment variable values are never recorded in this document.)

---

## 7. Request Cap Policy

- Maximum **2 live GNews requests** (themes) per smoke run, enforced by `maxThemes` clamp
- The `MAX_THEMES_CAP = 2` constant in the smoke script matches `GNEWS_ADAPTER_POLICY.MAX_THEMES_PER_SMOKE: 2` in the adapter
- The `--max-themes=N` CLI flag is clamped to `[1, 2]`
- Live smoke is **not part of default validation** — no CI script runs the live mode
- The owner must explicitly run the command with both `--execute-live` and `--confirm-owner-approved`
- The `smoke:gnews-live:dry` package script always passes `--dry-run` and is safe to run in CI or validation

---

## 8. Environment Variable Policy

| Variable | Role |
|---|---|
| `GNEWS_API_KEY` | Preferred server-only key — read only inside `checkLiveGuards()` |
| `PUBLIC_GNEWS_API_KEY` | Server-side fallback only — read only inside `checkLiveGuards()`, never in browser or client code |
| `GNEWS_BASE_URL` | Required base URL for GNews API — read only inside `checkLiveGuards()` |
| `GNEWS_LIVE_ENABLED` | Kill switch — must equal `"true"` to allow live branch |
| `VERCEL_ENV` | Production guard — `"production"` blocks live execution |

All reads occur exclusively inside the gated live branch. The dry-run path reads no env vars. No `.env` file is read by `dotenv` or `fs`. No env values are printed, inferred, or returned.

---

## 9. Route Boundary

- `src/pages/api/news/market-feed.ts` is **unchanged**
- The route still returns `source: "fixture"` and `liveEnabled: false` for all requests
- The route does not import `gnewsLiveFetchAdapter.mjs`
- The route does not import the owner smoke script
- `src/lib/news/gnewsMarketFeedResponse.mjs` is unchanged
- The Home page does not import the live adapter or the smoke script
- No `/news` page was created

---

## 10. Validation Results

| Command | Result |
|---|---|
| `npm run check:gnews-news-policy` | All checks passed. Exit 0 (80 checks) |
| `npm run check:gnews-news-engine` | 57/57 PASS |
| `npm run check:gnews-news-api-route` | All checks passed (35 groups validated). Exit 0 |
| `npm run check:gnews-news-api-response` | Checks passed: 61/61. Result: PASS |
| `npm run check:gnews-live-adapter-design` | All checks passed. Exit 0 |
| `npm run check:gnews-live-adapter-static` | All checks passed. Exit 0 |
| `npm run check:gnews-live-adapter-mocked` | Checks passed: 148/148. Result: PASS |
| `npm run check:gnews-live-smoke-script` | All checks passed. Exit 0 |
| `npm run check:gnews-live-smoke-dry-run` | Checks passed: 27/27. Result: PASS |
| `npm run smoke:gnews-live:dry` | Dry-run PASS (7 sanitized output lines). Exit 0 |
| `git diff --check` | LF/CRLF warnings only. Exit 0 |
| `git status --short` | Expected new and modified files only |

---

## 11. Key Findings

| Finding | Value |
|---|---|
| Dry-run passed | Yes — 7 sanitized output lines, 0 errors |
| Static checker passed | Yes — all 53 checks in 13 groups |
| Dry-run checker passed | Yes — 27/27 checks |
| Live smoke executed | No |
| Network attempted in dry-run | No (monkey-patch confirmed no fetch call) |
| Env reads in dry-run | No (runDryRun reads no env vars) |
| maxThemes cap confirmed | 2 (hard-capped in both script and adapter) |
| Route boundary confirmed | source=fixture, liveEnabled=false, no adapter import |
| Forbidden output findings | 0 in dry-run output |
| Production blocked | Yes — `VERCEL_ENV=production` guard confirmed |

---

## 12. Safety Boundaries

- No live GNews call was made by Claude Code
- No owner live smoke was executed in this phase
- No `gnews.io` request was made
- No external HTTP request was made
- No env var was read in dry-run mode or in validator scripts
- No real API key value was used, printed, or inferred
- No route behavior was changed
- No database or migration file was added
- No Supabase query or write occurred
- No Home integration was implemented
- No `/news` page was created
- No deployment was performed
- No `.env*` file was read
- All mock/synthetic values use placeholders only

---

## 13. Remaining Limitations

- No owner live smoke has been executed — real GNews API response not validated
- No route source selector with `GNEWS_LIVE_ENABLED` kill switch implemented
- No cache or persistent storage layer exists
- No scheduled refresh job or Vercel cron exists
- No Home UI connected to news data
- No `/news` paginated list page exists
- The adapter is not Production-enabled
- `id` field uses `pending_*` placeholder — real IDs require DB insertion
- Relevance scoring uses field-presence heuristic only

---

## 14. Recommended Next Steps

| Phase | Title | Description |
|---|---|---|
| 3BE | Owner executes GNews live smoke | Owner manually runs the live smoke with explicit approval and provides only the sanitized count/category summary. No article content recorded. |
| 3BF | Route source selector with kill switch | Wire `GNEWS_LIVE_ENABLED` kill switch into `/api/news/market-feed`; fixture fallback retained; Production still blocked. |
| 3BG | Home Market News UI integration | Wire top-6 articles from `/api/news/market-feed?mode=home` into Home shell via SSR fetch. |
| 3BH | Optional /news paginated list page | `/news` route with offset pagination, `pageSize: 10`, `maxPages: 10`, optional category filter. |
| 3BI | Optional storage/cache design | Design Supabase storage schema, scheduled refresh job, deduplication pipeline. |

---

## 15. Confirmed Non-actions

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
- No secret, key value, raw provider payload, Preview URL, Supabase URL, or credential-like value was recorded
- No KIS provider logic was changed
- No KIS runtime guard was changed
- No Supabase backend logic was changed
- No Vercel config was changed
- No auth/session logic was changed
- No Home page runtime was changed
- No UI component was changed
- No root README.md was changed
- Claude memory files were not modified
- No `/news` page was created
- No scheduled job or Vercel cron was added
- No owner live smoke was executed
