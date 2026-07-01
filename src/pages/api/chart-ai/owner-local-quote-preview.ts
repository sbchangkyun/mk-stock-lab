/**
 * Owner-local KIS quote preview route.
 *
 * This route is BLOCKED BY DEFAULT and cannot expose live KIS quotes in public production. It only
 * returns actual quote values when ALL owner-local conditions are satisfied:
 * - explicit query flags: `source=owner-local` and `preview=quote`;
 * - local-host request (localhost / 127.0.0.1 / ::1);
 * - explicit server env flags: KIS_OWNER_LOCAL_SMOKE=1, KIS_ALLOW_LIVE_QUOTE=1, KIS_ENABLE_LIVE_QUOTES=true;
 * - the owner-local provider gate (mode='owner-local', allowNetwork=true, allowKisLive=true).
 *
 * Any missing condition yields a safe blocked/unavailable JSON response (never a raw server error,
 * never a raw provider payload, never secrets). All responses are `Cache-Control: no-store`.
 */

import type { APIRoute } from 'astro';
import {
  runOwnerLocalQuotePreview,
  type ChartAiQuotePreviewResponse,
} from '../../../lib/server/providers/kis/kisOwnerLocalQuotePreview';
import type { QuoteMarket, QuoteAssetType } from '../../../lib/market-data/normalizedQuote';

export const prerender = false;

const SAFETY = { rawResponsePrinted: false, secretsPrinted: false, publicProductionBlocked: true } as const;

const jsonResponse = (body: ChartAiQuotePreviewResponse, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

const normalizeMarket = (value: string | null): QuoteMarket => (value?.trim().toUpperCase() === 'US' ? 'US' : 'KR');

const normalizeAssetType = (value: string | null): QuoteAssetType => {
  const asset = value?.trim().toLowerCase();
  if (asset === 'etf' || asset === 'etn' || asset === 'index' || asset === 'stock') return asset;
  return 'stock';
};

const normalizeSymbol = (value: string | null): string => (value?.trim() ?? '').toUpperCase();

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

const isLocalHostRequest = (url: URL, request: Request): boolean => {
  const urlHost = url.hostname.toLowerCase();
  if (LOCAL_HOSTS.has(urlHost)) return true;
  const headerHost = (request.headers.get('host') ?? '').split(':')[0]?.trim().toLowerCase();
  return headerHost ? LOCAL_HOSTS.has(headerHost) : false;
};

const ownerLocalEnvReady = (): boolean =>
  process.env.KIS_OWNER_LOCAL_SMOKE === '1' &&
  process.env.KIS_ALLOW_LIVE_QUOTE === '1' &&
  process.env.KIS_ENABLE_LIVE_QUOTES === 'true';

const blocked = (symbol: string, market: QuoteMarket, assetType: string, message: string): ChartAiQuotePreviewResponse => ({
  status: 'blocked',
  symbol,
  market,
  assetType,
  source: 'unavailable',
  freshness: 'unavailable',
  isLive: false,
  providerStatus: 'blocked',
  quote: null,
  message,
  safety: SAFETY,
});

export const GET: APIRoute = async ({ url, request }) => {
  const symbol = normalizeSymbol(url.searchParams.get('symbol')) || '005930';
  const market = normalizeMarket(url.searchParams.get('market'));
  const assetType = normalizeAssetType(url.searchParams.get('assetType'));

  // Explicit owner-local intent flags.
  if (url.searchParams.get('source') !== 'owner-local' || url.searchParams.get('preview') !== 'quote') {
    return jsonResponse(blocked(symbol, market, assetType, '오너 로컬 프리뷰 조건이 충족되지 않았습니다.'));
  }

  // Local-host only.
  if (!isLocalHostRequest(url, request)) {
    return jsonResponse(blocked(symbol, market, assetType, '오너 로컬 프리뷰는 로컬 환경에서만 사용할 수 있습니다.'));
  }

  // Explicit server env flags (values are never read into the response or logged).
  if (!ownerLocalEnvReady()) {
    return jsonResponse(blocked(symbol, market, assetType, '오너 로컬 프리뷰 조건이 충족되지 않았습니다.'));
  }

  const response = await runOwnerLocalQuotePreview(
    { symbol, market, assetType },
    { mode: 'owner-local', allowNetwork: true, allowKisLive: true },
  );
  return jsonResponse(response);
};

export const ALL: APIRoute = () =>
  jsonResponse(blocked('', 'KR', 'stock', 'Method not allowed.'), 405);
