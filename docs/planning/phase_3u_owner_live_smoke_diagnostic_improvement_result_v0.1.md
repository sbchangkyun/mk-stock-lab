# Phase 3U Owner Live Smoke Diagnostic Improvement Result v0.1

## 1. Status And Scope

Phase 3U improved the owner-run persistent quote cache live smoke harness to produce specific, labeled, sanitized diagnostic output at each major boundary instead of collapsing all unexpected failures into the broad `UNEXPECTED_SAFE_FAILURE` code.

This is an implementation and dry-run validation phase only. Claude Code did not rerun the live smoke, did not connect to Supabase, did not execute SQL, did not use Supabase MCP database tools, did not list projects, did not touch production DB, did not read ignored `.env*` contents, did not mutate Vercel environment values, and did not deploy.

Persistent adapter live enablement remains not passed. UI live quote wiring remains blocked. A future owner manual live retry is the recommended next action as a separate approved phase.

## 2. Baseline Before Phase 3U

- Phase 3T documented the owner-provided sanitized Phase 3S live smoke failure.
- The owner manually ran the Phase 3S live smoke.
- The harness entered live-approved mode and logged `liveSupabase=true` and `backupRiskAccepted=true`.
- The harness then failed with `UNEXPECTED_SAFE_FAILURE`.
- No labeled step output was produced after the initial live-approved log lines.
- Whether any precheck read, write/upsert, readback, fresh/stale classification, failure metadata update, cleanup, or restore succeeded could not be concluded.
- Static Phase 3T diagnosis identified the broad failure boundary as setup/import/config/client-construction code after the backup-risk log line.
- A specific static risk was identified: the owner-run Node harness imports `src/lib/server/supabaseAdmin.ts` compiled to JS outside the Astro runtime, while that helper resolved `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` only through `import.meta.env`, which is unavailable in Node.js.
- The owner-provided runtime presence check confirmed all three required Supabase config names (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) were absent from the local runtime `process.env`.

## 3. Phase 3T Failure Recap

The Phase 3S harness emitted:

```text
phase3s mode=live-approved liveSupabase=true backupRiskAccepted=true
phase3s backupRiskNote=production-backup-pitr-snapshot-may-be-unavailable-owner-risk-acceptance-required
phase3s status=failed code=UNEXPECTED_SAFE_FAILURE sanitized=true
```

The broad `UNEXPECTED_SAFE_FAILURE` was emitted by the top-level `.catch()` handler, meaning an unhandled exception escaped `main()` after the two initial log lines. With the Phase 3S harness, the following boundaries were indistinguishable: filesystem/compile setup, adapter dynamic import, admin module dynamic import, Supabase config presence check, client construction, precheck read, and any later smoke step. The owner had no way to determine which specific boundary failed.

With the owner's config names absent from `process.env` and `import.meta.env` unavailable in Node.js, `getSupabaseAdminClient()` would have thrown `'Supabase server configuration is missing.'` at `isSupabaseServerConfigured()` check. This throw propagated to the top-level catch, producing `UNEXPECTED_SAFE_FAILURE`.

## 4. What Was Implemented

### `scripts/owner_smoke_persistent_quote_cache_live.mjs`

The harness was restructured to emit labeled sanitized step output at every major boundary. Output prefix changed from `phase3s` to `phase3u`.

A new `logStep(step, status, extra)` helper builds structured step lines:
```text
phase3u step=<step-name> status=<started|passed|failed> [key=value ...] sanitized=true
```

Added `checkLiveConfigPresence()`, which checks only whether the required config names are present in `process.env`. It never reads, compares, prints, or returns config values.

Added `runDryRunSimulations()`, which logs simulation results after a successful dry-run mock smoke to validate that guard detection, config presence detection, and identity validation logic work correctly.

Updated `logSafe` to emit a `SAFE_OUTPUT_BLOCKED` step notice via `console.log` before throwing, ensuring the owner sees a named failure rather than a silent throw cascading to `UNEXPECTED_SAFE_FAILURE`.

The top-level `.catch()` handler now uses `console.log` directly (not `logSafe`) to emit `UNEXPECTED_SAFE_FAILURE`, preventing any risk of re-throwing.

### `src/lib/server/supabaseAdmin.ts`

Added `process.env` fallback for `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`:

```typescript
const getSupabaseUrl = () =>
  getImportMetaEnv().PUBLIC_SUPABASE_URL ?? process.env['PUBLIC_SUPABASE_URL'];
const getSupabaseAnonKey = () =>
  getImportMetaEnv().PUBLIC_SUPABASE_ANON_KEY ?? process.env['PUBLIC_SUPABASE_ANON_KEY'];
```

`SUPABASE_SERVICE_ROLE_KEY` already had a `process.env` fallback and was not changed.

In Astro runtime: `import.meta.env.*` is populated and takes precedence — no behavior change.
In Node.js harness: `import.meta.env` is unavailable; `getImportMetaEnv()` returns `{}`; `process.env` fallback applies.
In browser: `assertServerRuntime()` throws before any config access — no change.

## 5. Diagnostic Label Policy

All step labels use the prefix `phase3u` and the format:
```text
phase3u step=<step-name> status=<started|passed|failed> [key=value ...] sanitized=true
```

Step names emitted in execution order:

| Step | Description |
|---|---|
| `guard-check` | Evaluates whether all required live guard env vars are present with exact expected values |
| `smoke-identity-validation` | Validates `PHASE_3S_SMOKE_MARKET` and `PHASE_3S_SMOKE_SYMBOL`; uses synthetic identity in dry-run if missing |
| `runtime-setup` | Creates isolated temp directory and compiles TypeScript source files to JS |
| `adapter-import` | Dynamic import of the compiled persistent cache adapter module |
| `admin-import` | Dynamic import of the compiled Supabase admin helper (live) or mock stub injection (dry-run) |
| `config-preflight` | Checks presence of required config names in `process.env`; run after admin import, before client construction |
| `client-construction` | Calls `getSupabaseAdminClient()` to build the live Supabase client (live) or injects mock (dry-run) |
| `precheck-read` | Reads any existing cache row for the smoke key before writing |
| `existing-row-snapshot` | Informational: reports whether a pre-existing row was found |
| `success-write` | Writes a normalized public quote snapshot via the persistent adapter |
| `fresh-readback` | Reads back the written row and verifies `state === 'fresh'` |
| `stale-readback` | Reads back with simulated time offset and verifies `state === 'stale-but-usable'` |
| `failure-metadata-write` | Writes sanitized refresh-failure metadata via the persistent adapter |
| `cleanup-restore` | Restores the original row if one existed, or deletes the smoke-created row if not |
| `final-result` | Summary of overall smoke pass or fail |
| `dry-run-guard-sim` | (Dry-run only) Confirms that live guards are absent and dry-run mode was correctly selected |
| `dry-run-config-sim` | (Dry-run only) Reports whether config names are absent from `process.env` (would emit `CONFIG_MISSING` in live mode) |
| `dry-run-identity-sim` | (Dry-run only) Confirms that invalid-identity detection returns an error |

Safe failure codes used in failed step lines:

| Code | Step |
|---|---|
| `GUARD_NOT_APPROVED` | (not emitted; absence of live guards → dry-run mode) |
| `SMOKE_IDENTITY_INVALID` | `smoke-identity-validation` in live mode with invalid market/symbol |
| `CONFIG_MISSING` | `config-preflight` when required names absent from `process.env` |
| `RUNTIME_SETUP_FAILED` | `runtime-setup` on filesystem or compile failure |
| `ADAPTER_IMPORT_FAILED` | `adapter-import` on dynamic import failure |
| `ADMIN_IMPORT_FAILED` | `admin-import` on dynamic import failure (live only) |
| `CLIENT_CONSTRUCTION_FAILED` | `client-construction` if `getSupabaseAdminClient()` throws despite config present |
| `PRECHECK_READ_FAILED` | `precheck-read` on Supabase read error or thrown exception |
| `SUCCESS_WRITE_FAILED` | `success-write` on adapter write error |
| `FRESH_READBACK_FAILED` | `fresh-readback` if readback fails or state is not `fresh` |
| `STALE_READBACK_FAILED` | `stale-readback` if readback fails or state is not `stale-but-usable` |
| `FAILURE_METADATA_WRITE_FAILED` | `failure-metadata-write` on adapter error |
| `CLEANUP_RESTORE_FAILED` | `cleanup-restore` on restore or delete failure |
| `SAFE_OUTPUT_BLOCKED` | `safe-output-guard` if an internal message matched the forbidden pattern |
| `UNEXPECTED_SAFE_FAILURE` | `unexpected-catch` — last-resort only; no labeled step should reach this in normal operation |

## 6. Config Preflight Policy

`checkLiveConfigPresence()` in the harness checks:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

It uses `Boolean(process.env[name])` for each name. It never reads, prints, compares, or returns config values. It returns `true` only when all three names are present and non-empty. It returns `false` otherwise and the harness emits `phase3u step=config-preflight status=failed code=CONFIG_MISSING sanitized=true`, sets `exitCode = 1`, and returns before `getSupabaseAdminClient()` is called.

With the owner's confirmed runtime where all three names are absent, a future live run in that same state will emit `CONFIG_MISSING` rather than `UNEXPECTED_SAFE_FAILURE`. The owner will know the exact corrective action: set the required config names in the runtime environment before retrying.

## 7. Node Harness / Astro Runtime Boundary Handling

`src/lib/server/supabaseAdmin.ts` now resolves `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` with a `process.env` fallback after `import.meta.env`:

```typescript
const getSupabaseUrl = () =>
  getImportMetaEnv().PUBLIC_SUPABASE_URL ?? process.env['PUBLIC_SUPABASE_URL'];
const getSupabaseAnonKey = () =>
  getImportMetaEnv().PUBLIC_SUPABASE_ANON_KEY ?? process.env['PUBLIC_SUPABASE_ANON_KEY'];
```

This change is safe because:
- Astro runtime: `import.meta.env.*` is populated and takes precedence; `process.env` fallback is not reached.
- Node.js harness: `import.meta.env` is unavailable; `getImportMetaEnv()` returns `{}`; `{}['PUBLIC_SUPABASE_URL']` is `undefined`; `process.env` fallback applies.
- Browser: `assertServerRuntime()` throws before any config access occurs; no config values reach the browser.
- No config values are printed or exposed by this change.
- Build behavior in Astro is unchanged.

The owner must set `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in the local runtime environment (not in `.env*` files, but as runtime env vars) before a future live smoke retry can proceed past `config-preflight`.

## 8. Fail-Closed Live Mode Preservation

All six required live approval guards remain unchanged:

- `QUOTE_CACHE_BACKEND=supabase`
- `PHASE_3S_LIVE_SMOKE=OWNER_APPROVED`
- `PHASE_3S_TARGET_CONFIRMED=production-or-controlled-runtime-confirmed`
- `PHASE_3S_BACKUP_RISK_ACCEPTED=OWNER_ACCEPTS_CURRENT_RISK`
- `PHASE_3S_SMOKE_MARKET=<owner-selected-market>`
- `PHASE_3S_SMOKE_SYMBOL=<owner-selected-symbol>`

If any guard is missing or incorrect, the harness runs dry-run mode with a mock Supabase client. The live Supabase admin helper is imported only after all guards pass. The config preflight runs only after all guards pass and the admin module is imported. `getSupabaseAdminClient()` is called only after config preflight passes. No weakening of existing guards was introduced.

## 9. Dry-Run / Mock Validation Behavior

Dry-run mode remains unchanged in behavior:

- Does not require approval flags.
- Does not import the live Supabase admin helper (a mock stub is injected instead).
- Does not read ignored `.env*` files.
- Does not connect to Supabase.
- Does not execute SQL.
- Uses a mock Supabase client with in-memory rows.
- Writes and reads only mock rows, verifying fresh and stale-but-usable classification.
- Verifies cleanup by deleting the mock smoke row.

After a successful dry-run, `runDryRunSimulations()` emits three additional simulation steps:

- `dry-run-guard-sim`: confirms live guards are absent and dry-run mode was correctly entered.
- `dry-run-config-sim`: calls `checkLiveConfigPresence()` and reports `wouldEmitConfigMissing=true` (confirming the config names are absent in the current environment and a live run would emit `CONFIG_MISSING` rather than `UNEXPECTED_SAFE_FAILURE`).
- `dry-run-identity-sim`: validates that `validateIdentity({ market: 'INVALID', symbol: '' })` returns an error (confirming `SMOKE_IDENTITY_INVALID` detection works).

## 10. Explicit Non-Goals

Phase 3U did not:

- rerun the live smoke
- run live Supabase reads or writes
- execute SQL
- run Supabase CLI
- run psql
- use Supabase MCP database tools
- list projects
- touch production DB
- read ignored `.env*` files
- run live KIS calls
- run OpenDART, OpenAI, Gemini, or other provider calls
- implement UI live quote wiring
- connect Market, Portfolio, Chart AI, Home, or Lab to live quote data
- mutate Vercel environment values
- deploy
- modify root `README.md`
- modify migration files
- modify production SQL pack files
- change normalized payload policy
- add raw provider payload storage
- change cache semantics
- weaken existing fail-closed live guards
- weaken server-only or provider boundary checks
- record project refs, Supabase URLs, keys, tokens, connection strings, screenshots, raw DB errors, or stack traces

## 11. Files Changed

- `scripts/owner_smoke_persistent_quote_cache_live.mjs`
- `src/lib/server/supabaseAdmin.ts`
- `docs/planning/phase_3u_owner_live_smoke_diagnostic_improvement_result_v0.1.md`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`

## 12. Validation Performed

- `npm run smoke:persistent-quote-cache-live:dry`: passed.
- `node scripts/smoke_persistent_quote_cache_adapter.mjs`: passed.
- `node scripts/smoke_quote_cache_policy.mjs`: passed.
- `node scripts/smoke_market_quote_route_disabled.mjs`: passed.
- `npm run check:provider-boundaries`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Vercel output artifacts exist: `.vercel/output/config.json`, `.vercel/output/functions/_render.func`, and `.vercel/output/static`.
- Browser/static output scan for provider secret markers and server-only markers: no matches.
- Static source review confirmed no root `README.md`, migration file, production SQL pack, Vercel env, deployment, or UI live quote wiring changes were made.
- Dry-run output confirmed all step labels are present and sanitized, `dry-run-config-sim` reports `wouldEmitConfigMissing=true` (confirming `CONFIG_MISSING` would now be emitted on a live run with absent config), and cleanup-restore label appears.

## 13. Remaining Risks

- Config names (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) were confirmed absent from the owner's local runtime `process.env`. A future live retry will fail at `config-preflight` with `CONFIG_MISSING` rather than `UNEXPECTED_SAFE_FAILURE`. The owner must set these names in the runtime environment before retrying.
- Live adapter enablement remains not passed. It is still unknown whether any precheck read, write/upsert, readback, fresh/stale classification, failure metadata update, cleanup, or restore would succeed under correctly configured runtime.
- The production migration status is based on owner-provided sanitized Phase 3Q evidence; Claude Code did not independently inspect production.
- UI live quote wiring remains blocked until a live smoke retry passes separately.

## 14. Recommended Next Action

Owner reviews this document and the updated harness. If approved, the owner manually runs a live smoke retry as a separate Phase 3V (or equivalent result phase), after:

1. Confirming the runtime target outside chat and docs.
2. Setting `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` as runtime environment variables (not in `.env*` files, which are ignored).
3. Setting all six Phase 3S approval guards.
4. Running `node scripts/owner_smoke_persistent_quote_cache_live.mjs`.
5. Recording only sanitized step-by-step pass/fail results in the result phase document.

Do not rerun the live smoke until this phase is reviewed and the owner confirms the runtime environment has been corrected.

## Minimal Korean Owner Review Checklist

```text
Phase 3U Owner Live Smoke Diagnostic Improvement 검토 결과:

* owner live smoke harness에 단계별 sanitized diagnostic label이 추가됨: 통과/실패
* `UNEXPECTED_SAFE_FAILURE`가 last-resort fallback으로 축소됨: 통과/실패
* setup/import/config/client-construction/precheck/write/readback/cleanup 실패 구간이 구분됨: 통과/실패
* config preflight가 값 노출 없이 존재 여부만 검증함: 통과/실패
* Node harness와 Astro `import.meta.env` 경계가 안전하게 개선됨: 통과/실패/해당 없음
* live mode fail-closed guard가 유지됨: 통과/실패
* dry-run/mock validation이 통과함: 통과/실패
* Claude Code가 live smoke를 재실행하지 않음: 통과/실패
* Claude Code가 live Supabase query/write를 실행하지 않음: 통과/실패
* Claude Code가 SQL/Supabase MCP DB query/project listing을 실행하지 않음: 통과/실패
* production DB가 Claude Code에 의해 접근/변경되지 않음: 통과/실패
* `.env*` 파일 내용이 읽히지 않음: 통과/실패
* project ref/URL/key/token/connection string/screenshot/raw error/stack trace가 기록되지 않음: 통과/실패
* UI live quote wiring이 계속 차단됨: 통과/실패
* 다음 단계가 별도 owner-approved live retry/result phase임: 통과/실패
* 비밀 정보 없는 메모:
```
