/**
 * KIS quote response mapper (stub).
 *
 * Maps a SANITIZED, minimal, raw-like quote shape into a `NormalizedQuoteSnapshot`. It does NOT
 * contain or accept a captured real KIS payload, and no raw provider payload fixture is committed.
 * It exists so Phase 3EO can feed sanitized owner-local results through a single, tested mapping
 * without rewriting the provider boundary.
 *
 * Client-safety rules enforced here:
 * - invalid/missing numeric fields map to `null` (never NaN, never a raw string);
 * - no secrets, tokens, account data, or raw provider payloads are represented;
 * - snapshots default to non-live; a live claim must be set explicitly by the smoke phase.
 */

import type {
  NormalizedQuoteSnapshot,
  QuoteAssetType,
  QuoteMarket,
} from '../../../market-data/normalizedQuote';
import { SAMPLE_QUOTE_DISCLAIMER } from '../../../market-data/normalizedQuote';

/** Minimal sanitized input. Deliberately NOT a real KIS response shape. */
export type SanitizedKisQuoteLike = {
  symbol: string;
  displayName?: string;
  lastPrice?: number | string | null;
  previousClose?: number | string | null;
  change?: number | string | null;
  changeRate?: number | string | null;
  volume?: number | string | null;
  asOf?: string | null;
};

export type KisQuoteMapMeta = {
  market: QuoteMarket;
  exchange: string;
  assetType: QuoteAssetType;
  currency: string;
  /** Explicit live marking; defaults to false so the mapper never fabricates a live claim. */
  isLive?: boolean;
};

/** Coerce an unknown numeric-like value to a finite number or null. */
export const toNullableNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

export const mapSanitizedKisQuoteToSnapshot = (
  input: SanitizedKisQuoteLike,
  meta: KisQuoteMapMeta,
): NormalizedQuoteSnapshot => {
  const isLive = meta.isLive === true;
  return {
    symbol: input.symbol,
    displayName: input.displayName ?? input.symbol,
    market: meta.market,
    exchange: meta.exchange,
    assetType: meta.assetType,
    currency: meta.currency,

    lastPrice: toNullableNumber(input.lastPrice),
    previousClose: toNullableNumber(input.previousClose),
    change: toNullableNumber(input.change),
    changeRate: toNullableNumber(input.changeRate),
    volume: toNullableNumber(input.volume),

    asOf: input.asOf ?? null,
    source: 'kis-local',
    freshness: isLive ? 'delayed' : 'sample',

    isLive,
    isTradable: false,

    provider: 'kis',
    providerStatus: 'ok',

    label: isLive ? 'KIS 로컬 스모크 시세' : '샘플 시세',
    disclaimer: isLive
      ? '오너 로컬 스모크 데이터입니다. 공개 시세가 아님.'
      : SAMPLE_QUOTE_DISCLAIMER,
  };
};

/** Blocked/error fallback used when no sanitized quote is available. */
export const buildKisQuoteFallbackSnapshot = (
  symbol: string,
  meta: KisQuoteMapMeta,
  reason: string,
): NormalizedQuoteSnapshot => ({
  symbol,
  displayName: symbol,
  market: meta.market,
  exchange: meta.exchange,
  assetType: meta.assetType,
  currency: meta.currency,

  lastPrice: null,
  previousClose: null,
  change: null,
  changeRate: null,
  volume: null,

  asOf: null,
  source: 'unavailable',
  freshness: 'unavailable',

  isLive: false,
  isTradable: false,

  provider: 'kis',
  providerStatus: 'error',

  label: 'KIS quote unavailable',
  disclaimer: reason,
});
