/**
 * KIS owner-local quote preview adapter.
 *
 * Produces a CLIENT-SAFE quote preview response for the owner-local preview route. Unlike the smoke
 * client (which returns field-presence booleans only), this adapter may return actual sanitized
 * quote values — but ONLY when the owner-local gate is open and the endpoint is verified. It never
 * calls the network itself (no `fetch`): transport is delegated to the approved `kisClient` adapter,
 * and is injectable for safe static testing.
 *
 * Safety guarantees:
 * - never returns a raw provider payload, authorization header, account data, or secrets;
 * - converts provider failures (PROVIDER_UNAVAILABLE, CONFIG_MISSING, rate limit, network) into a
 *   safe blocked/unavailable response instead of throwing;
 * - only the verified KR domestic endpoints are used; unverified endpoints are blocked.
 */

import { assertServerRuntime } from '../serverOnly';
import { evaluateKisOwnerLocalGate } from './kisOwnerLocalGate';
import { buildKisQuoteRequestDescriptor } from './kisQuoteRequest';
import { resolveVerifiedKisQuoteEndpoint } from './kisQuoteEndpointRegistry';
import { getKisDomesticQuoteSnapshot } from '../kisClient';
import type { QuoteProviderContext, QuoteProviderRequest } from '../../market-data/quoteProvider';

export type ChartAiQuotePreviewStatus = 'ok' | 'blocked' | 'unavailable' | 'error';

export type ChartAiQuotePreviewQuote = {
  displayName: string;
  lastPrice: number | null;
  previousClose: number | null;
  change: number | null;
  changeRate: number | null;
  volume: number | null;
  asOf: string | null;
  currency: string;
};

export type ChartAiQuotePreviewResponse = {
  status: ChartAiQuotePreviewStatus;
  symbol: string;
  market: 'KR' | 'US';
  assetType: string;
  source: 'kis-local' | 'unavailable' | 'mocked';
  freshness: 'delayed' | 'unavailable' | 'sample';
  isLive: boolean;
  providerStatus: string;
  quote: ChartAiQuotePreviewQuote | null;
  message: string;
  safety: {
    rawResponsePrinted: false;
    secretsPrinted: false;
    publicProductionBlocked: true;
  };
};

export type PreviewTransportResult =
  | { ok: true; price: number | null; previousClose: number | null; change: number | null; changeRate: number | null; volume: number | null; asOf: string | null; currency: string }
  | { ok: false; code: string };

export type PreviewDeps = {
  transportKr?: (symbol: string) => Promise<PreviewTransportResult>;
};

const SAFETY = { rawResponsePrinted: false, secretsPrinted: false, publicProductionBlocked: true } as const;

const buildBlockedPreview = (request: QuoteProviderRequest, message: string): ChartAiQuotePreviewResponse => ({
  status: 'blocked',
  symbol: request.symbol,
  market: request.market,
  assetType: request.assetType ?? 'unknown',
  source: 'unavailable',
  freshness: 'unavailable',
  isLive: false,
  providerStatus: 'blocked',
  quote: null,
  message,
  safety: SAFETY,
});

const buildUnavailablePreview = (
  request: QuoteProviderRequest,
  providerStatus: string,
  message: string,
): ChartAiQuotePreviewResponse => ({
  status: 'unavailable',
  symbol: request.symbol,
  market: request.market,
  assetType: request.assetType ?? 'unknown',
  source: 'unavailable',
  freshness: 'unavailable',
  isLive: false,
  providerStatus,
  quote: null,
  message,
  safety: SAFETY,
});

// Default KR transport wraps the approved kisClient adapter and extracts only sanitized numeric
// fields. The raw provider response never leaves kisClient.
const defaultTransportKr = async (symbol: string): Promise<PreviewTransportResult> => {
  const result = await getKisDomesticQuoteSnapshot({ market: 'KR', symbol });
  if (!result.ok) return { ok: false, code: result.code };
  const data = result.data;
  const previousClose =
    typeof data.price === 'number' && typeof data.change === 'number' ? data.price - data.change : null;
  return {
    ok: true,
    price: data.price,
    previousClose,
    change: data.change,
    changeRate: data.changePct,
    volume: data.volume ?? null,
    asOf: data.asOf,
    currency: data.currency,
  };
};

/**
 * Runs the owner-local quote preview. Returns a client-safe response for every path; never throws
 * for normal blocked/unavailable states.
 */
export const runOwnerLocalQuotePreview = async (
  request: QuoteProviderRequest,
  context: QuoteProviderContext,
  deps: PreviewDeps = {},
): Promise<ChartAiQuotePreviewResponse> => {
  assertServerRuntime('kisOwnerLocalQuotePreview');

  const gate = evaluateKisOwnerLocalGate({
    mode: context.mode,
    allowNetwork: context.allowNetwork,
    allowKisLive: context.allowKisLive,
  });
  if (!gate.allowed) {
    return buildBlockedPreview(request, `오너 로컬 프리뷰 조건이 충족되지 않았습니다. (${gate.reason})`);
  }

  const descriptor = buildKisQuoteRequestDescriptor(request);
  const endpoint = resolveVerifiedKisQuoteEndpoint(descriptor.endpointKey);
  if (!endpoint || request.market !== 'KR') {
    return buildBlockedPreview(request, '해당 종목은 아직 프리뷰가 지원되지 않습니다.');
  }

  const transportKr = deps.transportKr ?? defaultTransportKr;

  let transport: PreviewTransportResult;
  try {
    transport = await transportKr(request.symbol);
  } catch {
    // Never surface a raw error to the client.
    return buildUnavailablePreview(request, 'error', '일시적으로 시세를 불러올 수 없습니다.');
  }

  if (!transport.ok) {
    if (transport.code === 'CONFIG_MISSING') {
      return buildBlockedPreview(request, '오너 로컬 프리뷰 조건이 충족되지 않았습니다.');
    }
    // PROVIDER_UNAVAILABLE, PROVIDER_RATE_LIMITED, network, and other errors -> safe unavailable.
    return buildUnavailablePreview(request, transport.code, '일시적으로 시세를 불러올 수 없습니다.');
  }

  if (transport.price === null) {
    return buildUnavailablePreview(request, 'PROVIDER_UNAVAILABLE', '일시적으로 시세를 불러올 수 없습니다.');
  }

  return {
    status: 'ok',
    symbol: request.symbol,
    market: 'KR',
    assetType: request.assetType ?? 'stock',
    source: 'kis-local',
    freshness: 'delayed',
    isLive: true,
    providerStatus: 'ok',
    quote: {
      displayName: request.symbol,
      lastPrice: transport.price,
      previousClose: transport.previousClose,
      change: transport.change,
      changeRate: transport.changeRate,
      volume: transport.volume,
      asOf: transport.asOf,
      currency: transport.currency,
    },
    message: '오너 로컬 프리뷰를 불러왔습니다.',
    safety: SAFETY,
  };
};
