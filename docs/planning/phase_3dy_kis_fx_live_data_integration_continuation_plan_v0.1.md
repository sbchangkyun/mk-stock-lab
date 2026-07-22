# Phase 3DY - KIS / FX Live Data Integration Continuation Plan

## 1. Status

Planned - KIS / FX live-data continuation plan completed; no runtime changes.

## 2. Background

The current live-data baseline is stronger than the public production behavior intentionally exposes:

- Owner-run KIS smokes passed for KR stocks `005930` and `000660` and KR ETF `069500`; each final result was normalized, sanitized, and `fresh`.
- The owner Portfolio live preview API smoke passed locally with three KR positions, `source=live`, `previewMode=owner`, and no unavailable rows.
- The owner Portfolio preview UI review passed for the localhost-only preview flow.
- FX support exists only as a mocked adapter with a fixed synthetic USD/KRW rate and conservative `sample`/`stale-but-usable` semantics.
- The KIS US quote endpoint is not implemented.
- Public live quotes remain disabled; the default public API and UI path remains `source=fixture`.
- `source=auto` remains deferred.
- Phase 3DX provides UI architecture and dense-surface containment rules for future live-data UI changes.
- Phase 3DW provides the production mobile geometry guard required for future public UI acceptance.

This phase locks the continuation scope before any further runtime or provider integration. It performs no live KIS call, no live FX call, no runtime change, and no production enablement.

## 3. Current Capability Matrix

| Area | Current status | Evidence | Limitation | Next action |
| ---- | -------------- | -------- | ---------- | ----------- |
| KIS KR stock quote | Owner-smoke validated | Phase 3DN and Phase 3DO-CLOSEOUT: `005930`, `000660` PASS; `kisClient.ts` domestic quote path | Owner/local non-production only; not public production | Preserve adapter and owner guards; do not expand public exposure |
| KIS KR ETF quote | Owner-smoke validated | Phase 3DO-CLOSEOUT: `069500` PASS through the same domestic endpoint | Only representative ETF coverage; owner/local only | Preserve KR domestic endpoint contract and add ETF cases to future regression suites |
| KIS token/runtime guard | Implemented | `kisClient.ts` token cache, feature flag, Preview guard, production block, and absent-account guard | Production intentionally disallowed; runtime policy is not a public enablement switch | Preserve fail-closed behavior |
| In-memory quote cache | Implemented and default | `marketData/quoteCache.ts`; 15-second fresh TTL and 120-second stale window | Process-local; market-session freshness policy not finalized | Keep as default until cache/rate policy is approved |
| Persistent quote cache | Implemented and opt-in | `marketData/supabaseQuoteCache.ts`, `QUOTE_CACHE_BACKEND=supabase`, Phase 3V owner smoke retry PASS | Phase 3V used a synthetic normalized snapshot; KIS single-quote smoke recorded the memory backend; production enablement remains separate | Treat as available infrastructure, not as automatic public-live readiness |
| Mocked FX adapter | Implemented for contracts | `fxMockAdapter.ts`; USD/KRW, KRW/USD, identity pairs; fixed synthetic rate | Not current, not live, not suitable for public valuation claims | Retain for mocked-first real-adapter tests |
| Mixed-currency valuation with mocked FX | Implemented as server helper | `buildPortfolioValuationFromQuotesWithFx()` | Not wired into the live Preview API; mocked FX caps freshness conservatively | Reuse the interface after a real FX contract is approved |
| Portfolio valuation API fixture path | Implemented and public default | `POST /api/portfolio/valuation`; omitted source resolves to `fixture` | US fixture coverage is incomplete; mixed-currency totals remain limited without real FX | Preserve as the stable public path |
| Portfolio valuation API owner live preview | Implemented and owner-smoke validated | Phase 3DP owner smoke closeout PASS; triple opt-in, local non-production, KR-only, max 10 positions | Not public, not production, no US, no real FX | Preserve until mixed-currency owner preview is separately implemented and smoked |
| Portfolio UI owner preview mode | Implemented and owner-reviewed | `portfolio.astro`; localhost plus `?previewMode=owner`; Phase 3DS owner review PASS | Local owner preview only; KRW/KR eligibility restrictions | Extend only after API and FX contracts pass mocked-first checks |
| Production public live quote path | Disabled | Fixture default, runtime production block, owner-only request gates | No approved public caching, quota, freshness, outage, or UX policy | Keep blocked |
| `source=auto` | Deferred and unsupported | API returns `UNSUPPORTED_SOURCE`; planning/checker contracts | Routing and fallback semantics are not approved | Reconsider only after provider, cache, freshness, and owner acceptance gates pass |
| US quote endpoint | Not implemented | Non-KR KIS requests return `SYMBOL_UNSUPPORTED`; KIS chart/overseas integration remains separate | No live US stock/ETF quote source | Defer until a dedicated provider/endpoint plan follows FX stabilization |
| Real FX provider | Not selected and not implemented | Only `fxMockAdapter.ts` exists | Provider, cost, credential, freshness, fallback, and currency-pair decisions are open | Phase 3DZ provider-selection plan |
| Production mobile geometry guard | Implemented and accepted | Phase 3DW-CLOSEOUT; 21/21 prior production geometry PASS | Detects geometry, not provider correctness | Run before owner acceptance and after deployment when public UI changes |

## 4. Existing Contracts to Preserve

### 4.1 Source and Runtime Gates

- Public `source=fixture` remains the default when `source` is omitted or explicitly set to `fixture`.
- Unguarded public `source=live` remains disabled and rejected.
- The existing owner preview `source=live` path requires explicit triple opt-in: `source=live`, `previewMode=owner`, and `allowLiveQuotes=true`.
- The owner preview path remains available only in a non-production runtime.
- The Portfolio UI activates owner preview only on `localhost` or `127.0.0.1` with `?previewMode=owner`.
- `source=auto` remains deferred and unsupported.
- Production KIS calls remain fail-closed.

### 4.2 Quote and Portfolio Scope

- The initial live Portfolio preview remains KR-only and requires `baseCurrency=KRW`.
- The owner live Portfolio preview remains limited to a maximum of 10 positions.
- The KIS quote-only scope requires `KIS_ACCOUNT_NO` to be absent.
- No trading, balance, holdings, or other account API may be called.
- Live quote failure must not silently fall back to fixture data.
- Missing live quotes remain explicit null/unavailable rows; partial data must remain distinguishable.

### 4.3 Response and Logging Boundaries

- `providerMeta` must not appear in public Portfolio valuation responses.
- Raw KIS fields, raw provider payloads, authorization headers, request bodies, and response bodies must not be logged or exposed.
- API responses remain normalized to browser-safe valuation and freshness fields.
- Secrets and account numbers must not be printed, persisted, or included in reports.
- Owner smoke output remains sanitized summary metadata only.

### 4.4 Freshness and UI Labels

- `fresh`, `stale-but-usable`, `sample`, and `unavailable` remain explicit states.
- Stale and fresh labels remain conservative and source-aware.
- Unavailable rows must not use cost basis or fixture data as if it were a live market value.
- UI copy must not say `실시간` unless a real-time policy, provider guarantee, and owner approval explicitly authorize that claim.
- Mocked FX must never be described as current, live, or real-time.

## 5. Gap Analysis

### 5.1 Provider Gaps

- A real FX provider is not selected.
- A real FX adapter is not implemented.
- The KIS US/overseas quote endpoint is not implemented.
- Required initial currency pairs beyond USD/KRW are undecided.

### 5.2 Routing and Production Gaps

- The production public live path remains disabled.
- `source=auto` routing remains deferred.
- Public quote caching, rate-limit budgets, and request-coalescing policy are not finalized.
- Production enablement criteria and rollback behavior are not approved.

### 5.3 Freshness and Fallback Gaps

- Market-open versus market-closed quote freshness policy is not finalized; current KIS snapshots report a conservative/unknown market state.
- FX freshness tolerance, stale window, and fallback policy are not finalized.
- Cross-provider timestamp alignment between KIS quotes and FX rates is not defined.
- Mixed-currency production valuation is not ready.

### 5.4 UX and Acceptance Gaps

- Provider outage and partial-data UX is not finalized for mixed-currency portfolios.
- Final owner live-data UX acceptance for real FX has not occurred.
- Public mobile acceptance has not been exercised for a future mixed-currency UI because no such public UI change exists yet.

## 6. Recommended Next Implementation Path

Use a mocked-first, owner-gated sequence:

```text
Phase 3DZ - FX Provider Selection and Real FX Adapter Plan
Phase 3EA - Real FX Adapter Mocked-First Implementation
Phase 3EB - Portfolio Mixed-Currency Owner Preview API
Phase 3EC - Owner-Run Mixed-Currency Smoke
Phase 3ED - Portfolio UI Mixed-Currency Preview Review
Phase 3EE - source=auto Public Readiness Plan
```

This sequence is safer than implementing a provider immediately because provider cost, credential handling, rate limits, timestamp semantics, and fallback policy affect the adapter interface. Selecting and documenting those contracts first prevents provider-specific details from leaking into valuation logic or UI copy.

US quotes should remain outside this sequence until the real FX owner-preview path is stable. Adding US quotes and real FX simultaneously would combine two provider failure domains and make partial valuation semantics harder to validate.

## 7. Phase 3DZ Scope Proposal

Recommended Phase 3DZ: **FX Provider Selection and Real FX Adapter Plan**.

Scope lock:

- Planning and inspection only; no runtime changes.
- Inspect candidate integration points around `fxMockAdapter.ts` and `buildPortfolioValuationFromQuotesWithFx()`.
- Define a provider-neutral FX request/result interface.
- Define supported pairs and conversion direction semantics.
- Define freshness states for market-open, market-closed, delayed, stale-but-usable, and unavailable data.
- Define safe error classifications for configuration, authentication, rate limit, provider outage, unsupported pair, stale data, and invalid response.
- Define cache key, fresh TTL, stale TTL, and fallback policy without enabling production.
- Define no-secret and no-provider-payload logging requirements.
- Define a mocked-first adapter contract and static checker.
- Determine whether provider selection, paid usage, account creation, or new credentials require explicit owner approval.
- Produce the implementation prompt for a real FX adapter only after the owner confirms the provider and policy decisions.

Phase 3DZ must not call any candidate FX provider, request credentials, mutate environment variables, deploy, or enable mixed-currency live valuation.

## 8. Owner Decisions Required

The owner must decide before real FX implementation:

1. Which FX provider should be used?
2. Is a paid provider acceptable, and what monthly/request budget is acceptable?
3. Which currency pairs are required first?
4. Should USD/KRW be the only initial pair?
5. What freshness tolerance is acceptable for FX during market-open and market-closed periods?
6. Should mixed-currency valuation appear only in owner preview first?
7. Should public production remain fixture-only until all mocked checks, owner smokes, UI review, and production geometry checks pass?
8. When can `source=auto` be reconsidered, and which explicit readiness gates must be satisfied first?

Provider selection and any paid plan, credential creation, or environment mutation require owner approval before implementation.

## 9. Safety Model

- Codex does not run live KIS calls.
- Codex does not run live FX calls.
- Codex does not read `.env`, `.env.local`, or secret files.
- Owner-run smoke scripts remain fail-closed and explicit-guard only.
- Live smoke remains read-only, quote-only, non-production, and account-API-free.
- Raw provider payloads are not persisted or printed by smoke/report flows.
- `providerMeta` and raw KIS fields do not leak into the public API response.
- Live-data production enablement requires explicit owner approval in a separate phase.
- Planning phases do not change Vercel environment variables or project settings.
- No Supabase row inspection, SQL, migration, or Storage operation is allowed in this plan.
- No deployment or remote push is performed.

## 10. UI / Architecture Constraints

Phase 3DX remains binding for any future live-data UI work:

- Live-data UI changes must preserve the Home, Chart AI, Market, Lab, Portfolio, and MyPage route-shell contracts.
- Dense Portfolio tables and holdings rows must keep local horizontal scrolling and must not widen the document.
- Status badges must use conservative labels tied to actual freshness state.
- Unavailable live rows must remain explicit and must not receive a hidden fixture/cost fallback.
- Mobile preview changes must pass the existing mobile static checks and Phase 3DX architecture checker.
- Any public UI change must run the Phase 3DW geometry guard dry-run before owner acceptance.
- After deployment of a public UI change, the explicitly guarded production geometry check must pass when applicable.

## 11. Validation Plan for Future Runtime Phases

Each runtime phase must select the relevant subset and report exact results:

1. Provider mocked contract checker for response normalization, error classification, freshness, and no-network behavior.
2. API route contract checker for source gates, scope limits, response sanitization, and no fixture fallback.
3. Owner smoke dry-run that proves fail-closed behavior without provider access.
4. Owner smoke closeout based only on sanitized owner-provided results.
5. Portfolio UI preview checker for owner gates, conservative labels, and unavailable-row behavior.
6. `npm run check:mobile-baseline`.
7. `npm run check:phase-3dx-ui-architecture-plan`.
8. `npm run guard:production-mobile-geometry` in dry-run mode.
9. The guarded production geometry run after deployment if a public UI changed.
10. `npm run build`.
11. `git diff --check` and an explicit file-scope audit.

No future phase may treat a mocked pass as evidence that a real provider call, owner smoke, public route, or production UI has passed.

## 12. Recommended Next Phase

Recommended next phase: Phase 3DZ - FX Provider Selection and Real FX Adapter Plan.

The immediate priority is to resolve provider and policy decisions before writing a real FX adapter. Public `source=live`, `source=auto`, US quotes, and mixed-currency production valuation remain blocked.

## 13. Phase Safety and Change Boundary

- No runtime source file under `src/` was changed.
- No API route behavior was changed.
- No live KIS or FX call was made.
- No secret or environment file was read.
- No Supabase data, SQL, migration, or Storage operation was accessed.
- No Vercel environment or project setting was changed.
- No deployment was performed.
- No remote push was performed.
