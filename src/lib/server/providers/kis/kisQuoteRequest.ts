/**
 * KIS quote request descriptor.
 *
 * Builds a structural descriptor for a KIS quote request from a generic `QuoteProviderRequest`.
 * It deliberately does NOT contain raw endpoint URLs. Instead it uses an `endpointKey` that a
 * future owner-local smoke (Phase 3EO) will resolve against verified official KIS documentation.
 *
 * Transaction IDs (`tr_id`) and market-division codes MUST be verified against official KIS docs
 * in Phase 3EO before any live smoke. Until then they are explicit `VERIFY_WITH_KIS_DOCS_*`
 * placeholders so no unverified endpoint detail is ever treated as confirmed.
 */

import type { QuoteProviderRequest } from '../../market-data/quoteProvider';

export type KisQuoteEndpointKey =
  | 'KR_STOCK_QUOTE'
  | 'KR_ETF_QUOTE'
  | 'US_STOCK_QUOTE'
  | 'US_ETF_QUOTE';

export type KisQuoteRequestDescriptor = {
  symbol: string;
  market: 'KR' | 'US';
  assetType: 'stock' | 'etf' | 'etn' | 'index' | 'unknown';
  exchange: string;
  /** Structural market-division descriptor; must be verified against KIS docs in Phase 3EO. */
  kisMarketCode: string;
  /** Placeholder transaction id; must be verified against KIS docs in Phase 3EO. */
  kisTransactionId: string;
  /** Symbolic endpoint key (never a raw URL); resolved in Phase 3EO. */
  endpointKey: KisQuoteEndpointKey;
};

const isEtfLike = (assetType: QuoteProviderRequest['assetType']): boolean =>
  assetType === 'etf' || assetType === 'etn';

const resolveEndpointKey = (request: QuoteProviderRequest): KisQuoteEndpointKey => {
  if (request.market === 'KR') {
    return isEtfLike(request.assetType) ? 'KR_ETF_QUOTE' : 'KR_STOCK_QUOTE';
  }
  return isEtfLike(request.assetType) ? 'US_ETF_QUOTE' : 'US_STOCK_QUOTE';
};

// Placeholder transaction ids. These are intentionally NOT real KIS tr_id values; Phase 3EO
// must replace them with values verified against official KIS documentation.
const TRANSACTION_ID_PLACEHOLDERS: Record<KisQuoteEndpointKey, string> = {
  KR_STOCK_QUOTE: 'VERIFY_WITH_KIS_DOCS_KR_STOCK_QUOTE',
  KR_ETF_QUOTE: 'VERIFY_WITH_KIS_DOCS_KR_ETF_QUOTE',
  US_STOCK_QUOTE: 'VERIFY_WITH_KIS_DOCS_US_STOCK_QUOTE',
  US_ETF_QUOTE: 'VERIFY_WITH_KIS_DOCS_US_ETF_QUOTE',
};

// Structural market-division placeholders. Must be verified in Phase 3EO.
const MARKET_CODE_PLACEHOLDERS: Record<KisQuoteEndpointKey, string> = {
  KR_STOCK_QUOTE: 'VERIFY_KR_MARKET_DIV',
  KR_ETF_QUOTE: 'VERIFY_KR_MARKET_DIV',
  US_STOCK_QUOTE: 'VERIFY_US_MARKET_DIV',
  US_ETF_QUOTE: 'VERIFY_US_MARKET_DIV',
};

export const buildKisQuoteRequestDescriptor = (
  request: QuoteProviderRequest,
): KisQuoteRequestDescriptor => {
  const endpointKey = resolveEndpointKey(request);
  return {
    symbol: request.symbol,
    market: request.market,
    assetType: request.assetType ?? 'unknown',
    exchange: request.exchange ?? (request.market === 'KR' ? 'KRX' : 'US'),
    kisMarketCode: MARKET_CODE_PLACEHOLDERS[endpointKey],
    kisTransactionId: TRANSACTION_ID_PLACEHOLDERS[endpointKey],
    endpointKey,
  };
};

export const KIS_QUOTE_ENDPOINT_KEYS: KisQuoteEndpointKey[] = [
  'KR_STOCK_QUOTE',
  'KR_ETF_QUOTE',
  'US_STOCK_QUOTE',
  'US_ETF_QUOTE',
];
