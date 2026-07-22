# Phase 3FD-A Auth Redaction and Subject Mapping Policy

## 1. Purpose

This document defines the redaction and subject mapping rules that a future real Supabase Auth
implementation phase must follow. No runtime code is added in this phase.

## 2. Forbidden Outputs

The following must never appear in any route response, log, or documentation output, in this phase
or any future implementation phase:

- Access token.
- Refresh token.
- JWT (raw or decoded).
- Raw session object.
- Raw Supabase user object.
- Raw Supabase user id, when exposed directly to a non-owner client caller.
- Email address.
- Phone number.
- OAuth provider metadata (raw claims, provider tokens).
- Cookie value.
- Authorization header value.
- Environment variable value.
- Secret key value.
- Service role key value.

## 3. Allowed Safe Outputs

- Auth state bucket (`anonymous` / `authenticated`, per the existing Phase 3FC-C contract).
- Role seed (`anonymous` / `authenticated`; `beta`/`owner`/`admin` come only from the Phase 3FC-D
  role assignment resolver, never from the session itself).
- Internal subject reference (`SimilarityAuthSubjectSafeRef`).
- Provider kind (for example, the literal string `"supabase"`), not raw provider claims.
- Redacted error category (for example, `invalid_context`, `disabled`), not a raw error message or
  stack trace.
- Safe warnings (for example, `client_claim_ignored`).

## 4. Subject Ref Design

- The subject reference must be stable enough to be used as a lookup key for role assignment and
  usage store queries.
- The subject reference must not reveal the raw Supabase user id in any client-facing route
  response.
- A future database layer may store a server-side mapping between the Supabase user id and an
  internal identifier, if a future phase explicitly designs and approves that mapping.
- No subject reference should ever be printed in public-facing UI.

## 5. Error Redaction

- Raw Supabase errors must be mapped to a safe, generic category before reaching the client.
- Stack traces must never be returned to the client.
- Environment or configuration errors must never reveal a key value, only that configuration is
  incomplete or the runtime is disabled.
- Auth failures must not reveal whether a given email address exists in the system (no
  user-enumeration signal).

## 6. Test Requirements

For the future implementation phase:

- A serialized-result scan confirming no forbidden field (Section 2) appears anywhere in a route
  response object.
- A fixture-based auth smoke exercised against mocked session candidates only.
- A route response scan across every guarded branch outcome (success, disabled, anonymous,
  invalid_context, blocked).
- An explicit assertion that no token or raw session value is ever echoed.
- An explicit assertion that no environment value is ever echoed.
