/**
 * Phase 3GG-T-HF2: secret-safe KIS token lifecycle telemetry.
 *
 * Persistent high-value events are written to internal.kis_token_event via the DB port; sampled events
 * are dropped or platform-logged only. EVERY event is passed through a strict metadata allowlist so a
 * token, ciphertext, IV, auth tag, key, app key/secret, Authorization header, JWT, cookie, session,
 * email, UID, or raw provider payload can never be persisted. Telemetry failure NEVER breaks token
 * reuse — recordEvent swallows all errors.
 */

import type { KisTokenDb, KisTokenEventRow } from './kisTokenStore';
import type { KisTokenEvent, KisTokenEventType } from './kisTokenTypes';

const PERSISTENT_EVENTS: ReadonlySet<KisTokenEventType> = new Set([
  'TOKEN_ISSUE_ATTEMPTED',
  'TOKEN_ISSUED',
  'TOKEN_ISSUE_FAILED',
  'TOKEN_REFRESH_FORCED',
  'TOKEN_ISSUE_BLOCKED_BY_COOLDOWN',
  'TOKEN_LEASE_TIMEOUT',
  'TOKEN_STORE_UNAVAILABLE',
  'TOKEN_DECRYPT_FAILED',
  'TOKEN_INVALIDATED',
]);

// Only these non-secret metadata keys may be persisted. Anything else is dropped.
const METADATA_ALLOWLIST: ReadonlySet<string> = new Set([
  'expiresAtMs',
  'usableUntilMs',
  'leaseVersion',
  'source',
  'attempt',
  'cooldownRemainingMs',
  'reason',
]);

// Defensive: even an allowlisted value is dropped if it "looks" secret-ish.
const FORBIDDEN_KEY_PATTERN =
  /token|secret|key|authorization|bearer|jwt|cookie|session|email|uid|appkey|appsecret|password|ciphertext|iv|authtag|payload/i;

const sanitizeMetadata = (metadata: Record<string, unknown> | null | undefined): Record<string, unknown> | null => {
  if (!metadata || typeof metadata !== 'object') return null;
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(metadata)) {
    if (!METADATA_ALLOWLIST.has(k)) continue;
    if (FORBIDDEN_KEY_PATTERN.test(k)) continue;
    if (v === null || typeof v === 'number' || typeof v === 'boolean') {
      safe[k] = v;
    } else if (typeof v === 'string') {
      // Only short, plainly non-secret strings (a "source"/"reason" label) are allowed through.
      safe[k] = v.length <= 40 && !FORBIDDEN_KEY_PATTERN.test(v) ? v : '[redacted]';
    }
    // objects/arrays/functions are never persisted.
  }
  return Object.keys(safe).length > 0 ? safe : null;
};

export interface KisTokenTelemetry {
  record(event: KisTokenEvent): Promise<void>;
}

export interface TelemetryDeps {
  db: KisTokenDb;
  enabled: boolean;
  scopeKey: string;
  deploymentId: string | null;
  instanceId: string | null;
}

export const createKisTokenTelemetry = (deps: TelemetryDeps): KisTokenTelemetry => ({
  async record(event) {
    if (!deps.enabled) return;
    if (!PERSISTENT_EVENTS.has(event.eventType)) return; // sampled/low-value events: not persisted.
    const row: KisTokenEventRow = {
      scopeKey: deps.scopeKey,
      eventType: event.eventType,
      generationId: event.generationId ?? null,
      routeCategory: event.routeCategory ?? null,
      deploymentId: deps.deploymentId,
      instanceId: deps.instanceId,
      lockWaitMs: typeof event.lockWaitMs === 'number' ? event.lockWaitMs : null,
      safeErrorCode: event.safeErrorCode ?? null,
      metadata: sanitizeMetadata(event.metadata),
    };
    try {
      await deps.db.recordEvent(row);
    } catch {
      // Telemetry must never break token reuse or issuance.
    }
  },
});

// Exported for the secret-scan checker/tests.
export const __telemetryInternals = { sanitizeMetadata, METADATA_ALLOWLIST, PERSISTENT_EVENTS };
