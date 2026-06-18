# App Server Integration Plan v0.1

## 1. Status And Scope

Phase 3A is planning-only.

The production Supabase schema was applied in Phase 2L and is ready for application and server integration planning.

Phase 3A performs no product implementation, no API route creation, no production database mutation, no Vercel environment variable mutation, and no deployment.

Phase 3A does not authorize service-role exposure, provider key exposure, or client-side secret use. Future implementation must keep browser-safe public Supabase configuration separate from server-only service and provider credentials.

## 2. Current Production DB Baseline

Phase 2L completed the approved production reset/drop and applied `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.

Current baseline from Phase 2L:

- 14 required public tables exist.
- RLS is enabled on all 14 required public tables.
- `ad_events` intentionally has no public select or insert policy.
- `chart_ai_cache` is non-personal and has no `user_id`.
- `internal.consume_chart_ai_usage(uuid, integer)` exists and is executable only by `service_role`.
- The Phase 2H `usage_date_kst` ambiguity fix is present in the production source migration.
- The usage-function runtime test is still pending because Phase 2L had no safe Auth Admin/test-user creation channel through the connector.

Advisor follow-up items remain:

- Review leaked password protection before public user onboarding.
- Treat `ad_events` RLS-with-no-policy information as expected until a server-side ad event route is implemented.
- Revisit the unindexed `ad_events.user_id` foreign key during ad-event route work.
- Treat unused index findings as expected immediately after a fresh schema rebuild until real workload exists.

## 3. Existing App Architecture Scan

Current route/page skeletons:

| Route | Current file | Current state |
|---|---|---|
| `/` | `src/pages/index.astro` | Static IA shell with links to Chart AI, Heatmap, Lab, and Portfolio. |
| `/chart-ai` | `src/pages/chart-ai.astro` | Static Chart AI workspace placeholder; no provider calls. |
| `/heatmap` | `src/pages/heatmap.astro` | Static heatmap shell with sample cells. |
| `/lab` | `src/pages/lab.astro` | Public Lab hub skeleton. |
| `/portfolio` | `src/pages/portfolio.astro` | Static login-required portfolio shell. |
| `/lab/congress-stocks` | `src/pages/lab/congress-stocks.astro` | Public Lab child page skeleton. |
| `/lab/nps-portfolio` | `src/pages/lab/nps-portfolio.astro` | Public Lab child page skeleton. |
| `/lab/sp500-sectors` | `src/pages/lab/sp500-sectors.astro` | Public Lab child page skeleton. |
| `/lab/asset-class-returns` | `src/pages/lab/asset-class-returns.astro` | Public Lab child page skeleton; Bitcoin is limited to this cross-asset context. |

Existing Supabase helper/client files:

- `src/lib/supabase.ts` creates a browser Supabase client from public-prefixed environment variables.
- The helper currently logs a generic missing-public-env message without printing values.
- The helper currently attaches the Supabase client to `window`; future implementation should reassess whether this global exposure is necessary.

Current auth modal and auth entry points:

- `src/components/Header.astro` contains Login and Logout buttons and listens to Supabase auth state.
- `src/components/Auth/AuthModal.astro` contains email/password login and signup controls.
- `src/components/Auth/GoogleLogin.astro` starts Google OAuth through Supabase Auth.
- No profile bootstrap, profile upsert, or server-side session validation path exists yet.

Current layout, nav, ticker, and ad components:

- `src/layouts/Layout.astro` composes the shared shell.
- `src/components/Nav.astro` contains only Home, Chart AI, Heatmap, Lab, and Portfolio.
- `src/components/Ticker.astro` contains stock, index, FX, gold, and oil labels without broad crypto tickers.
- `src/components/SlideAd.astro` and `src/components/Footer.astro` preserve ad surfaces.
- `src/scripts/main.js` handles theme state, ticker theme sync, slide ad timing, and footer ad close behavior.

Current server endpoint structure:

- No `src/pages/api` endpoint files currently exist.
- No server-only Supabase helper currently exists.
- No provider integration modules currently exist.

Legacy remnants that should remain removed:

- Old Economic News, Crypto News, Seibro/Supply Analysis, and legacy proxy API surfaces should not return.
- Removed route strings must remain absent from source and generated output during later implementation.

Gaps between the current shell and production schema:

- Auth UI exists, but profile bootstrap and server-side session validation are not wired.
- Portfolio tables exist, but no CRUD UI or routes are implemented.
- Chart AI usage function exists, but no server usage guard or runtime test path exists.
- Market, Lab, heatmap, and cache tables exist, but the shell still uses static placeholder data.
- Ad surfaces exist, but no server-side ad event write route exists.

The root `README.md` still contains unrelated Astro Starter Kit content and remains documentation debt outside Phase 3A.

## 4. Integration Principles

- Client code may use only public-safe Supabase browser client variables.
- The Supabase service-role key must be used only in server-side runtime code.
- Provider keys must be server-only.
- RLS remains a defense layer, not the only access-control mechanism.
- Auth-required features must validate the user session server-side before writes.
- Cache and public Lab data should not require user identity unless a feature explicitly needs user-scoped rows.
- `ad_events` must not accept direct client writes; the server-write-only design must be preserved.
- No production environment variable changes should be included in implementation phases unless separately approved.
- User identity supplied by the browser must be treated as untrusted unless derived from a validated session.
- Public cache tables must avoid storing direct personal identifiers unless the schema explicitly supports a user-scoped use case.

## 5. Environment Variable Plan

No values were read, requested, printed, or recorded in Phase 3A.

| Variable name or category | Intended runtime | Client/server visibility | Required for feature | Phase to validate |
|---|---|---|---|---|
| Public Supabase URL category, currently represented by `PUBLIC_SUPABASE_URL` | Browser and server rendering when creating public client | Public-safe browser variable | Supabase Auth and public Data API reads | Phase 3B |
| Public Supabase anon key category, currently represented by `PUBLIC_SUPABASE_ANON_KEY` | Browser and server rendering when creating public client | Public-safe browser variable | Supabase Auth and public Data API reads | Phase 3B |
| Supabase service-role key category | Server runtime only | Server-only secret | Profile bootstrap if server-controlled, Chart AI usage guard, server writes, ad events, provider cache writes | Phase 3B before first server write |
| KIS provider key category | Server runtime only | Server-only secret | Market symbol, quote, chart, ticker, and heatmap provider fetches | Phase 3E or later provider phase |
| KIS provider secret category | Server runtime only | Server-only secret | Market provider authenticated calls | Phase 3E or later provider phase |
| OpenDART key category | Server runtime only | Server-only secret | NPS domestic holdings ingestion | Future Lab ingestion phase after Phase 3E |
| OpenAI key category | Server runtime only | Server-only secret | Chart AI execution if OpenAI is selected | Phase 3D |
| Gemini key category | Server runtime only | Server-only secret | Chart AI execution if Gemini is selected or used as fallback | Phase 3D |
| AI model setting category | Server runtime only unless explicitly public-safe | Server-only by default | Chart AI provider selection and fallback behavior | Phase 3D |
| Affiliate/ad setting category | Server runtime for tracking; static public ad markup only where safe | Mixed; secrets server-only | Slide/footer ad rendering and future ad event attribution | Phase 3F |
| Feature flag category | Browser only for display flags; server for authorization or provider flags | Depends on flag sensitivity | Gradual rollout of DB-backed features | Phase 3G |

## 6. Route And Feature Integration Map

| Route or feature | DB tables/functions used | Auth requirement | Server-only requirement | Current implementation status | Recommended implementation phase |
|---|---|---|---|---|---|
| `/` | Optional public reads from `market_quote_cache`, `market_symbols`, `lab_*` summaries later | None for public shell | Server-only only if provider refresh is triggered | Static route shell | Phase 3E for DB-backed public modules |
| `/chart-ai` | `market_symbols`, `market_chart_cache`, `chart_ai_cache`, `ai_usage_daily`, `internal.consume_chart_ai_usage(uuid, integer)` | Login required for execution | Usage consumption and provider calls must be server-only | Static placeholder | Phase 3D |
| `/heatmap` | `market_symbols`, `market_quote_cache`, `heatmap_cache`, optional `portfolios` and `portfolio_positions` for user portfolio heatmap | Public for market views; login for portfolio view | Provider refresh and user-scoped cache writes server-only | Static placeholder | Phase 3E |
| `/lab` | Lab table summaries | None | Ingestion writes server-only in a later phase | Static public hub | Phase 3E for reads; later for ingestion |
| `/portfolio` | `profiles`, `portfolios`, `portfolio_positions`, optional `market_quote_cache` for valuation | Login required | Writes should use validated session; service role only if server-controlled operations need it | Static placeholder | Phase 3C |
| `/lab/congress-stocks` | `lab_congress_stock_holdings` | None | Ingestion server-only and separately planned | Static public child page | Phase 3E for reads; later ingestion |
| `/lab/nps-portfolio` | `lab_nps_holdings` | None | OpenDART/manual ingestion server-only and separately planned | Static public child page | Phase 3E for reads; later ingestion |
| `/lab/sp500-sectors` | `lab_sp500_sector_returns` | None | Ingestion server-only and separately planned | Static public child page | Phase 3E |
| `/lab/asset-class-returns` | `lab_asset_class_returns` | None | Ingestion server-only and separately planned | Static public child page; Bitcoin allowed only here | Phase 3E |
| Auth/profile bootstrap | `profiles` | Login required | Server-side bootstrap preferred if service role is available; controlled client upsert may be allowed by RLS | Auth modal exists; no profile bootstrap | Phase 3B |
| Slide/footer ad events | `ad_events` | Optional user session enrichment | Writes must be server-only | Ad surfaces exist; no event write route | Phase 3F |

## 7. Server API Boundary Plan

These are conceptual server routes or server actions only. Phase 3A does not implement them.

| Planned server boundary | Inputs | Auth/session requirement | Tables/functions touched | Service-role requirement | Rate-limit or abuse-control consideration | Validation strategy | Phase assignment |
|---|---|---|---|---|---|---|---|
| Chart AI execution route | Symbol, market, timeframe, chart context, optional indicator settings | Required; validate session server-side | `market_symbols`, `market_chart_cache`, `chart_ai_cache`, `ai_usage_daily`, `internal.consume_chart_ai_usage(uuid, integer)` | Required for usage function and controlled cache writes | Per-user daily limit plus request throttling | Unit checks for validation, server-only secret scan, runtime usage-limit test | Phase 3D |
| Chart AI usage guard route or integrated guard | User session and requested cost | Required; derive user from server session | `internal.consume_chart_ai_usage(uuid, integer)`, `ai_usage_daily` | Required | Atomic DB function, no client-side counter trust | Test allowed states and denied fourth request path | Phase 3D |
| Portfolio read/write routes | Portfolio name, base currency, positions, symbols, quantities, dates, memo | Required; validate session server-side | `profiles`, `portfolios`, `portfolio_positions` | Optional if RLS client path is sufficient; required for server-controlled writes | Per-user write throttling and schema validation | CRUD smoke with owner isolation and RLS checks | Phase 3C |
| Profile bootstrap/upsert route | Authenticated user session, display fields if allowed | Required | `profiles` | Preferred if plan or server-controlled fields are initialized | One bootstrap per login/session; reject plan mutation | Login flow smoke, profile row creation, plan immutability check | Phase 3B |
| Market symbol/quote/chart cache routes | Symbol search query, symbol, market, timeframe | Public reads; provider refresh server-only | `market_symbols`, `market_quote_cache`, `market_chart_cache` | Required for cache writes; not required for public reads | Cache TTL enforcement and provider quota guard | Public read smoke, cache fallback tests, provider-disabled tests | Phase 3E or later provider packet |
| Heatmap data route | Universe, optional portfolio view, period | Public for market universes; required for portfolio view | `heatmap_cache`, `market_quote_cache`, optional `portfolios`, `portfolio_positions` | Required for cache writes and user-scoped server aggregation | Universe whitelist and response size limits | Route smoke, schema validation, user portfolio authorization test | Phase 3E |
| Lab dataset read routes | Dataset key, year, filters, pagination | None for public data | `lab_sp500_sector_returns`, `lab_asset_class_returns`, `lab_nps_holdings`, `lab_congress_stock_holdings` | Not required for public reads | Pagination and filter allowlists | Public route smoke and deterministic sample checks | Phase 3E |
| Ad event write route | Event type, page path, placement, optional campaign/referrer metadata | Optional user session; never trust client user id | `ad_events` | Required because no public insert policy exists | IP/session throttling, payload size limit, event type allowlist | Insert route test with sanitized payload, Advisor revisit | Phase 3F |

## 8. Chart AI Integration Plan

- Chart AI execution must require login.
- Server code must call `internal.consume_chart_ai_usage(uuid, integer)` with service-role access.
- The service-role key must never be exposed to the browser.
- The UI and server response must handle `remaining_count` and denied states.
- Non-personal AI result data may be cached only where appropriate.
- User-specific data must not be stored in `chart_ai_cache`.
- Provider strategy must be selected later: OpenAI, Gemini, or fallback.
- The runtime test path for `internal.consume_chart_ai_usage(uuid, integer)` is still required because Phase 2L skipped it.
- Provider execution should be isolated behind a server module so usage checks happen before paid AI calls.
- If provider credentials are unavailable, Phase 3D should support a disabled or dry response path rather than leaking configuration details.

## 9. Portfolio/Auth/Profile Integration Plan

- `/portfolio` requires login.
- `profiles` should be bootstrapped or upserted after login through a safe server path or a controlled client path consistent with RLS.
- `portfolios` and `portfolio_positions` operations must be scoped to the authenticated user.
- Implementation must avoid relying on hidden client-side user IDs alone.
- Create operations should derive owner from the validated session.
- Read operations should return only user-owned portfolios and positions.
- Update operations should validate ownership, editable fields, numeric bounds, date formats, and currency/market enums.
- Delete operations should validate ownership and handle child positions intentionally.
- The minimal first implementation slice should create or find the profile after login, list empty portfolios, create one portfolio, add one position, and read it back as the same user.
- Cross-user isolation must be validated before any broader portfolio analytics are added.

## 10. Public Data And Lab Integration Plan

- Lab pages are public.
- Dataset tables include S&P 500 sector returns, asset-class returns, NPS holdings, and Congress stock holdings.
- Public read behavior should use anon-safe policies where already designed.
- Data ingestion is not part of Phase 3A.
- Future ingestion should be server-side and separately planned.
- Bitcoin may appear only in asset-class returns per planning decision; crypto must not become a broad product feature.
- Initial Lab implementation should prefer DB-backed read routes or direct anon-safe reads from public tables before adding provider ingestion.
- Missing datasets should render explicit empty states instead of attempting provider fetches from the browser.

## 11. Heatmap And Market Cache Plan

The relevant tables are `market_symbols`, `market_quote_cache`, `market_chart_cache`, and `heatmap_cache`.

Initial implementation should use cached DB data when present and explicit static fallback content when the cache is empty. Provider-backed server fetch should be a separate later step because it introduces KIS credentials, provider quotas, cache write policy, and failure handling.

Minimal safe first implementation path:

1. Build read-only market and heatmap data access for public cache rows.
2. Preserve the existing static/mock placeholder when no cache rows exist.
3. Add user portfolio heatmap only after Portfolio MVP owner isolation is validated.
4. Add provider-backed cache refresh later through server-only routes or scheduled jobs.

This sequencing separates UI wiring from provider integration and keeps provider secrets out of the browser.

## 12. Ad Events Plan

- `ad_events` is server-write-only.
- No public insert policy is intentional.
- A future ad-event route must validate payload, rate limit requests, and write server-side.
- The Advisor finding for unindexed `ad_events.user_id` can be handled when implementing this route.
- No ad-event route is implemented in Phase 3A.
- The route should store only minimal event metadata and avoid direct personal contact or payment data.

## 13. Advisor And Security Follow-Up Plan

- Review leaked password protection before public user onboarding.
- Treat the `ad_events` no-policy information as expected until server route implementation.
- Treat unused index information as expected after the fresh schema rebuild.
- Revisit `ad_events.user_id` indexing during ad-event route work.
- The usage-function runtime test still requires a safe Auth Admin/test-user path or future server route.
- Repeat source and generated-output scans before deployment.
- Review client/server separation before adding any service-role helper.

## 14. Implementation Phase Proposal

### Phase 3B: Supabase Client/Server Helper Boundary And Auth/Profile Bootstrap

Expected files:

- `src/lib/supabase.ts`
- New server-only Supabase helper file.
- Header/auth components as needed.
- Optional server route or action for profile bootstrap.
- Relevant planning changelog entry.

Validation commands:

- `npm run build`
- Route smoke checks for `/` and `/portfolio`
- Static scan for service-role and provider secret exposure
- Client bundle scan for server-only markers

Stop conditions:

- Any service-role key import in browser code.
- Any profile plan mutation allowed from uncontrolled client input.
- Any auth flow console error that blocks login/logout shell behavior.

### Phase 3C: Portfolio MVP Integration

Expected files:

- Portfolio route/page components.
- Portfolio server routes or controlled Supabase data access modules.
- Validation helpers for portfolio and position payloads.
- Tests or smoke scripts if added by the implementation packet.

Validation commands:

- `npm run build`
- Portfolio route smoke check
- CRUD smoke with authenticated test path when available
- Owner-isolation and RLS-oriented checks

Stop conditions:

- Any direct trust in browser-supplied user IDs.
- Any cross-user portfolio visibility.
- Any write path that bypasses intended ownership rules.

### Phase 3D: Chart AI Usage Guard And Server-Only AI Execution Skeleton

Expected files:

- Chart AI page integration.
- Server route for usage guard and execution skeleton.
- Server-only provider abstraction.
- Usage-function runtime validation notes.

Validation commands:

- `npm run build`
- Chart AI route smoke check
- Static secret marker scan
- Runtime usage-limit test through a safe server path when available

Stop conditions:

- Any service-role or provider key exposure to client code.
- Any AI provider call before successful usage guard.
- Any user-specific data written to `chart_ai_cache`.

### Phase 3E: Public Lab/Heatmap DB Read Integration

Expected files:

- Lab route data loading modules.
- Heatmap route data loading modules.
- Public read helpers for anon-safe cache and Lab tables.
- Empty-state UI updates.

Validation commands:

- `npm run build`
- Route smoke checks for `/heatmap`, `/lab`, and all Lab child routes
- Public-read behavior checks with empty and seeded datasets where available
- Removed route scan

Stop conditions:

- Any provider credential use in browser code.
- Any broad crypto feature beyond asset-class returns.
- Any public route requiring login without product approval.

### Phase 3F: Ad-Event Server Route And Advisor Follow-Up

Expected files:

- Server route for ad event writes.
- Payload validation and rate-limit logic.
- Optional `ad_events.user_id` index migration if approved.
- Advisor follow-up documentation.

Validation commands:

- `npm run build`
- Ad-event route payload validation test
- Rate-limit smoke check
- Supabase Advisor review only if explicitly approved for that phase

Stop conditions:

- Any direct browser insert into `ad_events`.
- Any unbounded event payload.
- Any collection of direct personal contact or payment data.

### Phase 3G: Security/Env Audit And Pre-Deployment Integration Smoke

Expected files:

- Planning changelog.
- Security/env audit notes.
- Smoke-check evidence docs.
- Optional deployment-readiness checklist.

Validation commands:

- `npm run build`
- Route smoke checks for all target routes
- Static secret marker scan
- Service-role exposure scan
- Generated output scan
- Removed route scan
- Ignored-file coverage check

Stop conditions:

- Any production env var mutation without explicit approval.
- Any deployment request without an approval gate.
- Any generated bundle containing server-only secret markers.

## 15. Validation Strategy

Future implementation validation should include:

- `npm run build`
- Route smoke checks.
- Auth flow checks where possible.
- Static secret marker scan.
- Removed route scan.
- Service-role exposure scan.
- Server/client boundary scan.
- Generated output scan.
- No verbose build with real environment variables.
- Future runtime validation for the usage function.
- Vercel environment variable mutation remains prohibited unless separately approved.

Product source and generated output should be scanned for provider secret markers and server-only patterns before every implementation commit that touches integration code.

## 16. Stop Conditions For Future Implementation

- Any service-role key exposure risk.
- Any provider key exposure risk.
- Any direct browser write path to server-only tables.
- Any Supabase RLS bypass from client code.
- Any production DB mutation outside reviewed routes.
- Any Vercel environment variable change request without explicit approval.
- Any reintroduction of removed legacy routes.
- Any attempt to use broad crypto functionality outside the allowed asset-class returns scope.

## 17. Recommended Next Action

Proceed to Phase 3B: Supabase client/server helper boundary and auth/profile bootstrap.

Options:

- Option A: Proceed to Phase 3B auth/profile/server-boundary implementation.
- Option B: Run Phase 2M Advisor/security follow-up before implementation.
- Option C: Defer DB-backed features and implement UI with mock/static data only.

## 18. Final Statement

Phase 3A is planning-only and authorizes no production mutation, environment variable mutation, deployment, or feature implementation.
