# Phase 3FC-J Real Runtime Entry Decision Matrix

## 1. Purpose

This document helps choose the next path after the Phase 3FC-I guarded route smoke, comparing a
real Supabase/Auth/Usage approval package against additional mocked QA incorporation and a
KIS-specific reachability track. No runtime implementation occurs in this document.

## 2. Decision Options

| Option | Phase | Purpose | When to choose | Prerequisites | Risks | What remains blocked |
| --- | --- | --- | --- | --- | --- | --- |
| A | Phase 3FD-A — Real Supabase Auth Runtime Approval and Setup Package, No Runtime Change | Approve package install, env key names, Supabase project, and auth flow design | Owner is ready to move toward real runtime implementation | 3FC-H committed, 3FC-I smoke passed, 3FC-J boundary review prepared | Premature real-runtime planning without QA findings incorporated | Route success, real DB, beta/public, live KIS |
| B | Phase 3FC-K — Owner Manual QA Findings Incorporation, No Runtime Change | Incorporate manual QA findings from Section 9 of the Phase 3FC-J checklist before real runtime planning | Owner wants to run/record manual QA first | Phase 3FC-J checklist exists | Delays real runtime planning until QA is recorded | Route success, real Supabase/DB, beta/public, live KIS |
| C | Phase 3FE-A — Actual KIS Reachability Recheck, Separately Approved | Owner-local redacted network/TCP reachability check only | Owner explicitly wants to resolve KIS connectivity before real auth/DB work | Explicit separate owner approval for a KIS-specific phase | Scope creep into route/UI KIS integration if not bounded | Route/UI KIS integration, beta/public activation |
| D | Hold / stabilize documentation only | No new phase; keep current scaffold and documentation state | Owner wants to pause before committing to any of A/B/C | None beyond current state | Stalls productization progress indefinitely | Everything in Section 4 of the productization boundary review |

## 3. Recommended Path

- **Primary**: Phase 3FD-A, if the owner is ready to approve real Supabase/Auth/Usage planning.
- **Alternative**: Phase 3FC-K, if the owner wants manual QA findings incorporated first.
- **KIS-specific track**: only if the owner explicitly wants to resolve network reachability before
  real auth/DB work — this should not be bundled into Option A or Option B.

## 4. 3FD-A Entry Criteria

- Phase 3FC-H route scaffold is committed.
- Phase 3FC-I smoke passed.
- Phase 3FC-J boundary review is prepared.
- Owner accepts Supabase as the auth strategy.
- Owner approves package install planning (not the install itself).
- Owner approves environment variable key name planning only, not secret values.
- Owner confirms no live KIS work occurs within Phase 3FD-A.

## 5. 3FD-A Non-goals

- No package install unless explicitly authorized in that phase.
- No real environment variable values.
- No Supabase project secret values.
- No DB migration.
- No route success.
- No beta or public activation.
- No live KIS.

## 6. KIS Entry Criteria

- Owner explicitly approves a KIS-specific phase, separate from real Supabase/DB approval.
- Network/TCP reachability can be tested safely, owner-local only.
- No raw KIS value is printed anywhere.
- Only a local-only, redacted report is produced.
- No route/UI integration occurs as part of the reachability check.
- No beta or public route activation results from the check.

## 7. Decision Record Template

- [ ] Proceed to Phase 3FD-A
- [ ] Proceed to Phase 3FC-K
- [ ] Proceed to Phase 3FE-A
- [ ] Hold

Fields:

- **Owner decision**:
- **Date**:
- **Notes**:
- **Explicit exclusions**:
