/**
 * Mocked owner-local manual smoke run fixtures for Chart Similarity execution
 * (Phase 3FA-D-MANUAL-RUN).
 *
 * Deterministic, non-live fixtures only. No actual stock code, no actual KIS value, no raw KIS
 * response field, no actual OHLC/volume/timestamp, no similarity score/return from real data, no
 * token, no email, no IP address, no cookie/header, no raw auth provider payload, no account/
 * trading field, no SQL, and no DB/cache runtime appears anywhere in this file.
 */

import {
  buildApprovedSimilarityOwnerLocalManualRunPolicy,
  buildDefaultSimilarityOwnerLocalManualRunPolicy,
  buildOwnerLocalManualRunBlockedReport,
  buildOwnerLocalManualRunRedactedReport,
  buildOwnerLocalManualRunResult,
} from './similarityOwnerLocalManualRun';
import type {
  SimilarityOwnerLocalManualRunPolicy,
  SimilarityOwnerLocalManualRunReport,
  SimilarityOwnerLocalManualRunResult,
} from './similarityOwnerLocalManualRunTypes';

export const buildMockedOwnerLocalManualRunDefaultPolicy = (): SimilarityOwnerLocalManualRunPolicy =>
  buildDefaultSimilarityOwnerLocalManualRunPolicy();

export const buildMockedOwnerLocalManualRunApprovedPolicy = (): SimilarityOwnerLocalManualRunPolicy =>
  buildApprovedSimilarityOwnerLocalManualRunPolicy();

export const buildMockedOwnerLocalManualRunBlockedReport = (): SimilarityOwnerLocalManualRunReport =>
  buildOwnerLocalManualRunBlockedReport(buildMockedOwnerLocalManualRunDefaultPolicy());

export const buildMockedOwnerLocalManualRunExecutedRedactedReport = (): SimilarityOwnerLocalManualRunReport =>
  buildOwnerLocalManualRunRedactedReport({
    policy: buildMockedOwnerLocalManualRunApprovedPolicy(),
    providerProbe: {
      status: 'pass',
      provider: 'kis',
      market: 'KR',
      timeframe: 'daily',
      normalizedBarsAvailable: true,
      normalizedBarCountBucket: 'twenty_one_to_one_hundred',
      safeMessage: 'Mocked provider probe reports normalized bars are available (non-live fixture).',
    },
    engineContractCheck: {
      status: 'not_run',
      engineInvoked: false,
      safeMessage: 'The similarity engine was not invoked in this mocked fixture.',
    },
    redactionCheck: {
      status: 'pass',
      rawProviderPayloadPrinted: false,
      marketValuesPrinted: false,
      credentialsPrinted: false,
      envValuesPrinted: false,
      safeMessage: 'Mocked redaction check passed; no raw value is present.',
    },
  });

export const buildMockedOwnerLocalManualRunFailedRedactedReport = (): SimilarityOwnerLocalManualRunReport =>
  buildOwnerLocalManualRunRedactedReport({
    policy: buildMockedOwnerLocalManualRunApprovedPolicy(),
    providerProbe: {
      status: 'fail',
      provider: 'kis',
      market: 'KR',
      timeframe: 'daily',
      normalizedBarsAvailable: false,
      normalizedBarCountBucket: 'none',
      safeMessage: 'Mocked provider probe reports a failure (non-live fixture).',
    },
    engineContractCheck: {
      status: 'not_run',
      engineInvoked: false,
      safeMessage: 'The similarity engine was not invoked in this mocked fixture.',
    },
    redactionCheck: {
      status: 'pass',
      rawProviderPayloadPrinted: false,
      marketValuesPrinted: false,
      credentialsPrinted: false,
      envValuesPrinted: false,
      safeMessage: 'Mocked redaction check passed; no raw value is present.',
    },
  });

export const buildMockedOwnerLocalManualRunResult = (): SimilarityOwnerLocalManualRunResult =>
  buildOwnerLocalManualRunResult(
    buildMockedOwnerLocalManualRunApprovedPolicy(),
    buildMockedOwnerLocalManualRunExecutedRedactedReport(),
  );
