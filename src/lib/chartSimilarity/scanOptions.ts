/**
 * Scan option normalization for the chart similarity engine (Phase 3EX-C).
 *
 * `SimilarityScanOptions` is a caller-facing shape and cannot be trusted to already contain
 * finite, positive, integer values (e.g. NaN baseWindow, negative excludeRecentBars, duplicate
 * or fractional forwardWindows). `normalizeScanOptions` coerces the raw options into a safe,
 * deterministic shape before the scanner uses them, and never throws on malformed but
 * type-compatible input — it degrades to conservative defaults and records a warning instead.
 */

import type { SimilarityScanOptions } from './types';

export type NormalizedScanOptions = {
  baseWindow: number;
  forwardWindows: number[];
  topK: number;
  similarityMethod: 'return_correlation_rmse';
  excludeRecentBars: number;
  warnings: string[];
};

const toFiniteNumber = (value: unknown): number | null => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

export const normalizeScanOptions = (options: SimilarityScanOptions): NormalizedScanOptions => {
  const warnings: string[] = [];

  const rawBaseWindow = toFiniteNumber(options?.baseWindow);
  const baseWindow = rawBaseWindow === null ? 0 : Math.max(0, Math.floor(rawBaseWindow));
  if (rawBaseWindow === null || baseWindow !== rawBaseWindow || baseWindow <= 0) {
    warnings.push(`baseWindow was invalid or non-integer (received ${String(options?.baseWindow)}); normalized to ${baseWindow}.`);
  }

  const rawForwardWindows = Array.isArray(options?.forwardWindows) ? options.forwardWindows : [];
  const sanitizedSet = new Set<number>();
  for (const raw of rawForwardWindows) {
    const n = toFiniteNumber(raw);
    if (n !== null && Number.isInteger(n) && n > 0) {
      sanitizedSet.add(n);
    }
  }
  const forwardWindows = Array.from(sanitizedSet).sort((a, b) => a - b);
  if (forwardWindows.length !== rawForwardWindows.length) {
    warnings.push('forwardWindows sanitized: removed non-positive, non-integer, non-finite, or duplicate values.');
  }

  const rawTopK = toFiniteNumber(options?.topK);
  const topK = rawTopK === null ? 0 : Math.max(0, Math.floor(rawTopK));
  if (rawTopK === null || topK !== rawTopK) {
    warnings.push(`topK was invalid or non-integer (received ${String(options?.topK)}); normalized to ${topK}.`);
  }

  const rawExclude = toFiniteNumber(options?.excludeRecentBars);
  const excludeRecentBars = rawExclude === null ? 0 : Math.max(0, Math.floor(rawExclude));
  if (rawExclude === null || excludeRecentBars !== rawExclude) {
    warnings.push(`excludeRecentBars was invalid, negative, or non-integer (received ${String(options?.excludeRecentBars)}); normalized to ${excludeRecentBars}.`);
  }

  return {
    baseWindow,
    forwardWindows,
    topK,
    similarityMethod: 'return_correlation_rmse',
    excludeRecentBars,
    warnings,
  };
};
