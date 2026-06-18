# Vercel Production Environment Separation Audit v0.1

## Status And Scope

This document is a Vercel production environment separation audit and owner confirmation update.

Codex did not connect to Supabase, did not run SQL, did not run a Supabase CLI command, did not run a `psql` command, did not perform production migration, did not mutate Vercel environment variables, and did not deploy in Phase 2J.3.

This audit does not authorize Phase 2K.

Phase 2K remains blocked until the exact approval phrase is provided later:

```text
I approve Phase 2K production Supabase migration execution for mk-stock-lab.
```

## Owner Confirmations Recorded

- Production target identity: confirmed.
- Real user data: none; only deletable test data may exist.
- Reset/rebuild acceptable: yes.
- Backup/restore point: not required because reset/rebuild is accepted.
- Rollback owner: owner.
- Maintenance window: not applicable.
- Production test auth user: allowed.
- Vercel env var changes excluded from Phase 2K: confirmed.
- Disposable credential in Vercel Production: unknown before this audit.

## Automated Checks Performed

| Check | Method | Result | Limitation |
|---|---|---|---|
| Repo source scan for Supabase secret markers | Exact-token `rg` scan across source, public assets, Supabase files, config, package metadata, and scripts. | No requested provider secret marker matches. Existing source references only `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` placeholder names. | Does not inspect ignored `.env*` files or remote Vercel values. |
| Generated output scan for Supabase secret markers | Exact-token `rg` scan across `.vercel/output` and generated Astro output. | No requested provider secret marker matches. | Generated output can only reflect the current local build state. |
| Disposable validation identifiers outside docs | `rg` scan for disposable project name, test email, and disposable patch file name. | No matches in source or generated output. Documentation and validation SQL contain expected planning-only references. | Does not inspect remote Vercel values. |
| `.gitignore` coverage | Inspected `.gitignore` and ran `git check-ignore` for local env, build, tool metadata, credential, certificate, and key paths. | `.env*`, `.vercel/`, `dist/`, `.astro/`, `.omc/`, credentials, certificates, and key files are ignored. | Does not prove ignored local files are absent; it confirms they are excluded from Git tracking by pattern. |
| `git status --short` | Ran `git status --short` before documentation edits. | Clean before Phase 2J.3 edits. | Final status is checked again after commit. |
| `.vercel/project.json` linked status | Checked for `.vercel/project.json` and parsed link status without printing IDs. | Not linked. | Without a linked project, Codex cannot query project-scoped Vercel env metadata. |
| Vercel CLI availability | Ran `vercel --version`. | Vercel CLI available: `54.9.1`. | CLI availability alone does not prove authentication or project linkage. |
| Vercel CLI authentication state | Attempted only read-only env metadata command with sanitized output. | Could not be usefully determined because project link is missing. | No login, token, link, pull, or write command was attempted. |
| `vercel env ls production` | Ran read-only metadata command and captured only sanitized classification. | Command failed because project linkage is required. | No env names or values were retrieved. |
| Supabase production env names in Vercel metadata | Intended to inspect read-only env-name metadata only. | Not available because Vercel project metadata could not be queried from this checkout. | Owner manual dashboard check remains required. |
| Actual env values | Not read. | Values were intentionally not accessed, printed, pulled, or stored. | Value provenance cannot be cleared automatically. |

## Vercel Production Env Separation Conclusion

Conclusion: `Not cleared; Vercel metadata unavailable`

Reason:

- The local checkout is not linked to a Vercel project through `.vercel/project.json`.
- Vercel CLI is installed, but `vercel env ls production` could not retrieve metadata without project linkage.
- No Vercel env values were read, printed, pulled, added, updated, or removed.
- Local source and generated output do not contain requested provider secret markers or disposable validation identifiers.

The remaining disposable-credential question is therefore a manual owner value-provenance check in the Vercel dashboard.

## Manual-Only Check Instructions

Owner procedure:

1. Open Vercel Project Settings.
2. Open Environment Variables.
3. Filter or inspect Production variables.
4. Look for Supabase-related variables such as `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, or similarly named project variables.
5. Confirm whether each Supabase value belongs to the production Supabase project, not the disposable validation project.
6. Do not copy values into chat.
7. Do not screenshot values.
8. Report only one of:
   - `Vercel Production has no disposable Supabase credentials.`
   - `Vercel Production may contain disposable Supabase credentials.`
   - `Vercel Production value provenance could not be verified.`

## Phase 2K Readiness Update

| Gate | Previous status | Updated status | Evidence |
|---|---|---|---|
| Production target identity | Requires owner confirmation | Confirmed | Owner confirmed production Supabase project identity outside Codex. |
| Production data state | Requires owner confirmation | Confirmed | Owner confirmed no real user data; only deletable test data may exist. |
| Reset/rebuild acceptance | Requires owner confirmation | Confirmed | Owner confirmed reset/rebuild is acceptable. |
| Backup/restore | Requires owner confirmation | Resolved for current state | Owner confirmed backup/restore point is not required because reset/rebuild risk is accepted. |
| Rollback owner | Requires owner confirmation | Confirmed | Owner is rollback owner. |
| Maintenance timing | Requires owner confirmation | Not applicable | Owner confirmed no real users, so maintenance window is not applicable. |
| Production test auth user | Requires owner confirmation | Confirmed | Owner allowed production test auth user creation. |
| Disposable credential separation | Requires owner confirmation | Not cleared | Vercel project metadata unavailable; manual value-provenance check remains. |
| Vercel env var exclusion | Ready for owner decision | Confirmed | Owner confirmed Phase 2K excludes Vercel env var changes and performs DB migration only. |
| Post-migration validation owner | Requires owner confirmation | Confirmed | Owner is treated as post-migration validation owner unless reassigned before Phase 2K. |
| Exact approval phrase | Not provided | Not provided | The exact Phase 2K approval phrase has not been given. |

## Acceleration Policy For Next Work

- Prefer larger combined work packets.
- Avoid creating a new micro-phase for every minor confirmation.
- Combine safe audit, execution preparation, validation, and documentation where possible.
- Keep hard gates only around actions that mutate production systems or expose secrets.
- Production DB mutation still requires the exact approval phrase.
- Secret-bearing checks remain manual or metadata-only.

## Remaining Blockers

- Manual Vercel Production value-provenance check remains required because automated Vercel metadata was unavailable.
- Exact Phase 2K approval phrase remains pending.

No source/generated secret marker issue, disposable identifier issue, removed-route issue, or ignored-file issue was found by the automated checks.

## Recommended Next Action

Complete the remaining manual Vercel value-provenance check, then prepare the Phase 2K execution prompt.

Next options:

- Option A: Complete remaining manual Vercel value-provenance check and then prepare Phase 2K prompt.
- Option B: Prepare a Phase 2K prompt with an explicit pre-flight stop for Vercel value-provenance verification.
- Option C: Defer production DB work and continue non-DB UI/product implementation with mock/static data only.

## References

- Vercel Environment Variables docs: https://vercel.com/docs/environment-variables
- Vercel CLI env docs: https://vercel.com/docs/cli/env
- Supabase Row Level Security docs: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Database Migrations docs: https://supabase.com/docs/guides/deployment/database-migrations

## Final Statement

Phase 2J.3 is audit-and-documentation only and authorizes no production action.
