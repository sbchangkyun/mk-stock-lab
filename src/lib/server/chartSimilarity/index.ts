/**
 * Public exports for the server-only KIS OHLC provider foundation (Phase 3EY-A).
 *
 * Server-only: do not import this module from client-accessible page or API code. Live KIS
 * execution remains feature-flag off; see `kisOhlcProviderPolicy.ts` for policy defaults and
 * `serverOnlyKisOhlcProvider.ts` for the disabled-by-default provider foundation.
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
