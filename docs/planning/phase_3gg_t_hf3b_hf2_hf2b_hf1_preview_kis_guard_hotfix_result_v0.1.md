# Phase 3GG-T-HF3B-HF2-HF2B-HF1 — Protected Preview KIS Access Guard Hotfix — Result v0.1

Narrow blocker hotfix: explicit chart loading on the protected Preview showed "실시간 시세 접근 권한을
확인하는 중입니다" even though authenticated search and transport worked. **No token implementation change,
no master/migration change, no env mutation, no Production deploy, no PR merge.**

## 1. Executive classification

`IMPLEMENTED_PUSHED_PREVIEW_READY_OWNER_CHART_QA_PENDING` (target
`PASS_PREVIEW_KIS_ACCESS_GUARD_AND_CHART_VERIFIED` after owner Preview QA). The demonstrated cause is fixed;
Preview KIS env is fully configured (§5), so the guard fix alone is expected to restore chart access.

## 2. Confirmed blocked stage

`CONFIRMED_PREVIEW_NODE_ENV_GUARD_COLLISION`. The OHLCV route reached the app (5 requests, HTTP 200), but
`evaluateProtectedPreviewBetaAccess` returned `production_fail_closed` because its guard short-circuited on
`nodeEnv === 'production'` — and a deployed Vercel Preview legitimately runs with `VERCEL_ENV=preview` +
`NODE_ENV=production`. So the route returned a sanitized `blocked` response at the access-guard stage
(`ohlcv.json.ts` line: `!betaAccess.allowed && !prodBetaAccess.allowed → blocked`). The client mapped every
`sourceStatus === 'blocked'` to one ambiguous "access rights" message.

## 3. Token lifecycle reached?

**No — `TOKEN_LIFECYCLE_NOT_REACHED`.** The beta guard denied access before `fetchUniversalOhlcv`, so KIS
readiness, the durable token manager, and the KIS endpoint were never invoked. Token expiry is NOT the
cause and is NOT diagnosed.

## 4. Guard collision result + code fix

`evaluateProtectedPreviewBetaAccess` is now **VERCEL_ENV-authoritative**, mirroring kisClient's
`classifyRuntime` (which was already correct — VERCEL_ENV before NODE_ENV, so KIS readiness had no
collision). New precedence: (1) `VERCEL_ENV=production` → fail closed; (2) `VERCEL_ENV=preview` → require the
owner flag + query, then allow (NODE_ENV irrelevant); (3) any other non-empty `VERCEL_ENV` → not_preview_env;
(4) absent `VERCEL_ENV` + `NODE_ENV=production` → fail closed; (5) otherwise not_preview_env. An explicit
comment records that NODE_ENV is the build/runtime mode and must not override an explicit `VERCEL_ENV=preview`.
Production, Supabase auth, the owner flag, the query opt-in, Vercel SSO, and KIS readiness are unchanged.

Guard matrix (all six Section-3 cases): PASS — case 1 (preview + NODE_ENV=production) now **allowed**; Vercel
Production and non-Vercel node-production still **denied**; flag + query remain mandatory.

## 5. KIS Preview readiness

Read-only `vercel env ls preview` (names/scopes only, no values): `CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA`,
`KIS_ENABLE_PREVIEW_LIVE_QUOTES`, `KIS_ENABLE_LIVE_QUOTES`, `KIS_BASE_URL`, `KIS_APP_SECRET`, `KIS_APP_KEY` —
all **present in the Preview scope**. `KIS_ACCOUNT_NO` — **absent** (correct for the quote-only scope). No
env change required; not a `BLOCKED_PREVIEW_KIS_ENV_CONFIGURATION` case.

## 6. Sanitized stage classification

The OHLCV route now returns coarse, non-secret codes and a KIS readiness pre-check **before** any
provider/token work: `PREVIEW_BETA_GUARD_BLOCKED` (beta opt-in present but guard denied) vs
`NON_LOCAL_REQUEST`; then `KIS_PREVIEW_GUARD_REQUIRED` / `KIS_DISABLED` / `KIS_CONFIG_MISSING` from the
readiness reason; then `KIS_PROVIDER_UNAVAILABLE` (provider failure after ready) / `NO_DATA` / `NONE`. Coarse
fixed-enum headers `X-MK-Chart-AI-Access-Stage` (GUARD_BLOCKED | GUARD_ALLOWED | READINESS_BLOCKED | PROVIDER
| OK) and `X-MK-KIS-Readiness-State` (the readiness reason enum) — no env values, tokens, cookies, identities,
or raw provider payloads. The client maps each code to an honest Korean message; `blocked` is no longer an
ambiguous access-rights catch-all. This diagnostic metadata is confined to the read-only Chart AI OHLCV
route (never account/order/balance).

## 7. Token result

Not observed (guard blocked before the token lifecycle). The durable KIS token manager, `kisClient`, and
`kisTokenStore` are **byte-for-byte unchanged**; emergency refresh stays disabled. `TOKEN_EXPIRY_CONFIRMED`
is NOT claimed.

## 8. Tests

- `smoke:phase-3gg-t-hf3b-hf2-hf2b-hf1` — 24/24 (guard matrix incl. the collision, VERCEL_ENV precedence,
  mandatory flag/query, Production always denied; route access-stage + readiness→code decision tables; the
  guard/readiness-before-provider ordering invariant).
- `check:phase-3gg-t-hf3b-hf2-hf2b-hf1` — guard precedence + comment, route sanitized codes/headers +
  readiness-before-provider ordering, client honest-message mapping (no access-rights catch-all, no env
  names in UI copy), and immutability of kisClient/token store/engine/master/migrations.
- Regression: HF2B/HF2A3/HF2A2/HF3B-HF2/HF3B-HF4C/HF3A + auth/security + durable-KIS-token checkers,
  `npm ls`, `astro build`, `git diff --check`.

## 9. Git / safety

Implementation commit `Phase 3GG-T-HF3B-HF2-HF2B-HF1: fix protected Preview KIS access guard`; docs-only
verification commit only after a real Preview PASS. Feature branch pushed (no main push/force/merge/
auto-merge). No token implementation change, no env mutation, no Supabase/DB change, no master/migration
change, no dependency install, no Production deploy.

## 10. Preview verification — recorded after owner QA

On `…/chart-ai?chartAiBetaPreview=1` (signed in): search 069500 → select → explicit chart load → guard
allowed, instrument KR|069500|KOSPI|etf, candles > 1, sourceStatus=ok, sanitizedErrorCode=NONE, chart
renders; then Similarity once (HF2B result UI). Regression 005930 / AAPL / 0000D0. Record OHLCV + Similarity
request counts, cache states, additional KIS token issuance count, token source, runtime errors. HF2A3 search
transport must remain healthy; no Production deploy.

## 11. Resume point

After chart access is verified, resume **Phase 3GG-T-HF3B-HF2-HF2B** owner Similarity UX QA, then
**Phase 3GG-T-HF3B-HF2-PREMERGE-FINALIZATION**.
