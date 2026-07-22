/**
 * Provider-compatible OHLC to similarity engine integration type foundation (Phase 3FB-A).
 *
 * These types describe a server-only integration layer that feeds already-normalized,
 * provider-compatible `OhlcBar[]` data (mocked in this phase; real KIS-normalized bars in a
 * later, separately authorized phase) into the existing deterministic similarity engine
 * (`scanSimilarity`). This module defines shapes only — no I/O, no `process.env` read, no KIS
 * client import, no route wiring.
 */

import type { SimilarityAnalysisResult } from '../../chartSimilarity/types';

export type SimilarityProviderIntegrationStatus =
  | 'ready'
  | 'blocked'
  | 'disabled'
  | 'provider_error'
  | 'engine_error';

export type SimilarityProviderIntegrationSource = 'mocked-provider-compatible' | 'kis-normalized-future';

export type SimilarityProviderIntegrationMode = 'feature-flag-off' | 'owner-local-mocked';

export type SimilarityProviderIntegrationPolicy = {
  enabled: boolean;
  ownerLocalOnly: true;
  allowLiveKis: false;
  allowMockedProviderCompatibleInput: true;
  allowRouteSuccess: false;
  allowPublicExecution: false;
  allowBetaExecution: false;
  allowRawProviderPayload: false;
  allowCredentialEcho: false;
  allowEnvEcho: false;
  allowActualMarketValuesInReport: false;
  notes: string[];
};

export type SimilarityProviderIntegrationRequest = {
  symbol: string;
  market: 'KR';
  timeframe: 'daily';
  baseWindow: number;
  forwardWindows: number[];
  topK: number;
  source: SimilarityProviderIntegrationSource;
};

export type SimilarityProviderIntegrationBarCountBucket =
  | 'none'
  | 'one_to_twenty'
  | 'twenty_one_to_one_hundred'
  | 'over_one_hundred'
  | 'unknown';

export type SimilarityProviderIntegrationMatchCountBucket =
  | 'none'
  | 'one_to_five'
  | 'six_to_twenty'
  | 'over_twenty'
  | 'unknown';

export type SimilarityProviderIntegrationProviderStatus = 'ready' | 'blocked' | 'disabled' | 'error';

export type SimilarityProviderIntegrationEngineStatus = 'not_run' | 'ready' | 'error';

export type SimilarityProviderIntegrationSafeSummary = {
  market: string;
  symbol: string;
  baseWindow: number;
  normalizedBarCountBucket: SimilarityProviderIntegrationBarCountBucket;
  matchCountBucket: SimilarityProviderIntegrationMatchCountBucket;
  warningsPresent: boolean;
  warningsCount: number;
};

export type SimilarityProviderIntegrationResult = {
  status: SimilarityProviderIntegrationStatus;
  mode: SimilarityProviderIntegrationMode;
  source: SimilarityProviderIntegrationSource;
  providerStatus: SimilarityProviderIntegrationProviderStatus;
  engineStatus: SimilarityProviderIntegrationEngineStatus;
  normalizedBarsAvailable: boolean;
  normalizedBarCountBucket: SimilarityProviderIntegrationBarCountBucket;
  matchCountBucket: SimilarityProviderIntegrationMatchCountBucket;
  warnings: string[];
  safeMessage: string;
  dataPolicy: SimilarityProviderIntegrationPolicy;
  safeSummary: SimilarityProviderIntegrationSafeSummary;
  /** Present only for the mocked, non-live source — never populated from real KIS data. */
  result?: SimilarityAnalysisResult;
};
