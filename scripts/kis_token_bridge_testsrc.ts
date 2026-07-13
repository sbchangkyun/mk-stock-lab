/**
 * Phase 3GG-T-HF2-HF1 bridge test source (bundled + run by smoke_phase_3gg_t_hf2_hf1_bridge.mjs).
 *
 * Proves the durable-token store calls the PUBLIC PostgREST bridge RPCs (public.kis_token_*) and never
 * `.schema('internal')` or a direct table select. Uses a fake recording client that ONLY implements
 * `.rpc(...)` — so any `.schema()` / `.from()` access would throw and fail the test. No network, no
 * secrets (placeholder envelope values are obviously non-secret).
 */

import { createSupabaseKisTokenDb } from '../src/lib/server/providers/kis/kisTokenStore';
import type { KisTokenRpcClient } from '../src/lib/server/providers/kis/kisTokenStore';

let passed = 0;
let failed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

type Call = { name: string; params: Record<string, unknown> | undefined };

const makeRecordingClient = (): { client: KisTokenRpcClient; calls: Call[] } => {
  const calls: Call[] = [];
  const client = {
    rpc: async (fn: string, params?: Record<string, unknown>) => {
      calls.push({ name: fn, params });
      // Return per-RPC shapes the store expects.
      if (fn === 'kis_token_read_state') {
        return {
          data: [
            {
              scope_key: 'kis:market-data:test:v1',
              status: 'valid',
              token_ciphertext: 'PLACEHOLDER_CT',
              token_iv: 'PLACEHOLDER_IV',
              token_auth_tag: 'PLACEHOLDER_TAG',
              encryption_key_version: 1,
              generation_id: '00000000-0000-4000-8000-000000000000',
              issued_at: '2026-07-14T00:00:00.000Z',
              expires_at: '2026-07-15T00:00:00.000Z',
              usable_until: '2026-07-14T23:45:00.000Z',
              last_issue_success_at: '2026-07-14T00:00:00.000Z',
              invalidated_generation_id: null,
              lease_owner: null,
              lease_version: 3,
              lease_expires_at: null,
            },
          ],
          error: null,
        };
      }
      if (fn === 'kis_token_acquire_lease') {
        return { data: [{ acquired: true, lease_version: 4, lease_expires_at: '2026-07-14T00:00:20.000Z' }], error: null };
      }
      // release / store / invalidate return boolean; record returns null.
      if (fn === 'kis_token_record_event') return { data: null, error: null };
      return { data: true, error: null };
    },
    // Deliberately NO `schema` or `from` — if the store used `.schema('internal')` this object would
    // throw a TypeError, failing the test.
  } as KisTokenRpcClient;
  return { client, calls };
};

export const runAll = async (): Promise<number> => {
  const { client, calls } = makeRecordingClient();
  const db = createSupabaseKisTokenDb(() => client);

  const state = await db.readState('kis:market-data:test:v1');
  check('readState -> public.kis_token_read_state', calls[0]?.name === 'kis_token_read_state' && calls[0]?.params?.p_scope_key === 'kis:market-data:test:v1');
  check('readState maps the bridge row (envelope + lease metadata)', !!state && state.status === 'valid' && state.envelope !== null && state.leaseVersion === 3 && state.leaseOwner === null);

  const lease = await db.acquireLease('kis:market-data:test:v1', 'owner-1', 20);
  check('acquireLease -> public.kis_token_acquire_lease', calls[1]?.name === 'kis_token_acquire_lease' && calls[1]?.params?.p_lease_owner === 'owner-1' && calls[1]?.params?.p_lease_ttl_seconds === 20);
  check('acquireLease maps the fenced result', lease.acquired === true && lease.leaseVersion === 4);

  await db.releaseLease('kis:market-data:test:v1', 'owner-1', 4);
  check('releaseLease -> public.kis_token_release_lease', calls[2]?.name === 'kis_token_release_lease' && calls[2]?.params?.p_lease_version === 4);

  await db.storeGeneration({
    scopeKey: 'kis:market-data:test:v1', leaseOwner: 'owner-1', leaseVersion: 4,
    generationId: '11111111-1111-4111-8111-111111111111',
    envelope: { ciphertext: 'PLACEHOLDER_CT', iv: 'PLACEHOLDER_IV', authTag: 'PLACEHOLDER_TAG', keyVersion: 1 },
    issuedAtMs: Date.parse('2026-07-14T00:00:00.000Z'), expiresAtMs: Date.parse('2026-07-15T00:00:00.000Z'), usableUntilMs: Date.parse('2026-07-14T23:45:00.000Z'),
  });
  check('storeGeneration -> public.kis_token_store_generation (envelope only, no plaintext param)',
    calls[3]?.name === 'kis_token_store_generation' && calls[3]?.params?.p_ciphertext === 'PLACEHOLDER_CT' && !('p_plaintext' in (calls[3]?.params ?? {})) && !('p_access_token' in (calls[3]?.params ?? {})));

  await db.invalidateGeneration('kis:market-data:test:v1', '11111111-1111-4111-8111-111111111111');
  check('invalidateGeneration -> public.kis_token_invalidate_generation', calls[4]?.name === 'kis_token_invalidate_generation' && calls[4]?.params?.p_generation_id === '11111111-1111-4111-8111-111111111111');

  await db.recordEvent({ scopeKey: 'kis:market-data:test:v1', eventType: 'TOKEN_ISSUED', generationId: '11111111-1111-4111-8111-111111111111', metadata: { expiresAtMs: 1 } });
  check('recordEvent -> public.kis_token_record_event', calls[5]?.name === 'kis_token_record_event' && calls[5]?.params?.p_event_type === 'TOKEN_ISSUED');

  // Global assertions.
  const names = calls.map((c) => c.name);
  const APPROVED = new Set([
    'kis_token_read_state', 'kis_token_acquire_lease', 'kis_token_release_lease',
    'kis_token_store_generation', 'kis_token_invalidate_generation', 'kis_token_record_event',
  ]);
  check('only the six approved public bridge RPC names are used', names.length === 6 && names.every((n) => APPROVED.has(n)));
  check('no legacy internal RPC name is used', !names.some((n) => /^(acquire|release|store|invalidate|record)_kis_token/.test(n)));
  check('no secret-like value passed to the bridge', !JSON.stringify(calls).match(/sk-[A-Za-z0-9]{20}|eyJ[A-Za-z0-9_-]{20}\./));

  console.log('');
  console.log(`BRIDGE-TESTS :: passed=${passed} failed=${failed} total=${passed + failed}`);
  return failed > 0 ? 1 : 0;
};
