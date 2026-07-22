# Phase 3BJ — Home Market News Owner Browser Review & UI Polish
## Result v0.1

---

### 1. Phase identity

| Field | Value |
|-------|-------|
| Phase | 3BJ |
| Branch | `rebuild/phase-1-ia-shell` |
| Commit label | `style: polish home market news section` |
| Live GNews calls | Not performed |
| External HTTP requests | Not performed |
| API route runtime change | None |
| Database / Supabase change | None |
| New pages added | None |
| Deployment | Not performed |

---

### 2. Scope

Apply targeted UI polish to the Home Market News section introduced in Phase 3BH. Harden the static validator with Phase 3BJ checks. Document owner browser review checklist. No behavioral or data-contract changes.

---

### 3. Changes applied

#### 3.1 `src/styles/style.css`

| Property / rule | Before (3BH) | After (3BJ) | Reason |
|-----------------|-------------|-------------|--------|
| `.home-news-section` margin-top | 28px | 32px | Slight increase for visual breathing room |
| `.home-news-header` margin-bottom | 18px | 20px | Align with section rhythm |
| `.home-news-card` gap | 8px | 10px | More internal breathing room between meta / headline / desc |
| `.home-news-card` transition | `border-color 160ms ease` | Both `border-color` and `box-shadow` | Smooth shadow lift on hover |
| `.home-news-card:hover` | border-color only | border-color + box-shadow elevation | Stronger affordance |
| `.home-news-card:focus` / `:focus-visible` | *(missing)* | `outline: 2px solid var(--primary); outline-offset: 2px; border-color: rgba(15,79,216,0.4)` | **Keyboard accessibility fix** |
| `.home-news-headline` line-height | 1.45 | 1.5 | Better Korean text readability |
| `.home-news-source-name` max-width | 100px | 120px | More room for longer source names |
| `.home-news-empty` padding | `24px` | `28px 24px` | More vertical whitespace in empty state |

No grid layout, breakpoint, or color variable changes.

#### 3.2 `scripts/check_home_market_news_static_contract.mjs`

Added **Group 13 (Phase 3BJ): UI polish and accessibility** — 8 new checks:

| Check | What it verifies |
|-------|-----------------|
| Section title rendered | `시장 뉴스` present in component template |
| Category badge element | `home-news-badge` class present in template |
| Source name element | `home-news-source-name` class present in template |
| Date element | `home-news-date` class present in template |
| No `/news` link | Component does not `href="/news"` (page doesn't exist) |
| CSS hover style | `.home-news-card:hover` exists |
| CSS focus-visible style | `.home-news-card:focus` or `:focus-visible` exists |
| CSS transition | `.home-news-card` includes `transition` property |

Total checker checks: **57/57 PASS** (was 49/49).

#### 3.3 `scripts/check_gnews_news_policy_static_contract.mjs`

Added Phase 3BJ artifact group (10 checks):
- Result doc exists
- Home market news checker still exists
- CSS has focus-visible style (accessibility)
- CSS has hover style
- Home still uses mode=home route
- Home still omits source=auto / source=live
- Home still does not import live adapter
- Home still does not import owner smoke script
- No /news page exists

---

### 4. Data contract — unchanged

No changes to the API route, response helper, source selector, or fixture. The public article shape is unchanged from Phase 3BH.

| Field | Type | Rendered by HomeMarketNews |
|-------|------|---------------------------|
| `id` | string | No (used as React key equivalent, not displayed) |
| `title` | string | Yes — `.home-news-headline` |
| `description` | string \| null | Yes — `.home-news-desc` (conditional) |
| `url` | string | Yes — card `href` (opens external tab) |
| `imageUrl` | string \| null | No — images not rendered in this phase |
| `sourceName` | string | Yes — `.home-news-source-name` |
| `publishedAt` | string (ISO 8601) | Yes — `.home-news-date` (formatted `ko-KR`) |
| `category` | string | Yes — `.home-news-badge` (CATEGORY_LABELS mapping) |
| `relevanceScore` | number | No — internal ranking only |

---

### 5. Safety boundaries confirmed

- No `/news` page created.
- No live GNews calls.
- No client-side news fetch.
- No source=auto or source=live used from Home.
- No Supabase queries.
- No live adapter imported into Home or component.
- No external ad scripts or tracking added.
- No GNews env reads from Home or HomeMarketNews.

---

### 6. Validation results

| Checker | Result |
|---------|--------|
| `check:home-market-news` | 57/57 PASS |
| `check:gnews-news-policy` | All PASS |
| `check:gnews-news-engine` | All PASS |
| `check:gnews-news-api-route` | All PASS |
| `check:gnews-news-api-response` | All PASS |
| `check:gnews-news-route-source-selector` | All PASS |
| `check:gnews-live-adapter-design` | All PASS |
| `check:gnews-live-adapter-static` | All PASS |
| `check:gnews-live-adapter-mocked` | All PASS |
| `smoke:gnews-live:dry` | All PASS |
| `npm run build` | PASS |

---

### 7. Owner browser review checklist

The following review should be performed in a browser on the Home page before merging. Claude Code cannot perform browser review.

**Section appearance**
- [ ] "MARKET NEWS" eyebrow label visible above section title
- [ ] "시장 뉴스" heading renders at correct size (≈22px)
- [ ] Lead text "오늘 시장을 움직이는 주요 이슈를 한눈에 확인하세요." renders in muted color
- [ ] Section is visually separated from the Feature Cards grid above

**Card grid**
- [ ] 6 cards render in a 3-column layout on desktop (≥981px)
- [ ] Grid switches to 2-column at ≤980px
- [ ] Grid switches to 1-column at ≤640px
- [ ] Card gap is uniform; cards are evenly distributed

**Card content**
- [ ] Category badge (e.g., "국내 주식") is visible and readable in each card
- [ ] Source name is visible and truncated if longer than ~120px
- [ ] Date is aligned to the right of the card meta row
- [ ] Article title renders in bold, 2–3 lines max with `word-break: keep-all`
- [ ] Description renders truncated to 2 lines where present
- [ ] Cards with no description show only title (no blank space below)

**Interaction**
- [ ] Hovering a card raises a subtle shadow and shifts border to blue tint
- [ ] Clicking a card opens the article URL in a new tab
- [ ] Keyboard Tab navigation highlights each card with a visible blue outline
- [ ] Focus ring is visible on all 6 cards (2px solid blue, offset 2px)

**Empty state**
- [ ] When `newsArticles` is empty (or SSR fetch fails), the section shows "표시할 시장 뉴스가 없습니다." inside a dashed border box

**Negative checks**
- [ ] No "실시간" (real-time) text visible
- [ ] No debug info (source, liveEnabled, fallbackReason) visible to the user
- [ ] No link pointing to `/news` (that page doesn't exist)
- [ ] No image placeholders (imageUrl is not rendered)

---

### 8. Recommended next phase

**Phase 3BK** — News list route and pagination: implement `mode=list` support in the market-feed route returning up to 20 articles with category filter support, backed by fixture data.

Alternatively, **Phase 3BI** (optional `/news` paginated list page) if a public news listing is needed before expanding route capability.

---

### 9. Open items / blocked

- Owner must rotate the GNews API key exposed during Phase 3BE before any live smoke attempt.
- GNews provider returns `provider_empty_result` for all tested Korean query themes — live smoke blocked pending key rotation and provider investigation.

---

### 10. Artifacts

| Artifact | Path |
|----------|------|
| Home Market News component | `src/components/HomeMarketNews.astro` |
| Home page SSR fetch | `src/pages/index.astro` |
| CSS news section styles (updated) | `src/styles/style.css` |
| Static checker (updated) | `scripts/check_home_market_news_static_contract.mjs` |
| Policy checker (updated) | `scripts/check_gnews_news_policy_static_contract.mjs` |
| This result doc | `docs/planning/phase_3bj_home_market_news_owner_review_ui_polish_result_v0.1.md` |
| Changelog | `docs/planning/planning_changelog.md` |
