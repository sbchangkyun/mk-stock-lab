# Architecture And Guards

## UI Layer: `/chart-ai`

The `/chart-ai` page currently remains mocked by default. It includes mocked authenticated mode, mocked anonymous mode through `chartAiMockLoggedOut=1`, mocked master mode through `chartAiMockMaster=1`, client-side cooldown handling, mocked MK AI behavior, and owner-local panels in authenticated mock modes.

When `ownerLocalSimilarPatternRoute=1` is present on a local host and the page is not in logged-out mock mode, only the Similar Pattern trigger switches to the owner-local guarded route-backed flow. Default `/chart-ai` behavior remains mocked.

## API Route Layer: `/api/chart-ai/similarity`

The route keeps the existing disabled-by-default shell and older owner-local mocked branches. Phase 3FD-J added one owner-local Similar Pattern subpath inside the guarded runtime scaffold branch. It requires:

- guarded scaffold mode
- explicit owner-local activation flag
- local host
- `similar_pattern` request kind
- mocked-safe `user` or `master` role

The success response is sanitized. It returns labels, counts, and bucketed summary data only.

## Server Guard Foundation

The Phase 3FD-I guard foundation models subject state, role, capabilities, page access, Similar Pattern eligibility, MK AI eligibility, cooldown, usage, cache, cost, audit, provider-disabled, and route-success-disabled decisions.

All runtime gates remain off. Route success remains false in the foundation. Unknown roles and missing dependencies fail closed.

## Owner-local Similar Pattern Activation Helper

The Phase 3FD-J helper reuses the Phase 3FD-I guard foundation. It validates local host, explicit activation, request kind, and mocked-safe role before executing deterministic synthetic/sample Similar Pattern analysis.

It does not read environment values, parse cookies, parse sessions, verify JWTs, connect to Supabase, connect to a database, call KIS, call an LLM, or persist usage/cache state.

## Deterministic Synthetic Similarity Engine

The owner-local route uses deterministic synthetic/sample OHLC fixture data and the existing similarity engine. The public response must not expose raw OHLC bars, normalized paths, provider payloads, raw subject IDs, emails, UIDs, tokens, cookies, sessions, stack traces, or environment values.

## Mocked MK AI State

MK AI remains mocked in the UI. MK AI route activation is not active. LLM integration is deferred to Phase 3FF-A or later.

## Login Gate Behavior

`chartAiMockLoggedOut=1` simulates anonymous mode and hides the Chart AI body. If `chartAiMockLoggedOut=1` and `chartAiMockMaster=1` are both present, logged-out state wins.

## Cooldown Behavior

Normal authenticated mock users receive client-side cooldown after successful analysis. The cooldown is UX friction only; actual server-side rate limiting and cost controls are not active.

## Master Cooldown Bypass Policy

Master cooldown bypass is represented only as a mocked capability named `canBypassAnalysisCooldown`. Real master identity resolution is not implemented. Raw master email and raw master UID must never be committed or exposed.

## Owner-local Route Opt-in

The owner-local route path is opt-in only through `ownerLocalSimilarPatternRoute=1` on `/chart-ai` and a guarded route request body with explicit activation. It is not public or beta activation.

## Data Redaction Policy

Return only sanitized labels, counts, and non-sensitive summary fields. Never return raw OHLC rows, raw provider payload, normalized paths, subject IDs, emails, UIDs, tokens, cookies, sessions, stack traces, or environment values.

## Raw Identity Protection Policy

Use placeholders only: `MASTER_USER_ID`, `MASTER_EMAIL`, `isMasterUser`, `canBypassAnalysisCooldown`. Do not implement raw identifier comparisons in client code or server code without a separate approved trusted-runtime phase.

## Explicitly Blocked

- Raw master email or UID
- `.env` inspection
- Supabase client creation
- DB connection
- KIS live call before Phase 3FE-A approval
- LLM call before Phase 3FF-A approval
- Public route success
- Beta activation
- Raw OHLC or provider payload exposure
- Account, trading, order, or balance APIs
- Deploy or push without owner approval
