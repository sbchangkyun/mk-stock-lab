/**
 * KIS owner-local OHLC smoke client (Phase 3ES).
 *
 * Executes exactly one owner-local OHLC request, and only when the owner-local gate is open and
 * the target endpoint is verified against official KIS documentation. It never contains a network
 * `fetch` call itself: the actual transport is delegated to `getKisDomesticDailyOhlcSeries` in the
 * approved `kisClient` adapter (the single provider file permitted to perform network I/O).
 * Transport and env-presence are injectable so this module can be tested statically with no
 * network and no secrets.
 *
 * Client-safety guarantees:
 * - it validates the PRESENCE of required env names only; it never reads, returns, or logs values;
 * - it never returns or persists a raw provider response — only a sanitized `NormalizedOhlcSeries`
 *   wrapped in a coarse-status result;
 * - it returns no actual OHLC price values in this file's own output beyond what the sanitized
 *   normalized series already carries (numbers only, never raw KIS field names/payload).
 * - it never uses `KIS_ACCOUNT_NO` and never calls account/trading APIs.
 */

import { assertServerRuntime } from '../serverOnly';
import { evaluateKisOwnerLocalGate } from './kisOwnerLocalGate';
import { buildKisOhlcRequestDescriptor } from './kisOhlcRequest';
import {
  buildKisOhlcFallbackSeries,
  mapSanitizedKisOhlcToSeries,
  type SanitizedKisOhlcLike,
} from './kisOhlcMapper';
import { getKisDomesticDailyOhlcSeries } from '../kisClient';
import { isRenderableOhlcSeries, type NormalizedOhlcSeries, type OhlcPeriod } from '../../../market-data/normalizedOhlc';
import type { OhlcProviderContext, OhlcProviderRequest } from '../../market-data/ohlcProvider';

export type KisSmokeHttpStatusClass = '2xx' | '4xx' | '5xx' | 'network-error' | 'not-run';

export type KisOwnerLocalOhlcSmokeResult = {
  status: 'PASS' | 'FAIL' | 'BLOCKED';
  symbol: string;
  market: 'KR' | 'US';
  assetType: string;
  period: OhlcPeriod;
  endpointKey: string;
  endpointVerified: boolean;
  httpStatusClass: KisSmokeHttpStatusClass;
  normalizedSeriesSafe: boolean;
  pointCount: number;
  renderable: boolean;
  fieldPresence: {
    open: boolean;
    high: boolean;
    low: boolean;
    close: boolean;
    volume: boolean;
  };
  source: string;
  freshness: string;
  isLive: boolean;
  providerStatus: string;
  rawResponsePrinted: false;
  secretsPrinted: false;
  message: string;
};

export type KisOhlcSmokeTransportResult = {
  ok: boolean;
  httpStatusClass: KisSmokeHttpStatusClass;
  points?: SanitizedKisOhlcLike[];
  message: string;
};

export type KisOhlcSmokeDeps = {
  /** Presence-only env check; must never return the value. Defaults to a process env presence probe. */
  hasEnvValue?: (name: string) => boolean;
  /** KR transport. Defaults to the approved kisClient domestic daily OHLC adapter. */
  transportKr?: (symbol: string, query: Record<string, string>) => Promise<KisOhlcSmokeTransportResult>;
};

const REQUIRED_KR_ENV_NAMES = ['KIS_APP_KEY', 'KIS_APP_SECRET', 'KIS_BASE_URL'];

const FORBIDDEN_IN_SNAPSHOT =
  /access_token|authorization|bearer|appkey|appsecret|app_key|app_secret|grant_type|password|jwt|supabase\.co|account_no|rt_cd|stck_prpr|stck_oprc|stck_hgpr|stck_lwpr|stck_clpr|stck_bsop_date/i;

const defaultHasEnvValue = (name: string): boolean => {
  const raw = process.env[name];
  return typeof raw === 'string' && raw.trim().length > 0;
};

// Default KR transport wraps the approved kisClient adapter and converts its result into a
// sanitized OHLC-point-like shape. The raw provider response never leaves kisClient.
const defaultTransportKr = async (
  symbol: string,
  query: Record<string, string>,
): Promise<KisOhlcSmokeTransportResult> => {
  const result = await getKisDomesticDailyOhlcSeries({ symbol, query });
  if (!result.ok) {
    const code = result.code;
    const httpStatusClass: KisSmokeHttpStatusClass =
      code === 'PROVIDER_RATE_LIMITED' ? '4xx'
        : code === 'PROVIDER_UNAVAILABLE' ? '5xx'
          : code === 'CONFIG_MISSING' ? 'not-run'
            : 'network-error';
    return { ok: false, httpStatusClass, message: `Transport error: ${code}` };
  }
  const points: SanitizedKisOhlcLike[] = result.data.points.map((point) => ({
    dateTime: point.dateTime,
    open: point.open,
    high: point.high,
    low: point.low,
    close: point.close,
    volume: point.volume,
  }));
  return { ok: true, httpStatusClass: '2xx', points, message: 'ok' };
};

const emptyFieldPresence = () => ({
  open: false,
  high: false,
  low: false,
  close: false,
  volume: false,
});

const blockedResult = (
  request: OhlcProviderRequest,
  endpointKey: string,
  endpointVerified: boolean,
  message: string,
): KisOwnerLocalOhlcSmokeResult => ({
  status: 'BLOCKED',
  symbol: request.symbol,
  market: request.market,
  assetType: request.assetType ?? 'unknown',
  period: request.period,
  endpointKey,
  endpointVerified,
  httpStatusClass: 'not-run',
  normalizedSeriesSafe: true,
  pointCount: 0,
  renderable: false,
  fieldPresence: emptyFieldPresence(),
  source: 'unavailable',
  freshness: 'unavailable',
  isLive: false,
  providerStatus: 'blocked',
  rawResponsePrinted: false,
  secretsPrinted: false,
  message,
});

const isSeriesSafe = (series: NormalizedOhlcSeries): boolean =>
  !FORBIDDEN_IN_SNAPSHOT.test(JSON.stringify(series));

const fieldPresentInAtLeastTwo = (
  series: NormalizedOhlcSeries,
  key: 'open' | 'high' | 'low' | 'close' | 'volume',
): boolean => series.points.filter((point) => point[key] !== null).length >= 2;

const computeFieldPresence = (series: NormalizedOhlcSeries) => ({
  open: fieldPresentInAtLeastTwo(series, 'open'),
  high: fieldPresentInAtLeastTwo(series, 'high'),
  low: fieldPresentInAtLeastTwo(series, 'low'),
  close: fieldPresentInAtLeastTwo(series, 'close'),
  volume: fieldPresentInAtLeastTwo(series, 'volume'),
});

/**
 * Runs the owner-local KIS OHLC smoke for a single symbol/period. Returns a sanitized result
 * only; never returns or logs a raw provider response or secret value.
 */
export const runOwnerLocalKisOhlcSmoke = async (
  request: OhlcProviderRequest,
  context: OhlcProviderContext,
  deps: KisOhlcSmokeDeps = {},
): Promise<KisOwnerLocalOhlcSmokeResult> => {
  assertServerRuntime('kisOwnerLocalOhlcClient');

  const hasEnvValue = deps.hasEnvValue ?? defaultHasEnvValue;
  const transportKr = deps.transportKr ?? defaultTransportKr;

  const descriptor = buildKisOhlcRequestDescriptor(request);
  const endpointVerified = descriptor.verification === 'verified-official-docs';

  const gate = evaluateKisOwnerLocalGate({
    mode: context.mode,
    allowNetwork: context.allowNetwork,
    allowKisLive: context.allowKisLive,
  });
  if (!gate.allowed) {
    return blockedResult(request, descriptor.endpointKey, endpointVerified, `Owner-local gate blocked: ${gate.reason}.`);
  }

  if (!endpointVerified) {
    return blockedResult(
      request,
      descriptor.endpointKey,
      false,
      `Endpoint ${descriptor.endpointKey} is not verified against official KIS docs; live smoke blocked.`,
    );
  }

  if (request.market !== 'KR') {
    return blockedResult(
      request,
      descriptor.endpointKey,
      true,
      'Only the verified KR domestic daily OHLC smoke is supported in Phase 3ES.',
    );
  }

  const missingEnv = REQUIRED_KR_ENV_NAMES.filter((name) => !hasEnvValue(name));
  if (missingEnv.length > 0) {
    return blockedResult(
      request,
      descriptor.endpointKey,
      true,
      `Required KIS credential env names are not present in this session (${missingEnv.length} missing); live smoke blocked.`,
    );
  }

  const transport = await transportKr(descriptor.symbol, descriptor.query);
  const seriesMeta = {
    market: 'KR' as const,
    assetType: request.assetType ?? 'stock',
    currency: 'KRW',
    period: request.period,
  };

  if (!transport.ok || !transport.points || transport.points.length === 0) {
    const fallback = buildKisOhlcFallbackSeries(descriptor.symbol, seriesMeta, transport.message);
    return {
      status: 'FAIL',
      symbol: descriptor.symbol,
      market: 'KR',
      assetType: seriesMeta.assetType,
      period: request.period,
      endpointKey: descriptor.endpointKey,
      endpointVerified: true,
      httpStatusClass: transport.httpStatusClass,
      normalizedSeriesSafe: isSeriesSafe(fallback),
      pointCount: 0,
      renderable: false,
      fieldPresence: emptyFieldPresence(),
      source: fallback.source,
      freshness: fallback.freshness,
      isLive: fallback.isLive,
      providerStatus: fallback.providerStatus,
      rawResponsePrinted: false,
      secretsPrinted: false,
      message: transport.message,
    };
  }

  const series = mapSanitizedKisOhlcToSeries(descriptor.symbol, transport.points, {
    ...seriesMeta,
    isLive: true,
  });

  const renderable = isRenderableOhlcSeries(series);
  const fieldPresence = computeFieldPresence(series);
  const pointCount = series.points.length;
  const qualityOk =
    pointCount >= 2 && renderable && fieldPresence.open && fieldPresence.high && fieldPresence.low && fieldPresence.close;

  return {
    status: qualityOk ? 'PASS' : 'FAIL',
    symbol: descriptor.symbol,
    market: 'KR',
    assetType: seriesMeta.assetType,
    period: request.period,
    endpointKey: descriptor.endpointKey,
    endpointVerified: true,
    httpStatusClass: transport.httpStatusClass,
    normalizedSeriesSafe: isSeriesSafe(series),
    pointCount,
    renderable,
    fieldPresence,
    source: series.source,
    freshness: series.freshness,
    isLive: series.isLive,
    providerStatus: series.providerStatus,
    rawResponsePrinted: false,
    secretsPrinted: false,
    message: qualityOk
      ? 'Owner-local KIS OHLC smoke completed.'
      : 'Owner-local KIS OHLC smoke completed with insufficient renderable data.',
  };
};
