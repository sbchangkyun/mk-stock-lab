# Phase 3FD-F-PLAN Owner-local Guarded Composition Manual QA and Activation Boundary Review

## 1. Purpose

This is a documentation-only manual QA and activation boundary review. It makes no route source
change, UI change, or runtime source change; connects to no database; creates no Supabase client;
reads no environment value; executes no migration; calls no live KIS path; enables no route
success; and performs no deployment or push.

## 2. Current State

- Phase 3FD-E added the guarded route runtime composition scaffold.
- The route still has exactly three dispatch branches.
- The guarded branch calls the composition scaffold and still returns the existing safe
  blocked/feature-disabled shell.
- The owner-local mocked and owner-local auth/usage bridge branches remain unchanged.
- All gates remain off. Provider execution and route success remain disabled.

## 3. Owner-local Manual QA Scope

A future owner-local manual QA session should verify that default and malformed requests retain
safe disabled behavior; a `guarded-runtime-scaffold` request retains safe blocked/feature-disabled
behavior; both existing owner-local mocked branches behave as before; no composition internals are
returned; no route success or public/beta activation is exposed; and no live KIS path is reached.

This document does not execute manual QA, start a development server, open a browser preview, or
perform browser automation.

## 4. Suggested Owner-local QA Scenarios

- [ ] Default POST without an approved body returns the safe disabled shell.
- [ ] Malformed JSON falls back safely.
- [ ] Guarded runtime scaffold body returns the safe disabled shell.
- [ ] Guarded response does not expose composition internals.
- [ ] Guarded response does not expose raw auth, DB, usage, KIS, OHLC, score, account, trading,
  order, or balance data.
- [ ] Owner-local mocked branch remains available only through its exact mocked request shape.
- [ ] Owner-local auth/usage bridge branch remains available only through its exact mocked request
  shape.
- [ ] `/chart-ai` default page behavior is unchanged.
- [ ] `/chart-ai?ownerLocalMocked=1` behavior is unchanged.
- [ ] `/chart-ai?ownerLocalAuthUsageBridge=1` behavior is unchanged.
- [ ] No route success appears in any guarded path.
- [ ] No beta/public route is exposed.
- [ ] No live KIS call occurs.
- [ ] No deployment or push occurs during QA.

## 5. Activation Boundary

The following remain blocked: route success, provider execution, beta activation, public
activation, real database connection, Supabase client creation, environment-value reads,
cookie/header/session parsing, JWT verification, migration execution, service-role use, live KIS,
deployment, and push.

## 6. Approval Gates Before Any Activation

- [ ] Owner approves route success semantics.
- [ ] Owner approves the exact route request mode for activation.
- [ ] Owner approves auth runtime wiring.
- [ ] Owner approves role/usage runtime wiring.
- [ ] Owner approves feature flag gate wiring.
- [ ] Owner approves the safe response shape.
- [ ] Owner approves whether provider execution may run.
- [ ] Owner approves whether mocked provider execution may be exposed owner-locally.
- [ ] Owner approves beta/public activation scope, if any.
- [ ] Owner approves real DB/Supabase/environment access separately, if needed.
- [ ] Owner approves migration execution separately, if needed.
- [ ] Owner approves live KIS separately, if needed.
- [ ] Owner approves deployment separately.

## 7. Go / No-go Criteria

Go for a future implementation phase only if the manual QA plan is accepted, all current
checkers and smokes pass, the route remains safe blocked by default, and the owner explicitly
approves the next implementation boundary.

No-go if any guarded path returns success; any raw auth/session/token/environment/DB/KIS/OHLC/
score/account/trading/order/balance data appears; the branch count changes unexpectedly; any real
DB/Supabase/environment/live KIS path is introduced; or any deployment or push occurs without
approval.

## 8. Known Non-blocking Documentation Cleanup

The Phase 3FD-E result document appears to contain replacement characters in some heading or
recommendation separators. This is documentation formatting only and is non-blocking because the
Phase 3FD-E checker, smoke, build, and targeted regressions passed. A future hotfix documentation
cleanup phase may normalize those separators if desired. This phase does not edit prior result
documents.

## 9. Recommended Next Phase

Recommended: **Phase 3FD-F — Owner-local Guarded Composition Manual QA Package, No Runtime
Change**.

Alternative: **Phase 3FD-E-HF1 — Guarded Composition Scaffold Revisions, All Gates Off**.

Hold: **Phase 3FD-B-HF1 — Real Supabase Client Factory Approval Package, No Runtime Change**.
