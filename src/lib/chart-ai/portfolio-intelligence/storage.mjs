/**
 * Phase 3GG-S-FAST Portfolio Intelligence — localStorage abstraction (client-safe, corruption-safe).
 *
 * Pure aside from the injected storage backend. Every read tolerates corrupted/oversized/hostile
 * JSON and falls back to an empty, valid namespace. Every write is quota-safe (returns false on
 * failure, never throws). No credentials, no provider payloads, no env. A namespace is always shaped
 * `{ schemaVersion, updatedAt, items: [] }`.
 */

import { SCHEMA_VERSION } from './schemas.mjs';

const MAX_NAMESPACE_BYTES = 512 * 1024; // defensive cap; a namespace should never approach this

/** Returns the real localStorage when available, else null (SSR / private-mode / disabled). */
export const resolveStorage = () => {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      const s = globalThis.localStorage;
      // probe (private mode can throw on set)
      const probe = '__mkslab_probe__';
      s.setItem(probe, '1');
      s.removeItem(probe);
      return s;
    }
  } catch {
    return null;
  }
  return null;
};

/** Safe read → always returns an array of items (corruption/anything-unexpected → []). */
export const readNamespace = (key, storage) => {
  if (!storage) return [];
  let raw;
  try {
    raw = storage.getItem(key);
  } catch {
    return [];
  }
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > MAX_NAMESPACE_BYTES) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.items)) return [];
  return parsed.items;
};

/** Safe write of an items array under a namespace envelope. Returns true on success, false otherwise. */
export const writeNamespace = (key, items, storage, nowIso) => {
  if (!storage) return false;
  const envelope = {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: typeof nowIso === 'string' ? nowIso : null,
    items: Array.isArray(items) ? items : [],
  };
  let serialized;
  try {
    serialized = JSON.stringify(envelope);
  } catch {
    return false;
  }
  if (serialized.length > MAX_NAMESPACE_BYTES) return false;
  try {
    storage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
};

/** Removes a namespace entirely (used by "clear all"). Never throws. */
export const clearNamespace = (key, storage) => {
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

/** In-memory storage shim for deterministic tests (implements the localStorage subset used here). */
export const createMemoryStorage = () => {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    get length() { return map.size; },
  };
};
