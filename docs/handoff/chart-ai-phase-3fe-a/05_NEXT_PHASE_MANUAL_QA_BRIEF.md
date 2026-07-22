# Phase 3FE-A-MANUAL-QA Brief

Phase name: `Phase 3FE-A-MANUAL-QA - Owner-local Browser/API QA for KIS OHLC Fixture Mode`

## Purpose

Verify the owner-local KIS OHLC fixture mode manually through local browser/API testing after the handoff baseline is documented.

## Allowed scope

- Manual QA checklist.
- Local owner-only API/browser verification.
- No source changes unless a later separate HF phase is approved.
- No live KIS.
- No LLM.
- No MK AI route activation.
- No Supabase/DB/env/session/JWT.
- No public/beta activation.
- No deploy/push.

## Expected manual QA targets

- Default `/chart-ai` remains mocked.
- Owner-local route query works only locally.
- Default owner-local Similar Pattern remains synthetic/sample.
- Explicit `ownerLocalOhlcProviderMode: "kis_ohlc_fixture"` uses fixture provider boundary.
- Raw payloads are not visible in API/UI output.
- Remote, anonymous, unknown, and malformed cases fail closed.
- MK AI remains mocked.
