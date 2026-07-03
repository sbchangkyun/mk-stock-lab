/**
 * Server-only auth/usage guard policy for Chart Similarity execution (Phase 3EY-C).
 *
 * Defines a candidate feature flag name and a deterministic default policy for the future
 * execution guard that will sit in front of any authenticated Chart Similarity API route. This
 * module never reads `process.env`, never reads `.env`, and never prints an environment value.
 * It only declares flag NAMES and safe default policy VALUES — turning the flags on requires
 * separate owner approval and a later phase that reads them explicitly.
 */

import type { SimilarityExecutionGuardPolicy } from './similarityExecutionGuardTypes';

/** Candidate feature flag name only — no value is read or assumed in this phase. */
export const CHART_AI_SIMILARITY_EXECUTION_ENABLED = 'CHART_AI_SIMILARITY_EXECUTION_ENABLED';

/** Candidate feature flag name only — no value is read or assumed in this phase. */
export const CHART_AI_SIMILARITY_AUTH_REQUIRED = 'CHART_AI_SIMILARITY_AUTH_REQUIRED';

/** Candidate feature flag name only — no value is read or assumed in this phase. */
export const CHART_AI_SIMILARITY_USAGE_GUARD_REQUIRED = 'CHART_AI_SIMILARITY_USAGE_GUARD_REQUIRED';

/**
 * Builds the default similarity execution guard policy. Every call returns a fresh,
 * deterministic object with live execution disabled. No environment or secret value is ever
 * read here.
 */
export const buildDefaultSimilarityExecutionGuardPolicy = (): SimilarityExecutionGuardPolicy => ({
  enabled: false,
  requireAuth: true,
  requireUsageGuard: true,
  allowAnonymousMockedPreview: true,
  allowPublicKisExecution: false,
  allowOwnerLocalBypass: false,
  defaultDailyLimit: 3,
  betaDailyLimit: 10,
  ownerDailyLimit: 50,
  adminDailyLimit: 100,
  featureFlagName: CHART_AI_SIMILARITY_EXECUTION_ENABLED,
  notes: [
    'Live Chart Similarity execution is feature-flag off by default until separately approved by the owner.',
    'Real execution will require authentication and a usage guard before it may run.',
    'This policy module never reads process.env or .env values.',
  ],
});
