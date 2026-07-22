# Next Phase Brief: Phase 3FE-A

Phase name: `Phase 3FE-A — KIS OHLC Provider Owner-local Integration`

## Purpose

Add an owner-local KIS OHLC provider integration path for Similar Pattern analysis while preserving all public, beta, LLM, MK AI, auth, persistence, and deployment boundaries.

## Starting Point

The current owner-local Similar Pattern route uses synthetic/sample data only. Phase 3FD-J verified the UI-to-route path through the guarded route branch with deterministic synthetic/sample Similar Pattern output and sanitized response data.

## Next Objective

Add owner-local KIS OHLC provider integration so the Similar Pattern owner-local route can be validated against provider-shaped OHLC data without public activation and without exposing raw provider payloads.

## Allowed Scope

- Server-only KIS OHLC provider integration boundary.
- Explicit owner-local activation only.
- Similar Pattern route integration only.
- Sanitized response shape only.
- Redacted diagnostics only.
- Static checker, deterministic or mocked-safe smoke where practical, result doc, changelog, and package scripts.

## Blocked Scope

- No account API.
- No order API.
- No balance API.
- No trading API.
- No public/beta activation.
- No LLM.
- No MK AI.
- No raw KIS payload in UI or public response.
- No raw OHLC rows in UI or public response.
- No deploy/push.
- No dependency or lockfile change unless separately approved.
- No real auth runtime expansion unless separately approved.
- No Supabase/DB persistence unless separately approved.

## Expected Files Likely To Be Touched

Exact files must be confirmed by the future phase before implementation. Likely areas include:

- `src/pages/api/chart-ai/similarity.ts`
- `src/lib/server/` provider or owner-local integration modules
- `src/lib/chartSimilarity/` only if an existing public engine import boundary needs adaptation
- `scripts/check_phase_3fe_a_*`
- `scripts/smoke_phase_3fe_a_*`
- `docs/planning/phase_3fe_a_*_result_v0.1.md`
- `docs/planning/planning_changelog.md`
- `package.json`

## Required Validation

- Initial git branch, HEAD, and status checks.
- New Phase 3FE-A checker.
- New Phase 3FE-A smoke or safe deterministic validation.
- Phase 3FD-J checker and smoke.
- Phase 3FD-I checker and smoke.
- `npm run build`.
- `git diff --check`.
- Forbidden path diff review.
- Sensitive identifier and raw provider payload checks.

## Risk Notes

- Environment credentials must not be printed.
- `.env` must not be inspected unless a future owner-approved phase explicitly allows it.
- Provider diagnostics must remain redacted.
- Provider output must not expose raw KIS payloads or raw OHLC rows to UI or public route responses.
- Account, trading, order, and balance APIs remain out of scope.
- Public and beta activation remain out of scope.
