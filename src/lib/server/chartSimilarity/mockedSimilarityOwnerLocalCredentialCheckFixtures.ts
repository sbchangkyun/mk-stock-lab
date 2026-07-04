/**
 * Deterministic, non-live mocked fixtures for the owner-local KIS credential configuration check
 * (Phase 3FA-D-MANUAL-RUN-HF1). These fixtures contain only key NAMES and boolean presence flags —
 * never a real environment value, credential, token, market value, or account/trading/order/
 * balance/DB/cache field.
 */

import {
  buildDefaultSimilarityOwnerLocalCredentialCheckPolicy,
  buildOwnerLocalCredentialCheckReport,
  buildOwnerLocalCredentialCheckResult,
  buildOwnerLocalCredentialKeyRequirements,
} from './similarityOwnerLocalCredentialCheck';
import type {
  SimilarityOwnerLocalCredentialCheckPolicy,
  SimilarityOwnerLocalCredentialCheckResult,
  SimilarityOwnerLocalCredentialKeyRequirement,
} from './similarityOwnerLocalCredentialCheckTypes';

/** Deterministic mocked policy, identical in shape to the default policy. */
export const buildMockedOwnerLocalCredentialCheckPolicy =
  (): SimilarityOwnerLocalCredentialCheckPolicy => buildDefaultSimilarityOwnerLocalCredentialCheckPolicy();

/** Deterministic mocked requirement list, identical in shape to the real requirement builder. */
export const buildMockedOwnerLocalCredentialRequirements =
  (): SimilarityOwnerLocalCredentialKeyRequirement[] => buildOwnerLocalCredentialKeyRequirements();

/** Deterministic mocked result where no required key name is present. */
export const buildMockedOwnerLocalCredentialMissingResult =
  (): SimilarityOwnerLocalCredentialCheckResult => {
    const policy = buildMockedOwnerLocalCredentialCheckPolicy();
    const requirements = buildMockedOwnerLocalCredentialRequirements();
    const presence: Record<string, boolean> = {
      KIS_APP_KEY: false,
      KIS_APP_SECRET: false,
      KIS_BASE_URL: false,
    };
    const report = buildOwnerLocalCredentialCheckReport(requirements, presence);
    return buildOwnerLocalCredentialCheckResult(policy, report);
  };

/** Deterministic mocked result where only some required key names are present. */
export const buildMockedOwnerLocalCredentialPartialResult =
  (): SimilarityOwnerLocalCredentialCheckResult => {
    const policy = buildMockedOwnerLocalCredentialCheckPolicy();
    const requirements = buildMockedOwnerLocalCredentialRequirements();
    const presence: Record<string, boolean> = {
      KIS_APP_KEY: true,
      KIS_APP_SECRET: false,
      KIS_BASE_URL: false,
    };
    const report = buildOwnerLocalCredentialCheckReport(requirements, presence);
    return buildOwnerLocalCredentialCheckResult(policy, report);
  };

/** Deterministic mocked result where all required key names are present. */
export const buildMockedOwnerLocalCredentialConfiguredResult =
  (): SimilarityOwnerLocalCredentialCheckResult => {
    const policy = buildMockedOwnerLocalCredentialCheckPolicy();
    const requirements = buildMockedOwnerLocalCredentialRequirements();
    const presence: Record<string, boolean> = {
      KIS_APP_KEY: true,
      KIS_APP_SECRET: true,
      KIS_BASE_URL: true,
    };
    const report = buildOwnerLocalCredentialCheckReport(requirements, presence);
    return buildOwnerLocalCredentialCheckResult(policy, report);
  };
