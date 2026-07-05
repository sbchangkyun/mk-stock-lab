# Phase 3FC-G Chart AI Remaining Roadmap and Actual KIS API Stage

## 1. Current Position

- The Phase 3FC-C, 3FC-D, 3FC-E, and 3FC-F scaffolds are complete.
- None of the four scaffolds is wired into the route or UI.
- Real Supabase Auth is not implemented.
- Real database-backed role/usage/flag storage is not implemented.
- Live KIS is not connected.
- Public and beta similarity exposure are not enabled.

## 2. Recommended Roadmap

### Phase 3FC-G

Documentation-only route integration plan refresh (this phase).

### Phase 3FC-H

Guarded Route Integration Scaffold, All Flags Off, No Live KIS.

Purpose:

- The route imports and composes the four scaffolds, but all runtime gates stay false.
- The default route remains feature-disabled.
- No real Supabase, real database, or live KIS is introduced.

### Phase 3FC-I

Owner-local Mocked Guarded Route Smoke, No Live KIS.

Purpose:

- Test the exact future guarded route branch using mocked fixtures only.
- No public or beta activation.

### Phase 3FC-J

Manual QA and Productization Boundary Review for Guarded Route.

Purpose:

- Verify failure states, redaction, no auto-run behavior, and no route drift.
- Decide whether to move forward to real Supabase/database implementation.

### Phase 3FD-A

Real Supabase Auth Runtime Approval and Setup Package, No Runtime Change.

Purpose:

- Approve package install, environment variable key names, Supabase project, and auth flow.
- No secret values printed.

### Phase 3FD-B

Real Supabase Auth Subject Resolver Implementation, Disabled by Default.

Purpose:

- Implement real server-side session resolution behind disabled flags.
- No public or beta route success.

### Phase 3FD-C

Role Assignment and Usage Store Schema/Migration Approval.

Purpose:

- Approve SQL/migration/RLS/data retention/idempotency design.
- No migration execution unless separately approved.

### Phase 3FD-D

Real Role Assignment and Usage Store Implementation, Disabled by Default.

Purpose:

- Real database-backed role/usage resolution.
- Atomic increment and idempotency strategy.
- Still route-gated.

### Phase 3FD-E

Beta Route Enablement Review, KIS Still Off.

Purpose:

- Beta flag review.
- Legal/disclaimer, abuse, monitoring, and rollback checks.
- KIS remains off unless separately approved.

### Phase 3FE-A

Actual KIS Reachability Recheck, Separately Approved.

Purpose:

- Owner-local redacted connectivity check only.
- No route/UI change.
- No public/beta activation.

### Phase 3FE-B

Actual KIS OHLC Provider Smoke, Owner-local Redacted.

Purpose:

- Run the KIS OHLC provider smoke after reachability is confirmed.
- No raw values printed.

### Phase 3FE-C

Live KIS Guarded Integration Design/Implementation, Owner-local/Beta only.

Purpose:

- Connect live OHLC only behind `LIVE_KIS_OHLC_ENABLED` and a separate owner approval.
- No public activation.

## 3. Actual KIS API Connection Status

- Current status: not connected.
- Current blocker: a prior attempt surfaced an external/network TCP reachability issue.
- No repository source defect has been confirmed as the current blocker.
- Live KIS should not be retried during Phase 3FC-G or Phase 3FC-H unless the owner separately
  approves a KIS-specific phase.
- KIS route usage must wait until auth/role/usage/flag route safety is ready.

## 4. KIS Approval Requirements

- Explicit owner approval for any KIS call.
- Local/session-only approval scope — approval given in one session does not carry over silently.
- No `.env` printing.
- No credential echo.
- No raw response echo.
- No OHLC price/volume/timestamp printing in chat or in documentation.
- A redacted report only.
- No deploy, no push.
- No public or beta route success as a result of any KIS check.

## 5. Public/Beta Activation Requirements

- Real auth implemented.
- Role assignment implemented.
- Usage store implemented.
- Feature flags implemented.
- Legal/disclaimer review.
- Abuse/rate-limit policy.
- Monitoring/logging decision.
- Data retention policy.
- Rollback plan.
- Manual QA.
- Owner approval.

## 6. Recommended Decision

- Proceed with Phase 3FC-H, the guarded route scaffold, after this documentation phase.
- Do not proceed to an actual KIS API connection attempt until at least KIS reachability is
  confirmed and the owner approves a dedicated KIS phase.
