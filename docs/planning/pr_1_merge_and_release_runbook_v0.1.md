# PR #1 — Merge & Release Runbook — v0.1 (post-approval only)

Design only. **Nothing in this runbook was executed during the audit.** Each step needs explicit Owner
authorization; several are outside the assistant's action policy (merge, deploy, repo settings).

## A. Pre-merge (gate the merge)

1. **Resolve Vercel deploy behavior (BLOCKER for merge authorization).** Owner confirms in the Vercel
   dashboard whether a push/merge to `main` auto-deploys Production. If yes, either pause production
   auto-deploy for a controlled deploy, or explicitly accept that merge will deploy the undeployed KIS-only
   master + symbol widening (which then needs immediate Owner QA).
2. **Update PR #1 title + body** (proposed content in `pr_1_proposed_title_and_body_v0.1.md`).
3. *(Recommended)* One-byte cleanup of the stray NUL in
   `scripts/check_phase_3gg_t_hf3b_hf4c_fast_contract.mjs`, on a small follow-up commit to the branch.
4. Enable **Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests"**
   (needed for the scheduled kis-refresh to open its PR after merge; not required for the merge itself).
5. Re-run the local validation matrix (audit §14) if the branch changed.

## B. Merge (explicit Owner authorization required — currently NO)

6. Obtain explicit merge authorization. **No auto-merge.**
7. Merge PR #1 → `main` using **Strategy A (`--no-ff` merge commit)** (or squash if the Owner prefers a
   single clean commit). The merge is conflict-free (`origin/main` is a direct ancestor).
8. Verify `main` SHA advanced and includes `aa2e422`'s tree; verify
   `.github/workflows/kis-instrument-master-refresh.yml` is present on `main`.

## C. Production deploy (separate explicit authorization required — currently NO)

9. Decide the deploy trigger: controlled `vercel deploy --prod` (as in prior phases) **or** the confirmed
   Vercel Git integration. Only proceed with separate Production authorization.
10. Safe unauthenticated regression: `/chart-ai` 200; protected routes 401; page does not embed the master;
    no Market Intelligence UI; no hidden default.
11. **Authenticated Owner QA of the NEW behavior**: alphanumeric KR ETF (e.g. `0000D0`) search + chart load;
    KIS-only coverage; Similarity/MK on an alphanumeric ETF; no KIS-token duplicate issuance.
12. Confirm the scheduled kis-refresh in a controlled/report-only observation before trusting scheduled
    auto-PRs.
13. Finalize the phase classification.

## D. Rollback

- **main:** revert the merge commit (`git revert -m 1 <merge-sha>`) on a branch → PR → merge. Non-destructive.
- **Production:** roll back to the last-known-good Vercel deployment (dashboard "Promote"/"Rollback"), or
  re-deploy the prior commit via CLI.
- **KIS master:** restore the previous `universalInstrumentMaster.json` (the refresh pipeline preserves
  last-known-good; git history retains the 12,826-row master at `030d8fd`).
- **Workflow:** disable the scheduled kis-refresh (Actions tab → disable workflow) or revert the workflow
  file; close any open automation refresh PR; the persistent `automation/kis-instrument-master-refresh`
  branch can be deleted.
- **Migration caveat:** reverting source does **NOT** revert an already-applied Supabase migration. Any DB
  rollback is a separate, manual, Owner-controlled Supabase operation (none of these migrations is
  destructive, so no data loss is implied by leaving them applied).

## E. Never (guardrails)

No force-push; no push to `main` by automation; no auto-merge; no auto Production deploy from the refresh
workflow; no committing raw KIS source files; no printing tokens.
