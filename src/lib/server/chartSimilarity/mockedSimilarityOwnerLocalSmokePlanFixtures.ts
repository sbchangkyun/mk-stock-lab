/**
 * Mocked owner-local KIS similarity smoke plan fixtures for Chart Similarity execution
 * (Phase 3FA-B).
 *
 * All values are fixed and synthetic: no real stock code, no real KIS values, no raw KIS response
 * fields, no actual OHLC/volume/timestamps, no similarity score or derived return computed from
 * real data, no token, no email, no IP address, no cookies/headers, no raw auth provider payload,
 * no account/trading fields, no SQL, no DB/cache runtime. These fixtures exist only to exercise
 * `similarityOwnerLocalSmokePlan.ts` and must never be treated as a real smoke result.
 */

import {
  buildDefaultSimilarityOwnerLocalSmokePlanPolicy,
  buildOwnerLocalSmokeGates,
  buildOwnerLocalSmokeRedactionPolicy,
  buildOwnerLocalSmokeReportTemplate,
  buildOwnerLocalSmokeStages,
  buildSimilarityOwnerLocalSmokePlanResult,
} from './similarityOwnerLocalSmokePlan';
import type {
  SimilarityOwnerLocalSmokeGate,
  SimilarityOwnerLocalSmokePlanPolicy,
  SimilarityOwnerLocalSmokePlanResult,
  SimilarityOwnerLocalSmokeRedactionPolicy,
  SimilarityOwnerLocalSmokeReportTemplate,
  SimilarityOwnerLocalSmokeStage,
} from './similarityOwnerLocalSmokePlanTypes';

export const buildMockedOwnerLocalSmokePlanPolicy = (): SimilarityOwnerLocalSmokePlanPolicy =>
  buildDefaultSimilarityOwnerLocalSmokePlanPolicy();

export const buildMockedOwnerLocalSmokeStages = (): SimilarityOwnerLocalSmokeStage[] =>
  buildOwnerLocalSmokeStages();

export const buildMockedOwnerLocalSmokeGates = (): SimilarityOwnerLocalSmokeGate[] =>
  buildOwnerLocalSmokeGates();

export const buildMockedOwnerLocalSmokeRedactionPolicy = (): SimilarityOwnerLocalSmokeRedactionPolicy =>
  buildOwnerLocalSmokeRedactionPolicy();

export const buildMockedOwnerLocalSmokeReportTemplate = (): SimilarityOwnerLocalSmokeReportTemplate =>
  buildOwnerLocalSmokeReportTemplate();

export const buildMockedOwnerLocalSmokePlanResult = (): SimilarityOwnerLocalSmokePlanResult =>
  buildSimilarityOwnerLocalSmokePlanResult(buildMockedOwnerLocalSmokePlanPolicy());

/**
 * Builds a plan result that explicitly demonstrates the always-denied outcome in this phase: every
 * approval-dependent gate remains unsatisfied and `policy.enabled` remains fixed `false`, so an
 * owner-local smoke is denied.
 */
export const buildMockedOwnerLocalSmokeDeniedResult = (): SimilarityOwnerLocalSmokePlanResult => {
  const result = buildSimilarityOwnerLocalSmokePlanResult(buildMockedOwnerLocalSmokePlanPolicy());
  return {
    ...result,
    status: 'blocked',
    safeMessage: 'Owner-local smoke is denied in this phase: required preflight gates are not satisfied.',
    warnings: [...result.warnings, 'Smoke denied: one or more required gates are unsatisfied.'],
  };
};
