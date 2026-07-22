# Phase 3FA-A — Owner-local KIS-normalized Similarity Execution Plan v0.1

## 1. Purpose

This phase defines the owner-local KIS-normalized similarity execution plan. It is a design-only
plan: it does not execute KIS, does not run the deterministic similarity engine, does not change
the existing `/api/chart-ai/similarity` route, and does not enable route success. It defines the
future safe execution sequence, activation gates, provider data expectations, and fallback policy
that a separately authorized future phase would need before owner-local KIS-normalized execution
could be enabled.

## 2. Current State

- Phase 3EX-E completed the `/chart-ai` owner-review UI polish.
- Phase 3EY-A/3EY-B added the server-only KIS OHLC provider contract foundation and its mocked
  adapter.
- Phase 3EY-C added the auth/usage execution guard foundation, disabled by default.
- Phase 3EY-D added the sanitized mocked API response contract.
- Phase 3EZ-A added the provider-agnostic real-auth integration design.
- Phase 3EZ-B added the storage-agnostic usage storage design.
- Phase 3EZ-C added the disabled `/api/chart-ai/similarity` route shell, which always returns
  `feature_disabled` / `feature-flag-off`.
- No real auth runtime exists.
- No usage storage runtime exists.
- No live KIS Chart Similarity execution exists.
- The route remains feature disabled.

## 3. Owner-local Execution Boundary

- This phase is design/foundation only.
- Owner-local only: no execution path defined here may run in a public or beta context.
- No public execution is allowed.
- No beta execution is allowed.
- No route success is enabled by this phase.
- No KIS call is made by this phase.
- No raw KIS payload is referenced or persisted.
- No live similarity engine execution occurs.
- No `/api/chart-ai/similarity` route change is made.
- No `/chart-ai` UI change is made.
- No `process.env` or `.env` value is read.

## 4. Planned Execution Sequence

The future owner-local KIS-normalized execution sequence, once separately authorized, is expected
to proceed through the following ordered stages:

1. **route shell** — the API route shell (Phase 3EZ-C) receives the request.
2. **auth mapping** — a real auth subject (Phase 3EZ-A design) is mapped to a guard role/auth
   state.
3. **usage check** — usage storage (Phase 3EZ-B design) is consulted for remaining quota.
4. **KIS-normalized OHLC fetch** — the server-only KIS OHLC provider (Phase 3EY-A/3EY-B) fetches
   normalized daily OHLC bars for the requested symbol, owner-local only.
5. **normalized OHLC validation** — the fetched bars are validated for shape and sufficiency
   before being handed to the similarity engine.
6. **similarity engine scan** — the existing deterministic similarity engine
   (`src/lib/chartSimilarity/**`) scans the validated bars.
7. **safe response packaging** — the scan result is packaged into the existing sanitized
   `SimilarityApiResponse` contract (Phase 3EY-D) before being returned.

## 5. Provider Data Requirements

- Source: `owner-local` only.
- Market: `KR`.
- Asset type: `stock` or `etf`.
- Timeframe: `daily`.
- Normalized OHLC data only — raw KIS payload fields are disallowed.
- Account/trading/order/balance data is disallowed.
- Public execution is disallowed.

## 6. Activation Gates

Before owner-local execution may be enabled in a future phase, every one of the following gates
must be satisfied:

- **Owner approval** — the owner has approved owner-local execution behavior.
- **Owner-local environment confirmation** — the execution environment is confirmed owner-local.
- **Real auth decision** — a real auth provider integration decision has been made (building on
  Phase 3EZ-A).
- **Usage storage approval** — a real usage storage backend has been approved (building on Phase
  3EZ-B).
- **Provider smoke approval** — an owner-local KIS-normalized provider smoke test has been
  approved.
- **Route feature flag approval** — the route shell feature flag
  (`CHART_AI_SIMILARITY_ROUTE_ENABLED`) has been approved for owner-local activation.
- **Raw provider payload exclusion** — raw KIS provider payload fields remain excluded from any
  response (already satisfied by static policy).
- **Public execution disabled** — public execution remains disabled (already satisfied by static
  policy).
- **Route success disabled in this phase** — route success remains disabled in this phase
  (already satisfied by static policy).

## 7. Safety and Fallback Policy

- If the KIS-normalized provider is disabled or not implemented, the response remains a safe,
  sanitized `provider_disabled` / `provider_not_implemented` result — never a fabricated success.
- A provider error does not charge usage by default (consistent with the Phase 3EZ-B usage design's
  `do_not_charge` outcome for `provider_error`).
- Route success remains disabled until a separately owner-approved phase enables it.
- No success response is returned until that separately authorized phase implements real route
  behavior.
- The existing sanitized response builder (Phase 3EY-D) remains the final response boundary for
  any future execution path.

## 8. Roadmap After 3FA-A

Recommended:

- **3FA-B** — Owner-local KIS Similarity Smoke Plan
- **3FB-A** — Limited Beta Readiness Review

Alternative:

- **3EZ-C-HF1** — Route Shell Smoke/Checker Hardening, if needed.
