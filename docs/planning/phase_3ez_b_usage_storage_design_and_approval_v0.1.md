# Phase 3EZ-B — Usage Storage Design and Approval v0.1

## 1. Purpose

This phase defines the future usage storage design for Chart Similarity execution: the storage
model, identity/key strategy, usage windows, charge policy, and backend options, without
implementing storage, DB/cache runtime, SQL/migration, or any API route. It establishes
provider-agnostic and storage-agnostic types and pure design helpers that a later, separately
authorized phase can wire to a real storage backend and a real route.

## 2. Current State

- Phase 3EX-E completed the `/chart-ai` UI polish; the similarity/MK AI tabs live in a single
  chart-lower analysis workspace.
- Phase 3EY-C added the server-only auth/usage execution guard foundation
  (`similarityExecutionGuard.ts`), disabled by default and not wired to any route.
- Phase 3EY-D added the sanitized mocked API response contract
  (`similarityApiResponseBuilder.ts`).
- Phase 3EZ-A added the provider-agnostic auth subject-to-guard mapping design
  (`similarityAuthIntegrationDesign.ts`), including safe auth subject types and mocked subject
  builders.
- No `/api/chart-ai/similarity` route or any other API route exists.
- No real auth runtime exists anywhere in the Chart Similarity execution path.
- No usage storage exists.
- No live KIS Chart Similarity execution exists.

## 3. Usage Storage Boundary

- This phase is design/foundation only.
- No usage storage is implemented.
- No DB/cache runtime is added.
- No Supabase, Redis, Turso, Prisma, or Drizzle import is added anywhere in this phase.
- No SQL file or migration file is added.
- No API route is added or modified.
- No KIS call is made.
- No `process.env` or `.env` value is read.

## 4. Identity and Key Strategy

- A future usage key's `subjectKey` is sourced from the Phase 3EZ-A stable subject mapping
  (`SimilarityAuthSubject.stableSubjectId`), not from any new identity system.
- `subjectKey` is for internal storage-key construction only; it is never itself exposed in any
  API-facing response.
- No email, IP address, session token, cookie, or request header is used anywhere in the usage key
  or storage policy design.
- Recommended future `subjectKeyStrategy`: `stable_subject_id_hash` once a real auth provider is
  selected, so that the persisted key is not the raw provider subject id. Until then, the default
  policy leaves `subjectKeyStrategy` as `not_configured`.
- `SimilarityApiResponse` (Phase 3EY-D) must continue to omit any usage key or subject key from
  its API-facing payload — this phase does not change that sanitization boundary.

## 5. Window and Limit Model

- Two usage window kinds are defined: `daily` and `monthly`.
- Windows reset on UTC boundaries: a daily window starts at `YYYY-MM-DDT00:00:00.000Z`; a monthly
  window starts at `YYYY-MM-01T00:00:00.000Z`.
- Role-based daily limits, aligned with the Phase 3EY-C guard policy defaults:
  - authenticated/default: 3 per day
  - beta: 10 per day
  - owner: 50 per day
  - admin: 100 per day
- Monthly limits are derived as `dailyLimit * monthlyLimitMultiplier` (default multiplier: 20).

## 6. Charge Policy

- Usage is charged only on successful execution by default (`chargeTiming: 'after_success'`).
- The following execution outcomes do not charge usage: `auth_required`, `usage_limited`,
  `feature_disabled`, `provider_disabled`, `validation_error`.
- `provider_error` and `internal_error` do not charge usage by default in this phase.
- `guard_blocked` does not charge usage.
- `reservation_then_commit` remains a possible future charge-timing option
  (`SimilarityUsageChargeTiming`), but it is not implemented in this phase — only `after_success`
  is used by the default policy.
- When `policy.enabled` is `false` (the default in this phase), every execution outcome resolves
  to a design-only decision with no read, write, or increment — this phase never increments or
  persists real usage.

## 7. Storage Backend Options

- **`database`**: an auditable, queryable usage ledger (e.g., one row per usage event or per
  window/subject counter). Supports historical reporting and dispute resolution.
- **`cache`**: a fast counter store (e.g., a Redis-style TTL counter) suited to rate-limit checks,
  but with weaker durability and audit guarantees than a database.
- **`hybrid`**: a cache-accelerated read path backed by a database of record, combining low-latency
  limit checks with durable usage history.

**Recommended initial direction**: database-first for auditable usage records, with an optional
cache layer added later purely to accelerate rate-limit checks. No backend is implemented, chosen,
or activated in this phase — `SimilarityUsageStoragePolicy.backendKind` defaults to `'none'`.

## 8. Approval Requirements

Before any real usage storage is implemented, the following must happen:

- Owner approval of this design.
- A storage backend decision (`database` / `cache` / `hybrid`).
- SQL/migration approval if a database-backed store is chosen.
- Cache runtime approval if a cache-backed store is chosen.
- A privacy review of the `subjectKey` strategy (e.g., hashing approach) before any real subject
  identifier is persisted.
- Confirmation of the failure/charge policy in Section 6 (or an approved revision of it).
- Explicit API route approval — no route may read or write usage until this design, the backend
  decision, and the route itself are separately approved.

## 9. Roadmap After 3EZ-B

- **3EZ-C** — Authenticated Similarity API Route Shell with Feature Flag Off
- **3FA-A** — Owner-local KIS-normalized Similarity Execution Plan
- **3FA-B** — Owner-local KIS Similarity Smoke
- **3FB-A** — Limited Beta Readiness Review
