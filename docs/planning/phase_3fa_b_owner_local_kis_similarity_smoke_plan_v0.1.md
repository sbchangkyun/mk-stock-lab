# Phase 3FA-B — Owner-local KIS Similarity Smoke Plan v0.1

## 1. Purpose

This phase defines the owner-local KIS similarity smoke plan. It is a design-only plan: it does
not run KIS, does not run the deterministic similarity engine against live data, does not change
the existing `/api/chart-ai/similarity` route, and does not enable route success. It defines the
future manual smoke procedure, preflight gates, strict redaction rules, safe report shape, and
pass/fail criteria that a separately authorized future phase would need before an owner-local
manual KIS similarity smoke could be executed.

## 2. Current State

- Phase 3FA-A defined the owner-local KIS-normalized similarity execution plan; no execution is
  enabled.
- Phase 3EZ-C added the disabled `/api/chart-ai/similarity` route shell, which always returns
  `feature_disabled` / `feature-flag-off`.
- Phase 3EZ-B added the storage-agnostic usage storage design.
- Phase 3EZ-A added the provider-agnostic real-auth integration design.
- Phase 3EY-A/3EY-B added the server-only KIS OHLC provider contract foundation and its mocked
  adapter.
- Phase 3EX-B/3EX-C built and hardened the deterministic similarity engine
  (`src/lib/chartSimilarity/**`).
- No real auth runtime exists.
- No usage storage runtime exists.
- No live KIS Chart Similarity execution exists.
- No owner-local KIS similarity smoke has been executed.
- The route remains feature disabled.

## 3. Smoke Plan Boundary

- This phase is design/foundation only.
- No KIS call is made by this phase.
- No live similarity engine execution occurs.
- No `/api/chart-ai/similarity` route change is made.
- No `/chart-ai` UI change is made.
- No `process.env` or `.env` value is read.
- No credential is echoed.
- No raw KIS payload is referenced or persisted.
- No actual market value appears in any smoke report defined by this plan.
- No public execution is allowed.
- No beta execution is allowed.

## 4. Planned Manual Smoke Sequence

The future owner-local manual smoke, once separately authorized, is expected to proceed through
the following ordered stages:

1. **preflight boundary check** — confirm this plan's static safety invariants hold before any
   manual action is taken.
2. **owner-local environment confirmation** — confirm the execution environment is owner-local.
3. **route shell disabled confirmation** — confirm `/api/chart-ai/similarity` still returns
   `feature_disabled`.
4. **auth/usage precondition review** — review the auth (Phase 3EZ-A) and usage storage
   (Phase 3EZ-B) designs without implementing either.
5. **KIS-normalized OHLC provider probe** — a manual, owner-local-only probe of the server-only KIS
   OHLC provider foundation (Phase 3EY-A/3EY-B) for normalized daily bars.
6. **normalized bar shape validation** — validate the probed bars for shape and sufficiency without
   recording actual values.
7. **similarity engine contract dry run** — confirm the deterministic similarity engine
   (`src/lib/chartSimilarity/**`) can accept the normalized bar shape without recording real scores.
8. **safe response redaction check** — confirm any future response would be fully redacted per
   Section 5 before being reported.
9. **manual review closeout** — the owner manually records only the safe pass/fail outcome using
   the template in Section 6.

## 5. Redaction Policy

Future owner-local smoke reports must never contain:

- raw KIS provider payload fields;
- actual OHLC prices (open/high/low/close);
- actual volume;
- market timestamps;
- similarity scores derived from real data;
- derived returns computed from real data;
- credentials, tokens, or environment values of any kind.

Only status/pass/fail/safe-summary fields may be reported, as defined in Section 6.

## 6. Safe Smoke Report Template

A future smoke report may include only these fields:

- `status`
- `smokeId`
- `executedBy`
- `source`
- `providerProbe`
- `normalizationCheck`
- `engineContractCheck`
- `responseRedactionCheck`
- `safeSummary`
- `warnings`

This phase only creates this template as a design-only, not-yet-run default; no report is
generated from real KIS data in this phase.

## 7. Pass/Fail Criteria for Future Phase

A future, separately authorized owner-local smoke would pass only if all of the following hold:

- the provider returns normalized bars without exposing any raw provider payload field;
- the normalized bars are shape-valid for the deterministic similarity engine;
- the similarity engine contract can consume the normalized bars without leaking real values into
  any report;
- the safe response packaging step redacts all fields prohibited by Section 5;
- the route remains disabled unless a separately authorized phase approves enabling it;
- any credential or environment value echo anywhere in the smoke fails the smoke immediately.

## 8. Roadmap After 3FA-B

Recommended:

- **3FA-C** — Owner-local KIS Similarity Smoke Harness, Disabled by Default
- **3FA-D** — Owner-local Manual Smoke Execution Closeout
- **3FB-A** — Limited Beta Readiness Review

Alternative:

- **3EX-E-OWNER-RUNTIME-CHECK** — Owner Runtime Check of Polished Chart Analysis Workspace
