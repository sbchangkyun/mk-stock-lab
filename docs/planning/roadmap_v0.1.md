# MK Stock Lab Development Roadmap v0.1

Created: 2026-06-15
Status: Phase 0 planning baseline

## Phase 0: Repository Audit And Planning Docs

Status: Completed in planning baseline.

Deliverables:

1. Inspect current repository structure.
2. Identify current pages, components, scripts, Supabase usage, ad components, and obsolete features.
3. Create `docs/planning/`.
4. Add v0.1 planning docs and changelog.
5. Check whether dependency install is needed.
6. Run production build and report status.

Phase 0 findings:

1. Dependencies are installed and `npm ls --depth=0` resolves declared packages.
2. Existing app is an Astro server-output project using the Vercel adapter.
3. Source contains obsolete Economic News, Crypto News, and Seibro supply-analysis flows.
4. Source contains mojibake and malformed code that must be handled in Phase 1.

## Phase 1: IA, Nav, Layout Refactor

Goal: replace the current news-centered shell with the target product shell.

Tasks:

1. Remove Economic News, Crypto News, and old Supply Analysis nav entries.
2. Rebuild nav as Home, Chart AI, Heatmap, Lab, Portfolio.
3. Refactor Header for Supabase auth and real light/dark mode.
4. Remove crypto entries from ticker belt.
5. Preserve slide ad and footer fixed ad.
6. Create route skeletons for all target routes.
7. Repair build-breaking malformed markup and script strings.

Validation:

1. `npm run build` passes.
2. Target routes exist.
3. Removed nav items are not reachable unless intentionally redirected.
4. Secret-name search shows no provider secrets in client source or bundle.

## Phase 2: Supabase Schema Rebuild

Goal: reset or replace the database schema with the MVP product schema.

Tasks:

1. Create SQL migration for all target tables.
2. Implement RLS for user portfolios and positions.
3. Make market and Lab data publicly readable.
4. Keep market and Lab writes server-only.
5. Preserve Supabase Auth.

Validation:

1. User A cannot access User B portfolios or positions.
2. Public Lab and market reads work.
3. Anonymous writes are blocked.

## Phase 3: KIS, OpenDART, API Data Layer

Goal: implement server-only data provider wrappers and internal APIs.

Tasks:

1. Add KIS REST wrappers.
2. Add OpenDART wrappers.
3. Add market search, quote, chart, indicator, heatmap, and ticker endpoints.
4. Add portfolio and Lab endpoint foundations.
5. Apply cache policy.

Validation:

1. Provider keys are not exposed to browser bundles.
2. API responses are normalized.
3. Cache expiry works as specified.

## Phase 4: Chart AI MVP

Goal: provide login-required chart analysis for Korean stocks, US stocks, and ETFs.

Tasks:

1. Implement search and detail chart flow.
2. Add daily, weekly, and monthly timeframes.
3. Compute internal indicators.
4. Implement rule engine.
5. Implement daily free quota of 3 per user, reset at KST 00:00.
6. Add affiliate open/interstitial behavior.
7. Use OpenAI lightweight model first, stronger OpenAI model on failure or advanced analysis, Gemini fallback.
8. Render result tabs.

Validation:

1. Logged-out users cannot run analysis.
2. Quota enforcement works.
3. No user-specific analysis history is permanently stored.
4. Language avoids direct financial advice.

## Phase 5: Heatmap MVP

Goal: implement market and portfolio heatmaps.

Tasks:

1. Implement `/heatmap`.
2. Add KOSPI200, KOSDAQ150, S&P500, NASDAQ100, and My Portfolio tabs.
3. Size index boxes by market cap.
4. Size portfolio boxes by evaluated value.
5. Color by daily change rate.
6. Link boxes to Chart AI detail route.

Validation:

1. Heatmap colors follow global scale.
2. My Portfolio requires login.
3. Desktop interaction is stable.

## Phase 6: Lab MVP 1

Goal: implement public Lab hub plus S&P 500 sector and asset-class return pages.

Tasks:

1. Implement `/lab`.
2. Implement `/lab/sp500-sectors`.
3. Implement `/lab/asset-class-returns`.
4. Add table, chart, explanation, FAQ, related content, and ad sections.

Validation:

1. Pages are public.
2. Data date and methodology are visible.
3. Bitcoin appears only on the asset-class returns page.

## Phase 7: Portfolio Rebuild

Goal: rebuild portfolio management around the new schema.

Tasks:

1. Implement `/portfolio`.
2. Require login.
3. Support multiple portfolios.
4. Support KRW and USD holdings.
5. Convert USD holdings to KRW using exchange rate.
6. Add P/L, sector allocation, country allocation, risk score, and rule-based rebalancing note.
7. Add Portfolio AI Agent - Coming soon.

Validation:

1. RLS boundaries hold.
2. Portfolio calculations are deterministic.
3. Portfolio is not directly connected to Chart AI.

## Phase 8: Lab MVP 2

Goal: implement NPS portfolio and Congress stocks.

Tasks:

1. Implement `/lab/nps-portfolio`.
2. Implement `/lab/congress-stocks`.
3. Use OpenDART and manual US data for NPS MVP.
4. Extract and normalize listed stock holdings from the specified Congress disclosure PDF.
5. Separate unlisted stocks.
6. Store raw extraction text and source page.

Validation:

1. Source date and base date are visible.
2. Excluded asset types are not included in listed stock aggregation.
3. Raw extraction audit trail exists.

## Phase 9: Ads And Paid Placeholders

Goal: preserve current ads and add MVP monetization structure.

Tasks:

1. Preserve slide ad and footer fixed ad.
2. Add left side ad and inline card ad for desktop.
3. Add affiliate event logging.
4. Add Coming soon placeholders for advanced usage, portfolio AI, ad-free plan, and Lab filters/download.

Validation:

1. Ad components do not break layout.
2. Events are logged without exposing private data.

## Phase 10: Responsive And Deployment Stabilization

Goal: stabilize desktop first, then mobile and production deployment.

Tasks:

1. Optimize Chart AI panels for mobile.
2. Add heatmap scroll and zoom behavior.
3. Make Lab tables mobile-safe.
4. Make portfolio cards responsive.
5. Add SEO metadata.
6. Confirm Vercel production build.

Validation:

1. `npm run build` passes.
2. Production deployment works.
3. Main desktop and mobile flows are usable.
