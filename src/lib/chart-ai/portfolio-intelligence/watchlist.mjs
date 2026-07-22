/**
 * Phase 3GG-S-FAST Portfolio Intelligence — Watchlist (client-safe, pure + storage wrappers).
 * Dedupe by country+symbol, capacity 50, corruption-safe. No provider calls.
 */

import { STORAGE_KEYS, LIMITS, normalizeInstrument, instrumentKey } from './schemas.mjs';
import { readNamespace, writeNamespace, clearNamespace } from './storage.mjs';

const sanitizeItems = (items) =>
  (Array.isArray(items) ? items : [])
    .map((it) => {
      const instrument = normalizeInstrument(it?.instrument);
      return instrument ? { instrument, addedAt: typeof it?.addedAt === 'string' ? it.addedAt : null } : null;
    })
    .filter(Boolean);

/** Pure: add an instrument (dedupe, capacity). Returns { items, added, atCapacity }. */
export const addToWatchlist = (items, rawInstrument, nowIso) => {
  const clean = sanitizeItems(items);
  const instrument = normalizeInstrument(rawInstrument);
  if (!instrument) return { items: clean, added: false, atCapacity: false };
  const key = instrumentKey(instrument);
  if (clean.some((it) => instrumentKey(it.instrument) === key)) {
    return { items: clean, added: false, atCapacity: false };
  }
  if (clean.length >= LIMITS.watchlist) return { items: clean, added: false, atCapacity: true };
  return { items: [{ instrument, addedAt: nowIso ?? null }, ...clean], added: true, atCapacity: false };
};

export const removeFromWatchlist = (items, key) =>
  sanitizeItems(items).filter((it) => instrumentKey(it.instrument) !== key);

export const isInWatchlist = (items, rawInstrument) => {
  const instrument = normalizeInstrument(rawInstrument);
  if (!instrument) return false;
  const key = instrumentKey(instrument);
  return sanitizeItems(items).some((it) => instrumentKey(it.instrument) === key);
};

export const sortWatchlist = (items, sortBy) => {
  const clean = sanitizeItems(items);
  const by = {
    added: (a, b) => String(b.addedAt ?? '').localeCompare(String(a.addedAt ?? '')),
    name: (a, b) => a.instrument.displayName.localeCompare(b.instrument.displayName),
    country: (a, b) => a.instrument.country.localeCompare(b.instrument.country) || a.instrument.symbol.localeCompare(b.instrument.symbol),
    assetType: (a, b) => a.instrument.assetType.localeCompare(b.instrument.assetType) || a.instrument.displayName.localeCompare(b.instrument.displayName),
  };
  return clean.slice().sort(by[sortBy] || by.added);
};

export const loadWatchlist = (storage) => sanitizeItems(readNamespace(STORAGE_KEYS.watchlist, storage));
export const saveWatchlist = (items, storage, nowIso) => writeNamespace(STORAGE_KEYS.watchlist, sanitizeItems(items), storage, nowIso);
export const clearWatchlist = (storage) => clearNamespace(STORAGE_KEYS.watchlist, storage);
