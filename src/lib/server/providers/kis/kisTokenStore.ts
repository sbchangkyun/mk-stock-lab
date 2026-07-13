/**
 * Phase 3GG-T-HF2: durable L2 KIS token store (Supabase Postgres, service-role, `internal` schema).
 *
 * Defines the `KisTokenDb` port (so the manager is fully unit-testable with an in-memory mock) and the
 * real Supabase-backed adapter. All atomic writes go through the fenced security-definer RPCs from the
 * migration; state reads are a plain service-role select. Never returns or logs plaintext tokens.
 */

import { getSupabaseAdminClient } from '../../supabaseAdmin';
import type { KisTokenEnvelope, KisTokenStateRecord, LeaseResult } from './kisTokenTypes';

export interface StoreGenerationArgs {
  scopeKey: string;
  leaseOwner: string;
  leaseVersion: number;
  generationId: string;
  envelope: KisTokenEnvelope;
  issuedAtMs: number;
  expiresAtMs: number;
  usableUntilMs: number;
}

export interface KisTokenEventRow {
  scopeKey: string;
  eventType: string;
  generationId?: string | null;
  routeCategory?: string | null;
  deploymentId?: string | null;
  instanceId?: string | null;
  lockWaitMs?: number | null;
  safeErrorCode?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** DB port. Read/RPC methods throw on infrastructure failure (caller decides fail-closed vs reuse). */
export interface KisTokenDb {
  readState(scopeKey: string): Promise<KisTokenStateRecord | null>;
  acquireLease(scopeKey: string, leaseOwner: string, ttlSeconds: number): Promise<LeaseResult>;
  releaseLease(scopeKey: string, leaseOwner: string, leaseVersion: number): Promise<boolean>;
  storeGeneration(args: StoreGenerationArgs): Promise<boolean>;
  invalidateGeneration(scopeKey: string, generationId: string): Promise<boolean>;
  recordEvent(row: KisTokenEventRow): Promise<void>;
}

const toMs = (value: unknown): number | null => {
  if (typeof value !== 'string' || value.length === 0) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
};

const rowToState = (row: Record<string, unknown>): KisTokenStateRecord => {
  const ciphertext = typeof row.token_ciphertext === 'string' ? row.token_ciphertext : null;
  const iv = typeof row.token_iv === 'string' ? row.token_iv : null;
  const authTag = typeof row.token_auth_tag === 'string' ? row.token_auth_tag : null;
  const keyVersion = typeof row.encryption_key_version === 'number' ? row.encryption_key_version : 1;
  const envelope: KisTokenEnvelope | null =
    ciphertext && iv && authTag ? { ciphertext, iv, authTag, keyVersion } : null;
  return {
    scopeKey: String(row.scope_key),
    status: typeof row.status === 'string' ? row.status : 'empty',
    envelope,
    generationId: typeof row.generation_id === 'string' ? row.generation_id : null,
    issuedAtMs: toMs(row.issued_at),
    expiresAtMs: toMs(row.expires_at),
    usableUntilMs: toMs(row.usable_until),
    lastIssueSuccessAtMs: toMs(row.last_issue_success_at),
    invalidatedGenerationId: typeof row.invalidated_generation_id === 'string' ? row.invalidated_generation_id : null,
    leaseOwner: typeof row.lease_owner === 'string' ? row.lease_owner : null,
    leaseVersion: typeof row.lease_version === 'number' ? row.lease_version : 0,
    leaseExpiresAtMs: toMs(row.lease_expires_at),
  };
};

/** Real Supabase adapter. Uses the service-role admin client + the `internal` schema. */
export const createSupabaseKisTokenDb = (): KisTokenDb => {
  const db = () => getSupabaseAdminClient().schema('internal');

  return {
    async readState(scopeKey) {
      const { data, error } = await db()
        .from('kis_token_state')
        .select('*')
        .eq('scope_key', scopeKey)
        .maybeSingle();
      if (error) throw new Error(`KIS_TOKEN_STORE_READ_FAILED:${error.code ?? 'unknown'}`);
      return data ? rowToState(data as Record<string, unknown>) : null;
    },

    async acquireLease(scopeKey, leaseOwner, ttlSeconds) {
      const { data, error } = await db().rpc('acquire_kis_token_lease', {
        p_scope_key: scopeKey,
        p_lease_owner: leaseOwner,
        p_lease_ttl_seconds: ttlSeconds,
      });
      if (error) throw new Error(`KIS_TOKEN_LEASE_ACQUIRE_FAILED:${error.code ?? 'unknown'}`);
      const row = Array.isArray(data) ? data[0] : data;
      return {
        acquired: Boolean(row?.acquired),
        leaseVersion: typeof row?.lease_version === 'number' ? row.lease_version : 0,
        leaseExpiresAtMs: toMs(row?.lease_expires_at),
      };
    },

    async releaseLease(scopeKey, leaseOwner, leaseVersion) {
      const { data, error } = await db().rpc('release_kis_token_lease', {
        p_scope_key: scopeKey,
        p_lease_owner: leaseOwner,
        p_lease_version: leaseVersion,
      });
      if (error) throw new Error(`KIS_TOKEN_LEASE_RELEASE_FAILED:${error.code ?? 'unknown'}`);
      return Boolean(data);
    },

    async storeGeneration(args) {
      const { data, error } = await db().rpc('store_kis_token_generation', {
        p_scope_key: args.scopeKey,
        p_lease_owner: args.leaseOwner,
        p_lease_version: args.leaseVersion,
        p_generation_id: args.generationId,
        p_ciphertext: args.envelope.ciphertext,
        p_iv: args.envelope.iv,
        p_auth_tag: args.envelope.authTag,
        p_key_version: args.envelope.keyVersion,
        p_issued_at: new Date(args.issuedAtMs).toISOString(),
        p_expires_at: new Date(args.expiresAtMs).toISOString(),
        p_usable_until: new Date(args.usableUntilMs).toISOString(),
      });
      if (error) throw new Error(`KIS_TOKEN_STORE_WRITE_FAILED:${error.code ?? 'unknown'}`);
      return Boolean(data);
    },

    async invalidateGeneration(scopeKey, generationId) {
      const { data, error } = await db().rpc('invalidate_kis_token_generation', {
        p_scope_key: scopeKey,
        p_generation_id: generationId,
      });
      if (error) throw new Error(`KIS_TOKEN_INVALIDATE_FAILED:${error.code ?? 'unknown'}`);
      return Boolean(data);
    },

    async recordEvent(row) {
      const { error } = await db().rpc('record_kis_token_event', {
        p_scope_key: row.scopeKey,
        p_event_type: row.eventType,
        p_generation_id: row.generationId ?? null,
        p_route_category: row.routeCategory ?? null,
        p_deployment_id: row.deploymentId ?? null,
        p_instance_id: row.instanceId ?? null,
        p_lock_wait_ms: row.lockWaitMs ?? null,
        p_safe_error_code: row.safeErrorCode ?? null,
        p_metadata: row.metadata ?? null,
      });
      if (error) throw new Error(`KIS_TOKEN_EVENT_WRITE_FAILED:${error.code ?? 'unknown'}`);
    },
  };
};
