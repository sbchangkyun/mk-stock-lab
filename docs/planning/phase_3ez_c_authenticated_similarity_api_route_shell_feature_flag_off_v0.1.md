# Phase 3EZ-C — Authenticated Similarity API Route Shell with Feature Flag Off v0.1

## 1. Purpose

This phase adds the first real HTTP-facing artifact in the Chart Similarity execution chain: a
minimal `/api/chart-ai/similarity` API route shell. The route is disabled by default and always
returns a safe, deterministic, sanitized feature-disabled response. It implements no real auth, no
usage storage, no DB/cache access, no KIS call, and no live similarity execution — it only proves
that a route can exist, parse a request defensively, and return the correct sanitized shape while
the feature flag is off.

## 2. Current State

- Phase 3EY-C added the server-only auth/usage execution guard foundation
  (`similarityExecutionGuard.ts`), disabled by default and not wired to any route.
- Phase 3EY-D added the sanitized mocked API response contract
  (`similarityApiResponseBuilder.ts`, `SimilarityApiResponse`).
- Phase 3EZ-A added the provider-agnostic auth subject-to-guard mapping design
  (`similarityAuthIntegrationDesign.ts`).
- Phase 3EZ-B added the storage-agnostic usage storage design
  (`similarityUsageStorageDesign.ts`).
- No `/api/chart-ai/similarity` route or any other Chart Similarity API route existed before this
  phase.
- No real auth runtime exists anywhere in the Chart Similarity execution path.
- No usage storage exists.
- No live KIS Chart Similarity execution exists.

## 3. Route Shell Boundary

- This phase adds a route shell only.
- No real auth is implemented; no auth provider (Supabase, Auth0, OAuth, NextAuth, Clerk, Firebase,
  Passport) is imported.
- No usage storage is implemented; no DB/cache client is imported.
- No SQL file or migration is added or run.
- No KIS call is made; no KIS provider/client module is imported.
- No live similarity execution occurs; the real similarity engine
  (`src/lib/chartSimilarity/**`) is not called.
- No `/chart-ai` UI file is changed.
- No deployment is performed; no push is performed.
- No `process.env` or `.env` value is read.

## 4. Route Contract

- Route path: `POST /api/chart-ai/similarity` (server-side only, `prerender = false`).
- Request body is parsed defensively as JSON; malformed or missing JSON falls back to a safe
  default request (`symbol: 'UNKNOWN'`, `source: 'kis-normalized'`, `market: 'KR'`,
  `assetType: 'stock'`) and never crashes the route.
- Response body conforms to the existing Phase 3EY-D `SimilarityApiResponse` shape.
- In this phase, the route always resolves to:
  - `httpStatus: 503`
  - `response.ok: false`
  - `response.status: 'feature_disabled'`
  - `response.mode: 'feature-flag-off'`
  - `response.data: null`
  - `response.error`: a safe `{ code: 'feature_disabled', message, retryable: false }` object
- Response headers: `Content-Type: application/json; charset=utf-8`, `Cache-Control: no-store`.
- Any HTTP method other than `POST` also returns the same safe feature-disabled response, with no
  side effects.

## 5. Feature Flag Policy

- Flag name: `CHART_AI_SIMILARITY_ROUTE_ENABLED`.
- Default policy: `enabled: false`, `requireAuth: true`, `requireUsageStorage: true`,
  `allowMockedSuccess: false`, `allowLiveKisExecution: false`, `allowPublicExecution: false`.
- The route shell never reads the flag from `process.env`; the policy is a pure, hardcoded default
  in this phase — no environment wiring exists yet.
- The route shell never returns a success response in this phase, regardless of the requested
  `source` value, because `allowMockedSuccess` is fixed to `false`.

## 6. Security and Data Policy

- The route shell request/response types exclude: user id, role, auth state, session/access/
  provider token, email, IP address, request headers, cookies, raw auth provider payload, KIS
  credentials, raw KIS response fields, account/trading/order/balance fields, DB/cache connection
  strings, and SQL strings.
- The route does not read cookies, request headers, `localStorage`/`sessionStorage`,
  `process.env`, or `.env`.
- The route performs no network calls (no `fetch`) and persists nothing.
- No `source=live` or `source=auto` value is ever accepted or produced.

## 7. Future Activation Requirements

Before `enabled` may become `true` in a future phase:

- A real, separately authorized auth integration (building on the Phase 3EZ-A design) must be
  wired to the guard's `role`/`authState` fields.
- A real, separately authorized usage storage backend (building on the Phase 3EZ-B design) must be
  wired to charge/read usage.
- Owner approval of the route's live-execution behavior is required.
- Even when `enabled` becomes `true`, this route shell's `buildSimilarityApiRouteShellResult`
  design intentionally falls back to a safe, non-success `not_configured` / `provider-deferred`
  response until that separately authorized phase implements real route behavior.

## 8. Roadmap After 3EZ-C

- **3FA-A** — Owner-local KIS-normalized Similarity Execution Plan
- **3FA-B** — Owner-local KIS Similarity Smoke
- **3FB-A** — Limited Beta Readiness Review
