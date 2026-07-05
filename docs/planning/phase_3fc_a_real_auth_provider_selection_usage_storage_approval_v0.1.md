# Phase 3FC-A — Real Auth Provider Selection and Usage Storage Approval

## 1. Status

Prepared for owner decision. No runtime source was changed. No real auth is implemented. No usage
storage is implemented. Live KIS remains off and unreferenced. No deploy, no push. This document,
its companion decision matrix, and the owner approval form together form a decision package the
owner can approve, revise, or reject before any real implementation phase begins.

## 2. Background

- Phase 3FB-C-ALT added a route-level bridge that evaluates the existing
  `evaluateSimilarityExecutionGuard` against caller-supplied **mock** auth/usage state.
- Phase 3FB-E exposed that bridge through a local-only, explicit opt-in `/chart-ai` panel.
- Phase 3FB-F documented a manual QA checklist and a productization boundary review, and concluded
  that the next productization blocker is not more mocked UI wiring but an explicit owner decision
  on real auth strategy, usage storage, role/limit policy, persistence fields, and release gates.
- This phase (3FC-A) is that decision-preparation step. It does not implement anything; it lays out
  options, a recommended default, and the exact approvals needed before Phase 3FC-B (or equivalent)
  can start writing real auth/usage runtime code.
- Live KIS connectivity remains a separate, externally blocked condition and is out of scope here.

## 3. Current Runtime Boundary

- `POST /api/chart-ai/similarity` defaults to a sanitized `feature_disabled` response (503) for any
  request that isn't one of the two existing explicit owner-local request shapes.
- The `owner-local-mocked` and `owner-local-auth-usage-bridge` branches are explicit, local/dev-only
  paths reachable only via caller-supplied request bodies; neither is reachable through normal
  public navigation.
- No public or beta execution path exists.
- No real authentication or session exists anywhere in this codebase.
- No usage persistence (counters, logs, or otherwise) exists anywhere in this codebase.
- No live market data is read; `runMockedProviderCompatibleSimilarityIntegration` only ever
  consumes deterministic, provider-compatible mocked bars.
- `buildDefaultSimilarityExecutionGuardPolicy()` (`similarityExecutionGuardPolicy.ts`, Phase 3EY-C)
  already declares candidate feature flag names and default limit values
  (`CHART_AI_SIMILARITY_EXECUTION_ENABLED`, `defaultDailyLimit: 3`, `betaDailyLimit: 10`,
  `ownerDailyLimit: 50`, `adminDailyLimit: 100`) with `enabled: false` — no flag value is read from
  the environment anywhere; these are declared defaults only, awaiting later wiring.

## 4. Auth Strategy Options

| Option | Summary | Fit for Astro/Vercel app | Implementation complexity | Operational burden | Data ownership | Vendor lock-in | Security considerations | Recommended use case | Decision status |
|---|---|---|---|---|---|---|---|---|---|
| App-native account/auth layer | Hand-rolled email/password or magic-link auth stored in the app's own database | Good — no extra platform dependency, but requires building session handling from scratch | High — password hashing, session/token handling, reset flows all owned by the team | High — team owns all security-critical code long-term | Full ownership | None | Highest risk if built incorrectly (session fixation, password storage, CSRF) | Teams wanting full control and no external dependency, willing to invest in security review | Awaiting owner decision |
| Supabase Auth | Managed auth service bundled with a Postgres database, supports email/password, magic link, OAuth | Good — pairs naturally with a Postgres-backed usage store in the same project | Medium — SDK integration, session/cookie wiring, but core auth logic is managed | Low-to-medium — Supabase manages the auth backend | Shared with Supabase | Medium — tied to Supabase project | Lower risk than app-native for core auth primitives; still need correct session/token handling in the app | Teams wanting integrated auth + DB usage storage under one provider | Awaiting owner decision |
| Auth.js / NextAuth-style adapter | Framework-agnostic auth library with pluggable providers and session strategies | Medium — Auth.js is primarily documented for Next.js; an Astro integration is possible but less standard | Medium-to-high — adapter/integration work for a non-Next.js framework | Medium — library-level, but the team still configures and maintains adapters | App-controlled, provider-dependent for OAuth data | Low-to-medium, depends on chosen providers | Depends on correct adapter configuration; well-trodden patterns exist for Next.js, less so for Astro | Teams already committed to this ecosystem or wanting maximum provider flexibility | Awaiting owner decision |
| Managed identity provider (e.g. Auth0/Clerk-style) | Third-party hosted identity platform handling sign-up/sign-in/session entirely outside the app | Good for fast rollout, adds an external dependency on the platform's Astro/JS SDK support | Low-to-medium — mostly SDK integration and route protection | Low — provider manages the identity backend | External, provider holds user identity data | High — full identity data lives with the vendor | Teams wanting the fastest path to production-grade auth UX, accepting higher vendor dependency | Awaiting owner decision |
| Temporary invite-code / beta-access gate | A single shared or per-user invite code checked server-side, no real identity system | Very good — trivial to build, no external dependency | Low — a code check plus a signed cookie/session marker | Low | Full ownership, minimal data | None | Not real authentication; does not identify a return user across devices; suitable only as a stopgap | Short-term beta gating before a real auth strategy is chosen | Awaiting owner decision |

## 5. Usage Storage Options

| Option | Summary | Persistence level | Multi-instance safety | Abuse-prevention suitability | Implementation complexity | Operational burden | Recommended use case | Decision status |
|---|---|---|---|---|---|---|---|---|
| In-memory only | Counters held in process memory | None — lost on restart/redeploy | Unsafe — each serverless instance has its own counter | Not suitable for enforcement | Very low | None | Local development/demo only; **not acceptable for public/beta usage enforcement** | Awaiting owner decision |
| Local file | Counters written to a file on disk | Survives process restart on the same machine only | Unsafe on serverless/multi-instance platforms | Not suitable for enforcement | Low | Low | Single-machine local development only; **not acceptable for public/beta usage enforcement** | Awaiting owner decision |
| Vercel KV / Redis-style store | Shared key-value store with atomic increment support | Persistent, shared across instances | Safe with atomic increment operations | Good — well suited to rate/usage counters | Medium | Low-to-medium — managed service | Public/beta usage enforcement where a lightweight, fast counter store is preferred | Awaiting owner decision |
| Postgres/Supabase table | Relational table(s) tracking usage counters and/or events | Persistent, shared, transactional | Safe with proper transactions/row locking | Good, plus supports rich querying/auditing | Medium | Low-to-medium if already using Supabase | Public/beta usage enforcement when combined with Supabase Auth or another relational auth store | Awaiting owner decision |
| Existing app database (if later introduced) | Reuses whatever primary database the app adopts later | Persistent, shared | Depends on chosen database | Good, same as above | Depends on database choice | Depends on database choice | If/when the app adopts a general-purpose database for other features | Awaiting owner decision |
| Hybrid audit-log + counter table | A fast counter table for enforcement plus an append-only event log for audit/debugging | Persistent, shared | Safe with proper transactions | Best — supports both enforcement and after-the-fact review | Medium-to-high | Medium | Teams wanting both real-time enforcement and a durable audit trail | Awaiting owner decision |

**Constraint, not a preference**: in-memory and local-file storage are not acceptable for any
public or beta usage enforcement, because neither is safe across multiple serverless instances or
survives a redeploy. A persistent, shared store is required before public/beta exposure.

## 6. Recommended Initial Architecture

This is a recommended default, not a final decision — owner approval is required before any of it
is implemented.

- **Auth**: if the project wants an integrated auth + database story with the least new
  infrastructure to operate, **Supabase Auth** is the recommended default, since a Postgres-backed
  usage store can live in the same project. If the project instead wants maximum control and the
  fewest external dependencies, **app-native auth** is the recommended alternative, accepting the
  higher build/security burden. A managed identity provider is recommended only if the owner
  explicitly prioritizes fastest user-management UX over vendor independence.
- **Usage storage**: a persistent, shared store — either a Postgres/Supabase table (if Supabase
  Auth is chosen) or a Vercel KV/Redis-style counter store (if a lighter-weight option is
  preferred) — is recommended over in-memory/local-file storage for any public/beta path.
- **Route guard**: keep `CHART_AI_SIMILARITY_EXECUTION_ENABLED` (and related flags) off by default;
  no change to the existing `feature_disabled` default behavior until explicitly approved.
- **Execution**: keep mocked-only execution, or keep live KIS disabled, until KIS connectivity is
  separately resolved outside this phase's scope.
- **Public/beta exposure**: remains blocked until the owner explicitly approves auth strategy,
  usage storage strategy, role/limit policy, persistence fields, and feature flags (Section 11).

## 7. Proposed Role Tiers and Usage Limits

Numbers below are proposal candidates carried over from the existing
`buildDefaultSimilarityExecutionGuardPolicy()` defaults (Phase 3EY-C) where available, plus
proposed extensions — none are final until the owner approves them via the approval form.

| Tier | Allowed access today | Proposed beta access | Suggested daily limit | Suggested monthly limit | Notes | Owner approval required |
|---|---|---|---|---|---|---|
| anonymous | None (default route is `feature_disabled`) | Mocked preview only, no real execution | 0 | 0 | Matches `allowAnonymousMockedPreview` intent without granting real usage | Yes |
| authenticated | None | Limited real execution once auth/usage exist | 3/day (matches existing `defaultDailyLimit`) | ~30/month (proposed, not in existing policy) | Existing default policy already proposes 3/day for this tier | Yes |
| beta | None | Broader real execution during a beta program | 10/day (matches existing `betaDailyLimit`) | ~150/month (proposed, not in existing policy) | Existing default policy already proposes 10/day for this tier | Yes |
| owner | Local-only mocked/bridge panels today | Full internal access | 50/day (matches existing `ownerDailyLimit`) | High or bypass with audit (proposed) | Existing default policy already proposes 50/day for this tier | Yes |
| admin | Local-only mocked/bridge panels today | Full internal access | 100/day (matches existing `adminDailyLimit`) | High or bypass with audit (proposed) | Existing default policy already proposes 100/day for this tier | Yes |

## 8. Data Model Proposal

Conceptual only — no SQL, no migrations, no schema implementation in this phase.

- **`auth_subjects`** (or reuse whatever the chosen auth provider stores)
  - Required: stable subject id, role/tier assignment, created-at timestamp.
  - Optional: display name, email (if the chosen auth provider requires it for login).
  - Do not store: passwords in plaintext, raw OAuth provider tokens beyond what the provider's own
    secure storage mechanism requires, KIS credentials.
- **`usage_counters`**
  - Required: subject id (or anonymous bucket key), window (`daily`/`monthly`), used count, limit,
    window reset timestamp.
  - Optional: last-execution timestamp.
  - Do not store: raw request payload, raw response payload, OHLC values, similarity scores.
- **`usage_events`** (audit log, optional depending on chosen storage option)
  - Required: subject id (or anonymous bucket key), event timestamp, guard status/result
    (`allowed`/`blocked`/`auth_required`/`usage_limited`), route/feature identifier.
  - Optional: symbol/asset type requested (bucketed/sanitized, not raw provider payload).
  - Do not store: KIS credentials, raw provider payload, access/refresh tokens, trading/account
    data, unnecessary IP address or user-agent unless a separate legal/security review approves it.
- **`feature_flags`**
  - Required: flag name, boolean value, last-changed timestamp, changed-by identifier.
  - Do not store: secret values (flags are booleans/names only, not credentials).
- **`role_assignments`**
  - Required: subject id, assigned role/tier, assigned-at timestamp.
  - Do not store: any field not needed to determine the subject's tier.

General do-not-store list across all entities: KIS credentials, raw provider payload, raw OHLC
values (unless a separate future phase explicitly approves storing them for a different purpose),
trading/account/order/balance data, access/refresh tokens in app-owned tables (unless the chosen
provider's own secure storage mechanism is used as designed), and unnecessary IP/user-agent data
absent an explicit legal/security approval.

## 9. Route Integration Plan

Documentation of a future implementation sequence only — no code is written in this phase.

1. Add a real auth subject resolver (reads the chosen provider's session/identity, not a mock
   value) to replace the caller-supplied `mockAuth` shape used by the Phase 3FB-C-ALT bridge.
2. Add a real usage snapshot loader that reads the chosen persistent store, replacing the
   caller-supplied `mockUsage` shape.
3. Add a usage increment transaction that runs only after a successful, guard-allowed execution.
4. Keep the default route response at `feature_disabled` until the owner explicitly approves
   flipping any release gate.
5. Reuse the existing `evaluateSimilarityExecutionGuard` unchanged — no new guard logic is required
   for this transition; only its inputs change from mock to real.
6. Keep live KIS off until KIS network reachability is separately resolved and approved.
7. Preserve the existing sanitized response contract (`data`/`error` shapes) so the UI panels built
   in Phase 3FB-E do not require a rewrite, only a swap from mock-scenario buttons to a real
   session-driven single execution flow.
8. Add new smoke tests and static checkers for the real auth/usage runtime before any public/beta
   exposure is enabled, mirroring the existing 3FB-series checker/smoke pattern.

## 10. Feature Flag and Release Gates

Proposed flag names only — no environment variables are added, read, or modified in this phase.

| Flag name | Purpose | Default |
|---|---|---|
| `AUTH_RUNTIME_ENABLED` | Gates whether the real auth subject resolver is used instead of mock auth | `false` |
| `USAGE_STORAGE_ENABLED` | Gates whether the real usage store is read/written instead of mock usage | `false` |
| `CHART_AI_SIMILARITY_BETA_ENABLED` | Gates beta-tier real execution | `false` |
| `CHART_AI_SIMILARITY_PUBLIC_ENABLED` | Gates public real execution | `false` |
| `LIVE_KIS_OHLC_ENABLED` | Separate, pre-existing concern for live KIS connectivity — remains unrelated to and independent from the auth/usage flags above | `false` |

All flags default to `false`. `CHART_AI_SIMILARITY_PUBLIC_ENABLED` must not be set to `true` unless
real auth, real usage storage, legal/disclaimer review, and abuse-prevention policy are all
complete and the owner has explicitly approved public exposure. `LIVE_KIS_OHLC_ENABLED` remains a
separate concern tracked outside this auth/usage decision package.

## 11. Go/No-Go for Next Implementation Phase

**GO for the next implementation phase:**
- Owner has chosen an auth strategy (Section 4 / approval form Section 1).
- Owner has chosen a usage storage strategy (Section 5 / approval form Section 2).
- Owner has approved an initial role/limit table (Section 7 / approval form Section 3).
- Owner has approved which fields may be persisted (Section 8 / approval form Section 4).
- Owner confirms no live KIS connectivity is needed for the next implementation phase (auth/usage
  runtime can be built and tested entirely against mocked or disabled KIS execution).

**NO-GO:**
- Owner has not chosen an auth provider/strategy.
- No usage storage decision has been made.
- No role/limit policy has been approved.
- Any request to make the route public without both real auth and real usage storage in place.
- Any request to connect live KIS while network reachability remains unresolved.

## 12. Open Questions for Owner

1. Which auth strategy do you want to approve first: app-native, Supabase Auth, an Auth.js-style
   adapter, a managed identity provider, or a temporary invite-code gate?
2. Is there an existing user table or app-wide auth strategy already planned elsewhere in this
   project that this feature should align with, rather than choosing independently?
3. Should beta access be invite-only, or open to any authenticated user?
4. Should anonymous users be blocked entirely from any execution (including mocked preview), or is
   a limited anonymous mocked preview acceptable?
5. Are the proposed daily/monthly limits in Section 7 acceptable, or do you want different numbers?
6. What timezone should usage windows reset in (UTC, KST, or another)?
7. Should owner/admin roles bypass usage limits entirely, or only receive a much higher limit with
   full audit logging?
8. What usage events, if any, must be logged for audit purposes (every request, only
   blocked/allowed transitions, or none beyond the counter itself)?
9. Is Supabase, or any other specific database, already approved or in use elsewhere in this
   project that this feature should reuse rather than introduce a new dependency?
10. Should the existing owner-local verification panels (`?ownerLocalMocked=1`,
    `?ownerLocalAuthUsageBridge=1`) remain in the codebase (still gated/hidden) after real
    auth/usage exists, or should they be removed before any public deployment?
11. When do you expect the separate live KIS connectivity track to resume, and should the real
    auth/usage runtime be built to support KIS-off operation indefinitely if that track stalls?
12. Do you want a legal/disclaimer review scheduled before or after the real auth/usage runtime is
    built, given that public exposure cannot happen without it either way?

## 13. Recommended Next Phase

Phase 3FC-B — Real Auth/Usage Runtime Design Finalization from Owner Decisions, No Live KIS.

Alternative: Phase 3FB-G — Owner Manual QA Findings Incorporation, Live KIS Off (if the owner has
not yet completed the Phase 3FB-F manual QA checklist and wants to close that loop first).
