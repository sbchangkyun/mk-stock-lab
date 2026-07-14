# Phase 3GG-T-HF3B-HF2 — PR #1 Pre-Merge Audit — Result v0.1

> Evidence tags: **[FACT]** measured this audit · **[REPO]** repository evidence · **[TEST]** test result ·
> **[INFER]** inference · **[OWNER]** owner confirmation required · **[BLOCK]** blocker ·
> **[OBS]** non-blocking observation. Audit-only: no push, no PR mutation, no merge, no deploy, no
> DB/env/Supabase/Vercel/secret change, no application behavior change.

## 1. Executive classification

**`PASS_PR_PREMERGE_AUDIT_READY_WITH_REQUIRED_PREMERGE_ACTIONS`**

The final merged tree is intentional, safe, conflict-free, builds, and passes every local gate. No secrets,
no unsafe/unrelated content, no destructive/auto-applied migrations, and a safe workflow. Merge is **not**
blocked by the PR content. Before merge authorization, a small set of clearly-actionable items must be
resolved — chiefly **confirming/controlling Vercel auto-deploy behavior on `main`** (unprovable from the
repo), updating the stale PR title/empty body, and an optional one-byte cleanup. None require redesigning
the branch or a release-branch rebuild.

## 2. Local & remote baseline

- Local branch `rebuild/phase-1-ia-shell`; local HEAD `aa2e422`. **[FACT]**
- `origin/rebuild/phase-1-ia-shell` = **`aa2e422`** (matches local — branch fully pushed). **[FACT]**
- `origin/main` = **`672419b`** ("포트폴리오 수정"). **[FACT]**
- `git merge-base origin/main HEAD` = **`672419b`** = origin/main → **origin/main is a direct ancestor of
  HEAD; the branch has never diverged, so a merge cannot conflict.** **[FACT]**
- Uncommitted local items (untouched, unstaged): modified `.gitignore`, `.agents/`, `.claude/`,
  `.vscode/settings.json`, `docs/handoff/codex_state_inspection/`, `skills-lock.json`. **[FACT]**

## 3. PR scope summary

- **394 commits**, **1,163 files** (1,131 added / 16 deleted / 16 modified), **+455,318 / −3,242**. **[FACT]**
- The full accumulated MK Stock Lab rebuild — not only the final automation phase. **[REPO]**

## 4. File-category inventory (see `pr_1_full_scope_inventory_v0.1.md`)

| Category | Files |
|---|---|
| planning/result documentation | 474 |
| server library (`src/lib/server/**`) | 163 |
| operational scripts / tests / checkers | 351 |
| UI (components/layouts/pages/styles) | 41 |
| handoff documentation | 26 |
| API routes (`src/pages/api/**`) | 23 |
| generated app data (`src/data/**`) | 18 |
| database migrations | 6 |
| public assets | 4 |
| Supabase validation | 3 |
| GitHub Actions workflow (kis-refresh) | 1 |

- **`docs/handoff/codex_state_inspection/` is NOT in the PR** (0 files); merging does not bring it to main. **[FACT]**
- The 26 committed handoff docs are legitimate phase-handoff briefs (chart-ai-new-chat / phase-3fe-a /
  housekeeping). **[REPO]**
- No `.env`, `.vercel`, `node_modules`, `dist`, `.astro`, raw KIS `.mst`/`.cod`/`.zip`, KRX files, logs,
  coverage, or DB dumps are tracked in the PR. **[FACT]**

## 5. Commit-history inventory

- Chronological phase families across 394 commits (3GG-A … 3GG-T-HF3B-HF2), all part of the intended
  rebuild. No merge commits, reverts, or obviously misleading messages found in the sampled range. **[REPO]**
- Milestones: earliest rebuild (`origin/main`+1) → **Production functional baseline `cbd24eb`** (391 commits
  in) → `030d8fd` (verify, docs-only) → `9d22ff4` (discovery-only) → `aa2e422` (KIS automation, undeployed). **[FACT]**
- No interactive rebase is recommended: the history is coherent, phase-labelled, and carries migration/audit
  traceability. **[INFER]**

## 6. Production parity matrix

| Range | Commits | Nature |
|---|---|---|
| `origin/main..cbd24eb` | **391** | Entire rebuild deployed via `vercel deploy --prod --yes` + Owner-verified across all prior phases |
| `cbd24eb..030d8fd` | 1 | Documentation-only (HF3B-HF4C Production verify) |
| `030d8fd..9d22ff4` | 1 | Discovery-only (docs + read-only discovery scripts) |
| `9d22ff4..aa2e422` | 1 | **New KIS automation + runtime symbol widening — NOT yet Production-deployed** |

- **Critical parity fact:** all Production deployments to date were made via the Vercel **CLI from the
  unpushed feature branch**; `origin/main` (`672419b`) is an **older** state. Merging PR #1 brings the entire
  394-commit rebuild to `main` for the first time. **[FACT/INFER]**
- **Undeployed runtime deltas since the Production baseline `cbd24eb`** (30 files total; runtime-facing): KR
  symbol widening (`instrument.ts`, `kisClient.ts`, two localhost-only KIS paths) and the **16,018-row
  KIS-only master replacing the live 12,826-row master**. The KIS-only master + widened symbols have **not**
  been Production-QA'd. **[FACT]** A Production deploy after merge therefore requires separate authorization +
  Owner QA (as the HF3B-HF2 phase already stated). **[OWNER]**

## 7. Security & secret review

- Targeted high-confidence scan of the full PR diff (API keys / tokens / JWT / private keys / AWS / DB
  connection strings / service-role): **no credible secret**. The only pattern matches are documentation
  prose and a checker's own secret-scan **regex** — false positives, not secrets. **[FACT]**
- No `.env`/`.vercel`/credential-manager output tracked. No key-assignment literals. **[FACT]**
- **No blocking security finding.** **[FACT]**

## 8. Large-file & generated-data review

- Largest tracked file in the PR: `src/data/chart-ai/universalInstrumentMaster.json` ≈ **5.06 MB**
  (16,018 rows). Server-only (never shipped to the browser; §11 runtime checks confirm the page does not
  embed it). Reasonable for source control given it is the deterministic, regenerable app data master. **[TEST/INFER]**
- **[OBS]** `project_structure.txt` (≈2.15 MB, UTF-16 directory dump) is **pre-existing on `origin/main`,
  NOT introduced by this PR** — a repo-hygiene item independent of this merge, not a PR blocker.
- **[OBS→REMEDIATED]** `scripts/check_phase_3gg_t_hf3b_hf4c_fast_contract.mjs` contained **one stray NUL
  byte** at offset 7519, inside dead-fallback code (`masterVersion || '\x00zzz'`, intended `' zzz'`;
  `masterVersion` is always truthy so the fallback never executes). The checker ran correctly (191/191).
  **Remediated** in Phase 3GG-T-HF3B-HF2-HF1: the single NUL byte was replaced with the intended space
  (now 0 NUL bytes, valid UTF-8, checker still 191/191, behavior unchanged). A repo-wide NUL scan found no
  other unexpected NUL in text/source — only the pre-existing `project_structure.txt` (UTF-16, on main, not
  in the PR) and the two `public/icon-*.png` binaries. See
  `phase_3gg_t_hf3b_hf2_premerge_remediation_preview_qa_result_v0.1.md`.
- No node_modules/dist/.vercel/raw-source/logs/coverage/dumps present. **[FACT]**

## 9. Dependency review

- `package.json` adds **3 dependencies**: `d3-hierarchy@^3.1.2`, `html-to-image@^1.11.13`,
  `pretendard@^1.3.9` (Korean font). All three are present in `package-lock.json` and installed at the
  matching versions. **[FACT]**
- No git/file/link-protocol dependencies; **no `postinstall`/`preinstall`/`prepare` lifecycle scripts**;
  `npm ls --depth=0` reports no UNMET/missing/invalid/extraneous. Manifest and lockfile agree. **[TEST]**

## 10. Migration review

Six migrations relative to `origin/main`; all **additive — 0 destructive operations** (no DROP TABLE/COLUMN,
TRUNCATE, DELETE, DROP DATABASE): **[FACT]**

| Migration | Nature |
|---|---|
| `20260615_rebuild_schema_v0_1.sql` | rebuild schema foundation (81 DDL/RLS/grant stmts) |
| `20260621_market_quote_cache_lifecycle_columns.sql` | additive columns |
| `20260625_site_admins_and_settings.sql` | admins + settings + RLS |
| `20260713_kis_token_lifecycle.sql` | durable KIS token store (Owner-applied in prior phase) |
| `20260714_kis_token_postgrest_rpc_bridge.sql` | public RPC bridge (Owner-applied in prior phase) |
| `draft_3fd_c_chart_similarity_role_usage_not_executed.sql` | **draft, explicitly not executed** |

- **No workflow or package script applies migrations** — grepping `.github/workflows/` + `package.json` for
  `supabase db push`/`migrate`/`prisma` returns nothing. **Merging the SQL files is inert**; migrations apply
  only via manual Supabase CLI/dashboard (Owner-controlled). **[FACT]** No destructive or auto-applied
  migration path → **not a merge blocker.** **[INFER]**

## 11. GitHub Actions review

- The PR adds exactly **one** workflow: `.github/workflows/kis-instrument-master-refresh.yml`.
  `scrape.yml` (Seibro scraper) is **pre-existing on `origin/main`, unchanged by this PR**. **[FACT]**
- kis-refresh uses only official `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`
  (no third-party PR actions). Minimal `permissions` (contents/PR write, actions read); `concurrency`
  group with `cancel-in-progress: false`; no `pull_request_target`; `GH_TOKEN: ${{ github.token }}` (never
  printed). **[FACT]**
- Verified: pushes **only** `HEAD:$AUTOMATION_BRANCH` (never `main`), no `--force`, opens/updates **one** PR
  via `gh`, **never merges / auto-merges / deploys**; blocked runs preserve last-known-good and fail;
  raw KIS files never committed/uploaded; schedule crons correct. **[FACT]**

## 12. KIS refresh workflow review

Runs only from the default branch **after merge** (schedules fire from the workflow on `main`). Cannot
commit to `main`, cannot auto-merge, cannot deploy. Requires the repository setting **"Allow GitHub Actions
to create and approve pull requests"** to open its PR — otherwise it fails safely and reports the setting.
**[FACT/OWNER]**

## 13. Merge simulation

- Temp worktree at `origin/main`; `git merge --no-ff --no-commit aa2e422` → **"Automatic merge went well"**,
  **0 conflicts**, no unexpected deletions, no case-only collisions surfaced. Merge aborted, worktree
  removed; primary tree and refs untouched. **[TEST]**
- Because `origin/main` is a direct ancestor, the merge is trivially clean (fast-forwardable); the merged
  tree is byte-identical to `aa2e422`. **[FACT]**

## 14. Validation matrix (run on the merged-equivalent tree)

| Check | Result |
|---|---|
| `npx astro build` | **PASS** |
| `git diff --check` | clean (exit 0) |
| `npm ls --depth=0` | no problems |
| HF3B-HF2 smoke / checker | 53/53 · 123/123 |
| refresh simulator self-test | 19/19 (exit 0) |
| Discovery smoke | PASS |
| HF3B-HF4C smoke / checker | 87/87 · PASS |
| HF5-HF6AB smoke / checker | 106/106 · 122/122 |
| HF4-FAST-HF2 smoke / checker; HF4-FAST checker | PASS |
| HF3A smoke / checker | 50/50 · 87/87 |
| T-HF1 / T-FAST / T-HF2 / T-HF2-HF1 / OP-FAST checkers | PASS |

**All gates pass (18/18).** No PR-introduced test failures; no obsolete-checker failures after the
in-branch reconciliations. There are **no PR-triggered CI checks configured** in the repo (validation is
local; the only workflows are the scheduled scraper + kis-refresh). **[TEST/REPO]**

## 15. Vercel auto-deployment risk

- The app uses the `@astrojs/vercel` **server adapter** (`output: 'server'`); **no `vercel.json`/`vercel.ts`**
  is tracked. **[REPO]** Whether a push/merge to `main` auto-deploys to Production is governed by the
  **Vercel dashboard Git integration** (production branch + auto-deploy toggle), which **cannot be proven
  from the repository**. **[REPO]**
- Prior Production deploys were made via the Vercel **CLI** from the unpushed branch, which is consistent
  with either (a) no `main` Git-integration auto-deploy, or (b) auto-deploy that was simply bypassed by
  CLI. This does not resolve the question. **[INFER]**
- **`OWNER_VERCEL_DASHBOARD_CONFIRMATION_REQUIRED`** — because an automatic Production deployment is
  *possible*, and merging would carry the **undeployed, un-QA'd** KIS-only master + symbol widening to
  Production, this **must block merge authorization** until the Owner confirms the `main` deploy behavior
  and either pauses auto-deploy for a controlled deploy or accepts it. **[OWNER/BLOCK-for-merge-authorization]**

## 16. Recommended PR title & body

See `pr_1_proposed_title_and_body_v0.1.md`. Proposed title:
**`MK Stock Lab rebuild → main: Production-verified app + KIS-only instrument-master automation`**
(current title is the stale final-phase title; body is empty). Do not apply remotely in this phase.

## 17. Recommended merge strategy

**Strategy A — merge PR #1 as-is with a `--no-ff` merge commit** (after the §18 pre-merge actions). Rationale:
the final tree is correct, safe, and passes all gates; the merge is conflict-free; the 394-commit history is
coherent and phase-labelled and preserves migration/audit traceability. **Squash (Strategy B)** is an
acceptable alternative if the Owner prefers a single clean `main` commit, at the cost of per-phase history.
A **release branch (Strategy C)** is **not** required — no unwanted/unsafe content or history exists.
**Strategy D (keep blocked)** applies only if the Owner declines to resolve the Vercel item. **[INFER]**

## 18. Required remediation (pre-merge actions)

1. **[OWNER/BLOCK-for-merge]** Confirm Vercel `main` deploy behavior; pause auto-deploy or accept a
   controlled deploy (§15).
2. **[OWNER]** Update the PR title + body (§16; proposed content provided) — metadata only, not authorized
   this phase.
3. **[OBS/recommended]** One-byte cleanup of the stray NUL in
   `check_phase_3gg_t_hf3b_hf4c_fast_contract.mjs` (dead-fallback code; non-blocking).
4. **[OWNER]** Enable **"Allow GitHub Actions to create and approve pull requests"** before the scheduled
   kis-refresh needs to open its PR (not required for the merge itself).

## 19. Required Owner settings

- Vercel: confirm/paus e `main` production auto-deploy (§15).
- GitHub: "Allow GitHub Actions to create and approve pull requests" (for kis-refresh post-merge).
- Recorded only; **no setting changed by this audit.** **[OWNER]**

## 20. Merge-authorization prerequisites

Vercel deploy behavior resolved (§15); PR title/body updated; explicit Owner **merge** authorization
(currently `PULL_REQUEST_MERGE_AUTHORIZED: NO`). No auto-merge.

## 21. Production-authorization prerequisites

Separate explicit Production-deploy authorization **after** merge; safe unauthenticated regression +
**authenticated Owner QA of the KIS-only master (16,018) + alphanumeric KR ETF charting**, which has not yet
been Production-verified. **[OWNER]**

## 22. Release sequence

See `pr_1_merge_and_release_runbook_v0.1.md` (post-approval only; nothing executed here).

## 23. Rollback sequence

See the runbook: `main` revert of the merge commit; Vercel Production rollback to the last good deployment;
KIS master last-known-good restoration; workflow disable path; note that a source revert does **not** revert
an applied Supabase migration.

## 24. Risks & unresolved items

- **[OWNER]** Vercel `main` auto-deploy behavior (the one gating unknown).
- **[OWNER]** KIS-only master + symbol widening not yet Production-QA'd → Production deploy needs QA.
- **[OBS]** Stray NUL byte (cosmetic) + pre-existing `project_structure.txt` noise (independent hygiene).
- **[REPO]** No PR-triggered CI in the repo → merges rely on local validation (this audit provides it).

## 25. Final recommendation

**Proceed toward merge under Strategy A**, gated on resolving the Vercel auto-deploy question and updating
PR metadata. The PR content is safe and merge-ready; only Owner decisions + one cosmetic cleanup remain.
Do **not** merge or deploy until the Owner authorizes each step explicitly and separately.
