/**
 * Server-only KIS OHLC provider policy (Phase 3EY-A).
 *
 * Defines candidate feature flag names and a deterministic default policy for the future
 * KIS OHLC provider used by Chart Similarity. This module never reads `process.env`, never
 * reads `.env`, and never prints an environment value. It only declares flag NAMES and safe
 * default policy VALUES — turning the flags on requires separate owner approval and a later
 * phase that reads them explicitly.
 */

import type { ServerOnlyKisOhlcPolicy } from './kisOhlcProviderTypes';

/** Candidate feature flag name only — no value is read or assumed in this phase. */
export const CHART_AI_SIMILARITY_KIS_OHLC_ENABLED = 'CHART_AI_SIMILARITY_KIS_OHLC_ENABLED';

/** Candidate feature flag name only — no value is read or assumed in this phase. */
export const CHART_AI_SIMILARITY_REQUIRE_AUTH = 'CHART_AI_SIMILARITY_REQUIRE_AUTH';

/** Candidate feature flag name only — no value is read or assumed in this phase. */
export const CHART_AI_SIMILARITY_REQUIRE_USAGE_GUARD = 'CHART_AI_SIMILARITY_REQUIRE_USAGE_GUARD';

/**
 * Builds the default server-only KIS OHLC policy. Every call returns a fresh, deterministic
 * object with live execution disabled. No environment or secret value is ever read here.
 */
export const buildDefaultServerOnlyKisOhlcPolicy = (): ServerOnlyKisOhlcPolicy => ({
  enabled: false,
  requireAuth: true,
  requireUsageGuard: true,
  allowPublicExecution: false,
  allowClientSecretExposure: false,
  allowRawProviderPayload: false,
  featureFlagName: CHART_AI_SIMILARITY_KIS_OHLC_ENABLED,
  notes: [
    'Live KIS OHLC execution is feature-flag off by default until separately approved by the owner.',
    'Real execution will require authentication and a usage guard before it may run.',
    'This policy module never reads process.env or .env values.',
  ],
});
