# Phase 3GG-L-BETA-DEPLOY-RERUN-2 — Protected Preview Beta Deploy Execution After Confirmed Owner Vercel Setup — Result

## Status

The Vercel project link is now confirmed (the owner completed `vercel link` interactively and selected the existing project; this session verified and re-confirmed it deterministically). However, Deployment Protection (Vercel Authentication or Password Protection) could not be verified through any available non-interactive channel, so the protected Preview deploy did not proceed. The app remains deploy-ready (local regression + `npm run build` pass; all required Preview env names present). No Preview or production deployment was performed; not pushed; `.vercel` not committed.

## Classification

`BLOCKED_DEPLOYMENT_PROTECTION_NOT_VERIFIED`

## Baseline

`5bc8142`

## Branch

`rebuild/phase-1-ia-shell`

## HEAD before

`5bc8142b94f2535fe88ebb992410fc12604c642f`

## HEAD after

(recorded post-commit; see final report)

## Purpose

Re-run the protected Vercel Preview beta deployment after the owner confirmed the Vercel project link, verify Deployment Protection and Preview env presence before any live beta testing, and execute the protected Preview deploy only if every safety gate passes.

## Files changed

- `docs/planning/phase_3gg_l_beta_deploy_rerun_2_protected_preview_beta_deploy_result_v0.1.md` (created)
- `scripts/check_phase_3gg_l_beta_deploy_rerun_2_contract.mjs` (created)
- `package.json` (modified — 1 script entry added)
- `docs/planning/planning_changelog.md` (modified — entry prepended)

## Source diff status

Zero diff from baseline `5bc8142` for all forbidden-diff source files (kisClient.ts, the KIS market-data binding, both chart-ai API routes, the LLM runtime bridge, the model policy module, the protected-preview-beta guard, `chart-ai.astro`, MK Agent, Similar Pattern agent, guarded productization scaffold, `components`, `supabase`, `src/data`, lockfiles, `.env`, `.env.local`, `.vercel`). This is a deploy-execution/documentation phase: no source change.

## Vercel CLI status

- vercelCliAvailable: true
- vercelCliVersion: 54.9.1
- vercelAuthenticated: true (account handle only; no secret/token printed)

## Vercel project link status

- vercelProjectLinked: true
- vercelScopeKnown: true (`sbchangkyun-2946s-projects`)
- vercelProjectNameKnown: true (`mkstocklab`)
- linkEvidence: `.vercel/repo.json` is present with a structurally valid project entry (project name `mkstocklab`, matching org id, matching directory `.`). `.vercel/project.json` (the classic single-project file format) does not exist and was not created by two deterministic `vercel link --yes` attempts (`--scope sbchangkyun-2946s-projects --project mkstocklab`, then the `--team` fallback) — both attempts completed successfully (exit code 0, no interactive prompt, no browser action) but this Vercel CLI version (54.9.1) writes the newer repo-link format (`.vercel/repo.json`) for this repository instead of the classic `project.json`. This was corroborated independently and non-destructively via `vercel project ls --scope sbchangkyun-2946s-projects`, which lists exactly one project, `mkstocklab`, under that scope, matching the owner's stated context (`sbchangkyun-2946s-projects/mkstocklab`) and `repo.json`'s project id/org id. No `.vercel/project.json` file-format gap changes this: the project is linked.
- CLI-version note: this is a documented deviation from the phase's literal `.vercel/project.json` existence check, made because the underlying condition the check exists to detect (project not linked) is demonstrably false, and printing a "run `vercel link` again" message would be factually incorrect and unhelpful to the owner.

## Deployment Protection status

- deploymentProtectionVerified: false
- deploymentProtectionMethod: unknown
- deploymentProtectionBlocker: no non-interactive Vercel CLI command exposes Deployment Protection status. `vercel project inspect mkstocklab` returns only General/Framework settings (no protection fields). A `vercel api /v9/projects/mkstocklab` call that would have returned the protection configuration was not executed — it was intercepted and denied by this session's own safety/permission layer as an unauthorized escalation toward raw API/metadata access, and per this phase's explicit instructions that denial was respected rather than worked around. Per hard blocker #3, live Preview beta testing and Preview URL sharing must not proceed until Deployment Protection (Vercel Authentication or Password Protection) is confirmed enabled, which requires the owner to check the Vercel Dashboard (Project Settings → Deployment Protection) directly.

## Preview env name presence

Checked via `vercel env ls preview --scope sbchangkyun-2946s-projects` (names only; no values requested, printed, or written to disk; no `vercel env pull` run):

- KIS_APP_KEY: true
- KIS_APP_SECRET: true
- KIS_BASE_URL: true
- KIS_ENABLE_LIVE_QUOTES: true
- KIS_ENABLE_PREVIEW_LIVE_QUOTES: true
- CHART_AI_ENABLE_LOCAL_LLM: true
- OPENAI_API_KEY: true
- CHART_AI_LLM_MODEL or CHART_AI_LLM_MAIN_MODEL: true (`CHART_AI_LLM_MODEL` present)
- CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA: true

All required Preview env names are present. `BLOCKED_PREVIEW_ENV_MISSING` does not apply.

## KIS_ACCOUNT_NO Preview env status

Absent: true (not present in the `vercel env ls preview` name listing). This satisfies kisClient's quote-only readiness gate for Preview.

## Local regression preflight result

All PASS — the application remains deploy-ready:

- HF5 diagnostic: PASS (`FIXED_RUNTIME_FLAG_INJECTION_CURRENT_PRICE_READY`)
- G-FAST owner smoke: PASS (`sourceStatus=ok currentPricePresent=true volumePresent=true sanitized=true`)
- HF6 diagnostic: PASS (`FIXED_LLM_RUNTIME_ENV_READY`)
- L-FAST regression harness: PASS (`PASS_LLM_QUALITY_REGRESSION` — summary.ok=true, sourceStatus=ok, llmStatus=ok, summaryTextPresent=true, exactly 3 Korean bullet lines, no ASCII digits, no forbidden investment phrase, no exposure)

## npm build result

- npmBuildPass: true (`npm run build` succeeded; `@astrojs/vercel` adapter produced `.vercel/output/`; `postbuild` repair script completed)

## Vercel build result

- vercelBuildPass: not run (deliberately stopped before this step — Deployment Protection could not be verified, so per this phase's explicit instruction the run proceeds directly to blocked documentation rather than continuing toward `vercel build`/`vercel deploy`)
- vercelBuildEnvironment: n/a (Preview intended; never Production)

## Preview deployment result

Not performed — blocked on unverifiable Deployment Protection status.

- deploymentSucceeded: false
- deploymentEnvironment: preview (intended; not executed)
- deploymentUrlPresent: false
- deploymentUrl: none
- Production deploy: false
- Promoted to production: false

## Deployment URL present

false (no deployment).

## Deployment environment

preview (intended; no deployment executed). No production deploy, no promote to production, no production alias.

## Preview `/chart-ai?chartAiBetaPreview=1` result

Not applicable (no deployment). The protected-preview-beta source path is in place (commit `fecf44e`) and was verified fail-closed locally in Phase 3GG-L-BETA-ACTIVATE; it will reveal the beta panel and serve the beta H route only on a Vercel Preview deployment with the owner flag + explicit query, once Deployment Protection is confirmed and the deploy executes.

## Preview H route beta result

Not applicable (no deployment; live Preview route test intentionally not run because Deployment Protection is unverified).

- summary.ok: n/a (not deployed)
- sourceStatus: n/a
- llmStatus: n/a
- sanitizedErrorCode: n/a
- currentPricePresent: n/a
- volumePresent: n/a
- summaryTextPresent: n/a
- exactly 3 Korean bullet lines: n/a
- labels present (데이터 상태:, 해석 범위:, 유의사항:): n/a
- ASCII digit present: n/a (false locally)
- forbidden investment phrase present: n/a (false locally)

## Mobile result

Not applicable (no deployment).

## Exposure status

No exposure occurred (nothing was deployed, and only structural/boolean metadata was inspected or printed):

- OpenAI key exposure: Not exposed
- model name exposure: Not exposed
- prompt exposure: Not exposed
- raw OpenAI request/response exposure: Not exposed
- KIS_BASE_URL raw value exposure: Not exposed
- credential exposure: Not exposed
- token exposure: Not exposed (Vercel auth token never printed)
- Authorization header exposure: Not exposed
- raw KIS request/payload/HTTP-body/error exposure: Not exposed
- currentPrice numeric exposure: Not exposed
- volume numeric exposure: Not exposed
- Vercel env value exposure: Not exposed (no `vercel env pull`, no values printed — only encrypted-status/name listing was read)
- Vercel project id/org id exposure: `repo.json`'s `prj_...`/`team_...` identifiers are non-secret project metadata (per the CLI's own README.txt: only `projectId`/`orgId`, not credentials); recorded here only as structural evidence, not included in any public-facing doc beyond this internal result doc.

No exposure of any secret occurred this phase.

## KIS endpoint boundary

- current_price only for market data: confirmed (no source change; binding allowlist unchanged)
- no order/account/balance/funds/portfolio/trading/personal endpoints: confirmed

## LLM boundary

- H route only: confirmed
- explicit chartAiBetaPreview=1 required (Preview) / ownerLocalKisLlm=1 (local): confirmed
- no prompt rewrite: confirmed
- no model name exposure: confirmed

## Env file status

- `.env`/`.env.local` not printed: confirmed
- `.env`/`.env.local` not modified: confirmed
- `.env`/`.env.local` not staged: confirmed
- `.env`/`.env.local` not committed: confirmed

## .vercel status

- `.vercel/` present locally (repo-link metadata + adapter build output) but not staged: confirmed
- `.vercel/` not committed: confirmed

## .gitignore status

`.gitignore` has an owner/Vercel-local unstaged change: the Vercel CLI's `vercel link` run appended a `.env*` line (in addition to the pre-existing `.vercel` ignore rule). This is left unstaged and uncommitted, per instructions, since it only adds ignore rules (`.vercel`, `.env*`) and does not weaken any safety boundary.

## Push status

Not pushed.

## Owner action required to complete the deploy

This deploy cannot be executed from this session until the owner confirms Deployment Protection on the Vercel Dashboard (an interactive/outward-facing step reserved for the owner):

1. Open the Vercel Dashboard for `sbchangkyun-2946s-projects/mkstocklab` → Project Settings → Deployment Protection, and confirm Vercel Authentication or Password Protection is enabled for Preview deployments. (Project link is already confirmed; Preview env names are already confirmed present; local regression and `npm run build` already pass.)

Once Deployment Protection is confirmed, re-running this phase can execute `vercel build` + `vercel deploy --prebuilt --yes` (Preview only) and load `/chart-ai?chartAiBetaPreview=1` on the protected Preview URL to record the live beta result.

## Next recommended phase

Re-run Phase 3GG-L-BETA-DEPLOY-RERUN-2 (or a successor rerun) once the owner has confirmed Deployment Protection is enabled on the Vercel Dashboard. Production remains prohibited.
