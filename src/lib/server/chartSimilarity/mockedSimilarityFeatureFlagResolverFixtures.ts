/**
 * Deterministic mocked fixtures for the Chart Similarity feature flag resolver scaffold (Phase
 * 3FC-F). Every builder returns a plain, synthetic input object for
 * `resolveSimilarityFeatureFlags` — there is no env value, Vercel env value, email, IP address,
 * user agent, token-like string, real user identifier, raw session/KIS payload, OHLC/price/volume
 * value, or account/trading/balance field anywhere in this file. Timestamps and reference strings
 * are fixed literals, not `Date.now()` or `Math.random()`, so results are fully reproducible.
 */

import type { SimilarityFeatureFlagRecord, SimilarityFeatureFlagResolverInput } from './similarityFeatureFlagResolverTypes';

const FIXED_UPDATED_AT_ISO = '2026-07-04T12:00:00.000+09:00';
const FIXED_UPDATED_BY_REF = 'mock-feature-flag-admin-001';

const buildFlagRecord = (
  key: SimilarityFeatureFlagRecord['key'],
  enabled: boolean,
  overrides: Partial<SimilarityFeatureFlagRecord> = {},
): SimilarityFeatureFlagRecord => ({
  key,
  enabled,
  source: 'mocked-flag',
  updatedAtIso: FIXED_UPDATED_AT_ISO,
  updatedByRef: FIXED_UPDATED_BY_REF,
  active: true,
  ...overrides,
});

/** A. All flags off: every mocked record present but explicitly disabled. */
export const buildMockedAllFlagsOffFeatureFlagResolverInput = (): SimilarityFeatureFlagResolverInput => ({
  mockedFlags: [
    buildFlagRecord('AUTH_RUNTIME_ENABLED', false),
    buildFlagRecord('USAGE_STORAGE_ENABLED', false),
    buildFlagRecord('CHART_AI_SIMILARITY_BETA_ENABLED', false),
    buildFlagRecord('CHART_AI_SIMILARITY_PUBLIC_ENABLED', false),
    buildFlagRecord('LIVE_KIS_OHLC_ENABLED', false),
  ],
  requestedCapability: null,
});

/** B. Auth only: only `AUTH_RUNTIME_ENABLED` is true. */
export const buildMockedAuthOnlyFeatureFlagResolverInput = (): SimilarityFeatureFlagResolverInput => ({
  mockedFlags: [buildFlagRecord('AUTH_RUNTIME_ENABLED', true)],
  requestedCapability: 'auth_runtime',
});

/** C. Auth + usage + beta ready: all three beta dependency flags are true. */
export const buildMockedAuthUsageBetaReadyFeatureFlagResolverInput = (): SimilarityFeatureFlagResolverInput => ({
  mockedFlags: [
    buildFlagRecord('AUTH_RUNTIME_ENABLED', true),
    buildFlagRecord('USAGE_STORAGE_ENABLED', true),
    buildFlagRecord('CHART_AI_SIMILARITY_BETA_ENABLED', true),
  ],
  requestedCapability: 'beta_similarity',
});

/** D. Beta missing auth: beta flag true, auth flag false, usage flag true. */
export const buildMockedBetaMissingAuthFeatureFlagResolverInput = (): SimilarityFeatureFlagResolverInput => ({
  mockedFlags: [
    buildFlagRecord('AUTH_RUNTIME_ENABLED', false),
    buildFlagRecord('USAGE_STORAGE_ENABLED', true),
    buildFlagRecord('CHART_AI_SIMILARITY_BETA_ENABLED', true),
  ],
  requestedCapability: 'beta_similarity',
});

/** E. Beta missing usage: beta flag true, auth flag true, usage flag false. */
export const buildMockedBetaMissingUsageFeatureFlagResolverInput = (): SimilarityFeatureFlagResolverInput => ({
  mockedFlags: [
    buildFlagRecord('AUTH_RUNTIME_ENABLED', true),
    buildFlagRecord('USAGE_STORAGE_ENABLED', false),
    buildFlagRecord('CHART_AI_SIMILARITY_BETA_ENABLED', true),
  ],
  requestedCapability: 'beta_similarity',
});

/** F. Public requested with full beta dependency chain satisfied. */
export const buildMockedPublicRequestedFeatureFlagResolverInput = (): SimilarityFeatureFlagResolverInput => ({
  mockedFlags: [
    buildFlagRecord('AUTH_RUNTIME_ENABLED', true),
    buildFlagRecord('USAGE_STORAGE_ENABLED', true),
    buildFlagRecord('CHART_AI_SIMILARITY_BETA_ENABLED', true),
    buildFlagRecord('CHART_AI_SIMILARITY_PUBLIC_ENABLED', true),
  ],
  requestedCapability: 'public_similarity',
});

/** G. Live KIS requested in isolation. */
export const buildMockedLiveKisRequestedFeatureFlagResolverInput = (): SimilarityFeatureFlagResolverInput => ({
  mockedFlags: [buildFlagRecord('LIVE_KIS_OHLC_ENABLED', true)],
  requestedCapability: 'live_kis_ohlc',
});

/** H. Duplicate active records for the same key: both are ignored, default false is kept. */
export const buildMockedDuplicateFlagIgnoredFeatureFlagResolverInput = (): SimilarityFeatureFlagResolverInput => ({
  mockedFlags: [
    buildFlagRecord('AUTH_RUNTIME_ENABLED', true, { updatedByRef: 'mock-feature-flag-admin-001' }),
    buildFlagRecord('AUTH_RUNTIME_ENABLED', false, { updatedByRef: 'mock-feature-flag-admin-002' }),
  ],
  requestedCapability: 'auth_runtime',
});

/** I. `clientClaimedFlags` is always ignored and only adds a warning. */
export const buildMockedClientClaimedFlagsIgnoredFeatureFlagResolverInput = (): SimilarityFeatureFlagResolverInput => ({
  mockedFlags: [buildFlagRecord('AUTH_RUNTIME_ENABLED', true)],
  requestedCapability: 'auth_runtime',
  clientClaimedFlags: {
    AUTH_RUNTIME_ENABLED: true,
    USAGE_STORAGE_ENABLED: true,
    CHART_AI_SIMILARITY_BETA_ENABLED: true,
    CHART_AI_SIMILARITY_PUBLIC_ENABLED: true,
    LIVE_KIS_OHLC_ENABLED: true,
  },
});
