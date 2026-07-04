# Phase 3FA-D — Owner-local Manual Smoke Execution Closeout (v0.1)

## 1. Purpose

This phase closes out the disabled owner-local KIS similarity smoke harness introduced in Phase 3FA-C, without executing any owner-local KIS smoke. It defines a closeout model that records the current state as "not executed" and describes the conditions that must be true before a future, separately authorized phase may run a live owner-local manual smoke. No KIS call, no live similarity execution, and no route call occur in this phase.

## 2. Current State

- Phase 3FA-A defined the owner-local KIS-normalized similarity execution plan (design only).
- Phase 3FA-B defined the owner-local KIS similarity smoke plan (design only).
- Phase 3FA-C added a disabled-by-default owner-local KIS similarity smoke harness scaffold.
- No real auth runtime or usage storage implementation exists in this project.
- No live similarity execution has ever been performed.
- The `/api/chart-ai/similarity` route remains feature-disabled and unchanged.
- No owner-local manual smoke has been executed at any point, including in this phase.

## 3. Closeout Boundary

This phase is documentation- and scaffolding-only for the closeout layer. It:

- adds a new closeout module, types, and mocked fixtures under `src/lib/server/chartSimilarity/`;
- adds a static contract checker and a no-live-runtime smoke script;
- does not call KIS, does not execute the deterministic similarity engine, does not call the API route, and does not read any environment value;
- preserves every Phase 3FA-C disabled harness behavior unchanged.

## 4. Closeout Decision Model

Every owner-local manual smoke closeout decision maps to exactly one of:

- `keep_disabled` — the harness and route remain disabled; no action needed.
- `request_owner_approval_for_manual_smoke` — the closeout is complete and ready for a separately authorized phase to seek explicit owner approval for a future live manual smoke.
- `defer_to_later_phase` — closeout work is deferred without a live-smoke request.
- `blocked_by_policy` — a policy condition prevents proceeding (for example, if the disabled policy were ever incorrectly toggled).

The default closeout decision in this phase is `request_owner_approval_for_manual_smoke`, since the owner asked for a closeout of the current disabled state, not for a beta opening.

## 5. Closeout Checks

The closeout module evaluates twelve static checks:

1. `disabled_harness_exists` — the Phase 3FA-C disabled harness exists as a safe design reference.
2. `disabled_harness_remains_disabled` — the harness policy remains disabled by default.
3. `route_remains_feature_disabled` — the similarity API route remains feature-disabled.
4. `live_kis_call_not_executed` — no live KIS call has been made.
5. `live_similarity_execution_not_executed` — no live similarity engine execution has occurred.
6. `route_call_not_executed` — no API route call has been made.
7. `env_read_not_executed` — no environment value has been read.
8. `market_data_not_reported` — no actual market data appears in the closeout report.
9. `raw_provider_payload_not_reported` — no raw provider payload appears in the closeout report.
10. `credential_echo_not_reported` — no credential or token value appears in the closeout report.
11. `owner_approval_required_for_next_phase` — explicit owner approval is required before any separately authorized manual smoke phase.
12. `manual_smoke_requires_separate_command` — any future live manual smoke must run via a separate, explicitly authorized command.

## 6. Safe Closeout Report Shape

The closeout report has the following fields:

- `status` — one of `not_executed`, `blocked`, `ready_for_separate_manual_approval`, `closed_without_execution`, `design_only`.
- `decision` — one of `keep_disabled`, `request_owner_approval_for_manual_smoke`, `defer_to_later_phase`, `blocked_by_policy`.
- `smokeExecuted` — always `false` in this phase.
- `harnessStatus` — always `disabled` in this phase.
- `routeStatus` — always `feature_disabled` in this phase.
- `source` — always `owner-local`.
- `safeSummary` — a human-readable safe summary string.
- `checks` — the twelve closeout checks above.
- `warnings` — safe warning strings (no KIS call, no live execution, no route call, no market values, no env read, separate owner approval required).
- `nextAllowedPhase` — one of `3FA-D-MANUAL-RUN`, `3FB-A`, `blocked`.

This phase only ever records `closed_without_execution`, `not_executed`, or `blocked` — it never records a live success.

## 7. Future Manual Smoke Requirements

Before any owner-local manual smoke may run in a later, separately approved phase, all of the following must be true:

- An explicit, separately authorized phase spec exists for the manual smoke.
- The owner has given explicit approval for that specific phase.
- The manual smoke runs via a separate, explicitly named command — never as a side effect of this closeout or of the Phase 3FA-C harness.
- No credentials, tokens, or raw provider payloads are persisted or logged.
- The API route and `/chart-ai` UI remain unchanged unless a separately authorized phase says otherwise.

## 8. Roadmap After 3FA-D

- Recommended: Phase 3FA-D-MANUAL-RUN — a separately authorized, owner-approved phase to actually execute an owner-local manual smoke under strict, explicit approval gates.
- Alternative: Phase 3FB-A — proceed to the next planning phase without requesting manual smoke execution yet.
