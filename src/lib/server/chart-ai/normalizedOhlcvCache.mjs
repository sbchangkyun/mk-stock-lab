/**
 * Phase 3GG-T-HF4C normalized-OHLCV cache + single-flight (server-only, provider-neutral).
 *
 * One authoritative bounded cache + one in-flight map for normalized, client-safe market data. This
 * is the SOLE owner of OHLCV request coalescing — API routes never implement their own single-flight.
 *
 * Guarantees:
 *   - Bounded LRU storage (deterministic oldest/LRU eviction; never unbounded).
 *   - Injectable clock (`now`) so TTL is testable without wall-clock sleeps.
 *   - Same-key concurrent calls issue exactly one underlying load; all callers await it; the in-flight
 *     entry always clears in `finally` (success OR failure). A later caller may retry after a failure.
 *   - Only successful/stable results are cached (positive) or short-lived negative results; provider,
 *     auth and internal ERRORS are never cached.
 *   - Value safety: every stored and returned value is a structured deep clone, so a caller mutating
 *     its copy can never corrupt the cached value (and vice versa).
 *   - The cache key NEVER contains user/auth/token data — `buildOhlcvCacheKey` throws if such a field
 *     is supplied, and only whitelisted market-data dimensions are serialized.
 *
 * This module is NOT durable/cross-instance: it is authoritative only within one warm server
 * instance. A shared L2 cache (Supabase/Redis/KV) is explicitly out of scope for this phase.
 */

export const OHLCV_CACHE_STATE = {
  MISS: 'MISS',
  HIT: 'HIT',
  COALESCED: 'COALESCED',
  NEGATIVE_HIT: 'NEGATIVE_HIT',
  BYPASS: 'BYPASS',
};

// Fields that must NEVER influence a market-data cache key. Supplying any of these is a programming
// error (a market-data key is identical for every authenticated user) — fail loudly.
const FORBIDDEN_KEY_FIELDS = [
  'userid', 'user', 'email', 'session', 'sessionid', 'token', 'accesstoken', 'bearer',
  'authorization', 'cookie', 'jwt', 'appkey', 'appsecret', 'secret', 'password', 'namespace',
];

const KEY_FIELD_ORDER = [
  'country', 'symbol', 'exchange', 'exchangeCode', 'mode', 'range', 'targetBars', 'adjusted', 'methodVersion',
];

const norm = (value) => (value === undefined || value === null ? '' : String(value).trim());

/**
 * Deterministic canonical cache-key builder. Includes exactly the fields that change the market-data
 * result; excludes (and rejects) any user/auth/token field.
 */
export const buildOhlcvCacheKey = (fields = {}) => {
  for (const provided of Object.keys(fields)) {
    if (FORBIDDEN_KEY_FIELDS.includes(provided.toLowerCase())) {
      throw new Error(`buildOhlcvCacheKey: forbidden field in cache key: ${provided}`);
    }
  }
  return KEY_FIELD_ORDER.map((k) => `${k}=${norm(fields[k]).toLowerCase()}`).join('|');
};

const deepClone = (value) => {
  if (value === null || typeof value !== 'object') return value;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};

/**
 * Creates a bounded normalized-OHLCV cache with same-key single-flight.
 * @param {{ maxEntries?: number, now?: () => number }} options
 */
export const createNormalizedOhlcvCache = ({ maxEntries = 256, now = () => Date.now() } = {}) => {
  const store = new Map(); // key -> { value(cloned), expiresAtMs, negative }
  const inflight = new Map(); // key -> Promise<rawValue>

  const isFresh = (entry) => entry && entry.expiresAtMs > now();

  const readFresh = (key) => {
    const entry = store.get(key);
    if (!entry) return null;
    if (!isFresh(entry)) {
      store.delete(key);
      return null;
    }
    // LRU touch: re-insert to move to the most-recently-used end.
    store.delete(key);
    store.set(key, entry);
    return entry;
  };

  const evictIfNeeded = () => {
    while (store.size > maxEntries) {
      const oldestKey = store.keys().next().value;
      if (oldestKey === undefined) break;
      store.delete(oldestKey);
    }
  };

  const setEntry = (key, rawValue, ttlMs, negative) => {
    if (!(ttlMs > 0)) return; // ttl<=0 => do not store
    store.delete(key);
    store.set(key, { value: deepClone(rawValue), expiresAtMs: now() + ttlMs, negative: Boolean(negative) });
    evictIfNeeded();
  };

  /**
   * Returns a cached value or loads it under single-flight.
   * @param {string} key
   * @param {() => Promise<any>} loader  runs the underlying provider fetch (called at most once per
   *        concurrent burst for this key)
   * @param {(value:any) => { store:boolean, ttlMs:number, negative?:boolean }} classify  decides how
   *        (or whether) the loaded value is cached. Throwing loaders are NEVER cached.
   * @returns {Promise<{ value:any, state:string }>}
   */
  const getOrLoad = async (key, loader, classify) => {
    const fresh = readFresh(key);
    if (fresh) {
      return { value: deepClone(fresh.value), state: fresh.negative ? OHLCV_CACHE_STATE.NEGATIVE_HIT : OHLCV_CACHE_STATE.HIT };
    }

    const existing = inflight.get(key);
    if (existing) {
      const rawValue = await existing; // shared work; may reject -> propagates to this caller too
      return { value: deepClone(rawValue), state: OHLCV_CACHE_STATE.COALESCED };
    }

    const promise = (async () => loader())();
    inflight.set(key, promise);
    try {
      const rawValue = await promise;
      let decision = { store: false, ttlMs: 0, negative: false };
      try {
        decision = classify ? classify(rawValue) : decision;
      } catch {
        decision = { store: false, ttlMs: 0, negative: false };
      }
      if (decision && decision.store) setEntry(key, rawValue, decision.ttlMs, decision.negative);
      return { value: deepClone(rawValue), state: OHLCV_CACHE_STATE.MISS };
    } finally {
      inflight.delete(key); // always clear, on success AND failure
    }
  };

  return {
    getOrLoad,
    buildKey: buildOhlcvCacheKey,
    /** Test/inspection helpers (server-internal). */
    peek: (key) => {
      const entry = store.get(key);
      return entry && isFresh(entry) ? deepClone(entry.value) : null;
    },
    size: () => store.size,
    inflightSize: () => inflight.size,
    clear: () => {
      store.clear();
      inflight.clear();
    },
  };
};
