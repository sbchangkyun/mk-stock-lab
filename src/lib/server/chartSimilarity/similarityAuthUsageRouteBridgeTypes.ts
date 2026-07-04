/**
 * Server-only auth/usage runtime bridge type foundation for Chart Similarity execution
 * (Phase 3FB-C-ALT).
 *
 * These types describe an owner-local bridge that evaluates the existing
 * `evaluateSimilarityExecutionGuard` (Phase 3EY-C) before allowing the Phase 3FB-A mocked,
 * provider-compatible similarity integration to run. Auth and usage state are caller-supplied
 * mock values only: no real session, no session/access/refresh token, no IP address, no
 * credential value, no env value, no account/trading field. This file defines shapes only — it
 * performs no I/O and touches no database.
 *
 * This module must never be imported from client-accessible page code in this phase.
 */

import type { SimilarityProviderIntegrationResult } from './similarityProviderIntegrationTypes';
import type { SimilarityExecutionGuardStatus } from './similarityExecutionGuardTypes';

export type SimilarityAuthUsageBridgeMode = 'owner-local-auth-usage-bridge';

export type SimilarityAuthUsageBridgeSource = 'mocked-provider-compatible';

export type SimilarityAuthUsageBridgeAuthState = 'anonymous' | 'authenticated';

export type SimilarityAuthUsageBridgeRole = 'anonymous' | 'authenticated' | 'beta' | 'owner' | 'admin';

export type SimilarityAuthUsageBridgeUsageWindow = 'daily' | 'monthly';

export type SimilarityAuthUsageBridgeUsageRemainingBucket = 'none' | 'low' | 'available' | 'unknown';

export type SimilarityAuthUsageBridgeMockAuth = {
  state: SimilarityAuthUsageBridgeAuthState;
  role: SimilarityAuthUsageBridgeRole;
};

export type SimilarityAuthUsageBridgeMockUsage = {
  window: SimilarityAuthUsageBridgeUsageWindow;
  used: number;
  limit: number;
  remaining: number;
};

export type SimilarityAuthUsageBridgeRequestBody = {
  mode: SimilarityAuthUsageBridgeMode;
  source: SimilarityAuthUsageBridgeSource;
  ownerLocalAuthUsageBridge: true;
  symbol?: string;
  assetType?: 'stock' | 'etf';
  mockAuth: SimilarityAuthUsageBridgeMockAuth;
  mockUsage: SimilarityAuthUsageBridgeMockUsage;
};

export type SimilarityAuthUsageBridgeNormalizedRequest = {
  symbol: string;
  assetType: 'stock' | 'etf';
  mockAuth: SimilarityAuthUsageBridgeMockAuth;
  mockUsage: SimilarityAuthUsageBridgeMockUsage;
};

export type SimilarityAuthUsageBridgePolicy = {
  ownerLocalOnly: true;
  allowLiveKis: false;
  allowPublicExecution: false;
  allowBetaExecutionByDefault: false;
  allowRouteSuccessOnlyAfterGuardAllowed: true;
  allowRealAuthProvider: false;
  allowUsagePersistence: false;
  allowRawProviderPayload: false;
  allowCredentialEcho: false;
  allowEnvEcho: false;
  allowAccountTradingFields: false;
  notes: string[];
};

export type SimilarityAuthUsageBridgeResult = {
  ok: boolean;
  guardStatus: SimilarityExecutionGuardStatus;
  authState: SimilarityAuthUsageBridgeAuthState;
  role: SimilarityAuthUsageBridgeRole;
  usageWindow: SimilarityAuthUsageBridgeUsageWindow;
  usageRemainingBucket: SimilarityAuthUsageBridgeUsageRemainingBucket;
  safeMessage: string;
  errorCode?: string;
  policy: SimilarityAuthUsageBridgePolicy;
  integrationResult: SimilarityProviderIntegrationResult | null;
  normalizedRequest: SimilarityAuthUsageBridgeNormalizedRequest | null;
};
