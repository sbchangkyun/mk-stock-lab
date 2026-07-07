# Current State

Repository path: `C:\Users\kkama\OneDrive\문서\Project\mk-stock-lab`

Branch: `rebuild/phase-1-ia-shell`

Current baseline commit: `e6c7679`

Latest completed feature phase: `Phase 3FE-A`

Latest feature commit: `1b2a0f2`

Latest evidence phase: `Phase 3FE-A-HF1`

Latest evidence commit: `e6c7679`

## Current Chart AI state

- `/chart-ai` default remains mocked.
- Mocked logged-out mode remains available through `chartAiMockLoggedOut=1`.
- Mocked master mode remains available through `chartAiMockMaster=1`.
- Logged-out state wins over master mock mode.
- Owner-local Similar Pattern route-backed flow remains available through `ownerLocalSimilarPatternRoute=1`.
- Default owner-local Similar Pattern route flow remains synthetic/sample.
- Explicit provider fixture mode uses `ownerLocalOhlcProviderMode: "kis_ohlc_fixture"`.
- MK AI remains mocked.

## Blocked integrations

- Live KIS.
- LLM.
- MK AI route activation.
- Real auth runtime.
- Supabase/DB.
- Env/session/JWT/cookie/header parsing.
- Usage/cache persistence.
- Public/beta activation.
- Deploy/push.

## Not yet completed

- Manual browser/API QA for provider fixture mode.
- Live KIS approval and execution.
- MK AI LLM scaffold.
- Beta release gate.
- Limited beta activation.
