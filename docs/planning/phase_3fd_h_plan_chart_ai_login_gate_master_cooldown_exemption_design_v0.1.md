# Phase 3FD-H-PLAN Chart AI Login Gate and Master Cooldown Exemption Design

## 1. Purpose

This is a documentation-only design for a future Chart AI login gate and master cooldown exemption.
This phase makes no UI source change, route source change, runtime source change, or auth change;
there is no auth implementation. It creates no Supabase client, makes no database connection, reads
no environment value, parses no cookie, header, session, or JWT, and executes no migration. There is
no KIS/LLM/API call, dependency or lockfile change, deployment, or push.

## 2. Background

Phase 3FD-G implemented mocked-only trigger UX for Similar Pattern Analysis and MK AI Analysis.
Phase 3FD-G-HF1 added independent five-minute client-side cooldowns after successful analysis. The
countdown works as intended: the result remains visible, the trigger stays disabled, and the trigger
is restored after expiry. The owner now wants `/chart-ai` to require login like Portfolio and wants
a master account to bypass the cooldown. The existing client cooldown remains UX friction only;
real KIS and LLM protection still requires later server-side controls.

## 3. Product Decisions

- `/chart-ai` is accessible only to authenticated users.
- Anonymous users see a login-required screen or card instead of the Chart AI body.
- The login-required presentation aligns with the existing Portfolio visual pattern.
- Authenticated normal users retain the five-minute analysis cooldown.
- Authenticated master users bypass the analysis cooldown.
- Master identification is derived by a server-side or trusted-runtime responsibility.
- Raw master identifiers are never committed or exposed to client-side code.
- This phase does not implement real or mocked auth behavior.

## 4. Sensitive Identifier Policy

- Do not commit a raw master email.
- Do not commit a raw master UID.
- Do not expose master identifiers in the client bundle.
- Do not perform a client-side string comparison against an email or UID.
- Documentation may use only `MASTER_USER_ID`, `MASTER_EMAIL`, `isMasterUser`, and
  `serverResolvedMaster` placeholders.
- The preferred production rule is for a server or trusted layer to resolve `isMasterUser`.
- The client may receive only a safe boolean capability, never raw master identifiers.
- If a later implementation uses environment variables, only variable names may be committed;
  values must remain outside source control and client-visible output.
- If a later role-assignment table is approved, documentation may name conceptual fields but must
  not include real identifiers.
- Authorization must not depend on client-supplied or user-editable profile metadata.

## 5. Login Gate UX Model

### Anonymous behavior

- Show a login-required screen or card.
- Hide Chart AI search, chart, sidebar, analysis workspace, and analysis buttons.
- Do not execute analysis triggers or start cooldowns.
- Make no API, LLM, or KIS call.
- Do not expose owner-local panels unless a separate phase explicitly approves a local-only
  development exception.

Future Korean product-copy examples:

- `접속 필요`
- `로그인이 필요합니다`
- `회원가입 또는 로그인 후 Chart AI 분석 기능을 사용할 수 있습니다.`
- `회원가입 / 로그인`

### Authenticated behavior

- Show the full Chart AI page.
- Allow the Similar Pattern trigger.
- Allow the MK AI trigger after Similar Pattern succeeds.
- Keep the five-minute cooldown for normal users.
- Bypass the cooldown for master users.

## 6. Portfolio Alignment

The inspected reference is `src/pages/portfolio.astro`. Chart AI should reuse the Portfolio page's
login-required visual pattern where practical: a dedicated lock state, concise access explanation,
hidden application body, and a CTA using the existing project navigation and auth pattern. No code
is copied in this phase. The later implementation should avoid creating a visually inconsistent
second login-gate design.

## 7. Master Cooldown Exemption Policy

For an authenticated normal user:

- Start a five-minute cooldown after each successful analysis.
- Keep the countdown visible.
- Keep the result visible.
- Disable the corresponding trigger during cooldown.

For an authenticated master user:

- Do not start a cooldown after success.
- Do not display a countdown.
- Re-enable the trigger immediately after success.
- Keep the result visible.
- Preserve duplicate protection during loading.
- Preserve the MK AI prerequisite rule.

The master bypass applies only to client cooldown UX in the proposed mocked implementation.
Production must still enforce hard safety caps and audit logs for every role, including master.

## 8. Role and Capability Model

Conceptual fields:

- `authState`: `anonymous` | `authenticated`
- `role`: `user` | `master`
- `capabilities.canAccessChartAi`
- `capabilities.canBypassAnalysisCooldown`
- `capabilities.canRunSimilarPattern`
- `capabilities.canRunMkAi`
- `cooldownPolicy.enabled`
- `cooldownPolicy.durationMs`

Capability decisions:

- Anonymous: `canAccessChartAi = false`.
- Normal authenticated user: `canAccessChartAi = true` and
  `canBypassAnalysisCooldown = false`.
- Master: `canAccessChartAi = true` and `canBypassAnalysisCooldown = true`.

The role and capability object is conceptual. It is not implemented or persisted in this phase.

## 9. Mocked-only Implementation Option

A safe next Phase 3FD-H implementation may be `/chart-ai` UI-only with no real auth:

- Default to an authenticated normal user.
- Use `?chartAiMockLoggedOut=1` to show the login-required page.
- Use `?chartAiMockMaster=1` to simulate an authenticated master with cooldown bypass.
- Do not use raw master identifiers.
- Do not call Supabase or read cookies, sessions, JWTs, or environment values.
- Do not call a route, API, LLM, or KIS provider.
- Do not claim server-side protection.

This option safely validates the UX before real auth integration while preserving the current
project boundary.

## 10. Real-auth Implementation Option

A future option requires separate approval. That phase may reuse the existing auth mechanism used by
Portfolio where appropriate. A server or trusted runtime must resolve authenticated state and master
role, then pass only safe booleans or capabilities to the client. Raw master identifiers must never
enter the client bundle. Any stored authorization role must come from a trusted source rather than
user-editable metadata. Server-side rate limits, identical-request cache reuse, usage quotas, hard
caps, and audit logs are required before KIS or LLM activation.

This option is not approved in Phase 3FD-H-PLAN.

## 11. Server-side Protection Requirement

A client cooldown can reduce accidental repeated clicks only. It cannot protect against reloads,
direct API calls, multiple browsers, automation, or client tampering. Before real KIS or LLM
activation, the system must design and implement:

- Account-level server-side rate limits.
- Function-level cooldowns.
- Usage quotas.
- Identical-request cache reuse.
- Cost guards and hard caps.
- Abuse detection.
- Provider-failure and backoff handling.
- Audit logging.

These controls apply independently of the client-visible master cooldown exemption.

## 12. Next Implementation Boundary

The recommended next phase may modify `/chart-ai` only. It may add a mocked login-required page
state using the Portfolio visual pattern, add `chartAiMockMaster=1`, and retain
`chartAiMockLoggedOut=1`. A normal mocked user keeps the cooldown; a mocked master bypasses it.
The phase may not add real auth, raw master identifiers, route or runtime changes, API or LLM calls,
database or Supabase access, live KIS access, actual server-side usage limiting, persistence,
dependency changes, deployment, or push.

## 13. Recommended Next Phase

Recommended: **Phase 3FD-H — Chart AI Login Gate and Master Cooldown Exemption Mocked-only UI Implementation**.

Alternative: **Phase 3FD-H-HF1 — Login Gate/Master Exemption Design Revisions, No Runtime Change**.

Hold: **Phase 3FD-B-HF1 — Real Supabase Client Factory Approval Package, No Runtime Change**.
