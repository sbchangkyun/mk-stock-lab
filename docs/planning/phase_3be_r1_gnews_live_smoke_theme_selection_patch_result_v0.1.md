# Phase 3BE-R1 — GNews Live Smoke Theme Selection Patch Result v0.1

## 1. Title and Metadata

- **Phase**: 3BE-R1
- **Type**: GNews live smoke theme selection patch
- **Status**: Implemented
- **Live GNews calls by Claude Code**: not performed
- **Owner live smoke execution**: not performed in this patch phase
- **Dry-run validation**: performed
- **Theme-selection validation**: performed (behavioral, no network)
- **API route runtime change**: none
- **Database changes**: none
- **Supabase changes**: none
- **Home integration**: none
- **Deployment**: not performed
- **Date**: 2026-06-24

---

## 2. Objective

Phase 3BE-R1 adds a safe `--theme=<queryKey>` option to the owner-run GNews live smoke script (`scripts/owner_smoke_gnews_live_fetch.mjs`). This patch was motivated by Phase 3BE, during which the live smoke reached the provider but returned `provider_empty_result` for all attempted themes. The theme selector allows the owner to retry with a specific query theme using a single request, reducing request consumption.

The patch also adds an endpoint-only validation guard for `GNEWS_BASE_URL` to prevent accidentally configured full URLs with embedded query strings or API key parameters.

No live GNews call is performed in this phase. No route behavior is changed.

---

## 3. Phase 3BE Observation Summary

The following sanitized facts are recorded from Phase 3BE. No article content, raw payload, URL, title, description, or key value is recorded.

| Observation | Detail |
|---|---|
| Live smoke attempted | Yes — owner executed outside Claude Code |
| Guard conditions | Passed (all CLI flags and env vars confirmed) |
| maxThemes=2 first attempt | Failed: `provider_empty_result` and `provider_rate_limited` |
| maxThemes=1 retry | Failed: `provider_empty_result` |
| Article content recorded | No |
| Raw payload recorded | No |
| API key exposed in chat | Yes — accidentally pasted by owner. Treated as compromised. Owner must rotate outside Claude Code. The key value is not recorded here. |

---

## 4. Implementation Summary

| Artifact | Action |
|---|---|
| `scripts/owner_smoke_gnews_live_fetch.mjs` | Patched — added `--theme` option and base URL guard |
| `scripts/check_gnews_live_smoke_script_static_contract.mjs` | Updated — added Group 14 with 15 Phase 3BE-R1 checks |
| `scripts/check_gnews_live_smoke_script_dry_run.mjs` | Updated — added 2 extra forbidden-output checks |
| `scripts/check_gnews_live_smoke_theme_selection.mjs` | Created — behavioral theme-selection checker |
| `scripts/check_gnews_news_policy_static_contract.mjs` | Updated — added Phase 3BE-R1 artifact group |
| `package.json` | Updated — added `check:gnews-live-smoke-theme-selection` |

**New exports from smoke script:**
- `SMOKE_ALLOWED_THEME_KEYS` — `Set` of 6 valid queryKey strings
- `parseThemeArg(argList)` — extracts `--theme=<key>` value from CLI args
- `selectSmokeThemeDefinitions(definitions, { themeKey, maxThemes })` — pure theme selector
- `validateEndpointOnlyBaseUrl(value)` — endpoint-only URL validator

---

## 5. Theme Selection Behavior

**CLI option:** `--theme=<queryKey>`

**Allowed queryKey values:**

| queryKey | category |
|---|---|
| `market_stocks` | `MARKET_STOCKS` |
| `macro_policy` | `MACRO_POLICY` |
| `fx` | `FX` |
| `oil_commodities` | `OIL_COMMODITIES` |
| `crypto_digital_assets` | `CRYPTO_DIGITAL_ASSETS` |
| `personal_finance` | `PERSONAL_FINANCE` |

**Behavior when `--theme` is absent:** existing behavior — first `maxThemes` definitions selected (max cap 2).

**Behavior when `--theme` is valid:** exactly one matching definition selected, `effectiveMaxThemes = 1`.

**Behavior when `--theme` is invalid:** fails before any env read with `invalid_theme` reason code. No fetch is called.

**Validation order in live branch:**
1. CLI flags checked (`--execute-live`, `--confirm-owner-approved`)
2. Theme validated against allowlist (pure, no env reads)
3. Env vars read (`GNEWS_LIVE_ENABLED`, `VERCEL_ENV`, `GNEWS_BASE_URL`, `GNEWS_API_KEY`)

**Allowed theme selection output (safe fields only):**
- `themeKey=<queryKey>` — e.g. `themeKey=fx`
- `category=<CATEGORY_ENUM>` — e.g. `category=FX`
- `maxThemes=1`
- `definitionCount=6`

**Forbidden output:** the Korean `queryString` is never logged. The GNews `q` parameter value is never printed.

---

## 6. Base URL Guard

`GNEWS_BASE_URL` is validated by `validateEndpointOnlyBaseUrl(value)` inside `checkLiveGuards()`.

**Requirements:** the value must be an endpoint-only URL with no query string and no embedded key/token/query fragments.

**Rejection rules:**

| Condition | Reason code |
|---|---|
| Value is not a string | `invalid_base_url` |
| `new URL(value)` throws | `invalid_base_url` |
| `parsed.search` is non-empty | `invalid_base_url` |
| Value contains `apikey=` | `invalid_base_url` |
| Value contains `key=` | `invalid_base_url` |
| Value contains `token=` | `invalid_base_url` |
| Value contains `?q=` or `&q=` | `invalid_base_url` |

The actual URL value is never printed in any code path. The `invalid_base_url` reason code is emitted instead.

Example: `https://api.example.test/v4/search` passes; `https://api.example.test/v4/search?apikey=placeholder` is rejected with `invalid_base_url`.

---

## 7. Dry-Run and No-Network Validation

| Property | Confirmed |
|---|---|
| Dry-run performs no network calls | Yes — `globalThis.fetch` monkey-patched to throw in checker |
| Theme selection checker performs no network calls | Yes — monkey-patched, 0 fetch calls confirmed |
| No env vars required for dry-run | Yes — `runDryRun()` reads no env |
| No env vars required for theme-selection checker | Yes — pure helpers only |
| No live branch executed by Claude Code | Yes |
| queryString not in dry-run output | Yes — verified by checker |
| No Korean query string patterns in dry-run output | Yes — verified by checker |

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
| `npm run check:gnews-live-smoke-script` | All checks passed (Group 14 added). Exit 0 |
| `npm run check:gnews-live-smoke-dry-run` | 29/29 PASS |
| `npm run check:gnews-live-smoke-theme-selection` | 62/62 PASS |
| `npm run smoke:gnews-live:dry` | PASS (liveAttempted=false). Exit 0 |
| `git diff --check` | LF/CRLF warnings only. Exit 0 |
| `git status --short` | Expected new and modified files only |

---

## 9. Route Boundary

- `src/pages/api/news/market-feed.ts` is unchanged
- Route still returns `source: "fixture"` and `liveEnabled: false`
- Route does not import `gnewsLiveFetchAdapter.mjs` or the owner smoke script
- `src/lib/news/gnewsMarketFeedResponse.mjs` is unchanged
- Home page does not import the live adapter or smoke script
- No `/news` page was created

---

## 10. Safety Boundaries

- No live GNews call was made by Claude Code
- No owner live smoke was executed in this patch phase
- No `gnews.io` request was made
- No external HTTP request was made
- No env var was read in dry-run or theme-selection checker
- No real API key value was used, printed, or inferred
- No route behavior was changed
- No database or migration file was added
- No Supabase query or write occurred
- No Home integration was implemented
- No `/news` page was created
- No deployment was performed
- No `.env*` file was read
- The accidentally exposed API key was not quoted, recorded, reused, or validated — owner must rotate it outside Claude Code

---

## 11. Remaining Limitations

- Owner must rotate the accidentally exposed API key outside Claude Code
- Theme-specific live smoke not yet executed after this patch — `provider_empty_result` root cause unknown
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
| 3BE-R2 | Owner re-runs live smoke with theme selector | Owner sets endpoint-only `GNEWS_BASE_URL`, rotates API key, and runs `--execute-live --confirm-owner-approved --theme=macro_policy` or `--theme=fx`. Returns only sanitized count/category summary. |
| 3BF | Record owner live smoke result | If 3BE-R2 succeeds, record sanitized themeCount/successCount/articleCount only. |
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
