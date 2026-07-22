# Phase 3BL — Home Portfolio Status Panel: Result Document

**Version:** v0.1  
**Branch:** `rebuild/phase-1-ia-shell`  
**Committed as:** `feat: add home portfolio status panel`

---

## 1. Objective

Replace the static Market Coverage card in the Home hero section's right column with a three-state portfolio status panel (`HomePortfolioPanel.astro`). The panel delivers content tailored to the user's auth and portfolio state through progressive client-side enhancement, with an SSR-safe signed-out default.

---

## 2. Changes Made

| File | Action | Notes |
|---|---|---|
| `src/components/HomePortfolioPanel.astro` | Created | Three-state panel component |
| `src/pages/index.astro` | Modified | Import + replace market-panel aside |
| `src/styles/style.css` | Modified | Add `.home-portfolio-panel` and `.hpp-*` CSS |
| `scripts/check_home_portfolio_panel_static_contract.mjs` | Created | 11-group static checker |
| `scripts/check_gnews_news_policy_static_contract.mjs` | Modified | Phase 3BL artifact group appended |
| `package.json` | Modified | `check:home-portfolio-panel` script added |
| `docs/planning/planning_changelog.md` | Modified | Phase 3BL entry added |

---

## 3. HomePortfolioPanel — State Summary

### State A: `signed_out` (SSR default, visible)

- Eyebrow: **PORTFOLIO START**
- Heading: 포트폴리오 관리를 시작해보세요
- Lead copy explaining the portfolio tracking value proposition
- 4-step guide: 무료 계정으로 시작 → 포트폴리오 만들기 → 보유 종목 입력 → 투자 현황 확인
- CTA: 포트폴리오 시작하기 → `/portfolio`
- Trigger: Default SSR render, or `mk:auth-state` signed_out event, or 401 from portfolioApi

### State B: `signed_in_empty`

- Eyebrow: **NEXT STEP**
- Heading: 첫 포트폴리오를 만들어보세요
- Lead copy confirming account readiness, prompting portfolio creation
- 4-step guide with step 01 (로그인 완료) de-emphasized and step 02 (포트폴리오 만들기) highlighted as the next step
- "다음 단계" badge on step 02
- CTA: 포트폴리오 만들기 → `/portfolio`
- Trigger: `portfolioApi.listPortfolios()` returns empty array

### State C: `signed_in_with_portfolio`

- Eyebrow: **MY PORTFOLIO**
- Heading: 내 포트폴리오 요약
- Stats: portfolio count (filled by JS)
- 분석 현황 note directing to /portfolio (no live KIS data)
- Portfolio name tags (up to 4, escaped)
- CTA: 포트폴리오 보기 → `/portfolio`
- Trigger: `portfolioApi.listPortfolios()` returns non-empty array

---

## 4. Auth Detection Strategy

| Signal | Source | Effect |
|---|---|---|
| SSR render | No auth context at SSR time | State A visible by default |
| `mk:auth-state` signed_out | Header.astro custom event | Switch to State A |
| `mk:auth-state` signed_in | Header.astro custom event | Trigger portfolioApi call |
| `portfolioApi.listPortfolios()` → 401 | No session (PortfolioApiError) | Stay at State A |
| `portfolioApi.listPortfolios()` → [] | Signed in, no portfolios | Switch to State B |
| `portfolioApi.listPortfolios()` → [...] | Signed in with portfolios | Switch to State C |
| Any other error | Network error, 5xx | Stay at State A (safe fallback) |

No extra auth fetch is made beyond what `portfolioApi.listPortfolios()` internally requires via `getCurrentSession()`.

---

## 5. Invariants and Safety Boundaries

- No GNews imports, no KIS imports, no external fetch calls.
- No server-side auth check (Supabase not available at SSR time).
- No 평가금액 or 수익률 values claimed (no live KIS data).
- No client-side news fetch.
- No Supabase write/mutation calls.
- `innerHTML` is not used for untrusted content (portfolio names set via `textContent`).
- HTML in State C name tags uses `textContent` via `createElement`, not `innerHTML`.
- `isSupabaseConfigured()` guard checked before any Supabase-dependent call.
- `window.mkHppInit` idempotency guard prevents double-init.

---

## 6. CSS Approach

All new CSS classes use the `.hpp-` prefix and are grouped under the `/* --- Home Portfolio Panel --- */` section in `style.css`, inserted immediately before the existing `/* --- My Page Shell --- */` section.

Key selectors added:
- `.home-portfolio-panel` — flex container, reuses `.panel` card appearance
- `.hpp-state` — flex child, each state section
- `.hpp-steps` / `.hpp-step` — step list layout
- `.hpp-step-done` / `.hpp-step-next` / `.hpp-step-future` — step state modifiers
- `.hpp-next-badge` — "다음 단계" inline badge
- `.hpp-cta` — full-width CTA link (extends `.button-link`)
- `.hpp-summary` / `.hpp-stat-row` / `.hpp-stat-label` / `.hpp-stat-value` / `.hpp-stat-placeholder` — State C metrics
- `.hpp-portfolio-names` / `.hpp-portfolio-tag` — portfolio name tags

---

## 7. Static Checker — Groups

The checker (`scripts/check_home_portfolio_panel_static_contract.mjs`) runs 11 groups:

1. File existence (component, home page, HomeMarketNews, CSS, package.json script)
2. Home page integration (import, no market-panel remnants, HomeMarketNews still present)
3. Component state structure (all three states present, default-visible marker)
4. Korean UI copy — signed_out state
5. Korean UI copy — signed_in_empty state
6. Compact dashboard — signed_in_with_portfolio state
7. Live isolation (no GNews/KIS/external HTTP imports)
8. Auth and data isolation (correct auth pattern, no external fetch, no news fetch, no debug chips)
9. CSS styling (all `.hpp-*` selectors present, focus style, summary styles)
10. Boundary isolation (no /news page, no Supabase mutations, no ad scripts)
11. Network safety guard (checker itself makes no network calls)

---

## 8. Validator Results

All validators ran before commit with these results:

| Command | Result |
|---|---|
| `npm run check:home-portfolio-panel` | PASS |
| `npm run check:home-market-news` | PASS |
| `npm run check:gnews-news-policy` | PASS |
| `npm run check:gnews-news-engine` | PASS |
| `npm run check:gnews-news-api-route` | PASS |
| `npm run check:gnews-news-api-response` | PASS |
| `npm run check:gnews-news-route-source-selector` | PASS |
| `npm run check:gnews-live-adapter-design` | PASS |
| `npm run check:gnews-live-adapter-static` | PASS |
| `npm run check:gnews-live-adapter-mocked` | PASS |
| `npm run smoke:gnews-live:dry` | PASS |
| `git diff --check` | no whitespace errors |
| `git status --short` | no untracked surprises |
| `npm run build` | PASS |

---

## 9. What Was Not Changed

- `HomeMarketNews.astro` — untouched. The home news grid beneath the hero section is unchanged.
- `src/pages/portfolio.astro` — not touched (Phase 3BM scope).
- `/portfolio` route — no behavioral changes.
- No new routes, no new API endpoints, no cron, no scheduler, no localStorage keys.
- GNews live adapter, smoke scripts, source selector — untouched.
- `.market-panel` CSS rule left in style.css (other pages may reference `.market-panel` class; cleanup deferred to future cleanup pass).

---

## 10. Open Items / Deferred

| Item | Decision |
|---|---|
| Portfolio dashboard expansion (positions, cost basis) | Deferred to Phase 3BM |
| Status chip removal from /portfolio | Deferred to Phase 3BM |
| Portfolio sidebar-to-tabs conversion | Deferred to Phase 3BN |
| Bookmark tab UX with reorder | Deferred to Phase 3BN |
| Mobile breakpoint for hero-section panel stacking | Deferred (existing hero overflow behavior unchanged) |
| `.market-panel` CSS rule removal | Deferred to cleanup phase |
| GNews live smoke | Owner-run only; blocked pending API key rotation |
