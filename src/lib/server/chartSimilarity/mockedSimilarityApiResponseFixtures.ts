/**
 * Mocked `SimilarityApiResponse` fixtures for the Chart Similarity API response contract test
 * (Phase 3EY-D). Each fixture drives the real guard evaluator and the real response builder with
 * fixed, synthetic guard requests/policies/usage snapshots to deterministically produce one
 * response per guard status. No real user id, email, token, IP address, auth payload, raw KIS
 * payload, or real market data appears anywhere. No API route is added or called.
 */

import { buildDefaultSimilarityExecutionGuardPolicy } from './similarityExecutionGuardPolicy';
import { evaluateSimilarityExecutionGuard, buildUsageSnapshot } from './similarityExecutionGuard';
import {
  buildMockedAnonymousSimilarityGuardRequest,
  buildMockedAuthenticatedSimilarityGuardRequest,
  buildMockedInvalidSimilarityGuardRequest,
} from './mockedSimilarityExecutionGuardFixtures';
import { buildSimilarityApiResponseFromGuard } from './similarityApiResponseBuilder';
import type { SimilarityApiResponse } from './similarityApiResponseTypes';

/** Allowed/success path: anonymous mocked-preview request against the default (disabled) policy. */
export const buildMockedSimilarityApiAllowedResponse = (): SimilarityApiResponse => {
  const request = buildMockedAnonymousSimilarityGuardRequest();
  const guardResult = evaluateSimilarityExecutionGuard(request, {
    policy: buildDefaultSimilarityExecutionGuardPolicy(),
  });
  return buildSimilarityApiResponseFromGuard(guardResult);
};

/** Auth-required path: an unauthenticated kis-normalized request against an enabled policy. */
export const buildMockedSimilarityApiAuthRequiredResponse = (): SimilarityApiResponse => {
  const anonymous = buildMockedAnonymousSimilarityGuardRequest();
  const request = { ...anonymous, source: 'kis-normalized' as const };
  const policy = { ...buildDefaultSimilarityExecutionGuardPolicy(), enabled: true };
  const guardResult = evaluateSimilarityExecutionGuard(request, { policy });
  return buildSimilarityApiResponseFromGuard(guardResult);
};

/** Usage-limited path: an authenticated kis-normalized request with a fully-consumed usage snapshot. */
export const buildMockedSimilarityApiUsageLimitedResponse = (): SimilarityApiResponse => {
  const request = buildMockedAuthenticatedSimilarityGuardRequest();
  const policy = { ...buildDefaultSimilarityExecutionGuardPolicy(), enabled: true };
  const usage = buildUsageSnapshot('daily', 3, 3);
  const guardResult = evaluateSimilarityExecutionGuard(request, { policy, usage });
  return buildSimilarityApiResponseFromGuard(guardResult);
};

/** Feature-disabled path: an authenticated kis-normalized request against the default (disabled) policy. */
export const buildMockedSimilarityApiFeatureDisabledResponse = (): SimilarityApiResponse => {
  const request = buildMockedAuthenticatedSimilarityGuardRequest();
  const guardResult = evaluateSimilarityExecutionGuard(request, {
    policy: buildDefaultSimilarityExecutionGuardPolicy(),
  });
  return buildSimilarityApiResponseFromGuard(guardResult);
};

/** Not-configured path: an authenticated kis-normalized request against an enabled policy with no usage snapshot. */
export const buildMockedSimilarityApiNotConfiguredResponse = (): SimilarityApiResponse => {
  const request = buildMockedAuthenticatedSimilarityGuardRequest();
  const policy = { ...buildDefaultSimilarityExecutionGuardPolicy(), enabled: true };
  const guardResult = evaluateSimilarityExecutionGuard(request, { policy, usage: null });
  return buildSimilarityApiResponseFromGuard(guardResult);
};

/** Blocked path: a structurally invalid request (empty symbol), which is rejected before any policy branching. */
export const buildMockedSimilarityApiBlockedResponse = (): SimilarityApiResponse => {
  const request = buildMockedInvalidSimilarityGuardRequest();
  const guardResult = evaluateSimilarityExecutionGuard(request, {
    policy: buildDefaultSimilarityExecutionGuardPolicy(),
  });
  return buildSimilarityApiResponseFromGuard(guardResult);
};
