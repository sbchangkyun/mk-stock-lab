# Phase 4A — Home and Common Shell Production Readiness (Plan v0.1)

Baseline: `origin/main` = `0fc70122466aefcca5b485d8645129e1388d7bb2` (Phase 3GL-HF5 merge, PR #11), which
also carries Phase 3GM (PR #10, merge commit `be4fbaa`).
Branch: `feature/phase-4a-home-common-shell-production` (pre-existing, created empty from this baseline).

## 1. Objective

Convert the Home page (`/`) and the shared application shell (Header, Nav, Footer, Layout, 404) from
Preview/dev-stage presentation into an honest, truthful Production presentation. This is a
**presentation/copy/accessibility/responsive-shell readiness pass** — explicitly not a redesign, not a
new feature, and not a change to any provider, business-logic, schema, or environment contract.

## 2. Explicit non-goals

No change to: GNews provider strategy or the Home news API contract/refresh interval, KIS provider
behavior or the Home live-market API contract, Chart AI usage-limit/analysis behavior, portfolio
valuation logic, Supabase schema/data/RLS, environment variables, Vercel project settings, auth provider
configuration, or global advertising business rules. Home news/market/portfolio component presentation
is touched only where strictly required for shell consistency, preserving the existing `feedMode`
contract (`latest`/`latest_available`/`last_good`), notices, publication dates, 5-minute refresh, single
API request per component, and no fabricated data.

## 3. Pre-implementation truth audit (performed before writing any copy)

Before drafting the Home feature-card copy, the actual current scope of each linked page was verified by
direct source inspection rather than assumed:

- **Chart AI** (`src/pages/chart-ai.astro`): real login gate, real KR/US OHLCV charts, real "유사 패턴
  분석" (similarity) and "MK AI 분석" features, combined daily usage limit of 3 (`하루 3회`, both server
  usage-notice copy and UI copy agree).
- **Market** (`src/pages/market.astro` → `LiveMarketDashboard.astro`): real KOSPI200/KOSDAQ150/S&P500/
  NASDAQ100 coverage via representative ETF proxies (page already discloses "지수 자체가 아닌 대표
  ETF(proxy) 기준"), real Treemap and Momentum/Trend scatter views.
- **Lab** (`src/pages/lab.astro`): only the asset-class-returns and S&P-500-sector-returns cards are
  live/available (both explicitly labeled "예시 데이터" on the Lab page itself); the NPS-holdings and
  Congress-stocks cards are explicitly marked "연동 예정" (coming soon, preview-only) on Lab itself. The
  pre-4A Home Lab card falsely implied all four were available — this is corrected.
- **Portfolio** (`src/pages/portfolio.astro`): real authenticated CRUD; live valuation is explicitly
  scoped to domestic (KR) positions only ("국내 종목은 실시간 시세로 평가금액과 손익을 계산합니다") — no
  US/USD live-valuation claim exists on the page, so the Home card must not imply one either.
- **Home state components** (`HomeMarketNews`, `HomeLiveMarketSnapshot`, `HomePortfolioPanel`,
  `HomeRetentionPanel`, `HomeMobileAd`, `HomeRailAd`): reviewed against the phase's detailed
  correctness requirements (single-fetch ownership, honest empty/error states, no cross-device/
  cross-user leakage, no reserved blank ad space, `prefers-reduced-motion` handling) and found already
  fully compliant — left unchanged except for any CSS side-effect from the shared shell pass, spot-checked
  after those edits.

## 4. Planned changes

1. **`src/pages/index.astro`** — replace the hero eyebrow/H1/lead with the exact required truthful
   Korean copy (removing "Preview" and "단계적으로 연결" staged wording); rewrite the four feature-card
   descriptions per §3 above.
2. **`src/components/Header.astro`** — remove the fabricated `Today: 000` visitor-count placeholder
   (`.today-placeholder`) with no fake replacement; preserve logo/brand/theme-toggle/login/mypage/logout.
3. **`src/lib/shell/navActiveLink.ts` (new)** — extract the closed 5-item nav registry and active-link
   matching logic out of `Nav.astro`'s frontmatter into a pure, independently testable module (same
   behavior, not a duplicate), so the exact-5-item contract and matching rules are real executable code.
4. **`src/components/Nav.astro`** — import the extracted module; add `aria-current="page"` to the active
   link. No route renames; `/admin/operations` stays unlinked; `/heatmap` stays only a legacy alias.
5. **`src/styles/style.css`** — remove `.today-placeholder` and its mobile media-query rule; rebalance
   `.header-actions` gap; add focus-visible outlines for `brand-mark`, `icon-button`/`header-button`,
   `nav-link` (also tied to `[aria-current="page"]`), `button-link`/`feature-card`, and
   `.site-footer-links a`; raise the mobile `.header-button`/`.icon-button` touch targets to the 44px
   minimum. The existing shared page-shell `min-width:0`/`max-width:100%` containment list (covering
   Chart AI/Market/Lab/Portfolio/Admin Operations) is preserved untouched.
6. **`src/pages/404.astro` (new)** — a real static 404 using the shared Layout, with the exact required
   copy and links to `/` and `/market`, no provider/auth/network call.
7. **Docs** — `mk_stock_lab_master_roadmap_v2.1.md` and `planning_changelog.md` updated in place: record
   Phase 3GM and Phase 3GL-HF5 as `PRODUCTION_VERIFIED` (both confirmed merged to `main` via direct `git
   log` inspection: PR #10 merge commit `be4fbaa`, PR #11 merge commit `0fc7012`), clarify the Vercel-only
   deployment policy next to the existing "Stale Netlify dependency" deferred item, and add forward
   navigation-based roadmap entries for Phases 4B (Chart AI), 4C (Market), 4D (Lab), 4E (Portfolio), and
   4F (cross-page Owner QA closeout).
8. **Tests** — new `scripts/check_phase_4a_home_common_shell_contract.mjs` (static contract, ≥55 grouped
   assertions) and `scripts/smoke_phase_4a_home_common_shell.mjs` (+
   `scripts/phase_4a_home_common_shell_testsrc.ts`, exercising the real `navActiveLink.ts` logic), wired
   into `package.json` as `check:phase-4a-home-common-shell` / `smoke:phase-4a-home-common-shell`. All
   pre-existing Phase 3GL/3GJ/3GM assertions are left untouched in their own files.

## 5. Verification plan

Run and record exact totals for the new Phase 4A smoke/checker plus the pre-existing
`smoke:phase-3gl-home-live-data`, `check:phase-3gl-home-live-data`, `smoke:phase-3gm-operations-admin-mvp`,
`check:phase-3gm-operations-admin-mvp` suites (regression guard — none of this phase's edits should change
their pass counts), plus `npm ls --depth=0`, `git diff --check`, and `npm run build`. Diff review before
committing for scope creep, encoding corruption, secrets, and absolute local paths.

## 6. What this plan explicitly defers

- **Preview verification, PR review-thread state, and merge decision** — Owner-only, per explicit
  instruction not to merge.
- **Authenticated click-through QA** (mobile/touch/keyboard/screen-reader spot checks of the shell
  changes) — deferred to Phase 4F per the roadmap's navigation-based Phase 4B–4F lane, same reason every
  other recent phase has deferred it (no authenticated browser session available to this assistant).
- **`@astrojs/netlify` package.json dependency removal** — out of this phase's Home/shell scope; already
  tracked separately as `DEFERRED` in the roadmap's parallel hardening lane.

See `phase_4a_home_common_shell_production_result_v0.1.md` for the executed result, exact test totals,
and build outcome.
