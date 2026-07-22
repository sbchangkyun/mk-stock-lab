# Phase 3S Persistent Quote Cache Enablement Smoke Harness Result v0.1

## Status And Scope

Phase 3S prepared an owner-run persistent Supabase quote cache enablement and API smoke harness.

The harness is fail-closed. Codex validated only dry-run/mock mode. Codex did not run live Supabase reads or writes, did not execute SQL, did not use Supabase MCP database tools, did not list projects, did not touch production DB, did not run live KIS calls, did not mutate Vercel environment values, and did not deploy.

Live UI quote wiring remains blocked.

## Baseline Before Phase 3S

- Phase 3Q recorded that the owner manually applied the persistent quote cache lifecycle migration to production using sanitized pass/fail evidence.
- Phase 3R implemented a disabled-by-default server-only persistent Supabase quote cache adapter.
- Memory cache remained the default backend.
- Supabase persistent cache could only be selected with `QUOTE_CACHE_BACKEND=supabase`.
- Phase 3R validation was mock/static only.

## What Was Implemented

- Added `scripts/owner_smoke_persistent_quote_cache_live.mjs`.
- Added `npm run smoke:persistent-quote-cache-live:dry`.
- The owner-run harness validates:
  - backend opt-in guard presence
  - smoke identity validation
  - normalized cache key generation
  - normalized quote snapshot success write
  - persistent adapter readback
  - fresh classification
  - stale-but-usable classification
  - sanitized refresh-failure metadata update
  - cleanup or restore behavior
- Dry-run mode transpiles the required server-only adapter files into an ignored `.astro` temporary directory and injects a mock Supabase client.
- Live mode transpiles the same server-only adapter files and imports the existing server-only Supabase admin helper only after all owner approval guards pass.

## Owner-Run Live Smoke Boundary

The script does not run live mode unless every required guard is present with the exact expected value. If any guard is missing or different, it runs dry-run/mock mode and does not access Supabase.

The script never prints environment values. It prints sanitized pass/fail lines only.

The live smoke is an owner-run operational check. It is not a Codex validation step.

## Required Owner Approval Flags

Live mode requires all of these runtime flags:

- `QUOTE_CACHE_BACKEND=supabase`
- `PHASE_3S_LIVE_SMOKE=OWNER_APPROVED`
- `PHASE_3S_TARGET_CONFIRMED=production-or-controlled-runtime-confirmed`
- `PHASE_3S_BACKUP_RISK_ACCEPTED=OWNER_ACCEPTS_CURRENT_RISK`
- `PHASE_3S_SMOKE_MARKET=<owner-selected-market>`
- `PHASE_3S_SMOKE_SYMBOL=<owner-selected-symbol>`

`PHASE_3S_SMOKE_MARKET` must be one of `KR`, `US`, or `GLOBAL`. `PHASE_3S_SMOKE_SYMBOL` must be a short uppercase alphanumeric market symbol with optional dot or hyphen.

The smoke market and symbol are required in live mode so the script does not hard-code a fake security that could pollute future UI behavior.

## Dry-Run/Mock Validation Behavior

Dry-run mode:

- does not require approval flags
- does not import the live Supabase admin helper
- does not read ignored `.env*` files
- does not connect to Supabase
- does not run SQL
- does not call KIS
- uses a mock Supabase client
- writes and reads only mock in-memory rows
- verifies cleanup by deleting the mock smoke row

## Live Smoke Execution Order For Owner

Owner live smoke sequence:

1. Confirm the runtime target outside chat and docs.
2. Confirm backup/rollback posture and current risk acceptance outside chat and docs.
3. Configure required Supabase runtime environment values privately in the selected runtime.
4. Set all Phase 3S guard flags.
5. Set `PHASE_3S_SMOKE_MARKET` and `PHASE_3S_SMOKE_SYMBOL`.
6. Run `node scripts/owner_smoke_persistent_quote_cache_live.mjs`.
7. Record only sanitized pass/fail results in a future result phase.
8. Do not paste project refs, URLs, keys, tokens, connection strings, screenshots, raw errors, or stack traces.

## Cleanup/Restore Strategy

The harness:

1. Builds the normalized cache key for the owner-selected smoke identity.
2. Reads any existing row for that key.
3. Writes a normalized public quote snapshot through the persistent adapter.
4. Reads the row back through the persistent adapter.
5. Verifies fresh and stale-but-usable classification using deterministic time offsets.
6. Writes sanitized refresh-failure metadata.
7. Restores the original row if one existed.
8. Deletes the smoke-created row if no original row existed.
9. Prints sanitized cleanup status.

## Normalized Payload Policy

The smoke payload uses normalized public quote snapshot fields only:

- `market`
- `symbol`
- `price`
- `currency`
- `change`
- `changePct`
- `volume`
- `marketState`
- `asOf`
- `staleState`
- `providerMeta.provider`
- `providerMeta.source`

No raw KIS provider payload is used.

## Forbidden Persistence And Output Data

The harness must not persist or print:

- raw KIS payloads
- provider headers
- authorization headers
- app keys
- access tokens
- refresh tokens
- service-role keys
- anon keys
- account numbers
- raw DB errors
- stack traces
- Supabase URLs
- project refs
- connection strings
- DB passwords
- JWT secrets
- user IDs
- portfolio IDs
- position IDs
- screenshots

## Backup Risk Note

Phase 3Q recorded that the production project was on Free Plan when the owner performed the migration and that dashboard-native backup/PITR/snapshot was unavailable at execution time.

The Phase 3S live smoke requires `PHASE_3S_BACKUP_RISK_ACCEPTED=OWNER_ACCEPTS_CURRENT_RISK` so the owner explicitly acknowledges the current backup/rollback posture before live write validation.

## Explicit Non-Goals

Phase 3S did not:

- execute live Supabase reads or writes by Codex
- execute SQL
- run Supabase CLI
- run psql
- use Supabase MCP database tools
- list projects
- touch production DB
- run live KIS calls
- run OpenDART, OpenAI, Gemini, or other provider calls
- implement UI live quote wiring
- connect Market, Portfolio, Chart AI, Home, or Lab to live quote data
- mutate Vercel environment values
- deploy
- modify root `README.md`
- modify migration files
- modify production SQL pack files
- implement account, order, balance, holdings, trading, or WebSocket APIs
- implement visitor count
- implement ad-event tracking
- scrape or download external assets

## Validation Performed

- `npm run smoke:persistent-quote-cache-live:dry`: passed.
- `node scripts/smoke_persistent_quote_cache_adapter.mjs`: passed.
- `node scripts/smoke_quote_cache_policy.mjs`: passed.
- `node scripts/smoke_market_quote_route_disabled.mjs`: passed.
- `npm run check:provider-boundaries`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Browser/static output scan for provider secret markers and server-only markers: no matches.
- Vercel output artifacts exist: `.vercel/output/config.json`, `.vercel/output/functions/_render.func`, and `.vercel/output/static`.
- Scope checks confirmed no root `README.md`, migration file, production SQL pack, Vercel env, deployment, or UI live quote wiring changes.

## Files Changed

- `package.json`
- `scripts/owner_smoke_persistent_quote_cache_live.mjs`
- `docs/planning/phase_3s_persistent_quote_cache_enablement_smoke_harness_result_v0.1.md`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`

## Remaining Risks

- Live persistent cache behavior is not validated by Codex.
- Owner live smoke can mutate one `market_quote_cache` row for the selected smoke key before cleanup/restore runs.
- If cleanup fails in live mode, owner must inspect and correct the selected smoke key manually without sharing secrets or project identifiers.
- UI live quote wiring remains blocked until live adapter smoke is completed and recorded separately.

## Recommended Next Action

Owner manually runs the live smoke only after confirming the runtime target and backup/risk posture. Record sanitized pass/fail results in a separate Phase 3T result phase before considering any UI live quote wiring.

## Minimal Korean Owner Review Checklist

```text
Phase 3S Persistent Quote Cache Enablement Smoke Harness 검토 결과:

* owner-run persistent adapter live smoke harness가 준비됨: 통과/실패
* live smoke가 fail-closed 방식으로 구현됨: 통과/실패
* live smoke 실행 시 owner approval flags가 필요함: 통과/실패
* dry-run/mock validation이 통과함: 통과/실패
* Codex가 live Supabase query/write를 실행하지 않음: 통과/실패
* Codex가 SQL/Supabase MCP DB query/project listing을 실행하지 않음: 통과/실패
* production DB가 Codex에 의해 접근/변경되지 않음: 통과/실패
* smoke payload가 normalized public quote snapshot으로 제한됨: 통과/실패
* raw KIS payload/token/key/header/account data가 저장/출력되지 않음: 통과/실패
* cleanup/restore 전략이 문서화됨: 통과/실패
* UI live quote wiring이 아직 구현되지 않음: 통과/실패
* Vercel env 변경 및 deployment가 없음: 통과/실패
* 다음 단계가 owner manual live smoke 실행/결과 기록임: 통과/실패
* 비밀 정보 없는 메모:
```
