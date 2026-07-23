/**
 * Phase 3GG-U chart AI usage guard test source (bundled + run by scripts/smoke_phase_3gg_u_chart_ai_usage.mjs).
 *
 * Proves src/lib/server/chartAiUsage.ts calls ONLY the PUBLIC PostgREST bridge RPCs
 * (public.consume_chart_ai_usage_v1 / public.refund_chart_ai_usage_v1) and never `.schema('internal')` or
 * a direct table select. Uses a fake recording client that ONLY implements `.rpc(...)` -- so any
 * `.schema()` / `.from()` access would throw and fail the test. No network, no secrets.
 */

import {
  consumeChartAiUsage,
  refundChartAiUsage,
  defaultFreeLimit,
} from '../src/lib/server/chartAiUsage';
import type { ChartAiUsageRpcClient } from '../src/lib/server/chartAiUsage';

let passed = 0;
let failed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

type Call = { name: string; params: Record<string, unknown> | undefined };

const makeRecordingClient = (
  handler: (fn: string, params?: Record<string, unknown>) => { data: unknown; error: unknown },
): { client: ChartAiUsageRpcClient; calls: Call[] } => {
  const calls: Call[] = [];
  const client: ChartAiUsageRpcClient = {
    rpc: async (fn: string, params?: Record<string, unknown>) => {
      calls.push({ name: fn, params });
      return handler(fn, params);
    },
    // Deliberately NO `schema` or `from` -- if the module used `.schema('internal')` this object would
    // throw a TypeError, failing the test.
  };
  return { client, calls };
};

const alwaysConfigured = () => true;

export const runAll = async (): Promise<number> => {
  // 1) Allowed row.
  {
    const { client, calls } = makeRecordingClient(() => ({
      data: [{ allowed: true, used_count: 1, free_limit: 3, remaining_count: 2, usage_date_kst: '2026-07-23' }],
      error: null,
    }));
    const state = await consumeChartAiUsage('user-1', () => client, alwaysConfigured);
    check(
      'consume -> public.consume_chart_ai_usage_v1 with p_user_id + p_free_limit',
      calls[0]?.name === 'consume_chart_ai_usage_v1' &&
        calls[0]?.params?.p_user_id === 'user-1' &&
        calls[0]?.params?.p_free_limit === defaultFreeLimit,
    );
    check(
      'consume allowed row -> reason=allowed, remaining=2',
      state.allowed === true && state.reason === 'allowed' && state.remaining === 2 && state.used === 1,
    );
  }

  // 2) Exhausted row.
  {
    const { client } = makeRecordingClient(() => ({
      data: [{ allowed: false, used_count: 3, free_limit: 3, remaining_count: 0, usage_date_kst: '2026-07-23' }],
      error: null,
    }));
    const state = await consumeChartAiUsage('user-1', () => client, alwaysConfigured);
    check(
      'consume exhausted row -> reason=limit_reached, remaining=0',
      state.allowed === false && state.reason === 'limit_reached' && state.remaining === 0,
    );
  }

  // 3) RPC error -> fails closed, never throws.
  {
    const { client } = makeRecordingClient(() => ({ data: null, error: { message: 'boom' } }));
    const state = await consumeChartAiUsage('user-1', () => client, alwaysConfigured);
    check(
      'consume RPC error -> fails closed (usage_guard_unavailable, allowed=false)',
      state.reason === 'usage_guard_unavailable' && state.allowed === false,
    );
  }

  // 4) Malformed/empty row -> fails closed.
  {
    const { client } = makeRecordingClient(() => ({ data: [], error: null }));
    const state = await consumeChartAiUsage('user-1', () => client, alwaysConfigured);
    check(
      'consume malformed row -> fails closed (usage_guard_unavailable)',
      state.reason === 'usage_guard_unavailable' && state.allowed === false,
    );
  }

  // 5) Not configured -> fails closed without ever invoking the client.
  {
    const { client, calls } = makeRecordingClient(() => ({ data: [{ allowed: true }], error: null }));
    const state = await consumeChartAiUsage('user-1', () => client, () => false);
    check(
      'consume not configured -> fails closed, RPC never called',
      state.reason === 'usage_guard_unavailable' && calls.length === 0,
    );
  }

  // 6) Refund success.
  {
    const { client, calls } = makeRecordingClient(() => ({
      data: [{ allowed: true, used_count: 0, free_limit: 3, remaining_count: 3, usage_date_kst: '2026-07-23' }],
      error: null,
    }));
    const state = await refundChartAiUsage('user-1', () => client, alwaysConfigured);
    check(
      'refund -> public.refund_chart_ai_usage_v1 with p_user_id only',
      calls[0]?.name === 'refund_chart_ai_usage_v1' &&
        calls[0]?.params?.p_user_id === 'user-1' &&
        !('p_free_limit' in (calls[0]?.params ?? {})),
    );
    check('refund success row -> remaining restored to 3', state?.remaining === 3);
  }

  // 7) Refund RPC error -> returns null, never throws.
  {
    const { client } = makeRecordingClient(() => ({ data: null, error: { message: 'boom' } }));
    const state = await refundChartAiUsage('user-1', () => client, alwaysConfigured);
    check('refund RPC error -> returns null (best-effort, no throw)', state === null);
  }

  // 8) Refund not configured -> returns null without invoking the client.
  {
    const { client, calls } = makeRecordingClient(() => ({ data: [{ allowed: true }], error: null }));
    const state = await refundChartAiUsage('user-1', () => client, () => false);
    check('refund not configured -> returns null, RPC never called', state === null && calls.length === 0);
  }

  // Global assertions across every call recorded above.
  {
    const { client } = makeRecordingClient(() => ({ data: [{ allowed: true }], error: null }));
    const allCalls: Call[] = [];
    const recordingProxy: ChartAiUsageRpcClient = {
      rpc: async (fn, params) => {
        allCalls.push({ name: fn, params });
        return client.rpc(fn, params);
      },
    };
    await consumeChartAiUsage('user-2', () => recordingProxy, alwaysConfigured);
    await refundChartAiUsage('user-2', () => recordingProxy, alwaysConfigured);
    const names = allCalls.map((c) => c.name);
    const APPROVED = new Set(['consume_chart_ai_usage_v1', 'refund_chart_ai_usage_v1']);
    check('only the two approved public bridge RPC names are used', names.length === 2 && names.every((n) => APPROVED.has(n)));
    check('no internal-schema RPC name is used', !names.some((n) => /^internal\./.test(n)));
    check('no secret-like value passed to the bridge', !JSON.stringify(allCalls).match(/sk-[A-Za-z0-9]{20}|eyJ[A-Za-z0-9_-]{20}\./));
  }

  console.log('');
  console.log(`CHART-AI-USAGE-TESTS :: passed=${passed} failed=${failed} total=${passed + failed}`);
  return failed > 0 ? 1 : 0;
};
