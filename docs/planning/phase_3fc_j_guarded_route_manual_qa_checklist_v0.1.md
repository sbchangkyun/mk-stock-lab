# Phase 3FC-J Guarded Route Manual QA Checklist

## 1. Purpose

This is a manual QA checklist for the guarded route scaffold added in Phase 3FC-H and smoke-verified
in Phase 3FC-I. This phase produces the checklist only — it does not execute any manual browser QA,
does not start a dev server, and makes no runtime source change. It does not enable live KIS, real
Supabase, real database persistence, or beta/public activation. The checklist below is what the
owner (or a future QA session with separate approval) should manually verify before any real runtime
work begins.

## 2. Preconditions

- Phase 3FC-H (guarded route scaffold, all flags off) is committed.
- Phase 3FC-I (owner-local mocked guarded route smoke) passed against the real route handlers.
- The Chart Similarity API route has exactly three guarded branches: `owner-local-mocked`,
  `owner-local-auth-usage-bridge`, and `guarded-runtime-scaffold`.
- The `guarded-runtime-scaffold` branch still falls back to the existing feature-disabled shell for
  every request variant.
- `/chart-ai` is unchanged from its Phase 3FB-E state.
- No deploy and no push have occurred as part of this scaffold track.

## 3. Manual QA Environment Rules

- QA must run owner-local only, never against a public URL.
- No production data may be used.
- No real KIS data may be used or requested.
- No credential value may ever be displayed during QA, in a screenshot, or in a QA note.
- `.env`, `.env.local`, or any `.env.*` file must not be opened during QA.
- No browser QA session may begin without separate, explicit owner approval distinct from this
  documentation phase's approval.
- No live KIS network check may be performed as part of this QA.

## 4. Route-level QA Cases

| Case | Expected route category | Expected response safety | Forbidden result |
| --- | --- | --- | --- |
| Default unmatched request | Feature-disabled shell (`feature-flag-off`) | `ok:false`, `data:null`, no leaked internals | Any 2xx success or leaked policy field |
| Owner-local mocked request | `owner-local-mocked` success | Deterministic mocked result only, no raw KIS values | Live provider call, raw OHLC values |
| Owner-local auth/usage bridge request | `owner-local-auth-usage-bridge` success | Owner-role, allowed-guard-status result, no raw match payload | Raw session token, raw subject id |
| Exact guarded-runtime-scaffold request | Falls back to feature-disabled shell | Same safe shell as default; no scaffold internals leaked | `summary`, `safeMessage`, or `policy` fields in the client response |
| Partial guarded request | Falls back to feature-disabled shell | Predicate correctly rejects a non-exact-match body | Predicate false-positive match |
| Wrong-source guarded request | Falls back to feature-disabled shell | Predicate correctly rejects `source: "live"` | Any acceptance of a non-mocked source |
| Malformed guarded request | Falls back to feature-disabled shell | Safe fallback for `null` and non-object bodies as well | Any thrown, unhandled, or raw error response |
| Non-POST request (`ALL` handler) | Feature-disabled shell | Same safe shell regardless of HTTP method | Any method-specific success path |

## 5. UI-level QA Cases

- The `/chart-ai` public sample view remains unchanged from its pre-3FC-H state.
- The owner-local mocked panel and the owner-local auth/usage bridge panel remain local/query-gated,
  not publicly reachable by default.
- No panel auto-runs a similarity request on page load.
- No new guarded-route-specific UI exists yet — the guarded-runtime-scaffold branch has no UI
  entry point in this phase.
- No UI path can produce a success response through the guarded branch, because the route itself
  never returns one.

## 6. Redaction QA

- [ ] No access/refresh token value appears in any response, log, or QA note.
- [ ] No raw session payload appears in any response.
- [ ] No raw auth subject id appears in any response exposed to a non-owner caller.
- [ ] No `process.env`/`import.meta.env`/Vercel environment variable value is ever printed.
- [ ] No credential value (KIS app key/secret, Supabase service key, etc.) appears anywhere.
- [ ] No raw KIS payload appears in any response.
- [ ] No raw OHLC price, volume, or timestamp value appears in any response.
- [ ] No raw similarity score or return value appears unless a future phase separately approves it.
- [ ] No account/trading/order/balance field appears in any response.
- [ ] No guarded route scaffold policy internal (`summary`, `safeMessage`, `policy`) leaks to the
      client.

## 7. Failure-state QA

- [ ] Feature-disabled state resolves safely with no leaked internals.
- [ ] An auth-required candidate state (once real auth exists) must fail closed, not open.
- [ ] A usage-limited candidate state (once real usage exists) must fail closed, not open.
- [ ] A blocked state resolves to the same safe shell as the default case.
- [ ] A malformed request never throws an unhandled error to the client.
- [ ] A redaction failure must fail closed (block the response) rather than leak partial data.
- [ ] A live-KIS-requested-too-early condition is rejected, not silently ignored or partially
      honored.
- [ ] A public-requested-too-early condition is rejected by the existing all-flags-off policy.

## 8. Regression QA

The following existing validations must remain green before and after any manual QA session:

- Phase 3FC-I smoke and checker.
- Phase 3FC-H smoke and checker.
- Phase 3FC-F, 3FC-E, 3FC-D, 3FC-C checkers and smokes.
- Phase 3FC-B and 3FC-A checkers.
- Phase 3FB-F, 3FB-E, 3FB-D, 3FB-C, 3FB-B, 3FB-A route/UI regressions.
- `npm run build`.
- `git diff --check`.

## 9. QA Decision Record

- [ ] QA not started
- [ ] QA passed
- [ ] QA passed with non-blocking notes
- [ ] QA blocked
- [ ] QA failed

Fields:

- **Reviewer**:
- **Date**:
- **Environment**: owner-local only
- **Notes**:
- **Blocker summary**:
