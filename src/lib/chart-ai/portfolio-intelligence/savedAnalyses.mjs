/**
 * Phase 3GG-S-FAST Portfolio Intelligence — Saved analysis snapshots (client-safe, pure + storage).
 * Stores a SANITIZED compact summary only (never raw OHLCV, prompt, model, or LLM/provider payload).
 * Capacity 30 (drop oldest). Snapshots are historical, not live. No provider calls.
 */

import { STORAGE_KEYS, LIMITS, normalizeSavedAnalysis } from './schemas.mjs';
import { readNamespace, writeNamespace, clearNamespace } from './storage.mjs';

const sanitizeItems = (items) => (Array.isArray(items) ? items : []).map(normalizeSavedAnalysis).filter(Boolean);

/**
 * Pure: add a snapshot (validated + sanitized), newest first, cap 30. Each call is a distinct
 * historical snapshot (id includes savedAt). Returns { items, saved }.
 */
export const addSavedAnalysis = (items, rawSnapshot, nowIso, idSuffix) => {
  const clean = sanitizeItems(items);
  const withMeta = { ...rawSnapshot, savedAt: nowIso ?? null, id: `${rawSnapshot?.analysisType ?? 'x'}:${rawSnapshot?.instrument?.country}:${rawSnapshot?.instrument?.symbol}:${idSuffix ?? clean.length}` };
  const snapshot = normalizeSavedAnalysis(withMeta);
  if (!snapshot) return { items: clean, saved: false };
  return { items: [snapshot, ...clean].slice(0, LIMITS.saved), saved: true };
};

export const removeSavedAnalysis = (items, id) => sanitizeItems(items).filter((it) => it.id !== id);

export const renameSavedAnalysis = (items, id, label) =>
  sanitizeItems(items).map((it) => (it.id === id ? normalizeSavedAnalysis({ ...it, label }) : it)).filter(Boolean);

export const loadSaved = (storage) => sanitizeItems(readNamespace(STORAGE_KEYS.saved, storage));
export const saveSaved = (items, storage, nowIso) => writeNamespace(STORAGE_KEYS.saved, sanitizeItems(items), storage, nowIso);
export const clearSaved = (storage) => clearNamespace(STORAGE_KEYS.saved, storage);
