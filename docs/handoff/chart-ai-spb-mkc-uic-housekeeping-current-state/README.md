# Phase 3FF-A-HANDOFF-A current-state handoff package

This is a documentation-only handoff package. No Runtime Change. It does not change runtime behavior.

- Baseline: `dcb6724`.
- Branch: `rebuild/phase-1-ia-shell`.
- Latest completed phase: Phase 3FF-A-HOUSEKEEPING-A.

## Purpose

This package lets a future ChatGPT / Claude Code session continue Chart AI SP-B/MK-C/UI-C/HOUSEKEEPING work safely from the current verified `dcb6724` state without relying on long prior chat context. It freezes and summarizes: completed phase history, architecture and guard boundaries, the current recommended validation command chain, the next-phase plan, and a ready-to-use new-chat start prompt.

## File map

- [01_CURRENT_STATE.md](01_CURRENT_STATE.md) — current branch, baseline, latest completed phase, status summary, blocked items.
- [02_COMPLETED_PHASE_HISTORY.md](02_COMPLETED_PHASE_HISTORY.md) — reverse-chronological summary of every completed Phase 3FF-A sub-phase.
- [03_ARCHITECTURE_AND_GUARDS.md](03_ARCHITECTURE_AND_GUARDS.md) — Chart AI owner-local deterministic panel, Similar Pattern SP-B contract, MK Agent MK-C consumption, UI/server guard boundaries.
- [04_VALIDATION_COMMANDS.md](04_VALIDATION_COMMANDS.md) — current recommended validation chain and forbidden-diff check.
- [05_NEXT_PHASE_BRIEF_3FG_A_PLAN.md](05_NEXT_PHASE_BRIEF_3FG_A_PLAN.md) — recommended next phase brief (Phase 3FG-A-PLAN, planning-only).
- [06_NEW_CHAT_START_PROMPT.md](06_NEW_CHAT_START_PROMPT.md) — copy-paste-ready Korean prompt for starting a new ChatGPT conversation.
- [07_MANIFEST.json](07_MANIFEST.json) — machine-readable manifest of this package.

## Strict continuation rule

Future work must start from `dcb6724` or a descendant commit. Do not activate live KIS, LLM, public/beta, deploy, or push without a separate explicit approval phase.
