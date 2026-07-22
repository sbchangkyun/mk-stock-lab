/**
 * Phase 3GG-S-FAST Portfolio Intelligence — Manual portfolio holdings (client-safe, pure + storage).
 * Manual entry ONLY. One holding per country+symbol by default; adding an existing instrument is a
 * conflict the caller resolves explicitly (never silently averaged/overwritten). Capacity 50.
 * Nothing here imports positions or calls a provider — every holding is typed in by the user.
 */

import { STORAGE_KEYS, LIMITS, normalizeHolding, normalizeInstrument, instrumentKey, toFinitePositive, toFiniteNonNegative, sanitizeText } from './schemas.mjs';
import { readNamespace, writeNamespace, clearNamespace } from './storage.mjs';

const sanitizeItems = (items) => (Array.isArray(items) ? items : []).map(normalizeHolding).filter(Boolean);

/**
 * Pure: add a holding. Returns { items, added, conflict, atCapacity }. On a country+symbol conflict,
 * does NOT modify anything unless `mergeReplace` is true (explicit user choice → replaces the record).
 */
export const addHolding = (items, input, nowIso, mergeReplace = false) => {
  const clean = sanitizeItems(items);
  const instrument = normalizeInstrument(input?.instrument);
  const quantity = toFinitePositive(input?.quantity);
  const averagePrice = toFiniteNonNegative(input?.averagePrice);
  if (!instrument || quantity === null || averagePrice === null) {
    return { items: clean, added: false, conflict: false, atCapacity: false };
  }
  const key = instrumentKey(instrument);
  const existingIndex = clean.findIndex((h) => instrumentKey(h.instrument) === key);
  const record = {
    id: `${key}`,
    instrument,
    quantity,
    averagePrice,
    currency: instrument.currency,
    note: sanitizeText(input?.note ?? '', LIMITS.note),
    createdAt: existingIndex >= 0 ? clean[existingIndex].createdAt : nowIso ?? null,
    updatedAt: nowIso ?? null,
  };
  if (existingIndex >= 0) {
    if (!mergeReplace) return { items: clean, added: false, conflict: true, atCapacity: false };
    const next = clean.slice();
    next[existingIndex] = record;
    return { items: next, added: true, conflict: false, atCapacity: false };
  }
  if (clean.length >= LIMITS.holdings) return { items: clean, added: false, conflict: false, atCapacity: true };
  return { items: [...clean, record], added: true, conflict: false, atCapacity: false };
};

/** Pure: edit quantity/averagePrice/note of an existing holding by id. */
export const updateHolding = (items, id, patch, nowIso) => {
  const clean = sanitizeItems(items);
  return clean.map((h) => {
    if (h.id !== id) return h;
    const quantity = patch?.quantity !== undefined ? toFinitePositive(patch.quantity) : h.quantity;
    const averagePrice = patch?.averagePrice !== undefined ? toFiniteNonNegative(patch.averagePrice) : h.averagePrice;
    if (quantity === null || averagePrice === null) return h; // invalid patch ignored
    return {
      ...h,
      quantity,
      averagePrice,
      note: patch?.note !== undefined ? sanitizeText(patch.note, LIMITS.note) : h.note,
      updatedAt: nowIso ?? null,
    };
  });
};

export const removeHolding = (items, id) => sanitizeItems(items).filter((h) => h.id !== id);

export const loadPortfolio = (storage) => sanitizeItems(readNamespace(STORAGE_KEYS.portfolio, storage));
export const savePortfolio = (items, storage, nowIso) => writeNamespace(STORAGE_KEYS.portfolio, sanitizeItems(items), storage, nowIso);
export const clearPortfolio = (storage) => clearNamespace(STORAGE_KEYS.portfolio, storage);
