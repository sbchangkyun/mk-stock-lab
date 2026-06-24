# Phase 3BE-R5 — Sanitized Provider Diagnostics Patch Result v0.1

## 1. Title and Metadata

- **Phase**: 3BE-R5
- **Type**: Sanitized provider diagnostics patch
- **Status**: Implemented
- **Live GNews calls by Claude Code**: not performed
- **Owner live smoke execution**: not performed in this patch phase
- **Dry-run validation**: performed
- **Theme-selection validation**: performed (behavioral, no network)
- **Query-profile validation**: performed (behavioral, no network)
- **Provider-diagnostics validation**: performed (behavioral, no network, synthetic fetch only)
- **API route runtime change**: none
- **Database changes**: none
- **Supabase changes**: none
- **Home integration**: none
- **Deployment**: not performed
- **Date**: 2026-06-24

---

## 2. Objective

Phase 3BE-R5 adds a `--diagnostics=sanitized` option to the owner-run GNews live smoke script. After multiple live attempts (under both `policy` and `simple` query profiles) returned `provider_empty_result` without any structural information about what the provider actually returned, the next safe diagnostic need is to determine the HTTP response shape: whether the provider returned an empty articles array, a different response structure, an error object, or an unexpected payload format.

The diagnostics output is strictly limited to structural metadata — counts, type labels, boolean flags — and never includes request URLs, API keys, article content, query strings, raw JSON, error message values, or stack traces.

No live GNews call is performed in this phase. No route behavior is changed.

---

## 3. Phase 3BE-R4 Observation Summary

The following sanitized facts are recorded from owner-run live smoke attempts. No article content, raw payload, URL, title, description, or key value is recorded.

| Observation | Detail |
|---|---|
| Live smoke attempted | Yes — owner executed outside Claude Code using 3BE-R3 `--query-profile=simple` option |
| Guard conditions | Passed in all attempts |
| policy profile — macro_policy | Failed: `provider_empty_result` |
| policy profile — fx | Failed: `provider_empty_result` |
| policy profile — market_stocks | Failed: `provider_empty_result` |
| policy profile — crypto_digital_assets | Failed: `provider_empty_result` |
| simple profile — macro_policy | Failed: `provider_empty_result` |
| simple profile — fx | Failed: `provider_empty_result` |
| simple profile — market_stocks | Failed: `provider_empty_result` |
| simple profile — crypto_digital_assets | Failed: `provider_empty_result` |
| Article content recorded | No |
| Raw payload recorded | No |
| Hypothesis | Provider may be returning a non-empty response that the adapter cannot parse, or returning an unexpected structure different from adapter mock assumptions |
| Previously exposed GNews API key | Must remain treated as compromised and rotated outside Claude Code. The key value is not recorded here. |

---

## 4. Implementation Summary

| Artifact | Action |
|---|---|
| `scripts/owner_smoke_gnews_live_fetch.mjs` | Patched — added `--diagnostics` option and 5 new pure exports |
| `scripts/check_gnews_live_smoke_script_static_contract.mjs` | Updated — added Group 16 with 15 Phase 3BE-R5 checks |
| `scripts/check_gnews_live_smoke_script_dry_run.mjs` | Unchanged — existing 29 checks still pass |
| `scripts/check_gnews_live_smoke_theme_selection.mjs` | Unchanged — existing 79 checks still pass |
| `scripts/check_gnews_live_smoke_query_profile.mjs` | Unchanged — existing 66 checks still pass |
| `scripts/check_gnews_live_smoke_provider_diagnostics.mjs` | Created — behavioral diagnostics checker, 77/77 PASS |
| `scripts/check_gnews_news_policy_static_contract.mjs` | Updated — added Phase 3BE-R5 artifact group (8 checks) |
| `package.json` | Updated — added `check:gnews-live-smoke-provider-diagnostics` |

**New exports from smoke script:**
- `SMOKE_ALLOWED_DIAGNOSTICS_MODES` — `Set(['off', 'sanitized'])`
- `parseDiagnosticsArg(argList)` — extracts `--diagnostics=<value>` from CLI args; defaults to `'off'`
- `validateDiagnosticsMode(mode)` — returns `{ ok: true }` or `{ ok: false, code: 'invalid_diagnostics_mode' }`
- `summarizeProviderPayloadShape(payload)` — extracts structural metadata from a parsed JSON object
- `summarizeProviderTextShape(text, contentType)` — parses JSON safely and delegates to shape summarizer
- `createSanitizedDiagnosticsFetch(fetchFn, out)` — wraps an injected fetch, reads a response clone, emits structural diagnostics, returns original response

---

## 5. Diagnostics Behavior

**CLI option:** `--diagnostics=<mode>`

**Allowed mode values:**

| Mode | Behavior |
|---|---|
| `off` | Existing behavior unchanged (default) |
| `sanitized` | Wrap fetch with `createSanitizedDiagnosticsFetch`; emit structural response shape diagnostics |

**Default:** `off` (when `--diagnostics` is absent or empty).

**Invalid mode behavior:** fails before any env read or fetch call with sanitized reason code `invalid_diagnostics_mode`.

**Validation order in live branch:**
1. CLI flags checked (`--execute-live`, `--confirm-owner-approved`)
2. Theme validated against allowlist (pure, no env reads)
3. Query profile validated against allowlist (pure, no env reads)
4. Diagnostics mode validated against allowlist (pure, no env reads)
5. Env vars read (`GNEWS_LIVE_ENABLED`, `VERCEL_ENV`, `GNEWS_BASE_URL`, `GNEWS_API_KEY`)
6. Definitions selected and profile applied
7. Fetch wrapped (or not) based on diagnostics mode
8. Live fetch executed

**Diagnostics wrapper behavior:**
- Calls `fetchFn(...args)` and never logs the args (which may contain URL, auth headers)
- Inspects `response.status`, `response.ok`, `response.headers.get('content-type')`
- Calls `response.clone().text()` to read a copy of the body
- Parses the clone body as JSON (catches parse failures)
- Extracts structural metadata from the parsed payload
- Emits a sanitized `provider-diagnostics` log line
- Returns the **original** response (not the clone) so the adapter can read the body normally

---

## 6. Allowed Diagnostics Fields

The following fields may appear in a `step=provider-diagnostics` output line:

| Field | Description |
|---|---|
| `diagnostics=sanitized` | Confirms diagnostics mode active |
| `httpStatusClass=<1xx\|2xx\|3xx\|4xx\|5xx\|unknown>` | HTTP status category, not the exact code |
| `httpOk=<true\|false\|unknown>` | `response.ok` value |
| `contentTypeJson=<true\|false\|unknown>` | Whether content-type indicates JSON |
| `bodyReadable=<true\|false>` | Whether the response body could be cloned and read |
| `jsonParseOk=<true\|false>` | Whether JSON.parse of the clone body succeeded |
| `topLevelKeyCount=<number>` | Number of top-level keys in the JSON object |
| `topLevelKeys=<comma-separated names>` | Sanitized top-level key names (alphanumeric/underscore/hyphen; forbidden names suppressed) |
| `articlesPresent=<true\|false>` | Whether an `articles` key exists at top level |
| `articlesIsArray=<true\|false>` | Whether `articles` is an array |
| `articlesLength=<number\|unknown>` | Length of the `articles` array |
| `totalArticlesPresent=<true\|false>` | Whether `totalArticles` key exists |
| `totalArticlesType=<number\|string\|unknown\|absent>` | JavaScript typeof of `totalArticles` |
| `errorFieldPresent=<true\|false>` | Whether `error` or `errors` key exists |
| `messageFieldPresent=<true\|false>` | Whether `message` key exists |
| `forbiddenTopLevelKeyCount=<number>` | Count of suppressed forbidden key names at top level |
| `diagnosticsErrorCode=<code>` | Safe code if diagnostics itself failed (clone unavailable, body read failed) |
| `sanitized=true` | Always present on all output lines |

---

## 7. Forbidden Diagnostics Output

The following must never appear in any diagnostics output line:

- Request URL or provider URL
- `apikey=` or `key=` or `token=` parameter values
- Article URL, article title, article description, article content
- Raw JSON body or raw text body
- Provider error message values
- Stack traces
- `q=` parameter values
- `queryString` values
- `baseUrl` values
- Authorization headers
- Any credential-like token

The following key names are suppressed from `topLevelKeys` and counted in `forbiddenTopLevelKeyCount` if they appear at the top level: `title`, `url`, `description`, `content`, `source`, `image`, `imageurl`, `image_url`, `link`, `body`, `text`, `html`.

---

## 8. Dry-Run and No-Network Validation

| Property | Confirmed |
|---|---|
| Dry-run performs no network calls | Yes — monkey-patched to throw in checker |
| Theme selection checker no network | Yes — monkey-patched |
| Query profile checker no network | Yes — monkey-patched |
| Provider diagnostics checker no network | Yes — globalThis.fetch monkey-patched; synthetic fetch functions used for wrapper tests |
| No env vars required for any checker | Yes — pure helpers only |
| No live branch executed by Claude Code | Yes |
| queryString not in any output | Yes — verified by all checkers |
| Request URL not in diagnostics output | Yes — verified structurally (args never logged) and by checker |
| Raw JSON not in diagnostics output | Yes — only structural metadata emitted |
| Original response body available to caller after wrapper | Yes — only clone is consumed, original is returned |

---

## 9. Validation Results

| Command | Result |
|---|---|
| `npm run check:gnews-news-policy` | All checks passed. Exit 0 |
| `npm run check:gnews-news-engine` | 57/57 PASS |
| `npm run check:gnews-news-api-route` | All 35 groups. Exit 0 |
| `npm run check:gnews-news-api-response` | 61/61 PASS |
| `npm run check:gnews-live-adapter-design` | All checks passed. Exit 0 |
| `npm run check:gnews-live-adapter-static` | All checks passed. Exit 0 |
| `npm run check:gnews-live-adapter-mocked` | 148/148 PASS |
| `npm run check:gnews-live-smoke-script` | All checks passed (Group 16 added). Exit 0 |
| `npm run check:gnews-live-smoke-dry-run` | 29/29 PASS |
| `npm run check:gnews-live-smoke-theme-selection` | 79/79 PASS |
| `npm run check:gnews-live-smoke-query-profile` | 66/66 PASS |
| `npm run check:gnews-live-smoke-provider-diagnostics` | 77/77 PASS |
| `npm run smoke:gnews-live:dry` | PASS (liveAttempted=false). Exit 0 |
| `git diff --check` | LF/CRLF warnings only. Exit 0 |
| `git status --short` | Expected new and modified files only |

---

## 10. Route Boundary

- `src/pages/api/news/market-feed.ts` is unchanged
- Route still returns `source: "fixture"` and `liveEnabled: false`
- Route does not import `gnewsLiveFetchAdapter.mjs` or the owner smoke script
- `src/lib/news/gnewsMarketFeedResponse.mjs` is unchanged
- `src/lib/news/gnewsLiveFetchAdapter.mjs` is unchanged
- Home page does not import the live adapter or smoke script
- No `/news` page was created

---

## 11. Safety Boundaries

- No live GNews call was made by Claude Code
- No owner live smoke was executed in this patch phase
- No `gnews.io` request was made
- No external HTTP request was made
- No env var was read in dry-run, theme-selection, query-profile, or provider-diagnostics checker
- No real API key value was used, printed, or inferred
- No request URL is ever logged by the diagnostics wrapper
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

## 12. Remaining Limitations

- Owner must rotate the previously exposed API key outside Claude Code before any live retry
- Owner diagnostics-mode live smoke not yet executed after this patch
- Real GNews success response not yet validated
- Root cause of `provider_empty_result` remains unconfirmed without diagnostics run
- Route source selector with `GNEWS_LIVE_ENABLED` kill switch not yet implemented
- Cache/persistent storage not implemented
- Scheduled refresh not implemented
- Home UI not connected to news data
- `/news` page not created
- Adapter not Production-enabled

---

## 13. Recommended Next Steps

| Phase | Title | Description |
|---|---|---|
| 3BE-R6 | Owner re-runs live smoke with sanitized diagnostics | Owner rotates API key, sets endpoint-only `GNEWS_BASE_URL`, and runs `--execute-live --confirm-owner-approved --theme=fx --query-profile=simple --diagnostics=sanitized`. Returns only the sanitized gnews3bd output lines including the `provider-diagnostics` step. |
| 3BF | Record owner live smoke result | If 3BE-R6 succeeds, record sanitized structural diagnostics (httpStatusClass, articlesLength, etc.) and article counts only. |
| 3BG | Route source selector with kill switch | Wire `GNEWS_LIVE_ENABLED` kill switch into route; fixture fallback retained; Production still blocked. |
| 3BH | Home Market News UI integration | Wire top-6 articles from `/api/news/market-feed?mode=home` into Home shell via SSR fetch. |
| 3BI | Optional /news paginated list page | `/news` route with offset pagination. |

---

## 14. Confirmed Non-actions

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
