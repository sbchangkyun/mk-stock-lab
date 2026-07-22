# Phase 3EY-D — Auth/Usage Guard Contract and Mocked API Response Plan v0.1

## 1. Purpose

This phase defines a sanitized, API-shaped mocked response contract for future Chart Similarity
execution, built directly on top of the Phase 3EY-C auth/usage execution guard result. It does
not add an API route, real authentication, usage storage, or live KIS execution. It exists so a
later, separately authorized phase can wire a real route around an already-agreed sanitized
response shape instead of designing the response contract at the same time as the route itself.

## 2. Current State

- Phase 3EX-D integrated a mocked "유사 패턴 분석" (similar pattern analysis) result UI into
  `/chart-ai`, using the deterministic chart similarity engine (Phase 3EX-B/3EX-C) run against
  synthetic fixture data only.
- Phase 3EY-A added the server-only KIS OHLC provider foundation, disabled by default and
  returning `disabled`/`not_implemented` only.
- Phase 3EY-B added a mocked adapter / test harness verifying the same provider contract with
  synthetic, already-normalized input.
- Phase 3EY-C added a disabled-by-default, policy-first auth/usage execution guard
  (`similarityExecutionGuardTypes.ts`, `similarityExecutionGuardPolicy.ts`,
  `similarityExecutionGuard.ts`, `mockedSimilarityExecutionGuardFixtures.ts`) that evaluates a
  caller-supplied guard request and usage snapshot and returns a
  `SimilarityExecutionGuardResult`, without any real auth or usage persistence.
- No authenticated Chart Similarity API route exists. No auth runtime, usage guard runtime, or
  DB/cache runtime exists anywhere in the Chart Similarity track. Live KIS execution remains
  feature-flag off.

## 3. Response Boundary

- Server-only planning/foundation: all new code lives under
  `src/lib/server/chartSimilarity/`, never under `src/pages/` or `src/pages/api/`.
- No API route is added or modified. No route reads or returns this response shape at runtime.
- No real auth provider is imported or called, and no usage store is read or written — the
  response builder only consumes a `SimilarityExecutionGuardResult` value already produced by the
  Phase 3EY-C evaluator.
- No `/chart-ai` UI change is made.
- No KIS call is made, and no live similarity engine execution occurs — all success-path data is
  fixed, deterministic mocked planning data.

## 4. Response Model

- `SimilarityApiResponseStatus` mirrors `SimilarityExecutionGuardStatus` with `allowed` renamed to
  `success`, plus three reserved-for-later values not yet produced by the guard:
  `provider_disabled`, `provider_not_implemented`.
- `SimilarityApiResponseMode` records how a response was produced: `mocked-plan` (mocked-source,
  guard-allowed), `guard-allowed` (non-mocked source, guard-allowed), `feature-flag-off`
  (`feature_disabled`), `guard-blocked` (`blocked`/`auth_required`/`usage_limited`/
  `not_configured`/`error`), and `provider-deferred` (reserved for a future phase once the
  provider-disabled/provider-not-implemented states are represented in the guard contract).
- `SimilarityApiSafeRequest`/`SimilarityApiSafeUsage`/`SimilarityApiSafeError` are sanitized
  projections of the guard's request/usage/error data — they intentionally drop every field that
  is not safe to return to a client (see Section 6).
- The top-level `SimilarityApiResponse` shape is
  `{ ok, status, mode, request, usage, data, error, warnings }`; `data` is populated only when
  `status === "success"`, and `error` is populated only when `ok === false`.

## 5. Mocked Success Data Policy

- `buildMockedSimilarityApiSuccessData` returns a fixed set of three ranked matches with
  deterministic period ranges, similarity scores, forward returns, and max-drawdown values. None
  of these values are derived from any real price series — they exist only to describe the
  eventual response shape.
- The `disclaimer` field explicitly states the data is mocked planning data, not real market data
  or investment advice.
- No `source: "live"` or `source: "auto"` literal is produced anywhere in this response contract.

## 6. Non-Authorized Scope

This phase does not include, and the response contract never contains:

- no API route;
- no real authentication or Supabase auth import;
- no usage storage;
- no KIS call;
- no DB/cache runtime;
- no SQL/migration;
- no `userId`, `role`, or `authState` field in any response;
- no session/access/provider token, no email, no IP address;
- no raw auth provider payload, no raw KIS payload;
- no account/trading/order/balance field;
- no real market price used as mocked data;
- no deploy/push.

## 7. Future Route Requirements

Before any real authenticated Chart Similarity API route may return this response shape for real,
the following must all be in place, in addition to the Phase 3EY-C future activation
requirements:

- explicit owner approval;
- a real auth integration feeding `SimilarityExecutionAuthState` into the guard;
- an approved usage storage design wired into the guard's `options.usage`;
- a real similarity engine / KIS-normalized data path replacing
  `buildMockedSimilarityApiSuccessData` for the `kis-normalized`/`owner-local` sources;
- confirmation that the sanitization rules in this document still hold once real data flows
  through the builder;
- SQL/migration approval if a DB-backed usage store is used.

## 8. Roadmap After 3EY-D

- **3EX-E** — Similarity Result UI Owner Review and Polish (mocked-data UI review, no auth/API
  change).
- **3EZ-A** — candidate: real auth integration design (session/user resolution feeding
  `SimilarityExecutionAuthState`), still no live KIS call.
- **3EZ-B** — candidate: usage storage design and approval (DB/cache), still no live KIS call.
- **3EZ-C** — candidate: authenticated Chart Similarity API route wiring the Phase 3EY-C guard and
  this phase's response builder together, gated behind explicit owner approval.
- **3FA-A** — candidate: live KIS-normalized execution activation, gated behind feature flag,
  auth, and usage guard all passing.
- **Limited beta**: only after 3EZ-A/3EZ-B/3EZ-C/3FA-A are all separately approved and the
  `beta` role's higher usage limit has been reviewed by the owner.
