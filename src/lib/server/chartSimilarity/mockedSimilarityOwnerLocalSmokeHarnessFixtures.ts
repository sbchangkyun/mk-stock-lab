/**
 * Mocked, deterministic fixtures for the owner-local KIS similarity smoke harness (Phase 3FA-C).
 *
 * These fixtures wrap the real harness builders and contain no actual stock code, no actual KIS
 * value, no raw KIS response field, no actual OHLC price or volume, no market timestamp, no
 * similarity score or return computed from real data, no token, no email, no IP address, no
 * cookie or header, no raw auth provider payload, no account or trading field, no SQL string, and
 * no DB/cache runtime reference. They exist for tests and documentation only.
 */

import {
  buildDefaultSimilarityOwnerLocalSmokeHarnessPolicy,
  buildOwnerLocalSmokeHarnessBlockedReport,
  buildOwnerLocalSmokeHarnessChecks,
  buildOwnerLocalSmokeHarnessSteps,
  runOwnerLocalSmokeHarnessDisabled,
} from './similarityOwnerLocalSmokeHarness';
import type {
  SimilarityOwnerLocalSmokeHarnessCheck,
  SimilarityOwnerLocalSmokeHarnessPolicy,
  SimilarityOwnerLocalSmokeHarnessReport,
  SimilarityOwnerLocalSmokeHarnessResult,
  SimilarityOwnerLocalSmokeHarnessStep,
} from './similarityOwnerLocalSmokeHarnessTypes';

/** Mocked disabled-by-default harness policy, identical in shape to the real default policy. */
export const buildMockedOwnerLocalSmokeHarnessPolicy = (): SimilarityOwnerLocalSmokeHarnessPolicy =>
  buildDefaultSimilarityOwnerLocalSmokeHarnessPolicy();

/** Mocked ordered harness steps, identical in shape to the real step list. */
export const buildMockedOwnerLocalSmokeHarnessSteps = (): SimilarityOwnerLocalSmokeHarnessStep[] =>
  buildOwnerLocalSmokeHarnessSteps();

/** Mocked harness checks, identical in shape to the real static safety checks. */
export const buildMockedOwnerLocalSmokeHarnessChecks = (): SimilarityOwnerLocalSmokeHarnessCheck[] =>
  buildOwnerLocalSmokeHarnessChecks();

/** Mocked blocked report, identical in shape to the real safe blocked report. */
export const buildMockedOwnerLocalSmokeHarnessBlockedReport = (): SimilarityOwnerLocalSmokeHarnessReport =>
  buildOwnerLocalSmokeHarnessBlockedReport();

/** Mocked disabled harness result, built from the real disabled runner under the default policy. */
export const buildMockedOwnerLocalSmokeHarnessResult = (): SimilarityOwnerLocalSmokeHarnessResult =>
  runOwnerLocalSmokeHarnessDisabled(buildDefaultSimilarityOwnerLocalSmokeHarnessPolicy());
