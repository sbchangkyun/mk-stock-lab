# Chart AI New Chat Handoff — Read First

Project: `mk-stock-lab`

Branch: `rebuild/phase-1-ia-shell`

Latest completed phase: `Phase 3FD-J`

Latest commit: `6a7a51d`

Next recommended phase: `Phase 3FE-A`

This package exists so a new ChatGPT conversation can continue the Chart AI roadmap from repository evidence, not from prior chat memory.

## Required Reading Order

1. `docs/handoff/chart-ai-new-chat/00_README_FIRST.md`
2. `docs/handoff/chart-ai-new-chat/01_CURRENT_STATE.md`
3. `docs/handoff/chart-ai-new-chat/02_COMPLETED_PHASE_HISTORY.md`
4. `docs/handoff/chart-ai-new-chat/03_ARCHITECTURE_AND_GUARDS.md`
5. `docs/handoff/chart-ai-new-chat/04_SHORTENED_ROADMAP.md`
6. `docs/handoff/chart-ai-new-chat/05_NEXT_PHASE_3FE_A_BRIEF.md`
7. `docs/handoff/chart-ai-new-chat/06_VALIDATION_COMMANDS.md`
8. `docs/handoff/chart-ai-new-chat/07_NEW_CHAT_START_PROMPT.md`
9. `docs/handoff/chart-ai-new-chat/handoff_manifest.json`

## Source-of-Truth Priority

1. Current Git HEAD and branch
2. `docs/handoff/chart-ai-new-chat/` files
3. `docs/planning/planning_changelog.md`
4. Phase result documents
5. Actual source files
6. Owner's latest instruction

## Anti-Hallucination Rule

Do not infer completed work from the roadmap. Only treat a phase as completed if it is listed in CURRENT_STATE or COMPLETED_PHASE_HISTORY with a commit hash and validation result.

If a fact is not present in repository files, result documents, changelog, or the owner's latest report, write `not confirmed`.

## Hard Blocked Items

- Do not inspect `.env`, `.env.local`, or `.env.*`.
- Do not print credentials, tokens, cookies, sessions, raw user IDs, raw emails, or provider secrets.
- Do not write raw master identifiers. Use placeholders only: `MASTER_USER_ID`, `MASTER_EMAIL`, `isMasterUser`, `canBypassAnalysisCooldown`.
- Do not create a Supabase client.
- Do not connect to a database.
- Do not make a live KIS call before a separate approved Phase 3FE-A implementation.
- Do not make an LLM call before a separate approved Phase 3FF-A implementation.
- Do not activate public or beta access.
- Do not expose raw OHLC rows or raw provider payloads.
- Do not use account, trading, order, or balance APIs.
- Do not deploy or push without explicit owner approval.

## Required First Action In A New Chat

The new chat must summarize the current state before writing any implementation prompt. It must identify the latest completed phase, latest commit, next recommended phase, hard blocked boundaries, source-of-truth files, and items that are not confirmed.
