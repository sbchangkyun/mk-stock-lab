# MK Stock Lab Planning Changelog

## Phase 2I - 2026-06-16

### Disposable Validation Result

- Created `docs/planning/supabase_disposable_validation_result_v0.1.md`.
- Recorded operator-performed disposable Supabase validation results.
- Recorded that the migration was manually applied to a separate disposable validation project.
- Recorded that `supabase/validation/patch_consume_chart_ai_usage_v0_1.sql` was manually applied to the disposable validation project.
- Recorded that the patched `internal.consume_chart_ai_usage(uuid, integer)` four-call test passed with remaining counts `2`, `1`, `0`, `0`.
- Recorded that full validation SQL was rerun successfully after the patch.
- Recorded that Supabase Advisors reported no critical warnings according to the operator.
- Updated `supabase/validation/README.md` with a cross-reference to the validation result document.

### Safety Notes

- Codex did not connect to Supabase.
- Codex did not run any database command.
- Codex did not apply migration or patch SQL.
- Production Supabase was not touched.
- Successful disposable validation does not authorize production application.

## Phase 2H - 2026-06-16

### Chart AI Usage Function Fix

- Disposable validation found a runtime ambiguity in `internal.consume_chart_ai_usage(uuid, integer)`.
- The observed error reported ambiguous `usage_date_kst` resolution inside the PL/pgSQL function.
- Fixed the migration source by naming the `ai_usage_daily` user/date unique constraint and using `on conflict on constraint ai_usage_daily_user_id_usage_date_kst_key`.
- Updated the function body to use internal `out_*` aliases and table-qualified references so output column names do not conflict with table columns.
- Created `supabase/validation/patch_consume_chart_ai_usage_v0_1.sql` for disposable validation project repair.
- Updated validation docs to mention the disposable-only patch and the expected four-call usage test results.

### Safety Notes

- No Supabase connection was attempted by Codex.
- No database command was run by Codex.
- No migration or patch was applied by Codex.
- The patch file is for the disposable validation project only and does not authorize production migration.

## Phase 2G - 2026-06-16

### Validation README Verification

- Confirmed root `README.md` still contains the existing Astro Starter Kit content.
- Confirmed root `README.md` was not changed during Phase 2G.
- Confirmed `supabase/validation/README.md` exists and was the file modified by Phase 2F.
- Corrected `supabase/validation/README.md` to use the required `# Supabase Validation` title and focused disposable validation structure.
- Confirmed `supabase/validation/README.md` cross-references `supabase/validation/validate_rebuild_schema_v0_1.sql` and `docs/planning/supabase_disposable_project_setup_guide_v0.1.md`.
- Recorded the Astro Starter Kit root README as unrelated existing project documentation debt.

### Safety Notes

- No Supabase connection was attempted.
- No Supabase project was created.
- No migration was applied anywhere.
- No database command was run.

## Phase 2F - 2026-06-16

### Disposable Project Setup Preparation

- Created `docs/planning/supabase_disposable_project_setup_guide_v0.1.md`.
- Documented manual-only setup steps for a separate disposable Supabase validation project.
- Added disposable naming guidance, SQL Editor validation workflow, allowed validation-result fields, prohibited secret-bearing captures, disposal options, hard stop conditions, and explicit owner approval phrases.
- Updated `supabase/validation/README.md` with a cross-reference to the disposable project setup guide.
- Reiterated that Phase 2F does not authorize remote access, agent-created projects, migration application, or database mutation.

### Safety Notes

- No Supabase connection was attempted.
- No Supabase project was created.
- No migration was applied anywhere.
- No database command was run.
- No secret value, project ref, database URL, token, password, anon key, or service-role key was requested or recorded.

## Phase 2E - 2026-06-16

### Remote Disposable Validation Planning

- Created `docs/planning/supabase_remote_disposable_validation_plan_v0.1.md`.
- Documented two remote disposable validation target options:
  - Supabase branch database from the existing project.
  - Separate disposable Supabase project.
- Recommended a separate disposable Supabase project as the safer default when branch isolation, production data, or operator experience is uncertain.
- Added pre-flight checks, hard stop conditions, SQL Editor workflow, CLI placeholder workflow, and a validation result template.
- Reiterated that Phase 2E does not authorize remote access or database mutation.

### Safety Notes

- No Supabase project connection was attempted.
- No migration was applied anywhere.
- No database command was run.
- No production deployment setting or product feature was changed.
- No secret value, project ref, database URL, token, password, or service-role key was requested or recorded.

## Phase 2D - 2026-06-16

### Disposable Validation Preparation

- Created `docs/planning/supabase_disposable_validation_plan_v0.1.md`.
- Created `supabase/validation/validate_rebuild_schema_v0_1.sql` as a read-only validation script for disposable databases after migration application.
- Created `supabase/validation/README.md` with validation script safety notes.
- Checked local tool availability:
  - Supabase CLI is not installed.
  - `psql` is not installed.
  - Docker is not installed.
- Documented validation options for local Supabase CLI, direct disposable Postgres with `psql`, and Supabase branch or disposable remote database only after explicit owner approval.

### Safety Notes

- No tool was installed.
- No local database service was started.
- No migration was applied locally, to a disposable database, to a branch database, or to a remote database.
- No remote Supabase command was run.
- The validation SQL includes only read-only catalog checks plus commented disposable-only examples.

## Phase 2C - 2026-06-16

### Human Review Package

- Created `docs/planning/supabase_human_review_v0.1.md` for owner approval or rejection before any database application.
- Summarized all 14 migration tables by product group.
- Added a table-by-table approval matrix with all statuses set to `Pending owner review`.
- Documented RLS and access-control behavior for profiles, portfolios, usage, market/cache, Lab, and ad event tables.
- Documented critical security decisions from Phase 2B, including server-only `ad_events`, server-controlled profile plans, non-personal `chart_ai_cache`, and service-role-only usage function execution.
- Added an explicit remote application gate requiring a separate owner command.
- Reiterated that Phase 2C does not authorize any database changes.

### Safety Notes

- No SQL migration file was changed during Phase 2C.
- No local, disposable, branch, or remote database migration was applied.
- No remote Supabase command was run.
- Phase 2C should lead to owner review, disposable validation preparation, or a remote application plan only after explicit owner approval.

## Phase 2B - 2026-06-16

### Supabase SQL Review

- Reviewed `supabase/migrations/20260615_rebuild_schema_v0_1.sql` for table coverage, RLS shape, grants, function safety, and server-write boundaries.
- Confirmed all 14 required tables remain drafted.
- Confirmed `chart_ai_cache` remains non-personal and has no `user_id`.
- Hardened `profiles` so normal authenticated clients can insert only their own initial profile fields and update only editable columns.
- Kept profile plan changes server-controlled.
- Removed anonymous and authenticated insert access for `ad_events`; ad tracking is now documented as server-write only.
- Added explicit service-role table grants for server-side writes and newer Supabase Data API grant behavior.
- Revoked public client execution from `public.set_updated_at()`.
- Updated `internal.consume_chart_ai_usage(uuid, integer)` to return `remaining_count`.

### Validation Plan

- Added `docs/planning/supabase_local_validation_checklist_v0.1.md` for disposable database validation.
- Updated `docs/planning/supabase_schema_notes_v0.1.md` with SQL review results, RLS review, `ad_events` decision, `profiles` decision, and local validation steps.
- No remote Supabase command was run.
- No local database migration was applied because Supabase CLI and `psql` are not installed locally.

## Phase 2A - 2026-06-16

### Supabase Migration Draft

- Created `supabase/migrations/20260615_rebuild_schema_v0_1.sql` as a local-only migration draft.
- Created `docs/planning/supabase_schema_notes_v0.1.md` with review gates before any remote database application.
- Updated `docs/planning/api_db_spec_v0.1.md` with concrete schema decisions from the draft.
- Drafted tables for profiles, portfolios, portfolio positions, Chart AI usage, market caches, Lab datasets, and ad events.
- Enabled RLS on every public table in the draft.
- Added explicit grants for intended `anon` and `authenticated` Data API access paths.
- Added `public.set_updated_at()` and triggers for mutable tables.
- Added `internal.consume_chart_ai_usage(uuid, integer)` as a server-only draft function for atomic KST daily Chart AI usage tracking.

### Safety Notes

- No Supabase remote connection was used.
- No local or remote migration was applied.
- No database reset, drop, or destructive command was run.
- Supabase CLI was not installed locally, so no CLI dry-run was available.
- Phase 2B should review the SQL in a disposable local or branch database before any production application.

## Phase 1.2 - 2026-06-15

### Browser Smoke Check

- Ran normal `npm run build`; it exits with code 0.
- Confirmed `astro preview` is not supported by the installed Vercel adapter, so the local smoke check used the Astro dev server instead.
- Confirmed target route skeletons return usable pages:
  - `/`
  - `/chart-ai`
  - `/heatmap`
  - `/lab`
  - `/portfolio`
  - `/lab/congress-stocks`
  - `/lab/nps-portfolio`
  - `/lab/sp500-sectors`
  - `/lab/asset-class-returns`
- Confirmed removed legacy routes return 404 and do not expose old page markers:
  - `/seibro`
  - `/api/news`
  - `/api/list`
  - `/api/holdings`
  - `/api/stock`
  - `/api/etf`
  - `/api/search`

### Shell Validation

- Confirmed the primary nav contains only Home, Chart AI, Heatmap, Lab, and Portfolio.
- Confirmed the auth entry is visible and opens the login modal.
- Confirmed the light/dark theme toggle changes page state.
- Confirmed the slide ad and footer fixed ad render without blocking route checks.
- Replaced the external TradingView iframe ticker with a local static market ticker belt after the browser smoke check found an iframe listener console error.
- Confirmed the local ticker belt contains no crypto tickers.
- Confirmed the follow-up browser smoke check reports no console or page errors on initial shell load.

### Validation

- No requested provider secret markers were found in source or generated output.
- No removed legacy route strings were found in source or generated output.
- Ignored-file coverage was confirmed for `.env*`, `.vercel`, `dist`, `.astro`, `.omc`, and representative credential/key filenames.
- `.vercel/output/config.json`, `.vercel/output/functions/_render.func`, and `.vercel/output/static` remain generated by the normal build.
- Phase 2 can start from the stabilized IA shell after this commit.

## Phase 1.1 - 2026-06-15

### Build Stabilization

- Identified the Vercel adapter packaging failure root cause as a local Windows OneDrive file attribute issue.
- Generated build files inside the OneDrive workspace were marked as reparse-point entries, and Node recursive copy used by the Vercel adapter terminated during packaging.
- Kept `output: 'server'` for Vercel server-capable production behavior.
- Added local OneDrive detection in `astro.config.mjs` so local builds write Astro `outDir` to a normal temporary filesystem path outside OneDrive.
- Added `postbuild` script `scripts/repair-vercel-output.mjs` to populate `.vercel/output/static` from generated client assets when the adapter leaves static output empty.

### Validation

- `npm run build` now exits with code 0.
- `.vercel/output/config.json` is generated.
- `.vercel/output/functions/_render.func` is generated.
- `.vercel/output/static` contains generated static assets.
- No requested provider secret markers were found in source or generated output.
- Removed legacy route strings remain absent from source and generated output.
- Ignored-file coverage was confirmed for `.env*`, `.vercel`, `dist`, `.astro`, `.omc`, and representative credential/key filenames.
- No Hangul text was found in source, scripts, config, package metadata, or planning docs.

## Phase 1 - 2026-06-15

### Changed

- Replaced the legacy single-page menu shell with an explicit Astro route shell.
- Added target route skeletons:
  - `/`
  - `/chart-ai`
  - `/heatmap`
  - `/lab`
  - `/portfolio`
  - `/lab/congress-stocks`
  - `/lab/nps-portfolio`
  - `/lab/sp500-sectors`
  - `/lab/asset-class-returns`
- Rebuilt shared layout, header, auth modal entry points, nav, ticker belt, slide ad, footer fixed ad, theme handling, and base styles.
- Removed crypto tickers from the ticker belt.
- Simplified the Supabase helper to preserve browser auth entry points without legacy portfolio table helpers.

### Removed

- Removed obsolete Economic News API route.
- Removed obsolete Crypto News API route.
- Removed obsolete Seibro/Supply Analysis page and components.
- Removed legacy Naver stock and ETF proxy API routes used by the old menu shell.
- Removed the old single-page menu and word-cloud script.
- Removed the old crypto redirect file.

### Validation

- Ran normal `npm run build` only. No verbose Astro or Vite build was run.
- Astro and Vite generated `dist/client` and `dist/server`, but the command still exited with code 1.
- `.vercel/output/static` and `.vercel/output/server` were created, but `.vercel/output/config.json` and Vercel function folders were not written.
- The generated server entry imports successfully.
- No obsolete news, crypto news, Seibro, or removed API route strings were found in `src`, `public`, `dist/server`, or `dist/client`.
- No requested provider secret markers were found in `src`, `public`, `dist/client`, or `dist/server`.
- Ignored-file coverage was confirmed for `.env*`, `.vercel`, `dist`, `.astro`, `.omc`, and representative credential/key filenames.
- No Hangul text was found in `src`, `docs/planning`, or `.gitignore`.

### Remaining Build Risk

- The current build failure is classified as Vercel adapter output packaging after successful Astro/Vite bundling.
- It is not currently classified as a legacy route/module import failure because those routes were removed and the generated server entry imports successfully.
- If this persists in Phase 2, investigate Vercel adapter build-output generation and `@vercel/nft` packaging behavior with sanitized environment variables only.

## Phase 0.1 - 2026-06-15

### Safety Changes

- Hardened `.gitignore` so `.env.local`, `.env.*`, `.vercel/`, common key files, certificate bundles, credential files, and secret-named local files are ignored.
- Created and switched to the safe working branch `rebuild/phase-1-ia-shell` before any Phase 1 product-code work.
- Confirmed `git status --short` does not show `.env*`, `dist`, `.astro`, `.vercel`, or obvious secret-bearing files as staged or untracked.
- Confirmed ignored-path coverage with `git check-ignore` for `.env`, `.env.local`, `.env.production`, `.env.development`, `.vercel`, `dist`, `.astro`, and representative local credential filenames.

### Build Stabilization Notes

- Ran a normal `npm run build` only. No verbose Astro or Vite build was run during Phase 0.1.
- The normal build still exits with code 1 after Astro and Vite complete server/client artifact generation.
- The build output does not print an actionable error line.
- `dist/client` and `dist/server` are generated.
- `.vercel/output/static` and `.vercel/output/server` are created, but `.vercel/output/config.json` and Vercel function folders are not written.
- The built server entry imports successfully, so the current failure is not a generated server bundle import failure.
- Current evidence points to a Vercel adapter serverless output packaging failure after successful Astro/Vite bundling, not malformed legacy source code.

### Phase 1 Gate

- Phase 1 can start safely on `rebuild/phase-1-ia-shell`.
- Phase 1 should keep the first product-code block focused on replacing the legacy IA shell and then rerun a normal `npm run build`.
- If the Vercel adapter packaging failure remains after removing legacy routes, investigate adapter packaging, `@vercel/nft` tracing, and Vercel build-output generation without using verbose logs while real environment variables are loaded.

## v0.1 - 2026-06-15

### Added

- Created `docs/planning/` as the maintained planning document location.
- Added rebuild plan, screen specification, API and DB specification, development roadmap, execution prompt, and changelog.
- Documented target navigation: Home, Chart AI, Heatmap, Lab, Portfolio.
- Documented Lab routes for Congress Stocks, NPS Portfolio, S&P 500 Sectors, and Asset-Class Returns.
- Documented Supabase schema target and RLS baseline.
- Documented server-only provider environment variables.
- Documented phase roadmap from Phase 0 through Phase 10.

### Phase 0 Audit Findings

- Current app is an Astro project with Vercel server output.
- Current source contains legacy news, crypto news, and Seibro supply-analysis features.
- Current source contains portfolio and Supabase Auth functionality worth preserving and rebuilding.
- Current source includes slide and footer fixed ad components that should be preserved.
- Current source contains mojibake, malformed strings, and malformed markup that are likely to block builds.
- Dependencies were already installed; `npm install` was not required during Phase 0.

### Key Decisions

- Remove Economic News, Crypto News, and old Supply Analysis functionality during Phase 1.
- Preserve Supabase Auth, Vercel deployment, portfolio concept, ticker belt, slide ad, and footer fixed ad.
- Exclude crypto from the main product.
- Allow Bitcoin only in the Lab asset-class returns page.
- Require login for Chart AI execution and Portfolio.
- Keep Lab pages public.
- Use server-only wrappers for KIS, OpenDART, OpenAI, and Gemini.

### Validation Log

- `npm ls --depth=0` resolved declared dependencies.
- `npm run build` generated Astro/Vite server and client artifacts but returned exit code 1 without an actionable error line in the normal captured output.
- `npm run build -- --verbose` also returned exit code 1 and exposed resolved environment variables in logs. Do not use verbose builds while real secrets are loaded.
- Secret-name search across `src`, `public`, `dist`, and `.astro` found no matches for `KIS_APP_SECRET`, `KIS_APP_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, or `OPENDART_API_KEY`.
- Additional file-name search found no matches in `src`, `public`, `dist`, or `.astro` for service-role markers `SUPABASE_SERVICE_ROLE_KEY`, `KIS_SECRET_KEY`, or `sb_secret`.
- `docs/planning/` contains no Hangul text.
- Obsolete routes and generated artifacts for news, crypto, and Seibro remain present. Removal is assigned to Phase 1.
