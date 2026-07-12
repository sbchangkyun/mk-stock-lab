/**
 * Phase 3GG-T-FAST — cross-asset FX provider (server-only, read-only, fail-safe).
 *
 * Sources USD/KRW from the free, no-secret, ECB-backed Frankfurter API (data-source policy tier 3:
 * "official or clearly permitted free public data interfaces that require no new secret"). No
 * credentials, no account data, no trading. Bounded timeout; on any failure returns an honest
 * unavailable context (never a fabricated or hardcoded FX rate). Cached (FX is a daily series). Only a
 * compact { rate, changePct, asOf } is exposed — never a raw provider payload.
 */

const FX_BASE = 'https://api.frankfurter.dev/v1';
const FX_TIMEOUT_MS = 3500;
const FX_TTL_MS = 6 * 60 * 60 * 1000;

let fxCache = null;

const yyyymmdd = (date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;

const fetchJson = async (url) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FX_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const rateFrom = (payload) => {
  const r = payload && payload.rates && typeof payload.rates.KRW === 'number' ? payload.rates.KRW : null;
  return Number.isFinite(r) && r > 0 ? r : null;
};

/**
 * @returns { available, source, rate, changePct, asOf, isDelayed, sanitizedErrorCode }
 */
export const fetchUsdKrwContext = async (deps = {}) => {
  const now = deps.now ?? (() => Date.now());
  if (fxCache && now() - fxCache.storedAtMs < FX_TTL_MS) return { ...fxCache.value };

  const latest = await fetchJson(`${FX_BASE}/latest?base=USD&symbols=KRW`);
  const rate = rateFrom(latest);
  if (rate === null) {
    return { available: false, source: 'frankfurter-ecb', rate: null, changePct: null, asOf: null, isDelayed: true, sanitizedErrorCode: 'NOT_SOURCED' };
  }

  // ~1 month change (business-day tolerant: Frankfurter returns the nearest prior available date).
  const past = new Date(now() - 30 * 24 * 60 * 60 * 1000);
  const pastPayload = await fetchJson(`${FX_BASE}/${yyyymmdd(past)}?base=USD&symbols=KRW`);
  const pastRate = rateFrom(pastPayload);
  const changePct = pastRate ? Math.round(((rate - pastRate) / pastRate) * 10000) / 100 : null;

  const value = {
    available: true,
    source: 'frankfurter-ecb',
    rate: Math.round(rate * 100) / 100,
    changePct,
    asOf: typeof latest.date === 'string' ? latest.date : null,
    isDelayed: true, // ECB reference rate (previous business day), not real-time
    sanitizedErrorCode: 'NONE',
  };
  fxCache = { value, storedAtMs: now() };
  return { ...value };
};
