# PR #1 — Final Title & Body — Draft v0.1 (NOT applied)

Draft only. `PR_METADATA_MUTATION_AUTHORIZED: NO` this phase — do not apply until Owner authorization. Current
PR title (`chore: add rebuild planning and safety baseline`) is stale; the body is empty. Supersedes
`pr_1_proposed_title_and_body_v0.1.md` (written at 394 commits); this draft reflects HEAD `ab176e4`
(403 commits, includes HF2A2/HF2A3/HF2B/HF2B-HF1).

## Proposed title

```
MK Stock Lab rebuild → main: Production-grade Chart AI + KIS-only instrument-master automation
```

## Proposed body

```markdown
## Summary
First merge of the full MK Stock Lab rebuild from `rebuild/phase-1-ia-shell` into `main` (403 commits ahead,
0 behind; merge simulation is conflict-free). `main` was not advanced during the rebuild — prior Production
deploys were made from this branch. This PR brings the accumulated application plus the KIS-only
instrument-master automation to `main`.

⚠️ Merging this PR triggers an automatic Vercel Production deploy. See the pre-merge checklist before merging.

## Major product changes
- **Chart AI** (`/chart-ai`, login-gated): universal instrument search (KR/US, exact-code priority,
  filters, load-more), explicit real OHLCV chart loading with selected-symbol integrity (no hidden
  defaults, no analysis before an accepted real chart), Similarity V2 (real deterministic scoring +
  interactive overlay: crosshair/D+, structured tooltip, single responsive Top-5, absolute score guide +
  candidate percentile, deterministic non-advisory insight), MK Analysis (deterministic, explicit-action),
  and a Market Intelligence backend.
- **Data foundation**: KIS-only universal instrument master (KR/US stocks + ETFs), KR alphanumeric
  six-character symbol support (`^[0-9A-Z]{6}$`), normalized OHLCV cache with per-identity/mode keys and
  request coalescing.
- **Instrument-master automation**: scheduled GitHub Actions refresh (KIS-only sources) that opens/updates a
  single PR to `main` and never merges, force-pushes, deploys, or mutates env.

## Chart AI & KIS scope
- Read-only market data only. KIS is **quote-only**: no account/order/balance/funds/trading endpoint;
  endpoint allowlist + fail-closed classification (order category → forbidden, unlisted → not-allowlisted,
  rate-limited, raw payloads never exposed).
- Durable KIS token lifecycle (L1 process memory → L2 Supabase durable store → distributed lease) behind
  `KIS_DURABLE_TOKEN_ENABLED`; single-issuance safeguards; emergency refresh disabled by default;
  durable-but-misconfigured fails closed.

## Authentication & security boundaries
- `/chart-ai` requires a Supabase session; signed-out shows the lock state with **zero** provider/API
  requests. API routes enforce their own auth and fail closed (401) regardless of markup visibility.
- Same-origin authenticated fetch; protected-Preview guard is VERCEL_ENV-authoritative (Preview beta behind
  flag + `?chartAiBetaPreview=1`); Production fail-closed except the existing scoped Production-beta
  contract. Server-only provider/secret modules never reach the client bundle (SSR frontmatter only).

## Instrument-master automation
- Branch `automation/kis-instrument-master-refresh`; schedules KR `17 13 * * 1-5`, US `23 2 * * 2-6`, weekly
  reconciliation `41 13 * * 6`; minimal permissions (`contents` + `pull-requests` write); concurrency-guarded;
  validation before PR creation; last-known-good retention; no credential/token/raw-payload output.

## Database / migration status
- Migrations are additive (no destructive step). KIS-token migrations (`20260713`, `20260714`) are
  dormant-safe behind the fail-closed durable-token flag (already applied + verified in production per prior
  activation). Base-schema migrations (`20260615`, `20260621`, `20260625`) are additive; confirm they are
  applied to the production Supabase before merge (see checklist). `draft_3fd_c_…_not_executed.sql` stays
  unexecuted by design.

## Testing & Preview verification
- Current-contract active gates green; `astro build` + `npm ls` + `git diff --check` clean. Retained
  historical/superseded phase checkers are non-gating (documented). Owner authenticated protected-Preview QA
  PASS for the current runtime: HF2B-HF1 functional (real chart + Similarity, HTTP 200, single request each)
  and HF2B full visual/interaction (overlay, tooltip, single Top-5, score guide, insight, mobile 390px,
  touch, keyboard).

## Deployment implications
- Merging `main` auto-deploys to Vercel Production. Confirm DB migration state + green CI + clean review
  threads first. Rollback = promote the previous READY Production deployment.

## Known limitations
- Full production QA occurs post-merge (a separate Owner step). Historical per-phase checkers remain red by
  design (working-tree-scope freezes on a long-lived branch) and are excluded from the authoritative active
  gates.
```

## Notes for the Owner (not part of the PR body)

- Do not enable auto-merge. Merge is a deliberate action after the pre-merge checklist.
- After merge, the instrument-master workflow starts firing on schedule from `main`; its first run only opens
  a PR — review before merging that PR.
