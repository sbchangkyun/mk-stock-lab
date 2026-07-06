# Phase 3FD-H-PLAN — Chart AI Login Gate and Master Cooldown Exemption Design Result

## 1. Status

Prepared as documentation-only work. No UI, route, runtime, or auth implementation source changed.
No Supabase client was created, no database was connected, and no environment value was read. No
cookie, header, session, or JWT was parsed; no migration was executed; and no KIS, LLM, or API call
was made. No raw master identifier was committed. No package was installed, dependency or lockfile
changed, deployment performed, or push made.

## 2. Implemented Scope

- One consolidated Chart AI login-gate and master cooldown exemption design plan.
- This result document.
- One narrow static checker.
- A planning changelog entry.
- One package checker script.

## 3. Design Result

The plan defines a Chart AI login-required policy aligned with the inspected Portfolio lock-state
pattern. Anonymous users see a login-required card instead of the Chart AI body. Authenticated
normal users retain the five-minute cooldown, while a master user may bypass only that client-side
cooldown UX. A strict sensitive-identifier policy keeps raw account identifiers out of committed and
client-visible source. The recommended next option is mocked-only UI work; real-auth integration
requires separate approval. Server-side rate limits, cache reuse, quotas, abuse controls, hard cost
guards, backoff, and audit logging remain mandatory before real KIS or LLM activation.

## 4. Boundary Preservation

- `/chart-ai` and `src/pages/portfolio.astro` are unchanged.
- The route, server runtime, providers, deterministic engine, and data are unchanged.
- Supabase and migration source are unchanged.
- No database was connected and no Supabase client was created.
- No environment value was read and no auth, cookie, header, session, or JWT parsing occurred.
- No API, LLM, or live KIS call occurred.
- No package was installed; no dependency or lockfile changed.
- No deployment or push occurred.

## 5. Validation

- Phase 3FD-H-PLAN narrow checker: passed (130/130), including generic email and UUID literal checks.
- Phase 3FD-G-HF1, Phase 3FD-G, Phase 3FD-G-PLAN, Phase 3FD-F, and Phase 3FD-F-PLAN
  checkers: passed (144/144, 126/126, 97/97, 102/102, and 104/104).
- Phase 3FD-E checker and smoke: passed (154/154 and 118/118).
- `npm run build`: passed.
- `git diff --check`: passed; line-ending notices, if emitted, are non-gating working-copy warnings.
- Changed-file boundary: exactly the five approved Phase 3FD-H-PLAN files.
- Forbidden page, route, runtime, provider, engine, data, Supabase, and lockfile diff: empty.

## 6. Recommended Next Phase

Recommended: **Phase 3FD-H — Chart AI Login Gate and Master Cooldown Exemption Mocked-only UI Implementation**.

Alternative: **Phase 3FD-H-HF1 — Login Gate/Master Exemption Design Revisions, No Runtime Change**.

Hold: **Phase 3FD-B-HF1 — Real Supabase Client Factory Approval Package, No Runtime Change**.
