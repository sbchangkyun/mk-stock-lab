# Phase 3GG-D-FAST — Local-only Live KIS Minimal End-to-End, Single Market Endpoint, No Public Route — Result v0.1

## 1. Status

Status: Implemented.

## 2. Purpose

Move from the completed Phase 3GG-D scaffold (all gates off, no live call) directly to a minimal local-only Live KIS read-only market-data implementation: a local-only guard, a credential presence layer (server-only, boolean/masked only), a single approved endpoint allowlist (`current_price`), a rate limiter, a 300-second cache, one approved KIS market-data endpoint call (delegated to the existing, already-verified `kisClient.ts` transport), a sanitizer, and minimal safe logging.

## 3. Baseline

Baseline: cdd9bd18a6b8993d8a9320b2c7a80c5d6bb5b110

- Baseline: `cdd9bd18a6b8993d8a9320b2c7a80c5d6bb5b110` (Phase 3GG-D).
- Latest completed phase before this phase: Phase 3GG-D — Local-only Live KIS Provider Binding Scaffold, All Gates Off, No Live Call.
- Branch: `rebuild/phase-1-ia-shell`.
- This phase supersedes/extends Phase 3GG-D's design going forward: Phase 3GG-D's scaffold established the flag/type shape with every gate off; Phase 3GG-D-FAST replaces that scaffold's `current_price` path with a real, working, local-only, single-endpoint implementation, while leaving Phase 3GG-D's own files untouched.

## 4. Files created

- `src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs` — pure, dependency-free orchestration module (local-only guard, endpoint allowlist, credential presence check, rate limiter, 300s cache, timeout-wrapped injectable transport call, sanitizer, logger).
- `src/lib/server/chart-ai/local-only-live-kis-market-data-binding.fixture.mjs` — deterministic fixtures (fake transports, fixture inputs) for smoke reuse.
- `scripts/smoke_phase_3gg_d_fast_local_only_live_kis_market_data.mjs` — smoke script covering all 11 required cases, including one real-transport-wired local call attempt against the actual `kisClient.ts`.
- `scripts/check_phase_3gg_d_fast_contract.mjs` — static contract checker.
- `docs/planning/phase_3gg_d_fast_local_only_live_kis_market_data_result_v0.1.md` (this document).

## 5. Files modified

- `package.json` (new `smoke:phase-3gg-d-fast` and `check:phase-3gg-d-fast` script entries).
- `docs/planning/planning_changelog.md` (new `## Phase 3GG-D-FAST - 2026-07-10` entry prepended above the Phase 3GG-D entry).

**No existing KIS provider module was modified.** No `chart-ai.astro` change. No API route created or activated. No scaffold source (Phase 3GG-D files) changed. No lockfile change.

## 6. Endpoint selected

Single approved endpoint category: **`current_price`**, delegating transport to the existing, already-verified `kisClient.getKisQuoteSnapshot()` / `getKisDomesticQuoteSnapshot()` (KR domestic quote, `FHKST01010100`, `/uapi/domestic-stock/v1/quotations/inquire-price`). Preferred symbol for smoke validation: Samsung Electronics `005930`. No other endpoint category is reachable through this phase's allowlist; `ALLOWED_ENDPOINT_CATEGORIES` contains exactly one entry.

## 7. Local-only guard summary

`evaluateLocalOnlyGuard` allows only `hostname` values `localhost`, `127.0.0.1`, or `::1`, and additionally blocks the request if `VERCEL_ENV`/`VERCEL` env signals a deployed runtime or `NODE_ENV === 'production'`. Non-local hostnames (e.g. `example.com`, `my-app.vercel.app`) fail closed with `sanitizedErrorCode: NON_LOCAL_REQUEST` before any credential check, rate-limit check, or provider call occurs.

## 8. Credential handling summary

Credential presence is checked only via an injected `hasEnvValue(name)` boolean predicate inside `evaluateCredentialPresence` — the binding module itself never imports `process.env`, `dotenv`, or any file-reading primitive, and never receives or returns an actual credential value. Missing `KIS_APP_KEY`/`KIS_APP_SECRET`/`KIS_BASE_URL` fails closed with `sanitizedErrorCode: MISSING_CREDENTIAL`. No credential value was printed, logged, written to a result document, written to the changelog, committed, or exposed to client code anywhere in this phase.

## 9. Endpoint allowlist summary

`evaluateEndpointAllowlist` rejects every forbidden category (`order`, `cancel_order`, `modify_order`, `account`, `balance`, `funds`, `buying_power`, `sellable_quantity`, `profit_loss`, `deposit_withdrawal`, `trading_history`, `portfolio_holdings`, `personal`) with `sanitizedErrorCode: ENDPOINT_FORBIDDEN`, and rejects any category outside the single-entry allowlist with `sanitizedErrorCode: ENDPOINT_NOT_ALLOWLISTED`. No order endpoint. No cancel/modify order endpoint. No account endpoint. No balance endpoint. No funds endpoint. No buying power endpoint. No sellable quantity endpoint. No profit/loss endpoint. No deposit/withdrawal endpoint. No trading history endpoint. No portfolio/holdings endpoint. No personal endpoint is reachable anywhere in this module.

## 10. Rate limit and cache summary

Rate limit: 5/minute, 30/hour, 100/day (`DEFAULT_RATE_LIMIT_POLICY`), enforced by `createRateLimiter` before cache lookup; excess requests block with `sanitizedErrorCode: RATE_LIMITED` and are never queued. Cache: 300-second TTL (`DEFAULT_CACHE_TTL_MS`), enforced by `createQuoteCache`; cache lookup runs before any provider call (cache-before-call), and a cache hit returns without invoking the transport at all. Cache keys are built from `category:symbol` only — no PII, session, JWT, cookie, or email data.

## 11. Provider call and timeout summary

The provider call is delegated to an injectable `fetchQuote({ symbol, category })` transport, wrapped in an explicit outer timeout (`DEFAULT_CALL_TIMEOUT_MS = 8000`) via `Promise.race`, because the real `kisClient.ts` `fetch()` call has no timeout guarantee of its own. A timeout resolves to `sanitizedErrorCode: PROVIDER_TIMEOUT`; any other transport failure or malformed response (non-finite `currentPrice`) resolves to `PROVIDER_UNAVAILABLE` or `MALFORMED_RESPONSE`. No raw provider payload crosses the binding module's boundary — only `{ currentPrice, volume }` is read out of the transport's success result.

## 12. Sanitized response and logging summary

`sanitizeQuoteResponse` emits exactly the allowed fields: `symbol`, `market`, `timestamp`, `currentPrice`, `volume`, `sourceStatus`, `cacheStatus`, `sanitizedErrorCode` — verified in smoke scenario 8 to be the *exact* key set of every response, and in scenario 9 to never match a raw-payload/secret-shaped pattern. `buildLogEntry` emits exactly the allowed log fields: `timestamp`, `symbol`, `endpointCategory`, `success`, `sanitizedErrorCode`, `latencyMs`, `cacheHit`, `rateLimitBlocked` — no credential, token, Authorization header, cookie, account number, order, balance, funds, or raw KIS payload field is ever logged.

## 13. Smoke summary

All 11 required cases pass (`npm run smoke:phase-3gg-d-fast`, `PASS: 11/11 scenarios passed.`):

1. Local-only guard passes for localhost — full success path, transport called once.
2. Non-local guard fails closed (`NON_LOCAL_REQUEST`) — transport never invoked.
3. Missing credential fails closed (`MISSING_CREDENTIAL`) without printing any value.
4. Forbidden endpoint category fails closed (`ENDPOINT_FORBIDDEN`).
5. Unlisted endpoint category fails closed (`ENDPOINT_NOT_ALLOWLISTED`).
6. Rate limit exceeded blocks the 6th request (`RATE_LIMITED`); transport called exactly 5 times.
7. Cache hit skips the provider call; transport called exactly once across two identical requests.
8. Sanitized response contains only the 8 allowed fields, verified by exact key-set comparison.
9. Raw payload is never exposed — serialized response never matches the secret/raw-field pattern.
10. No forbidden endpoint category is reachable — allowlist has exactly one entry, every forbidden category is explicitly rejected.
11. First live call path is local-only and single-endpoint only — the real `kisClient.ts` (plus `serverOnly.ts`/`providerErrors.ts`) is compiled and dynamically imported (reusing the `owner_smoke_kis_quote_live.mjs` TS-compile pattern), and `runLocalOnlyLiveKisMarketDataRequest` is invoked with `hostname: 'localhost'`, `category: 'current_price'`, `symbol: '005930'`, and a real `hasEnvValue` reading actual `process.env` presence.

**Whether an actual live network call occurred:** No. In this local environment, `KIS_APP_KEY`/`KIS_APP_SECRET`/`KIS_BASE_URL` are present as real environment variables, but `KIS_ENABLE_LIVE_QUOTES` is not `'true'`. `kisClient.ts`'s own `getKisQuoteConfigReadiness()` therefore returns `{ ready: false, reason: 'disabled' }`, and `getKisDomesticQuoteSnapshot` returns a `CONFIG_MISSING` provider error *before issuing any `fetch()` call* — the real-transport scenario safely fails closed (`sourceStatus: 'unavailable'`, `sanitizedErrorCode: PROVIDER_UNAVAILABLE`) with zero network requests made. Setting `KIS_ENABLE_LIVE_QUOTES` to `'true'` was intentionally not performed in this phase; that remains reserved for a separate, future, explicitly-approved activation commit (Gate 11).

## 14. Activation status

- Live KIS network calls remain gated by `kisClient.ts`'s own `KIS_ENABLE_LIVE_QUOTES` feature flag, which this phase did not set to `'true'`.
- No public route. No beta route. No internal QA activation. No API route created or activated.
- No LLM handoff.
- No deploy. No push.
- Actual live-quote activation still requires a future exact commit/PR sign-off (Gate 11), consistent with Phase 3GG-C/3GG-D-PLAN.

## 15. Validation results

Accelerated validation set (per this phase's own work order — the full historical checker chain was not run, since no failure required it):

- `npm run smoke:phase-3gg-d-fast` — `PASS: 11/11 scenarios passed.`
- `npm run check:phase-3gg-d-fast` — PASS (all assertions passed; see command output for exact count).
- `npm run build` — completed successfully.
- `git diff --check` — no non-whitespace-warning errors.
- Forbidden diff check (Section 16) — empty.
- KIS provider diff review (Section 17) — empty; no existing KIS provider module was modified.

## 16. Forbidden diff result

```
git diff --name-only cdd9bd18a6b8993d8a9320b2c7a80c5d6bb5b110 -- src/pages/chart-ai.astro src/lib/server/chart-ai/guarded-productization-scaffold.mjs src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs src/lib/server/chart-ai/mk-agent.mjs src/lib/server/chart-ai/mk-agent.fixture.mjs src/lib/server/chart-ai/similar-pattern-agent.mjs src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs pages/api src/pages/api components supabase src/data package-lock.json pnpm-lock.yaml yarn.lock .env .env.local
```

Result: forbidden diff: empty. No forbidden path touched.

## 17. KIS provider diff result

```
git diff --name-only cdd9bd18a6b8993d8a9320b2c7a80c5d6bb5b110 -- src/lib/server/kis src/lib/kis src/server/kis src/lib/server/chart-ai/kis src/lib/server/providers/kis src/lib/server/providers/kisClient.ts src/lib/server/providers/providerErrors.ts src/lib/server/providers/serverOnly.ts src/lib/server/providers/types.ts
```

Result: empty. No existing KIS provider module was created, modified, or touched by this phase. The real `kisClient.ts` transport is read-only compiled into a temporary directory by the smoke script for the single real-transport scenario; the source file itself is never edited.

## 18. Boundary preservation

No order endpoint. No cancel/modify order endpoint. No account endpoint. No balance endpoint. No funds endpoint. No buying power endpoint. No sellable quantity endpoint. No profit/loss endpoint. No deposit/withdrawal endpoint. No trading history endpoint. No portfolio/holdings endpoint. No personal endpoint. No public route. No beta route. No internal QA activation. No deploy. No push. No LLM handoff. No raw KIS payload in UI/logs/docs/checker output. No credential value in UI/logs/docs/checker output. No API key, secret, token, account number, JWT, session, cookie, or email output. `.agents/`, `.claude/`, `.vscode/settings.json`, `docs/handoff/codex_state_inspection/`, and `skills-lock.json` were left untouched; `docs/handoff/codex_state_inspection/` was not opened.

## 19. Known out-of-scope issues

- Live-quote activation (setting `KIS_ENABLE_LIVE_QUOTES` to `'true'` and confirming an actual outbound network response) is deferred to a separate, future, explicitly-approved activation commit, per Gate 11.
- No Chart AI UI integration was performed in this phase; the binding module is not wired into `chart-ai.astro` or any client component.
- No persistent (Supabase) cache backend was wired in this phase; the 300-second cache is in-process only, matching this phase's own minimal-end-to-end scope.
- The full historical checker chain (all prior-phase checkers) was intentionally not run in this phase, per its own accelerated-validation-only instruction.

## 20. Next recommended phase

**Phase 3GG-E-INTEGRATE — Local-only KIS Data to Chart AI Integration.** Live KIS network activation, public/beta/internal QA activation, deploy, and push all remain blocked and were not exercised in this phase.
