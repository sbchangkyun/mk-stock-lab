/**
 * Phase 3GG-T-HF2: authoritative durable KIS token manager.
 *
 * One lifecycle path: L1 (process memory) → L2 (Supabase durable store) → distributed lease (with
 * fencing + double-check) → a SINGLE /oauth2/tokenP issuance only when strictly required. Fully
 * dependency-injected so multi-instance / cold-start / redeploy / crash / store-failure scenarios are
 * unit-testable without ever calling the real KIS token endpoint.
 *
 * Secrecy: the plaintext token exists only inside a KisTokenHandle in memory and in the AES-256-GCM
 * envelope at rest. It is never logged, never put in telemetry, never returned to a client.
 */

import { encryptKisToken, decryptKisToken } from './kisTokenCrypto';
import { computeLeasePollDelayMs } from './kisTokenLease';
import type { KisTokenDb } from './kisTokenStore';
import type { KisTokenTelemetry } from './kisTokenTelemetry';
import type { KisDurableTokenConfig } from './kisTokenConfig';
import type {
  KisRequestContext,
  KisTokenAcquireResult,
  KisTokenHandle,
  KisTokenStateRecord,
  TokenIssuerResult,
} from './kisTokenTypes';

const MAX_TOKEN_LIFETIME_MS = 25 * 60 * 60 * 1000; // sanity cap (KIS ~24h)

/** Timezone-safe absolute-expiry parse for the KIS KST string "YYYY-MM-DD HH:MM:SS" (interpreted +09:00). */
export const parseKisAbsoluteExpiryKst = (raw: string | null | undefined): number | null => {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(trimmed);
  if (!m) {
    // If it already carries an explicit timezone, Date.parse is safe; otherwise reject.
    if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
      const ms = Date.parse(trimmed);
      return Number.isFinite(ms) ? ms : null;
    }
    return null;
  }
  // Build the instant explicitly at +09:00 (KST) — never feed a tz-less KST string to Date.parse.
  const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+09:00`;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
};

/**
 * Compute expiry (section 13). Prefer expires_in; use an absolute value ONLY when timezone-safe; never
 * issue merely because an optional absolute field is malformed when expires_in is valid.
 */
export const computeTokenExpiry = (
  issued: { issuedAtMs: number; expiresInSeconds: number; absoluteExpiryKst?: string | null },
  safetyWindowMs: number,
): { expiresAtMs: number; usableUntilMs: number } | null => {
  let expiresAtMs: number | null = null;
  if (Number.isFinite(issued.expiresInSeconds) && issued.expiresInSeconds > 0) {
    expiresAtMs = issued.issuedAtMs + Math.floor(issued.expiresInSeconds) * 1000;
  } else {
    const abs = parseKisAbsoluteExpiryKst(issued.absoluteExpiryKst);
    if (abs !== null) expiresAtMs = abs;
  }
  if (expiresAtMs === null) return null;
  const lifetime = expiresAtMs - issued.issuedAtMs;
  if (lifetime <= 0 || lifetime > MAX_TOKEN_LIFETIME_MS) return null;
  const usableUntilMs = expiresAtMs - safetyWindowMs;
  if (!(usableUntilMs < expiresAtMs) || usableUntilMs <= issued.issuedAtMs) {
    // Safety window larger than lifetime → treat token as usable for a minimal slice rather than never.
    return { expiresAtMs, usableUntilMs: Math.max(issued.issuedAtMs + 1, expiresAtMs - 1) };
  }
  return { expiresAtMs, usableUntilMs };
};

export interface KisTokenManagerDeps {
  config: KisDurableTokenConfig;
  encryptionKey: Buffer | null;
  db: KisTokenDb;
  telemetry: KisTokenTelemetry;
  issueToken: () => Promise<TokenIssuerResult>;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
  newGenerationId: () => string;
  leaseOwnerId: string;
  instanceId: string | null;
  deploymentId: string | null;
  random?: () => number;
}

export interface KisTokenManager {
  getTokenHandle(context: KisRequestContext): Promise<KisTokenAcquireResult>;
  /** For the executor's (disabled-by-default) emergency refresh: invalidate a specific generation. */
  invalidateGeneration(generationId: string): Promise<void>;
  /** Test/inspection only — never exposed to clients. */
  peekL1(): KisTokenHandle | null;
}

export const createKisTokenManager = (deps: KisTokenManagerDeps): KisTokenManager => {
  const { config } = deps;
  const scopeKey = config.scopeKey;
  let l1: KisTokenHandle | null = null;
  let inFlight: Promise<KisTokenAcquireResult> | null = null;

  const isHandleUsable = (h: KisTokenHandle): boolean => deps.now() < h.usableUntilMs;

  const stateHasUsableToken = (s: KisTokenStateRecord): boolean =>
    s.envelope !== null &&
    s.status !== 'invalidated' &&
    s.generationId !== null &&
    s.invalidatedGenerationId !== s.generationId &&
    s.usableUntilMs !== null &&
    deps.now() < s.usableUntilMs;

  const stateHasRefreshWindowToken = (s: KisTokenStateRecord): boolean =>
    s.envelope !== null &&
    s.status !== 'invalidated' &&
    s.generationId !== null &&
    s.invalidatedGenerationId !== s.generationId &&
    s.usableUntilMs !== null &&
    s.expiresAtMs !== null &&
    deps.now() >= s.usableUntilMs &&
    deps.now() < s.expiresAtMs;

  const decryptStateToHandle = (s: KisTokenStateRecord, source: 'l2'): KisTokenAcquireResult => {
    if (!deps.encryptionKey || !s.envelope || !s.generationId || s.expiresAtMs === null || s.usableUntilMs === null || s.issuedAtMs === null) {
      return { ok: false, code: 'KIS_TOKEN_DECRYPT_FAILED' };
    }
    try {
      const accessToken = decryptKisToken(s.envelope, { scopeKey, generationId: s.generationId, key: deps.encryptionKey });
      const handle: KisTokenHandle = {
        accessToken,
        generationId: s.generationId,
        issuedAtMs: s.issuedAtMs,
        expiresAtMs: s.expiresAtMs,
        usableUntilMs: s.usableUntilMs,
        source,
      };
      l1 = handle;
      return { ok: true, handle };
    } catch {
      void deps.telemetry.record({ scopeKey, eventType: 'TOKEN_DECRYPT_FAILED', generationId: s.generationId });
      return { ok: false, code: 'KIS_TOKEN_DECRYPT_FAILED' };
    }
  };

  const safeRelease = async (leaseVersion: number): Promise<void> => {
    try {
      await deps.db.releaseLease(scopeKey, deps.leaseOwnerId, leaseVersion);
    } catch {
      /* best-effort; lease TTL guarantees eventual release */
    }
  };

  const issueUnderLease = async (
    context: KisRequestContext,
    leaseVersion: number,
  ): Promise<KisTokenAcquireResult> => {
    // 14.5 double-check after acquiring the lease.
    let fresh: KisTokenStateRecord | null = null;
    try {
      fresh = await deps.db.readState(scopeKey);
    } catch {
      fresh = null;
    }
    if (fresh && stateHasUsableToken(fresh)) {
      await safeRelease(leaseVersion);
      return decryptStateToHandle(fresh, 'l2');
    }
    // 16 issue cooldown (only blocks when there is no usable token, which is the case here).
    if (fresh?.lastIssueSuccessAtMs && deps.now() - fresh.lastIssueSuccessAtMs < config.issueCooldownMs) {
      const cooldownRemainingMs = config.issueCooldownMs - (deps.now() - fresh.lastIssueSuccessAtMs);
      void deps.telemetry.record({
        scopeKey, eventType: 'TOKEN_ISSUE_BLOCKED_BY_COOLDOWN', routeCategory: context.routeCategory,
        metadata: { cooldownRemainingMs },
      });
      await safeRelease(leaseVersion);
      return { ok: false, code: 'KIS_TOKEN_ISSUE_COOLDOWN' };
    }

    void deps.telemetry.record({ scopeKey, eventType: 'TOKEN_ISSUE_ATTEMPTED', routeCategory: context.routeCategory });
    let issued: TokenIssuerResult;
    try {
      issued = await deps.issueToken();
    } catch {
      issued = { ok: false, code: 'KIS_TOKEN_ISSUE_FAILED' };
    }
    if (!issued.ok) {
      void deps.telemetry.record({ scopeKey, eventType: 'TOKEN_ISSUE_FAILED', routeCategory: context.routeCategory, safeErrorCode: issued.code });
      await safeRelease(leaseVersion); // no automatic re-issue retry
      return { ok: false, code: issued.code || 'KIS_TOKEN_ISSUE_FAILED' };
    }

    const expiry = computeTokenExpiry(issued, config.safetyWindowMs);
    if (!expiry || !deps.encryptionKey) {
      void deps.telemetry.record({ scopeKey, eventType: 'TOKEN_ISSUE_FAILED', routeCategory: context.routeCategory, safeErrorCode: 'KIS_TOKEN_EXPIRY_INVALID' });
      await safeRelease(leaseVersion);
      return { ok: false, code: 'KIS_TOKEN_EXPIRY_INVALID' };
    }

    const generationId = deps.newGenerationId();
    const envelope = encryptKisToken(issued.accessToken, {
      scopeKey, generationId, keyVersion: config.encryptionKeyVersion, key: deps.encryptionKey,
    });

    let stored = false;
    try {
      stored = await deps.db.storeGeneration({
        scopeKey, leaseOwner: deps.leaseOwnerId, leaseVersion, generationId, envelope,
        issuedAtMs: issued.issuedAtMs, expiresAtMs: expiry.expiresAtMs, usableUntilMs: expiry.usableUntilMs,
      });
    } catch {
      // 19.4 token issued but durable write failed → NOT a durable success. Do not expose the token.
      void deps.telemetry.record({ scopeKey, eventType: 'TOKEN_ISSUE_FAILED', routeCategory: context.routeCategory, safeErrorCode: 'KIS_TOKEN_STORE_WRITE_FAILED' });
      await safeRelease(leaseVersion);
      return { ok: false, code: 'KIS_TOKEN_STORE_WRITE_FAILED' };
    }
    if (!stored) {
      // Fencing rejected a stale lease holder.
      void deps.telemetry.record({ scopeKey, eventType: 'TOKEN_ISSUE_FAILED', routeCategory: context.routeCategory, safeErrorCode: 'KIS_TOKEN_FENCING_REJECTED' });
      await safeRelease(leaseVersion);
      return { ok: false, code: 'KIS_TOKEN_STORE_WRITE_FAILED' };
    }

    const handle: KisTokenHandle = {
      accessToken: issued.accessToken, generationId, issuedAtMs: issued.issuedAtMs,
      expiresAtMs: expiry.expiresAtMs, usableUntilMs: expiry.usableUntilMs, source: 'issued',
    };
    l1 = handle;
    void deps.telemetry.record({
      scopeKey, eventType: 'TOKEN_ISSUED', generationId, routeCategory: context.routeCategory,
      metadata: { expiresAtMs: expiry.expiresAtMs, usableUntilMs: expiry.usableUntilMs, source: 'issued', leaseVersion },
    });
    return { ok: true, handle };
  };

  type PollOutcome =
    | { kind: 'token'; result: KisTokenAcquireResult }
    | { kind: 'lease_free' }
    | { kind: 'deadline' };

  // Poll L2 for a newly-stored generation while another instance holds the lease. Returns as soon as a
  // usable token appears, OR the lease becomes free (so the caller may reacquire ONCE), OR the deadline
  // passes. Bounded, jittered delay (200ms→800ms).
  const pollUntilTokenOrLeaseFree = async (deadlineMs: number): Promise<PollOutcome> => {
    let attempt = 0;
    while (deps.now() < deadlineMs) {
      const delay = computeLeasePollDelayMs(attempt, { random: deps.random });
      await deps.sleep(Math.min(delay, Math.max(1, deadlineMs - deps.now())));
      attempt += 1;
      let s: KisTokenStateRecord | null = null;
      try {
        s = await deps.db.readState(scopeKey);
      } catch {
        s = null;
      }
      if (s && stateHasUsableToken(s)) return { kind: 'token', result: decryptStateToHandle(s, 'l2') };
      if (s && (s.leaseOwner === null || s.leaseExpiresAtMs === null || s.leaseExpiresAtMs < deps.now())) {
        return { kind: 'lease_free' };
      }
    }
    return { kind: 'deadline' };
  };

  const issueViaLease = async (
    context: KisRequestContext,
    fallbackUsableState: KisTokenStateRecord | null,
  ): Promise<KisTokenAcquireResult> => {
    const startMs = deps.now();
    const deadlineMs = startMs + config.waitTimeoutMs;
    // Initial acquire + AT MOST one reacquisition after an expired lease.
    for (let round = 0; round < 2; round += 1) {
      let lease;
      try {
        lease = await deps.db.acquireLease(scopeKey, deps.leaseOwnerId, config.leaseTtlSeconds);
      } catch {
        if (fallbackUsableState && stateHasRefreshWindowToken(fallbackUsableState)) {
          return decryptStateToHandle(fallbackUsableState, 'l2');
        }
        void deps.telemetry.record({ scopeKey, eventType: 'TOKEN_STORE_UNAVAILABLE', routeCategory: context.routeCategory, safeErrorCode: 'KIS_TOKEN_LEASE_UNAVAILABLE' });
        return { ok: false, code: 'KIS_TOKEN_LEASE_UNAVAILABLE' };
      }
      if (lease.acquired) {
        void deps.telemetry.record({ scopeKey, eventType: 'TOKEN_LEASE_ACQUIRED', routeCategory: context.routeCategory, metadata: { leaseVersion: lease.leaseVersion } });
        return issueUnderLease(context, lease.leaseVersion);
      }
      void deps.telemetry.record({ scopeKey, eventType: 'TOKEN_LEASE_WAIT', routeCategory: context.routeCategory });
      const polled = await pollUntilTokenOrLeaseFree(deadlineMs);
      if (polled.kind === 'token') return polled.result;
      if (polled.kind === 'deadline') break;
      // polled.kind === 'lease_free' → loop once more to reacquire (round 1).
    }
    void deps.telemetry.record({ scopeKey, eventType: 'TOKEN_LEASE_TIMEOUT', routeCategory: context.routeCategory, lockWaitMs: deps.now() - startMs });
    if (fallbackUsableState && stateHasRefreshWindowToken(fallbackUsableState)) {
      return decryptStateToHandle(fallbackUsableState, 'l2');
    }
    return { ok: false, code: 'KIS_TOKEN_LEASE_TIMEOUT' };
  };

  const legacyIssue = async (context: KisRequestContext): Promise<KisTokenAcquireResult> => {
    // Durable mode OFF: preserve pre-HF2 L1-only behavior (process single-flight via `inFlight`).
    void deps.telemetry.record({ scopeKey, eventType: 'TOKEN_ISSUE_ATTEMPTED', routeCategory: context.routeCategory });
    let issued: TokenIssuerResult;
    try {
      issued = await deps.issueToken();
    } catch {
      issued = { ok: false, code: 'KIS_TOKEN_ISSUE_FAILED' };
    }
    if (!issued.ok) {
      void deps.telemetry.record({ scopeKey, eventType: 'TOKEN_ISSUE_FAILED', routeCategory: context.routeCategory, safeErrorCode: issued.code });
      return { ok: false, code: issued.code || 'KIS_TOKEN_ISSUE_FAILED' };
    }
    const expiry = computeTokenExpiry(issued, config.safetyWindowMs) ?? {
      expiresAtMs: issued.issuedAtMs + 23 * 60 * 60 * 1000,
      usableUntilMs: issued.issuedAtMs + 23 * 60 * 60 * 1000 - config.safetyWindowMs,
    };
    const handle: KisTokenHandle = {
      accessToken: issued.accessToken, generationId: deps.newGenerationId(), issuedAtMs: issued.issuedAtMs,
      expiresAtMs: expiry.expiresAtMs, usableUntilMs: expiry.usableUntilMs, source: 'issued',
    };
    l1 = handle;
    return { ok: true, handle };
  };

  const acquire = async (context: KisRequestContext): Promise<KisTokenAcquireResult> => {
    if (!config.durableReady) {
      if (config.durableMisconfigured) {
        // Durable requested but no valid key: fail closed, never issue.
        void deps.telemetry.record({ scopeKey, eventType: 'TOKEN_STORE_UNAVAILABLE', routeCategory: context.routeCategory, safeErrorCode: 'KIS_TOKEN_DURABLE_MISCONFIGURED' });
        return { ok: false, code: 'KIS_TOKEN_DURABLE_MISCONFIGURED' };
      }
      return legacyIssue(context);
    }

    // 14.2 read L2
    let state: KisTokenStateRecord | null;
    try {
      state = await deps.db.readState(scopeKey);
    } catch {
      void deps.telemetry.record({ scopeKey, eventType: 'TOKEN_STORE_UNAVAILABLE', routeCategory: context.routeCategory });
      return { ok: false, code: 'KIS_TOKEN_STORE_UNAVAILABLE' };
    }
    if (state && stateHasUsableToken(state)) {
      const res = decryptStateToHandle(state, 'l2');
      if (res.ok) {
        void deps.telemetry.record({ scopeKey, eventType: 'TOKEN_REUSED_L2', generationId: res.handle.generationId, routeCategory: context.routeCategory });
      }
      return res;
    }
    const refreshFallback = state && stateHasRefreshWindowToken(state) ? state : null;
    return issueViaLease(context, refreshFallback);
  };

  return {
    async getTokenHandle(context) {
      // 14.1 L1 valid → immediate reuse, no L2 read.
      if (l1 && isHandleUsable(l1)) {
        void deps.telemetry.record({ scopeKey, eventType: 'TOKEN_REUSED_L1', generationId: l1.generationId, routeCategory: context.routeCategory });
        return { ok: true, handle: { ...l1, source: 'l1' } };
      }
      // Process single-flight: concurrent in-instance callers share one acquisition.
      if (inFlight) return inFlight;
      inFlight = acquire(context).finally(() => {
        inFlight = null;
      });
      return inFlight;
    },
    async invalidateGeneration(generationId) {
      if (l1 && l1.generationId === generationId) l1 = null;
      if (!config.durableReady) return;
      try {
        const ok = await deps.db.invalidateGeneration(scopeKey, generationId);
        if (ok) void deps.telemetry.record({ scopeKey, eventType: 'TOKEN_INVALIDATED', generationId });
      } catch {
        /* fail-safe: nothing to do */
      }
    },
    peekL1() {
      return l1;
    },
  };
};
