/**
 * KIS owner-local gate.
 *
 * A single, pure decision function that determines whether a live KIS quote call may be
 * attempted. It intentionally does NOT read the environment or any secret: the caller
 * supplies the explicit intent flags, so public production can never accidentally satisfy
 * the gate. Even when the gate returns `allowed: true`, Phase 3EN performs no live call —
 * the first live call is deferred to Phase 3EO — Owner-Local KIS Quote Smoke.
 */

export type KisRuntimeMode = 'blocked' | 'mocked' | 'owner-local';

export type KisOwnerLocalGateInput = {
  mode: 'fixture' | 'mocked' | 'owner-local';
  allowNetwork: boolean;
  allowKisLive?: boolean;
};

export type KisOwnerLocalGateReason =
  | 'blocked_by_mode'
  | 'network_not_allowed'
  | 'live_flag_missing'
  | 'owner_local_allowed';

export type KisOwnerLocalGateResult = {
  allowed: boolean;
  reason: KisOwnerLocalGateReason;
};

/**
 * The gate allows a live attempt only when ALL of the following hold:
 * - mode === 'owner-local'
 * - allowNetwork === true
 * - allowKisLive === true
 * Any other combination is blocked with a specific reason.
 */
export const evaluateKisOwnerLocalGate = (input: KisOwnerLocalGateInput): KisOwnerLocalGateResult => {
  if (input.mode !== 'owner-local') {
    return { allowed: false, reason: 'blocked_by_mode' };
  }
  if (input.allowNetwork !== true) {
    return { allowed: false, reason: 'network_not_allowed' };
  }
  if (input.allowKisLive !== true) {
    return { allowed: false, reason: 'live_flag_missing' };
  }
  return { allowed: true, reason: 'owner_local_allowed' };
};

/** Maps a gate input to a coarse runtime mode for logging/telemetry (no secrets). */
export const resolveKisRuntimeMode = (input: KisOwnerLocalGateInput): KisRuntimeMode => {
  if (input.mode === 'mocked') return 'mocked';
  if (evaluateKisOwnerLocalGate(input).allowed) return 'owner-local';
  return 'blocked';
};
