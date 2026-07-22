# Phase 3BH — Home Market News UI Integration v0.1

## 1. Title and Metadata

- **Phase**: 3BH
- **Type**: Home Market News UI integration
- **Status**: Implemented
- **Latest prior commit**: 4fae7c1 feat: add news source selector fallback
- **Live GNews calls by Claude Code**: not performed
- **Owner live smoke execution**: not performed in this phase
- **API route runtime change**: none — route unchanged
- **Home integration**: implemented (top-6 articles from fixture-default route)
- **Database changes**: none
- **Supabase changes**: none
- **Deployment**: not performed
- **Date**: 2026-06-24

---

## 2. Objective

The Home page now renders up to 6 market news article cards through the existing fixture-default `/api/news/market-feed?mode=home` route contract. The fetch is performed server-side during SSR; no source parameter is passed, so the route uses its default fixture source. All live GNews calls remain disabled by default. A graceful empty/fallback state is rendered if the SSR fetch fails or returns no articles.

---

## 3. Implementation Summary

**Files changed:**

| File | Change |
|---|---|
| `src/pages/index.astro` | Added SSR fetch + `HomeMarketNews` import |
| `src/components/HomeMarketNews.astro` | Created — news section component |
| `src/styles/style.css` | Added Home news section styles |
| `scripts/check_home_market_news_static_contract.mjs` | Created — 49-check static contract checker |
| `scripts/check_gnews_news_policy_static_contract.mjs` | Added Phase 3BH artifact group |
| `docs/planning/phase_3bh_home_market_news_ui_integration_result_v0.1.md` | Created — this result doc |
| `docs/planning/planning_changelog.md` | Prepended Phase 3BH entry |
| `package.json` | Added `check:home-market-news` script |

**Component path**: `src/components/HomeMarketNews.astro`

**SSR fetch path**: `index.astro` frontmatter — `new URL('/api/news/market-feed?mode=home', Astro.url)` — server-side only, no client-side JS for news.

**Styling additions**: Added `.home-news-section`, `.home-news-header`, `.home-news-grid` (3-col desktop, 2-col 980px, 1-col 640px), `.home-news-card`, `.home-news-badge`, `.home-news-source-name`, `.home-news-date`, `.home-news-headline`, `.home-news-desc`, `.home-news-empty` with responsive breakpoints.

**Checker path**: `scripts/check_home_market_news_static_contract.mjs` (49/49 PASS)

**Package script**: `check:home-market-news`

---

## 4. Data Contract

- **Route**: `/api/news/market-feed?mode=home`
- **Source parameter**: omitted intentionally — route uses fixture default
- **Default source**: `fixture` — no live GNews dependency
- **Articles field**: `data.articles` (array) — sliced to 6 by `HomeMarketNews.astro`
- **Public article fields rendered**: `id`, `title`, `description`, `url`, `imageUrl`, `sourceName`, `publishedAt`, `category`, `relevanceScore`
- **Category labels**: mapped to Korean display names (국내 주식, 환율, 거시/정책, 원자재, 가상자산, 재테크, 글로벌 지수)
- **Date formatting**: `publishedAt` formatted to Korean locale `(month) (day)` via `toLocaleDateString('ko-KR')`

---

## 5. UI Behavior

**Section structure:**
- Eyebrow: `MARKET NEWS`
- Section title: `시장 뉴스` (h2)
- Lead copy: `오늘 시장을 움직이는 주요 이슈를 한눈에 확인하세요.`
- Grid: up to 6 article cards

**Article card fields rendered:**
- Category badge (Korean label)
- Source name
- Published date
- Article title (headline)
- Description (2-line clamp)
- Entire card links to `article.url` (`target="_blank" rel="noopener noreferrer"`)

**Empty/fallback state**: If SSR fetch fails or returns 0 articles, renders:
> 표시할 시장 뉴스가 없습니다.

**No live/real-time claims**: Component copy does not use "실시간", "live", or any claim about data freshness or provider source.

**Responsive behavior**:
- 1440px+: 3-column grid within main column, rail ad appears in sidebar
- 980px: 2-column grid
- 640px: 1-column grid

**Client-side JS**: None added for news (no `<script>` block in `HomeMarketNews.astro`).

---

## 6. Safety Boundaries

- No live GNews call was made by Claude Code.
- No external HTTP request was made by Claude Code.
- No `.env*` file was read.
- No API key value was used, printed, or inferred.
- No request URL, raw provider payload, or raw provider error was recorded.
- No internal article fields (`canonicalUrlHash`, `titleHash`, `isDuplicate`, `isActive`, `rawProviderStored`, etc.) were rendered to users.
- No API key / request URL / raw JSON / stack trace appears in any response or UI output.
- Home does not import `gnewsLiveFetchAdapter` directly.
- Home does not import the owner smoke script.
- Home does not read any GNews env variable (`GNEWS_API_KEY`, `PUBLIC_GNEWS_API_KEY`, `GNEWS_BASE_URL`, `GNEWS_LIVE_ENABLED`).
- No DB, migration, or Supabase changes were made.
- No KIS provider changes were made.
- No Vercel configuration was modified.
- No deployment was performed.
- No `/news` page was created.
- No cache, storage, scheduler, or cron was added.
- Auth/session logic was not changed.

---

## 7. Validation Results

| Command | Result |
|---|---|
| `npm run check:home-market-news` | 49/49 PASS |
| `npm run check:gnews-news-policy` | All checks passed. Exit 0 |
| `npm run check:gnews-news-engine` | PASS |
| `npm run check:gnews-news-api-route` | All checks passed (groups 1-8 validated). Exit 0 |
| `npm run check:gnews-news-api-response` | PASS |
| `npm run check:gnews-news-route-source-selector` | 148/148 PASS |
| `npm run check:gnews-live-adapter-design` | All checks passed. Exit 0 |
| `npm run check:gnews-live-adapter-static` | All checks passed. Exit 0 |
| `npm run check:gnews-live-adapter-mocked` | PASS |
| `npm run smoke:gnews-live:dry` | PASS (liveAttempted=false). Exit 0 |
| `git diff --check` | LF/CRLF warnings only. Exit 0 |
| `git status --short` | Expected modified and new files only |
| `npm run build` | (see Section 9 — build run note) |

---

## 8. Route/Home Boundary

- Route default remains `fixture`. No route code was modified.
- Home does not request `source=auto` or `source=live`.
- Home constructs the URL as `new URL('/api/news/market-feed?mode=home', Astro.url)` — no hardcoded base domain, no external URL.
- Home is now connected only to the safe route contract: fixture-backed, no live GNews dependency.
- `/news` page was not created.
- The existing ad rail (`HomeRailAd`) layout is preserved.

---

## 9. Remaining Limitations

- **Live GNews provider compatibility**: All tested themes returned `provider_empty_result`. Home uses fixture/fallback-first data. Provider compatibility remains an isolated future investigation.
- **No cache or storage**: Each SSR request re-fetches from the same fixture data. No incremental refresh or background fetch.
- **No scheduled refresh**: News data is fixture-backed and static.
- **No `/news` page**: Paginated list view is not implemented.
- **Production live enablement**: `VERCEL_ENV=production` blocks live gate. Default remains fixture.
- **SSR self-fetch latency**: The SSR fetch calls the local route via HTTP (`Astro.url`). In Vercel serverless, this adds one extra HTTP hop per home page request. If this becomes a concern, a future phase can switch to a direct helper import. For Phase 3BH (fixture-backed), this is acceptable.

---

## 10. Recommended Next Phases

| Phase | Title | Description |
|---|---|---|
| 3BI | Optional `/news` Paginated List Page | Wire `mode=list` route into a `/news` page with offset pagination. Default source remains `fixture`. |
| 3BJ | Home News UI Polish | Owner browser review of news cards. Spacing, typography, category badge colors, mobile experience. |
| Later: Provider Compatibility | GNews Provider Compatibility Investigation | English query profile, `lang`/`country` parameter tuning, `totalArticles` diagnostics, provider plan/quota review, or alternative provider/RSS fallback evaluation. Isolated from main project phases. |
