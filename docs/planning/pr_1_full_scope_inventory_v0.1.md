# PR #1 — Full-Scope Inventory — v0.1

Companion to `phase_3gg_t_hf3b_hf2_pr_premerge_audit_result_v0.1.md`. Range: `origin/main...HEAD`
(`672419b...aa2e422`). Audit-only; no changes to code/data/workflows.

## 1. Totals

- 394 commits · 1,163 files (1,131 A / 16 D / 16 M) · +455,318 / −3,242.

## 2. Category counts

| Category | Files | Notes |
|---|---|---|
| planning/result docs (`docs/planning/`) | 474 | bulk of the diff; per-phase result/plan docs + this audit |
| server library (`src/lib/**`) | 163 | chart-ai engines, providers, market-data, portfolio-intelligence |
| operational scripts / tests / checkers (`scripts/`) | 351 | per-phase smokes + contract checkers + generator + discovery + automation |
| UI (`src/components`,`src/layouts`,`src/pages/*`,`src/styles`) | 41 | Astro pages/components/styles |
| handoff docs (`docs/handoff/**`, NOT codex_state_inspection) | 26 | phase-handoff briefs |
| API routes (`src/pages/api/**`) | 23 | chart-ai + portfolio + auth routes |
| generated app data (`src/data/**`) | 18 | universal master + manifest + anchors + archive + refreshState + fixtures |
| DB migrations (`supabase/migrations/`) | 6 | all additive (see audit §10) |
| public assets (`public/`) | 4 | ads.txt + ad placeholders |
| Supabase validation (`supabase/validation/`) | 3 | static SQL validation |
| GitHub Actions (`.github/workflows/`) | 1 | kis-instrument-master-refresh.yml (scrape.yml is pre-existing on main) |

## 3. Largest files (added lines / on-disk)

- `src/data/chart-ai/universalInstrumentMaster.json` — 208,348 added lines, ≈5.06 MB (server-only master).
- `src/pages/chart-ai.astro` — 7,679 lines.
- `docs/planning/planning_changelog.md` — cumulative, ≈810 KB.
- `src/styles/style.css` — 5,956 lines.
- `src/pages/portfolio.astro` — 1,921 lines.
- No file >1 MB other than the generated master (and the pre-existing, non-PR `project_structure.txt`).

## 4. Binary / anomalous

- Git flags `scripts/check_phase_3gg_t_hf3b_hf4c_fast_contract.mjs` binary due to **one stray NUL byte**
  in dead-fallback code (audit §8) — cosmetic, runs 191/191, recommend one-byte cleanup.
- No true binaries (images/PDF/zip/db) introduced by the PR.

## 5. Explicitly ABSENT (confirmed not tracked in the PR)

`.env` / `.env.local` / `.vercel/` · `node_modules` / `dist` / `.astro` · raw KIS `.mst`/`.cod`/`.zip` ·
KRX/data.go.kr downloads · logs / coverage / temp dirs · DB dumps · OS files ·
`docs/handoff/codex_state_inspection/` (0 files in range).

## 6. Migrations (6)

`20260615_rebuild_schema_v0_1.sql` · `20260621_market_quote_cache_lifecycle_columns.sql` ·
`20260625_site_admins_and_settings.sql` · `20260713_kis_token_lifecycle.sql` ·
`20260714_kis_token_postgrest_rpc_bridge.sql` · `draft_3fd_c_chart_similarity_role_usage_not_executed.sql`
(draft, not executed). All additive; 0 destructive ops; no auto-apply path.

## 7. Workflows (1 added)

`.github/workflows/kis-instrument-master-refresh.yml` — official actions only, minimal perms, automation
branch only, no main push/force/merge/auto-merge/deploy. `scrape.yml` is pre-existing on `main`.

## 8. Machine-readable artifacts

Full `git diff --numstat` and `--name-status` for the range were generated to scratch
(`mk-stock-lab-premerge-audit/`) during the audit and are intentionally not committed (kept out of the repo
per the deliverables policy).
