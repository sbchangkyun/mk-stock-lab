# MK Stock Lab Planning Changelog

## Phase 3EZ-C - 2026-07-04

### Authenticated Similarity API Route Shell with Feature Flag Off (Implemented)

- **Status**: Implemented — route shell added, feature flag off, no real auth/usage storage/KIS runtime.
- **Background**: Phase 3EZ-B defined the storage-agnostic usage storage design and required explicit API route approval before any route may read or write usage. This phase adds that route, as a shell only, disabled by default, before any real auth or usage storage backend exists.
- **Implemented scope**: added route shell types (`similarityApiRouteShellTypes.ts`: `SimilarityApiRouteShellStatus`, `SimilarityApiRouteShellPolicy`, `SimilarityApiRouteShellRequest`, `SimilarityApiRouteShellResult`); added the route shell helper module (`similarityApiRouteShell.ts`: `buildDefaultSimilarityApiRouteShellPolicy`, `normalizeSimilarityApiRouteShellRequest`, `buildFeatureFlagOffSimilarityApiRouteShellResult`, `buildSimilarityApiRouteShellResult`); added `src/pages/api/chart-ai/similarity.ts` (`POST` route, `prerender = false`, defensive JSON body parsing, `Content-Type: application/json`, `Cache-Control: no-store`); updated `src/lib/server/chartSimilarity/index.ts` exports; added the Phase 3EZ-C planning/result docs, static checker, and package script.
- **Route contract results**: `POST /api/chart-ai/similarity` always returns `httpStatus: 503`, `response.ok: false`, `response.status: 'feature_disabled'`, `response.mode: 'feature-flag-off'`, `response.data: null`, and a safe `{ code: 'feature_disabled', message, retryable: false }` error object, matching the existing Phase 3EY-D `SimilarityApiResponse` contract; non-`POST` methods resolve to the identical safe response with no side effects.
- **Preserved policy**: no real auth runtime, no Supabase/Auth0/OAuth/NextAuth/Clerk/Firebase/Passport import, no usage storage implementation, no DB/cache runtime, no SQL/migration, no KIS call, no real similarity engine call, no `/chart-ai` UI change, no external AI, no public KIS data, no `source=live`, no `source=auto`, no account/trading APIs, no Vercel env changes, no deployment, no push, no dependency changes, no actual market values, and no `.env`/`process.env` read.
- **Validation**: the full Phase 3EZ-C validation suite (new static checker plus the established Phase 3EZ-B/3EZ-A/3EX-E/3EY-D/3EY-C/3EX-C/3EW-C/3EW-B/3EW-A/3EV-B/3EV-A checkers/smokes, provider-boundaries, kis-runtime-guard, kis-error-fallback, production-domain, build, and `git diff --check`) was run; only the known historical allowed-changed-path exceptions in `check:phase-3ez-b`, `check:phase-3ez-a`, `check:phase-3ey-d`, `check:phase-3ey-c`, and `check:phase-3ex-e` remained, consistent with the pattern already documented in Phase 3EZ-B.
- **Recommended next phase**: Phase 3FA-A — Owner-local KIS-normalized Similarity Execution Plan. Alternative: Phase 3EX-E-OWNER-RUNTIME-CHECK — Owner Runtime Check of Polished Chart Analysis Workspace.

## Phase 3EZ-B - 2026-07-04

### Usage Storage Design and Approval (Prepared/Implemented)

- **Status**: Prepared/Implemented — usage storage design foundation added, no storage runtime or SQL.
- **Background**: Phase 3EZ-A defined provider-agnostic auth subject-to-guard mapping. This phase defines usage storage design and approval requirements before any route/storage implementation.
- **Implemented scope**: added usage storage design types (`similarityUsageStorageDesignTypes.ts`), a storage-agnostic default policy, UTC window/key helpers, a role-based limit helper, a charge decision helper (`similarityUsageStorageDesign.ts`), mocked usage design fixtures (`mockedSimilarityUsageStorageDesignFixtures.ts`), server exports, and the docs/changelog/package/checker for this phase.
- **Usage design results**: backend default `none`; enabled false; subjectKey strategy `not_configured`; daily/monthly UTC window model; role limits aligned to guard policy (`authenticated/default: 3`, `beta: 10`, `owner: 50`, `admin: 100` daily); default charge policy charges only successful execution and does not charge auth-required, usage-limited, feature-disabled, provider-disabled, validation-error, provider-error, or internal-error paths.
- **Approval requirements**: owner approval before any storage runtime; SQL/migration approval before database implementation; cache approval before runtime cache; privacy review for subjectKey; explicit route approval before API implementation.
- **Preserved policy**: no usage storage implementation, no DB/cache runtime, no SQL/migration, no Supabase/Redis/Turso/Prisma/Drizzle import, no API route, no real auth runtime, no KIS call, no `/chart-ai` UI change, no external AI, no public KIS data, no `source=live`, no `source=auto`, no account/trading APIs, no Vercel env changes, no deployment, no push, no dependency changes, no actual market values, and no `.env`/`process.env` read.
- **Validation**: the full Phase 3EZ-B validation suite (new static checker plus the established Phase 3EZ-A/3EX-E/3EY-D/3EY-C/3EX-C/3EW-C/3EW-B/3EW-A/3EV-B/3EV-A checkers/smokes, provider-boundaries, kis-runtime-guard, kis-error-fallback, production-domain, build, and `git diff --check`) was run; only the known historical allowed-changed-path exceptions in `check:phase-3ey-d`, `check:phase-3ey-c`, and `check:phase-3ex-e` remained, consistent with the pattern already documented in Phase 3EZ-A.
- **Recommended next phase**: Phase 3EZ-C — Authenticated Similarity API Route Shell with Feature Flag Off. Alternative: Phase 3EX-E-OWNER-RUNTIME-CHECK — Owner Runtime Check of Polished Chart Analysis Workspace.

## Phase 3EZ-A - 2026-07-04

### Real Auth Integration Design for Similarity Execution (Prepared/Implemented)

- **Status**: Prepared/Implemented — real-auth integration design foundation added, no real auth runtime or API route.
- **Background**: Phase 3EX-E completed the `/chart-ai` owner-review UI polish. Phase 3EY-C added the guard foundation, and Phase 3EY-D added the sanitized mocked API response contract. This phase defines provider-agnostic auth subject-to-guard mapping before any real route or auth provider is added.
- **Implemented scope**: added `similarityAuthIntegrationDesignTypes.ts` defining `SimilarityAuthProviderKind`, `SimilarityAuthIntegrationStatus`, `SimilarityAuthSubjectKind`, `SimilarityAuthSubject`, `SimilarityAuthRoleMappingPolicy`, and `SimilarityAuthIntegrationDesignResult`; added `similarityAuthIntegrationDesign.ts` with `buildDefaultSimilarityAuthRoleMappingPolicy`, mocked subject builders for anonymous/authenticated/beta/owner/admin, `mapAuthSubjectToGuardRole`/`mapAuthSubjectToGuardAuthState`, `buildSimilarityAuthIntegrationDesignResult`, and `buildGuardRequestFromAuthDesign`; updated `src/lib/server/chartSimilarity/index.ts` exports; added the Phase 3EZ-A planning/result docs, static checker, and package script.
- **Auth mapping results**: anonymous maps to guard `anonymous`/`missing`; authenticated maps to `authenticated`/`authenticated`; beta maps to `beta`/`authenticated`; owner maps to `owner`/`owner`; admin maps to `admin`/`admin`.
- **Safe data policy**: no tokens, email, IP address, raw auth provider payload, cookies, headers, KIS credentials, or account/trading fields are introduced; future API responses must continue to use the Phase 3EY-D sanitized response boundary that drops `userId`, `role`, and `authState`.
- **Preserved policy**: no real auth runtime, no Supabase auth import, no external auth provider import, no cookies/headers read, no API route, no usage storage, no KIS call, no `/chart-ai` UI change, no DB/cache runtime, no SQL/migration, no external AI, no public KIS data, no `source=live`, no `source=auto`, no account/trading APIs, no Vercel env changes, no deployment, no push, no dependency changes, no actual market values, and no `.env`/`process.env` read.
- **Validation**: `npm run check:phase-3ez-a-real-auth-integration-design-for-similarity-execution` and the established validation suite run in full; results recorded in the phase result document and final report.
- **Recommended next phase**: Phase 3EZ-B — Usage Storage Design and Approval. Alternative: Phase 3EX-E-OWNER-RUNTIME-CHECK — Owner Runtime Check of Polished Chart Analysis Workspace.

## Phase 3EX-E - 2026-07-04

### Similarity Result UI Owner Review and Polish (Implemented)

- **Status**: Implemented — `/chart-ai` sidebar and chart-lower analysis layout restructured per owner review feedback; no API, auth, usage, or KIS behavior changed.
- **Background**: Phase 3EX-D integrated a mocked "유사 패턴 분석" result UI into `/chart-ai`, with a compact sidebar action card and a standalone "MK AI" sidebar button, plus one long full-width lower panel stacking both similarity and MK AI content. The owner reviewed this layout and asked for the two analysis controls to move out of the sidebar into the chart-lower area, for the two controls to share consistent visual treatment, and for the similarity and MK AI content to switch via tabs in one shared workspace instead of one long vertical stack.
- **Implemented scope**: removed the `chartAiSimilarityCard`/`chartAiSimilarityViewBtn` sidebar card and the standalone `chartAiMkAiBtn` sidebar button from `src/pages/chart-ai.astro`, replacing them with a short passive sidebar note; introduced a new `chartAiAnalysisWorkspace` section titled "차트 분석" directly below the chart/sidebar grid, containing an accessible `role="tablist"` with two `role="tab"` buttons ("유사 패턴 분석 보기" default-active, "MK AI 분석 보기"), and two `role="tabpanel"` panels (`chartAiSimilarityPanel`, `chartAiMkAiPanel`) using `aria-selected`/`aria-controls`/`hidden` for state; moved the existing MK AI interpretation content (요약, 핵심 해석, 시나리오 점검, 분석 근거, 확인 체크리스트, 리스크 체크리스트, 데이터 한계) out of its former nested position inside the similarity panel into its own top-level tabpanel unchanged in content; replaced the old scroll-based button handlers with a minimal vanilla `activateAnalysisTab` toggle function driven only by local DOM class/attribute changes, with no network, storage, or API access; updated CSS to remove the old sidebar card/button styles and add consistent `.chart-analysis-tabs`/`.chart-analysis-tab` styling (including active-state, focus-visible, reduced-motion, and mobile-stacking rules), while preserving the existing chart/sidebar stretch fix; removed the now-unused `mkAiButton`/`mkAiNote` DOM lookups left over from the deleted sidebar button.
- **UI decision**: sidebar remains focused on 종목 개요 and KIS 연결 프리뷰 plus a short note directing the owner to the chart-lower area; both analysis entry points are now visually identical tab buttons in one shared "차트 분석" workspace; only the active tab's panel is visible at a time, reducing page height versus the old stacked layout.
- **Preserved policy**: no `/api/chart-ai/similarity` or other API route added, no KIS call, no real auth, no usage storage, no DB/cache runtime, no SQL/migration, no external AI call, no dependency changes, no `source=live`/`source=auto` literal, no account/trading/order/balance API, no secrets or raw KIS payload exposed, no deployment, no push; all sample/mocked disclaimers ("샘플 데이터", "실제 KIS 데이터 아님", "매수·매도 추천 또는 투자자문이 아님") and the synthetic-data data-limitations sections for both similarity and MK AI content are unchanged.
- **Validation**: `npm run check:phase-3ex-e-similarity-result-ui-owner-review-polish` and the established validation suite run in full; results recorded in the phase result document and final report.
- **Recommended next phase**: Phase 3EZ-A — Real Auth Integration Design for Similarity Execution. Alternative: Phase 3EY-D-HF1, only if a stale doc-count assertion in the Phase 3EY-D checker requires a narrow follow-up fix.

## Phase 3EY-D - 2026-07-04

### Auth/Usage Guard Contract and Mocked API Response Plan (Prepared/Implemented)

- **Status**: Prepared/Implemented — sanitized mocked API response contract added on top of the Phase 3EY-C guard, no API route or runtime integration.
- **Background**: Phase 3EY-C added a disabled-by-default, policy-first auth/usage execution guard returning a `SimilarityExecutionGuardResult`. This phase defines the sanitized API-shaped response contract a later, separately authorized phase can use to shape a real route's JSON response.
- **Implemented scope**: added `src/lib/server/chartSimilarity/similarityApiResponseTypes.ts` (`SimilarityApiResponseStatus`, `SimilarityApiResponseSource`, `SimilarityApiResponseMode`, `SimilarityApiSafeRequest`, `SimilarityApiSafeUsage`, `SimilarityApiSafeError`, `SimilarityApiMockedMatch`, `SimilarityApiMockedSuccessData`, `SimilarityApiResponse`); `similarityApiResponseBuilder.ts` (`toSimilarityApiSafeRequest`, `toSimilarityApiSafeUsage`, `mapGuardStatusToApiStatus`, `buildSimilarityApiErrorFromGuard`, `buildSimilarityApiResponseFromGuard`, `buildMockedSimilarityApiSuccessData`, `buildMockedAllowedSimilarityApiResponse` — converts a guard result into a sanitized response, never calls the real similarity engine, KIS, or `fetch`, never reads env or usage state); `mockedSimilarityApiResponseFixtures.ts` (`buildMockedSimilarityApiAllowedResponse`, `buildMockedSimilarityApiAuthRequiredResponse`, `buildMockedSimilarityApiUsageLimitedResponse`, `buildMockedSimilarityApiFeatureDisabledResponse`, `buildMockedSimilarityApiNotConfiguredResponse`, `buildMockedSimilarityApiBlockedResponse` — each drives the real Phase 3EY-C guard evaluator and mocked guard fixtures with fixed synthetic inputs); updated `index.ts` to export all new symbols alongside all existing Phase 3EY-A/3EY-B/3EY-C exports; added the committed runtime smoke script `scripts/smoke_phase_3ey_d_auth_usage_guard_contract_mocked_api_response_plan.mjs` (33 numbered assertions, including a `process.env` Proxy-based runtime no-env-access check); added the 87-check static checker `scripts/check_phase_3ey_d_auth_usage_guard_contract_mocked_api_response_plan_contract.mjs`.
- **Response contract results**: success/blocked/auth-required/usage-limited/feature-disabled/not-configured responses are all verified with mocked inputs only; every response is sanitized to drop `userId`, `role`, `authState`, tokens, email, IP address, raw auth/KIS payload fields, and account/trading fields.
- **Preserved policy**: no API route added, no real auth runtime, no usage persistence, no Supabase auth import, no `/chart-ai` UI change, no KIS call, no DB/cache runtime, no SQL/migration, no external AI, no public KIS data, no `source=live`, no `source=auto`, no account/trading APIs, no Vercel env changes, no deployment, no push, no dependency changes, no actual market values, and no `.env`/`process.env` read.
- **Validation**: `npm run check:phase-3ey-d-auth-usage-guard-contract-mocked-api-response-plan`, `npm run smoke:phase-3ey-d-auth-usage-guard-contract-mocked-api-response-plan`, and the established validation suite run in full; results recorded in the phase result document and final report.
- **Recommended next phase**: Phase 3EX-E — Similarity Result UI Owner Review and Polish. Alternative: Phase 3EZ-A — Real Auth Integration Design for Similarity Execution.

## Phase 3EY-C - 2026-07-03

### Auth and Usage Guard Plan for Similarity Execution (Prepared/Implemented)

- **Status**: Prepared/Implemented — auth and usage guard planning/foundation added, no real auth or usage runtime.
- **Background**: Phase 3EY-B verified the server-only provider contract with a mocked adapter. This phase defines the guard contract required before any future authenticated Chart Similarity API route.
- **Implemented scope**: added `src/lib/server/chartSimilarity/similarityExecutionGuardTypes.ts` (`SimilarityExecutionRole`, `SimilarityExecutionAuthState`, `SimilarityExecutionUsageWindow`, `SimilarityExecutionGuardStatus`, `SimilarityExecutionPurpose`, `SimilarityExecutionSource`, `SimilarityExecutionGuardRequest`, `SimilarityExecutionUsageSnapshot`, `SimilarityExecutionGuardPolicy`, `SimilarityExecutionGuardResult`); `similarityExecutionGuardPolicy.ts` (feature flag name constants and `buildDefaultSimilarityExecutionGuardPolicy()`, disabled by default, no `process.env`/`.env` read); `similarityExecutionGuard.ts` (`normalizeSimilarityExecutionGuardRequest`, `buildUsageSnapshot`, `getRoleDailyLimit`, `evaluateSimilarityExecutionGuard` — a policy-first, disabled-by-default evaluator that only evaluates a caller-supplied usage snapshot and never persists usage); `mockedSimilarityExecutionGuardFixtures.ts` (deterministic mocked requests/usage snapshot with fake user ids only); updated `index.ts` to export all guard symbols alongside all existing Phase 3EY-A/3EY-B exports; added the committed runtime smoke script `scripts/smoke_phase_3ey_c_auth_usage_guard_plan_for_similarity_execution.mjs` (30 numbered assertions, including a `process.env` Proxy-based runtime no-env-access check); added the 91-check static checker `scripts/check_phase_3ey_c_auth_usage_guard_plan_for_similarity_execution_contract.mjs`.
- **Guard policy**: feature disabled by default; auth required; usage guard required; anonymous mocked preview allowed; public KIS execution disallowed; role limits defined (`defaultDailyLimit: 3`, `betaDailyLimit: 10`, `ownerDailyLimit: 50`, `adminDailyLimit: 100`).
- **Guard contract results**: anonymous mocked preview path, feature-disabled KIS path, auth-required path, not-configured missing-usage path, usage-limited path, allowed path, and owner-local role restriction are verified with mocked inputs only.
- **Preserved policy**: no real auth runtime, no usage persistence, no Supabase auth import, no API route, no `/chart-ai` UI change, no KIS call, no DB/cache runtime, no SQL/migration, no external AI, no public KIS data, no `source=live`, no `source=auto`, no account/trading APIs, no Vercel env changes, no deployment, no push, no dependency changes, no actual market values, and no `.env`/`process.env` read.
- **Validation**: `npm run check:phase-3ey-c-auth-usage-guard-plan-for-similarity-execution`, `npm run smoke:phase-3ey-c-auth-usage-guard-plan-for-similarity-execution`, and the established validation suite run in full; results recorded in the phase result document and final report.
- **Recommended next phase**: Phase 3EY-D — Auth/Usage Guard Contract and Mocked API Response Plan. Alternative: Phase 3EX-E — Similarity Result UI Owner Review and Polish.

## Phase 3EY-B - 2026-07-03

### Server-only KIS OHLC Provider Contract and Mocked Adapter Test (Implemented)

- **Status**: Implemented — server-only KIS OHLC provider contract and mocked adapter verification complete.
- **Background**: Phase 3EY-A added a disabled-by-default server-only KIS OHLC provider foundation (types, policy, `getServerOnlyKisOhlcForSimilarity`). This phase adds a mocked adapter / test harness that exercises the same request/normalize/validate/adapt contract end to end using only already-normalized synthetic OHLC input, without enabling any live KIS call.
- **Implemented scope**: added `src/lib/server/chartSimilarity/mockedKisOhlcFixtures.ts` (`buildMockedNormalizedDailyOhlcInput`, `buildInvalidMockedNormalizedDailyOhlcInput` — fixed sine/cosine synthetic arithmetic, no `Math.random`, no `Date.now`, no real stock code); `mockedKisOhlcAdapter.ts` (`getMockedServerOnlyKisOhlcForSimilarity`, reusing the Phase 3EY-A `normalizeServerOnlyKisOhlcRequest`/`validateServerOnlyKisOhlcRequest`/`toSimilarityOhlcBarsFromNormalizedDailyBars` functions unmodified); updated `index.ts` to export the new mocked adapter and fixture symbols alongside all existing Phase 3EY-A exports; added the committed runtime smoke script `scripts/smoke_phase_3ey_b_server_only_kis_ohlc_provider_mocked_adapter.mjs` (copies real TypeScript source into a temp directory, rewrites only the copies' relative imports, executes via Node's native TypeScript support, 30 numbered assertions); added the 72-check static checker `scripts/check_phase_3ey_b_server_only_kis_ohlc_provider_contract_mocked_adapter_test_contract.mjs`.
- **Contract results**: invalid requests are `blocked`; the mocked adapter returns `disabled` under the default/disabled policy; an enabled policy with valid mocked bars returns `ready` with `OhlcBar[]` (`source: "kis-normalized"`, `market: "KR"`, requested symbol); an enabled policy with zero valid mapped bars returns a safe empty-bars `blocked` result; no NaN/Infinity, raw KIS field name, or secret-looking value appears in any output.
- **Preserved policy**: the Phase 3EY-A disabled provider foundation (`serverOnlyKisOhlcProvider.ts`, `kisOhlcProviderTypes.ts`, `kisOhlcProviderPolicy.ts`) is unmodified and still returns only `disabled`/`not_implemented`/`blocked`; the mocked adapter's `"ready"` status is a separate, non-live, test-harness-only contract; no KIS call, no KIS provider/client import, no API route, no `/chart-ai` UI change, no DB/cache runtime, no SQL/migration, no auth/usage runtime, no external AI, no Vercel env changes, no deployment, no push, no dependency changes, no `.env` read.
- **Validation**: `npm run check:phase-3ey-b-server-only-kis-ohlc-provider-contract-mocked-adapter-test`, `npm run smoke:phase-3ey-b-server-only-kis-ohlc-provider-mocked-adapter`, and the established validation suite run in full; results recorded in the phase result document and final report.
- **Recommended next phase**: Phase 3EY-C — Auth and Usage Guard Plan for Similarity Execution. Alternative: Phase 3EX-E — Similarity Result UI Owner Review and Polish.

## Phase 3EY-A - 2026-07-03

### Server-only KIS OHLC Provider Planning/Foundation (Prepared/Implemented)

- **Status**: Prepared/Implemented — server-only KIS OHLC provider foundation added, live execution disabled.
- **Background**: Phase 3EX-D integrated a mocked similarity result UI using synthetic fixture data only. This phase starts the KIS provider track without enabling live KIS execution.
- **Implemented scope**: added `src/lib/server/chartSimilarity/kisOhlcProviderTypes.ts` (`ServerOnlyKisOhlcProviderStatus`, `ServerOnlyKisOhlcRequest`, `ServerOnlyKisOhlcPolicy`, `ServerOnlyKisOhlcResult`, `NormalizedDailyOhlcInput`/`NormalizedDailyOhlcMeta`, reusing `OhlcBar` from `src/lib/chartSimilarity/types`); `kisOhlcProviderPolicy.ts` (feature flag name constants and `buildDefaultServerOnlyKisOhlcPolicy()`, disabled by default, no `process.env`/`.env` read); `serverOnlyKisOhlcProvider.ts` (`normalizeServerOnlyKisOhlcRequest`, `validateServerOnlyKisOhlcRequest`, `getServerOnlyKisOhlcForSimilarity` returning `disabled`/`blocked`/`not_implemented` only, and the pure `toSimilarityOhlcBarsFromNormalizedDailyBars` adapter placeholder); `index.ts` re-exporting the above, not imported into any page/API route.
- **Provider policy**: default `enabled` false; auth and usage guard required before future execution; public execution not allowed; raw provider payload not allowed; client secret exposure not allowed.
- **Preserved policy**: no KIS call, no KIS provider/client import, no API route, no `/chart-ai` UI change, no DB/cache runtime, no SQL/migration, no auth/usage runtime, no external AI, no public KIS data, no `source=live`, no `source=auto`, no account/trading APIs, no Vercel env changes, no deployment, no push, no dependency changes, no actual market values, and no `.env` read.
- **Validation**: `npm run check:phase-3ey-a-server-only-kis-ohlc-provider-planning-foundation` and the established validation suite run in full; results recorded in the phase result document and final report.
- **Recommended next phase**: Phase 3EY-B — Server-only KIS OHLC Provider Contract and Mocked Adapter Test. Alternative: Phase 3EX-E — Similarity Result UI Owner Review and Polish.

## Phase 3EX-D - 2026-07-03

### Similarity Result UI Mocked Integration (Implemented)

- **Status**: Implemented — mocked similarity result UI integrated into `/chart-ai`, chart/sidebar stretch layout bug fixed.
- **Background**: Owner visual review found that expanding the MK AI sidebar note also stretched the left chart card vertically, creating a large empty white area, because `.chart-lookup-content-grid` defaulted to `align-items: stretch`. This phase fixes that layout bug and adds a mocked "유사 패턴 분석" (similar pattern analysis) result UI using the existing deterministic similarity engine and synthetic fixture data only.
- **Implemented scope**: added `align-items: start` / `align-self: start` to the chart/sidebar grid to stop the stretch; added a compact "유사 패턴 분석" card to the right sidebar with a `유사 패턴 분석 보기` button that scrolls to (and marks `aria-expanded` on) the new full-width result panel; added a full-width `#chartAiSimilarityPanel` section below the chart/sidebar grid with all six required subsections (현재 패턴 요약, 유사 구간 Top 5 table, 기준일 100 정규화 오버레이 local SVG, 사후 성과 요약, MK AI 해석, 데이터 한계 / 투자 유의); relocated the existing `#chartAiMkAiNote` block into the panel's MK AI 해석 subsection, keeping the `#chartAiMkAiBtn` trigger in the sidebar; wired `scanSimilarity(buildSyntheticOhlcvFixture(), { baseWindow: 20, forwardWindows: [5, 20], topK: 5, similarityMethod: 'return_correlation_rmse', excludeRecentBars: 40 })` in Astro frontmatter, computed once at render time.
- **Layout decision**: right sidebar is now a compact control/status area only; all long-form similarity result content and the full MK AI narrative live in the full-width panel below the chart grid; the chart card no longer stretches when sidebar or panel content grows.
- **Mocked data policy**: all similarity data comes from the already-hardened deterministic engine (Phase 3EX-B/3EX-C) run against the existing deterministic synthetic fixture, computed once in Astro frontmatter with no client fetch, no API route, and no KIS call; every result section carries a "샘플 데이터" / "실제 KIS 데이터 아님" disclaimer.
- **Preserved policy**: no KIS provider, no KIS call, no new API route, no login/auth, no usage guard, no DB/cache runtime, no SQL/migration, no external AI call, no Vercel deployment, no push, no dependency changes.
- **Validation**: `npm run check:phase-3ex-d-similarity-result-ui-mocked-integration` PASS (58/58); full established validation suite run (14 commands including `npm run build`), all PASS except two pre-existing, documented, out-of-scope failures in the 3EX-B and 3EX-C checkers (their `no src/pages changed` scope-boundary assertions, written before any UI integration phase existed — see result doc section 7); `git diff --check` PASS.
- **Recommended next phase**: Phase 3EX-E — Similarity Result UI Owner Review and Polish. Alternative: Phase 3EY-A — Server-only KIS OHLC Provider Planning/Foundation.

## Phase 3EX-C - 2026-07-03

### Similarity Engine Contract and Edge Case Hardening (Implemented)

- **Status**: Implemented — similarity engine contract and edge-case hardening complete.
- **Background**: Phase 3EX-B implemented the deterministic chart similarity engine foundation but deferred a committed runtime smoke script, because Node's native TypeScript execution requires explicit `.ts` extensions on relative imports, conflicting with the project's extensionless-import convention. This phase resolves that gap and hardens the engine against a broader edge-case surface.
- **Implemented scope**: added `src/lib/chartSimilarity/scanOptions.ts` (`normalizeScanOptions`) as a sanitization boundary for raw `SimilarityScanOptions` (fixes a NaN-defeats-numeric-guards bug for `baseWindow`/`topK`/`excludeRecentBars`; sanitizes/dedupes/sorts `forwardWindows`); wired it into `similarityScanner.ts`; added `src/data/chartSimilarity/edgeCaseOhlcvFixtures.ts` (flat/short/invalid/unsorted synthetic fixtures); added a committed runtime smoke script `scripts/smoke_phase_3ex_c_similarity_engine_edge_cases.mjs` that copies the real engine sources into an OS temp directory, rewrites only the copies' relative imports to add `.ts` extensions (committed source imports untouched), executes them via Node's native TypeScript support, and verifies 27 real-engine assertions, cleaning up the temp directory afterward; added the 78-check static checker `scripts/check_phase_3ex_c_similarity_engine_contract_edge_case_hardening_contract.mjs`.
- **Contract guarantees**: expected bad input (empty bars, one-bar input, invalid options, invalid bars) returns warnings/empty matches instead of throwing; `similarityScore` always remains `0..100`; no NaN/Infinity in any public output; forward outcomes use `null` (never NaN) when unavailable; current/recent-window overlap remains excluded; future data is never used in similarity scoring.
- **Preserved policy**: no KIS provider, no KIS call, no API route, no UI integration, no login/auth, no usage guard, no DB/cache runtime, no SQL/migration, no external AI call, no Vercel deployment, no push, no dependency changes.
- **Validation**: `npm run check:phase-3ex-c-similarity-engine-contract-edge-case-hardening` PASS (78/78); `npm run smoke:phase-3ex-c-similarity-engine-edge-cases` PASS (27/27); established validation suite PASS 11/12 commands, `npm run build` PASS, `git diff --check` PASS — the one non-passing command, `check:phase-3ex-a-chart-ai-similarity-mvp-scope-alignment-architecture` (61/62), fails on a pre-existing, unrelated assertion (`No src runtime files changed in this phase`) confirmed present at clean HEAD `9f8cfcb` before this phase's changes; left unmodified since it is outside this phase's allowed changed paths.
- **Recommended next phase**: Phase 3EX-D — Similarity Result UI Mocked Integration. Alternative: Phase 3EY-A — Server-only KIS OHLC Provider Planning/Foundation.

## Phase 3EX-B - 2026-07-03

### Chart Similarity Engine Deterministic Foundation (Implemented)

- **Status**: Implemented — deterministic chart similarity engine foundation complete.
- **Background**: Phase 3EX-A aligned Chart AI similarity MVP architecture and locked the decision to implement the similarity engine before KIS provider, API route, DB/cache, or UI integration. This phase implements that engine.
- **Implemented scope**: pure, deterministic chart similarity engine under `src/lib/chartSimilarity/` (`types.ts`, `returns.ts`, `normalize.ts`, `rollingWindow.ts`, `similarityScore.ts`, `forwardOutcome.ts`, `summaryStats.ts`, `similarityScanner.ts`, `index.ts`) covering OHLC type foundation, return/log-return calculation, normalization, rolling-window generation with current-window exclusion, correlation/RMSE/direction-match similarity scoring, forward outcome calculation, and null-safe summary statistics; deterministic synthetic OHLCV fixture (`src/data/chartSimilarity/syntheticOhlcvFixture.ts`, fake market `SYNTHETIC` / symbol `SYNTH001`, 260 bars, no `Math.random()`, no `Date.now()`).
- **Algorithm policy**: log-return-based comparison only (never raw price levels); `similarityScore = corrScore * 0.45 + rmseScore * 0.35 + directionScore * 0.20`, clamped 0..100; RMSE normalized by mean absolute current-window return magnitude (epsilon `1e-6`) for numerical stability; `excludeRecentBars` prevents current/candidate window overlap; no future leakage.
- **Preserved policy**: no KIS provider or call, no API route, no UI integration, no DB/cache runtime, no SQL/migration, no auth/usage guard, no external AI call, no public KIS data, no `source=live`, no `source=auto`, no account/trading/order/balance APIs, no Vercel env changes, no deployment, no push, no dependency changes, no real market values.
- **Validation**: `npm run check:phase-3ex-b-chart-similarity-engine-deterministic-foundation` PASS; full established validation suite PASS (9 commands); `npm run build` PASS; `git diff --check` PASS.
- **Recommended next phase**: Phase 3EX-C — Similarity Engine Contract and Edge Case Hardening. Alternative: Phase 3EX-D — Similarity Result UI Mocked Integration.

## Phase 3EX-A - 2026-07-03

### Chart AI Similarity MVP Scope Alignment and Architecture Update (Prepared)

- **Status**: Prepared — Chart AI similarity MVP scope and architecture direction aligned. No runtime implementation.
- **Background**: Phase 3EW-C completed mocked scenario/risk checklist expansion and production deployment. The owner provided a KIS-based differential similarity design draft and then locked five direction decisions before implementation.
- **Owner decisions**: `/chart-ai` remains public sample while actual similarity execution requires login/authorization/usage guard; production may include UI but real KIS similarity remains feature-flag off; implementation starts with deterministic similarity engine; DB/cache starts with policy/type design only and SQL requires separate approval; existing MK AI panel is retained but redefined as supporting narrative.
- **Prepared scope**: architecture v0.2 document, owner decision log, updated implementation roadmap, feature flag/access policy, cache/type-first policy, and similarity-engine-first sequence.
- **Preserved policy**: no runtime code, no KIS call, no external AI call, no API route, no DB/SQL/migration, no Supabase mutation, no Vercel env changes, no deployment, no push, no public KIS data, no `source=live`, no `source=auto`, no account/trading APIs, no secrets, and no raw KIS response.
- **Validation**: `npm run check:phase-3ex-a-chart-ai-similarity-mvp-scope-alignment-architecture` PASS (62/62); full established validation suite PASS (9 commands); `npm run build` PASS; `git diff --check` PASS.
- **Recommended next phase**: Phase 3EX-B — Chart Similarity Engine Deterministic Foundation. Alternative: Phase 3EV-C — Chart AI Owner-Local KIS Connected Result UI Enhancement.

## Phase 3EW-C - 2026-07-02

### MK AI Mocked Scenario and Risk Checklist Expansion with Vercel Deployment (Implemented)

- **Status**: Implemented — mocked scenario and risk checklist expansion complete.
- **Background**: Phase 3EW-B completed MK AI interaction and explanation depth. The owner requested faster implementation progress and explicitly authorized Vercel deployment for this phase. This phase expands scenario and risk checklist behavior without external AI API calls and without public KIS data exposure.
- **Implemented scope**: added a "시나리오 점검" section with three deterministic scenario cards (긍정 관찰 시나리오/기준 유지 시나리오/주의 점검 시나리오) and a "리스크 체크리스트" section with stock/ETF-specific items to the MK AI panel in `src/pages/chart-ai.astro`; extended `buildMockMkAiAnalysis(record, context)` to return `scenarios`, `riskChecklist`, `scenarioNote`, and `connectedScenarioNote`; folded rendering into the existing `updateMkAiPanel()` function so scenario/risk sections update on selected-symbol change and owner-local quote/OHLC preview success without adding new call sites; added an owner-local connected-state scenario note ("오너 로컬 KIS 연결 상태가 확인되었지만, 시나리오와 체크리스트는 아직 샘플 로직 기준입니다."); added minimal mobile-safe CSS for scenario cards.
- **Preserved policy**: no external AI API calls, no server-side AI route, no public KIS quote, no public KIS OHLC, no `source=live`, no `source=auto`, no owner-local gate weakening, no raw KIS response, no secrets, no account/trading APIs, no Supabase/SQL/migration, no Vercel env changes, no dependency changes.
- **Validation**: `npm run check:phase-3ew-c-mk-ai-mocked-scenario-risk-checklist-expansion` PASS (50/50); full established validation suite PASS (13 commands); `npm run build` PASS. One pre-existing checker (`check_chart_ai_ux_skeleton_static_contract.mjs`) had a stale literal-copy guard narrowed to avoid colliding with the new legitimate "리스크 체크리스트" label.
- **Vercel deployment**: `vercel --prod --yes` succeeded (deployment id `dpl_H8SrWq1TcZJ7MeahCwbdGmFCi7XQ`, readyState `READY`). Deployment URL `https://mkstocklab-iaevgc1w0-sbchangkyun-2946s-projects.vercel.app`; production URL `https://mkstocklab.vercel.app`. Post-deploy status check `curl -I https://mkstocklab.vercel.app/chart-ai` returned HTTP 200. No Vercel env changes. Push not required — Vercel CLI deployed the local working directory directly.
- **Recommended next phase**: Phase 3EV-C — Chart AI Owner-Local KIS Connected Result UI Enhancement. Alternative: Phase 3EW-D — MK AI Mocked Action Plan and User Guidance Expansion.

## Phase 3EW-B - 2026-07-02

### MK AI Analysis Panel Interaction and Explanation Depth (Implemented)

- **Status**: Implemented — MK AI interaction and explanation depth complete.
- **Background**: Phase 3EW-A implemented the mocked-first MK AI analysis panel. The owner requested faster implementation progress. This phase adds sectioned interaction and deeper explanation without external AI API calls and without public KIS data exposure.
- **Implemented scope**: restructured the MK AI panel in `src/pages/chart-ai.astro` into five labeled sections (요약, 핵심 해석, 분석 근거, 확인 체크리스트, 데이터 한계); added native `<details>/<summary>` expand/collapse areas for "분석 근거 자세히 보기" and "데이터 한계 확인"; extended `buildMockMkAiAnalysis(record, context)` to return `keyInterpretation`, `evidence`, `checklist`, `limitations`, and `connectedNote` alongside the existing `summary`/`basis`/`status`, with distinct stock/ETF-safe copy; added a deterministic 4-item checklist; added owner-local connected-state explanation text (`#chartAiMkAiConnectedNote`) shown only after a successful owner-local quote/OHLC preview; added a `getTopicParticle(name)` Korean particle helper applied to the overview and MK AI summary copy.
- **Preserved policy**: no external AI API calls, no server-side AI route, no public KIS quote, no public KIS OHLC, no `source=live`, no `source=auto`, no production deployment, no owner-local gate weakening, no raw KIS response, no secrets, no account/trading APIs, no Supabase/SQL/migration, no Vercel changes, no dependency changes, no deployment, and no push.
- **Validation**: `npm run check:phase-3ew-b-mk-ai-analysis-panel-interaction-depth` PASS (50/50); full established validation suite PASS; `npm run build` PASS.
- **Recommended next phase**: Phase 3EW-C — MK AI Mocked Scenario and Risk Checklist Expansion. Alternative: Phase 3EV-C — Chart AI Owner-Local KIS Connected Result UI Enhancement.

## Phase 3EW-A - 2026-07-02

### MK AI Analysis Panel Mocked-First Implementation (Implemented)

- **Status**: Implemented — mocked-first MK AI analysis panel complete.
- **Background**: Phase 3EV-B completed selected-symbol overview/detail behavior. The owner requested faster implementation progress. This phase implements visible MK AI analysis preview behavior without external AI API calls and without public KIS data exposure.
- **Implemented scope**: upgraded the sidebar MK AI note in `src/pages/chart-ai.astro` into a mocked-first analysis panel (eyebrow, "AI 분석 미리보기" heading, status badge, summary, three deterministic bullets, data basis list, disclaimers); added a deterministic `buildMockMkAiAnalysis(record, context)` builder with stock/ETF/other-safe copy; wired `updateMkAiPanel()` into `updateSelection()` for selected-symbol synchronization and into the owner-local quote/OHLC preview success paths to reflect "오너 로컬 데이터 반영" status and an "오너 로컬 KIS 연결 상태" data basis entry, without ever inserting actual quote/OHLC values into the panel text; public/default `/chart-ai` shows "샘플 분석" status only.
- **Preserved policy**: no external AI API calls, no server-side AI route, no public KIS quote, no public KIS OHLC, no `source=live`, no `source=auto`, no production deployment, no owner-local gate weakening, no raw KIS response, no secrets, no account/trading APIs, no Supabase/SQL/migration, no Vercel changes, no dependency changes, no deployment, and no push.
- **Validation**: `npm run check:phase-3ew-a-mk-ai-analysis-panel-mocked-first` PASS (46/46); full established validation suite PASS; `npm run build` PASS.
- **Recommended next phase**: Phase 3EW-B — MK AI Analysis Panel Interaction and Explanation Depth. Alternative: Phase 3EV-C — Chart AI Owner-Local KIS Connected Result UI Enhancement.

## Phase 3EV-B - 2026-07-02

### Chart AI Company Overview and Selected Symbol Detail Implementation (Implemented)

- **Status**: Implemented — selected-symbol-aware company overview and detail behavior complete.
- **Background**: Phase 3EV-A hardened public sample/fallback states. The owner requested faster implementation progress. This phase improves visible `/chart-ai` product behavior without adding public KIS data.
- **Implemented scope**: added a deterministic `buildSelectedSymbolOverview()` detail builder and an `updateOverviewDataStatus()` helper in `src/pages/chart-ai.astro`; upgraded the sidebar company panel to a selected-symbol-aware "종목 개요" panel with 종목명/종목코드/시장/종목 유형/통화/데이터 상태 fields plus a stock/ETF/other-safe overview sentence and disclaimer copy; extended `updateSelection()` to sync these fields, reset owner-local connection state, and update the selected-symbol-aware MK AI readiness note; preserved existing OHLC/quote preview reset and sample-chart-on-period-change behavior; added an inline hint for an empty 조회 submission.
- **Preserved policy**: no public KIS quote, no public KIS OHLC, no `source=live`, no `source=auto`, no production deployment, no owner-local gate weakening, no raw KIS response, no secrets, no account/trading APIs, no Supabase/SQL/migration, no Vercel changes, no dependency changes, no deployment, and no push.
- **Validation**: `npm run check:phase-3ev-b-chart-ai-company-overview-selected-symbol-detail` PASS (44/44); full 26-command established validation suite PASS; `npm run build` PASS.
- **Recommended next phase**: Phase 3EV-C — Chart AI Owner-Local KIS Connected Result UI Enhancement. Alternative: Phase 3EW-A — MK AI Analysis Panel Mocked-First Implementation.

## Phase 3EV-A - 2026-07-02

### Chart AI Public Sample/Fallback Hardening (Implemented)

- **Status**: Implemented — public sample/fallback hardening and owner-local KIS connected mode labeling applied to `/chart-ai`. No gate, route, or provider changes.
- **Background**: Phase 3EU-OWNER-REVIEW-CLOSEOUT closed the Chart AI data integration policy review as `PASS_WITH_POLICY_BOUNDARY` and recommended this phase. The owner requested faster implementation and fewer documentation-only phases, and asked that the KIS API be treated as a real connected implementation — not only as a test/smoke path — meaning the owner-local KIS quote/OHLC preview should read as an actual connected owner-local runtime path, while public/default `/chart-ai` remains sample/mocked but should look intentional and product-ready.
- **Implemented scope**: public/default sample-mode helper copy; owner-local KIS connected mode labeling ("KIS 연결 프리뷰" panel heading, "오너 로컬 KIS 연결 모드" active-mode eyebrow/guide text); consistent blocked/unavailable/malformed fallback copy for both quote and OHLC preview controls; hardened static company overview fallback fields; confirmed unchanged deterministic sample chart fallback behavior; updated MK AI readiness copy.
- **KIS connected state**: owner-local quote/OHLC preview routes, gate conditions (localhost, env flags, provider gate, endpoint verification), and provider/adapter files are unchanged. No public KIS quote/OHLC exposure, no `source=live`, no `source=auto` were added. No raw response, provider code, or secret is exposed by the new copy.
- **Safety**: UI/copy-only change to `src/pages/chart-ai.astro`; no API route/provider/gate change; no live KIS call, dev server, browser, Playwright/Puppeteer, or screenshot used by Codex; no `.env` read; no actual market values recorded; no account/trading APIs; no Supabase/SQL/migration; no Vercel changes; no dependency changes; no deployment; no push.
- **Validation**: full validation suite run, all green. `check:phase-3ev-a-chart-ai-public-sample-fallback-hardening` 42/42, `check:phase-3eu-owner-review-closeout-chart-ai-data-policy` 45/45, `check:phase-3eu-owner-review-chart-ai-data-integration-policy` 47/47, `check:phase-3eu-chart-ai-data-integration-policy-public-boundary-plan` 48/48, `check:phase-3en-hf1-legacy-kis-checker-cleanup` 42/42, `check:kis-quote-adapter-mocked` 101/101, `check:phase-3et-owner-review-closeout-chart-ai-ohlc-preview` 41/41, `check:phase-3et-owner-review-retry-after-ohlc-preview-ux-simplification` 44/44, `check:phase-3et-hf1-owner-local-ohlc-preview-control-ux-simplification` 46/46, `check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring` 62/62, `check:phase-3et-owner-review-chart-ai-ohlc-preview` 38/38, `check:phase-3es-owner-local-kis-ohlc-smoke-closeout` 38/38, `check:phase-3es-owner-local-kis-ohlc-smoke` 70/70, `check:phase-3ep-owner-review-closeout` 32/32, `check:phase-3eq-kis-chart-ohlc-feasibility-plan` 66/66, `check:phase-3ep-chart-ai-owner-local-quote-preview-wiring` 49/49, `check:phase-3eo-owner-local-kis-quote-smoke` 58/58, `check:phase-3en-kis-quote-adapter-owner-local-gate` 87/87, `check:provider-boundaries` PASS, `check:kis-runtime-guard` 7/7, `check:kis-error-fallback` 48/48, `check:chart-ai-ux-skeleton` 82/82, `check:mobile-baseline` 74/74, `check:production-domain` 33/33, `build` PASS, `git diff --check` PASS, `guard:production-mobile-geometry` DRY_RUN. Three literal-copy checker assertions were updated to reflect the newly accepted UI copy, and two checkers (`check:phase-3eu-owner-review-chart-ai-data-integration-policy`, `check:phase-3eu-chart-ai-data-integration-policy-public-boundary-plan`) were updated to diff a pinned commit range instead of an open-ended one (same fragility class already fixed in Phase 3EN-HF1); no safety assertion was weakened. No known checker failures remain.
- **Recommended next phase**: Phase 3EV-A-OWNER-RUNTIME-CHECK — Owner Local Runtime Check of Public Sample/Fallback and KIS Connected Mode. Alternative: Phase 3EV-B — Owner-Auth Gated Preview Plan, only if the owner wants to plan authenticated preview beyond localhost.

## Phase 3EU-OWNER-REVIEW-CLOSEOUT - 2026-07-02

### Chart AI Data Integration Policy Owner Review Closeout (Closed — PASS_WITH_POLICY_BOUNDARY)

- **Status**: Closed — owner review PASS_WITH_POLICY_BOUNDARY. No runtime source changes.
- **Decision**: `PASS_WITH_POLICY_BOUNDARY`.
- **Background**: Phase 3EU completed the Chart AI data integration policy and public boundary plan, and Phase 3EU-OWNER-REVIEW prepared the owner review package. The owner accepted the recommended policy boundary as the working baseline before any 3EV implementation or public data boundary change.
- **Accepted policy decisions**: public/default `/chart-ai` remains sample/mocked; owner-local preview remains the only approved KIS-backed runtime path; public live quote and public live OHLC remain unauthorized; `source=live` remains unauthorized for public/default use; `source=auto` remains deferred; production deployment remains unauthorized; KIS approval gates, UI labeling policy, route/API boundary, fallback/degradation policy, security/compliance policy, decision matrix, and recommended implementation sequence are accepted as the baseline.
- **Not authorized**: no public KIS data authorization, no public live quote, no public live OHLC, no public delayed KIS data, no `source=live`, no `source=auto`, no production deployment, no owner-local gate weakening, no reuse of owner-local routes as public routes, no account/trading/order/balance APIs, no `KIS_ACCOUNT_NO` usage for Chart AI quote/OHLC, no raw KIS response exposure, and no secrets exposure.
- **Safety**: no runtime changes, no live KIS call, no dev server/browser, no `.env` read, no actual market values recorded, no raw response, no secrets, no account/trading APIs, no screenshot committed, no Supabase/SQL/migration, no Vercel changes, no dependency changes, no deployment, and no push.
- **Validation**: full validation suite run, all green. `check:phase-3eu-owner-review-closeout-chart-ai-data-policy` 45/45, `check:phase-3eu-owner-review-chart-ai-data-integration-policy` 47/47, `check:phase-3eu-chart-ai-data-integration-policy-public-boundary-plan` 48/48, `check:phase-3en-hf1-legacy-kis-checker-cleanup` 42/42, `check:kis-quote-adapter-mocked` 101/101, `check:phase-3et-owner-review-closeout-chart-ai-ohlc-preview` 41/41, `check:phase-3et-owner-review-retry-after-ohlc-preview-ux-simplification` 44/44, `check:phase-3et-hf1-owner-local-ohlc-preview-control-ux-simplification` 46/46, `check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring` 62/62, `check:phase-3et-owner-review-chart-ai-ohlc-preview` 38/38, `check:phase-3es-owner-local-kis-ohlc-smoke-closeout` 38/38, `check:phase-3es-owner-local-kis-ohlc-smoke` 70/70, `check:phase-3ep-owner-review-closeout` 32/32, `check:phase-3eq-kis-chart-ohlc-feasibility-plan` 66/66, `check:phase-3ep-chart-ai-owner-local-quote-preview-wiring` 49/49, `check:phase-3eo-owner-local-kis-quote-smoke` 58/58, `check:phase-3en-kis-quote-adapter-owner-local-gate` 87/87, `check:provider-boundaries` PASS, `check:kis-runtime-guard` 7/7, `check:kis-error-fallback` 48/48, `check:chart-ai-ux-skeleton` 82/82, `check:mobile-baseline` 74/74, `check:production-domain` 33/33, `build` PASS, `git diff --check` PASS, `guard:production-mobile-geometry` DRY_RUN. No known checker failures remain.
- **Recommended next phase**: Phase 3EV-A — Public Sample/Fallback Hardening. Alternatives: Phase 3EV-B — Owner-Auth Gated Preview Plan, or Phase 3EV-C — Public Delayed Data Feasibility Review only if explicitly chosen.

## Phase 3EU-OWNER-REVIEW - 2026-07-02

### Chart AI Data Integration Policy Owner Review Preparation (Prepared — owner policy review pending)

- **Status**: Prepared — owner policy review pending. No runtime source changes.
- **Background**: Phase 3EU completed the Chart AI data integration policy and public boundary plan after owner-local quote/OHLC preview validation and Phase 3EN-HF1 checker cleanup. This phase prepares the owner review package required before any 3EV implementation or public data boundary change.
- **Review scope**: public/default `/chart-ai` sample/mocked policy, owner-local KIS-backed preview boundary, source mode policy (`fixture`, `mocked`, `owner-local`, `live`, `auto`), public production boundary, KIS approval gates, UI labeling policy, route/API boundary, fallback/degradation policy, security/compliance policy, production deployment policy, decision matrix, and recommended implementation sequence.
- **Recommended decision**: `PASS_WITH_POLICY_BOUNDARY` — accept the Phase 3EU policy as the working baseline, keep public/default `/chart-ai` sample/mocked, keep owner-local preview as the only approved KIS-backed runtime path, keep public live quote/OHLC unauthorized, keep `source=live` unauthorized for public/default use, keep `source=auto` deferred, and keep production deployment unauthorized.
- **Safety**: no runtime changes, no live KIS call, no dev server/browser, no `.env` read, no actual market values recorded, no raw response, no secrets, no account/trading APIs, no screenshot committed, no public KIS data authorization, no `source=live` or `source=auto` authorization, no production deployment authorization, no Supabase/SQL/migration, no Vercel changes, no dependency changes, no deployment, and no push.
- **Validation**: full validation suite run, all green. `check:phase-3eu-owner-review-chart-ai-data-integration-policy` 47/47, `check:phase-3eu-chart-ai-data-integration-policy-public-boundary-plan` 48/48, `check:phase-3en-hf1-legacy-kis-checker-cleanup` 42/42, `check:kis-quote-adapter-mocked` 101/101, `check:phase-3et-owner-review-closeout-chart-ai-ohlc-preview` 41/41, `check:phase-3et-owner-review-retry-after-ohlc-preview-ux-simplification` 44/44, `check:phase-3et-hf1-owner-local-ohlc-preview-control-ux-simplification` 46/46, `check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring` 62/62, `check:phase-3et-owner-review-chart-ai-ohlc-preview` 38/38, `check:phase-3es-owner-local-kis-ohlc-smoke-closeout` 38/38, `check:phase-3es-owner-local-kis-ohlc-smoke` 70/70, `check:phase-3ep-owner-review-closeout` 32/32, `check:phase-3eq-kis-chart-ohlc-feasibility-plan` 66/66, `check:phase-3ep-chart-ai-owner-local-quote-preview-wiring` 49/49, `check:phase-3eo-owner-local-kis-quote-smoke` 58/58, `check:phase-3en-kis-quote-adapter-owner-local-gate` 87/87, `check:provider-boundaries` PASS, `check:kis-runtime-guard` 7/7, `check:kis-error-fallback` 48/48, `check:chart-ai-ux-skeleton` 82/82, `check:mobile-baseline` 74/74, `check:production-domain` 33/33, `build` PASS, `git diff --check` PASS, `guard:production-mobile-geometry` DRY_RUN. No known checker failures remain.
- **Next step**: owner performs policy review. PASS leads to Phase 3EU-OWNER-REVIEW-CLOSEOUT. REVISE/FAIL routes to Phase 3EU-HF* policy revision. Alternative implementation track after acceptance: Phase 3EV-A — Public Sample/Fallback Hardening.

## Phase 3EU - 2026-07-02

### Chart AI Data Integration Policy and Public Boundary Plan (Completed — policy plan ready)

- **Status**: Completed — Chart AI data integration policy and public boundary plan ready. No runtime source changes.
- **Background**: Phase 3ET-OWNER-REVIEW-CLOSEOUT closed Chart AI owner-local OHLC preview as PASS, and Phase 3EN-HF1 restored validation reliability with no known checker failures. This phase defines how Chart AI data integration may proceed beyond owner-local preview.
- **Policy scope**: current accepted state, data source modes (`fixture`, `mocked`, `owner-local`, `live`, `auto`), public production boundary, owner-local boundary, KIS approval gates, UI labeling policy, route/API boundary, fallback policy, security/compliance policy, production deployment policy, implementation sequence, decision matrix, and open questions.
- **Policy decision**: public/default `/chart-ai` remains sample/mocked. Owner-local preview remains the only approved KIS-backed runtime path. Public live/delayed KIS quote or OHLC exposure, `source=live`, `source=auto`, and production deployment remain unauthorized until separate approval gates are complete.
- **Safety**: no runtime changes, no live KIS call, no dev server/browser, no `.env` read, no actual market values recorded, no raw response, no secrets, no account/trading APIs, no screenshot committed, no Supabase/SQL/migration, no Vercel changes, no dependency changes, no deployment, and no push.
- **Validation**: full validation suite run, all green. `check:phase-3eu-chart-ai-data-integration-policy-public-boundary-plan` 48/48, `check:phase-3en-hf1-legacy-kis-checker-cleanup` 42/42, `check:kis-quote-adapter-mocked` 101/101, `check:phase-3et-owner-review-closeout-chart-ai-ohlc-preview` 41/41, `check:phase-3et-owner-review-retry-after-ohlc-preview-ux-simplification` 44/44, `check:phase-3et-hf1-owner-local-ohlc-preview-control-ux-simplification` 46/46, `check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring` 62/62, `check:phase-3et-owner-review-chart-ai-ohlc-preview` 38/38, `check:phase-3es-owner-local-kis-ohlc-smoke-closeout` 38/38, `check:phase-3es-owner-local-kis-ohlc-smoke` 70/70, `check:phase-3ep-owner-review-closeout` 32/32, `check:phase-3eq-kis-chart-ohlc-feasibility-plan` 66/66, `check:phase-3ep-chart-ai-owner-local-quote-preview-wiring` 49/49, `check:phase-3eo-owner-local-kis-quote-smoke` 58/58, `check:phase-3en-kis-quote-adapter-owner-local-gate` 87/87, `check:provider-boundaries` PASS, `check:kis-runtime-guard` 7/7, `check:kis-error-fallback` 48/48, `check:chart-ai-ux-skeleton` 82/82, `check:mobile-baseline` 74/74, `check:production-domain` 33/33, `build` PASS, `git diff --check` PASS, `guard:production-mobile-geometry` DRY_RUN. No known checker failures remain.
- **Recommended next phase**: Phase 3EU-OWNER-REVIEW — Owner Review of Chart AI Data Integration Policy and Public Boundary Plan. Alternative: Phase 3EV-A — Public Sample/Fallback Hardening.

## Phase 3EN-HF1 - 2026-07-02

### Legacy KIS Checker Cleanup (Implemented — validation reliability restored)

- **Status**: Implemented — legacy KIS checker cleanup complete.
- **Background**: Phase 3ET-OWNER-REVIEW-CLOSEOUT closed Chart AI owner-local OHLC preview as PASS, but known checker noise remained from `check:kis-quote-adapter-mocked`, open-ended diff assumptions, and literal-string assertions.
- **Implemented scope**: cleaned the legacy valuation `source=live` comment false positive in `check:kis-quote-adapter-mocked` (the route was already fixture-only/safe-blocked; only a comment was reworded), fixed open-ended diff checker fragility for the known Phase 3ES/3ET checkers (`check:phase-3et-owner-review-chart-ai-ohlc-preview`, `check:phase-3es-owner-local-kis-ohlc-smoke-closeout`, `check:phase-3es-owner-local-kis-ohlc-smoke`) using a bounded `startingCommit..endingCommit` diff, updated the old OHLC copy checker (`check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring`) to accept the current approved `지연 시세 · KIS OHLC · KRW` copy, additionally cleaned the same open-ended diff fragility in two older doc-only checkers (`check:phase-3eq-kis-chart-ohlc-feasibility-plan`, `check:phase-3ep-owner-review-closeout`) since it was directly related and safe, fixed two more checkers (`check:phase-3et-owner-review-closeout-chart-ai-ohlc-preview`, `check:phase-3et-owner-review-retry-after-ohlc-preview-ux-simplification`) that were found to regress during this phase's own validation run for the identical unbounded-diff reason, added a Phase 3EN-HF1 checker, and preserved all owner-local/public safety gates.
- **Preserved policy**: no public live OHLC, no public live quote, no `source=live`, no `source=auto`, no default/public `/chart-ai` live data behavior, no owner-local gate weakening, no raw KIS response, no secrets, no actual market values recorded, no account/trading APIs, no Supabase/SQL/migration, no Vercel changes, no dependency changes, no deployment, and no push.
- **Validation**: full validation suite run, all green. `check:phase-3en-hf1-legacy-kis-checker-cleanup` 42/42, `check:kis-quote-adapter-mocked` 101/101, `check:phase-3et-owner-review-chart-ai-ohlc-preview` 38/38, `check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring` 62/62, `check:phase-3es-owner-local-kis-ohlc-smoke-closeout` 38/38, `check:phase-3es-owner-local-kis-ohlc-smoke` 70/70, `check:phase-3et-owner-review-closeout-chart-ai-ohlc-preview` 41/41, `check:phase-3et-owner-review-retry-after-ohlc-preview-ux-simplification` 44/44, `check:phase-3et-hf1-owner-local-ohlc-preview-control-ux-simplification` 46/46, `check:phase-3ep-chart-ai-owner-local-quote-preview-wiring` 49/49, `check:phase-3eo-owner-local-kis-quote-smoke` 58/58, `check:phase-3en-kis-quote-adapter-owner-local-gate` 87/87, `check:provider-boundaries` PASS, `check:kis-runtime-guard` 7/7, `check:kis-error-fallback` 48/48, `check:chart-ai-ux-skeleton` 82/82, `check:mobile-baseline` 74/74, `check:production-domain` 33/33, `build` PASS, `git diff --check` PASS, `guard:production-mobile-geometry` DRY_RUN, `check:phase-3eq-kis-chart-ohlc-feasibility-plan` 66/66, `check:phase-3ep-owner-review-closeout` 32/32. No known checker failures remain.
- **Recommended next phase**: Phase 3EU — Chart AI Data Integration Policy and Public Boundary Plan. Alternative: continue legacy checker cleanup only if optional older checker failures remain.

## Phase 3ET-OWNER-REVIEW-CLOSEOUT - 2026-07-02

### Chart AI OHLC Preview Owner Review Closeout (Closed — PASS after HF1 UX simplification)

- **Status**: Closed — owner review PASS after Phase 3ET-HF1 UX simplification. No runtime source changes.
- **Decision**: `PASS`.
- **Background**: Phase 3ET wired the Chart AI owner-local OHLC preview, the initial owner review found the chart-left controls too technical, Phase 3ET-HF1 simplified the UI, and Phase 3ET-OWNER-REVIEW-RETRY prepared a manual retry checklist.
- **Owner-reviewed evidence**: owner visually confirmed `/chart-ai?source=owner-local` after HF1. The main chart no longer shows the previous chart-left OHLC button/guide; the right-side `KIS 로컬 프리뷰` card contains both `KIS 시세 프리뷰 확인` and `KIS 차트 프리뷰 확인`; the OHLC preview success state is visible; the main chart status shows delayed KIS OHLC state; the existing quote preview remains present; and no raw response, secret, stack trace, request header, or unsafe output is visible. No actual quote/OHLC/volume/timestamp values are recorded.
- **Accepted scope**: simplified main chart area, sidebar-based KIS local preview controls, concise chart status copy, OHLC preview applied-state copy, fallback/sample policy, quote preview preservation, and owner-local-only boundary.
- **Not authorized**: no public live OHLC, no `source=live`, no `source=auto`, no production deployment, no weakening of owner-local gates, and no default/public `/chart-ai` live data behavior.
- **Safety**: no runtime changes, no live KIS call by Codex, no dev server or browser launched by Codex, no `.env` read, no actual OHLC or quote values recorded, no raw response, no secrets, no account/trading APIs, no screenshot committed, no Supabase/SQL/migration, no Vercel changes, no dependency changes, no deployment, and no push.
- **Validation**: full 15-command suite run. `check:phase-3et-owner-review-closeout-chart-ai-ohlc-preview` 41/41, `check:phase-3et-owner-review-retry-after-ohlc-preview-ux-simplification` 44/44, `check:phase-3et-hf1-owner-local-ohlc-preview-control-ux-simplification` 46/46, `check:phase-3ep-chart-ai-owner-local-quote-preview-wiring` 49/49, `check:phase-3eo-owner-local-kis-quote-smoke` 58/58, `check:phase-3en-kis-quote-adapter-owner-local-gate` 87/87, `check:provider-boundaries` PASS, `check:kis-runtime-guard` 7/7, `check:kis-error-fallback` 48/48, `check:chart-ai-ux-skeleton` 82/82, `check:mobile-baseline` 74/74, `check:production-domain` 33/33, `build` PASS, `git diff --check` PASS, `guard:production-mobile-geometry` DRY_RUN. Known unrelated failures, not run/fixed: `check:kis-quote-adapter-mocked` 100/101; `check:phase-3et-owner-review-chart-ai-ohlc-preview` 37/38; `check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring` 61/62; `check:phase-3es-owner-local-kis-ohlc-smoke-closeout` 37/38; `check:phase-3es-owner-local-kis-ohlc-smoke` 68/70 (pre-existing open-ended diff / literal-string checker fragility).
- **Recommended next phase**: Phase 3EN-HF1 — Legacy KIS Checker Cleanup. Alternative: Phase 3EU — Chart AI Data Integration Policy and Public Boundary Plan.

## Phase 3ET-OWNER-REVIEW-RETRY - 2026-07-02

### Chart AI Owner-Local OHLC Preview Review Retry Preparation (Prepared — owner review retry pending)

- **Status**: Prepared — owner visual/runtime review retry pending. No runtime source changes.
- **Background**: Phase 3ET-HF1 simplified the owner-local OHLC preview UI after owner feedback that the chart-left controls were too technical. The OHLC preview trigger now lives inside the right-side KIS local preview card with simplified copy.
- **Review scope**: default `/chart-ai` sample behavior, simplified main chart area, right-side KIS 로컬 프리뷰 quote/chart button layout, explicit-click OHLC preview, chart readability, chart status after OHLC preview, period reset, symbol reset, blocked/unavailable fallback, quote preview preservation, no unsafe output, and mobile/theme layout.
- **Owner workload**: owner runs the local dev server with local KIS credentials and flags, reviews the updated UI manually, and returns only the sanitized PASS/FAIL template.
- **Safety**: no runtime changes, no live KIS call by Codex, no dev server or browser launched by Codex, no `.env` read, no actual OHLC values recorded, no raw response, no secrets, no account/trading APIs, no public OHLC API changes, no Supabase/SQL/migration, no Vercel changes, no dependency changes, no deployment, and no push.
- **Validation**: full 14-command suite run. `check:phase-3et-owner-review-retry-after-ohlc-preview-ux-simplification` 44/44, `check:phase-3et-hf1-owner-local-ohlc-preview-control-ux-simplification` 46/46, `check:phase-3ep-chart-ai-owner-local-quote-preview-wiring` 49/49, `check:phase-3eo-owner-local-kis-quote-smoke` 58/58, `check:phase-3en-kis-quote-adapter-owner-local-gate` 87/87, `check:provider-boundaries` PASS, `check:kis-runtime-guard` 7/7, `check:kis-error-fallback` 48/48, `check:chart-ai-ux-skeleton` 82/82, `check:mobile-baseline` 74/74, `check:production-domain` 33/33, `build` PASS, `git diff --check` PASS, `guard:production-mobile-geometry` DRY_RUN. Known unrelated failures, not run/fixed: `check:kis-quote-adapter-mocked` 100/101; `check:phase-3et-owner-review-chart-ai-ohlc-preview` 37/38; `check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring` 61/62; `check:phase-3es-owner-local-kis-ohlc-smoke-closeout` 37/38; `check:phase-3es-owner-local-kis-ohlc-smoke` 68/70 (pre-existing open-ended diff / literal-string checker fragility).
- **Next step**: owner performs the manual local review retry. PASS leads to Phase 3ET-OWNER-REVIEW-CLOSEOUT. FAIL routes to focused Phase 3ET-HF* hotfixes. Alternative: Phase 3EN-HF1 — Legacy KIS Checker Cleanup.

## Phase 3ET-HF1 - 2026-07-02

### Owner-Local OHLC Preview Control UX Simplification (Implemented — owner review retry recommended)

- **Status**: Implemented — owner-local OHLC preview control UX simplified.
- **Background**: During owner visual review of Phase 3ET, the chart-left "KIS OHLC 프리뷰 확인" button and owner-local guide copy were judged too technical and visually unnecessary inside the main chart area.
- **Implemented scope**: simplified the main chart area, removed/de-emphasized the chart-level owner-local guide, moved or contained the OHLC preview trigger in the KIS local preview sidebar card, clarified chart status copy, preserved explicit-click OHLC preview behavior, preserved fallback to sample chart, and preserved the existing quote preview.
- **Preserved policy**: no default live OHLC fetch, no public live OHLC exposure, no source=live, no source=auto, no raw KIS response, no secrets, no actual OHLC values in docs, no account/trading APIs, no Supabase/SQL/migration, no Vercel changes, no dependency changes, no deployment, and no push.
- **Validation**: full 15-command suite run. `check:phase-3et-hf1-owner-local-ohlc-preview-control-ux-simplification` 46/46, `check:phase-3et-owner-review-chart-ai-ohlc-preview` 37/38 (expected regression — pre-existing open-ended diff checker fragility, tripped for the first time by this phase's own legitimate `src/pages/chart-ai.astro` change), `check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring` 61/62 (expected regression — check #37 asserts the old tag text `지연 시세 · 오너 로컬 OHLC · KRW`, intentionally replaced by this phase's simplified copy `지연 시세 · KIS OHLC · KRW`), `check:phase-3ep-chart-ai-owner-local-quote-preview-wiring` 49/49, `check:phase-3eo-owner-local-kis-quote-smoke` 58/58, `check:phase-3en-kis-quote-adapter-owner-local-gate` 87/87, `check:provider-boundaries` PASS, `check:kis-runtime-guard` 7/7, `check:kis-error-fallback` 48/48, `check:chart-ai-ux-skeleton` 82/82, `check:mobile-baseline` 74/74, `check:production-domain` 33/33, `build` PASS, `git diff --check` PASS, `guard:production-mobile-geometry` DRY_RUN. Known unrelated failures, not fixed: `check:kis-quote-adapter-mocked` 100/101; `check:phase-3es-owner-local-kis-ohlc-smoke-closeout` 37/38; `check:phase-3es-owner-local-kis-ohlc-smoke` 68/70 (pre-existing open-ended diff checker fragility).
- **Recommended next phase**: Phase 3ET-OWNER-REVIEW-RETRY — Owner Local Review Retry after OHLC Preview UX Simplification. Alternative: Phase 3EN-HF1 — Legacy KIS Checker Cleanup.

## Phase 3ET-OWNER-REVIEW - 2026-07-01

### Chart AI Owner-Local OHLC Preview Owner Review Preparation (Prepared — owner visual/runtime review pending)

- **Status**: Prepared — owner visual/runtime review pending. No runtime source changes.
- **Background**: Phase 3ET wired the Chart AI owner-local OHLC preview behind the full owner-local gate. The next step is manual local review to confirm visible behavior, live owner-local rendering, fallback behavior, quote preview preservation, and mobile/theme stability.
- **Review scope**: default `/chart-ai` sample behavior, `/chart-ai?source=owner-local` button enablement, explicit-click OHLC preview, chart readability, period reset, symbol reset, blocked/unavailable fallback, quote preview preservation, no unsafe output, and mobile/theme layout.
- **Owner workload**: owner runs the local dev server with local KIS credentials and flags, reviews the UI manually, and returns only the sanitized PASS/FAIL template.
- **Safety**: no runtime changes, no live KIS call by Codex, no dev server or browser launched by Codex, no `.env` read, no actual OHLC values recorded, no raw response, no secrets, no account/trading APIs, no public OHLC API changes, no Supabase/SQL/migration, no Vercel changes, no deployment, and no push.
- **Validation**: full 15-command suite run. `check:phase-3et-owner-review-chart-ai-ohlc-preview` 38/38, `check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring` 62/62, `check:phase-3ep-chart-ai-owner-local-quote-preview-wiring` 49/49, `check:phase-3eo-owner-local-kis-quote-smoke` 58/58, `check:phase-3en-kis-quote-adapter-owner-local-gate` 87/87, `check:provider-boundaries` PASS, `check:kis-runtime-guard` 7/7, `check:kis-error-fallback` 48/48, `check:chart-ai-ux-skeleton` 82/82, `check:mobile-baseline` 74/74, `check:production-domain` 33/33, `build` PASS, `git diff --check` PASS, `guard:production-mobile-geometry` DRY_RUN. Known unrelated failures, not fixed: `check:kis-quote-adapter-mocked` 100/101; `check:phase-3es-owner-local-kis-ohlc-smoke-closeout` 37/38; `check:phase-3es-owner-local-kis-ohlc-smoke` 68/70 (newly observed — same open-ended diff checker fragility, tripped by Phase 3ET's own already-committed API route addition).
- **Next step**: owner performs the manual local review. PASS leads to Phase 3ET-OWNER-REVIEW-CLOSEOUT. FAIL routes to focused Phase 3ET-HF* hotfixes. Alternative: Phase 3EN-HF1 — Legacy KIS Checker Cleanup.

## Phase 3ET - 2026-07-01

### Chart AI Owner-Local OHLC Preview Wiring (Implemented — no public OHLC exposure)

- **Status**: Implemented — owner-local Chart AI OHLC preview wiring is in place. Public production
  Chart AI still renders the mocked/sample candlestick chart by default; no live KIS OHLC call is
  possible outside the full owner-local gate.
- **Background**: Phase 3ES-OWNER-SMOKE-CLOSEOUT closed with an owner-local KIS OHLC smoke
  `PASS_WITH_OWNER_LOCAL_RUN` (KR `005930`, stock, period `1m`, endpoint `KR_STOCK_DAILY_OHLC`
  verified, renderable series with all field-presence booleans true), but returned no actual OHLC
  values and no Chart AI wiring. This phase adds the first Chart AI-facing owner-local OHLC
  preview path.
- **Implemented scope**: owner-local OHLC preview adapter (`kisOwnerLocalOhlcPreview.ts`) returning
  client-safe sanitized OHLC points only under the full owner-local gate; owner-local-gated GET-only
  API route (`owner-local-ohlc-preview.ts`) requiring `source=owner-local`, `preview=ohlc`,
  localhost, and the three explicit env flags, KR-only, `Cache-Control: no-store`; a small
  `NormalizedOhlcPoint` → `MockedOhlcPoint` chart adapter (`ohlcPreviewChart.ts`) reusing the
  existing SVG chart geometry/renderer unchanged; a new owner-local-gated "KIS OHLC 프리뷰 확인"
  control on `/chart-ai`, disabled unless `source=owner-local`, never auto-fetching, resetting to
  the sample chart on symbol or period change and on any blocked/unavailable/malformed/insufficient
  response.
- **Preserved policy**: public production stays mocked/sample only; default `/chart-ai` behavior is
  unchanged; no public OHLC API route besides the owner-local-gated one; no `source=live`, no
  `source=auto`; no account/trading API added; no `KIS_ACCOUNT_NO` usage; no raw KIS response, no
  secrets, and no actual OHLC values recorded in docs/logs/checkers/fixtures; no Supabase/SQL/
  migration changes; no Vercel changes; no dependency added; the existing KIS quote preview card
  and route are untouched; no deployment; and no push.
- **Validation**: Phase 3ET contract PASS (62/62), Phase 3ES PASS (70/70), Phase 3EP wiring PASS
  (49/49), Phase 3EO PASS (58/58), Phase 3EN PASS (87/87), provider boundaries PASS, KIS runtime
  guard PASS (7/7), KIS error fallback PASS (48/48), Chart AI UX skeleton PASS (82/82), mobile
  baseline PASS (74/74), production-domain PASS (33/33), production build PASS, `git diff --check`
  PASS, and production mobile geometry guard `DRY_RUN` with no browser or network. Known
  pre-existing unrelated failures remain, none fixed or weakened this phase: `check:kis-quote-
  adapter-mocked` 100/101; `check:phase-3es-owner-local-kis-ohlc-smoke-closeout` 37/38 and
  `check:phase-3er-kis-ohlc-contract-mocked-adapter`, `check:phase-3eq-kis-chart-ohlc-feasibility-
  plan`, `check:phase-3ep-owner-review-closeout` (all open-ended diff fragility — pinned starting
  commit, no pinned ending commit, tripped by this phase's own `src/` additions).
- **Recommended next phase**: Phase 3ET-OWNER-REVIEW — Owner Local Review of Chart AI OHLC Preview.
  Alternative: Phase 3EN-HF1 — Legacy KIS Checker Cleanup.

## Phase 3ES-OWNER-SMOKE-CLOSEOUT - 2026-07-01

### Owner Local KIS OHLC Smoke Closeout (Closed — PASS_WITH_OWNER_LOCAL_RUN)

- **Status**: Closed — owner-local KIS OHLC smoke PASS. The earlier automated-session BLOCKED result is superseded by the owner-run local PASS.
- **Decision**: `PASS_WITH_OWNER_LOCAL_RUN`.
- **Owner-run evidence**: KR `005930`, stock, period `1m`, endpoint `KR_STOCK_DAILY_OHLC`, endpoint verified, HTTP `2xx`, normalized series safe, point count `27`, renderable `true`, open/high/low/close/volume presence booleans all `true`, source `kis-local`, freshness `delayed`, isLive `true`, providerStatus `ok`, rawResponsePrinted `false`, secretsPrinted `false`.
- **Endpoint verification**: `/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice`, tr_id `FHKST03010100`; intraday and US OHLC remain unverified and unused.
- **Preserved policy**: no actual OHLC values recorded, no raw KIS response, no secrets, no account/trading APIs, no public OHLC API route, no Chart AI wiring, no Supabase/SQL/migration, no Vercel changes, no deployment, and no push.
- **Validation**: Phase 3ES-OWNER-SMOKE-CLOSEOUT contract PASS, Phase 3ES contract PASS, Phase 3EP wiring PASS, Phase 3EO PASS, Phase 3EN PASS, provider boundaries PASS, KIS runtime guard PASS, KIS error fallback PASS, Chart AI UX skeleton PASS, mobile baseline PASS, production-domain PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network. Known pre-existing unrelated failures remain, none fixed or weakened this closeout: `check:kis-quote-adapter-mocked` 100/101; `check:phase-3er-kis-ohlc-contract-mocked-adapter` (endpoint-verification assumption superseded by Phase 3ES); `check:phase-3eq-kis-chart-ohlc-feasibility-plan` and `check:phase-3ep-owner-review-closeout` (open-ended diff fragility).
- **Recommended next phase**: Phase 3ET — Chart AI Owner-Local OHLC Preview Wiring. Alternative: Phase 3EN-HF1 — Legacy KIS Checker Cleanup.

## Phase 3ES - 2026-07-01

### Owner-Local KIS OHLC Smoke (BLOCKED in automated session — endpoint verified, pipeline confirmed)

- **Status**: BLOCKED in the automated session — required KIS credential env values and the three
  explicit owner-local OHLC smoke flags are not present in this environment. Endpoint verification
  and the full implementation chain are confirmed correct; this is a credential/flag availability
  block, not an endpoint or authentication failure.
- **Background**: Phase 3ER implemented the normalized OHLC contract and mocked adapter foundation.
  This phase verified the official KR domestic daily/weekly/monthly/yearly OHLC endpoint against the
  official `koreainvestment/open-trading-api` sample repository, then implemented the owner-local
  OHLC smoke chain mirroring the Phase 3EO/3EN owner-local quote smoke pattern.
- **Verified endpoint**: `KR_STOCK_DAILY_OHLC` / `KR_ETF_DAILY_OHLC` —
  `/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice`, tr_id `FHKST03010100`. Intraday
  and US OHLC endpoints remain `unverified` and intentionally unused.
- **Implemented scope**: verified endpoint registry update, request descriptor with verified-only
  query construction, sanitized OHLC mapper, narrow `getKisDomesticDailyOhlcSeries` kisClient
  transport, owner-local OHLC smoke client with a three-flag gate and quality gate, smoke script, and
  static/behavioral checker. Injected-transport behavioral testing confirmed PASS/FAIL/BLOCKED paths
  all work correctly with no network call.
- **Preserved policy**: no Chart AI OHLC wiring, no public OHLC API route, no raw KIS response, no
  secrets, no account/trading APIs, no Supabase/SQL/migration, no Vercel changes, no deployment, and
  no push.
- **Validation**: Phase 3ES contract PASS (70/70), Phase 3EP PASS, Phase 3EO closeout PASS, Phase
  3EO PASS, Phase 3EN PASS, provider boundaries PASS, KIS runtime guard PASS, KIS error fallback
  PASS, Chart AI UX skeleton PASS, mobile baseline PASS, production-domain PASS, production build
  PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or
  network. Known pre-existing unrelated failures remain, none fixed or weakened this phase:
  `check:kis-quote-adapter-mocked` 100/101 (`src/pages/api/portfolio/valuation.ts` `source=live`
  string; file unchanged); `check:phase-3er-kis-ohlc-contract-mocked-adapter` 117/120 (that checker
  asserted all OHLC endpoints stay unverified, which this phase's verified-endpoint scope
  intentionally supersedes); `check:phase-3eq-kis-chart-ohlc-feasibility-plan` 64/66 and
  `check:phase-3ep-owner-review-closeout` 30/32 (both checkers diff from a pinned start commit with
  no pinned end commit, so any later phase's `src/` changes trip their "no runtime change"
  assumption). See Phase 3ES result document §9 for full detail.
- **Recommended next phase**: owner-run local smoke to confirm PASS, then Phase 3ET — Chart AI
  Owner-Local OHLC Preview Wiring. Alternative: Phase 3EN-HF1 — Legacy KIS Checker Cleanup.

## Phase 3ER - 2026-07-01

### KIS OHLC Contract and Mocked Adapter Foundation (Implemented — no live OHLC)

- **Status**: Implemented — normalized OHLC contract and deterministic mocked adapter foundation ready. No live KIS OHLC call and no chart replacement.
- **Background**: Phase 3EQ completed the KIS Chart/OHLC feasibility plan and recommended contract/mocked foundation before owner-local OHLC smoke. Chart AI quote preview is owner-reviewed and PASS, while the main candlestick chart remains sample/mocked.
- **Implemented scope**: normalized OHLC contract, OHLC provider interface, deterministic mocked OHLC provider, KIS OHLC endpoint registry skeleton with all endpoints unverified, blocked KIS OHLC provider skeleton, and static checker.
- **Preserved policy**: no live KIS call, no OHLC smoke, no public OHLC API route, no Chart AI chart replacement, no raw KIS response, no secrets, no account/trading APIs, no Supabase/SQL/migration, no Vercel changes, no deployment, and no push.
- **Validation**: Phase 3ER contract PASS, Phase 3EQ PASS, Phase 3EP closeout PASS, Phase 3EP PASS, Phase 3EO closeout PASS, Phase 3EO PASS, Phase 3EN PASS, Phase 3EM PASS, provider boundaries PASS, KIS runtime guard PASS, KIS error fallback PASS, Chart AI UX skeleton PASS, mobile baseline PASS, production-domain PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network. Known pre-existing unrelated failure remains: `check:kis-quote-adapter-mocked` 100/101 (`src/pages/api/portfolio/valuation.ts` `source=live` string; file unchanged; checker not weakened).
- **Recommended next phase**: Phase 3ES — Owner-Local KIS OHLC Smoke. Alternative: Phase 3EN-HF1 — Legacy KIS Checker Cleanup.

## Phase 3EQ - 2026-07-01

### KIS Chart/OHLC Feasibility and Chart Data Integration Plan (Completed — integration plan ready)

- **Status**: Completed — KIS chart/OHLC feasibility and Chart AI chart data integration plan ready. No runtime source changes.
- **Background**: Phase 3EP-OWNER-REVIEW-CLOSEOUT closed Chart AI owner-local quote preview with PASS. The quote preview is now owner-reviewed, while the main candlestick chart remains mocked/sample OHLC data.
- **Plan scope**: official KIS chart/OHLC source verification, current Chart AI mocked chart contract review, period-control mapping, normalized OHLC contract proposal, domestic stock/ETF feasibility, 1d intraday feasibility, daily/weekly/monthly/yearly feasibility, volume/adjusted-price policy, fallback policy, and safe implementation sequence.
- **Verification note**: the quote endpoint (`inquire-price`/`FHKST01010100`) is already verified in-repo, but chart/OHLC endpoint paths, transaction ids, and parameters are marked `NEEDS_OFFICIAL_VERIFICATION` and are not treated as implementation-ready; they must be verified owner-locally in the OHLC smoke phase.
- **Preserved policy**: no live KIS chart call, no public OHLC API route, no Chart AI chart replacement, no raw KIS response, no secrets, no account/trading APIs, no Supabase/SQL/migration, no Vercel changes, no deployment, and no push.
- **Validation**: Phase 3EQ contract PASS, Phase 3EP closeout PASS, Phase 3EP PASS, Phase 3EO closeout PASS, Phase 3EO PASS, Phase 3EN PASS, Phase 3EM PASS, provider boundaries PASS, KIS runtime guard PASS, KIS error fallback PASS, Chart AI UX skeleton PASS, mobile baseline PASS, production-domain PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network. Known pre-existing unrelated failure remains: `check:kis-quote-adapter-mocked` 100/101 (`src/pages/api/portfolio/valuation.ts` `source=live` string; file unchanged; checker not weakened).
- **Recommended next phase**: Phase 3ER — KIS OHLC Contract and Mocked Adapter Foundation. Alternative: Phase 3EN-HF1 — Legacy KIS Checker Cleanup.

## Phase 3EP-OWNER-REVIEW-CLOSEOUT - 2026-07-01

### Chart AI Owner-Local Quote Preview Owner Review Closeout (Closed — PASS)

- **Status**: Closed — owner review PASS. No runtime source changes.
- **Decision**: `PASS`.
- **Background**: Phase 3EP wired the Chart AI owner-local KIS quote preview behind the owner-local gate. The owner locally reviewed `/chart-ai?source=owner-local` with the required KIS environment flags.
- **Accepted scope**: KIS 로컬 프리뷰 card, owner-local preview button, sanitized quote preview display for 삼성전자 / 005930, current price / previous close / change / change rate / volume / asOf presence, delayed owner-local KRW label, existing sample chart preservation, and no raw response or secret exposure.
- **Production boundary note**: KIS-related variables are registered in Vercel, but public production live quote exposure remains blocked and is not authorized in this phase. The preview remains owner-local gated.
- **Safety**: no runtime changes, no API route changes, no provider changes, no live KIS re-run, no `.env` read, no raw response, no secrets, no actual price values recorded in docs, no Supabase/SQL/migration, no Vercel changes, no deployment, and no push.
- **Validation**: Phase 3EP-OWNER-REVIEW-CLOSEOUT contract PASS, Phase 3EP PASS, Phase 3EO closeout PASS, Phase 3EO PASS, Phase 3EN PASS, Phase 3EM PASS, provider boundaries PASS, KIS runtime guard PASS, KIS error fallback PASS, Chart AI UX skeleton PASS, mobile baseline PASS, production-domain PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network. Known pre-existing unrelated failure remains: `check:kis-quote-adapter-mocked` 100/101 (`src/pages/api/portfolio/valuation.ts` `source=live` string; file unchanged; checker not weakened).
- **Recommended next phase**: Phase 3EQ — KIS Chart/OHLC Feasibility and Chart Data Integration Plan. Alternative: Phase 3EN-HF1 — Legacy KIS Checker Cleanup.

## Phase 3EP - 2026-07-01

### Chart AI Owner-Local Quote Preview Wiring (Implemented — owner-local gated preview)

- **Status**: Implemented — Chart AI owner-local quote preview wired behind the owner-local KIS gate. No public production live quote exposure.
- **Background**: Phase 3EO closed as `PASS_WITH_INTERMITTENT_PROVIDER_NOTE`; the first owner-run smoke PASSed for KR `005930` via `KR_STOCK_QUOTE`, while an immediate retry returned transient `PROVIDER_UNAVAILABLE`. This phase wires a resilience-aware quote preview into Chart AI.
- **Implemented scope**: owner-local preview adapter, gated preview API boundary (`src/pages/api/chart-ai/owner-local-quote-preview.ts`, blocked by default, local-host + explicit query + env-flag + provider-gate required, `Cache-Control: no-store`), Chart AI quote preview UI, selected-symbol preview request handling, blocked/unavailable/provider-unavailable fallback states, and no public default live fetch.
- **Prior-checker maintenance**: five Chart AI page checkers (`check_chart_ai_ux_skeleton`, HF1-SX2, domestic-symbol-wiring, HF2-LX, HF2) evolved their "no page `fetch()`" proxy assertion to "no ungated fetch — only the gated owner-local preview is permitted"; the KIS safety gate in the route/adapter/gate was not weakened.
- **Preserved policy**: public `source=live` remains disabled, `source=auto` remains deferred, preview requires explicit owner-local conditions, no account/trading APIs are added, no raw KIS response or secrets are exposed, no actual prices are recorded in docs, no deployment, and no push.
- **Validation**: Phase 3EP contract PASS, Phase 3EO closeout PASS, Phase 3EO PASS, Phase 3EN PASS, Phase 3EM PASS, Phase 3EL suite PASS, Phase 3EK PASS, Phase 3EJ plan PASS, provider boundaries PASS, KIS runtime guard PASS, KIS error fallback PASS, Chart AI UX skeleton PASS, mobile baseline PASS, production-domain PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network. Known pre-existing unrelated failure remains: `check:kis-quote-adapter-mocked` 100/101 (`src/pages/api/portfolio/valuation.ts` `source=live` string; file unchanged in Phase 3EP; checker not weakened).
- **Recommended next phase**: Phase 3EP-OWNER-REVIEW — Owner Local Review of Chart AI Quote Preview. Alternative: Phase 3EN-HF1 — Legacy KIS Checker Cleanup.

## Phase 3EO - 2026-07-01

### Owner-Local KIS Quote Smoke Preparation and Execution (PASS_WITH_INTERMITTENT_PROVIDER_NOTE — owner-run PASS with transient retry)

- **Status**: PASS_WITH_INTERMITTENT_PROVIDER_NOTE — Owner-local KIS quote smoke. No public API route and no UI quote wiring. The owner ran the prepared owner-local smoke; the first run PASSed for KR `005930` through the verified `KR_STOCK_QUOTE` endpoint, proving live owner-local connectivity. The automated (non-interactive) session had been BLOCKED only because live credentials/flags are absent there; the owner-run PASS supersedes it as the phase decision.
- **Background**: Phase 3EN implemented the owner-local KIS gate and adapter preparation. The owner confirmed KIS_APP_KEY / KIS_APP_SECRET / KIS_ACCESS_TOKEN readiness and prior API communication test history. This phase performs the first controlled owner-local KIS quote smoke, strictly limited to an owner-local script.
- **Implemented scope**: endpoint registry (KR domestic inquire-price verified from official-docs-derived kisClient.ts; US endpoints left unverified and unused), owner-local smoke client (delegates transport to the approved kisClient adapter; no fetch of its own; presence-only env checks; sanitized result), smoke script (explicit flag gate, sanitized summary only, no committed output), sanitized result template, sanitized result document, static/behavioral checker, and env-name contract extended with smoke flag names.
- **Smoke target**: KR stock `005930` as primary smoke target. US stock `AAPL` optional only if official endpoint mapping is verified (currently unverified, so not run).
- **Smoke result**: owner-run first attempt `PASS` (HTTP status class `2xx`, source `kis-local`, freshness `delayed`, isLive `true`, providerStatus `ok`, all field-presence booleans `true`, sanitized fields only, no prices recorded). Immediate retry returned a transient `PROVIDER_UNAVAILABLE` (HTTP status class `5xx`, source `unavailable`, providerStatus `error`), recorded as an intermittent provider-availability note rather than a Phase 3EO failure because the first run succeeded through the same verified endpoint. The earlier automated session remained BLOCKED with HTTP status class `not-run`.
- **Safety**: no app key, app secret, access token, authorization header, raw request, raw response, account number, provider payload, or `.env` content is recorded or committed; no Supabase/SQL/migration; no Vercel environment change; no deployment; and no push.
- **Preserved policy**: no public quote API route, no Chart AI quote preview, public `source=live` remains disabled, `source=auto` remains deferred, public production cannot trigger KIS live behavior, and no account/trading APIs are added.
- **Validation**: Phase 3EO contract PASS, Phase 3EN PASS, Phase 3EM PASS, Phase 3EL-OWNER-REVIEW-HF2-LX-CLOSEOUT PASS, Phase 3EL-HF2-LX PASS, Phase 3EL-HF2 PASS, Phase 3EL-HF1-SX2 PASS, Phase 3EL PASS, Phase 3EK PASS, Phase 3EJ plan PASS, provider boundaries PASS, KIS runtime guard PASS, KIS error fallback PASS, Chart AI UX skeleton PASS, mobile baseline PASS, production-domain PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network. Known pre-existing unrelated failure remains: `check:kis-quote-adapter-mocked` 100/101 (`src/pages/api/portfolio/valuation.ts` `source=live` string; file unchanged in Phase 3EO; checker not weakened).
- **Recommended next phase**: owner-run smoke PASSed, so Phase 3EP — Chart AI Owner-Local Quote Preview Wiring, wiring the preview behind the same owner-local gate with an explicit intermittent-provider fallback so a transient `PROVIDER_UNAVAILABLE` degrades to a safe unavailable state. Contingencies retained: Phase 3EO-HF1 — KIS Endpoint Verification Hotfix (endpoint verification), Phase 3EO-HF2 — KIS Auth/Header Smoke Fix (auth/headers). Alternative: Phase 3EN-HF1 — Legacy KIS Checker Cleanup.

## Phase 3EN - 2026-07-01

### KIS Quote Adapter Owner-Local Gate Implementation (Implemented — smoke-ready gate, no live call)

- **Status**: Implemented — KIS quote adapter owner-local gate ready for smoke preparation. No live KIS call and no public API route.
- **Background**: Phase 3EM established the normalized quote contract, quote provider interface, deterministic mocked quote provider, and blocked KIS provider boundary. The owner requested faster progress toward real KIS API integration. This phase implements the owner-local gate and adapter preparation needed before the first real KIS quote smoke.
- **Implemented scope**: owner-local KIS gate helper, env-name contract, KIS quote request descriptor, sanitized quote mapper stub, extended KIS quote provider boundary, blocked/not-implemented behavior for Phase 3EN, explicit `allowNetwork`/`allowKisLive` gate path, and no public UI quote wiring.
- **Deferred scope**: live KIS quote call, real KIS token request, verified KIS endpoint/tr_id mapping, public quote API route, Chart AI quote preview UI, KIS chart/OHLC, US symbol search UI, MK AI intro/loading/results, deployment, and push.
- **Preserved policy**: first real KIS call remains deferred to Phase 3EO owner-local smoke, public `source=live` remains disabled, `source=auto` remains deferred, no live/current/realtime wording is introduced, no account/trading APIs are added, and public production remains unable to trigger KIS live behavior.
- **Safety**: no live KIS call, no live FX call, no fetch, no `.env` or secret read, no provider payload committed, no Supabase/SQL/migration, no Vercel environment changes, no dependency added, no deployment, and no push.
- **Validation**: Phase 3EN contract PASS, Phase 3EM PASS, Phase 3EL-OWNER-REVIEW-HF2-LX-CLOSEOUT PASS, Phase 3EL-HF2-LX PASS, Phase 3EL-HF2 PASS, Phase 3EL-HF1-SX2 PASS, Phase 3EL PASS, Phase 3EK PASS, Phase 3EJ plan PASS, provider boundaries PASS, KIS runtime guard PASS, KIS error fallback PASS, Chart AI UX skeleton PASS, mobile baseline PASS, production-domain PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network. Known pre-existing unrelated failure remains: `check:kis-quote-adapter-mocked` 100/101 (`src/pages/api/portfolio/valuation.ts` `source=live` string; file unchanged in Phase 3EN; checker not weakened).
- **Recommended next phase**: Phase 3EO — Owner-Local KIS Quote Smoke Preparation and Execution. Alternative: Phase 3EN-HF1 — Legacy KIS Checker Cleanup if the owner wants zero known checker failures before live smoke.

## Phase 3EM - 2026-07-01

### KIS Quote Integration Roadmap Reset and Local Provider Foundation (Implemented — mocked/local foundation ready)

- **Status**: Implemented — KIS quote integration foundation ready for mocked/local validation. No live KIS call and no public API route.
- **Background**: Phase 3EL-OWNER-REVIEW-HF2-LX-CLOSEOUT recorded `PASS_WITH_COPY_NOTE` for the Chart AI header/sidebar layout. The owner requested faster progress toward KIS API integration instead of continuing long review-only loops. This phase shifts the project from Chart AI UI polish toward the KIS quote integration track.
- **Implemented scope**: applied the eyebrow copy note `국내 주식·ETF` → `국내/미국 주식·ETF`, added a normalized quote snapshot contract, added a quote provider request/context/interface, added a deterministic mocked quote provider for Korean and US stock/ETF samples, added a server-only KIS provider boundary/skeleton that remains blocked until owner-local smoke, documented the accelerated KIS roadmap, and preserved public production fixture/default behavior.
- **Deferred scope**: live KIS quote calls, KIS token handling, KIS chart/OHLC, public quote API route, Chart AI quote preview wiring, US symbol search UI, MK AI intro/loading/results, deployment, and push.
- **Preserved policy**: public `source=live` remains disabled, `source=auto` remains deferred, no live/current/realtime wording is introduced, no quote/API/provider/live integration is exposed to public UI, and no account/trading APIs are added.
- **Safety**: no live KIS call, no live FX call, no provider payload committed, no `.env` or secret read, no Supabase/SQL/migration, no Vercel environment changes, no dependency added, no deployment, and no push.
- **Validation**: Phase 3EM contract PASS, Phase 3EL-OWNER-REVIEW-HF2-LX-CLOSEOUT PASS, Phase 3EL-HF2-LX PASS, Phase 3EL-HF2 PASS, Phase 3EL-HF1-SX2 PASS, Phase 3EL PASS, Phase 3EK PASS, Phase 3EJ plan PASS, provider boundaries PASS, KIS runtime guard PASS, KIS error fallback PASS, KIS quote adapter mocked PASS, Chart AI UX skeleton PASS, mobile baseline PASS, production-domain PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network.
- **Recommended next phase**: Phase 3EN — KIS Quote Adapter Owner-Local Gate Implementation. Alternative: Phase 3EO — Owner-Local KIS Quote Smoke only if the adapter boundary is already sufficient and owner confirms local credential readiness.

## Phase 3EL-OWNER-REVIEW-HF2-LX-CLOSEOUT - 2026-07-01

### Chart AI Header and Sidebar Layout Owner Review Closeout (Closed — owner review PASS_WITH_COPY_NOTE)

- **Status**: Closed — owner review PASS_WITH_COPY_NOTE for Phase 3EL-HF2-LX chart header and sidebar layout hotfix. No runtime source changes.
- **Decision**: `PASS_WITH_COPY_NOTE`.
- **Background**: Phase 3EL-HF2-LX moved the selected-stock identity into the gray chart header, removed the standalone selected-stock header card and the duplicate right-side `종목 정보` card, kept `기업 개요` as the first sidebar card, and moved the MK AI button below `기업 개요` at sidebar width. The owner manually reviewed the local `/chart-ai` UI and accepted the layout with one minor copy note.
- **Accepted scope**: HF2-LX layout accepted — standalone selected-stock header removed, identity moved into the gray chart header, duplicate `종목 정보` card removed, `기업 개요` kept as the first sidebar card, MK AI moved below `기업 개요` at sidebar width, and candlestick chart, volume band, period controls, selected-symbol update, and compact search UX all preserved.
- **Copy note**: eyebrow copy `국내 주식·ETF` → `국내/미국 주식·ETF`, deferred to the next implementation phase because the planned KIS roadmap should support Korean and US stocks/ETFs. No runtime change is made in this closeout.
- **Deferred scope**: KIS chart data, KIS quote data, US stock/ETF support, quote API integration, MK AI intro modal, MK AI staged loading, MK AI result cards, runtime companyProfile data, deployment, and push.
- **Safety**: no runtime changes, no UI changes, no API route changes, no provider changes, no screenshots committed, no image files added, no dependency added, no live KIS call, no live FX call, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EL-OWNER-REVIEW-HF2-LX-CLOSEOUT contract PASS, Phase 3EL-HF2-LX PASS, Phase 3EL-OWNER-REVIEW-HF2 PASS, Phase 3EL-HF2 PASS, Phase 3EL-HF1-SX2 PASS, Phase 3EL PASS, Phase 3EK PASS, Chart AI UX skeleton PASS, mobile baseline PASS, production-domain PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network.
- **Recommended next phase**: Phase 3EM — KIS Quote Integration Roadmap Reset and Local Provider Foundation. Alternative: Phase 3EL-HF3 — MK AI Activation Intro and Staged Loading Foundation.

## Phase 3EL-HF2-LX - 2026-07-01

### Chart AI Chart Header and Sidebar Layout Hotfix (Implemented — owner review recommended)

- **Status**: Implemented — Chart AI chart header and sidebar layout hotfix ready for owner review. No API route or provider integration.
- **Background**: Phase 3EL-HF2 implemented the mocked candlestick chart and volume foundation. During owner review of that surface, the owner asked to remove the duplicated standalone selected-stock header card, fold the selected-stock identity into the gray chart header, remove the duplicate right-side `종목 정보` card, keep `기업 개요` as the first sidebar card, and move the MK AI button below `기업 개요` at the sidebar card width.
- **Implemented scope**: removed the standalone `chart-stock-header` card (with `chart-stock-identity` and `chart-stock-source`), moved the selected-stock identity into the gray chart header as `chart-market-identity-row` (name, symbol, exchange, asset type, currency), removed the duplicate right-side `종목 정보` metadata card and its `chartAiMetaExchange`/`chartAiMetaAssetType`/`chartAiMetaCurrency`/`chartAiMetaDataStatus` fields, removed the duplicated in-plot chart identity, kept `기업 개요` (`chart-company-placeholder`) as the first sidebar card, moved the MK AI button (`chartAiMkAiBtn`) below `기업 개요` inside the sidebar, and styled the MK AI button full-width to match the company card.
- **Deferred scope**: MK AI intro modal, staged loading, sequential analysis cards, runtime companyProfile data, KIS chart/profile integration, quote API integration, deployment, and push.
- **Preserved policy**: mocked candlestick and volume rendering, period controls, selected-symbol chart updates, compact SX2 search UX, deterministic six-query search behavior, light/dark chart theme, mobile containment, deferred non-blocking MK AI note, public `source=live` remains disabled, `source=auto` remains deferred, public production remains fixture/default, no real-time/live/current-price wording is introduced, and no quote/API/provider/live integration is added.
- **Safety**: no Home/Market/Lab/Portfolio/MyPage/Layout changes, no API route changes, no provider changes, no active owner smoke, no live KIS call, no live FX call, no secrets, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EL-HF2-LX contract PASS, Phase 3EL-OWNER-REVIEW-HF2 PASS, Phase 3EL-HF2 PASS, Phase 3EL-OWNER-REVIEW-HF1-SX2-CLOSEOUT PASS, Phase 3EL-HF1-SX2 PASS, owner-review HF1-SX PASS, Phase 3EL-HF1-SX PASS, owner-review HF1 PASS, Phase 3EL-HF1 PASS, Phase 3EL-UXR PASS, prior closeout PASS, Phase 3EL PASS, Phase 3EK PASS, Chart AI UX skeleton PASS, mobile baseline PASS, production-domain PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network.
- **Recommended next phase**: Phase 3EL-OWNER-REVIEW-HF2-LX — Owner Review of the Chart Header and Sidebar Layout Hotfix. Alternative: Phase 3EL-HF3 — MK AI Activation Intro and Staged Loading Foundation if owner review is skipped.

## Phase 3EL-OWNER-REVIEW-HF2 - 2026-07-01

### Mocked Candlestick Chart and Volume Owner Review Preparation (Prepared — owner visual review pending)

- **Status**: Prepared — owner visual review pending. No runtime source changes.
- **Background**: Phase 3EL-HF2 implemented a mocked/client-safe candlestick chart and volume foundation after the compact search panel passed owner review. This phase prepares the owner-run manual local review package for chart visual quality and interaction behavior.
- **Review scope**: local `/chart-ai` page load, preserved compact search UX, stock header, chart first impression, candlestick body/wick readability, up/down candle distinction, volume band readability, period controls `1일`/`1주`/`1개월`/`3개월`/`1년`, selected-symbol chart updates, sample/non-live labels, light/dark theme alignment, mobile 390px layout, accessibility basics, and forbidden wording.
- **Owner workload**: owner runs the local dev server and reviews the UI manually, then returns only the filled PASS/FAIL template and short visual notes for failed or inconclusive items.
- **Routing**: PASS leads to Phase 3EL-OWNER-REVIEW-HF2-CLOSEOUT. Chart visual quality, candle readability, volume readability, period interaction, symbol chart update, mobile layout, theme alignment, search regression, and safety-copy failures route to focused HF2 follow-up phases.
- **Safety**: no runtime/UI/API/provider changes, no chart data/helper file changes, no dev server or browser launched by Codex, no screenshots required, no active owner smoke, no live KIS call, no live FX call, no secrets, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EL-OWNER-REVIEW-HF2 104/104 PASS, Phase 3EL-HF2 134/134 PASS, Phase 3EL-OWNER-REVIEW-HF1-SX2-CLOSEOUT 79/79 PASS, Phase 3EL-HF1-SX2 112/112 PASS, owner-review HF1-SX 78/78 PASS, Phase 3EL-HF1-SX 109/109 PASS, owner-review HF1 72/72 PASS, Phase 3EL-HF1 112/112 PASS, Phase 3EL-UXR 143/143 PASS, prior closeout 77/77 PASS, Phase 3EL 89/89 PASS, Phase 3EK 245/245 PASS, Chart AI UX skeleton 82/82 PASS, mobile baseline 74/74 PASS, production-domain 33/33 PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network.
- **Next step**: owner performs the manual local review. PASS leads to Phase 3EL-OWNER-REVIEW-HF2-CLOSEOUT.

## Phase 3EL-HF2 - 2026-07-01

### Mocked Candlestick Chart and Volume Foundation (Implemented — owner review recommended)

- **Status**: Implemented — mocked candlestick chart and volume foundation ready for owner review. No API route or provider integration.
- **Background**: Phase 3EL-HF1 repositioned `/chart-ai` as a stock lookup-first chart page, Phase 3EL-HF1-SX and SX2 refined search UX and theme alignment, and Phase 3EL-OWNER-REVIEW-HF1-SX2-CLOSEOUT recorded owner review `PASS` for the compact search panel. This phase implements the next deferred core surface: mocked candlestick chart and volume foundation.
- **Implemented scope**: mocked/client-safe OHLC data contract, deterministic mocked series, candlestick bodies and wicks, up/down candle distinction, sample axis/labels, period controls, selected-symbol chart updates, period-based chart updates, volume band and volume bars, light/dark theme-aware chart rendering, mobile-contained chart sizing, and preservation of the approved compact search panel.
- **Deferred scope**: KIS chart data, live quote data, quote API integration, real market data, MK AI intro modal, staged loading, sequential analysis cards, runtime companyProfile data, deployment, and push.
- **Preserved policy**: public `source=live` remains disabled, `source=auto` remains deferred, public production remains fixture/default, real FX provider is not selected, US quote provider is not implemented, no real-time/live/current-price wording is introduced, no KIS metadata fetch is performed, no quote/API/provider/live integration is added, and no account/trading APIs are added.
- **Safety**: no Home/Market/Lab/Portfolio/MyPage/Layout changes, no API route changes, no provider changes, no active owner smoke, no live KIS call, no live FX call, no secrets, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EL-HF2 134/134 PASS, Phase 3EL-OWNER-REVIEW-HF1-SX2-CLOSEOUT 79/79 PASS, Phase 3EL-HF1-SX2 112/112 PASS, owner-review HF1-SX 78/78 PASS, Phase 3EL-HF1-SX 109/109 PASS, owner-review HF1 72/72 PASS, Phase 3EL-HF1 112/112 PASS, Phase 3EL-UXR 143/143 PASS, prior closeout 77/77 PASS, Phase 3EL 89/89 PASS, Phase 3EK 245/245 PASS, Chart AI UX skeleton 82/82 PASS, mobile baseline 74/74 PASS, production-domain 33/33 PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network.
- **Recommended next phase**: Phase 3EL-OWNER-REVIEW-HF2 — Owner Review of Mocked Candlestick Chart and Volume Foundation. Alternative: Phase 3EL-HF3 — MK AI Activation Intro and Staged Loading Foundation if owner review is skipped.

## Phase 3EL-OWNER-REVIEW-HF1-SX2-CLOSEOUT - 2026-07-01

### Chart AI Compact Search Panel Owner Review Closeout (Closed — owner review PASS)

- **Status**: Closed — owner review PASS for Phase 3EL-HF1-SX2 compact search panel hotfix. No runtime source changes.
- **Decision**: `PASS`.
- **Background**: Phase 3EL-HF1-SX2 compacted the `/chart-ai` search panel after prior owner feedback on search width, visible card background width, dropdown alignment, example query text, filter placement, and result row density. The owner manually reviewed the local `/chart-ai` screen and reported `검수 결과: 통과`.
- **Accepted scope**: compact `540px` desktop search panel, visible search card/background reduced with input group, example query text removed, dropdown aligned to the compact panel and attached below the search control, `전체`/`주식`/`ETF` filters moved into the result header, filters hidden when inactive, compact one-line result rows, vertical one-result-per-row list, preserved idle/typing/no-match/selection states, preserved six-query search behavior, and preserved chart theme alignment.
- **Deferred scope**: mocked OHLC candlestick data, volume data foundation, MK AI intro modal, staged loading, sequential analysis cards, runtime companyProfile data, KIS chart/profile integration, quote API integration, deployment, and push.
- **Safety**: no runtime/UI/API/provider changes, no screenshots or image files committed, no dev server or browser launched by Codex, no active owner smoke, no live KIS call, no live FX call, no secrets, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EL-OWNER-REVIEW-HF1-SX2-CLOSEOUT contract 79/79 PASS, Phase 3EL-HF1-SX2 112/112 PASS, owner-review HF1-SX 78/78 PASS, Phase 3EL-HF1-SX 109/109 PASS, owner-review HF1 72/72 PASS, Phase 3EL-HF1 112/112 PASS, Phase 3EL-UXR 143/143 PASS, prior closeout 77/77 PASS, Phase 3EL 89/89 PASS, Phase 3EK 245/245 PASS, Chart AI UX skeleton 82/82 PASS, mobile baseline 74/74 PASS, production-domain 33/33 PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network.
- **Recommended next phase**: Phase 3EL-HF2 — Mocked Candlestick Chart and Volume Foundation.

## Phase 3EL-HF1-SX2 - 2026-07-01

### Chart AI Compact Search Panel Hotfix (Implemented — owner review recommended)

- **Status**: Implemented — Chart AI compact search panel hotfix ready for owner review. No API route or provider integration.
- **Background**: Phase 3EL-HF1-SX refined `/chart-ai` search UX and chart theme alignment, and Phase 3EL-OWNER-REVIEW-HF1-SX prepared the owner review package. The owner’s latest local visual review found that the search panel remained too wide, the visible search card background left too much empty space, the dropdown should match the search panel width and attach directly below it, the example query text should be removed, filters should move into the result header, and each result row should use a compact one-line layout.
- **Implemented scope**: desktop search panel reduced to a compact `540px` width, visible search card/background reduced with the input group, mobile search containment preserved, example query text removed, dropdown width aligned with the compact search panel, dropdown visually attached below the search control, `전체`/`주식`/`ETF` filters moved into the result header, filters hidden when the dropdown is inactive, result rows compacted to one-line rows, vertical one-result-per-row list preserved, idle/typing/no-match/selection states preserved, required query coverage preserved, and chart theme alignment preserved.
- **Deferred scope**: mocked OHLC candlestick data, volume data foundation, MK AI intro modal, staged loading, sequential analysis cards, runtime companyProfile data, KIS chart/profile integration, quote API integration, deployment, and push.
- **Preserved policy**: public `source=live` remains disabled, `source=auto` remains deferred, public production remains fixture/default, real FX provider is not selected, US quote provider is not implemented, no real-time/live/current-price wording is introduced, no KIS metadata fetch is performed, no quote/API/provider/live integration is added, and no account/trading APIs are added.
- **Safety**: no Home/Market/Lab/Portfolio/MyPage/Layout changes, no API route changes, no provider changes, no active owner smoke, no live KIS call, no live FX call, no secrets, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EL-HF1-SX2 contract 112/112 PASS, owner-review HF1-SX 78/78 PASS, Phase 3EL-HF1-SX 109/109 PASS, owner-review HF1 72/72 PASS, Phase 3EL-HF1 112/112 PASS, Phase 3EL-UXR 143/143 PASS, closeout 77/77 PASS, Phase 3EL 89/89 PASS, Phase 3EK 245/245 PASS, Chart AI UX skeleton 82/82 PASS, mobile baseline 74/74 PASS, production-domain 33/33 PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network.
- **Recommended next phase**: Phase 3EL-OWNER-REVIEW-HF1-SX2 — Owner Review of Compact Search Panel Hotfix. Alternative: Phase 3EL-HF2 — Mocked Candlestick Chart and Volume Foundation if owner review is skipped.

## Phase 3EL-OWNER-REVIEW-HF1-SX - 2026-06-30

### Chart AI Search UX & Theme Alignment Owner Review Preparation (Prepared — owner visual review pending)

- **Status**: Prepared — owner visual review pending. No runtime source changes.
- **Background**: Phase 3EL-HF1-SX refined `/chart-ai` search UX and chart theme alignment after the owner identified search width, result styling, idle result visibility, horizontal result layout, and fixed-dark chart shell issues. This phase prepares the owner-run manual local review package for the hotfix.
- **Review scope**: local `/chart-ai` search width, idle search state, typing state, vertical result list, result row content and style, required query coverage, selection behavior, no-match state, filters, light/dark chart shell alignment, preserved HF1 layout, mobile 390px layout, accessibility basics, and forbidden wording.
- **Owner workload**: owner runs the local dev server and reviews the UI manually, then returns only the filled PASS/FAIL template and short visual notes for failed or inconclusive items.
- **Routing**: PASS leads to Phase 3EL-HF2 — Mocked Candlestick Chart and Volume Foundation. Search width, idle results, result list style, selection behavior, chart theme, mobile layout, and safety-copy failures route to focused follow-up phases.
- **Safety**: no runtime/UI/API/provider changes, no dev server or browser launched by Codex, no screenshots required, no active owner smoke, no live KIS call, no live FX call, no secrets, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EL-OWNER-REVIEW-HF1-SX static contract 78/78 PASS, Phase 3EL-HF1-SX 109/109 PASS, owner-review HF1 72/72 PASS, Phase 3EL-HF1 112/112 PASS, Phase 3EL-UXR 143/143 PASS, closeout 77/77 PASS, Phase 3EL 89/89 PASS, Phase 3EK 245/245 PASS, Chart AI UX skeleton 82/82 PASS, mobile baseline 74/74 PASS, production-domain 33/33 PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network.
- **Next step**: owner performs the manual local review. PASS leads to Phase 3EL-HF2.

## Phase 3EL-HF1-SX - 2026-06-30

### Chart AI Search UX & Theme Alignment Hotfix (Implemented — owner review recommended)

- **Status**: Implemented — Chart AI search UX and chart theme alignment hotfix ready for owner review. No API route or provider integration.
- **Background**: Phase 3EL-HF1 repositioned `/chart-ai` as a stock lookup-first chart page and Phase 3EL-OWNER-REVIEW-HF1 prepared the owner review package. The owner’s local visual review found that the search input was too wide, search result styling did not match the site style, results appeared before user input, results were laid out horizontally instead of vertically, and the chart shell looked fixed dark in light mode.
- **Implemented scope**: desktop search control width reduced, mobile search containment preserved, idle empty input hides results, typing opens a vertical one-result-per-row list, no-match state appears only for non-empty queries, result rows use site-consistent styling, selection clears input and closes the dropdown, required query coverage is preserved, and chart shell colors now follow light/dark theme tokens instead of remaining fixed dark-only.
- **Deferred scope**: mocked OHLC candlestick data, volume data foundation, MK AI intro modal, staged loading, sequential analysis cards, runtime companyProfile data, KIS chart/profile integration, quote API integration, deployment, and push.
- **Preserved policy**: public `source=live` remains disabled, `source=auto` remains deferred, public production remains fixture/default, real FX provider is not selected, US quote provider is not implemented, no real-time/live/current-price wording is introduced, no KIS metadata fetch is performed, no quote/API/provider/live integration is added, and no account/trading APIs are added.
- **Safety**: no Home/Market/Lab/Portfolio/MyPage/Layout changes, no API route changes, no provider changes, no active owner smoke, no live KIS call, no live FX call, no secrets, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EL-HF1-SX contract 109/109 PASS, owner-review HF1 72/72 PASS, Phase 3EL-HF1 112/112 PASS, Phase 3EL-UXR 143/143 PASS, closeout 77/77 PASS, Phase 3EL 89/89 PASS, Phase 3EK 245/245 PASS, Chart AI UX skeleton 82/82 PASS, mobile baseline 74/74 PASS, production-domain 33/33 PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network.
- **Recommended next phase**: Phase 3EL-OWNER-REVIEW-HF1-SX — Owner Review of Search UX & Theme Alignment Hotfix. Alternative: Phase 3EL-HF2 — Mocked Candlestick Chart and Volume Foundation if owner review is skipped.

## Phase 3EL-OWNER-REVIEW-HF1 - 2026-06-30

### Chart AI Stock Lookup Layout Owner Review Preparation (Prepared — owner visual review pending)

- **Status**: Prepared — owner visual review pending. No runtime source changes.
- **Background**: Phase 3EL-HF1 repositioned `/chart-ai` as a stock lookup-first chart page after Phase 3EL-UXR and the failed owner review closeout. This phase prepares the owner-run manual local review package for the redesigned layout.
- **Review scope**: local `/chart-ai` page identity, compact search, `조회` button, input clear after selection, compact result dropdown, required query coverage, filters, centralized stock header, chart-first shell, period controls, chart-level `MK AI` CTA, default-hidden AI analysis, company/profile placeholder, mobile 390px layout, accessibility basics, and forbidden wording.
- **Owner workload**: owner runs the local dev server and reviews the UI manually, then returns only the filled PASS/FAIL template and short visual notes for failed or inconclusive items.
- **Routing**: PASS leads to Phase 3EL-HF2 — Mocked Candlestick Chart and Volume Foundation. Layout/search/chart/MK AI/mobile/safety failures route to focused HF1 follow-up phases.
- **Safety**: no runtime/UI/API/provider changes, no dev server or browser launched by Codex, no screenshots required, no active owner smoke, no live KIS call, no live FX call, no secrets, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EL-OWNER-REVIEW-HF1 static contract 72/72 PASS, Phase 3EL-HF1 112/112 PASS, Phase 3EL-UXR 143/143 PASS, closeout 77/77 PASS, Phase 3EL 89/89 PASS, Phase 3EK 245/245 PASS, Chart AI UX skeleton 82/82 PASS, mobile baseline 74/74 PASS, production-domain 33/33 PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network.
- **Next step**: owner performs the manual local review. PASS leads to Phase 3EL-HF2.

## Phase 3EL-HF1 - 2026-06-30

### Chart AI Stock Lookup Layout Redesign (Implemented — owner review recommended)

- **Status**: Implemented — Chart AI stock lookup-first layout ready for owner review. No API route or provider integration.
- **Background**: Phase 3EL-UXR completed the redesign plan after Phase 3EL-OWNER-REVIEW-CLOSEOUT recorded `FAIL_PRODUCT_DIRECTION / UX_REDESIGN_REQUIRED`. This phase begins the redesign by fixing the information architecture before candlestick rendering, MK AI loading, or companyProfile runtime implementation.
- **Implemented scope**: page repositioned to `종목 차트`, compact stock search, short `조회` button, separated search input and selected-stock state, input clear after selection, compact result dropdown/list, centralized stock header, chart-first main visual surface, period controls, chart-level `MK AI` CTA, default AI analysis sections removed, compact company/profile placeholder, and mobile-safe layout treatment.
- **Deferred scope**: mocked OHLC candlestick data, volume data foundation, MK AI intro modal, staged loading, sequential analysis cards, runtime companyProfile data, KIS chart/profile integration, quote API integration, and deployment.
- **Preserved policy**: public `source=live` remains disabled, `source=auto` remains deferred, public production remains fixture/default, real FX provider is not selected, US quote provider is not implemented, no real-time/live/current-price wording is introduced, no KIS metadata fetch is performed, no quote/API/provider/live integration is added, and no account/trading APIs are added.
- **Safety**: no Home/Market/Lab/Portfolio/MyPage/Layout changes, no API route changes, no provider changes, no active owner smoke, no live KIS call, no live FX call, no secrets, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EL-HF1 contract 112/112 PASS, Phase 3EL-UXR 143/143 PASS, closeout 77/77 PASS, Phase 3EL 89/89 PASS, Phase 3EK 245/245 PASS, Chart AI UX skeleton 82/82 PASS, mobile baseline 74/74 PASS, production-domain 33/33 PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network.
- **Recommended next phase**: Phase 3EL-HF2 — Mocked Candlestick Chart and Volume Foundation, or Phase 3EL-OWNER-REVIEW-HF1 if owner layout confirmation is preferred before chart implementation.

## Phase 3EL-UXR - 2026-06-30

### Chart AI Stock Lookup & MK AI Interaction Redesign Plan (Completed — redesign plan ready)

- **Status**: Completed — Chart AI stock lookup and MK AI interaction redesign plan ready. No runtime source changes.
- **Background**: Phase 3EL-OWNER-REVIEW-CLOSEOUT recorded `FAIL_PRODUCT_DIRECTION / UX_REDESIGN_REQUIRED`. The owner rejected the current Chart AI page because it felt like an AI demo rather than a familiar stock lookup and candlestick chart page.
- **Redesign direction**: reposition Chart AI as a stock lookup-first chart page with optional MK AI analysis. The future flow should follow `search → stock header → candlestick chart → basic stock/company information → optional MK AI analysis`.
- **Planned UX**: search input and selected-stock state separation, short `조회` button, compact search dropdown, centralized stock header, mocked-first candlestick OHLC chart with volume, period controls, company/profile overview, and mobile-first 390px layout.
- **MK AI interaction**: analysis sections should not be visible by default. A chart-level `MK AI` button should trigger intro guidance, disclaimer, staged loading, and sequential analysis sections such as `국면·수급`, `매매 전략`, `가격 패턴`, `기술적 지표`, `지지·저항`, and `리스크 체크`.
- **Data planning**: mocked OHLC and mocked/static `companyProfile` are acceptable first. KIS natural-language company description availability must be verified later; OpenDART, KRX, manual/static seed, or another approved source may be evaluated later.
- **Safety**: no runtime/UI/API/provider changes, no image files committed, no dev server or browser launched by Codex, no active owner smoke, no live KIS call, no live FX call, no secrets, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EL-UXR static contract 143/143 PASS, closeout 77/77 PASS, owner-review preparation 84/84 PASS, Phase 3EL 89/89 PASS, Phase 3EK 245/245 PASS, Chart AI UX skeleton 82/82 PASS, mobile baseline 74/74 PASS, production-domain 33/33 PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network.
- **Recommended next phase**: Phase 3EL-HF1 — Chart AI Stock Lookup Layout Redesign.

## Phase 3EL-OWNER-REVIEW-CLOSEOUT - 2026-06-30

### Chart AI Domestic Symbol Search Owner Review Closeout (Closed — UX redesign required)

- **Status**: Closed — owner review failed due to product direction. UX redesign required. No runtime source changes.
- **Decision**: `FAIL_PRODUCT_DIRECTION / UX_REDESIGN_REQUIRED`.
- **Background**: Phase 3EL connected the mocked-first domestic symbol/search foundation to the Chart AI page as the first visible consumer, and Phase 3EL-OWNER-REVIEW prepared the manual local browser review package. The owner manually reviewed the local Chart AI page and rejected the current product direction.
- **Owner finding**: the page feels like an AI demo page rather than a familiar stock lookup and candlestick chart page. The owner expects a stock lookup-first flow with a familiar brokerage-style candlestick chart, concise search behavior, reduced repeated stock identity, and optional AI analysis only after explicit user activation.
- **Required redesign direction**: future UX should follow the pattern `search → stock header → candlestick chart → basic stock/company information → optional MK AI analysis`. Search input and selected-stock state must be separated, the lookup button should be shortened to `조회`, and AI analysis should start from a chart-level `MK AI` button with intro guidance, staged loading, and sequential result sections.
- **AI analysis direction**: future MK AI should not show trend/momentum/volatility/support-resistance/risk/template sections by default. After user activation, it should reveal deeper sections such as `국면·수급`, `매매 전략`, `가격 패턴`, `기술적 지표`, `지지·저항`, and `리스크 체크`.
- **Company/profile direction**: future design should include a company/security description area. KIS support for natural-language company description must be verified later; mocked/static `companyProfile` is acceptable for the first redesign implementation.
- **Safety**: no runtime/UI/API/provider changes, no screenshot or image files committed, no dev server or browser launched by Codex, no active owner smoke, no live KIS call, no live FX call, no secrets, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EL-OWNER-REVIEW-CLOSEOUT static contract 77/77 PASS, owner-review preparation 84/84 PASS, Phase 3EL 89/89 PASS, Phase 3EK 245/245 PASS, Chart AI UX skeleton 82/82 PASS, mobile baseline 74/74 PASS, production-domain 33/33 PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network.
- **Recommended next phase**: Phase 3EL-UXR — Chart AI Stock Lookup & MK AI Interaction Redesign Plan.

## Phase 3EL-OWNER-REVIEW - 2026-06-30

### Chart AI Domestic Symbol Search Owner Review Preparation (Prepared — owner visual review pending)

- **Status**: Prepared — owner visual review pending. No runtime source changes.
- **Background**: Phase 3EL implemented Chart AI domestic stock/ETF search using the Phase 3EK mocked-first symbol/search foundation. This phase prepares the owner-run local browser review package.
- **Review scope**: local `/chart-ai` page load, required labels, search queries `005930`, `삼성`, `000660`, `하이닉스`, `069500`, `KODEX`, stock/ETF filters, selection summary, empty state, keyboard/accessibility basics, mobile 390px layout, and forbidden wording.
- **Owner workload**: owner runs the local dev server and browser review manually, then returns only the filled PASS/FAIL template and short visual notes for failed items.
- **Safety**: no runtime/UI/API/provider changes, no dev server or browser launched by Codex, no active owner smoke, no live KIS call, no live FX call, no secrets, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EL-OWNER-REVIEW static contract 84/84 PASS, Phase 3EL 89/89 PASS, Phase 3EK 245/245 PASS, Chart AI UX skeleton 82/82 PASS, mobile baseline 74/74 PASS, production-domain 33/33 PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network.
- **Next step**: owner performs the manual local review. PASS leads to Phase 3EL-OWNER-REVIEW-CLOSEOUT.

## Phase 3EL - 2026-06-30

### Chart AI Domestic Symbol Search Wiring (Implemented — owner review pending)

- **Status**: Implemented — Chart AI domestic symbol search wiring ready for owner review. No API route or provider integration.
- **Background**: Phase 3EK implemented the mocked-first domestic symbol master and deterministic search foundation. This phase connects that foundation to the Chart AI page as the first visible consumer.
- **Implemented scope**: Chart AI search input, deterministic domestic stock/ETF results, selected-symbol summary, stock/ETF filters, sample-data notice, client-safe symbol records, and safe fixture/demo analysis copy.
- **Preserved policy**: public `source=live` remains disabled, `source=auto` remains deferred, public production remains fixture/default, a real FX provider is not selected, a US quote provider is not implemented, no real-time/live wording is introduced, no KIS metadata fetch is performed, no quote/API/provider/live integration is added, and no account/trading APIs are added.
- **Safety**: no API route changes, no provider changes, no active owner smoke, no live KIS call, no live FX call, no secrets, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EL contract 89/89 PASS, Phase 3EK 245/245 PASS, Phase 3EJ 263/263 PASS, Chart AI UX skeleton 82/82 PASS, mobile baseline 74/74 PASS, production-domain 33/33 PASS, production build PASS, `git diff --check` PASS, and production mobile geometry guard `DRY_RUN` with no browser or network.
- **Recommended next phase**: Phase 3EL-OWNER-REVIEW — Chart AI Domestic Symbol Search Owner Review.

## Phase 3EK - 2026-06-30

### Domestic Symbol Master / Search Index Mocked-First Implementation (Implemented - mocked-first symbol/search foundation ready)

- **Status**: Implemented - mocked-first domestic symbol master and search index foundation ready. No UI or API route integration.
- **Background**: Phase 3EJ planned the shared symbol, search, quote, cache, freshness, market-calendar, and provider-leakage infrastructure. This phase implements only the first domestic symbol/search foundation.
- **Implemented scope**: domestic stocks + domestic ETFs mocked/static seed, normalized symbol master type, normalization helpers, client-safe projection, deterministic search index, filters, integrity assertions, result document, and static/behavioral checker.
- **Preserved policy**: public `source=live` remains disabled, `source=auto` remains deferred, public production remains fixture/default, a real FX provider is not selected, a US quote provider is not implemented, no real-time/live wording is introduced, no KIS metadata fetch is performed, and no account/trading APIs are added.
- **Safety**: no UI page changes, no API route changes, no provider changes, no active owner smoke, no live KIS call, no live FX call, no secrets, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EK mocked-first contract 244/244 PASS, Phase 3EJ infrastructure-plan contract 263/263 PASS, Phase 3EI impact-plan contract 56/56 PASS, Portfolio live preview API 110/110 PASS, mobile baseline 74/74 PASS, production-domain contract 33/33 PASS, geometry guard dry-run PASS, build PASS, and `git diff --check` PASS.
- **Recommended next phase**: Phase 3EL - Chart AI Domestic Symbol Search Wiring.

## Phase 3EJ - 2026-06-29

### KIS Symbol Master & Quote Infrastructure Plan (Completed - shared data infrastructure plan ready)

- **Status**: Completed - KIS symbol master and quote infrastructure plan ready. No runtime source changes.
- **Background**: Phase 3EI mapped NAV-wide KIS data impact. This phase narrows the next implementation path to the shared domestic symbol, search, quote, cache, freshness, market-calendar, and provider-leakage infrastructure required before visible NAV-wide KIS data expansion.
- **Plan scope**: domestic stocks + domestic ETFs first, symbol master data contract, source strategy, search index behavior, normalized quote snapshot contract, quote API layer, quote cache/freshness policy, market calendar plan, source/freshness label policy, provider leakage guard, storage/file plan, consumer surface mapping, roadmap, owner decision matrix, and risk register.
- **Preserved policy**: public `source=live` remains disabled, `source=auto` remains deferred, public production remains fixture/default, a real FX provider is not selected, a US quote provider is not implemented, no real-time/live wording is introduced, and no account/trading APIs are added.
- **Safety**: no runtime/UI/API/provider changes, no active owner smoke, no live KIS call, no live FX call, no secrets, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EJ infrastructure-plan contract 263/263 PASS, Phase 3EI impact-plan contract 56/56 PASS, Phase 3EH owner-review closeout 52/52 PASS, Portfolio live preview API 110/110 PASS, mobile baseline 74/74 PASS, production-domain contract 33/33 PASS, geometry guard dry-run PASS, build PASS, and `git diff --check` PASS.
- **Recommended next phase**: Phase 3EK - Domestic Symbol Master / Search Index Mocked-First Implementation.

## Phase 3EI - 2026-06-29

### KIS Data Surface Impact Plan (Completed — NAV impact plan ready)

- **Status**: Completed — KIS data surface impact plan ready. No runtime source changes.
- **Background**: Phase 3EH closed the local mixed-currency Portfolio owner-preview UI review with `PASS_WITH_MOBILE_NOTE`. This phase expands the planning scope from Portfolio-only preview to NAV-wide KIS data impact.
- **Plan scope**: Home ticker belt and MARKET SNAPSHOT, Chart AI symbol search and analysis data, Market treemaps/Momentum/Trend/index flow/asset returns, Lab asset-class and S&P500 sector return data, Portfolio registered holdings, MyPage watchlist price alerts, and common infrastructure such as symbol master, quote API, quote cache, market calendar, source labels, provider leakage guard, alert worker, and external data gaps.
- **Preserved policy**: public `source=live` remains disabled, `source=auto` remains deferred, public production remains fixture/default, real FX provider is not selected, US quote provider is not implemented, and no real-time/live wording is introduced.
- **Safety**: no runtime/UI/API/provider changes, no active owner smoke, no live KIS call, no live FX call, no secrets, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EI checker 56/56 PASS; Phase 3EH 52/52 PASS; Phase 3EF 65/65 PASS; Portfolio live-preview API 110/110 PASS; mobile baseline 74/74 PASS; production-domain 33/33 PASS; production build PASS; `git diff --check` PASS; production mobile geometry guard `DRY_RUN` with no browser or network. The optional Phase 3DX checker remained 93/94 on its documented `52fcfb7` baseline issue while all 93 architecture assertions passed; it was not modified.
- **Recommended next phase**: Phase 3EJ — KIS Symbol Master & Quote Infrastructure Plan.

## Phase 3EH - 2026-06-29

### Owner Mixed-Currency Preview UI Review Closeout (Completed — owner review PASS with mobile note)

- **Status**: Completed — owner mixed-currency preview UI review PASS with mobile evidence note. No runtime source changes.
- **Background**: Phase 3EF implemented the local-only mixed-currency Portfolio preview UI and Phase 3EG prepared the owner visual review package.
- **Owner review**: fixture default PASS, KR-only owner preview no-regression PASS, mixed mocked-FX owner preview PASS after selecting individual portfolios with holdings, production block PASS.
- **Confirmed mixed-preview labels**: `오너 미리보기`, `Mocked FX`, `샘플 환율`, and `실제 시세 아님`.
- **Initial inconclusive state**: the aggregate/all tab made the URLs appear similar because the selected state did not satisfy preview eligibility; retry with individual portfolios confirmed activation.
- **Mobile note**: a dedicated 390px owner screenshot was not separately provided. Prior static/mobile validation passed and no mobile issue was reported; this is non-blocking for the local-only closeout.
- **Safety**: screenshots were voluntarily shared in chat but not committed; no raw API response, request/response body, prices/totals/P&L, secrets, environment values, or account data were recorded in the repository. No dev server or browser was launched by Codex, no active owner smoke, no live KIS call, no live FX call, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EH checker 52/52 PASS; Phase 3EG 40/40 PASS; Phase 3EF 65/65 PASS; Phase 3EE 135/135 PASS; Phase 3ED 66/66 PASS; Portfolio live-preview API 110/110 PASS; mobile baseline 74/74 PASS; production-domain 33/33 PASS; production build PASS; `git diff --check` PASS; production mobile geometry guard `DRY_RUN` with no browser or network. The optional Phase 3DX checker remained 93/94 on its documented `52fcfb7` baseline issue while all 93 architecture assertions passed; it was not modified.
- **Decision**: Phase 3EH closed.
- **Recommended next phase**: Phase 3EI — KIS Data Surface Impact Plan.

## Phase 3EG - 2026-06-28

### Owner Local Mixed-Currency Preview UI Review Preparation (Prepared — owner visual review pending)

- **Status**: Prepared — owner visual review pending. No runtime source changes.
- **Background**: Phase 3EF implemented the local-only mixed-currency Portfolio preview UI. This phase prepares the owner visual review runbook and safe PASS/FAIL template.
- **Review scope**: fixture default, KR-only owner preview, mixed mocked-FX owner preview, preview labels, unavailable rows, aggregate-null display, mobile 390px layout, and production blocking.
- **Owner workload**: visual review only; the owner should return PASS/FAIL fields and short visual notes only if something fails.
- **Safety**: no dev server or browser launched by Codex, no screenshots required, no active owner smoke, no live KIS call, no live FX call, no secrets, no API response body, no prices/totals/P&L, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EG checker 40/40 PASS; Phase 3EF 65/65 PASS; Phase 3EE 135/135 PASS; Phase 3ED 66/66 PASS; Portfolio live-preview API 110/110 PASS; mobile baseline 74/74 PASS; production-domain 33/33 PASS; production build PASS; `git diff --check` PASS; production mobile geometry guard `DRY_RUN` with no browser or network. The optional Phase 3DX checker remained 93/94 on its documented `52fcfb7` baseline issue while all 93 architecture assertions passed; it was not modified.
- **Next step**: owner runs the local visual review using the runbook and returns the filled result template.

## Phase 3EF - 2026-06-28

### Portfolio Mixed-Currency Preview UI Implementation (Implemented - local owner-preview UI ready)

- **Status**: Implemented - local-only mixed-currency owner-preview UI ready. No deployment.
- **Background**: Phase 3EE completed the UI wiring plan after Phase 3ED owner smoke PASS. This phase implements the local-only Portfolio UI activation for mixed mocked-FX preview.
- **Implemented scope**: local-only activation using `previewMode=owner` plus explicit `fxPreview=mocked`, Phase 3EB API request mapping, a mixed mocked-FX UI state, safe preview labels, unavailable-row display, aggregate-null display, metadata leakage protection, and mobile/layout-safe UI treatment.
- **Preserved policy**: public production remains fixture-only, KR-only owner preview remains preserved, public `source=live` remains disabled, `source=auto` remains deferred, real FX provider integration remains blocked, and no real US quote provider is added.
- **Safety**: no active owner smoke by Codex, no live KIS call, no live FX call, no secrets, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EF checker 65/65 PASS; Phase 3EE 135/135 PASS; Phase 3ED 66/66 PASS; Phase 3EB 92/92 PASS; Phase 3EA 124/124 PASS; Portfolio live-preview API 110/110 PASS; mobile baseline 74/74 PASS; production-domain 33/33 PASS; production build PASS; `git diff --check` PASS; production mobile geometry guard `DRY_RUN` with no browser or network. The Phase 3EB, 3ED, and 3EE historical checkers received commit-range-only corrections so they validate their completed phase spans rather than the authorized Phase 3EF working tree. The optional Phase 3DX checker remained 93/94 on its documented `52fcfb7` baseline issue while all 93 architecture assertions passed; it was not modified.
- **Recommended next phase**: Phase 3EG - Owner Local Mixed-Currency Preview UI Review.

## Phase 3EE - 2026-06-28

### Portfolio Mixed-Currency Preview UI Wiring Plan (Completed - UI wiring plan ready)

- **Status**: Completed - UI wiring plan ready. No runtime source changes.
- **Background**: Phase 3ED closed the owner mixed-currency preview smoke with PASS. The API owner smoke confirmed HTTP 200, contract PASS, mixedCurrencyPreview=true, mockedFx=true, fxSource=mocked, fxStaleState=sample, rowCount=2, unavailableRows=2, unsupportedCurrencyRows=0, missingQuoteRows=2, aggregateState=null, provider-leakage PASS, and final result PASS.
- **Plan scope**: local-only UI activation contract, API request mapping, UI state model, mocked FX label policy, row/aggregate display policy, metadata leakage policy, Phase 3DX layout constraints, owner visual review scope, and Phase 3EF validation plan.
- **Preserved policy**: public production remains fixture-only, public `source=live` remains disabled, `source=auto` remains deferred, real FX provider integration remains blocked, and no real US quote provider is added.
- **Safety**: no runtime/UI changes, no active smoke, no live KIS call, no live FX call, no secrets, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EE plan checker 135/135 PASS; Phase 3ED 66/66 PASS; Phase 3EB 92/92 PASS; Phase 3EA 124/124 PASS; mobile baseline 74/74 PASS; Portfolio live-preview API 110/110 PASS; production-domain 33/33 PASS; production build PASS; `git diff --check` PASS; production mobile geometry guard `DRY_RUN` with no browser or network. The Phase 3DX architecture checker reported 93/94 because its historical `52fcfb7` baseline rejects later approved runtime phases; its 93 architecture assertions passed and the historical checker was not weakened.
- **Recommended next phase**: Phase 3EF - Portfolio Mixed-Currency Preview UI Implementation.

## Phase 3ED - 2026-06-28

### Owner Mixed-Currency Preview Smoke Closeout (Completed - owner smoke PASS)

- **Status**: Completed - owner mixed-currency preview smoke PASS.
- **Background**: Phase 3EB implemented the strictly gated mixed-currency owner-preview API using mocked FX, and Phase 3EC prepared the owner-run smoke script, runbook, and sanitized result template.
- **Owner result**: active local owner smoke PASS. HTTP 200, contract PASS, mixedCurrencyPreview=true, mockedFx=true, fxSource=mocked, fxStaleState=sample, rowCount=2, unavailableRows=2, unsupportedCurrencyRows=0, missingQuoteRows=2, aggregateState=null, provider-leakage PASS, final result PASS.
- **Interpretation**: unavailable rows and aggregate null are accepted for this phase because real US quotes and real FX provider integration are not in scope.
- **Safety**: no active smoke by Codex, no live KIS call by Codex, no live FX call, no real FX provider, no public `source=live`, no `source=auto`, no production touch, no secrets/env values, no raw API response, no prices/totals/P&L, no screenshots/server logs, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3ED closeout contract 66/66 PASS, Phase 3EC preparation contract 78/78 PASS, Phase 3EB contract 92/92 PASS, Phase 3EA contract 124/124 PASS, Portfolio live-preview API 110/110 PASS, production-domain contract 33/33 PASS, geometry guard dry-run PASS, build PASS, and `git diff --check` PASS.
- **Recommended next phase**: Phase 3EE - Portfolio Mixed-Currency Preview UI Wiring Plan.

## Phase 3EC - 2026-06-28

### Owner-Run Mixed-Currency Preview Smoke Preparation (Prepared - owner execution pending)

- **Status**: Prepared - owner execution pending. No active owner smoke was run by Codex.
- **Background**: Phase 3EB added the strictly gated mixed-currency owner-preview API using mocked FX. This phase prepares the owner-run local smoke script, runbook, and sanitized result template.
- **Prepared scope**: local-only owner smoke script, explicit guard variables, dry-run default, sanitized output policy, unsafe-output blocking, result template, and static checker.
- **Safety**: no live KIS call by Codex, no live FX call, no active owner smoke execution, no secrets, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EC static contract 78/78 PASS, owner smoke default dry-run PASS with no API call, Phase 3EB contract 92/92 PASS, Phase 3EA contract 124/124 PASS, Portfolio live-preview API 110/110 PASS, production-domain contract 33/33 PASS, geometry guard dry-run PASS, build PASS, and `git diff --check` PASS.
- **Next step**: owner manually runs the active local smoke and shares only the sanitized result template.

## Phase 3EB - 2026-06-28

### Portfolio Mixed-Currency Owner Preview API (Implemented - mocked FX owner-preview API ready)

- **Status**: Implemented - mocked FX mixed-currency owner-preview API ready. No live provider calls by Codex.
- **Background**: Phase 3EA implemented provider-neutral FX types, helpers, and mocked FX behavior. This phase wires mocked FX into a strictly gated owner-preview Portfolio valuation API path without changing public Portfolio UI/API behavior.
- **Implemented scope**: owner-preview mixed-currency gate, mocked FX integration, USD/KRW mocked rate, KRW/USD inverse, identity pairs, unsupported-currency fail-safe behavior, unavailable-row handling, and a no-network API contract checker.
- **Preserved policy**: public `source=fixture` remains default, public `source=live` remains disabled, `source=auto` remains deferred, production live remains blocked, and Portfolio UI behavior remains unchanged.
- **Safety**: no live KIS calls by Codex, no live FX calls, no real FX provider, no provider SDK, no new dependency, no secrets, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EB mixed-currency owner-preview contract 92/92 PASS, Phase 3EA mocked-first FX contract 124/124 PASS, Phase 3DZ provider-plan contract 158/158 PASS, KIS/FX mocked adapter 119/119 PASS, Portfolio live-preview API 110/110 PASS, production-domain contract 33/33 PASS, geometry guard dry-run PASS, build PASS, and `git diff --check` PASS.
- **Recommended next phase**: Phase 3EC - Owner-Run Mixed-Currency Preview Smoke.

## Phase 3EA - 2026-06-28

### Real FX Adapter Mocked-First Implementation (Implemented - mocked-first FX foundation ready)

- **Status**: Implemented - mocked-first FX adapter foundation ready. No live provider calls.
- **Background**: Phase 3DZ defined provider-neutral FX contracts but did not select a real provider. This phase implements the provider-neutral type/helper foundation and mocked behavior without a live FX provider.
- **Implemented scope**: FX types, normalized snapshot contract, safe error classification, identity pairs, USD/KRW mocked rate, derived KRW/USD, unsupported-pair unavailable behavior, and a no-network behavioral checker.
- **Preserved policy**: public `source=fixture` remains default, public `source=live` remains disabled, `source=auto` remains deferred, and Portfolio UI/API public behavior remains unchanged.
- **Safety**: no live KIS calls, no live FX calls, no provider SDK, no new dependency, no secrets, no Supabase/SQL/migration, no Vercel environment changes, no deployment, and no push.
- **Validation**: Phase 3EA mocked-first contract 124/124 PASS, Phase 3DZ provider-plan contract 158/158 PASS, Phase 3DY continuation-plan contract 115/115 PASS, KIS/FX mocked adapter 119/119 PASS, Portfolio live preview API 110/110 PASS, production-domain contract 33/33 PASS, geometry guard dry-run PASS, build PASS, and `git diff --check` PASS. Supplemental whole-repo TypeScript validation remains blocked by the pre-existing out-of-scope `src/pages/api/news/market-feed.ts:72` `fetchFn` options-type mismatch.
- **Recommended next phase**: Phase 3EB - Portfolio Mixed-Currency Owner Preview API.

## Phase 3DZ - 2026-06-28

### FX Provider Selection and Real FX Adapter Plan (Completed - provider plan ready)

- **Status**: Completed - provider plan ready. No runtime source changes.
- **Background**: Phase 3DY confirmed that KIS KR quote and Portfolio owner live preview paths are validated, while FX remains mocked, a real FX provider is not selected, public `source=live` remains disabled, and `source=auto` remains deferred.
- **Plan scope**: current FX integration baseline, provider selection criteria, provider candidate categories, MVP currency-pair scope, provider-neutral FX interface, freshness/stale policy, error classification, caching/rate-limit policy, Portfolio valuation integration, security/secret handling, owner decisions, and Phase 3EA validation plan.
- **MVP recommendation**: start with USD/KRW and KRW/USD, plus identity pairs, in owner preview only.
- **Decision gate**: Phase 3EA should start only after the owner confirms provider category, paid-provider acceptability, MVP pair scope, freshness tolerance, and preview-only rollout policy.
- **Validation**: Phase 3DZ provider-plan contract 158/158 PASS, Phase 3DY continuation-plan contract 115/115 PASS, Phase 3DX architecture contract 94/94 PASS, KIS/FX mocked adapter 119/119 PASS, Portfolio live preview API 110/110 PASS, production-domain contract 33/33 PASS, geometry guard dry-run PASS, build PASS, and `git diff --check` PASS.
- **Deployment**: none.
- **Push**: none.

## Phase 3DY - 2026-06-28

### KIS / FX Live Data Integration Continuation Plan (Completed - continuation plan ready)

- **Status**: Completed - continuation plan ready. No runtime source changes.
- **Background**: KIS KR quote owner smokes and Portfolio live preview owner smoke previously passed; Phase 3DX now provides UI architecture rules and Phase 3DW provides production mobile geometry guard coverage.
- **Current state**: KR stock and KR ETF quote preview path validated; Portfolio owner live preview API validated; FX remains mocked; real FX provider is not selected; US quote endpoint is not implemented; public `source=live` remains disabled; `source=auto` remains deferred.
- **Plan scope**: capability matrix, preserved contracts, gap analysis, recommended implementation path, Phase 3DZ scope proposal, owner decisions, safety model, UI architecture constraints, and future validation plan.
- **Recommended next phase**: Phase 3DZ - FX Provider Selection and Real FX Adapter Plan.
- **Validation**: Phase 3DY plan contract 115/115 PASS, Phase 3DX architecture contract 94/94 PASS, Portfolio live preview API 110/110 PASS, owner-smoke closeout 68/68 PASS, KIS/FX mocked adapter 119/119 PASS, production-domain contract 33/33 PASS, geometry guard dry-run PASS, build PASS, and `git diff --check` PASS.
- **Deployment**: none.
- **Push**: none.

## Phase 3DX - 2026-06-28

### UI Architecture Stabilization Plan (Completed - architecture plan ready)

- **Status**: Completed - architecture plan ready. No runtime source changes.
- **Background**: Phase 3DV closed the mobile Home banner production deployment and footer-ad overflow issue. Phase 3DW closed the production mobile geometry guard. This phase stabilizes UI architecture rules before future UI or live-data work.
- **Plan scope**: global layout, route shells, header/ticker/nav, ad/iframe containment, dense data surfaces, modal/overlay sizing, Home mobile banner, PC rail, production acceptance, future phase checklist, and prohibited patterns.
- **Key rule**: document/body width must not be widened by child components; dense content must scroll locally; external ad/iframe integrations must be wrapper-contained.
- **Production acceptance policy**: future public UI changes should use the Phase 3DW geometry guard before owner acceptance and after production deployment when applicable.
- **Validation**: architecture plan contract 94/94 PASS, Phase 3DW closeout 59/59 PASS, Phase 3DV closeout 41/41 PASS, mobile baseline 74/74 PASS, production-domain contract 33/33 PASS, guard dry-run PASS, build PASS, and `git diff --check` PASS.
- **Deployment**: none.
- **Push**: none.

## Phase 3DW-CLOSEOUT - 2026-06-28

### Production Mobile Geometry Guard Closeout (Completed - guard ready)

- **Status**: Completed - owner-run production mobile geometry guard ready and validated.
- **Baseline**: `e0ac265 chore: add production mobile geometry guard`.
- **Completed scope**: owner-run geometry guard script, static checker, result/runbook document, package commands, and changelog entry.
- **Guard coverage**: public routes `/`, `/chart-ai`, `/market`, `/lab`, `/portfolio`, `/mypage`, plus the public login modal state; mobile viewports 390x844, 412x915, and 430x932.
- **Accepted threshold**: document/body client and scroll widths must be less than or equal to `innerWidth + 2`.
- **Validation**: closeout contract 59/59 PASS, static guard contract 58/58 PASS, dry-run PASS, production geometry 21/21 PASS, origin rejection tests PASS, Phase 3DV closeout 41/41 PASS, retry overflow contract 41/41 PASS, production-domain contract 33/33 PASS, build PASS, and `git diff --check` PASS.
- **Usage policy**: future UI, layout, ad, iframe, table, chart, footer, nav, ticker, modal, and route-shell changes should run this guard before owner acceptance.
- **Safety**: no runtime source changes, no deployment, no Vercel environment changes, no Supabase or database changes, no SQL, no migration, no screenshots, no cookies or storage reads, no text-content collection, and no push.
- **Decision**: Phase 3DW is closed.

## Phase 3DW - 2026-06-28

### Production Mobile Geometry Guard (Implemented - owner-run guard ready)

- **Background**: Phase 3DV is closed. The prior production mobile blank-area issue was caused by a fixed 728x70 footer partner ad injected into `.footer-ad-wrapper`.
- **Goal**: add a reusable owner-run production mobile geometry guard to detect document/body width overflow on public routes before future UI changes are accepted.
- **Guard scope**: public routes `/`, `/chart-ai`, `/market`, `/lab`, `/portfolio`, `/mypage`, plus the public login modal state; mobile viewports 390x844, 412x915, and 430x932.
- **Safety**: no login, no cookies or browser-storage reads, no screenshots, no page-text collection, no request/response body logging, and an explicit guard variable is required for production checks.
- **Deliverables**: dependency-free owner-run geometry script with a browser-unavailable console fallback, package commands, static checker, and result/runbook document.
- **Validation**: static guard contract PASS (58/58), dry-run PASS, public production geometry PASS (21/21), prior closeout PASS (41/41), retry overflow contract PASS (41/41), production-domain contract PASS (33/33), build PASS, and `git diff --check` PASS.
- **Deployment**: none.
- **Push**: none.

## Phase 3DV-CLOSEOUT - 2026-06-28

### Mobile Home Banner Production Deployment Closeout (Completed - production owner re-check PASS)

- **Status**: Completed - production owner re-check PASS.
- **Final deployed runtime fix**: `9f7f4a1 fix: contain production mobile overflow`.
- **Final owner result**: PASS after the Phase 3DV-HF1-Retry production deployment.
- **Completed scope**: PC slots 1-5, mobile slots 1-5, mobile Home banner placement between `MY PORTFOLIO` and `MARKET SNAPSHOT`, mobile visibility through 859px, hidden from 860px, PC rail from 1440px, URL-only MyPage admin workflow, PC banner persistence fix, and footer-ad mobile overflow fix.
- **Production issue resolved**: the right-side mobile blank area was traced to the fixed 728x70 footer partner ad injected into `.footer-ad-wrapper`; the ad region and injected `ins`/iframe are now viewport-contained.
- **Final production check**: owner confirmed Home, Chart AI, Market, Lab, Portfolio, MyPage, login modal, footer/slide ads, mobile Home banner, and PC rail behavior passed.
- **Safety**: no runtime source or API route changes, no DB/Supabase schema changes, no SQL, no migration, no Supabase Storage upload, no Vercel environment changes, no deployment, no new Vercel project or relink, and no push in this closeout phase.
- **Decision**: Phase 3DV is closed.

## Phase 3DV-HF1-Retry - 2026-06-28

### Production Mobile Overflow Hotfix (Implemented and deployed - owner production re-check pending)

- **Background**: Phase 3DV-HF1-DEPLOY-VERIFY confirmed canonical production was serving the HF1 artifact, but the owner still observed mobile right-side blank-area behavior.
- **Diagnosis**: public, isolated mobile rendering at 390x844, 412x915, and 430x932 found that the footer partner ad injected a fixed 728px `ins`/iframe into an unconstrained centered `.footer-ad-wrapper`. This expanded the mobile layout/document widths to 559px, 570px, and 579px on every checked route and caused `100vw`-based login modal sizing to use the wrong layout width.
- **Fix**: constrained `.bottom-document-area`, `.bottom-ad-banner`, and `.footer-ad-wrapper` to the viewport and capped the injected `ins`/iframe at the wrapper width. Candidate rendering restored document/body/layout widths to exactly 390px, 412px, and 430px across Home, Chart AI, Market, Lab, Portfolio, MyPage, and login modal states.
- **Preserved behavior**: mobile Home banner through 859px, hidden at 860px+, PC rail at 1440px+, MyPage banner admin, top slide ad, and internal scroll behavior for ticker, nav, Portfolio holdings, and Lab matrices.
- **Validation**: retry checker 41/41, HF1 viewport checker 47/47, mobile baseline checker 74/74, Phase 3DU checker 59/59, Phase 3DU-HF2 checker 43/43, Phase 3DV deployment checker 32/32, production-domain checker 33/33, build, and `git diff --check` passed.
- **Deployment**: commit `9f7f4a1 fix: contain production mobile overflow` deployed to the existing canonical `mkstocklab` project. Deployment `https://mkstocklab-ro7hfpfq4-sbchangkyun-2946s-projects.vercel.app` reached READY and was aliased to `https://mkstocklab.vercel.app`; `/` and `/mypage` returned HTTP 200 with zero redirects.
- **Production geometry verification**: 21/21 public route/state/viewport combinations passed. At 390px, 412px, and 430px, layout, visual, document, body, footer wrapper, injected ad, and iframe widths all matched the device width; login modal widths were 350px, 372px, and 390px.
- **Owner production re-check**: pending.

## Phase 3DV-HF1-DEPLOY-VERIFY - 2026-06-28

### Production Deployment Alias and Asset Verification (Completed - Phase 3DV-HF1-Retry required)

- **Owner report**: local HF1 review passed, but production still showed the mobile blank-area behavior.
- **Goal**: verify whether canonical production `https://mkstocklab.vercel.app` is actually serving the HF1 deployment.
- **Verification**: the local link contains exactly one project named `mkstocklab`; Vercel reports the canonical alias target as production READY and resolves it to the exact recorded HF1 deployment URL. Canonical production HTML contains the HF1 viewport marker, and public CSS asset `/_astro/Layout.BawJWM8C.css` contains the global width ceiling, body overflow guard, `.site-main` shrink rules, and the complete shared route-containment selector set.
- **HTTP/cache evidence**: `/` and `/mypage` returned HTTP 200 with zero redirects. HTML and CSS responses use `cache-control: public, max-age=0, must-revalidate`; the CSS request was a Vercel cache HIT, but it returned the current HF1 marker set.
- **Conclusion**: canonical production is serving the HF1 artifact. This is not a stale alias or missing-asset deployment. Under the verification decision rules, the remaining mobile blank area is a true production layout issue and must proceed to `Phase 3DV-HF1-Retry` for overflowing-element diagnosis.
- **No runtime source hotfix. No redeploy. No Supabase/DB changes. No Vercel environment changes. No project relink. No push.**

## Phase 3DV-HF1 - 2026-06-28

### Mobile Viewport and Global Responsive Layout Hotfix (Implemented and deployed - owner production re-check pending)

- **Owner report**: production mobile pages rendered like a desktop page scaled down, with a large right-side blank area across Home, Chart AI, Market, Lab, Portfolio, MyPage, and login modal states.
- **Root cause**: the shared viewport meta was already device-width based, but the global shell did not fully contain intrinsic-width descendants. `html`/`body` had no explicit viewport width ceiling, `body` had no horizontal-overflow guard, `.site-main` used `max-width: none` without `min-width: 0`, and major route shells did not consistently declare shrink containment.
- **Fix**: upgraded the viewport meta with `viewport-fit=cover`; constrained `html`, `body`, `.site-main`, common shell elements, and major route containers to the viewport; made `.site-main` and route shells shrink-safe; and added body-level overflow protection after the source overflow paths were contained.
- **Preserved behavior**: mobile Home banner through 859px, hidden at 860px+, PC rail at 1440px+, MyPage banner admin, and internal scroll behavior for Portfolio holdings and Lab matrices.
- **Validation**: focused viewport checker 47/47, mobile baseline checker 74/74, Phase 3DU checker 59/59, Phase 3DU-HF2 checker 43/43, Phase 3DV deployment checker 32/32, production-domain checker 33/33, build, and `git diff --check` passed.
- **Deployment**: commit `b04a79d fix: restore mobile viewport responsiveness` deployed to the existing canonical `mkstocklab` project. Deployment `https://mkstocklab-h1huhdhxq-sbchangkyun-2946s-projects.vercel.app` reached READY and was aliased to `https://mkstocklab.vercel.app`; public `/` and `/mypage` checks returned HTTP 200.
- **Owner production re-check**: pending.

## Phase 3DV - 2026-06-28

### Production Deployment for Mobile Home Ad Banner (Deployed)

- **Status**: Deployed to production.
- **Canonical production URL**: `https://mkstocklab.vercel.app`.
- **Deployed baseline**: `ec41d41 docs: close out mobile home ad banner owner review`.
- **Deployed scope**: Phase 3DU mobile Home ad banner implementation, Phase 3DU-HF2 PC banner admin persistence hotfix, and Phase 3DU owner review closeout.
- **Accepted behavior deployed**: PC slots 1–5, mobile slots 1–5, URL-only MyPage admin workflow, mobile placement between `MY PORTFOLIO` and `MARKET SNAPSHOT`, responsive visibility through 859px, hidden at 860px+, PC rail at 1440px+, zero/one/multiple banner states, and 5000ms rotation.
- **Vercel target**: existing canonical `mkstocklab` project. No new temporary project was created; the pre-existing non-canonical project was not used.
- **Validation**: all pre-deploy static checks, production build, `git diff --check`, Vercel READY inspection, and public HTTP 200 checks for `/` and `/mypage` passed.
- **No API route changes. No DB/Supabase schema changes. No SQL. No migration. No Supabase Storage upload. No Vercel environment changes.**
- **Owner post-deploy check**: pending.

## Phase 3DU-OWNER-REVIEW-CLOSEOUT - 2026-06-28

### Mobile Home Ad Banner Owner Review Closeout (Completed — owner review PASS)

- **Status**: Completed — owner review PASS.
- **Review result**: owner manually re-tested Phase 3DU and Phase 3DU-HF2. All review items passed.
- **Accepted scope**: PC slots 1–5, mobile slots 1–5, URL-only MyPage admin workflow, mobile placement between `MY PORTFOLIO` and `MARKET SNAPSHOT`, responsive visibility through 859px, hidden at 860px+, PC rail regression at 1440px+, zero/one/multiple banner states, and 5000ms rotation behavior.
- **HF2 re-test**: PC slot 2 link URL persistence PASS; PC slot 3 active checkbox persistence PASS; unchecked slot excluded from desktop rail PASS; PC/mobile slots 1–5 regression PASS; original settings restored PASS.
- **Checkbox policy accepted**: checked slots are eligible for display when they have valid HTTP(S) image URLs; unchecked slots are excluded.
- **Storage compatibility accepted**: legacy array-shaped and object-shaped banner settings remain supported, and saving either group preserves the other group.
- **No runtime changes in this closeout. No API route changes. No DB/Supabase changes. No live calls. No production deployment.**
- **Next phase**: Phase 3DV — Production Deployment for Mobile Home Ad Banner, only after explicit owner approval.

## Phase 3DU-HF2 - 2026-06-28

### PC Banner Admin Save Persistence Hotfix (Implemented — owner re-test pending)

- **Owner report**: PC slot 2 `linkUrl` and PC slot 3 `active` changes reverted after save/reload, while mobile banner saves appeared to persist.
- **Source finding**: PC and mobile fields used the same correct collection/merge path, but save success was based only on the upsert response status; MyPage did not reload persisted values after success. The two group save buttons also had identical labels.
- **Fix**: the upsert now returns and normalizes the stored value, compares both desktop and mobile groups with the intended payload, and reports success only after verification. MyPage reloads both groups after verified save and uses explicit PC/mobile save labels.
- **Checkbox behavior**: section guidance now states that only checked slots are eligible. `HomeRailAd` already filters by `active`; its zero-active path now clears stale managed DOM and hides the rail during client navigation.
- **Compatibility**: legacy array-shaped desktop values and object-shaped `home_rail_banners` / `home_mobile_banners` values remain supported. Saving either group preserves the other group.
- **No live Supabase calls by Codex. No SQL or migration. No dev server or browser automation. No production deployment.**
- **Next phase**: owner re-test; PASS → Phase 3DU-HF2-CLOSEOUT or Phase 3DU-OWNER-REVIEW-CLOSEOUT.

## Phase 3DU-OWNER-REVIEW - 2026-06-28

### Mobile Home Ad Banner Owner Review (Prepared — owner manual browser/admin review pending)

- **Status**: Prepared — owner manual browser/admin review pending. No runtime source changes in this phase.
- **Implementation baseline**: Phase 3DU completed at `06549cc feat: add mobile home ad banner slots`.
- **Deliverables**: owner-only local review runbook, sanitized result template, and static documentation checker.
- **Review scope**: MyPage admin gate and five-slot PC/mobile controls, URL-only saves and storage compatibility, mobile Home placement at 390px/430px/859px, hidden state at 860px+, 1440px+ PC rail regression, and 5000ms rotation states.
- **Execution boundary**: Codex does not start the dev server or browser. The owner performs the review manually and reports only sanitized pass/fail fields.
- **No runtime changes. No API route changes. No DB/Supabase changes. No live calls. No production deployment.**
- **Next phase**: PASS → Phase 3DU-OWNER-REVIEW-CLOSEOUT; visual issue → Phase 3DU-HF1; storage/admin issue → Phase 3DU-HF2; deployment only after explicit owner approval → Phase 3DV.

## Phase 3DU - 2026-06-28

### Mobile Home Ad Banner Slot Implementation (Completed — safe local validation PASS)

- **Status**: Completed; safe local static checks and production build passed.
- **PC Home rail**: expanded managed banner slots from 3 to 5 while preserving existing slots 1-3 and the `160×600` desktop rail behavior.
- **Mobile Home banner**: added a five-slot mobile component between `MY PORTFOLIO` and `MARKET SNAPSHOT`, visible only at `max-width: 859px` with reserved `720 / 225` aspect ratio and `object-fit: contain`.
- **Rotation**: mobile banners match the desktop 5000ms behavior: hidden at zero active banners, static at one, and rotating at two or more, with timer teardown on reload.
- **MyPage**: extended the existing admin-gated, URL-only panel into separate PC and mobile subsections; no file upload UI was added.
- **Storage compatibility**: the checked-in RLS policy publicly reads only the existing `home_rail_banners` row, so the row now supports a backward-compatible object containing `home_rail_banners` and `home_mobile_banners`. Legacy array values remain readable. No migration was added.
- **Validation**: `check:home-ad-slots` PASS, `check:home-rail-banner-settings` 111/111 PASS, new `check:phase-3du-mobile-home-ad-banner` 59/59 PASS, `npm run build` PASS, and `git diff --check` PASS.
- **No API route changes. No DB migration. No live Supabase calls. No external provider calls. No production deployment.**

## Phase 3DT - 2026-06-27

### Mobile Home Ad Banner Slot Implementation Plan (Planned — implementation pending)

- **Status**: Planned — implementation pending. No runtime source changes in this phase.
- **Goal**: Inspect the existing PC `160×600` Home right-side banner system and plan a mobile-only Home banner slot using the same management pattern.
- **Owner request**: add a mobile Home banner between `MY PORTFOLIO` and `MARKET SNAPSHOT`; use recommended creative size `720×225px`.
- **Existing pattern to preserve**: master MyPage registration, Supabase bucket image URL registration, existing automatic rotation behavior, and existing rotation interval.
- **Registration limit update planned**: PC banners max 3 → 5; mobile Home banners max 5.
- **Implementation constraint**: do not invent a new ad management system; extend the existing PC banner implementation.
- **No implementation in this phase. No runtime source changes. No API route changes. No DB/Supabase schema changes. No production deployment.**
- **Recommended next phase**: Phase 3DU — Mobile Home Ad Banner Slot Implementation.

## Phase 3DS-CLOSEOUT - 2026-06-27

### Owner Browser Review Closeout (Completed — owner browser review PASS)

- **Status**: Completed — owner browser review PASS. No runtime source changes in this closeout phase.
- **Owner review**: PASS reported by owner for the Phase 3DR Portfolio owner preview UI.
- **Accepted baseline**: owner local preview mode is accepted for local browser review use; fixture remains default; production UI does not use live quotes by default; `source=auto` remains deferred.
- **Safety**: no raw API responses, prices, screenshots with values, secrets, account numbers, or provider payloads recorded.
- **No live KIS/API calls by Claude Code.** Owner performed browser review manually.
- **No local dev server or browser launched by Claude Code.**
- **No API route changes. No DB/Supabase changes. No production deployment.**
- **Known tracker**: `check:portfolio-holdings-header` remains a pre-existing `85/90` partial failure and is not blocking this closeout.
- **New product request deferred**: mobile Home ad banner slot, using the existing PC 160×600 banner management pattern, with PC/mobile max count expanded to 5 and mobile banner placed between `MY PORTFOLIO` and `MARKET SNAPSHOT`.
- **Recommended next phase**: Phase 3DT — Mobile Home Ad Banner Slot Implementation Plan.

## Phase 3DS - 2026-06-27

### Owner Local Browser Review of Portfolio Live Preview UI (Prepared — owner browser review pending)

- **Status**: Prepared — owner browser review pending. No runtime UI changes in this phase.
- **Goal**: Prepare the owner manual browser review runbook and safe report template for the Phase 3DR Portfolio live preview UI.
- **Baseline**: Phase 3DR implemented owner local preview mode in `src/pages/portfolio.astro` only.
- **Review URL**: `http://localhost:4321/portfolio?previewMode=owner`.
- **Fixture regression URL**: `http://localhost:4321/portfolio`.
- **Production safety URL**: `https://mkstocklab.vercel.app/portfolio?previewMode=owner`.
- **Review focus**: owner preview banner, freshness badges, KPI fallback suppression, eligibility blocking, mobile 390px layout, production preview blocking, and no raw provider leakage.
- **Safety**: owner must share only pass/fail fields, not prices, screenshots with values, full API responses, request/response bodies, tokens, account numbers, or provider payloads.
- **No live KIS/API calls by Claude Code.** Owner performs browser review manually.
- **No API route changes. No DB/Supabase changes. No production deployment.**
- **Recommended next phase**: PASS → Phase 3DS-CLOSEOUT; local issue → Phase 3DS-Retry; UI issue → Phase 3DR-HF1.

## Phase 3DQ - 2026-06-27

### Portfolio UI Preview Mode Wiring Plan (Planned — no runtime UI changes)

- **Status**: Planned — implementation pending. No runtime UI changes in this phase.
- **Goal**: Produce a detailed owner-only UI preview mode wiring plan covering gate logic, request mapping, response mapping, freshness labels, partial data rules, security requirements, and mobile UX for Phase 3DR.
- **Background**: Built on Phase 3DP-OWNER-SMOKE-CLOSEOUT (HTTP 200, `staleState=fresh`, `rowCount=3`, `missingQuoteCount=0`, `unavailableRows=0` — all contract checks passed).
- **Activation gate recommended**: local-only URL query parameter `?previewMode=owner` + hostname gate (`localhost` or `127.0.0.1`). No production visibility.
- **Pre-validation required**: aggregate portfolio blocked; non-KRW portfolio blocked; US positions blocked; >10 positions blocked.
- **Freshness labels**: `조회 시점 기준` (fresh), `최근 조회 기준` (stale-but-usable), `데이터 일시 불가` (unavailable), `연동 실패` (API failure). Label `실시간` / `실시간 시세` prohibited.
- **KPI summary**: cost-basis fallback (`posVal?.marketValue ?? buyPrice * quantity`) must be suppressed for live-preview unavailable rows.
- **Owner/developer-only mode**: not exposed in production UI; fixture path remains default in all environments.
- **No live API calls by Claude Code.** No API route changes. No DB/Supabase changes. No production deployment.
- **Recommended next phase**: Phase 3DR — Portfolio UI Preview Mode Implementation.

## Phase 3DP-OWNER-SMOKE-CLOSEOUT - 2026-06-27

### Owner Portfolio Live Preview API Smoke Closeout (Completed — owner API smoke PASS)

- **Status**: Completed — owner API smoke PASS. No live KIS by Claude Code.
- **Owner smoke**: executed manually by owner; final run (Attempt 3) passed all contract checks.
- **Final safe summary**: HTTP 200, `source=live`, `previewMode=owner`, `quoteSource=live`, `liveAttempted=true`, `providerStored=false`, `staleState=fresh`, `rowCount=3`, `missingQuoteCount=0`, `unsupportedCount=0`, `unavailableRows=0`, `apiLivePreview=true`, `contractValidated=true`.
- **Provider leakage check**: passed — no KIS field names, tokens, or raw payload exposed.
- **Attempt 1**: `API_CALL_EXCEPTION` — local API connection issue (127.0.0.1 target).
- **Attempt 2**: HTTP 200, contract passed, `staleState=unavailable`, `missingQuoteCount=3`, `unavailableRows=3` — KIS env vars not loaded before dev server start.
- **Attempt 3**: HTTP 200, contract passed, `staleState=fresh`, `missingQuoteCount=0`, `unavailableRows=0` — **PASS** after local runtime correction.
- **No raw response body, prices, secrets, account numbers, or provider payloads recorded.** Only sanitized `phase3dp step=... sanitized=true` lines shared.
- **No live API smoke by Claude Code.** Owner ran the smoke manually.
- **No runtime UI/API/DB/deployment changes in this closeout phase.**
- **No production deployment.**
- **Recommended next phase**: Phase 3DQ — UI Preview Mode Wiring Plan.

## Phase 3DP-OWNER-SMOKE - 2026-06-27

### Owner Portfolio Live Preview API Smoke (Prepared — owner API smoke execution pending)

- **Status**: Prepared — owner API smoke execution pending. No live KIS by Claude Code.
- **Goal**: Provide a safe, owner-run local API smoke script for testing the Phase 3DP live preview contract at `POST /api/portfolio/valuation`.
- **Owner smoke script**: `scripts/owner_smoke_portfolio_live_preview_api.mjs` — package command `smoke:portfolio-live-preview-api:owner`.
- **Guard variables**: requires all five `PHASE_3DP_*` guards set to exact values; missing guards trigger dry-run only — no API call made.
- **Local-only API target**: calls `http://127.0.0.1:4321/api/portfolio/valuation` only. Non-local URL overrides rejected before any fetch. URL never printed — logs use `target=local-api`.
- **Request body**: fixed safe sample — `source: "live"`, `previewMode: "owner"`, `allowLiveQuotes: true`, `baseCurrency: "KRW"`, KR positions `005930`, `000660`, `069500`. Placeholder `buyPrice=1`, `quantity=1`. Full body not printed.
- **Safe output only**: emits `phase3dp step=... status=... sanitized=true` lines. No prices, no market values, no raw response body, no `providerMeta`, no KIS fields, no tokens.
- **Sanitizer**: `forbiddenOutputPattern` blocks any output line containing sensitive data. Blocked lines emit `SAFE_OUTPUT_BLOCKED`.
- **No live KIS by Claude Code.** Owner must run the smoke manually after starting the local dev server.
- **No runtime UI/API/DB/deployment changes in this phase.**
- **No production deployment.**
- **Recommended next phase**: If PASS → Phase 3DP-OWNER-SMOKE-CLOSEOUT; if API error → Phase 3DP-HF1; if server not running → Phase 3DP-Retry.

## Phase 3DP - 2026-06-27

### Portfolio Live Preview API Contract Implementation (Implemented — owner API smoke pending)

- **Status**: Implemented — owner API live preview smoke pending. No live KIS by Claude Code.
- **Goal**: Add a tightly gated KR-only live preview path to `POST /api/portfolio/valuation`. Fixture path is unchanged.
- **Triple opt-in gate**: `source: "live"` + `previewMode: "owner"` + `allowLiveQuotes: true`. All three required; any missing → 400 `UNSUPPORTED_SOURCE`.
- **Additional gates**: non-production runtime only; `KIS_ACCOUNT_NO` must be absent; `baseCurrency=KRW`; max 10 positions; KR-only (US → 400 `UNSUPPORTED_SOURCE`).
- **Runtime guard**: `isLivePreviewGateReady()` added to `quotes.ts` — reads `VERCEL_ENV`, `NODE_ENV`, `KIS_ACCOUNT_NO` without exposing values; `valuation.ts` route calls this without reading `process.env` directly.
- **Quote resolution**: `getQuoteSnapshot()` (existing orchestration — in-memory cache, stale fallback, provider errors). No fixture fallback on live failure. Unavailable rows remain unavailable.
- **No provider leakage**: `providerMeta` stripped by `buildPortfolioValuationFromQuotes`. No raw KIS fields, no tokens, no URLs in any response.
- **No UI changes.** No Supabase changes. No DB migrations. No production deployment.
- **Source policy unchanged for public users**: `source=fixture` remains default. Public `source="live"` rejected. `source="auto"` deferred.
- **New deliverables**: `check:portfolio-live-preview-api` (static + behavioral checker), Phase 3DP result doc.
- **Recommended next phase**: Phase 3DP-OWNER-SMOKE — Owner Portfolio Live Preview API Smoke; then Phase 3DQ — UI Preview Mode Wiring Plan.

## Phase 3DO-CLOSEOUT - 2026-06-27

### KR Quote Expansion Results Closeout (Completed — all KR expansion targets PASS)

- **Status**: Completed — all KR expansion targets PASS. No live KIS calls by Claude Code.
- **Final results**: `005930` PASS, `000660` PASS, `069500` PASS after HF1 rerun.
- **Attempt history**: `005930` passed on first expansion run; `000660` passed after retry; `069500` initially failed at `quote-fetch` with generic `QUOTE_FETCH_FAILED`, then Phase 3DO-HF1 added safe diagnostic classification, and `069500` passed on owner rerun.
- **069500 (KR ETF)**: Live quote retrieval confirmed via KIS domestic endpoint. ETF codes use the same endpoint as KR stocks.
- **All final successful outputs sanitized**: no secrets, no raw payloads, no account numbers, no raw KIS field values, no actual prices, no stack traces were recorded.
- **No live KIS by Claude Code.** Owner manually executed `npm run smoke:kis-quote-live:dry` for all three symbols.
- **No runtime changes**: no API routes, no UI, no DB, no Supabase, no deployment.
- **Source policy unchanged**: `source=fixture` remains default. Public `source=live` remains disabled (400 `UNSUPPORTED_SOURCE`). `source=auto` remains deferred.
- **New deliverables**: closeout result doc, static checker (`check:phase-3do-closeout`). Updated Phase 3DO and Phase 3DO-HF1 result docs to completed status.
- **Recommended next phase**: Phase 3DP — Portfolio Live Preview API Contract Implementation.

## Phase 3DO-HF1 - 2026-06-27

### KIS Quote Fetch Failure Diagnostics (Implemented — owner diagnostic rerun pending)

- **Status**: Implemented — owner diagnostic rerun pending. No live KIS calls by Claude Code.
- **Context**: Phase 3DO owner expansion found `005930` PASS, `000660` PASS, `069500` failed at `quote-fetch` with generic `code=QUOTE_FETCH_FAILED` — insufficient for diagnosis.
- **Fix**: added `classifyQuoteFetchFailure(result)` helper in `scripts/owner_smoke_kis_quote_live.mjs`. Maps structured safe provider codes (`PROVIDER_RATE_LIMITED`, `PROVIDER_UNAVAILABLE`, `AUTH_REQUIRED`, `CONFIG_MISSING`, `SYMBOL_UNSUPPORTED`, etc.) to safe diagnostic output codes. Catch path now emits `QUOTE_FETCH_FAILED_UNKNOWN`. No raw messages, URLs, stack traces, or provider field names exposed.
- **Diagnostic codes added**: `PROVIDER_RATE_LIMITED`, `PROVIDER_UNAVAILABLE`, `AUTH_REQUIRED`, `KIS_CONFIG_MISSING`, `SYMBOL_UNSUPPORTED`, `PROVIDER_RESPONSE_UNEXPECTED`, `QUOTE_FETCH_FAILED_UNKNOWN`.
- **PASS and dry-run behavior unchanged.** Sanitizer (`logSafe`, `forbiddenOutputPattern`) unchanged.
- **No runtime changes**: no API routes, no UI, no DB, no Supabase, no deployment.
- **Owner report template updated** with HF1 diagnostic rerun section for `069500`.
- **Claude Code did not run live KIS.** Owner should rerun only `069500` and share the specific safe `code=` value from the `quote-fetch` line.
- **Recommended next phase**: depends on diagnostic code — PASS → 3DO-CLOSEOUT, SYMBOL_UNSUPPORTED → 3DQ, PROVIDER_RATE_LIMITED/UNAVAILABLE → 3DO-Retry, QUOTE_FETCH_FAILED_UNKNOWN → 3DO-HF2.

## Phase 3DO - 2026-06-27

### KR Quote Preview Expansion and Portfolio Live Preview API Plan (Prepared — owner KR expansion execution pending)

- **Status**: Prepared — owner KR expansion execution pending. No runtime changes. Claude Code did not run live KIS calls.
- **Goal**: expand owner-run live KIS quote smoke from one symbol (`005930`) to three KR symbols (`005930`, `000660`, `069500`), and create a design plan for a future Portfolio Live Preview API activation path.
- **KR expansion target symbols**: `005930` (KR stock, regression), `000660` (KR stock), `069500` (KR ETF).
- **Smoke identity env vars explicitly documented**: `PHASE_3Y_SMOKE_MARKET=KR`, `PHASE_3Y_SMOKE_SYMBOL=<target>` — addressing Phase 3DN setup gap.
- **Portfolio Live Preview API plan created**: `docs/planning/phase_3do_portfolio_live_preview_api_plan_v0.1.md`. Recommends `source=live` + `previewMode=owner` dual-opt-in gate, KR-only initial scope, 10-position limit, no fixture fallback, no `providerMeta` exposure.
- **UI freshness labels planned**: `조회 시점 기준` (fresh), `최근 조회 기준` (stale-but-usable), `데이터 일시 불가` (unavailable), `연동 실패` (connection failure). No runtime UI changes.
- **New deliverables**: result doc (phase_3do_*), owner report template (one section per symbol), Portfolio Live Preview API plan, static checker (check:kr-quote-preview-plan), package script.
- **Source policy unchanged**: source=fixture remains default. source=live remains 400 UNSUPPORTED_SOURCE. source=auto deferred.
- **No runtime changes**: no API routes, no UI, no DB, no provider code, no Supabase, no live calls by Claude Code.
- **Claude Code did not run live KIS.** Owner execution of three KR symbol smokes is pending.
- **Recommended next phase**: Phase 3DO-CLOSEOUT — Record KR Quote Expansion Results (after owner runs all three symbols and shares sanitized output).

## Phase 3DN - 2026-06-27

### Owner-Run KIS Single Quote Preview (Completed — owner live smoke PASS)

- **Status**: Completed — owner live smoke PASS. No runtime changes. Claude Code did not run live KIS calls.
- **Goal**: confirm that a single KR domestic stock quote (`005930`) can be retrieved live, sanitized, normalized, and cached from a local owner terminal using real KIS credentials and guard env vars.
- **Owner live smoke result**: PASS (two attempts — see below).
- **Attempt 1**: FAIL at `smoke-identity-validation` (`SMOKE_IDENTITY_INVALID`) — `PHASE_3Y_SMOKE_MARKET` and `PHASE_3Y_SMOKE_SYMBOL` were not set. No KIS quote call reached. No secrets or raw payload shared.
- **Attempt 2**: PASS after setting `PHASE_3Y_SMOKE_MARKET=KR` and `PHASE_3Y_SMOKE_SYMBOL=005930`. Live quote received, quote normalized, staleState=fresh, cache write/readback passed.
- **Final result fields**: `mode=live-approved`, `liveKis=true`, `quoteNormalized=true`, `cacheValidated=true`, `sanitized=true`.
- **staleState**: `fresh`. pricePresent: true. accountApiCalled: false (KIS_ACCOUNT_NO absent).
- **No secrets, tokens, account numbers, raw payloads, or raw KIS field values were recorded.**
- **Deliverables created**: result doc, owner report template, `check_owner_run_kis_single_quote_preview_static_contract.mjs` (61/61 PASS), `check:kis-single-quote-preview` package script.
- **Preflight results**: check:kis-fx-mocked-adapter (119/119), check:kis-fx-preview-smoke-plan (52/52), check:kis-valuation-design (73/73), check:kis-quote-adapter-mocked (101/101), build — all PASS.
- **No runtime/API/DB/UI/deployment changes.** Source policy unchanged: source=fixture remains default, source=live returns 400 UNSUPPORTED_SOURCE.
- **Claude Code did not run live KIS.** Owner ran manually from local terminal.
- **Recommended next phase**: Phase 3DO — KR Quote Preview Expansion and Portfolio Live Preview API Plan.

## Phase 3DM - 2026-06-27

### KIS + FX Mocked Adapter Contract Hardening (Implemented, awaiting owner review)

- **Status**: implemented, awaiting owner review. No live calls. No deployment.
- **Goal**: harden no-network mocked contracts for KIS quote, FX adapter, quote cache state transitions, and mixed-currency portfolio valuation before owner runs a live KIS single quote smoke.
- **New file**: `src/lib/server/providers/fxMockAdapter.ts` — mocked FX adapter. `getMockedFxRate` (USD→KRW=1350), `convertCurrencyMocked`. source='mocked', staleState='sample'. No fetch, no env, no Supabase.
- **Modified**: `src/lib/server/portfolioValuation.ts` — added `buildPortfolioValuationFromQuotesWithFx()`. Mixed-currency totalMarketValue computed when mocked FX provided; null when FX absent (never fabricated). staleState capped at stale-but-usable when mocked FX used.
- **API route policy**: conservative — `source=live` continues to return 400 UNSUPPORTED_SOURCE. No route change. No UI change. No fixture fallback on live failure.
- **Checker**: `check:kis-fx-mocked-adapter` — 119/119 PASS. Groups: file existence, safety boundary, FX mock contract, KIS validation/readiness, cache state transitions, portfolio valuation mocked-live, API route policy, documentation, forbidden patterns.
- **KIS mocked contract**: 6 readiness guard states, 6 validation cases. US market → SYMBOL_UNSUPPORTED. No raw KIS fields in any output.
- **Cache transitions**: fresh/stale-but-usable/expired state machine verified with synthetic timestamps. No real time, no sleeping.
- **Portfolio valuation mocked-live**: KR-only totalMarketValue computed; mixed KRW+USD with mocked FX computes (USD × 1350 = KRW); mixed without FX = null; partial quote failure explicit; providerMeta never copied to rows.
- **No runtime changes to UI, CSS, layout, or existing API contracts.**
- **Recommended next phase**: Phase 3DN — Owner-Run KIS Single Quote Preview.

## Phase 3DL - 2026-06-27

### KIS + FX Preview Smoke Plan (Planned / Execution-ready)

- **Status**: planned and execution-ready. No runtime changes. No live KIS or FX calls in this phase.
- **Goal**: inspect existing KIS/quote/cache scaffolding and produce a concrete, staged plan for owner-controlled live quote preview before any live data reaches users.
- **Codebase inspection findings**:
  - KIS domestic (KR) quote adapter fully implemented (`kisClient.ts`) with runtime guard, token cache, sanitized error handling, and hard production block.
  - In-memory quote cache exists: fresh TTL 15s, stale TTL 120s. Supabase persistent cache implemented but opt-in.
  - Portfolio valuation layer (`portfolioValuation.ts`) ready for live quotes; `totalMarketValue=null` for mixed-currency (FX not implemented).
  - Valuation API (`POST /api/portfolio/valuation`) supports only `source=fixture` today; `source=live` returns 400.
  - Three owner-only smoke scripts exist with explicit guard env vars; not safe for Claude Code to run.
  - US quote endpoint not yet implemented; FX provider not yet selected.
- **Deliverables**: result doc, owner runbook, static checker (52/52 PASS), `check:kis-fx-preview-smoke-plan` package script.
- **No runtime changes**: no API routes, no UI, no DB, no provider, no Supabase, no live calls.
- **Recommended next phase**: Phase 3DM — KIS + FX Mocked Adapter Contract Hardening (or Owner-Run KIS Single Quote Preview if owner is ready to test with real credentials).

## Phase 3DK - 2026-06-27

### Production Deployment for Mobile UX Hotfixes (Deployed)

- **Status**: deployed to production. No runtime code changes in this phase.
- **Canonical production URL**: `https://mkstocklab.vercel.app`
- **Deployed commits**:
  - `a44a8d0` — Phase 3DJ: Mobile Baseline Usability Pass
  - `adebaf9` — Phase 3DJ-HF1: Mobile UX Density and Export Consistency Hotfix
  - `8e00cac` — Phase 3DJ-HF2: Mobile Snapshot and Portfolio Usability Hotfix
- **Owner review**: Phase 3DJ-HF2 passed local/mobile owner review. Owner explicitly approved production deployment.
- **Product changes deployed**: mobile global width blocker removed; header/nav baseline improvements; Home mobile density improved; Home MARKET SNAPSHOT 2-column at 390px; Portfolio KPI summary (총 자산 / 총 수익); Portfolio compact `$` / `₩` controls; `카테고리` label removed; Portfolio header/body alignment fix; full sortable column label tap; grouped column structure; Lab duplicate inner header removed; Lab matrix mobile tap highlight improved; desktop-size image export via `scrollWidth` + `data-export-width`.
- **No runtime changes in Phase 3DK**: deployment-only phase.
- **No live/API/DB/provider changes**: no KIS, no GNews, no AI, no Supabase, no SQL, no API routes, no DB migrations.
- **Focused validation**: 9 checkers run, all passed (49+74+68+80+57+66+73+76+33 checks). Build and git diff --check clean.
- **Recommended next phase**: Phase 3DL — KIS + FX Preview Smoke Plan (live data integration) or Phase 3DL — UI Architecture Refactor Plan (design system stabilization).

## Phase 3DJ-HF2 - 2026-06-27

### Mobile Snapshot and Portfolio Usability (Implemented — awaiting owner review, NOT yet deployed)

- **Status**: implemented and validated; owner must review before deploying. Hotfix on top of Phase 3DJ-HF1.
- **Goal**: address owner review failure on two areas — Home MARKET SNAPSHOT still 1-col at 390px; portfolio usability issues (카테고리 label, alignment, sort tap area, no KPI summary).
- **A. Home MARKET SNAPSHOT 2-column fix**: root cause was `@media (max-width: 400px)` triggering at 390px. Fixed to `max-width: 340px`. Changed `repeat(2, 1fr)` → `repeat(2, minmax(0, 1fr))` to prevent cell overflow when sparkline SVG is 120px wide. Added `gap: 6px`. Added sparkline SVG shrink override (`64×22px`) and `index-card-value` font-size reduction at ≤720px.
- **B. Portfolio control label cleanup**: removed `<p class="eyebrow">카테고리</p>` from `portfolio-list-controls-bar`. `$ / ₩` currency controls remain right-aligned outside scroll (`justify-content: flex-end`).
- **C. Portfolio header alignment**: `positions-category-header` gained `padding: 0 14px 2px` to match position card padding. `positions-category-grid` min-width reduced 740px → 712px (border-box: 712 + 28px padding = 740px total).
- **D. Full sortable label click**: added `data-sort-column="weight|valuation|return|dividend-yield"` to header cells. Extended click handler — cell click toggles `{col}-desc` first, then `{col}-asc`; `▲▼` arrow buttons still work for precise direction control. Added `cursor: pointer` + hover CSS for `[data-sort-column]`.
- **E. Portfolio KPI summary block**: added `<div class="portfolio-kpi-summary">` inside `portfolio-panel-header`. Shows `총 자산` (total market value) and `총 수익` (total P&L + %). Computed from existing `getPositionValuation()` + `buyPrice × quantity` fallback. Hidden when no portfolio selected or no positions. No new API routes, no network calls.
- **No new dependencies**: no npm packages, no API routes, no DB changes, no KIS/GNews/AI/Supabase calls.
- **Focused validation**: check:mobile-snapshot-portfolio 49/49 PASS, check:mobile-baseline 74/74 PASS, check:mobile-ux-density-export 68/68 PASS, build PASS.

## Phase 3DJ-HF1 - 2026-06-27

### Mobile UX Density + Export Consistency (Implemented — awaiting owner review, NOT yet deployed)

- **Status**: implemented and validated; owner must review before deploying. Hotfix on top of Phase 3DJ.
- **Goal**: address owner review failure — "site feels like a desktop page squeezed into a narrow viewport." Deliver actual mobile-native density and make image export viewport-independent.
- **A. Export consistency** (`exportCardImage.ts`): `exportCardAsPng` now uses `card.scrollWidth` + optional `requestedExportWidth` from `data-export-width` button attribute. Temporarily forces inline width/minWidth/overflow during capture, adds `.is-exporting-image` class, restores all in `finally`. Treemap buttons: `data-export-width="1200"`. Scatter + lab buttons: `data-export-width="800"`. Export PNG is now desktop-sized regardless of mobile viewport.
- **B. Home mobile density**: 4 feature nav cards (`.home-feature-grid`) hidden at ≤860px — duplicate of the nav bar. Hero lead text clamped to 3 lines. News cards: summary hidden, title max 2 lines. Market Snapshot card padding tightened.
- **C. Header compact**: auth buttons (`header-button`) reduced to `padding: 0 8px; font-size: 11px; min-height: 32px` at ≤720px.
- **D. Chart AI + Market**: reduced lead copy to 2-line clamp; market charts overflow-x scrollable on mobile.
- **E. Portfolio information density**:
  - Removed "보유 종목" eyebrow from panel header.
  - Removed "전체 포트폴리오" and "4개 포트폴리오의..." aggregate text from JS.
  - Removed "Fixture 기준 평가값입니다" success message.
  - Currency buttons compacted: `달러 기준` → `$` (aria-label="달러 기준"), `원화 기준` → `₩` (aria-label="원화 기준").
  - New `portfolio-list-controls-bar` row (outside scroll): `카테고리` left, `$ / ₩` right — fixed, not scroll-dependent.
  - Column restructure: 13 columns → 9 grouped columns (min-width 960px → 740px). Groups: 가격(평단가/현재가), 금액(평가금/원금), 수익(수익률/수익금), 배당(배당률/배당주기).
  - Security names: `-webkit-line-clamp: 2` max 2 lines.
- **F. Lab copy cleanup**: removed duplicate `<header class="lab-section-header">` (title + description + badge) from `LabReturnMatrix.astro` — page-level `lab-detail-header` already shows these. Removed `lab-matrix-export-label` text from both lab pages.
- **No new dependencies**: no npm packages, no API routes, no DB changes, no KIS/GNews/AI/Supabase calls.
- **Focused validation**: check:mobile-ux-density-export 68/68 PASS, check:mobile-baseline 74/74 PASS, check:lab-matrix-image-export 80/80 PASS, check:lab-matrix-hover 57/57 PASS (hover checker updated to accept pointerup), build PASS.

## Phase 3DJ - 2026-06-27

### Mobile Baseline Usability Pass (Implemented — awaiting owner review, NOT yet deployed)

- **Status**: implemented and validated; owner must review before deploying.
- **Goal**: make all main product routes usable on mobile without breaking the accepted desktop UI.
- **Primary fix**: removed `min-width: 1080px` from the global `body` rule — this was the single blocker preventing any responsive CSS from having effect on mobile viewports.
- **Responsive CSS added** (Phase 3DJ block at end of `style.css`):
  - Page gutter reduction: `--page-gutter-x: clamp(14px, 4vw, 24px)` at ≤720px (was always 32px on mobile).
  - Primary nav: `overflow-x: auto` on `.primary-nav` with `min-width: max-content` on `.nav-inner` at ≤720px — all 5 tabs stay in a single scrollable row.
  - Header: `flex-wrap: wrap; min-height: 56px` at ≤720px; `.brand-text small` hidden (Korean subtitle).
  - Ticker belt: `overflow-x: auto` at ≤900px (was `overflow: hidden` → clipping on mobile).
  - Hero section: `grid-template-columns: 1fr` at ≤860px.
  - Grid utilities: `.grid-3` → 2-col at ≤860px, 1-col at ≤560px; `.grid-4` → 2-col at ≤560px.
  - Market snapshot (`.index-card-grid`): 2-col at ≤720px, 1-col at ≤400px.
  - Lab module/preview grids: 1-col at ≤640px.
  - Page header: stacks at ≤640px.
  - H1 font size: `clamp(26px, 7vw, 44px)` at ≤720px.
  - MyPage mp-sections: `max-width: 100%` at ≤720px.
- **Lab matrix mobile tap fix** (`LabReturnMatrix.astro`): replaced `click` handler with `pointerdown` (record start position) + `pointerup` (movement threshold < 10px → set pin). `pointerup` fires BEFORE `pointerleave` on mobile, so the pin is set before `pointerleave` checks it — highlight persists correctly after tap.
- **No new dependencies**: no new npm packages, no API routes, no DB changes, no KIS/GNews/AI/Supabase calls.
- **All desktop layouts preserved**: existing breakpoints at 980px, 640px, 1299px unchanged.
- **All data scroll containers preserved**: `lab-matrix-scroll`, `positions-list-wrap`, `table-wrap`, `portfolio-bookmark-tabs` all retain `overflow-x: auto`.
- **Focused validation**: check:mobile-baseline 74/74 PASS, check:lab-matrix-image-export 80/80 PASS, build PASS.
- **Recommended next phase**: deploy Phase 3DJ after owner review, then proceed to KIS + FX Preview Smoke Plan.

## Phase 3DI-HF1 - 2026-06-27

### Lab Matrix Image Export Capture Scope Hotfix (Deployed)

- **Status**: deployed to `https://mkstocklab.vercel.app`.
- **Root cause**: Phase 3DI `data-exportable-card` was on outer `.lab-matrix-export-card` wrapper, so export PNG captured entire page section (heading, legend, hints, summary table, data policy, related links).
- **Fix**: moved capture boundary to inner `.lab-matrix-card` via a new optional `captureId?: string` prop on `LabReturnMatrix.astro`. When `captureId` is provided, the component sets `id={captureId}` and `data-exportable-card` on the `.lab-matrix-card` div only.
- **Asset page**: `captureId="asset-class-returns-matrix-capture"`, button `data-export-target` updated to match, outer `data-exportable-card` removed.
- **Sector page**: `captureId="sp500-sectors-matrix-capture"`, same change pattern.
- **Captured element now contains only**: `lab-return-matrix` table (순위 + 12 rows) + `lab-matrix-data-note`.
- **Not captured**: page header, legend chips, interaction hint, summary table, data policy, related links, camera button.
- **No new library**: no API/DB/KIS/GNews/AI/Supabase changes.
- **Focused validation**: check:lab-matrix-image-export 80/80 PASS, check:lab-return-matrix 114/114 PASS, build PASS.
- **Recommended next phase**: Phase 3DJ — Mobile Baseline Usability Pass, or KIS + FX Preview Smoke Plan.

## Phase 3DI - 2026-06-27

### Production Deployment: Home Sparkline + Lab Matrix Image Export (Deployed)

- **Status**: deployed to `https://mkstocklab.vercel.app`.
- **Deployed content**: Phase 3CB-HF2 (Home sparklines, commit 9f26a29) + Phase 3DI (Lab image export, new commit).
- **Lab image export**: "이미지로 저장" camera icon button added above the matrix on `/lab/asset-class-returns` and `/lab/sp500-sectors`. Reuses existing `exportCardImage.ts` utility (already used by Market Treemap). Export captures the `[data-exportable-card]` wrapper containing the matrix; button excluded from capture via `[data-card-actions]` filter. Filenames: `asset-class-returns-YYYYMMDD.png`, `sp500-sectors-YYYYMMDD.png`.
- **No new library**: reuses `html-to-image` already in the project.
- **Hover highlight preserved**: existing desktop cross-year hover highlight unaffected.
- **No live/API/DB/provider changes**: no KIS, GNews, AI, Supabase, DB migration, API route, external HTTP.
- **Focused validation**: check:lab-matrix-image-export 64/64 PASS, check:home-index-sparkline 66/66 PASS, check:home-index-cards 73/73 PASS, check:lab-return-matrix 114/114 PASS, check:lab-route-split 104/104 PASS, build PASS.
- **Known limitation carried forward**: Lab matrix mobile tap highlight non-critical, revisit in Phase 3DJ.
- **Recommended next phase**: Phase 3DJ — Mobile Baseline Usability Pass, or KIS + FX Preview Smoke Plan.

## Phase 3CB-HF2 - 2026-06-26

### Home Market Snapshot Mini Sparkline Cards (Implemented)

- **Status**: implemented. Home MARKET SNAPSHOT cards now include compact SSR SVG mini sparklines.
- **Owner request**: existing snapshot cards felt too plain (name + value + change only); owner requested compact mini line charts inside each card.
- **Implementation**: static trend arrays (7 points each) added to all 9 fixture cards; SSR `computePoints` function in Astro frontmatter normalizes each trend and generates `<polyline>` points; sparkline rendered as `<svg viewBox="0 0 120 36">` with no client JS, no chart library, no canvas.
- **Card layout**: `.index-card` extended to flex row; left column (`.index-card-main`) holds label/caption/value/change; right side (`.index-card-sparkline`) holds the SVG.
- **Sparkline colors**: up → `var(--positive)`, down → `var(--negative)`, flat → `var(--neutral)`.
- **Existing data preserved**: all 9 cards retain label, caption, value, change, `예시 데이터` label.
- **No live/API/DB/provider/deployment changes**: no KIS, GNews, AI provider, Supabase, DB migration, API route, external HTTP, setInterval, setTimeout, localStorage, canvas, or deployment.
- **New checker**: `check:home-index-sparkline` (66/66 PASS). Existing `check:home-index-cards` 73/73 PASS (no regressions). Build PASS.
- **Recommended next phase**: Phase 3DI — Production Deployment for Home Sparkline Update, or Phase 3DI — Mobile Baseline Usability Pass.

## Phase 3DH - 2026-06-26

### Production Deployment for Market and Lab UX Updates (Deployed)

- **Status**: deployed to `https://mkstocklab.vercel.app`.
- **Deployed commits**: Phase 3DG (Market fixture dashboard, commit 1b94029) and Phase 3DF-HF4 (Lab matrix desktop hover highlight, commit da2676e).
- **Canonical production URL**: `https://mkstocklab.vercel.app`.
- **Runtime/API/DB/provider changes**: none — deployment phase only.
- **Focused validation**: check:market-fixture-chart 76/76 PASS, check:lab-matrix-hover 57/57 PASS, check:lab-return-matrix 114/114 PASS, check:production-domain 33/33 PASS, build PASS, git diff --check PASS.
- **Known limitation**: Mobile/touch Lab matrix highlight did not work in owner review. Owner accepted as non-critical. Desktop hover highlight is the primary accepted behavior. Revisit in Phase 3DI — Mobile Baseline Usability Pass.
- **Owner review before deploy**: Market local review passed. Lab desktop hover passed. Lab mobile tap did not work, accepted as non-critical.
- **Cleanup recommendation**: Owner can archive/delete temporary `mk-stock-lab.vercel.app` Vercel project after confirming canonical production works.
- **Recommended next phase**: Phase 3DI — Mobile Baseline Usability Pass (stabilize mobile UX before live data work), or KIS + FX Preview Smoke Plan if owner prefers live data integration first.

## Phase 3DF-HF4 - 2026-06-26

### Lab Matrix Cross-Year Hover Highlight (Implemented)

- **Status**: implemented. Same-category cross-year hover highlight added to Lab return matrix on `/lab/asset-class-returns` and `/lab/sp500-sectors`.
- **Owner request**: when hovering/tapping a matrix cell, all same-category cells across all year columns should be highlighted; non-matching cells should dim.
- **Desktop hover**: `pointerover` event delegation on matrix root — highlights all matching `data-lab-category-id` elements; `pointerleave` clears hover highlight (unless pinned).
- **Click/tap fallback**: clicking a cell/chip toggles a pinned highlight for that category; clicking the same category again clears; clicking anywhere else in the root clears.
- **Legend chip interaction**: both top-bar legend chips and summary table chips carry data attributes and participate in hover/click highlight — improves discoverability.
- **Escape key clear**: `keydown` listener on root clears pinned state on Escape.
- **Per-matrix scoping**: each `[data-lab-return-matrix-root]` section has its own independent `pinned`/`lastHovered` state — multiple matrices on a page operate independently.
- **CSS**: `.is-highlighted` (white ring + colored outer ring), `.is-dimmed` (opacity 0.3), `cursor: pointer`, `prefers-reduced-motion` media query, scoped by `.lab-matrix-has-active`.
- **Interaction hint**: `셀 또는 범례에 마우스를 올리거나 탭하면 같은 항목의 연도별 위치가 강조됩니다.` added below the legend.
- **No data changes**: fixture JSON values and categories unchanged.
- **No live/API/DB/provider changes**: no KIS, GNews, AI provider, Supabase, DB migration, API routes, external HTTP, setInterval, setTimeout, localStorage, canvas, or deployment.
- **New checker**: `check:lab-matrix-hover` (57/57 PASS). Existing checker `check:lab-return-matrix` 114/114 PASS (no regressions).
- **Next phase**: Phase 3DH — Production Deployment for Market and Lab UX Updates.

## Phase 3DG - 2026-06-26

### Market Page Fixture Chart Enhancement (Implemented)

- **Status**: implemented. Market page enhanced with a fixture-based analytics dashboard below the existing treemap/scatter visualization.
- **New sections**: 6 market summary cards (KOSPI, KOSDAQ, S&P 500, Nasdaq 100, USD/KRW, Gold), SSR SVG line chart (3 series over 7 periods), CSS horizontal comparison bars (6 assets), 4 watch point memo cards (금리/환율, 위험자산 선호, 변동성, 원자재), data policy disclaimer.
- **Fixture data**: `src/data/marketFixtureDashboard.json` — all values are example/static, not current market data. Normalized to base-100 for the trend chart.
- **Chart implementation**: SSR SVG `<polyline>` with points computed server-side in Astro frontmatter. No Chart.js, no canvas, no client-side JS, no charting runtime.
- **New component**: `src/components/MarketFixtureDashboard.astro` — purely static SSR, no fetch, no Supabase, no KIS, no GNews, no polling.
- **Data labeling**: all values labeled `예시 데이터` · `데이터 연동 전`. No 실시간, 현재 시세, 매수, 매도, 추천 종목 wording.
- **No live/API/DB/provider changes**: no KIS, GNews, AI provider, Supabase, DB migration, API routes, external HTTP, or deployment.
- **New checker**: `check:market-fixture-chart` (76/76 PASS).
- **Focused validation**: check:market-fixture-chart PASS (76/76), build PASS.
- **No production deployment**: phase is local-only until owner confirms browser review passes.
- **Next phase**: Phase 3DH — Production Deployment for Market Update (after owner browser review), or Phase 3DH — KIS + FX Preview Smoke Plan.

## Phase 3DF-HF3 - 2026-06-26

### Production Domain Consolidation (Implemented and Deployed)

- **Status**: implemented and deployed. Owner reported that `mkstocklab.vercel.app` still served old code after Phase 3DF-HF2 was deployed to the new `mk-stock-lab.vercel.app` URL.
- **Root cause**: Phase 3DF-HF2 Vercel CLI created a new project (`mk-stock-lab`) instead of deploying to the existing `mkstocklab` project. Local `.vercel/project.json` was linked to the wrong project.
- **Runtime code**: No hardcoded domain references found anywhere in `src/`. Auth uses `window.location.origin` (dynamic). All internal links use relative paths. No code changes required.
- **Fix**: Relinked local directory to the existing `mkstocklab` Vercel project and redeployed production.
- **Canonical production URL**: `https://mkstocklab.vercel.app` (restored).
- **Temporary non-canonical URL**: `https://mk-stock-lab.vercel.app` — no longer canonical; owner should archive after visual confirmation.
- **Supabase Auth checklist**: Site URL and redirect URLs should remain pointing to `mkstocklab.vercel.app`. Temporary domain redirect URLs can be removed after owner confirms cleanup.
- **New checker**: `check:production-domain` verifies no temp domain in runtime source, auth uses dynamic origin, no regression in Lab pages.
- **Focused validation**: check:production-domain PASS, check:lab-route-split PASS (104/104), check:lab-return-matrix PASS (114/114), build PASS.
- **No live/API/DB/provider changes**: no KIS, GNews, AI provider, Supabase, DB migration, API routes, or polling added.
- **Next phase**: Phase 3DG — Market Page Fixture Chart Enhancement (only after owner confirms canonical URL behavior).

## Phase 3DF-HF2 - 2026-06-26

### Lab Landing Route Split and Production Deployment (Implemented)

- **Status**: implemented. Owner accepted HF1 matrix UI but found route architecture wrong: `/lab` was rendering full matrices instead of being a card gallery landing page.
- **Route split**: `/lab` rewritten as card gallery (실험실), four detail routes created: `/lab/asset-class-returns`, `/lab/sp500-sectors`, `/lab/congress-stocks`, `/lab/nps-holdings`.
- **Landing page**: 4-card grid with CSS-only mini matrix preview for matrix cards, `연동 예정` shell for future module cards. No LabReturnMatrix rendered on landing.
- **Detail pages (matrix)**: `asset-class-returns` and `sp500-sectors` render `LabReturnMatrix` component with back-link to `/lab`, data policy panel, and related Lab links section.
- **Detail pages (future shells)**: `congress-stocks` and `nps-holdings` are static module shells with 3 placeholder preview cards each. No real lawmaker or NPS data.
- **New route created**: `src/pages/lab/nps-holdings.astro` (the old `nps-portfolio.astro` remains untouched at its route).
- **Disclaimer wording**: updated to `자동화된 투자 권고를 제공하지 않습니다.` on all detail pages (safer phrasing).
- **Checker updates**: both old checkers updated to accept route-split architecture. New `check:lab-route-split` checker added (104 checks).
- **Checker results**: check:lab-route-split PASS (104/104), check:lab-return-matrix PASS (114/114), check:lab-static-modules PASS (82/82).
- **No backend changes**: no KIS/GNews/AI provider, no Supabase, no DB migration, no API routes, no live data.

## Phase 3DF-HF1 - 2026-06-26

### Lab Return Matrix Redesign (Implemented)

- **Status**: implemented. Owner review of Phase 3DF found the card-grid layout did not match the intended research visualization direction. Lab was redesigned as a matrix-first page.
- **Owner review finding**: 4-card module grid felt like a placeholder; S&P 500 섹터 and 자산군 수익률 sections showed simple label rows, not a meaningful data visualization. Desired reference direction is a matrix-first, data-dense research visualization similar to ETF-style research pages.
- **Matrix-first redesign**: two large return ranking matrices (자산군 수익률 비교, S&P 500 섹터별 수익률) are now the primary page content. Each matrix has legend chips, colored ranking table with horizontal scroll, and a summary table.
- **Asset matrix**: 12 categories, 7 year columns (YTD + 2025-2020), 12 rank rows, 12 summary rows.
- **Sector matrix**: 12 categories (11 GICS sectors + S&P 500 benchmark), 7 year columns, 12 rank rows, 12 summary rows.
- **Category color system**: each category has a stable CSS color class (e.g. `.lab-return-cell--bitcoin`, `.lab-return-cell--technology`). Color identifies the category, not positive/negative performance.
- **Fixture data**: `src/data/labReturnMatrices.json` — all values are example data, not real historical returns. Notes field on both matrices: "예시 데이터입니다. 실제 수익률이 아니며 데이터 연동 전 화면입니다."
- **Design source policy**: reference pages used for layout intent only. No data scraped, no third-party branding or watermark included.
- **Future modules demoted**: 국회의원 보유 주식 and 국민연금 보유 현황 appear as small future module cards (연동 예정) below the matrices, not as primary hero cards.
- **Old checker updated**: `check_lab_static_module_shells_static_contract.mjs` updated to accept matrix-first design (Group 3, 5, 6 relaxed). Still 82/82.
- **No backend changes**: no KIS/GNews/AI provider, no Supabase, no DB migration, no API routes, no live data, no deployment.
- **Focused validation**: check:lab-return-matrix PASS (110/110), check:lab-static-modules PASS (82/82), build PASS.
- **Recommended next phase**: Phase 3DG Market Page Fixture Chart Enhancement.

## Phase 3DF - 2026-06-26

### Lab Static Module Shells (Implemented)

- **Status**: implemented. Lab page rewritten as a static research hub shell — no live data, no API routes, no DB changes, no external HTTP.
- **Page structure**: improved h1 "리서치 Lab", 2×2 module grid (4 cards), static preview tables (S&P 500 섹터 + 자산군 수익률), roadmap/connection plan panel, data policy disclaimer.
- **Four research modules**: 국회의원 보유 주식 (정적 모듈 준비), 국민연금 보유 현황 (리서치 모듈), S&P 500 섹터 (예시 데이터), 자산군 수익률 (예시 데이터).
- **Fixture data**: new `src/data/labStaticModules.json` with modules array (4 entries), sectorSamples (5 rows: Technology/Healthcare/Financials/Industrials/Consumer Discretionary), assetSamples (5 rows: US Equities/Korean Equities/Bonds/Gold/USD-KRW). All values labeled "예시 비중" / "예시 수익률" / "정적 표시값" — no numeric values, no live claims.
- **Old route cards removed**: previous lab.astro linked to /lab/congress-stocks etc. (non-existent sub-pages). Replaced with self-contained static hub.
- **No JS required**: pure SSR with frontmatter JSON import. No client-side script, no fetch, no Supabase, no setInterval.
- **No backend changes**: no KIS/GNews/AI provider, no Supabase, no DB migration, no API routes, no deployment.
- **Focused validation**: check:lab-static-modules PASS (82/82), build PASS.
- **Recommended next phase**: Phase 3DG Market Page Fixture Chart Enhancement or Phase 3DG KIS + FX Preview Smoke Plan.

## Phase 3DE - 2026-06-26

### Chart AI UX Skeleton Enhancement (Implemented)

- **Status**: implemented. Full rewrite of `/chart-ai` page as a convincing local-only analysis workflow — no AI provider, no live data, no KIS/GNews/external HTTP, no API route changes, no DB changes.
- **Page structure**: improved page hierarchy (h1 "차트 분석 준비 화면"), analysis control panel (symbol input + 4 sample buttons + run button), chart snapshot placeholder (existing bar skeleton + "연동 전 화면" badge), 5 result analysis cards (추세 요약 / 모멘텀 / 변동성 / 지지·저항 / 리스크 체크), template/fallback states, investment disclaimer panel.
- **Fixture analysis data**: new `src/data/chartAiDemoAnalysis.json` with 4 demo symbols (005930 삼성전자, 035420 NAVER, AAPL Apple, NVDA NVIDIA). Every entry labelled `예시 데이터`; no live/realtime/KIS/AI claim; no buy/sell recommendation.
- **Interaction**: clicking sample buttons or typing a ticker + run immediately updates all result cards with fixture data. Known symbols without fixture → "분석 템플릿 준비 중". Unknown symbols → fallback state. No localStorage, no fetch, no server call.
- **Removed from previous version**: `analyzeChartAi` server call, `/api/chart-ai/analyze` reference, URL search-param pre-fill, usage-limit status panel.
- **securityLogos.json**: unchanged. KNOWN_SYMBOLS in script covers remaining registered symbols (MSFT, KO, TSLA, SPY, QQQ, etc.) for display name fallback.
- **Focused validation**: check:chart-ai-ux-skeleton PASS (82/82), build PASS.
- **Recommended next phase**: Phase 3DF Lab Static Module Shells or Phase 3DF Market Page Fixture Chart Enhancement.

## Phase 3CD - 2026-06-26

### MyPage MVP Completion (Implemented)

- **Status**: implemented. Targeted MyPage cleanup — removes unnecessary placeholder card at owner's request.
- **Removed**: `내 데이터` card (포트폴리오 and 관심 종목 rows, both `향후 제공 예정`). Owner judged this card unnecessary for the MVP; portfolio/interest features are better represented by actual feature pages and the notification section.
- **Preserved**: `내 계정` account card (email, login method, last access, subscription), login method resolver (identities/app_metadata, no hard-coded Google label), `알림 설정` notification section, `법적 고지 및 지원` legal links, `계정 관리` / 회원탈퇴 placeholder, master-only `운영 배너 관리` admin rail.
- **No backend changes**: no DB migration, no Supabase schema/storage, no API routes, no notification backend, no account deletion backend, no live KIS/GNews/external HTTP, no deployment.
- **Focused validation**: check:mypage-mvp PASS (79/79), check:mypage-shell PASS, check:password-reset-flow PASS, check:home-rail-banner-settings PASS, build PASS.
- **Recommended next phase**: Phase 3DE Chart AI UX Skeleton Enhancement or Phase 3DE Lab static module shells.

## Phase 3CC - 2026-06-26

### Security Metadata Coverage Expansion (Implemented)

- **Status**: implemented. Data-only expansion of local security metadata with no runtime changes, no live API calls, no DB changes, no deployment.
- **Coverage expanded**: `src/data/securityLogos.json` now covers 11 symbols (up from 2). Added 4 KR fixture valuation symbols (005930 삼성전자, 000660 SK하이닉스, 035420 NAVER, 069500 KODEX 200) and 7 US test symbols (AAPL Apple, KO Coca-Cola already existed, NVDA NVIDIA, MSFT Microsoft, TSLA Tesla, SPY SPDR S&P 500 ETF, QQQ Invesco QQQ).
- **Naming policy**: KR entries use local Korean display names; US entries use concise English names. These are local-only display metadata, not live KIS official data. KIS official names may override later.
- **Schema preserved**: existing `{ name, symbol, country, logoUrl? }` shape unchanged. No incompatible fields (market, type, assetType, provider) introduced.
- **Runtime unchanged**: `portfolio.astro` resolver, `chart-ai.astro`, all other runtime files untouched.
- **Focused validation**: check:security-metadata-coverage PASS, check:portfolio-ticker-display-name PASS, build PASS.
- **Recommended next phase**: Phase 3CD MyPage MVP Completion or Phase 3CD Chart AI UX Skeleton Enhancement.

## Phase 3CB-HF1 - 2026-06-26

### Global Page Spacing, Home Section Order, and MyPage Admin Rail Width Polish (Implemented)

- **Status**: implemented. Targeted UI polish hotfix after Phase 3CB owner review.
- **Global spacing**: `--page-gutter-x` changed from `clamp(24px, 4vw, 72px)` to `clamp(32px, 5vw, 96px)`. At 1440px desktop: +14px per side (72px vs 57.6px), giving 25% more horizontal breathing room. Minimum gutter raised from 24px to 32px on narrow viewports. Home rail banner dimensions (160px × 600px) unchanged.
- **Home section order**: moved `<HomeIndexCards />` from between the hero and feature-card grid to after the feature-card grid. New order: Hero → Feature Cards (grid-4) → MARKET SNAPSHOT → MARKET NEWS. Matches intended reading flow.
- **MyPage admin rail width**: widened from `420px` to `480px` in `mp-page-layout--admin-visible` grid. Breakpoint adjusted from `max-width: 1199px` to `max-width: 1299px` to safely accommodate the wider rail alongside the 680px account card column. On 1440px desktop: account = 680px (full), admin = 480px, both fit within 1296px site-main with 112px buffer. Below 1300px: single-column stack; account = 680px. Non-admin users: no change.
- **Checker updates**: added section ordering checks (grid-4 before HomeIndexCards, HomeIndexCards before HomeMarketNews), spacing variable checks (5vw, clamp(32px)), home rail dimension guards, HF1 result doc check; updated admin rail check from 420px to 480px.
- **No DB/schema/API/live/deployment changes**.
- **Focused validation**: check:home-index-cards PASS, check:home-rail-banner-settings PASS, check:home-ad-slots PASS, check:mypage-shell PASS, build PASS.

## Phase 3CB - 2026-06-25

### Home Index Cards Fixture Data (Implemented)

- **Status**: implemented. Adds a MARKET SNAPSHOT section to the Home page using local fixture/static data. No live data, no server load increase.
- **Home index cards**: 9 fixture cards added between the hero section and feature cards on the Home page: S&P 500, Nasdaq 100, Dow Jones, KOSPI, KOSDAQ, USD/KRW, Dollar Index, Gold, WTI Oil. Each card shows label, caption, sample value, direction-colored change %, and `예시 데이터` label. No realtime claim. No KIS/GNews/external HTTP.
- **Fixture data source**: new `src/data/homeIndexCards.json` with `asOfLabel: "예시 데이터"` and `note: "연동 전 표시값입니다"` on all entries. Direction classes (up/down/flat) drive color coding. Component (`HomeIndexCards.astro`) is purely SSR — no client-side fetch, no polling, no Supabase.
- **Server-load policy**: local JSON only. Zero additional API calls. Zero polling. Zero cron/timers. Values will be replaced by live KIS/FX data in a future integration phase.
- **MyPage admin rail width polish (carry-over from 3CA-HF3)**: admin rail widened from 340px to 420px with breakpoint adjusted to 1200px. `내 계정` card remains at full 680px on typical desktop (1440px+). Non-admin users see no change.
- **Home rail no-regression**: no sample banner flash regression. `HomeRailAd` still starts hidden and reveals only on active managed banners. No sample SVGs in SSR output.
- **Focused validation**: check:home-index-cards PASS, check:home-rail-banner-settings PASS, check:home-ad-slots PASS, check:mypage-shell PASS, build PASS.
- **Recommended next phase**: Phase 3CC Security Metadata Coverage Expansion (short safe pass) or Phase 3CC MyPage MVP Completion (visible account page progress).

## Phase 3CA-HF3 - 2026-06-25

### MyPage Admin Rail Placement and No Sample Banner Flash Hotfix (Implemented)

- **Status**: implemented. Owner browser review after Phase 3CA-HF2 found two blocking issues.
- **Owner review issues**: (1) `운영 배너 관리` card placed inside the same `mp-top-area` grid as `내 계정` (both sharing the 680px `mp-sections` max-width), which compressed the account card. (2) Sample Banner 01/02/03 SVG images flashed briefly before managed banner images loaded — real operation must never show sample banners.
- **MyPage layout fix**: Removed `mp-top-area` wrapper approach. Moved `운영 배너 관리` section outside `mp-sections` into a sibling `<aside class="mp-admin-rail">`. Wrapped the whole page in `<div class="mp-page-layout" id="mpPageLayout">`. Default: `display: block`, admin rail hidden via CSS. When master admin is confirmed by JS, `mp-page-layout--admin-visible` class is added: two-column grid (`minmax(0, 680px)` account + `340px` admin rail, `gap: 24px`) on screens ≥ 1100px; single-column stacked below 1100px. `내 계정` section restored to its pre-HF2 width (680px max). Non-admin users see no empty right column.
- **No sample banner flash fix**: Removed SSR rendering of `homeAdBanners.json` sample banners entirely from `HomeRailAd.astro`. Component now renders an empty track with `style="display:none"` and `data-managed-rail-pending` attribute. Client script loads managed banners from Supabase; reveals rail (via `style.display = ''`) only if active valid managed banners exist. If none: rail stays hidden — sample banners never shown. Carousel teardown logic preserved for SPA re-navigation. Active filter unchanged: `active && imageUrl.trim() && /^https?:\/\//i.test(imageUrl)`.
- **Accordion, preview, save, password-reset**: all preserved, no regression.
- **No DB/schema/API/live/deployment changes**.
- **Focused validation**: check:home-rail-banner-settings PASS, check:home-ad-slots PASS, check:mypage-shell PASS, check:password-reset-flow PASS, build PASS.

## Phase 3CA-HF2 - 2026-06-25

### MyPage Banner Admin UX and Active Slot Filtering Hotfix (Implemented)

- **Status**: implemented. Owner browser review of Phase 3CA found four issues requiring a targeted hotfix.
- **Owner review issues**: (1) `로그인 방식` showed `Google 로그인` even for email/password login; (2) `운영 배너 관리` appeared at bottom of MyPage instead of to the right of `내 계정`; (3) Banner admin panel was too tall with no way to collapse; (4) Inactive/empty banner slots produced blank white rotation in the Home right rail.
- **Login method fix**: Removed hardcoded `Google 로그인` from HTML. Now resolved dynamically in JS from `user.identities` array (most reliable) with `user.app_metadata.provider` fallback. Shows `이메일 로그인`, `Google 로그인`, `이메일 + Google`, or `확인 불가`. No email domain inference. No raw user data in UI.
- **Layout fix**: Wrapped `내 계정` section and `운영 배너 관리` section in a `<div class="mp-top-area">`. Default `display: contents` (transparent for non-admins). When master admin panel is revealed, JS adds `mp-top-area--active` class: `1fr` column on mobile, `1fr 340px` side-by-side on desktop (≥ 1024px).
- **Accordion**: Added `mp-banner-accordion-header` with title, active-banner count summary (`활성 배너 N개`), and `펼치기`/`접기` toggle button with `aria-expanded` and `aria-controls`. Body defaults `hidden`. Opens automatically on save error.
- **Active slot filtering**: Root cause was SSR carousel initialized with 3 static banners before `loadManagedBanners` ran async. Old interval kept translating track with stale DOM references, hiding single managed banner off-screen. Fix: `setupRailCarousel` stores interval on `rail._railIntervalId`; `loadManagedBanners` cancels old interval, resets `data-ready` and transform, replaces content with only `active && imageUrl.trim() && /^https?:\/\//i.test(url)` filtered banners, then re-initializes carousel only if >= 2 active. Static fallback preserved when no active valid banners. No blank slots possible.
- **No DB/schema/API/live/deployment changes**.
- **Focused validation**: check:home-rail-banner-settings PASS, check:home-ad-slots PASS, check:mypage-shell PASS, check:password-reset-flow PASS, build PASS.

## Phase 3CA-HF1 - 2026-06-25

### Password Reset Flow Hotfix (Implemented)

- **Status**: implemented. Urgent hotfix. Runtime UI change: AuthModal + new `/reset-password` page + CSS. No API route changes. No DB/Supabase schema changes. No migration. No live KIS/GNews. No external HTTP. No deployment.
- **Urgency**: master banner admin account (`kkamagi707@naver.com`) password forgotten. Password reset needed before Home rail banner admin panel (Phase 3CA) could be tested.
- **Login UI**: added `비밀번호를 잊으셨나요?` button to login form (hidden in signup mode). Clicking opens a reset panel inside the existing auth modal. Pre-fills email from login form. Back button returns to login mode.
- **Reset email request**: calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`. Always shows generic success message regardless of whether email exists (prevents email enumeration). Configuration error shows safe generic failure message.
- **`/reset-password` page**: new `src/pages/reset-password.astro`. 4-state UI: checking → invalid/expired | form | success. Detects `PASSWORD_RECOVERY` event via `supabase.auth.onAuthStateChange`; shows invalid state after 2.5-second timeout if no recovery event. Password form validates length ≥ 8 and confirmation match before calling `supabase.auth.updateUser({ password })`. Signs out after success. No service_role. No admin API. No raw errors in UI.
- **Redirect URL prerequisites**: owner has already added `http://localhost:4321/reset-password` and `https://mkstocklab.vercel.app/reset-password` to Supabase Auth. Preview domain redirect URLs may need separate entries.
- **Focused validation**: check:password-reset-flow 55/55 PASS, check:header-footer-shell PASS, build PASS.
- **Manual owner checklist**: open login → click reset link → enter email → check inbox → click email link → enter new password → log in with new password → confirm 운영 배너 관리 panel visible.

## Phase 3CA - 2026-06-25

### Home Rail Banner URL Settings MVP (Implemented)

- **Status**: implemented. Runtime change: HomeRailAd.astro (managed banner loader), mypage.astro (admin panel), siteSettingsClient.ts (new library), style.css (banner admin CSS). New Supabase migration (owner-applied). No live KIS/GNews. No image upload. No click tracking. No polling. No deployment.
- **Purpose**: urgent advertising inquiry arrived. Owner needs to quickly test custom banner URLs in the Home right-side rail without a separate admin page. MVP scope: URL-first banner configuration via MyPage, Supabase-backed settings, static JSON fallback.
- **Migration**: `supabase/migrations/20260625_site_admins_and_settings.sql` — creates `site_admins` (master role, user_id PK), `site_settings` (key/value JSONB), `is_site_admin()` security-definer function. RLS: public may read `home_rail_banners`; only master admins may write. Owner inserts own `user_id` manually to gain access.
- **siteSettingsClient.ts** (new): `HomeRailBanner` type (`slot: 1|2|3`, `imageUrl`, `linkUrl`, `alt`, `active`). `getHomeRailBanners()`, `saveHomeRailBanners()`, `isCurrentUserSiteAdmin()`. URL validation blocks `javascript:`, `data:`, `file:`, requires `http/https`. Alt max 120 chars. No setInterval, no polling, no raw fetch.
- **HomeRailAd.astro**: added client script that reads managed banners from Supabase on page load. If active configured banners exist (with imageUrl set), replaces the static sample rail content. Static sample banners remain as SSR fallback. Managed banner links use `target="_blank" rel="noopener noreferrer"`. No new setInterval. No click tracking.
- **mypage.astro**: added Section G `운영 배너 관리` panel — hidden by default, revealed only for master admins after `isCurrentUserSiteAdmin()` check. Three banner slots with imageUrl/linkUrl/alt/active inputs. 저장 (validate + save) and 다시 불러오기 (reload from DB) buttons. Live image preview on URL input. Korean error messages on validation failure. No file upload, no setInterval.
- **Safety**: no raw `fetch()` in component files; no `@supabase` direct imports in mypage; no `auth.signOut/updateUser/signUp`; no `console.log/error`; no `localStorage/sessionStorage`; no KIS/GNews; no Supabase Storage.
- **Focused validation**: check:home-rail-banner-settings PASS, check:home-ad-slots PASS, check:mypage-shell PASS, build PASS.

## Phase 3BZ - 2026-06-25

### Fast Roadmap Reprioritization and Lightweight Execution Plan (Planned / Execution-Ready)

- **Status**: planned / execution-ready. Planning-only phase. No runtime UI changes. No API route changes. No DB/Supabase changes. No live KIS/GNews. No external HTTP. No Vercel Preview. No deployment.
- **Purpose**: reprioritize the remaining roadmap for speed, low server load, and focused validation after Phase 3BY-HF1 completed the portfolio fixture valuation UX cycle.
- **Server-load policy defined**: no polling, no cron, no background refresh, no repeated live checks, no full historical smoke suite by default, no live provider call unless explicitly enabled, prefer static/fixture-first.
- **Focused validation policy defined**: each phase category (planning, Portfolio UI, Home, Chart AI, Market, Lab, MyPage, KIS/FX planning/smoke, API/server, deployment) has its own bounded checker scope. Running all historical checks for a phase that touches only one domain is explicitly prohibited.
- **Reprioritized roadmap phases**:
  - **3CA** — Security Metadata Coverage Expansion (local JSON, no code change)
  - **3CB** — Home Index Cards Fixture Data
  - **3CC** — MyPage MVP Completion
  - **3CD** — Chart AI UX Skeleton Enhancement
  - **3CE** — Lab Menu Static Module Shells (congress stocks, NPS, S&P 500 sectors, asset-class returns)
  - **3CF** — Market Page Fixture Chart Enhancement
  - **3CG** — Server-side Portfolio Tab Order Preference Plan (planning)
  - **3CH** — KIS + FX Preview Smoke Plan (planning)
  - **3CI** — KIS + FX Preview Smoke Execution (owner-run, controlled)
  - **3CJ** — Live Quote Contract (source=live, no UI default enablement)
  - **3CK** — FX Conversion Contract
  - **3CL** — Lightweight Quote Cache Design
  - **3CM** — Cached/Live Portfolio Valuation UI Mode
  - **3CN–3CS** — Dividends, Chart AI engine, Market live charts, Lab data, Production QA
- **Owner preparation checklist included**: KIS credentials, FX source decision, Vercel Preview env readiness, Supabase schema approval, Home card priorities, Chart AI output format, Lab module priority, dividend decision.
- **KIS/FX policy confirmed**: KR + US in scope; FX included; source=live first; source=auto deferred; live failure = unavailable/stale-safe (not fixture fallback); Vercel Preview smoke in Phase 3CI only; prefer "조회 시점 기준" / "최근 조회 기준" wording over "실시간".
- **Focused validation**: check:project-lightweight-roadmap 27/27 PASS. Build skipped (planning-only phase, no runtime files touched — build state unchanged from 239c738).
- **Recommended next phase**: Phase 3CA (Security Metadata Coverage Expansion — short, data-only) then Phase 3CB (Home Index Cards Fixture Data).

## Phase 3BY-HF1 - 2026-06-25

### Portfolio Ticker Display Name Resolver Hotfix (Implemented)

- **Status**: implemented. Runtime UI change: portfolio.astro display-name resolution only. No API route changes. No DB/Supabase changes. No live KIS/GNews. No external HTTP. No deployment.
- **Owner review finding**: Phase 3BY visual review found that entering known KR ticker codes (005930, etc.) displayed the raw ticker as the primary label instead of the company/ETF name. Secondary label showed `티커 직접 입력` even for tickers with local metadata.
- **Fix**: added `resolveSecurityMetadata` and `resolveDisplayNameForSymbol` helpers in portfolio.astro using the already-imported `securityLogoMap` from `securityLogos.json`. No external API, no server call, no async lookup.
- **toPositionIdentity updated**: known ticker input now resolves `name = mapped.name` and `symbol = mapped.symbol || symbol` at creation time.
- **getPositionPrimaryLabel updated**: falls back to local metadata lookup for existing saved rows with empty name — no DB migration required.
- **getPositionSecondaryLabel updated**: shows `position.symbol` as secondary when mapping exists; preserves `티커 직접 입력` for unknown tickers.
- **getChartAiHref unchanged**: already uses `getPositionPrimaryLabel` which now returns resolved name automatically.
- **Coverage**: limited to entries in `securityLogos.json` (currently 2 entries: 005930/Samsung Electronics, KO/Coca-Cola). Expanding coverage requires only adding JSON entries.
- **Focused validation**: check:portfolio-ticker-display-name 63/63 PASS, check:portfolio-owner-review-prep 50/50 PASS, check:portfolio-ui-valuation-fixture 71/71 PASS, check:portfolio-tab-order-persistence 61/61 PASS, check:portfolio-valuation-api 124/124 PASS, build PASS.
- **Next phase**: Phase 3BZ — Fast Roadmap Reprioritization and Lightweight Execution Plan (if owner review passes).

## Phase 3BY - 2026-06-25

### Portfolio UI Valuation Owner Browser Review Prep (Review-ready)

- **Status**: review-ready. No runtime UI changes. No API route changes. No DB/Supabase changes. No live KIS/GNews calls. No external HTTP. No Vercel Preview call. No deployment.
- **Objective**: Prepare owner browser review for the Phase 3BX fixture valuation UI mapping without adding new implementation. Confirm no unintended drift occurred. Provide focused automated validation and owner manual visual checklist.
- **Runtime changes**: none — all artifacts are checker, result doc, and changelog only.
- **New checker**: `scripts/check_portfolio_owner_review_prep_static_contract.mjs` — 44/44 PASS. No-network static validator covering 3BX fixture mapping integrity, 3BW-HF1 tab persistence, safety boundaries, live provider isolation, environment isolation.
- **Focused validation set** (intentional scope — not full historical suite):
  - `check:portfolio-owner-review-prep` 44/44 PASS
  - `check:portfolio-ui-valuation-fixture` 71/71 PASS
  - `check:portfolio-tab-order-persistence` 61/61 PASS
  - `check:portfolio-bookmark-tabs` 121/121 PASS
  - `check:portfolio-holdings-header` 90/90 PASS
  - `check:portfolio-valuation-api` 124/124 PASS
  - `npm run build` PASS
  - `git diff --check` clean
- **Broad smoke tests intentionally skipped**: GNews live/dry-run, KIS live/dry-run, Home/Chart AI/Lab/MyPage suite — Phase 3BY touches none of those domains. Skipping preserves project speed on basic server plan.
- **Server-load policy**: no polling, no setInterval, no cron, no repeated smoke checks, no live API, no background refresh, no Vercel Preview call, no deployment.
- **Boundary confirmed**: 3BX fixture UI mapping preserved, 3BW fixture route preserved, 3BW-HF1 tab persistence preserved, no live KIS/GNews, no external HTTP, no DB/migration/Supabase schema, no Home/Chart AI/Lab/MyPage scope, no /news page.
- **Owner browser review**: pending — owner must visually confirm fixture valuation display (현재가/평가금/수익률/수익금 for symbols 005930/000660/035420/069500), 연동 예정 fallback for unsupported symbols, 데이터 대기 for dividend columns, sort by valuation/return/profit, fixture disclosure copy, and tab order persistence.
- **Recommended next phases**:
  1. Phase 3BZ — Fast Roadmap Reprioritization and Lightweight Execution Plan (if owner review passes)
  2. Phase 3CA — Server-side Portfolio Tab Order Preference (lightweight Supabase column)
  3. Phase 3CB — KIS/FX Preview Smoke Planning with minimized check scope

## Phase 3BX - 2026-06-25

### Portfolio UI Valuation Mapping with Fixture API (Implemented)

- **Status**: implemented. No live KIS/GNews calls, no external HTTP, no API route added, no DB/Supabase schema changes, no deployment. Runtime UI change: portfolio.astro wired to POST /api/portfolio/valuation.
- **Objective**: Wire the Portfolio holdings table to the fixture-only valuation route added in Phase 3BW so that KR fixture symbols show currentPrice, marketValue, unrealizedPnl, unrealizedPnlPct. US positions and unknown symbols remain 연동 예정. Dividend columns remain 데이터 대기.
- **New AppState fields**: `positionValuations: Record<string, PositionValuation>`, `valuationStatus: ValuationStatus`, `valuationMessage: string | null`.
- **New types**: `ValuationStatus` union, `PositionValuation` interface.
- **New helpers**: `getPositionValuation(position)` — lookup by `position.id` or `market:symbol`; `loadValuation(portfolioId, positions)` — posts to `/api/portfolio/valuation` with `source: fixture`, maps response rows into state.
- **Column changes**: 현재가, 평가금, 수익률, 수익금 cells now show fixture values when available; fall back to 연동 예정 for null results. 배당률/예상 연배당금/배당주기 remain 데이터 대기 (unchanged).
- **Sort update**: `getPositionSortValue` now handles 'valuation' (marketValue), 'return' (unrealizedPnlPct), 'profit' (unrealizedPnl) kinds using `getPositionValuation`.
- **Render flow**: `loadPositions` renders positions immediately (연동 예정 for valuation fields), then awaits `loadValuation` which re-renders once fixture response arrives.
- **Fixture disclosure**: `#valuation-status-copy` paragraph element shows loading/error/fixture disclosure copy. Fixture copy: "Fixture 기준 평가값입니다. 실시간 시세가 아닙니다."
- **Key strategy**: pass `id` field with each position so route returns `positionId = position.id`; aggregate positions use synthetic `aggregate-KR--005930` IDs (same ID used as lookup key).
- **Tab order persistence preserved**: 3BW-HF1 localStorage logic unchanged; no new localStorage keys added.
- Created `scripts/check_portfolio_ui_valuation_fixture_mapping_static_contract.mjs` — new no-network checker.
- Updated `scripts/check_portfolio_holdings_category_header_static_contract.mjs` — fixed two stale Group 8 checks (실시간 and currentPrice) to allow fixture mapping.
- Updated `scripts/check_portfolio_valuation_api_route_fixture_contract.mjs` — added Group 14 for 3BX artifact checks.
- Updated `scripts/check_portfolio_tab_order_persistence_static_contract.mjs` — added Group 16 no-regression checks.
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — Phase 3BX artifact group added.
- Created `docs/planning/phase_3bx_portfolio_ui_valuation_mapping_fixture_result_v0.1.md`.
- Added `check:portfolio-ui-valuation-fixture` to `package.json`.
- All validators pass. Build passes.
- **Recommended next phase**: Phase 3BY — Owner Browser Review.

## Phase 3BW-HF1 - 2026-06-25

### Portfolio Bookmark Tab Order Local Persistence Hotfix (Implemented)

- **Status**: implemented. No live KIS/GNews calls, no external HTTP, no API route added, no DB/Supabase schema changes, no deployment. Runtime UI change only: portfolio.astro localStorage tab order persistence.
- **Problem**: Phase 3BN implemented client-memory-only tab order (no persistence). After Phase 3BW, owner browser review found that left/right tab movement implied save behavior but order reset on page refresh or navigation — a critical UX regression.
- **Fix**: Persist user portfolio tab IDs to `localStorage` under key `mk-stock-lab:portfolio-tab-order:v1` after each left/right reorder click. Restore and reconcile saved order when portfolios load.
- **Storage**: portfolio IDs only — no names, positions, prices, quantities, memo, valuation data, API responses, tokens, or secrets.
- **Read/restore timing**: `loadPortfolios()` reads from localStorage on every call; uses saved order as base for reconciliation.
- **Write timing**: `saveTabOrderToStorage` called immediately after reorder swap, and after reconciliation in `loadPortfolios`.
- **Reconciliation**: removes IDs no longer in portfolio list; appends newly created portfolios at end; preserves saved order for existing IDs.
- **Create**: new portfolio appended at end of user tabs via `loadPortfolios` reconciliation after `createPortfolio`.
- **Delete**: deleted ID filtered out of saved order via `loadPortfolios` reconciliation after `deletePortfolio`.
- **Edit/rename**: does not affect IDs; order preserved automatically.
- **Pinned tabs**: aggregate tab `전체` always first (never in portfolioOrder); `+추가` always last (separate button, never in portfolioOrder).
- **Error handling**: all localStorage ops wrapped in try/catch; invalid JSON → `removeItem` + empty array fallback; quota/security error → fail silently, in-memory order preserved.
- **No server persistence**: browser-local only; no Supabase orderIndex; no DB schema; no backend API route.
- Created `scripts/check_portfolio_tab_order_persistence_static_contract.mjs` — new no-network checker.
- Updated `scripts/check_portfolio_bookmark_tabs_static_contract.mjs` — replaced stale 3BN "no localStorage" check with controlled-key expectation; added Group 15 persistence checks.
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — Phase 3BW-HF1 artifact group added.
- Created `docs/planning/phase_3bw_hf1_portfolio_bookmark_tab_order_local_persistence_result_v0.1.md`.
- Added `check:portfolio-tab-order-persistence` to `package.json`.
- All validators pass. Build passes.
- **Recommended next phase**: Phase 3BX — Portfolio UI Valuation Mapping with Fixture API Data.

## Phase 3BW - 2026-06-25

### Portfolio Valuation API Route with Fixture/Mocked Quotes (Implemented)

- **Status**: implemented. No live KIS/GNews calls, no external HTTP, no API route consuming live data, no DB/Supabase, no UI runtime changes, no deployment.
- **New route**: `POST /api/portfolio/valuation` — fixture-only valuation API. Source defaults to `fixture`; any other source (`live`, `auto`) returns HTTP 400 `UNSUPPORTED_SOURCE`. GET returns 405.
- **Route uses `buildPortfolioValuationFromQuotes`**: server helper from Phase 3BV computes costBasis, currentPrice, marketValue, unrealizedPnl, unrealizedPnlPct per position; aggregate totalMarketValue/totalUnrealizedPnl when all positions have quotes and share baseCurrency.
- **Synthetic fixture resolver**: `src/lib/server/portfolioValuationFixture.ts` — 4 synthetic KR quote entries (005930, 000660, 035420, 069500). Calls `assertServerRuntime`. No fetch, no env reads, no live KIS import. 035420 is intentionally `stale-but-usable` to test fallback state propagation.
- **Request validation**: portfolioId, baseCurrency, positions array (capped at 100), per-position symbol/market/assetType/buyPrice/quantity/currency; all bad inputs → HTTP 400 `VALIDATION_FAILED`.
- **Public safety**: providerMeta absent from all responses; rawProviderStored: false; liveAttempted: false; no stck_prpr/rt_cd/prdy_vrss/access_token/appkey; sanitized INTERNAL_ERROR (message: "Portfolio valuation failed safely."); no stack traces.
- **Missing quote behavior**: symbol absent from fixture → null quote; costBasis still computed; currentPrice/marketValue/unrealizedPnl/unrealizedPnlPct all null; staleState unavailable.
- **Mixed-currency policy**: KRW + USD positions → totalMarketValue null (FX not implemented, no fabrication). US positions receive null quotes (no US fixture); appear in missingQuoteSymbols and unsupportedSymbols.
- Created `scripts/check_portfolio_valuation_api_route_fixture_contract.mjs` — no-network checker (Groups 1-13, file/static/behavioral/safety checks).
- Updated `scripts/check_kis_quote_adapter_mocked_contract.mjs` — Phase 3BW artifact checks added.
- Updated `scripts/check_kis_valuation_pre_design_static_contract.mjs` — Phase 3BW artifact checks added.
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — Phase 3BW artifact checks added.
- Created `docs/planning/phase_3bw_portfolio_valuation_api_route_fixture_result_v0.1.md`.
- Added `check:portfolio-valuation-api` to `package.json`.
- All validators pass. Build passes.
- **Portfolio UI not yet connected**: `portfolio.astro` still calls `buildPortfolioValuationReadiness` (placeholder path). Phase 3BX will wire it.
- **Recommended next phase**: Phase 3BX — Portfolio UI Valuation Mapping with Fixture API Data.

## Phase 3BV - 2026-06-25

### KIS Quote Adapter Contract & Mocked Provider Tests (Implemented)

- **Status**: implemented. No live KIS/GNews calls, no external HTTP, no API routes, no DB/Supabase, no UI runtime changes, no deployment changes. All changes are server-side valuation helpers + no-network checkers + docs.
- **portfolioValuation.ts extended**: added `buildPositionValuationFromQuote` (internal helper) and `buildPortfolioValuationFromQuotes` (exported function). Both compute costBasis/currentPrice/marketValue/unrealizedPnl/unrealizedPnlPct from stored position data + mocked `QuoteSnapshot` input. `providerMeta` intentionally excluded from `PortfolioValuationRow` output. `QuoteSnapshot` type now imported.
- **No-network valuation computation tested**: synthetic position (buyPrice 60000, qty 10) + synthetic quote (price 75000) → costBasis 600000, marketValue 750000, unrealizedPnl 150000, returnRate 25. Null quote → all computed fields null, costBasis still available.
- **Edge cases covered**: zero costBasis (no div-by-zero, unrealizedPnlPct null), break-even price (returns 0), loss scenario (negative unrealizedPnl/rate).
- **Unsupported market / unavailable quote**: US market position + null quote → all computed fields null, staleState unavailable. costBasis always available.
- **Provider error codes**: SYMBOL_UNSUPPORTED, PROVIDER_UNAVAILABLE, CONFIG_MISSING, INTERNAL_ERROR all mapped to controlled ProviderErrorCode. No raw KIS fields, no stack trace in error envelopes.
- **Public safety verified**: providerMeta absent from PortfolioValuationRow. No stck_prpr/prdy_vrss/rt_cd/access_token/appkey in valuation output. rawProviderStored never true. Forbidden output scan passes.
- **Aggregate valuation**: same-currency all-quoted → totalMarketValue/totalUnrealizedPnl computed. Partial coverage → totalMarketValue null, quoteCoverage partial. No quotes → quoteCoverage unavailable.
- **Mixed-currency policy enforced**: KRW + USD positions in same portfolio → totalMarketValue null (FX deferred, no fabrication). totalCostBasis always computed.
- **Quote freshness**: staleState propagated from QuoteSnapshot to row. Portfolio staleState fresh when all rows fresh; stale-but-usable when any stale; unavailable when no quotes.
- **check_kis_error_fallback_paths.mjs extended**: added Group G (8 valuation-computation fallback path tests) covering null-quote, successful-quote metrics, zero-costBasis guard, break-even, providerMeta absence.
- Created `scripts/check_kis_quote_adapter_mocked_contract.mjs` — 80-check no-network mocked contract checker.
- Created `docs/planning/phase_3bv_kis_quote_adapter_contract_mocked_tests_result_v0.1.md`.
- Updated `scripts/check_kis_valuation_pre_design_static_contract.mjs` — Phase 3BV artifact checks added.
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — Phase 3BV artifact group added.
- Added `check:kis-quote-adapter-mocked` to `package.json`.
- All validators pass. Build passes.
- **Recommended next phase**: Phase 3BW — Portfolio Valuation API Route with Fixture/Mocked Quotes.

## Phase 3BU - 2026-06-25

### KIS Valuation Integration Pre-Design & Data Contract (Planned / documentation-only)

- **Status**: planned / documentation-only. No runtime, API route, DB, Supabase schema, KIS live call, GNews live call, or deployment changes. All deliverables are planning docs, a schema contract doc, a static checker, and a package script.
- **Valuation data contracts defined**: `QuoteInput`, `QuoteSnapshot`, `PositionValuation`, `PortfolioValuationSummary`, `QuoteFreshnessState`, `ValuationErrorCode`, `CurrencyDisplayMode`, `ValuationSource`, `ValuationCoverage`. TypeScript-style interfaces in `docs/schemas/portfolio_valuation_state_contract_v0.1.md`.
- **Existing skeleton documented**: `portfolioValuation.ts` already has `buildPortfolioValuationReadiness` returning placeholder rows with `currentPrice: null`. Schema doc maps from this existing type to the richer public-form `QuoteSnapshot`.
- **UI column mapping defined**: 현재가 → `currentPrice`, 평가금 → `marketValue`, 수익률 → `returnRate`, 수익금 → `unrealizedProfit`. Fallback = 연동 예정. Dividend columns remain 데이터 대기 (deferred).
- **비중 policy**: Cost-basis weight remains default. Market-value weight becomes active only when `quoteCoverage === 'all'` and FX is resolved.
- **Server-only KIS provider boundary documented**: `assertServerRuntime` on all public functions. `sanitizeUnknownError` on all provider catch blocks. Raw KIS fields must never appear in public API response. `rawProviderStored: false` invariant in every `QuoteSnapshot`.
- **FX policy defined**: Do not mix KRW and USD values without FX conversion. If FX unavailable, show local per-currency values; never fabricate exchange rates. FX provider deferred.
- **Cache strategy proposed**: Provider+market+symbol+assetType+quoteDateBucket cache key. TTL: 30-60s fresh (market open), 2-5m stale-but-usable, market-closed = previous close. Backend decision deferred.
- **Refresh button future behavior defined**: Three modes: local recalculation, cached quote refresh, live provider refresh. Label must reflect actual behavior; do not use "실시간" until live data is confirmed.
- **Error and freshness policy defined**: 11-value `QuoteFreshnessState` enum with Korean UI copy for each. Per-position unavailable preferred over full-portfolio failure.
- **Security checklist**: credentials, response sanitization, runtime guard, static checker coverage, owner approval gate all documented.
- **Sorting policy**: Null values always sort to bottom. Never assign synthetic 0 for unknown metrics.
- **Open decisions listed**: KIS scope, KR vs. KR+US, refresh policy, Supabase cache approval, TTL, FX inclusion, aggregate scope, unsupported ticker UX.
- Created `docs/planning/phase_3bu_kis_valuation_integration_pre_design_v0.1.md`.
- Created `docs/schemas/portfolio_valuation_state_contract_v0.1.md`.
- Created `scripts/check_kis_valuation_pre_design_static_contract.mjs`.
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — Phase 3BU artifact group added.
- Added `check:kis-valuation-design` to `package.json`.
- No live KIS/GNews, no external HTTP, no Supabase writes, no DB migrations, no API routes, no deployment, no /news page.
- **Recommended next phase**: Phase 3BV — KIS Quote Adapter Contract & Mocked Provider Tests.

## Phase 3BS - 2026-06-25

### Home Portfolio Card & Portfolio Create Sheet Owner Fixes (Implemented)

- **Status**: implemented. Home MY PORTFOLIO card visual hierarchy updated; inline portfolio registration box replaced with bottom slide sheet. `HomePortfolioPanel.astro`, `portfolio.astro`, and `style.css` updated. No API routes, Supabase schema, DB migrations, KIS/GNews live calls, or deployment changes.
- **Donut chart enlarged**: `.hpp-donut` width/height changed from `76px` to `120px`. Donut-hole inset updated from `19px` to `30px` to maintain proportions.
- **Donut chart moved higher**: `.hpp-donut-section` top margin reduced from `12px` to `4px`. Old `.hpp-summary` stat row block (which appeared above the donut) removed entirely.
- **"포트폴리오 / N개" meta moved to top-right**: New `.hpp-card-header { display: flex; justify-content: space-between }` wraps eyebrow+title (left) and `.hpp-card-meta` (right). Meta label = "포트폴리오", meta value = "N개". Not "N개 계좌".
- **Allocation basis copy preserved**: "등록 금액 기준 계좌 비중" retained. Cost-basis formula `buyPrice × quantity` unchanged. No live valuation claim.
- **Anti-flicker state preserved**: `#hpp-resolving` with `data-hpp-default="true"` remains SSR-visible default. `signed_out` remains hidden at SSR time.
- **Old inline portfolio registration box removed**: `<div class="portfolio-manage-panel hidden">` and its inner `.portfolio-manage-inner.panel` block removed from normal page flow entirely.
- **+추가 now opens portfolio sheet**: New `portfolio-sheet` dialog (role=dialog, aria-modal=true) replaces the inline panel. Mirrors `position-sheet` structure and animation.
- **Portfolio sheet UX**: close via X button, backdrop click, or ESC key. Focus moves to name input on open. `aria-hidden` and `aria-expanded` managed. Slide-from-bottom transition (260ms cubic-bezier).
- **Form fields preserved**: `portfolio-form`, `portfolio-id`, `portfolio-name`, `portfolio-base-currency`, `portfolio-submit`, `portfolio-cancel-edit` IDs unchanged. One form in DOM.
- **Auto-open on empty state removed**: Previously `openManagePanel()` was called automatically when no portfolios existed. Sheet auto-open removed — user clicks `+추가` explicitly.
- **Edit mode supported**: Floating tab toolbar "수정" action populates form, sets submit label to "포트폴리오 수정", opens sheet. Sheet title updates to "포트폴리오 수정".
- Created `scripts/check_portfolio_create_sheet_static_contract.mjs` — 79-check static checker.
- Updated `scripts/check_home_portfolio_panel_static_contract.mjs` — added Phase 3BS group (18 checks → 102 total).
- Updated `scripts/check_portfolio_bookmark_tabs_static_contract.mjs` — updated add tab target to portfolio-sheet.
- Updated `scripts/check_portfolio_layout_refactor_static_contract.mjs` — updated stale portfolio-manage-panel references.
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — Phase 3BS artifact group added.
- Created `docs/planning/phase_3bs_home_portfolio_card_create_sheet_owner_fixes_result_v0.1.md`.
- All validators pass. Build passes.
- No live KIS, GNews, Supabase writes, deployment, DB migrations, or /news page.
- **Recommended next phase**: Phase 3BT — Portfolio Owner Browser Review Round 3.

## Phase 3BR - 2026-06-25

### Portfolio Holdings Category Header & Sort UX (Implemented)

- **Status**: implemented. Holdings "정렬" sort toolbar replaced by "카테고리" column header. `src/pages/portfolio.astro` and `src/styles/style.css` updated. No API routes, Supabase schema, deployment, Home, or GNews changes.
- **Old toolbar removed**: `.positions-toolbar` HTML block (eyebrow "정렬", explanatory text, 4-button `.sort-controls` div) removed entirely.
- **Category header added**: `.positions-category-header` with eyebrow "카테고리" and `.positions-category-grid` — 13-cell row (avatar spacer, 11 data columns, actions spacer).
- **Category labels in order**: 종목 · 비중 · 수량 · 평단가 · 현재가 · 평가금 · 수익률 · 수익금 · 배당률 · 예상 연배당금 · 배당주기.
- **Sortable columns**: 비중, 평가금, 수익률, 수익금, 배당률, 예상 연배당금 — each has ▲▼ `.sort-arrow-button` elements with `aria-label` in a `.sort-arrow-stack`.
- **New sort keys**: `weight-desc/asc`, `valuation-desc/asc`, `return-desc/asc`, `profit-desc/asc`, `dividend-yield-desc/asc`, `annual-dividend-desc/asc`. `getSortedPositions` updated to use `lastIndexOf('-')` for compound key parsing.
- **Weight computation**: "비중" uses `buyPrice × quantity / totalCostBasis × 100` — cost-basis weight from stored purchase data, not live market valuation. Label is non-misleading.
- **Unavailable values**: 현재가, 평가금, 수익률, 수익금 show "연동 예정"; 배당률, 예상 연배당금, 배당주기 show "데이터 대기". No fabricated values.
- **Position card expanded**: from 8 columns (`avatar + identity + 5 metrics + actions`) to 13 columns (`avatar + identity + 10 metrics + actions`). Row metric labels removed (header provides them).
- **Responsive layout**: `.positions-list-wrap { overflow-x: auto }` — both header and cards scroll together. `min-width: 960px` on category grid, list, and position cards. Old 4-column mobile grid collapse removed.
- Created `scripts/check_portfolio_holdings_category_header_static_contract.mjs` — 90-check static checker.
- Updated `scripts/check_portfolio_bookmark_tabs_static_contract.mjs` — tightened drag-drop import check to not false-fail on `positions-category-cell--sortable`.
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — Phase 3BR artifact group appended.
- Created `docs/planning/phase_3br_portfolio_holdings_category_header_sort_ux_result_v0.1.md`.
- All validators pass. Build passes.
- No live KIS, GNews, Supabase writes, deployment, or /news page.
- **Recommended next phase**: Phase 3BS — Portfolio Owner Browser Review Round 2.

## Phase 3BQ - 2026-06-25

### Portfolio Bookmark Tabs Owner Review Fixes (Implemented)

- **Status**: implemented. Seven owner-review fixes applied to `src/pages/portfolio.astro` and `src/styles/style.css`. No API routes, Supabase schema, deployment, or `HomePortfolioPanel.astro` changes.
- **Refresh button inline with h1**: `.portfolio-title-row` changed from `display: flex; justify-content: space-between` to a plain block. Added `.portfolio-h1-row { display: flex; align-items: center; gap: 8px }` wrapping `<h1>` and the refresh `<button>` together. Refresh icon now appears immediately right of the heading.
- **Aggregate tab label shortened**: `aggregateTab.textContent` changed from `'전체 포트폴리오'` to `'전체'`. Detail panel title unchanged.
- **Floating mini toolbar for edit/delete**: `.portfolio-tab-item` changed to `flex-direction: column`. New `.portfolio-tab-floating-actions` span (height: 24px, opacity: 0 by default) sits above new `.portfolio-tab-main` span. Toolbar revealed on hover/focus-within via CSS; no horizontal space reserved when hidden.
- **Vertical scrollbar removed**: `.portfolio-bookmark-tabs { overflow-y: visible }` changed to `overflow-y: hidden`. Root cause: browsers normalize `overflow-x: auto` + `overflow-y: visible` to both `auto`.
- **Tab list bottom alignment**: `.portfolio-tab-list { align-items: flex-end }` — aggregate and add tabs (single row) align to the bottom of user tab items (two rows with floating toolbar).
- **Inline `+ 추가` tab**: Static `<button id="portfolio-manage-toggle">` removed from HTML. `renderPortfolios()` now creates `addBtn` as the last child of `#portfolio-list` with `id="portfolio-manage-toggle"` and `data-action="toggle-manage-panel"`. `.portfolio-bookmark-tab--add` strips `margin-left: auto` and `border-left`.
- **Click delegation updated**: `toggle-manage-panel` case added at the top of `#portfolio-list` click delegation (before `if (!id) return`). Dead standalone `portfolio-manage-toggle` event listener removed.
- Updated `scripts/check_portfolio_bookmark_tabs_static_contract.mjs` — Group 3 and 4 updated for new label and JS-rendered add tab; Group 14 added (18 Phase 3BQ checks); total 105 checks.
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — Phase 3BQ artifact group appended.
- Created `docs/planning/phase_3bq_portfolio_bookmark_tabs_owner_review_fixes_result_v0.1.md` — result doc.
- All validators passed. Build passed.
- No live KIS, GNews, Supabase writes, deployment, or /news page.

## Phase 3BP - 2026-06-25

### Home Portfolio Panel Owner Review Fixes (Implemented)

- **Status**: implemented. Three owner-review fixes applied to `HomePortfolioPanel.astro` and `style.css`. No portfolio page, API route, Supabase schema, or deployment changes.
- **CTA vertical centering fix**: `.hpp-cta` changed from `display: block; text-align: center` to `display: flex; align-items: center; justify-content: center; min-height: 42px`. The `display: block` override was suppressing `.button-link`'s flex centering, causing text in the CTA buttons ("포트폴리오 시작하기" and "포트폴리오 보기") to appear top-aligned rather than vertically centered.
- **Anti-flicker resolving state**: Added new `#hpp-resolving` state as the SSR-visible default (replacing `#hpp-signed-out` as the initial visible state). `data-hpp-default="true"` moved to `hpp-resolving`. `#hpp-signed-out` now starts hidden and is only shown after client confirms the user is signed out. `HPP_STATE_IDS` expanded to 4 entries. Non-401 API errors (network failures, 503) now fall back to `hpp-signed-in-empty` rather than `hpp-signed-out`.
- **MY PORTFOLIO donut chart**: CSS conic-gradient account allocation chart added to State C (`signed_in_with_portfolio`). No external library. Data basis: `portfolioApi.listPositions()` per portfolio → `sum(quantity × buyPrice)` per portfolio (registered purchase price, not live market value). Copy: "등록 금액 기준 계좌 비중". Up to 4 portfolios shown individually; extra portfolios grouped as "기타". Zero-data fallback: gray placeholder circle + "보유 종목 입력 후 비중이 표시됩니다." Chart loads non-blocking (after state switch via `void loadDonutChart(portfolios)`).
- Updated `scripts/check_home_portfolio_panel_static_contract.mjs` — expanded from 61 to 84 checks across 12 groups. New checks: resolving state, anti-flicker, CTA flex alignment, donut markup, donut functions, PortfolioPosition import, 3BP result doc.
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — Phase 3BP artifact group appended.
- Created `docs/planning/phase_3bp_home_portfolio_panel_owner_review_fixes_result_v0.1.md` — result doc.
- All validators passed. Build passed.
- No live KIS, GNews, Supabase writes, deployment, or /news page.
- **Recommended next phase**: Phase 3BO — Portfolio Owner Browser Review.

## Phase 3BN - 2026-06-24

### Portfolio Bookmark Tabs & Reorder UX (Implemented)

- **Status**: implemented. Portfolio selector bar converted to bookmark-style tabs with pinned aggregate (left) and add (right) tabs and reorderable user portfolio tabs in between. No API routes, Supabase schemas, or deployment changes.
- Aggregate tab "전체 포트폴리오" pinned at the far left. Always the default active view on initial load. Cannot be reordered.
- Add tab ("+ 추가") pinned at the far right. Clicking it reveals the existing Phase 3BM collapsible manage panel. No modal or slide-over introduced.
- User-created portfolio tabs appear between the two pinned tabs. Rendered via `renderPortfolios()` using `document.createElement` (no innerHTML on user data).
- Desktop hover/focus: reorder arrow buttons (`‹` / `›`) appear around the portfolio name, as per "‹ OO계좌 ›" design intent. Arrows are `<button>` elements with `aria-label`. Inline edit/delete buttons also revealed on hover/focus.
- Mobile/touch (hover: none media query): reorder arrows and edit/delete buttons always visible, wider tap targets. No long-press, no drag-and-drop.
- One-slot movement per click. Boundary rules: first user tab left-arrow disabled, last user tab right-arrow disabled. Aggregate and add tabs cannot move. Active selection preserved after reorder.
- Tab order persistence: client memory only for Phase 3BN. No localStorage key written. No backend orderIndex call. Order resets on page reload.
- Created `scripts/check_portfolio_bookmark_tabs_static_contract.mjs` — 13-group static checker, 88/88 PASS.
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — Phase 3BN artifact group appended; Phase 3BM future-block checks updated to reflect intentional Phase 3BN tab introduction.
- Updated `package.json` — added `check:portfolio-bookmark-tabs` script.
- Created `docs/planning/phase_3bn_portfolio_bookmark_tabs_reorder_ux_result_v0.1.md` — result doc.
- No drag-and-drop, no new creation modal, no DB/Supabase/KIS/GNews/deployment changes. Home unchanged. No /news page.
- All validators passed. Build passed.
- **Recommended next phase**: Phase 3BO — Portfolio Owner Browser Review.

## Phase 3BM - 2026-06-24

### Portfolio Page Layout Refactor (Implemented)

- **Status**: implemented. Portfolio page refactored to remove debug status chips, expand the dashboard to full width, and relocate portfolio management to a collapsible section. No API routes, Supabase schemas, or deployment changes.
- Removed debug/development status bar (`portfolio-status-bar`) with four visible pills: 로그인됨, 프로필 준비 완료, API 사용 가능, 평가 준비 중. Replaced with a minimal `portfolio-loading-state` div (hidden when `[data-state="ready"]`). All JS state machine IDs (`portfolio-readiness`, `portfolio-readiness-copy`) preserved.
- Added refresh icon button to page header (right side of "내 투자 포트폴리오" heading) in a new `.portfolio-title-row` layout. `aria-label="현재 포트폴리오 다시 계산"`, `title="현재 포트폴리오 다시 계산"`. Connected to existing `loadPortfolioMvp()` — no live KIS call, no real-time data claim.
- Aggregate 전체 포트폴리오 view remains the default. Default selection logic (`state.selectedPortfolioId = aggregatePortfolioId`) unchanged.
- Removed permanent `<aside class="portfolio-sidebar panel">` (360px left column). Portfolio `<section class="portfolio-mvp">` changed from `grid (360px + 1fr)` to `flex-direction: column`.
- Added `.portfolio-selector-bar` (horizontal flex row above dashboard) containing `#portfolio-list` + `#portfolio-empty` + "포트폴리오 관리" toggle button.
- Added `.portfolio-manage-panel` (hidden by default, collapsible) below dashboard — contains all portfolio creation/edit form elements (`portfolio-form`, `portfolio-id`, `portfolio-name`, etc.). Auto-opens when no portfolios exist; auto-opens when edit action is triggered.
- Main dashboard `<section class="portfolio-detail portfolio-dashboard panel">` now occupies full available width.
- Created `scripts/check_portfolio_layout_refactor_static_contract.mjs` — 12-group static checker, 73/73 PASS.
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — Phase 3BM artifact group appended.
- Updated `package.json` — added `check:portfolio-layout` script.
- Created `docs/planning/phase_3bm_portfolio_page_layout_refactor_result_v0.1.md` — result doc.
- Bookmark tabs, tab reorder, + tab, creation modal, and tab persistence deferred to Phase 3BN.
- No API route changes. No Supabase/KIS/GNews/deployment changes. Home unchanged. No /news page.
- All validators passed. Build passed.
- **Recommended next phase**: Phase 3BN — Portfolio Bookmark Tabs & Reorder UX.

## Phase 3BL - 2026-06-24

### Home Portfolio Status Panel (Implemented)

- **Status**: implemented. Runtime change: replaced static Market Coverage card with a 3-state portfolio-aware panel on the Home hero section. No API routes, Supabase schemas, or deployment changes.
- Created `src/components/HomePortfolioPanel.astro` — three-state panel:
  - **State A (`signed_out`)**: SSR-visible default. 4-step onboarding guide (무료 계정으로 시작 → 포트폴리오 만들기 → 보유 종목 입력 → 투자 현황 확인). CTA: 포트폴리오 시작하기 → `/portfolio`.
  - **State B (`signed_in_empty`)**: Hidden until `portfolioApi.listPortfolios()` returns `[]`. 4-step guide with step 01 (로그인 완료) de-emphasized and step 02 highlighted as "다음 단계". CTA: 포트폴리오 만들기.
  - **State C (`signed_in_with_portfolio`)**: Hidden until API returns portfolios. Portfolio count + name tags (up to 4). No 평가금액 / live KIS data. CTA: 포트폴리오 보기.
  - Client script: listens for `mk:auth-state` events from Header.astro, runs `portfolioApi.listPortfolios()`, and toggles the visible state. `isSupabaseConfigured()` guard; `window.mkHppInit` idempotency guard. All error paths fall back to State A.
- Updated `src/pages/index.astro` — removed `<aside class="panel market-panel">` (Market Coverage), added `import HomePortfolioPanel` and `<HomePortfolioPanel />`. HomeMarketNews unchanged.
- Updated `src/styles/style.css` — added `.home-portfolio-panel` and all `.hpp-*` CSS classes under a new `/* --- Home Portfolio Panel --- */` section. Key styles: step list layout, `.hpp-step-next` accent (left border + soft background), `.hpp-next-badge`, `.hpp-cta` focus-visible, State C metrics rows, portfolio name tags.
- Created `scripts/check_home_portfolio_panel_static_contract.mjs` — 11-group checker, no network, no .env reads. Validates file existence, home integration, component state structure, Korean UI copy per state, live isolation, auth/data isolation, CSS classes, boundary isolation, and checker network safety.
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — Phase 3BL artifact group appended (result doc, component, checker, package script, home imports panel, market coverage removed, HomeMarketNews still present, no /news page).
- Updated `package.json` — added `"check:home-portfolio-panel"` script.
- Created `docs/planning/phase_3bl_home_portfolio_status_panel_result_v0.1.md` — 10-section result doc.
- All validators passed. Build passed.
- **Recommended next phase**: Phase 3BM — Portfolio Page Layout Refactor (remove status chips, expand full-width dashboard, move refresh button to page header).

## Phase 3BK - 2026-06-24

### Portfolio Experience Redesign Plan & State Contract (Planned)

- **Status**: planned. Documentation-only phase. No runtime, API, DB, Supabase, or deployment changes.
- **Roadmap shift**: Portfolio experience redesign is prioritized over the optional /news paginated list page (Phase 3BI). Phase 3BI is deferred.
- Created `docs/planning/phase_3bk_portfolio_experience_redesign_plan_state_contract_v0.1.md` — 15-section planning document including:
  - Current implementation observations (Home, Portfolio page, data source, auth flow, valuation status).
  - Home portfolio status panel plan: 3-state design (`signed_out`, `signed_in_empty`, `signed_in_with_portfolio`) to replace the static Market Coverage card.
  - Recommended UI copy for each Home state (Korean).
  - Portfolio page redesign plan: remove status chips, expand full-width dashboard, move refresh to page header, remove permanent sidebar, convert portfolio selection to bookmark tabs.
  - Bookmark tab UX contract: aggregate tab pinned left, user tabs reorderable with `‹ name ›` hover arrows, add tab pinned right; mobile long-press reorder; client-memory persistence first.
  - Refresh button semantics: `reload_portfolio_data` (re-call `/api/portfolio/*`) in Phase 3BM; live KIS refresh is a future placeholder, not approved.
  - Data and auth dependency analysis: auth is client-side only; portfolio presence requires API call; no live market data required for Phase 3BL.
  - Portfolio creation UI recommendation: modal (differentiates from position slide-over).
  - 6 open owner decisions listed.
  - Implementation phase split: 3BL (Home panel), 3BM (layout refactor), 3BN (bookmark tabs), 3BO (browser review), 3BI deferred.
- Created `docs/schemas/portfolio_experience_state_contract_v0.1.md` — TypeScript-style state types:
  - `PortfolioHomeState` (loading / signed_out / signed_in_empty / signed_in_with_portfolio / error)
  - `PortfolioPageCoarseState` (5 states)
  - `PortfolioSummary` (with per-field status: implemented / placeholder / future)
  - `PortfolioRecord`, `HoldingSummary`, `BookmarkTab`, `RefreshIntent`
  - Field status table mapping each field to its implementation phase.
- No runtime implementation in Phase 3BK.
- **Recommended next phase**: Phase 3BL — Home Portfolio Status Panel.

## Phase 3BJ - 2026-06-24

### Home Market News Owner Browser Review & UI Polish (Implemented)

- **Status**: implemented. Targeted CSS polish and validator hardening only. No behavioral, data-contract, or route changes.
- Updated `src/styles/style.css` — targeted polish to Home Market News section:
  - Increased `.home-news-section` margin-top (28px → 32px) and `.home-news-header` margin-bottom (18px → 20px) for better visual separation.
  - Increased `.home-news-card` internal gap (8px → 10px) for more breathing room between meta / headline / description rows.
  - Added `.home-news-card:hover` box-shadow elevation (in addition to existing border-color change); updated `transition` to include `box-shadow`.
  - **Added `.home-news-card:focus, .home-news-card:focus-visible`** — `outline: 2px solid var(--primary); outline-offset: 2px` for keyboard navigation accessibility (was missing in Phase 3BH).
  - Increased `.home-news-headline` line-height (1.45 → 1.5) for better Korean text readability.
  - Increased `.home-news-source-name` max-width (100px → 120px) to accommodate longer source names.
  - Increased `.home-news-empty` vertical padding (24px → 28px 24px).
- Updated `scripts/check_home_market_news_static_contract.mjs` — added Group 13 (Phase 3BJ, 8 new checks): section title `시장 뉴스` rendered, category badge element, source name element, date element, no `/news` link in component, CSS hover style, CSS focus-visible style, CSS transition. **Total: 57/57 PASS** (was 49/49).
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — added Phase 3BJ artifact group (10 checks): result doc exists, checker still exists, CSS focus-visible and hover styles, Home route/source/adapter/smoke boundaries unchanged, no /news page.
- Created `docs/planning/phase_3bj_home_market_news_owner_review_ui_polish_result_v0.1.md` — 10-section result doc with owner browser review checklist (25 items covering layout, card content, interaction, empty state, and negative checks).
- No API route changes. No component structure changes. No page additions. No Supabase / KIS / deployment changes.
- Live GNews provider compatibility remains unresolved. Fixture-first data contract unchanged.
- **Recommended next phase**: Phase 3BK — News list route with `mode=list` pagination, or Phase 3BI (optional public `/news` list page backed by fixture).

## Phase 3BH - 2026-06-24

### Home Market News UI Integration (Implemented)

- **Status**: implemented. Home page now renders top-6 market news article cards. No live GNews call. No DB, Supabase, or deployment changes.
- Home page (`src/pages/index.astro`) SSR-fetches `/api/news/market-feed?mode=home` during request handling. No `source` parameter is passed — route uses fixture default (`source=fixture`, `liveEnabled=false`).
- Fetch is server-side only (`await fetch(new URL('/api/news/market-feed?mode=home', Astro.url))`). No client-side news fetch was added.
- Created `src/components/HomeMarketNews.astro` — renders section title, up to 6 article cards (category badge, source name, date, title, description), and an empty fallback state ("표시할 시장 뉴스가 없습니다.") if fetch fails or returns no articles.
- UI copy: section title `시장 뉴스`, lead `오늘 시장을 움직이는 주요 이슈를 한눈에 확인하세요.`. No "실시간" or "live" claims.
- Only approved public article fields rendered: `title`, `description`, `url`, `sourceName`, `publishedAt`, `category`. No internal fields (`canonicalUrlHash`, `titleHash`, `isDuplicate`, etc.).
- Category badge mapped to Korean display names (국내 주식, 환율, 거시/정책, 원자재, 가상자산, 재테크).
- Added responsive news grid styles to `src/styles/style.css`: 3-col desktop, 2-col 980px, 1-col 640px.
- Created `scripts/check_home_market_news_static_contract.mjs` — 49-check no-network static contract checker. **49/49 PASS.**
- Updated prior boundary checkers (`check_gnews_news_api_route_static_contract.mjs`, `check_gnews_news_route_source_selector.mjs`, `check_gnews_live_fetch_adapter_design_static_contract.mjs`) — relaxed stale "Home does not call market-feed route" checks to reflect Phase 3BH intentional SSR connection (now checks that Home does not *import* the route directly, only SSR-fetches it).
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — added Phase 3BH artifact group (11 checks): result doc exists, checker exists, component exists, package script, Home uses `mode=home`, no `source=auto/live`, no live adapter import, no smoke script import, no /news page, route default unchanged.
- Added `check:home-market-news` to `package.json`.
- No Home connection to live GNews adapter. No GNews env vars read from Home. No owner smoke script imported.
- **Route boundary unchanged**: `/api/news/market-feed` route not modified. Default source remains fixture.
- No /news page created. No DB/Supabase/KIS/Vercel/deployment changes.
- Live GNews provider compatibility remains unresolved. Home uses fixture/fallback-first data.
- Created `docs/planning/phase_3bh_home_market_news_ui_integration_result_v0.1.md` — 10-section result doc.
- **Recommended next phase**: Phase 3BI — Optional `/news` paginated list page using `mode=list` and default fixture source.

## Phase 3BG - 2026-06-24

### News Route Source Selector with Kill Switch and Fixture Fallback (Implemented)

- **Status**: implemented. Runtime code, checkers, and documentation added. No live GNews calls. No DB, Home, or deployment changes.
- Added `src/lib/news/gnewsMarketFeedSourceSelector.mjs` — pure helper + async orchestrator module. Exports: `VALID_NEWS_SOURCES` (`fixture`/`auto`/`live`), `parseNewsSourceParam`, `validateNewsSource`, `resolveNewsLiveGate`, `shouldAttemptLiveSource`, `sanitizeLiveFallbackReason`, `buildFixtureFallbackMetadata`, `buildLiveSourceMetadata`, `resolveMarketNewsFeedSource`.
- Live gate (`resolveNewsLiveGate`) checks: `GNEWS_LIVE_ENABLED === 'true'`, `VERCEL_ENV !== 'production'`, `GNEWS_BASE_URL` present and endpoint-only (no query string, no embedded `apikey`/`key`/`token`/`q` fragment), and `GNEWS_API_KEY` (or `PUBLIC_GNEWS_API_KEY` as fallback) present. All conditions must pass. Production live mode is permanently blocked.
- API key is accessed inside `resolveNewsLiveGate` and passed internally to the adapter. It is never included in public responses, metadata, or fallback reason codes.
- Updated `src/pages/api/news/market-feed.ts` — route is now async. Accepts `source` query parameter. Validates source via `validateNewsSource`. Default when absent: `fixture` (early-return, no env reads, no live calls). `auto` and `live` delegate to `resolveMarketNewsFeedSource` which evaluates the live gate and attempts `fetchGnewsMarketNewsBatch`. All live failure modes (gate disabled, empty result, provider error, timeout, invalid payload, exception) fall back to fixture with sanitized `fallbackReason`. Route passes `import.meta.env` as an opaque object and `globalThis.fetch` as a value (not called) — preserves Phase 3BA/3BC static check boundaries.
- Updated `src/lib/news/gnewsMarketFeedResponse.mjs` — added `invalid_source` to `ERROR_MESSAGES`. Added optional `meta = {}` parameter to `buildMarketNewsHomeResponse` and `buildMarketNewsListResponse` (backward-compatible). Added `buildMarketNewsHomeResponseFromArticles(articles, meta)` and `buildMarketNewsListResponseFromArticles(articles, options, meta)` for live article arrays. Added `staleState: 'live'` to live article builders.
- Response metadata fields added: `requestedSource`, `source`, `liveEnabled`, `liveAttempted`, `fallbackUsed`, `fallbackReason` (when fallbackUsed=true), `provider` (when live succeeded). `staleState` remains `'fixture'` for all fixture paths and `'live'` for live success paths.
- 13 sanitized fallback reason codes: `live_disabled`, `production_blocked`, `missing_base_url`, `invalid_base_url`, `missing_api_key`, `provider_empty_result`, `provider_rate_limited`, `provider_http_error`, `provider_timeout`, `provider_invalid_payload`, `provider_fetch_failed`, `live_exception`, `unknown_live_failure`. All reasons validated by `sanitizeLiveFallbackReason`. Unrecognized codes map to `unknown_live_failure`.
- Created `scripts/check_gnews_news_route_source_selector.mjs` — 148/148 behavioral checker. 15 groups covering all pure helpers, `resolveMarketNewsFeedSource` (fixture path, gate-disabled path, live with synthetic fetchFn), static route content checks, and boundary isolation. No network, no env reads. **148/148 PASS.**
- Updated `scripts/check_gnews_news_api_route_static_contract.mjs` — added Group 8 (Phase 3BG checks, 15 checks): selector exists, route imports selector, route handles source param, invalid_source, fixture default, no smoke script import, no direct adapter import, no GNEWS_API_KEY in route, feedResult.meta used in fallback, production blocked in selector, source=fixture early return, VALID_NEWS_SOURCES has all 3 values, ALLOWED_FALLBACK_REASONS in selector, no Home integration, no /news page. **All checks passed (groups 1-8 validated). Exit 0.**
- Updated `scripts/check_gnews_news_api_route_response.mjs` — added Groups 8–10 (Phase 3BG): fixture with meta, invalid_source error shape, `buildMarketNewsHomeResponseFromArticles` and `buildMarketNewsListResponseFromArticles` with synthetic live articles and no internal field leakage. **Result: PASS.**
- Updated `scripts/check_gnews_live_fetch_adapter_mocked.mjs` — updated Group 18 fixture-backed checks to accept `?? false` / `?? 'fixture'` patterns (Phase 3BG helper now uses nullish coalescing defaults). **Result: PASS.**
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — updated 4 existing fixture-backed checks to accept `?? false` pattern; added Phase 3BG artifact group (10 checks): result doc exists, selector exists, selector checker exists, `check:gnews-news-route-source-selector` in `package.json`, route imports `parseNewsSourceParam`, selector defaults to `'fixture'`, selector has `ALLOWED_FALLBACK_REASONS`, route does not import owner smoke script, no Home integration, no /news page. **All checks passed. Exit 0.**
- Added `check:gnews-news-route-source-selector` to `package.json`.
- Created `docs/planning/phase_3bg_news_route_source_selector_fallback_result_v0.1.md` — 11-section result doc.
- **Route boundary unchanged on default path**: `mode=home` with no `source` param returns fixture-backed response with `source: "fixture"`, `liveEnabled: false` — exactly as before.
- **Forbidden**: raw API key, base URL, query string, article content, raw error message, stack traces, raw JSON — none appear in public responses or logs.
- **Route file safety**: No `GNEWS_API_KEY` string in route file. Route does not call `fetch()` directly. Route does not import live adapter. All preserved from Phases 3BA–3BC.
- **Recommended next phase**: Phase 3BH — Home Market News UI Integration (wire top-6 articles from `/api/news/market-feed?mode=home` fixture-backed into the Home shell via SSR fetch).

## Phase 3BF - 2026-06-24

### GNews Live Smoke Diagnostics Result Recorded (Documentation-only)

- **Status**: recorded. Documentation-only phase — no runtime code, checkers, scripts, routes, or configuration were changed.
- Owner-run live smoke with `--diagnostics=sanitized` was performed outside Claude Code. Claude Code made no live GNews calls.
- **Themes tested** (simple profile, sanitized diagnostics): `fx`, `market_stocks`, `crypto_digital_assets`, `oil_commodities`.
- All four themes returned HTTP 2xx, JSON parse OK, `articlesPresent=true`, `articlesIsArray=true`, `articlesLength=0`, `provider_empty_result`.
- Three themes (`market_stocks`, `crypto_digital_assets`, `oil_commodities`) included `articlesRemovedFromResponse` as a top-level key — a structural signal of active provider-side article removal behavior, not a route or adapter failure.
- **Live GNews retrieval is not marked as passed.** All tested themes across both `policy` and `simple` query profiles returned `provider_empty_result`.
- **Decision**: Do not block the project on live GNews success. Proceed with fixture/fallback-first architecture. Keep live GNews disabled by default. Treat provider compatibility as a later isolated phase.
- **Route boundary unchanged**: `src/pages/api/news/market-feed.ts` untouched. `source: "fixture"`, `liveEnabled: false`. `gnewsLiveFetchAdapter.mjs` not modified.
- No route, Home UI, DB, Supabase, checker, package script, or deployment changes.
- Previously exposed GNews API key remains treated as compromised. Key value not recorded. Owner must rotate outside Claude Code.
- **Recommended next phase**: Phase 3BG — News Route Source Selector with Kill Switch and Fixture Fallback.
- Created `docs/planning/phase_3bf_gnews_live_smoke_diagnostics_result_v0.1.md` — 10-section result record.

## Phase 3BE-R5 - 2026-06-24

### GNews Live Smoke Sanitized Provider Diagnostics Patch (Implemented)

- Patched `scripts/owner_smoke_gnews_live_fetch.mjs` — added `--diagnostics=<mode>` option with allowlist validation (2 valid modes: `off`, `sanitized`). Default is `off`. When `sanitized`, fetch is wrapped with `createSanitizedDiagnosticsFetch` which reads a `response.clone().text()` copy, extracts structural metadata only (HTTP status class, JSON parse success, top-level key count, sanitized key names, articles array presence/length, totalArticles type, error/message flags), and emits a `provider-diagnostics` log line. The original response is returned unchanged so the adapter can still read the body. Diagnostics mode validated before env reads. Added `invalid_diagnostics_mode` sanitized reason code. New exports: `SMOKE_ALLOWED_DIAGNOSTICS_MODES`, `parseDiagnosticsArg`, `validateDiagnosticsMode`, `summarizeProviderPayloadShape`, `summarizeProviderTextShape`, `createSanitizedDiagnosticsFetch`.
- Created `scripts/check_gnews_live_smoke_provider_diagnostics.mjs` — behavioral provider-diagnostics checker. Tests all 5 new pure helpers and the diagnostics wrapper with synthetic fetch functions. No network, no env reads. **77/77 PASS.**
- Updated `scripts/check_gnews_live_smoke_script_static_contract.mjs` — added Group 16 with 15 Phase 3BE-R5 checks: `--diagnostics` support, `off`/`sanitized` modes, `invalid_diagnostics_mode`, all 5 new exports, `response.clone` usage, `provider-diagnostics` step, validation before env reads, `createSanitizedDiagnosticsFetch` wrapping, no raw JSON in logStep, no apiKey in logStep, original response returned. **All checks passed (Group 16 added). Exit 0.**
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — added Phase 3BE-R5 artifact group (8 checks): result doc exists, provider diagnostics checker exists, `check:gnews-live-smoke-provider-diagnostics` in `package.json`, smoke supports `--diagnostics`, `invalid_diagnostics_mode` present, `provider-diagnostics` output step, diagnostics exports, route still fixture-backed. **All checks passed. Exit 0.**
- Created `docs/planning/phase_3be_r5_sanitized_provider_diagnostics_patch_result_v0.1.md` — 14-section result doc.
- Added `check:gnews-live-smoke-provider-diagnostics` to `package.json`.
- **Forbidden diagnostics output**: request URL, API key values, article content (title/url/description/content), raw JSON body, error message values, stack traces, query strings. Key names (`title`, `url`, `description`, `content`, `source`, `image`, `imageurl`, `image_url`, `link`, `body`, `text`, `html`) suppressed from `topLevelKeys` and counted in `forbiddenTopLevelKeyCount`.
- **Security note**: A previously exposed GNews API key remains treated as compromised — not recorded anywhere. Owner must rotate before any live retry. No request URL is ever logged by the diagnostics wrapper.
- **No live GNews call was made**: dry-run and behavioral (no-network) validation only. `runDryRun` unchanged.
- **Route remains unchanged**: `src/pages/api/news/market-feed.ts` untouched. `source: "fixture"`, `liveEnabled: false`. `gnewsLiveFetchAdapter.mjs` not modified.
- **No live calls, no DB/Supabase/Home/deployment changes, no migration files.**
- **Validation**: `check:gnews-news-policy` all passed; `check:gnews-live-smoke-script` all passed (Group 16 added); `check:gnews-live-smoke-dry-run` 29/29; `check:gnews-live-smoke-theme-selection` 79/79; `check:gnews-live-smoke-query-profile` 66/66; `check:gnews-live-smoke-provider-diagnostics` 77/77; `smoke:gnews-live:dry` PASS.
- **Recommended next phase**: 3BE-R6 — Owner rotates API key, sets endpoint-only `GNEWS_BASE_URL`, and re-runs live smoke with `--execute-live --confirm-owner-approved --theme=fx --query-profile=simple --diagnostics=sanitized`. Returns only the sanitized gnews3bd output lines including the `provider-diagnostics` step.

## Phase 3BE-R3 - 2026-06-24

### GNews Live Smoke Query Simplification Patch (Implemented)

- Patched `scripts/owner_smoke_gnews_live_fetch.mjs` — added `--query-profile=<profile>` option with allowlist validation (2 valid profiles: `policy`, `simple`). Default is `policy`. `simple` applies smoke-only short Korean query terms from `SMOKE_QUERY_PROFILE_SIMPLE_MAP` instead of the OR-heavy policy query strings. Definitions are shallow-cloned — imported `GNEWS_QUERY_DEFINITIONS` from `gnewsLiveFetchAdapter.mjs` are never mutated. Query profile validated before env reads. Added `invalid_query_profile` sanitized reason code. New exports: `SMOKE_QUERY_PROFILE_SIMPLE_MAP`, `SMOKE_ALLOWED_QUERY_PROFILES`, `parseQueryProfileArg`, `validateQueryProfile`, `applySmokeQueryProfile`.
- Created `scripts/check_gnews_live_smoke_query_profile.mjs` — behavioral query-profile checker. Tests all 3 new pure helpers and integration with `selectSmokeThemeDefinitions`. No network, no env reads. **66/66 PASS.**
- Updated `scripts/check_gnews_live_smoke_script_static_contract.mjs` — added Group 15 with 12 Phase 3BE-R3 checks: `--query-profile` support, `policy`/`simple` profiles, `invalid_query_profile`, all 3 new exports, simple map presence, all 6 smoke query terms, definition cloning, profile validation before guards, no queryString in query-profile logStep, `effectiveDefinitions` usage. **All checks passed (Group 15 added). Exit 0.**
- Updated `scripts/check_gnews_live_smoke_theme_selection.mjs` — added Group 9 with 17 Phase 3BE-R3 integration checks: query profile helpers importable, `parseQueryProfileArg` defaults, `validateQueryProfile` valid/invalid, `applySmokeQueryProfile` with theme integration, original definitions not mutated. **79/79 PASS.**
- Updated `scripts/check_gnews_live_smoke_script_dry_run.mjs` — no changes needed; existing 29 checks still pass (dry-run does not exercise query profile path). **29/29 PASS.**
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — added Phase 3BE-R3 artifact group (8 checks): result doc exists, query profile checker exists, `check:gnews-live-smoke-query-profile` in `package.json`, smoke supports `--query-profile`, `invalid_query_profile` present, simple map present, all 6 smoke query terms, route still fixture-backed. **All checks passed. Exit 0.**
- Created `docs/planning/phase_3be_r3_gnews_live_smoke_query_simplification_patch_result_v0.1.md` — 13-section result doc.
- Added `check:gnews-live-smoke-query-profile` to `package.json`.
- **Simple profile map** (smoke-only, not the Phase 3AY production policy): `market_stocks` → `주식`, `macro_policy` → `금리`, `fx` → `환율`, `oil_commodities` → `유가`, `crypto_digital_assets` → `비트코인`, `personal_finance` → `재테크`.
- **Security note**: A previously exposed GNews API key remains treated as compromised — not recorded anywhere. Owner must rotate before any live retry.
- **No live GNews call was made**: dry-run and behavioral (no-network) validation only. `runDryRun` unchanged.
- **Route remains unchanged**: `src/pages/api/news/market-feed.ts` untouched. `source: "fixture"`, `liveEnabled: false`. `gnewsLiveFetchAdapter.mjs` not modified.
- **No live calls, no DB/Supabase/Home/deployment changes, no migration files.**
- **Validation**: `check:gnews-news-policy` all passed; `check:gnews-news-engine` 57/57; `check:gnews-news-api-route` 35 groups; `check:gnews-news-api-response` 61/61; `check:gnews-live-adapter-design` all passed; `check:gnews-live-adapter-static` all passed; `check:gnews-live-adapter-mocked` 148/148; `check:gnews-live-smoke-script` all passed (Group 15 added); `check:gnews-live-smoke-dry-run` 29/29; `check:gnews-live-smoke-theme-selection` 79/79 (Group 9 added); `check:gnews-live-smoke-query-profile` 66/66; `smoke:gnews-live:dry` PASS.
- **Recommended next phase**: 3BE-R4 — Owner rotates API key, sets endpoint-only `GNEWS_BASE_URL`, and re-runs live smoke with `--theme=macro_policy --query-profile=simple` or `--theme=fx --query-profile=simple`. Returns only sanitized count/category summary.

## Phase 3BE-R1 - 2026-06-24

### GNews Live Smoke Theme Selection Patch (Implemented)

- Patched `scripts/owner_smoke_gnews_live_fetch.mjs` — added `--theme=<queryKey>` option with allowlist validation (6 valid keys: `market_stocks`, `macro_policy`, `fx`, `oil_commodities`, `crypto_digital_assets`, `personal_finance`). Added `GNEWS_BASE_URL` endpoint-only guard rejecting query strings and embedded key/token/q fragments. Exports 4 new pure helpers: `SMOKE_ALLOWED_THEME_KEYS`, `parseThemeArg`, `selectSmokeThemeDefinitions`, `validateEndpointOnlyBaseUrl`. Theme validation now runs before env reads so invalid `--theme` fails without touching API key. Added `invalid_theme` and `invalid_base_url` sanitized reason codes.
- Created `scripts/check_gnews_live_smoke_theme_selection.mjs` — behavioral theme-selection checker. Imports pure helpers from smoke script, imports `GNEWS_QUERY_DEFINITIONS` from adapter. No network, no env reads. **62/62 PASS.**
- Updated `scripts/check_gnews_live_smoke_script_static_contract.mjs` — added Group 14 with 15 Phase 3BE-R1 checks: `--theme` support, `SMOKE_ALLOWED_THEME_KEYS`, 6 valid queryKeys present, `invalid_theme`, exported helpers, `validateEndpointOnlyBaseUrl`, `invalid_base_url`, query string rejection, embedded apikey/key/token rejection, no queryString in logStep calls, no guard.baseUrl in logStep calls. **All checks passed (Group 14 added). Exit 0.**
- Updated `scripts/check_gnews_live_smoke_script_dry_run.mjs` — added 2 extra forbidden-output checks: no `queryString` keyword in dry-run output, no Korean `OR`-joined query string patterns. **29/29 PASS.**
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — added Phase 3BE-R1 artifact group (8 checks): result doc exists, theme selection checker exists, `check:gnews-live-smoke-theme-selection` in `package.json`, smoke supports `--theme`, `invalid_theme` and `invalid_base_url` present, no queryString in logStep, route still fixture-backed. **All checks passed. Exit 0.**
- Created `docs/planning/phase_3be_r1_gnews_live_smoke_theme_selection_patch_result_v0.1.md` — 13-section result doc with Phase 3BE observation summary, implementation summary, theme selection behavior, base URL guard rules, dry-run validation, validation results, route boundary, safety boundaries, remaining limitations, and confirmed non-actions.
- Added `check:gnews-live-smoke-theme-selection` to `package.json`.
- **Security note**: During Phase 3BE, a GNews API key was accidentally pasted into chat. It is treated as compromised. Owner must rotate it outside Claude Code. The key value is not recorded anywhere in docs, code, tests, or commit messages.
- **No live GNews call was made**: dry-run and behavioral (no-network) validation only.
- **Route remains unchanged**: `src/pages/api/news/market-feed.ts` untouched. `source: "fixture"`, `liveEnabled: false`. No adapter import, no smoke import.
- **No live calls, no DB/Supabase/Home/deployment changes, no migration files.**
- **Validation**: `check:gnews-news-policy` all passed; `check:gnews-news-engine` 57/57; `check:gnews-news-api-route` 35 groups; `check:gnews-news-api-response` 61/61; `check:gnews-live-adapter-design` all passed; `check:gnews-live-adapter-static` all passed; `check:gnews-live-adapter-mocked` 148/148; `check:gnews-live-smoke-script` all passed (Group 14 added); `check:gnews-live-smoke-dry-run` 29/29; `check:gnews-live-smoke-theme-selection` 62/62; `smoke:gnews-live:dry` PASS.
- **Recommended next phase**: 3BE-R2 — Owner rotates API key, sets endpoint-only `GNEWS_BASE_URL`, and re-runs live smoke with `--theme=macro_policy` or `--theme=fx`. Returns only sanitized count/category summary.

## Phase 3BD - 2026-06-24

### Owner-Run GNews Live Smoke Script (Implemented)

- Created `scripts/owner_smoke_gnews_live_fetch.mjs` — owner-run GNews live smoke script. Defaults to dry-run mode (no network, no env reads). Live mode requires `--execute-live`, `--confirm-owner-approved`, `GNEWS_LIVE_ENABLED=true`, `GNEWS_BASE_URL`, and API key (`GNEWS_API_KEY` preferred, `PUBLIC_GNEWS_API_KEY` server-side fallback). Production blocked via `VERCEL_ENV=production` guard.
- Created `scripts/check_gnews_live_smoke_script_static_contract.mjs` — static smoke script checker. Validates CLI guards, env var guards, output sanitizer, no-forbidden-imports, no-file-writes, adapter imports, route boundary. **All 53 checks passed. Exit 0.**
- Created `scripts/check_gnews_live_smoke_script_dry_run.mjs` — behavioral dry-run checker. Imports `runDryRun` export, monkey-patches `globalThis.fetch` to block network, captures output, verifies required content and no forbidden content. **27/27 PASS.**
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — added Phase 3BD artifact group (11 checks). **All checks passed. Exit 0.**
- Added `check:gnews-live-smoke-script`, `check:gnews-live-smoke-dry-run`, `smoke:gnews-live:dry` to `package.json`. `smoke:gnews-live:dry` always passes `--dry-run` — no live script registered.
- **Live guard conditions**: `--execute-live` flag + `--confirm-owner-approved` flag + `GNEWS_LIVE_ENABLED=true` + `GNEWS_BASE_URL` present + API key present + `maxThemes <= 2` + `VERCEL_ENV != production`.
- **Max 2 live requests/themes per run**: `maxThemes` clamped to `[1, 2]` via `MAX_THEMES_CAP = 2`. Matches adapter `MAX_THEMES_PER_SMOKE: 2`.
- **Sanitized output only**: live mode prints counts and category enum values only — no article URLs, titles, descriptions, raw JSON, API key values, or stack traces. `safeLog` guard blocks forbidden patterns before any output.
- **Dry-run validation only performed in this phase**: no live smoke executed, no live GNews call, no network, no env reads, no API key usage.
- **Route remains unchanged**: `src/pages/api/news/market-feed.ts` untouched. `source: "fixture"`, `liveEnabled: false`. Route does not import live adapter or smoke script.
- **No live calls, no DB/Supabase/Home/deployment changes, no migration files.**
- **Validation**: `check:gnews-news-policy` all passed; `check:gnews-news-engine` 57/57; `check:gnews-news-api-route` 35 groups; `check:gnews-news-api-response` 61/61; `check:gnews-live-adapter-design` all passed; `check:gnews-live-adapter-static` all passed; `check:gnews-live-adapter-mocked` 148/148; `check:gnews-live-smoke-script` all passed; `check:gnews-live-smoke-dry-run` 27/27; `smoke:gnews-live:dry` PASS.
- **Recommended next phase**: 3BE — Owner manually executes GNews live smoke and provides only the sanitized count/category summary.

## Phase 3BC - 2026-06-24

### GNews Live Adapter Skeleton with Mocked Fetch (Implemented)

- Created `src/lib/news/gnewsLiveFetchAdapter.mjs` — no-network GNews live fetch adapter skeleton. All HTTP calls go through an injected `fetchFn`; no global `fetch` is called. No env reads; `apiKey` and `baseUrl` are function arguments only.
- Created `src/data/fixtures/gnews_live_adapter_mock_response_v0.1.json` — synthetic GNews-provider-like mock response fixture. 12 articles across 4 categories (MARKET_STOCKS, FX, MACRO_POLICY, CRYPTO_DIGITAL_ASSETS). All content fictional, all URLs under `example.test` domains.
- Created `scripts/check_gnews_live_fetch_adapter_static_contract.mjs` — static adapter checker. Validates exports, security boundaries, route isolation. **All checks passed. Exit 0.**
- Created `scripts/check_gnews_live_fetch_adapter_mocked.mjs` — no-network mocked adapter checker. **148/148 PASS**. 18 groups: URL builder, error cases, HTTP error codes, invalid payload, timeout, article normalization, SHA-256 hashes, edge cases, batch normalization, partial failure, result summarization, forbidden patterns, route boundary.
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — added Phase 3BC artifact group. **69/69 PASS**.
- Updated `scripts/check_gnews_live_fetch_adapter_design_static_contract.mjs` — updated Group 12 "no adapter" guard to "adapter skeleton exists". **All checks passed. Exit 0.**
- Added `check:gnews-live-adapter-static` and `check:gnews-live-adapter-mocked` scripts to `package.json`.
- **Adapter exports**: `GNEWS_ADAPTER_POLICY`, `GNEWS_QUERY_DEFINITIONS`, `buildGnewsSearchUrl`, `fetchGnewsTheme`, `fetchGnewsMarketNewsBatch`, `normalizeGnewsArticle`, `normalizeGnewsBatch`, `sanitizeGnewsAdapterError`, `summarizeGnewsLiveFetchResult`.
- **No-network design**: fetchFn injection required; no global `fetch`; no env reads; no live endpoint hardcoded; tests use `https://api.example.test` and a non-secret synthetic placeholder key.
- **Normalization**: raw provider article → MarketNewsArticle-compatible shape. `canonicalUrlHash` and `titleHash` via SHA-256 (`node:crypto`). Tracking params (utm_*, fbclid, gclid, _ga, ref) stripped before URL hashing. `rawProviderStored: false` enforced.
- **Error handling**: 11 sanitized error codes. No stack traces, raw errors, API keys, or full URLs exposed.
- **Route remains unchanged**: `src/pages/api/news/market-feed.ts` untouched. Route still returns `source: "fixture"`, `liveEnabled: false`. No live adapter import in route or helper.
- **No live calls, no env reads, no API key usage, no DB/Supabase/Home/deployment changes.**
- **Validation**: `check:gnews-news-policy` 69/69; `check:gnews-news-engine` 57/57; `check:gnews-news-api-route` 35/35; `check:gnews-news-api-response` 61/61; `check:gnews-live-adapter-design` all passed; `check:gnews-live-adapter-static` all passed; `check:gnews-live-adapter-mocked` 148/148; `npm run build` success (4.09s).
- **Recommended next phase**: 3BD — Owner-run GNews live smoke script (max 2 requests, sanitized output, explicit owner approval required).

## Phase 3BB - 2026-06-24

### GNews Live Fetch Adapter Design + Kill-switch Contract (Designed)

- Created `docs/planning/phase_3bb_gnews_live_fetch_adapter_design_v0.1.md` — 17-section design document defining the future live fetch adapter architecture and safety contract.
- Created `scripts/check_gnews_live_fetch_adapter_design_static_contract.mjs` — static design checker. **62/62 PASS**.
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — added 6 Phase 3BB artifact checks. **58/58 PASS** (policy + 3AZ + 3BA + 3BB).
- Added `check:gnews-live-adapter-design` script to `package.json`.
- **Design only**: No live adapter (`gnewsLiveFetchAdapter.mjs`) was created. No API route behavior was changed. No env vars were read. No DB/Supabase/Home/deployment changes.
- **Future adapter design**: `src/lib/news/gnewsLiveFetchAdapter.mjs` (path only, not created). Functions: `buildGnewsSearchUrl`, `fetchGnewsTheme`, `fetchGnewsMarketNewsBatch`, `normalizeGnewsArticle`, `normalizeGnewsBatch`, `sanitizeGnewsAdapterError`, `summarizeGnewsLiveFetchResult`.
- **Environment variable policy**: `GNEWS_API_KEY` is the server-only preferred variable. `PUBLIC_GNEWS_API_KEY` is a server-side compatibility fallback only; **browser/client code must never use `import.meta.env.PUBLIC_GNEWS_API_KEY`**. Future implementation must migrate to `GNEWS_API_KEY` exclusively.
- **Kill-switch**: `GNEWS_LIVE_ENABLED` — default disabled. Only `"true"` enables live mode. Production live mode blocked until a future explicit production-readiness phase (`VERCEL_ENV=production` guard).
- **Query themes**: 6 (MARKET_STOCKS, MACRO_POLICY, FX, OIL_COMMODITIES, CRYPTO_DIGITAL_ASSETS, PERSONAL_FINANCE). Korean terms: 코인, 환율, 유가, 금리, 비트코인, ETF. 2-hour refresh. 72 requests/day. 28 requests/day headroom.
- **Failure/fallback**: missing key → fixture fallback; 429 → stale/fixture; 5xx → fixture; timeout → fixture; empty result → partial; partial failure → `staleState: "partial"`. Raw provider errors never exposed.
- **Owner-run smoke plan**: `scripts/owner_smoke_gnews_live_fetch.mjs` / `smoke:gnews-live:dry`. Max **2 requests per run**. Sanitized counts and category labels only; article URLs, titles, descriptions, API key values, raw JSON must not be printed.
- **Validation**: `check:gnews-news-policy` 58/58; `check:gnews-news-engine` 57/57; `check:gnews-news-api-route` 35/35; `check:gnews-news-api-response` 61/61; `check:gnews-live-adapter-design` 62/62; `npm run build` success.

## Phase 3BA - 2026-06-24

### Fixture-backed News API Route Skeleton (Implemented)

- Created `src/pages/api/news/market-feed.ts` — Astro SSR API route for `GET /api/news/market-feed`.
- Created `src/lib/news/gnewsMarketFeedResponse.mjs` — no-network response builder utility with exports: `sanitizeMarketNewsArticle`, `buildMarketNewsHomeResponse`, `buildMarketNewsListResponse`, `buildMarketNewsErrorResponse`, `VALID_MODES`, `VALID_CATEGORIES`.
- Created `scripts/check_gnews_news_api_route_static_contract.mjs` — static API route contract checker. **35/35 PASS**.
- Created `scripts/check_gnews_news_api_route_response.mjs` — no-network response-level checker (imports helper directly, not the TypeScript route). **61/61 PASS**.
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — added 7 Phase 3BA artifact checks. **52/52 PASS**.
- Added `check:gnews-news-api-route` and `check:gnews-news-api-response` scripts to `package.json`.
- **Route modes**: `mode=home` (top-6 articles, category/source balanced) and `mode=list` (paginated, `page`, optional `category`).
- **Public article shape**: 9 fields (`id`, `title`, `description`, `url`, `imageUrl`, `sourceName`, `publishedAt`, `category`, `relevanceScore`). All 18 internal storage fields excluded.
- **Sanitized errors**: `invalid_mode` (400), `invalid_category` (400), `method_not_allowed` (405). No stack traces in responses.
- **Validation results**: `check:gnews-news-policy` 52/52 PASS; `check:gnews-news-engine` 57/57 PASS; `check:gnews-news-api-route` 35/35 PASS; `check:gnews-news-api-response` 61/61 PASS; `npm run build` success.
- **No live GNews/API key/DB/Supabase/Home/deployment/.env changes.** Route is fixture-backed, `source: "fixture"`, `liveEnabled: false`.

## Phase 3AZ - 2026-06-24

### No-network GNews Policy Validator Implementation (Implemented)

- Created `docs/planning/phase_3az_no_network_gnews_policy_validator_result_v0.1.md`.
- Created `src/lib/news/gnewsNewsPolicy.mjs` — no-network deterministic policy utility exporting: `POLICY` constants, `normalizeArticle`, `validateArticleShape`, `validateFixtureShape`, `detectDuplicateGroups`, `detectExpiredArticles`, `rankPruneCandidates`, `paginateArticles`, `selectHomeArticles`, `scanNewsPolicyForbiddenPatterns`, `checkArticleUrlDomains`, `summarizePolicyValidation`.
- Created `scripts/check_gnews_news_policy_engine.mjs` — engine validator with 57 checks across 10 groups: fixture metadata (8), article shape (4), URL domain safety (2), category coverage (6), dedup detection (7), expiration detection (3), prune ranking (8), pagination (8), Home top-6 selection (6), security scan (5). **57/57 PASS**.
- Updated `scripts/check_gnews_news_policy_static_contract.mjs` — added 7 Phase 3AZ artifact checks. **51/51 PASS**.
- Added `check:gnews-news-engine` script to `package.json`.
- **Validation results**: `check:gnews-news-policy` 51/51 PASS; `check:gnews-news-engine` 57/57 PASS.
- **Key findings**: 24 active non-duplicate articles; 1 exact-URL dup group; 1 expired (fixture-018); 1 low-score (fixture-009, score 22); Home selects 6 articles across 5 categories; 0 forbidden findings in fixture.
- **Reference time**: `2026-06-23T09:00:00Z` (deterministic, not `Date.now()`).
- **No runtime changes**: No live GNews call, no API route, no DB, no Supabase, no Home integration, no deployment.

## Phase 3AY - 2026-06-23

### GNews News Store Policy + No-network Schema/Fixture Design (Planned)

- Created `docs/planning/phase_3ay_gnews_news_store_policy_fixture_design_v0.1.md`.
- Created `docs/schemas/gnews_market_news_schema_v0.1.md` (TypeScript-style interface definitions for `MarketNewsArticle`, `ArticleCategory`, `ArchiveReason`, `QueryDefinition`, `PaginationRequest/Response`, `HomeFeedResponse`, `PruneDecision`, `IngestionResult`).
- Created `src/data/fixtures/gnews_market_news_fixture_v0.1.json` (26 synthetic articles, all URLs under `*.example.test`; covers all 6 categories; includes exact-URL duplicate pair [fixture-019/020], near-duplicate title pair [fixture-003/004], expired article [fixture-018, `archiveReason: "expired"`], low-score article [fixture-009, `relevanceScore: 22`], and missing-image article [fixture-012, `imageUrl: null`]).
- Created `scripts/check_gnews_news_policy_static_contract.mjs` (44 checks: file existence, policy parameter phrases in planning doc, 6 category names, 6 Korean query terms 코인/환율/유가/금리/비트코인/ETF, 3 security policy phrases, schema field names, fixture structure/metadata, URL domain safety, 6 category coverage, 5 scenario coverage, 3 forbidden pattern checks).
- Added `check:gnews-news-policy` script to `package.json`.
- **Policy decision**: Active article cap: 100. Page size: 10. Maximum list pages: 10. Home exposure: 6. Retention: 14 days. Refresh: 2 hours. Budget: 72 requests/day. Prune batch size: 20.
- **Security policy**: `GNEWS_API_KEY` server-only preferred; `PUBLIC_GNEWS_API_KEY` may be used in server-side code as compatibility fallback only; client code must never read it; no key value recorded anywhere.
- **No runtime changes**: No API route, no DB, no Supabase, no Home integration, no deployment.

## Phase 3AX - 2026-06-23

### Notification Favorite Stock Shell + About Footer Link + Home Ad Slot Expansion (Implemented)

- Created `docs/planning/phase_3ax_notification_favorite_about_ad_slots_result_v0.1.md`.
- **관심종목 뉴스 알림 search/save shell** (`src/pages/mypage.astro`): Row converted to `mp-notif-block`. Added search input ("관심종목 검색", placeholder "종목명 또는 종목코드를 입력하세요."), "관심종목 저장" button, in-memory rendered list ("저장된 관심종목", max 5, empty state, 삭제 per item), and "실제 뉴스 알림 저장 기능은 준비 중입니다." notice. No backend, no localStorage/sessionStorage, no API call. State resets on page reload.
- **관심종목 지정가 알림 on/off toggle** (`src/pages/mypage.astro`): Added "알림 사용" toggle row inside the 지정가 알림 block. Unchecked → body dimmed (opacity 0.45, pointer-events none). No persistence, no API call.
- **Footer 운영자 소개 link** (`src/components/Footer.astro`): Added `<a href="/about">운영자 소개</a>` as the first link before 개인정보처리방침. New footer order: 운영자 소개 / 개인정보처리방침 / 이용약관 / 제휴문의.
- **About placeholder page** (`src/pages/about.astro`): Created with eyebrow ABOUT, title 운영자 소개, body "운영자 소개 내용은 준비 중입니다." No fabricated content. Benchmark URL `https://etfshopping.com/about` recorded as planning reference only — not fetched, copied, or embedded.
- **Home ad rail 3-slot structure**: Added `public/ads/home-rail/home-rail-sample-03.svg` (160×600 dark-blue placeholder SVG) and added third entry to `src/data/homeAdBanners.json`. `HomeRailAd.astro` unchanged — carousel reads JSON dynamically. Now rotates Sample Banner 01, 02, 03.
- **CSS additions** (`src/styles/style.css`): `.mp-notif-inner-row`, `.mp-notif-body`, `.mp-notif-body--disabled`, `.mp-watchlist-search-label`, `.mp-watchlist-section-label`, `.mp-watchlist-search-row`, `.mp-watchlist-input`, `.mp-watchlist-add-btn`, `.mp-watchlist-list`, `.mp-watchlist-item`, `.mp-watchlist-remove-btn`, `.mp-watchlist-empty`.
- **Static validators updated**: `check_mypage_shell_static_contract.mjs` extended to 49 checks (Phase 3AX spec, added quote/news API forbidden checks). `check_header_footer_shell_static_contract.mjs` extended to 35 checks (added about page, footer order, benchmark safety). `check_home_ad_slots_static_contract.mjs` created (30 checks). `check:home-ad-slots` script added to `package.json`.
- Validation: `check:mypage-shell` 49/49 PASS; `check:header-footer-shell` 35/35 PASS; `check:home-ad-slots` 30/30 PASS; `check:market-quote-card` 32/32 PASS; `npm run build` Complete (6.99s); `git diff --check` no errors.
- No notification persistence, no Telegram integration, no external ad script, no tracking, no Supabase mutation, no API/KIS/Vercel/deployment changes, no live calls, no secrets recorded. Claude memory files not modified.

## Phase 3AW - 2026-06-23

### My Page Account/Notification Shell Revision + Legal Footer Fix (Implemented)

- Created `docs/planning/phase_3aw_mypage_notification_footer_fix_result_v0.1.md`.
- **Footer layout fix** (`src/styles/style.css`): Added `min-height: 100vh; display: flex; flex-direction: column;` to `body` and `flex: 1 0 auto;` to `.site-main`. Fixes abnormal footer positioning on short pages like /privacy and /terms. Footer now anchors to the viewport bottom.
- **Account summary revisions** (`src/pages/mypage.astro`): Email now populated from `supabase.auth.getSession()` if available; 로그인 방식 set to "Google 로그인"; 계정 상태 row removed; 마지막 접속 일시 row added (from `user.last_sign_in_at`); 구독 상태 row added (defaults to "구독 안함").
- **Service section streamlined**: Removed 기본 시작 페이지, 기본 시장, 화면 테마, 시세 카드 표시 설정; added 공지사항 and 이벤트/혜택.
- **Data section streamlined**: Removed 최근 활동 and 데이터 관리; kept 포트폴리오 and 관심 종목.
- **Notification settings section added** (알림 설정): 내 텔레그램 연동 (placeholder, 준비 중), 관심종목 뉴스 알림 toggle, 내 포트 종목 뉴스 알림 toggle, 관심종목 지정가 알림 block (최대 5개, UI-only add form, 저장 기능은 준비 중), 이벤트/혜택 알림 toggle, 공지사항 알림 toggle. No persistence, no backend, no Telegram API.
- **Logout redirect** (`src/components/Header.astro`): Added `window.location.assign('/')` after sign-out. Logout now redirects to Home across all pages.
- **CSS additions**: Notification section styles (`.mp-notif-row`, `.mp-notif-block`, `.mp-toggle`, `.mp-toggle-input`, `.mp-toggle-track`, `.mp-add-btn`, `.mp-alert-*`).
- **Static validators updated**: `check_mypage_shell_static_contract.mjs` rewritten to 40 checks (Phase 3AW spec). `check_header_footer_shell_static_contract.mjs` extended to 26 checks (added logout redirect check).
- Validation: `check:mypage-shell` 40/40 PASS; `check:header-footer-shell` 26/26 PASS; `check:market-quote-card` 32/32 PASS; `npm run build` Complete (3.32s); `git diff --check` no errors.
- No backend deletion, no notification persistence, no Telegram integration, no Supabase mutation, no API/KIS/Vercel/deployment changes, no live calls, no secrets recorded.

## Phase 3AV - 2026-06-23

### My Page MVP Shell (Implemented)

- Created `docs/planning/phase_3av_mypage_mvp_shell_result_v0.1.md`.
- Modified `src/pages/mypage.astro` — replaced placeholder page with five-section MVP shell: 내 계정 (account summary, all placeholders), 서비스 이용 설정 (4 preference rows, all "향후 제공 예정"), 내 데이터 (4 data rows, all "준비 중"), 법적 고지 및 지원 (개인정보처리방침/이용약관/제휴문의 links), 계정 관리 (danger zone with 회원탈퇴 confirmation UI).
- 회원탈퇴 confirmation UI: clicking shows inline panel with exact required message "정말 회원 탈퇴하시겠습니까? 회원탈퇴하면 등록/활동 정보가 모두 삭제됩니다." with 확인 and 취소 choices. 확인 shows "회원탈퇴 기능은 준비 중입니다." — no deletion, no API call, no auth mutation. 취소 closes panel, no action.
- No actual deletion, no backend deletion, no auth/session change, no Supabase mutation, no API route change.
- Modified `src/styles/style.css` — added My Page shell CSS: `.mp-sections`, `.mp-section-title`, `.mp-info-list`, `.mp-info-row`, `.mp-placeholder`, `.mp-pref-list`, `.mp-pref-row`, `.mp-pref-label`, `.mp-badge`, `.mp-link-list`, `.mp-danger-zone`, `.mp-danger-title`, `.mp-danger-desc`, `.mp-danger-btn`, `.mp-withdrawal-confirm`, `.mp-withdrawal-message`, `.mp-withdrawal-actions`, `.mp-confirm-btn`, `.mp-withdrawal-notice`.
- Created `scripts/check_mypage_shell_static_contract.mjs` — 23 checks: file existence, required section headings, legal/support links, withdrawal UI, safety (no fetch, no Supabase, no deletion, no auth mutation, no localStorage, no console calls, no env reads, no KIS). All 23 PASS. Exit 0.
- Modified `package.json` — added `check:mypage-shell` script.
- Validation: `check:mypage-shell` 23/23 PASS; `check:header-footer-shell` 25/25 PASS; `check:market-quote-card` 32/32 PASS; `npm run build` Complete (3.11s); `git diff --check` no errors.
- No KIS, Supabase, Vercel, SQL, live HTTP, or `.env*` access. No account deletion, trading, or auth mutation logic. No secrets recorded.

## Phase 3AU - 2026-06-23

### Header and Footer UI Shell Implementation (Implemented)

- Created `docs/planning/phase_3au_header_footer_ui_shell_result_v0.1.md`.
- Modified `src/components/Header.astro` — added `마이페이지` anchor (`#mypage-btn`, `href="/mypage"`, starts hidden) between 로그인 and 로그아웃 in `.header-actions`. Updated `updateAuthButtons` to show/hide `mypageBtn` in `signed_in` and `signed_out`/`unavailable` branches respectively. Element order when signed-in: Today: 000 → theme toggle → 마이페이지 → 로그아웃.
- Modified `src/components/Footer.astro` — removed YouTube link; updated copyright to `© 2026 MK Stock Lab ver1.0`; added `<nav class="site-footer-links">` with 개인정보처리방침 (`/privacy`), 이용약관 (`/terms`), 제휴문의 (`https://forms.gle/WAVSxaotdes6T5yJA`, `rel="noopener noreferrer"`).
- Modified `src/styles/style.css` — `.site-footer` layout changed to `space-between`; added `.site-footer-copy`, `.site-footer-links`, `.site-footer-links a`, `.site-footer-links a:hover`, `a.header-button` rules.
- Created `src/pages/privacy.astro` — placeholder, `개인정보처리방침 내용은 준비 중입니다.`, no fabricated legal text.
- Created `src/pages/terms.astro` — placeholder, `이용약관 내용은 준비 중입니다.`, no fabricated legal text.
- Created `src/pages/mypage.astro` — placeholder, `마이페이지 기능은 준비 중입니다.`, no deletion or auth logic.
- Created `scripts/check_header_footer_shell_static_contract.mjs` — 25 checks across file existence, header My Page entry, footer content, placeholder page safety, and safety boundaries. All 25 PASS. Exit 0.
- Modified `package.json` — added `check:header-footer-shell` script.
- Build: `npm run build` complete (3.38s). `git diff --check` no errors.
- No KIS, Supabase, Vercel, SQL, live HTTP, or `.env*` access. No account deletion, trading, or auth mutation logic added.

## Phase 3AT - 2026-06-23

### Account Navigation, My Page, Footer Legal Links Roadmap (Planned)

- Created `docs/planning/phase_3at_account_mypage_footer_roadmap_v0.1.md`.
- **Status**: planned.
- **Execution mode**: Documentation-only roadmap. No source code, styles, API logic, auth logic, database, or Vercel configuration changed.
- **Header requirement**: Add `마이페이지` button to logged-in top-right controls. Recommended order: Today: 000 → theme toggle → 마이페이지 → 로그아웃. Button visible only in signed-in state; routes to `/mypage`.
- **My Page MVP proposal**: lightweight shell with account summary, service preferences, data summary, legal/support links, and danger zone (회원탈퇴 confirmation UI, no actual deletion).
- **Account deletion UX**: Required confirmation message: "정말 회원 탈퇴하시겠습니까? 회원탈퇴하면 등록/활동 정보가 모두 삭제됩니다." Choices: 확인 / 취소. Staged rollout: UI only first → policy decision → backend only after explicit owner approval.
- **Footer requirement**: Remove YouTube. Left: `© 2026 MK Stock Lab ver1.0`. Right: 개인정보처리방침 | 이용약관 | 제휴문의.
- **Partnership link**: `https://forms.gle/WAVSxaotdes6T5yJA` — external Google Form, opens in new tab with `rel="noopener noreferrer"`.
- **Privacy/Terms**: Content not yet provided. Do not fabricate legal text. Create placeholder pages until owner provides final content.
- **Roadmap**: Phase 3AU (header/footer shell) → Phase 3AV (My Page shell) → Phase 3AW (account deletion policy decision, explicit owner approval required).
- No implementation, source changes, API changes, auth changes, deployment, live calls, or `.env*` reads occurred in this planning task.

## Phase 3AS - 2026-06-23

### Market Live Quote Card UX Polish + Static Validation Hardening (Implemented)

- Created `docs/planning/phase_3as_market_live_quote_card_ux_polish_result_v0.1.md`.
- Modified `src/components/MarketLiveQuoteCard.astro` — UX and accessibility improvements: eyebrow updated to `시세 조회` (avoids "Live" overclaim); `aria-live="polite"` + `role="status"` added to unavailable state; `aria-label` added to retry and new-search buttons; hint text reordered; disabled note copy simplified; timestamp order corrected to `${timeStr} 기준`; TypeScript parameter types added to all script functions (fixes 14 pre-existing implicit `any` errors).
- Modified `src/styles/style.css` — `.mqc-submit` explicit `font-size: 14px`; `.mqc-result-label` `text-transform: uppercase` removed; `.mqc-result-time` `font-weight` reduced from 700 to 400.
- Modified `scripts/check_market_quote_card_static_contract.mjs` — extended from 23 to **32 checks**: added Vercel API URL absence, fetch target exclusivity regex, `localStorage`/`sessionStorage` absence, user-triggered event listener presence, secret/token pattern absence.
- **Validation results**: `check:market-quote-card` 32/32 passed; `check:kis-error-fallback` 40/40 passed; `npm run build` clean; `git diff --check` passed.
- **Scope**: Market page only. Feature flag default unchanged (disabled). No auto-fetch on page load. All 8 UX states preserved.
- No API/KIS/Supabase/Vercel/deployment/migration changes. No live network calls. No `KIS_ENABLE_MARKET_QUOTE_CARD` enablement. No other page integration.
- No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field value, raw error, or stack trace recorded.

## Phase 3AQ - 2026-06-23

### Owner-Run Preview Deployment Plan — Disabled Market Quote Card (Planned)

- Created `docs/planning/phase_3aq_owner_run_preview_deployment_disabled_card_plan_v0.1.md`.
- **Status**: planned.
- **Execution mode**: Documentation-only owner-run deployment procedure. No deployment, Vercel CLI, env mutation, HTTP request, or implementation change performed by Claude Code.
- **Target**: Owner-run Vercel Preview deployment only. Production deployment remains blocked.
- **Feature flag**: `KIS_ENABLE_MARKET_QUOTE_CARD` must remain absent or non-`"true"` for the first Preview deployment. The Market quote card will render only its compact disabled message — no script, no quote network request.
- **Active quote lookup**: Remains blocked in Phase 3AQ. Enabling the card in Preview requires a separate explicit owner approval in a later phase.
- **Decision basis**: Phase 3AP (`docs/planning/phase_3ap_preview_deployment_decision_v0.1.md`).
- **Owner pre-deployment checklist**: Verify `KIS_ENABLE_MARKET_QUOTE_CARD` absent/non-true, `KIS_ACCOUNT_NO` absent, Production env unchanged, no page expansion, existing Preview vars intact.
- **Owner deployment trigger options**: git push, owner-run empty commit, or Vercel dashboard redeploy. Claude Code must not trigger deployment.
- **Owner browser checklist**: Market page loads, disabled card visible, no auto-fetch, dashboard intact, Home/Chart AI/Portfolio/Lab unchanged, no raw KIS fields/tokens/errors visible.
- **Sanitized evidence format**: Owner should report using boolean/status format defined in document section 7. No actual Preview URLs, symbols, prices, secrets, or raw values.
- **Production KIS**: Remains blocked. `VERCEL_ENV=production` guard unchanged.
- **Expansion**: Home, Chart AI, Portfolio, Lab, AI analysis, portfolio integration, account/order/trading/balance/holdings/WebSocket features remain out of scope and unapproved.
- No source code, scripts, `package.json`, styles, API logic, KIS guard, Supabase logic, Vercel config, deployment, live KIS call, live Supabase query/write, SQL, HTTP request, env mutation, or `KIS_ENABLE_MARKET_QUOTE_CARD` enablement changed in this planning task.
- No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field value, raw error, or stack trace was recorded.

## Phase 3AP - 2026-06-23

### Preview Deployment Decision (Decided)

- Created `docs/planning/phase_3ap_preview_deployment_decision_v0.1.md`.
- **Status**: decided.
- **Execution mode**: Documentation-only decision. No deployment, Vercel CLI, env mutation, HTTP request, or implementation change performed.
- **Decision**: Proceed to owner-run Vercel Preview deployment in the next phase (Phase 3AQ) with `KIS_ENABLE_MARKET_QUOTE_CARD` absent or non-`'true'` (feature disabled by default).
- **First Preview deployment goal**: Validate build and render stability and Market page layout with the card in its disabled state only.
- **Enabling card in Preview**: Requires a separate explicit owner approval after disabled Preview deployment is confirmed stable. Not approved by this decision.
- **Production deployment**: Not approved. Production KIS remains blocked by `VERCEL_ENV=production` guard.
- **Expansion**: Home, Chart AI, Portfolio, Lab, AI analysis, portfolio integration, account/order/trading/balance/holdings/WebSocket features remain out of scope and unapproved.
- **Evidence basis**: Phase 3AN validation (check:market-quote-card 25/25, check:kis-error-fallback 40/40, build clean) and Phase 3AO owner browser review (no blocking issues reported, implementation commit 99ddbcf).
- No source code, scripts, `package.json`, styles, API logic, KIS guard, Supabase logic, Vercel config, deployment, live KIS call, live Supabase query/write, SQL, HTTP request, or env mutation changed in this decision task.
- No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field value, raw error, or stack trace was recorded.

## Phase 3AO - 2026-06-23

### Owner Browser Review — Market Live Quote Card (Passed)

- Created `docs/planning/phase_3ao_owner_browser_review_market_live_quote_card_result_v0.1.md`.
- **Status**: passed with no blocking issues reported.
- **Execution mode**: Documentation-only result recording. No implementation changes, no live execution.
- **Owner review summary**: The owner performed a browser review of the Phase 3AN Market page Live Quote Snapshot card (commit 99ddbcf) and reported that, overall, there were no notable issues. The review is recorded as passed.
- **Caveat**: The owner did not provide item-by-item checklist evidence against the Phase 3AN result document section 8 checklist. This record is based on the owner's summary judgment rather than detailed per-check proof.
- **Decision**: Phase 3AN implementation retained without immediate adjustment.
- **Expansion**: Home, Chart AI, Portfolio, Lab, and Heatmap remain outside the live quote integration scope. Separate explicit owner approval required before any additional surface is wired.
- **Production KIS**: Remains blocked. No change to `VERCEL_ENV=production` guard.
- No source code, scripts, `package.json`, styles, API logic, KIS guard, Supabase logic, or Vercel configuration changed in this result-recording task.
- No live KIS call, live Supabase query/write, SQL, Vercel CLI, Vercel env mutation, deployment, HTTP request, or `.env*` read occurred.
- No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field value, raw error, or stack trace was recorded.

## Phase 3AN - 2026-06-23

### Minimal Market Page Live Quote Card Implementation (Implemented)

- Created `src/components/MarketLiveQuoteCard.astro` — the Market page Live Quote Snapshot card. Supports `enabled: boolean` prop. When disabled, renders a compact "시세 조회를 사용할 수 없습니다." section; no script runs, no network request is made. When enabled, renders the full interactive card with all 8 UX states (disabled, idle, validation error, loading, fresh, cache-fresh, stale fallback, unavailable).
- Modified `src/components/MarketShell.astro` — added `MarketLiveQuoteCard` import, `isMarketQuoteCardEnabled` feature flag constant (reads `import.meta.env.KIS_ENABLE_MARKET_QUOTE_CARD`), and inserted `<MarketLiveQuoteCard enabled={isMarketQuoteCardEnabled} />` between the page header and the market dashboard section.
- Modified `src/styles/style.css` — added `.market-quote-card`, `.market-quote-card--disabled`, `.mqc-*` classes (new rules only; no existing rules modified).
- Created `scripts/check_market_quote_card_static_contract.mjs` — 25-check static validation script (no network, no `.env` reads).
- Modified `package.json` — added `"check:market-quote-card": "node scripts/check_market_quote_card_static_contract.mjs"`.
- Created `docs/planning/phase_3an_minimal_market_live_quote_card_result_v0.1.md`.
- **Status**: implemented — awaiting owner browser review (Phase 3AO).
- **Validation results**: `check:market-quote-card` 25/25 passed; `check:kis-error-fallback` 40/40 passed; `npm run build` clean; `git diff --check` passed.
- **Feature flag**: `KIS_ENABLE_MARKET_QUOTE_CARD` (Astro SSR env var, default disabled). Card not rendered when flag is absent or not `'true'`.
- **Critical rule**: No auto-fetch on page load. A network request to `/api/market/quote` is only issued after the user enters a valid 6-digit symbol and explicitly submits the form.
- **Sanitization**: No raw KIS fields, no raw errors, no stack traces, no secrets, no tokens, no hardcoded actual stock symbol, no hardcoded actual price, no console.log/console.error calls in the component.
- **Scope**: Market page only. Home, Chart AI, Portfolio, Lab, and Heatmap remain disconnected from live quote data.
- **Production KIS**: Remains blocked by `VERCEL_ENV=production` hard block. No Production endpoint validation performed.
- No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field, raw error, or stack trace was recorded.

## Phase 3AM - 2026-06-23

### Minimal UI Live Quote Integration Plan (Planned)

- Created `docs/planning/phase_3am_minimal_ui_live_quote_integration_plan_v0.1.md`.
- **Status**: planned — documentation-only. No implementation or live execution in this phase.
- **Follows**: Phase 3AL conditionally opened gate for a minimal UI live quote integration planning phase.
- **Recommended first UI surface**: Market page only (`src/components/MarketShell.astro`). Non-targets for first implementation: Home, Chart AI, Portfolio, Lab, Heatmap. Reasoning: Market page has the closest quote-data context, limits impact, and avoids conflating live quote display with AI analysis, portfolio, or account features.
- **Proposed placement**: A compact Live Quote Snapshot section inserted between the existing `<header class="page-header market-page-header">` and `<section class="market-dashboard">` in `MarketShell.astro`. No ad rail is present on the Market page; the Home page rail is unaffected.
- **Data contract**: Future implementation must use only the existing normalized `/api/market/quote` endpoint contract (`QuoteSnapshot` fields only; no raw KIS fields, no direct KIS or Supabase browser calls).
- **UX states defined**: idle, loading, fresh, cache-fresh, stale-fallback, unavailable, validation error, disabled/kill-switch.
- **Feature flag**: Recommended `KIS_ENABLE_MARKET_QUOTE_CARD` Astro SSR environment variable; default absent/false (card not rendered).
- **Direct UI implementation**: Remains blocked in this phase. Phase 3AN implementation requires a separate explicit owner approval after this plan is reviewed.
- **Production KIS**: Remains blocked by `VERCEL_ENV=production` hard block. No Production endpoint validation performed.
- **Account/order/trading/balance/holdings/WebSocket**: Remain entirely out of scope in all current and planned phases.
- **Acceptance criteria for Phase 3AN**: Build passes; all five check scripts pass; UI limited to Market page; feature disabled by default; all 8 UX states implemented; error states sanitized; no raw KIS fields or tokens visible; owner browser review checklist completed.
- No source code, scripts, `package.json`, API logic, KIS guard, Supabase logic, or Vercel configuration changed in this planning task.
- No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field, raw error, or stack trace was recorded.

## Phase 3AL - 2026-06-23

### Validation Sufficiency and UI Integration Gate Decision (Decided)

- Created `docs/planning/phase_3al_validation_sufficiency_ui_integration_gate_decision_v0.1.md`.
- **Status**: decided — gate conditionally opened for a minimal UI live quote integration planning phase.
- **Execution mode**: Documentation-only gate decision. No live KIS call, Supabase query/write, SQL, Vercel CLI, deployment, HTTP request, or UI wiring involved.
- **Evidence basis**: Phase 3AF successful-path owner-run Vercel Preview validation (14/14 criteria, `ForbiddenTermsFoundCount=0`) and Phase 3AK no-network mock harness (40/40 scenarios, all six groups A–F passed, `RawKisFieldsAbsent=true`, `ForbiddenTermsFoundCount=0`, build passed, no `src/` changes).
- **Gate outcome**: Sufficient to proceed to a minimal UI live quote integration planning phase (Phase 3AM). Direct UI implementation remains blocked in Phase 3AL and in Phase 3AM; actual UI wiring implementation requires a separate explicit owner approval after the Phase 3AM plan is reviewed.
- **Production KIS**: Remains blocked. The `VERCEL_ENV=production` hard block is in place. No Production endpoint has been validated or will be validated until a separate owner-approved production readiness phase.
- **Account/order/trading/balance/holdings/WebSocket**: Remain entirely out of scope. No planning or implementation in any current or planned phase.
- **Open limitations carried forward**: No live KIS outage validated; no live Supabase outage validated; Vercel cold-start token cache behavior uncharacterized; UI rendering not implemented; browser-side behavior untested.
- **Recommended next phase**: Phase 3AM — Minimal UI Live Quote Integration Plan (surface selection, UI state specification, data contract mapping, feature flag strategy, sanitization plan, browser review checklist, implementation boundary). Phase 3AN implementation only after explicit owner approval of the Phase 3AM plan.
- No source code, scripts, `package.json`, API logic, KIS guard, Supabase logic, or Vercel configuration changed in this decision task.
- No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field, raw error, or stack trace was recorded.

## Phase 3AK - 2026-06-23

### No-Network KIS Error/Fallback Validation Harness (Implemented, Passed)

- Created `scripts/check_kis_error_fallback_paths.mjs` — no-network mock-based validation harness for KIS error and fallback paths.
- Added `check:kis-error-fallback` npm script to `package.json`.
- Created `docs/planning/phase_3ak_no_network_kis_error_fallback_validation_result_v0.1.md`.
- **Status**: passed — 40/40 scenarios passed, exit code 0.
- **Execution mode**: Local no-network mock validation only. No live KIS call, no live Supabase query or write, no Vercel CLI, no deployment, no HTTP request was made.
- **Scenario groups**: (A) Runtime guard — 8 scenarios; (B) Env readiness — 6 scenarios; (C) Provider failure — 9 scenarios (token: 429, non-200, empty token, throws; quote: 429, non-200, rt_cd nonzero, missing price, throws); (D) Cache fallback — 6 state transitions; (E) Sanitization — 3 checks; (F) Request validation — 8 scenarios.
- **No-network enforcement**: `globalThis.fetch` overridden at script start to throw on any real network attempt. All provider logic uses injected `fetchFn`; all cache logic uses injected mock functions.
- **Forbidden output scan**: Zero forbidden terms found across all logged output lines and serialized result objects. `RawKisFieldsAbsent=true`, `ForbiddenTermsFoundCount=0`, `SecretsTokensRawErrorsAbsent=true`.
- **Synthetic env values**: Fake placeholder credentials used to satisfy presence checks only; never printed in output or recorded.
- **Env save/restore**: `process.env` fully restored in `finally` block after all tests.
- **UI live quote wiring**: Remains blocked. No page was connected to live quote data. Explicit owner approval is required before any UI integration phase proceeds.
- **Production KIS**: Remains blocked by `VERCEL_ENV=production` runtime guard (confirmed by Group A tests).
- **KIS_ACCOUNT_NO**: Must remain absent in all scopes by policy (Group A confirms block is active).
- No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field, raw error, or stack trace was recorded.
- No source code (`src/`) or API route logic was changed.

## Phase 3AJ - 2026-06-22

### KIS Error/Fallback Path Validation Plan (Planned)

- Created `docs/planning/phase_3aj_kis_error_fallback_path_validation_plan_v0.1.md`.
- **Status**: planned — no implementation or live execution in this phase.
- **Purpose**: Define a safe validation plan for KIS error, guard, and fallback behavior before any UI live quote integration is approved. Follows Phase 3AF (successful Preview path validation) and Phase 3AI (env scope cleanup).
- **Validation scenario groups defined**: (A) runtime guard classification, (B) env readiness, (C) provider failure paths (token + quote), (D) cache fallback state transitions, (E) API response sanitization, (F) request validation.
- **Recommended staged approach**: Phase 3AK (no-network mock/harness validation) → Phase 3AL (optional owner-run local validation if needed) → Phase 3AM (UI integration gate decision, requires explicit owner approval).
- **UI live quote wiring**: Remains blocked. No page (Home, Market, Chart AI, Lab, Portfolio) may be connected to live quote data until Phase 3AK passes and the owner explicitly approves a UI integration phase.
- **No source code, scripts, `package.json`, API logic, KIS runtime guard, Supabase logic, Vercel configuration, deployment, live KIS call, live Supabase query/write, SQL, Vercel CLI command, or HTTP request was involved in this planning task.**
- **No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field, raw error, or stack trace was recorded.**

## Phase 3AI - 2026-06-22

### Vercel Env Scope Cleanup Result (Owner-Run, Passed)

- Created `docs/planning/phase_3ai_vercel_env_scope_cleanup_result_v0.1.md`.
- **Status**: owner-confirmed pass.
- **Execution mode**: Owner-run. Claude Code did not access Vercel, mutate Vercel env, run Vercel CLI, deploy, call the Preview endpoint, make HTTP requests, run live KIS calls, run live Supabase queries/writes, or execute SQL.
- **Owner-run scope cleanup**: The owner performed Vercel environment scope cleanup outside Claude Code via the Vercel dashboard, resolving the Phase 3AF owner-approved Production and Preview env scope exception.
- **Redeploy trigger commit**: `20f21ec chore: trigger preview redeploy after env scope cleanup` — owner-run empty commit and push to trigger Preview redeployment after env scope cleanup.
- **Endpoint validation basis**: Phase 3AF sanitized Preview endpoint validation already passed (recorded in `phase_3af_owner_vercel_preview_endpoint_validation_result_v0.1.md`). No additional endpoint call was run by Claude Code in Phase 3AI.
- **Production live KIS**: Remains blocked by `VERCEL_ENV=production` runtime guard. Unchanged.
- **KIS_ACCOUNT_NO**: Must remain absent in all Vercel env scopes by policy.
- **UI live quote wiring**: Remains blocked pending explicit owner gate decision.
- No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field, raw error, or stack trace was recorded.
- No source code, scripts, `package.json`, API logic, KIS runtime guard, Supabase logic, Vercel configuration, or UI wiring changed in this result-recording task.
- The Phase 3AF dual-scope configuration is no longer the desired steady state. The official project record should reflect that the cleanup has been performed.

## Phase 3AH - 2026-06-22

### Global Page Gutter Second Pass (Implemented)

- Created `docs/planning/phase_3ah_global_page_gutter_second_pass_result_v0.1.md`.
- Modified `src/styles/style.css`: updated `--page-gutter-x` from `clamp(20px, 2.25vw, 40px)` (Phase 3AG) to `clamp(24px, 4vw, 72px)`.
- **Owner review finding**: Phase 3AG gutter change was too subtle; layout still felt cramped at 1280 px and 1440 px. This phase approximately doubles the growth rate (2.25 → 4 px per 100 px of viewport) and raises the maximum gutter from 40 px to 72 px.
- **Approximate gutter values**: ~51 px at 1280 px, ~58 px at 1440 px, 72 px at 1920 px (clamped max; `--page-max-width: 1500px` auto-centering then dominates).
- **Ad banner 160 × 600 preserved.** `.home-rail-viewport` (160 × 600), `.home-rail-ad` (160 px), `.home-sidebar-column` (min-width 160 px), and the 1440 px+ home shell grid (`minmax(0, 1fr) 176px`) are all unchanged.
- No separate mobile media query added; `body { min-width: 1080px }` means effective minimum rendered gutter is ~43 px; clamp floor is 24 px.
- All four gutter-consuming rules (`.site-header`, `.ticker-track`, `.nav-inner`, `.site-main`) continue to reference `var(--page-gutter-x)` unchanged from Phase 3AG.
- `npm run build`: pass. `git diff --check`: pass. Only `src/styles/style.css` and documentation files changed.
- No API, KIS, Supabase, Vercel, or deployment changes occurred. No live network calls were made. No UI live quote wiring was added. No secrets or price values were recorded.
- Owner browser review required at 1280 px, 1440 px, 1920 px, and mobile width to confirm the gutter feels right.

## Phase 3AG - 2026-06-22

### Global Page Gutter Layout Refinement (Implemented)

- Created `docs/planning/phase_3ag_global_page_gutter_layout_refinement_result_v0.1.md`.
- Modified `src/styles/style.css`: added `--page-gutter-x: clamp(20px, 2.25vw, 40px)` CSS variable; applied to `.site-header`, `.ticker-track`, `.nav-inner`, and `.site-main`; removed redundant `@media (max-width: 640px)` `.site-main` width override.
- **Ad banner 160 × 600 preserved.** `.home-rail-viewport` (160 × 600), `.home-rail-ad` (160 px), `.home-sidebar-column` (min-width 160 px), and the 1440 px+ home shell grid (`minmax(0, 1fr) 176px`) are all unchanged.
- **All app pages inherit the global gutter.** Home, Chart AI, Market, Lab, Portfolio, and any page using `Layout.astro` receive the gutter change through the shared `.site-main` rule.
- **Gutter values**: 20 px (mobile/narrow, clamped minimum) → ~29 px (1280 px viewport) → ~32 px (1440 px viewport) → 40 px (1920 px+, clamped maximum; `--page-max-width: 1500px` takes over beyond that).
- Header, ticker, nav, and main content left edges are now aligned to the same horizontal offset at every viewport size.
- `npm run build`: pass. `git diff --check`: pass. Only `src/styles/style.css` and documentation files changed.
- No API, KIS, Supabase, or Vercel/deployment changes occurred. No live network calls were made. No UI live quote wiring was added. No secrets or price values were recorded.
- Owner browser review required at 1280 px, 1440 px, 1920 px, and mobile width to confirm visual result.

## Phase 3AF Owner-Run Result - 2026-06-22

### Vercel Preview Endpoint Validation Result (Owner-Run, Passed)

- Created `docs/planning/phase_3af_owner_vercel_preview_endpoint_validation_result_v0.1.md`.
- Status: **passed**. Owner-run Vercel Preview endpoint validation of `/api/market/quote` succeeded.
- Owner configured Vercel environment variables outside Claude Code and called the Preview endpoint manually.
- Deployment Protection bypass used with owner-provided secret; bypass secret not recorded.
- Production and Preview env scopes were used as an owner-approved exception. Production live KIS remains blocked by the Phase 3AE runtime guard (`VERCEL_ENV=production` is an unconditional hard block regardless of env var scope).
- **Sanitized result**: HTTP 200, JSON parse ok, `Cache-Control: no-store`, `ok: true`, `data` and `fallback` objects present, all required normalized fields present (`market`, `symbol`, `price`, `currency`, `asOf`, `fallback.state`, `fallback.reason`), raw KIS fields absent, forbidden term count 0, secrets/tokens/raw errors absent.
- Actual stock symbol was redacted before recording (`<REDACTED_6_DIGIT_KR_CODE>`). Price value was not recorded. Preview URL was not recorded. Bypass secret was not recorded.
- No live KIS call was run by Claude Code. No live Supabase query or write was run by Claude Code. No SQL was executed. No Astro dev server was started. No Vercel CLI command was run. No Vercel env mutation was performed by Claude Code. No deployment was performed by Claude Code. No HTTP request was made by Claude Code.
- No source code, scripts, `package.json`, Vercel env, deployment, UI wiring, or KIS runtime guard was changed in this result-recording task.
- No actual symbol, price value, Preview URL, bypass secret, secret, token, raw KIS field, raw error, or stack trace was recorded.
- **Recommended future scope cleanup**: KIS credential env vars were set in both Production and Preview scopes as an owner-approved exception; removing them from Production scope is recommended.
- Production KIS remains blocked. UI live quote wiring remains blocked.

## Phase 3AF - 2026-06-22

### Vercel Preview Env Mutation, Deployment, and Endpoint Validation Owner-Run Plan (Planning-Only)

- Created `docs/planning/phase_3af_vercel_preview_env_deployment_endpoint_validation_owner_run_plan_v0.1.md`.
- Phase 3AF is planning-only / owner-run procedure documentation. No execution was performed.
- No Vercel CLI command was run.
- No Vercel environment variable was mutated.
- No deployment occurred.
- No Preview endpoint was called.
- No live KIS call was run by Claude Code.
- No live Supabase query or write was run by Claude Code.
- No SQL was executed.
- No Astro dev server was started.
- No source code or scripts were changed.
- No KIS runtime guard was changed.
- No UI wiring occurred.
- **Document defines**: A future owner-run Vercel Preview validation procedure covering: (1) Preview-only env var mutation via Vercel UI, (2) Preview deployment trigger, (3) sanitized `/api/market/quote` endpoint test, (4) evidence recording using boolean-only Section 12 template, (5) cleanup plan.
- **Required Preview env names (names only, no values)**: `KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL`, `KIS_ENABLE_LIVE_QUOTES=true`, `KIS_ENABLE_PREVIEW_LIVE_QUOTES=true`, `QUOTE_CACHE_BACKEND=supabase`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **`KIS_ACCOUNT_NO` must remain absent** in all scopes (Preview, Production, Development).
- **Production scope must not be changed** during any Phase 3AF execution step.
- **Includes**: PowerShell sanitized check template (Section 9), expected pass criteria table (Section 10), sanitized failure categories (Section 11), owner evidence template (Section 12), cleanup plan (Section 13), risk controls (Section 14).
- Any future Vercel env mutation, deployment trigger, or Preview endpoint test requires explicit owner execution only. Owner must complete the Section 5 approval checklist before any step.
- Production KIS remains blocked. UI wiring remains blocked.

## Phase 3AE - 2026-06-22

### Preview-Safe KIS Runtime Guard Implementation (Implemented and Locally Validated)

- Created `docs/planning/phase_3ae_preview_safe_kis_runtime_guard_result_v0.1.md`.
- Implements Phase 3AD Option B guard policy.
- **Source files changed**: `src/lib/server/providers/kisClient.ts`, `src/lib/server/providers/providerEnv.ts`, `src/lib/server/providers/types.ts`, `package.json`.
- **New files**: `scripts/check_kis_runtime_guard_policy.mjs`.
- `isProductionRuntime()` replaced by `classifyRuntime()` returning one of six explicit runtime classes: `local`, `vercel-preview`, `vercel-production`, `vercel-development`, `node-production`, `unknown`.
- `getKisQuoteConfigReadiness()` updated to:
  - Hard-block `vercel-production`, `node-production`, and `unknown` → `production_not_allowed`.
  - Block when `KIS_ACCOUNT_NO` is present → `production_not_allowed`.
  - Block `vercel-preview` without `KIS_ENABLE_PREVIEW_LIVE_QUOTES=true` → `preview_guard_required`.
  - Preserve existing `disabled`, `config_missing`, `ready` behavior for all other passing runtimes.
- `'preview_guard_required'` added to `ProviderConfigReadiness.reason` union in `types.ts`.
- `KIS_ENABLE_PREVIEW_LIVE_QUOTES` added to `ProviderEnvName` union and registry in `providerEnv.ts` with `productionAllowed: false`.
- **Validation commands**: `node --check scripts/check_kis_runtime_guard_policy.mjs` (pass), `npm run check:kis-runtime-guard` (7/7 pass), `npm run check:provider-boundaries` (pass), `npx tsc --noEmit` (pass), `npm run build` (pass), `git diff --check` (pass).
- **Production KIS**: Remains blocked — `VERCEL_ENV=production` is an absolute hard block, unchanged.
- **Preview KIS**: Allowed only when `VERCEL_ENV=preview` AND `KIS_ENABLE_PREVIEW_LIVE_QUOTES=true` AND `KIS_ENABLE_LIVE_QUOTES=true` AND credentials present AND `KIS_ACCOUNT_NO` absent.
- **Local KIS**: Unchanged.
- No Vercel env mutation occurred. No deployment occurred. No live KIS call was run. No live Supabase query or write was run. No SQL was executed. No Astro dev server was started. No UI live quote wiring was implemented. No `.env*` contents were read. No secret, token, key, raw KIS field, price value, or account data was recorded.
- Next step: Owner-approved Phase 3AF — Vercel Preview env mutation and deployment plan.

## Phase 3AD - 2026-06-22

### KIS Runtime Guard Preview/Production Decision (Decision-Only)

- Created `docs/planning/phase_3ad_kis_runtime_guard_preview_production_decision_v0.1.md`.
- Phase 3AD is decision-only. No code change, no execution.
- No source code was changed. `kisClient.ts` and `providerEnv.ts` are unchanged.
- No KIS guard was changed. `isProductionRuntime()` is unchanged.
- No Vercel env mutation occurred.
- No deployment occurred.
- No live KIS call was run.
- No live Supabase query/write was run.
- No SQL was executed.
- No Astro dev server was started.
- No UI wiring occurred.
- **Decision problem**: Current `isProductionRuntime()` returns `true` when `NODE_ENV === 'production'` OR `VERCEL_ENV === 'production'`. Vercel sets `NODE_ENV=production` in all deployed runtimes including Preview. Therefore, Vercel Preview live KIS is blocked under the current guard via the `NODE_ENV` branch even when `VERCEL_ENV=preview`.
- **Recommended option**: Option B — allow Vercel Preview live KIS only when `VERCEL_ENV=preview` AND a new explicit Preview guard env var (`KIS_ENABLE_PREVIEW_LIVE_QUOTES`) is set to `true`, in addition to existing `KIS_ENABLE_LIVE_QUOTES=true` and credential presence. Production hard block on `VERCEL_ENV=production` is unchanged. Local behavior is unchanged.
- **Production KIS**: Remain permanently blocked — `VERCEL_ENV=production` is an absolute hard block in the recommended option.
- **5-option decision matrix documented**: A (keep unchanged), B (Preview explicit opt-in — recommended), C (remove NODE_ENV block), D (runtime policy enum), E (defer all Vercel KIS testing).
- Risk assessment documented for: accidental Production enablement, Preview secret mis-scoping, NODE_ENV misclassification, ambiguous runtime, provider error exposure, premature UI wiring.
- Owner approval checklist provided for Phase 3AE implementation decision.
- Any future guard implementation requires explicit owner approval for both code change and Vercel Preview env mutation/deployment in separate phases.
- No project refs, secrets, price values, raw KIS fields, screenshots, raw errors, or stack traces recorded.

## Phase 3AC - 2026-06-22

### Vercel Preview Environment Validation Plan (Planning Only)

- Created `docs/planning/phase_3ac_vercel_preview_environment_validation_plan_v0.1.md`.
- Phase 3AC is planning-only. No execution occurred.
- No Vercel CLI command was run.
- No Vercel env mutation occurred.
- No deployment was triggered.
- No live KIS call was run by Claude Code.
- No live Supabase query/write was run by Claude Code.
- No SQL was executed.
- No Astro dev server was started.
- No source code or scripts were changed.
- No production KIS guard was changed.
- No UI wiring occurred.
- **Key finding**: The current `isProductionRuntime()` guard in `src/lib/server/providers/kisClient.ts` (lines 60–64) returns `true` when `NODE_ENV === 'production'` OR `VERCEL_ENV === 'production'`. Vercel sets `NODE_ENV=production` in all deployed runtimes, including Preview deployments. This means Preview live KIS calls are likely blocked by the `NODE_ENV` branch of the guard even when `VERCEL_ENV=preview`. Any live Preview KIS test will likely return `blocked_by_runtime_guard` without a separate guard-decision phase.
- Plan defines: 4-option decision matrix (plan-only / Preview env mutation only / Preview endpoint test / defer), recommended safe sequence (investigate runtime env first without secrets), future owner-run procedure, expected blocked case handling (`blocked_by_runtime_guard`), sanitized evidence template, rollback/cleanup procedure, and approval boundary.
- Any future Vercel env mutation, deployment, or Preview endpoint test requires explicit owner approval separate from this planning document.
- Any production guard change to allow `VERCEL_ENV=preview` requires a separate gate-decision planning phase and explicit owner approval before any code change.
- No project refs, secrets, price values, raw KIS fields, screenshots, raw errors, or stack traces recorded.

## Phase 3AB - 2026-06-22

### Owner-Run Live Supabase Persistent Cache + Live KIS Quote Validation Result

- Created `docs/planning/phase_3ab_owner_live_supabase_cache_kis_quote_validation_result_v0.1.md`.
- Status: passed.
- Owner ran `npm run smoke:supabase-cache-live-kis-quote:dry` in live-approved mode with real KIS and Supabase credentials.
- `guard-check`: passed — live approval guards verified.
- `runtime-check`: passed — `nodeEnvIsProduction=false`, `vercelEnvIsProduction=false`.
- `kis-accno-check`: passed — `kisAccnoAbsent=true`.
- `cache-backend-check`: passed — `configuredBackend=supabase`.
- `config-preflight`: passed — KIS and Supabase env names present.
- `first-call`: passed — `firstCallReason=provider-fresh` (live KIS fetch succeeded; quote written to in-memory Map and Supabase).
- `memory-flush`: passed — in-memory Map cleared; Supabase row untouched.
- `second-call`: passed — `secondCallReason=cache-fresh` (Supabase served the fresh row).
- `supabaseReadbackConclusive=true` — conclusive proof that Supabase persistent cache was written and read back correctly.
- `final-result`: passed — `mode=live-approved liveKis=true liveSupabase=true`.
- This is the first recorded end-to-end validation of: live KIS fetch → Supabase write → in-memory flush → Supabase readback → `cache-fresh`.
- Post-run shell environment cleanup was recommended separately but was not part of the provided harness output.
- No live KIS call by Claude Code — owner-run only.
- No live Supabase query/write by Claude Code.
- No SQL executed.
- No Astro dev server started by Claude Code.
- No Vercel command or environment mutation.
- No deployment.
- No source code, scripts, or `package.json` changed in this result-recording task.
- No production KIS guard changed.
- No UI wiring implemented.
- No actual stock symbol, price value, secret, token, key, raw KIS field, raw response body, account data, raw error, or stack trace recorded.
- Remaining unresolved areas: Vercel Preview environment validation, Vercel Production gate decision (Phase 3X Option A/B/C), UI live quote wiring, KIS rate-limit and error/fallback behavior, cold-start token cache behavior in Vercel.

## Phase 3AB - 2026-06-21

### Supabase Persistent Cache Live KIS Quote Harness Implementation (Option B)

- Created `scripts/owner_smoke_supabase_cache_live_kis_quote.mjs` — fail-closed owner-run harness.
- Added `smoke:supabase-cache-live-kis-quote:dry` script to `package.json`.
- Created `docs/planning/phase_3ab_supabase_persistent_cache_live_kis_quote_harness_result_v0.1.md`.
- Dry-run validation passed: all 26 output lines passed the forbidden output pattern scanner. No live KIS call. No live Supabase connection.
- Implementation uses Strategy 1 (in-process memory flush): first `getQuoteSnapshot()` call writes to memory + Supabase; `clearQuoteCacheForTests()` clears in-memory Map only; second `getQuoteSnapshot()` reads from Supabase → `cache-fresh`. This conclusively proves Supabase readback because the second `cache-fresh` response cannot come from the cleared in-memory Map.
- Dry-run mock: `supabaseAdmin.ts` replaced with an in-process stub backed by a `Map`; `options.provider` injected as a mock KIS provider returning a synthetic snapshot; `QUOTE_CACHE_BACKEND=supabase` set internally.
- Dry-run key results: `firstCallReason=provider-fresh`, `secondCallReason=cache-fresh`, `supabaseReadbackConclusive=true`, `mockUpsertCalled=true`, `mockSelectCalled=true`.
- TypeScript compiled to isolated `.astro/phase3ab-smoke-*/out/` temp directory; cleaned up in `finally` block.
- Forbidden output pattern blocks KIS credentials, Supabase credentials, `supabase.co`, raw KIS field names, `stack`, `trace`, and all other sensitive terms.
- Guard env var names required for live mode: `MK_STOCK_LAB_PHASE_3AB_LIVE_APPROVAL=OWNER_APPROVES_LIVE_KIS_AND_SUPABASE_CACHE_SMOKE`, `MK_STOCK_LAB_PHASE_3AB_LIVE_MODE=true`.
- Additional live mode requirements: `QUOTE_CACHE_BACKEND=supabase`, `KIS_ACCOUNT_NO` absent, non-production runtime, symbol via `MK_STOCK_LAB_PHASE_3AB_SYMBOL`.
- No live KIS call by Claude Code.
- No live Supabase query/write by Claude Code.
- No SQL executed.
- No Astro dev server started.
- No Vercel command or environment mutation.
- No deployment.
- No UI wiring.
- No production KIS guard changed.
- No secrets, price values, raw KIS fields, raw errors, or stack traces recorded.
- Live run requires explicit owner action (procedure documented in result file Section 7).

## Phase 3AB - 2026-06-21

### Supabase Persistent Cache Live KIS Quote Validation Plan (Planning Only)

- Created `docs/planning/phase_3ab_supabase_persistent_cache_live_kis_quote_validation_plan_v0.1.md`.
- Phase 3AB is planning-only. No live calls were run. No execution occurred.
- Plan defines a future owner-run validation for the combined path: live KIS quote response persisted to and read back from Supabase persistent quote cache through the full quote pipeline with `QUOTE_CACHE_BACKEND=supabase`.
- Remaining gap documented: Phase 3V validated Supabase cache independently with a synthetic payload; Phase 3Z validated local live KIS quote fetch and normalization with in-process mock cache; Phase 3AA validated the HTTP route response shape; none of these validated live KIS data flowing through Supabase persistent cache.
- Key finding: the current `/api/market/quote` response contract can distinguish `provider-fresh` from `cache-fresh` via `fallback.reason`, but cannot conclusively prove Supabase readback (vs memory readback) in the same process, because both backends are written simultaneously by `setConfiguredQuoteCacheEntry()`.
- Cold-start readback approach defined: a two-run procedure with a process restart between runs clears the in-memory cache, making a `cache-fresh` second-request response conclusively attributable to Supabase.
- Three execution options defined: Option A (manual cold-start), Option B (fail-closed harness using `clearQuoteCacheForTests()` for timing-reliable in-process Supabase readback proof), Option C (temporary instrumentation — least preferred).
- Recommended path: Option B harness, modeled after Phase 3Y, requiring explicit owner approval before implementation.
- TTL timing constraint documented: 15-second fresh TTL (`QUOTE_CACHE_FRESH_TTL_MS = 15_000`) makes Option A timing-sensitive.
- Safety gates defined: owner-run only, local non-production, `KIS_ACCOUNT_NO` absent, all secrets private, sanitized evidence only.
- Owner evidence template provided with cold-start two-run evidence fields.
- No live KIS call by Claude Code.
- No live Supabase query/write by Claude Code.
- No SQL executed.
- No Astro dev server started by Claude Code.
- No Vercel command or environment mutation.
- No deployment.
- No UI wiring.
- No source code or scripts changed.
- No production KIS guard changed.
- No project refs, secrets, price values, raw KIS fields, screenshots, raw errors, or stack traces recorded.
- Any future execution requires explicit owner approval.
- Harness implementation (Option B) requires explicit owner approval.

## Phase 3AA - 2026-06-21

### Owner-Run Manual Local HTTP Endpoint Verification Result

- Created `docs/planning/phase_3aa_owner_local_api_market_quote_http_endpoint_verification_result_v0.1.md`.
- Status: passed.
- Owner manually ran the Phase 3AA Option A procedure from `phase_3aa_local_api_market_quote_http_endpoint_verification_plan_v0.1.md`.
- Owner started local Astro dev server, sent `GET /api/market/quote?market=KR&symbol=<REDACTED_6_DIGIT_KR_CODE>`, and recorded sanitized boolean evidence only.
- All 11 success criteria passed: HTTP 200, JSON parse OK, `Cache-Control: no-store`, `ok: true`, `data` object present, `fallback` object present, required normalized public fields (`market`, `symbol`, `price`, `currency`, `asOf`) present, `fallback.state` and `fallback.reason` present, raw KIS fields absent, secrets/tokens/raw errors absent.
- `ForbiddenTermsFoundCount`: 0.
- Evidence was sanitized: no actual stock symbol recorded (replaced with `<REDACTED_6_DIGIT_KR_CODE>`), no price value recorded, no raw response body recorded, no raw KIS fields, no tokens, no keys, no account data, no raw errors, no stack traces.
- This is the first recorded successful end-to-end verification of the Astro `/api/market/quote` route with live KIS backing.
- Combined with Phase 3Z, the local server-side quote path from HTTP request through KIS provider to normalized JSON response is now validated locally.
- Supabase persistent cache live write/readback with a live KIS quote remains unvalidated.
- Vercel Preview behavior remains unvalidated.
- Vercel Production behavior remains blocked by `isProductionRuntime()` guard.
- Gate decision (Option A/B/C from Phase 3X) remains pending.
- UI wiring remains blocked.
- Phase 3AA Option B harness (`scripts/owner_smoke_api_quote_live.mjs`) remains unimplemented and requires explicit owner approval.
- No live KIS call by Claude Code.
- No live Supabase query/write by Claude Code.
- No SQL.
- No Supabase MCP DB query.
- No project listing.
- No production DB touch.
- No `.env*` read.
- No Vercel env mutation.
- No deployment.
- No source code changes.
- No script changes.
- No production KIS guard change.
- No UI live quote wiring.
- No project refs, secrets, screenshots, raw errors, or stack traces recorded.

### Local /api/market/quote HTTP Endpoint Verification Plan (Option A — Planning Only)

- Created `docs/planning/phase_3aa_local_api_market_quote_http_endpoint_verification_plan_v0.1.md`.
- This is documentation-only. No execution occurred.
- Document defines the owner-run procedure for verifying the local `/api/market/quote` HTTP endpoint with live KIS backing.
- Sections defined: objective, non-goals, safety gates, required env names, owner-run local procedure (9 steps), expected positive response shape, required absence checks, safe negative checks, owner evidence template, Option B approval boundary, and recommended next step.
- Phase 3AA target flow: HTTP GET → Astro route → `getQuoteSnapshot()` → cache check → KIS token+quote → normalization → `{ ok: true, data: QuoteSnapshot, fallback }` with `Cache-Control: no-store`.
- Phase 3AA is explicitly limited to local non-production only.
- `isProductionRuntime()` guard in `kisClient.ts` must be confirmed false before any HTTP request.
- `KIS_ACCOUNT_NO` must remain absent.
- Owner sets KIS env vars privately in the local shell; Claude Code must not read env values.
- Response evidence must be sanitized: field presence only, no actual price values, no raw KIS fields, no tokens, no keys, no account data, no raw errors, no stack traces.
- Option B harness (`scripts/owner_smoke_api_quote_live.mjs`) is not part of this phase and requires explicit owner approval.
- Harness implementation remains blocked until explicit owner approval.
- No live KIS call was run by Claude Code.
- No live Supabase query/write was run by Claude Code.
- No SQL executed.
- No Supabase MCP DB query.
- No project listing.
- No production DB touch.
- No `.env*` read.
- No Vercel env mutation.
- No deployment.
- No UI live quote wiring.
- No production KIS guard change.
- No source code changes.
- No project refs, secrets, screenshots, raw errors, or stack traces recorded.
- Recommended next action: owner reviews plan, then either runs manual procedure (Option A) or approves Option B harness.

## New Chat Handoff Pack - 2026-06-21

### Handoff Pack Creation

- Created `docs/planning/new_chat_handoff/` directory with five handoff files.
- Current completed phase recorded as Phase 3Z.
- Next recommended phase recorded as Phase 3AA.
- `CURRENT_STATE.md` — operational state snapshot including phase timeline, what is validated, what remains unvalidated, and blocked items.
- `NEXT_TASK_PROMPT.md` — copy-ready Phase 3AA instruction requiring Claude Code read-back before any implementation.
- `PROJECT_HANDOFF_INDEX.md` — source-of-truth file listing, safe startup commands, and expected read-back report structure.
- `NEW_CHAT_BOOTSTRAP_PROMPT.txt` — concise paste-ready bootstrap for a new ChatGPT chat.
- `HANDOFF_MANIFEST.json` — valid JSON manifest of project state, blocked actions, allowed startup actions, and secret handling policy.
- Handoff requires Claude Code repo read-back before any new implementation work begins.
- New chat must not rely on static summary alone.
- No live KIS call.
- No live Supabase query/write.
- No SQL.
- No Supabase MCP DB query.
- No project listing.
- No production DB touch.
- No `.env*` read.
- No Vercel env mutation.
- No deployment.
- No UI live quote wiring.
- No production KIS guard change.
- No source code changes.
- No project refs, secrets, screenshots, raw errors, or stack traces recorded.

## Phase 3Z - 2026-06-21

### Owner Local KIS Quote Smoke Result

- Recorded owner manual local KIS quote smoke result.
- Owner-provided sanitized output showed live-approved mode passed.
- `guard-check` passed — live-approved mode entered.
- `runtime-check` passed — local non-production runtime confirmed.
- `smoke-identity-validation` passed — KR market and 6-digit owner-selected symbol accepted.
- `account-env-check` passed — `KIS_ACCOUNT_NO` confirmed absent.
- `kis-env-preflight` passed — all required KIS config names present by boolean-only evidence.
- `runtime-setup` passed — TypeScript compiled to isolated temp directory.
- `provider-import` passed — live KIS client loaded.
- `quote-fetch` passed — live KIS quote received.
- `quote-normalization` passed — all required public fields present; `staleState=fresh`.
- `cache-backend-check` passed — `configuredBackend=supabase`; in-process mock used for Phase 3Y cache validation, not live Supabase.
- `cache-write` passed — in-process mock write.
- `fresh-readback` passed — `state=fresh` from mock.
- `cleanup-restore` passed — `action=deleted-smoke-cache-entry`.
- `final-result` passed — `liveKis=true quoteNormalized=true cacheValidated=true`.
- This is the first recorded successful local live KIS quote smoke.
- Supabase persistent cache write/readback with live KIS quote remains unvalidated.
- `/api/market/quote` live endpoint remains unvalidated.
- UI live quote wiring remains blocked.
- Production KIS guard unchanged.
- No live KIS call by Claude Code.
- No live Supabase query/write by Claude Code.
- No SQL.
- No Supabase MCP DB query.
- No project listing.
- No production DB touch.
- No `.env*` read.
- No Vercel env mutation.
- No deployment.
- No UI live quote wiring.
- No production KIS guard change.
- No project refs, secrets, screenshots, raw errors, or stack traces recorded.
- Recommended next action: Phase 3AA local `/api/market/quote` endpoint verification phase, only after owner approval.

## Phase 3Y - 2026-06-21

### Local KIS Quote Smoke Harness

- Created `scripts/owner_smoke_kis_quote_live.mjs` — fail-closed, owner-run, local-only KIS quote smoke harness.
- Added `smoke:kis-quote-live:dry` npm script.
- Harness is fail-closed and defaults to dry-run/mock mode.
- Live KIS mode requires all five owner approval guard env vars with exact required values.
- Live KIS mode rejects production runtime (`NODE_ENV` or `VERCEL_ENV` equals `production`) with `PRODUCTION_RUNTIME_NOT_ALLOWED`.
- Live KIS mode rejects `KIS_ACCOUNT_NO` presence with `ACCOUNT_ENV_NOT_ALLOWED` — quote-only scope enforced.
- Harness checks only env name presence for KIS config, never values.
- Harness uses stub KIS provider in dry-run mode — no live KIS code loaded.
- Harness uses in-process mock cache for cache-write, fresh-readback, cleanup-restore steps in both modes.
- Harness emits sanitized `phase3y step=... status=... sanitized=true` output only.
- Forbidden output pattern blocks raw KIS fields, credentials, tokens, secrets, and stack traces.
- Step labels implemented: guard-check, runtime-check, smoke-identity-validation, account-env-check, kis-env-preflight, runtime-setup, provider-import, quote-fetch, quote-normalization, cache-backend-check, cache-write, fresh-readback, cleanup-restore, final-result, dry-run-guard-sim, dry-run-runtime-sim, dry-run-env-sim, dry-run-identity-sim, dry-run-account-env-sim.
- Dry-run/mock validation passed — all 32 output lines confirmed.
- `wouldEmitGuardNotApproved=true`, `currentRuntimeIsProduction=false`, `wouldEmitKisConfigMissing=true`, `errorDetected=true`, `accountEnvCurrentlyAbsent=true` all confirmed.
- `npm run check:provider-boundaries` passed.
- `npx tsc --noEmit` passed.
- `npm run build` passed.
- No live KIS call by Claude Code.
- No live Supabase query/write by Claude Code.
- No SQL.
- No Supabase MCP DB query.
- No project listing.
- No production DB touch.
- No `.env*` read.
- No Vercel env mutation.
- No deployment.
- No UI live quote wiring.
- No production KIS guard change.
- No project refs, secrets, screenshots, raw errors, or stack traces recorded.
- Recommended next action: owner manually runs local KIS quote smoke and records sanitized output in Phase 3Z.

## Phase 3X - 2026-06-21

### Vercel Environment Readiness And KIS Production Gate Decision Plan

- Created Vercel env readiness and KIS production gate decision plan.
- Recorded Phase 3W baseline: Phase 3V cache smoke passed; KIS live end-to-end flow unvalidated; UI live quote wiring blocked; Vercel env mutation blocked.
- Recorded that KIS live provider end-to-end flow remains unvalidated.
- Recorded that UI live quote wiring remains blocked.
- Documented required env names by names only, without values.
- Documented secret/non-secret/project-identifying variable classification.
- Documented local vs Vercel Preview vs Vercel Production readiness strategy.
- Documented current production KIS guard behavior: `isProductionRuntime()` returns `production_not_allowed` when `NODE_ENV` or `VERCEL_ENV` is `production`; fail-closed regardless of env var values.
- Documented that setting Vercel Production env values alone does not enable production KIS calls.
- Documented production KIS gate decision options: Option A (keep production blocked), Option B (Preview-only live KIS), Option C (production read-only KIS behind multiple gates).
- Recommended local owner-run KIS smoke (Phase 3Y) before any Vercel mutation, production guard code change, deployment, or UI wiring.
- Documented owner approval gates for: local KIS env check, live KIS call, Vercel env mutation, production guard code change, deployment, server-side HTTP smoke, UI wiring, Portfolio/Chart AI integration, account-context variable setup.
- Documented future phase sequence: Phase 3Y (local KIS smoke), Phase 3Z (result recording), Phase 3AA (API endpoint verification), Phase 3AB (gate decision), Phase 3AC (Vercel env and deployment), Phase 3AD (controlled UI wiring).
- No code changes.
- No live KIS call.
- No live Supabase query/write.
- No SQL.
- No Supabase MCP DB query.
- No project listing.
- No production DB touch.
- No `.env*` read.
- No Vercel env mutation.
- No deployment.
- No UI live quote wiring.
- No project refs, secrets, screenshots, raw errors, or stack traces recorded.
- Recommended next action: Phase 3Y local owner-run KIS quote smoke harness plan or implementation, only after owner approval.

## Phase 3W - 2026-06-21

### Controlled Live Quote Integration Readiness Plan

- Created controlled live quote integration readiness plan.
- Recorded that Phase 3V persistent quote cache live smoke passed.
- Recorded that the Phase 3V smoke used a synthetic normalized quote snapshot, not a live KIS provider response.
- Recorded that KIS live provider end-to-end flow remains unvalidated.
- Recorded that UI live quote wiring remains blocked.
- Recorded critical production runtime constraint: `kisClient.ts` `isProductionRuntime()` guard blocks KIS calls in production regardless of env var values — setting Vercel env vars alone is not sufficient.
- Defined target end-to-end flow: KIS token fetch → quote fetch → normalization to `QuoteSnapshot` → cache write → API response shape.
- Defined production environment readiness requirements by variable names only, without values.
- Identified KIS secret env names (`KIS_APP_KEY`, `KIS_APP_SECRET`), non-secret feature flags (`KIS_ENABLE_LIVE_QUOTES`), and infrastructure names (`KIS_BASE_URL`).
- Identified `KIS_ACCOUNT_NO` as optional, not needed for quote-only phase, not to be set until account-context phase is approved.
- Defined live provider testing safety gates: runtime confirmation, quota/rate-limit risk acceptance, read-only scope, no account APIs.
- Defined recommended future phase sequence: Phase 3X (Vercel env checklist), Phase 3Y (local KIS smoke harness), Phase 3Z (result recording), later phase (API endpoint verification), later phase (controlled UI wiring).
- Defined first UI surface recommendation: read-only single-stock Market page quote display, only after server-side API smoke passes.
- Explained why not Portfolio valuation or Chart AI first.
- Defined API response verification checklist for future owner manual smoke.
- Defined explicit non-goals: no UI wiring, no live calls, no env mutation, no deployment, no trading/account APIs, no WebSocket.
- No live KIS call.
- No live Supabase query/write.
- No SQL.
- No Supabase MCP DB query.
- No project listing.
- No production DB touch.
- No `.env*` read.
- No Vercel env mutation.
- No deployment.
- No UI live quote wiring.
- No project refs, secrets, screenshots, raw errors, or stack traces recorded.
- Recommended next action: owner reviews plan; if approved, start Phase 3X Vercel production env readiness checklist.

## Phase 3V - 2026-06-21

### Owner Live Smoke Retry Result

- Owner manually ran the Phase 3U-improved live smoke retry.
- Runtime config presence was confirmed by owner with boolean-only evidence.
- All three required Supabase config names were present in the owner shell (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- Owner-provided sanitized live smoke output recorded in Phase 3V result document.
- `guard-check` passed — live-approved mode entered, backup risk acknowledged.
- `smoke-identity-validation` passed.
- `runtime-setup` passed.
- `adapter-import` passed.
- `admin-import` passed.
- `config-preflight` passed — all three required config names present.
- `client-construction` passed — Supabase admin client constructed without error.
- `precheck-read` passed.
- `existing-row-snapshot` passed — reported `existingRowFound=false` (no pre-existing row).
- `success-write` passed — normalized public quote snapshot written to `market_quote_cache`.
- `fresh-readback` passed.
- `stale-readback` passed.
- `failure-metadata-write` passed.
- `cleanup-restore` passed — `action=deleted-smoke-row` (smoke row deleted; no original row to restore).
- `final-result` passed — `mode=live-approved liveSupabase=true cacheKeyNormalized=true originalRowExisted=false`.
- Persistent quote cache owner live smoke retry passed.
- UI live quote wiring remains blocked.
- Created `docs/planning/phase_3v_owner_live_smoke_retry_result_v0.1.md`.
- Updated `docs/planning/planning_changelog.md` with Phase 3V entry.
- Updated `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md` with Phase 3V Korean owner review checklist.
- Claude Code did not rerun live smoke.
- Claude Code did not run live Supabase query/write.
- Claude Code did not execute SQL.
- Claude Code did not use Supabase MCP DB tools.
- Claude Code did not list projects.
- Claude Code did not touch production DB.
- Claude Code did not read `.env*` contents.
- Claude Code did not mutate Vercel env.
- Claude Code did not deploy.
- No project refs, Supabase URLs, keys, tokens, connection strings, screenshots, raw DB errors, stack traces, or secret-bearing output were recorded.
- Recommended next action: separate owner-approved planning/implementation phase for controlled live quote integration readiness; UI live quote wiring remains blocked until approved.

## Phase 3U - 2026-06-21

### Owner Live Smoke Diagnostic Improvement

- Created `docs/planning/phase_3u_owner_live_smoke_diagnostic_improvement_result_v0.1.md`.
- Improved `scripts/owner_smoke_persistent_quote_cache_live.mjs` with owner-safe step-level diagnostic labels.
- Changed harness output prefix from `phase3s` to `phase3u`.
- Added `logStep(step, status, extra)` helper emitting structured `phase3u step=... status=... sanitized=true` lines.
- Added `checkLiveConfigPresence()` that checks only presence of required config names in `process.env`, never values.
- Added config preflight step in live mode, running after admin import and before Supabase client construction.
- Separated failure paths for: guard evaluation, smoke identity validation, runtime setup, adapter import, admin import, config presence, client construction, precheck read, existing-row snapshot, success write, fresh readback, stale readback, failure metadata write, cleanup/restore, and final result.
- Reduced `UNEXPECTED_SAFE_FAILURE` to last-resort only in the top-level `.catch()` handler.
- Updated top-level `.catch()` to use `console.log` directly, avoiding re-triggering `logSafe` in the catch path.
- Updated `logSafe` to emit `SAFE_OUTPUT_BLOCKED` via `console.log` before throwing, so the owner sees a named blocked notice.
- Added `runDryRunSimulations()` logging guard detection, config presence detection, and identity validation simulation results after a successful dry-run smoke.
- Added `process.env` fallback to `src/lib/server/supabaseAdmin.ts` for `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` so the owner-run Node harness can supply these without relying on `import.meta.env`, which is Astro-runtime-only.
- Astro runtime behavior unchanged: `import.meta.env.*` takes precedence via `??`.
- Browser safety unchanged: `assertServerRuntime()` throws before any config access.
- Fail-closed live mode preserved: all six required live approval guards remain unchanged.
- Dry-run mode continues to use a mock Supabase client and never imports the live admin helper.
- No live smoke was rerun by Claude Code.
- No live Supabase query or write was executed by Claude Code.
- No SQL was executed by Claude Code.
- No Supabase MCP database query was run by Claude Code.
- No Supabase project listing was run.
- No Supabase connection was attempted by Claude Code.
- No production DB was touched by Claude Code.
- No ignored `.env*` contents were read.
- No Vercel environment values were read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No UI live quote wiring was implemented.
- No migration files were modified.
- No production SQL pack files were modified.
- No root `README.md` was modified.
- No project refs, Supabase URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, screenshots, raw DB errors, stack traces, or secret-bearing outputs were recorded.
- Validation passed:
  - `npm run smoke:persistent-quote-cache-live:dry`
  - `node scripts/smoke_persistent_quote_cache_adapter.mjs`
  - `node scripts/smoke_quote_cache_policy.mjs`
  - `node scripts/smoke_market_quote_route_disabled.mjs`
  - `npm run check:provider-boundaries`
  - `npx tsc --noEmit`
  - `npm run build`
- Dry-run output confirmed all step labels present and sanitized, `dry-run-config-sim` reported `wouldEmitConfigMissing=true`, and cleanup-restore label appeared in mock success path.
- Recommended next action: owner manually runs a live smoke retry as a separate approved Phase 3V or equivalent result phase, after setting required config names in the runtime environment.

## Phase 3T - 2026-06-21

### Owner Live Smoke Failed Result

- Created `docs/planning/phase_3t_owner_live_smoke_failed_result_v0.1.md`.
- Recorded the owner-provided sanitized Phase 3S live smoke output.
- Owner manually ran the Phase 3S live smoke.
- Live-approved mode was entered.
- The backup risk acceptance flag was accepted by the harness.
- The live smoke failed with `UNEXPECTED_SAFE_FAILURE`.
- The output was sanitized.
- Persistent adapter live enablement is not passed.
- Write/upsert success was not concluded.
- Readback success was not concluded.
- Cleanup/restore success was not concluded.
- UI live quote wiring remains blocked.
- Static code-path inspection was performed.
- The broad failure boundary is after the live-approved and backup-risk log lines, before any labeled smoke step or cleanup line was reported.
- Static diagnosis identified setup/import/config/client-construction/precheck boundaries as likely broad failure regions.
- A specific static risk is that the owner-run Node harness imports the Supabase admin helper outside the Astro runtime while that helper resolves public Supabase config through `import.meta.env`.
- Corrective action is needed before any live retry.
- Recommended next action: Phase 3U safe diagnostic improvement before any owner manual live retry.
- Codex did not rerun the live smoke.
- Codex did not run live Supabase query or write.
- Codex did not execute SQL.
- Codex did not use Supabase MCP database tools.
- Codex did not list projects.
- Codex did not attempt a Supabase connection.
- Codex did not touch production DB.
- Codex did not read ignored `.env*` contents.
- Codex did not mutate Vercel environment values.
- Codex did not deploy.
- No project refs, Supabase URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, screenshots, raw DB errors, stack traces, or secret-bearing outputs were recorded.
- Build was skipped because Phase 3T changed documentation only.

## Phase 3S - 2026-06-21

### Persistent Quote Cache Enablement Smoke Harness

- Created `docs/planning/phase_3s_persistent_quote_cache_enablement_smoke_harness_result_v0.1.md`.
- Added `scripts/owner_smoke_persistent_quote_cache_live.mjs`.
- Added `npm run smoke:persistent-quote-cache-live:dry`.
- Prepared an owner-run persistent adapter live smoke harness.
- The live smoke harness is fail-closed.
- Live mode requires all explicit owner approval flags before any live Supabase access can occur:
  - `QUOTE_CACHE_BACKEND=supabase`
  - `PHASE_3S_LIVE_SMOKE=OWNER_APPROVED`
  - `PHASE_3S_TARGET_CONFIRMED=production-or-controlled-runtime-confirmed`
  - `PHASE_3S_BACKUP_RISK_ACCEPTED=OWNER_ACCEPTS_CURRENT_RISK`
  - owner-selected `PHASE_3S_SMOKE_MARKET`
  - owner-selected `PHASE_3S_SMOKE_SYMBOL`
- Dry-run/mock validation passed.
- The dry-run path uses a mock Supabase client and does not import the live Supabase admin helper.
- The harness validates normalized cache-key creation, success write, readback, fresh classification, stale classification, sanitized failure metadata update, and cleanup/delete behavior.
- The live path includes a cleanup/restore strategy for the selected smoke cache key.
- No live Supabase query or write was executed by Codex.
- No SQL was executed by Codex.
- No Supabase MCP database query was run by Codex.
- No Supabase project listing was run.
- No Supabase connection was attempted by Codex.
- No production DB was touched by Codex.
- No live KIS call was run by Codex.
- No UI live quote wiring was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No root `README.md` change was made.
- No migration file change was made.
- No production SQL pack file change was made.
- No project refs, project URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, screenshots, or secret-bearing outputs were recorded.
- Validation passed:
  - `npm run smoke:persistent-quote-cache-live:dry`
  - `node scripts/smoke_persistent_quote_cache_adapter.mjs`
  - `node scripts/smoke_quote_cache_policy.mjs`
  - `node scripts/smoke_market_quote_route_disabled.mjs`
  - `npm run check:provider-boundaries`
  - `npx tsc --noEmit`
  - `npm run build`
- Browser/static output scans found no provider secret markers or server-only markers.
- Recommended next action: owner manually runs the live smoke only after confirming runtime target and risk acceptance, then records sanitized pass/fail results in a separate phase.

## Phase 3R - 2026-06-21

### Persistent Quote Cache Adapter

- Created `docs/planning/phase_3r_persistent_quote_cache_adapter_result_v0.1.md`.
- Implemented a server-only persistent Supabase quote cache adapter for `market_quote_cache`.
- Kept the adapter disabled by default.
- Preserved the in-memory quote cache as the default backend.
- Added the non-secret `QUOTE_CACHE_BACKEND` runtime switch; only the explicit value `supabase` selects the persistent adapter.
- Added normalized cache-key handling using `quote:{market}:{UPPER_SYMBOL}`.
- Added persistent cache read support with fresh, stale-but-usable, expired, and miss classification.
- Added success upsert support for normalized public quote snapshots only.
- Added sanitized refresh-failure metadata write support for existing cache rows.
- Reused the existing server-only Supabase admin helper without printing or resolving environment values during validation.
- Adjusted the Supabase admin helper so mock-only Node validation can import server code without resolving env values at module load time.
- Updated the quote service to use the configured cache backend while preserving default memory behavior.
- Strengthened provider/server boundary validation against client imports of server modules and the persistent quote cache adapter.
- Added `scripts/smoke_persistent_quote_cache_adapter.mjs`.
- Added `npm run smoke:persistent-quote-cache`.
- Raw KIS payloads are not persisted.
- Provider headers, authorization headers, app keys, tokens, account numbers, raw errors, stack traces, DB URLs, connection strings, user IDs, portfolio IDs, and position IDs are not persisted.
- No UI live quote wiring was implemented.
- No live Supabase query or write was executed by Codex.
- No Supabase MCP database query was run by Codex.
- No Supabase project listing was run.
- No Supabase connection was attempted by Codex.
- No SQL was executed by Codex.
- No production DB was touched by Codex.
- No live KIS call was run by Codex.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No root `README.md` change was made.
- No migration file change was made.
- No production SQL pack file change was made.
- No project refs, project URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, screenshots, or secret-bearing outputs were recorded.
- Validation passed:
  - `node scripts/smoke_persistent_quote_cache_adapter.mjs`
  - `node scripts/smoke_quote_cache_policy.mjs`
  - `node scripts/smoke_market_quote_route_disabled.mjs`
  - `npm run check:provider-boundaries`
  - `npx tsc --noEmit`
  - `npm run build`
- Vercel output artifacts were generated: `.vercel/output/config.json`, `.vercel/output/functions/_render.func`, and `.vercel/output/static`.
- Browser/static output scans found no provider secret markers or server-only markers.
- Recommended next action: run a separate owner-approved persistent adapter enablement/API smoke before any UI live quote wiring.

## Phase 3Q - 2026-06-21

### Production Migration Execution Result

- Created `docs/planning/phase_3q_production_migration_execution_result_v0.1.md`.
- Owner manually executed the Phase 3P production Dashboard SQL script pack in Supabase SQL Editor.
- Owner reported production target confirmation passed.
- Owner reported disposable/non-production target was not selected.
- Owner reported the production project is on Free Plan.
- Owner reported dashboard-native scheduled backup, PITR, or snapshot was unavailable.
- Owner explicitly accepted the backup-unavailable risk before running Script 02.
- Script 01 production prechecks passed.
- Script 01 final row `safe_to_apply_phase_3m_migration` passed.
- Script 02 Phase 3M migration application passed.
- Script 03 post-migration validation passed.
- Script 03 RLS/grants preserved passed.
- Script 04 cleanup-none confirmation passed.
- Production DB changed by owner manual execution, not by Codex.
- Rollback or corrective action was not needed according to the owner-provided sanitized result.
- No SQL was executed by Codex.
- No Supabase MCP database query was run by Codex.
- No Supabase project listing was run.
- No Supabase connection was attempted by Codex.
- No Supabase write occurred by Codex.
- No production DB was touched by Codex.
- No project refs, project URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, screenshots, or secret-bearing outputs were recorded.
- No app source files changed.
- No migration files changed.
- No production SQL pack files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No persistent cache adapter was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3Q changed documentation only.
- Recommended next action: approve the next implementation phase only after owner review, with persistent cache adapter work kept separate.

## Phase 3P - 2026-06-21

### Production Dashboard SQL Execution Pack

- Created `docs/planning/phase_3p_production_dashboard_sql_execution_pack_v0.1.md`.
- Created production SQL pack files under `docs/planning/sql_production/`.
- Prepared production Dashboard SQL precheck and execution pack for `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
- Created read-only production precheck script with stop-before-migration pass/fail rows and `safe_to_apply_phase_3m_migration`.
- Created production migration script whose executable body matches the disposable-validated Phase 3M migration after safety comments.
- Created read-only post-migration validation script with schema, constraint, index, backfill, RLS, grant, public-read, service-role, and overall validation rows.
- Created no-write production cleanup confirmation script.
- Production migration remains manual owner action and is not considered executed by this phase.
- No SQL was executed by Codex.
- No Supabase MCP database query was run.
- No Supabase project listing was run.
- No Supabase connection was attempted by Codex.
- No Supabase write occurred by Codex.
- No production DB was touched by Codex.
- No project refs, project URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, screenshots, or secret-bearing outputs were recorded.
- No app source files changed.
- No migration files changed.
- No Phase 3N.6 validation SQL files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No persistent cache adapter was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3P changed documentation and planning SQL files only.
- Recommended next action: owner reviews the pack, confirms backup/rollback and production target, then manually executes only if explicitly approved.

## Phase 3O - 2026-06-21

### Production Migration Approval Plan

- Created `docs/planning/phase_3o_production_migration_approval_execution_plan_v0.1.md`.
- Prepared a production migration approval and execution plan for `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
- Recorded that Phase 3N.7 disposable validation passed based on owner-provided sanitized results.
- Defined production target separation checks using only non-secret labels.
- Defined production readiness checklist, backup/rollback policy, precheck plan, execution sequence, post-migration validation plan, abort conditions, owner approval wording, and sanitized future result template.
- Production migration remains blocked until a separate explicit owner approval.
- No SQL was executed.
- No Supabase MCP database query was run.
- No Supabase project listing was run.
- No Supabase connection was attempted by Codex.
- No Supabase write occurred by Codex.
- No production DB was touched.
- No project refs, project URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, screenshots, or secret-bearing outputs were recorded.
- No app source files changed.
- No migration files changed.
- No planning SQL files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No persistent cache adapter was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3O changed documentation only.
- Recommended next action: owner review and separate Phase 3P approval only if production execution should proceed.

## Phase 3N.7 - 2026-06-21

### Dashboard SQL Validation Result

- Created `docs/planning/phase_3n7_dashboard_sql_validation_result_v0.1.md`.
- Owner manually ran the Phase 3N.6 SQL pack in the disposable Supabase Dashboard SQL Editor.
- Owner reported all sanitized validation results passed.
- Target category remains `disposable-remote-approved`.
- Phase 3M migration disposable validation is recorded as passed based on owner-provided sanitized results.
- Validated migration: `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
- Step 01 baseline/fixture SQL passed.
- Synthetic rows insertion passed.
- Step 02 Phase 3M migration application passed.
- Step 03 schema validation passed.
- Step 03 constraint/index validation passed.
- Step 03 backfill validation passed.
- Step 03 RLS/grant validation passed.
- Step 04 negative validation passed.
- Step 05 cleanup passed.
- No SQL was executed by Codex.
- No Supabase MCP database query was run by Codex.
- No Supabase project listing was run.
- No Supabase connection was attempted by Codex.
- No Supabase write occurred by Codex.
- No production DB was touched.
- No project refs, project URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, screenshots, or secret-bearing outputs were recorded.
- No app source files changed.
- No migration files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No persistent cache adapter was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3N.7 changed documentation only.
- Recommended next action: prepare a separate production migration approval and execution plan, or proceed to the next implementation phase only after owner approval.

## Phase 3N.6 - 2026-06-21

### Dashboard SQL Validation Pack

- Created `docs/planning/phase_3n6_dashboard_sql_validation_pack_v0.1.md`.
- Created dashboard SQL validation scripts under `docs/planning/sql_validation/`.
- Prepared a manual Supabase Dashboard SQL Editor validation pack for `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
- Included baseline table detection and instructions to run `supabase/migrations/20260615_rebuild_schema_v0_1.sql` manually if the disposable project lacks the baseline table.
- Included synthetic public-safe quote cache fixtures for `KR` `005930` and `KR` `000660`.
- Included a copy-ready Phase 3M migration script without modifying the migration file.
- Included schema, constraint, index, backfill, RLS, grant, and negative validation queries.
- Included cleanup SQL limited to the synthetic validation rows.
- No SQL was executed by Codex.
- No Supabase MCP database query was run.
- No Supabase project listing was run.
- No Supabase connection was attempted by Codex.
- No Supabase write occurred by Codex.
- No production DB was touched.
- No project refs, project URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, or secret-bearing outputs were recorded.
- No app source files changed.
- No migration files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No persistent cache adapter was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3N.6 changed documentation and planning SQL files only.
- Recommended next action: owner manually runs the validation pack in the disposable Supabase Dashboard SQL Editor and returns sanitized pass/fail results only.

## Phase 3N.5 - 2026-06-21

### Runtime Target SQL Validation Attempt

- Created `docs/planning/phase_3n5_runtime_target_sql_validation_result_v0.1.md`.
- Owner approved runtime-only use of the already-configured disposable Supabase project identifier solely as an MCP tool target argument.
- Target category remains `disposable-remote-approved`.
- Stopped before SQL because no runtime-only target handle is available to Codex in the callable context without recording or discovering the identifier.
- Supabase projects were not listed.
- Migration file intended for validation: `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
- Baseline migration file: `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.
- No project refs, project URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, or secret-bearing outputs were recorded.
- No SQL was run.
- No migration was applied.
- No Supabase MCP database query was run.
- No Supabase write occurred.
- No production DB was touched.
- No app source files changed.
- No migration files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No persistent cache adapter was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3N.5 changed documentation only.
- Recommended next action: adjust the secure MCP setup so SQL tools can use the scoped disposable target without Codex supplying a visible target identifier value, then rerun Phase 3N.5.

## Phase 3N.4 - 2026-06-21

### Disposable Supabase SQL Validation Attempt

- Created `docs/planning/phase_3n4_disposable_supabase_sql_validation_result_v0.1.md`.
- Owner designated the target category as `disposable-remote-approved`.
- SQL execution was approved only against the already-scoped disposable Supabase MCP target.
- Stopped before SQL because the callable Supabase MCP database tools still require an explicit target identifier argument.
- Project listing was not run because project references must not be recorded.
- Migration file intended for validation: `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
- Baseline migration file: `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.
- No project refs, project URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, or secret-bearing outputs were recorded.
- No SQL was run.
- No migration was applied.
- No Supabase MCP database query was run.
- No Supabase write occurred.
- No production DB was touched.
- No app source files changed.
- No migration files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No persistent cache adapter was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3N.4 changed documentation only.
- Recommended next action: adjust the secure MCP setup so Codex can use the already-scoped disposable target without providing or recording a target identifier, then rerun Phase 3N.4.

## Phase 3N.3A - 2026-06-21

### Supabase Target Status Check

- Created `docs/planning/phase_3n3a_supabase_target_status_check_v0.1.md`.
- Checked whether a pre-approved disposable or controlled non-production Supabase MCP target is already designated.
- Used only non-secret local and tool-surface evidence.
- Recorded target-status result as `not-designated`.
- Confirmed no default selected target is visible in the current tool interface.
- Confirmed the available Supabase MCP database tools require an explicit target identifier for execution.
- Supabase projects were not listed.
- No project refs, URLs, connection strings, passwords, keys, JWT secrets, tokens, or secret-bearing outputs were recorded.
- No SQL was run.
- No migration was applied.
- No Supabase MCP database query was run.
- No Supabase write occurred.
- No production DB was touched.
- No app source files changed.
- No migration files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3N.3A changed documentation only.
- Recommended next action: owner must designate a disposable or controlled non-production target through a secure tool context before Phase 3N.4.

## Phase 3N.3 - 2026-06-21

### Disposable Supabase MCP Target Designation Path

- Created `docs/planning/phase_3n3_disposable_supabase_target_designation_result_v0.1.md`.
- Documented the owner option 2 decision to use a pre-approved disposable Supabase target through Supabase MCP.
- Confirmed Phase 3N.3 is target designation and safety-gate preparation only.
- Recorded target category as `blocked-before-target-designation`.
- Supabase MCP capability was available in the session, but no pre-approved disposable target was available through a non-recorded secure context.
- Supabase projects were not listed because project listing could expose or record project references.
- No project refs, project URLs, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, tokens, or secret-bearing outputs were recorded.
- No SQL was run.
- No migration was applied.
- No Supabase MCP database query was run.
- No Supabase write occurred.
- No production DB was touched.
- No app source files changed.
- No migration files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No persistent cache adapter was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3N.3 changed documentation only.
- Recommended next action: designate a disposable target through a secure non-recorded tool context, then start Phase 3N.4 for SQL validation with a separate approval gate.

## Phase 3N.2 - 2026-06-21

### Disposable Supabase SQL Validation Attempt

- Created `docs/planning/phase_3n2_disposable_supabase_sql_validation_result_v0.1.md`.
- Owner approved SQL execution for disposable or explicitly controlled non-production validation only.
- Stopped before SQL because no disposable or explicitly controlled non-production target could be confirmed with non-secret evidence.
- Target category recorded as `blocked-before-target-selection`.
- Migration file intended for validation: `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
- Baseline migration file: `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.
- Supabase MCP execution tools were available but were not used for project listing, SQL execution, or migration application.
- Supabase projects were not listed because project discovery that records project references was not approved.
- No production DB was touched.
- No migration was applied.
- No SQL was run.
- No Supabase CLI was run.
- No psql command was run.
- No Supabase MCP database query or migration command was run.
- No Supabase connection or write occurred.
- No app source files changed.
- No migration files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secret values were requested or recorded.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3N.2 changed documentation only.
- Recommended next action: establish a disposable validation target through a non-secret secure flow, then rerun Phase 3N.2.

## Phase 3N.1 - 2026-06-21

### Disposable Supabase Migration Validation Attempt

- Created `docs/planning/phase_3n1_disposable_supabase_validation_result_v0.1.md`.
- Attempted to start disposable validation for `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
- Stopped before SQL because the hard safety gate could not be satisfied with non-secret evidence.
- Environment category recorded as `blocked-before-target-selection`.
- Confirmed local `docker` is unavailable.
- Confirmed local `psql` is unavailable.
- Confirmed Supabase CLI is unavailable on PATH.
- Confirmed a Supabase MCP execution surface is available but was not used because no non-secret disposable target identifier or environment label was available.
- Did not list Supabase projects because that could expose or record project references.
- No production DB was touched.
- No migration was applied.
- No SQL was run.
- No Supabase CLI was run.
- No psql command was run.
- No Supabase MCP database query or migration command was run.
- No Supabase connection or write occurred.
- No app source files changed.
- No migration files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secret values were requested or recorded.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3N.1 changed documentation only.
- Recommended next action: establish a disposable validation target through a non-secret/secure channel, then rerun Phase 3N.1.

## Phase 3N - 2026-06-21

### Disposable Supabase Validation Plan

- Created `docs/planning/phase_3n_disposable_supabase_validation_plan_v0.1.md`.
- Planned disposable or controlled Supabase validation for `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
- Documented Phase 3M migration baseline, lifecycle columns, deterministic backfill, constraints, indexes, and unchanged RLS/grant boundary.
- Defined disposable validation goals for migration application, schema inspection, RLS/grant checks, public-read safety, negative tests, and evidence capture.
- Defined disposable environment requirements and allowed synthetic public quote test data.
- Documented future precheck plan, migration application plan, negative validation plan, evidence policy, rollback/reset policy, pass criteria, and fail criteria.
- Documented that production DB must not be used for first execution.
- Added a minimal Korean owner review checklist.
- Disposable validation plan only; no migration was applied.
- No SQL was run.
- No Supabase CLI was run.
- No psql command was run.
- No Supabase connection or write occurred.
- No app source files changed.
- No provider behavior changed.
- No KIS route behavior changed.
- No UI live quote wiring was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secret values were requested or recorded.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3N changed documentation only.
- Recommended next action: owner review, then execute disposable validation only after an explicit approval gate.

## Phase 3M - 2026-06-21

### Persistent Quote Cache Migration File Draft

- Added `supabase/migrations/20260621_market_quote_cache_lifecycle_columns.sql`.
- Converted the Phase 3L reviewed SQL draft into one migration file only.
- Preserved the existing `public.market_quote_cache` table.
- Added lifecycle and metadata columns for future persistent quote cache writes: `cache_key`, `provider`, `source`, `fresh_until`, `stale_until`, `schema_version`, `last_refresh_status`, `last_error_code`, and `updated_at`.
- Added deterministic backfill from existing `symbol`, `market`, `cached_at`, and `expires_at` fields.
- Added guarded checks for normalized duplicate cache identifiers and lifecycle ordering.
- Added idempotent constraint creation through `DO` blocks.
- Added indexes for `fresh_until`, `stale_until`, and `(market, symbol, provider, source)`.
- Preserved existing public-read and service-role-write intent.
- Did not add anon or authenticated write grants.
- Did not change RLS policies.
- Created `docs/planning/phase_3m_persistent_quote_cache_migration_file_result_v0.1.md`.
- Updated the owner manual smoke checklist with a minimal Phase 3M owner review section.
- Migration file drafted only; it was not applied.
- No SQL was run.
- No Supabase CLI was run.
- No psql command was run.
- No Supabase connection or write occurred.
- No app source files changed.
- No persistent cache adapter was implemented.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No Vercel environment value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secret values were requested or recorded.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3M changed only a migration file and planning documentation.
- Recommended next action: owner review, then disposable Supabase validation only after an explicit approval gate.

## Phase 3L - 2026-06-21

### Persistent Quote Cache Migration Review

- Created `docs/planning/phase_3l_persistent_quote_cache_migration_review_v0.1.md`.
- Reviewed the existing `market_quote_cache` migration shape against the Phase 3K persistent quote cache policy.
- Inventoried the current migration files and confirmed `supabase/migrations/20260615_rebuild_schema_v0_1.sql` is the only migration file.
- Documented current `market_quote_cache` columns: `id`, `symbol`, `market`, `quote_json`, `cached_at`, and `expires_at`.
- Documented current constraints, indexes, RLS enablement, grants, and public read policy.
- Assessed that the current schema can support a minimal persistent adapter by storing normalized `QuoteSnapshot` and lifecycle metadata in `quote_json`.
- Documented limitations of relying only on `quote_json`, `cached_at`, and `expires_at`.
- Classified required Phase 3M decisions, recommended production hardening changes, optional future improvements, and not-recommended storage patterns.
- Documented data safety rules forbidding raw KIS payloads, headers, keys, tokens, authorization headers, account numbers, raw errors, stack traces, connection strings, DB passwords, user IDs, portfolio IDs, and position IDs.
- Reviewed RLS, Data API grant, public read, and service-role write boundaries.
- Added a non-executable SQL draft inside the planning document only.
- Added future roadmap and approval gates for migration, Supabase writes, provider live calls, UI wiring, Vercel env mutation, and deployment.
- Added a minimal Korean owner review checklist.
- Review/planning only; no migration file was added.
- No SQL was run.
- No Supabase CLI was run.
- No psql command was run.
- No Supabase connection or write occurred.
- No app source files changed.
- No provider behavior changed.
- No UI live quote wiring was implemented.
- No Vercel env value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secret values were requested or recorded.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3L changed documentation only.
- Recommended next action: owner review, then approve Phase 3M only if disabled persistent cache adapter work should begin.

## Phase 3K - 2026-06-21

### Persistent Quote Cache Policy Planning

- Created `docs/planning/phase_3k_persistent_quote_cache_policy_plan_v0.1.md`.
- Planned the future transition from Phase 3J in-memory quote cache to a Supabase-backed persistent quote cache.
- Documented the current Phase 3J baseline: module-local `Map`, normalized `QuoteSnapshot` only, 15-second fresh TTL, 120-second stale TTL, stale fallback on provider failure, no DB persistence, and no UI wiring.
- Documented persistent cache goals for reduced KIS calls, normalized public quote payloads, stale fallback, server-only writes, and approval-gated production activation.
- Documented proposed `market_quote_cache` table usage using the existing planned table and optional future columns.
- Documented data that may be persisted and data that must never be persisted, including raw KIS payloads, headers, keys, tokens, account numbers, raw errors, and stack traces.
- Documented RLS, Data API grant, and service-role write boundaries.
- Documented TTL, fresh, stale, expired, invalidation, cleanup, refresh deduplication, and provider quota protection policy.
- Documented future API response metadata policy and security/privacy requirements.
- Documented relationship to Market, Portfolio, Chart AI, Treemap, OpenDART, and future US stock support.
- Added a future implementation roadmap with approval gates for migration review, Supabase write code, disposable validation, UI live-data wiring, production env, and deployment.
- Added a minimal Korean owner review checklist.
- Planning only; no DB migration was added.
- No SQL was run.
- No Supabase CLI was run.
- No psql command was run.
- No Supabase connection was attempted.
- No Supabase write or cache write was implemented.
- No persistent cache implementation was added.
- No UI live quote wiring was added.
- No provider behavior changed.
- No Vercel env value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secret values were requested or recorded.
- Ignored `.env*` contents were not read.
- Build was skipped because Phase 3K changed documentation only.
- Recommended next action: owner review, then approve Phase 3L only if persistent quote cache migration review should begin.

## Phase 3J - 2026-06-21

### Quote Cache Stale Fallback Policy

- Added server-only in-memory quote cache for the local/dev KIS quote route.
- Cached normalized `QuoteSnapshot` objects only.
- Added cache key normalization such as `quote:KR:005930`.
- Added local/dev TTL policy: 15-second fresh window and 120-second stale window.
- Added fresh cache hit behavior with browser-safe fallback metadata.
- Added stale-but-usable fallback behavior when provider refresh fails inside the stale window.
- Added expired cache behavior that removes expired entries and returns sanitized provider errors when no usable cache exists.
- Preserved existing local/dev provider feature gate and production-disabled provider execution.
- Preserved `GET /api/market/quote` response shape with `{ ok, data, fallback }`.
- Added `src/lib/server/marketData/quoteCache.ts`.
- Added `scripts/smoke_quote_cache_policy.mjs`.
- Updated disabled route smoke coverage for the new cache module.
- Added Phase 3J result documentation and a minimal Korean owner review checklist.
- No raw KIS payload was cached.
- No token, key, app secret, authorization header, account number, raw headers, or raw errors were cached in quote cache.
- No Supabase cache write was implemented.
- No DB migration was added.
- No SQL was run.
- No Supabase CLI was run.
- No psql command was run.
- No UI live quote wiring was added.
- No Vercel env value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No order, account, trading, balance, holdings, or WebSocket API was implemented.
- No OpenDART, OpenAI, Gemini, real AI analysis, visitor count, ad-event tracking, scraping, remote discovery, external asset download, FX conversion, valuation analytics, performance analytics, or provider autocomplete was implemented.
- No secret values were requested or recorded.
- Ignored `.env*` contents were not read.
- `node scripts/smoke_quote_cache_policy.mjs`: passed.
- `node scripts/smoke_market_quote_route_disabled.mjs`: passed.
- `npm run check:provider-boundaries`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Recommended next action: optional owner live cache smoke, then approve the next provider/cache/UI phase only after reviewing scope.

## Phase 3I - 2026-06-21

### KIS Domestic Quote Read Route

- Added KIS domestic stock quote read integration behind `GET /api/market/quote`.
- Kept the route local/dev-only and guarded by `KIS_ENABLE_LIVE_QUOTES`.
- Added production-disabled KIS quote readiness handling.
- Added server-only KIS token request and domestic quote request code.
- Added module-local in-memory KIS token cache only.
- Added normalized `QuoteSnapshot` output for verified KIS quote fields.
- Added sanitized provider error responses for disabled config, invalid input, unsupported markets, token failure, provider failure, and rate-limit paths.
- Added `KIS_ENABLE_LIVE_QUOTES` to the server-only provider env registry as a name only.
- Updated the market quote service wrapper for KR quote reads and unsupported-market responses.
- Updated provider-boundary validation so `fetch` is allowed only in the KIS provider module.
- Added disabled-mode route smoke script that does not require credentials or make a live KIS call.
- Added Phase 3I result documentation and Korean owner review checklist.
- Market, Portfolio, Chart AI, Home, and Lab UI remain disconnected from `/api/market/quote`.
- No order, account, trading, balance, holdings, or WebSocket API was implemented.
- No DB migration was added.
- No direct SQL was run.
- No Supabase CLI was run.
- No psql command was run.
- No Supabase write or cache write was implemented.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Portfolio write endpoint was called by Codex.
- No Vercel env value was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No OpenDART, OpenAI, Gemini, real AI analysis, visitor count, ad-event tracking, scraping, remote discovery, external asset download, FX conversion, valuation analytics, performance analytics, or provider autocomplete was implemented.
- No secret values were requested or recorded.
- Ignored `.env*` contents were not read.
- Official KIS Developers and official Korea Investment Open API GitHub samples were verified before implementation.
- `npm run check:provider-boundaries`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- `node scripts/smoke_market_quote_route_disabled.mjs`: passed.
- Disabled/config smoke returned sanitized `503 CONFIG_MISSING`.
- Invalid KR symbol smoke returned sanitized `400 VALIDATION_FAILED`.
- Unsupported US quote smoke returned sanitized `404 SYMBOL_UNSUPPORTED`.
- Live KIS smoke was not run by Codex.
- Recommended next action: owner local live smoke for `/api/market/quote?market=KR&symbol=005930` with private local env values, then decide the next approved provider phase.

## Phase 3H - 2026-06-21

### Server-only Provider Adapter Scaffolding

- Added server-only provider type contracts in `src/lib/server/providers/types.ts`.
- Added provider error utilities in `src/lib/server/providers/providerErrors.ts`.
- Added a server-only runtime guard in `src/lib/server/providers/serverOnly.ts`.
- Added env name registry metadata in `src/lib/server/providers/providerEnv.ts`, names only.
- Added KIS adapter shell in `src/lib/server/providers/kisClient.ts` with no external calls.
- Added OpenDART adapter shell in `src/lib/server/providers/openDartClient.ts` with no external calls.
- Added AI provider shell in `src/lib/server/providers/aiProviderClient.ts` with no external calls.
- Added market data readiness shells for quotes, charts, and security master.
- Added Portfolio valuation readiness shell in `src/lib/server/portfolioValuation.ts`.
- Added Chart AI context builder shell in `src/lib/server/chartAi/contextBuilder.ts`.
- Added `scripts/check_server_only_provider_boundaries.mjs`.
- Added `npm run check:provider-boundaries`.
- Documented that `src/lib/server/portfolioValuation.ts` is used because existing `src/lib/server/portfolio.ts` blocks the planned directory path.
- Added Phase 3H owner review checklist.
- Server-only provider adapter scaffolding only; no provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No DB migration was added.
- No SQL was run.
- No Supabase CLI was run.
- No psql command was run.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Portfolio write endpoint was called by Codex.
- No Supabase connection was attempted by Codex validation.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No visitor count was implemented.
- No ad-event tracking was implemented.
- No secrets were requested or recorded.
- Recommended next action: owner review of Phase 3H, then approve Phase 3I only if KIS quote read integration should begin.

## Phase 3G - 2026-06-20

### Provider/Data Readiness Planning

- Created `docs/planning/phase_3g_provider_data_readiness_plan_v0.1.md`.
- Documented current Home, Market, Chart AI, Lab, and Portfolio architecture status.
- Documented provider roles for KIS, OpenDART, OpenAI/Gemini, Supabase, and optional future providers.
- Defined server-only provider boundary principles and forbidden browser import rules.
- Planned conceptual future API routes for market quote, chart, treemap, Portfolio valuation, and Chart AI analysis.
- Defined conceptual data contracts for security identity, security master, quote snapshots, candles, chart series, Treemap constituents, Momentum / Trend points, Portfolio valuation, Chart AI context packages, provider cache records, provider errors, and fallback states.
- Aligned cache policy with existing planned tables: `market_symbols`, `market_quote_cache`, `market_chart_cache`, `chart_ai_cache`, and `heatmap_cache`.
- Documented Portfolio valuation readiness, aggregate `전체 보기` valuation behavior, and placeholder rules.
- Documented Market dashboard readiness for KOSPI200, KOSDAQ150, S&P500, NASDAQ100, and My Portfolio.
- Documented Chart AI readiness, context-builder design, usage guard preservation, and output restrictions.
- Documented environment variable names only, without values.
- Documented sanitized error taxonomy, Korean UI error copy guidance, and logging restrictions.
- Added an approval-gated roadmap from Phase 3H through Phase 3O.
- Added a Phase 3G owner review checklist to the manual smoke checklist document.
- Provider/data readiness planning only; no provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No DB migration was added.
- No SQL was run.
- No Supabase CLI was run.
- No psql command was run.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Portfolio write endpoint was called by Codex.
- No Supabase connection was attempted by Codex validation.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No visitor count was implemented.
- No ad-event tracking was implemented.
- No secrets were requested or recorded.
- Recommended next action: owner review of the Phase 3G plan, then approve Phase 3H only if server-only scaffolding should begin.

## Phase 3F.4 - 2026-06-20

### Portfolio Page Aggregate And Market Viewport Fit

- Added `/portfolio` synthetic `전체 보기` as a browser UI state option above real portfolios.
- Used safe synthetic id `__all_portfolios__` only in client state, not as a mutation target.
- Merged Portfolio page positions by stable market and symbol identity.
- Summed duplicate quantities and calculated weighted average buy price for aggregate rows.
- Added source portfolio names to aggregate rows.
- Kept aggregate rows read-only with no edit/delete buttons.
- Hid and guarded add-position behavior while synthetic aggregate mode is selected.
- Preserved individual portfolio selection, portfolio CRUD, and position CRUD.
- Preserved placeholder valuation behavior; no live market value, FX conversion, or fake valuation was added.
- Tuned Market Treemap single-view height and card spacing for better PC viewport fit.
- Tuned Momentum / Trend SVG viewBox and plot rectangle to reduce inner whitespace and enlarge the usable plot area.
- Preserved the `d3-hierarchy` Treemap engine.
- Preserved display-name-first chart labels and ticker metadata.
- Preserved Market view modes, fullscreen, and browser-only PNG export.
- Preserved `/market` primary route and `/heatmap` backward-compatible route.
- Preserved Home sticky ad, Chart AI chart-first UX, Portfolio behavior, Header auth stability, and `Today: 000`.
- No provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No Trading Economics, ETFshopping, Hankyung, or reference-site scraping/fetching was implemented.
- No DB migration was added.
- No direct SQL, Supabase CLI, or psql command was run.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No real visitor count or ad-event tracking was implemented.
- No secrets were requested or recorded.
- Recommended next action: run the Phase 3F.4 owner manual smoke in Chrome.

## Phase 3F.3 - 2026-06-20

### Portfolio Aggregate View And Display-Name Chart Labels

- Added My Portfolio `전체 보기` in the Market dashboard sample model.
- Added individual sample portfolio scope selection for `Core Growth` and `Income Balance`.
- Added aggregate portfolio logic for the sample data path.
- Merged duplicate securities by market + symbol.
- Used deterministic sample value for Treemap area sizing and weighted merged return/momentum/trend values by sample value.
- Switched Treemap visible labels from ticker-first to display-name-first.
- Switched Momentum / Trend visible labels from ticker-first to display-name-first.
- Preserved ticker/symbol in SVG title, aria label, internal metadata, and export filenames.
- Added display-name support to sample constituents and Korean display names for selected Korean sample securities.
- Preserved the `d3-hierarchy` Treemap engine.
- Preserved `Treemap`, `Momentum / Trend`, and `같이 보기` view modes.
- Preserved fullscreen and browser-only PNG export.
- Preserved Home sticky ad behavior.
- Preserved Chart AI chart-first UX and selected-security prefill.
- Preserved Portfolio CRUD, Header auth stability, and `Today: 000`.
- No provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No reference-site scraping/fetching was implemented.
- No DB migration was added.
- No direct SQL, Supabase CLI, or `psql` was run.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secrets were requested or recorded.
- Recommended next action: run the Phase 3F.3 owner manual smoke in Chrome.

## Phase 3F.2 - 2026-06-20

### Hierarchy Treemap Engine And Market View Modes

- Replaced the failed local squarify helper with a hierarchy-based squarified Treemap layout.
- Added `d3-hierarchy` as a focused dependency.
- Used `hierarchy`, `treemap`, and `treemapSquarify` only in `src/components/MarketShell.astro`.
- Improved true nested rectangle composition through root -> sector -> constituent hierarchy.
- Preserved value-based area mapping from provider-free sample values.
- Preserved sector grouping with sector parent nodes and constituent leaf nodes.
- Preserved market-style return color direction: positive red, negative blue, neutral gray.
- Added Market view-mode selector:
  - `Treemap`
  - `Momentum / Trend`
  - `같이 보기`
- Made `Treemap` mode a full-width Treemap view.
- Made `Momentum / Trend` mode a full-width scatter view.
- Preserved combined view with both charts.
- Preserved `/market` and `/heatmap`.
- Preserved visible `Treemap` terminology.
- Preserved fullscreen and browser-only PNG export.
- Preserved Home sticky ad behavior.
- Preserved Chart AI chart-first UX and selected-security prefill.
- No provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No reference-site scraping/fetching was implemented.
- No DB migration was added.
- No direct SQL, Supabase CLI, or `psql` was run.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secrets were requested or recorded.
- Recommended next action: run the Phase 3F.2 owner manual smoke in Chrome.

## Phase 3F.1 - 2026-06-20

### Treemap Visual Quality And PC Width Polish

- Corrected the Market Treemap from a column-like layout to a squarified/nested layout.
- Replaced the old slice-only layout helper with a deterministic local `squarify` helper.
- Improved sector grouping by squarifying sector blocks in the full Treemap rectangle.
- Improved value-based tile sizing by squarifying constituents inside each sector block.
- Adjusted sample values for selected large names so the visual hierarchy is clearer while keeping provider-free sample data.
- Improved Treemap tile text rules for large, medium, and small rectangles.
- Replaced the three-chip legend with a granular stepped return scale.
- Preserved return color direction: negative blue, neutral gray, positive red.
- Optimized PC web width with a shared `1500px` page max width.
- Widened Home, Market, nav, and slide-ad content containers while keeping responsive margins.
- Improved Market card ratio so the Treemap is dominant and scatter remains readable.
- Enlarged the normal scatter chart.
- Moved `장기 트렌드` to the bottom-right of the scatter plot rectangle.
- Kept `단기 모멘텀` outside the plot area.
- Preserved Treemap terminology.
- Preserved `/market` and `/heatmap`.
- Preserved fullscreen and browser-only PNG export.
- Preserved Home sticky ad behavior.
- Preserved Chart AI chart-first UX and selected-security prefill.
- No provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No Trading Economics, ETFshopping, or Hankyung scraping/fetching was implemented.
- No DB migration was added.
- No direct SQL, Supabase CLI, or `psql` was run.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secrets were requested or recorded.
- Recommended next action: run the Phase 3F.1 owner manual smoke in Chrome.

## Phase 3F - 2026-06-20

### Market Treemap Dashboard Redesign

- Rebuilt the Market surface as a Treemap-first dashboard.
- Preserved `/market` as the primary route and `/heatmap` as a backward-compatible alias.
- Replaced visible Market/Home `Heatmap` product language with `Treemap` where safe.
- Added universe controls for `KOSPI200`, `KOSDAQ150`, `S&P500`, `NASDAQ100`, and `My Portfolio`.
- Added period controls for `1일`, `1주`, `1개월`, `3개월`, `6개월`, and `1년`.
- Added deterministic provider-free sample market data in `src/data/marketTreemapSamples.ts`.
- Added one selected-universe Treemap card and one selected-universe Momentum / Trend scatter card.
- Implemented sector grouping, value-sized Treemap tiles, return-color mapping, and a visible color legend.
- Fixed Market scatter axis label placement so Korean labels remain outside the plot area.
- Preserved fullscreen/expanded card behavior and browser-only PNG export.
- Treemap export filenames now use `treemap`.
- Preserved Home sticky sidebar ad behavior.
- Preserved Chart AI chart-first UX and selected-security prefill.
- Preserved Portfolio behavior by scope.
- Preserved Header auth label stability and `Today: 000`.
- No Supabase connection for writes was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex.
- No Auth user was created.
- No Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider integration, Chart AI provider call, AI execution, real market-data fetch, Trading Economics/ETFshopping/Hankyung fetch or scrape, real visitor count, ad-event tracking, analytics, FX conversion, valuation analytics, performance analytics, provider autocomplete, logo/banner scraping, remote discovery, or external asset download was added.
- No secrets were requested or recorded.
- `npm run preview` remains unsupported by the installed Vercel adapter; local HTTP smoke used `npm run dev`.
- Recommended next action: run the Phase 3F owner manual smoke in Chrome.

## Phase 3E.4 - 2026-06-20

### Home Sidebar Sticky Range Fix

- Fixed the Home sticky range by restructuring the Home layout into a shared `home-shell` wrapper with a main content column and a right sidebar column.
- Preserved the in-flow sidebar architecture.
- Fixed scroll-follow behavior without returning to a fixed viewport rail.
- Preserved header/nav/ticker collision prevention with the existing `112px` sticky top offset.
- Preserved footer/footer ad collision prevention by keeping the rail constrained to the Home shell.
- Preserved Home-only ad behavior.
- Preserved the `1440px` breakpoint.
- Preserved full `160x600` local sample banners.
- Preserved 5-second rotation, hover pause, and reduced-motion handling.
- Preserved non-Home ad absence.
- Preserved Market scatter fullscreen/export fixes.
- Preserved Chart AI chart-first UX and selected-security prefill.
- Recorded a Phase 3F planning note: rename visible `Heatmap` terminology to `Treemap` during the Market Treemap redesign.
- Did not implement the Phase 3F Treemap redesign.
- No provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No Trading Economics, ETFshopping, Hankyung, or reference-site scraping/fetching was implemented.
- No DB migration was added.
- No direct SQL, Supabase CLI, or `psql` was run.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secrets were requested or recorded.
- Recommended next action: run the Phase 3E.4 owner manual smoke in Chrome.

## Phase 3E.3 - 2026-06-20

### Safe Sticky Home Sidebar Ad

- Added sticky behavior to the in-flow Home right sidebar by applying `position: sticky` to the inner Home rail viewport.
- Fixed Home ad scroll-follow behavior without returning to the unsafe viewport-fixed rail.
- Preserved header/nav/ticker collision prevention with a Home-only `112px` sticky top offset.
- Preserved footer/footer ad collision prevention by keeping the outer rail in normal Home grid flow.
- Preserved Home-only ad behavior.
- Preserved the `1440px` display breakpoint.
- Preserved full `160x600` local sample banners.
- Preserved 5-second rotation, hover pause, and reduced-motion handling.
- Preserved non-Home ad absence.
- Preserved Market scatter fullscreen/export fixes.
- Preserved Chart AI chart-first UX and selected-security prefill.
- No provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No Trading Economics scraping or fetching was implemented.
- No DB migration was added.
- No direct SQL, Supabase CLI, or `psql` was run.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No secrets were requested or recorded.
- Recommended next action: run the Phase 3E.3 owner manual smoke in Chrome.

## Phase 3E.2 - 2026-06-20

### Home Sidebar Rail And Market Scatter Export Stabilization

- Converted the Home ad rail from viewport-fixed placement into an in-flow Home-only right sidebar.
- Removed the obsolete fixed Home rail `top` and `right` positioning path.
- Preserved the `1440px` Home rail display breakpoint, full `160x600` local sample banners, 5-second rotation, hover pause, and reduced-motion handling.
- Preserved Home-only isolation; non-Home routes do not import or render `HomeRailAd`.
- Renamed the bottom footer/ad wrapper away from the old fixed-area class while keeping it in natural document flow.
- Reworked the Market expanded modal as a bounded grid with hidden overflow so scatter cards fit the modal viewport.
- Made the expanded modal close `X` visually clearer with explicit stroke SVG rendering.
- Hardened scatter SVG rendering with explicit white background, plot background, axes, point colors, and point label colors.
- Kept browser-only `html-to-image` PNG export and excluded modal close controls from capture.
- Preserved Heatmap export behavior.
- Preserved `/market` and `/heatmap`.
- Preserved Chart AI chart-first UX, selected-security prefill, and server-only usage guard boundary.
- Preserved Header auth label stability and `Today: 000`.
- Preserved Portfolio behavior by scope.
- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex.
- No Auth user was created.
- No Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider integration, real AI analysis, real market-data fetch, Trading Economics fetch/scrape, real visitor count, ad-event tracking, analytics, FX conversion, valuation analytics, performance analytics, provider autocomplete, scraping, or external asset download was added.
- No secrets were requested or recorded.
- Recommended next action: run the Phase 3E.2 owner manual smoke in Chrome.

## Phase 3E.1 - 2026-06-20

### Home Rail, Footer, Market Fullscreen, And Export Polish

- Removed fixed viewport-following behavior from the bottom footer/ad area.
- Removed body bottom padding that compensated for the fixed bottom area.
- Kept the footer/ad block at the natural document bottom.
- Fixed Home rail clipping by moving the rail top offset higher and using a viewport-aware `min(600px, calc(100vh - 156px))` rail height.
- Preserved Home-only rail behavior and the `1440px` display breakpoint.
- Preserved existing local Home sample banners, 5-second rotation, hover pause, and reduced-motion handling.
- Added Market card expand/fullscreen controls for heatmap and scatter cards.
- Added modal close behavior through close button, backdrop click, and ESC.
- Hardened PNG export by replacing the fragile custom SVG `foreignObject` canvas path with browser-only `html-to-image`.
- Added `html-to-image` to `package.json` and `package-lock.json`.
- Kept export local-only; no upload, DB storage, analytics, or ad-event tracking was added.
- Preserved `/market` and `/heatmap`.
- Preserved Chart AI chart-first UX and the Phase 3D server-only usage guard skeleton.

### Safety And Validation

- Ran normal `npm run build`; build passed.
- Confirmed `.vercel/output/config.json`, `_render.func`, and static output exist.
- Confirmed local unauthenticated HTTP smoke for active routes and removed legacy routes.
- Confirmed unauthenticated POST to `/api/chart-ai/analyze` returned sanitized 401.
- No provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No Trading Economics scraping or fetching was implemented.
- No DB migration was added.
- No direct SQL, Supabase CLI, or `psql` was run.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No real visitor-count API/DB, local counter, migration, or analytics was added.
- No ad-event route or tracking logic was added.
- No secrets were requested or recorded.
- Recommended next action: run the Phase 3E.1 owner manual smoke in Chrome.

## Phase 3E - 2026-06-20

### Market, Chart AI UX, And Home Ad Shell

- Activated the normal Home right-side ad rail on `/`.
- Lowered the Home rail display breakpoint and added a Home-only content-width adjustment so the `160x600` rail can be visible locally without covering primary content.
- Removed the Phase 3C.12 in-page Home preview fallback panel from product source.
- Preserved existing local Home ad sample SVGs and `src/data/homeAdBanners.json`.
- Changed the primary nav label from Heatmap to `시장`.
- Added `/market` as the primary Market route.
- Kept `/heatmap` as a backward-compatible Market route.
- Rebuilt the Market surface with KOSPI200, KOSDAQ150, S&P500, NASDAQ100, and My Portfolio holdings sections.
- Added provider-free heatmap cards and short-term momentum vs long-term trend scatter cards for each section.
- Added camera buttons for each Market card.
- Added browser-only local PNG export with no new dependency.
- Removed the Chart AI question input from the UI.
- Removed `question` from the browser Chart AI request payload while leaving server-side tolerance for older payloads.
- Added `차트 불러오기` as the chart-load action near the security input.
- Moved Chart AI interval controls into the chart area as `일봉`, `주봉`, and `월봉`.
- Preserved Chart AI selected-security query prefill and the Phase 3D server-only usage guard skeleton.

### Safety And Validation

- Ran normal `npm run build`; build passed.
- Confirmed `.vercel/output/config.json`, `_render.func`, and static output exist.
- Confirmed local unauthenticated HTTP smoke for active routes and removed legacy routes.
- Confirmed unauthenticated POST to `/api/chart-ai/analyze` returned sanitized 401.
- No provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No Trading Economics scraping or fetching was implemented.
- No DB migration was added.
- No direct SQL, Supabase CLI, or `psql` was run.
- No Auth user was created.
- No production authenticated write validation was performed by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No real visitor-count API/DB, local counter, migration, or analytics was added.
- No ad-event route or tracking logic was added.
- No secrets were requested or recorded.
- Recommended next action: run the Phase 3E owner manual smoke for Home rail visibility, Market card export, and Chart AI chart-first flow.

## Phase 3D - 2026-06-19

### Chart AI Usage Guard Skeleton

- Added POST-only `/api/chart-ai/analyze`.
- Added server-only usage helper `src/lib/server/chartAiUsage.ts`.
- Reused the existing bearer-token validation boundary and derived user ID from server-validated auth state.
- Did not accept or trust browser-submitted `user_id`.
- Limited request fields to `symbol`, `name`, `market`, `timeframe`, and `question`.
- Added deterministic placeholder response with `status: "ready_for_provider_integration"` for authenticated and allowed requests.
- Added `src/lib/chartAiClient.ts` as a browser-safe helper that obtains the current Supabase session and sends a bearer token without logging or storing it.
- Updated `/chart-ai` with Korean execution states, selected-security prefill preservation, timeframe/question inputs, and an `AI 분석 실행` button.
- Preserved Chart AI provider non-execution: no OpenAI, Gemini, KIS, OpenDART, market data, cache write, or AI analysis was implemented.
- Preserved Portfolio behavior, Header auth stability, `Today: 000`, and Home rail preview behavior.
- Hardened ignored-file coverage by adding `*.cert`.

### Safety And Validation

- Ran normal `npm run build`; build passed.
- Confirmed `.vercel/output/config.json`, `_render.func`, and static output exist.
- `npm run preview` was unavailable because the Vercel adapter does not support Astro preview.
- Used local `npm run dev` for unauthenticated HTTP smoke only.
- Confirmed active routes returned 200 and removed legacy routes returned 404.
- Confirmed unauthenticated POST to `/api/chart-ai/analyze` returned sanitized 401.
- No authenticated Chart AI production endpoint call was made by Codex.
- No Supabase connection was attempted by Codex for authenticated writes.
- No Portfolio write endpoint was called by Codex.
- No SQL, Supabase CLI, `psql`, migration, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No real visitor-count API/DB, local counter, migration, or analytics was added.
- No ad-event route or tracking logic was added.
- No provider integration, Chart AI provider call, AI execution, FX conversion, valuation analytics, performance analytics, provider autocomplete, logo/banner scraping, remote discovery, or external asset download was implemented.
- No secrets were requested, read from ignored env files, recorded, or printed.
- Browser automation was not completed because Playwright was not installed and no browser-control tool was directly available.
- Recommended next action: run the Phase 3D owner manual smoke for signed-out and signed-in Chart AI skeleton behavior.

## Phase 3C.12 - 2026-06-19

### Home Rail Preview Fallback Panel

- Recorded the owner Phase 3C.11 smoke result: normal Home breakpoint behavior passed, but the fixed `/?railPreview=1` rail remained invisible in the owner browser.
- Added a guaranteed Home-only in-page preview fallback panel for `/?railPreview=1`.
- Added fallback panel DOM markers:
  - `data-home-rail-preview-panel`
  - `home-rail-preview-panel`
  - `data-preview-banner-track`
  - `data-preview-banner-card`
  - `data-preview-banner-index`
- Added visible `HOME RAIL PREVIEW` label and concise preview helper copy.
- Added text fallback labels for sample SVG image failure:
  - `Sample Banner 01`
  - `Sample Banner 02`
- Added small preview thumbnails so both sample banner entries are visible immediately.
- Added preview-specific carousel behavior with 5000ms interval, left-slide transform, hover pause, and reduced-motion handling.
- Chose to hide the fixed right rail during `railPreview=1`; the in-page fallback panel is now the single owner-smoke acceptance surface.
- Preserved non-Home route isolation for Portfolio, Chart AI, Heatmap, Lab, and Lab detail routes.
- Preserved normal production breakpoint behavior: normal Home rail remains hidden below `1660px`.
- Preserved `Today: 000`, header auth label stability, Chart AI prefill, Portfolio behavior, and provider credential status notes for future phases without values.

### Safety And Validation

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider integration, Chart AI provider call, AI execution, real visitor-count API/DB, ad-event write/tracking, FX conversion, valuation analytics, performance analytics, provider autocomplete, logo/banner scraping, remote discovery, or external asset download was implemented.
- No real visitor count implementation was added.
- No ad-event tracking was added.
- No secrets were requested or recorded.
- Normal `npm run build` passed and Vercel output was generated.
- Local unauthenticated HTTP smoke passed for required active and preview routes, and removed legacy routes returned 404.
- Browser visual smoke could not be completed because the in-app browser backend was unavailable.
- Recommended next action: run the Phase 3C.12 owner manual smoke using `/?railPreview=1`.

## Phase 3C.11 - 2026-06-19

### Home Rail Preview Visibility Hard Fix

- Recorded the owner Phase 3C.10 smoke result: normal Home breakpoint behavior passed, but `/?railPreview=1` did not visibly show the rail in the owner browser.
- Identified the issue as a visual preview hardening gap, not a route-isolation or non-Home import problem.
- Added a hard visibility path for `/?railPreview=1` with server-rendered inline root visibility styles.
- Added stronger preview CSS selectors for `.home-rail-ad[data-home-rail-preview="true"]` and `.home-rail-ad.rail-preview`.
- Forced preview display, visibility, opacity, pointer events, fixed positioning, safe right/top values, width, z-index, and viewport-safe height.
- Added a Home-only query fallback that reapplies the preview marker and class from `window.location.search` without localStorage or sessionStorage.
- Preserved two-banner carousel behavior, 5000ms interval, left-slide transform, hover pause, and reduced-motion handling.
- Preserved non-Home route isolation for Portfolio, Chart AI, Lab, and Lab detail routes.
- Preserved normal production breakpoint behavior: Home rail remains hidden below `1660px` unless `railPreview=1` is present on Home.
- Preserved `Today: 000`, header auth label stability, Chart AI prefill, Portfolio behavior, and provider credential status notes for future phases without values.

### Safety And Validation

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider integration, Chart AI provider call, AI execution, real visitor-count API/DB, ad-event write/tracking, FX conversion, valuation analytics, performance analytics, provider autocomplete, logo/banner scraping, remote discovery, or external asset download was implemented.
- No real visitor count implementation was added.
- No ad-event tracking was added.
- No secrets were requested or recorded.
- Normal `npm run build` passed and Vercel output was generated.
- Local unauthenticated HTTP smoke passed for required active and preview routes, and removed legacy routes returned 404.
- Browser visual smoke could not be completed because the in-app browser backend was unavailable and local Playwright was not installed.
- Recommended next action: run the Phase 3C.11 owner manual smoke using `/?railPreview=1`.

## Phase 3C.10 - 2026-06-19

### Home Rail Preview And Isolation

- Verified that `HomeRailAd` is imported only by the Home route and not by shared layout or non-Home pages.
- Added Home-only `railPreview=1` support at `/?railPreview=1`.
- Preview mode forces the Home rail visible below the normal breakpoint for owner smoke testing.
- Preview mode is query-only and is not persisted to localStorage or sessionStorage.
- Confirmed non-Home preview URLs do not render the rail:
  - `/portfolio?railPreview=1`
  - `/chart-ai?railPreview=1`
  - `/lab?railPreview=1`
- Preserved normal production breakpoint behavior: Home rail remains hidden below `1660px` unless `railPreview=1` is present on Home.
- Preserved two-banner 5-second left-slide rotation, hover pause, reduced-motion handling, and zero/one/two-plus behavior.
- Preserved `Today: 000`, header auth stability, Chart AI prefill, Portfolio behavior, and provider credential status notes for future phases without values.

### Safety And Validation

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider integration, Chart AI provider call, AI execution, real visitor-count API/DB, ad-event write/tracking, FX conversion, valuation analytics, performance analytics, provider autocomplete, logo/banner scraping, remote discovery, or external asset download was implemented.
- No secrets were requested or recorded.
- Normal `npm run build` passed and Vercel output was generated.
- `npm run preview` was confirmed unsupported by the installed `@astrojs/vercel` adapter, so local route smoke used an isolated `npm run dev` server.
- Local unauthenticated HTTP smoke passed for required active and preview routes, and removed legacy routes returned 404.
- Recommended next action: run the Phase 3C.10 owner manual smoke using `/?railPreview=1`.

## Phase 3C.9 - 2026-06-19

### Header, Home Rail, And Today Placeholder

- Added an early coarse auth UI hint in the document head to prevent a signed-in user from briefly seeing `로그인` during ordinary navigation before session resolution completes.
- Preserved signed-out `로그인`, signed-in `로그아웃`, and unavailable `설정 필요`.
- Kept visible `확인 중` absent from ordinary header auth UI.
- Reworked the header logo treatment so `public/logo.svg` is displayed inside a fixed 42px frame with the SVG scaled inside the frame, making the inner mark appear larger without growing the whole header logo box.
- Added a subtle display-only `Today: 000` header placeholder.
- Documented future real Today visitor-count logic using KST date, a per-day browser localStorage counted flag, a future server aggregate increment API, service-role-only DB writes, an aggregate read endpoint, and no IP/User-Agent/email/user_id storage for the MVP.
- Real visitor-count API, DB table, migration, DB write, local counting, and analytics were not implemented.

### Home Right Rail Sample Banners

- Added a Home-only right rail component.
- Added two local generated 160x600 SVG sample banners:
  - `public/ads/home-rail/home-rail-sample-01.svg`
  - `public/ads/home-rail/home-rail-sample-02.svg`
- Added `src/data/homeAdBanners.json` with two active sample banners.
- Implemented zero/one/two-plus banner behavior:
  - zero active banners render no rail.
  - one active banner renders static.
  - two or more active banners rotate every 5 seconds with a left-slide transition.
- Added reduced-motion handling and hover pause for the sample carousel.
- Kept the rail hidden below the wide-desktop breakpoint and Home-only.
- No ad-event route, analytics, or real outbound ad tracking was implemented.

### Safety And Validation

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider integration, Chart AI provider call, AI execution, real visitor-count API/DB, ad-event write, FX conversion, valuation analytics, performance analytics, provider autocomplete, logo scraping, remote logo discovery, or external asset download was implemented.
- No secrets were requested or recorded.
- Provider credential status remains preserved for future phases without values.
- Normal `npm run build` passed and Vercel output was generated.
- Local unauthenticated HTTP smoke passed for the required active routes, and removed legacy routes returned 404.
- Browser connector visual smoke was not completed because the in-app browser path was unavailable.
- Recommended next action: run the Phase 3C.9 owner manual smoke using the Korean result template.

## Phase 3C.8 - 2026-06-19

### Header Auth And Logo Polish

- Removed the header's user-visible auth `checking` state branch so ordinary navigation only presents `로그인`, `로그아웃`, or `설정 필요`.
- Removed Portfolio's response to header `checking` events so header navigation cannot push the Portfolio shell back into a checking display.
- Preserved signed-out `로그인` and signed-in `로그아웃` labels.
- Increased the top-left `public/logo.svg` display size from 42px to 48px while keeping the 72px header height stable.
- Preserved Auth, Portfolio, Chart AI prefill, bottom-sheet motion, lock UI, refresh icon, sorting/order controls, logo/fallback avatar, country badge, Pretendard, and Korean UI behavior.

### Home Vertical Banner Feasibility

- Produced a report-only feasibility plan for a future Home vertical ad rail.
- Confirmed the current centered content frame is 1240px wide.
- Estimated side gutter space at common desktop widths: 63px at 1366px, 100px at 1440px, 148px at 1536px, and 340px at 1920px.
- Recommended a Home-only right-side rail for a later phase.
- Recommended owner-created `160x600` images first, with optional `200x600` images for wider desktop testing.
- Recommended hiding the future rail below roughly 1660px and showing no rail or reserved space when no active banner exists.
- Recommended future paths `public/ads/home-rail/` and `src/data/homeAdBanners.json`, but did not add or wire them in this phase.
- Banner implementation, banner carousel, banner assets, outbound ad link behavior, and ad-event routes were not added.

### Safety And Validation

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider integration, Chart AI provider call, AI execution, ad-event write, banner implementation, FX conversion, valuation analytics, performance analytics, provider autocomplete, logo scraping, remote logo discovery, or external asset download was implemented.
- No secrets were requested or recorded.
- Provider credential status remains preserved for future phases without values.
- Normal `npm run build` passed and Vercel output was generated.
- Local unauthenticated HTTP smoke passed for the required active routes, and removed legacy routes returned 404.
- Browser connector visual smoke was not completed because the in-app `iab` browser was unavailable.
- Recommended next action: run the Phase 3C.8 owner manual smoke using the Korean result template.

## Phase 3C.7 - 2026-06-19

### Portfolio Visual Polish

- Replaced the signed-out Portfolio lock treatment with one larger `🔐` visual.
- Removed the sky-blue/gradient lock-icon background and overlapping lock drawing layers.
- Added bottom-sheet slide-up and slide-down/fade motion for position add/edit.
- Added reduced-motion handling for the bottom-sheet transition.
- Searched local/tracked logo assets and applied `public/logo.svg` to the top-left header brand area.
- Replaced the visible Portfolio refresh text with an icon-only circular-arrow button while preserving `aria-label="새로고침"`.
- Preserved auth label stability: signed-out `로그인`, signed-in `로그아웃`, and no visible checking label in ordinary navigation.
- Preserved Chart AI selected-security prefill without provider, AI, market-data, or authenticated calls.
- Hardened ignored-file coverage for certificate files.
- Preserved the provider credential status note for future phases without recording values.
- Preserved the desktop left-side rotating image ad banner as backlog only.

### Safety And Validation

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider integration, Chart AI provider call, AI execution, ad-event write, banner implementation, FX conversion, valuation analytics, performance analytics, provider autocomplete, logo scraping, remote logo discovery, or external asset download was implemented.
- No secrets were requested or recorded.
- Normal `npm run build` passed and Vercel output was generated.
- Local unauthenticated HTTP smoke passed for the required active routes, and removed legacy routes returned 404.
- Browser connector visual smoke was not completed because the in-app `iab` browser was unavailable.
- Recommended next action: run the Phase 3C.7 owner manual smoke using the Korean result template.

## Phase 3C.6 - 2026-06-19

### Portfolio Final UX Smoke Fix

- Removed the visible auth-checking label from ordinary header and Portfolio shell navigation states.
- Strengthened the signed-out Portfolio lock state with a visible lock treatment.
- Moved the position add/edit form into a bottom sheet opened by `종목 추가`.
- Reused the bottom sheet for position edit actions.
- Changed the currency display toggle labels to `달러 기준` and `원화 기준`.
- Changed local money formatting to compact USD and KRW display.
- Linked position names to Chart AI with `symbol`, `name`, and `market` query parameters.
- Added a safe Chart AI query-prefill skeleton without provider, AI, market-data, or authenticated calls.
- Tightened `.gitignore` coverage for literal `dist` and service-account credential JSON probes.

### Validation

- Ran normal `npm run build`; it exits with code 0.
- Confirmed `.vercel/output/config.json` and `.vercel/output/functions/_render.func` are generated.
- Confirmed `astro preview` is still unsupported by the installed Vercel adapter, so the local smoke check used the Astro dev server.
- Confirmed target routes return HTTP 200.
- Confirmed removed legacy routes return HTTP 404 and do not expose old surface markers.
- Confirmed no requested provider secret markers appear in source, public assets, or generated Vercel output.
- Confirmed no service-role marker appears in client-facing source or generated static output.
- Confirmed ignored-file coverage for `.env*`, `.vercel`, `.vercel/output`, `dist`, `dist/`, `.astro`, `.omc`, representative key files, service-account JSON files, credential files, and secret files.
- Browser connector smoke was not completed because the in-app `iab` browser was unavailable in this session; owner visual and console smoke remains recommended before Phase 3D.

## Phase 3C.5 - 2026-06-19

### Portfolio List Redesign

- Removed the header's visible server-rendered `확인 중` auth button state so normal signed-in navigation can avoid that flash when the non-secret signed-in UI hint exists.
- Added a lock-style logged-out Portfolio UI with `로그인이 필요합니다` and a `회원가입 / 로그인` action.
- Removed the duplicate login action from the compact Portfolio status bar.
- Changed the Portfolio name placeholder to `계좌 이름`.
- Applied smaller Portfolio card action controls and added client-side `위로`/`아래로` ordering controls.
- Added `src/data/securityLogos.json` for operator-provided logo mappings.
- Added position logo rendering, local fallback avatars, and KR/US country badges.
- Removed the visible `시장` field from the position form and added temporary internal market inference.
- Added a display-only currency mode toggle: `현지통화 기준` and `원화 기준`.
- Preserved safe USD/KRW behavior by showing `원화 환산 예정` instead of fake FX conversion.
- Replaced the position table with a cleaner card/list layout inspired by financial app information hierarchy.
- Added placeholder-safe valuation and return sorting controls.
- Corrected visible Lab copy from `미국 의회 주식` to `국회의원 보유 주식`.

### Backlog And Provider Notes

- Documented that an official KIS logo/image API was not confirmed from accessible docs.
- Used only owner/operator-provided logo URL mappings and local fallback avatars.
- Preserved the note that KIS REST API APP KEY, KIS REST API APP Secret, and OpenDART API KEY have been issued for future phases, without recording values.
- Preserved the desktop left-side rotating image ad banner as backlog only.
- Did not implement provider integration, Chart AI provider calls, ad-event writes, banner implementation, FX conversion, valuation analytics, performance analytics, provider autocomplete, logo scraping, or remote logo discovery.

### Safety And Scope

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No authenticated Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider credentials were requested or recorded.
- `npm run build` passed.
- Vercel output generation passed.
- Local unauthenticated HTTP smoke passed using `npm run dev` because the Vercel adapter does not support `astro preview`.
- Source and generated-output scans found only expected server-only service-role source markers and no browser/static exposure.
- Recommended next action: run the Phase 3C.5 owner manual smoke using the Korean result template.

## Phase 3C.4 - 2026-06-18

### Portfolio UX Polish

- Added a non-secret browser UI hint so the header can keep `로그아웃` visible during normal navigation after a signed-in state has already been confirmed.
- Replaced the large Portfolio readiness card with a compact status bar for login, profile, Portfolio API, and valuation readiness.
- Polished Portfolio position form spacing, table borders, row display, and `수정`/`삭제` action styling.
- Replaced separate visible ticker and name inputs with one `종목명 또는 티커` field.
- Removed the visible `자산 유형` select while preserving an internal `stock` default for the current API/schema contract.
- Added safe placeholders for `현재가`, `평가금액`, and `수익률`.
- Added USD-in-KRW valuation placeholder behavior so USD buy price remains displayed as USD and KRW valuation remains pending.
- Updated position rows to show security name first and ticker/code status second.
- Added the `pretendard` package and imported its package CSS for project-managed, self-hosted Korean font rendering.

### Backlog And Provider Notes

- Preserved the note that KIS REST API APP KEY, KIS REST API APP Secret, and OpenDART API KEY have been issued for future phases, without recording values.
- Preserved the desktop left-side rotating image ad banner as backlog only.
- Did not implement provider integration, Chart AI provider calls, ad-event writes, banner implementation, FX conversion, valuation analytics, performance analytics, or provider autocomplete.

### Safety And Scope

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No authenticated Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider credentials were requested or recorded.
- `npm run build` passed.
- Vercel output generation passed.
- Local unauthenticated HTTP smoke passed using `npm run dev` because the Vercel adapter does not support `astro preview`.
- Source and generated-output scans found only expected server-only service-role source markers and no browser/static exposure.
- Recommended next action: run the Phase 3C.4 owner manual smoke using the Korean result template.

## Phase 3C.3 - 2026-06-18

### Auth And Portfolio State Stabilization

- Replaced the header's initial signed-out visual default with a neutral session-checking state to reduce auth-state flicker during navigation.
- Added a shared browser-only auth-state event so Portfolio can react to checking, signed-in, signed-out, and unavailable states.
- Cleared portfolio list, selected portfolio, position list, edit forms, and loading state immediately on sign-out.
- Reran profile bootstrap and Portfolio list loading after signed-in state so re-login can reload persisted Portfolio data.
- Preserved signup nickname and password confirmation fields and Korean validation messages.

### Korean UI Conversion

- Converted the current visible shell and Portfolio MVP UI to Korean-first copy across header, nav, ticker helper text, home, Chart AI, Heatmap, Lab, Portfolio, slide ad, and footer ad surfaces.
- Preserved approved brand, feature, financial proper noun, ticker, currency, and route labels where appropriate.
- Updated owner manual smoke reporting format to Korean-first copy while preserving secret-safety rules.

### Backlog And Provider Notes

- Preserved the note that KIS REST API APP KEY, KIS REST API APP Secret, and OpenDART API KEY have been issued for future phases, without recording values.
- Preserved the desktop left-side rotating image ad banner as backlog only.
- Did not implement a left-side banner, ad-event route, database change, provider integration, valuation analytics, or performance analytics.

### Safety And Scope

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No authenticated Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider credentials were requested or recorded.
- Recommended next action: rerun focused owner manual Portfolio smoke using the Korean result template.

## Phase 3C.2 - 2026-06-18

### Portfolio Smoke Fix

- Fixed local server-side Supabase service-role category detection to support Astro server-side runtime lookup while preserving Vercel `process.env` behavior.
- Split Portfolio readiness states so public login config, profile bootstrap config, profile readiness, and Portfolio API availability are shown separately.
- Prevented a server-side Portfolio/API configuration issue from being displayed as Login unavailable after successful sign-in.
- Preserved Phase 3C Portfolio MVP list/create/update/delete UI and server-side ownership checks.

### Auth Modal UI

- Restored login/signup modal direction toward Korean product UI.
- Updated header login/logout labels and modal labels/buttons/messages to Korean product strings.
- Added signup nickname field.
- Added signup password confirmation field.
- Added client-side signup validation for nickname, email, password, password confirmation, and password mismatch.
- Kept password values out of logs, docs, and persistent state.

### Backlog And Provider Notes

- Documented that the KIS REST API APP KEY, KIS REST API APP Secret, and OpenDART API KEY have been issued for future phases, without recording values.
- Documented that future KIS/OpenDART phases must include secret-safe local and deployment environment registration guidance.
- Captured the desktop left-side rotating image ad banner requirement as backlog only.
- Did not implement a left-side banner, ad-event route, database change, provider integration, valuation analytics, or performance analytics.

### Safety And Scope

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No authenticated Portfolio write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No provider credentials were requested or recorded.
- Recommended next action: rerun focused owner manual Portfolio smoke and report only non-secret pass/fail results.

## Phase 3C.1 - 2026-06-18

### Portfolio Manual Smoke Checklist

- Created `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`.
- Prepared an owner-performed manual smoke checklist and non-secret result template for the Phase 3C Portfolio MVP.
- Documented disposable test data, manual browser checks, failure triage, stop conditions, cleanup, and next-action options.
- Confirmed Phase 3C authenticated write validation remains owner-performed.

### Safety And Scope

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed.
- No Auth user was created.
- No Portfolio API write endpoint was called by Codex.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No code implementation was performed.
- No secret values were requested or recorded.
- Next decision depends on the owner manual smoke result.

## Phase 3C - 2026-06-18

### Portfolio MVP Integration

- Added server-side Portfolio API boundaries in `src/pages/api/portfolio/portfolios.ts` and `src/pages/api/portfolio/positions.ts`.
- Added server-only Portfolio ownership and validation helpers in `src/lib/server/portfolio.ts`.
- Added browser-safe Portfolio API wrapper in `src/lib/portfolioClient.ts`.
- Rebuilt `/portfolio` from readiness-only placeholder into a minimal Portfolio MVP shell with portfolio list/create/update/delete and position list/create/update/delete UI.
- Preserved login/profile readiness behavior from Phase 3B.
- Kept symbols as plain user input; no provider lookup, valuation, performance analytics, or market refresh was added.
- Created `docs/planning/phase_3c_portfolio_mvp_result_v0.1.md`.

### Safety And Scope

- Portfolio API derives ownership from a server-validated Supabase session token and never trusts a browser-submitted `user_id`.
- Portfolio API routes explicitly scope service-role queries to the validated user ID.
- Non-owned portfolio or position access returns sanitized not-found behavior.
- No Portfolio write endpoint was called by Codex during validation.
- No Supabase SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No Chart AI provider call, ad-event write, market/provider ingestion, valuation analytics, or performance analytics was implemented.
- No secret values were requested or recorded.

### Validation

- `npm run build` passed.
- `.vercel/output/config.json`, `.vercel/output/functions/_render.func`, and `.vercel/output/static` were generated.
- Product source/generated secret marker scan found only the expected server-only source occurrence for the service-role variable marker.
- Service-role exposure scan found expected server-only source occurrences only.
- Browser/static bundle server-only marker scan found no service-role marker and no server-only helper marker.
- Disposable identifier scan found no product source or generated-output matches.
- Removed legacy route scan found no product source or generated-output matches.
- Broad crypto scope scan found no newly added broad crypto feature; existing crypto-not-supported and asset-class Bitcoin copy remain within approved scope.
- Ignored-file coverage was confirmed for `.env*`, `.vercel`, `dist`, `.astro`, `.omc`, representative credentials, certificates, and key files.
- In-app browser smoke was unavailable; fallback local HTTP smoke confirmed `/portfolio` returns 200 and unauthenticated Portfolio API GET requests return 401 without write calls.
- Recommended next phase: Phase 3D Chart AI usage guard and server-only AI execution skeleton.

## Phase 3B - 2026-06-18

### Auth/Profile Boundary Implementation

- Implemented the browser-safe Supabase helper boundary in `src/lib/supabase.ts`.
- Added browser-safe profile bootstrap helper logic in `src/lib/profileBootstrap.ts`.
- Added the server-only Supabase helper boundary in `src/lib/server/supabaseAdmin.ts`.
- Added `POST /api/auth/profile-bootstrap` in `src/pages/api/auth/profile-bootstrap.ts`.
- Wired the existing auth shell to call profile bootstrap after a signed-in session exists.
- Updated the Portfolio shell to show login/profile readiness states without implementing Portfolio CRUD.
- Created `docs/planning/phase_3b_auth_profile_boundary_result_v0.1.md`.

### Safety And Scope

- No profile bootstrap endpoint call was made by Codex during validation.
- No Supabase SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed by Codex validation.
- No Auth user was created.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No Portfolio CRUD, Chart AI provider call, ad-event write route, market provider ingestion, OpenAI, Gemini, KIS, or OpenDART integration was implemented.
- No secret values were requested or recorded.

### Validation

- `npm run build` passed.
- `.vercel/output/config.json`, `.vercel/output/functions/_render.func`, and `.vercel/output/static` were generated.
- Product source/generated secret marker scan found only the expected server-only source occurrence for the service-role variable marker.
- Service-role exposure scan found expected server-only source occurrences only.
- Browser/static bundle server-only marker scan found no service-role marker and no server-only helper marker.
- Disposable identifier scan found no product source or generated-output matches.
- Removed legacy route scan found no product source or generated-output matches.
- Broad crypto scope scan found no newly added broad crypto feature; existing crypto-not-supported and asset-class Bitcoin copy remain within the approved scope.
- Ignored-file coverage was confirmed for `.env*`, `.vercel`, `dist`, `.astro`, `.omc`, representative credentials, certificates, and key files.
- Recommended next phase: Phase 3C Portfolio MVP integration.

## Phase 3A - 2026-06-18

### App/Server Integration Planning

- Created `docs/planning/app_server_integration_plan_v0.1.md`.
- Acknowledged Phase 2L production schema readiness for application/server integration planning.
- Documented the current Astro route shell, Supabase browser helper, auth entry points, shared layout/nav/ticker/ad components, and the absence of current server endpoint files.
- Documented route-to-table integration mapping, service-role boundary principles, environment variable categories, planned server API boundaries, Chart AI usage-guard requirements, Portfolio/Auth/Profile sequence, public Lab/Heatmap read strategy, and ad-event server-write design.
- Preserved Advisor follow-ups and the pending runtime test for `internal.consume_chart_ai_usage(uuid, integer)`.
- Recommended the next implementation packet: Phase 3B Supabase client/server helper boundary and auth/profile bootstrap.

### Safety And Scope

- No Supabase connection was attempted.
- No SQL, Supabase CLI, `psql`, or DB command was run.
- No production DB mutation was performed.
- No Vercel environment variable was read, printed, pulled, added, updated, or removed.
- No deployment was run.
- No feature implementation, API route creation, provider integration, or database write path was added.
- No secret values were requested or recorded.

### Validation

- Run normal `npm run build` only for Phase 3A validation.
- Scan source and generated output for requested provider secret markers.
- Scan source and generated output for service-role exposure markers, reporting docs-only occurrences separately.
- Scan source and generated output for disposable validation identifiers, reporting docs-only occurrences separately.
- Confirm removed legacy route strings remain absent from product source and generated output.
- Confirm ignored-file coverage for `.env*`, `.vercel`, `dist`, `.astro`, `.omc`, credentials, certificates, and key files.
- Confirm final `git status --short`.

## Phase 2L - 2026-06-18

### Production Reset/Drop And Supabase Migration

- Created `docs/planning/supabase_production_reset_migration_result_v0.1.md`.
- Confirmed the exact Phase 2L approval gate passed.
- Used the Supabase connector for approved production DB execution.
- Performed metadata dependency review before reset/drop.
- Dropped only approved legacy/test public tables:
  - `public.portfolio_items`
  - `public.portfolio_assets`
  - `public.seibro_holdings`
  - `public.portfolios`
- Applied `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.
- Did not apply `supabase/validation/patch_consume_chart_ai_usage_v0_1.sql`.
- Ran `supabase/validation/validate_rebuild_schema_v0_1.sql`; the connector returned only the final result set, so targeted read-only validation queries were run separately.
- Confirmed 14 required public tables exist and RLS is enabled on all 14.
- Confirmed `ad_events` has no public select or insert policy.
- Confirmed `chart_ai_cache` has no `user_id`.
- Confirmed `public.set_updated_at()` and `internal.consume_chart_ai_usage(uuid, integer)` exist.
- Confirmed `internal.consume_chart_ai_usage(uuid, integer)` is executable only by `service_role`.
- Confirmed the Phase 2H `usage_date_kst` ambiguity fix is present.
- Skipped the usage-function runtime test because no safe Auth Admin/test-user creation channel was available through the connector.
- Checked Supabase Advisors and recorded non-secret high-level findings.
- Did not mutate Vercel env vars.
- Did not deploy.

### Safety Notes

- Supabase production DB mutation was limited to the approved legacy/test table reset/drop and fixed source migration.
- No Supabase CLI command was run.
- No `psql` command was run.
- No Vercel env value was read, printed, pulled, added, updated, removed, or overwritten.
- No secret values, project refs, URLs, connection strings, tokens, anon keys, service-role keys, JWT secrets, database passwords, or Vercel tokens were requested or recorded.
- Production DB schema is ready for the next integration planning phase, with Advisor and runtime-test follow-up items documented.

## Phase 2K - 2026-06-18

### Production Supabase Migration Attempt

- Created `docs/planning/supabase_production_migration_result_v0.1.md`.
- Confirmed the exact Phase 2K approval gate passed.
- Used the Supabase connector for read-only project and table metadata checks.
- Confirmed the production target is distinct from the disposable validation project without recording project refs, URLs, database hosts, keys, or connection strings.
- Stopped before migration because read-only production metadata showed existing public tables, including `public.portfolios`, which conflicts with the reviewed migration source.
- Did not apply `supabase/migrations/20260615_rebuild_schema_v0_1.sql`.
- Did not apply `supabase/validation/patch_consume_chart_ai_usage_v0_1.sql`.
- Did not run `supabase/validation/validate_rebuild_schema_v0_1.sql`.
- Did not perform the usage-function runtime test.
- Did not create a production test auth user.
- Did not run Supabase Advisors.
- Did not mutate Vercel env vars.
- Did not deploy.

### Safety Notes

- No SQL was run by Codex.
- No Supabase CLI command was run.
- No `psql` command was run.
- No database object was created, dropped, reset, truncated, altered, or mutated.
- No Vercel env value was read, printed, pulled, added, updated, removed, or overwritten.
- No secret values, project refs, URLs, connection strings, tokens, anon keys, service-role keys, JWT secrets, database passwords, or Vercel tokens were requested or recorded.
- Production DB readiness remains blocked until an owner-approved reset/drop procedure or revised migration handles the existing test/legacy public tables.

## Phase 2J.3 - 2026-06-18

### Vercel Production Environment Separation Audit

- Created `docs/planning/vercel_production_env_separation_audit_v0.1.md`.
- Recorded owner confirmations for production target identity, production data state, reset/rebuild acceptance, backup/restore decision, rollback owner, maintenance timing, production test auth user allowance, and Phase 2K Vercel env var exclusion.
- Confirmed application source and generated output do not contain requested provider secret markers or disposable validation identifiers.
- Confirmed `.gitignore` coverage for `.env*`, `.vercel/`, `dist/`, `.astro/`, `.omc/`, credentials, certificates, and key files.
- Checked Vercel project linkage without printing IDs; this checkout is not linked.
- Confirmed Vercel CLI is available, but read-only production env metadata could not be queried because project linkage is missing.
- Classified Vercel production env separation as `Not cleared; Vercel metadata unavailable`.
- Documented the remaining manual Vercel Production value-provenance check.
- Documented the acceleration policy for next work.

### Safety Notes

- Codex did not connect to Supabase.
- Codex did not run SQL.
- Codex did not run Supabase CLI.
- Codex did not run `psql`.
- Codex did not run any database command.
- Codex did not read, print, pull, add, update, or remove any Vercel env value.
- Codex did not run a deployment.
- No production migration was applied.
- No secret values, project refs, URLs, connection strings, tokens, anon keys, service-role keys, JWT secrets, database passwords, or Vercel tokens were requested or recorded.
- The exact Phase 2K approval phrase remains mandatory.

## Phase 2J.2 - 2026-06-18

### Owner Confirmation Package

- Created `docs/planning/supabase_owner_confirmation_package_v0.1.md`.
- Converted the Phase 2J.1 owner-confirmation blockers into a fillable decision form.
- Preserved backup/rollback and production data-state blockers before any Phase 2K execution.
- Preserved disposable credential separation from production and Vercel production settings.
- Documented allowed answer choices, evidence requirements, stop conditions, secret-safe reporting rules, production test user policy, decision outcomes, readiness scores, and the exact Phase 2K approval phrase gate.
- Updated `supabase/validation/README.md` with a cross-reference to the owner confirmation package.

### Safety Notes

- Codex did not connect to Supabase.
- Codex did not run SQL.
- Codex did not run Supabase CLI.
- Codex did not run `psql`.
- Codex did not run any database command.
- No production migration was applied.
- No secret values, project refs, URLs, connection strings, tokens, anon keys, service-role keys, JWT secrets, or database passwords were requested or recorded.
- The exact Phase 2K approval phrase remains mandatory and was not requested by this package-generation phase.

## Phase 2J.1 - 2026-06-17

### Final Production Migration Readiness Review

- Created `docs/planning/supabase_production_migration_readiness_review_v0.1.md`.
- Reviewed the Phase 2J production migration application plan against existing Phase 2 migration, validation, and human-review documents.
- Recorded the verdict: `Ready for owner decision, not ready for execution`.
- Documented unresolved owner confirmations for production target identity, production schema/data state, backup/recovery readiness, rollback feasibility, maintenance timing, production test user policy, disposable credential separation, and post-migration validation ownership.
- Confirmed by static review only that the fixed source migration is the production source of truth and that `supabase/validation/patch_consume_chart_ai_usage_v0_1.sql` remains disposable repair SQL.
- Updated `supabase/validation/README.md` with a cross-reference to the readiness review.

### Safety Notes

- Codex did not connect to Supabase.
- Codex did not run SQL.
- Codex did not run Supabase CLI.
- Codex did not run `psql`.
- Codex did not run any database command.
- No production migration was applied.
- No secret values, project refs, URLs, connection strings, tokens, anon keys, service-role keys, JWT secrets, or database passwords were requested or recorded.
- Owner confirmations remain required before Phase 2K.
- The exact Phase 2K approval phrase remains mandatory.
- Production data, backup, and rollback decision gaps remain documented blockers before execution.

## Phase 2J - 2026-06-17

### Production Migration Application Plan

- Created `docs/planning/supabase_production_migration_application_plan_v0.1.md`.
- Documented the production migration hard gates, backup/recovery checks, pre-flight checklist, future Phase 2K execution sequence, patch handling rule, post-migration validation checklist, and production test user policy.
- Recorded that successful disposable validation does not authorize production migration.
- Recorded the exact owner approval phrase required before Phase 2K can start.
- Documented that `supabase/validation/patch_consume_chart_ai_usage_v0_1.sql` is disposable-validation repair SQL and should not be applied to fresh production when the fixed source migration is used.
- Updated `supabase/validation/README.md` with a cross-reference to the production migration application plan.

### Safety Notes

- Codex did not connect to Supabase.
- Codex did not run any database command.
- Codex did not apply migration or patch SQL.
- Production Supabase was not touched.
- No secret values, project refs, URLs, connection strings, tokens, anon keys, service-role keys, or database passwords were requested or recorded.
- Disposable project retention remains an owner decision; disposable credentials must never be used in Vercel production.

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
