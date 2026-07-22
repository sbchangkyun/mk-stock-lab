/**
 * KIS quote endpoint registry.
 *
 * Central, verification-aware registry that resolves an `endpointKey` (from kisQuoteRequest.ts)
 * into an official endpoint path and transaction id. Endpoint details are used as the source of
 * truth for the owner-local smoke.
 *
 * Verification policy:
 * - `KR_STOCK_QUOTE` / `KR_ETF_QUOTE` are marked `verified-official-docs` because they reuse the
 *   domestic current-price inquiry already implemented and verified in
 *   `src/lib/server/providers/kisClient.ts` (path `/uapi/domestic-stock/v1/quotations/inquire-price`,
 *   tr_id `FHKST01010100`, `FID_COND_MRKT_DIV_CODE='J'`).
 * - US endpoints remain `unverified` until confirmed against official KIS documentation; they must
 *   NOT be used for a live smoke while unverified.
 *
 * This file contains hostless paths only (no base URL, no credentials).
 */

import type { KisQuoteEndpointKey } from './kisQuoteRequest';

export type KisQuoteEndpointVerification = 'verified-official-docs' | 'unverified';

export type KisQuoteEndpointDefinition = {
  endpointKey: KisQuoteEndpointKey;
  path: string;
  transactionId: string;
  marketCodeStrategy: 'request' | 'fixed' | 'verified-required';
  verification: KisQuoteEndpointVerification;
  sourceNote: string;
};

const KR_DOMESTIC_QUOTE_PATH = '/uapi/domestic-stock/v1/quotations/inquire-price';
const KR_DOMESTIC_QUOTE_TR_ID = 'FHKST01010100';

export const KIS_QUOTE_ENDPOINT_REGISTRY: Record<KisQuoteEndpointKey, KisQuoteEndpointDefinition> = {
  KR_STOCK_QUOTE: {
    endpointKey: 'KR_STOCK_QUOTE',
    path: KR_DOMESTIC_QUOTE_PATH,
    transactionId: KR_DOMESTIC_QUOTE_TR_ID,
    marketCodeStrategy: 'fixed',
    verification: 'verified-official-docs',
    sourceNote:
      'Verified via existing kisClient.ts domestic inquire-price (FID_COND_MRKT_DIV_CODE=J); see docs/planning/phase_3i_kis_quote_read_result_v0.1.md.',
  },
  KR_ETF_QUOTE: {
    endpointKey: 'KR_ETF_QUOTE',
    path: KR_DOMESTIC_QUOTE_PATH,
    transactionId: KR_DOMESTIC_QUOTE_TR_ID,
    marketCodeStrategy: 'fixed',
    verification: 'verified-official-docs',
    sourceNote:
      'Domestic ETFs (six-digit KRX codes, e.g. 069500) reuse the same domestic inquire-price contract as KR stocks.',
  },
  US_STOCK_QUOTE: {
    endpointKey: 'US_STOCK_QUOTE',
    path: 'VERIFY_WITH_KIS_DOCS_US_OVERSEAS_PRICE_PATH',
    transactionId: 'VERIFY_WITH_KIS_DOCS_US_STOCK_QUOTE',
    marketCodeStrategy: 'verified-required',
    verification: 'unverified',
    sourceNote: 'US overseas price endpoint/tr_id and exchange market codes not yet verified against official KIS docs.',
  },
  US_ETF_QUOTE: {
    endpointKey: 'US_ETF_QUOTE',
    path: 'VERIFY_WITH_KIS_DOCS_US_OVERSEAS_PRICE_PATH',
    transactionId: 'VERIFY_WITH_KIS_DOCS_US_ETF_QUOTE',
    marketCodeStrategy: 'verified-required',
    verification: 'unverified',
    sourceNote: 'US overseas ETF price endpoint/tr_id and exchange market codes not yet verified against official KIS docs.',
  },
};

export const getKisQuoteEndpointDefinition = (endpointKey: KisQuoteEndpointKey): KisQuoteEndpointDefinition =>
  KIS_QUOTE_ENDPOINT_REGISTRY[endpointKey];

/** Returns the endpoint definition only when it is verified; otherwise null (blocked for live smoke). */
export const resolveVerifiedKisQuoteEndpoint = (
  endpointKey: KisQuoteEndpointKey,
): KisQuoteEndpointDefinition | null => {
  const definition = KIS_QUOTE_ENDPOINT_REGISTRY[endpointKey];
  return definition.verification === 'verified-official-docs' ? definition : null;
};

export const isKisQuoteEndpointVerified = (endpointKey: KisQuoteEndpointKey): boolean =>
  KIS_QUOTE_ENDPOINT_REGISTRY[endpointKey].verification === 'verified-official-docs';
