# Current State

Repository path: `C:\Users\kkama\OneDrive\문서\Project\mk-stock-lab`

Branch: `rebuild/phase-1-ia-shell`

Latest completed phase: `Phase 3FD-J`

Latest commit: `6a7a51d`

Next recommended phase: `Phase 3FE-A — KIS OHLC Provider Owner-local Integration`

## Current Chart AI Feature State

- Chart AI mocked UI is complete.
- Portfolio-aligned login gate is complete.
- Server-only guard foundation is complete.
- Owner-local Similar Pattern route-backed flow is complete.
- Default `/chart-ai` remains mocked unless the owner-local route query is used.
- The explicit owner-local route query is `ownerLocalSimilarPatternRoute=1`.
- MK AI remains mocked.
- Owner-local Similar Pattern route execution uses deterministic synthetic/sample data only.
- Public and beta activation are not allowed.

## Completed Feature State

- `/chart-ai` supports mocked authenticated mode by default.
- `/chart-ai?chartAiMockLoggedOut=1` simulates anonymous mode and hides the Chart AI body.
- `/chart-ai?chartAiMockMaster=1` simulates master capability and preserves master cooldown bypass.
- `/chart-ai?chartAiMockLoggedOut=1&chartAiMockMaster=1` gives logged-out state precedence.
- `/chart-ai?ownerLocalSimilarPatternRoute=1` locally switches only Similar Pattern execution to the guarded owner-local route-backed path.
- Owner-local authenticated panels remain available only in authenticated mock modes.
- Normal user cooldown remains active after successful analysis.
- Master cooldown bypass remains represented as a mocked capability.
- The API route `/api/chart-ai/similarity` has an explicit owner-local Similar Pattern subpath inside the guarded scaffold branch.
- The owner-local route returns sanitized labels and counts only.

## Blocked Integrations

- KIS provider is not integrated.
- LLM is not integrated.
- MK AI route activation is not active.
- Real auth runtime is not active.
- Supabase/DB persistence is not active.
- Environment reads are not active.
- Cookie, header, session, and JWT parsing are not active.
- Public/beta activation is not allowed.
- Deploy and push are not allowed without explicit owner approval.

## Not Yet Completed

- Phase 3FE-A KIS OHLC Provider Owner-local Integration is not completed.
- Phase 3FF-A MK AI LLM Scaffold and Owner-local Activation is not completed.
- Phase 3FG-A Beta Release Gate Package is not completed.
- Phase 3FG-B Limited Beta Activation is not completed.
- Real master identifier checks are not implemented.
- Real usage/cache persistence is not implemented.
- Actual server-side usage limiting is not active.
- Public route success is not active.
