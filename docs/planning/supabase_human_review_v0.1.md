# Supabase Human Review Package v0.1

Status: human-review package

This document exists so the project owner can approve, reject, or request changes to the Supabase migration before any database application.

The migration has not been applied locally, to a disposable database, to a branch database, or to any remote database. Production Supabase must not be touched before explicit owner approval.

## Migration Scope Summary

User/account:

- `profiles`

Portfolio:

- `portfolios`
- `portfolio_positions`

Chart AI usage:

- `ai_usage_daily`

Market data/cache:

- `market_symbols`
- `market_quote_cache`
- `market_chart_cache`
- `chart_ai_cache`
- `heatmap_cache`

Lab data:

- `lab_sp500_sector_returns`
- `lab_asset_class_returns`
- `lab_nps_holdings`
- `lab_congress_stock_holdings`

Ads:

- `ad_events`

## Table Approval Matrix

| Table name | Purpose | Public read allowed? | Authenticated user write allowed? | Server/service-role write required? | Main risk | Approval status |
|---|---|---:|---:|---:|---|---|
| `profiles` | User profile linked to Auth user | No | Limited own insert/update | Yes for plan changes | Plan privilege escalation | Pending owner review |
| `portfolios` | User-owned portfolio container | No | Own CRUD | Optional admin/server operations | Cross-user access | Pending owner review |
| `portfolio_positions` | Holdings inside owned portfolios | No | Own CRUD through portfolio ownership | Optional admin/server operations | Incorrect ownership joins | Pending owner review |
| `ai_usage_daily` | Daily Chart AI usage counters | No | No | Yes | Quota bypass or race condition | Pending owner review |
| `market_symbols` | Searchable market symbol directory | Yes | No | Yes | Stale or incorrect reference data | Pending owner review |
| `market_quote_cache` | Current quote cache | Yes | No | Yes | Stale quote data | Pending owner review |
| `market_chart_cache` | OHLCV and indicator cache | Yes | No | Yes | Stale or malformed chart data | Pending owner review |
| `chart_ai_cache` | Non-personal AI analysis cache | Yes | No | Yes | Accidentally storing user-specific data | Pending owner review |
| `heatmap_cache` | Public and user-scoped heatmap cache | Public rows only | No | Yes | User-scoped heatmap leakage | Pending owner review |
| `lab_sp500_sector_returns` | Annual S&P 500 sector returns | Yes | No | Yes | Source or methodology drift | Pending owner review |
| `lab_asset_class_returns` | Annual asset-class returns | Yes | No | Yes | Index mapping disputes | Pending owner review |
| `lab_nps_holdings` | NPS holdings dataset | Yes | No | Yes | Source freshness and normalization | Pending owner review |
| `lab_congress_stock_holdings` | Public disclosure holdings dataset | Yes | No | Yes | Name normalization and source accuracy | Pending owner review |
| `ad_events` | Minimal ad interaction events | No | No | Yes | Abuse, spam, and metadata overcollection | Pending owner review |

## RLS And Access-Control Summary

- `profiles`: authenticated users can select only their own row, insert only their own initial free profile, and update only editable profile columns. `profiles.plan` remains server-controlled.
- `portfolios`: authenticated users can create, read, update, and delete only portfolios where `user_id = auth.uid()`.
- `portfolio_positions`: authenticated users can create, read, update, and delete only positions under portfolios they own.
- `ai_usage_daily`: authenticated users can read only their own usage rows. Public client writes are not allowed.
- `market_*`: public read is allowed for market directory and cache tables. Public client writes are not allowed.
- `chart_ai_cache`: public read is allowed. The table is non-personal and does not include `user_id`.
- `heatmap_cache`: rows with `user_id is null` are public. User-scoped rows are readable only by the owning authenticated user.
- `lab_*`: public read is allowed for Lab datasets. Public client writes are not allowed.
- `ad_events`: no public select and no public client insert. Server/service-role code must write events.

## Critical Security Decisions Already Made

- `ad_events` is server-write only.
- Anonymous/client inserts for `ad_events` were removed.
- `profiles.plan` remains server-controlled.
- `chart_ai_cache` is non-personal and has no `user_id`.
- `internal.consume_chart_ai_usage` is executable only by `service_role`.
- `public.set_updated_at()` execution is revoked from public client roles.

## Owner Decision Checklist

- [ ] The owner accepts that the existing Supabase database may be reset later.
- [ ] The owner accepts all table names.
- [ ] The owner accepts all column names.
- [ ] The owner accepts server-only `ad_events`.
- [ ] The owner accepts login-time profile upsert instead of an auth trigger.
- [ ] The owner accepts KST daily Chart AI usage reset.
- [ ] The owner accepts service-role-only usage function.
- [ ] The owner confirms no remote database application should occur before a separate explicit approval.

## Remote Application Gate

Remote application requires a separate owner command such as:

```text
Approve remote Supabase migration application
```

General approval, silence, review completion, or phase completion does not authorize remote Supabase application.

## Disposable Validation Recommendation

The safer validation path is:

1. Review `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.
2. Apply the migration to a local or disposable database only.
3. Run structural checks for tables, primary keys, foreign keys, indexes, grants, and RLS-enabled status.
4. Run RLS checks with disposable authenticated users.
5. Run Chart AI usage function checks, including the fourth-use denial on the same KST date.
6. Run Supabase security and performance advisors.
7. Only then prepare a remote application plan.

## Remaining Risks

- SQL has not been parsed by a real database.
- Supabase CLI, `psql`, and Docker were unavailable locally.
- Concurrent usage behavior must be tested live.
- Future server routes must use service-role access carefully.
- The ad event API route needs rate limiting.
- The profile upsert path must be implemented later.
- The production database backup/reset procedure must be separately confirmed.

## Recommended Next Options

- Option A: Owner review only, no DB action.
- Option B: Prepare local/disposable DB validation environment.
- Option C: Prepare remote Supabase application plan after explicit owner approval.

## Final Statement

Phase 2C does not authorize any database changes.
