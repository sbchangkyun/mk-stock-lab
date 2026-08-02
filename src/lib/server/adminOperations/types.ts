/**
 * Phase 3GM: closed, sanitized contract types for the read-only admin operations overview.
 *
 * Every field here is intentionally non-secret and non-PII. Nothing in this module (or any module
 * that consumes it) may add a field carrying a token, API key, Authorization header, service-role
 * key, raw provider payload/error body, a complete user id, an email address, or portfolio content.
 */

export type OperationsHealthStatus = 'healthy' | 'warning' | 'unavailable';

export type UsageGuardOverview = {
  status: OperationsHealthStatus;
  storeReady: boolean;
  usageDateKst: string | null;
  configuredDailyLimit: number;
  totalGuardedExecutionsToday: number;
  distinctUserCountToday: number;
  usersAtLimitCountToday: number;
  mostRecentGuardedExecutionAtIso: string | null;
  sanitizedErrorCode: string | null;
};

export type KisTokenOverview = {
  status: OperationsHealthStatus;
  kisConfigReady: boolean;
  durableStoreReady: boolean;
  durableMisconfigured: boolean;
  l1TokenPresent: boolean;
  l2TokenPresent: boolean;
  tokenExpiresAtIso: string | null;
  remainingLifetimeSeconds: number | null;
  staleOrExpired: boolean;
  lastIssueOrReuseAtIso: string | null;
  sanitizedErrorCode: string | null;
};

export type QuoteCacheSummary = {
  cacheId: string;
  scope: string;
  durability: 'instance-local';
  entryCount: number;
  configuredTtlMs: number | null;
  newestEntryAgeMs: number | null;
  oldestEntryAgeMs: number | null;
  freshCount: number | null;
  staleCount: number | null;
  expiredCount: number | null;
  lastSuccessfulUpdateAtIso: string | null;
  status: OperationsHealthStatus;
};

export type AdminOperationsOverview = {
  generatedAtIso: string;
  usageGuard: UsageGuardOverview;
  kisToken: KisTokenOverview;
  quoteCaches: QuoteCacheSummary[];
};
