/**
 * Phase 3GG-S-FAST Portfolio Intelligence — Recent symbols (client-safe, pure + storage wrappers).
 * Most-recent-first, dedupe by country+symbol (re-select moves to front + updates viewedAt),
 * capacity 20. Recorded only after a valid instrument selection. No provider calls.
 */

import { STORAGE_KEYS, LIMITS, normalizeInstrument, instrumentKey } from './schemas.mjs';
import { readNamespace, writeNamespace, clearNamespace } from './storage.mjs';

const sanitizeItems = (items) =>
  (Array.isArray(items) ? items : [])
    .map((it) => {
      const instrument = normalizeInstrument(it?.instrument);
      return instrument ? { instrument, viewedAt: typeof it?.viewedAt === 'string' ? it.viewedAt : null } : null;
    })
    .filter(Boolean);

/** Pure: record a selection. Dedupe → move to front, update viewedAt, cap. Returns new items. */
export const recordRecent = (items, rawInstrument, nowIso) => {
  const instrument = normalizeInstrument(rawInstrument);
  if (!instrument) return sanitizeItems(items);
  const key = instrumentKey(instrument);
  const rest = sanitizeItems(items).filter((it) => instrumentKey(it.instrument) !== key);
  return [{ instrument, viewedAt: nowIso ?? null }, ...rest].slice(0, LIMITS.recent);
};

export const loadRecent = (storage) => sanitizeItems(readNamespace(STORAGE_KEYS.recent, storage));
export const saveRecent = (items, storage, nowIso) => writeNamespace(STORAGE_KEYS.recent, sanitizeItems(items), storage, nowIso);
export const clearRecent = (storage) => clearNamespace(STORAGE_KEYS.recent, storage);
