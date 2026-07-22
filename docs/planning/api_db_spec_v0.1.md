# MK Stock Lab API and DB Specification v0.1

Created: 2026-06-15
Status: Phase 0 planning baseline

## Environment Variables

Server-only variables:

```env
KIS_APP_KEY=
KIS_APP_SECRET=
KIS_ACCOUNT_NO=
KIS_REAL_BASE_URL=
OPENDART_API_KEY=
OPENAI_API_KEY=
OPENAI_DEFAULT_MODEL=
OPENAI_ADVANCED_MODEL=
GEMINI_API_KEY=
GEMINI_FALLBACK_MODEL=
COUPANG_AFFILIATE_URL=
```

Browser-safe Supabase variables:

```env
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
```

Provider secrets must never be exposed through `PUBLIC_` variables or client bundles.

## Internal API Endpoints

Market:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/market/search` | GET | Unified Korean and US stock/ETF search |
| `/api/market/quote` | GET | Current quote |
| `/api/market/chart` | GET | Daily, weekly, monthly OHLCV |
| `/api/market/indicators` | GET | Internal technical indicators |
| `/api/market/heatmap` | GET | Heatmap data |
| `/api/market/ticker` | GET | Header ticker data |

Chart AI:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/chart-ai/usage` | GET | Daily quota state |
| `/api/chart-ai/analyze` | POST | Run or retrieve analysis |
| `/api/chart-ai/ad-click` | POST | Record affiliate event |

Portfolio:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/portfolio/list` | GET | List user portfolios |
| `/api/portfolio/create` | POST | Create portfolio |
| `/api/portfolio/update` | POST | Update portfolio |
| `/api/portfolio/delete` | POST | Delete portfolio |
| `/api/portfolio/positions/add` | POST | Add holding |
| `/api/portfolio/positions/update` | POST | Update holding |
| `/api/portfolio/positions/delete` | POST | Delete holding |
| `/api/portfolio/analyze` | GET | Portfolio analytics |

Lab:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/lab/sp500-sectors` | GET | S&P 500 sector returns |
| `/api/lab/asset-class-returns` | GET | Asset-class returns |
| `/api/lab/nps-portfolio` | GET | NPS portfolio data |
| `/api/lab/congress-stocks` | GET | Congress stock holdings |

## Cache Policy

| Data | During market hours | After close |
|---|---:|---:|
| Current quote | 60 seconds | 1 day |
| Daily/weekly/monthly chart | 30 minutes | 1 day |
| Heatmap | 60 minutes | 1 day |
| Lab data | Daily at 08:00 KST | Daily |
| AI analysis | 10 to 30 minutes | 10 to 30 minutes |

## Supabase Schema

The existing Supabase project may be reset. Phase 2 should create migrations or SQL for the tables below.

### `profiles`

| Column | Type | Notes |
|---|---|---|
| id | uuid primary key | References `auth.users.id` |
| email | text | User email |
| display_name | text | Display name |
| plan | text | `free` by default |
| created_at | timestamptz | Created time |
| updated_at | timestamptz | Updated time |

### `portfolios`

| Column | Type | Notes |
|---|---|---|
| id | uuid primary key | Portfolio ID |
| user_id | uuid | Owner |
| name | text | Portfolio name |
| base_currency | text | `KRW` by default |
| created_at | timestamptz | Created time |
| updated_at | timestamptz | Updated time |

### `portfolio_positions`

| Column | Type | Notes |
|---|---|---|
| id | uuid primary key | Position ID |
| portfolio_id | uuid | Parent portfolio |
| symbol | text | Ticker |
| market | text | KR or US |
| asset_type | text | stock or etf |
| name | text | Display name |
| buy_price | numeric | Buy price |
| quantity | numeric | Quantity |
| buy_date | date | Buy date |
| memo | text | Optional memo |
| currency | text | KRW or USD |
| created_at | timestamptz | Created time |
| updated_at | timestamptz | Updated time |

### `ai_usage_daily`

| Column | Type | Notes |
|---|---|---|
| id | uuid primary key | Usage row ID |
| user_id | uuid | User ID |
| usage_date_kst | date | KST usage date |
| used_count | int | Used analyses |
| free_limit | int | Default 3 |
| created_at | timestamptz | Created time |
| updated_at | timestamptz | Updated time |

Unique key: `(user_id, usage_date_kst)`.

### Market and Cache Tables

| Table | Purpose |
|---|---|
| `market_symbols` | Searchable Korean and US stocks and ETFs |
| `market_quote_cache` | Current quote cache |
| `market_chart_cache` | OHLCV and indicator cache |
| `chart_ai_cache` | Non-personal analysis cache by symbol, market, timeframe |
| `heatmap_cache` | Market and portfolio heatmap cache |

### Lab Tables

| Table | Purpose |
|---|---|
| `lab_sp500_sector_returns` | Annual S&P 500 sector returns |
| `lab_asset_class_returns` | Annual asset-class returns |
| `lab_nps_holdings` | NPS holdings from OpenDART and manual US data |
| `lab_congress_stock_holdings` | Normalized Congress stock holdings |

### Ads

| Table | Purpose |
|---|---|
| `ad_events` | Impression, click, and affiliate open events |

## RLS Policy Baseline

| Table group | Policy |
|---|---|
| `profiles` | Users can read and update only their own profile |
| `portfolios` | Users can CRUD only their own portfolios |
| `portfolio_positions` | Users can CRUD only positions under their own portfolios |
| `ai_usage_daily` | Users can read their own usage; writes should be server-controlled |
| `market_*` | Public read; server-only writes |
| `lab_*` | Public read; server-only writes |
| `ad_events` | Server-written where possible |

## Phase 2A Migration Draft Decisions

- The local migration draft lives at `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.
- The draft creates all Phase 2 target tables in the `public` schema and enables RLS on each public table.
- The draft includes explicit grants for `anon` and `authenticated` where client Data API access is intended, because newer Supabase projects may not expose public tables automatically.
- Portfolio write access is limited to authenticated users and further restricted by ownership policies.
- Market, Lab, and non-personal Chart AI cache tables are public read and have no public write policies.
- `heatmap_cache` supports public universe rows with `user_id is null` and user-scoped portfolio heatmap rows with `user_id` set.
- `ad_events` permits minimal anonymous or authenticated inserts with no public select policy. This should be revisited before production if all ad tracking should be server-side.
- `internal.consume_chart_ai_usage(uuid, integer)` is drafted as a server-only atomic usage function for the KST daily free limit of 3. It is not wired to UI or API routes yet.
- `profiles` does not include a public insert policy in this draft. A later onboarding phase should decide between server-side profile creation and an auth user creation trigger.

## Phase 2B SQL Review Decisions

- `profiles` now supports a later login-time upsert path instead of an auth trigger.
- Authenticated users may insert only their own initial profile fields and update only editable profile columns.
- `profiles.plan` remains server-controlled and must not be writable from normal authenticated clients.
- `ad_events` is server-write only. Anonymous and authenticated client inserts were removed from the draft to reduce abuse risk.
- Server-side routes should record ad events with service-role access and API-level rate limiting.
- Service-role table grants are explicit for server-side writes and compatibility with newer Supabase Data API exposure defaults.
- `internal.consume_chart_ai_usage(uuid, integer)` returns `remaining_count` in addition to `allowed`, `used_count`, `free_limit`, and `usage_date_kst`.
- `public.set_updated_at()` execution is revoked from public client roles because it is only used by table triggers.
- Disposable validation steps are maintained in `docs/planning/supabase_local_validation_checklist_v0.1.md`.

## Current API Audit

Existing endpoints to remove or replace:

| Existing endpoint | Current use | Target |
|---|---|---|
| `/api/news` | GNews business news | Remove |
| `/api/list` | TokenInsight crypto news | Remove |
| `/api/stock` | Naver popular stock HTML proxy | Replace with market search/data API |
| `/api/etf` | Naver ETF list proxy | Replace or seed into market symbols |
| `/api/holdings` | Legacy Seibro holdings | Remove or migrate as Lab data inspiration only |
| `/api/search` | Supabase client re-export only | Replace with real market search endpoint |

## Security Rules

1. KIS, OpenDART, OpenAI, Gemini, and affiliate secrets are server-only.
2. Do not permanently store user-specific Chart AI analysis history.
3. Do not store chart screenshots.
4. Use non-personal AI cache only by symbol, market, and timeframe.
5. Keep portfolio data isolated by RLS.
6. Do not implement trading or order execution.
