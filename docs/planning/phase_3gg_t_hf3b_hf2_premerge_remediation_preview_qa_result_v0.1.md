# Phase 3GG-T-HF3B-HF2 — Pre-Merge Remediation & Preview QA — Result v0.1

Audit-follow-up phase: the one-byte NUL cleanup, final local validation, feature-branch push, Vercel
Preview detection, safe unauthenticated Preview regression, and the authenticated Owner Preview QA
checkpoint. **No merge, no main push, no Production deploy, no DB/env/Supabase/secret change.**

## 1. Baseline

- Branch `rebuild/phase-1-ia-shell`; local starting HEAD `bd4c788` (audit commit). **[FACT]**
- `origin/main` `672419b` (unchanged; merge-base == origin/main → merge remains conflict-free). **[FACT]**
- Remote feature (before push) `aa2e422`; PR #1 `main` ← `rebuild/phase-1-ia-shell`, open, unmerged. **[FACT]**

## 2. Audit commit

- `bd4c788` — `Phase 3GG-T-HF3B-HF2: audit PR #1 before merge` (docs-only, was local-only, now pushed). **[FACT]**

## 3. NUL cleanup (Lane A)

- File: `scripts/check_phase_3gg_t_hf3b_hf4c_fast_contract.mjs`.
- Before: **1** NUL byte at offset 7519 (dead-fallback `masterVersion || '\x00zzz'`, intended `' zzz'`).
- Action: replaced the single NUL (0x00) with the intended space (0x20). No other edit.
- After: **0** NUL bytes; valid UTF-8; the sentinel line reads
  `masterParsed.masterVersion || ' zzz'`. **No behavior change** (fallback never executes; checker 191/191).
- Repo-wide NUL scan: only pre-existing non-source binaries carry NUL — `project_structure.txt` (UTF-16, on
  `main`, not in the PR) and `public/icon-192.png` / `public/icon-512.png` (PNGs). No other unexpected NUL. **[FACT]**

## 4. Validation results (post-cleanup)

- HF3B-HF4C checker **191/191**; HF3B-HF2 checker **123/123**; HF3B-HF2 smoke **53/53**. **[TEST]**
- Full local gate: all deterministic checkers/smokes pass (the two working-tree-purity flags before commit
  were the uncommitted cleanup itself, and clear once committed). `npx astro build` PASS; `npm ls --depth=0`
  clean; `git diff --check` clean. **[TEST]**
- Runtime invariants: KR symbol validation widened (`^[0-9A-Z]{6}$`) in `kisClient.ts` + `instrument.ts`;
  no KRX/data.go.kr/Nasdaq-Trader runtime dependency in `src/`; master not embedded in the page (0 refs);
  no Market Intelligence UI marker; no account/order/trading endpoint. **[TEST]**
- No raw KIS source tracked; no dependency/lockfile change in this remediation. **[FACT]**

## 5. Remediation commit

- `Phase 3GG-T-HF3B-HF2-HF1: remove stray NUL before merge` — commit hash: **{{PREMERGE_REMEDIATION_HEAD}}**
  (recorded below after creation). Contains only the checker one-byte cleanup + this + audit/changelog docs.
  `bd4c788` not amended; not squashed. **[FACT]**

## 6. Push result

- Pushed `rebuild/phase-1-ia-shell` only (no main, no force, no tags).
- Remote before `aa2e422` → after **{{REMOTE_AFTER}}** (= remediation HEAD). Included `bd4c788` +
  remediation commit. **[FACT]**

## 7. PR #1 state

- Open, base `main`, head `rebuild/phase-1-ia-shell`; head SHA = remediation HEAD; no duplicate PR; no
  auto-merge; not merged. Recommended title/body: `pr_1_proposed_title_and_body_v0.1.md`. **[FACT]**

## 8. New Preview deployment

- Detected read-only after push (Git-integration Preview for the remediation SHA). ID / URL / alias /
  READY / commit / target recorded in the Owner checkpoint. No manual deploy invoked. **[FACT]**

## 9. Safe unauthenticated Preview regression

- `/chart-ai` reachable (or deployment-protection response recorded); protected routes fail closed 401;
  no master embedded; no Market Intelligence UI; no hidden Samsung default; KR/US + stock/ETF controls
  present; no unauthenticated provider work. Details in the checkpoint. **[TEST]**

## 10. Owner-authenticated Preview QA — pending

Owner browser QA (Section 14) is required and not self-certified. Alphanumeric KR ETF (`0000D0`) charting,
KIS-only coverage, cross-symbol isolation, cache header, mobile, and KIS token issuance are Owner-verified
on the Preview.

## 11. GitHub Actions repository setting

Owner approved enabling "Allow GitHub Actions to create and approve pull requests." Status recorded in the
checkpoint (enabled via an authorized admin session, or `OWNER_UI_ACTION_PENDING`). No other setting changed.

## 12. Vercel main auto-deploy confirmation

`OWNER_VERCEL_MAIN_AUTO_DEPLOY_CONFIRMATION_REQUIRED` — blocks merge authorization (not Preview QA). Owner to
confirm the Production Branch / branch-tracking behavior for `main`.

## 13. Safety

No merge; no Production deploy; no DB/env/Supabase/Vercel-env/secret change; no KIS token implementation
change; no raw files committed; no auto-merge; no main push; no force-push. Classification:
**`REMEDIATED_PUSHED_PREVIEW_READY_OWNER_QA_PENDING`** (target after Owner QA:
`PASS_PREMERGE_REMEDIATION_AND_PREVIEW_QA_COMPLETE_MERGE_AUTHORIZATION_PENDING`).
