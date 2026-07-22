/**
 * Mocked, deterministic fixtures for the owner-local manual smoke execution closeout (Phase 3FA-D).
 *
 * These fixtures wrap the real closeout builders and contain no actual stock code, no actual KIS
 * value, no raw KIS response field, no actual OHLC price or volume, no market timestamp, no
 * similarity score or return computed from real data, no token, no email, no IP address, no
 * cookie or header, no raw auth provider payload, no account or trading field, no SQL string, and
 * no DB/cache runtime reference. They exist for tests and documentation only.
 */

import {
  buildDefaultSimilarityOwnerLocalSmokeCloseoutPolicy,
  buildOwnerLocalSmokeCloseoutChecks,
  buildOwnerLocalSmokeCloseoutReport,
  buildSimilarityOwnerLocalSmokeCloseoutResult,
} from './similarityOwnerLocalSmokeCloseout';
import type {
  SimilarityOwnerLocalSmokeCloseoutCheck,
  SimilarityOwnerLocalSmokeCloseoutPolicy,
  SimilarityOwnerLocalSmokeCloseoutReport,
  SimilarityOwnerLocalSmokeCloseoutResult,
} from './similarityOwnerLocalSmokeCloseoutTypes';

/** Mocked disabled-by-default closeout policy, identical in shape to the real default policy. */
export const buildMockedOwnerLocalSmokeCloseoutPolicy = (): SimilarityOwnerLocalSmokeCloseoutPolicy =>
  buildDefaultSimilarityOwnerLocalSmokeCloseoutPolicy();

/** Mocked closeout checks, identical in shape to the real static closeout checks. */
export const buildMockedOwnerLocalSmokeCloseoutChecks = (): SimilarityOwnerLocalSmokeCloseoutCheck[] =>
  buildOwnerLocalSmokeCloseoutChecks();

/** Mocked closeout report, identical in shape to the real safe closeout report. */
export const buildMockedOwnerLocalSmokeCloseoutReport = (): SimilarityOwnerLocalSmokeCloseoutReport =>
  buildOwnerLocalSmokeCloseoutReport();

/** Mocked closeout result, built from the real closeout builder under the default policy. */
export const buildMockedOwnerLocalSmokeCloseoutResult = (): SimilarityOwnerLocalSmokeCloseoutResult =>
  buildSimilarityOwnerLocalSmokeCloseoutResult(buildDefaultSimilarityOwnerLocalSmokeCloseoutPolicy());

/**
 * Builds a closeout result that explicitly demonstrates the blocked-pending-approval outcome:
 * `policy.enabled` and `liveSmokeExecuted` remain fixed `false`, and the report's decision-
 * dependent checks remain unsatisfied until a separately authorized phase approves manual
 * execution. Still contains no live execution and no real data.
 */
export const buildMockedOwnerLocalSmokeCloseoutBlockedResult = (): SimilarityOwnerLocalSmokeCloseoutResult => {
  const result = buildSimilarityOwnerLocalSmokeCloseoutResult(buildDefaultSimilarityOwnerLocalSmokeCloseoutPolicy());
  return {
    ...result,
    status: 'blocked',
    report: { ...result.report, status: 'blocked', decision: 'blocked_by_policy', nextAllowedPhase: 'blocked' },
    warnings: [...result.warnings, 'Closeout blocked: owner approval for a separate manual smoke phase has not been granted.'],
  };
};
