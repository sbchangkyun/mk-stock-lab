# Phase 3GG-K-ENV-HF1 -- Owner-local KIS Runtime Environment Correction Result

- **Status: Blocked (classification: BLOCKED_ENV_MISSING)**
- **Baseline: 0833007**
- **Branch: rebuild/phase-1-ia-shell**

## 1. Purpose

Diagnose why the owner-local KIS `current_price` runtime path reports `SOURCE_UNAVAILABLE` (Phase
3GG-K-QA-OWNER-RERUN's observed outcome) before the LLM bridge is ever invoked, using only
sanitized, boolean-only signals -- never opening `.env`/`.env.local`, never printing an env value,
credential, raw KIS payload, raw LLM response, prompt text, or a `currentPrice`/`volume` numeric
value. This is an environment/runtime correction phase, not a feature, UI, or KIS endpoint
expansion phase.

## 2. Files changed

- Created: `scripts/owner_diagnostic_phase_3gg_k_env_hf1_kis_runtime_readiness.mjs`
- Created: `scripts/check_phase_3gg_k_env_hf1_contract.mjs`
- Created: `docs/planning/phase_3gg_k_env_hf1_owner_local_kis_runtime_correction_result_v0.1.md`
- Modified: `package.json` (two new script entries)
- Modified: `docs/planning/planning_changelog.md` (new entry prepended)
- Modified (checker-compatibility only, explicitly documented in this phase's work order):
  `scripts/check_phase_3gg_k_qa_owner_rerun_contract.mjs`, `scripts/check_phase_3gg_k_qa_contract.mjs`,
  `scripts/check_phase_3gg_k_fast_contract.mjs`, `scripts/check_phase_3gg_j_hf1_contract.mjs` --
  only if a working-tree-purity regression required it (see Section 12).

## 3. Source diff status

No diff against baseline `0833007` for any of: `src/lib/server/providers/kisClient.ts`,
`src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs`,
`src/pages/api/chart-ai/local-only-kis-current-price.json.ts`,
`src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts`,
`src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs`,
`src/lib/server/chart-ai/local-only-llm-model-policy.mjs`, `src/pages/chart-ai.astro`, or any KIS
provider candidate path. This phase makes no source feature change.

## 4. Env key names discovered from source

Read only from `src/lib/server/providers/kisClient.ts` (never from `.env`/`.env.local`):

- Required (`requiredEnvNames`): `KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL`
- Feature flag (`featureFlagEnvName`): `KIS_ENABLE_LIVE_QUOTES` -- must be the exact string `'true'`
- Optional, must be **absent** for quote-only scope (`optionalEnvNames`): `KIS_ACCOUNT_NO` -- its
  presence hard-blocks readiness with `production_not_allowed`
- Preview-only guard (not relevant to local runtime): `KIS_ENABLE_PREVIEW_LIVE_QUOTES`

## 5. Env presence boolean summary

From the owner diagnostic script's own Node process (invoked via `npm run
owner-diagnostic:phase-3gg-k-env-hf1`, same shell session as `npm run dev`):

- `KIS_APP_KEY` present: **true**
- `KIS_APP_SECRET` present: **true**
- `KIS_BASE_URL` present: **true**
- `KIS_ACCOUNT_NO` absent (required for quote-only scope): **true**

**Caveat**: this diagnostic script is a plain `node` process and does not itself load
`.env`/`.env.local` -- it only sees OS-level exported environment variables. The `npm run dev`
Astro/Vite dev server process loads `.env`/`.env.local` in addition to OS-level variables, so its
effective environment can differ from what this diagnostic observes. This is a real, sanitized
limitation of any boolean-only, `.env`-avoiding diagnostic and is called out explicitly rather than
assumed away.

## 6. KIS_ENABLE_LIVE_QUOTES true/false summary

`KIS_ENABLE_LIVE_QUOTES` exactly `'true'` in the diagnostic script's own process: **false**.

## 7. Dev server reachability

`npm run dev` was started and confirmed reachable at `http://localhost:4321/` (HTTP 200 on `/`)
before the diagnostic and owner smoke were run.

## 8. G-FAST current_price route result

Ran both:
- `npm run owner-diagnostic:phase-3gg-k-env-hf1 -- --owner-approved-kis-runtime-diagnostic --base-url=http://localhost:4321`
- `npm run owner-smoke:phase-3gg-g-fast -- --owner-approved-real-kis-smoke`

Both independently observed the same outcome from the local current_price route:
`sourceStatus: unavailable`, `sanitizedErrorCode: PROVIDER_UNAVAILABLE`. The dev server's own
request log (`[200] /api/chart-ai/local-only-kis-current-price.json 1ms`) shows a 1ms response
time, which is consistent with a fast-fail at the KIS readiness gate (config/flag check) rather
than an actual outbound network round trip to the KIS API (a real token + quote call would not
typically complete in 1ms). This sanitized timing signal, combined with the env presence findings
above, points to a readiness-gate rejection rather than a genuine provider network/auth failure.

## 9. H route result

`http://localhost:4321/api/chart-ai/local-only-kis-llm-summary.json?ownerLocalKisLlm=1&symbol=005930`
was reachable (HTTP 200, valid JSON shape) via the diagnostic script. Per this phase's scope (KIS
`current_price` runtime only), no LLM-layer field was inspected or reported.

## 10. sanitizedErrorCode

`PROVIDER_UNAVAILABLE` (from both the owner diagnostic and the G-FAST owner smoke).

## 11. sourceStatus

`unavailable`.

## 12. currentPricePresent / volumePresent

`currentPricePresent`: **false**. `volumePresent`: **false**.

## 13. Classification

**BLOCKED_ENV_MISSING**

Rationale: the owner diagnostic's own process observed all three required credential-shaped env
keys (`KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL`) present, but `KIS_ENABLE_LIVE_QUOTES` not
exactly `'true'`. In `kisClient.ts`'s readiness gate, this exact combination (`flagEnabled ===
false`) returns `reason: 'disabled'` before any network call is attempted, and the API route's
`fetchQuote` wrapper collapses *any* non-ok `kisClient` result -- including this readiness
rejection -- into the generic `PROVIDER_UNAVAILABLE` code. The 1ms response time observed in the
dev server log corroborates a fast readiness-gate rejection rather than a slow real network/auth
failure. This is the most parsimonious explanation given the available sanitized evidence, though
Section 5's caveat means the true root cause could also be `BLOCKED_DEV_SERVER_ENV_STALE` (the
flag being present in `.env`/`.env.local` but not effectively loaded by the running dev server
process, e.g. because the server was started before the flag was set, or from a different working
directory/session).

## 14. Owner-safe correction instructions

Do not paste any secret value into chat at any point during these steps.

1. Confirm `.env` or `.env.local` (in the project root) contains a line that sets
   `KIS_ENABLE_LIVE_QUOTES=true` (the exact string `true`, no quotes, no trailing content on that
   line). Do not share the file's contents -- only confirm the key/value shape locally.
2. Confirm the same file also has non-empty values for `KIS_APP_KEY`, `KIS_APP_SECRET`, and
   `KIS_BASE_URL`, and that `KIS_ACCOUNT_NO` is either absent or fully removed/commented out
   (its presence hard-blocks quote-only readiness regardless of the other settings).
3. Stop any running `npm run dev` process completely, then restart it fresh from the project root
   (`C:\Users\kkama\OneDrive\문서\Project\mk-stock-lab`) so the dev server reloads `.env`/`.env.local`
   from disk.
4. Re-run `npm run owner-diagnostic:phase-3gg-k-env-hf1 -- --owner-approved-kis-runtime-diagnostic
   --base-url=http://localhost:4321` and `npm run owner-smoke:phase-3gg-g-fast --
   --owner-approved-real-kis-smoke` and compare the reported `classification`/`sourceStatus`.
5. If `KIS_ENABLE_LIVE_QUOTES_exactly_true` is confirmed `true` after restart but the route still
   reports `unavailable`, this narrows the cause to `BLOCKED_PROVIDER_AUTH` or
   `BLOCKED_PROVIDER_NETWORK` (invalid/expired KIS credentials, or KIS base URL/network
   reachability) -- verify KIS app key/secret validity and local network access to the KIS host
   locally, without pasting values into chat, then repeat this ENV-HF1 phase.

## 15. Result doc summary table

| Field | Value |
| --- | --- |
| cwdIsProjectRoot | true |
| KIS_APP_KEY present | true |
| KIS_APP_SECRET present | true |
| KIS_BASE_URL present | true |
| KIS_ACCOUNT_NO absent | true |
| KIS_ENABLE_LIVE_QUOTES exactly true | false |
| Dev server reachable | true |
| G-FAST current_price route reachable | true |
| H route reachable | true |
| sourceStatus | unavailable |
| sanitizedErrorCode | PROVIDER_UNAVAILABLE |
| currentPricePresent | false |
| volumePresent | false |
| Classification | BLOCKED_ENV_MISSING |

## 16. Exposure status

- Credential exposure status: **Not exposed**
- Raw KIS payload exposure status: **Not exposed**
- Raw LLM response exposure status: **Not exposed**
- Prompt exposure status: **Not exposed**
- currentPrice numeric exposure status: **Not exposed**
- volume numeric exposure status: **Not exposed**

## 17. KIS endpoint expansion status

None. `current_price` only, unchanged from baseline.

## 18. Validation results

- `npm run owner-diagnostic:phase-3gg-k-env-hf1 -- --owner-approved-kis-runtime-diagnostic --base-url=http://localhost:4321`: ran, reported classification `BLOCKED_ENV_MISSING` (exit code 1, expected for a blocked outcome).
- `npm run owner-smoke:phase-3gg-g-fast -- --owner-approved-real-kis-smoke`: ran, reported `BLOCKED` with `sourceStatus=unavailable sanitizedErrorCode=PROVIDER_UNAVAILABLE` (exit code 1, expected).
- `npm run check:phase-3gg-k-env-hf1`: PASS (see commit log for count).
- `npm run check:phase-3gg-k-qa-owner-rerun`: PASS (regression).
- `npm run build`: succeeded.
- `git diff --check`: clean.

## 19. Push/deploy status

**Not pushed. Not deployed.**

## 20. Next recommended phase

Because this phase's classification is `BLOCKED_ENV_MISSING`, not `PASS_CURRENT_PRICE_READY`: the
owner should perform the safe local correction in Section 14, then **repeat Phase 3GG-K-ENV-HF1**
to confirm the current_price path reports `sourceStatus=ok`/`currentPricePresent=true`. Only after
a confirmed correction should Phase 3GG-K-QA-OWNER-RERUN-2 (Verify Success-path Summary Quality
After KIS Runtime Correction) run, followed by Phase 3GG-L-FAST.
