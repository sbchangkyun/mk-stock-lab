# Shortened Chart AI Roadmap

KIS and LLM must remain separate phases. The beta gate must remain separate from limited beta activation. Phase 3FE-A must not include MK AI or LLM.

## 1. Phase 3FD-I — Real Auth + Server Guard Foundation — completed

- Purpose: Add server-only guard contracts and fail-closed decisions before route activation.
- Allowed scope: Subject state, role/capabilities, page access, execution eligibility, cooldown, usage, cache, cost, audit, provider-disabled, and route-success-disabled modeling with deterministic mocked fixtures.
- Blocked scope: Route success, real auth runtime, Supabase, DB, env reads, session/JWT parsing, KIS, LLM, persistence, public/beta activation.
- Completion criteria: Guard foundation exists, all runtime gates remain off, deterministic smoke/checker pass, result doc and changelog recorded.

## 2. Phase 3FD-J — Similar Pattern Route Owner-local Activation — completed

- Purpose: Verify UI-to-route Similar Pattern flow under explicit owner-local conditions only.
- Allowed scope: Guarded route owner-local subpath, synthetic/sample Similar Pattern execution, sanitized response, local UI opt-in, smoke/checker/docs.
- Blocked scope: Public/beta activation, live KIS, LLM, MK AI route activation, real auth, Supabase, DB, env/session/JWT parsing, usage/cache persistence.
- Completion criteria: Owner-local Similar Pattern route path works with synthetic/sample data only, default UI remains mocked, validation passes, result doc and changelog recorded.

## 3. Phase 3FE-A — KIS OHLC Provider Owner-local Integration — next

- Purpose: Integrate a KIS OHLC provider only for explicit owner-local Similar Pattern verification.
- Allowed scope: Server-only provider integration boundary, redacted owner-local provider result handling, sanitized route response, validation/checker/docs, and explicit local-only activation.
- Blocked scope: MK AI, LLM, public/beta activation, account APIs, trading APIs, order APIs, balance APIs, raw provider payload exposure, raw OHLC exposure, deploy/push.
- Completion criteria: Owner-local Similar Pattern can use KIS OHLC through approved safe boundaries, no raw secrets or payloads are exposed, default public behavior remains blocked, validation passes.

## 4. Phase 3FF-A — MK AI LLM Scaffold + Owner-local Activation — later

- Purpose: Add a controlled MK AI LLM scaffold after Similar Pattern provider integration is isolated.
- Allowed scope: Owner-local LLM scaffold, prompt/output redaction policy, cost guard scaffolding, sanitized output, validation/checker/docs.
- Blocked scope: Public/beta activation, uncontrolled LLM execution, provider secret exposure, persistence without approval, KIS scope expansion.
- Completion criteria: Owner-local MK AI route behavior is isolated, sanitized, guarded, and validated without public activation.

## 5. Phase 3FG-A — Beta Release Gate Package — later

- Purpose: Prepare beta release gates and review package before any limited beta activation.
- Allowed scope: Gate checklist, validation matrix, rollback notes, monitoring requirements, manual QA package, owner approval gates.
- Blocked scope: Enabling beta access, widening public route success, live production activation without approval.
- Completion criteria: Owner can review exact beta prerequisites and approve or reject activation separately.

## 6. Phase 3FG-B — Limited Beta Activation — later

- Purpose: Activate limited beta only after the beta gate package is approved.
- Allowed scope: Narrow activation under owner-approved constraints.
- Blocked scope: Unbounded public activation, unreviewed KIS/LLM usage, missing rollback or monitoring boundary.
- Completion criteria: Limited beta activation is explicitly approved, bounded, validated, and documented.
