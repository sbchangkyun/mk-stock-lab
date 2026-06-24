# Phase 3BF — GNews Live Smoke Diagnostics Result v0.1

## 1. Title and Metadata

- **Phase**: 3BF
- **Type**: GNews live smoke diagnostics result record
- **Status**: Recorded
- **Latest implementation commit before recording**: 86b575d test: add gnews smoke diagnostics
- **Documentation-only phase**: yes
- **Live GNews calls by Claude Code**: not performed
- **Owner live smoke execution**: performed outside Claude Code
- **API route runtime change**: none
- **Database changes**: none
- **Supabase changes**: none
- **Home integration**: none
- **Deployment**: not performed
- **Date**: 2026-06-24

---

## 2. Objective

Record sanitized owner-run diagnostics results from Phase 3BE-R6 and decide whether live GNews empty results should block project progression.

The Phase 3BE-R5 patch added `--diagnostics=sanitized` mode to the owner smoke script. After that implementation was committed (`86b575d`), the owner manually executed live smoke runs outside Claude Code using the sanitized diagnostics option and shared only the structural gnews3bd output lines — no article content, raw JSON, request URLs, or key values.

---

## 3. Owner-Run Diagnostics Evidence

The following table records the sanitized structural observations from owner-run live smoke with `--diagnostics=sanitized`. No article content, raw JSON body, request URL, article title, article URL, article description, stack trace, or API key value is recorded here.

| themeKey | category | queryProfile | diagnostics | httpStatusClass | httpOk | contentTypeJson | bodyReadable | jsonParseOk | topLevelKeyCount | topLevelKeys | articlesPresent | articlesIsArray | articlesLength | totalArticlesPresent | totalArticlesType | errorFieldPresent | messageFieldPresent | finalErrorCode | smokeResult |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| fx | FX | simple | sanitized | 2xx | true | true | true | true | 3 | information,totalArticles,articles | true | true | 0 | true | number | false | false | provider_empty_result | failed |
| market_stocks | MARKET_STOCKS | simple | sanitized | 2xx | true | true | true | true | 4 | information,articlesRemovedFromResponse,totalArticles,articles | true | true | 0 | true | number | false | false | provider_empty_result | failed |
| crypto_digital_assets | CRYPTO_DIGITAL_ASSETS | simple | sanitized | 2xx | true | true | true | true | 4 | information,articlesRemovedFromResponse,totalArticles,articles | true | true | 0 | true | number | false | false | provider_empty_result | failed |
| oil_commodities | OIL_COMMODITIES | simple | sanitized | 2xx | true | true | true | true | 4 | information,articlesRemovedFromResponse,totalArticles,articles | true | true | 0 | true | number | false | false | provider_empty_result | failed |

**Observation**: Three of four tested themes (`market_stocks`, `crypto_digital_assets`, `oil_commodities`) include an `articlesRemovedFromResponse` top-level key that is absent from the `fx` response. This is a structural signal from the provider that matching articles existed but were removed from the response — suggesting active provider-side removal or filtering behavior, not a query-match failure or network error.

---

## 4. Summary of Prior Owner-Run Failures

The following sanitized facts are carried forward from earlier phases. No article content, raw payload, URL, title, description, stack trace, or API key value is recorded.

| Phase | Query Profile | Themes Tested | Result |
|---|---|---|---|
| 3BE (policy) | policy | macro_policy, fx, market_stocks, crypto_digital_assets | provider_empty_result across all |
| 3BE-R3 (simple) | simple | macro_policy, fx, market_stocks, crypto_digital_assets, oil_commodities | provider_empty_result across all |
| 3BE-R6 (simple + diagnostics) | simple | fx, market_stocks, crypto_digital_assets, oil_commodities | provider_empty_result across all (detailed diagnostics captured) |

Additional notes:
- All shared outputs were sanitized and did not include article titles, article URLs, article descriptions, raw JSON, stack traces, or API key values.
- A GNews API key was previously exposed by the owner in chat. It must be treated as compromised and rotated outside Claude Code. The key value is not recorded here and must not be recorded anywhere in this project.

---

## 5. Diagnosis

Based on the sanitized evidence:

**What works:**
- The live guard check passes.
- The HTTP request reaches the provider (HTTP 2xx, no network error).
- JSON parsing succeeds (`jsonParseOk: true`).
- The provider response includes the expected top-level `articles` field.
- `articles` is an array (`articlesIsArray: true`).
- No provider `error` or `message` field was present.
- Theme selection, query profile selection, and sanitized diagnostics all function correctly.

**What does not work:**
- `articlesLength` is 0 across all tested themes and both query profiles.
- The smoke adapter correctly detects this as `provider_empty_result`.

**Diagnostic conclusion:**
- The repeated `provider_empty_result` is not evidence of an HTTP failure, JSON parse failure, route failure, Home UI failure, DB failure, Supabase failure, or adapter top-level response-shape failure.
- The presence of the `articlesRemovedFromResponse` key in three of four responses is a strong signal of active provider-side removal behavior — articles matching the query were found but filtered out before delivery.
- The issue is most likely one or more of: provider-side removal policy or response constraints, query language/region compatibility (Korean query terms on a provider configured for a different locale), plan-level article access restriction, or API key quota/tier behavior.
- None of these can be diagnosed further without live inspection access, which is forbidden in the current project scope.

---

## 6. Decision

The following decisions apply immediately:

- **Do not continue spending implementation time in 3BE live smoke debugging now.**
- **Do not mark live GNews retrieval as passed.**
- **Do not block the project on live GNews success.**
- **Proceed to fixture/fallback-first architecture.**
- **Keep live GNews disabled by default** (`liveEnabled: false`, `GNEWS_LIVE_ENABLED` kill switch off).
- **Maintain the fixture-backed route as the stable baseline** for Home UI development and all downstream work.
- **Treat live GNews compatibility as a later isolated provider-compatibility phase** — separate from route, Home UI, and caching implementation phases.

The empty-result diagnostics provide sufficient signal that the route infrastructure and adapter are working. The provider-side issue is understood at the structural level and does not require further smoke instrumentation at this time.

---

## 7. Impact on Project Plan

- The API route and Home UI can proceed using the fixture/fallback contract. No blocker.
- Live provider success is not a prerequisite for Home news UI shell development.
- Future live route integration must include fixture fallback on `provider_empty_result`, rate limit, provider error, timeout, and invalid payload — all of which the current adapter design already supports.
- Production live mode remains blocked until a future readiness phase that resolves provider compatibility.
- The `articlesRemovedFromResponse` key is noted as a provider-specific field to document in a future provider-compatibility phase. It may indicate a content licensing, language, or plan restriction.

---

## 8. Safety Boundaries Confirmed

- No live GNews call was made by Claude Code.
- No GNews API key value was recorded, printed, inferred, or validated.
- No raw provider JSON was recorded.
- No article title, article URL, or article description was recorded.
- No stack trace was recorded.
- No API route behavior was changed.
- No database or migration file was added.
- No Supabase query or write occurred.
- No Home integration was implemented.
- No `/news` page was created.
- No deployment was performed.
- No Vercel environment variable was inspected or mutated.
- No KIS provider logic was changed.
- No `.env*` file was read.
- No external HTTP request was made by Claude Code.

---

## 9. Recommended Next Phases

| Phase | Title | Description |
|---|---|---|
| 3BG | News Route Source Selector with Kill Switch and Fixture Fallback | Wire `GNEWS_LIVE_ENABLED` kill switch into the route; add fixture fallback on `provider_empty_result`, rate limit, provider error, timeout, and invalid payload. Production still blocked. |
| 3BH | Home Market News UI Integration | Wire top-6 articles from `/api/news/market-feed?mode=home` (fixture-backed) into Home shell via SSR fetch. No live provider required. |
| 3BI | Optional `/news` Paginated List Page | `/news` route with offset pagination against the same fixture-backed route. |
| Later: Provider Compatibility | GNews provider compatibility investigation | English query profile, `lang`/`country` parameter tuning, `totalArticles` count diagnostics, provider plan/quota review, or alternative provider/RSS fallback evaluation. Isolated from main project phases. |

---

## 10. Confirmed Non-Actions

- No live GNews call occurred.
- No `gnews.io` request occurred.
- No external HTTP request occurred by Claude Code.
- No `.env*` content was read.
- No API route behavior was changed.
- No database or migration file was added.
- No Supabase query or write occurred.
- No Vercel environment variable was inspected or mutated.
- No Home integration was implemented.
- No `/news` page was created.
- No deployment was performed.
- No deployed URL was called.
- No secret, key value, raw payload, Preview URL, Supabase URL, or credential-like value was recorded.
- No KIS provider logic was changed.
- No Vercel config was changed.
- No auth/session logic was changed.
- No Home page runtime was changed.
- No UI component was changed.
- No root README.md was changed.
- Claude memory files were not modified.
- No scheduled job or Vercel cron was added.
- No owner live smoke was executed by Claude Code.
- `src/lib/news/gnewsLiveFetchAdapter.mjs` was not modified.
- `src/pages/api/news/market-feed.ts` was not modified.
- `scripts/owner_smoke_gnews_live_fetch.mjs` was not modified.
