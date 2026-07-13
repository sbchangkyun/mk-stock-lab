/**
 * Phase 3GG-T-HF2: shared types for the durable KIS access-token lifecycle.
 *
 * Server-only. KisTokenHandle carries the plaintext access token in memory only and MUST NEVER be
 * serialized into a client response, an error object, a log line, or telemetry metadata.
 */

export type KisTokenSource = 'l1' | 'l2' | 'issued';

export type KisRouteCategory =
  | 'domestic_ohlcv'
  | 'overseas_ohlcv'
  | 'domestic_quote'
  | 'overseas_quote'
  | 'similarity'
  | 'mk_analysis'
  | 'market_intelligence'
  | 'owner_local';

export interface KisRequestContext {
  routeCategory: KisRouteCategory;
}

export interface KisTokenHandle {
  accessToken: string;
  generationId: string;
  issuedAtMs: number;
  expiresAtMs: number;
  usableUntilMs: number;
  source: KisTokenSource;
}

/** AES-256-GCM envelope (all base64). Never contains plaintext. */
export interface KisTokenEnvelope {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: number;
}

/** Durable L2 row (decrypted lazily; envelope stays encrypted until needed). */
export interface KisTokenStateRecord {
  scopeKey: string;
  status: string;
  envelope: KisTokenEnvelope | null;
  generationId: string | null;
  issuedAtMs: number | null;
  expiresAtMs: number | null;
  usableUntilMs: number | null;
  lastIssueSuccessAtMs: number | null;
  invalidatedGenerationId: string | null;
  leaseOwner: string | null;
  leaseVersion: number;
  leaseExpiresAtMs: number | null;
}

export interface LeaseResult {
  acquired: boolean;
  leaseVersion: number;
  leaseExpiresAtMs: number | null;
}

/** Result of a single real /oauth2/tokenP issuance (the injected issuer). */
export type TokenIssuerResult =
  | { ok: true; accessToken: string; issuedAtMs: number; expiresInSeconds: number; absoluteExpiryKst?: string | null }
  | { ok: false; code: string };

/** Persistent + sampled lifecycle event names (secret-safe). */
export type KisTokenEventType =
  | 'TOKEN_ISSUE_ATTEMPTED'
  | 'TOKEN_ISSUED'
  | 'TOKEN_ISSUE_FAILED'
  | 'TOKEN_REFRESH_FORCED'
  | 'TOKEN_ISSUE_BLOCKED_BY_COOLDOWN'
  | 'TOKEN_LEASE_TIMEOUT'
  | 'TOKEN_STORE_UNAVAILABLE'
  | 'TOKEN_DECRYPT_FAILED'
  | 'TOKEN_INVALIDATED'
  | 'TOKEN_REUSED_L1'
  | 'TOKEN_REUSED_L2'
  | 'TOKEN_LEASE_WAIT'
  | 'TOKEN_LEASE_ACQUIRED';

export interface KisTokenEvent {
  scopeKey: string;
  eventType: KisTokenEventType;
  generationId?: string | null;
  routeCategory?: KisRouteCategory | null;
  lockWaitMs?: number | null;
  safeErrorCode?: string | null;
  /** Only allowlisted, non-secret keys are persisted (see kisTokenTelemetry). */
  metadata?: Record<string, unknown> | null;
}

/** Manager acquisition result (never exposes the handle to clients). */
export type KisTokenAcquireResult =
  | { ok: true; handle: KisTokenHandle }
  | { ok: false; code: string };
