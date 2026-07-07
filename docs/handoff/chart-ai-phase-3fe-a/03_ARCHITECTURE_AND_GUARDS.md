# Architecture and Guards

## UI layer

- `/chart-ai` remains mocked by default.
- Mocked anonymous and master modes are query-driven.
- Client-side cooldown behavior remains in place.
- MK AI behavior remains mocked.

## API route layer

- Route: `/api/chart-ai/similarity`.
- Owner-local Similar Pattern route path exists for local guarded verification.
- Provider fixture mode is only available through explicit owner-local request data.

## Server guard foundation

- Fail-closed guard foundation remains active for the owner-local guarded path.
- Unknown roles fail closed.
- Missing dependencies fail closed.

## KIS OHLC provider boundary

- Server-only.
- Fixture-only.
- Owner-local only.
- No live network call.
- Disabled live boundary remains in place.
- Provider-shaped fixture normalization is available for deterministic fixture input.
- Malformed fixture input fails closed.

## Data redaction policy

Route-visible and handoff-visible output must not expose:

- No raw KIS payload.
- No raw provider payload.
- No raw OHLC rows.
- Normalized paths.
- Raw subject IDs.
- Raw emails or UIDs.
- Tokens, cookies, sessions, JWTs, env values, or stack traces.

## Blocked runtime

- No live KIS.
- No LLM.
- No MK AI route activation.
- No Supabase/DB.
- No env/session/JWT/cookie/header parsing.
- No public/beta activation.
- No deploy/push.
