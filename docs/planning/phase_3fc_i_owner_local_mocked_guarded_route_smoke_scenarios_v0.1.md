# Phase 3FC-I Owner-local Mocked Guarded Route Smoke Scenarios

## 1. Purpose

This phase verifies the Phase 3FC-H guarded route scaffold branch of the Chart Similarity API
route (`src/pages/api/chart-ai/similarity.ts`) against deterministic, owner-local mocked fixtures,
without starting a dev server, without a real Supabase client, without reading `process.env` or
`import.meta.env`, and without any live KIS network call. It confirms that the route continues to
recognize the guarded-runtime-scaffold discriminator while every request through that branch still
falls back to the existing safe feature-disabled shell response. No runtime source file is modified
by this phase — this is a smoke and documentation phase only.

## 2. Route Branches Under Test

The route recognizes exactly three mutually exclusive dispatch branches:

- `owner-local-mocked` (Phase 3FB-B) — regression only, unchanged in this phase.
- `owner-local-auth-usage-bridge` (Phase 3FB-C-ALT) — regression only, unchanged in this phase.
- `guarded-runtime-scaffold` (Phase 3FC-H) — the primary target of this phase's new smoke coverage.

Any request that fails to match all three discriminators falls back to the existing feature-flag-off
shell response (`buildSimilarityApiRouteShellResult`).

## 3. Exact Guarded Request

A request body with `mode: "guarded-runtime-scaffold"`, `source: "mocked-provider-compatible"`, and
`guardedRuntimeScaffold: true` is route-recognized by
`isGuardedRuntimeScaffoldSimilarityRequestBody`. The route calls
`runSimilarityGuardedRouteScaffold` internally to confirm safe blocked/disabled handling, but the
scaffold result is never exposed to the client and never unlocks a success response — the HTTP
response is always the same feature-disabled shell (httpStatus 503) used by the default unmatched
case.

## 4. Negative Guarded Requests

The smoke exercises several non-exact-match variants and confirms each one fails to match the
guarded branch predicate and safely falls back to the feature-disabled shell:

- A partial body (missing the `guardedRuntimeScaffold` field).
- A wrong-source body (`source: "live"` instead of `"mocked-provider-compatible"`).
- A malformed body (wrong literal values for all three discriminator fields).
- A `null` request body.
- A non-object (string) request body.

## 5. Prior Branch Regression Cases

The smoke re-exercises the two pre-existing owner-local branches to confirm the new guarded branch
did not disturb their behavior: the owner-local-mocked branch still returns a successful,
deterministic mocked similarity result, and the owner-local auth/usage bridge branch still returns
an owner-role, allowed-guard-status result with no raw provider match data exposed.

## 6. Redaction and Safety Checks

Every response body is scanned for forbidden substrings (KIS credential fields, access/refresh
tokens, account/trading/balance fields, and live/auto source markers). The harness monkeypatches
`globalThis.fetch` to throw if ever called, confirming no live KIS network call occurs anywhere in
this phase, and the bundled route source itself is scanned for `process.env`, `import.meta.env`,
and Supabase package import patterns.

## 7. What This Phase Does Not Prove

This phase does not prove or enable: guarded route success, real Supabase or real database runtime,
real feature flag/usage/role persistence, live KIS connectivity, public or beta activation, or any
change to `/chart-ai` or the guarded route scaffold module itself. It is a route-behavior smoke
only, bounded to the owner-local machine, and is not a substitute for a future dedicated live-KIS or
real-runtime phase.
