/**
 * Phase 3GG-T-HF2: distributed-lease coordination policy (timing only).
 *
 * The atomic acquire/release/fencing lives in the migration RPCs (via KisTokenDb). This module owns the
 * bounded, jittered backoff a NON-lease-holder uses while polling L2 for a newly-stored generation.
 * Defaults: 200ms initial, capped at 800ms, with jitter; overall wait bounded by the manager.
 */

export const LEASE_POLL_INITIAL_MS = 200;
export const LEASE_POLL_CAP_MS = 800;

/**
 * Exponential-ish backoff with full jitter, capped. `random` is injectable for deterministic tests
 * (defaults to Math.random — jitter only, never used for anything security-sensitive).
 */
export const computeLeasePollDelayMs = (
  attempt: number,
  opts: { initialMs?: number; capMs?: number; random?: () => number } = {},
): number => {
  const initial = opts.initialMs ?? LEASE_POLL_INITIAL_MS;
  const cap = opts.capMs ?? LEASE_POLL_CAP_MS;
  const random = opts.random ?? Math.random;
  const base = Math.min(cap, initial * Math.pow(2, Math.max(0, attempt)));
  // Full jitter in [initial/2, base].
  const low = Math.min(initial / 2, base);
  const delay = low + random() * Math.max(0, base - low);
  return Math.round(Math.min(cap, delay));
};
