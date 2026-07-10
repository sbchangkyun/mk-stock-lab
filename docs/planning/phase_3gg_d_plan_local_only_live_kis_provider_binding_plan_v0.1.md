# Phase 3GG-D-PLAN — Local-only Live KIS Provider Binding Plan, No Activation — v0.1

## 1. Status

Status: Prepared. Planning-only. No Activation. Local-only Live KIS provider binding plan only. Live KIS remains blocked and inactive. No runtime/source/API/provider changes.

## 2. Purpose

This phase plans a future local-only Live KIS provider binding path. It converts Phase 3GG-C's decision record into an implementation-readiness plan. It does not implement provider binding. It does not call Live KIS. It does not read credentials. It does not activate routes.

## 3. Baseline

- Baseline: `600317e`.
- Latest completed phase before this phase: Phase 3GG-C.
- Branch: `rebuild/phase-1-ia-shell`.

## 4. Source of truth

This plan is built from:

- Phase 3GG-C decision record (`docs/planning/phase_3gg_c_live_kis_activation_decision_record_v0.1.md` and its result document).
- Phase 3GG-B-REVIEW-RECORD (`docs/planning/phase_3gg_b_review_record_live_kis_owner_review_v0.1.md`).
- Phase 3GG-B-AUDIT (`docs/planning/phase_3gg_b_audit_live_kis_gate_evidence_review_v0.1.md`).
- Phase 3GG-B checklist (`docs/planning/phase_3gg_b_live_kis_approval_gate_checklist_v0.1.md`).
- Phase 3GG-A-PLAN (`docs/planning/phase_3gg_a_plan_live_kis_llm_approval_runtime_binding_v0.1.md`).
- `src/lib/server/chart-ai/guarded-productization-scaffold.mjs` existing flags/labels, read-only only (no source change made in this phase):
  - `liveKisEnabled` (currently `false`).
  - `providerMode: live_kis` (currently blocked via `BLOCKED_PROVIDER_MODES`).
  - `BLOCKED_PROVIDER_MODES` (currently `['live_kis']`).
  - `APPROVAL_LABELS.liveKis`.
- Existing KIS provider tree under `src/lib/server/providers/kis/`, read-only only (pre-existing, unmodified by this phase).

## 5. Current verified state

- 11 Live KIS gates review-approved/conditionally approved.
- Live KIS remains inactive.
- `providerMode live_kis` remains blocked.
- `liveKisEnabled` remains false.
- No Chart AI API route activated for Live KIS.
- No public/beta/internal QA activation allowed.
- Any real activation still requires a future exact commit/PR sign-off.

## 6. Owner conditions preserved from Phase 3GG-C

Preserved verbatim, 11 gates:

- Gate 1: KIS credentials read-only/server-only; no order/trade/account/balance/portfolio permissions; no secrets in chat/docs/code.
- Gate 2: approved market-data endpoint categories only; forbidden account/trading/order/balance/funds/profit-loss/deposit-withdrawal/personal endpoints remain blocked.
- Gate 3: 5/min, 30/hour, 100/day initial local request ceiling.
- Gate 4: free-tier or 0원 until separate approval.
- Gate 5: 300-second cache TTL; cache key excludes PII/session/JWT/cookie/email.
- Gate 6: first activation is general local only, not owner-local only; no deployed/internal QA/beta/public activation.
- Gate 7: fail closed on timeout/malformed/missing credential/rate-limit/provider error.
- Gate 8: no raw KIS payload in UI/logs/LLM; sanitized OHLC/current price/volume/summary only.
- Gate 9: minimal sanitized logs only.
- Gate 10: rollback to `liveKisEnabled` false and fixture-only/no-live-KIS.
- Gate 11: separate future activation commit/PR sign-off required.

## 7. Local-only definition

Local-only means localhost/developer local server only. It is:

- not deployed.
- not Vercel.
- not beta.
- not public.
- not internal QA.
- not enabled by branch name alone.
- not enabled by build success alone.
- not enabled by query param alone.
- not enabled by environment variable alone unless a later phase explicitly approves the full guard path.

## 8. Future binding architecture plan

This section plans an architecture without implementing it:

- local-only guard layer.
- credential access layer (server-only).
- approved endpoint allowlist layer.
- request limiter layer.
- cache layer with 300s TTL.
- KIS provider adapter layer.
- sanitizer layer.
- audit/log layer.
- fail-closed decision layer.
- rollback switch.
- validation checker layer.

Data flow (plan only):

"local request → local-only guard → feature flag check → endpoint allowlist → rate limit → cache lookup → provider call only if allowed → sanitize response → minimal log → return sanitized response."

This data flow is a plan only and must not be implemented in this phase.

## 9. Future file-boundary proposal

Candidate future files (proposed, NOT created in this phase; not decided as mandatory final names):

- `scripts/smoke_phase_3gg_d_local_only_live_kis_provider_binding_scaffold.mjs` (candidate).
- `scripts/check_phase_3gg_d_contract.mjs` (candidate).
- `docs/planning/phase_3gg_d_local_only_live_kis_provider_binding_scaffold_result_v0.1.md` (candidate).
- a future isolated server-only adapter file, if required (candidate, name not decided).
- a future fixture/mock file, if required (candidate, name not decided).

## 10. Endpoint allowlist plan

Allowed initial categories: current price; OHLC bars; daily/weekly/monthly/yearly bars; minute bars; volume; order book/expected execution; symbol basics; sector/index information; investor flow; foreign/institutional flow; short selling; program trading; market-cap rankings; volume rankings; change-rate rankings; financial ratios; brokerage opinions.

Forbidden categories: order; cancel/modify order; account; balance; funds; buying power; sellable quantity; profit/loss; deposit/withdrawal; personal endpoint; trading history; portfolio/holdings.

Even allowed categories must be mapped through an explicit allowlist before any future provider call. Anything not explicitly allowlisted must fail closed.

## 11. Credential and environment policy

- This phase does not read `.env`.
- A future phase may only read credentials if separately scoped/approved.
- Credentials must stay server-only.
- No secrets in client bundle/docs/logs/checker output.
- No credential value in commits.
- Secret presence checks must be non-revealing.

## 12. Rate limit and quota plan

- Initial local ceiling: 5/min, 30/hour, 100/day.
- Exceeding the limit must block, not queue.
- Response must be unavailable/rate-limited, not fabricated.
- Limiter must run before provider call.
- Validation must prove excessive requests do not call the provider.

## 13. Cache plan

- Initial TTL: 300 seconds.
- Cache-before-call is required.
- Cache key must exclude PII/session/JWT/cookie/email.
- Cache hit must not call the provider.
- Cache stale behavior must fail closed or refetch only if all gates pass.
- Cache output must remain sanitized.

## 14. Cost plan

- Free-tier or 0원 until separate approval.
- If any cost signal or quota uncertainty appears, future provider calls must stop.
- No silent overrun.
- Cost monitoring may be planned but not implemented here.

## 15. Sanitization and response contract plan

- No raw KIS payload exposure. Only sanitized fields may leave the provider boundary.
- Allowed output families: symbol, market, timestamp, OHLC, current price, volume, selected market-data summary fields, source status, cache status, sanitized error code.
- Forbidden output: account/order/balance/funds data, raw provider response, credentials/tokens, headers/cookies/session/JWT, personal identifiers.

## 16. Audit/logging plan

- Allowed logs: timestamp, symbol, market, providerMode, success/failure, sanitized error code, latency, cache hit flag, rate-limit blocked flag.
- Forbidden logs: credentials, API key/secret value, access token, JWT, session, cookie, email, account number, order/balance/funds/deposit data, raw KIS payload.

## 17. Fail-closed plan

Fail closed on each of the following: missing credential; invalid credential; timeout; malformed provider response; rate limit exceeded; cost limit uncertain/exceeded; endpoint not allowlisted; non-local request; public/beta/internal QA request; provider exception; sanitizer failure. No fabricated live data.

## 18. Rollback plan

- Rollback target is fixture-only/no-live-KIS.
- `liveKisEnabled` must be false.
- `providerMode live_kis` must remain blocked or be re-blocked.
- Local-only route/binding must be disabled.
- Validation must be re-run after rollback.
- Rollback must be possible without deploy/push in local test phase.

## 19. Future validation plan

Future validation must check: no forbidden source diff outside scoped files; no `.env` secret leakage; no raw payload exposure; no forbidden endpoint strings; no account/order/balance endpoint usage; no live call when local guard fails; no live call when rate limit exceeded; no live call on cache hit; no live call when endpoint is not allowlisted; no public/beta/internal QA activation; no LLM handoff; rollback validation; build; `git diff --check`.

## 20. Future implementation phase proposal

Recommend: **Phase 3GG-D — Local-only Live KIS Provider Binding Scaffold, All Gates Off, No Live Call.**

Phase 3GG-D must still avoid real credential read, real KIS call, route activation, and deploy/push unless its own work order explicitly scopes and validates each item.

## 21. Non-goals

1. No live KIS call.
2. No KIS provider source change.
3. No API route creation.
4. No `chart-ai.astro` change.
5. No scaffold source change.
6. No `providerMode` unblock.
7. No `liveKisEnabled` true.
8. No credential read.
9. No `.env` read.
10. No LLM.
11. No Supabase/DB.
12. No public/beta/internal QA.
13. No deploy/push.
14. No dependency/lockfile change.

## 22. Decision summary

Phase 3GG-D-PLAN prepares the local-only provider binding plan. It does not activate Live KIS. The project may proceed next to Phase 3GG-D scaffold planning/implementation only if that phase remains all-gates-off and no-live-call. As stated in Phase 3GG-C and preserved here, actual activation still requires a future exact commit/PR sign-off.
