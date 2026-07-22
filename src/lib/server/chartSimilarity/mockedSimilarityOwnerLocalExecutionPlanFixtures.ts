/**
 * Mocked owner-local KIS-normalized execution plan fixtures for Chart Similarity execution
 * (Phase 3FA-A).
 *
 * All values are fixed and synthetic: no real stock code, no real KIS values, no raw KIS response
 * fields, no token, no email, no IP address, no cookies/headers, no raw auth provider payload, no
 * account/trading fields, no SQL, no DB/cache runtime. These fixtures exist only to exercise
 * `similarityOwnerLocalExecutionPlan.ts` and must never be treated as real execution data.
 */

import {
  buildDefaultSimilarityOwnerLocalExecutionPlanPolicy,
  buildOwnerLocalExecutionGates,
  buildOwnerLocalProviderExpectation,
  buildSimilarityOwnerLocalExecutionPlanResult,
} from './similarityOwnerLocalExecutionPlan';
import type {
  SimilarityOwnerLocalExecutionGate,
  SimilarityOwnerLocalExecutionPlanPolicy,
  SimilarityOwnerLocalExecutionPlanResult,
  SimilarityOwnerLocalProviderExpectation,
} from './similarityOwnerLocalExecutionPlanTypes';

export const buildMockedOwnerLocalExecutionPlanPolicy =
  (): SimilarityOwnerLocalExecutionPlanPolicy => buildDefaultSimilarityOwnerLocalExecutionPlanPolicy();

export const buildMockedOwnerLocalProviderExpectation = (): SimilarityOwnerLocalProviderExpectation =>
  buildOwnerLocalProviderExpectation('stock');

export const buildMockedOwnerLocalExecutionGates = (): SimilarityOwnerLocalExecutionGate[] =>
  buildOwnerLocalExecutionGates();

export const buildMockedOwnerLocalExecutionPlanResult = (): SimilarityOwnerLocalExecutionPlanResult =>
  buildSimilarityOwnerLocalExecutionPlanResult(buildMockedOwnerLocalExecutionPlanPolicy(), 'stock');

/**
 * Builds a plan result that explicitly demonstrates the always-denied outcome in this phase: every
 * approval-dependent gate remains unsatisfied and `policy.enabled` remains fixed `false`, so
 * owner-local execution is denied regardless of the requested asset type.
 */
export const buildMockedOwnerLocalExecutionDeniedResult = (): SimilarityOwnerLocalExecutionPlanResult => {
  const result = buildSimilarityOwnerLocalExecutionPlanResult(buildMockedOwnerLocalExecutionPlanPolicy(), 'etf');
  return {
    ...result,
    status: 'blocked',
    safeMessage: 'Owner-local execution is denied in this phase: required approval gates are not satisfied.',
    warnings: [...result.warnings, 'Execution denied: one or more required activation gates are unsatisfied.'],
  };
};
