# Current State

- Branch: `rebuild/phase-1-ia-shell`.
- Current baseline: `dcb6724`.
- Latest completed phase: Phase 3FF-A-HOUSEKEEPING-A.

## Current status summary

- Similar Pattern Agent deterministic fixture engine exists (`src/lib/server/chart-ai/similar-pattern-agent.mjs`, Phase 3FF-A-SP-A).
- Similar Pattern SP-B contract `similar-pattern-agent.v0.2` exists, adding `contractVersion`, `confidenceScore`/`confidenceLabel`, `patternQuality`, `matchReasonTags`, `outcomeDistribution`, and `contractSummary`, fully backward compatible with SP-A output (Phase 3FF-A-SP-B).
- MK Agent consumes SP-B contract fields via `hasSpbSimilarPatternContract`, `summarizeSpbContractForMkAgent`, `summarizeOutcomeDistributionForMkAgent`, `summarizePatternQualityForMkAgent`, `summarizeMatchReasonTagsForMkAgent`, additive to legacy SP-A-shaped output (Phase 3FF-A-MK-C).
- The owner-local deterministic panel (`#chartAiOwnerLocalDeterministicAgentsPanel` on `/chart-ai`, opt-in via `ownerLocalDeterministicAgents=1` on localhost only) passed real-browser UI-C QA, confirming the improved MK-C/SP-B output renders correctly with no regression to the default `/chart-ai` experience.
- Phase 3FF-A-HOUSEKEEPING-A fixed stale historical checker changelog-slice/top-entry assumptions (primarily `check:phase-3fd-j-handoff-chart-ai-new-chat-package`) so historical checkers stay stable as new phases are prepended to `docs/planning/planning_changelog.md`.

## Current known clean validations from HOUSEKEEPING-A

All 21 required validation commands plus `npm run build` and `git diff --check` passed cleanly against baseline `dcb6724`, with an empty forbidden-diff result. See [04_VALIDATION_COMMANDS.md](04_VALIDATION_COMMANDS.md) for the full command list.

## Current blocked items

- Live KIS is blocked (live KIS remains blocked).
- LLM activation is blocked.
- Public/beta activation is blocked (public/beta activation remains blocked).
- Deploy is blocked.
- Push is blocked.
- Real Supabase/DB runtime is blocked.
- Real auth/session/JWT/cookie/header parsing is blocked.
- Usage deduction is blocked.
- Paid entitlement is blocked.
- Ad unlock is blocked.

None of these may be activated without a separate, explicit approval phase.
