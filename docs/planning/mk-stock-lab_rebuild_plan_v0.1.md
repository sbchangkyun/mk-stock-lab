# MK Stock Lab Rebuild Plan v0.1

Created: 2026-06-15
Status: Phase 0 planning baseline
Repository: `mk-stock-lab`
Production: `https://mkstocklab.vercel.app/`
Stack: Astro, JavaScript, TypeScript, CSS, Python, Supabase, Vercel

## Product Direction

MK Stock Lab will be rebuilt from a news-oriented site into an advertising-supported public investment data platform for intermediate Korean and US stock and ETF investors.

The four core pillars are:

1. Chart AI analysis
2. Market heatmaps
3. Lab data content
4. Portfolio management

The main product excludes crypto search, crypto chart AI, and crypto portfolio support. Bitcoin may appear only in the Lab asset-class returns page.

## Target Information Architecture

Primary navigation:

| Label | Route | Auth |
|---|---|---|
| Home | `/` | Public |
| Chart AI | `/chart-ai` | Analysis requires login |
| Heatmap | `/heatmap` | Public, with My Portfolio tab requiring login |
| Lab | `/lab` | Public |
| Portfolio | `/portfolio` | Login required |

Lab routes:

| Page | Route | Phase |
|---|---|---|
| Congress Stocks | `/lab/congress-stocks` | Phase 8 |
| NPS Portfolio | `/lab/nps-portfolio` | Phase 8 |
| S&P 500 Sectors | `/lab/sp500-sectors` | Phase 6 |
| Asset-Class Returns | `/lab/asset-class-returns` | Phase 6 |

## Remove

| Existing Area | Current Evidence | Phase 1 Treatment |
|---|---|---|
| Economic News | `src/pages/api/news.js`, `getNewsData`, nav entry | Remove nav and functionality |
| Crypto News | `src/pages/api/list.js`, TokenInsight client flow, crypto nav entry | Remove nav and functionality |
| Supply Analysis | `/seibro`, `src/components/Seibro/*`, `seibro_holdings` endpoint | Remove or isolate as data inspiration only |
| Crypto ticker symbols | TradingView ticker includes BTC, ETH, SOL | Remove from ticker belt |

## Preserve And Refactor

| Area | Current Evidence | Target |
|---|---|---|
| Portfolio | `src/components/Portfolio.astro`, `AddStockModal.astro`, Supabase tables | Rebuild around `portfolios` and `portfolio_positions` |
| Supabase Auth | `src/lib/supabase.ts`, `AuthModal.astro`, `GoogleLogin.astro` | Preserve auth, fix UI and session flow |
| Light/Dark mode | Header button and body class logic exist | Implement real theme state and component styling |
| Ticker belt | `src/components/Ticker.astro` | Rebuild around indices, FX, gold, and oil |
| Slide ad | `src/components/SlideAd.astro` | Preserve and restyle |
| Footer fixed ad | `src/components/Footer.astro` | Preserve and restyle |
| Vercel deployment | `astro.config.mjs` uses `@astrojs/vercel` | Preserve |

## Design Direction

The design target is a clean, trustworthy, institutional financial UI inspired by Coinbase-style blue, white, and charcoal systems. Lab pages should use data-content patterns similar to ETFShopping: data table, chart, explanation, FAQ, related content cards, and ad areas.

Implementation priorities:

1. PC-first desktop UX.
2. Stable chart, table, and heatmap layouts before mobile refinement.
3. Global heatmap colors: green positive, red negative, neutral gray near zero.
4. Heatmap scale: less than or equal to -5% deep red, greater than or equal to +5% deep green.
5. Clear informational language without direct financial advice.

## Phase 0 Repository Audit

Current structure:

| Area | Files |
|---|---|
| Pages | `src/pages/index.astro`, `src/pages/seibro.astro`, API files under `src/pages/api/` |
| Layout | `src/layouts/Layout.astro` |
| Common components | `Header`, `Nav`, `Ticker`, `SlideAd`, `Footer`, `ChartArea` |
| Auth components | `src/components/Auth/AuthModal.astro`, `GoogleLogin.astro` |
| Portfolio components | `src/components/Portfolio.astro`, `Portfolio/AddStockModal.astro` |
| Legacy supply components | `src/components/Seibro/*` |
| Scripts | `src/scripts/main.js`, `src/scripts/scraper.py` |
| Styles | `src/styles/style.css` |
| Public assets | logo, PWA icons, manifest, service worker, redirects, ads file |

Key audit findings:

1. The current app is tightly coupled to a single-page menu script in `src/scripts/main.js`.
2. Obsolete news and crypto flows are implemented in both UI and API layers.
3. The Seibro supply-analysis route and components are still present.
4. Supabase is currently initialized with public URL and anon key, which is acceptable for browser auth but not for future server-only provider secrets.
5. Portfolio logic exists but uses legacy table naming and client-side Supabase calls that should be redesigned with RLS and server endpoints.
6. Several source files contain mojibake and malformed string or markup fragments; Phase 1 should expect build repair work before feature work.
7. `node_modules` is present and `npm ls --depth=0` resolves declared dependencies, so a dependency install was not required during Phase 0.

## MVP Scope

The rebuild MVP should complete:

1. IA, nav, layout, and route skeletons.
2. Supabase schema and RLS rebuild.
3. Server-only market data layer.
4. Chart AI MVP with usage limit, ad event, market-data-based analysis, and compliant investment language.
5. Heatmap MVP.
6. Lab MVP 1: S&P 500 sectors and asset-class returns.
7. Portfolio MVP with multi-portfolio holdings input and rule-based analysis.
8. Lab MVP 2: NPS portfolio and Congress stocks.
9. Ad placements and paid-feature placeholders.
10. Responsive and deployment stabilization.

## Documentation Policy

Planning documents live in `docs/planning/`.

Update planning docs after meaningful phase-level blocks, not after every small task. Each phase update must also update `planning_changelog.md`.
