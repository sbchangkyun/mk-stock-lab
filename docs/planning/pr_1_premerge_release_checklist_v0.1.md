# PR #1 — Pre-Merge Release Checklist — v0.1

For `main ← rebuild/phase-1-ia-shell` (HEAD `ab176e4`, base `672419b`, 403 ahead / 0 behind). Prepared by the
Phase 3GG-T-HF3B-HF2-PREMERGE-FINALIZATION audit. **Merging `main` triggers an automatic Vercel Production
deploy.** Every box below is an Owner action; the audit performed none of them.

## A. Audit results (already verified — read-only)

- [x] Baseline verified: HEAD `ab176e4`, origin/main `672419b`, ahead 403 / behind 0, merge-base = main.
- [x] Merge simulation conflict-free (`git merge-tree` → tree `4f52624`, 0 conflicts).
- [x] Current-contract active gates all green; 141 red checkers + 8 red smokes classified SUPERSEDED /
      HISTORICAL_NON_GATING with evidence; 0 real blockers.
- [x] `npx astro build` PASS; `npm ls --depth=0` clean; `git diff --check` clean.
- [x] Secret/security scan clean; no account/order/balance endpoint; KIS fail-closed verified.
- [x] All migrations additive; KIS-token migrations proven dormant-safe behind the fail-closed flag.
- [x] KIS instrument-master workflow safe (schedules/permissions/branch/symbol/source match policy).
- [x] Two security-named red checkers verified as false-positive / superseded (real boundaries intact).

## B. Owner pre-merge confirmations (must be done before merge)

- [ ] **Production Supabase migration state** — confirm additive base-schema migrations are applied:
      `20260615_rebuild_schema_v0_1`, `20260621_market_quote_cache_lifecycle_columns`,
      `20260625_site_admins_and_settings`. (All additive; no destructive step. KIS-token migrations
      `20260713`/`20260714` are dormant behind `KIS_DURABLE_TOKEN_ENABLED` and already applied per prior
      production activation.)
- [ ] **GitHub checks green** — Vercel Preview: success; Netlify Deploy Preview: success.
- [ ] **No unresolved review threads**; PR is non-draft and mergeable.
- [ ] (Optional) Fresh authenticated Preview smoke on the tip commit — runtime bytes are unchanged since the
      last Owner Preview PASS, so this is confirmatory only:
  - [ ] Unauthenticated `/chart-ai` → lock state, zero provider/API activity.
  - [ ] Authenticated entry → no automatic search/chart/Similarity/MK request.
  - [ ] 069500 → search, select, explicit chart load, explicit Similarity, explicit MK Analysis (1 request
        each, HTTP-honest, no request storm, no duplicate KIS issuance in the validity window).
  - [ ] Regression symbols: 005930, AAPL, 0000D0, lowercase `0000d0` normalization.

## C. Environment / secret state (no change authorized this phase)

- [ ] Confirm Production env has the intended durable-KIS-token posture: `KIS_DURABLE_TOKEN_ENABLED` +
      `KIS_TOKEN_ENCRYPTION_KEY` present (durable), `KIS_TOKEN_EMERGENCY_REFRESH_ENABLED` = false.
- [ ] Confirm `KIS_ACCOUNT_NO` remains **absent** (quote-only scope).
- [ ] Confirm Preview protected-beta vars remain as-is (`CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA`, KIS quote
      flags) — Preview-only; Production stays fail-closed except the existing scoped Production-beta contract.

## D. Merge sequence (Owner-only, after B + C)

1. [ ] Apply the PR title + body from `pr_1_final_title_and_body_draft_v0.1.md`.
2. [ ] Confirm base is `main`, head is `rebuild/phase-1-ia-shell` at `ab176e4`, mergeable, non-draft.
3. [ ] Merge PR #1 (no auto-merge; deliberate Owner action).
4. [ ] Watch the automatic Vercel Production deploy to READY.
5. [ ] Post-merge Production QA (auth gate, 069500/005930/AAPL chart + Similarity + MK, honest fail-closed).

## E. Rollback / monitoring

- [ ] If Production QA fails: Vercel → promote the previous READY Production deployment (instant rollback);
      the merge commit stays on `main` for follow-up (no history rewrite).
- [ ] Durable KIS token: watch for exactly one issuance per validity window (single-issuance safeguard);
      emergency refresh stays disabled.
- [ ] Instrument-master workflow: after merge it begins firing on schedule from `main`; first run opens a PR
      only — review before merging that PR.

## F. Known limitations (non-blocking)

- 141 red checkers + 8 red smokes are retained historical/superseded phase artifacts (working-tree-scope
  freezes, superseded UI/wiring, stale TS-copy harnesses). They are **not** on any authoritative active-gate
  runner and do not reflect a current defect (see finalization result §5).
- CI-check + review-thread state and production DB migration state were not readable from the audit
  environment (no `gh`/token, no DB access) — hence the Owner confirmations in section B.
