# Supabase Disposable Validation Plan v0.1

Status: disposable validation preparation

This document prepares a safe workflow for validating the Supabase rebuild migration against a disposable database. Production Supabase must not be touched. This document does not authorize remote application.

## Environment Options

### Option 1: Local Supabase CLI Database

Use the Supabase CLI local stack after operator approval. This path requires Supabase CLI and Docker. It is the preferred path when both tools are installed because it most closely matches Supabase behavior and can support local linting.

### Option 2: Direct Disposable Postgres With psql

Use a disposable Postgres database with `psql` after operator approval. This can validate core SQL objects, grants, RLS flags, policies, functions, and indexes, but it may not fully match Supabase local stack behavior unless Supabase roles and `auth` schema fixtures are created.

### Option 3: Supabase Branch Or Disposable Remote Database

Use a Supabase branch or remote disposable project only after explicit owner approval. This is not production. Do not connect to any remote Supabase database without a separate approval command.

## Current Tool Availability

Checked on 2026-06-16:

| Tool | Available? | Result |
|---|---:|---|
| Supabase CLI | No | `supabase --version` is not available |
| psql | No | `psql --version` is not available |
| Docker | No | `docker --version` is not available |

No secret values or connection strings were inspected or printed.

## Recommended Validation Path

No local validation tools are currently available. The safest next path is to prepare a separate disposable validation environment, then run the migration and validation script there after operator approval.

Recommended operator steps:

1. Choose a disposable validation target.
2. Install or make available required tools outside this phase only after explicit approval.
3. Confirm the target database is not production.
4. Apply `supabase/migrations/20260615_rebuild_schema_v0_1.sql` only to the disposable target.
5. Run `supabase/validation/validate_rebuild_schema_v0_1.sql`.
6. Run Supabase advisors if available.
7. Save validation results for owner review before any remote application plan.

## Validation Checklist

- Confirm the target database is disposable.
- Confirm no production connection string is active.
- Confirm migration file path: `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.
- Apply the migration only to a disposable database.
- Run structural checks.
- Run RLS checks.
- Run Chart AI usage function checks.
- Run `ad_events` insert-blocking checks.
- Run Supabase security and performance advisors if available.
- Do not use production data.

## Expected Pass/Fail Criteria

- 14 public tables are created.
- RLS is enabled on every public table.
- `ad_events` has no public insert policy.
- `chart_ai_cache` has no `user_id`.
- `internal.consume_chart_ai_usage` denies the fourth same-day use.
- Normal clients cannot execute the internal usage function.
- Authenticated users cannot update `profiles.plan`.
- Anonymous and authenticated clients cannot write market, Lab, or cache data.

## Operator Approval Gates

These actions require separate operator approval:

- Installing tools.
- Starting Docker or Supabase local services.
- Applying the migration to any database.
- Connecting to a Supabase branch database.
- Connecting to any remote database.

## Remaining Risks

- SQL still needs execution against a real disposable database.
- RLS behavior requires actual role-based tests.
- The service-role function path must be verified in the future server runtime.
- Concurrent usage behavior must be tested under real database locking.
- The production backup/reset procedure is still not approved.

## Non-Authorization Statement

This plan prepares disposable validation only. It does not authorize production access, remote application, or database mutation.
