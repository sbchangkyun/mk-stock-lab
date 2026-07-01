/**
 * KIS owner-local quote smoke client.
 *
 * Executes exactly one owner-local quote request, and only when the owner-local gate is open and
 * the target endpoint is verified. It never contains a network `fetch` call itself: the actual
 * transport is delegated to the approved `kisClient` adapter (the single provider file permitted
 * to perform network I/O). Transport and env-presence are injectable so this module can be tested
 * statically with no network and no secrets.
 *
 * Client-safety guarantees:
 * - it validates the PRESENCE of required env names only; it never reads, returns, or logs values;
 * - it never returns or persists a raw provider response — only a sanitized result with
 *   field-presence booleans and coarse status metadata;
 * - it returns no price values.
 */

import { assertServerRuntime } from '../serverOnly';
import { evaluateKisOwnerLocalGate } from './kisOwnerLocalGate';
import { buildKisQuoteRequestDescriptor } from './kisQuoteRequest';
import { resolveVerifiedKisQuoteEndpoint } from './kisQuoteEndpointRegistry';
import {
  buildKisQuoteFallbackSnapshot,
  mapSanitizedKisQuoteToSnapshot,
  type SanitizedKisQuoteLike,
} from './kisQuoteMapper';
import { getKisDomesticQuoteSnapshot } from '../kisClient';
import type { QuoteProviderContext, QuoteProviderRequest } from '../../market-data/quoteProvider';
import type { NormalizedQuoteSnapshot } from '../../../market-data/normalizedQuote';

export type KisSmokeHttpStatusClass = '2xx' | '4xx' | '5xx' | 'network-error' | 'not-run';

export type KisOwnerLocalQuoteSmokeResult = {
  status: 'PASS' | 'FAIL' | 'BLOCKED';
  symbol: string;
  market: 'KR' | 'US';
  endpointKey: string;
  endpointVerified: boolean;
  httpStatusClass: KisSmokeHttpStatusClass;
  normalizedSnapshotSafe: boolean;
  normalizedFieldsPresent: {
    lastPrice: boolean;
    previousClose: boolean;
    change: boolean;
    changeRate: boolean;
    volume: boolean;
  };
  providerStatus: string;
  source: string;
  freshness: string;
  isLive: boolean;
  message: string;
};

export type KisSmokeTransportResult = {
  ok: boolean;
  httpStatusClass: KisSmokeHttpStatusClass;
  quote?: SanitizedKisQuoteLike;
  message: string;
};

export type KisSmokeDeps = {
  /** Presence-only env check; must never return the value. Defaults to a process env presence probe. */
  hasEnvValue?: (name: string) => boolean;
  /** KR transport. Defaults to the approved kisClient domestic quote adapter. */
  transportKr?: (symbol: string) => Promise<KisSmokeTransportResult>;
};

const REQUIRED_KR_ENV_NAMES = ['KIS_APP_KEY', 'KIS_APP_SECRET', 'KIS_BASE_URL'];

const FORBIDDEN_IN_SNAPSHOT =
  /access_token|authorization|bearer|appkey|appsecret|app_key|app_secret|grant_type|password|jwt|supabase\.co|account_no|rt_cd|stck_prpr/i;

const defaultHasEnvValue = (name: string): boolean => {
  const raw = process.env[name];
  return typeof raw === 'string' && raw.trim().length > 0;
};

// Default KR transport wraps the approved kisClient adapter and converts its result into a
// sanitized quote-like shape. The raw provider response never leaves kisClient.
const defaultTransportKr = async (symbol: string): Promise<KisSmokeTransportResult> => {
  const result = await getKisDomesticQuoteSnapshot({ market: 'KR', symbol });
  if (!result.ok) {
    const code = result.code;
    const httpStatusClass: KisSmokeHttpStatusClass =
      code === 'PROVIDER_RATE_LIMITED' ? '4xx'
        : code === 'PROVIDER_UNAVAILABLE' ? '5xx'
          : code === 'CONFIG_MISSING' ? 'not-run'
            : 'network-error';
    return { ok: false, httpStatusClass, message: `Transport error: ${code}` };
  }
  const data = result.data;
  const quote: SanitizedKisQuoteLike = {
    symbol: data.symbol,
    lastPrice: data.price,
    previousClose:
      typeof data.price === 'number' && typeof data.change === 'number' ? data.price - data.change : null,
    change: data.change,
    changeRate: data.changePct,
    volume: data.volume ?? null,
    asOf: data.asOf,
  };
  return { ok: true, httpStatusClass: '2xx', quote, message: 'ok' };
};

const emptyFieldsPresent = () => ({
  lastPrice: false,
  previousClose: false,
  change: false,
  changeRate: false,
  volume: false,
});

const blockedResult = (
  request: QuoteProviderRequest,
  endpointKey: string,
  endpointVerified: boolean,
  message: string,
): KisOwnerLocalQuoteSmokeResult => ({
  status: 'BLOCKED',
  symbol: request.symbol,
  market: request.market,
  endpointKey,
  endpointVerified,
  httpStatusClass: 'not-run',
  normalizedSnapshotSafe: true,
  normalizedFieldsPresent: emptyFieldsPresent(),
  providerStatus: 'blocked',
  source: 'unavailable',
  freshness: 'unavailable',
  isLive: false,
  message,
});

const isSnapshotSafe = (snapshot: NormalizedQuoteSnapshot): boolean =>
  !FORBIDDEN_IN_SNAPSHOT.test(JSON.stringify(snapshot));

/**
 * Runs the owner-local KIS quote smoke for a single symbol. Returns a sanitized result only.
 */
export const runOwnerLocalKisQuoteSmoke = async (
  request: QuoteProviderRequest,
  context: QuoteProviderContext,
  deps: KisSmokeDeps = {},
): Promise<KisOwnerLocalQuoteSmokeResult> => {
  assertServerRuntime('kisOwnerLocalQuoteClient');

  const hasEnvValue = deps.hasEnvValue ?? defaultHasEnvValue;
  const transportKr = deps.transportKr ?? defaultTransportKr;

  const descriptor = buildKisQuoteRequestDescriptor(request);

  const gate = evaluateKisOwnerLocalGate({
    mode: context.mode,
    allowNetwork: context.allowNetwork,
    allowKisLive: context.allowKisLive,
  });
  if (!gate.allowed) {
    return blockedResult(request, descriptor.endpointKey, false, `Owner-local gate blocked: ${gate.reason}.`);
  }

  const endpoint = resolveVerifiedKisQuoteEndpoint(descriptor.endpointKey);
  if (!endpoint) {
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
      'Only the verified KR domestic quote smoke is supported in Phase 3EO.',
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

  const transport = await transportKr(request.symbol);
  if (!transport.ok || !transport.quote) {
    const fallback = buildKisQuoteFallbackSnapshot(
      request.symbol,
      {
        market: 'KR',
        exchange: request.exchange ?? 'KRX',
        assetType: request.assetType ?? 'stock',
        currency: 'KRW',
      },
      transport.message,
    );
    return {
      status: 'FAIL',
      symbol: request.symbol,
      market: 'KR',
      endpointKey: descriptor.endpointKey,
      endpointVerified: true,
      httpStatusClass: transport.httpStatusClass,
      normalizedSnapshotSafe: isSnapshotSafe(fallback),
      normalizedFieldsPresent: emptyFieldsPresent(),
      providerStatus: fallback.providerStatus,
      source: fallback.source,
      freshness: fallback.freshness,
      isLive: fallback.isLive,
      message: transport.message,
    };
  }

  const snapshot = mapSanitizedKisQuoteToSnapshot(transport.quote, {
    market: 'KR',
    exchange: request.exchange ?? 'KRX',
    assetType: request.assetType ?? 'stock',
    currency: 'KRW',
    isLive: true,
  });

  return {
    status: 'PASS',
    symbol: request.symbol,
    market: 'KR',
    endpointKey: descriptor.endpointKey,
    endpointVerified: true,
    httpStatusClass: transport.httpStatusClass,
    normalizedSnapshotSafe: isSnapshotSafe(snapshot),
    normalizedFieldsPresent: {
      lastPrice: snapshot.lastPrice !== null,
      previousClose: snapshot.previousClose !== null,
      change: snapshot.change !== null,
      changeRate: snapshot.changeRate !== null,
      volume: snapshot.volume !== null,
    },
    providerStatus: snapshot.providerStatus,
    source: snapshot.source,
    freshness: snapshot.freshness,
    isLive: snapshot.isLive,
    message: 'Owner-local KIS quote smoke completed.',
  };
};
