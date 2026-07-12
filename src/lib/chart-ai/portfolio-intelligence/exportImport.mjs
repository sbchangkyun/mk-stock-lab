/**
 * Phase 3GG-S-FAST Portfolio Intelligence — local JSON export/import (client-safe, pure).
 *
 * User-triggered only. Export contains ONLY the portable, sanitized namespaces (watchlist, recent,
 * saved analyses, manual holdings) — never secrets, credentials, raw provider payloads, prompts, raw
 * LLM output, model names, or full OHLCV arrays. Import is strictly validated (size cap, per-item
 * re-validation, invalid entries skipped with a count); no code execution.
 */

import { SCHEMA_VERSION, LIMITS, normalizeInstrument, normalizeHolding, normalizeSavedAnalysis } from './schemas.mjs';

export const EXPORT_KIND = 'mkStockLab.portfolioIntelligence.export';
const MAX_IMPORT_BYTES = 512 * 1024;

const cleanInstrumentList = (items, stamp) =>
  (Array.isArray(items) ? items : [])
    .map((it) => {
      const instrument = normalizeInstrument(it?.instrument);
      return instrument ? { instrument, [stamp]: typeof it?.[stamp] === 'string' ? it[stamp] : null } : null;
    })
    .filter(Boolean);

export const buildExport = (state, nowIso) => ({
  kind: EXPORT_KIND,
  schemaVersion: SCHEMA_VERSION,
  exportedAt: nowIso ?? null,
  watchlist: cleanInstrumentList(state?.watchlist, 'addedAt').slice(0, LIMITS.watchlist),
  recentSymbols: cleanInstrumentList(state?.recent, 'viewedAt').slice(0, LIMITS.recent),
  savedAnalyses: (Array.isArray(state?.saved) ? state.saved : []).map(normalizeSavedAnalysis).filter(Boolean).slice(0, LIMITS.saved),
  manualPortfolio: (Array.isArray(state?.portfolio) ? state.portfolio : []).map(normalizeHolding).filter(Boolean).slice(0, LIMITS.holdings),
});

/**
 * Parses + strictly validates an import payload. Returns
 * { ok, error?, data?, counts:{watchlist,recent,saved,portfolio}, skipped:{...} }.
 */
export const parseImport = (text) => {
  if (typeof text !== 'string' || text.length === 0) return { ok: false, error: 'EMPTY' };
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, error: 'TOO_LARGE' };
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'INVALID_JSON' };
  }
  if (!parsed || typeof parsed !== 'object' || parsed.kind !== EXPORT_KIND) return { ok: false, error: 'UNRECOGNIZED' };

  const validateList = (items, validator, stamp) => {
    const src = Array.isArray(items) ? items : [];
    const valid = [];
    let skipped = 0;
    for (const it of src) {
      const clean = stamp ? (() => { const inst = normalizeInstrument(it?.instrument); return inst ? { instrument: inst, [stamp]: typeof it?.[stamp] === 'string' ? it[stamp] : null } : null; })() : validator(it);
      if (clean) valid.push(clean);
      else skipped += 1;
    }
    return { valid, skipped };
  };

  const wl = validateList(parsed.watchlist, null, 'addedAt');
  const rc = validateList(parsed.recentSymbols, null, 'viewedAt');
  const sv = validateList(parsed.savedAnalyses, normalizeSavedAnalysis, null);
  const pf = validateList(parsed.manualPortfolio, normalizeHolding, null);

  return {
    ok: true,
    data: {
      watchlist: wl.valid.slice(0, LIMITS.watchlist),
      recent: rc.valid.slice(0, LIMITS.recent),
      saved: sv.valid.slice(0, LIMITS.saved),
      portfolio: pf.valid.slice(0, LIMITS.holdings),
    },
    counts: { watchlist: wl.valid.length, recent: rc.valid.length, saved: sv.valid.length, portfolio: pf.valid.length },
    skipped: { watchlist: wl.skipped, recent: rc.skipped, saved: sv.skipped, portfolio: pf.skipped },
  };
};
