/**
 * Public exports for the server-only KIS OHLC provider foundation (Phase 3EY-A) and its
 * mocked adapter / test harness (Phase 3EY-B).
 *
 * Server-only: do not import this module from client-accessible page or API code. Live KIS
 * execution remains feature-flag off; see `kisOhlcProviderPolicy.ts` for policy defaults and
 * `serverOnlyKisOhlcProvider.ts` for the disabled-by-default provider foundation. The mocked
 * adapter (`mockedKisOhlcAdapter.ts`) is a non-live test harness only.
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
