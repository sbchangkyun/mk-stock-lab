/**
 * Server-only auth/usage guard type foundation for Chart Similarity execution (Phase 3EY-C).
 *
 * These types describe a future execution guard that will sit in front of any authenticated
 * Chart Similarity API route. They are decoupled from real auth/session data: no session token,
 * no access token, no provider token, no raw auth provider payload, no IP address, no
 * account/trading fields, no KIS credentials. This file defines shapes only — it performs no
 * I/O, calls no auth provider, and touches no database.
 *
 * This module must never be imported from client-accessible page or API code in this phase.
 */

export type SimilarityExecutionRole = 'anonymous' | 'authenticated' | 'beta' | 'owner' | 'admin';

export type SimilarityExecutionAuthState = 'missing' | 'anonymous' | 'authenticated' | 'owner' | 'admin';

export type SimilarityExecutionUsageWindow = 'daily' | 'monthly';

export type SimilarityExecutionGuardStatus =
  | 'allowed'
  | 'blocked'
  | 'auth_required'
  | 'usage_limited'
  | 'feature_disabled'
  | 'not_configured'
  | 'error';

export type SimilarityExecutionPurpose = 'chart-similarity';

export type SimilarityExecutionSource = 'mocked' | 'kis-normalized' | 'owner-local';

export type SimilarityExecutionGuardRequest = {
  purpose: SimilarityExecutionPurpose;
  source: SimilarityExecutionSource;
  role: SimilarityExecutionRole;
  authState: SimilarityExecutionAuthState;
  userId?: string;
  symbol: string;
  market: 'KR';
  assetType: 'stock' | 'etf';
  requestedAtIso?: string;
};

export type SimilarityExecutionUsageSnapshot = {
  window: SimilarityExecutionUsageWindow;
  used: number;
  limit: number;
  remaining: number;
  resetAtIso?: string;
};

export type SimilarityExecutionGuardPolicy = {
  enabled: boolean;
  requireAuth: boolean;
  requireUsageGuard: boolean;
  allowAnonymousMockedPreview: boolean;
  allowPublicKisExecution: false;
  allowOwnerLocalBypass: boolean;
  defaultDailyLimit: number;
  betaDailyLimit: number;
  ownerDailyLimit: number;
  adminDailyLimit: number;
  featureFlagName: string;
  notes: string[];
};

export type SimilarityExecutionGuardResult = {
  ok: boolean;
  status: SimilarityExecutionGuardStatus;
  request: SimilarityExecutionGuardRequest;
  usage: SimilarityExecutionUsageSnapshot | null;
  safeMessage: string;
  warnings: string[];
  errorCode?: string;
};
