# Phase 3FC-A Auth/Usage Decision Matrix

## 1. Decision Summary

No implementation decision made in this document is final until the owner explicitly approves it
via [phase_3fc_a_owner_approval_form_v0.1.md](phase_3fc_a_owner_approval_form_v0.1.md). This matrix
exists to compare options side by side; it does not select a winner on the owner's behalf.

## 2. Auth Options Matrix

| Option | Best Fit | Pros | Cons/Risks | Implementation Level | Recommended? | Owner Decision |
|---|---|---|---|---|---|---|
| App-native account/auth layer | Teams wanting full control, no external vendor | Full ownership, no vendor lock-in, no external data sharing | Highest security burden (password storage, session handling, CSRF, reset flows all self-built) | High | Maybe | Pending |
| Supabase Auth | Teams wanting integrated auth + Postgres usage storage in one project | Managed auth backend, pairs naturally with a Postgres usage table, supports OAuth/email/magic-link | Shared data ownership with Supabase, still requires correct app-side session/token handling | Medium | Maybe | Pending |
| Auth.js / NextAuth-style adapter | Teams wanting maximum provider flexibility | Framework-agnostic, large provider ecosystem | Documented primarily for Next.js; Astro integration is less standard and needs more adapter work | Medium-to-high | Maybe | Pending |
| Managed identity provider (Auth0/Clerk-style) | Teams wanting fastest path to production-grade auth UX | Low implementation effort, provider manages identity backend and UX | Highest vendor lock-in, identity data lives externally | Low-to-medium | Maybe | Pending |
| Temporary invite-code/beta-access gate | Short-term beta gating before a real strategy is chosen | Trivial to build, no external dependency | Not real authentication; cannot identify a returning user across devices or sessions reliably | Low | Maybe (stopgap only) | Pending |

## 3. Usage Storage Matrix

| Option | Best Fit | Pros | Cons/Risks | Public/Beta Suitability | Recommended? | Owner Decision |
|---|---|---|---|---|---|---|
| In-memory only | Local development/demo only | Trivial to implement | Lost on restart; not shared across serverless instances | Not suitable | No | Pending |
| Local file | Single-machine local development only | Simple, no external dependency | Not shared/safe across serverless instances or redeploys | Not suitable | No | Pending |
| Vercel KV/Redis-style counter | Lightweight, fast usage/rate counters | Atomic increments, persistent, shared across instances | Requires a managed KV/Redis-style service | Suitable | Maybe | Pending |
| Postgres/Supabase table | Relational usage tracking, especially alongside Supabase Auth | Persistent, transactional, supports rich queries/auditing | More setup than a pure counter store if not already using Supabase | Suitable | Maybe | Pending |
| Existing app database (if later introduced) | Reuse of a future general-purpose app database | Avoids introducing a redundant storage system | Depends entirely on what database, if any, is adopted later | Depends | Maybe | Pending |
| Hybrid audit-log + counter table | Teams wanting both enforcement and durable audit trail | Best of both: fast enforcement plus queryable history | Higher implementation/operational complexity | Suitable | Maybe | Pending |

## 4. Initial Recommendation

- **Fastest controlled beta**: a managed or integrated auth option (Supabase Auth or a managed
  identity provider) paired with a persistent usage store (Supabase table or Vercel KV/Redis-style
  counter) gets to a working beta gate with the least new infrastructure to operate.
- **Maximum control**: app-native auth paired with Postgres-style usage tables gives full ownership
  of both identity and usage data, at the cost of higher build and security review effort.
- **Do not use in-memory or local-file storage for any public/beta usage enforcement** — neither
  survives a redeploy or is safe across multiple serverless instances.
- **Keep live KIS entirely separate** from this decision; it is tracked and resolved independently
  and has no bearing on which auth/usage strategy is chosen.

## 5. Decision Needed Before Coding

- Auth strategy (Section 2 above).
- Usage storage strategy (Section 3 above).
- Role/usage limits per tier (see main decision doc Section 7).
- Feature flags and their default/gating rules (see main decision doc Section 10).
- Which fields may be persisted, and which must never be persisted (see main decision doc
  Section 8).
- Scope of legal/disclaimer review required before any public-facing exposure.
- Beta user policy: invite-only vs. open signup, and whether anonymous users get any access at all.
