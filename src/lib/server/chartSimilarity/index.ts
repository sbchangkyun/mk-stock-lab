/**
 * Public exports for the server-only KIS OHLC provider foundation (Phase 3EY-A), its mocked
 * adapter / test harness (Phase 3EY-B), and its auth/usage execution guard foundation
 * (Phase 3EY-C).
 *
 * Server-only: do not import this module from client-accessible page or API code. Live KIS
 * execution remains feature-flag off; see `kisOhlcProviderPolicy.ts` for policy defaults and
 * `serverOnlyKisOhlcProvider.ts` for the disabled-by-default provider foundation. The mocked
 * adapter (`mockedKisOhlcAdapter.ts`) is a non-live test harness only. The execution guard
 * (`similarityExecutionGuard.ts`) is a disabled-by-default, policy-first evaluator only — it
 * implements no real auth, no usage storage, and is not wired into any API route.
 */

export type {
  ServerOnlyKisOhlcProviderStatus,
  ServerOnlyKisOhlcRequest,
  ServerOnlyKisOhlcPolicy,
  ServerOnlyKisOhlcResult,
  NormalizedDailyOhlcInput,
  NormalizedDailyOhlcMeta,
} from './kisOhlcProviderTypes';

export {
  CHART_AI_SIMILARITY_KIS_OHLC_ENABLED,
  CHART_AI_SIMILARITY_REQUIRE_AUTH,
  CHART_AI_SIMILARITY_REQUIRE_USAGE_GUARD,
  buildDefaultServerOnlyKisOhlcPolicy,
} from './kisOhlcProviderPolicy';

export type { ServerOnlyKisOhlcRequestValidation } from './serverOnlyKisOhlcProvider';

export {
  normalizeServerOnlyKisOhlcRequest,
  validateServerOnlyKisOhlcRequest,
  getServerOnlyKisOhlcForSimilarity,
  toSimilarityOhlcBarsFromNormalizedDailyBars,
} from './serverOnlyKisOhlcProvider';

export type { MockedServerOnlyKisOhlcAdapterInput } from './mockedKisOhlcAdapter';

export { getMockedServerOnlyKisOhlcForSimilarity } from './mockedKisOhlcAdapter';

export {
  buildMockedNormalizedDailyOhlcInput,
  buildInvalidMockedNormalizedDailyOhlcInput,
} from './mockedKisOhlcFixtures';

export type {
  SimilarityExecutionRole,
  SimilarityExecutionAuthState,
  SimilarityExecutionUsageWindow,
  SimilarityExecutionGuardStatus,
  SimilarityExecutionPurpose,
  SimilarityExecutionSource,
  SimilarityExecutionGuardRequest,
  SimilarityExecutionUsageSnapshot,
  SimilarityExecutionGuardPolicy,
  SimilarityExecutionGuardResult,
} from './similarityExecutionGuardTypes';

export {
  CHART_AI_SIMILARITY_EXECUTION_ENABLED,
  CHART_AI_SIMILARITY_AUTH_REQUIRED,
  CHART_AI_SIMILARITY_USAGE_GUARD_REQUIRED,
  buildDefaultSimilarityExecutionGuardPolicy,
} from './similarityExecutionGuardPolicy';

export type { SimilarityExecutionGuardRequestValidation } from './similarityExecutionGuard';

export {
  normalizeSimilarityExecutionGuardRequest,
  buildUsageSnapshot,
  getRoleDailyLimit,
  evaluateSimilarityExecutionGuard,
} from './similarityExecutionGuard';

export {
  buildMockedAnonymousSimilarityGuardRequest,
  buildMockedAuthenticatedSimilarityGuardRequest,
  buildMockedBetaSimilarityGuardRequest,
  buildMockedOwnerSimilarityGuardRequest,
  buildMockedInvalidSimilarityGuardRequest,
  buildMockedUsageSnapshot,
} from './mockedSimilarityExecutionGuardFixtures';
