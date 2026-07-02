/**
 * KIS owner-local OHLC preview adapter (Phase 3ET).
 *
 * Produces a CLIENT-SAFE OHLC preview response for the owner-local Chart AI preview route. Unlike
 * the Phase 3ES smoke client (which returns field-presence booleans only), this adapter returns
 * actual sanitized numeric OHLC points — but ONLY when the owner-local gate is open and the target
 * endpoint is verified against official KIS documentation. It never calls the network itself (no
 * `fetch`): transport is delegated to the approved `kisClient` adapter, and is injectable for safe
 * static testing.
 *
 * Safety guarantees:
 * - never returns a raw provider payload, authorization header, account data, or secrets;
 * - converts provider failures (PROVIDER_UNAVAILABLE, CONFIG_MISSING, rate limit, network) into a
 *   safe blocked/unavailable response instead of throwing;
 * - only the verified KR domestic daily OHLC endpoint is used; unverified endpoints (intraday, US)
 *   are always blocked;
 * - never uses `KIS_ACCOUNT_NO` and never calls account/trading APIs.
 */

import { assertServerRuntime } from '../serverOnly';
import { evaluateKisOwnerLocalGate } from './kisOwnerLocalGate';
import { buildKisOhlcRequestDescriptor } from './kisOhlcRequest';
import { mapSanitizedKisOhlcToSeries, type SanitizedKisOhlcLike } from './kisOhlcMapper';
import { getKisDomesticDailyOhlcSeries } from '../kisClient';
import { isRenderableOhlcSeries, type OhlcPeriod } from '../../../market-data/normalizedOhlc';
import type { OhlcProviderContext, OhlcProviderRequest } from '../../market-data/ohlcProvider';

export type ChartAiOwnerLocalOhlcPreviewStatus = 'ok' | 'blocked' | 'unavailable' | 'error';

export type ChartAiOwnerLocalOhlcPreviewPoint = {
  dateTime: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
};

export type ChartAiOwnerLocalOhlcPreviewResponse = {
  status: ChartAiOwnerLocalOhlcPreviewStatus;
  symbol: string;
  market: 'KR' | 'US';
  assetType: string;
  period: OhlcPeriod;
  endpointKey: string | null;
  endpointVerified: boolean;
  source: 'kis-local' | 'mocked' | 'unavailable';
  freshness: 'delayed' | 'sample' | 'unavailable';
  isLive: boolean;
  providerStatus: string;
  points: ChartAiOwnerLocalOhlcPreviewPoint[];
  pointCount: number;
  renderable: boolean;
  message: string;
  safety: {
    rawResponsePrinted: false;
    secretsPrinted: false;
    publicProductionBlocked: true;
  };
};

export type PreviewOhlcTransportResult =
  | { ok: true; points: SanitizedKisOhlcLike[] }
  | { ok: false; code: string };

export type PreviewOhlcDeps = {
  transportKr?: (symbol: string, query: Record<string, string>) => Promise<PreviewOhlcTransportResult>;
};

const SAFETY = { rawResponsePrinted: false, secretsPrinted: false, publicProductionBlocked: true } as const;

const buildBlockedPreview = (
  request: OhlcProviderRequest,
  endpointKey: string | null,
  endpointVerified: boolean,
  message: string,
): ChartAiOwnerLocalOhlcPreviewResponse => ({
  status: 'blocked',
  symbol: request.symbol,
  market: request.market,
  assetType: request.assetType ?? 'unknown',
  period: request.period,
  endpointKey,
  endpointVerified,
  source: 'unavailable',
  freshness: 'unavailable',
  isLive: false,
  providerStatus: 'blocked',
  points: [],
  pointCount: 0,
  renderable: false,
  message,
  safety: SAFETY,
});

const buildUnavailablePreview = (
  request: OhlcProviderRequest,
  endpointKey: string | null,
  endpointVerified: boolean,
  providerStatus: string,
  message: string,
): ChartAiOwnerLocalOhlcPreviewResponse => ({
  status: 'unavailable',
  symbol: request.symbol,
  market: request.market,
  assetType: request.assetType ?? 'unknown',
  period: request.period,
  endpointKey,
  endpointVerified,
  source: 'unavailable',
  freshness: 'unavailable',
  isLive: false,
  providerStatus,
  points: [],
  pointCount: 0,
  renderable: false,
  message,
  safety: SAFETY,
});

// Default KR transport wraps the approved kisClient adapter and converts its result into a
// sanitized OHLC-point-like shape. The raw provider response never leaves kisClient.
const defaultTransportKr = async (
  symbol: string,
  query: Record<string, string>,
): Promise<PreviewOhlcTransportResult> => {
  const result = await getKisDomesticDailyOhlcSeries({ symbol, query });
  if (!result.ok) return { ok: false, code: result.code };
  const points: SanitizedKisOhlcLike[] = result.data.points.map((point) => ({
    dateTime: point.dateTime,
    open: point.open,
    high: point.high,
    low: point.low,
    close: point.close,
    volume: point.volume,
  }));
  return { ok: true, points };
};

/**
 * Runs the owner-local OHLC preview. Returns a client-safe response for every path; never throws
 * for normal blocked/unavailable states. Returning actual OHLC values here is allowed only under
 * the full owner-local gate (mode='owner-local', allowNetwork=true, allowKisLive=true); the caller
 * (the owner-local OHLC preview API route) is responsible for the query/host/env conditions above
 * this gate.
 */
export const runOwnerLocalOhlcPreview = async (
  request: OhlcProviderRequest,
  context: OhlcProviderContext,
  deps: PreviewOhlcDeps = {},
): Promise<ChartAiOwnerLocalOhlcPreviewResponse> => {
  assertServerRuntime('kisOwnerLocalOhlcPreview');

  const gate = evaluateKisOwnerLocalGate({
    mode: context.mode,
    allowNetwork: context.allowNetwork,
    allowKisLive: context.allowKisLive,
  });
  if (!gate.allowed) {
    return buildBlockedPreview(request, null, false, `오너 로컬 OHLC 프리뷰 조건이 충족되지 않았습니다. (${gate.reason})`);
  }

  const descriptor = buildKisOhlcRequestDescriptor(request);
  const endpointVerified = descriptor.verification === 'verified-official-docs';
  if (!endpointVerified || request.market !== 'KR') {
    return buildBlockedPreview(
      request,
      descriptor.endpointKey,
      endpointVerified,
      '해당 종목은 아직 OHLC 프리뷰가 지원되지 않습니다.',
    );
  }

  const transportKr = deps.transportKr ?? defaultTransportKr;

  let transport: PreviewOhlcTransportResult;
  try {
    transport = await transportKr(descriptor.symbol, descriptor.query);
  } catch {
    // Never surface a raw error to the client.
    return buildUnavailablePreview(request, descriptor.endpointKey, true, 'error', 'KIS OHLC 데이터를 일시적으로 불러올 수 없습니다.');
  }

  if (!transport.ok) {
    if (transport.code === 'CONFIG_MISSING') {
      return buildBlockedPreview(request, descriptor.endpointKey, true, '오너 로컬 OHLC 프리뷰 조건이 충족되지 않았습니다.');
    }
    // PROVIDER_UNAVAILABLE, PROVIDER_RATE_LIMITED, network, and other errors -> safe unavailable.
    return buildUnavailablePreview(request, descriptor.endpointKey, true, transport.code, 'KIS OHLC 데이터를 일시적으로 불러올 수 없습니다.');
  }

  const seriesMeta = {
    market: 'KR' as const,
    assetType: request.assetType ?? 'stock',
    currency: 'KRW',
    period: request.period,
  };
  const series = mapSanitizedKisOhlcToSeries(descriptor.symbol, transport.points, {
    ...seriesMeta,
    isLive: true,
  });

  const renderable = isRenderableOhlcSeries(series) && series.points.length > 0;
  if (!renderable) {
    return {
      status: 'unavailable',
      symbol: descriptor.symbol,
      market: 'KR',
      assetType: seriesMeta.assetType,
      period: request.period,
      endpointKey: descriptor.endpointKey,
      endpointVerified: true,
      source: 'unavailable',
      freshness: 'unavailable',
      isLive: false,
      providerStatus: 'unavailable',
      points: [],
      pointCount: 0,
      renderable: false,
      message: '표시 가능한 OHLC 데이터가 부족하여 샘플 차트를 유지합니다.',
      safety: SAFETY,
    };
  }

  return {
    status: 'ok',
    symbol: descriptor.symbol,
    market: 'KR',
    assetType: seriesMeta.assetType,
    period: request.period,
    endpointKey: descriptor.endpointKey,
    endpointVerified: true,
    source: series.source,
    freshness: series.freshness,
    isLive: series.isLive,
    providerStatus: series.providerStatus,
    points: series.points,
    pointCount: series.points.length,
    renderable: true,
    message: '오너 로컬 OHLC 프리뷰를 불러왔습니다.',
    safety: SAFETY,
  };
};
