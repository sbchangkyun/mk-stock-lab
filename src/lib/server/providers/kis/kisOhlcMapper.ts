/**
 * KIS OHLC response mapper (stub).
 *
 * Maps a SANITIZED, minimal, raw-like OHLC point shape into a `NormalizedOhlcSeries`. It does NOT
 * contain or accept a captured real KIS payload, and no raw provider payload fixture is committed.
 * It exists so Phase 3ES can feed sanitized owner-local OHLC results through a single, tested
 * mapping without rewriting the provider boundary.
 *
 * Client-safety rules enforced here:
 * - invalid/missing numeric fields map to `null` (never NaN, never a raw string);
 * - points are always sorted ascending by `dateTime`;
 * - a series is only marked `source='kis-local'` / `isLive=true` when the smoke client explicitly
 *   marks it live — this mapper never fabricates a live claim on its own;
 * - no secrets, tokens, account data, or raw provider payloads are represented.
 */

import {
  toNullableOhlcNumber,
  type NormalizedOhlcPoint,
  type NormalizedOhlcSeries,
  type OhlcAssetType,
  type OhlcCurrency,
  type OhlcMarket,
  type OhlcPeriod,
} from '../../../market-data/normalizedOhlc';

/** Minimal sanitized input. Deliberately NOT a real KIS response shape. */
export type SanitizedKisOhlcLike = {
  dateTime: string;
  open?: number | string | null;
  high?: number | string | null;
  low?: number | string | null;
  close?: number | string | null;
  volume?: number | string | null;
};

export type KisOhlcMapMeta = {
  market: OhlcMarket;
  assetType: OhlcAssetType;
  currency: OhlcCurrency;
  period: OhlcPeriod;
  /** Explicit live marking; defaults to false so the mapper never fabricates a live claim. */
  isLive?: boolean;
};

const mapPoint = (input: SanitizedKisOhlcLike): NormalizedOhlcPoint => ({
  dateTime: input.dateTime,
  open: toNullableOhlcNumber(input.open),
  high: toNullableOhlcNumber(input.high),
  low: toNullableOhlcNumber(input.low),
  close: toNullableOhlcNumber(input.close),
  volume: toNullableOhlcNumber(input.volume),
});

export const mapSanitizedKisOhlcToSeries = (
  symbol: string,
  inputs: SanitizedKisOhlcLike[],
  meta: KisOhlcMapMeta,
): NormalizedOhlcSeries => {
  const isLive = meta.isLive === true;
  const points = inputs
    .map(mapPoint)
    .slice()
    .sort((a, b) => (a.dateTime < b.dateTime ? -1 : a.dateTime > b.dateTime ? 1 : 0));

  return {
    symbol,
    market: meta.market,
    assetType: meta.assetType,
    currency: meta.currency,
    period: meta.period,
    interval: isLive ? 'daily' : 'sample',
    source: isLive ? 'kis-local' : 'unavailable',
    freshness: isLive ? 'delayed' : 'unavailable',
    isLive,
    providerStatus: isLive ? 'ok' : 'unavailable',
    points,
    message: isLive
      ? '오너 로컬 스모크 OHLC 데이터입니다. 공개 시세가 아님.'
      : 'KIS OHLC 데이터를 사용할 수 없습니다.',
    safety: { rawResponsePrinted: false, secretsPrinted: false, publicProductionBlocked: true },
  };
};

/** Blocked/error fallback used when no sanitized OHLC series is available. */
export const buildKisOhlcFallbackSeries = (
  symbol: string,
  meta: Omit<KisOhlcMapMeta, 'isLive'>,
  reason: string,
): NormalizedOhlcSeries => ({
  symbol,
  market: meta.market,
  assetType: meta.assetType,
  currency: meta.currency,
  period: meta.period,
  interval: 'sample',
  source: 'unavailable',
  freshness: 'unavailable',
  isLive: false,
  providerStatus: 'unavailable',
  points: [],
  message: reason,
  safety: { rawResponsePrinted: false, secretsPrinted: false, publicProductionBlocked: true },
});
