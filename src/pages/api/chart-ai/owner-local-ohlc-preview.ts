/**
 * Owner-local KIS OHLC preview route (Phase 3ET).
 *
 * This route is BLOCKED BY DEFAULT and cannot expose live KIS OHLC data in public production. It
 * only returns actual OHLC points when ALL owner-local conditions are satisfied:
 * - explicit query flags: `source=owner-local` and `preview=ohlc`;
 * - local-host request (localhost / 127.0.0.1 / ::1);
 * - explicit server env flags: KIS_OWNER_LOCAL_SMOKE=1, KIS_ALLOW_LIVE_QUOTE=1, KIS_ENABLE_LIVE_QUOTES=true;
 * - the owner-local provider gate (mode='owner-local', allowNetwork=true, allowKisLive=true);
 * - a verified endpoint — only KR domestic daily OHLC is verified as of this phase; US and intraday
 *   remain blocked.
 *
 * Any missing condition yields a safe blocked/unavailable JSON response (never a raw server error,
 * never a raw provider payload, never secrets). All responses are `Cache-Control: no-store`.
 */

import type { APIRoute } from 'astro';
import {
  runOwnerLocalOhlcPreview,
  type ChartAiOwnerLocalOhlcPreviewResponse,
} from '../../../lib/server/providers/kis/kisOwnerLocalOhlcPreview';
import { isChartPeriodKey, type ChartPeriodKey } from '../../../lib/chart-ai/mockedOhlc';
import type { OhlcAssetType, OhlcMarket } from '../../../lib/market-data/normalizedOhlc';

export const prerender = false;

const SAFETY = { rawResponsePrinted: false, secretsPrinted: false, publicProductionBlocked: true } as const;

const jsonResponse = (body: ChartAiOwnerLocalOhlcPreviewResponse, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

const normalizeMarket = (value: string | null): OhlcMarket => (value?.trim().toUpperCase() === 'US' ? 'US' : 'KR');

const normalizeAssetType = (value: string | null): OhlcAssetType => {
  const asset = value?.trim().toLowerCase();
  if (asset === 'etf' || asset === 'etn' || asset === 'index' || asset === 'stock') return asset;
  return 'stock';
};

const normalizeSymbol = (value: string | null): string => (value?.trim() ?? '').toUpperCase();

const normalizePeriod = (value: string | null): ChartPeriodKey => (isChartPeriodKey(value ?? undefined) ? (value as ChartPeriodKey) : '1m');

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

const blocked = (
  symbol: string,
  market: OhlcMarket,
  assetType: string,
  period: ChartPeriodKey,
  message: string,
): ChartAiOwnerLocalOhlcPreviewResponse => ({
  status: 'blocked',
  symbol,
  market,
  assetType,
  period,
  endpointKey: null,
  endpointVerified: false,
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

export const GET: APIRoute = async ({ url, request }) => {
  const symbol = normalizeSymbol(url.searchParams.get('symbol')) || '005930';
  const market = normalizeMarket(url.searchParams.get('market'));
  const assetType = normalizeAssetType(url.searchParams.get('assetType'));
  const period = normalizePeriod(url.searchParams.get('period'));

  // Explicit owner-local intent flags.
  if (url.searchParams.get('source') !== 'owner-local' || url.searchParams.get('preview') !== 'ohlc') {
    return jsonResponse(blocked(symbol, market, assetType, period, '오너 로컬 OHLC 프리뷰 조건이 충족되지 않았습니다.'));
  }

  // Local-host only.
  if (!isLocalHostRequest(url, request)) {
    return jsonResponse(blocked(symbol, market, assetType, period, '오너 로컬 OHLC 프리뷰는 로컬 환경에서만 사용할 수 있습니다.'));
  }

  // Explicit server env flags (values are never read into the response or logged).
  if (!ownerLocalEnvReady()) {
    return jsonResponse(blocked(symbol, market, assetType, period, '오너 로컬 OHLC 프리뷰 조건이 충족되지 않았습니다.'));
  }

  // Only the verified KR domestic daily OHLC endpoint is supported this phase; US remains blocked.
  if (market !== 'KR') {
    return jsonResponse(blocked(symbol, market, assetType, period, '해당 종목은 아직 OHLC 프리뷰가 지원되지 않습니다.'));
  }

  const response = await runOwnerLocalOhlcPreview(
    { symbol, market, assetType, period },
    { mode: 'owner-local', allowNetwork: true, allowKisLive: true },
  );
  return jsonResponse(response);
};

export const ALL: APIRoute = () =>
  jsonResponse(blocked('', 'KR', 'stock', '1m', 'Method not allowed.'), 405);
