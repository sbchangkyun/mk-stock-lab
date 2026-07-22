# Next Phase Brief: Phase 3FG-A-PLAN

## Recommended next phase

**Phase 3FG-A-PLAN — Guarded Productization Planning, No Live KIS, No LLM, No Public Activation.**

## Purpose

Plan the productization path after deterministic owner-local QA (SP-B/MK-C/UI-C) and checker stabilization (HOUSEKEEPING-A). This phase must remain planning-only — no source, UI, API, provider, or activation changes.

## Planning topics

- Real auth boundary: how real Supabase/session/JWT auth will replace the current mocked/owner-local gates.
- Feature flag / owner-local / beta separation: how to distinguish owner-local-only, beta-flagged, and fully public rollout stages.
- Usage / cooldown / cache / cost / audit policy: how per-account usage limits, cooldowns, caching, LLM/provider cost control, and audit logging will work once real activation is approved.
- Provider boundary: how the KIS OHLC provider and any future LLM provider will be wired behind server-only boundaries.
- KIS fixture vs live KIS approval gap: what is required to move from the current fixture-only Similar Pattern Agent to live KIS data, and what approval gate that requires.
- Deterministic MK Agent vs LLM approval gap: what is required to move from the current deterministic MK Agent to an LLM-backed agent, and what approval gate that requires.
- UI public/beta readiness criteria: what QA/safety/legal bar the owner-local panel must clear before any public or beta exposure.
- Failure modes and fail-closed behavior: how the system should behave when auth, usage, cache, or provider calls fail.
- Legal/safety copy: required disclaimers and no-investment-advice language for any future public-facing output.
- No investment advice constraints: the system must never emit buy/sell recommendations, target prices, stop-loss instructions, or certainty-style outcome claims.

## Blocked boundaries (must remain true through this planning phase)

- Live KIS still blocked (live KIS still blocked through this phase).
- LLM still blocked.
- Public/beta still blocked.
- Deploy/push still blocked.

This phase produces a plan only; no implementation of any blocked capability is authorized as part of Phase 3FG-A-PLAN.
